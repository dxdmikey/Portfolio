import type { CSSProperties } from "react";
import { starPositions } from "@/game/galaxy/chart";

const STAR_COUNT = 56;
const STARS = starPositions(STAR_COUNT);
const PERCENT = 100;
/** Every n-th star is brighter / bigger. */
const BRIGHT_EVERY = 7;
const GRID_STEP = 10;
const GRID_LINES = Array.from({ length: PERCENT / GRID_STEP - 1 }, (_, i) => (i + 1) * GRID_STEP);
/** Orbit rings centred on the current mission (viewBox units, 0–100). */
const ORBIT_CENTRE = { x: 50, y: 48 } as const;
const ORBITS = [
  { rx: 16, ry: 13 },
  { rx: 32, ry: 26 },
  { rx: 46, ry: 40 },
] as const;

/** Soft, token-coloured nebula clouds — the one place gradients are allowed. */
const nebula = (token: string, strength: number): CSSProperties => ({
  background: `radial-gradient(closest-side, color-mix(in srgb, var(${token}) ${strength}%, transparent), transparent)`,
});

/** Static, decorative backdrop for the star chart: nebula, stars, grid and orbit ellipses. */
export function ChartBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute top-[-10%] left-[8%] h-[70%] w-[45%]" style={nebula("--warp", 14)} />
      <div
        className="absolute right-[4%] bottom-[-15%] h-[75%] w-[50%]"
        style={nebula("--plasma", 12)}
      />
      <div className="absolute top-[25%] left-[35%] h-[50%] w-[30%]" style={nebula("--coin", 6)} />
      {STARS.map((s, i) => (
        <span
          key={i}
          className={
            i % BRIGHT_EVERY === 0
              ? "bg-starlight/80 absolute size-[3px]"
              : "bg-dust/60 absolute size-[2px]"
          }
          style={{ left: `${s.x * PERCENT}%`, top: `${s.y * PERCENT}%` }}
        />
      ))}
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {GRID_LINES.map((v) => (
          <g
            key={v}
            className="stroke-grid"
            strokeWidth={1}
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          >
            <line x1={v} y1={0} x2={v} y2={100} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={v} x2={100} y2={v} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {ORBITS.map((o) => (
          <ellipse
            key={o.rx}
            cx={ORBIT_CENTRE.x}
            cy={ORBIT_CENTRE.y}
            rx={o.rx}
            ry={o.ry}
            fill="none"
            className="stroke-dust"
            strokeWidth={2}
            strokeDasharray="2 8"
            opacity={0.45}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
