import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Difficulty, MIX_ALL_ID } from "../data/decks";

// ---------- Types ----------

export interface Settings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Default round duration in seconds (30 | 60 | 90). */
  roundDuration: number;
  /** 0 (least sensitive) … 1 (most sensitive). */
  tiltSensitivity: number;
}

export interface WordResult {
  term: string;
  correct: boolean;
}

export interface RoundResult {
  deckId: string;
  deckName: string;
  results: WordResult[];
  score: number;
  bestStreak: number;
  duration: number;
  /** true when every shown word was guessed correctly (≥1 word, no skips). */
  perfect: boolean;
}

export interface HighScoreEntry {
  score: number;
  date: string; // ISO
  duration: number;
}

export type HighScores = Record<string, HighScoreEntry[]>;

interface GameContextValue {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  selectedDeckId: string;
  setSelectedDeckId: (id: string) => void;
  difficulty: Difficulty | "all";
  setDifficulty: (d: Difficulty | "all") => void;
  lastRound: RoundResult | null;
  /** Saves the round result and records a high score. Returns true if it made the top 10. */
  finishRound: (round: RoundResult) => boolean;
  highScores: HighScores;
  resetHighScores: () => void;
}

// ---------- Defaults & storage ----------

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  roundDuration: 60,
  tiltSensitivity: 0.5,
};

const SETTINGS_KEY = "cosmosfun:settings";
const HIGHSCORES_KEY = "cosmosfun:highscores";
const MAX_HIGH_SCORES = 10;

const GameContext = createContext<GameContextValue | null>(null);

// ---------- Provider ----------

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(MIX_ALL_ID);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [highScores, setHighScores] = useState<HighScores>({});

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      try {
        const [settingsRaw, scoresRaw] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(HIGHSCORES_KEY),
        ]);
        if (settingsRaw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsRaw) });
        }
        if (scoresRaw) {
          setHighScores(JSON.parse(scoresRaw));
        }
      } catch {
        // Corrupt storage — fall back to defaults rather than crash.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist settings on change (skip until initial load completes).
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    if (!readyRef.current) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const finishRound = useCallback((round: RoundResult): boolean => {
    setLastRound(round);
    let madeTop10 = false;
    setHighScores((prev) => {
      const entry: HighScoreEntry = {
        score: round.score,
        date: new Date().toISOString(),
        duration: round.duration,
      };
      const list = [...(prev[round.deckId] ?? []), entry]
        .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
        .slice(0, MAX_HIGH_SCORES);
      madeTop10 = list.includes(entry);
      const next = { ...prev, [round.deckId]: list };
      AsyncStorage.setItem(HIGHSCORES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return madeTop10;
  }, []);

  const resetHighScores = useCallback(() => {
    setHighScores({});
    AsyncStorage.removeItem(HIGHSCORES_KEY).catch(() => {});
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      settings,
      updateSettings,
      selectedDeckId,
      setSelectedDeckId,
      difficulty,
      setDifficulty,
      lastRound,
      finishRound,
      highScores,
      resetHighScores,
    }),
    [
      ready,
      settings,
      updateSettings,
      selectedDeckId,
      difficulty,
      lastRound,
      finishRound,
      highScores,
      resetHighScores,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used inside <GameProvider>");
  }
  return ctx;
}
