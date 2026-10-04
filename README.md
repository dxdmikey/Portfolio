# PORTFOLIO.EXE

**The Voyage**: an interactive space story portfolio for **Kadwasra Ravi Kumar**, Data & AI Engineer. Press START, watch the 3-2-1 countdown and scroll to fly through a real career,
chapter by chapter, with a co-pilot named NOVA narrating along the way.

**Live:** https://kadwasra.vercel.app

## Features
- **Scroll-driven flight:** eight chapters (Launchpad, Pilot profile, Planet VIT, WinWire Nebula, Navayuga Station, Armory, Side quests, Transmission) over a pixel sky with its own neon colour per chapter
  (a moonbase in space, clouds, planet, nebula, station, asteroid belt, aurora), with a player ship that follows your scroll on wide screens
- **Clickable everything:** 24 hidden discoveries with particle bursts, screen shake and floating "+25 XP"; the rocket launches, the ID card flips, craters crack, asteroids shatter into shards; even clicking the empty sky sends a "star ping"
- **NOVA, the AI co-pilot:** a pixel robot with typewriter dialogue that follows your scroll, narrates each chapter you land on and reacts to discoveries and game results (mute-able, screen-reader friendly)
- **Sound and music:** synthesised sound effects and an original adaptive soundtrack ("Neon Drift") that changes mix per chapter. It starts on your first tap or key press, and there are sound and music toggles in the HUD
- **Games and interactions:** boot the Navayuga station module by module and run its first data sync, browse Ravi's tech inventory in the Armory, and work a pipeline on-call shift in the Refinery
- **Star chart:** a HUD overlay that warps you to any chapter or opens project briefings with architecture diagrams
- **Quick view:** one click gives recruiters a compact, static summary (roles, projects, skills, tools, certifications, contact, resume) with no story layers or canvases; the choice is remembered
- **Contact:** link cards plus a message form that sends through Web3Forms straight to Ravi's inbox (falls back to a prefilled email if a send fails)
- XP bar (chapters visited + discoveries found), night and day themes, full reduced-motion support, keyboard accessible
- Print-ready web resume at `/resume/` plus a generated PDF
- 100% static: no backend, no database (the only form posts from the browser to Web3Forms)

## Tech stack
Next.js 16 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Motion · next-themes · hand-written Web Audio ·
Vitest + Testing Library · Playwright + axe · deployed on Vercel Hobby.

## Quick start
Requires Node.js 20.9 or newer.
```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | dev server on port 3000 |
| `npm run build` | static export to `out/` |
| `npm run preview` | serve `out/` on port 4173 |
| `npm run check` | typecheck + lint + unit tests |
| `npm run typecheck` / `lint` / `test` | the individual checks |
| `npm run test:e2e` | Playwright tests against the built site (build first) |
| `npm run images` | photo from `_source/` to `public/images/*.webp` |
| `npm run resume:pdf` | `/resume/` to `public/Kadwasra_Ravi_Kumar_Resume.pdf` (build first) |
| `npm run og` | social share image to `public/og.png` (build first) |
| `npm run format` | Prettier |

## Project structure
```
src/app/          layout, page (chapter order), resume/, og/, globals.css (design tokens)
src/content/      all copy and data (typed): story, scenes, discoveries, NOVA, station, inventory, refinery, transmission ...
src/types/        content, story, events and game types
src/game/         framework-free logic (event bus, discoveries, scene interpolation, fx, nova, station,
                  belt, refinery, contact form, audio + music, galaxy, progress, preferences)
src/providers/    GameProvider (services), UiProvider (star chart overlay)
src/hooks/        React hooks over the services (useDiscover, useBusEvent, useQuickView, useMusic, ...)
src/components/   chapters, scene (sky, ship, fx), nova, hud, quick-view, shared, ui, effects
src/lib/          cn, storage, constants, rng, pixel-path
tests/unit/       Vitest      tests/e2e/  Playwright
scripts/          images, resume PDF, OG image
handbook/         human docs      .claude/  agents, skills, context for Claude
```

## Documentation
- [Handbook](handbook/README.md): getting started, editing content, architecture, deployment, troubleshooting
- [CLAUDE.md](CLAUDE.md): project rules and conventions for AI-assisted work

## License
All rights reserved — content © Kadwasra Ravi Kumar; code may be referenced for learning.
