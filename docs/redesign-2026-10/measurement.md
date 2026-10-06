# Measurement: event map, metric, experiments

The registry is `src/data/events.js`, twinned to `astro-site/src/data/events.js` and guarded by `check-duplicates`. This page is its human-readable form.

## Rules

1. **Consent first.** Events leave the browser only after `dm_cookie_consent === 'accepted'` (`public/consent.js`). Before that they are dropped, never queued.
2. **No personal data, no learner text.** `sanitizeProps()` keeps only the `ALLOWED_PROPS` keys. It drops any value that looks like an email address or prose, and any value over 64 characters. The demo sends a verdict (`correct`, `typo`, `wrong`), never the answer typed.
3. **A client event is an observation, never money.** Revenue is a `purchases` row written by the Lemon Squeezy webhook, which `weekly_truth_metrics()` reads. `checkout_completed` can disagree with the ledger: through a refund, a blocked overlay or a reload.

## Transport

| Front end | Sender | Destination |
|---|---|---|
| Astro (`/`, `/pricing/`, `/courses/**`, telc) | `astro-site/src/lib/track.js` → `gtag('event', …)` | GA4 |
| SPA | `src/lib/funnelTracking.js` → PostHog, mirrored to GA4 via `mirrorToGa()` | PostHog + GA4 |

Every Astro event also carries `entry_page`, `signed_in` and the first-touch `dm_source`, `dm_medium` and `dm_campaign` (from `public/attribution.js`). Events marked `once` are deduplicated per page view.

## Event map

| Step | Event | Fires when | Key props |
|---|---|---|---|
| See the offer | `offer_viewed` | The station line, a ticket or a pricing column is ≥ 50% on screen | `surface` |
| Try it | `demo_started` | First answer checked in "Der erste Halt" | `step`, `result` |
| | `demo_completed` | All three demo items answered correctly | `result` |
| Choose | `course_selected` | A station, a fit answer or a course card is chosen | `level`, `choice`, `surface` |
| Want it | `checkout_intent` | Buy or Pro is pressed, before the sign-in check | `product`, `amount`, `surface` |
| Account | `signup_started` / `signup_completed` | Form submitted / first confirmed sign-in on this browser (`src/lib/signupCompletion.js`) | — |
| Pay | `checkout_opened` (Astro) / `checkout_started` (SPA) | The Lemon Squeezy checkout opens for a signed-in buyer | `product`, `amount` |
| Paid (observed) | `checkout_completed` | The app sees the success screen once (`dm_checkout_pending` → `consumeCheckoutSuccess`) | `plan`, `amount` |
| Paid (real) | — | A `purchases` row exists (webhook) | `weekly_truth_metrics()` |
| First lesson | `lesson_started` / `lesson_completed` | A course Lektion opens / reaches its recap | `level`, `topic` |
| Social | `social_clicked` | A link to YouTube / Instagram / Facebook is clicked (site footer, lesson recap) | `channel`, `surface` |

**The `signup_completed` fix.** It used to fire only within 60 seconds of account creation, and email confirmation usually takes longer. It now also fires when the email was confirmed in the last 30 minutes on an account under 14 days old, once per browser.

## The metric

**Primary: net revenue per qualified visitor.**

Until visits are measurable (GA4 with consent, and a verified Search Console property), use the proxy **real course sales per 100 signups**. Read it from `weekly_metrics` (course sales) divided by signups for the same week.

**Funnel diagnostics (GA4, consented visitors only):**
- `offer_viewed → checkout_intent` rate, split by `surface`;
- `demo_started → demo_completed`;
- `checkout_intent → checkout_opened`: the signed-out loss through signup;
- `checkout_opened → checkout_completed`.

**Guardrails (any breach stops an experiment):**
- Refund rate on tickets above 10%.
- Support tickets with topic `payment` above 2 in a week.
- Mobile Lighthouse below 95 on `/`, or CLS above 0.05.
- Signup → first lesson rate falls below the 10% baseline.

## Experiment backlog (sequential, one at a time)

Traffic is too low for split tests. Each experiment runs **for at least 14 days and at least 100 signups**, then switches. The decision rule compares against the previous period and accepts only a lift that is ≥ 2× the week-to-week noise of the last 4 weeks.

| # | Hypothesis | Audience | Change | Metric | Guardrails | Exposure | Decision rule |
|---|---|---|---|---|---|---|---|
| E1 | Naming the destination ("to B1") lifts intent among the B1-bound majority | All `/` visitors | `ACTIVE_HERO`: route → mechanism → guess | `offer_viewed → checkout_intent` on `/`; course sales per 100 signups | All four above | 100%, 14 days per arm | Keep the arm with the highest intent rate if sales per 100 signups do not drop |
| E2 | The demo creates buyers, not just players | `/` visitors who finish the demo | The demo's arrival card also offers the next stop ("Next stop: A1.2 — €40, once") beside "Start A1.1 free" | `demo_completed → checkout_intent` | Signup → first lesson | 100%, 14 days | Keep if intent after the demo rises and free-course starts do not fall by more than 10% |
| E3 | An honest refund line lifts ticket sales | `/pricing/` and ticket viewers | Add the confirmed policy to the ticket's "terms" line (**owner decision first**) | Course sales per 100 signups | Refund rate | 100%, 28 days | Keep if sales rise and refunds stay below 10% |
| E4 | Signed-out buyers are lost at email confirmation | Signed-out Buy clicks | Send the confirmation email with the product name and "your checkout is waiting" | `checkout_intent (signed out) → checkout_opened` | Email complaints | 100%, 28 days | Keep if completion rises ≥ 25% |
| E5 | Pro undercuts the ticket (decision D1) | Pricing visitors | Show "Pro opens levels while you pay; a ticket keeps one for good" beside the Pro price | Ticket vs Pro mix | MRR | 100%, 28 days | Revisit D1 if Pro takes > 70% of paid conversions |
| E6 | Prices first beats self-placement first | `/` visitors | Swap the line (stations with prices) above the fit chooser (today the fit chooser comes right after the hero) | `offer_viewed → checkout_intent` on `/` | — | 100%, 14 days | Keep the order with the higher intent per visitor |

**Logging.** Each switch gets one line in the SCORECARD experiments log: date, arm, metric before and after.
