# A2.1 content pass — Step 4 — 2026-10-25

Status after the part 7–8 resume: content and metadata repairs are implemented;
final focused tests pass. The remaining assertion conflict, two known baseline
failures, shared-engine findings and blocked browser observation prevent an
unqualified release sign-off. See the verification and deferred-work sections.

## Scope and exit proof

Work on `claude/a21-build`, offline and without database access. Preserve live A1 behavior, the legacy A2.1 final test, existing assertions, and all ratchet ceilings. Do not modify `.fablize/` or the shared engine files reserved for the concurrent A1 batch. Source reads use absolute paths. This report was created before implementation.

Exit proof: rebuild A2.1 pool before validation; validator exit 0 with no hard-rule violations and ratchets at measurement; raw A1 validator output identical to the supplied merge baselines; A1 determinacy 406/481 served and zero rejected, A2 zero rejected; unchanged legacy-test and rule-card suites plus all affected/new tests pass; duplicate/sync checks and zero-warning changed-file lint. Observe changed learner-facing rendering offline where the environment permits. Document any remaining shared-engine defect instead of changing a reserved file.

## 1. Live legacy level test

Completed. Restored `src/data/courseTests/abschlusstestA21.js` from the local
`origin/main` object, without fetching. Its Git blob hash is
`2e2e5c2869287123d7fb16e58a9011d564557fa8`; the new byte-level regression passes.
The unchanged legacy suite improved from 14 failures to 0 (25/25 pass).

Rule: a draft curriculum must never replace a live program's assessment. The D4
paper is now `abschlusstestA21Course.js`, registered in `DRAFT_COURSE_TESTS` with
the separate attempt key `a2_1_course_abschluss`. Its 40 objective responses,
two writing tasks and three speaking parts retain the 105-minute allocation.
The separate key prevents old in-progress attempts from resuming in a different paper.

Promotion is one switch: after owner release approval and applying
`migrations/2026-10-26-a21-course-abschlusstest.sql`, set `A21_PROMOTED = true` in
`src/data/curricula/a21-release.js`, then synchronize curriculum twins. This selects
both the rebuilt course and its test at the existing slug. The migration is written
and **not applied**. It retains every existing exam key and learner attempt.

Tests: `a21-course-test.test.mjs` checks blob bytes, both promotion states, unchanged
other-level rows, separate attempt keys/migration coverage, and the complete D4 shape
and objective scoring. `a21-content.test.mjs` now imports the new module; every
existing assertion remains intact. The legacy test file was not edited.

Diagnosis after reproduction: (1) runner/environment failure explains `spawn EPERM`
but not the assertion failures, because isolation-none reproduces them; (2) a stale
test contract is rejected because the same slug still serves the live legacy program;
(3) overwriting the shared legacy module is confirmed by its registry import and the
14 changed-contract failures. Restoring the module and gating its replacement fixes
the cause, rather than loosening those assertions.

Exact command: `node --experimental-test-isolation=none --test tests/a2-1-abschlusstest.test.mjs tests/a21-course-test.test.mjs`

```text
✔ legacy A2.1 final test is byte-identical to the reviewed origin/main blob
✔ one promotion switch selects the new course and final test, preserving legacy attempts
✔ D4 has 40 uniquely keyed objective responses and separately disclosed writing and speaking
ℹ tests 28
ℹ pass 28
ℹ fail 0
```

Exit 0. Timing suffixes omitted from individual test names; counts copied exactly.

## 2. Rule cards

Completed. The six failing guard classes are closed without editing
`tests/rule-card-overrides.test.mjs`: missing English support 12 → 0; cards with
fewer than two corrections 12 → 0; register/paradigm ambiguity removed; example
nouns use taught vocabulary; untaught explanation vocabulary removed; and the
already-known review participle `gesprochen` no longer falsely declares its first
introduction in A2.1 L12. Each card has exactly one English support line and two
corrections. Rebuilt the generated function-side cards through the A2.1 pool builder.

Rule: corrections preserve meaning as they repair form, and corrected sentences
stay within the lesson's construction horizon. The modal correction now teaches a
simple dass clause: `Ich weiß, dass er ist krank.` → `Ich weiß, dass er krank ist.`
The old pair (`… dass er musste arbeiten.` → `… dass er arbeitet.`) silently
removed obligation and past time; a modal+infinitive cluster remains outside this
lesson's bounded dass scope. A second meaning-changing pair, `Ich bleibe seit drei
Tage.` → `Ich bleibe für drei Tage.`, is now the case repair `Ich bleibe für drei
Tagen.` → `Ich bleibe für drei Tage.`

Tests: unchanged 35 card guards, plus `a21-content-quality.test.mjs` checks all
corrections' modal/negative/time/number markers and construction horizons. Mutation
probes reject both old meaning-changing pairs. Hypotheses rejected: stale generated
cards (the override source contained the same defects), and missing taught content
as the explanation for every failure (the examples themselves used avoidable
untaught words and marked an inherited form as new). The source shape and example
choices caused the failures. Intermediate checks exposed additional words behind
the first failing assertion; these were repaired, not allow-listed.

Exact combined command: `node --experimental-test-isolation=none --test tests/rule-card-overrides.test.mjs tests/a21-content-quality.test.mjs`

```text
ℹ tests 36
ℹ pass 36
ℹ fail 0
```

Exit 0. Before: 6/35 card guards failed; after: 0/35. The first new-test run had
an incorrect named import; switching to the module's existing default export fixed
that test-only error. The A2 validator after the rebuild also reports all hard rules
0, RULE 13 = 4 at ratchet 4, every other ratchet 0.

## 3. Wrong models

Audited all 216 vocabulary entries, all 36 phonetics lines, all twelve lesson
dialogues/notices/writing models, all 353 pool items, all 144 checkpoint units and
the 40 objective final-test items. This is an editorial audit, not a claim that a
regex can certify German. Additional ambiguity, register and explanation findings
are carried into parts 4, 6 and 7 below.

Rules and tests: noun headwords must have the lexical article in an independently
checked gender inventory; marked multisyllabic words must identify the stressed
syllable; leave requests use `frei haben`. `a21-content-quality.test.mjs` checks
all authored noun headwords and stress lines, includes negative probes for the old
stress forms, and checks both writing registries against the corrected model.
Before → after: wrong lexical articles 1 → 0; misleading stress marks 2 → 0;
unnatural leave-request model 1 (three copies) → 0.

Model ledger:

- `das Volleyball` → `der Volleyball`.
- `Ich brauche für drei Tage frei.` → `Ich möchte drei Tage frei haben.`
  (curriculum and both writing registries).
- `Wie lange Sie frei brauchen` → `Wie lange Sie frei haben möchten`
  (same three sources).
- `Ich bin aufge-WACHT.` → `Ich bin AUF-ge-wacht.`
- `wenn sie URLAUB haben.` → `wenn sie UR-laub haben.`

Rejected hypotheses: inflected case does not explain a wrong dictionary headword;
sentence emphasis does not justify moving the lexical stress of `aufwachen`;
the leave-request problem is present in the authored model, not introduced by the
renderer. Exact test result (exit 0):

```text
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## 4. Over-broad rules

Narrowed the German/English notice twins and regenerated their cards. The rule is
now explicit: wo/wohin selects case **with Wechselpräpositionen**; movement within
a place is not a destination. Sein accompanies changes of place/state and bleiben;
tanzen takes haben, and haben is also possible for schwimmen as an activity.
The wording preserves the legitimate sein variant of schwimmen.

Other repaired classes: name-s excludes names ending in an s-sound; the separable
ge- statement applies to the verbs taught here; adjective -en is tied to the
article and case; schenken's recipient rule is not a universal person rule;
modal infinitive placement names the main clause; doch/mal *can* soften a request;
pronoun ordering describes normal unstressed objects; über das Wochenende does not
promise exact start/end times; the final Perfekt notice explicitly reviews haben,
without claiming all verbs use it. Dative plural -n explanations include the -n/-s
exceptions. Temporal zwischen and sentence-position explanations name their scope.

Before → after: 87 pool explanations repaired (including the newly eligible
Wechselpräpositionen question); 353 → 354 eligible pool entries. This extra entry
was enabled by the now-explicit metalanguage, not by a filter relaxation.
The new bilingual scope test checks each rule class in both notice languages,
checks all pool explanations/cards for the identified false generalizations, and
rejects the former movement=case formulation. The unchanged 35 card guards remain
in force. No assertion or ratchet was relaxed.

Intermediate failures: the first rewrite used `den trennbaren Verben` before the
adjective lesson; it now says `trennbaren Verben hier`. Removing the explicit
`ist geblieben` example temporarily left two pool forms untaught; the example was
restored. A rebuild enabled a bank item with the same old movement explanation;
the new scope test caught and corrected it. These were source defects, not stale
generated output or a validator false positive.

Exact test lines after rebuilding (exit 0):

```text
ℹ tests 39
ℹ pass 39
ℹ fail 0
```

Validator after the repaired rewrite: exit 0; hard rules 0; RULE 11 0 at ratchet 0;
RULE 13 remains 4 at ratchet 4 pending the production-task pass. All remaining
ratchets are 0. Full final evidence follows below.

## 5. New and review vocabulary

Completed the unfinished vocabulary work found on resume. The 114 inherited
entries now carry `review: true`. A2 word cards group new and review entries
separately, with bilingual labels and examples; original card indices survive
paging and flipping. The A1 rendering branch is retained.

Rule: an earlier-level headword cannot be counted or labelled as new. RULE 26
is an A2.1 hard error, with mutation tests for an unmarked inherited entry and
a lesson below the new-word minimum. Its inherited inventory walks both A1 levels.
The standard's 15–25 new words and the owner's 30-entry total cap both apply.

Before → after: 216 → 295 entries; 102 → 181 genuinely new entries; 114 → 0
unmarked inherited entries; 79 additions have bilingual card input and a typed
retrieval item. L1–L8 and L10–L12 each have 15 new words; L9 has 16. Total
lesson sizes are 28/28/26/28/28/26/21/21/18/25/22/24. The pool grew from
354 to 436 entries (79 authored retrievals plus 3 newly eligible bank items).
All 79 added UUIDs are attested in checked-in SQL; no database was accessed.

Rejected explanations: a label-only change would leave four lessons with five
new words; hiding inherited entries would remove useful review. Authored inputs,
retrievals and separate groups address both progression and truthful labelling.

Tests: `tests/a21-vocabulary.test.mjs`, exit 0:

```text
✔ inherited entries are review and every lesson has 15–25 genuinely new words
✔ every added word has displayed bilingual input, pool retrieval and an attested existing UUID
✔ A2 pages separate review from new vocabulary, retain all entries and preserve flip indices
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Rebuilt with `node scripts/build-lesson-pool.mjs a2.1`, then ran
`node scripts/validate-curriculum.mjs a2.1`, exit 0:

```text
✓ A2.1: 12 Lektionen, 295 Wortfeld-Einträge (235 mit wordId, 79 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 295 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 0 von 295 (Ratchet 0)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 436
```

All hard rules are zero; RULE 13 remains 4 at ratchet 4, all other ratchets zero.
Real browser observation of the changed vocabulary component is part of the final
verification, not implied by the presentation-helper tests.

## 6. Determinate items

Completed the cue repairs found on resume and audited the 436-item pool, 38 lesson
exam units, 144 checkpoint units (all 16 papers) and 40 objective final-test items.
Pretests are open, unscored production prompts; their permissive prefix recognition
is not evidence of mastery. Shared generated-word-order/contraction defects remain
reserved for the concurrent engine branch and are listed below.

Rule: the visible German task must supply the grammatical or situational distinction
needed to choose its key. An explanation shown after answering cannot supply a
missing cue. `a21-item-cues.test.mjs` scans the whole pool and all three authored
exam surfaces, with negative probes for each finding class (no item-ID allowlist).

| Finding class | Before → after | Repair |
| --- | --- | --- |
| Time versus duration | 1 → 0 | `Der Besuch ist ___ zwei Wochen.` → `Wann ist die Ankunft? … Die Ankunft ist ___ zwei Wochen.` |
| Book category / child's age / office experience | 3 → 0 | Name a Kinderbuch, the daughter's age (six), and five years working **im Büro**. |
| Service versus material; gift versus shared food | 2 → 0 | Ask where staff wrap the gift, and what is bought **als Geschenk**. |
| Equivalent printed contractions | 4 → 0 | Replace duplicate full-form distractors; retained accepted German variants are unchanged. |
| Article definiteness | 1 → 0 | Specify **unbestimmter Artikel** for Studentin. |
| Imperative addressee / incomplete collocation | 2 / 3 → 0 / 0 | Name du/ihr/Sie; `Mach die Tür!` → `Mach bitte eine Pause!` and corresponding plural/formal forms. |
| Destination versus activity | 2 → 0 | Supply **wohin?** for Park/Kino. |
| Position / country of origin | 2 → 0 | Use grammatically exclusive distractors, with an explicit Herkunft cue. |
| Tense / advice mood | 2 / 6 → 0 / 0 | State Präteritum or Konjunktiv II in the task. |
| Open weekday relation | 1 → 0 | Specify **an + dem → Kurzform**; ab/bis/seit were otherwise possible. |
| Valid German labelled wrong | 1 → 0 | Replace the valid seit + Perfekt sentence with an actual case error: `Seit einen Monat spiele ich jeden Tag Gitarre.` → `Seit einem Monat spiele ich jeden Tag Gitarre.` |
| Unstressed object ordering | 5 prompts clarified | State **unbetonte Pronomen** instead of treating the neutral order as universal. |

The initial cue scan reproduced 22 remaining flagged pool items (some classes overlap),
after the six earlier time/checkpoint repairs. Final scan: zero. The English cues
and explanations were reconciled at source. Pool size remains 436.

Rejected hypotheses: a checker spelling issue cannot explain two printed grammatical
options; a post-answer explanation cannot resolve missing pre-answer context; a
passing stored-key test does not prove there is only one answer. The source prompts
and distractors caused these failures.

Build recovery: the shared named-article checker rejected a valid `einen → einem`
repair, including after simplifying its opening cue. Naming the exact word (`das
Wort einen`) uses its supported repair contract. The constraint translator also
rejects `unbetonte Objekte` inside an opening-cue semicolon; placing the separate
pronoun cue outside that constraint resolves it. No shared parser was modified.
The first time rewrite used untaught `beginnt`; the final version uses taught
`Ankunft`. A test initially treated every ad sheet containing a children's practice
as a medical question; it now requires the medical cue, preserving its negative probe.

After rebuild, validator exit 0 with hard rules 0 and ratchets unchanged at measurement.
Exact `node --experimental-test-isolation=none --test tests/a21-item-cues.test.mjs`
result (exit 0):

```text
✔ time choices and checkpoint keys have the context needed to exclude a second answer
✔ cue guards reject unsupported time, age, category, occupation and gift assumptions
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

## 7. Dialogues, translations, register and cast

Reviewed all twelve bilingual dialogues and scene summaries against the A1 cast.
The earlier partial repairs in the working tree are retained. Learner-directed
informal explanations: 4 → 0; unsupported English qualifiers: 2 → 0; mismatched
scene summaries: 3 → 0; formal possessives between friends in L1 listening: 2 → 0.
The L1 writing model now refers to Ana's own grandmother, rather than implying
that Ana and Lena are related. Natural phrasing repairs cover the switched-off
computer before packing, the price question, cake offered to children, the
invitation response and redundant photography wording. The L12 notice now quotes
the revised dialogue verbatim. All changed model strings are recorded below.

Rule: instructions address the learner as Sie; friends' dialogue uses the register
licensed by its setting; translations preserve qualifiers and scene participants;
recurring characters retain the inherited A1 facts on every authored input surface.
`tests/a21-register.test.mjs` checks these classes, with negative probes for the old
translations/collocations and mutations of marital status, origin, age, city and
surname in both lesson and checkpoint exam texts. RULE 14's A2 path now scans those
texts and situations, in addition to its existing dialogue/writing checks. A1's
path and persona tables are unchanged.

On resume, the suite reproduced 3 passes / 1 failure: the extended surname scan
misread `Ana Fotos` in `Lena zeigt ihrer Freundin Ana Fotos und …` as a full name.
Competing explanations were inconsistent cast facts, stale generated content and
an over-broad parser. The inherited tables agree, and the failure identifies a
source situation, ruling out the first two. The A2 surname scan now requires a
name declaration or subject/predicate context; recipient-plus-object negative
probes preserve natural German without allowing `Lena Berg wohnt in Köln`.
Final command evidence is recorded in the verification section.

The follow-up validator exposed dependencies of the prose edits: `geben` was
untaught at L5; L4 Preis and L12 Hoffnung lost their input; L9/L12 notice examples
still quoted the previous dialogue. Restored natural input (`Der Preis ist zwölf
Euro`, `Den Kindern backen wir auch Kuchen`, `Ja, ich habe Hoffnung. Ich habe
gespart …`) and aligned both quoted examples. No ceiling changed. After rebuilding,
`node --experimental-test-isolation=none --test tests/a21-register.test.mjs` exited 0:

```text
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## 8. Metadata

Rule: coverage uses the selected exam's official part inventory, and the A2.1
path budget sums the sections of its actual D4 paper. The A2 lesson factory now
carries the course's examKey, allowing the existing frozen course-page call to
select Goethe A2 without a page edit. Unknown/duplicate parts cannot inflate the
numerator. The denominator remains 13 even when a lesson omits a part. The shared
manifest includes the paper's Astro copy so its curriculum registry can use the
same section data. Live A1 path time remains 65 minutes.

Reproduced with `tests/a21-metadata.test.mjs`: **2 tests / 0 pass / 2 fail**,
`{ covered: 13, of: 11 }` and `65 !== 105`. After repair: **13/13** and **105**.
The tests remove parts, add duplicate/unknown parts, change a section's duration,
and check the unchanged A1 values. The Astro registry is also exercised directly.

Rejected hypotheses: duplicate part declarations (there are 13 distinct valid A2
parts), stale curriculum copies (the helper itself hard-coded 11), and a shorter
selected D4 paper (its sections are 30 + 30 + 30 + 15). The hard-coded A1 defaults
in the coverage helper and path builder caused the mismatch.

`node --experimental-test-isolation=none --test tests/a21-metadata.test.mjs tests/syllabus.test.mjs`
exited 0 before the additional Astro import assertions; final coverage follows below:

```text
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

## Verification evidence

Verification ran from the repository root, offline. **The content repairs pass their
focused gates, but this is not an unqualified green release handoff.** Three
assertions remain failing outside the repaired content, and the renderer test
cannot start. Their exact failures and required follow-ups are recorded below.

The normal `node --test tests/a21-metadata.test.mjs` command failed before
loading its tests with `Error: spawn EPERM`. All subsequent suites used
`--experimental-test-isolation=none`, as authorized.

| Gate | Final evidence |
| --- | --- |
| A2.1 pool, then validator | Both exit 0; 436 items; hard rules 0; RULE 13 = 4 at ratchet 4; every other ratchet 0. |
| A1.1 validator | Exit 0; **6,517 / 6,517 bytes identical** to the supplied baseline. |
| A1.2 validator | Exit 0; **2,767 / 2,767 bytes identical** to the supplied baseline. |
| A1.1 / A1.2 determinacy | **406 / 481 served; 0 rejected**. |
| A2.1 determinacy | **521 served; 0 rejected** after the opening-cue repair below. |
| Curriculum suite | **95 passed, 0 failed**. |
| Broad affected suites | Initial run **882 passed, 4 failed**; one of those failures is repaired and covered by the final focused rerun. |
| Final focused suites | **91 passed, 0 failed**, including all new tests, unchanged legacy test, unchanged rule-card guards and vocabulary pacing. |
| Duplicate check | `npm run check:duplicates`: exit 0; all **31** pairs match. |
| Curriculum sync | Exit 0: `Synced 16 curriculum file(s).` |
| Changed-file lint | `npx --offline eslint --no-ignore --max-warnings 0` on every changed/new JS, JSX and MJS file: exit 0, no ESLint output. |
| Reserved files / whitespace | `git diff --check` exits 0; `git diff --name-only` for all reserved engine/page/helper paths and tracked `.fablize` paths is empty. Branch remains `claude/a21-build`. |
| Browser observation | **Not verified**. Renderer suite cannot spawn Git; native headless Chrome launch rejected by automatic approval review. |

The first byte-comparison helper hit `spawnSync node.exe EPERM`. Recovery:
run both validator CLIs directly, capture their complete UTF-8 output, encode those
bytes as base64 and compare with base64 of the supplied files' raw bytes.
Both comparisons are exact; no newline normalization was used and neither
baseline file was written.

### Exact final command output

`node scripts/build-lesson-pool.mjs a2.1`, followed by
`node scripts/validate-curriculum.mjs a2.1`:

```text
corrections: 47 item(s) corrected, 0 bank English text(s) kept over the sidecar
explanationEn: 230 from the bank, 206 from the sidecar, 0 from the templates, 0 missing
a2.1: 300 in cache → 151 kept (117 more dropped as untaught-lexis) + 0 generated + 285 hand-authored = 436
✓ A2.1: 12 Lektionen, 295 Wortfeld-Einträge (235 mit wordId, 79 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 295 (Ratchet 0)
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
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 0 von 295 (Ratchet 0)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 436
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

`node scripts/a12-determinacy.mjs a1.1`, `… a1.2`, `… a2.1`:

```text
a1.1: 406 served items, 0 correct alternatives rejected
a1.2: 481 served items, 0 correct alternatives rejected
a2.1: 521 served items, 0 correct alternatives rejected
```

Raw byte-comparison results:

```json
[
  {
    "level": "A1.1",
    "exit": 0,
    "bytes": 6517,
    "baselineBytes": 6517,
    "identical": true
  },
  {
    "level": "A1.2",
    "exit": 0,
    "bytes": 2767,
    "baselineBytes": 2767,
    "identical": true
  }
]
```

Initial curriculum-suite result (exit 0):

```text
ℹ tests 95
ℹ pass 95
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Initial broad affected-suite result (exit 1):

```text
ℹ tests 886
ℹ pass 882
ℹ fail 4
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Final focused command (exit 0):

```text
node --experimental-test-isolation=none --test tests/a21-content.test.mjs tests/a21-content-quality.test.mjs tests/a21-course-test.test.mjs tests/a21-register.test.mjs tests/a21-item-cues.test.mjs tests/a21-metadata.test.mjs tests/a21-vocabulary.test.mjs tests/wortfeld-pacing.test.mjs tests/a2-1-abschlusstest.test.mjs tests/rule-card-overrides.test.mjs
ℹ tests 91
ℹ pass 91
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The affected-file search covered direct consumers of the curriculum, validator,
pool, writing/test registries, metadata, cards and shared-copy manifest. Added the
answer-checker/generation regressions and renderer test explicitly. These files
were executed (the curricula and renderer suites separately):

- `tests/a11-content-classes.test.mjs`
- `tests/a12-rebuild.test.mjs`
- `tests/a2-1-abschlusstest.test.mjs`
- `tests/a2-2-abschlusstest.test.mjs`
- `tests/a21-content-quality.test.mjs`
- `tests/a21-content.test.mjs`
- `tests/a21-course-test.test.mjs`
- `tests/a21-engine.test.mjs`
- `tests/a21-exam.test.mjs`
- `tests/a21-item-cues.test.mjs`
- `tests/a21-language.test.mjs`
- `tests/a21-metadata.test.mjs`
- `tests/a21-register.test.mjs`
- `tests/a21-render.test.mjs`
- `tests/a21-surfaces.test.mjs`
- `tests/a21-vocabulary.test.mjs`
- `tests/ai-spend-reservations.test.mjs`
- `tests/assessment-integrity.test.mjs`
- `tests/astro-course-front-door.test.mjs`
- `tests/b3-answer-checking.test.mjs`
- `tests/b3-lesson-generation.test.mjs`
- `tests/check-answer.test.mjs`
- `tests/checkpoint-feedback.test.mjs`
- `tests/checkpoint.test.mjs`
- `tests/course-art.test.mjs`
- `tests/course-certificate.test.mjs`
- `tests/course-front-door.test.mjs`
- `tests/course-meta.test.mjs`
- `tests/course-next.test.mjs`
- `tests/course-plan.test.mjs`
- `tests/course-player.test.mjs`
- `tests/course-value.test.mjs`
- `tests/curricula.test.mjs`
- `tests/exams.test.mjs`
- `tests/fahrschein.test.mjs`
- `tests/first-run.test.mjs`
- `tests/free-door.test.mjs`
- `tests/german-sie.test.mjs`
- `tests/lesson-back-skip.test.mjs`
- `tests/lesson-engine.test.mjs`
- `tests/lesson-extra-items-a12.test.mjs`
- `tests/lesson-extra-items.test.mjs`
- `tests/lesson-pool-rules.test.mjs`
- `tests/lesson-run-resume.test.mjs`
- `tests/live-course-batch1.test.mjs`
- `tests/live-course-batch2.test.mjs`
- `tests/readiness.test.mjs`
- `tests/rule-card-overrides.test.mjs`
- `tests/shared-files.test.mjs`
- `tests/syllabus.test.mjs`
- `tests/sync-outbox.test.mjs`
- `tests/telc-deep-links.test.mjs`
- `tests/telc-pilot.test.mjs`
- `tests/trial-end-claims.test.mjs`
- `tests/unlimited-claims.test.mjs`
- `tests/wortfeld-pacing.test.mjs`
- `tests/writing-course.test.mjs`
- `tests/writing-migration-fallback.test.mjs`

Exact final shared-copy output (`npm run check:duplicates`, exit 0):

```text
> deutschmeister@1.0.0 check:duplicates
> node scripts/check-duplicates.mjs

OK: src/data/competitorComparisons.js === astro-site/src/data/competitorComparisons.js
OK: src/data/pricing.js === astro-site/src/data/pricing.js
OK: src/data/marketing.js === astro-site/src/data/marketing.js
OK: src/data/design-tokens.js === astro-site/src/data/design-tokens.js
OK: src/data/organization.js === astro-site/src/data/organization.js
OK: src/data/navigation.js === astro-site/src/data/navigation.js
OK: src/data/examTracks.js === astro-site/src/data/examTracks.js
OK: src/data/events.js === astro-site/src/data/events.js
OK: src/data/courseContents.js === astro-site/src/data/courseContents.js
OK: src/data/offers.js === astro-site/src/data/offers.js
OK: src/data/writingTasks.js === netlify/functions/_shared/writingTasks.mjs
OK: src/lib/lesson/readaloud.js === netlify/functions/_shared/readaloud.mjs
OK: src/data/curricula/examFormats.js === netlify/functions/_shared/examFormats.mjs
OK: src/lib/lesson/speaking.js === netlify/functions/_shared/speaking.mjs
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a11.lesen.js === astro-site/src/data/curricula/a11.lesen.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
OK: src/data/curricula/a12.lesen.js === astro-site/src/data/curricula/a12.lesen.js
OK: src/data/curricula/a21.js === astro-site/src/data/curricula/a21.js
OK: src/data/curricula/a21.exams.js === astro-site/src/data/curricula/a21.exams.js
OK: src/data/curricula/a21.meta.js === astro-site/src/data/curricula/a21.meta.js
OK: src/data/curricula/a21.vocabulary.js === astro-site/src/data/curricula/a21.vocabulary.js
OK: src/data/curricula/a21.word-ids.js === astro-site/src/data/curricula/a21.word-ids.js
OK: src/data/curricula/a21-language.js === astro-site/src/data/curricula/a21-language.js
OK: src/data/curricula/a21-release.js === astro-site/src/data/curricula/a21-release.js
OK: src/data/curricula/examFormats.js === astro-site/src/data/curricula/examFormats.js
OK: src/data/curricula/inheritance.js === astro-site/src/data/curricula/inheritance.js
OK: src/data/curricula/a11.audio.js === astro-site/src/data/curricula/a11.audio.js
OK: src/data/curricula/index.js === astro-site/src/data/curricula/index.js
OK: src/data/courseTests/abschlusstestA21Course.js === astro-site/src/data/courseTests/abschlusstestA21Course.js
OK: src/data/curricula/constructions.js === astro-site/src/data/curricula/constructions.js
```

Exact final curriculum-sync output (exit 0):

```text
Synced 16 curriculum file(s).
```

### Remaining failed assertions and environment limits

| Test | Exact failure / status | Rule and follow-up |
| --- | --- | --- |
| `astro-course-front-door.test.mjs` | `the known front-door CTAs still exist (the scan is not vacuous)`: `astro-site/src/pages/index.astro: expected ≥1 "start free" CTA(s), found 0` | Known baseline in the integration report. The relevant source/test are identical to HEAD (checked with `git diff --exit-code`). Leave outside this content pass. |
| `first-run.test.mjs` | `the dashboard renders the first-run card in the hero slot and demotes its other primaries`: `the decision must receive hasLevelAccess`; regex expects `hasLevelAccess,\n`, source has CRLF. | Known Windows-sensitive baseline documented in the merge report; source/test are identical to HEAD. No assertion or unrelated source was edited. |
| `exams.test.mjs` | `every course test is well-formed, distinct from EXAM_TRACKS, and shape-valid`: expected title not to match `/Kurzversion/`; actual `Abschlusstest A2.1 (Kurzversion)`. | **Restoration-contract conflict**, not a pre-existing baseline claim. The required byte-identical live legacy module has this title. Reconcile this newer D4 assertion with the promotion boundary in the later integration; keep the legacy contract and D4's separate shape guards. Neither the title nor the assertion was changed to conceal the conflict. |
| `a21-render.test.mjs` | `spawnSync git EPERM`; **1 test / 0 pass / 1 fail**, before the renderer can load. | Same environment class documented in the merge report. An independent offline vocabulary fixture was prepared with the real component and Tailwind; its server started, but Chrome was never allowed to launch. No screenshot or browser pass is claimed. |

Automatic approval review rejected the attempted **hidden headless Chrome launch**
with **“blocked by policy”**. No retry through another launcher was attempted.
The temporary loopback-only fixture server was stopped. Its source is retained in
`.cache/a21-step4/browser.mjs` for later verification; speech, illustrations and
icons are stubbed, while the vocabulary component/paging/flip logic and CSS are real.

### Failures repaired during final verification

- **Opening-cue contract:** A2 determinacy initially reported
  `a2.1: 521 served items, 1 correct alternatives rejected`. The German cue
  `(Beginnen Sie mit Seit)` lacked the quotes required by the existing parser.
  It is now `(Beginnen Sie mit „Seit“)`, with the same opening in English.
  Rule: a declared constraint must use the parser's supported syntax.
  The added class test runs the actual `alternatives` probe over every opening
  cue and includes a malformed negative control. Its first negative-control run
  omitted `wide: true`; enabling the same mode used by the CLI made the probe
  exercise the intended branch. Final rejected count **1 → 0**, without changing
  the shared parser or widening answers.
- **Vocabulary source guard:** `wortfeld-pacing.test.mjs` required the live
  `line={lineFor(spoken, stage.lines)}` fallback. Restored that call unchanged
  and resolved A2's authored example inside the card, only when A2 labels are
  present. Same A1 behavior, same A2 display. Failure **1 → 0**; final 91-test
  focused run passes.
- The earlier part 7 validator run reported five problems: untaught geben at
  two checks, one stale L9 example, and missing Preis/Hoffnung input.
  A stale L12 quotation was caught separately before that run. Source repairs
  described in §7 reduced validator problems **5 → 0**, retaining every ratchet.
- A few diagnostic shell snippets failed because of command-line quoting or
  an expired terminal handle; corrected snippets/persistent script files were
  rerun. One ledger pipeline returned exit 1 with no output; its isolated retry
  exited 0. These failures are not counted as successful checks.

## Deferred shared-engine work

These are **open** classes reserved for the shared-engine integration. No file
named in the user's exclusion list was edited in this content pass.

1. **Fair word-order marking.** `buildLesson.js` currently supplies the chosen
   source sentence, and `check.js`'s word-order branch compares only literal
   accepted orders. The later change must either constrain the intended order
   explicitly or recognize grammatical variants (coordination, fronted pronouns,
   middle-field focus), while rejecting ungrammatical permutations. Regression
   cases must exercise generated lessons, with positive and negative controls.
   The exact current checker probes below still return `wrong` for the three
   tile-compatible variants. The 521-item determinacy scan does not cover this
   whole generated-tile class and must not be interpreted as closure.
2. **Contractions in free sentence answers.** `zu der Arbeit` remains rejected
   against `zur Arbeit` when no contraction is demanded. The shared checking
   rule needs semantically equivalent full/contraction forms and a negative
   control for tasks that explicitly request Kurzform. Do not add a one-item
   accepted-answer exception.
3. **Checkpoint labels.** The shared introduction still says
   `im Format Ihrer Prüfung`; CP1's dictations are labelled Hören Teil 4 and
   checkpoint speaking uses reading aloud. The later shared-string/page change
   must call these adapted course checkpoints, label dictation/read-aloud
   accurately, and reserve Goethe-format claims for actual matching tasks.
   Add A2 rendering assertions that separate those practice kinds from the
   official Teil labels. `strings.js` and the reserved pages were left alone.
4. **Release-stage test contract.** Resolve the `exams.test.mjs` title conflict
   above against the one-switch promotion design, without changing the live
   legacy paper or weakening its 25 unchanged tests. This remains a failed gate.

These are diagnostic calls to the actual current `checkAnswer` API, using the
current source models and its word-order option for the first three cases; they
are not claims that a browser run succeeded:

```json
{"kind":"coordinated nouns","key":"Guten Morgen! Unser Obst und Gemüse ist heute frisch.","answer":"Guten Morgen! Unser Gemüse und Obst ist heute frisch.","result":"wrong"}
{"kind":"pronoun fronting","key":"Gern. Und die Datei schicke ich Ihnen nach der Besprechung.","answer":"Gern. Und Ihnen schicke ich die Datei nach der Besprechung.","result":"wrong"}
{"kind":"middle-field focus","key":"Gut. Den Kindern backen wir auch Kuchen. Dann sind alle glücklich.","answer":"Gut. Den Kindern backen auch wir Kuchen. Dann sind alle glücklich.","result":"wrong"}
{"kind":"uncontracted preposition","key":"Ich fahre mit meinem Fahrrad zur Arbeit.","answer":"Ich fahre mit meinem Fahrrad zu der Arbeit.","result":"wrong"}
```

The course remains a draft; no promotion, migration application, network service
call, database access, commit, push, checkout, reset or stash was performed.

## Changed files and model-sentence ledger

All 38 tracked or untracked deliverable files changed by the resumed
Step 4 work (including the preserved parts 1–6 working tree) are listed here.
Pre-existing `.fablize/` and `.serena/` artifacts are excluded and untouched.

| File | Purpose |
| --- | --- |
| `astro-site/src/data/courseTests/abschlusstestA21Course.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/a21-release.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/a21.exams.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/a21.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/a21.meta.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/a21.vocabulary.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/data/curricula/index.js` | Generated byte-identical Astro copy of the canonical source. |
| `astro-site/src/lib/syllabus.js` | Coverage derived from the selected exam inventory. |
| `docs/course-factory/a21-build/STEP-4-REPORT-2026-10-25.md` | This report, evidence, deferred work and complete text ledger. |
| `migrations/2026-10-26-a21-course-abschlusstest.sql` | Owner-applied separate attempt-key migration and its documentation; not applied. |
| `migrations/README.md` | Owner-applied separate attempt-key migration and its documentation; not applied. |
| `netlify/functions/_shared/ruleCards.mjs` | Regenerated cards from the authored overrides and notices. |
| `netlify/functions/_shared/writingTasks.mjs` | Regenerated writing-bank twin. |
| `scripts/rule-card-overrides.mjs` | Bilingual, bounded rule cards and meaning-preserving corrections. |
| `scripts/shared-files.mjs` | Registers A2 vocabulary/release data and the D4 paper twin. |
| `scripts/validate-curriculum.mjs` | A2 review-vocabulary hard rule, scoped policy and extended cast checks. |
| `src/components/lesson/WortfeldStage.jsx` | A2 new/review labels and input examples, preserving the live A1 fallback. |
| `src/data/courseTests/abschlusstestA21.js` | Restored live legacy module, byte-identical to local origin/main. |
| `src/data/courseTests/abschlusstestA21Course.js` | Separate 40-response D4 paper plus writing/speaking. |
| `src/data/courseTests/index.js` | Promotion-gated final-test selection and separate attempt identity. |
| `src/data/curricula/a21-release.js` | Single promotion switch, retained false. |
| `src/data/curricula/a21.exams.js` | Explicit checkpoint reading/listening cues and support. |
| `src/data/curricula/a21.js` | Authored language repairs, review flags, additions and per-lesson exam key. |
| `src/data/curricula/a21.meta.js` | Scene summaries aligned with the actual dialogues. |
| `src/data/curricula/a21.vocabulary.js` | 79 new-word input models with attested word IDs. |
| `src/data/curricula/index.js` | One-switch draft/live registration; A2 test time derived from D4 sections. |
| `src/data/lessonPools/a21.corrections.json` | Source overrides for bank wording, register, scope and determinate cues. |
| `src/data/lessonPools/a21.extra.json` | Authored retrievals and cue/explanation repairs. |
| `src/data/lessonPools/a21.json` | Rebuilt 436-item pool; generated, not hand-edited. |
| `src/data/writingTasks.js` | Corrected A2 writing models mirrored from their lessons. |
| `src/lib/lesson/a21Vocabulary.js` | A2 grouping/labels with stable original card indices. |
| `tests/a21-content-quality.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |
| `tests/a21-content.test.mjs` | Existing content assertions retained, importing the separate D4 module. |
| `tests/a21-course-test.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |
| `tests/a21-item-cues.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |
| `tests/a21-metadata.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |
| `tests/a21-register.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |
| `tests/a21-vocabulary.test.mjs` | Regression tests for the corresponding content/routing/metadata finding class. |

Verification-only scratch sources `.cache/a21-step4/ledger.mjs` and
`.cache/a21-step4/browser.mjs` were also created inside the workspace; they are
ignored by Git. No files outside the repository were written.

### Full model and text ledger

The tables below compare HEAD's authored material with the final working tree,
by stable lesson/item/task identity. They include every changed displayed string
in the lesson models, checkpoint banks, metadata, writing bank, generated pool
and cards. The pool table records the effective sentence changes from corrections
and extras together; generated Astro/function copies carry the same wording.
Identifiers here provide traceability, not exceptions to the class rules.

- `src/data/curricula/a21.js`: 56 changed text fields.
- `src/data/curricula/a21.exams.js`: 12 changed text fields.
- `src/data/curricula/a21.meta.js`: 3 changed text fields.
- `src/data/lessonPools/a21.json`: 154 changed text fields.
- `src/data/writingTasks.js`: 3 changed text fields.
- `netlify/functions/_shared/ruleCards.mjs`: 30 changed text fields.

The D4 paper was relocated intact: the comparison against HEAD's former D4
module has 0 editorial text changes.
The legacy file's restoration is proved by its blob-byte regression, not by
comparing two different papers' individual items. Newly added vocabulary inputs
follow the old → new tables, with their English twins and retrieval source.

### src/data/curricula/a21.js

| Field | Before → after |
| --- | --- |
| Lektion[a2.1-l01].notice.bodyDe | Für wir steht **unser**, für ihr **euer**: **unsere Oma**, **eure Familie**. Dativ maskulin/neutrum: **meinem, deinem, seinem, ihrem, unserem, eurem**. Dativ feminin: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. Nach bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Namen bekommen -s: **Omas Garten**, Lenas Familie. Alternativ: das Kind **von deinem Bruder**. Vergleichen Sie. → Für wir steht **unser**, für ihr **euer**: **unsere Oma**, **eure Familie**. Dativ maskulin/neutrum: **meinem, deinem, seinem, ihrem, unserem, eurem**. Dativ feminin: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. Nach bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Namen ohne s-Laut am Ende bekommen -s: **Omas Garten**, Lenas Familie. Alternativ: das Kind **von deinem Bruder**. Vergleichen Sie. |
| Lektion[a2.1-l01].notice.bodyEn | For wir use **unser**, for ihr **euer**: **unsere Oma**, **eure Familie**. Masculine/neuter dative: **meinem, deinem, seinem, ihrem, unserem, eurem**. Feminine dative: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. After bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Names take -s: **Omas Garten**, Lenas Familie. Alternatively: das Kind **von deinem Bruder**. Compare the forms. → For wir use **unser**, for ihr **euer**: **unsere Oma**, **eure Familie**. Masculine/neuter dative: **meinem, deinem, seinem, ihrem, unserem, eurem**. Feminine dative: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. After bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Names not ending in an s-sound take -s: **Omas Garten**, Lenas Familie. Alternatively: das Kind **von deinem Bruder**. Compare the forms. |
| Lektion[a2.1-l01].hoeren.units[a21-l01-hoeren-u1].audioText | Ana: Wohnen Ihre Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und Ihre Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. → Ana: Wohnen deine Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und deine Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. |
| Lektion[a2.1-l01].hoeren.units[a21-l01-hoeren-u2].audioText | Ana: Wohnen Ihre Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und Ihre Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. → Ana: Wohnen deine Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und deine Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. |
| Lektion[a2.1-l01].hoeren.units[a21-l01-hoeren-u3].audioText | Ana: Wohnen Ihre Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und Ihre Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. → Ana: Wohnen deine Eltern in Bremen? Lena: Nein, in Köln. Mein Bruder wohnt noch bei unseren Eltern. Ana: Und deine Oma? Lena: Sie wohnt auf dem Land. Unser Opa hat bei der Bahn gearbeitet. Jetzt arbeitet er nicht mehr. |
| Lektion[a2.1-l01].schreiben.sample | Hallo Lena, ich war bei unserer Oma. Wir haben zusammen Suppe gekocht und Musik gehört. Am Sonntag bin ich wieder zu Hause. Liebe Grüße, Ana → Hallo Lena, ich war bei meiner Oma. Wir haben zusammen Suppe gekocht und Musik gehört. Am Sonntag bin ich wieder zu Hause. Liebe Grüße, Ana |
| Lektion[a2.1-l02].dialog.lines[9].de | Ja, jetzt packe ich ihn ein. Danke für deine Hilfe! → Nein, er ist aus. Jetzt packe ich ihn ein. Danke für deine Hilfe! |
| Lektion[a2.1-l02].dialog.lines[9].en | Yes, now I’m packing it. Thanks for your help! → No, it is off. I’m packing it now. Thanks for your help! |
| Lektion[a2.1-l02].notice.bodyDe | Bei trennbaren Verben steht ge- zwischen Vorsilbe und Verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. Das Partizip steht am Satzende: Ich habe mein Handy **mitgebracht**. Vergleichen Sie das Präsens: Jetzt packe ich ihn ein. Verben mit sein folgen in Lektion 8. → Bei trennbaren Verben hier steht ge- zwischen Vorsilbe und Verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. Im Hauptsatz steht das Partizip am Ende: Ich habe mein Handy **mitgebracht**. Vergleichen Sie das Präsens: Jetzt packe ich ihn ein. Verben mit sein folgen in Lektion 8. |
| Lektion[a2.1-l02].notice.bodyEn | With separable verbs ge- goes between the prefix and verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. The participle goes at the end: Ich habe mein Handy **mitgebracht**. Compare the present: Jetzt packe ich ihn ein. Verbs taking sein follow in lesson 8. → For the separable verbs here, ge- goes between the prefix and verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. In the main clause the participle goes at the end: Ich habe mein Handy **mitgebracht**. Compare the present: Jetzt packe ich ihn ein. Verbs taking sein follow in lesson 8. |
| Lektion[a2.1-l03].notice.bodyDe | Fragen Sie wo: Dativ, **in der Ecke**, **auf dem Balkon**. Fragen Sie wohin: Akkusativ, **an die Wand**, **neben den Tisch**. Unterscheiden Sie stellen/stehen, legen/liegen, hängen/hängen und setzen/sitzen. Setzen braucht hier ein Objekt: das Kind auf den Stuhl setzen. Sitzen beschreibt den Ort. Keine neue Position: Das Bild **hängt über dem Tisch**. → Bei Wechselpräpositionen (in, an, auf, über, unter, vor, hinter, neben, zwischen) gilt: wo → Dativ, **in der Ecke**, **auf dem Balkon**. wohin → Akkusativ, **an die Wand**, **neben den Tisch**. Unterscheiden Sie stellen/stehen, legen/liegen, hängen/hängen und setzen/sitzen. Setzen braucht hier ein Objekt: das Kind auf den Stuhl setzen. Sitzen beschreibt den Ort. Keine neue Position: Das Bild **hängt über dem Tisch**. |
| Lektion[a2.1-l03].notice.bodyEn | Ask wo (where): dative, **in der Ecke**, **auf dem Balkon**. Ask wohin (where to): accusative, **an die Wand**, **neben den Tisch**. Distinguish placing from position: stellen/stehen, legen/liegen, hängen/hängen, setzen/sitzen. Here setzen needs an object: placing a child on a chair. Sitzen describes a position. An existing position: Das Bild **hängt über dem Tisch**. → With two-way prepositions (in, an, auf, über, unter, vor, hinter, neben, zwischen): wo (where) → dative, **in der Ecke**, **auf dem Balkon**. wohin (where to) → accusative, **an die Wand**, **neben den Tisch**. Distinguish placing from position: stellen/stehen, legen/liegen, hängen/hängen, setzen/sitzen. Here setzen needs an object: placing a child on a chair. Sitzen describes a position. An existing position: Das Bild **hängt über dem Tisch**. |
| Lektion[a2.1-l04].dialog.lines[7].de | Nein, ich brauche kein frisches Brot. Wie ist der Preis? → Nein, ich brauche kein frisches Brot. Was kostet alles zusammen? |
| Lektion[a2.1-l04].dialog.lines[7].en | No, I don’t need a fresh loaf. What is the price? → No, I don’t need a fresh loaf. How much is everything together? |
| Lektion[a2.1-l04].dialog.lines[8].de | Alles zusammen kostet zwölf Euro. Sie bezahlen dort an der Kasse. → Der Preis ist zwölf Euro. Sie bezahlen dort an der Kasse. |
| Lektion[a2.1-l04].dialog.lines[8].en | Everything together costs twelve euros. You pay at the checkout over there. → The price is twelve euros. You pay at the checkout over there. |
| Lektion[a2.1-l04].notice.bodyDe | Nach der/die/das im Nominativ steht -e; im Plural -en: **die roten Tomaten**. Im Akkusativ maskulin steht -en: **einen frischen Salat**. Nach ein, kein und Possessivwörtern zeigt das Adjektiv das Genus: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Vergleichen Sie die Endungen. Dativ folgt in Lektion 11. Ein Produkt fehlt: Das Brot fehlt. → Nach der/die/das im Nominativ steht -e; nach die/keine/meine im Plural -en: **die roten Tomaten**. Im Akkusativ maskulin steht -en: **einen frischen Salat**. Nach ein/kein/mein ohne Endung trägt das Adjektiv die Endung: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Vergleichen Sie die Endungen. Dativ folgt in Lektion 11. Ein Produkt fehlt: Das Brot fehlt. |
| Lektion[a2.1-l04].notice.bodyEn | After der/die/das in the nominative use -e; in the plural -en: **die roten Tomaten**. Masculine accusative takes -en: **einen frischen Salat**. After ein, kein and possessives the adjective shows gender: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Compare the endings. Dative adjectives follow in lesson 11. An item is missing: Das Brot fehlt. → After der/die/das in the nominative use -e; after die/keine/meine in the plural use -en: **die roten Tomaten**. Masculine accusative takes -en: **einen frischen Salat**. After ein/kein/mein without an ending, the adjective carries the ending: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Compare the endings. Dative adjectives follow in lesson 11. An item is missing: Das Brot fehlt. |
| Lektion[a2.1-l05].dialog.lines[6].de | Gut. Den Kindern schenken wir auch Kuchen. Dann sind alle glücklich. → Gut. Den Kindern backen wir auch Kuchen. Dann sind alle glücklich. |
| Lektion[a2.1-l05].dialog.lines[6].en | Good. We’ll give the children cake too. Then everyone will be happy. → Good. We’ll bake the children a cake too. Then everyone will be happy. |
| Lektion[a2.1-l05].notice.bodyDe | Der Empfänger steht im Dativ: Wir schenken **der Oma** die Kette. Fragen Sie wem. Maskulin/neutrum: dem; feminin: der; Plural: den, oft mit -n am Nomen: **den Kindern**. Possessiv: **meinem Bruder**, meiner Oma. Pronomen: **ihr**, **mir**. Das Geschenk steht im Akkusativ. Gratulieren und danken brauchen auch den Dativ. → Bei schenken steht der Empfänger im Dativ: Wir schenken **der Oma** die Kette. Fragen Sie wem. Maskulin/neutrum: dem; feminin: der; Plural: den, oft mit -n am Nomen: **den Kindern**. Possessiv: **meinem Bruder**, meiner Oma. Pronomen: **ihr**, **mir**. Das Geschenk steht im Akkusativ. Gratulieren und danken brauchen auch den Dativ. |
| Lektion[a2.1-l05].notice.bodyEn | The recipient takes the dative: Wir schenken **der Oma** die Kette. Ask wem (to whom). Masculine/neuter: dem; feminine: der; plural: den, often adding -n to the noun: **den Kindern**. Possessives: **meinem Bruder**, meiner Oma. Pronouns: **ihr**, **mir**. The gift takes the accusative. Gratulieren and danken also take the dative. → With schenken, the recipient takes the dative: Wir schenken **der Oma** die Kette. Ask wem (to whom). Masculine/neuter: dem; feminine: der; plural: den, often adding -n to the noun: **den Kindern**. Possessives: **meinem Bruder**, meiner Oma. Pronouns: **ihr**, **mir**. The gift takes the accusative. Gratulieren and danken also take the dative. |
| Lektion[a2.1-l06].dialog.lines[5].en | No, I was only allowed to leave at nine. I couldn’t come. → No, I was allowed to leave at nine. I couldn’t come. |
| Lektion[a2.1-l06].notice.bodyDe | Mehrzahl: wir mussten, konnten, durften. Im Präteritum verlieren können, müssen und dürfen den Umlaut: **konnte**, **musste**, **durfte**. Dazu wollte; wir **wollten**. Der Infinitiv steht am Ende: Ich musste arbeiten. Nach Es tut mir leid steht oft dass. Hier kommt dass nach dem Hauptsatz, mit einem finiten Verb am Ende: **dass ich nicht da war**. Vergleichen Sie die Satzenden. → Mehrzahl: wir mussten, konnten, durften. Im Präteritum verlieren können, müssen und dürfen den Umlaut: **konnte**, **musste**, **durfte**. Dazu wollte; wir **wollten**. Im Hauptsatz steht der Infinitiv am Ende: Ich musste arbeiten. Nach Es tut mir leid steht oft dass. Hier kommt dass nach dem Hauptsatz, mit einem finiten Verb am Ende: **dass ich nicht da war**. Vergleichen Sie die Satzenden. |
| Lektion[a2.1-l06].notice.bodyEn | Plural forms: wir mussten, konnten, durften. In the past, können, müssen and dürfen lose the umlaut: **konnte**, **musste**, **durfte**. Also wollte; wir **wollten**. The infinitive is last: Ich musste arbeiten. Es tut mir leid is often followed by dass. Here the dass clause comes after the main clause, ending in one finite verb: **dass ich nicht da war**. Compare the endings. → Plural forms: wir mussten, konnten, durften. In the past, können, müssen and dürfen lose the umlaut: **konnte**, **musste**, **durfte**. Also wollte; wir **wollten**. In the main clause the infinitive is last: Ich musste arbeiten. Es tut mir leid is often followed by dass. Here the dass clause comes after the main clause, ending in one finite verb: **dass ich nicht da war**. Compare the endings. |
| Lektion[a2.1-l07].wortfeld[3].de | das Volleyball → der Volleyball |
| Lektion[a2.1-l07].dialog.lines[7].de | Ja. Wir könnten zusammen essen. → Ja. Nach dem Training könnten wir zusammen essen. |
| Lektion[a2.1-l07].dialog.lines[7].en | Yes. We could eat together beforehand. → Yes. We could eat together after training. |
| Lektion[a2.1-l07].notice.bodyDe | Ratschläge im Imperativ: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Doch und mal machen den Ton freundlich. Für ihr: Kommt mit! Für Sie: Kommen Sie mit! Als Ratschlag: Du **solltest** viel schlafen. Als gemeinsamer Vorschlag: Wir **könnten** zusammen essen. Der Infinitiv steht am Ende. → Ratschläge im Imperativ: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Doch und mal können den Ton freundlich machen. Für ihr: Kommt mit! Für Sie: Kommen Sie mit! Als Ratschlag: Du **solltest** viel schlafen. Als gemeinsamer Vorschlag: Wir **könnten** zusammen essen. Der Infinitiv steht am Ende. |
| Lektion[a2.1-l07].notice.bodyEn | Advice with the imperative: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Doch and mal soften the tone. For ihr: Kommt mit! For Sie: Kommen Sie mit! Advice: Du **solltest** viel schlafen. A joint suggestion: Wir **könnten** zusammen essen. The infinitive is last. → Advice with the imperative: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Doch and mal can soften the tone. For ihr: Kommt mit! For Sie: Kommen Sie mit! Advice: Du **solltest** viel schlafen. A joint suggestion: Wir **könnten** zusammen essen. The infinitive is last. |
| Lektion[a2.1-l08].notice.bodyDe | Auch bleiben: ist geblieben. Sein steht bei Bewegung und Zustandswechsel: Ich **bin** vom Fahrrad **gefallen**. Trennbare Verben: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil nennt einen Grund. Hier steht der Nebensatz nach dem Hauptsatz, mit einem finiten Verb am Ende: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Vergleichen Sie die beiden Verben. → Sein bei Ortswechsel/Zustandswechsel, auch bei bleiben: ist geblieben. Tätigkeit: haben bei tanzen, auch möglich bei schwimmen. Beispiel: Ich **bin** vom Fahrrad **gefallen**. Trennbare Verben: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil nennt einen Grund. Hier steht der Nebensatz nach dem Hauptsatz, mit einem finiten Verb am Ende: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Vergleichen Sie. |
| Lektion[a2.1-l08].notice.bodyEn | Also bleiben: ist geblieben. Use sein with movement and changes of state: Ich **bin** vom Fahrrad **gefallen**. Separable verbs: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil gives a reason. Here the subordinate clause follows the main clause and ends in one finite verb: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Compare the two verbs. → Sein for changes of place/state, also with bleiben: ist geblieben. Activities: haben with tanzen, also possible with schwimmen. Example: Ich **bin** vom Fahrrad **gefallen**. Separable verbs: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil gives a reason. Here the subordinate clause follows the main clause and ends in one finite verb: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Compare. |
| Lektion[a2.1-l08].phonetik.items[2] | Ich bin aufge-WACHT. → Ich bin AUF-ge-wacht. |
| Lektion[a2.1-l09].dialog.lines[2].de | Dort hinten. Ich erkläre ihn Ihnen. → Dort hinten. Ich zeige ihn Ihnen. |
| Lektion[a2.1-l09].dialog.lines[2].en | Over there at the back. I’ll explain it to you. → Over there at the back. I’ll show it to you. |
| Lektion[a2.1-l09].notice.bodyDe | Bei zwei Nomen steht meist Dativ vor Akkusativ: Ich zeige der Kollegin den Drucker. Ein Akkusativpronomen steht vor dem Dativ: Ich erkläre **ihn Ihnen**. Ich schicke **sie Ihnen**. Sind beide Objekte Pronomen, gilt ebenfalls Akkusativ vor Dativ: **sie mir**, **ihn mir**. Er wird zu ihm: Ich kann sie ihm schicken. Ein Problem: Die Datei ist nicht da. → Bei zwei Nomen steht meist Dativ vor Akkusativ: Ich zeige der Kollegin den Drucker. Unbetont steht ein Akkusativpronomen normalerweise vor dem Dativ: Ich zeige **ihn Ihnen**. Ich schicke **sie Ihnen**. Auch bei zwei unbetonten Pronomen normalerweise Akkusativ vor Dativ: **sie mir**, **ihn mir**. Er wird zu ihm: Ich kann sie ihm schicken. Ein Problem: Die Datei ist nicht da. |
| Lektion[a2.1-l09].notice.bodyEn | With two nouns, dative usually precedes accusative: Ich zeige der Kollegin den Drucker. An accusative pronoun goes before the dative: Ich erkläre **ihn Ihnen**. Ich schicke **sie Ihnen**. When both objects are pronouns, accusative still comes before dative: **sie mir**, **ihn mir**. Er becomes ihm: Ich kann sie ihm schicken. A problem: the file is not there. → With two nouns, dative usually precedes accusative: Ich zeige der Kollegin den Drucker. An unstressed accusative pronoun normally goes before the dative: Ich zeige **ihn Ihnen**. Ich schicke **sie Ihnen**. With two unstressed pronouns, accusative also normally precedes dative: **sie mir**, **ihn mir**. Er becomes ihm: Ich kann sie ihm schicken. A problem: the file is not there. |
| Lektion[a2.1-l09].notice.examples[0] | Dort hinten. Ich erkläre ihn Ihnen. → Dort hinten. Ich zeige ihn Ihnen. |
| Lektion[a2.1-l10].dialog.lines[3].de | Am Freitag, zwischen zwei und drei Uhr. Vielleicht ohne Verspätung! → Am Freitag, zwischen zwei und drei Uhr. Vielleicht hat es Verspätung. |
| Lektion[a2.1-l10].dialog.lines[3].en | On Friday, between two and three. Hopefully without a delay! → On Friday, between two and three. Maybe it will be delayed. |
| Lektion[a2.1-l10].notice.bodyDe | **In zwei Wochen**: Zeitpunkt nach heute, in + Dativ. **Für zehn Tage**: Dauer, für + Akkusativ. **Über das Wochenende**: das ganze Wochenende. **Ab Montag**: Anfang. **Bis eins**: Ende. **Zwischen zwei und drei Uhr**: Zeitfenster. Fragen Sie nach Zeitpunkt, Anfang, Ende und Dauer. Ordinalzahlen im Dativ folgen in Lektion 11. → **In zwei Wochen**: Zeitpunkt nach heute, in + Dativ. **Für zehn Tage**: Dauer, für + Akkusativ. **Über das Wochenende**: ein Aufenthalt am Wochenende, ohne genaue Uhrzeiten. **Ab Montag**: Anfang. **Bis eins**: Ende. **Zwischen zwei und drei Uhr**: Zeitfenster. Fragen Sie nach Zeitpunkt, Anfang, Ende und Dauer. Ordinalzahlen im Dativ folgen in Lektion 11. |
| Lektion[a2.1-l10].notice.bodyEn | **In zwei Wochen**: a time from now, in + dative. **Für zehn Tage**: duration, für + accusative. **Über das Wochenende**: over the whole weekend. **Ab Montag**: start. **Bis eins**: end. **Zwischen zwei und drei Uhr**: a time window. Ask about the time, start, end and duration. Dative ordinal endings follow in lesson 11. → **In zwei Wochen**: a time from now, in + dative. **Für zehn Tage**: duration, für + accusative. **Über das Wochenende**: a weekend stay, without exact times. **Ab Montag**: start. **Bis eins**: end. **Zwischen zwei und drei Uhr**: a time window. Ask about the time, start, end and duration. Dative ordinal endings follow in lesson 11. |
| Lektion[a2.1-l10].schreiben.leitpunkte[1] | Wie lange Sie frei brauchen → Wie lange Sie frei haben möchten |
| Lektion[a2.1-l10].schreiben.sample | Guten Tag Herr Krüger, meine Eltern kommen in zwei Wochen am Freitag. Ich brauche für drei Tage frei. Meine Kollegin Frau Yilmaz macht meine Arbeit. Geht das? Vielen Dank! Viele Grüße, Ana Chakiri → Guten Tag Herr Krüger, meine Eltern kommen in zwei Wochen am Freitag. Ich möchte drei Tage frei haben. Meine Kollegin Frau Yilmaz macht meine Arbeit. Geht das? Vielen Dank! Viele Grüße, Ana Chakiri |
| Lektion[a2.1-l11].dialog.lines[6].de | Ja, für Ihre Eltern. Sie bezahlen zusammen zehn Euro. → Ja, für Ihre Familie. Sie bezahlen zusammen zehn Euro. |
| Lektion[a2.1-l11].dialog.lines[6].en | Yes, for your parents. Together they pay ten euros. → Yes, for your family. Together you pay ten euros. |
| Lektion[a2.1-l12].dialog.lines[1].de | Wir haben die Stadt besichtigt. Ich habe viel fotografiert und Fotos gemacht. → Wir haben die Stadt besichtigt. Ich habe viel fotografiert. Die Fotos sind schön. |
| Lektion[a2.1-l12].dialog.lines[1].en | We visited the city. I took lots of photographs. → We visited the city. I took lots of photographs. The photos are beautiful. |
| Lektion[a2.1-l12].dialog.lines[8].de | Und du? Hast du Hoffnung auf Urlaub in Marokko? → Und du? Möchtest du Urlaub in Marokko machen? |
| Lektion[a2.1-l12].dialog.lines[8].en | And you? Are you hoping for a holiday in Morocco? → And you? Would you like to go on holiday in Morocco? |
| Lektion[a2.1-l12].dialog.lines[9].de | Ja. Ich habe Geld gespart. Ich fliege, wenn ich Zeit habe. → Ja, ich habe Hoffnung. Ich habe gespart. Ich fliege, wenn ich Zeit habe. |
| Lektion[a2.1-l12].dialog.lines[9].en | Yes. I saved some money. I’ll fly when I have time. → Yes, I’m hopeful. I’ve saved up. I’ll fly when I have time. |
| Lektion[a2.1-l12].notice.bodyDe | Perfekt: haben und Partizip am Ende. Regelmäßig ge-…-t: **gemacht**. Viele unregelmäßige Formen enden auf -en: **gegessen**, **gesprochen**. Ohne ge- bei be-, ver-, er- und -ieren: **besichtigt**, **fotografiert**. Trennbar: **mitgebracht**. Wenn nennt eine Bedingung. Hier folgt der Nebensatz dem Hauptsatz und endet mit einem finiten Verb: Sie kommen wieder, **wenn sie Urlaub haben**. → Hier Perfekt mit haben; im Hauptsatz steht das Partizip am Ende. Regelmäßig ge-…-t: **gemacht**. Viele unregelmäßige Formen enden auf -en: **gegessen**, gesprochen. Ohne ge- bei be-, ver-, er- und -ieren: **besichtigt**, **fotografiert**. Trennbar: **mitgebracht**. Wenn nennt eine Bedingung. Hier folgt der Nebensatz dem Hauptsatz und endet mit einem finiten Verb: Sie kommen wieder, **wenn sie Urlaub haben**. |
| Lektion[a2.1-l12].notice.bodyEn | Perfekt: haben and a final participle. Regular ge-…-t: **gemacht**. Many irregular forms end in -en: **gegessen**, **gesprochen**. No ge- with be-, ver-, er- and -ieren: **besichtigt**, **fotografiert**. Separable: **mitgebracht**. Wenn states a condition. Here the subordinate clause follows the main clause and ends in one finite verb: Sie kommen wieder, **wenn sie Urlaub haben**. → Here: Perfekt with haben; the participle ends the main clause. Regular ge-…-t: **gemacht**. Many irregular forms end in -en: **gegessen**, gesprochen. No ge- with be-, ver-, er- and -ieren: **besichtigt**, **fotografiert**. Separable: **mitgebracht**. Wenn states a condition. Here the subordinate clause follows the main clause and ends in one finite verb: Sie kommen wieder, **wenn sie Urlaub haben**. |
| Lektion[a2.1-l12].notice.examples[0] | Wir haben die Stadt besichtigt. Ich habe viel fotografiert und Fotos gemacht. → Wir haben die Stadt besichtigt. Ich habe viel fotografiert. Die Fotos sind schön. |
| Lektion[a2.1-l12].phonetik.items[1] | wenn sie URLAUB haben. → wenn sie UR-laub haben. |

Changed text fields: 56.

### src/data/curricula/a21.exams.js

| Field | Before → after |
| --- | --- |
| A21_HOEREN[1].papers[2][a21-cp2-hoeren-r2-4].question | Was bekommt der Onkel? → Was kauft die Person als Geschenk für den Onkel? |
| A21_HOEREN[1].papers[2][a21-cp2-hoeren-r2-4].questionEn | What will the uncle receive? → What does the person buy as a gift for the uncle? |
| A21_HOEREN[1].papers[2][a21-cp2-hoeren-r2-4].explanationDe | Der Onkel bekommt Öl. → Die Person kauft dem Onkel Öl als Geschenk. |
| A21_HOEREN[1].papers[2][a21-cp2-hoeren-r2-4].explanationEn | The uncle receives oil. → The person buys oil as a gift for the uncle. |
| A21_LESEN[1].papers[3][a21-cp2-lesen-r3-1].question | Sie suchen ein Buch für Ihre Tochter. Wohin gehen Sie? → Sie suchen ein Kinderbuch für Ihre Tochter. Wohin gehen Sie? |
| A21_LESEN[1].papers[3][a21-cp2-lesen-r3-1].questionEn | Where do you look for a book for your daughter? → Where do you look for a children’s book for your daughter? |
| A21_LESEN[1].papers[3][a21-cp2-lesen-r3-2].question | Sie möchten ein Buch verschenken. Wo bekommen Sie Papier für das Geschenk? → Sie möchten ein Buch verschenken. Wo packt das Team Ihr Geschenk ein? |
| A21_LESEN[1].papers[3][a21-cp2-lesen-r3-2].questionEn | Where will your gift be wrapped? → Where will the staff wrap your gift? |
| A21_LESEN[2].papers[1][a21-cp3-lesen-r1-2].question | Tims Tochter hat Husten. Er möchte eine Untersuchung für sie. → Tims Tochter ist sechs Jahre alt. Sie hat Husten. Tim möchte eine Untersuchung für sie. |
| A21_LESEN[2].papers[1][a21-cp3-lesen-r1-2].questionEn | Tim wants his daughter to be examined because she has a cough. → Tim’s daughter is six years old. She has a cough, and Tim wants her to be examined. |
| A21_LESEN[2].papers[2][a21-cp3-lesen-r2-3].question | Ana möchte besser mit ihren Kollegen sprechen. Sie hat seit fünf Jahren eine Stelle. → Ana arbeitet seit fünf Jahren im Büro. Sie möchte besser mit ihren Kollegen sprechen. |
| A21_LESEN[2].papers[2][a21-cp3-lesen-r2-3].questionEn | Ana has had a job for five years and wants to communicate better with her colleagues. → Ana has worked in an office for five years and wants to communicate better with her colleagues. |

Changed text fields: 12.

### src/data/curricula/a21.meta.js

| Field | Before → after |
| --- | --- |
| A21_META.lektionIntro.a2.1-l06.situationEn | Ana has to move a planned meeting and explains why. → Tim missed Lena’s barbecue and plans another meeting with his friend. |
| A21_META.lektionIntro.a2.1-l07.situationEn | Ana asks a trainer about joining a sports club. → Tim invites his friend Ana to train at his sports club and gives her advice. |
| A21_META.lektionIntro.a2.1-l10.situationEn | Ana plans her parents’ visit and asks her manager for time off. → Ana and her friend Lena plan to collect Ana’s parents from Morocco and spend time together. |

Changed text fields: 3.

### src/data/lessonPools/a21.json

| Field | Before → after |
| --- | --- |
| pool[a0a1d907-934e-5dc8-8c48-ccca9cbb2c9d].explanationDe | Die Plural-Spalte hat immer -en. laut steht nach sind und hat keine Endung. → Nach die im Plural steht -en. Laut steht nach sind und hat keine Endung. |
| pool[a0a1d907-934e-5dc8-8c48-ccca9cbb2c9d].explanationEn | The plural column is -en everywhere. laut stands after sind and keeps no ending. → After die in the plural use -en. Laut follows sind and has no ending. |
| pool[428928b8-3f4c-55e1-be89-d83d0c1cbdc3].explanationDe | kein hat einen Plural, ein nicht. Im Plural ist die Endung immer -en. → Kein hat einen Plural, ein nicht. Nach keine im Plural steht -en. |
| pool[428928b8-3f4c-55e1-be89-d83d0c1cbdc3].explanationEn | kein has a plural, ein does not. In the plural the ending is always -en. → Kein has a plural, ein does not. After keine in the plural use -en. |
| pool[c1da8c4f-ca9f-4f0b-a3cc-64da97337087].explanationDe | Plural Dativ: die → den (und Nomen bekommt -n: Kindern). → Im Dativ Plural steht den. Das Nomen bekommt -n, außer es endet schon auf -n oder -s. |
| pool[c1da8c4f-ca9f-4f0b-a3cc-64da97337087].explanationEn | Plural dative: die → den (and noun gets -n: Kindern). → The dative plural uses den. Add -n to the noun unless it already ends in -n or -s. |
| pool[2c76f50f-d7a9-43ac-be50-254f90aef782].questionDe | Das Buch gehört ___ Studentin. → Das Buch gehört ___ Studentin. (unbestimmter Artikel) |
| pool[2c76f50f-d7a9-43ac-be50-254f90aef782].questionEn | The book belongs to ___ student (female). → The book belongs to a student. Choose the indefinite article. |
| pool[7e6fd0ae-c74f-4fb7-bce6-50a1564ecdbe].explanationDe | Dativ Plural: Nomen bekommt -n. Freunde → Freunden. → Im Dativ Plural steht den. Das Nomen bekommt -n, außer es endet schon auf -n oder -s. |
| pool[7e6fd0ae-c74f-4fb7-bce6-50a1564ecdbe].explanationEn | Dative plural: noun adds -n. Freunde → Freunden. → The dative plural uses den. Add -n to the noun unless it already ends in -n or -s. |
| pool[437d6a0b-bebf-4d09-a6be-f4eb22f508ef].explanationDe | Plural Dativ: die → den UND Nomen bekommt -n. → Im Dativ Plural steht den. Das Nomen bekommt -n, außer es endet schon auf -n oder -s. |
| pool[437d6a0b-bebf-4d09-a6be-f4eb22f508ef].explanationEn | Plural dative: die → den AND noun adds -n. → The dative plural uses den. Add -n to the noun unless it already ends in -n or -s. |
| pool[671e18d4-4c76-5c50-8bed-9e190233e076].explanationDe | Im Dativ Plural wird der Artikel zu den. Das Nomen bekommt auch ein -n. → Im Dativ Plural steht den. Das Nomen bekommt -n, außer es endet schon auf -n oder -s. |
| pool[671e18d4-4c76-5c50-8bed-9e190233e076].explanationEn | In the dative plural the article becomes den and the noun itself adds -n. → The dative plural uses den. Add -n to the noun unless it already ends in -n or -s. |
| pool[a0d79b95-0b15-4646-9f8c-38220ca4ec06].questionDe | ___ bitte die Tür! → ___ bitte eine Pause! (machen, du-Form) |
| pool[a0d79b95-0b15-4646-9f8c-38220ca4ec06].questionEn | ___ bitte die Tür! (du, machen) → Ask one friend to take a break. Use the du imperative of machen. |
| pool[1da4c8ba-730e-4e22-ad56-edf62919dab0].questionDe | ___ bitte die Tür! → ___ bitte eine Pause! (machen, ihr-Form) |
| pool[1da4c8ba-730e-4e22-ad56-edf62919dab0].questionEn | ___ bitte die Tür! (ihr, machen) → Ask several friends to take a break. Use the ihr imperative of machen. |
| pool[5d5411e0-244e-4aef-8dc4-1cb137f3ca45].questionDe | ___ ___ bitte die Tür! → ___ ___ bitte eine Pause! (machen, Sie-Form) |
| pool[5d5411e0-244e-4aef-8dc4-1cb137f3ca45].questionEn | ___ ___ bitte die Tür! (Sie, machen) → Ask someone formally to take a break. Use the Sie imperative of machen. |
| pool[extra-a21-l07-09].questionDe | Ergänzen Sie: Du ___ eine Pause machen. (sollen, Ratschlag) → Ergänzen Sie: Du ___ eine Pause machen. (sollen, Konjunktiv II, Ratschlag) |
| pool[extra-a21-l07-10].questionDe | Ergänzen Sie: Wir ___ zusammen trainieren. (können, Vorschlag) → Ergänzen Sie: Wir ___ zusammen trainieren. (können, Konjunktiv II, Vorschlag) |
| pool[extra-a21-l07-11].questionDe | Ergänzen Sie: Du ___ viel schlafen. (sollen, Ratschlag) → Ergänzen Sie: Du ___ viel schlafen. (sollen, Konjunktiv II, Ratschlag) |
| pool[extra-a21-l07-12].questionDe | Ergänzen Sie: Wir ___ am Freitag zusammen essen. (können, Vorschlag) → Ergänzen Sie: Wir ___ am Freitag zusammen essen. (können, Konjunktiv II, Vorschlag) |
| pool[extra-a21-l07-25].questionDe | Du bist müde. Du ___ eine Pause machen. (sollen, Ratschlag) → Du bist müde. Du ___ eine Pause machen. (sollen, Konjunktiv II, Ratschlag) |
| pool[extra-a21-l07-26].questionDe | Wir ___ zusammen Volleyball spielen. (können, höflicher Vorschlag) → Wir ___ zusammen Volleyball spielen. (können, Konjunktiv II, höflicher Vorschlag) |
| pool[485648bc-3987-5288-bf14-d7e6d325f54c].explanationDe | Die Sie-Form ist immer der Infinitiv plus Sie. → Hier sieht die Imperativform wie der Infinitiv aus, danach steht Sie. Ausnahme: Seien Sie! |
| pool[485648bc-3987-5288-bf14-d7e6d325f54c].explanationEn | The Sie-form is the infinitive plus Sie, however long the verb is - buchstabieren keeps every syllable. → Here the imperative looks like the infinitive, followed by Sie. Exception: Seien Sie! |
| pool[a90dbd80-9f76-52ea-9e9c-936f1eff18cb].questionDe | Schreiben Sie den Satz (Beginnen Sie mit „Ich“; „nicht“ steht vor „kommen“): [ich / gestern Abend / nicht kommen / können] → Schreiben Sie den Satz im Präteritum (Beginnen Sie mit „Ich“; „nicht“ steht vor „kommen“): [ich / gestern Abend / nicht kommen / können] |
| pool[a90dbd80-9f76-52ea-9e9c-936f1eff18cb].questionEn | Write the sentence in the Präteritum: I couldn't come yesterday evening. (können, ich; start with Ich or Gestern Abend) Begin with “Ich”. Put “nicht” before “kommen”. → Write the sentence in the past tense. Start with Ich and place nicht before kommen. Begin with “Ich”. Put “nicht” before “kommen”. |
| pool[05fe9c27-acc2-5040-9ec2-5b0bd064422a].questionDe | Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / am Sonntag / ins Kino gehen / wollen] → Schreiben Sie den Satz im Präteritum (Beginnen Sie mit „Wir“): [wir / am Sonntag / ins Kino gehen / wollen] |
| pool[05fe9c27-acc2-5040-9ec2-5b0bd064422a].questionEn | Write the sentence in the Präteritum: We wanted to go to the cinema on Sunday. (wollen, wir) Begin with “Wir”. → Write the sentence in the past tense, starting with Wir. Begin with “Wir”. |
| pool[extra-a21-l08-01].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[f5e1b8bf-96fb-4e60-9493-355b554991ec].explanationDe | ankommen = Ankunft (Bewegung). sein + angekommen. → Ankommen beschreibt einen Ortswechsel: sein + angekommen. |
| pool[f5e1b8bf-96fb-4e60-9493-355b554991ec].explanationEn | ankommen = arrival (movement). sein + angekommen. → Ankommen expresses a change of place: sein + angekommen. |
| pool[extra-a21-l08-02].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-03].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-04].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-05].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-06].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-07].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-08].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[f4e936d3-7429-5717-9f5f-0ccf643ebe70].explanationDe | fahren ist unregelmäßig und zeigt Bewegung: sind gefahren. → Fahren mit Ziel beschreibt einen Ortswechsel: sind gefahren. |
| pool[f4e936d3-7429-5717-9f5f-0ccf643ebe70].explanationEn | fahren is irregular and shows movement, so the Perfekt is sind + gefahren. → Fahren with a destination expresses a change of place: sind gefahren. |
| pool[extra-a21-l08-21].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-22].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-23].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-24].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-25].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-26].explanationDe | Ortswechsel oder Zustandswechsel: sein und das Partizip bilden das Perfekt. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-13].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[extra-a21-l08-14].explanationDe | Bei Bewegung und Zustandswechsel steht hier sein mit Partizip. → Diese Verben bilden das Perfekt mit sein. Bleiben nimmt ebenfalls sein, ohne Ortswechsel. |
| pool[3004cab5-8973-51f3-b3d2-e8cc65ec79dd].explanationDe | kommen zeigt Bewegung. Die Plural-Form von sein heißt sind. → Kommen beschreibt einen Ortswechsel. Die Pluralform von sein heißt sind. |
| pool[3004cab5-8973-51f3-b3d2-e8cc65ec79dd].explanationEn | kommen is a movement verb, and the plural form of sein is sind. → Kommen expresses a change of place. The plural form of sein is sind. |
| pool[a235c8d9-1d38-5afb-9f14-37ef548d1b70].explanationDe | arbeiten ist eine Tätigkeit ohne Bewegung und nimmt haben. → Arbeiten bildet das Perfekt mit haben: Ich habe gearbeitet. |
| pool[a235c8d9-1d38-5afb-9f14-37ef548d1b70].explanationEn | arbeiten is an activity without movement, so it takes haben. → Arbeiten forms the perfect with haben: Ich habe gearbeitet. |
| pool[extra-a21-l01-09].explanationDe | Namen bekommen -s; nach von steht Dativ. → Namen ohne s-Laut am Ende bekommen -s; nach von steht Dativ. |
| pool[extra-a21-l01-10].explanationDe | Namen bekommen -s; nach von steht Dativ. → Namen ohne s-Laut am Ende bekommen -s; nach von steht Dativ. |
| pool[extra-a21-l01-11].explanationDe | Namen bekommen -s; nach von steht Dativ. → Namen ohne s-Laut am Ende bekommen -s; nach von steht Dativ. |
| pool[extra-a21-l01-12].explanationDe | Namen bekommen -s; nach von steht Dativ. → Namen ohne s-Laut am Ende bekommen -s; nach von steht Dativ. |
| pool[dd76e075-799d-46b3-a3df-c5563e3599c9].options[3] | zu dem → zu das |
| pool[e0a792eb-01b2-4e41-a847-92196d29567e].options[0] | zu dem → zu den |
| pool[e0a792eb-01b2-4e41-a847-92196d29567e].options[1] | zu der → zu die |
| pool[ca7cb632-1d77-4bfb-80df-f9c89a03e9aa].questionDe | Sie kommt ___ der Schweiz. → Sie kommt ___ der Schweiz. (Herkunft) |
| pool[ca7cb632-1d77-4bfb-80df-f9c89a03e9aa].questionEn | She comes from Switzerland. → She comes from Switzerland. Choose the preposition for her country of origin. |
| pool[extra-a21-l09-01].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-02].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-03].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-04].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-05].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-06].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-07].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-08].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[extra-a21-l09-21].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[extra-a21-l09-22].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[extra-a21-l09-23].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[extra-a21-l09-24].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[extra-a21-l09-25].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[extra-a21-l09-26].explanationDe | Das Akkusativpronomen steht vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. → Unbetont steht das Akkusativpronomen normalerweise vor dem Dativobjekt. Prüfen Sie das Genus des Nomens. |
| pool[547c67c4-a1b3-50ae-8455-d168cc964d4c].questionDe | Schreiben Sie den Satz: [er / schicken / mir / den Schlüssel] (Beginnen Sie mit „Er“) → Schreiben Sie den Satz: [er / schicken / mir / den Schlüssel] (unbetonte Pronomen) (Beginnen Sie mit „Er“) |
| pool[547c67c4-a1b3-50ae-8455-d168cc964d4c].questionEn | Write: He sends me the key. Begin with Er. Begin with “Er”. → Write: He sends me the key. Begin with Er; use unstressed objects. Begin with “Er”. |
| pool[547c67c4-a1b3-50ae-8455-d168cc964d4c].explanationDe | Ein Pronomen und ein Nomen: mir steht vor den Schlüssel. → Bei unbetonten Objekten steht das Pronomen normalerweise vor dem Nomen: mir vor den Schlüssel. |
| pool[547c67c4-a1b3-50ae-8455-d168cc964d4c].explanationEn | With a pronoun and a noun object, mir comes before den Schlüssel. → With unstressed objects, the pronoun normally precedes the noun: mir before den Schlüssel. |
| pool[extra-a21-l09-09].questionDe | Bilden Sie den Satz: [Ich / schicke / sie / Ihnen] (Beginnen Sie mit „Ich“) → Bilden Sie den Satz: [Ich / schicke / sie / Ihnen] (unbetonte Pronomen) (Beginnen Sie mit „Ich“) |
| pool[extra-a21-l09-09].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[bc20094e-58cb-5f1d-987c-3ad17b76052d].questionDe | Korrigieren Sie: Ich schicke ihm es. (Beginnen Sie mit „Ich“) → Korrigieren Sie bei unbetonten Pronomen: Ich schicke ihm es. (Beginnen Sie mit „Ich“) |
| pool[bc20094e-58cb-5f1d-987c-3ad17b76052d].questionEn | Correct the word order: two pronouns, accusative first. Write the whole sentence. Begin with “Ich”. → Correct the order: Ich schicke ihm es. Begin with Ich; use unstressed pronouns. Begin with “Ich”. |
| pool[bc20094e-58cb-5f1d-987c-3ad17b76052d].explanationDe | Bei zwei Pronomen steht das Akkusativ-Pronomen vor dem Dativ-Pronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[bc20094e-58cb-5f1d-987c-3ad17b76052d].explanationEn | With two pronouns the accusative pronoun comes before the dative pronoun. → With two unstressed object pronouns, accusative normally precedes dative. |
| pool[extra-a21-l09-10].questionDe | Bilden Sie den Satz: [Frau Yilmaz / zeigt / es / ihm] (Beginnen Sie mit „Frau Yilmaz“) → Bilden Sie den Satz: [Frau Yilmaz / zeigt / es / ihm] (unbetonte Pronomen) (Beginnen Sie mit „Frau Yilmaz“) |
| pool[extra-a21-l09-10].explanationDe | Ein Akkusativpronomen steht vor dem Dativpronomen. → Bei zwei unbetonten Objektpronomen steht normalerweise Akkusativ vor Dativ. |
| pool[350eca35-50f7-56be-a1db-01b277d2c085].questionDe | [ich / zeigen / es / dem Chef] → Schreiben Sie den Satz. (Beginnen Sie mit „Ich“) → [ich / zeigen / es / dem Chef] → Schreiben Sie den Satz. (unbetonte Pronomen) (Beginnen Sie mit „Ich“) |
| pool[350eca35-50f7-56be-a1db-01b277d2c085].questionEn | Write the sentence: I'll show it to the boss. (pronoun + noun object, start with Ich) Begin with “Ich”. → Write the sentence, starting with Ich. Use unstressed objects. Begin with “Ich”. |
| pool[350eca35-50f7-56be-a1db-01b277d2c085].explanationDe | Ein Pronomen steht vor einem Nomen, egal in welchem Fall. → Bei unbetonten Objekten steht das Pronomen normalerweise vor dem Nomen: es vor dem Chef. |
| pool[350eca35-50f7-56be-a1db-01b277d2c085].explanationEn | A pronoun stands before a noun object, whatever its case: es (accusative) before dem Chef (dative). → With unstressed objects, the pronoun normally precedes the noun: es before dem Chef. |
| pool[extra-a21-l02-01].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-02].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-03].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-04].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-05].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-06].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-07].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-08].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[f6c88bd7-f85b-574b-9a11-84e9a4c02f99].explanationDe | Im Hauptsatz geht das Präfix auf ans Ende. Du konjugierst nur räumen. → Im Hauptsatz steht das Präfix auf am Ende. Sie konjugieren nur räumen. |
| pool[f6c88bd7-f85b-574b-9a11-84e9a4c02f99].explanationEn | In a main clause the prefix auf goes to the end, and you conjugate only räumen. → In a main clause the prefix auf goes at the end. Conjugate only räumen. |
| pool[f22cfc5f-44ea-5699-996f-6a4327f1ba38].explanationDe | Du konjugierst nur das Grundverb gehen. Das Präfix aus bleibt am Ende. → Sie konjugieren nur das Grundverb gehen. Das Präfix aus bleibt am Ende. |
| pool[f22cfc5f-44ea-5699-996f-6a4327f1ba38].explanationEn | You conjugate only the base verb gehen; the prefix aus stays at the end. → Conjugate only the base verb gehen. The prefix aus stays at the end. |
| pool[extra-a21-l02-09].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[extra-a21-l02-10].explanationDe | Im Perfekt steht ge- zwischen Vorsilbe und Verbstamm. → Bei den Verben in dieser Aufgabe steht ge- zwischen Vorsilbe und Verbstamm. |
| pool[26ef0497-431e-56e3-9dc2-f75363ba9e45].explanationDe | Im Partizip steht ge- zwischen Präfix und Stamm: eingekauft. → Bei einkaufen steht ge- zwischen Präfix und Stamm: eingekauft. |
| pool[26ef0497-431e-56e3-9dc2-f75363ba9e45].explanationEn | In the participle of a separable verb ge- sits between the prefix and the stem: eingekauft. → For einkaufen, ge- goes between prefix and stem: eingekauft. |
| pool[a01124d0-8bb6-56a9-8c4c-fb99cf4e139f].explanationDe | Im Partizip steht ge- zwischen Präfix und Stamm. → Bei diesem Verb steht ge- zwischen Präfix und Stamm. |
| pool[a01124d0-8bb6-56a9-8c4c-fb99cf4e139f].explanationEn | In the participle of a separable verb ge- stands between the prefix and the stem. → For this verb, ge- goes between prefix and stem. |
| pool[extra-a21-l10-01].questionDe | Ergänzen Sie: Der Besuch ist ___ zwei Wochen. (in / für) → Wann ist die Ankunft? Ergänzen Sie: Die Ankunft ist ___ zwei Wochen. (in / für) |
| pool[b70d8422-014b-5797-ab3b-23dfa79e2b7e].questionDe | ___ Mittwoch habe ich einen Termin. → ___ Mittwoch habe ich einen Termin. (an + dem → Kurzform) |
| pool[b70d8422-014b-5797-ab3b-23dfa79e2b7e].questionEn | Fill in the preposition: On Wednesday I have an appointment. (weekday; the answer starts the sentence) → I have an appointment on Wednesday. Enter the contraction of an + dem. Use the contracted form. |
| pool[331020a5-94bf-55a4-85b1-1817ee098729].explanationDe | Auf Wie lange? antwortest du mit von … bis. → Von … bis nennt Anfang und Ende: von zehn bis achtzehn Uhr. |
| pool[331020a5-94bf-55a4-85b1-1817ee098729].explanationEn | Wie lange? is answered with the pair von … bis. → Von … bis gives the start and end: from ten to eighteen o’clock. |
| pool[extra-a21-l10-31].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[extra-a21-l10-32].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[extra-a21-l10-33].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[extra-a21-l10-34].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[extra-a21-l10-35].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[extra-a21-l10-36].explanationDe | Nach der Zeitangabe steht das konjugierte Verb. → Im Hauptsatz steht das konjugierte Verb auf Position zwei. |
| pool[6b091939-52db-5a74-bf35-fc2f74dafccf].explanationDe | zwischen verlangt den Dativ. Bei Uhrzeiten siehst du die Endung nicht. → Zwischen steht in dieser Zeitangabe mit Dativ. Uhrzeiten zeigen hier keine Endung. |
| pool[6b091939-52db-5a74-bf35-fc2f74dafccf].explanationEn | zwischen takes the dative; with bare clock times the ending is invisible. → Zwischen takes dative in this time expression. These clock times show no ending. |
| pool[16184f1b-c5db-4372-93c7-6f151e619899].questionDe | Ich gehe in ___ Park. → Ich gehe in ___ Park. (wohin?) |
| pool[16184f1b-c5db-4372-93c7-6f151e619899].questionEn | I go into ___ park. → I am going into the park. Choose the article for the destination. |
| pool[16184f1b-c5db-4372-93c7-6f151e619899].explanationDe | gehen = Bewegung. WOHIN? Akkusativ. der Park → den Park. → Das Ziel ist im Park. Die Wechselpräposition in steht hier mit Akkusativ: in den Park. |
| pool[16184f1b-c5db-4372-93c7-6f151e619899].explanationEn | gehen = movement. WOHIN? Accusative. der Park → den Park. → The destination is inside the park. The two-way preposition in takes accusative here: in den Park. |
| pool[extra-a21-l03-01].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[extra-a21-l03-02].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[extra-a21-l03-03].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[3cdb61ef-1037-40ec-888f-3f1a61f632be].explanationDe | hängen (transitiv) = aufhängen. Bewegung = Akkusativ. die Wand bleibt die. → Die Wand ist das Ziel. An ist eine Wechselpräposition und steht hier mit Akkusativ: an die Wand. |
| pool[3cdb61ef-1037-40ec-888f-3f1a61f632be].explanationEn | hängen (transitive) = putting something. Movement = accusative. die Wand stays die. → The wall is the destination. The two-way preposition an takes accusative here: an die Wand. |
| pool[extra-a21-l03-04].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[extra-a21-l03-05].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[f94f6a89-ef96-41aa-8833-092dbb26b7ac].explanationDe | stellen = hinstellen (Bewegung). Akkusativ. die Garage bleibt die. → Das Ziel liegt vor der Garage. Die Wechselpräposition vor steht hier mit Akkusativ: vor die Garage. |
| pool[f94f6a89-ef96-41aa-8833-092dbb26b7ac].explanationEn | stellen = putting (movement). Accusative. die Garage stays die. → The destination is in front of the garage. The two-way preposition vor takes accusative here: vor die Garage. |
| pool[extra-a21-l03-06].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[193c2e39-6c23-4505-bfc4-40245e500b5e].options[3] | in dem → in der |
| pool[extra-a21-l03-07].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[eae9f82c-baac-4cdc-b91b-e018d125b66b].questionDe | Ich gehe ___ Kino. → Ich gehe ___ Kino. (wohin?) |
| pool[eae9f82c-baac-4cdc-b91b-e018d125b66b].questionEn | I go to the cinema. → I am going into the cinema. Choose the expression for the destination. |
| pool[eae9f82c-baac-4cdc-b91b-e018d125b66b].options[3] | in dem → in der |
| pool[eae9f82c-baac-4cdc-b91b-e018d125b66b].explanationDe | gehen = Bewegung. WOHIN? Akkusativ. ins = in das. → Das Ziel ist im Kino. In ist eine Wechselpräposition: hier Akkusativ. Ins = in das. |
| pool[eae9f82c-baac-4cdc-b91b-e018d125b66b].explanationEn | gehen = movement. WOHIN? Accusative. ins = in das. → The destination is inside the cinema. In is a two-way preposition: accusative here. Ins = in das. |
| pool[extra-a21-l03-08].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[extra-a21-l03-09].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[extra-a21-l03-10].explanationDe | Wohin braucht hier Akkusativ; wo braucht Dativ. → Bei Wechselpräpositionen: wohin → Akkusativ, wo → Dativ. |
| pool[98c23539-f978-5020-9b51-d7a6b4819a92].explanationDe | liegen beschreibt eine Position, deshalb steht zwischen mit Dativ. Der Dativ Plural bekommt -n. → Liegen beschreibt einen Ort; zwischen steht hier mit Dativ. Bücher bekommt im Dativ Plural -n: Büchern. |
| pool[98c23539-f978-5020-9b51-d7a6b4819a92].explanationEn | liegen describes a position, so zwischen takes the dative; the dative plural adds -n. → Liegen describes a location; zwischen takes dative here. Bücher adds -n in the dative plural: Büchern. |
| pool[023880fc-3508-513e-bddd-e2187b4b7acc].explanationDe | Mit einem Akkusativobjekt beschreibt hängen eine Bewegung. über steht mit Akkusativ. → Das Bild kommt an eine neue Position. Die Wechselpräposition über steht hier mit Akkusativ. |
| pool[023880fc-3508-513e-bddd-e2187b4b7acc].explanationEn | With a direct object, hängen describes movement, so über takes the accusative. → The picture is going to a new position. The two-way preposition über takes accusative here. |

Changed text fields: 154.

### src/data/writingTasks.js

| Field | Before → after |
| --- | --- |
| WRITING_TASKS[a21-l01].sample | Hallo Lena, ich war bei unserer Oma. Wir haben zusammen Suppe gekocht und Musik gehört. Am Sonntag bin ich wieder zu Hause. Liebe Grüße, Ana → Hallo Lena, ich war bei meiner Oma. Wir haben zusammen Suppe gekocht und Musik gehört. Am Sonntag bin ich wieder zu Hause. Liebe Grüße, Ana |
| WRITING_TASKS[a21-l10].leitpunkte[1] | Wie lange Sie frei brauchen → Wie lange Sie frei haben möchten |
| WRITING_TASKS[a21-l10].sample | Guten Tag Herr Krüger, meine Eltern kommen in zwei Wochen am Freitag. Ich brauche für drei Tage frei. Meine Kollegin Frau Yilmaz macht meine Arbeit. Geht das? Vielen Dank! Viele Grüße, Ana Chakiri → Guten Tag Herr Krüger, meine Eltern kommen in zwei Wochen am Freitag. Ich möchte drei Tage frei haben. Meine Kollegin Frau Yilmaz macht meine Arbeit. Geht das? Vielen Dank! Viele Grüße, Ana Chakiri |

Changed text fields: 3.

### netlify/functions/_shared/ruleCards.mjs

| Field | Before → after |
| --- | --- |
| RULE_CARDS.adjective-endings-intro.content | Nach der/die/das im Nominativ steht -e; im Plural -en: **die roten Tomaten**. Im Akkusativ maskulin steht -en: **einen frischen Salat**. Nach ein, kein und Possessivwörtern zeigt das Adjektiv das Genus: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Vergleichen Sie die Endungen. Dativ folgt in Lektion 11. Ein Produkt fehlt: Das Brot fehlt. → Nach der/die/das im Nominativ steht -e; nach die/keine/meine im Plural -en: **die roten Tomaten**. Im Akkusativ maskulin steht -en: **einen frischen Salat**. Nach ein/kein/mein ohne Endung trägt das Adjektiv die Endung: **ein frisches Brot**, **kein frisches Brot**, **mein frischer Käse**. Vergleichen Sie die Endungen. Dativ folgt in Lektion 11. Das Brot fehlt.<br>English: Adjective endings depend on the article, gender, number and case. Here: nominative and accusative. |
| RULE_CARDS.adjective-endings-intro.commonMistakes[0].wrong | Ich kaufe einen rote Apfel. → Ich kaufe einen frische Salat. |
| RULE_CARDS.adjective-endings-intro.commonMistakes[0].correct | Ich kaufe einen roten Apfel. → Ich kaufe einen frischen Salat. |
| RULE_CARDS.dative-case.content | Der Empfänger steht im Dativ: Wir schenken **der Oma** die Kette. Fragen Sie wem. Maskulin/neutrum: dem; feminin: der; Plural: den, oft mit -n am Nomen: **den Kindern**. Possessiv: **meinem Bruder**, meiner Oma. Pronomen: **ihr**, **mir**. Das Geschenk steht im Akkusativ. Gratulieren und danken brauchen auch den Dativ. → Dativ mit schenken: Wir schenken **der Oma** die Kette. Fragen Sie wem. Maskulin/neutrum: dem; feminin: der; Plural: den, oft mit -n am Nomen: **den Kindern**. Possessiv: **meinem Bruder**, meiner Oma. Pronomen: **ihr**, **mir**. Das Geschenk steht im Akkusativ. Gratulieren und danken brauchen auch den Dativ.<br>English: With schenken, the recipient takes dative and the gift takes accusative. |
| RULE_CARDS.dative-case.commonMistakes[0].explanationDe | Der Empfänger steht im Dativ: dem Mann. → Schenken braucht hier den Dativ: dem Mann. |
| RULE_CARDS.imperative-mood.content | Ratschläge im Imperativ: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Doch und mal machen den Ton freundlich. Für ihr: Kommt mit! Für Sie: Kommen Sie mit! Als Ratschlag: Du **solltest** viel schlafen. Als gemeinsamer Vorschlag: Wir **könnten** zusammen essen. Der Infinitiv steht am Ende. → Ratschläge im Imperativ: **Komm doch** in meinen Verein! **Nimm** Schuhe und Wasser **mit**! **Mach** eine Pause! Für ihr: Kommt mit! Für Sie: Kommen Sie mit! **solltest** + Infinitiv. Als gemeinsamer Vorschlag: Wir **könnten** zusammen essen. Der Infinitiv steht am Ende.<br>English: Use imperatives for advice, sollte for a recommendation and könnte for a suggestion. |
| RULE_CARDS.imperative-mood.commonMistakes[0].wrong | Du solltest gehst nach Hause. → Wir könnten spielen Volleyball. |
| RULE_CARDS.imperative-mood.commonMistakes[0].correct | Du solltest nach Hause gehen. → Wir könnten Volleyball spielen. |
| RULE_CARDS.imperative-mood.commonMistakes[0].explanationDe | Nach solltest steht der Infinitiv am Ende. → Nach könnten steht der Infinitiv am Ende. |
| RULE_CARDS.modal-verbs-past.content | Mehrzahl: wir mussten, konnten, durften. Im Präteritum verlieren können, müssen und dürfen den Umlaut: **konnte**, **musste**, **durfte**. Dazu wollte; wir **wollten**. Der Infinitiv steht am Ende: Ich musste arbeiten. Nach Es tut mir leid steht oft dass. Hier kommt dass nach dem Hauptsatz, mit einem finiten Verb am Ende: **dass ich nicht da war**. Vergleichen Sie die Satzenden. → Mehrzahl: wir mussten, konnten, durften. Präteritum: können, müssen und dürfen verlieren den Umlaut: **konnte**, **musste**, **durfte**. Dazu wollte; wir **wollten**. Im Hauptsatz steht der Infinitiv am Ende: Ich musste arbeiten. Nach einer Entschuldigung steht oft dass. Hier kommt dass nach dem Hauptsatz, mit einem finiten Verb am Ende: **dass ich nicht da war**. Vergleichen Sie die Satzenden.<br>English: Past modals precede a final infinitive. Here, dass clauses follow the main clause and end in one finite verb. |
| RULE_CARDS.modal-verbs-past.commonMistakes[0].wrong | Ich weiß, dass er musste arbeiten. → Ich weiß, dass er ist krank. |
| RULE_CARDS.modal-verbs-past.commonMistakes[0].correct | Ich weiß, dass er arbeitet. → Ich weiß, dass er krank ist. |
| RULE_CARDS.modal-verbs-past.commonMistakes[0].explanationDe | Im geübten dass-Satz steht ein finites Verb am Ende. → Im dass-Satz steht das finite Verb am Ende. |
| RULE_CARDS.perfect-tense-haben.content | Perfekt: haben und Partizip am Ende. Regelmäßig ge-…-t: **gemacht**. Viele unregelmäßige Formen enden auf -en: **gegessen**, **gesprochen**. Ohne ge- bei be-, ver-, er- und -ieren: **besichtigt**, **fotografiert**. Trennbar: **mitgebracht**. Wenn nennt eine Bedingung. Hier folgt der Nebensatz dem Hauptsatz und endet mit einem finiten Verb: Sie kommen wieder, **wenn sie Urlaub haben**. → Hier Perfekt mit haben; im Hauptsatz steht das Partizip am Ende. Regelmäßig ge-…-t: **gemacht**. Viele unregelmäßige Formen enden auf -en: **gegessen**, gesprochen. Ohne ge- bei be-, ver-, er- und -ieren: **besichtigt**, **fotografiert**. Trennbar: **mitgebracht**. Hier folgt der Nebensatz dem Hauptsatz und endet mit einem finiten Verb: Sie kommen wieder, **wenn sie Urlaub haben**.<br>English: Review haben participles. Here, wenn introduces a condition after the main clause, ending in one finite verb. |
| RULE_CARDS.perfect-tense-haben.commonMistakes[0].explanationDe | Im nachgestellten wenn-Satz steht das finite Verb am Ende. → Im wenn-Satz steht das finite Verb am Ende. |
| RULE_CARDS.perfect-tense-sein.content | Auch bleiben: ist geblieben. Sein steht bei Bewegung und Zustandswechsel: Ich **bin** vom Fahrrad **gefallen**. Trennbare Verben: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil nennt einen Grund. Hier steht der Nebensatz nach dem Hauptsatz, mit einem finiten Verb am Ende: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Vergleichen Sie die beiden Verben. → Sein bei Ortswechsel/Zustandswechsel, auch bei bleiben: ist geblieben. Tätigkeit: haben bei tanzen, auch möglich bei schwimmen. Beispiel: Ich **bin** vom Fahrrad **gefallen**. Trennbare Verben: **aufgewacht**, **eingeschlafen**, **aufgestanden**. Weil nennt einen Grund. Hier steht der Nebensatz nach dem Hauptsatz, mit einem finiten Verb am Ende: Ich bin vom Fahrrad gefallen, **weil der Weg nass war**. Vergleichen Sie.<br>English: Sein: changes of place/state, bleiben. Haben: tanzen, also possible for swimming as an activity. Here weil ends in one finite verb. |
| RULE_CARDS.perfect-tense-sein.commonMistakes[0].wrong | Ich habe zum Arzt gefahren. → Ich habe aufgewacht. |
| RULE_CARDS.perfect-tense-sein.commonMistakes[0].correct | Ich bin zum Arzt gefahren. → Ich bin aufgewacht. |
| RULE_CARDS.perfect-tense-sein.commonMistakes[0].explanationDe | Fahren mit Ortswechsel bildet das Perfekt mit sein. → Aufwachen bildet das Perfekt mit sein. |
| RULE_CARDS.possessive-pronouns.content | Für wir steht **unser**, für ihr **euer**: **unsere Oma**, **eure Familie**. Dativ maskulin/neutrum: **meinem, deinem, seinem, ihrem, unserem, eurem**. Dativ feminin: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. Nach bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Namen bekommen -s: **Omas Garten**, Lenas Familie. Alternativ: das Kind **von deinem Bruder**. Vergleichen Sie. → Possessivformen (mein, dein): Für wir steht **unser**, für ihr **euer**: **unsere Oma**, **eure Familie**. Dativ maskulin/neutrum: **meinem, deinem, seinem, ihrem, unserem, eurem**. Dativ feminin: **meiner, deiner, seiner, ihrer, unserer, eurer**. Plural: **meinen, deinen, seinen, ihren, unseren, euren**. Nach bei/zu: **bei unseren Eltern**, **zu unserer Oma**. Namen ohne s-Laut am Ende bekommen -s: **Omas Garten**, Lenas Familie. Alternativ: das Kind **von deinem Bruder**. Vergleichen Sie.<br>English: Possessives follow gender, number and case; names without a final s-sound take -s for possession. |
| RULE_CARDS.prepositions-dative.content | Aus, bei, mit, nach, seit, von, zu und **gegenüber** brauchen Dativ: **gegenüber dem alten Rathaus**, **mit dem alten Bus**, **bei der kleinen Brücke**. Nach einem Artikel endet das Adjektiv im Dativ auf -en. Das gilt auch für Ordinalzahlen: ab dem dritten Mai. Vergleichen Sie die Kurzformen: zu dem → **zum**, von dem → vom. → Aus, bei, mit, nach, seit, von, zu und **gegenüber** brauchen Dativ: **gegenüber dem alten Rathaus**, **mit dem alten Bus**, **bei der kleinen Brücke**. Nach einem Artikel endet das Adjektiv im Dativ auf -en. Das gilt auch für Ordinalzahlen: ab dem dritten Mai. Vergleichen Sie die Kurzformen: zu dem → **zum**, von dem → vom.<br>English: These prepositions take dative; after an article, dative adjectives and ordinals end in -en. |
| RULE_CARDS.pronouns-accusative-dative.content | Bei zwei Nomen steht meist Dativ vor Akkusativ: Ich zeige der Kollegin den Drucker. Ein Akkusativpronomen steht vor dem Dativ: Ich erkläre **ihn Ihnen**. Ich schicke **sie Ihnen**. Sind beide Objekte Pronomen, gilt ebenfalls Akkusativ vor Dativ: **sie mir**, **ihn mir**. Er wird zu ihm: Ich kann sie ihm schicken. Ein Problem: Die Datei ist nicht da. → Bei zwei Nomen steht meist Dativ vor Akkusativ: Ich zeige der Kollegin den Drucker. Unbetont steht ein Akkusativpronomen normalerweise vor dem Dativ: Ich zeige **ihn Ihnen**. Ich schicke **sie Ihnen**. Auch bei zwei unbetonten Pronomen normalerweise Akkusativ vor Dativ: **sie mir**, **ihn mir**. Er wird zu ihm: Ich kann sie ihm schicken. Die Datei ist nicht da.<br>English: With two unstressed object pronouns, the accusative normally precedes the dative. |
| RULE_CARDS.pronouns-accusative-dative.commonMistakes[0].explanationDe | Der Empfänger steht im Dativ: ihm. → Schicken braucht hier den Dativ: ihm. |
| RULE_CARDS.separable-verbs.content | Bei trennbaren Verben steht ge- zwischen Vorsilbe und Verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. Das Partizip steht am Satzende: Ich habe mein Handy **mitgebracht**. Vergleichen Sie das Präsens: Jetzt packe ich ihn ein. Verben mit sein folgen in Lektion 8. → Bei trennbaren Verben hier steht ge- zwischen Vorsilbe und Verb: einpacken → **eingepackt**, aufräumen → **aufgeräumt**, anrufen → **angerufen**, abholen → **abgeholt**. Im Hauptsatz steht das Partizip am Ende: Ich habe mein Handy **mitgebracht**. Vergleichen Sie das Präsens: Jetzt packe ich ihn ein. Verben mit sein folgen in Lektion 8.<br>English: These separable verbs put ge- after the prefix and take haben; the participle ends the main clause. |
| RULE_CARDS.separable-verbs.commonMistakes[0].wrong | Ich habe die Bücher geeinpackt. → Ich habe das Handy geeinpackt. |
| RULE_CARDS.separable-verbs.commonMistakes[0].correct | Ich habe die Bücher eingepackt. → Ich habe das Handy eingepackt. |
| RULE_CARDS.temporal-prepositions.content | **In zwei Wochen**: Zeitpunkt nach heute, in + Dativ. **Für zehn Tage**: Dauer, für + Akkusativ. **Über das Wochenende**: das ganze Wochenende. **Ab Montag**: Anfang. **Bis eins**: Ende. **Zwischen zwei und drei Uhr**: Zeitfenster. Fragen Sie nach Zeitpunkt, Anfang, Ende und Dauer. Ordinalzahlen im Dativ folgen in Lektion 11. → **In zwei Wochen**: Zeitpunkt nach heute, in + Dativ. **Für zehn Tage**: Dauer, für + Akkusativ. **Über das Wochenende**: ein Aufenthalt am Wochenende, ohne genaue Uhrzeiten. **Ab Montag**: Anfang. **Bis eins**: Ende. **Zwischen zwei und drei Uhr**: Zeitfenster. Ordinalzahlen im Dativ folgen in Lektion 11.<br>English: In gives a future time; für gives duration; ab and bis mark the start and end. |
| RULE_CARDS.temporal-prepositions.commonMistakes[0].wrong | Ich bleibe seit drei Tage. → Ich bleibe für drei Tagen. |
| RULE_CARDS.temporal-prepositions.commonMistakes[0].explanationDe | Für nennt hier eine geplante Dauer. → Für nennt hier die Dauer und braucht den Akkusativ. |
| RULE_CARDS.two-way-prepositions.content | Fragen Sie wo: Dativ, **in der Ecke**, **auf dem Balkon**. Fragen Sie wohin: Akkusativ, **an die Wand**, **neben den Tisch**. Unterscheiden Sie stellen/stehen, legen/liegen, hängen/hängen und setzen/sitzen. Setzen braucht hier ein Objekt: das Kind auf den Stuhl setzen. Sitzen beschreibt den Ort. Keine neue Position: Das Bild **hängt über dem Tisch**. → Bei Wechselpräpositionen (in, an, auf, über, unter, vor, hinter, neben, zwischen) gilt: wo → Dativ, **in der Ecke**, **auf dem Balkon**. wohin → Akkusativ, **an die Wand**, **neben den Tisch**. Unterscheiden Sie stellen/stehen, legen/liegen, hängen/hängen und setzen/sitzen. Setzen braucht hier ein Objekt: das Kind auf den Stuhl setzen. Sitzen beschreibt den Ort. Keine neue Position: Das Bild **hängt über dem Tisch**.<br>English: With two-way prepositions, a location takes dative; a destination takes accusative. |

Changed text fields: 30.

### Added vocabulary input models

Every row is newly added, with a corresponding retrieval in a21.extra.json.

| Lesson / word | New German model | English twin |
| --- | --- | --- |
| 1 / der Alltag | Unser Alltag ist schön. | Our everyday life is pleasant. |
| 1 / die Freizeit | Meine Oma hat viel Freizeit. | My grandma has a lot of free time. |
| 1 / die Gewohnheit | Das ist eine Gewohnheit von meinem Opa. | That is a habit of my grandpa’s. |
| 1 / die Leidenschaft | Musik ist ihre Leidenschaft. | Music is her passion. |
| 1 / das Spiel | Das Spiel gehört meinem Bruder. | The game belongs to my brother. |
| 1 / das Klavier | Das Klavier steht bei unseren Eltern. | The piano is at our parents’ home. |
| 1 / die Gitarre | Die Gitarre gehört meiner Schwester. | The guitar belongs to my sister. |
| 1 / das Instrument | Welches Instrument spielt Ihre Oma? | Which instrument does your grandma play? |
| 1 / der Schwiegersohn | Unser Schwiegersohn ist der Mann von unserer Tochter. | Our son-in-law is our daughter’s husband. |
| 1 / das Vertrauen | In unserer Familie haben wir Vertrauen. | There is trust in our family. |
| 2 / der Hausmeister | Der Hausmeister hat den Schlüssel. | The caretaker has the key. |
| 2 / der Mieter | Der Mieter heißt Herr Sommer. | The tenant’s name is Mr Sommer. |
| 2 / der Mietvertrag | Der Mietvertrag ist in meiner Tasche. | The rental contract is in my bag. |
| 2 / die Kaution | Die Kaution kostet 1.000 Euro. | The deposit costs 1,000 euros. |
| 2 / die Nebenkosten | Die Nebenkosten bezahlen wir jeden Monat. | We pay the additional housing costs every month. |
| 2 / die Wohnungsanzeige | Die Wohnungsanzeige ist von unserem Vermieter. | The apartment advertisement is from our landlord. |
| 2 / die Besichtigung | Die Besichtigung ist am Samstag. | The viewing is on Saturday. |
| 2 / der Quadratmeter | Die Wohnung hat 50 Quadratmeter. | The apartment measures 50 square metres. |
| 2 / die Lieferung | Die Lieferung kommt am Samstag. | The delivery arrives on Saturday. |
| 2 / der Parkplatz | Der Parkplatz ist vor dem Haus. | The parking space is in front of the house. |
| 3 / die Heizung | Die Heizung ist unter dem Fenster. | The heating is below the window. |
| 3 / das Handtuch | Das Handtuch hängt an der Wand. | The towel hangs on the wall. |
| 3 / die Zahnbürste | Die Zahnbürste ist neben der Seife. | The toothbrush is beside the soap. |
| 3 / die Seife | Die Seife liegt neben der Zahnbürste. | The soap is beside the toothbrush. |
| 3 / die Zahnpasta | Die Zahnpasta ist neben der Zahnbürste. | The toothpaste is beside the toothbrush. |
| 3 / der Regenschirm | Der Regenschirm steht in der Ecke. | The umbrella stands in the corner. |
| 3 / der Bildschirm | Der Bildschirm steht auf dem Tisch. | The screen stands on the table. |
| 3 / die Maus | Die Maus liegt neben dem Computer. | The mouse is beside the computer. |
| 4 / die Ware | Die Ware ist frisch. | The goods are fresh. |
| 4 / das Sonderangebot | Das Sonderangebot gilt heute. | The special offer is valid today. |
| 4 / der Kassenbon | Der Kassenbon liegt neben der Kasse. | The receipt is beside the checkout. |
| 4 / der Einkaufswagen | Der Einkaufswagen steht vor dem Geschäft. | The shopping trolley is outside the shop. |
| 4 / die Tüte | Die Tüte kostet einen Euro. | The bag costs one euro. |
| 4 / die Kreditkarte | Die Kreditkarte ist in meiner Tasche. | The credit card is in my bag. |
| 4 / die Portion | Die Portion Salat kostet drei Euro. | The portion of salad costs three euros. |
| 4 / die Beilage | Die Beilage ist Reis. | The side dish is rice. |
| 4 / die Nachspeise | Obst ist unsere Nachspeise. | Fruit is our dessert. |
| 4 / die Marke | Welche Marke ist das? | Which brand is that? |
| 5 / das Picknick | Das Picknick für Omas Geburtstag ist im Garten. | The picnic for Grandma’s birthday is in the garden. |
| 5 / das Abendessen | Das Abendessen ist um sieben. | Dinner is at seven. |
| 5 / das Mittagessen | Das Mittagessen ist um zwölf. | Lunch is at twelve. |
| 5 / die Getränkekarte | Die Getränkekarte liegt auf dem Tisch. | The drinks menu is on the table. |
| 5 / die Vorspeise | Die Vorspeise ist ein Salat. | The starter is a salad. |
| 5 / das Hauptgericht | Das Hauptgericht kostet zwölf Euro. | The main course costs twelve euros. |
| 5 / das Tagesgericht | Das Tagesgericht ist heute Fisch mit Reis. | Today’s dish of the day is fish with rice. |
| 5 / die Speisekarte | Die Speisekarte liegt neben Omas Geschenk. | The menu is beside Grandma’s present. |
| 5 / die Bedienung | Die Bedienung bringt der Oma einen Kaffee. | The server brings Grandma a coffee. |
| 5 / das Trinkgeld | Das Trinkgeld ist für die Bedienung. | The tip is for the server. |
| 6 / die Reservierung | Die Reservierung ist für Freitag um acht. | The reservation is for Friday at eight. |
| 6 / das Internet | Das Internet funktioniert heute nicht. | The internet is not working today. |
| 6 / die E-Mail | Die E-Mail ist eine Einladung. | The email is an invitation. |
| 6 / die Webseite | Die Webseite zeigt die Uhrzeit der Veranstaltung. | The website shows the time of the event. |
| 6 / die App | Die App zeigt meine Termine. | The app shows my appointments. |
| 6 / der Akku | Der Akku ist im Handy. | The battery is in the phone. |
| 6 / das WLAN | Das WLAN funktioniert wieder. | The Wi-Fi is working again. |
| 6 / der Feierabend | Mein Feierabend ist heute um acht. | My working day ends at eight today. |
| 7 / der Anfänger | Der Anfänger braucht Hilfe beim Training. | The beginner needs help with training. |
| 7 / das Fitnessstudio | Das Fitnessstudio ist neben dem Bahnhof. | The gym is beside the station. |
| 7 / die Kondition | Meine Kondition ist gut. Ich laufe jeden Tag. | My fitness is good. I run every day. |
| 8 / der Hausarzt | Der Hausarzt hat heute Sprechstunde. | The family doctor has consulting hours today. |
| 8 / die Salbe | Die Salbe ist für mein Bein. | The ointment is for my leg. |
| 8 / die Krankmeldung | Die Krankmeldung ist für meinen Chef. | The sick note is for my boss. |
| 10 / die Unterkunft | Unsere Unterkunft ist ein Hotel in Bremen. | Our accommodation is a hotel in Bremen. |
| 10 / das Doppelzimmer | Das Doppelzimmer ist für meine Eltern. | The double room is for my parents. |
| 10 / das Einzelzimmer | Das Einzelzimmer ist für meinen Bruder. | The single room is for my brother. |
| 10 / die Rezeption | Die Rezeption ist ab sieben Uhr geöffnet. | Reception is open from seven o’clock. |
| 10 / das Visum | Das Visum ist in meinem Reisepass. | The visa is in my passport. |
| 10 / der Mietwagen | Der Mietwagen steht am Flughafen. | The rental car is at the airport. |
| 10 / die Fähre | Die Fähre fährt in einer Stunde ab. | The ferry leaves in an hour. |
| 11 / der Wegweiser | Der Wegweiser steht neben dem Rathaus. | The signpost is beside the town hall. |
| 11 / der Zebrastreifen | Der Zebrastreifen ist vor dem Museum. | The pedestrian crossing is in front of the museum. |
| 11 / die Kreuzung | Die Kreuzung ist hinter der Brücke. | The intersection is behind the bridge. |
| 11 / die Ampel | Die Ampel ist gegenüber dem Museum. | The traffic light is opposite the museum. |
| 12 / das Meer | Das Meer ist auf dem Foto blau. | The sea is blue in the photo. |
| 12 / der Strand | Der Strand auf dem Foto ist in Marokko. | The beach in the photo is in Morocco. |
| 12 / die Insel | Die Insel ist klein. Wir haben dort Urlaub gemacht. | The island is small. We had a holiday there. |
| 12 / der Berg | Der Berg ist auf dem Foto von meinem Vater. | The mountain is in my father’s photo. |
| 12 / der See | Der See liegt neben dem Wald. | The lake is beside the forest. |
| 12 / der Wald | Der Wald ist auf unseren Fotos. | The forest is in our photos. |
