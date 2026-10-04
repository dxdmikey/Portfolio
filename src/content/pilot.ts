import type { DiscoveryId } from "./discoveries";
import type { Accent } from "@/types/content";

/** Copy and data for Chapter 1, the pilot profile. Facts mirror `quests.ts` and the resume. */
export const pilotCopy = {
  idHeader: "PILOT ID",
  flipLabel: "Flip card",
  flipHint: "Click the card to flip it",
  frontFace: "Pilot ID, front",
  backFace: "Pilot ID, back",
  clickMe: "Click me",
  clickMeArrow: "▸",
  backHeading: "Pilot dossier",
  currentlyLabel: "Currently",
  skillsLabel: "Core skills",
  languagesLabel: "Languages",
  stamp: "Open to quests",
  statsHeading: "Attributes",
  statsHint: "Tap a stat to inspect it.",
  traitsHeading: "Traits",
  traitsHint: "Tap a trait to see it in action.",
  certsHeading: "Certifications",
  certsHint: "Tap a badge to give it a spin.",
  barcode: "1011001011010011101001011011010010110",
} as const;

/** A run of text; `strong` runs are highlighted. Rendered as elements, never as raw HTML. */
export interface Segment {
  text: string;
  strong?: boolean;
}

/** The back of the ID card. Facts mirror `profile.bio` and the resume summary. */
export const dossier = {
  headline: "Data & AI Engineer · 3+ yrs · Azure lakehouses & AI agents",
  bullets: [
    [
      { text: "Builds " },
      { text: "lakehouses, pipelines and migrations", strong: true },
      { text: " on " },
      { text: "Azure", strong: true },
      { text: ", 3+ years in." },
    ],
    [
      { text: "Co-building a " },
      { text: "self-serve data platform", strong: true },
      { text: " for a construction engineering company, with an " },
      { text: "AI agent", strong: true },
      { text: " that answers questions and draws charts." },
    ],
    [
      { text: "Owns the " },
      { text: "architecture and data flow", strong: true },
      { text: ", then ships end to end with " },
      { text: "Claude", strong: true },
      { text: " as pair programmer." },
    ],
  ],
  currently: [
    { text: "Navayuga · ", strong: true },
    { text: "self-serve data platform + AI agent" },
  ],
  skills: ["Azure", "PySpark & SQL", "Lakehouse", "AI agents & RAG"],
} as const satisfies {
  headline: string;
  bullets: readonly (readonly Segment[])[];
  currently: readonly Segment[];
  skills: readonly string[];
};

export const HP = { value: 99, max: 99 } as const;
export const MP = { value: 97, max: 100 } as const;

/** What each attribute means in practice, keyed by the stat id in `profile.stats`. */
export const statNotes: Record<string, string> = {
  "pipeline-design": "Metadata-driven frameworks that cut pipeline dev effort by 40%.",
  sql: "SQL and PySpark tuning sped up production processing by 20–35%.",
  pyspark: "20+ PySpark transformation frameworks built for the healthcare migration.",
  "data-modeling":
    "Bronze–Silver–Gold lakehouses that improved analytical query performance by 30%.",
  reliability:
    "Owned 25+ production pipelines, cutting recurring failures by 30% and incident resolution time by 25%.",
  ai: "Building an AI agent that answers data questions with RAG and draws charts from a plain-English prompt.",
};

export type EmoteKind = "sparkle" | "leaf" | "controller";

export interface TraitEmote {
  name: string;
  discovery: DiscoveryId;
  accent: Accent;
  emote: EmoteKind;
  /** Short caption shown while the emote plays. */
  caption: string;
}

export const traitEmotes: readonly TraitEmote[] = [
  {
    name: "Anime",
    discovery: "trait-anime",
    accent: "warp",
    emote: "sparkle",
    caption: "POWER UP!",
  },
  {
    name: "Nature explorer",
    discovery: "trait-nature",
    accent: "xp",
    emote: "leaf",
    caption: "FRESH AIR",
  },
  {
    name: "Gaming",
    discovery: "trait-gaming",
    accent: "plasma",
    emote: "controller",
    caption: "+1UP",
  },
];

/** 12x7 pixel controller for the Gaming emote. "#" = body, "o" = buttons. */
export const CONTROLLER_ROWS = [
  "..########..",
  ".##########.",
  "##o#####o###",
  "#ooo###o#o##",
  "##o#####o###",
  "###########.",
  ".##..##..##.",
] as const;
