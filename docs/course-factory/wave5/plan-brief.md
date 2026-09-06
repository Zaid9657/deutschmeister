# Wave 5 PR D2b — a22Phase.js: "A2.2-Phase: 28 Tage bis zum Abschlusstest"

Read `S/common-header.md`, `S/level-a2.2.md` (BINDING for every German string in the plan: titles, week
intros, item titles), then this brief. Supabase project omqyueddktqeyrrqvnyq is READ-ONLY for you (SELECT via
`execute_sql`; if you lack it, stop and report "no Supabase tool").

Read in the repo: `src/data/programs/a21Phase.js` (THE template — same shape, item factories, comment
discipline, derive-never-retype; note its `nextLevel` hand-off factory), `src/data/programs/a12Phase.js`
header, `src/pages/A21PhasePage.jsx` (TYPE_ICON map: lesson | listening | reading | speaking | xray | exam |
review), `src/data/grammarTopics.js` ('a2.2' array: 12 slugs now), `src/data/writingTasks.js`
(`writingTasksForExam`), `tests/purchases.test.mjs` (the a21_phase pins you must mirror for a22_phase).

## Inputs fixed by this wave (use verbatim)
- 12 a2.2 grammar slugs (grammarTopics.js): reflexive-verbs, simple-past-sein-haben,
  coordinating-conjunctions, subordinating-conjunctions, subordinate-word-order, comparative, superlative,
  future-tense, + konjunktiv-ii-polite (9), verbs-with-prepositions-intro (10), indirect-questions-intro (11),
  infinitive-with-zu-intro (12).
- Speaking missions: pull the live A2.2 missions yourself (find the table via `grep -rn "missions" src/hooks
  src/services | head`, then SELECT the rows where the level is a2.2 — expect 8, one per OLD topic; record
  mission_order, title and the topic each maps to). The four NEW topics have NO mission — their production
  day uses the lesson's stage-5 typed exercises + an X-Ray writing item (say so in the module comment).
- 6 listening exercises: SELECT exercise_number + title from listening_exercises where upper(level)='A2.2'.
- 10 reading lessons: SELECT order_index + title_de from reading_lessons where level='a2.2' — the 8 live
  titles (order 1–8; PR C rewrites keep the titles unless one lies — if `S/reading/rewrites-a2.2.json` exists,
  take title_de from it) plus order 9 "Lesen Teil 2: Eine Informationstafel (wie in der Prüfung)" and order 10
  "Lesen Teil 4: Anzeigen zuordnen (wie in der Prüfung)" (PR C creates them; use these exact titles).
- Writing: writingTasksForExam('goethe_a2') → 2 SMS + 2 E-Mail tasks; SMS practice in weeks 2–3, E-Mail
  in weeks 3–4.
- Course test: /modelltest/abschlusstest-a2-2 (Probe Tag 26, final Tag 28, type 'exam').
- Tag 28 hand-off: "Weiter: Goethe A2 Übungstest" → `/modelltest/goethe-a2` (the Kurzversion mock, PR D1)
  — the A2 course's finish line. Level page: `/level/a2.2`.
Sequencing is pedagogical, 3 lessons/week: reflexive-verbs → verbs-with-prepositions-intro (builds on it) →
simple-past-sein-haben → coordinating-conjunctions → subordinating-conjunctions → subordinate-word-order →
indirect-questions-intro → infinitive-with-zu-intro → comparative → superlative → konjunktiv-ii-polite →
future-tense (closing: plans after the course). Week intros exactly 2 sentences, du-form, ≤16 words per
sentence, each day 2–4 items, ≈55–75 min/day with two Puffertage (≈30 h total), SRS review weekly (type
'review'), missions on the day after their lesson, listening spread across weeks 1–4, reading lessons in
order with the two exam-format ones in week 4 before the Probe. Export names: PROGRAM_KEY 'a22_phase',
PROGRAM_TITLE 'A2.2-Phase: 28 Tage bis zum Abschlusstest', same WEEKS/DAYS shape and helpers as
a21Phase.js; import-time throw listing missing slugs, missions by order with throwing lookup, listening
titles lookup throwing on unknown number.

## Deliverables → `S/plan/a22Phase.js`, `S/plan/verify.mjs`, `S/plan/notes.md`
verify.mjs mirrors the Wave 4 harness: import the module from the repo's real grammarTopics.js (all 12
a2.2 slugs are live), check 28 days, all 12 lessons once, all 8 missions once, all 6 listening, all 10
reading, 4 writing tasks, both exam items, the Tag-28 hand-off href, intro sentence counts, hrefs shape (SPA
routes no slash; Astro/prerendered routes with slash), unique item ids. Run it clean. Report ≤15 lines.
