import { describe, expect, it } from "vitest";
import {
  ChapterWhoosh,
  CHAPTER_WHOOSH_VOLUME,
  WHOOSH_QUIET_AFTER_MS,
} from "@/game/audio/chapter-whoosh";
import { createBackgroundPing } from "@/components/scene/background-ping-sound";
import { PING_DEGREE_SPAN } from "@/game/audio/key";
import type { SfxName, SfxOptions } from "@/types/game";

function recorder(msSince: Partial<Record<SfxName, number>> = {}) {
  const played: [SfxName, SfxOptions | undefined][] = [];
  return {
    played,
    play: (name: SfxName, options?: SfxOptions) => void played.push([name, options]),
    msSince: (name: SfxName) => msSince[name] ?? Infinity,
  };
}

describe("ChapterWhoosh", () => {
  it("stays silent on the load announcement and repeats, whooshes softly on real changes", () => {
    const sfx = recorder();
    const whoosh = new ChapterWhoosh(sfx);
    whoosh.enter("launchpad");
    whoosh.enter("launchpad");
    expect(sfx.played).toEqual([]);
    whoosh.enter("pilot");
    expect(sfx.played).toEqual([["whoosh", { volume: CHAPTER_WHOOSH_VOLUME }]]);
  });

  it("stays silent right after a warp", () => {
    const sfx = recorder({ warp: WHOOSH_QUIET_AFTER_MS / 2 });
    const whoosh = new ChapterWhoosh(sfx);
    whoosh.enter("launchpad");
    whoosh.enter("transmission");
    expect(sfx.played).toEqual([]);
  });
});

describe("background ping", () => {
  it("plays a pentatonic ping pitched by x", () => {
    const sfx = recorder();
    const ping = createBackgroundPing(sfx);
    ping(0, 1000);
    ping(999, 1000);
    expect(sfx.played).toEqual([
      ["ping", { degree: 0 }],
      ["ping", { degree: PING_DEGREE_SPAN - 1 }],
    ]);
  });
});
