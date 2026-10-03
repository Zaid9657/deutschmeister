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

### 3.1 Implemented rules (43)

| Rule | Stage | What it checks |
|---|---|---|
| REF-01 | spec | Every referenced id resolves (incl. the file's `extras`, texts, assets, `rueckschau` cards, `pruefungsfokus.step`, lemma and voice registries when present) |
| ID-01 | S | Ids well-formed (SCHEMA §2), unique, children prefixed by their parent, no tombstoned id reused |
| KEY-01 | T | Bank keys match `BANK_KEY_RE` and their slot |
| ALL-02 | I | 3–5 can-dos per unit, tagged and proven; ≥ 1 productive can-do proven by an Aufgabe |
| ALL-03 | spec | ≥ 2 verified Lehrwerk placements or a `deviation.reason` („(unverified)"/„(snippet)" do not count) |
| GRM-01 | spec | ≤ 2 new spine points and ≤ 1 chunk preview per unit (spine intros included) |
| GRM-02 | T | Spine points enter at their registry position, receptive before productive |
| GRM-04 | S | Grammar ceiling via `registries/detectors.json` (texts from S, items and answers from I); one advisory instruction scope (strategy cards, instructionsDe, situationDe, title.canDo); chunk-licensed hits not reported (§3.1b) |
| GRM-05 | T | Rule cards: word limit, model sentence, English twin; a card shows the chunk its first unit declares where the spine contrasts the two (§3.1b) |
| LEX-01 | S | Known-token coverage of inputs and exam texts (advisory until the cumulative lexicon exists); „known" is defined in §3.1a; every other read surface (prompts, options, explanations, instructions, situations, Leitpunkte, checklist, can-do title, step titles, endLines) uses known, glossed or metalanguage words (§3.1b) |
| LEX-02 | S | New lemmas recur ≥ 2× in the unit's inputs and in ≥ 2 later units (ratchet) |
| LEX-03 | I | Production uses known lemmas only (§3.1a); ≤ 3 glossed extras per text (advisory until the cumulative lexicon exists); lex.glossTyped sources productive (§3.1b) |
| LEX-04 | S | Off-list share within the level limit; extension words receptive |
| LEX-05 | spec | New-word counts and productive share per unit; `lexiconBlocks` = the `lexicon.json` allocation |
| LEX-07 | T | Lexicon hygiene: one gloss per lemma, feminine pairs, `plural_kind`, `wordId: null`; a lemma a lower level allocated is re-allocated only by `promotions` (reported on the higher entry); a `-N` homograph needs its own gloss |
| TXT-01 | S | Sentence metrics per level (`level-profiles.json` `sentence`): long sentences, the mean and subordinate clauses of the course's texts (ratchet); subordinate clauses in the metalanguage (ratchet); outliers and exam-text sentences (advisory) (§3.1c) |
| TXT-02 | S | Exam texts within their Teil template's length band |
| TXT-03 | S | Input sizes: lines, words, seconds per level |
| TXT-04 | T | Instructions ≤ 90 characters; exam stems within `examStemChars`; template instructions ≤ 200 |
| ITM-01 … ITM-11 | I | Answer follows from the German prompt; choice items; key balance; R/F not copied; task shapes; pools of 16 + reserves 4–6 (no reserve repeats a pool item's POS-masked key); `exact`; `caseSensitive`; sentence-building orders; accepted forms; static `{de, en}` explanations (extensions: §3.1b) |
| ITM-12 | I | Error tags and repair pools: a point introduced productively has tagged reserve items; reserve items and error corrections carry a tag (ratchet); register/negation tags (advisory) (§3.1c) |
| ITM-13 | I | Audio keys: a dictation key is typeable (only characters the checker folds) and its audio (`say`, else `de`) grades CORRECT against it; dictation length per band (advisory); „Frage/Aussage" follows the played text (§3.1b) |
| CON-01 | S | Cast consistency: phone, address and age as the cast bible (ratchet); an extra's surname, one voice for two people, a speaker missing from `spec.cast` (advisory) (§3.1c) |
| CON-06 | S | Facts carry https sources, a fresh check date and `verification: "verified"`; in a `draft` unit a sourced `partial`/`pending` fact with a reason in `notes` is a warning (§3.1a); a unit that states a country-wide rule, or whose plan names a Landeskunde point, has a fact or a Landeskunde reason (§3.1b) |
| EXM-01 | T | Exam blocks match their template: items, options, plays, block choice set (count, kind, reuse), no-match key, every answer a choice key, scaffold limits, each `⟦NN⟧` gap filled once |
| EXM-02 | T | Scaffolding only where the template allows it; never in .2; pictorial Teile only as the text variant in .1 |
| EXM-03 | T | Writing tasks match their template (Leitpunkte, `choose`, register, words, rubric, exam key; form tasks: field count) |
| EXM-04 | T | Speaking tasks match their template, part by part (mode, preparation, stimulus, partner data, topic choice, key points, seconds/turns, `prepAtHome`) |
| EXM-11 | T | Each Prüfungsfokus entry has exactly one slot, and that slot holds its block or task |
| COV-1 | T (level) | Every Teil of a live lane appears ≥ 2× (.1) / ≥ 3× (.2) across the level |
| COV-3 | spec | 2–4 primary-lane Teile per unit; .2: ≥ 1 at full length in Prüfungsmodus |
| COV-4 | spec (level) | Each module ≥ 15 % of the Prüfungsfokus slots |
| COV-5 | spec (level) | Productive Teile recur at least every 4th unit |

### 3.1a What LEX-01 / LEX-03 count as „known", and CON-06 while drafting (rule-smith 2026-09-27)

A token is known at a unit when it is one of:

1. **An inflected form of an allocated lemma** (every lower level + this level's units ≤ this one), generated from
   the entry's own fields by `lib-validate/lexicon.mjs` — never guessed by stripping a token. Verbs: present with the
   2sg/3sg stem change, imperative (`hilf`, `lies`), Präteritum (`verb_forms.praet`; when absent, the strong-verb
   table `lib-validate/strong-verbs.mjs` — 124 simplexes, prefixed compounds follow them: `verstehen → verstand` —
   plus the regular weak forms), Konjunktiv II in every person (`käme`, `hätte`, `könnte`, `würde`), Partizip II with
   adjective endings (`die geplante Reise`), Partizip I, zu-infinitive; a separable verb split (`fängt … an`) and
   rejoined (`stattfindet`, `ankam`). The Präteritum's **first** word is the verb (`kam mit` → `kam`; the old
   last-word reading made every `mit`/`vor`/`ab`/`sich` an occurrence of the verb and under-counted LEX-02).
   Nouns: case endings, the `plural` field (+n dative), the feminine pair (+nen). Adjectives/adverbs: six endings on
   positive, comparative and superlative, umlauting comparatives (`älter`), irregulars (`besser`, `mehr`, `lieber`,
   `höher`, `nächst`), `-el`/`-er` stems (`dunkle`, `teure`).
2. **A number word** — cardinals 0–9 999 and ordinals with every ending (`ersten`, `zwanzigsten`, `dreißigsten`).
3. **The closed A1 core**, `lib-validate/core-lexicon.mjs`: the irregular paradigms of sein, haben, werden, the modals,
   wissen and tun (Konjunktiv II included); closed-class words `FUNCTION_WORDS` lacks (da-/wo-compounds, indefinites,
   interjections, A1 time/place adverbs); ~50 A1 content words no lexicon allocates (Moment, Tür, einmal, fertig,
   bringen, beginnen, sagen …). ≤ 400 entries (a test pins it and bans the B-level words proposed so far).
   **The lexicon outranks the core:** a core lemma some lexicon allocates to a later unit is unknown before that
   unit, so the core can never teach a word early; every lemma the eight lexicons allocated on 2026-09-27 was pruned
   from it. A missing A2–B2 lemma is a gap for its allocator, never a core entry.
4. **Licensed by the unit's grammar:** the example forms of every spine point the unit names
   (`spec.grammar.new/chunk/review`) or that entered at or before it (`intro`, `chunkFrom`) — the spine label's
   examples (after its colon, inside brackets) and its rule cards' model sentence, table rows below the header and
   `caseMarks` tokens. Card prose is metalanguage and licenses nothing, and — as with the core — a card example
   the lexicon allocates to a later unit (`Montag` on the A1.1-U1 Präsens card, allocated to U7) is not licensed early.
5. Cast names (also in the genitive: `Priyas`), proper names from `registries/names.json` (below), the file's
   `extras` names, glossed extras (LEX-01) — and a **one-letter token** is an option key (`c`, `X`), never a word.

Compounds are **not** decomposed: a compound is a lexicon entry of its own (`list_ref: compound:a+b`, SCHEMA §6).
**Proper names** that are not cast members come from `registries/names.json` (SCHEMA §4.9): every token of a listed
name is known from the name's `level` on, with its genitive -s and adjectival -er (`Leipzigs`, `Leipziger`,
`Cospudener`) and, inside a multi-word name, adjective endings (`in der Sächsischen Schweiz`); a token some lexicon
allocates stays unknown before that unit (the lexicon outranks the list, as it outranks the core).

**CON-06 while drafting.** Agents cannot re-read most primary sources through the proxy. While a unit is
`status: "draft"`, a `partial`/`pending` fact that carries https source(s) **and** says in `notes` what was not
re-read and why is a warning (advisory, the reason quoted). From `status: "review"` on it blocks — the SCHEMA §15.6
fixture is a `review` unit and still fails CON-06 as planned. No source, a non-https source or no reason: blocker at
every status.

`registries/detectors.json` (132 detectors: 68 exact, 60 heuristic, 4 advisory; each passes its own hit/miss
examples) drives GRM-04. 129 are placed through the spine's own `points[].detectors` lists; `det.vokalwechsel`,
`det.moechte-infinitiv` and `det.genitiv-feminin-attribut` through their `spinePoints` hint — the spine owner
regenerates the lists (spine.md §2: „generated, never hand-typed").

### 3.1b Rail fixes from the u04 reviews (rule-smith 2026-09-27)

Every `proposedRule`, and every finding whose path or fix pointed at the checker, a generator or a validator
rule, in `docs/course-v2/reviews/<level>/<level>-u04.r*.json` (8 levels, 14 review rounds) was collected; BLUEPRINT
§9.4 makes a class that survives rounds a rail. Each fix below has a passing and a failing test
(`tests/check-answer.test.mjs`, `tests/course-v2-player.test.mjs`, `tests/course-v2-validate.test.mjs`, blocks
„rail fixes from the u04 reviews" onward). **Severity** says what a finding does to the run; a rail is advisory where
the review finding was minor, where the rule is a heuristic a reader must confirm, or where the SCHEMA §15 worked
example itself does it (the example must stay as documented — §7 item 13 lists what the SCHEMA owner decides).

**The answer checker** (`src/lib/lesson/check.js`, `src/lib/course-v2/checkItem.js`, generator
`src/components/course-v2/content.js dictationItems`):

| Review finding(s) | Change | Live A1.1 course |
|---|---|---|
| a2.2 r3 F02 | An ellipsis („…", „..." typed) is punctuation: `stripPunct` turns it into a space for every check, `normalizeDictation` too. „Mir wird schlecht und ein bisschen kalt." is CORRECT against „Mir wird schlecht… und …". New `unfoldedDictationChars(text)` names what no fold removes. | bug fix (no live key has „…"; a typed „..." used to glue two words) |
| a2.2 r2 F07, b1.1 r2 F05, a1.1 r2 F01 | A dictation hears „fünfzehn" and „15" alike: `foldNumberWords` reads cardinals 0–9999 and ordinals as digits („am dritten Juni" = „am 3. Juni"); „ein/eine" never fold. In `checkAnswer` it is a second pass that runs only when the plain dictation check did not accept the answer and is kept only when it is better — nothing CORRECT or TYPO is graded worse. | bug fix: the live L4/L6/L8/L10/L11 dictations say „fünfzehn Euro", „um eins", „um neun Uhr" — „15 Euro" was WRONG |
| a2.2 r3 F04 | `exact: 'number'` on a **dictation** compares the whole sentence: the digit runs (number words read as digits) must be the same numbers in the same order, the rest is graded by the dictation check („Hugel" = TYPO); no words-may-be-left-out shortcut („10" alone is WRONG). a1.2-u04-c08 re-run: its date forms still grade CORRECT. | v2 only (checkItem) |
| a1.1 r3 (orchestrator), b2.2 r1 F16 | On every `exact: 'number'` item a German number word equals its value („neun" for „9", „dreiundzwanzig" for „23", and „200" for a worded „zweihundert"); a letter slip in a number word („nuen") is a TYPO, a wrong value („zehn") WRONG. A worded time („halb zehn") is never answered by its digits alone. | v2 only |
| b1.2 r1 F23 | Pinned by a test: a phone number compares digits only — „0341/225890", „(0341) 225890", „0341-225890" are CORRECT. | v2 only |
| a2.2 r3 F04, ITM-07 | `dictationItems` sets `exact: 'number'` on a line with a digit or a number word, so a generated dictation is graded like an authored one. | — |

**Validator rules** (`scripts/course-v2/rules/*`, `scripts/course-v2/lib-validate/*`):

| Review finding(s) | Rule | What it checks | Severity |
|---|---|---|---|
| a2.2 r3 F02, a1.1 r2 F01, a1.2 r1 F01 | **ITM-13** (new) | Dictations (authored, and every `dictation.fromInput` line built by the player's own generator): the key holds no character the checker does not fold („(", „/", „%", „€" …); the line's `say` (else `de`) — its commas are pauses — is graded CORRECT by the player's `checkItem` against the key (sentence keys of ≥ 3 words). `listen_select` „Frage/Aussage": the played text ends in „?" exactly when the key is „Frage". | blocker |
| a2.1 r3 F08, b1.1 r2 F11 | ITM-13 | Dictation length: A ≤ 12 words and ≤ 2 sentences, B1 ≤ 15 words and 1 sentence, B2 no cap (a one-word exclamation is no sentence). | advisory (minor findings; the §15 example dictates 19–29-word lines) |
| a2.2 r2 F07 / r3 F04, b1.1 r2 F05 | ITM-07 | A dictation containing a digit or number word carries `exact: "number"` (whole-sentence mode); any other `exact` is a finding. | blocker |
| a2.2 r1 F02, r2 F02, r3 F03 | GRM-05, ITM-11 (`lib-validate/claims.mjs`) | A rule card (de, en, and its own table for a pronoun-only claim) or an item explanation never pairs a form with „ohne X / kein -X / no -X / without -X" when the form ends in X („du wirst und er wird – ohne d"). | blocker |
| a2.2 r3 F01 | LEX-05 | Every message names the file whose owner acts; lexicon.json, specs.json and the unit spec are compared, and where two agree the third is named. | (message) |
| a2.2 r2 F01 | LEX-05 | A lemma the spec lists as new that another level allocates: an earlier level's lemma is a review word (unit author removes it); a promotion to this unit (`promotions`, now read by the context) is fine. | blocker |
| a2.2 r2 F01 / r3 F01 | LEX-07 (`lib-validate/ceiling.mjs`) | A lexicon `example` stays under the grammar ceiling of the entry's unit (GRM-04's detectors, receptive licensing, exact detectors only): „Der Weg geht immer am Fluss entlang." at a2.2-u04 blocks. | blocker, owner: lexicon |
| task item 5; a1.2 r1 F27, a2.2 r2 F16 / r3 F11, b1.1 r1 F17 | detector engine | sein + a lexicalised state is no Zustandspassiv and no Perfekt: `LEXICALISED_STATES` = enthalten, geöffnet, geschlossen, verheiratet, geschieden, verletzt, gebrochen („im Preis enthalten"), and a participle with its own ADJ lexicon entry („beschädigt"); `participleAux: 'any'` now needs the verb's own auxiliary (the exact det.perfekt-trennbar-untrennbar blocked „ist … enthalten"); a conjunct with its own auxiliary is its own clause („ist ausgerutscht und hat sich … verletzt"). | (fewer false hits) |
| a2.1 r1/r2 F11, a2.2 r1 F09, b1.1 r1 F17, b1.2 r1 F26, a1.1 r1 F24 / r2 F11 | detector engine, `DETECTOR_OVERLAYS` | Registry detectors get review-driven spec additions until `detectors.json` carries them: det.konjunktiv1 not before „ich" („Am Samstag arbeite ich"); det.modalpartikeln not in „noch mal", „mal wieder"; det.adjektiv-endung-nullartikel skips determiners („für eine Wohnung", „auf unser Boot"); det.adjektiv-endung-unbestimmt / det.unbestimmter-artikel skip „ein bisschen/paar/wenig". Engine: a ^-anchored pattern reads behind an opening quote (b1.1 r1 F08: „„Wer …, soll …"" hits det.relativsatz-wer); a number opens no imperative („300 Gramm, bitte."); a plural Präteritum form that is a known participle is the participle („Parken verboten!"), and a capitalised noun form of the lexicon is the noun („Sprachen: Deutsch …"). Pattern specs may now carry `notFollowedBy`, `notPrecededBy`, `skipWords`, `skipAlso`. | (fewer false hits) |
| orchestrator 2026-09-27 | GRM-04 (`spine.mjs exemptForms`) | The forms a licensed spine point lists in its label („…: kam, sagte, es gab (…)") are licensed whatever later detector matches them: g.praeteritum-kernverben (a2.2-u01) licenses kam/sagte/gab under det.praeteritum-vollverb (b1.1-u01); „ging" still blocks. | (fewer false hits) |
| a2.1 r2 F07 / F10, r3 F12 | GRM-04 | Strategy cards and rule-card prose are read as receptive text — advisory only, they name constructions as much as they use them. | advisory |
| a1.1 r1 F05 | GRM-04 | A declared chunk (`spec.grammar.chunk`) is presented in an input line or Redemittel, found by the point's detectors or its label forms. | blocker |
| a1.2 r1 F06 | GRM-02 | A chunk-only point is never a Lernschritt `structure` nor the point of its rule card. | blocker |
| a1.1 r1 F01/F12 | ITM-09 | A sentence-building item whose answer is a question says so in promptDe („Bilden Sie die Frage."). | blocker |
| a1.1 r1 F04, a1.2 r1 F12, a2.1 r3 F01, b1.2 r1 F10, b2.1 r1 F04, b2.2 r1 F15 | ITM-09 (`lib-validate/orders.mjs`) | The tile orders German allows are accepted: every frontable tile (PP, time/place or sentence adverb, time phrase, object NP) in the Vorfeld with the verb second and the subject after it; the subject-first order of an inverted answer; object pronoun before an adverbial (never the reverse); sentence adverb ↔ full-NP subject. Unless promptDe fixes the first tile („Beginnen Sie mit …"), which now also silences quality.js `missingFrontedOrder`. Items with a comma, a coordinator or subordinator tile, imperatives and questions are left alone. | blocker |
| b1.1 r1 F02 / r2 F01, b2.2 r1 F01, a1.1 r2 F04 | ITM-03 | Exam blocks: every 3-option item counts (cloze too); no three equal a/b/c keys in a row; with ≥ 3 number items the key is not always the extreme. | blocker |
| b2.1 r1 F01, b2.2 r1 F02, b1.1 r1 F02 | ITM-03 | Non-exam 3-option keys balanced ±1 per step and in the Check, runs ≤ 3 per item list, ≤ 50 % per position over the unit. | advisory (the player shows options in authored order; the §15 example and 5 of 8 units key every such item at options[0] — one seeded shuffle in the player settles it, §7 item 13) |
| a1.1 r1 F06 | ITM-01 | A practice, Check or proof choice item whose key (or its digits) stands in the stem while no distractor does. | blocker |
| a1.2 r1 F08, b2.2 r1 F12 | ITM-01 | A cue promptEn gives stands in promptDe: a relation („the polite form of können") as a cue — in brackets, after „von", before „→", a dash or a colon („der Kellner – die ___"); a quoted word as a word; „as a word", „starts with …". | blocker |
| a1.2 r1 F10 | ITM-01 | A typed gap keyed with an ordinal word says „Wort", accepts the digits, or carries `exact: "number"`. | blocker |
| b2.2 r1 F12 | ITM-01 | First letters with underscores show exactly the missing letters. | blocker |
| a2.2 r2 F04 | ITM-01 | A typed gap keyed with a preposition phrase or contraction („an der", „zum") has the preposition in promptDe, unless the gap follows a preposition („gegenüber ___"). | blocker |
| b1.1 r1 F05 / r2 F01, b1.2 r1 F12, b2.2 r1 F12, a2.1 r1 | ITM-01 | An open typed gap: a sentence adverb at the start blocks („___ habe ich keine Antwort bekommen." → Trotzdem); a noun or adjective gap without a German cue is advisory (the sentence may decide it; synonyms accepted or a defining prompt „…: Das ist eine ___." count as a cue). Practice, reserve and Check items only. | blocker / advisory |
| a2.1 r2 F02 | ITM-02 | A key „welche" beside a singular „eine/eins/einen" option needs a plural copula or a number ≥ 2 in the frame. | blocker |
| a2.2 r1 F03 / F05 | ITM-10 | A unit that accepts „zu der" in a gap accepts it in every correction whose answer has „zur" (all nine contractions); „gegenüber ___" keyed „vom …" accepts the bare dative. | blocker |
| a2.1 r1 | ITM-04 | A strategy card's example contains no key noun phrase of an item in its step (options every item offers — „richtig", „anderes Stockwerk" — and function words excepted). | blocker |
| a2.2 r1 F10, r2 F13, r3 F10 | EXM-01 | Where the template's source says the example uses up an option, a full block leaves options − items − 1 (+ 1 with a no-match item) unused. | advisory until SCHEMA's ExamBlock can carry `example` |
| a1.1 r2 F05 | EXM-03 | Word counts in taskDe and the checklist equal the band the player shows (wordBandLearning, else wordBand; a clause naming the exam compares with wordBand); the model text lies in the shown band (advisory when it fits the exam band). | blocker |
| b1.1 r2 F08 | EXM-03 | Leitpunkt cues: ≥ 4 letters or digits; not a connector the checklist already requires. | advisory (the §15 exemplar cues „am", „um"; the fix is whole-word matching in the pre-check) |
| a2.1 r1 | EXM-04 | ga2.sp1 cards: a keyword with „?" and no topic prefix (blocker); > 2 words or a Thema in situationDe (advisory — the §15 exemplar has both). | blocker / advisory |
| a2.2 r1 F07 | EXM-04 | Two calendars (stimulus + partnerData): same weekday, ≥ 5 timed entries each, exactly one common free window ≥ 90 min. | blocker |
| b1.1 r2 F02 | EXM-04 | tb1.m2: one quote on the learner's sheet; the partner's sheet in aiRole.personaDe. | blocker |
| b2.1 r1 F02, a2.1 r2 F05 | ALL-02 | A productive or interactive can-do proven by an item alone. | advisory (SCHEMA Check.proofs has no micro-output; the §15 example proves cd.a2.rueckruf-weitergeben by an item) |
| a1.1 r1 F07, a1.2 r1 F07, a2.1 r1 / r2 F04 | ALL-02 | The Aufgabe proving a can-do names a cue for each function verb of the can-do (fragen, vorschlagen, bewerten, beschweren …). | advisory (heuristic) |
| a2.1 r2 F05 | ALL-02 | A proof item's key is not the answer of a Check item. | blocker |
| a2.1 r3 F09 | ALL-02 | Every spec.textTypes entry is the type of an input, exam text or Teil template of the unit. | advisory |
| a2.1 r3 F10 | COV-3 | spec.lanes equals the unit's specs.json entry; the message routes to the curriculum owner (the unit file is authored). | blocker |
| a1.1 r1 F10, a1.2 r1 F26 | TXT-02 | The ±15 % is applied once: a template whose source says its textWords already carry it („Band ±15 %", 23 templates) is compared with textWords itself. | blocker |
| a1.2 r1 F02 | CON-06 | An exception names a source of its own (§, law, URL, „laut …"). | advisory until SCHEMA gives exceptions a source field |
| a1.1 r2 F07 | LEX-01 | story.cliffhanger is measured like an input. | advisory (minor; it teases the next unit's words; an `en` twin is the SCHEMA owner's alternative) |
| b1.2 r1 F01, b2.2 r1 F05 | LEX-01, LEX-03 (`lib-validate/compounds.mjs`) | A compound of two known forms (with a linking s/es/n/en/e) is known to LEX-01 and an advisory in LEX-03 („allocate compound:a+b"). §3.1a's rule stands: the lexicon still holds compounds. | advisory |
| a2.2 r1 F08, b1.2 r1 F09, b2.2 r1 F18 | LEX-02 | A lemma allocated to the unit that no authored German string uses, and a productive lemma no input shows. | blocker |
| a2.1 r2 F09 | LEX-03 | lex.articlePlural / lex.glossTyped sources are productive (or core) lemmas; a dictation line makes the learner spell none of the unit's receptive-only or off-list lemmas. | advisory (minor, one round; the fix is the source or a promotion; the §15 example dictates „Stau", „Buchhaltung") |
| a1.1 r1 F21 | LEX-07 | A plural token glossed in the singular („Kunden" → „customer"). | advisory |
| orchestrator 2026-09-27 | `lib-validate/text.mjs` | Tokens are Unicode letters: „Café", „Sprachcafé", „Repair-Café", „à la carte" are words (the old class cut „Café" into „Caf"). | — |

#### Second round: the a1.1-u04 rounds 4–5 (rule-smith 2026-09-27)

The deferred rail findings of `docs/course-v2/reviews/a1.1/a1.1-u04.r4.json` and `.r5.json` (BLUEPRINT §9.4: the
fifth round of a class is a rail, not a sixth round). Each has a passing and a failing test in
`tests/course-v2-validate.test.mjs` (blocks „rail fixes from the a1.1-u04 rounds 4–5" onward),
`tests/course-v2-schema.test.mjs` and `tests/course-v2-player.test.mjs`; every rule runs over every course
(`validate.mjs --all`).

| Review finding(s) | Rule | What it checks | Severity |
|---|---|---|---|
| a1.1 r5 F01 (major; = b2.2 r1 F14 / r2 F04, a2.2 r1 F05) | **ITM-01** | An `error_correction` item whose `errorTag`/`errorTags[0]` is `gender-article`, `case-np`, `case-pp` (article family), `v2-inv`, `verb-final`, `connector-position`, `satzklammer` (order family) or absent names the corrected category in promptDe outside the quoted sentence — „den Artikel", „die Endung", „das Pronomen" / „die Wortstellung", „die Position" / any of these or „die Verbform" — unless it accepts its alternative corrections, each with `acceptedWhy`. Other tags (`reflexive`, `register`, `adj-ending` …) are left alone. | blocker |
| a1.1 r5 F01 (orchestrator's addendum) | ITM-01 | Deleting the article is a correction too (u04 keys deletions under „Korrigieren Sie den Artikel"): when the key swaps one article for another and the article-less sentence is German by evidence — the noun is `singular-only`, a distinct plural, or the unit writes the same verb + bare noun („Wir brauchen Brot und Käse.") — the deletion is accepted with `acceptedWhy`, or the prompt asks for a category a deletion cannot satisfy („die Endung"). „Ich brauche Kilo Äpfel" has no evidence and stays unasked. | blocker |
| a1.1 r3 F05 / r4 F04 / r5 F03 (third round) | **LEX-01** | The surface walk (`lib-validate/metalanguage.mjs walkReadSurfaces`): items' promptDe, options, explanation.de; blocks' and speaking parts' instructionsDe; situationDe; writing taskDe, Leitpunkte, checklist; micro-output promptDe; title.canDo; step titles; endLines. A content word not known at the unit (allocated later — „Verkäufer" a1.2-u02 — or nowhere — „Markt" before its allocation) is glossed on that screen (Folge glosses → title.canDo, the step input's → its title, an exam block's texts → its instruction and items) or is instruction metalanguage: `INSTRUCTION_METALANGUAGE`, 128 forms in five groups (task verbs, the exam's parts, grammar terms, the course's own modes, the Sprechen topic labels), pinned ≤ 140 with a ban list of content words. Explanation notation („komm-st", „-en", „möcht-") is no word; a distractor's planted wrong form („Busfahrin", no lexicon entry, two edits from the key) is none either; an error correction's quoted sentence is not read. | blocker once the cumulative lexicon exists and the screen shows no English twin; advisory for item promptDe / explanation.de / micro-output promptDe (promptEn / explanation.en are on screen) and before the lexicon exists — so the SCHEMA §15 example (stub lexicon) reports advisories only and §15.6 holds for LEX-01 |
| a1.1 r4 F05 | **CON-06** | A unit with `facts: []` is no longer „skipped". It needs ≥ 1 fact or a `spec.deviation.reason` naming its Landeskunde when (a) its German texts state a country-wide rule („in Deutschland / Österreich / der Schweiz / D-A-CH" or „hierzulande" + a rule word, not a person's own account, not a question), or (b) its plan entry (`docs/course-v2/curriculum/<level>.json` `landeskunde`, read by `lib-validate/curriculum.mjs`; none for the §15 fixture tree) names a Landeskunde point. | (a) blocker at every status; (b) a warning while `draft`, a blocker from `review` on — every one of the 96 plan units names a point, and many are taught as a scene („Zusammen oder getrennt?"), which a reader judges |
| a1.1 r4 F02 | **LEX-03** | A `lex.glossTyped` source is productive, promoted or core (typing the word from its English gloss is recall). An authored `fill_blank` that brackets a receptive lemma and keys another form of it („(die Birne)" → „Birnen") is reported like `lex.articlePlural`. | glossTyped: blocker; the bracket items, articlePlural and dictation lines: advisory (recognition-spelling, the review's route (a)) |
| a1.1 r4 F08 / r5 F05 | **GRM-04**, detectors | Fixtures at a1.1-u04 raise nothing: „Dann möchten wir zwei Kilo Kartoffeln.", „Wie viele möchten Sie?" (`det.adjektiv-endung-nullartikel`: the möchte paradigm and the finite aux/modal forms are `skipWords`, a word before „Sie/Ihnen" is no adjective), „Was macht das zusammen?", „Das macht zusammen 7,80 Euro." (`det.trennbare-verben` `skipClause`; the engine no longer cuts a clause at a decimal comma or a time colon), „Lesen Sie zuerst die Frage." (a construction the spine licenses as a chunk at the position — `chunkFrom` ≤ here — is not reported at all; the run's notes count it). One instruction scope: strategy cards, instructionsDe, situationDe and title.canDo are all read, all as advisory metalanguage (through the LEX-01 walker). | (fewer false hits) / advisory |
| a1.1 r5 F05 | GRM-04, `det.genitiv-feminin-attribut` (new, heuristic, g.genitiv b1.1-u11) | Article + noun + „der" + noun („die Frage der Partnerin", „die Bitte der Partnerin") — reported on the German-only speaking instructions of a1.1 u05, u07, u08, u09 (and u12, u02's „am Empfang der Sprachschule"); „am Ende/Anfang der …" is a skip. | advisory |
| a1.1 r5 F04 (fourth round) | **GRM-05** | When the first unit of the level that uses a card declares a `spec.grammar.chunk` whose spine point is the `contrast` of the card's point, the card's de, table or model sentence shows one of the chunk's label forms (`g.akkusativ` „den, einen, keinen" on rc.artikel-genus-plural at a1.1-u04). Scoped to the spine's contrast pairs: rc.praesens owes the Sie-imperative chunk of u01 nothing. | blocker |
| a1.1 r5 F04 | GRM-04, `det.moechte-infinitiv` (new, exact, on g.koennen a1.1-u08) | A möchte form + an infinitive before the clause end (the Satzklammer), read on rule-card prose at the card's first use: the old rc.moechte „Ich möchte bezahlen." at a1.1-u04. The engine now lets an infinitive the lexicon knows beat the participle SHAPE („bezahlen", „verstehen"); `notFinal` lists words that never close the bracket („einen", „morgen"). | exact (blocks production and inputs before u08); on card prose advisory, like all metalanguage |
| a1.1 r5 F03 | SCHEMA §8 `Start.folge.glosses` (new, optional, stage S), `StartView` | `folge.glosses: [{ token, gloss: EnText }]{0..3}` — a word the Folge uses before its unit glosses it; StartView hands them to the InputView that renders the Folge (it passed `[]`), LEX-01 counts them for the Folge and title.canDo, the compiler keeps them. | schema |
| a1.1 r4 F01 residual | `grammar-spine.json` — **not changed** | `g.muessen-duerfen-man` keeps `chunkFrom` a1.1-u08. The spine allows one `chunkFrom` per unit (spine.md §2, GRM-01 counts it with the unit's declared chunk), and a1.1-u02 already is `g.wortbildung-er-in`'s; a second would fail GRM-01 on u02. The spine's own remedy for „Wie schreibt man das?" is its D21 Redemittel whitelist, now folded into `detectors.json`: `det.man` („wie schreibt man das", „wie sagt man", „wie spricht man"), `det.akkusativ-pronomen-ihn`, `det.reflexiv-pronomen`, `det.dativ-pronomen` (the four D21 rows). | — |
| a1.1 r5 F05, unit part (u05, u07, u08, u09) | — | Not edited here (unit files); the genitive instructions are GRM-04 advisories on those units for their fixers. | — |

### 3.1c The a1.1 unit reviews u01–u12 (rule-smith 2026-09-28)

The deferred rail items of the twelve a1.1 unit reviews (r1–r3 each; `rails.txt`, `wf26-rails.txt`,
`a11-code-deferred.md`: 206 items, deduplicated into the rows below). The class rule of CLAUDE.md holds — a finding
class is closed with a rule and a test, never with a list of ids. **Severity:** a blocker only where a learner is
graded wrong or shown wrong German; every other rail is a ratchet (a count that may only go down) or an advisory.
The new checks have a passing and a failing fixture in `tests/course-v2-validate-rails3.test.mjs` (101 tests; at the
helper level where a check is a pure function — `answerClassCue`, `baselineSolver`, `learnerTurnGaps`,
`suffixClaims` …), the false-positive rows are pinned by their fixture sentences there and by the existing suites;
every rule runs over every course (`validate.mjs --all`). The a1.1 counts are those of the run that closed this round (content was being
edited at the same time; see the handback for the unit fix list).

**False positives closed** (no new severity):

| Review finding(s) | Where | What changed |
|---|---|---|
| u01 r1/r2, u03 r2, u05 r1 (GRM-04, the largest class: 171 → ~45 unit advisories) | GRM-04, `metalanguage.mjs` | The can-do frame („Sie können …", „Ich kann …") on title.canDo, endLines and Lernziele is not the modal it names, and the object clause of an indirect/ob frame after „fragen, …" is not the construction either; the Teil template's own wording, the learner-address „Ihr-/Ihnen", a hit whose content words are all metalanguage, a one-token formula in a prompt or option and a lexicon chunk (a reflexive or separable lemma of the lexicon) are exempt and counted as `instructionSuppressed`. Choice keys are read receptively. A `reportOn: 'chosen'` detector reads only what the learner chooses (the gap filled with the key; an error correction's quoted source is never the hit). Multi-word lemmas allocated by the position license their hits on every surface. Lernziele are reported once, on the can-do registry (`learnerDe`). File mode reads the prose of the rule cards the unit shows first. |
| u01 r2, u02 r1/r3, u05 r2, u07 r2 (LEX-01/03) | `lexicon.mjs`, `compounds.mjs`, LEX-01, LEX-03 | An apostrophe phrase contributes its parts („Wie geht's" → geht); the cast's `languages` are known; `pluralVariants` (SCHEMA §6) are noun forms; the lexicon outranks the core floor for ordinals and taught adverbs (erste, früher, samstags … before their allocation); „willkommen" is no will+kommen (a finite aux/modal is never a compound's left part); a spelled letter chain is letters; the file's extras are known in production; multi-word glosses gloss each word; `zwo` is a number word. |
| u02–u06 (detectors) | `detectors.mjs` | `notVerbForm` (a lexicon infinitive is no adjective), `notAfterNumber` (ordinals), `notAfterIhrVerb` — narrowed on the registry handoff to 2nd-plural forms that are never 3rd singular (`IHR_ONLY_VERBS`: „Habt ihr Zeit?" skips, „Sie sucht ihr Handy." hits) —, a separable bracket needs a lexicon verb with a matching finite form for an adverb particle („zusammen", „weiter"), the imperative clause skips option pairs, labels and unknown or capitalised first words, a W-word before a quotation opens no clause, `lexicalNouns` (Name at A1.1), `verabredet` a lexicalised state. The list overlays folded into `detectors.json` were deleted; only scalar fields remain in `DETECTOR_OVERLAYS` (see openIssues for the registry). |
| u02 r2 F01 / r3 F08, u06 r1 F10 | `orders.mjs` | `constituents()` chunks a key into tiles („um elf Uhr", „zwei Kilo Äpfel", „zu" + infinitive is no phrase); `indefLast` owes a clause-final ein-/kein- object after a time/place adverb its swap; a fronted negated object („Keine Antwort habe ich …") is not owed (contrastive only); `tilesBuildKey()`. |

**New checks:**

| Review finding(s) | Rule | What it checks | Severity (a1.1 now) |
|---|---|---|---|
| u02 r2 F01 / r3 F08; SCHEMA §3.1 `tiles` (registry handoff) | **ITM-01** / **ITM-09** | An order-family error correction accepts every order the enumerator derives from its key — from its authored `tiles` (ITM-09) or, without them, the chunker (ITM-01) — unless promptDe fixes position 1. Tiles that do not build the key: advisory. | blocker (0); other levels: b1.2-u04 ls1-p10, ls1-p11, ls3-p11, b2.2-u04 ls1-p11 |
| u12 r1 F02 | ITM-01 | `perfekt-aux-participle` joins the tag families whose correction names the category („haben oder sein?", „Hilfsverb") or accepts its alternatives. | blocker (0); other levels: a2.2-u04 ls3-p10; b2.1-u04 ls3-p09, ls3-p10, ls3-r05, ls3-r06, c05 |
| u01 r1 F04 | ITM-01 | promptEn restricting a typed gap's answer class („the city", „(country)") is carried by promptDe; a name class is advisory. | blocker (0) |
| u04 r2 F03, u05 r2 | ITM-01 | A plural-determiner cue on a same-form-plural noun; an error correction whose fix is a same-form plural. | blocker (0) |
| u06 r1 F01; u06/u09 r1 F07; u11 r2 F02; u11 r3 F03; u12 r2 F03 | ITM-01 | „Verneinung" names a category; a gist key standing in the step/input title; an explanation quoting a later item's key; a bracketed cue that IS the key; structured distractors all of the other polarity; a tense stimulus and question sharing the time word; the calque „Was spricht …?". | advisory (39) |
| u08 r3 F05, u09 r3 F04, u10 r1, u12 r2 F05/F07 | **ITM-02** | The no-German baseline solver (key echo = unique maximum overlap with the quoted stem; polarity/function first word; a long coordinated option; a count list); a gist/detail distractor whose content noun or participle the step's input never says. | ratchet on proof items (1: u10 q01), else advisory (68) |
| u11 r3 F04 | **ITM-04** | A proper name (cast, extras, names.json) in an exam R/F statement occurs in its text. | advisory (0) |
| u05 r3 | **ITM-06** | A double-plural noun (`DOUBLE_PLURALS`: Balkone/Balkons …) drilled by lex.articlePlural lists both plurals (`pluralVariants`), and a typed key accepts both. | blocker (0) |
| u01 r1 F05; u07 r1 F03 | **ITM-07** | A level or room code (`IDENTIFIER_RE`) takes exact „name". A typed exact-number clock hour 1–12 accepts the hour + 12 unless the item, its input or a written-digit time places it before noon. | identifiers: blocker (0); an evening hour by the item's own words: blocker (0); undecided: ratchet (3: u07 ls1-i03, ls3-i03, u11 ls2-i04) |
| u03 r1 F02 | ITM-09 | A Ja/Nein-Frage key names the verb position in promptDe. | advisory (11) |
| u02 r2, coordinator (SCHEMA form `acceptedWhy`) | **ITM-10** | Form fields: `acceptedWhy` explains accepted forms (blocker); > 12 accepted forms (advisory); an explanation's „‚X' oder ‚Y'" is accepted (advisory). | blocker (0) |
| u11 r2 F07 | **ITM-11** | A quotation after „X sagt/schreibt/fragt:" in an explanation is in the step's text, the item's stimulus or (outside a step input) any line of the unit, `say` included; „…" marks a cut. | advisory (0) |
| u01 r1 F15 / r2 F11, u03 r3 F04, u06 r2 F05; ErrorTag `verb-ending`/`negation` | **ITM-12** (new) | A point introduced productively has a tagged reserve item on it; every reserve item and error correction carries a tag; register tags where the frame prints the pronoun; „nicht oder kein" without `negation`. | ratchet (85), advisory (6) |
| u03 r2 F01 / r3 F01; u08 r1 F03 / r2 F03 (the ITM-14 proposal folded here); the coordinator's typed verb-form class | **ITM-13** | The player's own checkItem grades an unchanged error-correction source WRONG (blocker); a typed gap's person-ending twin, unchanged stem vowel or possessive swap WRONG (ratchet: the checker forgives them, STRICT_TOPIC does not match v2 ids); a Duden doublet (gern/gerne, okay/OK, tschüss/tschüs) of a typed key CORRECT (WRONG: blocker; TYPO: ratchet; a dictation may be TYPO). | blocker (0); ratchet (9: the possessive swaps of u03/u06) |
| u02 r1 F16 / r2 F09 / r3 F08, u08 r1 F02, u09 r1 F08 | **CON-01** (new) | Phone, street address and age as the cast bible (`contact.phone`, `contact.addresses` by from/until, age + band offset); an extra's surname a cast surname; one voice for two speakers; a speaking cast id missing from `spec.cast`. | ratchet (0), advisory (6) |
| u02 r1 F07 / r2 F08 / r3 F07, u06 r3 F05, u11 r2 F06 | **TXT-01** (new) | Texts: a sentence over `maxWords`, the mean over `meanWordsMax`, subordinate clauses over the limit (ratchet). Metalanguage (instructions, situations, canDo, Lernziele — reported once on the registry —, endLines, explanations, rule-card prose at first use): subordinate clauses (ratchet), > 1.5 × maxWords (advisory). Exam-text sentences over maxWords (advisory). | ratchet (8), advisory (12) |
| u04 r1 | **TXT-02** | A template measured „per ad" is measured per ad. | (fewer false blockers) |
| u03 r2 | **TXT-03** | A micro-output's words/seconds inside the level profile band, unless named in `deviation.reason`. | advisory (1) |
| u05 r2 | **TXT-04** | A Sie form in the line a du-register prompt hands the learner. | advisory (0) |
| coordinator (TeilTemplate `speakers`); u09 r2 F04 | **EXM-01** | Distinct voices per text = the template's `speakers`; a pictorial Teil's text-variant option the text never mentions. | advisory (0) |
| u02 r2; u10 r1 F17; u11 r2 F05 | **EXM-03** | exact „name" on a form answer mixing words and digits; a 1st-person verb cue without its 3rd person; a cue inside the Anrede/Gruß every draft carries. | advisory (6) |
| u01 r1/r2; u10 r2 F05 | **EXM-04** | A performance criterion (its label an infinitive) the part never asks for: blocker (at a shortened length only the criteria the grader still scores there — §3.1d); a bare question offered for the cards-request Teil. | blocker (0), advisory (4) |
| u01 r1 F06, u03 r2 F07; u06 r2 F06; u10 r1 F08 / r2 F02 / r3 F02; u11 r2 F01 / r3 F01; u12 r2 F03 / F10 / r3 F06; u08 r2 F07 | **GRM-05** | Unquoted cited forms; a drilled form no label or card shows (advisory). At the card's first unit: „Wörter/Nomen auf -X sind der|die|das" against the known nouns in -X, an exhaustive „die anderen Verben haben haben" against the known sein-Perfekt verbs, a „Position N" column without N−1 or with „ich habe" under it (ratchet); the calque; an unconditioned „X steht nach dem Verb" while an item of the point accepts another place (advisory). | ratchet (0), advisory (15) |
| u08 r1 F08 | **GRM-02** | A point introduced productively is listed under `review` in ≥ 1 later unit spec of the band (silent while there is none). | advisory (3: g.kein, g.moegen, g.wollen) |
| u01–u12 (the produced-lemma class of eight units), u07 r2 F05 / r3 F06, u10 r2 F03 / r3 F04, u12 r2 F04 / r3 F03 | **LEX-03** | Typed recall of the unit's receptive word; a typed number word when every number lemma is receptive; a lemma PRODUCED (model sentence, Redemittel, learner cards and turns, hintWords, Leitpunkt cues and nouns, checklist, model text, micro-output model) that is receptive or allocated later; a bracketed cue's head word (first noun or verb; a feminine form → its masculine entry; a stem cue „wohn-") allocated later or nowhere; an authored dictation or dictation.fromInput line spelling a receptive-only lemma of the cumulative lexicon or a word not known yet. | ratchet (99: check/proof cues and the produced class), advisory (22) |
| u01 r3 F05b; u03 r1 F05; u08 r1 F05; u10 r2 F04 / r3 F05; u11 r2 F09 | **LEX-07** | An A-level example with a word not known at its unit (with or without exampleEn); a cast member named before their first unit or against the bible; „Herr/Frau X" not in the cast or names.json. | advisory (24) |
| u01 r1 F02, u02 r1 F03 / r2 F05, u05 r1 F03, u06 r1 F06; u07 r1 F02, u10 r1 F07; coordinator (`Check.proofs[].microOutput`) | **ALL-02** | A proof may name a micro-output (blocker if unresolved); an interaction can-do proven by an item alone with no spoken performance (ratchet); own data proven by a copied form, a rubric that scores no criterion for the function, an object noun no card names, the learner's own model turns that never ask/answer or never carry the can-do's „wie spät …?" (advisory). | ratchet (0), advisory (13) |
| u09 r1 F07 | **ALL-03** | A Prüfungsfokus Teil the plan's `examTeile` does not list is named in `deviation.reason` (sd1/ga2 lanes). | advisory (4) |
| u12 r3 F07 | LEX-01 | A separable lemma in split form („macht … mit") is looked up as the lemma and its allocation checked; the new read surfaces (recap, Folge title, Lernziele, Redemittel function, openingLine, hints, input titles, Aussprache focus, block titles, Fokus) are advisory. | advisory |
| coordinator (optional) | TXT-03 / walk | `MicroOutput.modelDe` is a production surface (LEX-03, TXT-01). | — |

Not built (see openIssues in the handback): a CON rule against a later unit's productive anchor on ≥ 3 earlier
surfaces (u07 r1 F01 — LEX-03's produced class covers the production half); ALL-02 textTypes as a hard finding
(u08 r1 F11 — nobody is graded wrong: stays advisory); the clock-time/Gleis agreement of a lexicon example with its
unit's text (u10 r2 F04b); ALL-03 grammar differences (plan prose against spine ids); the detector requests
(det.akkusativ-pronomen for mich/dich/uns/euch, „der Welt" in det.genitiv-feminin-attribut, a letzt-/nächst-/jed- time
noun detector) — `detectors.json` is the registry owner's.

### 3.1d The final A1.1 code pass (2026-09-28)

The deferred code items of the a1.1 cleanup (`phaseB-defers.txt`): each closed with a rule and a fixture pair in
`tests/course-v2-validate-rails3.test.mjs` (the rule rows), `tests/course-v2-player-check.test.mjs` (the checker and
„Das kann ich") or `tests/speaking-course-task.test.mjs` (the rounds).

| Deferral | Where | What changed |
|---|---|---|
| u01 (EXM-04) | EXM-04 | The part's length is honoured: its own `length` (the compiled form), else the unit's Prüfungsfokus entry (slot 'sprechen'). At 'reduced'/'mini' a criterion with `appliesIf: 'full'` is not scored (grade.mjs appliesTo) and needs no elicitation — the stale „no criteria subset" advisory on sd1-sp1 is gone; a criterion the grader still scores there and the part never asks for is the same blocker as at full length. „Stellen Sie sich vor" (the split imperative) elicits „vorstellen". |
| u01 (GRM-04) | GRM-04 | A `reportOn: 'chosen'` article is chosen only when the article token itself stands in the gap: „Indien ist ein ___." → „Land" types the noun after a printed article. An error correction's quoted sentence is compared case-free („Die Postleitzahl …" keeps „die Postleitzahl"). |
| u07, u03 (GRM-04) | GRM-04 | The can-do frame opens every sentence of a frame surface (title.canDo, endLines, Lernziele), „Und"/„Aber" before it included (`frameSpans`): a canDo split for TXT-01 into „Sie können … . Und Sie können …" is two frames. |
| u03, u08 (LEX-03) | LEX-03 | A promotion counts from its own unit on (`promotedAt`): lx.kellner, promoted at a1.1-u10, is receptive as a u03 Leitpunkt cue. This raised the a1.1 LEX-03 ratchets by 33 (u01 4, u02 3, u03 12, u04 3, u05 1, u07 8, u08 1, u09 1) — lemmas produced before their promotion; the lexicon owner moves each promotion to the first unit that produces the lemma, or the unit rewords. |
| u05 (LEX-03) | LEX-03 | A separable verb's bare finite form („steht", „macht", „bringt") is that verb only when its particle closes a clause after it in the same sentence (`particleCloses`); „Wo steht Ihr Schreibtisch?" and „steht auf Position 2" are the core verb. A Leitpunkt is read for its nouns only, and a sentence-initial imperative („Setzen Sie …") is no noun. |
| u07 (LEX-01) | LEX-01, `metalanguage.mjs` | A hint does not report what it glosses for its own item: its head words („die Praxis:", „samstags:" — `hintHeadWords`), the words of the item's stem and options, and an exam block's screen; an academic title inside a person's name („Frau Doktor Sommer", `nameTitles`) is part of the name. |
| u02 (ALL-02) | ALL-02 | A declared SpeakingPart move that names the can-do (its id's last segment or its `learnerDe` label: „nachfragen" for cd.a1.nachfragen) meets the rubric check — grade.mjs records the move as evidence. |
| u03, u09, u10, u11, SCHEMA (Check.proofs) | ALL-02, SCHEMA §8, `src/lib/course-v2/proofs.js`, CheckView | **Decided: an entry may name several proofs** (13 a1.1 entries pair a proof item with an Aufgabe). The can-do is shown when every named proof is; CheckView lists each with its own status (it used to read the item first and ignore the Aufgabe). A proof's `item` must be one of `check.proofItems` (blocker; 0 today) — only those are scored in the proof phase. |
| u02 (checker) | `src/lib/course-v2/checkItem.js` form_fill | A letter slip in a word the frame licenses (one edit from a licensed word of ≥ 5 letters, never from the label's other alternative) makes the entry a TYPO, never WRONG and never CORRECT: „Izmir, Turkei" as „Turkei" alone. „nur" is a frame word („nur online"). check.js is unchanged. |
| u08 (speaking test) | `tests/speaking-course-task.test.mjs` | The a11-u08-s fixture (Teil 1 + Teil 2 with its four Thema cards, each Teil on its own rubric), and a check that `A11_ROUNDS` is exactly the compiled a1.1 bank's multi-Teil entries. |

### 3.2 Not implemented yet, and why

| Rules | Why not (yet) |
|---|---|
| **SCH-01** | Not a validator rule: it is the checker (§2). |
| ALL-01, ALL-04, ALL-05, ALL-06 | Level/band structure and quota rules; need complete levels (course.json + 12 units) to be meaningful. Next after the first level reaches T. |
| GRM-03, GRM-06 | Inventory floors need the full A1/A2 allocation; warm-up interleaving needs S/I content across units. |
| LEX-06 | Needs the private `list_ref` table (`private/list-ref.json`), never committed. |
| TXT-01 (partly) | Built 2026-09-28 (§3.1c) as ratchets and advisories; the hard form waits until the metalanguage limits are calibrated against each level's own frames. |
| ITM-12 (partly) | The unit-local half is built (§3.1c); course-level repair-pool coverage (every tag of every level has a pool) needs every unit of a level at stage I. |
| AUD-01 … AUD-05 | Audio rules need `registries/voices.json` (speaker gender ↔ voice) and the audio run. The compiler already resolves every line's voice from the cast bible or the file's `extras`. |
| CON-02, CON-04, CON-05 | Story consistency across units; need S content across units. CON-01 (persona data, surnames, voices, `spec.cast`) is built (§3.1c). |
| AST-01, AST-02 | No unit uses images yet (the fixture's `assets` is empty). The checker already enforces the Asset shape (alt text, licence record, prompt when generated). |
| LNG-01 … LNG-04 | Need Hunspell / LanguageTool / spaCy tool chains; not installed (no new npm dependencies in this phase). |
| TIM-01 … TIM-05 | Time model not built; the compiler's `minutesPlanned` uses the level profile's design minutes per step kind. |
| SRS-01, SRS-02 | Review-load simulation; the compiler's `reviewMinutesByPace` is a labelled upper-bound estimate until then. |
| COV-2, COV-6, COV-7, EXM-09 | .2 / multi-lane coverage; lean execution runs one lane per band, and COV-6 applies only to secondary lanes (deferred). |
| EXM-05, EXM-06, EXM-10 | Mock forms, Plateau/Halbtest inventory, DTB/DTZ: no v2 Plateau, closing or Modelltest files yet (.2 courses reuse `src/data/mockExams/*`). |
| EXM-07, EXM-08, PRG-01, PRG-02 | Code rules, pinned by tests instead: `tests/course-v2-ai.test.mjs` (EXM-08 zero/cap rules), `tests/course-v2-completion.test.mjs` (PRG-02 one completion function). |
| QA-FRESH-01, SOL-01…03, CAL-01/02, LGL-05 | Model-calling and calibration gates (BLUEPRINT §9.2): **deferred** in lean execution. No `qa/` or `anchors/` files are written; the checker still validates their shape if one appears. |
| LGL-01 … LGL-10 | Claims/legal lints over learner-visible strings: owned by the claims/copy tests, not the content validator. |
| Review proposals not built (2026-09-27) | a1.1 r1 F23 (ErrorTag `null-article`), a2.1 r2 F05 (Check.proofs `microOutput`), a1.2 r1 F02 (`exceptions[].source`), a2.2 r3 F10 (`ExamBlock.example`): **SCHEMA fields** — the rails turn advisory → blocker once they exist (§3.1b). a2.1 r1 (ITM-02 hypernym distractors), a1.1 r1 F05 second half (a nominative rule on an accusative gap), a1.1 r2 F06 (LS4 texts contradicting the story), a2.2 r1 F08 first half (the plan's „not taught here" is prose): **semantics** — solver/reviewer gates. a2.1 r1 LGL-05 (n-grams against official instructions): the official strings are not in the repo; LGL is the claims tests'. a2.1 r2 F07 (a det.dat-akk-stellung detector) and a2.2 r2 F16 positive recall of det.adjektiv-endung-nullartikel („über Hügel und steile Wege"): **detectors.json** — for its owner. a2.2 r2 F03 (V2 orders inside „und" conjuncts), b1.1 r1 F06 (connector correction variants): clause combinations need a parser; ITM-09 leaves such items alone and says so. b1.1 r2 F02 runtime half (buildCoursePartnerPrompt, SpeakingTaskView) and b1.1 r2 F07 (prep timer, word counter): player/function code, not rails. b1.1 r2 F11 alternative (a `LINE#n` sentence selector for dictation.fromInput): needs SCHEMA, REF-01 and compiler support. a1.2 r1 F15 (the ordinal card must list erste/dritte/siebte/achte): one card's content. a2.1 r3 F02 (a review may not close a class until its rule and fixture exist): a review-process rule — this section and §3.1b are its ledger. |

---

## 4. The compiler — `scripts/course-v2/compile.mjs` (orchestrator only)

```
node scripts/course-v2/compile.mjs <level|--all> [--check] [--content <dir>] [--out <dir>] [--banks-out <dir>]
                                    [--fixture] [--no-refs]
```

- **Builds a level from the units that exist** (partial levels, 2026-09-27). Every level lists 12 units in
  `course.json`; the compiler writes what is there:
  - a unit `course.json` lists but **no file holds yet** is a manifest row with `status: "coming"`, `chunk: null`,
    `counts: null` — title, can-do title, can-dos, grammar, Prüfungsfokus and planned minutes come from the level's
    `specs.json` bundle (the curriculum agents' array, read here only as syllabus input; without an entry the row
    carries only what `course.json` knows: id, nr, Etappe);
  - a unit whose **own check fails** (SCH-01/REF-01/KEY-01 on the unit file or one of its lane packs, or a unit file
    that is not even JSON) is **skipped**: its errors are printed (`skipped <unit> (<file>): N check error(s)` plus the
    first five), nothing of it is written — no chunk (a stale one is deleted), no bank entry, audio line or reserve
    item — and its row is `coming`. A skip alone exits 0;
  - **references to a planned-but-missing unit** (`ref(unit)`, and step/item/line/text/asset/fact/fokus/bank ids
    under it) resolve **in compile mode only** — the grammar spine, the casts, the lexicons and `course.json` name all
    96 units. `check.mjs` and the validator keep REF-01 exactly as it is;
  - **ids of a unit that is not compiled in a run stay live** in the ledger (carried from the previous ledger): only
    a unit that compiles can tombstone its removed ids, so a unit that fails its check for a while loses nothing and
    can come back with the same ids.
- **Still refuses the level** (nothing written, exit 1) on an error in any other file of the level (`course.json`,
  `lexicon.json`, `rule-cards.json`, Plateau/closing files) or in a shared registry, and on the compile-stage integrity
  errors: ID-01 duplicates and reuse of a tombstoned id, KEY-01 foreign prefix and duplicate bank keys. With `--all`,
  an error in a shared registry is printed once, not once per level.
- **Deterministic and idempotent.** No clock, environment or network; the same content gives the same bytes.
  `--check` writes nothing and exits 1 when an output would change (the CI drift guard). **Outputs are minified**
  (one line of JSON per file, keys in the compiler's fixed order): the authored content stays readable, the build
  output does not need to be, and an unchanged unit gives a byte-identical file.
- **Only units at stage `T` are compiled into playable chunks.** Earlier stages get a syllabus row (title, can-dos,
  grammar, Prüfungsfokus, planned minutes, their authoring `status` and `stage`) and `chunk: null`.
- One summary line per level: `course-v2 compile a1.1: 12 units: compiled u04; 11 coming; 7 output(s), 7 changed`.
- Outputs per level (JSON in v0; SCHEMA §13 names some of them `.js` — the JS twins are the E1/W5 owners' step):

| Output | Content |
|---|---|
| `src/data/course-v2/<level>/units/uNN.json` | the unit chunk: learner-invisible fields stripped (`origin`, `acceptedWhy`, `reviewerConfirmed`, `lehrwerk`, `fokusPlan`, fact `notes`, `stage` …), **reserves removed**, generated ids for generator specs (`STEP-gNN`), estimated line seconds, `poolItems` in the live `lessonPools` shape, `minutesPlanned`, `reviewCards`, `contentHash` |
| `…/<level>/reserve.json` | the reserve index: every reserve item in the pool shape with `unit`, `step`, `errorTags`, `banks`, indexed by unit, topic and error tag (requeue, `earlierDraw`, Plateau review, Mehr üben, repair cards) |
| `…/<level>/manifest.json` | syllabus rows for all 12 units (compiled, syllabus-only or `coming`) + course fields (lanes, Etappen, closing, completion, review, pace, targets) + counts (`unitsAuthored`, `unitsComing`, content totals of the authored units) |
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
  validator reports two blockers: **CON-06** (fact `a2.1-u07-f01` is `verification: "partial"`) — the failure
  SCHEMA §15.6 plans; it blocks because the fixture unit is `status: "review"`, and the same fact in a `draft` unit is
  a warning (§3.1a) — and, since the rail of 2026-09-27, **ITM-01** on `a2.1-u07-ls3-p10` (a verb-final error
  correction whose German prompt is a bare „Korrigieren Sie:", §3.1b). §15.6 carries that row; with the prompt
  „Korrigieren Sie die Wortstellung: …" CON-06 is again the only blocker (the tests pin both states).

---

## 6. Tests

| File | Covers |
|---|---|
| `tests/course-v2-schema.test.mjs` | fixture verbatim; SCH-01/REF-01/KEY-01 on the fixture; the §8.1 stage schema (strip to each stage, absent/required per role); §15.4 lane pack and §15.7 choice fixtures in memory; 30+ mutations each failing at the expected path/rule/message; the amended text-type shape; the real `text-types.json` and `lanes/*.json` pass SCH-01/REF-01 (delivery, instructions ≤ 200 characters naming the play count, the four pictorial Teile of BLUEPRINT §4.9 with their text variants); `BANK_KEY_RE` matrix (47,520 keys) and garbage; compiler determinism, idempotency, §15.5 equality, reserve index, ledger tombstones, refusal; both CLIs |
| `tests/course-v2-compile.test.mjs` | partial levels: 1 of 12 units compiles while the checker still reports REF-01; a missing unit is a `coming` row filled from `specs.json`; a unit failing its check (or not JSON) is skipped with its errors, writes nothing and keeps its ledger ids; another level's broken file is ignored; an error outside the units refuses the level; determinism, idempotency, minified output; `unitOfId`; the CLI's skip line and exit 0 |
| `tests/course-v2-validate.test.mjs` | every validator rule with a passing and a failing fixture (parsed from SCHEMA.md); §15.6 expectations (incl. the ITM-01 row and its fix); the a1.1-u04 r4–r5 rails (ITM-01 categories and article deletion, the LEX-01 surface walk and its allowlist, CON-06 without facts, LEX-03 glossTyped, the a1.1-u04 detector fixtures, the instruction scope, det.genitiv-feminin-attribut, det.moechte-infinitiv on card prose, GRM-05 chunk forms); stage gates incl. the spec inference and COV-1's stage-T severity; detectors' own examples; the §3.1a morphology, core list (size, bans, precedence), licensed forms and LEX-03 on a complete synthetic lexicon; LEX-07 duplicates vs homographs; CON-06 draft warnings; UnitSpec `lexiconBlocks` `{6..20}`; CLI; every §3.1b rail with its review fixture (the detector review sentences also against the real spine and detectors) |
| `tests/course-v2-validate-rails3.test.mjs` | the §3.1c rails of the a1.1 unit reviews u01–u12: one failing and one passing synthetic fixture each (the detector narrowing, the chunker and authored tiles, compounds and metalanguage, the lexicon's precedence; ITM-01 answer class, cue = key, polarity, tense time word, the aux family; ITM-02 key echo and input distractors; ITM-04 names; ITM-06 double plurals; ITM-07 identifiers and clock hours; ITM-09 tiles on an error correction; ITM-10 form acceptedWhy; ITM-11 quotations; ITM-12 repair pools; ITM-13 wrong forms and doublets; CON-01; TXT-01/02/03/04; EXM-01/03/04; GRM-02/04/05; LEX-01/03/07 incl. `pluralVariants`; ALL-02 micro-output proofs and learner turns; ALL-03) |
| `tests/check-answer.test.mjs`, `tests/course-v2-player.test.mjs` | the answer checker's ellipsis and number-word folds (live and v2), `exact: 'number'` on dictations and fill-ins (the a2.2-u04 c07 / a1.2-u04 c08 fixtures, „neun"/„nuen"/„zehn" against „9"), the generator's `exact` |
| `tests/course-v2-ai.test.mjs`, `…-entitlement…`, `…-completion…` | the graders and speaking functions read the compiled banks; entitlement; the one completion function — incl. the SCHEMA §5 `CLOSING` of both kinds, the learner's lane, the Diagnose never counting, form tasks, and every authored `course.json` and compiled manifest |

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
9. **`text-types.json` — the schema module followed the registry; SCHEMA §4.7 amended (2026-09-27, rails).** 422
   errors „expected [int, int], got object" on `lengthByLevel` and 1 „unknown key notes". The registry is right: the
   W2 DaF-progression review (major, `docs/course-v2/reviews/w2/daf-progression.json`) found that one band per level
   mixed course inputs, exam texts and learner writing and exceeded the TXT-03 caps, and prescribed the fix — split
   each band into `{ input, writing? }`, cap `input` at TXT-03, leave exam lengths to the Teil templates, and document
   the semantics „in the file's notes and in SCHEMA §4.7". The level-profile owner did the file half; the SCHEMA
   line and `lib/schemas/text-types.mjs` had not followed. Now: `lengthByLevel: { [level]: { input: [int, int],
   writing: [int, int]? } }` (0 ≤ min ≤ max, unknown keys rejected) and an optional top-level `notes: [str]`. No
   code reads `lengthByLevel` yet. No text-type id changed.
10. **`lanes/{sd1,ga2,tb2}.json` — the registries were wrong and were completed (2026-09-27, rails).** 134 errors in
    four classes, all fields SCHEMA §4.3 requires and `tb1.json` and the §15.1 excerpt already carry; no id was renamed
    or removed, no existing value changed:
    - **`delivery` missing** (3): `both` for all three — Goethe A1 and A2 run on paper and on a centre laptop / online
      (DB-A1/DB-A2 Anhang, memo 01 §1, §3; the §15.1 ga2 excerpt says `both`), telc A1 is paper only (so sd1 is
      `both`, and BLUEPRINT §2.3 hides the word counter unless the learner says the exam is on a computer), telc B2 is
      digital, hybrid and paper (memo 03; the tb2 owner had recorded `both` in `openQuestions` „Schema-Nachzug").
    - **`pictorial` missing** (36 Teile): `true` exactly for the Teile BLUEPRINT §4.9 names — `sd1.h1` (MC with
      pictures), `sd1.sp3` (picture cards), `ga2.h2` (days → pictures a–i), `ga2.h3` (MC with pictures) — each with a
      `textVariantDe` for the .1 text variant; `false` for the rest (memo 01 §1, §3 tables; the A1.1/A2.1 unit authors
      already run `sd1.h1`/`ga2.h3` scaffolded for this reason). Consequence, reported: `a1.2-u04` runs `sd1.h1`
      unscaffolded without approved images, which EXM-02 blocks in a .2 course (§4.9: the lane waits for images).
    - **`instructionsDe` + `paraphraseOf` missing** (36 Teile): our own paraphrase of each Teil's instruction (Sie,
      ≤ 200 characters, naming the play count for every Hören Teil as EXM-01 reads it), deliberately restructured
      against the official wording (checked against the US-A1, US-A2 and UT-B2 texts, LGL-05); `paraphraseOf` names
      document and printed page (US-A1 pp. 6–29, US-A2 S. 6–27, UT-B2 S. 6–24).
    - **`scaffold` missing** (23 receptive Teile with a non-empty `scaffoldAllowedIn`): `minItems` 3 (2 for the
      4-item `sd1.h2`, 5 for 10-item Teile), `playsFixed`/`optionsFixed` true, `textWords` = the full band where each
      text of a set stays full length (per-text Teile), a lower minimum only where one long text may be shortened for
      a reduced block (≈ ⅔–½ of the official minimum, as `tb1`), and shorter A1.1 texts for `sd1` (a1.1 only).
    - With the same edit, the tb2 owner's recorded target values for `tb2.m1` became data: `prepAtHome: true`,
      `speaking: { stimulus: 'topicChoice', topicChoice: { from: 7, pick: 1 } }` (UT-B2 S. 22, 33; HB-B2 S. 43).
    - Not changed, for the lane owners: `ga2.l4`/`ga2.h2` and `tb2.lv1`/`lv3`/`sb2` give their block-level choice set
      as `options` (6, 9, 10, 12, 15) where SCHEMA §4.3 names it `choices` (+ `choiceKind`); EXM-01 therefore checks no
      choice count on them. Not an SCH-01 error, so left as authored.
11. **Compile mode resolves references to planned-but-missing units** (§4); `check.mjs` and the validator do not.
12. **`completion.js` reads the revised SCHEMA §5** (2026-09-27, rails): `CLOSING` is `{ kind: 'halbtest', lane,
    status }` (.1) or `{ kind: 'modelltest', form, lane, status }` (.2); `lane: 'learner'` is the learner_goals lane
    (`state.lane`), falling back to the course's primary lane when unknown or not offered; the old `{ kind: 'closing' }`
    is rejected. `formAllFieldsNonEmpty` decides form tasks (`attempt.fields`). Defaults per kind:
    `DEFAULT_COMPLETION` (dot1), `DEFAULT_COMPLETION_DOT2`.
13. **Rail fixes the SCHEMA §15 worked example does not meet** (2026-09-27, rails, §3.1b): the example keys every
    non-exam MC at options[0] (ITM-03), cues „am"/„um" (EXM-03), gives ga2.sp1 a Thema and a three-word card
    (EXM-04), proves the interaction can-do cd.a2.rueckruf-weitergeben by an item (ALL-02), dictates 19–29-word lines
    with receptive words (ITM-13, LEX-03) and has an open adjective gap („Die Leitung ist ___." → besetzt, ITM-01).
    These rails are advisory, so their §15.6 rows still hold; `tests/course-v2-validate.test.mjs` pins that each of
    them reports no blocker on the example. One rail the example does NOT meet is a blocker, because its finding
    class is MAJOR on three levels (§3.1b, ITM-01, second round): `a2.1-u07-ls3-p10` says „Correct the word order."
    only in promptEn. §15.6 now carries that row (two blockers: ITM-01 and CON-06), and the SCHEMA owner's fix is
    (g) its promptDe „Korrigieren Sie die Wortstellung: „Wenn Sie melden sich …““, after which CON-06 is again the
    only one. For the SCHEMA owner to decide: (a) the player shuffles
    non-exam options with a seed (then ITM-03's non-exam balance goes), (b) `ExamBlock.example`, (c)
    `Check.proofs[].microOutput`, (d) `Fact.exceptions[].source`, (e) ErrorTag `null-article`, (f) whether the §15
    exemplar adopts the reviewed formats (Goethe A2 Sp1 cards without Thema, ≥ 4-letter cues, shorter dictations),
    (g) the ls3-p10 prompt above. The detector additions of `lib-validate/detectors.mjs DETECTOR_OVERLAYS` belong in `detectors.json`; its owner
    moves each entry there and deletes it from the overlay (a test fails on an overlay for a detector that does not
    exist).

## 8. Open issues at the time of writing (2026-09-27)

- ~~Lexicon errors LEX-07 reports~~ — **resolved 2026-09-27** (lexicon owner): `lx.helfen`/`lx.mitkommen` left
  a1.2 for `promotions`; the 77 b2.2 duplicates were removed (12 became `promotions`) and b2.2 refilled with 68 new
  lemmas; `Problem`, `Dank`, `offen` and `erklären` moved down to A1 (a1.1-u06, a1.2-u03, a1.1-u07, a1.2-u01).
  LEX-07 reports 0 blockers on all eight levels.
- ~~Place names~~ — **resolved 2026-09-27**: `registries/names.json` (SCHEMA §4.9, 57 names at the start), read by
  `lib-validate/lexicon.mjs` for LEX-01/LEX-03 (§3.1a) and checked by `lib/schemas/names.mjs`. A name a unit needs
  that is not listed is still unknown: the unit's author asks the lexicon owner to add it (proper part only).

- ~~`completion.js` lags the revised SCHEMA §5~~ — **resolved 2026-09-27** (§7 item 12); the completion test has no
  `todo` left. Stale notes elsewhere, for their owners: the `unitRules`/`safeCourseCompletion` comments in
  `src/lib/course-v2/homeModel.js` and E1-client.md §4 items 1–2 still describe the lag and the refusing compiler.
- ~~Real registries fail the revised schema~~ — **resolved 2026-09-27** for `text-types.json` and `lanes/*.json`
  (§7 items 9–10): `check.mjs --all` reports 0 SCH-01 errors in the registries. What remains under `registries/` is
  REF-01 by design: `grammar-spine.json` (and `casts/*.json`, the lexicons' `unit` fields, `course.json`) name units
  no file holds yet; they resolve as the units are written, and the compiler does not wait for them (§4).
- **All eight levels compile** (2026-09-27): each has its pilot `u04` at stage T as a chunk and 11 `coming` rows;
  `src/data/course-v2/<level>/` and `netlify/functions/_shared/course-v2/<level>.banks.json` are written, minified.
- **EXM-02 blocker from the pictorial flag:** `a1.2-u04` block `a1.2-u04-ls4-sd1-h1` runs the pictorial `sd1.h1` in a .2
  course without approved image assets (BLUEPRINT §4.9) — the A1.2 author swaps the Teil or the image pipeline
  delivers the pictures.
- **`content/course-v2/<level>/specs.json`** (curriculum agents' bundles) are arrays, not SCHEMA files: split them
  into `units/uNN.json` with `"stage": "spec"` (the compiler reads the bundle for `coming` rows until then). As spec units they already pass except `lexiconBlocks` (empty
  `lemmas` and an unknown `target` key, pending the lexicon allocation).
- LEX-02 counts 8 ratchet entries on the fixture where SCHEMA §15.6 says 7 (`Rückruf` also occurs once).
