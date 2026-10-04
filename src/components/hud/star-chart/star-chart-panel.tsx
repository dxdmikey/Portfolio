"use client";

import { useCallback, useState } from "react";
import { Legend } from "@/components/shared/galaxy/legend";
import { MissionBriefing } from "@/components/shared/galaxy/mission-briefing";
import { useBriefingLog } from "@/components/shared/galaxy/use-briefing-log";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfx } from "@/hooks/use-sfx";
import { useVisits } from "@/hooks/use-visits";
import type { Project } from "@/types/content";
import { chartProjects, type ChartPlanetSpec } from "./chart-layout";
import { starChartCopy } from "./copy";
import { useStarChart } from "./use-star-chart";
import { VoyageList } from "./voyage-list";
import { VoyageMap } from "./voyage-map";

interface StarChartPanelProps {
  /** Chapter currently in view (from the bus), for "you are here". */
  current: string | null;
  /** Close the overlay and fly the page to this chapter. */
  onWarp: (chapterId: string) => void;
}

/** Star-chart contents: map (≥sm) or list (<sm), plus the shared mission briefing. Lazy-loaded. */
export default function StarChartPanel({ current, onWarp }: StarChartPanelProps) {
  const reduced = useReducedMotion();
  const { play } = useSfx();
  const { opened } = useBriefingLog();
  const { visited } = useVisits();
  const [openId, setOpenId] = useState<string | null>(null);

  const land = useCallback(
    (planet: ChartPlanetSpec) => {
      if (planet.kind === "chapter") {
        onWarp(planet.id);
        return;
      }
      play("select");
      setOpenId(planet.id);
    },
    [onWarp, play],
  );
  const { ship, fly, arrive } = useStarChart(reduced, land);

  const openDirect = (project: Project) => {
    play("select");
    setOpenId(project.id);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="pr-10">
        <h2 className="font-pixel text-px-md text-coin sm:text-px-lg uppercase">
          {starChartCopy.title}
        </h2>
        <p className="text-dust mt-3 max-w-[60ch] text-sm">{starChartCopy.intro}</p>
      </header>
      <VoyageMap
        opened={opened}
        visited={visited}
        current={current}
        reducedMotion={reduced}
        ship={ship}
        onSelect={fly}
        onArrive={arrive}
      />
      <VoyageList
        opened={opened}
        visited={visited}
        current={current}
        onChapter={land}
        onProject={openDirect}
      />
      <Legend read={opened.size} total={chartProjects.length} />
      <MissionBriefing
        project={chartProjects.find((p) => p.id === openId)}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
