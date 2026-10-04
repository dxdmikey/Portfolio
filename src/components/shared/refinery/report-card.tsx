import type { RefObject } from "react";
import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { StatBar } from "@/components/ui/stat-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecordVerdict, ShiftResult } from "@/game/refinery/shift";

const { report: copy, verdict } = refineryCopy;
const PERCENT = 100;
const MAX_MISSES_SHOWN = 5;

interface ReportCardProps {
  result: ShiftResult;
  misses: readonly RecordVerdict[];
  best: number;
  newBest: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onRetry: () => void;
  onNewShift: () => void;
}

/** End-of-shift "Data quality report": the numbers, the rank, what slipped, and replay buttons. */
export function ReportCard({ result, misses, best, newBest, headingRef, onRetry, onNewShift }: ReportCardProps) {
  const win = result.outcome === "win";
  const paged = result.reason === "paged";
  const accuracy = Math.round(result.accuracy * PERCENT);
  const rows: readonly [string, string][] = [
    [copy.rows.processed, String(result.processed)],
    [copy.rows.accuracy, `${accuracy}%`],
    [copy.rows.bestStreak, String(result.bestStreak)],
    [copy.rows.incidents, paged ? copy.notReached : `${result.incidentsResolved}/${result.incidentCount}`],
    [copy.rows.score, String(result.score)],
    [copy.rows.best, String(best)],
  ];
  // Breaches first: they are the misses that matter most.
  const shown = [...misses].sort((a, b) => Number(b.breach) - Number(a.breach)).slice(0, MAX_MISSES_SHOWN);
  return (
    <PixelCard accent={win ? "coin" : "muted"} className={cn("flex flex-col gap-5 p-5 sm:p-6", paged && "border-danger")}>
      <p className="font-pixel text-px-xs text-dust uppercase">{copy.heading}</p>
      <h4
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          // Focus moves here to announce the result; no ring needed on a heading.
          "font-pixel text-px-sm sm:text-px-md leading-relaxed uppercase focus:outline-none",
          paged ? "text-danger" : win ? "text-coin text-glow" : "text-starlight",
        )}
      >
        {paged ? copy.paged : copy.complete}
      </h4>
      {paged ? <p className="text-dust max-w-[65ch]">{copy.pagedBody}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-pixel text-px-xs text-dust uppercase">{copy.rankLabel}</span>
        <StatusBadge accent={win ? "coin" : "plasma"}>{copy.ranks[result.rank.id]}</StatusBadge>
        {newBest ? <StatusBadge accent="xp">{copy.newBest}</StatusBadge> : null}
      </div>
      <StatBar value={accuracy} accent={win ? "xp" : "coin"} label={copy.rows.accuracy} segmented />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-dust text-sm">{label}</dt>
            <dd className="font-pixel text-px-sm text-starlight">{value}</dd>
          </div>
        ))}
      </dl>
      {shown.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-pixel text-px-xs text-dust uppercase">{copy.missesHeading}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {shown.map((m) => (
              <li key={`${m.stage}-${m.record.position}`}>
                <span className="text-danger font-pixel text-px-xs mr-2">{copy.missTag(m.stage, m.record.position)}</span>
                {verdict.text(m)}
              </li>
            ))}
            {misses.length > shown.length ? (
              <li className="text-dust">{copy.moreMisses(misses.length - shown.length)}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <PixelButton onClick={onRetry} className="min-h-14">
          {copy.retry}
        </PixelButton>
        <PixelButton variant="coin" onClick={onNewShift} className="min-h-14">
          {copy.newShift}
        </PixelButton>
      </div>
    </PixelCard>
  );
}
