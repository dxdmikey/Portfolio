import { describe, expect, it } from "vitest";
import { activeChapterIndex, ChapterSettler, SPY_SETTLE_MS } from "@/game/scene/chapter-spy";
import { NovaDirector, type NovaLine } from "@/game/nova/director";
import { linesForEvent } from "@/game/nova/script";
import { novaChapterLines, novaGreeting, novaScript } from "@/content/nova";
import { chapters, type ChapterId } from "@/content/story";

const VIEWPORT = 800;
const SECTION = 1000;
const TOPS = chapters.map((_, i) => i * SECTION);
/** scrollY that puts the viewport centre in the middle of chapter `i`. */
const scrollFor = (i: number) => i * SECTION + SECTION / 2 - VIEWPORT / 2;

describe("activeChapterIndex", () => {
  it("is the chapter under the viewport centre and never negative", () => {
    expect(activeChapterIndex(0, VIEWPORT, TOPS)).toBe(0);
    expect(activeChapterIndex(-500, VIEWPORT, [300, 1300])).toBe(0);
    expect(activeChapterIndex(scrollFor(3), VIEWPORT, TOPS)).toBe(3);
    // Exactly on a boundary belongs to the next chapter.
    expect(activeChapterIndex(SECTION * 2 - VIEWPORT / 2, VIEWPORT, TOPS)).toBe(2);
    expect(activeChapterIndex(1e9, VIEWPORT, TOPS)).toBe(TOPS.length - 1);
    expect(activeChapterIndex(0, VIEWPORT, [])).toBe(0);
  });

  it("picks a short last chapter once the page bottom is reached", () => {
    // Last chapter starts 200px above the page bottom: the centre probe never reaches it.
    const tops = [0, 1000, 2000];
    const height = 2200;
    expect(activeChapterIndex(height - VIEWPORT - 50, VIEWPORT, tops, height)).toBe(1);
    expect(activeChapterIndex(height - VIEWPORT, VIEWPORT, tops, height)).toBe(2);
  });
});

describe("ChapterSettler", () => {
  it("announces only after scrolling has been quiet for the settle time", () => {
    const s = new ChapterSettler(SPY_SETTLE_MS);
    expect(s.msUntilSettled(0)).toBeNull();
    s.observe(2, 0);
    expect(s.msUntilSettled(50)).toBe(SPY_SETTLE_MS - 50);
    expect(s.settle(SPY_SETTLE_MS - 1)).toBeNull();
    expect(s.settle(SPY_SETTLE_MS)).toBe(2);
    expect(s.msUntilSettled(SPY_SETTLE_MS)).toBeNull();
  });

  it("does not announce the same chapter twice in a row", () => {
    const s = new ChapterSettler(SPY_SETTLE_MS);
    s.observe(1, 0);
    expect(s.settle(SPY_SETTLE_MS)).toBe(1);
    s.observe(1, 1000);
    expect(s.settle(1000 + SPY_SETTLE_MS)).toBeNull();
    s.observe(2, 2000);
    s.observe(1, 2100);
    expect(s.settle(2100 + SPY_SETTLE_MS)).toBeNull();
    s.observe(3, 3000);
    expect(s.settle(3000 + SPY_SETTLE_MS)).toBe(3);
  });
});

describe("fast scroll + NOVA", () => {
  it("flying through 5 chapters inside the settle window makes NOVA say only the last one", () => {
    let t = 0;
    const director = new NovaDirector({ now: () => t });
    const settler = new ChapterSettler(SPY_SETTLE_MS);
    const said: NovaLine[] = [];
    const frame = SPY_SETTLE_MS / 4;

    const pump = () => {
      const i = settler.settle(t);
      const id = i === null ? undefined : chapters[i]?.id;
      if (id === undefined) return;
      linesForEvent({ type: "chapter:enter", chapter: id }, novaScript, director).forEach((l) => {
        const now = director.push(l);
        if (now) said.push(now);
      });
    };
    const scrollTo = (i: number) => {
      settler.observe(activeChapterIndex(scrollFor(i), VIEWPORT, TOPS), t);
      t += frame;
      pump();
    };

    // Chapters 1..5, one sample every quarter of the settle window: never quiet long enough.
    [1, 2, 3, 4, 5].forEach(scrollTo);
    expect(said).toEqual([]);
    t += SPY_SETTLE_MS;
    pump();

    const landed = chapters[5]?.id as ChapterId;
    expect(said.map((l) => l.text)).toEqual([`${novaGreeting} ${novaChapterLines[landed][0]}`]);
    [1, 2, 3, 4].forEach((i) => {
      const passed = chapters[i]?.id as ChapterId;
      expect(director.hasSpoken(novaChapterLines[passed][0] ?? "")).toBe(false);
    });
    expect(director.queued).toHaveLength(0);
  });

  it("even without the settle gate, rapid chapter lines never leave a stale one queued", () => {
    let t = 0;
    const director = new NovaDirector({ now: () => t });
    const ids: ChapterId[] = ["pilot", "vit", "nebula", "station", "armory"];
    let last: NovaLine | null = null;
    ids.forEach((chapter) => {
      linesForEvent({ type: "chapter:enter", chapter }, novaScript, director).forEach((l) => {
        last = director.push(l) ?? last;
      });
      t += 10;
    });
    expect((last as NovaLine | null)?.chapter).toBe("armory");
    expect(director.queued).toHaveLength(0);
    expect(director.currentChapter).toBe("armory");
  });
});
