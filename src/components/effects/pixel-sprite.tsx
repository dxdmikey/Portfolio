import { cn } from "@/lib/cn";
import { pixelPath, pixelPathsByChar } from "@/lib/pixel-path";
import { EYE_KEY, LENS_KEY, SPRITE_HEIGHT, SPRITE_PALETTE, SPRITE_ROWS, SPRITE_WIDTH } from "./pixel-sprite-art";

/**
 * Parsed once at module load — the art is static. One path per colour keeps the DOM tiny.
 * Eyes are drawn as lenses in the base layer, then overlaid by a blinkable eye layer.
 */
const BASE_PATHS = [
  ...pixelPathsByChar(SPRITE_ROWS.map((row) => row.replaceAll(EYE_KEY, LENS_KEY))).entries(),
];
const EYE_PATH = pixelPath(SPRITE_ROWS, (ch) => ch === EYE_KEY);

/** Stepped "pixel ellipse" shadow, in sprite grid units: [inset, width] per row. */
const SHADOW_ROWS = [
  [4, 8],
  [2, 12],
  [4, 8],
] as const;
const SHADOW_GAP = 1.5;
const SHADOW_HEIGHT = SHADOW_ROWS.length;

interface PixelSpriteProps {
  /** Rendered width in px; height keeps the 16:20 pixel grid. */
  size?: number;
  /** Float + shadow pulse + blink. Disable for static contexts. */
  animated?: boolean;
  className?: string;
}

export function PixelSprite({ size = 128, animated = true, className }: PixelSpriteProps) {
  const height = (size / SPRITE_WIDTH) * SPRITE_HEIGHT;
  const shadowHeight = (size / SPRITE_WIDTH) * (SHADOW_HEIGHT + SHADOW_GAP);

  return (
    <div role="img" aria-label="Pixel-art Ravi" className={cn("inline-flex flex-col items-center", className)}>
      <svg
        aria-hidden
        viewBox={`0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`}
        width={size}
        height={height}
        shapeRendering="crispEdges"
        className={cn("pixelated block", animated && "animate-float")}
      >
        {BASE_PATHS.map(([key, d]) => (
          <path key={key} d={d} fill={SPRITE_PALETTE[key]} />
        ))}
        <g className={animated ? "sprite-blink" : undefined}>
          <path d={EYE_PATH} fill={SPRITE_PALETTE[EYE_KEY]} />
        </g>
      </svg>
      <svg
        aria-hidden
        viewBox={`0 ${-SHADOW_GAP} ${SPRITE_WIDTH} ${SHADOW_HEIGHT + SHADOW_GAP}`}
        width={size}
        height={shadowHeight}
        shapeRendering="crispEdges"
        className="text-dust block"
      >
        <g className={animated ? "sprite-shadow" : undefined} style={{ transformBox: "fill-box" }} fill="currentColor" opacity={0.5}>
          {SHADOW_ROWS.map(([inset, width], y) => (
            <rect key={y} x={inset} y={y} width={width} height={1} />
          ))}
        </g>
      </svg>
    </div>
  );
}
