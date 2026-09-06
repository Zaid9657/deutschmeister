# Wave 4 PR D2b — a21Phase.js: "A2.1-Phase: 28 Tage bis zum Abschlusstest"

Read `S/wave4/common-header.md`, then:
- `src/data/programs/a12Phase.js` (THE template — same shape, item factories, comment discipline,
  derive-never-retype), `src/data/programs/a11Phase.js` header, `src/pages/A12PhasePage.jsx`
  (TYPE_ICON map: lesson | listening | reading | speaking | xray | exam | review),
  `src/data/grammarTopics.js` ('a2.1' array: 8 slugs today), `src/data/writingTasks.js`
  (`writingTasksForExam`), `S/wave3/plan/a12Phase.notes.md`, `review.md`, `verify.mjs` (harness).
- Inputs fixed by this wave (forward references you must use verbatim):
  - 12 a2.1 grammar slugs: dative-case, prepositions-dative, two-way-prepositions,
    possessive-pronouns, separable-verbs, perfect-tense-haben, perfect-tense-sein, imperative-mood,
    + NEW adjective-endings-intro (9), pronouns-accusative-dative (10), modal-verbs-past (11),
    temporal-prepositions (12) — estimatedTime 25/25/20/20.
  - 8 speaking missions (A2.1, mission_order 1–8, one per OLD topic): 1 Ein Paket verschicken
    (dative-case), 2 Der Weg zur Arbeit (prepositions-dative), 3 Der Umzugstag
    (two-way-prepositions), 4 Im Fundbüro (possessive-pronouns), 5 Mein Tagesablauf
    (separable-verbs), 6 Mein Wochenende (perfect-tense-haben), 7 Zurück von der Reise
    (perfect-tense-sein), 8 Den Weg zur Wohnung erklären (imperative-mood). The four new topics
    have NO mission — their production day uses the lesson's stage-5 exercises + an X-Ray writing
    item instead (say so in the module comment).
  - 6 listening exercises (A2.1 #1–6): Beim Arzt (erweitert); Im Restaurant bestellen; Reisen und
    Verkehrsmittel; Termine und Verabredungen; Einkaufen im Alltag; Nachrichten und Durchsagen.
  - 10 reading lessons: the 8 live titles in S/wave4/source/reading-a2.1.json (order 1–8) plus
    order 9 "Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung)" and order 10 "Lesen Teil 3: Eine
    E-Mail (wie in der Prüfung)".
  - Writing: writingTasksForExam('goethe_a2') → 2 SMS + 2 E-Mail tasks (taskKeys start 'sms-' and
    'email-'); the plan links SMS practice in weeks 2–3 and E-Mail in weeks 3–4.
  - Course test: /modelltest/abschlusstest-a2-1 (Probe Tag 26, final Tag 28, type 'exam').
  - Tag 28 hand-off: "Weiter: A2.2" → `/level/a2.2` (no A2.2 plan exists yet — do not invent
    a route). Level page: `/level/a2.1`.
Sequencing is pedagogical (dative-case → prepositions-dative → two-way-prepositions →
possessive-pronouns → pronouns-accusative-dative → separable-verbs → perfect-tense-haben →
perfect-tense-sein → modal-verbs-past → imperative-mood → temporal-prepositions →
adjective-endings-intro) — 3 lessons/week, week intros exactly 2 sentences, du-form, ≤14 words per
sentence, each day 2–4 items, SRS review weekly (type 'review'), missions on the day after their
lesson. Export names: PROGRAM_KEY 'a21_phase', PROGRAM_TITLE 'A2.1-Phase: 28 Tage bis zum
Abschlusstest', same WEEKS/DAYS shape and helpers as a12Phase.js; import-time throw listing missing
slugs, missions by order with throwing lookup, listening titles lookup throwing on unknown number.

## Deliverables → `S/wave4/plan/a21Phase.js`, `S/wave4/plan/verify.mjs`, `S/wave4/plan/notes.md`
verify.mjs mirrors the Wave 3 harness (build the stub grammarTopics with the 4 pending a2.1
slugs under `S/wave4/plan/_harness/`, never in the repo; check 28 days, all 12 lessons once, all
8 missions once, all 6 listening, all 10 reading, 4 writing tasks, both exam items, intro sentence
counts, hrefs shape (SPA routes no slash; Astro/prerendered routes with slash), unique item ids).
Run it clean; delete `_harness/` afterwards (say so in notes).
