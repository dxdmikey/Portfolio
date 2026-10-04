# Gamification

All game logic is framework-free in `src/game/`; React glue lives in hooks and components. Persistence goes through `KeyValueStore`
(prefix `portfolio.exe:`). Features react to each other through the event bus (architecture.md), never by importing one another.
v3 removed: the Ctrl+K console, the asteroids mini-game and Konami code, achievements and toasts, the 4-slot loadout/inventory game, and the mission-complete credits card.

## XP (`game/progress/visits.ts` `computeXp`, rendered by `components/hud/xp-bar.tsx`)
```
current = chaptersVisited * CHAPTER_XP (100) + discoveriesFound * DISCOVERY_XP (25)      // lib/constants.ts
max     = chapters.length * 100 + discoveries.length * 25                                 // 8*100 + 24*25 = 1,400
```
A chapter counts as visited when it crosses the middle band of the viewport (`ui/screen.tsx`, `VISIT_ROOT_MARGIN`, persisted under `visited`). A discovery counts the first time it is found.
Derived from reactive snapshots (`useVisits`, `useDiscoveryCount`) so SSR matches hydration. `role="progressbar"` with `aria-valuetext`. The floating label on a first find reads "+25 XP" (`use-discover.ts`).
Adding a chapter or a discovery raises `max` automatically. Nothing else awards XP (the Refinery score is its own number, not XP).

## Discoveries (`content/discoveries.ts`, `game/discoveries/tracker.ts`, `hooks/use-discover.ts`)
24 registered clickables. `DiscoveryTracker(ids, store)` persists found ids under `discoveries`; `discover(id)` returns true only the first time and ignores unknown ids.
`useDiscover(id, { accent, fx, sound, soundOptions })` returns `{ trigger(source?), found }`. `trigger` uses the pointer position (or the element centre for keyboard clicks), emits `fx` (default `burst`),
on the first find also an `xp` label ("+25 XP"), then plays sound and emits `discover {id, first}`. Sound rule: with no `sound` option a first find plays `discover` (chime arpeggio) and repeats a soft `blip`;
with `sound` (the action's own sound, e.g. `crack`, `flip`, `warp`) that plays on every click and a first find adds a quiet `discover` underneath. `useDiscoveryCount()` feeds the HUD counter ("n/24").
| Chapter | Discoveries (id: what) |
|---|---|
| CH0 launchpad (4) | rocket: launch it; name: poke the name; sprite: pixel Ravi waves; constellation: light all 5 stars (any order, each plays a rising `ping`) to reveal "The Lakehouse" |
| CH1 pilot (6) | id-card: flip (`flip` sound); stats: inspect a stat (NOVA explains via `statNotes`); trait-anime / trait-nature / trait-gaming: emotes; certs: spin a badge |
| CH2 vit (4) | crater-degree, crater-spec, crater-grade, crater-years (all four cracked: confetti + "Tutorial complete") |
| CH3 nebula (5) | mission-sdt ("Data Engineer Trainee" station), mission-sde ("Data Engineer" station); satellite-migration, satellite-integration, satellite-commercial ("Platform AMS") open sub-missions |
| CH4 station (1) | station-online (fires when the 8th module comes online) |
| CH5 armory (2) | ability-flip, trophy (the Tech inventory is not clickable) |
| CH6 side-quests (2) | asteroid-aws, asteroid-platform (`crack` sound, `smoke` fx) |
| CH7 transmission (1) | dish (aim the radio dish: optional light show) |
The Refinery, the star chart, the contact form and the music toggle are not discoveries.

## Audio and music (`game/audio/`; wiring `wire.ts`; UI `hud/sound-toggle.tsx`, `hud/music-toggle.tsx`)
**Engine** (`engine.ts`): one AudioContext, created and resumed ONLY inside a gesture (`pointerup`, `click`, `keydown`, `touchend`; capture + passive), retried on every gesture while not `running`, plus
`statechange` (suspended / interrupted) and `visibilitychange` handling and `navigator.audioSession.type = "playback"` (iOS ignores the silent switch). While the context is not running nothing is scheduled;
`whenRunning` lets the very click that unlocks audio still make its sound. Master mute = a gain ramp, so mute/unmute can be toggled repeatedly without clicks or stuck state.
**Defaults**: `sound` ON (`SOUND_DEFAULT`), `music` ON (`MUSIC_DEFAULT`); browsers still keep everything silent until the first tap/click/key (PRESS START). Master `sound` silences sfx AND music;
`music` silences only the soundtrack and lives in the HUD system menu next to theme and sound. Turning music on while master sound is off turns sound on too.
**SFX** (`patches.ts`, data keyed by `SfxName`; render in `synth.ts`): blip (UI tick), select (confirm), error (buzz), warp (big sweep), flip (card whoosh), discover (chime arpeggio), power-up (rising),
short (crackle), crack (rock break; also the ID card stamp), whoosh (chapter / belt / sync start), type (NOVA tick, throttled 40ms), success (fanfare), toggle (switches), ping (bell, tuned to D minor
pentatonic by `options.degree`; used by background clicks, the constellation and the sync stages), alarm (incident / paged), promote and quarantine (Refinery verdicts). Each play gets +-4% pitch jitter
(less for melodic patches, so they stay in tune). `SFX_VOICE_LEVEL` (synth.ts, 0.06) scales every effect; a call can pass `volume` (0..1.5) or `pitch`.
**Music "Neon Drift"** (`music/`): original procedural synth-pop, D minor with a Bb maj7#11 sparkle, 96 BPM, 32 bars (~80s) loop; layers pad (detuned saws through a low-pass), arp (pluck with dotted-eighth delay),
bass (sine sub with pump), chimes (FM bells), hats (noise). `CHAPTER_MIX` (mix.ts) sets the layer gains per chapter and the player crossfades over 1.5s on `chapter:enter`: launchpad pad+chimes only, arp joins from
pilot, bass at nebula, hats at station, everything in for armory and side quests, a soft outro at transmission. `MUSIC_LEVEL` (graph.ts, 0.45) is the overall music loudness, fade-in 4s.
It plays only while pref + master are on, the context runs, the tab is visible and quick view is off.
Tests: `audio-engine`, `audio-sfx`, `audio-music`, `audio-call-sites` (fake AudioContext in `tests/unit/audio-fakes.ts`).

## NOVA director (`game/nova/director.ts`, `script.ts`, `timing.ts`; React side `components/nova/use-nova.ts`; copy `content/nova.ts`)
Priority order: `direct` (`nova:say`) > `result` (`game:result`) > `discovery` (first finds only) > `chapter` > `idle` (robot click tips/jokes).
- **When a chapter is announced** (`game/scene/chapter-spy.ts`, `hud/use-scroll-spy.ts`): the chapter under the viewport centre is tracked live for the HUD, but `chapter:enter` is emitted only after
  `SPY_SETTLE_MS` (200ms) without scrolling and only if it differs from the last one announced (also once on load). Flinging through five chapters -> NOVA speaks only for the one you land on.
- **Hold time** (`timing.ts`): typing (`NOVA_TYPE_MS_PER_CHAR` 28 ms/char) + reading (`NOVA_READ_BASE_MS` 1600 + 25 ms/char), clamped to 2000-9000 ms. Reduced motion drops the typing share. While a line holds the
  stage only a strictly higher priority interrupts; others queue (max 3, sorted by priority, equal priority first-in first-out).
- **Chapter lines follow the visitor**: a chapter line for a different chapter interrupts a chapter/idle line already on stage and drops queued idle lines and queued lines of other chapters. A stale
  "welcome to chapter 2" is never said once you are in chapter 5. The line for the current chapter is spared when the queue overflows.
- Each line is said once per session unless `repeatable` (results, direct, idle, revisit). `pickUnspoken` gives the next unused chapter line; `pickCycling` restarts a pool.
- **Greeting merged**: the first chapter line NOVA says is prefixed with `novaGreeting` ("Hi, I'm NOVA ...") as ONE line, never two. **Revisit lines**: once a chapter's intros are used up, a rotating
  `novaRevisitLines` template ("Back at {chapter}. ...") fills in the chapter label.
- Phones (<640px) narrate EVERY chapter (short lines) and fold the box after 2.5s (4.5s elsewhere). Muted (`nova.muted`) drops everything. Hiding or muting mid-line never leaves the robot stuck "typing".
- `nova:say` lines in use: station upstream hint, station sync line, stat explanations, VIT completion note, contact form "Transmission received!". NOVA ignores `station:power` / `station:sync`.
Clicking the robot: next tip/joke (interleaved `novaTips` + `novaJokes`, cycling) or wakes NOVA if muted. Tests: `nova-director.test.ts`, `nova-scroll-spy.test.ts`, `nova-dock.test.tsx`.

## Station (CH4: `game/station/`; UI `components/chapters/station/*`; data `content/station.ts`)
Graph = the self-serve platform architecture: sources (erp, fuel, fleet) -> ingest -> lakehouse -> transforms -> reports, and lakehouse -> AI agent (8 modules, 7 edges).
- **Rules** (`power-up.ts`): a module is `ready` when every upstream module is online (sources start ready), `locked` otherwise, `online` once powered. Edges go live when both ends are online.
- **Boot with charge-up** (`boot.ts`): pressing a ready module (click or Enter) starts a `CHARGE_MS` (600ms) charge ring, then it comes online (`power-up` on press, `select` + burst on arrival; the sky is told via
  `station:power {online,total}`). Several modules can charge at once; a repeat press while charging is `busy`. Reduced motion: instant.
- **Short circuit**: pressing a locked module sparks along the missing upstream pipe (`short-sparks.tsx`), plays `short`, logs "blocked: X offline", and NOVA gives the "upstream first" hint.
- **Boot log** (`log.ts`, `boot-log.tsx`): one terminal line per module online (copy `stationBootLines`), plus "all systems nominal", blocked, reset and sync lines. **Coloured packets** (`flow.ts`,
  `flow-packets.tsx`): live pipes carry packets coloured by source (erp plasma, fuel coin, fleet warp); they merge after Ingest.
- **"Run first sync"** (`sync.ts`; button enabled once 8/8): one demo batch walks sources -> ingest -> bronze -> silver -> gold -> transform -> reports -> agent (`stationSyncStages`, 550ms per stage, last 900ms),
  a rising `ping` per stage, then `success` + confetti, the ECharts module draws a tiny bar chart and the agent answers "fuel spend by site?" with it. **All values are labelled demo data** (relative bar
  heights in `stationDemo`, not measurements; Navayuga has no public numbers). The sync can be re-run. Emits `station:sync`.
- **The sky reacts** (`game/scene/station-lights.ts`): lit windows on the sky station = modules online; sync triggers a ~1.4s light cascade (skipped under reduced motion).
- **Persistence** (`store.ts`, `STORAGE_KEYS.station`): powered module ids + whether the sync finished. `restoreStation` trusts nothing (unknown ids dropped; a module stays online only if its whole upstream did;
  "synced" needs 8/8). Charges, the running sync, faults and the log are session-only. Reset button clears it. The 8th module fires the `station-online` discovery, a shake and `game:result {station, win}` once.
Honest status: "Live - In progress", no metrics. Tests: `station-power-up`, `station-boot`, `station-sync`, `station-store`, `station-lights`, `station-panel`.

## Armory (CH5: `components/chapters/armory/*`; data `content/inventory.ts`, `content/armory.ts`)
Ability cards flip (front: level/tier, back: spells + `abilityUsage`; `ability-flip` discovery). Below them the **Tech inventory** (`tech-inventory.tsx`) is a plain server component with no game and nothing clickable: tools grouped by
`inventoryGroups` (Processing & languages, Data platforms & storage, Orchestration, AI, Viz & web, Cloud & tooling), each tile = abbr badge in the rarity colour + name + note, with a "Proficiency" rarity legend (copy in
`armoryCopy.inventory`). A Job-match scanner was built and then removed at Ravi's request (2026-10-04). Then the trophy case: cards with issuer pixel logos spin on click (`trophy`). Test: `tech-inventory.test.tsx` (every tool in exactly one group; renders all).

## Refinery: "Pipeline on-call shift" (`game/refinery/`, UI `components/shared/refinery/`, embedded lazily by `chapters/side-quests/refinery-embed.tsx`; copy `content/refinery.ts`, `refinery-incidents.ts`)
A shift = 3 data levels + an incident round, run by a pure state machine (`shift.ts`: `step(state, action)` returns new state + effects; `ShiftStore` holds it for React; `cues.ts` maps each effect to sound + FX).
Phases: idle -> briefing (a rule card per stage) -> running -> (next level ...) -> incident -> report.
- **Levels** (`levels.ts`, a table; add a row to add a level): Bronze (null fields, malformed numbers; belt 10s), Silver (+ schema drift, negatives, future dates; 8s), Gold (+ duplicates, late-arriving data; 6.5s). 8 records each (24
  total); `levelSeed` makes each level reproducible. The first shift seed is fixed (1042) so SSR and tests are deterministic.
- **Conveyor** (`conveyor.ts` stopwatch, `components/shared/refinery/conveyor.tsx`): each record rides a belt; **Promote** (key P) or **Quarantine** (key Q), or tap the big buttons. A record that reaches the end counts as a miss.
  Keys are scoped to the game panel; incident options are keys 1-3.
- **Scoring** (`scoring.ts`): 100 per correct verdict x streak multiplier (x1, x2 after 3 in a row, ... max x4); a clean level (no miss) adds 250. **SLA budget**: 3 breaches (a bad record promoted or let through) ends the shift as
  "paged" immediately.
- **Incident round**: 3 of the 6 incidents in `refinery-incidents.ts` (shuffled by seed); read the log, pick the right fix of 3 against a 12s clock (500 points each); the explanation shows after answering.
- **Report** (`report-card.tsx`): processed, accuracy, best streak, incidents resolved, rank Intern -> Junior -> Engineer -> On-call hero (`RANKS`: 0 / 2,500 / 5,000 / 8,000; being paged caps the rank at Junior). Engineer and
  hero count as a win. The score persists as a personal best (`BestScore`, key `refinery.shiftBest`). End of shift emits `game:result {refinery, win|lose}` so NOVA reacts, plus confetti or shake.
- **Relaxed mode** (`use-relaxed.ts`): no conveyor or incident clock; on by default under reduced motion, switchable either way.
Tests: `refinery-shift`, `refinery-rules`, `refinery-generate`, `refinery-best-score`, `refinery-game`.

## Asteroid belt (CH6: `chapters/side-quests/asteroid-belt.tsx`, `asteroid.tsx`, `asteroid-shards.tsx`, `game/belt/`)
Two seeded 16x16 pixel asteroids (`asteroid-art.ts`). Click: `fracture(rows, seed)` (`fracture.ts`, pure and deterministic) splits the rock into 5-7 Voronoi shards that keep the rock's own pixels; the shards fly apart with spin,
big ones (>=18 px) break again into 2-3 pieces mid-flight, with a `smoke` puff, a light shake and the `crack` sound; then that project's `MissionBriefing` modal (`shared/galaxy`) opens. "Re-form asteroid" flies the shards back.
Reduced motion: no shard flight, the rock just swaps. Test: `fracture.test.ts` (shards partition the pixels exactly, deterministic per seed).

## Star chart (`components/hud/star-chart-overlay.tsx` + `star-chart/`, `game/galaxy/`)
HUD button opens a lazy `Modal`. Chapters are planets across the top band in voyage order (`chart-layout.ts` `CHAPTER_LOOK`); projects are moons tethered to their chapter
(`PROJECT_SPOTS`). Picking a chapter closes the dialog and warps (scrolls to the chapter element, focuses its `#id-title` heading, sfx `warp`); picking a project opens its mission briefing
(architecture diagram included). The map (`VoyageMap`, >=sm) has a ship that flies to the picked planet first (skipped under reduced motion or when already docked), then the action runs; below sm a `VoyageList` opens things directly.
`BriefingLog` (`game/galaxy/briefing-log.ts`) persists opened project ids under `galaxy.opened` and only drives the "read" markers on the chart. `game/galaxy/chart.ts` = pure geometry.

## Transmission and contact form (CH7: `chapters/transmission/*`; logic `game/contact/submit.ts`; copy + key `content/transmission.ts`)
Contact-first. Top: the radio dish (optional light show; click = `dish` discovery + sfx `warp`, aims 600ms, beam 1400ms `SEND_MS`, then stage `sent`). Below, two columns: the **"Transmit a message" form** (name, email, message,
a hidden honeypot `botcheck`; 16px inputs so iOS does not zoom; labelled fields with live error messages) and the **link cards** (Email, LinkedIn, GitHub, Resume from `profile.links`, plus Copy email and the resume page).
Links are always usable; a signal (dish or sent message) makes the cards pop in with `link-ping`. Reduced motion: instant stage change.
- **Submit** (`submitContact`): `validate` (name required, email pattern, message >= 10 chars) -> `buildRequest` JSON POST to `https://api.web3forms.com/submit` with `access_key`, name, email, message, a fixed subject and
  `botcheck`. States idle -> sending -> sent | error (`nextStatus` ignores a second submit while sending). A ticked honeypot pretends success and sends nothing. There is NO phone field.
- **The key**: `WEB3FORMS_ACCESS_KEY` in `content/transmission.ts` is a PUBLIC key by design (it only lets the form deliver to Ravi's inbox) and is set, so the form really sends. After a failed send the form offers a prefilled mail draft
  (`mailtoFallback`) with a visible link. (`submitContact` also returns `mailto` if the constant is ever emptied.) To change or rotate the key, edit that one constant. Free tier = 250 emails a month. e2e tests intercept every Web3Forms request with `page.route`.
- **On success**: form clears, confetti + ripple, `success` sound, NOVA "Transmission received!", the signal stage fires. Tests: `contact-submit`, `contact-form`.

## Storage keys (all prefixed `portfolio.exe:`)
| Key | Store | Owner |
|---|---|---|
| `visited` | local | VisitTracker (chapter ids) |
| `discoveries` | local | DiscoveryTracker (found ids) |
| `quickView` | local | BooleanPreference in GameProvider; the layout script reads it before paint |
| `sound` | local | SoundPreference (master audio, default true) |
| `music` | local | `musicPref` BooleanPreference (default true) |
| `nova.muted` | local | NOVA mute BooleanPreference (`game/nova/keys.ts`) |
| `station` | local | StationStore (`{ powered: string[], synced: boolean }`) |
| `refinery.shiftBest` | local | BestScore |
| `galaxy.opened` | local | BriefingLog (`GALAXY_OPENED_KEY`) |
| `booted` | **session** | boot-state.ts + layout inline script |
Shared keys are in `lib/constants.ts` `STORAGE_KEYS` (visited, sound, music, refineryBest, station, booted, quickView); feature-owned keys live with their feature. Reset = clear site data.
Keys from removed v2 features (`achievements`, `armory.loadout`, `asteroids.highScore`, `refinery.best`) may linger in old browsers; nothing reads them.
