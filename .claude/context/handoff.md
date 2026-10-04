# Session handoff: where the build stands

> Read this first in a new session. Last updated **2026-10-04**. It records progress, every decision
> Ravi made, and what's left. Deep technical docs live in the other `.claude/context/*.md` files.

## TL;DR
- **v3 "The Voyage" (Ravi's 20-point review) is built and waiting for Ravi's review** on the local mock.
- **NOT shipped yet.** There is no GitHub repo, no Vercel deploy, and no commits beyond create-next-app's
  initial commit (`2e9ac9b`). Everything else is uncommitted in the working tree.
- **Ravi's one thing:** review the local mock (`npm run build && npx serve out -l 4180`, then http://localhost:4180). The Web3Forms access key is already set in `src/content/transmission.ts`
  (`WEB3FORMS_ACCESS_KEY`), so the contact form really sends; to change or rotate it, edit that constant. After the first deploy, send one real test message from the live site.
- **Next step:** apply his feedback, or on an explicit "ship it" start the ship phase below.

## Who / what
- **Owner:** Kadwasra Ravi Kumar (GitHub `dxdmikey`). Data & AI Engineer, Hyderabad.
  - Current role: Full-stack Developer & Data Engineer at Navayuga Engineering Company Ltd, since Sep 2026.
  - Previous: WinWire (SDE May 2025-Aug 2026; SDT Nov 2023-Apr 2025).
- **Product:** a static space-arcade portfolio, "an interactive space story". Next.js 16 static export,
  hosted free on Vercel Hobby.
- **Target URL:** `kadwasra.vercel.app`. Repo: **public** `dxdmikey/Portfolio`.

## Ravi's confirmed decisions (don't re-ask)
**Identity and content**
- Name: "Kadwasra Ravi Kumar". Headline: **Data & AI Engineer**.
- Top 6 skills, with levels out of 99: Azure 90, PySpark & SQL 90, Lakehouse 88, AI agents & RAG 80,
  Full-stack (AI-native) 75, Data viz 70.
- Full-stack framing: "AI-native builder: ships end to end with Claude, owns architecture, data flow and
  deployment". He builds with AI.
- Navayuga: name the company, but keep vendors vague ("enterprise ERP 2,400+ tables", "fuel-management API",
  "fleet telematics/IoT/truck data"). **No invented metrics.** Results show as "in progress". The station's
  first-sync finale uses clearly labelled **demo data**.
- Personality traits: Anime, Nature explorer, Gaming.
- Practice projects (AWS DW, Enterprise Data & Analytics Platform) are shown as side quests (asteroids), with no links.
  The platform (built with Claude) replaced the Retail Lakehouse on 2026-10-04 in the resume and the site.

**Contact and resume**
- Contact = big link cards (email, LinkedIn, GitHub, resume) **plus one contact form** (v3, decision 4) that posts from
  the browser to **Web3Forms** (free tier, 250 emails a month). The site stays 100% static; no backend, no database.
  The form never asks for a phone number; a honeypot field handles spam.
- **No phone number anywhere**, including the resume PDF. A test enforces this.
- Resume: `/resume` page plus `public/Kadwasra_Ravi_Kumar_Resume.pdf`, in the **same format as his
  original CV** (`_source/Kadwasra_Kumar_CV.pdf`), updated with Navayuga. Resume and quick view keep the CV job titles.

**Look and feel**
- Style: hybrid retro pixel. Dark + neon by default; light "day mode" is secondary.
- Mostly pixel icons. A few emojis are allowed, in NOVA's lines only.

**v2 rework (asked for after v1)**: clickable everything with juicy effects, a scroll-driven changing background,
"The Voyage" space story, an AI co-pilot (NOVA), a Quick view toggle for recruiters.

**v3 decisions (from the 20-point review and the Q&A, 2026-10-04)**
| # | Decision |
|---|---|
| 1 | Music: an **original procedural** synth loop ("Neon Drift"), not Riot's Valorant RGX (copyright). **On by default**, starts on the first tap/click/key, adapts per chapter. |
| 3 | **No PWA.** A smooth-mobile polish pass only. |
| 4 | Contact form via **Web3Forms** (key now set); the old "no forms" rule was lifted (CLAUDE.md now says: no backend/databases, one client-side form). |
| 9 | New nebula names ("Data Engineer Trainee", "Data Engineer", satellites Migration / Data Integration / Platform AMS) apply to the **nebula map only**. |
| 12 | Station: **all three upgrades** (boot logic, "Run first sync" finale, the sky reacts). |
| 13 | Loadout removed; the Armory lists a plain **tech inventory** (grouped tools, no game). Ravi asked to drop the Job-match scanner too (2026-10-04). |
| 15 | **No achievements.** XP = chapters visited x 100 + discoveries found x 25. |
| 18 | The Refinery is rebuilt as a **Pipeline on-call shift** (3 levels, conveyor, incident round, ranks, relaxed mode). |
| Also | Removed: Ctrl+K console, asteroids mini-game + Konami code, achievements + toasts, the inventory/loadout game, the mission-complete credits card. Added: neon per-chapter skies and a space launchpad, background-click "star ping", asteroid shatter, smarter NOVA tracking. |
**Answers given:** adding features after hosting is free and easy (each push to `main` redeploys in about a minute; branches get preview URLs).

**Process preferences**
- Ravi wants a plan first and questions until 95% clear, a local mock to approve before hosting,
  subagents on mixed models, SOLID code, CLAUDE.md under 200 lines, and docs in `handbook/`.
- He also sometimes messages subagents directly. Ask him to send requests in the main chat.

## What was built in the v3 session (2026-10-04)
Plan file: `C:\Users\ravikumar.k\.claude\plans\compressed-discovering-engelbart.md`. Detail lives in the context docs named in brackets.
- **Removals:** console (`cmdk` dependency gone), asteroids game + Konami, achievements + toasts, loadout/inventory game, credits card; `rng` now `src/lib/rng.ts`. [gamification.md]
- **Audio:** one `AudioEngine` (gesture unlock, interrupted/visibility handling, iOS playback session) fixes the old mute bug; 17 SFX as data in `patches.ts`; original adaptive music in `game/audio/music/`; sound + music
  default ON; music toggle in the HUD system menu; chapter whoosh; background pings tuned to the music's key. [architecture.md, gamification.md]
- **NOVA:** scroll-position spy, `chapter:enter` only after the scroll settles (200ms) and on change, stale chapter lines are interrupted, hold time = typing + reading buffer, merged greeting, revisit lines, phones narrate every chapter.
- **Sky and FX:** neon palette per chapter with a horizon band, `--scene-glow` CSS var, launchpad is now space (moonbase + planets, skyline deleted), sky station lights react to `station:power` / `station:sync`,
  background-click star ping with a shooting star every 6th click, asteroids fracture into shards. [design-system.md]
- **Station:** charge-up boot, boot log, short circuits, coloured packets, "Run first sync" finale with demo charts, persisted progress (`station` key). **Refinery:** the on-call shift. [gamification.md]
- **Content:** nebula map names, `winwire-sde` debrief refocused on the Commercial Data Platform (AMS), pilot "dossier" card back with a CLICK ME peek, issuer pixel logos on trophies, a plain Tech inventory, contact-first Transmission with
  the Web3Forms form. [content-model.md]
- **Mobile polish pass** by the UI agent ran in parallel with these docs (HUD, system menu, NOVA dock, nebula pills, station diagram, Refinery controls, contact form, sky performance on phones).

## Verified status (2026-10-04)
- `npm run check`: green. Typecheck, lint, and 295 unit tests in 35 files.
- `npm run build`: green, 6 static routes.
- `npm run test:e2e`: 66/66 passed (about 6 min, workers:2). A full-page axe scan is slow, so `a11y.spec` uses `test.slow()`.
- Lighthouse mobile: Performance 91–100, Accessibility 100, Best Practices 100, SEO 100. Desktop was not re-run for v3; v2 was 100 ×4.
- Visual review was done at 360/375/390/414/768/1440, in dark and light, with reduced motion. scrollWidth equals innerWidth on every chapter, and there were no console errors.
- The resume PDF and OG image were regenerated after the final build.
- Audio was not verified by ear. Ravi should listen to the music balance, the pump, and mute/unmute on his phone.
- For reference, the v2 baseline was 138 unit tests, 63 e2e passed / 3 skipped, Lighthouse mobile Performance 70-87.

## How to run
```bash
npm install                 # Node >= 20.9 (machine has Node 24)
npm run dev                 # http://localhost:3000
npm run build && npx serve out -l 4180   # production preview (the URL Ravi reviews)
npm run check               # typecheck + lint + unit tests
npm run test:e2e            # needs a fresh build; Playwright Chromium already installed
npm run resume:pdf && npm run og        # after build; regenerates PDF + og.png
```
- **Boot screen:** skipped when `sessionStorage['portfolio.exe:booted']='true'`. It is also the first gesture that unlocks audio.
- **Quick view:** stored in `localStorage['portfolio.exe:quickView']`.
- **Sound/music:** everything is silent until the first tap, click or key; then music starts (both prefs default ON). Tuning knobs: `MUSIC_LEVEL` in `src/game/audio/music/graph.ts`, `SFX_VOICE_LEVEL` in `src/game/audio/synth.ts`.

## Remaining work
1. **Ravi's review of v3.** Apply his feedback. For a large change, re-enter plan mode first.
2. **Contact form:** the key is set. Nothing to do before shipping except the post-deploy test message (step 3.8).
3. **Ship phase** (only after an explicit "ship it"):
   1. Install the CLIs: `winget install GitHub.cli` (or another method) and `npm i -g vercel`. Neither is
      installed yet.
   2. Ravi runs `! gh auth login` and `! vercel login` himself.
   3. Check `git status`. Make sure `_source/`, `out/`, `.next/`, `node_modules/` and `test-results/`
      are ignored (they already are in `.gitignore`).
   4. Commit, with the message ending in the Co-Authored-By line from the system attribution.
   5. `gh repo create dxdmikey/Portfolio --public --source . --push`.
   6. `vercel --prod`, project name `kadwasra` (framework Next.js, output `out`). If `kadwasra.vercel.app`
      is taken, propose an alternative to Ravi.
   7. Connect the Git integration for auto-deploys.
   8. Verify: the live URL returns 200, the OG image works, `/resume/` and the PDF download work, music starts on the
      first tap, and a test message from the contact form reaches Ravi's inbox.
4. **Optional polish ideas** (not requested): lazy-hydrate more below-the-fold chapters if mobile Lighthouse stays under target;
   more Refinery incidents or inventory tools (pure data).

## Gotchas learned
- **Next 16 differs from older versions.** Read `node_modules/next/dist/docs/` before using unfamiliar
  APIs. `next dev` re-adds an auto block at the bottom of CLAUDE.md; keep it.
- **`cn()` uses an extended tailwind-merge.** It has to know the `text-px-*` and `shadow-pixel*` scales.
  Without that, it drops the custom font sizes.
- **Lint forbids synchronous setState in effects.** Use `useSyncExternalStore`-backed stores.
- **Browsers block audio until a user gesture.** Only `AudioEngine` creates the AudioContext; never bypass it. Touch `pointerdown`
  does NOT count as activation (that was the old mute bug), which is why the engine listens to `pointerup`/`click`/`keydown`/`touchend`.
- **No `content-visibility` on chapters.** It breaks anchor and scroll positions; it was tried and reverted.
- **Static export plus `trailingSlash`.** Use `<Link prefetch={false}>` to `/resume/` to avoid RSC 404s.
- **Bash heredocs garble non-ASCII text in this environment.** Use the Write tool for files with
  emoji or dashes.
- **Private sources stay private.** `_source/` holds the raw photo, old CV and reference video, and is
  gitignored. Never commit it.
- **PyMuPDF is in the global Python.** A subagent installed it during the PDF comparison. Ravi may want
  it uninstalled (`python -m pip uninstall pymupdf`). Ask him.
- **Plans:** v3 (current) `C:\Users\ravikumar.k\.claude\plans\compressed-discovering-engelbart.md`; v2 (approved earlier)
  `C:\Users\ravikumar.k\.claude\plans\pasted-content-id-385a-goal-i-quizzical-micali.md`.
