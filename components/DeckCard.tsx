import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PoppinsText } from "./PoppinsText";
import { theme } from "../theme/theme";

interface DeckCardProps {
  name: string;
  icon: string;
  accentColor: string;
  wordCount: number;
  selected: boolean;
  onPress: () => void;
}

/** Category card for the deck-select grid. */
export function DeckCard({
  name,
  icon,
  accentColor,
  wordCount,
  selected,
  onPress,
}: DeckCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPressIn={() => (scale.value = withSpring(0.95, { damping: 18 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 14 }))}
        onPress={onPress}
        style={[
          styles.card,
          { borderColor: selected ? accentColor : theme.colors.surfaceBorder },
          selected && {
            backgroundColor: `${accentColor}26`, // ~15% alpha accent tint
            shadowColor: accentColor,
          },
          selected && styles.cardSelectedShadow,
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: `${accentColor}33` }]}>
          <Ionicons
            // Ionicons name comes from data as a string; cast is safe because
            // deck icons are hand-picked valid glyph names.
            name={icon as keyof typeof Ionicons.glyphMap}
            size={26}
            color={accentColor}
          />
        </View>
        <PoppinsText weight="semibold" size={theme.fontSize.sm} align="center" numberOfLines={2}>
          {name}
        </PoppinsText>
        <PoppinsText
          weight="medium"
          size={theme.fontSize.xs}
          color={theme.colors.textMuted}
        >
          {wordCount} words
        </PoppinsText>
        {selected && (
          <View style={[styles.check, { backgroundColor: accentColor }]}>
            <Ionicons name="checkmark" size={14} color={theme.colors.bgDeep} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 128,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  cardSelectedShadow: {
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
