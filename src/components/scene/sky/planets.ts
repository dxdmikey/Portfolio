import { paintSphere, type SphereArt } from "./pixel-sphere";
import type { Offscreen, SkyFrame, SkyLayer } from "./sky-types";

/** Art palettes (canvas data, not UI tokens): a sunset-banded gas giant, a grey moon, a teal dot. */
const GIANT = {
  bands: ["#ffcf9e", "#ff9a7a", "#e4577a", "#ffb38a", "#c94a8f", "#ff8a6e", "#8a3a9e"],
  shadow: "#24104a",
  rim: "#fff0d6",
  ring: ["#ffd9a8", "#c98bd8"],
} as const;
const MOON = {
  bands: ["#bdb7e0"],
  shadow: "#26224d",
  rim: "#eeeaff",
  crater: "#8a83bb",
  craterLit: "#dcd8f5",
} as const;
const DOT = {
  bands: ["#5fe3d6", "#2fa7b8", "#5fe3d6"],
  shadow: "#0f3050",
  rim: "#c9fff8",
} as const;
const MOON_CRATERS = [
  [-0.35, -0.2, 0.28],
  [0.3, 0.25, 0.22],
  [0.15, -0.55, 0.16],
  [-0.15, 0.55, 0.18],
  [0.6, -0.15, 0.13],
] as const;

interface Body {
  /** Radius as a fraction of the smaller screen side, with a pixel floor. */
  size: number;
  min: number;
  /** Resting centre as screen fractions. */
  x: number;
  y: number;
  /** Phones (portrait): tuck the body beside the hero instead of behind the stacked name. */
  portrait: { x: number; y: number };
  /** Fraction of scroll the body climbs (deeper = slower). */
  parallax: number;
  /** Horizontal drift amplitude (px) and rate (Hz). */
  drift: number;
  hz: number;
  art: (radius: number) => SphereArt;
}

const BODIES: readonly Body[] = [
  {
    size: 0.022,
    min: 3,
    x: 0.6,
    y: 0.09,
    portrait: { x: 0.82, y: 0.07 },
    parallax: 0.1,
    drift: 1,
    hz: 0.015,
    art: (radius) => ({ radius, ...DOT }),
  },
  {
    size: 0.13,
    min: 14,
    x: 0.9,
    y: 0.15,
    portrait: { x: 0.96, y: 0.42 },
    parallax: 0.22,
    drift: 2,
    hz: 0.02,
    art: (radius) => ({
      radius,
      bands: GIANT.bands,
      shadow: GIANT.shadow,
      rim: GIANT.rim,
      ring: { colors: GIANT.ring, rx: 1.8, ry: 0.32, inner: 0.62, tilt: -0.16 },
    }),
  },
  {
    size: 0.055,
    min: 6,
    x: 0.13,
    y: 0.13,
    portrait: { x: 0.08, y: 0.36 },
    parallax: 0.35,
    drift: 1.5,
    hz: 0.03,
    art: (radius) => ({ radius, ...MOON, craters: MOON_CRATERS }),
  },
];
/** Backdrop, not a feature: the hero copy sits over these. */
const OPACITY = { dark: 0.62, light: 0.42 } as const;
const TAU = Math.PI * 2;

/** The launchpad's sky: ringed gas giant, cratered moon and a distant planet, slow parallax. */
export class PlanetsLayer implements SkyLayer {
  private sprites: Offscreen[] = [];
  private w = 0;
  private h = 0;
  private light = false;
  private portrait = false;

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.portrait = h > w;
    const side = Math.min(w, h);
    this.sprites = BODIES.map((b) =>
      paintSphere(b.art(Math.max(b.min, Math.round(side * b.size)))),
    );
  }

  setTheme(light: boolean): void {
    this.light = light;
  }

  draw(ctx: CanvasRenderingContext2D, f: SkyFrame, alpha: number): void {
    if (alpha <= 0 || this.sprites.length === 0) return;
    ctx.globalAlpha = alpha * (this.light ? OPACITY.light : OPACITY.dark);
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i]!;
      const img = this.sprites[i]!.canvas;
      const at = this.portrait ? b.portrait : b;
      const x = this.w * at.x + Math.sin(f.time * b.hz * TAU) * b.drift - img.width / 2;
      const y = this.h * at.y - f.scroll * b.parallax - img.height / 2;
      if (y + img.height >= 0) ctx.drawImage(img, x | 0, y | 0);
    }
    ctx.globalAlpha = 1;
  }
}
