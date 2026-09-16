# DeutschMeister Speaking and A1.1 Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved paid A1.1 course, City Conversation Map speaking system, fixed allowances, verified AI quality, and organic sales funnel without weakening the existing public learning library.

**Architecture:** The work is split into five independently reviewable plans. Course readiness and the minute ledger establish the commercial and security foundations; guided speaking builds on both; live conversation builds on the ledger and shared speaking UI; the commercial launch waits for the product release gates. Each plan must leave production in a coherent state even when later plans have not shipped.

**Tech Stack:** React 18, Vite 5, Astro, Tailwind CSS, Netlify Functions, Supabase/Postgres, Lemon Squeezy, PostHog, Azure Speech, OpenAI Realtime/TTS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Global Constraints

- Preserve `FREE_LEVELS = ['a1.1']` for the public A1.1 grammar/library; paywall only the guided A1.1 course after the three-lesson preview.
- Use `course_a1_1` as the one-time product key and €39 as its gross display price.
- Give purchasers 12 first mission attempts plus 3,600 permanent speaking seconds.
- Give AI Coach subscribers 7,200 speaking seconds per billing month; monthly seconds expire, permanent seconds do not.
- Consume monthly seconds before permanent seconds and refund provider/application failures.
- Keep existing subscribers on their current €9.99 monthly or €79.99 annual price while continuously subscribed.
- Do not store raw audio or full transcripts by default.
- Never derive pronunciation scores from transcript text.
- Keep all provider model IDs configurable and benchmark the mission-teacher model before locking it.
- Every public claim must derive from the product data source already guarded by `tests/claims.test.mjs`.
- Use test-first changes, focused commits, and `npm test`, `npm run lint`, and `npm run build:verify` as the final local gate.

---

## Plan set and dependency order

| Order | Plan | Produces | Depends on |
|---:|---|---|---|
| 1 | `2026-09-15-deutschstart-a11-course-readiness.md` | Sellable A1.1 product, three-lesson preview, premium content/audio gates | Approved spec |
| 2 | `2026-09-15-speaking-entitlements-ledger.md` | Atomic second-based allowances, grants, reservation, finalization, refunds | A1.1 product key |
| 3 | `2026-09-15-speaking-guided-city-map.md` | Twelve guided missions, Pronunciation Lab, City Map UI, truthful feedback | Plans 1–2 |
| 4 | `2026-09-15-speaking-live-quality.md` | Realtime WebRTC mode, fallback, evaluation harness, controlled rollout | Plans 2–3 |
| 5 | `2026-09-15-a11-organic-commercial-launch.md` | Sales page, analytics, email sequence, launch verification | Plans 1–4 release evidence |

## Implementation state (2026-09-16)

All five plans are implemented on `claude/bold-shannon-brr04p`. What is built
and what remains owner work:

| Plan | Commits | State |
|---|---|---|
| 1 Course readiness | `aab2aea` `f43ca5c` `bbec3ef` `0f747cb` `1fdf1e6` | Product, preview gate, assessment and the closed review minors are done. Audio manifest and the named DaF review are owner gates (both fail the release command loudly). |
| 2 Entitlements ledger | `5ff6462` `2bd405a` `49cc2bd` `ba51c74` `6ca724c` | Complete and proved against real Postgres (12/12 including true concurrency). Needs the migration applied. |
| 3 Guided City Map | `fcabcd9` `ef13d20` `2bbbb6b` `efd43dd` | Complete; browser-inspected at three viewports. Needs the mission migration applied + `VITE_SPEAKING_MISSIONS_LIVE`. |
| 4 Live + quality | `37a7039` `9f7b50b` `14ebaa7` `6af900c` | Complete behind `SPEAKING_LIVE_BETA_ENABLED`. Benchmark and latency runs need provider credentials. |
| 5 Organic launch | `e3a763e` `54fadd1` `f755568` `2566bdb` | Complete; paid ads stay at €0. Emails are Class B drafts; the first send is an owner checkpoint. |

Release-state command: **`npm run verify:a11-release`** — it turns the two
owner-blocked gates (recorded audio, named DaF review) from loud skips into
hard failures, so release evidence must quote it rather than `npm test`.
Checklists: `docs/releases/speaking-beta-checklist.md` and
`docs/releases/deutschstart-a11-launch-checklist.md`.

## Delivery gates

- [ ] **Gate A — course truth:** recorded audio manifest is populated, every lesson has linked listening and reading, review #23 edge cases are closed, and a named DaF reviewer signs the final course review.
- [ ] **Gate B — money truth:** Lemon Squeezy test purchase creates `course_a1_1`, grants 3,600 permanent seconds and 12 mission attempts once, and a test refund revokes the product without corrupting used ledger history.
- [ ] **Gate C — guided truth:** all 12 missions complete on mobile and desktop; task, language and acoustic pronunciation signals remain separate.
- [ ] **Gate D — live truth:** 5-, 10- and 15-minute sessions reserve/finalize/refund correctly and live audio safely falls back to guided mode.
- [ ] **Gate E — quality truth:** the 50-conversation dataset, DaF review, accessibility review, privacy review, latency checks and billing-concurrency suite all pass.
- [ ] **Gate F — launch truth:** production preview, checkout, webhook, entitlement, speaking, analytics and refund paths are verified before sending the first launch email.

## Execution discipline

1. Execute the plans in order.
2. Stop at every external checkpoint: secrets, Lemon Squeezy product creation, Supabase migration application, named human review, and production payment/refund verification.
3. Never substitute a mocked provider result for a required production gate.
4. Update this index with commit hashes and evidence links as each plan completes.
5. Do not enable `AI_COACH_PUBLIC_ENABLED` until Plans 2–4 have passed their full gates.

## Final verification

Run:

```powershell
npm test
npm run lint
npm run build:verify
```

Expected: all commands exit 0. Then verify the production flows listed in Gate F and record the exact Netlify deploy, Lemon Squeezy order, Supabase ledger entries, and PostHog events in a dated release-evidence document under `docs/releases/`.
