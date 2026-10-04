"use client";

import dynamic from "next/dynamic";

/** Lazy-loaded: the game's code only ships once this chapter renders on the client. */
const RefineryGame = dynamic(
  () => import("@/components/shared/refinery/refinery-game").then((m) => m.RefineryGame),
  { ssr: false, loading: () => <div className="min-h-64" aria-hidden /> },
);

export function RefineryEmbed() {
  return <RefineryGame />;
}
