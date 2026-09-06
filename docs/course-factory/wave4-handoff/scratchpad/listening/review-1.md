# Adversarial review — Wave 4 PR C2, A2.1 listening additions (round 1)

Deliverable: `questions-a2.1-additions.json` (78), `existing-row-edits.json` (1), `verify.mjs`,
`notes.md`. Judged against `S/wave4/level-a2.1.md`, `S/wave4/listening-brief.md`,
`S/wave4/common-header.md` and the transcripts in `S/wave4/source/listening-a2.1.json`.

## What I did (so the "found nothing" suspicion is answerable)

1. Read all 60 transcripts (6 exercises x 10 dialogues) and all 60 live questions **before**
   reading any new item; answered each of the 78 new items cold from the transcript, then
   compared with the key. Every key matched my own answer except where noted below.
2. Ran the author's `node verify.mjs` → `OK: 0 errors — 78 rows, 6 exercises, 1 existing-row
   edit(s)` (exit 0), and read the script line by line to find what it does **not** cover
   (it checks duplicate *stem text*, not duplicate *fact*; its give-away scan reads
   question_text + options only, which is correct because `QuestionCard.jsx` renders
   explanations solely under `showResult`).
3. Ran the repo generator for real:
   `node scripts/listening-questions-from-json.mjs …additions.json …edits.json out.sql`
   → `1 existing-row UPDATEs, 78 INSERTs`, exit 0.
4. Found the real matcher (`src/utils/dictationMatch.js` → `answerMatches` in
   `src/utils/answerMatch.js`, reached from `listeningHelpers.isQuestionCorrect`) and ran
   `dictationMatches()` over all 18 dictation items with ~110 learner-style inputs
   (digit/word/separator/unit/prefix variants). Results in the table below; 15 of 18 items
   are watertight, 2 are not, 1 is inconsistent with the rest of the set.
5. Re-derived the audit of the 60 live rows independently; checked `old` in the edits file
   byte-for-byte against the source; re-checked the author's three transcript-defect claims
   (all three are real: ex2 d9 has a run of 5 `female` turns, ex4 d8 ends on two `female`
   turns, ex6 d4 says "Letzer Aufruf" twice).
6. Machine-swept: stem word counts (max 11, rf max 9 — inside the ≤14/≤12 caps), option
   lengths, cross-exercise duplicate stems (none), every quoted phrase in every explanation
   against its dialogue (0 misses), English tokens, and Unicode normalisation of every
   `acceptable_answers` entry (all NFC — a decomposed umlaut there would silently fail the
   matcher; it does not occur).

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | questions-a2.1-additions.json ex1 q16 | BLOCKING | "Die Frau mit Magenschmerzen darf Milchprodukte essen." (Falsch) | Duplicates live ex1 q6's fact outright: live q6 is "Was darf die Patientin essen?" with **"b) Milchprodukte"** as a distractor, key "c) Reis und Bananen", and the *same* transcript sentence as explanation ("Zwieback, Reis und Bananen. Keine Milchprodukte."). Anyone who answers q6 has answered q16. The brief: "never duplicate a live question's fact"; `verify.mjs` only compares stem strings, so it cannot see this. | Retarget the d6 rf item to an untested fact, e.g. "Die Frau hat seit zwei Tagen Magenschmerzen." (Richtig) or "Die Frau war am Samstag im Restaurant." (Falsch — "Am Sonntag war ich in einem Restaurant"). |
| 2 | questions-a2.1-additions.json ex1 q22 | BLOCKING | stem "Wie oft darf der Mann die Tabletten pro Tag nehmen?", key `dreimal`, acceptable `["dreimal","3","3 mal","3-mal","drei Mal","dreimal täglich"]` | Ran the real matcher: **"3x" → N, "3 x" → N, "3 mal täglich" → N, "dreimal am Tag" → N, "maximal dreimal" → N.** "3x" is the standard German dosage notation and the most likely thing a learner writes for "wie oft pro Tag"; "maximal dreimal" is the *fully* correct answer to the stem as written (the audio is "maximal dreimal täglich") and is marked wrong. Legitimate answers missing from acceptable_answers = wrong key. | Add `"3x"`, `"3 x"`, `"3x täglich"`, `"3 mal täglich"`, `"dreimal am Tag"`, `"maximal dreimal"`, `"drei"`. (Separator stripping means "3-mal"/"3 mal" already collapse together; "3x" does not, because `normalizeDigits` keeps the `x`.) Or drop the ambiguity by asking "Wie viele Tabletten sind maximal pro Tag erlaubt?" |
| 3 | questions-a2.1-additions.json ex4 q22 | BLOCKING | stem "In welchem Stock wohnt die Frau? Schreiben Sie die Zahl.", key `3`, acceptable `["3","3.","dritter","dritten","dritter Stock","im dritten Stock"]` | Matcher run: **"drei" → N**, while every other numeric dictation in this set accepts the spelled cardinal ("vier" ex1 q23 ✓, "zwei" ex2 q22 ✓, "vier" ex5 q23 ✓, "dreiundvierzig" ex5 q21 ✓). Also **"3. Stock" → N and "3 Stock" → N** although "dritter Stock" is accepted — so the learner is punished for the digit form the stem itself asks for. Internally inconsistent and rejects legitimate answers. | Add `"drei"`, `"3. Stock"`, `"3 Stock"`, `"3.Stock"`, `"im 3. Stock"`. |
| 4 | source/listening-a2.1.json ex1 q9 (live) — audit gap | MINOR | "Das Knie ist gebrochen." key Falsch; audio: "Wir müssen ein Röntgenbild machen… Ich glaube nicht, aber wir müssen es überprüfen." | The fact is explicitly *unresolved* in the transcript; "Falsch" is the exam convention but is not stated. The audit of the 60 live rows (notes.md) reports 59/60 clean and does not mention it. Not fixable through the generator (options only), but it belongs in the same transcript/stem ticket as ex1 q1/q3. | Note it in the ticket; the clean fix is the stem ("Die Ärztin glaubt, dass das Knie gebrochen ist." is a Nebensatz → instead "Das Knie ist sicher gebrochen."). |
| 5 | questions-a2.1-additions.json ex3 q17 | MINOR | "Wo sitzt der Mann im ICE nach Berlin?" a) Im Abteil b) Im Speisewagen c) Im Großraumwagen | "Wo sitzt er" is answered just as truthfully by "am Fenster" / "in Fahrtrichtung", both spoken two lines earlier; only the option list disambiguates. Also present tense for a seat he is still reserving. | "In welchem Wagen reserviert der Mann einen Platz?" |
| 6 | questions-a2.1-additions.json ex5 q15 | MINOR | "Welcher Autor schreibt Krimis aus Berlin?" | The transcript says Fitzek "schreibt **Thriller**, die in Berlin spielen"; "Krimi" is the *customer's* word for her own book. The stem asserts something the audio does not say of the author. | "Wie heißt der Autor aus Berlin?" or "Welcher Autor schreibt Thriller aus Berlin?" |
| 7 | questions-a2.1-additions.json ex1 q15 | MINOR | option "a) In das Bein" | Stilted; German says "ins Bein". (Contracted form is A1-allowed.) | "a) Ins Bein" |
| 8 | questions-a2.1-additions.json ex1 q21 | MINOR | "Wie hoch ist das Fieber vom Sohn?" | "von + Dat" for Genitiv is right at A2.1, but bare "vom Sohn" reads oddly without a possessive. | "Wie hoch ist das Fieber von ihrem Sohn?" (9 words, still inside the cap) |
| 9 | questions-a2.1-additions.json ex3 q23, ex6 q14/q17 | MINOR | "Wie heißt das Gate für den Flug nach London?"; "Das Boarding nach Barcelona endet…" | "Gate"/"Boarding" are outside the Goethe A2 Wortliste. They are in the audio and in live ex6 q4 ("Zu welchem Gate…"), so keeping them is defensible and consistent — but "Wie heißt das Gate" is the wrong verb for a number. | Keep the loanwords; change ex3 q23 to "Welches Gate hat der Flug nach London?" |
| 10 | questions-a2.1-additions.json ex6 q21–q23 | MINOR | all three E6 dictations sit on d7 (Anrufbeantworter) | Three typed answers — two clock times plus an **11-digit** phone number — off one 6-sentence announcement with a hard play limit. It meets the brief's "≥2 dictation items on times/platforms" but concentrates the whole typing load on the densest text. | Move the phone number to d2 (ICE 753 / 20 Minuten Verspätung) or d10 (Feuerwerk 21 Uhr); B12/Saal 3 are correctly avoided as live answers. |
| 11 | verify.mjs | MINOR | `ALLOWED_EDIT_FIELDS = new Set(['options','correct_answer','question_text','explanation'])` | Wider than the tool that consumes the file: `scripts/listening-questions-from-json.mjs` throws `only the 'options' field is supported` for anything else. A future edits row on `question_text` passes verify and then breaks the migration build. (The author's choice to fix ex2 q9 through `options` is therefore **correct** — I confirmed the throw in the repo script.) | Narrow the set to `['options']`, or add a comment that the others are brief-legal but generator-illegal. |
| 12 | questions-a2.1-additions.json ex1 q23 | MINOR | key `4`, acceptable `["4","4 Wochen","vier","vier Wochen"]`; stem has no "Schreiben Sie die Zahl." | "in vier Wochen" → N. Every other dictation whose stem omits that instruction has the same exposure; here the natural spoken answer starts with "in". | Add `"in 4 Wochen"`, `"in vier Wochen"`, or append "Schreiben Sie die Zahl." as elsewhere. |

### Checked and found clean (explicitly)

- **All 78 keys**: I answered every item from the transcript before looking; every key is the
  answer I wrote, and no distractor is independently true. Best distractor work: ex6 q11
  (20 Grad = the weekend value), ex6 q12 (Unfall = the *other* announcement's reason),
  ex3 q13 (23 Euro = the kilo figure).
- **The one existing-row edit** is justified and correctly scoped: live ex2 q9 "Wie viel zahlt
  der Mann für Pizza und Bier?" had **two** defensible answers — the bill "vierzehn Euro
  fünfzig" (key a) and what he actually hands over, "Hier sind fünfzehn. Stimmt so." (option b).
  Replacing b with "16,00 Euro" leaves exactly one defensible answer. `old` is byte-exact
  against `source/listening-a2.1.json` (verified by JSON comparison, not by eye), the field is
  the only one the generator accepts, and the key stays valid.
- **Dictation targets are all really spoken** (spelled-out in the audio, digit form as the key
  plus a spelled variant in acceptable_answers — the Wave 3 convention). The 11-digit phone
  number round-trips through `normalizeDigits` in every separator form I tried
  (`0211 555 3210`, `0211/5553210`, `0211-555-3210`, `0211 555 32 10`).
- **No give-aways**: no new stem or option prints another item's dictation answer on the same
  dialogue, in digits or spelled out — including the near-misses (ex5 q11's option list on the
  "4 Brötchen" dialogue carries no count; ex3 q23's B17 does not collide with live q8's 18:30).
- **Level constraint**: no Präteritum of a full verb, no Komparativ, no Genitiv, no Nebensatz,
  no reflexive, no Futur anywhere in the 78 stems/options. Adjective endings appear only after
  a definite or ein-word article ("dem hohen Blutdruck", "einen schweren Weißwein", "der kranke
  Sohn", "der kaputten Heizung") — the ex5 q17 "Rosen in Gelb/Weiß/Rosa" dodge is the right
  call. Stems max 11 words, rf max 9.
- **Shape**: 78 rows, 13 per exercise, q11–23 unique, 5/5/3 mix, exercise_ids match the source,
  dialogue coverage 1–10 with max 3 per dialogue, MC keys use a/b/c in every exercise,
  15 Richtig / 15 Falsch.
- **The author's three transcript-defect claims are real** and I reproduce them: ex2 d9 has a
  run of five consecutive `female` turns, ex4 d8 ends on two `female` turns, ex6 d4 says
  "Letzer Aufruf" (→ "Letzter") twice. Live ex1 q1/q3 do use Genitiv ("des Patienten", "des
  Allergietests"), banned at A2.1. All belong in a transcript-fix ticket; none is patchable
  through this file.

VERDICT: FAIL (3 blocking, 9 minor)

This is strong work — the transcript reading is accurate, the distractors are drawn from the
audio world, the give-away discipline is real, and the one live-row ambiguity the author found
is a genuine catch that a shallower audit would have missed. All three blockers are narrow: two
are missing `acceptable_answers` variants that the *real* matcher rejects (I ran it, rather than
reasoning about it), and one is a duplicate of a live question's fact that `verify.mjs` is
structurally unable to see because it compares stem strings, not facts. Fixing them is a
15-minute edit to three rows; nothing about the design needs to change. Round 2 should also add a
fact-level duplicate check (target dialogue + the transcript sentence quoted in the explanation)
to `verify.mjs`, since that is now a known blind spot.
