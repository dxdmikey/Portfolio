import { refineryCopy } from "@/content/refinery";
import type { BatchRecord, FieldValue } from "@/game/refinery/types";

/** JSON-ish rendering: the type colour of a value is the (subtle) clue — a quoted number is suspicious. */
function Value({ value }: { value: FieldValue }) {
  if (value === null) return <span className="text-warp">null</span>;
  if (typeof value === "number") return <span className="text-plasma">{value}</span>;
  return <span className="text-xp">&quot;{value}&quot;</span>;
}

interface RecordCardProps {
  record: BatchRecord;
  total: number;
  runDate: string;
  /** Shown only when the level checks for late data. */
  watermark: string | null;
}

/** One row from the bronze table, as it rides the belt. */
export function RecordCard({ record, total, runDate, watermark }: RecordCardProps) {
  return (
    <figure aria-label={refineryCopy.record.aria(record.position, total)} className="border-plasma bg-nebula shadow-pixel border-2">
      <figcaption className="border-grid text-dust flex flex-col gap-0.5 border-b-2 px-3 py-1.5 text-xs">
        <span className="font-pixel text-px-xs uppercase">
          {refineryCopy.record.table} <span className="text-coin">#{record.position}</span>
        </span>
        <span>
          {refineryCopy.record.runDate(runDate)}
          {watermark ? <span className="text-coin"> · {refineryCopy.record.watermark(watermark)}</span> : null}
        </span>
      </figcaption>
      <pre className="px-3 py-2 font-mono text-sm leading-relaxed">
        <code>
          {record.fields.map((f, i) => (
            <span key={f.key} className="block whitespace-pre">
              <span className="text-starlight">{f.key}</span>
              <span className="text-dust">: </span>
              <Value value={f.value} />
              {i < record.fields.length - 1 ? <span className="text-dust">,</span> : null}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
