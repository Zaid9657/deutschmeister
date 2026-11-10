# Build report 5: the offer ladder (2026-11-09)

Built by Codex (official plugin, effort high) from `BUILD-BRIEF-5.md`. Codex hit its usage limit just before
writing this report (limit resets 2026-11-12 17:28), so Claude ran the gates, reviewed the diff and wrote it.

## What was built

| Area | Change |
|---|---|
| Products (`src/data/pricing.js` + twin, `netlify/functions/_shared/pricing.mjs`) | `OFFER_PRODUCTS`: `a1_exam_pack` €59 (60 days AI Practice), `a1_complete` €89 (level a1.2 + exam pack, 180 days), `all_access` €199 (all levels, every exam programme on sale, 365 days). Legacy keys unchanged |
| Access | `ownsExamProgramme`, `ownsProduct`, exam and level guards admit the new products; the Pass opens future levels automatically through `ALL_LEVELS` and exam packs through `SELLABLE_EXAM_PROGRAMMES` |
| Webhook (`lemonsqueezy-webhook.mjs`) | Three new `LEMONSQUEEZY_<KEY>_VARIANT_ID` mappings; AI Practice window 60 / 180 / 365 days per product |
| Pages | `/courses/a1-exam-pack/`, `/courses/a1-complete/`, `/courses/all-access/` (Astro, concept-4 components `OfferPage`, `Ladder`, `BetterTogether`, `ProductDoor`); the ladder on `/pricing/` and the home page; the bundle block on the A1.2 page |
| Copy fixes | `/signup` no longer promises "all 8 levels"; the Goethe A1 practice test speaks Sie |
| Honesty | Buy buttons appear only when the checkout id is set, otherwise "Not on sale yet"; the Pass lists each level as ready or "coming next, included when released"; the practice test is called a short version |

## Owner steps before the offers can sell

Create three one-time products in Lemon Squeezy (store 309512), then set in Netlify:

| Product | Price | Client checkout id (build scope, both) | Numeric variant id (functions scope) |
|---|---|---|---|
| A1 Exam Pack | €59 | `PUBLIC_LEMONSQUEEZY_A1_EXAM_PACK_VARIANT_ID`, `VITE_LEMONSQUEEZY_A1_EXAM_PACK_VARIANT_ID` | `LEMONSQUEEZY_A1_EXAM_PACK_VARIANT_ID` |
| A1 Complete | €89 | `PUBLIC_LEMONSQUEEZY_A1_COMPLETE_VARIANT_ID`, `VITE_LEMONSQUEEZY_A1_COMPLETE_VARIANT_ID` | `LEMONSQUEEZY_A1_COMPLETE_VARIANT_ID` |
| All-Access Pass | €199 | `PUBLIC_LEMONSQUEEZY_ALL_ACCESS_VARIANT_ID`, `VITE_LEMONSQUEEZY_ALL_ACCESS_VARIANT_ID` | `LEMONSQUEEZY_ALL_ACCESS_VARIANT_ID` |

## Gates (Claude, clean dist)

| Check | Result |
|---|---|
| lint | clean |
| duplicate check | OK |
| `npm test` | 2949 pass, 0 fail (new: `tests/offer-ladder.test.mjs`, extended webhook, purchase and checkout tests) |
| function syntax | OK |
| SPA build, offline Astro build, merge, prerender | OK |
| `check-built-html` | 151 pages, 0 failures |
| Playwright, offer pages + pricing + home + A1.2 at 390 and 1440 | 0 overflow, one h1 each, 0 page errors |

## Open

- No real purchase has been tested: that needs the Lemon Squeezy products and a test-mode order.
- The Pass hero illustration does not span the full width on desktop (cosmetic).
