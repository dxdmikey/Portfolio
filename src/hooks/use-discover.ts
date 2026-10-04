"use client";

import { useCallback, useSyncExternalStore, type MouseEvent } from "react";
import { useGame } from "@/providers/game-provider";
import type { DiscoveryId } from "@/content/discoveries";
import type { Accent } from "@/types/content";
import type { FxKind } from "@/types/events";
import type { SfxName, SfxOptions } from "@/types/game";
import { DISCOVERY_XP } from "@/lib/constants";

const EMPTY: ReadonlySet<string> = new Set();

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Where a discovery's effects spawn: a click event (its pointer, or the element's centre for
 * keyboard clicks, which report 0,0), an element (its centre: e.g. a reward that lands after
 * a delay), or a screen point as is.
 */
export type DiscoverSource = MouseEvent<HTMLElement> | HTMLElement | ScreenPoint;

function centreOf(el: Element): ScreenPoint {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function pointOf(source?: DiscoverSource): ScreenPoint {
  if (!source) return { x: 0, y: 0 };
  if (source instanceof Element) return centreOf(source);
  if ("currentTarget" in source) {
    const { clientX, clientY, currentTarget } = source;
    if (clientX !== 0 || clientY !== 0) return { x: clientX, y: clientY };
    return currentTarget ? centreOf(currentTarget) : { x: 0, y: 0 };
  }
  return { x: source.x, y: source.y };
}
const XP_LABEL = `+${DISCOVERY_XP} XP`;
/** Under an action's own sound (a crack, a flip) the find chime stays a quiet reward. */
const CHIME_UNDER_ACTION = 0.45;

interface DiscoverOptions {
  accent?: Accent;
  /** Main effect at the click point. Defaults to a pixel burst. */
  fx?: FxKind;
  /**
   * The action's own sound, played on every click (e.g. "crack", "flip"). Without it a
   * first find chimes ("discover") and repeats get a soft "blip".
   */
  sound?: SfxName;
  soundOptions?: SfxOptions;
}

/**
 * Turns any click into a discovery: records it (first time only), plays an effect at
 * the pointer, pops "+XP" the first time, and announces it on the bus for NOVA.
 * Returns the handler plus whether this thing was already found.
 */
export function useDiscover(
  id: DiscoveryId,
  { accent = "plasma", fx = "burst", sound, soundOptions }: DiscoverOptions = {},
) {
  const { discoveries, bus, sfx } = useGame();
  const found = useSyncExternalStore(discoveries.subscribe, discoveries.getSnapshot, () => EMPTY);

  const trigger = useCallback(
    (source?: DiscoverSource) => {
      const { x, y } = pointOf(source);
      const first = discoveries.discover(id);
      bus.emit({ type: "fx", kind: fx, x, y, accent });
      if (first) {
        bus.emit({ type: "fx", kind: "xp", x, y, accent: "xp", label: XP_LABEL });
      }
      if (sound) {
        sfx.play(sound, soundOptions);
        if (first) sfx.play("discover", { volume: CHIME_UNDER_ACTION });
      } else {
        sfx.play(first ? "discover" : "blip");
      }
      bus.emit({ type: "discover", id, first });
    },
    [discoveries, bus, sfx, id, accent, fx, sound, soundOptions],
  );

  return { trigger, found: found.has(id) };
}

/** Reactive discovery count for the HUD. */
export function useDiscoveryCount() {
  const { discoveries } = useGame();
  const found = useSyncExternalStore(discoveries.subscribe, discoveries.getSnapshot, () => EMPTY);
  return { found: found.size, total: discoveries.total };
}
