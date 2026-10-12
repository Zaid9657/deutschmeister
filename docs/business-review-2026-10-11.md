# DeutschMeister: business review — Claude ⇄ Codex, 2026-10-11

**Who wrote this.** Claude (Anthropic) and Codex (OpenAI, through the official `openai/codex-plugin-cc`
plugin, signed in to the owner's ChatGPT account). Both answered the same brief independently, then
cross-examined each other.
- Working files: `docs/business-review-2026-10-11/`
  - `brief-for-codex.md`
  - `claude-pass-1.md`
  - `codex-pass-1.md`
  - `codex-round-1.md`
- Every recommendation below is either **agreed** by both, or listed in §12 with both positions.
- **Codex fact-check:** Codex raised 11 must-fix and 5 should-fix points
  (`codex-round-2-factcheck.md`); all were applied. Its final check left one sentence, which was
  replaced with its own wording (`codex-signoff.md`).
- Framework: Alex Hormozi, *$100M Offers*: value equation, grand slam offer, pricing, guarantees,
  naming.

## Bottom line

- **€10,000 profit a month is reachable. It will not come from today's offer.** There has been no new
  paid subscription since 27 August, and real ticket/course sales are still zero. Renewals of the 3
  existing subscriptions are counted separately.
- **The move:** sell an exam outcome to the learners who already ask for it. That is a **B1 exam
  rehearsal package** ("B1-Prüfungsprobe", telc first) at **€199–249**, with a 14-day refund.
  - It replaces "own a level / rent the line" as the headline offer.
  - Pro and the tickets stay as secondary products.
- **The maths (fully loaded, adopted by both).** €10k profit needs about **161 sales a month at €199**
  or **109 at €249**. That means **~7,300–10,700 qualified visits a month** at 1.5% conversion.
  **Traffic is the biggest gap, not the only one:** it must grow alongside proven offer conversion,
  activation and fulfilment (0 of 181 trials converted; production checkout mappings are unverified).
- **This month:** a **10-buyer pilot at €149**, sold through partners and an in-app invitation, with no
  ad spend. Ten completed sales would show people pay. About €50 profit is possible only with **zero
  cash acquisition cost** (no partner commissions) and legal + build + founder + overhead costs ≤ €700;
  those budget ceilings are unverified.
- **Preconditions before the first paid pilot contract:**
  1. Lemon Squeezy charges exactly the price shown (VAT-inclusive).
  2. FernUSG is cleared. Either a product-specific legal assessment establishes that ZFU approval is
     unnecessary, or effective ZFU approval is obtained. An assessment that says approval is needed,
     or a pending application, does **not** authorise sale.
  3. Payment → entitlement is verified with one real test purchase. There is no guest checkout
     without account claiming.

## 1. Where the business stands (production data, 2026-10-11)

| Measure | Value |
|---|---|
| Paid orders, ever | 12 Pro Monthly first orders (03-10 → 08-27), about 2–3 a month. **None since 08-27.** |
| One-time ticket / course sales, ever | 0 real (2 €0 owner tests) |
| MRR | €32.97 from 3 payers. This sums `price_paid`. VAT-inclusive totals (€9.99 + €11.09 + €11.89) reconcile it, but the actual payer composition is unverified, and the column mixes bases (item price at creation, invoice total on renewal). |
| Signups per week | ~45 (Jun–early Sep) → **22, 31, 16, 10** in the last four weeks. 1,165 confirmed accounts. |
| Trial → paid | 0 of 181 in September |
| Signup → first lesson | ~10% |
| Goal named at signup | 41 of 70 named **B1** |
| Checkout | Store is **tax-exclusive**. A German buyer is charged €11.89 for the "€9.99" plan. |
| Social / owned channels | Instagram 0, Facebook 2, YouTube 7 followers. No Telegram channel. |

## 2. Why sales stopped (ranked; no single cause is proven)

1. **The replacement product could not be bought for most of September.** *Proven defects, now fixed.*
   - A signed-out Buy click never reached checkout (09-03 → 10-05).
   - Sub-level Buy intents were dropped (09-08 → 09-28).
   - A "Start 7-day trial" button opened a paid checkout (09-14 → 09-30).
2. **Most signups never reached value.** September cohort: 147 signups → 95 confirmed → 84 finished
   onboarding → **15 touched a lesson**.
3. **The offer misses the demand.** B1 dominates stated goals, yet the homepage sells "From Guten Tag
   to B2". B1 level tickets cannot be bought, and the B1 route offers Pro first and telc third.
   - Strong inference, not measured causation.
4. **The subscription lost its sales argument.** On 08-22 the money-back line, trust row, price cards
   and trial links were removed. Then on 09-03 Pro was demoted to "AI add-on".
   - Plausible contributor. The last two sales (08-26, 08-27) came *after* 08-22, so it is not proof.
5. **Acquisition contracted.** Homepage signups fell from ~2.1 to ~0.15 a day after the 10-04
   redesign removed the hero signup link (since restored).
6. **The checkout raises the price** (tax-exclusive). This defect has been constant, so it suppresses
   conversion throughout but does not explain the stop.

Caveat: 12 historical orders is a small base. "0 of 181 trials" still allows a true conversion rate up
to ~1.65%.

## 3. Value equation: the current offers

Value = (Dream outcome × Likelihood) ÷ (Time delay × Effort). Strategic judgement, 1–10. For the last
two columns **higher = worse**, because they are the denominator.

| Offer | Dream outcome | Likelihood | Delay | Effort | Weakest lever |
|---|---:|---:|---:|---:|---|
| Free A1.1 | 4 | 4–6 | 7 | 5–6 | Outcome: real for beginners, far from the dominant B1 goal |
| 7-day trial | 4–6 | 2–3 | 5 | 6–8 | Likelihood: opening everything is not a first result |
| Pro €9.99 | 4–6 | 3 | 5–7 | 6–8 | Effort: access and quotas, and the buyer chooses what to do; commodity vs Babbel |
| Level ticket €40–50 | 3–6 | 4 | 5–6 | 6–7 | Dream mismatch (A1.2/A2 vs B1); the plan day is ~60–65 min |
| telc B1 €89 | **7–9** | 3–4 | 4–6 | 5–6 | Likelihood: an exam name over a grammar-first library checklist with **no writing task and no telc mock in the schedule** (`src/data/programs/telcB1Komplett.js`) |

**The right outcome is already on the site, in the least visible and weakest-delivered product.** The
grand slam offer rebuilds it.

## 4. The offer: B1-Prüfungsprobe (agreed)

**Avatar.** An adult who already has roughly B1 German and has booked or chosen a B1 exam about 4–8
weeks out. It starts with **telc Deutsch B1**; Goethe B1 and DTZ follow as reviewed variants.
- Learners with a real language gap are routed to the level courses, not sold exam rehearsal.
- Starving-crowd test:
  - pain is high (a dated exam with consequences);
  - purchasing power must be *tested* at €149–249;
  - targeting is good (exam searches, teachers, communities).

**Dream outcome (as sold).** „Gehen Sie vorbereitet in die Prüfung: die Aufgaben geübt, Feedback auf
Schreiben und Sprechen, und Sie wissen, was noch fehlt."
- **Not** "bestehen Sie garantiert", "in 8 Wochen zu B1" or "echte Prüfer-Bewertung".

**Problems → solutions → what exists vs. what must be built**

| Problem | Solution | Exists | Build |
|---|---|---|---|
| "Is this my exam and level?" | Fit check: exam, date, level; show exclusions before purchase | telc sales page | chooser + exclusions |
| "Where am I weak?" | Short telc test + one writing sample → 3-priority practice card | `src/data/mockExams/telcB1.js` (Kurzversion), `evaluate-writing` | combined report |
| "What do I do today?" | 20 training units, **exam tasks first**, grammar only when a task exposes a gap | `telcB1Komplett.js`, `ExamDatePlan.jsx` | rewrite the route |
| "Nobody corrects my letter" | 3 telc writing tasks, each submitted, corrected, revised and corrected again (6 AI corrections) | 3 telc prompts in `_shared/writingTasks.mjs`, `/schreiben` | place them in the route |
| "I freeze when speaking" | 10 guided 5-minute AI rehearsals of the telc speaking tasks | speaking engine | exam-specific missions, direct links |
| "I miss days" | Restart route: next task + minimum version | — | small branch |
| "Did I improve?" | A second, *different* short test + before/after | 1 telc set only | **author and review a parallel set** (promise it only once ready) |
| "Exam day?" | Registration/document checklist, partner-practice prompts | telc guide facts | two downloads |

**Trimmed out:** founder calls, daily personal messages, community moderation, unlimited correction,
and a full B1 course rebuild.

**Price**
- Pilot: **€149 incl. VAT**, with a proposed cap of 10 buyers. Describe it as capacity-based scarcity
  only once the resources and feedback process are confirmed.
- Then test **€199 vs €249** with identical deliverables. Under the stated cost assumptions, and
  with equal acquisition cost per qualified visitor, €249 earns more per visitor if it keeps more than
  ~76.45% of €199's conversion.

**Guarantee stack** (both offered together). Wording proposed by Codex, adopted after
cross-examination. It is not live until implemented and the tests are updated.

1. **14-day suitability refund:**
   > **14 Tage prüfen, ob der Plan zu Ihnen passt.** Wenn Sie das Paket nicht behalten möchten,
   > schreiben Sie innerhalb von 14 Tagen nach Kauf an zaid@deutsch-meister.de und nennen Sie Ihre
   > Bestellnummer. Wir erstatten den vollständigen gezahlten Paketpreis über das ursprüngliche
   > Zahlungsmittel. Eine Begründung ist nicht erforderlich. Mit der Erstattung endet der
   > Paket-Zugang. Ihre gesetzlichen Rechte bleiben unberührt.
2. **One bounded practice extension:**
   > **Nach 20 Trainingseinheiten noch unsicher?** Wenn Sie das Paket behalten (keine Erstattung) und
   > alle 20 Einheiten, die drei Schreibaufgaben samt Überarbeitung (sechs KI-Korrekturen) und die
   > zehn Sprechübungen bearbeitet haben, können Sie innerhalb von sieben Tagen nach der letzten
   > Einheit per E-Mail an zaid@deutsch-meister.de (mit Bestellnummer) einmalig 30 zusätzliche Tage
   > Zugang zu den Paket-Inhalten beantragen — mit fünf weiteren KI-Sprechübungen à fünf Minuten und
   > zwei weiteren KI-Schreibkorrekturen. Die Verlängerung verspricht kein Bestehen der offiziellen
   > Prüfung. Ihre gesetzlichen Rechte bleiben unberührt.

Dropped by both: "money back if you fail", "free until you pass", "until your retake". These are
outcome-linked and unbounded.

**Urgency and scarcity (honest only).** The proposed pilot cap of ten buyers may be used as
capacity-based scarcity only after resources and the feedback process are confirmed. The learner's own exam date,
with "days left vs. units needed" shown. No countdowns, invented stock or fake strike-through prices
(PAngV §11).

**Bonuses** (each solves an objection; no invented "€ value"): „Prüfungstag ohne Sucherei" (checklist)
and „Paarprüfung üben" (printable partner prompts).

**Name (MAGIC):** „**Prüfungstermin gebucht? telc-B1-Prüfungsprobe — 20 Trainingseinheiten für
Berufstätige**". The family name is "B1-Prüfungsprobe", with an exam selector.

**Premium** (human review by a DaF assessor): **deferred**.
- Lemon Squeezy prohibits "services of any kind".
- Human review adds FernUSG exposure.

## 5. Price ladder (agreed)

| Step | Offer | Job |
|---|---|---|
| Free | A1.1 course (beginners); one free telc sample task with sample feedback (exam learners) | Let each audience feel the mechanism |
| Entry (later) | €29 telc gap check, credited to the core within 30 days | Qualify the unsure; never buy ads for it alone |
| **Core** | **B1-Prüfungsprobe €149 pilot → €199/€249** | The profit engine |
| Continuity | Pro €9.99 (VAT-inclusive once the store switches) | Practice after the exam; no longer the flagship |
| Library | Level tickets €40–50 | Secondary; describe the legacy plans honestly (only A1.1 is rebuilt) |

## 6. Friction: ranked (agreed order)

| # | Fix | Status |
|---|---|---|
| 1 | **Payment → entitlement.** An unroutable paid order alerts the owner and fails the webhook (Lemon Squeezy retries; it is logged as failed). Confirm every functions-scope variant id; do one real test purchase per product. | **Fixed in source in PR #202** (reviewed by Codex; deployment unverified). Variant-id check and test purchase still to do. |
| 2 | **Prices = checkout.** Turn the store VAT-inclusive, then audit the page, schema, email and checkout prices. | Owner prompt ready (`docs/owner-prompts.md`) |
| 3 | **AI quotas = copy.** "30 speaking sessions/month" vs the server's 2 × 5-minute sessions a day; 10/15-minute sessions hit an empty wallet. Pick one entitlement; meter the cost. | To do |
| 4 | **Guest payment with account claiming.** Today a Buy click needs signup + email confirmation in the same browser; guest telc buyers without an account are not delivered. | To do (L) |
| 5 | **B1 package above the fold** and first on the B1 route (telc guide, exam hub, fit chooser). | To do, with the offer |
| 6 | **First useful task before menus;** keep the return destination after confirmation. | Partly done (beginners go to Lektion 1) |
| 7 | **Matching offers at intent moments:** anonymous lock (price + buy), placement result, exam result, trial day 6. | To do, with the offer |
| 8 | **Record marketing consent** separately from email confirmation (opt-in at signup). | To do |
| 9 | Exam pages: signup lock instead of a login wall. Signup has 2 fields. Buyers keep their dashboard after 90 days. Two false trial-mail claims fixed. | **Fixed in source in PR #202** (deployment unverified until merge) |
| 10 | **Separate the money metrics:** gross billings, VAT-exclusive revenue, refunds, channel cost, AI cost. | To do |

## 7. Copy (proposed; publish only once the package exists)

**Homepage hero (DE)**
- H1: „telc B1 bald? Üben Sie die Aufgaben, die Sie dort erwarten."
- Sub: „Für Lernende etwa auf B1-Niveau: 20 Trainingseinheiten, drei Schreibaufgaben mit jeweils einer
  Überarbeitung (insgesamt sechs KI-Korrekturen) und zehn Sprechübungen. Beginnen Sie mit einem
  Lückencheck."
- CTA: „Eine Prüfungsaufgabe kostenlos ausprobieren"
- Link: „Prüfungsplan ansehen · 149 € inkl. MwSt. (Pilot)"
- Secondary: „Sie beginnen mit Deutsch? A1.1 kostenlos starten."

**Homepage hero (EN)**
- H1: "telc B1 coming up? Rehearse the tasks before exam day."
- Sub: "For learners already around B1: 20 training units, three writing tasks with one revision each
  (six AI corrections in total), and ten speaking rehearsals."
- CTA: "Try an exam task free"
- Link: "See the package · €149 incl. VAT (pilot)"

**Pricing card (DE)**
- „telc-B1-Prüfungsprobe — 149 € inkl. MwSt. · einmalig".
- Lines: 20 Trainingseinheiten · drei Schreibaufgaben mit Überarbeitung (sechs KI-Korrekturen) ·
  zehn Sprechübungen · Lückenplan aus Ihren Ergebnissen · 90 Tage Zugang.
- Small print: „Keine automatische Verlängerung oder weitere Abbuchung. Prüfung und Prüfungsgebühr
  nicht enthalten. KI-Feedback ersetzt keine offizielle Bewertung." Then the guarantee stack.

**Lock screen (DE)**
- „Hier beginnt Ihre telc-B1-Übung. Mit einem kostenlosen Konto probieren Sie die Kurzversion in
  Ihrer 7-tägigen Testphase (inkl. 2 KI-Sprechübungen und 2 KI-Schreibkorrekturen)."
- Button: „Kostenloses Konto erstellen und Übung starten"
- Link: „Sie möchten einen festen Prüfungsplan? 20 Trainingseinheiten ansehen — 149 € inkl. MwSt."

**Trial day-6 email** (only to recipients who chose telc B1; others get their own route)
- Subject: „Ihre Testphase endet morgen. Wie geht Ihre telc-B1-Vorbereitung weiter?"
- Opening: „Ihr Konto und Ihre Ergebnisse bleiben erhalten; es wird nichts automatisch abgebucht.
  Wenn Ihre telc-B1-Prüfung näher rückt …"

**Remove now (unsupported claims on today's pages):**
- telc sales page, „Die meisten fallen nicht durch, weil ihnen Grammatik fehlt …"
  (`astro-site/src/pages/telc-b1-komplettvorbereitung.astro:128`): there is no evidence for it.
- telc guide, „Für den Aufenthaltstitel und die Einbürgerung ist B1 die Mindestanforderung"
  (`astro-site/src/data/guides/telc-b1.js:42`): this is too broad for every residence route.

## 8. The €10k model (adopted by both; conditional, not a forecast)

**Assumptions**
- €199 incl. 19% VAT.
- Lemon Squeezy 6.5% of gross + €0.50, plus 1% payout fee.
- **10% refund reserve.**
- **€20 AI** across the whole entitlement (unmeasured; cap it).
- €4 support.
- **€40 all-in CAC.**
- €1,000/month overhead including founder time.

| Per sale | €199 | €249 |
|---|---:|---:|
| After VAT, transaction and payout fees | €152.25 | €190.63 |
| Refunds, AI, support | −€43.90 | −€48.90 |
| Acquisition | −€40.00 | −€40.00 |
| **Contribution** | **€68.35** | **€101.73** |
| **Sales/month for €10k + €1k overhead** | **161** | **109** |
| Qualified visits at 1.5% | 10,734 | 7,267 |

| Month | Scenario | Operating profit |
|---|---|---:|
| 1 (standard) | 10 pilots × €149 + 2 core × €199; €40 CAC; €1,000 overhead + €1,500 setup | ≈ −€2,014 |
| 1 (constrained alternative) | 10 pilots × €149; **zero cash CAC** (no commissions); legal/build/founder/overhead ≤ €700 (unverified ceilings) | ≈ €50 |
| 3 | 50 core sales at €199 | ≈ €2,400 |
| 6 | 165 core sales at €199 (11,000 qualified visits) | ≈ €10,300 |

**Levers, in order of size**
1. **Price.** €249 needs a third fewer buyers.
2. **Qualified traffic:**
   - teacher and prep-provider partners at a €25 referral;
   - the offer placed on the exam guides and hubs;
   - a Telegram broadcast channel;
   - a €300 search test once delivery works.
3. **CAC discipline.** At 1.5% conversion, €40 CAC means ≤ €0.60 per click.

**Excluded from the base:** list launches, entry product, premium, B2B. None contributes validated
revenue to the base model. Marketing eligibility, payment acceptance and product legality must be
verified where they apply.

## 9. Legal preconditions (agreed; landmines with their fixes)

| Landmine | Fix |
|---|---|
| **PAngV.** Shown prices exclude VAT today. | Turn on LS "Tax-inclusive pricing" (Settings → General). Then every shown price is the total. Do not just append "inkl. MwSt." to the current flow. |
| **§7 UWG.** Marketing eligibility for the 1,165 confirmed accounts has not been established. Confirmation and opt-out handling are not consent. | In-app invitation (no consent needed). Opt-in checkbox at signup from now on. Email only to documented opt-ins. |
| **FernUSG.** Paid remote instruction with a contractual right to learning-success checks needs ZFU approval, or contracts are void, fees can be reclaimed and fines reach €10,000. The ZFU FAQ lists *automated correction through a learning system*, and even MC tests, as possible checks; a contractual right is enough (zfu.de/veranstaltende/faq). BGH 12.06.2025, III ZR 109/24. | **Book a written, product-specific check by a FernUSG lawyer now** (scope it to also cover today's Pro/ticket products). It runs in parallel with the ~2-week pilot build. **Sell only once the assessment establishes approval is unnecessary, or once effective ZFU approval exists.** An application alone does not authorise sale. Approval, if obtained, is also a trust signal on the page. |
| **Lemon Squeezy prohibited products.** "Services of any kind." | The core stays software and digital content. Human review is sold only after a compliant payment setup. |
| **Guarantees.** | Publish bounded terms; statutory rights stay; replace the blanket test bans (`tests/offers.test.mjs`, `tests/refund-claims.test.mjs`) with checks for the adopted wording. Don't delete them. |

## 10. The next 30 days: who does what

**Week 1**
1. **[You]** Lemon Squeezy → Settings → General → turn on **Tax-inclusive pricing** (prompt in
   `docs/owner-prompts.md`).
2. **[You]** Book the FernUSG check (fixed fee). Claude drafts the product description for the
   lawyer.
3. **[You]** Say "go" on the pilot (decision 1 below).
4. **[Claude]** Merge PR #202 once you're OK with it.
5. **[Claude]** Build the pilot:
   - fit check;
   - the revised 20-unit telc route (writing + speaking first);
   - gap report;
   - guarantee mechanics;
   - landing page;
   - offer CTAs on the telc guide and hub;
   - in-app banner.

**Week 2**
1. **[You]** Create the €149 product via the owner prompt. **[Claude]** wires the ids, sets
   `LEMONSQUEEZY_PRO_VARIANT_IDS`, and runs the test purchase with you.
2. **[You]** Create a Telegram broadcast channel „B1-Prüfung üben".
3. **[Claude]** Writes the daily task posts and the partner page.

**Weeks 3–4**
- **[You]** About 10 teacher/partner conversations a week, using a message and sample feedback
  Claude prepares.
- **[Claude]** Measures the pilot: starts, completed writing/speaking cycles, refunds, AI cost per
  buyer.
- **[Both]** Decide on €199 vs €249 and the Goethe/DTZ variants.

## 11. Owner decisions (asked one at a time, in this order)

1. **Go on the telc B1 pilot** (proposed cap 10 × €149, VAT-inclusive)? This unlocks the build: ≈ €1.5k
   gross if all 10 sell, and the willingness-to-pay proof the €10k plan needs.
2. **Turn the store VAT-inclusive?** This fixes PAngV and the checkout surprise; net per German sale
   drops ~16%.
3. **The guarantee stack** as worded in §4? This lifts the test bans for this product only.
4. **Book the FernUSG check?** A scoped legal assessment informs the classification. It does not
   guarantee legality or remove liability, but it decides whether the pilot can be sold or needs ZFU
   approval first.
5. **Telegram channel** — create it now?
6. **Opt-in checkbox at signup** for product emails? It makes future launches lawful.

## 12. Where Claude and Codex still differ (and what settles it)

| Topic | Claude | Codex | Settled by |
|---|---|---|---|
| How high to price | Hormozi: higher price buys the traffic problem down; test €299 after €249 | €199 control until conversion and refunds are measured | Paid conversion, refunds and contribution per qualified visit at each price |
| Pace of variants | Open Goethe/DTZ as soon as the telc pilot converts | Only after each variant's writing bank and speaking tasks are reviewed (Goethe B1 and DTZ have `hasWriting: false`) | Variant delivery review + demand by exam |
| B2B (care recruiters, schools) | A possible accelerator | Discovery only; no projected deals | Paid institutional pilot |

Conceded by Claude in cross-examination:
- the narrower ~B1 avatar;
- the fully loaded cost model;
- payment verification as fix #1;
- deferring premium and installments;
- no "three-mock pack" (there is one short test per exam);
- no traffic multipliers;
- the FernUSG check *before* the pilot.

Conceded by Codex:
- one product family with an exam selector (not telc-only);
- the stacked guarantee;
- the €199 vs €249 test;
- a Telegram broadcast channel;
- the MRR reconciliation (gross of VAT).

---
Sources:
- [Lemon Squeezy — Sales Tax & VAT](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)
- [Lemon Squeezy — Fees](https://docs.lemonsqueezy.com/help/getting-started/fees)
- [Lemon Squeezy — Prohibited products](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products)
- [ZFU — FAQ for providers](https://zfu.de/veranstaltende/faq)
- [FernUSG](https://www.gesetze-im-internet.de/fernusg/BJNR025250976.html)
- [IHK on BGH III ZR 109/24](https://www.ihk.de/karlsruhe/fachthemen/recht/vertragsrecht/coaching-6677500)
- [PAngV](https://www.gesetze-im-internet.de/pangv_2022/BJNR492110021.html)
- [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html)
- [StAG §10](https://www.gesetze-im-internet.de/stag/__10.html)
- [WBS telc B1 course (€297.50)](https://www.wbstraining.de/kurse/sprachkurs/vorbereitungskurs-telc-pruefung-b1/)
- [telc B1](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/)
- [Lingoda Sprint](https://www.lingoda.com/en/sprint/)
