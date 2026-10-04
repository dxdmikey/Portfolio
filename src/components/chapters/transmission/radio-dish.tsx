"use client";

import type { MouseEvent } from "react";
import { transmission } from "@/content/transmission";
import { cn } from "@/lib/cn";
import { DishArt } from "./dish-art";

export type SignalStage = "idle" | "sending" | "sent";

const DISH_PX = 168;
const RINGS = 3;

interface RadioDishProps {
  stage: SignalStage;
  onSend: (e: MouseEvent<HTMLButtonElement>) => void;
}

/** The big pixel dish is the "Send a signal" button. Beam and square rings fire upward. */
export function RadioDish({ stage, onSend }: RadioDishProps) {
  const transmitting = stage !== "idle";
  const label =
    stage === "idle"
      ? transmission.dish.send
      : stage === "sending"
        ? transmission.dish.sending
        : transmission.dish.resend;
  return (
    <div className="flex flex-col items-center">
      <div aria-hidden className="relative h-28 w-full">
        {transmitting ? (
          <div key={stage} className="absolute inset-x-0 bottom-0 flex justify-center">
            <span className="signal-beam bg-plasma block h-28 w-2" />
            {Array.from({ length: RINGS }, (_, i) => (
              <span
                key={i}
                className="signal-ring border-plasma absolute bottom-0 block size-10 border-2"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onSend}
        aria-disabled={stage === "sending"}
        data-fx-accent="plasma"
        className="group flex min-h-11 cursor-pointer flex-col items-center gap-4 p-2 aria-disabled:cursor-progress"
      >
        <span className="transition-transform duration-150 group-hover:-translate-y-1">
          <DishArt width={DISH_PX} aimed={transmitting} />
        </span>
        <span
          className={cn(
            "font-pixel text-px-sm border-2 px-4 py-3 uppercase shadow-[4px_4px_0_0_var(--plasma)] transition-colors",
            stage === "sent"
              ? "border-grid text-dust group-hover:text-plasma shadow-none"
              : "border-plasma text-plasma group-hover:bg-plasma group-hover:text-on-accent",
          )}
        >
          {label}
        </span>
      </button>
      <p className="text-dust mt-3 text-sm">
        {stage === "sent" ? transmission.dish.sent : transmission.dish.hint}
      </p>
    </div>
  );
}
