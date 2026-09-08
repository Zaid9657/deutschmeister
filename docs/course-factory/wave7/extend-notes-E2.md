# Notes — Author E2, Wave 7 PR A2 (B1.1 EXTEND), round 3

## Validator output (round 3, verbatim)

```
$ node scripts/check-grammar-json.mjs \
    S/extend/typed-b1.1/konjunktiv-ii-wurde.json \
    S/extend/typed-b1.1/konjunktiv-ii-ware-hatte.json \
    S/extend/typed-b1.1/infinitive-with-zu.json \
    S/extend/typed-b1.1/um-zu-ohne-zu.json \
    --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
```

## Round 3 (response to `S/reviews/extend-E2-review-2.md`)

- **N1 (BLOCKING)**: konjunktiv-ii-wurde oi 23 — the prompt already doubled `würden`, but
  `explanation_de/en` and `why_correct_de/en` still named `werden`. All four reworded to name
  `würden` (`"Nur ein würde pro Satz; das zweite 'würden' am Ende fällt weg."` etc.).
- **N2**: ware-hatte rule oi 8 pair 2 (`"Ich würde können helfen."`, a live-rule-oi-5 duplicate)
  replaced with the orchestrator's exact wording: `"Könnten Sie mir bitte helfen würden?"` →
  `"Könnten Sie mir bitte helfen?"`.
- **N3**: infinitive-with-zu rule oi 8 memory_trick's blanket comma claim narrowed to house style:
  `"In diesem Kurs schreiben wir das Komma vor dem erweiterten Infinitiv immer."`
- **N4**: quoted the mentioned word — `'Für zwei Subjekte brauchst du "damit" — das lernst du
  später im Kurs.'` — applied to both the restored mistake's explanation and (for the same
  da-compound risk) `rule_patches[0].new.text_de/text_en`; `rule_patches[0].old` untouched and
  re-verified byte-exact.
- **N5**: `gerne` → `gern`, noun changed to avoid the `Ich hätte gern einen Kaffee.` live-row
  collision: `"Ich hätte gern ein Termin."` → `"Ich hätte gern einen Termin."` (checked against the
  live cache — no collision).
- **N6**: um-zu-ohne-zu oi 9 rewritten to a purpose-only frame with no `anstatt`/`ohne` reading:
  `"Sie lernt jeden Abend Vokabeln, ___ die Prüfung im Juni zu schaffen."`

Nothing else was touched: ids, order_index and rules/examples/exercises counts are identical to
round 2 (re-diffed), and `rule_patches[0].old` is still byte-exact against
`source/um-zu-ohne-zu.json`.

## Sweep re-run after round 3 (all four files)
Validator clean (above). Scripted re-check: no duplicate `question_de`/`correct_answer` against
live rows or internally; every German sentence ≤20 words; 0 banned-list/topic-9–12 hits outside
`rule_patches[0].old`; every `related_rule_title` resolves; `word_breakdown` full coverage on all
12 examples; **stale-token check** (new this round) scanned every `error_correction` item's
`explanation_de/en` and `why_correct_de/en` for a single-quoted word not present in that item's
`question_de`/`correct_answer` — 0 hits; 0 remaining `gerne`.

---

# Round 2 notes (superseded above where a round-3 fix applies; kept for the fix-by-fix record)

## Validator output (round 2, verbatim)

```
$ node scripts/check-grammar-json.mjs \
    S/extend/typed-b1.1/konjunktiv-ii-wurde.json \
    S/extend/typed-b1.1/konjunktiv-ii-ware-hatte.json \
    S/extend/typed-b1.1/infinitive-with-zu.json \
    S/extend/typed-b1.1/um-zu-ohne-zu.json \
    --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
```

Counts, ids and order_index are unchanged from round 1 (verified programmatically): 10 exercises per
topic at the same order_index ranges (16-25 / 9-18×3), 3 rules at oi 6-8 and 4 examples at oi 9-12 on
the three depth-patched topics, exactly 1 `rule_patch`, and `rule_patches[0].old` still byte-exact
against `source/um-zu-ohne-zu.json`'s rule `adba8282-abd7-4646-9c62-dcd80fd440f7` (re-diffed
programmatically after every edit).

## Response to round-1 review (`S/reviews/extend-E2-review-1.md`)

### BLOCKING
- **#1** `konjunktiv-ii-ware-hatte.json` examples[3] (oi 12): rewrote to
  `"An ihrer Stelle würde ich zuerst mit der Kollegin sprechen."`; `explanation_de` → `"An ihrer
  Stelle + würde ich gibt einen Rat."`; `grammar_highlight` → `"würde ich"`; `word_breakdown`
  rebuilt (dropped `sollte`/`sie`, added `würde ich`).
- **#2** `konjunktiv-ii-ware-hatte.json` exercises[0].why_correct_de (oi 9): `"habens"` calque fixed
  to `"hätte ist die ich-Form des Konjunktivs II von haben."`
- **#3** `infinitive-with-zu.json` exercises[7].explanation_de (oi 16): verb-third fixed to
  `"...; der reine Infinitiv folgt direkt."`
- **#4** `um-zu-ohne-zu.json` rules[2].mistakes (oi 8): the `fragen`+direct-object pair rewritten to
  `"Sie ruft an, um zu fragen nach den Öffnungszeiten."` → `"Sie ruft an, um nach den
  Öffnungszeiten zu fragen."`, object mirrored in both explanations.
- **#5** `konjunktiv-ii-ware-hatte.json` rules[2] (oi 8): all three `common_mistakes` pairs replaced
  with content the topic does not already carry: person agreement (`"Wenn ich du wärst, ..."` →
  `"Wenn ich du wäre, ..."`), modal double-conjugation (`"Ich würde können helfen."` → `"Ich könnte
  helfen."`), case after `von` (`"Das wäre nett von du."` → `"Das wäre nett von dir."`).
  `memory_trick_en/de` rewritten to match.
- **#6** `konjunktiv-ii-wurde.json` exercises[5] (oi 21): bracket reordered to
  `[ihr / uns / sicher / bei der Anmeldung / helfen / werden]` to mirror the key, **and** added
  `"Ihr würdet uns bei der Anmeldung sicher helfen."` (±full stop) to `acceptable_answers` (did
  both, as the review preferred).

### MINOR
- **#7** rule oi 6 memory_trick_de (ware-hatte): circular glosses replaced with the reviewer's exact
  text (`sollte = ein Rat, ...`).
- **#8** exercises[3] (oi 12, ware-hatte): `sicher` → `wohl` (removes the `würden`-also-fits
  reading).
- **#9** exercises oi 16-18 (ware-hatte): all three re-pointed at fresh content not shown in any
  rule — `sollte` du-form missing `-st`, main-clause verb-second after a wenn-clause, accusative
  case after `hätte gern`.
- **#10** exercises oi 16 (infinitive-with-zu, "Ich muss zu gehen.") and oi 18 ("Sie hat Zeit dir zu
  helfen.") no longer byte-identical to the rule's mistakes.
- **#11** infinitive-with-zu rule oi 8 mistake[2] and exercise oi 18 both moved to a genuinely
  noun-dependent (comma-obligatory) case: `"Ich habe keine Zeit Deutsch zu lernen."` (rule) /
  `"Sie hat Zeit dir zu helfen."` (exercise) — no more Kann-Komma claimed as a hard rule.
- **#12/#21** um-zu-ohne-zu rule oi 8: restored the different-subject pair using the reviewer's
  exact wording (`wrong: "Ich erkläre es noch einmal, um du es besser verstehst."` /
  `correct: "Hier geht um ... zu nicht — die Subjekte sind verschieden."` — correct side is the
  forward reference, no conjugated `damit` clause); the old `ohne`+`zu` pair (a near-duplicate of
  live rule oi 2's own `common_mistakes`) was dropped to make room, keeping the word-order pair
  (#4) and the comma pair. `memory_trick_en/de` rewritten to name all three.
- **#13** `rule_patches[0].new.example_de/example_en`: dropped the `damit` half
  (`"Ich lerne, um zu verstehen. (ich / ich = gleiches Subjekt)"` / `"Same subject: um zu."`).
  Trimmed every non-mandated `damit` mention out of rule oi 6 (description, row 3, memory trick —
  now say only "this construction does not work" without naming `damit`). The two remaining
  `damit` locations in the file are both required verbatim by binding instructions: the restored
  mistake pair (#12/#21) and `rule_patches[0].new.text_de/text_en` (unchanged from round 1, per
  "keep `rule_patches[0].old` byte-exact" — the `new.text_*` fields were not touched since the
  reviewer accepted them). **The "never a modeled `damit` clause" claim in round-1 notes is now
  true of the shipped artefact**; every `damit` occurrence outside `rule_patches[0].old` is either
  the bare "später im Kurs" forward reference or the explicit non-clause `"Hier geht um ... zu
  nicht"` fix text.
- **#14** um-zu-ohne-zu exercises oi 9/10: oi 9 reworded to `"Sie spart jeden Monat Geld, ___ ein
  Auto zu kaufen."` (purpose only); oi 10 extended with `"..., und musste noch einmal
  zurückgehen."`, which only coheres with `ohne` (going back again implies she'd forgotten).
- **#15** circular German explanations (`"anstatt ... zu = anstatt zu tun."` etc.) rewritten to
  actually explain: `"anstatt ... zu nennt die Handlung, die nicht passiert."` /
  `"ohne ... zu sagt, was jemand nicht macht."` / `"anstatt/statt ... zu nennt die Alternative."`
  (examples[1].explanation_de, exercises oi 10/oi 11 in um-zu-ohne-zu).
- **#16** konjunktiv-ii-wurde exercises[8] (oi 23): doubling changed to
  `"...kaufen werden."` → `"...kaufen würden."` so only one repair (drop the trailing `würden`)
  produces correct German.
- **#17** konjunktiv-ii-wurde exercises[4] (oi 20): implausible tenant-lowers-rent sentence
  replaced with `"Ich würde gern eine billigere Wohnung finden."`.
- **#18** related_rule_title for ware-hatte exercises[6] (oi 15, "An seiner Stelle...") repointed
  from `"Common Expressions"` to `"Advice Among Colleagues"` (the dialogue rule that actually shows
  `an ... Stelle würde ich`).
- **#19** um-zu-ohne-zu exercises oi 13/14 brackets reordered so `zu` sits immediately before its
  infinitive in every bracket, matching oi 15's convention. Also fixed the same defect in
  infinitive-with-zu's oi 13 (not explicitly flagged for that file, same underlying issue).
- **#20** re-lexicalised into Amt/Arzt/Krankenkasse scenarios: um-zu-ohne-zu oi 17 ("Anstatt zum
  Arzt gehen..." replacing the third "Anstatt zu arbeiten") and oi 18 ("Sie ruft bei der
  Krankenkasse an..." replacing one of the five "Er/Sie ging, ohne" frames); infinitive-with-zu oi
  9 ("die Möglichkeit, eine Ausbildung ... zu beginnen") and oi 13 ("die Möglichkeit, sich bei der
  Krankenkasse zu versichern") replacing two of the five "Ich habe vor" frames (a third — rule oi 8
  mistake[2] — was already replaced under #11, for a total of 3 removed as the review asked).

### Also caught while re-verifying (not in the original 21, same class of defect)
- `konjunktiv-ii-ware-hatte.json` exercises oi 17's new `why_correct_de` used `deshalb` — a topic-11
  connector, banned before its lesson. Reworded to a semicolon clause with no connector.

## Cross-cutting checks re-run after every edit (all four files)
- `check-grammar-json.mjs --cache grammar-content-cache.json`: clean (see output above).
- No duplicate `question_de`/`correct_answer` against each topic's live rows, and no internal
  duplicates — re-diffed after the round-2 edits.
- All German sentences (question_de/correct_answer/example sentence_de) ≤20 words.
- No topic 9-12 leakage and no banned-list word outside `rule_patches[0].old` (scripted regex sweep
  re-run after every edit; caught and fixed the `deshalb` slip above).
- `related_rule_title` resolves against live + new rule titles on every exercise (re-checked;
  #18's repoint verified against the actual dialogue content).
- `word_breakdown` full-coverage check re-run on all 12 examples — still 0 gaps (only example[3] in
  ware-hatte changed content, and its breakdown was rebuilt to match).
- order_index/rule/example/exercise counts and ids unchanged from round 1 (diffed).
