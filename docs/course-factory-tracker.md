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
| D2 | Abschlusstest A2.2 (`a2_2_abschluss`, Goethe A2 format, Kurzversion) + 28-day plan `/a2-2-phase` + hand-offs (A2.1 → `/a2-2-phase`, A2.2 → `/modelltest/goethe-a2`) + `exam_attempts` CHECK with ten keys | merged, DB migrated 2026-09-06 (`exam_attempts_exam_key_check` lists all ten keys incl. `a2_2_abschluss`; the two `speaking_missions` fixes verified by SELECT) | #98 |
| E | Goethe-A2 30-day exam plan (mirror of `/start-deutsch-1-kurs`) — only if the wave's budget remains | held for Wave 6 (the owner question "in this wave if budget remains?" went unanswered; the default is to hold) | — |

**Wave 5 status: COMPLETE (2026-09-06).** All six steps merged and live, every migration applied via
the Supabase connector and verified by SELECT: 12 A2.2 topics (the four new ones byte-identical to the
cache) plus typed production on the eight older ones; live totals 80 topics / 621 rules / 873 examples /
1430 exercises = cache = `marketing.js`; 418 A2.2 words (2561 total, 0 defects at a2.2); 10 A2.2 reading
lessons all with checks (74 total; the 8 rewrites ≤150 words and md5-identical to the reviewed JSON, the
two exam-format lessons at order 9/10); 6 × 23 A2.2 listening questions incl. 18 dictation; the Goethe A2
Übungstest (Kurzversion) on the runner (`hasMock` true — `/modelltest/goethe-a2` and the Ernstfall step on
`/pruefung/goethe-a2/`), `questionMax: 10` on every older mock Hören part; the Abschlusstest A2.2
(`a2_2_abschluss` admitted by the ten-key `exam_attempts` CHECK) and the 28-day plan at `/a2-2-phase`,
with the A2.1 plan's Tag 28 now handing off to it and the A2.2 plan handing off to the mock. The €49 A2
course is complete: two paid halves with typed production, Wortliste shares, exam-format reading,
listening with dictation, a Leitfaden and writing bank, two dated 28-day plans, two Abschlusstests and
the band's own timed mock. Netlify deploys of main were green after every merge.

Not done this wave (carried): PR E, the Goethe-A2 30-day exam plan (first item of Wave 6 unless the
owner says otherwise); an "A2.2 legacy re-cut" PR for out-of-level material in LIVE rows the wave did not
touch — `subordinating-conjunctions` (obwohl/während/bevor/nachdem/bis/seit in rules oi 0/1/4/8/9 and
examples oi 5–10; als + Präteritum in rule oi 5, example oi 15 and exercise oi 8 with answer key "Als"),
`subordinate-word-order` rule oi 4 (nine B1 subordinators + two Präteritum forms), `superlative` example 7
(Genitiv), the A2.2 Wortliste's eight Genitiv-preposition headwords (aufgrund, diesseits, infolge,
inmitten, unterhalb, unweit, während, wegen), 18 of the 25 live "Prepositions" rows and most of "Animals"
(re-level to b1.x/b2.x); the 536 Wortliste defect rows at b1/b2 (each later wave's PR B); listening
content tickets on the reused A2.2 audio (exercise 3 item 1 needs arithmetic, exercise 4 dialogue 3
"habe ich mich dreimal vertippen", exercise 5's first five items are digit recognition, eleven
transcript-level B1 forms; exercise 6 carries four B1 forms in its audio) — audio is not re-recorded;
speaking missions for the four new A2.1 and four new A2.2 topics; the `grammar-content-cache.json`
`dumpedAt` stamp (still 2026-08-24; only the owner's dump run refreshes it); audio for the 171 new A2.2
words and the new examples (owner's Azure run, see owner asks). Verifier lessons worth carrying into the
Wave 6 briefs: quote frames ("Im Text steht: …") must be substring-checked against the text; quantifiers
and numerals must not count as determiners in the null-article check; `bis`/`seit` as conjunctions need
their own rule; a deliverable is frozen while a review is open and generated repo artefacts are diffed
against the reviewed JSON before the PR flips to ready.

## Wave 6 — A2.2 legacy re-cut + the Goethe-A2 30-day exam plan (started 2026-09-06)

Two carried items from Wave 5, in the order the owner chose ("re-cut first, then PR E"): the LIVE A2.2
rows the waves never touched still taught B1 material inside a paid A2.2 course, and the Goethe-A2 track
had no 30-day exam plan while Goethe-A1 has one. Worker briefs and recipes: `docs/course-factory/wave6/`
(at close); the binding level file stays `docs/course-factory/wave5/level-a2.2.md`. Recon (2026-09-06,
read-only) inventoried the offenders from the cache (= live): `subordinating-conjunctions` 6 rules /
7 examples / 2 exercises, `subordinate-word-order` 4 rules / 5 examples / 3 exercises, `superlative`
1 example, plus one Präteritum in `comparative` and two meta-Genitiv explanations in the new topics
found by the sweep; the A2.2 Wortliste's "Prepositions" (25 rows, 18 B1/B2) and "Animals" (25 rows,
mostly outside the Goethe A2 list). The pins in `tests/a2-2-typed-production.test.mjs` (≥10 typed per
topic, contiguous exercise order_index, ≥12 examples on superlative) mean a re-cut may only EDIT IN
PLACE — never delete or add — which is the shape the migration takes.

| # | Step | Status | PR |
|---|---|---|---|
| A | A2.2 legacy re-cut: guarded in-place UPDATEs on every out-of-level string in the live A2.2 grammar rows (B1 subordinators, als + Präteritum, Plusquamperfekt, Genitiv), the same edit in the cache, a re-level of the B1/B2 "Prepositions" and out-of-list "Animals" rows to b1.x/b2.1, a shared A2.2 ban battery (`tests/helpers/a2Bans.mjs`) and a guard suite that sweeps every German field of every A2.2 grammar row in the cache | merged, DB migrated 2026-09-06 (150 grammar fields + 45 word re-levels; md5 over all 107/142/262 A2.2 rows identical to the cache; ban sweep 0; a2.2 words 373) | #100 |
| B | Goethe-A2 30-day exam plan (`/goethe-a2-kurs`, PROGRAM_KEY `goethe_a2_30_tage`, mirror of `/start-deutsch-1-kurs`: 5 weeks / 30 days / 77 items / 27 h derived, exam Teile as the spine over existing A2.1 + A2.2 content, both Abschlusstests as Probe, the Kurzversion mock gewertet on Tag 26 and Tag 30, the two official Goethe PDFs), `goethe_a2.courseHref` → the plan in both twins, A2.2's Tag-28 hand-off and the result screen → the plan; A22PhasePage chip fixed | merged (no migration; plan reviewed FAIL → PASS in two rounds + the residual minors applied) | #102 |
| C | Speaking missions for the four new A2.1 + four new A2.2 topics — only if the wave's budget remains | optional | — |

**Wave 6 status: COMPLETE (2026-09-06).** Both planned steps merged; the one migration applied via the
Supabase connector and verified by SELECT. Live after #102: md5 over ALL A2.2 grammar rows (107 rules /
142 examples / 262 exercises) identical to the cache on main (rules `5e96fe92…`, examples `a3b3bcb9…`,
exercises `0ecdeee8…`, `pgmd5.mjs` recipe over the full level); the shared A2.2 ban battery
(`tests/helpers/a2Bans.mjs`) sweeps every German field of every A2.2 grammar row in that cache with 0 hits
(`tests/a2-2-legacy-recut.test.mjs`, green on main); per-topic counts unchanged (25/25/18 exercises,
15/15/12 examples, 11/9/9 rules on the three re-cut topics); words per level a1.1 339 / a1.2 413 / a2.1 423 /
a2.2 373 / b1.1 262 / b1.2 261 / b2.1 244 / b2.2 246 (2561 total, none deleted); `/goethe-a2-kurs` behind the
a2.2 band gate with the hub's course button, the A2.2 plan's Tag 28 and the result screen all pointing at
it. Production deploy of main at the #102 merge commit: ready (Netlify connector, deploy `6a9dd355…`).

Not done this wave (carried): PR C, speaking missions for the four new A2.1 + four new A2.2 topics (owner
decision, see owner asks); the same in-place re-cut method for the LIVE A1.1/A1.2/A2.1 rows the earlier
waves did not touch (unmeasured — run the ban battery per level first); the 536 Wortliste defect rows at
b1/b2; the A2.1 listening content tickets; the `grammar-content-cache.json` `dumpedAt` stamp (still
2026-08-24; only the owner's dump run refreshes it); ASCII quotes in two `titleDe` values.

## Wave 7 — B1.1 as a complete course half (started 2026-09-07)

Owner direction 2026-09-07: "the priority is to continue building and finishing all courses" — a recorded
reorder of the Wave 6 default ("Wave 7 opens with A2 speaking missions unless told otherwise"). `course_b1`
(€49, b1.1 + b1.2) has been live and buyable since 2026-09-03 while B1.1 sat at the pre-Course-Factory
generation: 8 topics with 0 typed exercises (85 MC/fill-blank), 262 words with 129 defect rows, 8 reading
lessons of 356–402 words with 0 checks, 6 × 10 listening questions with 0 dictation, 8 unreviewed speaking
missions, no plan page, no Abschlusstest. Wave 7 applies the proven five-PR shape to B1.1; Waves 8–10 =
B1.2 (+ the German telc-B1 30-day plan), B2.1, B2.2 (+ telc-B2 plan). Every B track already has a mock
(`telcB1`, `goetheB1`, `dtz`, `telcB2`), so no mock PR. Recon (2026-09-07, read-only): the B1 mocks consume
B1.1 listening exercises 1, 2 (telc), 3 (Goethe) and 4 (DTZ) — 5 and 6 are free for the Abschlusstest; the
course-test loop in `tests/exams.test.mjs` has no `cloze` branch yet (PR D adds it); the official telc B1
format is recorded in the decisions log. Briefs: `docs/course-factory/wave7/`; the binding level file
`docs/course-factory/wave7/level-b1.1.md` (PR A).

| # | Step | Status | PR |
|---|---|---|---|
| A | Level constraint `level-b1.1.md` + four new B1.1 topics (topic_order 9–12: temporal-clauses, obwohl-damit-sodass, adverbial-connectors, two-part-connectors), 26 exercises / 20–23 typed each, `tests/b1-1-course.test.mjs`, counts in both `marketing.js` twins, llms 80→84; the cache re-serialised to the single-line dump format (Wave 6's re-cut had written it pretty-printed, which the topic generator refuses) | merged, DB migrated 2026-09-07 (84 topics / 657 / 913 / 1534 = cache; the four topics md5-identical to the cache; reviews FAIL → PASS in 2–3 rounds per topic) | #105 |
| A2 | Typed production + depth + legacy pass for the 8 live B1.1 topics: 80 typed exercises (10 per topic, contiguous order_index 16–25 / 9–18), +3 rules / +4 examples on each of the five thin topics (15 rules / 20 examples, every one now ≥8 rules incl. a common_mistakes rule and ≥12 examples), 6 guarded rule patches, the two swapped-field legacy MC exercises re-cut in place (`recut-from-json.mjs --header`), `tests/helpers/b1Bans.mjs` + `tests/b1-1-typed-production.test.mjs` (full-level ban sweep over every German field of every B1.1 row in the cache), counts in both `marketing.js` twins | merged, DB migrated 2026-09-08 (7 connector chunks; md5 over ALL B1.1 rules/examples/exercises = cache; every topic ≥10 typed / 9 rules incl. common_mistakes; ban sweep 0; cache 84 topics / 672 / 933 / 1614; reviews E1 9 → 1 → 0 and E2 27 findings → 0 blocking over three rounds, both round-3 delta re-reviews PASS) | #106 |
| B | Wortliste B1.1: the 129 defect rows, the 28 re-levelled Prepositions/Animals rows re-categorised, ~150 additions toward the Zertifikat B1 Wortliste | **parked 2026-09-08** (owner: stop building, sell what is finished; B1/B2 listed as coming soon) | — |
| C | Reading B1.1 (8 rewrites ≤220 words with checks + telc Lesen Teil 1 / Teil 3 exam-format lessons) + listening B1.1 (+78 questions incl. 18 dictation) | parked 2026-09-08 | — |
| D | Abschlusstest B1.1 (telc format: Hören, Lesen Teil 1+2, Sprachbausteine Teil 1, Schreiben) + `/b1-1-phase` 28-day plan + hand-offs + the eleven-key `exam_attempts` CHECK | parked 2026-09-08 | — |

## Wave 8 — A1.1 rebuild on the course standard (started 2026-09-12)

Not a content wave: the first rebuild of a course against `docs/course-standard-2026-09-12.md`.
A1.1 stops being 12 grammar slugs in a 28-day list and becomes 12 situational Lektionen in an
in-app lesson engine. Binding data contract: `docs/course-factory/a11-rebuild/CONTRACT.md`.
Rebuild order per standard §6 is A1.1 → A1.2 → A2.1 → A2.2; this wave is A1.1 only, and it is
the template every later level reuses (engine, checkpoints, review, syllabus are level-agnostic;
only `src/data/curricula/<level>.js` + the pool are per level).

| # | Step | Status | PR |
|---|---|---|---|
| 1 | The standard itself: what a DeutschMeister course is (12 situational Lektionen with Goethe can-dos, 9-step Lektion, lesson engine, checkpoints every 3, spaced review, dated plan), the measured gap of the four live courses, the rebuild order; three sourced research memos under `docs/research/*-2026-09-12.md` | merged 2026-09-12 | #113 |
| 2 | A1.1 rebuilt to the standard: contract, pool builder, answer checker, curriculum module with 12 situational Lektionen, curriculum course home, public Lehrplan on `/courses/a1-1/`, the 9-stage player at `/course/:level/l/:nr`, 4 checkpoints with the 60/40 rule, the review ladder, migration `2026-09-12-lesson-engine.sql` | merged 2026-09-12 | #114 |
| 3 | DaF review #1 applied: 5 blockers, majors and minors; practice-item quality filter (English meta and negation traps out, German spelling items in) and a level-wide selection plan (primary slug ≥ 4 of 7, no item twice in the level, no lemma more than twice per Lektion) | merged 2026-09-12 | #115 |
| 4 | Toward 9/10: recorded-audio pipeline (`scripts/generate-course-audio.mjs` + the committed manifest), AI-graded writing in every Lektion, scored read-aloud (`score-readaloud`, no LLM), situational hand-written items + „Erklär mir das", completion levers (exam-date plan, forgiving streak, signed-out progress, course-reminder mailer) | merged 2026-09-12 | #116 |
| 5 | DaF review #2 (written in the same branch) and round 3: level-scoped quality rules, 116 hand-authored situational items, L8–L12 curriculum fixes, five-gap Formulare with source text, register normalised to Sie, grader floor bound to the Textsorte | merged 2026-09-13 | #117 |
| 6 | DaF review #3 report (3 blockers, 11 majors; mean 20.4/25) | merged 2026-09-13 | #118 |
| 7 | Round 4 — review #3 closed **as rules**: gloss-only verb cues repaired at build time (58 items), `statementNoTask()`, alphabet card rewritten to the letter names the items accept, `drillsSlug()` measuring real primary-slug drill, du-imperatives normalised to Sie, Wortfeld words carried into the input, validator gains the Wortfeld-coverage and item-lexis ratchets. 581 tests, 136 pages verified | merged 2026-09-13 | #119 |
| 8 | Round 5 — review #4 closed as rules: spelled answers fold their separators, article cue repaired at build time, capitalisation seen by the checker, all twelve rule cards in Lektion lexis, Sie register across chrome and notices, „Buchstabiert:" retired, the speaking task travels to the coach, can-do and missionless ratchets, the validator measures the shipped pool. 619 tests, 136 pages verified | merged 2026-09-13 | #120 |

### The review ladder (adversarial DaF teacher / SD1 examiner, measured not assumed)

| # | After | Findings | Course mean (of 25) | Report |
|---|---|---|---|---|
| 1 | #114 | 5 BLOCKER · 45 MAJOR · 25 MINOR | 17.2 | `REVIEW-daf-2026-09-12.md` |
| 2 | #115/#116 | 1 BLOCKER · 35 MAJOR · 44 MINOR | 19.8 | `REVIEW-daf-2-2026-09-12.md` |
| 3 | #117 | 3 BLOCKER · 11 MAJOR | 20.4 | `REVIEW-daf-3-2026-09-12.md` |
| 4 | #119 | 3 BLOCKER · 11 MAJOR | 19.9 | `REVIEW-daf-4-2026-09-12.md` |
| 5 | #120 | pending | — | — |

All five reports live in `docs/course-factory/a11-rebuild/`. Every round recomputes the real draw
(`planPractice(CURRICULUM_A11, a11.json, attempt)`) rather than reading the pool, so each verdict is
about what a learner sees. The standard's phase 8 requires **0 BLOCKER / 0 MAJOR** before A1.1 is
fronted as finished.

### What is live on main (7d8b161)

- **12 situational Lektionen** in `src/data/curricula/a11.js` (Astro twin drift-guarded), each with
  situation, Handlungsfeld, Goethe can-dos, exam Teile, 15–25 Wortfeld entries (262 in total),
  a dialogue, a notice card, a pretest, Phonetik, dictation, read-aloud, an open speaking task and a
  writing task; `hoursTotal: 54` derived from the minutes, of which only ≈5.8 h are guided lesson time
  (the syllabus tile splits guided time from practice material — never advertise „54 Stunden Kurs").
- **9-stage lesson engine** (`src/lib/lesson/*`, `src/components/lesson/*`,
  `/course/a1.1/l/:nr`) with 7 controlled items per Lektion, re-queue, mastery and error tags.
- **4 checkpoints** (`src/lib/checkpoint/buildCheckpoint.js`, 20 items, five sections, 60 %/40 % rule,
  remediation sets, 3 attempts per 8 h) plus the existing free Abschlusstest A1.1.
- **AI-graded writing in all 12 Lektionen** — twelve `goethe_a1` course tasks (`a11-l01…a11-l12`,
  6 Formular with source text and five gaps / 6 Mitteilung with three content Leitpunkte) on
  `evaluate-writing.mjs` with the Goethe criteria and a Textsorte-bound length floor.
- **Scored speaking**: `score-readaloud` aligns one clip word by word against the expected line (no
  LLM), and the Lektion's open task travels to the speaking coach, which works that task.
- **Exam-date plan** card + on-track banner, **forgiving streak** (one missed day per week),
  signed-out local progress with a one-time merge on sign-in.
- **Course-reminder mailer** `netlify/functions/course-reminder.mjs`, scheduled 18:00 UTC in
  `netlify.toml`, A1 German copy (owner-approved, du-form by owner decision). **Live since
  2026-09-12**: `COURSE_REMINDER_ENABLED=true` is set in the Netlify functions scope and
  `migrations/2026-09-13-course-reminder.sql` is applied; first scheduled run 2026-09-13 18:00 UTC.
- **Recorded-audio pipeline** `scripts/generate-course-audio.mjs` + `src/data/curricula/a11.audio.js`;
  the manifest is still the empty stub, so every screen falls back to the browser voice and honestly
  labels itself „Computerstimme" until the owner's Azure run (181 clips, ≈7 cents).
- **347-item practice pool** (`src/data/lessonPools/a11.json`) built from the cache by
  `scripts/build-lesson-pool.mjs`, of which **119** are hand-written situational items
  (`a11.extra.json`) — never hand-edit the built pool.
- **Quality rules + four validator ratchets** in `scripts/validate-curriculum.mjs`, current values:
  RULE 10 Wortfeld coverage `MAX_UNCOVERED_WORTFELD = 19`, RULE 11 hand-written item lexis
  `MAX_UNTAUGHT_ITEM_TOKENS = 9`, RULE 12 unrehearsed can-dos `MAX_UNREHEARSED_CANDOS = 6`,
  RULE 13 speaking tasks without a mission `MAX_MISSIONLESS_LEKTIONEN = 4`. Ratchets only go down.

### The lesson of this wave: rules, not item lists

Every round that closed a finding by naming ids left the class alive, and the next review found it
again: review #2 closed the ordinal items with a rule (gone for good) and the punish-a-correct-answer
class with three ids (36 survivors, two of them in the draw); review #3 closed the verb-cue class with
a rule that recognised it by its vocabulary (`verb:` in the gloss) instead of its form, and review #4
found the identical shape on articles in 42 items. The binding form is therefore: **a finding class
closes with a rule in the builder or the checker plus a test/ratchet that pins it at its floor —
never with a list of ids.** The corollary the reviews state twice: what the validator does not read
does not exist for the repair round (RULE 10/11 read only `a11.extra.json` for one round, i.e. half
the course), and hand-written repairs must pass the same gate as the legacy bank.

After any content edit, re-run both, in this order:

```bash
node scripts/build-lesson-pool.mjs a1.1   # rebuilds a11.json from the cache + extras
node scripts/validate-curriculum.mjs      # RULES 1–13 with the four ratchets
```

### Open owner asks (Wave 8)

1. **The A1.1 audio run** — `node scripts/generate-course-audio.mjs a1.1` (dry run first; needs
   `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` + the service-role key, neither of which exists in a cloud
   agent session), then commit the manifest and `node scripts/sync-curricula.mjs`. Paste-ready:
   `docs/owner-prompts.md` § "Run the A1.1 course audio". Until it lands the course says
   „Computerstimme" on every audio surface.
2. **Three test learners through the free Lektion 1**, end to end on a phone, before A1.1 is fronted
   as the shop window — four reviews have measured the data, nobody has watched a human use it.
3. **GSC**: `deutsch-meister.de` is still not a verified Search Console property (see
   `docs/seo-routines/README.md`) — no impressions data for the rebuilt course pages.
4. **Netlify env vars**: the function variables (`COURSE_REMINDER_ENABLED=true`,
   `LIFECYCLE_ACTIVATION_ENABLED=true`, the API keys) are stored non-secret and the connector once
   returned them in plain text — mark them secret in the Netlify UI. Do NOT set
   `LIFECYCLE_TEST_RECIPIENTS`: it would also mute the activation mailer.

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

- **Wave 6 owner asks (2026-09-06).** (1) No new rows were created this wave, so no audio run is needed
  beyond the still-open Wave 5 run. (2) Decide PR C (speaking missions for the eight new A2.1/A2.2 topics):
  the missions are the one A2 surface the new topics do not reach; a Wave 7 opens with it unless told
  otherwise. (3) Decide whether the in-place re-cut method now goes to A1.1/A1.2/A2.1 (the same class of
  live rows the waves never touched) or whether B1 content comes first — neither moves reach; both are
  trust work.
- **Wave 5 owner asks (2026-09-06).** (1) Audio — run `scripts/generate-example-audio.mjs --table words`
  (171 new A2.2 words) and `--table examples` (the new A2.2 examples from PRs A and A2); verify by SELECT
  that every `words` and `grammar_examples` row carries a bucket `audio_url`. (2) Refresh the grammar cache
  stamp: `node scripts/dump-grammar-cache.mjs grammar-content-cache.json` from a machine with Supabase
  network (the generator patched the cache byte-for-byte, but `dumpedAt` still reads 2026-08-24 and CI
  warns). (3) Decide PR E (Goethe-A2 30-day exam plan): Wave 6 opens with it unless told otherwise.
  (4) Optional spot-check from a browser: `/modelltest/goethe-a2` end to end once (both Hören parts play
  once; the section clock never pauses for audio) and `/a2-2-phase` behind the A2 gate — the sandbox can
  only screenshot the auth guard.

## Decisions log

- 2026-09-13 (owner): **"only create A1.1."** A1.2 work is paused: the draft curriculum, pool, cards and
  116 items stay on `main` as a DRAFT (`DRAFT_CURRICULA`, not in `CURRICULA`, invisible to the app)
  with two DaF reviews on file (`docs/course-factory/a12-rebuild/`), but no further A1.2 rounds run
  until the owner says so. Every agent session focuses on A1.1 until it is signed off (0 BLOCKER /
  0 MAJOR). The paid A1.2 course page is untouched by any of this.


- 2026-09-13 (Wave 8, round 5): **one register, and it is the Sie-register.** Everything the course
  says to the learner siezt — every practice instruction, notice, rule card, checkpoint and mail
  ("Bilden Sie den Satz…", "Schreiben Sie das Wort…"); only the *dialogues* duzen, and only between the
  learner figures (Ana, Tim, Lena), while staff and neighbours (Frau Kaya, Herr Weber, Herr Schmidt)
  are addressed with Sie. The legacy exercise bank duzt ("Schreib den Satz…"): 39 du-imperatives stood
  against 30 Sie-forms in the shipped pool, three of them in the drawn seven of the FREE Lektion 1,
  next to a "Füllen Sie … aus". Normalised in `scripts/build-lesson-pool.mjs` (unanchored, whole-word,
  so a formula mid-prompt travels with its own text and a sentence-initial one keeps its capital), not
  by hand, and pinned at 0 du-imperatives by `tests/lesson-pool-rules.test.mjs`. `Buchstabiert:` was
  retired in the same pass for a different reason — the player renders text and plays no audio, so the
  truthful label is "Lesen Sie die Buchstaben:".
- 2026-09-13 (Wave 8, rounds 4–5): **every finding class closes with a rule plus a test, never with a
  list of ids.** Measured three times in the ladder: the ordinal items were closed with a rule and
  stayed closed; the "item punishes a correct answer" class was closed for three ids and 36 items of
  the same build survived, two of them in the draw; `verbCueOnlyInGloss` was the right rule with the
  wrong grip (it recognised the class by its vocabulary, `verb:` in the English gloss, instead of by
  its form) and the identical shape reappeared on articles in 42 items. The form a fix must take:
  a rule in `scripts/build-lesson-pool.mjs` or `src/lib/lesson/check.js` — the question is "does a
  second answer fit the German prompt just as well?", not "which word is in the gloss" — plus a
  ratchet or test at its floor. Corollary: **what the validator does not read does not exist for the
  repair round** (RULE 10/11 read only `a11.extra.json` for one round, i.e. half the course), and
  hand-written repairs pass the same gate as the legacy bank.
- 2026-09-13 (Wave 8, round 5): **the Lektion's speaking task travels to the coach without a mission
  schema.** Four A1.1 Lektionen have a `sprechen.open` prompt but no `speaking_missions` row, so no
  `?mission=` can be handed over and the coach used to fall back to some other mission of the level —
  the learner spoke to a task the lesson never set. The prompt now travels in the course context
  (`courseFlow.js`: `openPrompt`/`openTeil`/`hintWords`) and is sent with the start call as
  `taskPrompt`/`taskTeil`/`taskHintWords`; `speaking-session` validates it and stores it on the session
  row, so the coach works that task every turn. On the server it stays a FREE session: no mission row,
  no pass criteria, no scoring schema — inventing a mission row to carry a prompt would have put an
  ungraded task into the graded-mission table. RULE 13 (`MAX_MISSIONLESS_LEKTIONEN = 4`) keeps the gap
  visible instead of hiding it.
- 2026-09-13 (Wave 8, round 5): **L2's writing task stays a Mitteilung; the can-do moved instead.**
  Review #4 found L2 promising "Ich kann ein einfaches Formular … ausfüllen" in the public 12×6 grid
  while its own task was a Mitteilung — and offered both repairs. The Textsorte alternates by parity
  across the twelve Lektionen (6 Formular / 6 Mitteilung, the SD1 Schreiben Teil 1/2 split), so flipping
  L2 to `formular` would have broken that balance for one can-do line; the learner fills a Formular in
  L1, L3, L5, L7, L9 and L11 anyway. Instead the Mitteilung was re-written to serve the Handlungsfeld
  "Ämter und Behörden: Angaben zur Person" (Anmeldung in der Sprachschule, Leitpunkte Name/Geburtsdatum,
  Land/Staatsangehörigkeit, Familienstand), which also pulled ledig/verheiratet/Geburtsdatum/
  Staatsangehörigkeit out of the Wortfeld and into the input, and the can-do line now reads
  "Ich kann in einer kurzen Nachricht Angaben zu meiner Person machen." RULE 12
  (`MAX_UNREHEARSED_CANDOS = 6`) pins the class: no can-do may be published that no exercise slot of
  its own Lektion rehearses.

- 2026-09-12 (owner): **define the course before rebuilding it.** "The courses have to compete with the
  best online German courses — research all aspects, curriculum and design, before we rebuild."
  Result: `docs/course-standard-2026-09-12.md` (binding definition: 12 situational Lektionen per
  half-level with Goethe can-dos, 9-step Lektion anatomy, in-app lesson engine, checkpoints every 3
  Lektionen, FSRS review, dated plan) backed by three sourced memos in `docs/research/*-2026-09-12.md`.
  Rebuild order A1.1 → A1.2 → A2.1 → A2.2 per §6 of the standard; awaiting owner approval of §8.
- 2026-09-08 (owner): **stop building, sell what is finished.** Wave 7 pauses after PR A2 (B1.1 grammar
  complete, live); PRs B–D and Waves 8–10 are parked, not cancelled. The catalogue is re-cut per
  sub-level — A1.1 free, A1.2 €40, A2.1/A2.2 €50, B1.1/B1.2 €60, B2.1/B2.2 €65 — with B1 and B2
  listed as "coming soon" (no checkout) until they are rebuilt, and the A1–B2 bundle parked. Details
  and env-var names in `docs/monetization-2026-09-03.md` (addendum).

- 2026-09-06 (Wave 6, PR A): the legacy re-cut edits in place and never deletes — every banned string is
  replaced by an in-level equivalent that keeps the row's teaching job (the B1 subordinators leave the
  lists and tables, `als` material becomes `wenn`, the "Als"-key exercise becomes a wenn/ob/weil/dass
  item, Plusquamperfekt → Perfekt, "des Jahres"/"des Satzes" → "im Jahr"/"im Satz"), because
  `tests/a2-2-typed-production.test.mjs` pins per-topic counts and the contiguous exercise order_index.
  Out-of-Wortliste words are RE-LEVELLED (guarded on id + old level), not deleted, so `VOCAB_WORD_COUNT`
  and the audio rows are untouched. A shared ban battery now sweeps every German field of every A2.2
  grammar row in the cache on every test run — the class is closed, not just the instances.

- 2026-09-06 (Wave 6, PR B): the Goethe-A2 exam plan lives at `/goethe-a2-kurs` (case 3, no trailing
  slash; not prerendered, not sitemapped — like `/start-deutsch-1-kurs`), gated on
  `LevelSubscriptionGuard level="a2.2"` (the band top: Pro/trial or the A2 course), with its hours DERIVED
  as `PROGRAM_MINUTES`/`PROGRAM_HOURS` (the a22Phase convention) and the mock's minutes derived from
  `src/data/mockExams/goetheA2.js` (60, not a retyped 70). It teaches nothing new: every grammar item is a
  review of an already-taught A2.1/A2.2 topic, titled `Wiederholen: …`. Hand-offs: `goethe_a2.courseHref`
  in both twins, the A2.2 plan's Tag 28 and the result screen's a2.2 next step all point at the plan; the
  mock (`/modelltest/goethe-a2`) becomes the secondary link because it sits inside the plan. Exactly two
  official PDFs (Modellsatz + Übungssatz Erwachsene), pinned by `tests/purchases.test.mjs`, which keeps this
  plan out of the phase-plan href sweep (external goethe.de hrefs) and gives it its own.
- 2026-09-07 (Wave 7, recon): **the B1 band's course spine is telc Deutsch B1** (the start prompt says "for
  B1: telc B1/DTZ formats"; telc has the fullest tooling — mock, three writing tasks, the €89 product's exam).
  Abschlusstest B1.1 is `formatOf: 'telc_b1'`; Goethe B1 and DTZ stay served by their mocks. Official telc B1
  format (Übungstest 1 overview table, shop.telc.net): Leseverstehen Teil 1 = 5 Zuordnung (Überschriften a–j
  → Texte 1–5), Teil 2 = 5 MC a/b/c on one text, Teil 3 = 10 Zuordnung (Situationen → Anzeigen a–l, x
  possible); Sprachbausteine Teil 1 = 10 MC Grammatik, Teil 2 = 10 Zuordnung Lexik; Hörverstehen Teil 1 =
  5 R/F, Teil 2 = 10 R/F (heard twice), Teil 3 = 5 R/F; Schriftlicher Ausdruck = halbformeller Brief with
  4 Leitpunkte (45 P.); Mündlich = 3 Teile, Paarprüfung. Points 75/30/75/45/75; pass = 60 % schriftlich
  (135/225) AND mündlich (45/75) separately. The four B guides carry no Teil-level counts; this table is the
  source for the wave.
- 2026-09-07 (Wave 7, PR A): **the four new B1.1 topics (topic_order 9–12)** are the subordinator/connector
  set Wave 6 cut OUT of A2.2 that no B1.2/B2 slug owns — 9 `temporal-clauses` (als/wenn, bevor, nachdem +
  Plusquamperfekt as its A-slice, während, bis, seit/seitdem), 10 `obwohl-damit-sodass` (+ falls), 11
  `adverbial-connectors` (deshalb/trotzdem/außerdem/sonst/dann with inversion), 12 `two-part-connectors`
  (entweder…oder, nicht nur…sondern auch, sowohl…als auch, weder…noch, zwar…aber; je…desto stays B2). B1.2
  keeps Passiv, the Präteritum paradigm, indirect questions, n-Deklination and adjective declension; B2.2
  `advanced-conjunctions` opens "über weil und obwohl hinaus" and `complex-sentence-building` assumes nachdem
  + Plusquamperfekt — both consistent with B1.1 owning the basics. Order = clause syntax first, then
  main-clause connectors, then the mixed set.
- 2026-09-08 (Wave 7, PR A2): **the B1.1 ban battery** (`tests/helpers/b1Bans.mjs`) is derived from the A2.2
  battery by DROPPING what B1.1 now owns (Genitiv, relative clauses, the polite Konjunktiv II set,
  um/ohne … zu, the B1 subordinators, bis/seit, irreale Bedingungssätze) and ADDING the B1/B2 border
  (Konjunktiv I, Konjunktiv II der Vergangenheit, je … desto, Futur II, Partizipialattribute, ohne dass,
  the B2 connectors, lässt sich / sein + zu as Passivalternativen); Passiv and Plusquamperfekt-outside-
  nachdem stay banned. It is a floor, not a proof: Nominalisierung, the remaining Passivalternativen and the
  Präteritum-key ruling are reviewer eye-rules, so every content PR at B1.1 keeps the adversarial review
  and the battery sweeps the whole level in the cache on every CI run. The typed items keep the Wave 3–5
  shape (4 guided fill_blank + 3 sentence_building + 3 error_correction per topic, English cue pins the
  key where the German alone is ambiguous) and EXTEND mode continues each topic's own order_index counter.
- 2026-09-07 (Wave 7, PR A): **level constraint B1.1** (`docs/course-factory/wave7/level-b1.1.md`): all A1 + A2
  allowed; the 8 live B1.1 topics productive; the 4 new topics only inside/after their lesson; the
  **Präteritum ruling** — full-verb Präteritum allowed receptively in every text, productively only
  war/hatte/modals + a named strong-verb list in narration, and no B1.1 exercise key may target a
  Präteritum form (the paradigm is B1.2 `simple-past-narrative`); banned at B1.1: Passiv, Partizip als
  Adjektiv, n-Deklination beyond five frozen nouns, null-article adjective endings as a target, Konjunktiv I,
  Konjunktiv II der Vergangenheit, Passivalternativen, Partizipialattribute, Nominalisierung as a system,
  je…desto, Futur II, B2 connectors; sentence cap 20 words; vocabulary inside the Zertifikat B1 Wortliste.
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
