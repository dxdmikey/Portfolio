import type { ChapterId } from "./story";

export interface Discovery {
  id: string;
  chapter: ChapterId;
  /** What the thing is, for screen readers and the trophy list. */
  label: string;
  /** NOVA's reaction the first time it's found. Keep it short and friendly. */
  line: string;
}

/**
 * Everything clickable that counts as a discovery. Each one found adds DISCOVERY_XP to the HUD
 * bar. Components register by id via `useDiscover(id)`.
 */
export const discoveries = [
  // CH0 Launchpad
  { id: "rocket", chapter: "launchpad", label: "Launch the rocket", line: "Liftoff! Hold on to your snacks 🚀" },
  { id: "name", chapter: "launchpad", label: "Poke the captain's name", line: "Careful, those letters are load-bearing." },
  { id: "sprite", chapter: "launchpad", label: "Say hi to pixel Ravi", line: "He waves back. He always waves back." },
  { id: "constellation", chapter: "launchpad", label: "Find the hidden constellation", line: "That's the Lakehouse constellation. Bronze, Silver, Gold." },
  // CH1 Pilot profile
  { id: "id-card", chapter: "pilot", label: "Flip the pilot ID card", line: "Every pilot has a backstory. This is his." },
  { id: "stats", chapter: "pilot", label: "Inspect a stat", line: "Stats are earned on production, not in tutorials." },
  { id: "trait-anime", chapter: "pilot", label: "Anime trait", line: "Plot armour: equipped ✨" },
  { id: "trait-nature", chapter: "pilot", label: "Nature explorer trait", line: "Some of the best pipelines are designed on a hiking trail 🌿" },
  { id: "trait-gaming", chapter: "pilot", label: "Gaming trait", line: "Which explains… all of this 🎮" },
  { id: "certs", chapter: "pilot", label: "Spin a certification badge", line: "Four certifications, all earned the hard way." },
  // CH2 Planet VIT
  { id: "crater-degree", chapter: "vit", label: "Degree crater", line: "B.Tech in Computer Science. The tutorial everyone has to finish." },
  { id: "crater-spec", chapter: "vit", label: "Specialization crater", line: "Specialized in AI and ML, long before it was cool. Well, slightly before." },
  { id: "crater-grade", chapter: "vit", label: "Grade crater", line: "CGPA 8.2. Respectable loot for a tutorial." },
  { id: "crater-years", chapter: "vit", label: "Years crater", line: "2019 to 2023. Four years, zero skipped cutscenes." },
  // CH3 WinWire Nebula
  { id: "mission-sdt", chapter: "nebula", label: "Data Engineer Trainee station", line: "400+ Oracle tables moved without losing a single heartbeat." },
  { id: "mission-sde", chapter: "nebula", label: "Data Engineer station", line: "Production pipelines don't sleep, so the monitoring doesn't either." },
  { id: "satellite-migration", chapter: "nebula", label: "Migration satellite", line: "99.7% data accuracy. The other 0.3% got a stern talking-to." },
  { id: "satellite-integration", chapter: "nebula", label: "Data Integration satellite", line: "24-hour refreshes down to under 4. BI teams rejoiced." },
  { id: "satellite-commercial", chapter: "nebula", label: "Platform AMS satellite", line: "25+ pipelines kept alive. Failures down 30%." },
  // CH4 Navayuga Station
  { id: "station-online", chapter: "station", label: "Power up the station", line: "Station online! Data is flowing. Well, in this demo it is." },
  // CH5 Armory
  { id: "ability-flip", chapter: "armory", label: "Flip an ability card", line: "Every skill has a story on the back." },
  { id: "trophy", chapter: "armory", label: "Polish a trophy", line: "Shiny. Microsoft and Databricks approved." },
  // CH6 Side quests
  { id: "asteroid-aws", chapter: "side-quests", label: "Crack the AWS asteroid", line: "An S3-to-Redshift warehouse, built for practice and fun." },
  { id: "asteroid-platform", chapter: "side-quests", label: "Crack the platform asteroid", line: "A whole enterprise data platform. In his spare time. Who does that?" },
  // CH7 Transmission
  { id: "dish", chapter: "transmission", label: "Send a signal", line: "Signal sent. The channels below are open any time 📡" },
] as const satisfies readonly Discovery[];

export type DiscoveryId = (typeof discoveries)[number]["id"];

export const discoveryIds: readonly DiscoveryId[] = discoveries.map((d) => d.id);

export function discoveryById(id: DiscoveryId): Discovery {
  const found = discoveries.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown discovery: ${id}`);
  return found;
}
