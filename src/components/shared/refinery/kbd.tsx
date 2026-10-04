import { cn } from "@/lib/cn";

/** A keyboard-shortcut chip. Decorative inside buttons (the button's aria-keyshortcuts says it). */
export function Kbd({ children, className }: { children: string; className?: string }) {
  return (
    <kbd aria-hidden className={cn("font-pixel text-px-xs border border-current px-1.5 py-0.5", className)}>
      {children}
    </kbd>
  );
}
