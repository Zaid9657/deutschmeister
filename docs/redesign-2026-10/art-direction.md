# Art direction: three routes, one chosen

> **v4 colours, 2026-10-04: Türkis.** The owner rejected night + signal yellow ("I don't like the choosing of colors") and picked option A of three light palettes rendered on the real homepage (`screenshots/palette-compare.jpg`), the same türkis they chose for the Course v2 player. The structure below (the line, stations, tickets, motion tiers, type) is unchanged; only the values moved. `nacht` is now the light türkis feature ground and `linie` equals `siegel` (`#0A8276`). Where this file says "night" or "yellow", read "türkis tint" and "türkis".


## The three directions

| | A · "Der Satz" | **B · "Die Linie" (chosen)** | C · "Das Studio" |
|---|---|---|---|
| Idea | The German sentence as the hero: huge type, the case colours (kasus) taking a sentence apart live | The CEFR ladder as a transit line: 8 stations, A1.1 the free first stop, paid stations as one-time tickets, B1/B2 "Im Bau" | A warm studio: the tutor, the microphone, the AI conversation front and centre |
| Sells | The method (X-Ray, case colours) | **The offer structure:** where you get on, what one payment buys, where it leads | The AI speaking coach (Pro) |
| Risk | Kasus colours turn decorative, which breaks rule 1. Beautiful, but it does not say what to buy. | Transit metaphors get cute fast. Kept to one system (line, station, ticket, "Im Bau"), and the copy stays plain. | Sells Pro, the secondary product. A mic-forward page tempts autoplay and mic-on-load, both banned. |
| Recognisable without the logo | Medium | **High:** yellow line on night ground, station boards, ticket stub | Low |

**Why B.** The owner's product is a ladder of one-time levels. B makes three things into one picture:
- the offer (tickets);
- the progression (stations);
- the choice ("where do I get on").

It is also the only route where the free first stop reads as the obvious start rather than a lesser tier.

## The signature: "Der erste Halt"

A playable first stop on the homepage (`astro-site/src/components/linie/FirstStop.astro`):

- **Three real items from A1.1 Lektion 1**, out of the built pool `src/data/lessonPools/a11.extra.json`:
  - the formal *Ihnen* (case-sensitive: lowercase is wrong);
  - spelling *HALLO* (separators fold: `H A L L O` = `H-A-L-L-O`);
  - correcting *Gute Tag* to *Guten Tag*.
- **Graded by the course's own checker.** `src/lib/lesson/check.js` is dynamically imported on the first answer (a 4.8 KB lazy chunk) and is never copied. `tests/first-stop.test.mjs` pins every verdict the demo can show.
- **Motion:** each correct answer moves the train one segment (transform, 800 ms signature tier). The arrival CTA opens the free course, `/course/a1.1`.
- **Fallbacks:**
  - Without JS every item keeps its answer in a `<details>`, and the form hides.
  - Under reduced motion the train jumps, with no slide.

## 3D, used where it means something

All of it is CSS 3D and SVG. No WebGL and no three.js.

- **The hero line:** an SVG line on a plane tilted with `perspective` (`rotateX(58deg) rotateZ(-9deg)`), faded with `mask-image`. Station boards stand on it. The path draws once on load and never loops.
- **Station pillars and the ticket stub:** depth comes from the token shadows (`raise-linie`, `ticket`) and the dashed perforation. Rule 3 still holds: depth means pressable, and resting structure is drawn with hairlines.

## Tokens (additive; `src/data/design-tokens.js`, twin-guarded)

**`linie` (signal yellow):**

| Shade | Hex |
|---|---|
| `DEFAULT` | `#FFD23F` |
| `deep` | `#E0AE00` |
| `edge` | `#B98C00` |
| `wash` | `#FFF6D6` |
| `ink` | `#2B2100` |

**`nacht` (night grounds):**

| Shade | Hex |
|---|---|
| `DEFAULT` | `#0E1513` |
| `raised` | `#17211E` |
| `sunk` | `#08100E` |
| `rule` | `#2C3833` |
| `text` | `#F4F2EC` |
| `muted` | `#A9B3AE` |

**Rule 2 is amended:**
- **`siegel` teal stays the action colour on light grounds.**
- **`linie` with ink text is the action colour on `nacht`.**
- Yellow is never text and never a meaningful line on light grounds (1.4:1). `tests/linie-design.test.mjs` allows `text-linie` only in files that also draw `bg-nacht` or `bg-ink`.

**Rule 1 is untouched:** the four kasus colours appear only where a case is named. The pricing page's "Grammar you can see" block is a case demo, so it qualifies.

**Contrast, measured in the test:**

| Pair | Ratio |
|---|---|
| Ink text on yellow | 11.0:1 |
| Yellow on `nacht` | 12.8:1 |
| `nacht.text` on `nacht` | 16.5:1 |
| `nacht.muted` on `nacht` | 8.6:1 (the test requires ≥ 7:1 on `nacht.raised`) |

## Type

| Role | Face | Where |
|---|---|---|
| `sign-display` (stretch 75%, weight 800) | **Archivo** variable | Hero lines, station codes |
| `sign-head` (82%, 780) | Archivo | Section heads on marketing pages |
| `sign-label` (650) | Archivo | Nav, keys, ticket titles |
| `sign-code` (80%, 800, tabular) | Archivo | Prices, station codes |
| body | Nunito Sans | Everything you read |
| display (library) | Fraunces | Grammar, guides, the lesson player (unchanged) |

**Where the sign face is used:**
- **Only on the four pages that preload it:** `/`, `/pricing/`, `/courses/` and `/courses/<level>/`.
- Every other page is marked `data-sign="off"` by `Layout.astro`, and `linie.css` then sets the same roles in the body face.
- On 2026-10-04 this was measured as the difference between 97 and 99 mobile Lighthouse on grammar pages: the nav alone pulled a 55 KB font at top priority.

**CLS control:**
- Hero lines are hard-broken (`block whitespace-nowrap`), so a font swap can never re-wrap them.
- The `Archivo Fallback` faces are tuned so they are never wider than Archivo:

| Fallback weights / widths | Fallback font | `size-adjust` |
|---|---|---|
| 100–500 / 88–100% | Arial | 99% |
| 600–900 / 88–100% | Arial Bold | 99% |
| 62–87% (any weight) | Arial Bold | 80% |

  All three carry measured ascent and descent overrides.
- Measured CLS is 0 on every page at every width.

## Motion system

Adopted from [emilkowalski/skills](https://github.com/emilkowalski/skills) (`emil-design-eng`, `review-animations`, `mobile-native`, `break-ui`).

**Tiers** (`motionLinie` in the tokens):

| Tier | Duration | Used for |
|---|---|---|
| feedback | 140 ms | Presses, verdicts |
| control | 220 ms | Toggles, tabs, sheets |
| section | 420 ms | Reveals |
| signature | 800 ms | The train, the line draw |

**Curves:**

| Name | Cubic-bezier | Used for |
|---|---|---|
| `ease-out-strong` | `(0.23, 1, 0.32, 1)` | Enters and presses |
| `ease-in-out-strong` | `(0.77, 0, 0.175, 1)` | Moves on screen |
| `drawer` | `(0.32, 0.72, 0, 1)` | The mobile timetable sheet |

**Rules:**
- No `ease-in`, and no `transition: all`.
- Only `transform`, `opacity` and `clip-path` animate. Nothing starts from `scale(0)`. Exits are faster than enters. Staggers are 30–80 ms.
- Hover motion lives only inside `@media (hover: hover) and (pointer: fine)`, so touch never gets sticky hovers.
- Reduced motion is gentler, not zero: fades stay and movement goes. The validation run counted 0 running animations under reduced motion.
- Animations pause offscreen via IntersectionObserver and in background tabs via `visibilitychange`.
- **Never:** scroll-jacking, a forced intro, a hidden cursor, hover-only information, autoplay sound, or the microphone on load.

**Mobile baseline:**
- no tap highlight;
- `touch-action: manipulation` on controls;
- inputs at 16 px or larger on coarse pointers;
- `viewport-fit=cover` with safe-area insets;
- `theme-color` follows the page tone.

## Asset register

| Asset | Source | Licence | Size | Loading | Fallback |
|---|---|---|---|---|---|
| `public/fonts/archivo-v25-latin.woff2` | Archivo v2.x by Omnibus-Type (Google Fonts) | SIL OFL 1.1 | 56,316 B | Preloaded only on the 4 sign pages; `font-display: swap` | `Archivo Fallback` (metric-tuned Arial / Arial Bold) |
| `public/fonts/archivo-v25-latin-ext.woff2` | same | SIL OFL 1.1 | 51,432 B | `unicode-range` latin-ext only (not fetched for German or English text) | same |
| Hero line, station boards, ticket | Hand-written SVG and CSS in `components/linie/` | Own | Inline | Server-rendered | Static line under reduced motion or no JS |
| Demo items | `src/data/lessonPools/a11.extra.json`, `a11.explanationsEn.json` | Own content | Inlined at build (3 items) | — | `<details>` answers |

**Archivo build recipe** (reproducible; no npm dependency, which avoids the lockfile trap):
1. Download the variable TTF (`wdth`, `wght` axes) from Google Fonts.
2. Subset first: `pyftsubset Archivo[wdth,wght].ttf --unicodes=<latin or latin-ext range> --layout-features='*' --flavor=woff2`, then re-save.
3. Instance second: `fontTools.varLib.instancer` with `wght=400:900 wdth=62:100`.

   Instancing before subsetting raises `KeyError 'uniFEFF'`.
4. Copy the result into `public/fonts/` with the version in the file name.
