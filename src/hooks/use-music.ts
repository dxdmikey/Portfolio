"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";

const serverSnapshot = () => false;

/**
 * Background music on/off. Music only plays while the master sound is also on, so
 * `audible` is what the toggle shows; turning music on while muted unmutes too.
 */
export function useMusic() {
  const { musicPref, sound, sfx } = useGame();
  const musicOn = useSyncExternalStore(musicPref.subscribe, musicPref.getSnapshot, serverSnapshot);
  const soundOn = useSyncExternalStore(sound.subscribe, sound.getSnapshot, serverSnapshot);
  const audible = musicOn && soundOn;

  const toggle = useCallback(() => {
    if (audible) {
      musicPref.set(false);
    } else {
      musicPref.set(true);
      sound.set(true);
    }
    sfx.play("toggle");
  }, [audible, musicPref, sound, sfx]);

  return useMemo(() => ({ audible, toggle }), [audible, toggle]);
}
