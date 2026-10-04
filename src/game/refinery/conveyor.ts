/**
 * Pure timing model for the conveyor (and the incident clock). The caller injects `now`
 * (e.g. `performance.now()`), so it is deterministic under test. Pausing (tab hidden, game
 * scrolled off-screen) freezes elapsed time without losing progress.
 */
export interface Stopwatch {
  durationMs: number;
  startedAt: number;
  /** Set while paused. */
  pausedAt: number | null;
  /** Total time spent paused so far. */
  pausedMs: number;
}

/** Where a record rests in relaxed mode (no timers): the middle of the belt. */
export const RELAXED_HOLD = 0.5;

export function startStopwatch(durationMs: number, now: number): Stopwatch {
  return { durationMs, startedAt: now, pausedAt: null, pausedMs: 0 };
}

export function pauseStopwatch(sw: Stopwatch, now: number): Stopwatch {
  return sw.pausedAt === null ? { ...sw, pausedAt: now } : sw;
}

export function resumeStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.pausedAt === null) return sw;
  return { ...sw, pausedAt: null, pausedMs: sw.pausedMs + Math.max(0, now - sw.pausedAt) };
}

export function isPaused(sw: Stopwatch): boolean {
  return sw.pausedAt !== null;
}

export function elapsedMs(sw: Stopwatch, now: number): number {
  const end = sw.pausedAt ?? now;
  return Math.max(0, end - sw.startedAt - sw.pausedMs);
}

/** 0 at the start of the belt, 1 at the end. */
export function progress(sw: Stopwatch, now: number): number {
  if (sw.durationMs <= 0) return 1;
  return Math.min(1, elapsedMs(sw, now) / sw.durationMs);
}

export function remainingMs(sw: Stopwatch, now: number): number {
  return Math.max(0, sw.durationMs - elapsedMs(sw, now));
}

/** True once the record reached the end of the belt (it "slipped" past the gate). */
export function isExpired(sw: Stopwatch, now: number): boolean {
  return elapsedMs(sw, now) >= sw.durationMs;
}

/** Belt position to draw: follows the clock, or rests at the hold point in relaxed mode. */
export function beltPosition(sw: Stopwatch | null, now: number, relaxed: boolean): number {
  if (relaxed || sw === null) return RELAXED_HOLD;
  return progress(sw, now);
}
