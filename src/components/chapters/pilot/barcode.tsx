import { pilotCopy } from "@/content/pilot";

const BAR_W = 2;
const BAR_H = 20;

/** Decorative pixel barcode built from a fixed bit string. */
export function Barcode() {
  const bits = pilotCopy.barcode.split("");
  return (
    <svg
      viewBox={`0 0 ${bits.length * BAR_W} ${BAR_H}`}
      className="text-starlight h-6 w-full"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {bits.map((b, i) =>
        b === "1" ? (
          <rect key={i} x={i * BAR_W} y={0} width={BAR_W} height={BAR_H} fill="currentColor" />
        ) : null,
      )}
    </svg>
  );
}
