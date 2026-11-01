> Archived from the 2026-11-01 build session. `/tmp/...` paths name files in that build container, not in the repo. Code landed as PR #246 (track A), #247 (track C) and #248 (track B).

# Track C — first useful minute and confirmation continuity

Worktree: `/tmp/wt-c`, branch `claude/codex-build-c`. Offline implementation, 2026-11-01. No deployment, customer messages, migrations, external requests, prices, access rules, quotas, answer acceptance, or legal text were changed.

## Built

1. **Goal-matched onboarding.** The final primary button names the chosen exam and opens its first task. telc B1 opens the same Kurztest used by training unit 1; Goethe and DTZ use their registered writing task or mock test. Placement is explicitly optional for exam learners. Beginners keep A1.1 Lektion 1; a learner with known experience or a higher placement is offered placement instead of being sent back to A1.1. Local exam choices reach the exit even before profile refresh. `hasLevelAccess` is consulted for the lock notice; all destination guards remain intact.
2. **Speaking reliability.** Before the first answer, a three-second local recording measures actual microphone RMS through Web Audio and offers playback. The learner confirms hearing the clip before opening the conversation. The animated fake meter is replaced with measured input during recording too. Test audio is never uploaded or stored persistently; object URLs, recording resources and audio contexts are cleaned up. Turn requests bound headers, fetch and response decoding to 45 seconds, retain failed recordings for explicit retry, reject concurrent retries, and surface malformed replies. Clip encoding and closeout waits are bounded too. No automatic turn retry, new endpoint or reservation change. The existing session clock continues during the microphone check.
3. **Confirmation continuity.** Signup/verification instructions name the exact address, confirmation-mail subject and link, and spam-folder recovery. Resend stays secondary. An owner-gated patch carries a safe `continue` destination through signup, confirmation and resend, including another browser without the original storage. Known course paths, registered mock/writing tasks and pricing-registry product keys are accepted; external URLs, arbitrary queries, unknown tasks/products and duplicate continuation parameters are rejected. A fresh account retains the task through onboarding, then consumes it on arrival. Existing account and expired-link recovery remain available.

## Owner-only release decisions

- `VITE_AUTH_CONTINUITY_ENABLED` defaults **OFF**. Approve carrying `continue=<encoded allow-listed destination>` on the existing same-origin `/login` confirmation redirect, verify the production Supabase redirect allow-list accepts that precise contract, test fresh/expired/resent links on another browser, then explicitly approve enabling the flag. The existing `/login` redirect and course-only return storage remain the defaults. Setting/unsetting the flag was not attempted.
- **Welcome email timing remains unchanged.** Owner decision needed: whether to move the existing welcome send from account insertion to the first verified entry, with an idempotent send guard. No mailer, audience, schedule, template or nudge flag was changed.
- Existing purchase, subscription and exam locks remain authoritative. No entitlement, price, quota, auth token handling, RLS or public endpoint changes were activated.

## Files

- Onboarding: `src/components/onboarding/IntroSlides.jsx`, `OnboardingGate.jsx`; `src/hooks/useOnboarding.js`; `src/lib/firstRun.js`.
- Speaking: `src/components/speaking/SpeakingSession.jsx`, new `MicrophoneCheck.jsx` and `microphoneLevel.js`; `src/pages/SpeakingPage.jsx`; new `src/lib/speakingRequest.js` and `speakingFirstTurn.js`.
- Analytics registry: `src/data/events.js` and byte-identical `astro-site/src/data/events.js`. The new `speaking_first_turn` event uses existing consent-gated `track`; only fixed surface/stage/result labels are emitted, with no audio, transcript, address or session token.
- Confirmation: `src/pages/SignupPage.jsx`, `VerifyEmailPage.jsx`, `LoginPage.jsx`; `src/contexts/AuthContext.jsx`; `src/lib/buyIntent.js`, `returnPath.js`; new `authContinuityFlag.js` and `confirmationContinuity.js`.
- New regression suites: `tests/onboarding-goal-exit.test.mjs`, `speaking-first-turn.test.mjs`, `confirmation-continuity.test.mjs`.
- Extended existing suites: `tests/first-run.test.mjs`, `onboarding-completion-regressions.test.mjs`, `login-resend.test.mjs`, `signup-confirmation.test.mjs`, `signup-existing-account.test.mjs`, `speaking-eval-retry.test.mjs`, `speaking-startup-cancellation.test.mjs`. Updated source/handler expectations preserve their original rules; nothing was skipped or disabled.

## Verification

Final verification on the completed patch:

- `npm run lint`: **PASS**, exit 0, zero warnings (`/tmp/wt-c/.lint.log`).
- `npm run check:duplicates`: **PASS**, exit 0, all shared pairs byte-identical (`/tmp/wt-c/.duplicates.log`).
- `npm test`: **281 PASS / 3 FAIL out of 284 test files**, exit 1, 0 skipped, 0 cancelled; 127.7 seconds (`/tmp/wt-c/.all-tests.log`). The three failures are the unchanged sandbox-blocked suites detailed below. The required full suite is therefore **not green in this environment**.
- `./node_modules/.bin/vite build`: **PASS**, exit 0, offline SPA production compilation (`/tmp/wt-c/.vite-build.log`).
- `git diff --check`: **PASS**.

Focused suites cover every exam mapping and lock, beginner/experienced exits, silence versus actual input, audio cleanup, local playback, header/fetch/body timeouts, malformed responses, explicit retry, cancellation, fixed analytics labels, default-off auth behavior, same/different-browser URL continuity, expired/resend handling, unsafe returns, storage expiry and onboarding consumption.

The initial full suite found two introduced defects (Safari-incompatible `Object.hasOwn` and a test window without `location`); both are fixed. Three unchanged suites depend on child processes that this sandbox denies: `indexnow-context.test.mjs`, `review-seeding.test.mjs`, `telc-pilot-gate.test.mjs`. A minimal `spawnSync(process.execPath, ['-e', 'console.log(123)'])` reports `EPERM`, with empty stdout/stderr. Those tests and their implementation files are unchanged.

## Expected effect from the plan — unverified scenarios

At the plan's 62 monthly signups, its onboarding/speaking scenario is **7.2 additional tool users, 0.35 additional payers and €3.50 incremental gross first charges per monthly intake**. Recovering half of zero-turn sessions means approximately **1.6 additional speakers/month**, included in that opportunity. At 10× intake: 72 users, 3.5 payers and €35.

The confirmation scenario, dependent on owner release and the broader confirmation work, is **9.4 additional confirmed accounts, 4.3 tool users, 0.21 payers and €2.10 gross first charges per monthly intake**; at 10×: 94 confirmed, 43 tool users, 2.1 payers and €21. These are planning proxies from `../plan-leak-onboarding-tools.md` and `FUNNEL.md`, can be zero, overlap, and must not be added. They are neither measured lift nor MRR or net revenue. The welcome-mail change was not implemented, so this patch alone does not establish the full confirmation scenario.

## Unverified and handoff limitations

- Physical microphones, Safari/iOS recording/playback, live provider latency, real email delivery/expiry, Supabase redirect configuration and deployed behavior remain unverified.
- An offline Chromium screenshot attempt failed before navigation: sandbox socket operations were denied (`Operation not permitted`). Both Chromium and headless-shell launch attempts failed; no visual verification is claimed.
- A timed-out turn may already have been processed server-side. Retry is explicit and warns of possible repetition; server idempotency was not changed.
- Analytics excludes nonconsenting users and is an observation of client stages, not proof that every zero-turn session was a technical failure. No conversion/revenue improvement was measured.
- **Commit blocked:** staging fails with `Unable to create '/home/user/deutschmeister/.git/worktrees/wt-c/index.lock': Read-only file system`, including after reconnection. No commit could be created. All changes remain in the supplied worktree; no other worktree or protected repository metadata was modified. The integrating agent must commit once that metadata is writable. Suggested subject: `Match first tasks to learner goals and harden speaking and confirmation continuity`.
