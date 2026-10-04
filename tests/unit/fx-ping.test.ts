import { describe, expect, it } from "vitest";
import { PING_THROTTLE_MS, PingCadence, SHOOTING_EVERY } from "@/game/fx/ping-cadence";
import { STREAK_S, StreakPool } from "@/game/fx/streaks";

describe("PingCadence", () => {
  it("throttles rapid clicks", () => {
    const c = new PingCadence();
    expect(c.hit(1000)).toBe("ping");
    expect(c.hit(1000 + PING_THROTTLE_MS - 1)).toBe("skip");
    expect(c.hit(1000 + PING_THROTTLE_MS)).toBe("ping");
  });

  it("turns every 6th accepted click into a shooting star", () => {
    const c = new PingCadence();
    const kinds = Array.from({ length: SHOOTING_EVERY * 2 }, (_, i) => c.hit(i * PING_THROTTLE_MS));
    expect(kinds.filter((k) => k === "shooting")).toHaveLength(2);
    expect(kinds[SHOOTING_EVERY - 1]).toBe("shooting");
    expect(kinds[SHOOTING_EVERY]).toBe("ping");
  });
});

describe("StreakPool", () => {
  it("launches towards the roomier side, then expires", () => {
    const pool = new StreakPool(2);
    pool.launch(900, 100, 1000);
    pool.launch(100, 100, 1000);
    pool.launch(500, 100, 1000);
    expect(pool.count).toBe(2);
    expect(pool.get(0).vx).toBeLessThan(0);
    expect(pool.get(1).vx).toBeGreaterThan(0);
    expect(pool.get(0).vy).toBeGreaterThan(0);
    pool.step(STREAK_S / 2);
    expect(pool.count).toBe(2);
    pool.step(STREAK_S);
    expect(pool.count).toBe(0);
  });
});
