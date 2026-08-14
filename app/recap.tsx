import React, { useEffect, useMemo } from "react";
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
import { useSound } from "../hooks/useSound";
import { getDeckById } from "../data/decks";
import { theme } from "../theme/theme";

export default function Recap() {
  const router = useRouter();
  const { lastRound, highScores } = useGame();
  const { play } = useSound();

  const isNewBest = useMemo(() => {
    if (!lastRound || lastRound.score === 0) return false;
    const top = highScores[lastRound.deckId]?.[0];
    return top != null && lastRound.score >= top.score;
  }, [lastRound, highScores]);

  const shouldCheer = lastRound != null && (lastRound.perfect || isNewBest);
  useEffect(() => {
    if (shouldCheer) {
      // Slight delay so the cheer lands as the confetti starts raining.
      const t = setTimeout(() => play("cheer"), 250);
      return () => clearTimeout(t);
    }
  }, [shouldCheer, play]);

  // Safety: recap reached without a round (deep link) — send home.
  if (!lastRound) {
    return (
      <ScreenBackground>
        <View style={styles.empty}>
          <Mascot mood="shrug" size={120} />
          <PoppinsText weight="semibold" size={theme.fontSize.lg} align="center">
            No round to show yet!
          </PoppinsText>
          <CosmicButton label="Home" icon="home" onPress={() => router.replace("/home")} />
        </View>
      </ScreenBackground>
    );
  }

  const celebrate = lastRound.perfect || isNewBest;
  const accent = getDeckById(lastRound.deckId)?.accentColor ?? theme.colors.accent;
  const skipped = lastRound.results.filter((r) => !r.correct);
  const gotIt = lastRound.results.filter((r) => r.correct);

  const mood = celebrate ? "cheer" : lastRound.score > 0 ? "happy" : "dizzy";

  const shareScore = () => {
    Share.share({
      message: `I scored ${lastRound.score} on the "${lastRound.deckName}" deck in Cosmos Fun! 🚀 Best streak: ${lastRound.bestStreak}. Can you beat that?`,
    }).catch(() => {});
  };

  return (
    <ScreenBackground>
      {celebrate && <ConfettiBurst />}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <Mascot mood={mood} size={110} />
          <PoppinsText weight="black" size={theme.fontSize.xxl}>
            {lastRound.perfect
              ? "Perfect Round!"
              : isNewBest
                ? "New High Score!"
                : "Time's Up!"}
          </PoppinsText>
          <PoppinsText weight="medium" color={theme.colors.textSecondary}>
            {lastRound.deckName} · {lastRound.duration}s
          </PoppinsText>
        </Animated.View>

        {/* Score summary */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: `${accent}66` }]}>
            <PoppinsText weight="black" size={theme.fontSize.huge} color={accent}>
              {lastRound.score}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
              CORRECT
            </PoppinsText>
          </View>
          <View style={styles.statCard}>
            <PoppinsText weight="black" size={theme.fontSize.huge} color={theme.colors.skip}>
              {skipped.length}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
              SKIPPED
            </PoppinsText>
          </View>
          <View style={styles.statCard}>
            <PoppinsText weight="black" size={theme.fontSize.huge} color={theme.colors.textPrimary}>
              {lastRound.bestStreak}
            </PoppinsText>
            <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
              BEST STREAK
            </PoppinsText>
          </View>
        </Animated.View>

        {/* Word-by-word tally */}
        <View style={styles.tally}>
          {lastRound.results.map((r, i) => (
            <Animated.View
              key={`${r.term}-${i}`}
              entering={FadeInUp.delay(250 + i * 60).duration(300)}
              style={styles.tallyRow}
            >
              <Ionicons
                name={r.correct ? "checkmark-circle" : "close-circle"}
                size={20}
                color={r.correct ? theme.colors.correct : theme.colors.danger}
              />
              <PoppinsText
                weight="medium"
                color={r.correct ? theme.colors.textPrimary : theme.colors.textMuted}
              >
                {r.term}
              </PoppinsText>
            </Animated.View>
          ))}
          {lastRound.results.length === 0 && (
            <PoppinsText weight="medium" color={theme.colors.textMuted} align="center">
              No words played — was the phone on your forehead the whole time? 😄
            </PoppinsText>
          )}
        </View>

        {/* Actions */}
        <View style={styles.buttons}>
          <CosmicButton
            label="Play Again"
            icon="refresh"
            size="lg"
            color={accent}
            onPress={() => router.replace("/pregame")}
          />
          <CosmicButton
            label="Change Deck"
            icon="albums"
            variant="secondary"
            onPress={() => router.replace("/decks")}
          />
          <CosmicButton
            label="Share Score"
            icon="share-social"
            variant="secondary"
            onPress={shareScore}
          />
          <CosmicButton
            label="Home"
            icon="home"
            variant="secondary"
            onPress={() => router.replace("/home")}
          />
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
    padding: theme.spacing.lg,
  },
  hero: { alignItems: "center", gap: theme.spacing.xs },
  statsRow: { flexDirection: "row", gap: theme.spacing.md },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  tally: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  tallyRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  buttons: { gap: theme.spacing.sm },
});
