"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { launchpad } from "@/content/launchpad";
import { ShipArt, SHIP_W } from "@/components/scene/ship-art";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useGame } from "@/providers/game-provider";
import { cn } from "@/lib/cn";
import { TowerArt, TOWER_H, TOWER_W } from "./tower-art";

type Stage = "idle" | "launching" | "gone" | "landing";

const TOWER_PX = 120;
const ROCKET_PX = (TOWER_PX / TOWER_W) * SHIP_W;
/** Rocket's left edge and pad height in tower grid units. */
const ROCKET_X = 2;
const PAD_ROWS = 3;
/** Must match `rocket-rumble` + `rocket-fly` / `rocket-land` in globals.css. */
const RUMBLE_MS = 450;
const FLY_MS = 1100;
const LAND_MS = 500;
const SMOKE_PUFFS = 3;
const PUFF_SPREAD_PX = 18;

/**
 * Rocket on its launch tower. One button: launch (rumble, smoke, screen shake, fly off)
 * and, once it's gone, relaunch (it drops back onto the pad).
 */
export function LaunchTower({ className }: { className?: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const rocket = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { bus, sfx } = useGame();
  const { trigger } = useDiscover("rocket", { accent: "coin", sound: "warp" });

  useEffect(() => {
    if (stage !== "launching" && stage !== "landing") return;
    const done = stage === "launching" ? "gone" : "idle";
    const ms = reduced ? 0 : stage === "launching" ? RUMBLE_MS + FLY_MS : LAND_MS;
    const t = window.setTimeout(() => setStage(done), ms);
    return () => window.clearTimeout(t);
  }, [stage, reduced]);

  const ignite = () => {
    const r = rocket.current?.getBoundingClientRect();
    if (!r) return;
    const x = r.left + r.width / 2;
    const y = r.bottom;
    bus.emit({ type: "fx", kind: "shake", x, y, accent: "coin" });
    for (let i = 0; i < SMOKE_PUFFS; i++) {
      bus.emit({
        type: "fx",
        kind: "burst",
        x: x + (i - 1) * PUFF_SPREAD_PX,
        y,
        accent: i === 1 ? "coin" : "warp",
      });
    }
    bus.emit({ type: "fx", kind: "ripple", x, y, accent: "coin" });
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (stage === "launching" || stage === "landing") return;
    if (stage === "gone") {
      setStage("landing");
      sfx.play("whoosh");
      return;
    }
    trigger(e);
    setStage("launching");
    ignite();
    if (!reduced) window.setTimeout(ignite, RUMBLE_MS);
  };

  const flying = stage === "launching" || stage === "gone";
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={flying ? launchpad.rocket.relaunch : launchpad.rocket.launch}
        aria-disabled={stage === "launching" || stage === "landing"}
        className="group relative flex min-h-11 cursor-pointer flex-col items-center gap-3 p-2"
      >
        <span className="relative block" style={{ width: TOWER_PX }}>
          <TowerArt width={TOWER_PX} />
          <span
            ref={rocket}
            className={cn(
              "absolute block transition-transform duration-150 group-hover:-translate-y-1",
              stage === "launching" && "rocket-launch",
              stage === "gone" && "invisible",
              stage === "landing" && "rocket-land",
            )}
            style={{
              left: `${(ROCKET_X / TOWER_W) * 100}%`,
              bottom: `${(PAD_ROWS / TOWER_H) * 100}%`,
            }}
          >
            <ShipArt size={ROCKET_PX} />
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            "font-pixel text-px-xs border-2 px-3 py-2 uppercase transition-colors",
            flying
              ? "border-grid text-dust group-hover:text-plasma"
              : "border-coin text-coin group-hover:bg-coin group-hover:text-on-accent",
          )}
        >
          {flying ? launchpad.rocket.plateFlying : launchpad.rocket.plateIdle}
        </span>
      </button>
      <p role="status" className="sr-only">
        {stage === "gone" ? launchpad.rocket.status.launched : ""}
      </p>
    </div>
  );
}
