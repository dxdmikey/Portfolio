const VIEW = 100;
const CENTER = 50;
const RADIUS = 46;

/** Pixel-edged purple planet. Pure SVG, coloured by tokens so it themes for free. */
export function PlanetArt() {
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className="absolute inset-0 size-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <defs>
        <clipPath id="vit-planet-clip">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} />
        </clipPath>
      </defs>
      <circle cx={CENTER} cy={CENTER} r={RADIUS + 3} className="fill-warp/15" />
      <circle cx={CENTER} cy={CENTER} r={RADIUS} className="fill-nebula-2" />
      <g clipPath="url(#vit-planet-clip)">
        <rect x={0} y={14} width={VIEW} height={10} className="fill-warp/35" />
        <rect x={0} y={30} width={VIEW} height={8} className="fill-plasma/20" />
        <rect x={0} y={52} width={VIEW} height={12} className="fill-warp/45" />
        <rect x={0} y={72} width={VIEW} height={8} className="fill-plasma/25" />
        <rect x={0} y={84} width={VIEW} height={16} className="fill-void/50" />
        <rect x={52} y={0} width={VIEW} height={VIEW} className="fill-void/25" />
      </g>
    </svg>
  );
}

const POLE_H = 14;

/** Tiny pixel flag planted on the planet's north pole. */
export function Flag() {
  return (
    <svg
      viewBox="0 0 24 20"
      width={72}
      height={60}
      shapeRendering="crispEdges"
      className="pixelated overflow-visible"
      aria-hidden
    >
      <rect x={3} y={2} width={1} height={POLE_H + 4} className="fill-starlight" />
      <rect x={4} y={2} width={14} height={9} className="fill-xp" />
      <rect x={4} y={5} width={14} height={2} className="fill-on-accent/30" />
    </svg>
  );
}
