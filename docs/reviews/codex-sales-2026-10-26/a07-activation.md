**1. Score: 2/5**

DeutschMeister can demonstrate value, but it does not consistently connect that value to a relevant purchase. Beginners have a useful first exercise; exam learners have writing feedback or mocks; several contextual offers already exist. The root cause is **losing the learner’s commercial intent between onboarding, activity detection, feedback and checkout**. Meanwhile, the free-course completion offer receives little observed exposure, and telc’s strongest feedback moment leads to an unavailable product. Evidence: [firstRun.js:107](/home/user/deutschmeister/src/lib/firstRun.js:107), [examFeedbackOffer.js:22](/home/user/deutschmeister/src/lib/examFeedbackOffer.js:22), FACTS.md:17.

This was read-only. The activation files examined match local `main`; authenticated production behaviour remains unverified. Live observations below come from the supplied captures and FACTS pack. I opened both supplied mobile PNGs; they show public entry pages, not the signed-in journey.

**2. Findings, most important first**

**A. Exam choice is collected, then subordinated to the beginner journey.**

Onboarding asks which exam the learner wants, then offers “start Lektion 1” or “find my level.” Both destinations ignore the chosen exam. The exam task becomes primary only on the dashboard. Evidence: [IntroSlides.jsx:132](/home/user/deutschmeister/src/components/onboarding/IntroSlides.jsx:132), [firstRun.js:176](/home/user/deutschmeister/src/lib/firstRun.js:176).

The dashboard does honour `exam_track`, contrary to the approved plan’s older diagnosis. However, it first requires **no lesson activity**. After any writing submission or completed mock, it retires the exam invitation and restores the course/placement decision. The activity query does not distinguish exam writing from course writing. Evidence: [firstRun.js:108](/home/user/deutschmeister/src/lib/firstRun.js:108), [firstRun.js:136](/home/user/deutschmeister/src/lib/firstRun.js:136), [examActivity.js:23](/home/user/deutschmeister/src/services/examActivity.js:23).

**Why it costs sales:** choosing an exam does not establish a persistent exam journey. Competing activities can suppress that journey before it demonstrates its value.

I therefore disagree with the current evaluation’s proposed fix, “`firstRun` honours `exam_track`”: that logic already exists. The missing work is onboarding navigation and continuity after the first task. See [sales evaluation:106](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:106).

**B. The largest observed exam segment gets a substantial mock rather than quick personalised feedback.**

Goethe B1 and DTZ represent **53 of 95 named exam choices** in 60 days—56%, calculated from FACTS.md:9. Neither track has an AI-writing bank; first-run therefore opens its mock. Evidence: [examTracks.js:68](/home/user/deutschmeister/src/data/examTracks.js:68), [firstRun.js:118](/home/user/deutschmeister/src/lib/firstRun.js:118).

Their section budgets total **60 and 65 minutes**, respectively. These are configured budgets, not measured completion times. The overview displays the total. Their writing components provide self-checks rather than AI correction. Evidence: [goetheB1.js:18](/home/user/deutschmeister/src/data/mockExams/goetheB1.js:18), [dtz.js:20](/home/user/deutschmeister/src/data/mockExams/dtz.js:20), [ModelltestOverview.jsx:78](/home/user/deutschmeister/src/pages/Modelltest/ModelltestOverview.jsx:78).

The result sends learners to practice material or back to the dashboard, without a paid continuation offer. Evidence: [ModelltestResult.jsx:257](/home/user/deutschmeister/src/pages/Modelltest/ModelltestResult.jsx:257).

**Why it costs sales:** the segment with most recorded interest faces substantial effort before feedback, then receives no clear commercial next step. Actual abandonment at this stage is **unverified**.

**C. Upsells exist, but their relevance and purchase readiness differ sharply.**

- **TrialBanner:** always promotes Pro through `/pricing/`, independently of the learner’s task. [TrialBanner.jsx:86](/home/user/deutschmeister/src/components/TrialBanner.jsx:86).
- **Writing feedback:** telc leads to its course page while off sale; A1/A2 can lead to level-course pages; other supported writing tracks fall back to Pro. The trial’s writing-limit offer also points to Pro. [examFeedbackOffer.js:22](/home/user/deutschmeister/src/lib/examFeedbackOffer.js:22).
- **Speaking limit:** comparatively strong. It offers a relevant course only when a checkout identifier exists, otherwise monthly Pro through a concrete purchase URL. [speakingOffer.js:89](/home/user/deutschmeister/src/lib/speakingOffer.js:89).
- **Course completion:** correctly derives the next course and hides Buy without a checkout identifier. During an active trial, it offers continuation because access already exists. [CourseCompletePage.jsx:48](/home/user/deutschmeister/src/pages/CourseCompletePage.jsx:48).

Level paywalls also preserve useful context: `/subscription` can lead with the blocked level’s course. Exam routes do not match that level-path resolver. Evidence: [SubscriptionPage.jsx:183](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:183), [checkoutAccess.js:48](/home/user/deutschmeister/src/lib/checkoutAccess.js:48).

Live telc evidence is decisive: `site__telc-b1-komplettvorbereitung.md:58` says **“Der Kurs startet in Kürze”**, while line 98 displays **“89,00 €”**.

**Why it costs sales:** a learner can reach useful feedback and still have to restart product discovery—or encounter an unavailable offer. Pro remains a purchase route; “nothing can be bought at B1” would be false.

**D. A1.1 has an early learning success, but little observed exposure to its paid continuation.**

In 14 days: seven L1 starts, four finishes, three L2 starts, one CP1 pass and zero L12 finishes. Four/seven is 57%, but these are small, mixed-age activity counts—not a mature cohort completion rate. Evidence: FACTS.md:17.

The beginner’s first useful result already happens early: see/hear an introduction, write it with their own name, then recall it with the model hidden. Guest signup appears at a saved pause and allows continuation. Evidence: [PretestStage.jsx:30](/home/user/deutschmeister/src/components/lesson/PretestStage.jsx:30), [SaveProgressAsk.jsx:9](/home/user/deutschmeister/src/components/course/SaveProgressAsk.jsx:9).

The full L1 estimate evaluates to **20–40 minutes**, using explicitly assumed step timings—not the curriculum’s 15-minute design target. Evidence: [a11.meta.js:317](/home/user/deutschmeister/src/data/curricula/a11.meta.js:317).

**Why it costs sales:** finishing the entire free course is a distant commercial trigger with no recent L12 completion observed. This does **not** justify rebuilding the course or charging earlier.

**E. The trial sells elapsed time and feature inventory, not experienced progress.**

The offer is seven days, no card, two speaking sessions and two writing evaluations total. X-Ray allows 1/day anonymously or after expiry, 10/day during trial and 50/day with Pro. Pro includes 30 five-minute speaking sessions and 20 writing evaluations monthly. A1.1 has a separate course-writing allowance. Evidence: FACTS.md:28; [marketing.js:41](/home/user/deutschmeister/src/data/marketing.js:41), [marketing.js:75](/home/user/deutschmeister/src/data/marketing.js:75).

The lifecycle asks are:

- **Day 3:** try X-Ray, listening and speaking; primary CTA opens X-Ray.
- **Day 6:** keep Pro for its feature allowances; CTA opens pricing.
- **Ended:** restore Pro; CTA again opens pricing.

None uses the chosen exam, completed feedback or next task. Evidence: [trial-lifecycle.mjs:85](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:85).

Only 11 distinct users used speaking in 30 days; four used writing in 60 days. X-Ray spikes are anonymous and not verified as humans. Email-send counts prove neither engagement nor conversion. Evidence: FACTS.md:19,22–23.

**Why it costs sales:** the seven-day clock does not ensure that the learner experiences either of the scarce AI samples.

**3. Sub-scores**

| Question | Score | Evidence |
|---|---:|---|
| (a) First run and placement | **2/5** | Exam-aware dashboard; onboarding exits remain course/placement: `firstRun.js:176`. |
| (b) A1.1 funnel and time-to-value | **2/5** | Early personalised introduction exists; L12 finishes 0/14d: `PretestStage.jsx:30`, FACTS.md:17. |
| (c) Trial design and lifecycle | **2/5** | Low-friction trial, generic calendar emails: `trial-lifecycle.mjs:85`. |
| (d) Upsell moments and buyability | **2/5** | Working purchase routes coexist with off-sale telc feedback: `examFeedbackOffer.js:22`. |
| (e) AI tools as hook | **3/5** | Concrete allowances and strong speaking-limit routing; human X-Ray conversion unverified: `speakingOffer.js:89`, FACTS.md:22. |
| (f) Exam-buyer “aha” | **2/5** | Actionable writing corrections exist, but the largest segment enters longer mocks: `SchreibenPage.jsx:440`, `examTracks.js:68`. |

**4. Recommendations ranked by expected revenue per hour**

**Clean sheet: hybrid.** A task-first demonstration followed by the relevant continuation is the alternative to generic trial-first browsing. Evolving only banners leaves the routing problem intact; replacing the whole funnel adds unverified cost. Reuse existing tasks and entitlements, preserve seven days, and repair the transitions first.

All estimates below are **unverified scenarios**, gross receipts over 30 days, excluding VAT, fees and costs. Historical throughput proxies are approximately five telc and 43 other named exam choices monthly; these are not current conversion cohorts. Ranges overlap and must not be added.

The owner’s release gate remains a prerequisite for public sales, including existing products. Pro optimisation and broader curriculum work remain frozen unless reopened. Evidence: [million plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128), [million plan:275](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:275).

**1. Make the telc feedback offer actionable — [owner].**

**Location:** `examFeedbackOffer.js:22`, `SchreibenPage.jsx:493`, telc landing page and checkout configuration.

**Exact moment:** immediately after the first useful correction. After the gate and approved repricing, show: **“telc B1 Komplettvorbereitung · 149 € einmalig”**, with the approved included-access terms. Until then, retain the pilot’s unavailable status and offer an explicitly optional **Pro · 9,99 €/Monat** continuation.

**Effect/effort:** 2–3 hours for the transition, excluding gate work. Assuming ten percentage points more purchases among five eligible telc users: **€0–75/month after launch**, up to roughly **€37/hour**. Pro-only receipts would be €0–5.

**Measure/kill:** zero unavailable checkout destinations; ≥5% offer clicks. Judge package demand only after the plan’s 300 qualified offer views.

**2. Carry exam intent through onboarding and the next task — [agents].**

**Location:** `IntroSlides.jsx:132`, `firstRun.js:107`, `examActivity.js:23`, `LevelTestResults.jsx:78`.

An exam chooser’s primary exit should name and open their exam task. Preserve beginner/placement alternatives. After feedback, offer the next relevant task rather than retiring the exam journey because any writing row exists.

**Exam path:** choose exam → existing task → specific correction → optional second trial evaluation → matching paid continuation. Target first feedback within 15 minutes; that target requires measurement. Telc’s existing prompt asks for 80–140 words; do not market it as a three-second diagnostic. Evidence: [writingTasks.js:18](/home/user/deutschmeister/src/data/writingTasks.js:18).

**Effect/effort:** 4–6 hours; €0–59/month under a five-point purchase uplift across the historical exam mix, up to €15/hour.

**Measure/kill:** target ≥35% completing an exam task within seven days, matching the approved plan. Repair the first failing transition if missed; preserve access rules.

**3. Rewrite lifecycle around unfinished work and demonstrated value — [owner].**

**Location:** `trial-lifecycle.mjs:85` and recipient/context selection.

Day 3 should resume the chosen task. Day 6 should reference an actual result and show its relevant continuation. Expiry should explain what remains free and offer the next paid action, without inventing prior activity.

**Effect/effort:** 3–5 hours; €0–22/month assuming five points more first-month Pro purchases among 43 eligible non-telc learners, up to €7/hour.

**Measure/kill:** completed tasks and retained payments per eligible recipient; pause on consent, suppression or unsubscribe failures. Sending requires the documented mail basis; `email_daily_sentence !== false` alone does not establish it. Evidence: [trial-lifecycle.mjs:225](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:225), million plan:290.

**4. Test a shorter existing-content sample for Goethe B1/DTZ — [owner], deferred.**

**Location:** `ModelltestOverview.jsx`, `ModelltestRun.jsx`, `ModelltestResult.jsx`.

After the narrow telc work, consider a small existing reading exercise with immediate explanation, keeping current entitlements. Show **Pro · 9,99 €/Monat** after the learner sees their specific mistake and next practice task. The “aha” hypothesis is understanding what to fix—not receiving a pass prediction.

**Effect/effort:** 8–12 hours; €0–13/month at five points more purchases among approximately 27 monthly Goethe B1/DTZ choosers, up to €2/hour.

**Measure/kill:** target ≥60% sample completion and median feedback within five minutes. Stop expansion if observed learners still cannot explain the value.

**5. Preserve the beginner success; expose continuation gently — [owner], lowest priority.**

**Location:** `PretestStage.jsx`, `RecapStage.jsx`, checkpoint recap, `CourseCompletePage.jsx`.

**Beginner path:** first personalised introduction → L1 → save progress → L2. At CP1, optionally preview **“A1.2 · 40 € einmalig · 3 Monate Pro inklusive.”** Keep continuing A1.1 primary. At completed A1.1, show that same offer with Buy when checkout is configured; during trial, show continuation and explain later access choices. Price/access provenance: [pricing.js:114](/home/user/deutschmeister/src/data/pricing.js:114).

**Effect/effort:** 3–5 hours; roughly €0–4/month using current CP1 throughput and an assumed five-point purchase uplift.

**Measure/kill:** defer unless the owner reopens this work; remove an earlier offer if it disrupts free-course continuation.

**5. What remains unverified**

- **Authenticated production journey:** verify with an owner-authorised test account, each exam choice, placement result, quota boundary and expired trial.
- **Actual activation time:** measure from entry to useful feedback; configured minutes and editorial estimates are insufficient.
- **Trial-to-paid conversion and email effectiveness:** reconcile signup cohorts, task records, sends, clicks, purchases and refunds. The supplied counts cannot establish causality.
- **Checkout readiness:** verify configured products and approved test-purchase/refund/replay results; source code alone cannot prove store state.
- **Human X-Ray acquisition:** establish human sessions and downstream activation before prioritising its traffic spikes.

Use consented analytics for behavioural detail. Any new processing basis or public measurement endpoint is **[owner]**. Existing analytics require accepted consent; commercial kill rules require a reconciled server-side denominator. Evidence: [analytics.js:26](/home/user/deutschmeister/src/lib/analytics.js:26), [million plan:175](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:175).

