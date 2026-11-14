# Guided A1.1 — build report 4

Date: 2026-11-14. BUILD-BRIEF-4, Parts A–C. No commit or deployment.
Read CLAUDE.md, Team/Protocol v5, steward gates and the brief. Explicit user authorization covers the app path lock. Protected suites and the two excluded files remain unedited.

## Part A — proof stage (complete)

The model has one production task per can-do, in order. The two compound can-dos require both acts in a single response: greeting + formal goodbye, and asking about wellbeing + answering. The other tasks introduce and spell the learner's own name. All four concern producing language, so none is a recognition choice. Short dialogue situations use taught words instead of new task vocabulary. Names reuse the pretest introduction helpers and scene `sayText`; names/text are not persisted.

Evidence uses existing attempt rows (`stage: proof`, one stable item id per can-do, `correct` means first-try success), plus sanitized run state for the unfinished proof. No database column or migration is needed.

Part A implemented: `proof` is lazy loaded, part 3 is speaking → writing → proof → requeue → recap. Back preserves passed evidence and still skips empty requeue. Typed answers use `checkAnswer/checkOptionsFor`; microphone responses use `ReadAloudLine` and the existing 0.8 threshold, with no self-confirm button in proof mode. Unavailable/unsure scoring offers typing. Retrying has no limit; each second miss reveals the original bilingual dialogue lines and their existing audio keys, then hides them before another attempt. The small translated goal label elides quoted answer chunks (including English labels quoting German), preventing answer leakage.

Snapshot `proof.goals` keeps counts/passed/firstTry and the hint/re-teach phase; `proofResumeIndex` sends any later saved position back to an unfinished proof. Names stay in memory and are re-entered when needed after reload. On passing all four tasks, existing attempt fields store first-try evidence under stable `proof-<lesson>-<index>` ids; no new schema, so missing-column failure is avoided entirely. The normal outbox retries write failures without losing those rows.

Fast gates PASS: pool build, curriculum validation, shared sync, lint, duplicates; focused proof/guided/player/Back/scoring/save-ask tests (8 files) and protected engine/curricula tests (9-file gate). Full initial run found only updated-stage expectations, a new test defect, string table placement, and the read-aloud harness missing the optional prop; corrected each. Full re-run started before Part B (log `part-a-tests-final.log`).

Tests added: `lesson-proof.test.mjs`. Unprotected guided stage expectations now explicitly include optional proof while keeping the unchanged-stage comparisons; the read-aloud cancellation harness supplies the new optional prop. No assertion removed or weakened. No protected-test conflict found; the protected Back rule is honored by showing an already-passed proof, never resetting it.

## Part B — completion and the lock (complete)

Completion is gated before the existing guest/outbox writes; old completed records are not rewritten or revoked. The path lock is shared across home and both routes and enforced in the app only, with level access unchanged.

Part A full re-run PASS: 302/302 test files, zero failures (`part-a-tests-final.log`).

Part B implemented: `src/lib/course/lock.js` extracts the previous boolean expression verbatim in behavior. `pathNodeAccess` adds neutral loading and preserves already-completed nodes even if their predecessor is absent. `CoursePathGuard` wraps both route runs, so a locked run never mounts; it shows a German/English explanation and one button to the current path step. Owner/level-scoped progress prevents stale-account/level permissions during navigation. Guest placement query context is retained in course links and the next-step actions. Pending completed outbox runs count on both home and guards, avoiding a new offline dead end.

Completion's existing guest/local and signed-in/outbox writes are reached only after `canCompleteProofLesson`; a run ref prevents duplicate effect execution. No new server or entitlement checks. Historical ledger records remain valid without proof evidence. A1.2's known-issues handoff was read; its lesson engine/content is unchanged.

Fast gates PASS: focused lock/home/pool/late-load/outbox/proof tests (6 files), rendered proof-loop test, lint, pool build, validator, shared sync and duplicate check. Full tests started as `part-b-tests.log`. Added exhaustive old-rule comparison, both rendered route guard states, real recap effect (withheld/once, guest/account), and storage/outbox failure/retry evidence tests. Updated unprotected home/source-location and route-wrapper assertions plus the home outbox harness to follow extraction; their original behavior assertions remain.

## Part C — validator and draft checker (complete)

Part B full run found two additional unprotected harness assumptions: the A1.2 home stub did not provide the extracted lock exports, and the checkpoint owner-boundary assertion still expected a bare return without the guard. Updated both harnesses while preserving all assertions about language, node count, auth settling and keyed owner mounts. Regression gate PASS (3 files); the final full suite will verify the combined result. Added a hook-level test for pending/offline completion, waiting for progress/profile, account transitions and online listener cleanup.

Part C implemented: RULE 35 (`proofFindings`) checks shape, exactly one ordered task per can-do, nonempty bilingual Sie prompts, accepted forms, unique choices through `checkAnswer/checkOptionsFor`, name adapters, resolving bilingual re-teach pointers, and safe hints. Guided read and proof use one vocabulary walker and the same cumulative Wortfeld/seed lexicon, with no new exemption list. The optional notice pointer resolves, but notice metalanguage still has to satisfy that vocabulary rule. `guidedDraftFindings` checks draft proofs with the same rule, treating an omitted proof as absent rather than inheriting the live model. L1 JSON contains its equivalent proof object; CONTENT-BRIEF explains the contract, loop and four tasks.

Added `proof-content.test.mjs`: mutation tests cover each rule class, curriculum-validator integration, draft rejection, all 12 real CLI drafts, missing-proof compatibility and common-checker choice behavior. Fast gates PASS: validator/draft tests, hook tests, lint. Final pool/validator/sync, all drafts, duplicates, full suite, function syntax and clean builds are underway; logs are in `/tmp/a11-guided-build4/`.

Final review caught one documentation gate: the script catalogue lacked the new pure module. Added its effects/inputs/outputs row and updated the draft-checker's RULE 35 description; the original repository-guidance suite now passes unchanged. Route-link and microphone-uncertainty refinements have focused regression passes; the full final gates are being repeated against their final source.

Browser verification was attempted with the merged built output and a scripted mobile walkthrough. This sandbox rejects a local listener (`listen EPERM`); a pipe-connected, server-free Chrome run also exits on crashpad `setsockopt: Operation not permitted`. No screenshot or successful browser result is claimed. Rendered component/hook tests cover the proof loop, reload evidence, both guards and completion writes; live microphone service and browser layout remain unverified in this environment.

No git commit command was issued. During the run, workspace HEAD moved externally to WIP snapshots; those were not created by this assistant's commands. No git history or index operation was requested or performed here.

## Course rules changed in fact

CLAUDE.md itself is unchanged. Its referenced course conventions now have these scoped extensions:

- Completion at any practice score is no longer sufficient for a guided Lektion with `proof`: every goal must pass. Practice Gold remains ≥80% first-response practice only; proof contributes nothing to that score. Without proof, completion is unchanged.
- Guided part 3 now includes proof between writing and requeue. Both pauses and the first-pause guest save ask remain; requeue still immediately precedes recap. Back can show a passed proof but cannot revoke it.
- The existing course-home path rule now also guards direct lesson/checkpoint links. This is an app-only sequencing rule, separate from unchanged `hasLevelAccess` entitlement checks. Placement and historical completions remain honored.
- Can-do marks on a proof-bearing recap now name checked evidence. The existing run/attempt storage gains content-free proof flags and first-try rows; no DB columns, SQL or migration are needed. Existing snapshot age, owner scoping and outbox retry rules remain.

No protected-test conflict required a deviation from the brief. No protected assertions were edited or weakened. Compared with the session's starting revision, all named protected tests (including speaking-coach suites), CLAUDE.md and astro-site/package-lock.json are unchanged.

## Lektion 1 task inventory (derived from the authored proof)

| Can-do index | German situation | Form and reason | Dialogue re-teach indices |
| --- | --- | --- | --- |
| 0 | Frau Kaya: „Hallo!“ – Sie: … Frau Kaya: „Tschüss!“ – Sie: … | Typed or scored speech: demonstrate both greeting and formal goodbye, rather than recognize them. | 0, 8 |
| 1 | Frau Kaya: „Wie heißen Sie?“ | Typed or scored speech: introduce yourself; the model name is replaced by your own name. | 1 |
| 2 | Frau Kaya: „Buchstabieren Sie bitte.“ | Typed or scored speech: spell your own surname; reuse scene spelling and the shared separator folding. | 2, 3 |
| 3 | Frau Kaya: „Guten Tag!“ – Sie: …? Frau Kaya: „Gut, danke. Und Ihnen?“ – Sie: … | Typed or scored speech: both ask and answer about wellbeing; one recognition choice would not demonstrate the goal. | 6, 7 |

The canonical answers and bilingual twins are in the curriculum and L1 JSON model; name-bearing answers are adapted in memory. Indices are zero-based.

## Test inventory

Added: `lesson-proof.test.mjs`, `course-path-lock.test.mjs`, `proof-content.test.mjs`.

Updated unprotected suites: `guided-lesson` and `guided-rollout` (optional stage and part order), `course-home` (shared rule location), `a12-finish` (extracted module stub), `checkpoint-run-snapshot`, `lesson-late-load` and `lesson-pool-failure` (guard wrappers), `readaloud-startup-cancellation` (optional proof prop), `sync-outbox` (pending-run home stub), and `lesson-run-resume` (rebuilt stages plus proof resume guard). All preserve their earlier behavioral assertions; the resume assertion now also requires the proof guard.

## Final gate results — PASS

Parts A, B and C are complete. Final logs below supersede intermediate failures and pending-run notes.

| Gate | Result | Log under `/tmp/a11-guided-build4/` |
| --- | --- | --- |
| A1.1 pool build, curriculum validation, shared sync | PASS; 19 shared pairs synced | `final-pool.log`, `final-validator.log`, `final-sync.log` |
| Draft checker, Lektionen 1–12 | PASS; all twelve, including L1 proof | `final-drafts.log` |
| Lint, zero warnings | PASS | `final-lint.log` |
| Duplicate check | PASS; all 19 pairs identical | `final-duplicates.log` |
| Full `npm test` | PASS; 304 files, 304 passed, 0 failed/cancelled/skipped | `final-tests.log` |
| Syntax of every function and shared function module | PASS | `final-function-syntax.log` |
| Clean SPA build, rename index to app | PASS; previous dist moved to `/tmp/` before building | `final-spa-build.log` |
| Offline Astro build from committed cache | PASS; 143 pages | `final-astro-build.log` |
| Merge and prerender | PASS | `final-merge.log`, `final-prerender.log` |
| Full merged built HTML/crawl check | PASS; 151 pages, 0 failures/warnings; 146 sitemap URLs checked | `final-html.log` |
| Whitespace and protected/excluded files | PASS; no protected-file differences from starting revision | `git diff --check` and comparison with `d975ec5` |

Astro emits six unresolved-at-build-time font URL warnings; the complete merged HTML check is green. Browser screenshots/layout and the live authenticated microphone scorer remain unverified for the sandbox reasons above. No server checks, migrations, deployment, mail or other external writes were made. Lektionen 2–12 and A1.2 have no proof blocks and retain their earlier engine/completion behavior; their path entry points now use the shared sequencing guard as requested.

## Brief 4b

Implementation underway (2026-11-14). Read BUILD-BRIEF-4B, CLAUDE.md, Team/Protocol v5 and steward gates. Scope: ordered production parts, shared optional dialogue-speaker address rule, part-specific answer-free hints, and the matching RULE 35/draft/content contract. Scoring, persisted proof flags/counts, stage order and locks remain unchanged. Protected tests, CLAUDE.md and astro-site/package-lock.json will stay unedited; no commit or dependency installation.

Judging decision: only taught courtesy sentences (`Danke`, `Bitte`, `Entschuldigung`) may occur between/before/after required sentences without consuming a part. Every other sentence must fulfil the next required part; missing, substituted, reversed or arbitrary extra sentences fail. An optional comma-delimited address must exactly name a titled dialogue speaker; removing it never bypasses checking the remaining sentence. Formal tasks declare `register: 'formal'`; their part forms contain only the taught formal alternatives. Names continue through the existing introduction/spelling adapters.

Implemented shape: every production task now has `parts: [{ label: { de, en }, forms: [...] }]`; the canonical `answer` remains for the unchanged microphone scorer, and choices retain their existing `accepted` contract. Goals 2/3 still use the original own-name introduction/spelling checker on the whole response (including dotted/slashed letter separators). Goal 1 lists the taught formal greetings; goal 4 lists the full/short thanks answers and the taught `Mir geht es gut` form. Formal goals use `register: 'formal'`; RULE 35 rejects informal forms in those tasks.

`judgeProof` delegates each sentence/part to `checkAnswer` with `checkOptionsFor`, propagating CORRECT/TYPO/WRONG. The original proof pass treatment of TYPO is unchanged. Addresses/courtesies are derived from the current lesson, not enumerated in task data. Typed first misses identify the wrong/missing part; hints use its bilingual label and formal guidance, checked against the union of all part forms. The missing-part index lives only in screen state. Reload or a microphone miss names all relevant parts, keeping persisted proof flags/counts unchanged and storing no learner text. The existing microphone threshold, evidence, lock and stage order are unchanged.

RULE 35 and the draft checker now validate ordered labelled parts, forms, single-sentence forms, canonical model fulfilment, formal register and hints against every form of every part. Content JSON and CONTENT-BRIEF follow the contract. Added a 30-row response matrix plus by-class part/hint/register/address/lexicon/draft mutation coverage, and a rendered check that a missed goodbye displays `Der Abschied` without a solution. No protected tests edited.

Fast gates PASS: focused proof suites (3 files), pool build, curriculum validation, all 12 draft checks, shared sync, lint (zero warnings) and 19 duplicate pairs. Logs: `/tmp/a11-guided-build4b/`. Full suite, function syntax and clean merged builds follow.

### Brief 4b response matrix — as run

31 cases; all match the expected result. CORRECT and TYPO pass under the existing proof policy. Own-name adapter tests also pass, including separator variants.

| Goal | Answer | Expected | Actual |
| --- | --- | --- | --- |
| 1 | Guten Tag, Frau Kaya. Auf Wiedersehen, Frau Kaya. | correct | correct |
| 1 | Guten Tag. Auf Wiedersehen, Frau Kaya! | correct | correct |
| 4 | Wie geht es Ihnen? Gut, danke. | correct | correct |
| 4 | Wie geht es Ihnen, Frau Kaya? Mir geht es gut, danke. | correct | correct |
| 1 | Guten Tag! Auf Wiedersehen? | correct | correct |
| 1 | „Guten Tag, Frau Kaya!“ „Auf Wiedersehen.“ | correct | correct |
| 1 | guten tag! auf wiedersehen! | typo | typo |
| 4 | wie geht es ihnen?! gut, danke! | typo | typo |
| 1 | Guten Morgen. Auf Wiedersehen. | correct | correct |
| 1 | Guten Abend. Auf Wiedersehen. | correct | correct |
| 1 | Guten Tag und willkommen. Auf Wiedersehen. | correct | correct |
| 4 | Wie geht es Ihnen? Mir geht es gut. | correct | correct |
| 1 | Danke. Guten Tag. Bitte. Auf Wiedersehen. Danke. | correct | correct |
| 1 | Guten Tag. Auf Wiedersehen. Entschuldigung. | correct | correct |
| 1 | Hallo. Auf Wiedersehen. | wrong | wrong |
| 1 | Guten Tag. Tschüss. | wrong | wrong |
| 1 | Guten Tag. | wrong | wrong |
| 4 | Wie geht es dir? Gut, danke. | wrong | wrong |
| 1 | Auf Wiedersehen. Guten Tag. | wrong | wrong |
| 4 | Gut, danke. Wie geht es Ihnen? | wrong | wrong |
| 1 | Guten Tag, Frau Kaye. Auf Wiedersehen. | wrong | wrong |
| 1 | Guten Tag, Herr Kaya. Auf Wiedersehen. | wrong | wrong |
| 1 | Guten Tag, Frau Weber. Auf Wiedersehen. | wrong | wrong |
| 1 | Guten Tag, Kaya. Auf Wiedersehen. | wrong | wrong |
| 1 | Hallo, Frau Kaya. Auf Wiedersehen. | wrong | wrong |
| 4 | Wie geht es dir, Frau Kaya? Gut, danke. | wrong | wrong |
| 1 | Guten Tag. Danke. | wrong | wrong |
| 1 | Guten Tag. Nein. Auf Wiedersehen. | wrong | wrong |
| 1 | Guten Tag. Auf Wiedersehen. Nein. | wrong | wrong |
| 1 | Guten Tag, Frau Kaya und Herr Weber. Auf Wiedersehen. | wrong | wrong |
| 1 | (empty) | wrong | wrong |

Verification update: the full initial suite passed 305/305 files. Review added a quotation-mark case (31 rows total) so closing quotes never become a spurious extra sentence, and hardened malformed own-name parts. Focused suites pass again; final lint/full-suite and clean SPA/merge/prerender/HTML checks are running on that final source. Function syntax passed.

The standard Astro CLI build attempted to refresh Vite's cache inside the read-only symlinked `astro-site/node_modules` and failed with EROFS. Re-ran the same Astro build through its installed JavaScript API, preserving the project config and committed offline grammar cache, with only Astro/Vite cache directories redirected to `/tmp/a11-guided-build4b/`; PASS, 143 pages. No dependency directory or lockfile was edited. Browser screenshot attempt through the already installed Playwright/Chromium failed before page creation: sandbox `setsockopt: Operation not permitted` (SIGTRAP). No screenshot or live microphone check is claimed; rendered component tests cover the changed hint and proof loop.

The offline Astro cache workaround is reproducible without editing project configuration or dependencies:

```bash
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" node --input-type=module <<'JS'
import { build } from './astro-site/node_modules/astro/dist/index.js';
process.chdir('astro-site');
await build({ cacheDir: '/tmp/a11-guided-build4b/astro-cache', vite: { cacheDir: '/tmp/a11-guided-build4b/vite-cache' } });
JS
```

Final review: `CLAUDE.md`, `astro-site/package-lock.json`, all named protected tests (including speaking suites), and A1.2 source/twins are unchanged from session-start `e468cbeac4b05ec2424033dfc6829279b3d5f28b`; no protected-test conflict or deviation was needed. Lektionen 2–12 have no edits. No commit command or git write was issued; HEAD is still the starting revision. The 4b course-rule change is limited to judging proof productions as ordered taught parts rather than whole-string equality; microphone scoring, practice scoring, run/attempt storage, locks and stage order keep their earlier rules. Quotation marks are folded before sentence splitting, matching the common checker's punctuation treatment.

### Brief 4b final gates — PASS

These final results supersede the pending notes above. Logs are under `/tmp/a11-guided-build4b/`.

| Gate | Final result | Log |
| --- | --- | --- |
| A1.1 pool build | PASS | `pool.log` |
| Curriculum validation | PASS on final source | `validator-final.log` |
| All 12 guided drafts | PASS on final source | `drafts-final.log` |
| Shared sync and duplicates | PASS; all 19 pairs identical | `sync.log`, `duplicates.log` |
| Lint | PASS; zero warnings | `lint.log` |
| Focused proof tests | PASS; 3 files, including 31-row matrix and rendered hint | `focused.log`, `cases.md` |
| Full npm test | PASS; 305 files passed; 0 failures/cancelled/skipped | `tests-final.log` |
| All function/shared-function syntax | PASS | `functions.log` |
| Clean SPA build and index-to-app rename | PASS; prior generated dist moved to /tmp | `spa-build-final.log` |
| Offline Astro build | PASS; 143 pages; caches redirected outside dependencies | `astro-build.log` |
| Merge and prerender | PASS, once against clean final dist | `merge.log`, `prerender.log` |
| Full built HTML and crawl checks | PASS; 151 pages, 146 sitemap URLs, 0 failures/warnings | `html.log` |
| Protected/excluded files, A1.2, whitespace | PASS; unchanged from session-start revision; diff check clean | `protected.log`, `git diff --check` |

Open/unverified: browser layout/screenshot and live authenticated microphone service could not be exercised in this sandbox. Chromium failed at launch; no screenshot exists (`browser-probe.log`). Astro still emits the six existing unresolved-at-build-time font URL warnings; merged HTML verification is warning-free. All requested scripted gates are green. No protected-test conflict, dependency change, commit, deployment or external write.
