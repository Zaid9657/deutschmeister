**1. Score: 1/5 — a cautious buyer has insufficient reason to pay**

DeutschMeister offers inspectable content and avoids fabricated testimonials, but the evidence does not establish a complete, accountable seller with settled purchase terms. The live Impressum displays “Entwurf — nicht freigegeben”; privacy identifies neither the controller nor its address; `/agb/` and `/widerruf/` return 404. These are stronger negative signals than exercise counts are positive signals. The root cause is **selling before operator identity, commercial promises and supporting proof have been resolved**. The approved strategy already makes these release conditions (`million-plan-2026-10.md:128`). My score combines proof and legal trust, whereas the current evaluation separates them and gives trust 2/5 (`sales-evaluation-2026-10-26.md:57`).

Evidence distinction: “main” below means the local `origin/main` reference, `4be1474`; the workspace is ahead at `847ea1f`. The founder wording change is pending on that branch. Capture quotations describe the live site. Additional checkout inspection is identified separately. No files changed.

**2. Findings, ranked by likely buyers lost**

The ranking is commercial judgment. **Actual abandonment attributable to each gap is unverified**, and losses overlap.

**First: the seller fails the basic accountability check.**

The live Impressum contains “[Vollständiger Name des Betreibers]” and address placeholders (`site__impressum.md`). Privacy says “Draft — not legally approved” and “Controller: [full legal name of the controller]” (`site__privacy.md:43,54`). The capture’s status table confirms `/agb/`, `/widerruf/` and `/terms` are 404 (`INDEX.md:147`). Main’s underlying operator fields and verification dates are empty ([legal.js](/home/user/deutschmeister/astro-site/src/data/legal.js:8)).

I ran the read-only legal-release check: it exits unsuccessfully, listing 15 missing facts. This is not merely unfinished presentation. German provider-information requirements include an accessible name and establishment address. [§5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html)

A cautious buyer cannot confidently answer: “Who owes me the product, and where can I pursue a problem?” That can destroy the entire purchase, regardless of price. AGB’s absence alone does not establish illegality; the substantive terms and disclosures require assessment.

**Second: there is inventory proof, but little proof of teaching effectiveness.**

The homepage publishes “grammar topics84,” “grammar exercises1,614” and “reading lessons74” (`site__home.md:582`). These have recorded provenance in `marketing.js:118,133,153`. That discipline deserves credit. It demonstrates that material exists; it does not demonstrate accurate exam feedback or learner improvement.

The homepage proof component explicitly acknowledges that no publishable testimonials, learner counts or pass rates exist (`Proof.astro:2`). FACTS reports seven distinct users with lesson attempts in 30 days, four writing users in 60 days, and zero A1.1 lesson-12 completions in the measured 14-day window. Those numbers cannot support “proven results,” a success rate, or turning 1,748 accounts into “1,748 successful learners.”

The sales consequence is an unanswered question: “Will this identify my mistakes correctly?” Competitors make trust more explicit: TestHelden advertises “160.000+ vorbereitet” and “30 Tage freiwillige Geld-zurück-Garantie” (`comp__testhelden-telc-b1.md:192,196`). Those are competitor claims, not independently verified outcomes.

**Third: cancellation, discretionary refunds and statutory withdrawal are insufficiently distinguished.**

Main’s FAQ says a refund request “will be reviewed” and statutory rights remain unaffected (`faqContent.js:121`). The offer data deliberately excludes a refund promise until the owner approves wording (`offers.js:209`). Live pricing clearly explains cancellation through Lemon Squeezy’s portal (`site__pricing.md:348`), but cancellation does not explain reimbursement of an existing charge.

Lemon Squeezy lets suppliers set refund policies and reserves discretion to issue refunds within 60 days to prevent chargebacks. That is **not a 60-day customer guarantee**. Its buyer terms describe discretionary refunds and no refunds for unused subscription periods. [Refund documentation](https://docs.lemonsqueezy.com/help/payments/refunds-chargebacks), [buyer terms](https://www.lemonsqueezy.com/buyer-terms)

The statutory starting point for qualifying distance contracts is a 14-day withdrawal right. For paid digital content, early extinction requires commencement of supply, express prior consent, acknowledgement of losing the right, and contractual confirmation. Simply describing a product as digital does not establish those conditions. Ongoing services require separate classification. [§355 BGB](https://www.gesetze-im-internet.juris.de/bgb/__355.html), [§356 BGB](https://www.gesetze-im-internet.de/bgb/__356.html), [§312f BGB](https://www.gesetze-im-internet.de/bgb/__312f.html)

Without a clear answer, buyers bear an unknown downside. A voluntary satisfaction guarantee could reduce that uncertainty; it cannot substitute for statutory information.

**Fourth: founder credibility is personal but unverifiable, and the proposed consistency fix overstates what is established.**

Live About says “I am Zaid, a doctor living in Germany on an EU Blue Card,” then describes “a team of doctors” (`site__ueber-uns.md:39,45`). Live homepage and telc copy describe one doctor (`site__home.md:603`; `site__telc-b1-komplettvorbereitung.md:89`).

Main’s sanctioned founder line is singular (`marketing.js@origin/main:230`). The workspace changes it to a team and records an owner decision (`marketing.js:228`). However, the supplied business brief describes a solo founder; identifiable contributors and their roles remain unverified.

I disagree with calling this trust problem “fixed” (`sales-evaluation-2026-10-26.md:100`). Consistency resolves wording disagreement, not substantiation. The existing “no name, no Person schema” instruction also conflicts with `organization.js:34`, which publishes a Person named Zaid.

Medical experience supports an authentic migrant story. It does not establish DaF teaching or exam-assessment expertise. A verifiable founder and a clearly scoped language reviewer would be more persuasive.

**Fifth: checkout introduces another version of the product.**

A supplementary read-only Firecrawl inspection of the [configured monthly checkout](https://deutsch-meister.lemonsqueezy.com/checkout/buy/dfc81ca3-78f5-4bab-9d62-dca75b3f7e21), identified by `src/config/lemonsqueezy.js:25`, returned “64 Grammar Topics” and “New content added weekly.” The site advertises 84 topics. The weekly publishing promise is unverified.

This additional capture was not written to disk, respecting read-only scope. It also returned “€9.99 billed every month,” “Powered by Lemon Squeezy,” and links to Lemon Squeezy’s terms. Thus MoR-related disclosure is not wholly absent. Privacy explicitly identifies Lemon Squeezy as merchant of record (`site__privacy.md:137`).

The remaining problem is coherence: buyers encounter different product descriptions precisely when asked for card details. German-location totals, withdrawal interaction and receipt identity remain unverified.

**Sixth: exam sourcing is useful, but the strongest sales assertion escapes it.**

Live telc B1 shows “Fakten geprüft am 22.08.2026” and links to telc’s homepage (`site__leitfaden-telc-b1.md:56,304`). Goethe A2 provides direct regulations and model-paper sources (`site__leitfaden-goethe-a2.md:330`). Main tests require dates and HTTPS sources, but those checks do not establish that each factual assertion matches its source (`tests/guides.test.mjs:238,251`).

Meanwhile, the telc hero asserts: “Die meisten fallen nicht durch, weil ihnen Grammatik fehlt” (`site__telc-b1-komplettvorbereitung.md:51`; source `telc-b1-komplettvorbereitung.astro:138`). No supporting failure-cause study appears in the evidence. It is unverified.

That unsupported generalisation undermines the site’s otherwise careful sourcing. August review dates are not inherently disqualifying; generic homepage citations make verification unnecessarily difficult.

**Seventh: consent offers a positive signal, then sends buyers into an unfinished privacy policy.**

The inspected mobile screenshots show accessible Decline and Accept buttons. Main gates GA loading on acceptance (`public/consent.js:42,112`), gates PostHog similarly (`src/lib/analytics.js:25`), and exposes withdrawal controls (`privacy.astro:135`). Support also provides an email route without requiring an account (`SupportPage.jsx:73`).

However, live privacy says AI-provider retention and transfer safeguards still require verification (`site__privacy.md:121`). A privacy-conscious buyer sees unfinished operational decisions about their submitted writing and speech.

This is evidence of incomplete assurance, not proof that the system is insecure. The mobile banner also occupies roughly one-fifth of the supplied 360px viewport; reducing its footprint must preserve genuine choice.

**3. Sub-scores**

| Sub-question | Score | Evidence |
|---|---:|---|
| (a) Social proof | 2/5 | Provenanced inventory counts; no publishable reviews or pass rates (`Proof.astro:2`; `marketing.js:118`). |
| (b) Founder/team credibility | 2/5 | First-name founder story; conflicting singular/team descriptions (`site__ueber-uns.md:39,45`). |
| (c) Guarantees/refunds | 1/5 | Requests reviewed; no settled voluntary promise (`faqContent.js:121`; `offers.js:209`). |
| (d) Legal pages/MoR | 1/5 | Draft operator/controller identity; missing routes (`legal.js:8`; `INDEX.md:147`). |
| (e) Exam facts/claims | 3/5 | Visible dates and sources, weakened by unsupported hero assertion (`site__telc-b1-komplettvorbereitung.md:51`). |
| (f) Security/privacy signals | 2/5 | Consent gates and support contact exist; production privacy facts remain unresolved (`privacy.astro:119`). |

**4. Recommendations by expected revenue per hour**

**Sizing assumption:** use the approved €149 pilot, 19% VAT and 10% refunds: approximately **€113 retained revenue per initial sale**, before payment fees and delivery costs. Ten sales represent approximately €1,127. These assumptions follow the strategy’s model (`million-plan-2026-10.md:66,72`). No recommendation below has a measured conversion uplift.

The gate is a prerequisite. Subsequent ranking is provisional commercial judgment; effects must not be added together.

| Rank | Change and exact location | Expected effect and effort | Authority and measure/kill rule |
|---|---|---|---|
| Prerequisite | Resolve operator, privacy, withdrawal and product terms in `astro-site/src/data/legal.js`, `impressum.astro`, `privacy.astro`; provide approved legal routes and `navigation.js:172` links. | Enables defensible sales. Estimate 6–10 internal hours, plus counsel; fees unverified. | **[owner]** Pass the complete strategy gate, not merely the legal script. Include Pro and tickets in the determination. |
| 1 | Reconcile LS dashboard descriptions with `pricing.js`, `marketing.js`, approved terms and actual delivery. | Removes contradiction at payment; estimate 1–2 hours. Each recovered pilot-equivalent sale is approximately €113. | **[owner]** Verify German checkout, receipt, refund and access states. No release with conflicting promises. |
| 2 | Add an inspectable writing-feedback demonstration beside the telc offer (`telc-b1-komplettvorbereitung.astro:199`). | Directly answers the largest product-quality doubt; estimate 6–10 hours including review. | **[agents]** build presentation; **[owner]** approves new proof and reviewer spending. Measure demo exposure → checkout → retained payment. |
| 3 | Remove the unsupported hero generalisation at `telc-b1-komplettvorbereitung.astro:138`; deepen telc/DTZ source links in `data/guides/`. | Cheap credibility repair; estimate 1–3 hours. | **[agents]** No replacement prevalence claim. Advance `factsCheckedOn` only after checking primary sources. |
| 4 | Reconcile verified founder/contributor facts across `UeberUnsPage.jsx:94`, `organization.js:34`, both `marketing.js` copies and telc copy. | Makes responsibility inspectable; estimate 2–3 hours plus owner evidence. | **[owner]** Publish only substantiated roles and qualifications; do not silently override the recorded team decision. |
| 5 | Consider a plain voluntary satisfaction guarantee in approved terms and telc purchase information. | Reduces financial uncertainty; estimate 2–4 hours after legal review. | **[owner]** Judge retained revenue, refund reasons and workload. No exam-pass guarantee. |

If refunds rise from 10% to 15%, conversion must improve by approximately **5.9% relatively** merely to preserve revenue per visitor. That is a useful guarantee threshold, not evidence that a guarantee will achieve it.

**The cheapest credible proof within two weeks, with zero reviews:** create one labelled demonstration letter, preserve its actual first feedback, show the revision, and explain the rubric. Label it “DeutschMeister demonstration”; identify who wrote and reviewed it. Add a short founder walkthrough and use the existing free lesson rather than building another endpoint.

Separately, commission the strategy’s blind review of 20 AI-graded letters, with no more than two differing by over one band (`million-plan-2026-10.md:173`). Publish the actual result only if documented. Budget assumption: €180–360 for 3–4 reviewer hours at €60–90/hour; availability is unverified. One polished example cannot establish grading reliability.

Review commercial results only with the approved reconciled denominator. After at least 300 qualified offer views, fewer than three sales triggers the strategy’s package revision rule (`million-plan-2026-10.md:193`).

**5. What remains unverified**

- **Legal readiness:** operator records, tax position, FernUSG/ZFU determination and production privacy arrangements. Verify through owner records and counsel. I disagree with an unconditional “tickets stay on sale” recommendation (`sales-evaluation-2026-10-26.md:87`) before their gate coverage is evidenced.
- **Complete checkout compliance:** inspect the German buyer journey and confirmation email; then conduct the owner-controlled purchase → refund → replay check. This evaluation made no purchase.
- **Founder/team qualifications:** verify identities, contributions and permission before publishing additional facts.
- **Actual security and consent behaviour:** inspect network traffic before acceptance, after rejection and after withdrawal; separately verify provider settings and current access controls. Code intent does not prove production behaviour.
- **Lost buyers and proof effectiveness:** reconcile offer views, checkout starts, payments and refunds. FACTS’ zero sales in seven days cannot identify the cause of rejection.

