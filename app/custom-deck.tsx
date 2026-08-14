import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { useGame } from "../context/GameContext";
import { useHaptics } from "../hooks/useHaptics";
import { Deck, Difficulty, Word } from "../data/decks";
import { fonts, theme } from "../theme/theme";

const COLOR_CHOICES = ["#38BDF8", "#F87171", "#FACC15", "#4ADE80", "#F472B6", "#FB923C", "#A78BFA", "#22D3EE"];
const ICON_CHOICES = ["sparkles", "heart", "pizza", "musical-notes", "school", "beer", "home", "people"] as const;
const DIFFS: Array<{ key: Difficulty; label: string; color: string }> = [
  { key: "easy", label: "Easy", color: "#4ADE80" },
  { key: "medium", label: "Medium", color: "#FACC15" },
  { key: "hard", label: "Hard", color: "#F87171" },
];

/**
 * Create or edit a custom deck. Custom decks live in AsyncStorage and play
 * exactly like built-in decks (they even join "Mix All").
 */
export default function CustomDeckEditor() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { customDecks, saveCustomDeck, deleteCustomDeck } = useGame();
  const haptics = useHaptics();

  const editing = useMemo(
    () => customDecks.find((d) => d.id === editId) ?? null,
    [customDecks, editId]
  );

  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.accentColor ?? COLOR_CHOICES[0]);
  const [icon, setIcon] = useState<string>(editing?.icon ?? ICON_CHOICES[0]);
  const [words, setWords] = useState<Word[]>(editing?.words ?? []);
  const [draft, setDraft] = useState("");
  const [draftDiff, setDraftDiff] = useState<Difficulty>("medium");

  const addWord = () => {
    const term = draft.trim();
    if (!term) return;
    if (words.some((w) => w.term.toLowerCase() === term.toLowerCase())) {
      setDraft("");
      return;
    }
    haptics.tap();
    setWords((prev) => [...prev, { term, difficulty: draftDiff }]);
    setDraft("");
  };

  const removeWord = (term: string) => {
    setWords((prev) => prev.filter((w) => w.term !== term));
  };

  const canSave = name.trim().length > 0 && words.length >= 5;

  const save = () => {
    const deck: Deck = {
      id: editing?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      icon,
      accentColor: color,
      words,
    };
    saveCustomDeck(deck);
    router.back();
  };

  const remove = () => {
    if (editing) deleteCustomDeck(editing.id);
    router.back();
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
              <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
            </Pressable>
            <PoppinsText weight="bold" size={theme.fontSize.xl}>
              {editing ? "Edit Deck" : "New Deck"}
            </PoppinsText>
            <View style={{ width: 26 }} />
          </View>

          {/* Name */}
          <PoppinsText weight="semibold">Deck name</PoppinsText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Family Inside Jokes"
            placeholderTextColor={theme.colors.textMuted}
            maxLength={28}
            style={styles.input}
          />

          {/* Color + icon */}
          <PoppinsText weight="semibold">Color & icon</PoppinsText>
          <View style={styles.choiceRow}>
            {COLOR_CHOICES.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="button"
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.choiceRow}>
            {ICON_CHOICES.map((ic) => (
              <Pressable
                key={ic}
                accessibilityRole="button"
                onPress={() => setIcon(ic)}
                style={[styles.iconChoice, icon === ic && { borderColor: color, backgroundColor: `${color}26` }]}
              >
                <Ionicons name={ic} size={20} color={icon === ic ? color : theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Word entry */}
          <PoppinsText weight="semibold">
            Words <PoppinsText color={theme.colors.textMuted} size={theme.fontSize.sm}>({words.length} — need at least 5)</PoppinsText>
          </PoppinsText>
          <View style={styles.diffRow}>
            {DIFFS.map((d) => (
              <Pressable
                key={d.key}
                accessibilityRole="button"
                onPress={() => setDraftDiff(d.key)}
                style={[
                  styles.diffChip,
                  draftDiff === d.key && { backgroundColor: `${d.color}33`, borderColor: d.color },
                ]}
              >
                <PoppinsText
                  weight="semibold"
                  size={theme.fontSize.xs}
                  color={draftDiff === d.key ? d.color : theme.colors.textMuted}
                >
                  {d.label}
                </PoppinsText>
              </Pressable>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addWord}
              placeholder="Type a word, press +"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              blurOnSubmit={false}
              maxLength={40}
              style={[styles.input, styles.addInput]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addWord}
              style={[styles.addButton, { backgroundColor: color }]}
            >
              <Ionicons name="add" size={26} color={theme.colors.bgDeep} />
            </Pressable>
          </View>

          {/* Word chips */}
          <View style={styles.wordWrap}>
            {words.map((w) => {
              const diffColor = DIFFS.find((d) => d.key === w.difficulty)?.color ?? theme.colors.textMuted;
              return (
                <Animated.View
                  key={w.term}
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(120)}
                  layout={LinearTransition.springify()}
                  style={[styles.wordChip, { borderColor: `${diffColor}66` }]}
                >
                  <PoppinsText size={theme.fontSize.sm}>{w.term}</PoppinsText>
                  <Pressable onPress={() => removeWord(w.term)} hitSlop={8} accessibilityRole="button">
                    <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                  </Pressable>
                </Animated.View>
              );
            })}
            {words.length === 0 && (
              <PoppinsText size={theme.fontSize.sm} color={theme.colors.textMuted}>
                Inside jokes, local slang, family names — custom decks are always the funniest!
              </PoppinsText>
            )}
          </View>

          <View style={styles.buttons}>
            <CosmicButton
              label={editing ? "Save Changes" : "Create Deck"}
              icon="checkmark"
              size="lg"
              color={color}
              disabled={!canSave}
              onPress={save}
            />
            {editing && (
              <CosmicButton label="Delete Deck" icon="trash" variant="danger" onPress={remove} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  choiceRow: { flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotActive: { borderWidth: 3, borderColor: theme.colors.textPrimary },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  diffRow: { flexDirection: "row", gap: theme.spacing.sm },
  diffChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  addRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "center" },
  addInput: { flex: 1 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  wordWrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  buttons: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
});
