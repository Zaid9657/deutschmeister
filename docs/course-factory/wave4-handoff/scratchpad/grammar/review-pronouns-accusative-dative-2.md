# Adversarial review — `pronouns-accusative-dative` (round 2, delta)

Reviewer: Opus. Deliverable: `S/wave4/grammar/pronouns-accusative-dative.json` + `.notes.md`.
Measured against `S/wave4/level-a2.1.md` (binding) and `S/wave4/grammar-brief.md`.
Round-1 review: `review-pronouns-accusative-dative-1.md` (FAIL: 1 blocking, 11 minor).

## What I actually did (so this review can be audited)

1. Re-read the level file, the brief, the whole JSON and the notes, including the author's
   "Round 2 changes" section, and verified **each of the 12 round-1 findings against the file
   itself** (table below) rather than against the author's claim.
2. **Re-solved cold** every exercise whose text changed — s4#2, #3, #4, #5, #8, #11 and
   s5#1, #3, #8, #11, #12, #13 — writing my own answer before opening `correct_answer`.
   All twelve keys match my answer. I also re-checked the three surviving MC items for a
   second defensible option (s4#7 mir; s4#8 sie; s4#13 "Ich gebe es ihm." — the correct-German
   trap "Ich gebe ihn ihm." is still correctly absent, and "Ich gebe ihm ihn." is wrong on both
   order and reference).
3. Ran the validator twice:
   ```
   $ node scripts/check-grammar-json.mjs …/pronouns-accusative-dative.json
   OK: 1 file(s) validated, no violations.
   $ node scripts/check-grammar-json.mjs …/pronouns-accusative-dative.json --cache grammar-content-cache.json
   OK: 1 file(s) validated, no violations.
   ```
4. Re-ran the machine sweeps on the **edited** file: banned grammar (sich-, weil/dass/wenn/ob,
   um…zu, Futur, Konjunktiv II, Präteritum of full verbs, Komparativ, Genitiv) over all 478
   German-side strings — **0 hits**; sentence length — **longest German sentence is 12 words**,
   nothing over the 14-word cap; English function words in `_de` fields and German in `_en`
   fields — **0 hits** (finding 10 is genuinely closed).
5. Rebuilt every exercise's produced sentence (fill_blanks reconstructed with the key filled in
   and the cue stripped) and diffed it against the 10 examples, against every German string in
   the rules, and against every other exercise: **0 example collisions, 0 exercise↔exercise
   collisions.** The only rule collisions are the four the notes disclose (s4#9/s4#10/s5#9 are
   the error-correction twins of rule 7's mistake table; s4#13 is the canonical pattern
   sentence) — that residue is legitimate. I then ran a **fuzzy** pass (SequenceMatcher > 0.6),
   which is where findings 3 and 4 below come from.
6. Checked the round-1 blocker's factual basis against `grammar-content-cache.json` again:
   `accusative-intro` (A1.2, order 3) rule 4 "Accusative Pronouns" and `dative-case` (A2.1,
   order 1) rule 4 "Dative Pronouns" both exist as round 1 described, so the new consolidation
   framing is now **true**. I also read `dative-case` rule 7 in full — which is what produces
   finding 2.
7. Re-checked the renderer for the two shape fixes: `RuleContent.astro` puts `category` in
   `NO_LABEL` and pairs `_en`/`_de` siblings, so the added `category_de` renders as a German
   sub-line (fix 10 renders correctly); `unionKeys`+`humanize` now emit **De | En | Function**
   for rule 6, so fix 6 lands. Note the shipped `wave3/grammar/imperative.json` still has the
   old shape (German in `category_en`, `example` holding a label) — this file is now *better*
   than its own precedent.
8. Re-read the grader (`ExercisePlayer.jsx` `normalizeAnswer`): case, whitespace and umlaut
   spellings fold, **punctuation does not**. Every one of the 23 typed items carries its
   with/without-final-period pair, s5#13 now carries gern **and** gerne in both punctuations,
   and no typed item has a legitimate answer missing from `acceptable_answers` that I could
   construct. Shape re-counted: 9 rules (-1,1–7,99), 10 examples, 26 exercises (13/13),
   23 typed / 3 MC, all MC in stage 4 with keys at option positions 1/3/2, page title 67 chars.

## Round-1 findings: verified status

| R1 # | severity then | status now | evidence |
|---|---|---|---|
| 1 | BLOCKING | **FIXED** | Title is now "Both Cases in One Table"; `description_de` = "Die Formen kennst du schon … Neu ist die Frage: Welchen Fall will das Verb?"; `key_insight_*` reframed as consolidation. The false "Neu ist die Spalte Akkusativ" is gone from the file. (Residual naming slip → new finding 1.) |
| 2 | MINOR | FIXED | s4#8 cue is "(die Kollegin)"; the answer token no longer appears in the prompt. |
| 3 | MINOR | FIXED (and over-delivered) | s4#5 → "für die Blumen", s4#11 → "Der Kaffee ist für ___", plus five self-found rebuilds. My independent exact-match sweep confirms 0 example collisions. |
| 4 | MINOR | FIXED | Step 4 now: "That idea covers step 2. Step 3 is a separate fact … both words are short, so shortness decides nothing." |
| 5 | MINOR | FIXED | "call to somebody" deleted; the mistake now reads "unlike helfen, which takes the dative." |
| 6 | MINOR | FIXED | `example` → `function` with English labels; verified against `humanize()`. |
| 7 | MINOR | FIXED | s5#11/#12 are `sentence_building` with bracket cues; stage 5 is 11 sentence_building + 2 error_correction, 0 MC. |
| 8 | MINOR | FIXED | "start with Ich" gone from s5#1; cue now says the time phrase may open the sentence, matching the fronted variants in the key. Every other s5 cue is consistent with its key. |
| 9 | MINOR | FIXED | s5#13 accepts gern/gerne × with/without period. No other item has a comparable alternation. |
| 10 | MINOR | FIXED | All five `verb_list` groups carry English `category_en` + German `category_de`; 0 German hits in `_en` fields. |
| 11 | MINOR | FIXED (by the marking route) | Step 1 is "Wiederholung: …" / "Review from Dative Case, not new material". Still no two-noun exercise, which round 1 explicitly allowed. |
| 12 | MINOR | PART-FIXED | `description_de` now names Goethe A2. Icon deliberately left as `👥` (brief mandates an emoji, live rows all say `"book"`) → carried forward as finding 6. |

## New / residual findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | json → rules[1].content.description_en | MINOR | "you learnt mich/dich/ihn in **Accusative Basics** and the whole table in Dative Case" | The round-2 fix replaced a false claim with a slightly wrong citation: no live topic is called "Accusative Basics". The cache has `accusative-intro`, title **"Accusative Case Intro"**. "Dative Case" is exact, so the mismatch is visible side by side. | Write "Accusative Case Intro". |
| 2 | json → rules[3].content.steps[0].detail_en | MINOR | "Review from Dative Case, not new material … **Steps 2 to 4 are the new part.**" | Half of that is the round-1 blocker in miniature. Live `dative-case` rule 7 already states step 2 *and* step 3: "Exception: if one is a pronoun, the pronoun comes first: 'Ich gebe es ihm' (acc pronoun before dat)", with key_insight "Two nouns: Dative first. Pronoun involved: Pronoun first." What is new here is the German treatment, the 4-step split and the drilling — not the facts. The rule's own `key_insight_en` already gets this right ("Dative before accusative is the noun rule from Dative Case"). | "Steps 2 and 3 exist in Dative Case as one English sentence; here you practise them in German." |
| 3 | json → exercises stage 5 #2 vs examples[1] | MINOR | example 2 `sentence_de` "Kannst du mir bitte helfen?" / s5#2 key "Kannst du mir helfen?" | s5#2 is example 2 minus one word — and the same chunk is printed a third time in rule 6 (Schreiben Teil 1). The round-2 duplicate sweep compares exact strings, so it rebuilt s4#2 for colliding with this item while leaving the item's own near-verbatim echo of the example in place. Lower stakes than round-1 finding 3 (the bracket cue hands over the words anyway), but the "drills the page above, not the rule" objection is unchanged. | Change the person or the verb: `[können / ihr / uns / helfen]` → "Könnt ihr uns helfen?" |
| 4 | json → exercises stage 5 #12 vs examples[8] | MINOR | s5#12 key "Das Geschenk ist von mir." / example 9 "Das Geschenk ist für dich." | The frame the round-2 fix deleted from s4#11 ("Das Geschenk ist für ___" → "Der Kaffee ist für ___") reappears in the item converted in the same round; net, the echo moved rather than left. Fuzzy similarity 0.78. Not a duplicate — worth one noun's worth of edit. | `[die Blumen / sein / von / ich]` → "Die Blumen sind von mir." (or reuse Kaffee). |
| 5 | json → exercises stage 4 #8 (options, why_correct_en) | MINOR | options `["ihr","ihm","ihnen","sie"]`; "ihr and ihnen are dative forms, **ihm is masculine** — only sie is the accusative here" | Three distractors are dative and one option is accusative, so the item is solvable by "eliminate the datives" without ever identifying the gender of die Kollegin — which is the second half of what the round-2 cue rewrite was meant to test. And `why_correct_en` calls ihm "masculine" where `why_correct_de` correctly says "der Dativ von er"; loose in the learner's anchor language. | Swap one distractor for `ihn` (accusative, wrong gender), and mirror the German wording: "ihm is the dative of er". |
| 6 | json → exercises stage 4 #7 options | MINOR | `["mich","mir","ich","meine"]` | Only mich is a real competitor; "ich" is a nominative and "meine" is not a personal pronoun at all, so a difficulty-2 item degenerates to a two-way choice. (Round 1 checked the MC items for a *second correct* answer, not for distractor strength.) | Use forms that could plausibly follow schmecken: mich / mir / ihn / dir. |
| 7 | notes.md → "Self-check results" | MINOR | "MC keys sit at option positions 1, 3, 2, 0, 2"; "the only one over 12 is the 13-token bracket cue of s5#4" | Both bullets describe the pre-round-2 file: there are now three MC items (positions 1/3/2), and the residue section at the bottom of the same document retracts the 13-token claim. A notes file that contradicts itself is the artefact the next round trusts. | Update the self-check block, or delete the two stale bullets. |
| 8 | json → topic.icon | MINOR (carried, needs the wave editor) | `"icon": "👥"` | Unchanged and consciously so: the brief says "icon (one emoji)", every live row in the cache says `"book"`. The author cannot resolve a brief-vs-live conflict; the wave editor can. Field renders nowhere, so nothing breaks either way. | Wave editor decides once for all four Wave 4 topics. |

## Verdict

**VERDICT: PASS** (0 blocking, 8 minor)

The blocking finding is genuinely fixed, not papered over, and all eleven minors are fixed or
consciously deferred; the five self-found duplicate collisions are real and my independent
sweep confirms none survives. I attacked this round on the edited strings specifically —
re-solving all twelve changed items cold, fuzzy-matching (not just exact-matching) every
produced sentence against the examples and rules, re-reading the renderer to confirm the two
shape fixes actually render, and re-checking the two live topics the reframed claims now cite.
That last check is what produced findings 1 and 2: both round-2 rewrites of a curriculum claim
are *closer* to the truth than what they replaced but still not exactly true, and findings 3
and 4 show a duplicate sweep that matched exact strings only. None of it blocks the ship;
findings 1, 2 and 5 are the ones worth a third pass.
