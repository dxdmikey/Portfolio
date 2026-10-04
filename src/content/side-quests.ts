import type { DiscoveryId } from "./discoveries";

/** The two practice builds drawn as asteroids. Order = left to right. */
export const asteroids = [
  {
    projectId: "aws-warehouse",
    discovery: "asteroid-aws",
    label: "AWS data warehouse",
    hint: "Practice build. Crack it open.",
    seed: 3,
  },
  {
    projectId: "enterprise-platform",
    discovery: "asteroid-platform",
    label: "Enterprise data platform",
    hint: "Practice build. Crack it open.",
    seed: 7,
  },
] as const satisfies readonly {
  projectId: string;
  discovery: DiscoveryId;
  label: string;
  hint: string;
  seed: number;
}[];

export const sideQuestsCopy = {
  belt: {
    heading: "The asteroid belt",
    intro: "Two practice builds drifted into range. Click one to crack it open.",
    reform: "Re-form asteroid",
    cracked: "Cracked open",
    beltLabel: "Practice projects",
  },
  refinery: {
    heading: "Side quest: the Refinery",
    intro:
      "Take a pipeline on-call shift. Records ride a conveyor out of Bronze: promote the clean ones, quarantine the broken ones, then fix three production incidents before the SLA breaks.",
  },
  soon: "More side quests coming soon…",
} as const;
