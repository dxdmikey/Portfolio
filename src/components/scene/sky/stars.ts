import { createRng } from "@/lib/rng";
import { wrap, type SkyFrame } from "./sky-types";

interface StarDepth {
  /** Stars per 1,000 low-res px². */
  density: number;
  size: number;
  alpha: number;
  /** Horizontal drift in px/s. */
  drift: number;
  /** Fraction of scroll this depth moves. */
  parallax: number;
}

const DEPTHS: readonly StarDepth[] = [
  { density: 1.6, size: 1, alpha: 0.5, drift: 0.6, parallax: 0.05 },
  { density: 0.6, size: 1, alpha: 0.9, drift: 1.4, parallax: 0.14 },
  { density: 0.12, size: 2, alpha: 1, drift: 3, parallax: 0.3 },
];
const AREA_UNIT = 1000;
/**
 * Scenes can ask for more than the normal field (the launchpad uses 1.6). The field is
 * generated at this maximum and a density of d draws the first d / max of it.
 */
export const STAR_DENSITY_MAX = 1.6;
/** Per star: x, y (0–1), twinkle phase, twinkle speed. */
const STRIDE = 4;
const TWINKLE_MIN = 0.4;
const TWINKLE_RANGE = 1.4;
const TWINKLE_DEPTH = 0.45;
const TAU = Math.PI * 2;
const SEED = 7;

const SHOOT_MIN_GAP_S = 6;
const SHOOT_GAP_RANGE_S = 6;
const SHOOT_S = 0.8;
const SHOOT_VX = -230;
const SHOOT_VY = 90;
const SHOOT_TRAIL = 12;
const SHOOT_TRAIL_STEP_S = 0.012;
const SHOOT_START_X = 0.35;
const SHOOT_BAND_Y = 0.45;

/** Square pixel stars in three parallax depths, density scaled by the scene. */
export class StarLayer {
  private stars: Float32Array[] = [];
  private w = 0;
  private h = 0;
  color = "#ffffff";

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    const rng = createRng(SEED);
    const area = (w * h) / AREA_UNIT;
    this.stars = DEPTHS.map((d) => {
      const data = new Float32Array(Math.round(area * d.density * STAR_DENSITY_MAX) * STRIDE);
      for (let i = 0; i < data.length; i += STRIDE) {
        data[i] = rng.next();
        data[i + 1] = rng.next();
        data[i + 2] = rng.next() * TAU;
        data[i + 3] = TWINKLE_MIN + rng.next() * TWINKLE_RANGE;
      }
      return data;
    });
  }

  /** `density` 0–`STAR_DENSITY_MAX` thins the field by drawing a prefix of each depth's stars. */
  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, density: number): void {
    if (density <= 0) return;
    const { w, h } = this;
    ctx.fillStyle = this.color;
    for (let l = 0; l < DEPTHS.length; l++) {
      const d = DEPTHS[l]!;
      const data = this.stars[l]!;
      const share = Math.min(density, STAR_DENSITY_MAX) / STAR_DENSITY_MAX;
      const end = Math.floor((data.length / STRIDE) * share) * STRIDE;
      const offX = f.time * d.drift;
      const offY = f.scroll * d.parallax;
      for (let i = 0; i < end; i += STRIDE) {
        const twinkle =
          1 - TWINKLE_DEPTH + TWINKLE_DEPTH * Math.sin(f.time * data[i + 3]! + data[i + 2]!);
        ctx.globalAlpha = d.alpha * twinkle;
        ctx.fillRect(
          wrap(data[i]! * w - offX, w) | 0,
          wrap(data[i + 1]! * h - offY, h) | 0,
          d.size,
          d.size,
        );
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** One shooting star every 6–12 s, streaking down-left. */
export class ShootingStar {
  private active = false;
  private x = 0;
  private y = 0;
  private age = 0;
  private next = SHOOT_MIN_GAP_S;

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, dt: number, alpha: number, color: string): void {
    if (!this.active) {
      this.next -= dt;
      if (this.next > 0) return;
      this.active = true;
      this.age = 0;
      this.x = f.w * (SHOOT_START_X + Math.random() * (1 - SHOOT_START_X));
      this.y = f.h * Math.random() * SHOOT_BAND_Y;
      return;
    }
    this.age += dt;
    if (this.age >= SHOOT_S) {
      this.active = false;
      this.next = SHOOT_MIN_GAP_S + Math.random() * SHOOT_GAP_RANGE_S;
      return;
    }
    if (alpha <= 0) return;
    const fade = (1 - this.age / SHOOT_S) * alpha;
    const hx = this.x + SHOOT_VX * this.age;
    const hy = this.y + SHOOT_VY * this.age;
    ctx.fillStyle = color;
    for (let i = 0; i < SHOOT_TRAIL; i++) {
      const back = i * SHOOT_TRAIL_STEP_S;
      ctx.globalAlpha = fade * (1 - i / SHOOT_TRAIL);
      ctx.fillRect((hx - SHOOT_VX * back) | 0, (hy - SHOOT_VY * back) | 0, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}
