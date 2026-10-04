"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PixelIcon, type GlyphName } from "@/components/ui/pixel-icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfx } from "@/hooks/use-sfx";
import { debriefCopy } from "@/content/debriefs";
import { cn } from "@/lib/cn";
import type { QuestDebrief } from "@/types/content";
import { Highlights } from "./highlights";
import { LootGrid } from "./loot-grid";

type TabId = keyof typeof debriefCopy.tabs;
const TABS: readonly { id: TabId; icon: GlyphName }[] = [
  { id: "mission", icon: "scroll" },
  { id: "role", icon: "user" },
  { id: "moves", icon: "bolt" },
  { id: "loot", icon: "chest" },
];
const SLIDE_PX = 12;
const TAB_S = 0.2;
const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

function Panel({ id, debrief }: { id: TabId; debrief: QuestDebrief }) {
  if (id === "mission") return <p className="max-w-[70ch]">{debrief.mission}</p>;
  if (id === "role") return <p className="max-w-[70ch]">{debrief.role}</p>;
  if (id === "moves") return <Highlights items={debrief.moves} />;
  return <LootGrid loot={debrief.loot} inProgress={debrief.inProgress} />;
}

/** Four-tab mission debrief. Roving tabindex + arrow keys per the WAI-ARIA tabs pattern. */
export function DebriefTabs({ debrief }: { debrief: QuestDebrief }) {
  const [active, setTab] = useState<TabId>("mission");
  const reduced = useReducedMotion();
  const uid = useId();
  const { play } = useSfx();
  const setActive = (id: TabId) => {
    if (id !== active) play("blip");
    setTab(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEP[e.key];
    if (!step) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === active);
    const next = TABS[(i + step + TABS.length) % TABS.length]?.id;
    if (!next) return;
    setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <div className="mt-5">
      <div
        role="tablist"
        aria-label={debriefCopy.tabsAria}
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2"
      >
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            id={`${uid}-tab-${id}`}
            role="tab"
            type="button"
            aria-selected={active === id}
            aria-controls={`${uid}-panel`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => setActive(id)}
            className={cn(
              "font-pixel text-px-xs flex min-h-11 items-center gap-2 border-2 px-3 uppercase transition-colors",
              active === id
                ? "border-coin bg-coin text-on-accent"
                : "border-grid text-dust hover:text-starlight",
            )}
          >
            <PixelIcon name={icon} size={14} />
            {debriefCopy.tabs[id]}
          </button>
        ))}
      </div>
      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${active}`}
        className="bg-void border-grid mt-3 min-h-28 border-2 p-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, x: SLIDE_PX }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -SLIDE_PX }}
            transition={{ duration: TAB_S }}
          >
            <Panel id={active} debrief={debrief} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
