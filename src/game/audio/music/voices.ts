import { midiToHz } from "../key";
import type { Layer } from "./song";

/**
 * The thin Web Audio layer of the music: one function per instrument. Levels are small
 * on purpose; the music bus sits under the sound effects.
 */

export interface VoiceCall {
  ctx: BaseAudioContext;
  out: AudioNode;
  notes: readonly number[];
  time: number;
  /** Seconds the note is held before its release. */
  duration: number;
  velocity: number;
  noise: AudioBuffer | null;
}

const SILENCE = 0.0001;

/** Detuned-saw pad through a slowly opening low-pass: the bed under everything. */
const PAD = {
  level: 0.014,
  detuneCents: 9,
  attack: 0.6,
  release: 1.4,
  cutoffFrom: 700,
  cutoffTo: 1700,
  q: 0.8,
} as const;

function pad({ ctx, out, notes, time, duration }: VoiceCall): void {
  const end = time + duration;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = PAD.q;
  filter.frequency.setValueAtTime(PAD.cutoffFrom, time);
  filter.frequency.linearRampToValueAtTime(PAD.cutoffTo, end);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(PAD.level, time + PAD.attack);
  gain.gain.setValueAtTime(PAD.level, end);
  gain.gain.linearRampToValueAtTime(0, end + PAD.release);
  filter.connect(gain).connect(out);
  for (const midi of notes) {
    for (const cents of [-PAD.detuneCents, PAD.detuneCents]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midiToHz(midi);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(time);
      osc.stop(end + PAD.release);
    }
  }
}

/** Glossy pluck: saw + square through a resonant filter that snaps shut. */
const PLUCK = {
  level: 0.03,
  squareLevel: 0.5,
  cutoffFrom: 4200,
  cutoffTo: 650,
  filterTime: 0.2,
  q: 5,
  decay: 0.34,
} as const;

function pluck({ ctx, out, notes, time, velocity }: VoiceCall): void {
  const end = time + PLUCK.decay;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = PLUCK.q;
  filter.frequency.setValueAtTime(PLUCK.cutoffFrom, time);
  filter.frequency.exponentialRampToValueAtTime(PLUCK.cutoffTo, time + PLUCK.filterTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(PLUCK.level * velocity, time);
  gain.gain.exponentialRampToValueAtTime(SILENCE, end);
  filter.connect(gain).connect(out);
  for (const midi of notes) {
    const hz = midiToHz(midi);
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = hz;
    saw.connect(filter);
    const square = ctx.createOscillator();
    const squareGain = ctx.createGain();
    square.type = "square";
    square.frequency.value = hz * 2;
    squareGain.gain.value = PLUCK.squareLevel;
    square.connect(squareGain).connect(filter);
    for (const osc of [saw, square]) {
      osc.start(time);
      osc.stop(end);
    }
  }
}

/** Sine sub with a quiet triangle an octave up so phone speakers still hear the line. */
const BASS = { level: 0.09, overtoneLevel: 0.012, attack: 0.012, release: 0.08 } as const;

function bass({ ctx, out, notes, time, duration, velocity }: VoiceCall): void {
  const end = time + duration;
  for (const midi of notes) {
    const hz = midiToHz(midi);
    const voices: [OscillatorType, number, number][] = [
      ["sine", hz, BASS.level],
      ["triangle", hz * 2, BASS.overtoneLevel],
    ];
    for (const [wave, freq, level] of voices) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(level * velocity, time + BASS.attack);
      gain.gain.setValueAtTime(level * velocity, end);
      gain.gain.linearRampToValueAtTime(0, end + BASS.release);
      osc.connect(gain).connect(out);
      osc.start(time);
      osc.stop(end + BASS.release);
    }
  }
}

/** Airy FM bell: a sine modulated at 3.5× with a fast-falling index for a glassy shimmer. */
const BELL = {
  level: 0.04,
  ratio: 3.5,
  indexFrom: 1.6,
  indexTo: 0.15,
  indexTime: 0.5,
  decay: 2.4,
} as const;

function bell({ ctx, out, notes, time, velocity }: VoiceCall): void {
  const end = time + BELL.decay;
  for (const midi of notes) {
    const hz = midiToHz(midi);
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const depth = ctx.createGain();
    const gain = ctx.createGain();
    carrier.type = "sine";
    carrier.frequency.value = hz;
    modulator.type = "sine";
    modulator.frequency.value = hz * BELL.ratio;
    depth.gain.setValueAtTime(hz * BELL.indexFrom, time);
    depth.gain.exponentialRampToValueAtTime(hz * BELL.indexTo, time + BELL.indexTime);
    modulator.connect(depth).connect(carrier.frequency);
    gain.gain.setValueAtTime(BELL.level * velocity, time);
    gain.gain.exponentialRampToValueAtTime(SILENCE, end);
    carrier.connect(gain).connect(out);
    for (const osc of [carrier, modulator]) {
      osc.start(time);
      osc.stop(end);
    }
  }
}

/** Soft closed hat: high-passed noise, very short. */
const HAT = { level: 0.018, cutoff: 7500, decay: 0.05 } as const;

function hat({ ctx, out, time, velocity, noise }: VoiceCall): void {
  if (!noise) return;
  const end = time + HAT.decay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = HAT.cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(HAT.level * velocity, time);
  gain.gain.exponentialRampToValueAtTime(SILENCE, end);
  src.connect(filter).connect(gain).connect(out);
  // Different slice of the noise each hit.
  src.start(time, (time * HAT.cutoff) % Math.max(noise.duration - HAT.decay, HAT.decay));
  src.stop(end);
}

/** Instrument per layer (a registry, not a switch). */
export const LAYER_VOICES: Readonly<Record<Layer, (call: VoiceCall) => void>> = {
  pad,
  arp: pluck,
  bass,
  chimes: bell,
  hats: hat,
};
