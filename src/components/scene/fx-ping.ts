/**
 * Drawing for background-click effects: the "star ping" ring + twinkle, and shooting
 * stars. Kept apart from `FxRenderer` so each file stays one job.
 */
import type { TimedPool } from "@/game/fx/timed";
import type { StreakPool } from "@/game/fx/streaks";

const PING_RADIUS = 38;
const PING_START = 4;
/** Reduced motion: a ring that fades in place instead of expanding. */
const PING_STILL_RADIUS = 16;
const PING_DOTS = 24;
const DOT = 4;
const TWINKLE_ARM = 10;
const TWINKLE_W = 2;
const TRAIL = 16;
const TRAIL_STEP_S = 0.014;
const HEAD = 5;
const TAIL = 3;
const GRID = 2;
const TAU = Math.PI * 2;

const snap = (v: number) => Math.round(v / GRID) * GRID;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

export function drawPings(
  ctx: CanvasRenderingContext2D,
  pings: TimedPool,
  color: string,
  star: string,
  still: boolean,
): void {
  for (let i = 0; i < pings.count; i++) {
    const it = pings.get(i);
    const t = pings.progress(i);
    const radius = still ? PING_STILL_RADIUS : PING_START + (PING_RADIUS - PING_START) * easeOut(t);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = color;
    for (let d = 0; d < PING_DOTS; d++) {
      const a = (d / PING_DOTS) * TAU;
      ctx.fillRect(snap(it.x + Math.cos(a) * radius), snap(it.y + Math.sin(a) * radius), DOT, DOT);
    }
    if (still) continue;
    // Four-point starlight twinkle at the centre, shrinking as the ring grows.
    const arm = Math.round(TWINKLE_ARM * (1 - t));
    const cx = snap(it.x);
    const cy = snap(it.y);
    ctx.fillStyle = star;
    ctx.fillRect(cx - arm, cy, arm * 2 + TWINKLE_W, TWINKLE_W);
    ctx.fillRect(cx, cy - arm, TWINKLE_W, arm * 2 + TWINKLE_W);
  }
}

export function drawStreaks(
  ctx: CanvasRenderingContext2D,
  streaks: StreakPool,
  head: string,
  trail: string,
): void {
  for (let i = 0; i < streaks.count; i++) {
    const s = streaks.get(i);
    const fade = 1 - s.age / s.duration;
    for (let k = TRAIL - 1; k >= 0; k--) {
      const t = Math.max(0, s.age - k * TRAIL_STEP_S);
      const size = k === 0 ? HEAD : TAIL;
      ctx.globalAlpha = fade * (1 - k / TRAIL);
      ctx.fillStyle = k === 0 ? head : trail;
      ctx.fillRect(snap(s.x + s.vx * t), snap(s.y + s.vy * t), size, size);
    }
  }
}
