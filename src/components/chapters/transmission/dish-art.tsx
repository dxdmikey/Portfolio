import { pixelPath } from "@/lib/pixel-path";
import { cn } from "@/lib/cn";

/** Dish world: 24 × 26 grid units. The bowl + feed rotate around the bowl's base. */
export const DISH_W = 24;
export const DISH_H = 26;
const CENTER = (DISH_W - 1) / 2;
const BOWL_BOTTOM = 14;
const BOWL_DEPTH = 6;
const BOWL_THICK = 3;
const RECEIVER_Y = 1;
const NECK_TOP = BOWL_BOTTOM + BOWL_THICK;
const BASE_Y = DISH_H - 3;
/** Half-width of the stepped base on its bottom row. */
const BASE_HALF = 6;

type Cell = (x: number, y: number) => boolean;

function grid(cell: Cell): string[] {
  return Array.from({ length: DISH_H }, (_, y) =>
    Array.from({ length: DISH_W }, (_, x) => (cell(x, y) ? "#" : ".")).join(""),
  );
}

const rim = (x: number) => BOWL_BOTTOM - Math.round(((x - CENTER) / CENTER) ** 2 * BOWL_DEPTH);
const centre = (x: number) => Math.abs(x - CENTER) < 1;

/** Outer (back) curve of the bowl: shallower than the rim, so the dish thickens at the edges. */
const back = (x: number) =>
  BOWL_BOTTOM + BOWL_THICK - Math.round(((x - CENTER) / CENTER) ** 2 * (BOWL_DEPTH - 2));

const BOWL = pixelPath(
  grid((x, y) => y >= rim(x) && y < rim(x) + 2),
  (c) => c === "#",
);
const BOWL_BACK = pixelPath(
  grid((x, y) => y >= rim(x) + 2 && y <= back(x)),
  (c) => c === "#",
);
const FEED = pixelPath(
  grid((x, y) => centre(x) && y > RECEIVER_Y + 1 && y < BOWL_BOTTOM),
  (c) => c === "#",
);
const RECEIVER = pixelPath(
  grid((x, y) => Math.abs(x - CENTER) < 2 && y >= RECEIVER_Y && y <= RECEIVER_Y + 1),
  (c) => c === "#",
);
const STAND = pixelPath(
  grid(
    (x, y) =>
      (centre(x) && y >= NECK_TOP && y < BASE_Y) ||
      (y >= BASE_Y && Math.abs(x - CENTER) < BASE_HALF - (DISH_H - 1 - y)),
  ),
  (c) => c === "#",
);

/** Themed with tokens via fill classes; `aimed` swings the bowl to point straight up. */
export function DishArt({ width, aimed }: { width: number; aimed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${DISH_W} ${DISH_H}`}
      width={width}
      height={(width / DISH_W) * DISH_H}
      shapeRendering="crispEdges"
      className="pixelated block overflow-visible"
    >
      <path d={STAND} className="fill-dust" />
      <g
        className={cn("dish-bowl", aimed && "is-aimed")}
        style={{ transformOrigin: `${CENTER + 0.5}px ${BOWL_BOTTOM + 1}px` }}
      >
        <path d={BOWL_BACK} className="fill-dust" />
        <path d={BOWL} className="fill-starlight" />
        <path d={FEED} className="fill-dust" />
        <path d={RECEIVER} className="fill-coin" />
      </g>
    </svg>
  );
}
