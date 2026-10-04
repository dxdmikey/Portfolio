import { describe, expect, it } from "vitest";
import { SFX_PATCHES } from "@/game/audio/patches";
import { WebAudioSfx, playRatio } from "@/game/audio/sfx";
import { SOUND_DEFAULT, SoundPreference } from "@/game/audio/sound-preference";
import { DEFAULT_JITTER } from "@/game/audio/synth";
import {
  KEY_PENTATONIC,
  PING_DEGREE_SPAN,
  inKey,
  pentatonicRatio,
  pentatonicSemitones,
  pingDegreeForX,
} from "@/game/audio/key";
import { createMemoryStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import type { SfxName } from "@/types/game";
import { fakeAudio, flush, gesture } from "./audio-fakes";

const NAMES: SfxName[] = [
  "blip",
  "select",
  "error",
  "warp",
  "flip",
  "discover",
  "power-up",
  "short",
  "crack",
  "whoosh",
  "type",
  "success",
  "toggle",
  "ping",
  "alarm",
  "promote",
  "quarantine",
];
const MAX_VOICE_LEVEL = 1.5;

describe("sfx patch registry", () => {
  it("has a non-empty, tastefully levelled patch for every name", () => {
    expect(Object.keys(SFX_PATCHES).sort()).toEqual([...NAMES].sort());
    for (const name of NAMES) {
      const patch = SFX_PATCHES[name];
      expect(patch.voices.length).toBeGreaterThan(0);
      for (const voice of patch.voices) {
        expect(voice.durationMs).toBeGreaterThan(0);
        expect((voice.level ?? 1) * (patch.gain ?? 1)).toBeLessThanOrEqual(MAX_VOICE_LEVEL);
      }
    }
  });

  it("jitters pitch by at most ±4%", () => {
    const patch = SFX_PATCHES.blip;
    expect(playRatio(patch, undefined, () => 0)).toBeCloseTo(1 - DEFAULT_JITTER);
    expect(playRatio(patch, undefined, () => 1)).toBeCloseTo(1 + DEFAULT_JITTER);
    expect(playRatio(patch, undefined, () => 0.5)).toBeCloseTo(1);
  });

  it("tunes ping to the pentatonic degree without jitter", () => {
    const patch = SFX_PATCHES.ping;
    expect(playRatio(patch, { degree: 5 }, () => 0)).toBeCloseTo(2);
    expect(playRatio(patch, { degree: 3 }, () => 1)).toBeCloseTo(pentatonicRatio(3));
  });
});

describe("key helpers", () => {
  it("maps x across the screen to pentatonic degrees, low to high", () => {
    expect(pingDegreeForX(0, 1000)).toBe(0);
    expect(pingDegreeForX(999, 1000)).toBe(PING_DEGREE_SPAN - 1);
    expect(pingDegreeForX(2000, 1000)).toBe(PING_DEGREE_SPAN - 1);
    expect(pingDegreeForX(-5, 1000)).toBe(0);
    expect(pingDegreeForX(10, 0)).toBe(0);
  });

  it("keeps every pentatonic degree in D minor", () => {
    for (let d = -KEY_PENTATONIC.length; d < PING_DEGREE_SPAN * 2; d++) {
      expect(inKey(62 + pentatonicSemitones(d))).toBe(true);
    }
  });
});

describe("WebAudioSfx", () => {
  it("throttles the typing tick", async () => {
    const audio = fakeAudio();
    const sfx = new WebAudioSfx(audio.engine, undefined, () => 0.5);
    gesture(audio.gestures);
    await flush();
    const ctx = audio.ctx();
    if (!ctx) throw new Error("context missing");
    sfx.play("type");
    const once = ctx.sources.length;
    sfx.play("type");
    expect(ctx.sources.length).toBe(once);
    ctx.currentTime += 0.05;
    sfx.play("type");
    expect(ctx.sources.length).toBeGreaterThan(once);
  });

  it("plays noise voices through the shared noise buffer", async () => {
    const audio = fakeAudio();
    const sfx = new WebAudioSfx(audio.engine, undefined, () => 0.5);
    gesture(audio.gestures);
    await flush();
    sfx.play("crack");
    const ctx = audio.ctx();
    expect(ctx?.sources.some((s) => s.buffer !== null)).toBe(true);
  });
});

describe("SoundPreference", () => {
  it("defaults to on and pushes the stored value into the player", () => {
    expect(SOUND_DEFAULT).toBe(true);
    const audio = fakeAudio();
    const sfx = new WebAudioSfx(audio.engine);
    const on = new SoundPreference(createMemoryStore(), sfx);
    expect(on.getSnapshot()).toBe(true);
    expect(audio.engine.enabled).toBe(true);

    const off = new SoundPreference(createMemoryStore({ [STORAGE_KEYS.sound]: false }), sfx);
    expect(off.getSnapshot()).toBe(false);
    expect(audio.engine.enabled).toBe(false);
  });
});
