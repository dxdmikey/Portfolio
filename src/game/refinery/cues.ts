import type { FxKind } from "@/types/events";
import type { Accent } from "@/types/content";
import type { SfxName } from "@/types/game";
import type { ShiftEffect } from "./shift";

/** Where an effect should pop: on the record / incident in play, or the middle of the game. */
export type CueAnchor = "focus" | "root";

export interface Cue {
  sfx?: { name: SfxName; pitch?: number };
  fx?: { kind: FxKind; accent: Accent; label?: string; at: CueAnchor };
}

/** Each multiplier step plays the streak sound a little higher. */
const STREAK_PITCH_STEP = 0.12;

const plus = (points: number) => `+${points}`;

type CueTable = { [K in ShiftEffect["kind"]]: (effect: Extract<ShiftEffect, { kind: K }>) => readonly Cue[] };

/** Sound and FX for every shift effect. Data, not a switch: add a kind, add a row. */
const CUES: CueTable = {
  "shift-start": () => [{ sfx: { name: "warp" } }],
  record: ({ verdict: v }) => {
    if (v.correct) {
      return [
        {
          sfx: { name: v.choice === "promote" ? "promote" : "quarantine" },
          fx: { kind: "xp", accent: v.choice === "promote" ? "xp" : "coin", label: plus(v.points), at: "focus" },
        },
      ];
    }
    if (v.breach) return [{ sfx: { name: "error" }, fx: { kind: "shake", accent: "warp", at: "focus" } }];
    return [{ sfx: { name: "short" } }];
  },
  "streak-up": ({ multiplier }) => [{ sfx: { name: "select", pitch: 1 + (multiplier - 1) * STREAK_PITCH_STEP } }],
  "level-clear": ({ bonus }) => [
    {
      sfx: { name: "power-up" },
      ...(bonus > 0 ? { fx: { kind: "xp", accent: "coin", label: plus(bonus), at: "root" } as const } : {}),
    },
  ],
  "incident-open": () => [{ sfx: { name: "alarm" } }],
  "incident-resolved": ({ answer, points }) =>
    answer.correct
      ? [{ sfx: { name: "select" }, fx: { kind: "xp", accent: "xp", label: plus(points), at: "focus" } }]
      : [{ sfx: { name: "error" } }],
  "shift-end": ({ result }) => {
    if (result.outcome === "win") return [{ sfx: { name: "success" }, fx: { kind: "confetti", accent: "coin", at: "root" } }];
    if (result.reason === "paged") return [{ sfx: { name: "alarm" }, fx: { kind: "shake", accent: "warp", at: "root" } }];
    return [{ sfx: { name: "short" } }];
  },
};

export function cuesFor(effect: ShiftEffect): readonly Cue[] {
  const handler = CUES[effect.kind] as (e: ShiftEffect) => readonly Cue[];
  return handler(effect);
}
