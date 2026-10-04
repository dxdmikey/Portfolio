import { cn } from "@/lib/cn";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { stationCopy } from "@/content/station";
import type { BootLog as BootLogData, LogTone } from "@/game/station/log";

const TONE: Record<LogTone, string> = {
  ok: "text-xp",
  error: "text-danger",
  info: "text-plasma",
  sync: "text-coin",
};

/**
 * The station's terminal: one line per event, newest at the bottom; older lines slide off the
 * top (no scroll handling needed). Not a live region: it would chatter, and the meter and the
 * finale card already announce what matters.
 */
export function BootLog({ log }: { log: BootLogData }) {
  return (
    <div className="bg-void border-grid shadow-pixel flex flex-col border-2">
      <p className="border-grid font-pixel text-px-xs text-dust flex items-center gap-2 border-b-2 px-3 py-2 uppercase">
        <PixelIcon name="bolt" size={8} className="text-plasma" />
        {stationCopy.log.title}
      </p>
      {/* role="log" sits on a wrapper: on the <ol> itself it would strip the list semantics. */}
      <div
        role="log"
        aria-live="off"
        aria-label={stationCopy.log.label}
        className="flex min-h-60 flex-1 flex-col justify-end px-3 py-2 text-sm leading-6"
      >
        <ol>
          {log.lines.length === 0 ? (
            <li className="text-dust">
              <span className="text-plasma">{stationCopy.log.station}</span> ›{" "}
              {stationCopy.log.prompt}
            </li>
          ) : (
            log.lines.map((line) => (
              <li key={line.id} className="text-starlight break-words">
                <span className={cn("font-semibold", TONE[line.tone])}>{line.source}</span>
                <span className="text-dust"> › </span>
                {line.text}
              </li>
            ))
          )}
          <li aria-hidden className="text-plasma animate-blink">
            ▮
          </li>
        </ol>
      </div>
    </div>
  );
}
