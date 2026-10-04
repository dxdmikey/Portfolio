# Coding standards

TypeScript strict, no `any`, no magic numbers (named consts or `lib/constants.ts`). Path alias `@/` -> `src/`. Prettier + tailwind plugin (`npm run format`).

## SOLID in this codebase
- **S (single responsibility)**: content (`src/content`) vs presentation (`src/components`) vs rules (`src/game`). Split examples:
  `shared/refinery/refinery-game.tsx` (layout) vs `use-shift.ts` (store + sound/FX/bus effects) vs `game/refinery/shift.ts` (pure state machine) and `cues.ts` (effect -> sound/FX table);
  `chapters/station/use-station.ts` composes `use-power-press`, `use-sync-run`, `use-timers` over the pure `game/station/*`.
- **O (open/closed)**: registries are data. New sound = union id + one entry in `game/audio/patches.ts`. New chapter = entry in `content/story.ts`. New discovery = entry in `content/discoveries.ts`.
  New Armory tool = entry in `content/inventory.ts` + one group in `inventoryGroups`. New Refinery level = a row in `game/refinery/levels.ts`; new incident = an entry in `content/refinery-incidents.ts`.
  New NOVA reaction = data in `content/nova.ts`. No `switch` on ids to extend behaviour (the NOVA script and the Refinery cues use handler records keyed by event/effect kind).
- **L (Liskov)**: anything implementing `KeyValueStore` (`createWebStore`, `createMemoryStore`) or `SfxPlayer` (`WebAudioSfx`, `silentSfx`) must be swappable with no caller change; both fail soft.
- **I (interface segregation)**: `KeyValueStore` is two methods; `ChapterWhoosh` needs only `Pick<SfxPlayer, "play" | "msSince">`; engines expose just `subscribe/getSnapshot` to React.
- **D (dependency inversion)**: services are constructed once in `GameProvider` and consumed via `useGame()`; engines take their environment or store in the constructor
  (`new AudioEngine(environment)`, `new StationStore(kv, key, graph)`, `new VisitTracker(ids, store)`), `BestScore`/`BriefingLog` take a store and optional key. Tests pass `createMemoryStore()` or a fake `AudioEnvironment`.

## Server vs client
Server Components by default (`layout.tsx`, `resume/page.tsx`, the quick-view components, chapter shells and static parts; interactive leaves that use discoveries or the bus are client components). `"use client"` only for state, effects, browser APIs, context.
Browser APIs only in effects/handlers. Reactive external state via `useSyncExternalStore` (see architecture.md).

## Testing strategy
- **Vitest unit** (`tests/unit/**/*.test.{ts,tsx}`, jsdom, globals, setup `tests/setup.ts`, alias `@`; render helper `tests/unit/support/render-with-game.tsx`): pure logic first, a few component tests. Existing groups:
  audio (`audio-engine`, `audio-sfx`, `audio-music`, `audio-call-sites`, fakes in `audio-fakes.ts`), NOVA (`nova-director`, `nova-scroll-spy`, `nova-dock`), station (`station-power-up`, `-boot`, `-sync`, `-store`, `-lights`, `-panel`),
  refinery (`refinery-shift`, `-rules`, `-generate`, `-best-score`, `-game`), `tech-inventory`, contact (`contact-submit`, `contact-form`), plus `fracture`, `fx-particles`, `fx-ping`, `galaxy`, `pixel-path`, `rng`,
  `scenes` (incl. the contrast rule), `story`, `content`, `storage`, `cn`, `use-discover-point`, `visit-tracker`, `voyage-b4a-content`.
  New logic in `src/game/` or `src/lib/` ships with a test; inject `createMemoryStore()`, fixed seeds and a fake clock (`NovaDirector` and `LookaheadScheduler` take the clock).
- **Playwright e2e + axe** (`tests/e2e/`: `fixtures.ts`, `home`, `chapters`, `hud`, `refinery`, `contact` (every Web3Forms request is intercepted with `page.route`, so tests never send real email), `a11y`, `resume` specs; config `playwright.config.ts`): runs against the static export served by
  `npx serve out -l 4173`; projects `desktop` (Desktop Chrome) and `mobile` (Pixel 7). Needs a fresh `npm run build` first. The `page` fixture sets
  `sessionStorage["portfolio.exe:booted"]` so the boot screen is skipped unless `showBoot` is set; `errors` collects console and network errors; `gotoHome` waits for hydration.
  `@axe-core/playwright` is installed for a11y checks (dark, light, quick view).
- Run `npm run check` (= `typecheck` + `lint` + `test`) before every hand-off; then `npm run build`; then `npm run test:e2e` for UI-affecting work.

## Naming and structure
Files kebab-case (`trait-chip.tsx`, `use-station.ts`); components PascalCase; hooks `useX` in `use-x.ts`; one chapter = `chapters/<name>.tsx` + folder `chapters/<name>/` for parts
(shared pieces used by several features go in `components/shared/<feature>/`).
Types in `src/types`; constants UPPER_SNAKE; content exports camelCase nouns. Feature-private constants stay beside the feature (e.g. `GALAXY_OPENED_KEY`).
Comments explain WHY, not what.

## File size
Components <= ~150 lines, one responsibility; extract sub-components/hooks early. Logic files stay small and single-purpose (the largest `game/` files are generators/steppers; split before they sprawl).

## Lint rules of note
`eslint-config-next` core-web-vitals + typescript (flat config `eslint.config.mjs`; ignores `.claude/**`, `_source/**`, `out/**`).
- `react-hooks/set-state-in-effect`: do not call `setState` synchronously in an effect. Use `useSyncExternalStore`, derive during render, or update in handlers.
  Pattern for "latest callback" refs: `useEffect(() => { ref.current = fn })` (see `use-bus.ts`, `use-scroll-spy.ts`).
- React Compiler-style purity: no `Date.now()`/`Math.random()` during render.
- `no-explicit-any` via typescript config.

## Review checklist
1. Copy only in `src/content`; no raw hex; tokens/`cn()`/accent maps used; no dynamic Tailwind class strings.
2. No direct `localStorage`/`AudioContext`; services via `useGame()`.
3. New behaviour extends a registry rather than editing a switch.
4. `"use client"` justified; no browser API in render.
5. Pure logic in `src/game` with tests; seeds/clocks injected.
6. Constraints: static export OK, no phone number, no invented metrics, vague Navayuga vendors.
7. A11y: keyboard, visible focus, 44px targets, canvases `aria-hidden` with real DOM text, reduced motion honoured, skip link intact.
8. Every new clickable is a registered discovery (`useDiscover`) and a real `<button>` with an accessible name; cross-feature reactions go through the bus; story-only UI is under `.story-only`.
9. No per-frame React state (canvas and transform work uses refs + rAF); emojis only in NOVA lines.
10. 375px, dark + light + quick view checked; `npm run check` and `npm run build` green.

## Patterns to copy
- **Engine + hook**: class with `subscribe`/`getSnapshot` (framework-free, unit-tested) + thin hook with `useSyncExternalStore` (`game/station/store.ts` + `use-station.ts`, `game/refinery/shift-store.ts` + `use-shift.ts`, `SoundPreference` + `use-sfx.ts`).
- **Feature hook owns side effects**: `use-station.ts`, `use-shift.ts`, `use-star-chart.ts`, `use-contact-form.ts`, `use-nova.ts` combine state with sfx, storage and bus events; the component stays presentational.
- **Pure machine + thin hook**: `game/station/power-up.ts` + `boot.ts` + `sync.ts`, `game/refinery/shift.ts`, `game/nova/director.ts`, `game/contact/submit.ts`, `game/scene/chapter-spy.ts`, `game/scene/interpolate.ts` are immutable/injected-clock logic with unit tests; React only holds the state and owns the timers.
- **Effects as data**: pure machines return effect lists (`ShiftEffect`) and a table maps each to sound/FX (`game/refinery/cues.ts`); sounds are a registry (`patches.ts`), not branches.
- **Bus instead of imports**: emit `{ type: "nova:say" | "fx" | "station:power" | ... }` from the feature, subscribe with `useBusEvent` in the consumer (NOVA, FX layer, sky).
- **Latest-callback ref** to avoid effect re-subscription: `use-bus.ts`, `use-scroll-spy.ts`.
- **Own storage key kept with its feature** when it is not shared: `GALAXY_OPENED_KEY`, `NOVA_MUTED_KEY`. Shared keys go in `STORAGE_KEYS`.
- **Deterministic randomness**: seeded PRNG (`lib/rng.ts`, `game/refinery/prng.ts`) so tests and SSR are reproducible; sound/FX jitter takes an injectable `random`.
- **One audio context**: only `game/audio/engine.ts` ever creates an `AudioContext`; everything else asks the engine for a bus.

## Anti-patterns (reject in review)
`localStorage.getItem` in a component; `new AudioContext()` outside the engine; `switch (id)` to extend behaviour; `style={{ color: "#..." }}`; `text-${accent}`; `useEffect(() => setX(...))`;
copy strings in JSX; a 300-line component; a game rule imported from React code (rules must live in `src/game`); `any`.

## Commands reference
`npm run typecheck` (tsc --noEmit), `npm run lint` (eslint), `npm test` (vitest run), `npm run test:watch`, `npm run check` (all three), `npm run format` (prettier).
