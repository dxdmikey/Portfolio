/**
 * Decides whether a pointerdown landed on "empty" page background (sky, margins, plain
 * text) and should get a star ping. Interactive and editable things keep their own
 * behaviour; so do selections, dialogs and modified clicks.
 */
const PRIMARY_BUTTON = 0;
const OPT_OUT = [
  "button",
  "a[href]",
  "[role='button']",
  "summary",
  "label",
  "input",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false'])",
  "dialog",
  "[role='dialog']",
  "[aria-modal='true']",
  "[data-fx]",
  "[data-no-ping]",
].join(", ");

export function isBackgroundClick(e: PointerEvent): boolean {
  if (e.button !== PRIMARY_BUTTON || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return false;
  const root = document.documentElement;
  if (root.dataset.quick !== undefined) return false;
  const target = e.target instanceof Element ? e.target : null;
  if (!target || target.closest(OPT_OUT)) return false;
  const selection = window.getSelection();
  return !selection || selection.isCollapsed;
}
