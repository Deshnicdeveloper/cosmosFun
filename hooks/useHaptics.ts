import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useGame } from "../context/GameContext";

/**
 * Haptic feedback helpers, gated by the user's haptics setting.
 * All calls are fire-and-forget and safe on web (no-op).
 */
export function useHaptics() {
  const { settings } = useGame();
  const enabled = settings.hapticsEnabled && Platform.OS !== "web";

  const correct = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
  }, [enabled]);

  const skip = useCallback(() => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);

  const warning = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {}
    );
  }, [enabled]);

  const timeout = useCallback(() => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {}
    );
  }, [enabled]);

  const tap = useCallback(() => {
    if (!enabled) return;
    Haptics.selectionAsync().catch(() => {});
  }, [enabled]);

  return { correct, skip, warning, timeout, tap };
}
