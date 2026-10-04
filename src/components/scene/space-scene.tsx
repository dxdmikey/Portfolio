"use client";

import { useRef, useState } from "react";
import { useBusEvent } from "@/hooks/use-bus";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { StationLights } from "@/game/scene/station-lights";
import { useSkyLoop } from "./use-sky-loop";

const MS_PER_S = 1000;

/**
 * The scroll-driven sky behind every chapter: moonbase → clouds → planet → nebula →
 * station (lit by CH4's power-up) → armory → asteroid belt → aurora. Decorative; the story itself is all DOM text.
 */
export function SpaceScene() {
  const ref = useRef<HTMLCanvasElement>(null);
  const peekRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  // Mutable light state the sky reads while drawing; bus events update it, never React state.
  const [lights] = useState(() => new StationLights());
  useBusEvent("station:power", (e) => lights.setPower(e.online, e.total));
  useBusEvent("station:sync", () => lights.sync(performance.now() / MS_PER_S, !reduced));
  useSkyLoop(ref, peekRef, reduced, lights);
  return (
    <>
      <canvas
        ref={ref}
        aria-hidden
        data-testid="space-scene"
        className="pixelated bg-void pointer-events-none fixed inset-0 -z-10 block h-full w-full"
      />
      {/* Phones: the station's visit during CH4's sync, drawn above the full-width panels. */}
      <canvas
        ref={peekRef}
        aria-hidden
        className="pixelated pointer-events-none fixed right-0 z-30 block md:hidden"
      />
    </>
  );
}
