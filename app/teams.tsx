import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { MAX_TEAMS, TEAM_PRESETS, useGame } from "../context/GameContext";
import { useHaptics } from "../hooks/useHaptics";
import { theme } from "../theme/theme";

const ROUNDS_OPTIONS = [1, 2, 3];

export default function TeamsSetup() {
  const router = useRouter();
  const { startTeamMatch } = useGame();
  const haptics = useHaptics();

  const [teamCount, setTeamCount] = useState(2);
  const [rounds, setRounds] = useState(1);

  const begin = () => {
    haptics.tap();
    startTeamMatch(teamCount, rounds);
    router.push("/decks");
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Team Battle
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.mascot}>
          <Mascot mood="cheer" size={100} />
          <PoppinsText
            weight="medium"
            size={theme.fontSize.sm}
            color={theme.colors.textSecondary}
            align="center"
          >
            Teams take turns with the phone.{"\n"}Highest total score wins the galaxy!
          </PoppinsText>
        </View>

        {/* Team count */}
        <PoppinsText weight="semibold" style={styles.sectionLabel}>
          How many teams?
        </PoppinsText>
        <View style={styles.countRow}>
          {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => {
                haptics.tap();
                setTeamCount(n);
              }}
              style={[styles.countChip, teamCount === n && styles.countChipActive]}
            >
              <PoppinsText
                weight="bold"
                size={theme.fontSize.lg}
                color={teamCount === n ? theme.colors.textPrimary : theme.colors.textMuted}
              >
                {n}
              </PoppinsText>
            </Pressable>
          ))}
        </View>

        {/* Team preview */}
        <View style={styles.teamList}>
          {TEAM_PRESETS.slice(0, teamCount).map((t, i) => (
            <Animated.View
              key={t.name}
              entering={FadeInUp.delay(i * 60).duration(250)}
              layout={LinearTransition.springify()}
              style={[styles.teamRow, { borderColor: `${t.color}88` }]}
            >
              <View style={[styles.teamDot, { backgroundColor: t.color }]} />
              <PoppinsText weight="semibold" size={theme.fontSize.md}>
                Team {t.name}
              </PoppinsText>
            </Animated.View>
          ))}
        </View>

        {/* Rounds per team */}
        <PoppinsText weight="semibold" style={styles.sectionLabel}>
          Rounds per team
        </PoppinsText>
        <View style={styles.countRow}>
          {ROUNDS_OPTIONS.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => {
                haptics.tap();
                setRounds(n);
              }}
              style={[styles.countChip, styles.roundChip, rounds === n && styles.countChipActive]}
            >
              <PoppinsText
                weight="bold"
                color={rounds === n ? theme.colors.textPrimary : theme.colors.textMuted}
              >
                {n} {n === 1 ? "round" : "rounds"}
              </PoppinsText>
            </Pressable>
          ))}
        </View>

        <PoppinsText
          weight="medium"
          size={theme.fontSize.xs}
          color={theme.colors.textMuted}
          align="center"
          style={styles.hint}
        >
          {teamCount} teams × {rounds} {rounds === 1 ? "round" : "rounds"} ={" "}
          {teamCount * rounds} rounds total
        </PoppinsText>

        <CosmicButton label="Choose Deck" icon="arrow-forward" size="lg" onPress={begin} />
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
  mascot: { alignItems: "center", gap: theme.spacing.sm },
  sectionLabel: { marginTop: theme.spacing.sm },
  countRow: { flexDirection: "row", gap: theme.spacing.sm },
  countChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  roundChip: { paddingVertical: 14 },
  countChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  teamList: { gap: theme.spacing.sm },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  teamDot: { width: 16, height: 16, borderRadius: 8 },
  hint: { marginTop: -theme.spacing.xs },
});
