"use client";

import { useCallback, type MouseEvent } from "react";
import { useGame } from "@/providers/game-provider";
import { useDiscover } from "@/hooks/use-discover";
import { stationBootLines, stationCopy, stationGraph } from "@/content/station";
import { CHARGE_MS, finishCharge, startCharge, type ChargeResult } from "@/game/station/boot";
import { appendLog, appendLogs, type LogLine } from "@/game/station/log";
import { joinLabels, labelsFor, progress } from "@/game/station/power-up";
import type { StationState, StationStore } from "@/game/station/store";
import { centre } from "./station-effects";
import type { useTimers } from "./use-timers";

/** How long a short circuit's sparks and danger pulse stay up (ms). */
export const FAULT_MS = 1200;
const FAULT_TIMER = "fault";

export type PressKind = ChargeResult<StationState>["kind"];
type Timers = ReturnType<typeof useTimers>;
type NewLine = Omit<LogLine, "id">;

const labelOf = (id: string) => labelsFor(stationGraph, [id])[0] ?? id;

/**
 * Clicking a module: ready → charge (then online after CHARGE_MS, instantly when `instant`);
 * locked → a short circuit (sparks, danger pulse, NOVA hint). Reaching 8/8 records the
 * "station-online" discovery and reports a win.
 */
export function usePowerPress(station: StationStore, timers: Timers, instant: boolean) {
  const { bus, sfx } = useGame();
  const { trigger: discoverOnline } = useDiscover("station-online", {
    accent: "xp",
    fx: "confetti",
  });

  const comeOnline = useCallback(
    (id: string, el: HTMLElement) => {
      const r = finishCharge(stationGraph, station.getSnapshot(), id);
      if (r.kind !== "online") return;
      const lines: NewLine[] = [
        { source: id, text: stationBootLines[id] ?? stationCopy.status.online, tone: "ok" },
      ];
      if (r.complete)
        lines.push({
          source: stationCopy.log.station,
          text: stationCopy.log.allOnline,
          tone: "info",
        });
      station.update(() => ({ ...r.state, log: appendLogs(r.state.log, lines) }));

      const at = centre(el);
      sfx.play("select");
      bus.emit({ type: "fx", kind: "burst", ...at, accent: "plasma" });
      bus.emit({ type: "station:power", ...progress(stationGraph, r.state) });
      if (r.complete) {
        discoverOnline(at);
        bus.emit({ type: "fx", kind: "shake", ...at, accent: "xp" });
        bus.emit({ type: "game:result", game: "station", outcome: "win" });
      }
    },
    [station, sfx, bus, discoverOnline],
  );

  const short = useCallback(
    (id: string, missing: readonly string[]) => {
      const names = joinLabels(labelsFor(stationGraph, missing));
      sfx.play("short");
      station.update((s) => ({
        ...s,
        fault: { target: id, blockers: missing, nonce: s.log.seq },
        log: appendLog(s.log, { source: id, text: stationCopy.log.blocked(names), tone: "error" }),
      }));
      timers.schedule(FAULT_TIMER, FAULT_MS, () =>
        station.update((s) => (s.fault ? { ...s, fault: null } : s)),
      );
      bus.emit({ type: "nova:say", text: stationCopy.upstreamHint(labelOf(id), names) });
    },
    [station, sfx, bus, timers],
  );

  return useCallback(
    (id: string, event: MouseEvent<HTMLButtonElement>): PressKind => {
      const el = event.currentTarget;
      const r = startCharge(stationGraph, station.getSnapshot(), id);
      if (r.kind === "locked") short(id, r.missing);
      if (r.kind !== "charging") return r.kind;

      station.update(() => r.state);
      sfx.play("power-up");
      if (instant) comeOnline(id, el);
      else timers.schedule(`charge:${id}`, CHARGE_MS, () => comeOnline(id, el));
      return r.kind;
    },
    [station, sfx, timers, instant, short, comeOnline],
  );
}
