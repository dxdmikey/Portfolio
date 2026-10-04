import { LAYERS, type Layer, BEAT_SECONDS } from "./song";
import type { LayerMix } from "./mix";

/**
 * The music's mixing desk (built once, on the first play):
 *
 *   layer gains ─ pad, bass ─ pump ─┐
 *               ─ arp, chimes, hats ┼─ fade ─ engine music bus
 *   sends: arp → dotted-eighth delay; pad/arp/chimes/delay → reverb (generated IR)
 */

/** Overall music loudness: background, well under the effects. */
export const MUSIC_LEVEL = 0.45;
const FADE_IN_S = 4;
const FADE_OUT_S = 0.9;
/** setTargetAtTime reaches ~95% after three time constants. */
const TIME_CONSTANTS = 3;

/** Dotted eighth = three sixteenths. */
const DELAY_BEATS = 0.75;
const DELAY = { feedback: 0.32, damp: 2600, wet: 0.3 } as const;
const REVERB = { seconds: 2.8, decayPower: 3, wet: 0.55, channels: 2 } as const;
const PUMP = { floor: 0.55, recoverBeats: 0.6 } as const;

const SENDS: Readonly<Partial<Record<Layer, { delay?: number; reverb?: number }>>> = {
  pad: { reverb: 0.35 },
  arp: { delay: 0.4, reverb: 0.25 },
  chimes: { reverb: 0.75 },
};
const PUMPED: readonly Layer[] = ["pad", "bass"];
const DELAY_TO_REVERB = 0.3;
/** Margin before a muted layer stops being scheduled. */
const SILENT_MARGIN_S = 0.5;

function reverbImpulse(ctx: BaseAudioContext, random: () => number): AudioBuffer {
  const length = Math.round(ctx.sampleRate * REVERB.seconds);
  const ir = ctx.createBuffer(REVERB.channels, length, ctx.sampleRate);
  for (let ch = 0; ch < REVERB.channels; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++)
      data[i] = (random() * 2 - 1) * (1 - i / length) ** REVERB.decayPower;
  }
  return ir;
}

function wet(ctx: BaseAudioContext, from: AudioNode, to: AudioNode, level: number): void {
  const send = ctx.createGain();
  send.gain.value = level;
  from.connect(send).connect(to);
}

export class MusicGraph {
  private readonly fade: GainNode;
  private readonly pump: GainNode;
  private readonly layers: Record<Layer, GainNode>;
  private readonly targets: Record<Layer, number>;
  private readonly silentAfter: Record<Layer, number>;

  constructor(
    private readonly ctx: BaseAudioContext,
    out: AudioNode,
    random: () => number,
  ) {
    this.fade = ctx.createGain();
    this.fade.gain.value = 0;
    this.fade.connect(out);
    this.pump = ctx.createGain();
    this.pump.connect(this.fade);

    const delay = ctx.createDelay();
    delay.delayTime.value = BEAT_SECONDS * DELAY_BEATS;
    const feedback = ctx.createGain();
    feedback.gain.value = DELAY.feedback;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = DELAY.damp;
    delay.connect(damp).connect(feedback).connect(delay);
    wet(ctx, damp, this.fade, DELAY.wet);

    const reverb = ctx.createConvolver();
    reverb.buffer = reverbImpulse(ctx, random);
    wet(ctx, reverb, this.fade, REVERB.wet);
    wet(ctx, damp, reverb, DELAY_TO_REVERB);

    const make = (layer: Layer): GainNode => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(PUMPED.includes(layer) ? this.pump : this.fade);
      const send = SENDS[layer];
      if (send?.delay) wet(ctx, gain, delay, send.delay);
      if (send?.reverb) wet(ctx, gain, reverb, send.reverb);
      return gain;
    };
    this.layers = Object.fromEntries(LAYERS.map((l) => [l, make(l)])) as Record<Layer, GainNode>;
    this.targets = Object.fromEntries(LAYERS.map((l) => [l, 0])) as Record<Layer, number>;
    this.silentAfter = Object.fromEntries(LAYERS.map((l) => [l, 0])) as Record<Layer, number>;
  }

  input(layer: Layer): AudioNode {
    return this.layers[layer];
  }

  /** Glide every layer to `mix` over `seconds` (0 = jump). */
  setMix(mix: LayerMix, time: number, seconds: number): void {
    for (const layer of LAYERS) {
      const param = this.layers[layer].gain;
      const target = mix[layer];
      param.cancelScheduledValues(time);
      if (seconds <= 0) param.setValueAtTime(target, time);
      else param.setTargetAtTime(target, time, seconds / TIME_CONSTANTS);
      if (target === 0 && this.targets[layer] > 0)
        this.silentAfter[layer] = time + seconds + SILENT_MARGIN_S;
      this.targets[layer] = target;
    }
  }

  /** Skip scheduling notes nobody can hear. */
  audible(layer: Layer, time: number): boolean {
    return this.targets[layer] > 0 || time < this.silentAfter[layer];
  }

  /** Sidechain-style duck on each beat, swelling back up. */
  pumpAt(time: number): void {
    this.pump.gain.setValueAtTime(PUMP.floor, time);
    this.pump.gain.linearRampToValueAtTime(1, time + BEAT_SECONDS * PUMP.recoverBeats);
  }

  fadeIn(time: number): void {
    this.fade.gain.cancelScheduledValues(time);
    this.fade.gain.setTargetAtTime(MUSIC_LEVEL, time, FADE_IN_S / TIME_CONSTANTS);
  }

  fadeOut(time: number): void {
    this.fade.gain.cancelScheduledValues(time);
    this.fade.gain.setTargetAtTime(0, time, FADE_OUT_S / TIME_CONSTANTS);
  }
}
