import React, { useMemo } from "react";
import { ScrollView, Share, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { ConfettiBurst } from "../components/ConfettiBurst";
import { Mascot } from "../components/Mascot";
import { useGame } from "../context/GameContext";
import { theme } from "../theme/theme";

export default function TeamVictory() {
  const router = useRouter();
  const { teams, endTeamMatch } = useGame();

  const standings = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score),
    [teams]
  );
  const winner = standings[0];
  const isTie = standings.length > 1 && standings[0]?.score === standings[1]?.score;

  const goHome = () => {
    endTeamMatch();
    router.replace("/home");
  };

  const playAgain = () => {
    endTeamMatch();
    router.replace("/teams");
  };

  const shareResult = () => {
    const lines = standings
      .map((t, i) => `${i + 1}. Team ${t.name} — ${t.score} pts`)
      .join("\n");
    Share.share({
      message: `🚀 Cosmos Fun Team Battle results:\n${lines}\n${
        isTie ? "It's a tie!" : `Team ${winner?.name} takes the galaxy! 🏆`
      }`,
    }).catch(() => {});
  };

  if (!winner) {
    // Deep link without a match — nothing to show.
    return (
      <ScreenBackground>
        <View style={styles.empty}>
          <Mascot mood="shrug" size={120} />
          <CosmicButton label="Home" icon="home" onPress={goHome} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ConfettiBurst />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <Mascot mood="cheer" size={120} />
          <PoppinsText weight="black" size={theme.fontSize.xxl} align="center">
            {isTie ? "It's a Tie!" : `Team ${winner.name} Wins!`}
          </PoppinsText>
          {!isTie && (
            <View style={[styles.winnerBadge, { backgroundColor: `${winner.color}33`, borderColor: winner.color }]}>
              <Ionicons name="trophy" size={18} color={winner.color} />
              <PoppinsText weight="bold" color={winner.color}>
                {winner.score} points
              </PoppinsText>
            </View>
          )}
        </Animated.View>

        {/* Standings */}
        <View style={styles.standings}>
          {standings.map((t, i) => (
            <Animated.View
              key={t.name}
              entering={FadeInUp.delay(200 + i * 100).duration(300)}
              style={[
                styles.teamRow,
                { borderColor: `${t.color}66` },
                i === 0 && !isTie && styles.teamRowWinner,
              ]}
            >
              <PoppinsText weight="bold" size={theme.fontSize.lg} style={styles.rank}>
                {i === 0 ? "🏆" : `${i + 1}.`}
              </PoppinsText>
              <View style={[styles.teamDot, { backgroundColor: t.color }]} />
              <PoppinsText weight="semibold" style={styles.teamName}>
                Team {t.name}
              </PoppinsText>
              <PoppinsText weight="black" size={theme.fontSize.xl} color={t.color}>
                {t.score}
              </PoppinsText>
            </Animated.View>
          ))}
        </View>

        <View style={styles.buttons}>
          <CosmicButton label="Rematch!" icon="refresh" size="lg" onPress={playAgain} />
          <CosmicButton label="Share Results" icon="share-social" variant="secondary" onPress={shareResult} />
          <CosmicButton label="Home" icon="home" variant="secondary" onPress={goHome} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  hero: { alignItems: "center", gap: theme.spacing.sm },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
  },
  standings: { gap: theme.spacing.sm },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  teamRowWinner: { backgroundColor: "rgba(250,204,21,0.10)" },
  rank: { width: 34 },
  teamDot: { width: 14, height: 14, borderRadius: 7 },
  teamName: { flex: 1 },
  buttons: { gap: theme.spacing.sm },
});
