import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { theme } from "../theme/theme";

const STEPS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  text: string;
}> = [
  {
    icon: "albums",
    color: "#38BDF8",
    title: "Pick a deck",
    text: "Choose a category — or Mix All for a bit of everything.",
  },
  {
    icon: "phone-portrait",
    color: "#A78BFA",
    title: "Forehead time",
    text: "Hold the phone to your forehead, screen facing your friends. They give you clues!",
  },
  {
    icon: "arrow-down-circle",
    color: "#22C55E",
    title: "Tilt down = Got it",
    text: "Guessed the word? Tilt the phone down for a point. Tilt up to skip a tough one.",
  },
  {
    icon: "trophy",
    color: "#FACC15",
    title: "Beat the clock",
    text: "Rack up points before the timer hits zero. Chase streaks for extra glory!",
  },
];

export default function HowToPlay() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <PoppinsText weight="bold" size={theme.fontSize.xl}>
            How to Play
          </PoppinsText>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.mascot}>
          <Mascot mood="happy" size={110} />
        </View>

        {STEPS.map((step, i) => (
          <Animated.View
            key={step.title}
            entering={FadeInUp.delay(i * 120).duration(400)}
            style={styles.step}
          >
            <View style={[styles.stepIcon, { backgroundColor: `${step.color}26` }]}>
              <Ionicons name={step.icon} size={26} color={step.color} />
            </View>
            <View style={styles.stepText}>
              <PoppinsText weight="bold" size={theme.fontSize.lg}>
                {i + 1}. {step.title}
              </PoppinsText>
              <PoppinsText
                weight="regular"
                size={theme.fontSize.sm}
                color={theme.colors.textSecondary}
              >
                {step.text}
              </PoppinsText>
            </View>
          </Animated.View>
        ))}

        <PoppinsText
          weight="medium"
          size={theme.fontSize.sm}
          color={theme.colors.textMuted}
          align="center"
          style={styles.tip}
        >
          Tip: no tilt? No problem — big Skip / Got It buttons are always on screen.
        </PoppinsText>

        <CosmicButton label="Let's Go!" icon="rocket" size="lg" onPress={() => router.push("/decks")} />
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
  mascot: { alignItems: "center" },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1, gap: 2 },
  tip: { marginTop: theme.spacing.sm },
});
