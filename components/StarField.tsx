import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../theme/theme";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  baseOpacity: number;
}

function TwinklingStar({ star }: { star: Star }) {
  const opacity = useSharedValue(star.baseOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withTiming(star.baseOpacity * 0.15, {
          duration: star.duration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );
  }, [opacity, star]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
        },
        style,
      ]}
    />
  );
}

/**
 * Subtle animated star field for menu screens.
 * Kept off the game screen to preserve readability during play.
 */
export const StarField = memo(function StarField({ count = 34 }: { count?: number }) {
  const { width, height } = useWindowDimensions();

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 3000,
        duration: 1200 + Math.random() * 2400,
        baseOpacity: 0.35 + Math.random() * 0.6,
      })),
    [count, width, height]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((star, i) => (
        <TwinklingStar key={i} star={star} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    backgroundColor: theme.colors.star,
  },
});
