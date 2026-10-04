# Getting started

## 1. Install the tools (once)
- **Node.js 20.9 or newer** (LTS is fine): https://nodejs.org . Check in PowerShell:
  ```powershell
  node --version
  npm --version
  ```
- **Git**: https://git-scm.com/download/win
- Optional: GitHub CLI (`gh`) and Vercel CLI, see [Deployment](deployment.md).

## 2. Install the project
Open PowerShell in the project folder (`C:\Users\ravikumar.k\portfolio`):
```powershell
cd C:\Users\ravikumar.k\portfolio
npm install
```
This downloads everything into `node_modules/`. Run it again only after `package.json` changes.

## 3. Run it while you edit
```powershell
npm run dev
```
Open http://localhost:3000. The page reloads when you save a file. Press Ctrl+C in the terminal to stop.
The first visit shows the boot screen: press any key (or click or tap) to start, then a 3-2-1 countdown plays (click or press a key to skip it). That first press is also what lets the browser play sound,
so music and effects begin right then. It remembers you pressed start for that browser tab only.

## 4. Preview the real, final version
This builds the static site exactly like Vercel does and serves it:
```powershell
npm run build
npm run preview
```
Open http://localhost:4173 . The build output goes to the `out/` folder.

## 5. Check your work
```powershell
npm run check
```
That runs the type check, the linter and the unit tests. Fix anything it reports before publishing.

## Useful scripts
| Command | What it does |
|---|---|
| `npm run dev` | local dev server on port 3000 |
| `npm run build` | build the static site into `out/` |
| `npm run preview` | serve `out/` on port 4173 |
| `npm run check` | typecheck + lint + unit tests |
| `npm run test:e2e` | browser tests (needs a fresh build; see Troubleshooting) |
| `npm run resume:pdf` | regenerate the resume PDF (needs a fresh build) |
| `npm run og` | regenerate the social share image (needs a fresh build) |
| `npm run images` | rebuild web photos from `_source/My photo.png` |

## Handy things to try on the site
- Click the rocket on the launchpad, then scroll to fly through the chapters. Click NOVA (bottom-left) for a tip or joke.
- Click on empty sky anywhere: a little "star ping" rings out, and its note changes with where you click. Every sixth click launches a shooting star.
- The theme toggle switches between night and day mode; the speaker and music buttons (in the HUD, or in the "System" menu on a phone) control sound and music.
- The planet icon in the HUD opens the star chart (warp to any chapter or open a project briefing); the scroll icon toggles Quick view.
- In the Navayuga chapter, power up the station, then press "Run first sync". In Side quests, work a Refinery shift.
- In Transmission, the message form sends a real email to you through Web3Forms, so use your own address when testing (see [Editing content](editing-content.md#contact-form-key-web3forms) to change the key).
