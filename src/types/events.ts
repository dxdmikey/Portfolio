import type { ChapterId } from "@/content/story";
import type { DiscoveryId } from "@/content/discoveries";
import type { Accent } from "./content";

/** Visual effects the FX layer knows how to play at a screen point. */
export type FxKind = "burst" | "confetti" | "ripple" | "shake" | "smoke" | "xp";

export type GameEvent =
  | { type: "chapter:enter"; chapter: ChapterId }
  | { type: "discover"; id: DiscoveryId; first: boolean }
  | { type: "fx"; kind: FxKind; x: number; y: number; accent: Accent; label?: string }
  | { type: "game:result"; game: "refinery" | "station"; outcome: "win" | "lose" }
  /** Ask NOVA to say something specific (goes through the director at "direct", the highest priority). */
  | { type: "nova:say"; text: string }
  /** CH4 station: modules online changed (power-up, reset, or restored on load). The sky lights up to match. */
  | { type: "station:power"; online: number; total: number }
  /** CH4 station: the "Run first sync" demo batch reached the end of the pipeline. */
  | { type: "station:sync" };
