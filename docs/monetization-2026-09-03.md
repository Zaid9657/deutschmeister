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
