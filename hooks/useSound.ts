import { useCallback, useEffect, useRef } from "react";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useGame } from "../context/GameContext";

/**
 * Sound effects, gated by the user's sound setting.
 *
 * The bundled .wav files in assets/sounds/ are simple synthesized
 * placeholders (generated programmatically). To use richer royalty-free
 * sounds, just drop replacement files with the same names into
 * assets/sounds/ — .wav or .mp3 both work (update the requires below
 * if you change extensions).
 */
const SOURCES = {
  correct: require("../assets/sounds/correct.wav"),
  skip: require("../assets/sounds/skip.wav"),
  countdown: require("../assets/sounds/countdown.wav"),
  timeout: require("../assets/sounds/timeout.wav"),
  cheer: require("../assets/sounds/cheer.wav"),
  go: require("../assets/sounds/go.wav"),
  golden: require("../assets/sounds/golden.wav"),
  freeze: require("../assets/sounds/freeze.wav"),
  bonus: require("../assets/sounds/bonus.wav"),
} as const;

export type SoundName = keyof typeof SOURCES;

export function useSound() {
  const { settings } = useGame();
  const enabledRef = useRef(settings.soundEnabled);
  enabledRef.current = settings.soundEnabled;

  const playersRef = useRef<Partial<Record<SoundName, AudioPlayer>>>({});

  useEffect(() => {
    // Play even when the iPhone ring switch is on silent — it's a party game.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const players: Partial<Record<SoundName, AudioPlayer>> = {};
    for (const name of Object.keys(SOURCES) as SoundName[]) {
      try {
        players[name] = createAudioPlayer(SOURCES[name]);
      } catch {
        // Missing/corrupt asset — sound simply won't play; never block the game.
      }
    }
    playersRef.current = players;
    return () => {
      for (const p of Object.values(players)) {
        try {
          p?.remove();
        } catch {}
      }
      playersRef.current = {};
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current) return;
    const player = playersRef.current[name];
    if (!player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }, []);

  return { play };
}
