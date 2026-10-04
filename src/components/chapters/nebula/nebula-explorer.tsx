"use client";

import { useState } from "react";
import { nebulaCopy, satellites, stations } from "@/content/nebula";
import { SatellitePanel, StationPanel } from "./mission-panel";
import { StationSystem, type Selection } from "./station-system";

interface Active {
  stationId: string;
  selection: Selection;
}

const FIELD_BG = [
  "radial-gradient(circle at 22% 45%, color-mix(in srgb, var(--plasma) 20%, transparent), transparent 58%)",
  "radial-gradient(circle at 78% 55%, color-mix(in srgb, var(--warp) 22%, transparent), transparent 58%)",
  "radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--coin) 10%, transparent), transparent 60%)",
].join(", ");

/** The nebula field plus the debrief panel below it. First station is open by default. */
export function NebulaExplorer() {
  const first = stations[0];
  const [active, setActive] = useState<Active>({
    stationId: first?.id ?? "",
    selection: { kind: "station" },
  });
  const station = stations.find((s) => s.id === active.stationId) ?? first;
  if (!station) return null;
  const sat =
    active.selection.kind === "sat"
      ? satellites.find((s) => s.id === (active.selection as { id: string }).id)
      : undefined;

  return (
    <div>
      <p className="text-dust mb-3 text-sm">{nebulaCopy.stationHint}</p>
      <div
        role="group"
        aria-label={nebulaCopy.fieldAria}
        className="border-grid bg-void relative grid gap-4 border-2 p-4 sm:grid-cols-2"
        style={{ backgroundImage: FIELD_BG }}
      >
        <span
          aria-hidden
          className="font-pixel text-px-xs text-dust border-dust/60 absolute top-1/2 right-[25%] left-[25%] hidden -translate-y-px border-t-2 border-dashed sm:block"
        >
          <span className="bg-void absolute -top-2 left-1/2 -translate-x-1/2 px-2">
            {nebulaCopy.warpTrail} ▸
          </span>
        </span>
        {stations.map((s) => (
          <StationSystem
            key={s.id}
            station={s}
            sats={satellites.filter((x) => x.stationId === s.id)}
            selection={active.stationId === s.id ? active.selection : null}
            onSelect={(selection) => setActive({ stationId: s.id, selection })}
          />
        ))}
      </div>
      <div className="mt-6">
        {sat ? (
          <SatellitePanel
            key={sat.id}
            sat={sat}
            station={station}
            onBack={() => setActive({ stationId: station.id, selection: { kind: "station" } })}
          />
        ) : (
          <StationPanel key={station.id} station={station} />
        )}
      </div>
    </div>
  );
}
