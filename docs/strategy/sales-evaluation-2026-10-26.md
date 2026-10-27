# How to sell DeutschMeister: live-site evaluation, 2026-10-26

> **Superseded** the same day by the [20-aspect deep evaluation + clean sheet](sales-deep-evaluation-2026-10-26.md). Kept as the first-pass record.

*Claude, with a blind second evaluator (Claude subagent) and Codex, the official `codex@openai-codex`
plugin / Codex CLI 0.164.0, model gpt-6.1-sol. Codex ran two read-only passes: one blind evaluation
and one red-team of the first draft. The red-team verdict was **REWORK**. Every finding was
checked against the code, and this version applies them (§6).*

**Sources.**
- **Firecrawl live crawl** (`maxAge: 0`): 16+ URLs and two 360 px mobile screenshots.
- **Buyer searches:** 5 searches, plus offer pages of the ranking competitors.
- **Supabase reads:** read-only, project `omqyueddktqeyrrqvnyq`, 2026-10-26.
- **The plan this sits under:** [the million plan](million-plan-2026-10.md) (2026-10-19). Its
  release gate, kill list and move order stand. This document sharpens moves 3–5 with what the
  site shows today.

---

## Bottom line

**Exam demand sits at B1. What the site lets people buy sits at A1–A2 or is general Pro.**

**Demand.** In the last 60 days, signups named an exam 95 times (9 more chose "none", 129 left it
unset).
- **74 of the 95 named a B1/B2 exam:**
  - Goethe B1: 45
  - telc B2: 11
  - telc B1: 10
  - DTZ: 8
- These are preferences, not proven buyers.

**Supply.**
- **Tickets on sale:** A1.2, A2.1 and A2.2.
- **B1/B2 tickets:** they show "Im Bau · coming soon".
- **The telc package:** its page shows "89,00 €" next to "Der Kurs startet in Kürze".
- **The only paid route at B1:** general Pro (€9.99), which does include every level's lessons,
  AI feedback and the timed practice exams (`src/data/offers.js:193`).

**Result:**
- Lifetime purchases: 3 rows, about €268 lifetime revenue.
- Subscriptions: 5 `active`.
- Signups: 65 in 30 days, 16 in the last 7.

**The order doesn't change.** First the owner's release gate, then a telc pilot people can buy
(owner decision: €149), then buyers through partners. At 16 signups a week, reach stays the
binding constraint. Site changes only make sure the visitors we already have reach the right
door.

---

## 1. Scores (three evaluators, live site)

| # | Aspect | Claude | 2nd eval | Codex | Evidence (verified) |
|---|---|---|---|---|---|
| 1 | Who it's for | 3 | 3 | 2 | The hero sells a beginner line, and the primary action is free A1.1 (`astro-site/src/pages/index.astro:102`). The exam buyer is never named |
| 2 | Offer & pricing | 2 | 2 | 2 | Tickets €40–65, Pro €9.99 or €79.99, and an unavailable telc package all overlap. "Pro alone for 3 months: €29.97" next to the €40 ticket argues against the ticket |
| 3 | Positioning | 2 | 2 | 2 | The telc page sells "weeks of grammar", but the built programme is exam-task-first with an unseen retest on day 20 (`src/data/programs/telcB1Komplett.js:48`). The real search rivals are exam shops (TestHelden "39 € Komplettpaket… 30 Tage Geld-zurück-Garantie"; DeutschAkademie "ab 89 €", 4.9 from 7,328 reviews, per their pages and snippets on 2026-10-26), not Babbel |
| 4 | Trust & proof | 2 | 2 | 2 | There are content counts, but no outcomes, sample corrections or guarantee. The founder line was inconsistent and is **fixed in this PR**. The telc hero's "Die meisten fallen nicht durch, weil…" is unsupported (`telc-b1-komplettvorbereitung.astro:138`) |
| 5 | Conversion path | 3 | 3 | 2 | The 360 px screenshot clips the hero copy and the "Create a free account" button. Buy intent survives signup (`src/lib/buyIntent.js`) |
| 6 | Free → paid moments | 2 | 2 | 3 | Offers already exist: a trial banner "Upgrade to Pro" (`TrialBanner.jsx:86`), offers matched to trial feedback (`examFeedbackOffer.js`), and next-course offers on completion. **But the telc offer leads to a product that can't be bought** |
| 7 | Exam-intent capture | 2 | 2 | 2 | Four telc long-tail guides already have an offer door (`astro-site/src/data/guides/index.js:96`). The **main** telc B1 guide ends on the level test only (`guides/telc-b1.js:311`). `firstRun` sends exam choosers to beginner or placement steps (`src/lib/firstRun.js`) |
| 8 | Language | 2 | 2 | 2 | The homepage, `/pricing/`, `/level-test/` and `/signup` are English, and `/de/` is 404. German exam buyers land on English money pages |
| 9 | Retention | 2 | 2 | 2 | 5 active and 2 unpaid subscriptions. 11 of 12 payers ever hit a failed payment (million plan) |
| 10 | Technical / trust pages | 3 | 3 | 1 | Pages load fast. `/agb/` and `/widerruf/` are 404, and the Impressum shows "Entwurf — nicht freigegeben" (`impressum.astro:30`) |
| | **Total** | **23** | **23** | **20** | |

**Withdrawn from the first draft:**
- "Continue learning →" is shown to new visitors: false. It is `data-auth-only`, hidden by default
  (`index.astro:103`), so the crawler read hidden text.
- "The trial ends with no offer": false (see row 6).
- "Nothing at B1/B2 can be bought": overstated. Pro covers B1/B2 practice.

---

## 2. What to sell, to whom, in what order

1. **First: the telc B1 rehearsal pilot, once the gate passes.**
   - Price: €149 (owner decision on record).
   - Buyer: an adult near B1 with a telc date 4–8 weeks out.
   - Pitch: the mechanism that is actually built, which is written and revised letters, guided
     speaking rehearsals, targeted gap practice and an unseen retest. Not "a German course".
2. **Next variant: decided by the million plan's rule, unchanged.**
   - After telc sells ≥5 of 10, DTZ opens at ≥10 waitlist signups; Goethe B1 needs **paid**
     validation abroad.
   - Goethe B1 is the largest preference (45), but a preference is not a payment.
3. **Pro stays as it is:** only loss-stoppers (dunning, access follows payment). Pushing yearly
   or optimising Pro is on the kill list. Parked unless the owner changes it.
4. **A1–A2 tickets:** no new work. They stay on sale.

---

## 3. The changes, in dependency order

**Who may do what:**
- `[agents]` means it can ship as a normal PR. It is copy, links or layout derived from
  `pricing.js`/`marketing.js`.
- `[owner]` touches money, terms, legal, consent or brand messages (Team v5 reserved list).

| # | Change | Where | Why | Who |
|---|---|---|---|---|
| 0 | **Founder line = "a team of doctors" everywhere** | `marketing.js` (both copies), telc page | One true claim across homepage, guides, exam hubs, comparisons and `/ueber-uns/` | **Done in this PR** (owner decision 2026-10-26) |
| 1 | **Clear the release gate**: operator/tax, FernUSG/ZFU (covering Pro and tickets too), §7 UWG mail basis, Impressum facts, AGB/Widerruf, VAT-inclusive store, telc renamed and repriced to €149 in Draft, test purchase → refund → replay | million plan move 1 | Every conversion change below still ends at a product that can't be bought until this passes | [owner] + counsel; agents prepare the brief |
| 2 | **Fix the mobile hero overflow** at 360 px, with the cookie banner visible, checked in a real browser | `astro-site` homepage hero | Touches every mobile visitor. It's a defect, so it's exempt from the polish freeze | [agents] |
| 3 | **Sell the built mechanism on the telc page.** Replace the grammar-weeks description with what `telcB1Komplett.js` does. Remove the unsupported "Die meisten fallen nicht durch" claim. Align "20 Tage / 4 Wochen" | `telc-b1-komplettvorbereitung.astro` | It's PR C's content from million plan move 3. The page under-sells what was built | [agents]; the €149 price and terms are [owner] |
| 4 | **Point the main telc guide at the telc offer door** (the same `GUIDE_OFFERS.telc` door its four long-tail guides already use). List any other guide without a door one by one; don't replace existing doors | `astro-site/src/data/guides/telc-b1.js` / registry | The guide that ranks for "telc B1" ends on the level test | [agents] |
| 5 | **Labelled signup doors, not a new waitlist system**, on the B1/B2 cards and the telc page: the same campaign-labelled signup pattern as `dtz-waitlist` and `goethe-b1-waitlist`. No promise to notify (enforced by `tests/guides.test.mjs`) | `/`, `/pricing/`, telc page | Counts B-level interest per exam in `profiles.acquisition_campaign`, with no new endpoint and no consent question | [agents] |
| 6 | **Exam choosers start on an exam task** (`firstRun` honours `exam_track`) | `src/lib/firstRun.js` | Million plan move 3's narrow funnel change. Today experienced learners land on A1.1 or a 20-minute test | [agents]; ships with the pilot |
| 7 | **Visible proof beside the offer**: one labelled sample letter with its corrections, revision and rubric | telc page | With 0 reviews against rivals with thousands, an inspectable sample is the cheapest proof | [agents] build; [owner] approves it as a brand message |
| 8 | **A money-back guarantee** on the pilot | terms, telc page | The ranking rival sells with "30 Tage Geld-zurück-Garantie" | [owner]: a money/terms decision inside the gate |
| 9 | **German money pages** (`/de/` home, German level-test entry) | new Astro pages | Buyers search in German. A larger build: only after the pilot shows pull | [agents] after the owner approves the framing |

**Parked:**
- **Yearly as default, or reworking the "€29.97" anchor:** Pro optimisation is on the kill list.
  If the owner reopens it, show the €79.99 charge with the derived monthly figure next to it.
- **A notify-me waitlist with mail:** it needs an owner-approved consent basis, a verified address,
  consent version and time, withdrawal, rate limits and restricted reads. That's a security/consent
  release, not copy.
- **Expanding `/vergleich/`** and **new social packs:** both on the kill list.

---

## 4. Measures

**Exploratory, available now:**
- Signups per labelled door (`profiles.acquisition_campaign`), per exam.
- Starting point: 3 profiles with an exam date; 10 telc B1 choices in 60 days.

**Binding, per the million plan:**
- A reconciled **server-side** denominator: qualified offer view → checkout → payment → refund.
  It is privacy-approved and in place **before** any kill clock starts. `public/attribution.js`
  stores first/last campaign labels, so it is not a view or click denominator.
- The pilot is judged on sales after ≥300 qualified offer views (move 4's rule).

---

## 5. Live numbers used (2026-10-26)

| Measure | Value |
|---|---|
| Accounts | 1,748 total; 65 created in 30 days; 16 in 7 days |
| Exam choice, last 60 days | Goethe B1 45 · Goethe A1 11 · telc B2 11 · Goethe A2 10 · telc B1 10 · DTZ 8 (95 named) · none 9 · unset 129 |
| First-touch source, last 60 days | untracked 165 · google 56 · bing 4 · chatgpt.com 3 · other 5 |
| Purchases (rows) | `course_alle` 09-08 · `course_a1` 09-03 · `course_a1_2` 10-14 |
| Subscriptions | active 5 · expired 7 · unpaid 2 · cancelled 1 |

**Queries:**
- Counts from `auth.users` and `profiles` (`exam_track`, `acquisition_source`, `created_at > now() - 60/30/7 days`).
- Purchase and subscription rows grouped by `product_key` and `status`.

---

## 6. Codex red-team: findings and what changed

| # | Codex finding | Verdict | Change |
|---|---|---|---|
| 1 | The draft put the waitlist before the release gate | Agreed | The gate is #1, and everything else is ordered behind it |
| 2 | The waitlist is a new consent/security system. Labelled doors already exist, and tests forbid notify promises | Verified (`guides/index.js:96`, `tests/guides.test.mjs:326`) | Now #5 as labelled signup doors. A notify list is parked |
| 3 | Yearly-Pro pushes break the kill list | Agreed (million plan, kill list 5) | Parked |
| 4 | Attribution is not a denominator; kill rules need server-side measures | Verified (`public/attribution.js:10`) | §4 rewritten |
| 5 | "Nothing at B1/B2" ignores Pro; the trial does show offers | Verified | Withdrawn and reworded |
| 6 | "Continue learning" is auth-only | Verified (`index.astro:103`) | Withdrawn |
| 7 | Long-tail telc guides already have offer doors | Verified | #4 narrowed to the main telc guide |
| 8 | 95 named exams, not 104 | Verified (arithmetic) | Corrected to 74 of 95 |

**From Codex's blind pass:** the telc page under-sells the built programme (#3) and the Impressum
shows a draft notice (scores row 10). Both adopted.
