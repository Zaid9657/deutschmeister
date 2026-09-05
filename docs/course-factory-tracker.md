# Course Factory — wave tracker

State ledger for the Course Factory orchestrator (`docs/course-factory-prompt.md`).
Updated in the same PR as the work, every wave. Ground truth for content quality:
`docs/course-research-2026-09-03.md` + `docs/research/`.

## Wave 1 — A1, "make €49 honest" (started 2026-09-04)

Sequence (research doc §5, steps 1–5; owner approved by invoking the factory prompt):

| # | Step | Status | PR |
|---|---|---|---|
| 1 | Fix wrong/contradictory A1 grammar (stem changes, es-pronoun garble, job-article contradiction, out-of-level exercise items) | merged (PR #63, DB migrated 2026-09-05) | #63 |
| 2 | A1 writing strand: 6 Formular + 6 Mitteilung on the AI-writing runner, Goethe criteria in rubric | merged (PR #64, constraints migrated) | #64 |
| 3 | Start Deutsch 1 mock on the mock runner + the 3 official free sets linked | merged (PR #65) | #65 |
| 4 | "30 Tage bis Start Deutsch 1" plan on the telc-B1-plan rails | merged (PR #66) | #66 |
| 5 | Sprechen Teil 1–3 missions (full self-intro, word cards, Bitten) | merged (PR #67, rows live: A1.2 missions 9–12) | #67 |

**Wave 1 status: COMPLETE (2026-09-05).** All five steps merged and live; every content
piece passed an independent adversarial German review before merge (two rounds where
needed). €49 A1 is now backed by: corrected grammar, a real writing strand with AI
grading on the SD1 criteria, an SD1 mock (Kurzversion) with the 60/100 rule, a 30-day
Prüfungsphase plan, and Sprechen Teil 1–3 missions.

## Wave 2 — A1.1 as a complete course (started 2026-09-05, prompt v2)

Prompt v2 re-scoped Wave 2 from "A1 complete" to **A1.1 as a complete, standalone course**
(A1.2 is Wave 3). Steps and their PRs:

| # | Step | Status | PR |
|---|---|---|---|
| A | Four new A1.1 grammar topics (Possessivartikel, trennbare Verben, Ja/Nein-Fragen, Uhrzeit/Datum), 26 exercises each, ≥16 typed; `topic_order` CHECK widened to 12; counts re-derived | merged, DB migrated 2026-09-05 (12 A1.1 topics live) | #68 |
| B | A1.1 share of the Wortliste (+114 words: Länder/Sprachen, Beruf, Formular, Getränke, Uhrzeit/Termine, formal Sie) + 51 fixes to live rows ("null" plurals, article-in-word, above-level examples) | merged, DB migrated 2026-09-05 (339 A1.1 words live) | #69 |
| C | 8 A1.1 reading texts rewritten to ≤110 words with auto-checkable richtig/falsch items; 2 exam-format lessons (Anzeigen Teil 2, Schilder Teil 3); +60 listening questions + 18 number/time dictation items on the existing audio | merged, DB migrated 2026-09-05 (10 A1.1 reading lessons with checks; 6×23 listening questions) | #70 |
| D | Abschlusstest A1.1 (SD1 format, half length) on the mock runner via a course-test registry; 28-day A1.1 plan page (`/a1-1-phase`); "Du bist bereit" readiness screen on the dashboard and the hub | merged, DB migrated 2026-09-05 (`exam_attempts` CHECK admits `a1_1_abschluss`) | #71 |

Every content piece passes an independent adversarial review (Opus) plus a delta re-review
of the fixes before integration; the A1.1 typed items are generated from JSON by
`scripts/grammar-topics-from-json.mjs` (deterministic UUID v5 ids, migration + cache patch
from one source).

**Wave 2 status: COMPLETE (2026-09-05).** All four steps merged and live, every migration
applied by hand and verified by SELECT (12 A1.1 topics byte-identical to the cache; 339
A1.1 words; 10 A1.1 reading lessons with checks; 6×13 new listening rows incl. 18 dictation;
the widened `exam_attempts` CHECK). A1.1 is now a standalone course: 12 grammar topics
with typed production, its Wortliste share in the SRS, exam-format reading, listening with
number dictation, a dated 28-day plan, and an Abschlusstest that ends in a readiness verdict.

Not done this wave (carried): typed-production upgrades for the eight pre-existing A1.1
grammar topics (only the four new ones ship ≥16 typed items); audio for the new grammar
examples, vocabulary and dictation prompts (`audio_url` is null on every new example row).

## Wave 3 — A1.2 as a complete course (started 2026-09-05)

Same shape as Wave 2, for A1.2: Imperativ (missing), the A1.2 share of the Wortliste plus
the article-in-word / "null"-plural fixes on the live A1.2 rows, the `numbers-counting`
upgrade (100–1000, prices, ordinals in general), A1.2 reading/listening depth, typed
production for the eight old A1.1 topics, and a re-cut of the 30-day SD1 plan so it starts
where the 28-day A1.1 plan ends. Gate: Monday's weekly-truth one-and-done rate for A1.1.

| # | Step | Status | PR |
|---|---|---|---|
| A | Four new A1.2 grammar topics (stem-changing-verbs, imperative, perfekt-intro, dative-prepositions-intro) at topic_order 9–12, 104 exercises total, ≥16 typed each; stem-changing precedes imperative by decision | merged, DB migrated 2026-09-05 (12 A1.2 topics live; 33 rules / 40 examples / 104 exercises verified byte-identical to the cache) | #74 |
| A2 | Typed production for the 16 pre-existing A1.1/A1.2 grammar topics (163 exercises: 79 A1.1 + 84 A1.2), plus the `numbers-counting` upgrade (100–1000, prices, ordinal numbers: +4 rules, +4 examples, topic_patch, one guarded rule content patch) via a new EXTEND mode in `scripts/grammar-topics-from-json.mjs` | merged, DB migrated 2026-09-05 (every A1 topic ≥8 typed; live totals 72 topics / 522 rules / 757 examples / 1045 exercises = cache and `marketing.js`) | #75 |
| B | A1.2 share of the Wortliste: 166 additions in 8 categories, 54 fixes incl. three repurposed rows and month plurals | merged, DB migrated 2026-09-05 (413 A1.2 words live, 2215 total) | #73 |
| C | 8 A1.2 reading texts rewritten to ≤120 words with 5 richtig/falsch + 1 exam-style choice check each; 2 exam-format lessons (Teil 1 E-Mails, Teil 2 Anzeigen) at order_index 9/10; +78 listening questions (13 per exercise) incl. 18 number/time/price/phone dictation items on the existing audio; 2 existing-row option edits | merged, DB migrated 2026-09-05 (10 A1.2 reading lessons, all with checks, 70 total; 6×23 A1.2 listening questions incl. 18 dictation) | #76 |
| D | Abschlusstest A1.2 (SD1 format, half length) on the mock runner; 28-day A1.2 plan page (`/a1-2-phase`, paid gate); runner `questionMax` filter so course-test Hören parts stay at 10 items now that exercises carry 23 questions | merged, DB migrated 2026-09-05 (`exam_attempts` CHECK lists `a1_2_abschluss`) | #77 |

**Wave 3 status: COMPLETE (2026-09-05).** All five steps merged and live, every migration
applied by hand via the Supabase connector and verified by SELECT: 12 A1.2 topics with the
four new ones byte-identical to the cache; 163 typed exercises on the 16 older A1 topics
(every A1 topic ≥8 typed; live totals 72 topics / 522 rules / 757 examples / 1045
exercises = `grammar-content-cache.json` = `marketing.js`); 413 A1.2 words (2215 total);
10 A1.2 reading lessons all with checks (70 total); 6×23 A1.2 listening questions incl. 18
dictation; the `exam_attempts` CHECK widened to `a1_2_abschluss`. A1.2 is now a standalone
paid course: 12 grammar topics with typed production, its Wortliste share in the SRS,
exam-format reading, listening with number/price/phone dictation, a dated 28-day plan at
`/a1-2-phase`, and an Abschlusstest A1.2 that hands off to the Start Deutsch 1 course. The
A1.1 plan and result screen now hand off to A1.2. Bug fixed on the way: course-test Hören
parts declare `questionMax` so they stay at 10 items after Wave 2/3 grew every exercise to
23 questions (the A1.1 test was silently presenting 23).

Not done this wave (carried): audio for the new A1.2 grammar examples, vocabulary and
dictation prompts (`audio_url` is null on every new example row; dictation reuses the
existing A1.2 audio); the older 16 topics keep their global exercise `order_index` while
the eight Wave 2/3 topics number per stage (the validator accepts both, nothing renders
differently); a full re-cut of the 30-day SD1 plan (only its week-2 intro was re-worded —
it still walks a12[0..7], not the four new A1.2 topics).

**Wave 4 (next): A2.1 as a complete course**, same shape — recon first (which A2.1 topics
are live and how deep), then A/A2/B/C/D. Gate: Monday's weekly-truth email (first run) — the
A1 one-and-done rate and whether any A1 course sold.

## Measured baseline (do not re-derive)

- `weekly_metrics` is **empty** as of 2026-09-04 — the Monday 06:00 UTC job has not
  had its first run. Latest measured figures are the direct-SQL numbers in
  `docs/HANDOFF-2026-09-03.md` §2 (1,563 users, 4 real payers, ≈€45 MRR, 0 course sales).
- One-and-done rate after the A1.1 reorder (nouns-gender now lesson 1): watch the
  first weekly-truth email.

## Open questions / owner asks

- Audio (vocab, grammar examples, SD1 Hören): needs the owner's Azure-Speech-key run (decision 2026-09-05, was OpenAI) of
  `scripts/generate-example-audio.mjs` — requested, not blocking; Hören ships with
  transcript-mode fallback until audio lands.
- Wave 2 added 40 grammar examples (four new A1.1 topics) and 114 words with no audio;
  the number-dictation items reuse the existing A1.1 listening audio, so they are not
  affected. Same owner run covers it.
- Wave 3 added 40 grammar examples (four new A1.2 topics), 4 numbers-counting examples and
  166 words with no audio; the A1.2 dictation items reuse the existing A1.2 listening audio.
  Same owner run (`scripts/generate-example-audio.mjs`) covers it.
- The Abschlusstest is free by decision (see log); if A1.1 is ever sold, the gate is one
  line in `src/data/courseTests/abschlusstestA11.js` (`gateLevel`).

## Decisions log

- 2026-09-05 (Wave 3): the Abschlusstest A1.2 is gated on `hasLevelAccess('a1.2')` — the
  paid gate, unlike the free A1.1 test — because it sits inside the sold A1 course; the
  `/a1-2-phase` plan page carries the same gate. The A1.1 result screen's secondary button
  now points at `/level/a1.2` (the 30-day SD1 plan is A1.2's exit, not A1.1's).
- 2026-09-05 (Wave 3): course-test listening parts declare `questionMax`; the runner selects
  `question_number <= questionMax` for rendering AND scoring through one pure helper
  (`src/data/courseTests/listeningQuestions.js`). New questions on an exercise must keep
  ascending `question_number` (they do: 11–23) or the cap picks the wrong ten.
- 2026-09-05 (Wave 3): the generator's EXTEND mode validates `rule_type` against the live
  CHECK (`ALLOWED_RULE_TYPES`) after 'list' rolled back a chunk of the #74 apply.

- 2026-09-05 (Wave 3): the four new A1.2 topics are appended at topic_order 9–12 in the
  order stem-changing-verbs, imperative, perfekt-intro, dative-prepositions-intro — the
  reviewer showed the du-imperative of e→i/ie verbs depends on the stem change, so
  Vokalwechsel precedes Imperativ; gefallen was dropped from the stem-changer list (it
  governs the dative, topic 12).
- 2026-09-05 (Wave 2): scope = A1.1 as a complete course per prompt v2; A1.2 follows in Wave 3.
- 2026-09-05: the four new A1.1 topics are APPENDED at topic_order 9–12 (no reorder of the
  existing eight — `currentPosition` and progress rows key on order); the A1.1 plan sequences
  them pedagogically instead. `grammar_topics_topic_order_check` widened 1..8 → 1..12.
- 2026-09-05: `time-and-dates` (A1.1) owns clock time, weekdays and the date (ordinals for
  dates only); `numbers-counting` (A1.2) keeps 100–1000, prices and ordinals in general —
  its upgrade is Wave 3 work.
- 2026-09-05: new vocabulary categories use the existing English Title Case convention
  ("Countries & Languages"), not German labels; plural stored in the bare form (majority).
  The duplicate bitte/danke rows at A1.1 stay (SRS cards may reference them); the same
  article-in-word / "null"-plural bugs exist at A1.2 and are Wave 3 work.
- 2026-09-05: the Abschlusstest A1.1 is ONE course test in the Start Deutsch 1 format at half
  length (Hören: A1.1 exercise 3 · Lesen: 8 items in Teil 1/2/3 style · Schreiben: Formular
  only), registered in a course-test registry outside `MOCK_EXAMS`, keyed `a1_1_abschluss`,
  gated by `hasLevelAccess('a1.1')` — i.e. FREE, like the rest of the free tier: the first
  instant verdict and the "Du bist bereit" moment are the funnel into A1.2. No sellable
  A1.1 asset is gated.
- 2026-09-05: the A1.1 plan is 28 days / ≈30 h (55–75 min per day, two Puffertage), titled
  "A1.1-Phase: 28 Tage bis zum Abschlusstest" — inside the guide's 60–80 h A1 budget and its
  45–60 min/day guidance.

- 2026-09-04: Wave 1 scope = research doc steps 1–5 exactly; no reorder.
- 2026-09-05: mock exams gate on Pro/trial OR the band's course (hasLevelAccess of the
  band's top sublevel) — the €49 course must include its band's mock.
