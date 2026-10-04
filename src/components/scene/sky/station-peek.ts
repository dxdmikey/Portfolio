import type { SkyFrame } from "./sky-types";
import { STATION_PEEK, STATION_TOP_CSS, type StationLayer } from "./station";

/**
 * Phones only: CH4's panels span the whole screen, so the sky station behind them can't be
 * seen when "Run first sync" lights it up. For the length of the sync's visit the station is
 * drawn on this small canvas instead, which sits just under the HUD in the top-right corner,
 * above the content (pointer-events none, aria-hidden), at the same spot as the sky station.
 */
export class StationPeek {
  private readonly ctx: CanvasRenderingContext2D | null;
  private drawn = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly station: StationLayer,
  ) {
    this.ctx = canvas.getContext("2d");
  }

  /** Draw the station at `presence` opacity (0 clears the canvas once). */
  draw(f: SkyFrame, presence: number): void {
    const { ctx, canvas } = this;
    if (!ctx) return;
    if (presence <= 0) {
      if (this.drawn) ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawn = false;
      return;
    }
    const { w, h } = this.station.size;
    const width = Math.ceil(w * STATION_PEEK);
    if (canvas.width !== width || canvas.height !== h) {
      canvas.width = width;
      canvas.height = h;
      ctx.imageSmoothingEnabled = false;
      // Same CSS px per pixel and spot as the sky station, so the two line up exactly.
      canvas.style.width = `${width * f.unit}px`;
      canvas.style.height = `${h * f.unit}px`;
      canvas.style.top = `${STATION_TOP_CSS}px`;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Glides in from the right edge as it fades in, and back out as it leaves.
    const slide = Math.round((1 - presence) * width);
    this.station.drawAt(ctx, f, slide, 0, presence);
    this.drawn = true;
  }
}
