# Speaking rebuild — controlled beta and public-release checklist

Plan: `docs/superpowers/plans/2026-09-15-speaking-live-quality.md` Task 5.
Spec gates: the approved design §11.2 and §11.3.

**Nothing on this list can be satisfied by an agent in a sandbox.** Every
unchecked line needs production access, a real device, a real provider
account or a named human. An agent may prepare the machinery (all of it is
built and tested) but may not mark a gate met — and a mocked result is
explicitly not evidence.

## Stage gates (spec §11.3)

- [ ] **Stage 1 — internal guided testing.** Deploy with
      `SPEAKING_LIVE_BETA_ENABLED` unset and `AI_COACH_PUBLIC_ENABLED` unset
      (both fail closed). Confirm the guided City Map works for an internal
      account against live Supabase data.
- [ ] **Stage 2 — guided + Pronunciation Lab beta** with real learners.
- [ ] **Stage 3 — Live Conversation beta** for a small invited group
      (`SPEAKING_LIVE_BETA_ENABLED=true`, `VITE_SPEAKING_LIVE_BETA=true`).
- [ ] **Stage 4 — public course launch** (needs the launch checklist too).
- [ ] **Stage 5 — public AI Coach** (`AI_COACH_PUBLIC_ENABLED=true`), only
      after every gate below passes.

## Release gates (spec §11.2)

| # | Gate | State | What is missing |
|---|---|---|---|
| 1 | 50+ end-to-end A1 conversations | **machinery ready** | `evals/speaking/a11-cases.json` holds 54 cases; `node scripts/run-speaking-eval.mjs --live --model=…` needs provider credentials |
| 2 | Named DaF reviewer sign-off | **RED** | `docs/course-factory/a11-rebuild/RELEASE-REVIEW-2026-09.md` is unfilled by design |
| 3 | Pronunciation truth | **code ready** | Azure adapter refuses to invent scores; needs `AZURE_SPEECH_KEY`/`_REGION` and one real calibration run |
| 4 | Latency p95 (guided ≤2.5 s, live ≤1.5 s) | **tool ready** | `node scripts/check-speaking-latency.mjs --live` against a deployment |
| 5 | Billing integrity | **GREEN (local)** | reserve/finalize/refund/replay/concurrency proved against real Postgres (`tests/speaking-ledger-concurrency.test.mjs`, 12/12). Production repeat still required after the migration is applied |
| 6 | Privacy review | **code ready** | No raw audio stored, no transcripts on the guided path, analytics allowlisted. Needs the formal GDPR/DSGVO review the spec names |
| 7 | Accessibility | **partly GREEN** | automated + browser checks pass at 320/768/1440 (`speaking-guided-ui-evidence.md`); a human screen-reader pass is still owed |
| 8 | Production proof | **RED** | one authenticated production session per released mode, with correct entitlement and ledger rows |

## Beta sessions (plan Task 5 Step 2)

- [ ] 20+ sessions covering all 12 missions, both modes, iOS/Android/desktop,
      a microphone denial, one intentional provider failure and every duration.
- [ ] Consented feedback collected; no raw audio or transcripts retained.

## Named owners

- [ ] Support owner during beta: ______
- [ ] Rollback owner (who flips the flags back): ______
- [ ] DaF reviewer: ______

## Rollback

Flipping `SPEAKING_LIVE_BETA_ENABLED` / `AI_COACH_PUBLIC_ENABLED` to unset
disables the affected mode immediately and **does not touch purchased
permanent seconds** — the kill switch the spec requires (§8.5). Reservations
in flight are settled by `reconcile-speaking-reservations` within 15 minutes.
