/**
 * NOVA's timing, shared by the director (how long a line holds the stage) and the
 * typewriter (how fast it is revealed), so the two can never drift apart.
 */

/** Typewriter speed: milliseconds per revealed character. */
export const NOVA_TYPE_MS_PER_CHAR = 28;
/** After typing finishes, everyone gets at least this long to read. */
export const NOVA_READ_BASE_MS = 1600;
/** ...plus this much per character (about 40 characters a second, a relaxed reading pace). */
export const NOVA_READ_MS_PER_CHAR = 25;
/** A line never holds the stage for less than this... */
export const NOVA_MIN_HOLD_MS = 2000;
/** ...or more than this, so a long line can't block the queue forever. */
export const NOVA_MAX_HOLD_MS = 9000;

export interface HoldTiming {
  typeMsPerChar: number;
  readBaseMs: number;
  readMsPerChar: number;
  minHoldMs: number;
  maxHoldMs: number;
}

export const DEFAULT_HOLD_TIMING: HoldTiming = {
  typeMsPerChar: NOVA_TYPE_MS_PER_CHAR,
  readBaseMs: NOVA_READ_BASE_MS,
  readMsPerChar: NOVA_READ_MS_PER_CHAR,
  minHoldMs: NOVA_MIN_HOLD_MS,
  maxHoldMs: NOVA_MAX_HOLD_MS,
};

/** Characters as the typewriter counts them (code points, so an emoji is one). */
export const charCount = (text: string): number => Array.from(text).length;

/** Typing time + reading time, clamped. */
export function holdMsFor(text: string, t: HoldTiming): number {
  const n = charCount(text);
  const raw = n * t.typeMsPerChar + t.readBaseMs + n * t.readMsPerChar;
  return Math.min(t.maxHoldMs, Math.max(t.minHoldMs, raw));
}
