# A2.1 build — Step 3: course content

Status: DRAFT AUTHORED; VERIFICATION BLOCKED. Updated 2026-10-24. Started 2026-10-23 on `claude/a21-build`, HEAD `2bac64d`.

## Measured handover state — 2026-10-24

The complete authored course is registered only in `DRAFT_CURRICULA`; `curriculumFor('a2.1') === null`. All hard validator rules are zero. Every ratchet equals its measurement: fifteen zeroes and four missionless speaking tasks (L4/L6/L9/L10). These four still have authored speaking materials; no existing mission fits their grammar closely enough to attach it honestly.

The pool contains **353 items: 147 retained cache items and 206 hand-authored items**, with 9 corrections and no missing English explanation. The writing bank contains **12 lesson tasks and 4 checkpoint tasks**. The checkpoint papers contain **64 Lesen + 80 Hören responses** (four rounds each); eight Hören responses are dictations, leaving 136 choice responses for the cue audit. The final test has **20 Hören + 20 Lesen** scored items, two writing tasks and all three speaking parts.

### Per-Lektion measurements

| L | Situation | Primary | Bounded points | Lines / max words | Notice words | Wortfeld |
|---|---|---|---|---:|---:|---:|
| 1 | Familie: Lena Brandt zeigt ihrer Freundin Ana Fotos und erzählt vom Leben ihrer Großeltern. | `possessive-pronouns` | Genitiv-s bei Namen und von + Dativ | 10 / 11 | 57 | 18 |
| 2 | Umzug: Tim packt für den Umzug. Seine Freundin Ana hilft bei den Vorbereitungen. | `separable-verbs` | — | 10 / 12 | 47 | 18 |
| 3 | Wohnen: Ana hilft ihrem Freund Tim mit den Möbeln in seiner Wohnung. | `two-way-prepositions` | — | 10 / 12 | 51 | 18 |
| 4 | Wochenmarkt: Ana kauft bei Frau Schulz Obst, Gemüse und Käse. | `adjective-endings-intro` | — | 10 / 11 | 54 | 18 |
| 5 | Geschenk: Lena und ihre Freundin Ana planen den Geburtstag von Lenas Oma. | `dative-case` | — | 10 / 13 | 47 | 18 |
| 6 | Veranstaltung: Tim hat Lenas Grillabend verpasst und plant mit seiner Freundin ein neues Treffen. | `modal-verbs-past` | dass nach dem Hauptsatz mit einem finiten Verb | 10 / 11 | 58 | 18 |
| 7 | Sport: Tim lädt seine Freundin Ana zum Training im Verein ein und gibt ihr Ratschläge. | `imperative-mood` | du solltest und wir könnten als Ratschlag und Vorschlag | 10 / 11 | 50 | 18 |
| 8 | Unfall: Ana ist vom Fahrrad gefallen und besucht Frau Berger in der Arztpraxis. | `perfect-tense-sein` | weil nach dem Hauptsatz mit einem finiten Verb | 10 / 11 | 52 | 18 |
| 9 | Büro: Tim beginnt eine neue Arbeit. Seine Kollegin Frau Yilmaz erklärt ihm die Aufgaben. | `pronouns-accusative-dative` | — | 10 / 11 | 57 | 18 |
| 10 | Besuch: Anas Eltern kommen aus Marokko. Ana und ihre Freundin Lena planen die Abholung und gemeinsame Tage. | `temporal-prepositions` | — | 10 / 12 | 49 | 18 |
| 11 | Stadtführung: Ana und ihre Eltern machen mit Herrn Wagner einen Rundgang in Bremen. | `prepositions-dative` | Adjektiv -en und Ordinalzahlen im Dativ nach Artikel | 10 / 14 | 54 | 18 |
| 12 | Besuch: Nach der Abreise ihrer Eltern erzählt Ana ihrer Freundin Lena von den gemeinsamen Tagen. | `perfect-tense-haben` | wenn nach dem Hauptsatz mit einem finiten Verb | 10 / 12 | 52 | 18 |

Every dialogue has ten lines and an explicit setting. The notice counts are whitespace word counts of the authored German text; all remain below 70.

### Every validator rule

Values are violations, except rule 13, which measures intentional missionless tasks. Shape rules not separately printed by the CLI are zero because the full validator returns no errors. Exam-surface and metadata validation also return no errors.

| Rule | Measurement | Value |
|---|---|---:|
| 1 | Lesson count, ids and slugs | 0 |
| 2 | Situations, can-dos, Handlungsfelder, exam coverage | 0 |
| 3 | Grammar inventory and order | 0 |
| 4 | Wortfeld shape, uniqueness and real-id coverage | 0 |
| 5 | Dialogue shape, lexis, primary occurrences and length | 0 |
| 6 | Notice shape and length | 0 |
| 6b | Notice forms without input | 0 |
| 6c | Form-field sentences in notices | 0 |
| 7 | Other task steps, writing and speaking formats | 0 |
| 8 | Course shape, checkpoints and hours | 0 |
| 9 | German copy, promises and fees | 0 |
| 10 | Unused Wortfeld entries | 0 |
| 11 | Untaught whole-pool tokens | 0 |
| 11b | Untaught drawn tokens | 0 |
| 12 | Unrehearsed can-dos | 0 |
| 13 | Speaking tasks without matching existing mission | 4 |
| 14 | Persona contradictions | 0 |
| 15 | Production before a form is taught | 0 |
| 15b | Deferred constructions in production | 0 |
| 16 | Unbacked exam parts | 0 |
| 17 | Models failing their own checklist | 0 |
| 18 | Shared dictation/read-aloud lines | 0 |
| 19 | Models contradicting dialogue | 0 |
| 20 | Untaught words in models | 0 |
| 21 | Unanswerable Leitpunkte | 0 |
| 22 | Form-field sentences in message models | 0 |
| 23 | Wortfeld entries without input | 0 |
| 23b | Graded-task words without input | 0 |
| 24 | Predicative nationality adjectives | 0 |
| 25 | Missing English twins | 0 |

| Registry ratchet | Measurement = ceiling |
|---|---:|
| `uncoveredWortfeld` | 0 |
| `untaughtItemTokens` | 0 |
| `untaughtDrawnTokens` | 0 |
| `missionlessLektionen` | 4 |
| `unexemplifiedNoticeForms` | 0 |
| `untaughtInProduction` | 0 |
| `deferredConstructions` | 0 |
| `unbackedExamTeile` | 0 |
| `modelChecklistBreaks` | 0 |
| `sharedProductionLines` | 0 |
| `untaughtInModelTexts` | 0 |
| `unanswerableLeitpunkte` | 0 |
| `wortfeldWithoutInput` | 0 |
| `gradedTaskWordsWithoutInput` | 0 |
| `formSpeakSentences` | 0 |
| `missingEnglishTwins` | 0 |

### Checkpoint-bank audit

The audit reuses the existing frozen Lesen surface strategies, compares every option pair, and splits credit on ties. It never reads the answer key to make a prediction. The eight dictations have no option-position strategy and are excluded from the choice audit.

| Checkpoint | Bank | Choice units | Keys by position | Best slot strategy | Best text strategy | Score / units |
|---|---|---:|---|---:|---|---:|
| 1 | lesen | 16 | 6/5/5 | 50.00% | zuletzt im Text+ | 7.333 / 16 (45.83%) |
| 1 | hoeren | 12 | 6/6 | 50.00% | Wörter+ | 7.000 / 12 (58.33%) |
| 2 | lesen | 16 | 5/6/5 | 50.00% | zuerst im Text+ | 8.000 / 16 (50.00%) |
| 2 | hoeren | 20 | 7/6/7 | 50.00% | Wörter+ | 9.833 / 20 (49.17%) |
| 3 | lesen | 16 | 3/3/2/3/3/2 | 25.00% | Frage→Satz Zahl nächster normalisiert ohne Funktionswörter | 3.333 / 16 (20.83%) |
| 3 | hoeren | 20 | 6/7/7 | 50.00% | Abstand zu Fragewörtern fern | 10.667 / 20 (53.33%) |
| 4 | lesen | 16 | 5/6/5 | 50.00% | Abstand zu Fragewörtern nah | 8.667 / 16 (54.17%) |
| 4 | hoeren | 20 | 3/3/4/3/4/3 | 25.00% | Wörter− | 3.667 / 20 (18.33%) |

| Choice kind | Units | Chance | Balanced keys | Highest heuristic | Rate |
|---|---:|---:|---|---|---:|
| mc3 | 88 | 33.33% | 29/30/29 | Frage→Satz Zahl nächster wörtlich mit Funktionswörtern | 43.18% |
| match | 36 | 16.67% | 6/6/6/6/7/5 | Frage→Satz Zahl nächster normalisiert ohne Funktionswörter | 18.52% |
| trueFalse | 12 | 50.00% | 6/6 | Wörter+ | 58.33% |

The pooled kinds all pass the predeclared **chance + 10 percentage point** ceiling. Individual banks are small: four rounds with three choices necessarily permit a best per-slot key strategy of 50%; six choices permit 25%. Tests pin those optimal slot baselines and allow a text strategy at most one additional response per bank. The per-bank peaks above remain visible rather than being hidden by the aggregate. These are surface-cue checks, not evidence that distractors are pedagogically perfect; D8's final adversarial review remains a promotion gate.

### Exact verification results

All commands ran from `C:\\Users\\zaid1\\deutschmeister-a21`, offline, without database access.

`node scripts/validate-curriculum.mjs a2.1` — exit 0:

```text
✓ A2.1: 12 Lektionen, 216 Wortfeld-Einträge (156 mit wordId, 72 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 216 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 0 ungelehrte Tokens (Ratchet 0)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L4, L6, L9, L10
  RULE 6b Notice-Formen ohne Beleg: 0 (Ratchet 0)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 0 (Ratchet 0)
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 0 von 216 (Ratchet 0)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 353
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

A1 validator stdout, measured before and after, is byte-identical:

```text
a1.1 0 6517 b0c08aa0905c6cf210426886b703650cc079c277f16ac54b6a48b66ed9193c37
a1.2 0 2767 ddc9c7f0ab6c6e94fabc1faa84edef6c88f1811f2458f6b77dd865259a5761bf
```

Columns are level, exit code, stdout bytes and SHA-256. The default invocation was used for A1.1. Additional preservation checks:

```text
PASS: 44 A1 writing tasks identical to HEAD
PASS: 24 A1 rule cards identical to HEAD
a1.2: 481 served items, 0 correct alternatives rejected
a2.1: 521 served items, 0 correct alternatives rejected
```

The two determinacy commands were `node scripts/a12-determinacy.mjs a1.2` and `node scripts/a12-determinacy.mjs a2.1`, both exit 0.

`npm run check:duplicates` — exit 0, **27** `OK:` lines, no drift. `node scripts/sync-curricula.mjs` reported:

```text
Synced 15 file(s) from src/data/curricula/ to astro-site/src/data/curricula/.
```

The normal `node --test` invocation failed before tests could run:

```text
Error: spawn EPERM
```

Used the explicitly authorized fallback:

```text
node --experimental-test-isolation=none --test --test-reporter=spec tests/curricula.test.mjs tests/a21-engine.test.mjs tests/a21-language.test.mjs tests/a21-exam.test.mjs tests/a21-surfaces.test.mjs tests/checkpoint.test.mjs tests/check-answer.test.mjs tests/a21-content.test.mjs tests/exams.test.mjs
ℹ tests 251
ℹ pass 244
ℹ fail 7
```

That was the initial full regression run. Six failures were repaired and verified on the changed paths; the remaining G5 case is the authorization conflict below. The subsequent complete run of all listed files **except curricula.test.mjs** returned:

```text
ℹ tests 156
ℹ pass 155
ℹ fail 1
✖ G5: engine limits, personas and exact ratchets register a draft curriculum only
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
```

The difference is exactly the three required new A2 persona rows. The two zero-pool assertions immediately after it are also intentionally still unchanged; the earlier run reached one of them and reported `353 !== 0`.

The remediated `curricula.test.mjs` cases were rerun with `--test-name-pattern`:

```text
✔ every registered level ships a persona table — RULE 14 is never silent for a whole level
✔ a pretest model answers its own prompt: it starts with a prefix its own accepted list names
✔ A2.1: every Lektion's schreiben task resolves to its own bank entry
✔ A2.1: notices, pretests, writing and speaking tasks siezen — only the dialogue duzt
ℹ tests 4
ℹ pass 4
ℹ fail 0

✔ A2.1: the validator bites for this level
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

The final content suite, including the actual checkpoint writing task and picture checks, returned:

```text
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

`npx eslint --no-ignore --max-warnings 0` passed with exit 0 and no output for all changed application/test/script files, including the Astro twins and local preview source. Generated preview bundles were excluded. A final isolated lint of `scripts/check-duplicates.mjs` also exited 0. `git diff --check` exited 0.

`npx vite build` — **exit 1**, before compilation:

```text
failed to load config from C:\\Users\\zaid1\\deutschmeister-a21\\vite.config.js
error during build:
Error: spawn EPERM
```

The installed esbuild CLI successfully bundled the real new React components for a local preview; Tailwind also completed. This does **not** substitute for a successful Vite build. Browser verification is **not performed**: initial inventory timed out, Chrome creation returned `Browser is not available: chrome`, and the final browser inventory was `[]`. The preview server was stopped deliberately after this check; its interrupt exit code is not an application failure.

### Still open / precise authorization needed

1. **Three existing assertions, not course content.** The initial authorization names only original lines 140/142/146 of `tests/a21-language.test.mjs`. Original line 145 requires A2.1's entire persona table to equal A1.2, while PLAN explicitly introduces Frau Schulz, Frau Yilmaz and Herr Wagner. Original lines 147–148 require empty pools. These now sit at current lines 147/149/150. They remain unchanged because the authorization says “and only”. Proposed replacement, **not applied**:

```js
const personas = v.PERSONA_TABLES[spec.personaSource];
for (const [name, row] of Object.entries(v.PERSONAS_A12)) {
  assert.deepEqual(personas[name], row);
}
const pool = v.loadPoolItems('a2.1');
const extra = v.loadExtraItems('a2.1');
assert.ok(pool.length > 0 && extra.length > 0);
assert.ok(pool.every(item => item.questionDe && item.answer && item.explanationEn));
assert.ok(extra.every(item => pool.some(built => built.id === item.id && built.answer === item.answer)));
```

This retains exact inherited A1.2 persona values and checks populated data rather than an id list. After authorization, apply it and rerun the requested suite.

2. **Environment verification.** Re-run `npx vite build` where Node may launch esbuild. Open the local preview in a connected real browser and inspect the twelve images, speaking cards/calendars, checkboxes and audio-play limit. Source lives in `.fablize/a21-step3-preview/`; start its server with `node .fablize/a21-step3-preview/server.mjs`. It is restricted to loopback and its page blocks external connections.
3. **D8/D9 promotion gates.** Recorded audio is still deferred as directed. No independent adversarial model review or “0 BLOCKER / 0 MAJOR” sign-off is claimed here. Draft promotion, buyer migration, supervisor commit/push and owner merge were not performed.

### Every changed deliverable file

- `astro-site/src/data/curricula/a21.exams.js`
- `astro-site/src/data/curricula/a21.js`
- `astro-site/src/data/curricula/a21.meta.js`
- `astro-site/src/data/curricula/a21.word-ids.js`
- `astro-site/src/data/curricula/a21-language.js`
- `astro-site/src/data/curricula/examFormats.js`
- `astro-site/src/data/curricula/index.js`
- `astro-site/src/data/curricula/inheritance.js`
- `docs/course-factory/a21-build/STEP-3-REPORT.md`
- `netlify/functions/_shared/ruleCards.mjs`
- `netlify/functions/_shared/writingTasks.mjs`
- `public/images/course/a21/balkon.svg`
- `public/images/course/a21/bus.svg`
- `public/images/course/a21/fahrrad.svg`
- `public/images/course/a21/gehen.svg`
- `public/images/course/a21/kaffee.svg`
- `public/images/course/a21/laufen.svg`
- `public/images/course/a21/regal.svg`
- `public/images/course/a21/saft.svg`
- `public/images/course/a21/schwimmen.svg`
- `public/images/course/a21/tanzen.svg`
- `public/images/course/a21/tisch.svg`
- `public/images/course/a21/wasser.svg`
- `scripts/check-duplicates.mjs`
- `scripts/rule-card-overrides.mjs`
- `scripts/validate-curriculum.mjs`
- `src/components/exams/CourseExamParts.jsx`
- `src/data/courseTests/abschlusstestA21.js`
- `src/data/curricula/a21.exams.js`
- `src/data/curricula/a21.js`
- `src/data/curricula/a21.meta.js`
- `src/data/curricula/a21.word-ids.js`
- `src/data/curricula/a21-language.js`
- `src/data/curricula/index.js`
- `src/data/lessonPools/a21.corrections.json`
- `src/data/lessonPools/a21.explanationsEn.json`
- `src/data/lessonPools/a21.extra.json`
- `src/data/lessonPools/a21.json`
- `src/data/writingTasks.js`
- `src/pages/Modelltest/ModelltestRun.jsx`
- `tests/a21-content.test.mjs`
- `tests/a21-engine.test.mjs`
- `tests/a21-language.test.mjs`
- `tests/curricula.test.mjs`
- `tests/exams.test.mjs`
- `tests/helpers/a21-bank-audit.mjs`
- `tests/helpers/a21-measurements.mjs`

The new Astro `examFormats.js` and `inheritance.js` twins were copied from the existing Step 2 sources by the required sync and are now included in duplicate checks. A1 curriculum and pool files were not edited.

Local workflow/evidence files created:

- `.fablize/goals-before-a21-step3.json`
- `.fablize/ledger-before-a21-step3.jsonl`
- `.fablize/a21-step3-goals.json`
- `.fablize/a21-step3-ledger.jsonl`
- `.fablize/a21-step3-probe.mjs`
- `.fablize/a21-step3-preview/index.html`
- `.fablize/a21-step3-preview/entry.jsx`
- `.fablize/a21-step3-preview/server.mjs`
- `.fablize/a21-step3-preview/preview.js` (generated)
- `.fablize/a21-step3-preview/style.css` (generated)

`.fablize/goals.json` was restored to its original content; the text editor added only a terminal newline compared with HEAD. `.fablize/ledger.jsonl` has no remaining diff. No original goal status or evidence was changed. Final Git checks still report branch `claude/a21-build`, HEAD `2bac64d`, and `git diff --check` passes. A final registry assertion printed `PASS: A2.1 is draft-only`.

The unrelated original `.fablize/goals.json` and `.fablize/ledger.jsonl` were restored after archiving this run. The Step 3 archive has G001/G002 complete and G003 **blocked**. The helper printed “all stories complete” after marking G003 blocked; that message means no pending story in its implementation and is **not** treated as successful verification. A Python console-encoding failure after saving G002 was checked with UTF-8 `status`; the saved state was correct.

## Scope and exit proof

Author the twelve Lektionen in PLAN §3.2–§3.13, their exam surfaces and writing tasks, four checkpoint banks with four rounds each, the lesson pool and the 40-item final test plus speaking. Register only in DRAFT_CURRICULA. No network, database, commit, push, checkout or reset.

Completion requires A2.1 validation with hard rules at zero and ratchets equal to measurements; byte-identical before/after A1 validator stdout; both determinacy probes; duplicate checks; the requested Node suites plus new tests; changed-file ESLint with zero warnings; and Vite build. Tests must inspect content and real draws for constraints outside the validator. Audio recording and draft promotion remain owner work.

## Baseline and tooling

Pre-existing untracked paths: `.serena/`, `.fablize/a21-browser/`, `.fablize/a21-browser-node/`, `.fablize/a21-step2-goals.json`, `.fablize/a21-step2-ledger.jsonl`, `.fablize/goals-before-a21-step2.json`, `.fablize/ledger-before-a21-step2.jsonl`. They are outside this change.

The context-mode tools are not exposed in this session. Local read-only commands are used with bounded output. The first baseline wrapper printed a Unicode checkmark through Windows cp1252 and failed after successfully measuring A1.1; the replacement prints only ASCII hashes. No curriculum failure was involved.

## Implementation writes

### Write 22 — complete practice draws and determinacy repairs

Expanded the hand-authored pool from 144 to 206 items. Added situation-specific practice where attempt 2 exhausted the initial slice. Replaced five untaught cues with taught vocabulary/forms. Both attempts now draw seven items per lesson and meet the situation target. Bounded dass/weil/wenn practice includes complete clauses; opening cues use the existing probe's canonical syntax. The new imperative sentences exposed five rejected alternatives with emphatic `ihr`; their accepted arrays now include that legitimate form. This repairs the data without changing the checker or determinacy probe.

### Write 23 — metadata and receptive grammar horizon

Aligned English can-do lines with the German data, added course description/outcomes, and limited character descriptions to supported facts. Added a content test applying construction horizons to receptive texts as well as production. Removed early adjective-dative/ordinal forms from checkpoint 2 and 3, and informal imperatives before L7. Lesson 3 now has three independent picture conversations; its former question about where books had been inferred too much from a question rather than an explicit statement. The SMS invitation now uses a question instead of an early imperative; both writing twins agree.

### Write 24 — checkpoint cue audit

Reused `bankFeatureInputs` from the existing Lesen gate, lifting each binary choice strategy to pairwise votes over every printed option. Tied guesses receive fractional credit; keys never enter the choice. Balanced keys across each bank, varied matching question order across all four rounds, and revised literal keyword cues with natural paraphrases and meaningful distractor details. The aggregate ceiling is chance plus 10 percentage points for each choice kind. Individual-bank results and the unavoidable four-round slot baseline are reported separately below; a small bank cannot estimate a strategy's long-run accuracy precisely.

### Write 25 — content tests and final-test regression

Added data checks for all 18 grammar points (input plus two eligible exercises), both practice attempts, bounded answer coverage, dialogue limits/register/provenance, receptive grammar horizons, all sixteen writing tasks, four authored checkpoint rounds, local picture assets, metadata, can-do rehearsal mutation cases, and 40 scored final-test responses plus three speaking tasks. Updated only the A2.1 branch of the existing course-test type/title expectations; A1 assertions remain intact.

### Write 26 — synchronization and local rendering preparation

Ran `sync-curricula.mjs` and registered the five new A2 curriculum twins with `check-duplicates`. ESLint passed with zero warnings. The requested Vite command failed before compilation because Node could not spawn esbuild (`EPERM`). A local preview of the actual speaking/audio components and all twelve SVGs was successfully bundled with the installed esbuild executable and styled with the installed Tailwind CLI. The browser inventory is empty, so no visual observation is claimed. The preview remains available for supervisor verification; no external network or database was used.

### Verification failures investigated

The ordinary Node test runner failed with `Error: spawn EPERM`; the authorized isolation-none runner executes the tests. Truncated file reads caused one patch verification failure; no partial edit was applied to that file, and the recovery used narrowly targeted patches. An initial surname test falsely treated the lowercase word `und` as a surname; it now checks actual capitalized surname tokens. These were tool/test issues, distinct from content failures, and no A1 test or ratchet was weakened.

### Write 27 — full-suite findings

The first full run returned 244/251 passing tests. Fixed the L1 accepted pretest prefix, twelve writing-bank title prefixes, and bolded quoted possessive paradigms so the register checker distinguishes forms from learner address. Added A2-only persona rows for the three characters required by PLAN (Frau Schulz, Frau Yilmaz, Herr Wagner), preserving every inherited A1.2 row. The generic mutation fixture assumed an unused fifth can-do slot, dialogue-line dictation, and link-based reading; A2-only fixture branches now mutate a real A2 slot/speaking line/exam unit while retaining every A1 path and assertion. Focused reruns pass all of these checks, including the complete A2 validator-mutation test.

The newly registered course also exposes a third old intermediate-state assertion outside the listed authorization: exact equality of the complete A2 persona table with A1.2. The plan's new characters make that equality impossible. An authorization extension was requested for this assertion and the two empty-pool assertions. They remain unchanged pending a response. The intended replacement preserves exact equality of all inherited persona rows and checks populated, consistent pool data.

### Write 28 — final content audit

Extended picture checks to the in-lesson materials and checked that each picture-listening question has its own conversation. Checkpoint tests now verify that each round serves the authored checkpoint writing task and its actual range. Receptive grammar checks use Unicode word boundaries so `gehört` is not mistaken for the imperative `geh`. Matching paraphrases reduced the CP3 reading surface-heuristic peak substantially; final numbers are recorded below. Individual banks additionally cannot exceed their unavoidable four-round slot baseline by more than one response, while the pooled choice kinds retain the stricter chance-plus-10-percentage-point ceiling.

### 0 — report skeleton

Read the binding decisions, Step 1/2 reports, plan and A1.2 shapes. Exact baseline hashes, per-Lektion details, all changed files, audit numbers and final command output will be appended as observed.

### Write 17 — checkpoint papers

Added a21.exams.js and attached the banks: four papers per checkpoint, 64 reading responses and 80 listening responses. Formats: Lesen 3/2/4/1; Hören 4 (two dictations plus three Ja/Nein), 1, 3 (pictures), 2 (matching). All answers and evidence are authored. Audit and horizon verification are still pending.

The first complete validator run exited 1 with “✗ A2.1: 8 problem(s)”. Measurements: R10=0, R11=25, R11b=0, R12=16, R13=4, R6b=1, R15=0, R15b=1, R16=0, R17=7, R18=0, R19=0, R20=6, R21=12, R22=0, R23=0, R23b=0, R24=0, R25=0, R14=0. These are intermediate findings, not accepted final debt.

### Write 18 — orientation and pictures

Added parallel English orientation copy in a21.meta.js and twelve local SVG picture assets. No recording was generated: D9 schedules recorded audio after the build. Real-render observation remains pending.

### Write 19 — A2 rule cards

Added twelve A2 overrides at the existing rule-card source. Each uses its lesson notice and an authored correction. The next pool rebuild will regenerate the function-side cards; the A1 entries must compare identically to HEAD.

### Write 20 — complete level test

Expanded abschlusstestA21.js to twenty reading and twenty locally keyed listening responses, two writing tasks with the Goethe A2 ranges, and three speaking tasks. The existing reading texts remain. Listening no longer requires loading question keys from the database. The runner uses its existing objective scoring and the course playback control; play counts persist in the saved answers. Speaking includes four question cards, four monologue prompts and two calendars, with a shared self-check. Recorded audio is still the D9 follow-up.

### Write 21 — lesson and pool repairs; first complete validator pass

Nine legacy items now have scoped corrections, and the pool build contains 147 retained cache items plus 144 authored items (291 total). No A1 pool was rebuilt. Writing models and their two banks are aligned. The A2-only can-do reader now includes authored exam tasks and speaking cards; the previous reader omitted those actual exercise surfaces. Rejected explanations: missing tasks (the units were present), or model text being sufficient rehearsal (it is not). Follow-up repairs added explicit task instructions and taught the forms required by the items.

Validator exit 0, with the exact opening line: “✓ A2.1: 12 Lektionen, 216 Wortfeld-Einträge (156 mit wordId, 72 %), 54 h”. Every hard rule is 0. Every ratchet is 0 except “RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L4, L6, L9, L10”; these use the step-2 custom speaking-context route, with no invented numbered mission. Full regression, bank auditing and render verification remain pending.

The six supervisor-authorized empty-state assertions now require the registered draft and measured ratchets. The additional two pool-empty assertions remain untouched pending the clarification already requested.

## Open work

### 16 — hand-authored practice pool

Authored 144 typed items: ten per primary plus four extra items for each of the six bounded points. Every item has a German cue, a short explanation and English twin; sentence-building items have an explicit opening cue. Added the English sidecar and an initially empty corrections layer. The first build rejected three answer-in-prompt items. Removed leaked pronouns and a repeated article from those prompts before rebuilding; also replaced an unnecessary verb in a dass item with taught language.

### 15 — writing bank

Added twelve course tasks and four distinct transfer tasks to `src/data/writingTasks.js` and `netlify/functions/_shared/writingTasks.mjs`. SMS 20–30 and email 30–40; course register follows the recipient. The source lesson fields and bank tasks are exact twins. The L12 full-verb past Gab was replaced with war. The first JSON extraction command had an extra parenthesis; the corrected import completed before any bank write.

### 14 — Lektion 12

Looking back on the parents' visit; primary all haben-Perfekt types; bounded wenn, clause second. Ten dialogue lines, 18 vocabulary entries, five connected-conversation assignments, an email model and four question cards. L11's direct structural check was clean apart from the writing-bank dependencies. All twelve lesson writes were followed by the requested CLI command; full validation still requires the authored checkpoint banks.

### 13 — Lektion 11

A city walk with Ana's parents; primary dative prepositions; bounded adjective/ordinal -en after articles. Ten dialogue lines, 18 vocabulary entries, a media-text reading block, SMS model and four speaking prompts. The route is explicitly fictional rather than an unsourced geographical claim. L10's lexical diagnostics were corrected with already taught expressions.

### 12 — Lektion 10

Planning the parents' visit from Morocco; primary temporal in/für/über/ab/bis/zwischen; no bounded point. Ten dialogue lines, 18 vocabulary entries, programme-board MC, an email model and two calendars. Added the missing address word Herr to the independent A2 cast list after L9's structural diagnostic.

### 11 — Lektion 9

Tim starts an office job; primary two-object pronoun order; no bounded point. Ten dialogue lines, 18 vocabulary entries, colleague-email MC, an email model and four work question cards. L8 uses taught Weg and avoids an untaught rejoined verb in its weil clause. Every diagnostic run still exposes the intentionally absent checkpoint banks.

### 10 — Lektion 8

Ana's bicycle accident and doctor visit; primary sein-Perfekt including changes of state; bounded weil, clause second. Ten dialogue lines, 18 vocabulary entries, practice voicemail MC, SMS model and visit calendars. L7 uses am Montag and explicit imperative forms; mal is an A2 function particle. The shared A1 imperative matcher is unchanged.

### 9 — Lektion 7

Volleyball club and health advice; primary imperative, bounded solltest/könnten. Ten dialogue lines, 18 vocabulary entries, club-ad matching, an email model and four speaking prompts. L6's unexplained dringend, erst and hoffe were removed from the dialogue; notice examples changed with it. The full CLI remains blocked by the banks scheduled after the Lektionen.

### 8 — Lektion 6

Missed barbecue and a new date; primary modal Präteritum; bounded dass with a single finite verb, clause second. Ten dialogue lines, 18 vocabulary entries, voicemail MC, an SMS model and four speaking prompts. L5 now uses its taught verbs in the dative examples; its notice examples follow the changed dialogue. One patch initially failed an exact-text match and was reapplied against the actual line.

### 7 — Lektion 5

Oma's birthday and a joint gift; primary dative recipients, possessives, pronouns and plural -n; no bounded point. Ten dialogue lines, 18 vocabulary entries, correspondence MC, an email model and two calendars. L4's direct structural check reported only the intentionally pending writing bank.

### 6 — Lektion 4

Market shopping; primary adjective endings in nominative/accusative after definite, indefinite, negative and possessive determiners; no bounded point. Ten dialogue lines, 18 vocabulary entries, announcement MC, an SMS model and four life prompts. L3's unknown Problem was removed, and its listening text avoids nass before L8. Full-bank validation remains pending.

### 5 — Lektion 3

Furnishing Tim's flat; primary wo/wohin and positional verbs; no bounded point. Ten dialogue lines, 18 vocabulary entries, SMS model, paired calendars and a three-picture listening block. L2's lexical check exposed Hilfe; taught it in the Wortfeld and removed the unnecessary switch-off verb. Its infinitive umziehen now appears explicitly in input. The morphology regression test passes (1/1) without workers.

The full CLI still stops at the same missing checkpoint-bank dependency. Retrying cannot close it before the requested bank stage; per-lesson structural diagnostics are also run directly through the existing validator so content errors remain visible.

### 4 — Lektion 2

Packing for Tim's move; primary separable haben-Perfekt; no bounded point. Ten dialogue lines, 18 vocabulary entries, three classified-ad assignments, an email model and four speaking prompts. L1's structural rerun now reports only its writing-bank dependency. Ordinary Node workers failed with `spawn EPERM`; subsequent test runs use `--experimental-test-isolation=none`.

### 3 — L1 diagnostic repair

The structural validator found `wohnt` and `unserer` unknown. Competing explanations: missing inherited vocabulary (rejected: wohnen is in A1.1); incorrect authored German (rejected: wohnt is the regular form); A2 morphology/function-word gaps (confirmed). The A2 epenthetic-e regex treated silent h + n like a consonant cluster, producing wohnet/gewohnet. Exempted h in that A2-only generator and added the missing unser/euer case forms to the A2 function list. A runnable test covers wohnen versus atmen. No A1 generator or vocabulary was changed. The first direct probe omitted its required irregulars argument; rerun uses the correct signature.

### 2 — Lektion 1

Family photos and family history; primary `possessive-pronouns`; bounded name-s and von + dative. Authored ten dialogue lines, bilingual notice, 18 vocabulary entries, SMS model, four speaking cards and three interview Ja/Nein units. Only locally documented UUIDs are used; vocabulary recycling is explicit in provenance. The skeleton CLI run exited 1 at the missing checkpoint Lesen bank; this dependency will close in the bank stage.

### 1 — curriculum skeleton and draft registration

Created `src/data/curricula/a21.js` with provenance, the four checkpoint positions and an independent cast list. Attached only to `DRAFT_CURRICULA`; `curriculumFor('a2.1')` remains null. The skeleton intentionally has no authored Lektionen or checkpoint banks yet.

Baseline rerun: A1.1 exit 0, 6517 stdout bytes, SHA-256 `b0c08aa0905c6cf210426886b703650cc079c277f16ac54b6a48b66ed9193c37`; A1.2 exit 0, 2767 bytes, SHA-256 `ddc9c7f0ab6c6e94fabc1faa84edef6c88f1811f2458f6b77dd865259a5761bf`.

Fablize initially rejected the goal syntax; corrected to `title::objective`. Its unrelated tracker was backed up within `.fablize/`, and the Step 3 three-story tracker was then created successfully. Restore the original tracker after archiving Step 3 evidence.

At this initial skeleton checkpoint, all content and final verification were pending. Two additional empty-pool assertions at original `tests/a21-language.test.mjs:147–148` conflicted with the requested populated pool; the final state and expanded authorization question are recorded above.
