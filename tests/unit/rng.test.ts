import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/rng";

describe("createRng", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 50; i++) {
      const v = a.next();
      expect(v).toBe(b.next());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("range stays within bounds and different seeds diverge", () => {
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      const v = rng.range(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
});
