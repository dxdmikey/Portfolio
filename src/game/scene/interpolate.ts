import type { SceneKeyframe, SceneLayers } from "@/types/story";

const HEX_RADIX = 16;
const CHANNEL_MAX = 255;

export type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.replace("#", ""), HEX_RADIX);
  return [(n >> 16) & CHANNEL_MAX, (n >> 8) & CHANNEL_MAX, n & CHANNEL_MAX];
}

function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) => Math.round(v).toString(HEX_RADIX).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const k = clamp01(t);
  return rgbToHex([lerp(ca[0], cb[0], k), lerp(ca[1], cb[1], k), lerp(ca[2], cb[2], k)]);
}

/** Largest per-channel difference between two hex colours (0–255). */
export function colorDelta(a: string, b: string): number {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return Math.max(Math.abs(ca[0] - cb[0]), Math.abs(ca[1] - cb[1]), Math.abs(ca[2] - cb[2]));
}

/** Smoothstep easing so scenes hold, then cross-fade near chapter boundaries. */
export function ease(t: number): number {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
}

export function blendKeyframes(a: SceneKeyframe, b: SceneKeyframe, t: number): SceneKeyframe {
  const k = ease(t);
  const layers = Object.fromEntries(
    (Object.keys(a.layers) as (keyof SceneLayers)[]).map((key) => [
      key,
      lerp(a.layers[key], b.layers[key], k),
    ]),
  ) as unknown as SceneLayers;
  return {
    skyTop: lerpColor(a.skyTop, b.skyTop, k),
    skyBottom: lerpColor(a.skyBottom, b.skyBottom, k),
    horizon: lerpColor(a.horizon, b.horizon, k),
    glow: lerpColor(a.glow, b.glow, k),
    layers,
  };
}

/**
 * Continuous chapter position: 2.0 means "at the top of chapter 2", 2.5 means halfway
 * through it. Measured at the viewport's vertical centre.
 */
export function chapterPosition(
  scrollY: number,
  viewportHeight: number,
  chapterTops: readonly number[],
): number {
  if (chapterTops.length === 0) return 0;
  const probe = scrollY + viewportHeight / 2;
  for (let i = chapterTops.length - 1; i >= 0; i -= 1) {
    const top = chapterTops[i] ?? 0;
    if (probe >= top) {
      const next = chapterTops[i + 1];
      if (next === undefined) return i;
      return i + clamp01((probe - top) / Math.max(next - top, 1));
    }
  }
  return 0;
}

/**
 * Share of each chapter (from its top) where its own sky holds before cross-fading to the
 * next one. Without it the launchpad would already be half-blended at scroll 0 (the probe
 * sits at the viewport centre), and every chapter would read as "in between".
 */
export const SCENE_HOLD = 0.4;

/** Blended sky for a continuous chapter position. */
export function sceneAt(keyframes: readonly SceneKeyframe[], position: number): SceneKeyframe {
  const first = keyframes[0];
  if (!first) throw new Error("sceneAt needs at least one keyframe");
  const i = Math.max(0, Math.min(keyframes.length - 1, Math.floor(position)));
  const a = keyframes[i] ?? first;
  const b = keyframes[i + 1] ?? a;
  return blendKeyframes(a, b, clamp01((position - i - SCENE_HOLD) / (1 - SCENE_HOLD)));
}
