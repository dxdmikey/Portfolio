/**
 * Light state for the pixel station in the sky, fed by CH4's `station:power` and
 * `station:sync` bus events. Framework-free: the sky layer reads it while drawing, and the
 * sky loop subscribes so it can redraw (and run at full rate during the sync cascade).
 * Times are in seconds on any monotonic clock (the loop uses `performance.now() / 1000`).
 */
export const CASCADE_S = 1.4;
/**
 * The sync also calls the station into view (whatever the scene's own station opacity is: the
 * finale sits where the sky is already blending into CH5). It fades in, stays for the cascade
 * plus a beat, then hands back to the scene.
 */
export const PRESENCE_IN_S = 0.3;
export const PRESENCE_HOLD_S = CASCADE_S + 2.2;
export const PRESENCE_OUT_S = 0.8;
/** Width of the sweep's bright band, as a share of the station (0–1). */
const SWEEP_BAND = 0.18;
/** The sweep starts and ends a band outside the station so edge lights flash fully. */
const SWEEP_SPAN = 1 + SWEEP_BAND * 2;

type Listener = () => void;

export class StationLights {
  private online = 0;
  private total = 0;
  private synced = false;
  private cascadeStart = Number.NEGATIVE_INFINITY;
  private readonly listeners = new Set<Listener>();

  /** Share of modules online, 0–1 (1 once synced). */
  get level(): number {
    if (this.synced) return 1;
    return this.total > 0 ? Math.min(1, Math.max(0, this.online / this.total)) : 0;
  }

  /** How many of `n` lights are on. */
  litCount(n: number): number {
    return Math.round(this.level * n);
  }

  setPower(online: number, total: number): void {
    this.online = online;
    this.total = total;
    // A reset (or any drop below full) means the pipeline hasn't synced on this run.
    if (online < total) {
      this.synced = false;
      this.cascadeStart = Number.NEGATIVE_INFINITY;
    }
    this.emit();
  }

  /** Sync finished: everything lights up. `animate` false (reduced motion) skips the cascade. */
  sync(now: number, animate: boolean): void {
    this.synced = true;
    this.cascadeStart = animate ? now : Number.NEGATIVE_INFINITY;
    this.emit();
  }

  /** Cascade progress 0–1 while it runs, otherwise -1. */
  cascade(now: number): number {
    const t = (now - this.cascadeStart) / CASCADE_S;
    return t >= 0 && t < 1 ? t : -1;
  }

  /** Extra station opacity 0–1 summoned by the sync (0 outside it and under reduced motion). */
  presence(now: number): number {
    const t = now - this.cascadeStart;
    if (!(t >= 0)) return 0;
    if (t < PRESENCE_IN_S) return t / PRESENCE_IN_S;
    if (t < PRESENCE_HOLD_S) return 1;
    return Math.max(0, 1 - (t - PRESENCE_HOLD_S) / PRESENCE_OUT_S);
  }

  /** Something is animating (cascade or the station's visit): the sky should run full rate. */
  busy(now: number): boolean {
    return this.cascade(now) >= 0 || this.presence(now) > 0;
  }

  /** Flash intensity 0–1 for a light at horizontal position `u` (0 = left edge, 1 = right). */
  flash(u: number, now: number): number {
    const t = this.cascade(now);
    if (t < 0) return 0;
    const sweep = t * SWEEP_SPAN - SWEEP_BAND;
    return Math.max(0, 1 - Math.abs(u - sweep) / SWEEP_BAND);
  }

  /** Whole-station glow pulse 0–1 (rises and falls over the cascade). */
  pulse(now: number): number {
    const t = this.cascade(now);
    return t < 0 ? 0 : Math.sin(t * Math.PI);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }
}
