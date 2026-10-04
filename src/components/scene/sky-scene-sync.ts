import { chapters } from "@/content/story";
import { scenes } from "@/content/scenes";
import { chapterPosition, colorDelta, sceneAt } from "@/game/scene/interpolate";
import type { SceneKeyframe } from "@/types/story";
import { SCENE_GLOW_VAR } from "./scene-glow";
import type { SkyRenderer } from "./sky/sky-renderer";

/** Skip re-blending the scene when the chapter position barely moved. */
const POSITION_EPSILON = 0.0005;
/** Only restyle the page's `--scene-glow` once the colour moved this much (0–255 per channel). */
const GLOW_STEP = 6;

function keyframesFor(light: boolean): SceneKeyframe[] {
  return chapters.map((c) => scenes[c.scene][light ? "light" : "dark"]);
}

/** Document-relative top of each chapter; missing ones reuse the previous top. */
function measureTops(): number[] {
  let prev = 0;
  return chapters.map((c) => {
    const el = document.getElementById(c.id);
    if (el) prev = el.getBoundingClientRect().top + window.scrollY;
    return prev;
  });
}

/**
 * Maps scroll position to the blended chapter scene and hands it to the sky renderer, and
 * mirrors the scene glow into `--scene-glow` on <html>. Chapter tops are measured only on
 * `remeasure()` (resize / content changes), never per frame, so scrolling causes no layout reads.
 */
export class SkySceneSync {
  private keyframes: SceneKeyframe[];
  private tops: number[] = [];
  private lastPos = Number.NaN;
  private glow = "";

  constructor(
    private readonly sky: SkyRenderer,
    private readonly root: HTMLElement,
    light: boolean,
  ) {
    this.keyframes = keyframesFor(light);
  }

  setTheme(light: boolean): void {
    this.keyframes = keyframesFor(light);
    this.lastPos = Number.NaN;
  }

  remeasure(): void {
    this.tops = measureTops();
    this.lastPos = Number.NaN;
  }

  /** Blend the scene for the current scroll position (no-op if it barely moved, unless `force`). */
  sync(force = false): void {
    const pos = chapterPosition(window.scrollY, window.innerHeight, this.tops);
    if (!force && Math.abs(pos - this.lastPos) < POSITION_EPSILON) return;
    this.lastPos = pos;
    const scene = sceneAt(this.keyframes, pos);
    this.sky.setScene(scene);
    if (!this.glow || force || colorDelta(this.glow, scene.glow) >= GLOW_STEP) {
      this.glow = scene.glow;
      this.root.style.setProperty(SCENE_GLOW_VAR, this.glow);
    }
  }

  dispose(): void {
    this.root.style.removeProperty(SCENE_GLOW_VAR);
  }
}
