import type { Accent } from "@/types/content";

/** Static class maps so Tailwind can see every class at build time. */
export const accentText: Record<Accent, string> = {
  plasma: "text-plasma",
  xp: "text-xp",
  coin: "text-coin",
  warp: "text-warp",
};

export const accentBg: Record<Accent, string> = {
  plasma: "bg-plasma",
  xp: "bg-xp",
  coin: "bg-coin",
  warp: "bg-warp",
};

export const accentBorder: Record<Accent, string> = {
  plasma: "border-plasma",
  xp: "border-xp",
  coin: "border-coin",
  warp: "border-warp",
};
