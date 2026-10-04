"use client";

import type { RefObject } from "react";
import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { rightFixIndex, type PickedIncident } from "@/game/refinery/incidents";
import { INCIDENT_MS } from "@/game/refinery/scoring";
import type { IncidentAnswer } from "@/game/refinery/shift";
import { IncidentTimer } from "./incident-timer";
import { Kbd } from "./kbd";

const { incident: copy } = refineryCopy;
const MS_PER_S = 1000;

interface IncidentPanelProps {
  incident: PickedIncident;
  index: number;
  total: number;
  answer: IncidentAnswer | null;
  relaxed: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
  onResolve: (option: number | null) => void;
  onNext: () => void;
}

function optionTone(i: number, right: number, answer: IncidentAnswer | null): string {
  if (!answer) return "border-grid text-starlight hover:border-plasma hover:text-plasma";
  if (i === right) return "border-xp text-xp";
  return i === answer.option ? "border-danger text-danger" : "border-grid text-dust";
}

/** One production alert: log, three fixes (1-3), a clock unless relaxed, then the explanation. */
export function IncidentPanel({ incident, index, total, answer, relaxed, headingRef, nextRef, onResolve, onNext }: IncidentPanelProps) {
  const right = rightFixIndex(incident);
  const outcome = !answer ? null : answer.correct ? copy.resolved : answer.option === null ? copy.timeout : copy.wrong;
  return (
    <PixelCard className="border-danger flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-pixel text-px-xs bg-danger text-on-accent px-2 py-1 uppercase">{copy.alert}</span>
        <span className="font-pixel text-px-xs text-dust uppercase">{copy.counter(index + 1, total)}</span>
      </div>
      <h4 ref={headingRef} tabIndex={-1} className="font-pixel text-px-sm text-coin leading-relaxed uppercase focus:outline-none">
        {incident.spec.title}
      </h4>
      <pre className="border-grid bg-void text-dust border-2 p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap sm:text-sm">
        <code>{incident.spec.log.join("\n")}</code>
      </pre>
      <p className="text-dust">{relaxed ? copy.pick : copy.pickTimed(INCIDENT_MS / MS_PER_S)}</p>
      {relaxed ? null : <IncidentTimer runKey={incident.spec.id} active={!answer} onExpire={() => onResolve(null)} />}
      <ol className="flex flex-col gap-3">
        {incident.options.map((option, i) => (
          <li key={option.label}>
            <button
              type="button"
              disabled={answer !== null}
              aria-keyshortcuts={String(i + 1)}
              onClick={() => onResolve(i)}
              className={cn(
                "flex min-h-14 w-full cursor-pointer items-center gap-3 border-2 bg-transparent px-3 py-2 text-left disabled:cursor-default",
                optionTone(i, right, answer),
              )}
            >
              <Kbd className="shrink-0">{String(i + 1)}</Kbd>
              <span>{option.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        {answer ? (
          <p>
            <span className={cn("font-pixel text-px-xs mr-2 uppercase", answer.correct ? "text-xp" : "text-danger")}>
              {outcome}
            </span>
            {answer.correct ? null : (
              <span className="text-dust">
                {copy.rightFix} {incident.options[right]?.label}.{" "}
              </span>
            )}
            {incident.spec.explain}
          </p>
        ) : null}
      </div>
      {answer ? (
        <div>
          <button ref={nextRef} type="button" onClick={onNext} className={buttonClasses("coin", "min-h-14")}>
            {index + 1 < total ? copy.next : copy.finish}
          </button>
        </div>
      ) : null}
    </PixelCard>
  );
}
