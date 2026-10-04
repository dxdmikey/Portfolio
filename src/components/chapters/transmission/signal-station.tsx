"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ContactForm } from "./contact-form";
import { Frequencies } from "./frequencies";
import { RadioDish, type SignalStage } from "./radio-dish";

/** Dish aims (CSS 600ms) then the beam fires; must cover `dish-aim` + one beam cycle. */
const SEND_MS = 1400;

/**
 * The finale. The dish is an optional light show; the form and the links are always there.
 * Owns the one piece of shared state: has a signal gone out (from the dish or a sent message)?
 */
export function SignalStation() {
  const [stage, setStage] = useState<SignalStage>("idle");
  const reduced = useReducedMotion();
  const { trigger } = useDiscover("dish", { accent: "plasma", fx: "ripple", sound: "warp" });

  useEffect(() => {
    if (stage !== "sending") return;
    const t = window.setTimeout(() => setStage("sent"), reduced ? 0 : SEND_MS);
    return () => window.clearTimeout(t);
  }, [stage, reduced]);

  const fire = useCallback(() => setStage("sending"), []);

  const sendFromDish = (e: MouseEvent<HTMLButtonElement>) => {
    if (stage === "sending") return;
    trigger(e);
    fire();
  };

  return (
    <div>
      <div className="text-center">
        <RadioDish stage={stage} onSend={sendFromDish} />
      </div>
      <div className="mt-12 grid items-start gap-12 md:grid-cols-2">
        <ContactForm onSent={fire} />
        <Frequencies pinged={stage === "sent"} />
      </div>
    </div>
  );
}
