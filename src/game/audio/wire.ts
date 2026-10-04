import type { EventBus } from "@/game/events/bus";
import type { BooleanPreference } from "@/game/preferences/boolean-preference";
import type { GameEvent } from "@/types/events";
import { ChapterWhoosh } from "./chapter-whoosh";
import type { AudioEngine } from "./engine";
import type { MusicPlayer } from "./music/player";
import type { SfxPlayer } from "./sfx";

export interface AudioWiring {
  engine: AudioEngine;
  music: MusicPlayer;
  musicPref: BooleanPreference;
  quickView: BooleanPreference;
  bus: EventBus<GameEvent>;
  sfx: SfxPlayer;
}

/**
 * Connects the audio services to the rest of the game: gesture unlock listeners, the
 * music preference, quick view (pauses the music) and `chapter:enter` (changes the mix, soft whoosh).
 * Call once from an effect; returns the cleanup.
 */
export function connectAudio({
  engine,
  music,
  musicPref,
  quickView,
  bus,
  sfx,
}: AudioWiring): () => void {
  const uninstall = engine.install();
  const whoosh = new ChapterWhoosh(sfx);
  const syncMusic = () => music.setEnabled(musicPref.getSnapshot());
  const syncQuickView = () => music.setSuppressed("quick-view", quickView.getSnapshot());
  syncMusic();
  syncQuickView();
  const offs = [
    musicPref.subscribe(syncMusic),
    quickView.subscribe(syncQuickView),
    bus.onType("chapter:enter", (e) => {
      music.setChapter(e.chapter);
      whoosh.enter(e.chapter);
    }),
  ];
  return () => {
    offs.forEach((off) => off());
    uninstall();
  };
}
