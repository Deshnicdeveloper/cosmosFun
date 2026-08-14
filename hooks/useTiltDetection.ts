import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceMotion, DeviceMotionMeasurement } from "expo-sensors";
import { Platform } from "react-native";

export type TiltState = "neutral" | "down" | "up";
export type TiltPermission = "undetermined" | "granted" | "denied" | "unavailable";

interface Options {
  /** Fires once per tilt gesture (must return to neutral before re-triggering). */
  onTilt?: (state: Exclude<TiltState, "neutral">) => void;
  /** 0 (least sensitive, big tilt needed) … 1 (most sensitive). Default 0.5. */
  sensitivity?: number;
  /** Pause detection (e.g. between words / countdown). */
  enabled?: boolean;
}

/**
 * Tilt detection for "phone on forehead" play, via DeviceMotion.
 *
 * The phone is held upright (portrait) against the forehead, screen facing
 * the guessers. We derive the pitch angle from `rotation.beta` (rotation
 * around the device x-axis, radians):
 *   - upright ≈ 90°
 *   - tilt down (screen toward floor)  → angle shrinks toward 0°
 *   - tilt up (screen toward ceiling)  → angle grows toward 180°
 *
 * Debounce contract: after firing "down" or "up", the device must return to
 * the neutral band before another event can fire — a single tilt gesture
 * produces exactly one event.
 */
export function useTiltDetection({ onTilt, sensitivity = 0.5, enabled = true }: Options = {}) {
  const [tiltState, setTiltState] = useState<TiltState>("neutral");
  const [permission, setPermission] = useState<TiltPermission>(
    Platform.OS === "web" ? "unavailable" : "undetermined"
  );

  const armedRef = useRef(true); // false until device returns to neutral
  const onTiltRef = useRef(onTilt);
  onTiltRef.current = onTilt;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Sensitivity 0..1 → trigger offset from vertical: 50° (hard) … 25° (easy).
  const clamped = Math.min(1, Math.max(0, sensitivity));
  const triggerOffset = 50 - clamped * 25;
  const offsetRef = useRef(triggerOffset);
  offsetRef.current = triggerOffset;

  const requestPermission = useCallback(async (): Promise<TiltPermission> => {
    if (Platform.OS === "web") {
      setPermission("unavailable");
      return "unavailable";
    }
    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        setPermission("unavailable");
        return "unavailable";
      }
      const { granted } = await DeviceMotion.requestPermissionsAsync();
      const result: TiltPermission = granted ? "granted" : "denied";
      setPermission(result);
      return result;
    } catch {
      setPermission("denied");
      return "denied";
    }
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;

    DeviceMotion.setUpdateInterval(80);
    const sub = DeviceMotion.addListener((m: DeviceMotionMeasurement) => {
      const beta = m.rotation?.beta;
      if (beta == null) return;

      const pitchDeg = (beta * 180) / Math.PI; // upright ≈ 90
      const offset = offsetRef.current;
      const downThreshold = 90 - offset;
      const upThreshold = 90 + offset;
      // Neutral band is deliberately narrower than the trigger band so the
      // gesture has hysteresis (no rapid-fire at the boundary).
      const neutralLow = 90 - offset * 0.55;
      const neutralHigh = 90 + offset * 0.55;

      if (armedRef.current) {
        if (pitchDeg < downThreshold) {
          armedRef.current = false;
          setTiltState("down");
          if (enabledRef.current) onTiltRef.current?.("down");
        } else if (pitchDeg > upThreshold) {
          armedRef.current = false;
          setTiltState("up");
          if (enabledRef.current) onTiltRef.current?.("up");
        }
      } else if (pitchDeg > neutralLow && pitchDeg < neutralHigh) {
        armedRef.current = true;
        setTiltState("neutral");
      }
    });

    return () => sub.remove();
  }, [permission]);

  return { tiltState, permission, requestPermission };
}
