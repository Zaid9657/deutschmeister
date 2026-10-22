### 1. Existing subscribers can purchase a second recurring subscription
- Severity: HIGH
- Confidence: high
- Location: astro-site/src/pages/pricing.astro:561; astro-site/src/lib/proCta.js:35; netlify/functions/lemonsqueezy-webhook.mjs:714
- What breaks: A paying Pro member visits `/pricing/` and buys another plan. Both subscriptions can bill them, while the app remembers only the newest subscription.
- Evidence: Pricing checks only `signedIn`, then opens a new checkout. The webhook replaces `lemonsqueezy_subscription_id` using `onConflict: 'user_id'` without cancelling the previous subscription. Purchasing a subscription product creates a recurring subscription. [Provider documentation](https://docs.lemonsqueezy.com/api/subscriptions/the-subscription-object)
- Fix: Check current billing state before opening checkout and direct existing recurring subscribers to the billing portal.

### 2. Recovery paths grant Pro from expired subscription events
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/verify-subscription.mjs:109; netlify/functions/verify-subscription.mjs:120; netlify/functions/lemonsqueezy-webhook.mjs:848
- What breaks: A learner with an expired subscription and an old failed webhook log can invoke verification and receive another paid period. An out-of-order expired update with no matching subscription row also grants Pro profile flags.
- Evidence: Verification ignores the payload’s status, substitutes `Date.now() + …30` when `renews_at` is missing, and writes `status: 'active'`. The webhook’s fallback independently writes `is_subscribed: true` for every status. In-memory execution reproduced both cases.
- Fix: Use one status-aware reconciliation path for normal delivery and recovery. Never manufacture a fresh paid period or grant Pro from a terminal event.

### 3. Failed renewals advance the date that controls paid access
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/lemonsqueezy-webhook.mjs:766; netlify/functions/lemonsqueezy-webhook.mjs:775; src/services/subscriptionService.js:142
- What breaks: A subscriber stops paying but retains paid SPA content because each failed-renewal update moves their access deadline forward.
- Evidence: Updates copy `attributes.renews_at` into `subscription_end`; frontend access checks only whether that date is future, regardless of status. For `past_due`, the provider defines `renews_at` as the next charge attempt, not proof of payment. This exact leak is also recorded in docs/SCORECARD.md:84. [Provider documentation](https://docs.lemonsqueezy.com/api/subscriptions/the-subscription-object)
- Fix: Track paid-through access separately from future charge attempts. Apply an explicit failed-payment grace rule without extending access on unsuccessful renewals.

### 4. Pro customers are charged after two daily speaking sessions despite the monthly allowance
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/speaking-session.mjs:25; netlify/functions/speaking-session.mjs:222; src/data/marketing.js:54; astro-site/src/pages/pricing.astro:217
- What breaks: A Pro learner uses their first two monthly sessions today. Their third five-minute session requires €1 despite the advertised 30 sessions per month; without credit, it returns HTTP 402.
- Evidence: The subscriber branch uses `usedToday < 2 ? 0 : PRICE_CENTS[5]` and bypasses the monthly `checkUsage()` limit. Executing the handler reproduced a 100-cent debit attempt after two sessions; someone with 30 monthly sessions but none today received another free session.
- Fix: Enforce the advertised monthly allowance in the session-opening path and derive the displayed allowance from the same check.

### 5. Changing the reading URL’s level bypasses the paid-level guard
- Severity: HIGH
- Confidence: high
- Location: src/App.jsx:394; src/components/LevelSubscriptionGuard.jsx:20; src/pages/ReadingLessonPage.jsx:69; src/services/readingService.js:65
- What breaks: An expired-trial learner takes a known B2 lesson URL and changes its level segment to `a1.1`. `/reading/a1.1/<B2-lesson-ID>` displays the paid lesson.
- Evidence: The guard immediately admits the free URL level. The page calls `getReadingLessonById(lessonId)`, whose query filters only by ID; it never verifies the fetched lesson’s actual level. Authenticated reading access is permitted by migrations/2026-08-16-fix-rls-security.sql:137.
- Fix: Fetch by both lesson ID and route level, and evaluate access against the fetched lesson’s actual level before rendering.

### 6. An old subscription’s expiry can revoke a new course’s included Pro
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/lemonsqueezy-webhook.mjs:540; netlify/functions/lemonsqueezy-webhook.mjs:919; netlify/functions/lemonsqueezy-webhook.mjs:949
- What breaks: A learner’s monthly subscription expires, then they buy a course. Replaying the old subscription’s expiry removes paid writing feedback and Pro-only grammar exercise access during the course’s included window.
- Evidence: The course upsert replaces the row but omits `lemonsqueezy_subscription_id`, preserving the old ID. Expiry subsequently matches that ID and writes false/free profile flags. Executing this sequence reproduced the revocation while the new purchase remained active.
- Fix: Clear obsolete provider subscription fields when installing a course window, and prevent events for an old subscription from modifying the current entitlement.

### 7. Successful payment recovery never restores paid profile flags
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/lemonsqueezy-webhook.mjs:792; netlify/functions/lemonsqueezy-webhook.mjs:802; netlify/functions/_shared/speakingUsage.mjs:24; netlify/functions/evaluate-writing.mjs:358
- What breaks: A subscriber’s renewal fails and later succeeds. Their SPA subscription becomes active again, but writing feedback still rejects exam submissions and Astro grammar exercises remain locked.
- Evidence: Existing-row updates clear profile flags for `past_due`/`unpaid`/`expired` but never restore them when status returns to `active`. Payment-success handling only updates `price_paid`. Writing and Astro access read the stale profile flags.
- Fix: Reconcile profile flags whenever a current subscription’s entitlement changes, including successful recovery.

### 8. Refunding one course removes another course’s remaining Pro window
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/lemonsqueezy-webhook.mjs:534; netlify/functions/lemonsqueezy-webhook.mjs:615; netlify/functions/lemonsqueezy-webhook.mjs:626
- What breaks: A learner buys course A on day 0 and course B on day 30, then refunds B on day 45. They lose Pro immediately although unrefunded A still includes it until day 90.
- Evidence: Each purchase replaces the single course subscription row. Refunding the currently recorded order expires that row and clears profile flags without checking other purchases. The actual handlers reproduced this sequence in memory.
- Fix: After a refund, recompute remaining Pro access from all unrefunded purchase windows and any live recurring subscription.

### 9. Replaying a fulfilled course order starts another 90-day Pro window
- Severity: MEDIUM
- Confidence: high
- Location: netlify/functions/lemonsqueezy-webhook.mjs:442; netlify/functions/lemonsqueezy-webhook.mjs:511; netlify/functions/lemonsqueezy-webhook.mjs:524
- What breaks: Resending an already fulfilled order months later reactivates Pro without another payment.
- Evidence: The existing-purchase check rejects only refunded rows. Every delivery recalculates `now + course.proDays` and overwrites both access deadlines. Replaying one order on day 200 retained one purchase but granted another 90 days.
- Fix: Preserve the original fulfillment window on retries. Reconcile subscription access from stored purchase deadlines instead of delivery time.

### 10. Synchronizing profile flags grants permanent Pro to lifetime course owners
- Severity: MEDIUM
- Confidence: high
- Location: netlify/functions/admin-actions.mjs:42; netlify/functions/admin-actions.mjs:141; netlify/functions/trial-lifecycle.mjs:286
- What breaks: After a course’s included Pro expires, an administrator uses “Profil-Flags mit Abos abgleichen.” The learner regains Pro AI quotas and all-level Astro exercise access indefinitely.
- Evidence: `flagsFromRows()` treats any purchase with `status === 'active'` as Pro, ignoring `access_until`. Lifetime purchases remain active. The expiry sweep cannot repair this afterward because it processes only subscription rows whose status is still `active`.
- Fix: Derive Pro flags from unexpired access windows. Keep lifetime course ownership separate from time-limited Pro benefits.

### 11. Coupon validation receives neither the selected product nor its price
- Severity: MEDIUM
- Confidence: high
- Location: src/pages/SubscriptionPage.jsx:259; src/components/CouponField.jsx:20; netlify/functions/coupon-validate.mjs:25; netlify/functions/_shared/adminCouponsLib.mjs:61
- What breaks: A valid product-restricted coupon is always rejected by the learner form. Conversely, an unrestricted coupon with a minimum order value can be reported as applicable without checking that minimum.
- Evidence: The sole `CouponField` invocation supplies no variant, and its request omits the amount. Scoped coupons reject `variantId:null`; minimum-order validation runs only when `amountMinor != null`. Both outcomes reproduced against the actual validation code.
- Fix: Validate a selected product key and resolve its numeric provider variant and price server-side. Checkout UUIDs must remain separate from numeric variant IDs.

### 12. Resumed checkout ignores existing band and bundle ownership
- Severity: MEDIUM
- Confidence: high
- Location: src/pages/SubscriptionPage.jsx:192; src/pages/SubscriptionPage.jsx:395; astro-site/src/components/CourseCheckout.astro:34
- What breaks: A signed-out owner of `course_a2` clicks “Buy A2.1,” then logs into their existing account. Checkout automatically opens for a level they already own.
- Evidence: Resumption checks only `!hasProduct(key)`. The displayed card correctly also checks `ownsBundle` and `ownsLevel`. With `course_a2` ownership, the real mapping produces an owned card but an allowed resumed checkout.
- Fix: Apply the card’s permanent-ownership predicate before resuming checkout, including legacy band and bundle purchases.

### 13. Existing Pro access stops course-purchase verification before its first refresh
- Severity: MEDIUM
- Confidence: high
- Location: src/pages/SubscriptionPage.jsx:69; src/pages/SubscriptionPage.jsx:152; src/components/LemonSqueezyProvider.jsx:29
- What breaks: A Pro member buys a lifetime course through the SPA overlay. After payment, the course still shows “Buy” until an unrelated refresh, allowing another purchase.
- Evidence: `startPurchase()` starts polling, but the effect immediately stops it under `isSubscribed && verifying` because Pro was already active. `Checkout.Success` only records analytics. Executing these callbacks produced zero subscription refreshes and a completion signal before payment.
- Fix: Poll for the pending product’s entitlement rather than pre-existing Pro access. Refresh purchases or navigate to the success page when checkout succeeds.

## Checked and fine

- Webhook signatures use the unparsed body, a mandatory secret, timing-safe comparison, and rejection of malformed signatures.
- Sequential refund-before-order and refund-then-replay paths prevent course reactivation.
- Purchase SQL provides unique order IDs, owner-only reads, and no client write policies.
- Current and retired product mappings preserve the correct lifetime level entitlements.
- Normal one-time purchase surfaces hide unset checkout IDs and respect the telc sale flag.
- Signup, confirmation and login preserve valid sublevel buy intents.
- Recorded signup trials last seven days; existing trial dates and paid profile fields are protected from client updates.
- Billing portal destinations, course-versus-recurring labels, and dunning URL host checks are consistent.
- Pricing twins and derived price arithmetic agree.
- Focused helper/guard suites passed; dependency-loading checks were blocked by missing `@supabase/supabase-js`. Behavioral reproductions used in-memory mocks; the working tree remained unchanged.