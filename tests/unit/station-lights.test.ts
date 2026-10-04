import { describe, expect, it, vi } from "vitest";
import {
  CASCADE_S,
  PRESENCE_HOLD_S,
  PRESENCE_IN_S,
  PRESENCE_OUT_S,
  StationLights,
} from "@/game/scene/station-lights";

describe("StationLights (sky station reacting to CH4)", () => {
  it("is dark at 0 and lights in proportion to modules online", () => {
    const l = new StationLights();
    expect(l.litCount(14)).toBe(0);
    l.setPower(4, 8);
    expect(l.level).toBe(0.5);
    expect(l.litCount(14)).toBe(7);
    l.setPower(8, 8);
    expect(l.litCount(14)).toBe(14);
    l.setPower(0, 8);
    expect(l.litCount(14)).toBe(0);
  });

  it("plays a cascade on sync, then stays fully lit", () => {
    const l = new StationLights();
    l.setPower(8, 8);
    l.sync(10, true);
    expect(l.busy(10 + CASCADE_S / 2)).toBe(true);
    expect(l.pulse(10 + CASCADE_S / 2)).toBeCloseTo(1);
    // The sweep crosses left to right: the left edge flashes before the right edge.
    const early = 10 + CASCADE_S * 0.2;
    expect(l.flash(0, early)).toBeGreaterThan(l.flash(1, early));
    const late = 10 + CASCADE_S * 0.8;
    expect(l.flash(1, late)).toBeGreaterThan(l.flash(0, late));
    expect(l.flash(0.5, 10 + CASCADE_S)).toBe(0);
    // The station lingers in view after the sweep, then hands back to the scene.
    expect(l.busy(10 + CASCADE_S)).toBe(true);
    expect(l.busy(10 + PRESENCE_HOLD_S + PRESENCE_OUT_S)).toBe(false);
    expect(l.level).toBe(1);
  });

  it("summons the station into view for the sync, then fades it out", () => {
    const l = new StationLights();
    expect(l.presence(0)).toBe(0);
    l.sync(10, true);
    expect(l.presence(9)).toBe(0);
    expect(l.presence(10 + PRESENCE_IN_S / 2)).toBeCloseTo(0.5);
    expect(l.presence(10 + CASCADE_S)).toBe(1);
    expect(l.presence(10 + PRESENCE_HOLD_S + PRESENCE_OUT_S / 2)).toBeCloseTo(0.5);
    expect(l.presence(10 + PRESENCE_HOLD_S + PRESENCE_OUT_S)).toBe(0);
    l.setPower(7, 8);
    expect(l.presence(10 + CASCADE_S)).toBe(0);
  });

  it("skips the cascade under reduced motion and resets on power loss", () => {
    const l = new StationLights();
    l.sync(5, false);
    expect(l.busy(5)).toBe(false);
    expect(l.presence(5)).toBe(0);
    expect(l.level).toBe(1);
    l.setPower(3, 8);
    expect(l.level).toBeCloseTo(3 / 8);
  });

  it("notifies subscribers so the sky can redraw", () => {
    const l = new StationLights();
    const fn = vi.fn();
    const off = l.subscribe(fn);
    l.setPower(1, 8);
    l.sync(0, true);
    off();
    l.setPower(2, 8);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
