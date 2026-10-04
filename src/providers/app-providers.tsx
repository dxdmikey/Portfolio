"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { GameProvider } from "./game-provider";
import { UiProvider } from "./ui-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <GameProvider>
        <UiProvider>{children}</UiProvider>
      </GameProvider>
    </ThemeProvider>
  );
}
