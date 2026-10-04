import type { CSSProperties } from "react";
import { profile } from "@/content/profile";
import { cn } from "@/lib/cn";

interface BootLine {
  text: string;
  /** Right-aligned result after the dot leader, shown in xp. */
  status?: string;
}

/** BIOS copy. Kept beside the overlay because it is pure flavour text. */
const LINES: readonly BootLine[] = [
  { text: `RAVI-OS BIOS ${profile.version}` },
  { text: "Mounting lakehouse", status: "Bronze ✓ Silver ✓ Gold ✓" },
  { text: "Loading pyspark.dll", status: "OK" },
  { text: "Calibrating AI agent", status: "OK" },
  { text: "2,400+ tables detected. Brewing coffee…" },
];

const FIRST_LINE_MS = 150;
const LINE_STEP_MS = 260;
/** PRESS START lands shortly after the last line (whole sequence ≈ 1.7s, budget 2.2s). */
export const PRESS_START_DELAY_MS = FIRST_LINE_MS + LINES.length * LINE_STEP_MS + 250;

export function delayStyle(ms: number): CSSProperties {
  return { "--boot-delay": `${ms}ms` } as CSSProperties;
}

/**
 * Server-renderable BIOS log; each line reveals itself via CSS animation-delay. The BIOS banner
 * (line 0) is on screen from the first paint, like a real POST screen; it is also the page's
 * first contentful (and LCP) text, since text revealed from opacity 0 does not count.
 */
export function BootLines() {
  return (
    <div className="font-pixel text-px-xs sm:text-px-sm text-starlight w-full space-y-3 leading-relaxed">
      {LINES.map((line, i) => (
        <p
          key={line.text}
          className={cn("flex flex-wrap items-baseline gap-x-2", i > 0 && "boot-line")}
          style={i > 0 ? delayStyle(FIRST_LINE_MS + i * LINE_STEP_MS) : undefined}
        >
          <span className={i === 0 ? "text-plasma" : undefined}>{line.text}</span>
          {line.status ? (
            <>
              <span
                aria-hidden
                className="border-grid min-w-6 flex-1 translate-y-[-3px] border-b-2 border-dotted"
              />
              <span className="text-xp">{line.status}</span>
            </>
          ) : null}
        </p>
      ))}
      <div aria-hidden className="border-grid bg-void mt-6 h-3 border-2 p-[2px]">
        <div className="boot-bar bg-xp xp-notches h-full" />
      </div>
    </div>
  );
}
