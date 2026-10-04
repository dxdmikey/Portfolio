import { describe, expect, it } from "vitest";
import {
  RELAXED_HOLD,
  beltPosition,
  elapsedMs,
  isExpired,
  isPaused,
  pauseStopwatch,
  progress,
  remainingMs,
  resumeStopwatch,
  startStopwatch,
} from "@/game/refinery/conveyor";
import { LEVELS, STAGES, TOTAL_RECORDS, levelSeed, newRules, stageId } from "@/game/refinery/levels";
import {
  MAX_MULTIPLIER,
  RANKS,
  STREAK_STEP,
  isBreach,
  isCorrect,
  multiplierFor,
  nextBest,
  rankFor,
} from "@/game/refinery/scoring";
import { isPlayable, isRightFix, pickIncidents, rightFixIndex } from "@/game/refinery/incidents";
import { refineryIncidents } from "@/content/refinery-incidents";
import type { BatchRecord } from "@/game/refinery/types";

describe("conveyor stopwatch", () => {
  it("moves from 0 to 1 over its duration and then expires", () => {
    const sw = startStopwatch(1000, 500);
    expect(progress(sw, 500)).toBe(0);
    expect(progress(sw, 1000)).toBe(0.5);
    expect(remainingMs(sw, 1000)).toBe(500);
    expect(isExpired(sw, 1499)).toBe(false);
    expect(isExpired(sw, 1500)).toBe(true);
    expect(progress(sw, 9000)).toBe(1);
  });

  it("freezes while paused and resumes where it left off", () => {
    let sw = startStopwatch(1000, 0);
    sw = pauseStopwatch(sw, 200);
    expect(isPaused(sw)).toBe(true);
    expect(elapsedMs(sw, 5000)).toBe(200);
    expect(isExpired(sw, 99_999)).toBe(false);
    sw = resumeStopwatch(sw, 5000);
    expect(isPaused(sw)).toBe(false);
    expect(elapsedMs(sw, 5300)).toBe(500);
    expect(isExpired(sw, 5800)).toBe(true);
  });

  it("ignores double pause and resume", () => {
    const sw = pauseStopwatch(startStopwatch(1000, 0), 100);
    expect(pauseStopwatch(sw, 400)).toBe(sw);
    const running = startStopwatch(1000, 0);
    expect(resumeStopwatch(running, 400)).toBe(running);
  });

  it("rests at the hold point in relaxed mode", () => {
    const sw = startStopwatch(1000, 0);
    expect(beltPosition(sw, 900, true)).toBe(RELAXED_HOLD);
    expect(beltPosition(null, 900, false)).toBe(RELAXED_HOLD);
    expect(beltPosition(sw, 900, false)).toBeCloseTo(0.9);
  });
});

describe("level table", () => {
  it("speeds the belt up every level", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]?.travelMs).toBeLessThan(LEVELS[i - 1]?.travelMs ?? 0);
    }
  });

  it("adds rules cumulatively, ending with duplicates and late data", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      for (const rule of LEVELS[i - 1]?.defects ?? []) expect(LEVELS[i]?.defects).toContain(rule);
    }
    expect(newRules(0)).toEqual(["null-field", "malformed-number"]);
    expect(newRules(1)).toEqual(["schema-drift", "negative-quantity", "future-date"]);
    expect(newRules(2)).toEqual(["duplicate-id", "late-arriving"]);
    expect(newRules(3)).toEqual([]);
  });

  it("ends with the incident round and counts every record", () => {
    expect(STAGES).toEqual(["bronze", "silver", "gold", "incidents"]);
    expect(stageId(99)).toBe("incidents");
    expect(TOTAL_RECORDS).toBe(24);
  });

  it("derives a distinct seed per level", () => {
    expect(new Set([0, 1, 2].map((s) => levelSeed(42, s))).size).toBe(3);
    expect(levelSeed(42, 1)).toBe(levelSeed(42, 1));
  });
});

describe("scoring", () => {
  const clean: BatchRecord = { position: 1, fields: [], isValid: true, defect: null };
  const bad: BatchRecord = { position: 2, fields: [], isValid: false, defect: { type: "null-field", key: "site", reason: "site is null" } };

  it("judges verdicts and SLA breaches", () => {
    expect(isCorrect(clean, "promote")).toBe(true);
    expect(isCorrect(bad, "quarantine")).toBe(true);
    expect(isCorrect(clean, "quarantine")).toBe(false);
    expect(isBreach(bad, "promote")).toBe(true);
    expect(isBreach(bad, null)).toBe(true);
    expect(isBreach(bad, "quarantine")).toBe(false);
    expect(isBreach(clean, null)).toBe(false);
    expect(isBreach(clean, "quarantine")).toBe(false);
  });

  it("raises the multiplier every STREAK_STEP correct in a row, capped", () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(STREAK_STEP - 1)).toBe(1);
    expect(multiplierFor(STREAK_STEP)).toBe(2);
    expect(multiplierFor(STREAK_STEP * 2)).toBe(3);
    expect(multiplierFor(100)).toBe(MAX_MULTIPLIER);
    expect(multiplierFor(-4)).toBe(1);
  });

  it("ranks by score, and getting paged caps the rank", () => {
    expect(rankFor(0, false).id).toBe("intern");
    expect(rankFor(2_500, false).id).toBe("junior");
    expect(rankFor(5_000, false)).toMatchObject({ id: "engineer", win: true });
    expect(rankFor(10_050, false).id).toBe("hero");
    expect(rankFor(10_050, true)).toMatchObject({ id: "junior", win: false });
    expect(RANKS.map((r) => r.minScore)).toEqual([...RANKS.map((r) => r.minScore)].sort((a, b) => a - b));
  });

  it("keeps the best score as a high-water mark", () => {
    expect(nextBest(500, 300)).toBe(500);
    expect(nextBest("junk", 300)).toBe(300);
  });
});

describe("incident registry", () => {
  it("has at least five playable incidents, each with exactly one right fix", () => {
    expect(refineryIncidents.length).toBeGreaterThanOrEqual(5);
    expect(refineryIncidents.every(isPlayable)).toBe(true);
    expect(new Set(refineryIncidents.map((i) => i.id)).size).toBe(refineryIncidents.length);
  });

  it("picks distinct incidents deterministically per seed", () => {
    const a = pickIncidents(refineryIncidents, 3, 7);
    expect(a).toEqual(pickIncidents(refineryIncidents, 3, 7));
    expect(new Set(a.map((i) => i.spec.id)).size).toBe(3);
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].flatMap((s) => pickIncidents(refineryIncidents, 3, s).map((i) => i.spec.id)));
    expect(seen.size).toBeGreaterThan(3);
  });

  it("shuffles options but keeps the one right fix", () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 20; seed++) {
      for (const incident of pickIncidents(refineryIncidents, 3, seed)) {
        const right = rightFixIndex(incident);
        expect(isRightFix(incident, right)).toBe(true);
        expect(incident.options).toHaveLength(incident.spec.options.length);
        positions.add(right);
      }
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it("skips unplayable entries and never picks more than exist", () => {
    const broken = { id: "x", title: "x", log: [], options: [{ label: "a" }, { label: "b" }], explain: "" };
    expect(isPlayable(broken)).toBe(false);
    expect(pickIncidents([broken], 3, 1)).toEqual([]);
    expect(pickIncidents(refineryIncidents, 99, 1)).toHaveLength(refineryIncidents.length);
  });
});
