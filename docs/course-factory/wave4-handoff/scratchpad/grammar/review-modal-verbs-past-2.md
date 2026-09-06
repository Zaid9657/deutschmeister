# Adversarial re-review — `modal-verbs-past.json` (round 2, delta)

Scope: verify each of the 14 round-1 findings against the actual file (not the notes),
re-solve cold every exercise whose text changed, check the `möchte → wollte` seam, check the
`Aus X wird Y` metalanguage, re-run the validator both ways, and hunt for defects the fixes
introduced. Baseline: `review-modal-verbs-past-1.md` (2 blocking, 12 minor).

## Validator

```
$ node scripts/check-grammar-json.mjs modal-verbs-past.json
OK: 1 file(s) validated, no violations.

$ node scripts/check-grammar-json.mjs modal-verbs-past.json \
    --cache /home/user/deutschmeister/grammar-content-cache.json
OK: 1 file(s) validated, no violations.
```

(CREATE-shape docs validate identically with and without `--cache`; both were run because the
round-2 changes touched `related_slugs`, which is the one field a cache could contradict.)

## Fix verification — all 14 confirmed in the file

| # | round-1 finding | status | evidence in the file |
|---|---|---|---|
| B1 | s5#08 key rejected `Ich wollte einen Termin.` | **FIXED** | `acceptable_answers` is now `["Ich wollte einen Termin haben.", "Ich wollte einen Termin haben", "Ich wollte einen Termin.", "Ich wollte einen Termin"]`; `question_en` reads "I would like to have an appointment. → I wanted to have an appointment."; `explanation_en` adds "Dropping haben (Ich wollte einen Termin.) is just as correct." Both readings now score. |
| B2 | false gloss "would have liked" | **FIXED** | `rules[4]` row 7 is now `["wollte (für möchte)", "wanted (to have)", "Ich wollte einen Termin haben."]`. Seam checked in all three places: rule 3 row 6 = `Ich möchte einen Termin haben.` → `Ich wollte einen Termin haben.` ("I would like to have an appointment. / I wanted to have an appointment."), rule 4 row 7 example identical, s5#08 stem + key identical. One German pair, one English gloss, no contradiction left. |
| m1 | 9× unidiomatic `X wird Y` | **FIXED** | Machine-audited every `wird` in the document: 12 occurrences, all either `Aus X wird Y` (s5#01/#02/#04/#05/#06/#07/#09/#10 `explanation_de`, s5#08 `why_correct_de`, s5#10 `why_correct_de` "Nur aus dürfen wird durften.") or `Bei mögen wird g zu ch` (s4#06, s4#13). Both constructions are correct, idiomatic German. Zero bare `X wird Y` remain. The German opener that had leaked into s5#06's `explanation_en` is gone (now "mögen → mochte."). |
| m2 | mögen drilled in one frame | **FIXED** | Six distinct frames now: `Früher … keinen Kaffee` (example 6), `keinen Käse` (rule 4), `keinen Tee` (rule 7 mistake 6), **affirmative wir + object** `Wir mochten den Film sehr.` (s4#06), **question in ihr** `Mochtet ihr die Wohnung?` (s4#13), **affirmative ich + non-food object** `Ich mochte das Buch sehr.` (s5#06). `mochte` is now produced affirmatively, in a question, and in three persons outside the table. |
| m3 | 7 items recalling printed strings | **FIXED** | Re-ran my own overlap check (every ≥3-word sentence in `rules`+`examples` vs every exercise stem / key / acceptable answer / MC option). Round 1: 7 hits. Now: **2**, both declared — s4#09 (the *given* SMS model, its answer is `war`) and s5#08 (mandated by B2). s4#01/#07/#11/#12/#13, s5#06/#11/#13 and rule 4 row 1 were all re-written and no longer collide. |
| m4 | truncated English in rule 3 row 3 | **FIXED** | "Are you allowed to come along? / Were you allowed to come along?" |
| m5 | "Never say Ich habe gemusst" overstated | **FIXED** | `key_insight_de` "Im Alltag sagst du einfach: Ich musste."; `key_insight_en` "In everyday German you simply say Ich musste; the Perfekt of a modal waits until B1." Descriptive, no longer prohibitive. |
| m6 | `lange` glossed "late" | **FIXED** | example 7 `sentence_en` "Did you have to work a long time yesterday?"; s5#12 `question_en` "…work a long time on Monday."; example 7's `word_breakdown` still "for a long time" — now consistent. |
| m7 | example 10 double-glossed negation | **FIXED** | `"konnten": "could, were able to (können, Präteritum, wir)"`. |
| m8 | stilted `von den sechs Modalverben` | **FIXED** | `topic.description_de` opens "Lerne das Präteritum bei den sechs Modalverben."; the `von den sechs` string is gone from the JSON entirely (grep: 0). |
| m9 | `related_slugs` bypassed the fallback | **FIXED** | `["perfect-tense-sein", "imperative-mood", "temporal-prepositions"]`. Checked against `grammar-content-cache.json`: the first two are live, so the related block renders two real topics even before topic 12 lands; `[level]/[slug].astro` drops the third via `.filter(Boolean)`. |
| m10 | "Kein Problem" twice in the dialogue | **FIXED** | Exchange 6 now opens "Alles gut." |
| m11 | inconsistent fronted-variant policy | **FIXED** | Topicalised variants added where natural: s5#07 `Das Zimmer konnten wir nicht finden.`, s5#06 `Das Buch mochte ich sehr.`, s4#11 `Gestern musste sie einkaufen.`, s5#11 `Gestern wolltet ihr telefonieren.` s4#12's `question_en`/`why_correct` now state the opener is fixed ("Keep the opener Er and move only the infinitive"), which resolves the inconsistency by declaring the policy rather than hiding it. |
| m12 | icon / `topic.difficulty` | **CARRIED** | Unchanged by agreement; integration-step decision, not a content defect. |

## Cold re-solve of every changed item

I wrote my own answer before reading each key. **10/10 agreement**, no ambiguity found.

| item | new stem | my answer | key | verdict |
|---|---|---|---|---|
| s4#01 | `Ich ___ dich gestern nicht anrufen.` | konnte | konnte | ✓ separable `anrufen` correctly stays whole and final; pronoun `dich` before the time adverbial is correct German |
| s4#06 | `Wir ___ den Film sehr.` | mochten | mochten | ✓ affirmative mögen + bare object, no infinitive — correct and natural |
| s4#07 | `Ich ___ das Fenster nicht öffnen.` | konnte | konnte | ✓ |
| s4#09 | unchanged stem, re-solved | war | war | ✓ |
| s4#11 | `Sie musste gestern eingekauft.` | `Sie musste gestern einkaufen.` | same | ✓ `Sie` is unambiguously 3sg here because the verb is `musste`, not `mussten` |
| s4#12 | `Er musste kaufen eine Fahrkarte.` | `Er musste eine Fahrkarte kaufen.` | same | ✓ |
| s4#13 | `___ ihr die Wohnung?` | Mochtet | Mochtet | ✓ |
| s5#06 | `[ich / das Buch / sehr / mögen]` | `Ich mochte das Buch sehr.` | same (+ `Das Buch mochte ich sehr.`) | ✓ |
| s5#08 | `Schreib im Präteritum: Ich möchte einen Termin haben.` | `Ich wollte einen Termin haben.` (and the short form) | both accepted | ✓ |
| s5#11 | `Ihr habt gestern gewollt telefonieren.` | `Ihr wolltet gestern telefonieren.` | same (+ fronted) | ✓ |
| s5#13 | `[ich / gestern / krank sein] + [ich / nicht zum Kurs kommen können]` | `Ich war gestern krank. Ich konnte nicht zum Kurs kommen.` | same (+ fronted) | ✓ |

Also re-solved the 15 unchanged items: 15/15 agreement.

## New-defect sweep (did a fix break anything?)

- **Banned grammar, re-scanned over all 353 German fields:** als-clauses **0**, `weil/dass/wenn/ob` **0**, Futur `werden` **0**, `würde*` **0**, Genitiv **0**, `um … zu` **0**, Komparativ `-er als` **0**, full-verb Präteritum (30-form pattern incl. the newly-plausible `kaufte/spielte/wartete/holte/brachte`) **0**. The only two `sich` hits are the unchanged "ändert sich" metalanguage, cleared in round 1 against live A2.1 precedent.
- **`könnte` / `müsstest`:** still 4 + 2 occurrences, still every one a marked-wrong form (rule 7 mistake 1 + its explanation, s4#07 and s4#08 distractors + their `why_correct`). No new Konjunktiv II entered with the rewrites.
- **Sentence length:** longest German string is 13 words (`s5#13 question_de`, a cue bracket). Zero over 14.
- **Satzklammer:** every new past-modal sentence puts the infinitive last (`… nicht anrufen.`, `… nicht öffnen.`, `… einkaufen.`, `… eine Fahrkarte kaufen.`, `… telefonieren.`, `… zum Kurs kommen.`) or legitimately omits it (`Wir mochten den Film sehr.`, `Mochtet ihr die Wohnung?`, `Ich mochte das Buch sehr.` — mögen with a plain object).
- **MC integrity:** 4 items, 4 unique options each, key present, keys at indices 2/0/1/3. I attacked every distractor for a second reading. The new s4#13 set is the tightest call in the file: `Möchtet ihr die Wohnung?` is grammatical German in isolation ("Would you like the apartment?"), and it is ruled out only by the stem cue `(mögen, Präteritum, ihr)` plus the English "Did you like the apartment?". That is exactly the disambiguation standard I accepted for the pre-existing `könnte` distractor in round 1, so it is consistent and not charged — but it is the strongest-tempting distractor in the topic and worth knowing about.
- **`acceptable_answers`:** every typed item's `correct_answer` is a member, no duplicates, and every sentence-shaped variant has both its with- and without-punctuation twin (machine-checked). 22 typed / 4 MC.
- **Shape:** 9 rules (`-1,1,2,3,4,5,6,7,99` — the shipped `imperative.json` convention), 10 examples with valid `grammar_highlight` substrings and exact `word_breakdown` token coverage, 26 exercises (13 + 13, `order_index` 1..13 each), 6 common-mistake pairs, `summary` "Quick Reference" last, no duplicate question stems, no English in a `_de` field, no stray whitespace. Page title core 45 chars.
- **New vocabulary** (`anrufen`, `dich`, `öffnen`, `Fenster`, `einkaufen`, `Fahrkarte`, `Film`, `Buch`, `telefonieren`, `zum Kurs`): all inside the Goethe A2 range and the level constraint. `dich` is topic-10 material and topic 10 precedes topic 11, so it is allowed.

## Residual notes (documentation only — nothing to change in the JSON)

| # | where | severity | note |
|---|---|---|---|
| r1 | `.notes.md`, m3 bullet | MINOR (notes only) | The bullet correctly lists s5#08 as a deliberate overlap, then closes with "No stage-5 key appears anywhere in the rules." That last clause is false — s5#08's key `Ich wollte einen Termin haben.` is in rule 3 row 6 and rule 4 row 7. The *file* is right (B2 required that identity, and it is the correct trade against m3); only the sentence describing it is self-contradictory. |
| r2 | `.notes.md`, "Deliberate exclusions" | MINOR (notes only) | Still says "no Genitiv (rule 1's description says 'von den sechs Modalverben')". That string no longer exists anywhere in the JSON (m8 changed it to `bei den sechs Modalverben`, and it lived in `topic.description_de`, not rule 1). Stale reference. |
| r3 | s5#04 `explanation_de` | MINOR (cosmetic) | `Aus dürfen wird bei ihr durftet.` is correct but clunky; `Bei ihr wird aus dürfen durftet.` reads better. Not worth a round 3. |
| r4 | `topic.icon` / `topic.difficulty` | carried | m12, unchanged by agreement. |

VERDICT: PASS

Both blocking findings are genuinely resolved, and the `möchte → wollte` seam — the thing that
produced both of them — is now a single German pair rendered identically in rule 3, rule 4 and
s5#08, with a correct gloss and a key that accepts the short form. All twelve minors are fixed
in the file except m12, which was carried by agreement. Nothing in the rewrites introduced a new
defect: I re-solved all 26 exercises cold (26/26), re-scanned 353 German fields for banned
grammar (zero hits in every category), re-checked Satzklammer, sentence length, MC integrity and
`acceptable_answers` twins, and confirmed the overlap count dropped from 7 to the 2 declared
cases. The three residuals are stale sentences in the notes file and one cosmetic word order;
none of them warrants a round 3. Ship it.
