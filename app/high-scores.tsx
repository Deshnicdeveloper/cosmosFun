import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { useGame } from "../context/GameContext";
import { decks, MIX_ALL_ID } from "../data/decks";
import { theme } from "../theme/theme";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function HighScoresScreen() {
  const router = useRouter();
  const { highScores, resolveDeckMeta } = useGame();

  // Daily buckets look like "daily:2026-08-14" — label them with the date.
  const deckLabel = (deckId: string): string => {
    if (deckId.startsWith("daily:")) return `Daily ${deckId.slice("daily:".length)}`;
    return resolveDeckMeta(deckId).name;
  };

  const deckAccent = (deckId: string): string => {
    if (deckId.startsWith("daily:")) return "#FACC15";
    return resolveDeckMeta(deckId).accentColor;
  };

  // Deck tabs: only decks that actually have scores; Mix All first, then
  // built-ins, then customs/dailies (newest daily first).
  const scoredDeckIds = useMemo(() => {
    const ids = Object.keys(highScores).filter((id) => (highScores[id] ?? []).length > 0);
    const order = [MIX_ALL_ID, ...decks.map((d) => d.id)];
    return ids.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b.localeCompare(a); // dailies newest-first
    });
  }, [highScores]);

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const currentDeckId = activeDeckId ?? scoredDeckIds[0] ?? null;
  const entries = currentDeckId ? highScores[currentDeckId] ?? [] : [];

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            High Scores
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {scoredDeckIds.length === 0 ? (
          <View style={styles.empty}>
            <Mascot mood="shrug" size={130} />
            <PoppinsText weight="semibold" size={theme.fontSize.lg} align="center">
              No scores yet!
            </PoppinsText>
            <PoppinsText
              weight="regular"
              size={theme.fontSize.sm}
              color={theme.colors.textMuted}
              align="center"
            >
              Play a round and your top 10 per deck will live here.
            </PoppinsText>
            <CosmicButton label="Play Now" icon="rocket" onPress={() => router.push("/decks")} />
          </View>
        ) : (
          <>
            {/* Deck tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabs}
              contentContainerStyle={styles.tabsContent}
            >
              {scoredDeckIds.map((id) => {
                const active = id === currentDeckId;
                const accent = deckAccent(id);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    onPress={() => setActiveDeckId(id)}
                    style={[
                      styles.tab,
                      active && { backgroundColor: `${accent}33`, borderColor: accent },
                    ]}
                  >
                    <PoppinsText
                      weight={active ? "semibold" : "medium"}
                      size={theme.fontSize.sm}
                      color={active ? theme.colors.textPrimary : theme.colors.textMuted}
                    >
                      {deckLabel(id)}
                    </PoppinsText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Top 10 list */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {entries.map((entry, i) => (
                <Animated.View
                  key={`${entry.date}-${i}`}
                  entering={FadeInUp.delay(i * 60).duration(300)}
                  style={[styles.scoreRow, i === 0 && styles.scoreRowTop]}
                >
                  <PoppinsText weight="bold" size={theme.fontSize.lg} style={styles.rank}>
                    {MEDALS[i] ?? `${i + 1}.`}
                  </PoppinsText>
                  <View style={styles.scoreInfo}>
                    <PoppinsText weight="semibold" size={theme.fontSize.lg}>
                      {entry.score} {entry.score === 1 ? "word" : "words"}
                    </PoppinsText>
                    <PoppinsText size={theme.fontSize.xs} color={theme.colors.textMuted}>
                      {formatDate(entry.date)} · {entry.duration}s round
                    </PoppinsText>
                  </View>
                  {i === 0 && (
                    <Ionicons name="trophy" size={22} color="#FACC15" />
                  )}
                </Animated.View>
              ))}
            </ScrollView>
          </>
        )}
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
    marginBottom: theme.spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  tabs: { flexGrow: 0, marginBottom: theme.spacing.md },
  tabsContent: { gap: theme.spacing.sm },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  list: { gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  scoreRowTop: {
    borderWidth: 1.5,
    borderColor: "#FACC1566",
  },
  rank: { width: 40 },
  scoreInfo: { flex: 1 },
});
