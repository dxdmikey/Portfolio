import { chartLinks } from "./chart-layout";

const PERCENT = 100;
const LINKS = chartLinks();

/** Dashed voyage path between chapters (bright) and faint tethers from projects to their chapter. */
export function VoyageLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {LINKS.map((l) => {
        const path = l.kind === "path";
        return (
          <line
            key={l.key}
            x1={l.from.x * PERCENT}
            y1={l.from.y * PERCENT}
            x2={l.to.x * PERCENT}
            y2={l.to.y * PERCENT}
            className={path ? "stroke-plasma" : "stroke-warp"}
            strokeWidth={path ? 2 : 1.5}
            strokeDasharray={path ? "8 6" : "3 7"}
            opacity={path ? 0.55 : 0.4}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
