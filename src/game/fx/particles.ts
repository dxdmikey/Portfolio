/**
 * Pixel particle simulation for the FX layer. Framework-free and allocation-free after
 * construction: particles live in typed arrays and dead ones are swap-removed, so the
 * live set is always the first `count` slots.
 */
import { createRng, type Rng } from "@/lib/rng";

export interface BurstSpec {
  count: number;
  /** Initial speed range in px/s. */
  speedMin: number;
  speedMax: number;
  /** Lifetime range in seconds. */
  lifeMin: number;
  lifeMax: number;
  /** Square size range in px. */
  sizeMin: number;
  sizeMax: number;
  /** Downward acceleration px/s² (negative = rises, like smoke). */
  gravity: number;
  /** Fraction of velocity kept per second (0–1). */
  drag: number;
  /** Extra upward kick in px/s added to every particle. */
  lift: number;
  /** How many palette colours to cycle through (1 = single accent). */
  colors: number;
}

export const BURST: BurstSpec = {
  count: 16,
  speedMin: 80,
  speedMax: 220,
  lifeMin: 0.4,
  lifeMax: 0.75,
  sizeMin: 3,
  sizeMax: 5,
  gravity: 420,
  drag: 0.2,
  lift: 60,
  colors: 1,
};

/** The tiny burst every button/link click gets. */
export const SPARK: BurstSpec = {
  ...BURST,
  count: 7,
  speedMin: 60,
  speedMax: 140,
  lifeMax: 0.45,
  sizeMax: 4,
};

export const CONFETTI: BurstSpec = {
  count: 70,
  speedMin: 160,
  speedMax: 420,
  lifeMin: 0.9,
  lifeMax: 1.6,
  sizeMin: 3,
  sizeMax: 6,
  gravity: 520,
  drag: 0.35,
  lift: 220,
  colors: 4,
};

/** Tiny weightless sparkles for a background "star ping". */
export const STARDUST: BurstSpec = {
  count: 8,
  speedMin: 40,
  speedMax: 130,
  lifeMin: 0.3,
  lifeMax: 0.6,
  sizeMin: 2,
  sizeMax: 3,
  gravity: 0,
  drag: 0.05,
  lift: 0,
  colors: 1,
};

/** Lingering puffs for the rocket launch. */
export const SMOKE: BurstSpec = {
  count: 24,
  speedMin: 30,
  speedMax: 120,
  lifeMin: 0.8,
  lifeMax: 1.4,
  sizeMin: 5,
  sizeMax: 9,
  gravity: -40,
  drag: 0.15,
  lift: 0,
  colors: 1,
};

const TAU = Math.PI * 2;

export class ParticleSystem {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly life: Float32Array;
  readonly maxLife: Float32Array;
  readonly size: Float32Array;
  readonly gravity: Float32Array;
  readonly drag: Float32Array;
  /** Palette index per particle (the caller maps it to a colour). */
  readonly color: Uint8Array;
  private live = 0;
  private readonly rng: Rng;

  constructor(
    readonly capacity: number,
    seed = Date.now(),
  ) {
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.gravity = new Float32Array(capacity);
    this.drag = new Float32Array(capacity);
    this.color = new Uint8Array(capacity);
    this.rng = createRng(seed);
  }

  get count(): number {
    return this.live;
  }

  /**
   * Spawns a radial burst. `colorBase` is the first palette index; with `spec.colors > 1`
   * particles cycle through consecutive indices. Extra particles past capacity are dropped.
   */
  spawn(spec: BurstSpec, x: number, y: number, colorBase = 0): number {
    const r = this.rng;
    const n = Math.min(spec.count, this.capacity - this.live);
    for (let k = 0; k < n; k++) {
      const i = this.live++;
      const angle = r.next() * TAU;
      const speed = r.range(spec.speedMin, spec.speedMax);
      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = Math.cos(angle) * speed;
      this.vy[i] = Math.sin(angle) * speed - spec.lift;
      this.maxLife[i] = r.range(spec.lifeMin, spec.lifeMax);
      this.life[i] = this.maxLife[i]!;
      this.size[i] = Math.round(r.range(spec.sizeMin, spec.sizeMax));
      this.gravity[i] = spec.gravity;
      this.drag[i] = spec.drag;
      this.color[i] = colorBase + (spec.colors > 1 ? k % spec.colors : 0);
    }
    return n;
  }

  /** Advances the simulation by `dt` seconds and removes expired particles. */
  step(dt: number): void {
    let i = 0;
    while (i < this.live) {
      const life = this.life[i]! - dt;
      if (life <= 0) {
        this.remove(i);
        continue;
      }
      this.life[i] = life;
      const keep = Math.pow(this.drag[i]!, dt);
      this.vx[i] = this.vx[i]! * keep;
      this.vy[i] = this.vy[i]! * keep + this.gravity[i]! * dt;
      this.x[i] = this.x[i]! + this.vx[i]! * dt;
      this.y[i] = this.y[i]! + this.vy[i]! * dt;
      i++;
    }
  }

  /** Remaining life as 0–1, for fading. */
  fade(i: number): number {
    const max = this.maxLife[i]!;
    return max > 0 ? this.life[i]! / max : 0;
  }

  clear(): void {
    this.live = 0;
  }

  private remove(i: number): void {
    const last = --this.live;
    if (i === last) return;
    this.x[i] = this.x[last]!;
    this.y[i] = this.y[last]!;
    this.vx[i] = this.vx[last]!;
    this.vy[i] = this.vy[last]!;
    this.life[i] = this.life[last]!;
    this.maxLife[i] = this.maxLife[last]!;
    this.size[i] = this.size[last]!;
    this.gravity[i] = this.gravity[last]!;
    this.drag[i] = this.drag[last]!;
    this.color[i] = this.color[last]!;
  }
}
