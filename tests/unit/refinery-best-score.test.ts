import { describe, expect, it } from "vitest";
import { BestScore } from "@/game/refinery/best-score";
import { createMemoryStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";

describe("BestScore", () => {
  it("only records improvements and persists them", () => {
    const store = createMemoryStore();
    const best = new BestScore(store);
    let calls = 0;
    best.subscribe(() => calls++);
    expect(best.record(6)).toBe(true);
    expect(best.record(4)).toBe(false);
    expect(best.getSnapshot()).toBe(6);
    expect(store.get(STORAGE_KEYS.refineryBest, 0)).toBe(6);
    expect(calls).toBe(1);
  });

  it("restores a saved best and ignores junk", () => {
    expect(new BestScore(createMemoryStore({ [STORAGE_KEYS.refineryBest]: 9 })).getSnapshot()).toBe(9);
    expect(new BestScore(createMemoryStore({ [STORAGE_KEYS.refineryBest]: "x" })).getSnapshot()).toBe(0);
  });
});
