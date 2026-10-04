import { createRng, type Rng } from "@/lib/rng";
import {
  dither,
  makeOffscreen,
  tint,
  wrap,
  type Offscreen,
  type SkyFrame,
  type SkyLayer,
} from "./sky-types";

/** Second gas colour, fixed per theme (the first follows the scene glow). */
const SECOND = { dark: "#3ef0ff", light: "#00a3c4" } as const;
const OPACITY = { dark: 0.38, light: 0.3 } as const;
const SECOND_OPACITY = 0.7;
/** Teal blobs are smaller than the glow blobs. */
const SECOND_SCALE = 0.7;

const BLOBS_A = 6;
const BLOBS_B = 4;
const R_MIN = 0.12;
const R_RANGE = 0.22;
const FALLOFF = 1.6;
const PEAK = 0.6;
const DRIFT_X = 1.2;
const DRIFT_Y = 0.4;
const PARALLAX = 0.1;
const ALPHA_MAX = 255;
const SEED = 55;

type Blob = readonly [number, number, number];

function blobs(rng: Rng, n: number, w: number, h: number, scale: number): Blob[] {
  const base = Math.min(w, h);
  return Array.from({ length: n }, () => [
    rng.next() * w,
    rng.next() * h,
    base * (R_MIN + rng.next() * R_RANGE) * scale,
  ]);
}

/** Dithered white mask: density falls off from each blob's centre (wraps at the edges). */
function paintMask(w: number, h: number, list: Blob[]): Offscreen {
  const out = makeOffscreen(w, h);
  const img = out.ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let density = 0;
      for (const [bx, by, r] of list) {
        const dx = Math.min(Math.abs(x - bx), w - Math.abs(x - bx));
        const dy = Math.min(Math.abs(y - by), h - Math.abs(y - by));
        const d = Math.sqrt(dx * dx + dy * dy) / r;
        if (d < 1) density = Math.max(density, (1 - d) ** FALLOFF * PEAK);
      }
      if (density > 0 && dither(x, y, density)) {
        const i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i + 3] = ALPHA_MAX;
      }
    }
  }
  out.ctx.putImageData(img, 0, 0);
  return out;
}

/** Ordered-dither gas clouds in the scene glow plus teal, slowly drifting. */
export class NebulaLayer implements SkyLayer {
  private maskA: Offscreen | null = null;
  private maskB: Offscreen | null = null;
  private tintA: Offscreen | null = null;
  private tintB: Offscreen | null = null;
  private glow = "";
  private light = false;

  resize(w: number, h: number): void {
    const rng = createRng(SEED);
    this.maskA = paintMask(w, h, blobs(rng, BLOBS_A, w, h, 1));
    this.maskB = paintMask(w, h, blobs(rng, BLOBS_B, w, h, SECOND_SCALE));
    this.tintA = makeOffscreen(w, h);
    this.tintB = makeOffscreen(w, h);
    this.glow = "";
    this.retintSecond();
  }

  setTheme(light: boolean): void {
    this.light = light;
    this.retintSecond();
  }

  private retintSecond(): void {
    if (this.tintB && this.maskB)
      tint(this.tintB, this.maskB.canvas, this.light ? SECOND.light : SECOND.dark);
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0 || !this.tintA || !this.tintB || !this.maskA) return;
    if (f.glow !== this.glow) {
      tint(this.tintA, this.maskA.canvas, f.glow);
      this.glow = f.glow;
    }
    const base = alpha * (this.light ? OPACITY.light : OPACITY.dark);
    ctx.globalAlpha = base;
    tile(ctx, this.tintA.canvas, f.time * DRIFT_X, f.scroll * PARALLAX + f.time * DRIFT_Y);
    ctx.globalAlpha = base * SECOND_OPACITY;
    tile(ctx, this.tintB.canvas, -f.time * DRIFT_X, f.scroll * PARALLAX * 2);
    ctx.globalAlpha = 1;
  }
}

/** Draws a screen-sized texture offset by (dx, dy), wrapped on both axes. */
function tile(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, dx: number, dy: number): void {
  const w = img.width;
  const h = img.height;
  const x = wrap(dx, w) | 0;
  const y = wrap(-dy, h) | 0;
  ctx.drawImage(img, x, y);
  ctx.drawImage(img, x - w, y);
  ctx.drawImage(img, x, y - h);
  ctx.drawImage(img, x - w, y - h);
}
