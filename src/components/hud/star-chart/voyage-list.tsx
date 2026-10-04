"use client";

import { cn } from "@/lib/cn";
import { accentText } from "@/components/ui/accent";
import { FlightPathList } from "@/components/shared/galaxy/flight-path-list";
import { PlanetSphere } from "@/components/shared/galaxy/planet-sphere";
import { chapters } from "@/content/story";
import type { Project } from "@/types/content";
import { chapterPlanets, chartProjects, type ChartPlanetSpec } from "./chart-layout";
import { starChartCopy } from "./copy";
import type { ChartProgress } from "./voyage-map";

interface VoyageListProps extends ChartProgress {
  onChapter: (planet: ChartPlanetSpec) => void;
  onProject: (project: Project) => void;
}

const heading = "font-pixel text-px-xs text-coin mb-3 uppercase";

/** Mobile (<640px) star chart: chapters as a warp list, then the v1 flight-path list of projects. */
export function VoyageList({ opened, visited, current, onChapter, onProject }: VoyageListProps) {
  return (
    <div className="flex flex-col gap-6 sm:hidden">
      <section>
        <h3 className={heading}>{starChartCopy.chaptersHeading}</h3>
        <ol className="flex flex-col gap-2">
          {chapters.map((c, i) => {
            const spec = chapterPlanets[i];
            if (!spec) return null;
            const here = current === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onChapter(spec)}
                  className={cn(
                    "border-grid bg-nebula shadow-pixel-sm hover:border-plasma flex min-h-12 w-full cursor-pointer items-center gap-3 border-2 p-2 text-left [--planet-scale:0.5]",
                    here && "border-coin",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center">
                    <PlanetSphere accent={spec.accent} size={spec.size} ring={false} spin={false} />
                  </span>
                  <span
                    className={cn(
                      "font-pixel text-px-xs w-10 shrink-0 uppercase",
                      accentText[spec.accent],
                    )}
                  >
                    CH{c.number}
                  </span>
                  <span className="text-starlight flex-1 leading-tight">{c.label}</span>
                  {visited.has(c.id) ? (
                    <span aria-hidden className="text-xp">
                      ✓
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {starChartCopy.chapterSr(c.number, here, visited.has(c.id))}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="-mx-4">
        <h3 className={cn(heading, "px-4")}>{starChartCopy.projectsHeading}</h3>
        <FlightPathList projects={chartProjects} opened={opened} onSelect={onProject} />
      </section>
    </div>
  );
}
