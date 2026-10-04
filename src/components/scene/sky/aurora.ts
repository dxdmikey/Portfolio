import type { SkyFrame, SkyLayer } from "./sky-types";

interface Ribbon {
  /** Base height as a fraction of the screen. */
  y: number;
  amp: number;
  freq: number;
  speed: number;
  thickness: number;
}

const RIBBONS: readonly Ribbon[] = [
  { y: 0.16, amp: 10, freq: 0.021, speed: 0.35, thickness: 16 },
  { y: 0.26, amp: 14, freq: 0.014, speed: -0.25, thickness: 22 },
  { y: 0.34, amp: 8, freq: 0.03, speed: 0.5, thickness: 10 },
];
/** Fade tiers from the ribbon's bright core outward: [offset fraction, height fraction, alpha]. */
const TIERS: readonly (readonly [number, number, number])[] = [
  [0, 1, 0.06],
  [0.2, 0.6, 0.1],
  [0.35, 0.25, 0.18],
];
const COLUMN = 2;
const HARMONIC = 2.3;
const HARMONIC_AMP = 0.4;
const HARMONIC_SPEED = 0.7;
/** Scroll sways the curtains instead of moving them (absolute parallax would push them off-screen deep in the page). */
const SWAY_RATE = 0.01;
const SWAY_PX = 6;
const LIGHT_DIM = 0.7;

/** Wavy curtains of light in the scene glow colour, built from 2px columns. */
export class AuroraLayer implements SkyLayer {
  private light = false;

  resize(): void {}

  setTheme(light: boolean): void {
    this.light = light;
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0) return;
    ctx.fillStyle = f.glow;
    const dim = this.light ? LIGHT_DIM : 1;
    for (const r of RIBBONS) {
      const base = f.h * r.y + Math.sin(f.scroll * SWAY_RATE) * SWAY_PX;
      for (const [offset, height, a] of TIERS) {
        ctx.globalAlpha = alpha * a * dim;
        const top = r.thickness * offset;
        const len = Math.max(1, Math.round(r.thickness * height));
        for (let x = 0; x < f.w; x += COLUMN) {
          const wave =
            Math.sin(x * r.freq + f.time * r.speed) * r.amp +
            Math.sin(x * r.freq * HARMONIC + f.time * r.speed * HARMONIC_SPEED) *
              r.amp *
              HARMONIC_AMP;
          ctx.fillRect(x, (base + wave + top) | 0, COLUMN, len);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
