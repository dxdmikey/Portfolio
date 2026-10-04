"use client";

import type { MouseEvent, ReactNode } from "react";
import { useAnimate } from "motion/react";
import { cn } from "@/lib/cn";
import { PixelIcon, type GlyphName } from "@/components/ui/pixel-icon";
import type { BootStatus } from "@/game/station/boot";
import { ChargeRing } from "./charge-ring";
import type { PressKind } from "./use-power-press";

/** Side-to-side wobble for "not yet" clicks (px). */
const SHAKE_X = [0, -6, 6, -4, 4, -2, 0];
const SHAKE_S = 0.35;

const LOOK: Record<BootStatus, { box: string; icon: GlyphName; iconClass: string }> = {
  locked: { box: "border-grid text-dust bg-nebula", icon: "lock", iconClass: "text-dust" },
  ready: {
    box: "border-coin text-starlight bg-nebula hover:bg-nebula-2",
    icon: "bolt",
    iconClass: "text-coin",
  },
  charging: {
    box: "border-plasma text-starlight bg-nebula-2",
    icon: "bolt",
    iconClass: "text-plasma animate-blink",
  },
  online: {
    box: "border-xp text-starlight bg-nebula-2 shadow-[0_0_0_2px_var(--xp),4px_4px_0_0_var(--xp)]",
    icon: "star",
    iconClass: "text-xp",
  },
};

/** Batch passing through during the sync: amber glow over whatever the status look is. */
const SYNCING = "border-coin shadow-[0_0_0_2px_var(--coin),4px_4px_0_0_var(--coin)]";
/** An offline dependency someone just tried to skip. */
const FAULT = "border-danger shadow-[0_0_0_2px_var(--danger)] animate-pulse";

interface StationModuleProps {
  id: string;
  label: string;
  detail: string;
  status: BootStatus;
  /** Spoken + tooltip status, e.g. "ready to power" or "locked: power ERP first". */
  statusText: string;
  /** This module is the offline dependency of a short circuit. */
  fault: boolean;
  /** The sync batch is in this module right now. */
  syncing: boolean;
  /** Optional live display (lake layers, chart, chat). */
  readout?: ReactNode;
  animate: boolean;
  onPress: (id: string, event: MouseEvent<HTMLButtonElement>) => PressKind;
}

/** One station module: a real button whose accessible name carries its power state. */
export function StationModule(props: StationModuleProps) {
  const { id, label, detail, status, statusText, fault, syncing, readout, animate, onPress } =
    props;
  const [scope, animateEl] = useAnimate<HTMLButtonElement>();
  const look = LOOK[status];

  const click = (event: MouseEvent<HTMLButtonElement>) => {
    const kind = onPress(id, event);
    if (kind === "locked" && animate && scope.current) {
      void animateEl(scope.current, { x: SHAKE_X }, { duration: SHAKE_S });
    }
  };

  return (
    <button
      ref={scope}
      type="button"
      data-node={id}
      data-status={status}
      aria-busy={status === "charging" || undefined}
      onClick={click}
      className={cn(
        "group shadow-pixel-sm relative z-10 flex min-h-20 w-full cursor-pointer flex-col items-start gap-1 border-2 p-3 text-left transition-[background-color,box-shadow,border-color] duration-200",
        look.box,
        syncing && SYNCING,
        fault && FAULT,
      )}
    >
      {status === "ready" && animate ? (
        <span
          aria-hidden
          className="border-coin pointer-events-none absolute -inset-1 animate-pulse border-2"
        />
      ) : null}
      {status === "charging" && animate ? <ChargeRing /> : null}
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-pixel text-px-xs uppercase">{label}</span>
        <PixelIcon name={look.icon} size={12} className={look.iconClass} />
      </span>{" "}
      <span className="text-dust text-sm leading-snug">{detail}</span> {readout}
      <span className="sr-only">{`— ${statusText}`}</span>
      <span
        aria-hidden
        className="bg-void border-grid text-starlight font-pixel text-px-xs pointer-events-none absolute top-full left-0 z-20 mt-2 w-max max-w-full border-2 px-2 py-1.5 leading-relaxed uppercase opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {statusText}
      </span>
    </button>
  );
}
