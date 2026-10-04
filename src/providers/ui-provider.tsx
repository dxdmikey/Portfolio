"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Overlay = "none" | "star-chart";

interface UiState {
  overlay: Overlay;
  open: (overlay: Exclude<Overlay, "none">) => void;
  close: () => void;
}

const UiContext = createContext<UiState | null>(null);

/** Which full-screen overlay (star chart) is open. Only one at a time. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay>("none");
  const open = useCallback((o: Exclude<Overlay, "none">) => setOverlay(o), []);
  const close = useCallback(() => setOverlay("none"), []);
  const value = useMemo(() => ({ overlay, open, close }), [overlay, open, close]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiState {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside <UiProvider>");
  return ctx;
}
