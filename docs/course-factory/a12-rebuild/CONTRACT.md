# A1.2 rebuild — data contract (2026-09-13)

A **delta** on `docs/course-factory/a11-rebuild/CONTRACT.md`. Everything not named here is
unchanged: same field names, same nine Lektion steps, same nine engine rules, same persistence
tables, same acceptance gates. Read the A1.1 contract first; this file only says what A1.2 does
differently and what the integrator still has to do.

## 1. Files and owners

| Path | State | Notes |
|---|---|---|
| `src/data/curricula/a12.js` | **NEW, done** | exports `CURRICULUM_A12`, plus its own `FUNCTION_WORDS` / `DIALOG_NAMES` (A1.1's lists, extended — see §3) |
| `astro-site/src/data/curricula/a12.js` | **NEW, synced** | registered in `scripts/check-duplicates.mjs`; run `node scripts/sync-curricula.mjs` after every edit |
| `src/data/curricula/index.js` | updated | `CURRICULA = { 'a1.1': …, 'a1.2': CURRICULUM_A12 }` |
| `src/data/writingTasks.js` + `netlify/functions/_shared/writingTasks.mjs` | updated | twelve `a12-l01 … a12-l12` tasks, `course: 'a1.2'`, byte-identical pair |
| `src/data/lessonPools/a12.extra.json` | **NEW, `items: []`** | hand-written situational items — the integrator fills it, see §5 |
| `src/data/lessonPools/a12.json` | **MISSING** | `node scripts/build-lesson-pool.mjs a1.2` produces it; see §5 for what the builder needs first |
| `scripts/validate-curriculum.mjs` | generalised | per-level registry `LEVELS`; `node scripts/validate-curriculum.mjs a1.2` |
| `tests/curricula.test.mjs` | generalised | the structural rules now run for every level in `LEVELS` |

Not touched, and not to be touched by the curriculum author: `a11.js`, `a11.extra.json`,
`quality.js`, `build-lesson-pool.mjs`, the course standard, any REVIEW file.

## 2. What A1.2 is

`level: 'a1.2'`, `code: 'A1.2'`, `examKey: 'goethe_a1'`, `examName: 'Start Deutsch 1'`,
`testSlug: 'abschlusstest-a1-2'` (the slug `src/data/courses/index.js` already carries for this
level — A1.2 closes the same exam as A1.1, one half-level further on). `hoursTotal: 54`, derived
by the same formula. Four checkpoints `a1.2-cp1 … a1.2-cp4` after Lektion 3/6/9/12.

The twelve situations are the standard's A1.2 row (§2.2) in order; the twelve grammar slugs are
the A1.2 slugs of `grammar-content-cache.json` (`topic_order` 1–12, 287 exercises), each primary
in exactly one Lektion. The mapping and its reasoning are in the header of `a12.js`; the two
decisions worth repeating here:

* **Wegbeschreibung (L1) gets neither preposition slug.** `prepositions-accusative` and
  `dative-prepositions-intro` both presuppose a case A1.2 only teaches later (Akkusativ L3, Dativ
  L11), so putting either in L1 would be exactly the Vorgriff the four A1.1 DaF reviews kept
  finding. L1 teaches `basic-sentence-structure` (the Wegbeschreibung lives on inversion: „Dann
  gehen Sie links") and names `zum/zur/an der` as fixed expressions, pointing forward to L11.
* **Modalverben are used before they are taught.** They are in A1.2's `FUNCTION_WORDS` so a
  learner may meet „Ich möchte ein Ticket" in L9's Lektion and „Wo kann ich…?" earlier, without
  the validator treating them as untaught lexis. The rule itself arrives in L9 (Regeln).

## 3. Delta in the shape

Three things differ from the A1.1 module, all of them additive:

1. **`FUNCTION_WORDS` and `DIALOG_NAMES` are A1.1's, spread and extended.** The extension is the
   finite modal forms, `war/hatte/sei`, `gibt`, `durch`, a short list of connectors and
   Gradpartikeln (`danach`, `zuerst`, `dort`, `als`, `gleich`, `viel`, …) and the demonstratives.
   The list is closed and documented in the module.
2. **Cumulative vocabulary.** RULE 5 and RULE 11 seed A1.2's known set from the **whole A1.1
   Wortfeld union** plus A1.1's notice cards (`seedFrom: 'a1.1'` in the validator registry). An
   A1.2 dialogue may therefore use any A1.1 word, and `tests/curricula.test.mjs` additionally pins
   that **no A1.2 Wortfeld entry repeats an A1.1 one** — 0 repeats, so the running word counter on
   the syllabus page („+201 → 463") counts nothing twice.
3. **A per-level irregular-verb table** (`IRREGULAR_FORMS_A12` in the validator) for the stem
   changes and fixed forms A1.2's dialogues need (`nimmt`, `hilft`, `sieht`, `trägt`, `läuft`,
   `getrunken`, `regnet`, the declined ordinals …). It is kept per level rather than merged into
   the base table, because widening the base table would also widen what A1.1 accepts, and A1.1's
   four ratchet numbers are measurements.

## 4. The four ratchets, measured on this module

`node scripts/validate-curriculum.mjs a1.2`

| Rule | A1.2 | A1.1 | Offenders |
|---|---|---|---|
| RULE 10 — a taught word is also a used word | **0** | 19 | — |
| RULE 11 — hand-written items use only taught words | **0** | 9 | — (the file is empty; the ratchet must stay 0) |
| RULE 12 — every can-do is rehearsed in its own Lektion | **0** | 6 | — |
| RULE 13 — a speaking task without a mission | **3** | 4 | L4 (Hotel/Reklamation), L10 (Kleidung), L11 (Wetter) |

Three of the four start closed because A1.2 was authored against the rules, while A1.1's debt came
from a pool written years before the curriculum. **They may only ever be lowered.**

**RULE 13 is 1, not 3 — the original justification was wrong (DaF review #1, MAJOR "mission
mapping"; corrected 2026-09-13).** It read: „`speaking_missions` at level a1.2 carries twelve
published missions and none of them is about a hotel complaint, about clothes, or about the
weather." That is true of the **situations** and irrelevant: a mission does not have to be about
the Lektion's topic, it has to train the Lektion's structure. Measured against
`target_structures` instead, three of the three „missionless" Lektionen had a fitting mission
lying unused — L4 (`negation`) ↔ mission 6 „Eine Einladung absagen" (*negation with nicht,
kein/keine/keinen*), L10 (`prepositions-accusative`) ↔ mission 8 „Kaffee für das Team"
(*accusative prepositions für, ohne, um*), L12 (`perfekt-intro`, Fest und Lebensmittel) ↔ mission
10 „Sprechen Teil 2: Wortkarten, Thema Essen & Trinken". The same measurement moved three
mismatches: L2 ↔ 4 (numbers), L5 ↔ 11 (W-Fragen), L7 ↔ 9 (the one real *Sprechen Teil 1* task of
the level, which no Lektion used while L6 claimed the Teil). **Only L11 is left at `null`: no
A1.2 mission is about the weather, and that is the honest rest.** Mission 2 („Meine Familie") is
now the unused one. The registry ratchet in `scripts/validate-curriculum.mjs` may be lowered from
3 to 1 accordingly; `tests/curricula.test.mjs` already pins the list as `[11]`.
When the UI agent makes the prompt itself travel in `saveCourseContext`, this ratchet goes to 0.

Wortfeld: **201 entries, 197 with a `wordId` (98 %)**, 15–19 per Lektion, none twice. The four
without an id are words the `words` table does not carry (`die Anzeige`, `funktionieren`,
`der Müll`) plus the one meta entry (`die Zahlen 20–100`, a set rather than a word, exempt from
RULE 10 as in A1.1). Seed those three into `words` and fill the ids in.

## 5. What the pool builder needs before `build-lesson-pool.mjs a1.2`

Do **not** run the builder from the curriculum side; this section is the hand-over.

* **Rule-card overrides for the twelve A1.2 slugs.** `scripts/rule-card-overrides.mjs` carries the
  A1.1 slugs only. Each A1.2 Lektion's `notice` is the card the learner should get; the generated
  card from the cache is the one they will get without an override.
* **No alphabet supplement.** That step is A1.1-only (`ALPHABET_TOPIC`); A1.2 needs nothing like it.
* **`a12.extra.json` of hand-written situational items.** Measured with `quality.js`'s `filterPool`
  at `level: 'a1.2'` over `grammar-content-cache.json`, this is what the legacy bank can supply per
  Lektion on its **primary** slug, and across all the topics of its `practiceRule`:

| L | primary slug | raw | usable (primary) | typed | usable (all practice topics) | typed | `typedMin` |
|---|---|---|---|---|---|---|---|
| 1 | basic-sentence-structure | 25 | 19 | 10 | 19 | 10 | 3 |
| 2 | numbers-counting | 18 | 18 | 10 | 37 | 20 | 3 |
| 3 | accusative-intro | 25 | 19 | 9 | 19 | 9 | 4 |
| 4 | **negation** | 21 | **4** | 4 | 23 | 13 | 3 |
| 5 | question-words | 20 | 17 | 12 | 36 | 22 | 3 |
| 6 | stem-changing-verbs | 26 | 26 | 20 | 26 | 20 | 4 |
| 7 | nominative-case | 23 | 17 | 8 | 17 | 8 | 3 |
| 8 | imperative | 26 | 26 | 19 | 26 | 19 | 4 |
| 9 | modal-verbs-intro | 26 | 20 | 11 | 20 | 11 | 4 |
| 10 | prepositions-accusative | 25 | 20 | 10 | 39 | 19 | 3 |
| 11 | dative-prepositions-intro | 26 | 25 | 19 | 25 | 19 | 4 |
| 12 | perfekt-intro | 26 | 26 | 20 | 45 | 29 | 4 |

Every Lektion can fill its seven controlled items and its `typedMin` from the legacy bank **except
Lektion 4**: `negation` keeps 4 of 21 items, because 13 fail `NEGATION_WITHOUT_CUE` (the prompt
asks for `kein`/`nicht` with nothing in the German that calls for a negation — the very first
BLOCKER of DaF review #1, still unrepaired in the A1.2 bank). Four is exactly `PRIMARY_MIN`, so
L4 draws with no margin and repeats the same four items on every attempt. **Write at least six
hand-written `negation` items for `extra-a12-l04-*` before shipping L4.** The other slugs lose
items only to `english-answer` / `english-prompt` (6 in basic-sentence-structure, 6 in
modal-verbs-intro, 4 each in accusative-intro, nominative-case, prepositions-accusative, 3 in
question-words), `answer-in-prompt` (1–2) and one `article-cue-only-in-gloss`.

Item ids must read `extra-a12-lNN-XX` — that is how the validator assigns a hand-written item to
its Lektion — and every token in them must be a word A1.1 or an earlier A1.2 Lektion has taught
(RULE 11, ratchet 0).

## 6. Open questions for the owner / integrator

0. **NOT blocking any more — corrected 2026-09-13 (DaF review #1, closing section).** This entry
   used to say that registering `a1.2` in `src/data/curricula/index.js` flips the player over
   before the pool exists. It does not: `src/data/curricula/index.js` splits the registry, and
   **`CURRICULA` carries `a1.1` only**. A1.2 is a validated **draft** and reaches the validator and
   the test suites through `DRAFT_CURRICULA` / `ALL_CURRICULA` (`anyCurriculumFor('a1.2')`), while
   `curriculumFor('a1.2')` — the function `CourseHomePage`, `LessonPlayerPage`, `CheckpointPage`
   and `ReviewPage` branch on — still returns `null`. The player therefore keeps the legacy
   28-day program and cannot reach `import('../../data/lessonPools/a12.json')`.
   What is still true is the **promotion** rule: moving `a1.2` from `DRAFT_CURRICULA` into
   `CURRICULA` must land in the same change as `node scripts/build-lesson-pool.mjs a1.2`, the
   `POOL_LOADERS` entry in `CheckpointPage`, and a signed-off DaF review — or `/course/a1.2/l/1`
   throws on a missing module. The integrator owns that change.
1. **`COURSE_TASK_KEY_PREFIX` in `netlify/functions/evaluate-writing.mjs` is `'a11-'`.** The twelve
   `a12-l*` tasks therefore do NOT count against `COURSE_WRITING_FREE_LIFETIME` and are billed
   against the ordinary writing allowance instead. That may be intended (A1.1 is the free course,
   A1.2 is paid) or it may be an oversight. It is a one-line decision in a file this contract does
   not own. `tests/writing-course.test.mjs` pins the A1.1 half of it and is untouched.
2. **Grammar lessons on the Astro side are ungated at every level** (`CLAUDE.md`, and
   `docs/HANDOFF-2026-09-03.md` §11). A1.2 is a paid level; the syllabus page and the player have
   to agree with whatever that decision becomes.
3. **Three `words` rows to seed** (§4), so A1.2's Wortfeld reaches 100 % audio like A1.1's.
4. **Three missionless Lektionen** (§4). Either commission three A1.2 speaking missions
   (hotel complaint, clothes shopping, weather) or land the `saveCourseContext` change that makes
   the prompt travel.
5. **No DaF review yet.** A1.1 needed four rounds. This module was written against the rules the
   fourth review produced, and its ratchets start at 0 — but nobody has read the twelve dialogues
   as a teacher. Phase 8 of the standard applies.
