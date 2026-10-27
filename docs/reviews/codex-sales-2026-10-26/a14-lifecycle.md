**1. Score: 2/5**

DeutschMeister has functioning email infrastructure, but no evidenced, permissioned sales journey tied to the learner’s exam. Historical lifecycle counts prove the system has operated; they do not prove delivery, engagement or sales. The dominant daily mail sends learners toward Sentence X-Ray and A1.1, while the trial sequence sells Pro. The root cause is that **sending eligibility is built around account status and opt-out, rather than documented permission, exam intent and purchase state**. ([FACTS.md:23](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:23), [campaign selector:89](/home/user/deutschmeister/netlify/functions/send-campaign.mjs:89))

**2. Findings, most important first**

**The apparent list asset is commercially restricted by missing permission evidence.**

The signup form collects email and password without a marketing opt-in. Campaign eligibility means confirmed, non-disposable and not opted out. The trial selector accepts anyone whose daily-sentence flag is not explicitly false. These are exclusion rules, not evidence of consent. ([SignupPage.jsx:391](/home/user/deutschmeister/src/pages/SignupPage.jsx:391), [send-campaign.mjs:99](/home/user/deutschmeister/netlify/functions/send-campaign.mjs:99), [trial-lifecycle.mjs:232](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:232))

Under §7(2)(2) UWG, advertising email generally requires prior express consent. The §7(3) exception requires all four conditions: address obtained with a sale, advertising for the seller’s own similar products, no objection, and the required objection notice at collection and every use. Neither confirmation nor engagement establishes those conditions. Classification of individual service messages remains an owner legal decision. ([Official §7 UWG](https://www.gesetze-im-internet.de/uwg_2004/__7.html))

The approved plan explicitly counts the legacy list as zero until its basis is documented. This costs access to potential buyers, but claiming the whole list is marketable would invent a revenue asset. ([million-plan:290](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:290))

**The automated journey promotes the wrong next step for an exam chooser.**

The following is **code on main**, checked against local `origin/main`; deployment of these exact templates is unverified. Historical counts come from FACTS and should be read as lifecycle ledger rows.

| Mail | Timing and count | Content, CTA and offer | Permission/unsubscribe position |
|---|---|---|---|
| Auth confirmation/reset | Signup or user request; counts unverified | Confirm account → `/login`; reset password → `/update-password`. No product offer. [AuthContext:142](/home/user/deutschmeister/src/contexts/AuthContext.jsx:142), [188](/home/user/deutschmeister/src/contexts/AuthContext.jsx:188) | Narrow account-service treatment proposed; no marketing unsubscribe needed for that scope. |
| Welcome | Trigger recorded on account insertion; count unverified | English; “Start Lektion 1” of A1.1, plus X-Ray and social links. [welcome:8](/home/user/deutschmeister/netlify/functions/send-welcome-email.mjs:8), [trigger:57](/home/user/deutschmeister/migrations/2026-08-16-welcome-email-webhook.sql:57) | Promotional/learning basis unproven; no unsubscribe in template. |
| `confirm_nudge` | 10:30 UTC; once, account age 2–90 days; maximum 40/run; **290** rows | “Activate my account”; signed continuation link. No paid offer. [nudge:49](/home/user/deutschmeister/netlify/functions/confirmation-nudge.mjs:49), [75](/home/user/deutschmeister/netlify/functions/confirmation-nudge.mjs:75) | Honours global opt-out; no unsubscribe link. Owner must approve service classification and age window. |
| Activation D1/D4 | 09:30 UTC; respective day windows 1–2 and 4–5; **107/104** rows | D1: A1.1 Lektion 1. D4: Sentence X-Ray. English; no exam-specific offer. [activation:74](/home/user/deutschmeister/netlify/functions/activation-lifecycle.mjs:74), [148](/home/user/deutschmeister/netlify/functions/activation-lifecycle.mjs:148) | Confirmed, inactive, not opted out; marketing basis unproven; global unsubscribe. |
| Trial D3/D6/ended | 08:00 UTC; start-relative D3 window, expiry within 24 hours, then 1–2 days after expiry; **185/172/172** rows | D3: X-Ray/listening/speaking. D6: “Keep Pro — €9.99/month”. Ended: “Restore Pro access”. [trial:85](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:85), [174](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:174) | Promotional basis unproven; global unsubscribe. |
| Course reminders | 18:00 UTC; activity 20–44 hours ago; maximum three/7 days; **~20** rows | German **Sie**; next accessible lesson, checkpoint or final test. Retention, without a purchase CTA. [reminder:68](/home/user/deutschmeister/netlify/functions/course-reminder.mjs:68), [325](/home/user/deutschmeister/netlify/functions/course-reminder.mjs:325) | Requested-learning basis unproven; global unsubscribe. |
| Daily sentence | 07:00 UTC; approximately **1,100/day in the approved plan**, not freshly measured today | Same daily selection for everyone; X-Ray primary, free A1.1 secondary. [daily:30](/home/user/deutschmeister/netlify/functions/daily-sentence.mjs:30), [158](/home/user/deutschmeister/netlify/functions/daily-sentence.mjs:158), [plan:341](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:341) | Learning request unproven; confirmed/non-opted-out selection; global unsubscribe. |
| Campaigns | Operator-triggered, not automated; historical send count unverified | Arbitrary subject/body; staged level-course sequence proposes D0/D3/D7. [campaign:35](/home/user/deutschmeister/netlify/functions/send-campaign.mjs:35), [draft:55](/home/user/deutschmeister/drafts/launch-sublevel-courses-2026-09.md:55) | Script basis gate exists; endpoint itself lacks recipient-level consent inclusion. |
| Dunning | Payment-failure event; intended maximum once/subscription/7 days; **seven failure rows**, not seven confirmed emails | English; update payment method; portal fallback; retain existing Pro. [webhook:691](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:691), [854](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:854) | Payment-service treatment proposed; independent of promotional opt-out. |

Counts: [FACTS.md:23](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:23); payment failures: [FACTS.md:13](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:13).

Approximately 1,100 daily sends imply **33,000 monthly messages**, assuming 30 days. Yet their main destination is a free tool. The separate course and trial schedules also lack a shared frequency budget. More sending is not an evidenced commercial lever. ([daily:83](/home/user/deutschmeister/netlify/functions/daily-sentence.mjs:83), [course-reminder:36](/home/user/deutschmeister/netlify/functions/course-reminder.mjs:36))

**The useful CRM data exists, but urgency and permission are missing.**

There are **1,748 accounts, 1,194 confirmed and 554 unconfirmed**. Among 233 recent signups, 95 named an exam: Goethe B1 45, Goethe A1 11, telc B2 11, Goethe A2 10, telc B1 10 and DTZ eight. Nine chose none; 129 left it unset. Only **four profiles have an exam date**. These are preferences, not qualified buyers or consented recipients. ([FACTS.md:5](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:5), [9](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:9))

A new CRM would waste effort: the admin directory already filters by exam, activation and payment status; User 360 exposes exam date, language and email preference. What is missing is reliable permission and an actionable exam-date segment. ([admin-directory:19](/home/user/deutschmeister/netlify/functions/admin-directory.mjs:19), [admin-user360:33](/home/user/deutschmeister/netlify/functions/admin-user360.mjs:33))

**Delivery reporting overstates what is known.**

Lifecycle rows are claimed **before** sending, with `sent_at` populated on insertion. The marketing dashboard nevertheless describes them as Resend-accepted sends. Failed sends can therefore appear successful. There is no local delivery/bounce event ledger. ([migration:13](/home/user/deutschmeister/migrations/2026-08-17-lifecycle-and-listening.sql:13), [admin-marketing:47](/home/user/deutschmeister/netlify/functions/admin-marketing.mjs:47), [admin-status:64](/home/user/deutschmeister/netlify/functions/admin-status.mjs:64))

The 68% confirmation rate is an account outcome, not inbox placement. FACTS records 58 signup attempts with auth email-rate errors in 60 days; those errors do not establish the cause of all 554 unconfirmed accounts. ([FACTS.md:5](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:5))

Unsubscribe implementation deserves credit: signed links, GET without mutation, POST withdrawal, one-click headers and fail-closed opt-out reads. However, one flag stops learning reminders **and** offers, preventing granular preferences. Live execution remains unverified. ([unsubscribe:4](/home/user/deutschmeister/netlify/functions/unsubscribe.mjs:4), [shared headers:61](/home/user/deutschmeister/netlify/functions/_shared/unsubscribe.mjs:61))

**Telegram is an unverified asset, not an owned distribution channel yet.**

The repository deliberately excludes Telegram because channel ownership is unverified. Attribution support and Telegram-caption drafts do not establish subscribers, reach or purchases. The live homepage capture lists “YouTube”, “Instagram” and “Facebook”; no Telegram subscription asset is evidenced there. WhatsApp CRM or broadcast implementation was not found in the inspected application/function paths. ([navigation:123](/home/user/deutschmeister/src/data/navigation.js:123), `site__home.md:666–668`)

**Disagreement with the current evaluation:** parking a large notification system is sensible, but collecting narrow, explicit exam-email permission should be part of the pilot foundation. Also, its claim that `firstRun` ignores exams is stale: main already supports an accessible exam writing/mock task. The emails remain generic. ([evaluation:114](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:114), [firstRun:107](/home/user/deutschmeister/src/lib/firstRun.js:107))

**3. Sub-scores**

| Question | Score | Evidence |
|---|---:|---|
| (a) Automated content, timing and offers | **2/5** | Multiple working jobs; generic destinations and Pro offer dominate the inventory above. |
| (b) Legal basis and unsubscribe | **1/5** | Opt-out selectors exist; recipient-level promotional permission is unproven. `send-campaign.mjs:89`. |
| (c) List assets and segmentation | **2/5** | 95 named exams, four dates; permission intersection unknown. `FACTS.md:9`. |
| (d) Community channels | **1/5** | Telegram ownership expressly unverified. `navigation.js:123`. |
| (e) Signup-to-purchase sequence | **1/5** | Activation templates ignore exam choice. `activation-lifecycle.mjs:148`. |
| (f) Deliverability | **2/5** | Branded sender and unsubscribe safeguards; no local delivery evidence. `admin-status.mjs:64`. |

**4. Recommendations ranked by expected revenue per hour**

**Compulsory prerequisite — [owner]: approve and enforce message eligibility.** At `SignupPage.jsx`, `AuthContext.jsx`, an additive consent migration and every optional-mail selector, record scope, wording version, source, timestamp, verification and withdrawal. Offer unchecked choices for exam preparation/offers and optional learning mail. Obtain legacy permissions during future in-app visits. Keep the global stop effective. Strip unapproved promotional content from account messages. **Effort: 6–10 engineering hours; counsel time unverified. Measure: every optional recipient has auditable permission; otherwise exclude them.** The approved release gate remains binding. ([plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128))

Revenue scenarios below are assumptions, not forecasts. At €149, 19% VAT and 10% refunds, retained revenue is **€112.69/sale**, before fees and fulfilment.

| Rank | Change and exact location | Expected effect and effort | Owner and measure/kill rule |
|---|---|---|---|
| 1 | One capped placement through a verified, relevant Telegram/community audience; reuse approved material and `docs/tracking-links.md` conventions. | **100 qualified views × 1–3% purchase = €113–338**; 2–3 hours, conditional on obtaining that exposure. | **[owner]** Ownership, audience fit and posting approval first. No extra packs. Respect the plan’s ≥300-view sales judgement rule; insufficient exposure is not rejection. |
| 2 | Review the three at-risk accounts through existing admin operations and dunning outcomes in `lemonsqueezy-webhook.mjs`. | Assuming three monthly €9.99 subscriptions, maximum approximately **€25/month excluding VAT** recovered; 1–2 hours. | **[owner]** Existing payment-service scope only. Measure recovered unique invoices and retained collections; stop extra intervention after the capped review. |
| 3 | Replace exam choosers’ generic activation/trial templates with the sequence below; retain existing claim, dry-run and canary controls. | At current telc inflow, approximately **€5–11/month** under the assumptions below; 6–10 hours. | **[owner]** Audience, timing and brand messages require approval. After 100 eligible delivered recipients, inspect task starts and qualified offer views; apply the approved purchase rule only at sufficient exposure. |
| 4 | Audit confirmation delivery, SMTP configuration, rate limits and `/login` continuation before changing reminder volume. | Raising confirmation from 68% to 80% would add roughly **eight confirmed accounts/month**; sales value unverified. 1–2 hours initially. | **[owner]** Auth changes reserved. Measure confirmation within 24 hours/seven days for new cohorts; do not resend the historical backlog indiscriminately. |
| 5 | Correct “sent” reporting in `admin-marketing.mjs` and `src/pages/admin/MarketingPage.jsx`; distinguish claimed from accepted. | **€0 direct**; prevents false optimisation. 1–2 hours. | **[agents]** Normal reporting correction. Reconcile sampled rows with provider records. Delivery-event ingestion is a separate **[owner]** endpoint/security release. |

The small email estimate matters: `65 × (10/233 telc share) × 68% confirmation × assumed 50% opt-in ≈ 0.95` permissioned telc prospects/month. At an assumed 5–10% incremental purchase rate, that produces €5–11. Better lifecycle copy cannot replace qualified acquisition. Inputs: [FACTS.md:5–9](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:5).

The proposed sequence is **[owner]** throughout:

- **Signup:** account confirmation only. Independently record and verify any requested marketing scope.
- **After confirmation/exam choice:** ask for exam date, including “not booked”, and communication language. Link to the matching accessible first task.
- **D1, no exam task:** one reminder to that task.
- **D3, task completed:** link to feedback and the next revision; otherwise suppress this message.
- **D6:** show the matching offer’s mechanism and total price. Telc checkout only after the release gate and sale activation; other exams receive their matching available route.
- **D8:** one final relevant decision message, then stop the sales sequence.
- **Purchase/withdrawal:** immediately suppress prospect messages. Purchased-course service reminders follow actual progress. Use one shared optional-mail budget: maximum one/24 hours and three/seven days.

Derive prices from `pricing.js` and claims from `marketing.js`. Today’s canonical telc price is still €89; €149 is the approved planned pilot price, requiring aligned owner-approved implementation. ([pricing:81](/home/user/deutschmeister/src/data/pricing.js:81), [plan:136](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:136))

Use email as the permissioned follow-up channel and Telegram as one bounded distribution experiment. Defer WhatsApp and moderated groups. Judge Telegram by qualified visits, retained purchases and owner time; subscriber count is an intermediate measure. ([plan:206](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:206))

**5. What I could not verify and how to verify it**

- **Live flags, templates and unsubscribe behaviour:** inspect Netlify settings/deploy identity and already-delivered message headers; compare with main.
- **SPF, DKIM, DMARC, Return-Path, SMTP and suppressions:** inspect Resend domain status, DNS and auth configuration. The code’s `zaid@deutsch-meister.de` sender proves no authentication status. Resend supports subdomains for reputation segmentation. ([Resend domain documentation](https://resend.com/docs/dashboard/domains/introduction))
- **Actual lawful list size and email revenue:** reconcile permission records, confirmation, withdrawals, provider outcomes, purchases and refunds. Historical sends are insufficient.
- **Telegram ownership, subscriber count and audience fit:** owner supplies channel administration evidence and aggregate analytics.
- **Capture completeness:** `capture/INDEX.md` was absent and `capture/shots/` empty. I inspected the alternative `scratchpad/shots/home.png` and `pricing.png`; competitor lifecycle journeys were unavailable.

No files were changed and no messages were sent.

