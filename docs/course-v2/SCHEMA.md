# Course v2 — SCHEMA (binding content data model)

**Date:** 2026-09-27 (critic pass applied, see the BLUEPRINT changelog) · **Status:** BINDING. Companion of
[`BLUEPRINT.md`](BLUEPRINT.md). **Precedence (one rule, stated identically in the blueprint):** `DECISIONS.md` >
BLUEPRINT > SCHEMA; this file is authoritative **only on field shapes, id patterns and file layout** and never
overrides a count, a rule, a threshold or product behaviour stated in the blueprint. Counts that appear in a type
below (e.g. `{4..6}`) transcribe the blueprint; if they ever differ, the blueprint wins and this file is corrected.
· **Implements:** BLUEPRINT §2–§10.
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
5. **Authors write; the compiler derives — into separate files.** Derived values (minutes, content hashes, card
   lists, counts for copy, SRS minutes, the Einstufung form, calibrated difficulty) are **never stored in an authored
   file**. They live in build artefacts under `content/course-v2/<level>/.build/`, written only by the orchestrator's
   `compile.mjs` run after a lease is released (§13); the checker rejects any such field in an authored file. The one
   authored placeholder is the lexicon's `wordId: null`, filled at integration in the compiled output, never in the
   source.
6. **German where the learner reads German**, English twins for explanations and glosses (`LText`), and room for an
   L1 layer (`tr`, `ar`) without touching German content.
7. **Staged authoring.** A unit file is written by S, then I, then T (BLUEPRINT §10.5) and declares its `stage`; the
   checker applies the stage schema of §8.1, so a file is valid for the role that last wrote it.

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
| `ref(kind)` | an id that must resolve (REF-01) in: `cando`, `spine`, `lexicon` (the global lemma registry), `template`, `lane`, `rubric`, `rulecard`, `cast`, `extra` (the same file's `extras`), `voice`, `texttype`, `detector`, `family`, `unit`, `step`, `item`, `line`, `text`, `asset`, `fact`, `bank` |
| `[T]`, `[T]*`, `[T]{n}`, `[T]{a..b}` | non-empty array / possibly empty / exactly n / a to b items |
| `{…}` | object; **unknown keys are an error** |
| `T \| U` | union |
| `// generated` | a derived value that exists only in `.build/` artefacts (listed for reference; rejected in an authored file) |

## 2. Identifiers

| Kind | Pattern (`re` name) | Example |
|---|---|---|
| level | `LEVEL = /^(a1\|a2\|b1\|b2)\.[12]$/` | `a2.1` |
| course prefix (bank keys) | `PREFIX = /^(a1[12]\|a2[12]\|b1[12]\|b2[12])$/` | `a21` |
| lane | `LANE = sd1\|ga2\|ta2\|tb1\|dtz\|gb1\|tb2\|gb2\|oza1\|dtb2` | `tb1` |
| unit | `UNIT = /^(a1\|a2\|b1\|b2)\.[12]-u(0[1-9]\|1[0-2])$/` | `a2.1-u07` |
| Lernschritt | `STEP = UNIT + /-ls[1-8]/` | `a2.1-u07-ls3` |
| assessment container | `ASSESS = LEVEL + /-(p[1-3]\|ht-LANE\|dx-LANE\|m[abc]-LANE)/` — Plateau (`a2.1-p2`), Halbtest (`b1.1-ht-tb1`), Diagnose (`b1.2-dx-dtz`), Modelltest form (`b1.2-mb-gb1`) | `b1.2-p2` |
| Modelltest module file | `MODULE = ASSESS(m) + /-mod-(hoeren\|lesen\|sprachbausteine\|schreiben\|sprechen)/` | `b1.2-mb-gb1-mod-lesen` |
| exam text (a text, ad, sign, audio or image an exam block refers to) | `(STEP\|ASSESS)(-LANE)? + /-t\d{1,2}$/` — the lane infix is used in lane packs and in lane-specific Plateau files | `a2.1-u07-ls4-t1`, `a2.1-u07-ls4-ta2-t3`, `b1.2-p2-tb1-t2` |
| exam block | unit: `STEP + /-LANE-[a-z0-9]+$/` · assessment: `ASSESS + /-LANE-[a-z0-9]+$/` for Plateaus, `ASSESS + /-[a-z0-9]+$/` for Halbtest, Diagnose and Modelltest (the lane is already in the container) — the last segment is the Teil id | `a2.1-u07-ls4-ga2-h1`, `b1.2-p2-tb1-lv3`, `b1.1-ht-tb1-hv1`, `b1.2-ma-tb1-sa` |
| item | `STEP + /-(i\|s\|p\|r\|x)\d{2}/` (input, structured, practice, **reserve**, perception) · `UNIT + /-start-i01/` (the Folge gist item) · `UNIT + /-(c\|q)\d{2}/` (check, proof) · `BLOCK + /-\d{2}/` (exam items) · `STEP + /-g\d{2}/` (generated, compiler-assigned) | `a2.1-u07-ls1-p06`, `a2.1-u07-ls1-r02`, `a2.1-u07-c03`, `a2.1-u07-ls4-ga2-h1-02` |
| audio line | `(STEP\|UNIT-start\|TEXT) + /-l\d{2}/` | `a2.1-u07-ls1-l04`, `a2.1-u07-ls4-t1-l01` |
| micro-output | `STEP + /-mo$/` | `a2.1-u07-ls1-mo` |
| Redemittel | `UNIT + /-rm\d{2}/` | `a2.1-u07-rm01` |
| fact · Fokus-Karte | `UNIT + /-f\d{2}/` · `UNIT + /-fk\d/` | `a2.1-u07-f01` |
| asset (image or document) | `(UNIT\|ASSESS) + /-a\d{2}/` | `b1.2-u02-a01` |
| extra (one-off speaker, file-scoped) | `/^x\.[a-z0-9-]+$/` | `x.herr-winter` |
| can-do | `/^cd\.(a1\|a2\|b1\|b2)\.[a-z0-9-]+$/` | `cd.a2.mailbox-verstehen` |
| spine point · rule card · detector · text type · family | `g.<slug>` · `rc.<slug>` · `det.<slug>` · `tt.<slug>` · `fam.<slug>` | `g.reflexiv-akk` |
| lemma (global, one per lemma across all levels) | `/^lx\.[a-z0-9-]+$/` (ASCII-folded lemma; homographs `-2`) | `lx.sich-melden` |
| Teil template | `LANE + /\.[a-z0-9]+$/` | `ga2.h1`, `tb1.lv3`, `dtz.schreiben` |
| rubric profile | `<lane>-<teil>` or `course-micro`, `course-micro-sp` | `ga2-s2`, `tb1-sa` |
| cast member | `/^cast\.[a-z0-9-]+$/` | `cast.priya` |
| voice | an Azure voice name listed in `registries/voices.json` | `de-DE-KatjaNeural` |

**Bank keys** (writing bank, speaking bank, micro-outputs) — replaces the A-only `COURSE_TASK_KEY_RE` in
`netlify/functions/evaluate-writing.mjs`; the legacy pattern stays accepted for the live A1.1/A1.2:

```js
export const BANK_KEY_RE =
  /^(a1[12]|a2[12]|b1[12]|b2[12])-(u(?:0[1-9]|1[0-2])|p[1-3]|ht|dx|m[abc])-(w|s|mo)([1-8])?(?:-(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2))?$/;
export const LEGACY_COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/;
// allowance scope = first capture group + '-'  (e.g. 'a21-'); KEY-01 tests all 8 prefixes × every slot kind
// (u01–u12, p1–p3, ht, dx, ma–mc) × (w, s, mo, with and without a Teil digit) × (with and without a lane suffix)
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
the `-u` / `-p` scheme cannot collide with it. `exam_practice_results.source_id` = the exam block id (receptive Teile)
or the bank key (productive Teile), so every row names exactly one authored object. **Review card keys:** `word:<lexiconId>`,
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
  promptDe: de,                      // what the learner reads; the answer must follow from it (ITM-01); ≤ 90 chars
                                     // (TXT-04), except role 'exam': the level profile's examStemChars band
  promptEn: en?,                     // short task gloss; never the only cue (ITM-01)
  options: [str]{2..3}?,             // per-item options only: non-exam MC 3 (ITM-02); richtig_falsch/ja_nein/
                                     // listen_select 2; exam abc = the template's `options`. NEVER used for a
                                     // zuordnen, insert or word-bank cloze item: those answer from the block's `choices`
  tiles: [str]{2..8}?,               // sentence_building: the tiles ARE the cue; promptDe carries only the frame
  pairs: [[str, str]]{3..6}?,        // match
  audioLineRef: ref(line)?,          // dictation, listen_select, notes
  textRef: ref(text)?,               // exam items: the text they belong to (an ExamText id of the enclosing step or file)
  answer: str,                       // zuordnen / insert / word-bank cloze: a key of the block's `choices`, or its `noMatchKey`
  accepted: [str],                   // every correct form; sentence_building: every grammatical order (ITM-09)
  acceptedWhy: { [form: str]: de }?, // required for every non-obvious accepted form (ITM-10)
  caseSensitive: bool?,              // only where capitalisation IS the task (ITM-08)
  exact: enum(number|name)?,         // digits, times, dates, prices, phone numbers, spelled names (ITM-07)
  noMatch: bool?,                    // zuordnen: this slot's answer is the block's noMatchKey (must agree with `answer`)
  intentionalError: bool?,           // error_correction source sentence (exempt from LNG-01/02)
  perceptionOnly: bool?,             // perception drill tokens (exempt from LEX-03)
  explanation: LText,                // static feedback; de ≤ 25 words at A levels (ITM-11)
  hint: LText?,
  errorTag: ErrorTag?,               // error_correction: the error planted in the source sentence
  errorTags: [ErrorTag]*,            // what error class this item trains; feeds repair cards (ITM-12)
  difficulty: int[1..5]?,            // the author's estimate (design); the calibrated value lives in .build/ later
  banks: [enum(einstufung|plateau|mehr-ueben|repair)]*,   // reserve and check items: which draws may use it
  origin: enum(agent|generator),
  reviewerConfirmed: [str]*          // accepted forms confirmed after solver triage
}
```

`ErrorTag = enum(v2-inv|verb-final|satzklammer|case-np|case-pp|gender-article|adj-ending|perfekt-aux-participle|
connector-position|n-dekl|reflexive|register|spelling-meaning)` (BLUEPRINT §2.5).

**Gaps in exam texts.** A cloze or insert gap is marked in the ExamText as `⟦NN⟧`, where `NN` is the two-digit suffix
of the item that fills it (`…-l2-03` fills `⟦03⟧`); every item has exactly one marker and every marker one item (EXM-01).

The compiler maps an `Item` onto the existing pool shape consumed by `check.js`, `requeue.js`, `mastery.js` and
`reviewGrading` (`id, topic, type, questionDe, questionEn, options, answer, accepted, caseSensitive, explanationDe,
explanationEn, hint, minLektion`) and adds `exact`, which `checkOptionsFor(item)` passes to `checkAnswer()` once E1
extends the checker. For `sentence_building` it renders the live form
`questionDe = promptDe.replace(/\.$/, ':') + ' [' + tiles.join(' / ') + ']'` („Bilden Sie den Satz: [sich / Jan / …]"),
so the tile list is written once. **TXT-04 scope:** `promptDe`, a block's `instructionsDe`, `taskDe` and a
micro-output's `promptDe` are instructions (≤ 90 characters); scene-setting goes into the separate `situationDe`
fields. **Exempt:** exam item stems (`role: 'exam'`), which follow the level profile's `examStemChars`, and a Teil
template's `instructionsDe` (≤ 200 characters, shown on the Prüfungsmodus intro screen).

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
Line = { id: re(line), speaker: ref(cast) | ref(extra) | enum(ansage|radio|durchsage|pruefer), de: de, en: en,
         say: str?,          // TTS text where written ≠ spoken: „0341 58 27 90" → „null drei vier eins …" (AUD-02)
         seconds: num }      // generated (.build/ only)

// file-level, in any file that has lines (unit, lane pack, Plateau, closing, mock module)
Extras = { [id: re(extra)]: { role: de,                       // „Mitarbeiterin der Stadtbibliothek"
                              gender: enum(f|m|d), age: int?,
                              voice: ref(voice), rate: str?,
                              variety: enum(D|A|CH)? } }       // D-A-CH texts (e.g. B2.2 U11)
```

The anonymous speakers (`ansage`, `radio`, `durchsage`, `pruefer`) are for voices that do not name a person: a system
announcement, a station, a radio presenter, the recorded exam instructions. A line in which a speaker names themself
(„hier spricht Frau Klein") must use a cast member or an extra (AUD-05), so five callers in one Hören Teil get five
voices, each with a gender that matches the text. `pruefer` is an internal speaker id and never shown; learner-facing
text calls the AI's exam role „Gesprächsleitung (KI)" (LGL-01).

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

### 3.5 Asset (images and documents, BLUEPRINT §4.9)

```js
Asset = {
  id: re(asset), kind: enum(image|document),
  altDe: de, altEn: en?,                       // AST-01
  depicts: enum(fictional-person|real-person|real-place|object|document|scene),
  source: enum(generated|licensed|own),
  licence: { name: str,                        // 'own-generated', 'CC BY 4.0', a stock licence name
             holder: str?, url: url?, attribution: str?, coversDepiction: bool? },   // AST-02 for real-person
  prompt: str?,                                // required when source = generated; fictional people and documents only
  status: enum(planned|produced|approved)      // set by the image pipeline step; only 'approved' may ship
  // generated: url, width, height, bytes (.build/ only)
}
```

Assets are declared in the file that uses them (`assets: [Asset]*` on units, lane packs, Plateaus, closing and mock
files) and referenced by `imageRef` / `assetRef`. A generated image never shows a real person, a real brand, a real ID
document design or a real exam sheet (AST-02); a Porträt of a real person without a `licensed` asset whose licence
`coversDepiction` is text-only.

### 3.6 ExamText (the source texts an exam block refers to)

```js
ExamText = { id: re(text), kind: enum(audio|text|ad|sign|form|image|document), title: de?,
             lines: [Line]?, text: de?, assetRef: ref(asset)?,      // image/document: the asset; sign/form may add text
             glosses: [{ token: str, gloss: EnText }]{0..3} }
```

ExamTexts live **at step or file level** (`PruefungStep.texts`, a Situation/Text step's `texts`, a lane-pack slot's
`texts`, a Plateau's, closing file's or mock module's `texts`), written by the S role (BLUEPRINT §10.5); blocks refer to
them by id (`textRefs`, `Item.textRef`, `choices[].textRef`).

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
                                  // exactly one intro per point (GRM-02); a later return is listed as `review` in the
                                  // unit spec; a genuinely different function gets its own point (e.g.
                                  // g.partizip-attr-einfach B1.2 U2 vs g.partizip-attr-erweitert B2.1 U6)
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
  delivery: enum(paper|digital|both),        // paper: no word counter in Prüfungsmodus (BLUEPRINT §2.3)
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
  items: int?,
  options: int?,                     // per-item options (abc: 3; R/F: 2)
  choices: int?,                     // block-level choice set, excluding the no-match key: tb1.lv3 12 ads,
                                     // gb1.l3 10, tb1.sb2 15 words, gb2.l2 8 sentences, gb2.l1 4 people,
                                     // gb2.l4 8 opinions, gb2.l5 7 headings, ga2.h2 9 pictures, ta2.h3 9 places
  choiceKind: enum(text|heading|ad|person|word|sentence|picture|place|opinion)?,
  choiceReuse: bool?,                // true where one choice may answer several items (gb2.l1: 9 statements → 4 people)
  noMatch: enum(X|0|x)?,             // the no-match key, if the Teil has one
  plays: int[1..2]?, readingSeconds: int?, minutes: num?,
  textType: ref(texttype), textWords: [int, int]?, textWordsSource: enum(official-sample|design),
  words: { target: int?, min: int?, max: int? }?, leitpunkte: int?, choose: { from: int, pick: int }?,
  register: enum(informell|halbformell|formell)?,
  interaction: enum(cards-ask|cards-request|group|get-to-know|monologue|plan-together|discuss|photo|
                    feedback-question|mediate)?,        // signed off by the Prüferin W2 reviewer (EXM-04)
  speaking: { stimulus: enum(none|text|quotes|calendar|topicChoice)?, partnerData: bool?,
              topicChoice: { from: int, pick: int }?, seconds: [int, int]?, turns: [int, int]? }?,
  prepMinutes: int?, prepAtHome: bool?,  // tb2.m1: topic from 7, prepared before the session
  rubric: ref(rubric)?, points: num,
  pictorial: bool,                   // the official Teil uses pictures, photos or documents (BLUEPRINT §4.9)
  textVariantDe: de?,                // pictorial only: how the .1 text variant replaces the picture
  instructionsDe: de,                // OUR paraphrase of the official instructions — never the official wording (LGL-05)
  paraphraseOf: str,                 // source note: document and page of the official instruction paraphrased
  scaffold: { minItems: int, textWords: [int, int], playsFixed: bool, optionsFixed: bool,
              choicesMin: int? }?,   // limits for length: reduced|mini (EXM-01, TXT-02); required if scaffoldAllowedIn ≠ []
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
  method: enum(ai|deterministic),   // deterministic: form tasks (sd1-s1, ta2-s1), no AI call; courseFacts counts
                                    // „KI-ausgewertete Aufgaben" from this field (BLUEPRINT §1.2)
  max: num,                         // the scored maximum, i.e. the sum over criteria with scoredBy ≠ notAutoScored
  examMax: num,                     // the official maximum, incl. notAutoScored criteria (for range widening, §5.6)
  criteria: [{ id: str, label: de, per: enum(task|leitpunkt|turn|part)?, levels: [num], weight: num?,
               scoredBy: enum(ai|deterministic|notAutoScored),   // Aussprache/Intonation: always notAutoScored
               descriptors: [{ points: num, de: de }]* }],       // one per entry of `levels`, OUR wording, never the
                                                                 // official descriptor text; required when scoredBy = ai;
                                                                 // authored by the W2 rubric agents, approved by the
                                                                 // calibration reviewer
  bands: [{ label: str, min: num, max: num }]*,   // scaled lanes: dtz-s B1 15–20, A2 7–14; dtz-sp B1 75–100, A2 35–74.5
  errorPolicy: { [band: enum(a1|a2|b1|b2)]: { [tag: ErrorTag]: enum(flag|score) } },   // BLUEPRINT §2.5;
                                                  // a tag not listed for a band defaults to 'score'
  zeroRules: [str]*,        // ids of pure functions in netlify/functions/_shared/rubrics/rules.mjs (EXM-08)
  capRules: [str]*,
  spelling: enum(scored|only-if-meaning-suffers|not-scored),
  feedbackLanguage: [enum(de-a1|de-a2|de|en)],
  modelId: str | null,      // pinned; null for method: deterministic; any change re-runs CAL-01/02
  splitVerified: bool,      // false where the official split is reconstructed
  calibration: { status: enum(pending|anchors-pass|human-pass|not-applicable), rangeBands: num },
  source: url }
```

The server copy of a profile (`netlify/functions/_shared/rubrics/<id>.mjs`) sends only the `scoredBy: ai` criteria,
their descriptors, the bands and the error policy to the model; `deterministic` criteria are computed in code and
`notAutoScored` criteria are returned as `{ scored: false }` and rendered „nicht automatisch bewertet".

### 4.6 Level profiles — `level-profiles.json`

```js
{ $schema: 'course-v2/levels@1',
  levels: [{ level: re(LEVEL), band: str, skeleton: enum(A|B),
             steps: [enum(situation|text|sprache|pruefung|sprechen|schreiben|ueberarbeiten|check)],
             minutes: { [stepKind]: int, reviewPerDay: int },
             sentence: { meanWordsMax: num, maxWords: int, subordinateClausesMax: int? },
             lexis: { newPerUnit: [int, int], productiveShare: num, offListMax: num, coverageMin: num },
             review: { budgetMinutes: int, secondsPerReview: int, firstReviewCeiling: int,
                       carryOverMinutes: num },                       // BLUEPRINT §2.6 (0 at A1.1)
             pool: { size: 16, served: 12, reserve: [4, 6], generatedMax: num, mix: object },
             examStemChars: [int, int],                               // exam item stems (TXT-04 exemption)
             microOutput: { seconds: [int, int], words: [int, int] },
             ruleCardMaxWords: int, partnerSupport: str,
             feedbackLanguage: [str] }] }
```

### 4.7 Text types, detectors, casts

```js
// text-types.json
{ notes: [str]?,
  types: [{ id: re(texttype), label: de, parts: [enum(betreff|anrede|gruss|einleitung|schluss|datum|unterschrift)]*,
            lengthByLevel: { [level]: { input: [int, int], writing: [int, int]? } } }] }
      // words; input = a course input of this type (capped at TXT-03), writing = the editor's recommended band for a
      // learner text (absent: input only at that level); exam texts follow the Teil template's textWords (TXT-02).
      // Amended 2026-09-27 on the W2 DaF-progression review (split input/writing, semantics in `notes`), RAILS §7.9.
// detectors.json  (extends src/data/curricula/constructions.js; E0-4 owns it)
{ detectors: [{ id: re(detector), construction: str, precision: enum(exact|heuristic|advisory),
                method: enum(token|pattern|lexicon|clause), spec: object }] }
// casts/series.json  +  casts/<band>.json
{ members: { [castId]: { name: str, age: int?, from: str?, languages: [str]*, role: de,
                         exam: { lane: ref(lane), arc: de }?, voice: { azure: str, rate: str }, bands: [str] } },
  relations: [{ a: ref(cast), b: ref(cast), address: enum(du|Sie), since: ref(unit)? }] }
// casts/series.json additionally fixes every cross-course beat in P0 (BLUEPRINT §2.7)
{ beats: [{ from: ref(unit), to: ref(unit), cliffhanger: de, resolution: de, recapDe: de }] }
      // from = a course's U12, to = the next course's U01; recapDe = the stand-alone line for new buyers
// registries/voices.json  (story architect)
{ voices: { [voice: str]: { gender: enum(f|m|d), locale: enum(de-DE|de-AT|de-CH), ageBand: enum(young|adult|older) } } }
// registries/style.json  (level-profile agent; read by LNG-02 allowlists, `accepted` generators and pre-checks)
{ time: { running: str, accept: [str] },        // „11.15 Uhr", accept also „11:15"
  quotes: { primary: '„…"', secondary: '‚…\'' }, duInLetters: enum(lower|upper), gender: enum(pair|neutral-participle),
  sz: { D: 'ß', A: 'ß', CH: 'ss' }, phone: str, price: str, date: [str] }
```

### 4.8 Global lemma registry — `lemmas.json`

```js
{ $schema: 'course-v2/lemmas@1',
  lemmas: { [id: re(lexicon)]: { lemma: de, pos: str, homograph: int?,
                                 allocatedTo: re(LEVEL), role: enum(productive|receptive),
                                 promotedAt: [{ level: re(LEVEL), unit: ref(unit) }]* } } }
```

Written only by the orchestrator's `scripts/course-v2/lex/register.mjs` after each band's allocation (BLUEPRINT
§2.6); one id per lemma across all eight levels, so `word:<lexiconId>` card keys never collide.

### 4.9 Proper names — `names.json`

```js
{ $schema: 'course-v2/names@1', version: 1,
  names: [{ form: de,                               // as written: 'Leipzig', 'Cospudener See', 'Elster-Reisen'
            kind: enum(place|person|org|brand|event),
            level: re(LEVEL),                      // the first level whose texts may use the name
            note: str? }]* }                       // `form` unique (case-insensitive)
```

The places, people, organisations, brands and events a text may name that are **not** cast members (a cast
member's `name` and `from` are known anyway) and not a file's one-off speakers (`extras`, §3.5). LEX-01 and
LEX-03 count every token of a listed name as known from its `level` on, with its genitive -s (*Leipzigs*) and
adjectival -er (*Leipziger*, *Cospudener*); a token ending in -e inside a multi-word name takes the adjective
endings (*in der Sächsischen Schweiz*). An irregular derivative is a name of its own (*Münchner*).
- **The lexicon outranks the list**, as it outranks the core: a token some `lexicon.json` allocates is known only
  from that unit on (*Österreich*, *Schweiz*: a1.1-u12).
- **Only the proper part.** Where a name's other words are common nouns, list the proper part (*Warentest*, not
  *Stiftung Warentest*): the list must never become the way around LEX-01.
- `level`: `a1.1` for countries, German states, the D-A-CH capitals and major cities and the series city
  (Leipzig); otherwise the level at which a plan or a unit first uses the name.

Checked by `scripts/course-v2/lib/schemas/names.mjs` (matched by `$schema` or by file name); read by
`scripts/course-v2/lib-validate/lexicon.mjs` (`namesOf`, `nameForms`). Content agents propose additions; the
lexicon owner adds them.

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
    aufgabe: { submittedWhen: { writingMinShareOfLowerBound: 0.5, formAllFieldsNonEmpty: true,
                                speakingMinSeconds: 20,        // detected speech, measured server-side (course_ai_usage)
                                cardModeMinTurns: 2 } },
    unit: { completeWhen: ['lernschritte-finished-or-tested-out', 'aufgaben-submitted'] , testOutThreshold: 0.8 },
    course: { required: [{ kind: 'unit', status: 'complete', count: 12 },
                         { kind: 'plateau', status: 'submitted', count: 3 },
                         CLOSING],
              neverRequired: ['score', 'fokus', 'mehr-ueben', 'extensive', 'diagnose', 'modelltest:b', 'modelltest:c'] } },
       // CLOSING = { kind: 'halbtest', lane: 'learner', status: 'submitted' }                  for kind 'dot1'
       //         = { kind: 'modelltest', form: 'a', lane: 'learner', status: 'submitted' }     for kind 'dot2'
       // ('learner' = the lane in the learner's learner_goals row for this band; the Diagnose never satisfies it)
  review: { ladderDays: [int], examCapShare: num, budgetMinutes: int, firstReviewCeiling: int,
            secondsPerReview: int,
            graduateAfterDays: 60,                      // a successful +60 retrieval retires the card (BLUEPRINT §6.1)
            examCriticalKinds: ['teil', 'sentence'],    // stay on +60 until the exam date (Redemittel, teil cards)
            carryOverMinutes: num },                    // separate budget for earlier half-levels' cards
  pace: { leicht: { unitsPerWeek: 0.5, learningDays: 3 }, standard: { unitsPerWeek: 1, learningDays: 4 },
          intensiv: { unitsPerWeek: 2, learningDays: 6 } },   // the v2 plan converts these to Lernschritte per week
  targets: { newWords: [int, int], productiveShare: num, aufgaben: int, microOutputs: int },
  einstufung: { fromUnits: [4, 8, 12], itemsPerUnit: 4, itemTypes: 'deterministic',
                routing: { testOutMin: 0.8, recommendDot2Min: 0.8 } } }   // BLUEPRINT §5.7; pinned by a test
```

`completion` is the **single definition** read by the course home, the Teilnahmebescheinigung, the reminder view and
`weekly_truth_metrics()` through one function, `src/lib/course-v2/completion.js` (PRG-02); the completion test pins
both `CLOSING` forms and that a submitted Diagnose leaves a .2 course incomplete. Nothing below the authored fields
lives in `course.json` any more: `minutesPlanned`, `reviewMinutesByPace` (current + carry-over), `minutesMeasured`,
`counts` and `contentHash` are in `<level>/.build/course.facts.json` (§13).

## 6. `lexicon.json` (one per level; the level's allocation of global lemma ids, authored before the units)

```js
{ $schema: 'course-v2/lexicon@1', level: re(LEVEL),
  entries: [{ id: re(lexicon), lemma: de,
              pos: enum(NOUN|VERB|ADJ|ADV|PREP|CONJ|PRON|DET|NUM|PHRASE|INTJ),
              article: enum(der|die|das)?, plural: str | null ?, plural_kind: enum(regular|singular-only|plural-only)?,
              feminine: str?,                         // one entry for the pair, as Goethe counts
              verb_forms: { '2sg': str?, '3sg': str, praet: str?, perfekt: str? }?,   // 2sg required where the stem
                                                      // vowel changes (Vokalwechsel detector, BLUEPRINT §9.3)
              separable: bool?,
              reflexive: enum(akk|dat)?, rection: str?, variety: enum(D|A|CH)?,
              role: enum(productive|receptive), unit: ref(unit), block: int[1..4],
              list_ref: str,                          // 'A1'|'A2'|'B1'|'derived:<head>'|'compound:<a+b>'|'off-list:<reason>'|'freq:<band>'
              freq_rank: int?, gloss: EnText, example: de, exampleEn: en?,
              wordId: null }],                        // filled at integration in the compiled output (one SQL lemma match)
  promotions: [{ lemma: ref(lexicon), from: 'receptive', to: 'productive', unit: ref(unit) }]* }
```

`id` is the **global** id from `registries/lemmas.json` (§4.8); an entry may only allocate a lemma that no lower level
has allocated, and a lemma already allocated receptively at a lower level becomes productive here only through
`promotions` (the dedupe step rejects anything else). LEX-01 reads the **cumulative** allocation: every lower level's
`lexicon.json` + earlier units + this unit. `list_ref` values come from the private reference table
`private/list-ref.json` (never committed; materialised from an environment secret by the session-start hook and
queried only through `node scripts/course-v2/lex/list-ref.mjs <lemma…>`, which prints tags, never the list;
BLUEPRINT §2.6); the values in §15 are illustrative.

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
  stage: enum(spec|S|I|T),                           // the role that last completed its run (§8.1)
  title: { de: de, canDo: de },                      // canDo = learner-facing can-do title in Sie
  spec: UnitSpec,
  start: Start,
  steps: [Step]{7} | [Step]{8},                       // A skeleton 7, B skeleton 8 (level profile)
  check: Check,
  redemittel: [{ id: re(rm), de: de, en: en, function: de, forTemplate: ref(template)? }]{2..8},
  story: { beat: de, cliffhanger: de, castIn: [ref(cast)] },
  fokus: [Fokus]{0..2},
  facts: [Fact]*,
  extras: Extras?,                                   // one-off speakers of this file (§3.3)
  assets: [Asset]* }                                 // images and documents this file uses (§3.5)
  // no generated fields: minutesPlanned, reviewCards and contentHash are in .build/units/uNN.json (§13)

UnitSpec = {
  situation: de,
  handlungsfeld: [str],
  canDos: [ref(cando)]{3..5},
  grammar: { new: [ref(spine)]{0..2}, chunk: [ref(spine)]{0..1}, review: [ref(spine)]* },   // GRM-01, GRM-02
  lexiconBlocks: [{ title: de, lemmas: [ref(lexicon)]{6..20} }]{3..4},                       // = lexicon.json allocation (B2: 60–70 new words = 3–4 blocks of 15–18)
  textTypes: [ref(texttype)],
  lanes: { primary: ref(lane),
           pruefungsfokus: [{ template: ref(template), length: enum(full|reduced|mini),
                              modeDefault: enum(lern|pruefung),
                              slot: enum(ls4|sprechen|schreiben|input),   // exactly one slot (EXM-11)
                              step: ref(step)? }]{2..4},                  // required when slot = 'input' (A: LS3; B: LS1/LS2)
           spur: { [lane: str]: [ref(template)] } },
  lehrwerk: [str]*, deviation: { reason: str } | null,     // ALL-03: ≥ 2 verified placements or a deviation
  cast: [ref(cast)],
  fokusPlan: [{ kind: enum(daz|daf|beruf), title: de, hf: str }]*,   // the §2.8 Fokus column (ALL-04)
  source: { w2Draft: str? } }

Start = {
  lernziele: [ref(cando)]{3..5},                     // = spec.canDos
  pruefungsfokusChips: [ref(template)],
  recapDe: de?,                                      // U01 only: the stand-alone recap line (casts/series.json beat)
  folge: { title: de, lines: [Line]{2..12}, gistItem: Item },   // ≤ 90 s A1, ≤ 2 min above (TXT-03)
  auftakt: { assetRef: ref(asset)?, promptDe: de, microOutput: MicroOutput }?,   // B skeleton only; no photo → prompt only
  testOut: { offered: bool } }

Step = SituationStep | TextStep | SpracheStep | PruefungStep | SprechenStep | SchreibenStep | UeberarbeitenStep | CheckStep

SituationStep = {                                    // A: LS1–LS3
  id: re(STEP), kind: 'situation', title: de,
  structure: ref(spine) | null, modelSentence: de, ruleCard: ref(rulecard),
  warmup: { draw: 6, contrastWith: ref(spine)? },
  input: Input,
  texts: [ExamText]*,                                // only where this input carries an exam block (slot 'input')
  inputItems: [Item]{5},                             // role gist ×2, detail ×3
  examBlock: ExamBlock?,                             // slot 'input': replaces inputItems with a mini/reduced block
  structuredInput: [Item]{4},
  pool: { items: [Item]{9..16}, generators: [GeneratorSpec]* },   // items + generated = 16 (ITM-06)
  reserve: [Item]{4..6},                             // never served in this LS; feeds requeue, earlierDraw, Plateaus,
                                                     // Mehr üben, repair cards, the Einstufung (BLUEPRINT §3.3)
  microOutput: MicroOutput,
  aussprache: { focus: de, perception: [Item]{4} | GeneratorSpec, readAloud: { lineDe: de } }?,
  endLine: de }

TextStep = SituationStep with kind: 'text', structure: null, modelSentence optional and
           structuredInput: [Item]{0..4} (optional: B grammar is inductive in LS3)          // B: LS1–LS2
SpracheStep = { id, kind: 'sprache', ruleTable: { rows: [[str]], blanks: [[int, int]] }, ruleCard: ref(rulecard),
                pool: {…}, reserve: [Item]{4..6}, cloze: [Item]*, redemittelFor: [ref(template)], endLine: de }   // B: LS3

Input = {
  kind: enum(dialog|monolog|text|mixed), title: de, textType: ref(texttype),
  lines: [Line]{1..14}?, text: { de: de, en: en? }?,
  glosses: [{ token: str, gloss: EnText }]{0..3},
  transcriptAfterUnaidedListen: bool }

MicroOutput = {
  id: re(mo), bankKey: re(BANK_KEY), mode: enum(spoken|written), profile: enum(course-micro|course-micro-sp),
  situationDe: de?, promptDe: de, promptEn: en, planSeconds: int, seconds: [int, int]?, words: [int, int]?,
  targets: [ref(spine)], register: enum(du|Sie) }

PruefungStep = {                                     // LS4
  id, kind: 'pruefung',
  texts: [ExamText]*,                                // written by S (source texts of the blocks, §3.6)
  blocks: [ExamBlock]{1..2},                         // written by T; absent before stage T
  strategyCards: [{ template: ref(template), de: de, en: en }]   // de ≤ 60 words (design, inherited from A1.1)
}

ExamBlock = {
  id: re(block), template: ref(template), lane: ref(lane),
  length: enum(full|reduced|mini), scaffolded: bool, modeDefault: enum(lern|pruefung),
  instructionsDe: de,                                 // ≤ 90 chars; the template's `instructionsDe` (our paraphrase)
                                                      // holds the full wording; neither copies the official text
  textRefs: [ref(text)],                              // the step's or file's ExamTexts this block uses
  choices: [{ key: str, de: de?, textRef: ref(text)?, imageRef: ref(asset)? }]*,
                                                      // block-level choice set (zuordnen, insert, word-bank cloze);
                                                      // count, kind and reuse = template `choices`/`choiceKind`/
                                                      // `choiceReuse` (or its scaffold for reduced/mini) (EXM-01)
  noMatchKey: str?,                                   // = template `noMatch` ('x', 'X', '0'); never also a choice key
  items: [Item],                                      // role 'exam'; count/options/plays = template (EXM-01)
  answerSheet: bool? }

SprechenStep  = { id, kind: 'sprechen',  task: SpeakingTask }
SchreibenStep = { id, kind: 'schreiben', task: WritingTask }
UeberarbeitenStep = { id, kind: 'ueberarbeiten', of: ref(bank), endLine: de }   // B: LS7
CheckStep = { id, kind: 'check', endLine: de }                                  // renders `check`

SpeakingTask = SpeakingPart & SpeakingCommon            // one Teil
             | { parts: [SpeakingPart]{2..3} } & SpeakingCommon   // a multi-Teil round (A1.2 U12 Sp1–Sp3;
                                                                   // B1.2 U2 gb1 Sp2 + Sp3); EXM-04 checks each part

SpeakingCommon = {
  bankKey: re(BANK_KEY), lane: ref(lane),
  aiRole: { name: str, personaDe: de, register: enum(du|Sie),
            support: enum(slow-wordbank|repeat-on-request|clarify|learner-leads|examiner|interrupts) },
                                                      // `examiner` is an internal id; the UI says „Gesprächsleitung (KI)"
  openingLine: de, hintWords: [str]{0..8},
  modelTurns: [{ speaker: enum(learner|partner), de: de }],   // shown only after the learner's attempt
  originLabelDe: de? }                                        // set when shown to a learner of another lane (COV-6)

SpeakingPart = {
  template: ref(template),
  mode: enum(cards-ask|cards-request|group|get-to-know|monologue|plan-together|discuss|photo|feedback-question|mediate),
  profile: ref(rubric), prepMinutes: int, prepAtHome: bool?,   // = the template (EXM-04)
  instructionsDe: de, situationDe: de?,
  cards: { learner: [Card]*, partner: [Card]* }?,              // Card = de | { de: de?, imageRef: ref(asset) }
  photos: { learner: ref(asset), partner: ref(asset)? }?,      // dtz.s2: a different photo per candidate
  slides: [de]{5}?,
  stimulus: { kind: enum(text|quotes|calendar), de: de?, items: [de]* }?,   // tb2.m2 text; tb1.m2 two quotes
  partnerData: { kind: enum(calendar|notes|card), de: de?, items: [de]* }?,  // info gap: the AI partner's side,
                                                                             // never shown to the learner (ga2/ta2 Sp3)
  topicChoice: { from: int, pick: int, topics: [de] }?,        // gb1.sp2, gb2.sp1 1 of 2; tb2.m1 1 of 7 (at home)
  keyPoints: [de]*,                                            // required for mode 'mediate' (scored on coverage)
  seconds: [int, int]?, turns: [int, int]?,                   // target length within the template band; also the
                                                               // hard session length for the minute allowance
  moves: [enum(vorschlagen|reagieren|widersprechen|einigen|verteilen)]*,
  planningRound: { minutes: int, moves: [str] }? }            // every B1 unit (BLUEPRINT §2.8)

WritingTask = {
  bankKey: re(BANK_KEY), lane: ref(lane), template: ref(template), examKey: str,   // = the lane's examKey
  profile: ref(rubric), register: enum(informell|halbformell|formell), address: enum(du|Sie),
  title: de, situationDe: de, taskDe: de,
  leitpunkte: [{ id: str, de: de, cues: [str] }],      // count = template; Anrede/Gruß never a Leitpunkt (EXM-03)
  choose: { from: int, pick: int }?,
  form: { fields: [{ id: str, labelDe: de, answer: str, accepted: [str], exact: enum(number|name)? }],
          documents: [ref(asset)]* }?,                  // form_fill tasks (sd1.s1, ta2.s1): method deterministic
  wordBand: [int, int]?, wordBandLearning: [int, int]?, minSubmitWords: int?,   // required unless `form`
  checklist: [de], modelText: de,                      // model text shown only after the learner's revision
  originLabelDe: de? }

Check = {
  lines: [Line]*,                                      // audio for dictation / proof items; ids = the check step's STEP-lNN
  items: [Item]{7..9},                                 // this unit's check items (c); items + earlier = 12 (BLUEPRINT §3.1)
  earlierDraw: { count: int[3..5], from: enum(previous-3|etappe|all-previous), pool: 'reserve' },
                                                       // drawn at runtime by the unit builder from the compiled reserve
                                                       // index — never an item id of another unit file
  proofItems: [Item]{0..5},                            // proof items (q): one per receptive can-do, scored apart from the 12
  proofs: [{ canDo: ref(cando), item: ref(item)? , aufgabe: enum(sprechen|schreiben)? }]{3..5},
  rueckschau: [ref(rulecard)]{1..3}?,                  // B skeleton only (required there): the Grammatik-Rückschau
  portrait: { factRef: ref(fact), de: de, en: en, assetRef: ref(asset)? }?,
                                                       // B skeleton only (required there); text-only unless AST-02 holds
  testOutThreshold: num, cumulativeShare: num }

Fokus = { id: re(fokus), kind: enum(daz|daf|beruf), title: de, hf: str?, bodyDe: de, bodyEn: en,
          factRefs: [ref(fact)]*, minutes: int, optional: true }
```

### 8.1 Stage schema (what SCH-01 requires at each `stage`)

| `stage` | Written by | Required (in addition to the earlier stages) | Must be absent |
|---|---|---|---|
| `spec` | curriculum agent | `id`, `level`, `nr`, `etappe`, `version`, `status`, `title`, `spec` | everything else |
| `S` | S „Szene & Text" | `start` (without `gistItem`), every step's `id`/`kind`/`title`, inputs with lines and `say`, `texts` of PruefungStep and of any step with slot `input`, `story`, `fokus` (the `fokusPlan` cards), `facts`, `extras`, `assets`, `redemittel` | items, pools, reserves, blocks, tasks |
| `I` | I „Items" | `gistItem`, `inputItems`, `structuredInput`, `pool`, `reserve`, `check` (items, `earlierDraw`, proofs, `rueckschau`, `portrait`), perception items | `blocks`, `examBlock`, tasks, micro-outputs |
| `T` | T „Prüfungsaufgaben" | `blocks`, `examBlock` where slotted, strategy cards, micro-outputs, `SprechenStep.task`, `SchreibenStep.task` | — |

`validate.mjs --stage S|I|T` runs the stage schema plus the rule subset of BLUEPRINT §9; `--stage T` (= `all`) is the
full gate set, required after T and after every fix run.

## 9. Lane pack file — `units/uNN.lane-<lane>.json`

```js
{ $schema: 'course-v2/lanepack@1', unit: ref(unit), lane: ref(lane), version: int,
  status: enum(draft|review|approved), reviewedIn: str | null,
  slots: {
    ls4: { mode: enum(replace|add), texts: [ExamText]*, blocks: [ExamBlock], strategyCards: [...] }?,
    input: { step: ref(step), texts: [ExamText]*, examBlock: ExamBlock }?,   // a lane-exact block for a slot-'input' Teil
    sprechen: SpeakingTask?,           // lane-exact variant; absent → the primary task with originLabelDe (.1 only)
    schreiben: WritingTask? },
  originLabels: { sprechen: de?, schreiben: de? },   // used in .1 when the primary task is shown instead
  extras: Extras?, assets: [Asset]* }
  // no generated fields; the content hash is in .build/ (§13)
```

A lane pack is written in one run by its Spur author and is validated with the full gate set (no stages).

A learner sees exactly one block per slot: the lane pack's block if the pack has one for that slot, else the primary
block (with its origin label in a .1 course; in a .2 course a missing lane-exact slot fails COV-6).

## 10. Plateaus, closing blocks, Modelltests

```js
// plateaus/pN.json — the primary lane's Plateau
{ $schema: 'course-v2/plateau@1', id: re(ASSESS), level: re(LEVEL), after: ref(unit), lane: ref(lane),
  review: { draw: 20, currentShare: 0.65, from: 'reserve' },  // drawn from unit reserves by the compiler (§13)
  texts: [ExamText]*,                                   // ids LEVEL-pN-<lane>-tN
  examTeile: [ExamBlock | WritingTask | SpeakingTask]{4..5},
                                                        // exactly one entry per module of the lane (Hören, Lesen,
                                                        // Schreiben, Sprechen; + Sprachbausteine for telc); full length
                                                        // in .2; block ids LEVEL-pN-<lane>-<teil>, bank keys
                                                        // <prefix>-pN-(w|s)[n]-<lane>
  productive: WritingTask | SpeakingTask,               // the separate task repeating the type of three weeks earlier
  reward: { lesemagazin: { title: de, text: de, items: [Item]{3..5} }?, hoermagazin: { title: de, lines: [Line],
            items: [Item]{3..5} }?, scene: { lines: [Line] }?, projekt: { promptDe: de, microOutput: MicroOutput }? },
  extras: Extras?, assets: [Asset]* }

// plateaus/pN.lane-<lane>.json — a secondary lane's Plateau Teile (built with its pack)
{ $schema: 'course-v2/plateaulanepack@1', plateau: re(ASSESS), lane: ref(lane), version: int,
  status: enum(draft|review|approved), reviewedIn: str | null,
  texts: [ExamText]*,                                   // ids LEVEL-pN-<lane>-tN
  examTeile: [ExamBlock | WritingTask | SpeakingTask]{4..5},   // one per module of that lane, lane-exact
  productive: WritingTask | SpeakingTask?,              // absent → the primary task with its origin label (.1 only)
  extras: Extras?, assets: [Asset]* }

// closing/halbtest-<lane>.json  (.1) · closing/diagnose-<lane>.json (.2, free)
{ $schema: 'course-v2/closing@1', id: re(ASSESS), level: re(LEVEL), lane: ref(lane), kind: enum(halbtest|diagnose),
  mode: enum(lern|pruefung), texts: [ExamText]*,
  parts: [ExamBlock | WritingTask | SpeakingTask],      // block ids LEVEL-ht-<lane>-<teil> / LEVEL-dx-<lane>-<teil>
  extras: Extras?, assets: [Asset]* }
  // halbtest: every Teil of the lane, ≈ half the items (each block within its template's scaffold); diagnose: one
  // full-length Teil per module

// mocks/<lane>/<form>/<module>.json  (.2 only; one agent per module)
{ $schema: 'course-v2/mockmodule@1', id: re(MODULE), level: re(LEVEL), lane: ref(lane), form: enum(a|b|c),
  module: enum(hoeren|lesen|sprachbausteine|schreiben|sprechen), minutes: int, texts: [ExamText]*,
  parts: [ExamBlock | WritingTask | SpeakingTask],      // block ids LEVEL-m<form>-<lane>-<teil>
  answerSheet: bool?, extras: Extras?, assets: [Asset]* }
```

## 11. Calibration anchors and QA results

```js
// content/course-v2/anchors/<profile>/<id>.json   — our own texts only; official samples live in private/
{ $schema: 'course-v2/anchor@1', id: str, profile: ref(rubric), task: ref(bank),
  text: de?, transcript: de?, errorHeavy: bool,
  expected: { [criterion: str]: num }, humanRatingRef: str?,   // key into the private human-rating store
  verifiedBy: enum(examiner|merlin|none),     // 'human-verified' = examiner or a MERLIN text of the same band
  merlinRef: str?,                            // key into private/merlin/ (evaluation data, never shipped)
  author: str }
  // CAL-01 counts only anchors with verifiedBy ≠ 'none' toward a lane going live (BLUEPRINT §1.4, §4.6);
  // speaking anchors stay 'none' (regression only) until pilot recordings are rated

// content/course-v2/qa/<level>/<fileId>.<gate>.json   — written by pipeline runners only
{ $schema: 'course-v2/qa@1', file: str, contentHash: str,
  gate: enum(SOL-01|SOL-02|SOL-03|CAL-01|CAL-02|LGL-05|LEX-06), modelIds: [str], ranAt: date,
  results: [object], summary: { pass: bool, counts: object } }
```

## 12. Who reads what

| Consumer | Reads (compiled forms) | Never reads |
|---|---|---|
| **Player** (`src/lib/course-v2`, `src/components/course-v2`) | `course.json` (units, Etappen, completion, review, pace); the unit (start, steps, check, story, fokus); the lane pack for the learner's lane; rule cards; lexicon glosses (tap gloss); audio manifest; approved asset URLs; the compiled reserve index (requeue, `earlierDraw`, Mehr üben, repair cards); level profile (support, minutes) | answer-key-free server data; anchors; QA |
| **Validator** (`scripts/course-v2/validate.mjs`, read-only) | everything in `content/course-v2/**` at the file's declared `stage`, the level profiles, the detectors, the style sheet, the voices registry, the global lemma registry, the ids ledger | private tables (pipeline only); it never writes a file |
| **Syllabus / Inhaltsverzeichnis page** (Astro + SPA twins) | `course.json`, unit `title`, `spec.handlungsfeld`, can-do `de` texts, spine `label`s, text-type `label`s, `spec.lanes.pruefungsfokus` per live lane, `minutesPlanned`/`minutesMeasured` from `.build/` | items, keys, tasks |
| **Writing grader** (`evaluate-writing`) | the writing bank shard (task by `bankKey` + `examKey`, incl. each Leitpunkt's `cues` and `choose` for the server pre-check twin), the server copy of the rubric profile (descriptors, bands, `errorPolicy`, `scoredBy`), the zero/cap rule functions, the level's feedback language, `_shared/entitlement.mjs` | unit texts, model texts, client prompts |
| **Speaking functions** | the speaking bank shard (task by `bankKey`, incl. `parts`, `stimulus`, `partnerData`, `keyPoints`, `seconds`/`turns`), the rubric profile, the lane's prep minutes, `_shared/entitlement.mjs` (attempts and minutes) | client-supplied task text (legacy `courseTask` only for the live course) |
| **Scorers** (`src/services/examRules/<lane>.js`) | the lane's `scale`, `passRule`, `blueprint` | AI output for deterministic parts |
| **Review service** | card keys (§2) and the compiled card index | — |
| **Plan / board** | `course.json` pace and review, `.build/course.facts.json` (review minutes incl. carry-over), `learner_goals` (the learner's band), `exam_practice_results`, deterministic Teil values | AI scores as plan inputs (PRG-04) |
| **Einstufung** | the compiled fixed form per band (`.build/einstufung.json`) and `course.json.einstufung.routing` | AI scores for routing (PRG-04) |
| **Copy** (`courseFacts` twins, `llms.txt`, `claims.test`) | `.build/course.facts.json` `counts` (incl. KI-ausgewertete vs deterministic Aufgaben from `rubric.method`) | typed numbers |

## 13. Compiler outputs (`node scripts/course-v2/compile.mjs <level>`, deterministic, idempotent, committed)

**Who runs it:** only the orchestrator, after a lease is released (BLUEPRINT §10.5, §10.8). It never writes into an
authored file; its artefacts are the `.build/` tree, the append-only ids ledger and the runtime modules below. Author
agents run only the read-only validator.

| Content | Compiled to | Consumed by |
|---|---|---|
| unit JSON + lane packs | `src/data/course-v2/<level>/units/uNN.js` (lazy chunks; learner-invisible fields stripped) | v2 player |
| items | pool entries in the `lessonPools` item shape | `check.js`, `requeue.js`, `mastery.js`, `reviewGrading` |
| rule cards | `src/data/course-v2/<level>/ruleCards.js` | Form segment, repair cards |
| writing tasks | `src/data/writingTasks/<level>.js` ↔ `netlify/functions/_shared/writingTasks/<level>.mjs` (byte-identical, `check-duplicates`) | `evaluate-writing` |
| speaking tasks | `src/data/speakingTasks/<level>.js` ↔ `netlify/functions/_shared/speakingTasks/<level>.mjs` | speaking functions |
| rubric profiles | `netlify/functions/_shared/rubrics/<id>.mjs` (+ a client copy of labels only) | graders, result cards |
| Plateaus, closing, mocks | modules in the Modelltest runner's shape with the new part types (block `choices`, image choices) | runner + per-lane scorers |
| reserves | `src/data/course-v2/<level>/reserve.js` (the reserve index by unit, topic and error tag) | requeue, `earlierDraw`, Plateau review sets, Mehr üben, repair cards |
| Einstufung | `<level>/.build/einstufung.json` → `src/data/course-v2/einstufung/<band>.js` (the fixed form from `course.json.einstufung`) | onboarding S1 |
| assets | `.build/assets.json` (approved assets: url, size) from the image pipeline | player, pages |
| lexicon | `words-from-json.mjs` input (new rows only) → guarded SQL for the owner | `words`, audio |
| audio lines | `<level>.lines.json` → `generate-course-audio.mjs` → `<level>.audio.js` manifest | `speech.js` (per-level manifest) |
| syllabus | `astro-site/src/data/syllabus/<level>.json` ↔ `src/data/syllabus/<level>.json` | Astro course pages, SPA course home |
| counts for copy | `src/data/courseFacts.js` ↔ `astro-site/src/data/courseFacts.js` | pages, `claims.test`, `build-llms.mjs` |
| ids | `<level>/ids.ledger.json` — **append-only**: new ids are appended, removed ids tombstoned, nothing is rewritten | ID-01 |
| hashes, minutes, cards, counts | `<level>/.build/units/uNN.json` (`contentHash`, `minutesPlanned`, `reviewCards`), `<level>/.build/course.facts.json` (`minutesPlanned`, `reviewMinutesByPace` current + carry-over, `minutesMeasured`, `counts` incl. AI-scored vs deterministic Aufgaben), `<level>/.build/srs.json` (SRS-01/02 incl. the cumulative-deck simulation) | QA-FRESH-01, TIM-01, SRS-01/02, plan, copy |

## 14. Learner state in Supabase (hand-applied migrations; no content tables)

```sql
-- migrations/2026-10-XX-course-v2-learner-state.sql  (owner applies; RLS own rows)
create table if not exists public.exam_practice_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level ~ '^(a1|a2|b1|b2)\.[12]$'),
  lane text not null,
  teil text not null,                         -- template id, e.g. 'tb1.lv3'
  source text not null check (source in ('ls4','aufgabe','plateau','halbtest','diagnose','modelltest','einstufung')),
  source_id text not null,                    -- exam block id (receptive) or bank key (productive), SCHEMA §2
  form text check (form in ('a','b','c')),
  mode text not null check (mode in ('lern','pruefung')),
  full_length boolean not null,
  raw_score numeric not null, raw_max numeric not null,
  scaled_score numeric, scaled_max numeric,
  ai_range numeric[] check (ai_range is null or array_length(ai_range, 1) = 2),
  not_auto_scored_max numeric,                -- e.g. 15 Aussprache points of telc B1 oral: widens the module range
  rubric_profile text, model_id text,
  before_course_end boolean not null default false,
  content_hash text,
  created_at timestamptz not null default now()
);
create index if not exists epr_user_lane_idx on public.exam_practice_results (user_id, lane, teil, created_at desc);
-- RLS: select own rows; delete own; no update (append-only).
-- INSERT by the client only for deterministic rows:
--   with check (user_id = auth.uid() and ai_range is null and rubric_profile is null and model_id is null)
-- AI-graded rows are written by evaluate-writing / evaluate-speaking with the service role.

create table if not exists public.learner_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  band text not null check (band in ('a1','a2','b1','b2')),   -- one row per band: A1.2 (sd1) and B1.2 (tb1) coexist
  lane text, exam_date date, purpose text,
  pace text check (pace in ('leicht','standard','intensiv')),
  learning_days_per_week smallint check (learning_days_per_week between 1 and 7),
  reminder_time time, reminder_channel text not null default 'email',
  integrationskurs boolean,                   -- the DTZ gate question
  updated_at timestamptz not null default now(),
  primary key (user_id, band)
);
-- RLS: the learner reads/writes own rows. Nothing here is a privileged column.
-- Same PR: migrate profiles.exam_date / exam_track into learner_goals (band from the exam track; verify the
-- exam_track values in the DB first), re-point plan.js, ExamDatePlan, DashboardPage and ProfilePage to learner_goals,
-- and stop writing the profile columns (kept, marked deprecated in a comment) — one source of truth.

create table if not exists public.course_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- anonymous users have a user id too
  level text not null check (level ~ '^(a1|a2|b1|b2)\.[12]$'),
  bank_key text not null,                     -- BANK_KEY_RE or a read-aloud line id
  kind text not null check (kind in ('attempt','revision','micro','mock-part','readaloud','placement')),
  speech_seconds numeric,                     -- detected speech, measured server-side (completion: ≥ 20 s)
  session_seconds numeric,                    -- billed session length (the minute allowance)
  model_id text, tokens_in integer, tokens_out integer, cost_estimate_usd numeric,
  ip_hash text,                               -- keyed hash, anonymous caps only; nulled after 48 h by the retention job
  created_at timestamptz not null default now()
);
create index if not exists cau_user_level_idx on public.course_ai_usage (user_id, level, bank_key, created_at desc);
-- RLS: select own rows only; NO insert/update/delete policy — written by the AI functions through
-- _shared/entitlement.mjs with the service role (the lifetime allowance, the daily cap and the anonymous caps read it).

create table if not exists public.course_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name in ('lernschritt_completed','micro_output_submitted','aufgabe_submitted',
    'revision_submitted','ai_grade_shown','teil_attempt','modelltest_completed','plan_set','retake_plan_created',
    'mic_denied','ai_latency_ms','speaking_minutes','ai_cost_estimate','consent_given','consent_withdrawn')),
  level text, unit_id text, step_id text, lane text, teil text,
  props jsonb not null default '{}'::jsonb,   -- e.g. { minutes: 17.5 } — never learner text or audio
  created_at timestamptz not null default now()
);
create index if not exists ce_name_created_idx on public.course_events (name, created_at);
-- RLS: insert own rows for client events; the server-only names ('ai_grade_shown','ai_latency_ms',
-- 'speaking_minutes','ai_cost_estimate','aufgabe_submitted' for speaking) are written with the service role;
-- select own. weekly_truth_metrics() reads it (BLUEPRINT §7.8); minutesMeasured is built from it.

-- review_cards: new kinds and graduation (verify the auto-generated constraint name and the existing columns first)
alter table public.review_cards drop constraint if exists review_cards_kind_check;
alter table public.review_cards add constraint review_cards_kind_check
  check (kind in ('word','pattern','sentence','teil','repair'));
alter table public.review_cards add column if not exists graduated_at timestamptz;   -- BLUEPRINT §6.1

-- lesson_progress: the tested-out state (verify the constraint name first)
alter table public.lesson_progress drop constraint if exists lesson_progress_status_check;
alter table public.lesson_progress add constraint lesson_progress_status_check
  check (status in ('started','complete','gold','tested_out'));

-- writing_submissions / exam_attempts: add the new exam keys the v2 banks use
--   writing_submissions_exam_key_check  += 'telc_a2', 'goethe_b2'   (v1.1: 'osd_za1', 'dtb_b2')
--   exam_attempts_exam_key_check        += the v2 mock/closing keys, following the 2026-09-06 migrations' pattern
```

- **Raw audio** is not stored in any of these tables. Where the speaking functions keep audio for replay, a scheduled
  retention job (`netlify/functions/audio-retention.mjs`, BLUEPRINT §4.8) deletes it on the Datenschutzerklärung's
  schedule and nulls `course_ai_usage.ip_hash` after 48 hours; everything above is removed with the account
  (`on delete cascade`).
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
private table); voice ids are illustrative until the owner's Azure run confirms them. The file is shown at
`"stage": "T"`, i.e. after all three author runs; it carries no generated field (those are in §15.5 as `.build/`
output). It is primary-lane-only in the v1 cut; the telc A2 lane pack of §15.4 shows the pack format for when that
pack is built after demand.

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
  "delivery": "both",
  "modules": {
    "lesen": { "minutes": 30, "teile": ["l1", "l2", "l3", "l4"] },
    "hoeren": { "minutes": 30, "teile": ["h1", "h2", "h3", "h4"] },
    "schreiben": { "minutes": 30, "teile": ["s1", "s2"] },
    "sprechen": { "minutes": 15, "teile": ["sp1", "sp2", "sp3"], "prepMinutes": 0, "format": "pair" }
  },
  "writtenBlock": { "minutes": 90, "breaks": false },
  "teile": {
    "h1": { "id": "ga2.h1", "module": "hoeren", "family": "fam.h-detail", "task": "abc", "items": 5, "options": 3, "plays": 2, "textType": "tt.kurzansage", "textWords": [25, 60], "textWordsSource": "design", "points": 5, "pictorial": false, "instructionsDe": "Sie hören fünf kurze Texte zweimal. Zu jedem Text gibt es eine Aufgabe. Wählen Sie a, b oder c.", "paraphraseOf": "US-A2 Hören Teil 1, Aufgabenstellung (paraphrased, not copied)", "scaffold": { "minItems": 3, "textWords": [20, 50], "playsFixed": true, "optionsFixed": true }, "scaffoldAllowedIn": ["a2.1"], "transfersTo": [], "source": "US-A2 p. 3 and Hören Teil 1", "stand": "2026-09-26" },
    "s2": { "id": "ga2.s2", "module": "schreiben", "family": "fam.w-nachricht", "task": "writing", "textType": "tt.email-halbformell", "words": { "min": 30, "max": 40 }, "leitpunkte": 3, "register": "halbformell", "rubric": "ga2-s2", "points": 10, "pictorial": false, "instructionsDe": "Schreiben Sie eine kurze E-Mail zu allen drei Punkten, 30 bis 40 Wörter.", "paraphraseOf": "US-A2 Schreiben Teil 2, p. 37 (paraphrased)", "scaffoldAllowedIn": [], "transfersTo": [], "source": "US-A2 p. 37", "stand": "2026-09-26" },
    "sp1": { "id": "ga2.sp1", "module": "sprechen", "family": "fam.s-fragekarten", "task": "speaking", "textType": "tt.wortkarte", "interaction": "cards-ask", "speaking": { "stimulus": "none", "turns": [8, 8] }, "prepMinutes": 0, "rubric": "ga2-sp1", "points": 4, "pictorial": false, "instructionsDe": "Sie ziehen vier Karten. Fragen Sie mit jeder Karte, antworten Sie auf die Fragen Ihrer Partnerin.", "paraphraseOf": "US-A2 Sprechen Teil 1 (paraphrased)", "scaffoldAllowedIn": ["a2.1"], "transfersTo": ["ta2.sp2"], "source": "US-A2 Sprechen Teil 1; DB-A2 §1.4", "stand": "2026-09-26" }
  },
  "blueprint": { "modules": { "lesen": ["l1", "l2", "l3", "l4"], "hoeren": ["h1", "h2", "h3", "h4"], "schreiben": ["s1", "s2"], "sprechen": ["sp1", "sp2", "sp3"] }, "totalMinutes": 105, "answerSheetStep": false },
  "scale": { "kind": "scaled", "max": 100, "parts": { "lesen": 25, "hoeren": 25, "schreiben": 25, "sprechen": 25 } },
  "passRule": "goethe-a2",
  "openQuestions": ["Sprechen per-Teil split reconstructed from the rating sheet (memo 01, unverified)"]
}
```

`registries/lanes/ta2.json` (excerpt; the lane is `"delivery": "paper"`, [m01] §4):

```json
{
  "h1": { "id": "ta2.h1", "module": "hoeren", "family": "fam.h-detail", "task": "notes", "items": 5, "plays": 2, "textType": "tt.telefonansage", "textWords": [30, 70], "textWordsSource": "design", "points": 5, "pictorial": false, "instructionsDe": "Sie hören fünf Ansagen am Telefon zweimal. Ergänzen Sie die Notizen.", "paraphraseOf": "UT-A2 Hören Teil 1 (paraphrased)", "scaffold": { "minItems": 3, "textWords": [25, 60], "playsFixed": true, "optionsFixed": true }, "scaffoldAllowedIn": ["a2.1"], "transfersTo": [], "source": "UT-A2 pp. 5-25, 33 (numbers must be exact)", "stand": "2026-09-26" }
}
```

`registries/rubrics/writing/ga2-s2.json`, `registries/rubrics/speaking/ga2-sp1.json`, `registries/rubrics/writing/course-micro.json`:

```json
[
  { "$schema": "course-v2/rubric@1", "id": "ga2-s2", "kind": "writing", "lane": "ga2", "method": "ai", "max": 10, "examMax": 10,
    "criteria": [
      { "id": "af", "label": "Aufgabenerfüllung (Sprachfunktionen, Register)", "per": "task", "levels": [5, 3.5, 2, 0.5, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 5, "de": "Alle drei Punkte sind klar behandelt; Anrede, Gruß und Sie-Form passen durchgehend." },
          { "points": 3.5, "de": "Alle drei Punkte sind behandelt, einer nur knapp oder etwas unklar; das Register passt meistens." },
          { "points": 2, "de": "Zwei Punkte sind erkennbar behandelt, oder das Register wechselt mehrmals." },
          { "points": 0.5, "de": "Nur ein Punkt ist erkennbar; der Text erfüllt die Aufgabe kaum." },
          { "points": 0, "de": "Kein Punkt ist erkennbar behandelt." }
        ] },
      { "id": "sp", "label": "Sprache (Spektrum, Beherrschung)", "per": "task", "levels": [5, 3.5, 2, 0.5, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 5, "de": "Passende Wörter und Strukturen der Stufe A2; Fehler stören das Verständnis nicht." },
          { "points": 3.5, "de": "Meist passende Wörter und Strukturen; einzelne Fehler stören das Verständnis kurz." },
          { "points": 2, "de": "Einfache Wörter und Strukturen mit häufigen Fehlern; der Text bleibt aber verständlich." },
          { "points": 0.5, "de": "Sehr wenige sprachliche Mittel; viele Stellen sind nur schwer zu verstehen." },
          { "points": 0, "de": "Der Text ist kaum zu verstehen." }
        ] }
    ],
    "errorPolicy": { "a2": { "verb-final": "flag", "adj-ending": "flag", "connector-position": "flag", "v2-inv": "score", "satzklammer": "score", "case-np": "score", "case-pp": "score", "gender-article": "score", "perfekt-aux-participle": "score", "reflexive": "score", "register": "score", "spelling-meaning": "score" } },
    "zeroRules": ["goethe-e-under-half-words", "goethe-e-topic-missed"], "capRules": [],
    "spelling": "only-if-meaning-suffers", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:writing-full", "splitVerified": true,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" },
  { "$schema": "course-v2/rubric@1", "id": "ga2-sp1", "kind": "speaking", "lane": "ga2", "method": "ai", "max": 4, "examMax": 4,
    "criteria": [
      { "id": "af", "label": "Aufgabenerfüllung", "per": "part", "levels": [2, 1.5, 1, 0.5, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 2, "de": "Stellt zu jeder Karte eine passende Frage und antwortet auf jede Frage passend." },
          { "points": 1.5, "de": "Fragen und Antworten passen fast immer; eine Frage oder Antwort fehlt oder passt nur teilweise." },
          { "points": 1, "de": "Etwa die Hälfte der Fragen und Antworten passt zur Karte." },
          { "points": 0.5, "de": "Nur einzelne Fragen oder Antworten passen." },
          { "points": 0, "de": "Keine Frage und keine Antwort passt zur Aufgabe." }
        ] },
      { "id": "sp", "label": "Sprache", "per": "part", "levels": [2, 1.5, 1, 0.5, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 2, "de": "Fragen und Antworten sind korrekt gebildet oder haben nur kleine Fehler." },
          { "points": 1.5, "de": "Meist verständlich gebildet; einige Fehler, zum Beispiel in der Wortstellung der Frage." },
          { "points": 1, "de": "Häufige Fehler; der Sinn ist aber meistens zu verstehen." },
          { "points": 0.5, "de": "Viele Fehler; der Sinn ist oft nur mit Mühe zu verstehen." },
          { "points": 0, "de": "Kaum zu verstehen." }
        ] }
    ],
    "errorPolicy": { "a2": { "v2-inv": "score", "verb-final": "flag", "case-np": "flag", "gender-article": "flag", "adj-ending": "flag" } },
    "zeroRules": [], "capRules": [], "spelling": "not-scored", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:speaking-full", "splitVerified": false,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" },
  { "$schema": "course-v2/rubric@1", "id": "course-micro", "kind": "writing", "lane": null, "method": "ai", "max": 5, "examMax": 5,
    "criteria": [
      { "id": "task", "label": "Aufgabe erfüllt", "per": "task", "levels": [2, 1, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 2, "de": "Alles, was die Aufgabe verlangt, steht im Text." },
          { "points": 1, "de": "Ein Teil der Aufgabe fehlt." },
          { "points": 0, "de": "Der Text passt nicht zur Aufgabe." }
        ] },
      { "id": "target", "label": "Zielstruktur benutzt", "per": "task", "levels": [1, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 1, "de": "Die Struktur der Lektion steht mindestens einmal richtig im Text." },
          { "points": 0, "de": "Die Struktur der Lektion fehlt oder ist falsch gebildet." }
        ] },
      { "id": "clear", "label": "verständlich", "per": "task", "levels": [2, 1, 0], "scoredBy": "ai",
        "descriptors": [
          { "points": 2, "de": "Man versteht alles beim ersten Lesen." },
          { "points": 1, "de": "Man versteht das Wichtigste, muss aber manchmal raten." },
          { "points": 0, "de": "Man versteht die Nachricht nicht." }
        ] }
    ],
    "errorPolicy": { "a1": { "v2-inv": "flag", "verb-final": "flag", "case-np": "flag", "gender-article": "flag" }, "a2": { "verb-final": "flag", "adj-ending": "flag" }, "b1": { "v2-inv": "flag", "adj-ending": "flag" }, "b2": { "adj-ending": "score" } },
    "zeroRules": [], "capRules": [], "spelling": "only-if-meaning-suffers", "feedbackLanguage": ["de-a2", "en"],
    "modelId": "config:micro", "splitVerified": true,
    "calibration": { "status": "pending", "rangeBands": 1 },
    "source": "https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf" }
]
```

(The `ga2-sp1` split — Teil 1 = Aufgabenerfüllung 2 + Sprache 2, plus Aussprache across all parts — is reconstructed
from the rating sheet and **unverified** ([m01] Unverified); hence `splitVerified: false`. The Goethe A2 Aussprache
scale — 5 points across the three Teile, per the same unverified reconstruction — is recorded once, on `ga2-sp3`, as a
`scoredBy: "notAutoScored"` criterion with `examMax` 13 against `max` 8, so it never enters a total and widens the
Sprechen range by 5 on the board (BLUEPRINT §4.4, §5.6). The descriptors above are our own wording, written for this
fixture; the W2 rubric agents replace them and the calibration reviewer approves them. The `errorPolicy` values are
design until CAL-01 has run.)

`registries/level-profiles.json` (the A2.1 entry):

```json
{
  "level": "a2.1", "band": "A2", "skeleton": "A",
  "steps": ["situation", "situation", "situation", "pruefung", "sprechen", "schreiben", "check"],
  "minutes": { "situation": 22, "pruefung": 25, "sprechen": 22, "schreiben": 22, "check": 15, "reviewPerDay": 7 },
  "sentence": { "meanWordsMax": 9, "maxWords": 16, "subordinateClausesMax": 1 },
  "lexis": { "newPerUnit": [28, 30], "productiveShare": 0.5, "offListMax": 0.15, "coverageMin": 0.95 },
  "review": { "budgetMinutes": 7, "secondsPerReview": 9, "firstReviewCeiling": 30, "carryOverMinutes": 1.5 },
  "pool": { "size": 16, "served": 12, "reserve": [4, 6], "generatedMax": 0.4, "mix": { "typedGapDictation": [0.45, 0.55], "sentenceBuildingMin": 0.2, "errorCorrectionMax": 0.12, "choiceMax": 0.2 } },
  "examStemChars": [20, 110],
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
    "aufgabe": { "submittedWhen": { "writingMinShareOfLowerBound": 0.5, "formAllFieldsNonEmpty": true, "speakingMinSeconds": 20, "cardModeMinTurns": 2 } },
    "unit": { "completeWhen": ["lernschritte-finished-or-tested-out", "aufgaben-submitted"], "testOutThreshold": 0.8 },
    "course": {
      "required": [
        { "kind": "unit", "status": "complete", "count": 12 },
        { "kind": "plateau", "status": "submitted", "count": 3 },
        { "kind": "halbtest", "lane": "learner", "status": "submitted" }
      ],
      "neverRequired": ["score", "fokus", "mehr-ueben", "extensive", "diagnose", "modelltest:b", "modelltest:c"]
    }
  },
  "review": { "ladderDays": [1, 3, 7, 14, 30, 60], "examCapShare": 0.15, "budgetMinutes": 7, "firstReviewCeiling": 30, "secondsPerReview": 9, "graduateAfterDays": 60, "examCriticalKinds": ["teil", "sentence"], "carryOverMinutes": 1.5 },
  "pace": { "leicht": { "unitsPerWeek": 0.5, "learningDays": 3 }, "standard": { "unitsPerWeek": 1, "learningDays": 4 }, "intensiv": { "unitsPerWeek": 2, "learningDays": 6 } },
  "targets": { "newWords": [330, 360], "productiveShare": 0.5, "aufgaben": 24, "microOutputs": 36 },
  "einstufung": { "fromUnits": [4, 8, 12], "itemsPerUnit": 4, "itemTypes": "deterministic", "routing": { "testOutMin": 0.8, "recommendDot2Min": 0.8 } }
}
```

(`"live": ["ga2"]` — telc A2 appears as a lane only once its pack has been built after demand and has passed review,
BLUEPRINT §1.4. A .2 course's `required` closing entry is `{ "kind": "modelltest", "form": "a", "lane": "learner",
"status": "submitted" }` instead of the Halbtest entry.)

### 15.3 The unit file `content/course-v2/a2.1/units/u07.json`

```json
{
  "$schema": "course-v2/unit@1",
  "id": "a2.1-u07",
  "level": "a2.1",
  "nr": 7,
  "etappe": 3,
  "version": 1,
  "status": "review",
  "reviewedIn": null,
  "stage": "T",
  "title": { "de": "Am Telefon im Job", "canDo": "Sie können Nachrichten am Telefon verstehen, notieren und weitergeben." },

  "spec": {
    "situation": "Priya ist allein am Empfang: Sie hört die Mailbox ab, gibt Nachrichten weiter und nimmt einen Anruf für den Chef an.",
    "handlungsfeld": ["2"],
    "canDos": ["cd.a2.mailbox-verstehen", "cd.a2.rueckruf-weitergeben", "cd.a2.arbeit-erzaehlen", "cd.a2.termin-absagen-mail"],
    "grammar": { "new": ["g.reflexiv-akk"], "chunk": [], "review": ["g.wenn", "g.perfekt-haben"] },
    "lexiconBlocks": [
      { "title": "Telefon und Mailbox", "lemmas": ["lx.anruf", "lx.rueckruf", "lx.mailbox", "lx.sich-melden", "lx.sich-verspaeten", "lx.stau", "lx.autobahn", "lx.sich-anmelden"] },
      { "title": "Im Büro", "lemmas": ["lx.besprechung", "lx.auftrag", "lx.techniker", "lx.sich-beeilen", "lx.sich-entschuldigen", "lx.kantine", "lx.konferenzraum", "lx.feierabend", "lx.ueberstunde", "lx.sich-setzen"] },
      { "title": "Am Apparat", "lemmas": ["lx.ausrichten", "lx.verbinden", "lx.besetzt", "lx.dringend", "lx.leitung", "lx.durchwahl", "lx.buchhaltung", "lx.empfang", "lx.weiterleiten", "lx.beschaeftigt"] }
    ],
    "textTypes": ["tt.mailbox", "tt.dialog", "tt.telefonnotiz", "tt.kurzansage", "tt.email-halbformell", "tt.wortkarte"],
    "lanes": {
      "primary": "ga2",
      "pruefungsfokus": [
        { "template": "ga2.h1", "length": "full", "modeDefault": "lern", "slot": "ls4" },
        { "template": "ga2.s2", "length": "full", "modeDefault": "lern", "slot": "schreiben" },
        { "template": "ga2.sp1", "length": "full", "modeDefault": "lern", "slot": "sprechen" }
      ],
      "spur": { "ta2": ["ta2.h1"] }
    },
    "lehrwerk": ["M A2 L9 Arbeitsleben", "M A2 L11 reflexive Verben", "S3 L4 Telefon am Arbeitsplatz", "N A2 K6 Arbeitswelten"],
    "deviation": null,
    "cast": ["cast.priya", "cast.jan-wolf", "cast.herr-brandt", "cast.frau-otto", "cast.monika-kowalski", "cast.herr-seidel", "cast.anna", "cast.emre"],
    "fokusPlan": [{ "kind": "beruf", "title": "Pausen bei der Arbeit", "hf": "2" }],
    "source": { "w2Draft": "curriculum/a2-1.md E8" }
  },

  "start": {
    "lernziele": ["cd.a2.mailbox-verstehen", "cd.a2.rueckruf-weitergeben", "cd.a2.arbeit-erzaehlen", "cd.a2.termin-absagen-mail"],
    "pruefungsfokusChips": ["ga2.h1", "ga2.s2", "ga2.sp1"],
    "folge": {
      "title": "Montag, 8.50 Uhr",
      "lines": [
        { "id": "a2.1-u07-start-l01", "speaker": "cast.priya", "de": "Guten Morgen! Hallo? Ist niemand da?", "en": "Good morning! Hello? Is nobody here?" },
        { "id": "a2.1-u07-start-l02", "speaker": "cast.frau-otto", "de": "Guten Morgen, Frau Nair. Herr Brandt ist heute Vormittag beim Kunden in Halle. Und Jan ist noch nicht da.", "en": "Good morning, Ms Nair. Mr Brandt is at a customer's in Halle this morning. And Jan isn't here yet." },
        { "id": "a2.1-u07-start-l03", "speaker": "cast.priya", "de": "Oh, das Telefon blinkt. Drei neue Nachrichten auf der Mailbox!", "en": "Oh, the phone is flashing. Three new messages on the voicemail!" },
        { "id": "a2.1-u07-start-l04", "speaker": "cast.frau-otto", "de": "Na dann – viel Glück am Empfang! Ich bin heute auch sehr beschäftigt. Wenn es dringend ist, verbinden Sie die Leute mit mir.", "en": "Well then – good luck at the front desk! I'm very busy today too. If it's urgent, put people through to me." }
      ],
      "gistItem": { "id": "a2.1-u07-start-i01", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Wer ist heute Vormittag nicht im Büro?", "promptEn": "Who is not in the office this morning?", "options": ["Herr Brandt", "Frau Otto", "Priya"], "answer": "Herr Brandt", "accepted": ["Herr Brandt"], "explanation": { "de": "Frau Otto sagt: Herr Brandt ist beim Kunden in Halle.", "en": "Ms Otto says Mr Brandt is at a customer's in Halle." }, "origin": "agent" }
    },
    "testOut": { "offered": true }
  },

  "steps": [
    {
      "id": "a2.1-u07-ls1", "kind": "situation", "title": "Drei Nachrichten auf der Mailbox",
      "structure": "g.reflexiv-akk", "modelSentence": "Bitte melden Sie sich bei mir.", "ruleCard": "rc.reflexiv-akk",
      "warmup": { "draw": 6, "contrastWith": "g.akk-personalpronomen" },
      "input": {
        "kind": "monolog", "title": "Die Mailbox am Empfang", "textType": "tt.mailbox",
        "lines": [
          { "id": "a2.1-u07-ls1-l01", "speaker": "ansage", "de": "Hier ist die Mailbox von Brandt Elektrotechnik. Sie haben drei neue Nachrichten. Erste Nachricht:", "en": "This is the voicemail of Brandt Elektrotechnik. You have three new messages. First message:" },
          { "id": "a2.1-u07-ls1-l02", "speaker": "cast.monika-kowalski", "de": "Guten Tag, hier spricht Monika Kowalski von der Firma Hansen Bau. Es geht um unseren Auftrag. Der Techniker hatte heute um acht Uhr einen Termin bei uns. Aber er ist noch nicht da.", "en": "Hello, this is Monika Kowalski from Hansen Bau. It's about our order. The technician had an appointment with us at eight today. But he isn't here yet." },
          { "id": "a2.1-u07-ls1-l03", "speaker": "cast.monika-kowalski", "de": "Bitte melden Sie sich so schnell wie möglich bei mir. Meine Nummer ist 0341 58 27 90. Vielen Dank!", "en": "Please get in touch with me as soon as possible. My number is 0341 58 27 90. Thank you!", "say": "Bitte melden Sie sich so schnell wie möglich bei mir. Meine Nummer ist null drei vier eins, achtundfünfzig, siebenundzwanzig, neunzig. Vielen Dank!" },
          { "id": "a2.1-u07-ls1-l04", "speaker": "ansage", "de": "Zweite Nachricht:", "en": "Second message:" },
          { "id": "a2.1-u07-ls1-l05", "speaker": "cast.jan-wolf", "de": "Hallo Priya, hier ist Jan. Ich stehe auf der Autobahn im Stau und verspäte mich leider. Ich bin erst um halb zehn im Büro.", "en": "Hi Priya, it's Jan. I'm stuck in a traffic jam on the motorway and I'm running late, sorry. I won't be in the office until half past nine." },
          { "id": "a2.1-u07-ls1-l06", "speaker": "cast.jan-wolf", "de": "Die Teambesprechung um neun fängt dann ohne mich an. Kannst du bitte Frau Otto Bescheid sagen? Danke dir!", "en": "The team meeting at nine will start without me, then. Can you tell Ms Otto, please? Thanks!" },
          { "id": "a2.1-u07-ls1-l07", "speaker": "ansage", "de": "Dritte Nachricht:", "en": "Third message:" },
          { "id": "a2.1-u07-ls1-l08", "speaker": "cast.herr-brandt", "de": "Guten Morgen, Frau Nair, hier ist Brandt. Ich bin heute Vormittag beim Kunden in Halle. Wenn Herr Seidel anruft: Es geht um die Rechnung. Ich melde mich morgen früh bei ihm. Bis später!", "en": "Good morning, Ms Nair, Brandt here. I'm at a customer's in Halle this morning. If Mr Seidel calls: it's about the invoice. I'll get in touch with him tomorrow morning. See you later!" }
        ],
        "glosses": [],
        "transcriptAfterUnaidedListen": true
      },
      "inputItems": [
        { "id": "a2.1-u07-ls1-i01", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Nachricht 1: Worum geht es?", "promptEn": "Message 1: what is it about?", "options": ["um einen Techniker", "um eine Rechnung", "um eine Besprechung"], "answer": "um einen Techniker", "accepted": ["um einen Techniker"], "explanation": { "de": "Frau Kowalski wartet auf den Techniker. Er ist noch nicht da.", "en": "Ms Kowalski is waiting for the technician; he hasn't arrived." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-i02", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Wer kommt heute später ins Büro?", "promptEn": "Who comes to the office late today?", "options": ["Jan", "Herr Brandt", "Frau Kowalski"], "answer": "Jan", "accepted": ["Jan"], "explanation": { "de": "Jan steht im Stau. Er ist erst um halb zehn im Büro.", "en": "Jan is stuck in traffic and will only arrive at half past nine." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-i03", "type": "fill_blank", "role": "detail", "topic": "hoeren", "promptDe": "Nachricht 1: Die Telefonnummer von Frau Kowalski ist ___.", "promptEn": "Write the number.", "answer": "0341 58 27 90", "accepted": ["0341 58 27 90"], "exact": "number", "explanation": { "de": "Die Nummer: 0341 58 27 90.", "en": "The number is 0341 58 27 90 – every digit counts." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-i04", "type": "fill_blank", "role": "detail", "topic": "hoeren", "promptDe": "Nachricht 2: Wann ist Jan im Büro? Um ___.", "promptEn": "Write the time.", "answer": "halb zehn", "accepted": ["halb zehn", "9.30 Uhr", "9:30 Uhr", "9.30", "9:30"], "exact": "number", "explanation": { "de": "Halb zehn ist 9.30 Uhr.", "en": "'Halb zehn' is 9:30 – half an hour before ten." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-i05", "type": "multiple_choice", "role": "detail", "topic": "hoeren", "promptDe": "Nachricht 3: Was macht Herr Brandt morgen früh?", "promptEn": "Message 3: what will Mr Brandt do tomorrow morning?", "options": ["Er ruft Herrn Seidel an.", "Er fährt nach Halle.", "Er schreibt eine Rechnung."], "answer": "Er ruft Herrn Seidel an.", "accepted": ["Er ruft Herrn Seidel an."], "explanation": { "de": "Er sagt: Ich melde mich morgen früh bei ihm. Hier heißt das: Er ruft an.", "en": "'Ich melde mich bei ihm' means he will get in touch with him – here, by phone." }, "origin": "agent" }
      ],
      "structuredInput": [
        { "id": "a2.1-u07-ls1-s01", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„Priya stellt sich vor.“ – Wen stellt Priya vor?", "promptEn": "Whom does Priya introduce?", "options": ["sich selbst", "Jan", "Frau Otto"], "answer": "sich selbst", "accepted": ["sich selbst"], "explanation": { "de": "sich = Priya. Das Pronomen zeigt auf das Subjekt.", "en": "'sich' points back to the subject: Priya introduces herself." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-s02", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„Priya stellt Jan vor.“ – Wen stellt Priya vor?", "promptEn": "Whom does Priya introduce?", "options": ["Jan", "sich selbst", "Herrn Brandt"], "answer": "Jan", "accepted": ["Jan"], "explanation": { "de": "Hier steht kein sich. Priya stellt eine andere Person vor: Jan.", "en": "No 'sich' here: Priya introduces someone else – Jan." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-s03", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„Bitte melden Sie sich bei mir.“ – Wer soll sich melden?", "promptEn": "Who is asked to get in touch?", "options": ["Sie – die Person am Telefon", "Frau Kowalski", "der Techniker"], "answer": "Sie – die Person am Telefon", "accepted": ["Sie – die Person am Telefon"], "explanation": { "de": "Sie ist das Subjekt. sich zeigt auf Sie.", "en": "'Sie' is the subject, and 'sich' points back to it: the listener should call." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-s04", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "Herr Brandt über Herrn Seidel: „Ich melde mich morgen bei ihm.“ – Wer ruft morgen an?", "promptEn": "Who will call tomorrow?", "options": ["Herr Brandt", "Herr Seidel", "Priya"], "answer": "Herr Brandt", "accepted": ["Herr Brandt"], "explanation": { "de": "ich melde mich = ich rufe an. Ich ist Herr Brandt.", "en": "'Ich melde mich' – the speaker, Mr Brandt, will get in touch." }, "origin": "agent" }
      ],
      "pool": {
        "items": [
          { "id": "a2.1-u07-ls1-p01", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Frau Kowalski sagt: „Bitte melden Sie ___ bei mir.“", "promptEn": "Reflexive pronoun for Sie.", "answer": "sich", "accepted": ["sich"], "explanation": { "de": "Sie melden sich: Zu Sie passt sich.", "en": "With Sie the reflexive pronoun is sich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p02", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Jan kommt heute später. Er verspätet ___.", "promptEn": "Reflexive pronoun for er.", "answer": "sich", "accepted": ["sich"], "explanation": { "de": "er verspätet sich: Zu er passt sich.", "en": "With er the reflexive pronoun is sich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p03", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Ich ___ mich morgen bei Ihnen. (sich melden)", "promptEn": "Verb form for ich.", "answer": "melde", "accepted": ["melde"], "explanation": { "de": "ich melde mich – das Verb endet auf -e.", "en": "ich melde mich: the verb takes -e after ich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p04", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Der Techniker ___ sich heute. (sich verspäten)", "promptEn": "Verb form for er.", "answer": "verspätet", "accepted": ["verspätet"], "explanation": { "de": "er verspätet sich – Stamm auf -t, deshalb -et.", "en": "The stem ends in -t, so the er-form ends in -et: verspätet." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p05", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["mich", "ich", "morgen", "melde"], "answer": "Ich melde mich morgen.", "accepted": ["Ich melde mich morgen.", "Morgen melde ich mich."], "explanation": { "de": "Das Verb steht auf Position 2, mich steht direkt dahinter.", "en": "The verb is in second position; mich follows it." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p06", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["sich", "Jan", "leider", "verspätet"], "answer": "Jan verspätet sich leider.", "accepted": ["Jan verspätet sich leider.", "Leider verspätet sich Jan.", "Leider verspätet Jan sich."], "acceptedWhy": { "Leider verspätet Jan sich.": "grammatisch: sich nach dem Namen ist möglich, sich vor dem Namen ist häufiger" }, "explanation": { "de": "Das Verb verspätet steht auf Position 2.", "en": "The verb verspätet stays in second position." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p07", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the polite request.", "tiles": ["bitte", "melden", "Sie", "sich"], "answer": "Bitte melden Sie sich.", "accepted": ["Bitte melden Sie sich.", "Melden Sie sich bitte."], "explanation": { "de": "Bitte: Das Verb steht vorne, dann Sie, dann sich.", "en": "In a polite request the verb comes first, then Sie, then sich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p08", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["heute", "sich", "der Techniker", "verspätet"], "answer": "Der Techniker verspätet sich heute.", "accepted": ["Der Techniker verspätet sich heute.", "Heute verspätet sich der Techniker.", "Heute verspätet der Techniker sich."], "acceptedWhy": { "Heute verspätet der Techniker sich.": "grammatisch: sich nach dem Subjekt ist möglich, vor dem Subjekt ist häufiger" }, "explanation": { "de": "Das Verb steht auf Position 2.", "en": "The verb is in second position." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p09", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["sich", "Herr Brandt", "morgen", "meldet"], "answer": "Herr Brandt meldet sich morgen.", "accepted": ["Herr Brandt meldet sich morgen.", "Morgen meldet sich Herr Brandt.", "Morgen meldet Herr Brandt sich."], "acceptedWhy": { "Morgen meldet Herr Brandt sich.": "grammatisch: sich nach dem Subjekt ist möglich, vor dem Subjekt ist häufiger" }, "explanation": { "de": "Das Verb meldet steht auf Position 2.", "en": "meldet stays in second position." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p10", "type": "error_correction", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Korrigieren Sie: „Ich melde sich morgen bei Ihnen.“", "promptEn": "Correct the sentence.", "answer": "Ich melde mich morgen bei Ihnen.", "accepted": ["Ich melde mich morgen bei Ihnen."], "intentionalError": true, "errorTag": "reflexive", "explanation": { "de": "Zu ich passt mich, nicht sich.", "en": "With ich the reflexive pronoun is mich, not sich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls1-p11", "type": "multiple_choice", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "„Sie verspäten ___? Kein Problem, wir warten.“", "promptEn": "Choose the pronoun.", "options": ["sich", "Sie", "euch"], "answer": "sich", "accepted": ["sich"], "explanation": { "de": "Sie verspäten sich – zu Sie passt sich.", "en": "Sie verspäten sich: the pronoun for Sie is sich." }, "origin": "agent" }
        ],
        "generators": [
          { "generator": "dictation.fromInput", "count": 2, "source": ["a2.1-u07-ls1-l03", "a2.1-u07-ls1-l05"] },
          { "generator": "numbers.dictation", "count": 1, "source": ["phone-number-leipzig"] },
          { "generator": "lex.articlePlural", "count": 1, "source": ["lx.anruf", "lx.rueckruf"] },
          { "generator": "lex.glossMatch", "count": 1, "source": ["lx.anruf", "lx.rueckruf", "lx.mailbox", "lx.stau"] }
        ]
      },
      "reserve": [
        { "id": "a2.1-u07-ls1-r01", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Frau Kowalski wartet. Der Techniker meldet ___ gleich bei ihr.", "promptEn": "Reflexive pronoun for er.", "answer": "sich", "accepted": ["sich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben", "repair"], "difficulty": 1, "explanation": { "de": "er meldet sich: Zu er passt sich.", "en": "With er the reflexive pronoun is sich." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-r02", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Ich verspäte ___ leider ein bisschen.", "promptEn": "Reflexive pronoun for ich.", "answer": "mich", "accepted": ["mich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben", "repair", "einstufung"], "difficulty": 1, "explanation": { "de": "ich verspäte mich: Zu ich passt mich.", "en": "With ich the reflexive pronoun is mich." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-r03", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["sich", "Frau Kowalski", "heute", "meldet"], "answer": "Frau Kowalski meldet sich heute.", "accepted": ["Frau Kowalski meldet sich heute.", "Heute meldet sich Frau Kowalski.", "Heute meldet Frau Kowalski sich."], "acceptedWhy": { "Heute meldet Frau Kowalski sich.": "grammatisch: sich nach dem Subjekt ist möglich, vor dem Subjekt ist häufiger" }, "errorTags": ["v2-inv", "reflexive"], "banks": ["plateau", "mehr-ueben", "repair"], "difficulty": 2, "explanation": { "de": "Das Verb meldet steht auf Position 2.", "en": "meldet stays in second position." }, "origin": "agent" },
        { "id": "a2.1-u07-ls1-r04", "type": "multiple_choice", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "„Herr Brandt und Frau Otto melden ___ morgen.“", "promptEn": "Choose the pronoun.", "options": ["sich", "uns", "euch"], "answer": "sich", "accepted": ["sich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben"], "difficulty": 2, "explanation": { "de": "Herr Brandt und Frau Otto = sie. Zu sie passt sich.", "en": "Two people = sie, and the pronoun is sich." }, "origin": "agent" }
      ],
      "microOutput": { "id": "a2.1-u07-ls1-mo", "bankKey": "a21-u07-mo1", "mode": "spoken", "profile": "course-micro-sp", "situationDe": "Sie stehen im Stau und kommen zu spät zur Arbeit.", "promptDe": "Sprechen Sie Ihrer Kollegin auf die Mailbox: Warum rufen Sie an? Wann sind Sie da?", "promptEn": "Leave your colleague a voicemail: why you are calling, when you will be in.", "planSeconds": 30, "seconds": [30, 40], "targets": ["g.reflexiv-akk"], "register": "du" },
      "aussprache": {
        "focus": "vokalisiertes r am Wortende: bitte – bitter",
        "perception": { "generator": "perception.pairs", "count": 3, "source": ["bitte|bitter", "Lehre|Lehrer", "Wunde|Wunder", "liebe|lieber"], "voices": 4 },
        "readAloud": { "lineDe": "Bitte melden Sie sich bei mir." }
      },
      "endLine": "Sie können jetzt Nachrichten auf der Mailbox verstehen."
    },

    {
      "id": "a2.1-u07-ls2", "kind": "situation", "title": "Entschuldigung, ich bin zu spät!",
      "structure": "g.reflexiv-akk", "modelSentence": "Beeil dich! – Ja, ich beeile mich.", "ruleCard": "rc.reflexiv-akk",
      "warmup": { "draw": 6, "contrastWith": "g.akk-personalpronomen" },
      "input": {
        "kind": "dialog", "title": "Jan kommt ins Büro", "textType": "tt.dialog",
        "lines": [
          { "id": "a2.1-u07-ls2-l01", "speaker": "cast.jan-wolf", "de": "Guten Morgen, Priya! Tut mir leid, ich bin zu spät. Der Stau war furchtbar.", "en": "Morning, Priya! Sorry I'm late. The traffic was terrible." },
          { "id": "a2.1-u07-ls2-l02", "speaker": "cast.priya", "de": "Kein Problem. Die Teambesprechung im Konferenzraum hat gerade angefangen. Beeil dich!", "en": "No problem. The team meeting in the meeting room has just started. Hurry up!" },
          { "id": "a2.1-u07-ls2-l03", "speaker": "cast.jan-wolf", "de": "Ja, ich beeile mich. Hat jemand für mich angerufen?", "en": "Yes, I'm hurrying. Did anyone call for me?" },
          { "id": "a2.1-u07-ls2-l04", "speaker": "cast.priya", "de": "Ja, Frau Kowalski von Hansen Bau. Es geht um ihren Auftrag. Der Techniker ist noch nicht bei ihr. Du sollst dich bei ihr melden.", "en": "Yes, Ms Kowalski from Hansen Bau. It's about her order. The technician hasn't arrived. You should get in touch with her." },
          { "id": "a2.1-u07-ls2-l05", "speaker": "cast.jan-wolf", "de": "Oh nein! Ich melde mich sofort bei ihr. … Die Leitung ist besetzt. Dann entschuldige ich mich zuerst bei Frau Otto.", "en": "Oh no! I'll call her right away. … The line is busy. Then I'll apologise to Ms Otto first." },
          { "id": "a2.1-u07-ls2-l06", "speaker": "cast.frau-otto", "de": "Herr Wolf, da sind Sie ja! Wir warten schon.", "en": "Mr Wolf, there you are! We're already waiting." },
          { "id": "a2.1-u07-ls2-l07", "speaker": "cast.jan-wolf", "de": "Entschuldigung, Frau Otto. Ich habe mich verspätet – der Stau! Heute mache ich eine Überstunde.", "en": "Sorry, Ms Otto. I'm late – the traffic! I'll work an extra hour today." },
          { "id": "a2.1-u07-ls2-l08", "speaker": "cast.frau-otto", "de": "Schon gut, Sie müssen sich nicht entschuldigen. Setzen Sie sich, wir fangen jetzt an.", "en": "That's fine, you don't need to apologise. Sit down, we're starting now." },
          { "id": "a2.1-u07-ls2-l09", "speaker": "cast.frau-otto", "de": "Ach, Frau Nair: Bitte melden Sie sich heute noch für den Computerkurs an.", "en": "Oh, Ms Nair: please sign up for the computer course today." },
          { "id": "a2.1-u07-ls2-l10", "speaker": "cast.priya", "de": "Gut, das mache ich. Jetzt gehe ich ans Telefon – bis zum Feierabend!", "en": "Fine, I'll do that. Now I'm going to answer the phone – until the end of the day!" }
        ],
        "glosses": [{ "token": "furchtbar", "gloss": { "en": "terrible" } }],
        "transcriptAfterUnaidedListen": true
      },
      "inputItems": [
        { "id": "a2.1-u07-ls2-i01", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Jan ist zu spät. Was war das Problem?", "promptEn": "Jan is late. What was the problem?", "options": ["Der Stau war furchtbar.", "Er hatte einen Arzttermin.", "Das Telefon war kaputt."], "answer": "Der Stau war furchtbar.", "accepted": ["Der Stau war furchtbar."], "explanation": { "de": "Jan sagt: Der Stau war furchtbar.", "en": "Jan says the traffic jam was terrible." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-i02", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Wer sagt: „Wir warten schon.“?", "promptEn": "Who says 'We're already waiting'?", "options": ["Frau Otto", "Priya", "Jan"], "answer": "Frau Otto", "accepted": ["Frau Otto"], "explanation": { "de": "Frau Otto ist in der Teambesprechung und wartet schon.", "en": "Ms Otto is in the team meeting and already waiting." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-i03", "type": "fill_blank", "role": "detail", "topic": "hoeren", "promptDe": "Jan soll sich bei ___ melden.", "promptEn": "Write the name.", "answer": "Frau Kowalski", "accepted": ["Frau Kowalski", "Kowalski", "Monika Kowalski"], "exact": "name", "explanation": { "de": "Priya sagt: Du sollst dich bei ihr melden – bei Frau Kowalski.", "en": "Priya tells Jan to get in touch with Ms Kowalski." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-i04", "type": "multiple_choice", "role": "detail", "topic": "hoeren", "promptDe": "Was macht Priya jetzt?", "promptEn": "What does Priya do now?", "options": ["Sie geht ans Telefon.", "Sie geht zur Besprechung.", "Sie ruft Frau Kowalski an."], "answer": "Sie geht ans Telefon.", "accepted": ["Sie geht ans Telefon."], "explanation": { "de": "Priya sagt: Jetzt gehe ich ans Telefon.", "en": "Priya says she is going to answer the phone now." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-i05", "type": "multiple_choice", "role": "detail", "topic": "hoeren", "promptDe": "Was sagt Frau Otto zu Jan?", "promptEn": "What does Ms Otto say to Jan?", "options": ["„Setzen Sie sich.“", "„Beeil dich!“", "„Melden Sie sich.“"], "answer": "„Setzen Sie sich.“", "accepted": ["„Setzen Sie sich.“", "Setzen Sie sich."], "explanation": { "de": "Frau Otto sagt Sie zu Jan: Setzen Sie sich.", "en": "Ms Otto uses Sie with Jan: Setzen Sie sich." }, "origin": "agent" }
      ],
      "structuredInput": [
        { "id": "a2.1-u07-ls2-s01", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„___ beeilst dich.“ – Wer?", "promptEn": "Who? The pronoun tells you.", "options": ["Du", "Ich", "Wir"], "answer": "Du", "accepted": ["Du"], "explanation": { "de": "dich und die Endung -st passen zu du.", "en": "dich and the ending -st belong to du." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-s02", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„___ verspäten uns leider.“ – Wer?", "promptEn": "Who? The pronoun tells you.", "options": ["Wir", "Ihr", "Sie"], "answer": "Wir", "accepted": ["Wir"], "explanation": { "de": "uns passt zu wir.", "en": "uns belongs to wir." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-s03", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„___ entschuldigt euch bei Frau Otto.“ – Wer?", "promptEn": "Who? The pronoun tells you.", "options": ["Ihr", "Du", "Wir"], "answer": "Ihr", "accepted": ["Ihr"], "explanation": { "de": "euch passt zu ihr.", "en": "euch belongs to ihr." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-s04", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "Priya sagt zu Jan: „Beeil dich!“ – Wer soll schnell machen?", "promptEn": "Who has to hurry?", "options": ["Jan", "Priya", "Frau Otto"], "answer": "Jan", "accepted": ["Jan"], "explanation": { "de": "Beeil dich! – Priya spricht mit Jan. dich ist Jan.", "en": "'Beeil dich!' is said to Jan: dich is Jan." }, "origin": "agent" }
      ],
      "pool": {
        "items": [
          { "id": "a2.1-u07-ls2-p01", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Ich beeile ___.", "promptEn": "Reflexive pronoun for ich.", "answer": "mich", "accepted": ["mich"], "explanation": { "de": "ich beeile mich.", "en": "With ich: mich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p02", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Du sollst ___ bei Frau Kowalski melden.", "promptEn": "Reflexive pronoun for du.", "answer": "dich", "accepted": ["dich"], "explanation": { "de": "du meldest dich – auch mit sollst.", "en": "With du: dich, also after sollst." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p03", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Wir verspäten ___ heute leider.", "promptEn": "Reflexive pronoun for wir.", "answer": "uns", "accepted": ["uns"], "explanation": { "de": "wir verspäten uns.", "en": "With wir: uns." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p04", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Entschuldigt ___ bitte bei Frau Otto!", "promptEn": "Reflexive pronoun for ihr.", "answer": "euch", "accepted": ["euch"], "explanation": { "de": "Imperativ mit ihr: Entschuldigt euch!", "en": "The ihr imperative takes euch." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p05", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["mich", "ich", "beeile"], "answer": "Ich beeile mich.", "accepted": ["Ich beeile mich."], "explanation": { "de": "Subjekt, Verb, dann mich.", "en": "Subject, verb, then mich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p06", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the command.", "tiles": ["dich", "beeil"], "answer": "Beeil dich!", "accepted": ["Beeil dich!"], "explanation": { "de": "Imperativ mit du: Beeil dich!", "en": "The du imperative: Beeil dich!" }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p07", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence in the Perfekt.", "tiles": ["habe", "verspätet", "ich", "mich"], "answer": "Ich habe mich verspätet.", "accepted": ["Ich habe mich verspätet.", "Verspätet habe ich mich."], "acceptedWhy": { "Verspätet habe ich mich.": "grammatisch (Partizip im Vorfeld), aber sehr selten" }, "explanation": { "de": "Perfekt: habe auf Position 2, mich danach, verspätet am Ende.", "en": "Perfekt: habe second, then mich, the participle at the end." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p08", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the polite request.", "tiles": ["Sie", "setzen", "sich", "bitte"], "answer": "Setzen Sie sich bitte.", "accepted": ["Setzen Sie sich bitte.", "Bitte setzen Sie sich."], "explanation": { "de": "Imperativ mit Sie: Setzen Sie sich.", "en": "The Sie imperative: Setzen Sie sich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p09", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["heute", "wir", "uns", "treffen"], "answer": "Wir treffen uns heute.", "accepted": ["Wir treffen uns heute.", "Heute treffen wir uns."], "explanation": { "de": "wir treffen uns – das Verb steht auf Position 2.", "en": "wir treffen uns; the verb is in second position." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p10", "type": "error_correction", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Korrigieren Sie: „Du sollst sich bei ihr melden.“", "promptEn": "Correct the sentence.", "answer": "Du sollst dich bei ihr melden.", "accepted": ["Du sollst dich bei ihr melden."], "intentionalError": true, "errorTag": "reflexive", "explanation": { "de": "Zu du passt dich.", "en": "With du the pronoun is dich." }, "origin": "agent" },
          { "id": "a2.1-u07-ls2-p11", "type": "multiple_choice", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "„Kinder, beeilt ___! Der Bus kommt.“", "promptEn": "Choose the pronoun.", "options": ["euch", "dich", "sich"], "answer": "euch", "accepted": ["euch"], "explanation": { "de": "beeilt ist die ihr-Form, also euch.", "en": "beeilt is the ihr form, so the pronoun is euch." }, "origin": "agent" }
        ],
        "generators": [
          { "generator": "dictation.fromInput", "count": 2, "source": ["a2.1-u07-ls2-l03", "a2.1-u07-ls2-l07"] },
          { "generator": "lex.articlePlural", "count": 1, "source": ["lx.besprechung"] },
          { "generator": "lex.glossTyped", "count": 1, "source": ["lx.besprechung", "lx.techniker"] },
          { "generator": "lex.glossMatch", "count": 1, "source": ["lx.sich-beeilen", "lx.sich-entschuldigen", "lx.sich-setzen", "lx.feierabend"] }
        ]
      },
      "reserve": [
        { "id": "a2.1-u07-ls2-r01", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Jan hat ___ bei Frau Otto entschuldigt.", "promptEn": "Reflexive pronoun in the Perfekt.", "answer": "sich", "accepted": ["sich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben", "repair"], "difficulty": 2, "explanation": { "de": "Jan hat sich entschuldigt: sich steht nach hat.", "en": "Jan hat sich entschuldigt: sich follows hat." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-r02", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Du hast ___ heute verspätet.", "promptEn": "Reflexive pronoun for du.", "answer": "dich", "accepted": ["dich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben", "repair", "einstufung"], "difficulty": 2, "explanation": { "de": "du hast dich verspätet: Zu du passt dich.", "en": "With du the reflexive pronoun is dich." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-r03", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence in the Perfekt.", "tiles": ["hat", "sich", "Frau Otto", "gesetzt"], "answer": "Frau Otto hat sich gesetzt.", "accepted": ["Frau Otto hat sich gesetzt.", "Gesetzt hat sich Frau Otto."], "acceptedWhy": { "Gesetzt hat sich Frau Otto.": "grammatisch (Partizip im Vorfeld betont), aber selten" }, "errorTags": ["perfekt-aux-participle", "reflexive"], "banks": ["plateau", "mehr-ueben", "repair"], "difficulty": 3, "explanation": { "de": "hat auf Position 2, gesetzt am Ende, sich dazwischen.", "en": "hat in second position, gesetzt at the end, sich in between." }, "origin": "agent" },
        { "id": "a2.1-u07-ls2-r04", "type": "multiple_choice", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Jan und Priya, ihr kommt zu spät! ___ euch!", "promptEn": "Choose the verb form.", "options": ["Beeilt", "Beeil", "Beeilen"], "answer": "Beeilt", "accepted": ["Beeilt"], "banks": ["plateau", "mehr-ueben"], "difficulty": 2, "explanation": { "de": "Imperativ mit ihr: Beeilt euch!", "en": "The ihr imperative: Beeilt euch!" }, "origin": "agent" }
      ],
      "microOutput": { "id": "a2.1-u07-ls2-mo", "bankKey": "a21-u07-mo2", "mode": "written", "profile": "course-micro", "situationDe": "Sie sind zu spät zum Deutschkurs gekommen.", "promptDe": "Schreiben Sie Ihrer Lehrerin 1–3 Sätze: Entschuldigen Sie sich. Nennen Sie einen Grund.", "promptEn": "Write a short apology to your teacher with a reason.", "planSeconds": 30, "words": [8, 30], "targets": ["g.reflexiv-akk"], "register": "Sie" },
      "endLine": "Sie können sich jetzt entschuldigen, wenn Sie zu spät kommen."
    },

    {
      "id": "a2.1-u07-ls3", "kind": "situation", "title": "Kann ich etwas ausrichten?",
      "structure": "g.reflexiv-akk", "modelSentence": "Wenn er sich nach zehn Uhr meldet, bin ich nicht mehr im Büro.", "ruleCard": "rc.reflexiv-akk",
      "warmup": { "draw": 6, "contrastWith": "g.wenn" },
      "input": {
        "kind": "mixed", "title": "Ein Anruf für Herrn Brandt", "textType": "tt.telefonnotiz",
        "lines": [
          { "id": "a2.1-u07-ls3-l01", "speaker": "cast.priya", "de": "Brandt Elektrotechnik, Empfang, Priya Nair, guten Tag.", "en": "Brandt Elektrotechnik, reception, Priya Nair speaking, hello." },
          { "id": "a2.1-u07-ls3-l02", "speaker": "cast.herr-seidel", "de": "Guten Tag, Seidel hier. Endlich! Die Leitung war lange besetzt. Kann ich bitte Herrn Brandt sprechen?", "en": "Hello, Seidel here. At last! The line was busy for a long time. May I speak to Mr Brandt, please?" },
          { "id": "a2.1-u07-ls3-l03", "speaker": "cast.priya", "de": "Herr Brandt ist heute Vormittag leider nicht im Haus. Kann ich ihm etwas ausrichten?", "en": "Unfortunately Mr Brandt is out this morning. Can I give him a message?" },
          { "id": "a2.1-u07-ls3-l04", "speaker": "cast.herr-seidel", "de": "Ja, bitte. Es geht um die Rechnung vom 12. März. Da stimmt etwas nicht.", "en": "Yes, please. It's about the invoice of 12 March. Something is wrong with it.", "say": "Ja, bitte. Es geht um die Rechnung vom zwölften März. Da stimmt etwas nicht." },
          { "id": "a2.1-u07-ls3-l05", "speaker": "cast.priya", "de": "Moment, ich schreibe mit. Wie ist Ihre Telefonnummer?", "en": "One moment, I'll take a note. What's your phone number?" },
          { "id": "a2.1-u07-ls3-l06", "speaker": "cast.herr-seidel", "de": "0341 33 18 42. Das ist meine Durchwahl.", "en": "0341 33 18 42. That's my direct line.", "say": "null drei vier eins, dreiunddreißig, achtzehn, zweiundvierzig. Das ist meine Durchwahl." },
          { "id": "a2.1-u07-ls3-l07", "speaker": "cast.priya", "de": "Danke. Ich leite Ihre Nachricht an Herrn Brandt weiter. Er meldet sich morgen früh bei Ihnen. Wenn es dringend ist, verbinde ich Sie mit Frau Otto aus der Buchhaltung.", "en": "Thank you. I'll pass your message on to Mr Brandt. He will get in touch with you tomorrow morning. If it's urgent, I can put you through to Ms Otto in accounts." },
          { "id": "a2.1-u07-ls3-l08", "speaker": "cast.herr-seidel", "de": "Nein danke, so dringend ist es nicht. Ein Rückruf morgen ist in Ordnung. Aber bitte früh: Wenn er sich nach zehn Uhr meldet, bin ich nicht mehr im Büro. Auf Wiederhören!", "en": "No thanks, it's not that urgent. A call back tomorrow is fine. But early, please: if he calls after ten, I won't be in the office any more. Goodbye!" },
          { "id": "a2.1-u07-ls3-l09", "speaker": "cast.priya", "de": "Ich richte es ihm aus. Auf Wiederhören, Herr Seidel!", "en": "I'll tell him. Goodbye, Mr Seidel!" }
        ],
        "text": { "de": "TELEFONNOTIZ\nAnruf für: Herrn Brandt\nAnrufer: Herr Seidel\nTelefon: 0341 33 18 42\nDatum, Uhrzeit: Montag, 9.40 Uhr\nWorum geht es? Rechnung vom 12. März – da stimmt etwas nicht.\nBitte: morgen früh zurückrufen, vor 10 Uhr!\nNotiert von: Priya Nair\nWeitergeleitet an Herrn Brandt: per E-Mail, 9.45 Uhr", "en": "PHONE NOTE — For: Mr Brandt · Caller: Mr Seidel · Phone: 0341 33 18 42 · Monday, 9:40 · About: invoice of 12 March, something is wrong · Please call back tomorrow morning, before 10 · Noted by: Priya Nair · Forwarded to Mr Brandt by e-mail, 9:45" },
        "glosses": [],
        "transcriptAfterUnaidedListen": true
      },
      "inputItems": [
        { "id": "a2.1-u07-ls3-i01", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Warum ruft Herr Seidel an?", "promptEn": "Why does Mr Seidel call?", "options": ["Eine Rechnung ist falsch.", "Er möchte einen Termin.", "Er sucht einen Techniker."], "answer": "Eine Rechnung ist falsch.", "accepted": ["Eine Rechnung ist falsch."], "explanation": { "de": "Er sagt: Da stimmt etwas nicht. Das heißt: Die Rechnung ist falsch.", "en": "'Da stimmt etwas nicht' – something is wrong with the invoice." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-i02", "type": "multiple_choice", "role": "gist", "topic": "hoeren", "promptDe": "Mit wem möchte Herr Seidel sprechen?", "promptEn": "Whom does Mr Seidel want to speak to?", "options": ["mit Herrn Brandt", "mit Frau Otto", "mit Priya"], "answer": "mit Herrn Brandt", "accepted": ["mit Herrn Brandt"], "explanation": { "de": "Er fragt: Kann ich bitte Herrn Brandt sprechen?", "en": "He asks for Mr Brandt." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-i03", "type": "fill_blank", "role": "detail", "topic": "hoeren", "promptDe": "Die Telefonnummer von Herrn Seidel: ___", "promptEn": "Write the number.", "answer": "0341 33 18 42", "accepted": ["0341 33 18 42"], "exact": "number", "explanation": { "de": "Die Nummer: 0341 33 18 42.", "en": "The number is 0341 33 18 42." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-i04", "type": "fill_blank", "role": "detail", "topic": "hoeren", "promptDe": "Herr Brandt soll vor ___ Uhr anrufen.", "promptEn": "Write the hour.", "answer": "10", "accepted": ["10", "zehn"], "exact": "number", "explanation": { "de": "Herr Seidel ist nach zehn Uhr nicht mehr im Büro.", "en": "After ten Mr Seidel is no longer in his office." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-i05", "type": "multiple_choice", "role": "detail", "topic": "hoeren", "promptDe": "Wer arbeitet in der Buchhaltung?", "promptEn": "Who works in accounts?", "options": ["Frau Otto", "Priya", "Herr Seidel"], "answer": "Frau Otto", "accepted": ["Frau Otto"], "explanation": { "de": "Priya sagt: Frau Otto aus der Buchhaltung.", "en": "Priya mentions Ms Otto from accounts." }, "origin": "agent" }
      ],
      "structuredInput": [
        { "id": "a2.1-u07-ls3-s01", "type": "multiple_choice", "role": "structured", "topic": "redemittel", "promptDe": "„Kann ich etwas ausrichten?“ – Was möchte Priya?", "promptEn": "What does Priya offer?", "options": ["eine Nachricht mitnehmen", "später anrufen", "zur Besprechung gehen"], "answer": "eine Nachricht mitnehmen", "accepted": ["eine Nachricht mitnehmen"], "explanation": { "de": "etwas ausrichten = eine Nachricht weitergeben.", "en": "'etwas ausrichten' means passing a message on." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-s02", "type": "multiple_choice", "role": "structured", "topic": "redemittel", "promptDe": "„Ich verbinde Sie mit Frau Otto.“ – Was passiert jetzt?", "promptEn": "What happens next?", "options": ["Frau Otto spricht gleich mit dem Anrufer.", "Frau Otto ruft morgen an.", "Priya schreibt eine Notiz."], "answer": "Frau Otto spricht gleich mit dem Anrufer.", "accepted": ["Frau Otto spricht gleich mit dem Anrufer."], "explanation": { "de": "verbinden: Der Anrufer spricht gleich mit Frau Otto.", "en": "'verbinden' means putting the caller through now." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-s03", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„Er meldet sich morgen bei Ihnen.“ – Wer ruft morgen an?", "promptEn": "Who will call tomorrow?", "options": ["er", "Sie", "Priya"], "answer": "er", "accepted": ["er"], "explanation": { "de": "er meldet sich: er ruft an.", "en": "'er meldet sich' – he will call." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-s04", "type": "multiple_choice", "role": "structured", "topic": "g.reflexiv-akk", "promptDe": "„Wenn Sie sich bis zehn Uhr melden, ist Herr Brandt noch da.“ – Wer soll anrufen?", "promptEn": "Who is supposed to call?", "options": ["Sie", "Herr Brandt", "Frau Otto"], "answer": "Sie", "accepted": ["Sie"], "explanation": { "de": "Sie melden sich: Die Person am Telefon soll anrufen.", "en": "'Sie melden sich' – the person on the phone should call." }, "origin": "agent" }
      ],
      "pool": {
        "items": [
          { "id": "a2.1-u07-ls3-p01", "type": "fill_blank", "role": "practice", "topic": "lx.ausrichten", "promptDe": "Kann ich Herrn Brandt etwas ___?", "promptEn": "Offer to take a message.", "answer": "ausrichten", "accepted": ["ausrichten"], "explanation": { "de": "Kann ich etwas ausrichten? = Kann ich eine Nachricht weitergeben?", "en": "The fixed phrase is 'Kann ich etwas ausrichten?'" }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p02", "type": "fill_blank", "role": "practice", "topic": "lx.verbinden", "promptDe": "Einen Moment, ich ___ Sie mit Frau Otto.", "promptEn": "Put the caller through.", "answer": "verbinde", "accepted": ["verbinde"], "explanation": { "de": "ich verbinde Sie mit … = der Anrufer spricht gleich mit …", "en": "'ich verbinde Sie mit …' – I'm putting you through to …" }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p03", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Wenn Herr Brandt ___ nicht meldet, rufe ich noch einmal an.", "promptEn": "Reflexive pronoun in the wenn-clause.", "answer": "sich", "accepted": ["sich"], "explanation": { "de": "Herr Brandt meldet sich – auch im Nebensatz.", "en": "Herr Brandt meldet sich – also in the wenn-clause." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p04", "type": "fill_blank", "role": "practice", "topic": "lx.besetzt", "promptDe": "Die Leitung ist ___. Bitte rufen Sie später noch einmal an.", "promptEn": "The line is engaged.", "answer": "besetzt", "accepted": ["besetzt"], "explanation": { "de": "Die Leitung ist besetzt: Jemand telefoniert gerade.", "en": "'besetzt' – someone is already on the line." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p05", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Nebensatz: „___, ist Herr Brandt noch da.“", "promptEn": "Build the wenn-clause.", "tiles": ["wenn", "Sie", "sich", "bis zehn Uhr", "melden"], "answer": "Wenn Sie sich bis zehn Uhr melden", "accepted": ["Wenn Sie sich bis zehn Uhr melden"], "explanation": { "de": "Im Nebensatz steht das Verb am Ende. sich steht direkt nach Sie.", "en": "In the wenn-clause the verb goes last; sich follows Sie." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p06", "type": "sentence_building", "role": "practice", "topic": "redemittel", "promptDe": "Bilden Sie die Frage.", "promptEn": "Build the question.", "tiles": ["kann", "ich", "ihm", "etwas", "ausrichten"], "answer": "Kann ich ihm etwas ausrichten?", "accepted": ["Kann ich ihm etwas ausrichten?"], "explanation": { "de": "Ja/Nein-Frage: kann steht vorne, ausrichten am Ende.", "en": "Yes/no question: kann first, ausrichten last." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p07", "type": "sentence_building", "role": "practice", "topic": "redemittel", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["ich", "verbinde", "Sie", "mit Frau Otto"], "answer": "Ich verbinde Sie mit Frau Otto.", "accepted": ["Ich verbinde Sie mit Frau Otto.", "Mit Frau Otto verbinde ich Sie."], "acceptedWhy": { "Mit Frau Otto verbinde ich Sie.": "grammatisch: mit Frau Otto im Vorfeld betont die Person" }, "explanation": { "de": "verbinde steht auf Position 2.", "en": "verbinde is in second position." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p08", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["er", "meldet", "sich", "morgen früh"], "answer": "Er meldet sich morgen früh.", "accepted": ["Er meldet sich morgen früh.", "Morgen früh meldet er sich."], "explanation": { "de": "meldet auf Position 2; nach dem Verb kommen er und sich.", "en": "meldet second; er and sich follow the verb." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p09", "type": "sentence_building", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Nebensatz: „Ich warte hier, ___.“", "promptEn": "Build the wenn-clause.", "tiles": ["wenn", "er", "sich", "verspätet"], "answer": "wenn er sich verspätet", "accepted": ["wenn er sich verspätet"], "explanation": { "de": "wenn … Verb am Ende; sich direkt nach er.", "en": "wenn sends the verb to the end; sich follows er." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p10", "type": "error_correction", "role": "practice", "topic": "g.wenn", "promptDe": "Korrigieren Sie: „Wenn Sie melden sich bis zehn Uhr, ist Herr Brandt da.“", "promptEn": "Correct the word order.", "answer": "Wenn Sie sich bis zehn Uhr melden, ist Herr Brandt da.", "accepted": ["Wenn Sie sich bis zehn Uhr melden, ist Herr Brandt da."], "intentionalError": true, "errorTag": "verb-final", "explanation": { "de": "Nach wenn steht das Verb am Ende: …, wenn Sie sich bis zehn Uhr melden.", "en": "After wenn the verb goes to the end of the clause." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-p11", "type": "multiple_choice", "role": "practice", "topic": "redemittel", "promptDe": "Die Leitung ist besetzt. Was sagen Sie?", "promptEn": "The line is busy. What do you say?", "options": ["Ich rufe später noch einmal an.", "Ich verbinde Sie.", "Kann ich etwas ausrichten?"], "answer": "Ich rufe später noch einmal an.", "accepted": ["Ich rufe später noch einmal an."], "explanation": { "de": "Die Leitung ist besetzt: Sie rufen später noch einmal an.", "en": "If the line is busy, you call again later." }, "origin": "agent" }
        ],
        "generators": [
          { "generator": "dictation.fromInput", "count": 2, "source": ["a2.1-u07-ls3-l03", "a2.1-u07-ls3-l07"] },
          { "generator": "numbers.dictation", "count": 1, "source": ["phone-number-leipzig"] },
          { "generator": "lex.glossTyped", "count": 1, "source": ["lx.verbinden", "lx.ausrichten", "lx.dringend"] },
          { "generator": "lex.glossMatch", "count": 1, "source": ["lx.buchhaltung", "lx.leitung", "lx.durchwahl", "lx.empfang"] }
        ]
      },
      "reserve": [
        { "id": "a2.1-u07-ls3-r01", "type": "fill_blank", "role": "practice", "topic": "g.reflexiv-akk", "promptDe": "Wenn Frau Otto ___ meldet, verbinde ich sie mit Ihnen.", "promptEn": "Reflexive pronoun in the wenn-clause.", "answer": "sich", "accepted": ["sich"], "errorTags": ["reflexive"], "banks": ["plateau", "mehr-ueben", "repair"], "difficulty": 2, "explanation": { "de": "Frau Otto meldet sich – auch im Nebensatz.", "en": "Frau Otto meldet sich – also in the wenn-clause." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-r02", "type": "sentence_building", "role": "practice", "topic": "g.wenn", "promptDe": "Bilden Sie den Nebensatz: „Ich rufe Sie an, ___.“", "promptEn": "Build the wenn-clause.", "tiles": ["wenn", "ich", "mich", "verspäte"], "answer": "wenn ich mich verspäte", "accepted": ["wenn ich mich verspäte"], "errorTags": ["verb-final"], "banks": ["plateau", "mehr-ueben", "repair", "einstufung"], "difficulty": 3, "explanation": { "de": "wenn … Verb am Ende; mich direkt nach ich.", "en": "wenn sends the verb to the end; mich follows ich." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-r03", "type": "fill_blank", "role": "practice", "topic": "lx.ausrichten", "promptDe": "Herr Brandt ist nicht da. Ich ___ ihm Ihre Nachricht aus.", "promptEn": "Verb form of ausrichten for ich.", "answer": "richte", "accepted": ["richte"], "banks": ["plateau", "mehr-ueben"], "difficulty": 2, "explanation": { "de": "ausrichten ist trennbar: Ich richte … aus.", "en": "ausrichten is separable: Ich richte … aus." }, "origin": "agent" },
        { "id": "a2.1-u07-ls3-r04", "type": "multiple_choice", "role": "practice", "topic": "lx.rueckruf", "promptDe": "Herr Seidel möchte, dass Herr Brandt ihn anruft. Was steht auf der Notiz?", "promptEn": "What goes on the phone note?", "options": ["Bitte zurückrufen", "Bitte verbinden", "Bitte weiterleiten"], "answer": "Bitte zurückrufen", "accepted": ["Bitte zurückrufen"], "banks": ["plateau", "mehr-ueben"], "difficulty": 1, "explanation": { "de": "Herr Brandt soll anrufen: Er soll zurückrufen.", "en": "Mr Brandt should call back: 'zurückrufen'." }, "origin": "agent" }
      ],
      "microOutput": { "id": "a2.1-u07-ls3-mo", "bankKey": "a21-u07-mo3", "mode": "spoken", "profile": "course-micro-sp", "situationDe": "Herr Seidel hat für Ihre Kollegin angerufen. Sie ist nicht im Büro.", "promptDe": "Sprechen Sie ihr auf die Mailbox: Worum geht es? Was soll sie tun?", "promptEn": "Leave your colleague a voicemail: what the call was about and what she should do.", "planSeconds": 30, "seconds": [30, 40], "targets": ["g.reflexiv-akk"], "register": "du" },
      "aussprache": {
        "focus": "Satzmelodie: Frage oder Aussage?",
        "perception": [
          { "id": "a2.1-u07-ls3-x01", "type": "listen_select", "role": "perception", "topic": "aussprache", "promptDe": "Hören Sie: „Sie melden sich morgen.“ Frage oder Aussage?", "promptEn": "Question or statement?", "options": ["Aussage", "Frage"], "answer": "Aussage", "accepted": ["Aussage"], "explanation": { "de": "Die Melodie geht am Ende nach unten: Aussage.", "en": "The pitch falls at the end: a statement." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-x02", "type": "listen_select", "role": "perception", "topic": "aussprache", "promptDe": "Hören Sie: „Sie melden sich morgen?“ Frage oder Aussage?", "promptEn": "Question or statement?", "options": ["Frage", "Aussage"], "answer": "Frage", "accepted": ["Frage"], "explanation": { "de": "Die Melodie geht am Ende nach oben: Frage.", "en": "The pitch rises at the end: a question." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-x03", "type": "listen_select", "role": "perception", "topic": "aussprache", "promptDe": "Hören Sie: „Er ist nicht im Haus.“ Frage oder Aussage?", "promptEn": "Question or statement?", "options": ["Aussage", "Frage"], "answer": "Aussage", "accepted": ["Aussage"], "explanation": { "de": "Die Melodie fällt am Ende: Aussage.", "en": "Falling pitch: a statement." }, "origin": "agent" },
          { "id": "a2.1-u07-ls3-x04", "type": "listen_select", "role": "perception", "topic": "aussprache", "promptDe": "Hören Sie: „Er ist nicht im Haus?“ Frage oder Aussage?", "promptEn": "Question or statement?", "options": ["Frage", "Aussage"], "answer": "Frage", "accepted": ["Frage"], "explanation": { "de": "Die Melodie steigt am Ende: Frage.", "en": "Rising pitch: a question." }, "origin": "agent" }
        ],
        "readAloud": { "lineDe": "Kann ich ihm etwas ausrichten?" }
      },
      "endLine": "Sie können jetzt eine Nachricht für den Chef annehmen und notieren."
    },

    {
      "id": "a2.1-u07-ls4", "kind": "pruefung",
      "texts": [
        { "id": "a2.1-u07-ls4-t1", "kind": "audio", "title": "Anrufbeantworter", "lines": [{ "id": "a2.1-u07-ls4-t1-l01", "speaker": "ansage", "de": "Hier ist die Praxis Dr. Albers. Frau Nair, Ihr Termin am Donnerstag um 15 Uhr muss leider ausfallen. Können Sie am Freitag um 8.30 Uhr kommen? Bitte rufen Sie uns kurz zurück.", "en": "This is Dr Albers' practice. Ms Nair, your appointment on Thursday at 3 pm has to be cancelled. Can you come on Friday at 8:30? Please call us back.", "say": "Hier ist die Praxis Doktor Albers. Frau Nair, Ihr Termin am Donnerstag um fünfzehn Uhr muss leider ausfallen. Können Sie am Freitag um acht Uhr dreißig kommen? Bitte rufen Sie uns kurz zurück." }], "glosses": [] },
        { "id": "a2.1-u07-ls4-t2", "kind": "audio", "title": "Radio", "lines": [{ "id": "a2.1-u07-ls4-t2-l01", "speaker": "radio", "de": "Und jetzt der Verkehr: Auf der Autobahn A 9 zwischen Leipzig und Halle gibt es nach einem Unfall zehn Kilometer Stau. Fahren Sie bitte über die A 14.", "en": "And now the traffic: on the A9 motorway between Leipzig and Halle there is a ten-kilometre jam after an accident. Please take the A14.", "say": "Und jetzt der Verkehr: Auf der Autobahn A neun zwischen Leipzig und Halle gibt es nach einem Unfall zehn Kilometer Stau. Fahren Sie bitte über die A vierzehn." }], "glosses": [{ "token": "Unfall", "gloss": { "en": "accident" } }] },
        { "id": "a2.1-u07-ls4-t3", "kind": "audio", "title": "Durchsage in der Firma", "lines": [{ "id": "a2.1-u07-ls4-t3-l01", "speaker": "durchsage", "de": "Liebe Kolleginnen und Kollegen, heute ist die Kantine zu. Die Küche ist kaputt. Mittagessen gibt es im Konferenzraum im zweiten Stock: Suppe und Brötchen. Morgen ist die Kantine wieder offen.", "en": "Dear colleagues, the canteen is closed today. The kitchen is broken. Lunch is in the meeting room on the second floor: soup and rolls. The canteen reopens tomorrow." }], "glosses": [] },
        { "id": "a2.1-u07-ls4-t4", "kind": "audio", "title": "Mailbox", "lines": [{ "id": "a2.1-u07-ls4-t4-l01", "speaker": "cast.anna", "de": "Hallo Priya, hier ist Anna. Das Schwimmbad ist am Samstag leider geschlossen. Wollen wir lieber ins Kino gehen? Der Film fängt um acht an. Melde dich!", "en": "Hi Priya, it's Anna. The swimming pool is closed on Saturday, unfortunately. Shall we go to the cinema instead? The film starts at eight. Let me know!" }], "glosses": [] },
        { "id": "a2.1-u07-ls4-t5", "kind": "audio", "title": "Wetter", "lines": [{ "id": "a2.1-u07-ls4-t5-l01", "speaker": "radio", "de": "Das Wetter für morgen: Am Vormittag regnet es noch, am Nachmittag scheint dann die Sonne. Die Temperaturen liegen bei 18 Grad. Am Abend gibt es wieder Wolken.", "en": "The weather for tomorrow: rain in the morning, then sunshine in the afternoon. Temperatures around 18 degrees. Clouds return in the evening.", "say": "Das Wetter für morgen: Am Vormittag regnet es noch, am Nachmittag scheint dann die Sonne. Die Temperaturen liegen bei achtzehn Grad. Am Abend gibt es wieder Wolken." }], "glosses": [] }
      ],
      "blocks": [
        {
          "id": "a2.1-u07-ls4-ga2-h1", "template": "ga2.h1", "lane": "ga2", "length": "full", "scaffolded": false, "modeDefault": "lern",
          "instructionsDe": "Sie hören fünf kurze Texte zweimal. Wählen Sie a, b oder c.",
          "textRefs": ["a2.1-u07-ls4-t1", "a2.1-u07-ls4-t2", "a2.1-u07-ls4-t3", "a2.1-u07-ls4-t4", "a2.1-u07-ls4-t5"],
          "items": [
            { "id": "a2.1-u07-ls4-ga2-h1-01", "type": "abc", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-t1", "promptDe": "Wann soll Frau Nair in die Praxis kommen?", "options": ["am Donnerstag um 15 Uhr", "am Freitag um 8.30 Uhr", "am Freitag um 15 Uhr"], "answer": "am Freitag um 8.30 Uhr", "accepted": ["am Freitag um 8.30 Uhr"], "exact": "number", "explanation": { "de": "Der Termin am Donnerstag fällt aus. Neu: Freitag, 8.30 Uhr.", "en": "Thursday is cancelled; the new time is Friday at 8:30." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ga2-h1-02", "type": "abc", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-t2", "promptDe": "Was sollen die Autofahrer tun?", "options": ["zehn Kilometer warten", "nach Halle fahren", "die A 14 nehmen"], "answer": "die A 14 nehmen", "accepted": ["die A 14 nehmen"], "exact": "number", "explanation": { "de": "Im Radio hören Sie: Fahren Sie bitte über die A 14.", "en": "The radio says: please take the A14." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ga2-h1-03", "type": "abc", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-t3", "promptDe": "Wo gibt es heute Mittagessen?", "options": ["im Konferenzraum", "in der Kantine", "im Erdgeschoss"], "answer": "im Konferenzraum", "accepted": ["im Konferenzraum"], "explanation": { "de": "Die Kantine ist zu. Mittagessen gibt es im Konferenzraum.", "en": "The canteen is closed; lunch is in the meeting room." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ga2-h1-04", "type": "abc", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-t4", "promptDe": "Was möchte Anna am Samstag machen?", "options": ["schwimmen gehen", "um acht Uhr telefonieren", "ins Kino gehen"], "answer": "ins Kino gehen", "accepted": ["ins Kino gehen"], "explanation": { "de": "Das Schwimmbad ist geschlossen. Anna fragt: Wollen wir lieber ins Kino gehen?", "en": "The pool is closed, so Anna suggests the cinema." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ga2-h1-05", "type": "abc", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-t5", "promptDe": "Wie wird das Wetter morgen Nachmittag?", "options": ["Es regnet.", "Es ist sonnig.", "Es ist kalt."], "answer": "Es ist sonnig.", "accepted": ["Es ist sonnig."], "explanation": { "de": "Am Nachmittag scheint die Sonne. Regen gibt es nur am Vormittag.", "en": "Rain only in the morning; sunshine in the afternoon." }, "origin": "agent" }
          ]
        }
      ],
      "strategyCards": [
        { "template": "ga2.h1", "de": "Hören Teil 1: Sie hören fünf kurze Texte zweimal. Lesen Sie zuerst die Frage und die drei Antworten. Achten Sie auf Zeiten, Tage und Orte. Oft hören Sie alle drei Antworten – aber nur eine passt zur Frage.", "en": "Listening part 1: five short texts, each played twice. Read the question and options first; listen for times, days and places. You often hear all three options, but only one answers the question." }
      ]
    },

    {
      "id": "a2.1-u07-ls5", "kind": "sprechen",
      "task": {
        "bankKey": "a21-u07-s", "lane": "ga2", "template": "ga2.sp1", "mode": "cards-ask", "profile": "ga2-sp1", "prepMinutes": 0,
        "instructionsDe": "Fragen Sie mit jeder Karte. Ihre Partnerin antwortet. Dann fragt sie, Sie antworten.",
        "situationDe": "Sprechen Teil 1: Sie und Ihre Partnerin haben je vier Karten zum Thema Arbeit.",
        "cards": { "learner": ["Arbeitszeit?", "Kollegen?", "Weg zur Arbeit?", "Mittagspause?"], "partner": ["Beruf?", "Telefon?", "Feierabend?", "Überstunden?"] },
        "turns": [8, 8],
        "moves": [],
        "aiRole": { "name": "Sofia", "personaDe": "Teilnehmerin in der Prüfung, arbeitet in einem Hotel in Leipzig, antwortet in einfachen, vollständigen Sätzen", "register": "Sie", "support": "clarify" },
        "openingLine": "Guten Tag! Wir beginnen mit Teil 1. Stellen Sie bitte Ihre erste Frage.",
        "hintWords": ["Wann …?", "Wie …?", "Wie lange …?", "Wo …?", "Arbeitszeit", "Kollegen", "Weg", "Mittagspause"],
        "modelTurns": [
          { "speaker": "learner", "de": "Wie lange arbeiten Sie am Tag?" },
          { "speaker": "partner", "de": "Ich arbeite acht Stunden, von sieben bis vier." },
          { "speaker": "partner", "de": "Was sind Sie von Beruf?" },
          { "speaker": "learner", "de": "Ich arbeite am Empfang in einer Firma." }
        ]
      }
    },

    {
      "id": "a2.1-u07-ls6", "kind": "schreiben",
      "task": {
        "bankKey": "a21-u07-w", "lane": "ga2", "template": "ga2.s2", "examKey": "goethe_a2", "profile": "ga2-s2",
        "register": "halbformell", "address": "Sie",
        "title": "Einen Termin absagen",
        "situationDe": "Sie haben morgen um 14 Uhr eine Besprechung mit Frau Kowalski von der Firma Hansen Bau. Sie können nicht kommen.",
        "taskDe": "Schreiben Sie Frau Kowalski eine E-Mail zu allen drei Punkten (30 bis 40 Wörter).",
        "leitpunkte": [
          { "id": "lp1", "de": "Sagen Sie ab und entschuldigen Sie sich.", "cues": ["leider", "tut mir leid", "Entschuldigung", "nicht kommen", "absagen"] },
          { "id": "lp2", "de": "Nennen Sie einen Grund.", "cues": ["weil", "denn", "muss", "krank", "Arzt"] },
          { "id": "lp3", "de": "Schlagen Sie einen neuen Termin vor.", "cues": ["Können wir", "Wie wäre es", "am", "um", "treffen", "neuen Termin"] }
        ],
        "wordBand": [30, 40],
        "minSubmitWords": 15,
        "checklist": ["Anrede", "Punkt 1: absagen und entschuldigen", "Punkt 2: Grund", "Punkt 3: neuer Termin", "Gruß", "Sie-Form", "30 bis 40 Wörter"],
        "modelText": "Liebe Frau Kowalski,\nleider kann ich morgen nicht zu unserer Besprechung kommen. Es tut mir leid, aber ich muss zum Arzt. Können wir uns am Freitag um 10 Uhr treffen? Bitte melden Sie sich kurz.\nViele Grüße\nPriya Nair"
      }
    },

    { "id": "a2.1-u07-ls7", "kind": "check", "endLine": "Geschafft! Sie können jetzt am Telefon im Job Nachrichten verstehen, notieren und weitergeben." }
  ],

  "check": {
    "lines": [
      { "id": "a2.1-u07-ls7-l01", "speaker": "x.herr-winter", "de": "Hallo, hier ist Herr Winter von der Firma Lange. Bitte rufen Sie mich heute bis 16 Uhr zurück. Meine Nummer ist 0341 90 12 33.", "en": "Hello, this is Mr Winter from Lange. Please call me back today by 4 pm. My number is 0341 90 12 33.", "say": "Hallo, hier ist Herr Winter von der Firma Lange. Bitte rufen Sie mich heute bis sechzehn Uhr zurück. Meine Nummer ist null drei vier eins, neunzig, zwölf, dreiunddreißig." },
      { "id": "a2.1-u07-ls7-l02", "speaker": "ansage", "de": "Bitte rufen Sie mich zurück.", "en": "Please call me back." },
      { "id": "a2.1-u07-ls7-l03", "speaker": "ansage", "de": "Meine Nummer ist 0341 44 20 17.", "en": "My number is 0341 44 20 17.", "say": "Meine Nummer ist null drei vier eins, vierundvierzig, zwanzig, siebzehn." }
    ],
    "items": [
      { "id": "a2.1-u07-c01", "type": "fill_blank", "role": "check", "topic": "g.reflexiv-akk", "promptDe": "Wir melden ___ morgen bei Ihnen.", "promptEn": "Reflexive pronoun for wir.", "answer": "uns", "accepted": ["uns"], "explanation": { "de": "wir melden uns.", "en": "With wir: uns." }, "origin": "agent" },
      { "id": "a2.1-u07-c02", "type": "fill_blank", "role": "check", "topic": "g.reflexiv-akk", "promptDe": "Setz ___ doch, Jan!", "promptEn": "Reflexive pronoun in the du imperative.", "answer": "dich", "accepted": ["dich"], "explanation": { "de": "Imperativ mit du: Setz dich!", "en": "du imperative: Setz dich!" }, "origin": "agent" },
      { "id": "a2.1-u07-c03", "type": "sentence_building", "role": "check", "topic": "g.reflexiv-akk", "promptDe": "Bilden Sie den Satz.", "promptEn": "Build the sentence.", "tiles": ["sich", "verspätet", "der Zug"], "answer": "Der Zug verspätet sich.", "accepted": ["Der Zug verspätet sich."], "explanation": { "de": "Subjekt, Verb, sich.", "en": "Subject, verb, sich." }, "origin": "agent" },
      { "id": "a2.1-u07-c04", "type": "multiple_choice", "role": "check", "topic": "lx.besetzt", "promptDe": "Die Leitung ist ___.", "promptEn": "Choose the word.", "options": ["besetzt", "beschäftigt", "dringend"], "answer": "besetzt", "accepted": ["besetzt"], "explanation": { "de": "Eine Leitung ist besetzt. Eine Person ist beschäftigt.", "en": "A line is 'besetzt'; a person is 'beschäftigt'." }, "origin": "agent" },
      { "id": "a2.1-u07-c05", "type": "fill_blank", "role": "check", "topic": "lx.verbinden", "promptDe": "Einen Moment bitte, ich ___ Sie mit der Buchhaltung.", "promptEn": "Put the caller through.", "answer": "verbinde", "accepted": ["verbinde"], "explanation": { "de": "ich verbinde Sie mit …", "en": "'ich verbinde Sie mit …'" }, "origin": "agent" },
      { "id": "a2.1-u07-c06", "type": "dictation", "role": "check", "topic": "hoeren", "promptDe": "Hören Sie und schreiben Sie den Satz.", "promptEn": "Listen and write the sentence.", "audioLineRef": "a2.1-u07-ls7-l02", "answer": "Bitte rufen Sie mich zurück.", "accepted": ["Bitte rufen Sie mich zurück."], "explanation": { "de": "zurückrufen: Das zurück steht am Ende.", "en": "zurückrufen is separable: zurück goes to the end." }, "origin": "agent" },
      { "id": "a2.1-u07-c07", "type": "dictation", "role": "check", "topic": "hoeren", "promptDe": "Hören Sie die Nummer und schreiben Sie sie auf.", "promptEn": "Write the number you hear.", "audioLineRef": "a2.1-u07-ls7-l03", "answer": "0341 44 20 17", "accepted": ["0341 44 20 17"], "exact": "number", "explanation": { "de": "0341 44 20 17 – jede Ziffer zählt.", "en": "0341 44 20 17 – every digit counts." }, "origin": "agent" },
      { "id": "a2.1-u07-c08", "type": "error_correction", "role": "check", "topic": "g.reflexiv-akk", "promptDe": "Korrigieren Sie: „Beeil dich, wir verspäten sich!“", "promptEn": "Correct the sentence.", "answer": "Beeil dich, wir verspäten uns!", "accepted": ["Beeil dich, wir verspäten uns!"], "intentionalError": true, "errorTag": "reflexive", "explanation": { "de": "Zu wir passt uns.", "en": "With wir the pronoun is uns." }, "origin": "agent" }
    ],
    "earlierDraw": { "count": 4, "from": "previous-3", "pool": "reserve" },
    "proofItems": [
      { "id": "a2.1-u07-q01", "type": "multiple_choice", "role": "proof", "topic": "hoeren", "audioLineRef": "a2.1-u07-ls7-l01", "promptDe": "Hören Sie die Nachricht. Welche Notiz ist richtig?", "promptEn": "Which note is correct?", "options": ["Herr Winter – bis 16 Uhr zurückrufen – 0341 90 12 33", "Herr Lange – bis 16 Uhr zurückrufen – 0341 90 12 33", "Herr Winter – morgen zurückrufen – 0341 90 12 33"], "answer": "Herr Winter – bis 16 Uhr zurückrufen – 0341 90 12 33", "accepted": ["Herr Winter – bis 16 Uhr zurückrufen – 0341 90 12 33"], "exact": "number", "explanation": { "de": "Herr Winter ist von der Firma Lange. Er möchte heute bis 16 Uhr einen Rückruf.", "en": "Mr Winter is from the company Lange and wants a call back by 4 pm today." }, "origin": "agent" },
      { "id": "a2.1-u07-q02", "type": "fill_blank", "role": "proof", "topic": "lx.ausrichten", "promptDe": "Der Chef ist nicht da. Sie fragen den Anrufer: „Kann ich ihm etwas ___?“", "promptEn": "Offer to take a message.", "answer": "ausrichten", "accepted": ["ausrichten"], "explanation": { "de": "Kann ich ihm etwas ausrichten?", "en": "'Kann ich ihm etwas ausrichten?'" }, "origin": "agent" }
    ],
    "proofs": [
      { "canDo": "cd.a2.mailbox-verstehen", "item": "a2.1-u07-q01" },
      { "canDo": "cd.a2.rueckruf-weitergeben", "item": "a2.1-u07-q02" },
      { "canDo": "cd.a2.arbeit-erzaehlen", "aufgabe": "sprechen" },
      { "canDo": "cd.a2.termin-absagen-mail", "aufgabe": "schreiben" }
    ],
    "testOutThreshold": 0.8,
    "cumulativeShare": 0.35
  },

  "redemittel": [
    { "id": "a2.1-u07-rm01", "de": "Kann ich etwas ausrichten?", "en": "Can I take a message?", "function": "eine Nachricht annehmen" },
    { "id": "a2.1-u07-rm02", "de": "Einen Moment, ich verbinde Sie.", "en": "One moment, I'll put you through.", "function": "verbinden" },
    { "id": "a2.1-u07-rm03", "de": "Bitte melden Sie sich bei mir.", "en": "Please get in touch with me.", "function": "um Rückruf bitten" },
    { "id": "a2.1-u07-rm04", "de": "Tut mir leid, ich verspäte mich.", "en": "Sorry, I'm running late.", "function": "Verspätung ankündigen" },
    { "id": "a2.1-u07-rm05", "de": "Wie ist Ihre Telefonnummer?", "en": "What's your phone number?", "function": "nachfragen", "forTemplate": "ga2.sp1" }
  ],

  "story": {
    "beat": "Priya schafft ihren ersten Vormittag allein am Empfang.",
    "cliffhanger": "Um 17 Uhr blinkt das Telefon noch einmal. Eine Nachricht von Emre: „Priya, ruf mich an! Ich habe große Neuigkeiten!“",
    "castIn": ["cast.emre"]
  },

  "fokus": [
    {
      "id": "a2.1-u07-fk1", "kind": "beruf", "title": "Pausen bei der Arbeit",
      "bodyDe": "Arbeiten Sie mehr als sechs Stunden am Tag? Dann bekommen Sie mindestens 30 Minuten Pause. Wenn Sie mehr als neun Stunden arbeiten, sind es 45 Minuten. Sie können die Pause teilen: Jeder Teil dauert mindestens 15 Minuten. Für Jugendliche unter 18 Jahren und in manchen Branchen gelten andere Regeln.",
      "bodyEn": "Working time law: more than six hours of work a day means at least 30 minutes of break; more than nine hours, 45 minutes. Breaks may be split into parts of at least 15 minutes. Different rules apply to employees under 18 and in some sectors.",
      "factRefs": ["a2.1-u07-f01"], "minutes": 10, "optional": true
    }
  ],

  "facts": [
    {
      "id": "a2.1-u07-f01",
      "claimDe": "Bei mehr als sechs bis zu neun Stunden Arbeit sind mindestens 30 Minuten Ruhepause vorgeschrieben, bei mehr als neun Stunden 45 Minuten; Pausen können in Abschnitte von mindestens 15 Minuten geteilt werden.",
      "claimEn": "More than six and up to nine hours of work require at least 30 minutes of rest break, more than nine hours 45 minutes; breaks may be split into periods of at least 15 minutes.",
      "sources": ["https://dejure.org/gesetze/ArbZG/4.html"],
      "factsCheckedOn": "2026-09-27",
      "currentAsOf": "2026-09-27",
      "exceptions": [
        { "de": "Für Jugendliche unter 18 Jahren gelten eigene Pausenregeln (Jugendarbeitsschutzgesetz).", "en": "Employees under 18 have their own break rules (Youth Employment Protection Act)." },
        { "de": "Ein Tarifvertrag kann in manchen Betrieben andere Pausen erlauben, zum Beispiel Kurzpausen im Schichtdienst (§ 7 ArbZG).", "en": "A collective agreement may allow different breaks in some workplaces, e.g. short breaks in shift work (§ 7 ArbZG)." }
      ],
      "verification": "partial",
      "notes": "§ 4 ArbZG read at dejure.org on 2026-09-27. The JArbSchG and § 7 ArbZG exceptions were not re-read in this session (gesetze-im-internet.de returned 503, buzer.de 403) and are (unverified): a reviewer confirms both before promotion (CON-06)."
    }
  ],

  "extras": {
    "x.herr-winter": { "role": "Anrufer von der Firma Lange", "gender": "m", "age": 50, "voice": "de-DE-ChristophNeural", "rate": "-5%", "variety": "D" }
  },
  "assets": []
}
```

### 15.4 The telc A2 lane pack `content/course-v2/a2.1/units/u07.lane-ta2.json`

Written by a different agent from the unit file (lease rule, BLUEPRINT §10.5). A telc A2 learner sees this block in
LS4 instead of `ga2.h1`; for LS5/LS6 A2.1 is a .1 course, so the primary tasks are shown with their origin labels.

```json
{
  "$schema": "course-v2/lanepack@1",
  "unit": "a2.1-u07",
  "lane": "ta2",
  "version": 1,
  "status": "review",
  "reviewedIn": null,
  "slots": {
    "ls4": {
      "mode": "replace",
      "texts": [
        { "id": "a2.1-u07-ls4-ta2-t1", "kind": "audio", "title": "Zahnarztpraxis", "lines": [{ "id": "a2.1-u07-ls4-ta2-t1-l01", "speaker": "ansage", "de": "Guten Tag, hier ist die Zahnarztpraxis Dr. Lehmann. Frau Nair, Sie haben am Dienstag einen Termin bei uns. Leider müssen wir die Uhrzeit ändern.", "en": "Hello, this is Dr Lehmann's dental practice. Ms Nair, you have an appointment with us on Tuesday. Unfortunately we have to change the time.", "say": "Guten Tag, hier ist die Zahnarztpraxis Doktor Lehmann. Frau Nair, Sie haben am Dienstag einen Termin bei uns. Leider müssen wir die Uhrzeit ändern." }, { "id": "a2.1-u07-ls4-ta2-t1-l02", "speaker": "ansage", "de": "Bitte kommen Sie nicht um zehn Uhr, sondern um 11.15 Uhr. Wenn das nicht geht, rufen Sie uns bitte zurück. Auf Wiederhören!", "en": "Please come not at ten but at 11:15. If that doesn't work, please call us back. Goodbye!", "say": "Bitte kommen Sie nicht um zehn Uhr, sondern um elf Uhr fünfzehn. Wenn das nicht geht, rufen Sie uns bitte zurück. Auf Wiederhören!" }], "glosses": [] },
        { "id": "a2.1-u07-ls4-ta2-t2", "kind": "audio", "title": "Paketdienst", "lines": [{ "id": "a2.1-u07-ls4-ta2-t2-l01", "speaker": "ansage", "de": "Hallo, hier ist Ihr Paketdienst. Wir waren heute um 14 Uhr bei Ihnen, aber Sie waren nicht zu Hause. Ihr Paket ist jetzt bei Ihren Nachbarn, bei Familie Rohde. Ich buchstabiere: R-O-H-D-E. Familie Rohde wohnt im Erdgeschoss.", "en": "Hello, this is your parcel service. We came by at 2 pm today, but you weren't at home. Your parcel is now with your neighbours, the Rohde family. I'll spell it: R-O-H-D-E. The Rohdes live on the ground floor.", "say": "Hallo, hier ist Ihr Paketdienst. Wir waren heute um vierzehn Uhr bei Ihnen, aber Sie waren nicht zu Hause. Ihr Paket ist jetzt bei Ihren Nachbarn, bei Familie Rohde. Ich buchstabiere: Er – O – Ha – De – E. Familie Rohde wohnt im Erdgeschoss." }], "glosses": [] },
        { "id": "a2.1-u07-ls4-ta2-t3", "kind": "audio", "title": "Stadtbibliothek", "lines": [{ "id": "a2.1-u07-ls4-ta2-t3-l01", "speaker": "x.frau-klein", "de": "Guten Tag, hier spricht Frau Klein von der Stadtbibliothek. Sie haben noch zwei Bücher von uns. Bitte bringen Sie die Bücher bis Freitag zurück.", "en": "Hello, this is Ms Klein from the city library. You still have two of our books. Please return them by Friday." }, { "id": "a2.1-u07-ls4-ta2-t3-l02", "speaker": "x.frau-klein", "de": "Haben Sie noch Fragen? Dann rufen Sie mich bitte an. Meine Nummer ist 0341 72 55 18.", "en": "Any questions? Then please call me. My number is 0341 72 55 18.", "say": "Haben Sie noch Fragen? Dann rufen Sie mich bitte an. Meine Nummer ist null drei vier eins, zweiundsiebzig, fünfundfünfzig, achtzehn." }], "glosses": [] },
        { "id": "a2.1-u07-ls4-ta2-t4", "kind": "audio", "title": "Nachricht von Anna", "lines": [{ "id": "a2.1-u07-ls4-ta2-t4-l01", "speaker": "cast.anna", "de": "Hallo Priya, hier ist Anna. Wir fahren doch am Sonntag nach Dresden. Wir treffen uns aber nicht an der Bushaltestelle, sondern am Hauptbahnhof, vor der Information. Der Zug fährt um neun Uhr. Sei bitte pünktlich! Bis Sonntag!", "en": "Hi Priya, it's Anna. We're going to Dresden on Sunday, right? But we're not meeting at the bus stop – we're meeting at the main station, in front of the information desk. The train leaves at nine. Please be on time! See you Sunday!" }], "glosses": [] },
        { "id": "a2.1-u07-ls4-ta2-t5", "kind": "audio", "title": "Volkshochschule", "lines": [{ "id": "a2.1-u07-ls4-ta2-t5-l01", "speaker": "ansage", "de": "Hier ist die Volkshochschule Leipzig. Sie möchten einen Computerkurs für Anfänger machen? Der Kurs beginnt am 4. Mai, immer am Mittwochabend, und kostet 85 Euro.", "en": "This is Leipzig adult education centre. You'd like to take a computer course for beginners? The course starts on 4 May, always on Wednesday evenings, and costs 85 euros.", "say": "Hier ist die Volkshochschule Leipzig. Sie möchten einen Computerkurs für Anfänger machen? Der Kurs beginnt am vierten Mai, immer am Mittwochabend, und kostet fünfundachtzig Euro." }, { "id": "a2.1-u07-ls4-ta2-t5-l02", "speaker": "ansage", "de": "Bitte melden Sie sich bis Ende April an. Sie können sich auch im Internet anmelden.", "en": "Please sign up by the end of April. You can also sign up online." }], "glosses": [] }
      ],
      "blocks": [
        {
          "id": "a2.1-u07-ls4-ta2-h1", "template": "ta2.h1", "lane": "ta2", "length": "full", "scaffolded": false, "modeDefault": "lern",
          "instructionsDe": "Sie hören fünf Ansagen am Telefon zweimal. Ergänzen Sie die Notizen.",
          "textRefs": ["a2.1-u07-ls4-ta2-t1", "a2.1-u07-ls4-ta2-t2", "a2.1-u07-ls4-ta2-t3", "a2.1-u07-ls4-ta2-t4", "a2.1-u07-ls4-ta2-t5"],
          "items": [
            { "id": "a2.1-u07-ls4-ta2-h1-01", "type": "notes", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-ta2-t1", "promptDe": "Zahnarzt: Dienstag, um ___ Uhr", "answer": "11.15", "accepted": ["11.15", "11:15", "11.15 Uhr", "11:15 Uhr", "Viertel nach elf"], "exact": "number", "explanation": { "de": "Nicht um zehn Uhr, sondern um 11.15 Uhr. Achten Sie auf „nicht …, sondern …“.", "en": "Not at ten but at 11:15 – listen for 'nicht …, sondern …'." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ta2-h1-02", "type": "notes", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-ta2-t2", "promptDe": "Das Paket ist bei Familie ___.", "answer": "Rohde", "accepted": ["Rohde"], "exact": "name", "explanation": { "de": "Der Name wird buchstabiert: R-O-H-D-E. Jeder Buchstabe zählt.", "en": "The name is spelled out: R-O-H-D-E. Every letter counts." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ta2-h1-03", "type": "notes", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-ta2-t3", "promptDe": "Frau Klein, Stadtbibliothek – Telefon: ___", "answer": "0341 72 55 18", "accepted": ["0341 72 55 18"], "exact": "number", "explanation": { "de": "Die Nummer: 0341 72 55 18. Jede Ziffer zählt.", "en": "The number is 0341 72 55 18 – every digit counts." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ta2-h1-04", "type": "notes", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-ta2-t4", "promptDe": "Treffpunkt am Sonntag: ___", "answer": "am Hauptbahnhof", "accepted": ["am Hauptbahnhof", "Hauptbahnhof", "am Hauptbahnhof, vor der Information", "Hauptbahnhof, vor der Information", "vor der Information am Hauptbahnhof"], "explanation": { "de": "Nicht an der Bushaltestelle, sondern am Hauptbahnhof, vor der Information.", "en": "Not at the bus stop but at the main station, in front of the information desk." }, "origin": "agent" },
            { "id": "a2.1-u07-ls4-ta2-h1-05", "type": "notes", "role": "exam", "topic": "hoeren", "textRef": "a2.1-u07-ls4-ta2-t5", "promptDe": "Computerkurs: Preis ___ Euro", "answer": "85", "accepted": ["85", "85,00", "85 Euro"], "exact": "number", "explanation": { "de": "Der Kurs kostet 85 Euro. Der 4. Mai ist das Datum, nicht der Preis.", "en": "The course costs 85 euros; 4 May is the start date, not the price." }, "origin": "agent" }
          ]
        }
      ],
      "strategyCards": [
        { "template": "ta2.h1", "de": "Hören Teil 1: Sie hören fünf Ansagen am Telefon zweimal. Lesen Sie zuerst die Notiz: Fehlt eine Uhrzeit, eine Nummer, ein Preis oder ein Name? Schreiben Sie Zahlen und buchstabierte Namen genau – jede Ziffer und jeder Buchstabe zählt.", "en": "Listening part 1: five phone messages, each played twice. Read the note first – is a time, number, price or name missing? Write numbers and spelled names exactly." }
      ]
    }
  },
  "originLabels": {
    "sprechen": "im Format: Goethe-Zertifikat A2, Sprechen Teil 1 – in Ihrer Prüfung ähnlich: telc Deutsch A2, Sprechen Teil 2",
    "schreiben": "im Format: Goethe-Zertifikat A2, Schreiben Teil 2"
  },
  "extras": {
    "x.frau-klein": { "role": "Mitarbeiterin der Stadtbibliothek", "gender": "f", "age": 45, "voice": "de-DE-ElkeNeural", "rate": "-5%", "variety": "D" }
  },
  "assets": []
}
```

The `sprechen` label follows `ga2.sp1.transfersTo: ["ta2.sp2"]` in the lane registry; `ga2.s2` has no telc A2
counterpart, so its label names only the source format (COV-6). A2.2 must carry lane-exact `schreiben` / `sprechen`
slots for ta2 in every unit whose primary task is not lane-exact (COV-6 in a .2 course).

### 15.5 What the compiler makes of it (excerpts)

**Pool item** — `a2.1-u07-ls1-p06` in the live `lessonPools` item shape, read unchanged by `check.js`, `requeue.js`,
`mastery.js` and `reviewGrading` (`src/data/course-v2/a2.1/units/u07.js`):

```json
{
  "id": "a2.1-u07-ls1-p06",
  "topic": "g.reflexiv-akk",
  "type": "sentence_building",
  "questionDe": "Bilden Sie den Satz: [sich / Jan / leider / verspätet]",
  "questionEn": "Build the sentence.",
  "options": null,
  "answer": "Jan verspätet sich leider.",
  "accepted": ["Jan verspätet sich leider.", "Leider verspätet sich Jan.", "Leider verspätet Jan sich."],
  "caseSensitive": false,
  "explanationDe": "Das Verb verspätet steht auf Position 2.",
  "explanationEn": "The verb verspätet stays in second position.",
  "hint": null,
  "minLektion": 7
}
```

**Writing bank entries** — `netlify/functions/_shared/writingTasks/a2.1.mjs`, byte-identical twin
`src/data/writingTasks/a2.1.js` (`check-duplicates`). The grader resolves the task by `bankKey`, never from the
client's prompt; the allowance scope is the prefix `a21-` (BANK_KEY_RE, §2). Each Leitpunkt's `cues` and the task's
`choose` are compiled in, because the server twin of the pre-check needs them (BLUEPRINT §4.2); they inform the
advisory cue-coverage check only and never the score. Model texts stay in the unit chunk and are not grader input.

```js
// generated by scripts/course-v2/compile.mjs — do not edit
export const WRITING_TASKS = {
  'a21-u07-w': {
    level: 'a2.1', unit: 'a2.1-u07', lane: 'ga2', template: 'ga2.s2', examKey: 'goethe_a2', profile: 'ga2-s2',
    register: 'halbformell', address: 'Sie',
    situationDe: 'Sie haben morgen um 14 Uhr eine Besprechung mit Frau Kowalski von der Firma Hansen Bau. Sie können nicht kommen.',
    taskDe: 'Schreiben Sie Frau Kowalski eine E-Mail zu allen drei Punkten (30 bis 40 Wörter).',
    leitpunkte: [
      { id: 'lp1', de: 'Sagen Sie ab und entschuldigen Sie sich.', cues: ['leider', 'tut mir leid', 'Entschuldigung', 'nicht kommen', 'absagen'] },
      { id: 'lp2', de: 'Nennen Sie einen Grund.', cues: ['weil', 'denn', 'muss', 'krank', 'Arzt'] },
      { id: 'lp3', de: 'Schlagen Sie einen neuen Termin vor.', cues: ['Können wir', 'Wie wäre es', 'am', 'um', 'treffen', 'neuen Termin'] },
    ],
    choose: null,
    wordBand: [30, 40], minSubmitWords: 15,
    contentHash: 'sha256:…',
  },
  'a21-u07-mo2': {
    level: 'a2.1', unit: 'a2.1-u07', lane: null, profile: 'course-micro', mode: 'written', register: 'Sie',
    situationDe: 'Sie sind zu spät zum Deutschkurs gekommen.',
    promptDe: 'Schreiben Sie Ihrer Lehrerin 1–3 Sätze: Entschuldigen Sie sich. Nennen Sie einen Grund.',
    words: [8, 30], targets: ['g.reflexiv-akk'],
    contentHash: 'sha256:…',
  },
};
```

**Syllabus row** — `astro-site/src/data/syllabus/a2.1.json` ↔ `src/data/syllabus/a2.1.json`. Only live lanes appear
(`course.json.lanes.live`), so telc A2 is absent until its pack passes review; minutes come from
`.build/course.facts.json` — the design value until `minutesMeasured` exists, and the page labels them „geplant".

```json
{
  "unit": "a2.1-u07",
  "nr": 7,
  "etappe": 3,
  "title": "Am Telefon im Job",
  "canDoTitle": "Sie können Nachrichten am Telefon verstehen, notieren und weitergeben.",
  "handlungsfeld": ["2"],
  "canDos": [
    "Ich kann einer Nachricht auf dem Anrufbeantworter die wichtigen Informationen entnehmen: wer anruft, worum es geht und bis wann.",
    "Ich kann auf eine Bitte um Rückruf reagieren und eine Nachricht für eine Kollegin oder einen Kollegen annehmen und weitergeben.",
    "Ich kann einfach erzählen, was ich bei der Arbeit mache, und andere danach fragen.",
    "Ich kann in einer kurzen E-Mail einen Termin absagen, einen Grund nennen und einen neuen Termin vorschlagen."
  ],
  "grammar": ["Reflexive Verben mit Akkusativ: ich melde mich, du beeilst dich"],
  "pruefungsfokus": { "ga2": ["Hören Teil 1", "Schreiben Teil 2", "Sprechen Teil 1"] },
  "minutesPlanned": 150,
  "minutesMeasured": null
}
```

**Build artefact** — `content/course-v2/a2.1/.build/units/u07.json` holds `contentHash`, `minutesPlanned` (150) and
`reviewCards`; nothing of it is written back into `units/u07.json`.

**Review cards** introduced by the unit (`reviewCards`, in the build artefact): 28 `word:` cards (`word:lx.anruf` …
`word:lx.beschaeftigt`), one `pattern:g.reflexiv-akk:a2.1-u07`, and five `sentence:` cards
(`sentence:a2.1-u07-rm01` … `rm05`). SRS-01 counts them against the A2 budget of 7 minutes a day; the first-review
stagger keeps day-1 reviews ≤ 30 (`firstReviewCeiling`).

**Audio lines** — `a2.1.lines.json` (input of `generate-course-audio.mjs`; the voice comes from the cast bible, the
text from `say` when present, else `de`):

```json
[
  { "id": "a2.1-u07-ls1-l03", "speaker": "cast.monika-kowalski", "voice": "de-DE-LouisaNeural", "rate": "-5%", "text": "Bitte melden Sie sich so schnell wie möglich bei mir. Meine Nummer ist null drei vier eins, achtundfünfzig, siebenundzwanzig, neunzig. Vielen Dank!" },
  { "id": "a2.1-u07-ls1-l05", "speaker": "cast.jan-wolf", "voice": "de-DE-ConradNeural", "rate": "-5%", "text": "Hallo Priya, hier ist Jan. Ich stehe auf der Autobahn im Stau und verspäte mich leider. Ich bin erst um halb zehn im Büro." }
]
```

### 15.6 What the validator should report on this fixture

The E0 validator is correct when it reports exactly this on §15.1–§15.4 with `--stage T` (plus stub files for U1–U6,
which E0-1 generates so that the cumulative lexicon and the reserve index behind `earlierDraw` resolve):

| Rule | Expected result on `a2.1-u07` | Why |
|---|---|---|
| SCH-01, REF-01, ID-01 | pass | `stage: "T"`, every field is in §8/§9 and no generated field is present; every id resolves in §15.1, the file's `extras` or the U1–U6 stubs; text ids follow `STEP(-LANE)-tN` |
| SCH-01 at `--stage S` on a copy stripped to its S fields | pass | the stage schema of §8.1: texts, lines, extras, facts and story present; items, reserves, blocks and tasks absent |
| GRM-01, GRM-02 | pass | one new spine point, no chunk; `g.reflexiv-akk` has its single `intro` here |
| LEX-05 | pass | 28 new entries (profile 28–30), 14 productive = 50 % (profile 0.5) |
| LEX-02 | **7 ratchet entries** | every productive lemma occurs ≥ 2× in the unit's inputs; the receptive *sich anmelden, Durchwahl, Buchhaltung, Feierabend, Überstunde, sich setzen, beschäftigt* occur once each (the second occurrence is planned for U8–U9); the ratchet records 7 and may only go down |
| LEX-01, LEX-03 | run against the stub cumulative allocation | the result is real only once U1–U6 and the A1 allocation exist; until then unknown tokens are reported as advisory |
| TXT-01 | pass | no sentence in a non-exam input over 16 words |
| TXT-02 | pass | `ga2.h1` texts 26–32 words (band 25–60); `ta2.h1` texts 37–46 words (band 30–70) |
| TXT-03 | pass | dialogues 8–10 lines |
| TXT-04 | pass | every non-exam `promptDe`, block `instructionsDe` and `taskDe` ≤ 90 characters; exam stems within `examStemChars` [20, 110]; template `instructionsDe` ≤ 200 |
| ITM-02, ITM-03 | pass | three options on every non-exam MC and every `abc` item; `ga2.h1` keys b, c, a, c, b (balanced ±1) |
| ITM-06 | pass | each situation step: 11 authored + 5 generated = 16; typed/dictation 8/16, sentence building 5/16, error correction 1/16, choice 2/16, generated 5/16 ≤ 0.4; reserve 4 each, no reserve item repeats a pool item's POS-masked key |
| ITM-07 | pass | every answer with a digit, time, phone number or spelled name carries `exact` |
| ITM-09, ITM-10 | pass | fronted orders are in `accepted`; the non-obvious ones carry `acceptedWhy` |
| ITM-11 | pass | every authored item carries `{de, en}` |
| ITM-12 | course-level, not decided on one unit | the unit contributes `reflexive` ×12, `verb-final` ×2, `v2-inv` ×1, `perfekt-aux-participle` ×1 (`errorTag` or `errorTags`, pool and reserve) to the level's repair pools |
| EXM-01, EXM-03, EXM-04, EXM-11 | pass | 5 items / 3 options / 2 plays, no block choices (an `abc` Teil); 3 Leitpunkte, register halbformell, Anrede and Gruß not Leitpunkte; `cards-ask` = the template's interaction, 0 minutes' preparation, `turns` [8, 8] in the template band; each Prüfungsfokus entry has one slot and that slot holds its block or task |
| AUD-01, AUD-05 | pass | every line has a cast or extra speaker, or an anonymous one for lines that name an organisation (the mailbox, the practice, the parcel service); Herr Winter and Frau Klein are extras with a male and a female voice |
| AUD-02, AUD-03, AUD-04 | pass | `say` on every number, time, date and spelled name; lines ≤ 250 characters; perception drill with 4 voices; five distinct voices in `ta2.h1` |
| CON-01 | pass | every named speaker is a cast member or an extra |
| AST-01, AST-02 | pass (vacuous) | the unit uses no images; `ga2.h1`, `ga2.s2`, `ga2.sp1` are `pictorial: false` |
| **CON-06** | **fail → blocks promotion** | `a2.1-u07-f01` has `verification: "partial"`: § 4 ArbZG was read at dejure.org on 2026-09-27, but the two exceptions (JArbSchG, § 7 ArbZG) are (unverified). The unit therefore stays `status: "review"` until a reviewer reads both at a primary source and sets `verified` |
| QA-FRESH-01 | **blocks `approved`** | no `qa/a2.1/a2.1-u07.*.json` exists yet (SOL-01…03, CAL, LGL-05 have not run) |
| COV-6 (ta2) | pass for a .1 course, once ta2 is live | the ta2 learner gets a lane-exact LS4 block and origin-labelled LS5/LS6; in the v1 cut ta2 is not live, so COV rules do not run for it |

A validator that passes this fixture without the CON-06 failure, or that fails any row marked "pass", is wrong.

### 15.7 Choice fixtures: `tb1.lv3` and `gb2.l2` (block-level choice sets)

These two **shape fixtures** pin the encoding of matching and insertion Teile, which `Item.options {2..3}` cannot
hold. E0-1 turns them into `scripts/course-v2/fixtures/` files; SCH-01, REF-01, ID-01 and the structural half of
EXM-01 (item count, choice count, choice kind, reuse, no-match key, every answer a choice key or the no-match key,
every gap marker filled once) must pass on them. The texts are shortened for this document, so TXT-02, LEX and LNG
are **not** asserted on them.

**Registry entries** (`registries/lanes/tb1.json`, `registries/lanes/gb2.json`, excerpts):

```json
{
  "lv3": { "id": "tb1.lv3", "module": "lesen", "family": "fam.l-anzeigen", "task": "zuordnen", "items": 10, "choices": 12, "choiceKind": "ad", "choiceReuse": false, "noMatch": "x", "textType": "tt.kleinanzeige", "textWordsSource": "official-sample", "points": 25, "pictorial": false, "instructionsDe": "Lesen Sie zuerst die zehn Situationen, dann die zwölf Anzeigen. Welche Anzeige passt zu welcher Situation? Passt keine Anzeige, wählen Sie x.", "paraphraseOf": "telc UT B1, Leseverstehen Teil 3 (paraphrased)", "scaffold": { "minItems": 5, "textWords": [15, 45], "playsFixed": true, "optionsFixed": true, "choicesMin": 7 }, "scaffoldAllowedIn": ["b1.1"], "transfersTo": ["gb1.l3", "dtz.l2"], "source": "telc UT B1 (m02 §2)", "stand": "2026-09-26" },
  "l2": { "id": "gb2.l2", "module": "lesen", "family": "fam.l-textluecke", "task": "insert", "items": 6, "choices": 8, "choiceKind": "sentence", "choiceReuse": false, "textType": "tt.zeitungsartikel", "textWordsSource": "official-sample", "points": 6, "pictorial": false, "instructionsDe": "Im Text fehlen sechs Sätze. Welcher Satz passt in welche Lücke? Zwei Sätze passen nicht.", "paraphraseOf": "Goethe-Zertifikat B2 Modellsatz, Lesen Teil 2 (paraphrased)", "scaffold": { "minItems": 4, "textWords": [150, 300], "playsFixed": true, "optionsFixed": true, "choicesMin": 6 }, "scaffoldAllowedIn": ["b2.1"], "transfersTo": [], "source": "Goethe B2 Modellsatz (m03 §1)", "stand": "2026-09-26" }
}
```

**`tb1.lv3` in B1.2 U2, Text A** (`units/u02.json`, excerpt of step `b1.2-u02-ls1`; the unit's Prüfungsfokus entry is
`{ "template": "tb1.lv3", "length": "full", "modeDefault": "pruefung", "slot": "input", "step": "b1.2-u02-ls1" }`):

```json
{
  "texts": [
    { "id": "b1.2-u02-ls1-t1", "kind": "ad", "title": "Englisch für den Beruf (B1)", "text": "E-Mails, Telefonate und Besprechungen auf Englisch. Dienstag und Donnerstag, 18 bis 19.30 Uhr, zehn Abende.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t2", "kind": "ad", "title": "Buchhaltung mit dem PC", "text": "Rechnungen schreiben, Belege ordnen, einfache Steuerfragen. Samstag, 9 bis 13 Uhr, sechs Termine.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t3", "kind": "ad", "title": "Deutsch B2 – Prüfungsvorbereitung", "text": "Lesen, Hören, Schreiben und Sprechen für die B2-Prüfung. Montag bis Freitag, 8.30 bis 12 Uhr, vier Wochen.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t4", "kind": "ad", "title": "Erste Hilfe am Kind", "text": "Was tun bei Fieber, Stürzen und kleinen Unfällen? Ein Samstag, 9 bis 16 Uhr.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t5", "kind": "ad", "title": "Bewerbungstraining", "text": "Lebenslauf, Anschreiben und Vorstellungsgespräch üben. Mittwoch, 17 bis 20 Uhr, drei Abende, kostenlos für Arbeitsuchende.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t6", "kind": "ad", "title": "Italienisch für die Reise", "text": "Für Anfängerinnen und Anfänger ohne Vorkenntnisse. Montag, 19 bis 20.30 Uhr, acht Abende.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t7", "kind": "ad", "title": "Gesund kochen mit wenig Geld", "text": "Wir kochen zusammen und essen gemeinsam. Freitag, 18 bis 21 Uhr, vier Abende, Lebensmittel extra.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t8", "kind": "ad", "title": "Online-Kurs: Tabellen am Computer", "text": "Tabellen, Formeln und Diagramme für Einsteiger. Lernen Sie, wann Sie wollen: sechs Wochen Zugang.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t9", "kind": "ad", "title": "Yoga für den Rücken", "text": "Für alle, die viel am Schreibtisch sitzen. Dienstag, 12.15 bis 13 Uhr, in der Mittagspause.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t10", "kind": "ad", "title": "Fahrradwerkstatt zum Mitmachen", "text": "Reifen flicken, Bremsen einstellen. Jeden ersten Samstag im Monat, 10 bis 14 Uhr.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t11", "kind": "ad", "title": "Fotografieren mit dem Handy", "text": "Bessere Bilder für Familie und Beruf. Sonntag, 10 bis 15 Uhr, ein Termin.", "glosses": [] },
    { "id": "b1.2-u02-ls1-t12", "kind": "ad", "title": "Kinderbetreuung während der Kurse", "text": "Für Kinder von drei bis sechs Jahren, montags bis freitags am Vormittag. Bitte vorher anmelden.", "glosses": [] }
  ],
  "examBlock": {
    "id": "b1.2-u02-ls1-tb1-lv3", "template": "tb1.lv3", "lane": "tb1", "length": "full", "scaffolded": false, "modeDefault": "pruefung",
    "instructionsDe": "Welche Anzeige passt zu welcher Situation? Passt keine, wählen Sie x.",
    "textRefs": ["b1.2-u02-ls1-t1", "b1.2-u02-ls1-t2", "b1.2-u02-ls1-t3", "b1.2-u02-ls1-t4", "b1.2-u02-ls1-t5", "b1.2-u02-ls1-t6", "b1.2-u02-ls1-t7", "b1.2-u02-ls1-t8", "b1.2-u02-ls1-t9", "b1.2-u02-ls1-t10", "b1.2-u02-ls1-t11", "b1.2-u02-ls1-t12"],
    "choices": [
      { "key": "a", "textRef": "b1.2-u02-ls1-t1" }, { "key": "b", "textRef": "b1.2-u02-ls1-t2" }, { "key": "c", "textRef": "b1.2-u02-ls1-t3" },
      { "key": "d", "textRef": "b1.2-u02-ls1-t4" }, { "key": "e", "textRef": "b1.2-u02-ls1-t5" }, { "key": "f", "textRef": "b1.2-u02-ls1-t6" },
      { "key": "g", "textRef": "b1.2-u02-ls1-t7" }, { "key": "h", "textRef": "b1.2-u02-ls1-t8" }, { "key": "i", "textRef": "b1.2-u02-ls1-t9" },
      { "key": "j", "textRef": "b1.2-u02-ls1-t10" }, { "key": "k", "textRef": "b1.2-u02-ls1-t11" }, { "key": "l", "textRef": "b1.2-u02-ls1-t12" }
    ],
    "noMatchKey": "x",
    "items": [
      { "id": "b1.2-u02-ls1-tb1-lv3-01", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Ihr Chef möchte, dass Sie Kunden-E-Mails auf Englisch schreiben.", "answer": "a", "accepted": ["a"], "explanation": { "de": "Anzeige a: E-Mails auf Englisch für den Beruf.", "en": "Ad a: business English e-mails." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-02", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie haben keine Arbeit und möchten lernen, wie man sich gut bewirbt.", "answer": "e", "accepted": ["e"], "explanation": { "de": "Anzeige e: Bewerbungstraining, kostenlos für Arbeitsuchende.", "en": "Ad e: application training, free for job seekers." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-03", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie arbeiten im Schichtdienst und möchten zu Hause lernen, wie man am Computer Tabellen macht.", "answer": "h", "accepted": ["h"], "explanation": { "de": "Anzeige h: ein Online-Kurs – Sie lernen, wann Sie wollen.", "en": "Ad h: an online course you take whenever you like." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-04", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Ihr Sohn ist vier. Sie suchen jemanden, der auf ihn aufpasst, während Sie im Kurs sind.", "answer": "l", "accepted": ["l"], "explanation": { "de": "Anzeige l: Kinderbetreuung für Kinder von drei bis sechs Jahren.", "en": "Ad l: childcare for children aged three to six." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-05", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie haben oft Rückenschmerzen, weil Sie den ganzen Tag im Büro sitzen.", "answer": "i", "accepted": ["i"], "explanation": { "de": "Anzeige i: Yoga für alle, die viel am Schreibtisch sitzen.", "en": "Ad i: yoga for people who sit at a desk all day." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-06", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie fahren im Sommer nach Rom und möchten ein paar Sätze Italienisch sprechen.", "answer": "f", "accepted": ["f"], "explanation": { "de": "Anzeige f: Italienisch für die Reise, ohne Vorkenntnisse.", "en": "Ad f: Italian for travellers, no prior knowledge." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-07", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Ihr Fahrrad ist kaputt, und Sie möchten lernen, es selbst zu reparieren.", "answer": "j", "accepted": ["j"], "explanation": { "de": "Anzeige j: Fahrradwerkstatt zum Mitmachen.", "en": "Ad j: a do-it-yourself bike workshop." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-08", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie möchten in Deutschland studieren und brauchen dafür einen Kurs auf Niveau C1.", "answer": "x", "accepted": ["x"], "noMatch": true, "explanation": { "de": "Anzeige c bereitet auf B2 vor, nicht auf C1. Keine Anzeige passt: x.", "en": "Ad c prepares for B2, not C1 – no ad fits, so x." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-09", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie möchten für Ihre Familie gesünder kochen, haben aber nicht viel Geld.", "answer": "g", "accepted": ["g"], "explanation": { "de": "Anzeige g: Gesund kochen mit wenig Geld.", "en": "Ad g: healthy cooking on a small budget." }, "origin": "agent" },
      { "id": "b1.2-u02-ls1-tb1-lv3-10", "type": "zuordnen", "role": "exam", "topic": "lesen", "promptDe": "Sie möchten Gitarre spielen lernen.", "answer": "x", "accepted": ["x"], "noMatch": true, "explanation": { "de": "Im Programm gibt es keinen Musikkurs: x.", "en": "The programme has no music course – x." }, "origin": "agent" }
    ]
  }
}
```

EXM-01 on this block: 10 items; 12 choices of kind `ad`, each key used at most once (a, e, h, l, i, f, j, g; b, c, d, k
unused as distractors); `x` twice as the no-match key, never also a choice key. The Spur-Karten `gb1.l3` (7 → 10 ads,
„0") and `dtz.l2` (5 situations) reuse the same `texts` through their own blocks' `textRefs` — "the ad texts are a
shared asset, the items are not" (BLUEPRINT §3.9).

**`gb2.l2` in B2.2 U7** (lane pack `units/u07.lane-gb2.json`, slot `ls4`; built only once the Goethe B2 pack is
built after demand):

```json
{
  "texts": [
    { "id": "b2.2-u07-ls4-gb2-t1", "kind": "text", "title": "Eine Nacht im Museum", "text": "Einmal im Jahr gibt es in vielen Städten eine Museumsnacht. ⟦01⟧ In unserer Stadt öffnen an diesem Abend rund 40 Häuser bis ein Uhr nachts. ⟦02⟧ Viele Gäste planen ihre Route deshalb schon Tage vorher. Die Veranstalter wollen vor allem Menschen erreichen, die sonst selten ins Museum gehen. ⟦03⟧ Kritiker sehen das anders: Wer in einer Nacht fünf Ausstellungen besucht, sieht zwar viel, versteht aber wenig. ⟦04⟧ Die Museen selbst reagieren unterschiedlich auf diese Kritik. ⟦05⟧ Andere setzen auf kurze Führungen von zwanzig Minuten. ⟦06⟧ Ob man danach wiederkommt, entscheidet am Ende jeder selbst.", "glosses": [] }
  ],
  "blocks": [
    {
      "id": "b2.2-u07-ls4-gb2-l2", "template": "gb2.l2", "lane": "gb2", "length": "full", "scaffolded": false, "modeDefault": "pruefung",
      "instructionsDe": "Welcher Satz passt in welche Lücke? Zwei Sätze bleiben übrig.",
      "textRefs": ["b2.2-u07-ls4-gb2-t1"],
      "choices": [
        { "key": "a", "de": "Die Idee dahinter ist einfach: Kunst soll für eine Nacht zum Stadtfest werden." },
        { "key": "b", "de": "Mit einem einzigen Ticket kann man alle Häuser besuchen und die Sonderbusse zwischen ihnen nutzen." },
        { "key": "c", "de": "Das scheint zu funktionieren: Viele Gäste erzählen, dass sie zum ersten Mal seit Jahren in einem Museum sind." },
        { "key": "d", "de": "Ihrer Meinung nach bleibt von so einem Abend vor allem die Erinnerung an lange Schlangen." },
        { "key": "e", "de": "Einige zeigen in dieser Nacht nur einen kleinen Teil ihrer Sammlung, dafür mit mehr Erklärungen." },
        { "key": "f", "de": "Wer dabei neugierig geworden ist, bekommt am Ausgang einen Gutschein für einen zweiten Besuch." },
        { "key": "g", "de": "Deshalb verlangen die Museen in dieser Nacht keinen Eintritt." },
        { "key": "h", "de": "Viele Künstlerinnen und Künstler stellen ihre Werke deshalb lieber im Internet aus." }
      ],
      "items": [
        { "id": "b2.2-u07-ls4-gb2-l2-01", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 1", "answer": "a", "accepted": ["a"], "explanation": { "de": "Nach der Einleitung folgt die Idee der Museumsnacht.", "en": "The idea behind the event follows the introduction." }, "origin": "agent" },
        { "id": "b2.2-u07-ls4-gb2-l2-02", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 2", "answer": "b", "accepted": ["b"], "explanation": { "de": "Ein Ticket für alle Häuser – deshalb planen die Gäste ihre Route.", "en": "One ticket for all venues – that is why guests plan a route." }, "origin": "agent" },
        { "id": "b2.2-u07-ls4-gb2-l2-03", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 3", "answer": "c", "accepted": ["c"], "explanation": { "de": "„Das scheint zu funktionieren“ bezieht sich auf das Ziel der Veranstalter.", "en": "'That seems to work' refers to the organisers' aim." }, "origin": "agent" },
        { "id": "b2.2-u07-ls4-gb2-l2-04", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 4", "answer": "d", "accepted": ["d"], "explanation": { "de": "„Ihrer Meinung nach“ setzt die Meinung der Kritiker fort.", "en": "'In their view' continues the critics' opinion." }, "origin": "agent" },
        { "id": "b2.2-u07-ls4-gb2-l2-05", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 5", "answer": "e", "accepted": ["e"], "explanation": { "de": "„Einige … Andere …“: Satz e passt vor „Andere setzen auf …“.", "en": "'Some … others …': sentence e comes before 'Others rely on …'." }, "origin": "agent" },
        { "id": "b2.2-u07-ls4-gb2-l2-06", "type": "insert", "role": "exam", "topic": "lesen", "textRef": "b2.2-u07-ls4-gb2-t1", "promptDe": "Lücke 6", "answer": "f", "accepted": ["f"], "explanation": { "de": "Der Gutschein führt zur Frage, ob man wiederkommt.", "en": "The voucher leads to the question of coming back." }, "origin": "agent" }
      ]
    }
  ]
}
```

EXM-01 on this block: 6 items, one per gap marker `⟦01⟧…⟦06⟧`; 8 choices of kind `sentence`, no reuse, no no-match key;
`g` and `h` stay unused as distractors (SOL-02 must confirm that neither fits a gap).
