"use client";

import { useEffect, useState } from "react";

const FIELD = "input, textarea, select, [contenteditable='true']";

/**
 * True while a text field has focus. NOVA steps aside then, so the dock never sits on top of
 * the field (or under a phone's on-screen keyboard) while the visitor is typing.
 */
export function useFieldFocus(): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof Element && t.matches(FIELD);
    const onIn = (e: FocusEvent) => setFocused(isField(e.target));
    const onOut = (e: FocusEvent) => {
      if (!isField(e.relatedTarget)) setFocused(false);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  return focused;
}
