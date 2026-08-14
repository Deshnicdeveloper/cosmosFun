import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PoppinsText } from "./PoppinsText";
import { theme } from "../theme/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerRingProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
}

/**
 * Circular countdown ring. Turns red and pulses during the final 5 seconds.
 */
export function TimerRing({ secondsLeft, totalSeconds, size = 84 }: TimerRingProps) {
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(1);
  const pulse = useSharedValue(1);

  const isCritical = secondsLeft <= 5 && secondsLeft > 0;

  useEffect(() => {
    progress.value = withTiming(
      Math.max(0, secondsLeft / Math.max(1, totalSeconds)),
      { duration: 950, easing: Easing.linear }
    );
  }, [secondsLeft, totalSeconds, progress]);

  useEffect(() => {
    if (isCritical) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 240, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 240, easing: Easing.in(Easing.quad) })
        ),
        -1
      );
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [isCritical, pulse]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringColor = isCritical || secondsLeft <= 0 ? theme.colors.danger : theme.colors.textPrimary;

  return (
    <Animated.View style={[{ width: size, height: size }, pulseStyle]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.label}>
        <PoppinsText
          weight="extrabold"
          size={size * 0.32}
          color={ringColor}
        >
          {Math.max(0, secondsLeft)}
        </PoppinsText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
