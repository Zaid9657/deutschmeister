# Wave 5 PR D1 — the Goethe-Zertifikat A2 Übungstest (Kurzversion) on the mock runner

Read `S/common-header.md`, `S/level-a2.2.md` (BINDING for every German string in the mock: texts, items,
options, task prompts, criteria; the A2 learner has finished A2.1 and A2.2), then this brief. Supabase
project omqyueddktqeyrrqvnyq is READ-ONLY for you (SELECT via the `execute_sql` MCP tool; if you lack it,
stop and report "no Supabase tool").

## Read in the repo (read-only)
- `src/data/mockExams/goetheA1.js` — THE template (an A-level Goethe Kurzversion): top-level shape
  {examKey, title (must contain "Kurzversion"), intro, passPercent, sections[{key,title,minutes,instructions,parts[]}]},
  Hören parts of type 'listening' {key, type, label, level (UPPERCASE, e.g. 'A2.2'), exerciseNumber 1–6,
  questionMax, playsAllowed, exerciseId (provenance only)}, Lesen 'mc-group' parts {key, type, label,
  text?, items[{id, prompt, options[{key,label}], answer}]}, Schreiben 'writing' parts {key, type, label,
  task, criteria[] (≥3)}. Copy the shape, none of the content.
- `src/data/mockExams/telcB1.js` — a 'matching' part {key, type, label, instructions?, options[{key,label}],
  texts[{id,text}], answers{textId: optionKey}} (the runner's Zuordnung; `options.length` must exceed
  `texts.length`). `src/data/mockExams/index.js` (registry + countScorableItems), `src/pages/Modelltest/ModelltestRun.jsx`
  (how each part renders), `src/services/examScoring.js` (scoring = 1 point per item), `src/data/modelltest.js`
  (slug/gate come from EXAM_TRACKS: `goethe_a2` gates on a2.2), `tests/exams.test.mjs` ~140–200 (every
  mock guard: track key resolves, title /Kurzversion/, passPercent 50–100, perfect sheet = maxScore =
  countScorableItems, matching answers ∈ options + distractors, mc-group answer ∈ options, listening level
  /^[AB][12]\.[12]$/ + exerciseNumber 1–6, writing needs task + ≥3 criteria, unknown type = fail).
- `src/data/courseTests/abschlusstestA21.js` — a shipped Goethe-A2-style course test: copy its honesty
  contract style, its Lesen text register and its Schreiben criteria wording (automated self-check, never
  "personal feedback"; no outcome promises). It uses A2.1 listening exercise 4 — do NOT reuse it.
- `astro-site/src/data/guides/goethe-a2.js` — the ONLY source of exam facts (four parts, 25 points each,
  Lesen 30 min / Hören ca. 30 / Schreiben 30, pass 60/100 with 45/75 written + 15/25 Sprechen, Hören Teil 2
  plays once, Schreiben Teil 1 SMS 20–30 words / Teil 2 halbformelle E-Mail 30–40 words, 3 Leitpunkte each).
  Never retype a figure that is not in the guide; never add an unsourced claim.
- The Lesen formats (Modellsatz overview table, verified 2026-09-06): Teil 1 Medientext a/b/c ×5 · Teil 2
  Informationstafeln/Programme a/b/c ×5 · Teil 3 Korrespondenz a/b/c ×5 · Teil 4 Anzeigen Zuordnen ×5.

## Listening source (pull it yourself)
`select id, exercise_number, title from listening_exercises where upper(level)='A2.2' order by 1;` and for
each candidate the dialogues' transcripts + the first 10 live questions (`listening_dialogues`,
`listening_questions` by exercise_id). Pick TWO A2.2 exercises for the mock (the Abschlusstest A2.2, PR D2,
will take a third — name in notes which one you leave for it and why). Justify each choice from the
transcript (everyday topic, level fit of the items you rely on, audio length). The mock does not add
questions: `questionMax: 5` on each part selects the first five live questions by question_number — so
check that questions 1–5 of each chosen exercise are sound; if one is defective, say so in notes rather than
working around it.

## Deliverable → `S/exam/goetheA2.js`
`export const goetheA2 = {` examKey 'goethe_a2', title 'Goethe-Zertifikat A2 Übungstest (Kurzversion)',
intro (honesty contract: our own Übungstest in the style of the Goethe-Zertifikat A2, half length, no
Sprechen so the exam's 15/25 oral threshold cannot be simulated — say it plainly; the real exam's
Modellsatz is free at the Goethe-Institut), passPercent 60, sections:
- hoeren (15 min, instructions naming that one part plays once like the exam's Teil 2): two 'listening'
  parts, level 'A2.2', distinct exerciseNumbers, `questionMax: 5` each, the second with `playsAllowed: 1`.
- lesen (20 min): FOUR parts covering all four Teile, 10 items total —
  'lesen-1' mc-group Teil-1 style: Medientext 110–130 words + 3 items a/b/c;
  'lesen-2' mc-group Teil-2 style: an Informationstafel/Programm (short lines, 60–90 words) + 2 items
  a/b/c ("Du möchtest … Wohin gehst du?");
  'lesen-3' mc-group Teil-3 style: halbformelle E-Mail 90–110 words + 2 items a/b/c;
  'lesen-4' matching Teil-4 style: options = six Anzeigen a–f (label = the ad text, 20–30 words each) plus
  {key:'x', label:'Keine Anzeige passt.'}; texts = 3 situations {id, text}; answers map each situation to
  one option key, all distinct, at most one 'x'.
  Answer patterns: not all the same letter; every distractor plausible and in the text's world.
- schreiben (20 min): 'schreiben-1' writing = Teil 1 SMS (task names 3 Leitpunkte, 20–30 Wörter),
  'schreiben-2' writing = Teil 2 halbformelle E-Mail (3 Leitpunkte, 30–40 Wörter); criteria[] ≥3 each in
  the abschlusstestA21 wording (Leitpunkte, Anrede/Gruß, Register, Verständlichkeit).
Total 55 min ≈ half the real exam. Content grammar: A1 + A2.1 + all twelve A2.2 topics ON PURPOSE (the
texts should show weil/dass/wenn, Komparativ, Perfekt, a polite Konjunktiv II, a verb+preposition, an
indirect question, an Infinitiv mit zu — receptively); NOTHING from the banned list (at most two B1 forms in
the whole mock and only where a real Medientext would carry them — default zero); sentences ≤16 words;
vocabulary A2. Header comment: honesty contract, the shape note, the listening choices with quoted
transcript lines, the questionMax/playsAllowed rationale, and "facts from guides/goethe-a2.js".
Write `S/exam/validate-goetheA2.test.mjs` (node --test: import the module; assert the shape rules above,
item counts 3/2/2/3 + two listening parts, matching options > texts and answers ∈ options, mc answers ∈
option keys, ≥3 criteria per writing part, banned-word regex over every German string, sentence ≤16
words, word counts of the four texts) and run it clean; `node --check` the module. Then `S/exam/notes.md`.
Report ≤15 lines.
