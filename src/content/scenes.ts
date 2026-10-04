import type { SceneKey, SceneLayers, ScenePalette } from "@/types/story";

const NONE: SceneLayers = {
  moonbase: 0,
  planets: 0,
  clouds: 0,
  planet: 0,
  nebula: 0,
  station: 0,
  asteroids: 0,
  aurora: 0,
  stars: 1,
};

const layers = (overrides: Partial<SceneLayers>): SceneLayers => ({ ...NONE, ...overrides });

/**
 * Sky keyframes per scene: one neon colour per chapter (violet → blue → ultraviolet →
 * pink → cyan → amber → green → emerald). The renderer blends neighbouring chapters as
 * you scroll, so the hue sweeps through the spectrum on the way down.
 *
 * Contrast rule (tested in `tests/unit/scenes.test.ts`): copy can sit straight on the sky,
 * so every gradient stop keeps `dust` and `coin` text at ≥4.5:1. The neon comes from the
 * `glow` (props, horizon band, `--scene-glow` UI accents), not from bright backgrounds.
 * Dark tops are near-black, bottoms deep and saturated, `horizon` the richest band.
 * Light ("day mode") uses pale pastels of the same hue with a deeper glow.
 */
export const scenes: Record<SceneKey, ScenePalette> = {
  launchpad: {
    dark: {
      skyTop: "#07051a",
      skyBottom: "#1d0f4a",
      horizon: "#3a1478",
      glow: "#a467ff",
      layers: layers({ moonbase: 1, planets: 1, nebula: 0.3, asteroids: 0.35, stars: 1.6 }),
    },
    light: {
      skyTop: "#f6f2ff",
      skyBottom: "#f0eaff",
      horizon: "#d9c8ff",
      glow: "#6a2fe0",
      layers: layers({ moonbase: 1, planets: 1, nebula: 0.2, asteroids: 0.3, stars: 0.4 }),
    },
  },
  atmosphere: {
    dark: {
      skyTop: "#040824",
      skyBottom: "#0a1a66",
      horizon: "#0a229a",
      glow: "#3d8bff",
      layers: layers({ clouds: 1, stars: 0.8 }),
    },
    light: {
      skyTop: "#f0f6ff",
      skyBottom: "#e2edff",
      horizon: "#c6dbff",
      glow: "#1f5fd6",
      layers: layers({ clouds: 1, stars: 0 }),
    },
  },
  planet: {
    dark: {
      skyTop: "#0a0520",
      skyBottom: "#220b55",
      horizon: "#4a0f8f",
      glow: "#b44bff",
      layers: layers({ planet: 1, stars: 1 }),
    },
    light: {
      skyTop: "#f7f0ff",
      skyBottom: "#f4ecff",
      horizon: "#ddc4ff",
      glow: "#7a2ad1",
      layers: layers({ planet: 1, stars: 0.3 }),
    },
  },
  nebula: {
    dark: {
      skyTop: "#12041c",
      skyBottom: "#3a0a45",
      horizon: "#640a5a",
      glow: "#ff2bd6",
      layers: layers({ nebula: 1, stars: 0.9 }),
    },
    light: {
      skyTop: "#fff2fa",
      skyBottom: "#ffe6f5",
      horizon: "#ffc8ea",
      glow: "#c0108f",
      layers: layers({ nebula: 1, stars: 0.3 }),
    },
  },
  station: {
    dark: {
      skyTop: "#020c18",
      skyBottom: "#052a3d",
      horizon: "#04394c",
      glow: "#19e6ff",
      layers: layers({ station: 1, stars: 1 }),
    },
    light: {
      skyTop: "#eefcff",
      skyBottom: "#def7fc",
      horizon: "#b9eef8",
      glow: "#00799a",
      layers: layers({ station: 1, stars: 0.3 }),
    },
  },
  armory: {
    dark: {
      skyTop: "#120805",
      skyBottom: "#3a1606",
      horizon: "#5e2604",
      glow: "#ff9a1f",
      layers: layers({ nebula: 0.3, stars: 1 }),
    },
    light: {
      skyTop: "#fff8ee",
      skyBottom: "#ffefda",
      horizon: "#ffd9ab",
      glow: "#b35400",
      layers: layers({ nebula: 0.2, stars: 0.3 }),
    },
  },
  belt: {
    dark: {
      skyTop: "#03110a",
      skyBottom: "#06301a",
      horizon: "#08401a",
      glow: "#39ff6a",
      layers: layers({ asteroids: 1 }),
    },
    light: {
      skyTop: "#f2fdf0",
      skyBottom: "#e3fadf",
      horizon: "#c3f2bb",
      glow: "#23861b",
      layers: layers({ asteroids: 1, stars: 0.3 }),
    },
  },
  aurora: {
    dark: {
      skyTop: "#021310",
      skyBottom: "#053329",
      horizon: "#043a2f",
      glow: "#2bffc0",
      layers: layers({ aurora: 1 }),
    },
    light: {
      skyTop: "#effdf8",
      skyBottom: "#dcf8ee",
      horizon: "#b8eedb",
      glow: "#0b8462",
      layers: layers({ aurora: 1, stars: 0.3 }),
    },
  },
};
