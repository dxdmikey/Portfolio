import type { SfxName } from "@/types/game";
import type { SfxPlayer } from "./sfx";

/** Chapter changes are a background cue: a very soft whoosh. */
export const CHAPTER_WHOOSH_VOLUME = 0.45;
/** No whoosh right after a warp (star chart, rocket): the warp already said it. */
export const WHOOSH_QUIET_AFTER_MS = 1500;
const QUIET_AFTER: readonly SfxName[] = ["warp"];

/**
 * Plays a soft whoosh when a (settled) chapter change happens. The first `chapter:enter` is the
 * page load announcing where you are, so it stays silent; so do changes right after a warp.
 */
export class ChapterWhoosh {
  private last: string | null = null;

  constructor(private readonly sfx: Pick<SfxPlayer, "play" | "msSince">) {}

  enter(chapter: string): void {
    const previous = this.last;
    this.last = chapter;
    if (previous === null || previous === chapter) return;
    if (QUIET_AFTER.some((name) => this.sfx.msSince(name) < WHOOSH_QUIET_AFTER_MS)) return;
    this.sfx.play("whoosh", { volume: CHAPTER_WHOOSH_VOLUME });
  }
}
