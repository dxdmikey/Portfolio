import type { DefectType } from "./types";

/** The three medallion stages of a shift, then the incident round. */
export type LevelId = "bronze" | "silver" | "gold";
export type StageId = LevelId | "incidents";

export interface LevelConfig {
  id: LevelId;
  /** Records that ride the conveyor this level. */
  records: number;
  /** Share of defective records (rounded). */
  badRatio: number;
  /** Time for a record to ride the belt end to end. Shorter = faster belt. */
  travelMs: number;
  /** What the quality gate checks this level (cumulative: each level adds rules). */
  defects: readonly DefectType[];
}

const BRONZE_RULES: readonly DefectType[] = ["null-field", "malformed-number"];
const SILVER_RULES: readonly DefectType[] = [
  ...BRONZE_RULES,
  "schema-drift",
  "negative-quantity",
  "future-date",
];
const GOLD_RULES: readonly DefectType[] = [...SILVER_RULES, "duplicate-id", "late-arriving"];

/** Level table: add a row to add a level. The belt speeds up each level. */
export const LEVELS: readonly LevelConfig[] = [
  { id: "bronze", records: 8, badRatio: 0.375, travelMs: 10_000, defects: BRONZE_RULES },
  { id: "silver", records: 8, badRatio: 0.5, travelMs: 8_000, defects: SILVER_RULES },
  { id: "gold", records: 8, badRatio: 0.5, travelMs: 6_500, defects: GOLD_RULES },
];

/** Every stage in play order: the levels, then the incident round. */
export const STAGES: readonly StageId[] = [...LEVELS.map((l) => l.id), "incidents"];

export const TOTAL_RECORDS = LEVELS.reduce((sum, l) => sum + l.records, 0);

export function levelAt(stage: number): LevelConfig | undefined {
  return LEVELS[stage];
}

export function stageId(stage: number): StageId {
  return STAGES[stage] ?? "incidents";
}

/** Rules that are new this level (what the briefing card highlights). */
export function newRules(stage: number): readonly DefectType[] {
  const level = LEVELS[stage];
  if (!level) return [];
  const before = new Set(LEVELS[stage - 1]?.defects ?? []);
  return level.defects.filter((d) => !before.has(d));
}

/** A different but reproducible seed per level of the same shift. */
const LEVEL_SEED_STEP = 7_919;
export function levelSeed(shiftSeed: number, stage: number): number {
  return (shiftSeed + stage * LEVEL_SEED_STEP) >>> 0;
}
