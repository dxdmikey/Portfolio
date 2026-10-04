import { issuerById } from "@/content/issuers";
import { pixelPathsByChar } from "@/lib/pixel-path";
import { cn } from "@/lib/cn";

/** Logo pixel size. 14-px grids render 4px per pixel at 56, so edges stay crisp. */
const LOGO_PX = 56;

/**
 * An issuer's pixel logo (multi-colour, built from `content/issuers.ts`) on a small `void` tile so the
 * brand colours pop in dark and light mode. Decorative: the issuer name is printed next to it.
 */
export function IssuerLogo({ issuerId, className }: { issuerId: string; className?: string }) {
  const issuer = issuerById(issuerId);
  if (!issuer) return null;
  const size = issuer.rows.length;
  const width = Math.max(...issuer.rows.map((r) => r.length));
  const paths = pixelPathsByChar(issuer.rows);
  return (
    <span className={cn("bg-void border-grid pixelated inline-block border-2 p-2", className)}>
      <svg
        viewBox={`0 0 ${width} ${size}`}
        width={LOGO_PX}
        height={LOGO_PX}
        shapeRendering="crispEdges"
        aria-hidden
        className="block"
      >
        {[...paths].map(([ch, d]) => (
          <path key={ch} d={d} fill={issuer.palette[ch] ?? "currentColor"} />
        ))}
      </svg>
    </span>
  );
}
