# Deployment

Your site is hosted for free on Vercel (Hobby plan). The code lives on GitHub in `dxdmikey/Portfolio` (public). Live URL: https://kadwasra.vercel.app

## First time only
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
Vercel settings (the defaults for Next.js are right): build command `npm run build`, output directory `out`, no environment variables.

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
Vercel notices the push and deploys automatically in about a minute. No other step.

## Check that it deployed
- Vercel dashboard > project `kadwasra` > Deployments: look for a green "Ready".
- Open https://kadwasra.vercel.app, hard refresh (Ctrl+Shift+R), press START (music should begin on that first tap).
- Send yourself one real test message through the contact form on the live site and check your inbox.
- Also check https://kadwasra.vercel.app/resume/ and the resume PDF download.
- If the build failed, open the failed deployment's log; run `npm run build` locally to reproduce.

## Custom domain (later)
1. Buy a domain, then in Vercel: project > Settings > Domains > add it and follow the DNS instructions.
2. Update `siteUrl` in `src/content/profile.ts`, and the displayed `portfolio` text in `src/content/resume.ts`.
3. Regenerate the resume PDF and the share image (`npm run build`, then `npm run resume:pdf` and `npm run og`), commit and push.
