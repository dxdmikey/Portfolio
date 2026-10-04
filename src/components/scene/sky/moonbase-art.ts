import { createRng, type Rng } from "@/lib/rng";
import { dither, makeOffscreen, type Offscreen } from "./sky-types";

/** Art colours (canvas data, not UI tokens). Day-mode ground stays pale so copy over it stays readable. */
export const MOONBASE_COLORS = {
  dark: {
    far: "#1a1242",
    farHi: "#2c2068",
    ground: "#110c2c",
    dust: "#1d1646",
    crater: "#08061a",
    craterLit: "#2e2468",
    tower: "#0b0822",
    towerHi: "#2e2468",
    dome: "#1b1548",
    domeHi: "#3d318a",
    window: "#ffc93c",
    beacon: "#ff5a6e",
  },
  light: {
    far: "#e6dffc",
    farHi: "#f3efff",
    ground: "#ddd5fa",
    dust: "#e9e3fd",
    crater: "#cbc1f4",
    craterLit: "#f3efff",
    tower: "#8a7fd0",
    towerHi: "#a79ee0",
    dome: "#b6abec",
    domeHi: "#d3ccf6",
    window: "#c97a00",
    beacon: "#e0203c",
  },
} as const;
type Palette = { readonly [K in keyof (typeof MOONBASE_COLORS)["dark"]]: string };

/** Heights as fractions of the screen. */
const GROUND = 0.2;
const FAR = 0.16;
const TOWER = 0.21;
const TOWER_X = 0.24;
/**
 * Phones (sky narrower than this, in low-res px = 768 CSS px): the hero copy is centred and
 * fills the width, so the gantry moves out to the left edge instead of standing behind the text.
 */
const NARROW_SKY_W = 384;
const TOWER_X_NARROW = 0.08;
const TOWER_W = 7;
const RUNG = 4;
const ARM_AT = 0.72;
const ARM_LEN = 6;
const ANTENNA = 4;
/** Flat launch pad around the tower, in px each side. */
const PAD_HALF = 14;
const SWELL = 0.22;
const FAR_PEAKS = 0.7;
const DUST_DENSITY = 0.45;
const CRATER_EVERY = 26;
const CRATER_MIN = 2;
const CRATER_GROW = 11;
const CRATER_SQUASH = 0.32;
const CRATER_LIT = 0.68;
const DOMES = [
  { dx: 11, r: 6, windows: 3 },
  { dx: 21, r: 4, windows: 1 },
] as const;
const PHASE_RANGE = 40;

export interface MoonbaseArt {
  far: Offscreen;
  near: Offscreen;
  /** Ridge height of the far range in px (the skirt below it is hidden by the near ground). */
  farHeight: number;
  /** Baseline of the near ground in `near` coordinates (everything above it is gantry and sky). */
  horizon: number;
  /** White 1px horizon line, tinted with the scene glow at draw time. */
  rim: Offscreen;
  /** Beacon pixel (top-left of a 2×2) in `near` coordinates. */
  beacon: { x: number; y: number };
  /** Per window: x, y, flicker phase (in `near` coordinates). */
  windows: Float32Array;
}

/** Ridge height per column: a few slow sines with seeded phases, 0–1. */
function ridge(rng: Rng, w: number, freqs: readonly number[]): Float32Array {
  const phases = freqs.map(() => rng.next() * Math.PI * 2);
  const out = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    let v = 0;
    freqs.forEach((f, i) => (v += Math.sin(x * f + phases[i]!) / (i + 1)));
    out[x] = (v / freqs.length + 1) / 2;
  }
  return out;
}

/** Far ridge, `h` tall plus `skirt` of solid fill below so it never shows a gap under the near ground. */
function paintFar(rng: Rng, w: number, h: number, skirt: number, c: Palette): Offscreen {
  const out = makeOffscreen(w, h + skirt);
  const peaks = ridge(rng, w, [0.021, 0.057, 0.13]);
  for (let x = 0; x < w; x++) {
    const top = Math.round(h * (1 - FAR_PEAKS * peaks[x]!));
    out.ctx.fillStyle = c.far;
    out.ctx.fillRect(x, top, 1, h + skirt - top);
    out.ctx.fillStyle = c.farHi;
    out.ctx.fillRect(x, top, 1, 1);
  }
  return out;
}

function paintTower(
  ctx: CanvasRenderingContext2D,
  tx: number,
  base: number,
  height: number,
  c: Palette,
) {
  const top = base - height;
  ctx.fillStyle = c.tower;
  ctx.fillRect(tx, top, 1, height);
  ctx.fillRect(tx + TOWER_W - 1, top, 1, height);
  for (let y = top; y < base; y += RUNG) {
    ctx.fillRect(tx, y, TOWER_W, 1);
    for (let k = 1; k < RUNG; k++)
      ctx.fillRect(tx + Math.round((k / RUNG) * (TOWER_W - 1)), y + k, 1, 1);
  }
  const arm = Math.round(top + height * (1 - ARM_AT));
  ctx.fillRect(tx + TOWER_W, arm, ARM_LEN, 2);
  ctx.fillStyle = c.towerHi;
  ctx.fillRect(tx, top, TOWER_W, 1);
  ctx.fillRect(tx + TOWER_W, arm, ARM_LEN, 1);
  ctx.fillStyle = c.tower;
  ctx.fillRect(tx + (TOWER_W >> 1), top - ANTENNA, 1, ANTENNA);
  return { x: tx + (TOWER_W >> 1), y: top - ANTENNA - 1 };
}

/** Cratered lunar ground with a flat pad, a launch gantry and two habitat domes. */
export function buildMoonbase(w: number, h: number, light: boolean, seed: number): MoonbaseArt {
  const c = light ? MOONBASE_COLORS.light : MOONBASE_COLORS.dark;
  const rng = createRng(seed);
  const groundH = Math.round(h * GROUND);
  const towerH = Math.round(h * TOWER);
  const nearH = groundH + towerH;
  const near = makeOffscreen(w, nearH);
  const rim = makeOffscreen(w, nearH);
  const swell = ridge(rng, w, [0.012, 0.031, 0.077]);
  const tx = Math.round(w * (w < NARROW_SKY_W ? TOWER_X_NARROW : TOWER_X));
  const padTop = towerH + Math.round(groundH * SWELL * swell[tx]!);
  const tops = new Int16Array(w);
  const { ctx } = near;
  rim.ctx.fillStyle = "#ffffff";
  for (let x = 0; x < w; x++) {
    const onPad = Math.abs(x - tx - TOWER_W / 2) < PAD_HALF;
    const top = onPad ? padTop : towerH + Math.round(groundH * SWELL * swell[x]!);
    tops[x] = top;
    ctx.fillStyle = c.ground;
    ctx.fillRect(x, top, 1, nearH - top);
    ctx.fillStyle = c.dust;
    for (let y = top + 1; y < nearH; y++)
      if (dither(x, y, DUST_DENSITY * (1 - (y - top) / groundH))) ctx.fillRect(x, y, 1, 1);
    rim.ctx.fillRect(x, top, 1, 1);
  }
  for (let n = Math.floor(w / CRATER_EVERY); n > 0; n--) {
    const depth = rng.next();
    const rx = CRATER_MIN + depth * CRATER_GROW;
    const ry = Math.max(1, rx * CRATER_SQUASH);
    const cx = rng.next() * w;
    const cy = towerH + groundH * (SWELL + depth * (1 - SWELL));
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const e = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (e > 1 || x < 0 || x >= w || y < tops[x]! + 2 || Math.abs(x - tx) < PAD_HALF) continue;
        ctx.fillStyle = e > CRATER_LIT && y > cy ? c.craterLit : c.crater;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const beacon = paintTower(ctx, tx, padTop, towerH - ANTENNA - 1, c);
  const windows: number[] = [];
  for (const d of DOMES) {
    const dcx = tx + TOWER_W + d.dx;
    for (let y = -d.r; y < 0; y++) {
      const half = Math.round(Math.sqrt(d.r * d.r - (y + 0.5) ** 2));
      ctx.fillStyle = c.dome;
      ctx.fillRect(dcx - half, padTop + y, half * 2, 1);
      ctx.fillStyle = c.domeHi;
      ctx.fillRect(dcx - half, padTop + y, 1, 1);
    }
    for (let i = 0; i < d.windows; i++)
      windows.push(dcx - d.windows + 1 + i * 2, padTop - 2, rng.next() * PHASE_RANGE);
  }
  const farHeight = Math.round(h * FAR);
  return {
    far: paintFar(rng, w, farHeight, groundH, c),
    farHeight,
    horizon: towerH,
    near,
    rim,
    beacon,
    windows: Float32Array.from(windows),
  };
}
