"use client";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { stationCopy, stationDemo, stationGraph } from "@/content/station";
import { progress } from "@/game/station/power-up";
import { BootLog } from "./boot-log";
import { PowerMeter } from "./power-meter";
import { StationDiagram } from "./station-diagram";
import { FinaleTeaser, StationFinale } from "./station-finale";
import { useStation } from "./use-station";

/** "Power up the station": the CH4 centrepiece. Lazy-loaded (see power-up-lazy.tsx). */
export default function PowerUpPanel() {
  const { state, press, runSync, reset, reduced } = useStation();
  const { online, total } = progress(stationGraph, state);
  const complete = online === total;
  const pristine = online === 0 && state.charging.size === 0;

  return (
    <div className="flex flex-col gap-6">
      <PowerMeter online={online} total={total} />

      <div className="bg-nebula border-grid relative border-2 p-4 sm:p-6">
        <StationDiagram state={state} animate={!reduced} onPress={press} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
        <BootLog log={state.log} />
        {complete ? (
          <StationFinale sync={state.sync} animate={!reduced} onRun={runSync} />
        ) : (
          <FinaleTeaser online={online} total={total} />
        )}
      </div>

      {/* One quiet announcement for the finale (the meter already announces each module). */}
      <p role="status" className="sr-only">
        {state.sync.phase === "done" ? stationDemo.summary : ""}
      </p>

      <PixelButton variant="ghost" onClick={reset} disabled={pristine} className="self-start">
        <PixelIcon name="bolt" size={12} />
        {stationCopy.reset}
      </PixelButton>
    </div>
  );
}
