import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const COLORS = [
  "#7C3AED", "#38BDF8", "#EC4899", "#84CC16",
  "#FACC15", "#F97316", "#22D3EE", "#F87171",
];

interface Piece {
  startX: number;
  driftX: number;
  fall: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  spin: number;
  round: boolean;
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) })
    );
  }, [t, piece]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: piece.startX + piece.driftX * t.value },
      { translateY: -40 + piece.fall * t.value },
      { rotate: `${piece.spin * t.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Full-screen confetti celebration — mounts, rains once (~2.5s), done.
 * Render conditionally: {celebrate && <ConfettiBurst />}
 */
export const ConfettiBurst = memo(function ConfettiBurst({ count = 80 }: { count?: number }) {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        startX: Math.random() * width,
        driftX: (Math.random() - 0.5) * width * 0.5,
        fall: height + 80,
        size: 8 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 500,
        duration: 1800 + Math.random() * 1400,
        spin: (Math.random() - 0.5) * 1080,
        round: Math.random() < 0.3,
      })),
    [count, width, height]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: { position: "absolute", top: 0, left: 0 },
});
