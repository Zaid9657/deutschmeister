# adjective-endings-intro.notes.md

Topic 9, A2.1. 9 rules / 10 examples / 26 exercises (**21 typed, 5 MC**; stage 4 = 13,
stage 5 = 13, all thirteen stage-5 items `sentence_building`). Validator, both ways:
`OK: 1 file(s) validated, no violations.` (round 2 — see the change log at the end).

## Coverage vs. the level file's scope line

Every cell the level file names is taught in a table, drilled at least once, and
summarised:

- **der/die/das (weak), Nom/Akk/Dat + Plural** — rule 2 table (12 cells).
  Drilled: s4#01 (Nom m), s5#02 (Akk f), s4#02/s4#10 (Akk m), s4#03/s5#05 (Dat f),
  s5#12 (Dat n), s4#08 (Dat m), s4#04 (Nom pl), s5#13 (Dat pl + noun -n).
- **ein/eine/kein/mein, Nom/Akk/Dat + Plural** — rule 3 table (12 cells).
  Drilled: s4#05 (Nom m -er), s4#09/s5#01/s5#07 (n -es), s4#06 (Akk n -es),
  s4#07/s5#04/s5#11 (Akk m -en), s4#11/s5#03 (Dat f/n -en), s5#06 (kein, Nom f),
  s4#13/s5#08 (mein, Dat pl -en + noun -n).
- **Predicative endingless** — rule 1 is built on it, rule 6 line 2, examples 2/5/10,
  s4#12, common_mistakes #4.
- **Plural -en after der/kein/mein** — rule 2 + rule 3 plural columns, s4#04, s4#13,
  s5#08, s5#13, summary points 7/8/12.
- **Frozen chunks** — rule 5 (Guten Morgen/Tag/Abend, Guten Appetit, Schönes
  Wochenende, Liebe Grüße, Viele Grüße), example 10, summary point 13.

Exam anchoring: Schreiben Teil 1 (SMS) + Teil 2 (E-Mail) in topic.description, rule -1
`why_it_matters_en`, rule 5 `formal_note_en/de`; Sprechen Teil 2 in topic.description,
rule -1 and rule 6 (`dialogue`) `key_insight`. s5#09 produces the literal e-mail
sign-off sentence ("Ich wünsche dir ein schönes Wochenende.").

Builds on, does not repeat, the live A2.1 topics: helfen/geben/schreiben + Dativ and the
dative-plural noun -n are cited as *known* (rule 2 description_en "you know that -n from
dative-case", s5#05 why_correct_de "helfen mit Dativ kennst du aus dem Dativ-Thema"),
`mit/in` + Dativ come from prepositions-dative / two-way-prepositions, mein/dein from
possessive-pronouns. No rule re-teaches an article table for its own sake.

## Deliberate exclusions

- **Null-article (strong) declension** — out of scope per the level file; rule 5 says
  explicitly that the frozen chunks follow a third pattern that arrives at B1, so the
  learner is not told they follow the two tables. No null-article plural anywhere,
  including rule titles ("Fünf Fehler mit den Endungen", not "Häufige Fehler").
- **teuer / dunkel / hoch** (stem-shortening adjectives: teures, dunkles, hohes) and
  **viel/wenig** — avoided entirely; they are a separate sub-rule and would be a defect
  magnet at A2.1.
- **n-declension nouns** (Kollege, Nachbar, Junge) never appear in Akk/Dat singular —
  "Die neuen Kollegen" (ex. 5) is nominative plural, which is unaffected.
- **Komparativ, Genitiv, Nebensätze, Passiv, zu-Infinitiv, Reflexiva, Futur, Präteritum
  of full verbs** — none present; checked programmatically over every German string.
- `etwas Gutes` / `alles Gute` (nominalised adjectives) — B1.

## Shape deviations from the brief (deliberate, please confirm)

1. **`icon`: `"book"`, not an emoji.** The brief says "one emoji"; the shipped Wave 3
   reference (`imperative.json`) and **all 64 live topics in `grammar-content-cache.json`**
   carry the literal string `"book"`. I followed the reference and the DB, not the brief.
   Trivially changed if the reviewer prefers an emoji.
2. **No `difficulty` on `topic`.** The brief lists it, but `public.grammar_topics` has no
   such column (see the INSERT in `scripts/grammar-topics-from-json.mjs`) and no live
   topic carries one. Per-row `difficulty` (1–3) is present on all 10 examples and all 26
   exercises as required.
3. **Rule `order_index` is -1, 1..7, 99**, not "1..n contiguous" — the validator demands
   exactly one rule at -1 (introduction) and exactly one at 99 (summary).

## Answer-key / review defences

- **MC key positions rotate**: options[0] ×2, [1] ×2, [2] ×3, [3] ×1. No "always pick the
  first" pass (the wave-3 review found 12/12 keys at index 0).
- **Position 1 is free**: s5#04 is the only stage-5 cue containing a frontable adverb
  (`heute`), and both orders are in `acceptable_answers`, stated in `question_en` and in
  `why_correct_de`. s5#03 also accepts the fronted "In einem großen Büro arbeiten wir."
  No `why_correct` string asserts that the subject is fixed in position 1.
- **ONE `acceptable_answers` policy, applied mechanically** (round 2): a whole-sentence
  answer lists {initial capital, initial lowercase} x {".", no final punctuation, "!"} = 6
  forms, 12 where two word orders are legitimate (s5#03, s5#04); a single-word fill_blank
  answer sits mid-sentence, never sentence-initial and never sentence-final, so it lists
  exactly the one form the slot admits. `correct_answer` is always the first entry.
- **No example sentence is reused verbatim as an exercise prompt or key** — checked
  programmatically; every one of the 26 items uses a noun/adjective pairing that appears
  in no example.
- **Every distractor is genuinely wrong.** Checked one by one: no distractor yields a
  grammatical German sentence that the cue fails to exclude (the wave-3 review's
  "war"/"von dem" defect class).
- **Word-count**: no German sentence anywhere exceeds 12 words except three stage-5
  `question_de` strings that read `Schreib den Satz: [wir / arbeiten / in / ein / groß /
  Büro]` — 3 words of German prose plus the bracket cue token list the brief mandates.
  Flagging rather than hiding: if the reviewer counts cue tokens, shorten the lead-in.

## Doubts for the reviewer

1. **`related_slugs` = `["accusative-intro", "adjective-declension-weak-mixed"]`.** The
   brief says existing slugs only, so I did not point at this wave's siblings
   (pronouns-accusative-dative, modal-verbs-past, temporal-prepositions) — they are not in
   the cache yet. `adjective-declension-weak-mixed` (B1.2 5) is the forward continuation and
   `adjective-declension-strong` (B1.2 4) is where the frozen chunks are explained; only the
   first is linked. Prereqs (`dative-case`, `possessive-pronouns`) are not repeated in
   related_slugs — the wave-3 review flagged that duplication twice.
2. **B1.2 `adjective-declension-weak-mixed` already ships a clothes-shop dialogue** with
   "einen warmen Pullover / der blaue Pullover". I deliberately used a *new-job* dialogue
   and avoided "warmen Pullover", but example 3 is "Ich kaufe den grünen Pullover." — one
   noun in common. Say the word and I will swap the noun.
3. **s4#13 and s5#13 both drill dative plural with `mit`** (meinen guten Freunden / den
   neuen Bussen). Intentional — the mein-word vs der-word contrast is the point. Confirmed
   not-a-duplicate by review 1.
4. **`Ärztin` (s4#03), `Getränk` (s5#07), `bestellen` (s5#07), `U-Bahn` (rule 6)** are my
   judgement calls on the Goethe A2 Wortliste; all four feel safely inside it, but I could
   not check the list offline.
5. ~~s5#13 "mit den neuen Zügen"~~ — resolved in round 2 (review minor 12): now
   "Wir fahren mit den neuen Bussen.", same cell, idiomatic.
6. **The topic never mentions that `viele Grüße` and `liebe Grüße` are usually written
   lowercase mid-sentence.** Rule 5 and example-free summary point 13 print them
   capitalised as sign-offs, which is how a learner will write them. Left as chunks on
   purpose; flagging in case the reviewer wants the nuance.


---

# Round 2 changes (against review-adjective-endings-intro-1.md)

Every finding, blocking and minor, is addressed. Nothing else in the file moved: **no answer
key changed**, all 24 table cells, all 10 examples and the topic block are untouched except
where a finding names them.

| # | sev | change made |
|---|---|---|
| 1 | BLOCKING | `rules[4].content.steps[2]`: `title_de` → "Welcher Fall? Und maskulin, feminin, neutrum oder Plural?"; `title_en` → "Which case — and which gender, or plural?". Step 3 now separates case from gender/number the way rule 2's table does (Fall = the row label, gender/plural = the headers). `detail_de` was already right and is unchanged. |
| 2 | BLOCKING | `rules[5].key_insight_de`: "Lerne sie als festen Ausdruck." → **"Lerne sie komplett."** — the file's only null-article adjective ending is gone (`festen Ausdruck` now occurs 0 times). `key_insight_en` follows: "Learn each one whole." (Note: the coordinator's suggested "als feste Wendung" would have been the same defect — strong feminine accusative after a null article — so it was not used.) |
| 3 | BLOCKING | One policy, generated by a helper (`sv()` in the builder) rather than typed per item, so it cannot drift: whole sentence → {cap, lowercase} x {".", "", "!"} = 6 entries; two legitimate word orders → 12 (s5#03, s5#04, both orders now getting both casings *and* all three endings); single-word fill_blank → exactly 1. s4#08 regenerated from the same helper. This also fixes minor 11 (s5#09's "…Wochenende!") as a side effect of the policy rather than as a special case. A self-check asserts the full expected set for all 21 typed items. |
| 4 | minor | Cell miscount: `rules[3].content.description_en` now says "two new endings, -er and -es, **in three cells**"; summary point [8] → "Nach ein, kein, mein sind zwei **Endungen** neu: -er und -es." and [9] → "-er ist maskulin: ein guter Mann. -es ist neutrum: ein gutes Kind." |
| 5 | minor | Metalinguistic "becomes" now carries *aus* in all six places: examples[2] ("Aus der Pullover wird den Pullover."), s5#09 ("Aus du wird dir."), s5#13 ("Aus die Busse wird den Bussen."), plus s4#10 x2 and s5#05, which the review left as acceptable — made uniform so no reader has to judge which shape is which. |
| 6 | minor | "Position 1" now means only the Vorfeld. `rules[1].content_en` uses **Slot A / Slot B** and adds a parenthetical pointing at `basic-sentence-structure`; `content_de`'s closing line became "Prüfe also immer zuerst: vor dem Nomen oder nach dem Verb?" All four remaining "Position 1" strings are s5#04's Vorfeld sense. |
| 7 | minor | All seven stage-4 fill_blanks: `question_en` "Fill in the adjective ending:" → **"Write the adjective with the right ending:"** (0 occurrences of the old wording), matching the whole-word key. |
| 8 | minor | Duplicate prompt gone: s5#11 is no longer multiple_choice (see #9), so "Welcher Satz ist richtig?" now occurs exactly once (s4#12). Verified: no two `question_de` strings in the file are identical. |
| 9 | minor | **Stage 5 is now free production end to end** — all 13 items are `sentence_building` with cue brackets. The three MC items and the one error_correction were converted, and two were re-pointed to cells that gained coverage rather than repeating one: s5#10 "[der / Film / sein / lang / und / interessant]" → "Der Film ist lang und interessant." (the first *produced* predicative, deliberately reusing s4#05's "ein interessanter Film" words in the other slot), s5#11 "Ich habe einen neuen Job.", s5#12 "Ich gebe dem kleinen Kind ein Buch." (also drills Dativ vor Akkusativ), s5#13 "Wir fahren mit den neuen Bussen.". Totals move to 21 typed / 5 MC (≥16 and ≤10 both still satisfied); the 5 remaining MC keys still rotate across option indices 0/1/2/2/3. |
| 10 | minor | `kein` in the plural is now shown three times — `rules[3].content.description_de` ("kein geht auch im Plural: Das sind keine guten Ideen."), `rules[3].key_insight_de`, summary point [11] — **and drilled**: s5#01 was re-pointed from a third neuter -es item to "[das / sein / kein / gut / Ideen]" → "Das sind keine guten Ideen.", which now forms an explicit singular/plural minimal pair with s5#06 ("Das ist keine gute Idee."); both `question_en` strings cross-reference each other. Neuter -es is still drilled at s4#06, s4#09 and s5#07. |
| 11 | minor | Covered by the #3 policy (the "!" forms are generated for every sentence answer, not just this one). |
| 12 | minor | s5#13 "mit den neuen Zügen" → **"Wir fahren mit den neuen Bussen."** Same cell (der-word, dative plural, noun -n), idiomatic. |

## Re-verification after round 2

```
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json
OK: 1 file(s) validated, no violations.
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json --cache grammar-content-cache.json
OK: 1 file(s) validated, no violations.
```

Re-ran the full self-check: banned-grammar sweep clean (incl. new probes for null-article
`als …e[nmrs]`, `denn` and `aber` as A2.2 conjunctions — zero hits); every German sentence
≤ 12 words; the only strings over that are three-word prompts followed by the brief's
mandated cue token list (`Schreib den Satz: [wir / arbeiten / in / ein / groß / Büro]`),
which is what review 1 also read as ≤ 14; `word_breakdown` and `grammar_highlight` intact;
no example reused as an item; no `question_de` duplicated; prerequisite/related slugs live;
acceptable_answers policy asserted mechanically for all 21 typed items.

## Still-open note for the reviewer (round 2)

Nothing from review 1 is left unaddressed. The one judgement call worth a second look is #9's
consequence: stage 4 now carries all 5 multiple_choice items and stage 5 carries none, which
is the cleanest reading of "stage 4 = recognition + guided production, stage 5 = free
production", but it does mean recognition is concentrated in one stage.
*(Review 2 accepted this explicitly: "no action".)*


---

# Round 3 changes (against review-adjective-endings-intro-2.md)

Review 2 confirmed all 12 round-1 fixes in the file and raised 1 blocking + 2 minor. All three
are addressed. **No table cell, example, rule table, dialogue or `common_mistakes` pair moved,
and no answer key was made less strict anywhere else.**

| # | sev | change made |
|---|---|---|
| 1 | BLOCKING | **s5#13 now accepts the fronted order**, exactly like s5#03: `acceptable_answers` = 12 entries (`sv("Wir fahren mit den neuen Bussen.", "Mit den neuen Bussen fahren wir.")`), `question_en` gains "; both word orders are accepted", and `why_correct_en/de` say so ("Position 1 ist frei."). The three cues with a frontable element (s5#03, s5#04, s5#13) are now treated identically — the inconsistency the stage-5 conversion introduced is closed. |
| 2 | minor | **Two free-production keys were printed verbatim in the rules.** Per the coordinator I changed the *exercises*, not the rule text, so rules 3 and 6 keep their illustrations: s5#01 "[das / sein / kein / gut / **Fotos**]" → "Das sind keine guten Fotos." (rule 3 still reads "kein geht auch im Plural: Das sind keine guten Ideen."), and s5#11 "[wir / brauchen / ein / gut / **Arzt**]" → "Wir brauchen einen guten Arzt." (rule 6's dialogue still has "Ben hat einen neuen Job."). Same cells as before — mixed plural -en and mixed accusative masculine -en — with a fresh noun and, for s5#11, a fresh verb (`brauchen`). The s5#01 ↔ s5#06 cross-reference is reworded from a same-noun minimal pair to the singular/plural contrast it now is ("kein takes -en only in the plural (item 1)"). |
| 3 | minor | **s5#12 cue-length artifact, noted rather than changed.** `"Schreib den Satz: [ich / geben / das / klein / Kind / ein Buch]"` is 15 whitespace tokens: 3 words of German prose plus the brief's mandated cue list, whose object slot is the two-word "ein Buch". Shortening the lead-in for this one item (the reviewer's suggestion) would trade a measurement artifact for a real inconsistency — twelve stage-5 prompts reading "Schreib den Satz:" and one reading "Schreib:" — so the prompt is left uniform. The two-word slot is deliberate: a one-word "Buch" slot would not tell the learner whether to produce *ein Buch* or *das Buch*, which is not what the item tests (the item tests `dem kleinen Kind` plus Dativ-vor-Akkusativ). Flagged here so a downstream word-count gate is not a surprise. |

**Round 2 table rows 9 and 10 above are historical** and quote the then-current s5#01/s5#11
sentences; the current file has "Das sind keine guten Fotos." and "Wir brauchen einen guten Arzt."

## Re-verification after round 3

```
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json
OK: 1 file(s) validated, no violations.
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json --cache grammar-content-cache.json
OK: 1 file(s) validated, no violations.
```

New check added to the self-check and now passing: **no typed item's key sentence, and no
determiner+adjective+noun core of one, appears anywhere in the rules or examples.** The single
remaining hit is s4#13, a *multiple_choice* whose correct answer is the two-word option
"meinen guten", which is by design read off rule 3's paradigm cell "meinen guten Kindern" —
recognition against the table is what a stage-4 MC is for, so it is not the same defect.
Everything else re-ran clean: 21 typed / 5 MC, MC keys still rotating (0/1/2/2/3), stage 5
still 13/13 `sentence_building`, acceptable_answers policy still exact for all 21 typed items
(7×1, 11×6, 3×12), no duplicate `question_de`, no banned grammar, no sentence over 12 words
outside the cue lists.
