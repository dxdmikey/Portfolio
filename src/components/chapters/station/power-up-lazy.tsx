"use client";

import dynamic from "next/dynamic";
import { stationCopy } from "@/content/station";

/** Same footprint as the panel, so nothing jumps when the chunk arrives. */
function Booting() {
  return (
    <p className="bg-nebula border-grid text-dust font-pixel text-px-xs grid min-h-[28rem] place-items-center border-2 uppercase">
      {stationCopy.booting}
    </p>
  );
}

/** Code-split: the power-up game ships in its own chunk, prerendered for the static HTML. */
export const PowerUpLazy = dynamic(() => import("./power-up-panel"), { loading: Booting });
