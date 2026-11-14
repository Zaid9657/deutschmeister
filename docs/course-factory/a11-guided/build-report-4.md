# Guided A1.1 — build report 4

Date: 2026-11-14. BUILD-BRIEF-4, Parts A–C. No commit or deployment.
Read CLAUDE.md, Team/Protocol v5, steward gates and the brief. Explicit user authorization covers the app path lock. Protected suites and the two excluded files remain unedited.

## Part A — proof stage (in progress)

The model has one production task per can-do, in order. The two compound can-dos require both acts in a single response: greeting + formal goodbye, and asking about wellbeing + answering. The other tasks introduce and spell the learner's own name. All four concern producing language, so none is a recognition choice. Short dialogue situations use taught words instead of new task vocabulary. Names reuse the pretest introduction helpers and scene `sayText`; names/text are not persisted.

Planned evidence uses existing attempt rows (`stage: proof`, one stable item id per can-do, `correct` means first-try success), plus sanitized run state for the unfinished proof. No database column or migration is needed.

Part A implemented: `proof` is lazy loaded, part 3 is speaking → writing → proof → requeue → recap. Back preserves passed evidence and still skips empty requeue. Typed answers use `checkAnswer/checkOptionsFor`; microphone responses use `ReadAloudLine` and the existing 0.8 threshold, with no self-confirm button in proof mode. Unavailable/unsure scoring offers typing. Retrying has no limit; each second miss reveals the original bilingual dialogue lines and their existing audio keys, then hides them before another attempt. The small translated goal label elides quoted answer chunks (including English labels quoting German), preventing answer leakage.

Snapshot `proof.goals` keeps counts/passed/firstTry and the hint/re-teach phase; `proofResumeIndex` sends any later saved position back to an unfinished proof. Names stay in memory and are re-entered when needed after reload. On passing all four tasks, existing attempt fields store first-try evidence under stable `proof-<lesson>-<index>` ids; no new schema, so missing-column failure is avoided entirely. The normal outbox retries write failures without losing those rows.

Fast gates PASS: pool build, curriculum validation, shared sync, lint, duplicates; focused proof/guided/player/Back/scoring/save-ask tests (8 files) and protected engine/curricula tests (9-file gate). Full initial run found only updated-stage expectations, a new test defect, string table placement, and the read-aloud harness missing the optional prop; corrected each. Full re-run started before Part B (log `part-a-tests-final.log`).

Tests added: `lesson-proof.test.mjs`. Unprotected guided stage expectations now explicitly include optional proof while keeping the unchanged-stage comparisons; the read-aloud cancellation harness supplies the new optional prop. No assertion removed or weakened. No protected-test conflict found; the protected Back rule is honored by showing an already-passed proof, never resetting it.

## Part B — completion and the lock (in progress)

Completion is gated before the existing guest/outbox writes; old completed records are not rewritten or revoked. The path lock will be shared across home and both routes and enforced in the app only, with level access unchanged.

Part A full re-run PASS: 302/302 test files, zero failures (`part-a-tests-final.log`).

Part B implemented: `src/lib/course/lock.js` extracts the previous boolean expression verbatim in behavior. `pathNodeAccess` adds neutral loading and preserves already-completed nodes even if their predecessor is absent. `CoursePathGuard` wraps both route runs, so a locked run never mounts; it shows a German/English explanation and one button to the current path step. Owner/level-scoped progress prevents stale-account/level permissions during navigation. Guest placement query context is retained in course links and the next-step actions. Pending completed outbox runs count on both home and guards, avoiding a new offline dead end.

Completion's existing guest/local and signed-in/outbox writes are reached only after `canCompleteProofLesson`; a run ref prevents duplicate effect execution. No new server or entitlement checks. Historical ledger records remain valid without proof evidence. A1.2's known-issues handoff was read; its lesson engine/content is unchanged.

Fast gates PASS: focused lock/home/pool/late-load/outbox/proof tests (6 files), rendered proof-loop test, lint, pool build, validator, shared sync and duplicate check. Full tests started as `part-b-tests.log`. Added exhaustive old-rule comparison, both rendered route guard states, real recap effect (withheld/once, guest/account), and storage/outbox failure/retry evidence tests. Updated unprotected home/source-location and route-wrapper assertions plus the home outbox harness to follow extraction; their original behavior assertions remain.

## Part C — validator and draft checker (in progress)

Part B full run found two additional unprotected harness assumptions: the A1.2 home stub did not provide the extracted lock exports, and the checkpoint owner-boundary assertion still expected a bare return without the guard. Updated both harnesses while preserving all assertions about language, node count, auth settling and keyed owner mounts. Regression gate PASS (3 files); the final full suite will verify the combined result. Added a hook-level test for pending/offline completion, waiting for progress/profile, account transitions and online listener cleanup.

Part C implemented: RULE 35 (`proofFindings`) checks shape, exactly one ordered task per can-do, nonempty bilingual Sie prompts, accepted forms, unique choices through `checkAnswer/checkOptionsFor`, name adapters, resolving bilingual re-teach pointers, and safe hints. Guided read and proof use one vocabulary walker and the same cumulative Wortfeld/seed lexicon, with no new exemption list. The optional notice pointer resolves, but notice metalanguage still has to satisfy that vocabulary rule. `guidedDraftFindings` checks draft proofs with the same rule, treating an omitted proof as absent rather than inheriting the live model. L1 JSON contains its equivalent proof object; CONTENT-BRIEF explains the contract, loop and four tasks.

Added `proof-content.test.mjs`: mutation tests cover each rule class, curriculum-validator integration, draft rejection, all 12 real CLI drafts, missing-proof compatibility and common-checker choice behavior. Fast gates PASS: validator/draft tests, hook tests, lint. Final pool/validator/sync, all drafts, duplicates, full suite, function syntax and clean builds are underway; logs are in `/tmp/a11-guided-build4/`.

Final review caught one documentation gate: the script catalogue lacked the new pure module. Added its effects/inputs/outputs row and updated the draft-checker's RULE 35 description; the original repository-guidance suite now passes unchanged. Route-link and microphone-uncertainty refinements have focused regression passes; the full final gates are being repeated against their final source.

Browser verification was attempted with the merged built output and a scripted mobile walkthrough. This sandbox rejects a local listener (`listen EPERM`); a pipe-connected, server-free Chrome run also exits on crashpad `setsockopt: Operation not permitted`. No screenshot or successful browser result is claimed. Rendered component/hook tests cover the proof loop, reload evidence, both guards and completion writes; live microphone service and browser layout remain unverified in this environment.

No git commit command was issued. During the run, workspace HEAD moved externally to WIP snapshots; those were not created by this assistant's commands. No git history or index operation was requested or performed here.
