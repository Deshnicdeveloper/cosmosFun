import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, G } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type MascotMood = "wave" | "happy" | "cheer" | "shrug" | "dizzy";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

/**
 * "Cosmo" — the Cosmos Fun mascot. A friendly ringed planet, drawn as SVG.
 * Reacts per mood: waves on splash, cheers on success, shrugs on skip,
 * looks dizzy on timeout.
 */
export function Mascot({ mood = "happy", size = 140 }: MascotProps) {
  const bob = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    // Gentle idle bob for every mood.
    bob.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    if (mood === "cheer") {
      wobble.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 140 }),
          withTiming(6, { duration: 140 })
        ),
        6,
        true
      );
    } else if (mood === "dizzy") {
      wobble.value = withRepeat(withTiming(360, { duration: 2400, easing: Easing.linear }), -1);
    } else if (mood === "wave") {
      wobble.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 350 }),
          withTiming(4, { duration: 350 })
        ),
        -1,
        true
      );
    } else {
      wobble.value = withTiming(0, { duration: 200 });
    }
  }, [mood, bob, wobble]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value * -8 },
      {
        rotate:
          mood === "dizzy" ? `${wobble.value * 0.05}deg` : `${wobble.value}deg`,
      },
    ],
  }));

  const eyes = () => {
    switch (mood) {
      case "dizzy":
        return (
          <G>
            {/* spiral-ish X eyes */}
            <Path d="M38 44 l10 10 M48 44 l-10 10" stroke="#0B0E2E" strokeWidth={3.4} strokeLinecap="round" />
            <Path d="M64 44 l10 10 M74 44 l-10 10" stroke="#0B0E2E" strokeWidth={3.4} strokeLinecap="round" />
          </G>
        );
      case "cheer":
        return (
          <G>
            {/* joyful closed-arc eyes */}
            <Path d="M36 50 q7 -9 14 0" stroke="#0B0E2E" strokeWidth={3.4} fill="none" strokeLinecap="round" />
            <Path d="M62 50 q7 -9 14 0" stroke="#0B0E2E" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          </G>
        );
      case "shrug":
        return (
          <G>
            <Circle cx={43} cy={49} r={4.6} fill="#0B0E2E" />
            <Circle cx={69} cy={49} r={4.6} fill="#0B0E2E" />
            {/* raised uneven brows */}
            <Path d="M36 39 q7 -5 14 -1" stroke="#0B0E2E" strokeWidth={2.6} fill="none" strokeLinecap="round" />
            <Path d="M62 37 q7 -3 14 2" stroke="#0B0E2E" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          </G>
        );
      default:
        return (
          <G>
            <Circle cx={43} cy={49} r={5} fill="#0B0E2E" />
            <Circle cx={69} cy={49} r={5} fill="#0B0E2E" />
            <Circle cx={44.6} cy={47.2} r={1.6} fill="#F8FAFC" />
            <Circle cx={70.6} cy={47.2} r={1.6} fill="#F8FAFC" />
          </G>
        );
    }
  };

  const mouth = () => {
    switch (mood) {
      case "cheer":
        return <Path d="M44 62 q12 16 24 0 z" fill="#0B0E2E" />;
      case "dizzy":
        return <Ellipse cx={56} cy={66} rx={6} ry={7.5} fill="#0B0E2E" />;
      case "shrug":
        return <Path d="M46 66 q10 -4 20 0" stroke="#0B0E2E" strokeWidth={3.2} fill="none" strokeLinecap="round" />;
      default:
        return <Path d="M44 62 q12 10 24 0" stroke="#0B0E2E" strokeWidth={3.4} fill="none" strokeLinecap="round" />;
    }
  };

  const arms = () => {
    if (mood === "wave") {
      return (
        <G>
          <Path d="M18 62 q-10 -8 -6 -20" stroke="#A78BFA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx={12} cy={40} r={5.4} fill="#A78BFA" />
        </G>
      );
    }
    if (mood === "cheer") {
      return (
        <G>
          <Path d="M16 56 q-12 -10 -8 -24" stroke="#A78BFA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx={8} cy={30} r={5.4} fill="#A78BFA" />
          <Path d="M96 56 q12 -10 8 -24" stroke="#A78BFA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx={104} cy={30} r={5.4} fill="#A78BFA" />
        </G>
      );
    }
    if (mood === "shrug") {
      return (
        <G>
          <Path d="M18 66 q-12 0 -12 -10" stroke="#A78BFA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx={6} cy={55} r={5.4} fill="#A78BFA" />
          <Path d="M94 66 q12 0 12 -10" stroke="#A78BFA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx={106} cy={55} r={5.4} fill="#A78BFA" />
        </G>
      );
    }
    return null;
  };

  return (
    <Animated.View style={[style, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 112 112">
        {/* planet ring (behind body) */}
        <Ellipse
          cx={56}
          cy={60}
          rx={52}
          ry={14}
          fill="none"
          stroke="#FACC15"
          strokeWidth={5}
          opacity={0.9}
          transform="rotate(-14 56 60)"
        />
        {/* body */}
        <Circle cx={56} cy={56} r={34} fill="#8B5CF6" />
        <Circle cx={56} cy={56} r={34} fill="none" stroke="#6D28D9" strokeWidth={2.5} />
        {/* surface blotches */}
        <Ellipse cx={42} cy={70} rx={8} ry={5} fill="#7C3AED" opacity={0.8} />
        <Ellipse cx={72} cy={36} rx={6} ry={4} fill="#A78BFA" opacity={0.7} />
        {/* ring front arc */}
        <Path
          d="M8 68 q48 22 96 -2"
          fill="none"
          stroke="#FACC15"
          strokeWidth={5}
          opacity={0.95}
        />
        {arms()}
        {eyes()}
        {mouth()}
        {/* rosy cheeks for happy/cheer */}
        {(mood === "happy" || mood === "cheer" || mood === "wave") && (
          <G opacity={0.55}>
            <Ellipse cx={34} cy={58} rx={5} ry={3} fill="#EC4899" />
            <Ellipse cx={78} cy={58} rx={5} ry={3} fill="#EC4899" />
          </G>
        )}
      </Svg>
      {mood === "dizzy" && <DizzyStars size={size} />}
    </Animated.View>
  );
}

/** Little orbiting stars above a dizzy mascot. */
function DizzyStars({ size }: { size: number }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1800, easing: Easing.linear }), -1);
  }, [spin]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.dizzyRing, { width: size * 0.6, height: size * 0.6, top: -size * 0.12, left: size * 0.2 }, style]}>
      <View style={[styles.dizzyDot, { top: 0, left: "45%" }]} />
      <View style={[styles.dizzyDot, { bottom: 0, left: "10%" }]} />
      <View style={[styles.dizzyDot, { bottom: 0, right: "10%" }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dizzyRing: { position: "absolute" },
  dizzyDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FACC15",
  },
});
