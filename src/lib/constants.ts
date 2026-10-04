/** Storage keys — one place so nothing collides. */
export const STORAGE_KEYS = {
  visited: "visited",
  sound: "sound",
  music: "music",
  refineryBest: "refinery.shiftBest",
  /** CH4 power-up progress: powered module ids + whether the first sync ran. */
  station: "station",
  booted: "booted",
  quickView: "quickView",
} as const;

/**
 * A section counts as "visited" once it crosses the middle band of the viewport.
 * (A visibility-ratio threshold would never fire for sections taller than the screen.)
 */
export const VISIT_ROOT_MARGIN = "-40% 0px -40% 0px";

/** XP per chapter flown through (the HUD bar fills from these plus discoveries). */
export const CHAPTER_XP = 100;

/** XP per clickable discovery found. */
export const DISCOVERY_XP = 25;
