import type { Accent } from "@/types/content";

/** One packet slot along a pipe: a dash and the gap after it (px). */
const PACKET_DASH = 5;
const PACKET_GAP = 11;
const PACKET_SLOT = PACKET_DASH + PACKET_GAP;
/** Packet speed along a pipe (px per second). */
const PACKET_SPEED = 30;
const PACKET_WIDTH = 4;

/** Static map so Tailwind sees every stroke class. */
const STROKE: Record<Accent, string> = {
  plasma: "stroke-plasma",
  xp: "stroke-xp",
  coin: "stroke-coin",
  warp: "stroke-warp",
};

interface FlowPacketsProps {
  d: string;
  /** One colour per source feeding this pipe; several interleave once streams merge. */
  accents: readonly Accent[];
  animate: boolean;
}

/**
 * Data packets on a live pipe, coloured by the source they came from. With n sources, each colour
 * gets every n-th slot, so merged pipes after Ingest carry a striped mix. Shifting by one whole
 * period loops seamlessly; under reduced motion the packets stay put.
 */
export function FlowPackets({ d, accents, animate }: FlowPacketsProps) {
  const period = PACKET_SLOT * Math.max(1, accents.length);
  const dur = `${period / PACKET_SPEED}s`;
  return (
    <>
      {accents.map((accent, i) => {
        const offset = i * PACKET_SLOT;
        return (
          <path
            key={accent}
            d={d}
            className={STROKE[accent]}
            strokeWidth={PACKET_WIDTH}
            strokeDasharray={`${PACKET_DASH} ${period - PACKET_DASH}`}
            strokeDashoffset={offset}
          >
            {animate ? (
              <animate
                attributeName="stroke-dashoffset"
                from={offset + period}
                to={offset}
                dur={dur}
                repeatCount="indefinite"
              />
            ) : null}
          </path>
        );
      })}
    </>
  );
}
