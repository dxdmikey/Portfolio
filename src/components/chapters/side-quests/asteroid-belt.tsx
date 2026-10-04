"use client";

import { useEffect, useRef, useState } from "react";
import { MissionBriefing } from "@/components/shared/galaxy/mission-briefing";
import { asteroids, sideQuestsCopy } from "@/content/side-quests";
import { projects } from "@/content/projects";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Asteroid } from "./asteroid";

const OPEN_DELAY_MS = 650;

/** Two practice builds as asteroids. Cracking one opens its mission briefing. */
export function AsteroidBelt() {
  const reduced = useReducedMotion();
  const [cracked, setCracked] = useState<ReadonlySet<string>>(new Set());
  const [openId, setOpenId] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const crack = (projectId: string) => {
    setCracked((prev) => new Set(prev).add(projectId));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(projectId), reduced ? 0 : OPEN_DELAY_MS);
  };
  const reform = (projectId: string) =>
    setCracked((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });

  return (
    <div>
      <h3 className="font-pixel text-px-md text-plasma mb-3 uppercase">
        {sideQuestsCopy.belt.heading}
      </h3>
      <p className="text-dust mb-8 max-w-[62ch]">{sideQuestsCopy.belt.intro}</p>
      <ul
        aria-label={sideQuestsCopy.belt.beltLabel}
        className="flex flex-wrap items-start justify-around gap-10"
      >
        {asteroids.map((a) => {
          const project = projects.find((p) => p.id === a.projectId);
          if (!project) return null;
          return (
            <li key={a.projectId}>
              <Asteroid
                {...a}
                accent={project.accent}
                cracked={cracked.has(a.projectId)}
                onCrack={() => crack(a.projectId)}
                onReform={() => reform(a.projectId)}
              />
            </li>
          );
        })}
      </ul>
      <MissionBriefing
        project={projects.find((p) => p.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </div>
  );
}
