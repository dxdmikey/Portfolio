"use client";

import { Highlights } from "@/components/shared/debrief/highlights";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { nebulaCopy, type Satellite, type Station } from "@/content/nebula";
import { DebriefTabs } from "@/components/shared/debrief/debrief-tabs";
import { debriefById, questById } from "./quest-lookup";

function Meta({ location, period }: { location: string; period: string }) {
  return (
    <p className="text-coin mt-2 flex flex-wrap items-center gap-x-2 text-sm">
      <PixelIcon name="star" size={12} />
      <span>{location}</span>
      <span aria-hidden>·</span>
      <span>{period}</span>
    </p>
  );
}

export function StationPanel({ station }: { station: Station }) {
  const quest = questById(station.questId);
  const debrief = debriefById(quest.id);
  return (
    <PixelCard as="article" accent={station.accent} className="p-5 sm:p-6">
      <StatusBadge accent={station.accent}>{station.name}</StatusBadge>
      <h3 className="font-pixel text-px-sm sm:text-px-md mt-4 leading-relaxed uppercase">
        {quest.title} — <span className="text-plasma">{quest.org}</span>
      </h3>
      <Meta location={quest.location} period={quest.period} />
      <p className="text-dust mt-4 max-w-[70ch]">{quest.summary}</p>
      {debrief ? (
        <DebriefTabs debrief={debrief} />
      ) : (
        <div className="mt-4">
          <Highlights items={quest.highlights} />
        </div>
      )}
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
        {quest.tags.map((t) => (
          <li key={t}>
            <Tag>{t}</Tag>
          </li>
        ))}
      </ul>
    </PixelCard>
  );
}

interface SatPanelProps {
  sat: Satellite;
  station: Station;
  onBack: () => void;
}

export function SatellitePanel({ sat, station, onBack }: SatPanelProps) {
  const quest = questById(station.questId);
  const sub = quest.subQuests?.[sat.subIndex];
  if (!sub) return null;
  return (
    <PixelCard as="article" accent={station.accent} className="p-5 sm:p-6">
      <StatusBadge accent={station.accent}>{nebulaCopy.subMissionTag}</StatusBadge>
      <h3 className="font-pixel text-px-sm sm:text-px-md mt-4 leading-relaxed uppercase">
        {sub.title}
      </h3>
      <Meta location={`${station.name}, ${quest.org}`} period={sub.period} />
      <h4 className="font-pixel text-px-xs text-dust mt-5 mb-3 uppercase">
        {nebulaCopy.highlightsHeading}
      </h4>
      <Highlights items={sub.highlights} />
      <PixelButton variant="ghost" className="mt-5" onClick={onBack}>
        {nebulaCopy.backToMission}
      </PixelButton>
    </PixelCard>
  );
}
