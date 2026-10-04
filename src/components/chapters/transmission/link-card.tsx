import { cn } from "@/lib/cn";
import { accentBorder, accentText } from "@/components/ui/accent";
import type { Accent } from "@/types/content";

/** Static class map so Tailwind sees every hard shadow at build time. */
const accentShadow: Record<Accent, string> = {
  plasma: "shadow-[4px_4px_0_0_var(--plasma)]",
  xp: "shadow-[4px_4px_0_0_var(--xp)]",
  coin: "shadow-[4px_4px_0_0_var(--coin)]",
  warp: "shadow-[4px_4px_0_0_var(--warp)]",
};

/** Classes for the big contact card; put them on the real `<a>` or `<button>`. */
export function linkCardClasses(accent: Accent, pinged: boolean) {
  return cn(
    "bg-nebula flex min-h-20 w-full cursor-pointer items-center gap-4 border-2 p-4 text-left transition-transform duration-150 hover:-translate-y-0.5 sm:p-5",
    accentBorder[accent],
    accentShadow[accent],
    pinged && "link-ping",
  );
}

interface LinkCardBodyProps {
  accent: Accent;
  glyph: string;
  title: string;
  blurb: string;
  /** Visible detail line (e.g. the email address). */
  detail?: string;
}

/** Glyph badge plus title, blurb and detail. Decorative glyph; the text is real DOM. */
export function LinkCardBody({ accent, glyph, title, blurb, detail }: LinkCardBodyProps) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "font-pixel text-px-md grid size-12 shrink-0 place-items-center border-2",
          accentBorder[accent],
          accentText[accent],
        )}
      >
        {glyph}
      </span>
      <span className="min-w-0">
        <span className={cn("font-pixel text-px-md block uppercase", accentText[accent])}>
          {title}
        </span>
        <span className="text-dust mt-1 block text-sm">{blurb}</span>
        {detail ? (
          <span className="text-starlight mt-1 block text-sm font-semibold break-all">
            {detail}
          </span>
        ) : null}
      </span>
    </>
  );
}
