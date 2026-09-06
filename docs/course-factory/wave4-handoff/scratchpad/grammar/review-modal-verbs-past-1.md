# Adversarial review — `modal-verbs-past.json` (round 1)

Reviewer: Opus adversarial reviewer, Wave 4.
Under review: `S/wave4/grammar/modal-verbs-past.json` + `modal-verbs-past.notes.md`
Against: `S/wave4/level-a2.1.md` (binding), `S/wave4/grammar-brief.md`.
Read order followed: level file → brief → wave3 `imperative.json` (shape reference) →
deliverable in full → notes.

## Validator

```
$ node scripts/check-grammar-json.mjs \
    /tmp/.../scratchpad/wave4/grammar/modal-verbs-past.json
OK: 1 file(s) validated, no violations.
```

## What I tried before writing findings (so "few findings" is falsifiable)

1. **Recomputed all 36 cells of the rule-1 6×6 table** from scratch (können/müssen/wollen/
   dürfen/sollen/mögen × ich/du/er/wir/ihr/sie) and compared to the file. All 36 correct:
   no umlaut anywhere, `-st` on du, `-t` on ihr, `-n` on wir/sie, ich = er/sie/es, and
   mögen's g→ch present in all six persons. **No defect.**
2. **Solved all 26 exercises cold**, writing my answer before reading `correct_answer`.
   My answer matched the key on 26/26. The failures below are cue/coverage failures, not
   key failures.
3. **Machine-scanned every German field** (359 strings, `_de` + `sentence_de`/`question_de`/
   `correct_answer`/`acceptable_answers`/`options`/`rows`/`points`/`wrong`/`correct`/
   `grammar_note`) for: `als` + pronoun, `weil|dass|wenn|ob`, `würde*`, `werde*`, Genitiv
   `des …s`, `um … zu`, Komparativ `-er als`, reflexive `sich`, and full-verb Präteritum
   (`ging|kam|sagte|gab|wurde|fuhr|sah|machte|arbeitete|blieb|nahm|fand|stand`).
   Result: **zero** als-clauses, zero Nebensätze, zero Futur, zero Konjunktiv II in
   production, zero Genitiv, zero full-verb Präteritum. The only non-modal Präteritum forms
   in the whole file are `war/waren` and `hatte/hatten` (A1, explicitly allowed). The only
   two `sich` hits are the metalanguage "Nur das Modalverb ändert sich" — which matches
   live A2.1 precedent (`accusative-intro`, `dative-case`, `prepositions-accusative` all
   ship "Wie sich Artikel … ändern" / "ändert sich"), so it is not charged as a violation.
4. **`könnte` / `müsstest` audit** (the specific risk in this topic): `könnte` occurs 4×,
   `müsstest` 2×, and **every single occurrence is a marked-wrong form** — rule 7 mistake 1
   (`wrong` field + its explanation), s4#07 distractor + `why_correct`, s4#08 distractor +
   `why_correct`. Never a key, never an acceptable answer, never a rule example. **Clean.**
5. **Satzklammer check on all 150 distinct German sentences containing a past modal**: the
   infinitive is final in every one, or absent by design (`Ich musste zum Arzt.`,
   `Sie wollte nach Hause.`, `Wann musstest du nach Hause?`, `Früher mochte ich keinen
   Kaffee.`). The only bracket-violating strings are the deliberately-wrong ones
   (rule 7 mistake 3, s4#12 stem, s5#12 distractors). **No defect.**
6. **Sentence length**: word-counted every German sentence. Longest is 12 words
   (`exercises/24/why_correct_de`). Cap is 14. **No defect.**
7. **MC audit**: 4 MC items, 4 options each, key present, options unique, keys at indices
   2/0/1/3 (no positional tell). I attacked each distractor for a second defensible
   reading — `könnte`/`müsstest` (Konjunktiv II, impossible with `gestern`/`Wann … nach
   Hause?`), `musste` for du, `gekonnt`/`gemocht` (participles), `konnt`/`mustest`/
   `mochtete` (non-forms), and the three word-order distractors in s5#12
   (`… arbeiten am Montag`, `Ich am Montag musste …`, `… arbeiten lange`). **Exactly one
   defensible answer per item.** No defect.
8. **`acceptable_answers` programmatic audit**: every typed item's `correct_answer` is in
   the array, no duplicates, and every sentence-shaped variant has both its with- and
   without-final-punctuation twin. Fronted variants are listed on s5#01/#02/#05/#06/#13 and
   s4#11/s5#11. One real gap found (B1 below) and two policy inconsistencies (m11).
9. **Shape / renderer**: rule types, `order_index` (-1 … 7, 99 — matches the shipped
   `imperative.json` convention, so not a "contiguous 1..n" violation), 9 rules, 10 examples,
   26 exercises (13+13), 22 typed / 4 MC, every `grammar_highlight` a substring, every
   `word_breakdown` exactly covering its tokens. Checked `pattern`→`steps` and `dialogue`→
   `exchanges` against `astro-site/src/components/RuleContent.astro` (lines 37, 248, 257)
   and against the live `modal-verbs-intro` / `dative-case` dialogue rows — shapes match, so
   both render.
10. **Slug existence** against `grammar-content-cache.json`: `modal-verbs-intro`,
    `perfect-tense-haben`, `perfect-tense-sein` all live. `temporal-prepositions` does not
    exist yet (m9).
11. **Non-duplication**: compared all 9 rule titles against the brief's live-A2.1 list and
    against `modal-verbs-intro`'s 10 live rule titles. No title collision; the overlaps
    (Satzklammer, modal-without-infinitive) are explicitly framed as extensions of the
    A1.2 topic, as the brief requires. **No defect.**

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| B1 | modal-verbs-past.json — `exercises` s5 #08 (`question_en`, `acceptable_answers`) | BLOCKING | question_de `"Schreib im Präteritum: Ich möchte einen Termin haben."` / question_en `"Rewrite in the Präteritum: I would like an appointment. → I wanted an appointment."` / acceptable_answers `["Ich wollte einen Termin haben.", "Ich wollte einen Termin haben"]` | The English cue drops `haben` on **both** sides: "I would like an appointment" is `Ich möchte einen Termin`, and the stated target "I wanted an appointment" is exactly `Ich wollte einen Termin.` — a legitimate, level-correct German sentence that the key rejects. Rule 3 row 6 teaches precisely that pair (`Ich möchte einen Termin.` → `Ich wollte einen Termin.`), so the learner who followed the lesson **and** the learner who followed the English cue both get marked wrong on a stage-5 free-production item. Per the brief, a typed item with a legitimate answer missing from `acceptable_answers` is a wrong key. | Either add `"Ich wollte einen Termin."` / `"Ich wollte einen Termin"` to `acceptable_answers`, or fix the English cue to "I would like to have an appointment. → I wanted to have an appointment." Preferably both. |
| B2 | modal-verbs-past.json — `rules[4]` (`explanation_comparison`, order_index 4), table row 7 | BLOCKING | `["wollte (für möchte)", "would have liked", "Ich wollte einen Termin haben."]` under the header `"English meaning"` | `wollte` does not mean "would have liked" — that is Konjunktiv II Perfekt (`hätte gern gehabt`), which is B1+ and banned here. `Ich wollte einen Termin haben.` means "I wanted to have an appointment." The file contradicts itself: rule 3 glosses the same substitution as "I wanted an appointment", and s5#08's `why_correct_en` says "the polite wish möchte becomes wollte in the past". A meaning table is exactly what a learner memorises, so a false gloss in it is a content defect of the same class as a wrong key. | Change the gloss to `"wanted (to have)"` and make rule 3 row 6, rule 4 row 7 and s5#08 use one and the same German sentence. |
| m1 | modal-verbs-past.json — `exercises` s5 #01–#07, #09, #10 `explanation_de` (9×) | MINOR | `"können wird konnte."`, `"wollen wird wollten."`, `"mögen wird mochte."`, `"dürfen wird durften: …"` | Bare `X wird Y` as grammatical metalanguage is unidiomatic; German teaching prose uses `Aus können wird konnte.` or the arrow `können → konnte`. It is the single most repeated German construction in the file, so it sets the register for the whole topic. | `Aus können wird konnte.` (or the arrow form used in rule 2). |
| m2 | modal-verbs-past.json — `rules[4]` row 6, `rules[7]` mistake 6, `examples[5]`, s4#06, s4#13, s5#06 | MINOR | `Früher mochte er keinen Käse.` / `Früher mochte ich keinen Kaffee.` / `Früher ___ ich keinen Fisch.` / `Früher ___ ich keinen Tee.` | All seven occurrences of `mochte` in the topic use one frame — `Früher … kein… <Lebensmittel>` — with only the noun swapped. `mochte` is never produced affirmatively (`Ich mochte den Film.`), never in du/wir/ihr outside the table, and never with an infinitive. The learner drills a slot, not a form. | Vary at least two: one affirmative (`Als Getränk mochte ich nur Tee.` ✗ — use `Früher mochte ich nur Tee.`), one non-ich person, one non-food object. |
| m3 | modal-verbs-past.json — s4#01, s4#07, s4#11, s4#12, s4#13, s5#06, s5#11 | MINOR | s4#11 key `"Ich musste gestern arbeiten."` = `rules[7]` mistake 2 `correct`; s4#12 key `"Wir wollten nach Hause gehen."` = mistake 3 `correct`; s4#01 key sentence = `rules[0].content.preview_example_de`; s5#06 key = `rules[4]` table cell | Seven of 26 items reproduce a string that is printed verbatim in the rules; the whole `common_mistakes` rule is re-served as s4#07/#11/#12/#13 and s5#11. Recognition items may legitimately mirror the lesson, but s5#06 is a **stage-5 free-production** item whose answer sits in a rule table. | Re-word the stage-5 items (new person, new object, new time adverb) so stage 5 tests transfer, not recall of a printed cell. |
| m4 | modal-verbs-past.json — `rules[3]` table, row 3, English column | MINOR | `"Are you allowed to come along? / Were you?"` | Every other row gives a full present/past English pair; this one truncates the past to "Were you?", which does not show the learner what `Durftest du mitkommen?` means. | `"Are you allowed to come along? / Were you allowed to come along?"` |
| m5 | modal-verbs-past.json — `rules[5].key_insight_en/de` | MINOR | `"Never say Ich habe gemusst. Say Ich musste."` / `"Sag nicht: Ich habe gemusst. Sag: Ich musste."` | `Ich habe (es) gemusst` is attested German for the infinitive-less use; the blanket prohibition overstates. It also contradicts the deliverable's own notes ("it never claims that form does not exist") and the rule body, which correctly says the Perfekt of modals "waits until B1". | `Im Alltag sagst du: Ich musste. Das Perfekt von Modalverben lernst du später.` (keep the honest framing already in `content_de`). |
| m6 | modal-verbs-past.json — `examples[6].sentence_en`, s5#12 `question_en` | MINOR | `"Did you have to work late yesterday?"` for `Musstest du gestern lange arbeiten?`; `"I had to work late on Monday."` for `Ich musste am Montag lange arbeiten.` | Idiomatic but loose: `lange` = "for a long time" (which is what the same example's own `word_breakdown` says). "late" invites the learner to back-translate as `spät`. | "work a long time" / "work long hours". |
| m7 | modal-verbs-past.json — `examples[9].word_breakdown` | MINOR | `"konnten": "could not (können, Präteritum, wir)"` alongside `"nicht": "not"` | The negation is glossed twice; `konnten` alone is "could / were able to". | `"konnten": "could, were able to (können, Präteritum, wir)"`. |
| m8 | modal-verbs-past.json — `topic.description_de` | MINOR | `"Lerne das Präteritum von den sechs Modalverben."` | Grammatical and Genitiv-free, but stilted; `von + Dat` as a Genitiv replacement reads awkwardly right after "das Präteritum". | `"Lerne das Präteritum bei den sechs Modalverben."` or `"Lerne die Präteritumformen der Modalverben."` (if Genitiv in a title-like phrase is acceptable to the level owner — otherwise the `bei` version). |
| m9 | modal-verbs-past.json — `topic.related_slugs` | MINOR | `["perfect-tense-sein", "temporal-prepositions"]` | The brief says "existing slugs only"; `temporal-prepositions` is this wave's topic 12 and is not in `grammar-content-cache.json`. `[level]/[slug].astro` drops unknown slugs (`.filter(Boolean)`), so nothing breaks — but a non-empty `related_slugs` **bypasses** the `RELATED_TOPICS` static fallback entirely, so until topic 12 ships the page renders exactly one related topic. | Either add a live third slug (`imperative-mood`, `dative-case`) so the block survives, or drop `temporal-prepositions` until topic 12 is inserted. |
| m10 | modal-verbs-past.json — `rules[6]` dialogue, exchanges 2 and 6 | MINOR | `"Kein Problem. Waren Sie krank?"` … `"Kein Problem. Ich konnte ihr alles sagen."` | The same speaker opens two of his three turns with the identical chunk in a six-line dialogue. | Vary the second: `"Alles gut. Ich konnte ihr alles sagen."` |
| m11 | modal-verbs-past.json — s4#12, s5#07 `acceptable_answers` | MINOR | s5#07 `["Wir konnten das Zimmer nicht finden.", "Wir konnten das Zimmer nicht finden"]` | The file's stated policy (notes §5) is that position 1 is free and fronted variants are listed. s5#01/#02/#05/#06/#13 do list them; s4#12 and s5#07 do not, although `Nach Hause wollten wir gehen.` and `Das Zimmer konnten wir nicht finden.` are grammatical (marked, but not wrong). Not charged as blocking because both items' cues fix the opener in effect, but the policy is applied inconsistently. | Either add the topicalised variants or state in `why_correct` that the given order is the one being tested. |
| m12 | modal-verbs-past.json — `topic.icon`, `topic.difficulty` | MINOR | `"icon": "⏳"`, `"difficulty": "intermediate"` | Both are already flagged in the notes and both are harmless: the brief mandates an emoji while every live row carries `"book"`, and `difficulty` is not in the `grammar_topics` INSERT in `scripts/grammar-topics-from-json.mjs` (line 618), so the generator silently drops it. Recording the divergence so the integration step decides once, not per topic. | Wave owner's call; no change needed to ship. |

VERDICT: FAIL (2 blocking, 12 minor)

The German is the strongest part of this deliverable: the 6×6 Präteritum table is correct in
all 36 cells, the Satzklammer holds in every one of the 150 past-modal sentences, no full-verb
Präteritum and no als-clause exists anywhere in the file, `könnte`/`müsstest` appear only as
marked-wrong forms, and no German sentence exceeds 12 words. Both blocking findings sit on the
same seam — the `möchte → wollte` substitution, which the file renders three different ways
across rule 3, rule 4 and s5#08, one of them a false English gloss and one of them a key that
rejects the very sentence rule 3 taught. Fix that seam consistently and this passes; the twelve
minors are polish, of which m1 (nine instances of `X wird Y`) and m2/m3 (mögen drilled in one
frame, seven items recalling printed strings) are the two worth spending time on.
