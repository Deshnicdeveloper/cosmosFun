import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { Mascot } from "../components/Mascot";
import { theme } from "../theme/theme";

/**
 * Animated in-app splash: wordmark + waving mascot over the star field,
 * auto-navigates to Home after ~1.6s.
 */
export default function Splash() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withDelay(
      100,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.6)) })
    );
    const t = setTimeout(() => router.replace("/home"), 1600);
    return () => clearTimeout(t);
  }, [router, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Animated.View style={[styles.center, style]}>
          <Mascot mood="wave" size={150} />
          <PoppinsText weight="extrabold" size={theme.fontSize.huge} style={styles.title}>
            Cosmos Fun
          </PoppinsText>
          <PoppinsText weight="medium" size={theme.fontSize.md} color={theme.colors.textSecondary}>
            The party game that's out of this world
          </PoppinsText>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: theme.spacing.sm },
  title: { marginTop: theme.spacing.md },
});
