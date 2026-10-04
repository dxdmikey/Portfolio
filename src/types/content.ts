/**
 * Content model — every piece of copy on the site is typed data in `src/content/`.
 * Components only render these shapes; they never hard-code copy.
 */

export type Accent = "plasma" | "xp" | "coin" | "warp";

export type Tier = "MASTER" | "ADVANCED" | "SKILLED";

export type Rarity = "legendary" | "epic" | "rare" | "common";

export type QuestStatus = "active" | "completed" | "side" | "tutorial";

export interface SocialLink {
  id: "email" | "linkedin" | "github" | "resume";
  label: string;
  href: string;
  /** Visible text when the link value itself matters (e.g. the email address). */
  display?: string;
}

export interface Stat {
  /** Stable key, used to look up the stat's proof line in `statNotes`. */
  id: string;
  label: string;
  value: number;
  accent: Accent;
}

export interface Profile {
  name: string;
  shortName: string;
  headline: string;
  version: string;
  className: string;
  region: string;
  guild: string;
  experience: string;
  level: number;
  bio: string;
  tagline: string;
  traits: readonly string[];
  stats: readonly Stat[];
  photo: { src: string; alt: string; width: number; height: number };
  links: readonly SocialLink[];
  email: string;
  siteUrl: string;
  languages: readonly string[];
}

export interface Ability {
  id: string;
  name: string;
  level: number;
  tier: Tier;
  accent: Accent;
  /** One-line description of what this ability means in practice. */
  summary: string;
  spells: readonly string[];
}

export interface QuestEntry {
  id: string;
  status: QuestStatus;
  title: string;
  org: string;
  location: string;
  period: string;
  xp: number;
  summary: string;
  highlights: readonly string[];
  tags: readonly string[];
  /** Nested sub-quests (client projects inside a role). */
  subQuests?: readonly SubQuest[];
}

export interface SubQuest {
  title: string;
  period: string;
  highlights: readonly string[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  detail: string;
  column: number;
}

export interface Project {
  id: string;
  name: string;
  codename: string;
  status: "in-orbit" | "completed" | "side-mission";
  period: string;
  accent: Accent;
  /** Planet render hints for the galaxy map. Coordinates are 0–1 of the map. */
  planet: { x: number; y: number; size: number; ring: boolean };
  problem: string;
  approach: readonly string[];
  outcome: readonly string[];
  stack: readonly string[];
  architecture?: {
    nodes: readonly ArchitectureNode[];
    edges: readonly (readonly [string, string])[];
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  /** 2–3 character label shown in the slot, like an item sprite. Must be unique. */
  abbr: string;
  rarity: Rarity;
  category: string;
  note: string;
}

export interface Certification {
  id: string;
  /** Short badge code. `officialCode` = it's a real exam code worth printing on the resume. */
  code: string;
  officialCode: boolean;
  name: string;
  issuer: string;
  /** Key into `content/issuers.ts` (the pixel logo). */
  issuerId: string;
  date: string;
  accent: Accent;
}

export interface Education {
  school: string;
  location: string;
  degree: string;
  period: string;
  grade: string;
}

export interface NavSection {
  id: string;
  label: string;
  /** Short label for the mobile HUD. */
  short: string;
}

/** "Mission debrief" for a quest: the project, my part, my moves, and the loot (results). */
export interface QuestDebrief {
  mission: string;
  role: string;
  moves: readonly string[];
  /** Empty loot + `inProgress` text means there are no results to report yet. */
  loot: readonly { value: string; label: string }[];
  inProgress?: string;
}
