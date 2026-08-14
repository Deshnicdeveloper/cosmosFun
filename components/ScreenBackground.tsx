import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StarField } from "./StarField";
import { theme } from "../theme/theme";

interface ScreenBackgroundProps {
  children: React.ReactNode;
  /** Star field on by default for menu screens; off for the game screen. */
  stars?: boolean;
}

/** Deep-space gradient wrapper used by every screen. */
export function ScreenBackground({ children, stars = true }: ScreenBackgroundProps) {
  return (
    <LinearGradient
      colors={theme.colors.bgGradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      {stars && <StarField />}
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
});
