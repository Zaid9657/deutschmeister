### 1. Paused subscribers can delete their accounts while billing remains scheduled

- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/delete-account.mjs:6`, `netlify/functions/delete-account.mjs:74`, `netlify/functions/delete-account.mjs:85`
- What breaks: **Regression.** A subscriber with paused payments deletes their account successfully. Payments can subsequently resume, charging someone whose account and access have disappeared.
- Evidence: `CHARGING_STATUSES` excludes `paused`. Executing the actual handler with a paused monthly subscription, a real provider ID and `cancel_at_period_end:false` returned `200` and invoked `deleteUser`. The provider’s `pause.resumes_at` explicitly schedules continued payment collection. [Lemon Squeezy documentation](https://docs.lemonsqueezy.com/api/subscriptions/the-subscription-object)
- Fix: Require cancellation of paused recurring subscriptions before deletion. Continue exempting complimentary plans without provider IDs.

### 2. Legacy course rows still permit a second recurring subscription

- Severity: HIGH
- Confidence: high
- Location: `src/lib/checkoutAccess.js:23`, `netlify/functions/_shared/subscriptionEntitlement.mjs:113`, `astro-site/src/pages/pricing.astro:588`
- What breaks: **Incomplete a-money#1.** A legacy course buyer still has a recoverable recurring subscription, but `/pricing/` allows another subscription. Both can bill while the app records only one.
- Evidence: Reproducing with the actual `origin/main` handler: create a subscription paid through February 1, then purchase a course before a delayed renewal arrives. Main creates `plan_type:'course'` while retaining the recurring ID. HEAD verification preserves that ID when its active snapshot predates the course, but `hasRecurringBilling()` rejects every course row. Pricing consequently returns `action:'checkout'`. After another subscription is installed, the original subscription’s recovery returns `200` without restoring its recorded identity.
- Fix: Treat a retained, recoverable provider ID as existing billing until reconciliation proves it terminal. Route that state to the billing portal.

### 3. Pre-migration AI fallbacks still allow concurrent spending beyond their caps

- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/analyze-sentence.mjs:123`, `netlify/functions/analyze-sentence.mjs:138`, `netlify/functions/evaluate-speaking.mjs:285`, `netlify/functions/evaluate-speaking.mjs:312`, `migrations/README.md:87`
- What breaks: **Incomplete b-security#1 and previous verification#4.** Before the reservation migrations are applied, concurrent requests bypass X-Ray’s identity/IP limits and speaking evaluation’s daily cap, generating additional provider charges.
- Evidence: Both fallbacks separately count usage and insert reservations. Actual-handler reproduction with missing RPCs produced:
  - X-Ray: three concurrent requests returned `[200,200,200]`, consuming three analyses against an identity limit of one and increasing IP usage from 11 to 14 against a ceiling of 12.
  - Speaking evaluation: three different owned sessions, starting with 19 evaluations, returned `[200,200,200]` and generated three provider calls, leaving 22 evaluations against the cap of 20.
- Fix: Require verified installation of the atomic quota RPCs before enabling these paths, or provide an atomic reservation through already-installed database functionality.

### 4. An older cancellation can overwrite a newer paid renewal

- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/_shared/subscriptionEntitlement.mjs:226`, `netlify/functions/_shared/subscriptionEntitlement.mjs:241`, `netlify/functions/lemonsqueezy-webhook.mjs:199`, `netlify/functions/verify-subscription.mjs:65`
- What breaks: **Remaining defect.** A subscriber resumes a cancelled subscription and renews successfully. Concurrent processing of the older cancellation removes their paid access; manual verification does not recover it.
- Evidence: Reconciliation reads the latest logged snapshot, then unconditionally upserts the subscription. Its own event is logged only afterward. In the signed-handler reproduction, pausing cancellation immediately before its upsert, completing the newer renewal, then releasing cancellation changed `active / March 1 / is_subscribed:true` into `cancelled / February 1 / is_subscribed:false`. Both deliveries returned `200`. Verification returned `not_found` because it selected the processed cancellation by delivery time.
- Fix: Compare provider timestamps atomically with subscription updates, serializing reconciliation for each subscription. Verification must recover from the newest provider snapshot even when that delivery is already processed.

### 5. A refund racing the first order delivery can leave the refunded course active

- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/lemonsqueezy-webhook.mjs:463`, `netlify/functions/lemonsqueezy-webhook.mjs:503`, `netlify/functions/lemonsqueezy-webhook.mjs:546`
- What breaks: **Remaining defect.** The first course-order webhook overlaps its refund. The refund succeeds, but the pending order subsequently grants lifetime course ownership and included Pro. Neither delivery retries.
- Evidence: Granting checks refund logs before inserting the purchase. A refund finding no purchase returns without creating a purchase tombstone. Pausing `order_created` immediately before insertion, completing `order_refunded`, then resuming the order produced `purchaseStatus:"active", pro:true`; both handlers returned `200`.
- Fix: Persist a durable refunded-order record and serialize granting and refunding per order. Purchase insertion must respect a refund committed concurrently.

### 6. A failed feedback write permanently blocks speaking-evaluation recovery

- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/evaluate-speaking.mjs:208`, `netlify/functions/evaluate-speaking.mjs:422`, `netlify/functions/evaluate-speaking.mjs:446`, `src/services/dashboardStats.js:56`
- What breaks: **Regression.** A learner finishes a conversation, but saving its generated feedback temporarily fails. The evaluation remains pending forever, cannot be recovered, and never contributes to dashboard speaking activity. A function timeout after reservation has the same effect.
- Evidence: Existing `_pending` rows return `409 evaluation_in_progress` without expiry or recovery handling. A failed result update merely logs. Actual-handler reproduction returned `200, saved:false`; retrying with healthy storage returned `409`. `tests/speaking-evaluation-reservations.test.mjs:202` explicitly expects this stuck state.
- Fix: Retry feedback persistence and give abandoned reservations a recoverable lease. Preserve consumed usage while allowing safe recovery instead of permanently rejecting the session.

### 7. Writing Formcheck still accepts recipient questions as the writer’s factual details

- Severity: MEDIUM
- Confidence: high
- Location: `src/lib/lesson/writing.js:832`, `src/lib/lesson/writing.js:841`, `src/lib/lesson/writing.js:992`, `src/components/lesson/GradedWriting.jsx:94`
- What breaks: **Incomplete c-course#10.** A1.1 L4 asks when the writer will arrive. Asking Lena whether she will arrive instead receives a green “done” mark. Guests receive this mechanical feedback without AI correction.
- Evidence: Every `wann` shape has `allowQuestions:true`, bypassing the statement filter. `wannShape` accepts a matching task word plus a time. Replacing the canonical L4 sample’s `Wir kommen morgen.` with `Kommst du morgen?` returns `ok:true`, with all six checks passing. L6 likewise accepts replacing the writer’s office availability with `Sind Sie um neun Uhr im Büro?`.
- Fix: Permit interrogative evidence only for requirements requesting questions or genuine scheduling proposals. Questions about recipients must not satisfy factual arrival or availability requirements.

### 8. Lesson recording can start and upload audio after navigation away

- Severity: MEDIUM
- Confidence: high
- Location: `src/components/lesson/ReadAloudLine.jsx:69`, `src/components/lesson/ReadAloudLine.jsx:132`, `src/components/lesson/ReadAloudLine.jsx:141`, `src/components/lesson/ReadAloudLine.jsx:79`, `src/components/lesson/SpeakingStage.jsx:82`
- What breaks: **Remaining defect.** A signed-in learner selects Record, leaves using Skip or Back while permission is pending, then grants microphone permission. The removed component records for eight seconds and uploads the audio for scoring, consuming allowance and capturing unexpected audio.
- Evidence: Cleanup releases only resources already available. After `await getUserMedia(...)`, startup assigns the late stream and starts recording without checking cancellation. An in-memory reproduction using the actual callbacks produced `recorderStarts:1, trackStops:0` after unmount; firing the abandoned timer produced one scoring request.
- Fix: Cancel pending startup during cleanup and immediately stop streams resolving afterward. Apply the cancellation handling already used by coach and placement recording.

## Finding status

Migration-dependent items remain conditional on owner application; excluded previous findings are not repeated above.

- a-money#1: partial — finding 2.
- a-money#2: fixed.
- a-money#3: fixed.
- a-money#4: fixed.
- a-money#5: fixed.
- a-money#6: fixed.
- a-money#7: fixed — separate concurrency defect in finding 4.
- a-money#8: fixed.
- a-money#9: fixed.
- a-money#10: fixed.
- a-money#11: fixed.
- a-money#12: fixed.
- a-money#13: fixed.
- b-security#1: partial — finding 3.
- b-security#2: fixed.
- b-security#3: fixed.
- b-security#4: partial — SQL fix present; owner application pending, excluded as requested.
- b-security#5: fixed.
- b-security#6: partial — SQL fix present; owner application pending, excluded as requested.
- b-security#7: fixed.
- b-security#8: fixed — separate concurrency defect in finding 4.
- b-security#9: partial — SQL fix present; owner application pending, excluded as requested.
- b-security#10: fixed.
- b-security#11: fixed.
- b-security#12: partial — corrected replacement SQL present; owner application pending.
- c-course#1: fixed.
- c-course#2: partial — SQL fix present; owner application pending, excluded as requested.
- c-course#3: fixed.
- c-course#4: fixed.
- c-course#5: fixed.
- c-course#6: fixed.
- c-course#7: fixed.
- c-course#8: fixed.
- c-course#9: fixed.
- c-course#10: partial — finding 7.
- c-course#11: fixed.
- c-course#12: fixed.
- d-routing#1: fixed.
- d-routing#2: fixed.
- d-routing#3: fixed.
- d-routing#4: fixed.
- d-routing#5: fixed.
- d-routing#6: fixed.
- d-routing#7: fixed.
- d-routing#8: fixed.
- d-routing#9: fixed.
- d-routing#10: fixed.
- d-routing#11: fixed.
- d-routing#12: fixed.
- d-routing#13: fixed.
- e-frontend#1: fixed.
- e-frontend#2: fixed — separate deletion regression in finding 1.
- e-frontend#3: fixed.
- e-frontend#4: fixed.
- e-frontend#5: fixed.
- e-frontend#6: fixed — additional recording path in finding 8.
- e-frontend#7: fixed.
- e-frontend#8: fixed — including ordinary-unmount flushing.
- e-frontend#9: fixed.
- e-frontend#10: fixed.
- e-frontend#11: fixed.
- e-frontend#12: fixed.
- e-frontend#13: fixed.
- e-frontend#14: fixed.
- e-frontend#15: fixed.
- f-structure#1: fixed.
- f-structure#2: fixed.
- f-structure#3: fixed.
- f-structure#4: fixed.
- f-structure#5: partial — unused `lucide-react` remains at `astro-site/package.json:19` and in its lockfile.
- f-structure#6: fixed.
- f-structure#7: fixed.
- f-structure#8: fixed.
- f-structure#9: not fixed — scoring remains in `src/lib/checkpoint/buildCheckpoint.js:2752`, directly imported by `src/services/checkpointService.js:3`.

## Checked and fine

- Sequential subscription recovery, premium-grant preservation, confirmed paid-through deadlines, course-window unions and order replay deadlines.
- Reading ID/level binding, coupon product/price validation, permanent-ownership checks and pending course-purchase verification.
- Admin selector validation, verified caller identity, writing-attempt ownership and rejection before provider work when reservations fail.
- Migrated speaking reservation/refund coordination and claim-scoped delivery across all four lifecycle mailers.
- New SQL signatures, columns, conflict keys and grants match recorded schemas; reminder extraction safely ignores checkpoints and oversized suffixes.
- A1.1/A1.2 selectable correct answers, strong-verb checks, NFC normalization, guest-save recovery, review seeding and calendar-day scheduling.
- Exam save ordering and unmount flushing; placement scoring; consent withdrawal; onboarding; listening resume; coach/placement startup cancellation.
- Grammar publication filtering, complete-snapshot fallback, continuation destinations, Astro navigation, schema ownership, podcast metadata and search attribution.
- All 18 shared-file comparisons, archive hashes, migration-ledger coverage, focused read-only suites, lint and changed `.mjs` syntax checks passed.
- Existing `dist/` passed checks for 138 pages and 133 sitemap URLs; no fresh build or browser hydration verification was performed.
- Modified existing assertions showed no weakened checks. No files were created, modified or deleted; the working tree remained clean.