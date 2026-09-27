# Course v2 — the rails (checker, validator, compiler)

**Date:** 2026-09-27 · **Status:** operational guide. The data model is [`SCHEMA.md`](SCHEMA.md) (it wins on any
data question), the gates are [`BLUEPRINT.md`](BLUEPRINT.md) §9, the lean-execution cut is in the orchestrator's
brief (one exam lane per band: `sd1`, `ga2`, `tb1`, `tb2`; secondary lanes, lane packs, calibration anchors and the
model-calling gates of §9.2 are deferred).

Three tools guard every content file under `content/course-v2/`. All three are plain Node, no dependencies, and
none of them touches the network, a clock (except the validator's CON-06 date check) or git.

| Tool | Command | Answers | Writes |
|---|---|---|---|
| **Checker** | `node scripts/course-v2/check.mjs` | Is the file shaped like SCHEMA says, at its stage? Do its ids resolve? (SCH-01, REF-01, KEY-01) | nothing |
| **Validator** | `node scripts/course-v2/validate.mjs` | Does the content meet the BLUEPRINT §9.1 rules (grammar ceiling, lexis, items, exam format, coverage …)? | nothing |
| **Compiler** | `node scripts/course-v2/compile.mjs` | What the player and the graders read (SCHEMA §13) | `src/data/course-v2/<level>/`, `netlify/functions/_shared/course-v2/<level>.banks.json` |

**Authors and reviewers run the checker and the validator only.** The compiler is run by the orchestrator after a
lease is released (BLUEPRINT §10.5, §10.8); an author agent never writes compiled output.

---

## 1. Quick start

```bash
# after writing or fixing a unit (any role): both must be clean for your stage
node scripts/course-v2/check.mjs content/course-v2/a2.1/units/u07.json
node scripts/course-v2/validate.mjs content/course-v2/a2.1/units/u07.json

# the whole level, including the level-scope coverage rules (COV-1, COV-4, COV-5)
node scripts/course-v2/check.mjs content/course-v2/a2.1
node scripts/course-v2/validate.mjs a2.1

# everything
npm run -s course:check              # = check.mjs --all (fixtures included, each tree on its own index)
node scripts/course-v2/validate.mjs --all

# the orchestrator, after a lease is released
node scripts/course-v2/compile.mjs a2.1            # writes the level's compiled files
node scripts/course-v2/compile.mjs --all --check   # CI drift guard: exit 1 if an output would change
```

Exit codes, all three tools: **0** clean · **1** a finding that blocks (a checker error, a validator blocker, a
compile refusal or a stale output under `--check`) · **2** a usage error.

### Which stage am I at?

A unit file declares the role that last completed its run (SCHEMA §8.1). Write the field yourself when you finish
your run; both tools judge the file at that stage.

| `stage` | Written by | Must be present (in addition to the earlier stages) | Must be absent |
|---|---|---|---|
| `spec` | curriculum agent | `$schema`, `id`, `level`, `nr`, `etappe`, `version`, `status`, `reviewedIn`, `stage`, `title`, `spec` | everything else |
| `S` | S „Szene & Text" | `start` (without `folge.gistItem`), every step with its `id`/`kind` (and `title`, input, rule card, warm-up where the step type has them), `endLine`s, `texts` of LS4 and of a slot-`input` step, `story`, `fokus`, `facts`, `assets` (`extras` when used), `redemittel` | items, pools, reserves, `check`, blocks, tasks, micro-outputs |
| `I` | I „Items" | `folge.gistItem`, `inputItems` (not on a step with exam `texts`), `structuredInput`, `pool`, `reserve`, Aussprache `perception`, `check` | `blocks`, `examBlock`, `strategyCards`, tasks, micro-outputs, `Ueberarbeiten.of` |
| `T` | T „Prüfungsaufgaben" | `blocks`, `examBlock` on a step with exam `texts`, `strategyCards`, every `microOutput`, `SprechenStep.task`, `SchreibenStep.task` | — |

A missing or invalid `stage` is itself an SCH-01 error, and the file is then checked at `T` (the full shape).
`--stage S|I|T|spec` on either tool judges every target file at that stage instead of its declared one. A lane pack
has no stages (SCHEMA §9) and is always judged in full.

To reduce a unit to what an earlier stage may contain (e.g. to re-run a role), use `stripToStage(unit, stage)` from
`scripts/course-v2/lib/schemas/unit.mjs`.

---

## 2. The checker — `scripts/course-v2/check.mjs`

```
node scripts/course-v2/check.mjs <file|dir|--all> [--no-refs] [--stage spec|S|I|T] [--quiet]
```

- One line per error: `file:path: RULE message (near <id>)`, e.g.
  `content/course-v2/a2.1/units/u07.json:$.steps[0]: SCH-01 missing required field "endLine" (near a2.1-u07-ls1)`.
  `near` is the closest enclosing object with an `id`.
- **SCH-01** — the SCHEMA §1 notation, implemented in `scripts/course-v2/lib/schema.mjs`; one schema module per file
  kind in `scripts/course-v2/lib/schemas/*.mjs`, written as notation strings that read like SCHEMA itself
  (`'[ref(cando)]{3..5}'`). Unknown keys are errors; `// generated` fields (line `seconds`, a unit's
  `contentHash`/`minutesPlanned`/`reviewCards`, a course's `counts` …) are rejected in authored files.
- **REF-01** — every `ref(kind)` is format-checked always, and looked up once any file defining that kind is loaded.
  Until the first file of a kind exists, its refs are only format-checked (content arrives out of order). Once one
  exists, an unresolved ref is a hard error — which also flags forward references (e.g. a spine point naming a rule
  card of a level not written yet). `--no-refs` switches the lookup off.
  - `ref(extra)` resolves only against **the same file's** `extras` (SCHEMA §1).
  - `ref(text)`, `ref(asset)` and `ref(step)` resolve against the ExamTexts, Assets and Lernschritte of the tree.
  - `ref(lexicon)` resolves against `registries/lemmas.json` and the levels' `lexicon.json` files.
  - `ref(voice)` resolves against `registries/voices.json` once it exists.
- **KEY-01** — every bank key matches `BANK_KEY_RE` (SCHEMA §2, pinned character-identical by a test); the
  compiler additionally refuses a key of another course's prefix and duplicate keys.
- **Resolution scope.** A file under `content/course-v2/fixtures/` resolves only against the fixtures; every other
  file under `content/course-v2/` against the rest of that tree. Dot directories (the compiler's `.build/`) are
  never read as authored files.
- **File kinds.** A file is matched by its `$schema` literal (`course-v2/unit@1`, `…/course@1`, `…/lane@1`,
  `…/lemmas@1`, `…/plateau@1`, `…/plateaulanepack@1`, `…/closing@1`, `…/mockmodule@1`, `…/lanepack@1` …). The
  registries SCHEMA writes without one are matched by path: `text-types.json`, `detectors.json`, `voices.json`,
  `style.json`, `casts/*.json`. **A JSON array is never a course-v2 file** (one unit per `units/uNN.json`).
- Every id pattern and `BANK_KEY_RE` live in one file, `scripts/course-v2/lib/ids.mjs`; the validator, the
  functions' `_shared/entitlement.mjs` and `_shared/rubrics/keys.mjs` are pinned against it by tests.

---

## 3. The validator — `scripts/course-v2/validate.mjs`

```
node scripts/course-v2/validate.mjs <level|unit-file|--all> [--json] [--stage S|I|T|all] [--unit N]
                                    [--rule ID,..] [--today YYYY-MM-DD] [--root DIR] [--verbose]
```

- **Severity.** `blocker` (a hard rule failed → exit 1), `ratchet` (a measured count that may only go down — LEX-02),
  `advisory` (printed, never fails). A rule whose inputs do not exist yet prints `SKIP … skipped: <reason>`; a
  partial level is a normal state.
- **Stages.** Each rule declares the earliest stage whose content it can judge. A unit is judged at its declared
  `stage`; a unit without one is judged at `T` — except a stage-less unit that holds only its spec (no `start`,
  `steps` or `check`), which is judged as a `spec`. Level-scope coverage rules (COV-1, COV-5) **block only when all
  12 units of the level are at stage `T`**; before that the same measurement is printed as advisories.
- **Scope.** `unit` rules run on the target file(s); `level` rules (COV-1, COV-4, COV-5) need a level target
  (`validate.mjs a2.1`) and skip on a single file.
- The validator does not re-check shapes: run the checker too.

### 3.1 Implemented rules (39)

| Rule | Stage | What it checks |
|---|---|---|
| REF-01 | spec | Every referenced id resolves (incl. the file's `extras`, texts, assets, `rueckschau` cards, `pruefungsfokus.step`, lemma and voice registries when present) |
| ID-01 | S | Ids well-formed (SCHEMA §2), unique, children prefixed by their parent, no tombstoned id reused |
| KEY-01 | T | Bank keys match `BANK_KEY_RE` and their slot |
| ALL-02 | I | 3–5 can-dos per unit, tagged and proven; ≥ 1 productive can-do proven by an Aufgabe |
| ALL-03 | spec | ≥ 2 verified Lehrwerk placements or a `deviation.reason` („(unverified)"/„(snippet)" do not count) |
| GRM-01 | spec | ≤ 2 new spine points and ≤ 1 chunk preview per unit (spine intros included) |
| GRM-02 | T | Spine points enter at their registry position, receptive before productive |
| GRM-04 | S | Grammar ceiling via `registries/detectors.json` (texts from S, items and answers from I) |
| GRM-05 | T | Rule cards: word limit, model sentence, English twin |
| LEX-01 | S | Known-token coverage of inputs and exam texts (advisory until the cumulative lexicon exists) |
| LEX-02 | S | New lemmas recur ≥ 2× in the unit's inputs and in ≥ 2 later units (ratchet) |
| LEX-03 | I | Production uses known lemmas only; ≤ 3 glossed extras per text (advisory until the cumulative lexicon exists) |
| LEX-04 | S | Off-list share within the level limit; extension words receptive |
| LEX-05 | spec | New-word counts and productive share per unit; `lexiconBlocks` = the `lexicon.json` allocation |
| LEX-07 | T | Lexicon hygiene: one gloss per lemma, feminine pairs, `plural_kind`, `wordId: null` |
| TXT-02 | S | Exam texts within their Teil template's length band |
| TXT-03 | S | Input sizes: lines, words, seconds per level |
| TXT-04 | T | Instructions ≤ 90 characters; exam stems within `examStemChars`; template instructions ≤ 200 |
| ITM-01 … ITM-11 | I | Answer follows from the German prompt; choice items; key balance; R/F not copied; task shapes; pools of 16 + reserves 4–6 (no reserve repeats a pool item's POS-masked key); `exact`; `caseSensitive`; sentence-building orders; accepted forms; static `{de, en}` explanations |
| CON-06 | S | Facts carry https sources, a fresh check date and `verification: "verified"` |
| EXM-01 | T | Exam blocks match their template: items, options, plays, block choice set (count, kind, reuse), no-match key, every answer a choice key, scaffold limits, each `⟦NN⟧` gap filled once |
| EXM-02 | T | Scaffolding only where the template allows it; never in .2; pictorial Teile only as the text variant in .1 |
| EXM-03 | T | Writing tasks match their template (Leitpunkte, `choose`, register, words, rubric, exam key; form tasks: field count) |
| EXM-04 | T | Speaking tasks match their template, part by part (mode, preparation, stimulus, partner data, topic choice, key points, seconds/turns, `prepAtHome`) |
| EXM-11 | T | Each Prüfungsfokus entry has exactly one slot, and that slot holds its block or task |
| COV-1 | T (level) | Every Teil of a live lane appears ≥ 2× (.1) / ≥ 3× (.2) across the level |
| COV-3 | spec | 2–4 primary-lane Teile per unit; .2: ≥ 1 at full length in Prüfungsmodus |
| COV-4 | spec (level) | Each module ≥ 15 % of the Prüfungsfokus slots |
| COV-5 | spec (level) | Productive Teile recur at least every 4th unit |

`registries/detectors.json` (130 detectors: 67 exact, 59 heuristic, 4 advisory; each passes its own hit/miss
examples) drives GRM-04. The spine's own `detectors` lists are still empty, so GRM-04 places each detector by its
`spinePoints` hint — the curriculum owner should copy those links into `grammar-spine.json`.

### 3.2 Not implemented yet, and why

| Rules | Why not (yet) |
|---|---|
| **SCH-01** | Not a validator rule: it is the checker (§2). |
| ALL-01, ALL-04, ALL-05, ALL-06 | Level/band structure and quota rules; need complete levels (course.json + 12 units) to be meaningful. Next after the first level reaches T. |
| GRM-03, GRM-06 | Inventory floors need the full A1/A2 allocation; warm-up interleaving needs S/I content across units. |
| LEX-06 | Needs the private `list_ref` table (`private/list-ref.json`), never committed. |
| TXT-01 | Sentence metrics (ratchet/hard): not built in E0-2; the level profile's `sentence` limits are ready for it. |
| ITM-12 | Course-level repair-pool coverage; needs every unit of a level at stage I. |
| AUD-01 … AUD-05 | Audio rules need `registries/voices.json` (speaker gender ↔ voice) and the audio run. The compiler already resolves every line's voice from the cast bible or the file's `extras`. |
| CON-01, CON-02, CON-04, CON-05 | Cast/story consistency rules; need the cast bible checks and S content across units. |
| AST-01, AST-02 | No unit uses images yet (the fixture's `assets` is empty). The checker already enforces the Asset shape (alt text, licence record, prompt when generated). |
| LNG-01 … LNG-04 | Need Hunspell / LanguageTool / spaCy tool chains; not installed (no new npm dependencies in this phase). |
| TIM-01 … TIM-05 | Time model not built; the compiler's `minutesPlanned` uses the level profile's design minutes per step kind. |
| SRS-01, SRS-02 | Review-load simulation; the compiler's `reviewMinutesByPace` is a labelled upper-bound estimate until then. |
| COV-2, COV-6, COV-7, EXM-09 | .2 / multi-lane coverage; lean execution runs one lane per band, and COV-6 applies only to secondary lanes (deferred). |
| EXM-05, EXM-06, EXM-10 | Mock forms, Plateau/Halbtest inventory, DTB/DTZ: no v2 Plateau, closing or Modelltest files yet (.2 courses reuse `src/data/mockExams/*`). |
| EXM-07, EXM-08, PRG-01, PRG-02 | Code rules, pinned by tests instead: `tests/course-v2-ai.test.mjs` (EXM-08 zero/cap rules), `tests/course-v2-completion.test.mjs` (PRG-02 one completion function). |
| QA-FRESH-01, SOL-01…03, CAL-01/02, LGL-05 | Model-calling and calibration gates (BLUEPRINT §9.2): **deferred** in lean execution. No `qa/` or `anchors/` files are written; the checker still validates their shape if one appears. |
| LGL-01 … LGL-10 | Claims/legal lints over learner-visible strings: owned by the claims/copy tests, not the content validator. |

---

## 4. The compiler — `scripts/course-v2/compile.mjs` (orchestrator only)

```
node scripts/course-v2/compile.mjs <level|--all> [--check] [--content <dir>] [--out <dir>] [--banks-out <dir>]
                                    [--fixture] [--no-refs]
```

- **Refuses on any error.** Every file of the level and every shared registry must pass the checker first; on any
  error nothing is written and the exit code is 1. With `--all`, an error in a shared registry is printed once, not
  once per level.
- **Deterministic and idempotent.** No clock, environment or network; the same content gives the same bytes.
  `--check` writes nothing and exits 1 when an output would change (the CI drift guard).
- **Only units at stage `T` are compiled into playable chunks.** Earlier stages get a syllabus row (title, can-dos,
  grammar, Prüfungsfokus, planned minutes) and `chunk: null`.
- Outputs per level (JSON in v0; SCHEMA §13 names some of them `.js` — the JS twins are the E1/W5 owners' step):

| Output | Content |
|---|---|
| `src/data/course-v2/<level>/units/uNN.json` | the unit chunk: learner-invisible fields stripped (`origin`, `acceptedWhy`, `reviewerConfirmed`, `lehrwerk`, `fokusPlan`, fact `notes`, `stage` …), **reserves removed**, generated ids for generator specs (`STEP-gNN`), estimated line seconds, `poolItems` in the live `lessonPools` shape, `minutesPlanned`, `reviewCards`, `contentHash` |
| `…/<level>/reserve.json` | the reserve index: every reserve item in the pool shape with `unit`, `step`, `errorTags`, `banks`, indexed by unit, topic and error tag (requeue, `earlierDraw`, Plateau review, Mehr üben, repair cards) |
| `…/<level>/manifest.json` | syllabus rows for all 12 units + course fields (lanes, Etappen, completion, review, pace, targets) + counts |
| `…/<level>/rule-cards.json`, `…/<level>/lines.json` | the level's rule cards; every spoken line with its voice (cast bible, or the file's `extras`) and TTS text (`say`, else `de`) |
| `…/<level>/ids.ledger.json` | every live id; removed ids become tombstones; **a tombstoned id may never come back** (ID-01) |
| `netlify/functions/_shared/course-v2/<level>.banks.json` | grader input keyed by bank key: `writing` (tasks with Leitpunkt `cues` and `choose`, form fields for form tasks, plus written micro-outputs), `speaking` (tasks with parts, stimulus, partner data, key points, seconds/turns, plus spoken micro-outputs), `micro` (every micro-output with its `mode`) — never model texts or model turns |

- **The fixture** compiles only to explicit folders: `node scripts/course-v2/compile.mjs a2.1 --fixture --out <dir>
  --banks-out <dir>` (E1's player fixture). On it the outputs equal SCHEMA §15.5 (the p06 pool item, both writing-bank
  entries in key order, the syllabus row with 150 planned minutes, 28 + 1 + 5 review cards, both audio lines).

---

## 5. The SCHEMA §15 fixture

- `content/course-v2/fixtures/a2.1-u07.json` and `fixtures/registries/**` are extracted **verbatim** from SCHEMA.md §15
  by `node scripts/course-v2/lib/fixture.mjs --write`; `--check` exits 1 when SCHEMA.md and the files drift, and a
  test fails too. After any edit of SCHEMA §15: run `--write`, then the tests.
- Bare excerpts get their file envelope (e.g. the lexicon entries get `{ $schema, level, entries, promotions: [] }`).
- `fixtures/registries/stubs.json` lists ids §15 references but does not excerpt (`g.wenn`, `g.perfekt-haben`, the
  other A2.1 units, the deferred `ta2` lane and templates, the text types/families/detector the unit names). It is
  hand-maintained on purpose; deriving it from unresolved refs would make REF-01 vacuous.
- On the fixture: the checker reports 0 errors at every stage it is stripped to (`spec`, `S`, `I`, `T`); the
  validator reports exactly one blocker, **CON-06** (fact `a2.1-u07-f01` is `verification: "partial"`) — the failure
  SCHEMA §15.6 plans.

---

## 6. Tests

| File | Covers |
|---|---|
| `tests/course-v2-schema.test.mjs` | fixture verbatim; SCH-01/REF-01/KEY-01 on the fixture; the §8.1 stage schema (strip to each stage, absent/required per role); §15.4 lane pack and §15.7 choice fixtures in memory; 30+ mutations each failing at the expected path/rule/message; `BANK_KEY_RE` matrix (47,520 keys) and garbage; compiler determinism, idempotency, §15.5 equality, reserve index, ledger tombstones, refusal; both CLIs |
| `tests/course-v2-validate.test.mjs` | every validator rule with a passing and a failing fixture (parsed from SCHEMA.md); §15.6 expectations; stage gates incl. the spec inference and COV-1's stage-T severity; detectors' own examples; CLI |
| `tests/course-v2-ai.test.mjs`, `…-entitlement…`, `…-completion…` | the graders and speaking functions read the compiled banks; entitlement; the one completion function |

`npm test` runs them all; `npx eslint scripts/course-v2 tests/course-v2-*.test.mjs --max-warnings=0` must be clean.

---

## 7. Where the rails depart from SCHEMA (for the SCHEMA owner to confirm or amend)

1. `Item.errorTags`, `Item.banks`, `Item.reviewerConfirmed` and `SpeakingPart.keyPoints` are written `[T]*` without
   `?` in SCHEMA but are optional here: most §15 items/tasks omit them and §15.6 requires SCH-01 to pass.
   `keyPoints` is required for mode `mediate`.
2. `TeilTemplate.textWordsSource` is required only with `textWords`; `scaffold` is required when `scaffoldAllowedIn`
   is non-empty **for receptive Teile only** (§15.1 `ga2.sp1` is scaffoldable without one).
3. `WritingTask.leitpunkte` may be empty only on a `form` task; `wordBand`/`minSubmitWords` are required unless
   `form` (SCHEMA's comment, enforced).
4. Rubric profiles: `method`, `examMax`, `criteria[].scoredBy`, `descriptors`, `bands` and `errorPolicy` stay
   optional while the lane agents migrate (15 of the 21 real profiles lack `method`/`examMax`/`errorPolicy`; §15.1's
   own `ga2-s2` has no `bands`). `criteria[].appliesIf` (course-micro) is accepted but not in SCHEMA §4.5.
5. Id patterns widened where SCHEMA gives no owner: Plateau reward items/lines `<plateau>-(lm|hm)-NN`,
   `<plateau>-(lm|hm|sc)-lNN`; micro-outputs `UNIT-start-mo` (B Auftakt) and `PLATEAU-mo` (Projekt).
   A lane-infixed text id (`…-ls4-ta2-t3`) also has the shape of a block id; position decides.
6. `text-types.json`, `detectors.json`, `voices.json`, `style.json` and `casts/*.json` may carry an optional literal
   `$schema`.
7. The ids ledger lives at `src/data/course-v2/<level>/ids.ledger.json` and compiled output under `src/data/…`
   rather than SCHEMA §13's `content/course-v2/<level>/.build/`; the checker already ignores any `.build/` tree.
8. The validator judges a stage-less, spec-only unit as `spec` (SCHEMA requires `stage`; the checker reports its
   absence).

## 8. Open issues at the time of writing (2026-09-27)

- **`src/lib/course-v2/completion.js` lags the revised SCHEMA §5**: it accepts only `{ kind: 'closing' }` in
  `completion.course.required` and throws on the new `{ kind: 'halbtest' | 'modelltest', lane: 'learner', … }`
  entries (which the fixture and the new real `course.json` files carry). The fixture-agreement test in
  `tests/course-v2-completion.test.mjs` is marked `todo` until the completion owner updates it.
- **Real registries fail the revised schema** (other agents' files, reported, not edited here):
  `registries/text-types.json` (`lengthByLevel` values are `{ input, writing }` objects instead of `[int, int]`, and
  a top-level `notes` key), `registries/lanes/{sd1,ga2,tb2}.json` (no `delivery`; Teile without `pictorial`,
  `instructionsDe`, `paraphraseOf`, `scaffold`), and forward rule-card refs in `grammar-spine.json`. Until they pass,
  `npm run course:check` exits 1 and the compiler refuses every level.
- **`content/course-v2/<level>/specs.json`** (curriculum agents' bundles) are arrays, not SCHEMA files: split them
  into `units/uNN.json` with `"stage": "spec"`. As spec units they already pass except `lexiconBlocks` (empty
  `lemmas` and an unknown `target` key, pending the lexicon allocation).
- LEX-02 counts 8 ratchet entries on the fixture where SCHEMA §15.6 says 7 (`Rückruf` also occurs once).
