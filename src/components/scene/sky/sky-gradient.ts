import { lerpColor } from "@/game/scene/interpolate";
import type { SceneKeyframe } from "@/types/story";

/** Vertical gradient is drawn as stepped bands (no smooth CSS-style gradients). */
const BANDS = 28;
/** The lowest bands run skyBottom → horizon: the saturated neon floor of each scene. */
const HORIZON_BANDS = 9;
/**
 * Glow mixed into the very last bands (bottom edge first): a thin neon rim that sells the
 * chapter colour without brightening the sky behind readable copy. Lighter in day mode.
 */
const EDGE_GLOW = { dark: [0.16, 0.07], light: [0.1, 0.04] } as const;

/**
 * The sky's stepped three-stop gradient (top → bottom → horizon) with a glow rim on the last
 * bands. Colours are recomputed only when the blended scene's colours (or the theme) change.
 */
export class SkyGradient {
  private readonly bands: string[] = new Array<string>(BANDS).fill("#000000");
  private key = "";

  update({ skyTop, skyBottom, horizon, glow }: SceneKeyframe, light: boolean): void {
    const key = skyTop + skyBottom + horizon + glow + String(light);
    if (key === this.key) return;
    this.key = key;
    const upper = BANDS - HORIZON_BANDS;
    const edge = light ? EDGE_GLOW.light : EDGE_GLOW.dark;
    for (let i = 0; i < BANDS; i++) {
      const base =
        i < upper
          ? lerpColor(skyTop, skyBottom, i / (upper - 1))
          : lerpColor(skyBottom, horizon, (i - upper + 1) / HORIZON_BANDS);
      const rim = edge[BANDS - 1 - i] ?? 0;
      this.bands[i] = rim > 0 ? lerpColor(base, glow, rim) : base;
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const bandH = h / BANDS;
    for (let i = 0; i < BANDS; i++) {
      ctx.fillStyle = this.bands[i]!;
      ctx.fillRect(0, Math.floor(i * bandH), w, Math.ceil(bandH) + 1);
    }
  }
}
