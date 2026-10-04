import { describe, expect, it } from "vitest";
import { scenes } from "@/content/scenes";
import { blendKeyframes, colorDelta, hexToRgb } from "@/game/scene/interpolate";
import type { SceneKeyframe } from "@/types/story";

/** Token values from globals.css that can sit straight on the sky. */
const TEXT = {
  dark: { dust: "#9a9ed6", coin: "#ffc93c", starlight: "#e8e9ff" },
  light: { dust: "#4c4f86", coin: "#925f00", starlight: "#17183a" },
} as const;
const AA = 4.5;

function luminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const stops = (k: SceneKeyframe) => [k.skyTop, k.skyBottom, k.horizon];

describe("scene palettes", () => {
  const entries = Object.entries(scenes);

  it.each(entries)("%s keeps text readable on every dark sky stop", (_, palette) => {
    for (const bg of stops(palette.dark)) {
      for (const fg of Object.values(TEXT.dark))
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
    }
  });

  it.each(entries)("%s keeps text readable on every light sky stop", (_, palette) => {
    for (const bg of [palette.light.skyTop, palette.light.skyBottom]) {
      for (const fg of Object.values(TEXT.light))
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
    }
    expect(contrast(TEXT.light.dust, palette.light.horizon)).toBeGreaterThanOrEqual(AA);
  });

  it("gives each chapter its own neon hue", () => {
    const glows = entries.map(([, p]) => p.dark.glow);
    expect(new Set(glows).size).toBe(glows.length);
  });

  it("uses the same layer keys in every keyframe", () => {
    const keys = Object.keys(scenes.launchpad.dark.layers).sort();
    for (const [, p] of entries) {
      expect(Object.keys(p.dark.layers).sort()).toEqual(keys);
      expect(Object.keys(p.light.layers).sort()).toEqual(keys);
    }
  });

  it("blends the horizon band and measures colour change", () => {
    const mid = blendKeyframes(scenes.launchpad.dark, scenes.atmosphere.dark, 0.5);
    expect(mid.horizon).not.toBe(scenes.launchpad.dark.horizon);
    expect(colorDelta("#000000", "#0a0000")).toBe(10);
    expect(colorDelta("#123456", "#123456")).toBe(0);
  });
});
