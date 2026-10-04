import { createRng, type Rng } from "@/lib/rng";
import { makeOffscreen, wrap, type Offscreen, type SkyFrame, type SkyLayer } from "./sky-types";

const COLORS = {
  dark: { body: "#283070", shade: "#1a2052", top: "#3a4390" },
  light: { body: "#ffffff", shade: "#d2e4fb", top: "#ffffff" },
} as const;

/** Cloud sprite widths in low-res px (one sprite per depth: far, mid, near). */
const SPRITE_W = [26, 42, 64] as const;
const SPRITE_H_RATIO = 0.42;
const PUFFS = 5;
/** Puff radius as a fraction of sprite height: min + random range. */
const PUFF_R_MIN = 0.28;
const PUFF_R_RANGE = 0.22;
/** Puff centres span this middle band of the sprite width. */
const PUFF_X_INSET = 0.18;
const PUFF_JITTER_Y = 0.18;
/** Rows below this fraction of the height use the shade colour. */
const SHADE_LINE = 0.72;
const DEPTH_SPEED = [1.5, 3, 5.5] as const;
const DEPTH_PARALLAX = [0.12, 0.25, 0.45] as const;
const DEPTH_ALPHA = [0.55, 0.75, 0.95] as const;
const CLOUD_COUNT = 9;
/** Per cloud: x, y (0–1), depth index. */
const STRIDE = 3;
const SEED = 33;

/** Blocky cloud: union of circles rasterised to whole pixels, shaded bottom, lit top. */
function paintCloud(rng: Rng, w: number, light: boolean): Offscreen {
  const h = Math.round(w * SPRITE_H_RATIO);
  const out = makeOffscreen(w, h);
  const c = light ? COLORS.light : COLORS.dark;
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < PUFFS; i++) {
    const r = h * (PUFF_R_MIN + rng.next() * PUFF_R_RANGE);
    const cx = w * (PUFF_X_INSET + (i / (PUFFS - 1)) * (1 - 2 * PUFF_X_INSET));
    puffs.push([cx, h - r - rng.next() * h * PUFF_JITTER_Y, r]);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = puffs.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
      if (!inside) continue;
      out.ctx.fillStyle = y > h * SHADE_LINE ? c.shade : c.body;
      out.ctx.fillRect(x, y, 1, 1);
    }
  }
  // Rim light: the topmost pixel of each column.
  out.ctx.globalCompositeOperation = "source-atop";
  out.ctx.fillStyle = c.top;
  for (let x = 0; x < w; x++) {
    const top = puffs.reduce((m, [cx, cy, r]) => {
      const dx = x - cx;
      return Math.abs(dx) <= r ? Math.min(m, cy - Math.sqrt(r * r - dx * dx)) : m;
    }, h);
    if (top < h) out.ctx.fillRect(x, Math.ceil(top), 1, 1);
  }
  out.ctx.globalCompositeOperation = "source-over";
  return out;
}

/** Chunky pixel clouds drifting right, three parallax depths. */
export class CloudLayer implements SkyLayer {
  private sprites: Offscreen[] = [];
  private clouds = new Float32Array(CLOUD_COUNT * STRIDE);
  private light = false;
  private ready = false;

  resize(): void {
    const rng = createRng(SEED);
    for (let i = 0; i < this.clouds.length; i += STRIDE) {
      this.clouds[i] = rng.next();
      this.clouds[i + 1] = rng.next();
      this.clouds[i + 2] = (i / STRIDE) % SPRITE_W.length;
    }
    this.ready = true;
    this.build();
  }

  setTheme(light: boolean): void {
    this.light = light;
    if (this.ready) this.build();
  }

  private build(): void {
    const rng = createRng(SEED);
    this.sprites = SPRITE_W.map((w) => paintCloud(rng, w, this.light));
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0 || this.sprites.length === 0) return;
    for (let i = 0; i < this.clouds.length; i += STRIDE) {
      const depth = this.clouds[i + 2]!;
      const sprite = this.sprites[depth]!.canvas;
      const spanX = f.w + sprite.width;
      const spanY = f.h + sprite.height;
      const x = wrap(this.clouds[i]! * spanX + f.time * DEPTH_SPEED[depth]!, spanX) - sprite.width;
      const y =
        wrap(this.clouds[i + 1]! * spanY - f.scroll * DEPTH_PARALLAX[depth]!, spanY) -
        sprite.height;
      ctx.globalAlpha = alpha * DEPTH_ALPHA[depth]!;
      ctx.drawImage(sprite, x | 0, y | 0);
    }
    ctx.globalAlpha = 1;
  }
}
