# Adversarial review — Wave 7 PR A2, author E2 (B1.1 EXTEND), round 3 (final delta)

Re-read all four deliverable files **in full** (every rule, example and exercise, not only the
changed rows) and re-ran every sweep from scratch against the current bytes.
Prior rounds: `S/reviews/extend-E2-review-1.md`, `S/reviews/extend-E2-review-2.md`.

## Validator output (round 3, my own run, verbatim)

```
$ node scripts/check-grammar-json.mjs \
    S/extend/typed-b1.1/konjunktiv-ii-wurde.json \
    S/extend/typed-b1.1/konjunktiv-ii-ware-hatte.json \
    S/extend/typed-b1.1/infinitive-with-zu.json \
    S/extend/typed-b1.1/um-zu-ohne-zu.json \
    --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
```

## Round-2 findings: closure status

| # | file:path | status | new text (quoted) | verdict |
|---|---|---|---|---|
| N1 | `konjunktiv-ii-wurde` `exercises[8]` oi 23 | **CLOSED** | `explanation_de: "Nur ein würde pro Satz; das zweite 'würden' am Ende fällt weg."` · `explanation_en: "Only one würde per clause; drop the second 'würden' at the end."` · `why_correct_de: "würden + Infinitiv (kaufen) ist vollständig; das zweite würden ist überflüssig."` · `why_correct_en: "…; the second würden is redundant."` | All four fields now name `würden`, matching the prompt `"Wir würden das Auto meines Bruders kaufen würden."`. Re-solved cold: exactly one repair (delete the clause-final `würden`) yields correct German; the Futur-I escape route stays closed. A scripted scan for quoted tokens absent from their own item now returns **zero** real hits across all four files (the two remaining are legitimate cross-references: `"wie bei 'Ich hätte gern einen Kaffee.'"` and the paraphrase `'das wäre einfacher'`). |
| N2 | `konjunktiv-ii-ware-hatte` `rules[2].mistakes[1]` oi 8 | **CLOSED** (residues → R1, R2, R3) | `"Könnten Sie mir bitte helfen würden?" → "Könnten Sie mir bitte helfen?"`, `explanation_de: "könnten ist schon Konjunktiv II; würde daneben ist überflüssig und falsch."` | The live-rule collision is gone: I re-diffed all three pairs of the rule against every live rule of the topic and **none** of the six strings occurs in the live content (the round-2 pair reproduced live rule oi 5's `example_de` verbatim). The replacement is correct German on both sides and unambiguous — deleting the clause-final `würden` is the only single-change repair. Three small residues below. |
| N3 | `infinitive-with-zu` `rules[2].memory_trick_de/_en` oi 8 | **CLOSED** | `"Modalverben nie mit zu. Trennbare Verben: zu in der Mitte. In diesem Kurs schreiben wir das Komma vor dem erweiterten Infinitiv immer."` / `"… In this course we always write the comma before an extended infinitive clause."` | The false universal is now explicitly framed as course house style, so it no longer contradicts §75 or the precise `mistakes[2]` two fields above (`"Der Infinitivsatz hängt vom Nomen Zeit ab; hier ist das Komma Pflicht."`). 12 words, inside the cap. |
| N4 | `um-zu-ohne-zu` `rule_patches[0].new.text_de/_en` + `rules[2].mistakes[0].explanation_de/_en` | **CLOSED** | patch: `"… Bei verschiedenen Subjekten brauchst du \"damit\" — das lernst du später im Kurs."` · rule: `"… Für zwei Subjekte brauchst du \"damit\" — das lernst du später im Kurs."` | Both remaining forward references now quote the mentioned word, so `damit` can no longer be read as the da-compound. Both are consistent with each other. `rule_patches[0].old` untouched — see the sweep line below. |
| N5 | `konjunktiv-ii-ware-hatte` `exercises[9]` oi 18 | **CLOSED** (residue → R4) | `"Ich hätte gern ein Termin." → "Ich hätte gern einen Termin."`, `explanation_de: "Termin ist maskulin und Akkusativobjekt: einen Termin, nicht ein Termin."` | `gerne` is gone; the topic is back to a single register (`gern` throughout). The accusative test survives the swap and the answer collides with no live row of the topic (scripted). |
| N6 | `um-zu-ohne-zu` `exercises[0]` oi 9 | **CLOSED** | `"Sie lernt jeden Abend Vokabeln, ___ die Prüfung im Juni zu schaffen."` key `um` | Re-solved cold against all three connectors: `anstatt` is now incoherent (you do not study *instead of* succeeding), and `ohne` is blocked by the tense/time mismatch — habitual present plus a specific future exam cannot describe an already-failed attempt. `um` is the only reading, so the item no longer depends on the English cue. `eine Prüfung schaffen` is idiomatic and inside the B1 Wortliste. |
| #14 | (round-1 partial, carried) | **CLOSED** | see N6 | The last round-1 residue is now closed; all 21 round-1 findings and 6 round-2 findings are resolved. |

## Sweeps re-run in full on the round-3 bytes

Ban-list regex over every German-bearing field, excluding `rule_patches[0].old`: the only hits are
`als` as a comparative/role particle (`höflicher als der Imperativ`, `zählt als Position 1`,
`als Zwecksatz`), `bis Freitag` as a temporal preposition, and the two quoted `damit` forward
references — **no** topic-9–12 conjunction, adverbial connector or two-part connector anywhere;
**0** hits for `deshalb`/`deswegen`/`darum`/`trotzdem`/`außerdem`/`sonst`/`danach`/`dagegen`.
Konjunktiv II der Vergangenheit, Passiv in any tense, Konjunktiv I, Plusquamperfekt, `ohne dass`,
`je … desto`: **0**. Präteritum: no exercise key is a past-tense form; `ging` is on the productive
list and is never the target, `musste` is a modal Präteritum, `verließ` stays example-only
(receptive, permitted). 20-word cap over every `*_de`, `question_de`, `correct_answer`, `wrong`,
dialogue `de` and table cell: **0 over**. Shape: 40 exercises, `options: null`, no `multiple_choice`,
`correct_answer ∈ acceptable_answers`, all 40 `related_rule_title` values resolve. `order_index`
unchanged and contiguous per topic (16-25 / 9-18 ×3; rules 6-8; examples 9-12). Duplicates: no
`question_de`, `sentence_de` or multi-word `correct_answer` matches any live row of its topic; no
exercise prompt or key matches any new rule's mistake pair; no new rule's mistake pair occurs in its
topic's live rules. `grammar_highlight`: every ellipsis half is a substring. `word_breakdown`: all 12
examples tokenise their sentence in order with full coverage. `rule_patches`: exactly one,
`field: content` on rule `adba8282-abd7-4646-9c62-dcd80fd440f7` (oi 5), `old` **byte-exact** against
`source/um-zu-ohne-zu.json` on all four keys (deep-equal, re-verified this round). Repo untouched
(`git status --porcelain` empty).

VERDICT: PASS

## Residual minors (one-line edits, orchestrator's call — none blocks the merge)

- **R1** `konjunktiv-ii-ware-hatte` `rules[2].memory_trick_de/_en` oi 8: the middle clause still reads `"Modalverben haben eigene Konjunktiv-II-Formen."` / `"Modal verbs have their own Konjunktiv II forms."`, which described the *replaced* pair; the pair now teaches "no würde beside könnten". Fix: `"Neben könnten oder sollten steht kein würde."` / `"No würde next to könnten or sollten."`
- **R2** `konjunktiv-ii-ware-hatte` `rules[2].mistakes[1].wrong` oi 8: `"Könnten Sie mir bitte helfen würden?"` is grammatically fine as a wrong-sentence but contrived — a clause-final `würden` after a modal question is not an error learners actually produce. Optional swap for an attested one: `"Das könnte sein besser."` → `"Das könnte besser sein."` (infinitive-last after a modal Konjunktiv II); collides with nothing live.
- **R3** the same doubling error is now taught in three places across the two Konjunktiv topics (live `konjunktiv-ii-wurde` rule oi 3 `"Ich würde gern kommen würde."`, new `konjunktiv-ii-wurde` exercise oi 23, new `konjunktiv-ii-ware-hatte` rule oi 8 pair 2). Applying R2 removes the third and needs no separate edit.
- **R4** `konjunktiv-ii-ware-hatte`: `"hätte gern einen Termin"` now appears both as example oi 10 (`"Sie hätte gern einen Termin am Montag."`) and as exercise oi 18's key (`"Ich hätte gern einen Termin."`), and `Termin` occurs in five of the topic's new rows. Fix: exercise oi 18 → `"Ich hätte gern ein Platz."` → `"Ich hätte gern einen Platz."`
- **Accepted by design, recorded so no later round re-raises them**: (a) the guided `fill_blank` items that are their own example sentence with one slot blanked (`infinitive-with-zu` oi 9/11/12) follow the shipped live convention — live exercises 1-6 of that topic do exactly this; (b) `um-zu-ohne-zu` oi 10/12 and `konjunktiv-ii-ware-hatte` oi 11/12 remain pinned by their `question_en` cue rather than by the German alone, which is the format the extend-brief specifies for typed items; (c) `um-zu-ohne-zu` rule oi 8 mistake 3's `correct` side matches the topic's own live example 3 — deliberate, the corrected form should be the model the learner already saw.

Judgement: three rounds, 27 findings, all closed; the German is now clean end to end and every
mechanical guard passes on the artefact rather than on the author's report. Round 3 fixed exactly
what it claimed and introduced no new defect — the only residues are four cosmetic one-liners, three
of them in a single memory trick and one repeated noun. Ship it.
