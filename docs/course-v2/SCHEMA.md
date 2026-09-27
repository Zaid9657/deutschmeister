# Course v2 — SCHEMA (binding content data model)

**Date:** 2026-09-27 · **Status:** BINDING. Companion of [`BLUEPRINT.md`](BLUEPRINT.md); where the two differ on a data
question, this file wins; on a product or pedagogy question, the blueprint wins. · **Implements:** BLUEPRINT §2–§10.
**Implementation:** plain JSON content files authored by agents, a zero-dependency schema checker and a deterministic
compiler written in JavaScript (`scripts/course-v2/lib/`, `scripts/course-v2/compile.mjs`), JS/JSON runtime modules.
No TypeScript, no ajv/zod (no lockfile churn), **no new content tables** in Supabase.

---

## 0. Principles

1. **One file per unit** (`content/course-v2/<level>/units/uNN.json`), plus one file per unit and secondary lane
   (`uNN.lane-<lane>.json`), so agents author in parallel under the lease rule (BLUEPRINT §10.5). Registries, casts,
   lexicon and course files each have one owner.
2. **Content selects registry ids; it never invents them.** A unit may reference only can-dos, spine points, lemmas,
   Teil templates, rubric profiles, rule cards, cast members, text types and detectors that exist in their registries
   (REF-01).
3. **Stable hierarchical ids.** An edit that keeps an item's meaning keeps its id; a meaning change takes a new id and
   the old one is tombstoned in `ids.ledger.json` (ID-01). This keeps `review_cards` keys and learner history valid
   across re-authoring.
4. **Static text for everything a paid course explains** (BLUEPRINT §1.6 rule 4): every authored item carries its
   explanation as data.
5. **Authors write; the compiler derives.** Fields marked `// generated` (minutes, content hashes, word ids, card
   lists, counts for copy) are never typed by an author; the checker rejects them in authored files.
6. **German where the learner reads German**, English twins for explanations and glosses (`LText`), and room for an
   L1 layer (`tr`, `ar`) without touching German content.

## 1. Notation used in this file

The checker (`scripts/course-v2/lib/schema.mjs`) implements exactly this notation; the schemas below are transcribed
into JS objects in `scripts/course-v2/lib/schemas/*.mjs` by the E0-1 agent.

| Notation | Meaning |
|---|---|
| `str` / `str?` | non-empty string / optional field |
| `de`, `en` | non-empty German / English string (`de` fields go through LNG-01/02) |
| `LText` | `{ de: de, en: en, tr?: str, ar?: str }` |
| `EnText` | `{ en: en, tr?: str, ar?: str }` (glosses) |
| `int[a..b]`, `num`, `bool`, `date` (`YYYY-MM-DD`), `url` (https) | scalars |
| `enum(a\|b)` | one of the listed literals |
| `re(NAME)` | string matching the named regex of §2 |
| `ref(kind)` | an id that must resolve (REF-01) in: `cando`, `spine`, `lexicon`, `template`, `lane`, `rubric`, `rulecard`, `cast`, `texttype`, `detector`, `family`, `unit`, `item`, `line`, `fact`, `bank` |
| `[T]`, `[T]*`, `[T]{n}`, `[T]{a..b}` | non-empty array / possibly empty / exactly n / a to b items |
| `{…}` | object; **unknown keys are an error** |
| `T \| U` | union |
| `// generated` | written by the compiler only |

## 2. Identifiers

| Kind | Pattern (`re` name) | Example |
|---|---|---|
| level | `LEVEL = /^(a1\|a2\|b1\|b2)\.[12]$/` | `a2.1` |
| course prefix (bank keys) | `PREFIX = /^(a1[12]\|a2[12]\|b1[12]\|b2[12])$/` | `a21` |
| unit | `UNIT = /^(a1\|a2\|b1\|b2)\.[12]-u(0[1-9]\|1[0-2])$/` | `a2.1-u07` |
| Lernschritt | `STEP = UNIT + /-ls[1-8]/` | `a2.1-u07-ls3` |
| item | `STEP + /-(i\|s\|p\|x)\d{2}/` (input, structured, practice, perception) · `UNIT + /-(c\|q)\d{2}/` (check, proof) · `BLOCK + /-\d{2}/` (exam items) · `STEP + /-g\d{2}/` (generated, compiler-assigned) | `a2.1-u07-ls1-p06`, `a2.1-u07-c03`, `a2.1-u07-ls4-ga2-h1-02` |
| audio line | `(STEP\|UNIT-start\|BLOCK-tN) + /-l\d{2}/` | `a2.1-u07-ls1-l04` |
| exam block | `STEP + /-(sd1\|ga2\|ta2\|tb1\|dtz\|gb1\|tb2\|gb2\|oza1\|dtb2)-[a-z0-9]+$/` | `a2.1-u07-ls4-ga2-h1` |
| micro-output | `STEP + /-mo$/` | `a2.1-u07-ls1-mo` |
| Redemittel | `UNIT + /-rm\d{2}/` | `a2.1-u07-rm01` |
| fact · Fokus-Karte | `UNIT + /-f\d{2}/` · `UNIT + /-fk\d/` | `a2.1-u07-f01` |
| Plateau · Halbtest · Diagnose · Modelltest | `LEVEL + /-p[1-3]/` · `LEVEL + /-ht-<lane>/` · `LEVEL + /-dx-<lane>/` · `LEVEL + /-m[abc]-<lane>(-<module>)?/` | `a2.1-p2`, `b1.1-ht-tb1`, `b1.2-dx-dtz`, `b1.2-mb-gb1-lesen` |
| can-do | `/^cd\.(a1\|a2\|b1\|b2)\.[a-z0-9-]+$/` | `cd.a2.mailbox-verstehen` |
| spine point · rule card · detector · text type · family | `g.<slug>` · `rc.<slug>` · `det.<slug>` · `tt.<slug>` · `fam.<slug>` | `g.reflexiv-akk` |
| lemma | `/^lx\.[a-z0-9-]+$/` (ASCII-folded lemma; homographs `-2`) | `lx.sich-melden` |
| lane · Teil template | `sd1\|ga2\|ta2\|tb1\|dtz\|gb1\|tb2\|gb2\|oza1\|dtb2` · `<lane>.<teil>` | `ga2.h1`, `tb1.lv3`, `dtz.schreiben` |
| rubric profile | `<lane>-<teil>` or `course-micro`, `course-micro-sp` | `ga2-s2`, `tb1-sa` |
| cast member | `/^cast\.[a-z0-9-]+$/` | `cast.priya` |

**Bank keys** (writing bank, speaking bank, micro-outputs) — replaces the A-only `COURSE_TASK_KEY_RE` in
`netlify/functions/evaluate-writing.mjs`; the legacy pattern stays accepted for the live A1.1/A1.2:

```js
export const BANK_KEY_RE =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
export const LEGACY_COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/;
// allowance scope = first capture group + '-'  (e.g. 'a21-'); KEY-01 tests all 8 prefixes × every slot kind
```

| Example | Meaning |
|---|---|
| `a21-u07-w` | A2.1 unit 7, writing Aufgabe, primary lane |
| `a21-u07-w-ta2` | the same slot's telc A2 variant (a Spur task) |
| `a21-u07-s` | A2.1 unit 7, speaking Aufgabe |
| `a21-u07-mo1` | micro-output of LS1 |
| `b12-p2-w-dtz` | B1.2 Plateau 2, writing part, DTZ lane |
| `a22-ma-w1-ga2` | A2.2 Modelltest form A, Schreiben Teil 1, Goethe A2 |

**Learner-state ids.** `lesson_progress.lektion_id` = the unit id (`a2.1-u07`), Plateau id (`a2.1-p2`), closing id
(`a2.1-ht-ga2`, `a2.2-dx-ga2`) or Modelltest form id (`a2.2-ma-ga2`). The live course uses `a1.1-lNN`/`a1.1-cpN`;
the `-u` / `-p` scheme cannot collide with it. **Review card keys:** `word:<lexiconId>`,
`pattern:<spineId>:<unitId>`, `sentence:<itemId|redemittelId>`, `teil:<templateId>`,
`repair:<errorTag>:<ruleCardId>`.

## 3. Common types

### 3.1 Item (shared by every item kind)

```js
Item = {
  id: re(item),
  type: enum(fill_blank|multiple_choice|error_correction|sentence_building|match|listen_select|dictation|
             read_aloud|richtig_falsch|ja_nein|abc|zuordnen|cloze|notes|form_fill|insert),
  role: enum(gist|detail|structured|practice|perception|check|proof|exam),
  topic: ref(spine) | ref(lexicon) | enum(hoeren|lesen|redemittel|aussprache),
  promptDe: de,                      // what the learner reads; the answer must follow from it (ITM-01)
  promptEn: en?,                     // short task gloss; never the only cue (ITM-01)
  options: [str]{2..3}?,             // MC/abc 3 (ITM-02); richtig_falsch/ja_nein/listen_select 2
  tiles: [str]{2..8}?,               // sentence_building
  pairs: [[str, str]]{3..6}?,        // match
  audioLineRef: ref(line)?,          // dictation, listen_select, notes
  textRef: str?,                     // exam items: the text they belong to
  answer: str,
  accepted: [str],                   // every correct form; sentence_building: every grammatical order (ITM-09)
  acceptedWhy: { [form: str]: de }?, // required for every non-obvious accepted form (ITM-10)
  caseSensitive: bool?,              // only where capitalisation IS the task (ITM-08)
  exact: enum(number|name)?,         // digits, times, dates, prices, phone numbers, spelled names (ITM-07)
  noMatch: bool?,                    // zuordnen: this slot's key is the no-match option
  intentionalError: bool?,           // error_correction source sentence (exempt from LNG-01/02)
  perceptionOnly: bool?,             // perception drill tokens (exempt from LEX-03)
  explanation: LText,                // static feedback; de ≤ 25 words at A levels (ITM-11)
  hint: LText?,
  errorTag: enum(v2-inv|verb-final|satzklammer|case-np|case-pp|gender-article|adj-ending|
                 perfekt-aux-participle|connector-position|n-dekl|reflexive|register|spelling-meaning)?,
  origin: enum(agent|generator),
  reviewerConfirmed: [str]*          // accepted forms confirmed after solver triage
}
```

The compiler maps an `Item` onto the existing pool shape consumed by `check.js`, `requeue.js`, `mastery.js` and
`reviewGrading` (`id, topic, type, questionDe, questionEn, options, answer, accepted, caseSensitive, explanationDe,
explanationEn, hint, minLektion`) and adds `exact`, which `checkOptionsFor(item)` passes to `checkAnswer()` once E1
extends the checker.

### 3.2 GeneratorSpec (items produced by code)

```js
GeneratorSpec = {
  generator: enum(dictation.fromInput|numbers.dictation|lex.glossMatch|lex.glossTyped|lex.articlePlural|
                  perception.pairs|perception.intonation),
  count: int[1..3],
  source: [ref(line) | ref(lexicon) | str]*,   // lines to dictate, lemmas to drill, minimal pairs
  voices: int[1..6]?                             // perception: ≥ 4 (AUD-04)
}
```

### 3.3 Line (anything a voice speaks)

```js
Line = { id: re(line), speaker: ref(cast) | enum(ansage|radio|durchsage|pruefer), de: de, en: en,
         say: str?,          // TTS text where written ≠ spoken: „0341 58 27 90" → „null drei vier eins …" (AUD-02)
         seconds: num }      // generated
```

### 3.4 Fact (every factual claim, CON-06)

```js
Fact = {
  id: re(fact), claimDe: de, claimEn: en,
  sources: [url], factsCheckedOn: date, currentAsOf: date,
  exceptions: [LText]*,
  verification: enum(verified|partial|pending),   // promotion requires 'verified'
  notes: str?
}
```

## 4. Registries (`content/course-v2/registries/`)

### 4.1 Can-dos — `cando/<band>.json`

```js
{ $schema: 'course-v2/cando@1', band: enum(a1|a2|b1|b2),
  items: [{ id: re(cando), de: de,               // our own ich-Form wording, never verbatim CEFR/Goethe text
            halfLevel: re(LEVEL), band: enum(A1|A2|A2+|B1|B1+|B2|B2+),
            mode: enum(receptive-spoken|receptive-written|productive-spoken|productive-written|
                       interaction-spoken|interaction-written|mediation),
            source: [str],                       // e.g. 'RC 84·A2', 'GI-A2F 17', 'GER-R·A2', 'US-A2 S2'
            hf: [enum(1|2|3|4|5|6|7|8|9|10|11|12|A|B|C|D|E)],
            online: bool, mediation: bool }] }
```

### 4.2 Grammar spine — `grammar-spine.json`

```js
{ $schema: 'course-v2/spine@1',
  points: [{ id: re(spine), label: de,
             intro: { receptive: ref(unit), productive: ref(unit)? }, chunkFrom: ref(unit)?,
             detectors: [ref(detector)]*, contrast: ref(spine)?, errorTags: [str]*,
             lehrwerk: [str], consensus: enum(strong|majority|split|single),
             ruleCards: [ref(rulecard)], inventory: [enum(gz-a1|gz-a2)]* }] }
```

### 4.3 Lanes — `lanes/<lane>.json`

```js
{ $schema: 'course-v2/lane@1',
  id: enum(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2), name: str, level: enum(A1|A2|B1|B2),
  examKey: enum(goethe_a1|goethe_a2|telc_a2|telc_b1|dtz|goethe_b1|telc_b2|goethe_b2|osd_za1|dtb_b2),
  providers: [str], stand: date, sources: [url],
  access: { gate: enum(none|integrationskurs), labelDe: de? },
  modules: { [module: enum(hoeren|lesen|sprachbausteine|schreiben|sprechen)]:
             { minutes: num, teile: [str], prepMinutes: int?, format: enum(group|pair|individual)? } },
  writtenBlock: { minutes: int, breaks: bool },
  teile: { [teil: str]: TeilTemplate },
  blueprint: { modules: { [module]: [str] }, totalMinutes: int, answerSheetStep: bool },
  scale: { kind: enum(raw|scaled), rawToScore: num?, max: num, parts: object },
  passRule: str,                     // id of the pure function in src/services/examRules/<lane>.js
  openQuestions: [str]* }

TeilTemplate = {
  id: re(template), module: str, family: ref(family),
  task: enum(abc|richtig_falsch|ja_nein|zuordnen|cloze|notes|form_fill|insert|writing|speaking),
  items: int?, options: int?, noMatch: enum(X|0|x)?, plays: int[1..2]?, readingSeconds: int?, minutes: num?,
  textType: ref(texttype), textWords: [int, int]?, textWordsSource: enum(official-sample|design),
  words: { target: int?, min: int?, max: int? }?, leitpunkte: int?, choose: { from: int, pick: int }?,
  register: enum(informell|halbformell|formell)?,
  interaction: enum(cards-ask|cards-request|group|monologue|plan-together|discuss|photo|feedback-question|mediate)?,
  prepMinutes: int?, rubric: ref(rubric)?, points: num,
  scaffoldAllowedIn: [re(LEVEL)]*, transfersTo: [ref(template)]*,   // appearance counting only (COV-1)
  source: str, stand: date }
```

### 4.4 Families — `families.json`

```js
{ $schema: 'course-v2/families@1',
  families: [{ id: re(family), label: str, skill: de, templates: [ref(template)] }] }
```

### 4.5 Rubric profiles — `rubrics/writing/<id>.json`, `rubrics/speaking/<id>.json`

```js
{ $schema: 'course-v2/rubric@1', id: re(rubric), kind: enum(writing|speaking), lane: ref(lane) | null,
  max: num,
  criteria: [{ id: str, label: de, per: enum(task|leitpunkt|turn|part)?, levels: [num], weight: num? }],
  zeroRules: [str]*,        // ids of pure functions in netlify/functions/_shared/rubrics/rules.mjs (EXM-08)
  capRules: [str]*,
  spelling: enum(scored|only-if-meaning-suffers|not-scored),
  feedbackLanguage: [enum(de-a1|de-a2|de|en)],
  modelId: str,             // pinned; any change re-runs CAL-01/02
  splitVerified: bool,      // false where the official split is reconstructed
  calibration: { status: enum(pending|anchors-pass|human-pass), rangeBands: num },
  source: url }
```

### 4.6 Level profiles — `level-profiles.json`

```js
{ $schema: 'course-v2/levels@1',
  levels: [{ level: re(LEVEL), band: str, skeleton: enum(A|B),
             steps: [enum(situation|text|sprache|pruefung|sprechen|schreiben|ueberarbeiten|check)],
             minutes: { [stepKind]: int, reviewPerDay: int },
             sentence: { meanWordsMax: num, maxWords: int, subordinateClausesMax: int? },
             lexis: { newPerUnit: [int, int], productiveShare: num, offListMax: num, coverageMin: num },
             review: { budgetMinutes: int, secondsPerReview: int, firstReviewCeiling: int },
             pool: { size: 16, served: 12, generatedMax: num, mix: object },
             microOutput: { seconds: [int, int], words: [int, int] },
             ruleCardMaxWords: int, partnerSupport: str,
             feedbackLanguage: [str] }] }
```

### 4.7 Text types, detectors, casts

```js
// text-types.json
{ types: [{ id: re(texttype), label: de, parts: [enum(betreff|anrede|gruss|einleitung|schluss|datum|unterschrift)]*,
            lengthByLevel: { [level]: [int, int] } }] }
// detectors.json  (extends src/data/curricula/constructions.js; E0-4 owns it)
{ detectors: [{ id: re(detector), construction: str, precision: enum(exact|heuristic|advisory),
                method: enum(token|pattern|lexicon|clause), spec: object }] }
// casts/series.json  +  casts/<band>.json
{ members: { [castId]: { name: str, age: int?, from: str?, languages: [str]*, role: de,
                         exam: { lane: ref(lane), arc: de }?, voice: { azure: str, rate: str }, bands: [str] } },
  relations: [{ a: ref(cast), b: ref(cast), address: enum(du|Sie), since: ref(unit)? }] }
```

## 5. `course.json` (one per level)

```js
{ $schema: 'course-v2/course@1',
  level: re(LEVEL), kind: enum(dot1|dot2), priceKey: str | null,     // 'course_a2_1'; null for a1.1
  title: LText, honestyLineDe: de?,                                   // required for .1 courses
  lanes: { primary: ref(lane), secondary: [ref(lane)]*, later: [ref(lane)]*, live: [ref(lane)] },
  units: [ref(unit)]{12},
  etappen: [{ nr: int[1..4], units: [ref(unit)]{3}, closedBy: ref(plateau) | 'closing' }]{4},
  plateaus: [str]{3},
  closing: { halbtest: { [lane]: str }? , diagnose: { [lane]: str }?, modelltests: { [lane]: [str] }?,
             wiederholungsplan: bool },
  completion: {
    lernschritt: { finishedWhen: 'all-items-answered' },
    aufgabe: { submittedWhen: { writingMinShareOfLowerBound: 0.5, speakingMinSeconds: 20, cardModeMinTurns: 2 } },
    unit: { completeWhen: ['lernschritte-finished-or-tested-out', 'aufgaben-submitted'] , testOutThreshold: 0.8 },
    course: { required: [{ kind: 'unit', status: 'complete', count: 12 },
                         { kind: 'plateau', status: 'submitted', count: 3 },
                         { kind: 'closing', status: 'submitted', count: 1 }],
              neverRequired: ['score', 'fokus', 'mehr-ueben', 'extensive', 'modelltest:b', 'modelltest:c'] } },
  review: { ladderDays: [int], examCapShare: num, budgetMinutes: int, firstReviewCeiling: int,
            secondsPerReview: int },
  pace: { leicht: { unitsPerWeek: 0.5, learningDays: 3 }, standard: { unitsPerWeek: 1, learningDays: 4 },
          intensiv: { unitsPerWeek: 2, learningDays: 6 } },
  targets: { newWords: [int, int], productiveShare: num, aufgaben: int, microOutputs: int },
  // generated below this line
  minutesPlanned: object, reviewMinutesByPace: object, minutesMeasured: object | null,
  counts: object, contentHash: str }
```

`completion` is the **single definition** read by the course home, the Teilnahmebescheinigung, the reminder view and
`weekly_truth_metrics()` through one function, `src/lib/course-v2/completion.js` (PRG-02).

## 6. `lexicon.json` (one per level; authored before the units)

```js
{ $schema: 'course-v2/lexicon@1', level: re(LEVEL),
  entries: [{ id: re(lexicon), lemma: de,
              pos: enum(NOUN|VERB|ADJ|ADV|PREP|CONJ|PRON|DET|NUM|PHRASE|INTJ),
              article: enum(der|die|das)?, plural: str | null ?, plural_kind: enum(regular|singular-only|plural-only)?,
              feminine: str?,                         // one entry for the pair, as Goethe counts
              verb_forms: { '3sg': str, praet: str?, perfekt: str? }?, separable: bool?,
              reflexive: enum(akk|dat)?, rection: str?, variety: enum(D|A|CH)?,
              role: enum(productive|receptive), unit: ref(unit), block: int[1..4],
              list_ref: str,                          // 'A1'|'A2'|'B1'|'derived:<head>'|'compound:<a+b>'|'off-list:<reason>'|'freq:<band>'
              freq_rank: int?, gloss: EnText, example: de, exampleEn: en?,
              wordId: null }] }                       // generated at integration (one SQL lemma match)
```

`list_ref` values come from the private reference table (the Goethe lists never enter the repo, BLUEPRINT §2.6); the
values in §15 are illustrative.

## 7. `rule-cards.json` (one per level)

```js
{ $schema: 'course-v2/rulecards@1', level: re(LEVEL),
  cards: [{ id: re(rulecard), spine: ref(spine), depth: int[1..3],
            modelSentence: de, de: de, en: en,        // de ≤ 60 words (A1) / ≤ 80 (A2+) (GRM-05)
            table: [[str]]?,                           // paradigm; kasus colours only where a case is named
            caseMarks: [{ token: str, kasus: enum(nominativ|akkusativ|dativ|genitiv) }]* }] }
```

## 8. The unit file — `content/course-v2/<level>/units/uNN.json`

```js
{ $schema: 'course-v2/unit@1',
  id: re(UNIT), level: re(LEVEL), nr: int[1..12], etappe: int[1..4],
  version: int, status: enum(draft|review|approved), reviewedIn: str | null,
  title: { de: de, canDo: de },                      // canDo = learner-facing can-do title in Sie
  spec: UnitSpec,
  start: Start,
  steps: [Step]{7} | [Step]{8},                       // A skeleton 7, B skeleton 8 (level profile)
  check: Check,
  redemittel: [{ id: re(rm), de: de, en: en, function: de, forTemplate: ref(template)? }]{2..8},
  story: { beat: de, cliffhanger: de, castIn: [ref(cast)] },
  fokus: [Fokus]{0..2},
  facts: [Fact]*,
  // generated
  minutesPlanned: object, reviewCards: [str], contentHash: str }

UnitSpec = {
  situation: de,
  handlungsfeld: [str],
  canDos: [ref(cando)]{3..5},
  grammar: { new: [ref(spine)]{0..2}, chunk: [ref(spine)]{0..1}, review: [ref(spine)]* },   // GRM-01
  lexiconBlocks: [{ title: de, lemmas: [ref(lexicon)]{6..10} }]{3..4},                       // = lexicon.json allocation
  textTypes: [ref(texttype)],
  lanes: { primary: ref(lane),
           pruefungsfokus: [{ template: ref(template), length: enum(full|reduced|mini),
                              modeDefault: enum(lern|pruefung) }]{2..4},
           spur: { [lane: str]: [ref(template)] } },
  lehrwerk: [str]*, deviation: { reason: str } | null,
  cast: [ref(cast)],
  source: { w2Draft: str? } }

Start = {
  lernziele: [ref(cando)]{3..5},                     // = spec.canDos
  pruefungsfokusChips: [ref(template)],
  folge: { title: de, lines: [Line]{2..12}, gistItem: Item },   // ≤ 90 s A1, ≤ 2 min above (TXT-03)
  auftakt: { photoAlt: de, promptDe: de, microOutput: MicroOutput }?,   // B skeleton only
  testOut: { offered: bool } }

Step = SituationStep | TextStep | SpracheStep | PruefungStep | SprechenStep | SchreibenStep | UeberarbeitenStep | CheckStep

SituationStep = {                                    // A: LS1–LS3
  id: re(STEP), kind: 'situation', title: de,
  structure: ref(spine) | null, modelSentence: de, ruleCard: ref(rulecard),
  warmup: { draw: 6, contrastWith: ref(spine)? },
  input: Input,
  inputItems: [Item]{5},                             // role gist ×2, detail ×3
  structuredInput: [Item]{4},
  pool: { items: [Item]{9..16}, generators: [GeneratorSpec]* },   // items + generated = 16 (ITM-06)
  microOutput: MicroOutput,
  aussprache: { focus: de, perception: [Item]{4} | GeneratorSpec, readAloud: { lineDe: de } }?,
  endLine: de }

TextStep = SituationStep with kind: 'text', structure: null and modelSentence optional   // B: LS1–LS2
SpracheStep = { id, kind: 'sprache', ruleTable: { rows: [[str]], blanks: [[int, int]] }, ruleCard: ref(rulecard),
                pool: {…}, cloze: [Item]*, redemittelFor: [ref(template)], endLine: de }            // B: LS3

Input = {
  kind: enum(dialog|monolog|text|mixed), title: de, textType: ref(texttype),
  lines: [Line]{1..14}?, text: { de: de, en: en? }?,
  glosses: [{ token: str, gloss: EnText }]{0..3},
  transcriptAfterUnaidedListen: bool }

MicroOutput = {
  id: re(mo), bankKey: re(BANK_KEY), mode: enum(spoken|written), profile: enum(course-micro|course-micro-sp),
  promptDe: de, promptEn: en, planSeconds: int, seconds: [int, int]?, words: [int, int]?,
  targets: [ref(spine)], register: enum(du|Sie) }

PruefungStep = {                                     // LS4
  id, kind: 'pruefung',
  blocks: [ExamBlock]{1..2},
  strategyCards: [{ template: ref(template), de: de, en: en }]   // de ≤ 60 words
}

ExamBlock = {
  id: re(block), template: ref(template), lane: ref(lane),
  length: enum(full|reduced|mini), scaffolded: bool, modeDefault: enum(lern|pruefung),
  instructionsDe: de,
  texts: [{ id: str, kind: enum(audio|text|ad|sign|form), title: de?, lines: [Line]?, text: de?,
            glosses: [{ token: str, gloss: EnText }]{0..3} }],
  items: [Item],                                      // role 'exam'; count/options/plays = template (EXM-01)
  answerSheet: bool? }

SprechenStep  = { id, kind: 'sprechen',  task: SpeakingTask }
SchreibenStep = { id, kind: 'schreiben', task: WritingTask }
UeberarbeitenStep = { id, kind: 'ueberarbeiten', of: ref(bank), endLine: de }   // B: LS7
CheckStep = { id, kind: 'check', endLine: de }                                  // renders `check`

SpeakingTask = {
  bankKey: re(BANK_KEY), lane: ref(lane), template: ref(template),
  mode: enum(cards-ask|cards-request|group|monologue|plan-together|discuss|photo|feedback-question|mediate),
  profile: ref(rubric), prepMinutes: int,             // = the lane's value (EXM-04)
  instructionsDe: de, situationDe: de?,
  cards: { learner: [de]*, partner: [de]* }?, slides: [de]{5}?,
  moves: [enum(vorschlagen|reagieren|widersprechen|einigen|verteilen)]*,
  planningRound: { minutes: int, moves: [str] }?,     // every B1 unit (BLUEPRINT §2.8)
  aiRole: { name: str, personaDe: de, register: enum(du|Sie),
            support: enum(slow-wordbank|repeat-on-request|clarify|learner-leads|examiner|interrupts) },
  openingLine: de, hintWords: [str]{0..8},
  modelTurns: [{ speaker: enum(learner|partner), de: de }],   // shown only after the learner's attempt
  originLabelDe: de? }                                        // set when shown to a learner of another lane (COV-6)

WritingTask = {
  bankKey: re(BANK_KEY), lane: ref(lane), template: ref(template), examKey: str,   // = the lane's examKey
  profile: ref(rubric), register: enum(informell|halbformell|formell), address: enum(du|Sie),
  title: de, situationDe: de, taskDe: de,
  leitpunkte: [{ id: str, de: de, cues: [str] }],      // count = template; Anrede/Gruß never a Leitpunkt (EXM-03)
  choose: { from: int, pick: int }?,
  wordBand: [int, int], wordBandLearning: [int, int]?, minSubmitWords: int,
  checklist: [de], modelText: de,                      // model text shown only after the learner's revision
  originLabelDe: de? }

Check = {
  items: [Item]{7..9},                                 // this unit
  earlier: [{ ref: ref(item) }]{3..5},                 // reserve items of earlier units (≈ 35 %)
  proofs: [{ canDo: ref(cando), item: ref(item)? , aufgabe: enum(sprechen|schreiben)? }]{3..5},
  testOutThreshold: num, cumulativeShare: num }

Fokus = { id: re(fokus), kind: enum(daz|daf|beruf), title: de, bodyDe: de, bodyEn: en, factRefs: [ref(fact)]*,
          minutes: int, optional: true }
```

## 9. Lane pack file — `units/uNN.lane-<lane>.json`

```js
{ $schema: 'course-v2/lanepack@1', unit: ref(unit), lane: ref(lane), version: int,
  status: enum(draft|review|approved), reviewedIn: str | null,
  slots: {
    ls4: { mode: enum(replace|add), blocks: [ExamBlock], strategyCards: [...] }?,
    sprechen: SpeakingTask?,           // lane-exact variant; absent → the primary task with originLabelDe (.1 only)
    schreiben: WritingTask? },
  originLabels: { sprechen: de?, schreiben: de? },   // used in .1 when the primary task is shown instead
  // generated
  contentHash: str }
```

A learner sees exactly one block per slot: the lane pack's block if the pack has one for that slot, else the primary
block (with its origin label in a .1 course; in a .2 course a missing lane-exact slot fails COV-6).

## 10. Plateaus, closing blocks, Modelltests

```js
// plateaus/pN.json (+ pN.lane-<lane>.json with the same shape of examTeile)
{ $schema: 'course-v2/plateau@1', id: re(plateau), level, after: ref(unit),
  review: { draw: 20, currentShare: 0.65 },           // compiled from unit reserves
  examTeile: [ExamBlock]{1..5},                         // one per module in the lane; full length in .2
  productive: WritingTask | SpeakingTask,
  reward: { lesemagazin: { title: de, text: de, items: [Item]{3..5} }?, hoermagazin: { title: de, lines: [Line],
            items: [Item]{3..5} }?, scene: { lines: [Line] }?, projekt: { promptDe: de, microOutput: MicroOutput }? } }

// closing/halbtest-<lane>.json  (.1) · closing/diagnose-<lane>.json (.2, free)
{ $schema: 'course-v2/closing@1', id: str, level, lane: ref(lane), kind: enum(halbtest|diagnose),
  mode: enum(lern|pruefung), parts: [ExamBlock | WritingTask | SpeakingTask] }
  // halbtest: every Teil of the lane, ≈ half the items; diagnose: one full-length Teil per module

// mocks/<lane>/<form>/<module>.json  (.2 only; one agent per module)
{ $schema: 'course-v2/mockmodule@1', id: str, level, lane: ref(lane), form: enum(a|b|c),
  module: enum(hoeren|lesen|sprachbausteine|schreiben|sprechen), minutes: int,
  parts: [ExamBlock | WritingTask | SpeakingTask], answerSheet: bool? }
```

## 11. Calibration anchors and QA results

```js
// content/course-v2/anchors/<profile>/<id>.json   — our own texts only; official samples live in private/
{ $schema: 'course-v2/anchor@1', id: str, profile: ref(rubric), task: ref(bank),
  text: de?, transcript: de?, errorHeavy: bool,
  expected: { [criterion: str]: num }, humanRatingRef: str?,   // key into the private human-rating store
  author: str }

// content/course-v2/qa/<level>/<fileId>.<gate>.json   — written by pipeline runners only
{ $schema: 'course-v2/qa@1', file: str, contentHash: str,
  gate: enum(SOL-01|SOL-02|SOL-03|CAL-01|CAL-02|LGL-05|LEX-06), modelIds: [str], ranAt: date,
  results: [object], summary: { pass: bool, counts: object } }
```

## 12. Who reads what

| Consumer | Reads (compiled forms) | Never reads |
|---|---|---|
| **Player** (`src/lib/course-v2`, `src/components/course-v2`) | `course.json` (units, Etappen, completion, review, pace); the unit (start, steps, check, story, fokus); the lane pack for the learner's lane; rule cards; lexicon glosses (tap gloss); audio manifest; level profile (support, minutes) | answer-key-free server data; anchors; QA |
| **Validator** (`scripts/course-v2/validate.mjs`) | everything in `content/course-v2/**`, the level profiles, the detectors, the ids ledger | private tables (pipeline only) |
| **Syllabus / Inhaltsverzeichnis page** (Astro + SPA twins) | `course.json`, unit `title`, `spec.handlungsfeld`, can-do `de` texts, spine `label`s, text-type `label`s, `spec.lanes.pruefungsfokus` per live lane, `minutesMeasured` | items, keys, tasks |
| **Writing grader** (`evaluate-writing`) | the writing bank shard (task by `bankKey` + `examKey`), the server copy of the rubric profile, the zero/cap rule functions, the level's feedback language | unit texts, client prompts |
| **Speaking functions** | the speaking bank shard (task by `bankKey`), the rubric profile, the lane's prep minutes | client-supplied task text (legacy `courseTask` only for the live course) |
| **Scorers** (`src/services/examRules/<lane>.js`) | the lane's `scale`, `passRule`, `blueprint` | AI output for deterministic parts |
| **Review service** | card keys (§2) and the compiled card index | — |
| **Plan / board** | `course.json` pace and review, `learner_goals`, `exam_practice_results`, deterministic Teil values | AI scores as plan inputs (PRG-04) |
| **Copy** (`courseFacts` twins, `llms.txt`, `claims.test`) | `course.json.counts` (generated) | typed numbers |

## 13. Compiler outputs (`node scripts/course-v2/compile.mjs <level>`, deterministic, idempotent, committed)

| Content | Compiled to | Consumed by |
|---|---|---|
| unit JSON + lane packs | `src/data/course-v2/<level>/units/uNN.js` (lazy chunks; learner-invisible fields stripped) | v2 player |
| items | pool entries in the `lessonPools` item shape | `check.js`, `requeue.js`, `mastery.js`, `reviewGrading` |
| rule cards | `src/data/course-v2/<level>/ruleCards.js` | Form segment, repair cards |
| writing tasks | `src/data/writingTasks/<level>.js` ↔ `netlify/functions/_shared/writingTasks/<level>.mjs` (byte-identical, `check-duplicates`) | `evaluate-writing` |
| speaking tasks | `src/data/speakingTasks/<level>.js` ↔ `netlify/functions/_shared/speakingTasks/<level>.mjs` | speaking functions |
| rubric profiles | `netlify/functions/_shared/rubrics/<id>.mjs` (+ a client copy of labels only) | graders, result cards |
| Plateaus, closing, mocks | modules in the Modelltest runner's shape with the new part types | runner + per-lane scorers |
| lexicon | `words-from-json.mjs` input (new rows only) → guarded SQL for the owner | `words`, audio |
| audio lines | `<level>.lines.json` → `generate-course-audio.mjs` → `<level>.audio.js` manifest | `speech.js` (per-level manifest) |
| syllabus | `astro-site/src/data/syllabus/<level>.json` ↔ `src/data/syllabus/<level>.json` | Astro course pages, SPA course home |
| counts for copy | `src/data/courseFacts.js` ↔ `astro-site/src/data/courseFacts.js` | pages, `claims.test`, `build-llms.mjs` |
| ids, hashes, minutes | `<level>/ids.ledger.json`, `contentHash`, `minutesPlanned` | ID-01, QA-FRESH-01, TIM-01 |

## 14. Learner state in Supabase (hand-applied migrations; no content tables)

```sql
-- migrations/2026-10-XX-course-v2-learner-state.sql  (owner applies; RLS own rows)
create table if not exists public.exam_practice_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level ~ '^(a1|a2|b1|b2)\.[12]$'),
  lane text not null,
  teil text not null,                         -- template id, e.g. 'tb1.lv3'
  source text not null check (source in ('ls4','aufgabe','plateau','halbtest','diagnose','modelltest')),
  source_id text not null,                    -- block / task / form id
  form text check (form in ('a','b','c')),
  mode text not null check (mode in ('lern','pruefung')),
  full_length boolean not null,
  raw_score numeric not null, raw_max numeric not null,
  scaled_score numeric, scaled_max numeric,
  ai_range numeric[] check (ai_range is null or array_length(ai_range, 1) = 2),
  rubric_profile text, model_id text,
  before_course_end boolean not null default false,
  content_hash text,
  created_at timestamptz not null default now()
);
create index if not exists epr_user_lane_idx on public.exam_practice_results (user_id, lane, teil, created_at desc);
-- RLS: select/insert own rows; no update policy (append-only), delete own.

create table if not exists public.learner_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lane text, exam_date date, purpose text,
  pace text check (pace in ('leicht','standard','intensiv')),
  learning_days_per_week smallint check (learning_days_per_week between 1 and 7),
  reminder_time time, reminder_channel text not null default 'email',
  integrationskurs boolean,                   -- the DTZ gate question
  updated_at timestamptz not null default now()
);
-- RLS: the learner reads/writes own row. Nothing here is a privileged column.

-- review_cards: new kinds (verify the auto-generated constraint name first)
alter table public.review_cards drop constraint if exists review_cards_kind_check;
alter table public.review_cards add constraint review_cards_kind_check
  check (kind in ('word','pattern','sentence','teil','repair'));

-- lesson_progress: the tested-out state (verify the constraint name first)
alter table public.lesson_progress drop constraint if exists lesson_progress_status_check;
alter table public.lesson_progress add constraint lesson_progress_status_check
  check (status in ('started','complete','gold','tested_out'));

-- writing_submissions / exam_attempts: add the new exam keys the v2 banks use
--   writing_submissions_exam_key_check  += 'telc_a2', 'goethe_b2'   (v1.1: 'osd_za1', 'dtb_b2')
--   exam_attempts_exam_key_check        += the v2 mock/closing keys, following the 2026-09-06 migrations' pattern
```

- `lesson_attempts` (exists) keeps one row per answered item; v2 adds the item's `stage` as the step kind and records
  Lernschritt minutes through the `lernschritt_completed` event, from which the compiler's `minutesMeasured` is built.
- The course-funnel SQL (`migrations/2026-09-19-course-funnel.sql`, hard-coded `'a1.1-l01'`, `'a1.1-cp1'`) and the
  course-reminder view are updated in the same PR that switches A1.1 to v2; the reminder view counts both id schemes
  as activity (BLUEPRINT §7.7).
- Lane → exam key: `sd1 → goethe_a1`, `ga2 → goethe_a2`, `ta2 → telc_a2`, `tb1 → telc_b1`, `dtz → dtz`,
  `gb1 → goethe_b1`, `tb2 → telc_b2`, `gb2 → goethe_b2` (`oza1 → osd_za1`, `dtb2 → dtb_b2` in v1.1).

---

## 15. Worked example: A2.1 Unit 7 „Am Telefon im Job" (complete)

This unit is also the **E1 fixture** (BLUEPRINT §10.2): the player is done when it plays this unit end to end at
360 × 640. Its place in the sequence: BLUEPRINT §2.8, A2.1 row 7 — Situation *Mailbox, Rückruf, Termin verschieben*
(HF 2), grammar new: *reflexive Verben (Akkusativ)* (one point; *wenn* from U6 and *Perfekt mit haben* are review),
Prüfungsfokus Goethe A2 Hören 1, Schreiben 2, Sprechen 1; Spur telc A2 Hören 1. Story: Priya's first weeks at the
front desk of Brandt Elektrotechnik in Leipzig. `list_ref` values are illustrative (the real ones come from the
private table); voice ids are illustrative until the owner's Azure run confirms them.

### 15.1 Registry entries this unit references (excerpts)

`registries/cando/a2.json` (the four can-dos of the unit; wording ours, tags from the W2 draft `curriculum/a2-1.md` E8
and memo 01):

```json
{
  "$schema": "course-v2/cando@1",
  "band": "a2",
  "items": [
    { "id": "cd.a2.mailbox-verstehen", "de": "Ich kann einer Nachricht auf dem Anrufbeantworter die wichtigen Informationen entnehmen: wer anruft, worum es geht und bis wann.", "halfLevel": "a2.1", "band": "A2", "mode": "receptive-spoken", "source": ["GI-A2F 17"], "hf": ["2"], "online": false, "mediation": false },
    { "id": "cd.a2.rueckruf-weitergeben", "de": "Ich kann auf eine Bitte um Rückruf reagieren und eine Nachricht für eine Kollegin oder einen Kollegen annehmen und weitergeben.", "halfLevel": "a2.1", "band": "A2", "mode": "interaction-spoken", "source": ["RC 84·A2"], "hf": ["2"], "online": false, "mediation": false },
    { "id": "cd.a2.arbeit-erzaehlen", "de": "Ich kann einfach erzählen, was ich bei der Arbeit mache, und andere danach fragen.", "halfLevel": "a2.1", "band": "A2", "mode": "interaction-spoken", "source": ["GER-R·A2"], "hf": ["2"], "online": false, "mediation": false },
    { "id": "cd.a2.termin-absagen-mail", "de": "Ich kann in einer kurzen E-Mail einen Termin absagen, einen Grund nennen und einen neuen Termin vorschlagen.", "halfLevel": "a2.1", "band": "A2", "mode": "productive-written", "source": ["US-A2 S2"], "hf": ["2"], "online": false, "mediation": false }
  ]
}
```

`registries/grammar-spine.json` (one point; `g.wenn` and `g.perfekt-haben` exist in the full registry):

```json
{
  "id": "g.reflexiv-akk",
  "label": "Reflexive Verben mit Akkusativ: ich melde mich, du beeilst dich",
  "intro": { "receptive": "a2.1-u07", "productive": "a2.1-u07" },
  "detectors": ["det.reflexiv-pronomen"],
  "contrast": "g.akk-personalpronomen",
  "errorTags": ["reflexive"],
  "lehrwerk": ["M A2 L11", "S3 L5", "N A2 K4"],
  "consensus": "strong",
  "ruleCards": ["rc.reflexiv-akk"],
  "inventory": []
}
```

`registries/lanes/ga2.json` (excerpt: three of its thirteen Teil templates):

```json
{
  "$schema": "course-v2/lane@1",
  "id": "ga2",
  "name": "Goethe-Zertifikat A2",
  "level": "A2",
  "examKey": "goethe_a2",
  "providers": ["goethe"],
  "stand": "2026-09-26",
  "sources": [
    "https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf",
    "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf"
  ],
  "access": { "gate": "none" },
  "modules": {
    "lesen": { "minutes": 30, "teile": ["l1", "l2", "l3", "l4"] },
    "hoeren": { "minutes": 30, "teile": ["h1", "h2", "h3", "h4"] },
    "schreiben": { "minutes": 30, "teile": ["s1", "s2"] },
    "sprechen": { "minutes": 15, "teile": ["sp1", "sp2", "sp3"], "prepMinutes": 0, "format": "pair" }
  },
  "writtenBlock": { "minutes": 90, "breaks": false },
  "teile": {
    "h1": { "id": "ga2.h1", "module": "hoeren", "family": "fam.h-detail", "task": "abc", "items": 5, "options": 3, "plays": 2, "textType": "tt.kurzansage", "textWords": [25, 60], "textWordsSource": "design", "points": 5, "scaffoldAllowedIn": ["a2.1"], "transfersTo": [], "source": "US-A2 p. 3 and Hören Teil 1", "stand": "2026-09-26" },
    "s2": { "id": "ga2.s2", "module": "schreiben", "family": "fam.w-nachricht", "task": "writing", "textType": "tt.email-halbformell", "words": { "min": 30, "max": 40 }, "leitpunkte": 3, "register": "halbformell", "rubric": "ga2-s2", "points": 10, "scaffoldAllowedIn": [], "transfersTo": [], "source": "US-A2 p. 37", "stand": "2026-09-26" },
    "sp1": { "id": "ga2.sp1", "module": "sprechen", "family": "fam.s-fragekarten", "task": "speaking", "textType": "tt.wortkarte", "interaction": "cards-ask", "prepMinutes": 0, "rubric": "ga2-sp1", "points": 4, "scaffoldAllowedIn": ["a2.1"], "transfersTo": ["ta2.sp2"], "source": "US-A2 Sprechen Teil 1; DB-A2 §1.4", "stand": "2026-09-26" }
  },
  "blueprint": { "modules": { "lesen": ["l1", "l2", "l3", "l4"], "hoeren": ["h1", "h2", "h3", "h4"], "schreiben": ["s1", "s2"], "sprechen": ["sp1", "sp2", "sp3"] }, "totalMinutes": 105, "answerSheetStep": false },
  "scale": { "kind": "scaled", "max": 100, "parts": { "lesen": 25, "hoeren": 25, "schreiben": 25, "sprechen": 25 } },
  "passRule": "goethe-a2",
  "openQuestions": ["Sprechen per-Teil split reconstructed from the rating sheet (memo 01, unverified)"]
}
```

`registries/lanes/ta2.json` (excerpt):

```json
{
  "h1": { "id": "ta2.h1", "module": "hoeren", "family": "fam.h-detail", "task": "notes", "items": 5, "plays": 2, "textType": "tt.telefonansage", "textWords": [30, 70], "textWordsSource": "design", "points": 5, "scaffoldAllowedIn": ["a2.1"], "transfersTo": [], "source": "UT-A2 pp. 5-25, 33 (numbers must be exact)", "stand": "2026-09-26" }
}
```

`registries/rubrics/writing/ga2-s2.json`, `registries/rubrics/speaking/ga2-sp1.json`, `registries/rubrics/writing/course-micro.json`:

```json
[
  { "$schema": "course-v2/rubric@1", "id": "ga2-s2", "kind": "writing", "lane": "ga2", "max": 10,
    "criteria": [
      { "id": "af", "label": "Aufgabenerfüllung (Sprachfunktionen, Register)", "per": "task", "levels": [5, 3.5, 2, 0.5, 0] },
      { "id": "sp", "label": "Sprache (Spektrum, Beherrschung)", "per": "task", "levels": [5, 3.5, 2, 0.5, 0] }
    ],
    "zeroRules": ["goethe-e-under-half-words", "goethe-e-topic-missed"], "capRules": [],
    "spelling": "only-if-meaning-suffers", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:writing-full", "splitVerified": true,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" },
  { "$schema": "course-v2/rubric@1", "id": "ga2-sp1", "kind": "speaking", "lane": "ga2", "max": 4,
    "criteria": [
      { "id": "af", "label": "Aufgabenerfüllung", "per": "part", "levels": [2, 1.5, 1, 0.5, 0] },
      { "id": "sp", "label": "Sprache", "per": "part", "levels": [2, 1.5, 1, 0.5, 0] }
    ],
    "zeroRules": [], "capRules": [], "spelling": "not-scored", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:speaking-full", "splitVerified": false,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" },
  { "$schema": "course-v2/rubric@1", "id": "course-micro", "kind": "writing", "lane": null, "max": 5,
    "criteria": [
      { "id": "task", "label": "Aufgabe erfüllt", "per": "task", "levels": [2, 1, 0] },
      { "id": "target", "label": "Zielstruktur benutzt", "per": "task", "levels": [1, 0] },
      { "id": "clear", "label": "verständlich", "per": "task", "levels": [2, 1, 0] }
    ],
    "zeroRules": [], "capRules": [], "spelling": "only-if-meaning-suffers", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:micro", "splitVerified": true,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" }
]
```

(The `ga2-sp1` split — Teil 1 = Aufgabenerfüllung 2 + Sprache 2, plus Aussprache across all parts — is reconstructed
from the rating sheet and **unverified** ([m01] Unverified); hence `splitVerified: false`.)

`registries/level-profiles.json` (the A2.1 entry):

```json
{
  "level": "a2.1", "band": "A2", "skeleton": "A",
  "steps": ["situation", "situation", "situation", "pruefung", "sprechen", "schreiben", "check"],
  "minutes": { "situation": 22, "pruefung": 25, "sprechen": 22, "schreiben": 22, "check": 15, "reviewPerDay": 7 },
  "sentence": { "meanWordsMax": 9, "maxWords": 16, "subordinateClausesMax": 1 },
  "lexis": { "newPerUnit": [28, 30], "productiveShare": 0.5, "offListMax": 0.15, "coverageMin": 0.95 },
  "review": { "budgetMinutes": 7, "secondsPerReview": 9, "firstReviewCeiling": 30 },
  "pool": { "size": 16, "served": 12, "generatedMax": 0.4, "mix": { "typedGapDictation": [0.45, 0.55], "sentenceBuildingMin": 0.2, "errorCorrectionMax": 0.12, "choiceMax": 0.2 } },
  "microOutput": { "seconds": [30, 40], "words": [8, 30] },
  "ruleCardMaxWords": 80, "partnerSupport": "clarify",
  "feedbackLanguage": ["de-a2", "en"]
}
```

`casts/series.json` and `casts/a2.json` (excerpt):

```json
{
  "members": {
    "cast.priya": { "name": "Priya Nair", "age": 28, "from": "Kochi, Indien", "languages": ["Malayalam", "Englisch", "Deutsch"], "role": "arbeitet am Empfang von Brandt Elektrotechnik in Leipzig", "exam": { "lane": "ga2", "arc": "Goethe-Zertifikat A2 im Frühjahr" }, "voice": { "azure": "de-DE-AmalaNeural", "rate": "-10%" }, "bands": ["a1", "a2", "b1", "b2"] },
    "cast.jan-wolf": { "name": "Jan Wolf", "age": 31, "from": "Leipzig", "languages": ["Deutsch", "Englisch"], "role": "Kollege von Priya, Techniker-Disposition", "voice": { "azure": "de-DE-ConradNeural", "rate": "-5%" }, "bands": ["a2"] },
    "cast.herr-brandt": { "name": "Thomas Brandt", "age": 55, "from": "Halle", "languages": ["Deutsch"], "role": "Chef der Firma", "voice": { "azure": "de-DE-KlausNeural", "rate": "-5%" }, "bands": ["a2"] },
    "cast.frau-otto": { "name": "Sabine Otto", "age": 48, "from": "Leipzig", "languages": ["Deutsch"], "role": "Buchhaltung, leitet die Teambesprechung", "voice": { "azure": "de-DE-KatjaNeural", "rate": "-5%" }, "bands": ["a2"] },
    "cast.monika-kowalski": { "name": "Monika Kowalski", "age": 40, "from": "Leipzig", "languages": ["Deutsch", "Polnisch"], "role": "Kundin, Firma Hansen Bau", "voice": { "azure": "de-DE-LouisaNeural", "rate": "-5%" }, "bands": ["a2"] },
    "cast.herr-seidel": { "name": "Peter Seidel", "age": 60, "from": "Leipzig", "languages": ["Deutsch"], "role": "Kunde", "voice": { "azure": "de-DE-BerndNeural", "rate": "-5%" }, "bands": ["a2"] },
    "cast.anna": { "name": "Anna Krüger", "age": 29, "from": "Leipzig", "languages": ["Deutsch", "Englisch"], "role": "Freundin von Priya", "voice": { "azure": "de-DE-MajaNeural", "rate": "-5%" }, "bands": ["a2", "b1"] },
    "cast.emre": { "name": "Emre Yıldız", "age": 30, "from": "İzmir, Türkei", "languages": ["Türkisch", "Deutsch"], "role": "Priyas Lernpartner aus dem A1-Kurs", "exam": { "lane": "ta2", "arc": "telc Deutsch A2 für die Ausbildung" }, "voice": { "azure": "de-DE-KillianNeural", "rate": "-5%" }, "bands": ["a1", "a2", "b1"] }
  },
  "relations": [
    { "a": "cast.priya", "b": "cast.jan-wolf", "address": "du" },
    { "a": "cast.priya", "b": "cast.herr-brandt", "address": "Sie" },
    { "a": "cast.priya", "b": "cast.frau-otto", "address": "Sie" },
    { "a": "cast.jan-wolf", "b": "cast.frau-otto", "address": "Sie" },
    { "a": "cast.priya", "b": "cast.monika-kowalski", "address": "Sie" },
    { "a": "cast.priya", "b": "cast.herr-seidel", "address": "Sie" },
    { "a": "cast.priya", "b": "cast.anna", "address": "du" },
    { "a": "cast.priya", "b": "cast.emre", "address": "du" }
  ]
}
```

`a2.1/rule-cards.json` (the card this unit uses):

```json
{
  "id": "rc.reflexiv-akk", "spine": "g.reflexiv-akk", "depth": 1,
  "modelSentence": "Bitte melden Sie sich bei mir.",
  "de": "Manche Verben haben ein Reflexivpronomen. Es zeigt auf das Subjekt: ich melde mich, du meldest dich, er/sie/es meldet sich, wir melden uns, ihr meldet euch, sie/Sie melden sich. Im Hauptsatz steht das Pronomen nach dem Verb: Ich melde mich morgen. Im Nebensatz steht es meist direkt nach dem Subjekt: …, wenn Sie sich verspäten.",
  "en": "Some verbs come with a reflexive pronoun that points back to the subject: mich, dich, sich, uns, euch, sich. In a main clause it follows the verb; in a subordinate clause it usually comes right after the subject pronoun.",
  "table": [["ich", "mich"], ["du", "dich"], ["er / sie / es", "sich"], ["wir", "uns"], ["ihr", "euch"], ["sie / Sie", "sich"]],
  "caseMarks": [{ "token": "mich", "kasus": "akkusativ" }, { "token": "dich", "kasus": "akkusativ" }]
}
```

`a2.1/lexicon.json` (the unit's 28 new entries: 14 productive, 14 receptive, in three blocks):

```json
[
  { "id": "lx.anruf", "lemma": "Anruf", "pos": "NOUN", "article": "der", "plural": "Anrufe", "plural_kind": "regular", "role": "productive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "phone call" }, "example": "Heute gibt es viele Anrufe.", "wordId": null },
  { "id": "lx.rueckruf", "lemma": "Rückruf", "pos": "NOUN", "article": "der", "plural": "Rückrufe", "plural_kind": "regular", "role": "productive", "unit": "a2.1-u07", "block": 1, "list_ref": "derived:rufen", "gloss": { "en": "call back" }, "example": "Der Rückruf kommt morgen früh.", "wordId": null },
  { "id": "lx.mailbox", "lemma": "Mailbox", "pos": "NOUN", "article": "die", "plural": "Mailboxen", "plural_kind": "regular", "role": "productive", "unit": "a2.1-u07", "block": 1, "list_ref": "off-list:situation", "gloss": { "en": "voicemail" }, "example": "Auf der Mailbox sind drei Nachrichten.", "wordId": null },
  { "id": "lx.besprechung", "lemma": "Besprechung", "pos": "NOUN", "article": "die", "plural": "Besprechungen", "plural_kind": "regular", "role": "productive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "meeting" }, "example": "Die Besprechung beginnt um neun.", "wordId": null },
  { "id": "lx.auftrag", "lemma": "Auftrag", "pos": "NOUN", "article": "der", "plural": "Aufträge", "plural_kind": "regular", "role": "productive", "unit": "a2.1-u07", "block": 2, "list_ref": "B1", "gloss": { "en": "order, job" }, "example": "Wir haben einen neuen Auftrag.", "wordId": null },
  { "id": "lx.techniker", "lemma": "Techniker", "pos": "NOUN", "article": "der", "plural": "Techniker", "plural_kind": "regular", "feminine": "die Technikerin", "role": "productive", "unit": "a2.1-u07", "block": 2, "list_ref": "derived:Technik", "gloss": { "en": "technician" }, "example": "Der Techniker kommt um acht.", "wordId": null },
  { "id": "lx.ausrichten", "lemma": "ausrichten", "pos": "VERB", "separable": true, "verb_forms": { "3sg": "richtet aus", "perfekt": "hat ausgerichtet" }, "rection": "jmdm. etw. (Dat. + Akk.)", "role": "productive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "to pass on (a message)" }, "example": "Kann ich ihm etwas ausrichten?", "wordId": null },
  { "id": "lx.verbinden", "lemma": "verbinden", "pos": "VERB", "verb_forms": { "3sg": "verbindet", "perfekt": "hat verbunden" }, "rection": "jmdn. mit jmdm.", "role": "productive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "to put through (on the phone)" }, "example": "Ich verbinde Sie mit Frau Otto.", "wordId": null },
  { "id": "lx.sich-melden", "lemma": "sich melden", "pos": "VERB", "reflexive": "akk", "verb_forms": { "3sg": "meldet sich", "perfekt": "hat sich gemeldet" }, "rection": "bei jmdm.", "role": "productive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "to get in touch" }, "example": "Bitte melden Sie sich bei mir.", "wordId": null },
  { "id": "lx.sich-verspaeten", "lemma": "sich verspäten", "pos": "VERB", "reflexive": "akk", "verb_forms": { "3sg": "verspätet sich", "perfekt": "hat sich verspätet" }, "role": "productive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "to be late" }, "example": "Ich verspäte mich leider.", "wordId": null },
  { "id": "lx.sich-beeilen", "lemma": "sich beeilen", "pos": "VERB", "reflexive": "akk", "verb_forms": { "3sg": "beeilt sich", "perfekt": "hat sich beeilt" }, "role": "productive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "to hurry" }, "example": "Beeil dich!", "wordId": null },
  { "id": "lx.sich-entschuldigen", "lemma": "sich entschuldigen", "pos": "VERB", "reflexive": "akk", "verb_forms": { "3sg": "entschuldigt sich", "perfekt": "hat sich entschuldigt" }, "rection": "bei jmdm.", "role": "productive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "to apologise" }, "example": "Ich entschuldige mich bei Frau Otto.", "wordId": null },
  { "id": "lx.besetzt", "lemma": "besetzt", "pos": "ADJ", "role": "productive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "engaged, busy (line)" }, "example": "Die Leitung ist besetzt.", "wordId": null },
  { "id": "lx.dringend", "lemma": "dringend", "pos": "ADJ", "role": "productive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "urgent" }, "example": "Ist es dringend?", "wordId": null },
  { "id": "lx.leitung", "lemma": "Leitung", "pos": "NOUN", "article": "die", "plural": "Leitungen", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "(phone) line" }, "example": "Die Leitung ist besetzt.", "wordId": null },
  { "id": "lx.durchwahl", "lemma": "Durchwahl", "pos": "NOUN", "article": "die", "plural": "Durchwahlen", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "off-list:situation", "gloss": { "en": "direct dial number" }, "example": "Die Durchwahl von Frau Otto ist 17.", "wordId": null },
  { "id": "lx.buchhaltung", "lemma": "Buchhaltung", "pos": "NOUN", "article": "die", "plural": null, "plural_kind": "singular-only", "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "off-list:situation", "gloss": { "en": "accounts department" }, "example": "Frau Otto arbeitet in der Buchhaltung.", "wordId": null },
  { "id": "lx.empfang", "lemma": "Empfang", "pos": "NOUN", "article": "der", "plural": "Empfänge", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "reception (desk)" }, "example": "Priya arbeitet am Empfang.", "wordId": null },
  { "id": "lx.kantine", "lemma": "Kantine", "pos": "NOUN", "article": "die", "plural": "Kantinen", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "canteen" }, "example": "Die Kantine ist heute zu.", "wordId": null },
  { "id": "lx.konferenzraum", "lemma": "Konferenzraum", "pos": "NOUN", "article": "der", "plural": "Konferenzräume", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 2, "list_ref": "compound:Konferenz+Raum", "gloss": { "en": "meeting room" }, "example": "Die Besprechung ist im Konferenzraum.", "wordId": null },
  { "id": "lx.stau", "lemma": "Stau", "pos": "NOUN", "article": "der", "plural": "Staus", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "traffic jam" }, "example": "Jan steht im Stau.", "wordId": null },
  { "id": "lx.autobahn", "lemma": "Autobahn", "pos": "NOUN", "article": "die", "plural": "Autobahnen", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "motorway" }, "example": "Auf der Autobahn ist Stau.", "wordId": null },
  { "id": "lx.feierabend", "lemma": "Feierabend", "pos": "NOUN", "article": "der", "plural": "Feierabende", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "end of the working day" }, "example": "Um fünf ist Feierabend.", "wordId": null },
  { "id": "lx.ueberstunde", "lemma": "Überstunde", "pos": "NOUN", "article": "die", "plural": "Überstunden", "plural_kind": "regular", "role": "receptive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "overtime (hour)" }, "example": "Heute mache ich eine Überstunde.", "wordId": null },
  { "id": "lx.weiterleiten", "lemma": "weiterleiten", "pos": "VERB", "separable": true, "verb_forms": { "3sg": "leitet weiter", "perfekt": "hat weitergeleitet" }, "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "derived:leiten", "gloss": { "en": "to forward" }, "example": "Ich leite die E-Mail an Herrn Brandt weiter.", "wordId": null },
  { "id": "lx.sich-setzen", "lemma": "sich setzen", "pos": "VERB", "reflexive": "akk", "verb_forms": { "3sg": "setzt sich", "perfekt": "hat sich gesetzt" }, "role": "receptive", "unit": "a2.1-u07", "block": 2, "list_ref": "A2", "gloss": { "en": "to sit down" }, "example": "Setzen Sie sich bitte.", "wordId": null },
  { "id": "lx.sich-anmelden", "lemma": "sich anmelden", "pos": "VERB", "separable": true, "reflexive": "akk", "verb_forms": { "3sg": "meldet sich an", "perfekt": "hat sich angemeldet" }, "rection": "für etw.", "role": "receptive", "unit": "a2.1-u07", "block": 1, "list_ref": "A2", "gloss": { "en": "to register, sign up" }, "example": "Bitte melden Sie sich bis Ende April an.", "wordId": null },
  { "id": "lx.beschaeftigt", "lemma": "beschäftigt", "pos": "ADJ", "role": "receptive", "unit": "a2.1-u07", "block": 3, "list_ref": "A2", "gloss": { "en": "busy (person)" }, "example": "Herr Brandt ist gerade beschäftigt.", "wordId": null }
]
```

### 15.2 `a2.1/course.json` (excerpt)

```json
{
  "$schema": "course-v2/course@1",
  "level": "a2.1",
  "kind": "dot1",
  "priceKey": "course_a2_1",
  "title": { "de": "Kontakte pflegen, Dinge erledigen", "en": "Keeping in touch, getting things done" },
  "honestyLineDe": "A2.1 ist die erste Hälfte des Wegs zur A2-Prüfung. Alle Prüfungsteile lernen Sie hier kennen; die komplette Prüfung üben Sie in A2.2.",
  "lanes": { "primary": "ga2", "secondary": ["ta2"], "later": [], "live": ["ga2"] },
  "units": ["a2.1-u01", "a2.1-u02", "a2.1-u03", "a2.1-u04", "a2.1-u05", "a2.1-u06", "a2.1-u07", "a2.1-u08", "a2.1-u09", "a2.1-u10", "a2.1-u11", "a2.1-u12"],
  "etappen": [
    { "nr": 1, "units": ["a2.1-u01", "a2.1-u02", "a2.1-u03"], "closedBy": "a2.1-p1" },
    { "nr": 2, "units": ["a2.1-u04", "a2.1-u05", "a2.1-u06"], "closedBy": "a2.1-p2" },
    { "nr": 3, "units": ["a2.1-u07", "a2.1-u08", "a2.1-u09"], "closedBy": "a2.1-p3" },
    { "nr": 4, "units": ["a2.1-u10", "a2.1-u11", "a2.1-u12"], "closedBy": "closing" }
  ],
  "plateaus": ["a2.1-p1", "a2.1-p2", "a2.1-p3"],
  "closing": { "halbtest": { "ga2": "a2.1-ht-ga2", "ta2": "a2.1-ht-ta2" }, "wiederholungsplan": false },
  "completion": {
    "lernschritt": { "finishedWhen": "all-items-answered" },
    "aufgabe": { "submittedWhen": { "writingMinShareOfLowerBound": 0.5, "speakingMinSeconds": 20, "cardModeMinTurns": 2 } },
    "unit": { "completeWhen": ["lernschritte-finished-or-tested-out", "aufgaben-submitted"], "testOutThreshold": 0.8 },
    "course": {
      "required": [
        { "kind": "unit", "status": "complete", "count": 12 },
        { "kind": "plateau", "status": "submitted", "count": 3 },
        { "kind": "closing", "status": "submitted", "count": 1 }
      ],
      "neverRequired": ["score", "fokus", "mehr-ueben", "extensive", "modelltest:b", "modelltest:c"]
    }
  },
  "review": { "ladderDays": [1, 3, 7, 14, 30, 60], "examCapShare": 0.15, "budgetMinutes": 7, "firstReviewCeiling": 30, "secondsPerReview": 9 },
  "pace": { "leicht": { "unitsPerWeek": 0.5, "learningDays": 3 }, "standard": { "unitsPerWeek": 1, "learningDays": 4 }, "intensiv": { "unitsPerWeek": 2, "learningDays": 6 } },
  "targets": { "newWords": [330, 360], "productiveShare": 0.5, "aufgaben": 24, "microOutputs": 36 }
}
```

(`"live": ["ga2"]` — telc A2 appears as a lane only once its pack has passed review, BLUEPRINT §1.4.)
