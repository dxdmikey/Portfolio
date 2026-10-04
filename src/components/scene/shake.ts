/** Matches `fx-shake` in globals.css. */
const SHAKE_MS = 360;
const ATTR = "shake";

let timer = 0;

/**
 * Screen shake: toggles `html[data-shake]`, which runs a short CSS keyframe on the story
 * content (`#main`, `#launchpad`) but not the HUD. Restarts cleanly if called mid-shake.
 */
export function shakeScreen(): void {
  const root = document.documentElement;
  delete root.dataset[ATTR];
  // Force a reflow so re-adding the attribute restarts the animation.
  void root.offsetWidth;
  root.dataset[ATTR] = "1";
  window.clearTimeout(timer);
  timer = window.setTimeout(() => delete root.dataset[ATTR], SHAKE_MS);
}
