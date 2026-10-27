## 1. Score: **2/5**

**Billing is substantially repaired; retention remains commercially unproven.** Today’s facts show €11.09 MRR and **one renewing payer**, despite five subscription rows labelled `active`. Seven failure records do not establish seven lost customers or seven recoverable invoices. The root cause is that DeutschMeister can provision access, but cannot yet demonstrate a repeatable path from payment to sustained use, successful renewal and another purchase. [FACTS.md:13](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:13)

I checked billing files against the locally available `origin/main` at `4be1474`; they match. Twenty existing focused test files passed. That establishes code behaviour under their fixtures, **not deployed billing correctness**. No files were changed.

## 2. Findings, most important first

### A. Recoverable cash is small, identifiable—and unreconciled

The immediate task is to resolve the **three at-risk subscription records**, separating failed payments, deliberate cancellations, stale deadlines and grants. Counting `active` rows exaggerates the business: the metrics definition requires a future paid period, positive price and recurring plan before counting a renewing payer. [Metrics definition:42](/home/user/deutschmeister/migrations/2026-09-03-weekly-metrics.sql:42)

The approved plan’s “11 of 12 subscriptions failed” and €18.69 collected per Pro payer are historical observations. They are useful warnings, not today’s failure rate or a mature LTV estimate. [Million plan:54](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:54)

**Illustrative monthly cash exposure**, using €9.99 per subscription; these are scenarios, not measured losses:

| Rank | Leak or exposure | Current volume | At 10× volume |
|---|---|---:|---:|
| 1 | Three at-risk records, if all remain recoverable monthly payers | €0–€29.97 | €0–€299.70 |
| 2 | Losing the sole renewing payer | €11.09 MRR exposed | €110.90 MRR exposed |
| 3 | Missing ticket-to-Pro continuation: assume one ticket buyer/month and 20% buy one additional month | €2/month opportunity | €20/month opportunity |
| — | Incorrect charges, duplicate subscriptions or excess AI access | Unverified | Unverified |

The third row uses the **one recent known paid ticket** as a flow assumption, not a measured monthly acquisition rate. Its 90-day window has not matured. The first two rows describe different populations; neither proves an existing loss. [FACTS.md:12](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:12)

### B. Dunning has a usable recovery destination, but no demonstrated recovery loop

The old dead-end payment link has been addressed. The webhook finds a recent signed update-payment URL and otherwise uses the Lemon Squeezy billing portal; the email includes the portal as a fallback. [Link selection:55](/home/user/deutschmeister/netlify/functions/_shared/dunningLink.mjs:55), [Email:872](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:872)

The remaining weaknesses are operational:

- **“Delivered” is overstated.** A successful Resend HTTP response causes `dunning_sent_at` to be stamped. This establishes API acceptance, not inbox delivery, a click, an updated card or recovered cash. [Webhook:753](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:753)
- **Recovery depends on another failure event.** A failed send is logged and acknowledged; the owner alert explicitly says the next failed retry will attempt mail again. No independent retry queue appears in this handler. [Webhook:778](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:778)
- **The seven-day throttle is not an atomic claim.** Concurrent handlers can both pass its read before sending. It also filters by `failed_at`, rather than the actual send timestamp. [Webhook:699](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:699)

The root cause is treating a billing notification as a completed collection process. Its revenue effect is **unverified** until failures are joined to subsequent successful payments and restored access.

### C. The October 22 money defects are mostly fixed on main

The previous review should no longer be used as a list of outstanding defects. Here is the disposition of **every numbered money finding**:

| Review item | Current code assessment |
|---|---|
| **1. Second recurring subscription** | Normal site flow fixed: existing recurring identities, including failed/paused plans, go to billing management. Direct checkout links and concurrent purchases remain unverified. [Checkout guard:27](/home/user/deutschmeister/src/lib/checkoutAccess.js:27), [Pricing click:618](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:618) |
| **2. Recovery grants expired events** | Fixed: verification uses shared status-aware reconciliation; it does not manufacture another 30 days. [Verification:95](/home/user/deutschmeister/netlify/functions/verify-subscription.mjs:95) |
| **3. Failed renewals extend access** | Fixed: retry dates do not advance paid-through access; legacy failed-payment deadlines are repaired from confirmed snapshots. [Entitlement:80](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:80), [Repair:201](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:201) |
| **4. Speaking charges after two daily sessions** | Fixed: five-minute included sessions use the monthly allowance. Longer sessions remain chargeable. [Session:214](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:214), [Allowance:80](/home/user/deutschmeister/netlify/functions/_shared/speakingUsage.mjs:80) |
| **5. Reading URL bypass** | Fixed: lesson lookup requires both ID and route level. [Reading service:65](/home/user/deutschmeister/src/services/readingService.js:65) |
| **6. Old expiry revokes a newer course window** | Fixed through subscription identity/timestamp handling and independent purchase windows. [Entitlement:308](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:308) |
| **7. Recovered payer retains free profile flags** | Fixed: reconciliation writes the derived subscribed/tier flags on recovery. [Entitlement:252](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:252) |
| **8. Refunding B destroys A’s included Pro** | Fixed: refund recomputes access from remaining purchases and recurring entitlement. [Webhook:604](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:604) |
| **9. Order replay restarts 90 days** | Fixed: original purchase/provider dates determine the deadline. [Webhook:538](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:538) |
| **10. Admin sync grants lifetime Pro** | Fixed: active course ownership alone is insufficient; an unexpired window is required. [Admin entitlement:4](/home/user/deutschmeister/netlify/functions/_shared/adminEntitlement.mjs:4) |
| **11. Coupon lacks product/amount** | Fixed: server resolves the selected product’s variant and amount. [Coupon validation:26](/home/user/deutschmeister/netlify/functions/coupon-validate.mjs:26) |
| **12. Resumed checkout ignores bundles** | Fixed: shared ownership predicate covers bands/bundles before resuming. [Subscription page:237](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:237) |
| **13. Existing Pro prematurely confirms course purchase** | Fixed: polling waits for the pending product’s entitlement. [Subscription page:92](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:92) |

Related billing items also have fixes: account changes invalidate stale entitlement requests; lifecycle sends use only successfully claimed recipients; speaking starts reserve funds before AI work, and turn settlement coordinates refunds. The migration ledger records the speaking reservation migration as applied. [Context:47](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:47), [Lifecycle:694](/home/user/deutschmeister/netlify/functions/course-reminder.mjs:694), [Speaking:214](/home/user/deutschmeister/netlify/functions/speaking-session.mjs:214), [Migration ledger:84](/home/user/deutschmeister/migrations/README.md:84)

**One remaining architectural defect:** course-window expiry runs after checks for Resend and unsubscribe secrets. Missing mail credentials therefore skip entitlement expiry too, while server AI access trusts stored profile flags. Production impact is unverified. [Expiry handler:390](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:390), [AI tier resolution:15](/home/user/deutschmeister/netlify/functions/_shared/speakingUsage.mjs:15)

### D. Tickets have a next step, but deliberately postpone subscription revenue

The post-purchase experience is stronger than a generic “missing upsell” diagnosis suggests. It identifies the ticket, displays the Pro deadline and opens the purchased course. Course completion already points toward the next level. [Success page:192](/home/user/deutschmeister/src/pages/SubscriptionSuccessPage.jsx:192), [Dashboard:285](/home/user/deutschmeister/src/pages/DashboardPage.jsx:285)

After included Pro expires, `hasLevelAccess()` preserves bought-level access. Owned courses also retain their limited course-writing allowance; expiry does not remove every writing benefit. [Context:252](/home/user/deutschmeister/src/contexts/SubscriptionContext.jsx:252), [Writing:403](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:403)

However, overlapping ticket windows use the **latest deadline**, rather than stacking another 90 days. Buying the next ticket early gives permanent ownership but less incremental Pro time. That can weaken repeat-purchase incentives; its conversion effect is unverified. [Entitlement:24](/home/user/deutschmeister/netlify/functions/_shared/subscriptionEntitlement.mjs:24)

Paid-customer retention is also thin: the automated journeys concentrate on registration/trial days, while the shared lifecycle state records whether learning ever happened—not paid-customer recency or cancellation reasons. Low overall usage is evident, but payer-specific inactivity is unverified. [Trial windows:174](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:174), [Lifecycle state:56](/home/user/deutschmeister/migrations/2026-09-28-lifecycle-lesson-activity.sql:56), [FACTS.md:17](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:17)

### E. Annual billing improves collection only if buyers accept the commitment

Monthly is the default. Annual costs €79.99 against €119.88 for twelve monthly payments: €39.89 less, or the displayed 33% saving. Annual overtakes monthly receipts at approximately **8.01 paid months**. It could improve cash collection from short-lived subscribers, but conversion, refunds and plan mix are unverified. [Prices:24](/home/user/deutschmeister/src/data/pricing.js:24), [Default:520](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:520)

Do not interpret this as permission to push annual: Pro optimisation is explicitly frozen. [Kill list:287](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:287)

**Revenue LTV scenarios**, assuming German 19% VAT and the approved model’s 10% refund allowance; fees, AI and support costs remain excluded:

| Product | Assumption | Retained revenue/customer |
|---|---|---:|
| Pro monthly | 2 / 4 / 8 collected months | €15.11 / €30.22 / €60.44 |
| Pro yearly | One collected annual charge | €60.50 |
| A1.2 ticket | €40; no subsequent purchase | €30.25 |
| A2.1 / A2.2 ticket | €50 each; no subsequent purchase | €37.82 each |
| Ticket plus continuation | 20% buy three further Pro months | Add €4.53 per initial buyer |
| telc pilot | Approved €149; one purchase | €112.69 prospective |
| Later exam package | €199–249; one purchase | €150.50–188.32 prospective |

Prices derive from the catalogue; exam assumptions follow the approved plan. No exam-package LTV has been observed. Legacy purchase rows must be reconciled before assigning them paid revenue. [Catalogue:114](/home/user/deutschmeister/src/data/pricing.js:114), [Model:66](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:66), [FACTS.md:12](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:12)

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| **(a) Subscription lifecycle** | **4/5** | Shared reconciliation fixes the reviewed state errors; expiry still depends on mail credentials. [Handler:390](/home/user/deutschmeister/netlify/functions/trial-lifecycle.mjs:390) |
| **(b) Failed-payment recovery** | **2/5** | Correct portal path; send acceptance lacks demonstrated cash recovery. [Webhook:767](/home/user/deutschmeister/netlify/functions/lemonsqueezy-webhook.mjs:767) |
| **(c) Monthly/yearly mix** | **2/5** | Clear incentive, monthly default; actual mix unverified. [Pricing:520](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:520) |
| **(d) Ticket continuation** | **3/5** | Ownership survives expiry and next-course navigation exists. [Dashboard:285](/home/user/deutschmeister/src/pages/DashboardPage.jsx:285) |
| **(e) Churn/win-back** | **1/5** | Lifecycle state lacks paid-customer recency/reason segmentation. [State:56](/home/user/deutschmeister/migrations/2026-09-28-lifecycle-lesson-activity.sql:56) |
| **(f) LTV measurement** | **1/5** | One renewing payer and ambiguous legacy collections cannot establish product cohorts. [FACTS.md:12](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:12) |

## 4. Recommendations ranked by expected revenue per hour

The estimates below are decision assumptions. Recovery actions share one small pool; their benefits must not be added.

| Rank | Change and exact location | Effect / effort | Owner and measure rule |
|---|---|---|---|
| **1** | Reconcile each at-risk record against provider invoices and `payment_failures`; owner handles appropriate recovery contact. | Assume one recovered monthly payer: **€7.56 retained revenue/month**, **0.5–1 hour**. | **[owner]** Stop after all three cases have an explained disposition; count successful collection plus restored access. |
| **2** | Make dunning retryable and claim sends atomically in `lemonsqueezy-webhook.mjs:699–797`; distinguish accepted, delivered and recovered outcomes. | **€0–€22.67/month**, shared recovery ceiling; **3–5 hours**. | **[owner]** Keep the first fix bounded; prove failed-send retry and concurrent-event behaviour before release. |
| **3** | Separate expiry execution from email credential checks in `trial-lifecycle.mjs:390–420`. | Prevent unpriced excess AI access; **1–2 hours**. | **[owner]** Pass expiry with mail credentials absent, while retaining lifetime level ownership. |
| **4** | Extend the read-only reporting around `docs/agents/margin-per-sale.sql` with product cohorts, collected renewals, refunds, paid activity and recovery attribution. | Direct uplift **unverified**; **2–3 hours**. | **[agents]** Reconcile every current paid customer to provider records; make no churn claim without renewal opportunities. |

The purchase → refund → replay test remains a mandatory owner release gate regardless of ROI ranking. Add recovered-payment access and duplicate-checkout cases to that exercise. [Release gate:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128)

**[owner] Park annual-default changes and new ticket-expiry campaigns.** Reconsider only after reopening the strategy freeze and observing matured paid cohorts. Promotional mail additionally needs the documented consent basis required by the plan. [Kill list:287](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:287)

## 5. What I could not verify

- **Deployment and real charging:** verify the deployed commit and perform the owner’s billing matrix against provider records.
- **Seven failure rows:** reconcile invoice IDs, retries, send outcomes and subsequent collections.
- **Actual LTV/churn/mix:** export paid invoices by product and customer, separating grants, refunds and customers whose renewal dates have not arrived.
- **Capture completeness:** the supplied `capture/INDEX.md` and competitor captures were absent. I opened the available homepage/pricing PNGs under `scratchpad/shots/`; authenticated post-purchase screens remain unverified.

I agree with the current evaluation’s **2/5**, but disagree with its justification: “five active” obscures the single renewing payer, and historical failures obscure substantial billing repairs. The remaining problem is proving retained revenue after correct fulfilment. [Current evaluation:62](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:62)

