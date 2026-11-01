> Archived from the 2026-11-01 build session. `/tmp/...` paths name files in that build container, not in the repo. Code landed as PR #246 (track A), #247 (track C) and #248 (track B).

Track B is implemented in `/tmp/wt-b`. Nothing was deployed, no migration was applied, and no customer mail was sent. All new customer-mail paths default OFF. The mandatory full suite was run; three unchanged suites remain blocked by this sandbox's synchronous-child-process restriction. This is not a green release.

The post-trial surface replaces the expired banner's null return and the subscription page's generic expiry notice. It requires a signed-in learner, an actual ended trial, verified billing, no subscription, no recurring billing relationship and no purchase. It shows recorded course/grammar/writing work, a next action, the canonical free A1.1 door, and a configured relevant course offer or Pro with canonical pricing. Missing/loading/failed reads have separate, truthful copy. Dismissal is per account for seven days through safeStorage. The banner is hidden on subscription/pricing routes. German notice copy uses Sie; actions use siegel. Grammar links load Astro normally; the paid-offer anchor scrolls natively. Curriculum metadata loads only when this surface is eligible. No access or pricing rule was changed.

The optional 14/30/60-day follow-ups use disjoint one-day windows after the actual trial end, confirmed addresses, `lifecycle_customer_state`, purchase exclusion and repeated eligibility checks. The drafts use Sie, link the free course and offers, and contain no urgency or inactivity claims. They run inside the existing authenticated trial-lifecycle invocation; no Netlify endpoint or schedule was added. A required cohort start prevents retrospective enrollment of learners who received the old promise that the trial-ended mail was the last message. The existing trial-ended body changes only behind the late-sequence flag. Dry runs make no claims/sends; canaries leave other recipients unclaimed. Accepted/historical claims are excluded from dry-run recipient counts.

The retry implementation stores permanent per-message claims, the exact provider request, provider IDs and API acceptance separately. The proposed SQL serializes claims per subscription, preserving the seven-day dunning quiet period across concurrent invoice events, and claims unique user+kind before a lifecycle send. A new failed-payment event retries a pending original invoice rather than relabelling the new invoice as mailed. Stable provider keys protect concurrent requests, lost responses and lost database stamps. There are up to three bounded attempts inside the same invocation; later retries remain inside the original audience window and a conservative 23-hour provider-key horizon. No claim is deleted. Ambiguous older claims require owner reconciliation. Changed recipients, revoked late-mail eligibility, and closed claims stop delivery. API acceptance is never reported as verified delivery by the new path. Original dunning copy, audience and cadence remain unchanged; existing trial canary behavior changes only when its retry flag is enabled, and sentinel matches that flag.

`docs/agents/payment-recovery.sql` is a read-only Monday-packet query: deduplicated failed renewal invoice → accepted dunning/provider receipt → later successful payment of that SAME invoice and subscription. It groups currencies separately, retains unknown/conflicting balances, distinguishes API acceptance from verified delivery, and includes anonymized invoice detail. It counts recovered failed balance, not causal mail lift or net sales. There is no delivery-receipt store in the supplied checkout: the query has an explicitly empty receipt input for an authorized Resend delivery export. Until populated, delivery remains unknown. A documented optional claim-ledger input can be enabled in the query after the migration; it covers failures to write the legacy acceptance stamp. Historical messages without provider IDs cannot be reliably linked.

Owner decisions still required:

- Approve and apply `migrations/2026-11-01-retryable-lifecycle-mail.sql`, including its service-only table, RLS/grants and new claim RPC. It is marked **DRAFT — NOT YET APPLIED** in the migration ledger and test fixture. No policy or public RPC was applied here.
- Decide the consent basis and approve all late-mail drafts, then choose `LIFECYCLE_LATE_TRIAL_COHORT_START` as an ISO timestamp at or after the approved release. Only the exact value `LIFECYCLE_LATE_TRIAL_ENABLED=true` plus a valid cohort date enables late mail. Absent/invalid configuration does nothing. Do not backdate the cohort over the legacy last-message promise.
- Separately approve `LIFECYCLE_RETRY_ENABLED=true` and `PAYMENT_RECOVERY_RETRY_ENABLED=true`. Both are unset/OFF by default. Apply schema first, review authenticated dry-run results, and use `LIFECYCLE_TEST_RECIPIENTS` for lifecycle canaries before enabling broad sends. None of these flags was set here.
- For ambiguous claims beyond 23 hours, verify the provider outcome. Record `accepted_at` and `provider_id` only with acceptance evidence; alternatively the owner can set `closed_at` and document verified nonacceptance/cancellation in `last_error`, preserving the claim and releasing its subscription scope. Never fake an acceptance or delete a claim to resend. Closing a lifecycle claim does not schedule another mail outside its original window.
- Supply authorized delivery receipts and verify the financial query against the live schema before using its balances in the Monday packet. This work changes no prices, refunds, entitlements, quotas, legal consent policy or auth settings.

Files changed:

- UI and model: `src/components/TrialBanner.jsx`, `src/components/TrialReturnCard.jsx`, `src/pages/SubscriptionPage.jsx`, `src/lib/trialReturn.js`, `src/lib/trialSavedWork.js`.
- Mail and monitoring: `netlify/functions/trial-lifecycle.mjs`, `netlify/functions/lemonsqueezy-webhook.mjs`, `netlify/functions/sentinel.mjs`, `netlify/functions/_shared/lateTrial.mjs`, `netlify/functions/_shared/retryableMail.mjs`.
- SQL and schema ledger: `docs/agents/payment-recovery.sql`, `migrations/2026-11-01-retryable-lifecycle-mail.sql`, `migrations/README.md`.
- Tests and fixture: `tests/trial-return.test.mjs`, `tests/late-trial.test.mjs`, `tests/retryable-mail.test.mjs`, `tests/payment-recovery-report.test.mjs`, `tests/dunning-outcome.test.mjs`, `tests/dashboard-free-fallback.test.mjs`, `tests/german-sie.test.mjs`, `tests/lifecycle.test.mjs`, `tests/sentinel.test.mjs`, `tests/fixtures/db-schema.json`.

Validation:

- `npm run lint`: PASS, zero warnings after moving generated preview/build artifacts into the already-ignored `dist/` directory. No lint rule was weakened.
- `npm run check:duplicates`: PASS, all 19 manifest pairs byte-identical; no canonical shared data changed.
- Focused Track B and adjacent regression run: 13 test files PASS. The final dismissal/query/claim-resolution refinements also passed all four affected test files.
- `npm test`: completed, **282 of 285 test files passed; 3 failed, 0 skipped**. The failures are `tests/indexnow-context.test.mjs` (child output absent), `tests/review-seeding.test.mjs` (child output empty, so JSON parse fails), and `tests/telc-pilot-gate.test.mjs` (child validator output absent). These tests and their production code were not changed. A minimal `spawnSync(process.execPath, ['-e', 'console.log("probe")'])` reproduction returns `error.code=EPERM` and empty output in this sandbox. No tests were disabled or weakened. Re-run the full suite in a normal execution environment before release.
- Production Vite build: PASS. Function syntax checks and Git whitespace check: PASS. The final native-anchor-only JSX change is covered by the focused regression and lint.
- SQL was reviewed and its safety/identity/aggregation contracts tested, but it was NOT executed against PostgreSQL or production. Local PostgreSQL setup was blocked by the container's user/ownership restrictions. Live SQL syntax/schema compatibility and advisory-lock behavior remain unverified.
- An offline HTML preview using a labelled synthetic fixture was rendered from the component. Browser capture was attempted but Chrome failed on sandbox socket operations, so visual layout/hydration on mobile and desktop remains unverified. No screenshot is claimed.
- Provider idempotency/delivery semantics, deployed environment flags, consent, production data and measured conversion/recovery are unverified. Saved-work coverage is course, grammar and writing; it does not claim a complete cross-tool history. No application network requests were made. The configured Git signer attempted its loopback service and was blocked; subsequent commits were made unsigned.

Expected effect from `../plan-leak-onboarding-tools.md`, not a forecast or observed result: at the plan's current volume, +0.5 late buyer/month (about €5) plus +1 recovered existing payer/month (about €10), together about €15 incremental gross first charges. At 10× comparable volume: +5 late buyers and +10 recovered payers, about €150. Zero is possible. These are before tax/refunds/fees, are not MRR, overlap other experiments, and recovery must be capped by the actual deduplicated unpaid invoice balance. The implementation itself does not establish causation or any lift.

Commits and integration:

- `eab1133` — Show saved work and free next steps after trial expiry.
- `eb96fff` — Keep return actions usable and load saved work only when eligible.
- `c04634d` — Prepare gated follow-ups, durable mail retries and invoice recovery report.

Normal `git commit` cannot write `/home/user/deutschmeister/.git/worktrees/wt-b/index.lock` because that metadata is mounted read-only. The original branch metadata was not changed. The commits above are preserved in `/tmp/wt-b/.track-b-git` on `claude/codex-build-b`, with a verified importable bundle at `/tmp/wt-b/b-commits.bundle`. The bundle requires base `c957aa11cdda4d865ca5a59eaf3309bff51f8884`. Original worktree `git status` therefore still shows the implementation as uncommitted; the separate committed snapshot is clean.

Claude can import without changing this protected worktree's index:

```bash
git fetch /tmp/wt-b/b-commits.bundle refs/heads/claude/codex-build-b:refs/heads/codex-track-b-import
```

Review that branch, re-run all checks in an environment that supports child processes, and keep owner-only flags/schema inert until approved. Validation logs and the offline HTML fixture are in `/tmp/wt-b/dist/track-b-validation/`. No push, merge, deploy, live schema change or customer send was performed.
