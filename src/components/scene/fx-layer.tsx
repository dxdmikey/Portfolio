"use client";

import { useEffect, useRef } from "react";
import { useBusEvent } from "@/hooks/use-bus";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PingCadence } from "@/game/fx/ping-cadence";
import { useGame } from "@/providers/game-provider";
import type { Accent } from "@/types/content";
import type { FxKind } from "@/types/events";
import { FxRenderer, type FxPreset } from "./fx-renderer";
import { shakeScreen } from "./shake";
import { isBackgroundClick } from "./background-click";
import { createBackgroundPing } from "./background-ping-sound";
import { readSceneGlow } from "./scene-glow";

const MAX_DPR = 2;
const MAX_DT_S = 0.05;
const MS_PER_S = 1000;
/** Palette order: indices 0–3 match Accent, confetti cycles through them. */
const FX_VARS = ["--plasma", "--xp", "--coin", "--warp", "--dust", "--star"] as const;
const ACCENT_INDEX: Record<Accent, number> = { plasma: 0, xp: 1, coin: 2, warp: 3 };
const SMOKE_INDEX = 4;
const STAR_INDEX = 5;
const CLICKABLE = "button, a[href], [role='button'], summary";
/** Opt-in effects: `<button data-fx="ripple" data-fx-accent="warp">`. */
const OPT_IN_KINDS = new Set<string>(["burst", "confetti", "ripple", "shake", "smoke"]);

function isAccent(v: string | undefined): v is Accent {
  return v !== undefined && v in ACCENT_INDEX;
}

interface FxRequest {
  kind: FxKind | FxPreset;
  x: number;
  y: number;
  color: number;
  label?: string;
}

/** Routes one effect to the renderer (shake goes to the DOM instead). */
function playFx(
  r: FxRenderer,
  { kind, x, y, color, label }: FxRequest,
  reduced: boolean,
  kick: () => void,
) {
  if (kind === "shake") {
    if (!reduced) shakeScreen();
    return;
  }
  if (kind === "ripple") r.ripple(x, y, color);
  else if (kind === "xp") r.label(x, y, color, label ?? "+XP");
  else if (kind === "smoke") r.burst("smoke", x, y, SMOKE_INDEX);
  else r.burst(kind, x, y, color);
  kick();
}

/**
 * Fixed canvas above the content for click juice. Plays bus `fx` events, gives every
 * button/link a small spark, honours `data-fx` opt-ins, and answers clicks on empty
 * background with a "star ping" (pointer-events stay off, so clicks pass through). Only animates while
 * something is alive; under reduced motion only the "+XP" label shows (without moving).
 */
export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const fx = useRef<FxRenderer | null>(null);
  const kick = useRef<() => void>(() => {});
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const { sfx } = useGame();

  useEffect(() => {
    reducedRef.current = reduced;
    fx.current?.setStill(reduced);
  }, [reduced]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new FxRenderer(canvas, MAX_DPR, reducedRef.current);
    fx.current = renderer;
    const cadence = new PingCadence();
    const playBackgroundPing = createBackgroundPing(sfx);
    let fallbackGlow = "";
    let raf = 0;
    let last = 0;

    const readPalette = () => {
      const css = getComputedStyle(document.documentElement);
      const get = (v: string) => css.getPropertyValue(v).trim();
      renderer.setPalette(FX_VARS.map(get), get("--void"), get("--font-press-start"));
      fallbackGlow = get("--plasma");
    };
    const resize = () =>
      renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / MS_PER_S, MAX_DT_S) : 0;
      last = now;
      raf = renderer.frame(dt) ? requestAnimationFrame(tick) : 0;
    };
    kick.current = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    /** Empty-space click: a ring + twinkle in the chapter's glow; every 6th, a shooting star. */
    const starPing = (x: number, y: number) => {
      const kind = cadence.hit(performance.now());
      if (kind === "skip") return;
      renderer.ping(x, y, readSceneGlow() || fallbackGlow, kind === "shooting", STAR_INDEX);
      playBackgroundPing(x, window.innerWidth);
      kick.current();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const opt = target?.closest<HTMLElement>("[data-fx]");
      const kind = opt?.dataset.fx;
      const accentAttr = (opt ?? target?.closest<HTMLElement>("[data-fx-accent]"))?.dataset
        .fxAccent;
      const color = isAccent(accentAttr) ? ACCENT_INDEX[accentAttr] : ACCENT_INDEX.plasma;
      const effect: FxKind | FxPreset | null =
        kind && OPT_IN_KINDS.has(kind)
          ? (kind as FxKind | FxPreset)
          : target?.closest(CLICKABLE)
            ? "spark"
            : null;
      if (effect)
        playFx(
          renderer,
          { kind: effect, x: e.clientX, y: e.clientY, color },
          reducedRef.current,
          kick.current,
        );
      else if (isBackgroundClick(e)) starPing(e.clientX, e.clientY);
    };

    const themeObserver = new MutationObserver(readPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    readPalette();
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      fx.current = null;
    };
  }, [sfx]);

  useBusEvent("fx", (e) => {
    if (fx.current)
      playFx(
        fx.current,
        { kind: e.kind, x: e.x, y: e.y, color: ACCENT_INDEX[e.accent], label: e.label },
        reducedRef.current,
        kick.current,
      );
  });

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="story-only pointer-events-none fixed inset-0 z-[45] block h-full w-full"
    />
  );
}
