# Codex build brief 4: build CONCEPT 4 into the real site (2026-11-09)

## What the founder said, verbatim

- He picked the visual concept: "4".
- He authorised the change: "to be honest , i want to change everything and anything if it will make the website better".
- He approved the build: "yes build it".
- On pricing: "please have respect for the website and the pricing , dont put non sense , our goal is always to sell and make money".

Earlier rounds (passes 1–3, mocks 4–6) taught us what works. Passes 2 and 3 were reverted on this branch; pass 1's fixes stay.

## The target: build these pictures, faithfully

The approved pictures are in `/tmp/claude-0/-home-user-deutschmeister/97df4863-0325-56c0-ac9f-9d9347a56d21/scratchpad/concepts/`. Open and study each one.

| Page | Picture |
|---|---|
| Home (desktop) | `concept-4.png` |
| Home (mobile) | `c4-mobile-home.png` |
| `/pricing/` | `c4-pricing.png` |
| `/courses/` | `c4-courses.png` |
| `/courses/a1-2/` (the level sales template) | `c4-a12.png` |

Match these pictures:
- layout, composition and spacing;
- the warm painterly illustrations in rounded frames;
- the deep teal brand colour, with the coral primary CTA as in the picture;
- white and soft mint grounds;
- serif headlines (Fraunces is already self-hosted) with a clean sans body;
- the header and the dark-teal footer.

Sample the exact colours from the pictures and put them in `src/data/design-tokens.js` and its Astro twin, which must stay identical.

### Illustrations: real files, already made in this style

They are in `public/art/scenes/`. Each comes at an 800px width plus its full size; use `srcset`, explicit `width`/`height`, and lazy loading except for the hero.

| File | Use |
|---|---|
| `hero-*.webp` | Home hero: the woman at the laptop, Berlin view |
| `scene-cafe-*.webp`, `scene-work-*.webp`, `scene-doctor-*.webp` | The three home scenes |
| `tram-route-*.webp` | The A1.1 → B2.2 route band (overlay the level dots as HTML) |
| `pricing-hero-*.webp` | Pricing hero |
| `a12-reception-*.webp` | A1.2 hero |
| `cando-appointment`, `cando-flat`, `cando-chat`, `cando-market` | The A1.2 "what you will be able to do" cards |

### Motion: elegant and calm, as in mock 5

The reference is `scratchpad/mock5/`. Use:
- staggered fade and rise on scroll;
- a soft parallax on the hero illustration;
- the route line drawing itself;
- the checker's success animation.

Animate only transform and opacity. Use the motion tiers in the tokens. Respect `prefers-reduced-motion`. Content must stay readable without JS.

## Copy: problem-first, for adult beginners, in English

Take the copy from the pictures and from mock 6 (`scratchpad/mock6/index.html`):
- Home hero: "You want to learn German. Where do you start?"
- Pricing: "Pay once for your course. Practise more if you want."
- A1.2: "You can introduce yourself. Now handle real everyday situations."

Rules:
- German example sentences are real course sentences from `src/data`.
- German instructions speak Sie.
- The A1.2 can-dos and lesson and unit lists come from the **real A1.2 curriculum** (`src/data/curricula`), not from the picture's invented list.
- The home hero's "Quick exercise" is the REAL try-it checker (the existing FirstStop/first-stop logic and `src/lib/lesson/check.js`), restyled.

## Honest pricing (founder-authorised): implement fully

1. **The level course is the product.**
   - A1.2 costs €40 once (`SUBLEVEL_PRICES_EUR`), yours to keep, with `COURSE_PRO_MONTHS` months of AI practice included.
   - A1.1 is free and is shown as the entry, never as a "€0" card.
2. **Only built levels are sold.** Add `a2.1` and `a2.2` to `COMING_SOON_LEVELS` in `src/data/pricing.js` and its twin. A2–B2 then show "Coming next" with no price button. Update the tests that expected A2 to be buyable.
3. **Pro becomes "AI Practice", an optional add-on without course access, for new subscribers.**
   - Price: €9.99/month or €79.99/year.
   - It includes: AI writing feedback (`PRO_WRITING_EVALUATIONS_PER_MONTH`), AI speaking practice (show no count), and Sentence X-Ray (`PRO_DAILY_LIMIT`/day).
   - Rename it in all public copy and in the SPA subscription page.
   - In `hasLevelAccess` (and wherever a subscription unlocks guided courses), a subscription unlocks courses **only for subscriptions that started before 2026-11-10**. This grandfathers the existing subscribers; use the subscription's start/created timestamp already on the client.
   - Course purchases, the course's included AI-practice window and the trial keep working exactly as today.
   - Add regression tests for grandfathered and new subscribers.
   - Do NOT touch Netlify functions, webhooks, Lemon Squeezy IDs or migrations. The founder renames the product in Lemon Squeezy himself.
4. **Never show** "Most popular", ratings, customer counts, awards, certificates, or downloadable materials. Proof numbers come only from `src/data/marketing.js` (listening dialogues, grammar topics, vocabulary words, reading lessons).

## Scope

1. The new tokens and chrome: header, footer and mobile menu, in Astro `Layout.astro` and the SPA chrome (Navbar, Footer, BottomNav), so every page takes the new look.
2. Rebuild the money pages to the pictures: home, `/pricing/`, `/courses/`, `/courses/[level]/` (A1.2 sells; the other levels show their "coming next" state honestly).
3. Remove the old train-line and Linie visuals that the pictures replace (LineBoard video, station art), along with their tests, and pin the new design with tests instead.

## Fixed: these protect the business, they do not limit the design

**Business:**
- Prices and keys come only from `pricing.js`; claims only from `marketing.js`.
- The telc package stays honestly off sale.

**Technical** (`CLAUDE.md` still binds):
- token twins stay identical;
- no hex in Astro;
- one `<h1>`;
- the `data-rh` head-tag rule;
- no new routes;
- `dm_buy_intent` and checkout flows stay unchanged.

**Overrides and tests:**
- The founder's redesign overrides `CLAUDE.md`'s old **visual** rules (line metaphor, `siegel`/`nacht`, Archivo, no shadows). Do not edit `CLAUDE.md`; list the new visual rules in your report.
- Rewrite the tests that pin the old look. Never weaken a money, claim, availability, accessibility, head-tag, route or entitlement guard; only add to them.

## Gates (all must pass; start from a clean `dist/`)

```bash
npm run lint
node scripts/check-duplicates.mjs
npm test
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

- `.git` is read-only for you, so do not commit.
- Claude screenshots every page at 390 and 1440, compares each with its picture, and sends you the differences.

## Report

Write `docs/reviews/codex-design-gap-2026-11-08/build-report-4.md` with:
- the files changed per page;
- the new tokens;
- the pricing and entitlement change, with its tests;
- the rewritten tests;
- the new visual rules for `CLAUDE.md`;
- the gate results.
