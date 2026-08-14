import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { getDeckById, getWordsFor, MIX_ALL_ID } from "../data/decks";
import { useGame } from "../context/GameContext";
import { useHaptics } from "../hooks/useHaptics";
import { useSound } from "../hooks/useSound";
import { theme } from "../theme/theme";

const DURATIONS = [30, 60, 90];

export default function PreGame() {
  const router = useRouter();
  const { selectedDeckId, difficulty, settings, updateSettings } = useGame();
  const haptics = useHaptics();
  const { play } = useSound();

  const deck = selectedDeckId === MIX_ALL_ID ? null : getDeckById(selectedDeckId);
  const deckName = deck?.name ?? "Mix All";
  const accent = deck?.accentColor ?? theme.colors.accent;
  const wordCount = getWordsFor(selectedDeckId, difficulty).length;

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownScale = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    haptics.tap();
    setCountdown(3);
    play("countdown");
    let n = 3;
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Get Ready
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {/* Selected deck summary */}
        <View style={[styles.deckSummary, { borderColor: `${accent}66` }]}>
          <Ionicons
            name={(deck?.icon ?? "planet") as keyof typeof Ionicons.glyphMap}
            size={30}
            color={accent}
          />
          <View style={styles.deckSummaryText}>
            <PoppinsText weight="bold" size={theme.fontSize.lg}>
              {deckName}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.sm} color={theme.colors.textMuted}>
              {wordCount} words · {difficulty === "all" ? "all difficulties" : difficulty}
            </PoppinsText>
          </View>
        </View>

        {/* Round duration */}
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
                  settings.roundDuration === d
                    ? theme.colors.textPrimary
                    : theme.colors.textMuted
                }
              >
                {d}s
              </PoppinsText>
            </Pressable>
          ))}
        </View>

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

        <View style={styles.spacer} />

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
        </View>

        <CosmicButton label="Start!" icon="play" size="lg" color={accent} onPress={startCountdown} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  deckSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  deckSummaryText: { flex: 1 },
  sectionLabel: { marginBottom: theme.spacing.sm },
  durationRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
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
    paddingVertical: theme.spacing.sm,
  },
  toggleLabel: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  spacer: { flex: 1 },
  instructions: {
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  countdownContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
});
