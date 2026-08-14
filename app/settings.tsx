import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { useGame } from "../context/GameContext";
import { useHaptics } from "../hooks/useHaptics";
import { theme } from "../theme/theme";

const DURATIONS = [30, 60, 90];
const SENSITIVITY_STEPS = [
  { value: 0.2, label: "Gentle" },
  { value: 0.5, label: "Normal" },
  { value: 0.8, label: "Quick" },
];

export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings, resetHighScores } = useGame();
  const haptics = useHaptics();
  const [resetDone, setResetDone] = useState(false);

  const confirmReset = () => {
    if (Platform.OS === "web") {
      resetHighScores();
      setResetDone(true);
      return;
    }
    Alert.alert("Reset High Scores", "This wipes all saved scores. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetHighScores();
          setResetDone(true);
        },
      },
    ]);
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            Settings
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        {/* Toggles */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="volume-high" size={20} color={theme.colors.textSecondary} />
              <PoppinsText weight="medium">Sound effects</PoppinsText>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(v) => updateSettings({ soundEnabled: v })}
              trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceRaised }}
              thumbColor={theme.colors.textPrimary}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="phone-portrait" size={20} color={theme.colors.textSecondary} />
              <PoppinsText weight="medium">Haptic feedback</PoppinsText>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
              trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceRaised }}
              thumbColor={theme.colors.textPrimary}
            />
          </View>
        </View>

        {/* Default round length */}
        <PoppinsText weight="semibold" style={styles.sectionLabel}>
          Default round length
        </PoppinsText>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              accessibilityRole="button"
              onPress={() => {
                haptics.tap();
                updateSettings({ roundDuration: d });
              }}
              style={[styles.chip, settings.roundDuration === d && styles.chipActive]}
            >
              <PoppinsText
                weight="bold"
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

        {/* Tilt sensitivity */}
        <PoppinsText weight="semibold" style={styles.sectionLabel}>
          Tilt sensitivity
        </PoppinsText>
        <PoppinsText
          weight="regular"
          size={theme.fontSize.sm}
          color={theme.colors.textMuted}
          style={styles.sectionHint}
        >
          How far you tilt the phone before it counts.
        </PoppinsText>
        <View style={styles.chipRow}>
          {SENSITIVITY_STEPS.map(({ value, label }) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={() => {
                haptics.tap();
                updateSettings({ tiltSensitivity: value });
              }}
              style={[styles.chip, settings.tiltSensitivity === value && styles.chipActive]}
            >
              <PoppinsText
                weight="bold"
                color={
                  settings.tiltSensitivity === value
                    ? theme.colors.textPrimary
                    : theme.colors.textMuted
                }
              >
                {label}
              </PoppinsText>
            </Pressable>
          ))}
        </View>

        {/* Danger zone */}
        <View style={styles.resetSection}>
          <CosmicButton
            label={resetDone ? "High Scores Cleared" : "Reset High Scores"}
            icon="trash"
            variant="danger"
            disabled={resetDone}
            onPress={confirmReset}
          />
        </View>

        {/* About */}
        <View style={styles.about}>
          <PoppinsText weight="semibold" color={theme.colors.textSecondary}>
            Cosmos Fun
          </PoppinsText>
          <PoppinsText size={theme.fontSize.sm} color={theme.colors.textMuted}>
            Version {Constants.expoConfig?.version ?? "1.0.0"}
          </PoppinsText>
          <PoppinsText size={theme.fontSize.sm} color={theme.colors.textMuted} align="center">
            Made with 🚀 for game nights everywhere.{"\n"}
            Poppins by Indian Type Foundry (OFL).
          </PoppinsText>
        </View>
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
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm + 2,
  },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  sectionLabel: { marginTop: theme.spacing.sm },
  sectionHint: { marginTop: -theme.spacing.sm },
  chipRow: { flexDirection: "row", gap: theme.spacing.sm },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  resetSection: { marginTop: theme.spacing.md },
  about: {
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});
