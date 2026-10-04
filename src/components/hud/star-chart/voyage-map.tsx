"use client";

import { useRef } from "react";
import { ChartBackdrop } from "@/components/shared/galaxy/chart-backdrop";
import { Spaceship } from "@/components/shared/galaxy/spaceship";
import { STATUS_META } from "@/components/shared/galaxy/status";
import { chapters } from "@/content/story";
import type { Point } from "@/game/galaxy/chart";
import { chapterPlanets, chartProjects, projectPlanet, type ChartPlanetSpec } from "./chart-layout";
import { ChartPlanet } from "./chart-planet";
import { starChartCopy } from "./copy";
import { VoyageLines } from "./voyage-lines";

export interface ChartProgress {
  opened: ReadonlySet<string>;
  visited: ReadonlySet<string>;
  current: string | null;
}

interface VoyageMapProps extends ChartProgress {
  reducedMotion: boolean;
  ship: { at: Point; rotate: number; target: ChartPlanetSpec | null };
  onSelect: (planet: ChartPlanetSpec, aspect: number) => void;
  onArrive: () => void;
}

/** Desktop (≥640px) star chart: chapters across the top, project moons below, the ship flying between. */
export function VoyageMap({
  opened,
  visited,
  current,
  reducedMotion,
  ship,
  onSelect,
  onArrive,
}: VoyageMapProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const select = (planet: ChartPlanetSpec) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    onSelect(planet, rect && rect.height > 0 ? rect.width / rect.height : 1);
  };

  return (
    <div className="border-grid bg-void relative hidden h-[min(68dvh,620px)] min-h-[460px] overflow-hidden border-2 [--planet-scale:0.8] sm:block lg:[--planet-scale:1]">
      <ChartBackdrop />
      <div ref={fieldRef} className="absolute inset-x-4 inset-y-10">
        <VoyageLines />
        <div role="group" aria-label={starChartCopy.chaptersGroup}>
          {chapters.map((c, i) => {
            const spec = chapterPlanets[i];
            if (!spec) return null;
            const here = current === c.id;
            return (
              <ChartPlanet
                key={c.id}
                spec={spec}
                index={i}
                kicker={here ? `▶ CH${c.number}` : `CH${c.number}`}
                name={c.label}
                srText={starChartCopy.chapterSr(c.number, here, visited.has(c.id))}
                live={c.id === "station"}
                done={visited.has(c.id)}
                reducedMotion={reducedMotion}
                onSelect={() => select(spec)}
              />
            );
          })}
        </div>
        <div role="group" aria-label={starChartCopy.projectsGroup}>
          {chartProjects.map((p, i) => {
            const spec = projectPlanet(p);
            const read = opened.has(p.id);
            return (
              <ChartPlanet
                key={p.id}
                spec={spec}
                index={i + chapterPlanets.length}
                kicker={p.codename}
                name={p.name}
                srText={starChartCopy.projectSr(STATUS_META[p.status].label, p.period, read)}
                done={read}
                haspopup
                reducedMotion={reducedMotion}
                onSelect={() => select(spec)}
              />
            );
          })}
        </div>
        <Spaceship
          at={ship.at}
          rotate={ship.rotate}
          flying={ship.target !== null}
          reducedMotion={reducedMotion}
          onArrive={onArrive}
        />
      </div>
    </div>
  );
}
