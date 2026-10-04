import { cn } from "@/lib/cn";
import { accentBg } from "@/components/ui/accent";
import { STATUS_META, STATUS_ORDER } from "./status";

/** Status key plus a briefing counter (progress toward Cartographer). */
export function Legend({ read, total }: { read: number; total: number }) {
  return (
    <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
      <ul aria-label="Legend" className="text-dust flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {STATUS_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-2.5", accentBg[STATUS_META[status].accent])} />
            {STATUS_META[status].legend}
          </li>
        ))}
      </ul>
      <p className="font-pixel text-px-xs text-dust uppercase">
        Briefings read{" "}
        <span className={read === total ? "text-xp" : "text-coin"}>
          {read}/{total}
        </span>
      </p>
    </div>
  );
}
