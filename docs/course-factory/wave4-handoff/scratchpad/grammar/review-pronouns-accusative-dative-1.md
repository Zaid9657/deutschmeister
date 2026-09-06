# Adversarial review — `pronouns-accusative-dative` (round 1)

Reviewer: Opus. Deliverable: `S/wave4/grammar/pronouns-accusative-dative.json` +
`.notes.md`. Measured against `S/wave4/level-a2.1.md` (binding) and
`S/wave4/grammar-brief.md`.

## What I actually did (so this review can be audited)

1. Read `level-a2.1.md`, `grammar-brief.md`, then the whole JSON (9 rules / 10 examples /
   26 exercises) and the notes file.
2. **Re-solved all 26 exercises cold** (own answer written before reading `correct_answer`),
   and checked every one of the 5 MC items for a second defensible option.
3. Verified the case of **every** object pronoun against its governing verb or preposition —
   all of anrufen/besuchen/fragen/kennen/verstehen/brauchen/abholen/sehen/haben/suchen/nehmen/
   zeigen (Akk) and helfen/danken/gefallen/gehören/schmecken/passen/antworten/schreiben/schicken
   (Dat), plus für/ohne/gegen (Akk) and mit/bei/von/zu/nach (Dat). **No case error found.**
4. Ran the validator, twice — with and without the content cache:
   ```
   $ node scripts/check-grammar-json.mjs …/pronouns-accusative-dative.json
   OK: 1 file(s) validated, no violations.
   $ node scripts/check-grammar-json.mjs …/pronouns-accusative-dative.json --cache grammar-content-cache.json
   OK: 1 file(s) validated, no violations.
   ```
5. Machine-scanned every German field for banned grammar (Präteritum of full verbs, sich-,
   weil/dass/wenn/ob, um…zu / zu+Inf, Komparativ, Futur, Genitiv, würde/könnte/hätte) and for
   the 14-word cap: **zero hits; longest German sentence is 12 words.** Checked `related_slugs`
   / `prerequisite_slugs` against `grammar-content-cache.json` (all five exist), `topic_order`
   10 against the live A2.1 rows (1–8, no collision), the `-1 … 99` order convention against
   the shipped `wave3/grammar/imperative.json` (matches — not a finding).
6. Checked shape against the real renderer, `astro-site/src/components/RuleContent.astro`, and
   the grader in `astro-site/src/components/ExercisePlayer.jsx` (normalises case, whitespace
   and umlauts, **not** punctuation) — so the case variants in `acceptable_answers` are
   redundant but the with/without-period pairs are load-bearing, and they are all present.
7. Diffed the topic against the live rows it is closest to: `dative-case` (11 rules),
   `accusative-intro` (9 rules), `personal-pronouns` (5 rules).

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | json → rules[order_index 1].content.description_de / description_en | **BLOCKING** | "mir, dir und ihm kennst du schon aus dem Dativ. **Neu ist die Spalte Akkusativ.**" / "You already know mir, dir and ihm from Dative Case — the accusative column is the new part." | False about this curriculum, and it is the sole justification given for re-printing a table the brief names as not-to-duplicate. The Akkusativ column is **already live twice**: `accusative-intro` (A1.2, order 3) rule 4 is a table literally titled *Accusative Pronouns* with the full ich→mich … sie/Sie→sie/Sie paradigm, and `dative-case` (A2.1, order 1) rule 4 *Dative Pronouns* prints Nominative / **Accusative** / Dative / English for all 8 rows. Rule 1 here is that same paradigm with a Beispiel column bolted on. A learner who did topics 3 and 1 meets the identical grid a third time under a claim that it is new. | Keep the table (the Beispiel column and the wen?/wem? headers do earn their place) but re-frame it as consolidation, not novelty — e.g. `description_de`: "Die Formen kennst du: mich, dich, ihn aus dem Akkusativ und mir, dir, ihm aus dem Dativ. Neu ist die Frage: Welchen Fall will das Verb?" and mirror it in `description_en`. Nothing else in the file has to move. |
| 2 | json → exercises stage 4 #8 | MINOR | `question_de`: "Ich rufe ___ heute Abend an. (sie = Frau Meier)" — key `sie` | The cue prints the answer token verbatim, so the item is solvable without knowing that anrufen takes the accusative; it tests nothing. (Contrast #1/#3, where the cue is the nominative and the answer differs.) | Cue the person, not the form: "(Frau Meier)" or "(die Kollegin)". |
| 3 | json → exercises stage 4 #5 and #11 | MINOR | s4#5 filled = "Ich danke Ihnen für die E-Mail." = examples[3]; s4#11 filled = "Das Geschenk ist für dich." = examples[9] | Two items reproduce example sentences verbatim, so they drill recall of the page above rather than the rule. The notes assert the opposite ("no example sentence is reused as an exercise answer") — that self-check claim is wrong and should not be trusted in round 2. | Vary one noun in each ("für die Einladung", "für deine Schwester"), or vary the person. |
| 4 | json → rules[3].content.steps[4].detail_en | MINOR | "Pronouns are short words … **That single idea covers steps 2 and 3.**" | It does not. With two pronouns both objects are short, so "kurz vor lang" yields no ordering — step 3 (Akk before Dat) is an extra fact, not a consequence. Teaching it as one idea invites a learner to derive the wrong order under pressure. | "That idea covers step 2. Step 3 is a separate fact you must learn: with two pronouns the accusative comes first." |
| 5 | json → rules[7].common_mistakes[2].explanation_en | MINOR | "anrufen takes the accusative … **even though English says call to somebody**" | English does not say *call to somebody*; it says *call somebody*. The contrast offered to justify the German is simply untrue, and English is the learner's anchor language here. | Drop the clause, or contrast with the dative twin: "…unlike helfen, which takes the dative." |
| 6 | json → rules[6] (`tip`, content.type `verb_list`) | MINOR | `{"de":"Ich danke Ihnen für die Einladung.","en":"Thank you for the invitation.","example":"danken + Dativ"}` | `RuleContent.astro` renders a `verbs[]` array of flat objects as an objtable with `humanize(key)` headers → the page shows columns **De | En | Example** in which the "Example" cell holds a German function label ("um Hilfe bitten", "absagen", "danken + Dativ"). The rendered column semantics are wrong even though the JSON validates. | Rename the third key so the header reads as what it is (e.g. `funktion`), or move the label into the group heading. |
| 7 | json → exercises stage 5 #11, #12 | MINOR | two `multiple_choice` items in stage 5 | The brief assigns stage 5 to **free production** (sentence_building with cue brackets); recognition belongs in stage 4. Both items are good — they are just in the wrong stage. | Swap them with two stage-4 typed items, or convert to error_correction. |
| 8 | json → exercises stage 5 #1 vs #6 | MINOR | s5#1 `question_en` "…(verb: anrufen, accusative, **start with Ich**)" but `acceptable_answers` contains "Morgen rufe ich dich an." | Cue and key contradict each other; s5#6, the twin item, accepts the same fronting and its cue correctly omits "start with Ich". Being generous in the key is right — the cue is what is wrong. | Delete "start with Ich" from s5#1's `question_en`. |
| 9 | json → exercises stage 5 #13 | MINOR | key "Ich helfe ihnen gern." (+ no-period variant only) | The grader folds case/whitespace/umlauts but not the gern/gerne alternation; a learner writing the equally standard "Ich helfe ihnen gerne." is marked wrong. | Add "Ich helfe ihnen gerne." and "Ich helfe ihnen gerne". |
| 10 | json → rules[2].content.groups[].category_en, rules[6] same | MINOR | `"category_en": "Verben mit Akkusativ (wen?)"` | German text in an `_en` field; the renderer treats `*_en` as the EN-primary line, so the English column of two rules is German. Not wrong German, but the bilingual contract is inverted. | Add `category_de` with the German and put English in `category_en`. |
| 11 | json → rules[3] vs exercises | MINOR | step 1 "Zwei Nomen: Dativ vor Akkusativ. Ich gebe dem Kind das Buch." | Of the four order patterns taught, the two-noun one is the only one never practised (s4#13, s5#3, s5#10 = two pronouns; s5#7, s5#11 = pronoun + noun). It is live in `dative-case`, so this is defensible — but then step 1 should say so rather than presenting it as new material. | Either add one two-noun item, or mark step 1 explicitly as review. |
| 12 | json → topic.description_de; topic.icon | MINOR | `description_de` names "Schreiben Teil 1 und Sprechen Teil 3" but never "Goethe A2"; `"icon": "👥"` | The exam anchor is named in the English description only; and every live topic row — including the shipped `wave3` imperative.json — carries `"icon": "book"`, so the emoji is the odd one out (harmless: no grammar page renders the field). | Add "Goethe A2" to `description_de`; align the icon with the wave editor's decision. |

## Verdict

**VERDICT: FAIL (1 blocking, 11 minor)**

This is a strong, careful deliverable: the German is clean throughout, the case government is
right in every single sentence I checked, the level constraint holds (no banned structure, no
sentence over 12 words), the validator passes with and without the cache, and none of the five
MC items has a second defensible answer — including the trap the notes claim to have avoided
(s4#13 correctly excludes "Ich gebe ihn ihm."). The one blocker is not a German error but a
curriculum one: rule 1 re-prints a pronoun grid that is already live in two topics, and defends
itself with a claim about the learner's prior knowledge that the live content contradicts. Fix
the two description strings and the file ships; findings 2–5 are the ones worth spending a
second round on after that.
