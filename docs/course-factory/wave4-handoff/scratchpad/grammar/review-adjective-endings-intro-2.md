# review-adjective-endings-intro-2 — delta re-review, round 2

Deliverable: `S/wave4/grammar/adjective-endings-intro.json` (+ `.notes.md` "Round 2 changes").
Baseline: `review-adjective-endings-intro-1.md` (3 blocking, 9 minor).

## Validator (re-run by me)

```
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json
OK: 1 file(s) validated, no violations.                                  (exit 0)
$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json --cache grammar-content-cache.json
OK: 1 file(s) validated, no violations.                                  (exit 0)
```

## Round-1 findings — verified against the file, not the notes

| # | sev (r1) | claim | verdict |
|---|---|---|---|
| 1 | BLOCKING | step 3 no longer calls gender a *Fall* | **FIXED.** `rules[4].content.steps[2].title_de` = "Welcher Fall? Und maskulin, feminin, neutrum oder Plural?", `title_en` = "Which case — and which gender, or plural?". No longer contradicts rule 2's table; `detail_de` untouched and still right. |
| 2 | BLOCKING | null-article ending gone | **FIXED.** `rules[5].key_insight_de` = "…Lerne sie komplett."; `festen Ausdruck` occurs **0** times. A fresh regex sweep for null-article strong endings (`als …e[nmrs] <Noun>`) over all 365 German strings returns **0 hits**. Declining "als feste Wendung" was the right call — it would have been the same defect. |
| 3 | BLOCKING | one acceptable_answers policy | **FIXED, and it holds mechanically.** I re-derived the expected set for all 21 typed items from `correct_answer` alone: 7 single-word fill_blanks = exactly 1 entry; 12 one-order sentences = exactly the 6 {cap,lower}×{".","","!"} forms; s5#03 and s5#04 = 12, i.e. both orders × both casings × all three endings, with no stray entries. Zero deviations. s4#08 regenerated to the same 6. |
| 4 | minor | cell miscount | **FIXED.** `rules[3].description_en` "two new endings, -er and -es, in three cells"; summary [8] "zwei Endungen neu: -er und -es", [9] "-er ist maskulin … -es ist neutrum". Count is now right in both languages. |
| 5 | minor | metalinguistic *wird* | **FIXED and made uniform** — all six sites carry *aus*: examples[2], s4#10 (×2), s5#05, s5#09 ("Aus du wird dir."), s5#13 ("Aus die Busse wird den Bussen."). |
| 6 | minor | "Position 1" collision | **FIXED.** `rules[1].content_en` uses Slot A / Slot B and points at `basic-sentence-structure` — which I confirmed is a real live A1.2 slug; `content_de` closes "…vor dem Nomen oder nach dem Verb?". All 5 remaining "Position 1" strings are s5#04's Vorfeld sense. |
| 7 | minor | fill_blank wording | **FIXED.** "Fill in the adjective ending" occurs 0 times; all seven read "Write the adjective with the right ending:". |
| 8 | minor | duplicate prompt | **FIXED.** No two `question_de` strings in the file are identical; "Welcher Satz ist richtig?" occurs once (s4#12). |
| 9 | minor | stage 5 = free production | **FIXED.** Stage 5 is 13/13 `sentence_building`; stage 4 is 7 fill_blank + 1 error_correction + 5 MC. Totals 21 typed (≥16) / 5 MC (≤10). The author's open note is the right reading of the brief — concentrating recognition in stage 4 is what "stage 4 = recognition + guided production" asks for; **no action.** |
| 10 | minor | `kein` in the plural | **FIXED and drilled.** Shown in `rules[3].description_de`, `rules[3].key_insight_de` and summary [11]; produced at s5#01 ("Das sind keine guten Ideen.") as a minimal pair with s5#06 ("Das ist keine gute Idee."), and both `question_en` strings cross-reference each other correctly. |
| 11 | minor | "…Wochenende!" | **FIXED** by the #3 policy, not as a special case. |
| 12 | minor | "mit den neuen Zügen" | **FIXED** — s5#13 is now "Wir fahren mit den neuen Bussen." (same cell: der-word, dative plural, noun -n). |

## Cold re-solve of everything that changed

I re-solved s4#01–s4#08 (reworded prompts) and **all 13 stage-5 items** from
`question_de`/`question_en` before looking at any key. My answers: *Das sind keine guten
Ideen. / Ich kaufe die rote Jacke. / Wir arbeiten in einem großen Büro. / Heute treffe ich
einen alten Freund. / Ich helfe der alten Frau. / Das ist keine gute Idee. / Er bestellt ein
kaltes Getränk. / Ich schreibe meinen guten Freunden. / Ich wünsche dir ein schönes
Wochenende. / Der Film ist lang und interessant. / Ich habe einen neuen Job. / Ich gebe dem
kleinen Kind ein Buch. / Wir fahren mit den neuen Bussen.* — **26/26 keys matched.** The four
newly written items are right in every cell: s5#01 plural mixed -en with plural *sind*;
s5#10 two predicative adjectives, both endingless; s5#12 dative neuter -en **plus** Dativ
vor Akkusativ (both licensed by the live `dative-case`); s5#13 dative plural -en with the
noun's -n (Busse → Bussen). Cross-references check out: s5#06's "not the -en of item 1"
points at s5#01, s5#10's "compare stage 4 item 5" points at s4#05's *ein interessanter Film*.

## Regression sweep (no fix introduced a new defect)

Re-ran the full round-1 battery on the new file: **72** determiner+adjective+noun triples,
every one correct or deliberately in a `wrong`/prompt slot — and the three malformed
distractors of the old MC s5#11 (`ein neuen Job`, `einen neue Job`, `einen neues Job`) are
gone with it, so the file now contains fewer ill-formed strings than before. Banned grammar:
0 hits for null-article endings, Präteritum of full verbs, Futur, Genitiv, `weil/dass/wenn/ob`,
`denn/aber`, `zu`-infinitives, reflexives, Komparativ/Superlativ, Passiv. All 24 table cells,
all 10 examples, the dialogue and all five `common_mistakes` pairs are byte-for-byte
unchanged and still correct. `word_breakdown` and `grammar_highlight` intact. No duplicate
`question_de`, no duplicate key, no example reused as a key. Diffed every key/prompt/example
against **all 72 live topics** in `grammar-content-cache.json`: only overlap is the stock
"Welcher Satz ist richtig?". MC keys still rotate (indices 2,1,2,0,3) and I re-checked all
20 remaining options — no MC item has a second defensible answer. Prereq/related slugs live;
A2.1 topic_order 9 still free.

## New findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | adjective-endings-intro.json: `exercises[25]` (s5#13) `acceptable_answers` / `question_en` | BLOCKING | key "Wir fahren mit den neuen Bussen.", 6 entries, all subject-first | Converting this item from multiple_choice to sentence_building created a **third** cue with a frontable prepositional phrase — `[wir / fahren / mit / die / neu / Busse]` is structurally identical to s5#03 `[wir / arbeiten / in / ein / groß / Büro]`, which accepts "In einem großen Büro arbeiten wir." and says so in `question_en`. "Mit den neuen Bussen fahren wir." satisfies the cue and the English gloss, is correct German, and is rejected. Round 1 passed this class only because s5#03 and s5#04 were then the *only* frontable cues and both accepted both orders; the file now treats two identical cue shapes differently. | Either extend to 12 entries like s5#03 (add the six "Mit den neuen Bussen fahren wir." forms) and append "; both word orders are accepted" to `question_en` — or, if the item is meant to be strict, say so in `question_en` ("start with Wir"). The first is consistent with s5#03/s5#04. |
| 2 | `rules[3].content.description_de` vs `exercises[13]` (s5#01); `rules[6].content.context_de` vs `exercises[23]` (s5#11) | MINOR | rule 3: "kein geht auch im Plural: **Das sind keine guten Ideen.**" — s5#01 key: "Das sind keine guten Ideen."; rule 6 context: "Ben hat **einen neuen Job**." — s5#11 key: "Ich habe einen neuen Job." | Two of the four new free-production answers are printed verbatim (s5#01: the whole sentence) a couple of screens above the exercise, so the item can be answered by recall of the page rather than by production. Round 1's guarantee ("no example reused as an item") still holds — this is the rule text, a channel the round-1 check did not cover. | Vary the noun in the rule illustration, not in the item: rule 3 → "Das sind keine guten Fotos."; rule 6 `context_de` → "Ben arbeitet seit Mai dort." (or leave s5#11 and change only rule 6). |
| 3 | `exercises[24].question_de` (s5#12) | MINOR | "Schreib den Satz: [ich / geben / das / klein / Kind / ein Buch]" | The only string in the file that crosses 14 tokens (15), and the only cue with a two-word slot ("ein Buch") among otherwise one-word slots. The German prose is 3 words, so this is a measurement artifact of the mandated cue list rather than a level breach — but it is the one item a naive downstream word-count gate would trip on, and the slot convention is inconsistent. | Shorten the lead-in for this item only: "Schreib: [ich / geben / das / klein / Kind / ein Buch]" (14 tokens), keeping the slot intact. |

VERDICT: FAIL (1 blocking, 2 minor)

All 12 round-1 findings are genuinely fixed — verified in the file, not taken from the notes —
and the three blockers are fixed at the root rather than patched: the acceptable_answers
policy is now generated, so it is uniform across all 21 typed items, and the null-article
ending is gone from the whole file. 26/26 keys re-solved cold, tables and examples untouched,
no banned grammar, no live-content duplication, MC keys still rotated. The one new blocker is
a side effect of the stage-5 conversion (finding 1) and is a six-string edit; findings 2 and 3
are cosmetic. Round 3 should be a spot check of s5#13, s5#01 and one rule string.
