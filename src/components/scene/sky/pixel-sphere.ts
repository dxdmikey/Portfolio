import { hexToRgb, type Rgb } from "@/game/scene/interpolate";
import { dither, makeOffscreen, type Offscreen } from "./sky-types";

/** Pixel-art body description. Colours are art data (hex), not UI tokens. */
export interface SphereArt {
  radius: number;
  /** Latitude bands, top to bottom (one entry = plain surface). */
  bands: readonly string[];
  /** Night-side colour; the terminator is dithered between surface and this. */
  shadow: string;
  /** Lit-edge highlight on the upper left. */
  rim: string;
  /** Craters in sphere-local units (-1..1): [x, y, radius]. */
  craters?: readonly (readonly [number, number, number])[];
  crater?: string;
  craterLit?: string;
  ring?: { colors: readonly [string, string]; rx: number; ry: number; inner: number; tilt: number };
}

/** Light from the upper left, slightly towards the viewer (unit vector). */
const LIGHT = [-0.55, -0.6, 0.58] as const;
const SHADOW_AT = 0.04;
const MID_AT = 0.32;
const MID_MIX = 0.42;
const RIM_DOT = 0.75;
const RIM_PX = 1.4;
const BAND_WOBBLE = 0.6;
const BAND_FREQ = 0.45;
const CRATER_LIT_EDGE = 0.7;
const RING_GAP = [0.8, 0.86] as const;
const RING_STRIPES = 5;
const PAD = 2;
const OPAQUE = 255;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Surface colour at a sphere-local point, before lighting. */
function surface(art: SphereArt, rgb: Map<string, Rgb>, x: number, nx: number, ny: number): Rgb {
  for (const [u, v, cr] of art.craters ?? []) {
    const d = Math.hypot(nx - u, ny - v) / cr;
    if (d >= 1) continue;
    // The lower-right inner wall catches the light; the rest of the bowl is in shade.
    const lit = d > CRATER_LIT_EDGE && nx - u + (ny - v) > 0;
    return rgb.get((lit ? art.craterLit : art.crater) ?? art.shadow)!;
  }
  const lat = Math.asin(Math.max(-1, Math.min(1, ny))) / (Math.PI / 2);
  const wobble = Math.sin(x * BAND_FREQ) * BAND_WOBBLE;
  const i = Math.floor(((lat + 1) / 2) * art.bands.length + wobble / art.radius);
  return rgb.get(art.bands[Math.max(0, Math.min(art.bands.length - 1, i))]!)!;
}

/** Ring colour at an offset from the centre, or null; `front` = the half below the equator. */
function ringAt(
  art: SphereArt,
  rgb: Map<string, Rgb>,
  dx: number,
  dy: number,
): { c: Rgb; front: boolean } | null {
  const ring = art.ring;
  if (!ring) return null;
  const rx = art.radius * ring.rx;
  const ry = art.radius * ring.ry;
  const ly = dy - dx * ring.tilt;
  const e = Math.sqrt((dx / rx) ** 2 + (ly / ry) ** 2);
  if (e > 1 || e < ring.inner || (e > RING_GAP[0] && e < RING_GAP[1])) return null;
  const stripe = Math.floor(((e - ring.inner) / (1 - ring.inner)) * RING_STRIPES) % 2;
  return { c: rgb.get(ring.colors[stripe]!)!, front: ly > 0 };
}

/** Rasterises a lit, dithered pixel planet (optionally ringed) into its own canvas. */
export function paintSphere(art: SphereArt): Offscreen {
  const r = art.radius;
  const ring = art.ring;
  const halfW = Math.ceil(ring ? r * ring.rx : r) + PAD;
  const halfH =
    Math.ceil(ring ? Math.max(r, r * ring.ry + r * ring.rx * Math.abs(ring.tilt)) : r) + PAD;
  const out = makeOffscreen(halfW * 2, halfH * 2);
  const img = out.ctx.createImageData(halfW * 2, halfH * 2);
  const rgb = new Map<string, Rgb>();
  const colours = [
    ...art.bands,
    art.shadow,
    art.rim,
    art.crater,
    art.craterLit,
    ...(ring?.colors ?? []),
  ];
  for (const c of colours) if (c) rgb.set(c, hexToRgb(c));
  const shadow = rgb.get(art.shadow)!;
  for (let y = 0; y < halfH * 2; y++) {
    for (let x = 0; x < halfW * 2; x++) {
      const dx = x + 0.5 - halfW;
      const dy = y + 0.5 - halfH;
      const dist = Math.hypot(dx, dy);
      const hit = ringAt(art, rgb, dx, dy);
      let c: Rgb | null = null;
      if (hit?.front) c = hit.c;
      else if (dist <= r) {
        const nx = dx / r;
        const ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const dot = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        const base = surface(art, rgb, x, nx, ny);
        if (dot > RIM_DOT && dist > r - RIM_PX) c = rgb.get(art.rim)!;
        else if (dot < SHADOW_AT && !dither(x, y, Math.max(0, dot + SHADOW_AT) / (2 * SHADOW_AT)))
          c = shadow;
        else if (dot < MID_AT && dither(x, y, 1 - dot / MID_AT)) c = mix(base, shadow, MID_MIX);
        else c = base;
      } else if (hit) c = hit.c;
      if (!c) continue;
      const i = (y * halfW * 2 + x) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = OPAQUE;
    }
  }
  out.ctx.putImageData(img, 0, 0);
  return out;
}
