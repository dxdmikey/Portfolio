import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";
import type { RecordVerdict } from "@/game/refinery/shift";

const { verdict: copy } = refineryCopy;

/** The previous call's verdict, announced politely once per decision (never per frame). */
export function VerdictLine({ last }: { last: RecordVerdict | null }) {
  const tone = !last ? "text-dust" : last.correct ? "text-xp" : last.breach ? "text-danger" : "text-coin";
  return (
    <p
      role="status"
      aria-live="polite"
      className="border-grid bg-nebula-2 flex min-h-16 items-center gap-3 border-2 px-4 py-3"
    >
      {last ? (
        <>
          <span aria-hidden={!last.correct} className={cn("font-pixel text-px-xs shrink-0", tone)}>
            {last.correct ? copy.points(last.points) : "✕"}
          </span>
          <span>{copy.text(last)}</span>
        </>
      ) : (
        <span className="text-dust">{copy.prompt}</span>
      )}
    </p>
  );
}
