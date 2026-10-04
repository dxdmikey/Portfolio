# Troubleshooting

## `npm run dev` says the port is in use
Another dev server is still running. Find and stop it:
```powershell
netstat -ano | findstr :3000
taskkill /PID <the-number-from-the-last-column> /F
```
Or run on another port: `npx next dev -p 3001`. For the preview server (4173) do the same with `:4173`.

## Playwright says a browser is missing
Browser tests (`npm run test:e2e`) and the PDF/OG scripts need Chromium:
```powershell
npx playwright install chromium
```
The e2e tests also need a fresh `npm run build` first, because they test the built site on port 4173.

## `npm run resume:pdf` says "out/ not found"
Run `npm run build` first.

## "Hydration" warnings in the browser console
They mean the server HTML and the first browser render disagreed. Common causes: reading `localStorage`, `Date.now()` or `window` while rendering,
or a browser extension modifying the page (try a private window). In this project browser-only things must live in effects or event handlers,
and changing state is read through `useSyncExternalStore` hooks. The `<html>` tag has `suppressHydrationWarning` for the theme attribute only.

## Lint error about setState in an effect
Rule `react-hooks/set-state-in-effect`: do not call a `setState` straight inside `useEffect`. Compute the value during render, update it in an event handler, or use a store hook.

## Resetting XP, discoveries and best scores
Progress is stored in your browser only. To reset it: open the site, press F12 > Application > Storage > "Clear site data" (or clear site data for `localhost:3000`
or kadwasra.vercel.app in browser settings). This clears visited chapters, discoveries (and so XP), the sound and music settings, NOVA mute, the station's progress, Quick view choice,
the Refinery best score and briefings opened.
The "pressed START" flag lasts only for the browser tab session; closing the tab shows the boot screen and countdown again.

## Stuck in Quick view (the story won't come back)
Quick view is remembered in your browser. Normally the "Back to the voyage" button (top of the quick page) or the scroll icon in the HUD switches it off.
If neither works, clear the saved choice:
1. Press F12 > Application > Local storage > select the site.
2. Delete the key `portfolio.exe:quickView` (or choose "Clear site data" and reload).
Quick view skips the boot screen and hides the sky, ship, NOVA and effects on purpose, so a "blank" background there is expected.

## Reduced motion: what changes
If your system has "reduce motion" turned on (Windows: Settings > Accessibility > Visual effects > Animation effects off), the site calms down:
- no 3-2-1 countdown (it goes straight to the launchpad), no typewriter for NOVA's text (lines appear at once)
- no screen shake and no particles; "+XP" labels still appear but do not float
- cards (ID card, skill cards) swap faces instead of flipping; the rocket vanishes at once instead of flying off; asteroids swap instead of shattering; the radio beam does not animate
- the station powers up and syncs instantly, and the Refinery starts in relaxed mode (no timers)
- the sky stops drifting and redraws a still frame after you scroll; the ship does not tilt or leave a trail; clicking empty sky shows a still ring instead of a burst
Everything is still clickable and every discovery still counts. If you see animations anyway, check that setting and reload.

## NOVA is quiet, or in the way
NOVA fades back to just the robot after a few seconds. Click the robot for the next tip or joke. The "mute" button on its speech bubble silences it (saved in your browser);
click the sleeping robot to wake it. NOVA waits until you stop scrolling (about a fifth of a second) before it speaks about a chapter, so a fast scroll through several chapters gets just one line.
On phones it narrates every chapter too, but with short lines, and folds away sooner so it does not cover content.

## The sky, ship or NOVA are missing
They are hidden in Quick view. The player ship also only shows on wide screens (about 1280px and up) and appears after you launch the rocket or scroll past the launchpad.

## Sound or music is silent
Sound and music are on by default, but browsers refuse to play any audio until the visitor taps, clicks or presses a key once, so nothing is heard on a page you have only looked at. Press START (or click anywhere) first.
Then check, in order:
- The speaker button in the HUD (on a phone: the star "System" menu) must show sound on; it mutes everything. The music button next to it mutes only the soundtrack.
- Quick view pauses the music on purpose. Switch back to the story.
- A hidden browser tab pauses the audio, and it resumes when you return.
- On an iPhone, check the volume; the site asks iOS to play even with the silent switch on, but some old iOS versions ignore that.
- Too quiet or too loud? See "Change how loud the music and sound effects are" in [Editing content](editing-content.md#change-how-loud-the-music-and-sound-effects-are).

## The contact form offers an email draft instead of sending
That is the fallback after a failed send. Check your internet connection, that the key in `WEB3FORMS_ACCESS_KEY` (`src/content/transmission.ts`) is still valid (see
[Editing content](editing-content.md#contact-form-key-web3forms)), and that the free monthly limit (250 emails) is not used up.

## Text looks the wrong size or font after editing classes
Use `cn()` from `@/lib/cn` to combine class names (it knows the custom `text-px-*` sizes) and use only the design tokens. See `.claude/context/design-system.md`.

## Build fails on Vercel but works locally
Run `npm install` and `npm run build` from a clean clone state, and read the Vercel log. Features needing a server (API routes, server actions) are not allowed: the site is a static export.

## The photo is missing after cloning
`_source/` is not in git. The web photos in `public/images/` are committed. Only run `npm run images` if you put `_source/My photo.png` back.
