import { pixelPath } from "@/lib/pixel-path";

/** Launch tower world: 24 × 40 grid units. The rocket stands at x 2–11 on the pad. */
export const TOWER_W = 24;
export const TOWER_H = 40;
const RAIL_L = 15;
const RAIL_R = 21;
const TOP = 3;
const PAD_TOP = 37;
const RUNG = 4;
const ARMS = [10, 22] as const;
const ARM_FROM = 10;

/** Generated once: rails, rungs with alternating diagonals, gantry arms and a mast. */
function towerRows(): string[] {
  return Array.from({ length: PAD_TOP }, (_, y) =>
    Array.from({ length: TOWER_W }, (_, x) => {
      if (y < TOP) return x === RAIL_L + 3 ? "#" : ".";
      const rail = x === RAIL_L || x === RAIL_R;
      const rung = (y - TOP) % RUNG === 0 && x > RAIL_L && x < RAIL_R;
      const step = (y - TOP) % RUNG;
      const flip = Math.floor((y - TOP) / RUNG) % 2 === 0;
      const diagonal =
        x === (flip ? RAIL_L + 1 + step : RAIL_R - 1 - step) && x > RAIL_L && x < RAIL_R;
      const arm = ARMS.some((a) => a === y) && x >= ARM_FROM && x < RAIL_L;
      return rail || rung || diagonal || arm ? "#" : ".";
    }).join(""),
  );
}

const TOWER_PATH = pixelPath(towerRows(), (c) => c === "#");
const BEACON = { x: RAIL_L + 3, y: 0 };

/** Tower + pad, themed with currentColor (dust lattice, grid pad, coin beacon). */
export function TowerArt({ width }: { width: number }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${TOWER_W} ${TOWER_H}`}
      width={width}
      height={(width / TOWER_W) * TOWER_H}
      shapeRendering="crispEdges"
      className="pixelated block"
    >
      <path d={TOWER_PATH} className="fill-dust" />
      <rect x={BEACON.x} y={BEACON.y} width={1} height={1} className="fill-danger tower-beacon" />
      <rect x={0} y={PAD_TOP} width={TOWER_W} height={1} className="fill-dust" />
      <rect x={1} y={PAD_TOP + 1} width={TOWER_W - 2} height={2} className="fill-grid" />
    </svg>
  );
}
