## 1. Bottom line

€10,000 monthly operating profit is possible; the current business has not demonstrated a repeatable sales engine.  
At €199 including VAT, the model below requires about **122 sales/month**, €40 acquisition cost, and controlled delivery costs.  
The strongest opportunity is exam preparation for learners already near B1—not selling beginners a longer ladder.  
**The one move: sell ten paid pilots of a specific telc B1 rehearsal package, then distribute the validated offer through teachers and exam-intent traffic.**  
Do not scale the current €89 checklist unchanged: its schedule omits explicit writing practice and a telc mock. (`src/data/programs/telcB1Komplett.js:45`, `src/data/programs/telcB1Komplett.js:114`)

## 2. Why sales stopped

Production numbers below come from the supplied brief. Citations substantiate repository behavior, not production deployment. **There is evidence of several leaks; there is no controlled evidence identifying one cause of the August sales stop.**

| Rank | Cause | Evidence and confidence | Money implication |
|---|---|---|---|
| 1 | **The replacement product had a broken purchase path.** | The September sub-level keys were rejected by the old intent pattern; current comments record the September 8–28 failure. Purchase-route comments record onboarding intercepting checkout resumption. These are concrete defects, now corrected in source. (`src/lib/buyIntent.js:13`, `src/App.jsx:165`) | Strong explanation for September’s zero ticket sales. Cannot explain the initial August 28–31 gap. |
| 2 | **Most signups never experienced enough value to buy.** | Measured: September had 147 signups, 95 confirmations, 84 onboarding completions, but only 15 lesson users. Current first-run logic acknowledges the previous placement-test/menu detour and now routes beginners into Lektion 1. (`src/lib/firstRun.js:6`, `src/lib/firstRun.js:94`) | Improving offer-page conversion is insufficient if the trial’s useful experience rarely starts. |
| 3 | **The commercial emphasis misses the stated demand.** | Measured: 41/70 named goals were B1. The live hero emphasizes “From Guten Tag to B2,” while B1/B2 tickets are unavailable. The B1 chooser’s first commercial link is Pro; the telc package is third. (`astro-site/src/data/homepage.js:21`, `src/data/pricing.js:125`, `src/data/offers.js:183`) | High-intent exam learners encounter an unavailable course ladder or a generic subscription. This is a strong strategic inference, not measured causal attribution. |
| 4 | **The subscription’s sales argument weakened while its replacement remained unproven.** | The brief dates removal of purchase-oriented elements to August 22. Today’s pricing headline is “Own a level, or rent the whole line”; its leading paid card sells a sub-level, while Pro says “Compare Pro.” (`astro-site/src/pages/pricing.astro:190`, `astro-site/src/pages/pricing.astro:207`) | Plausible contributor to the subscription stop. Restore concrete reasons to buy, cancellation clarity, and a direct CTA—not invented popularity or learner counts. |
| 5 | **Acquisition subsequently contracted.** | Measured signups fell to ten in the latest week. Homepage signup counts fell from 22/10.6 days to 1/6.9 days: approximately **2.08/day → 0.145/day, down 93%**. The hero account link is restored in source. (`astro-site/src/pages/index.astro:104`) | October removed more prospective buyers from an already weak funnel. It cannot retrospectively explain August’s stop. |
| 6 | **The price changes at checkout.** | The brief establishes tax-exclusive orders. Source calls €9.99 a “Gross price” and renders raw catalogue prices. (`src/data/pricing.js:23`, `astro-site/src/pages/pricing.astro:218`) | A German buyer discovering €11.89 after seeing €9.99 has a reason to abandon. This is a current defect, but no evidence says it began in August. |
| 7 | **The higher-priced exam offer has weak differentiation and proof.** | The €89 product sells sequencing over existing content. Its progress is checkbox completion; its final activity is a general placement test. (`src/data/programs/telcB1Komplett.js:1`, `src/pages/TelcB1KursPage.jsx:44`, `src/data/programs/telcB1Komplett.js:150`) | Charging more requires a better delivered experience and demonstrated buyer value, not more emphatic copy. |

Two qualifications matter:

- Twelve historical first orders are a very small baseline. “Last sale followed redesign” is not proof that design caused the stop.
- Zero conversions from 181 trials is serious, but the approximate 95% upper bound is still about **1.65%**. It establishes failure to demonstrate conversion, not impossibility.

## 3. Value-equation scorecard

These are strategic judgments, not measured learner outcomes. **Dream outcome and likelihood: higher is better. Delay and effort: higher is worse**, because they are the denominator.

| Current offer | Dream outcome ↑ | Perceived likelihood ↑ | Perceived delay ↓ | Perceived effort ↓ | Weakest lever |
|---|---:|---:|---:|---:|---|
| Free A1.1 | 4 | 4 | 7 | 6 | Outcome relevance: useful for beginners, distant from the dominant B1 goal. |
| Seven-day trial | 6 | 2 | 5 | 8 | Likelihood: opening everything does not establish a useful first result. |
| Pro | 6 | 3 | 7 | 8 | Effort: the buyer receives access and quotas, then chooses what to do. |
| Level ticket | 6 | 4 | 6 | 6 | Likelihood: ownership and a sequence do not establish successful progression. |
| telc B1 €89 | 9 | 3 | 4 | 6 | Likelihood: an exam-specific name sits over a mostly library-based checklist. |

Source basis: A1.1 is the sole live rebuilt curriculum; other registered courses retain legacy programs. Trials have smaller AI allowances than Pro. Tickets stack ownership with 90 days of Pro. The telc schedule contains twenty study days. (`src/data/curricula/index.js:16`, `src/data/courses/index.js:17`, `src/data/marketing.js:44`, `src/data/marketing.js:53`, `src/data/offers.js:92`, `src/data/programs/telcB1Komplett.js:34`)

The existing ticket layer already identifies obstacles—“guessing what to study next,” correction, renewal, and saved progress. Keep that specificity. The missing commercial evidence is whether learners use the solutions and consider them worth paying for. (`src/data/offers.js:87`)

## 4. Grand slam offer(s)

**One offer, with a later premium delivery option. Do not launch two unrelated businesses.**

**Avatar and starving-crowd check**

Adults in Germany who already have roughly B1 German, have chosen **telc Deutsch B1**, and expect to sit it in approximately four to eight weeks. They need rehearsal and correction, not an A1-to-B1 promise.

| Market test | Assessment |
|---|---|
| Pain | High: a booked examination creates a real deadline and consequences. |
| Purchasing power | Mixed. Test willingness to pay €149–199; do not infer it from B1 signup interest. |
| Targetability | Good hypothesis: independent DaF teachers, examination-related searches, and relevant learner communities. Channel economics remain unverified. |
| Growth | Not established. A large recurring examination market can suffice; do not claim it is growing without data. |
| Existing demand signal | B1 dominates the supplied goal sample, but that sample does **not** establish telc rather than Goethe or DTZ demand. |

A useful price reference is WBS’s **€297.50 including VAT** for twenty live online teaching units. It demonstrates paid preparation offers exist; it does not validate DeutschMeister’s price or make self-service AI equivalent to teaching. [WBS course](https://www.wbstraining.de/kurse/sprachkurs/vorbereitungskurs-telc-pruefung-b1/)

Also, telc supplies a free official practice test. **A paid package must sell guided practice, feedback, and follow-through beyond access to a test.** [Official telc B1 page](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/)

**Dream outcome**

“Arrive having rehearsed the examination tasks, received feedback on your writing and speaking, and identified what still needs practice.”

That is credible delivery positioning. “Pass B1 in twenty days” is neither supported nor appropriate for beginners.

**Problem → solution → delivery**

| Before, during, or after | Problem | Concrete solution | Delivery and repository basis |
|---|---|---|---|
| Before | “Is this my examination and level?” | Fit check: exam type, date, current ability; show exclusions before purchase. | Build a short chooser on the existing telc sales page. Current exclusion merely says below A2 is too early. (`astro-site/src/pages/telc-b1-komplettvorbereitung.astro:68`) |
| Before | “Where am I weak?” | Initial short assessment plus a writing sample; generate a three-priority practice card. | Reuse the short telc set and writing evaluator; **build** the combined report. (`src/data/mockExams/telcB1.js:25`, `netlify/functions/evaluate-writing.mjs:6`) |
| During | “What exactly do I do today?” | Twenty training units, starting with exam tasks; grammar appears when a task exposes a gap. | **Rewrite** the existing plan rather than rebuild full B1 courses. (`src/data/programs/telcB1Komplett.js:37`) |
| During | “Nobody corrects my letter.” | Six exam-style writing submissions, feedback, and revisions. | Existing `/schreiben` and server grading; **build** their explicit place in the plan. (`astro-site/src/data/exams/index.js:135`, `netlify/functions/evaluate-writing.mjs:18`) |
| During | “I freeze when speaking.” | Ten guided five-minute AI rehearsals, covering the relevant speaking tasks, with repeat attempts. | Reuse speaking infrastructure; **build and review** exam-specific missions and direct links. Existing plan links to the generic speaking page. (`netlify/functions/speaking-session.mjs:160`, `src/data/programs/telcB1Komplett.js:82`) |
| During | “I miss several days.” | A restart route: resume the next task, with a minimum-practice version. | **Build** a simple recovery branch in the plan; no live accountability group. |
| After | “Did I improve, or memorize the questions?” | A second, different short test and a before/after report. | **Build** an independently reviewed parallel telc set; one telc set is currently registered. (`src/data/mockExams/index.js:17`) |
| After | “What happens on examination day?” | Registration/document checklist and a printable partner-practice card. | Reuse checked guide facts; **build** concise downloads. (`astro-site/src/data/guides/telc-b1.js:22`) |

The official examination involves direct exchange between participants. AI rehearsal should be described as preparation for that exchange, not a complete substitute for pair practice. [telc examination structure](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/)

**Trim and stack**

No founder calls, daily personal messages, community moderation, full B1 curriculum rebuild, or unlimited correction.

The values below are **internal willingness-to-pay hypotheses**, not invented standalone selling prices to print as “€498 value.”

| Included item | Hypothesized perceived value | Estimated marginal delivery cost |
|---|---:|---:|
| Initial gap report | €49 | €1 AI |
| Twenty-unit exam practice route | €69 | Approximately €0 once authored |
| Six writing-feedback cycles | €59 | €2 AI |
| Ten speaking rehearsals | €99 | €4 AI |
| Different final short test and comparison | €49 | €1 AI |
| Ninety-day existing tool/library access | €30 | Additional usage must fit the total AI budget |
| Restart route | €19 | Approximately €0 |
| Examination-day checklist | €19 | Approximately €0 |
| Partner-practice cards | €19 | Approximately €0 |
| Technical support | Buyer expects it | €4 average allowance |

**The €8 AI allowance is unverified and must cover the entire ninety-day entitlement**, not just the scheduled exercises. Existing course purchases grant ninety days, while speaking permits two included five-minute subscriber sessions daily. This could cost materially more. (`src/data/pricing.js:82`, `netlify/functions/speaking-session.mjs:24`)

**Price and name**

- First ten paid pilot buyers: **€149 including VAT**, honestly described as a pilot with feedback requested.
- Validated core package: **€199 including VAT**, one payment.
- MAGIC name: **„Prüfungstermin gebucht? telc-B1-Prüfungsprobe – der 20-Trainingstage-Plan für Berufstätige“**.

The price buys a defined rehearsal process. It must earn its premium over the existing €89 sequencing product through the report, scheduled correction, exam-specific missions, and a different final assessment.

**Guarantee, urgency, bonuses**

Use the fourteen-day suitability refund in §6. The genuine urgency is the learner’s examination date: show whether enough study days remain. Do not manufacture a digital stock limit.

A ten-buyer pilot limit is defensible only if ten is the actual feedback capacity and sales close after ten. This crosses the current scarcity restriction and requires a deliberate policy/test change. (`tests/offers.test.mjs:100`)

The two bonuses solve practical objections:

- **„Prüfungstag ohne Sucherei“**: document and examination-day checklist.
- **„Paarprüfung üben“**: printable prompts for practice with another learner.

**Optional premium: €349 including VAT**

Same package plus two human writing reviews and one recorded-speaking review by an outsourced DaF assessor. Budget **€60 additional delivery cost per buyer** and a fixed submission deadline.

This crosses a payment-stack constraint: Lemon Squeezy prohibits services. Do not hide human review inside a purported digital bonus. It needs an accepted payment arrangement before sale. [Lemon Squeezy prohibited products](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products)

There is also an unresolved legal classification issue: paid remote instruction with monitored learning can fall under FernUSG and require approval. Obtain a specific assessment of the actual delivery, including the AI product; a refund promise does not resolve that classification. [FernUSG §1](https://www.gesetze-im-internet.de/fernusg/__1.html), [FernUSG §12](https://www.gesetze-im-internet.edge.juris.de/fernusg/__12.html)

**Distribution and validation**

This week, make the fit check, revised route, sample feedback report, and working paid checkout reviewable. Sell the pilot only against deliverables actually ready; the parallel test needs a dated delivery commitment if unfinished.

Then:

1. Approach **ten relevant teachers or preparation providers per week** with a worked example and tracked referral page. Target three active partners initially.
2. Give each partner a concrete landing page: telc examination fit → sample corrected letter → package → checkout. Set an initial **€25 referral reward**, keeping total acquisition cost—including affiliate fees—below €40.
3. Put the package CTA immediately after the examination answer on the telc guide and at the top of its exam hub. Those surfaces already exist. (`astro-site/src/data/guides/telc-b1.js:22`, `astro-site/src/data/exams/index.js:60`)
4. After paid pilot delivery works, test **€300 of tightly targeted search traffic**. At 1.5% purchase conversion, €0.60 per qualified visit produces €40 CAC. Those are thresholds to test, not market prices I verified.
5. Before expansion, require ten real buyers, at least eight starting a unit, six completing a writing/speaking cycle, zero undelivered purchases, and recorded delivery costs. These are operating targets, not statistically conclusive proof.

## 5. Price ladder

All proposed consumer prices include VAT.

| Step | Offer | Commercial job |
|---|---|---|
| Free | A1.1 for beginners; a short telc sample task and sample feedback for exam learners | Let each audience experience the relevant mechanism. |
| Entry | **€29 telc Fehlercheck**: short assessment, one writing-feedback sample, prioritized practice card | Qualify uncertain buyers. Credit €29 toward the core within thirty days; disclose the resulting balance. |
| Core | **€199 Prüfungsprobe**, following the €149 paid pilot | Main profit engine. |
| Premium | **€349 with outsourced assessment**, only after payment and legal questions are resolved | Sell additional confidence through bounded human review. |

Do not buy €40-CAC traffic to sell the €29 product by itself. Its purpose is qualification and upgrade.

**Pro:** retain it as optional continuing practice, not the homepage’s flagship outcome offer. Existing Pro already includes all eight content levels, exams, and AI allowances; simply calling it an add-on does not create differentiation. (`src/data/offers.js:124`) Keep the advertised €9.99 only if it becomes the actual VAT-inclusive checkout total, and account for the lower German net receipt. Do not assume existing subscriptions can be changed without checking their dashboard configuration.

**€40–50 tickets:** keep them as secondary library-and-plan purchases for learners who explicitly want those levels. They are not the route to €10,000 profit. Today’s catalogue prices and ninety-day inclusion are explicit. (`src/data/pricing.js:114`, `src/data/pricing.js:139`)

Explain the delivery distinction: the new nine-stage rebuilt course is A1.1; A1.2/A2 use the older registered programs. Do not imply identical course experiences. (`src/data/curricula/index.js:16`, `src/data/courses/index.js:17`)

At A1.1 completion, replace the internal “paused draft” explanation with customer language: **“Weiter mit A1.2: Lernplan und Übungen ansehen”**, then describe the available format and price. The current completion page sends users to the course library. This matters later; with zero recent first-lesson completions, it is not this week’s largest leak. (`src/pages/CourseCompletePage.jsx:114`)

## 6. Guarantees

These are proposed terms, **not current promises**. The current FAQ offers review of refund requests, and tests prohibit refund guarantees. Adopting any option requires owner policy adoption and corresponding claim/test changes. (`src/data/faqContent.js:102`, `tests/refund-claims.test.mjs:9`)

**Option 1 — fourteen-day suitability refund; recommended for the core**

> **14 Tage prüfen, ob der Plan zu Ihnen passt.** Wenn Sie das Paket nicht behalten möchten, schreiben Sie innerhalb von 14 Tagen nach Kauf an zaid@deutsch-meister.de und nennen Sie Ihre Bestellnummer. Wir erstatten den vollständigen gezahlten Paketpreis über das ursprüngliche Zahlungsmittel. Eine Begründung ist nicht erforderlich. Mit der Erstattung endet der Paket-Zugang. Ihre gesetzlichen Rechte bleiben unberührt.

Conditions: core digital package; no completion hurdle; publish the guarantee provider and full terms beside checkout. Model a refund reserve and honor the promise consistently.

Legal risk: do not describe a voluntary guarantee as replacing statutory withdrawal or defect rights. Digital-content withdrawal has specific consent and confirmation requirements; verify the actual checkout. [BGB §356](https://www.gesetze-im-internet.de/bgb/__356.html)

**Option 2 — bounded extra-practice guarantee**

> **Nach 20 Trainingseinheiten noch unsicher?** Wenn Sie alle 20 Einheiten sowie die sechs Schreibaufgaben und zehn Sprechübungen bearbeitet haben, können Sie innerhalb von sieben Tagen nach der letzten Einheit einmalig 30 zusätzliche Tage Paket-Zugang beantragen. Dazu erhalten Sie fünf weitere KI-Sprechübungen à fünf Minuten und zwei weitere KI-Schreibkorrekturen kostenlos. Schreiben Sie dafür an zaid@deutsch-meister.de mit Ihrer Bestellnummer. Die Verlängerung verspricht kein Bestehen der offiziellen Prüfung. Ihre gesetzlichen Rechte bleiben unberührt.

Conditions: disclosed activity requirements, reliable activity records, one extension, precisely bounded additional allowance. **Must be implemented before publication.** Existing course checkboxes alone cannot substantiate submitted speaking/writing activity. (`src/pages/TelcB1KursPage.jsx:44`)

Legal risk: avoid “we help until you pass” when the delivery is a finite tool allowance. Budget the extra usage. No official pass-rate or certification implication.

**Option 3 — premium feedback deadline**

> **Ihre persönliche Rückmeldung innerhalb von drei Werktagen.** Für vollständig eingereichte Aufgaben erhalten Sie die vereinbarte persönliche Rückmeldung innerhalb von drei Werktagen, Montag bis Freitag, ausgenommen gesetzliche Feiertage am Sitz des Anbieters. Versäumen wir diese Frist, erstatten wir Ihnen auf Anfrage den im Kauf ausgewiesenen Aufpreis von 150 € für die persönliche Rückmeldung. Das digitale Basispaket bleibt verfügbar. Ihre gesetzlichen Rechte bleiben unberührt.

Conditions: assessor contracted, eligible submissions defined, €150 service component separately disclosed, clock begins at complete submission.

Legal risk: requires the premium’s payment and FernUSG questions to be resolved. The SLA guarantees delivery timing, not examination performance.

## 7. Friction: top 10

Targets below are proposed acceptance criteria. They are not forecasts and should not be added together.

| Rank | Friction and source | Concrete fix | Target | Effort |
|---|---|---|---|---|
| 1 | **Payment does not establish delivery.** Committed webhook alerts but returns normally for an unmapped paid product; the working file now throws. (`netlify/functions/lemonsqueezy-webhook.mjs:357`, committed `0624499`; working file `:390`) | Confirm every functions-scope numeric variant ID against its checkout product. Retain failure logging/retries; add durable reconciliation for unmatched paid orders. Verify one genuine paid fulfillment per sellable product. | **100%** of paid orders attached to the right entitlement; zero unresolved paid orders. | S for mapping; M for reconciliation |
| 2 | **Buying a ticket requires signup and confirmation first.** Static Buy sends anonymous users to signup; `/subscription` is verification-gated. (`astro-site/src/components/CourseCheckout.astro:34`, `src/App.jsx:174`) | Offer guest payment with durable post-payment claiming. Store the order pending account creation; do not depend on one browser’s localStorage. | Test ≥50% checkout-open→paid conversion on qualified traffic; measure the full denominator. | L |
| 3 | **Displayed prices exclude tax in production.** Source declares gross prices while rendering catalogue figures. (`src/data/pricing.js:23`, `astro-site/src/pages/pricing.astro:218`) | Owner sets LS tax-inclusive pricing; reconcile visible prices, schema, email prices, and checkout totals. A footnote saying “plus VAT” is insufficient. | Every German checkout equals the displayed total. | S + dashboard action |
| 4 | **B1 intent reaches a beginner ladder or generic Pro.** (`astro-site/src/data/homepage.js:21`, `src/data/offers.js:188`) | Add an above-fold examination door; make the specific telc package the first matching paid recommendation. Preserve the beginner route. | ≥10% exam-door click rate among relevant visitors; ultimately test 1.5% offer-page purchases. | M |
| 5 | **The telc package’s schedule does not deliver the implied rehearsal.** It begins with grammar and ends at the level test. (`src/data/programs/telcB1Komplett.js:46`, `src/data/programs/telcB1Komplett.js:150`) | Start with diagnosis; schedule writing, specific speaking tasks, and initial/final short tests. Link directly to the intended task. | ≥80% buyer day-one start; ≥60% complete a feedback cycle. | M; new test/content review L |
| 6 | **Account creation still leads through account/onboarding decisions.** Default post-auth destination is dashboard; its route includes onboarding. Beginners now have a direct first-run action. (`src/lib/buyIntent.js:33`, `src/App.jsx:320`, `src/lib/firstRun.js:98`) | Preserve the exact sample/task destination after confirmation. Make goal/date questions skippable until after a useful answer. Diagnose lesson-stage abandonment before shortening lessons. | Signup→first learning activity **10%→25%**; examine cohort and anonymous activity separately. | M |
| 7 | **The anonymous SPA lock has no paid offer.** It shows signup, login, and free A1.1. (`src/components/LockedContentOverlay.jsx:59`) | For available A1.2/A2 products, show the relevant total price and buy action. For B1 exam intent, show the telc package; never offer an unavailable B1 ticket. | ≥5% qualified lock→checkout click rate. | M |
| 8 | **Placement does not merchandise the placed learner’s next purchase.** A1.1 is still a recommendation even above A1; other cards send users into practice. (`src/components/LevelTest/LevelTestResults.jsx:153`, `src/components/LevelTest/LevelTestResults.jsx:428`) | Insert one recommendation matching level **and examination type**, with total price, sample, and purchase action. Placement alone is not telc qualification. | ≥10% recommendation clicks; attribute resulting purchases. | M |
| 9 | **Speaking copy and actual allowance disagree; longer sessions reach an unfundable wallet.** (`src/data/marketing.js:53`, `netlify/functions/speaking-session.mjs:218`, `src/pages/SpeakingPage.jsx:678`) | Choose one entitlement and enforce it everywhere. Fastest route: accurately describe two included five-minute subscriber sessions/day and suppress unaffordable durations until top-ups exist. Meter provider cost. | ≥95% of entitled start attempts succeed; measured AI cost/order. | M |
| 10 | **Lifecycle pitches ignore the primary exam offer and consent eligibility.** Day-six pitches Pro; campaign eligibility currently filters confirmation and opt-out. (`netlify/functions/trial-lifecycle.mjs:100`, `netlify/functions/send-campaign.mjs:103`) | Segment by actual goal and activity; link exam-ready telc users to the package. Add a recorded marketing-consent basis, including wording/version/time, before promotional sending. | Initially ≥2 purchases per 100 eligible, qualified recipients; zero recipients without a valid basis. | M |

For price presentation, consumers must see the total including VAT. LS supports a store-wide tax-inclusive setting; its documentation says that setting also affects future subscription invoices. Check existing customer treatment before changing it. [PAngV §§2–3](https://www.gesetze-im-internet.de/pangv_2022/BJNR492110021.html), [LS tax-inclusive pricing](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)

Email confirmation and lack of opt-out are not equivalent to marketing consent. The existing-customer exception has additional conditions; the 1,100 free accounts cannot simply be treated as eligible customers. [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html)

## 8. Copy

**Proposed future copy:** package deliverables, prices, and guarantees below must first exist. The current homepage and pricing page are English; the telc sales page is German. (`astro-site/src/data/homepage.js:21`, `astro-site/src/pages/pricing.astro:190`, `astro-site/src/pages/telc-b1-komplettvorbereitung.astro:124`)

**Homepage hero — German**

- **H1:** „telc B1 bald? Üben Sie die Aufgaben, die Sie dort erwarten.“
- **Sub:** „Für Lernende mit Deutschkenntnissen etwa auf B1-Niveau: 20 Trainingseinheiten, sechs Schreibaufgaben mit KI-Feedback und zehn Sprechübungen. Beginnen Sie mit einem Lückencheck und üben Sie gezielt weiter.“
- **Primary CTA:** „Eine Prüfungsaufgabe kostenlos ausprobieren“
- **Paid link:** „Prüfungsplan ansehen · 199 € inkl. MwSt.“
- **Secondary route:** „Sie beginnen mit Deutsch? A1.1 kostenlos starten.“

**Homepage hero — English**

- **H1:** “telc B1 coming up? Rehearse the tasks before exam day.”
- **Sub:** “For learners already around B1: 20 training units, six writing tasks with AI feedback, and ten speaking rehearsals. Start with a gap check, then practise what needs work.”
- **Primary CTA:** “Try an exam task free”
- **Paid link:** “See the preparation package · €199 including VAT”
- **Secondary route:** “Starting German? Begin A1.1 free.”

Use one small relevant task for the exam CTA, not the existing twenty-minute placement test. Keep the restored account link available without competing as another primary button. (`astro-site/src/pages/index.astro:108`, `astro-site/src/pages/index.astro:113`)

**Pricing headline and core card — German**

> **Was brauchen Sie vor Ihrer telc-B1-Prüfung?**
>
> **telc-B1-Prüfungsprobe**  
> **199 € inkl. MwSt. · einmalig**
>
> Für Lernende etwa auf B1-Niveau mit einem konkreten Prüfungstermin.
>
> 20 Trainingseinheiten · sechs Schreibaufgaben mit KI-Feedback · zehn Sprechübungen · zwei unterschiedliche Übungstests in Kurzversion · persönlicher Lückenplan aus Ihren Ergebnissen · 90 Tage Werkzeugzugang.
>
> **„Prüfungsplan kaufen – 199 €“**
>
> Keine automatische Verlängerung. Prüfung und Prüfungsgebühr sind nicht enthalten. KI-Feedback und Übungsergebnisse ersetzen keine offizielle Bewertung.

Add the adopted refund wording immediately below the card, with linked terms.

**Pricing headline and card — English**

> **What do you need before your telc B1 exam?**
>
> **telc B1 Exam Rehearsal**  
> **€199 including VAT · one payment**
>
> 20 training units, six writing tasks with AI feedback, ten speaking rehearsals, two different short practice tests, your practice priorities, and 90 days of tool access.
>
> **“Buy the preparation package — €199”**
>
> No automatic renewal. Examination registration and fees are separate. Practice scores and AI feedback are not official assessments.

**One B1 exam lock — German**

> **Hier beginnt Ihre telc-B1-Übung.**
>
> Mit einem kostenlosen Konto können Sie die Kurzversion während Ihrer siebentägigen Testphase ausprobieren. Die Testphase enthält insgesamt zwei KI-Sprechübungen und zwei KI-Schreibkorrekturen.
>
> **„Kostenloses Konto erstellen und Übung starten“**
>
> Sie möchten einen festen Prüfungsplan? **„20 Trainingseinheiten ansehen – 199 € inkl. MwSt.“**
>
> Bereits ein Konto? „Anmelden und hier weiterüben.“

**English equivalent**

> **Start your telc B1 practice here.**
>
> Create a free account to try the short practice test during your seven-day trial. The trial includes two AI speaking sessions and two writing corrections in total.
>
> **“Create a free account and start practising”**
>
> Want a structured exam plan? **“See the 20-unit package — €199 including VAT”**
>
> Already registered? “Log in and continue here.”

The trial totals are supported by the current claims data. (`src/data/marketing.js:56`, `src/data/marketing.js:62`)

**Trial day-six email — only for eligible, telc-qualified recipients**

German subject:

> „Ihre Testphase endet morgen. Wie geht Ihre telc-B1-Vorbereitung weiter?“

First lines:

> „Guten Tag, morgen endet Ihre kostenlose Testphase. Ihr Konto und Ihre gespeicherten Ergebnisse bleiben erhalten; es wird nichts automatisch abgebucht.
>
> Wenn Ihre telc-B1-Prüfung näher rückt und Sie bereits etwa auf B1-Niveau sind, bietet Ihnen die Prüfungsprobe einen festen nächsten Schritt: 20 Trainingseinheiten mit Schreib- und Sprechübungen sowie zwei unterschiedlichen Kurztests. Das Paket kostet einmalig 199 € inklusive MwSt.“

English subject:

> “Your trial ends tomorrow. What’s next for your telc B1 preparation?”

First lines:

> “Your free trial ends tomorrow. Your account and saved results remain, and there is no automatic charge.
>
> If your telc B1 exam is approaching and your German is already around B1, the Exam Rehearsal package gives you a defined next step: 20 training units, writing and speaking practice, and two different short tests. It costs €199 including VAT, paid once.”

CTA: **„Prüfungsplan und Beispiel ansehen“ / “See the plan and sample feedback.”**

For inactive users, prioritize a useful task instead of pretending they have experienced the product. For other examination types, send the matching route—not this telc pitch.

## 9. The €10k math

**Definition:** monthly operating profit before the owner’s personal income tax, after acquisition, delivery, overhead, and an allowance for founder time. This is a conditional model, not a forecast.

**Core sale assumptions**

- Consumer price: **€199 including 19% German VAT**.
- LS transaction fee: **6.5% of gross + €0.50 assumed equivalent of $0.50**.
- Assumed non-US bank payout fee: **1%**.
- Refund/chargeback reserve: **5% of gross**.
- AI delivery: **€8 across the complete entitlement**.
- Support: **€4/order**.
- Acquisition: **€40 per buyer**, including commissions and channel-specific fees.
- Fixed monthly cost: **€1,000**, including an assumed €500 founder-time allowance.
- Month-one additional setup budget: **€1,500**.

LS fees apply to total order value. Its current documentation also lists +0.5% for subscriptions, +1.5% for PayPal, and additional affiliate-related fees. Actual account/payout arrangements were not verified. [LS fees](https://docs.lemonsqueezy.com/help/getting-started/fees)

| Per €199 core sale | Amount |
|---|---:|
| Consumer payment | €199.00 |
| Revenue excluding VAT: €199 / 1.19 | €167.23 |
| Transaction fee: 6.5% × €199 + €0.50 | −€13.44 |
| Assumed payout fee | −€1.54 |
| **Receipt after VAT and payment/payout fees** | **€152.25** |
| Refund/chargeback reserve | −€9.95 |
| AI and support | −€12.00 |
| **Contribution before acquisition** | **€130.30** |
| Acquisition | −€40.00 |
| **Contribution after acquisition** | **€90.30** |

Thus:

**Required sales = (€10,000 + €1,000) / €90.30 = 121.81 → 122/month.**

The €89 offer yields approximately **€67.82 after VAT and these payment/payout fees** if €89 becomes the gross price. Under the same delivery, reserve, and €40 CAC assumptions, only about **€11.37/order** remains: roughly **968 sales/month** to cover €11,000. Cheap acquisition could improve that, but it is not demonstrated.

**Conditional projection**

| Month | Sales | Gross customer payments | Qualified offer visits | Acquisition spend | Operating profit |
|---|---|---:|---:|---:|---:|
| 1 | 10 pilots × €149 + 2 core × €199 | €1,888 | 500; 2.4% conversion, warm pilot traffic | €480 | **−€1,775**, including setup |
| 3 | 50 core | €9,950 | 3,334 at 1.5% | €2,000 | **€3,515** |
| 6 | 125 core | €24,875 | 8,334 at 1.5% | €5,000 | **€10,288** |

This excludes revenue from entry products, tickets, Pro, and premium reviews. It also reserves delivery expense upfront, rather than counting a ninety-day entitlement as costless after the purchase month.

**Traffic needed for 122 monthly sales**

| Qualified offer-page purchase conversion | Required visits/month |
|---:|---:|
| 0.5% | 24,400 |
| 1.0% | 12,200 |
| 1.5% | 8,134 |
| 2.0% | 6,100 |

These are visitors with the right examination, level, and buying intent—not every grammar-page reader.

A month-six channel hypothesis could be 3,000 teacher referrals, 3,000 examination-intent organic visits, and 2,334 paid visits. At €0.60 CPC, that paid component costs about €1,400. Referral fees and other acquisition expenses still count toward the €5,000 ceiling. **None of these channel volumes is established by the supplied data.**

For a purely paid funnel, **CAC = CPC / purchase conversion**. At 1.5% conversion, the €40 CAC target permits €0.60 CPC. At €1 CPC, CAC becomes €66.67; required monthly sales rise to approximately 173.

**List launch**

Base projection: **zero launch revenue until eligibility is established**.

Even assuming all 1,100 accounts were lawfully marketable and relevant:

- 10% click to the offer × 3% visitor purchase conversion = **3.3 sales**.
- An unusually strong 3% purchase rate across the entire list = **33 sales**.

Neither is recurring distribution. Audit the consent basis and exam fit first; gather new permission on-site. Do not send an unsolicited promotional “permission request” to circumvent the blocker. [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html)

**Sensitivity and stop rules**

- If full-entitlement AI cost is **€28 rather than €8**, contribution after acquisition falls to €70.30; approximately **157 sales/month** are required.
- At **€80 CAC**, contribution falls to €50.30; approximately **219 sales/month** are required.
- €9.99 gross Pro produces only about **€7.12 before AI, support, refunds, and acquisition** under the subscription-fee assumptions. More than 1,500 subscribers would be needed even before those costs and with €1,000 overhead. Its present scale does not establish that path.
- Review channel spend after each €300 acquisition test. Fix failed payment/fulfillment immediately. Do not scale while refunds exceed the reserve or full-entitlement delivery costs exceed the model.
- Keep traffic, offer conversion, checkout completion, fulfillment, and customer activity separate. Existing analytics completion flags are browser/session based; payment truth must come from orders and entitlements. (`src/lib/funnelTracking.js:4`)

## 10. Facts in this brief I disagree with / could not verify.

**Source snapshot and independence**

I read `CLAUDE.md` first. I did not open Claude’s pass, the review folder’s README, or the prohibited standalone review file. I created, modified, or deleted no repository files and ran no state-changing git commands. The inspected committed HEAD was **`0624499`**.

The shared workspace changed during inspection. Final status showed uncommitted changes to the webhook and its unrouted-order test. Their authorship, deployment, and execution were not verified.

**Corrections to the brief**

1. **Signup currently has two fields, not three.** Email and password remain; the confirm-password field was removed. (`src/pages/SignupPage.jsx:391`, `src/pages/SignupPage.jsx:412`, `src/pages/SignupPage.jsx:435`)

2. **Anonymous exam visitors no longer universally get the login form.** `ExamSubscriptionGuard` now returns the signup-oriented lock. (`src/components/ExamSubscriptionGuard.jsx:73`) This corrects the guarded examination paths; some other guards still redirect anonymous visitors to login. (`src/components/PurchaseGuard.jsx:36`)

3. **Ticket owners’ account access is fixed in source.** `SubscriptionGuard` uses `canEnterAccount`, which allows a live entitlement **or purchases**. Production behavior after ninety days remains unverified. (`src/components/SubscriptionGuard.jsx:17`, `src/lib/accountAccess.js:7`)

4. **The day-six email now distinguishes trial and Pro X-Ray limits.** It says Pro has fifty and trial ten, rather than promising trial users fifty. (`netlify/functions/trial-lifecycle.mjs:106`)

5. **Email confirmation is not universally required before payment.** It is required on the authenticated `/subscription` route, but the telc sales page provides a direct guest checkout link. (`src/App.jsx:174`, `astro-site/src/pages/telc-b1-komplettvorbereitung.astro:135`) Receiving payment before an account exists still creates a fulfillment problem: user resolution returns null if no matching account/profile exists, and the course handler fails for retry. (`netlify/functions/lemonsqueezy-webhook.mjs:218`, working file `:408`)

6. **The unmapped-order defect has three distinct states.** The brief’s silent-warning description is older than committed HEAD: committed code also emails the owner, but still returns normally. The uncommitted working file now throws, enabling failure logging and retries, and supports configured subscription variant IDs. None of this verifies production mappings. (`netlify/functions/lemonsqueezy-webhook.mjs:363`, committed `0624499`; working file `:83`, `:390`)

7. **“No urgency or bonuses—enforced by tests” is too broad.** The offer test bans specific scarcity/deadline patterns, guarantees, popularity, and testimonials on selected surfaces. It does not explicitly ban bonuses. The trial banner already uses genuine expiry urgency. (`tests/offers.test.mjs:92`, `tests/offers.test.mjs:100`, `src/components/TrialBanner.jsx:49`)

8. **A1.2 is a paused rebuilt curriculum, but available legacy content is registered.** A1.2/A2 courses exist as older programs; they should not be described as absent or equivalent to rebuilt A1.1. (`src/data/curricula/index.js:19`, `src/data/courses/index.js:19`)

9. **The telc package is narrower than its name suggests.** The schedule has no explicit writing item or `/modelltest` task; day sixteen goes to a guide and day twenty to general placement. The available telc test is explicitly a **Kurzversion**, not a complete official simulation. (`src/data/programs/telcB1Komplett.js:114`, `src/data/programs/telcB1Komplett.js:150`, `src/data/mockExams/telcB1.js:7`)

10. **The price comments contradict the measured store behavior.** Source labels prices gross; the brief establishes tax-exclusive checkout. Byte-identical twins reproduce the same inconsistency rather than resolving it. (`src/data/pricing.js:23`, `src/data/pricing.js:113`)

**Additional concerns**

- The telc hero states that most failures arise from practicing the wrong things. No supporting failure analysis is attached to that claim. Remove it unless evidence exists. (`astro-site/src/pages/telc-b1-komplettvorbereitung.astro:128`)
- The guide’s blanket “B1 is the minimum requirement for the residence title” is overbroad and should not be reused in sales copy without identifying the exact legal route and exceptions. (`astro-site/src/data/guides/telc-b1.js:42`)
- “Accounts never sold to” cannot mean “the code contains no sales emails”: trial emails explicitly pitch Pro. Whether those accounts received them is unknown. (`netlify/functions/trial-lifecycle.mjs:103`)
- **€32.97 MRR from three subscribers does not reconcile with three €9.99 net subscriptions**, which total €29.97. I accept the reported metric as measured but cannot explain the difference. Likewise, forty-two failed payment events are not necessarily forty-two distinct lost customers.
- Current LS documentation adds subscription and payout fees omitted from the brief’s cost summary. [LS fees](https://docs.lemonsqueezy.com/help/getting-started/fees)

**Could not verify**

Production database figures independently; deployed HTML and working purchase flows; build/functions environment mappings; dashboard tax and product settings; receipt-to-entitlement timing; actual marketing-consent records; provider costs across ninety days; customer examination outcomes; willingness to pay €149–199; traffic denominators; Search Console ownership; partner demand; CAC; retention; or applicable FernUSG/payment eligibility.

GA and PostHog are consent-gated in source, so their absence of tracked visits cannot establish absence of visitors. (`public/consent.js:26`, `public/consent.js:40`) No build, tests, payments, emails, or live fulfillment actions were executed during this read-only review.
