/**
 * NOVA's director: decides which line the co-pilot says, and when.
 *
 * Rules
 * - Priority: direct > result > discovery > chapter > idle.
 * - A line holds the stage for its typing time plus a reading buffer (see `timing.ts`).
 *   While held, a strictly higher-priority line interrupts; anything else waits in the queue.
 * - Chapter lines follow the visitor: a chapter line for a *different* chapter interrupts a
 *   chapter/idle line on stage and drops every queued idle line and every queued chapter line
 *   for another chapter. A stale "welcome to chapter 2" is never said once you're in chapter 5.
 * - Every line is said at most once per session unless it is `repeatable`.
 * - The queue is short and sorted by priority. When it overflows, the lowest-priority line goes,
 *   but never the current chapter's line.
 *
 * Framework-free: the clock is injected, so tests drive time by hand.
 */

import { DEFAULT_HOLD_TIMING, holdMsFor, type HoldTiming } from "./timing";

export type NovaPriority = "idle" | "chapter" | "discovery" | "result" | "direct";

const RANK: Record<NovaPriority, number> = {
  idle: 0,
  chapter: 1,
  discovery: 2,
  result: 3,
  direct: 4,
};

/** Queued lines of these priorities are replaced by a newer line of the same priority. */
const SUPERSEDING: ReadonlySet<NovaPriority> = new Set(["chapter", "idle"]);
/** Lines a new chapter may cut off mid-sentence. */
const SOFT: ReadonlySet<NovaPriority> = new Set(["chapter", "idle"]);

export interface NovaLine {
  text: string;
  priority: NovaPriority;
  /** Skip the once-per-session rule (e.g. "upstream first!" hints). */
  repeatable?: boolean;
  /** The chapter a `chapter` line belongs to; entering another chapter makes it stale. */
  chapter?: string;
  /** Extra texts recorded as said along with this line (a merged greeting, a revisit template). */
  marks?: readonly string[];
}

export interface DirectorOptions {
  now: () => number;
  /** Override parts of the hold-time formula (tests use round numbers). */
  timing?: Partial<HoldTiming>;
  maxQueue?: number;
}

export const NOVA_MAX_QUEUE = 3;

export class NovaDirector {
  private readonly spoken = new Set<string>();
  private queue: NovaLine[] = [];
  private current: { line: NovaLine; until: number } | null = null;
  private chapter: string | null = null;
  private readonly now: () => number;
  private timing: HoldTiming;
  private readonly maxQueue: number;

  constructor({ now, timing, maxQueue = NOVA_MAX_QUEUE }: DirectorOptions) {
    this.now = now;
    this.timing = { ...DEFAULT_HOLD_TIMING, ...timing };
    this.maxQueue = maxQueue;
  }

  /** Reduced motion types instantly, so the hold drops the typing time. */
  setTypingSpeed(msPerChar: number): void {
    this.timing = { ...this.timing, typeMsPerChar: msPerChar };
  }

  /** How long a line keeps the stage before the next one may play. */
  holdMs(line: NovaLine): number {
    return holdMsFor(line.text, this.timing);
  }

  /** True while the current line still holds the stage. */
  get busy(): boolean {
    return this.current !== null && this.now() < this.current.until;
  }

  get queued(): readonly NovaLine[] {
    return this.queue;
  }

  /** The chapter NOVA believes the visitor is in (the latest chapter line offered). */
  get currentChapter(): string | null {
    return this.chapter;
  }

  hasSpoken(text: string): boolean {
    return this.spoken.has(text);
  }

  /**
   * Offer a line. Returns it if NOVA should say it right now, or null if it was
   * queued or dropped. Call `next()` once `msUntilNext()` has passed to drain the queue.
   */
  push(line: NovaLine): NovaLine | null {
    if (!line.text) return null;
    if (!line.repeatable && this.spoken.has(line.text)) return null;
    if (this.busy && this.current?.line.text === line.text) return null;
    if (line.priority === "chapter") return this.pushChapter(line);
    if (!this.busy || RANK[line.priority] > RANK[this.current?.line.priority ?? "idle"]) {
      return this.speak(line);
    }
    this.enqueue(line);
    return null;
  }

  /** Say something now regardless of the cooldown (the visitor clicked NOVA). */
  force(line: NovaLine): NovaLine {
    return this.speak(line);
  }

  /** The next queued line, if the stage is free. Stale chapter lines are skipped. */
  next(): NovaLine | null {
    if (this.busy) return null;
    let line = this.queue.shift();
    while (line && this.isStale(line)) line = this.queue.shift();
    return line ? this.speak(line) : null;
  }

  /** Milliseconds until `next()` can return something; null when the queue is empty. */
  msUntilNext(): number | null {
    if (this.queue.length === 0) return null;
    return this.current ? Math.max(0, this.current.until - this.now()) : 0;
  }

  /** First line from `pool` not yet said this session (null when all are used). */
  pickUnspoken(pool: readonly string[]): string | null {
    return pool.find((t) => !this.spoken.has(t)) ?? null;
  }

  /** Like `pickUnspoken`, but starts the pool over once every line has been said. */
  pickCycling(pool: readonly string[]): string | null {
    const fresh = this.pickUnspoken(pool);
    if (fresh !== null || pool.length === 0) return fresh;
    pool.forEach((t) => this.spoken.delete(t));
    return pool[0] ?? null;
  }

  private pushChapter(line: NovaLine): NovaLine | null {
    this.chapter = line.chapter ?? this.chapter;
    this.queue = this.queue.filter((q) => q.priority !== "idle" && !this.isStale(q));
    const on = this.current?.line;
    if (!this.busy || (on && SOFT.has(on.priority) && on.chapter !== line.chapter)) return this.speak(line);
    this.enqueue(line);
    return null;
  }

  private isStale(line: NovaLine): boolean {
    return line.priority === "chapter" && line.chapter !== undefined && line.chapter !== this.chapter;
  }

  private speak(line: NovaLine): NovaLine {
    this.spoken.add(line.text);
    line.marks?.forEach((m) => this.spoken.add(m));
    this.queue = this.queue.filter((q) => q.text !== line.text);
    this.current = { line, until: this.now() + this.holdMs(line) };
    return line;
  }

  private enqueue(line: NovaLine): void {
    if (this.queue.some((q) => q.text === line.text)) return;
    const kept = SUPERSEDING.has(line.priority) ? this.queue.filter((q) => q.priority !== line.priority) : this.queue;
    // Stable insert: after every queued line of equal or higher priority.
    const at = kept.findIndex((q) => RANK[q.priority] < RANK[line.priority]);
    const next = at === -1 ? [...kept, line] : [...kept.slice(0, at), line, ...kept.slice(at)];
    while (next.length > this.maxQueue) {
      // Drop the lowest-priority line, sparing the line for the chapter the visitor is in.
      const spare = (q: NovaLine) => q.priority === "chapter" && q.chapter === this.chapter;
      const drop = next.findLastIndex((q) => !spare(q));
      next.splice(drop === -1 ? next.length - 1 : drop, 1);
    }
    this.queue = next;
  }
}
