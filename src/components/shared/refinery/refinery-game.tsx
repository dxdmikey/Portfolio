"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { currentIncident, tankLevels } from "@/game/refinery/shift";
import type { Choice } from "@/game/refinery/types";
import { BriefingCard } from "./briefing-card";
import { IncidentPanel } from "./incident-panel";
import { RelaxedToggle } from "./relaxed-toggle";
import { ReportCard } from "./report-card";
import { RunningPanel } from "./running-panel";
import { ShiftHud } from "./shift-hud";
import { StartPanel } from "./start-panel";
import { Tanks } from "./tanks";
import { useRelaxed } from "./use-relaxed";
import { useShift } from "./use-shift";

const KEY_TO_CHOICE: Record<string, Choice> = { p: "promote", q: "quarantine" };

/** The Refinery: a pipeline on-call shift. Three levels on the conveyor, an incident round, then the report. */
export function RefineryGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLElement | null>(null);
  const beginRef = useRef<HTMLButtonElement>(null);
  const promoteRef = useRef<HTMLButtonElement>(null);
  const incidentRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const reportRef = useRef<HTMLHeadingElement>(null);
  const { relaxed, setRelaxed, reducedMotion } = useRelaxed();
  const shift = useShift({ rootRef, focusRefs: [focusRef, incidentRef] });
  const { state } = shift;
  const incident = currentIncident(state);
  const answered = state.incidentAnswer !== null;

  // Keep keyboard focus inside the game as panels swap (focus only, no state updates).
  useEffect(() => {
    if (state.phase === "briefing") beginRef.current?.focus();
    if (state.phase === "running") promoteRef.current?.focus();
    if (state.phase === "incident") (answered ? nextRef : incidentRef).current?.focus();
    if (state.phase === "report") reportRef.current?.focus();
  }, [state.phase, state.stage, state.seed, state.incidentIndex, answered]);

  /** P / Q and 1-3, scoped to the game panel so they never hijack typing elsewhere. */
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    const key = e.key.toLowerCase();
    const choice = KEY_TO_CHOICE[key];
    if (state.phase === "running" && choice) {
      e.preventDefault();
      shift.decide(choice);
      return;
    }
    const option = Number(key) - 1;
    if (incident && !answered && Number.isInteger(option) && option >= 0 && option < incident.options.length) {
      e.preventDefault();
      shift.resolve(option);
    }
  };

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex flex-col gap-5">
      <RelaxedToggle relaxed={relaxed} onChange={setRelaxed} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {state.phase === "idle" ? <StartPanel best={shift.best} onStart={shift.start} /> : <ShiftHud state={state} reducedMotion={reducedMotion} />}
          {state.phase === "briefing" ? (
            <BriefingCard stage={state.stage} relaxed={relaxed} beginRef={beginRef} onBegin={shift.begin} />
          ) : null}
          {state.phase === "running" ? (
            <RunningPanel
              state={state}
              relaxed={relaxed}
              reducedMotion={reducedMotion}
              anchorRef={focusRef}
              promoteRef={promoteRef}
              onDecide={shift.decide}
              onSlip={shift.slip}
            />
          ) : null}
          {incident ? (
            <IncidentPanel
              incident={incident}
              index={state.incidentIndex}
              total={state.incidents.length}
              answer={state.incidentAnswer}
              relaxed={relaxed}
              headingRef={incidentRef}
              nextRef={nextRef}
              onResolve={shift.resolve}
              onNext={shift.nextIncident}
            />
          ) : null}
          {state.phase === "report" && state.result ? (
            <ReportCard
              result={state.result}
              misses={state.misses}
              best={shift.best}
              newBest={shift.newBest}
              headingRef={reportRef}
              onRetry={shift.retry}
              onNewShift={shift.newShift}
            />
          ) : null}
        </div>
        <Tanks
          levels={tankLevels(state)}
          gold={state.result?.outcome === "win"}
          answered={state.stats.processed}
          lastChoice={state.last?.choice}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
