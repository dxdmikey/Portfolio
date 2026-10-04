/**
 * Story model for "The Voyage": the page is a flight through chapters,
 * each paired with a sky scene that the background blends towards.
 */

export type SceneKey =
  "launchpad" | "atmosphere" | "planet" | "nebula" | "station" | "armory" | "belt" | "aurora";

export interface Chapter {
  id: string;
  /** Displayed as CH0, CH1… */
  number: number;
  label: string;
  /** Short label for the mobile HUD. */
  short: string;
  /** One-line subtitle shown under the chapter heading. */
  tagline: string;
  scene: SceneKey;
}

/** Background layers the sky renderer can fade in and out. */
export interface SceneLayers {
  /** CH0 lunar horizon with the launch tower and habitat domes. */
  moonbase: number;
  /** CH0 backdrop bodies: ringed gas giant, cratered moon, distant planet. */
  planets: number;
  clouds: number;
  planet: number;
  nebula: number;
  station: number;
  asteroids: number;
  aurora: number;
  /** Star density multiplier: 1 = the normal field, up to 1.6 for the extra-dense launchpad sky. */
  stars: number;
}

/** A sky keyframe. Colours are hex strings (art data, like the sprite palette). */
export interface SceneKeyframe {
  skyTop: string;
  skyBottom: string;
  /** Saturated band under the bottom of the gradient (the neon "horizon" of the scene). */
  horizon: string;
  /** Accent used by scene props (planet, nebula gas, aurora). */
  glow: string;
  layers: SceneLayers;
}

export interface ScenePalette {
  dark: SceneKeyframe;
  light: SceneKeyframe;
}
