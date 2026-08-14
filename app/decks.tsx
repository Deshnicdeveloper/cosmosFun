import React, { useEffect, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { DeckCard } from "../components/DeckCard";
import { decks, Difficulty, MIX_ALL_ID, getWordsFor, shuffle } from "../data/decks";
import { useGame } from "../context/GameContext";
import { useHaptics } from "../hooks/useHaptics";
import { theme } from "../theme/theme";

const DIFFICULTIES: Array<{ key: Difficulty | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export default function DeckSelect() {
  const router = useRouter();
  const { selectedDeckId, setSelectedDeckId, difficulty, setDifficulty } = useGame();
  const haptics = useHaptics();

  // Deck display order — shuffled by the shake easter egg.
  const [order, setOrder] = useState(() => decks.map((d) => d.id));

  // Shake-to-shuffle easter egg: a strong shake reshuffles the grid with a
  // springy layout animation.
  const lastShakeRef = useRef(0);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let sub: { remove: () => void } | undefined;
    (async () => {
      try {
        if (!(await Accelerometer.isAvailableAsync())) return;
        Accelerometer.setUpdateInterval(120);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (magnitude > 2.4 && now - lastShakeRef.current > 1200) {
            lastShakeRef.current = now;
            setOrder((prev) => shuffle(prev));
          }
        });
      } catch {
        // No accelerometer — easter egg silently unavailable.
      }
    })();
    return () => sub?.remove();
  }, []);

  const orderedDecks = order
    .map((id) => decks.find((d) => d.id === id))
    .filter((d): d is (typeof decks)[number] => d != null);

  const selectedWordCount = getWordsFor(selectedDeckId, difficulty).length;
  const canPlay = selectedWordCount >= 5;

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Pick a Deck
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {/* Difficulty filter */}
        <View style={styles.filterRow}>
          {DIFFICULTIES.map(({ key, label }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => {
                haptics.tap();
                setDifficulty(key);
              }}
              style={[styles.filterChip, difficulty === key && styles.filterChipActive]}
            >
              <PoppinsText
                weight={difficulty === key ? "semibold" : "medium"}
                size={theme.fontSize.sm}
                color={difficulty === key ? theme.colors.textPrimary : theme.colors.textMuted}
              >
                {label}
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
          Psst — shake your phone to shuffle the decks ✨
        </PoppinsText>

        <FlatList
          data={orderedDecks}
          keyExtractor={(d) => d.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View layout={LinearTransition.springify()} style={styles.mixAll}>
              <DeckCard
                name="Mix All"
                icon="planet"
                accentColor={theme.colors.accent}
                wordCount={getWordsFor(MIX_ALL_ID, difficulty).length}
                selected={selectedDeckId === MIX_ALL_ID}
                onPress={() => {
                  haptics.tap();
                  setSelectedDeckId(MIX_ALL_ID);
                }}
              />
            </Animated.View>
          }
          renderItem={({ item }) => (
            <Animated.View
              entering={FadeIn}
              layout={LinearTransition.springify()}
              style={styles.cell}
            >
              <DeckCard
                name={item.name}
                icon={item.icon}
                accentColor={item.accentColor}
                wordCount={
                  difficulty === "all"
                    ? item.words.length
                    : item.words.filter((w) => w.difficulty === difficulty).length
                }
                selected={selectedDeckId === item.id}
                onPress={() => {
                  haptics.tap();
                  setSelectedDeckId(item.id);
                }}
              />
            </Animated.View>
          )}
        />

        <View style={styles.footer}>
          {!canPlay && (
            <PoppinsText
              weight="medium"
              size={theme.fontSize.sm}
              color={theme.colors.skip}
              align="center"
            >
              Not enough words at this difficulty — try another filter.
            </PoppinsText>
          )}
          <CosmicButton
            label="Continue"
            icon="arrow-forward"
            size="lg"
            disabled={!canPlay}
            onPress={() => router.push("/pregame")}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  hint: { marginBottom: theme.spacing.sm },
  grid: { paddingBottom: theme.spacing.md, gap: theme.spacing.md },
  column: { gap: theme.spacing.md },
  mixAll: { marginBottom: theme.spacing.md },
  cell: { flex: 1 },
  footer: { gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
});
