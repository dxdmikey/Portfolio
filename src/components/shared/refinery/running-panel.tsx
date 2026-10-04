"use client";

import type { RefObject } from "react";
import { levelAt } from "@/game/refinery/levels";
import { currentRecord, type ShiftState } from "@/game/refinery/shift";
import type { Choice } from "@/game/refinery/types";
import { Conveyor, type ExitDirection } from "./conveyor";
import { DecisionButtons } from "./decision-buttons";
import { KeyLedger } from "./key-ledger";
import { VerdictLine } from "./verdict-line";

interface RunningPanelProps {
  state: ShiftState;
  relaxed: boolean;
  reducedMotion: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  promoteRef: RefObject<HTMLButtonElement | null>;
  onDecide: (choice: Choice) => void;
  onSlip: () => void;
}

function exitFor(state: ShiftState): ExitDirection {
  const choice = state.last?.choice;
  if (choice === "promote") return "up";
  return choice === "quarantine" ? "down" : "right";
}

/** A level in play: the belt, the dedupe ledger (when duplicates count), the two verdicts and the last verdict. */
export function RunningPanel({ state, relaxed, reducedMotion, anchorRef, promoteRef, onDecide, onSlip }: RunningPanelProps) {
  const record = currentRecord(state);
  const level = levelAt(state.stage);
  if (!record || !level || !state.batch) return null;
  const checksLateData = level.defects.includes("late-arriving");
  const checksDuplicates = level.defects.includes("duplicate-id");
  return (
    <div className="flex flex-col gap-4">
      <Conveyor
        record={record}
        recordKey={`${state.seed}-${state.stage}-${record.position}`}
        total={state.batch.records.length}
        runDate={state.batch.runDate}
        watermark={checksLateData ? state.batch.watermark : null}
        travelMs={level.travelMs}
        relaxed={relaxed}
        reducedMotion={reducedMotion}
        exit={exitFor(state)}
        anchorRef={anchorRef}
        onSlip={onSlip}
      />
      {checksDuplicates ? <KeyLedger seen={state.batch.records.slice(0, state.cursor)} /> : null}
      <DecisionButtons onChoose={onDecide} promoteRef={promoteRef} />
      <VerdictLine last={state.last?.stage === state.stage ? state.last : null} />
    </div>
  );
}
