import type { Accent, Project } from "@/types/content";

export type ProjectStatus = Project["status"];

/** How each project status is labelled and coloured across the map, list, legend and briefing. */
export const STATUS_META: Record<ProjectStatus, { label: string; legend: string; accent: Accent }> =
  {
    "in-orbit": { label: "In orbit", legend: "In orbit (current)", accent: "plasma" },
    completed: { label: "Completed", legend: "Completed", accent: "xp" },
    "side-mission": { label: "Side mission", legend: "Side mission", accent: "warp" },
  };

export const STATUS_ORDER: readonly ProjectStatus[] = ["in-orbit", "completed", "side-mission"];
