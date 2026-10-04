import { chapterPosition } from "./interpolate";

/**
 * Which chapter is the visitor in? Framework-free so the timing rules are unit-testable.
 *
 * - `activeChapterIndex` reads it live from the scroll position (viewport-centre probe, the same
 *   one the sky uses). It is never "nothing": above the first chapter it is chapter 0.
 * - `ChapterSettler` decides when to *announce* a chapter: only once scrolling has been quiet for
 *   `settleMs`, and only when it differs from the last announcement. A fast scroll (or a smooth
 *   scroll jump from the HUD) through five chapters therefore announces just the one you land on.
 */

/** Quiet time after the last scroll before the chapter you're in is announced. */
export const SPY_SETTLE_MS = 200;

/** Within this many pixels of the page bottom counts as "at the bottom". */
export const SPY_BOTTOM_SLACK_PX = 4;

/**
 * Index of the chapter under the viewport centre, in `[0, tops.length - 1]`.
 * Pass the document's `scrollHeight` so that hitting the bottom of the page selects the last
 * chapter even when it is too short to ever reach the viewport centre.
 */
export function activeChapterIndex(
  scrollY: number,
  viewportHeight: number,
  tops: readonly number[],
  scrollHeight = Number.POSITIVE_INFINITY,
): number {
  if (tops.length === 0) return 0;
  const last = tops.length - 1;
  const lastTop = tops[last] ?? 0;
  const atBottom = scrollY + viewportHeight >= scrollHeight - SPY_BOTTOM_SLACK_PX;
  if (atBottom && lastTop < scrollY + viewportHeight) return last;
  const i = Math.floor(chapterPosition(scrollY, viewportHeight, tops));
  return Math.min(last, Math.max(0, i));
}

export class ChapterSettler {
  private pending: number | null = null;
  private movedAt = Number.NEGATIVE_INFINITY;
  private announced: number | null = null;

  constructor(private readonly settleMs: number = SPY_SETTLE_MS) {}

  /** Record the chapter under the probe after a scroll (or layout change) at time `now`. */
  observe(index: number, now: number): void {
    this.pending = index;
    this.movedAt = now;
  }

  /** Milliseconds until `settle()` may announce; 0 = now; null when nothing is pending. */
  msUntilSettled(now: number): number | null {
    if (this.pending === null) return null;
    return Math.max(0, this.movedAt + this.settleMs - now);
  }

  /** The chapter to announce, once scrolling has settled and only if it changed. */
  settle(now: number): number | null {
    if (this.msUntilSettled(now) !== 0) return null;
    const index = this.pending;
    this.pending = null;
    if (index === null || index === this.announced) return null;
    this.announced = index;
    return index;
  }
}
