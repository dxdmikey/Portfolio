import type { Chapter } from "@/types/story";

/**
 * The Voyage: Ravi's real career as a chronological flight.
 * Order here = order on the page, in the HUD chapter tracker and in the sky blend.
 */
export const chapters = [
  {
    id: "launchpad",
    number: 0,
    label: "Launchpad",
    short: "LCH",
    tagline: "Every voyage starts with a countdown.",
    scene: "launchpad",
  },
  {
    id: "pilot",
    number: 1,
    label: "Pilot profile",
    short: "PLT",
    tagline: "Meet the captain before take-off.",
    scene: "atmosphere",
  },
  {
    id: "vit",
    number: 2,
    label: "Planet VIT",
    short: "VIT",
    tagline: "The tutorial zone, where it all started.",
    scene: "planet",
  },
  {
    id: "nebula",
    number: 3,
    label: "WinWire Nebula",
    short: "NEB",
    tagline: "Three years of missions in enterprise data.",
    scene: "nebula",
  },
  {
    id: "station",
    number: 4,
    label: "Navayuga Station",
    short: "STN",
    tagline: "The current mission. Still under construction.",
    scene: "station",
  },
  {
    id: "armory",
    number: 5,
    label: "Armory",
    short: "ARM",
    tagline: "Skills, tools and trophies picked up on the way.",
    scene: "armory",
  },
  {
    id: "side-quests",
    number: 6,
    label: "Side quests",
    short: "SQ",
    tagline: "Practice builds and a refinery to play with.",
    scene: "belt",
  },
  {
    id: "transmission",
    number: 7,
    label: "Transmission",
    short: "TX",
    tagline: "Send a signal. I answer every one.",
    scene: "aurora",
  },
] as const satisfies readonly Chapter[];

export type ChapterId = (typeof chapters)[number]["id"];

export function chapterById(id: ChapterId): Chapter {
  const found = chapters.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown chapter: ${id}`);
  return found;
}
