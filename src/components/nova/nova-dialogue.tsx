"use client";

import { PixelIcon, type GlyphName } from "@/components/ui/pixel-icon";
import { novaCopy } from "@/content/nova";
import { Typewriter } from "./typewriter";
import type { SpokenLine } from "./use-nova";

interface NovaDialogueProps {
  line: SpokenLine;
  instant: boolean;
  onDone: () => void;
  onHide: () => void;
  onMute: () => void;
}

function BoxButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: GlyphName;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-dust hover:text-plasma pointer-events-auto grid size-11 shrink-0 cursor-pointer place-items-center"
    >
      <PixelIcon name={icon} size={12} />
    </button>
  );
}

/**
 * RPG dialogue box with a "NOVA" name tag on its top border. The typed text is visual only
 * (aria-hidden) and wraps around the mute/hide buttons, so the box stays a few lines tall on phones.
 * The box is click-through (pointer-events-none from the dock) so it never blocks the page;
 * only the mute/hide buttons take pointer input.
 */
export function NovaDialogue({ line, instant, onDone, onHide, onMute }: NovaDialogueProps) {
  return (
    <div className="bg-nebula border-plasma relative mt-3 w-[min(22rem,calc(100vw-4.75rem))] border-2 shadow-[4px_4px_0_0_var(--plasma)]">
      <span
        aria-hidden
        className="font-pixel text-px-xs text-on-accent bg-plasma absolute -top-2.5 left-2 px-1.5 py-1 uppercase"
      >
        {novaCopy.name}
      </span>
      <span className="float-right flex">
        <BoxButton label={novaCopy.mute} icon="mute" onClick={onMute} />
        <BoxButton label={novaCopy.hide} icon="close" onClick={onHide} />
      </span>
      <p
        aria-hidden
        className="text-starlight px-3 pt-3 pb-2.5 text-sm leading-snug sm:min-h-[3lh] sm:pb-3 sm:text-base"
      >
        <Typewriter key={line.id} text={line.text} instant={instant} onDone={onDone} />
      </p>
    </div>
  );
}
