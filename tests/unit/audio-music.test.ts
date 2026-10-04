import { describe, expect, it } from "vitest";
import { chapters } from "@/content/story";
import { inKey, KEY_PENTATONIC, PING_ROOT_MIDI } from "@/game/audio/key";
import { CHAPTER_MIX } from "@/game/audio/music/mix";
import { MUSIC_DEFAULT, MusicPlayer } from "@/game/audio/music/player";
import {
  HORIZON_S,
  LookaheadScheduler,
  MAX_LAG_S,
  type SchedulerTimer,
} from "@/game/audio/music/scheduler";
import {
  BPM,
  LAYERS,
  SONG_STEPS,
  STEPS_PER_BAR,
  STEP_SECONDS,
  eventsAtStep,
} from "@/game/audio/music/song";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { EventBus } from "@/game/events/bus";
import { connectAudio } from "@/game/audio/wire";
import { silentSfx } from "@/game/audio/sfx";
import { createMemoryStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import type { GameEvent } from "@/types/events";
import { fakeAudio, flush, gesture } from "./audio-fakes";

const allEvents = () =>
  Array.from({ length: SONG_STEPS }, (_, step) => ({ step, events: eventsAtStep(step) }));

describe("song", () => {
  it("is around 96 BPM with 16 sixteenths per bar and a 1-2 minute loop", () => {
    expect(BPM).toBe(96);
    expect(STEPS_PER_BAR).toBe(16);
    const loopSeconds = SONG_STEPS * STEP_SECONDS;
    expect(loopSeconds).toBeGreaterThanOrEqual(60);
    expect(loopSeconds).toBeLessThanOrEqual(120);
  });

  it("starts a pad chord on every bar and nowhere else", () => {
    for (const { step, events } of allEvents()) {
      const pads = events.filter((e) => e.layer === "pad");
      expect(pads.length).toBe(step % STEPS_PER_BAR === 0 ? 1 : 0);
    }
  });

  it("keeps every pitched note in D minor", () => {
    for (const { events } of allEvents()) {
      for (const e of events) for (const n of e.notes) expect(inKey(n)).toBe(true);
    }
  });

  it("plays chimes only on the pentatonic scale", () => {
    for (const { events } of allEvents()) {
      for (const e of events.filter((x) => x.layer === "chimes")) {
        const n = e.notes[0] ?? 0;
        expect(KEY_PENTATONIC).toContain((((n - PING_ROOT_MIDI) % 12) + 12) % 12);
      }
    }
  });

  it("uses every layer and varies the arp across sections", () => {
    const layers = new Set(allEvents().flatMap(({ events }) => events.map((e) => e.layer)));
    expect([...layers].sort()).toEqual([...LAYERS].sort());
    const arpBar = (bar: number) =>
      Array.from({ length: STEPS_PER_BAR }, (_, i) =>
        eventsAtStep(bar * STEPS_PER_BAR + i).some((e) => e.layer === "arp"),
      );
    expect(arpBar(0)).not.toEqual(arpBar(4));
  });

  it("wraps around the loop", () => {
    expect(eventsAtStep(SONG_STEPS + 5)).toEqual(eventsAtStep(5));
    expect(eventsAtStep(-1)).toEqual(eventsAtStep(SONG_STEPS - 1));
  });
});

describe("chapter mix", () => {
  it("covers every chapter in story order with gains in 0..1", () => {
    for (const chapter of chapters) {
      const mix = CHAPTER_MIX[chapter.id];
      expect(mix).toBeDefined();
      for (const layer of LAYERS) {
        expect(mix[layer]).toBeGreaterThanOrEqual(0);
        expect(mix[layer]).toBeLessThanOrEqual(1);
      }
      expect(mix.pad).toBeGreaterThan(0);
    }
    expect(Object.keys(CHAPTER_MIX).sort()).toEqual(chapters.map((c) => c.id).sort());
  });

  it("builds energy: launchpad is the sparsest, armory the fullest", () => {
    const energy = (id: keyof typeof CHAPTER_MIX) =>
      LAYERS.reduce((sum, l) => sum + CHAPTER_MIX[id][l], 0);
    expect(energy("launchpad")).toBeLessThan(energy("nebula"));
    expect(energy("nebula")).toBeLessThan(energy("armory"));
    expect(energy("transmission")).toBeLessThan(energy("armory"));
  });
});

function manualTimer() {
  const timers = new Set<() => void>();
  const timer: SchedulerTimer = {
    set: (fn) => {
      timers.add(fn);
      return fn;
    },
    clear: (handle) => void timers.delete(handle as () => void),
  };
  return { timer, active: () => timers.size };
}

describe("LookaheadScheduler", () => {
  const STEP = 0.1;

  function setup() {
    let now = 0;
    const seen: [number, number][] = [];
    const { timer, active } = manualTimer();
    const scheduler = new LookaheadScheduler(
      { now: () => now },
      (step, time) => seen.push([step, time]),
      STEP,
      timer,
    );
    return { scheduler, seen, active, setNow: (t: number) => (now = t) };
  }

  it("schedules only steps inside the horizon, without duplicates", () => {
    const { scheduler, seen, setNow } = setup();
    scheduler.start(0, 0.01);
    expect(seen.every(([, t]) => t < HORIZON_S)).toBe(true);
    const first = seen.length;
    expect(first).toBeGreaterThan(0);
    scheduler.tick();
    expect(seen.length).toBe(first);
    for (let t = 0.025; t < 1; t += 0.025) {
      setNow(t);
      scheduler.tick();
    }
    const steps = seen.map(([s]) => s);
    expect(new Set(steps).size).toBe(steps.length);
    expect(steps).toEqual(steps.map((_, i) => i));
    seen.forEach(([, time], i) => expect(time).toBeCloseTo(0.01 + i * STEP));
  });

  it("stops and resumes from its position", () => {
    const { scheduler, seen, active, setNow } = setup();
    scheduler.start(0, 0);
    setNow(0.5);
    scheduler.tick();
    scheduler.stop();
    expect(active()).toBe(0);
    const count = seen.length;
    setNow(1);
    scheduler.tick();
    expect(seen.length).toBe(count);
    scheduler.start(scheduler.position, 1);
    expect(active()).toBe(1);
    expect(seen[count]?.[0]).toBe(count);
  });

  it("skips ahead after a stall instead of bursting notes", () => {
    const { scheduler, seen, setNow } = setup();
    scheduler.start(0, 0);
    const before = seen.length;
    setNow(10);
    scheduler.tick();
    const burst = seen.length - before;
    expect(burst).toBeLessThanOrEqual(Math.ceil((HORIZON_S + MAX_LAG_S) / STEP) + 1);
    expect(seen.at(-1)?.[1]).toBeGreaterThan(10);
  });
});

describe("MusicPlayer", () => {
  async function running() {
    const audio = fakeAudio();
    const { timer, active } = manualTimer();
    const music = new MusicPlayer(audio.engine, { timer, random: () => 0.5 });
    gesture(audio.gestures);
    await flush();
    return { ...audio, music, active };
  }

  it("is on by default and starts once audio is unlocked", async () => {
    expect(MUSIC_DEFAULT).toBe(true);
    const { music, active, ctx } = await running();
    expect(music.isPlaying).toBe(true);
    expect(active()).toBe(1);
    expect(ctx()?.oscillators.length).toBeGreaterThan(0);
  });

  it("stops for quick view, the music toggle, master mute and hidden tabs", async () => {
    const { music, engine, visibility } = await running();
    music.setSuppressed("quick-view", true);
    expect(music.isPlaying).toBe(false);
    music.setSuppressed("quick-view", false);
    expect(music.isPlaying).toBe(true);
    music.setEnabled(false);
    expect(music.isPlaying).toBe(false);
    music.setEnabled(true);
    engine.setEnabled(false);
    expect(music.isPlaying).toBe(false);
    engine.setEnabled(true);
    await flush();
    expect(music.isPlaying).toBe(true);
    visibility.set(true);
    expect(music.isPlaying).toBe(false);
    visibility.set(false);
    await flush();
    expect(music.isPlaying).toBe(true);
  });

  it("follows chapter:enter, music preference and quick view through connectAudio", async () => {
    const audio = fakeAudio();
    const store = createMemoryStore({ [STORAGE_KEYS.music]: false });
    const { timer } = manualTimer();
    const music = new MusicPlayer(audio.engine, { timer });
    const musicPref = new BooleanPreference(store, STORAGE_KEYS.music, MUSIC_DEFAULT);
    const quickView = new BooleanPreference(store, STORAGE_KEYS.quickView);
    const bus = new EventBus<GameEvent>();
    const disconnect = connectAudio({
      engine: audio.engine,
      music,
      musicPref,
      quickView,
      bus,
      sfx: silentSfx,
    });
    gesture(audio.gestures);
    await flush();
    expect(music.isPlaying).toBe(false);
    musicPref.set(true);
    expect(music.isPlaying).toBe(true);
    bus.emit({ type: "chapter:enter", chapter: "armory" });
    expect(music.currentChapter).toBe("armory");
    quickView.set(true);
    expect(music.isPlaying).toBe(false);
    disconnect();
  });
});
