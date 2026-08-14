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
 * Sign normalization for accelerationIncludingGravity.z so that
 * "+1 g along z" always means "screen facing the ceiling":
 * - iOS (CoreMotion): flat screen-up reports z ≈ -9.81
 * - Android: flat screen-up reports z ≈ +9.81
 */
const GRAVITY_SIGN = Platform.OS === "ios" ? -1 : 1;

/**
 * Tilt detection for "phone on forehead" play.
 *
 * Uses the GRAVITY VECTOR, not Euler angles: rotation.beta suffers a gimbal
 * flip near vertical (tilting up past vertical makes beta shrink again, which
 * made tilt-up register as "correct"). Gravity has no such ambiguity and is
 * orientation-independent (works in portrait AND landscape).
 *
 * Geometry: the phone is held vertically against the forehead, screen facing
 * the guessers → gravity is perpendicular to the screen normal (tilt ≈ 0°).
 *   - Tilt DOWN (screen toward floor)  → gravity gains a -z component
 *   - Tilt UP   (screen toward ceiling) → gravity gains a +z component
 * tiltDeg = asin(g_z / |g|):  negative = down, positive = up.
 *
 * Debounce contract: after firing "down" or "up", the device must return to
 * the neutral band before another event can fire — one gesture, one event.
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

  // Sensitivity 0..1 → trigger angle from vertical: 50° (hard) … 25° (easy).
  const clamped = Math.min(1, Math.max(0, sensitivity));
  const triggerAngle = 50 - clamped * 25;
  const angleRef = useRef(triggerAngle);
  angleRef.current = triggerAngle;

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
      const g = m.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null || g.z == null) return;

      const magnitude = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
      // Ignore junk samples (free-fall / sensor warm-up) — gravity should
      // dominate; violent shakes briefly distort it but settle within a tick.
      if (magnitude < 4) return;

      const zRatio = Math.max(-1, Math.min(1, (GRAVITY_SIGN * g.z) / magnitude));
      const tiltDeg = (Math.asin(zRatio) * 180) / Math.PI; // + up / - down

      const trigger = angleRef.current;
      const rearm = trigger * 0.5; // hysteresis: must come well back to vertical

      if (armedRef.current) {
        if (tiltDeg < -trigger) {
          armedRef.current = false;
          setTiltState("down");
          if (enabledRef.current) onTiltRef.current?.("down");
        } else if (tiltDeg > trigger) {
          armedRef.current = false;
          setTiltState("up");
          if (enabledRef.current) onTiltRef.current?.("up");
        }
      } else if (Math.abs(tiltDeg) < rearm) {
        armedRef.current = true;
        setTiltState("neutral");
      }
    });

    return () => sub.remove();
  }, [permission]);

  return { tiltState, permission, requestPermission };
}
