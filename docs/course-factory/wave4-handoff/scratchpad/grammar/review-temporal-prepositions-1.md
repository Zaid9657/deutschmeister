# Adversarial review — `temporal-prepositions` (round 1)

Deliverable: `S/wave4/grammar/temporal-prepositions.json` + `.notes.md`
Against: `S/wave4/level-a2.1.md` (binding), `S/wave4/grammar-brief.md`
Reviewer method: level file → brief → both deliverable files in full → all 26 exercises
re-solved cold before reading any key → validator → scripted sweeps (below).

## Validator

```
$ node scripts/check-grammar-json.mjs \
    /tmp/.../scratchpad/wave4/grammar/temporal-prepositions.json
OK: 1 file(s) validated, no violations.
```

## What I tried that came back clean (so the two blockers are not the whole review)

1. **Ban sweep** over every German-bearing field (regex over the full JSON): no
   weil/dass/wenn/ob/als-Nebensatz, no Präteritum of a full verb, no Konjunktiv II, no Futur,
   no Passiv, no reflexive, no Komparativ/Superlativ, no Genitiv, no `während`. The only
   Präteritum hit is `war` (A1-allowed), 4×.
2. **Sentence length**: longest learner-facing German sentence = **12 words** (cap 14). The
   author's notes claim 12; confirmed independently.
3. **Case audit, preposition by preposition**: `vor/nach/seit/ab/zwischen` → Dativ (rule 2 table,
   summary bullet 2, mistakes 2/4/5, S4#5/#6/#10, S5#3/#4/#5/#7); `gegen` → Akkusativ;
   `am/im` = an/in + dem with `in der Nacht` carried as the exception; `ab dem 1. Mai` dative;
   dative plural `-n` drilled three times (`zwei Jahren`, `zwei Tagen`, `drei Monaten`,
   `zwei Monaten`). **No wrong case claim anywhere in the file.**
4. **"seit + Präsens" overlap with live `prepositions-dative`**: rule 4 does what the brief asks —
   cites the live rule as known ("Das kennst du") and adds `vor` + Perfekt as the new half. The
   pedagogy is correct; the overlap defect is at sentence level only (B1 below).
5. **Shape**: key sets identical to the shipped `S/wave3/grammar/imperative.json` (incl. `hint` /
   `related_rule_title` present-but-null); 9 rules, 10 examples, 26 exercises (13/13), 20 typed
   vs 6 multiple_choice, order_index contiguous, every `grammar_highlight` a real substring,
   `word_breakdown` covers **every** token of all 10 examples.
6. **Rule-title collision** against all 72 live topics (both languages): none.
7. **Answer keys**: I solved all 26 items before reading the keys; my answer matched on 26/26.
   Only S5#10 admits a second correct answer that the key rejects (B2).
8. **Author doubts 1 and 3 verified and accepted**: all 72 live topics carry `icon: "book"`
   (checked in `grammar-content-cache.json`), and `buildTopicRow` in
   `scripts/grammar-topics-from-json.mjs` has no `difficulty` column and no live topic row
   carries one. Keeping `"book"` and omitting `difficulty` is right; the brief is what is stale.
   Doubt 2 (`modal-verbs-past` in `related_slugs`) is fine if Wave 4 ships as one migration.
   Doubt 6 (`bis nächste Woche`) is sanctioned — the level file writes that chunk itself.
9. **Cross-corpus duplicate sweep**: every new German sentence (examples, filled exercise stems,
   typed answers) normalised and matched against every example and every filled exercise of all
   72 live topics. Exactly one exact hit — B1.

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| B1 | temporal-prepositions.json:`examples[4]` (order_index 5) | **BLOCKING** | `"Ich lerne seit zwei Jahren Deutsch."` | Verbatim duplicate of the live `prepositions-dative` stage-4 exercise #8 (`Ich lerne ___ zwei Jahren Deutsch.` → `seit`), and a near-duplicate of that topic's own example `Ich lerne seit einem Jahr Deutsch.`. The brief bans duplicating live content it names, and it names `prepositions-dative … seit + present` explicitly. One of only 10 example slots is spent re-showing a sentence the learner has already met twice in topic 2. (Rule 4 row 1 and mistake 3 re-use the same frame, which is defensible there because rule 4 is the seit/vor contrast; the *example* is not.) | Replace the example sentence with one that carries the new half of the rule, e.g. a seit-sentence in a frame not used by topic 2 (`Meine Schwester arbeitet seit einem Monat in Wien.`), or make example 5 the seit↔vor pair itself. Also correct the notes, which assert overlap was checked. |
| B2 | temporal-prepositions.json:`exercises` S5#10 (`error_correction`) | **BLOCKING** | `correct_answer: "Ich bleibe bis Sonntag."`, `acceptable_answers: ["Ich bleibe bis Sonntag.", "Ich bleibe bis Sonntag"]`; `why_correct_de: "Nach bis steht der Tag allein. Der Artikel ist hier falsch."` | The prompt sentence `Ich bleibe bis dem Sonntag.` is wrong because `bis` + article requires `zu` — and **`Ich bleibe bis zum Sonntag.` is correct standard German, keeps the word order, and repairs the error**. It is missing from `acceptable_answers`, so a learner who writes the idiomatic repair is marked wrong (the brief: a typed item with a legitimate answer missing from `acceptable_answers` is wrong). The `why_correct_de` compounds it by stating an absolute that is false (`bis zum 3. Mai`, `bis zur Pause`); rule 5 itself is correctly hedged with "meistens", so the exercise contradicts its own rule. | Add `"Ich bleibe bis zum Sonntag."` + the no-period variant to `acceptable_answers`; **or** re-cue the item (`question_en`: "delete the article", `question_de`: "Streich den Artikel") and change `why_correct_de` to `bis + Artikel braucht zu: bis zum Sonntag. Ohne Artikel ist es einfacher: bis Sonntag.` The first option is safer — it also closes the teaching gap that `bis + zu` is never mentioned in the topic. |
| M1 | `rules[2]` (`order_index` 2) `key_insight_de`/`key_insight_en`; notes §"Built on the live topics" | MINOR | `"gegen kennst du mit Akkusativ. Bei der Uhrzeit heißt gegen: ungefähr."` / notes: "rule 2's key_insight extends it to the temporal 'ungefähr' reading, **which is new**" | It is not new. Live A1.2 `prepositions-accusative` rule 7 is `gegen für ungefähre Zeit / gegen for Approximate Time`, key_insight `um = genaue Zeit. gegen = ungefähre Zeit.` The file tells the learner (and the notes tell the reviewer) something about prior coverage that is false. | Reframe as a recap like rule 1: `gegen für ungefähre Zeit kennst du schon. Hier steht es neben um, ab und bis.` Correct the notes claim. |
| M2 | whole file (16×) | MINOR | `"vor hat Dativ."`, `"seit hat Dativ."`, `"Fünf Präpositionen haben Dativ"`, `"Mit Artikel hat ab den Dativ"` | A preposition does not "have" a case; it takes/requires one. The formula `X hat Dativ` occurs **zero** times in the 72 live topics, which use `verlangt Dativ` / `nehmen immer Dativ` / `braucht Dativ`. Unidiomatic metalanguage and a house-style break, repeated 16 times. | Global replace with `steht mit Dativ` / `verlangt Dativ` (`Nach vor steht der Dativ.`). |
| M3 | `rules[2]` case_table, `Kasus` column | MINOR | rows `["bis","Bis wann?","meistens ohne Artikel","bis Freitag, bis morgen"]`, `["von … bis","Wie lange?","meistens ohne Artikel","von 9 bis 17 Uhr"]` | The column is headed `Kasus` but two rows carry a form note instead of a case. `bis` is accusative (the level file writes "bis (+ Akk, mostly articleless)") and `von` is dative — neither is ever named in the topic, so the `-e` in the file's own `bis nächste Woche` (rule 5) has an ending the learner cannot derive from anything taught here. | Either fill the column (`Akkusativ (meist ohne Artikel)`, `von + Dativ … bis`) or rename it `Form`. Nothing else changes. |
| M4 | `rules[-1]` `german_difference_en`; `rules[2]` `description_de` | MINOR | `"vor, nach, seit, ab and zwischen always take the dative"` / `"Fünf Präpositionen haben Dativ: vor, nach, seit, ab und zwischen."` | Unqualified "always" contradicts live A2.1 topic 3 `two-way-prepositions` — which this file lists in `related_slugs` — where `vor` and `zwischen` take the accusative for direction (`vor das Haus`, `zwischen die Stühle`). The learner met that four topics ago. | Add the qualifier: `Bei Zeitangaben stehen vor, nach, seit, ab und zwischen immer mit Dativ.` |
| M5 | `exercises` S4#7 (`multiple_choice`) | MINOR | `"___ Sonntag arbeite ich nicht."` options `['Im','Um','Am','Seit']` | `Seit Sonntag arbeite ich nicht.` is grammatical and idiomatic; only the English gloss excludes it. That is the same class of item the author flagged in doubt 4 for S4#12 — so the notes' claim that S4#12 is "the one distractor in the file that is grammatical in isolation" is wrong. The design is acceptable (the cue is explicit), but the self-assessment is not. | Either swap `Seit` for a dead distractor (`Um`/`Vor` in a frame where it cannot land), or correct the notes and keep both items. Same applies to the typed S5#9, where `erst um acht Uhr` is grammatical and only the `(approximately)` cue excludes it. |
| M6 | notes §"Deliberate exclusions"; `exercises` S5#9 | MINOR | notes: "No exercise sentence duplicates an example sentence (verbatim overlap was checked and removed)" vs S5#9 `"SMS an eine Freundin: Ich komme heute erst ___ acht Uhr."` = example 9 `"Ich komme heute erst gegen acht Uhr."` | The claim is false, and the consequence is real: one of 13 free-production slots at difficulty 3 tests recall of a memorised example rather than production. | Change the SMS frame (`Ich bin heute erst ___ neun Uhr zu Hause.`) and fix the notes claim. |
| M7 | `exercises` (coverage) | MINOR | rule 3 teaches five questions; only `Bis wann?` (S4#13) and `Seit wann?` (S5#13) are exercised | The level file names all five (`wann / wie lange / seit wann / bis wann / ab wann`) as the topic's outcome. `Wie lange?` and `Ab wann?` never appear in an item, so two of the five are taught but never tested. | Turn one existing `von … bis` item into a `Wie lange?` question-answer pair and one `ab` item into an `Ab wann?` pair — no net item-count change. |
| M8 | `exercises` S4#12, S4#8, S4#5 | MINOR | `"Vielleicht ist es 7:50 oder 8:10."`; `"Das Museum ist ___ 10 bis 18 Uhr offen."`; `"Nach ___ Pause arbeite ich weiter."` | (a) Present `ist es` for a future arrival is unnatural — `Vielleicht wird es 7:50.` or `Vielleicht 7:50, vielleicht 8:10.` (b) Opening hours are standardly `geöffnet`, not `offen`. (c) `weiterarbeiten` uses the prefix `weiter-`, which is outside the separable prefixes the live `separable-verbs` topic teaches (`ab/an/auf/aus/ein/mit/nach/vor/zu/zurück`). | (a)/(b) reword; (c) use a taught verb (`Nach ___ Pause mache ich weiter.` has the same problem — prefer `Nach ___ Pause gehe ich zurück ins Büro.` or simply `Nach ___ Pause arbeite ich.`). |
| M9 | `topic.description_de` vs `topic.description_en` | MINOR | de: `"vor, nach, seit, bis, ab und zwischen"` vs en: `"vor, nach, seit, bis, ab, von … bis, zwischen and gegen"` | The German description drops two of the eight prepositions the topic actually teaches (`gegen`, `von … bis`), so the two descriptions promise different scope on the SPA and the Astro page. | Align the German list, or cut both to a shared subset. |

## VERDICT: FAIL (2 blocking, 9 minor)

The topic is, on the whole, the strongest kind of Wave 4 submission: the case treatment is
correct at every one of the eleven prepositions, the seit/vor split is genuinely new teaching
rather than a re-run of `prepositions-dative`, the five question words are properly tabled, exam
anchoring is concrete (Sprechen Teil 3 dialogue, an SMS item), and the level constraint holds
under a scripted sweep (12-word maximum, zero banned structures). Both blockers are narrow and
cheap: one example sentence lifted verbatim from a live exercise, and one error-correction key
that rejects `bis zum Sonntag` while asserting a rule that `bis zum Sonntag` disproves. Fix
those two, take M1–M4 (they are corrections of claims, not preferences), and this passes.
