"use client";

import { useTheme } from "next-themes";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useSfx } from "@/hooks/use-sfx";
import { IconButton } from "./icon-button";
import { useMounted } from "./use-mounted";

/** Night ⇄ day mode. Renders a neutral placeholder until the stored theme is known. */
export function ThemeToggle() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const { play } = useSfx();

  if (!mounted) return <IconButton aria-label="Toggle theme" disabled className="opacity-50" />;

  const isLight = resolvedTheme === "light";
  const toggle = () => {
    const next = isLight ? "dark" : "light";
    setTheme(next);
    play("toggle");
  };

  return (
    <IconButton
      aria-label={isLight ? "Switch to night mode" : "Switch to day mode"}
      onClick={toggle}
    >
      <PixelIcon name={isLight ? "moon" : "sun"} size={16} />
    </IconButton>
  );
}
