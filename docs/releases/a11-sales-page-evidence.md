# DeutschStart A1.1 sales page — real-renderer evidence

Plan: `docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md` Task 1 Step 5.
Inspected 2026-09-16 against the **built Astro site** (`astro preview`,
`127.0.0.1:4325`) in headless Chromium — the artifact a crawler and a buyer
receive, not the source.

## Result

| Viewport | Horizontal scroll | `<h1>` | Controls without a name | Images without alt |
|---|---|---|---|---|
| 320×700 | none | 1 | 0 | 0 |
| 768×1024 | none | 1 | 0 | 0 |
| 1440×900 | none | 1 | 0 | 0 |

Headline rendered: *"Start speaking German for real life—not just completing
exercises."* Four preview CTAs resolve to
`/course/a1.1/l/1?source=a11-sales` (the SPA lesson route, served by the
`/course/*` rewrite in `netlify.toml`). The first screen carries audience,
outcome, price model and the free preview.

## Finding, and the fix

**The course URL slug was wrong in the email sequence.** The Astro build
emits the sales page at **`/courses/a1-1/`** (`levelToSlug`), while the plan
text and two of the five preview emails used `/courses/a1.1/`. That is a 404
in the one message that carries the offer. Both CTAs were corrected, the
analytics doc was corrected, and `tests/a11-email-sequence.test.mjs` now
fails on any `deutsch-meister.de/courses/a1.1` link so it cannot come back.

No other issue was observed.

## What this evidence does NOT cover

- The audio/demo controls on the walkthrough section need the live Supabase
  content the sandbox cannot reach.
- A human screen-reader pass (automated name/role/alt checks passed).
- Checkout: the A1.1 variant id is deliberately unset, so the page renders
  its preview CTA and no live checkout — see the launch checklist.
