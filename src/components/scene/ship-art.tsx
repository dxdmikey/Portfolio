import { pixelPathsByChar } from "@/lib/pixel-path";

/**
 * The player's rocket, nose up, 9 × 13 (rotated by CSS to fly down the page).
 * "F" / "f" rows are the flame, drawn in their own flickering group.
 */
const HULL_ROWS = [
  "....R....",
  "...RWR...",
  "...WWW...",
  "..WWBWW..",
  "..WBBBW..",
  "..WWBWW..",
  "..WWWWW..",
  "..WsWWW..",
  ".RWsWWWR.",
  "RRWWWWWRR",
  "RR.GGG.RR",
] as const;
const BLANK_ROW = ".........";
/** Flame sits under the hull: blank rows keep both grids aligned. */
const FLAME_ROWS = [...Array<string>(HULL_ROWS.length).fill(BLANK_ROW), "...FfF...", "....F...."];

export const SHIP_W = 9;
export const SHIP_H = FLAME_ROWS.length;

/** Art palette (fixed colours: the ship is a sprite, not themed UI). */
const PALETTE: Readonly<Record<string, string>> = {
  R: "#ff5a6e",
  W: "#e8e9ff",
  s: "#b9bbe6",
  B: "#3ef0ff",
  G: "#5b5480",
  F: "#ffc93c",
  f: "#ff8a5c",
};

const HULL = [...pixelPathsByChar(HULL_ROWS).entries()];
const FLAME = [...pixelPathsByChar(FLAME_ROWS).entries()];

export function ShipArt({ size }: { size: number }) {
  return (
    <svg
      viewBox={`0 0 ${SHIP_W} ${SHIP_H}`}
      width={size}
      height={(size / SHIP_W) * SHIP_H}
      shapeRendering="crispEdges"
      className="pixelated block"
    >
      {HULL.map(([key, d]) => (
        <path key={key} d={d} fill={PALETTE[key]} />
      ))}
      <g className="ship-flame">
        {FLAME.map(([key, d]) => (
          <path key={key} d={d} fill={PALETTE[key]} />
        ))}
      </g>
    </svg>
  );
}
