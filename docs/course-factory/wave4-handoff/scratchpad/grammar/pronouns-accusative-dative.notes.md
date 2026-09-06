# pronouns-accusative-dative.notes.md

## Coverage
A2.1, topic_order 10, slug `pronouns-accusative-dative`. 9 rules (intro -1, 1–7, summary 99)
/ 10 examples / 26 exercises (stage 4: 13, stage 5: 13; 23 typed, 3 multiple_choice — all
recognition now sits in stage 4, round-2 finding 7).
Prereqs `dative-case`, `prepositions-dative`; related `personal-pronouns`,
`prepositions-accusative`, `imperative-mood` (all live in grammar-content-cache.json).

Everything in the brief's scope line is taught **and** drilled:
- Akkusativ set mich/dich/ihn/sie/es/uns/euch/sie/Sie and Dativ set
  mir/dir/ihm/ihr/ihm/uns/euch/ihnen/Ihnen — rule 1 (Nom | Akk (wen?) | Dat (wem?) | Beispiel,
  9 rows). Drilled: ihn, mir, dich, uns, Ihnen, euch, mir, sie, dir, ihm, ihnen, es+ihm.
- helfen/danken/gefallen (+ gehören, schmecken, passen, antworten) + Dativ vs
  anrufen/besuchen (+ fragen, kennen, verstehen, brauchen, abholen) + Akkusativ — rule 2.
- Object order — rule 3 (4 steps): two nouns = Dat before Akk; one pronoun = pronoun first;
  two pronouns = Akk before Dat (Ich gebe es ihm); "kurz vor lang" as the single idea.
  Drilled in s4#13, s5#3, s5#7, s5#10, s5#11.
- Pronouns after prepositions — rule 4 (für/ohne/gegen + Akk, mit/bei/von/zu + Dat);
  drilled in s4#11, s4#12, s5#8, s5#12.
- Exam anchoring: topic description, rule -1 (`why_it_matters_en`), rule 5 (dialogue = the
  Sprechen Teil 3 register), rule 6 (a chunk list split by Schreiben Teil 1 / Schreiben Teil 2 /
  Sprechen Teil 3, plus a Hören Teil 1 note in `key_insight`).

**Build-on, not repeat.** Live `dative-case` already carries a Nom/Akk/Dat pronoun table (rule 4)
and one English-only sentence about the pronoun order (rule 7). This topic says so explicitly
("mir, dir und ihm kennst du schon aus dem Dativ. Neu ist die Spalte Akkusativ.", rule 1;
"Die Dativ-Verben kennst du aus Thema 1.", rule 2) and adds what the live topic does not have:
the example column, the verb-decides-the-case split, the order rule as a worked 4-step pattern
in German, the preposition case, a dialogue and 26 items of practice.

## Deliberate exclusions
- **No da-compounds** (dafür, damit, darauf). Preposition + pronoun is taught for **people
  only**, and rule 4's `formal_note` says so in both languages, so no learner is left with the
  false rule "für es". Naming them is recognition, not production; they are exercised nowhere.
- **No reflexive pronouns** (mich/dich as reflexives) — A2.2, banned here. Every mich/dich in
  the file is a true object.
- **es as a dative (ihm)** is in the table for completeness but is flagged as rare in
  `description_en` and is never exercised.
- No Nebensätze, no Präteritum of full verbs, no Komparativ, no Genitiv, no Futur, no zu-
  infinitives, no adjective endings (topic 9's material is not borrowed even though it precedes).
- Examples cover mich/mir/Ihnen/dich/ihn/ihr/ihm/es+ihm/dich(für)/uns(mit); **euch and ihnen
  appear in the rules and exercises only** (s4#6, s5#6, s5#13) — ten example slots did not
  stretch to all nine persons plus the order and preposition cases.

## Self-check results (re-run after round 3 — this block describes the CURRENT file)
- `node scripts/check-grammar-json.mjs …` — clean, **with and without** `--cache
  grammar-content-cache.json`.
- Longest German sentence: **12 real words** (well inside the A2.1 14-word cap). The round-1
  "13-token" figure was an artefact of counting "/" and "→" inside a bracket cue as words.
- 3 multiple_choice items, all in stage 4, keys at option positions **1 / 3 / 2**; 23 typed
  items (11 sentence_building + 8 fill_blank + 4 error_correction).
- Duplicate sweep (round 3 version): every produced sentence is reconstructed (fill_blank =
  question with the key filled in, cue stripped) and compared to the ten examples, to every
  German string in the rules and to every other exercise — **exact matches: 0 against examples,
  0 against other exercises**; the four rule matches are the disclosed ones below. A **fuzzy**
  pass (SequenceMatcher) now runs too: nothing above 0.85 anywhere, and the two pairs round 2's
  exact-only sweep missed are gone (s5#2 vs example 2 is 0.65 after the rewrite; s5#12 no longer
  shares example 9's frame).
- Every `word_breakdown` covers exactly the tokens of its `sentence_de`; every
  `grammar_highlight` is a substring of it; every `correct_answer` is in its
  `acceptable_answers`, with the with/without-final-period pair on all 23 typed items.
- MC distractors: none is correct German for the item's cue — s4#13 deliberately excludes
  "Ich gebe ihn ihm." (which *is* correct) and uses "Ich gebe es ihn."; s4#7 and s4#8 now carry
  case-competing distractors rather than throwaways (round-3 findings 5 and 6).
- 0 banned structures and 0 English function words in German fields (machine sweep). The two
  `als` occurrences ("als Objekte", "als feste Chunks") are the preposition, not the conjunction.

## Doubts for the reviewer
1. `related_slugs` contains only live slugs. The natural sibling links (`adjective-endings-intro`,
   `modal-verbs-past`, `temporal-prepositions`) are this wave's own and are **not** listed —
   flagging in case the wave editor wants them wired symmetrically after all four land.
2. s5#1 and s5#6 accept the fronted variant (Morgen rufe ich dich an. / Am Sonntag besuche ich
   euch.) even though `question_en` says "start with Ich", because live `basic-sentence-structure`
   teaches Position 1 is free (review-2 blocking 11/14). The other sentence_building items have no
   frontable adverbial, so they accept only the with/without-full-stop pair.
3. Rule 1's row label "sie (eine Frau)" vs "sie (Plural)" is my disambiguation of the four-way
   `sie` clash; if the renderer's Nominativ column is expected to hold bare forms only, this needs
   a different column.
4. `topic.difficulty: 2` and the emoji `icon` follow the brief, but the generator copies neither
   into `grammar_topics` (there is no difficulty column, and every live topic's icon is the string
   "book"). Harmless, but the wave may prefer `"icon": "book"` for consistency with live rows.
5. abholen (rule 2, rule 6, summary) is Goethe A2 Wortliste but is not among the twelve A1
   separable verbs; it appears in model German only, never as an exercise target.


## Round 2 changes (review `review-pronouns-accusative-dative-1.md`, FAIL: 1 blocking, 11 minor)

Every finding addressed; validator re-run clean with and without `--cache`.

1. **[BLOCKING] rule 1 claimed the accusative column was new.** It is live in
   `accusative-intro` rule 4 and `dative-case` rule 4. Re-framed as consolidation: title is now
   "Both Cases in One Table / Beide Fälle in einer Tabelle"; `description_de` = "Die Formen
   kennst du schon: mich, dich, ihn und mir, dir, ihm. Neu ist die Frage: Welchen Fall will das
   Verb?"; `description_en` names both live topics and says what is actually new (the case
   choice + the Beispiel column); `key_insight_*` rewritten to the same point. The uns/euch
   observation moved into `memory_trick_*` so nothing was lost.
2. **[2] s4#8 printed its own answer** ("sie = Frau Meier", key `sie`). Cue is now
   "(die Kollegin)"; `question_en` and both `explanation`/`why_correct` strings follow.
3. **[3] two items reproduced examples verbatim.** s4#5 "…für die E-Mail" → "…für die Blumen";
   s4#11 "Das Geschenk ist für ___" → "Der Kaffee ist für ___". The real check then found three
   more collisions the reviewer had not listed, all fixed too: s4#2 rebuilt example 2/s5#2
   ("Kannst du mir helfen?") → "Wer hilft mir heute?"; s4#3 rebuilt s5#1 → "Ich rufe dich später
   an."; s5#3 rebuilt s4#13 ("Ich gebe es ihm.") → "Ich bringe es euch."; s4#4 echoed example 6
   → "Der Film gefällt uns sehr."; s5#8 echoed the mistake table → "Ich komme mit ihr."
   Rule 2's `helfen` and `schmecken` cells were re-pointed for the same reason.
4. **[4] the "kurz vor lang" logic claim.** Step 4 now says the idea covers step 2 only, and
   states why it cannot cover step 3 (with two pronouns both words are short, so shortness
   decides nothing); rule 3's `description_*` no longer sells the three cases as "one idea".
5. **[5] untrue English claim.** "even though English says call to somebody" deleted; the
   mistake now contrasts anrufen (Akk) with helfen (Dat).
6. **[6] rule 6's third column.** Renamed `example` → `function` and the labels are now English
   ("asking for help", "thanking (dative)", …), so the rendered header "Function" matches its
   cells. Rule 2 keeps `example` — there the column really does hold German example sentences.
7. **[7] recognition in stage 5.** s5#11 and s5#12 converted to `sentence_building`
   ("[ich / zeigen / es / dem Chef]", "[das Geschenk / sein / von / ich]"). Stage 5 is now 13
   free-production items (11 sentence_building + 2 error_correction); all 3 MC sit in stage 4,
   keys at option positions 1/3/2.
8. **[8] cue/key contradiction.** "start with Ich" removed from s5#1's `question_en`; it now
   says the time phrase may open the sentence, which matches the fronted variants in the key.
9. **[9] gern/gerne.** s5#13 accepts "Ich helfe ihnen gerne." (+ no-period). No other item
   contains a gern/gerne-type alternation.
10. **[10] German in `_en` fields.** All five `verb_list` groups now carry `category_en`
    (English) plus `category_de` (the German label the renderer pairs with it).
11. **[11] the two-noun order pattern.** Rule 3 step 1 is now explicitly marked review
    ("Wiederholung: …", detail_en "Review from Dative Case, not new material … Steps 2 to 4 are
    the new part"), matching the fact that it is drilled in the live `dative-case` topic.
12. **[12] exam anchor / icon.** `description_de` now names Goethe A2 ("Bei Goethe A2 brauchst
    du sie in Schreiben Teil 1. In Sprechen Teil 3 fragst du: Kannst du mir helfen?").
    **Icon left as the emoji `👥` on purpose**: the wave brief mandates "icon (one emoji)", the
    field is rendered nowhere, and the generator does not copy it into a column the live rows
    would clash with — if the wave editor prefers matching the live `"book"` string, it is a
    one-token change.

### Deliberate residue after round 2
- Four exercises still produce a sentence that also appears in a rule: s4#9 / s4#10 / s5#9 are
  the error-correction drills of rule 7's mistake table (the pair is the point of the item), and
  s4#13's MC key "Ich gebe es ihm." is the canonical pattern sentence of rule 3 / the summary.
  No exercise duplicates an *example* or another exercise.
- The longest German sentence in the file is 12 real words (the 13-token figure reported in
  round 1's notes counted "/" and "→" inside a bracket cue as words).

## Round 3 changes (review `…-2.md`, PASS with 8 minors — all closed)

1. **[1]** rule 1 `description_en` now cites the live title exactly: "Accusative Case Intro"
   (was "Accusative Basics", which is no topic's name).
2. **[2]** rule 3 step 1 no longer claims steps 2–4 are new. It now says steps 2 and 3 exist in
   `dative-case` too, as one English sentence, and that what is new here is the German
   treatment, the split into steps and the practice — which matches the rule's own
   `key_insight_en`.
3. **[3]** s5#2 was example 2 minus "bitte". Rewritten to `[können / ihr / uns / helfen]` →
   "Könnt ihr uns helfen?" — new person, new number, and it drills the ihr/uns pair that the
   stage-5 set otherwise touched only once.
4. **[4]** s5#12 no longer reuses example 9's frame: `[die Blumen / sein / von / ich]` →
   "Die Blumen sind von mir." (was "Das Geschenk ist von mir.", fuzzy 0.78 against
   "Das Geschenk ist für dich.").
5. **[5]** s4#8 distractors are now `["ihr","ihn","ihnen","sie"]`: "eliminate the datives" no
   longer solves it, because ihn is accusative — the learner has to notice that die Kollegin is
   a woman. `why_correct_en` now says "ihn is the accusative of er" instead of calling ihm
   "masculine", mirroring the German string.
6. **[6]** s4#7 distractors are now `["mich","mir","ihn","dir"]` — two accusatives and a
   wrong-person dative, all of which can follow schmecken in shape; "ich"/"meine" (a nominative
   and a possessive) are gone. Both explanation strings name why each distractor fails.
7. **[7]** the stale "Self-check results" block above is rewritten to describe the current file
   (3 MC at positions 1/3/2; the 13-token claim retracted rather than left to contradict the
   residue section).
8. **[8]** `icon` set to `"book"` per the wave ruling — every live row in the cache uses it, and
   the brief's "one emoji" line was wrong. Round 2's deferral is closed.

### Residue after round 3 (deliberate, disclosed)
- Four exercises still produce a sentence that also appears in a rule: s4#9 / s4#10 / s5#9 are
  the error-correction twins of rule 7's mistake table (that pairing is the point of the item),
  and s4#13's MC key "Ich gebe es ihm." is the canonical pattern sentence of rule 3 / summary.
- Fuzzy neighbours in the 0.75–0.83 band are same-paradigm drills with a different person or
  noun (s4#5 "für die Blumen" vs example 3 "für die E-Mail" — the round-2 fix the reviewer asked
  for; s4#3 vs s5#9, both anrufen; s4#6 vs s5#6, both besuchen + euch). Deliberate repetition of
  one paradigm across two stages, not recall of the page above.
