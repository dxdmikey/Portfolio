/**
 * Shared contract for the procedural sky layers. All units are *low-res* pixels: the
 * sky canvas is drawn at 1/2–1/3 of CSS resolution and upscaled with `pixelated`.
 */
export interface SkyFrame {
  w: number;
  h: number;
  /** Seconds since start. Frozen at 0 under reduced motion. */
  time: number;
  /** Wall clock in seconds (`performance.now() / 1000`): for event-driven effects that must
   * finish in real time (the station's sync cascade), unlike `time`, which idles and freezes. */
  now: number;
  /** Page scroll in low-res px (0 under reduced motion: no parallax). */
  scroll: number;
  /** Scene accent (planet, nebula, aurora) as hex. */
  glow: string;
  /** CSS px per low-res pixel (2 on phones, 3 on wider screens): for CSS-anchored placement. */
  unit: number;
}

export interface SkyLayer {
  /** Rebuild size-dependent buffers. Called on resize only. */
  resize(w: number, h: number): void;
  /** Rebuild theme-dependent art (silhouette colours). */
  setTheme(light: boolean): void;
  /** Draw with the layer's current opacity (0–1). Must not allocate. */
  draw(ctx: CanvasRenderingContext2D, frame: SkyFrame, alpha: number): void;
}

export interface Offscreen {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function makeOffscreen(w: number, h: number): Offscreen {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/** Positive modulo, for wrapping drifting props around the screen. */
export function wrap(v: number, max: number): number {
  const m = v % max;
  return m < 0 ? m + max : m;
}

/** 4×4 ordered-dither thresholds (0–15). */
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;
const BAYER_LEVELS = 16;
const BAYER_SIZE = 4;

/** True if a pixel at (x, y) should be lit for a 0–1 density (ordered dither). */
export function dither(x: number, y: number, density: number): boolean {
  const t = BAYER4[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)] ?? 0;
  return density * BAYER_LEVELS > t + 0.5;
}

/**
 * Recolours a white mask: fills `target` with `color`, keeping only the mask's pixels.
 * Cheap (one fill + one blit), so it can run whenever the scene glow changes.
 */
export function tint(target: Offscreen, mask: HTMLCanvasElement, color: string): void {
  const { ctx, canvas } = target;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}
