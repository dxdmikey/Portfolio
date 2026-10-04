/**
 * Classic Web Audio lookahead scheduler: a coarse timer (setInterval) wakes up often and
 * schedules every step that falls inside a short horizon on the precise audio clock.
 * Clock and timer are injected so tests can drive it with a fake clock.
 */

export interface SchedulerClock {
  /** Current audio time in seconds. */
  now(): number;
}

export interface SchedulerTimer {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export const browserTimer: SchedulerTimer = {
  set: (fn, ms) => setInterval(fn, ms),
  clear: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export const TICK_MS = 25;
export const HORIZON_S = 0.12;
/** If the timer stalls longer than this (throttled tab), skip ahead instead of bursting notes. */
export const MAX_LAG_S = 0.25;
/** Lead time used when re-syncing after a stall. */
const RESYNC_LEAD_S = 0.02;

export type StepHandler = (step: number, time: number) => void;

export class LookaheadScheduler {
  private handle: unknown = null;
  private nextStep = 0;
  private nextTime = 0;

  constructor(
    private readonly clock: SchedulerClock,
    private readonly onStep: StepHandler,
    private readonly stepSeconds: number,
    private readonly timer: SchedulerTimer = browserTimer,
  ) {}

  get running(): boolean {
    return this.handle !== null;
  }

  /** The next step that will be scheduled (resume from here after `stop`). */
  get position(): number {
    return this.nextStep;
  }

  start(step: number, at: number): void {
    this.stop();
    this.nextStep = step;
    this.nextTime = at;
    this.handle = this.timer.set(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop(): void {
    if (this.handle === null) return;
    this.timer.clear(this.handle);
    this.handle = null;
  }

  tick(): void {
    if (this.handle === null) return;
    const now = this.clock.now();
    if (this.nextTime < now - MAX_LAG_S) this.nextTime = now + RESYNC_LEAD_S;
    while (this.nextTime < now + HORIZON_S) {
      this.onStep(this.nextStep, this.nextTime);
      this.nextStep++;
      this.nextTime += this.stepSeconds;
    }
  }
}
