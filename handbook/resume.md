# Resume

## How it works
- Your resume text lives in `src/content/resume.ts` (it also reads `certifications.ts` and `profile.ts`). It has no phone number, on purpose.
- The page `/resume/` (file `src/app/resume/page.tsx`, styles in `resume.module.css`) renders that data as a clean print-friendly document.
  Visitors reach it from the Transmission chapter ("View resume page" and the Resume link card) and from Quick view.
- The downloadable PDF `public/Kadwasra_Ravi_Kumar_Resume.pdf` is produced from that same page by a script, so the web and PDF versions always match.
  The script (`scripts/generate-resume-pdf.ts`) opens `/resume/` from the built site in headless Chromium and prints it to A4.

## Update the PDF
```powershell
npm run build
npm run resume:pdf
```
The build must come first because the script reads the built `out/` folder. It writes the PDF to `public/` (and copies it into `out/`).
Then commit the PDF and push (see [Deployment](deployment.md)).

If Chromium is missing the script will fail; run `npx playwright install chromium` once (see [Troubleshooting](troubleshooting.md)).

## Preview before printing
Run `npm run dev` and open http://localhost:3000/resume/ . Check the page count and line breaks. The PDF uses the print layout.

## Social share image (bonus)
`npm run build` then `npm run og` rebuilds `public/og.png` (1200x630) from the `/og/` page, used when your link is shared.

## Rules
Only facts and numbers from your real resume. No phone number (a test enforces this). Keep Navayuga bullets metric-free and vendor-neutral.
