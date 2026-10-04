/** Small "scroll" cue pinned to the bottom of the title screen. Decorative; animation is CSS (reduced-motion aware). */
export function ScrollHint() {
  return (
    <div
      aria-hidden
      className="font-pixel text-px-xs text-dust absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      <span>scroll</span>
      <span className="scroll-hint text-plasma">▼</span>
    </div>
  );
}
