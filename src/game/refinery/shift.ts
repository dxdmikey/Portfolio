import { generateBatch } from "./generate";
import { isRightFix, pickIncidents, type PickedIncident } from "./incidents";
import { STAGES, TOTAL_RECORDS, levelAt, levelSeed } from "./levels";
import {
  CLEAN_LEVEL_BONUS,
  INCIDENT_COUNT,
  INCIDENT_POINTS,
  POINTS_PER_CORRECT,
  SLA_BUDGET,
  accuracy,
  isBreach,
  isCorrect,
  multiplierFor,
  rankFor,
  type Rank,
} from "./scoring";
import type { Batch, BatchRecord, Choice, IncidentSpec } from "./types";

/** The first shift is fixed so every visitor (and every test) gets the same opening records. */
export const FIRST_SHIFT_SEED = 1042;

export type ShiftPhase = "idle" | "briefing" | "running" | "incident" | "report";

/** What happened to one record. `choice: null` = it slipped off the end of the belt. */
export interface RecordVerdict {
  stage: number;
  record: BatchRecord;
  choice: Choice | null;
  correct: boolean;
  breach: boolean;
  points: number;
  multiplier: number;
}

export interface IncidentAnswer {
  /** Option index, or null when the clock ran out. */
  option: number | null;
  correct: boolean;
}

export interface ShiftStats {
  score: number;
  streak: number;
  bestStreak: number;
  breaches: number;
  processed: number;
  correct: number;
  /** Records sent to quarantine (right or wrong). */
  quarantined: number;
  incidentsResolved: number;
}

export interface ShiftResult {
  reason: "complete" | "paged";
  score: number;
  processed: number;
  correct: number;
  accuracy: number;
  bestStreak: number;
  incidentsResolved: number;
  incidentCount: number;
  rank: Rank;
  outcome: "win" | "lose";
}

export interface ShiftState {
  phase: ShiftPhase;
  seed: number;
  /** Index into STAGES: the levels, then the incident round. */
  stage: number;
  /** Records of the current level. */
  batch: Batch | null;
  cursor: number;
  stats: ShiftStats;
  /** Misses in the current level (for the clean-level bonus). */
  levelMisses: number;
  last: RecordVerdict | null;
  misses: readonly RecordVerdict[];
  pool: readonly IncidentSpec[];
  incidents: readonly PickedIncident[];
  incidentIndex: number;
  incidentAnswer: IncidentAnswer | null;
  result: ShiftResult | null;
}

export type ShiftAction =
  | { type: "start" }
  /** Briefing read: start the level (or the incident round). */
  | { type: "begin" }
  | { type: "decide"; choice: Choice }
  /** The current record reached the end of the belt undecided. */
  | { type: "slip" }
  /** Pick a fix, or `option: null` when the incident clock ran out. */
  | { type: "resolve"; option: number | null }
  | { type: "next-incident" }
  /** Replay the same shift (same records and incidents). */
  | { type: "retry" }
  | { type: "new-shift"; seed: number };

/** Side effects the UI turns into sound, FX, announcements and the bus `game:result`. */
export type ShiftEffect =
  | { kind: "shift-start" }
  | { kind: "record"; verdict: RecordVerdict }
  | { kind: "streak-up"; multiplier: number }
  | { kind: "level-clear"; stage: number; bonus: number }
  | { kind: "incident-open"; index: number }
  | { kind: "incident-resolved"; answer: IncidentAnswer; points: number }
  | { kind: "shift-end"; result: ShiftResult };

export interface StepResult {
  state: ShiftState;
  effects: readonly ShiftEffect[];
}

const EMPTY_STATS: ShiftStats = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  breaches: 0,
  processed: 0,
  correct: 0,
  quarantined: 0,
  incidentsResolved: 0,
};

export function createShift(seed: number, pool: readonly IncidentSpec[]): ShiftState {
  return {
    phase: "idle",
    seed,
    stage: 0,
    batch: null,
    cursor: 0,
    stats: EMPTY_STATS,
    levelMisses: 0,
    last: null,
    misses: [],
    pool,
    incidents: pickIncidents(pool, INCIDENT_COUNT, seed),
    incidentIndex: 0,
    incidentAnswer: null,
    result: null,
  };
}

function batchFor(seed: number, stage: number): Batch | null {
  const level = levelAt(stage);
  if (!level) return null;
  return generateBatch(levelSeed(seed, stage), {
    size: level.records,
    badRatio: level.badRatio,
    defects: level.defects,
  });
}

/** Opens the briefing for a stage (a level or the incident round). */
function brief(state: ShiftState, stage: number): ShiftState {
  return { ...state, phase: "briefing", stage, batch: batchFor(state.seed, stage), cursor: 0, levelMisses: 0 };
}

function freshShift(state: ShiftState, seed: number): StepResult {
  const shift = createShift(seed, state.pool);
  return { state: brief(shift, 0), effects: [{ kind: "shift-start" }] };
}

export function currentRecord(state: ShiftState): BatchRecord | undefined {
  return state.phase === "running" ? state.batch?.records[state.cursor] : undefined;
}

export function currentIncident(state: ShiftState): PickedIncident | undefined {
  return state.phase === "incident" ? state.incidents[state.incidentIndex] : undefined;
}

export function summarize(state: ShiftState, reason: ShiftResult["reason"]): ShiftResult {
  const { stats } = state;
  const paged = reason === "paged";
  const rank = rankFor(stats.score, paged);
  return {
    reason,
    score: stats.score,
    processed: stats.processed,
    correct: stats.correct,
    accuracy: accuracy(stats.correct, stats.processed),
    bestStreak: stats.bestStreak,
    incidentsResolved: stats.incidentsResolved,
    incidentCount: state.incidents.length,
    rank,
    outcome: !paged && rank.win ? "win" : "lose",
  };
}

function finish(state: ShiftState, reason: ShiftResult["reason"], effects: ShiftEffect[]): StepResult {
  const result = summarize(state, reason);
  return { state: { ...state, phase: "report", result }, effects: [...effects, { kind: "shift-end", result }] };
}

function openIncident(state: ShiftState, index: number, effects: ShiftEffect[]): StepResult {
  if (index >= state.incidents.length) return finish(state, "complete", effects);
  return {
    state: { ...state, phase: "incident", incidentIndex: index, incidentAnswer: null },
    effects: [...effects, { kind: "incident-open", index }],
  };
}

/** Scores one record (decided or slipped) and moves the belt on. */
function judge(state: ShiftState, record: BatchRecord, choice: Choice | null): StepResult {
  const correct = choice !== null && isCorrect(record, choice);
  const breach = isBreach(record, choice);
  const multiplier = multiplierFor(state.stats.streak);
  const points = correct ? POINTS_PER_CORRECT * multiplier : 0;
  const streak = correct ? state.stats.streak + 1 : 0;
  const verdict: RecordVerdict = { stage: state.stage, record, choice, correct, breach, points, multiplier };
  const stats: ShiftStats = {
    ...state.stats,
    score: state.stats.score + points,
    streak,
    bestStreak: Math.max(state.stats.bestStreak, streak),
    breaches: state.stats.breaches + (breach ? 1 : 0),
    processed: state.stats.processed + 1,
    correct: state.stats.correct + (correct ? 1 : 0),
    quarantined: state.stats.quarantined + (choice === "quarantine" ? 1 : 0),
  };
  const effects: ShiftEffect[] = [{ kind: "record", verdict }];
  const nextMultiplier = multiplierFor(streak);
  if (nextMultiplier > multiplier) effects.push({ kind: "streak-up", multiplier: nextMultiplier });

  const next: ShiftState = {
    ...state,
    stats,
    cursor: state.cursor + 1,
    last: verdict,
    levelMisses: state.levelMisses + (correct ? 0 : 1),
    misses: correct ? state.misses : [...state.misses, verdict],
  };
  if (stats.breaches >= SLA_BUDGET) return finish(next, "paged", effects);
  if (next.cursor < (state.batch?.records.length ?? 0)) return { state: next, effects };

  const bonus = next.levelMisses === 0 ? CLEAN_LEVEL_BONUS : 0;
  const cleared: ShiftState = { ...next, stats: { ...stats, score: stats.score + bonus } };
  effects.push({ kind: "level-clear", stage: state.stage, bonus });
  return { state: brief(cleared, state.stage + 1), effects };
}

/** The whole shift as one pure state machine: idle → briefing ⇄ running → incident → report. */
export function step(state: ShiftState, action: ShiftAction): StepResult {
  const none: StepResult = { state, effects: [] };
  switch (action.type) {
    case "start":
      return state.phase === "idle" ? freshShift(state, state.seed) : none;
    case "retry":
      return freshShift(state, state.seed);
    case "new-shift":
      return freshShift(state, action.seed);
    case "begin": {
      if (state.phase !== "briefing") return none;
      if (levelAt(state.stage)) return { state: { ...state, phase: "running", cursor: 0 }, effects: [] };
      return openIncident(state, 0, []);
    }
    case "decide":
    case "slip": {
      const record = currentRecord(state);
      if (!record) return none;
      return judge(state, record, action.type === "decide" ? action.choice : null);
    }
    case "resolve": {
      const incident = currentIncident(state);
      if (!incident || state.incidentAnswer) return none;
      const correct = action.option !== null && isRightFix(incident, action.option);
      const points = correct ? INCIDENT_POINTS : 0;
      const answer: IncidentAnswer = { option: action.option, correct };
      const stats: ShiftStats = {
        ...state.stats,
        score: state.stats.score + points,
        incidentsResolved: state.stats.incidentsResolved + (correct ? 1 : 0),
      };
      return {
        state: { ...state, stats, incidentAnswer: answer },
        effects: [{ kind: "incident-resolved", answer, points }],
      };
    }
    case "next-incident":
      if (state.phase !== "incident" || !state.incidentAnswer) return none;
      return openIncident(state, state.incidentIndex + 1, []);
  }
}

export interface TankLevels {
  /** Records still waiting in Bronze. */
  bronze: number;
  /** Records that reached Silver: promoted, or slipped past the gate undecided. */
  silver: number;
  quarantine: number;
  total: number;
}

/** How many records sit in each medallion layer right now. */
export function tankLevels(state: ShiftState): TankLevels {
  const { processed, quarantined } = state.stats;
  return {
    bronze: TOTAL_RECORDS - processed,
    silver: processed - quarantined,
    quarantine: quarantined,
    total: TOTAL_RECORDS,
  };
}

export const INCIDENT_STAGE = STAGES.length - 1;
