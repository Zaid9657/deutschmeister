# Wave 4 PR D2a — Abschlusstest A2.1 (course test in Goethe-Zertifikat A2 style, half length)

Read `S/wave4/common-header.md`, `S/wave4/level-a2.1.md`, then:
- `src/data/courseTests/abschlusstestA12.js` (THE template: header contract, shape, questionMax,
  listening part, mc-group parts, writing part) and `src/data/courseTests/index.js`;
  `src/data/mockExams/goetheA1.js` for part-type reference; `src/services/examScoring.js`;
  `tests/exams.test.mjs` lines ~140–330 (every guard a course test must satisfy);
  `S/wave3/test/notes.md`, `review.md`, `validate-a12.test.mjs` (harness to mirror).
- `S/wave4/source/listening-a2.1.json` — pick ONE A2.1 listening exercise for Hören (none is used
  by any mock today); justify the choice from its transcript (level fit, no banned grammar in the
  items you will rely on, everyday topic). Use its live id. questionMax: 10, minutes 15.
- `S/wave4/exam-brief.md` §Facts — the Goethe A2 format the sections imitate; formatOf is
  'goethe_a2' (the track lands in PR D1, before this file is integrated).

## Deliverable → `S/wave4/test/abschlusstestA21.js`
`export const abschlusstestA21 = { examKey: 'a2_1_abschluss', formatOf: 'goethe_a2', level:
'a2.1', title 'Abschlusstest A2.1 (Kurzversion)', intro (honesty contract: our own course test in
the style of Goethe-Zertifikat A2, Richtwert, hands over to A2.2 next), passPercent 60, sections:
- hoeren (15 min): one listening part, exerciseId = chosen A2.1 exercise, questionMax 10.
- lesen (20 min): 'lesen-1' mc-group in Teil-1 style (informational text 110–130 words + 5
  Richtig/Falsch items, options r/f), 'lesen-3' mc-group in Teil-3 style (semi-formal e-mail
  100–120 words + 5 items a/b/c). 10 objective items, 2–3 falsch, distinct answers pattern.
- schreiben (20 min): 'schreiben-1' writing part = Teil 1 SMS (3 Leitpunkte, 20–40 Wörter),
  'schreiben-2' writing part = Teil 2 halbformelle E-Mail (3 Leitpunkte, 30–60 Wörter); criteria
  text in the style of the A1.2 file's writing part (Leitpunkte, Anrede/Gruß, Register,
  Verständlichkeit) — no outcome claims.
Total 55 min ≈ half the real exam. Content: A2.1 grammar incl. the four new topics (adjective
endings after der/ein, object pronouns, konnte/musste/wollte, temporal prepositions) used ON
PURPOSE at least once each in the Lesen texts; nothing from the banned list; vocabulary A2.
Header comment: honesty contract, shape note, registry note (COURSE_TESTS key 'a2_1_abschluss',
slug 'abschlusstest-a2-1', level 'a2.1', gate = A2 course purchase or Pro/trial since a2.1 is not
free), listening-choice justification with quoted transcript lines, questionMax rationale.
Write `S/wave4/test/validate-a21.test.mjs` (mirror validate-a12: shape, item counts, r/f mix,
banned-word regex, questionMax present, distinct answers, word counts of the texts) and run
`node --test S/wave4/test/validate-a21.test.mjs` clean; `node --check` the module. Then notes.md.
