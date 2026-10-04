# PORTFOLIO.EXE — Kadwasra Ravi Kumar

> **Resuming work? Read `.claude/context/handoff.md` first** — current status (v3 built, awaiting Ravi's review), his decisions, and what's left (ship phase).

An **interactive space story** ("The Voyage") for a **Data & AI Engineer**. Scrolling flies the visitor through his real
career, chapter by chapter, over a sky that changes as you go. A co-pilot bot (NOVA) narrates, nearly everything that glows is
clickable, and **Quick view** gives recruiters a plain summary. Static Next.js site on Vercel Hobby.

## Hard constraints
- **100% static.** `output: "export"` — no API routes, no server actions, no runtime env, no paid services.
- **Free forever.** Vercel Hobby. No backend, no databases. Contact = big link cards plus ONE form that posts
  client-side to Web3Forms (free tier, `game/contact/submit.ts`); `mailto:` is only the fallback after a failed send.
  The form never asks for a phone number.
- **Never show a phone number** anywhere (site, resume, metadata).
- **No invented metrics.** Numbers come only from the resume; Navayuga (current job) has none yet.
- Vendor names at Navayuga stay vague ("enterprise ERP", "fuel-management API", "fleet telematics").
- Private sources live in `_source/` (gitignored). Never commit them.
- Story content stays real DOM text (indexable). Every clickable thing is a real `<button>`/`<a>` with a label.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-first `@theme`) ·
Motion 14 · next-themes · Vitest + Testing Library · Playwright + axe. Audio is hand-rolled Web Audio (no audio files, no libs).

> **Next 16 has breaking changes.** Before using an unfamiliar Next API, read the bundled docs in
> `node_modules/next/dist/docs/` (e.g. `01-app/02-guides/static-exports.md`).

## Commands
```bash
npm run dev          # local dev server (http://localhost:3000)
npm run build        # static export → out/
npm run preview      # serve out/ on :4173
npm run check        # typecheck + lint + unit tests  (run before every hand-off)
npm run test:e2e     # Playwright (needs a fresh `npm run build`)
npm run images       # _source/My photo.png → public/images/*.webp
npm run resume:pdf   # /resume → public/Kadwasra_Ravi_Kumar_Resume.pdf (needs build)
npm run og           # /og → public/og.png (needs build)
```

## The Voyage (chapters in flight order; single source: `src/content/story.ts`)
CH0 `launchpad` (boot, 3-2-1 countdown, rocket, a moonbase in space) · CH1 `pilot` (flip ID card, "Pilot dossier" back) ·
CH2 `vit` (education craters) · CH3 `nebula` (WinWire map: "Data Engineer Trainee" / "Data Engineer" stations) ·
CH4 `station` (Navayuga: boot the station, "Run first sync") · CH5 `armory` (flip abilities, plain Tech inventory,
issuer-logo trophies) · CH6 `side-quests` (fracturing asteroids + Refinery "Pipeline on-call shift") ·
CH7 `transmission` (contact form + link cards).
`src/app/page.tsx` must render them in the same order. Each chapter is `<Screen id={chapter.id}>` + `<ChapterHeading>`
(`<h2 id="{id}-title">`) and maps to a sky `scene` key in `content/scenes.ts` (one neon palette per chapter).

## Folder map
```
src/
  app/            layout (inline boot + quick-view script), page (chapter order), resume/, og/, globals.css
  content/        ALL copy & data, typed: story, scenes, discoveries, nova, station, launchpad, pilot, vit, nebula,
                  armory, issuers, inventory (+groups), side-quests, refinery(+incidents), transmission (Web3Forms
                  key), quick-view, profile, quests, projects, resume ...
  types/          content.ts, story.ts (Chapter, Scene*), events.ts (GameEvent, FxKind), game.ts (SfxName, SfxOptions)
  game/           framework-free logic + unit tests: events/ (bus) discoveries/ scene/ (interpolate, chapter-spy,
                  station-lights) fx/ (particles, ping-cadence, streaks) nova/ (director, timing) station/ (boot,
                  power-up, sync, store) belt/ (asteroid art, fracture) refinery/ (shift machine)
                  contact/ (submit) audio/ (engine, patches, music/) preferences/ progress/ galaxy/
  lib/            cn, storage (KeyValueStore), constants (STORAGE_KEYS, CHAPTER_XP, DISCOVERY_XP), rng, pixel-path
  providers/      GameProvider (DI: store, sfx, sound, audio, music, musicPref, visits, bus, discoveries, quickView),
                  UiProvider (overlay: star chart only), app-providers
  hooks/          use-discover, use-bus, use-quick-view, use-visits, use-sfx, use-music, use-reduced-motion
  components/
    chapters/     one file + folder per chapter (launchpad/ pilot/ vit/ nebula/ station/ armory/ side-quests/ transmission/)
    scene/        space-scene + sky/ (scroll-driven canvas), player-ship, fx-layer + fx-renderer/fx-ping, background-click, shake
    nova/         nova-dock, dialogue, robot, typewriter, use-nova
    hud/          hud, chapter-tracker + use-scroll-spy, xp-bar, discovery-counter, system-menu (theme/sound/music),
                  star-chart-overlay (+ star-chart/), quick-view-toggle
    quick-view/   static recruiter summary (server components + one client back button)
    shared/       debrief/ (mission tabs, loot) galaxy/ (briefing modal, architecture diagram) refinery/ (the game)
    ui/           primitives: PixelCard, PixelButton, StatBar, Tag, StatusBadge, PixelIcon, Modal, Screen, ChapterHeading
    effects/      block-cursor, pixel sprite
tests/unit        vitest     tests/e2e  playwright
scripts/          build-time scripts (images, resume PDF, OG image)
.claude/          context/ (deep docs for Claude), agents/, skills/
handbook/         human documentation
```

## Key patterns
- **Event bus** (`game/events/bus.ts`, instance `useGame().bus`, subscribe with `useBusEvent(type, fn)`): features talk
  through typed `GameEvent`s (`chapter:enter`, `discover`, `fx`, `game:result`, `nova:say`, `station:power`,
  `station:sync`) instead of importing each other. NOVA, the FX layer, the sky and the music are subscribers.
- **Discoveries**: every clickable thing is registered in `content/discoveries.ts` (id, chapter, label, NOVA line) and
  wired with `const { trigger, found } = useDiscover(id, { accent, fx, sound })`. It records the first find, spawns FX,
  pops "+25 XP" and emits `discover`. An id missing from the list is silently ignored.
- **XP** = chapters visited x `CHAPTER_XP` (100) + discoveries found x `DISCOVERY_XP` (25), computed in `computeXp`.
  There are no achievements, toasts, console, loadout or mini-games beyond the Refinery.
- **Audio** (`game/audio/`): ONE `AudioEngine` (one AudioContext: sfx bus + music bus -> master -> limiter), unlocked on the
  first pointerup/click/keydown/touchend. SFX = data in `patches.ts` (`SfxName`, 17 sounds); music "Neon Drift" is an
  original procedural loop (`audio/music/`) whose layer mix follows `chapter:enter`. Sound and music default ON; nothing is
  heard until the visitor's first gesture. `wire.ts` `connectAudio` joins it all. Never create an AudioContext elsewhere.
- **NOVA timing**: `hud/use-scroll-spy.ts` + `game/scene/chapter-spy.ts` follow the scroll live; `chapter:enter` fires only
  after the scroll settles (200ms) and only when the chapter changed. The director interrupts stale chapter lines; hold time =
  typing + reading buffer (`game/nova/timing.ts`). Phones narrate every chapter too.
- **FX**: `data-fx="burst|confetti|ripple|shake|smoke"` (+ `data-fx-accent="plasma|xp|coin|warp"`) on an element opts into an
  effect on pointerdown; any button/link otherwise gets a small spark. Clicking empty background fires a "star ping" (ring +
  twinkle in `--scene-glow`, a pentatonic `ping` sound by x, every 6th click a shooting star). Or emit `{ type: "fx" }`.
- **Quick view**: `html[data-quick]` (set by the layout's inline script before paint, toggled by `useQuickView`).
  CSS hides `.story-only` and shows `.quick-only`. Story layers (canvases, NOVA, FX) are `.story-only`; the sky loop and
  the music pause.
- **Scroll-driven sky**: `game/scene/interpolate.ts` blends `content/scenes.ts` keyframes by continuous chapter position and
  writes the blended glow to the `--scene-glow` CSS var. The sky station lights up from `station:power` / `station:sync`.
- **Services via DI**: `useGame()` hands out the services; tests inject fakes through `GameProvider`'s `services` prop.
- **External stores** expose `subscribe`/`getSnapshot`, read with `useSyncExternalStore` (server snapshot = "nothing yet").
- **Heavy parts are lazy** (`next/dynamic`): station power-up, Refinery, star chart panel; the player ship, FX layer, NOVA
  dock and block cursor mount after hydration (`scene/deferred-layers.tsx`).

## Code rules (SOLID, enforced in review)
1. **Content ≠ presentation ≠ logic.** Copy lives in `src/content/`. Components render typed data.
   Game rules live in `src/game/` with zero React imports and unit tests.
2. **Depend on interfaces.** Use `KeyValueStore`, `SfxPlayer` — never touch `localStorage` or
   `AudioContext` directly in components. Get services via `useGame()`.
3. **Registries over switches.** Chapters, discoveries, SFX patches, job roles, Refinery levels/incidents are data
   arrays/records — adding one must not require editing a `switch`.
4. **Small units.** Components ≲150 lines, one responsibility. Extract sub-components early.
5. **No `any`, no magic numbers** (put them in `lib/constants.ts` or a local `const`).
6. **Server Components by default.** Add `"use client"` only for state, effects or browser APIs.
7. Browser APIs only inside effects/handlers. Reactive external state → `useSyncExternalStore`.
   Don't call `setState` synchronously inside `useEffect` (lint error). No per-frame React state (canvases use refs + rAF).
8. Use `cn()` from `@/lib/cn` for conditional classes. Accent colours via maps in `components/ui/accent.ts`
   (no dynamic Tailwind class strings).
9. Emojis only in NOVA's lines (`content/nova.ts`, discovery `line`s); everywhere else use pixel icons.

## Design system (summary; full spec in `.claude/context/design-system.md`)
- **Palette tokens** (Tailwind classes): `void` bg · `nebula`/`nebula-2` panels · `grid` borders ·
  `starlight` text · `dust` muted · `plasma` cyan (identity/links) · `xp` lime (progress/done) ·
  `coin` amber (headings/active) · `warp` magenta (side/rare) · `danger`.
- **Type:** `font-pixel` (Press Start 2P) for headings/HUD/badges only, sizes `text-px-*` (multiples of 8px);
  `font-body` (Chakra Petch) for everything readable. Body copy in sentence case, max ~65ch.
- **Shape:** square corners, 2px borders, hard shadows (`shadow-pixel`). No blur shadows, no rounded corners.
- **Layering:** sky canvas `-z-10` · player ship `z-30` · HUD `z-40` · NOVA dock and FX canvas `z-[45]` · boot overlay and
  countdown `z-50` · scanlines `z-60` · block cursor `z-[70]` · skip link `z-[100]` · native `<dialog>` modals on top.
- **Motion:** juicy on click (particles, shake, flips, "+XP"), calm otherwise. Respect `prefers-reduced-motion`
  (`useReducedMotion` + the CSS block): no shake or particles, no countdown, no typewriter; the sky draws static frames;
  the Refinery defaults to relaxed (no timers).
- Dark is default; light ("day mode") must keep ≥4.5:1 contrast. Use tokens, never raw hex in components
  (hex is allowed only as data: sky palettes in `content/scenes.ts`, brand logos in `content/issuers.ts`).
- **Per-chapter neon palette** (`content/scenes.ts`): CH0 violet · CH1 blue · CH2 ultraviolet · CH3 pink · CH4 cyan ·
  CH5 amber · CH6 green · CH7 emerald; copy sits on dark gradients (tested ≥4.5:1), the neon is `glow` + `horizon`.

## Accessibility floor
Keyboard reachable everything (discoveries included) · visible focus (global `:focus-visible`) · 44px touch targets ·
canvases are `aria-hidden` decoration · NOVA text mirrored in an `aria-live="polite"` region, dismissible and mutable ·
Quick view is the no-motion, read-fast path · games are optional and never block content · skip link present.

## Deep-dive docs (read when relevant)
- `.claude/context/architecture.md` — render tree, providers, bus, sky, boot and quick-view scripts, adding a chapter
- `.claude/context/design-system.md` — tokens, scene palettes, FX kinds, z-index layers, components, do/don't
- `.claude/context/content-model.md` — every content file and its type
- `.claude/context/gamification.md` — XP, discoveries, audio + music, NOVA timing, station, Refinery, contact form
- `.claude/context/coding-standards.md` — testing, naming, review checklist
- `.claude/context/deployment.md` — GitHub + Vercel flow
- `.claude/context/agents.md` — which subagent/model does what

## Definition of done
`npm run check` green · `npm run build` succeeds · no console errors · works at 375px ·
dark + light checked · quick view checked · reduced-motion checked · sound works on first tap and mute/unmute is reliable ·
new logic has unit tests.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
