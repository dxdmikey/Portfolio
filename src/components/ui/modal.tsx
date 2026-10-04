"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PixelIcon } from "./pixel-icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Native <dialog>: focus trapping, Esc-to-close and inert background come from the browser.
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "bg-nebula text-starlight border-plasma m-auto max-h-[90dvh] w-[min(56rem,calc(100vw-2rem))] border-2 p-0 shadow-[6px_6px_0_0_var(--plasma)]",
        "backdrop:bg-void/80 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      {open ? (
        <div className="relative max-h-[90dvh] overflow-y-auto p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-dust hover:text-danger absolute top-3 right-3 grid size-11 cursor-pointer place-items-center"
          >
            <PixelIcon name="close" size={14} />
          </button>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
