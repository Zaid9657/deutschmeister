## 1. Score: **2/5**

DeutschMeister contains useful practice, but its premium exam value is unproved. The strongest assets are structured beginner lessons, writing revision, guided speaking and timed practice. The weakness is assessment validity: the telc tasks incompletely reproduce the exam, AI marks lack supplied human-validation results, and no verified examination outcomes are provided. **The root cause is treating practice delivery as evidence of readiness.** A €9.99 practice subscription is defensible; a €149 package needs an additional, inspectable deliverable. The approved plan itself still requires independent assessment and outcome capture. ([million-plan:173](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:173))

Code findings below describe repository implementation; deployment is unverified unless supported by a live capture. All work was read-only.

## 2. Findings, most important first

**1. The €149 premium currently rests largely on sequencing tools already included in Pro.**

The programme delivers 20 training days containing 22 activities: two short tests, three letters plus three revisions, ten five-minute speaking rehearsals, three gap-practice activities and one sentence-analysis activity. Summing its declared durations gives **385 minutes—6 hours 25 minutes**, excluding optional practice. This is a useful rehearsal schedule, not extensive instruction. ([telcB1Komplett.js:197](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:197))

The live page acknowledges the overlap: “**Der Kurs ist der Plan darüber**”; it says the mock and writing training are included in Pro. It still displays “**89,00 €**” and “**Der Kurs startet in Kürze**.” Thus €149 is the proposed pilot price, not the captured live offer. (`site__telc-b1-komplettvorbereitung.md:98`, `:112`)

Three months of Pro cost €29.97, making the proposed package premium **€119.03**. Meanwhile, TestHelden advertises a €39 package including a dated learning plan and exam practice. Its actual teaching quality remains unverified. **A schedule alone is therefore a weak reason to pay €149.** ([pricing.js:24](/home/user/deutschmeister/src/data/pricing.js:24), [TestHelden’s offer](https://testhelden.com/products/telc-b1-pruefung))

**2. The telc writing product trains an incomplete task and grades it with a different rubric.**

Each of the three telc writing tasks contains **three Leitpunkte**. The shared evaluator awards four criteria of 0–5 points, producing an internal score out of 20. ([writingTasks.js:18](/home/user/deutschmeister/src/data/writingTasks.js:18), [evaluate-writing.mjs:306](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:306))

Telc’s published format requires **four Leitpunkte** and uses three assessment criteria with A–D bands. This is a substantive mismatch, not merely different score presentation. A learner can satisfy every DeutschMeister instruction without practising the complete telc writing demand. ([telc format and assessment criteria](https://shop.telc.net/media/catalog/product/file/201904225061B00010301BiB.pdf))

The evaluator has valuable safeguards: it checks output completeness, caps marks using reported content coverage and detects copied task wording. However, semantic coverage still depends on the model. These guards establish consistency, not examiner agreement. ([evaluate-writing.mjs:154](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:154))

**Sales cost:** misleading confidence can turn a €149 sale into a refund and a credible negative recommendation. Neither refunds caused by grading nor their frequency are verified.

**3. The mocks establish practice performance, not examination readiness.**

The registry supplies six original short mocks: telc B1/B2, Goethe A1/A2/B1 and DTZ. ([mockExams/index.js:17](/home/user/deutschmeister/src/data/mockExams/index.js:17))

The telc objective rehearsal lasts 55 minutes: eight reading items, ten multiple-choice gaps and two listening sets drawn from the general B1.1 library. Writing is a self-check; speaking is absent from the mock result. The result screen explicitly excludes writing and speaking. ([telcB1.js:40](/home/user/deutschmeister/src/data/mockExams/telcB1.js:40), [telcB1.js:177](/home/user/deutschmeister/src/data/mockExams/telcB1.js:177), [ModelltestResult.jsx:231](/home/user/deutschmeister/src/pages/Modelltest/ModelltestResult.jsx:231))

Missing rehearsal demands include the third reading format, the second Sprachbausteine format, three-part listening and sustained paired interaction. Telc specifies 90 minutes for reading/Sprachbausteine, approximately 30 for listening, 30 for writing and approximately 15 for paired speaking. ([telc examination structure](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/))

There **is now a distinct second form**; the approved plan’s earlier replay criticism is stale. But matching item counts does not establish equivalent difficulty. ([telcB1Form2.js:4](/home/user/deutschmeister/src/data/mockExams/telcB1Form2.js:4))

The aggregate 60% practice threshold also differs from the written/oral separation described in DeutschMeister’s own guide. Course checkpoints use another internal rule: 60% overall, section floors and safeguards against guessing. None should become a pass-probability claim. ([examScoring.js:86](/home/user/deutschmeister/src/services/examScoring.js:86), [telc guide:23](/home/user/deutschmeister/astro-site/src/data/guides/telc-b1.js:23), [buildCheckpoint.js:2901](/home/user/deutschmeister/src/lib/checkpoint/buildCheckpoint.js:2901))

**4. Paid products deliver materially different course experiences.**

Prices and included Pro duration derive from the canonical catalogue. ([pricing.js:114](/home/user/deutschmeister/src/data/pricing.js:114), [pricing.js:82](/home/user/deutschmeister/src/data/pricing.js:82))

| Product | What the implementation delivers |
|---|---|
| **A1.2, €40** | Lifetime level access plus 90 days Pro; rebuilt situational curriculum with 12 lessons and four checkpoints. ([curricula/index.js:16](/home/user/deutschmeister/src/data/curricula/index.js:16), [a12.js:1301](/home/user/deutschmeister/src/data/curricula/a12.js:1301)) |
| **A2.1 / A2.2, €50 each** | Lifetime level access plus 90 days Pro; legacy 28-day resource sequences and final tests. They are outside the rebuilt curriculum registry. Completion includes learner-controlled “done” actions. ([curricula/index.js:4](/home/user/deutschmeister/src/data/curricula/index.js:4), [CourseLessonPage.jsx:76](/home/user/deutschmeister/src/pages/CourseLessonPage.jsx:76)) |
| **B1/B2 tickets** | Listed at €60–65 but coming soon. Pro access to existing practice does not constitute a rebuilt level course. ([pricing.js:118](/home/user/deutschmeister/src/data/pricing.js:118), [courses/index.js:17](/home/user/deutschmeister/src/data/courses/index.js:17)) |
| **Pro, €9.99/month or €79.99/year** | Access across levels while active; AI allowances described below. ([pricing.js:24](/home/user/deutschmeister/src/data/pricing.js:24), [SubscriptionContext.jsx:262](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:262)) |

The course standard expects integrated input, production, feedback and review—not simply a resource itinerary. This makes A2’s higher price harder to defend through teaching design alone. ([course-standard:67](/home/user/deutschmeister/docs/course-standard-2026-09-12.md:67))

Quotas matter commercially: Pro includes **20 writing evaluations and 30 five-minute speaking sessions per calendar month**, plus 50 sentence analyses daily. Ten- and fifteen-minute speaking sessions debit wallet credit. The trial provides two writing evaluations and two speaking sessions total. These allowances comfortably cover the telc programme’s six writing submissions and ten rehearsals, absent competing usage. ([evaluate-writing.mjs:20](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:20), [speakingUsage.mjs:10](/home/user/deutschmeister/netlify/functions/_shared/speakingUsage.mjs:10), [speaking-session.mjs:214](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:214), [analyze-sentence.mjs:30](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:30))

**5. Known assessment shortcuts weaken completion as proof.**

A1.2 shipped with documented reading shortcuts scoring **46/64**, listening-option leakage affecting **12/16 papers**, and checkpoints where up to **7/8 pool tasks** had appeared in practice. These are accepted documented issues, not newly observed customer incidents. ([HANDOFF:11](/home/user/deutschmeister/docs/course-factory/a12-rebuild/HANDOFF-2026-10-16.md:11), [HANDOFF:20](/home/user/deutschmeister/docs/course-factory/a12-rebuild/HANDOFF-2026-10-16.md:20))

The current listening builder still permits overlapping answer-option content; feedback deferral covers reading only. ([buildCheckpoint.js:701](/home/user/deutschmeister/src/lib/checkpoint/buildCheckpoint.js:701), [feedback.js:11](/home/user/deutschmeister/src/lib/checkpoint/feedback.js:11))

Conversely, do not recycle repaired checker bugs as current defects: main contains guards against changed negation, grammatical endings and incorrect selected options receiving typo credit. ([check.js:377](/home/user/deutschmeister/src/lib/lesson/check.js:377), [check.js:415](/home/user/deutschmeister/src/lib/lesson/check.js:415))

Speaking assessment has another boundary: it grades transcripts, explicitly lacking audio evidence for pronunciation, pauses or speaking speed. ([evaluate-speaking.mjs:84](/home/user/deutschmeister/netlify/functions/evaluate-speaking.mjs:84))

**6. There is almost no outcome evidence yet.**

The supplied measurements show 17 writing submissions ever, four writing users in 60 days, one completed telc mock and no telc programme progress rows. They cannot establish learning effectiveness. (`FACTS.md:19`, `:20`, `:21`)

The assessor document is a commissioning brief with an unset fee, not completed validation. ([daf-assessor-brief.md:30](/home/user/deutschmeister/docs/telc-pilot/daf-assessor-brief.md:30))

I disagree with the current evaluation’s emphasis that reach remains the binding constraint and tickets need no work. Distribution and credible fulfilment are joint constraints; assessment defects merit correction under the approved freeze exemption. ([sales-evaluation:43](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:43), [million-plan:277](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:277))

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| **(a) Paid delivery** | **3/5** | Real tools and curriculum, but only A1.1/A1.2 use the rebuilt engine. `curricula/index.js:16`. |
| **(b) Quality/refund risk** | **2/5** | Accepted assessment leakage and exposure. `HANDOFF:11`, `:41`. |
| **(c) Readiness evidence** | **1/5** | One completed telc mock; no supplied verified external outcomes. `FACTS.md:20`. |
| **(d) Exam-demand coverage** | **2/5** | Three-point letters and shortened objective formats. `writingTasks.js:27`, `telcB1.js:40`. |
| **(e) €149 differentiation** | **1/5** | Live FAQ identifies the premium primarily as the plan over Pro. `site__telc-b1-komplettvorbereitung.md:112`. |

## 4. Recommendations ranked by expected revenue per hour

**Planning assumptions, unverified:** effects below are incremental retained gross receipts across one ten-buyer pilot; estimates overlap and must not be added. Ranking uses the stated central scenario, not measured conversion uplift. Release dependencies still apply.

| Rank | Change and exact location | Effort / authority | Expected effect and kill rule |
|---|---|---|---|
| **1** | Publish one assessor-checked original letter, revision and feedback sample; align the deliverable specification in `astro-site/src/pages/telc-b1-komplettvorbereitung.astro`. | **4–6h, [owner]** for public claims; agents prepare. | Assume one additional retained sale: **€149 / 5h ≈ €30/h**. Reject any sample containing a material grading error; inspect buyer understanding before expansion. |
| **2** | Add the bounded pilot deliverables below to `docs/telc-pilot/README.md` and the programme. | **12h setup + 7.5h delivery, [owner]**. | Assume two additional retained sales: **≈€15/h**. After a reconciled 300 qualified views, fewer than three sales triggers one package revision, following the approved rule. |
| **3** | Correct telc tasks in both writing-bank copies; implement an exam-specific rubric in `evaluate-writing.mjs`; execute the assessor brief. | **12h engineering + 6h assessor, [owner]** for funding/function release. | Assume one avoided €149 refund: **≈€8/h**. Stop readiness positioning if more than 2/20 letters differ by over one agreed band; investigate false passes separately. |
| **4** | Build complete-format rehearsals and explanations in `src/data/mockExams/telcB1*.js`, including missing reading, Sprachbausteine and listening formats. | **24–40h, [agents]** for content/UI. | Assume 1.5 retained sales: **≈€7/h**. Independent format review must pass; stop adding forms after two until paid usage supports more. |
| **5** | Remove A1.2 option leakage and mirrored-pair shortcuts in `buildCheckpoint.js`, `feedback.js` and `a12.lesen.js`. | **6–10h, [agents]**. | Assume half an avoided €40 refund: **≈€2.50/h**. Require adversarial no-audio/no-text shortcut checks; reduce existing debt measurements. |
| **6** | Add outcome capture after the exam date: proposed `exam_results` migration and an in-app question. | **6–10h, [owner]** for privacy/measurement decisions. | **€0 immediate revenue assumed**; enables later proof. Report purchasers, respondents and verified results separately; publish no pass-rate claim from a selective denominator. |

**Clean sheet: hybrid.** Copy-only evolution is cheap but leaves the premium weak. Replacing the app with tutoring increases recurring labour. Reusing the software with bounded independent assessment offers a testable premium. This requires an explicit owner amendment to the deferred human-review offer; the existing legal release gate remains mandatory. ([million-plan:289](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:289), [million-plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128))

The minimum €149 pilot should promise:

- Ten places for learners near B1 with a booked telc date.
- Twenty dated sessions over four weeks and 90 days of included Pro.
- Two distinct complete-format rehearsals, with explanations.
- Three four-Leitpunkt letters, each drafted and revised: six AI evaluations.
- Independent assessment of the first and final letters.
- Ten five-minute AI speaking practices plus one real 15-minute paired rehearsal with assessor feedback.
- Three targeted remediation sets and a final evidence report identifying remaining weaknesses—without predicting a pass.

**Economics assumption:** cap assessor delivery at 45 minutes per buyer at €30/hour: €22.50. At 19% VAT and 10% refunds, €149 yields approximately €112.69 before fulfilment. Subtract €22.50 assessment and the plan’s €20 AI-cost ceiling: approximately **€70 contribution before acquisition and overhead**. Calibration costs of an assumed €250–400 are additional. If delivery exceeds its time cap, simplify before scaling.

## 5. What remains unverified

Live authenticated delivery, audio correctness, applied quota migrations, actual refunds, assessor availability and willingness to pay remain unverified. Verify them through an owner-authorised purchase/refund/replay, timed learner walkthroughs, independent listening/letter review and the ten-person paid cohort.

I inspected both supplied mobile PNGs; `capture/shots/` was empty and `INDEX.md` unavailable. Competitor purchase experiences and comparative teaching quality were not verified. No test-suite result or independently verified examination pass is claimed.

