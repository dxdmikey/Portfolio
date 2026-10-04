"use client";

import { useEffect, type RefObject } from "react";
import type { StationLights } from "@/game/scene/station-lights";
import { SkyFrameClock } from "./sky-frame-clock";
import { SkySceneSync } from "./sky-scene-sync";
import { SkyRenderer } from "./sky/sky-renderer";

const MS_PER_S = 1000;
/** Reduced motion: redraw once scrolling settles. */
const SETTLE_MS = 120;
/** Rebuilding the pixel art is the expensive part — wait until resizing stops. */
const RESIZE_DEBOUNCE_MS = 150;
/** Content height changes in bursts (panels opening, images); measure once it settles. */
const REMEASURE_DEBOUNCE_MS = 200;
/** Start the sky after the page is interactive; until then the canvas shows plain void. */
const START_TIMEOUT_MS = 1500;

/** Run `fn` once the browser is idle (Safari has no requestIdleCallback: plain timeout). Returns a cancel. */
function whenIdle(fn: () => void): () => void {
  const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
  if (ric) {
    const id = ric(fn, { timeout: START_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, START_TIMEOUT_MS);
  return () => window.clearTimeout(id);
}

/**
 * Drives the sky canvas: blends chapter scenes from scroll (`SkySceneSync`), paced by
 * `SkyFrameClock` (full rate while scrolling or during the station sync, slow idle cadence
 * otherwise). Pauses when the tab is hidden or quick view is on. Reduced motion draws one
 * static frame whenever scrolling settles.
 */
export function useSkyLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  peekRef: RefObject<HTMLCanvasElement | null>,
  reduced: boolean,
  lights: StationLights,
) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const root = document.documentElement;
    const sky = new SkyRenderer(canvas, lights, peekRef.current);
    let light = root.dataset.theme === "light";
    const scene = new SkySceneSync(sky, root, light);
    let started = false;
    let settle = 0;
    let resizing = 0;
    let remeasuring = 0;

    const paused = () => document.hidden || root.dataset.quick !== undefined;
    const clock = new SkyFrameClock({
      canRun: () => started && !reduced && !paused(),
      busy: (now) => lights.busy(now),
      draw: (time, dt, now) => {
        scene.sync();
        sky.render(time, dt, window.scrollY, now);
      },
    });
    const drawStatic = () => {
      scene.sync(true);
      const now = performance.now() / MS_PER_S;
      sky.render(reduced ? 0 : clock.elapsed, 0, reduced ? 0 : window.scrollY, now);
    };

    const onScroll = () => {
      if (!reduced) return clock.poke();
      window.clearTimeout(settle);
      settle = window.setTimeout(drawStatic, SETTLE_MS);
    };
    const remeasure = () => {
      scene.remeasure();
      if (reduced || paused()) drawStatic();
    };
    const onBodyResize = () => {
      window.clearTimeout(remeasuring);
      remeasuring = window.setTimeout(remeasure, REMEASURE_DEBOUNCE_MS);
    };
    const onResize = () => {
      sky.resize(window.innerWidth, window.innerHeight);
      remeasure();
      drawStatic();
    };
    const onWindowResize = () => {
      window.clearTimeout(resizing);
      resizing = window.setTimeout(onResize, RESIZE_DEBOUNCE_MS);
    };
    const onAttrs = () => {
      const nextLight = root.dataset.theme === "light";
      if (nextLight !== light) {
        light = nextLight;
        scene.setTheme(light);
        sky.setTheme(light);
        drawStatic();
      }
      if (paused()) clock.stop();
      else clock.schedule();
    };
    const onVisibility = () => (paused() ? clock.stop() : clock.schedule());
    /** Station lights changed (CH4 power-up/sync): redraw now; the cascade then runs full rate. */
    const offLights = lights.subscribe(() => {
      if (!started) return;
      if (reduced || paused()) drawStatic();
      else clock.wake();
    });

    const cancelStart = whenIdle(() => {
      if (started) return;
      started = true;
      sky.setTheme(light);
      onResize();
      clock.schedule();
    });
    const attrs = new MutationObserver(onAttrs);
    attrs.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-quick"] });
    const sizes = new ResizeObserver(onBodyResize);
    sizes.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onWindowResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clock.stop();
      cancelStart();
      [remeasuring, settle, resizing].forEach((t) => window.clearTimeout(t));
      attrs.disconnect();
      sizes.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.dispose();
      offLights();
    };
  }, [ref, peekRef, reduced, lights]);
}
