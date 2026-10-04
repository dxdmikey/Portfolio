import { describe, expect, it } from "vitest";
import { VisitTracker, computeXp } from "@/game/progress/visits";
import { CHAPTER_XP, DISCOVERY_XP } from "@/lib/constants";
import { createMemoryStore } from "@/lib/storage";

describe("VisitTracker", () => {
  it("tracks unique visits and completion ratio", () => {
    const t = new VisitTracker(["a", "b"], createMemoryStore());
    expect(t.visit("a")).toBe(true);
    expect(t.visit("a")).toBe(false);
    expect(t.visit("zzz")).toBe(false);
    expect(t.ratio).toBe(0.5);
    t.visit("b");
    expect(t.complete).toBe(true);
  });
});

describe("computeXp", () => {
  it("adds chapter XP and discovery XP", () => {
    expect(computeXp({ chaptersVisited: 3, chaptersTotal: 8, discoveriesFound: 4, discoveriesTotal: 20 })).toEqual({
      current: 3 * CHAPTER_XP + 4 * DISCOVERY_XP,
      max: 8 * CHAPTER_XP + 20 * DISCOVERY_XP,
    });
  });

  it("starts at zero and reaches max when everything is found", () => {
    expect(computeXp({ chaptersVisited: 0, chaptersTotal: 8, discoveriesFound: 0, discoveriesTotal: 20 }).current).toBe(0);
    const full = computeXp({ chaptersVisited: 8, chaptersTotal: 8, discoveriesFound: 20, discoveriesTotal: 20 });
    expect(full.current).toBe(full.max);
  });
});
