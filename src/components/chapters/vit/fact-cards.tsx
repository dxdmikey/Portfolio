import { motion } from "motion/react";
import { craters, vitCopy } from "@/content/vit";
import { PixelCard } from "@/components/ui/pixel-card";
import { accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";

export const factId = (key: string) => `vit-fact-${key}`;

/** The reveal column: one slot per crater, a locked placeholder until it is opened. */
export function FactCards({ opened, reduced }: { opened: ReadonlySet<string>; reduced: boolean }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
      {craters.map((c) => {
        const open = opened.has(c.key);
        return (
          <li key={c.key} id={factId(c.key)}>
            {open ? (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <PixelCard accent={c.accent} className="p-4">
                  <p className={cn("font-pixel text-px-xs uppercase", accentText[c.accent])}>
                    {c.label}
                  </p>
                  <p className="mt-2">{c.value}</p>
                </PixelCard>
              </motion.div>
            ) : (
              <div className="border-grid text-dust min-h-[4.5rem] border-2 border-dashed p-4 text-sm">
                {vitCopy.locked}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
