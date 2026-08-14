import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PoppinsText } from "./PoppinsText";
import { theme } from "../theme/theme";

interface CosmicButtonProps {
  label: string;
  onPress: () => void;
  /** Filled accent button vs subtle glass button. */
  variant?: "primary" | "secondary" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: "md" | "lg";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Pill button with springy press-scale, used across all menu screens. */
export function CosmicButton({
  label,
  onPress,
  variant = "primary",
  icon,
  color,
  size = "md",
  disabled = false,
  style,
}: CosmicButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const background =
    variant === "primary"
      ? color ?? theme.colors.accent
      : variant === "danger"
        ? theme.colors.danger
        : theme.colors.surfaceRaised;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={() => (scale.value = withSpring(0.95, { damping: 18 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 14 }))}
        onPress={onPress}
        style={[
          styles.button,
          size === "lg" && styles.buttonLg,
          { backgroundColor: background },
          variant === "secondary" && styles.secondaryBorder,
          disabled && styles.disabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={size === "lg" ? 24 : 19}
            color={theme.colors.textPrimary}
            style={styles.icon}
          />
        )}
        <PoppinsText
          weight={size === "lg" ? "bold" : "semibold"}
          size={size === "lg" ? theme.fontSize.lg : theme.fontSize.md}
        >
          {label}
        </PoppinsText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
  },
  buttonLg: {
    paddingVertical: 18,
    paddingHorizontal: theme.spacing.xl,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  disabled: { opacity: 0.45 },
  icon: { marginRight: theme.spacing.sm },
});
