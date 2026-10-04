import { createRng, type Rng } from "@/lib/rng";
import { makeOffscreen, wrap, type Offscreen, type SkyFrame, type SkyLayer } from "./sky-types";

const COLORS = {
  dark: { base: "#5b5480", shade: "#363156", hi: "#8d86b5" },
  light: { base: "#8d86b5", shade: "#5f5888", hi: "#b7b1dc" },
} as const;

/** Rock sizes per depth (far → near), in low-res px. */
const SIZES = [5, 9, 15] as const;
const SPEED = [2, 5, 10] as const;
const PARALLAX = [0.15, 0.35, 0.7] as const;
const DEPTH_ALPHA = [0.6, 0.85, 1] as const;
const FRAMES = 4;
const ROCKS = 18;
/** Per rock: x, y (0–1), depth, spin phase, spin speed (frames/s). */
const STRIDE = 5;
const SPIN_MIN = 0.6;
const SPIN_RANGE = 1.6;
const ROUGHNESS = 0.35;
/** Radial lumps around the rim. */
const BUMPS = 8;
/** Rounds pixel-edge cases outward so small rocks are not too thin. */
const EDGE_BIAS = 0.3;
const SEED = 77;

/** Lumpy rock mask on an n×n grid: true where solid. */
function rockMask(rng: Rng, n: number): boolean[][] {
  const c = (n - 1) / 2;
  const bumps = Array.from({ length: BUMPS }, () => 1 - rng.next() * ROUGHNESS);
  return Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_, x) => {
      const a = Math.atan2(y - c, x - c);
      const k = bumps[Math.floor(((a + Math.PI) / (Math.PI * 2)) * bumps.length) % bumps.length]!;
      return Math.hypot(x - c, y - c) <= c * k + EDGE_BIAS;
    }),
  );
}

/** Rotates a square mask by 90° steps — four tumble frames from one shape. */
function rotate(mask: boolean[][], quarter: number): boolean[][] {
  const n = mask.length;
  let out = mask;
  for (let q = 0; q < quarter; q++) out = out.map((_, y) => out.map((row) => row[n - 1 - y]!));
  return out;
}

function paintRock(mask: boolean[][], light: boolean): Offscreen {
  const n = mask.length;
  const c = light ? COLORS.light : COLORS.dark;
  const out = makeOffscreen(n, n);
  mask.forEach((row, y) =>
    row.forEach((solid, x) => {
      if (!solid) return;
      const edgeBR = !mask[y + 1]?.[x] || !row[x + 1];
      const edgeTL = !mask[y - 1]?.[x] || !row[x - 1];
      out.ctx.fillStyle = edgeBR ? c.shade : edgeTL ? c.hi : c.base;
      out.ctx.fillRect(x, y, 1, 1);
    }),
  );
  return out;
}

/** Tumbling pixel rocks at three parallax depths. */
export class AsteroidLayer implements SkyLayer {
  /** frames[depth][frame] */
  private frames: Offscreen[][] = [];
  private rocks = new Float32Array(ROCKS * STRIDE);
  private light = false;
  private ready = false;

  resize(): void {
    const rng = createRng(SEED);
    for (let i = 0; i < this.rocks.length; i += STRIDE) {
      this.rocks[i] = rng.next();
      this.rocks[i + 1] = rng.next();
      this.rocks[i + 2] = Math.floor(rng.next() * SIZES.length);
      this.rocks[i + 3] = rng.next() * FRAMES;
      this.rocks[i + 4] = SPIN_MIN + rng.next() * SPIN_RANGE;
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
    this.frames = SIZES.map((n) => {
      const mask = rockMask(rng, n);
      return Array.from({ length: FRAMES }, (_, q) => paintRock(rotate(mask, q), this.light));
    });
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0 || this.frames.length === 0) return;
    for (let i = 0; i < this.rocks.length; i += STRIDE) {
      const depth = this.rocks[i + 2]!;
      const size = SIZES[depth]!;
      const frame = Math.floor(this.rocks[i + 3]! + f.time * this.rocks[i + 4]!) % FRAMES;
      const spanX = f.w + size;
      const spanY = f.h + size;
      const x = wrap(this.rocks[i]! * spanX - f.time * SPEED[depth]!, spanX) - size;
      const y = wrap(this.rocks[i + 1]! * spanY - f.scroll * PARALLAX[depth]!, spanY) - size;
      ctx.globalAlpha = alpha * DEPTH_ALPHA[depth]!;
      ctx.drawImage(this.frames[depth]![frame]!.canvas, x | 0, y | 0);
    }
    ctx.globalAlpha = 1;
  }
}
