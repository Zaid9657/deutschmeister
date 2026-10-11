## A. Critique Claude’s pass

**Scope:** I checked the current repository at commit `903bb21`, with a clean working tree. Production figures remain supplied facts; deployment and production configuration were not verified. I changed no files.

### 1. Bottom line

**Wrong or unsupported**

- “Today’s ~150–190 signups/month” is stale: the latest four listed weeks total **79**.
- “Top out around €0.5–1k” is not a demonstrated ceiling. It needs purchase conversion, VAT, fees, and delivery assumptions.
- “2–5× qualified traffic” has no measurable baseline. Signups are not qualified visits.
- Launching to all 1,165 confirmed accounts is not authorized by confirmation alone. The campaign code currently selects confirmed addresses and removes opt-outs; it does not establish affirmative marketing consent. (`netlify/functions/send-campaign.mjs:87`, `netlify/functions/send-campaign.mjs:103`)

**Right, including what I underweighted**

The offer should follow B1 examination intent, while Pro and tickets become secondary. Claude’s later **one B1 product family with examination-specific variants** is a better long-term architecture than permanently restricting the business to telc.

### 2. Why sales stopped

**Wrong or unsupported**

- The Poisson calculation is approximately correct **if** the old rate is fixed and stable. Its 0.7% result does not establish “not noise” unconditionally: the rate was estimated from eleven sales, exposure is unknown, and the period was selected after observing the stop.
- September 3’s product demotion happened **after** the last August 27 sale. It cannot be the only change coinciding with the onset.
- Steady Google-attributed signups do not establish “the site, not SEO.” Traffic, signup conversion, and attribution completeness could move independently.
- The project map records a paused Supabase project and failed builds. It does not quantify an authentication outage or attributable lost purchases. (`CLAUDE.md:168`)

**Right, including what I missed**

Claude usefully quantifies the historical sales rate. The gap deserves investigation; simply dismissing it as a small sample would also be wrong. It correctly distinguishes the constant VAT problem from a newly occurring cause.

### 3. Value-equation scorecard

**Wrong or overstated**

- “Nobody’s goal is A1.1” confuses examination goals with useful intermediate progress. Beginners can value introducing themselves without buying a B1 package.
- “Six screens before the first graded answer” needs precision. Controlled practice follows several stages, but the earlier pretest already checks the answer and displays recognition. (`src/lib/lesson/buildLesson.js:1115`, `src/components/lesson/PretestStage.jsx:34`, `src/components/lesson/PretestStage.jsx:81`)
- “65 min/day” is approximately supported for A1.2/A2.1, but A2.2 is approximately sixty. These are planned legacy-program minutes, not observed study time. (`src/data/courseContents.js:24`)
- Pro is not literally devoid of plans: its level access opens the registered courses. The commercial weakness is choosing and following the right route. (`src/contexts/SubscriptionContext.jsx:157`, `src/data/courses/index.js:17`)

**Right, including what I missed**

The **advertised sixty-to-sixty-five-minute daily workload** is a concrete effort objection I should have highlighted. The telc offer has the strongest potential outcome relevance, although that does not establish the strongest delivered experience.

### 4. Grand slam offer

**Wrong, unsupported, or risky**

- An A2+/B1− learner with four weeks available is not necessarily a fit for examination rehearsal. Separate language acquisition from examination preparation.
- “Citizenship, permanent residence, job, professional recognition” bundles different requirements. B1 is relevant to ordinary naturalization requirements, with exceptions; it is not a universal professional-recognition threshold. For example, the official nursing recognition guidance for Stuttgart requires B2. [StAG §10](https://www.gesetze-im-internet.de/stag/__10.html), [official nursing recognition guidance](https://www.anerkennung-in-deutschland.de/de/interest/finder/result?arrangement=Nein&location=14078&nationality=Drittstaat&profession=1695&qualification=Drittstaaten&success=Ja&whereabouts=Ausland&zipSearch=0)
- “Growing because immigration/citizenship reform” needs current examination-demand evidence. Legislative change alone does not establish addressable-market growth.
- **Three B1 examination files are not three alternative mocks for one examination.** There is one registered short set each for telc B1, Goethe B1, and DTZ. (`src/data/mockExams/index.js:17`)
- Goethe B1 and DTZ currently have `hasWriting: false`; extending the complete feedback package requires work. (`src/data/examTracks.js:68`, `src/data/examTracks.js:79`)
- A speaking engine is not evidence of a finished, validated oral-examination simulator. Existing infrastructure handles missions and bounded course tasks; the telc plan links to generic speaking. (`netlify/functions/_shared/speakingAI.mjs:59`, `src/data/programs/telcB1Komplett.js:131`)
- The reminder mailer serves **rebuilt-course activity**, at most three reminders weekly. It is not an existing daily B1-plan reminder service. (`netlify/functions/course-reminder.mjs:3`, `netlify/functions/course-reminder.mjs:20`)
- €60 covers the proposed two oral sessions only. The premium also promises two writing reviews, administration, and potential rescheduling.
- Human delivery cannot simply be bundled through Lemon Squeezy: its published prohibited-products policy excludes services. [LS policy](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products)
- “In eight weeks to B1” risks implying language-level attainment, particularly for the broader starting-level avatar.

**Right, including what I missed**

The existing examination-date component is reusable infrastructure, not something to invent again. (`src/components/course/ExamDatePlan.jsx:41`) A bounded broadcast channel is also worth adding. The affordable core should remain asynchronous.

### 5. Price ladder

**Wrong or risky**

- A €29 “three-mock pack” cannot be represented as three relevant tests for a telc buyer using the existing three different examination formats.
- Renaming an **A2 sub-level** ticket “A2 für Goethe A2” can imply complete examination preparation. One sub-level is not the entire A2 band. (`src/data/pricing.js:139`, `src/data/courses/index.js:20`)
- A1.2’s rebuilt curriculum is paused, but its legacy program exists. Removing it solely because the rebuild is paused would confuse delivery formats. (`src/data/curricula/index.js:19`, `src/data/courses/index.js:19`)

**Right**

The free → entry → core → premium sequence is sensible. Pro belongs in continuing practice. I accept the objection to leading the homepage with A1.2; that is separate from whether its accurately described legacy product remains available.

### 6. Guarantees

**Wrong or legally risky**

- “Low risk if conditions are clear” is too confident. A pass-linked guarantee still needs reliable delivery, objective eligibility rules, examination-specific interpretation, and a financial reserve.
- A generic 60% rule does not fit all three examinations. DTZ’s stored 60% is explicitly a trainer’s reference value; Goethe’s relevant logic is per module. (`src/data/mockExams/dtz.js:8`, `src/data/mockExams/goetheB1.js:6`)
- “Until your retake” and “until you pass” create potentially unbounded delivery periods.
- Existing telc progress uses customer-operated checkboxes. That does not establish completion or proficiency. (`src/pages/TelcB1KursPage.jsx:44`)
- “Keine Rückerstattung” cannot override statutory rights. “Zero cash risk” is false: ongoing AI, statutory claims, chargebacks, and fulfillment failures remain.

**Right**

A suitability refund is useful. Claude has now dropped the failed-examination refund and proposed stacking my refund and bounded extension; that materially improves its original position.

Do not simply delete the truth tests. Replace the blanket bans with checks for the adopted, precisely scoped policy. The current refund test explicitly anticipates that approach. (`tests/refund-claims.test.mjs:9`)

### 7. Friction: top 10

**Corrections**

- “B1 is not buyable” conflates unavailable **B1 level tickets** with the separate telc preparation offer and its conditional hosted checkout. (`src/data/pricing.js:125`, `astro-site/src/pages/telc-b1-komplettvorbereitung.astro:45`)
- Guest checkout does not currently create an account automatically. The webhook searches existing accounts/profiles; unresolved purchasers cause failure and retry. (`netlify/functions/lemonsqueezy-webhook.mjs:229`, `netlify/functions/lemonsqueezy-webhook.mjs:407`)
- These cited defects are now fixed in source:
  - Anonymous examination guard shows the signup lock. (`src/components/ExamSubscriptionGuard.jsx:73`)
  - Ticket purchases permit account-screen entry. (`src/components/SubscriptionGuard.jsx:17`, `src/lib/accountAccess.js:7`)
  - Confirm-password is removed. (`src/pages/SignupPage.jsx:435`)
  - Day-six explicitly distinguishes trial ten analyses from Pro fifty. (`netlify/functions/trial-lifecycle.mjs:106`)
  - Unrouted paid orders now alert **and throw**, producing failure logging and HTTP 500. (`netlify/functions/lemonsqueezy-webhook.mjs:190`, `netlify/functions/lemonsqueezy-webhook.mjs:390`)

**Right**

Intent-matched offers at placement, locks, examination results, and lifecycle messages should move earlier in the commercial work queue.

**Priority disagreement**

Payment/entitlement verification precedes driving more people toward checkout. “Record and alert” alone was insufficient; the current retry behavior improves that, but production mappings remain unverified.

### 8. Copy

**Wrong or risky**

- “Marked like the real one,” “echte Bewertung,” and “KI-Prüfer” overstate authority and validation. The repository explicitly labels scores as reference values and disclaims official assessment. (`src/data/examTracks.js:105`)
- “Three mocks” retains the inventory error.
- “Free until retake” retains the unlimited-duration liability.
- A ten-minute readiness check is proposed, not established. Its scope and usefulness need demonstration.
- `{n} exercises this week` must come from a trustworthy activity definition and handle zero/unknown activity. Otherwise the email recreates a misleading personalization problem.
- Calling a locked exercise exclusively part of the new package would obscure existing Pro/trial access. (`src/contexts/SubscriptionContext.jsx:145`)

**Right**

“When is your examination?” is a stronger commercial question than a generic upgrade. The German headline “zur B1-Prüfung” is safer than “zur B1,” provided the delivered package matches it.

### 9. The €10k math

**Material errors**

1. Claude’s fee calculations appear to apply 5% to **VAT-exclusive revenue**. LS calculates its platform fee on total order value and lists additional international/payout fees. [LS fees](https://docs.lemonsqueezy.com/help/getting-started/fees)

   Under my original card/payout assumptions, receipts before delivery are:

   | Gross price | Receipt after VAT, transaction and payout fees |
   |---:|---:|
   | €197 | €150.72 |
   | €397 | €304.24 |
   | €29 | €21.76 |

2. Fourteen-to-twenty-five sales at €147 produce **€2,058–€3,675 gross payments**, not net profit. Receipts under those assumptions are approximately **€1,573–€2,808 before delivery, refunds, acquisition, and overhead**.

3. At €197, even a generous calculation using €10 AI and €50 CAC, while omitting refunds, support, and overhead, leaves approximately €90.72/order. **110 orders yield €9,979 before those omitted costs**. The asserted €10,000 profit does not follow.

4. Nineteen percent is the German VAT assumption, not an established universal worst case.

5. “5–10× today’s landing visits” is unknowable without today’s visit denominator.

6. The existing account list is not automatically reachable, relevant, or marketable.

**Right, including what I missed**

Price testing deserves stronger emphasis. Higher contribution can reduce the required buyer volume substantially—but only if conversion and refund behavior remain acceptable.

The B2B suggestion deserves discovery, not projected revenue. Neither demand nor delivery is established for recruiters or nursing schools; B2 proficiency cannot be sold using an unbuilt B2 course.

### 10. Facts disputed / unverifiable

**Too incomplete**

Claude should also have disclosed the short-test limitations, absent Goethe/DTZ writing banks, stale funnel defects, guest-account fulfillment gap, human-delivery payment restriction, and unresolved FernUSG classification.

**Right**

It correctly distinguishes measured tax-exclusive orders from an unseen dashboard setting and calls for dated sources before using competitor prices.

**My correction:** Claude’s critique of my MRR discrepancy flag is substantively right. I address it below.

## B. Answer to Claude’s critique of my pass

### 1. “The avatar is too narrow”

**Refine and partly concede.**

Adopt **B1-Prüfungsprobe as the product family**, with an examination selector. Pilot telc first; collect demand for Goethe/DTZ immediately.

But a selector does not make the other variants deliverable. Their short tests exist, while their dedicated writing-feedback banks are not flagged as available. Each variant needs the right tasks, grading explanation, speaking preparation, and reviewed route. (`src/data/mockExams/index.js:17`, `src/data/examTracks.js:68`)

Do not broaden the starting-level promise to compensate for insufficient traffic. Sell rehearsal to learners already near the required level; route learners with substantial language gaps elsewhere.

**Decision evidence:** qualified demand and contribution by examination type, plus completed variant-delivery reviews.

### 2. “Stack the guarantees”

**Concede, with bounded terms and costs.**

Use both:

- Fourteen-day unconditional suitability refund.
- For customers retaining the package and completing the disclosed work, one thirty-day extension with **five additional five-minute speaking sessions and two writing corrections**.

State that refunding ends package access; the extension is not an official examination-pass promise. Implement the eligibility and extra allowance before publication.

The stack is a testable offer improvement, not a proven conversion lift. I would raise the initial refund reserve from **5% to 10%** and use a larger provisional AI allowance until costs are measured.

### 3. “Test €249 against €199”

**Concede. My €199 recommendation was too fixed.**

After the €149 pilot, test the **same package and guarantee** at €199 and €249. Evaluate contribution per qualified visitor, refunds, activation, and delivery—not revenue per sale alone.

Under the revised assumptions in C:

- €199 contributes **€108.35 before acquisition**.
- €249 contributes **€141.73 before acquisition**.

With equivalent traffic costs, €249 wins if it retains approximately **76.4% of €199’s purchase conversion**. Thus 1.5% conversion at €199 corresponds to about 1.15% at €249 for equal contribution per visitor.

Claude’s €299 calculation is approximately right under my original optimistic costs. It is not evidence that buyers will pay €299. Under the revised costs, €299 requires approximately **82 monthly sales**, rather than 68.

With limited traffic, a small price test will be directional, not statistically decisive.

### 4. “Add Telegram”

**Concede the channel; rebut the legal shortcut.**

Create a **broadcast channel**, not a founder-dependent tutoring group:

> „B1-Prüfung üben: eine Aufgabe pro Tag, Lösungen und gelegentliche Produktangebote.“

Invite voluntary subscriptions through relevant website pages, partner referrals, and content. Batch the tasks; use one tracked package CTA.

Joining Telegram does **not** authorize marketing email, importing old users, or unsolicited private messages. Record separate email consent if email is collected. [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html)

Telegram also starts without an audience and remains platform-dependent. It supports retention and repeat exposure; it does not itself supply the missing thousands of qualified visitors.

### 5. “Route around FernUSG with automated software”

**Rebut the claimed exemption; refine my legal concern upward.**

The ZFU’s current FAQ explicitly includes **automated correction through a learning-management system** among possible forms of learning-success monitoring. It also emphasizes contractual entitlement, rather than whether monitoring actually occurs. [ZFU guidance](https://zfu.de/veranstaltende/faq)

Therefore, my reading is: personalized AI correction is a **credible classification risk**, not an established safe harbor. The FAQ is administrative guidance, not a judgment on this particular product.

Avoiding personal Q&A may reduce some exposure, but it does not settle the AI-feedback package. Obtain a written assessment of its actual functions, contract, advertising, and guarantee **before the paid pilot**, not merely before human delivery. If approval is required, obtain it before concluding covered contracts. [FernUSG](https://www.gesetze-im-internet.de/fernusg/BJNR025250976.html)

Preparing content, interviewing prospects, and researching distribution can continue during that assessment.

### 6. “MRR is gross-of-VAT”

**Concede the reconciliation; refine the metric definition.**

The SQL sums `price_paid`, normalized by billing interval. Renewal webhooks write `attributes.total / 100`. (`migrations/2026-09-03-weekly-metrics.sql:51`, `netlify/functions/lemonsqueezy-webhook.mjs:588`)

And:

**€9.99 + €11.09 + €11.89 = €32.97.**

Thus the brief’s MRR can reconcile with three €9.99 base-price subscriptions. My earlier discrepancy flag was too strong; I withdraw it.

However, initial subscription creation writes the subscription-item price, while subsequent invoice events write the total. The same column can therefore carry different accounting bases. (`netlify/functions/lemonsqueezy-webhook.mjs:647`)

Report **gross recurring billings, VAT-exclusive recurring revenue, and actual contribution separately**. I cannot confirm which three production rows produce €32.97.

### 7. “Name the cheapest positive month-one path”

**Refine: a positive month is possible only within a strict budget and after legal clearance.**

The cheapest credible path is a **limited telc pilot using ready content**, sold through permission-based referrals and an in-app invitation:

- Ten buyers at €149 including VAT.
- No paid advertising, outsourced build, Telegram tutoring, or human review.
- Three existing telc writing prompts, each submitted and revised: six corrections. (`netlify/functions/_shared/writingTasks.mjs:18`, `netlify/functions/_shared/writingTasks.mjs:34`, `netlify/functions/_shared/writingTasks.mjs:50`)
- Existing short test, explicit speaking exercises, and a revised study route.
- No promise of a second independent test until one is ready.

Per buyer, using C’s costs but zero cash CAC:

**€113.87 receipt − €14.90 reserve − €20 AI − €4 support = €74.97 contribution.**

Ten sales provide **€749.75** to cover all other costs. An illustrative budget:

| Expense | Maximum budget |
|---|---:|
| Cash overhead | €150 |
| Legal classification review | €300 |
| Founder work: five hours at €50 | €250 |
| **Resulting operating profit** | **€49.75** |

Those are spending ceilings, **not verified quotations or an implementation estimate**. If the work exceeds five hours, legal review costs more, or approval is required, this positive-month case fails. Do not hide founder labor or remove legal work to manufacture profitability.

Its purpose is cheap paid validation. It is not a forecast or a €10,000-income strategy.

## C. The merged position

**AGREED** marks shared direction supported by the two passes or Claude’s revisions. **DISPUTED** marks unresolved choices or claims. The financial assumptions below are my proposed common planning baseline, not a claim that Claude has already accepted them.

**Offer, pricing, guarantees, and distribution**

| Recommendation | Status | Position and remaining evidence |
|---|---|---|
| Core product family | **AGREED** | **B1-Prüfungsprobe**, examination selector, telc pilot first; separate reviewed Goethe/DTZ variants later. No three-format bundle masquerading as three same-exam tests. |
| Starting-level avatar | **DISPUTED** | **Claude:** A2+/B1−, examination in 4–12 weeks. **Codex:** already approximately B1, seeking examination rehearsal. **Settle:** diagnostic ability, completion, refund reasons, and outcomes by starting level. |
| Outcome positioning | **AGREED** | Sell rehearsed tasks, feedback, and identified gaps. Drop first-try certainty, “real examiner” language, and blanket immigration/professional-recognition claims. |
| Delivered core | **AGREED** | Defined study route, examination-specific writing/speaking practice, clear short-test limitations, bounded access. Author and review missing content before promising it. |
| Examination-date planning | **AGREED** | Reuse `ExamDatePlan`; distinguish twenty training units from “B1 attained in eight weeks.” (`src/components/course/ExamDatePlan.jsx:41`) |
| Pilot price | **AGREED** | Approximately €149 including VAT; ten buyers initially, provided this is genuine feedback capacity. Claude’s €147 difference is commercially immaterial. |
| Core price test | **AGREED** | €199 control versus €249 challenger; identical deliverables and guarantees. Winner determined by contribution per qualified visitor and delivery outcomes. |
| Established winning price | **DISPUTED** | **Claude:** higher prices may solve the traffic constraint. **Codex:** €249/€299 remain unvalidated; use €199 as the planning control. **Settle:** paid conversion, refunds, and contribution at each price. |
| Premium price and format | **DISPUTED** | **Claude:** €397 with live oral simulations and writing reviews. **Codex:** €349 with bounded asynchronous assessment, deferred. **Settle:** assessor quotations, buyer demand, payment eligibility, and legal classification. |
| Installments | **DISPUTED** | **Claude:** optional 3 × €69. **Codex:** defer; total-price disclosure, defaults, fees, and administration add complexity before demand is proven. **Settle:** recorded lost purchases attributable to upfront price. |
| Guarantee stack | **AGREED** | Fourteen-day suitability refund **plus** one bounded practice extension. Drop failed-examination refund and access “until you pass.” Statutory rights remain intact. |
| Scarcity and urgency | **AGREED** | Actual pilot capacity and learner examination date. No unsupported future-price anchor, false stock limit, or resetting deadline. |
| Bonuses | **AGREED** | Examination-day checklist and partner-practice prompts; no invented standalone monetary values. |
| Free and entry ladder | **AGREED** | Free A1.1 for beginners; relevant free examination sample; optional €29 gap-check product with disclosed core credit. Avoid paid acquisition for the entry product alone. |
| Entry-product contents | **DISPUTED** | **Claude:** three-mock pack. **Codex:** examination-specific gap check and feedback sample. **Settle:** build three relevant tests and compare demand; current inventory does not support Claude’s claim. |
| Pro and tickets | **AGREED** | Secondary continuing-practice/library offers. Clearly distinguish legacy paid plans from rebuilt A1.1. Preserve existing entitlements; reconcile VAT-inclusive prices. |
| Telegram | **AGREED** | Opt-in broadcast channel with batched tasks and tracked CTAs. No promised founder supervision; no automatic email-consent transfer. |
| Partner distribution | **AGREED** | Begin with roughly ten permission-based partner conversations weekly; show corrected task examples and track paid referrals. No unsolicited email campaign. |
| Referral economics | **AGREED** | Initial €25 reward is a hypothesis; total acquisition cost includes platform fees, commissions, and attributable outreach/content costs. Cap against measured contribution. |
| Search/content distribution | **AGREED** | Add the matching offer beside examination answers and samples; reuse short task demonstrations across channels. Test €300 search spend only after delivery works. |
| Existing-account launch | **AGREED** | In-app invitation; promotional email only to documented eligible recipients. Exclude unverified list revenue from the base forecast. |
| Traffic growth forecast | **DISPUTED** | **Claude:** 2–5×/5–10× growth and 2–3% visitor conversion. **Codex:** neither multiplier nor conversion is established; plan from absolute qualified visits. **Settle:** channel-specific visit, purchase, and refund denominators. |
| B2B accelerator | **DISPUTED** | **Claude:** recruiter/nursing-school licences could bridge the gap. **Codex:** discovery only; no projected deals or unbuilt B2 delivery. **Settle:** qualified buyer interviews and a paid, deliverable institutional pilot. |
| Later spouse-examination offer | **AGREED** | Defer; first validate the B1 business. A1.1 alone should not be represented as complete Start Deutsch 1 preparation. (`src/data/examTracks.js:25`) |

**Top friction fixes—in the proposed merged order**

| Order | Recommendation | Status | Evidence / resolution |
|---:|---|---|---|
| 1 | Verify checkout-product mappings, payment-to-entitlement fulfillment, and unmatched-order reconciliation. | **DISPUTED** on priority | **Claude:** B1 offer first, webhook eighth. **Codex:** delivery before increased sales traffic. **Settle:** real fulfillment checks and unresolved-paid-order count. Current source now fails unrouted orders correctly. (`netlify/functions/lemonsqueezy-webhook.mjs:390`) |
| 2 | Make displayed, structured-data, email, and checkout prices agree including VAT. | **AGREED** | Dashboard change plus price audit; inspect existing subscription treatment. |
| 3 | Align AI quotas and offered speaking durations with server behavior; measure cost. | **AGREED** | Current monthly speaking claim and daily subscriber implementation disagree. (`src/data/marketing.js:54`, `netlify/functions/speaking-session.mjs:24`) |
| 4 | Enable guest payment with durable, secure account claiming. | **AGREED** | Existing ticket Buy uses browser-local intent; existing guest fulfillment cannot create the missing account. (`astro-site/src/components/CourseCheckout.astro:34`, `netlify/functions/lemonsqueezy-webhook.mjs:407`) |
| 5 | Put the matching B1 package above the fold and first in the relevant examination route. | **AGREED** | Current B1 route leads with Pro and places the telc package third. (`src/data/offers.js:187`) |
| 6 | Deliver a useful first task before unnecessary menus and profile questions; preserve return destination. | **AGREED** | Beginner first-run routing is already improved; measure the remaining drop-off. (`src/lib/firstRun.js:94`) |
| 7 | Add matching offers to locks, placement/examination results, and eligible lifecycle messages. | **AGREED** | Anonymous SPA lock lacks price/Buy; day-six still sells only Pro. (`src/components/LockedContentOverlay.jsx:65`, `netlify/functions/trial-lifecycle.mjs:103`) |
| 8 | Record marketing consent separately from email verification and opt-out. | **AGREED** | Current campaign eligibility does not establish that basis. (`netlify/functions/send-campaign.mjs:103`) |
| 9 | Verify deployment of the already-fixed signup, examination-door, ticket-account, and email-copy changes. | **AGREED** | Verify deployed behavior; do not reimplement source fixes listed in A7. |
| 10 | Separate gross billings, VAT-exclusive revenue, refunds, channel costs, and full-entitlement AI expense. | **AGREED** | Current MRR aggregates `price_paid`, whose write paths differ. (`migrations/2026-09-03-weekly-metrics.sql:51`, `netlify/functions/lemonsqueezy-webhook.mjs:647`) |

**One adopted €10,000 planning model**

Use **€199 including German 19% VAT** as the control price. Assume 6.5% of gross plus €0.50 transaction fee, 1% payout fee, **10% of gross refund reserve**, **€20 AI including expected extensions across the entitlement**, €4 support, €40 all-in CAC, and €1,000 monthly overhead including founder time. These costs are provisional; the fees reflect published standard charges rather than verified store terms. [LS fees](https://docs.lemonsqueezy.com/help/getting-started/fees)

| Per core sale | €199 control | €249 challenger |
|---|---:|---:|
| Receipt after VAT and payment/payout fees | €152.25 | €190.63 |
| Refund reserve | −€19.90 | −€24.90 |
| AI and support | −€24.00 | −€24.00 |
| Acquisition | −€40.00 | −€40.00 |
| **Contribution** | **€68.35** | **€101.73** |
| **Sales for €10k profit plus €1k overhead** | **161/month** | **109/month** |
| Qualified visits at 1.5% purchase conversion | **10,734/month** | **7,267/month** |

The challenger column assumes it can also achieve €40 CAC and 1.5% conversion; that is precisely what remains to be tested.

| Conditional operating month | Assumptions | Profit |
|---|---|---:|
| Month 1, normal setup | Ten €149 pilots + two €199 buyers; €40 CAC; €1,000 overhead + €1,500 setup | **−€2,014** |
| Month 1, minimal alternative | Ten €149 pilots; zero cash CAC; €700 total overhead/legal/founder allowance | **€50**, subject to B7’s conditions |
| Month 3 | Fifty €199 core sales | **€2,418** |
| Month 6 | 165 €199 core sales; 11,000 qualified visits at 1.5% | **€10,278** |

These are operating scenarios before personal income tax, not dates by which success is predicted.

| Financial recommendation | Status | Positions / settling evidence |
|---|---|---|
| Use the fully loaded model above for planning. | **DISPUTED** | **Claude:** lower delivery assumptions and 90–110 €197 sales can reach €10k. **Codex:** those numbers omit costs; adopt the stated reserve, AI, support, CAC, and overhead. **Settle:** actual payout statements, refunds, provider costs, founder workload, and channel cohorts. |
| Scale only measured profitable acquisition. | **AGREED** | At 1.5% conversion, €0.60 CPC corresponds to €40 CAC. Higher CPC or lower conversion requires a new model. Entry, premium, list, and B2B revenue remain excluded. |

**Legal preconditions**

| Requirement | Status | Concrete precondition |
|---|---|---|
| **PAngV** | **AGREED** | Actual consumer totals include VAT and match checkout. Do not merely append “inkl. MwSt.” to the current tax-exclusive flow. [PAngV §3](https://www.gesetze-im-internet.de/pangv_2022/__3.html) |
| **§7 UWG** | **AGREED** | Document promotional-email eligibility. Confirmation and no opt-out are insufficient. Telegram subscription does not authorize another channel. [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html) |
| **FernUSG—timing of assessment** | **DISPUTED** | **Claude:** keep automated self-study core; legal check before humans. **Codex:** assess the AI core before paid pilot because automated correction is expressly identified in ZFU guidance. **Settle:** written product-specific classification and any required approval. [ZFU guidance](https://zfu.de/veranstaltende/faq) |
| **Lemon Squeezy prohibited products** | **AGREED** | Keep human services out of an assumed LS checkout arrangement; obtain acceptable processing before sale. Software eligibility does not settle FernUSG. [LS policy](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products) |
| **Guarantees and statutory rights** | **AGREED** | Publish and honor bounded terms; retain mandatory rights; implement refunds and extensions; revise claim tests around the adopted policy. (`tests/refund-claims.test.mjs:9`) |

The remaining blockers are concrete: lawful product classification, demonstrated fulfillment, paid willingness to pay, and measurable acquisition economics. Neither a broader selector nor a stronger guarantee establishes those facts.
