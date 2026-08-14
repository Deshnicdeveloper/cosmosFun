import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { useGame } from "../context/GameContext";
import { theme } from "../theme/theme";

function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function Stats() {
  const router = useRouter();
  const { stats } = useGame();

  const tiles: Array<{ icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string }> = [
    { icon: "game-controller", color: "#38BDF8", value: String(stats.gamesPlayed), label: "rounds played" },
    { icon: "checkmark-circle", color: "#4ADE80", value: String(stats.wordsGuessed), label: "words guessed" },
    { icon: "play-skip-forward", color: "#FB923C", value: String(stats.wordsSkipped), label: "words skipped" },
    { icon: "flame", color: "#F87171", value: String(stats.bestStreakEver), label: "best streak ever" },
    { icon: "star", color: "#FACC15", value: String(stats.goldenWordsFound), label: "golden words" },
    { icon: "flash", color: "#F472B6", value: String(stats.buzzerBeaters), label: "buzzer beaters" },
    { icon: "trophy", color: "#A78BFA", value: String(stats.perfectRounds), label: "perfect rounds" },
    { icon: "time", color: "#22D3EE", value: formatPlayTime(stats.secondsPlayed), label: "time played" },
  ];

  const hasPlayed = stats.gamesPlayed > 0;

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Your Stats
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {!hasPlayed ? (
          <View style={styles.empty}>
            <Mascot mood="shrug" size={130} />
            <PoppinsText weight="semibold" size={theme.fontSize.lg} align="center">
              No stats yet!
            </PoppinsText>
            <PoppinsText size={theme.fontSize.sm} color={theme.colors.textMuted} align="center">
              Play some rounds and your cosmic career will show up here.
            </PoppinsText>
            <CosmicButton label="Play Now" icon="rocket" onPress={() => router.push("/decks")} />
          </View>
        ) : (
          <View style={styles.grid}>
            {tiles.map((t, i) => (
              <Animated.View
                key={t.label}
                entering={FadeInUp.delay(i * 70).duration(300)}
                style={[styles.tile, { borderColor: `${t.color}55` }]}
              >
                <Ionicons name={t.icon} size={22} color={t.color} />
                <PoppinsText weight="black" size={theme.fontSize.xl} color={t.color}>
                  {t.value}
                </PoppinsText>
                <PoppinsText
                  weight="medium"
                  size={theme.fontSize.xs}
                  color={theme.colors.textMuted}
                  align="center"
                >
                  {t.label}
                </PoppinsText>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empty: {
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  tile: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
});
