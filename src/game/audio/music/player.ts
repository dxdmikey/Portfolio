import type { ChapterId } from "@/content/story";
import type { AudioEngine } from "../engine";
import { MusicGraph } from "./graph";
import { CHAPTER_MIX, DEFAULT_CHAPTER, MIX_CROSSFADE_S } from "./mix";
import { LookaheadScheduler, browserTimer, type SchedulerTimer } from "./scheduler";
import { STEPS_PER_BAR, STEP_SECONDS, eventsAtStep, isBeat } from "./song";
import { LAYER_VOICES } from "./voices";

/** Background music is on by default (it still waits for the first gesture). */
export const MUSIC_DEFAULT = true;

/** Why the music is paused besides the toggles (e.g. quick view). */
export type MusicSuppression = "quick-view";

interface MusicPlayerOptions {
  timer?: SchedulerTimer;
  random?: () => number;
}

/**
 * Plays "Neon Drift" through the shared engine's music bus. It runs only while the music
 * preference AND the master sound are on, the audio context is running, the tab is
 * visible and nothing suppresses it; it fades out/in as those change. Chapter changes
 * crossfade the layer mix.
 */
export class MusicPlayer {
  private graph: MusicGraph | null = null;
  private scheduler: LookaheadScheduler | null = null;
  private chapter: ChapterId = DEFAULT_CHAPTER;
  private on = MUSIC_DEFAULT;
  private readonly suppressed = new Set<MusicSuppression>();
  private playing = false;
  private step = 0;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly engine: AudioEngine,
    private readonly options: MusicPlayerOptions = {},
  ) {
    this.unsubscribe = engine.subscribe(this.update);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentChapter(): ChapterId {
    return this.chapter;
  }

  setEnabled(on: boolean): void {
    this.on = on;
    this.update();
  }

  setSuppressed(reason: MusicSuppression, on: boolean): void {
    if (on) this.suppressed.add(reason);
    else this.suppressed.delete(reason);
    this.update();
  }

  setChapter(chapter: ChapterId): void {
    if (chapter === this.chapter) return;
    this.chapter = chapter;
    const ctx = this.engine.context;
    if (this.graph && ctx)
      this.graph.setMix(CHAPTER_MIX[chapter], ctx.currentTime, MIX_CROSSFADE_S);
  }

  dispose(): void {
    this.stop();
    this.unsubscribe();
  }

  private update = (): void => {
    const engine = this.engine;
    const should =
      this.on && engine.enabled && engine.running && !engine.hidden && this.suppressed.size === 0;
    if (should && !this.playing) this.start();
    else if (!should && this.playing) this.stop();
  };

  private start(): void {
    const ctx = this.engine.context;
    const out = this.engine.musicOutput;
    if (!ctx || !out) return;
    const firstTime = !this.graph;
    const graph = (this.graph ??= new MusicGraph(ctx, out, this.options.random ?? Math.random));
    // Jump straight to the chapter's mix on the first start; later starts keep any glide.
    if (firstTime) graph.setMix(CHAPTER_MIX[this.chapter], ctx.currentTime, 0);
    graph.fadeIn(ctx.currentTime);
    this.scheduler ??= new LookaheadScheduler(
      { now: () => ctx.currentTime },
      this.onStep,
      STEP_SECONDS,
      this.options.timer ?? browserTimer,
    );
    // Resume at the top of the bar we stopped in, so the pad chord sounds right away.
    this.scheduler.start(this.step - (this.step % STEPS_PER_BAR), this.engine.startTime);
    this.playing = true;
  }

  private stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.scheduler) {
      this.scheduler.stop();
      this.step = this.scheduler.position;
    }
    const ctx = this.engine.context;
    if (ctx) this.graph?.fadeOut(ctx.currentTime);
  }

  private onStep = (step: number, time: number): void => {
    const graph = this.graph;
    const ctx = this.engine.context;
    if (!graph || !ctx) return;
    if (isBeat(step)) graph.pumpAt(time);
    const noise = this.engine.noise();
    for (const event of eventsAtStep(step)) {
      if (!graph.audible(event.layer, time)) continue;
      LAYER_VOICES[event.layer]({
        ctx,
        out: graph.input(event.layer),
        notes: event.notes,
        time,
        duration: event.steps * STEP_SECONDS,
        velocity: event.velocity,
        noise,
      });
    }
  };
}
