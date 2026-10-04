/**
 * Breaks a pixel-art rock into shards: a seeded Voronoi split of its solid pixels. Each
 * shard keeps the rock's own characters (rock, crater, lit edge), so laid back together
 * the shards redraw the original exactly. Big shards carry a second split for mid-flight
 * breakage. Pure and deterministic: the same rows and seed always give the same shards.
 */
import { createRng, type Rng } from "@/lib/rng";

export type Pixel = readonly [x: number, y: number];

export interface Shard {
  /** Same size as the source rows; this shard's pixels keep their char, the rest are empty. */
  rows: readonly string[];
  pixels: readonly Pixel[];
  /** Centroid in grid units (pixel centres). */
  cx: number;
  cy: number;
  /** Unit vector from the rock's centre towards this shard (its flight direction). */
  dx: number;
  dy: number;
  /** Seeded 0–1 value for per-shard variety (speed, spin) in the presentation. */
  jitter: number;
  /** Second-generation pieces partitioning `pixels`; empty for small shards. */
  children: readonly Shard[];
}

export const EMPTY = ".";
export const SHARDS_MIN = 5;
export const SHARDS_MAX = 7;
/** Shards with at least this many pixels split again into 2–3 pieces. */
export const SPLIT_MIN_PIXELS = 18;
const SUB_MIN = 2;
const SUB_MAX = 3;
/** Seed points sit on a ring at this share of the rock's radius (± spread), one per sector. */
const SEED_RING = 0.55;
const SEED_SPREAD = 0.3;
const SECTOR_JITTER = 0.35;
const TAU = Math.PI * 2;
/** Below this length a direction is "no direction"; fall back to a seeded angle. */
const MIN_LEN = 1e-6;

function solidPixels(rows: readonly string[]): Pixel[] {
  const out: Pixel[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== EMPTY && out.push([x, y])));
  return out;
}

function centroid(pixels: readonly Pixel[]): [number, number] {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of pixels) {
    sx += x;
    sy += y;
  }
  return [sx / pixels.length, sy / pixels.length];
}

const dist2 = (a: Pixel, x: number, y: number) => (a[0] - x) ** 2 + (a[1] - y) ** 2;

/** Picks `k` distinct seed pixels spread around the centre, one per angular sector. */
function pickSeeds(rng: Rng, pixels: readonly Pixel[], k: number): Pixel[] {
  const [cx, cy] = centroid(pixels);
  const radius = Math.sqrt(Math.max(...pixels.map((p) => dist2(p, cx, cy))));
  const base = rng.next() * TAU;
  const seeds: Pixel[] = [];
  for (let i = 0; i < k; i++) {
    const a = base + ((i + (rng.next() - 0.5) * SECTOR_JITTER) / k) * TAU;
    const r = radius * (SEED_RING + (rng.next() - 0.5) * SEED_SPREAD);
    const tx = cx + Math.cos(a) * r;
    const ty = cy + Math.sin(a) * r;
    let best: Pixel | null = null;
    for (const p of pixels) {
      if (seeds.includes(p)) continue;
      if (!best || dist2(p, tx, ty) < dist2(best, tx, ty)) best = p;
    }
    if (best) seeds.push(best);
  }
  return seeds;
}

/** Assigns every pixel to its nearest seed (ties go to the lower index). */
function voronoi(pixels: readonly Pixel[], seeds: readonly Pixel[]): Pixel[][] {
  const cells: Pixel[][] = seeds.map(() => []);
  for (const p of pixels) {
    let best = 0;
    for (let i = 1; i < seeds.length; i++)
      if (dist2(seeds[i]!, p[0], p[1]) < dist2(seeds[best]!, p[0], p[1])) best = i;
    cells[best]!.push(p);
  }
  return cells.filter((c) => c.length > 0);
}

function shardRows(rows: readonly string[], pixels: readonly Pixel[]): string[] {
  const grid = rows.map((r) => Array.from({ length: r.length }, () => EMPTY));
  for (const [x, y] of pixels) grid[y]![x] = rows[y]![x]!;
  return grid.map((r) => r.join(""));
}

function makeShard(
  rng: Rng,
  rows: readonly string[],
  pixels: Pixel[],
  origin: [number, number],
  depth: number,
): Shard {
  const [cx, cy] = centroid(pixels);
  let dx = cx - origin[0];
  let dy = cy - origin[1];
  let len = Math.hypot(dx, dy);
  if (len < MIN_LEN) {
    const a = rng.next() * TAU;
    [dx, dy, len] = [Math.cos(a), Math.sin(a), 1];
  }
  const jitter = rng.next();
  const splits = depth === 0 && pixels.length >= SPLIT_MIN_PIXELS;
  const children = splits
    ? split(
        rng,
        rows,
        pixels,
        SUB_MIN + Math.floor(rng.next() * (SUB_MAX - SUB_MIN + 1)),
        [cx, cy],
        1,
      )
    : [];
  return {
    rows: shardRows(rows, pixels),
    pixels,
    cx,
    cy,
    dx: dx / len,
    dy: dy / len,
    jitter,
    children,
  };
}

function split(
  rng: Rng,
  rows: readonly string[],
  pixels: readonly Pixel[],
  k: number,
  origin: [number, number],
  depth: number,
) {
  const cells = voronoi(pixels, pickSeeds(rng, pixels, Math.min(k, pixels.length)));
  return cells.map((cell) => makeShard(rng, rows, cell, origin, depth));
}

/** Splits `rows` into 5–7 shards (deterministic for `seed`); big ones carry 2–3 children. */
export function fracture(rows: readonly string[], seed: number): Shard[] {
  const rng = createRng(seed);
  const pixels = solidPixels(rows);
  if (pixels.length === 0) return [];
  const k = SHARDS_MIN + Math.floor(rng.next() * (SHARDS_MAX - SHARDS_MIN + 1));
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  return split(rng, rows, pixels, k, [(width - 1) / 2, (height - 1) / 2], 0);
}
