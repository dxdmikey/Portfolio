import type { StationLights } from "@/game/scene/station-lights";
import type { SceneKeyframe, SceneLayers } from "@/types/story";
import { AsteroidLayer } from "./asteroids";
import { AuroraLayer } from "./aurora";
import { CloudLayer } from "./clouds";
import { NebulaLayer } from "./nebula";
import { PlanetLayer } from "./planet";
import { MoonbaseLayer } from "./moonbase";
import { PlanetsLayer } from "./planets";
import { ShootingStar, StarLayer } from "./stars";
import { SkyGradient } from "./sky-gradient";
import { StationLayer } from "./station";
import { StationPeek } from "./station-peek";
import type { SkyFrame, SkyLayer } from "./sky-types";

/** CSS px per sky pixel: chunkier on big screens, finer on phones. */
const SCALE_WIDE = 3;
const SCALE_NARROW = 2;
const NARROW_MAX = 768;
const SHOOTING_MIN_STARS = 0.2;
const STAR_COLOR = { dark: "#ffffff", light: "#6d6ab8" } as const;
/** Below this opacity a layer is skipped entirely (and never built). */
const VISIBLE_ALPHA = 0.05;

/** Draw order, back to front. Keys match `SceneLayers`. */
type PropKey = Exclude<keyof SceneLayers, "stars">;
const ORDER: readonly PropKey[] = [
  "aurora",
  "nebula",
  "planets",
  "station",
  "planet",
  "asteroids",
  "clouds",
  "moonbase",
];

/**
 * The scroll-driven sky: stepped gradient, stars and procedural pixel-art props,
 * each faded by the blended scene's layer opacity. Drawn at low resolution; the
 * canvas element is upscaled by CSS with `image-rendering: pixelated`.
 */
export class SkyRenderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly stars = new StarLayer();
  private readonly shooting = new ShootingStar();
  private readonly props: Record<PropKey, SkyLayer>;
  private readonly gradient = new SkyGradient();
  private readonly frame: SkyFrame = {
    w: 0,
    h: 0,
    time: 0,
    scroll: 0,
    glow: "#ffffff",
    now: 0,
    unit: SCALE_WIDE,
  };
  private scene: SceneKeyframe | null = null;
  private scale = SCALE_WIDE;
  private light = false;
  /**
   * Building a layer's pixel art is the expensive part, so it happens lazily the first
   * time the layer becomes visible (most visitors never reach every scene at once).
   */
  private readonly needsSize = new Set<PropKey>();
  private readonly needsTheme = new Set<PropKey>();
  private readonly peek: StationPeek | null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly lights: StationLights,
    /** Phones: where the sync's station visit is drawn (see `StationPeek`). */
    peekCanvas?: HTMLCanvasElement | null,
  ) {
    this.ctx = canvas.getContext("2d");
    const station = new StationLayer(lights);
    this.peek = peekCanvas ? new StationPeek(peekCanvas, station) : null;
    this.props = {
      moonbase: new MoonbaseLayer(),
      planets: new PlanetsLayer(),
      clouds: new CloudLayer(),
      planet: new PlanetLayer(),
      nebula: new NebulaLayer(),
      station,
      asteroids: new AsteroidLayer(),
      aurora: new AuroraLayer(),
    };
  }

  resize(cssWidth: number, cssHeight: number): void {
    this.scale = cssWidth < NARROW_MAX ? SCALE_NARROW : SCALE_WIDE;
    const w = Math.ceil(cssWidth / this.scale);
    const h = Math.ceil(cssHeight / this.scale);
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    this.frame.w = w;
    this.frame.h = h;
    this.frame.unit = this.scale;
    this.stars.resize(w, h);
    ORDER.forEach((k) => this.needsSize.add(k));
  }

  setTheme(light: boolean): void {
    this.light = light;
    this.stars.color = light ? STAR_COLOR.light : STAR_COLOR.dark;
    ORDER.forEach((k) => this.needsTheme.add(k));
  }

  setScene(scene: SceneKeyframe): void {
    this.scene = scene;
    this.frame.glow = scene.glow;
    this.gradient.update(scene, this.light);
  }

  /** `time`/`dt` in seconds (dt 0 = static frame), `scrollY` in CSS px, `now` wall-clock seconds. */
  render(time: number, dt: number, scrollY: number, now: number): void {
    const { ctx, scene, frame: f } = this;
    if (!ctx || !scene || f.w === 0) return;
    f.time = time;
    f.now = now;
    f.scroll = scrollY / this.scale;
    this.gradient.draw(ctx, f.w, f.h);
    const starAlpha = scene.layers.stars;
    this.stars.draw(ctx, f, starAlpha);
    if (dt > 0)
      this.shooting.draw(ctx, f, dt, starAlpha >= SHOOTING_MIN_STARS ? 1 : 0, this.stars.color);
    // "Run first sync" calls the station into view even where the scene has moved on: in the
    // sky on wide screens (beside the panels), on the peek canvas on phones (above them).
    const presence = this.lights.presence(now);
    const peeking = this.peek !== null && this.scale === SCALE_NARROW;
    for (const key of ORDER) {
      const alpha =
        key === "station" && !peeking
          ? Math.max(scene.layers.station, presence)
          : scene.layers[key];
      if (alpha < VISIBLE_ALPHA) continue;
      this.prepare(key);
      this.props[key].draw(ctx, f, alpha);
    }
    if (this.peek) {
      if (peeking && presence > 0) this.prepare("station");
      this.peek.draw(f, peeking ? presence : 0);
    }
  }

  private prepare(key: PropKey): void {
    const layer = this.props[key];
    if (this.needsTheme.delete(key)) layer.setTheme(this.light);
    if (this.needsSize.delete(key)) layer.resize(this.frame.w, this.frame.h);
  }
}
