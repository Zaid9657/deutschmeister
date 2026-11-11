# Monetization decision — 2026-09-03

**Decided by the owner, 2026-09-03:** option A from `docs/HANDOFF-2026-09-03.md` §6 —
**courses are the product.** One-time level courses at **€49 per CEFR band** (A1, A2, B1,
B2 — each band is both sub-levels) and **€129 for all four** (34% under four bands). The
€9.99/€79.99 Pro subscription stays exactly as it is, positioned as the AI add-on; the
four current payers are untouched. The €89 telc B1 Komplettvorbereitung stays listed but
is no longer the headline.

Why A (recorded so the next session does not re-litigate it): five months of usage say
people use and pay for grammar, which is what a level course sells; a €49+ one-time
price is the first point where paid acquisition can break even (~€190 per customer at the
measured CPC); exam packs (B) have two days of data and a 4-vs-42 mock-paper gap, so they
are a later upsell, not the launch product. Positioning must be **"exam-mapped grammar
with AI correction"**, never "a German course" — the commoditised framing is the risk.

## What ships in code (PR of 2026-09-03)

- `src/data/pricing.js` (+ Astro twin): `LEVEL_COURSES` — `course_a1`, `course_a2`,
  `course_b1`, `course_b2` (€49, two sub-levels each) and `course_alle` (€129, all eight);
  `levelsForProduct()` / `bandCourseForLevel()`; `BUNDLE_SAVING_PERCENT` derived.
- Webhook `courseForVariant` routes five new env vars to those product keys; the
  existing `purchases` upsert, included 90-day Pro window, and refund revoke apply
  unchanged (migration `2026-08-31-purchases.sql`, already applied).
- `SubscriptionContext.hasLevelAccess(level)` = free level ∨ live trial/sub ∨ a bought
  course covering it. Every level lock (guard, grammar cards, listening, reading,
  vocabulary, podcasts) reads it — `tests/purchases.test.mjs` pins that.
- `/subscription` (in-app) and `/pricing/` (Astro) render the five cards **only when the
  matching checkout id is configured**, so nothing dead ships before step 2 below.
- `tests/claims.test.mjs` bans the new price literals from page sources and pins that the
  four bands cover the ladder exactly once.

## Lemon Squeezy products to create (owner / Claude in Chrome)

Store 309512. **This is the one step no agent can do**: the Lemon Squeezy API and every
connector (Zapier's Lemon Squeezy app has 14 read actions and 0 write) are read-only for
products — creation is dashboard-only. Everything after it is automated.

**Fastest route (one product, five variants):** create ONE one-time product
"DeutschMeister — German Level Course" and add five variants named exactly `A1`, `A2`,
`B1`, `B2`, `Complete A1–B2` at €49/€49/€49/€49/€129. Each variant gets its own numeric id
and its own share link (`/checkout/buy/<uuid>`) — those are the two ids per row below.
Five separate products (the table) work identically; pick whichever is fewer clicks.

| # | Product name (as shown at checkout) | Price | Env key stem |
|---|---|---|---|
| 1 | DeutschMeister — German A1 Course (A1.1 + A1.2, lifetime) | €49 | `COURSE_A1` |
| 2 | DeutschMeister — German A2 Course (A2.1 + A2.2, lifetime) | €49 | `COURSE_A2` |
| 3 | DeutschMeister — German B1 Course (B1.1 + B1.2, lifetime) | €49 | `COURSE_B1` |
| 4 | DeutschMeister — German B2 Course (B2.1 + B2.2, lifetime) | €49 | `COURSE_B2` |
| 5 | DeutschMeister — Complete Course A1–B2 (all 8 levels, lifetime) | €129 | `COURSE_ALLE` |

Description to paste on each (adjust the level): *Lifetime access to every grammar
topic, exercise, reading text, listening exercise and vocabulary list at this level on
deutsch-meister.de, plus 3 months of Pro (AI speaking coach, writing feedback, Sentence
X-Ray). One payment, no subscription. Log in with the email you use at checkout.*

Tax category: same as product 1329566 (owner's call). Webhook: the existing endpoint
already receives `order_created` and `order_refunded` for every product in the store —
nothing to add.

For each product, two ids are needed (same as the telc course, see `open-actions.md`
O-15): the **numeric variant id** (LS dashboard → product → variant, or the API) and the
**checkout UUID** (the `/checkout/buy/<uuid>` share link). Send both per product.

## Created 2026-09-03 — product 1336941 (one product, five variants)

| Variant | Price | Numeric variant id | Checkout UUID |
|---|---|---|---|
| A1 | €49 | 2088862 | 1f1d7ab4-435d-4c35-a427-94aeec7ea831 |
| A2 | €49 | 2088867 | 90e2000d-5804-4bc3-90c9-e934bd92f0be |
| B1 | €49 | 2088868 | 12793913-0c06-48be-b8fc-248b71a5c684 |
| B2 | €49 | 2088869 | 60446546-e1db-4057-9eca-dd8ec6ee9dc9 |
| Complete A1–B2 | €129 | 2088871 | 79fc6a8b-06a7-4b1f-9e84-1b755238832f |

Tax category "SaaS – personal use". LS auto-created a hidden "Default" variant (2088893,
pending, invisible to customers) — harmless; no env var points at it. All ten env vars
below were set via the Netlify connector on 2026-09-03.

## Env vars to set (agent, via the Netlify connector, once the ids exist)

Functions scope, numeric: `LEMONSQUEEZY_COURSE_A1_VARIANT_ID` … `_B2_` and
`LEMONSQUEEZY_COURSE_ALLE_VARIANT_ID`.
Build scope, UUID: `VITE_LEMONSQUEEZY_COURSE_*_VARIANT_ID` (SPA) and
`PUBLIC_LEMONSQUEEZY_COURSE_*_VARIANT_ID` (Astro) — ten values.
Then trigger a production deploy; the cards appear on the next build.

## Launch gate — the one unverified link

Before any announcement: **one test-mode purchase** of a level course, checking (a) a
`purchases` row with the right `product_key`, (b) the level opens without Pro, (c) a
refund flips the row to `refunded` and re-locks the level. The same E2E has never been
run for the telc course either.

## Not in this PR (agreed follow-ups)

1. First-lesson leak (HANDOFF §5): reorder A1.1 so lesson 1 is a payoff, not the alphabet.
2. Launch email for the level courses (drafts exist for the telc course under `drafts/`).
3. Exam packs as an upsell once 30 days of mock/writing usage exist.
4. Distribution — still the real bottleneck; unchanged by any of the above.


## Addendum 2026-09-08 — per-sub-level pricing, B1/B2 "coming soon", bundle parked

Owner decision (chat, 2026-09-08): stop building the remaining levels for now and sell what is
finished. Catalogue re-cut in `src/data/pricing.js` (`SUBLEVEL_PRICES_EUR`, `COMING_SOON_LEVELS`):

| Sub-level | Price | Status |
|---|---|---|
| A1.1 | free | free tier, no product |
| A1.2 | €40 | on sale |
| A2.1 | €50 | on sale |
| A2.2 | €50 | on sale |
| B1.1 | €60 | listed, **coming soon** (no checkout) |
| B1.2 | €60 | listed, **coming soon** |
| B2.1 | €65 | listed, **coming soon** |
| B2.2 | €65 | listed, **coming soon** |

- The four €49 band products and the €129 A1–B2 bundle are **retired** (`LEGACY_LEVEL_COURSES`):
  not rendered as offers anywhere, still resolved by `levelsForProduct()` so the one existing
  `course_a1` row (the owner's €0 test order) and any cached checkout keep their access. The
  bundle comes back at ~€249 once B1/B2 ship (agent suggestion, not yet decided).
- Product keys are `course_<level with . → _>`: `course_a1_2`, `course_a2_1`, `course_a2_2`,
  `course_b1_1`, `course_b1_2`, `course_b2_1`, `course_b2_2`. Env vars follow the key:
  `LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID` (functions, numeric),
  `VITE_LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID` + `PUBLIC_LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID`
  (builds, checkout UUID) — three products live today, so **nine** values; the B1/B2 vars stay
  unset until those courses exist (a coming-soon card ignores its var anyway).
- Lemon Squeezy variants still to create (dashboard-only, owner): A1.2 €40, A2.1 €50, A2.2 €50 on
  product 1336941. Paste-ready prompt in `docs/owner-prompts.md`. Until their ids are set the
  A1.2/A2 cards render "Coming soon" too, so the site never opens a dead checkout — set the env
  vars BEFORE merging the code PR to avoid a window with nothing buyable.
- Old variants 2088862/2088867/2088868/2088869/2088871 should be archived in the LS dashboard
  after the new ids are live (owner), so an old share link cannot sell a €49 band.


## Addendum 2026-11-11 — the offer ladder is on sale (three one-time products)

Founder decisions 2026-11-09/10 (`docs/strategy/pricing-offer-evaluation-2026-11-09.md`, PR #256).
The founder created the products on 2026-11-11 with Claude in Chrome (prompt in
`docs/owner-prompts.md`); the agent verified each variant against the Lemon Squeezy API
(store 309512, one-time, EUR, published) and set the nine Netlify values the same day.

| Product | Price | Product key | Numeric variant id | Checkout UUID |
|---|---|---|---|---|
| DeutschMeister — A1 Exam Pack | €59 | `a1_exam_pack` | 2363823 | 675b9982-5e0d-4ac0-9e72-0d9409b8551e |
| DeutschMeister — A1 Complete | €89 | `a1_complete` | 2363831 | 2552d543-896a-4f38-b5e1-60df469b0e2b |
| DeutschMeister — All-Access Pass | €199 | `all_access` | 2363838 | 324cd369-01fa-49db-abd6-30c7ec559ed8 |

- Env vars: `LEMONSQUEEZY_<KEY>_VARIANT_ID` (functions scope, numeric) and the
  `PUBLIC_`/`VITE_LEMONSQUEEZY_<KEY>_VARIANT_ID` twins (builds scope, UUID), with `<KEY>` =
  `A1_EXAM_PACK`, `A1_COMPLETE`, `ALL_ACCESS`.
- Each is a single-variant product: the id above is Lemon Squeezy's default variant (API status
  `pending`), the same shape as A1.2's 2088893, which has taken a paid order.
- Post-purchase: the confirmation "Button link" (`redirect_url`) points at
  `https://deutsch-meister.de/subscription/success` on all three.
- The Buy buttons appear only after a production build that follows the env change. A docs-only
  merge does not build (`netlify.toml` `ignore`); use "Clear cache and deploy site"
  (`docs/owner-prompts.md`).
- Test order 2026-11-11 (Lemon Squeezy #30951218, A1 Exam Pack, €0 with a 100 % code, founder's
  admin account): `order_created` was processed without error, variant 2363823 resolved to
  `a1_exam_pack`, the `purchases` row is `active` with a 60-day `access_until`, and the buyer landed
  on `/subscription/success`. Not covered: the unlock on a plain (non-admin, non-subscriber)
  account, and a refund (a €0 order cannot be refunded).
- Still open: the store charges VAT on top (`tax_inclusive=false` on every order so far), so a
  "€59" pack costs an EU buyer more at checkout. The toggle prompt is in `docs/owner-prompts.md`.
