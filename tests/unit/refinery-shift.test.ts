import { describe, expect, it } from "vitest";
import { refineryIncidents } from "@/content/refinery-incidents";
import { rightFixIndex } from "@/game/refinery/incidents";
import { LEVELS, TOTAL_RECORDS } from "@/game/refinery/levels";
import { CLEAN_LEVEL_BONUS, INCIDENT_COUNT, INCIDENT_POINTS, SLA_BUDGET } from "@/game/refinery/scoring";
import {
  INCIDENT_STAGE,
  createShift,
  currentIncident,
  currentRecord,
  step,
  tankLevels,
  type ShiftAction,
  type ShiftEffect,
  type ShiftState,
} from "@/game/refinery/shift";
import { ShiftStore } from "@/game/refinery/shift-store";
import type { Choice } from "@/game/refinery/types";

const SEED = 2026;

/** Applies actions in order, collecting every effect. */
function run(state: ShiftState, ...actions: ShiftAction[]) {
  const effects: ShiftEffect[] = [];
  let s = state;
  for (const a of actions) {
    const r = step(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

function rightChoice(state: ShiftState): Choice {
  return currentRecord(state)?.isValid ? "promote" : "quarantine";
}

/** Plays every level perfectly; `wrongAt` picks which decisions (0-based, shift-wide) to get wrong. */
function playLevels(state: ShiftState, wrongAt: (i: number, s: ShiftState) => ShiftAction | null = () => null) {
  let s = state;
  const effects: ShiftEffect[] = [];
  let i = 0;
  while (s.phase === "briefing" || s.phase === "running") {
    if (s.phase === "briefing") {
      if (s.stage === INCIDENT_STAGE) break;
      ({ state: s } = run(s, { type: "begin" }));
      continue;
    }
    const action = wrongAt(i, s) ?? { type: "decide", choice: rightChoice(s) };
    const r = step(s, action);
    s = r.state;
    effects.push(...r.effects);
    i++;
  }
  return { state: s, effects };
}

function solveIncidents(state: ShiftState, right = true) {
  let s = run(state, { type: "begin" }).state;
  const effects: ShiftEffect[] = [];
  while (s.phase === "incident") {
    const incident = currentIncident(s);
    if (!incident) break;
    const correct = rightFixIndex(incident);
    const option = right ? correct : (correct + 1) % incident.options.length;
    const r = run(s, { type: "resolve", option }, { type: "next-incident" });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const fresh = () => createShift(SEED, refineryIncidents);

describe("shift state machine", () => {
  it("starts idle and ignores play actions until started", () => {
    const idle = fresh();
    expect(idle.phase).toBe("idle");
    expect(step(idle, { type: "decide", choice: "promote" }).state).toBe(idle);
    expect(step(idle, { type: "begin" }).state).toBe(idle);
    const { state, effects } = run(idle, { type: "start" });
    expect(state.phase).toBe("briefing");
    expect(state.stage).toBe(0);
    expect(state.batch?.records).toHaveLength(LEVELS[0]?.records ?? 0);
    expect(effects).toEqual([{ kind: "shift-start" }]);
  });

  it("is deterministic: same seed, same shift", () => {
    expect(run(fresh(), { type: "start" }).state).toEqual(run(fresh(), { type: "start" }).state);
  });

  it("plays a perfect shift for the maximum score and the top rank", () => {
    const levels = playLevels(run(fresh(), { type: "start" }).state);
    expect(levels.state.phase).toBe("briefing");
    expect(levels.state.stage).toBe(INCIDENT_STAGE);
    expect(levels.state.stats.processed).toBe(TOTAL_RECORDS);
    const clears = levels.effects.filter((e) => e.kind === "level-clear");
    expect(clears).toHaveLength(LEVELS.length);
    expect(clears.every((e) => e.kind === "level-clear" && e.bonus === CLEAN_LEVEL_BONUS)).toBe(true);
    expect(levels.effects.filter((e) => e.kind === "streak-up").map((e) => (e.kind === "streak-up" ? e.multiplier : 0))).toEqual([2, 3, 4]);

    const done = solveIncidents(levels.state);
    expect(done.state.phase).toBe("report");
    expect(done.state.result).toMatchObject({
      reason: "complete",
      score: 10_050,
      accuracy: 1,
      bestStreak: TOTAL_RECORDS,
      incidentsResolved: INCIDENT_COUNT,
      outcome: "win",
    });
    expect(done.state.result?.rank.id).toBe("hero");
    expect(done.effects.filter((e) => e.kind === "incident-open")).toHaveLength(INCIDENT_COUNT - 1);
    expect(done.effects.at(-1)).toMatchObject({ kind: "shift-end" });
  });

  it("pays 100 x multiplier per correct call and resets the streak on a miss", () => {
    let s = run(fresh(), { type: "start" }, { type: "begin" }).state;
    for (let i = 0; i < 3; i++) s = step(s, { type: "decide", choice: rightChoice(s) }).state;
    expect(s.stats.score).toBe(300);
    const fourth = step(s, { type: "decide", choice: rightChoice(s) });
    expect(fourth.effects[0]).toMatchObject({ kind: "record", verdict: { correct: true, points: 200, multiplier: 2 } });
    s = fourth.state;
    const wrong: Choice = rightChoice(s) === "promote" ? "quarantine" : "promote";
    const miss = step(s, { type: "decide", choice: wrong });
    expect(miss.state.stats.streak).toBe(0);
    expect(miss.state.stats.bestStreak).toBe(4);
    expect(miss.state.misses).toHaveLength(1);
    expect(miss.state.stats.score).toBe(500);
  });

  it("counts a slipped record as a miss, and a breach only when it was bad", () => {
    let s = run(fresh(), { type: "start" }, { type: "begin" }).state;
    while (currentRecord(s)?.isValid === false) s = step(s, { type: "decide", choice: "quarantine" }).state;
    const goodSlip = step(s, { type: "slip" });
    expect(goodSlip.effects[0]).toMatchObject({ kind: "record", verdict: { choice: null, correct: false, breach: false } });
    s = goodSlip.state;
    while (currentRecord(s)?.isValid === true) s = step(s, { type: "decide", choice: "promote" }).state;
    const badSlip = step(s, { type: "slip" });
    expect(badSlip.effects[0]).toMatchObject({ kind: "record", verdict: { choice: null, breach: true } });
    expect(badSlip.state.stats.breaches).toBe(1);
  });

  it("pages you after SLA_BUDGET breaches and ends the shift as a loss", () => {
    const promoteEverything = (): ShiftAction => ({ type: "decide", choice: "promote" });
    const { state, effects } = playLevels(run(fresh(), { type: "start" }).state, promoteEverything);
    expect(state.phase).toBe("report");
    expect(state.stats.breaches).toBe(SLA_BUDGET);
    expect(state.result).toMatchObject({ reason: "paged", outcome: "lose" });
    expect(effects.at(-1)).toMatchObject({ kind: "shift-end", result: { reason: "paged" } });
    expect(step(state, { type: "decide", choice: "promote" }).state).toBe(state);
  });

  it("skips the clean-level bonus after a miss", () => {
    const missFirst = (i: number, s: ShiftState): ShiftAction | null =>
      i === 0 && currentRecord(s)?.isValid ? { type: "decide", choice: "quarantine" } : i === 0 ? { type: "decide", choice: "promote" } : null;
    const { effects } = playLevels(run(fresh(), { type: "start" }).state, missFirst);
    const first = effects.find((e) => e.kind === "level-clear");
    expect(first).toMatchObject({ kind: "level-clear", stage: 0, bonus: 0 });
  });

  it("scores incidents once, handles timeouts, and needs an answer before moving on", () => {
    const atIncidents = playLevels(run(fresh(), { type: "start" }).state).state;
    let s = run(atIncidents, { type: "begin" }).state;
    expect(s.phase).toBe("incident");
    expect(step(s, { type: "next-incident" }).state).toBe(s);
    const before = s.stats.score;
    const timeout = step(s, { type: "resolve", option: null });
    expect(timeout.effects).toEqual([{ kind: "incident-resolved", answer: { option: null, correct: false }, points: 0 }]);
    s = timeout.state;
    expect(step(s, { type: "resolve", option: 0 }).state).toBe(s);
    s = run(s, { type: "next-incident" }).state;
    const incident = currentIncident(s);
    const right = step(s, { type: "resolve", option: incident ? rightFixIndex(incident) : 0 });
    expect(right.state.stats.score).toBe(before + INCIDENT_POINTS);
    expect(right.state.stats.incidentsResolved).toBe(1);
  });

  it("can still win a completed shift on records alone, with every incident wrong", () => {
    const atIncidents = playLevels(run(fresh(), { type: "start" }).state).state;
    const { state } = solveIncidents(atIncidents, false);
    expect(state.result?.incidentsResolved).toBe(0);
    expect(state.result?.score).toBe(10_050 - INCIDENT_COUNT * INCIDENT_POINTS);
    expect(state.result?.outcome).toBe("win");
  });

  it("retries the same shift and starts a new one from a new seed", () => {
    const played = playLevels(run(fresh(), { type: "start" }).state).state;
    const retried = step(played, { type: "retry" }).state;
    expect(retried.stats.score).toBe(0);
    expect(retried.batch).toEqual(run(fresh(), { type: "start" }).state.batch);
    const other = step(played, { type: "new-shift", seed: 77 }).state;
    expect(other.seed).toBe(77);
    expect(other.phase).toBe("briefing");
    expect(other.batch).not.toEqual(retried.batch);
  });

  it("tracks the medallion tanks", () => {
    const start = run(fresh(), { type: "start" }, { type: "begin" }).state;
    expect(tankLevels(start)).toEqual({ bronze: TOTAL_RECORDS, silver: 0, quarantine: 0, total: TOTAL_RECORDS });
    const s = run(start, { type: "decide", choice: "quarantine" }, { type: "decide", choice: "promote" }, { type: "slip" }).state;
    expect(tankLevels(s)).toEqual({ bronze: TOTAL_RECORDS - 3, silver: 2, quarantine: 1, total: TOTAL_RECORDS });
  });
});

describe("ShiftStore", () => {
  it("notifies on change, returns effects, and stays put on no-ops", () => {
    const store = new ShiftStore(SEED, refineryIncidents);
    let calls = 0;
    const off = store.subscribe(() => calls++);
    expect(store.dispatch({ type: "begin" })).toEqual([]);
    expect(calls).toBe(0);
    expect(store.dispatch({ type: "start" })).toEqual([{ kind: "shift-start" }]);
    expect(calls).toBe(1);
    expect(store.getSnapshot().phase).toBe("briefing");
    off();
    store.dispatch({ type: "begin" });
    expect(calls).toBe(1);
  });
});
