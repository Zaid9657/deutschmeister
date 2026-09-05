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
| A | Four new A1.1 grammar topics (Possessivartikel, trennbare Verben, Ja/Nein-Fragen, Uhrzeit/Datum), 26 exercises each, ≥16 typed; `topic_order` CHECK widened to 12; counts re-derived | PR open | #TBD-A |
| B | A1.1 share of the Wortliste (+114 words: Länder/Sprachen, Beruf, Formular, Getränke, Uhrzeit/Termine, formal Sie) + 51 fixes to live rows ("null" plurals, article-in-word, above-level examples) | reviewed, integrating | — |
| C | 8 A1.1 reading texts rewritten to ≤110 words with auto-checkable richtig/falsch items; 2 exam-format lessons (Anzeigen Teil 2, Schilder Teil 3); +60 listening questions + 18 number/time dictation items on the existing audio | in review | — |
| D | Abschlusstest A1.1 (SD1 format, half length) on the mock runner via a course-test registry; 28-day A1.1 plan page; "Du bist bereit" readiness screen | in review | — |

Every content piece passes an independent adversarial review (Opus) plus a delta re-review
of the fixes before integration; the A1.1 typed items are generated from JSON by
`scripts/grammar-topics-from-json.mjs` (deterministic UUID v5 ids, migration + cache patch
from one source).

## Measured baseline (do not re-derive)

- `weekly_metrics` is **empty** as of 2026-09-04 — the Monday 06:00 UTC job has not
  had its first run. Latest measured figures are the direct-SQL numbers in
  `docs/HANDOFF-2026-09-03.md` §2 (1,563 users, 4 real payers, ≈€45 MRR, 0 course sales).
- One-and-done rate after the A1.1 reorder (nouns-gender now lesson 1): watch the
  first weekly-truth email.

## Open questions / owner asks

- Audio (vocab, grammar examples, SD1 Hören): needs the owner's OpenAI-key run of
  `scripts/generate-example-audio.mjs` — requested, not blocking; Hören ships with
  transcript-mode fallback until audio lands.

## Decisions log

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
