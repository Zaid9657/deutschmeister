# Adversarial review — `temporal-prepositions` (round 2, delta)

Scope: verify each round-1 fix against the actual file, re-solve every changed item cold, check
the new `bis + zu` teaching, re-run the validator both ways, and hunt for defects the fixes
introduced. Round 1: `review-temporal-prepositions-1.md` (2 blocking, 9 minor).

## Validator — both ways

```
$ node scripts/check-grammar-json.mjs S/wave4/grammar/temporal-prepositions.json
OK: 1 file(s) validated, no violations.                                    (exit 0)
$ node scripts/check-grammar-json.mjs --cache grammar-content-cache.json \
    S/wave4/grammar/temporal-prepositions.json
OK: 1 file(s) validated, no violations.                                    (exit 0)
```

## Round-1 findings: verified against the file, not the notes

| # | claim | verdict |
|---|---|---|
| **B1** duplicate example | **FIXED.** `examples[4]` is now `Mein Bruder studiert seit drei Jahren in München.` — `word_breakdown` complete for the new tokens, `grammar_highlight` (`seit drei Jahren`) still a substring, 8 words. The author also found and fixed three collisions round 1 did not list (rule 4 row 1, mistakes 2 and 3). I ran `S/wave4/sweep.py` myself: `live sentence corpus: 4982 / mine sentences checked: 420 / HITS 0`. I then re-ran **my own** sweep with a different normaliser, a 2-token floor and a Jaccard near-duplicate pass — see M2 below for what that turned up. |
| **B2** S5#10 rejected `bis zum Sonntag` | **FIXED.** `acceptable_answers` = `["Ich bleibe bis Sonntag.", "Ich bleibe bis Sonntag", "Ich bleibe bis zum Sonntag.", "Ich bleibe bis zum Sonntag"]`; `question_en` announces two repairs; `why_correct_de` is now `bis dem gibt es nicht. Streich den Artikel oder nimm zu: bis zum Sonntag.` — true, and the absolute claim it replaced is gone. |
| **B2 teaching gap** | **CLOSED, and the new German is correct.** Rule 5: `Mit Artikel brauchst du zu: bis zum 3. Mai, bis zur Pause.` Mistake 6: `bis steht meistens ohne Artikel. Mit Artikel brauchst du zu: bis zum Freitag.` Both are standard German (`bis` + article requires `zu`). **Inside the level**: it adds no new structure — `zu + Dativ` and the contractions `zum/zur` are on the A1 list and live in A2.1 topic 2; the level file's own "mostly articleless" presupposes the other case. Rule 5's `content_en` even points back at Prepositions + Dative for `zum/zur`. |
| **M1** `gegen` wrongly called new | FIXED (rule 2 `key_insight_de/_en` now recap it as known and name the live A1.2 rule). See M3 for the side effect. |
| **M2** `X hat Dativ` ×16 | FIXED. `ha(t|ben) (den) Dativ` now matches **0** times. All 19 replacements read as correct German. See M4 for two that read awkwardly. |
| **M3** `Kasus` column | FIXED and correct: `bis → Akkusativ (meist ohne Artikel)`, `von … bis → von + Dativ … bis + Akkusativ`, `gegen → Akkusativ`, five dative rows unchanged. |
| **M4** unqualified "always dative" | FIXED. Intro and rule 2 now say **in time expressions** and both point at the accusative direction reading (`vor das Haus`) in live topic 3. |
| **M5** S4#7 `Seit` distractor | FIXED. Options are `["Im","Um","Am","An"]`; `An Sonntag` is impossible (an + dem = am) and the explanation now says so. Re-solved cold: `Am`, single defensible answer. |
| **M6** S5#9 = example 9 | FIXED. S5#9 is now `Ich bin erst ___ neun Uhr zu Hause.`; no exercise stem or key equals any example sentence (both sweeps). |
| **M7** `Wie lange?` / `Ab wann?` untested | FIXED. S4#8 is now `„Wie lange ist das Museum geöffnet?“ — „___ 10 bis 18 Uhr.“` → `Von` (and it accepts `von`, since the answer opens the sentence); S5#7 is cued `Antworte auf „Ab wann arbeitest du in Köln?“`. All five question words are now exercised; item counts unchanged (13/13, 20 typed / 6 MC). |
| **M8** (a) `Vielleicht ist es 7:50` (b) `offen` (c) `weiterarbeiten` | FIXED: `Vielleicht 7:50, vielleicht 8:10.`; `geöffnet` (10 live occurrences, house-precedented); S4#5 is now `Nach ___ Pause trinke ich einen Kaffee.` — no untaught separable prefix left in the file. |
| **M9** `description_de` short by two prepositions | FIXED: 3 sentences, all eight prepositions, exam use named, longest 10 words. |

## Cold re-solve of every changed item

S4#5 → `der` ✓ · S4#7 → `Am` ✓ (the other three are now impossible) · S4#8 → `Von` ✓ (`Von 10
bis 18 Uhr` is the idiomatic answer to `Wie lange … geöffnet?`; no second typed answer works) ·
S4#12 → `gegen` ✓ · S5#3 → `Ich wohne seit drei Monaten hier.` ✓ (3 orders × 2 punctuation
variants accepted) · S5#7 → `Ich arbeite ab dem 1. Mai in Köln.` ✓ (fronted variant accepted,
which is the more natural answer to `Ab wann?`) · S5#9 → `gegen` ✓ · S5#10 → `Ich bleibe bis
Sonntag.` **and** `Ich bleibe bis zum Sonntag.` ✓ both accepted · S5#13 → `Seit` ✓. My answer
matched the key on **26/26**, with no rejected legitimate alternative left anywhere.

## No new defect from the fixes

Re-ran after the edits: ban sweep over every German field — no weil/dass/wenn/als-Satz, no
Konjunktiv II, Futur, Passiv, reflexive, Komparativ, Genitiv, `während`, and no Präteritum of a
full verb; longest learner-facing German sentence **12 words**; 9 rules / 10 examples / 26
exercises (13/13), 20 typed / 6 MC, every MC has 4 distinct options containing its key, every
typed key is inside its own `acceptable_answers`; all 10 `word_breakdown` maps complete and all
10 highlights substrings; all six MC items re-checked for a second defensible answer — only
S4#12 (`um`, excluded by the second sentence) and the typed S5#9 (`um`, excluded by an explicit
`(approximate time, not an exact one)` cue) remain cue-decided, and the notes now disclose both.

## Remaining findings (none blocking)

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| M1 | `rules[7]/common_mistakes[2]/explanation_en` | MINOR | `"seit describes something still going, so German keeps the present tense — English uses 'have been living'."` | Stale: the round-2 rewrite changed this pair from a *wohnen* sentence to `Ich spiele seit vier Jahren Gitarre.`, but the English still cites *have been living*. The fix left a dangling reference. | `English uses 'have been playing'.` |
| M2 | `exercises` S5#3; notes §"B1 proof" | MINOR | `Schreib den Satz: [ich / seit drei Monaten / hier / wohnen]` → `Ich wohne seit drei Monaten hier.` | Live **A1.2 `dative-prepositions-intro`** stage-5 #6 is `Schreib den Satz: [ich / wohnen / seit / drei Jahre / hier]` → `Ich wohne seit drei Jahren hier.` — the same verb, frame, cue format and grammar point, one noun swapped. My Jaccard pass flagged it at 0.80; the author's sweep cannot see it because it matches exact strings only. So "HITS 0" proves **no exact duplicate**, not "0 collisions", and the notes state the stronger claim. | Re-frame S5#3 on a verb the live corpus does not pair with `seit` (e.g. `[mein Sohn / seit drei Monaten / Fußball / spielen]`), and add a near-duplicate threshold to `sweep.py` before repeating the claim. |
| M3 | `rules[2]/key_insight_en`, `rules[2]/content/description_en`, `rules[-1]/content/german_difference_en` | MINOR | `"live A1.2 prepositions-accusative rule 7 already teaches um = exact time…"`; `"Careful: as two-way prepositions (topic 3)…"`; `"Watch the qualifier — …"` | The M1/M4 fixes were written as answers to the reviewer inside **learner-facing** fields: they expose repo slugs, a rule number, the word "live", and an editorial aside. Correct content, wrong voice. | Keep the pedagogy, drop the machinery: `You already know gegen for an approximate time from Prepositions + Accusative.` / `As a two-way preposition, vor takes the accusative for direction (vor das Haus).` |
| M4 | `rules[99]/content/points[1]`, `rules[5]/content/content_de` | MINOR | `"Bei Zeitangaben steht nach vor, nach, seit, ab und zwischen der Dativ."`; `"Mit Artikel verlangt ab den Dativ: ab dem 1. Mai."` | Both are grammatical but garden-path: the first opens `nach vor, nach,` (governing preposition then list member); in the second, `ab` after the verb reads as the object. The other 17 `verlangt` instances read naturally. | `Bei Zeitangaben verlangen vor, nach, seit, ab und zwischen den Dativ.` and `Mit Artikel steht ab mit dem Dativ: ab dem 1. Mai.` |

Nit, not a finding: the "longest German sentence = 12 words" figure depends on the counter
splitting S5#7's stem at the ordinal (`ab dem 1. | Mai …`); the whole stem is 16 tokens. It
still complies — the sentence the learner *produces* is 7 words and every embedded German
sentence is ≤ 6 — but the round-3 counter should split on ordinals, not on every `.`.

## VERDICT: PASS

Both blockers are genuinely fixed at source, not papered over: the duplicate example is gone
along with three collisions round 1 missed, and S5#10 now accepts `bis zum Sonntag` *because*
rule 5 and mistake 6 teach `bis + zu` — correct German assembled from pieces the learner already
has. All nine minors are present in the file and correct, not just in the changes table. What
remains is four cosmetic items: one stale English phrase, one near-duplicate the exact-match
sweep structurally cannot see (with an overstated proof claim in the notes), reviewer-voice
leaking into learner-facing English, and two clumsy sentences. None of them touches German
correctness, the level constraint, an answer key or the shape. Ship it; fold M1–M4 into whatever
edit passes next.
