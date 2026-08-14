import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { getPlayableWords, useGame } from "../context/GameContext";
import { rollCosmicEvent, CosmicEvent } from "../data/events";
import { DAILY_DECK_ID, DAILY_DURATION, todayKey } from "../data/daily";
import { useHaptics } from "../hooks/useHaptics";
import { useSound } from "../hooks/useSound";
import { theme } from "../theme/theme";

const DURATIONS = [30, 60, 90];

export default function PreGame() {
  const router = useRouter();
  const {
    selectedDeckId,
    difficulty,
    settings,
    updateSettings,
    customDecks,
    resolveDeckMeta,
    gameMode,
    teams,
    currentTeamIndex,
    setActiveEvent,
  } = useGame();
  const haptics = useHaptics();
  const { play } = useSound();

  const isDaily = selectedDeckId === DAILY_DECK_ID;
  const meta = resolveDeckMeta(selectedDeckId);
  const accent = meta.accentColor;
  const wordCount = getPlayableWords(selectedDeckId, difficulty, customDecks).length;
  const activeTeam = gameMode === "teams" ? teams[currentTeamIndex] : null;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [rolledEvent, setRolledEvent] = useState<CosmicEvent | null>(null);
  const countdownScale = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    haptics.tap();
    // Roll a Cosmic Event (never for the daily challenge — same rules for all).
    const event = isDaily ? null : rollCosmicEvent();
    setRolledEvent(event);
    setActiveEvent(event);
    // Rotate into landscape now, so the player is already holding the phone
    // sideways when the round begins.
    if (Platform.OS !== "web") {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
    setCountdown(3);
    play("countdown");
    let n = 3;
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        play("go");
        router.replace("/game");
      } else {
        setCountdown(n);
        play("countdown");
        countdownScale.value = withSequence(
          withTiming(1.4, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 280 })
        );
      }
    }, 1000);
  };

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  if (countdown !== null) {
    return (
      <ScreenBackground stars={false}>
        <View style={styles.countdownContainer}>
          {activeTeam && (
            <View style={[styles.teamBanner, { borderColor: activeTeam.color }]}>
              <View style={[styles.teamDot, { backgroundColor: activeTeam.color }]} />
              <PoppinsText weight="bold" color={activeTeam.color}>
                Team {activeTeam.name}
              </PoppinsText>
            </View>
          )}
          {rolledEvent && (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.eventCard}>
              <PoppinsText size={theme.fontSize.xxl}>{rolledEvent.emoji}</PoppinsText>
              <PoppinsText weight="extrabold" size={theme.fontSize.lg} color="#FACC15">
                COSMIC EVENT: {rolledEvent.name}
              </PoppinsText>
              <PoppinsText
                weight="medium"
                size={theme.fontSize.sm}
                color={theme.colors.textSecondary}
                align="center"
              >
                {rolledEvent.description}
              </PoppinsText>
            </Animated.View>
          )}
          <PoppinsText weight="semibold" size={theme.fontSize.lg} color={theme.colors.textSecondary}>
            Hold the phone to your forehead!
          </PoppinsText>
          <Animated.View style={countdownStyle}>
            <PoppinsText weight="black" size={140} color={accent}>
              {countdown}
            </PoppinsText>
          </Animated.View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Get Ready
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {activeTeam && (
          <View style={[styles.teamBanner, { borderColor: activeTeam.color }]}>
            <View style={[styles.teamDot, { backgroundColor: activeTeam.color }]} />
            <PoppinsText weight="bold" color={activeTeam.color}>
              Team {activeTeam.name} — you're up!
            </PoppinsText>
          </View>
        )}

        {/* Selected deck summary */}
        <View style={[styles.deckSummary, { borderColor: `${accent}66` }]}>
          <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={30} color={accent} />
          <View style={styles.deckSummaryText}>
            <PoppinsText weight="bold" size={theme.fontSize.lg}>
              {meta.name}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.sm} color={theme.colors.textMuted}>
              {isDaily
                ? `${todayKey()} · same words for everyone today!`
                : `${wordCount} words · ${difficulty === "all" ? "all difficulties" : difficulty}`}
            </PoppinsText>
          </View>
        </View>

        {/* Round duration (fixed for daily) */}
        {!isDaily && (
          <>
            <PoppinsText weight="semibold" size={theme.fontSize.md} style={styles.sectionLabel}>
              Round length
            </PoppinsText>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  onPress={() => {
                    haptics.tap();
                    updateSettings({ roundDuration: d });
                  }}
                  style={[
                    styles.durationChip,
                    settings.roundDuration === d && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <PoppinsText
                    weight="bold"
                    size={theme.fontSize.lg}
                    color={
                      settings.roundDuration === d ? theme.colors.textPrimary : theme.colors.textMuted
                    }
                  >
                    {d}s
                  </PoppinsText>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {isDaily && (
          <PoppinsText weight="medium" size={theme.fontSize.sm} color={theme.colors.textMuted}>
            ⏱ Fixed {DAILY_DURATION}s round · no cosmic events · one leaderboard per day
          </PoppinsText>
        )}

        {/* Quick toggles */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="volume-high" size={20} color={theme.colors.textSecondary} />
            <PoppinsText weight="medium">Sound</PoppinsText>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ true: accent, false: theme.colors.surfaceRaised }}
            thumbColor={theme.colors.textPrimary}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="phone-portrait" size={20} color={theme.colors.textSecondary} />
            <PoppinsText weight="medium">Haptics</PoppinsText>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
            trackColor={{ true: accent, false: theme.colors.surfaceRaised }}
            thumbColor={theme.colors.textPrimary}
          />
        </View>

        <View style={styles.instructions}>
          <Ionicons name="phone-portrait-outline" size={34} color={theme.colors.textSecondary} />
          <PoppinsText
            weight="medium"
            size={theme.fontSize.md}
            color={theme.colors.textSecondary}
            align="center"
          >
            Hold the phone to your forehead, screen facing your friends.{"\n"}
            Tilt <PoppinsText weight="bold" color={theme.colors.correct}>down</PoppinsText> for
            correct — tilt <PoppinsText weight="bold" color={theme.colors.skip}>up</PoppinsText> to skip.
          </PoppinsText>
          <PoppinsText weight="medium" size={theme.fontSize.xs} color="#FACC15" align="center">
            ✨ Watch for golden words — they're worth triple!
          </PoppinsText>
        </View>

        <CosmicButton label="Start!" icon="play" size="lg" color={accent} onPress={startCountdown} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: theme.spacing.lg, gap: theme.spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  teamDot: { width: 12, height: 12, borderRadius: 6 },
  deckSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  deckSummaryText: { flex: 1 },
  sectionLabel: { marginBottom: -theme.spacing.sm },
  durationRow: { flexDirection: "row", gap: theme.spacing.md },
  durationChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  instructions: {
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: "auto",
    marginBottom: theme.spacing.sm,
  },
  countdownContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  eventCard: {
    alignItems: "center",
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: "#FACC1566",
    backgroundColor: "rgba(250,204,21,0.08)",
    maxWidth: 420,
  },
});
