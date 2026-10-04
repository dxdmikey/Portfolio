/**
 * Canvas renderer for click effects: particle bursts, confetti, smoke, pixel ripples and
 * floating "+XP" labels. Simulation lives in `game/fx`; this class only draws it.
 */
import {
  BURST,
  CONFETTI,
  ParticleSystem,
  SMOKE,
  SPARK,
  STARDUST,
  type BurstSpec,
} from "@/game/fx/particles";
import { StreakPool } from "@/game/fx/streaks";
import { TimedPool } from "@/game/fx/timed";
import { drawLabels, drawParticles, drawRipples, LABEL_PX } from "./fx-draw";
import { drawPings, drawStreaks } from "./fx-ping";

const MAX_PARTICLES = 600;
const MAX_TIMED = 24;
const RIPPLE_S = 0.55;
const LABEL_S = 1.1;
const PING_S = 0.5;
const MAX_STREAKS = 4;
/** Palette slot that resolves to the live scene glow (set per ping). */
export const SCENE_COLOR = 255;

export type FxPreset = "burst" | "spark" | "confetti" | "smoke";

const PRESETS: Record<FxPreset, BurstSpec> = {
  burst: BURST,
  spark: SPARK,
  confetti: CONFETTI,
  smoke: SMOKE,
};

export class FxRenderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly particles = new ParticleSystem(MAX_PARTICLES);
  private readonly ripples = new TimedPool(MAX_TIMED);
  private readonly labels = new TimedPool(MAX_TIMED);
  private readonly pings = new TimedPool(MAX_TIMED);
  private readonly streaks = new StreakPool(MAX_STREAKS);
  private sceneColor = "";
  private starIndex = 0;
  private palette: string[] = [];
  private shadow = "#000";
  private font = "monospace";
  private width = 0;
  private height = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly maxDpr: number,
    /** Reduced motion: labels hold still, nothing else spawns. */
    private still: boolean,
  ) {
    this.ctx = canvas.getContext("2d");
  }

  setStill(still: boolean): void {
    this.still = still;
    if (still) {
      this.particles.clear();
      this.streaks.clear();
    }
  }

  /** Colours indexed like `FX_COLORS` in the layer; `shadow` backs label text. */
  setPalette(palette: string[], shadow: string, fontFamily: string): void {
    this.palette = palette;
    this.shadow = shadow;
    this.font = `${LABEL_PX}px ${fontFamily || "monospace"}`;
  }

  resize(width: number, height: number, devicePixelRatio: number): void {
    const dpr = Math.min(devicePixelRatio || 1, this.maxDpr);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  burst(preset: FxPreset, x: number, y: number, color: number): void {
    if (this.still) return;
    this.particles.spawn(PRESETS[preset], x, y, preset === "confetti" ? 0 : color);
  }

  ripple(x: number, y: number, color: number): void {
    if (!this.still) this.ripples.add(x, y, RIPPLE_S, color);
  }

  /**
   * Background-click "star ping" in `color` (a CSS colour): ring + twinkle + stardust,
   * plus a shooting star when `shooting`. Reduced motion: the ring only, fading in place.
   */
  ping(x: number, y: number, color: string, shooting: boolean, starIndex: number): void {
    this.sceneColor = color;
    this.starIndex = starIndex;
    this.pings.add(x, y, PING_S, SCENE_COLOR);
    if (this.still) return;
    this.particles.spawn(STARDUST, x, y, SCENE_COLOR);
    if (shooting) this.streaks.launch(x, y, this.width);
  }

  label(x: number, y: number, color: number, text: string): void {
    this.labels.add(x, y, LABEL_S, color, text);
  }

  get busy(): boolean {
    return (
      this.particles.count +
        this.ripples.count +
        this.labels.count +
        this.pings.count +
        this.streaks.count >
      0
    );
  }

  /** Steps and draws one frame. Returns whether anything is still alive. */
  frame(dt: number): boolean {
    const { ctx } = this;
    if (!ctx) return false;
    this.particles.step(dt);
    this.ripples.step(dt);
    this.labels.step(dt);
    this.pings.step(dt);
    this.streaks.step(dt);
    ctx.clearRect(0, 0, this.width, this.height);
    drawStreaks(ctx, this.streaks, this.color(this.starIndex), this.sceneColor);
    drawParticles(ctx, this.particles, this.color);
    drawRipples(ctx, this.ripples, this.color);
    drawPings(ctx, this.pings, this.sceneColor, this.color(this.starIndex), this.still);
    drawLabels(ctx, this.labels, this.color, {
      font: this.font,
      shadow: this.shadow,
      still: this.still,
    });
    ctx.globalAlpha = 1;
    return this.busy;
  }

  private readonly color = (i: number): string => {
    if (i === SCENE_COLOR && this.sceneColor) return this.sceneColor;
    return this.palette[i] ?? this.palette[0] ?? "#fff";
  };
}
