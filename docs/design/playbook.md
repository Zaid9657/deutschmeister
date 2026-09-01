# Playful Depth — the playbook

The binding brief for every screen rewrite in the design sweep
(docs/design-renovation-2026-09-01.md holds the *why*; this holds the *how*).
If a screen needs something this page does not name, add it HERE first, then
use it — the kit grows, screens never improvise.

## 0. Non-negotiables (the truth rules survive any redesign)

- **Colour means case.** The four `kasus` colours appear only on a chip that
  names its case (`<Chip tone="dativ">` renders the DAT label for you). Never
  as decoration, never on a CTA, never as a level colour.
- **One interactive colour.** `siegel` for buttons, links, focus, selected.
  Accents (`himbeer`/`aprikose`/`limette`) are energy: chips, badges, streak,
  progress, confetti, the edge of a featured card. The single exception:
  `<Button variant="celebrate">` on an earned moment.
- **Depth means "you can press this".** Interactive → raised
  (`shadow-raise*`) and it depresses on `:active`. Reference material —
  tables, grammar rules, prose, disclaimers — stays FLAT: `border border-rule`
  hairlines, no shadow.
- **Claims, counts, prices, disclaimers, fact provenance: untouched.** Every
  figure still derives from `marketing.js`/`pricing.js`; `MOCK_DISCLAIMER_DE`,
  `Richtwert`, `Kurzversion`, `factsCheckedOn`/`sources` keep rendering.
- **Motion is opt-out for the visitor.** Everything rides the global
  `prefers-reduced-motion` gate; scripts/hooks additionally no-op. No-JS must
  never hide content (Astro: `.reveal` is gated behind `html.js`).
- **Pass = celebrate, fail = calm.** Confetti and `celebrate` only on a real
  win (goal met, mock passed, lesson complete). A failed mock gets a calm,
  encouraging screen — never confetti, never a candy button.

## 1. Vocabulary — the classes (Tailwind, tokens only)

| Role | SPA | Astro (class strings) |
|---|---|---|
| Page/section ground | `bg-paper text-ink`; recessed band `bg-paper-sunk` | same |
| Eyebrow label | `<Chip tone="label">` or `font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel` | same string |
| Section heading | `<SectionHeading eyebrow title lead />` | `font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]` |
| Page H1 | `<SectionHeading size="page" level={1} />` | `font-display text-[2.125rem] … sm:text-[3rem]` (hero: `sm:text-[3.5rem]`) |
| Body / lead | `text-[0.9375rem] leading-relaxed text-graphite sm:text-base` | same |
| Data figures | `font-data text-[0.8125rem]` | same |
| Clay card (static, featured) | `<Card raised>` | `rounded-clay border border-rule bg-white p-6 shadow-raise` |
| Clay card (clickable) | `<Card interactive as={Link}>` | `… shadow-raise transition-all duration-150 ease-snap hover:-translate-y-0.5 hover:shadow-raise-lg active:translate-y-1 active:shadow-none` |
| Reference card (flat) | `<Card>` | `rounded-clay border border-rule bg-white p-6` |
| Primary CTA | `<Button>` (+ `shimmer` on the ONE main action) | `rounded-clay bg-siegel px-7 py-3.5 text-base font-bold text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none transition-all duration-100 ease-snap` |
| Secondary CTA | `<Button variant="secondary">` | `… border border-rule bg-white text-ink shadow-raise hover:border-siegel hover:text-siegel-deep …` |
| Text link | `font-bold text-siegel transition-colors hover:text-siegel-deep` | same |
| Chip / badge | `<Chip tone=…>` (label · quiet · ink · himbeer/aprikose/limette · kasus) | `rounded-pill px-2.5 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em]` + tone classes |
| Pressable chip (answers, grades) | `<Chip raised onClick>` | add `shadow-raise … active:translate-y-1 active:shadow-none` |
| Numbered step badge | `absolute -top-4 left-6 h-9 w-9 rounded-pill bg-accent-* text-white shadow-raise` | same |
| Form field | `rounded-clay border border-rule bg-white px-4 py-3 text-ink placeholder:text-graphite focus:border-siegel` | same |
| Table | flat: `border-b border-ink` head, `border-b border-rule` rows, `bg-siegel-wash` on the "us" column | same |
| Radius | `rounded-clay` (cards, buttons, fields), `rounded-pill` (chips), `rounded-md` (small chips/inline) | same |

**Banned in any rewritten file** (lint by grep): `slate-`, `gray-`, `zinc-`,
`neutral-`, `stone-`, `teal-\d`, `emerald-`, `amber-`, `rose-`, `indigo-`,
`violet-`, `purple-`, `blue-`, `red-`, `green-`, `yellow-`, `orange-`,
`bg-gradient-to`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `shadow-lg`,
`shadow-xl`, `shadow-2xl`, `shadow-md`, `shadow-sm`, inline hex colours.
Semantic states use tokens: success = `limette`, warning/attention =
`aprikose`, error/destructive = `accent-himbeer-ink` on `himbeer-wash`
(with an icon or word — never colour alone).

## 2. Vocabulary — motion

| Effect | SPA | Astro |
|---|---|---|
| Entrance on scroll | `<Reveal delay={90*i}>` | class `reveal` + `style="--rd:90ms"` |
| Hero entrance on load | `hero-line` + `style={{'--d':'120ms'}}` | `hero-line` + `style="--d:120ms"` |
| 3D tilt | `<Tilt>` + `data-atropos-offset="6"` on floating children | `.atropos > .atropos-scale > .atropos-rotate > .atropos-inner` with `data-atropos-card` |
| Count-up figure | `<Stat value label />` / `useCountUp` | `<span class="countup" data-count={n}>{n}</span>` |
| Aurora ground | `<Aurora />` / `<Aurora variant="close" />` in a `relative overflow-hidden` parent | `<Aurora />` component |
| Shimmer CTA | `<Button shimmer>` | `btn-shimmer relative overflow-hidden` |
| Pop-in (new item) | `animate-pop-in` | same |
| Attention wiggle (once) | `animate-wiggle` | same |
| Equalizer (audio) | `.equalizer > span×7` | same |
| Confetti | `confettiBurst()` from `src/lib/confetti.js` | (no static-page use) |
| Connector path | — | `.path-connector` SVG, `pathLength="100"` |

Use tilt on: hero cards, the card grid a visitor CHOOSES from (exams, levels,
plans), a featured/recommended card. Not on lists, not on every card.
Use aurora on: one hero per page, optionally the close. Never mid-page.
Reveal cadence: heading → lead → items staggered 80–110ms. Tables reveal as
one block.

## 3. Voice (copy touched during a rewrite)

Person → pain → promise, for the exam-deadline learner. English on the app
and homepage; German on `/pruefung`, `/leitfaden`, `/pricing`, the sales
page and `/vergleich` (run `german-copy-unchained` + its validator). No
outcome promises (the OUTCOME/OFFICIAL regexes in `tests/exams.test.mjs` are
the line), no invented numbers. If a rewrite fights a ban, the copy is wrong.

## 4. Per-screen checklist

1. Old palette gone (grep the bans above in the file).
2. One primary action per screen; it is the only `shimmer`.
3. Cards: pressable things raised, reference flat.
4. Reveals on the section rhythm; nothing hidden without JS.
5. Empty/loading/error states styled too (`DataState`, `EmptyState`).
6. Phone width checked (390px): CTAs stack, tables scroll in their own box.
7. Tests: `npm test` (brand chrome list grows with new shared components,
   ratchets only fall), `npm run lint`, `npm run check:duplicates`.

## 5. Sweep tracker (built-CSS success metric)

Goal by end of Wave 4: **zero** `slate-|gray-|teal-\d|bg-gradient-to`
selectors in the built SPA + Astro CSS under `dist/`. Record the count here
after each wave:

| Wave | Date | SPA css legacy selectors | Astro css legacy selectors |
|---|---|---|---|
| baseline (post #33, Wave 0 kit) | 2026-09-01 | **175** | **115** |
| Wave 1 (public Astro pages) | 2026-09-01 | 175 | **0** |

Measure with (from the repo root, after a full CI-mirror build):

```
cnt() { grep -ohE '\.[a-z:-]*(slate|gray|zinc|teal|emerald|amber|rose|indigo|violet|purple|blue|red|green|yellow|orange)-[0-9]{2,3}\b|\.bg-gradient-to-[a-z]+' "$@" | sort -u | wc -l; }
cnt dist/assets/*.css; cnt astro-site/dist/_astro/*.css
```
