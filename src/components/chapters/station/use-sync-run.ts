"use client";

import { useCallback, type MouseEvent } from "react";
import { useGame } from "@/providers/game-provider";
import { stationCopy, stationGraph, stationSyncStages } from "@/content/station";
import { appendLog, type BootLog } from "@/game/station/log";
import { isComplete } from "@/game/station/power-up";
import type { StationStore } from "@/game/station/store";
import { advanceSync, startSync, type SyncState } from "@/game/station/sync";
import { centre } from "./station-effects";
import type { useTimers } from "./use-timers";

const SYNC_TIMER = "sync";
type Timers = ReturnType<typeof useTimers>;

/** Log the stage the batch just entered (nothing once it's done). */
function logStage(log: BootLog, sync: SyncState): BootLog {
  if (sync.phase !== "running") return log;
  const stage = stationSyncStages[sync.stage];
  return stage
    ? appendLog(log, { source: stationCopy.log.sync, text: stage.line, tone: "sync" })
    : log;
}

/**
 * "Run first sync": walks the demo batch through every stage on a timer (all at once when
 * `instant`), rising pings per stage, then success, confetti, the sky event and a NOVA line.
 */
export function useSyncRun(station: StationStore, timers: Timers, instant: boolean) {
  const { bus, sfx } = useGame();

  const finish = useCallback(
    (el: HTMLElement) => {
      station.update((s) => ({
        ...s,
        log: appendLog(s.log, {
          source: stationCopy.log.sync,
          text: stationCopy.log.syncDone,
          tone: "ok",
        }),
      }));
      sfx.play("success");
      bus.emit({ type: "fx", kind: "confetti", ...centre(el), accent: "xp" });
      bus.emit({ type: "station:sync" });
      bus.emit({ type: "nova:say", text: stationCopy.sync.novaLine });
    },
    [station, sfx, bus],
  );

  /** Move to the next stage (pinging up the scale unless `quiet`); returns the new sync state. */
  const advance = useCallback(
    (quiet = false): SyncState => {
      const next = station.update((s) => {
        const sync = advanceSync(s.sync, stationSyncStages);
        return { ...s, sync, log: logStage(s.log, sync) };
      }).sync;
      if (next.phase === "running" && !quiet) sfx.play("ping", { degree: next.stage });
      return next;
    },
    [station, sfx],
  );

  const tick = useCallback(
    function step(el: HTMLElement) {
      const next = advance();
      const stage = next.phase === "running" ? stationSyncStages[next.stage] : undefined;
      if (stage) timers.schedule(SYNC_TIMER, stage.ms, () => step(el));
      else if (next.phase === "done") finish(el);
    },
    [advance, timers, finish],
  );

  return useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const el = event.currentTarget;
      const s = station.getSnapshot();
      const r = startSync(s.sync, isComplete(stationGraph, s), stationSyncStages);
      if (r.kind !== "started") return;
      station.update((x) => ({ ...x, sync: r.state, log: logStage(x.log, r.state) }));
      sfx.play("whoosh");

      if (instant) {
        let sync = r.state;
        while (sync.phase === "running") sync = advance(true);
        finish(el);
        return;
      }
      const first = stationSyncStages[0];
      if (first) timers.schedule(SYNC_TIMER, first.ms, () => tick(el));
    },
    [station, sfx, timers, instant, advance, tick, finish],
  );
}
