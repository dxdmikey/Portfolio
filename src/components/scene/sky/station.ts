import type { StationLights } from "@/game/scene/station-lights";
import { makeOffscreen, type Offscreen, type SkyFrame, type SkyLayer } from "./sky-types";

const COLORS = {
  dark: {
    hull: "#262c66",
    hi: "#3d4596",
    truss: "#1d2252",
    panel: "#173a73",
    grid: "#0e2148",
    window: "#ffc93c",
    off: "#141838",
  },
  light: {
    hull: "#6f75b8",
    hi: "#9399d6",
    truss: "#5a5f9e",
    panel: "#3d62ad",
    grid: "#2b4a8a",
    window: "#ffd75e",
    off: "#4d5290",
  },
} as const;
const LIGHT_RED = "#ff5a6e";
const LIGHT_GREEN = "#9bff4a";
/** Cascade sweep colour (art data). */
const FLASH = "#ffffff";

/** Base art size in station pixels; scaled ×2 on wide screens. */
const BASE_W = 64;
const BASE_H = 30;
const WIDE_SCREEN = 640;
const HUB_W = 16;
const HUB_H = 9;
const MODULE_W = 7;
const MODULE_H = 5;
const PANEL_W = 20;
const PANEL_H = 6;
const PANEL_GAP = 1;
const GRID_STEP = 3;
const ANTENNA = 7;
const TRUSS_TICK = 3;
/**
 * Placement: top-right, just under the sticky HUD (86 CSS px tall), with part of the hull off
 * the edge. CH4's panels cover the middle of the screen, so this is the corner that stays
 * visible beside them (the desktop gutter; the heading and gaps between cards on phones).
 */
export const STATION_TOP_CSS = 104;
/** Share of the station's width that is on screen. */
export const STATION_PEEK = 0.82;
const DROP = 0.4;
const BOB_HZ = 0.1;
const BOB_PX = 1;
const BLINK_HZ = 0.9;
const PULSE_ALPHA = 0.55;
const TAU = Math.PI * 2;
const CX = BASE_W / 2;
const CY = BASE_H / 2 + 2;

/** Station lights as [x, y, w] in station px: hub windows, side module, solar wing cells. */
const LIGHTS: readonly (readonly [number, number, number])[] = (() => {
  const list: [number, number, number][] = [];
  for (let i = 0; i < 4; i++) list.push([CX - 6 + i * 4, CY, 2]);
  list.push([CX + HUB_W / 2 + 2, CY, 1], [CX + HUB_W / 2 + 4, CY, 1]);
  for (const x0 of [1, BASE_W - PANEL_W - 1]) {
    for (const y0 of [CY - PANEL_H - PANEL_GAP, CY + 1 + PANEL_GAP]) {
      list.push([x0 + 4, y0 + 1, 1], [x0 + PANEL_W - 5, y0 + PANEL_H - 2, 1]);
    }
  }
  // Power spreads outward from the hub: nearest lights come on first.
  return list.sort((a, b) => Math.abs(a[0] - CX) - Math.abs(b[0] - CX));
})();

/**
 * Space-station silhouette peeking in from the upper right. Its windows light up as CH4's modules come
 * online; the "first sync" sweeps a cascade of light across it. Nav lights blink once powered.
 */
export class StationLayer implements SkyLayer {
  private art: Offscreen | null = null;
  private scale = 1;
  private w = 0;
  private h = 0;
  private light = false;

  constructor(private readonly power: StationLights) {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.scale = w > WIDE_SCREEN ? 2 : 1;
    this.build();
  }

  setTheme(light: boolean): void {
    this.light = light;
    this.build();
  }

  private build(): void {
    if (this.w === 0) return;
    const s = this.scale;
    const c = this.light ? COLORS.light : COLORS.dark;
    this.art = makeOffscreen(BASE_W * s, BASE_H * s);
    const ctx = this.art.ctx;
    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s));
    };
    px(0, CY, BASE_W, 1, c.truss);
    for (let x = 0; x < BASE_W; x += TRUSS_TICK) px(x, CY - 1, 1, 3, c.truss);
    for (const x0 of [1, BASE_W - PANEL_W - 1]) {
      for (const y0 of [CY - PANEL_H - PANEL_GAP, CY + 1 + PANEL_GAP]) {
        px(x0, y0, PANEL_W, PANEL_H, c.panel);
        for (let gx = x0 + GRID_STEP; gx < x0 + PANEL_W; gx += GRID_STEP)
          px(gx, y0, 1, PANEL_H, c.grid);
        px(x0, y0 + Math.floor(PANEL_H / 2), PANEL_W, 1, c.grid);
      }
    }
    px(CX - HUB_W / 2, CY - HUB_H / 2, HUB_W, HUB_H, c.hull);
    px(CX - HUB_W / 2, CY - HUB_H / 2, HUB_W, 1, c.hi);
    px(CX + HUB_W / 2, CY - MODULE_H / 2, MODULE_W, MODULE_H, c.hull);
    px(CX + HUB_W / 2, CY - MODULE_H / 2, MODULE_W, 1, c.hi);
    px(CX - 1, CY - HUB_H / 2 - ANTENNA, 1, ANTENNA, c.truss);
    px(CX - 3, CY - HUB_H / 2 - ANTENNA, 5, 1, c.hi);
  }

  /** Art size in low-res px (for the phone "peek" canvas). */
  get size(): { w: number; h: number } {
    return { w: BASE_W * this.scale, h: BASE_H * this.scale };
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    const bob = Math.sin(f.time * BOB_HZ * TAU) * BOB_PX;
    const x = (this.w - BASE_W * this.scale * STATION_PEEK) | 0;
    const y = (STATION_TOP_CSS / f.unit - (1 - alpha) * this.h * DROP + bob) | 0;
    this.drawAt(ctx, f, x, y, alpha);
  }

  /** Station art, sync glow and lights with its top-left corner at (x, y). */
  drawAt(ctx: CanvasRenderingContext2D, f: SkyFrame, x: number, y: number, alpha: number): void {
    if (alpha <= 0 || !this.art) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.art.canvas, x, y);
    const pulse = this.power.pulse(f.now);
    if (pulse > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha * pulse * PULSE_ALPHA;
      ctx.drawImage(this.art.canvas, x, y);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
    }
    this.drawLights(ctx, f, x, y);
    ctx.globalAlpha = 1;
  }

  private drawLights(ctx: CanvasRenderingContext2D, f: SkyFrame, x: number, y: number): void {
    const s = this.scale;
    const c = this.light ? COLORS.light : COLORS.dark;
    const lit = this.power.litCount(LIGHTS.length);
    for (let i = 0; i < LIGHTS.length; i++) {
      const [lx, ly, lw] = LIGHTS[i]!;
      const flash = this.power.flash(lx / BASE_W, f.now);
      ctx.fillStyle = flash > 0.5 ? FLASH : i < lit ? c.window : c.off;
      ctx.fillRect(x + lx * s, y + ly * s, lw * s, s);
    }
    if (lit === 0) return;
    // Nav lights: antenna tip (red), wing tips alternating red/green.
    const on = Math.sin(f.time * BLINK_HZ * TAU) > 0;
    ctx.fillStyle = LIGHT_RED;
    if (on) ctx.fillRect(x + (CX - 1) * s, y + (CY - HUB_H / 2 - ANTENNA - 1) * s, s, s);
    ctx.fillStyle = on ? LIGHT_GREEN : LIGHT_RED;
    ctx.fillRect(x, y + CY * s, s, s);
    ctx.fillStyle = on ? LIGHT_RED : LIGHT_GREEN;
    ctx.fillRect(x + (BASE_W - 1) * s, y + CY * s, s, s);
  }
}
