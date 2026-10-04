"use client";

import { useCallback, useState } from "react";
import { useSfx } from "@/hooks/use-sfx";
import { headingDeg, turnTowards, type Point } from "@/game/galaxy/chart";
import { SHIP_HOME, type ChartPlanetSpec } from "./chart-layout";

/** The ship parks this far above a planet so it never covers the planet or its label. */
const DOCK_OFFSET_Y = 0.11;
const DOCK_MIN_Y = 0.04;

interface ShipState {
  at: Point;
  rotate: number;
  dockedAt: string | null;
  /** Planet whose action runs when the current flight lands. */
  target: ChartPlanetSpec | null;
}

/** The ship's thrusters: the charge-up sound, kept soft. */
const SHIP_THRUST_VOLUME = 0.5;

const dockFor = (p: ChartPlanetSpec): Point => ({
  x: p.at.x,
  y: Math.max(DOCK_MIN_Y, p.at.y - DOCK_OFFSET_Y),
});

/**
 * Ship flight on the star chart. Selecting a planet flies there first (skipped under reduced
 * motion or when already docked), then calls `onLand` with that planet.
 */
export function useStarChart(reducedMotion: boolean, onLand: (planet: ChartPlanetSpec) => void) {
  const { play } = useSfx();
  const [ship, setShip] = useState<ShipState>({
    at: SHIP_HOME,
    rotate: 0,
    dockedAt: null,
    target: null,
  });

  const fly = useCallback(
    (planet: ChartPlanetSpec, aspect: number) => {
      const key = `${planet.kind}:${planet.id}`;
      const dock = dockFor(planet);
      if (reducedMotion || ship.dockedAt === key) {
        setShip((s) => ({ ...s, at: dock, dockedAt: key, target: null }));
        onLand(planet);
        return;
      }
      play("power-up", { volume: SHIP_THRUST_VOLUME });
      setShip((s) => ({
        at: dock,
        rotate: turnTowards(s.rotate, headingDeg(s.at, dock, aspect)),
        dockedAt: key,
        target: planet,
      }));
    },
    [reducedMotion, ship.dockedAt, onLand, play],
  );

  const arrive = useCallback(() => {
    const planet = ship.target;
    if (!planet) return;
    setShip((s) => ({ ...s, target: null }));
    onLand(planet);
  }, [ship.target, onLand]);

  return { ship, fly, arrive };
}
