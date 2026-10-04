import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom theme scales, otherwise it mistakes
 * `text-px-sm` (a font size) for a text colour and drops it next to `text-plasma`.
 * Keep in sync with `--text-px-*` and `--shadow-pixel*` in globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["px-xs", "px-sm", "px-md", "px-lg", "px-xl", "px-2xl", "px-3xl"],
      shadow: ["pixel", "pixel-sm"],
    },
  },
});

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
