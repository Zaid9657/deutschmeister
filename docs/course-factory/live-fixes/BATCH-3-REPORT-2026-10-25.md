# Batch 3 live course fixes — 2026-10-25

Status: **Parts B and C are retained without reimplementation. Part D is finished locally: 456/457 affected tests pass, with one expected blind-review failure covering exactly its two changed reading units. Stopping at this finished-part boundary. Parts A, E, F and G are not implemented. This is not a completed batch or a sellability sign-off.** Starting branch `claude/live-fixes-2026-10-25`, HEAD `1263407`.
Offline only: no database, network, commits, pushes, checkout, reset or stash.
The two pre-existing untracked `.fablize/batch-1-*` files are untouched.

## Exit proof

Finish parts in order B, C, D, A, E, F, G. Each finding class requires a rule and a runnable regression, observed before/after evidence, and a completed report section. Rebuild each edited content level before validating it. No assertion may be weakened or deleted and no ratchet may rise. Corrected pinned claims require both the new assertion and a ban on the old wording. Run both validators, both determinacy checks, both reading checks, duplicate and curriculum sync checks, affected/new test files and changed-JavaScript lint. Render changed UI offline. Run the independent acceptance grader only if its untouched corpus has all 511 lines. Reading fixture remains supervisor-owned. No complete-batch or sellability claim while work or required verification is outstanding.

## Part B — Exam-format claims

**Finished locally.** A1.2 blocker B1 and A1.1 major M2 are addressed as one claim class. No assessment content, scoring algorithm, access rule or pass threshold was changed.

### Rule and investigation

Course descriptions must be derived from the delivered test's sections, section minutes, writing task labels and `passPercent`, never from `formatOf`, `examName` or an official exam's scoring. The shared `describeCourseTest()` implements that rule. Buyer pages, course homes, metadata, certificates, completion cards, the test hub, overview and course-result verdicts use it. Short homepage/index/offer copy calls these adapted course assessments and points to their scope. Checkpoint introductions describe the actual task mix in both languages. Course-writing labels call the four criteria a course practice rubric.

Reproduction: the HEAD buyer template contained both the exam-format and official-pass-line claims; the sweep also found them in canonical SPA/source copy. Competing hypotheses and evidence:
1. Only generated Astro twins were stale — rejected: the canonical offers, SPA, strings and A1.1 metadata contained the claims.
2. The delivered assessments matched the promise — rejected: importing all four test modules showed the section inventory below, without Sprechen and without official scoring.
3. Reference-exam metadata and hardcoded sales prose were being used as delivery descriptions — confirmed. The chain was test registry/reference label → independent template text → buyer/learner claim, while the A1 test intros already described a partial assessment. Rendering the section-derived description closes that drift mechanism.

### Actual delivered scope

| Test | Included and timing | Excluded | Course pass rule |
| --- | --- | --- | --- |
| A1.1 | Hören 15 min + Lesen 15 min + Formular writing self-check 10 min = **40 min** | Free message; Sprechen; writing from the score | At least 60% of combined automatically scored Hören/Lesen points |
| A1.2 | Hören 15 min + Lesen 15 min + Mitteilung writing self-check 10 min = **40 min** | Formular; Sprechen; writing from the score | Same course rule |
| A2.1 legacy page path | Hören 15 min + Lesen 20 min + SMS and E-Mail self-checks 20 min = **55 min** | Formular; Sprechen; writing from the score | Same course rule |
| A2.2 legacy page path | Hören 15 min + Lesen 20 min + SMS and E-Mail self-checks 20 min = **55 min** | Formular; Sprechen; writing from the score | Same course rule |

The sections and timing are read from the real modules, including legacy tests served by the shared page. The German and English summaries explicitly deny full examination-format fidelity and official scoring. A1.2 has no separate `a12.meta.js` in this checkout; its equivalent is the generic curriculum home, now using the same description. The course standard keeps **OPEN requirement: full-format level test**, including communicative listening/speaking and both A1 writing tasks, subject to implementation and independent checking.

### Claims, old → new

| Surface | Old | New |
| --- | --- | --- |
| Buyer-page test stamp | `{format} format` | `adapted course assessment` |
| Buyer final-test heading/body | `Final test in the {format} format`; `Timed, half exam length`; `scored against the exam's pass line` | `Final course assessment` + section-derived scope, omissions, total timing and combined course pass rule |
| Course index | `a final test in the exam format` | `an adapted final course assessment`; course pages list sections, omissions, timing and course pass rule |
| Homepage Proof | `The final tests use those exams’ formats` | `adapted course assessments with their own scoring rules` |
| Homepage Progression | `The final test in the exam’s format` | `An adapted final course assessment`, with a course result |
| Canonical offer + Astro twin | `ending in a final test in … format` | `ending in an adapted course assessment (scope and course pass rule on the course page)` |
| A1.1 metadata | `shortened practice test in the Start Deutsch 1 format` | Derived A1.1 assessment description; account/save/AI-feedback disclosure preserved |
| Generic curriculum home, including A1.2 | `ends with a shortened practice test in the {curriculum.examName} format` | Derived description of the curriculum's actual `testSlug` |
| Legacy course home | `ends with the {course.testFormat} final test` | Derived description of that course's actual test |
| Certificate, German | `Übungstest im Format …` | Passed course assessment + German section-derived description |
| Certificate, English | `practice test in the … format` | English section-derived description |
| Completion card | `Final test · … format`; `half exam length, scored against the real pass threshold` | `Final course assessment` + derived description |
| Course-test hub | All levels: `Kurzversion im Start-Deutsch-1-Format` | Each test's own German description, including legacy A2 tests |
| Course-test overview | Separate intro copy | Derived German description for course tests; external mocks keep their own intro |
| Course-test results | Could inherit `dokumentierte 60%-Grenze` external-mock wording | `Kurs-Bestehensgrenze …` + the actual course-test description |
| Checkpoint intro, DE/EN | `im Format Ihrer Prüfung` / `in the format of your exam` | `ein adaptierter Kurstest, keine Prüfungssimulation` / `an adapted course assessment, not an exam simulation`; actual task mix and course scoring distinction |
| Writing note and recap, DE/EN | `Prüfungskriterien` / `exam criteria` | `Kurs-Übungsraster` / `course practice rubric`; four course practice criteria in recap |
| Course standard §1/§3/§5 | Delivered official format; `Goethe/telc mirror`; `SD1 format` | Delivered adapted assessment, accurate custom course rules; full-format assessment explicitly OPEN |
| Course-standard writing rubric | Goethe criteria / equivalence to human raters | Four course practice criteria, 0–5 each; no claim of official marking or equivalence to human raters |

### Test and before → after evidence

`tests/course-assessment-claims.test.mjs`:
- Bans the old examination-format and scoring claims on 16 buyer/learner source surfaces and checks planted old-claim controls. Its guarded phrase matches against HEAD decrease **17 → 0**. The multiline A1.1 metadata claim is additionally checked at runtime by the strengthened existing assessment-integrity test.
- Resolves all delivered slugs from public course contents, current curricula and legacy courses: **4/4** descriptions match real sections, writing tasks, omissions, times and combined course threshold. Mutating a test from 15 to 17 listening minutes and 60 to 65% changes the description to 42 minutes and 65%.
- Checks detailed consumers use the shared description, both checkpoint languages disclose the adapted assessment, and writing copy disclaims official criteria.
- Requires the standard's OPEN full-format requirement and bans the old delivered-format/mirror assertions.

Three old assertions pinned claims this part had to correct: two in `assessment-integrity.test.mjs` (home and A1.1 metadata) and one in `checkpoint.test.mjs`. Each was **replaced with the corrected-wording assertion PLUS a ban on the old claim**. No assertion was deleted or weakened, and no ratchet changed.

Exact new-suite result:
```text
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Both pools were rebuilt before their validators, including after the final copy edit. Both pass with unchanged debt; this part does not purport to fix the later findings. The 48-file affected-test inventory below totals **703 tests, 697 pass, 6 reproduced baseline failures**. This total combines the latest complete run of each file; it is not a claim that one combined invocation printed that summary.

The offline Astro build completed, and all four buyer assessment cards were read in the browser and in their screenshots at 390 × 900. All showed `overflow:false`; final captures show complete, unobscured cards. No authenticated SPA browser flow, database, payment, live audio or AI service was exercised. SPA changes are covered by source/component contract tests and the shared-description tests.

No A1.1 dialogue line or reading-bank unit changed in Part B. Audio re-run list: **empty**. Changed reading unit ids: **empty**.

## Part C — Grammar notices and register

**Finished locally.** The five new regressions and all 35 existing rule-card tests pass together (**40/40**). Both rebuilt curricula pass with every existing ratchet unchanged. The 53-file resumed sweep leaves only seven isolated baseline failures; exact results and the successful regression reruns are recorded below.

### Rule, investigation and claims

Defaults must be qualified, exceptions must reach both notice languages and the generated help card, neutral numeral stress must mark the first component, and all shared test UI must address Sie. The source generator remains the authority for help cards; no generated card was hand-patched.

The source reproduction showed the missing German `du tanzt`, the absolute pronoun claim, the overbroad negation claim in both the notice and card generator, the wrong stress marking, and the informal exhausted-playback message. Three hypotheses were checked: (1) stale generated output alone — rejected, because the generator itself carried both wrong grammar claims; (2) a rendering/translation-selection bug — rejected, because the imported German/English notice bodies already differed; (3) parallel prose and incomplete guard scope — confirmed: the prior register scan omitted the shared runner, while the bilingual checks did not require the same exception. The chain is canonical notice/card override → generation or curriculum sync → learner notice/help/runner. The new tests cover these sources and the generated cards.

| Finding / surface | Old → new | Before → after |
| --- | --- | --- |
| A1.1 L7 German/English notice | Missing German exception; English only named s/z → both name s/ß/x/z, du-form `-t`, `du tanzt` | German missing exception **1 → 0** |
| Personal-pronoun notice and card | Unqualified noun/article rule; `Der Artikel entscheidet, nicht die Person.` → `normalerweise`, plus known-person reference and `Das Kind heißt Paul. Er ist zwei.` | Absolute claim **1 → 0**; known-person exception now in both notice languages and the generated card |
| Pronoun card mistake | Valid contextual `Das Kind ist jung. Er ist zwei.` labelled wrong → genuine agreement error `Das Kind ist jung. Es bist zwei.` | Valid er-continuation labelled wrong **1 → 0** |
| A1.2 negation notice and card | `nicht steht am Satzende oder direkt vor dem Wort` → sentence negation before the final prefix/infinitive/participle, with `Ich kaufe heute nicht ein.`; contrastive word negation illustrated by `nicht heute, sondern morgen` | Overbroad claim **2 canonical surfaces → 0** |
| Numeral stress | `ein-und-ZWAN-zig` → `EIN-und-zwan-zig` | Wrong markings **1 → 0** across all **8** numeral cues (five A1.1, three A1.2); `VIER-hun-dert` and `DRIT-te` retained |
| Shared runner | `Keine Wiedergabe mehr — beantworte die Fragen` → `Keine Wiedergabe mehr — beantworten Sie die Fragen.` | Informal runner instruction **1 → 0** |
| Other notice asymmetries found in the 24-pair review | English omitted `scharfes S`; German omitted caution against inferring gender from meaning and polite Sie for one/several people → both languages now carry those points | These three one-sided points **3 → 0** |

`tests/course-grammar-notices.test.mjs` scans all 24 notice pairs for eleven reviewed semantic rule/exception classes, requires nonempty coverage, deletes each rule in each language as a failing mutation, and reverses the known-person exception as two further failing mutations. It checks both canonical and generated pronoun/negation cards, explicitly bans the old claims, and rejects the old er-continuation as a supposed mistake. It scans numeral cues in both courses and plants wrong initial/noninitial stress. It scans every JSX screen in `src/pages/Modelltest/` and the checkpoint/test/exam UI-string namespace, including a planted informal exhausted-playback message. The existing checkpoint register test was extended to the shared runner/overview/result and `beantworte`; no existing assertion was deleted or weakened.

### Verification during editing

The unchanged card/input guards caught drafting regressions: shortening prose removed `alles`, `wechselt`, `dazu`, `sondern` and other already-used teaching language; the first A1.2 rebuild reported RULE 20 = 1 (`alles`), and card checks named the other omissions. The broader A1.2 suite also caught the removed instructional term `unbestimmtem`; the full `mit unbestimmtem Artikel oder ohne Artikel` explanation was restored. These were fixed in the prose, without a whitelist or ratchet increase. Removing `mit` from the pronoun notice temporarily moved five spelling tasks from L3 to L4; restoring `Sie mit großem S` restored their original eligibility. The final generated pools have **no semantic Git diff**, including their accepted arrays and `minLektion` stamps (379 A1.1 / 295 A1.2 items). Two new-test selector bugs (ordinal spelling and dotted UI keys) were fixed while keeping their non-vacuity assertions.

Final focused test lines:
```text
ℹ tests 40
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The final run after restoring `unbestimmtem` also included all 60 A1.2 rebuild tests:
```text
ℹ tests 100
ℹ pass 100
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 342751.1896
```
The modified German notices contain 58/59/54/50 words (A1.1 L1/L3/L4/L7) and 55 words (A1.2 L4), within the unchanged 60-word cap. The shared UI namespace scan covers 84 checkpoint strings across both languages.

After each content revision the affected pool was rebuilt before its validator. A1.1 RULE 10/6b/15/23 remain **14/23/3/57**; A1.2 remain **0/0/0/4**. RULE 20 returned to **0** for both levels. Curriculum sync and all 19 duplicate pairs pass. The existing determinacy/reading gates also pass at their original measurements; these are bounded checks and do not close Parts A/E.

Part C changes: `src/data/curricula/a11.js`, `src/data/curricula/a12.js`, their two Astro twins, `scripts/rule-card-overrides.mjs`, generated `netlify/functions/_shared/ruleCards.mjs`, `src/pages/Modelltest/ModelltestRun.jsx`, `tests/checkpoint.test.mjs`, new `tests/course-grammar-notices.test.mjs`, and this report. Pool files were regenerated but have no semantic diff. No A1.1 dialogue line or reading unit changed: audio/review lists remain empty. These are prose edits with no component/layout change; verification exercises the content and shared UI-copy contracts, not a claim of an authenticated browser flow.

## Part D — Cast continuity

**Finished locally.** The reported M5 contradictions are corrected. The expanded RULE 14 and its four new regression tests pass, both rebuilt validators pass, and no assertion or ratchet was weakened. Fresh supervisor review of the two edited reading units remains required.

### Rule and causal investigation

Recurring characters keep their established facts across lesson dialogues/writing, every authored reading paper, and checkpoint writing instructions/models/form fields. Reading distractors and intentionally false statements are not biography claims. Facts must belong to the named subject or signing speaker; a recipient, relative or travel destination must not acquire that fact. The validator imports the served banks and writing source by default; injectable copies allow planted regressions without editing production data or review fixtures.

Before the change, `personaConsistency(CURRICULUM_A11)` returned `[]` while the imported first two reading units stated Ana/Berlin and Tim/Polen. Three hypotheses were investigated:

1. Only an Astro copy was stale — rejected: the canonical, runtime-imported reading bank itself contained both contradictions.
2. The name references belonged to clearly different characters — rejected: the texts use the recurring unqualified Ana and Tim without distinguishing identities; the checkpoint form names Tim Berger.
3. RULE 14 omitted the assessment surfaces and their established facts — confirmed: it iterated only `c.lektionen`, Ana's A1.1 table lacked her L2 home, and Tim's table omitted his CP1 form facts. The chain was independent bank authoring → checkpoint delivery → lesson-only validator plus incomplete fact table → false zero. Expanding the scan before correcting content exposed both contradictions; after scanning affirmative feedback too, it reported four occurrences across those two units.

Ana's home is Bremen (L2). Tim's CP1 form establishes Berger, married, Austrian, speaking English/German; A1.2 CP3 establishes his Berlin home. These facts now live in the inherited cast table. The two reading texts preserve them, including Tim's Berlin home, so this fix does not introduce a later cross-level residence conflict. The table's schema and all existing hard-rule assertions remain intact.

### Claims and measurements, old → new

| Surface | Old → new |
| --- | --- |
| `a11-cp1-p1-u1` text | Ana and her parents live in Berlin; Tim lives in Bremen → Ana and her parents live in Bremen; Tim lives in Berlin |
| Same unit's statement, evidence and German feedback | `Ana wohnt in Berlin.` → `Ana wohnt in Bremen.` |
| Same unit's English rationale/feedback | `Ana lives in Berlin; Bremen is Tim’s home.` → `Ana lives in Bremen; Berlin is Tim’s home.` |
| `a11-cp1-p1-u2` text/evidence/German feedback | `Tim kommt aus Polen und wohnt in Köln.` → `Tim kommt aus Österreich und wohnt in Berlin.` |
| Same unit's English rationale/feedback | `Tim lives in Cologne. Bremen is where his family lives.` → `Tim lives in Berlin. Bremen is where his family lives.` |
| RULE 14 scope | Lesson dialogues and writing only → those surfaces plus all 32 reading papers and all eight checkpoint writing tasks across both levels |
| Measured contradictions | Old check falsely reported **0**; the final guard replayed against the original two units reports **7 occurrences** (including Tim's conflicting home claims), versus **0** on corrected content; A1.2 remains **0** |

`tests/course-cast-continuity.test.mjs` plants contradictory third-person, exchange-speaker and signed-message claims in every paper of both banks. It also changes every checkpoint task/model, checks signed models and form surname/origin fields, and includes negative controls for recipients, relatives, false reading statements and travel destinations. A following `Sie kommt aus Polen` is traced to Ana; the unrelated `Ihre Eltern wohnen in Berlin` is not. Country labels in travel forms are treated as destinations unless the prompt explicitly states origin. New suite: **4 tests, 4 pass, 0 fail**.

Changed reading unit ids: **`a11-cp1-p1-u1`, `a11-cp1-p1-u2`**. Both require a fresh supervisor blind review. `tests/fixtures/a11-lesen-review.json` is untouched. No A1.2 reading unit, checkpoint writing text, or A1.1 dialogue line changed. Audio re-run list for Part D: **empty**.

### Verification and required review

Both pools rebuilt before their validators (379 and 295 items, no semantic pool diff). Both validators exited 0, with RULE 14 at zero and unchanged RULE 10/6b/15/23 debts **14/23/3/57** and **0/0/0/4**. The existing determinacy and reading checks also exited 0; they do not close Parts A/E. Curriculum sync, all 19 duplicate pairs, and zero-warning ESLint for all four new/changed JS/MJS files (including the Astro bank twin) passed. `git diff --check` exited 0, with only Git's line-ending notices.

```text
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
a1.1: 406 served items, 0 correct alternatives rejected
a1.2: 481 served items, 0 correct alternatives rejected
A1.1 Lesen declared strategies: max 2/4; bank max 32/64
Templates: 64 distinct; maximum repetition 1
PASS: A1.1 Lesen — 64 independent units; all gates pass
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
OK: no findings
Synced 7 curriculum file(s).
```

The affected-file sweep completed with these exact per-file `tests / pass / fail` counts; every file reported zero cancelled/skipped/TODO. This is the sum of completed per-file runs, not a claimed combined-run summary. The new cast suite was rerun after the final form-attribution refinement below.

| Test file | tests | pass | fail |
| --- | ---: | ---: | ---: |
| `tests/a11-lesen.test.mjs` | 10 | 9 | 1 |
| `tests/a12-rebuild.test.mjs` | 60 | 60 | 0 |
| `tests/assessment-integrity.test.mjs` | 28 | 28 | 0 |
| `tests/checkpoint.test.mjs` | 77 | 77 | 0 |
| `tests/course-cast-continuity.test.mjs` | 4 | 4 | 0 |
| `tests/course-meta.test.mjs` | 25 | 25 | 0 |
| `tests/curricula.test.mjs` | 82 | 82 | 0 |
| `tests/german-sie.test.mjs` | 4 | 4 | 0 |
| `tests/lesson-extra-items-a12.test.mjs` | 13 | 13 | 0 |
| `tests/lesson-pool-rules.test.mjs` | 48 | 48 | 0 |
| `tests/rule-card-overrides.test.mjs` | 35 | 35 | 0 |
| `tests/writing-course.test.mjs` | 71 | 71 | 0 |
| **Total** | **457** | **456** | **1** |

The expected failure is exactly the supervisor-owned reading review; the fixture was not edited or weakened:
```text
✖ A1.1 each authored unit passes independent blind semantic review
ℹ tests 10
ℹ pass 9
ℹ fail 1
  +   'a11-cp1-p1-u1: changed since review',
  +   'a11-cp1-p1-u1: missing review evidence',
  +   'a11-cp1-p1-u2: changed since review',
  +   'a11-cp1-p1-u2: missing review evidence'
EXIT 1
```

A final negative control found and closed an over-reporting edge case in the new code: a form for Tim ending with the separate true sentence `Ana kommt aus Marokko.` wrongly assigned Morocco to Tim. The new suite reproduced **tests 4 / pass 3 / fail 1**, with `name: 'Tim', found: 'Marokko'`. The form-field pass now checks only labelled fields; separate prose stays with the subject-attribution pass. The same assertion then passed, alongside the planted wrong-field and wrong-surname controls. Both full validators were run again after this refinement:
```text
ℹ tests 4
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
FINAL CAST TEST EXIT 0
FINAL A11 VALIDATOR EXIT 0
FINAL A12 VALIDATOR EXIT 0
FINAL PART D ESLINT EXIT 0
DIFF CHECK EXIT 0
FINAL GUARD ORIGINAL CONTENT 7
FINAL GUARD CORRECTED CONTENT 0
```

The final before/after replay changed only an in-memory clone back to the two original texts and their feedback. It therefore compares both versions under the same completed rule and cast table. The earlier four-occurrence observation above predates registering Tim's Berlin home. No source or review fixture was reverted for this replay.

Tests used `--experimental-test-isolation=none`, retaining the already-established Windows worker workaround. The first sandbox wrapper selected its own runtime rather than Node and returned no test summaries; a corrected combined wrapper then hit the tool's 300-second response timeout. Neither is counted as test evidence. A native JS wrapper exposed PowerShell pipe encoding and then `spawnSync node EPERM`; the successful final sweep launched Node directly from PowerShell, one file per process, and streamed the summaries above. A nested PowerShell read quoting error and one failed comment-patch context were corrected before continuing. These harness issues are resolved by the observed reruns; the only remaining test failure is the required new blind review.

The read-only replay first printed its complete 7/0 result but hit a 10-second sandbox timeout afterwards. Repeating it with an explicit sandbox-process exit after the calculation completed returned the same 7/0 result without a timeout. This does not replace the successful Node test and validator exits above.

The supplied oracle path still does not exist (`ORACLE MISSING`); neither corpus nor grader was edited. A read-only Part A reproduction again returned `wrong` for all five reported tasks (six alternatives including both gerne orders). No acceptance implementation has started.

Part D files: `scripts/validate-curriculum.mjs`, `src/data/curricula/a11.lesen.js`, its generated Astro twin `astro-site/src/data/curricula/a11.lesen.js`, new `tests/course-cast-continuity.test.mjs`, and this report. These are data/validator changes; no browser layout or authenticated-flow verification is claimed.

## Part A — Answer acceptance

Pending.

## Part E — Reading by literal matching

Pending. Carry Part D's `a11-cp1-p1-u1` and `a11-cp1-p1-u2` into the final supervisor review set alongside any Part E edits.

## Part F — Dialogues and vocabulary

Pending. Every changed A1.1 dialogue line will be recorded old → new here.

## Part G — One time model

Pending.

## Changed files

All 37 changed/new files in the working-tree inventory, including retained B/C changes and this report; the two pre-existing `.fablize` files are excluded and untouched:

```text
astro-site/src/components/linie/Progression.astro
astro-site/src/components/linie/Proof.astro
astro-site/src/data/curricula/a11.js
astro-site/src/data/curricula/a11.lesen.js
astro-site/src/data/curricula/a12.js
astro-site/src/data/offers.js
astro-site/src/pages/courses/[level].astro
astro-site/src/pages/courses/index.astro
docs/course-standard-2026-09-12.md
docs/course-factory/live-fixes/BATCH-3-REPORT-2026-10-25.md
netlify/functions/_shared/ruleCards.mjs
public/llms-full.txt
public/llms.txt
scripts/rule-card-overrides.mjs
scripts/validate-curriculum.mjs
src/data/courseTests/description.js
src/data/courseTests/index.js
src/data/curricula/a11.js
src/data/curricula/a11.lesen.js
src/data/curricula/a11.meta.js
src/data/curricula/a12.js
src/data/offers.js
src/lib/lesson/strings.js
src/pages/CourseCertificatePage.jsx
src/pages/CourseCompletePage.jsx
src/pages/CourseHomePage.jsx
src/pages/CurriculumHomePage.jsx
src/pages/Modelltest/ModelltestHub.jsx
src/pages/Modelltest/ModelltestOverview.jsx
src/pages/Modelltest/ModelltestResult.jsx
src/pages/Modelltest/ModelltestRun.jsx
src/pages/lesson/CheckpointPage.jsx
tests/assessment-integrity.test.mjs
tests/checkpoint.test.mjs
tests/course-assessment-claims.test.mjs
tests/course-cast-continuity.test.mjs
tests/course-grammar-notices.test.mjs
```

The two `public/llms*.txt` files were regenerated again; Git reports their working-tree byte/line-ending changes but no semantic diff. The generated pools have no semantic diff. Part C regenerated the changed cards and synchronized both changed curriculum twins. Ignored verification artifacts include the earlier offline `astro-site/dist/` build, four `.cache/batch3-b-*.png` screenshots and `.cache/batch3-browser*` profiles, plus the resumed read-only `.cache/batch3-head-overlay.mjs` helper described below. No `.fablize` file was modified.

## Verification and independent grader

All course/check commands and tests ran from `C:/Users/zaid1/deutschmeister-live`, with absolute script/test paths. The additional Astro package build used `astro-site` as its package directory and the absolute offline cache path. No dependencies were installed and no network/database was used. `node --test` worker startup failed with `spawn EPERM`; test runs therefore used `--experimental-test-isolation=none`, one file per process where mocks could interfere.

### Required commands: exact observed lines

Pool builds preceded validators and exited 0; pool sizes remained **379 → 379** and **295 → 295**. Final validator extracts:
```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 10 Wortfeld-Deckung: 14 ungenutzt von 263 (Ratchet 14)
  RULE 6b Notice-Formen ohne Beleg: 23 (Ratchet 23)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 3 (Ratchet 3)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 57 von 263 (Ratchet 57)
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 206 (Ratchet 0)
  RULE 6b Notice-Formen ohne Beleg: 0 (Ratchet 0)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 4 von 206 (Ratchet 4)
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

All remaining validator rules also passed; no ratchet was changed. At this historical B/C checkpoint, RULE 14's scope still missed Part D's contradictions; Part D expands it above.
```text
node scripts/a12-determinacy.mjs a1.1
a1.1: 406 served items, 0 correct alternatives rejected
node scripts/a12-determinacy.mjs a1.2
a1.2: 481 served items, 0 correct alternatives rejected
node scripts/a11-lesen-check.mjs -v
A1.1 Lesen declared strategies: max 2/4; bank max 32/64
Templates: 64 distinct; maximum repetition 1
PASS: A1.1 Lesen — 64 independent units; all gates pass
node scripts/a12-lesen-check.mjs -v
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
OK: no findings
node scripts/sync-curricula.mjs
Synced 7 curriculum file(s).
```

The determinacy/reading greens are the existing bounded checks, **not** closure of Parts A/E. `npm run check:duplicates` exited 0 with all 19 pairs `OK`, including:
```text
OK: src/data/offers.js === astro-site/src/data/offers.js
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
```

ESLint ran via the installed local binary and finally via `npx --offline --no-install eslint --no-ignore --max-warnings 0` on all 17 changed JS/JSX/MJS files: exit 0, no diagnostics. Initial lint omitted `--no-ignore` and reported the Astro data twin as ignored; rerunning with it fixed that harness warning. `git diff --check` exited 0; Git emitted only line-ending notices.

`node scripts/build-llms.mjs` was run; both outputs match the generator, with no semantic Git diff:
```text
wrote public/llms.txt (5241 bytes)
wrote public/llms-full.txt (21808 bytes)
```

### Affected test files

Each row records the exact numbers from its `ℹ tests`, `ℹ pass` and `ℹ fail` output. All had zero cancelled/skipped/TODO. File selection covers changed source consumers, the legacy final tests, shared registry/string callers and source-scan tests.

| File | tests | pass | fail |
| --- | ---: | ---: | ---: |
| `tests/a11-content-classes.test.mjs` | 9 | 9 | 0 |
| `tests/a12-buyer-claims.test.mjs` | 4 | 4 | 0 |
| `tests/a12-rebuild.test.mjs` | 60 | 60 | 0 |
| `tests/a2-1-abschlusstest.test.mjs` | 25 | 25 | 0 |
| `tests/a2-2-abschlusstest.test.mjs` | 24 | 24 | 0 |
| `tests/assessment-integrity.test.mjs` | 28 | 28 | 0 |
| `tests/astro-course-front-door.test.mjs` | 4 | 3 | 1 |
| `tests/b3-player-recovery.test.mjs` | 4 | 4 | 0 |
| `tests/b4-privacy-navigation.test.mjs` | 10 | 7 | 3 |
| `tests/checkpoint.test.mjs` | 77 | 77 | 0 |
| `tests/claims.test.mjs` | 23 | 23 | 0 |
| `tests/course-art.test.mjs` | 10 | 10 | 0 |
| `tests/course-assessment-claims.test.mjs` | 4 | 4 | 0 |
| `tests/course-audio.test.mjs` | 28 | 28 | 0 |
| `tests/course-certificate.test.mjs` | 9 | 9 | 0 |
| `tests/course-front-door.test.mjs` | 7 | 7 | 0 |
| `tests/course-home.test.mjs` | 18 | 18 | 0 |
| `tests/course-meta.test.mjs` | 25 | 25 | 0 |
| `tests/course-next.test.mjs` | 6 | 6 | 0 |
| `tests/course-player.test.mjs` | 46 | 46 | 0 |
| `tests/course-value.test.mjs` | 8 | 8 | 0 |
| `tests/dead-modules.test.mjs` | 2 | 2 | 0 |
| `tests/exam-feedback-offer.test.mjs` | 4 | 3 | 1 |
| `tests/exams.test.mjs` | 16 | 16 | 0 |
| `tests/fahrschein.test.mjs` | 4 | 4 | 0 |
| `tests/first-stop.test.mjs` | 5 | 5 | 0 |
| `tests/free-door.test.mjs` | 4 | 4 | 0 |
| `tests/language-strategy.test.mjs` | 4 | 4 | 0 |
| `tests/lesson-engine.test.mjs` | 62 | 62 | 0 |
| `tests/lesson-scoring.test.mjs` | 14 | 14 | 0 |
| `tests/linie-design.test.mjs` | 14 | 14 | 0 |
| `tests/live-course-batch1.test.mjs` | 8 | 8 | 0 |
| `tests/live-course-batch2.test.mjs` | 3 | 3 | 0 |
| `tests/llms.test.mjs` | 2 | 2 | 0 |
| `tests/milestones.test.mjs` | 9 | 9 | 0 |
| `tests/offers.test.mjs` | 6 | 6 | 0 |
| `tests/purchases.test.mjs` | 23 | 23 | 0 |
| `tests/readiness.test.mjs` | 9 | 9 | 0 |
| `tests/refund-claims.test.mjs` | 2 | 2 | 0 |
| `tests/save-progress-ask.test.mjs` | 16 | 16 | 0 |
| `tests/shared-files.test.mjs` | 3 | 2 | 1 |
| `tests/site-audit-regressions.test.mjs` | 11 | 11 | 0 |
| `tests/subscription-plan-lines.test.mjs` | 7 | 7 | 0 |
| `tests/support.test.mjs` | 7 | 7 | 0 |
| `tests/sync-outbox.test.mjs` | 19 | 19 | 0 |
| `tests/telc-pilot.test.mjs` | 14 | 14 | 0 |
| `tests/trial-end-claims.test.mjs` | 4 | 4 | 0 |
| `tests/unlimited-claims.test.mjs` | 2 | 2 | 0 |
| **Total, latest per-file results** | **703** | **697** | **6** |

The final copy-specific rerun also printed:
```text
ℹ tests 22
ℹ pass 22
ℹ fail 0
```
(`course-assessment-claims`, `lesson-scoring`, `language-strategy`.)

After the last wording/comment edits, the core files were run again to completion (two short 25-second subprocess attempts timed out first; native sessions resolved those harness timeouts):
```text
FINAL course-assessment-claims EXIT 0
ℹ tests 4
ℹ pass 4
ℹ fail 0
assessment-integrity: exit 0
ℹ tests 28
ℹ pass 28
ℹ fail 0
checkpoint: exit 0
ℹ tests 77
ℹ pass 77
ℹ fail 0
```

### Baseline failures, independently reproduced against HEAD 1263407

Used the existing read-only `baseline-loader.mjs`, which overlays HEAD in memory; no checkout/reset/stash or test edits. The same six failure names appear on HEAD:
```text
✖ the known front-door CTAs still exist (the scan is not vacuous)
ℹ tests 4
ℹ pass 3
ℹ fail 1

✖ consent withdrawal while PostHog downloads prevents initialization and later capture
✖ PostHog capture and identify require the current shared consent choice
✖ course return controls follow the measured bottom navigation and reserve their own height
ℹ tests 10
ℹ pass 7
ℹ fail 3

✖ off-sale feedback uses the existing pilot course door, never checkout
ℹ tests 4
ℹ pass 3
ℹ fail 1

✖ shared sync writes only manifest destinations and preserves bytes
ℹ tests 3
ℹ pass 2
ℹ fail 1
```

### Offline render and environment limits

The build used `GRAMMAR_CONTENT_CACHE=C:/Users/zaid1/deutschmeister-live/grammar-content-cache.json` and `ASTRO_TELEMETRY_DISABLED=1`. It completed:
```text
[grammar] Using content cache C:/Users/zaid1/deutschmeister-live/grammar-content-cache.json: 84 topics
[build] 130 page(s) built in 59.52s
[build] Complete!
OFFLINE ASTRO BUILD EXIT 0
```
Warnings about stale Browserslist data and an unset Supabase key were observed; no update/network call was made. The supplied cache served the build successfully.

Local browser requests were restricted to loopback with external resolution blocked; the static review server additionally used CSP `connect-src 'none'; script-src 'none'`. This proves static rendered copy/layout, not hydrated/authenticated flows. Final screenshots inspected:
- `.cache/batch3-b-a1-1.png`
- `.cache/batch3-b-a1-2.png`
- `.cache/batch3-b-a2-1.png`
- `.cache/batch3-b-a2-2.png`

Exact final viewport observations:
```text
CAPTURE a1-1 {"top":368.765625,"bottom":627.765625,"overflow":false}
CAPTURE a1-2 {"top":368.984375,"bottom":627.984375,"overflow":false}
CAPTURE a2-1 {"top":357.8125,"bottom":637.8125,"overflow":false}
CAPTURE a2-2 {"top":357.8125,"bottom":637.8125,"overflow":false}
```

Harness issues are explicit: an initial 55-second build timeout was superseded by the successful build; the 50-second A1.2 test timeout was superseded by a full **60/60** run taking 155.6 seconds. Initial guessed metadata/test filenames did not exist; the real generic A1.2 path was found and fixed. A Windows `--import C:/...` attempt failed until expressed as a `file:///` URL. A PowerShell inline-script quoting error was fixed by supplying Node code through stdin. Chrome's first navigation detached; CUA had no available browser. Edge then rendered all four pages and saved the inspected screenshots, but the helper timed out during browser-process teardown after those observations. No successful render-helper exit is claimed. These are harness limits, not an unobserved claim of visual success.

### Independent acceptance grader

At verification and again at the final check, the exact supplied `accept-blind-run/corpus.jsonl` path **did not exist** (`Test-Path` returned `False`). The grader was therefore not run; neither corpus nor grader was edited. Part A is untouched, so its known five counterexample families remain open regardless of the existing determinacy green. The supervisor must run the completed 511-line corpus after Part A.

The temporary loopback server was stopped. A final browser-cleanup attempt through `Win32_Process` was denied (`Get-CimInstance : Access denied`); zero processes were stopped by that command. Browser teardown is therefore not claimed as verified. A report patch with an out-of-order context hunk failed before writing and was reapplied with the correct context.


### Resumed verification — 2026-10-26

Part B was rechecked before Part C without reimplementing it:
```text
ℹ tests 109
ℹ pass 109
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
This is `course-assessment-claims`, `assessment-integrity` and `checkpoint`. Normal worker isolation again failed before test execution with `spawn EPERM`; all substantive resumed runs used `--experimental-test-isolation=none`.

Part C's affected-file sweep ran **53 test files**. The latest result for each test is **980 tests: 973 pass, 7 baseline failures**, with no cancelled/skipped/TODO tests. This is a per-test inventory assembled from the full file runs and the fixes/reruns below, **not a claim that one invocation printed this aggregate**.

| File | tests | pass | fail |
| --- | ---: | ---: | ---: |
| `tests/a11-content-classes.test.mjs` | 9 | 9 | 0 |
| `tests/a11-lesen.test.mjs` | 10 | 10 | 0 |
| `tests/a12-rebuild.test.mjs` | 60 | 60 | 0 |
| `tests/a12-tense.test.mjs` | 5 | 5 | 0 |
| `tests/a2-1-abschlusstest.test.mjs` | 25 | 25 | 0 |
| `tests/a2-2-abschlusstest.test.mjs` | 24 | 24 | 0 |
| `tests/assessment-integrity.test.mjs` | 28 | 28 | 0 |
| `tests/astro-hex.test.mjs` | 1 | 0 | 1 |
| `tests/b3-lesson-generation.test.mjs` | 5 | 5 | 0 |
| `tests/b3-player-recovery.test.mjs` | 4 | 4 | 0 |
| `tests/checkpoint-feedback.test.mjs` | 3 | 3 | 0 |
| `tests/checkpoint.test.mjs` | 77 | 77 | 0 |
| `tests/course-art.test.mjs` | 10 | 10 | 0 |
| `tests/course-assessment-claims.test.mjs` | 4 | 4 | 0 |
| `tests/course-audio.test.mjs` | 28 | 28 | 0 |
| `tests/course-certificate.test.mjs` | 9 | 9 | 0 |
| `tests/course-front-door.test.mjs` | 7 | 7 | 0 |
| `tests/course-grammar-notices.test.mjs` | 5 | 5 | 0 |
| `tests/course-home.test.mjs` | 18 | 18 | 0 |
| `tests/course-meta.test.mjs` | 25 | 25 | 0 |
| `tests/course-next.test.mjs` | 6 | 6 | 0 |
| `tests/course-plan.test.mjs` | 19 | 19 | 0 |
| `tests/course-player.test.mjs` | 46 | 46 | 0 |
| `tests/course-reminder.test.mjs` | 19 | 19 | 0 |
| `tests/course-value.test.mjs` | 8 | 8 | 0 |
| `tests/curricula.test.mjs` | 82 | 82 | 0 |
| `tests/dead-modules.test.mjs` | 2 | 2 | 0 |
| `tests/exam-autosave-order.test.mjs` | 7 | 3 | 4 |
| `tests/exams.test.mjs` | 16 | 16 | 0 |
| `tests/first-run.test.mjs` | 26 | 25 | 1 |
| `tests/free-door.test.mjs` | 4 | 4 | 0 |
| `tests/german-sie.test.mjs` | 4 | 4 | 0 |
| `tests/language-strategy.test.mjs` | 4 | 4 | 0 |
| `tests/lesson-back-skip.test.mjs` | 5 | 5 | 0 |
| `tests/lesson-engine.test.mjs` | 62 | 62 | 0 |
| `tests/lesson-extra-items-a12.test.mjs` | 13 | 13 | 0 |
| `tests/lesson-extra-items.test.mjs` | 28 | 28 | 0 |
| `tests/lesson-pool-rules.test.mjs` | 48 | 48 | 0 |
| `tests/lesson-run-resume.test.mjs` | 10 | 10 | 0 |
| `tests/lesson-scoring.test.mjs` | 14 | 14 | 0 |
| `tests/live-course-batch1.test.mjs` | 8 | 8 | 0 |
| `tests/live-course-batch2.test.mjs` | 3 | 3 | 0 |
| `tests/milestones.test.mjs` | 9 | 9 | 0 |
| `tests/rule-card-overrides.test.mjs` | 35 | 35 | 0 |
| `tests/save-progress-ask.test.mjs` | 16 | 16 | 0 |
| `tests/shared-files.test.mjs` | 3 | 2 | 1 |
| `tests/syllabus.test.mjs` | 14 | 14 | 0 |
| `tests/sync-outbox.test.mjs` | 19 | 19 | 0 |
| `tests/telc-pilot.test.mjs` | 14 | 14 | 0 |
| `tests/trial-end-claims.test.mjs` | 4 | 4 | 0 |
| `tests/unlimited-claims.test.mjs` | 2 | 2 | 0 |
| `tests/wortfeld-pacing.test.mjs` | 2 | 2 | 0 |
| `tests/writing-course.test.mjs` | 71 | 71 | 0 |
| **Latest per-test total** | **980** | **973** | **7** |

Two content regressions caught by that sweep were fixed:
- `a12-rebuild` first printed `tests 60 / pass 59 / fail 1` because the shortened notice no longer taught `unbestimmtem`. After restoration, the complete A1.2 suite plus the new grammar tests and card suite printed **tests 100 / pass 100 / fail 0**.
- `curricula` first printed `tests 82 / pass 80 / fail 2`. Both failures were the register check on the new unmarked grammar term `du-Form`. The notice now writes `**du**-Form`, using the existing convention for a grammar form rather than learner address. Neither assertion was changed. After rebuilding and validating A1.1, all three curriculum register tests were rerun, followed by all 40 grammar/card tests:
```text
✔ register: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt
✔ A1.1: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt
✔ A1.2: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

ℹ tests 40
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
The other 80 curriculum tests passed in the full run; the table incorporates the two successful targeted reruns.

The seven remaining failures are isolated:
```text
✖ no colour literal in the static site outside the design tokens
✖ ordinary exam unmount flushes the latest answers once through the ordered writer
✖ an already-running exam autosave finishes before a newer section or completion write
✖ exam write serialization is per attempt and continues after a rejected request
✖ an exam section transition saves its answers marker and deadline in one ordered update
✖ shared sync writes only manifest destinations and preserves bytes
✖ the dashboard renders the first-run card in the hero slot and demotes its other primaries
```
The first six reproduce against HEAD 1263407 in a read-only in-memory overlay:
```text
ℹ tests 11
ℹ pass 5
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
HEAD BASELINE EXIT 1
```
The stock overlay could not run because Node's `spawnSync git` returned `EPERM`. The ignored `.cache/batch3-head-overlay.mjs` instead receives Git's HEAD bytes from PowerShell over stdin, preserves this checkout's CRLF convention, and overlays only reads/imports. No checkout, reset, stash or file replacement was performed. The color/path failures mishandle Windows separators; the four autosave tests fail while constructing their service fixture with `SyntaxError: Cannot use import statement outside a module`.

The dashboard assertion reads `DashboardPage.jsx` with an LF-only regex. Both that file and its test are identical to HEAD:
```text
FIRST-RUN FAILING SOURCES IDENTICAL TO HEAD EXIT 0
first-run CRLF probe {"unixPattern":false,"windowsPattern":true}
```
Its file run printed **tests 26 / pass 25 / fail 1**. These unrelated assertions remain intact.

Other resumed command results:
```text
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
a1.1: 406 served items, 0 correct alternatives rejected
a1.2: 481 served items, 0 correct alternatives rejected
A1.1 Lesen declared strategies: max 2/4; bank max 32/64
Templates: 64 distinct; maximum repetition 1
PASS: A1.1 Lesen — 64 independent units; all gates pass
a1.2-cp1: worst strategy over the bank Zahl+ 8/16
a1.2-cp2: worst strategy over the bank Zahl+ 8/16
a1.2-cp3: worst strategy over the bank Zahl+ 8/16
a1.2-cp4: worst strategy over the bank Zahl+ 8/16
OK: no findings
Synced 7 curriculum file(s).
ESLINT EXIT 0 FILES 25
FINAL CONTENT LINT EXIT 0
ORACLE CORPUS MISSING
```
`npm run check:duplicates` again passes all 19 pairs. ESLint used `npx --offline --no-install eslint --no-ignore --max-warnings 0` for all 25 changed/new JS/JSX/MJS files, followed by the installed binary on the final changed curriculum/twin/generated-card files. `git diff --check` passes; Git reports only line-ending notices. Both pools have no semantic diff after the final rebuild. The two `llms` outputs were regenerated offline.

The oracle path was checked again in this resumed session and still does not exist. Neither the corpus nor the grader was edited. Part A is untouched and the known acceptance counterexamples are still open. No new reading review or audio rerun is required for Part C alone: changed A1.1 dialogue lines **none**, changed reading unit ids **none**.


### Remaining work, in required order

**A → E → F → G**, all unimplemented. B/C are preserved and D is finished locally; do not redo those parts. D's two changed reading units (`a11-cp1-p1-u1`, `a11-cp1-p1-u2`) still require supervisor blind review, and the fixture fails only for those units. Resume with shared answer acceptance and the independent oracle (missing at the last check), then literal/token-overlap reading defenses, dialogue/vocabulary input and retrieval with lowered ratchets, and the single labelled time model. Finish with the full required verification. Both courses' sellability remains unconfirmed.
