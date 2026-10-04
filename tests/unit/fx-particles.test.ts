import { describe, expect, it } from "vitest";
import { BURST, CONFETTI, ParticleSystem, SMOKE, type BurstSpec } from "@/game/fx/particles";
import { TimedPool } from "@/game/fx/timed";

const STILL: BurstSpec = { ...BURST, count: 4, speedMin: 0, speedMax: 0, lift: 0, gravity: 0, drag: 1, lifeMin: 1, lifeMax: 1 };

describe("ParticleSystem", () => {
  it("spawns the requested count at the origin", () => {
    const ps = new ParticleSystem(64, 1);
    expect(ps.spawn(BURST, 10, 20)).toBe(BURST.count);
    expect(ps.count).toBe(BURST.count);
    expect(ps.x[0]).toBe(10);
    expect(ps.y[0]).toBe(20);
  });

  it("is deterministic for the same seed", () => {
    const a = new ParticleSystem(32, 42);
    const b = new ParticleSystem(32, 42);
    a.spawn(BURST, 0, 0);
    b.spawn(BURST, 0, 0);
    a.step(0.1);
    b.step(0.1);
    expect(Array.from(a.x.slice(0, a.count))).toEqual(Array.from(b.x.slice(0, b.count)));
  });

  it("caps spawning at capacity", () => {
    const ps = new ParticleSystem(10, 1);
    expect(ps.spawn(CONFETTI, 0, 0)).toBe(10);
    expect(ps.spawn(BURST, 0, 0)).toBe(0);
  });

  it("applies gravity and drag", () => {
    const ps = new ParticleSystem(4, 1);
    ps.spawn({ ...STILL, count: 1, gravity: 100 }, 0, 0);
    ps.step(0.5);
    expect(ps.vy[0]).toBeCloseTo(50);
    expect(ps.y[0]).toBeGreaterThan(0);

    const smoke = new ParticleSystem(4, 1);
    smoke.spawn({ ...SMOKE, count: 1, speedMin: 0, speedMax: 0 }, 0, 0);
    smoke.step(0.5);
    expect(smoke.y[0]).toBeLessThan(0);
  });

  it("removes particles when their life runs out and keeps the rest packed", () => {
    const ps = new ParticleSystem(8, 1);
    ps.spawn({ ...STILL, count: 2, lifeMin: 0.2, lifeMax: 0.2 }, 1, 1);
    ps.spawn({ ...STILL, count: 2, lifeMin: 2, lifeMax: 2 }, 5, 5);
    ps.step(0.3);
    expect(ps.count).toBe(2);
    expect(ps.x[0]).toBe(5);
    expect(ps.x[1]).toBe(5);
    expect(ps.fade(0)).toBeCloseTo(0.85);
  });

  it("cycles palette indices for multi-colour bursts", () => {
    const ps = new ParticleSystem(8, 1);
    ps.spawn({ ...STILL, count: 5, colors: 4 }, 0, 0, 2);
    expect(Array.from(ps.color.slice(0, 5))).toEqual([2, 3, 4, 5, 2]);
  });
});

describe("TimedPool", () => {
  it("ages effects and drops expired ones", () => {
    const pool = new TimedPool(4);
    pool.add(0, 0, 1, 0, "+XP");
    pool.add(0, 0, 0.2, 1);
    pool.step(0.5);
    expect(pool.count).toBe(1);
    expect(pool.get(0).label).toBe("+XP");
    expect(pool.progress(0)).toBeCloseTo(0.5);
  });

  it("replaces the oldest effect when full", () => {
    const pool = new TimedPool(2);
    pool.add(1, 0, 5, 0);
    pool.step(1);
    pool.add(2, 0, 5, 0);
    pool.add(3, 0, 5, 0);
    expect(pool.count).toBe(2);
    const xs = [pool.get(0).x, pool.get(1).x].sort();
    expect(xs).toEqual([2, 3]);
  });
});
