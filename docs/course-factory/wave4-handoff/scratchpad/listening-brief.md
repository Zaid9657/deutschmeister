# Wave 4 PR C2 — A2.1 listening: +13 questions per exercise (78 total, 18 dictation)

Read `S/wave4/common-header.md`, `S/wave4/level-a2.1.md`, then:
- `S/wave4/source/listening-a2.1.json` — 6 live A2.1 exercises, each with `dialogues[]`
  (dialogue_number, title, transcript = array of {text, speaker}) and the 10 live `questions[]`
  (question_number 1–10). Exercise ids are in the file; exercise_number 1–6.
- `S/wave3/listening/questions-a1.2-additions.json`, `existing-row-edits.json`, `notes.md`,
  `review.md`, `build.mjs`, `verify.mjs` (shape + validation that passed).
- `scripts/listening-questions-from-json.mjs` header; `src/hooks/useListening.js` and the
  listening player component (find with grep `dictation`) — how dictation answers are compared
  (case/whitespace/acceptable_answers), so your acceptable_answers cover digits vs words.

## Deliverable → `S/wave4/listening/questions-a2.1-additions.json`
78 rows: for each of the 6 exercises, question_number 11–23 with exercise_id/exercise_number
from the source, dialogue_number of the dialogue the item targets, question_type ∈
multiple_choice (options ["a) …","b) …","c) …"], correct_answer "a"|"b"|"c"), richtig_falsch
(options ["Richtig","Falsch"], correct_answer "Richtig"|"Falsch"), dictation (options null,
correct_answer the exact token — a number, price, time, date, spelled name, Postleitzahl,
platform/room number — acceptable_answers listing digit/word/spacing variants). Per exercise:
5 MC, 5 rf, 3 dictation. Rules:
- Every answer must be verifiable from the transcript verbatim; `explanation` quotes the line.
- Cover dialogues the live 10 items do not already test, or test a different detail; never
  duplicate a live question's fact. Spread across dialogues 1–10 (no dialogue >3 new items).
- Distractors plausible and present in the audio world (other numbers/places said nearby).
- question_text in German inside the level constraint (Wer/Wann/Wo/Wie viel/Was …; rf statements
  ≤12 words). No trick items on unstated facts.
- Dictation targets must actually be spoken in the transcript as text you can quote.
- Exercise 6 (announcements) → at least 2 dictation items on times/platforms.
Also audit the 60 live questions: any wrong correct_answer / options not in audio / typo →
`S/wave4/listening/existing-row-edits.json` ({id, field, old, new} — `old` byte-exact; only
fields options/correct_answer/question_text/explanation). Empty array if nothing.
Write `S/wave4/listening/verify.mjs` (78 rows, per-exercise 13 with numbers 11–23 unique,
5/5/3 type mix, options shape, correct_answer ∈ options letter set, dictation answer literally in
the transcript, no duplicate question_text per exercise) and run it clean. Then `notes.md`.
