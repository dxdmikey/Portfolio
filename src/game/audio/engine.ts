/**
 * The one shared AudioContext for the whole site (sound effects + music).
 *
 * Browsers only let audio start inside a user activation (click, keydown, pointerup,
 * touchend — NOT touch pointerdown). So the engine never creates or resumes the context
 * from a timer or observer: it listens for gestures (capture phase, passive) and creates /
 * resumes there, and keeps retrying on every gesture while the context isn't `running`
 * (Safari can drop to `suspended` or `interrupted` at any time, e.g. a phone call or a
 * locked screen). While the context isn't running, nothing is scheduled.
 *
 * Graph: sfx bus ─┐
 *                 ├─ master (mute) ─ limiter ─ destination
 *      music bus ─┘
 */

type ListenerTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

interface VisibilitySource extends ListenerTarget {
  readonly hidden: boolean;
}

/** `navigator.audioSession` (Safari 16.4+). "playback" ignores the iOS silent switch. */
interface AudioSessionLike {
  type: string;
}

/** Everything browser-specific the engine touches, injectable for tests. */
export interface AudioEnvironment {
  createContext(): AudioContext | null;
  gestures: ListenerTarget;
  visibility: VisibilitySource;
  audioSession: AudioSessionLike | null;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
type SessionNavigator = Navigator & { audioSession?: AudioSessionLike };

/** The real browser environment, or null during SSR / without Web Audio. */
export function browserAudioEnvironment(): AudioEnvironment | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  return {
    createContext: () => new Ctor(),
    gestures: window,
    visibility: document,
    audioSession: (navigator as SessionNavigator).audioSession ?? null,
  };
}

/** Events that count as user activation. */
const GESTURES = ["pointerup", "click", "keydown", "touchend"] as const;
const GESTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

/** Schedule this far after `currentTime` so the first note's attack is never clipped. */
export const SCHEDULE_OFFSET_S = 0.01;
/** Mute/unmute glide (time constant of setTargetAtTime). */
const MUTE_TIME_CONSTANT_S = 0.03;
/** Plays that may wait for an in-flight resume (the click that unlocks audio also plays a sound). */
const MAX_DEFERRED_PLAYS = 4;
const NOISE_SECONDS = 1;

const LIMITER = { threshold: -6, knee: 6, ratio: 8, attack: 0.003, release: 0.25 } as const;

export class AudioEngine {
  private env: AudioEnvironment | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private on = true;
  private pending: Promise<boolean> | null = null;
  private deferred = 0;
  private teardown: (() => void) | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly environment: () => AudioEnvironment | null = browserAudioEnvironment,
    private readonly random: () => number = Math.random,
  ) {}

  /** Attach the gesture + visibility listeners. Call from an effect; returns the cleanup. */
  install(): () => void {
    if (this.teardown) return this.teardown;
    const env = this.environment();
    if (!env) return () => undefined;
    this.env = env;
    GESTURES.forEach((type) =>
      env.gestures.addEventListener(type, this.onGesture, GESTURE_OPTIONS),
    );
    env.visibility.addEventListener("visibilitychange", this.onVisibility);
    const teardown = () => {
      GESTURES.forEach((type) =>
        env.gestures.removeEventListener(type, this.onGesture, GESTURE_OPTIONS),
      );
      env.visibility.removeEventListener("visibilitychange", this.onVisibility);
      if (this.teardown === teardown) this.teardown = null;
    };
    this.teardown = teardown;
    return teardown;
  }

  /** Master switch: silences sfx and music alike. */
  get enabled(): boolean {
    return this.on;
  }

  setEnabled(on: boolean): void {
    if (on === this.on) return;
    this.on = on;
    this.applyMasterLevel();
    // Usually called from the sound toggle's click, which is itself a user activation.
    if (on && this.env) void this.unlock();
    this.notify();
  }

  get running(): boolean {
    return this.ctx?.state === "running";
  }

  get hidden(): boolean {
    return this.env?.visibility.hidden ?? false;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get sfxOutput(): AudioNode | null {
    return this.sfxBus;
  }

  get musicOutput(): AudioNode | null {
    return this.musicBus;
  }

  /** The earliest safe time to schedule a note. */
  get startTime(): number {
    return (this.ctx?.currentTime ?? 0) + SCHEDULE_OFFSET_S;
  }

  /** One second of shared white noise (hats, whooshes, crackles). */
  noise(): AudioBuffer | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (!this.noiseBuffer) {
      const buffer = ctx.createBuffer(
        1,
        Math.round(ctx.sampleRate * NOISE_SECONDS),
        ctx.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = this.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  /**
   * Create (first time) and resume the context. Must run inside a user gesture; the
   * gesture listeners call it for you. Resolves true once audio is running.
   */
  unlock(): Promise<boolean> {
    if (!this.on) return Promise.resolve(false);
    const ctx = this.ensureContext();
    if (!ctx) return Promise.resolve(false);
    if (this.running) return Promise.resolve(true);
    return this.resume(ctx);
  }

  /**
   * Run `fn` now if audio is running, or right after an in-flight resume succeeds
   * (so the very click that unlocks audio still makes its sound). Otherwise drop it.
   */
  whenRunning(fn: (ctx: AudioContext) => void): void {
    const ctx = this.ctx;
    if (!ctx || !this.on) return;
    if (this.running) {
      fn(ctx);
      return;
    }
    const pending = this.pending;
    if (!pending || this.deferred >= MAX_DEFERRED_PLAYS) return;
    this.deferred++;
    void pending.then((ok) => {
      this.deferred = Math.max(0, this.deferred - 1);
      if (ok && this.on && this.running) fn(ctx);
    });
  }

  /** Notified on context state, visibility and master on/off changes. */
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private onGesture = (): void => {
    if (this.on && !this.running) void this.unlock();
  };

  private onVisibility = (): void => {
    this.retry();
    this.notify();
  };

  private onStateChange = (): void => {
    this.retry();
    this.notify();
  };

  /** Best-effort resume outside a gesture (works once the page has been activated). */
  private retry(): void {
    const ctx = this.ctx;
    if (!ctx || !this.on || this.hidden || this.running || this.pending) return;
    const state: string = ctx.state;
    if (state === "closed") return;
    void this.resume(ctx);
  }

  private resume(ctx: AudioContext): Promise<boolean> {
    let attempt: Promise<boolean>;
    try {
      attempt = ctx.resume().then(
        () => this.running,
        () => false,
      );
    } catch {
      attempt = Promise.resolve(false);
    }
    this.pending = attempt;
    this.deferred = 0;
    void attempt.then(() => {
      if (this.pending === attempt) this.pending = null;
      this.notify();
    });
    return attempt;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const env = this.env;
    if (!env) return null;
    if (env.audioSession) {
      try {
        env.audioSession.type = "playback";
      } catch {
        /* read-only in some builds — harmless */
      }
    }
    let ctx: AudioContext | null;
    try {
      ctx = env.createContext();
    } catch {
      return null;
    }
    if (!ctx) return null;
    this.ctx = ctx;
    this.buildGraph(ctx);
    ctx.addEventListener("statechange", this.onStateChange);
    this.primeIos(ctx);
    return ctx;
  }

  private buildGraph(ctx: AudioContext): void {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = LIMITER.threshold;
    limiter.knee.value = LIMITER.knee;
    limiter.ratio.value = LIMITER.ratio;
    limiter.attack.value = LIMITER.attack;
    limiter.release.value = LIMITER.release;
    limiter.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.on ? 1 : 0;
    this.master.connect(limiter);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
  }

  /** Older iOS only unlocks after a buffer actually plays inside the gesture. */
  private primeIos(ctx: AudioContext): void {
    try {
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      /* not needed elsewhere */
    }
  }

  private applyMasterLevel(): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(this.on ? 1 : 0, ctx.currentTime, MUTE_TIME_CONSTANT_S);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
