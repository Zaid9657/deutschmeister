# Adversarial review — Wave 7 PR A2, author E1 (B1.1 EXTEND), round 3 (final delta)

All four files re-read in full: `S/extend/typed-b1.1/{genitive-case,genitive-prepositions,relative-clauses-nom-acc,relative-clauses-dat-gen}.json`, plus the rewritten `S/extend/notes-E1.md` and (for the out-of-band item) `S/recut/patches.json`.
Baselines: `extend-E1-review-1.md` (FAIL 9/12), `extend-E1-review-2.md` (FAIL 1 blocking, 6 minor).

## Validator output (run by the reviewer)

```
$ node scripts/check-grammar-json.mjs <all four absolute paths> --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
$ ... one file at a time
genitive-case:            OK: 1 file(s) validated, no violations.
genitive-prepositions:    OK: 1 file(s) validated, no violations.
relative-clauses-nom-acc: OK: 1 file(s) validated, no violations.
relative-clauses-dat-gen: OK: 1 file(s) validated, no violations.
```

## Round-2 findings: closure check

| # | severity | status | new text, quoted |
|---|---|---|---|
| N1 | **BLOCKING** | **CLOSED** | gen-prep `rules[2].content.mistakes[0].explanation_de` is now **"wegen braucht den Genitiv, nicht den Dativ. Die Formen findest du in der Regel »Umgangssprache: Dativ statt Genitiv«."** Two plain sentences (7 and 11 words), du-form, active, no participle, no ellipsis. `explanation_en`: "wegen takes the genitive, not the dative. You can find the forms in the rule »Spoken German: Dative Instead of Genitive«." |
| — | — | **title verified** | The quoted German title matches rule `order_index 5` of the live `genitive-prepositions` dump **byte-exact**: `title_de = "Umgangssprache: Dativ statt Genitiv"`. The English field quotes that same rule's `title_en` byte-exact: `"Spoken German: Dative Instead of Genitive"`. Both sides point at a rule that exists, under the name the learner actually sees on each side. |
| N2 | MINOR | **CLOSED** | `grep -in "regel 5\|rule 5"` across all four output files: **no hits**. The numeric `order_index` reference is gone; the reference is by title now, so a future renumbering cannot break it. |
| N3 | MINOR | **CLOSED** | gen-prep dialogue line 2 recast onto a target preposition: **"Was ist denn los? Wegen der Reparatur habe ich noch nichts gehört."** with `highlight: "Wegen der Reparatur"`. All six of the dialogue's highlights are now genitive-preposition phrases (wegen der Heizung / Wegen der Reparatur / Trotz meines Anrufs vor einer Woche / Während des Winters / Wegen der Kälte / Trotz der vielen Arbeit). |
| N4 | MINOR | **CLOSED, and better than asked** | gen-prep oi 10 is now **"Innerhalb ___ nächsten Monats wächst die Firma stark."** → `des`. The frame no longer collides with live `genitive-case` oi 9 ("Innerhalb ___ Jahres" → `eines`), the German is idiomatic, and — the part I did not ask for — the adjective `nächsten` **structurally forces** the definite article: `*Innerhalb eines nächsten Monats` is ungrammatical, so the item cannot be answered two ways even if a learner ignores the English cue. The gap is the article only (`Monats` is pre-supplied), so the `Monats`/`Monates` variant cannot bite either. |
| N5 | MINOR | **CLOSED** | gen-prep dialogue line 3: **"Trotz meines Anrufs vor einer Woche ist noch nichts passiert. Können Sie das innerhalb einer Woche reparieren?"** — the bare accusative time adverbial is now a proper `vor + Dativ` PP; highlight updated to match and still a substring. |
| N6 | MINOR (doc) | **CLOSED** | `notes-E1.md` rewritten: the four per-topic sections now describe post-round-3 content, with an explicit header saying so, and the round-2/round-3 changelogs are kept below and labelled with the review each answers. Spot-checked against the files: the per-topic prose matches what is actually in them (e.g. dat-gen's `key_insight` description, gen-prep's four-gender guided spread, gen-case's "des kleinen Hotels"). |
| r1 #12 residual | MINOR | **CLOSED** | dat-gen oi 15 `question_en` no longer names the answer: **"Possessive relative pronoun for a feminine noun (Relativpronomen ergänzen), sein conjugates to ist, helfen conjugates to hilft. The relative clause goes directly after the noun. Start with 'Die Nachbarin'."** |

**7 of 7 closed.**

## Sweeps re-run from scratch on the round-3 files

- **Banned connectors** (topic 9–12 set + the B2 set) over every German field incl. every `rule_patches[*].new`: **0 hits**.
- **Passiv**: `wird|werden|wurde|wurden|worden|geworden` — **0 occurrences** anywhere.
- **Reduced-passive ellipsis**, the exact shape N1 was: `wie … <Partizip II>` with no auxiliary — **0 hits**. The N1 class is gone, not relocated.
- **Partizip II** generally: 4 hits, all legitimate clause-final Perfekt or the non-participle `gehört`/`geht`.
- **20-word cap** over every sentence of every German field: **0 violations**.
- **Null-article singular adjective** across every key and acceptable_answer: **0 hits**.
- **Duplicates**: every new exercise prompt, key, example sentence and rule string (mistake pairs, table cells, dialogue lines) vs every live exercise prompt, live exercise key and live example across **all eight** B1.1 dumps, plus the four new files against each other — **0 duplicates**.
- **rule_patches**: all five `old` values still **byte- and key-order-exact**; all five `new` still differ from `old`; the three unchanged patch payloads (gen-case, both nom-acc) are verbatim their round-2 accepted text.
- **Structure**: exercises 16–25 / 9–18 contiguous per topic, 4×fill_blank + 3×sentence_building + 3×error_correction each, `options: null` throughout, rules 6/7/8 and examples 9–12 on the two thin topics only, every `related_rule_title` resolving, all 8 examples' highlight a substring and `word_breakdown` tokenising in order, no English in any German field.
- **Cold re-solve** of every changed item (gen-prep oi 10, dat-gen oi 15) and a re-solve pass over all 40: no key wrong, none ambiguous.
- Two dialogue highlights in dat-gen (`lines[4]`, `lines[5]`) remain ellipsis-marked and thus non-substring — accepted in round 1 as the live convention (11 of 18 live dialogue highlights are non-substring); unchanged, not a regression.

## VERDICT: PASS (0 blocking)

Three rounds, 9 → 1 → 0 blocking. The round-3 edits are surgical and none of them disturbed anything that already passed: the two files not named in the round-2 findings (`genitive-case`, `relative-clauses-nom-acc`) are byte-identical in every field I re-checked, and the two that changed did so only in the four places reported. The N1 fix is the right shape — it removed the construction rather than rewording around it, and it replaced a fragile `order_index` pointer with a title that I confirmed exists on both language sides. The N4 fix is stronger than the finding required: it eliminates the ambiguity structurally instead of relying on the English cue. Shippable as is.

## Residual minors I would still apply (one line each, all optional)

1. gen-prep `rules[2].content.mistakes[0].explanation_de`: `"Die Formen findest du in der Regel »…«"` → `"Die Formen zeigt dir die Regel »Umgangssprache: Dativ statt Genitiv«."` — "in der Regel" is a Zertifikat-B1 fixed adverbial meaning *usually*, so it garden-paths before the quote resolves it.
2. gen-prep `rules[2].content.mistakes[0].explanation_en`: use straight quotes, not German guillemets, around the English rule title.
3. gen-prep `exercises[1]` (oi 10): make it neuter to restore the four-gender guided spread the N4 fix collapsed (oi 9 and oi 10 are now both masculine `des`) — e.g. `"Innerhalb ___ ganzen Gebäudes ist Rauchen verboten."`, key unchanged and still pinned by `ganzen`.
4. gen-prep `exercises[2]` (oi 11): change the predicate so it stops echoing the same file's example oi 11 verbatim — e.g. `"Trotz ___ Krankheit geht sie zur Arbeit."`
5. dat-gen `rules[1].content.lines[4].highlight`: `"wo Sie ... abstellen können"` → `"wo Sie auch Fahrräder abstellen können"` (make it a substring).
6. dat-gen `rules[1].content.lines[5].highlight`: `"an die ich ... gedacht habe"` → `"an die ich schon lange gedacht habe"`.
7. dat-gen `rules[2].key_insight_de`: capitalise or quote the sentence-initial cited word — `"»wo« ist bei einfachen Orten richtig; …"`.
8. dat-gen `rules[0].content.rows`: change rows 2 and 4 so the table stops sharing sentences with example oi 9 / exercise oi 13 (`"Die Firma, bei der ich arbeite, …"`) and exercise oi 16 (`"Der Vertrag, über den wir sprechen, …"`) — e.g. `"Die Ärztin, bei der ich einen Termin habe, ist nett."` and `"Das Thema, über das wir sprechen, ist schwierig."`
9. genitive-case: seven of ten exercises still carry `related_rule_title: null` while nom-acc now has all ten wired — point oi 16/17/18/20/22 at "How the Genitive Works" and oi 21/25 at "When to Add -s vs -es to Nouns".
