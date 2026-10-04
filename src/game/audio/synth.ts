/**
 * A tiny data-driven synth: a patch is a list of voices (oscillator or noise), each with
 * an optional pitch slide and biquad filter sweep. `renderPatch` turns one into nodes.
 */

export interface FilterSweep {
  type: BiquadFilterType;
  /** Cutoff in Hz at the start → end of the voice. */
  from: number;
  to?: number;
  q?: number;
}

interface VoiceBase {
  /** Delay from the start of the effect. */
  atMs?: number;
  durationMs: number;
  /** Relative loudness (1 = the standard sfx voice level). */
  level?: number;
  attackMs?: number;
  filter?: FilterSweep;
}

export interface ToneVoice extends VoiceBase {
  kind: "tone";
  wave: OscillatorType;
  /** Hz at the start → end (an exponential slide = pitch envelope). */
  from: number;
  to?: number;
  /** Cents, for a thicker detuned double. */
  detune?: number;
}

export interface NoiseVoice extends VoiceBase {
  kind: "noise";
  /** Playback rate of the noise buffer (lower = darker). */
  rate?: number;
}

export type Voice = ToneVoice | NoiseVoice;

export interface SfxPatch {
  voices: readonly Voice[];
  /** Whole-patch loudness multiplier. */
  gain?: number;
  /** Max random pitch deviation per play (0.04 = ±4%). */
  jitter?: number;
  /** Ignore repeat plays closer than this (typing ticks). */
  throttleMs?: number;
  /** Pitched to the music's key: `degree` options shift it along the pentatonic scale. */
  tuned?: boolean;
}

/** Loudness of one voice at level 1. Kept low: these sit on top of quiet music. */
export const SFX_VOICE_LEVEL = 0.06;
export const DEFAULT_JITTER = 0.04;
const DEFAULT_ATTACK_MS = 3;
const SILENCE = 0.0001;
const MS = 1000;
const MIN_HZ = 1;

function sweep(
  param: AudioParam,
  from: number,
  to: number | undefined,
  t0: number,
  t1: number,
): void {
  param.setValueAtTime(Math.max(from, MIN_HZ), t0);
  if (to !== undefined && to !== from) param.exponentialRampToValueAtTime(Math.max(to, MIN_HZ), t1);
}

function chain(
  ctx: BaseAudioContext,
  source: AudioNode,
  voice: Voice,
  ratio: number,
  t0: number,
  t1: number,
): AudioNode {
  if (!voice.filter) return source;
  const { type, from, to, q } = voice.filter;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  if (q !== undefined) filter.Q.value = q;
  sweep(filter.frequency, from * ratio, to === undefined ? undefined : to * ratio, t0, t1);
  source.connect(filter);
  return filter;
}

function envelope(
  ctx: BaseAudioContext,
  peak: number,
  attackMs: number,
  t0: number,
  t1: number,
): GainNode {
  const gain = ctx.createGain();
  const attackEnd = Math.min(t0 + attackMs / MS, t1);
  gain.gain.setValueAtTime(SILENCE, t0);
  gain.gain.linearRampToValueAtTime(peak, attackEnd);
  gain.gain.exponentialRampToValueAtTime(SILENCE, t1);
  return gain;
}

interface RenderTarget {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: AudioBuffer | null;
}

/** Loudness multiplier a caller may ask for, clamped so nothing gets harsh. */
export const MAX_VOLUME = 1.5;

/** Schedule every voice of `patch` at time `start`, pitched by `ratio`, scaled by `volume`. */
export function renderPatch(
  { ctx, out, noise }: RenderTarget,
  patch: SfxPatch,
  start: number,
  ratio: number,
  random: () => number,
  volume = 1,
): void {
  const patchGain = (patch.gain ?? 1) * Math.min(Math.max(volume, 0), MAX_VOLUME);
  for (const voice of patch.voices) {
    const t0 = start + (voice.atMs ?? 0) / MS;
    const t1 = t0 + voice.durationMs / MS;
    const peak = SFX_VOICE_LEVEL * patchGain * (voice.level ?? 1);
    let source: AudioScheduledSourceNode;
    let begin: () => void;
    if (voice.kind === "tone") {
      const osc = ctx.createOscillator();
      osc.type = voice.wave;
      if (voice.detune) osc.detune.value = voice.detune;
      sweep(
        osc.frequency,
        voice.from * ratio,
        voice.to === undefined ? undefined : voice.to * ratio,
        t0,
        t1,
      );
      source = osc;
      begin = () => osc.start(t0);
    } else {
      if (!noise) continue;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      src.playbackRate.value = (voice.rate ?? 1) * ratio;
      // Start somewhere random in the buffer so repeated noise hits differ.
      const offset = random() * noise.duration;
      begin = () => src.start(t0, offset);
      source = src;
    }
    const gain = envelope(ctx, peak, voice.attackMs ?? DEFAULT_ATTACK_MS, t0, t1);
    chain(ctx, source, voice, ratio, t0, t1).connect(gain);
    gain.connect(out);
    begin();
    source.stop(t1);
  }
}
