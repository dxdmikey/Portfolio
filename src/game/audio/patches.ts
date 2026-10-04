import type { SfxName } from "@/types/game";
import type { SfxPatch } from "./synth";

/**
 * Every sound effect, as data. Add a sound = add a name to `SfxName` + one entry here.
 * Melodic notes are in D (the music's key) so effects never clash with the soundtrack.
 * Frequencies in Hz, times in ms, `level` relative to the standard voice level.
 */

const D5 = 587.33;
const F5 = 698.46;
const A5 = 880;
const C6 = 1046.5;
const D6 = 1174.66;
const F6 = 1396.91;
const A6 = 1760;

/** Melodic patches drift only a little so they stay in tune with the music. */
const TUNED_JITTER = 0.008;

export const SFX_PATCHES: Record<SfxName, SfxPatch> = {
  /** Small UI tick: hover-ish, step changes. */
  blip: {
    voices: [
      {
        kind: "tone",
        wave: "square",
        from: 880,
        to: 920,
        durationMs: 45,
        filter: { type: "lowpass", from: 3200 },
      },
    ],
  },
  /** Two-note confirm. */
  select: {
    voices: [
      {
        kind: "tone",
        wave: "square",
        from: 660,
        durationMs: 50,
        level: 0.9,
        filter: { type: "lowpass", from: 3500 },
      },
      {
        kind: "tone",
        wave: "square",
        from: 990,
        atMs: 55,
        durationMs: 80,
        level: 0.9,
        filter: { type: "lowpass", from: 4000 },
      },
    ],
  },
  /** Soft "bonk": two detuned saws falling through a dark filter. */
  error: {
    voices: [
      {
        kind: "tone",
        wave: "sawtooth",
        from: 180,
        to: 120,
        durationMs: 240,
        filter: { type: "lowpass", from: 1200, to: 500 },
      },
      {
        kind: "tone",
        wave: "sawtooth",
        from: 180,
        to: 120,
        durationMs: 240,
        detune: 18,
        level: 0.7,
        filter: { type: "lowpass", from: 1200, to: 500 },
      },
    ],
  },
  /** Hyperspace jump: rising saw with an opening filter and a noise rush. */
  warp: {
    voices: [
      {
        kind: "tone",
        wave: "sawtooth",
        from: 200,
        to: 1400,
        durationMs: 420,
        level: 0.8,
        filter: { type: "lowpass", from: 600, to: 5000, q: 4 },
      },
      {
        kind: "noise",
        durationMs: 420,
        attackMs: 120,
        level: 0.5,
        filter: { type: "bandpass", from: 500, to: 4000, q: 1.5 },
      },
    ],
  },
  /** Card flip: an airy whoosh with a tiny tick at the turn. */
  flip: {
    voices: [
      {
        kind: "noise",
        durationMs: 160,
        attackMs: 40,
        level: 0.9,
        filter: { type: "bandpass", from: 900, to: 3200, q: 1.2 },
      },
      {
        kind: "tone",
        wave: "triangle",
        from: 1500,
        to: 1200,
        atMs: 70,
        durationMs: 30,
        level: 0.5,
      },
    ],
  },
  /** Something found: a rising chime arpeggio in D. */
  discover: {
    jitter: TUNED_JITTER,
    voices: [
      { kind: "tone", wave: "sine", from: A5, atMs: 0, durationMs: 260, level: 0.9 },
      { kind: "tone", wave: "sine", from: D6, atMs: 60, durationMs: 260, level: 0.9 },
      { kind: "tone", wave: "sine", from: F6, atMs: 120, durationMs: 300, level: 0.9 },
      { kind: "tone", wave: "sine", from: A6, atMs: 180, durationMs: 420, level: 0.8 },
      { kind: "tone", wave: "triangle", from: A6 * 2, atMs: 180, durationMs: 200, level: 0.15 },
    ],
  },
  /** Charging up: two rising voices and an opening filter. */
  "power-up": {
    voices: [
      {
        kind: "tone",
        wave: "square",
        from: 220,
        to: 880,
        durationMs: 480,
        level: 0.7,
        attackMs: 40,
        filter: { type: "lowpass", from: 700, to: 4200, q: 3 },
      },
      {
        kind: "tone",
        wave: "triangle",
        from: 110,
        to: 440,
        durationMs: 480,
        level: 0.8,
        attackMs: 40,
      },
    ],
  },
  /** Electric short: crackling bursts over a low buzz. */
  short: {
    voices: [
      {
        kind: "noise",
        atMs: 0,
        durationMs: 25,
        level: 0.8,
        filter: { type: "highpass", from: 2200 },
      },
      {
        kind: "noise",
        atMs: 35,
        durationMs: 20,
        level: 0.6,
        filter: { type: "highpass", from: 2600 },
      },
      {
        kind: "noise",
        atMs: 60,
        durationMs: 30,
        level: 0.8,
        filter: { type: "highpass", from: 1800 },
      },
      {
        kind: "noise",
        atMs: 110,
        durationMs: 18,
        level: 0.5,
        filter: { type: "highpass", from: 3000 },
      },
      {
        kind: "tone",
        wave: "square",
        from: 62,
        durationMs: 160,
        level: 0.35,
        filter: { type: "lowpass", from: 500 },
      },
    ],
  },
  /** Rock break: a noise burst closing down onto a low thud. */
  crack: {
    voices: [
      {
        kind: "noise",
        durationMs: 140,
        level: 1,
        filter: { type: "lowpass", from: 3500, to: 400 },
      },
      { kind: "tone", wave: "sine", from: 130, to: 45, durationMs: 220, level: 1.4 },
    ],
  },
  /** Chapter change: a soft, slow wind sweep. */
  whoosh: {
    voices: [
      {
        kind: "noise",
        durationMs: 650,
        attackMs: 260,
        level: 0.55,
        filter: { type: "bandpass", from: 350, to: 2200, q: 1 },
      },
    ],
  },
  /** NOVA typing: barely there. */
  type: {
    throttleMs: 40,
    voices: [
      {
        kind: "tone",
        wave: "triangle",
        from: 2200,
        to: 2000,
        durationMs: 12,
        level: 0.22,
        attackMs: 1,
      },
    ],
  },
  /** Short fanfare: D F A D. */
  success: {
    jitter: TUNED_JITTER,
    voices: [
      {
        kind: "tone",
        wave: "square",
        from: D5,
        atMs: 0,
        durationMs: 90,
        level: 0.6,
        filter: { type: "lowpass", from: 2600 },
      },
      {
        kind: "tone",
        wave: "square",
        from: F5,
        atMs: 90,
        durationMs: 90,
        level: 0.6,
        filter: { type: "lowpass", from: 2600 },
      },
      {
        kind: "tone",
        wave: "square",
        from: A5,
        atMs: 180,
        durationMs: 90,
        level: 0.6,
        filter: { type: "lowpass", from: 2800 },
      },
      {
        kind: "tone",
        wave: "square",
        from: D6,
        atMs: 270,
        durationMs: 360,
        level: 0.6,
        filter: { type: "lowpass", from: 3000, to: 1400 },
      },
      { kind: "tone", wave: "triangle", from: D5 / 2, atMs: 270, durationMs: 360, level: 0.6 },
    ],
  },
  /** Switch click-clack (theme, music, sound). */
  toggle: {
    voices: [
      { kind: "tone", wave: "triangle", from: 520, durationMs: 32, level: 1 },
      { kind: "tone", wave: "triangle", from: 780, atMs: 45, durationMs: 40, level: 1 },
    ],
  },
  /** Background click: a small bell on the pentatonic scale (D5 at degree 0). */
  ping: {
    tuned: true,
    jitter: 0,
    voices: [
      { kind: "tone", wave: "sine", from: D5, durationMs: 700, level: 0.75, attackMs: 2 },
      { kind: "tone", wave: "sine", from: D5 * 2.76, durationMs: 180, level: 0.12, attackMs: 2 },
      { kind: "tone", wave: "sine", from: D5 * 2, durationMs: 400, level: 0.2, attackMs: 2 },
    ],
  },
  /** Incident: a gentle two-tone siren, twice. */
  alarm: {
    voices: [
      {
        kind: "tone",
        wave: "square",
        from: A5,
        atMs: 0,
        durationMs: 130,
        level: 0.55,
        filter: { type: "lowpass", from: 2000 },
      },
      {
        kind: "tone",
        wave: "square",
        from: 660,
        atMs: 150,
        durationMs: 130,
        level: 0.55,
        filter: { type: "lowpass", from: 2000 },
      },
      {
        kind: "tone",
        wave: "square",
        from: A5,
        atMs: 300,
        durationMs: 130,
        level: 0.55,
        filter: { type: "lowpass", from: 2000 },
      },
      {
        kind: "tone",
        wave: "square",
        from: 660,
        atMs: 450,
        durationMs: 160,
        level: 0.55,
        filter: { type: "lowpass", from: 2000 },
      },
    ],
  },
  /** Data promoted a layer up: an upward slide into a bright ding. */
  promote: {
    jitter: TUNED_JITTER,
    voices: [
      { kind: "tone", wave: "triangle", from: A5 / 2, to: D5, durationMs: 150, level: 0.9 },
      { kind: "tone", wave: "sine", from: C6, atMs: 120, durationMs: 160, level: 0.6 },
      { kind: "tone", wave: "sine", from: D6, atMs: 200, durationMs: 300, level: 0.8 },
    ],
  },
  /** Data sent to quarantine: a falling buzz and a lid slamming shut. */
  quarantine: {
    voices: [
      {
        kind: "tone",
        wave: "sawtooth",
        from: 300,
        to: 190,
        durationMs: 200,
        level: 0.7,
        filter: { type: "lowpass", from: 1400, to: 600 },
      },
      {
        kind: "tone",
        wave: "square",
        from: 147,
        atMs: 190,
        durationMs: 140,
        level: 0.5,
        filter: { type: "lowpass", from: 900 },
      },
      {
        kind: "noise",
        atMs: 190,
        durationMs: 60,
        level: 0.5,
        filter: { type: "lowpass", from: 1200 },
      },
    ],
  },
};
