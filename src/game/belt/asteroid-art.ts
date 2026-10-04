const SIZE = 16;
const BASE_RADIUS = 6.2;
const WOBBLE = 1.6;
const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_MOD = 2 ** 32;

/** Tiny seeded PRNG so each asteroid always looks the same. */
function rng(seed: number): () => number {
  let s = (seed * 2654435761) % LCG_MOD;
  return () => {
    s = (s * LCG_A + LCG_C) % LCG_MOD;
    return s / LCG_MOD;
  };
}

/**
 * A lumpy 16x16 pixel rock. "#" = rock, "o" = crater, "a" = lit edge (accent), "." = empty.
 * Deterministic for a given seed.
 */
export function asteroidRows(seed: number): string[] {
  const rand = rng(seed);
  const lumps = Array.from({ length: 8 }, () => (rand() - 0.5) * 2 * WOBBLE);
  const c = (SIZE - 1) / 2;
  const grid: string[][] = [];
  for (let y = 0; y < SIZE; y++) {
    const row: string[] = [];
    for (let x = 0; x < SIZE; x++) {
      const dx = x - c;
      const dy = y - c;
      const angle = Math.atan2(dy, dx) + Math.PI;
      const lump = lumps[Math.floor((angle / (2 * Math.PI)) * lumps.length) % lumps.length] ?? 0;
      row.push(Math.hypot(dx, dy) <= BASE_RADIUS + lump ? "#" : ".");
    }
    grid.push(row);
  }
  // Craters: a few 2x2 dents inside the rock.
  for (let n = 0; n < 3; n++) {
    const cx = 4 + Math.floor(rand() * 7);
    const cy = 4 + Math.floor(rand() * 7);
    for (const [ox, oy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const) {
      if (grid[cy + oy]?.[cx + ox] === "#") grid[cy + oy]![cx + ox] = "o";
    }
  }
  // Lit edge: rock pixels whose upper-left neighbour is empty.
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid[y]![x] === "#" && (grid[y - 1]?.[x] === "." || grid[y]?.[x - 1] === "."))
        grid[y]![x] = "a";
    }
  }
  return grid.map((r) => r.join(""));
}
