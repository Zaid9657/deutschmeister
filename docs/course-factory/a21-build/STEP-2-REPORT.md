# A2.1 build — Step 2: engine only

Status: COMPLETE — engine only, verified 2026-10-23. Supervisor boundary: 2026-10-23.

## Scope and exit proof

Implement G7–G12 and exam-aware rules using synthetic A2 fixtures. Do not author or register A2.1. No network, database, commit, push, checkout or reset. All work stays in this repository; source reads use absolute paths.

Completion requires positive and malformed-fixture tests for the new kinds and surfaces, unchanged A1 engine fingerprints and byte-identical validator stdout, all requested Node suites, determinacy, duplicates, changed-file ESLint and Vite build, plus observed local rendering. Preserve every existing assertion's A1 meaning and every ratchet.

## Before evidence

Initial branch `claude/a21-build`, HEAD `d750177`; pre-existing untracked `.serena/` and this report. Both validators exited 0 and their entire stdout matched Step 1's report:

| Level | Bytes | SHA-256 |
| --- | ---: | --- |
| a1.1 | 6517 | b0c08aa0905c6cf210426886b703650cc079c277f16ac54b6a48b66ed9193c37 |
| a1.2 | 2767 | ddc9c7f0ab6c6e94fabc1faa84edef6c88f1811f2458f6b77dd865259a5761bf |

```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
```

## Implementation sections

The report began as a skeleton; each implementation and verification section was appended in a separate write.

## G9 and exam-aware rules — implementation

The shared exam contract now selects declared A2 SMS/email rather than lesson parity, while A1 retains its exact alternating kinds/ranges. The generic registered-level tests derive Teile and D5 caps from the level, retaining the twelve-writing-task and drawn-item assertions. The validator requires all declared A2 writing types to occur.

`src/lib/lesson/exam.js` validates authored Lesen/Hören banks and lesson blocks. Each unit is one response (including one assignment for `match`), with a single printed correct option. Builders serve papers by round and reject missing/malformed banks before the A1 Lesen path. Lesson stages use the same unit conversion; the player and checkpoint show text/audio and accessible picture options. Dependent Hören items and all Lesen items withhold feedback until completion. The course pass rule stays 60/40.

First fixture run: seven tests passed; the new token-cap boundary assertion failed because its supposed eleven-word input contained ten words. Counting tokens rejected a level-routing or cap defect; the fixture is corrected to eleven words with an explicit count assertion. Ordinary `node --test` failed at worker spawn (`EPERM`); subsequent tests use `--experimental-test-isolation=none` as authorized.

The synthetic three-lesson fixture validates **engine contracts**, not the twelve-lesson content standard. The full validator invokes those same rules and rejects its malformed variants; Step 3 still must satisfy all content rules and write all bank tasks/pool items.

## G7 — determinacy

`scripts/a12-determinacy.mjs` probes every authored lesson unit and every checkpoint paper, including `mc3` and `match`. A choice must have exactly one accepted printed option under the actual checker; case/punctuation-equivalent distractors fail. The shared bank validator enforces the same rule. A2 probes also cover two noun objects, subordinate-clause fronting and main-clause order; an explicit opening cue constrains the alternatives. A1 retains its old enumeration and alternative generation.

`tests/a21-exam.test.mjs` runs the probe against the small synthetic course, mutates a distractor into an answer alias, and checks two-object and subordinate-clause alternatives. This mechanical test cannot decide whether a human-written distractor is semantically defensible; Step 3's authored keys still need the planned language review.

## G10 — writing

The A2 rubric and short feedback take SMS 20–30 / email 30–40 from `examFormats.js`, including the strict under-50%-of-minimum floor. Tests deliberately pass contradictory task limits to prove that the exam contract wins, and test both sides of the floor in German and English. The rubric covers Leitpunkte, register/coherence, vocabulary and structures; SMS does not acquire formal-letter requirements. Existing public A2 task rows now declare `textsorte` and carry those ranges, in both byte-matched writing-task copies. No A2.1 course writing bank was authored.

`tests/a21-surfaces.test.mjs` checks the prompt, deterministic score gate, feedback and existing task rows. A1 prompt/gate branches remain unchanged; the existing writing-course tests are also run.

## G11 — derived word-order tiles

`derivedWordOrderMaxTokens(level)` returns 11 for A2 and preserves 8 for A1. The lesson builder passes the course level; the standalone derived-item helper can infer it from a lesson ID. The test proves an eleven-token A2 sentence is served, the same sentence is omitted for A1.2, and a twelve-token sentence is omitted for A2. A1's pinned derived draws stay unchanged.

## G12 — speaking

The Goethe A2 contract defines Teil 1's four question cards, Teil 2's four life prompts, and Teil 3's two named calendars. Validator and lesson builder reject missing or malformed material. `SpeakingFormat` renders cards/prompts and the learner's calendar; the partner's calendar remains available only to the coach, preserving the information gap. The existing hand-off, request parser, JSON session context and subsequent coach prompts carry the material without a schema migration. The A2 task takes precedence over an unrelated legacy mission.

The server bounds strings and array sizes at its request boundary. `tests/a21-surfaces.test.mjs` exercises all three formats through local storage, request parsing, session reconstruction and coach prompting without invoking any network or database. `tests/a21-exam.test.mjs` checks positive and malformed builder/validator cases, and `tests/a21-render.test.mjs` checks rendered cards, prompts and the hidden partner calendar. Live voice recording and AI evaluation remain outside this offline verification.

## G8 — level-generic chrome

`src/lib/course/meta.js` resolves metadata supplied beside a future curriculum. Intro/can-do translations, chapter stories, character roles, Wortfeld icons, welcome copy and checkpoint Landeskunde use that contract. Its validator checks parallel can-dos, ordered chapter coverage, character shape and sourced bilingual Landeskunde. Existing duration estimators are reused.

A1.1 retains its original metadata object and checkpoint Landeskunde branch. A1.2 retains its null metadata and existing word-icon defaults. `tests/a21-surfaces.test.mjs` accepts synthetic metadata and rejects malformed copies. `tests/a21-render.test.mjs` renders both A1 levels using the edited source and the source from HEAD, comparing the markup bytes for Intro, Wortfeld, Welcome, Speaking and checkpoint items.

The first full regression run exposed a source-level assertion requiring the original A1.1 Landeskunde branch. Three competing explanations were checked: changed content (rejected: the original data was untouched), changed A1 rendering (rejected: the rendered before/after comparison passed), and changed source structure (confirmed by the exact import/branch assertion). Restoring that branch while adding the generic branch resolves the causal chain without altering the assertion.

## Step 3 handoff — authored shapes

Use `tests/fixtures/a2-engine-course.mjs` as the executable **shape** example, not as course content. No `src/data/curricula/a21.js` or registry entry exists after this step.

Each checkpoint has `lesen: { papers: [...] }` and `hoeren: { papers: [...] }`. A paper is an array of units, four Lesen units or five Hören units. Supply every paper explicitly; no A1 generation or automatic distractors are used. Round `r` selects `papers[r % papers.length]`. IDs must be unique within each paper. The checkpoint's `nr` selects this contract:

| CP | Lesen (4 units per paper) | Hören (5 units per paper) |
| --- | --- | --- |
| 1 | Lesen Teil 3, `mc3` | Hören Teil 4: two `dictation`, three `trueFalse` (Ja/Nein) |
| 2 | Lesen Teil 2, `mc3` | Hören Teil 1, `mc3` |
| 3 | Lesen Teil 4, `match` | Hören Teil 3, `mc3` with three pictures |
| 4 | Lesen Teil 1, `mc3` | Hören Teil 2, `match` |

Every unit has `id`, `teil`, `kind`, `question`, `questionEn`, `answer`, `explanationDe`, `explanationEn`, plus `text` for Lesen or `audioText` for Hören. Hören must not put its transcript in `text`. Choices use string `options`; `answer` is exactly one printed option. `mc3` has exactly three options, `match` at least two, and `trueFalse` exactly `['Ja', 'Nein']`. A matching unit is one scored assignment to a named person/text, with the reference material in its text/audio; it is distinct from the old vocabulary `pairs` widget. Match and all repeated shared stimuli require the same `groupId`. Keys, correctness and explanations stay hidden during graded dependent items.

Picture MC adds `pictures: [{ option, src, alt }, ...]`, exactly three entries in option order, with local absolute asset paths and meaningful alternative text. CP1 dictations use `answer === audioText` and typed input. Audio playback uses the authored unit ID as its audio key; Step 3/owner recording must supply the audio. The read-instead fallback removes listening credit.

Lesson reading blocks use `lesen: { teil, units }`; an exam listening block uses `hoeren: { kind: 'exam', teil, units }`, with three to five units. Existing `hoeren: { kind: 'dictation', lines: [...] }` remains available. Add each rehearsed Teil to `examTeile`. A lesson's `schreiben` is `kind: 'mitteilung'`, with declared `textsorte: 'sms'` or `'email'` and its matching limits; both types must occur in the course. Checkpoint `schreiben` remains the existing authored writing-task object; writing drills still come from the pool. The twelve writing-bank-task assertion and the test that mutates a drawn pool item remain in place for Step 3.

`sprechen.open` retains its existing bilingual prompt/hints and declares `teil`; Teil 1 adds `cards: [four strings]`, Teil 2 `prompts: [four strings]`, and Teil 3 `calendar: [{ owner, slots: [{ time, activity }] }, { owner, slots: [...] }]`. The first calendar is the learner's, the second the coach's. Author bounded material: four cards/prompts, strings up to 160 characters; two calendars, distinct owner names up to 60 characters, at most twelve slots each, times up to 60 and activities up to 160 characters. Do not embed the partner's appointments in the public prompt.

Optional `curriculum.meta` supplies `aboutEn`, `outcomesEn`, ordered `chapters`, `characters` with `roleEn`/`appearsIn`, `lektionIntro[id]` with `situationEn` and parallel `canDoEn`, optional `wortfeldIcons`, and `landeskunde[nr]` with `titleDe/titleEn/bodyDe/bodyEn/source`. A metadata module can export this object; registration remains Step 3 work.

## Files changed

Paths are relative to `C:\Users\zaid1\deutschmeister-a21`. These are the 40 source, test, fixture and report files in the change:

```text
docs/course-factory/a21-build/STEP-2-REPORT.md
netlify/functions/_shared/speakingAI.mjs
netlify/functions/_shared/writingTasks.mjs
netlify/functions/evaluate-writing.mjs
scripts/a12-determinacy.mjs
scripts/validate-curriculum.mjs
src/components/course/CourseWelcome.jsx
src/components/illustrations/CharacterAvatar.jsx
src/components/lesson/ExamStimulus.jsx
src/components/lesson/IntroStage.jsx
src/components/lesson/PracticeItem.jsx
src/components/lesson/SpeakingFormat.jsx
src/components/lesson/SpeakingStage.jsx
src/components/lesson/WortfeldStage.jsx
src/data/curricula/examFormats.js
src/data/writingTasks.js
src/lib/checkpoint/buildCheckpoint.js
src/lib/checkpoint/feedback.js
src/lib/course/canDo.js
src/lib/course/meta.js
src/lib/lesson/buildLesson.js
src/lib/lesson/check.js
src/lib/lesson/exam.js
src/lib/lesson/mastery.js
src/lib/lesson/requeue.js
src/lib/lesson/skillStatus.js
src/lib/lesson/speaking.js
src/lib/lesson/strings.js
src/pages/CurriculumHomePage.jsx
src/pages/SpeakingPage.jsx
src/pages/lesson/CheckpointPage.jsx
src/pages/lesson/LessonPlayerPage.jsx
tests/a21-exam.test.mjs
tests/a21-render.test.mjs
tests/a21-surfaces.test.mjs
tests/curricula.test.mjs
tests/fixtures/a2-engine-course.mjs
tests/fixtures/a2-render-entry.jsx
tests/fixtures/a2-render.html
tests/fixtures/a2-render.jsx
```

No package/dependency, A1 curriculum, registry, pool or ratchet files changed. The existing A1 baseline fixtures and Step 1 engine/language tests are untouched. The pre-existing `.serena/` directory was not changed.

## Render observation and tooling limits

The synthetic fixture mounted the actual lesson/checkpoint/speaking components in local Vite and Chrome. Observed screenshots and accessibility state showed a three-option lesson answer becoming “Correct!”, a checkpoint assignment retaining neutral “Answer recorded” feedback, and the calendar speaking task showing Anna's appointments while withholding Ben's. The remaining card/prompt/picture layouts are covered by the executable React renderer tests. No live AI/audio service or database was invoked.

The initial headless browser harness failed with connection/frame errors and a watcher lock in its temporary profile. The harness was removed; local Chrome through the computer-use tool provided the observations above. The browser connection later became unavailable, so no further browser coverage is claimed. A final code-path inspection found that dependent Hören feedback had been withheld without opening its section review; the page now calls the tested `sectionFeedbackReady` rule for both Lesen and dependent Hören and labels the review accordingly.

Ordinary Node test-worker spawning returned `EPERM`; test commands use the authorized `--experimental-test-isolation=none`. The context tool's long combined test invocation hit its 300-second transport timeout; it is not counted as a pass. The durable rerun writes `.fablize/a21-step2-required-tests.log`. A read-only process diagnostic was denied by Windows and is unrelated to application behavior. ESLint/build and renderer tests ran through the local context runner because native esbuild spawning was restricted. npm/npx ran with offline mode; no dependency was installed. Vite only reported the existing stale Browserslist database advisory; no network update was attempted.

Task-generated local tooling artifacts include `.fablize/a21-browser/`, `.fablize/a21-browser-node/`, `.fablize/a21-step2-required-tests.log`, `.fablize/a21-step2-goals.json`, `.fablize/a21-step2-ledger.jsonl`, `.fablize/goals-before-a21-step2.json` and `.fablize/ledger-before-a21-step2.jsonl`. Automatic approval review rejected removal of the temporary browser profiles with “blocked by policy”; they remain outside the source deliverable. The completed task tracker is archived; the original tracked `.fablize/goals.json` / `ledger.jsonl` were restored and show no diff.

## A1 before/after proof

Both validator commands exited 0 after the engine changes. Comparison used raw stdout bytes, not normalized text; each hash equals the before hash and the pinned Step 1 output.

```text
a1.1: exit 0, bytes 6517, sha256 b0c08aa0905c6cf210426886b703650cc079c277f16ac54b6a48b66ed9193c37, baseline equal true
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
a1.2: exit 0, bytes 2767, sha256 ddc9c7f0ab6c6e94fabc1faa84edef6c88f1811f2458f6b77dd865259a5761bf, baseline equal true
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
```

The unchanged `tests/a21-engine.test.mjs` also passed its pre-Step-1 byte fingerprint, and the renderer test compared both A1 levels' markup against HEAD. The existing assertions in `tests/curricula.test.mjs` now select their contract through the exam format; the A1 contract is unchanged. No existing assertion was deleted or weakened, and no ratchet was raised.

## Verification commands and exact results

Commands ran from the repository root. The required Node run is:

```text
node --experimental-test-isolation=none --test --test-reporter=tap tests/curricula.test.mjs tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/checkpoint-feedback.test.mjs tests/a21-engine.test.mjs tests/a21-language.test.mjs tests/a21-exam.test.mjs tests/a21-surfaces.test.mjs
```

The new executable-renderer suite also ran separately with the same isolation flag: `node --experimental-test-isolation=none --test --test-reporter=tap tests/a21-render.test.mjs`. All three new test files are therefore included. A final focused run repeated `a21-engine`, `a21-exam`, `a21-surfaces` and `a21-render` after the Hören review transition change:

```text
final focused tests exit 0
# tests 23
# pass 23
# fail 0
# duration_ms 17219.8141
```

The specific A1 source regression was rechecked without modifying its assertions:

```text
Landeskunde regression exit 0
ok 1 - CheckpointPage mounts LandeskundeCard after the score, gated to a1.1 and keyed by checkpoint.nr
ok 2 - LandeskundeCard is a flat Card (no raised/interactive) and reads its language from useLessonLang
# tests 2
# pass 2
# fail 0
```

The validator commands and complete-output comparisons appear above. Other completed gates:

```text
node scripts/a12-determinacy.mjs a1.2
determinacy exit 0
a1.2: 481 served items, 0 correct alternatives rejected

npm run check:duplicates
duplicates exit 0
OK: src/data/writingTasks.js === netlify/functions/_shared/writingTasks.mjs
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
OK: src/data/curricula/index.js === astro-site/src/data/curricula/index.js

npx eslint --max-warnings 0 <all 38 changed .js/.jsx/.mjs files listed above>
ESLint 38 changed files exit 0

git diff --check: clean
```

All 18 duplicate pairs passed, not just the four lines excerpted above. Additional existing course-meta/writing-course checks and the new surface checks passed together earlier (98 tests).

The required combined suite completed with exit 0; its saved log contains these exact final lines:

```text
# tests 275
# suites 0
# pass 275
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 843491.7621
```

The separate renderer suite passed all five tests (also included in the final 23-test focused rerun). Thus the requested files plus every new test file passed. The final production build and the four feedback files changed after the full-file lint were rechecked:

```text
final feedback files ESLint exit 0
final vite build exit 0
✓ 2038 modules transformed.
rendering chunks...
✓ built in 40.20s
Browserslist: browsers data (caniuse-lite) is 10 months old. Please run:
```

That Browserslist advisory did not fail the build. The initial worker-spawn error, transport timeout, browser-tool failures and the A1 source regression are documented above; none is being counted as a passing check. The source regression was fixed and re-run. There are no outstanding engine test failures. Step 3 must still author the complete curriculum, banks, metadata and pool, and then satisfy the unchanged whole-course content gates.

The Fablize final checkpoint was supplied both the verification command and evidence and returned:

```text
fablize: G003 → complete
fablize: all stories complete ✓
```
