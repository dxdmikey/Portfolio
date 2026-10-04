import { describe, expect, it, vi } from "vitest";
import { chapters } from "@/content/story";
import { scenes } from "@/content/scenes";
import { discoveries } from "@/content/discoveries";
import {
  blendKeyframes,
  chapterPosition,
  ease,
  lerpColor,
  sceneAt,
} from "@/game/scene/interpolate";
import { EventBus } from "@/game/events/bus";
import { DiscoveryTracker } from "@/game/discoveries/tracker";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { createMemoryStore } from "@/lib/storage";

describe("story content", () => {
  it("numbers chapters 0..7 in order with unique ids", () => {
    expect(chapters.map((c) => c.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(chapters.length);
  });

  it("gives every chapter a scene with dark and light palettes", () => {
    for (const c of chapters) {
      expect(scenes[c.scene].dark.skyTop).toMatch(/^#[0-9a-f]{6}$/i);
      expect(scenes[c.scene].light.skyTop).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("places every discovery in a real chapter, with unique ids", () => {
    const ids = new Set(chapters.map((c) => c.id) as string[]);
    discoveries.forEach((d) => expect(ids.has(d.chapter)).toBe(true));
    expect(new Set(discoveries.map((d) => d.id)).size).toBe(discoveries.length);
  });
});

describe("scene interpolation", () => {
  it("lerps colours and clamps t", () => {
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(lerpColor("#000000", "#ffffff", 2)).toBe("#ffffff");
  });

  it("eases with a smoothstep", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });

  it("finds the continuous chapter position at the viewport centre", () => {
    const tops = [0, 1000, 2000];
    expect(chapterPosition(0, 800, tops)).toBeCloseTo(0.4);
    expect(chapterPosition(1100, 800, tops)).toBeCloseTo(1.5);
    expect(chapterPosition(5000, 800, tops)).toBe(2);
    expect(chapterPosition(0, 800, [])).toBe(0);
  });

  it("blends layers between neighbouring scenes", () => {
    const a = scenes.launchpad.dark;
    const b = scenes.atmosphere.dark;
    const mid = blendKeyframes(a, b, 0.5);
    expect(mid.layers.moonbase).toBeCloseTo(0.5);
    expect(mid.layers.clouds).toBeCloseTo(0.5);
    expect(sceneAt([a, b], 0)).toEqual(blendKeyframes(a, a, 0));
    expect(sceneAt([a, b], 1).layers.clouds).toBe(1);
  });
});

describe("EventBus", () => {
  it("delivers typed events and supports unsubscribe", () => {
    type E = { type: "a"; n: number } | { type: "b" };
    const bus = new EventBus<E>();
    const onA = vi.fn();
    const off = bus.onType("a", onA);
    bus.emit({ type: "b" });
    bus.emit({ type: "a", n: 1 });
    off();
    bus.emit({ type: "a", n: 2 });
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onA).toHaveBeenCalledWith({ type: "a", n: 1 });
  });

  it("remembers the latest event of each type for late subscribers", () => {
    type E = { type: "a"; n: number } | { type: "b" };
    const bus = new EventBus<E>();
    expect(bus.latest("a")).toBeUndefined();
    bus.emit({ type: "a", n: 1 });
    bus.emit({ type: "b" });
    bus.emit({ type: "a", n: 2 });
    expect(bus.latest("a")).toEqual({ type: "a", n: 2 });
    expect(bus.latest("b")).toEqual({ type: "b" });
  });
});

describe("DiscoveryTracker", () => {
  it("records first discoveries, persists, and reports completion", () => {
    const store = createMemoryStore();
    const t = new DiscoveryTracker(["x", "y"], store);
    expect(t.discover("x")).toBe(true);
    expect(t.discover("x")).toBe(false);
    expect(t.discover("nope")).toBe(false);
    expect(t.complete).toBe(false);
    t.discover("y");
    expect(t.complete).toBe(true);
    expect(new DiscoveryTracker(["x", "y"], store).has("y")).toBe(true);
  });
});

describe("BooleanPreference", () => {
  it("toggles, persists and notifies", () => {
    const store = createMemoryStore();
    const p = new BooleanPreference(store, "k");
    const fn = vi.fn();
    p.subscribe(fn);
    p.toggle();
    expect(p.getSnapshot()).toBe(true);
    expect(store.get("k", false)).toBe(true);
    p.set(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
