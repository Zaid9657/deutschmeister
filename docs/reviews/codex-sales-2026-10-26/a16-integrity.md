## 1. Score: **2/5**

Revenue integrity has improved substantially since October 22, but it still depends too much on browser locks, mutable entitlement flags and counters that measure successful delivery rather than provider spending. Most reported defects are fixed on current `main`; **a refund race remains reproducible, paid grammar answers are publicly downloadable, and repeated speaking cancellations can restore allowance after incurring AI costs**. These are material against **€11.09 MRR and one renewing payer**, although actual abuse losses are unverified. Evidence: FACTS.md, Money; [speaking-session.mjs:257](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:257); [refund settlement SQL:141](/home/user/deutschmeister/migrations/2026-10-22-speaking-reservations.sql:141).

Scope: local `main` is `4be1474`; the checkout’s payment/security code matches it. Twenty-five relevant test files passed. I changed no files.

## 2. Findings, most important first

### 1. Restoring a learner’s allowance also restores an attacker’s spending capacity

**Root cause: customer allowances are being used as the infrastructure spending budget.**

Speaking reserves before generation, correctly fixing empty-wallet abuse. However, it then generates an opening reply and audio; cancellation without a learner turn deletes the usage reservation or refunds the wallet. Placement cancellations also disappear from its start limits. Consequently, an account can repeatedly incur opening costs without consuming its lasting allowance. Evidence: [speaking-session.mjs:214](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:214), [generation:257](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:257), [refund SQL:141](/home/user/deutschmeister/migrations/2026-10-22-speaking-reservations.sql:141), [placement SQL:59](/home/user/deutschmeister/migrations/2026-10-25-placement-speaking-cap.sql:59).

X-Ray and writing similarly erase reservations after unusable model output. That is reasonable customer treatment, but provider expenditure survives the refund. Whether an attacker can reliably force unusable output is **unverified**. Evidence: [analyze-sentence.mjs:429](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:429); [evaluate-writing.mjs:536](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:536).

**Commercial consequence:** paying customers can lose service when somebody else exhausts provider credit. A separate, non-refundable operational attempt budget is needed.

### 2. The enforced Pro allowance can exceed the subscription’s revenue

Pro still allows **50 X-Rays/day**, with a **16,000-output-token ceiling**. The approved plan’s proposed reduction to 20/day has not reached these constants. Evidence: [analyze-sentence.mjs:30](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:30), [token ceiling:364](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:364); [approved plan:171](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:171).

At an assumed 1,000 input and 1,000 billed output tokens, Sonnet 5 costs approximately **€0.0105/call** using $2/$10 per million tokens and assumed EUR/USD 1.14. At 1,500 monthly calls, that is **€15.79**, before speaking, writing or hosting. At the configured output ceiling, the same input assumption produces **€213.16/month**. These are scenarios, not measured averages. [Official Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

Monthly Pro charges **€9.99 gross**, approximately **€8.39 excluding assumed 19% VAT**, before fees. Evidence: [pricing.js:24](/home/user/deutschmeister/src/data/pricing.js:24).

Caching helps repeated examples, but typed sentences bypass that cache. Evidence: [analyze-sentence.mjs:181](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:181), [cache selection:343](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:343).

### 3. Concurrent refund and fulfilment can leave refunded access active

I reproduced this entirely in memory using the real signed-webhook handler and the existing test harness:

1. Order processing checks for an existing purchase and refund log.
2. Before its purchase insert, the refund completes, finds no purchase, logs successfully and returns 200.
3. Order processing inserts an active purchase and also returns 200.

**Final state: active purchase plus recorded refund.**

The check and insertion are separate operations; uniqueness prevents duplicate order rows, not this race. Evidence: [refund check:496](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:496), [purchase insert:543](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:543), [refund without purchase:586](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:586).

Sequential refund/replay is fixed. Concurrent delivery is still open. This belongs inside the existing purchase/refund/replay release gate: [approved plan:137](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:137).

### 4. Paid content has presentation locks rather than complete delivery controls

`hasLevelAccess` correctly combines free level, trial/Pro and lifetime ownership. Refunded purchases are excluded by the service query. Evidence: [SubscriptionContext.jsx:262](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:262); [subscriptionService.js:36](/home/user/deutschmeister/src/services/subscriptionService.js:36).

However:

- Reading/listening SQL permits **all authenticated users** to read paid content, without checking entitlement. Evidence: [RLS SQL:137](/home/user/deutschmeister/migrations/2026-08-16-fix-rls-security.sql:137).
- Astro sends exercises into the client island before its browser access decision. Evidence: [grammar page:566](/home/user/deutschmeister/astro-site/src/pages/grammar/[level]/[slug].astro:566); [ExercisePlayer.jsx:339](/home/user/deutschmeister/astro-site/src/components/ExercisePlayer.jsx:339).
- A fresh unauthenticated HTML retrieval of the [live A1.2 Perfekt page](https://deutsch-meister.de/grammar/a1.2/perfekt-intro/) contained **26 `correct_answer` fields**, including “Ich habe gestern ein Buch gelesen.”

Public grammar explanations are intentional acquisition content. Downloadable paid exercises and answers weaken the paid distinction. Displaced sales are **unverified**; one additional genuinely incremental A1.2 purchase would be €40 gross, not every free reader. Evidence: [pricing.js:114](/home/user/deutschmeister/src/data/pricing.js:114).

### 5. Duplicate billing is prevented in the normal UI, not structurally

Pricing now rechecks billing and sends existing subscribers to the portal. Evidence: [pricing.astro:614](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:614).

Nevertheless, checkout uses reusable provider buy URLs, while reconciliation retains one subscription row per user. Direct links or simultaneous purchases can bypass the browser decision; the handler does not cancel a second provider subscription. Evidence: [checkout URL:79](/home/user/deutschmeister/src/config/lemonsqueezy.js:79); [subscription upsert:328](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:328). Actual duplicate subscriptions are **unverified**.

### October 22 review: current-main recheck

“M” and “B” identify findings in the README-linked money and security reviews. **Fixed means fixed in code**, not independently proved in production.

| Original item | Verdict and current evidence |
|---|---|
| M1: duplicate subscriptions | **Partly fixed:** UI checks billing; direct-checkout exposure remains above. |
| M2: expired events manufacture access | **Fixed:** status-aware reconciliation; [verify-subscription:97](/home/user/deutschmeister/netlify/functions/verify-subscription.mjs:97), [entitlement:80](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:80). |
| M3: failed renewals extend access | **Fixed:** preserves confirmed paid-through date; [entitlement:80](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:80). |
| M4: speaking two/day instead of 30/month | **Fixed:** monthly check and reservation; [speakingUsage:80](/home/user/deutschmeister/netlify/functions/_shared/speakingUsage.mjs:80). |
| M5: reading URL level substitution | **Fixed:** query binds ID and level; [readingService:65](/home/user/deutschmeister/src/services/readingService.js:65). |
| M6: old subscription expiry revokes course Pro | **Fixed:** separates recurring identity and purchase windows; [entitlement:214](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:214). |
| M7/B8: recovered payments leave profile locked | **Fixed:** shared reconciliation restores flags; [entitlement:252](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:252). |
| M8/B7: refund B wipes course A’s Pro | **Fixed:** derives remaining window across purchases; [entitlement:24](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:24). |
| M9/B10: replay restarts 90 days | **Fixed:** reuses original deadline; [entitlement:31](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:31). |
| M10: admin sync grants permanent Pro | **Fixed:** checks unexpired windows; [adminEntitlement:4](/home/user/deutschmeister/netlify/functions/_shared/adminEntitlement.mjs:4). |
| M11: coupon lacks product/amount | **Fixed:** server resolves both; [coupon-validate:26](/home/user/deutschmeister/netlify/functions/coupon-validate.mjs:26). |
| M12: resumed checkout ignores bundle ownership | **Fixed:** shared ownership predicate; [SubscriptionPage:238](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:238). |
| M13: existing Pro stops purchase refresh | **Fixed:** product-specific confirmation and success refresh; [SubscriptionPage:95](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:95), [provider:39](/home/user/deutschmeister/src/components/LemonSqueezyProvider.jsx:39). |
| B1: malformed anonymous X-Ray ID | **Fixed:** bounded validation and pre-call reservation; [aiReservation:27](/home/user/deutschmeister/netlify/functions/_shared/aiReservation.mjs:27), [X-Ray:323](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:323). |
| B2: array-valued admin action bypass | **Fixed:** rejects non-string selectors before authorization; [adminHttp:73](/home/user/deutschmeister/netlify/functions/_shared/adminHttp.mjs:73). |
| B3: invalid writing attempt avoids quota | **Fixed:** ownership validation and reservation precede AI; [writing:364](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:364), [reservation:465](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:465). |
| B4: deleting lesson attempts resets limits | **Fixed by restrictive DELETE policy:** [reservation SQL:11](/home/user/deutschmeister/migrations/2026-10-22-ai-usage-reservations.sql:11). |
| B5: empty-wallet opening spends first | **Fixed:** reservation precedes generation; [speaking-session:217](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:217). |
| B6: end during pending turn refunds delivered speech | **Fixed:** pending turns block settlement; [speaking SQL:130](/home/user/deutschmeister/migrations/2026-10-22-speaking-reservations.sql:130). |
| B9: failed refunds never retried | **Fixed on transactional SQL path:** [speaking SQL:141](/home/user/deutschmeister/migrations/2026-10-22-speaking-reservations.sql:141). |
| B11: ignored claims still email everyone | **Fixed:** sends returned claims only; trial:296, activation:312, confirmation-nudge:241, course-reminder:694 in their respective `netlify/functions/*.mjs`. |
| B12: checkpoint breaks reminders | **Fixed:** bounded lesson-ID extraction; [reminder SQL:34](/home/user/deutschmeister/migrations/2026-10-22-course-reminder-checkpoints.sql:34). |

Other README security items: account deletion now calls server deletion ([delete-account:95](/home/user/deutschmeister/netlify/functions/delete-account.mjs:95)); account entitlement races are fenced ([SubscriptionContext:49](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:49)); consent is rechecked after analytics import ([analytics:45](/home/user/deutschmeister/src/lib/analytics.js:45)). The migration ledger records relevant October 22/25 SQL as applied: [README:83](/home/user/deutschmeister/migrations/README.md:83).

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| (a) Previous money/security findings | **4/5** | Most fixed; normal-flow duplicate prevention remains incomplete. |
| (b) Paywall integrity | **2/5** | Live paid grammar answers downloadable; authenticated content policies unrestricted. |
| (c) AI quotas | **3/5** | Speaking 30/month, writing 20/month and atomic reservations exist; cancellation spending survives refunds. |
| (d) Checkout/webhooks | **3/5** | Replay deadlines fixed; concurrent refund race reproduced. Variant env values remain unverified. |
| (e) Cost containment | **1/5** | FACTS reports speaking `cost_cents=0`; this does not establish provider cost or margin. |

## 4. Recommendations, ranked by conditional contribution protected per hour

Probability-weighted returns are **unverified**. These rankings use stated exposure scenarios, not invented recovered revenue.

| Rank | Change and exact location | Expected effect; effort; authority | Measure/kill rule |
|---|---|---|---|
| 1 | Add an operational attempt budget surviving refunds/cancellations: `speaking-session.mjs:214`, placement SQL:59, `aiReservation.mjs:5`. | At assumed €0.005–0.015/opening, prevent **€50–150/month per 10,000 abusive starts**; **4–8h [owner]**. | After the approved attempt threshold, rejected requests make zero provider calls; legitimate allowance refunds still work. |
| 2 | Bound X-Ray expenditure; align `analyze-sentence.mjs:30,364` with `marketing.js:51`. | A 50→20/day allowance saves **€9.47/month per fully consuming account** under the token assumption; **4–6h [owner]**. | Preserve existing contractual access; require correction quality and measured cost before release. |
| 3 | Enforce paid delivery in reading/listening RLS and Astro exercise loading. | One incremental €40–50 sale yields approximately **€34–42 before fees**, assuming 19% VAT; **8–16h [owner]**. | Paid answers unavailable to expired/non-owning accounts; public explanations and A1.1 remain accessible. |
| 4 | Make fulfilment/refund atomic around `lemonsqueezy-webhook.mjs:478–606`. | Stops refunded access and associated AI expenditure; amount/frequency unknown; **6–10h [owner]**. | Both concurrent event orders must finish refunded; no duplicate window extension. Required before pilot sale. |
| 5 | Reconcile every provider subscription ID, rather than only the retained row: `subscriptionEntitlement.mjs:328`. | Avoid duplicate billing, refunds and support; **4–8h [owner]**. | Every charging provider ID maps to an account; duplicates produce an owner review, not automatic money actions. |
| 6 | Add request-level provider-cost accounting at AI response parsing; prepare a read-only reconciliation report. | Direct revenue effect unverified; **8–12h [owner]** for protected ledger, **2–4h [agents]** for report/tests. | Reconcile retries, failed outputs, cache hits and cancelled starts against provider invoices before scaling. |

**Clean sheet: hybrid.** Retain checkout and JWT verification; make durable server records authoritative for entitlements and spending. Incremental patches are cheaper initially but preserve the split-state problem; replacing the whole commerce system adds migration risk without evidence of higher sales.

I disagree with the current evaluation’s blanket “A1–A2 tickets: no new work” wording ([sales evaluation:87](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:87)). Integrity repairs are necessary commercial work and explicitly exempt from the approved freeze: [million plan:277](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:277).

## 5. Unverified exposure and verification

Monthly stress scenarios, **one actor → ten comparable actors**, not observed losses:

| Exposure | One | Ten |
|---|---:|---:|
| 10,000 cancelled speaking openings | €50–150 | €500–1,500 |
| Full Pro X-Ray allowance | €15.79–213.16 | €158–2,132 |
| Anonymous X-Ray: 12/day/IP | €3.79–51.16 | €38–512 |

Anonymous estimates assume the IP-hash salt is configured; otherwise that ceiling is skipped ([X-Ray:11](/home/user/deutschmeister/netlify/functions/analyze-sentence.mjs:11)). Speaking’s model has no application-level monthly ceiling on repeated cancelled openings. Provider/account limits are unverified.

Additional illustrative costs: 20 primary writing grades ≈€0.50–1 with assumed 2,000 input/1,500 output tokens and up to two calls; exempt revisions add cost. Speaking at 30 sessions ×20 turns ×assumed €0.01/turn adds €6 before openings/grading. These are workload assumptions, not invoices.

FACTS’ latest 146 weekly X-Ray rows extrapolate to roughly **€6.59/month before cache savings**, or €65.90 at tenfold identical traffic. Failed refunded calls may be absent from that denominator.

Verify live SQL policies/RPC definitions, deployed commit, checkout UUID→numeric variant→product mappings, all charging subscriptions, scheduler health and provider invoices using read-only owner-access reports. Then perform the owner-controlled purchase/refund/concurrency gate.

The supplied `capture/INDEX.md` and `capture/shots/` were absent; I inspected the available `scratchpad/shots/home.png` and `pricing.png`. Neither proves backend enforcement.

