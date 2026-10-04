import type { DiscoveryId } from "./discoveries";
import type { Accent } from "@/types/content";

export const nebulaCopy = {
  fieldAria: "Nebula map: two stations and their satellites",
  stationHint: "Select a station to open its mission debrief. Satellites open sub-missions.",
  warpTrail: "Warp trail",
  backToMission: "Back to mission debrief",
  subMissionTag: "Sub-mission",
  highlightsHeading: "Highlights",
} as const;

export interface Station {
  id: string;
  /** Matches an entry in `quests.ts`. */
  questId: string;
  discovery: DiscoveryId;
  name: string;
  accent: Accent;
}

/** Chronological: the first station is where the voyage through WinWire began. */
export const stations: readonly Station[] = [
  { id: "sdt", questId: "winwire-sdt", discovery: "mission-sdt", name: "Data Engineer Trainee", accent: "plasma" },
  { id: "sde", questId: "winwire-sde", discovery: "mission-sde", name: "Data Engineer", accent: "warp" },
];

export interface Satellite {
  id: string;
  stationId: string;
  discovery: DiscoveryId;
  /** Index into the parent quest's `subQuests`. */
  subIndex: number;
  /** Full label shown on the satellite pill. */
  label: string;
  /** Resting angle on the orbit in degrees (screen coords: 90 = below the station, 270 = above). */
  angle: number;
}

export const satellites: readonly Satellite[] = [
  { id: "migration", stationId: "sdt", discovery: "satellite-migration", subIndex: 0, label: "Migration", angle: 270 },
  { id: "integration", stationId: "sdt", discovery: "satellite-integration", subIndex: 1, label: "Data Integration", angle: 90 },
  { id: "commercial", stationId: "sde", discovery: "satellite-commercial", subIndex: 0, label: "Platform AMS", angle: 90 },
];

/** 12x10 derelict station: "#" hull, "o" dim running lights, "x" damage. */
export const STATION_ROWS = [
  "....#..#....",
  "..#.#..#.#..",
  "###########.",
  "#oo#.##.#oo#",
  "#oo#.xx.#oo#",
  "###########.",
  "..#..##..#..",
  ".....##.....",
  "....####....",
  "....#..#....",
] as const;
