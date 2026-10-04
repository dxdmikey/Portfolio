# Design system

Source of truth: `src/app/globals.css` (Tailwind v4 CSS-first, `@theme inline`). Theme switch: next-themes writes
`data-theme="dark|light"` on `<html>`; `@custom-variant light` exists for `light:` utilities. Dark is default (`:root` and `[data-theme="dark"]`).

## Colour tokens (Tailwind class names = `bg-void`, `text-plasma`, `border-grid`, ...)
| Token | Dark | Light ("day mode") | Use |
|---|---|---|---|
| void | `#0a0b1e` | `#f1f0ff` | page background |
| nebula | `#16183d` | `#ffffff` | raised panels |
| nebula-2 | `#20235a` | `#e6e4ff` | hover / inset |
| grid | `#2c3070` | `#c9c6f2` | borders, hard shadows |
| starlight | `#e8e9ff` | `#17183a` | body text |
| dust | `#9a9ed6` | `#4c4f86` | secondary text |
| plasma | `#3ef0ff` | `#00739e` | identity, links (cyan) |
| xp | `#9bff4a` | `#2d7a0c` | progress, success, done (lime) |
| coin | `#ffc93c` | `#925f00` | headings, active (amber) |
| warp | `#ff4fd8` | `#a8128a` | side quests, rare (magenta) |
| danger | `#ff5a6e` | `#c0182f` | errors |
| on-accent | `#0a0b1e` | `#ffffff` | text on solid accent fills |
Also CSS vars only: `--scanline-opacity` (0.07 dark / 0 light), `--star` (`#ffffff` / `#6d6ab8`).
Light values were chosen for >=4.5:1 contrast; keep it that way when editing. Never write raw hex in components; use tokens.

## Scene palettes (`content/scenes.ts`, types `ScenePalette` / `SceneKeyframe` in `types/story.ts`)
The place raw hex is allowed for the sky (canvas art data); the other exception is brand logo colours in `content/issuers.ts`. Each `SceneKey` has `dark` and `light` keyframes
`{ skyTop, skyBottom, horizon, glow, layers }`: the gradient runs skyTop -> skyBottom -> `horizon` (the saturated neon floor, the last ~9 of 28 bands), `glow` colours props and the `--scene-glow` UI accent.
`layers` = opacity 0-1 for `moonbase planets clouds planet nebula station asteroids aurora`, plus `stars` (density multiplier, up to 1.6 on the launchpad).
Renderer draw order, back to front: aurora, nebula, planets, station, planet, asteroids, clouds, moonbase (stars and shooting stars underneath).
One neon hue per chapter, so the sky sweeps the spectrum as you fly. Adjacent scenes differ in one or two layers so the cross-fade reads as flight.
**Contrast rule** (`tests/unit/scenes.test.ts`): copy sits straight on the sky, so every dark gradient stop keeps `dust`/`coin`/`starlight` text at >=4.5:1 (light mode checks skyTop, skyBottom and horizon for dust).
Neon lives in `glow` and `horizon`, not in bright backgrounds. If you brighten a palette, run the test.
| Scene (chapter) | Dark top / bottom / horizon / glow | Layers on (dark) |
|---|---|---|
| launchpad (CH0) violet | `#07051a` / `#1d0f4a` / `#3a1478` / `#a467ff` | moonbase 1, planets 1, nebula 0.3, asteroids 0.35, stars 1.6 |
| atmosphere (CH1) blue | `#040824` / `#0a1a66` / `#0a229a` / `#3d8bff` | clouds 1, stars 0.8 |
| planet (CH2) ultraviolet | `#0a0520` / `#220b55` / `#4a0f8f` / `#b44bff` | planet 1 |
| nebula (CH3) pink | `#12041c` / `#3a0a45` / `#640a5a` / `#ff2bd6` | nebula 1, stars 0.9 |
| station (CH4) cyan | `#020c18` / `#052a3d` / `#04394c` / `#19e6ff` | station 1 |
| armory (CH5) amber | `#120805` / `#3a1606` / `#5e2604` / `#ff9a1f` | nebula 0.3 |
| belt (CH6) green | `#03110a` / `#06301a` / `#08401a` / `#39ff6a` | asteroids 1 |
| aurora (CH7) emerald | `#021310` / `#053329` / `#043a2f` / `#2bffc0` | aurora 1 |
Light variants are pale pastels of the same hue (e.g. launchpad `#f6f2ff` / `#f0eaff` / `#d9c8ff`) with a deeper glow and stars at 0 to 0.4. The sky is drawn at low resolution
(3 CSS px per sky pixel, 2 under 768px) and upscaled by CSS with `.pixelated`. To change a scene edit its keyframe; to add a chapter see architecture.md "Adding a chapter".
**`--scene-glow`**: the sky loop writes the blended glow to this CSS var on `<html>`. `globals.css` uses it for chapter `h2 .text-glow` (glow in dark, hard shadow in light) and the HUD's dashed rule;
the FX layer uses it for star pings. Use `var(--scene-glow, var(--plasma))`; it is empty until the sky starts.

## FX kinds (`FxKind` in `types/events.ts`; renderer `scene/fx-renderer.ts`; simulation `game/fx/`)
- `burst`: 16 square particles. `spark`: 7 particles, the default on any button/link pointerdown (an internal preset, not a bus kind).
- `confetti`: 70 particles cycling the four accent colours. `smoke`: 24 rising puffs (`data-fx="smoke"` only; uses `--dust`).
- `ripple`: pixel ring, 0.55s. `xp`: floating label (discoveries use "+25 XP", 1.1s). `shake`: CSS keyframe `fx-shake` on `#main` and `#launchpad` via `html[data-shake]`, 360ms.
- Colour from `data-fx-accent` or the event's `accent` -> CSS vars `--plasma --xp --coin --warp`, re-read when `data-theme` changes. Caps: 600 particles, 24 timed effects.
- Opt-in markup: `<button data-fx="ripple" data-fx-accent="warp">` (valid `data-fx`: burst, confetti, ripple, shake, smoke).
- **Star ping** (background click; `scene/fx-ping.ts`, not a bus kind): a dotted ring plus 4-arm twinkle in `--scene-glow`, ~38px; every 6th click a shooting-star streak (`game/fx/streaks.ts`). Throttled to 80ms (`PingCadence`).
  Skipped on buttons/links/inputs/dialogs, `[data-fx]` and `[data-no-ping]` elements, selections, modified clicks and quick view.
- Reduced motion: no particles, ripples or shake; pings are a still ring; "+XP" labels still show but do not move.

## Layering (z-index)
| Layer | z | File |
|---|---|---|
| Sky canvas | `-z-10` | `scene/space-scene.tsx` |
| Chapter content | auto (`relative`) | `ui/screen.tsx` |
| Player ship | `z-30` | `scene/player-ship.tsx` |
| HUD (sticky header) | `z-40` | `hud/hud.tsx` |
| NOVA dock | `z-[45]` | `nova/nova-dock.tsx` |
| FX canvas | `z-[45]` (same level as NOVA; `FxLayer` comes before `NovaDock` in `page.tsx`, so NOVA paints above it) | `scene/fx-layer.tsx` |
| Boot overlay, countdown | `z-50` | `launchpad/boot-screen.tsx`, `launchpad/countdown.tsx` |
| Scanlines | `z-60` (`body::after`, dark only) | `globals.css` |
| Block cursor | `z-[70]` | `effects/block-cursor.tsx` |
| Skip link (when focused) | `z-[100]` | `app/layout.tsx` |
| Modals (`<dialog>`: star chart, mission briefings) | browser top layer | `ui/modal.tsx` |
Keep new layers inside this ladder. NOVA sits bottom-left. (Toasts and the asteroid game layer were removed in v3.)

## Typography
- `font-pixel` = Press Start 2P (`--font-press-start`): headings, HUD, badges, buttons only.
- `font-body` = Chakra Petch 400/500/600/700 (`--font-chakra`): everything readable. Body base 1.0625rem / 1.6. Cap prose ~62-65ch.
- Pixel scale (`--text-px-*`, Press Start only crisp at multiples of 8px): `xs` 0.5rem (8px), `sm` 0.625rem (10px), `md` 0.75rem (12px),
  `lg` 1rem, `xl` 1.5rem, `2xl` 2rem, `3xl` 3rem. Use `text-px-sm` etc.; never `text-[11px]` on pixel text.

## Shape / shadow / effects
Square corners, 2px borders. `shadow-pixel` = `4px 4px 0 0 var(--grid)`, `shadow-pixel-sm` = 2px. No blur shadows, no rounding,
no decorative gradients. Utilities: `.pixel-rule` (dashed divider), `.text-glow` (glow in dark, hard shadow in light), `.pixelated`,
`.no-scrollbar`, `.xp-notches`, `.story-only` / `.quick-only` (quick view, see architecture.md). Global `:focus-visible` = 2px coin outline, 3px offset.
`html { scroll-padding-top: 6.5rem }` for the sticky HUD.
Boot screen sky: `.boot-space` in `globals.css`, a pure-CSS CH0 violet space (moon, planet, tiled stars, a dark haze behind
the text, edge twinkles, a shooting star). The overlay pins `data-theme="dark"`, so it stays a night sky in day mode, and it
has no masks or filters to keep phones fast. Keyframes in `globals.css`: v1 `boot-line`, `boot-bar`, `boot-twinkle`, `boot-shoot`, `sprite-blink`, `sprite-shadow`, `scroll-hint`, plus `animate-blink` / `animate-float`; Voyage `fx-shake`, `countdown-pop`
(`.countdown-step`), `letter-hop` / `letter-bounce` / `letter-wobble` (`.name-letter`), `sprite-wave`, `mystery-twinkle`, `constellation-draw`, `flame-flicker`,
`rocket-rumble` / `rocket-fly` / `rocket-land`, `signal-beam`, `signal-ring`, `freq-in`, `link-ping` (contact cards), `refinery-belt` (conveyor). A `prefers-reduced-motion: reduce` block at the end of the file disables
them (`.rocket-launch` becomes hidden). Flip cards (pilot ID card, ability cards) use 3D transforms; under reduced motion they swap faces without rotating.

## `cn()` and the tailwind-merge extension (`src/lib/cn.ts`)
`cn = twMerge(clsx(...))` with `extendTailwindMerge` registering `theme.text: ["px-xs".."px-3xl"]` and `theme.shadow: ["pixel","pixel-sm"]`.
WHY: stock tailwind-merge does not know our custom font-size scale, so it treated `text-px-sm` as a text COLOUR and, combined with `text-plasma`, kept only the last one.
Keep the lists in sync with `--text-px-*` / `--shadow-pixel*` (covered by `tests/unit/cn.test.ts`). New custom theme scales need the same treatment.

## Primitives (`src/components/ui/`)
| Component | Props |
|---|---|
| `PixelCard` | `as?` element, `accent?: Accent \| "muted"` (default muted), `rail?` (thick left border), plus element props. `bg-nebula shadow-pixel`. |
| `PixelButton` | `variant?: "primary" \| "ghost" \| "coin"`, button props, default `type="button"`. `buttonClasses(variant, className)` for links styled as buttons. `min-h-11`. |
| `StatBar` | `value`, `max=100`, `accent`, `label`, `segmented?` (10 blocks), `className`. `role="meter"`. |
| `Tag` | `children`, `className`. Chip for tech/traits. |
| `StatusBadge` | `accent`, `children`, `className`. Solid pixel badge. |
| `PixelIcon` | `name: GlyphName`, `size=16`, `className`, `title?` (omit = decorative). 8x8 glyphs: user bolt scroll planet flask chest trophy floppy star sound mute music sun moon rocket lock close. |
| `Modal` | `open`, `onClose`, `title`, `children`, `className`. Native `<dialog>` (focus trap, Esc, backdrop click closes). |
| `Screen` | `id`, `children`, `className`, `bleed?`. Chapter wrapper + visit tracking (client). |
| `ChapterHeading` | `chapter` (ChapterId), `icon`, `align?: "left" \| "center"`, `className`. Renders "CHn", `<h2 id="{chapter}-title">` and the tagline from `story.ts`. |

**Accent maps** (`ui/accent.ts`): `accentText`, `accentBg`, `accentBorder`, each `Record<Accent, string>` with `Accent = "plasma"|"xp"|"coin"|"warp"`.
Static literal classes so Tailwind sees them. Never build class names dynamically (`text-${accent}`).
Pixel art is string grids (`.` empty, other characters = colour keys, e.g. `STATION_ROWS`, `CONTROLLER_ROWS`, `asteroidRows(seed)` in `game/belt/asteroid-art.ts`,
the hero sprite in `effects/pixel-sprite-art.ts`) turned into SVG paths by `lib/pixel-path.ts`. Multi-colour glyphs (the Microsoft and Databricks issuer logos on the trophy cards, `content/issuers.ts` + `chapters/armory/issuer-logo.tsx`) pair a `rows` grid with a `palette` of brand hex values (a documented exception to "tokens only").

## Motion
Calm by default, juicy on click. Orchestrated moments: boot -> countdown -> hero entrance, and the scroll-driven sky. Everything else answers a user action
(particles, shake, flips, typewriter, power-up). Respect `prefers-reduced-motion` via the CSS block and `useReducedMotion()`: no countdown, no typewriter,
no shake or particles, no ship tilt or trail, static sky frames, instant flips. Quick view is the no-motion path. Use `motion` (v14) for interactive effects;
prefer CSS `steps()` timing for the 8-bit feel.

## Do / Don't
Do: tokens only; `font-pixel` sparingly; >=44px targets (`min-h-11`); real `<button>`s with labels for every discovery; canvases `aria-hidden` with text in the DOM;
test 375 / 768 / 1440 in dark, light and quick view; sentence-case body copy; compose primitives; emojis only in NOVA lines.
Don't: raw hex outside `content/scenes.ts`, `content/issuers.ts` and sprite palettes; rounded corners; blur shadows; pixel font for paragraphs; dynamic Tailwind class strings;
`text-[..px]` for pixel text; ad-hoc `twMerge`/`clsx` instead of `cn`; per-frame React state; hard-coded copy in components; z-indexes outside the ladder.
