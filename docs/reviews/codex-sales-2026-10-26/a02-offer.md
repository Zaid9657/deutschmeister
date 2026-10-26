## 1. Score: **2/5**

DeutschMeister has disciplined price data and understandable payment terms, but its offers compete with one another before establishing distinct value. Pro includes the exam tools; inexpensive level tickets include three months of Pro; the dedicated telc package remains unavailable. Its live description sells a checklist over that library, while the code contains a more substantial rehearsal programme. Raising €89 to €149 is commercially defensible as a test—not validated pricing. Today’s evidence is €11.09 MRR, zero sales in seven days and no telc programme progress. (`FACTS.md:13–21`.)

**Clean sheet: hybrid [owner]**—retain existing purchases and subscriptions, but make one exam-specific package the primary offer for exam candidates. Evolving the current comparison page takes hours but preserves its overlap; replacing the entire catalogue takes weeks and introduces entitlement risk. A focused exam offer can test a different commercial model within the existing platform.

Repository references below were checked against local `main`; live observations come from the supplied captures. Capture filenames refer to `capture/`. No files were changed.

## 2. Findings, most important first

### A. The catalogue sells access more clearly than it sells exam preparation

| Product | Price and entitlement | Live evidence |
|---|---|---|
| Free | A1.1 without an account; public grammar explanations across eight levels; one daily X-Ray analysis | `offers.js:202`; `site__pricing.md`: “A1.1 in full” |
| Account trial | Seven days; all levels; two speaking sessions and two writing evaluations **total**; ten X-Ray analyses daily; no automatic charge | `marketing.js:44–106`; `site__pricing.md`: “No card · no automatic charge” |
| Pro | €9.99/month or €79.99/year; all-level content, practice exams, 30 five-minute speaking sessions and 20 writing evaluations monthly; 50 daily X-Rays | [pricing.js:24](/home/user/deutschmeister/src/data/pricing.js:24), [marketing.js:50](/home/user/deutschmeister/src/data/marketing.js:50); captured Pro comparison |
| Buyable level tickets | A1.2 €40; A2.1 and A2.2 €50 each; permanent access to that level plus 90 days of Pro | [pricing.js:114](/home/user/deutschmeister/src/data/pricing.js:114); `site__pricing.md`: “Buy A1.2”, “Buy A2.1”, “Buy A2.2” |
| Future tickets | B1.1/B1.2 €60 each; B2.1/B2.2 €65 each; unavailable | `pricing.js:118–125`; capture: “Im Bau · coming soon” |
| telc B1 | €89 on main and live; permanent course area plus 90-day Pro window; unavailable through the captured page | `pricing.js:81`; `site__telc-b1-komplettvorbereitung.md`: “89,00 €”, “Der Kurs startet in Kürze” |
| Retired products | Four €49 band courses and €129 A1–B2 bundle; retained for existing entitlements, not current offers | [pricing.js:156](/home/user/deutschmeister/src/data/pricing.js:156) |

`pro_days` is an internal grant product, not another retail offer (`pricing.js:181–188`). The free A1.1 writing allowance is also separate from the trial’s two exam-writing evaluations (`marketing.js:75–95`).

**Why this costs sales:** the urgent buyer cannot purchase the dedicated exam package, although general access remains purchasable. “Available in code,” “advertised” and “successfully purchasable” are three different states. Checkout completion for the advertised products remains **unverified**.

### B. The premium has to justify itself against DeutschMeister’s own cheaper offers

The live FAQ says: “Pro ist die Bibliothek … Der Kurs ist der Plan darüber.” It explicitly includes the telc practice test and writing training within Pro (`site__telc-b1-komplettvorbereitung.md:112`).

Consequently:

- Three monthly Pro payments cost €29.97.
- A €40 ticket supplies the same 90-day Pro window, plus permanent beginner-level ownership.
- At €149, the telc package must justify **€119.03 above three months of Pro**, or €109 above that ticket.

Those are derived comparisons, not observed cannibalisation. The underlying access overlap is verified in [offers.js:104](/home/user/deutschmeister/src/data/offers.js:104).

I disagree with the existing evaluation’s assertion that the €29.97 anchor necessarily argues against buying a ticket (`sales-evaluation-2026-10-26.md:55`). Paying €10.03 more for permanent A1.2 access can be rational. The anchor exposes the real question: **what additional job does each purchase perform?**

Choice overload comes from overlapping decisions—free versus trial, ownership versus subscription, monthly versus yearly, level versus exam—not simply the number of cards. The opened desktop/mobile pricing screenshots show those comparisons preceding the unavailable telc offer (`capture/shots/pricing-desktop.png`, `pricing-mobile.png`).

### C. Competitors make €149 a premium self-study purchase

These are **advertised offers**, not independently verified teaching quality or outcomes.

| Competitor | Captured price and comparison |
|---|---|
| TestHelden | “Komplettpaket … 39 €”; XL €69; “30 Tage Geld-zurück-Garantie.” (`comp__testhelden-telc-b1.md:292,298,621`) |
| telc-trainer.de | “19,99€” and “Lebenslanger Zugang – kein Abo”; advertises simulations and AI writing feedback. (`comp__telc-trainer.md:15,143–145`) |
| TestGerman | “3 months €44.90”; advertises writing/speaking correction and exam practice. (`comp__testgerman.md:435–467`) |
| Deutsch-Vorbereitung | B1 telc “Dauer: 53 Tage”, “59.99 €.” (`comp__deutsch-vorbereitung-bo-kurse.md:47–55`) |
| DeutschAkademie | “ab 89 €”/six hours; “ab 149 €”/twelve hours; €249/24 hours: approximately **€14.83/€12.42/€10.38 per advertised hour**, with teacher/group feedback. (`comp__deutschakademie-telc-b1.md:22–86`) |
| Lingoda | Advertises regular group rates around €7.49–11.99/hour, 60-minute live classes and four-week billing. Promotions differ; the captured checkout links select English, so a matching German quote is **unverified**. (`comp__lingoda-pricing.md:47,117,135,143,157`) |
| Babbel | “107,88 €”, billed annually, displayed as €8.99/month; “Lifetime 299,99 €.” (`comp__babbel-prices.md:42–76`) |

DeutschMeister’s ticket estimates imply approximately €1.36–1.77 per self-study hour (`courseContents.js:26–28`). That is inexpensive, but self-study hours and teacher hours are different purchases.

More revealing: summing the telc programme’s item estimates produces **385 minutes—6.4 hours**. At €149 that is approximately **€23.22 per estimated practice hour**. These are planning estimates, not measured learner time (`telcB1Komplett.js:54–118,164–190,197–243`).

The package therefore needs to sell diagnosis, correction, revision and targeted rehearsal. “Four weeks” alone cannot substantiate its premium. Cost per passed exam is **unverified** for every comparison.

### D. €149 is a reasonable experiment; €199–249 is still a hypothesis

Main already contains three letters with revision, ten five-minute speaking rehearsals, targeted gap work and a second test form ([telcB1Komplett.js:8](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:8)). The live page instead describes grammar-first weeks. That mismatch hides the strongest available differentiation.

However, the tests are explicitly **short versions**, not full-length mock examinations ([telcB1.js:3](/home/user/deutschmeister/src/data/mockExams/telcB1.js:3)). The programme has no recorded telc users (`FACTS.md:21`). Neither €149 nor €249 has demonstrated willingness to pay.

Using the plan’s assumptions—19% VAT and 10% refunds:

| Gross price | Retained revenue | Less illustrative €20 AI + €40 acquisition |
|---|---:|---:|
| €89 | €67.31 | €7.31 |
| €149 | €112.69 | €52.69 |
| €199 | €150.50 | €90.50 |
| €249 | €188.32 | €128.32 |

The last column excludes payment fees, support and overhead; it is **not profit**. Assumptions come from `million-plan-2026-10.md:66,182,205`.

€149 needs 59.7% of €89’s conversion to preserve retained revenue per visitor. €249 needs 79.9% of €199’s, assuming equal refunds. That supports testing higher prices, not announcing that they work.

### E. Terms and claims need precision before stronger persuasion

The annual saving is arithmetically sound: approximately 33.27%, conservatively displayed as 33% (`pricing.js:64–71`). Annual payment becomes cheaper than monthly during the ninth month; it offers little economic advantage to someone preparing for an exam in four to eight weeks.

“Permanent” currently means the course area remains accessible; the Pro window expires. That distinction is reflected in [SubscriptionContext.jsx:247](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:247). **Permanent AI access is not included.**

Payment methods are deferred to checkout and vary by country/device (`faqContent.js:125–126`). Specific wallet, PayPal or instalment availability is **unverified**. Refund requests receive review; no voluntary refund guarantee is established by that wording (`faqContent.js:121–122`).

The historical owner runbook records VAT being added at checkout; today’s setting is **unverified** (`docs/owner-prompts.md:55–69`). Consumer prices must show the total price. [PAngV §3](https://www.gesetze-im-internet.de/pangv_2022/__3.html)

The live claim “Die meisten fallen nicht durch, weil ihnen Grammatik fehlt” lacks supplied supporting evidence. Availability, expected results and price advantages fall within misleading-claims rules; ambiguous access terms can also matter. These are review risks, not findings of illegality. [UWG §5](https://www.gesetze-im-internet.de/uwg_2004/__5.html), [§5a](https://www.gesetze-im-internet.de/uwg_2004/__5a.html)

## 3. Sub-scores

- **(a) Inventory/buyability: 3/5.** Canonical catalogue exists; telc remains off sale (`pricing.js:87–128`; captured “not on sale yet”).
- **(b) Choice clarity: 2/5.** Tickets and telc both bundle Pro; Pro contains exam tools (`offers.js:104–134`).
- **(c) Competitive pricing: 2/5.** €149 competes with €44.90 AI access and twelve teacher-led hours at €149.
- **(d) Premium-price case: 2/5.** Rehearsal mechanism exists; paying telc cohort does not (`FACTS.md:21`).
- **(e) Terms/payment architecture: 2/5.** Renewal distinction is clear; guarantee and payment-method certainty are weak (`faqContent.js:117–126`).
- **(f) Price/claim provenance: 2/5.** Strong canonical inputs; current VAT reconciliation and unsupported claims remain unresolved.

## 4. Recommendations ranked by expected revenue per hour

**Commercial estimates below are assumptions, not forecasts.** Common illustration: 300 qualified offer visitors and six purchases during 90 days. Effects overlap and must not be added. The release gate remains mandatory (`million-plan-2026-10.md:128–142`).

| Rank | Change and exact location | Expected effect / effort | Authority and measure |
|---|---|---|---|
| 1 | Synchronise €149, product name, tax treatment and checkout; then open the bounded pilot. `pricing.js:81`, Astro twin, Lemon Squeezy product 1329566, sale switch | Six sales unlock approximately **€676 retained revenue**; **4–6 commercial hours**, excluding unresolved legal/product work: €113–169/hour | **[owner]**. Paid purchase → refund → replay must pass. After ≥300 qualified views, fewer than three sales triggers one package revision, not an immediate discount. |
| 2 | Replace grammar-week merchandising with the existing rehearsal inventory and an inspectable correction/revision sample. `telc-b1-komplettvorbereitung.astro:59,62,112,133` | Illustrative two additional sales: **€225**; **6–10 hours**, €23–38/hour | **[owner]**, agents prepare. Measure retained revenue per qualified visitor and sample engagement; stop expanding assets if buyers still cannot explain the premium over Pro. |
| 3 | Correct offer disclosures using existing canonical facts, particularly five-minute speaking sessions. `offers.js:106,130`, `pricing.astro` comparison | Illustrative 0–0.5 saved purchase: **€0–56**; **2–3 hours** | **[agents]** correctness PR. Verify against `marketing.js:67`; no price, quota or entitlement changes. |
| 4 | Define the access promise, cancellation/refund terms and verified payment methods beside checkout. Consider a bounded satisfaction guarantee separately from statutory rights. Telc FAQ, legal terms, Lemon Squeezy | Illustrative 0–0.5 additional purchase: **€0–56**; **3–5 hours plus counsel** | **[owner]**. Retain only if refunds, fulfilment cost and complaints remain within approved limits. No pass guarantee. |
| 5 | Run €199 versus €249 only after the pilot, using the reconciled funnel | Current incremental revenue **unverified**; **4–8 hours** once eligible | **[owner]**. Follow the plan’s ≥30 sales or ≥1,500 visitors per arm; retain €249 only if retained revenue/visitor wins and refunds ≤10% (`plan:199–202`). |

The ideal first-90-day ladder is:

1. **Free representative exam task → existing account trial.** Demonstrate the paid mechanism.
2. **One €149 telc rehearsal pilot**, capped at ten buyers after the gate. Clearly separate twenty study days from the 90-day Pro window.
3. **Conditional €199/€249 price experiment**, not three simultaneous package tiers. Insufficient exposure means insufficient evidence.
4. Keep existing A1–A2 tickets and Pro available through their established routes.

**Do not reopen Pro optimisation.** Yearly pushes, a €29 entry product, wallet top-ups, human-review premium, €299 tests and new B1/B2 tickets remain outside this programme (`million-plan-2026-10.md:275–290`). The evidence does not justify spending scarce time there.

## 5. What remains unverified

- **Actual checkout totals, methods, discounts and retired-link closure:** owner checks German-address checkout, active variants and old share links; records screenshots and order evidence.
- **Retained willingness to pay:** measure qualified offer views through payment/refund reconciliation. Account counts and exam preferences are not purchase denominators.
- **AI costs and grading reliability:** reconcile provider invoices and complete the assessor check; recorded speaking cost of zero is missing measurement (`FACTS.md:19`).
- **Legal clearance:** obtain the product-specific determinations and approved terms required by the release gate.
- **Premium over Pro:** ask actual purchasers why they bought, track completion and retained revenue. Until then, “the plan is worth €119 extra” remains **unverified**.

