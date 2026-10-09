# Baseline: before the "Die Linie" redesign (measured 2026-10-03)

This page records what was true on `main` (4372e1a) before the redesign, so every "after" figure
has a "before" to sit next to. All numbers are dated. Where a number comes from an earlier
snapshot, it says so.

## Money and accounts (Supabase, read-only, 2026-10-03 ~23:10 UTC)

| Measure | Value | Source |
|---|---|---|
| Real course sales, ever | **0** (two `purchases` rows, both €0: `course_a1` 09-03 test, `course_alle` 09-08) | `purchases` |
| Paid subscription rows still inside their period | 5 (any status; 3 paying + failing renewals per SCORECARD) | `subscriptions` `price_paid > 0 and subscription_end > now()` |
| MRR (last weekly snapshot) | €32.97 from 3 payers | `weekly_metrics` 2026-09-28 06:00 UTC (the 10-05 run is not in yet) |
| Accounts | 1,700 | `auth.users` |
| Signups, last 30 days | 137 (161 on 09-28) | `auth.users.created_at` |
| Signups, last 7 days | 17 (30 on 09-28) | same |

### Who signs up (last 30 days, 137 accounts)

**Exam goal** (`profiles.exam_track`, the onboarding's exam-first question):

| Track | Accounts |
|---|---|
| goethe_b1 | 36 |
| telc_b2 | 9 |
| goethe_a1 | 8 |
| goethe_a2 | 6 |
| telc_b1 | 5 |
| none | 4 |
| dtz | 2 |
| not answered | 67 |

Of the 70 who named a goal, **41 aim for B1**: 36 Goethe B1 and 5 telc B1.

**Level** (`profiles.current_level`):

| Level | Accounts |
|---|---|
| `a1` | 105 (the signup default, so not placed) |
| B1.1 | 11 |
| B1.2 | 9 |
| A2.2 | 4 |
| B2.2 | 3 |
| A2.1 | 2 |
| B2.1 | 2 |
| A1.1 | 1 |

**First-touch source:** 110 untracked, 25 Google, 1 DuckDuckGo, 1 Android app. Every attributed landing was `/` (26), except one on `/podcasts/`.

**What this means for the redesign:**
- The stated destination is mostly B1, but most new accounts never place themselves.
- The homepage has to sell **the route to a destination**: the stop you are at now, buyable today (A1.2–A2.2), and B1 reachable through Pro and the exam pages until the B1 courses ship. A homepage selling only "learn German from zero" would miss the B1-bound majority.

## Checkout availability in production

`https://deutsch-meister.de/pricing/` was fetched on 2026-10-03 from an outside sandbox (Composio), because this environment's egress blocks the site:

- Three `data-course-variant` UUIDs are present, for `course_a1_2`, `course_a2_1` and `course_a2_2`. **The build-scope checkout ids are set**, so live visitors see Buy on those three.
- The functions-scope numeric ids, which the webhook uses to grant access, cannot be read without printing an env value. They are confirmed only by a real (€0 discount) test purchase (SCORECARD §3 #2b).

## Web performance (local production build, CI way)

Setup: mobile Lighthouse, median of 3 runs, Chromium 141, a gzip static server with immutable caching on `/fonts`, `/_astro` and `/assets`. This is a local lab measurement, not field data.

| Page | Perf | LCP | CLS | TBT | JS KB | Font KB | Total KB | A11y |
|---|---|---|---|---|---|---|---|---|
| `/` | 99 | 1.96 s | 0 | 0 | 9 | 96 | 147 | 96 |
| `/pricing/` | 99 | 1.95 s | 0 | 0 | 11 | 96 | 149 | 100 |
| `/grammar/a1.1/definite-articles/` | 99 | 2.11 s | 0 | 0 | 9 | 96 | 158 | 100 |
| `/courses/a1-1/` | 99 | 1.95 s | 0 | 0 | 11 | 96 | 148 | 100 |
| `/leitfaden/telc-b1/` | 99 | 2.11 s | 0 | 59 | 9 | 96 | 150 | 100 |
| `/level-test/` | 84 | 4.04 s | 0 | 73 | 277 | 96 | 410 | 100 |
| `/login` | 89 | 3.31 s | 0 | 21 | 239 | 96 | 383 | 91 |

## The visitor journey as built (screenshots in the review page, not in the repo)

The baseline was captured at 360, 390, 768, 1280 and 1440 px for `/`, `/pricing/`, `/courses/`, `/courses/a1-2/`, `/signup` and `/subscription`. No horizontal overflow at any width.

What a visitor meets:

- **`/` (exam-first):**
  - H1 "Your exam has a date. Your German needs a plan." Primary CTA: the level test. Nav CTA: "Start 7-day trial".
  - The closing section prices the other 7 levels at the Pro rate.
  - The one-time level courses, which the owner decided on 2026-09-03 are *the product*, do not appear on the homepage at all.
- **`/pricing/`:**
  - Leads with Explore / Free trial / Pro; "Or buy a level once" sits below the fold.
  - In a build without course ids (CI, a local build) every course card reads "Coming soon". In production, A1.2–A2.2 show Buy.
- **`/signup` and `/login`:** have **two `<h1>`** each after hydration. `index.html` contains a visually hidden shell `<h1>Learn German with DeutschMeister`, and it stays in the DOM beside the page's own heading. `/subscription` redirects signed-out visitors to `/login`.
- **Measurement:**
  - Astro pages send no analytics events at all: no PostHog, no GA4 custom events.
  - A checkout started on `/pricing/` or `/courses/` fires no `checkout_started`, and its success page fires no `checkout_completed`.
