# Deployment

## Targets
- GitHub: `dxdmikey/Portfolio` (public).
- Vercel: Hobby plan, project `kadwasra` -> https://kadwasra.vercel.app (`profile.siteUrl` in `src/content/profile.ts` drives metadata, sitemap, robots).
- Framework preset: Next.js. Build command `npm run build`. Output directory `out` (static export). Install: `npm install`. Node >= 20.9 (`engines`).
- No env vars, no functions, no server cost. Push to the production branch triggers an automatic deploy; other branches/PRs get preview URLs.
- The contact form needs no host support: the browser posts straight to Web3Forms (free tier, 250 emails/month). Its PUBLIC access key lives in `src/content/transmission.ts` `WEB3FORMS_ACCESS_KEY`
  (committed on purpose; it only delivers mail to Ravi). The key is already set, so the form really sends; a failed send offers a prefilled `mailto:` instead. To change or rotate it, edit that one constant (get a new key at web3forms.com).

## Before committing
0. After the FIRST deploy: send one real test message from the live contact form and check Ravi's inbox (tests intercept the request and never send real email).
1. `npm run check` green.
2. `npm run build` succeeds (writes `out/`).
3. If resume content (`src/content/resume.ts`, `certifications.ts`, `profile.ts`) changed: `npm run resume:pdf` (needs a fresh build; it serves `out/`, prints `/resume/` in headless Chromium to A4,
   writes `public/Kadwasra_Ravi_Kumar_Resume.pdf` and copies it into `out/`). Commit the updated PDF.
4. If OG art (`src/app/og/page.tsx`) changed: `npm run build && npm run og` -> `public/og.png` (1200x630). Commit it.
5. If the source photo changed: place it at `_source/My photo.png`, run `npm run images` -> `public/images/ravi.webp` and `ravi@2x.webp`. Commit the outputs.
Order matters: build first (scripts read `out/`), regenerate, and rebuild only if you want `out/` to include the new files locally (Vercel rebuilds anyway; the PDF/PNG come from `public/`).

## First-time setup (CLI)
```
gh auth login
git init && git add . && git commit -m "Initial commit"
gh repo create dxdmikey/Portfolio --public --source=. --push
npm i -g vercel
vercel login
vercel link          # project: kadwasra
vercel --prod        # or just connect the GitHub repo in the Vercel dashboard
```
Afterwards: `git push` is the deploy.

## Gitignore (key entries)
`/node_modules`, `/.next/`, `/out/`, `.env*`, `.vercel`, `*.tsbuildinfo`, `next-env.d.ts`, **`/_source/`** (raw photo, old CV, reference recording: private, never commit),
`/test-results/`, `/playwright-report/`, `/blob-report/`, `/coverage`. `public/` assets (PDF, og.png, images/) ARE committed.

## Custom domain (later)
Add it in Vercel project settings, then update `siteUrl` in `profile.ts` (`resume.portfolioHref` derives from it) and the display string `portfolio` in `resume.ts`, regenerate PDF and OG, and push.

## Checks after deploy
Open the URL, press START (music and sound begin on that first tap), test `/resume/` and the PDF link, send a test message through the contact form, check `/sitemap.xml` and `/robots.txt`, and the OG preview. Never add anything that needs a server of our own.

## Vercel settings checklist
| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Build command | `npm run build` |
| Output directory | `out` |
| Install command | `npm install` |
| Node version | 20.x or newer (package requires >= 20.9) |
| Environment variables | none |
| Plan | Hobby (free) |

## Local verification of the exact artifact
`npm run build` then `npm run preview` serves `out/` at http://localhost:4173 (uses `serve`). This is what Playwright and the PDF/OG scripts also serve
(scripts use their own tiny static server in `scripts/lib/static-server.ts` on a random port).

## Gotchas
- `trailingSlash: true` means routes are `/resume/` and `/og/` (folders with `index.html`). Link with the trailing slash.
- `public/Kadwasra_Ravi_Kumar_Resume.pdf` is referenced by `profile.links` (`resume` id) and `resume/page.tsx` (`PDF_HREF`); keep the filename stable.
- `/og/` is a real page used only as a screenshot source; `robots.ts` disallows it.
- Scripts need Playwright's Chromium: `npx playwright install chromium` once per machine.
