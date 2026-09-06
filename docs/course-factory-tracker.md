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
grammar topics (only the four new ones ship ≥16 typed items) — closed by Wave 3 PR A2 (#75);
audio for the new grammar examples and words — closed 2026-09-05 (see owner asks).

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

Not done this wave (carried): the older 16 topics keep their global exercise `order_index` while
the eight Wave 2/3 topics number per stage (the validator accepts both, nothing renders
differently); a full re-cut of the 30-day SD1 plan (only its week-2 intro was re-worded —
it still walks a12[0..7], not the four new A1.2 topics).

## Wave 4 — A2.1 as a complete course (started 2026-09-05)

Same shape as Wave 3, for A2.1 (the first sublevel of the €49 A2 course): four new grammar
topics closing the Goethe-Zertifikat A2 gaps (adjective endings after der/ein, Akkusativ/Dativ
object pronouns, Präteritum of the modal verbs, temporal prepositions), typed production for
the eight live A2.1 topics plus a depth patch for the three thin ones (possessive-pronouns,
perfect-tense-haben, imperative-mood: 4–5 rules and 8 exercises each today), the A2.1 share of
the Wortliste plus the article-in-word / null-plural fixes on the live A2.1 rows, A2.1 reading
rewritten inside the level (the live texts run 226–327 words with weil/dass/relative clauses),
listening depth with dictation, and — new this wave — a Goethe-Zertifikat A2 exam identity
(`goethe_a2` track, Leitfaden, hub, writing tasks) so the Abschlusstest A2.1 has a real
`formatOf`, then the test and the 28-day plan at `/a2-1-phase`.

| # | Step | Status | PR |
|---|---|---|---|
| A | Four new A2.1 grammar topics (adjective-endings-intro, pronouns-accusative-dative, modal-verbs-past, temporal-prepositions) at topic_order 9–12, 26 exercises each, 20–23 typed | merged, DB migrated 2026-09-06 (12 A2.1 topics live; 36 rules / 40 examples / 104 exercises verified byte-identical to the cache) | #82 |
| A2 | Typed production for the 8 live A2.1 topics (12–13 typed each) + depth patch (+3 rules, +4 examples) for possessive-pronouns, perfect-tense-haben, imperative-mood | merged, DB migrated 2026-09-06 (97 exercises / 9 rules / 12 examples verified byte-identical to the cache; every A2.1 topic now ≥20 exercises) | #83 |
| B | A2.1 share of the Wortliste (175 words, 8 new categories) + 208 fixes to the live A2.1 rows (117 article-in-word, 35 article-in-plural, 5 null plurals, 34 above-level sentences) | merged, DB migrated 2026-09-06 (423 A2.1 words, additions md5-identical to the source, 0 defects of any class at a2.1, 2390 total) — the 175 new rows await the owner's Azure audio run | #84 |
| C | 8 A2.1 reading texts rewritten to ≤150 words inside the level with 5 rf + 1 a/b/c choice check; 2 exam-format lessons (Lesen Teil 1 Zeitungstext, Teil 3 E-Mail, 5 a/b/c checks each) at order 9/10; +78 listening questions incl. 18 dictation; ReadingChecks heading follows the item type | merged, DB migrated 2026-09-06 (72 lessons; 10 A2.1 lessons all with checks 6/6/6/6/6/6/6/6/5/5, max 144 words; 6×23 A2.1 listening questions incl. 18 dictation; option fix live) | #85 |
| D1 | `goethe_a2` exam track (no mock yet) + Leitfaden `/leitfaden/goethe-a2/` + hub `/pruefung/goethe-a2/` + 4 Goethe-A2 writing tasks + CHECK widening on profiles/writing_submissions | merged, DB migrated 2026-09-06 (`profiles_exam_track_check` + `writing_submissions_exam_key_check` list `goethe_a2`; `/leitfaden/goethe-a2/` and `/pruefung/goethe-a2/` live; 4 writing tasks) | #87 |
| D2 | Abschlusstest A2.1 (Goethe A2 format, half length, `questionMax` 10, paid gate) + 28-day A2.1 plan (`/a2-1-phase`) + hand-offs (A2.1 result → `/level/a2.2`) | merged, DB migrated 2026-09-06 (`exam_attempts_exam_key_check` lists all nine keys incl. `goethe_a2` and `a2_1_abschluss`) | #88 |

**Wave 4 status: COMPLETE (2026-09-06).** All six steps merged and live, every migration applied via
the Supabase connector and verified by SELECT: 12 A2.1 topics (the four new ones 36 rules / 40
examples / 104 exercises byte-identical to the cache) plus typed production on the eight older ones
(every A2.1 topic ≥20 exercises; live totals 76 topics / 567 rules / 809 examples / 1246 exercises =
cache = `marketing.js`); 423 A2.1 words (2390 total, 0 defects at a2.1); 10 A2.1 reading lessons all
with checks (72 total, max 144 words); 6×23 A2.1 listening questions incl. 18 dictation; the
`goethe_a2` exam identity (`/leitfaden/goethe-a2/`, `/pruefung/goethe-a2/`, 4 writing tasks, the
`profiles` + `writing_submissions` CHECKs widened); the Abschlusstest A2.1 (Goethe-A2 format,
Kurzversion, `a2_1_abschluss` admitted by the `exam_attempts` CHECK) and the 28-day plan at
`/a2-1-phase`. A2.1 is now a standalone paid course: 12 grammar topics with typed production, its
Wortliste share in the SRS, exam-format reading, listening with dictation, a Goethe-A2 Leitfaden and
writing bank, a dated 28-day plan, and an Abschlusstest that hands off to A2.2.

Not done this wave (carried): speaking missions for the four new A2.1 topics (the plan drills them
through the lessons' exercise block + X-Ray); a Goethe A2 Kurzversion mock (`hasMock` stays false —
A2.2 work); the 688 Wortliste defect rows at a2.2/b1/b2 (each later wave's PR B); content tickets
from the PR C listening review on the reused A2.1 audio (exercise 1 q1/q3 stems carry a Genitiv,
exercise 1 q9 wording, speaker labels, the "Letzer Aufruf" typo in a transcript); the ASCII quotes in
the `Perfekt mit "haben"` / `"sein"` `titleDe` values; audio for the 175 new A2.1 words and 52 new
examples (owner's Azure run, see owner asks).

## Wave 5 — A2.2 as a complete course + the Goethe A2 mock (started 2026-09-06)

Same shape as Wave 4, for A2.2 (the second half of the €49 A2 course), plus the band's mock. Start
prompt: `docs/course-factory/wave5-prompt.md` (#92); worker briefs and the binding A2.2 level
constraint: `docs/course-factory/wave5/`. Recon (2026-09-06, read-only) confirmed the measured
baseline exactly (8 A2.2 topics with 0 typed exercises; 247 words with 227 defect rows; 8 reading
lessons with 0 checks at 288–350 words; 0 dictation) and two facts the plan rests on: the mock runner
already renders Zuordnung (`matching`), so the Goethe A2 mock needs no new renderer; and the
Goethe-A2 Erwachsene Lesen formats are Teil 1–3 a/b/c and **Teil 4 Zuordnen** (Modellsatz overview
table), not the "Teil 4 ja/nein" the start prompt guessed.

| # | Step | Status | PR |
|---|---|---|---|
| A | Four new A2.2 grammar topics (konjunktiv-ii-polite, verbs-with-prepositions-intro, indirect-questions-intro, infinitive-with-zu-intro) at topic_order 9–12, 26 exercises each, 20–22 typed; `level-a2.2.md` committed | merged, DB migrated 2026-09-06 (12 A2.2 topics live; 36 rules / 40 examples / 104 exercises verified byte-identical to the cache; totals 80/603/849/1350 = cache = `marketing.js`) | #93 |
| A2 | Typed production for the 8 live A2.2 topics (10 typed each, 80 exercises) + depth patch (+3 rules, +4 examples) for reflexive-verbs, simple-past-sein-haben, coordinating-conjunctions, comparative, superlative, future-tense | merged, DB migrated 2026-09-06 (80 exercises / 18 rules / 24 examples verified byte-identical to the cache; every A2.2 topic ≥10 typed and ≥8 rules; live totals 80/621/873/1430 = cache = `marketing.js`) | #94 |
| B | A2.2 share of the Wortliste (171 words, 8 new categories) + 271 guarded fixes on 177 live A2.2 rows (152 article-in-headword, 60 article-in-plural, 15 "null" plurals + 1, 44 sentences rewritten inside the level) | merged, DB migrated 2026-09-06 (418 A2.2 words, 0 defects of any class at a2.2, 2561 total; the 171 new rows await the owner's Azure audio run) | #95 |
| C | 8 A2.2 reading texts rewritten to ≤150 words with 5 rf + 1 a/b/c; 2 exam-format lessons (Lesen Teil 2 Informationstafel a/b/c, Teil 4 Anzeigen-Zuordnung a–f + x); +78 listening questions incl. 18 dictation | merged, DB migrated 2026-09-06 (10 A2.2 lessons all with `checks`, the 8 rewrites md5-identical to the reviewed JSON, ≤150 words; 6 × 23 questions incl. 18 dictation) | #96 |
| D1 | Goethe A2 Kurzversion mock (`MOCK_EXAMS.goethe_a2`: Hören 2 × A2.2 exercises at `questionMax` 5 + `playsAllowed` 1, Lesen all four Teile with Teil 4 as `matching` + distractor, Schreiben SMS + E-Mail), `hasMock: true` in both twins; `questionMax: 10` on every pre-existing mock Hören part + test pin | merged 2026-09-06 (no migration; `/modelltest/goethe-a2` and the Ernstfall step on `/pruefung/goethe-a2/` light up from the registry + flag) | #97 |
| D2 | Abschlusstest A2.2 (`a2_2_abschluss`, Goethe A2 format, Kurzversion) + 28-day plan `/a2-2-phase` + hand-offs (A2.1 → `/a2-2-phase`, A2.2 → `/modelltest/goethe-a2`) + `exam_attempts` CHECK with ten keys | in progress (draft) | — |
| E | Goethe-A2 30-day exam plan (mirror of `/start-deutsch-1-kurs`) — only if the wave's budget remains | optional | — |

## Measured baseline (do not re-derive)

- `weekly_metrics` is **empty** as of 2026-09-04 — the Monday 06:00 UTC job has not
  had its first run. Latest measured figures are the direct-SQL numbers in
  `docs/HANDOFF-2026-09-03.md` §2 (1,563 users, 4 real payers, ≈€45 MRR, 0 course sales).
- One-and-done rate after the A1.1 reorder (nouns-gender now lesson 1): watch the
  first weekly-truth email.

## Open questions / owner asks

- Audio: **DONE 2026-09-05.** The owner ran `scripts/generate-example-audio.mjs` (Azure Neural
  TTS, de-DE-KatjaNeural, #79/#80) — every grammar example (757/757) and every word
  (2215/2215) now has an `audio_url`; verified by SELECT and by counting the MP3 objects in
  the `audio` bucket (757 under `examples/`, 2215 under `words/`, smallest 16 KB). SD1 Hören
  and the dictation items reuse the existing listening audio. Any future content row
  starts with `audio_url` null and the same resumable run fills it.
- The Abschlusstest is free by decision (see log); if A1.1 is ever sold, the gate is one
  line in `src/data/courseTests/abschlusstestA11.js` (`gateLevel`).

- **Wave 4 owner asks (2026-09-06).** (1) Audio — **DONE 2026-09-06.** The owner ran
  `scripts/generate-example-audio.mjs --table words` (175 generated, 0 failed) and `--table examples`
  (52 generated, 0 failed); verified by SELECT: 2390/2390 words and 809/809 examples carry a bucket
  `audio_url`. (2) Rotate the Azure Speech key that was pasted through chat earlier in the wave.
  (3) `curl -I` the five goethe.de URLs in `astro-site/src/data/guides/goethe-a2.js` `sources[]` from an
  unrestricted network — the sandbox could not open any of them; `sources[4]`
  (`…/ins/de/de/prf/prf/gzsd2/wi2.html`) has the `…/ins/de/de/m/prf/prf/gzsd2/wi2.html` fallback if it
  404s. (4) The `/pruefung/goethe-a2/` course button — **confirmed 2026-09-06 by the owner**: it keeps
  linking the paid `/a2-1-phase`, as shipped.
- **Wortliste defects outside A2.1 (carried).** Measured 2026-09-06 after PR B: 688 rows at
  a2.2/b1.x/b2.x still carry the article baked into the headword or the literal string
  `"null"` as a plural (the same two defect classes fixed at a1.1/a1.2/a2.1 in Waves 2–4). Each
  later wave's PR B fixes its own level; nothing user-facing changes until then except the
  `"der der Bahnhof"` display bug on those decks. Wave 5 PR B (#95) closed a2.2 (227 rows + 1 own find);
  measured 2026-09-06 after it: 536 rows at b1.x/b2.x still carry an article in the headword or plural or
  the literal "null" plural.

## Decisions log

- 2026-09-06 (Wave 5, recon): the four new A2.2 topics are `konjunktiv-ii-polite` (würde/könnte/hätte/wäre
  as fixed polite forms — Sprechen Teil 3 planning, Schreiben Teil 2), `verbs-with-prepositions-intro`
  (fixed prepositions + case, wo(r)-/da(r)- forms — the cleanest gap: nothing below B1.2 teaches it),
  `indirect-questions-intro` (ob + W-Wort with the request frames — the `ob` half is reinforced from
  subordinating-conjunctions, the W-word half is new below B1.2) and `infinitive-with-zu-intro`
  (Lust/Zeit haben … zu, es ist wichtig … zu, separable verbs — SMS invitations and Absagen). Each is the
  A2 slice of a fuller B1 topic (konjunktiv-ii-wurde/-ware-hatte, verbs-with-prepositions,
  indirect-questions, infinitive-with-zu), the `adjective-endings-intro` precedent from Wave 4; slugs
  are globally UNIQUE so the `-intro`/`-polite` suffixes are required. Not chosen: Passiv Präsens (B1
  productive; receptive only at A2 → reading-exposure rule), Genitiv bei Namen + von (one rule, not a
  topic — it lives in the level file's frozen chunks), Nullartikel adjective endings (A2.1's declared
  exclusion, B1.2 owns it). Order 9→12 = morphologically simplest first, then the three syntax topics
  in rising complexity; appended at topic_order 9–12 as in Waves 2–4.
- 2026-09-06 (Wave 5, recon): Goethe-A2 Lesen formats per the Modellsatz Erwachsene overview table
  (Teil 1 Medientext a/b/c ×5, Teil 2 Informationstafeln/Programme a/b/c ×5, Teil 3 Korrespondenz
  a/b/c ×5, Teil 4 Anzeigen Zuordnen ×5; Hören Teil 2 Zuordnen Bild/Text, Teil 4 richtig/falsch). The
  mock covers all four Lesen Teile; the Abschlusstest A2.2 takes Teil 2 + Teil 4 so the two A2 course
  tests together rehearse all four. In `reading_lessons.checks` (rf/choice only) the Teil-4 lesson
  renders Zuordnung as choice items over the Anzeige letters; the real `matching` part lives in the
  mock and the Abschlusstest. Mock and Abschlusstest use distinct A2.2 listening exercises.
- 2026-09-06 (Wave 5, level constraint): A2.2 allows all A1 + all twelve A2.1 + the eight live A2.2
  topics productively (the A2.1 reflexive ban is lifted), the sentence cap is 16 words, and B1 forms
  (relative clause, Passiv Präsens, Präteritum of a full verb) may appear receptively at most twice per
  text in total, never as a check target — `docs/course-factory/wave5/level-a2.2.md`.
- 2026-09-06 (Wave 5, PR D1): the Goethe A2 Kurzversion plays BOTH Hören parts once (`playsAllowed: 1`)
  and gives Hören 20 minutes (60 in total). The runner's section clock never pauses for audio and ships no
  stop control, so two ~8-minute A2.2 exercises with the default double play (24:25 of audio) cannot fit a
  15-minute section; the intro and the Hören instructions say the real exam plays Teile 1/3/4 twice. The
  module says "gekürzt" (60 min, 20 auto-scored items against ~90 min / 40) and never "halbe Länge".
- 2026-09-06 (Wave 5, PR D1): no mock declared `questionMax` before this PR — A-level exercises carry 23
  questions since Waves 2–5, so `goethe_a1` presented 46 Hören items and `dtz`'s A2.2 part would present 23
  after PR C. Every pre-existing mock Hören part now carries `questionMax: 10` (a no-op at B1/B2, whose
  exercises have 10) and `tests/exams.test.mjs` requires a numeric cap on every mock listening part.
- 2026-09-06 (Wave 5, PR D2): two live A2.2 `speaking_missions` rows are corrected by guarded UPDATEs in the
  Abschlusstest migration because the 28-day plan derives mission titles from them and the plan review found
  banned forms there: "Der Urlaub, der schiefging" → "Ein Urlaub mit Problemen" (relative clause + Präteritum
  of a full verb) and mission 5's target_structures "combining weil, dass, seitdem" → "… wenn" (B1
  subordinator). A2.1's Tag-28 hand-off flips from `/level/a2.2` to `/a2-2-phase`; A2.2's ends at
  `/modelltest/goethe-a2`.
- 2026-09-06 (Wave 4, PR D2): the Abschlusstest A2.1 result screen and the plan's Tag 28 hand off to
  `/level/a2.2` — no A2.2 plan exists, and inventing `/a2-2-phase` would ship a link to a 404. The
  `/pruefung/goethe-a2/` course button links the paid `/a2-1-phase` (the brief's default; owner
  confirmed 2026-09-06). The Hören part plays once (`playsAllowed: 1`, resolved per part by the runner) because
  8:38 of audio does not fit two plays in the 15-minute section; `questionMax: 10` keeps the 10 : 10
  Hören/Lesen weighting now that every A2.1 exercise carries 23 questions.
- 2026-09-06 (Wave 4, PR D1): `tests/exams.test.mjs`'s "the newest Abschlusstest migration carries every
  exam-track key" check is scoped to tracks with a mock. An identity-only track (`goethe_a2`: guide, hub,
  writing tasks, `hasMock: false`) writes no `exam_attempts` row, so D1 widens only `profiles` and
  `writing_submissions`; PR D2's Abschlusstest migration re-lists `exam_attempts` with `goethe_a2` and
  `a2_1_abschluss`. Without the scoping every new track would need an `exam_attempts` migration it cannot use.
- 2026-09-06 (Wave 4, PR B review): reflexive verbs from the Goethe A2 Wortliste (sich anziehen,
  sich bewerben, sich anmelden …) may stand as RECEPTIVE Wortliste headwords with an example
  sentence that shows the chunk, and stay banned in every exercise, check statement, production
  task and rule text. The nine live A2.1 reflexive rows are kept on that basis; the level
  constraint (`S/wave4/level-a2.1.md`, "Wortliste exception") carries the ruling. Singularia
  tantum keep the live A1.2 convention (`plural` = JSON null, which the SRS trainer renders as no
  plural line), not the brief's "–".
- 2026-09-05 (Wave 4): A2.1's target exam is Goethe-Zertifikat A2 (Erwachsene). No A2 exam
  identity existed in code (EXAM_TRACKS had A1, B1 ×2, DTZ, B2), so PR D1 adds a minimal
  `goethe_a2` track — guide + hub + writing tasks, `hasMock: false` — rather than inventing a
  fake `formatOf`. A full Goethe A2 Kurzversion mock is A2.2 work.
- 2026-09-05 (Wave 4): the four new A2.1 topics get NO speaking missions this wave (the four
  A1.2 ones came from the separate SD1-Sprechen migration, not from Wave 3); the plan drills
  them through the lessons' stage-5 production plus X-Ray writing. Missions for them are a
  carried item.
- 2026-09-05 (Wave 4): A2.1 reading rewrites cap at 150 words (A2 texts are longer than A1's
  120) and may expose weil/dass/wenn at most twice per text as reading-only grammar; the four
  new topics are used on purpose in the texts so the course rehearses itself.
- 2026-09-05 (Wave 4): D is split into D1 (exam identity) and D2 (test + plan) because D1
  touches both examTracks twins, the guide registry, check-built-html's manifest and two DB
  CHECKs — a separate CI pass before the test that depends on it.
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
