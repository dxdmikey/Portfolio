import { describe, expect, it } from "vitest";
import { BATCH_SIZE, BAD_RATIO, RUN_DATE, WATERMARK, addDays, generateBatch } from "@/game/refinery/generate";
import { LEVELS } from "@/game/refinery/levels";
import { createRng } from "@/game/refinery/prng";
import { findDefect } from "@/game/refinery/validate";
import type { RecordField } from "@/game/refinery/types";

const SEEDS = [1, 7, 42, 1337, 2026, 99_999];

describe("createRng", () => {
  it("is deterministic per seed and stays in range", () => {
    const a = createRng(5);
    const b = createRng(5);
    const seqA = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(seqA);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
    expect(createRng(6).next()).not.toBe(seqA[0]);
  });

  it("shuffles without losing items", () => {
    expect(createRng(3).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("generateBatch", () => {
  it("produces the same batch for the same seed", () => {
    expect(generateBatch(42)).toEqual(generateBatch(42));
    expect(generateBatch(42)).not.toEqual(generateBatch(43));
  });

  it.each(SEEDS)("seed %i: ~40%% bad, each with a distinct defect and a reason", (seed) => {
    const { records } = generateBatch(seed);
    expect(records).toHaveLength(BATCH_SIZE);
    const bad = records.filter((r) => !r.isValid);
    expect(bad).toHaveLength(Math.round(BATCH_SIZE * BAD_RATIO));
    expect(new Set(bad.map((r) => r.defect?.type)).size).toBe(bad.length);
    expect(bad.map((r) => r.defect?.type)).toContain("duplicate-id");
    for (const r of bad) {
      expect(r.defect?.reason).toBeTruthy();
      expect(r.fields.some((f) => f.key === r.defect?.key) || r.defect?.type === "schema-drift").toBe(true);
    }
    expect(records.filter((r) => r.isValid).every((r) => r.defect === null)).toBe(true);
    expect(records.map((r) => r.position)).toEqual(records.map((_, i) => i + 1));
  });

  it("only ever dates clean records inside the watermark window", () => {
    for (const seed of SEEDS) {
      for (const r of generateBatch(seed).records.filter((rec) => rec.isValid)) {
        const date = r.fields.find((f) => f.key === "logged_at")?.value;
        expect(typeof date === "string" && date <= RUN_DATE && date >= WATERMARK).toBe(true);
      }
    }
  });

  it("puts the watermark a week before the run date", () => {
    expect(WATERMARK).toBe("2026-09-23");
    expect(generateBatch(1).watermark).toBe(WATERMARK);
  });

  it.each(SEEDS)("seed %i: level batches only break the rules of their level", (seed) => {
    for (const level of LEVELS) {
      const { records } = generateBatch(seed, { size: level.records, badRatio: level.badRatio, defects: level.defects });
      expect(records).toHaveLength(level.records);
      const bad = records.filter((r) => !r.isValid);
      expect(bad).toHaveLength(Math.round(level.records * level.badRatio));
      for (const r of bad) expect(level.defects).toContain(r.defect?.type);
    }
  });

  it("repeats defect types when a level has more bad records than rules", () => {
    const { records } = generateBatch(5, { size: 8, badRatio: 0.5, defects: ["null-field", "malformed-number"] });
    const types = records.filter((r) => !r.isValid).map((r) => r.defect?.type);
    expect(types).toHaveLength(4);
    expect(new Set(types)).toEqual(new Set(["null-field", "malformed-number"]));
  });

  it("injects late-arriving rows before the watermark", () => {
    const { records } = generateBatch(9, { size: 6, badRatio: 0.5, defects: ["late-arriving"] });
    const late = records.filter((r) => r.defect?.type === "late-arriving");
    expect(late).toHaveLength(3);
    for (const r of late) {
      const date = r.fields.find((f) => f.key === "logged_at")?.value;
      expect(typeof date === "string" && date < WATERMARK).toBe(true);
    }
  });

  it("generates an all-clean batch when no rules are given", () => {
    expect(generateBatch(3, { defects: [] }).records.every((r) => r.isValid)).toBe(true);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-09-30", 2)).toBe("2026-10-02");
    expect(addDays("2026-09-30", -30)).toBe("2026-08-31");
  });
});

describe("findDefect", () => {
  const ctx = { seenIds: new Set([1001]), runDate: RUN_DATE };
  const row = (overrides: Record<string, string | number | null> = {}): RecordField[] =>
    Object.entries({ order_id: 1042, site: "HYD-07", fuel_litres: 182.4, logged_at: "2026-09-14", ...overrides }).map(
      ([key, value]) => ({ key, value }),
    );

  it("passes a clean record", () => {
    expect(findDefect(row(), ctx)).toBeNull();
  });

  it.each([
    [{ site: null }, "null-field", "site is null"],
    [{ order_id: 1001 }, "duplicate-id", "duplicate order_id 1001"],
    [{ fuel_litres: "18O.4" }, "malformed-number", 'fuel_litres "18O.4" is not a number'],
    [{ logged_at: "2026-11-01" }, "future-date", "logged_at 2026-11-01 is after the run date"],
    [{ fuel_litres: -182.4 }, "negative-quantity", "negative fuel_litres (-182.4)"],
    [{ fuel_gal: 48.2 }, "schema-drift", "unexpected column fuel_gal"],
  ] as const)("detects %o as %s", (overrides, type, reason) => {
    expect(findDefect(row(overrides), ctx)).toMatchObject({ type, reason });
  });

  it("flags dates older than the watermark as late-arriving, only when a watermark is set", () => {
    const old = row({ logged_at: "2026-09-01" });
    expect(findDefect(old, ctx)).toBeNull();
    expect(findDefect(old, { ...ctx, watermark: WATERMARK })).toMatchObject({
      type: "late-arriving",
      reason: "logged_at 2026-09-01 is older than the watermark 2026-09-23",
    });
    expect(findDefect(row({ logged_at: WATERMARK }), { ...ctx, watermark: WATERMARK })).toBeNull();
  });

  it("reports missing columns as schema drift", () => {
    const fields = row().filter((f) => f.key !== "site");
    expect(findDefect(fields, ctx)?.type).toBe("schema-drift");
  });
});
