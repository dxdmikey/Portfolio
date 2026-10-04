"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { accentText } from "@/components/ui/accent";
import { PlanetSphere } from "@/components/shared/galaxy/planet-sphere";
import { Reticle } from "@/components/shared/galaxy/reticle";
import type { ChartPlanetSpec } from "./chart-layout";

/** Stagger the idle bob so planets don't move in lockstep. */
const BOB_STAGGER_S = 0.6;
const PERCENT = 100;

interface ChartPlanetProps {
  spec: ChartPlanetSpec;
  index: number;
  /** Small pixel caption above the name (e.g. "CH3" or a codename). */
  kicker: string;
  name: string;
  /** Extra screen-reader text appended to the visible label. */
  srText: string;
  live?: boolean;
  done?: boolean;
  reducedMotion: boolean;
  haspopup?: boolean;
  onSelect: () => void;
}

/** One planet on the star chart: a real <button> anchored at its sphere centre. */
export function ChartPlanet({
  spec,
  index,
  kicker,
  name,
  srText,
  live,
  done,
  reducedMotion,
  haspopup,
  onSelect,
}: ChartPlanetProps) {
  const position = {
    left: `${spec.at.x * PERCENT}%`,
    top: `${spec.at.y * PERCENT}%`,
    "--planet-half": `calc(${spec.size}px * var(--planet-scale, 1) / 2)`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-haspopup={haspopup ? "dialog" : undefined}
      onClick={onSelect}
      style={position}
      className="group absolute z-10 flex w-32 -translate-x-1/2 -translate-y-[calc(var(--planet-half)+0.5rem)] cursor-pointer flex-col items-center gap-2 p-2"
    >
      <span
        className={cn(!reducedMotion && "animate-float")}
        style={{ animationDelay: `${index * BOB_STAGGER_S}s` }}
      >
        <span className="relative block transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110">
          {live ? (
            <>
              <span
                aria-hidden
                className="border-plasma absolute -inset-2 animate-ping border-2 opacity-60"
              />
              <span className="font-pixel text-px-xs text-on-accent bg-plasma absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5">
                LIVE
              </span>
            </>
          ) : null}
          <PlanetSphere
            accent={spec.accent}
            size={spec.size}
            ring={spec.ring}
            spin={!reducedMotion}
          />
          <Reticle />
        </span>
      </span>
      <span className="bg-void/75 flex flex-col items-center gap-0.5 px-1.5 py-1 text-center">
        <span className={cn("font-pixel text-px-xs uppercase", accentText[spec.accent])}>
          {kicker}
          {done ? (
            <span aria-hidden className="text-xp">
              {" "}
              ✓
            </span>
          ) : null}
        </span>
        <span className="text-starlight text-sm leading-tight">{name}</span>
        <span className="sr-only">{srText}</span>
      </span>
    </button>
  );
}
