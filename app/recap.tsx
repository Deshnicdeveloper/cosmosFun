import React, { useEffect, useMemo, useRef } from "react";
import { Platform, ScrollView, Share, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { ConfettiBurst } from "../components/ConfettiBurst";
import { Mascot } from "../components/Mascot";
import { useGame } from "../context/GameContext";
import { useSound } from "../hooks/useSound";
import { theme } from "../theme/theme";

export default function Recap() {
  const router = useRouter();
  const {
    lastRound,
    highScores,
    gameMode,
    teams,
    matchFinished,
    currentTeamIndex,
    resolveDeckMeta,
  } = useGame();
  const { play } = useSound();
  const cardRef = useRef<ViewShot>(null);

  const isNewBest = useMemo(() => {
    if (!lastRound || lastRound.score === 0 || lastRound.teamIndex != null) return false;
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
  const accent = resolveDeckMeta(lastRound.deckId).accentColor;
  const skipped = lastRound.results.filter((r) => !r.correct);
  const isTeamRound = lastRound.teamIndex != null && gameMode === "teams";
  const playedTeam = isTeamRound ? teams[lastRound.teamIndex!] : null;
  const nextTeam = isTeamRound && !matchFinished ? teams[currentTeamIndex] : null;

  const mood = celebrate ? "cheer" : lastRound.score > 0 ? "happy" : "dizzy";

  const title = lastRound.perfect
    ? "Perfect Round!"
    : lastRound.cleared
      ? "Deck Cleared!"
      : isNewBest
        ? "New High Score!"
        : "Time's Up!";

  const shareScore = async () => {
    // Try to share the score card as an image; fall back to text.
    try {
      if (Platform.OS !== "web" && cardRef.current?.capture) {
        const uri = await cardRef.current.capture();
        if (uri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(uri, { mimeType: "image/png" });
          return;
        }
      }
    } catch {
      // fall through to text share
    }
    Share.share({
      message: `I scored ${lastRound.score} points on "${lastRound.deckName}" in Cosmos Fun! 🚀 Best streak: ${lastRound.bestStreak}. Can you beat that?`,
    }).catch(() => {});
  };

  const badges: Array<{ icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = [];
  if (lastRound.buzzerBeater) badges.push({ icon: "flash", color: "#F472B6", label: "Buzzer Beater!" });
  if (lastRound.goldenCount > 0)
    badges.push({ icon: "star", color: "#FACC15", label: `${lastRound.goldenCount} golden ${lastRound.goldenCount === 1 ? "word" : "words"}` });
  if (lastRound.eventName) badges.push({ icon: "planet", color: "#7DD3FC", label: lastRound.eventName });

  const handleNextTeam = () => {
    router.replace("/pregame");
  };

  return (
    <ScreenBackground>
      {celebrate && <ConfettiBurst />}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Shareable score card (captured by view-shot) */}
        <ViewShot ref={cardRef} options={{ format: "png", quality: 1 }} style={styles.card}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <Mascot mood={mood} size={100} />
            {playedTeam && (
              <View style={[styles.teamBanner, { borderColor: playedTeam.color }]}>
                <View style={[styles.teamDot, { backgroundColor: playedTeam.color }]} />
                <PoppinsText weight="bold" color={playedTeam.color}>
                  Team {playedTeam.name}
                </PoppinsText>
              </View>
            )}
            <PoppinsText weight="black" size={theme.fontSize.xxl}>
              {title}
            </PoppinsText>
            <PoppinsText weight="medium" color={theme.colors.textSecondary}>
              {lastRound.deckName} · {lastRound.duration}s
            </PoppinsText>
            {badges.length > 0 && (
              <View style={styles.badgeRow}>
                {badges.map((b) => (
                  <View key={b.label} style={[styles.badge, { borderColor: `${b.color}66` }]}>
                    <Ionicons name={b.icon} size={13} color={b.color} />
                    <PoppinsText weight="semibold" size={theme.fontSize.xs} color={b.color}>
                      {b.label}
                    </PoppinsText>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Score summary */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: `${accent}66` }]}>
              <PoppinsText weight="black" size={theme.fontSize.huge} color={accent}>
                {lastRound.score}
              </PoppinsText>
              <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
                POINTS
              </PoppinsText>
            </View>
            <View style={styles.statCard}>
              <PoppinsText weight="black" size={theme.fontSize.huge} color={theme.colors.skip}>
                {skipped.length}
              </PoppinsText>
              <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
                SKIPS
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
          <PoppinsText
            weight="semibold"
            size={theme.fontSize.xs}
            color={theme.colors.textMuted}
            align="center"
          >
            🚀 Cosmos Fun
          </PoppinsText>
        </ViewShot>

        {/* Team standings so far */}
        {isTeamRound && (
          <View style={styles.standings}>
            <PoppinsText weight="semibold" size={theme.fontSize.sm} color={theme.colors.textSecondary}>
              Standings
            </PoppinsText>
            {[...teams]
              .map((t, i) => ({ ...t, i }))
              .sort((a, b) => b.score - a.score)
              .map((t) => (
                <View key={t.name} style={styles.standingRow}>
                  <View style={[styles.teamDot, { backgroundColor: t.color }]} />
                  <PoppinsText weight="medium" style={styles.standingName}>
                    Team {t.name}
                  </PoppinsText>
                  <PoppinsText weight="bold" color={t.color}>
                    {t.score}
                  </PoppinsText>
                </View>
              ))}
          </View>
        )}

        {/* Word-by-word tally */}
        <View style={styles.tally}>
          {lastRound.results.map((r, i) => (
            <Animated.View
              key={`${r.term}-${i}`}
              entering={FadeInUp.delay(250 + i * 50).duration(300)}
              style={styles.tallyRow}
            >
              <Ionicons
                name={r.correct ? "checkmark-circle" : "close-circle"}
                size={20}
                color={r.correct ? theme.colors.correct : theme.colors.danger}
              />
              <PoppinsText
                weight="medium"
                color={
                  r.golden && r.correct
                    ? "#FACC15"
                    : r.correct
                      ? theme.colors.textPrimary
                      : theme.colors.textMuted
                }
                style={styles.tallyTerm}
              >
                {r.term}
                {r.golden && r.correct ? " ✨" : ""}
              </PoppinsText>
              {r.correct && (r.points ?? 0) > 1 && (
                <PoppinsText weight="bold" size={theme.fontSize.sm} color="#FACC15">
                  +{r.points}
                </PoppinsText>
              )}
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
          {isTeamRound && matchFinished && (
            <CosmicButton
              label="Final Results!"
              icon="trophy"
              size="lg"
              color="#FACC15"
              onPress={() => router.replace("/team-victory")}
            />
          )}
          {isTeamRound && !matchFinished && nextTeam && (
            <CosmicButton
              label={`Hand phone to Team ${nextTeam.name}`}
              icon="swap-horizontal"
              size="lg"
              color={nextTeam.color}
              onPress={handleNextTeam}
            />
          )}
          {!isTeamRound && (
            <CosmicButton
              label="Play Again"
              icon="refresh"
              size="lg"
              color={accent}
              onPress={() => router.replace("/pregame")}
            />
          )}
          {!isTeamRound && (
            <CosmicButton
              label="Change Deck"
              icon="albums"
              variant="secondary"
              onPress={() => router.replace("/decks")}
            />
          )}
          <CosmicButton label="Share Score" icon="share-social" variant="secondary" onPress={shareScore} />
          {!isTeamRound && (
            <CosmicButton label="Home" icon="home" variant="secondary" onPress={() => router.replace("/home")} />
          )}
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
  card: {
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.bgDeep,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  hero: { alignItems: "center", gap: theme.spacing.xs },
  teamBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
  },
  teamDot: { width: 12, height: 12, borderRadius: 6 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
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
  standings: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  standingRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  standingName: { flex: 1 },
  tally: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  tallyRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  tallyTerm: { flex: 1 },
  buttons: { gap: theme.spacing.sm },
});
