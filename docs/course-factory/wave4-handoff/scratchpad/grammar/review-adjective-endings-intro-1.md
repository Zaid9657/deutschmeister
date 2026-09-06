# review-adjective-endings-intro-1 — adversarial review, round 1

Deliverable: `S/wave4/grammar/adjective-endings-intro.json` + `.notes.md`
Against: `S/wave4/level-a2.1.md` (binding), `S/wave4/grammar-brief.md`.

## Validator (run by me, not quoted from the author)

```
$ node scripts/check-grammar-json.mjs \
    …/scratchpad/wave4/grammar/adjective-endings-intro.json
OK: 1 file(s) validated, no violations.            (exit 0)

$ node scripts/check-grammar-json.mjs …/adjective-endings-intro.json --cache grammar-content-cache.json
OK: 1 file(s) validated, no violations.            (exit 0)
```

## Method — what I actually did

1. Read `level-a2.1.md`, then the grammar brief, then the JSON in full (topic, 9 rules,
   10 examples, 26 exercises), then the notes last, so the notes could not steer me.
2. **Re-solved all 26 items cold** from `question_de`/`question_en` before opening any key.
   My 26 answers matched all 26 keys — the answer key of this file is arithmetically clean.
   For the 8 MC items I additionally checked each of the 32 options for a second defensible
   reading (`Wir suchen ___ Zimmer` under a plural reading, `in eine schöne Wohnung` under a
   motion reading, `den kleinen Kind`, `ein neuer Wagen` as an alternative repair of s5#10):
   **no MC item has a second defensible answer.**
3. **Every adjective ending in the file, mechanically.** Extracted all 78 distinct
   determiner+adjective+noun triples across every German string (tables, hooks, dialogue,
   examples, prompts, keys, distractors, `common_mistakes`) and checked each cell by hand.
   All 24 table cells (rules 2 and 3) are right. Every ill-formed triple — `dem neue Bus`,
   `den neue Pullover`, `ein guten Freund`, `ein neue Auto`, `ein neuer Auto`, `ein neuen Job`,
   `einen neue Job`, `einen neues Job`, `einem klein Zimmer` — sits in a `wrong` slot, an
   error-correction prompt, or a distractor, i.e. **every one is deliberate**. No stray
   ending anywhere in learner-facing model German.
4. Banned-grammar sweep over the 317 German strings: Präteritum of full verbs, Futur,
   Genitiv (`des`/`deren`), relative clauses, `weil/dass/wenn/ob`, `zu`-infinitives, `um…zu`,
   Passiv, reflexives, Komparativ/Superlativ — **all clean** (the only regex hits were
   metalinguistic `wird` "becomes" and `bestellt`). One real hit remains: blocking #2 below.
5. Sentence length: split every German string on sentence boundaries — **max 12 words, zero
   over 14.** English leakage into German fields: none. Umlaut/ß: all 365 German tokens
   spelled correctly.
6. Shape beyond the validator: 26 items (13/13), 18 typed ≥16, 8 MC ≤10, every MC exactly 4
   distinct options with the key among them, every typed `correct_answer` inside
   `acceptable_answers`, `word_breakdown` covers every token of all 10 sentences, all 10
   `grammar_highlight`s are substrings, `title_en` 25 chars → page title 64 ≤ 70.
   **MC key positions rotate** (0,1,2,2,3 / 0,1,2) — no "always pick A" pass, the wave-3 defect.
7. Duplication: diffed every `sentence_de`/`question_de`/`correct_answer` against the live
   B1.2 `adjective-declension-weak-mixed` + `adjective-declension-strong` and B2.1
   `participial-adjectives` in `grammar-content-cache.json` — **only overlap is the stock
   prompt "Welcher Satz ist richtig?"**. No live A2.1 rule title is re-taught; rule 2 and
   s5#05 cite `dative-case` as known rather than repeating it. No example is reused as an item.
8. Checked the three declared shape deviations against the repo instead of the brief:
   `icon: "book"` matches all 72 live topics; `grammar_topics` has **no** `difficulty` column
   (`scripts/grammar-topics-from-json.mjs` line 618 INSERT); rule `order_index` -1/1..7/99 is
   what the validator demands. **All three deviations are correct — the brief is wrong, not
   the file.** Exercise/rule/topic key sets are byte-identical in shape to `wave3/imperative.json`.
9. Position-1 fronting (the wave-3 blocking class): only s5#03 and s5#04 carry a frontable
   element and both accept both orders; no `why_correct` claims the subject is fixed. Clean.
10. Coverage: mapped all 24 paradigm cells against the 26 items — 16 cells drilled, the
    rest table-only; predicative drilled (s4#12); frozen chunks in rule 5 + example 10.

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | adjective-endings-intro.json: `rules[4].content.steps[2].title_de` / `title_en` | BLOCKING | "Welcher Fall? Maskulin, feminin, neutrum oder Plural?" / "Which case? Masculine, feminine, neuter or plural?" | Genus/Numerus labelled as *Fall*. The topic's own table (rule 2) defines the column "Fall" as Nominativ/Akkusativ/Dativ and puts maskulin/feminin/neutrum/Plural in the **headers** — so step 3 of the central three-step procedure contradicts the table it tells the learner to read, in the exact place where separating case from gender is the whole skill. (`detail_de` underneath gets it right: "Dativ, maskulin, Artikel dem".) | title_de → "Welcher Fall? Und maskulin, feminin, neutrum oder Plural?"; title_en → "Which case — and which gender or plural?" |
| 2 | adjective-endings-intro.json: `rules[5].key_insight_de` | BLOCKING | "Lerne sie als festen Ausdruck." | `als festen Ausdruck` is a null-article (strong) adjective ending — `level-a2.1.md` bans "adjective endings after null article beyond the frozen chunks", and this is not a frozen chunk. It is the only banned-grammar occurrence in the file, and it sits inside the one rule whose point is that this pattern is deferred to B1, so it also undercuts its own claim. | "Lerne diese Wendungen komplett." (or "Lerne sie ganz.") |
| 3 | adjective-endings-intro.json: `exercises[*].acceptable_answers` — s5#01,02,03,04,05,06,07,08,09,10 and s4#08 | BLOCKING | s5#01: `["Das ist ein neues Handy.", "Das ist ein neues Handy", "das ist ein neues Handy."]` | The file's own convention is 4 variants (cap/lower × period/no period): **s4#08 lists all four**. Ten stage-5 items list three and reject the fourth (`das ist ein neues Handy`), and s5#03/s5#04 list no lowercase form at all while their two word orders each get both punctuation variants. A learner is marked wrong for a form strictly between two accepted forms. Per the review brief a typed item missing a legitimate variant is wrong; either policy is defensible, the inconsistency is not. | Make it uniform: either add the missing lowercase-no-period variant to all 10 (and both lowercase forms of both orders to s5#03/s5#04, i.e. 8 entries each), **or** drop the lowercase-with-period entries everywhere and from s4#08. |
| 4 | `rules[3].content.description_en`; `rules[8].content.points[8]` and `[9]` | MINOR | "in exactly two cells: ein Mann (masculine nominative) and ein Kind (neuter nominative and accusative)"; "Nach ein, kein, mein sind zwei Felder neu"; "Das zweite neue Feld ist neutrum" | Three cells, not two (nom m, nom n, akk n). `description_de` gets it right by saying "zwei **Formen**"; the English and the Quick Reference say cells/Felder, which the tables define as cells. A learner counting the table finds three. | "two new **endings**" / "zwei neue **Endungen** (-er und -es)"; point [9] → "Die zweite neue Endung ist -es: ein gutes Kind." |
| 5 | `examples[2].explanation_de`; `exercises[21].why_correct_de`; `exercises[25].why_correct_de` | MINOR | "der Pullover wird den Pullover"; "du wird dir"; "die Züge wird im Dativ Plural den Zügen" | Metalinguistic "becomes" written as a copula: nominative subject + accusative complement, and a plural subject with singular *wird*. As prose these are not German; the standard formulation carries *aus*. (`exercises[9]`'s bare "der wird den" is fine — quoted forms only.) | "Aus der Pullover wird den Pullover."; "Aus du wird dir."; "Aus die Züge wird im Dativ Plural den Zügen." |
| 6 | `rules[1].content.content_en` vs `exercises[16].explanation_en` / `why_correct_de` | MINOR | "Position 1 — after the verb (predicative) … Position 2 — in front of the noun"; "heute may stand in position 1 or after the verb" / "Position 1 ist frei." | "Position 1" means two different things inside one topic: the predicative slot in rule 1, the Vorfeld in s5#04 — and the Vorfeld sense is the one the live course already teaches (`basic-sentence-structure`, "Position 1 ist flexibel"). | Rule 1: "Stelle A — nach dem Verb / Stelle B — vor dem Nomen" (EN "Slot A / Slot B"), leaving "Position 1" to mean the Vorfeld. |
| 7 | `exercises[0..6].question_en` (all seven stage-4 fill_blanks) | MINOR | "Fill in the adjective ending: That is the new computer. (adjective: neu; article: der; …)" | The instruction asks for the *ending* but the key is the whole word (`neue`, not `e`/`-e`); a learner who answers `e` is marked wrong and `acceptable_answers` has one entry. The German blank is a word slot, so the German disambiguates and the English does not. | "Write the adjective with the right ending: …" |
| 8 | `exercises[11].question_de` and `exercises[23].question_de` | MINOR | "Welcher Satz ist richtig?" (twice) | Two items carry an identical German prompt; only `question_en` tells them apart, and it is the one string a learner may not read. | Give s5#11 a distinct prompt, e.g. "Welcher Satz ist richtig? (der Job)". |
| 9 | `exercises` stage 5: `[23]`, `[24]`, `[25]` multiple_choice + `[22]` error_correction | MINOR | — | The brief defines stage 5 as **free production** (sentence_building with cue brackets); 4 of 13 stage-5 items are not production, while stage 4 already carries 5 MC. | Move two of the three stage-5 MC into stage 4 (swapping two fill_blanks up), or convert them to sentence_building. |
| 10 | `rules[3].content.rows[*][4]` header "Plural (kein, mein)"; `rules[3].key_insight_de` | MINOR | "Im Plural nimmst du kein oder mein." | `kein` in the plural is asserted but never shown or drilled — every plural cell and both plural items (s4#13, s5#08) use *mein*. The level scope names "plural -en after der/**kein**/mein". | Add a `keine guten …` line to the rule-3 plural column or the summary, e.g. "Das sind keine guten Ideen." |
| 11 | `exercises[21].acceptable_answers` | MINOR | key "Ich wünsche dir ein schönes Wochenende." | A wish; "…Wochenende!" is a plausible and correct learner answer and is not accepted, although the item is explicitly sold as the e-mail sign-off. | Add the two "!" variants. |
| 12 | `exercises[25]` | MINOR | "Ich fahre mit den neuen Zügen." | Plural "mit den Zügen fahren" is noticeably less idiomatic than the singular; the author flags this himself (notes, doubt 5). | "Ich fahre mit den neuen Bussen." (same key shape, same cell) — or singular "mit dem neuen Zug" if the dative-plural cell is kept in s5#08/s4#13. |

Notes-file doubts I checked and am **not** raising: `icon: "book"` and the absent topic
`difficulty` are right (doubt/deviation 1–2, verified against the DB cache and the INSERT);
`related_slugs` are two real live slugs and do not duplicate the prerequisites (doubt 1);
`Pullover` overlapping one noun with the B1.2 topic is not duplication — no string overlaps
(doubt 2); s4#13 vs s5#13 is a deliberate der-word/mein-word contrast, not a duplicate
(doubt 3); `Ärztin`, `Getränk`, `bestellen`, `U-Bahn` are all inside Goethe A2 (doubt 4);
leaving `Liebe/Viele Grüße` capitalised as sign-offs is correct (doubt 6).

VERDICT: FAIL (3 blocking, 9 minor)

The German is the strongest of the wave so far: 26/26 keys correct on a cold solve, all 24
table cells right, every one of the 78 determiner+adjective+noun triples correct or
deliberately wrong, zero sentences over 14 words, MC keys rotated, no live-content
duplication, and the three declared shape deviations verified correct against the repo
rather than the brief. The three blockers are narrow and mechanical: one grammatical term
misapplied in the core procedure (#1), one banned null-article ending in a four-word aside
(#2), and an `acceptable_answers` convention applied in three different ways across twelve
items (#3). All three are fixable without touching a single answer key; round 2 should be short.
