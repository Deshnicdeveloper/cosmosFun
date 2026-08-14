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
import { Deck, Difficulty, MIX_ALL_ID, decks as builtinDecks, getDeckById } from "../data/decks";
import { CosmicEvent } from "../data/events";
import { DAILY_DECK_ID, dailyScoreId, getDailyChallenge } from "../data/daily";

// ---------- Types ----------

export interface Settings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Default round duration in seconds (30 | 60 | 90). */
  roundDuration: number;
  /** 0 (least sensitive) … 1 (most sensitive). */
  tiltSensitivity: number;
  /** Skips freeze the game for 2s (anti skip-spam house rule). */
  skipFreeze: boolean;
}

export interface WordResult {
  term: string;
  correct: boolean;
  golden?: boolean;
  /** Points earned by this entry (0 for skips). */
  points?: number;
}

export interface RoundResult {
  deckId: string;
  deckName: string;
  results: WordResult[];
  /** Total POINTS scored (multipliers/golden included). */
  score: number;
  bestStreak: number;
  duration: number;
  /** true when every word was guessed correctly in one pass (≥1 word, no skips). */
  perfect: boolean;
  /** true when the whole deck was cleared before the clock ran out. */
  cleared: boolean;
  /** Correct answer landed with ≤3s on the clock. */
  buzzerBeater: boolean;
  /** Golden words guessed this round. */
  goldenCount: number;
  /** Cosmic event active this round, if any. */
  eventName: string | null;
  /** Team that played this round (teams mode). */
  teamIndex?: number;
}

export interface HighScoreEntry {
  score: number;
  date: string; // ISO
  duration: number;
}

export type HighScores = Record<string, HighScoreEntry[]>;

export type GameMode = "solo" | "teams" | "daily";

export interface Team {
  name: string;
  color: string;
  score: number;
  roundsPlayed: number;
}

export interface LifetimeStats {
  gamesPlayed: number;
  wordsGuessed: number;
  wordsSkipped: number;
  bestStreakEver: number;
  goldenWordsFound: number;
  buzzerBeaters: number;
  perfectRounds: number;
  secondsPlayed: number;
}

const EMPTY_STATS: LifetimeStats = {
  gamesPlayed: 0,
  wordsGuessed: 0,
  wordsSkipped: 0,
  bestStreakEver: 0,
  goldenWordsFound: 0,
  buzzerBeaters: 0,
  perfectRounds: 0,
  secondsPlayed: 0,
};

export const TEAM_PRESETS: Array<{ name: string; color: string }> = [
  { name: "Comets", color: "#38BDF8" },
  { name: "Meteors", color: "#F87171" },
  { name: "Rockets", color: "#FACC15" },
  { name: "Galaxies", color: "#4ADE80" },
  { name: "Novas", color: "#F472B6" },
  { name: "Asteroids", color: "#FB923C" },
];

export const MAX_TEAMS = 6;

interface ResolvedDeck {
  id: string;
  name: string;
  icon: string;
  accentColor: string;
}

interface GameContextValue {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  selectedDeckId: string;
  setSelectedDeckId: (id: string) => void;
  difficulty: Difficulty | "all";
  setDifficulty: (d: Difficulty | "all") => void;
  lastRound: RoundResult | null;
  finishRound: (round: RoundResult) => void;
  highScores: HighScores;
  resetHighScores: () => void;
  // modes
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  // cosmic events
  activeEvent: CosmicEvent | null;
  setActiveEvent: (e: CosmicEvent | null) => void;
  // teams
  teams: Team[];
  startTeamMatch: (teamCount: number, roundsPerTeam: number) => void;
  roundsPerTeam: number;
  currentTeamIndex: number;
  totalRoundsPlanned: number;
  roundsCompleted: number;
  matchFinished: boolean;
  endTeamMatch: () => void;
  // custom decks
  customDecks: Deck[];
  saveCustomDeck: (deck: Deck) => void;
  deleteCustomDeck: (id: string) => void;
  // stats
  stats: LifetimeStats;
  resetStats: () => void;
  // helpers
  resolveDeckMeta: (deckId: string) => ResolvedDeck;
}

// ---------- Defaults & storage ----------

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  roundDuration: 60,
  tiltSensitivity: 0.5,
  skipFreeze: false,
};

const SETTINGS_KEY = "cosmosfun:settings";
const HIGHSCORES_KEY = "cosmosfun:highscores";
const CUSTOM_DECKS_KEY = "cosmosfun:customdecks";
const STATS_KEY = "cosmosfun:stats";
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
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [activeEvent, setActiveEvent] = useState<CosmicEvent | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roundsPerTeam, setRoundsPerTeam] = useState(1);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      try {
        const [settingsRaw, scoresRaw, decksRaw, statsRaw] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(HIGHSCORES_KEY),
          AsyncStorage.getItem(CUSTOM_DECKS_KEY),
          AsyncStorage.getItem(STATS_KEY),
        ]);
        if (settingsRaw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsRaw) });
        if (scoresRaw) setHighScores(JSON.parse(scoresRaw));
        if (decksRaw) setCustomDecks(JSON.parse(decksRaw));
        if (statsRaw) setStats({ ...EMPTY_STATS, ...JSON.parse(statsRaw) });
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

  // ----- teams -----

  const totalRoundsPlanned = teams.length * roundsPerTeam;
  const matchFinished = teams.length > 0 && roundsCompleted >= totalRoundsPlanned;
  // Teams play in order, cycling: the pointer is DERIVED from rounds played,
  // so it advances automatically the moment a round is banked.
  const currentTeamIndex = teams.length > 0 ? roundsCompleted % teams.length : 0;

  const startTeamMatch = useCallback((teamCount: number, rounds: number) => {
    const n = Math.max(2, Math.min(MAX_TEAMS, teamCount));
    setTeams(
      TEAM_PRESETS.slice(0, n).map((p) => ({
        name: p.name,
        color: p.color,
        score: 0,
        roundsPlayed: 0,
      }))
    );
    setRoundsPerTeam(Math.max(1, Math.min(3, rounds)));
    setRoundsCompleted(0);
    setGameMode("teams");
  }, []);

  const endTeamMatch = useCallback(() => {
    setGameMode("solo");
    setTeams([]);
    setRoundsCompleted(0);
  }, []);

  // ----- custom decks -----

  const saveCustomDeck = useCallback((deck: Deck) => {
    setCustomDecks((prev) => {
      const next = [...prev.filter((d) => d.id !== deck.id), deck];
      AsyncStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteCustomDeck = useCallback((id: string) => {
    setCustomDecks((prev) => {
      const next = prev.filter((d) => d.id !== id);
      AsyncStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setSelectedDeckId((cur) => (cur === id ? MIX_ALL_ID : cur));
  }, []);

  // ----- rounds, scores, stats -----

  const finishRound = useCallback(
    (round: RoundResult) => {
      setLastRound(round);

      // Lifetime stats (all modes).
      setStats((prev) => {
        const next: LifetimeStats = {
          gamesPlayed: prev.gamesPlayed + 1,
          wordsGuessed: prev.wordsGuessed + round.results.filter((r) => r.correct).length,
          wordsSkipped: prev.wordsSkipped + round.results.filter((r) => !r.correct).length,
          bestStreakEver: Math.max(prev.bestStreakEver, round.bestStreak),
          goldenWordsFound: prev.goldenWordsFound + round.goldenCount,
          buzzerBeaters: prev.buzzerBeaters + (round.buzzerBeater ? 1 : 0),
          perfectRounds: prev.perfectRounds + (round.perfect ? 1 : 0),
          secondsPlayed: prev.secondsPlayed + round.duration,
        };
        AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      // Teams mode: bank points for the team that just played.
      if (round.teamIndex != null) {
        setTeams((prev) =>
          prev.map((t, i) =>
            i === round.teamIndex
              ? { ...t, score: t.score + round.score, roundsPlayed: t.roundsPlayed + 1 }
              : t
          )
        );
        setRoundsCompleted((n) => n + 1);
      }

      // High scores: solo decks + daily (daily gets a per-day bucket).
      const scoreKey =
        round.deckId === DAILY_DECK_ID ? dailyScoreId() : round.teamIndex != null ? null : round.deckId;
      if (scoreKey) {
        setHighScores((prev) => {
          const entry: HighScoreEntry = {
            score: round.score,
            date: new Date().toISOString(),
            duration: round.duration,
          };
          const list = [...(prev[scoreKey] ?? []), entry]
            .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
            .slice(0, MAX_HIGH_SCORES);
          const next = { ...prev, [scoreKey]: list };
          AsyncStorage.setItem(HIGHSCORES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      }
    },
    []
  );

  const resetHighScores = useCallback(() => {
    setHighScores({});
    AsyncStorage.removeItem(HIGHSCORES_KEY).catch(() => {});
  }, []);

  const resetStats = useCallback(() => {
    setStats(EMPTY_STATS);
    AsyncStorage.removeItem(STATS_KEY).catch(() => {});
  }, []);

  // ----- deck resolution (builtin / custom / mix-all / daily) -----

  const resolveDeckMeta = useCallback(
    (deckId: string): ResolvedDeck => {
      if (deckId === MIX_ALL_ID) {
        return { id: deckId, name: "Mix All", icon: "planet", accentColor: "#1034A6" };
      }
      if (deckId === DAILY_DECK_ID) {
        return { id: deckId, name: "Daily Challenge", icon: "calendar", accentColor: "#FACC15" };
      }
      const custom = customDecks.find((d) => d.id === deckId);
      if (custom) {
        return { id: deckId, name: custom.name, icon: custom.icon, accentColor: custom.accentColor };
      }
      const builtin = getDeckById(deckId);
      return builtin
        ? { id: deckId, name: builtin.name, icon: builtin.icon, accentColor: builtin.accentColor }
        : { id: deckId, name: deckId, icon: "help", accentColor: "#1034A6" };
    },
    [customDecks]
  );

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
      gameMode,
      setGameMode,
      activeEvent,
      setActiveEvent,
      teams,
      startTeamMatch,
      roundsPerTeam,
      currentTeamIndex,
      totalRoundsPlanned,
      roundsCompleted,
      matchFinished,
      endTeamMatch,
      customDecks,
      saveCustomDeck,
      deleteCustomDeck,
      stats,
      resetStats,
      resolveDeckMeta,
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
      gameMode,
      activeEvent,
      teams,
      startTeamMatch,
      roundsPerTeam,
      currentTeamIndex,
      totalRoundsPlanned,
      roundsCompleted,
      matchFinished,
      endTeamMatch,
      customDecks,
      saveCustomDeck,
      deleteCustomDeck,
      stats,
      resetStats,
      resolveDeckMeta,
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

/** Words for any deck id: builtin, custom, mix-all, or daily. */
export function getPlayableWords(
  deckId: string,
  difficulty: Difficulty | "all",
  customDecks: Deck[]
) {
  if (deckId === DAILY_DECK_ID) {
    return getDailyChallenge().words; // daily ignores the difficulty filter
  }
  const source =
    deckId === MIX_ALL_ID
      ? [...builtinDecks, ...customDecks].flatMap((d) => d.words)
      : [...builtinDecks, ...customDecks].find((d) => d.id === deckId)?.words ?? [];
  return difficulty === "all" ? source : source.filter((w) => w.difficulty === difficulty);
}
