# Agents and skills

## Subagents (`.claude/agents/*.md`)
| Agent | Model | Use when |
|---|---|---|
| `architect` | opus | Complex/stateful work: the audio engine and music, NOVA, the station and Refinery state machines, canvas rendering, star chart, provider/DI wiring. Pure logic goes in `src/game/<feature>/` with tests; canvas must use rAF, DPR scaling, pause when hidden, honour reduced motion, clean up, offer a text alternative. |
| `ui-designer` | opus | Look-and-feel is the main risk: tokens, pixel art, hero/boot sequence, HUD, motion polish, theming. Uses `frontend-design` and `ui-ux-pro-max`. Tokens only; checks 375/768/1440 in dark and light. |
| `section-builder` | sonnet | Well-specified presentational sections/pages from typed content (character, abilities, quest log, inventory, trophies, contact, resume page). Composes `components/ui` primitives; Server Components preferred; <= ~150 lines per component. |
| `doc-writer` | sonnet | After features land: update CLAUDE.md (< 200 lines), `.claude/context/*.md`, `handbook/*.md` so they match the code. |
| `qa-checker` | haiku | Before every hand-off: runs `npm run check`, `npm run build`, `npm run test:e2e` in order, stops at first failure, reports stage + test/rule + file:line + one-line fix; only fixes trivial issues. |

Every agent finishes with `npm run check` green (except qa-checker, which reports). Agents read `CLAUDE.md` first, then their relevant context file.

## Skills (`.claude/skills/`)
| Skill | Use it for |
|---|---|
| `frontend-design` | Aesthetic direction and distinctive UI decisions (visual identity work, new screens). |
| `ui-ux-pro-max` | Palettes, type pairings, UX guidelines, style/charts lookups (has `scripts/search.py`, `scripts/design_system.py` and CSV data). |
| `web-design-guidelines` | Auditing UI code for accessibility/UX/Web Interface Guidelines compliance. |
| `react-best-practices` | Vercel React/Next.js performance rules when writing or reviewing components, bundles, rerenders. |
| `composition-patterns` | Refactoring boolean-prop sprawl, compound components, context/provider structure, React 19 API notes. |

Skills are reference material; they never override CLAUDE.md hard constraints (static export, no phone, no invented metrics).

## Delegation recipes
- New complex feature (state machine, canvas, registry): `architect` builds logic + tests -> `section-builder` or `ui-designer` does the presentation -> `qa-checker` verifies -> `doc-writer` updates docs.
- New copy/data only (a job, a project planet, an inventory item): edit `src/content/` directly (see `content-model.md`); no agent needed. Run `npm run check`.
- Visual refresh (tokens, theme, motion): `ui-designer`, then `qa-checker` with extra attention to contrast in light mode and reduced motion.
- Docs drift after a feature: `doc-writer`; it must read the changed code first and never describe features that do not exist.
- Pre-release: `qa-checker` (check -> build -> e2e); the specs were rewritten for the voyage and v3, so failures are real regressions.

## How v2 "The Voyage" was split (reference for similar reworks)
Plan lives in `C:\Users\ravikumar.k\.claude\plans\` (the quizzical-micali plan). Strict file ownership so agents could run in parallel:
1. **Lead (opus)**: content model (`story`, `scenes`, `nova`, `discoveries`), types, `game/events/bus.ts`, `game/discoveries/tracker.ts`, `game/scene/interpolate.ts`, provider wiring,
   chapter scaffold in `page.tsx`, HUD chapter tracker, with unit tests.
2. **ui-designer (opus)**: `components/scene/*` (sky, player ship, FX layer, shake), CH0 Launchpad (countdown, rocket, name, sprite, constellation), CH7 Transmission and credits.
3. **architect (opus)**: NOVA (`game/nova`, `components/nova`), CH4 Navayuga Station power-up (`game/station`, `components/chapters/station`), star chart overlay (`components/hud/star-chart`).
4. **section-builder A (sonnet)**: CH1 Pilot profile, CH2 Planet VIT, CH3 WinWire Nebula.
5. **section-builder B (sonnet)**: CH5 Armory, CH6 Side quests, Quick view.
6. **section-builder (sonnet)**: e2e rewrite. **doc-writer (sonnet)**: CLAUDE.md, `.claude/context/*`, `handbook/*`. **qa-checker (haiku)**: full gates.
Shared files that several owners touch (`globals.css`, `content/discoveries.ts`, `page.tsx`) are best appended to rather than rewritten; `globals.css` carries marked per-owner blocks (for example "The Voyage: scene, FX, launchpad, transmission (ui-designer)").
Note: `.claude/agents/section-builder.md` and `architect.md` still use v1 wording ("sections", "galaxy map"); the rules in them still apply to chapters.

## How v3 ("Ravi's 20-point review") was split (2026-10-04)
Plan: `C:\Users\ravikumar.k\.claude\plans\compressed-discovering-engelbart.md`. Phases ran in order, each agent owning its files:
- **A, removals (section-builder)**: console, asteroids game + Konami, achievements + toasts, loadout, credits card; `rng` moved to `src/lib/rng.ts`; XP reworked to chapters + discoveries.
- **B, in parallel**: B1 audio engine + SFX registry + music (architect/opus); B2 NOVA scroll spy and director timing (architect/opus); B3 neon skies, space launchpad, background pings, asteroid fracture (ui-designer/opus);
  B4 nebula names, pilot dossier, trophy logos, contact form (section-builder/sonnet; the Job-match scanner built here was dropped later and replaced by a plain tech inventory).
- **C, in parallel after B1**: C1 station boot logic + first sync + sky reaction (architect); C2 Refinery on-call shift (architect).
- **D**: mobile polish (ui-designer), QA (qa-checker), docs (doc-writer).
Known stale wording: `.claude/agents/architect.md` still lists "the console registry" in its description (agent files were not part of the doc pass).

## Model rationale
- opus for work where a wrong design is expensive (engines, DI, visual identity).
- sonnet for well-specified, template-like building and for documentation.
- haiku for mechanical verification and reporting.

## Rules every agent inherits (from CLAUDE.md)
Static export only; free tier only; never a phone number; no invented metrics; vague Navayuga vendor names; `_source/` never committed;
Next 16 differs from older versions, so read `node_modules/next/dist/docs/` before using an unfamiliar API.
Agent files are plain markdown with frontmatter (`name`, `description`, `model`); edit the body to change behaviour.

## Invocation tips
- Give the agent the exact files and the acceptance criteria (for example "375px, dark + light, reduced motion").
- Ask architect for trade-offs in its report; ask qa-checker only to report, not redesign.
- Run independent agents in parallel (for example section-builder on two unrelated sections); serialise anything touching `content/story.ts`, `content/discoveries.ts`, `page.tsx` or `globals.css`.
- doc-writer output must obey: CLAUDE.md < 200 lines, `.claude/context/` dense and precise, `handbook/` friendly with Windows-friendly commands.
- The `<!-- BEGIN:nextjs-agent-rules -->` block at the bottom of CLAUDE.md is auto-generated by `next dev`; do not delete it.
