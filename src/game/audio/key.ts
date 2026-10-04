/**
 * The one musical key shared by the music and the tuned sound effects (D minor), so a
 * background-click `ping` always lands in harmony with whatever the music is playing.
 */

const A4_MIDI = 69;
const A4_HZ = 440;
const SEMITONES_PER_OCTAVE = 12;

/** D. */
export const KEY_ROOT_PITCH_CLASS = 2;

/** D natural minor (Aeolian). Bb major 7 #11 over it gives the Lydian sparkle. */
export const KEY_SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10];

/** D minor pentatonic: D F G A C. No semitone clashes, so any degree sounds right. */
export const KEY_PENTATONIC: readonly number[] = [0, 3, 5, 7, 10];

/** MIDI note of the `ping` root (D5). */
export const PING_ROOT_MIDI = 74;

/** How many pentatonic degrees the screen width spans (two octaves). */
export const PING_DEGREE_SPAN = KEY_PENTATONIC.length * 2;

export function midiToHz(midi: number): number {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

/** Semitone offset from the root for a pentatonic degree (negative degrees go down). */
export function pentatonicSemitones(degree: number): number {
  const size = KEY_PENTATONIC.length;
  const octave = Math.floor(degree / size);
  const index = degree - octave * size;
  return octave * SEMITONES_PER_OCTAVE + (KEY_PENTATONIC[index] ?? 0);
}

/** Frequency ratio of a pentatonic degree relative to the root. */
export function pentatonicRatio(degree: number): number {
  return 2 ** (pentatonicSemitones(Math.round(degree)) / SEMITONES_PER_OCTAVE);
}

/** Left edge = low, right edge = high: maps a click's x to a pentatonic degree. */
export function pingDegreeForX(x: number, width: number): number {
  if (!(width > 0)) return 0;
  const t = Math.min(Math.max(x / width, 0), 1);
  return Math.min(Math.floor(t * PING_DEGREE_SPAN), PING_DEGREE_SPAN - 1);
}

/** True when a MIDI note belongs to D natural minor. */
export function inKey(midi: number): boolean {
  const pc =
    (((midi - KEY_ROOT_PITCH_CLASS) % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
    SEMITONES_PER_OCTAVE;
  return KEY_SCALE.includes(pc);
}
