import type { GameEvent } from "@/types/events";
import type { NovaDirector, NovaLine } from "./director";

type ResultEvent = Extract<GameEvent, { type: "game:result" }>;

/** Placeholder in `revisitLines`, replaced with the chapter's label. */
export const CHAPTER_PLACEHOLDER = "{chapter}";

/** Everything NOVA can say, injected so the mapping stays testable and content-agnostic. */
export interface NovaScript {
  /** A short hello, merged in front of the first chapter line NOVA says (one line, never two). */
  greeting: string;
  chapterLines: Readonly<Record<string, readonly string[]>>;
  /** Rotating "back at {chapter}" lines for chapters whose intros are all used up. */
  revisitLines: readonly string[];
  /** Human label for a chapter id (fills `{chapter}`). */
  chapterLabel: (chapter: string) => string;
  /** First-discovery reaction for a discovery id. */
  discoveryLine: (id: string) => string | undefined;
  resultLines: Readonly<Record<ResultEvent["game"], Readonly<Record<ResultEvent["outcome"], readonly string[]>>>>;
  /** Idle tips and jokes, alternated when the visitor clicks NOVA. */
  idleLines: readonly string[];
}

const line = (text: string | null | undefined, priority: NovaLine["priority"], repeatable = false): NovaLine | null =>
  text ? { text, priority, repeatable } : null;

/** Next rotating "back at {chapter}" line (repeatable; the template is marked, not the filled text). */
function revisitLine(chapter: string, s: NovaScript, d: NovaDirector): NovaLine | null {
  const template = d.pickCycling(s.revisitLines);
  if (!template) return null;
  const text = template.split(CHAPTER_PLACEHOLDER).join(s.chapterLabel(chapter));
  return { text, priority: "chapter", chapter, repeatable: true, marks: [template] };
}

/** The next unused intro for a chapter (or a revisit line), with the greeting merged in the first time. */
function chapterLine(chapter: string, s: NovaScript, d: NovaDirector): NovaLine | null {
  const fresh = d.pickUnspoken(s.chapterLines[chapter] ?? []);
  const base: NovaLine | null = fresh ? { text: fresh, priority: "chapter", chapter } : revisitLine(chapter, s, d);
  if (!base || !s.greeting || d.hasSpoken(s.greeting)) return base;
  return { ...base, text: `${s.greeting} ${base.text}`, marks: [...(base.marks ?? []), base.text, s.greeting] };
}

type Candidates = (NovaLine | null)[];
type Handlers = {
  [T in GameEvent["type"]]: (event: Extract<GameEvent, { type: T }>, script: NovaScript, director: NovaDirector) => Candidates;
};

/** One handler per event type (a registry, so adding an event never touches a switch). */
const HANDLERS: Handlers = {
  "chapter:enter": (e, s, d) => [chapterLine(e.chapter, s, d)],
  discover: (e, s) => [e.first ? line(s.discoveryLine(e.id), "discovery") : null],
  "game:result": (e, s, d) => [line(d.pickCycling(s.resultLines[e.game][e.outcome]), "result", true)],
  "nova:say": (e) => [line(e.text, "direct", true)],
  fx: () => [],
  // The station speaks for itself (it sends its own `nova:say` lines).
  "station:power": () => [],
  "station:sync": () => [],
};

/**
 * Turn a bus event into zero or more candidate lines (in the order they should be offered).
 * The director then applies priority, cooldown and no-repeat rules.
 */
export function linesForEvent(event: GameEvent, script: NovaScript, director: NovaDirector): NovaLine[] {
  const handler = HANDLERS[event.type] as (e: GameEvent, s: NovaScript, d: NovaDirector) => Candidates;
  return handler(event, script, director).filter((l): l is NovaLine => l !== null);
}

/** What NOVA says when clicked: the next idle tip or joke, cycling forever. */
export function idleLine(script: NovaScript, director: NovaDirector): NovaLine | null {
  return line(director.pickCycling(script.idleLines), "idle", true);
}
