import {
  makeOffscreen,
  tint,
  dither,
  type Offscreen,
  type SkyFrame,
  type SkyLayer,
} from "./sky-types";

const RADIUS_RATIO = 0.24;
const RING_RX = 1.75;
const RING_RY = 0.3;
const RING_INNER = 0.82;
const PAD = 2;
const BAND_ROWS = 6;
/** Light comes from the upper left: lit circle offset and size, relative to R. */
const LIGHT_OFFSET = -0.35;
const LIGHT_RADIUS = 1.2;
const TERMINATOR = 0.12;
const RIM = 1.5;
const ALPHA_MAX = 255;
const SHADOW_A = 140;
const BAND_LIGHT_A = 40;
const BAND_DARK_A = 34;
const RIM_A = 110;
const RING_FRONT = "rgba(255,255,255,0.55)";
/** Planet reaches full opacity before its layer does, so it reads solid while rising. */
const FADE_BOOST = 1.5;
const POS_X = 0.86;
const POS_Y = 0.8;
/** Backdrop, not a feature: keep it well under the content in both themes. */
const OPACITY = { dark: 0.5, light: 0.4 } as const;
/** How far below its resting spot the planet starts while fading in (× height). */
const RISE = 0.6;
const BOB_HZ = 0.08;
const BOB_PX = 1.5;

/** Ring pixels for one half: upper (back) or lower (front). */
function ringHalf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  front: boolean,
): void {
  const rx = r * RING_RX;
  const ry = r * RING_RY;
  for (let x = -Math.floor(rx); x <= rx; x++) {
    const outer = ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
    const ix = rx * RING_INNER;
    const inner = Math.abs(x) < ix ? ry * RING_INNER * Math.sqrt(1 - (x / ix) ** 2) : 0;
    const sign = front ? 1 : -1;
    const a = Math.round(cy + sign * inner);
    const b = Math.round(cy + sign * outer);
    ctx.fillRect(cx + x, Math.min(a, b), 1, Math.abs(b - a) + 1);
  }
}

/** Big banded planet with a ring, rising from the bottom right as you approach. */
export class PlanetLayer implements SkyLayer {
  private mask: Offscreen | null = null;
  private tinted: Offscreen | null = null;
  private detail: Offscreen | null = null;
  private glow = "";
  private h = 0;
  private w = 0;
  private light = false;

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    const r = Math.round(Math.min(w, h) * RADIUS_RATIO);
    const cw = Math.ceil(r * RING_RX * 2) + PAD * 2;
    const ch = r * 2 + PAD * 2;
    const cx = Math.floor(cw / 2);
    const cy = Math.floor(ch / 2);
    this.mask = makeOffscreen(cw, ch);
    this.tinted = makeOffscreen(cw, ch);
    this.detail = makeOffscreen(cw, ch);
    const m = this.mask.ctx;
    m.fillStyle = "#ffffff";
    ringHalf(m, cx, cy, r, false);
    for (let dy = -r; dy < r; dy++) {
      const half = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2));
      m.fillRect(cx - half, cy + dy, half * 2, 1);
    }
    ringHalf(m, cx, cy, r, true);
    this.paintDetail(cx, cy, r);
    this.glow = "";
  }

  setTheme(light: boolean): void {
    this.light = light;
  }

  private paintDetail(cx: number, cy: number, r: number): void {
    const d = this.detail!;
    const img = d.ctx.createImageData(d.canvas.width, d.canvas.height);
    const px = img.data;
    const lx = cx + r * LIGHT_OFFSET;
    const ly = cy + r * LIGHT_OFFSET;
    const lr = r * LIGHT_RADIUS;
    for (let y = cy - r; y < cy + r; y++) {
      for (let x = cx - r; x < cx + r; x++) {
        const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (dist > r) continue;
        const light = Math.hypot(x - lx, y - ly) / lr;
        const shadow =
          light > 1 ||
          (light > 1 - TERMINATOR && dither(x, y, (light - (1 - TERMINATOR)) / TERMINATOR));
        const band = Math.floor((y - cy + r) / BAND_ROWS) % 2 === 0;
        const rim = dist > r - RIM && x < cx && y < cy;
        const i = (y * d.canvas.width + x) * 4;
        const white = rim || (!shadow && band);
        px[i] = px[i + 1] = px[i + 2] = white ? ALPHA_MAX : 0;
        px[i + 3] = shadow ? SHADOW_A : rim ? RIM_A : band ? BAND_LIGHT_A : BAND_DARK_A;
      }
    }
    d.ctx.putImageData(img, 0, 0);
    d.ctx.fillStyle = RING_FRONT;
    ringHalf(d.ctx, cx, cy, r, true);
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0 || !this.mask || !this.tinted || !this.detail) return;
    if (f.glow !== this.glow) {
      tint(this.tinted, this.mask.canvas, f.glow);
      this.glow = f.glow;
    }
    const { canvas } = this.tinted;
    const x = this.w * POS_X - canvas.width / 2;
    const bob = Math.sin(f.time * BOB_HZ * Math.PI * 2) * BOB_PX;
    const y = this.h * POS_Y + (1 - alpha) * this.h * RISE - canvas.height / 2 + bob;
    ctx.globalAlpha = Math.min(1, alpha * FADE_BOOST) * (this.light ? OPACITY.light : OPACITY.dark);
    ctx.drawImage(canvas, x | 0, y | 0);
    ctx.drawImage(this.detail.canvas, x | 0, y | 0);
    ctx.globalAlpha = 1;
  }
}
