import { decks, Word } from "./decks";

/**
 * Daily Challenge — a deterministic word set seeded by the calendar date, so
 * everyone playing on the same day gets the SAME words in the SAME order and
 * the same golden words. Compare scores fairly!
 */

export const DAILY_DECK_ID = "daily";
export const DAILY_WORD_COUNT = 20;
export const DAILY_DURATION = 60;

/** mulberry32 — tiny deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** "2026-08-14" in the device's local timezone. */
export function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** High-score bucket for today's challenge (one leaderboard per day). */
export function dailyScoreId(): string {
  return `${DAILY_DECK_ID}:${todayKey()}`;
}

export interface DailyChallenge {
  words: Word[];
  /** Terms that are golden today (same for every player). */
  goldenTerms: Set<string>;
}

/** Deterministic word sample + order + golden picks for today. */
export function getDailyChallenge(): DailyChallenge {
  const rand = mulberry32(hashString(`cosmos-fun:${todayKey()}`));

  const pool = decks.flatMap((d) => d.words);
  // Seeded Fisher–Yates over a copy, then take the first N.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const words = shuffled.slice(0, DAILY_WORD_COUNT);

  // ~3 golden words per day, seeded.
  const goldenTerms = new Set<string>();
  const goldenPool = [...words];
  for (let k = 0; k < 3 && goldenPool.length > 0; k++) {
    const idx = Math.floor(rand() * goldenPool.length);
    goldenTerms.add(goldenPool[idx].term);
    goldenPool.splice(idx, 1);
  }

  return { words, goldenTerms };
}
