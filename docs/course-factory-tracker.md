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

## Wave 2 — A1 complete (next)

Per research doc §5 steps 6–9: missing grammar topics (possessives, separable verbs,
Ja/Nein-Fragen, imperative, Uhrzeit), Wortliste completion (+250 words, "null" plurals)
+ SRS wiring, reading rewrites (7 texts ≤120 words, Anzeigen/Schilder sets), listening
question depth, typed-production exercises. Audio remains owner-gated (below).

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

- 2026-09-04: Wave 1 scope = research doc steps 1–5 exactly; no reorder.
- 2026-09-05: mock exams gate on Pro/trial OR the band's course (hasLevelAccess of the
  band's top sublevel) — the €49 course must include its band's mock.
