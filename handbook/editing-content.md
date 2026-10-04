# Editing content

Everything the site says lives in `src/content/`. Edit a file, save, and the dev server (`npm run dev`) refreshes. When done: `npm run check`.

## Which file do I edit?
| I want to change... | File in `src/content/` |
|---|---|
| name, headline, bio, tagline, stats, links | `profile.ts` |
| what NOVA (the co-pilot) says | `nova.ts` (and the `line` of each discovery in `discoveries.ts`) |
| a job or its details | `quests.ts`, `debriefs.ts`, `resume.ts` |
| projects, their briefings, the station's modules | `projects.ts` |
| clickable secrets ("discoveries") | `discoveries.ts` |
| chapter names, taglines, order | `story.ts` |
| background colours per chapter | `scenes.ts` |
| launchpad text, sprite lines, countdown | `launchpad.ts` |
| ID card labels, the "Pilot dossier" on the back, stat explanations, trait emotes | `pilot.ts` |
| education craters | `vit.ts` (facts come from `certifications.ts`) |
| the nebula map (station names, satellites) | `nebula.ts` |
| Navayuga station text, boot-log lines, demo chart | `station.ts` |
| skill cards, trophy case labels | `abilities.ts`, `armory.ts` |
| tools in the Armory's tech inventory and their groups | `inventory.ts` |
| Microsoft / Databricks logos on the trophies | `issuers.ts` |
| certifications | `certifications.ts` |
| asteroids (practice builds) | `side-quests.ts` |
| the Refinery game's text and its production incidents | `refinery.ts`, `refinery-incidents.ts` |
| contact section text, the form, the Web3Forms key | `transmission.ts` |
| quick view labels | `quick-view.ts` |

## Change your bio, tagline or stats
Open `src/content/profile.ts`. Edit `bio`, `tagline`, `headline`, `experience`, `traits` or the six `stats` (values 0-100).
Links (email, LinkedIn, GitHub, resume) are in the `links` array. Never add a phone number.
Each stat also has a sentence NOVA says when a visitor clicks it: `statNotes` in `src/content/pilot.ts` (keyed by the stat's `id` in `profile.ts`, like `pipeline-design`). Keep it factual.
The back of the pilot ID card (the "Pilot dossier": headline, three bullets, "Currently", skills) is `dossier` in the same file. In the bullets, a piece of text with `strong: true` is highlighted.

## Change what NOVA says
Open `src/content/nova.ts`.
- `novaGreeting`: the hello, glued onto the front of the first chapter line NOVA says.
- `novaChapterLines`: two or three lines per chapter, spoken in order the first time a visitor stops in it. Every chapter must have an entry.
- `novaRevisitLines`: short "welcome back" lines for when a visitor returns to a chapter whose lines are used up. `{chapter}` is replaced with the chapter's name.
- `novaTips` and `novaJokes`: what NOVA says when someone clicks the robot (they alternate).
- `novaResultLines`: reactions to finishing the station and the Refinery shift (win and lose).
- Reaction to finding a clickable thing: the `line` of that item in `discoveries.ts`. 
Rules: keep lines short (they also play on phones), friendly and factual. NOVA is the only place emojis are allowed, and only occasionally. Do not invent numbers.
NOVA never repeats a line in one visit, and it waits until the visitor stops scrolling before it announces a chapter.

## Add a clickable discovery
A discovery is any clickable thing that counts toward "Discoveries n/24" and gives +25 XP the first time.
1. Open `src/content/discoveries.ts` and add a line to the list: `{ id: "my-thing", chapter: "armory", label: "What it is", line: "NOVA's reaction" }`.
   The `chapter` must be a real chapter id from `story.ts`. The `id` must be unique.
2. In the component that renders the thing, call `useDiscover("my-thing", { accent: "plasma" })` and run the returned `trigger(event)` in the click handler.
   (Look at `src/components/chapters/armory/trophy-card.tsx` for a small example.) Use a real `<button>` with a label. You can also pass `sound: "flip"` (or `crack`, `warp` ...) for the click's own sound.
3. The counter, the XP bar and NOVA's reaction update by themselves (the XP total grows by 25).
Optional: add `data-fx="confetti"` (or `burst`, `ripple`, `shake`, `smoke`) and `data-fx-accent="warp"` to any button for an effect on click, no code needed.

## Add a chapter and its sky scene
1. `src/content/story.ts`: add an entry in flight order with `id`, `number`, `label`, a 3-letter `short`, `tagline` and a `scene` key. The page order must match this list.
2. `src/content/scenes.ts`: reuse a scene key, or add one with a `dark` and a `light` keyframe: `skyTop`, `skyBottom` (the gradient), `horizon` (the bright neon band at the bottom), `glow`, and `layers`.
   Layers are numbers from 0 to 1: `moonbase`, `planets`, `clouds`, `planet`, `nebula`, `station`, `asteroids`, `aurora`, plus `stars` (density, 1 = normal). The sky fades between neighbouring chapters as you scroll,
   so change only one or two layers from the previous scene. Keep the gradient dark enough for text: a test checks the contrast. (A brand-new scene key also needs adding to `SceneKey` in `src/types/story.ts`.
   A brand-new layer type needs a developer.)
3. Fill the places that TypeScript will now complain about:
   - `src/content/nova.ts` `novaChapterLines`
   - `src/game/audio/music/mix.ts` `CHAPTER_MIX` (which music instruments play in that chapter, 0 to 1 each)
   - `src/components/hud/star-chart/chart-layout.ts` `CHAPTER_LOOK` (planet size and colour on the star chart)
4. Create the chapter component in `src/components/chapters/` using `<Screen id="my-chapter">` and `<ChapterHeading chapter="my-chapter" .../>`, then render it in
   `src/app/page.tsx` at the same position, inside the `story-only` block. ("Chapter n of N" in the heading counts the chapters by itself.)
5. Run `npm run check`. A test confirms chapters are numbered in order and every scene has both dark and light colours.
Changing only a chapter's title, tagline or sky colours needs just steps 1 and 2.

## Edit the nebula map (WinWire stations and satellites)
`src/content/nebula.ts`. The two stations are called "Data Engineer Trainee" and "Data Engineer", and the satellites carry their own labels ("Migration", "Data Integration", "Platform AMS").
These names appear on the nebula map only. The resume, the quick view and the debriefs keep your CV titles (set in `quests.ts`), so change those separately if a title changes.
Each satellite points at a sub-mission of its job through `subIndex`, and each station and satellite has a discovery id.

## Edit the Navayuga station modules
The "Power up the station" game uses the architecture of the `self-serve-platform` project in `src/content/projects.ts`. There is no separate list.
- `architecture.nodes`: each module has `id`, `label`, `detail` and a `column` (0 = sources, 1 = ingest, 2 = lakehouse and transforms, 3 = reports and AI agent).
- `architecture.edges`: pairs `[from, to]` of node ids. A module can only be powered once everything feeding it is online, and modules with no incoming edge can be powered first.
- Every edge must use ids that exist (a test checks). Visitors also see the same diagram in the star chart briefing.
- Column headings, intro text, the boot-log line for each module (`stationBootLines`), the sync stages (`stationSyncStages`) and the demo chart (`stationDemo`) are in `src/content/station.ts`.
  Keep it honest: "in progress", no metrics. The chart is labelled **demo data**, and its bar heights are only shapes.

## Add a job (quest)
1. Open `src/content/quests.ts`, copy an existing entry, give it a new unique `id`, and set `status` (`active`, `completed`, `side`, `tutorial`), `title`, `org`, `location`, `period`, `xp`,
   `summary`, `highlights` and `tags`. Optional `subQuests` hold client projects inside a role.
2. Add a matching mission debrief in `src/content/debriefs.ts` (same `id`): Mission, My role, Moves, Loot.
3. Use only real numbers from your resume. For Navayuga keep it metric-free and vendor-neutral.
4. Mirror the job in `src/content/resume.ts` so the resume page matches, then [regenerate the PDF](resume.md).
5. To show it as a station in the WinWire Nebula chapter, add it to `stations` in `src/content/nebula.ts` (plus a discovery id for it) and its sub-projects to `satellites`.

## Add a project (briefing and star chart moon)
1. Open `src/content/projects.ts` and copy an entry.
2. Give it a unique `id`, a `name`, a fun `codename`, a `status` (`in-orbit`, `completed`, `side-mission`), a `period`, and an `accent` colour (`plasma`, `xp`, `coin`, `warp`).
3. Fill in `problem`, `approach` (list), `outcome` (list) and `stack` (list). `architecture` (nodes and edges) is optional.
4. Keep `planet: { x, y, size, ring }` at least **0.15** away from every other project (distance in 0-1 space) or the unit test fails.
5. To place its moon on the star chart under the right chapter, add it to `PROJECT_SPOTS` in `src/components/hud/star-chart/chart-layout.ts`.
6. To make it an asteroid in Side quests, add an entry to `asteroids` in `src/content/side-quests.ts` (and a discovery, see above).

## Add an inventory item (the Armory's tech inventory)
Open `src/content/inventory.ts` and add a line: `{ id, abbr, name, rarity, category, note }`.
`abbr` is the 2-3 letter badge shown in the tile and **must be unique**. `rarity` is `legendary`, `epic`, `rare` or `common` and sets the badge colour (the "Proficiency" legend explains it: legendary = daily driver).
Then add the item's `id` to exactly one group in `inventoryGroups` further down the same file (Processing & languages, Data platforms & storage, Orchestration, AI, Viz & web, Cloud & tooling),
or the unit test fails. The section's title, intro and legend text are in `src/content/armory.ts` (`armoryCopy.inventory`). The inventory is display only: nothing in it is clickable.

## Update certifications and education
Open `src/content/certifications.ts`. Add or edit an entry (`code`, `name`, `issuer`, `issuerId`, `date`, `accent`). Set `officialCode: true` only for real exam codes.
`issuerId` picks the pixel logo on the trophy card; the available logos (Microsoft, Databricks) are in `src/content/issuers.ts`. A new issuer needs a small pixel grid and its brand colours added there
(brand colours are the one place raw colour codes are allowed).
Education is in the same file; the Planet VIT craters read from it, so they always agree with the resume.

## Update abilities (top 6 skills)
`src/content/abilities.ts`. There must be exactly six, levels between 1 and 99. The back of each card ("Where I used it") is in `src/content/armory.ts` `abilityUsage`, keyed by ability id.

## Add a Refinery incident
`src/content/refinery-incidents.ts`. Each incident has a `title` (the alert), a few `log` lines, three `options` (exactly one with `correct: true`) and an `explain` sentence shown afterwards.
Every shift picks 3 of them at random. Keep the scenarios realistic but generic: no vendor names, no real numbers. Game text and rank names are in `refinery.ts`.
To change how hard the shift is (records per level, belt speed, scoring), a developer edits `src/game/refinery/levels.ts` and `scoring.ts`.

## Contact form key (Web3Forms)
The contact form in the Transmission chapter sends your visitors' messages to your inbox through Web3Forms (free for 250 emails a month). Your access key is already set, so it works.
It is a public key by design (it only lets the form deliver mail to *your* inbox), so it is safe to commit. To change or rotate it:
1. Get a new key at https://web3forms.com (they email it to you).
2. Open `src/content/transmission.ts` and replace the value:
   ```ts
   export const WEB3FORMS_ACCESS_KEY: string = "your-new-key";
   ```
3. Run `npm run dev`, send yourself a test message through the form, and check your inbox.
If a send fails (no internet, key used up, Web3Forms down), the form offers a prefilled email in the visitor's mail app instead. The form has no phone number field, and a hidden field catches spam bots.
After the first deploy, send one real test message from the live site. The automated tests never send real email (they intercept the request).
The text of the form, its errors and the link cards (Email, LinkedIn, GitHub, Resume) is all in the same file.

## Change how loud the music and sound effects are
Two numbers, both small and safe to edit (save, then listen in `npm run dev`):
- **Music loudness:** `MUSIC_LEVEL` in `src/game/audio/music/graph.ts` (0.45 now; try 0.3 for quieter, 0.6 for louder).
- **Sound effects loudness:** `SFX_VOICE_LEVEL` in `src/game/audio/synth.ts` (0.06 now).
Which music instruments play in each chapter is `CHAPTER_MIX` in `src/game/audio/music/mix.ts` (0 = silent, 1 = full). The music defaults and the sound defaults are on (they start at the visitor's first tap).

## Update the resume and regenerate the PDF
1. Edit `src/content/resume.ts` (and `certifications.ts` / `profile.ts` if relevant).
2. Check it at http://localhost:3000/resume/ .
3. Rebuild and regenerate: see [Resume](resume.md) (`npm run build` then `npm run resume:pdf`).
4. Commit the updated `public/Kadwasra_Ravi_Kumar_Resume.pdf`.

## Quick view
The recruiter summary is built from the same files (profile, quests, projects, abilities, inventory, certifications), so it updates automatically. Its labels are in `src/content/quick-view.ts`.

## What the tests protect
Run `npm run check` (or `npm test`). The tests guard:
- chapters are numbered 0 to 7 in order, ids are unique, every scene has dark and light colours and keeps text readable
- every discovery points at a real chapter and ids are unique
- projects stay apart (> 0.15) and architecture edges point to real nodes
- exactly six abilities, each level between 1 and 99; every inventory `abbr` is unique; every inventory tool sits in exactly one group
- no phone number in the resume
- game logic: XP and visits, NOVA's director and scroll timing, the station machines, the contact form, particles, asteroid shards, the Refinery shift, the audio engine and music, storage

## Publishing your change
See [Deployment](deployment.md): commit, then `git push`.
