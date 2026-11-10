# Codex build brief 5: the offer ladder — A1 Exam Pack, A1 Complete, All-Access Pass (2026-11-09)

## What the founder decided, verbatim

- "yes build the exam pack and the bundle"
- On the prices €59 / €89 / €199 and the three page pictures: "go with it"
- Standing: "please have respect for the website and the pricing , dont put non sense , our goal is always to sell and make money"

Background: `docs/strategy/pricing-offer-evaluation-2026-11-09.md`. The site today sells one course (A1.2, €40)
plus the AI Practice add-on. This build adds the ladder above it.

## The three products (owner-set prices; put them in `src/data/pricing.js` + its twin, derive everywhere)

| Product | Price | What the buyer gets |
|---|---|---|
| **A1 Exam Pack** | €59 once | The 30-day "Start Deutsch 1" exam plan (`src/data/programs/startDeutsch1.js`, page `/start-deutsch-1-kurs`), the Goethe A1 practice test (`src/data/mockExams/goetheA1.js`, a **short version**), its writing and speaking tasks, and 2 months of AI Practice |
| **A1 Complete** | €89 once | The A1.2 course (kept for good) + the A1 Exam Pack + 6 months of AI Practice |
| **All-Access Pass** | €199 once | Every level course as it is released (`ALL_LEVELS`), every exam pack as it is released, 12 months of AI Practice |

Unchanged: A1.1 free; A1.2 €40; AI Practice €9.99/month or €79.99/year. **Show the yearly AI Practice plan
first** wherever both are shown.

Use new product keys (suggested `a1_exam_pack`, `a1_complete`, `all_access`); keep the legacy keys
(`course_a1`, `course_alle`, …) resolvable for existing buyers, unchanged.

## Access (implement end to end, with tests)

- A purchase of the exam pack opens the Start Deutsch 1 plan and the A1 practice test; A1 Complete opens that
  plus level `a1.2`; the Pass opens every level in `ALL_LEVELS` (future levels open automatically when they
  ship) and every exam programme that is on sale.
- The included AI Practice window works exactly like today's course window (`proDays`, the webhook's
  `courseForVariant`), with 60 / 180 / 365 days. Copy and server must grant the same window.
- Webhook: add the three `LEMONSQUEEZY_<KEY>_VARIANT_ID` mappings in
  `netlify/functions/lemonsqueezy-webhook.mjs` the same way the existing course keys are mapped; purchases
  upsert by Lemon Squeezy order id as today. This function edit is authorised by the founder's go; change
  nothing else in the money path, no migrations, no Lemon Squeezy calls.
- Checkout: each Buy button appears only when its client checkout id env var is set
  (`PUBLIC_`/`VITE_` pattern used by the level courses); otherwise the page shows an honest
  "not on sale yet" state, never a dead button. Signed-out Buy keeps the `dm_buy_intent` → `/subscription?buy=<key>` flow.
- The telc B1 package stays off sale. Existing buyers and subscribers keep what they have.

## Pages (concept-4 design, already live: reuse its tokens, components and CSS)

Pictures to match: `docs/reviews/codex-design-gap-2026-11-08/concept-4/offer-exam-pack.png`,
`offer-a1-complete.png`, `offer-all-access.png`. New hero illustrations: `public/art/scenes/offer-exam-*.webp`,
`offer-complete-*.webp`, `offer-pass-*.webp` (800px + full size, use `srcset`).

1. `/courses/a1-exam-pack/`, `/courses/a1-complete/`, `/courses/all-access/` as Astro pages (follow the
   three-place route rule only if an SPA route is needed; Astro pages need the `check-built-html` MANIFEST
   and sitemap handling the repo already uses for `/courses/*`).
2. Update `/pricing/` and the home pricing section to show the ladder: one level €40 · A1 Complete €89
   (the highlighted choice) · All-Access Pass €199, with AI Practice (yearly first) below as the add-on.
3. Add the bundle as the "better together" block on the A1.2 page and the exam pack page.
4. Fix `/signup` copy: it still sells "7-day AI Practice trial … All 8 levels"; make it match the new offer
   honestly (what the trial really includes per `marketing.js`).

Copy rules: English pages; problem-first headlines as in the pictures ("Your A1 exam has a date. Do you have
a plan?", "Finish A1 properly: the course, the exam plan and the practice.", "One payment. Every level, from
your first word to B2."). German course tasks speak **Sie**: the A1 mock's writing prompts currently speak
du ("trag … ein", "Schreib …") — fix them. Honesty: the practice test is a "short version", never "the full
exam"; the Pass says "as released" for levels and exam packs that are not built (today: A1.1 and A1.2 are
ready, the A1 exam pack is ready, everything else is "coming next, included when released"); no pass
guarantee, no customer counts, ratings, awards, certificates or "most popular". Counts (16 grammar topics,
12 listening exercises, 16 reading lessons, 16 speaking missions) must be derived from the programme data,
not typed.

## Fixed

`CLAUDE.md` binds (token twins, no hex in Astro, one `<h1>`, `data-rh`, derived prices and claims). Keep every
existing test green; add tests for the three products, their access, the webhook mapping, the "as released"
honesty and the Sie fix. Never weaken a money, claim, availability or entitlement guard.

## Gates

```bash
npm run lint && node scripts/check-duplicates.mjs && npm test
for f in netlify/functions/*.mjs netlify/functions/*.js netlify/functions/_shared/*.mjs; do node --check "$f"; done
rm -rf dist && npm run build && mv dist/index.html dist/app.html
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/merge-site-builds.mjs && node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs dist
```

`.git` is read-only for you: do not commit. Write `docs/reviews/codex-design-gap-2026-11-08/build-report-5.md`:
files changed, product keys, the exact env var names the founder must set (client checkout ids and
`LEMONSQUEEZY_<KEY>_VARIANT_ID`), tests added, gate results, anything left open.
