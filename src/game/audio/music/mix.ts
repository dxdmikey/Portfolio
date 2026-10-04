import type { ChapterId } from "@/content/story";
import type { Layer } from "./song";

/** Gain per layer (0..1). The music crossfades to a chapter's mix as you fly into it. */
export type LayerMix = Readonly<Record<Layer, number>>;

/**
 * The soundtrack builds with the story: a quiet launch, energy rising through the career
 * chapters, everything in for the armory and side quests, then a softer outro.
 */
export const CHAPTER_MIX: Readonly<Record<ChapterId, LayerMix>> = {
  launchpad: { pad: 1, chimes: 0.8, arp: 0, bass: 0, hats: 0 },
  pilot: { pad: 1, chimes: 0.7, arp: 0.7, bass: 0, hats: 0 },
  vit: { pad: 1, chimes: 0.6, arp: 0.9, bass: 0, hats: 0 },
  nebula: { pad: 1, chimes: 0.6, arp: 0.9, bass: 0.9, hats: 0 },
  station: { pad: 0.9, chimes: 0.6, arp: 1, bass: 1, hats: 0.7 },
  armory: { pad: 0.9, chimes: 0.7, arp: 1, bass: 1, hats: 1 },
  "side-quests": { pad: 0.9, chimes: 0.7, arp: 1, bass: 1, hats: 1 },
  transmission: { pad: 1, chimes: 0.9, arp: 0.4, bass: 0.4, hats: 0 },
};

export const DEFAULT_CHAPTER: ChapterId = "launchpad";
/** Seconds to blend from one chapter's mix to the next. */
export const MIX_CROSSFADE_S = 1.5;
