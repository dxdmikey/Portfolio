/** Draw passes for the FX canvas (particles, ripples, "+XP" labels). Pure drawing, no state. */
import type { ParticleSystem } from "@/game/fx/particles";
import type { TimedPool } from "@/game/fx/timed";

const RIPPLE_RADIUS = 56;
const RIPPLE_DOTS = 28;
const RIPPLE_DOT = 4;
const LABEL_RISE = 48;
export const LABEL_PX = 16;
/** Fraction of a label's life it stays fully opaque before fading. */
const LABEL_HOLD = 0.6;
const LABEL_SHADOW = 3;
const GRID = 2;
const TAU = Math.PI * 2;

/** Palette index → CSS colour. */
type ColorOf = (index: number) => string;

/** Snap to a 2px grid so particles read as pixels, not blurry dots. */
function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  p: ParticleSystem,
  color: ColorOf,
): void {
  for (let i = 0; i < p.count; i++) {
    const s = p.size[i]!;
    ctx.globalAlpha = Math.min(1, p.fade(i) * 2);
    ctx.fillStyle = color(p.color[i]!);
    ctx.fillRect(snap(p.x[i]!), snap(p.y[i]!), s, s);
  }
}

/** Expanding ring of pixel dots. */
export function drawRipples(ctx: CanvasRenderingContext2D, r: TimedPool, color: ColorOf): void {
  for (let i = 0; i < r.count; i++) {
    const it = r.get(i);
    const t = r.progress(i);
    const radius = RIPPLE_RADIUS * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = color(it.color);
    for (let d = 0; d < RIPPLE_DOTS; d++) {
      const a = (d / RIPPLE_DOTS) * TAU;
      ctx.fillRect(
        snap(it.x + Math.cos(a) * radius),
        snap(it.y + Math.sin(a) * radius),
        RIPPLE_DOT,
        RIPPLE_DOT,
      );
    }
  }
}

interface LabelStyle {
  font: string;
  /** Hard drop-shadow colour behind the text. */
  shadow: string;
  /** Reduced motion: labels hold still. */
  still: boolean;
}

/** Floating "+XP" labels: rise, hold, then fade. */
export function drawLabels(
  ctx: CanvasRenderingContext2D,
  l: TimedPool,
  color: ColorOf,
  style: LabelStyle,
): void {
  if (l.count === 0) return;
  ctx.font = style.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (let i = 0; i < l.count; i++) {
    const it = l.get(i);
    const t = l.progress(i);
    const y = snap(it.y - (style.still ? 0 : LABEL_RISE * t));
    ctx.globalAlpha = t < LABEL_HOLD ? 1 : 1 - (t - LABEL_HOLD) / (1 - LABEL_HOLD);
    ctx.fillStyle = style.shadow;
    ctx.fillText(it.label, it.x + LABEL_SHADOW, y + LABEL_SHADOW);
    ctx.fillStyle = color(it.color);
    ctx.fillText(it.label, it.x, y);
  }
}
