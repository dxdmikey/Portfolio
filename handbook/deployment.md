# Deployment

Your site is hosted for free on Vercel (Hobby plan). The code lives on GitHub in `dxdmikey/Portfolio` (public). Live URL: https://kadwasra.vercel.app

Status: shipped on 2026-10-04. The first-time steps below are already done; they stay here for reference.

## Turn on auto-deploy (one-time, still to do)
The GitHub repo is not yet connected to Vercel, so a `git push` alone does not redeploy yet.
1. Vercel dashboard > your avatar > Account Settings > Authentication > connect **GitHub** (the dxdmikey account).
2. In the project folder: `vercel git connect https://github.com/dxdmikey/Portfolio`
   (or in the dashboard: project `kadwasra` > Settings > Git > Connect Git Repository).
Until then, after `git push`, also run `vercel deploy --prod`.

## First time only (done)
In PowerShell, inside the project folder:
```powershell
gh auth login                       # sign in to GitHub (follow the prompts)
git init
git add .
git commit -m "Initial commit"
gh repo create dxdmikey/Portfolio --public --source=. --push
npm install -g vercel
vercel login                        # sign in to Vercel
vercel link                         # create/link the project named: kadwasra
```
Vercel settings (the defaults for Next.js are right): build command `npm run build`, output directory `out`.

## Settings you can change without touching code
Both are optional; the defaults live in the code. Add them in Vercel > project `kadwasra` > Settings >
Environment Variables (Production), then redeploy. Locally, copy `.env.example` to `.env.local`.

| Variable | What it changes | Default lives in |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | the site address used for the canonical URL, sitemap, share image and resume header | `src/content/profile.ts` |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | the contact form's Web3Forms key | `src/content/transmission.ts` |

Everything else you see on the site is plain data in `src/content/` (see [Editing content](editing-content.md)).

The contact form's Web3Forms key is already set in `src/content/transmission.ts`. It is a public key, so it is fine in a public repo. (To change it, see [Editing content](editing-content.md#contact-form-key-web3forms).)
You can also skip the CLI and use the Vercel dashboard: New Project, import the GitHub repo, and keep the defaults.

`_source/` (your raw photo and old files) is ignored by git on purpose. Never commit it.

## Every update after that
1. Edit content or code.
2. `npm run check` (must pass).
3. `npm run build` (must pass).
4. If you changed the resume: `npm run resume:pdf` (see [Resume](resume.md)).
5. Publish:
   ```powershell
   git add .
   git commit -m "Describe what you changed"
   git push
   ```
Once auto-deploy is connected (see above), Vercel notices the push and deploys in about a minute. Until then, also run `vercel deploy --prod`.

## Check that it deployed
- Vercel dashboard > project `kadwasra` > Deployments: look for a green "Ready".
- Open https://kadwasra.vercel.app, hard refresh (Ctrl+Shift+R), press START (music should begin on that first tap).
- Send yourself one real test message through the contact form on the live site and check your inbox.
- Also check https://kadwasra.vercel.app/resume/ and the resume PDF download.
- If the build failed, open the failed deployment's log; run `npm run build` locally to reproduce.

## Custom domain (later)
1. Buy a domain, then in Vercel: project > Settings > Domains > add it and follow the DNS instructions.
2. Set `NEXT_PUBLIC_SITE_URL` (for example `https://kadwasra.dev`) in Vercel's Environment Variables, or change the
   default in `src/content/profile.ts`. The resume header follows it automatically. Locally, put the same value in `.env.local`.
3. Regenerate the resume PDF and the share image (`npm run build`, then `npm run resume:pdf` and `npm run og`), commit and push.
