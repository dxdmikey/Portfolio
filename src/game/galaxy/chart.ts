/** Geometry and ordering for the galaxy map. Coordinates are 0–1 of the map box. */

export interface Point {
  x: number;
  y: number;
}

export interface ChartPlanet {
  id: string;
  status: "in-orbit" | "completed" | "side-mission";
  period: string;
  planet: Point;
}

export interface ConstellationLink {
  from: string;
  to: string;
  /** Main career path vs. a faint side-mission tether. */
  kind: "path" | "side";
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_PER_YEAR = 12;
const DEGREES_PER_RADIAN = 180 / Math.PI;
/** The ship sprite points up; atan2 measures from +x. */
const SPRITE_HEADING_OFFSET = 90;

/** "Apr 2024 – Apr 2025" → months since year 0 of the start date; null if undated. */
export function periodStart(period: string): number | null {
  const match = /([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(period);
  if (!match?.[1] || !match[2]) return null;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month < 0 ? null : Number(match[2]) * MONTHS_PER_YEAR + month;
}

const isMain = (p: ChartPlanet) => p.status !== "side-mission";

/** Main missions oldest → newest, then side missions. Used for tab order and the mobile list. */
export function flightOrder<T extends ChartPlanet>(planets: readonly T[]): T[] {
  const start = (p: T) => periodStart(p.period) ?? Number.POSITIVE_INFINITY;
  const main = planets.filter(isMain).sort((a, b) => start(a) - start(b));
  return [...main, ...planets.filter((p) => !isMain(p))];
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Chronological path through main missions; each side mission tethers to its nearest main planet. */
export function constellationLinks(planets: readonly ChartPlanet[]): ConstellationLink[] {
  const main = flightOrder(planets).filter(isMain);
  const path = main
    .slice(1)
    .map((p, i) => ({ from: main[i]?.id ?? p.id, to: p.id, kind: "path" as const }));
  const sides = planets
    .filter((p) => !isMain(p))
    .flatMap((side) => {
      const nearest = [...main].sort(
        (a, b) => distance(a.planet, side.planet) - distance(b.planet, side.planet),
      )[0];
      return nearest ? [{ from: nearest.id, to: side.id, kind: "side" as const }] : [];
    });
  return [...path, ...sides];
}

/** Ship rotation (deg, 0 = up) to face `to`. `aspect` = map width / height. */
export function headingDeg(from: Point, to: Point, aspect: number): number {
  const dx = (to.x - from.x) * aspect;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return 0;
  return Math.atan2(dy, dx) * DEGREES_PER_RADIAN + SPRITE_HEADING_OFFSET;
}

/** A circle rasterised on an n×n grid, as a CSS clip-path polygon — gives planets stepped pixel edges. */
export function pixelCirclePolygon(cells: number): string {
  const r = cells / 2;
  const half = (row: number) => {
    const y = row + 0.5 - r;
    return Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
  };
  const pct = (v: number) => `${+((v / cells) * 100).toFixed(2)}%`;
  const right: string[] = [];
  const left: string[] = [];
  for (let row = 0; row < cells; row++) {
    const w = half(row);
    right.push(`${pct(r + w)} ${pct(row)}`, `${pct(r + w)} ${pct(row + 1)}`);
    left.unshift(`${pct(r - w)} ${pct(row + 1)}`, `${pct(r - w)} ${pct(row)}`);
  }
  return `polygon(${[...right, ...left].join(", ")})`;
}

const GOLDEN = 0.618_033_988_75;
const PLASTIC = 0.754_877_666_25;

/** Evenly-scattered, deterministic background stars (low-discrepancy sequence). */
export function starPositions(count: number): Point[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i * GOLDEN + 0.13) % 1,
    y: (i * PLASTIC + 0.37) % 1,
  }));
}

const FULL_TURN = 360;
const HALF_TURN = 180;

/** Next rotation value that faces `target` by the shortest turn (keeps motion from spinning 350°). */
export function turnTowards(current: number, target: number): number {
  const delta =
    ((((target - current) % FULL_TURN) + FULL_TURN + HALF_TURN) % FULL_TURN) - HALF_TURN;
  return current + delta;
}
