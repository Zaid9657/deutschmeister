# Adversarial review — Wave 7 PR A2, author E2 (B1.1 EXTEND), round 2 (delta)

Re-read all four deliverable files **in full** (not only the changed rows), re-read
`S/extend/notes-E2.md` (round-2 rewrite), and re-ran every round-1 sweep from scratch against the
current bytes. Round-1 review: `S/reviews/extend-E2-review-1.md`.

## Validator output (round 2, my own run, pasted verbatim)

```
$ node scripts/check-grammar-json.mjs \
    S/extend/typed-b1.1/konjunktiv-ii-wurde.json \
    S/extend/typed-b1.1/konjunktiv-ii-ware-hatte.json \
    S/extend/typed-b1.1/infinitive-with-zu.json \
    S/extend/typed-b1.1/um-zu-ohne-zu.json \
    --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
```

## Round-1 findings: closure status

| # | file:path | status | new text (quoted) | verdict |
|---|---|---|---|---|
| 1 | `konjunktiv-ii-ware-hatte` `examples[3]` oi 12 | **CLOSED** | `"An ihrer Stelle würde ich zuerst mit der Kollegin sprechen."`; `explanation_de: "An ihrer Stelle + würde ich gibt einen Rat."`; `grammar_highlight: "würde ich"` | Idiom restored to the level file's sanctioned shape (projector = `ich`). `grammar_highlight` is a substring; `word_breakdown` rebuilt to `An ihrer Stelle / würde ich / zuerst / mit der Kollegin / sprechen` — in order, full coverage, re-verified by script. Now consistent with `exercises[6]`. |
| 2 | `konjunktiv-ii-ware-hatte` `exercises[0].why_correct_de` oi 9 | **CLOSED** | `"hätte ist die ich-Form des Konjunktivs II von haben."` | The English possessive calque is gone; genitive `des Konjunktivs II` is correct. |
| 3 | `infinitive-with-zu` `exercises[7].explanation_de` oi 16 | **CLOSED** | `"Modalverben wie müssen stehen nie mit zu; der reine Infinitiv folgt direkt."` | Verb-second restored in the second main clause. |
| 4 | `um-zu-ohne-zu` `rules[2].mistakes[1]` oi 8 | **CLOSED** | wrong `"Sie ruft an, um zu fragen nach den Öffnungszeiten."` → correct `"Sie ruft an, um nach den Öffnungszeiten zu fragen."`; `explanation_de: "... das Objekt (nach den Öffnungszeiten) kommt davor."` | `fragen` now takes its prepositional object; the corrected model is idiomatic. Both explanations mirror the change. |
| 5 | `konjunktiv-ii-ware-hatte` `rules[2]` oi 8 | **CLOSED** (residue → N2) | pairs now `"Wenn ich du wärst, …" → "Wenn ich du wäre, …"`, `"Ich würde können helfen." → "Ich könnte helfen."`, `"Das wäre nett von du." → "Das wäre nett von dir."`; `memory_trick_de` rewritten to name all three | I diffed all three pairs against every live rule of the topic: pairs 1 and 3 appear nowhere in the live rows (the three near-verbatim duplicates of live rules oi 1/2/3 are gone). Pair 2 still collides — see N2, which is my own prescription's fault, not a regression. |
| 6 | `konjunktiv-ii-wurde` `exercises[5]` oi 21 | **CLOSED** | bracket `[ihr / uns / sicher / bei der Anmeldung / helfen / werden]` **and** `acceptable_answers` now carries `"Ihr würdet uns bei der Anmeldung sicher helfen."` (± full stop) | Both remedies applied, as the review preferred: the bracket now mirrors the key, and the cued alternative order is accepted. |
| 7 | `konjunktiv-ii-ware-hatte` `rules[0].memory_trick_de` oi 6 | **CLOSED** | `"sollte = ein Rat, müsste = eigentlich nötig, dürfte = eine Vermutung, könnte = ein Vorschlag — alle weicher als ein Befehl."` | Circular glosses gone; every gloss now carries information. |
| 8 | `konjunktiv-ii-ware-hatte` `exercises[3]` oi 12 | **CLOSED** | `"Die Kollegen ___ das wohl verstehen."` | `dürfte … wohl` is an idiomatic German collocation (unlike `dürfte … sicher`), and `wohl` blocks the `würden` reading the round-1 item allowed. |
| 9 | `konjunktiv-ii-ware-hatte` `exercises[7..9]` oi 16-18 | **CLOSED** | `"Du sollte mehr Geduld haben."`, `"Wenn er mehr Zeit hätte, er würde helfen."`, `"Ich hätte gerne ein Kaffee."` | Re-solved all three cold: keys `solltest` / `würde er helfen` / `einen Kaffee` are correct and each tests something no rule in the patch displays. Scripted check confirms **0** exercises whose prompt or key matches any new rule's mistake pair. Minor register note at N5. |
| 10 | `infinitive-with-zu` `exercises[7], [9]` oi 16, 18 | **CLOSED** | `"Ich muss zu gehen."` (rule shows `kann`/`schwimmen`) and `"Sie hat Zeit dir zu helfen."` (rule shows `keine Zeit`/`Deutsch lernen`) | No byte-identical prompt/key pairs remain anywhere in the four files (scripted). |
| 11 | `infinitive-with-zu` `rules[2].mistakes[2]` oi 8 + `exercises[9]` oi 18 | **CLOSED** (residue → N3) | rule: `"Ich habe keine Zeit Deutsch zu lernen." → "Ich habe keine Zeit, Deutsch zu lernen."` with `"Der Infinitivsatz hängt vom Nomen Zeit ab; hier ist das Komma Pflicht."`; exercise: `"Sie hat Zeit dir zu helfen." → "Sie hat Zeit, dir zu helfen."` | Both moved to genuinely noun-dependent groups, where §75(2) makes the comma obligatory — the items now find a real error. The explanation even names the reason. Best fix in the round. |
| 12 | `um-zu-ohne-zu` `rules[2].memory_trick_de` oi 8 | **CLOSED** | `"um ... zu geht nur bei gleichem Subjekt. Das Objekt steht vor zu + Infinitiv. Ein Komma öffnet den erweiterten Satz."` | The trick now names exactly the three pairs the rule contains. |
| 13 | `um-zu-ohne-zu` `rule_patches[0].new.example_de` | **CLOSED** | `"Ich lerne, um zu verstehen. (ich / ich = gleiches Subjekt)"` / `example_en: "Same subject: um zu."` | The conjugated `damit`-clause is gone. `damit` mentions outside `old` are down from 5 to 2 (`new.text_de/_en` and `rules[2].mistakes[0].explanation_de/_en`), both bare forward references. Rule oi 6 row 3 is now `"kein zu-Satz möglich"`, description `"Bei zwei verschiedenen Subjekten geht das nicht."` **The notes' claim "never a modeled damit clause" is now true of the artefact** — I verified there is no conjugated verb after `damit` anywhere outside `rule_patches[0].old`. |
| 14 | `um-zu-ohne-zu` `exercises[0..1]` oi 9, 10 | **PARTIAL** → N6 | oi 10 now `"Sie hat die Wohnung verlassen, ___ das Licht auszuschalten, und musste noch einmal zurückgehen."`; oi 9 now `"Sie spart jeden Monat Geld, ___ ein Auto zu kaufen."` | oi 10 is fixed — the "had to go back" tail makes `ohne` the only coherent reading. oi 9 is **not**: see N6. |
| 15 | `um-zu-ohne-zu` `examples[1]`, `exercises[1..2]` | **CLOSED** | `"anstatt ... zu nennt die Handlung, die nicht passiert."`, `"ohne ... zu sagt, was jemand nicht macht."`, `"ohne ... zu sagt, was fehlt."`, `"anstatt/statt ... zu nennt die Alternative."`, `"anstatt/statt ... zu nennt, was stattdessen passiert."` | All five circular German glosses replaced with explanations that carry meaning. |
| 16 | `konjunktiv-ii-wurde` `exercises[8]` oi 23 | **PROMPT fixed, explanations NOT** → **N1** | `"Wir würden das Auto meines Bruders kaufen würden."` | The prompt change works — re-solved cold, exactly one repair (drop the trailing `würden`) now yields correct German, and the Futur-I escape route is gone. But the fix stopped at the prompt: see N1. |
| 17 | `konjunktiv-ii-wurde` `exercises[4]` oi 20 | **CLOSED** | `"Ich würde gern eine billigere Wohnung finden."`, bracket `[ich / gern / eine billigere Wohnung / finden / werden]`, both `gern`-positions accepted | Plausible in a B1 learner's mouth; the adverb-order variant is still covered. |
| 18 | `konjunktiv-ii-ware-hatte` `exercises[6].related_rule_title` oi 15 | **CLOSED** | `"Advice Among Colleagues"` | That dialogue's line 2 is `"An deiner Stelle würde ich noch einmal mit ihm sprechen."` — the cross-reference now lands on content that actually shows the pattern. |
| 19 | `um-zu-ohne-zu` `exercises[4..6]` oi 13-15 | **CLOSED** | `[… um / fit / zu / sein]`, `[… ohne / sich / zu / bedanken]`, `[… anstatt / einkaufen / zu / gehen]` | One convention (`zu` immediately before its infinitive) across the file — and the author applied it to `infinitive-with-zu` oi 13 too, which I had not flagged for that file. |
| 20 | all four files (variety) | **CLOSED** | `"Ich habe die Möglichkeit, eine Ausbildung ___ beginnen."` (oi 9), `"Sie hat die Möglichkeit, sich bei der Krankenkasse zu versichern."` (oi 13), `"Anstatt zum Arzt gehen, ruft sie bei der Praxis an."` (oi 17), `"Sie ruft bei der Krankenkasse an ohne ihre Nummer zu nennen."` (oi 18) | Frame counts: `"Ich habe vor"` 5 → 2, `"Er/Sie ging, ohne"` 5 → 2, `"Anstatt zu arbeiten"` 3 → 2, `"mehr Geduld mit ihm/ihr"` 4 → 2. All four new sentences re-solved cold and are correct (`sich versichern` reflexive, comma obligatory after the noun `Möglichkeit` and after fronted `Anstatt … zu`, `ruft … an` separable with V2 after the fronted infinitive group). Amt/Arzt/Krankenkasse/Ausbildung register now present as the level file asks. |
| 21 | `um-zu-ohne-zu` `rules[2]` oi 8 (coverage) | **CLOSED** | wrong `"Ich erkläre es noch einmal, um du es besser verstehst."` → correct `"Hier geht um ... zu nicht — die Subjekte sind verschieden."` | The different-subject error is taught again, with the forward reference in the `correct` column and no modelled `damit` clause. The `ohne`+`zu` pair it displaced was the near-duplicate of live rule oi 2, so the swap improved the rule twice over. |

**Round-1 score: 20 of 21 closed, 1 partial (#14, oi 9 only).** The author's self-reported `deshalb`
slip is real and is fixed: a full regex sweep over every German-bearing field in all four files
returns **0** hits for `deshalb`, `deswegen`, `darum`, `trotzdem`, `außerdem`, `sonst`, `danach`,
`dagegen` and every other topic-9–12 connector.

## New findings introduced or surviving in round 2

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| N1 | `typed-b1.1/konjunktiv-ii-wurde.json` → `exercises[8]` oi 23, four fields | BLOCKING | prompt is now `"Wir würden das Auto meines Bruders kaufen würden."`, but `explanation_de` still reads `"Nur ein würde pro Satz; das zusätzliche 'werden' am Ende fällt weg."`, `why_correct_de` `"würden + Infinitiv (kaufen) ist vollständig; werden ist überflüssig."` (and both English twins) | The #16 fix changed the trailing token from `werden` to `würden` but left all four explanation fields naming `werden` — a word that no longer occurs in the item. A learner who gets this wrong is told to delete a word that is not there. Half-applied fixes are exactly what a delta review exists to catch; scripted check confirms this is the **only** such stale reference in the four files. | Replace `'werden'` with `'würden'` in `explanation_de`, `explanation_en`, `why_correct_de`, `why_correct_en` (e.g. `"Nur ein würde pro Satz; das zweite würde am Ende fällt weg."` / `"würden + Infinitiv (kaufen) ist vollständig; das zweite würden ist überflüssig."`). |
| N2 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `rules[2].mistakes[1]` oi 8 | MINOR | `"Ich würde können helfen." → "Ich könnte helfen."` | Both halves ship verbatim in live rule oi 5 (`tip`, `example_de: "Ich könnte helfen. (not: Ich würde können helfen.)"`), so one of the three replacement pairs still re-teaches a live rule — the defect #5 was raised about, at one third the size. **This is my error, not the author's**: my round-1 fix column prescribed this exact pair and mis-described live rule oi 5 as merely "extended" by it. Flagging it so it does not ship on my say-so. | Swap for a pair the topic does not carry, e.g. `"Ich wäre gern mehr Zeit."` → `"Ich hätte gern mehr Zeit."` (wäre/hätte confusion — the topic's single most common real error and, remarkably, untested anywhere in it). |
| N3 | `typed-b1.1/infinitive-with-zu.json` → `rules[2].memory_trick_de` / `memory_trick_en` oi 8 | MINOR | `"Längere Infinitivsätze brauchen ein Komma."` / `"Longer infinitive clauses need a comma."` | The mistake pair was correctly narrowed to the noun-dependent case (#11), but the memory trick still states the over-broad rule the finding was about — after a plain verb the comma is a Kann-Komma under §75. The rule now teaches the precise version in `mistakes[2]` and the loose version two fields later. (Course house style in `level-b1.1.md` does mandate the comma, so this is a consistency defect, not a factual one.) | `"Hängt der Infinitivsatz von einem Nomen ab, ist das Komma Pflicht."` — or add "in diesem Kurs" to keep it as house style. |
| N4 | `typed-b1.1/um-zu-ohne-zu.json` → `rules[2].mistakes[0].explanation_de` oi 8 | MINOR | `"um ... zu geht nur bei gleichem Subjekt. Für zwei Subjekte lernst du damit später im Kurs."` | `lernst du damit später im Kurs` parses first as the da-compound ("you learn *with that* later"), not as the word `damit` being named. The word-as-mention needs marking. **My round-1 wording**, reproduced faithfully — so, again, flagged rather than left to ship. | `'Für zwei Subjekte brauchst du "damit" — das lernst du später im Kurs.'` (quotes around the mentioned word, matching how `rule_patches[0].new.text_de` already phrases it). |
| N5 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `exercises[9]` oi 18 | MINOR | `"Ich hätte gerne ein Kaffee."` → `"Ich hätte gerne einen Kaffee."` | Every other occurrence in this topic — live example 2, live exercise 15, new dialogue line 1, new example oi 10, new exercise oi 9 — uses `gern`. `gerne` is standard German, but the single deviation reads as a way around the duplicate check against the live row `"Ich hätte gern einen Kaffee."`, and it teaches a register the rest of the topic does not use. | Use `gern` and change the noun instead: `"Ich hätte gern ein Termin."` → `"Ich hätte gern einen Termin."` (same accusative test, no collision, and it matches the topic's Amt/Arzt register). |
| N6 | `typed-b1.1/um-zu-ohne-zu.json` → `exercises[0]` oi 9 | MINOR | `"Sie spart jeden Monat Geld, ___ ein Auto zu kaufen."` key `um` | The rewrite did not remove the second reading — it strengthened it. `"Sie spart jeden Monat Geld, anstatt ein Auto zu kaufen."` ("she saves instead of buying a car") is entirely natural German, and saving-vs-buying is the canonical `anstatt` frame; `ohne` also parses. As in round 1, only the English cue `Base form: um` prevents a correct answer being marked wrong, and this item is the topic's own connector drill. | Use a purpose that has no alternative-action reading: `"Sie lernt jeden Abend Vokabeln, ___ die Prüfung im Juni zu schaffen."`, or add `anstatt` to `acceptable_answers` and drop the pin. |

## Sweeps re-run in full on the round-2 bytes (all clean unless noted)

Ban-list regex over every German-bearing field, excluding `rule_patches[0].old`: the only hits are
`als` as a comparative/role particle (`höflicher als der Imperativ`, `zählt als Position 1`), `bis
Freitag` as a temporal preposition, and the two sanctioned `damit` forward references — **no**
topic-9–12 conjunction, connector or two-part connector; **0** hits for `deshalb`. Konjunktiv II der
Vergangenheit, Passiv in any tense, Konjunktiv I, Plusquamperfekt, Partizip-als-Adjektiv: **0**.
Präteritum: no exercise key is a past-tense form; `ging` (um-zu oi 16) is on the productive list and
is not the target; `musste` (um-zu oi 10 prompt) is a modal Präteritum, allowed; `verließ` remains
example-only, which the ruling permits receptively. 20-word cap on every `*_de`, `question_de`,
`correct_answer`, `wrong`, dialogue `de` and table cell: **0 over** (longest is 14). `related_rule_title`
resolves on all 40 exercises. `options: null` and `correct_answer ∈ acceptable_answers` on all 40; no
`multiple_choice`. `order_index` unchanged and contiguous per topic (16-25 / 9-18 ×3; rules 6-8;
examples 9-12); rule types are `table`/`dialogue`/`common_mistakes` on each patched topic, one
`common_mistakes` with 3 pairs and one 6-line dialogue each. No `question_de`, `sentence_de` or
multi-word `correct_answer` duplicates any live row of its topic, and **no** exercise prompt or key
matches any new rule's mistake pair (findings #9/#10 verified closed by script, not by eye).
`grammar_highlight`: every ellipsis half is a substring. `word_breakdown`: all 12 examples tokenise
their sentence in order with full coverage, including the rebuilt oi 12. `rule_patches`: still
exactly one, `field: content` on rule `adba8282-abd7-4646-9c62-dcd80fd440f7` (oi 5), and `old` is
**byte-exact** against `source/um-zu-ohne-zu.json` on all four keys (deep-equal, re-verified).
Repo untouched (`git status --porcelain` empty).

VERDICT: FAIL (1 blocking, 6 minor)

Judgement: this is a genuine round-2, not a cosmetic one — 20 of 21 findings are properly closed, and
several fixes are better than what I asked for (#11 moved both the rule and the exercise to a
comma-obligatory construction and named the reason; #21 displaced a live-duplicate pair to make room;
#19 was applied to a file I had not flagged). The single blocking item is a half-applied fix: #16
changed the prompt of `konjunktiv-ii-wurde` oi 23 and left four explanation fields describing the old
one. Two of the six minors (N2, N4) are my own round-1 prescriptions coming back wrong, and I would
not hold the PR for them if the orchestrator prefers to ship — but N1 must be fixed, it is four string
edits, and it needs no further review round beyond confirming those four fields name `würden`.
