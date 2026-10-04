import { buildMoonbase, MOONBASE_COLORS, type MoonbaseArt } from "./moonbase-art";
import { makeOffscreen, tint, type Offscreen, type SkyFrame, type SkyLayer } from "./sky-types";

/** Ground sinks a little slower than the page; the far ridge slower still (depth). */
const PARALLAX = 0.45;
const FAR_PARALLAX = 0.3;
/** How much of the far ridge peeks above the near ground. */
const FAR_OVERLAP = 0.9;
const FAR_ALPHA = 0.9;
const RIM_ALPHA = { dark: 0.9, light: 0.55 } as const;
const BEACON_HZ = 1.1;
const BEACON_PX = 2;
const FLICKER_SPEED = 0.3;
const LIT_THRESHOLD = -0.3;
/** Per window: x, y, phase. */
const WSTRIDE = 3;
const TAU = Math.PI * 2;
const SEED = 21;

/**
 * CH0's ground: a cratered lunar horizon with a launch gantry, habitat domes and a
 * blinking beacon. The horizon line glows in the scene colour. Sinks as you climb.
 */
export class MoonbaseLayer implements SkyLayer {
  private art: MoonbaseArt | null = null;
  private rimTint: Offscreen | null = null;
  private glow = "";
  private w = 0;
  private h = 0;
  private light = false;

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.build();
  }

  setTheme(light: boolean): void {
    this.light = light;
    this.build();
  }

  private build(): void {
    if (this.w === 0) return;
    this.art = buildMoonbase(this.w, this.h, this.light, SEED);
    this.rimTint = makeOffscreen(this.art.rim.canvas.width, this.art.rim.canvas.height);
    this.glow = "";
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    const { art, rimTint } = this;
    if (!art || !rimTint || alpha <= 0) return;
    const near = art.near.canvas;
    const top = this.h - near.height + f.scroll * PARALLAX;
    if (top >= this.h) return;
    if (f.glow !== this.glow) {
      tint(rimTint, art.rim.canvas, f.glow);
      this.glow = f.glow;
    }
    const restingHorizon = this.h - near.height + art.horizon;
    const farTop = restingHorizon - art.farHeight * FAR_OVERLAP + f.scroll * FAR_PARALLAX;
    ctx.globalAlpha = alpha * FAR_ALPHA;
    ctx.drawImage(art.far.canvas, 0, farTop | 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(near, 0, top | 0);
    ctx.globalAlpha = alpha * (this.light ? RIM_ALPHA.light : RIM_ALPHA.dark);
    ctx.drawImage(rimTint.canvas, 0, top | 0);
    ctx.globalAlpha = alpha;
    this.drawLights(ctx, f, top);
    ctx.globalAlpha = 1;
  }

  private drawLights(ctx: CanvasRenderingContext2D, f: SkyFrame, top: number): void {
    const c = this.light ? MOONBASE_COLORS.light : MOONBASE_COLORS.dark;
    const { windows, beacon } = this.art!;
    ctx.fillStyle = c.window;
    for (let i = 0; i < windows.length; i += WSTRIDE) {
      if (Math.sin(f.time * FLICKER_SPEED + windows[i + 2]!) > LIT_THRESHOLD) {
        ctx.fillRect(windows[i]!, (top + windows[i + 1]!) | 0, 1, 1);
      }
    }
    // cos, so the beacon is lit on the static (time 0) frame drawn under reduced motion.
    if (Math.cos(f.time * BEACON_HZ * TAU) > 0) {
      ctx.fillStyle = c.beacon;
      ctx.fillRect(beacon.x - 1, (top + beacon.y) | 0, BEACON_PX, BEACON_PX);
    }
  }
}
