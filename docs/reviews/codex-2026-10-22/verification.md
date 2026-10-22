### 1. Recovered subscriptions belonging to legacy course buyers are permanently ignored
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/_shared/subscriptionEntitlement.mjs:98`, `netlify/functions/_shared/subscriptionEntitlement.mjs:183`
- What breaks: **Regression.** A learner bought a course while their recurring subscription was overdue. After deployment, they fix their payment method and recurring billing resumes, but the app ignores subsequent renewals. Pro disappears when their course window expires despite continued payments.
- Evidence: The previous handler could leave the recurring ID on a course row. `retireLegacyCourseId()` unconditionally marks it `subscription_superseded`; subsequently, `if (retired?.length) return reconcileUserEntitlement(...)` ignores even newer active events. Executing the actual old and new handlers in memory reproduced HTTP 200 for recovery followed by `is_subscribed:false` after course expiry.
- Fix: Preserve recoverable recurring identities and distinguish stale events from newer successful recoveries. Derive included course benefits independently from purchase windows.

### 2. The speaking fallback still refunds successfully delivered speech
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/_shared/speakingCloseout.mjs:139`, `netlify/functions/_shared/speakingCloseout.mjs:213`, `netlify/functions/_shared/speakingCloseout.mjs:229`
- What breaks: **Incomplete B6.** Without the speaking migration, a caller ends a paid session during transcription, receives a refund, then receives the completed speech response.
- Evidence: The fallback “reservation” only writes `status:'active'`; settlement exits through `if (legacy) return`. Cancellation independently counts persisted messages. Actual handler reproduction with a missing RPC returned audio and saved a learner message after cancellation had refunded 200 cents.
- Fix: Apply and verify the speaking migration before treating B6 as closed, or persist a fallback turn claim that cancellation must honor.

### 3. Learners can still delete AI usage counters before the migration
- Severity: HIGH
- Confidence: high
- Location: `migrations/2026-09-12-lesson-engine.sql:82`, `netlify/functions/explain-answer.mjs:126`, `netlify/functions/score-readaloud.mjs:105`, `migrations/README.md:84`
- What breaks: **Incomplete B4.** In the supported pre-migration deployment, a learner consumes explanation or read-aloud allowances, deletes their counter rows through Supabase, and repeats paid provider calls.
- Evidence: Existing DELETE RLS checks only `auth.uid() = user_id`. Both legacy fallbacks write into that deletable ledger. The restrictive policy exists only in the migration explicitly recorded as unapplied.
- Fix: Make verified installation of the restrictive policy a deployment prerequisite, or account fallback usage in a protected ledger.

### 4. Concurrent speaking evaluations bypass the daily spending cap
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/evaluate-speaking.mjs:186`, `netlify/functions/evaluate-speaking.mjs:259`, `netlify/functions/evaluate-speaking.mjs:325`
- What breaks: **Remaining defect.** An authenticated caller concurrently evaluates the same owned transcript, exceeding the 20-evaluation daily cap and generating additional Sonnet charges.
- Evidence: The handler counts evaluations, calls the provider, then inserts usage. Starting with 19 rows, three concurrent actual-handler executions returned `[200,200,200]`, made three provider calls, and left 22 evaluations.
- Fix: Atomically reserve evaluation usage before provider work. Make repeated evaluation of the same session idempotent.

### 5. Concurrent lesson completions can still replace Gold before the migration
- Severity: HIGH
- Confidence: high
- Location: `src/services/lessonService.js:73`, `src/services/lessonService.js:79`, `src/services/lessonService.js:95`, `migrations/README.md:82`
- What breaks: **Incomplete C2.** Two devices finish the same lesson while the completion migration is absent. A weaker completion overwrites the learner’s Gold result.
- Evidence: Missing `complete_lesson` falls back to separate read/compare/upsert operations. An interleaved reproduction produced writes `[["gold",0.95],["complete",0.4]]`, leaving the weaker result. The ledger explicitly records the migration as unapplied.
- Fix: Apply and verify the atomic completion RPC before closing C2. Until then, the fallback cannot guarantee preservation under concurrent writes.

### 6. Successful invoices silently remove premium speaking access
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/lemonsqueezy-webhook.mjs:601`, `netlify/functions/_shared/subscriptionEntitlement.mjs:168`, `netlify/functions/admin-actions.mjs:127`
- What breaks: **Regression.** An administrator grants an existing subscriber `premium`, allowing unlimited speaking. Their next successful invoice changes them to Pro and imposes the monthly limit.
- Evidence: Invoice success newly calls reconciliation, which unconditionally writes `subscription_tier: isSubscribed ? 'pro' : 'free'`. An actual signed-handler reproduction changed a paid subscriber from `premium` to `pro`; the previous invoice handler only updated price.
- Fix: Preserve explicit premium grants separately from derived Pro entitlement during reconciliation.

### 7. Failed refunds remain permanently lost through legacy close-out
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/_shared/speakingCloseout.mjs:139`, `netlify/functions/_shared/speakingCloseout.mjs:169`, `netlify/functions/_shared/speakingCloseout.mjs:197`, `netlify/functions/_shared/speakingCloseout.mjs:245`
- What breaks: **Incomplete B9.** Before the speaking migration, a temporary wallet failure during zero-turn cancellation permanently loses the learner’s refund.
- Evidence: Legacy close-out commits `cancelled` before crediting the wallet. Reproduction returned `closed:true,released:false`; after recovery, another end returned `closed:false`, and the stale sweep found no active session to retry.
- Fix: Apply the transactional settlement migration, or retain a durable pending-refund record that is retried independently of session status.

### 8. Leaving a mock exam discards pending answers
- Severity: MEDIUM
- Confidence: high
- Location: `src/pages/Modelltest/ModelltestRun.jsx:168`, `src/pages/Modelltest/ModelltestRun.jsx:221`, `src/pages/Modelltest/examAutosave.js:3`
- What breaks: **Regression.** A learner types continuously, then navigates elsewhere before the 1.5-second debounce fires. Resuming loses everything entered since the last save.
- Evidence: Unmount now calls `autosave.cancel()`, which clears the pending timer without saving its snapshot. The textarea persists only through `schedule()`. Scheduling an answer and invoking cleanup produced zero writes; previously the timer survived SPA navigation.
- Fix: Flush the latest pending snapshot through the ordered writer on ordinary unmount. Retain cancellation for transitions and completion, whose authoritative writes include current answers.

### 9. Complimentary-plan users cannot delete their accounts
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/delete-account.mjs:8`, `netlify/functions/delete-account.mjs:70`, `netlify/functions/admin-actions.mjs:66`, `src/lib/billingPortal.js:54`
- What breaks: **Incomplete E2.** A learner with administrator-granted Pro days confirms deletion and receives instructions to cancel a subscription they do not have.
- Evidence: Admin grants create active monthly rows without a provider subscription ID. The deletion guard treats every active non-course row as charging and does not select the provider ID. Reproduction returned HTTP 409 without deleting anything; the profile correctly offers these users support instead of a billing portal.
- Fix: Select the provider subscription ID and require a real billable recurring subscription before imposing the cancellation gate.

### 10. Astro continuation still sends some expired learners into the paywall
- Severity: MEDIUM
- Confidence: high
- Location: `astro-site/src/layouts/Layout.astro:507`, `astro-site/src/layouts/Layout.astro:524`, `netlify/functions/_shared/subscriptionEntitlement.mjs:161`
- What breaks: **Incomplete D5.** After their last course is refunded, a learner whose placement is A2 clicks “Continue learning.” Astro sends them to the paid A2 course, whose SPA guard redirects to `/subscription`, despite free A1.1 remaining available.
- Evidence: Reconciliation marks the course subscription `expired` while retaining its future deadline. Astro selects only `subscription_end` and interprets any future date as Pro. The actual resolver returned `/course/a2.1` for that row while the SPA status check returned false.
- Fix: Select status and use the same entitlement predicates as the SPA when choosing the continuation destination, including included course windows.

### 11. Strong-verb errors still earn full dictation and review credit
- Severity: MEDIUM
- Confidence: high
- Location: `src/lib/lesson/check.js:156`, `src/lib/lesson/check.js:272`, `src/components/lesson/DictationItem.jsx:51`, `src/data/curricula/a11.js:605`
- What breaks: **Remaining defect.** In L3 dictation, “Ja, er sprecht Englisch und Deutsch.” receives typo credit instead of grammatical correction. Spaced review accepts it too.
- Evidence: `endingDiffers()` checks changed suffixes sharing a stem; `spricht` → `sprecht` escapes it. Executing the actual dictation path returned `TYPO`, producing first-pass accuracy `1`; typed review returned `ok:true`. The lesson explicitly teaches “er spricht.”
- Fix: Reject alternative grammatical verb forms, including stem-vowel changes, before fuzzy spelling comparison while retaining forgiveness for genuine misspellings.

### 12. A learner-controlled progress ID can still stop all course reminders
- Severity: MEDIUM
- Confidence: high
- Location: `migrations/2026-10-22-course-reminder-checkpoints.sql:36`, `migrations/2026-09-12-lesson-engine.sql:28`, `migrations/2026-09-12-lesson-engine.sql:47`
- What breaks: **Incomplete B12.** Even after applying the replacement, a signed-in learner can insert an own progress row with `lektion_id:'a1.1-l2147483648'` and `status:'complete'`. The global reminder query then fails throughout its activity window.
- Evidence: Lesson IDs are unrestricted text, and INSERT RLS checks ownership only. The new function still evaluates `substring(... from '-l([0-9]+)$')::int`; that permitted suffix exceeds the integer range and aborts aggregation.
- Fix: Validate against legitimate lesson numbers before casting. Malformed IDs must yield NULL rather than abort the global query.

### 13. A zero speaking score gives a higher placement than one point
- Severity: MEDIUM
- Confidence: high
- Location: `src/components/LevelTest/placementResult.js:47`, `src/components/LevelTest/placementResult.js:50`, `src/pages/LevelTest.jsx:127`
- What breaks: **Remaining defect.** A learner completes speaking with zero points, yet receives a higher displayed and persisted placement than someone scoring one point.
- Evidence: Demotion requires `speakingPercentage > 0`. Using actual placement questions with correct written answers produced B2.2 for `total_score:0`, but B2.1 for `total_score:1`. A completed zero-score evaluation is incorrectly treated like a skipped section.
- Fix: Distinguish a missing evaluation from a numeric zero. Apply the below-50 rule whenever a valid speaking score exists.

## Finding status

IDs below use the original filename and numbered finding. “Partial” includes supported pre-migration paths; production application was not assumed.

- a-money#1: fixed
- a-money#2: fixed
- a-money#3: fixed
- a-money#4: fixed
- a-money#5: fixed
- a-money#6: fixed — separate recovery regression in finding 1.
- a-money#7: fixed for ordinary recurring recovery — legacy recovery regression in finding 1.
- a-money#8: fixed
- a-money#9: fixed
- a-money#10: fixed
- a-money#11: fixed
- a-money#12: fixed
- a-money#13: fixed
- b-security#1: fixed
- b-security#2: fixed
- b-security#3: fixed
- b-security#4: partial — finding 3.
- b-security#5: fixed
- b-security#6: partial — finding 2.
- b-security#7: fixed
- b-security#8: fixed for ordinary recurring recovery — finding 1 covers the regression.
- b-security#9: partial — finding 7.
- b-security#10: fixed
- b-security#11: fixed
- b-security#12: partial — finding 12; migration also remains unapplied.
- c-course#1: fixed
- c-course#2: partial — finding 5.
- c-course#3: fixed for reported suffix errors — remaining stem-change defect in finding 11.
- c-course#4: fixed
- c-course#5: fixed
- c-course#6: fixed
- c-course#7: fixed
- c-course#8: fixed
- c-course#9: fixed
- c-course#10: fixed
- c-course#11: fixed
- c-course#12: fixed
- d-routing#1: fixed
- d-routing#2: fixed
- d-routing#3: fixed
- d-routing#4: fixed
- d-routing#5: partial — finding 10.
- d-routing#6: fixed
- d-routing#7: fixed
- d-routing#8: fixed
- d-routing#9: fixed
- d-routing#10: fixed
- d-routing#11: fixed
- d-routing#12: fixed
- d-routing#13: fixed
- e-frontend#1: fixed
- e-frontend#2: partial — finding 9.
- e-frontend#3: fixed
- e-frontend#4: fixed
- e-frontend#5: fixed
- e-frontend#6: fixed
- e-frontend#7: fixed
- e-frontend#8: fixed for stale-write ordering — introduced answer-loss regression in finding 8.
- e-frontend#9: fixed
- e-frontend#10: fixed
- e-frontend#11: fixed
- e-frontend#12: fixed
- e-frontend#13: fixed
- e-frontend#14: fixed
- e-frontend#15: fixed
- f-structure#1: fixed
- f-structure#2: fixed
- f-structure#3: fixed
- f-structure#4: fixed
- f-structure#5: partial — abandoned modules removed; unused `lucide-react` remains at `astro-site/package.json:19` and in its lockfile.
- f-structure#6: fixed
- f-structure#7: fixed
- f-structure#8: fixed
- f-structure#9: not fixed — scoring remains at `src/lib/checkpoint/buildCheckpoint.js:2234`, imported directly by `src/services/checkpointService.js:3`; no extraction was made.

## Checked and fine

- Normal subscription recovery, confirmed paid-through dates, refund preservation, course-order replay and checkout ownership checks.
- Reading ID-and-level binding, stale-route response handling and rendered entitlement checks.
- Admin selector validation before capability selection; all four lifecycle mailers send only successfully claimed recipients.
- Reservation failures prevent provider work; missing-RPC fallbacks preserve endpoint availability.
- New RPC signatures, existing schema columns, conflict keys and grants match earlier migrations.
- Account-bound subscription loading, consent withdrawal during loading and across tabs, onboarding completion, listening remount/resume and speaking-startup cleanup.
- Grammar publication filtering and complete-snapshot fallback; logout/catalogue links and prerendered schema ownership.
- NFC normalization, selectable-answer strictness, guest-save recovery, review-card merging, calendar-day planning and recap schedules.
- Shared-file equality, archive hashes, migration filename coverage and audit-server routing passed.
- Lint and 34 inspected read-only test files passed; modified existing assertions examined were not weakened.
- Existing `dist/` passed checks for 138 pages and 133 sitemap URLs; no fresh build or browser hydration verification was performed.
- No files were created, modified or deleted; the working tree remained clean.