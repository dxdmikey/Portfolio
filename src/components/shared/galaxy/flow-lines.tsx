import { useId } from "react";
import type { Accent } from "@/types/content";
import type { FlowLayout } from "./use-flow-paths";

const packetStroke: Record<Accent, string> = {
  plasma: "stroke-plasma",
  xp: "stroke-xp",
  coin: "stroke-coin",
  warp: "stroke-warp",
};
/** Dash + gap of a data packet; the animation shifts by whole periods so it loops seamlessly. */
const PACKET_DASH = 4;
const PACKET_GAP = 14;
const PACKET_PERIOD = PACKET_DASH + PACKET_GAP;
const PACKET_LOOP = `${PACKET_PERIOD * 2}`;
const PACKET_DURATION = "1.4s";

interface FlowLinesProps {
  layout: FlowLayout;
  accent: Accent;
  animate: boolean;
}

/** Edges of the architecture diagram, drawn behind the node boxes, with data packets flowing along them. */
export function FlowLines({ layout, accent, animate }: FlowLinesProps) {
  const marker = useId();
  if (layout.width === 0) return null;
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 6 6"
          refX={6}
          refY={3}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 Z" className="fill-dust" />
        </marker>
      </defs>
      {layout.paths.map((p) => (
        <g key={p.key} fill="none">
          <path
            d={p.d}
            className="stroke-dust"
            strokeOpacity={0.55}
            strokeWidth={2}
            markerEnd={`url(#${marker})`}
          />
          <path
            d={p.d}
            className={packetStroke[accent]}
            strokeWidth={3}
            strokeDasharray={`${PACKET_DASH} ${PACKET_GAP}`}
          >
            {animate ? (
              <animate
                attributeName="stroke-dashoffset"
                from={PACKET_LOOP}
                to="0"
                dur={PACKET_DURATION}
                repeatCount="indefinite"
              />
            ) : null}
          </path>
        </g>
      ))}
    </svg>
  );
}
