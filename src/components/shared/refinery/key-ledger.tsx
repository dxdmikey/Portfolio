import { refineryCopy } from "@/content/refinery";
import { Tag } from "@/components/ui/tag";
import { ID_COLUMN } from "@/game/refinery/schema";
import type { BatchRecord } from "@/game/refinery/types";

/** order_ids already seen this level, so duplicates are catchable without a perfect memory. */
export function KeyLedger({ seen }: { seen: readonly BatchRecord[] }) {
  const ids = seen.map((r) => r.fields.find((f) => f.key === ID_COLUMN)?.value).filter((v) => typeof v === "number");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-pixel text-px-xs text-dust uppercase">{refineryCopy.ledger.heading}</span>
      {ids.length === 0 ? (
        <span className="text-dust text-sm">{refineryCopy.ledger.empty}</span>
      ) : (
        <ul className="flex flex-wrap gap-1.5" aria-label={refineryCopy.ledger.heading}>
          {ids.map((id, i) => (
            <li key={`${id}-${i}`}>
              <Tag className="font-mono">{String(id)}</Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
