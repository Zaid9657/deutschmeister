# A2.1 listening additions — notes (Wave 4, PR C2)

Files: `questions-a2.1-additions.json` (78 rows), `existing-row-edits.json` (1 edit),
`verify.mjs` (self-check, 0 errors), `build.py` (generator that wrote the JSON — kept for
provenance), `tmp-out.sql` (throwaway output of the repo generator, not a deliverable).

## Shape

Copied from `S/wave3/listening/`: same field order and the same slot layout on every
exercise — multiple_choice at q11/13/15/17/19, richtig_falsch at q12/14/16/18/20,
dictation at q21/22/23 (5/5/3). `exercise_id`/`exercise_number` come from
`source/listening-a2.1.json`; `acceptable_answers` is `null` on every non-dictation row.

MC key sequences (q11,13,15,17,19), each exercise using all three letters:
E1 a,c,b,a,c · E2 b,a,c,b,a · E3 c,b,a,c,b · E4 a,b,c,a,b · E5 c,a,b,c,a · E6 b,c,a,b,c.

RF grid (q12,14,16,18,20): E1 R,F,F,R,R · E2 F,R,F,F,R · E3 R,F,R,F,F · E4 F,R,R,R,F ·
E5 R,R,F,F,R · E6 F,F,R,R,F — every position is Richtig in exactly 3 of the 6 exercises,
15 Richtig / 15 Falsch overall, and no exercise is more than 3:2 either way.

Dialogue spread: every dialogue 1–10 gets at least one new item, no dialogue more than 3
(only E6 d7, the answering machine, carries 3 — all three of its dictations).

## Dictation targets (18)

E1: 39,8 (d8, child's fever) · dreimal (d2, tablets per day) · 4 (d4, weeks to the check-up)
E2: 22 (d9, the second bill) · 2 (d7, espressos) · Spätburgunder (d6, the wine's name)
E3: 5:53 (d2, first ICE) · 42 (d7, seat number) · B17 (d8, gate)
E4: 19:30 (d10, Elternabend) · 3 (d8, floor) · 18:00 (d5, the appointment with Peter)
E5: 43 (d8, shoe size) · 5,49 (d2, market total) · 4 (d1, rolls)
E6: 8:00 and 15:00 (d7, the two Sprechzeiten — the brief's "≥2 dictation items on
times/platforms") · 02115553210 (d7, the stand-in practice's phone number)

`acceptable_answers` covers digit and spelled-out forms plus the separator variants the
player collapses (`src/utils/dictationMatch.js` strips `. , : - /`, spaces, `€`, "Euro",
"Uhr"; spelled-out forms fall through to `answerMatches`, which is case/umlaut-insensitive
but otherwise literal — so every plausible written form is listed explicitly). I re-ran the
real matcher over all 18 targets with 60+ learner-style inputs: all accepted, no false
positives on a wrong number.

E6's gate (B12) and cinema hall (Saal 3) were the other obvious platform-style targets;
both are already the answer to a live question (Q4, Q8), so they were left alone.

## Verification

- `node verify.mjs` → `OK: 0 errors — 78 rows, 6 exercises, 1 existing-row edit(s)`.
  It checks: 78 rows / 13 per exercise / q11–23 unique; exercise_id against the source;
  the 5/5/3 type mix; option shape (`a) `/`b) `/`c) `, rf exactly ["Richtig","Falsch"],
  dictation options null) and correct_answer inside that key set; **every dictation answer
  or one of its variants spoken verbatim in the dialogue it points at**; **every quoted
  phrase in every explanation present verbatim in that dialogue**; stems ≤12 words, banned
  A2.2+ grammar out of stems, rf items are statements not questions; no duplicate stem
  inside an exercise or against the live 10; dialogue coverage 1–10 and the ≤3 cap; MC key
  spread; the RF grid; a give-away scan (a dictation answer, in digits *or* spelled out,
  printed by any other question — new or live — on the same dialogue); and the edits file
  (id exists, `old` byte-exact, field allowed, key still valid after the change).
  Mutation-tested: four deliberate defects were all caught.
- `node scripts/listening-questions-from-json.mjs …` → exit 0, 78 INSERTs + 1 UPDATE.

## Audit of the 60 live rows → one edit

All 60 correct answers were checked against the transcripts; 59 are right and their options
are all sayable. The one finding, in `existing-row-edits.json`:

- **ex2 q9** (`5fb8a18d-…`) "Wie viel zahlt der Mann für Pizza und Bier?" — the bill is
  "vierzehn Euro fünfzig" (key `a`), but the guest then says *"Hier sind fünfzehn. Stimmt
  so."*, i.e. he really pays 15,00 — which is offered as distractor `b`. Both a and b are
  defensible answers to the stem as written. Minimal fix that stays inside the generator's
  one supported field: replace the `b) 15,00 Euro` distractor with `b) 16,00 Euro`, leaving
  the key at `a`. (Editing the stem to "Wie hoch ist die Rechnung für Pizza und Bier?"
  would be the other fix; `listening-questions-from-json.mjs` throws on any field but
  `options`, so I did not go that way — reviewer's call.)

Observed but deliberately NOT edited (out of the brief's scope, and none of them is a wrong
answer): ex1 q1/q3 use Genitiv ("das Fieber **des Patienten**", "das Ergebnis **des
Allergietests**"), which is banned at A2.1 — a stem edit would fix both, but the generator
only patches `options`. Transcript-side defects I cannot patch through this file at all:
ex2 d9 and ex4 d8 have wrong speaker labels (several consecutive `female` turns, so the
customer and the waitress/handyman are the same voice), and ex6 d4 says "Letzer Aufruf"
(→ "Letzter"). All three should go into a transcript-fix ticket.

## Deliberate choices / doubts for the reviewer

1. Questions are rendered as one flat list (`QuestionCard` never uses `dialogue_number`),
   so every stem is anchored to its dialogue by content — "Der Mann mit den
   Rückenschmerzen", "die Frau mit der kaputten Heizung", "der Termin mit Peter". That is
   why some stems are longer than they would need to be in isolation.
2. ex2 q19 says "der zweite Gast" rather than "die Frau" because the d9 speaker labels are
   broken (see above) — with them fixed, "die Frau" would be the natural wording.
3. Distractors are drawn from the audio world of the same exercise wherever a near-miss
   existed (Antibiotikum, Reis, Abteil, Buchhandlung…). A handful are plausible but not
   spoken (Kiosk, Speisewagen, Turnhalle); only the key is transcript-verifiable, which I
   read as the intent of the rule.
4. Adjective endings appear only after a definite/`ein`-word article ("dem hohen Blutdruck",
   "einen schweren Weißwein", "der kranke Sohn"), never after a null article — the ex5 q17
   options were rewritten to "Rosen in Gelb/Weiß/Rosa" for exactly this reason.
5. E6 q11 asks "Wie hoch sind die Temperaturen heute?" rather than "Wie warm wird es …" to
   keep `werden` off the page entirely, even though the forecast sense is not Futur.
6. ex1 q21 and ex4 q21/q22 are 10–11 words including "Schreiben Sie die Zahl./Uhrzeit."
   The input already carries a placeholder ("Antwort eingeben…"), so that sentence could be
   dropped if the reviewer prefers shorter stems; I kept the Wave 3 wording for consistency.
7. Three dictations on one exercise-6 dialogue (the answering machine) is a heavy load for a
   single announcement. It is the only E6 item with two clock times plus a phone number,
   which is what the brief asks for; splitting them across d2 (ICE 753) and d4 (LH 456) is
   the obvious alternative if the reviewer wants the load spread.

## Round 2 changes (review-1.md: 3 blocking, 9 minor — all applied)

**B1 — ex1 q16 duplicated live q6's fact.** Retargeted to an untested detail of the same
dialogue: "Die Frau war am Samstag im Restaurant." (Falsch — "Am Sonntag war ich in einem
Restaurant"). Grid unchanged (q16 stays Falsch).
`verify.mjs` now compares **facts, not stems**: it splits each dialogue into sentences, maps
every quoted phrase in every explanation (new rows *and* the live 10) onto the sentences it
comes from, and errors when a new item rests on a sentence a live item — or another new item
— already owns. Mutation-tested: re-pointing ex1 q16 at "Zwieback, Reis und Bananen. Keine
Milchprodukte." is caught. That check found four more overlaps the review had not listed, all
fixed rather than excepted:
- ex4 q20's explanation quoted the Elternabend time as well as the Aula → now quotes "In der
  Aula" only, and q21's quotes "Um neunzehn Uhr dreißig" only.
- ex5 q11 quoted the "vier Brötchen" sentence its own q23 dictation targets → replaced with
  "Wie möchte der Mann das Brot haben?" (a) Am Stück b) Ohne Kruste **c) Geschnitten**).
- ex3 q23 sat on the sentence live q8 owns (18:30 + Gate B17 are one sentence) → moved to the
  untested departure time, d3 "9:15".
- ex6 q17 sat on the boarding call's single sentence, which live q4 owns → moved to d3,
  "Wie lange gelten die Angebote im Supermarkt?" (**b) Nur heute**).
One reviewed exception is encoded explicitly in `FACT_SHARING_EXCEPTIONS`: ex6 q21/q22, because
d7 states both Sprechzeiten in one sentence and neither time can be answered from the other.

**B2 — ex1 q22.** acceptable_answers now: dreimal, 3, drei, 3x, 3 x, 3 mal, 3-mal, drei Mal,
3x täglich, 3 mal täglich, dreimal täglich, dreimal am Tag, maximal dreimal.

**B3 — ex4 q22.** Now accepts 3, 3., drei, dritter, dritten, 3. Stock, 3.Stock, 3 Stock,
im 3. Stock, dritter Stock, im dritten Stock. The **spelled-cardinal rule is now applied to all
18 dictations and enforced by verify.mjs**: any numeric answer must carry at least one
digit-free variant, and every item also gained its natural unit/preposition forms
("in vier Wochen", "9 Uhr 15", "Schuhgröße 43", "5 Euro 49", "um acht Uhr", "vier Stück"…).

Minors: #4 the ex1 q9 "Das Knie ist gebrochen." unresolved-fact gap is added to the
transcript/stem ticket below; #5 ex3 q17 → "In welchem Wagen reserviert der Mann einen Platz?";
#6 ex5 q15 → "Welcher Autor schreibt **Thriller** aus Berlin?" (explanation now quotes the
Thriller sentence); #7 "a) Ins Bein"; #8 "…das Fieber **von ihrem** Sohn?"; #9 ex3 q23 is a new
item, so the "Wie heißt das Gate" wording is gone; #10 the E6 dictations now sit on **two**
announcements (d7 twice, d5 once — the 11-digit phone number is dropped in favour of the A1
traffic item, which keeps both required clock times and cuts the typing load on d7);
#11 `ALLOWED_EDIT_FIELDS` is narrowed to `['options']` with a comment naming the generator
throw; #12 ex1 q23 accepts "in 4 Wochen" / "in vier Wochen".

Transcript/stem ticket (not patchable through this file, generator takes `options` only):
ex1 q1/q3 Genitiv, ex1 q9's unresolved "gebrochen", ex2 d9 + ex4 d8 speaker labels,
ex6 d4 "Letzer Aufruf".

Round 2 verification: `node verify.mjs` → `OK: 0 errors — 78 rows, 6 exercises, 1
existing-row edit(s)`; mutation test (fact duplicate, missing spelled variant, non-`options`
edit field) → all caught; the real `dictationMatches` over **all 18 dictations with 124
learner-style probes** → all accepted, no false positives; repo generator → exit 0,
78 INSERTs + 1 UPDATE.
