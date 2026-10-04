# PORTFOLIO.EXE handbook

Welcome, Ravi. This handbook explains how to run, edit and ship your portfolio without needing to remember how it was built.

**What it is:** an interactive space story called **The Voyage**. Visitors press START, watch a 3-2-1 countdown, then scroll to fly through your career
as eight chapters while the background sky changes colour from a moonbase launchpad to deep space. A pixel co-pilot named **NOVA** narrates, most things that glow can be clicked
(24 hidden "discoveries"), music and sound effects play along, and a **Quick view** button gives recruiters a plain one-page summary. It is a fully static website: no server,
no database, free hosting on Vercel. The only "form" is the contact form, which sends from the visitor's browser to a free service called Web3Forms.

## The chapters
| # | Chapter | What happens there |
|---|---|---|
| 0 | Launchpad | Boot screen, countdown, rocket to launch, name letters to poke, a hidden constellation |
| 1 | Pilot profile | Flip-able ID card (the back is your "Pilot dossier"), stats, traits, certification badges |
| 2 | Planet VIT | Education: crack four craters to read the facts |
| 3 | WinWire Nebula | Your WinWire roles as map stations ("Data Engineer Trainee", "Data Engineer") with satellite sub-missions and debriefs |
| 4 | Navayuga Station | Current role: boot the station module by module, then "Run first sync" (demo data, no metrics, on purpose) |
| 5 | Armory | Flip skill cards, a plain tech inventory (your tools, grouped), trophy case with issuer logos |
| 6 | Side quests | Shatter asteroids (practice projects) and work a shift in the Refinery data game |
| 7 | Transmission | Contact form, big link cards (email, LinkedIn, GitHub, resume), radio dish light show |

## Guides
1. [Getting started](getting-started.md) - install and run it on your PC
2. [Editing content](editing-content.md) - change your bio, jobs, projects, NOVA's lines, discoveries, the tech inventory, the contact form key, music levels
3. [Architecture](architecture.md) - how the pieces fit together, in plain English (with a diagram of the voyage)
4. [Deployment](deployment.md) - put it online and update it
5. [Resume](resume.md) - how the resume page and PDF are made
6. [Troubleshooting](troubleshooting.md) - when something goes wrong (no sound, stuck in Quick view, reduced motion, resetting progress)

## Screenshots
There are no screenshots stored in this handbook. To see the real thing, run `npm run dev` and open http://localhost:3000
(see Getting started). If you want screenshots for the docs, save them in `handbook/images/` and link them from here.

## Before going live
- **Review the site locally:** `npm run build` then `npm run preview`, open http://localhost:4173, and tell Claude what to change. Nothing is published until you say "ship it".
- **Contact form:** your Web3Forms key is already in `src/content/transmission.ts`, so the form sends real messages. After the first deploy, send yourself one test message from the live site and check your inbox
  (see [Editing content](editing-content.md#contact-form-key-web3forms) if you ever need to change the key).

## Golden rules
- All the words and data live in `src/content/`. Edit there, not in components.
- Never put a phone number anywhere (the contact form has no phone field, on purpose).
- Only use numbers that are on your real resume. Do not invent metrics. Navayuga has none yet.
- Keep employer vendor names vague at Navayuga (for example "enterprise ERP").
- Emojis are only for NOVA's lines. Everywhere else the site uses pixel icons.
- Run `npm run check` before you publish.
