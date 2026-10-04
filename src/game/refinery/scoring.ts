import type { BatchRecord, Choice } from "./types";

/** Points for one correct verdict, before the streak multiplier. */
export const POINTS_PER_CORRECT = 100;
/** The multiplier goes up one step every this many correct verdicts in a row. */
export const STREAK_STEP = 3;
export const MAX_MULTIPLIER = 4;
/** SLA breaches (bad record promoted, or a bad record slipping past) before you get paged. */
export const SLA_BUDGET = 3;
/** Bonus for clearing a level without a single miss. */
export const CLEAN_LEVEL_BONUS = 250;
/** Points for picking the right fix for an incident. */
export const INCIDENT_POINTS = 500;
/** Incidents per shift. */
export const INCIDENT_COUNT = 3;
/** Seconds-ish clock per incident (timed mode only). */
export const INCIDENT_MS = 12_000;

export function isCorrect(record: BatchRecord, choice: Choice): boolean {
  return record.isValid ? choice === "promote" : choice === "quarantine";
}

/** A bad record reaching Silver (promoted, or slipped past undecided) breaches the data SLA. */
export function isBreach(record: BatchRecord, choice: Choice | null): boolean {
  return !record.isValid && choice !== "quarantine";
}

/** ×1 for the first STREAK_STEP correct verdicts in a row, then ×2, ×3, capped at ×4. */
export function multiplierFor(streak: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(Math.max(0, streak) / STREAK_STEP));
}

export function accuracy(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

/** Best score is a high-water mark; garbage from storage counts as zero. */
export function nextBest(previous: unknown, score: number): number {
  const prev = typeof previous === "number" && Number.isFinite(previous) ? previous : 0;
  return Math.max(prev, score);
}

export type RankId = "intern" | "junior" | "engineer" | "hero";

export interface Rank {
  id: RankId;
  minScore: number;
  /** A completed shift at this rank counts as a win (NOVA cheers, confetti). */
  win: boolean;
}

/** Rank table, lowest first. A perfect shift scores 10,050. */
export const RANKS: readonly Rank[] = [
  { id: "intern", minScore: 0, win: false },
  { id: "junior", minScore: 2_500, win: false },
  { id: "engineer", minScore: 5_000, win: true },
  { id: "hero", minScore: 8_000, win: true },
];
/** Getting paged caps the rank here, whatever the score. */
const PAGED_RANK_CAP = 1;
const FALLBACK_RANK: Rank = { id: "intern", minScore: 0, win: false };

export function rankFor(score: number, paged: boolean): Rank {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (score >= r.minScore) index = i;
  });
  if (paged) index = Math.min(index, PAGED_RANK_CAP);
  return RANKS[index] ?? FALLBACK_RANK;
}
