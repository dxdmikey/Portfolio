"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";
import type { SfxName, SfxOptions } from "@/types/game";

/** Before hydration we don't know the stored choice: render "off" (nothing yet). */
const serverSnapshot = () => false;

/** Read and toggle the master sound (on by default, persisted). Shared state across all callers. */
export function useSfx() {
  const { sfx, sound } = useGame();
  const enabled = useSyncExternalStore(sound.subscribe, sound.getSnapshot, serverSnapshot);

  const setEnabled = useCallback(
    (on: boolean) => {
      sound.set(on);
      // Plays once the click has unlocked/resumed audio (the engine defers it briefly).
      if (on) sfx.play("toggle");
    },
    [sound, sfx],
  );

  const play = useCallback((name: SfxName, options?: SfxOptions) => sfx.play(name, options), [sfx]);
  return useMemo(() => ({ enabled, setEnabled, play }), [enabled, setEnabled, play]);
}
