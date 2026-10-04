/** Seedable RNG (mulberry32). Deterministic, so tests can replay a game exactly. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  range(min: number, max: number): number;
  /** Current internal state — store it to resume the sequence later. */
  readonly state: number;
}

const UINT32 = 4294967296;

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    get state() {
      return s;
    },
  };
}
