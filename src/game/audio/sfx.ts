import type { SfxName, SfxOptions } from "@/types/game";
import type { AudioEngine } from "./engine";
import { pentatonicRatio } from "./key";
import { SFX_PATCHES } from "./patches";
import { DEFAULT_JITTER, renderPatch, type SfxPatch } from "./synth";

/** Anything that can play a named sound effect. Swap in `silentSfx` for tests. */
export interface SfxPlayer {
  play(name: SfxName, options?: SfxOptions): void;
  setEnabled(enabled: boolean): void;
  readonly enabled: boolean;
  /** Milliseconds since `name` was last requested (Infinity if never). */
  msSince(name: SfxName): number;
}

const MS = 1000;

/** Pitch multiplier for one play: tuned degree × caller pitch × random jitter. */
export function playRatio(
  patch: SfxPatch,
  options: SfxOptions | undefined,
  random: () => number,
): number {
  const jitter = patch.jitter ?? DEFAULT_JITTER;
  const degree = patch.tuned && options?.degree !== undefined ? pentatonicRatio(options.degree) : 1;
  return degree * (options?.pitch ?? 1) * (1 + (random() * 2 - 1) * jitter);
}

/** Synthesised effects (no audio files) through the shared engine's sfx bus. */
export class WebAudioSfx implements SfxPlayer {
  private readonly lastPlayed = new Map<SfxName, number>();
  private readonly requested = new Map<SfxName, number>();

  constructor(
    private readonly engine: AudioEngine,
    private readonly patches: Record<SfxName, SfxPatch> = SFX_PATCHES,
    private readonly random: () => number = Math.random,
    private readonly now: () => number = Date.now,
  ) {}

  msSince(name: SfxName): number {
    const at = this.requested.get(name);
    return at === undefined ? Infinity : this.now() - at;
  }

  get enabled(): boolean {
    return this.engine.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.engine.setEnabled(enabled);
  }

  /** Silent no-op while muted, hidden or before audio is unlocked. */
  play(name: SfxName, options?: SfxOptions): void {
    this.requested.set(name, this.now());
    if (!this.engine.enabled || this.engine.hidden) return;
    const patch = this.patches[name];
    this.engine.whenRunning((ctx) => {
      const out = this.engine.sfxOutput;
      if (!out || this.throttled(name, patch, ctx.currentTime)) return;
      const ratio = playRatio(patch, options, this.random);
      renderPatch(
        { ctx, out, noise: this.engine.noise() },
        patch,
        this.engine.startTime,
        ratio,
        this.random,
        options?.volume,
      );
    });
  }

  private throttled(name: SfxName, patch: SfxPatch, now: number): boolean {
    if (!patch.throttleMs) return false;
    const last = this.lastPlayed.get(name);
    if (last !== undefined && (now - last) * MS < patch.throttleMs) return true;
    this.lastPlayed.set(name, now);
    return false;
  }
}

export const silentSfx: SfxPlayer = {
  play: () => undefined,
  setEnabled: () => undefined,
  enabled: false,
  msSince: () => Infinity,
};
