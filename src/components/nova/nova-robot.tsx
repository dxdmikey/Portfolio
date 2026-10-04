"use client";

import { cn } from "@/lib/cn";
import { ROBOT_BODY, ROBOT_FACE, ROBOT_FILL, ROBOT_VIEWBOX } from "./robot-art";

/** Mouth flap speed while talking (overrides the slow default blink). */
const TALK_FLAP = "0.28s";

interface NovaRobotProps {
  talking: boolean;
  sleeping: boolean;
  animate: boolean;
}

/**
 * Pixel robot: blinking antenna light and a gentle bob when idle, flapping mouth while talking,
 * closed eyes while muted. Purely decorative; the parent button carries the label.
 */
export function NovaRobot({ talking, sleeping, animate }: NovaRobotProps) {
  return (
    <span aria-hidden className={cn("block", animate && !talking && !sleeping && "animate-float")}>
      <svg
        viewBox={`0 0 ${ROBOT_VIEWBOX.width} ${ROBOT_VIEWBOX.height}`}
        className="pixelated block h-auto w-10 sm:w-14"
        shapeRendering="crispEdges"
      >
        {ROBOT_BODY.map(([ch, d]) => (
          <path
            key={ch}
            d={d}
            className={cn(
              ROBOT_FILL[ch],
              ch === "l" && animate && !sleeping && "animate-blink",
              ch === "l" && sleeping && "opacity-30",
            )}
          />
        ))}
        <path d={sleeping ? ROBOT_FACE.eyesClosed : ROBOT_FACE.eyesOpen} className="fill-xp" />
        <path
          d={ROBOT_FACE.mouthSmile}
          className={cn("fill-xp", talking && animate && "opacity-0")}
        />
        {talking && animate ? (
          <path
            d={ROBOT_FACE.mouthOpen}
            className="fill-xp animate-blink"
            style={{ animationDuration: TALK_FLAP }}
          />
        ) : null}
      </svg>
    </span>
  );
}
