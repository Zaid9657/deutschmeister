# DeutschStart A1.1 funnel — what we measure and how we read it

Plan: `docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md` Task 3.
Event allowlist: `src/lib/a11Funnel.js`. Helpers: `src/lib/funnelTracking.js`.
Guard suite: `tests/a11-funnel.test.mjs`.

Every event is consent-aware (`public/consent.js` gates GA4 and PostHog; no
consent, no event) and carries only allowlisted properties. An email address,
a transcript, an utterance or a free-form note cannot be attached — the
allowlist drops everything it does not name.

## Events

| Event | Fires when | Properties |
|---|---|---|
| `a11_sales_viewed` | the `/courses/a1.1/` sales page renders | source |
| `a11_preview_started` | preview lesson 1 opens | source, lesson |
| `a11_preview_lesson_completed` | a preview lesson (1–3) is finished | source, lesson |
| `a11_preview_completed` | lesson 3 is finished (the bridge appears) | source |
| `a11_offer_viewed` | the €39 offer card enters view | source |
| `a11_checkout_started` | a checkout is opened | source, productKey, amount, currency |
| `a11_purchase_confirmed` | the **entitlement observer** sees access appear | source, productKey, amount, currency |
| `a11_refund_recorded` | the entitlement disappears after a refund | source, productKey, amount, currency |

`amount` is never taken from the client: it is read from `LEVEL_COURSES.course_a1_1.price`,
so a reported amount can never disagree with what the checkout charges.
`source` is normalized to `a11-sales`, `preview-complete`, `locked-lesson`,
`email`, `organic-social`, `organic-search` or `direct` — anything else
becomes `direct` rather than creating a new segment.

A checkout **click is not a purchase**: `a11_purchase_confirmed` fires from the
entitlement observer only, which is also why a cancelled checkout leaves no
phantom conversion.

## Dashboard calculations — the exact denominators

Each rate is `numerator / denominator`, both raw counts, in the same window:

1. **sales → preview start** = `a11_preview_started` / `a11_sales_viewed`
2. **lesson 1 → lesson 3 completion** = `a11_preview_lesson_completed (lesson=3)` / `a11_preview_lesson_completed (lesson=1)`
3. **preview completion → checkout start** = `a11_checkout_started` / `a11_preview_completed`
4. **checkout start → confirmed purchase** = `a11_purchase_confirmed` / `a11_checkout_started`
5. **purchase → refund within 30 days** = `a11_refund_recorded (within 30 days of its purchase)` / `a11_purchase_confirmed`

Segment only by normalized `source` and device class. Nothing else is a
segment — a segment we cannot name here is a segment the allowlist will not
produce.

## Reading rules

- **Do not optimize on fewer than 100 qualified sales-page visits or 20 checkout starts.**
  Below those counts the rates move on single events and mean nothing.
- Always report raw counts beside every rate, and an interval, not a point
  estimate. A "3.2% conversion" from 31 visits is one purchase.
- A rate that moved without its denominator moving is a measurement change,
  not a product change — check the release log before acting.
- The weekly truth report (`weekly_metrics`, see CLAUDE.md) stays the source
  for revenue and usage figures; this document covers the funnel only.
