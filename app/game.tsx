import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { TimerRing } from "../components/TimerRing";
import { TiltIndicator } from "../components/TiltIndicator";
import { getDeckById, getWordsFor, MIX_ALL_ID, shuffle } from "../data/decks";
import { useGame, WordResult } from "../context/GameContext";
import { useTiltDetection } from "../hooks/useTiltDetection";
import { useHaptics } from "../hooks/useHaptics";
import { useSound } from "../hooks/useSound";
import { theme } from "../theme/theme";

const STREAK_LABELS: Array<{ at: number; label: string }> = [
  { at: 8, label: "Legendary! 🌟" },
  { at: 5, label: "Unstoppable! ⚡" },
  { at: 3, label: "On fire! 🔥" },
];

export default function Game() {
  const router = useRouter();
  const { selectedDeckId, difficulty, settings, finishRound } = useGame();
  const haptics = useHaptics();
  const { play } = useSound();

  const deck = selectedDeckId === MIX_ALL_ID ? null : getDeckById(selectedDeckId);
  const deckName = deck?.name ?? "Mix All";
  const accent = deck?.accentColor ?? theme.colors.accent;

  // Shuffled word queue, prepared once per round.
  const words = useMemo(
    () => shuffle(getWordsFor(selectedDeckId, difficulty)),
    [selectedDeckId, difficulty]
  );

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(settings.roundDuration);
  const [streak, setStreak] = useState(0);
  const [streakLabel, setStreakLabel] = useState<string | null>(null);

  const resultsRef = useRef<WordResult[]>([]);
  const bestStreakRef = useRef(0);
  const endedRef = useRef(false);

  // ----- word advance -----

  const currentWord = words.length > 0 ? words[index % words.length] : null;

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

  const handleAction = useCallback(
    (correct: boolean) => {
      if (endedRef.current || !currentWord) return;

      resultsRef.current.push({ term: currentWord.term, correct });

      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          bestStreakRef.current = Math.max(bestStreakRef.current, next);
          const milestone = STREAK_LABELS.find((sl) => sl.at === next);
          if (milestone) setStreakLabel(milestone.label);
          return next;
        });
        triggerFlash("correct");
        haptics.correct();
        play("correct");
      } else {
        setStreak(0);
        setStreakLabel(null);
        triggerFlash("skip");
        haptics.skip();
        play("skip");
      }
      setIndex((i) => i + 1);
    },
    [currentWord, triggerFlash, haptics, play]
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
      endedRef.current = true;
      haptics.timeout();
      play("timeout");
      const results = resultsRef.current;
      const correctCount = results.filter((r) => r.correct).length;
      finishRound({
        deckId: selectedDeckId,
        deckName,
        results,
        score: correctCount,
        bestStreak: bestStreakRef.current,
        duration: settings.roundDuration,
        perfect: results.length > 0 && results.every((r) => r.correct),
      });
      router.replace("/recap");
    } else if (secondsLeft <= 5) {
      play("countdown");
      haptics.warning();
    }
  }, [
    secondsLeft,
    deckName,
    selectedDeckId,
    settings.roundDuration,
    finishRound,
    haptics,
    play,
    router,
  ]);

  // Clear streak label after a moment.
  useEffect(() => {
    if (!streakLabel) return;
    const t = setTimeout(() => setStreakLabel(null), 1400);
    return () => clearTimeout(t);
  }, [streakLabel]);

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

  return (
    // Star field off during play — max readability.
    <ScreenBackground stars={false}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, flashStyle]} />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <PoppinsText weight="semibold" size={theme.fontSize.sm} color={accent}>
              {deckName}
            </PoppinsText>
            <TiltIndicator tiltState={tiltState} active={tiltActive} />
          </View>
          <TimerRing secondsLeft={secondsLeft} totalSeconds={settings.roundDuration} />
          <View style={styles.scoreBox}>
            <PoppinsText weight="black" size={theme.fontSize.xxl} color={theme.colors.correct}>
              {score}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
              score
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

        {/* Streak banner */}
        <View style={styles.streakSlot}>
          {streakLabel && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(250)}>
              <PoppinsText weight="extrabold" size={theme.fontSize.xl} color={theme.colors.skip}>
                {streakLabel}
              </PoppinsText>
            </Animated.View>
          )}
        </View>

        {/* The word */}
        <View style={styles.wordArea}>
          <PoppinsText
            key={index} // remount per word so font auto-scaling resets
            weight="black"
            size={theme.fontSize.giant}
            align="center"
            adjustsFontSizeToFit
            numberOfLines={3}
            style={styles.word}
          >
            {currentWord?.term ?? "No words!"}
          </PoppinsText>
        </View>

        {/* Manual fallback controls — always available by design */}
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip word"
            onPress={() => handleAction(false)}
            style={[styles.controlButton, styles.skipButton]}
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
            style={[styles.controlButton, styles.correctButton]}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLeft: { gap: 6, alignItems: "flex-start", width: 110 },
  scoreBox: { alignItems: "center", width: 110 },
  streakSlot: { height: 44, alignItems: "center", justifyContent: "center" },
  wordArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  word: { paddingHorizontal: theme.spacing.sm },
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
    paddingVertical: 18,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  skipButton: {
    borderColor: theme.colors.skip,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  correctButton: {
    borderColor: theme.colors.correct,
    backgroundColor: "rgba(34,197,94,0.12)",
  },
});
