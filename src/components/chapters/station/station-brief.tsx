import { PixelCard } from "@/components/ui/pixel-card";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { Tag } from "@/components/ui/tag";
import { DebriefTabs } from "@/components/shared/debrief/debrief-tabs";
import { debriefs } from "@/content/debriefs";
import { quests } from "@/content/quests";
import { stationCopy } from "@/content/station";

const role = quests.find((q) => q.id === "navayuga");

/** Pulsing "LIVE · IN PROGRESS" badge (the dot's ping is off under reduced motion via global CSS). */
function LiveBadge() {
  return (
    <span className="font-pixel text-px-xs text-on-accent bg-plasma inline-flex items-center gap-2 px-2 py-1 tracking-wider uppercase">
      <span aria-hidden className="relative grid size-2 place-items-center">
        <span className="bg-on-accent absolute inset-0 animate-ping opacity-75" />
        <span className="bg-on-accent relative size-2" />
      </span>
      {stationCopy.liveBadge}
    </span>
  );
}

/** The current role: facts from `quests` plus the shared mission debrief tabs. */
export function StationBrief() {
  if (!role) return null;
  return (
    <PixelCard
      as="article"
      accent="plasma"
      aria-labelledby="station-role-title"
      className="p-5 shadow-[0_0_0_1px_var(--plasma),6px_6px_0_0_var(--plasma)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LiveBadge />
        <span className="font-pixel text-px-xs text-dust uppercase">{stationCopy.briefTitle}</span>
      </div>
      <h3
        id="station-role-title"
        className="font-pixel text-px-sm sm:text-px-md mt-4 leading-relaxed uppercase"
      >
        {role.title} — <span className="text-plasma">{role.org}</span>
      </h3>
      <p className="text-coin mt-2 flex flex-wrap items-center gap-x-2 text-sm">
        <PixelIcon name="star" size={12} />
        <span>{role.location}</span>
        <span aria-hidden>·</span>
        <span>{role.period}</span>
      </p>
      <p className="text-dust mt-4 max-w-[70ch]">{role.summary}</p>
      <DebriefTabs debrief={debriefs.navayuga} />
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
        {role.tags.map((t) => (
          <li key={t}>
            <Tag>{t}</Tag>
          </li>
        ))}
      </ul>
    </PixelCard>
  );
}
