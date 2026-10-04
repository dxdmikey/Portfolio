import type { RefObject } from "react";
import { refineryCopy } from "@/content/refinery";
import { buttonClasses } from "@/components/ui/pixel-button";
import type { Choice } from "@/game/refinery/types";
import { Kbd } from "./kbd";

const { decision, keys } = refineryCopy;
const BIG = "min-h-14 w-full px-2 text-px-xs sm:text-px-sm";
const quarantineClasses = buttonClasses(
  "ghost",
  `${BIG} border-danger text-danger shadow-[4px_4px_0_0_var(--danger)] hover:bg-danger hover:text-on-accent hover:border-danger`,
);

interface DecisionButtonsProps {
  onChoose: (choice: Choice) => void;
  promoteRef: RefObject<HTMLButtonElement | null>;
}

/** The two verdicts, side by side even on phones (56px tall). P / Q are wired on the game panel. */
export function DecisionButtons({ onChoose, promoteRef }: DecisionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <button
        ref={promoteRef}
        type="button"
        aria-keyshortcuts={keys.promote}
        onClick={() => onChoose("promote")}
        className={buttonClasses("primary", BIG)}
      >
        {decision.promote} <Kbd>{keys.promote}</Kbd>
      </button>
      <button
        type="button"
        aria-keyshortcuts={keys.quarantine}
        onClick={() => onChoose("quarantine")}
        className={quarantineClasses}
      >
        {decision.quarantine} <Kbd>{keys.quarantine}</Kbd>
      </button>
    </div>
  );
}
