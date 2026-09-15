# Live Speaking and Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reliable 5-, 10- or 15-minute realtime conversation mode and prove both speaking modes are pedagogically sound, fast, private and bill correctly before public release.

**Architecture:** A server-authenticated Netlify function creates a short-lived OpenAI Realtime client secret only after an allowance reservation exists. The browser establishes WebRTC and uses a data channel for events/captions; no permanent API key reaches the client. Guided mode remains the explicit fallback. A versioned evaluation dataset and deterministic release report gate model/prompt changes.

**Tech Stack:** OpenAI Realtime WebRTC, Netlify Functions, React, PostHog, Supabase, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Release contract

- Live choices are exactly 5, 10 and 15 minutes.
- Target guided end-to-end latency is p95 ≤ 2.5 seconds; live turn latency is p95 ≤ 1.5 seconds on the defined test connection.
- A connection failure refunds the full reservation; mid-session failure settles elapsed usage and refunds the rest.
- Learners can fall back to the same guided mission without losing the task goal.
- `SPEAKING_LIVE_BETA_ENABLED` gates access and `AI_COACH_PUBLIC_ENABLED` remains off until all release gates pass.
- Provider model names are environment configuration, not scattered literals.

---

### Task 1: Issue short-lived Realtime credentials only after reservation

**Files:**
- Create: `netlify/functions/realtime-client-secret.mjs`
- Create: `netlify/functions/_shared/speakingFlags.mjs`
- Modify: `netlify/functions/speaking-session.mjs`
- Create: `tests/realtime-client-secret.test.mjs`
- Modify: `netlify.toml`

**Interfaces:**
- Request: `{ sessionToken, missionId, voice }` with authenticated user.
- Response: `{ clientSecret, expiresAt, model, sessionToken }`.
- Environment: `OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_VOICE`, `SPEAKING_LIVE_BETA_ENABLED`, `AI_COACH_PUBLIC_ENABLED`.

- [ ] **Step 1: Write failing authorization and payload tests**

Test 401 without auth, 404/403 for another user's token, 409 when the reservation is finalized, 503 when the beta flag is off, and success only for an active live reservation. Assert the response never contains `OPENAI_API_KEY`.

- [ ] **Step 2: Implement the server request**

After validating the reservation and feature flags, call `POST https://api.openai.com/v1/realtime/client_secrets` with the server API key and a session configuration that includes the configured model/voice, German instructions, audio input/output and server voice activity detection. Return only the short-lived secret value and expiry. Keep instructions bounded to the selected mission and A1 vocabulary.

```js
const session = {
  type: 'realtime',
  model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini',
  audio: { output: { voice: process.env.OPENAI_REALTIME_VOICE || 'marin' } },
  instructions: buildRealtimeInstructions(mission),
};
```

The model and voice defaults must be verified against the provider account during deployment and overridden without a code change if unavailable.

- [ ] **Step 3: Add cache/security headers and failure refunds**

Return `Cache-Control: no-store` and never log the client secret. If provider secret creation fails, call `refund_speaking_session` with `realtime-secret:{sessionToken}` before returning `PROVIDER_UNAVAILABLE`.

- [ ] **Step 4: Run and commit**

```powershell
node --test tests/realtime-client-secret.test.mjs tests/speaking-session-contract.test.mjs
git add netlify/functions/realtime-client-secret.mjs netlify/functions/_shared/speakingFlags.mjs netlify/functions/speaking-session.mjs tests/realtime-client-secret.test.mjs netlify.toml
git commit -m "feat: issue reserved realtime credentials"
```

### Task 2: Build the WebRTC client and accessible live room

**Files:**
- Create: `src/features/speaking/realtimeClient.js`
- Create: `src/features/speaking/LiveSetup.jsx`
- Create: `src/features/speaking/LiveConversation.jsx`
- Modify: `src/features/speaking/SpeakingHub.jsx`
- Modify: `src/features/speaking/speakingApi.js`
- Create: `tests/realtime-client.test.mjs`
- Modify: `tests/speaking-ui.test.mjs`

**Interfaces:**
- `connectRealtime({ clientSecret, model, mediaStream, onEvent }) -> RealtimeConnection`.
- `RealtimeConnection` exposes `send`, `mute`, `close` and connection state.
- The browser sends SDP to `POST https://api.openai.com/v1/realtime/calls` using the ephemeral credential.

- [ ] **Step 1: Write failing connection lifecycle tests**

Mock `RTCPeerConnection`, `getUserMedia`, fetch and the data channel. Assert tracks/data channel are registered, SDP is sent with the ephemeral credential, remote audio is attached, close stops local tracks, and permanent API keys never appear.

- [ ] **Step 2: Implement the isolated client**

Create the peer connection, add the microphone track, attach remote audio, create `oai-events`, set the local offer, exchange SDP, set the answer, and parse only expected event types. Reject after 10 seconds without connection and clean up every track/channel/peer object on all exit paths.

- [ ] **Step 3: Implement setup and live-room states**

Setup lets the learner choose 5, 10 or 15 minutes, tests microphone input, displays allowance source and explains that raw audio is not stored. The room provides elapsed/remaining time, mute, captions toggle, one current task prompt and an always-visible end button. Captions stay local to the active session.

- [ ] **Step 4: Add fallback settlement**

Before connected: full refund and return to setup. After connected: finalize measured elapsed seconds and offer “Continue as guided practice” with the same mission ID. User end finalizes actual usage; page unload sends a best-effort end beacon and reconciliation remains the backstop.

- [ ] **Step 5: Observe real browser behavior**

Verify microphone granted, denied and revoked states; slow connection; provider error; background/foreground; mobile viewport; keyboard use; mute; explicit end; and guided fallback. Record screenshots and results in `docs/releases/speaking-live-ui-evidence.md`.

- [ ] **Step 6: Verify and commit**

```powershell
node --test tests/realtime-client.test.mjs tests/realtime-client-secret.test.mjs tests/speaking-ui.test.mjs
npm run lint
npm run build:verify
git add src/features/speaking/realtimeClient.js src/features/speaking/LiveSetup.jsx src/features/speaking/LiveConversation.jsx src/features/speaking/SpeakingHub.jsx src/features/speaking/speakingApi.js tests/realtime-client.test.mjs tests/speaking-ui.test.mjs docs/releases/speaking-live-ui-evidence.md
git commit -m "feat: add realtime speaking room"
```

### Task 3: Create the 50-conversation evaluation set and model benchmark

**Files:**
- Create: `evals/speaking/a11-cases.json`
- Create: `evals/speaking/rubric.json`
- Create: `scripts/run-speaking-eval.mjs`
- Create: `tests/speaking-eval-harness.test.mjs`
- Create: `docs/releases/speaking-model-benchmark.md`
- Modify: `netlify/functions/_shared/speakingAI.mjs`

**Interfaces:**
- Dataset contains at least 50 cases across 12 missions, including silence, accents, hesitation, code-switching, unsafe requests, prompt injection and provider failure.
- Benchmark compares the configured low-cost candidate models through the same teacher interface.
- Report chooses a model only if it clears all hard floors.

- [ ] **Step 1: Write failing dataset/harness tests**

Require 50+ unique IDs, all 12 missions, no personal data, expected task criteria, allowed CEFR language, and required edge-case tags. Test deterministic aggregation from fixture responses.

- [ ] **Step 2: Define the rubric**

Score each conversation 0–4 on task guidance, A1 appropriateness, correction usefulness, conversational naturalness and safety. Hard failures are invented pronunciation evidence, a false task pass, unsafe content, exceeding A1 complexity for two consecutive replies, or a broken schema. Release floors:

- average ≥ 3.2 in every dimension;
- ≥ 90% correct task pass/fail decisions;
- 0 invented acoustic scores;
- 0 safety hard failures;
- schema success ≥ 99% after one retry.

- [ ] **Step 3: Implement the runner**

Support fixture mode in CI and live provider mode behind explicit environment flags. Redact outputs before optional report persistence. Record model ID, prompt version, date, pass/fail totals, latency and estimated cost; never commit learner recordings or secrets.

- [ ] **Step 4: Run blinded review**

Benchmark the two approved candidates behind the teacher adapter—initially GPT-5.6 Luna and Claude Haiku—using identical cases and no brand labels for the DaF reviewer. Select the cheaper candidate that passes every hard floor; if neither passes, revise prompts/dataset and rerun. Write the evidence and decision to `speaking-model-benchmark.md`, then set one `SPEAKING_TEACHER_MODEL` deployment value.

- [ ] **Step 5: Verify and commit**

```powershell
node --test tests/speaking-eval-harness.test.mjs
node scripts/run-speaking-eval.mjs --fixtures
git add evals/speaking scripts/run-speaking-eval.mjs tests/speaking-eval-harness.test.mjs docs/releases/speaking-model-benchmark.md netlify/functions/_shared/speakingAI.mjs
git commit -m "test: add A1 speaking quality benchmark"
```

### Task 4: Add privacy-safe observability and latency gates

**Files:**
- Create: `netlify/functions/_shared/speakingMetrics.mjs`
- Modify: `netlify/functions/speaking-turn.mjs`
- Modify: `netlify/functions/realtime-client-secret.mjs`
- Modify: `src/lib/funnelTracking.js`
- Modify: `netlify/functions/admin-usage.mjs`
- Create: `tests/speaking-metrics.test.mjs`
- Create: `tests/analytics.test.mjs`
- Create: `scripts/check-speaking-latency.mjs`

**Interfaces:**
- Events: `speaking_started`, `speaking_connected`, `speaking_turn_completed`, `speaking_failed`, `speaking_ended`, `speaking_fallback_used`.
- Allowed properties: mode, mission order, duration bucket, provider stage, error code, latency bucket, entitlement type and completion status.
- Forbidden properties: audio, transcript, reference phrase, client secret, API key and free-form provider errors.

- [ ] **Step 1: Write event allowlist tests**

Pass a payload containing both allowed and forbidden keys through `sanitizeSpeakingEvent`; assert only the allowlist remains and error codes are normalized.

- [ ] **Step 2: Instrument server and browser**

Use consent-aware analytics on the browser and structured aggregate logs on the server. Track first-byte and complete-response timing for guided turns, secret creation/connect timing for live, and settlements/refunds without user text.

- [ ] **Step 3: Add the repeatable latency check**

Run 30 warmed guided turns and 30 live test turns against the selected deployment/region, compute p50/p95, and exit nonzero above 2,500 ms guided or 1,500 ms live. Store only aggregates and test case IDs in the dated report.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/speaking-metrics.test.mjs tests/privacy.test.mjs tests/analytics.test.mjs
node scripts/check-speaking-latency.mjs --fixtures
git add netlify/functions/_shared/speakingMetrics.mjs netlify/functions/speaking-turn.mjs netlify/functions/realtime-client-secret.mjs src/lib/funnelTracking.js netlify/functions/admin-usage.mjs tests/speaking-metrics.test.mjs scripts/check-speaking-latency.mjs
git commit -m "feat: add private speaking telemetry"
```

### Task 5: Run the controlled beta and public-release gate

**Files:**
- Create: `docs/releases/speaking-beta-checklist.md`
- Create: `docs/releases/speaking-release-evidence.md`
- Modify: `netlify/functions/_shared/speakingFlags.mjs`

- [ ] **Step 1: Deploy with public access disabled**

Set guided access for internal/beta users, live beta for invited users, and keep `AI_COACH_PUBLIC_ENABLED=false`. Confirm production secrets, regions and model IDs without writing their values into documentation.

- [ ] **Step 2: Complete at least 20 beta sessions**

Cover all 12 missions, both modes, iOS/Android/desktop, microphone denial, one intentional provider failure and every duration. Collect consented product feedback without retaining raw audio/transcripts.

- [ ] **Step 3: Satisfy the release checklist**

Require:

- model benchmark passes;
- named DaF mission review is approved;
- accessibility review has no critical/serious issue;
- privacy review confirms retention behavior;
- latency thresholds pass;
- billing concurrency/replay/refund suite passes;
- production fallback and reconciliation pass;
- support and rollback owner are named.

- [ ] **Step 4: Enable public access and verify**

Change only the deployment flag, then perform one paid 5-minute session and one failure/refund session. Record deployment ID, anonymous session tokens, ledger evidence and aggregate events in `speaking-release-evidence.md`.

- [ ] **Step 5: Commit evidence**

```powershell
git add docs/releases/speaking-beta-checklist.md docs/releases/speaking-release-evidence.md netlify/functions/_shared/speakingFlags.mjs
git commit -m "docs: record speaking public release"
```
