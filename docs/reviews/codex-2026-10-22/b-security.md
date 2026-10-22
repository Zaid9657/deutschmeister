### 1. Anonymous X-Ray requests can bypass both spending limits
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/analyze-sentence.mjs:249`, `netlify/functions/analyze-sentence.mjs:166`, `netlify/functions/analyze-sentence.mjs:291`
- What breaks: An anonymous caller submits a normal sentence with `anonymousId: "anonymous\u0000bad"`. PostgreSQL rejects the embedded NUL, but the function still returns an AI analysis. Neither the anonymous counter nor the IP counter advances, allowing repeated unmetered spending.
- Evidence: ID validation checks only type and minimum length. Failed usage inserts return `null`; the handler ignores that result before calling Anthropic. Offline execution reproduced three successful analyses, three model calls and zero usage rows.
- Fix: Validate bounded, valid anonymous IDs and refuse provider calls unless usage reservation succeeds. Make quota checking and reservation atomic.

### 2. Array-valued actions bypass admin capability checks
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/admin-usage.mjs:24`, `netlify/functions/admin-coupons.mjs:25`, `netlify/functions/admin-content.mjs:39`
- What breaks: Support staff can request another learner’s transcript using `{"view":["transcript"]}`. An auditor can pause coupons using `{"action":["pause"]}`, and support staff can change content ownership through the same technique.
- Evidence: Capability selection compares the original value strictly, granting the read capability. Dispatch subsequently converts it with `String(...)`, turning a single-element array into the privileged action. In-memory executions of the actual handlers returned the transcript and performed both unauthorized mutations.
- Fix: Reject non-string action/view values before capability selection. Use the same validated value for authorization and dispatch.

### 3. Invalid exam-attempt IDs allow unlimited writing evaluations
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/evaluate-writing.mjs:334`, `netlify/functions/evaluate-writing.mjs:440`, `netlify/functions/evaluate-writing.mjs:467`, `migrations/2026-08-31-writing-submissions.sql:21`
- What breaks: A learner submits valid task text with `exam_attempt_id: "not-a-uuid"`. The model grades it before the UUID insert fails. The complete evaluation returns with `saved:false`, while the quota remains unchanged. Expired accounts can repeat this against free course tasks.
- Evidence: Quotas count persisted submissions. The unvalidated ID reaches the insert after model execution; `saveError` only logs. Offline execution produced three evaluations and zero stored submissions.
- Fix: Validate the attempt ID and ownership before spending. Reserve allowance before calling the model so a failed result write cannot erase consumed usage.

### 4. Learners can delete the counters enforcing AI daily limits
- Severity: HIGH
- Confidence: high
- Location: `migrations/2026-09-12-lesson-engine.sql:82`, `netlify/functions/explain-answer.mjs:104`, `netlify/functions/score-readaloud.mjs:81`
- What breaks: After consuming the 40 explanation or 60 read-aloud daily allowances, a learner deletes their own matching `lesson_attempts` rows through Supabase. Subsequent requests see zero usage and authorize another batch of paid calls.
- Evidence: The effective policy grants `FOR DELETE TO authenticated USING (auth.uid() = user_id)` without restricting stages. Both endpoints derive their limits solely from those deletable rows.
- Fix: Move AI accounting into a service-role-only ledger, or enforce that clients cannot delete the metered stages. Preserve ordinary lesson-reset behaviour separately.

### 5. Empty-wallet session starts still spend provider credits
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/speaking-session.mjs:262`, `netlify/functions/speaking-session.mjs:265`, `netlify/functions/speaking-session.mjs:278`
- What breaks: An account with zero balance repeatedly starts a 15-minute session. Every request generates a teacher greeting and speech audio before returning `402`, without creating a session or recording usage.
- Evidence: `teacherReply()` and `synthesizeSpeech()` precede `debit_speaking_wallet` and its insufficient-funds check. Offline execution reproduced three model calls, three audio generations, three `402` responses and zero session inserts.
- Fix: Atomically reserve wallet funds before provider calls. Refund the reservation if opening generation fails.

### 6. Ending during a pending turn refunds successfully delivered speech
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/speaking-turn.mjs:67`, `netlify/functions/speaking-turn.mjs:119`, `netlify/functions/speaking-turn.mjs:163`, `netlify/functions/_shared/speakingCloseout.mjs:131`
- What breaks: A caller submits a turn, then ends the session while transcription runs. Close-out sees zero saved learner turns and refunds the session. The pending request subsequently delivers audio and saves the learner’s speech. Repetition obtains paid turns using refunded funds.
- Evidence: Active status is checked only before provider work; messages are stored afterwards. Close-out counts already stored messages independently. Execution with the actual handler and helper produced delivered audio and a saved learner turn while the session remained cancelled and refunded.
- Fix: Atomically register accepted turns before provider work. Coordinate close-out with those reservations and defer zero-turn refunds until accepted turns settle.

### 7. Refunding one course removes Pro included with another purchase
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/lemonsqueezy-webhook.mjs:538`, `netlify/functions/lemonsqueezy-webhook.mjs:615`, `netlify/functions/lemonsqueezy-webhook.mjs:627`
- What breaks: A learner buys course A on January 1 and course B on January 2. Refunding B on January 3 removes Pro immediately, although A remains paid and includes Pro until April 1.
- Evidence: Each purchase overwrites the user’s single course subscription row. Refunding its referenced order unconditionally expires that row and clears the profile flags without checking other purchases. Offline signed-webhook execution reproduced this loss while A remained active with its original future deadline.
- Fix: After refunding a purchase, preserve the latest unexpired Pro entitlement among remaining active purchases. Expire course-derived Pro only when none remains.

### 8. Successful renewal recovery leaves paying learners blocked from AI
- Severity: HIGH
- Confidence: high
- Location: `netlify/functions/lemonsqueezy-webhook.mjs:773`, `netlify/functions/lemonsqueezy-webhook.mjs:793`, `netlify/functions/_shared/speakingUsage.mjs:13`
- What breaks: A failed renewal clears the learner’s Pro flags. Payment subsequently succeeds and the existing subscription becomes active, but speaking and writing still classify the learner as expired until manual subscription verification repairs the flag.
- Evidence: Revoked statuses write `is_subscribed:false, subscription_tier:'free'`. The matched active transition updates only `subscriptions`; payment-success updates only price. `getTier()` reads profile flags. Offline execution confirmed `past_due → active` still returned `free_expired`.
- Fix: Synchronize profile entitlement for successful transitions as well as revocations. Fail the webhook on synchronization errors so delivery retries.

### 9. Failed wallet refunds are never retried after cancellation
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/_shared/speakingCloseout.mjs:88`, `netlify/functions/_shared/speakingCloseout.mjs:156`, `netlify/functions/_shared/speakingCloseout.mjs:184`, `netlify/functions/speaking-session.mjs:137`
- What breaks: A learner cancels without speaking. If wallet credit fails through its five attempts, the session remains cancelled without returning the money. Retrying the end request or running the sweeper cannot recover it.
- Evidence: Status commits before crediting the wallet. Refund failure only logs, while subsequent close-out paths accept active sessions exclusively. Offline execution returned `closed:true, released:false`; the next sweep scanned zero sessions.
- Fix: Commit cancellation and refund/release transactionally, or persist a pending refund that retries independently of session status.

### 10. Replaying a fulfilled course order restarts its Pro window
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/lemonsqueezy-webhook.mjs:442`, `netlify/functions/lemonsqueezy-webhook.mjs:511`, `netlify/functions/lemonsqueezy-webhook.mjs:524`, `netlify/functions/lemonsqueezy-webhook.mjs:546`
- What breaks: Resending an already fulfilled order grants another 90 days measured from the replay. This contradicts the documented idempotent purchase path and can restore expired Pro without another payment.
- Evidence: Existing purchases are checked only for refunded status. Every delivery recalculates `now + proDays` and overwrites both deadlines. Identical signed payloads delivered January 1 and January 31 moved expiry from April 1 to May 1 while retaining one purchase row.
- Fix: Persist and reuse the original per-order deadline while allowing retries to complete unfinished provisioning. Preserve any later entitlement from another valid purchase.

### 11. Ignored duplicate claims still send lifecycle emails
- Severity: MEDIUM
- Confidence: high
- Location: `netlify/functions/course-reminder.mjs:382`, `netlify/functions/trial-lifecycle.mjs:247`, `netlify/functions/activation-lifecycle.mjs:278`, `netlify/functions/confirmation-nudge.mjs:233`
- What breaks: Repeated course-reminder runs resend the same reminder and bypass the weekly cap. Concurrent trial, activation or confirmation runs can also double-mail recipients, contradicting the claim-before-send guarantee.
- Evidence: All four jobs use `ignoreDuplicates:true`, check only the error, then send the original recipient list. Ignored conflicts succeed without inserting rows. Four consecutive offline reminder runs produced four deliveries but one ledger row.
- Fix: Return inserted rows from each claim and send only to recipients successfully claimed by that invocation.

### 12. Passing a checkpoint breaks course reminders for everyone
- Severity: MEDIUM
- Confidence: high
- Location: `migrations/2026-09-13-course-reminder.sql:110`, `src/services/checkpointService.js:203`, `src/data/curricula/a11.js:1717`
- What breaks: A signed-in learner passes checkpoint 1. Its saved completion causes the global reminder query to fail while that row remains inside the 30-day activity window, stopping reminders for all learners.
- Evidence: The query casts `regexp_replace(lp.lektion_id, '^.*-l', '')::int` for every completed row. Checkpoint completion stores `a1.1-cp1` with status `complete`; the regex leaves that ID unchanged, so the integer cast fails.
- Fix: Restrict completed-lesson counts and number extraction to IDs ending in `-l<number>`. Retain checkpoint rows when calculating latest activity.

## Checked and fine

- Shared authentication verifies JWTs; authenticated AI and learner-support handlers derive identity from them.
- Speaking session, turn and evaluation reads constrain ownership; evaluation uses server-stored messages.
- Writing tasks and rubrics come from the server bank, with deterministic coverage and copying gates.
- Webhook signatures are mandatory, timing-safe and fail closed when configuration is missing.
- Email secrets fail closed; unsubscribe HMACs and signed confirmation expiry checks are present.
- Learner support threads exclude internal notes; reply HTML is escaped and support-agent customer sending is disabled.
- Sentinel sends alerts only for returned claims; weekly-truth stores metrics before emailing.
- Examined CORS policies use explicit origin allowlists; no caller-controlled server fetch destination was found.
- Recorded SECURITY DEFINER grants/search paths, sensitive-table RLS and ownership checks passed inspection of migrations and committed fixtures.
- Profile triggers protect roles, paid flags and existing trial dates; video/storage writes require authorized JWT email.
- Focused migration, grants, ownership, trial, video, read-aloud and close-out suites passed; dependency-dependent writing suites could not run because Supabase dependencies were absent.