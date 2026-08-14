import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { TimerRing } from "../components/TimerRing";
import { TiltIndicator } from "../components/TiltIndicator";
import { Mascot } from "../components/Mascot";
import { shuffle } from "../data/decks";
import { DAILY_DECK_ID, DAILY_DURATION, getDailyChallenge } from "../data/daily";
import { DEFAULT_GOLDEN_CHANCE, DEFAULT_GOLDEN_VALUE } from "../data/events";
import { getPlayableWords, useGame, WordResult } from "../context/GameContext";
import { useTiltDetection } from "../hooks/useTiltDetection";
import { useHaptics } from "../hooks/useHaptics";
import { useSound } from "../hooks/useSound";
import { theme } from "../theme/theme";

const STREAK_LABELS: Array<{ at: number; label: string }> = [
  { at: 8, label: "Legendary! 🌟" },
  { at: 5, label: "Unstoppable! ⚡" },
  { at: 3, label: "On fire! 🔥" },
];

const STREAK_TIME_BONUS = 2; // seconds, at every 5-streak
const BUZZER_WINDOW = 3; // correct within final N seconds = buzzer beater

interface Popup {
  text: string;
  color: string;
}

export default function Game() {
  const router = useRouter();
  const {
    selectedDeckId,
    difficulty,
    settings,
    finishRound,
    customDecks,
    resolveDeckMeta,
    gameMode,
    currentTeamIndex,
    teams,
    activeEvent,
  } = useGame();
  const haptics = useHaptics();
  const { play } = useSound();

  const isDaily = selectedDeckId === DAILY_DECK_ID;
  const meta = resolveDeckMeta(selectedDeckId);
  const accent = meta.accentColor;
  const activeTeam = gameMode === "teams" ? teams[currentTeamIndex] : null;

  // ----- word queue & golden words -----
  // Daily: deterministic order + golden picks (same for every player today).
  // Otherwise: shuffled queue, random golden words (~1 in 12, more during
  // a Golden Rush event).
  const { initialWords, goldenTerms } = useMemo(() => {
    if (isDaily) {
      const daily = getDailyChallenge();
      return { initialWords: daily.words, goldenTerms: daily.goldenTerms };
    }
    const words = shuffle(getPlayableWords(selectedDeckId, difficulty, customDecks));
    const chance = activeEvent?.goldenChance ?? DEFAULT_GOLDEN_CHANCE;
    const golden = new Set<string>();
    for (const w of words) {
      if (Math.random() < chance) golden.add(w.term);
    }
    return { initialWords: words, goldenTerms: golden };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goldenValue = activeEvent?.goldenValue ?? DEFAULT_GOLDEN_VALUE;
  const pointsMultiplier = activeEvent?.pointsMultiplier ?? 1;
  const startSeconds = activeEvent?.startSeconds ?? (isDaily ? DAILY_DURATION : settings.roundDuration);
  const freezeMs = activeEvent?.skipFreezeMs ?? (settings.skipFreeze ? 2000 : 0);

  const [queue, setQueue] = useState(initialWords);
  const [turn, setTurn] = useState(0);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(startSeconds);
  const [streak, setStreak] = useState(0);
  const [streakLabel, setStreakLabel] = useState<string | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);

  const resultsRef = useRef<WordResult[]>([]);
  const bestStreakRef = useRef(0);
  const streakRef = useRef(0);
  const endedRef = useRef(false);
  const skippedEverRef = useRef(false);
  const buzzerRef = useRef(false);
  const frozenRef = useRef(false);
  const secondsRef = useRef(startSeconds);
  secondsRef.current = secondsLeft;

  // Gameplay is landscape (like classic Heads Up). Restore portrait on exit.
  useEffect(() => {
    if (Platform.OS === "web") return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // ----- word advance -----

  const currentWord = queue.length > 0 ? queue[0] : null;
  const currentIsGolden = currentWord != null && goldenTerms.has(currentWord.term);

  const flashColor = useSharedValue<"none" | "correct" | "skip">("none");
  const flashOpacity = useSharedValue(0);

  const triggerFlash = useCallback(
    (kind: "correct" | "skip") => {
      flashColor.value = kind;
      flashOpacity.value = withSequence(
        withTiming(0.55, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) })
      );
    },
    [flashColor, flashOpacity]
  );

  const showPopup = useCallback((text: string, color: string) => {
    setPopup({ text, color });
  }, []);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 1300);
    return () => clearTimeout(t);
  }, [popup]);

  /**
   * Ends the round exactly once, from either path:
   * - timedOut: the clock hit zero with words remaining
   * - !timedOut: the player cleared the entire deck early
   */
  const endRound = useCallback(
    (timedOut: boolean) => {
      if (endedRef.current) return;
      endedRef.current = true;
      if (timedOut) {
        haptics.timeout();
        play("timeout");
      }
      const results = resultsRef.current;
      finishRound({
        deckId: selectedDeckId,
        deckName: meta.name,
        results,
        score: results.reduce((sum, r) => sum + (r.points ?? 0), 0),
        bestStreak: bestStreakRef.current,
        duration: startSeconds,
        perfect: results.length > 0 && !skippedEverRef.current && !timedOut,
        cleared: !timedOut,
        buzzerBeater: buzzerRef.current,
        goldenCount: results.filter((r) => r.correct && r.golden).length,
        eventName: activeEvent ? `${activeEvent.emoji} ${activeEvent.name}` : null,
        teamIndex: gameMode === "teams" ? currentTeamIndex : undefined,
      });
      router.replace("/recap");
    },
    [
      meta.name,
      selectedDeckId,
      startSeconds,
      finishRound,
      haptics,
      play,
      router,
      activeEvent,
      gameMode,
      currentTeamIndex,
    ]
  );

  const handleAction = useCallback(
    (correct: boolean) => {
      if (endedRef.current || frozenRef.current || !currentWord) return;

      const golden = goldenTerms.has(currentWord.term);
      let nextQueue: typeof queue;

      if (correct) {
        const points = golden ? goldenValue : 1 * pointsMultiplier;
        resultsRef.current.push({ term: currentWord.term, correct, golden, points });
        nextQueue = queue.slice(1); // word retired

        if (secondsRef.current <= BUZZER_WINDOW) buzzerRef.current = true;

        setScore((s) => s + points);
        setConsecutiveSkips(0);

        streakRef.current += 1;
        bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current);
        setStreak(streakRef.current);
        const milestone = STREAK_LABELS.find((sl) => sl.at === streakRef.current);
        if (milestone) setStreakLabel(milestone.label);

        // Streak time bonus: +2s at every 5-streak.
        if (streakRef.current > 0 && streakRef.current % 5 === 0) {
          setSecondsLeft((s) => s + STREAK_TIME_BONUS);
          showPopup(`+${STREAK_TIME_BONUS}s streak bonus ⏱`, theme.colors.correct);
          play("bonus");
        } else if (activeEvent?.correctBonusSeconds) {
          // Meteor Shower: every correct extends the clock.
          setSecondsLeft((s) => s + activeEvent.correctBonusSeconds!);
          showPopup(`+${activeEvent.correctBonusSeconds}s ☄️`, theme.colors.correct);
        }

        if (golden) {
          showPopup(`✨ GOLDEN +${points}!`, "#FACC15");
          play("golden");
        } else {
          play("correct");
        }
        triggerFlash("correct");
        haptics.correct();
      } else {
        resultsRef.current.push({ term: currentWord.term, correct, golden, points: 0 });
        skippedEverRef.current = true;
        nextQueue = [...queue.slice(1), currentWord]; // back of the queue

        streakRef.current = 0;
        setStreak(0);
        setStreakLabel(null);
        setConsecutiveSkips((n) => n + 1);
        triggerFlash("skip");
        haptics.skip();

        if (freezeMs > 0) {
          frozenRef.current = true;
          setFrozen(true);
          play("freeze");
          setTimeout(() => {
            frozenRef.current = false;
            setFrozen(false);
          }, freezeMs);
        } else {
          play("skip");
        }
      }

      setQueue(nextQueue);
      setTurn((t) => t + 1);

      if (nextQueue.length === 0) {
        // Every word guessed — stop now, don't wait for the clock.
        endRound(false);
      }
    },
    [
      currentWord,
      queue,
      goldenTerms,
      goldenValue,
      pointsMultiplier,
      freezeMs,
      activeEvent,
      triggerFlash,
      haptics,
      play,
      showPopup,
      endRound,
    ]
  );

  // ----- tilt detection (manual buttons always remain available) -----

  const { tiltState, permission, requestPermission } = useTiltDetection({
    sensitivity: settings.tiltSensitivity,
    enabled: !endedRef.current,
    onTilt: (dir) => handleAction(dir === "down"),
  });

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // ----- round timer -----

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (endedRef.current) return;
    if (secondsLeft <= 0) {
      endRound(true);
    } else if (secondsLeft <= 5) {
      play("countdown");
      haptics.warning();
    }
  }, [secondsLeft, endRound, haptics, play]);

  // Clear streak label after a moment.
  useEffect(() => {
    if (!streakLabel) return;
    const t = setTimeout(() => setStreakLabel(null), 1400);
    return () => clearTimeout(t);
  }, [streakLabel]);

  // ----- last-5-seconds red vignette pulse -----

  const isCritical = secondsLeft <= 5 && secondsLeft > 0;
  const vignette = useSharedValue(0);
  useEffect(() => {
    if (isCritical) {
      vignette.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 380, easing: Easing.out(Easing.quad) }),
          withTiming(0.25, { duration: 380, easing: Easing.in(Easing.quad) })
        ),
        -1
      );
    } else {
      vignette.value = withTiming(0, { duration: 200 });
    }
  }, [isCritical, vignette]);
  const vignetteStyle = useAnimatedStyle(() => ({ opacity: vignette.value }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor:
      flashColor.value === "correct"
        ? theme.colors.correct
        : flashColor.value === "skip"
          ? theme.colors.skip
          : "transparent",
  }));

  const tiltActive = permission === "granted";

  // Mascot commentary: cheers on hot streaks, dizzy after 3 skips in a row.
  const mascotMood = streak >= 5 ? "cheer" : consecutiveSkips >= 3 ? "dizzy" : null;

  return (
    // Star field off during play — max readability.
    <ScreenBackground stars={false}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, flashStyle]} />
      <Animated.View pointerEvents="none" style={[styles.vignette, vignetteStyle]} />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <PoppinsText weight="semibold" size={theme.fontSize.sm} color={accent} numberOfLines={1}>
              {activeTeam ? `Team ${activeTeam.name}` : meta.name}
            </PoppinsText>
            {activeEvent ? (
              <View style={styles.eventChip}>
                <PoppinsText size={theme.fontSize.xs}>{activeEvent.emoji}</PoppinsText>
                <PoppinsText weight="semibold" size={theme.fontSize.xs} color="#FACC15">
                  {activeEvent.name}
                </PoppinsText>
              </View>
            ) : (
              <TiltIndicator tiltState={tiltState} active={tiltActive} />
            )}
          </View>
          <TimerRing secondsLeft={secondsLeft} totalSeconds={startSeconds} size={64} />
          <View style={styles.scoreBox}>
            <PoppinsText weight="black" size={theme.fontSize.xl} color={theme.colors.correct}>
              {score}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
              points
            </PoppinsText>
          </View>
        </View>

        {permission === "denied" && (
          <PoppinsText
            weight="medium"
            size={theme.fontSize.xs}
            color={theme.colors.textMuted}
            align="center"
          >
            Motion access is off — no problem! Use the buttons below.
          </PoppinsText>
        )}

        {/* Streak banner + popups */}
        <View style={styles.streakSlot}>
          {streakLabel && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(250)}>
              <PoppinsText weight="extrabold" size={theme.fontSize.xl} color={theme.colors.skip}>
                {streakLabel}
              </PoppinsText>
            </Animated.View>
          )}
          {!streakLabel && popup && (
            <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)}>
              <PoppinsText weight="extrabold" size={theme.fontSize.lg} color={popup.color}>
                {popup.text}
              </PoppinsText>
            </Animated.View>
          )}
        </View>

        {/* The word */}
        <View style={styles.wordArea}>
          {currentIsGolden && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.goldenBadge}>
              <Ionicons name="star" size={14} color="#0B0E2E" />
              <PoppinsText weight="bold" size={theme.fontSize.xs} color="#0B0E2E">
                GOLDEN WORD — {goldenValue} PTS
              </PoppinsText>
            </Animated.View>
          )}
          <PoppinsText
            key={turn} // remount per word so font auto-scaling resets
            weight="black"
            size={110}
            align="center"
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.3}
            color={currentIsGolden ? "#FACC15" : theme.colors.textPrimary}
            style={styles.word}
          >
            {currentWord?.term ?? "No words!"}
          </PoppinsText>
          {frozen && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(200)}
              style={styles.frozenOverlay}
            >
              <PoppinsText size={theme.fontSize.huge}>🧊</PoppinsText>
              <PoppinsText weight="bold" size={theme.fontSize.lg} color="#7DD3FC">
                Frozen!
              </PoppinsText>
            </Animated.View>
          )}
        </View>

        {/* Mascot commentary */}
        {mascotMood && (
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(250)}
            style={styles.mascotCorner}
            pointerEvents="none"
          >
            <Mascot mood={mascotMood} size={64} />
          </Animated.View>
        )}

        {/* Manual fallback controls — always available by design */}
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip word"
            onPress={() => handleAction(false)}
            style={[styles.controlButton, styles.skipButton, frozen && styles.controlDisabled]}
          >
            <Ionicons name="close" size={30} color={theme.colors.skip} />
            <PoppinsText weight="bold" color={theme.colors.skip}>
              Skip
            </PoppinsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Got it"
            onPress={() => handleAction(true)}
            style={[styles.controlButton, styles.correctButton, frozen && styles.controlDisabled]}
          >
            <Ionicons name="checkmark" size={30} color={theme.colors.correct} />
            <PoppinsText weight="bold" color={theme.colors.correct}>
              Got It
            </PoppinsText>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: theme.colors.danger,
    borderRadius: 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLeft: { gap: 6, alignItems: "flex-start", width: 130 },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "#FACC1566",
    backgroundColor: "rgba(250,204,21,0.10)",
  },
  scoreBox: { alignItems: "center", width: 130 },
  streakSlot: { height: 34, alignItems: "center", justifyContent: "center" },
  wordArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  word: { paddingHorizontal: theme.spacing.sm },
  goldenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: "#FACC15",
    marginBottom: theme.spacing.xs,
  },
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,33,104,0.72)",
    borderRadius: theme.radius.lg,
  },
  mascotCorner: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 92,
  },
  controls: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  controlDisabled: { opacity: 0.35 },
  skipButton: {
    borderColor: theme.colors.skip,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  correctButton: {
    borderColor: theme.colors.correct,
    backgroundColor: "rgba(34,197,94,0.12)",
  },
});
