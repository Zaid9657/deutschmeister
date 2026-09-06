# Wave 5 PR D2a — Abschlusstest A2.2 (course test in Goethe-Zertifikat A2 style, half length)

Read `S/common-header.md`, `S/level-a2.2.md` (BINDING), then this brief. Supabase project omqyueddktqeyrrqvnyq
is READ-ONLY for you (SELECT via `execute_sql`; if you lack it, stop and report "no Supabase tool").

Read in the repo: `src/data/courseTests/abschlusstestA21.js` (THE template: header contract, shape,
questionMax, listening part, mc-group parts, writing parts) and `src/data/courseTests/index.js`;
`src/data/mockExams/telcB1.js` for the `matching` part shape; `src/services/examScoring.js`;
`tests/exams.test.mjs` (~140–330: every guard a course test must satisfy incl. `questionMax` on listening
parts, formatOf/key collisions); `tests/a2-1-abschlusstest.test.mjs` (harness to mirror);
`astro-site/src/data/guides/goethe-a2.js` (the ONLY exam-fact source). Read `S/exam/notes.md` if it exists:
the Goethe A2 mock (PR D1) names the two A2.2 listening exercises it uses and the one it leaves for you —
take that one; if the notes are absent, pull the A2.2 exercises yourself (`listening_exercises` where
upper(level)='A2.2', their `listening_dialogues` transcripts and `listening_questions` 1–10) and choose one
not used by any mock or course test in the repo (grep `exerciseNumber` under src/data/), justifying it from
the transcript. Use its live id as exerciseId, level 'A2.2', questionMax 10, minutes 15.

## Deliverable → `S/test/abschlusstestA22.js`
`export const abschlusstestA22 = {` examKey 'a2_2_abschluss', courseLevel 'a2.2', formatOf 'goethe_a2',
title 'Abschlusstest A2.2 (Kurzversion)', intro (honesty contract: our own course test in the style of the
Goethe-Zertifikat A2, a Richtwert, no Sprechen; hands over to the Goethe A2 Übungstest at
/modelltest/goethe-a2 next), passPercent 60, sections:
- hoeren (15 min): one listening part, the chosen A2.2 exercise, questionMax 10 (playsAllowed 2 default,
  or 1 if the audio is longer than ~8 minutes — say which in the header).
- lesen (20 min): 'lesen-2' mc-group in Teil-2 style (an Informationstafel/Programm, 70–100 words of short
  lines, + 5 items a/b/c "Du möchtest … Wohin/Wann …?"), 'lesen-4' matching in Teil-4 style (options = six
  Anzeigen a–f of 20–30 words each + {key:'x', label:'Keine Anzeige passt.'}; texts = 5 situations; answers
  all distinct with exactly one 'x'). 10 objective items; answer letters not all the same.
- schreiben (20 min): 'schreiben-1' writing = Teil 1 SMS (3 Leitpunkte, 20–30 Wörter), 'schreiben-2'
  writing = Teil 2 halbformelle E-Mail (3 Leitpunkte, 30–40 Wörter); criteria ≥3 each in the A2.1 file's
  wording (Leitpunkte, Anrede/Gruß, Register, Verständlichkeit) — automated self-check, no outcome claims.
Total 55 min ≈ half the real exam. Content: A1 + A2.1 + all twelve A2.2 topics used ON PURPOSE at least
once each across the Lesen texts (incl. the four new ones receptively); nothing from the banned list;
sentences ≤16 words; vocabulary A2. The Lesen material must not duplicate the PR C exam-format reading
lessons or the D1 mock (different boards, different ads, different situations).
Header comment: honesty contract, shape note, registry note (COURSE_TESTS key 'a2_2_abschluss', slug
'abschlusstest-a2-2', level 'a2.2', formatOf 'goethe_a2', gate = A2 course purchase or Pro/trial),
listening-choice justification with quoted transcript lines, questionMax/playsAllowed rationale,
"facts from guides/goethe-a2.js".
Write `S/test/validate-a22.test.mjs` (mirror the A2.1 harness: shape, item counts, matching guards, banned-word
regex, questionMax present, distinct answers, word counts) and run `node --test` clean; `node --check` the
module. Then `S/test/notes.md`. Report ≤15 lines.
