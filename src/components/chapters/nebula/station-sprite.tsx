import { STATION_ROWS } from "@/content/nebula";
import { pixelPath } from "@/lib/pixel-path";
import { cn } from "@/lib/cn";

const HULL = pixelPath(STATION_ROWS, (c) => c === "#");
const LIGHTS = pixelPath(STATION_ROWS, (c) => c === "o");
const DAMAGE = pixelPath(STATION_ROWS, (c) => c === "x");

/** Derelict station sprite. Hull takes the accent colour via `className` (text-*). */
export function StationSprite({ className, size = 56 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 12 10"
      width={size}
      height={(size * 10) / 12}
      shapeRendering="crispEdges"
      className={cn("pixelated", className)}
      aria-hidden
    >
      <path d={HULL} fill="currentColor" />
      <path d={LIGHTS} className="fill-coin" />
      <path d={DAMAGE} className="fill-danger" />
    </svg>
  );
}
