import { describe, expect, it } from "vitest";
import { WebAudioSfx } from "@/game/audio/sfx";
import { fakeAudio, flush, gesture } from "./audio-fakes";

function setup(options?: Parameters<typeof fakeAudio>[0]) {
  const audio = fakeAudio(options);
  const sfx = new WebAudioSfx(audio.engine, undefined, () => 0.5);
  const oscillators = () => audio.ctx()?.oscillators.length ?? 0;
  return { ...audio, sfx, oscillators };
}

describe("AudioEngine unlock", () => {
  it("does not create a context before a gesture, and play is a silent no-op", () => {
    const { engine, sfx, created } = setup();
    sfx.play("blip");
    expect(created()).toBe(0);
    expect(engine.running).toBe(false);
  });

  it("creates and resumes the context on the first gesture, then plays", async () => {
    const { engine, gestures, sfx, oscillators, session, ctx } = setup();
    gesture(gestures);
    expect(ctx()?.resumeCalls).toBe(1);
    await flush();
    expect(engine.running).toBe(true);
    expect(session.type).toBe("playback");
    sfx.play("select");
    expect(oscillators()).toBeGreaterThan(0);
  });

  it("only creates one context however many gestures arrive", async () => {
    const { gestures, created } = setup();
    for (const type of ["pointerup", "click", "keydown", "touchend"]) gesture(gestures, type);
    await flush();
    expect(created()).toBe(1);
  });

  it("keeps retrying resume on later gestures while suspended", async () => {
    const { engine, gestures, sfx, oscillators, ctx } = setup({ resume: "reject" });
    gesture(gestures);
    await flush();
    expect(engine.running).toBe(false);
    sfx.play("blip");
    expect(oscillators()).toBe(0);

    const context = ctx();
    if (!context) throw new Error("context missing");
    context.resumeBehaviour = "resolve";
    gesture(gestures, "click");
    await flush();
    expect(engine.running).toBe(true);
    sfx.play("blip");
    expect(oscillators()).toBeGreaterThan(0);
  });

  it("recovers from Safari's 'interrupted' state", async () => {
    const { engine, gestures, sfx, oscillators, ctx } = setup();
    gesture(gestures);
    await flush();
    const context = ctx();
    if (!context) throw new Error("context missing");

    context.resumeBehaviour = "reject";
    context.setState("interrupted");
    await flush();
    expect(engine.running).toBe(false);
    const before = oscillators();
    sfx.play("blip");
    expect(oscillators()).toBe(before);

    context.resumeBehaviour = "resolve";
    gesture(gestures, "touchend");
    await flush();
    expect(engine.running).toBe(true);
    sfx.play("blip");
    expect(oscillators()).toBeGreaterThan(before);
  });

  it("resumes when the tab becomes visible again", async () => {
    const { engine, gestures, visibility, ctx } = setup();
    gesture(gestures);
    await flush();
    const context = ctx();
    if (!context) throw new Error("context missing");
    visibility.set(true);
    context.resumeBehaviour = "reject";
    context.setState("suspended");
    await flush();
    const calls = context.resumeCalls;
    context.resumeBehaviour = "resolve";
    visibility.set(false);
    await flush();
    expect(context.resumeCalls).toBe(calls + 1);
    expect(engine.running).toBe(true);
  });

  it("plays the sound of the click that unlocks audio once resume settles", async () => {
    const { gestures, sfx, oscillators } = setup();
    gesture(gestures);
    sfx.play("warp");
    expect(oscillators()).toBe(0);
    await flush();
    expect(oscillators()).toBeGreaterThan(0);
  });

  it("never schedules while resume hangs", async () => {
    const { gestures, sfx, oscillators } = setup({ resume: "hang" });
    gesture(gestures);
    sfx.play("blip");
    await flush();
    expect(oscillators()).toBe(0);
  });
});

describe("AudioEngine mute", () => {
  it("survives 10 rapid mute/unmute toggles and still plays", async () => {
    const { gestures, sfx, oscillators } = setup();
    gesture(gestures);
    await flush();
    for (let i = 0; i < 10; i++) {
      sfx.setEnabled(false);
      const muted = oscillators();
      sfx.play("blip");
      expect(oscillators()).toBe(muted);
      sfx.setEnabled(true);
      await flush();
      const before = oscillators();
      sfx.play("blip");
      expect(oscillators()).toBeGreaterThan(before);
    }
  });

  it("doesn't touch the audio session or create a context while muted", () => {
    const { engine, gestures, created, session } = setup();
    engine.setEnabled(false);
    gesture(gestures);
    expect(created()).toBe(0);
    expect(session.type).toBe("auto");
  });

  it("unmuting from the toggle's click creates the context right there", async () => {
    const { engine, created } = setup();
    engine.setEnabled(false);
    engine.setEnabled(true);
    await flush();
    expect(created()).toBe(1);
    expect(engine.running).toBe(true);
  });
});
