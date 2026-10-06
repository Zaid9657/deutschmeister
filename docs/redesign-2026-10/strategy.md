# Strategy: "Die Linie"

Written 2026-10-04 with the redesign (branch `claude/wonderful-davinci-071dhj`). The before-numbers are in
[`baseline.md`](baseline.md). The event map and experiments are in [`measurement.md`](measurement.md).

## 1. Diagnosis

**The site sold a different product from the one the owner chose.**

- The owner decided on 2026-09-03 (re-cut 09-08) that **the level courses are the product**:
  - A1.1 is free.
  - A1.2 costs €40; A2.1 and A2.2 cost €50 each. Each is a one-time payment for lifetime access, with 3 months of Pro included.
  - B1 and B2 are coming soon.
  - Pro (€9.99 a month or €79.99 a year) is the AI add-on.
- The homepage on `main` did something else:
  - It led with exams. B1 was the exam most visitors named, and B1 cannot be bought.
  - Its primary CTA was the level test, and its nav CTA was the 7-day trial (0 of 181 trials have converted).
  - It priced the other seven levels at the Pro rate in its closing section.
  - The level courses did not appear on it at all.
- `/pricing/` led with Explore / Free trial / Pro. "Or buy a level once" sat below the fold.

**Money and measurement:**
- 0 real course sales ever.
- €32.97 MRR from 3 payers.
- 137 signups in 30 days, of which 105 never placed themselves.
- Astro pages sent no analytics events, so a checkout started on `/pricing/` or `/courses/` was invisible.

**Funnel defects found along the way (all fixed on this branch):**
- The success page told course buyers "Welcome to Pro!" and sent them to `/level/x`.
- The dashboard's "Continue" resumed grammar, not the course the learner had bought.
- `/signup` and `/login` had two `<h1>` elements.
- `/pricing/` carried its own copy of the checkout code with hard-coded Pro ids.
- The telc checkout did not pass the buyer's id, so the webhook had to match by email.

## 2. Who we sell to

**The audience:** people starting German or early in it who need it for a real step (visa, move, job), and who want to know which stop they are at and what the next one costs.

**Evidence:**
- 1,632 of 1,686 profiles still sit on the `a1` default.
- Of the 70 recent signups who named a goal, 41 named B1.
- The 2026-09-03 buyer research.

**What the homepage therefore sells:** the route to that destination.
- The stop you are at now can be bought today (A1.2–A2.2).
- B1 is reachable through Pro and the exam pages until the B1 courses ship.
- Visitors with an exam date get a fit-chooser answer ("I'm heading for B1 or B2 now") that routes to `/pruefung/`, telc B1 and Pro. They are not shown a course that is still being built.

## 3. The funnel

```
landing → the line → ride the first stop (demo) → choose a stop → ticket checkout
       → access (webhook) → "Your ticket is valid" → first Lektion → dashboard Continue
```

| Visitor | Path |
|---|---|
| Knows their level | Buy directly from the station or the ticket. No test required. |
| Unsure | The fit chooser (CSS only, works without JS), or the 20-minute level test. |
| Signed out at Buy | `dm_buy_intent` → signup, which shows "Step 1 of 2 · your account" with the product and price → confirm → `/subscription?buy=<key>` opens the checkout. |
| Returning | "Continue learning" in the nav. The dashboard hero resumes the course they own (`src/lib/courseNext.js`). |

## 4. Offers

### A. Live now (every figure derives from `pricing.js`, `marketing.js` and `courseContents.js`)

| Offer | Price | What it is |
|---|---|---|
| **First stop, A1.1** | Free, no account | 12 situational Lektionen. The homepage demo plays three of its real items and grades them with the course's own checker. |
| **Level ticket, A1.2 / A2.1 / A2.2** (flagship) | €40 / €50 / €50, once | The level for good: a 28-day guided plan (92 / 93 / 87 steps, about 28–30 hours), reading, listening, vocabulary, missions and a final test in exam format. **Plus 3 months of Pro on board**: every level opens, with 30 AI speaking sessions and 20 writing corrections a month and 50 X-Ray analyses a day. No subscription, nothing renews. After the window the level stays and the AI drops to the free allowance. |
| **Pro, "rent the whole line"** | €9.99 a month / €79.99 a year | Every level while you pay, with the full AI allowance. |
| **telc B1 Komplettvorbereitung** | €89, once | On its own page. It now passes `user_id` and email to the checkout. |

**Framing:** *own a stop* (ticket) versus *rent the whole line* (Pro). The pricing page shows them side by side in a flat table, and states the comparison once: "Pro on its own for 3 months: €29.97."

**Truth rules held on every offer surface** (`tests/offers.test.mjs`):
- No testimonials or ratings.
- No learner counts.
- No "most popular".
- No scarcity or countdowns.
- No outcome promises.
- No refund promise (that is an owner decision, §7).

### B. Proposed expansion (documented, not built)

The unit economics in the table assume Lemon Squeezy's 2026 fee of **5% + $0.50 per order**, plus 1.5% on international cards and another 1.5% on PayPal.

**Assumptions:**
- Prices are VAT-inclusive at the German 19% (worst case for a DE buyer).
- AI cost per ticket **is not measured**: no provider invoice is in the repo. It is bounded by the limits (30 speaking + 20 writing a month × 3 months) and must be filled in from the provider bills before any AI-heavy bundle ships.

| Idea | What it needs built | Net per sale (gross → after VAT and fees, before AI) | Preconditions |
|---|---|---|---|
| **A1 path bundle** (A1.1 free + A1.2 + an A2.1 discount) | A Lemon Squeezy product and webhook mapping (the `course_*` key pattern already allows it) | e.g. €80 → ≈ €62 | First 10 single-ticket sales, to know the ticket converts at all |
| **Speaking top-up** (+10 sessions) | A wallet credit endpoint. The speaking wallet exists, but nothing tops it up. | €5 → ≈ €3.5 | The measured AI cost per session must be below ≈ €0.25 |
| **Exam-date plan with check-ins** | The plan exists in A1.1 (`ExamDatePlan`). Needs a mailer and a per-level plan. | Bundled into a ticket | `course_reminder` mailer data on completion rates |
| **Post-fail re-plan** | Mock-exam result → a targeted plan | Retention, not sales | Exam attempts per user > 1 |
| **Guarantee** ("finish the plan, pass the final test, or …") | Policy and legal wording | — | **Owner and legal only.** Never build it from copy. |

## 5. Revenue model (what "10×" means here)

**Formula:** net revenue = qualified visits × paid conversion × net revenue per customer (30 days).

Visits cannot be measured from this environment (GA4 is consent-gated, and Search Console is unverified for this site). Until they can, the working proxy is **real course sales per 100 signups**.

**10× today's €32.97 is about €330 a month.** That is either:
- about 9–10 level tickets a month (≈ €31 net per A1.2, ≈ €39 per A2.x); or
- about 45 Pro monthly payers (≈ €7.40 net each).

**Three routes, kept separate:**

1. **The launch email** (SCORECARD #2, owner-held). It goes to about 1,080 accounts that have never bought.
   - At 0.5–1% conversion that is 5–11 tickets, ≈ €190–400 once.
   - This is the fastest money and does not need this redesign.
2. **Buyer rate on new signups.** 137 signups a month at a 3–5% ticket rate is 4–7 tickets, ≈ €150–260 a month.
   - The redesign is aimed here: the offer is now the first thing a visitor and a new account see.
3. **Traffic.** Each extra 100 signups at the same rate adds ≈ €110–190 a month.
   - Distribution (Telegram, social packs, SEO) is the lever here, not the site.

**Keep these lines apart in every report:**
- one-time ticket revenue;
- recurring Pro revenue;
- Lemon Squeezy fees and VAT;
- AI cost;
- refunds.

`weekly_truth_metrics()` already reports course sales and MRR separately. It does not report fees, VAT or AI cost.

## 6. What the redesign changes to move route 2

1. **The offer is the page:**
   - The homepage is the line itself.
   - The ticket says exactly what one payment buys, in four lines.
   - Pricing leads with "own a level".
2. **Proof without claims:** a playable first stop graded by the real checker, content counts taken from live tables, and how answers are checked.
3. **No dead ends:**
   - Buy appears only behind a checkout id.
   - "Im Bau" stops are never sold.
   - The signup step names the purchase it resumes.
   - The success page says what was bought and until when.
   - The dashboard resumes the course.
4. **Measurable:** `offer_viewed → demo_* → course_selected → checkout_intent → checkout_opened → checkout_completed` on both front ends, consent-gated and free of personal data.

## 7. Owner decisions (each with a recommendation)

1. **Confirm the functions-scope numeric variant ids** for A1.2, A2.1 and A2.2 with a €0 (100% discount) test purchase. Production already shows Buy for these three, so this is what proves a buyer actually receives access. **Do this before the launch email.**
2. **D1: Pro opens every paid level**, so one €9.99 month undercuts a €40 ticket.
   - Recommendation: **keep it for now**. Frame it as own versus rent (done), and revisit after the first 10 ticket sales with real data on who buys which.
3. **Refund wording.** `src/data/faqContent.js` used to mention a 7-day money-back guarantee; it was removed on 2026-10-05 (#186) and `tests/refund-claims.test.mjs` now bans any refund promise until this decision is made. No sales surface states one.
   - Recommendation: confirm the policy in the Lemon Squeezy settings, then decide whether it belongs on the ticket. An honest refund line usually lifts one-time purchases.
4. **The global body-font swap (Archivo in the app)** waits until Course v2 (PR #149) merges.
   - Recommendation: keep the library in Fraunces/Nunito and use the sign face for commerce screens only (what this branch does).
5. **Pause agent edits** to `Layout.astro`, `index.astro`, `pricing.astro` and `courses/**` while this PR is open, to avoid merge collisions.
6. **Send the launch email** (SCORECARD #2) as soon as decision 1 is confirmed. It is the fastest route to the first sale, with or without this redesign.
