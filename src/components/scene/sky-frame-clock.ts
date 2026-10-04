const MS_PER_S = 1000;
const MAX_DT_S = 0.1;
/** Full frame rate for this long after the last activity (scroll). */
const ACTIVE_MS = 400;
/** Active frames are capped near 60fps (120Hz phones would otherwise draw twice as often). */
const MIN_FRAME_MS = 15;
/** Idle cadence (~11fps): slow twinkle, drift and shooting stars without burning a full frame rate. */
const IDLE_FRAME_MS = 90;

interface SkyFrameClockOptions {
  /** Draw one frame. `time`/`dt` are animation seconds, `now` wall-clock seconds. */
  draw: (time: number, dt: number, now: number) => void;
  /** May frames run at all (started, motion allowed, tab visible, story mode)? */
  canRun: () => boolean;
  /** Something event-driven is animating (the station sync): stay at full rate. */
  busy: (nowS: number) => boolean;
}

/**
 * Frame pacing for the sky: requestAnimationFrame at up to ~60fps while the visitor scrolls
 * (or while `busy`), then a slow idle cadence. Framework-free; the hook wires DOM events to it.
 */
export class SkyFrameClock {
  private raf = 0;
  private idle = 0;
  private last = 0;
  private lastActive = 0;
  private time = 0;

  constructor(private readonly opts: SkyFrameClockOptions) {}

  /** Animation seconds so far (frozen while stopped). */
  get elapsed(): number {
    return this.time;
  }

  /** Visitor activity (scroll): go full rate now. */
  poke(): void {
    this.lastActive = performance.now();
    this.wake();
  }

  /** Drop any idle wait and schedule the next frame right away. */
  wake(): void {
    this.clearIdle();
    this.schedule();
  }

  schedule(): void {
    if (this.raf || this.idle || !this.opts.canRun()) return;
    const now = performance.now();
    if (now - this.lastActive < ACTIVE_MS || this.opts.busy(now / MS_PER_S)) {
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    this.idle = window.setTimeout(() => {
      this.idle = 0;
      this.raf = requestAnimationFrame(this.tick);
    }, IDLE_FRAME_MS);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.clearIdle();
    this.raf = 0;
    this.last = 0;
  }

  private readonly tick = (now: number) => {
    this.raf = 0;
    if (this.last && now - this.last < MIN_FRAME_MS) {
      this.schedule();
      return;
    }
    const dt = this.last ? Math.min((now - this.last) / MS_PER_S, MAX_DT_S) : 0;
    this.last = now;
    this.time += dt;
    this.opts.draw(this.time, dt, now / MS_PER_S);
    this.schedule();
  };

  private clearIdle(): void {
    window.clearTimeout(this.idle);
    this.idle = 0;
  }
}
