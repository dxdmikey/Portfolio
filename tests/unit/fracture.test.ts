import { describe, expect, it } from "vitest";
import { asteroidRows } from "@/game/belt/asteroid-art";
import {
  EMPTY,
  fracture,
  SHARDS_MAX,
  SHARDS_MIN,
  SPLIT_MIN_PIXELS,
  type Shard,
} from "@/game/belt/fracture";

const SEEDS = [1, 7, 42, 99, 1234, 2024, 31337];

const key = ([x, y]: readonly [number, number]) => `${x},${y}`;

function solid(rows: readonly string[]): string[] {
  const out: string[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== EMPTY && out.push(`${x},${y}`)));
  return out;
}

function expectPartition(pieces: readonly Shard[], expected: readonly string[]) {
  const seen = pieces.flatMap((s) => s.pixels.map(key));
  expect(seen.length).toBe(expected.length);
  expect(new Set(seen).size).toBe(seen.length);
  expect(new Set(seen)).toEqual(new Set(expected));
}

describe("fracture", () => {
  it.each(SEEDS)("splits asteroid %i into 5–7 shards that partition its pixels exactly", (seed) => {
    const rows = asteroidRows(seed);
    const shards = fracture(rows, seed);
    expect(shards.length).toBeGreaterThanOrEqual(SHARDS_MIN);
    expect(shards.length).toBeLessThanOrEqual(SHARDS_MAX);
    expectPartition(shards, solid(rows));
  });

  it.each(SEEDS)("keeps the rock's characters, so the shards redraw asteroid %i", (seed) => {
    const rows = asteroidRows(seed);
    const shards = fracture(rows, seed);
    const merged = rows.map((row, y) =>
      [...row]
        .map((_, x) => shards.find((s) => s.rows[y]![x] !== EMPTY)?.rows[y]![x] ?? EMPTY)
        .join(""),
    );
    expect(merged).toEqual(rows);
  });

  it("splits big shards again into 2–3 children that partition the parent", () => {
    const shards = SEEDS.flatMap((seed) => fracture(asteroidRows(seed), seed));
    const big = shards.filter((s) => s.pixels.length >= SPLIT_MIN_PIXELS);
    expect(big.length).toBeGreaterThan(0);
    for (const s of shards) {
      if (s.pixels.length < SPLIT_MIN_PIXELS) {
        expect(s.children).toHaveLength(0);
        continue;
      }
      expect(s.children.length).toBeGreaterThanOrEqual(2);
      expect(s.children.length).toBeLessThanOrEqual(3);
      expectPartition(s.children, s.pixels.map(key));
      s.children.forEach((c) => expect(c.children).toHaveLength(0));
    }
  });

  it("is deterministic for a seed and varies across seeds", () => {
    const rows = asteroidRows(5);
    expect(fracture(rows, 5)).toEqual(fracture(rows, 5));
    expect(fracture(rows, 5)).not.toEqual(fracture(rows, 6));
  });

  it("points each shard outward with a unit direction", () => {
    for (const s of fracture(asteroidRows(42), 42)) {
      expect(Math.hypot(s.dx, s.dy)).toBeCloseTo(1);
      expect(s.jitter).toBeGreaterThanOrEqual(0);
      expect(s.jitter).toBeLessThan(1);
    }
  });

  it("returns nothing for an empty grid", () => {
    expect(fracture(["....", "...."], 1)).toEqual([]);
  });
});
