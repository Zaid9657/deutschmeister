# Main merge resolution — 2026-10-26

Verification performed on 2026-10-27 in `C:\Users\zaid1\deutschmeister-live`.

**Status: requested conflict contents resolved and artifacts regenerated. The full verification is not green.** The ten explicitly named test files pass **254/254**, and rule-card tests pass **35/35**. Validators, determinacy, reading checks, duplicate checks and ESLint under the repository configuration pass. The additional 101-file course/#229 integration sweep reports **889/1,017 passing, 128 failing**. A read-only `origin/main` baseline reproduces 127 failures; one is an incompatible expectation between #229's new empty-answer test and the live branch's deferred Hören feedback. No assertion was removed or weakened to hide it.

The index still has **five unmerged paths** because staging is prohibited. No conflict markers remain in tracked working-tree contents. No commit, add, reset, checkout, stash, merge-abort or push was run. No network or database operation was used for the merge work; service tests use their existing mocks. The supervisor's Modelltest resolutions and all four existing `.fablize/` files retain their initial SHA-256 hashes.

## Inputs and scope

- Branch: `claude/live-fixes-2026-10-25`.
- Ours / HEAD: `0107b8a73daf9a3933141a0073145bdfc5bd66d9`.
- Theirs / MERGE_HEAD / origin/main: `4be14743be235832d2ef7e93612e7ea2072461af`.
- #229: `555070e19289097e7b8ef9e74dad261d8e65323a`.
- Read the Batch 1 and Batch 3 reports and `git log -p 537d052..origin/main -- src/data/lessonPools/quality.js tests/assessment-integrity.test.mjs`.
- The interrupted run had already combined the conflicted source/test hunks and generated both pools. This run preserved that work, repaired the generator integration, regenerated outputs, and completed verification.
- This run changed source only in `quality.js` and `scripts/build-lesson-pool.mjs`; the already-resolved assessment test was preserved byte for byte. Diagnostic helpers are ignored files under `.cache/`.

## Resolution per hunk

| Hunk | Resolution |
| --- | --- |
| quality.js: opening/object shapes | Retain X-041's number-led noun phrases, optional separable prefix, measure phrases, nominative/subject recognition, imperative guard, and rejection of two constituents as one object. Retain live Batch 1's predicate and pronoun-object cues: the copula no longer rejects the shape, and pronouns are explicitly accepted as frontable. Questions and already-fronted statements keep Batch 1's openings. |
| quality.js: finite verb and exclusions | The finite-verb alternatives retain `e, st, t, en, et, ern, eln` plus the irregular forms. The combined `ern/eln` branch is equivalent to #229's separate `(er\|el)n` branch. `NOT_A_VERB_RE` contains #229's `vorgestern` and Batch 1's `acht, sieben, hundert, tausend`, plus every shared exclusion. |
| assessment-integrity.test.mjs: word-order test | Keep all seven new X-041 shape assertions, the three negative guards, both new generated-pool probes, and every existing assertion. The predicate and pronoun-object expectations remain `'Ich'`. The one-line decision comment cites both reviews. |

Exact retained decision comment:

```js
// Live Batch 1 + #229/X-041: keep 'Ich' cues; „Lehrer bin ich.“ and „Dich rufe ich an.“ are valid German.
```

Assertion preservation was checked by parsing the assertions, excluding source positions and formatting. All 168 HEAD assertions remain, with 12 additions. All 24 incoming assertions in the conflicted word-order test remain after applying only the two authorized null-to-`'Ich'` decisions:

```text
ASSERTIONS HEAD: 168 checked; 0 missing; 12 additional
ASSERTIONS origin/main: 24 checked; 0 missing; 0 additional
```

The full-file comparison to main additionally encounters two old exam-format claims already replaced by the live branch's Batch 3 assessment-scope assertions outside this conflict. Those pre-existing Batch 3 changes were preserved; this run did not edit either test expectation.

### Generator integration discovered on resume

Before the final change, assessment integrity passed 28/28 but Batch 1 failed 7/8:

```text
✖ Batch 1: every servable sentence-building item constrains or accepts its openings; cue-removal mutations fail
AssertionError [ERR_ASSERTION]: extra-a11-l03-07: every statement or question names its opening
ℹ tests 8
ℹ pass 7
ℹ fail 1
```

Three competing explanations were checked:

1. **Lost predicate/pronoun or verb shapes:** rejected. The initial assessment suite passed, including the merged shape assertions.
2. **Stale generated pools alone:** rejected. Replaying the interrupted generator entirely in memory reproduced both initial pool hashes exactly.
3. **The narrower X-041 detector was also controlling Batch 1's general prompt writer:** confirmed. Statements handled by the answer-key rule no longer received Batch 1's general opening cue, and later A1.2 passes placed some cues at the end of the prompt.

The chain is `repairOpeningCue` → `missingOpeningCue` → generated German prompt → English constraint translation → served item/test. The default detector must still return null for X-041's Angabe and two-constituent probes, while generation must retain Batch 1's broader prompt contract.

The minimal integration change adds the explicit option `missingOpeningCue(item, { allStatements: true })` at the generator call. The default remains the combined X-041 detector. Both modes retain the imperative/cued-prompt guards. No answer-key heuristic, acceptance list, ratchet, vocabulary whitelist or test assertion was changed. The repaired Batch 1 suite passes 8/8, alongside assessment integrity 28/28.

## Regeneration

Ran sequentially from the repository root, using the local cache:

```text
node scripts/build-lesson-pool.mjs a1.1
node scripts/build-lesson-pool.mjs a1.2
node scripts/sync-curricula.mjs
```

Generated targets:

- `src/data/lessonPools/a11.json`
- `src/data/lessonPools/a12.json`
- `netlify/functions/_shared/ruleCards.mjs` — the pool generator regenerates this automatically from the cache and 24 rule-card overrides; the live branch's changed overrides were retained.
- Seven curriculum twins: `astro-site/src/data/curricula/{a11.js,a11.lesen.js,a12.js,a12.lesen.js,a11.audio.js,index.js,constructions.js}`.

No generated target was hand-merged. The generated rule-card file has the same bytes as at resume. All 20 canonical/generated pairs pass the duplicate checker.

```text
BUILD a1.1 EXIT 0

rule-card overrides: 24 card(s) from /C:/Users/zaid1/deutschmeister-live/scripts/rule-card-overrides.mjs
→ /C:/Users/zaid1/deutschmeister-live/netlify/functions/_shared/ruleCards.mjs (24 rule cards for a1.1, a1.2, 12 from 
a1.1)
a1.1: 262 in cache → 118 kept (71 more dropped as untaught-lexis) + 25 generated + 236 hand-authored = 379
opening cues injected (object / modal adverb could open · Codex review 2026-10-07): 64
fronted word orders accepted (REVIEW #12 BLOCKER 1 · #13 BLOCKER 1): 6
⚠ 1 topic(s) below the 7-item floor after the untaught-lexis drop — hand-written extras needed:
BUILD a1.2 EXIT 0
rule-card overrides: 24 card(s) from /C:/Users/zaid1/deutschmeister-live/scripts/rule-card-overrides.mjs
→ /C:/Users/zaid1/deutschmeister-live/netlify/functions/_shared/ruleCards.mjs (24 rule cards for a1.1, a1.2, 12 from 
a1.2)
a1.2: 287 in cache → 141 kept (96 more dropped as untaught-lexis) + 0 generated + 154 hand-authored = 295
opening cues injected (object / modal adverb could open · Codex review 2026-10-07): 66
fronted word orders accepted (REVIEW #12 BLOCKER 1 · #13 BLOCKER 1): 11
Synced 7 curriculum file(s).
SYNC EXIT 0
```

The A1.1 generator's existing one-topic floor advisory was printed; generation and the strict curriculum validator both exited 0. No threshold was adjusted.

## Pool changes

Counts remain **379 A1.1 items** and **295 A1.2 items**. No item was added or removed. **Accepted lists, canonical answers and minLektion stamps are unchanged against both parents and against the interrupted generation.** Final item fields equal HEAD for both pools.

### Relative to the interrupted run

The read-only replay intercepts every generator write; its output hashes match the initial files:

| Pool | Initial/replay SHA-256 | Final SHA-256 |
| --- | --- | --- |
| src/data/lessonPools/a11.json | 04e4f5709265820a00847f4ab426149cc2fcf6e8cc8bf99536b714325ee4da5e | f1761c0fd19fe2197b9372c9946fb8ea97f0e47fc0c6329e019c041d285bb788 |
| src/data/lessonPools/a12.json | 023a0365016d391e33c40e012387eb0497417460646a362c8e141ae86ab65ca4 | 88d6552b329855f22348cbf317f3e6bbc9753d732d823d1400593319a6aa5deb |

A1.1 restores the German opening cue and corresponding English instruction on nine items. A1.2 moves eleven existing German cues from the end of the prompt to the normal position before the word bag; their English prompts are unchanged. No accepted list changes.

| Level | Item id | Changed fields | Result |
| --- | --- | --- | --- |
| A1.1 | `extra-a11-l03-07` | `questionDe`, `questionEn` | Restored opening `Wir` and English instruction. |
| A1.1 | `extra-a11-l12-13` | `questionDe`, `questionEn` | Restored opening `Mein Geburtstag` and English instruction. |
| A1.1 | `96b41b81-d57b-5bfe-91c8-93ef7d8982ca` | `questionDe`, `questionEn` | Restored opening `Ich` and English instruction. |
| A1.1 | `1958acf0-ed11-583e-88e0-6a55fab00172` | `questionDe`, `questionEn` | Restored opening `Wir` and English instruction. |
| A1.1 | `51d74698-b413-58f3-bbc5-1fde9f41f83b` | `questionDe`, `questionEn` | Restored opening `Er` and English instruction. |
| A1.1 | `extra-a11-l11-10` | `questionDe`, `questionEn` | Restored opening `Ich` and English instruction. |
| A1.1 | `extra-a11-l08-08` | `questionDe`, `questionEn` | Restored opening `Der Termin` and English instruction. |
| A1.1 | `extra-a11-l02-07` | `questionDe`, `questionEn` | Restored opening `Ich` and English instruction. |
| A1.1 | `extra-a11-l02-17` | `questionDe`, `questionEn` | Restored opening `Ich` and English instruction. |
| A1.2 | `extra-a12-l03-09` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l11-08` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l09-06` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `02f3c1af-470a-5019-9539-2dfbc5f6b0d2` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `4681b233-26bd-599d-910a-c76ad0222f80` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l12-08` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l12-09` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l10-05` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l10-06` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `extra-a12-l06-13` | `questionDe` | Existing cue moved before the word bag. |
| A1.2 | `ef8fe41f-51e0-5c6a-88c8-1e5fd291452a` | `questionDe` | Existing cue moved before the word bag. |

### Relative to the merge parents

| Comparison | German prompts | English prompts | Accepted lists | Other item fields |
| --- | ---: | ---: | ---: | --- |
| A1.1 vs HEAD | 0 | 0 | 0 | 0 |
| A1.2 vs HEAD | 0 | 0 | 0 | 0 |
| A1.1 vs origin/main | 59 | 88 | 0 | German/English explanation for `dd1c3d60-8ae7-4c94-8990-19633dcba36f` |
| A1.2 vs origin/main | 46 | 88 | 0 | 0 |

These differences from main preserve the already-reviewed live fixes. Full prompt-id inventories follow in the appendix.

## Required command results

```text
RUN node scripts/validate-curriculum.mjs
EXIT 0
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
RUN node scripts/validate-curriculum.mjs a1.2
EXIT 0
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
RUN node scripts/a12-determinacy.mjs a1.1
EXIT 0
a1.1: 406 served items, 0 correct alternatives rejected
RUN node scripts/a12-determinacy.mjs a1.2
EXIT 0
a1.2: 481 served items, 0 correct alternatives rejected
RUN node scripts/a11-lesen-check.mjs -v
EXIT 0
A1.1 Lesen declared strategies: max 2/4; bank max 32/64
Templates: 64 distinct; maximum repetition 1
PASS: A1.1 Lesen — 64 independent units; all gates pass
RUN node scripts/a12-lesen-check.mjs -v
EXIT 0
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
OK: no findings
```

`npm run check:duplicates`:
```text
DUPLICATES EXIT 0
20/20 canonical/generated pairs printed OK.
```

The ten explicitly named test files were run separately with:

```text
node --experimental-test-isolation=none --test --test-reporter=spec <absolute test path>
```

The normal worker-based attempt failed before tests ran with `Error: spawn EPERM`; the authorized no-worker fallback was then used throughout. Counts below are exact per-file output. Totals across separate invocations are arithmetic totals, not fabricated combined-run output.

```text
RUN tests/assessment-integrity.test.mjs
EXIT 0 tests/assessment-integrity.test.mjs
ℹ tests 28
ℹ pass 28
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/live-course-batch1.test.mjs
EXIT 0 tests/live-course-batch1.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-extra-items.test.mjs
EXIT 0 tests/lesson-extra-items.test.mjs
ℹ tests 28
ℹ pass 28
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/a12-rebuild.test.mjs
EXIT 0 tests/a12-rebuild.test.mjs
ℹ tests 60
ℹ pass 60
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkpoint.test.mjs
EXIT 0 tests/checkpoint.test.mjs
ℹ tests 78
ℹ pass 78
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-assessment-claims.test.mjs
EXIT 0 tests/course-assessment-claims.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-grammar-notices.test.mjs
EXIT 0 tests/course-grammar-notices.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-cast-continuity.test.mjs
EXIT 0 tests/course-cast-continuity.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/a11-lesen.test.mjs
EXIT 0 tests/a11-lesen.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-audio.test.mjs
EXIT 0 tests/course-audio.test.mjs
ℹ tests 29
ℹ pass 29
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/rule-card-overrides.test.mjs
EXIT 0 tests/rule-card-overrides.test.mjs
ℹ tests 35
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### ESLint

All 345 changed JS/JSX/MJS/CJS paths against HEAD were enumerated. A single `npx` invocation failed with `The command line is too long.`; batches of at most 35 paths completed.

The repository ESLint configuration excludes `astro-site/**`. The first batch was rerun with `--no-warn-ignored` under that configuration; the remaining 310 paths passed even with `--no-ignore`. Thus all applicable changed files pass `--max-warnings 0`. A separate `--no-ignore` run on the four resolution/generation files also passes.

```text
npx --offline --no-install eslint --no-warn-ignored --max-warnings 0 <batch 1-35>
CONFIGURED ESLINT BATCH 1-35 EXIT 0
npx --offline --no-install eslint --no-ignore --max-warnings 0 <each remaining batch>
ESLINT BATCH 36-70 EXIT 0
ESLINT BATCH 71-105 EXIT 0
ESLINT BATCH 106-140 EXIT 0
ESLINT BATCH 141-175 EXIT 0
ESLINT BATCH 176-210 EXIT 0
ESLINT BATCH 211-245 EXIT 0
ESLINT BATCH 246-280 EXIT 0
ESLINT BATCH 281-315 EXIT 0
ESLINT BATCH 316-345 EXIT 0
RESOLUTION ESLINT EXIT 0
```

For transparency, overriding the repository's Astro exclusion produced two pre-existing warnings and exit 1: unused `answered` at `astro-site/src/components/ExercisePlayer.jsx:172`, and unused `buildDate` at `astro-site/src/data/guides/index.js:173`. Both files are identical to origin/main (`git diff origin/main --exit-code` returned 0). They were not changed.

## Wider #229/course test verification: failures retained

The 101 additional test files in the appendix produced **1,017 tests / 889 pass / 128 fail**. None was skipped or cancelled. The ten named files and rule-card tests above are additional and all pass.

An existing read-only loader, `.cache/batch3-head-overlay.mjs`, received 57 origin/main file contents over stdin. It overlaid imports and file reads in memory, retained this checkout's CRLF convention, and did not check out or write files. The 40 failing files were rerun against that baseline:

- Current 40-file subset: **399 tests / 271 pass / 128 fail**.
- origin/main baseline: **399 tests / 272 pass / 127 fail**.
- Every failing test name and count matches the baseline except `checkpoint-empty-answer.test.mjs`, which passes 3/3 on main and fails 1/3 here.

A separate diagnostic preload, `.cache/main-merge-lf.mjs`, normalizes only text returned from reads inside this repository to LF, in memory. It leaves files and assertions intact. Those same 40 files then execute **422 tests / 410 pass / 12 fail** (more tests become visible when import/extraction failures no longer stop a file). This is diagnostic evidence, not a substitute claim that the requested unmodified invocation was green.

The remaining diagnostic failures are:

| File | Pass / tests | Cause |
| --- | ---: | --- |
| app-launcher.test.mjs | 2/4 | esbuild subprocess `spawn EPERM` |
| dashboard-free-fallback.test.mjs | 3/7 | esbuild subprocess `spawn EPERM` |
| review-seeding.test.mjs | 5/6 | timezone probe uses spawnSync; blocked subprocess has null status |
| telc-pilot-gate.test.mjs | 8/9 | built-HTML child process is blocked, so expected failure output is unavailable |
| lifecycle.test.mjs | 13/14 | repository scan matches Windows path separators incorrectly |
| page-login-return.test.mjs | 3/5 | auth-page scan misses Windows paths |
| checkpoint-empty-answer.test.mjs | 2/3 | immediate correctness expectation conflicts with deferred Hören feedback |

### One unresolved cross-branch assertion conflict

`tests/checkpoint-empty-answer.test.mjs:43` iterates every typed item, submits its canonical answer, and expects `set[0].correct === true`. Dictations are typed Hören items. Live Batch 2 deliberately changed `checkpointFeedback` to return only `{ answer }` for unfinished graded Hören, preventing feedback from exposing a later listening answer. The empty-input checks themselves pass; the unrelated immediate-correctness expectation fails with `undefined` versus `true`.

The conflicting live assertion is explicit: `tests/live-course-batch2.test.mjs:52` requires `release(it, it.answer, false)` to equal only `{ answer: it.answer }` for every Hören item. Returning correctness early would violate that existing assertion and restore the known answer-leak behavior. Changing the new assertion is outside the two authorized assertion changes, so neither assertion nor the feedback behavior was altered.

Additional unchanged feedback suites were run:

```text
node --experimental-test-isolation=none --test --test-reporter=spec tests/live-course-batch2.test.mjs tests/checkpoint-feedback.test.mjs
PASS: a1.1 Hören — 16/16 disjoint papers; inference 0/16; sequential expected 8/32 (chance 8/32)
PASS: a1.2 Hören — 16/16 disjoint papers; inference 0/16; sequential expected 8/32 (chance 8/32)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

This remains a test-contract decision for the supervisor; the merge cannot honestly be called fully green under the prohibition on any further assertion changes.

## Conflict and preservation checks

```text
git diff --name-only --diff-filter=U
src/data/lessonPools/a11.json
src/data/lessonPools/quality.js
src/pages/Modelltest/ModelltestOverview.jsx
src/pages/Modelltest/ModelltestResult.jsx
tests/assessment-integrity.test.mjs

git grep -n -E "^(<<<<<<<|>>>>>>>)"
(no matches)
MARKER SEARCH EXIT 1

git diff --check
(no whitespace/conflict-marker findings)
DIFF CHECK EXIT 0
```

An empty unmerged-index query is impossible while also obeying the explicit ban on staging. No lower-level index operation was used to bypass that restriction. The supervisor must stage the resolved files after reviewing this report and address the unrelated test-contract conflict before declaring the entire merge green.

SHA-256 preservation checks: both Modelltest files, the already-resolved assessment test, and all four existing `.fablize/` files are unchanged from resume. No claim is made that index entries were cleared.

## Appendix A — prompt ids differing from origin/main

### a11 / questionDe (59)

`extra-a11-l01-16`, `extra-a11-l01-17`, `extra-a11-l01-07`, `extra-a11-l01-08`, `extra-a11-l01-19`, `extra-a11-l01-24`, `extra-a11-l05-09`, `extra-a11-l05-10`, `extra-a11-l05-12`, `extra-a11-l05-20`, `extra-a11-l05-23`, `extra-a11-l04-36`, `extra-a11-l04-37`, `extra-a11-l04-39`, `extra-a11-l04-40`, `extra-a11-l04-41`, `extra-a11-l04-10`, `extra-a11-l04-17`, `extra-a11-l04-18`, `extra-a11-l04-38`, `dd1c3d60-8ae7-4c94-8990-19633dcba36f`, `extra-a11-l03-07`, `5e65eab6-eba1-5797-beb8-e34750c5ceb1`, `8908dc09-b16b-57e4-b056-e0f3060766c8`, `d09ae745-12d0-5a21-9648-88fc36a55de1`, `83bab298-abc5-5e7f-a132-1bb60a689b8a`, `extra-a11-l12-13`, `extra-a11-l07-08`, `96b41b81-d57b-5bfe-91c8-93ef7d8982ca`, `1958acf0-ed11-583e-88e0-6a55fab00172`, `51d74698-b413-58f3-bbc5-1fde9f41f83b`, `extra-a11-l11-01`, `extra-a11-l11-10`, `extra-a11-l08-17`, `extra-a11-l08-18`, `extra-a11-l08-07`, `extra-a11-l08-08`, `extra-a11-l02-07`, `extra-a11-l02-17`, `0b5c7d74-0e60-51b3-802e-50a4c8457f36`, `e52a4dca-4065-58a0-ae8f-de107844d5f2`, `20edbc50-95ff-5914-9381-9673b2716b68`, `fa2176d8-3252-57b7-8e4e-0c009303f306`, `78abfd45-9be5-51ff-a294-12c1aa43d6e9`, `6f0fbd89-79de-53ab-9b82-67b4f5f734ed`, `extra-a11-l10-07`, `extra-a11-l10-08`, `extra-a11-l10-09`, `extra-a11-l10-12`, `extra-a11-l10-13`, `extra-a11-l10-14`, `extra-a11-l10-15`, `extra-a11-l10-16`, `extra-a11-l10-17`, `extra-a11-l10-18`, `extra-a11-l10-19`, `extra-a11-l10-20`, `extra-a11-l10-21`, `extra-a11-l10-22`.

### a11 / questionEn (88)

`extra-a11-l01-16`, `extra-a11-l01-17`, `extra-a11-l01-07`, `extra-a11-l01-08`, `extra-a11-l01-18`, `extra-a11-l01-19`, `extra-a11-l01-23`, `extra-a11-l01-24`, `extra-a11-l05-09`, `extra-a11-l05-10`, `extra-a11-l05-12`, `extra-a11-l05-20`, `extra-a11-l05-23`, `extra-a11-l06-12`, `extra-a11-l06-13`, `extra-a11-l06-14`, `extra-a11-l06-16`, `extra-a11-l06-18`, `extra-a11-l06-19`, `extra-a11-l06-21`, `extra-a11-l06-10`, `extra-a11-l06-11`, `extra-a11-l06-15`, `extra-a11-l06-17`, `extra-a11-l06-20`, `extra-a11-l04-36`, `extra-a11-l04-37`, `extra-a11-l04-39`, `extra-a11-l04-40`, `extra-a11-l04-41`, `extra-a11-l04-08`, `extra-a11-l04-10`, `extra-a11-l04-12`, `extra-a11-l04-17`, `extra-a11-l04-18`, `extra-a11-l04-38`, `dd1c3d60-8ae7-4c94-8990-19633dcba36f`, `extra-a11-l03-07`, `5e65eab6-eba1-5797-beb8-e34750c5ceb1`, `8908dc09-b16b-57e4-b056-e0f3060766c8`, `d09ae745-12d0-5a21-9648-88fc36a55de1`, `83bab298-abc5-5e7f-a132-1bb60a689b8a`, `extra-a11-l12-13`, `extra-a11-l12-14`, `extra-a11-l12-15`, `extra-a11-l12-16`, `extra-a11-l12-18`, `extra-a11-l07-05`, `extra-a11-l07-08`, `96b41b81-d57b-5bfe-91c8-93ef7d8982ca`, `1958acf0-ed11-583e-88e0-6a55fab00172`, `51d74698-b413-58f3-bbc5-1fde9f41f83b`, `extra-a11-l11-01`, `extra-a11-l11-05`, `extra-a11-l11-08`, `extra-a11-l11-10`, `extra-a11-l08-17`, `extra-a11-l08-18`, `extra-a11-l08-07`, `extra-a11-l08-08`, `extra-a11-l09-05`, `extra-a11-l09-07`, `extra-a11-l09-14`, `extra-a11-l09-16`, `extra-a11-l02-07`, `extra-a11-l02-17`, `0b5c7d74-0e60-51b3-802e-50a4c8457f36`, `e52a4dca-4065-58a0-ae8f-de107844d5f2`, `20edbc50-95ff-5914-9381-9673b2716b68`, `fa2176d8-3252-57b7-8e4e-0c009303f306`, `78abfd45-9be5-51ff-a294-12c1aa43d6e9`, `6f0fbd89-79de-53ab-9b82-67b4f5f734ed`, `extra-a11-l10-07`, `extra-a11-l10-08`, `extra-a11-l10-09`, `extra-a11-l10-10`, `extra-a11-l10-11`, `extra-a11-l10-12`, `extra-a11-l10-13`, `extra-a11-l10-14`, `extra-a11-l10-15`, `extra-a11-l10-16`, `extra-a11-l10-17`, `extra-a11-l10-18`, `extra-a11-l10-19`, `extra-a11-l10-20`, `extra-a11-l10-21`, `extra-a11-l10-22`.

### a12 / questionDe (46)

`extra-a12-l03-14`, `extra-a12-l03-09`, `extra-a12-l01-01`, `extra-a12-l01-02`, `extra-a12-l01-03`, `extra-a12-l01-04`, `extra-a12-l01-05`, `extra-a12-l01-06`, `extra-a12-l01-08`, `6d0a5335-94cd-5d2d-b844-0343b6171c63`, `fcb99966-b8d2-5eb1-a466-f6c31cfa771e`, `68174fed-dcd5-52e1-93aa-a3efccab10f0`, `extra-a12-l11-08`, `extra-a12-l09-12`, `extra-a12-l09-06`, `extra-a12-l09-07`, `extra-a12-l09-08`, `02f3c1af-470a-5019-9539-2dfbc5f6b0d2`, `extra-a12-l04-10`, `extra-a12-l04-11`, `extra-a12-l04-12`, `extra-a12-l07-13`, `extra-a12-l07-06`, `extra-a12-l07-07`, `extra-a12-l12-17`, `extra-a12-l12-18`, `4681b233-26bd-599d-910a-c76ad0222f80`, `142167e5-246c-5ab9-bcd4-f916be43d05d`, `extra-a12-l12-08`, `extra-a12-l12-09`, `extra-a12-l12-10`, `extra-a12-l12-11`, `extra-a12-l10-13`, `extra-a12-l10-05`, `extra-a12-l10-06`, `extra-a12-l05-11`, `extra-a12-l05-07`, `extra-a12-l05-08`, `extra-a12-l05-09`, `97cb2bd7-3f5d-586f-bee1-032808437aab`, `edce8810-334e-5234-b03b-a9a90e94cb21`, `extra-a12-l06-12`, `extra-a12-l06-13`, `ef8fe41f-51e0-5c6a-88c8-1e5fd291452a`, `extra-a12-l06-08`, `extra-a12-l06-09`.

### a12 / questionEn (88)

`extra-a12-l03-14`, `extra-a12-l03-08`, `extra-a12-l03-09`, `extra-a12-l03-10`, `extra-a12-l03-11`, `c8ba2936-e494-510a-b33e-75feca9f2678`, `extra-a12-l01-01`, `extra-a12-l01-02`, `extra-a12-l01-03`, `extra-a12-l01-04`, `extra-a12-l01-05`, `extra-a12-l01-06`, `extra-a12-l01-07`, `extra-a12-l01-08`, `6d0a5335-94cd-5d2d-b844-0343b6171c63`, `fcb99966-b8d2-5eb1-a466-f6c31cfa771e`, `20fdea30-db58-5380-b2e5-c2a3eff7f6c7`, `68174fed-dcd5-52e1-93aa-a3efccab10f0`, `686d81f5-816b-53fc-b84e-2ea6c5aa237a`, `5223d628-e272-56f3-888a-d9ac6d33fe18`, `extra-a12-l11-01`, `extra-a12-l11-02`, `extra-a12-l11-03`, `96034fda-42dc-5e3d-8c8d-3c7c82591baf`, `extra-a12-l11-04`, `49d0d7b5-dbe0-560a-bce0-266b040e5851`, `12fbaa17-f441-5422-a3d9-180578be0fdf`, `ed269168-30a9-5096-855e-ee4a45232dd8`, `ee2c444a-6f1f-5166-85e7-a801dbcd5590`, `8b2e5c13-dce3-5540-a8dc-6e37a389d300`, `b484df20-10dc-5a1d-ab9e-68374c0fce16`, `extra-a12-l11-08`, `extra-a12-l11-09`, `e1716cd7-ccbe-544a-a65d-796cda3e0fe7`, `extra-a12-l08-01`, `52c72096-8586-55cd-923f-2d62c2d6eeb0`, `extra-a12-l08-02`, `f957e0b7-85cd-56c6-b645-14be566d80f7`, `extra-a12-l08-03`, `c96abb70-b2ad-58b9-bff2-29c141cfb222`, `e48e93b0-1786-5aab-9be4-9965af82cdcb`, `extra-a12-l09-12`, `extra-a12-l09-06`, `extra-a12-l09-07`, `extra-a12-l09-08`, `02f3c1af-470a-5019-9539-2dfbc5f6b0d2`, `extra-a12-l04-10`, `extra-a12-l04-11`, `extra-a12-l04-12`, `extra-a12-l04-13`, `0aae594f-f849-5da0-a289-2aafc08052ba`, `e2bd9783-ab59-5017-87b9-74872bf836c4`, `1b0e08fd-2629-52c8-881a-287913fb41a7`, `extra-a12-l07-05`, `extra-a12-l07-13`, `extra-a12-l07-06`, `extra-a12-l07-07`, `extra-a12-l07-08`, `extra-a12-l07-09`, `d2d9655f-6089-5f12-a81b-aabc0ea911ae`, `extra-a12-l12-17`, `extra-a12-l12-18`, `4681b233-26bd-599d-910a-c76ad0222f80`, `142167e5-246c-5ab9-bcd4-f916be43d05d`, `extra-a12-l12-08`, `extra-a12-l12-09`, `extra-a12-l12-10`, `extra-a12-l12-11`, `extra-a12-l10-13`, `extra-a12-l10-05`, `extra-a12-l10-06`, `extra-a12-l10-07`, `extra-a12-l10-08`, `18fdc9ae-c2b8-5aa4-83cf-c9e11fe8edf5`, `91763b6e-9511-54a0-b044-ff13b01990ac`, `extra-a12-l05-11`, `extra-a12-l05-07`, `extra-a12-l05-08`, `extra-a12-l05-09`, `97cb2bd7-3f5d-586f-bee1-032808437aab`, `edce8810-334e-5234-b03b-a9a90e94cb21`, `extra-a12-l06-12`, `extra-a12-l06-13`, `a68c2007-8c6d-5e15-906c-7cb300ed9fee`, `9ffacea3-144f-5ec1-8d5a-4a89c5e0aec9`, `ef8fe41f-51e0-5c6a-88c8-1e5fd291452a`, `extra-a12-l06-08`, `extra-a12-l06-09`.

## Appendix B — exact additional test pass/fail lines

```text
RUN tests/a1-2-listening-time-answers.test.mjs
EXIT 1 tests/a1-2-listening-time-answers.test.mjs
ℹ tests 3
ℹ pass 2
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/account-access.test.mjs
EXIT 0 tests/account-access.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/admin-lesson-status.test.mjs
EXIT 0 tests/admin-lesson-status.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/answer-equivalence.test.mjs
EXIT 0 tests/answer-equivalence.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/app-launcher.test.mjs
EXIT 1 tests/app-launcher.test.mjs
ℹ tests 4
ℹ pass 2
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/astro-door-ownership.test.mjs
EXIT 1 tests/astro-door-ownership.test.mjs
ℹ tests 1
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/astro-return-bar.test.mjs
EXIT 0 tests/astro-return-bar.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/b3-course-persistence.test.mjs
EXIT 0 tests/b3-course-persistence.test.mjs
ℹ tests 12
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/b3-player-recovery.test.mjs
EXIT 0 tests/b3-player-recovery.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/b4-privacy-navigation.test.mjs
EXIT 1 tests/b4-privacy-navigation.test.mjs
ℹ tests 12
ℹ pass 9
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/check-answer.test.mjs
EXIT 0 tests/check-answer.test.mjs
ℹ tests 25
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkout-access.test.mjs
EXIT 1 tests/checkout-access.test.mjs
ℹ tests 1
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkpoint-empty-answer.test.mjs
EXIT 1 tests/checkpoint-empty-answer.test.mjs
ℹ tests 3
ℹ pass 2
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkpoint-finished-save.test.mjs
EXIT 1 tests/checkpoint-finished-save.test.mjs
ℹ tests 7
ℹ pass 1
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkpoint-guest-save.test.mjs
EXIT 0 tests/checkpoint-guest-save.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/checkpoint-run-snapshot.test.mjs
EXIT 0 tests/checkpoint-run-snapshot.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/claims.test.mjs
EXIT 1 tests/claims.test.mjs
ℹ tests 32
ℹ pass 31
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/closed-class-typo.test.mjs
EXIT 0 tests/closed-class-typo.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/comparison-claims.test.mjs
EXIT 0 tests/comparison-claims.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/conversion-trust.test.mjs
EXIT 0 tests/conversion-trust.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-certificate.test.mjs
EXIT 1 tests/course-certificate.test.mjs
ℹ tests 10
ℹ pass 9
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-door-rule.test.mjs
EXIT 1 tests/course-door-rule.test.mjs
ℹ tests 14
ℹ pass 2
ℹ fail 12
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-home.test.mjs
EXIT 0 tests/course-home.test.mjs
ℹ tests 18
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-reminder-checkpoints.test.mjs
EXIT 0 tests/course-reminder-checkpoints.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-reminder.test.mjs
EXIT 0 tests/course-reminder.test.mjs
ℹ tests 24
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-resume-parity.test.mjs
EXIT 1 tests/course-resume-parity.test.mjs
ℹ tests 3
ℹ pass 0
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/course-value.test.mjs
EXIT 0 tests/course-value.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/daily-sentence-links.test.mjs
EXIT 0 tests/daily-sentence-links.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/dashboard-free-fallback.test.mjs
EXIT 1 tests/dashboard-free-fallback.test.mjs
ℹ tests 7
ℹ pass 2
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/dictation-match-values.test.mjs
EXIT 0 tests/dictation-match-values.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/dictation-numbers.test.mjs
EXIT 0 tests/dictation-numbers.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/entry-chunk-mocks.test.mjs
EXIT 0 tests/entry-chunk-mocks.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/exam-feedback-offer.test.mjs
EXIT 1 tests/exam-feedback-offer.test.mjs
ℹ tests 5
ℹ pass 4
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/exam-listening-load.test.mjs
EXIT 1 tests/exam-listening-load.test.mjs
ℹ tests 4
ℹ pass 3
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/exam-resume-lookup.test.mjs
EXIT 1 tests/exam-resume-lookup.test.mjs
ℹ tests 6
ℹ pass 5
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/exams.test.mjs
EXIT 0 tests/exams.test.mjs
ℹ tests 17
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/exercise-player.test.mjs
EXIT 0 tests/exercise-player.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/first-run.test.mjs
EXIT 1 tests/first-run.test.mjs
ℹ tests 32
ℹ pass 29
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/free-door.test.mjs
EXIT 0 tests/free-door.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/funnel-events.test.mjs
EXIT 0 tests/funnel-events.test.mjs
ℹ tests 12
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/german-sie.test.mjs
EXIT 0 tests/german-sie.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/graded-writing-restore.test.mjs
EXIT 1 tests/graded-writing-restore.test.mjs
ℹ tests 4
ℹ pass 3
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/grammar-attempt-merge.test.mjs
EXIT 1 tests/grammar-attempt-merge.test.mjs
ℹ tests 4
ℹ pass 1
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/grammar-review-topic.test.mjs
EXIT 0 tests/grammar-review-topic.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/grammar-topic-ux.test.mjs
EXIT 1 tests/grammar-topic-ux.test.mjs
ℹ tests 5
ℹ pass 3
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/language-strategy.test.mjs
EXIT 0 tests/language-strategy.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/legacy-course-billing.test.mjs
EXIT 0 tests/legacy-course-billing.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-engine.test.mjs
EXIT 0 tests/lesson-engine.test.mjs
ℹ tests 63
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-late-load.test.mjs
EXIT 0 tests/lesson-late-load.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-pool-failure.test.mjs
EXIT 0 tests/lesson-pool-failure.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-pool-rules.test.mjs
EXIT 0 tests/lesson-pool-rules.test.mjs
ℹ tests 49
ℹ pass 49
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lesson-run-resume.test.mjs
EXIT 0 tests/lesson-run-resume.test.mjs
ℹ tests 13
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lifecycle-claims.test.mjs
EXIT 0 tests/lifecycle-claims.test.mjs
ℹ tests 14
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lifecycle-links.test.mjs
EXIT 0 tests/lifecycle-links.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lifecycle.test.mjs
EXIT 1 tests/lifecycle.test.mjs
ℹ tests 14
ℹ pass 13
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/listening-attempt-regressions.test.mjs
EXIT 1 tests/listening-attempt-regressions.test.mjs
ℹ tests 9
ℹ pass 2
ℹ fail 7
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/listening-transcript.test.mjs
EXIT 1 tests/listening-transcript.test.mjs
ℹ tests 4
ℹ pass 1
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/llms.test.mjs
EXIT 1 tests/llms.test.mjs
ℹ tests 5
ℹ pass 4
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/lock-signup-door.test.mjs
EXIT 0 tests/lock-signup-door.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/login-return-path.test.mjs
EXIT 0 tests/login-return-path.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/navigation.test.mjs
EXIT 0 tests/navigation.test.mjs
ℹ tests 22
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/no-object-hasown.test.mjs
EXIT 0 tests/no-object-hasown.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/offers.test.mjs
EXIT 0 tests/offers.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/onboarding-completion-regressions.test.mjs
EXIT 0 tests/onboarding-completion-regressions.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/page-login-return.test.mjs
EXIT 1 tests/page-login-return.test.mjs
ℹ tests 5
ℹ pass 3
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-assessment.test.mjs
EXIT 0 tests/placement-assessment.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-bank-rules.test.mjs
EXIT 0 tests/placement-bank-rules.test.mjs
ℹ tests 12
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-draw.test.mjs
EXIT 1 tests/placement-draw.test.mjs
ℹ tests 9
ℹ pass 8
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-listening.test.mjs
EXIT 1 tests/placement-listening.test.mjs
ℹ tests 4
ℹ pass 3
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-owner.test.mjs
EXIT 1 tests/placement-owner.test.mjs
ℹ tests 6
ℹ pass 2
ℹ fail 4
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement-results.test.mjs
EXIT 0 tests/placement-results.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/placement.test.mjs
EXIT 0 tests/placement.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/profile-plan-button.test.mjs
EXIT 0 tests/profile-plan-button.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/progress-identity.test.mjs
EXIT 1 tests/progress-identity.test.mjs
ℹ tests 6
ℹ pass 0
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/progress.test.mjs
EXIT 1 tests/progress.test.mjs
ℹ tests 27
ℹ pass 24
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/purchases.test.mjs
EXIT 0 tests/purchases.test.mjs
ℹ tests 24
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/readiness.test.mjs
EXIT 0 tests/readiness.test.mjs
ℹ tests 9
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/requeue-lektion.test.mjs
EXIT 0 tests/requeue-lektion.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/review-owner-switch.test.mjs
EXIT 1 tests/review-owner-switch.test.mjs
ℹ tests 2
ℹ pass 1
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/review-seeding.test.mjs
EXIT 1 tests/review-seeding.test.mjs
ℹ tests 6
ℹ pass 5
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-eval-retry.test.mjs
EXIT 1 tests/speaking-eval-retry.test.mjs
ℹ tests 7
ℹ pass 1
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-evaluation-reservations.test.mjs
EXIT 1 tests/speaking-evaluation-reservations.test.mjs
ℹ tests 20
ℹ pass 1
ℹ fail 19
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-evaluation-stats.test.mjs
EXIT 1 tests/speaking-evaluation-stats.test.mjs
ℹ tests 2
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-migration-fallback.test.mjs
EXIT 0 tests/speaking-migration-fallback.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-reservations.test.mjs
EXIT 0 tests/speaking-reservations.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/speaking-turn-history.test.mjs
EXIT 0 tests/speaking-turn-history.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/srs-review-log.test.mjs
EXIT 1 tests/srs-review-log.test.mjs
ℹ tests 4
ℹ pass 3
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/srs-trainer-session.test.mjs
EXIT 1 tests/srs-trainer-session.test.mjs
ℹ tests 13
ℹ pass 3
ℹ fail 10
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/static-redirects.test.mjs
EXIT 0 tests/static-redirects.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/strong-verb-check.test.mjs
EXIT 0 tests/strong-verb-check.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/subscription-blocked-level.test.mjs
EXIT 1 tests/subscription-blocked-level.test.mjs
ℹ tests 6
ℹ pass 5
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/subscription-heading.test.mjs
EXIT 1 tests/subscription-heading.test.mjs
ℹ tests 9
ℹ pass 8
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/support.test.mjs
EXIT 0 tests/support.test.mjs
ℹ tests 9
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/sync-outbox.test.mjs
EXIT 0 tests/sync-outbox.test.mjs
ℹ tests 20
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/telc-pilot-gate.test.mjs
EXIT 1 tests/telc-pilot-gate.test.mjs
ℹ tests 9
ℹ pass 4
ℹ fail 5
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/telc-pilot.test.mjs
EXIT 0 tests/telc-pilot.test.mjs
ℹ tests 17
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/topic-order.test.mjs
EXIT 0 tests/topic-order.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/weekly-truth.test.mjs
EXIT 0 tests/weekly-truth.test.mjs
ℹ tests 9
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/welcome-links.test.mjs
EXIT 0 tests/welcome-links.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/writing-course.test.mjs
EXIT 1 tests/writing-course.test.mjs
ℹ tests 75
ℹ pass 72
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

RUN tests/writing-formcheck-name.test.mjs
EXIT 0 tests/writing-formcheck-name.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
## Appendix C — failing files, baseline, and LF diagnostic

| File | Current pass/tests | Main baseline pass/tests | LF diagnostic pass/tests |
| --- | ---: | ---: | ---: |
| `tests/a1-2-listening-time-answers.test.mjs` | 2/3 | 2/3 | 3/3 |
| `tests/app-launcher.test.mjs` | 2/4 | 2/4 | 2/4 |
| `tests/astro-door-ownership.test.mjs` | 0/1 | 0/1 | 10/10 |
| `tests/b4-privacy-navigation.test.mjs` | 9/12 | 9/12 | 12/12 |
| `tests/checkout-access.test.mjs` | 0/1 | 0/1 | 15/15 |
| `tests/checkpoint-empty-answer.test.mjs` | 2/3 | 3/3 | 2/3 |
| `tests/checkpoint-finished-save.test.mjs` | 1/7 | 1/7 | 7/7 |
| `tests/claims.test.mjs` | 31/32 | 31/32 | 32/32 |
| `tests/course-certificate.test.mjs` | 9/10 | 9/10 | 10/10 |
| `tests/course-door-rule.test.mjs` | 2/14 | 2/14 | 14/14 |
| `tests/course-resume-parity.test.mjs` | 0/3 | 0/3 | 3/3 |
| `tests/dashboard-free-fallback.test.mjs` | 2/7 | 2/7 | 3/7 |
| `tests/exam-feedback-offer.test.mjs` | 4/5 | 4/5 | 5/5 |
| `tests/exam-listening-load.test.mjs` | 3/4 | 3/4 | 4/4 |
| `tests/exam-resume-lookup.test.mjs` | 5/6 | 5/6 | 6/6 |
| `tests/first-run.test.mjs` | 29/32 | 29/32 | 32/32 |
| `tests/graded-writing-restore.test.mjs` | 3/4 | 3/4 | 4/4 |
| `tests/grammar-attempt-merge.test.mjs` | 1/4 | 1/4 | 4/4 |
| `tests/grammar-topic-ux.test.mjs` | 3/5 | 3/5 | 5/5 |
| `tests/lifecycle.test.mjs` | 13/14 | 13/14 | 13/14 |
| `tests/listening-attempt-regressions.test.mjs` | 2/9 | 2/9 | 9/9 |
| `tests/listening-transcript.test.mjs` | 1/4 | 1/4 | 4/4 |
| `tests/llms.test.mjs` | 4/5 | 4/5 | 5/5 |
| `tests/page-login-return.test.mjs` | 3/5 | 3/5 | 3/5 |
| `tests/placement-draw.test.mjs` | 8/9 | 8/9 | 9/9 |
| `tests/placement-listening.test.mjs` | 3/4 | 3/4 | 4/4 |
| `tests/placement-owner.test.mjs` | 2/6 | 2/6 | 6/6 |
| `tests/progress-identity.test.mjs` | 0/6 | 0/6 | 6/6 |
| `tests/progress.test.mjs` | 24/27 | 24/27 | 27/27 |
| `tests/review-owner-switch.test.mjs` | 1/2 | 1/2 | 2/2 |
| `tests/review-seeding.test.mjs` | 5/6 | 5/6 | 5/6 |
| `tests/speaking-eval-retry.test.mjs` | 1/7 | 1/7 | 7/7 |
| `tests/speaking-evaluation-reservations.test.mjs` | 1/20 | 1/20 | 20/20 |
| `tests/speaking-evaluation-stats.test.mjs` | 0/2 | 0/2 | 2/2 |
| `tests/srs-review-log.test.mjs` | 3/4 | 3/4 | 4/4 |
| `tests/srs-trainer-session.test.mjs` | 3/13 | 3/13 | 13/13 |
| `tests/subscription-blocked-level.test.mjs` | 5/6 | 5/6 | 6/6 |
| `tests/subscription-heading.test.mjs` | 8/9 | 8/9 | 9/9 |
| `tests/telc-pilot-gate.test.mjs` | 4/9 | 4/9 | 8/9 |
| `tests/writing-course.test.mjs` | 72/75 | 72/75 | 75/75 |

Exact failing-test lines from the requested unmodified runs (timings retained; repeated reporter copies omitted):

`tests/a1-2-listening-time-answers.test.mjs`

```text
✖ the three Uhrzeit dictations get a time with its unit, each guarded on the old bare number (14.14ms)
```

`tests/app-launcher.test.mjs`

```text
✖ the launcher sends each learner where they can learn (27.0021ms)
✖ the launcher waits for auth and entitlements, then redirects (replace) once (138.7579ms)
```

`tests/astro-door-ownership.test.mjs`

```text
✖ C:\Users\zaid1\deutschmeister-live\tests\astro-door-ownership.test.mjs (4.7515ms)
```

`tests/b4-privacy-navigation.test.mjs`

```text
✖ consent withdrawal while PostHog downloads prevents initialization and later capture (262.5537ms)
✖ PostHog capture and identify require the current shared consent choice (10.6868ms)
✖ course return controls follow the measured bottom navigation and reserve their own height (38.2502ms)
```

`tests/checkout-access.test.mjs`

```text
✖ C:\Users\zaid1\deutschmeister-live\tests\checkout-access.test.mjs (3.6534ms)
```

`tests/checkpoint-empty-answer.test.mjs`

```text
✖ an empty or blank typed answer is never checked, so it is never locked as wrong (125.8109ms)
```

`tests/checkpoint-finished-save.test.mjs`

```text
✖ a paper finished offline is kept before the writes, comes back after a reload, and is dropped only once saved (240.3611ms)
✖ a retake after a failed paper keeps the paper before it, and both are sent when the connection returns (41.6459ms)
✖ a finished paper the browser refused to store keeps its run snapshot, comes back after a reload, and is saved under one stamp (352.48ms)
✖ a refused finished-paper write with the account reachable is saved and leaves nothing behind (72.6938ms)
✖ two tabs: an older save landing never deletes the newer run another tab is taking (19.1888ms)
✖ a store full for the paper but not for the counter counts no attempt without the paper (5231.4288ms)
```

`tests/claims.test.mjs`

```text
✖ /ueber-uns/ names only exams with a track, and its crawlable copy says what the page says (5.9789ms)
```

`tests/course-certificate.test.mjs`

```text
✖ after A1.1 the next step is the live A1.2 course: the course itself with access, its ticket without (47.345ms)
```

`tests/course-door-rule.test.mjs`

```text
✖ a click before the lookup lands cannot open a checkout: Buy waits, aria-busy (18.3537ms)
✖ an owner who clicks Buy goes to the course, never to a second checkout (188.1519ms)
✖ a visitor who does not own the course still gets the checkout (12.3909ms)
✖ an unanswerable lookup sends the click to the app's resume, which checks ownership first (10.9737ms)
✖ a stalled lookup cannot hold Buy: after a few seconds it returns and a click takes the guarded resume (14.2699ms)
✖ a lookup that answers in time clears its timer (352.139ms)
✖ A opens the page, B signs in elsewhere, Buy: ownership is B's, so no second checkout (10.0546ms)
✖ B signs in elsewhere and does not own the course: the checkout opens for B, from B's own snapshot (6.7232ms)
✖ a snapshot that answers for another account than the one signed in never opens a checkout (6.6707ms)
✖ an account switch while the click waits for its read sends it to the guarded resume (7.0921ms)
✖ the doors show only the snapshot of the account still signed in (558.988ms)
✖ a signed-out visitor still takes the signup detour with the intent stored (6.9369ms)
```

`tests/course-resume-parity.test.mjs`

```text
✖ both front ends resume the newest course: an older A1.2 returned before a newer A2.1 (33.4905ms)
✖ both front ends resume the newest course: a newer A2.1 returned before an older A1.2 (49.4195ms)
✖ both front ends resume the newest course: a newer A1.2 (gone back to fill a gap) returned after an older A2.1 (3.9304ms)
```

`tests/dashboard-free-fallback.test.mjs`

```text
✖ with freeFallback, a free learner goes to the free course and no paywall view is counted (119.5359ms)
✖ with freeFallback, a placed learner goes to the course of their level when it is open to them (34.3081ms)
✖ without freeFallback, every other guarded route still shows the paywall (46.2779ms)
✖ account access still renders the dashboard; a guest still signs in; a brand-new account still waits for its retry (15.1643ms)
✖ the confirmation nudge's link lands on /login, which runs postAuthPath() (10.224ms)
```

`tests/exam-feedback-offer.test.mjs`

```text
✖ off-sale feedback uses the existing pilot course door, never checkout (30.3471ms)
```

`tests/exam-listening-load.test.mjs`

```text
✖ the mock runner shows a retry for a failed or empty listening part, never audio without questions (4.8219ms)
```

`tests/exam-resume-lookup.test.mjs`

```text
✖ findResumableAttempt tells "no attempt" (null) apart from a failed lookup (undefined) (38.4606ms)
```

`tests/first-run.test.mjs`

```text
✖ the dashboard reads exam work before it decides, and only while an exam is chosen (11.0567ms)
✖ every onboarding exit waits for the exam write, completes, then reloads the shared profile (9.2002ms)
✖ the dashboard renders the first-run card in the hero slot and demotes its other primaries (5.9455ms)
```

`tests/graded-writing-restore.test.mjs`

```text
✖ grade, remount: the assessment comes back with Next open and no second grading request (103.3251ms)
```

`tests/grammar-attempt-merge.test.mjs`

```text
✖ mergeGrammarAttempt: completion and the best score only go up; the first pass keeps its date (55.075ms)
✖ recordAttempt: 85 then 50 stays completed at 85 with the first date; 50 then 85 completes (2.5938ms)
✖ when the read fails the write is insert-only: a first run is kept, a stored pass is never overwritten unread (1.1364ms)
```

`tests/grammar-topic-ux.test.mjs`

```text
✖ every topic on a ticket level offers its level course, derived and never typed (5.6544ms)
✖ a topic a Lektion practises names that Lektion (0.7438ms)
```

`tests/lifecycle.test.mjs`

```text
✖ every table the app writes is classified as a lesson source or not (2036.6937ms)
```

`tests/listening-attempt-regressions.test.mjs`

```text
✖ pausing the third listen still permits resuming its unfinished playback (9.0283ms)
✖ a disabled listening player cannot start playback (9.0075ms)
✖ a play() that fails spends none of the three plays and shows no playing state (C-080/C-093) (19.2462ms)
✖ the playing state follows the element: an OS pause or a network error stops the equaliser (7.3774ms)
✖ the after-submit review player is not rationed: no cap, nothing counted (X-084) (16.5651ms)
✖ the graded dictation answer is always the text the field shows — an edit after typing is never dropped (8.1125ms)
✖ questions are listed dialogue by dialogue, numbered by position, in the attempt and in the review (25.4187ms)
```

`tests/listening-transcript.test.mjs`

```text
✖ a live row renders its transcript lines, each labelled with its voice (35.7267ms)
✖ a missing or malformed transcript renders no empty lines (2.1172ms)
✖ the old one-line fields are only a fallback, used when a row really carries them (1.2548ms)
```

`tests/llms.test.mjs`

```text
✖ committed llms files equal the generator output (run node scripts/build-llms.mjs) (464.4737ms)
```

`tests/page-login-return.test.mjs`

```text
✖ the walk finds the pages and their doors, so the rule cannot pass on an empty set (46.6954ms)
✖ every door to /login on a page outside the authentication flow hands over the page (state.from) (343.4155ms)
```

`tests/placement-draw.test.mjs`

```text
✖ LevelTest keeps the snapshot in this tab on every step and clears it on results and on a new run (7.085ms)
```

`tests/placement-listening.test.mjs`

```text
✖ the migrations are parsed: 4 × 78 rows, with the option-less dictation rows that trapped the step (37.0494ms)
```

`tests/placement-owner.test.mjs`

```text
✖ a run whose account is replaced is hidden in the same render, then dropped with its snapshot (10.1367ms)
✖ a run started before auth answered belongs to whoever auth then names (1.7623ms)
✖ an account's result is never kept on the browser after a sign-out, so the next account cannot claim it (4.4145ms)
✖ guest adoption: a signed-out result is saved to the account that signs up, and only into an empty placement (2.9676ms)
```

`tests/progress-identity.test.mjs`

```text
✖ a slow response for account A never lands under account B (64.9451ms)
✖ signing out drops the account's progress even with no guest progress stored (161.2147ms)
✖ a switched account shows nothing of the previous one while its own load runs (14.3234ms)
✖ a new user object for the same account (tab focus, token refresh) refetches nothing (13.5472ms)
✖ reading totals load with the first load, in one light query, before any reading is done (108.8989ms)
✖ the first completed reading lesson can only raise the level percentage (154.8014ms)
```

`tests/progress.test.mjs`

```text
✖ fetchDueCards serves the due reviews before the unseen backlog, then 10 new words (36.608ms)
✖ fetchDeckCounts reports due reviews plus the new-word allowance, and flags a failed read (32.0589ms)
✖ recordReview returns the saved state (null when the write failed) and still stamps last_reviewed_at (3.5275ms)
```

`tests/review-owner-switch.test.mjs`

```text
✖ A→B: a grade A made before B's deck loaded never moves B's deck, nor fetches A's batch end into it (35.7218ms)
```

`tests/review-seeding.test.mjs`

```text
✖ new and graded cards come due on the next local calendar day across both 2026 daylight-saving changes (Europe/Berlin) (48.1033ms)
```

`tests/speaking-eval-retry.test.mjs`

```text
✖ the evaluation request sends only the session token and classifies every answer (23.2234ms)
✖ a failed evaluation reaches the caller as a failure with a retry flag, never as "nothing was said" (4.5868ms)
✖ /speaking keeps the session through a failure and "Retry feedback" goes 409 → retry → 200 to the results (1.2511ms)
✖ the level test retries inside its speaking step and only then hands the result on (1.0487ms)
✖ a reply that arrives after the learner left is never played (52.5891ms)
✖ /speaking renders its head in every branch, including the signed-out screen (2.7903ms)
```

`tests/speaking-evaluation-reservations.test.mjs`

```text
✖ speaking evaluation reserves the last daily slot before concurrent provider calls (14.7888ms)
✖ speaking evaluation returns the stored placement result on retry, even at the daily cap (4.7795ms)
✖ speaking evaluation reuses historical stored feedback without regrading the transcript (14.1851ms)
✖ concurrent retries of one speaking evaluation spend only one provider call (12.6899ms)
✖ missing speaking evaluation RPC reserves the existing ledger before provider work (8.3069ms)
✖ missing speaking evaluation RPC still enforces the daily cap without claiming a new session (5.3634ms)
✖ speaking evaluation reservation errors never call the provider (12.1986ms)
✖ speaking evaluation keeps reserved usage when saving feedback fails (23.176ms)
✖ speaking evaluation retries a temporary feedback write without another provider call (9.9173ms)
✖ abandoned speaking reservations recover once on the same row even at the daily cap (7.3169ms)
✖ a renewed speaking reservation lease keeps its original timestamp from expiring the retry (5.4059ms)
✖ a speaking worker whose lease expired cannot overwrite the recovered feedback (4.8263ms)
✖ unusable speaking evaluation responses remain counted while a later retry can succeed (5.5369ms)
✖ failed speaking evaluations consume the last allowance even when the learner retries (6.6656ms)
✖ the stored session decides level and mode: a crafted body level or mode never reaches the prompt or the ledger (8.0739ms)
✖ an unknown session is refused with 404 before any reservation or provider call (4.2482ms)
✖ a scoreless or error-shaped model reply is retried, then failed — never stored as a completed zero-score evaluation (4.6527ms)
✖ a transcript with no learner line is refused with 409 before reserving, and is never graded or cached (5.8659ms)
✖ validSpeakingEvaluation accepts both rubrics and rejects incomplete answers (3.9076ms)
```

`tests/speaking-evaluation-stats.test.mjs`

```text
✖ speaking reservations and failed evaluations never count as dashboard practice or completed sessions (40.3864ms)
✖ dashboard speaking stats retain completed zero scores and legacy evaluations after a failed retry (27.4931ms)
```

`tests/srs-review-log.test.mjs`

```text
✖ the dashboard reads the log next to the cards and survives its absence (156.2554ms)
```

`tests/srs-trainer-session.test.mjs`

```text
✖ a double tap grades the visible card once and never drops the next card unseen (12.1317ms)
✖ a grade that was not saved keeps the card at the front, says so, and counts nothing (3.958ms)
✖ "Nochmal" re-queues the saved lapse, and the headline counts distinct words (4.7536ms)
✖ when the batch runs out the deck is counted again: more due → "Weiter üben" loads the next batch (4.3668ms)
✖ "Nichts mehr fällig" only for a freshly read zero — never for a failed count (4.639ms)
✖ reload is keyed on the user id, so a replaced auth user object does not restart the session (3.733ms)
✖ a reload never opens the next card on its answer side (4.1061ms)
✖ an empty deck offers the learner's own level in one click, and never a level they may not open (4.8852ms)
✖ "Im Trainer ✓" only after the words were saved; a failed add says so (4.478ms)
✖ the success label belongs to the words it added: another category or level starts fresh (4.0831ms)
```

`tests/subscription-blocked-level.test.mjs`

```text
✖ ACC-14: "Owned · open" opens the guided course where there is one (336.5409ms)
```

`tests/subscription-heading.test.mjs`

```text
✖ /subscription renders the heading from the lib, with the course cards' Buy test (39.8079ms)
```

`tests/telc-pilot-gate.test.mjs`

```text
✖ the SPA config gives the telc product a checkout id only when the sale is on (104.4911ms)
✖ the Astro helper gives the telc page a checkout id only when the sale is on (2.8406ms)
✖ /pricing/ reads the same switch and sells the package only while it is on (139.3131ms)
✖ the AI-facing catalogue reads the same switch; the committed pair is one state's render (537.0048ms)
✖ the built-HTML check holds every page, and on a deploy the catalogue, to the switch (3548.8511ms)
```

`tests/writing-course.test.mjs`

```text
✖ after the trial, a paid course's writing allowance needs the course: every course level in the bank, as a rule (74.0658ms)
✖ the trial's exam evaluations are exam texts only; a paid plan keeps the shared monthly ledger (17.3748ms)
✖ a feedback write that fails once is retried; a second failure is reported as saved:false (7.4694ms)
```

## Appendix D — audit helpers and evidence boundaries

The in-memory pool replay is `.cache/main-merge-replay.mjs`; every generator write is intercepted, and the replay hashes above match the initial files. The LF diagnostic helper is `.cache/main-merge-lf.mjs`. Both are ignored diagnostics inside this workspace. The baseline reuses the existing `.cache/batch3-head-overlay.mjs` with origin/main data supplied over stdin. None changes the source on disk, rewrites assertions, stages files or touches `.fablize/`. The normal requested runs and their failures are reported separately from these diagnostics.

