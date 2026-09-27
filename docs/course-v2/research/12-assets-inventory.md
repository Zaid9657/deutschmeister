# 12 — Assets inventory: the raw material we own per level, and the engine that can play it

**Date:** 2026-09-26 (database figures from the orchestrator's snapshot of 2026-09-27)
**Scope:** Everything the new eight courses (A1.1 … B2.2) can take as **input**: database content, repo data modules
and the engine/infra that can already render, grade and schedule content. For each asset: how much we have per level,
how good it is, and how tightly it is tied to the old A1.1 course. This memo does not propose a unit design. The owner
has ruled that the old A1.1 course and `docs/course-standard-2026-09-12.md` are not the template
(`docs/course-v2/DECISIONS.md`, 2026-09-26). Everything below is a quarry to draw from, not a mould.

---

## Method

1. **Database.** Per the 2026-09-27 override, I made no MCP calls. Row counts, titles, word-table columns and
   business metrics come from `docs/course-v2/inputs/db-snapshot-2026-09-27.md` [SNAP]. Where the snapshot is silent
   (listening questions, reading `checks`, the defect state), I used the committed migrations and the migration
   ledger `migrations/README.md` [MIG], the Course Factory tracker `docs/course-factory-tracker.md` [TRK] and the
   seed note `migrations/2026-08-17-speaking-missions.md` [SM-SEED].
2. **Grammar bank.** I parsed `grammar-content-cache.json` [CACHE] with node: topics, rules, examples and exercises
   per `sub_level`, exercise type, typed share (`options` empty) and exercises per topic.
3. **Repo data.** I imported the ES modules under node and counted parts and items:
   `src/data/mockExams/*` [MOCK], `src/data/courseTests/*` [CT], `src/data/writingTasks.js` [WT],
   `src/data/programs/*` [PRG], `src/data/curricula/*` [CUR], `src/data/lessonPools/*` [POOL],
   `src/data/levelTestQuestions.json` [LT] and `content/reading/*.json` [RJSON].
4. **Engine.** I read the header and imports of every file under `src/lib/lesson/`, `src/lib/checkpoint/`,
   `src/components/lesson/` and `src/pages/lesson/`, plus `src/services/reviewService.js`, the AI functions and
   `scripts/generate-course-audio.mjs`. Then I grepped each for A1.1 identifiers (`a1.1`, `a11`, `A11`,
   `CURRICULUM_A11`). I ran `node scripts/generate-course-audio.mjs a1.1 --dry` to measure the audio plan.
5. **Web.** Two price checks: Azure Neural TTS [AZ] and OpenAI `gpt-4o-mini-transcribe` [OAI]. Exam-format
   comparisons come from the sibling memos 01–03, which carry their own primary URLs.

---

## Findings

### 1. Per-level content counts

**Table 1 — what exists per half-level** (DB = snapshot [SNAP]; grammar = [CACHE]; repo = files named above)

| | a1.1 | a1.2 | a2.1 | a2.2 | b1.1 | b1.2 | b2.1 | b2.2 |
|---|---|---|---|---|---|---|---|---|
| `words` rows (with audio) | 375 (339) | 413 (413) | 423 | 373 | 262 | 261 | 244 | 246 |
| grammar topics / rules | 12 / 81 | 12 / 102 | 12 / 112 | 12 / 107 | 12 / 108 | **8 / 57** | **8 / 54** | **8 / 51** |
| grammar examples | 118 | 143 | 151 | 142 | 145 | 85 | 78 | 71 |
| grammar exercises (typed, no options) | 262 (160) | 287 (163) | 300 (183) | 262 (166) | 269 (164) | **85 (0)** | **78 (0)** | **71 (0)** |
| exercises per topic | 15–26 | 18–26 | 20–28 | 18–26 | 18–26 | **8–15** | **8–15** | **8–15** |
| speaking missions | 12 | 12 | 8 | 8 | 8 | 8 | 8 | 8 |
| listening exercises (s per file) | 12, 6 without audio (228–410) | 6 (347–407) | 6 (309–540) | 6 (473–543) | 6 (494–664) | 6 (610–638) | 6 (677–727) | 6 (625–704) |
| listening questions per exercise | 23 incl. 3 dictation [MIG] | 23 [MIG] | 23 [MIG] | 23 [MIG] | 10, 0 dictation [TRK] | 10? | 10? | 10? |
| reading lessons (words) | 12 (77–219) | 10 (103–217) | 10 (130–144) | 10 (105–186) | 8 (356–402) | 8 (373–419) | 8 (434–469) | 10 (473–550) |
| reading auto-checks | yes [MIG] | yes | yes | yes | **0** [TRK] | none? | none? | none? |
| writing tasks in the AI-graded bank | 12 course + 12 exam (A1) | 12 course (A1) | 4 exam (A2, shared) | ← same | 3 (telc B1) | ← same | 1 (telc B2) | ← same |
| end-of-course test | Abschlusstest (8 + Hören) | Abschlusstest (8 + Hören) | Abschlusstest (10 + Hören) | Abschlusstest (10 + Hören) | — | — | — | — |
| mock exam covering the band | Goethe A1 (15 scorable) | ← | Goethe A2 (10) | ← | telc B1 (18), Goethe B1 (8), DTZ (8) | ← | telc B2 (18) | ← |
| curriculum module / lesson pool | live `a11.js`; pool 378 + 236 extra | draft `a12.js`; pool 263 + 116 extra | — | — | — | — | — | — |
| dated plan module | `a11Phase` (28 d) + SD1 30-day (band) | `a12Phase` + ← | `a21Phase` + Goethe A2 30-day (band) | `a22Phase` + ← | telc B1 4-week (band) | ← | — | — |

"?" means inferred, not measured. No B1.2–B2.2 listening or reading migration exists in [MIG], so these rows should
still have the pre-Course-Factory shape. [TRK] measured that shape at B1.1 on 2026-09-07. Totals: 2,597 words,
84 grammar topics (672 rules / 933 examples / 1,614 exercises), 72 speaking missions, 54 listening exercises,
76 reading lessons, 44 writing tasks, 6 mock sets, 4 course tests.

**Two generations of content.** The table splits cleanly in two.
- **A1.1–A2.2**, plus the B1.1 grammar, went through "Course Factory" waves 2–7 (2026-09-05 → 09-07). Those waves:
  - fixed defect rows in `words`;
  - rewrote reading lessons to exam length with Richtig/Falsch and exam-choice `checks`;
  - added 13 questions (3 of them dictation) to every listening exercise;
  - added typed-production grammar exercises;
  - built one Abschlusstest per half-level ([MIG] rows 34–58).
- **B1.2, B2.1 and B2.2** never got that pass, and neither did the B1.1 words, reading and listening. On 2026-09-08
  the owner stopped work and listed B1/B2 as coming soon ([TRK] Wave 7, rows B–D "parked").

### 2. Quality notes per asset class

**2.1 Words.** Memo 07 covers this in depth [07]. The short version:
- 98.6 % of rows have both audio and an example sentence.
- The A levels are over-supplied against the Goethe lists. B1 holds ≈523 new rows against ≈1,100 needed, and B2
  holds ≈490 against ≈1,600.
- Categories are topical and mix in grammar labels ("Modal Verbs", "Passive Voice Verbs", "Subjunctive") [SNAP].
- B1.1 carried **129 defect rows** (article in the headword, bad plurals) when measured on 2026-09-07 [TRK]. The
  fix PR was parked, so they are presumably still there.
- Reuse: the rows are keyed by lemma. Units name lemmas and the orchestrator matches ids ([SNAP] header). Each
  matched row brings its recorded audio (`words.audio_url`), which is the most valuable reusable asset per row.

**2.2 Grammar bank (`grammar_topics/rules/examples/exercises`).**
- **Count discrepancy:** the snapshot says the cache "holds all 76 grammar topics" [SNAP], but the cache has
  **84** (12 × 5 levels + 8 × 3). The Wave 7 B1.1 topics raised 80 → 84 [TRK]. The cache's `dumpedAt` still reads
  2026-08-24, yet it contains B1.1 topics migrated 2026-09-07: the generators wrote into it without re-stamping.
  So a field missing from the cache, such as `grammar_examples.audio_url` (0 of 933 set in the cache), tells us
  nothing about the live DB. `scripts/generate-example-audio.mjs` was built on 2026-09-05 to fill it.
- **B1.2–B2.2 are thin and closed-format:** 8 topics each, 8–15 exercises per topic, and **zero typed items**.
  Every exercise is `fill_blank` or `multiple_choice` with options, e.g. B1.2 „Kalt___ Kaffee schmeckt nicht.“
  `["er","es","e","en"]`. B2.2's topic list includes "Register und Stil" and "Wiederholung und Integration", which
  are course functions rather than grammar topics.
- **English-medium explanations everywhere.** Rules carry `paragraphs_en`, `analogy_en` ("verb prison"). B2.2 has
  meta-questions answered in English ("What does 'Er wird es vergessen haben' often mean?"). That is fine for a
  reference library, but a course that follows a "German content, English chrome" split will have to rewrite it.
- **Known defect classes.** Three DaF reviews measured them on the A1.1 bank: English respellings, English
  meta-answers, a verb given only in the English gloss (58 items), and `kein` expected with no negation cue. The
  filter now lives in `src/data/lessonPools/quality.js` [POOL]. It is the best existing statement of "an answer must
  follow from the German prompt", and it works on any level.
- **Reuse value:** rule tables and `common_mistakes` rules as reference cards, and example sentences
  (`word_breakdown` on all 933) for noticing. Drill items only after the quality filter. Sequencing is grammar-first
  and must not be inherited.

**2.3 Speaking missions (72).**
- Columns: `title_de/en`, `scenario_de/en`, `ai_role`, `ai_opening_line`, `hint_words`, `pass_criteria`,
  `system_prompt_extra`, `target_structures`, `grammar_topic_id`, `mission_order`, `is_free`; `level` is UPPERCASE
  by convention only [SM-SEED].
- A2.1–B2.2 are the bulk seed of 2026-08-17: 8 per level, **one per grammar topic, same position**
  ("each mission links via `grammar_topic_id` to the topic with the same position") [SM-SEED].
  - Their titles show the mapping: „Ein Paket verschicken (Dativobjekt)“, „Einen Vertrag kündigen (Genitiv)“
    [SNAP]. They are grammar drills dressed as situations, not can-do tasks.
  - They are unreviewed: [TRK] lists B1.1's 8 missions as "unreviewed".
- A1.2's 9–12 are the Start Deutsch 1 Sprechen Teil 1–3 missions (`2026-09-05-sd1-sprechen-missions.sql`), the only
  exam-part-shaped missions we own.
- The mechanism is fully reusable. `evaluate-speaking.mjs` folds a mission's `pass_criteria` into the Sonnet
  evaluation and records `passed`. The content mostly is not.

**2.4 Listening (54 exercises).**
- Each exercise is 10 short dialogues (`listening_dialogues`), with one combined MP3 per exercise and no audio per
  dialogue (A1 audit §3 [AUD]).
- A1.1–A2.2 now carry 23 questions each, 3 of them dictation [MIG]. B1.1 has 10 questions and no dictation [TRK];
  B1.2–B2.2 presumably the same.
- File lengths grow to 10–12 min at B2 [SNAP].
- Exam listening is built differently. Goethe B1 Hören has separate Teile with different text types (announcements,
  a talk, a discussion, a radio interview) [02], so a 10-dialogue bundle maps onto at most one Teil.
- **Reuse conflict:** 14 of the 54 exercises are consumed by the mocks and course tests, which load them by level and
  number [MOCK][CT]:
  - A1.1 #1 and #3; A1.2 #2 and #4;
  - A2.1 #4; A2.2 #1, #2 and #6;
  - B1.1 #1–4; B1.2 #1; B2.1 #1; B2.2 #1.
- Six A1.1 exercises exist as transcripts with audio pending [SNAP].
- **Reuse value:** the transcripts as scripts to cut down and re-render per line; the combined MP3s at A levels.

**2.5 Reading (76 lessons).**
- A1–A2 are good raw material. The 8 older lessons per level were rewritten to ≤120–150 words with 5 R/F + 1
  exam-choice `checks`, and each level gained 2 exam-format lessons (Anzeigen, Schilder, E-Mail, Zeitungstext,
  Informationstafel) [MIG].
- B-level lessons are **essays of 356–550 words** on Landeskunde topics („Die Energiewende“, „Philosophie des
  Geistes“) [SNAP]. They carry **open questions with model answers only**, so nothing can be auto-checked
  ([TRK] for B1.1; the local B JSON [RJSON] has no `checks` field).
- None of them uses an exam text type: blog post, reader comments, Hausordnung, Anzeigen [02][03].
- They also contain dated factual claims („fast 29 Millionen Menschen“ volunteer [RJSON]) that would need a source and
  a date stamp before a course re-uses them.

**2.6 Writing tasks (44 in the bank).**
- The breakdown [WT]:
  - `goethe_a1`: 12 exam tasks (6 Formular, 6 Mitteilung) and 24 course tasks (`a11-l01…l12`, `a12-l01…l12`);
  - `goethe_a2`: 4 (2 SMS, 2 E-Mail);
  - `telc_b1`: 3 (80–140 words);
  - `telc_b2`: 1 (120–200 words);
  - `goethe_b1` and `dtz`: none.
- **Only bank tasks can be AI-graded.** `evaluate-writing` looks the task up by `exam_key` + `task_key` and never
  grades a client prompt. The mock runner's writing parts are plain textareas and are not graded
  ("Schreiben und Sprechen sind hier nicht enthalten", `ModelltestResult.jsx`).
- For B1/B2 we have 4 gradable tasks in total.

**2.7 Mock exams (6) and course tests (4).**
- All are "Kurzversion" [MOCK][CT]:
  - telc B1 and telc B2: 18 scorable items each (5 matching, 3 MC, 10-gap Sprachbausteine cloze) plus 2 listening
    parts;
  - Goethe B1 and DTZ: 8 scorable items;
  - Goethe A1: 15;
  - Goethe A2: 10;
  - course tests: 8–10 objective items plus one capped listening part (`questionMax: 10`).
- Memo 02 already recommends replacing the Goethe B1 mock, because it does not follow the official module shape
  [02 §13].
- **Reuse value:** the runner and scorer are exam-agnostic. Part types are `listening`, `mc-group`, `matching`,
  `cloze` and `writing`, and `countScorableItems` / `examScoring.js` handle all of them generically. The honesty
  contract (`MOCK_DISCLAIMER_DE`, "Richtwert") is pinned by `tests/exams.test.mjs`. There is no B-level course test.

**2.8 Programs (7) and curricula (2).**
- The programs are sequencing modules only: arrays of `{type, title, minutes, href}` that deep-link into existing
  pages [PRG].
  - `a11Phase`…`a22Phase`: 28-day dated plans.
  - `startDeutsch1` and `goetheA2Kurs`: 30 days.
  - `telcB1Komplett`: 4 weeks.
  - They hold no teaching content and are bound to the legacy course player through `src/data/courses/index.js`.
- `a11.js` (live) and `a12.js` (draft) each hold 12 Lektionen with 120 dialogue lines (4,608 / 5,394 characters),
  24 Hören lines, 24 read-aloud lines, 263 / 201 Wortfeld entries linked to `words.id`, 49 / 48 can-do lines and
  180 in-app minutes. The module claims `hoursTotal: 54` [CUR].
- The lesson pools add hand-authored situational items: 236 extra items for A1.1 and 116 for A1.2 [POOL].
- The owner rejected these as a template. As **input** they still hold usable sentences, and they record what 23
  adversarial reviews found wrong.

**2.9 Placement.** `levelTestQuestions.json` has 80 items: 71 grammar, 5 vocabulary, 4 reading, 20 per CEFR level
(A1/A2/B1/B2) [LT]. It places by band, not by half-level. The speaking placement (`evaluate-speaking.mjs`, placement
mode) does return a `determined_sublevel`.

**2.10 Usage reality.**
- The latest `weekly_metrics` row (2026-09-21) records AI usage over 7 days [SNAP]:
  - **writing 0, speaking 10**, X-Ray 1,635.
- Course sales are 2 all-time, both €0 orders.
- The grading infrastructure exists, but learners have barely used it. That says we lack demand evidence, not that
  the feature is bad.

### 3. Engine and infra: what each piece does and how A1.1-coupled it is

Coupling scale: **none** (level-agnostic), **soft** (defaults or comments mention A1.1; works for any registered
level), **hard** (imports A1.1 data or a per-level table only A1.1/A1.2 fill).

| Piece | What it does (1–2 lines) | Coupling |
|---|---|---|
| `src/lib/lesson/check.js` | The answer checker for every item. Separator-folding for spelling, case-only miss = TYPO except when `caseSensitive`, articles and endings are never typos. | none (comments cite A1.1 ids) |
| `src/lib/lesson/buildLesson.js` (1,189 lines) | Pure builder: curriculum Lektion + pool → ordered stages. Seeded PRNG draw of 7 practice items, excludes items drawn on earlier attempts. | soft: `level` defaults to `'a1.1'`; stage list is the old 9-stage standard's shape |
| `mastery.js`, `requeue.js` | First-attempt accuracy with gold ≥ 80 %. A missed item returns as a different item of the same topic, capped at 4. | none |
| `readaloud.js` (+ server twin) | Word-by-word alignment of the target line against the STT transcript; labelled *Verständlichkeit*, never pronunciation. | none |
| `speech.js` | Plays recorded course audio from a manifest, falls back to browser `speechSynthesis`. | **hard**: `MANIFESTS = { 'a1.1': a11Audio }` |
| `gloss.js`, `strings.js`, `countries.js` | Tap-word gloss from the registry, English/German chrome string table, one world list. | none / soft |
| `writing.js` (1,226 lines) | Mechanical fallback when AI grading is unavailable: fields filled, word range, Leitpunkte touched, opening/closing present. | **hard in substance**: its heuristics are A1 Formular/Mitteilung |
| `src/lib/checkpoint/buildCheckpoint.js` (2,353 lines) | Builds 20-item checkpoints (5 Hören, 4 Lesen, 6 Bausteine, 3 Schreiben, 2 Sprechen) from curriculum + pool, 70/30 own/earlier chapters. | **hard**: 27 A1.1 references, many measured A1.1-specific ceilings |
| `checkpoint/lexis.js` | Known-word set per level, so items never use untaught words. | **hard**: `LEXIS_LEVELS` has only a1.1/a1.2 and imports `CURRICULUM_A11`; returns null (no filtering) for other levels |
| `reviewGrading.js`, `src/lib/review/ladder.js` | Typed review grading identical to the lesson's; fixed ladder of 1/4/7/14/60/180 days. | none |
| `src/services/reviewService.js` | `review_cards` access for word, pattern and sentence cards, seeded automatically by the lesson engine. | none (keys are generic) |
| `lessonService.js`, `checkpointService.js` | Fail-soft persistence to `lesson_attempts`, RLS-scoped; `programKeyFor('b2.1')` → `b21_course`. | none |
| `src/components/lesson/*` (24 files) | Stage and item renderers: Dialog, Wortfeld, Notice, Phonetik, Pretest, Practice, Dictation, Match, WordOrder, ListenSelect, Speaking, Writing, GradedWriting, Recap, ReviewCard … | mostly none. **Hard:** `IntroStage` (only `A11_META`), `WortfeldStage` (imports `CURRICULUM_A11` + A1.1 icons). **Limited:** `WritingStage` (Formular or Mitteilung only), `SpeakingStage` (open speaking leaves the lesson for `/speaking`) |
| `src/pages/lesson/*` | Player, checkpoint, review and dev preview routes. | **hard**: pool loaders hard-code `'a1.1'`/`'a1.2'`; `CheckpointPage` imports A1.1 `LANDESKUNDE`; preview uses the A1.1 pool |
| `src/data/curricula/index.js` | Registry with a LIVE vs DRAFT split and `curriculumPath()`. | none; the pattern is reusable |
| `scripts/validate-curriculum.mjs` (3,391 lines) | Content QA: lexis-known rule, can-do rehearsal, persona facts, deferred constructions, ratchets. | **hard**: A1.1 personas and ratchet numbers; the generic rules are the valuable part |
| `scripts/build-lesson-pool.mjs` + `quality.js` | Cache → per-level pool with quality filter, verb-cue repair and generated rule cards for `explain-answer`. | soft (level argument); the alphabet supplement is A1.1-only |
| `netlify/functions/evaluate-writing.mjs` | Sonnet 4.6 scores a bank task on 4 criteria × 0–5 (20 points, "Richtwert"), returns `leitpunkt_check` and ≤6 corrections, stores via the service role. | soft: `LEVEL_OF_PREFIX` already maps all 8 course prefixes. Simple-German feedback only for `goethe_a1` |
| `score-readaloud.mjs` | STT-only word recognition, 60 clips per user per day, any signed-in user. | none |
| `speaking-session` / `speaking-turn` / `evaluate-speaking` (+ `_shared/speakingAI.mjs`) | Live AI conversation: OpenAI STT → Haiku teacher → OpenAI TTS, then Sonnet evaluation with optional mission `pass_criteria`. Accepts all 8 levels and a client `courseTask` (prompt, Teil, hint words, Anrede). | none on level; **pricing/entitlement mismatch** (§4) |
| `explain-answer.mjs` | "Erklär mir das", grounded in rule cards generated from the cache. | none; needs rule cards for new content |
| `scripts/generate-course-audio.mjs` | Azure Neural TTS per line (Katja/Conrad, −10 %) → Storage → committed `<level>.audio.js` manifest, idempotent by sha1. | **hard**: `SPEAKER_VOICES` is the A1.1 cast; reads the curriculum shape |
| `generate-example-audio.mjs`, `words-/reading-/listening-questions-/grammar-topics-from-json.mjs` | Content pipelines: JSON → guarded, idempotent SQL for the owner to apply; audio for `words` and examples. | soft (level from input) |
| Modelltest runner + `examScoring.js` | Runs any mock or course-test data set. | none; writing parts ungraded |
| `src/data/courses/index.js` + `CourseHomePage`/`CourseLessonPage` | The legacy 28-day player over `programs/*`. | per-level table |

Tests: **34 of 79** files in `tests/` reference A1.1 identifiers. Much of the safety net pins A1.1 facts and has to be
re-pointed rather than simply extended.

### 4. Two infrastructure gaps the moat depends on

1. **The server has no concept of a course purchase.**
   - `getTier()` (`_shared/speakingUsage.mjs`) reads only `subscription_tier`, `is_subscribed` and `trial_ends_at`.
     Grepping the AI functions for `purchase` finds nothing.
   - **Writing:** the course allowance (tasks + 4 checkpoints, lifetime) is granted to *any* `free_trial` or
     `free_expired` user on any course task key of a level that has bank tasks. Today that is a1.1 and a1.2, and
     A1.2 is a paid level. A buyer is not distinguished from a non-buyer. Exam tasks return `subscription_required`
     to anyone outside a trial or subscription.
   - **Speaking:** a non-subscriber whose trial is over pays from a wallet: 5/10/15 min = 100/200/300 cents
     (`speaking-session.mjs`).
   - Result: a €50–65 course buyer has no server-side entitlement to the AI grading the course would advertise.
2. **Open speaking is not inside the lesson.** `SpeakingStage` saves a context and navigates to `/speaking`. Only
   read-aloud is scored in place.

Cost is not the constraint. The dry run of the whole A1.1 course audio is **168 clips, 5,158 characters ≈ US$0.08**
at the $16 per 1M characters the script assumes. Third-party pricing pages confirm the $16 rate [AZ]. STT for
read-aloud runs on `gpt-4o-mini-transcribe`, listed at about $0.003/min [OAI]. Per-call cost of the Sonnet grading
was not measured (see Open questions).

### 5. The list: reusable / must be generalised / replace

**Reusable as is**
- the checker (`check.js`), `mastery.js`, `requeue.js`, the review ladder, `reviewService`/`reviewGrading` and the
  SM-2 vocabulary deck;
- `readaloud.js` + `score-readaloud`, `explain-answer` + rule cards, lesson persistence;
- chrome i18n and the item components (§3 row);
- the Modelltest runner/scorer, the honesty contract, the JSON→SQL pipelines, `generate-example-audio.mjs`;
- the live/draft registry pattern, `quality.js`, and the `words` rows with audio.

**Must be generalised before a second level can use it**
- per-level registries instead of A1.1 literals: `speech.js` manifests, the pool loaders, the meta modules
  (`IntroStage`, `WortfeldStage`, `CheckpointPage`), the `lexis.js` tables, and the TTS cast in
  `generate-course-audio.mjs`;
- writing beyond A1: `writing.js`, `WritingStage` and the `evaluate-writing` feedback-language line;
- **purchase-aware entitlement in `evaluate-writing` and `speaking-session`**, and in-lesson open speaking;
- `validate-curriculum.mjs` and `buildCheckpoint.js`: keep the generic rules, drop the A1.1 ratchets and ceilings;
- `buildLesson.js`, whose stage list must follow the new unit anatomy;
- mock writing parts (wire them to the bank) and the 34 A1.1-pinned tests.

**Replace (content or structure, not engine)**
- the A2.1–B2.2 missions as content;
- B-level reading lessons and listening bundles (keep the transcripts);
- the B1.2–B2.2 exercise sets;
- `programs/*` + `courses/index.js`, once each new course ships;
- the Kurzversion Goethe B1 mock [02].

---

## Implications for the course blueprint

1. **Treat the DB as a quarry ranked by trust.** The A1.1–A2.2 words, grammar, reading and listening, plus the
   B1.1 grammar, have passed at least one structured review, so pull from them. The A2 missions are not in that set.
   Assume everything else at B1/B2 needs re-authoring: B1.1 words, reading, listening and missions, and all of
   B1.2–B2.2. Each unit spec should say for every asset whether it is *reused*,
   *adapted* or *new*.
2. **Authors write lemmas; the orchestrator matches ids.** Every reused word brings recorded audio for free. New B
   words go into a JSON batch for `words-from-json.mjs` and are recorded in one owner Azure run per level [07].
3. **Listening: re-cut the transcripts, do not reuse the bundles above A2.**
   - Re-render per line with the course voices, at exam-shaped lengths per Teil.
   - Keep the 14 exercises that mocks and course tests consume (§2.4) untouched, or re-point those consumers in the
     same PR.
4. **Reading: reuse the A1–A2 lessons that have `checks` and the exam-format lessons.** Every B-level unit needs new
   texts in exam text types with auto-checkable items. Any factual claim carried over needs a source and a date.
5. **Speaking: keep the mission machinery, re-author the missions per can-do.**
   - Reuse `pass_criteria`, `hint_words`, the opening line and the evaluator.
   - The `courseTask` path lets a course define tasks without new DB rows. The 8-per-level grammar-positioned
     missions should not set the unit sequence.
6. **Every writing task a unit asks for must live in the writing bank** under `<course>-lNN` (all 8 prefixes are
   already mapped). The blueprint needs one register/text-type list per level and a per-level feedback-language rule.
   Today only 4 B-level tasks are gradable.
7. **Entitlement is a build prerequisite, not polish.** Before any page promises AI grading to a buyer, the functions
   need a server-side `hasLevelAccess` equivalent that reads `purchases`. A course allowance should also be granted to
   buyers of *that* level, not to every non-subscriber.
8. **Design the unit anatomy freely, but express it as data the reusable pieces already consume:** items with
   `accepted`/`caseSensitive`, review card keys, read-aloud lines, bank task keys. Then the checker, mastery, requeue,
   review ladder and read-aloud scoring carry over without a rewrite, and only the §5 "generalise" list is
   engineering work.
9. **Budget audio by owner time, not money.** The whole A1.1 course script cost ≈ $0.08 to render, so ten times the
   text per level is still under a dollar. The real cost is the owner's local run with secrets. Plan one batched run
   per level, with a per-character voice table in the course data.
10. **Reuse the validator's generic rules as the QA gate for all eight courses:** known-word lexis, can-do
    rehearsal, "the answer follows from the German prompt", deferred constructions. Do not reuse its A1.1 ratchet
    numbers. A second-level lexis table is the cheapest way to stop items using untaught words.
11. **Each course needs its own end test on the existing runner.** No B-level course test exists. The telc mocks
    already prove `cloze` Sprachbausteine works. Wire mock writing parts to `evaluate-writing` so the end tests can
    grade writing.
12. **Placement per half-level is missing.** The band test (80 items, 89 % grammar) cannot route a buyer into
    B1.2 vs B1.1. Either extend it or give each course an entry check; the speaking placement's
    `determined_sublevel` is a possible second signal.
13. **Instrument the moat.** Seven-day AI writing usage is 0. The blueprint should say where grading is surfaced in
    the unit flow and what event proves it was used, so the weekly truth can show whether the moat is real.

---

## Open questions

1. What do the live DB rows show for B1.2–B2.2: `listening_questions` per exercise, `reading_lessons.checks`, and
   `words` defects? One read-only SQL by the orchestrator would settle the "?" cells in Table 1.
2. How many `grammar_examples` have `audio_url` in the live DB since the 2026-09-05 Azure run? The cache cannot tell.
3. Do the six pending A1.1 listening exercises have reviewed transcripts in `listening_dialogues`, or only titles?
4. What does one `evaluate-writing` or one 5-minute speaking session cost (Sonnet/Haiku tokens + STT/TTS)? This
   decides whether "unlimited AI grading" can be bundled into a €40–65 one-time price.
5. Should course buyers get speaking sessions from a per-course allowance, or keep the wallet? This is a
   product/pricing decision for the owner.
6. Will the mocks be rebuilt to full format (memo 02 §13)? If so, the listening-exercise conflict in implication 3
   disappears.
7. Should the snapshot's "76 grammar topics" be corrected to 84, and the cache's `dumpedAt` refreshed?

## Unverified

- B1.2, B2.1 and B2.2 listening (10 questions, 0 dictation) and reading (0 `checks`): inferred from the absence of
  any migration for those levels in [MIG] and from the B1.1 measurement in [TRK]. Not queried live.
- Whether the `words` defect classes found at B1.1 (129 rows) exist at B1.2–B2.2 in similar proportion.
- The `hoursTotal: 54` in `a11.js` is the module's own claim; I did not verify it against learner data.
- Azure's $16 per 1M characters comes from a third-party summary [AZ]. Microsoft's own pricing page appeared in
  search results but was not fetched. The OpenAI per-minute estimate [OAI] is likewise from search results.

---

## Sources

- [SNAP] `docs/course-v2/inputs/db-snapshot-2026-09-27.md` (orchestrator's read-only DB snapshot, 2026-09-27).
- [CACHE] `grammar-content-cache.json` (84 topics / 672 rules / 933 examples / 1,614 exercises; `dumpedAt`
  2026-08-24), parsed 2026-09-26.
- [MIG] `migrations/README.md` rows 34–58 and `migrations/2026-09-0{5,6}-*-listening.sql`, `*-reading.sql`.
- [TRK] `docs/course-factory-tracker.md`, "Wave 7 — B1.1 as a complete course half".
- [SM-SEED] `migrations/2026-08-17-speaking-missions.md`.
- [AUD] `docs/research/audit-a1-content-2026-09-03.md` §2–§5.
- [MOCK] `src/data/mockExams/*.js`; [CT] `src/data/courseTests/*.js`; [WT] `src/data/writingTasks.js`;
  [PRG] `src/data/programs/*.js`, `src/data/courses/index.js`; [CUR] `src/data/curricula/*.js`;
  [POOL] `src/data/lessonPools/*.json`, `quality.js`; [LT] `src/data/levelTestQuestions.json`;
  [RJSON] `content/reading/*.json`.
- Engine: `src/lib/lesson/*`, `src/lib/checkpoint/*`, `src/lib/review/ladder.js`, `src/components/lesson/*`,
  `src/pages/lesson/*`, `src/services/{reviewService,lessonService,checkpointService}.js`,
  `netlify/functions/{evaluate-writing,score-readaloud,speaking-session,speaking-turn,evaluate-speaking,explain-answer}.mjs`,
  `netlify/functions/_shared/{speakingAI,speakingUsage}.mjs`, `scripts/generate-course-audio.mjs` (dry run
  2026-09-26), `scripts/validate-curriculum.mjs`, `src/pages/Modelltest/ModelltestResult.jsx`.
- [07] `docs/course-v2/research/07-vocabulary.md` §4. [02] `docs/course-v2/research/02-exams-b1.md` (Goethe B1
  format per https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf; §13 mock recommendation).
  [03] `docs/course-v2/research/03-exams-b2.md`.
- [AZ] Azure TTS pricing: https://texttolab.com/blog/azure-text-to-speech-pricing (states $16/1M for prebuilt
  Neural voices, 500K free per month); Microsoft page:
  https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ (not fetched).
- [OAI] https://platform.openai.com/docs/models/gpt-4o-mini-transcribe ; https://costgoat.com/pricing/openai-transcription
  (≈ $0.003/min, from search results).
