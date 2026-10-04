"use client";

import dynamic from "next/dynamic";

/**
 * Decorative/companion layers that aren't needed for first paint. Code-split and
 * mounted client-side after hydration, so they don't compete with the story content.
 */
const PlayerShip = dynamic(() => import("./player-ship").then((m) => m.PlayerShip), { ssr: false });
const FxLayer = dynamic(() => import("./fx-layer").then((m) => m.FxLayer), { ssr: false });
const NovaDock = dynamic(() => import("@/components/nova/nova-dock").then((m) => m.NovaDock), {
  ssr: false,
});
const BlockCursor = dynamic(
  () => import("@/components/effects/block-cursor").then((m) => m.BlockCursor),
  {
    ssr: false,
  },
);

export function DeferredLayers() {
  return (
    <>
      <PlayerShip />
      <FxLayer />
      <NovaDock />
      <BlockCursor />
    </>
  );
}
