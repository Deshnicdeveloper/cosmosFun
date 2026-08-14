import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PoppinsText } from "./PoppinsText";
import { theme } from "../theme/theme";
import type { TiltState } from "../hooks/useTiltDetection";

interface TiltIndicatorProps {
  tiltState: TiltState;
  /** Whether tilt control is actually active (permission granted). */
  active: boolean;
}

/**
 * Small status chip showing tilt control state:
 * down arrow (correct) / up arrow (skip) / neutral dot, or "tilt off".
 */
export function TiltIndicator({ tiltState, active }: TiltIndicatorProps) {
  if (!active) {
    return (
      <View style={styles.chip}>
        <Ionicons name="hand-left" size={14} color={theme.colors.textMuted} />
        <PoppinsText weight="medium" size={theme.fontSize.xs} color={theme.colors.textMuted}>
          Tap controls
        </PoppinsText>
      </View>
    );
  }

  const config =
    tiltState === "down"
      ? { icon: "arrow-down-circle" as const, color: theme.colors.correct, label: "Correct!" }
      : tiltState === "up"
        ? { icon: "arrow-up-circle" as const, color: theme.colors.skip, label: "Skip" }
        : { icon: "phone-portrait" as const, color: theme.colors.textSecondary, label: "Tilt ready" };

  return (
    <View style={[styles.chip, { borderColor: `${config.color}66` }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <PoppinsText weight="medium" size={theme.fontSize.xs} color={config.color}>
        {config.label}
      </PoppinsText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
});
