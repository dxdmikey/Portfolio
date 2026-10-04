import { pingDegreeForX } from "@/game/audio/key";
import type { SfxName, SfxOptions } from "@/types/game";

/** Anything with a `play(name, options)` (the `SfxPlayer` from `useGame().sfx`). */
interface SoundOut {
  play(name: SfxName, options?: SfxOptions): void;
}

/**
 * The background-click sound, in ONE place: a small bell on the music's pentatonic scale,
 * low at the left edge and high at the right, so idle clicking plays along with the music.
 */
export function createBackgroundPing(sfx: SoundOut): (x: number, width: number) => void {
  return function playBackgroundPing(x: number, width: number) {
    sfx.play("ping", { degree: pingDegreeForX(x, width) });
  };
}
