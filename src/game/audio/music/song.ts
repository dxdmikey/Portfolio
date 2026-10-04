import { PING_ROOT_MIDI, pentatonicSemitones } from "../key";

/**
 * "Neon Drift" — an original loop for The Voyage. Glossy synth-pop meets open space:
 * D minor with a Bb major 7 #11 (Lydian) sparkle, 96 BPM. Pure data + one pure function
 * (`eventsAtStep`) so the whole arrangement is unit-testable without Web Audio.
 *
 * Form: 8 sections × 4 bars (= 32 bars ≈ 80 s), alternating A and B with different arp,
 * bass and chime variations so the loop doesn't wear thin.
 */

export const BPM = 96;
export const STEPS_PER_BEAT = 4;
export const BEATS_PER_BAR = 4;
export const STEPS_PER_BAR = STEPS_PER_BEAT * BEATS_PER_BAR;
export const BARS_PER_SECTION = 4;
export const STEPS_PER_SECTION = STEPS_PER_BAR * BARS_PER_SECTION;
const SECONDS_PER_MINUTE = 60;
export const BEAT_SECONDS = SECONDS_PER_MINUTE / BPM;
/** One sixteenth note. */
export const STEP_SECONDS = BEAT_SECONDS / STEPS_PER_BEAT;

export const LAYERS = ["pad", "arp", "bass", "chimes", "hats"] as const;
export type Layer = (typeof LAYERS)[number];

interface Chord {
  name: string;
  /** Sub-bass root (MIDI). */
  bass: number;
  /** Pad voicing (MIDI), held for the whole bar. */
  pad: readonly number[];
  /** Arpeggio pool (MIDI), indexed by the arp patterns. */
  arp: readonly number[];
}

const CHORDS = {
  dm9: { name: "Dm9", bass: 38, pad: [53, 57, 60, 64], arp: [62, 65, 69, 72, 76] },
  bbLydian: { name: "Bbmaj7#11", bass: 34, pad: [53, 57, 62, 64], arp: [58, 62, 65, 69, 76] },
  fmaj9: { name: "Fmaj9", bass: 41, pad: [57, 60, 64, 67], arp: [60, 65, 69, 72, 79] },
  cadd9: { name: "Cadd9", bass: 36, pad: [55, 60, 62, 64], arp: [60, 64, 67, 72, 74] },
  gm9: { name: "Gm9", bass: 43, pad: [58, 62, 65, 69], arp: [62, 65, 67, 70, 74] },
  am7: { name: "Am7", bass: 45, pad: [57, 60, 64, 67], arp: [64, 67, 69, 72, 76] },
  asus: { name: "A7sus4", bass: 45, pad: [55, 57, 62, 64], arp: [57, 62, 64, 67, 69] },
} as const satisfies Record<string, Chord>;

const PROGRESSIONS: Readonly<Record<"A" | "B" | "B2", readonly Chord[]>> = {
  A: [CHORDS.dm9, CHORDS.bbLydian, CHORDS.fmaj9, CHORDS.cadd9],
  B: [CHORDS.gm9, CHORDS.bbLydian, CHORDS.am7, CHORDS.asus],
  /** B with a lifted turnaround. */
  B2: [CHORDS.gm9, CHORDS.bbLydian, CHORDS.cadd9, CHORDS.asus],
};

const REST = -1;
/** Indexes into `chord.arp`, one per sixteenth; REST = silence (the delay fills the gaps). */
const ARP_PATTERNS: readonly (readonly number[])[] = [
  [0, REST, 1, REST, 2, REST, 3, REST, 4, REST, 3, REST, 2, REST, 1, REST],
  [0, 2, 4, REST, 1, 3, REST, 4, 2, REST, 3, 1, REST, 4, REST, 2],
  [4, REST, REST, 2, REST, REST, 3, REST, 1, REST, REST, 2, REST, REST, 0, REST],
];

interface BassHit {
  step: number;
  /** Semitones above the chord's bass root (0, 7 = fifth, 12 = octave). */
  interval: number;
  steps: number;
}

const BASS_PATTERNS: readonly (readonly BassHit[])[] = [
  [
    { step: 0, interval: 0, steps: 4 },
    { step: 6, interval: 0, steps: 2 },
    { step: 8, interval: 0, steps: 4 },
    { step: 14, interval: 12, steps: 2 },
  ],
  [
    { step: 0, interval: 0, steps: 3 },
    { step: 3, interval: 0, steps: 3 },
    { step: 6, interval: 0, steps: 2 },
    { step: 8, interval: 0, steps: 3 },
    { step: 11, interval: 7, steps: 3 },
    { step: 14, interval: 12, steps: 2 },
  ],
];

/** Hat velocity per sixteenth (0 = silent). */
const HAT_PATTERNS: readonly (readonly number[])[] = [
  [0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0.3],
  [0.25, 0, 0.8, 0.2, 0, 0.25, 0.8, 0, 0.25, 0, 0.8, 0.2, 0, 0.3, 0.8, 0.25],
];

interface ChimeNote {
  /** Step within the 4-bar section. */
  step: number;
  /** Pentatonic degree above D5. */
  degree: number;
}

const CHIME_STEPS = 8;
/** Bell phrases over one section (64 steps). The last one is a breath. */
const CHIME_PHRASES: readonly (readonly ChimeNote[])[] = [
  [
    { step: 0, degree: 5 },
    { step: 6, degree: 4 },
    { step: 10, degree: 3 },
    { step: 32, degree: 5 },
    { step: 38, degree: 6 },
    { step: 42, degree: 7 },
  ],
  [
    { step: 8, degree: 3 },
    { step: 12, degree: 4 },
    { step: 16, degree: 5 },
    { step: 40, degree: 4 },
    { step: 44, degree: 2 },
    { step: 48, degree: 3 },
  ],
  [
    { step: 0, degree: 7 },
    { step: 3, degree: 5 },
    { step: 6, degree: 4 },
    { step: 24, degree: 3 },
    { step: 32, degree: 6 },
    { step: 35, degree: 4 },
    { step: 38, degree: 3 },
    { step: 56, degree: 2 },
  ],
  [
    { step: 16, degree: 5 },
    { step: 48, degree: 4 },
  ],
];

interface Section {
  progression: keyof typeof PROGRESSIONS;
  arp: number;
  bass: number;
  hats: number;
  chimes: number;
}

export const FORM: readonly Section[] = [
  { progression: "A", arp: 0, bass: 0, hats: 0, chimes: 0 },
  { progression: "A", arp: 1, bass: 0, hats: 0, chimes: 1 },
  { progression: "B", arp: 0, bass: 1, hats: 1, chimes: 2 },
  { progression: "A", arp: 2, bass: 0, hats: 0, chimes: 3 },
  { progression: "A", arp: 1, bass: 1, hats: 1, chimes: 0 },
  { progression: "B2", arp: 2, bass: 1, hats: 1, chimes: 1 },
  { progression: "B", arp: 0, bass: 0, hats: 1, chimes: 2 },
  { progression: "A", arp: 1, bass: 1, hats: 0, chimes: 3 },
];

export const SONG_STEPS = FORM.length * STEPS_PER_SECTION;

export interface NoteEvent {
  layer: Layer;
  /** MIDI notes sounding together. Empty for unpitched hats. */
  notes: readonly number[];
  /** Length in sixteenths. */
  steps: number;
  /** 0..1 */
  velocity: number;
}

const FULL = 1;
const HAT_STEPS = 1;

/** Index into a non-empty, statically known table (wraps; never undefined). */
function pick<T>(table: readonly T[], index: number): T {
  const item = table[((index % table.length) + table.length) % table.length];
  if (item === undefined) throw new Error("empty music table");
  return item;
}

/** Everything that starts on a given sixteenth (wraps around the loop). */
export function eventsAtStep(step: number): NoteEvent[] {
  const s = ((step % SONG_STEPS) + SONG_STEPS) % SONG_STEPS;
  const section = pick(FORM, Math.floor(s / STEPS_PER_SECTION));
  const inSection = s % STEPS_PER_SECTION;
  const inBar = s % STEPS_PER_BAR;
  const chord: Chord = pick(
    PROGRESSIONS[section.progression],
    Math.floor(inSection / STEPS_PER_BAR),
  );
  const events: NoteEvent[] = [];

  if (inBar === 0)
    events.push({ layer: "pad", notes: chord.pad, steps: STEPS_PER_BAR, velocity: FULL });

  const arpIndex = pick(pick(ARP_PATTERNS, section.arp), inBar);
  if (arpIndex !== REST)
    events.push({ layer: "arp", notes: [pick(chord.arp, arpIndex)], steps: 1, velocity: FULL });

  for (const hit of pick(BASS_PATTERNS, section.bass)) {
    if (hit.step === inBar)
      events.push({
        layer: "bass",
        notes: [chord.bass + hit.interval],
        steps: hit.steps,
        velocity: FULL,
      });
  }

  const hat = pick(pick(HAT_PATTERNS, section.hats), inBar);
  if (hat > 0) events.push({ layer: "hats", notes: [], steps: HAT_STEPS, velocity: hat });

  for (const chime of pick(CHIME_PHRASES, section.chimes)) {
    if (chime.step === inSection) {
      events.push({
        layer: "chimes",
        notes: [PING_ROOT_MIDI + pentatonicSemitones(chime.degree)],
        steps: CHIME_STEPS,
        velocity: FULL,
      });
    }
  }
  return events;
}

/** Quarter-note downbeats drive the sidechain-style pump. */
export function isBeat(step: number): boolean {
  return step % STEPS_PER_BEAT === 0;
}
