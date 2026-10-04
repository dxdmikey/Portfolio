const CORNERS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
] as const;

/** Pixel corner brackets that frame a planet on hover / keyboard focus (parent needs `group`). */
export function Reticle() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-3 scale-125 opacity-0 transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
    >
      {CORNERS.map((pos) => (
        <span key={pos} className={`border-coin absolute size-3 ${pos}`} />
      ))}
    </span>
  );
}
