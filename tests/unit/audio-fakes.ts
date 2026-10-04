/** Minimal fake Web Audio for unit tests (no real sound, records what was scheduled). */
import { AudioEngine, type AudioEnvironment } from "@/game/audio/engine";

type Call = [method: string, ...args: number[]];

export class FakeParam {
  value = 0;
  readonly calls: Call[] = [];
  setValueAtTime(v: number, t: number) {
    this.value = v;
    this.calls.push(["setValueAtTime", v, t]);
    return this;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.calls.push(["linearRamp", v, t]);
    return this;
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.calls.push(["exponentialRamp", v, t]);
    return this;
  }
  setTargetAtTime(v: number, t: number, tc: number) {
    this.calls.push(["setTargetAtTime", v, t, tc]);
    return this;
  }
  cancelScheduledValues(t: number) {
    this.calls.push(["cancel", t]);
    return this;
  }
}

class FakeNode {
  readonly connections: unknown[] = [];
  connect<T>(target: T): T {
    this.connections.push(target);
    return target;
  }
  disconnect() {}
}

class FakeSource extends FakeNode {
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  readonly playbackRate = new FakeParam();
  type = "sine";
  buffer: unknown = null;
  loop = false;
  startedAt: number | null = null;
  start(t = 0) {
    this.startedAt = t;
  }
  stop() {}
}

class FakeBuffer {
  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {}
  private readonly data = new Map<number, Float32Array>();
  get duration() {
    return this.length / this.sampleRate;
  }
  getChannelData(ch: number) {
    if (!this.data.has(ch)) this.data.set(ch, new Float32Array(this.length));
    return this.data.get(ch) as Float32Array;
  }
}

export type ResumeBehaviour = "resolve" | "reject" | "hang";

export class FakeAudioContext extends EventTarget {
  state: string;
  currentTime = 0;
  /** Small rate keeps generated buffers (noise, reverb IR) cheap. */
  readonly sampleRate = 1000;
  readonly destination = new FakeNode();
  readonly sources: FakeSource[] = [];
  resumeCalls = 0;
  resumeBehaviour: ResumeBehaviour = "resolve";

  constructor(initialState = "suspended") {
    super();
    this.state = initialState;
  }

  setState(state: string) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }

  resume(): Promise<void> {
    this.resumeCalls++;
    if (this.resumeBehaviour === "reject") return Promise.reject(new Error("not allowed"));
    if (this.resumeBehaviour === "hang") return new Promise(() => undefined);
    // Like browsers, the state flips asynchronously.
    return Promise.resolve().then(() => this.setState("running"));
  }

  /** Oscillators + buffer sources started with a real (non-silent) schedule. */
  get oscillators() {
    return this.sources.filter((s) => s instanceof FakeOscillator);
  }

  private source<T extends FakeSource>(node: T): T {
    this.sources.push(node);
    return node;
  }
  createOscillator() {
    return this.source(new FakeOscillator());
  }
  createBufferSource() {
    return this.source(new FakeBufferSource());
  }
  createGain() {
    return Object.assign(new FakeNode(), { gain: Object.assign(new FakeParam(), { value: 1 }) });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), {
      type: "lowpass",
      frequency: new FakeParam(),
      Q: new FakeParam(),
    });
  }
  createDynamicsCompressor() {
    const p = () => new FakeParam();
    return Object.assign(new FakeNode(), {
      threshold: p(),
      knee: p(),
      ratio: p(),
      attack: p(),
      release: p(),
    });
  }
  createDelay() {
    return Object.assign(new FakeNode(), { delayTime: new FakeParam() });
  }
  createConvolver() {
    return Object.assign(new FakeNode(), { buffer: null as unknown });
  }
  createBuffer(channels: number, length: number, rate: number) {
    return new FakeBuffer(channels, length, rate);
  }
}

class FakeOscillator extends FakeSource {}
class FakeBufferSource extends FakeSource {}

export class FakeVisibility extends EventTarget {
  hidden = false;
  set(hidden: boolean) {
    this.hidden = hidden;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

export interface FakeAudioSetup {
  engine: AudioEngine;
  gestures: EventTarget;
  visibility: FakeVisibility;
  session: { type: string };
  /** The context once the engine created it. */
  ctx: () => FakeAudioContext | null;
  created: () => number;
}

/** An engine wired to fakes and installed. */
export function fakeAudio(
  options: { initialState?: string; resume?: ResumeBehaviour } = {},
): FakeAudioSetup {
  const gestures = new EventTarget();
  const visibility = new FakeVisibility();
  const session = { type: "auto" };
  let ctx: FakeAudioContext | null = null;
  let created = 0;
  const env: AudioEnvironment = {
    createContext: () => {
      created++;
      ctx = new FakeAudioContext(options.initialState ?? "suspended");
      if (options.resume) ctx.resumeBehaviour = options.resume;
      return ctx as unknown as AudioContext;
    },
    gestures,
    visibility,
    audioSession: session,
  };
  const engine = new AudioEngine(
    () => env,
    () => 0.5,
  );
  engine.install();
  return { engine, gestures, visibility, session, ctx: () => ctx, created: () => created };
}

/** Let pending promise callbacks run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export const gesture = (target: EventTarget, type = "pointerup") =>
  target.dispatchEvent(new Event(type));
