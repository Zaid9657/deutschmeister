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
| A | Four new A2.1 grammar topics (adjective-endings-intro, pronouns-accusative-dative, modal-verbs-past, temporal-prepositions) at topic_order 9–12, 26 exercises each ≥16 typed | pending | |
| A2 | Typed production for the 8 live A2.1 topics (≥10 typed each) + depth patch (+3 rules, +4 examples) for possessive-pronouns, perfect-tense-haben, imperative-mood | pending | |
| B | A2.1 share of the Wortliste (8 new categories) + fixes to the live A2.1 rows (117 article-in-word, 5 null plurals) | pending | |
| C | 8 A2.1 reading texts rewritten to ≤150 words inside the level with 5 rf + 1 choice check; 2 exam-format lessons (Lesen Teil 1 Zeitungstext, Teil 3 E-Mail) at order 9/10; +78 listening questions incl. 18 dictation | pending | |
| D1 | `goethe_a2` exam track (no mock yet) + Leitfaden `/leitfaden/goethe-a2/` + hub `/pruefung/goethe-a2/` + 4 Goethe-A2 writing tasks + CHECK widening on profiles/writing_submissions | pending | |
| D2 | Abschlusstest A2.1 (Goethe A2 format, half length, `questionMax` 10, paid gate) + 28-day A2.1 plan (`/a2-1-phase`) + hand-offs (A2.1 result → `/level/a2.2`) | pending | |

Decisions (Wave 4):
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
