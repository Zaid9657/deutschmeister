# Adversarial review — Wave 4 PR C2, A2.1 listening additions (round 2, delta)

Scope: the 3 blocking + 9 minor findings of `review-1.md`, every row the round-2 notes touch,
and a regression hunt for defects the fixes could have introduced.

## What I did

1. Diffed the current `questions-a2.1-additions.json` against the round-1 state I recorded,
   by `(exercise, question)` on `question_text` **and** `dialogue_number` — 8 stems changed and
   3 items moved dialogue (ex3 q23 d8→d3, ex6 q17 d4→d3, ex6 q23 d7→d5). Also re-read every
   dictation row in full (all 18 `acceptable_answers` lists were rewritten).
2. Re-solved cold, from the transcript, every changed item plus every item now sharing a
   dialogue with one: ex1 q16/q21, ex3 q17/q23 + q13, ex4 q20/q21/q22, ex5 q11/q15 + q23,
   ex6 q17 + q13, ex6 q23 + q15, ex1 q15/q22/q23, ex2 q22.
3. Ran `node verify.mjs` → `OK: 0 errors — 78 rows, 6 exercises, 1 existing-row edit(s)`.
4. **Mutation-tested the new fact check myself** on a copy, rather than trusting the notes:
   re-pointed ex1 q16 at the Milchprodukte sentence, moved ex3 q23 back to the d8 gate, and
   stripped the spelled variant from ex4 q22 → all three round-1 defects come back as errors
   (`same transcript sentence as live q6/q8 — duplicate fact`, `numeric answer has no
   spelled-out variant`). The check is real, and it independently confirms my round-1
   finding #1 as well as the author's own extra find on ex3 q23.
5. Ran the real `dictationMatches` over all 18 targets with ~200 probes of my own choosing —
   every legitimate form I could invent **plus ~60 wrong answers** to hunt for false positives
   (38,9 vs 39,8 · A3/A drei/1/3 vs A1 · 18:30 vs 19:30 · 9:50/11:50/15 vs 9:15 · 14,50/15
   vs 22 · 12/zwölf/18 vs 8:00 · 8/achtzehn vs 15:00 · vierter/zwölf vs 3). Result:
   **0 legitimate forms rejected, 0 wrong answers accepted.**
6. Re-ran the repo generator (`node scripts/listening-questions-from-json.mjs …`) → exit 0,
   78 INSERTs + 1 UPDATE. Re-swept stem lengths, options, explanation quotes against the
   transcripts, English tokens, dialogue spread, and the MC/RF grids.

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | questions-a2.1-additions.json ex5 q11 | MINOR | option "b) Ohne Kruste" | Weak distractor: a bakery cannot sell bread without crust, so it is eliminable without listening. a) "Am Stück" is the genuine spoken alternative and carries the item. | "b) Ohne Körner" or "b) Als halbes Brot". |
| 2 | questions-a2.1-additions.json ex1 q21 | MINOR | "Wie hoch ist das Fieber von ihrem Sohn?" | My own round-1 wording, and it is a shade dangling: in the flat question list "ihrem" has no antecedent inside the sentence (the anchor is q18's "Der kranke Sohn"). Not wrong — just noting I would not defend it as better than "vom kranken Sohn". | Optional: "Wie hoch ist das Fieber vom kranken Sohn?" |
| 3 | verify.mjs (structural) | MINOR | `quotedSentences(exN, d, explanation)` | The fact check is only as honest as the explanations: it maps an item to the sentence its *explanation quotes*, not to the sentence its *answer* actually comes from. An item whose explanation quoted the wrong line would pass. I checked all 78 by hand for exactly this and found no mismatch (0 quote misses, every quote is the answer's own sentence), so it holds today. | Nothing now; keep the invariant "the explanation quotes the sentence the key comes from" in `notes.md` for the next wave. |
| 4 | questions-a2.1-additions.json ex6 q23 | MINOR (note) | key `A1`, "Auf welcher Autobahn gibt es keinen Stau mehr?" | An Autobahn number is the loosest fit to the brief's target list ("…platform/room number"), and dropping the phone number leaves the 18 dictations with no long digit-string target. It is the same alphanumeric shape as the retired B17, the E6 "≥2 times/platforms" rule is still met by 8:00 + 15:00, and d7's typing load drops from 3 items to 2 — a fair trade. | None. |

### Verified fixed (each re-solved cold against the transcript)

- **B1 ex1 q16** → "Die Frau war am Samstag im Restaurant." (Falsch; audio "Am Sonntag war ich
  in einem Restaurant"). Own sentence, no live overlap, grid position still Falsch.
- **B2 ex1 q22** → "3x", "3 x", "3 mal täglich", "dreimal am Tag", "maximal dreimal", "drei"
  all now accepted; "zweimal"/"2"/"4"/"viermal" still rejected.
- **B3 ex4 q22** → "drei", "3. Stock", "3.Stock", "3 Stock", "im 3. Stock" accepted;
  "zwölf"/"12" (the house number in the same line) still rejected. The spelled-cardinal rule
  is now machine-enforced for all 18 items, and my mutation test confirms the enforcement.
- **Minors** #5 ex3 q17 ("In welchem Wagen reserviert der Mann einen Platz?"), #6 ex5 q15
  (now "Thriller", explanation quotes the Thriller sentence), #7 "a) Ins Bein", #9 the "Wie
  heißt das Gate" wording is gone with the item, #10 dialogue load — **max is now 2 new items
  per dialogue in every exercise** (was 3 on ex6 d7), #11 `ALLOWED_EDIT_FIELDS` narrowed to
  `['options']` with the generator throw named in a comment, #12 "in 4 Wochen"/"in vier Wochen".
  #4 (live ex1 q9's unresolved "gebrochen") is correctly parked in the transcript/stem ticket
  alongside ex1 q1/q3 Genitiv, the ex2 d9 + ex4 d8 speaker labels and ex6 d4 "Letzer Aufruf".
- **The four extra overlaps the author found and fixed are real** — I reproduced the ex3 q23 /
  live q8 collision by mutation (18:30 and Gate B17 are one sentence). The single documented
  exception `FACT_SHARING_EXCEPTIONS = {'6:21+22'}` is justified and minimal: d7 states both
  Sprechzeiten in one sentence and neither time can be derived from the other.

### No regressions

New/moved items re-solved and clean: ex3 q23 (9:15 is the only departure time; "Schreiben Sie
die Uhrzeit" rules out the 15. März date; 11:50 is the arrival), ex6 q17 ("nur heute" is
unique), ex6 q23 (A1 flows freely, A3 has the Stau), ex5 q11 ("Geschnitten, bitte"), ex1 q16.
No new give-away (ex6 q15 and live q5 both print "A3" on the page but neither yields "A1"; d3's
"15 Euro" option does not collide with 9:15). No new fact overlap on the three receiving
dialogues (ex3 d3, ex6 d3, ex6 d5 each now carry two new items resting on different sentences,
plus a live item on a third). Shape intact: 78 rows, 13/exercise, q11–23, 5/5/3, all ten
dialogues covered in every exercise, MC key grid a,c,b,a,c / b,a,c,b,a / c,b,a,c,b / a,b,c,a,b /
c,a,b,c,a / b,c,a,b,c and the RF grid unchanged from the notes, 15 Richtig / 15 Falsch, longest
single sentence 8 words, no banned grammar, no English beyond "Boarding" (in the audio, and
live q4 already says "Gate"). The `existing-row-edits.json` entry is untouched and still
byte-exact.

VERDICT: PASS

All three blockers are genuinely closed, and closed at the level of the mechanism rather than
the instance: the duplicate-fact defect produced a fact-level check in `verify.mjs` that I
mutation-tested and that caught two further overlaps the review had missed, and the two
acceptable_answers defects produced a spelled-cardinal rule enforced on all 18 items. I could
not find a legitimate typed answer the matcher rejects, nor a wrong one it accepts, in ~200
probes. The four remaining minors are cosmetic or structural notes; none should hold the PR.
The transcript/stem ticket (Genitiv stems, ex1 q9, two speaker-label bugs, "Letzer Aufruf")
still needs an owner outside this file.
