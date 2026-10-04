/** Every synthesised sound effect. Patches live in `game/audio/patches.ts` (one entry per name). */
export type SfxName =
  | "blip"
  | "select"
  | "error"
  | "warp"
  | "flip"
  | "discover"
  | "power-up"
  | "short"
  | "crack"
  | "whoosh"
  | "type"
  | "success"
  | "toggle"
  | "ping"
  | "alarm"
  | "promote"
  | "quarantine";

export interface SfxOptions {
  /** Pentatonic scale degree (0 = the music's root). Only tuned patches such as `ping` use it. */
  degree?: number;
  /** Extra pitch multiplier (1 = unchanged). */
  pitch?: number;
  /** Loudness multiplier (1 = the patch's level; clamped to 0..1.5). */
  volume?: number;
}
