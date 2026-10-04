# Content model

All copy/data lives in `src/content/` as typed constants (types in `src/types/content.ts`, `story.ts`, `events.ts`, `game.ts`).
Components render these; they never hard-code copy. Most files use `as const satisfies <Type>`.

## Story layer (the Voyage)
| File | Export | Type | Drives |
|---|---|---|---|
| `story.ts` | `chapters`, `ChapterId`, `chapterById` | `Chapter[]` (`id`, `number`, `label`, `short`, `tagline`, `scene`) | page order, HUD chapter tracker + scroll spy, `ChapterHeading`, sky blend, visit tracking, music mix, star chart. Ids: launchpad pilot vit nebula station armory side-quests transmission |
| `navigation.ts` | `sections` (= `chapters`), `SectionId` (= `ChapterId`) | alias | thin compatibility layer used by `VisitTracker`, the XP bar and `content.test.ts` |
| `scenes.ts` | `scenes` | `Record<SceneKey, ScenePalette>` (`dark`/`light` `{skyTop, skyBottom, horizon, glow, layers}`) | scroll sky, one neon palette per chapter (see design-system.md; hex data exception). `SceneKey`: launchpad atmosphere planet nebula station armory belt aurora |
| `discoveries.ts` | `discoveries`, `DiscoveryId`, `discoveryIds`, `discoveryById` | `Discovery[]` (`id`, `chapter`, `label`, `line`) | every clickable secret, HUD counter, NOVA's first-find line, +25 XP each. 24 entries (CH0 4, CH1 6, CH2 4, CH3 5, CH4 1, CH5 2, CH6 2, CH7 1) |
| `nova.ts` | `novaCopy`, `novaGreeting`, `novaChapterLines`, `novaRevisitLines`, `novaResultLines`, `novaTips`, `novaJokes`, `novaIdleLines`, `novaScript` | strings + `NovaScript` | NOVA dialogue. `novaChapterLines` is `Record<ChapterId, string[]>` (TS fails if a chapter is missing). `novaRevisitLines` are templates with `{chapter}` (rotating "back at ..." lines once a chapter's intros are used up). `novaGreeting` is merged in front of the first chapter line. `novaResultLines` cover `refinery` and `station` x `win`/`lose`. Emojis allowed here only |
| `launchpad.ts` | `launchpad`, `ConstellationStar` | object | CH0: countdown steps, rocket labels, sprite lines, constellation stars (5, positions in %), CTAs and tips |
| `pilot.ts` | `pilotCopy`, `dossier`, `HP`, `MP`, `statNotes`, `traitEmotes`, `CONTROLLER_ROWS` | objects | CH1: ID card labels (incl. the "Click me" peek tag and the "Open to quests" stamp), the card back's **Pilot dossier** (`dossier`: headline, 3 bullets as `Segment[]` with `strong` runs, "Currently", skills; facts mirror `profile.bio`), HP/MP, per-stat NOVA explanations (keyed by `profile.stats[].id`, e.g. `pipeline-design`; no RPG codes are shown), trait emotes |
| `vit.ts` | `vitCopy`, `craters` | object + `Crater[]` | CH2: four craters (degree, specialization, grade, years) derived from `education` in `certifications.ts`, with position % on the planet |
| `nebula.ts` | `nebulaCopy`, `stations`, `satellites`, `STATION_ROWS` | objects | CH3 map: two stations named **"Data Engineer Trainee"** (`sdt`) and **"Data Engineer"** (`sde`) (`questId` -> `quests.ts`, `discovery`) and three satellite pills with full `label`s: Migration + Data Integration (around the Trainee), Platform AMS (around Data Engineer). `subIndex` points into the quest's `subQuests`, `angle` is the orbit position. These names are **map-only**: `quests.ts`, the resume and quick view keep the CV titles ("Data Engineer SDT/SDE", "Commercial Data Platform (AMS support)") |
| `station.ts` | `stationModules`, `stationGraph`, `stationStages`, `stationCopy` | derived + copy | CH4: modules and edges are the `self-serve-platform` architecture in `projects.ts` (8 nodes: erp, fuel, fleet, ingest, lake, transform, reports, agent). Throws at import if that architecture is missing |
| `armory.ts` | `abilityUsage`, `armoryCopy` | record + copy | CH5: back-of-card text per ability id; labels for abilities, the Tech inventory (`armoryCopy.inventory`: title, intro, "Proficiency" legend) and the trophy case |
| `issuers.ts` | `issuers`, `issuerById`, `IssuerId` | `Issuer` (`id`, `name`, `rows` pixel grid, `palette` char -> brand hex) | pixel logos on the trophy cards (microsoft, databricks). Brand hex is data here, a documented exception like `scenes.ts` |
| `side-quests.ts` | `asteroids`, `sideQuestsCopy` | array + copy | CH6: two asteroids (`projectId` -> `projects.ts`, `discovery`, `seed` for the art) |
| `transmission.ts` | `WEB3FORMS_ACCESS_KEY`, `transmission` | string + object | CH7: the **public Web3Forms key** (set; `mailto:` is only the fallback after a failed send), dish labels, form labels/errors/status text, NOVA's `novaSent` line, link-card blurbs (keyed by `profile.links[].id`), mailto subject/body, footer |
| `quick-view.ts` | `quickViewCopy` | object | Quick view labels and `/resume/` link |

## Shared data (v1, still live)
| File | Export | Type | Drives |
|---|---|---|---|
| `profile.ts` | `profile` | `Profile` | name, headline, bio, tagline, traits, six RPG `stats`, photo, `links` (email/linkedin/github/resume), `email`, `siteUrl` (`https://kadwasra.vercel.app`), `version`, languages. Hero, pilot card, quick view, contact, metadata |
| `abilities.ts` | `abilities` | `Ability[]` (`level` 1-99, `tier`, `spells`) | Armory flip cards, quick view skills; test requires exactly 6 |
| `quests.ts` | `quests` | `QuestEntry[]` (`status`, `xp`, `highlights`, `tags`, `subQuests?`) | nebula missions, Navayuga brief, quick view experience |
| `debriefs.ts` | `debriefs`, `debriefCopy` | `QuestDebrief` per quest id | Mission / My role / Moves / Loot tabs (`components/shared/debrief`) |
| `projects.ts` | `projects` | `Project[]` | star chart moons, mission briefings, asteroids' briefings, station graph, architecture diagrams. `planet {x,y,size,ring}` still used by the briefing and chart helpers |
| `inventory.ts` | `inventory`, `InventoryId`, `inventoryGroups`, `rarityOrder` | `InventoryItem[]` (`rarity`, unique `abbr`, `category`, `note`) + `{ title, ids }[]` groups | the Armory's plain **Tech inventory** (`chapters/armory/tech-inventory.tsx`, a server component, nothing clickable): tools grouped by `inventoryGroups` (Processing & languages, Data platforms & storage, Orchestration, AI, Viz & web, Cloud & tooling), each tile = abbr badge in rarity colour + name + note, plus a "Proficiency" legend; also quick view tools; 18 items |
| `certifications.ts` | `certifications`, `education` | `Certification[]` (with `issuerId` -> `issuers.ts`), `Education` | pilot cert badges, Armory trophies (issuer logos), VIT craters, resume (4 certs) |
| `refinery.ts` | `refineryCopy` | `as const` object | Refinery ("Pipeline on-call shift") text, aria-labels, key hints (P / Q), rank names, per-level briefing cards |
| `refinery-incidents.ts` | `refineryIncidents` | `IncidentSpec[]` (`id`, `title`, `log[]`, `options[]` with exactly one `correct`, `explain`) | the shift's incident round; 6 incidents, 3 picked per shift (renamed-column, late-file, skewed-join, double-append, null-spike, expired-token). Keep the facts honest and vendor-neutral |
| `resume.ts` | `resume` (+ types) | object | `/resume/` page and the PDF. Order: Summary, Experience, Education, Certifications, Skills, Practice projects, Languages |

Current data: 8 chapters, 8 scenes, 24 discoveries, 6 projects, 8 station modules, 18 inventory items (6 groups), 6 incidents, 17 sfx, 6 abilities, 4 certifications.
Quests/resume/debriefs overlap in facts; keep them consistent by hand (derived: certifications, education, profile, station graph).

## Rules
- **No phone number anywhere** (site, resume, metadata). `content.test.ts` fails if `resume` JSON matches `+91` or any 10-digit run.
- **No invented metrics.** Numbers only from the resume. Navayuga (current employer) has NO results; describe what is being built (`stationCopy` says so out loud).
- **Vague vendor names for Navayuga**: "enterprise ERP", "fuel-management API", "fleet telematics".
- Every `Discovery.chapter` must be a real chapter id; discovery ids are unique (`story.test.ts`). Every `useDiscover(id)` id must exist in `discoveries.ts`.
- Inventory `abbr` unique; every inventory id is in exactly one `inventoryGroups` group (`tech-inventory.test.tsx`).
- Planets stay > 0.15 apart in 0-1 space; every architecture edge references existing node ids (`content.test.ts`). The station is built from that graph, so changing
  `self-serve-platform` nodes changes the station.
- Contact = link cards + the Web3Forms form (no phone field, ever). The key in `transmission.ts` is a PUBLIC key by design, safe to commit. Private sources stay in `_source/`.
- Persisted ids: discovery ids (`discoveries`), project ids (`galaxy.opened`), chapter ids (`visited`), station module ids (`station`). Renaming one resets that visitor's progress for it
  (loaders filter unknown ids).
- New `SfxName`: add it to the union in `types/game.ts` AND one entry in `game/audio/patches.ts` (`Record<SfxName, SfxPatch>` fails to compile otherwise), then call `play(name)`.

## Recipes (what to touch)
- **Change bio/tagline/stats**: `profile.ts` (+ `pilot.ts` `statNotes` if a stat changes meaning). Stats 0-100.
- **Add a job/quest**: `QuestEntry` in `quests.ts`, a `debriefs.ts` entry keyed by id, mirror in `resume.ts`, regenerate the PDF. A new nebula station also needs `nebula.ts` `stations` entry + a discovery.
- **Add a clickable discovery**: entry in `discoveries.ts`; in the component `const { trigger } = useDiscover("id", { accent, fx })` and call `trigger(event)` in the click handler.
- **Change what NOVA says**: `nova.ts` (chapter lines, revisit lines, tips, jokes, results); discovery reactions live in `discoveries.ts` `line`.
- **Add a chapter**: see architecture.md "Adding a chapter".
- **Edit station modules**: change the `self-serve-platform` `architecture` in `projects.ts` (nodes `column` 0-3 map to `stationStages`); copy in `station.ts`.
- **Add a project / asteroid**: `Project` in `projects.ts` (unique `id`, `planet` spaced > 0.15); for an asteroid add an `asteroids` entry in `side-quests.ts` plus its discovery.
- **Add an inventory item**: unique `id` and `abbr`; honest `rarity`; add its id to one group in `inventoryGroups` (inventory.ts), or the test fails.
- **Add a Refinery incident**: one entry in `refinery-incidents.ts` with exactly one `correct` option.
- **Change / rotate the contact form key**: edit `WEB3FORMS_ACCESS_KEY` in `transmission.ts` (see gamification.md "Transmission and contact form").
- **Update certifications**: `certifications.ts` (`officialCode: true` only for real exam codes; `issuerId` must exist in `issuers.ts` for the trophy logo). Pilot badges, trophies, resume follow.

## Types worth knowing
`Accent` = plasma|xp|coin|warp. `Tier` = MASTER|ADVANCED|SKILLED. `Rarity` = legendary|epic|rare|common. `QuestStatus` = active|completed|side|tutorial.
`SocialLink.id` = email|linkedin|github|resume. `SfxName` (17) = blip|select|error|warp|flip|discover|power-up|short|crack|whoosh|type|success|toggle|ping|alarm|promote|quarantine; `SfxOptions` = `degree?` `pitch?` `volume?`. `FxKind` = burst|confetti|ripple|shake|smoke|xp.
`GameEvent` (`types/events.ts`) = chapter:enter | discover | fx | game:result | nova:say | station:power | station:sync. `SceneLayers` = moonbase planets clouds planet nebula station asteroids aurora stars.

## Where each content file is consumed
- Launchpad: `launchpad`, `profile`. Pilot: `pilotCopy`, `profile`, `certifications`. VIT: `vit`, `education`. Nebula: `nebula`, `quests`, `debriefs`, `projects`.
- Station: `station`, `projects`, `quests`, `debriefs`. Armory: `armory`, `abilities`, `inventory`, `certifications`, `issuers`. Side quests: `side-quests`, `projects`, `refinery`, `refinery-incidents`.
- Transmission: `transmission`, `profile.links`, `profile.email`. HUD: `story`, `discoveries` (count, XP). Star chart: `story`, `projects`. NOVA: `nova`, `discoveries`, `story` (chapter labels).
- Quick view: `quick-view`, `profile`, `quests`, `projects`, `abilities`, `inventory`, `certifications`. Metadata/OG/sitemap: `profile`.
- Resume page: `resume` only (it imports certifications/education/profile internally).
