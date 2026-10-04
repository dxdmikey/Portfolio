# Architecture

Static Next.js 16 App Router site "The Voyage". One page (`/`) plus `/resume/` and `/og/` (OG-image source, disallowed in robots).
`next.config.ts`: `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`, `reactStrictMode`, `poweredByHeader: false`.

## Render tree
```
app/layout.tsx  (Server)      fonts (Press Start 2P -> --font-press-start, Chakra Petch -> --font-chakra),
  |                            metadata/viewport, inline BOOT_FLAG_SCRIPT, <noscript> CSS, skip link
  +- AppProviders  (client)   providers/app-providers.tsx
       ThemeProvider (next-themes, attribute="data-theme", defaultTheme="dark", enableSystem=false)
         GameProvider          providers/game-provider.tsx   -> services (see below); effect: connectAudio(...)
           UiProvider          providers/ui-provider.tsx     -> overlay: "none" | "star-chart"
             app/page.tsx
               .story-only: SpaceScene (canvas), BootScreen, Launchpad (CH0)
               Hud                       (sticky header)
               <main id="main">
                 .story-only: PilotProfile, PlanetVit, WinwireNebula, NavayugaStation, Armory, SideQuests, Transmission (CH1-CH7)
                 .quick-only: QuickView
               </main>
               DeferredLayers (client, next/dynamic ssr:false): PlayerShip, FxLayer (canvas), NovaDock, BlockCursor
               StarChartOverlay
```
Chapter order in `page.tsx` MUST match `content/story.ts` `chapters` (CH0 launchpad, CH1 pilot, CH2 vit, CH3 nebula, CH4 station,
CH5 armory, CH6 side-quests, CH7 transmission). The sky, HUD tracker, scroll spy, visit tracking and star chart all read that array.
`app/resume/page.tsx` is a separate print-styled page (`resume.module.css`) rendering `content/resume.ts`; it is the PDF source.

## Dependency injection: GameProvider
`useGame()` returns `GameServices` (throws outside the provider):

| Service | Class / type | File | Role |
|---|---|---|---|
| `store` | `KeyValueStore` | `lib/storage.ts` | `createWebStore("local")`; keys prefixed `portfolio.exe:`; fails soft. `createMemoryStore` for tests. |
| `audio` | `AudioEngine` | `game/audio/engine.ts` | THE one AudioContext (gesture unlock, interrupted/visibility handling, sfx + music buses). |
| `sfx` | `SfxPlayer` (`WebAudioSfx`) | `game/audio/sfx.ts` | `play(name, { degree?, pitch?, volume? })`, patches from `patches.ts`. `SfxName` (17): blip select error warp flip discover power-up short crack whoosh type success toggle ping alarm promote quarantine |
| `sound` | `SoundPreference` | `game/audio/sound-preference.ts` | persisted master on/off for ALL audio (default ON, key `sound`) |
| `music` | `MusicPlayer` | `game/audio/music/player.ts` | adaptive "Neon Drift" loop on the music bus |
| `musicPref` | `BooleanPreference` | `game/preferences/boolean-preference.ts` | music on/off under the master (default ON, key `music`) |
| `visits` | `VisitTracker` | `game/progress/visits.ts` | visited **chapter** ids (from `content/navigation.ts` `sections`, an alias of `chapters`); `computeXp` lives here too |
| `bus` | `EventBus<GameEvent>` | `game/events/bus.ts` | typed pub/sub (below) |
| `discoveries` | `DiscoveryTracker` | `game/discoveries/tracker.ts` | found ids (key `discoveries`), `discover(id)` true only the first time, `total` |
| `quickView` | `BooleanPreference` | `game/preferences/boolean-preference.ts` | persisted quick view flag (key `quickView`) |

`GameProvider` accepts an optional `services` prop (tests inject fakes; missing audio services are filled with inert ones); services are created lazily in `useState(() => ...)`.
Its only effect is `connectAudio` (`game/audio/wire.ts`): installs the engine's gesture listeners, mirrors `musicPref` and quick view onto the player, and on `chapter:enter`
sets the music's chapter mix and plays the soft chapter whoosh. There are no achievements, no night-owl effect and no unlock logic anywhere.
NOVA is **not** a provider service: `components/nova/use-nova.ts` owns a `NovaDirector` and a mute `BooleanPreference` (key `nova.muted`) in local state.
`UiProvider` (`useUi()` -> `{ overlay, open(o), close() }`): the star chart (HUD planet button -> `StarChartOverlay`, a `Modal`, panel lazy-loaded) is the only overlay.
Hooks: `useSfx`, `useMusic`, `useVisits`, `useDiscover`, `useDiscoveryCount`, `useBusEvent`, `useQuickView`, `useReducedMotion`.

## Event bus (`game/events/bus.ts`, types in `types/events.ts`)
`EventBus<E>`: `emit(e)`, `on(fn)`, `onType(type, fn)` (all return unsubscribe). React: `useBusEvent(type, handler)` (latest-handler ref).
| Event | Emitted by | Heard by |
|---|---|---|
| `chapter:enter {chapter}` | `hud/chapter-tracker.tsx` once the scroll SETTLES on a new chapter | NOVA, music mix + whoosh (`connectAudio`), star chart ("you are here") |
| `discover {id, first}` | `hooks/use-discover.ts` | NOVA (first only), player ship (`rocket` makes it appear) |
| `fx {kind, x, y, accent, label?}` | `useDiscover`, launch tower, constellation, trait chips, station, contact form, Refinery cues, VIT planet | `scene/fx-layer.tsx` |
| `game:result {game, outcome}` | `station/use-power-press.ts` (all 8 online), `shared/refinery/use-shift.ts` (end of shift). `game` = `refinery` \| `station`, `outcome` = `win` \| `lose` | NOVA |
| `nova:say {text}` | stats grid, station hints and sync line, VIT completion, contact form | NOVA (priority `direct`) |
| `station:power {online, total}` | `station/use-power-press.ts`, `use-station.ts` (reset, and once on load for restored progress) | `scene/space-scene.tsx` -> `StationLights` |
| `station:sync` | `station/use-sync-run.ts` when the first sync finishes | `space-scene.tsx` (light cascade). NOVA ignores both station events (it gets `nova:say` instead) |
`FxKind` = burst confetti ripple shake smoke xp.

## Scroll-driven sky
`scene/space-scene.tsx` renders one fixed `-z-10` canvas; `scene/use-sky-loop.ts` drives it. Per frame: `chapterPosition(scrollY, vh, tops)`
(continuous, measured at viewport centre; tops = document tops of each chapter element found by `id`) -> `sceneAt(keyframes, position)`
(`game/scene/interpolate.ts`, smoothstep `ease`, `lerpColor`, `blendKeyframes`) -> `SkyRenderer.setScene/render` (`scene/sky/*`: stepped gradient with a saturated
`horizon` band, stars (density multiplier up to 1.6), shooting stars, and props). Props draw back to front: aurora, nebula, planets, station, planet, asteroids, clouds, moonbase;
a prop below alpha 0.01 is skipped and never built. Keyframes come from `content/scenes.ts` for the current theme.
The loop also writes the blended glow to `--scene-glow` on `<html>` (only when it moved a few colour steps) via `scene/scene-glow.ts`; headings, the HUD underline
(`.pixel-rule`) and background-click pings read `var(--scene-glow, ...)`.
The sky station (`scene/sky/station.ts`) gets a `StationLights` (`game/scene/station-lights.ts`): bus events set how many windows are lit (`station:power`) and start a ~1.4s light
cascade (`station:sync`); the loop runs at full rate while it plays. State is mutable, never React state.
Scheduling: rAF at full rate for 400ms after a scroll, otherwise a 90ms idle timer; paused when the tab is hidden or `html[data-quick]` is set;
reduced motion draws one static frame after scroll settles; a MutationObserver on `data-theme`/`data-quick` reacts to theme and quick view.
Sky pixel scale 3 CSS px (2 under 768px). The sky is decoration; all story content is DOM text.
`scene/player-ship.tsx`: fixed ship at the right edge, xl+ only, position = page scroll progress, tilt = scroll speed, pixel trail;
shown once the rocket is launched (`discover` `rocket`) or the launchpad is 60% scrolled past.

## FX layer
`scene/fx-layer.tsx` (+ `fx-renderer.ts`, `fx-ping.ts`, sim in `game/fx/particles.ts`, `timed.ts`, `streaks.ts`, `ping-cadence.ts`): fixed canvas (`z-[45]`, pointer-events none), animates only while
something is alive (rAF started on demand). Sources: bus `fx` events, plus a capture `pointerdown` listener that reads `data-fx` / `data-fx-accent`
and gives any `button, a[href], [role=button], summary` a small spark. Anything else goes through `scene/background-click.ts` `isBackgroundClick` (primary button, no modifier keys, not quick view,
no selection, not inside buttons/links/inputs/dialogs/`[data-fx]`/`[data-no-ping]`) -> a **star ping**: ring + twinkle in `--scene-glow`, `ping` sound (`background-ping-sound.ts`, pitch by x on the music's
D-minor pentatonic), `PingCadence` throttles to 80ms and promotes every 6th accepted click to a shooting-star streak (`StreakPool`). `shake` toggles `html[data-shake]`
(`scene/shake.ts`, CSS keyframe on `#main` and `#launchpad` only, 360ms). Under reduced motion: pings are a still ring, the "+XP" label shows without moving; no shake, no particles.

## Audio (`game/audio/`)
- `engine.ts` `AudioEngine`: one lazily created `AudioContext`; graph = sfx bus + music bus -> master gain (the mute) -> limiter -> destination. `install()` (from `connectAudio`) adds capture/passive
  `pointerup`, `click`, `keydown`, `touchend` listeners that create/resume the context (browsers count those as activation) and keep retrying while it is not `running`; it also handles
  `statechange` (suspended/interrupted) and `visibilitychange`, sets `navigator.audioSession.type = "playback"` where supported (iOS silent switch) and primes iOS with a 1-sample buffer.
  `whenRunning(fn)` runs a sound now, or right after an in-flight resume (so the unlocking click still sounds); nothing is scheduled into a suspended context. `setEnabled` = the master mute (ramped).
  The environment is injected (`AudioEnvironment`), so `tests/unit/audio-engine.test.ts` uses a fake context (`audio-fakes.ts`).
- `sfx.ts` `WebAudioSfx` + `patches.ts` (`SFX_PATCHES: Record<SfxName, SfxPatch>`, data) + `synth.ts` (`renderPatch`: tone / noise voices, filters, +-jitter, `SFX_VOICE_LEVEL = 0.06`).
  Tuned patches (`ping`) use `options.degree` via `key.ts` (`pentatonicRatio`, `pingDegreeForX`; D natural minor, `PING_ROOT_MIDI` 74). `throttleMs` per patch (e.g. NOVA's `type` tick).
- `music/`: `song.ts` (pure data + `eventsAtStep`; 96 BPM, 8 sections x 4 bars, layers pad/arp/bass/chimes/hats), `mix.ts` (`CHAPTER_MIX` layer gains per chapter, `MIX_CROSSFADE_S` 1.5),
  `scheduler.ts` (`LookaheadScheduler`: 25ms tick, 120ms horizon, injected clock/timer), `voices.ts` (WebAudio voices), `graph.ts` (`MusicGraph`: reverb, delay, sidechain-style pump, `MUSIC_LEVEL = 0.45`, fade in 4s),
  `player.ts` (`MusicPlayer`: plays only while pref + master are on, context running, tab visible, not suppressed by quick view).
- `chapter-whoosh.ts`: soft whoosh on a settled chapter change; silent for the first announcement and for 1.5s after a `warp`.
- `wire.ts` `connectAudio`: the single place the audio services meet the rest of the game. Sound AND music default ON, but the browser keeps them silent until the first gesture; the boot screen's PRESS START is that gesture.
- Preferences: master `sound` (HUD speaker toggle) silences everything; `music` (HUD music toggle in the system menu) only the soundtrack. `useMusic().toggle` turns master sound on too when music is switched on.

## NOVA (co-pilot)
`components/nova/*`: `NovaDock` (bottom-left, `story-only`, `z-[45]`), `NovaRobot`, `NovaDialogue` (typewriter, hide and mute buttons), `use-nova.ts`.
`useNova` subscribes to `chapter:enter`, `discover`, `game:result`, `nova:say`; `game/nova/script.ts` `linesForEvent` maps an event to candidate lines
(from `content/nova.ts` `novaScript`, a handler record keyed by event type); `game/nova/director.ts` `NovaDirector` applies priority, hold time, no-repeat and a short queue.
Priority: direct > result > discovery > chapter > idle. Details in gamification.md. Clicking the robot says the next tip or joke (or wakes NOVA if muted).
Dialogue folds away after 4.5s (2.5s on phones; phones narrate every chapter). Text is mirrored in `aria-live="polite"`. Under reduced motion the typewriter is skipped.
**Chapter tracking**: `hud/use-scroll-spy.ts` (a passive scroll listener + rAF) calls `activeChapterIndex` (`game/scene/chapter-spy.ts`: the chapter under the viewport centre; the last one at page bottom)
and a `ChapterSettler` that announces a chapter only after `SPY_SETTLE_MS = 200` of quiet and only if it differs from the last announcement. The HUD pips follow live; the bus event waits.
So a fast scroll or a smooth-scroll jump through five chapters announces just the one you land on.

## Quick view
`useQuickView()` toggles `quickView` (persisted `portfolio.exe:quickView` in localStorage) and sets/clears `html[data-quick]`, then scrolls to top.
The layout's inline script sets `data-quick` (and `data-booted`) before first paint when the flag is `true`, so quick-view visitors never flash the story.
CSS (`globals.css`): `[data-quick] .story-only, [data-quick] .boot-overlay { display:none !important }` and `:root:not([data-quick]) .quick-only { display:none !important }`.
`components/quick-view/*` is mostly server components (header, experience list from `quests`/`debriefs`, projects, skills from `abilities`, tools from `inventory`,
certifications, education) plus a client `BackButton`. Quick view keeps the CV job titles (the nebula's renamed stations are map-only). Because story chapters are `display:none` in quick view,
no visits are tracked there; the music is suppressed and background pings are ignored.
Escape hatch if stuck: clear site data (see handbook troubleshooting).

## Boot, countdown, no-flash
1. `BootScreen` is server-rendered as `.boot-overlay` (`z-50`) so first paint is the title card, not the hero.
2. Layout inline script (`BOOT_FLAG_SCRIPT`): `sessionStorage["portfolio.exe:booted"]` -> `html[data-booted]`; `localStorage["portfolio.exe:quickView"]==="true"` ->
   `data-quick` and `data-booted`. CSS `[data-booted] .boot-overlay { display:none }`. Keys must equal `PREFIX + STORAGE_KEYS.booted/quickView`.
3. `chapters/launchpad/boot-state.ts`: module store with phases `boot -> countdown -> ready` (`useBootPhase`, `markBooted`, `finishCountdown`). Repeat visits start at `ready`.
4. Any key / click / tap dismisses the overlay (280ms fade; this gesture also unlocks audio), plays `power-up`, starts the countdown (3, 2, 1, Liftoff!, 600ms per step with rising `blip`s then `warp`; click, key or
   "Skip countdown" skips; skipped entirely under reduced motion). Then the hero entrance plays.
5. No-JS: `<noscript>` CSS hides the overlay and forces `[data-hero-item]` visible.

## Chapters and visits
`ui/screen.tsx` wraps each chapter: IntersectionObserver (`VISIT_ROOT_MARGIN = "-40% 0px -40% 0px"`) -> `visits.visit(id)` (feeds XP). `ui/chapter-heading.tsx` renders "CHn", "Chapter n of {last}"
(derived from `chapters.length`), the title and tagline from `story.ts`, and the `<h2 id="{chapter}-title">` that `Screen` uses for `aria-labelledby` (the star chart focuses it when warping).
`hud/chapter-tracker.tsx`: `useScrollSpy(chapter ids, announce)`, one pip per chapter linking to `#id`, emits `chapter:enter` on settle.

## Heavy parts are lazy
`next/dynamic`: station power-up panel (`station/power-up-lazy.tsx`, SSR-prerendered with a same-size placeholder), Refinery (`side-quests/refinery-embed.tsx`, `ssr:false`),
star chart panel (`star-chart-overlay.tsx`, `ssr:false`), and the `DeferredLayers` bundle (ship, FX canvas, NOVA dock, block cursor; `ssr:false`).

## useSyncExternalStore pattern
Stores expose `subscribe` and `getSnapshot` as arrow properties (stable identity) and replace their `Set` immutably on change.
```ts
useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY /* server snapshot */)
```
Server snapshot is the "nothing happened" value so SSR HTML and first client render agree. Used by `VisitTracker`, `SoundPreference`, `DiscoveryTracker`,
`BooleanPreference`, `StationStore`, `ShiftStore`, `BriefingLog`, `BestScore`, `boot-state.ts`. Never `setState` synchronously in an effect. Randomness / `Date.now()` only in handlers or effects.

## Static export constraints
No API routes, server actions, runtime route handlers, `cookies()/headers()`, ISR, middleware, runtime env. `robots.ts` / `sitemap.ts` use `force-static`.
The contact form's `fetch` runs in the browser against Web3Forms, so it needs nothing from the host. Fonts via `next/font/google`. Images pre-optimised by `scripts/optimize-images.ts`.
Read `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` before unfamiliar Next APIs.

## Adding a chapter
1. `content/story.ts`: add an entry (`id`, `number`, `label`, `short`, `tagline`, `scene`) in flight order; `ChapterId` updates.
2. `content/scenes.ts`: reuse a `SceneKey` or add one (also extend `SceneKey` in `types/story.ts`; the sky renderer draws layers named in `SceneLayers`).
3. TypeScript fails until these typed records get the new id: `content/nova.ts` `novaChapterLines`, `game/audio/music/mix.ts` `CHAPTER_MIX` (layer gains),
   `components/hud/star-chart/chart-layout.ts` `CHAPTER_LOOK` (and its x-spacing: chapters sit on a fixed step across the top band).
4. Component: `components/chapters/<name>.tsx` with `<Screen id="<id>">` + `<ChapterHeading chapter="<id>" icon=...>`; parts in `chapters/<name>/`.
5. Render it in `app/page.tsx` in the same position, inside `.story-only`. Register any clickable things in `content/discoveries.ts`.
6. Tests: `tests/unit/story.test.ts` checks numbering and scene palettes (`scenes.test.ts` the contrast rule); XP grows by CHAPTER_XP per chapter automatically.
