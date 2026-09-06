# Wave 5 PR C2 — A2.2 listening: +13 questions per exercise (78 total, 18 dictation)

Read `S/common-header.md`, `S/level-a2.2.md` (BINDING for question_text and rf statements), then this
brief. Supabase project omqyueddktqeyrrqvnyq is READ-ONLY for you (SELECT via the `execute_sql` MCP tool; if
you lack it, stop and report "no Supabase tool").

## Source (pull it yourself)
1. `select id, exercise_number, title, level from listening_exercises where upper(level)='A2.2' order by
   exercise_number;` (6 exercises).
2. For each: `select dialogue_number, title, transcript from listening_dialogues where exercise_id='<id>'
   order by dialogue_number;` and `select id, question_number, dialogue_number, question_text,
   question_type, options, correct_answer, acceptable_answers, explanation from listening_questions where
   exercise_id='<id>' order by question_number;` (10 live items each).
Save everything as `S/listening/source/listening-a2.2.json` (exercises[] with dialogues[] and questions[]).
For the SHAPE of shipped additions, SELECT the A2.1 rows with question_number >= 11 on exercise 1:
`select * from listening_questions where exercise_id=(select id from listening_exercises where
upper(level)='A2.1' and exercise_number=1) and question_number>=11 order by question_number;` — copy the
shapes (options arrays, dictation acceptable_answers), none of the content.
Also read: `scripts/listening-questions-from-json.mjs` header; `src/hooks/useListening.js` and the
listening player component (grep `dictation` under src/) — how dictation answers are compared
(case/whitespace/acceptable_answers), so your acceptable_answers cover digits vs words.

## Deliverable → `S/listening/questions-a2.2-additions.json`
78 rows: for each of the 6 exercises, question_number 11–23 with exercise_id/exercise_number from the
source, dialogue_number of the dialogue the item targets, question_type ∈ multiple_choice (options
["a) …","b) …","c) …"], correct_answer "a"|"b"|"c"), richtig_falsch (options ["Richtig","Falsch"],
correct_answer "Richtig"|"Falsch"), dictation (options null, correct_answer the exact spoken token — a
number, price, time, date, spelled name, Postleitzahl, platform/room number — acceptable_answers listing
digit/word/spacing variants). Per exercise: 5 MC, 5 rf, 3 dictation. Rules:
- Every answer verifiable from the transcript verbatim; `explanation` quotes the line.
- Cover dialogues the live 10 items do not already test, or test a different detail; never duplicate a live
  question's fact. Spread across dialogues (no dialogue >3 new items).
- Distractors plausible and present in the audio world (other numbers/places said nearby).
- question_text in German inside the level file (Wer/Wann/Wo/Wie viel/Was …; rf statements ≤12 words; the
  Goethe A2 Hören Teil 4 is richtig/falsch on a Radiointerview — write rf items in that register).
- Dictation targets must actually be spoken in the transcript as text you can quote; at least 2 dictation
  items on times/platforms on the announcement-style exercise if one exists.
Also audit the 60 live questions: any wrong correct_answer / options not in the audio / typo →
`S/listening/existing-row-edits.json` ({id, field, old, new} — `old` byte-exact; only fields
options/correct_answer/question_text/explanation). Empty array if nothing. Transcript defects you notice
(typos, speaker labels, above-level grammar in the audio itself) go into notes.md as tickets — the audio is
not re-recorded this wave.
Write `S/listening/verify.mjs` (78 rows, per-exercise 13 with numbers 11–23 unique, 5/5/3 type mix, options
shape, correct_answer ∈ the letter set / Richtig|Falsch, dictation answer literally in the transcript, no
duplicate question_text per exercise) and run it clean. Then `S/listening/notes.md`. Report ≤15 lines.
