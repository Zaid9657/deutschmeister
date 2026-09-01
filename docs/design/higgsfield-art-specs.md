# Higgsfield art specs — paste-ready prompts for DeutschMeister

The design sweep (docs/design/playbook.md) is code-only: every surface is built
from CSS, so the site is complete and shippable **without a single generated
image**. This document is the optional next layer — where artwork would add
something the CSS cannot, what to generate, and exactly where each file mounts.

Read the two rules below before generating anything. They are what keep
artwork from undoing the system.

---

## The two rules for any generated image

1. **The palette is closed.** Every image uses only the token hexes in the
   table below. No other hue may appear — a stray blue or orange in an
   illustration reintroduces the palette the sweep spent five waves removing.
   Paste the palette line into every prompt verbatim.
2. **Colour still means case.** The four `kasus` hexes may appear ONLY in
   artwork that depicts a German sentence being taken apart, and only on the
   pieces that genuinely carry those cases. Never as decoration, never as a
   gradient, never on a character or a background.

| Token | Hex | Use in artwork |
|---|---|---|
| paper | `#FCFCFA` | the ground; every image sits on this |
| paper-sunk | `#F4F6F5` | recessed shapes, shadow-side of a form |
| ink | `#14201D` | outlines, type, the darkest value |
| graphite | `#5A6360` | secondary strokes |
| rule | `#E2E7E5` | hairlines |
| edge | `#D8DFDB` | the hard bottom edge under a white form |
| siegel | `#0F766E` | primary object colour |
| siegel-lift | `#0D9488` | its lit face |
| siegel-deep | `#0B5A54` | its shadow face / bottom edge |
| siegel-wash | `#E6F2F0` | quiet fills |
| gold | `#FBBF24` | ONE accent dot per image, at most |
| himbeer | `#EC4E88` | celebration energy |
| aprikose | `#FF9E57` | warmth, attention |
| limette | `#7BC943` | success, growth |
| kasus nominativ / akkusativ / dativ / genitiv | `#378ADD` / `#D85A30` / `#1D9E75` / `#7F77DD` | rule 2 only |

**House style, in one line to paste:** *soft 3D clay render, matte vinyl
surfaces, rounded chunky forms with visible thickness and a hard bottom edge,
gentle top-left key light, soft ambient occlusion, no harsh specular
highlights, flat off-white background, centred, generous negative space.*

**Negative prompt, for every generation:** *photorealism, glossy plastic,
metallic, neon, glow, lens flare, gradient mesh backgrounds, drop shadows on
the background, text, letters, words, watermark, logo, UI chrome, browser
window, flags, stock-photo people, clip art, harsh outlines, busy detail,
purple, blue, orange or red unless specified in the palette.*

---

## Slot 1 — Exam-hub headers (4 images) · highest value

**Why:** `/pruefung/telc-b1/`, `/goethe-b1/`, `/dtz/`, `/telc-b2/` are the
commercial landing pages and they open with type alone. One calm object per
exam gives each hub an identity a visitor remembers.

**Prompt (swap the object per exam):**
> Soft 3D clay render of {OBJECT}, matte vinyl surfaces, rounded chunky forms
> with visible thickness and a hard bottom edge, gentle top-left key light,
> soft ambient occlusion, flat off-white `#FCFCFA` background, centred with
> generous negative space, palette strictly limited to `#0F766E` `#0D9488`
> `#0B5A54` `#E6F2F0` `#FCFCFA` `#F4F6F5` `#14201D` `#E2E7E5` plus one small
> `#FBBF24` accent, square composition, no text.

| Exam | {OBJECT} |
|---|---|
| telc B1 | a stack of three rounded exam booklets with a small gold bookmark |
| Goethe B1 | four separate rounded tiles arranged in a 2×2 grid, one slightly lifted (the modules) |
| DTZ | a rounded clay envelope and a house key resting beside it |
| telc B2 | two rounded speech bubbles overlapping, the upper one slightly larger |

**Mount:** `astro-site/src/pages/pruefung/[slug].astro`, inside the `<header>`
next to the `<h1>` (the aurora block is already there — place the image on the
right at `lg:` and above the intro paragraph on mobile). Add `slug`-keyed
filenames so the renderer can derive the path: `/art/pruefung-{slug}.webp`.
Target 800×800, WebP, ≤ 60 KB each, `loading="eager"` (above the fold),
`alt=""` (decorative — the h1 already names the exam).

## Slot 2 — Sales-page hero · direct revenue

**Why:** `/telc-b1-komplettvorbereitung/` is the €89 page. Its hero is strong
copy on an aurora ground; one object anchors it.

**Prompt:**
> Soft 3D clay render of a rounded wall calendar with one date marked by a
> small gold dot, a stack of four rounded study cards fanned beside it, matte
> vinyl surfaces, visible thickness with a hard bottom edge, gentle top-left
> key light, soft ambient occlusion, flat `#FCFCFA` background, palette
> strictly `#0F766E` `#0D9488` `#0B5A54` `#E6F2F0` `#FCFCFA` `#F4F6F5`
> `#14201D` plus one `#FBBF24` dot, 4:3 composition, no text, no numbers.

**Mount:** `astro-site/src/pages/telc-b1-komplettvorbereitung.astro`, in the
hero `<section>` beside the CTA pair. `/art/sales-telc-b1.webp`, 1200×900,
WebP, ≤ 90 KB, `loading="eager"`, `alt=""`.

## Slot 3 — Dashboard empty state · retention

**Why:** a new learner's first dashboard has zeros everywhere. An image makes
the emptiness feel like a beginning instead of a fault.

**Prompt:**
> Soft 3D clay render of a small rounded seedling in a chunky pot, two leaves,
> matte vinyl surfaces, visible thickness, gentle top-left key light, soft
> ambient occlusion, flat `#FCFCFA` background, palette strictly `#7BC943`
> `#5DA52A` `#F1FAE6` `#0F766E` `#E6F2F0` `#FCFCFA` `#14201D`, square, no text.

**Mount:** `src/pages/DashboardPage.jsx`, in the empty branch of the path
card. `/art/empty-dashboard.webp`, 600×600, WebP, ≤ 40 KB, `loading="lazy"`,
`alt=""`.

## Slot 4 — Celebration · the earned moment

**Why:** `CompletionMoment` and the level-test results fire confetti; a single
illustration behind the headline makes the moment feel authored.

**Prompt:**
> Soft 3D clay render of a rounded trophy-like form, chunky and friendly, with
> three small floating rounded confetti shapes above it, matte vinyl surfaces,
> visible thickness with a hard bottom edge, gentle top-left key light, flat
> `#FCFCFA` background, palette strictly `#EC4E88` `#C22B63` `#FDECF3`
> `#FF9E57` `#7BC943` `#0F766E` `#FCFCFA` `#14201D`, square, no text.

**Mount:** `src/components/CompletionMoment.jsx`, behind the headline when
`celebrate` is true (keep it under 20% opacity or it fights the copy), and
`src/components/LevelTest/LevelTestResults.jsx`. `/art/celebrate.webp`,
600×600, WebP, ≤ 40 KB, `loading="lazy"`, `alt=""`.

## Slot 5 — The X-Ray scene (the one image allowed case colour)

**Why:** the only artwork that can carry the four case hues legitimately, and
the clearest picture of what the product actually does.

**Prompt:**
> Soft 3D clay render of four rounded rectangular tiles floating in a row at
> slightly different depths, as if a sentence has been pulled apart, each tile
> a different colour, matte vinyl surfaces, visible thickness with hard bottom
> edges, gentle top-left key light, soft ambient occlusion, flat `#FCFCFA`
> background, tile colours exactly `#378ADD` `#D85A30` `#1D9E75` `#7F77DD`
> with `#14201D` details, wide 16:9 composition, no text, no letters.

**Mount:** optional, `astro-site/src/pages/index.astro` — only as a quiet
band ABOVE the fold's living X-Ray demo, never replacing it: the animated demo
outperforms any still. Also usable as the `/analyze/` prerendered header.
`/art/xray-scene.webp`, 1600×900, WebP, ≤ 110 KB, `loading="lazy"`, `alt=""`.

## Slot 6 — Social share image (`og-image.png`)

**Why:** `public/og-image.png` predates the whole design system and is what
every shared link looks like.

**Prompt:** use the Slot 1 telc B1 object on a `#FCFCFA` ground, composed at
1200×630 with the left 55% empty — the wordmark and headline are added
afterwards in code/Figma, NOT generated (the negative prompt bans text for a
reason: generated lettering is always subtly wrong).

**Mount:** replace `public/og-image.png` (1200×630 PNG, ≤ 200 KB). The
dimensions are already declared in `astro-site/src/layouts/Layout.astro` and
`index.html`; keep them or the meta tags lie.

---

## Delivery checklist

1. Generate at 2× the target, downscale, convert to WebP (`sharp` is already a
   dependency: `npx sharp -i in.png -o out.webp --quality 82`).
2. Drop files in `public/art/` — Netlify serves `public/` verbatim, and no
   `netlify.toml` change is needed for files (only new top-level *routes*
   need a copy step).
3. Every decorative image gets `alt=""`; an image that carries meaning gets a
   real alt and then it is content, not decoration — check the claims rules
   before it says anything factual.
4. Above-the-fold art is `loading="eager"`, everything else `loading="lazy"`;
   always set explicit `width`/`height` so nothing shifts on load.
5. After adding art, re-run `npm run build:verify` — the built-HTML check runs
   over all 101 pages and will catch a broken path or a lost head tag.
6. Sanity-check the palette rule by eye: open the image beside
   `docs/design/playbook.md`'s token table. A colour that is not in the table
   is a bug, however pretty.
