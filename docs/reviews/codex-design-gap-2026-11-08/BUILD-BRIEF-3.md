# Codex build brief, pass 3: a COMPLETE redesign (2026-11-08)

## The founder's words (verbatim, newest last)

- "deutschmeister should reach a much higher level similar to the level of medmeister"
- "have no limits while enhancing the website"
- After seeing passes 1–2: "no stop", "you are polishing"
- "i said a complete redesign and take the design to a much higher level"

## Why passes 1–2 failed

Passes 1–2 kept the old design and tuned it: the same mint wash, the same Archivo headline block, the same cards, the same train-line layout. That is polish. The founder asked for a **complete redesign**.

To see what a visitor sees, compare these three first screens:
- `scratchpad/compare-home.png` (before / after pass 2 / MedMeister);
- `scratchpad/after2/*_fold.png`;
- `scratchpad/shots/mm-steps/*`.

The scratchpad is `/tmp/claude-0/-home-user-deutschmeister/97df4863-0325-56c0-ac9f-9d9347a56d21/scratchpad/`.

## The job: design DeutschMeister from a blank sheet

Start from zero visually. Do not reuse the current look's palette, type pairing, hero layout, card style, pills, mint background or train-line visuals, unless you deliberately choose to keep an element and say why.

The bar is MedMeister's level of craft or higher. Study all its steps in `shots/mm-steps/`:
- editorial confidence and generous space;
- a real product panel beside every promise;
- scene-by-scene storytelling down the page;
- calm, premium colour;
- precise typography;
- designed mobile layouts, not stacked desktop.

Also use `docs/reviews/codex-conversion-2026-11-01/competitor-study.md` (Duolingo, Busuu, Speak, Babbel) for what works in language learning.

**Identity:** DeutschMeister is for **German learners**, not doctors. The founder's tone (verbatim): "state as the best website to learn german and hold this tone, be bold and confident and this is not medmeister, this is not for doctors, so lets make this website more live and more fun while giving trustworthiness". So the design is premium and trustworthy like MedMeister, but alive, warm and fun, and unmistakably DeutschMeister.

## Scope and order

1. **A new design system.**
   - Rewrite `src/data/design-tokens.js` and its Astro twin (identical): new palette, new type pairing (self-hosted fonts, preloaded properly), new spacing, radius, elevation and motion.
   - New shared primitives: buttons, cards, product-window frame, section scaffolds.
   - New chrome: header, footer, mobile nav (`astro-site/src/layouts/Layout.astro`, Astro components, and the SPA chrome so the app matches).
   - Because tokens and chrome are shared, every page changes.
2. **The money pages, rebuilt from scratch:** home, `/pricing/`, `/courses/`, `/courses/<level>/`, `/pruefung/<slug>/`.
   - Each page gets a new composition and a scene-by-scene story.
   - Each promise gets a real product window built from real course content in `src/data`, labelled as an example.
   - Add illustration and imagery where they lift the page. Original SVG and CSS art only; no stock or copied art.
3. **The rest of the public site** in the new system: grammar index and topic, leitfaden, FAQ, About, level test, signup and login visuals.

## Fixed: protects the business, does not limit the design

**Prices, claims and availability:**
- Prices and product keys come only from `src/data/pricing.js`; claims and limits only from `src/data/marketing.js`.
- No invented counts, testimonials or outcomes.
- "Best" only as ambition or a challenge, never as an unprovable fact (UWG §5).
- Off-sale products (the telc package; B1/B2 "Im Bau") stay honestly unavailable.

**Untouched:** checkout and payment logic, auth, redirects, entitlements, Netlify functions, migrations, legal pages, email templates, the lesson player and its exercise logic.

**Language:**
- German copy speaks Sie.
- English pages stay English.

**Technical rules that still hold:**
- Hex values and fonts live only in the token file and its identical twin.
- No hex literals in Astro.
- One `<h1>`.
- The `data-rh` head-tag rule.
- No new routes.
- Content stays readable without JS and with reduced motion.
- Performance stays good (Lighthouse-level budget: fonts preloaded, no layout shift).

**Old design rules you may break.** `CLAUDE.md`'s Design section pins the old look:
- `siegel`/`nacht`, Fraunces/Archivo, case colours as the only accents, the line metaphor, hairlines and no shadows, `rounded-pill` only.

The founder's complete-redesign instruction overrides those **visual** rules. Do not edit `CLAUDE.md` itself (owner file). List the new rules in your report so Claude can update `CLAUDE.md` after the founder approves the look.

**Tests that pin the old look** (brand palette, linie design, retired-palette ratchets, hero wording, font preloads):
- Rewrite them to pin the **new** system instead.
- Never weaken a money, claim, availability, accessibility, head-tag, route or entitlement guard.
- List every test you rewrote, and why.

## Gates (all must pass before you stop)

```bash
npm run lint
node scripts/check-duplicates.mjs
npm test
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only for you; do not commit. Claude re-runs the gates, screenshots the result at 390 and 1440 against MedMeister, and sends you visual defects.

## Report

Append "Pass 3: complete redesign" to `docs/reviews/codex-design-gap-2026-11-08/build-report.md`, covering:
- the new design system: palette, type and principles, with the reasoning;
- per-page changes;
- every headline;
- the rewritten tests;
- the new rules for `CLAUDE.md`;
- the gate results.
