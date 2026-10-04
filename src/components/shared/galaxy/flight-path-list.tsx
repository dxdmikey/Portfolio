"use client";

import { cn } from "@/lib/cn";
import { accentText } from "@/components/ui/accent";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Project } from "@/types/content";
import { PlanetSphere } from "./planet-sphere";
import { STATUS_META } from "./status";

interface FlightPathListProps {
  projects: readonly Project[];
  opened: ReadonlySet<string>;
  onSelect: (project: Project) => void;
}

/** Mobile (<640px) version of the map: a vertical flight path, one row per planet. */
export function FlightPathList({ projects, opened, onSelect }: FlightPathListProps) {
  return (
    <ol className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 [--planet-scale:0.5] sm:hidden">
      <span
        aria-hidden
        className="border-plasma/50 absolute top-6 bottom-6 left-[3.125rem] border-l-2 border-dashed"
      />
      {projects.map((p) => {
        const meta = STATUS_META[p.status];
        const briefed = opened.has(p.id);
        return (
          <li key={p.id} className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onSelect(p)}
              className="border-grid bg-nebula shadow-pixel-sm hover:border-plasma flex min-h-16 w-full cursor-pointer items-center gap-3 border-2 p-3 text-left"
            >
              <span className="bg-nebula grid size-10 shrink-0 place-items-center">
                <PlanetSphere
                  accent={p.accent}
                  size={p.planet.size}
                  ring={p.planet.ring}
                  spin={false}
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={cn("font-pixel text-px-xs uppercase", accentText[p.accent])}>
                  {p.codename}
                  {briefed ? (
                    <span className="text-xp">
                      {" "}
                      ✓<span className="sr-only"> briefing read</span>
                    </span>
                  ) : null}
                </span>
                <span className="text-starlight leading-tight">{p.name}</span>
                <StatusBadge accent={meta.accent} className="self-start">
                  {meta.label}
                </StatusBadge>
              </span>
              <span aria-hidden className="font-pixel text-px-sm text-dust">
                &gt;
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
