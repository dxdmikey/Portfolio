# Architecture in plain English

## The voyage and its layers
As the visitor scrolls, they "fly" through eight chapters. Behind and above the chapters sit several always-on layers:

```
 screen (top to bottom = in front of to behind)

  dialogs ........ star chart and mission briefings (native <dialog>, always on top)
  cursor ......... pixel block cursor
  scanlines ...... faint CRT lines (dark theme only)
  boot / countdown  PRESS START and 3-2-1 (only at the start of a visit)
  NOVA + FX ...... co-pilot dialogue (bottom-left) and the click-effects canvas
  HUD ............ XP bar, discoveries n/24, chapter pips, star chart, quick view, theme, sound, music
  player ship .... little rocket on the right edge, moves with your scroll (wide screens)
  CHAPTERS ....... the page content you read and click
  SKY ............ one canvas behind everything; colour and scenery change per chapter

  FLIGHT PATH (scroll down)            SKY SCENE (each chapter has its own neon colour)
  CH0 Launchpad .......... rocket ..... violet space: moonbase, ringed planet, moons
  CH1 Pilot profile ...... ID card .... blue sky with clouds
  CH2 Planet VIT ......... craters .... ultraviolet planet looming
  CH3 WinWire Nebula ..... stations ... hot pink nebula gas
  CH4 Navayuga Station ... power-up ... electric cyan, a station silhouette that lights up as you boot it
  CH5 Armory ............. inventory .. amber glow, starfield
  CH6 Side quests ........ asteroids .. neon green asteroid belt
  CH7 Transmission ....... contact ..... emerald aurora
```

## Three code layers that never mix
```
  CONTENT            LOGIC                  SCREENS
  src/content/  -->  src/game/, src/lib/ -->  src/components/
  (your words        (rules: XP, NOVA,           (what visitors see:
   and data)          station, audio, Refinery)   chapters, HUD, sky)
                           ^
                           |  services handed out by GameProvider
                           +------ src/providers/  (storage, audio, music, XP, discoveries, event bus)
```
- **Content** is plain typed data. Change what the site says without touching any screen code.
- **Logic** (`src/game/`) is ordinary TypeScript with no React in it, so it is easy to test (`tests/unit/`).
- **Screens** (`src/components/`) take content and render it. They ask for services through a hook called `useGame()`.

## How the parts talk: the event bus
Features do not call each other. When something happens, it is announced on a shared "bus", and whoever cares reacts:
```
  click a glowing thing --> discover event --> NOVA says a line
                                           --> FX canvas plays sparks and "+25 XP"
                                           --> the HUD counter and XP bar go up
  stop scrolling in a chapter --> chapter event --> NOVA introduces it
                                                --> the music mix changes and a soft whoosh plays
  power up a station module --> station event --> the station in the sky lights up
  finish a Refinery shift --> result event --> NOVA reacts
```
That is why you can add a new clickable thing (see [Editing content](editing-content.md)) without editing NOVA or the effects.

## How the page is built
`src/app/layout.tsx` sets up fonts and the page shell, then wraps everything in providers (theme, game services, overlay state).
`src/app/page.tsx` lists the layers and the chapters in order. The chapter order is defined once in `src/content/story.ts`, and `page.tsx` must follow the same order.
Parts that only make sense for the story (sky, ship, NOVA, effects, chapters) carry a `story-only` class; the recruiter summary carries `quick-only`.

## Quick view
The Quick view button in the HUD sets a flag on the page (`data-quick`). CSS then hides everything marked `story-only` (sky, ship, NOVA, effects, all chapters) and shows the plain summary.
The sky stops drawing and the music pauses while it is on. The choice is remembered in your browser, and a tiny script in the page head applies it before the first paint so the story never flashes.

## Sound and music
- One shared audio engine (`src/game/audio/`) owns the browser's single audio context. Browsers refuse to play sound until the visitor taps, clicks or presses a key, so audio starts on the first such
  gesture (the START button on the boot screen is usually it). Sound and music are **on by default** after that.
- **Sound effects** are synthesised (no audio files): 17 sounds defined as data in `patches.ts`. The soft "ping" you hear when clicking empty sky changes pitch with where you click, in the same musical key as the soundtrack.
- **Music** is an original loop called "Neon Drift", generated live. As you move through chapters, instruments fade in and out (calm at the launchpad, full band in the Armory, a soft outro at Transmission).
- The HUD has a **sound** toggle (mutes everything) and a **music** toggle (mutes only the soundtrack).

## The game layer
- **XP bar:** 100 points for every chapter you visit plus 25 for every discovery you find (1,400 in total). Progress is stored in your browser (localStorage), so it is remembered on that device only.
- **Discoveries:** 24 clickable secrets across the chapters.
- **NOVA:** follows where you are scrolling, but only speaks once you stop for a moment, so flying past five chapters gets one line, not five. It picks what to say using priorities (a direct message beats a game
  result, which beats a discovery, a chapter intro and finally idle tips) and never repeats a line in one visit; when you come back to a chapter it uses a short "welcome back" line instead.
- **Station:** modules must be powered in pipeline order (sources first). Each takes a moment to charge. Pressing one too early causes a short circuit and a hint from NOVA. When all eight are online you can run a demo sync.
  Progress is remembered.
- **Tech inventory:** a plain, non-clickable list of your tools in the Armory, grouped by what they do, with a colour-coded proficiency legend.
- **Refinery:** a pipeline on-call shift mini-game (three levels of sorting good and bad data records, then three production incidents).

## Contact
The contact form sends from the visitor's browser straight to Web3Forms (a free service), which forwards the message to your inbox. There is no server of ours involved. See
[Editing content](editing-content.md#contact-form-key-web3forms) to change the key.

## Why it is static
The site is exported to plain files (`out/`) and hosted free on Vercel. There is no server and no database, so nothing can break or cost money. The contact form uses a free third-party service instead of our own backend.

## Boot screen without flicker
The title card is part of the page HTML. A tiny script in the page head checks whether this browser tab has already pressed START (or whether Quick view is on) and, if so, hides the card
before anything is drawn. After START, a 3-2-1 countdown plays and then the launchpad appears. Returning visitors in the same tab skip both.

## Where to look when you want to change...
| I want to change... | Look in |
|---|---|
| words, projects, skills, NOVA's lines | `src/content/` |
| colours, fonts | `src/app/globals.css` |
| sky colours per chapter | `src/content/scenes.ts` |
| a chapter's layout | `src/components/chapters/` |
| shared building blocks (cards, buttons) | `src/components/ui/` |
| the HUD or star chart | `src/components/hud/` |
| NOVA's behaviour | `src/game/nova/`, `src/components/nova/` |
| sound effects, music, loudness | `src/game/audio/` |
| tools in the Armory inventory | `src/content/inventory.ts` |
| the contact form key | `src/content/transmission.ts` |
| deployment settings | `next.config.ts`, Vercel dashboard |

For the deep technical version see `.claude/context/architecture.md`.
