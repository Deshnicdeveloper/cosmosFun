/**
 * Cosmic Events — random round modifiers that keep rounds feeling fresh.
 * Rolled when a round starts (except daily challenge, which is always plain
 * so every player competes under identical rules).
 */

export interface CosmicEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Multiplier applied to normal correct answers (default 1). */
  pointsMultiplier?: number;
  /** Points a golden word is worth this round (default 3). */
  goldenValue?: number;
  /** Chance any word is golden this round (default 1/12). */
  goldenChance?: number;
  /** Override starting time in seconds. */
  startSeconds?: number;
  /** Seconds added to the clock per correct answer. */
  correctBonusSeconds?: number;
  /** Skips freeze the game for this many ms (overrides the settings toggle). */
  skipFreezeMs?: number;
}

export const COSMIC_EVENTS: CosmicEvent[] = [
  {
    id: "double-points",
    name: "Supernova",
    emoji: "💥",
    description: "Every correct word is worth DOUBLE points!",
    pointsMultiplier: 2,
  },
  {
    id: "meteor-shower",
    name: "Meteor Shower",
    emoji: "☄️",
    description: "Only 45 seconds — but every correct answer adds +3s!",
    startSeconds: 45,
    correctBonusSeconds: 3,
  },
  {
    id: "golden-rush",
    name: "Golden Rush",
    emoji: "✨",
    description: "Golden words everywhere, worth 5 points each!",
    goldenValue: 5,
    goldenChance: 1 / 5,
  },
  {
    id: "steady-hands",
    name: "Frozen Comet",
    emoji: "🧊",
    description: "Careful! Skipping freezes the game for 3 seconds.",
    skipFreezeMs: 3000,
  },
  {
    id: "silent-round",
    name: "Deep Space Silence",
    emoji: "🤫",
    description: "Clue-givers can only MIME — not a single word allowed!",
  },
];

/** ~55% of rounds are plain; otherwise pick a random event. */
export function rollCosmicEvent(): CosmicEvent | null {
  if (Math.random() < 0.55) return null;
  return COSMIC_EVENTS[Math.floor(Math.random() * COSMIC_EVENTS.length)];
}

export const DEFAULT_GOLDEN_CHANCE = 1 / 12;
export const DEFAULT_GOLDEN_VALUE = 3;
