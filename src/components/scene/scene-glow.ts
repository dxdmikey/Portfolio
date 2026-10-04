/**
 * The sky loop publishes the blended chapter glow as a CSS custom property on <html>, so
 * DOM accents (chapter headings, the HUD rule, background-click pings) follow the sky.
 * CSS reads it as `var(--scene-glow, var(--plasma))`.
 */
export const SCENE_GLOW_VAR = "--scene-glow";

/** Current scene glow, or "" before the sky has started. */
export function readSceneGlow(): string {
  return document.documentElement.style.getPropertyValue(SCENE_GLOW_VAR).trim();
}
