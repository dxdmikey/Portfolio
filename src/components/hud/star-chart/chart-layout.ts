import { chapters, type ChapterId } from "@/content/story";
import { projects } from "@/content/projects";
import { flightOrder, type Point } from "@/game/galaxy/chart";
import type { Accent, Project } from "@/types/content";

/**
 * Star-chart placement (0–1 of the map field). Chapters fly left → right across the top
 * band in voyage order; projects sit in the bottom band, tethered to the chapter they belong to.
 * Rows alternate so labels never collide.
 */
export interface ChartPlanetSpec {
  kind: "chapter" | "project";
  id: string;
  at: Point;
  size: number;
  ring: boolean;
  accent: Accent;
}

const CHAPTER_X0 = 0.06;
const CHAPTER_STEP = 0.125;
const CHAPTER_ROWS = [0.22, 0.44] as const;
/** Projects render as moons, smaller than their galaxy-map size. */
const MOON_SCALE = 0.7;

const CHAPTER_LOOK: Record<ChapterId, { size: number; ring: boolean; accent: Accent }> = {
  launchpad: { size: 34, ring: false, accent: "coin" },
  pilot: { size: 36, ring: false, accent: "plasma" },
  vit: { size: 42, ring: false, accent: "coin" },
  nebula: { size: 46, ring: true, accent: "warp" },
  station: { size: 50, ring: true, accent: "plasma" },
  armory: { size: 38, ring: false, accent: "xp" },
  "side-quests": { size: 36, ring: true, accent: "warp" },
  transmission: { size: 34, ring: false, accent: "plasma" },
};

/** Which chapter each project belongs to, and where its moon sits. */
const PROJECT_SPOTS: Record<string, { chapter: ChapterId; at: Point }> = {
  "healthcare-integration": { chapter: "nebula", at: { x: 0.3, y: 0.72 } },
  "healthcare-migration": { chapter: "nebula", at: { x: 0.42, y: 0.88 } },
  "commercial-platform": { chapter: "nebula", at: { x: 0.54, y: 0.72 } },
  "self-serve-platform": { chapter: "station", at: { x: 0.65, y: 0.88 } },
  "aws-warehouse": { chapter: "side-quests", at: { x: 0.78, y: 0.72 } },
  "enterprise-platform": { chapter: "side-quests", at: { x: 0.9, y: 0.88 } },
};

export const chapterPlanets: readonly ChartPlanetSpec[] = chapters.map((c, i) => ({
  kind: "chapter",
  id: c.id,
  at: {
    x: CHAPTER_X0 + i * CHAPTER_STEP,
    y: CHAPTER_ROWS[i % CHAPTER_ROWS.length] ?? CHAPTER_ROWS[0],
  },
  ...CHAPTER_LOOK[c.id],
}));

export function projectPlanet(p: Project): ChartPlanetSpec {
  const spot = PROJECT_SPOTS[p.id];
  return {
    kind: "project",
    id: p.id,
    at: spot?.at ?? { x: p.planet.x, y: p.planet.y },
    size: Math.round(p.planet.size * MOON_SCALE),
    ring: p.planet.ring,
    accent: p.accent,
  };
}

/** Main missions oldest → newest, then side missions (DOM order = Tab order). */
export const chartProjects: readonly Project[] = flightOrder(projects);

/** Lines to draw: the voyage path between chapters, and project → chapter tethers. */
export function chartLinks(): { from: Point; to: Point; kind: "path" | "tether"; key: string }[] {
  const byChapter = new Map(chapterPlanets.map((c) => [c.id, c.at]));
  const path = chapterPlanets.slice(1).map((c, i) => ({
    from: chapterPlanets[i]?.at ?? c.at,
    to: c.at,
    kind: "path" as const,
    key: `path-${c.id}`,
  }));
  const tethers = chartProjects.flatMap((p) => {
    const spot = PROJECT_SPOTS[p.id];
    const home = spot ? byChapter.get(spot.chapter) : undefined;
    return spot && home
      ? [{ from: home, to: spot.at, kind: "tether" as const, key: `tether-${p.id}` }]
      : [];
  });
  return [...path, ...tethers];
}

/** Ship's parking spot before the first flight: above the launchpad. */
export const SHIP_HOME: Point = { x: CHAPTER_X0, y: 0.08 };
