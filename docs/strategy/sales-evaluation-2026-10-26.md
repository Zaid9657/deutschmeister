# How to sell DeutschMeister: live-site evaluation, 2026-10-26

*Claude, with an independent blind second evaluator. The Codex pass is in §6. Scope: the live
site as a first-time buyer sees it, plus live sales data. Nothing was changed on the site or in
the store for this.*

**Sources.**
- **Firecrawl live crawl** (`maxAge: 0`): 16+ URLs and two 360 px mobile screenshots.
- **Buyer searches:** 5 searches, plus offer pages of the ranking competitors.
- **Supabase reads:** read-only, project `omqyueddktqeyrrqvnyq`, 2026-10-26.
- **The plan this sits under:** [the million plan](million-plan-2026-10.md) (2026-10-19). This
  document sharpens its moves 3–5 with what the site shows today. It does not replace them.

---

## Bottom line

**The store sells what visitors aren't asking for, and nothing at the level they are asking
for.**

**Demand (live DB, signups in the last 60 days that named an exam):**
- **74 of 104 chose a B1/B2 exam:**
  - Goethe B1: 45
  - telc B2: 11
  - telc B1: 10
  - DTZ: 8
- 21 chose A1/A2.

**Supply:**
- **What can be bought:** A1.2 (€40), A2.1/A2.2 (€50) and Pro (€9.99).
- **What can't:** B1.1–B2.2 show "Im Bau · coming soon". The telc B1 course shows "89,00 €" next to
  "Der Kurs startet in Kürze", with only a free-signup button.

**Result:**
- Lifetime purchases: 3 rows, about €268 lifetime revenue.
- Subscriptions: 5 `active`.
- Signups: 65 in 30 days, 16 in the last 7.

**The binding constraint is still reach.** Even a perfect store converts 16 signups a week into
very little money. Every change below is chosen so that the visitors we already have leave
something behind: a purchase where one is possible, otherwise a dated waitlist entry. That list
is the buyer source for the telc pilot (million plan move 4).

---

## 1. Scores (two evaluators, live site)

| # | Aspect | Score | Evidence |
|---|---|---|---|
| 1 | Who it's for | 3 | Distinctive train-line hero, but exams first appear far down the page. The buyer (immigrant, residence/citizenship/job, deadline) is never named |
| 2 | Offer & pricing | 2 | 4 offer types. "Pro alone for 3 months: €29.97" sits beside the €40 ticket and tells the buyer Pro is cheaper. Yearly is behind a toggle. B1/B2 cards show prices with no waitlist |
| 3 | Positioning | 2 | `/vergleich/` fights Babbel, Duolingo and Lingoda. The rivals that rank for buyer queries are exam shops: telc-trainer.de, TestHelden ("39 € Komplettpaket… 30 Tage Geld-zurück-Garantie") and DeutschAkademie ("ab 89 €", 4.9 from 7,328 reviews), per search snippets and their own pages on 2026-10-26 |
| 4 | Trust & proof | 2 | Honest, but 0 testimonials, no guarantee, no outcome data. The founder line differs: "a doctor" on the homepage, "a team of doctors" on `/ueber-uns/` and the telc guide |
| 5 | Conversion path | 3 | Good: A1.1 needs no account. Bad: 4 hero CTAs, with "Continue learning →" shown to new visitors and going to the same URL as "Start A1.1 free". At 360 px the hero copy and the "Create a free account" button are clipped at the right edge (screenshot) |
| 6 | Free → paid moments | 2 | The trial gives "2 AI speaking sessions total", "no card · no automatic charge", and ends with no offer. The level test and exam choice don't lead to a matching product |
| 7 | Exam-intent capture | 2 | There are 6 `/pruefung/` routes and 18 guides, but `/leitfaden/telc-b1/` never links the telc course (verified in the HTML), and `/pruefung/dtz/` has no paid offer. The site was in no top-10 result for the 5 buyer queries |
| 8 | Language for the buyer | 2 | The homepage, `/pricing/`, `/level-test/` and `/signup` are English only, and `/de/` returns 404. The buyers search in German ("telc B1 Vorbereitung online", "DTZ Vorbereitung") |
| 9 | Stickiness | 2 | Tickets never renew. Pro has nothing tied to an exam date. Yearly isn't the default |
| 10 | Technical / trust pages | 3 | Fast (0.2–0.6 s). `/agb/` and `/widerruf/` are 404, and the footer has no AGB/Widerruf link. Lemon Squeezy is the merchant of record, but German buyers look for these pages. The telc page says both "20-Tage-Plan" and "Vier Wochen" |
| | **Total** | **23/50** | |

---

## 2. What to sell, to whom, in what order

1. **Now: B1 exam readiness, sold as a waitlist, then as the telc pilot.**
   - The buyer is someone in Germany who needs B1 (telc, DTZ or Goethe) for residence,
     citizenship or a job, has a date, and searches in German.
   - The release gate in the million plan (operator, FernUSG/ZFU, terms, VAT-inclusive store,
     telc at €149 in Draft) still decides when the sale opens. Until then, every B1 surface
     collects **email + exam + exam date**.
2. **Second variant: Goethe B1.**
   - New evidence for the million plan's open disagreement (DTZ vs Goethe next): Goethe B1 is
     45 of 104 in-app exam choices. telc B1 + DTZ together are 18.
   - The plan's rule stands: whichever clears first after telc sells ≥5 of 10. But the waitlist
     should split by exam from day one, so that rule has data.
3. **Always on: Pro yearly as "the library behind the plan".** Make it the default and name it in
   euros a month.
4. **Start Deutsch 1 for visa families abroad.** Sell A1.1 free + the A1.2 ticket as "bereit für
   Start Deutsch 1". The content already ends in that exam's format. It counts as zero until it
   sells.

---

## 3. The changes, ranked by revenue per hour of work

**Who may do what:**
- `[agents]` means it can ship as a normal PR. It is copy, links or layout derived from
  `pricing.js`/`marketing.js`.
- `[owner]` touches money, terms, legal or brand messages (Team v5 reserved list).

| # | Change | Where | Why | Who |
|---|---|---|---|---|
| 1 | **B1/B2 waitlist with exam + date** replaces the dead "coming soon" and "startet in Kürze" states. The confirmation sets the mail basis: one notice when the sale opens, nothing else without consent | telc page, B1/B2 cards on `/` and `/pricing/`, `/pruefung/telc-b1/`, `/pruefung/goethe-b1/`, `/pruefung/dtz/` | Converts the 74 of 104 B-level visitors we have, and builds the buyer list move 4 needs | [agents] build; [owner] approves the new form/endpoint and the consent text |
| 2 | **Exam guides end in the matching offer**: waitlist now, the course once it's on sale, with Pro yearly as the second option | `/leitfaden/telc-b1/` and the other B1/DTZ guides | Guides are the pages that rank for exam intent. Today they end in "Kostenloses Konto erstellen" only | [agents] |
| 3 | **Fix the mobile hero overflow** at 360 px | `astro-site` homepage hero | Touches every mobile visitor. It is a correctness defect, so it's exempt from the polish freeze | [agents] |
| 4 | **Reverse the pricing anchor; yearly as default.** Drop "Pro alone for 3 months: €29.97". Show the yearly toggle first, with the per-month figure derived in `pricing.js` | `/pricing/`, homepage ticket section | The current line argues against the ticket. Yearly collects 8 months up front, and dunning is the known LTV leak (11 of 12 payers hit a failed payment) | [agents] copy; [owner] if anything about what Pro includes changes |
| 5 | **Two hero CTAs and one exam line**: hide "Continue learning →" for new visitors; add "Prüfung bald? telc B1 · Goethe B1 · DTZ →" to `/pruefung/` | homepage | Puts the paying segment one tap away | [agents] copy; [owner] approves the brand line |
| 6 | **One founder line everywhere** ("a doctor" or "a team of doctors", whichever is true) | `/`, `/ueber-uns/`, telc page and guide | An inconsistent claim costs trust on the trust axis | [owner] picks the true line; [agents] apply it |
| 7 | **AGB/Widerruf pages and footer links** (Lemon Squeezy MoR terms stated plainly) | new legal pages | German buyers check them before paying, and they are on the release gate anyway | [owner] + counsel; pages stay noindex drafts until review |
| 8 | **A money-back guarantee** on the telc package at launch | telc page, checkout | The ranking rival sells with "30 Tage Geld-zurück-Garantie". With 0 reviews, a guarantee is the cheapest proof | [owner]: money/terms decision |
| 9 | **German homepage and level test** (`/de/`) framed by Aufenthalt / Einbürgerung / Job | new Astro page | Buyers search in German. A bigger build: do it after 1–5 show waitlist pull | [agents] after owner approves the brand framing |
| 10 | **Trial ends in an offer**: day 5–7 in-app card for the placed level's ticket, B1 waitlist, or Pro yearly. No mail without basis | SPA dashboard | The trial currently runs out silently | [agents]; lifecycle mail only with a documented basis |

**Not recommended now:**
- **Selling the telc course "today" at €89** (the second evaluator's #1). It's blocked by the release
  gate, and the owner decision on record is €149.
- **Expanding `/vergleich/`.** The kill list says fix the false claims, then stop. Re-targeting it at
  exam shops is a later move.
- **New social packs:** 0 attributed signups so far.

---

## 4. Measures

**Starting point** (2026-10-26):
- B-level waitlist: 0
- Exam dates on profiles: 3
- Signups: 16 a week

**Week-4 targets:**
- **Waitlist:** ≥40 entries with an exam date, ≥10 of them telc B1 (the pilot's 10 places).
- **Guides:** ≥5% of guide visitors click the offer or waitlist block, measured by the
  `public/attribution.js` labels.
- **Kill rule:** under 15 waitlist entries after ≥300 B-level page views means the B1 surfaces
  don't convince. Change the offer copy once before blaming the price.

---

## 5. Live numbers used (2026-10-26)

| Measure | Value |
|---|---|
| Accounts | 1,748 total; 65 created in 30 days; 16 in 7 days |
| Exam choice, last 60 days | Goethe B1 45 · Goethe A1 11 · telc B2 11 · Goethe A2 10 · telc B1 10 · none 9 · DTZ 8 · unset 129 |
| First-touch source, last 60 days | untracked 165 · google 56 · bing 4 · chatgpt.com 3 · other 5 |
| Purchases (rows) | `course_alle` 09-08 · `course_a1` 09-03 · `course_a1_2` 10-14 |
| Subscriptions | active 5 · expired 7 · unpaid 2 · cancelled 1 |

---

## 6. Codex pass

*Pending: run with the official `codex@openai-codex` plugin once the Codex CLI is signed in.*
