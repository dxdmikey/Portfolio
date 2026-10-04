"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sections } from "@/content/navigation";
import { VisitTracker } from "@/game/progress/visits";
import { AudioEngine } from "@/game/audio/engine";
import { MUSIC_DEFAULT, MusicPlayer } from "@/game/audio/music/player";
import { WebAudioSfx, type SfxPlayer } from "@/game/audio/sfx";
import { SoundPreference } from "@/game/audio/sound-preference";
import { connectAudio } from "@/game/audio/wire";
import { EventBus } from "@/game/events/bus";
import { DiscoveryTracker } from "@/game/discoveries/tracker";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { discoveryIds } from "@/content/discoveries";
import { createWebStore, type KeyValueStore } from "@/lib/storage";
import type { GameEvent } from "@/types/events";
import { STORAGE_KEYS } from "@/lib/constants";

interface GameServices {
  visits: VisitTracker;
  sfx: SfxPlayer;
  /** Master on/off for all audio (effects + music). */
  sound: SoundPreference;
  /** The one shared AudioContext (unlocked on the first gesture). */
  audio: AudioEngine;
  /** Adaptive background music; follows `chapter:enter` and quick view. */
  music: MusicPlayer;
  /** Background music on/off (under the master `sound`). */
  musicPref: BooleanPreference;
  store: KeyValueStore;
  /** Decoupled feature-to-feature messaging (discoveries → NOVA, FX). */
  bus: EventBus<GameEvent>;
  discoveries: DiscoveryTracker;
  /** Recruiter-friendly compact view without the story layers. */
  quickView: BooleanPreference;
}

const GameContext = createContext<GameServices | null>(null);

type AudioServiceKey = "audio" | "music" | "musicPref";
/** Test doubles may leave out the audio services; inert ones are filled in. */
type GameServicesInput = Omit<GameServices, AudioServiceKey> &
  Partial<Pick<GameServices, AudioServiceKey>>;

function withAudioDefaults(input: GameServicesInput): GameServices {
  const audio = input.audio ?? new AudioEngine(() => null);
  return {
    ...input,
    audio,
    music: input.music ?? new MusicPlayer(audio),
    musicPref:
      input.musicPref ?? new BooleanPreference(input.store, STORAGE_KEYS.music, MUSIC_DEFAULT),
  };
}

interface GameProviderProps {
  children: ReactNode;
  /** Inject alternative services (tests). Defaults to browser-backed implementations. */
  services?: GameServicesInput;
}

function createServices(): GameServices {
  const store = createWebStore("local");
  const audio = new AudioEngine();
  const sfx = new WebAudioSfx(audio);
  return {
    store,
    sfx,
    sound: new SoundPreference(store, sfx),
    audio,
    music: new MusicPlayer(audio),
    musicPref: new BooleanPreference(store, STORAGE_KEYS.music, MUSIC_DEFAULT),
    bus: new EventBus<GameEvent>(),
    discoveries: new DiscoveryTracker(discoveryIds, store),
    quickView: new BooleanPreference(store, STORAGE_KEYS.quickView),
    visits: new VisitTracker(
      sections.map((s) => s.id),
      store,
    ),
  };
}

export function GameProvider({ children, services }: GameProviderProps) {
  // Lazily created on the client only; the static HTML renders without storage access.
  const [value] = useState<GameServices>(() =>
    services ? withAudioDefaults(services) : createServices(),
  );

  // Audio: gesture unlock, music preference, quick view and chapter mix.
  useEffect(
    () =>
      connectAudio({
        engine: value.audio,
        music: value.music,
        musicPref: value.musicPref,
        quickView: value.quickView,
        bus: value.bus,
        sfx: value.sfx,
      }),
    [value],
  );

  const memo = useMemo(() => value, [value]);
  return <GameContext.Provider value={memo}>{children}</GameContext.Provider>;
}

export function useGame(): GameServices {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
