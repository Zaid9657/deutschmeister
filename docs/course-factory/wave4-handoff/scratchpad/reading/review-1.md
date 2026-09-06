# Adversarial review — Wave 4 PR C1, A2.1 reading (round 1)

Reviewed: `rewrites-a2.1.json` (8 rows), `exam-format-a2.1.json` (2 rows), `verify.mjs`,
`notes.md`, against `S/wave4/level-a2.1.md` (binding), `S/wave4/reading-brief.md`,
`S/wave4/common-header.md`, the live rows in `S/wave4/source/reading-a2.1.json`, the Wave 3
shape (`S/wave3/reading/*`), `src/components/ReadingChecks.jsx` and `scripts/reading-from-json.mjs`.

## What I actually did (so a "nothing found" is not taken on trust)

1. Read all ten `content_de` line by line against the level file: case endings on every
   attributive adjective, verb forms, umlauts/ß, comma before `weil`/`denn`, quote punctuation
   („…“, `„…?“, fragt er.`).
2. Answered all 58 checks and 46 open questions **cold**, writing my answer before opening the
   key. One key is contested below; the other 57 agree with mine.
3. Re-implemented the mechanical gates independently (my own tokenizer, my own sentence split
   that does **not** break at `:`): word counts, ≤14-word sentences, `weil|dass|wenn` per text
   and inside check statements, `als` case-**insensitively** (verify's own scan is
   case-sensitive — `Als Vorspeise` in lesson 5 slips past it; the count is still 1, so no
   defect, but the regex is one capital away from being blind), `sich`, `des|eines`, Präteritum
   list, `werden`, relative-clause heuristic, paragraph parity DE/EN, English tokens in German
   fields, duplicate statements across both files, and sentence-level overlap with the Wave 3
   deliverable. All clean.
4. **Mutation-tested `verify.mjs`** with 19 injected defects (relative clause, `ging`, a 15-word
   sentence, wrong `word_count`, `sich`, 3×`weil`, a fabricated explanation, `answer:"d"`, all-rf
   -richtig, Genitiv, deleted instruction line, changed exam title, `order_index` 3 collision,
   6-item vocab, unknown id, null-article `altes Fahrrad / starken Kaffee`, duplicate statement,
   `als`×3, changed rewrite title). **18 of 19 caught**; the miss is finding #10.
5. Ran the real pipeline: `node scripts/reading-from-json.mjs … review-tmp/out.sql` → exit 0,
   8 UPDATEs + 2 INSERTs, `level 'a2.1'` lowercase (check constraint), guarded `AND checks IS NULL`
   which matches the live rows (all eight have `checks: null`). Repo `git status` clean — untouched.
6. Cross-checked ids/order/titles against the live source and against
   `S/wave4/plan/a21Phase.js` (`A21_READING_TITLES`): all ten titles byte-identical, ids in
   source order, `order_index` 9/10 free.
7. Verified the two dates in lesson 10 against a real calendar: 6 Oct 2026 **is** a Tuesday and
   3 Nov 2026 **is** a Tuesday (a course day, so "kein Unterricht" is meaningful). Good detail.
8. Read `ReadingChecks.jsx`: `type:'choice'` renders `options` verbatim as chip labels, so
   `["a","b","c"]` requires the answers inline in `statement_de` — which is what both files do.

## verify.mjs output (verbatim, run by me)

```
Wörter je Lektion:
  Meine Reise nach Wien = 134w
  Beim Arzt = 133w
  Mein Beruf als Softwareentwickler = 130w
  Unterwegs in der Stadt = 143w
  Ein Abend im Restaurant = 132w
  Ein Umzug nach Hamburg = 137w
  Der Sportverein = 140w
  Ein Besuch auf dem Wochenmarkt = 132w
  Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung) = 139w
  Lesen Teil 3: Eine E-Mail (wie in der Prüfung) = 131w

Hinweise (vom Menschen zu prüfen):
  rewrite "Meine Reise nach Wien": rf-Muster rffrr (2 falsch)
  rewrite "Beim Arzt": rf-Muster frrrf (2 falsch)
  rewrite "Mein Beruf als Softwareentwickler": rf-Muster rrffr (2 falsch)
  rewrite "Unterwegs in der Stadt": rf-Muster ffrrf (3 falsch)
  rewrite "Ein Abend im Restaurant": rf-Muster rfrrf (2 falsch)
  rewrite "Ein Umzug nach Hamburg": content_en enthält Umlaute (Eigennamen?) — prüfen
  rewrite "Ein Umzug nach Hamburg": rf-Muster frffr (3 falsch)
  rewrite "Der Sportverein": rf-Muster rrfrf (2 falsch)
  rewrite "Ein Besuch auf dem Wochenmarkt": rf-Muster ffrfr (3 falsch)
  choice-Antworten: rewrite "Meine Reise nach Wien":b, … exam-format 10:a

OK — 8 Rewrites + 2 Prüfungslektionen, 0 Fehler.
```
(exit 0; the "content_en enthält Umlaute" hint is `Mrs. Weber`/`Eimsbüttel` — correct as is.)

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | exam-format-a2.1.json → order_index 9, check 2 | **BLOCKING** | `"Wo spielen die Bands? a) vor dem Rathaus b) auf dem Marktplatz c) im Zentrum"`, answer `b` | Distractor **c is true in the text's own world**: the notice bans driving `ins Zentrum` for the weekend *because* the festival is there, and a Marktplatz is in the Zentrum. Two defensible options; only the fact that b is more specific separates them. A Goethe item's distractors must be false, not merely less precise. | Replace c with a location the text names for something else, e.g. `c) am Bahnhof` (never mentioned) — or drop `ins Zentrum` from the text and say `ins Stadtzentrum am Marktplatz` nowhere. One-word change, no word-count impact. |
| 2 | exam 9, content_de + check 3 | MINOR | `"Die Konzerte am Abend sind kostenlos. Nur für das Konzert am Samstagabend braucht man eine Karte."` vs check 3 distractor `b) nichts` | The first sentence is literally false for one evening concert; the `Nur …` exception repairs it pragmatically (idiomatic German), but the item's b-distractor is exactly the un-repaired reading. Arms a trap that turns on a sloppy sentence rather than on comprehension. | `Fast alle Konzerte am Abend sind kostenlos.` (+1 word, 139→140, still in range). |
| 3 | rewrites → `Unterwegs in der Stadt` | MINOR | `"Ich habe ein Monatsticket für 86 Euro."` | The live text says `das kostet **etwa** 86 Euro`; the rewrite hardens a hedged figure into an exact price a `choice` item keys on — and 86 € is no longer a real Berlin monthly fare, so an A2 learner in Berlin reads a wrong number. | Restore the hedge: `Mein Monatsticket kostet etwa 86 Euro.` (choice item still works). |
| 4 | rewrites → `Mein Beruf als Softwareentwickler` | MINOR | `"Um achtzehn Uhr ist Feierabend."` | 24-hour clock times are written in digits in German (`um 18 Uhr`); spelling out `achtzehn` is unidiomatic and inconsistent with `von 19 bis 21 Uhr` (lesson 7), `um 16 Uhr` (9) and `von 18 bis 20 Uhr` (10). Register slip in an otherwise clean text. | `Um 18 Uhr ist Feierabend.` — and the same in the rf statement that quotes it. |
| 5 | rewrites → `Meine Reise nach Wien` | MINOR | `"Am ersten Tag bin ich durch die Ringstraße gelaufen."` | `durch` + a street reads as *through* an enclosed space; one walks `über die Ringstraße` / `die Ringstraße entlang`. The English already says "walked **along**", i.e. the translation quietly corrects the German. | `Am ersten Tag bin ich die Ringstraße entlanggelaufen.` or `… über die Ringstraße gelaufen.` |
| 6 | rewrites → `Ein Umzug nach Hamburg`, key_vocabulary | MINOR | `{"de":"der Umzug, ¨-e"}` | The headword occurs in `content_de` only inside the compound `Umzugstag` (plus the title). Every other entry in the ten lists appears as a free form; a vocabulary card the text never shows is the one entry a learner cannot anchor. | Either use `der Umzugstag, -e`, or add `Der Umzug hat viel Arbeit gemacht.` back (live sentence, 6 words). |
| 7 | rewrites → lessons 2, 3, 6 | MINOR | `"Bis Freitag darf ich nicht arbeiten."` (live: `Krankschreibung für eine Woche`); `"Zweimal pro Woche darf ich von zu Hause arbeiten."` (live: `manchmal von zu Hause`); `"Die Kinder wollten zuerst nicht umziehen."` (not in the live text) | Invented specifics replacing hedged source facts. Harmless as fiction and each is level-motivated (`bis`+temporal, `dürfen`), but one of them (lesson 3) carries an rf item, so the check now tests a fact the source never had. Worth a conscious sign-off, not a silent rewrite. | Keep, but list them in notes.md's "deliberate exclusions" so the next reviewer is not re-deriving the diff. |
| 8 | rewrites → lessons 1–5, questions[].answer_en | MINOR | `"Sie hat ein Buch gelesen…"` → `"She read a book…"` | In German `sie` is forced by `die Person`; English has no such excuse, so the EN answers assert a female narrator the text never identifies. Five lessons, ~15 answers. | `The person read a book…` (or `They…`). German side stays as is. |
| 9 | exam 9, content_de | MINOR | `"Für die Kinder ist der Platz vor dem Rathaus da."` | Stilted; `für … da sein` in this position reads translated, not like a town notice. | `Für die Kinder gibt es einen Platz vor dem Rathaus.` (same word count). |
| 10 | verify.mjs:326 | MINOR | `info.push(\`${label}: Titel geändert (live: "${src.title_de}")\`)` | A changed rewrite `title_de` is only an *info* line (my mutation test #5 passed with `Ein Abend im Lokal`), and `title_en` is never compared to the live row at all — a silent-drift hole in the one gate that is supposed to hold the ids/titles contract. The current data is clean (I diffed both title fields against the source myself). | Make `title_de` drift a `fail` unless an allow-list entry says the live title lies, and add the same comparison for `title_en`. |
| 11 | verify.mjs:~ `als` scan | MINOR | `/\bals\b/g` (no `i` flag) | `Als Vorspeise haben wir Bruschetta gegessen.` (lesson 5) is invisible to the ≤1-`als` gate; the true count is still 1, so nothing is broken today, but the gate under-reports by construction. | Add the `i` flag. |
| 12 | cross-artefact: rewrites 1–8 + exam 9 vs `plan/a21Phase.js` | MINOR (coordinator call) | `"Von dort konnte ich alles zu Fuß erreichen."` (text 1, plan day 1) | The plan puts reading texts 1–8 on days 1–17 and text 9 on day 20, but `modal-verbs-past` is day 19 and `adjective-endings-intro` is ~day 23. Every rewrite carries `konnte/musste/wollte` and/or `einem kleinen Hotel`-type endings *before* those topics. The reading brief explicitly ordered this ("use them on purpose"); `level-a2.1.md` says topics 9–12 only "inside/after their topic". Receptive exposure ahead of production is defensible — but the two governing documents disagree and only the coordinator can close it. | Either add a line to `level-a2.1.md` exempting reading/listening exposure, or reshuffle the plan's reading days. Not the author's to fix. |
| 13 | exam-format-a2.1.json, both rows | MINOR (integration) | both rows are 5 × `choice`, 0 × `rf` | `ReadingChecks.jsx` hard-codes the card heading `Richtig oder falsch?` / `True or false?`. After the ruling that made lesson 9 all-choice, **both** exam lessons render under a heading that describes neither. Introduced by the ruling, not by the author. | Either give `ReadingChecks` a heading that depends on the check types, or accept the cosmetic mismatch and record it in the integration checklist. |
| 14 | rewrites → `Der Sportverein`, questions[1] | MINOR | Q `"Was hat Lena im Internet gemacht?"` → A `"Sie hat einen Sportverein gesucht."` | The text says only `Lena hat im Internet gesucht`; the object is inferred from the neighbouring sentence. Fine for an open question, but it is the one answer in 46 that is not liftable. | `Sie hat im Internet gesucht.` |

Non-findings I checked and cleared, so the next round does not redo them: all ten `word_count`
values recomputed and exact; no sentence over 14 words (max is exactly 14, `Es beginnt am Freitag
um 16 Uhr und endet am Sonntag um 22 Uhr.`); `weil` appears once in the whole deliverable
(lesson 1, exposure only) and never in a check statement; zero relative clauses, zero full-verb
Präteritum, zero Genitiv, zero reflexives, zero Futur/Passiv/Konjunktiv, zero superlatives; every
attributive adjective sits behind a der-/ein-word with the right ending (`einem kleinen Hotel`,
`ein kurzes Meeting`, `mein altes Fahrrad`, `einen guten Tipp`, `im dritten Stock`, `das große
Stadtfest`, `einen kleinen Test`) and no null-article strong form exists outside the frozen
letter formulas; all 129 `key_vocabulary` entries’ plural markers are correct German (`¨-e` for
Züge/Plätze/Beiträge, `¨-er` for Schlösser/Fahrräder/Rathäuser, `-n` for the weak
Kunde/Bauer/Nachbar, `Praxen`, `Zentren`, `Firmen`) and the convention matches the live A2.1 rows
rather than the brief's `-¨e` — the right call, and already flagged in notes.md; every headword
occurs in its text at least inflected (the compound-only case is finding 6); rf mixes are 2–3
falsch with eight distinct non-alternating patterns; the eight rewrite choice keys run
b c a c b a c b and the exam keys a b c a c / b c a b a, so `options[0]` is not the answer by
default; every `explanation_de` is a literal substring of its own `content_de` (several are
truncations without an ellipsis — `Ich bin mit dem Zug gefahren` for a sentence that continues
`, weil …` — which I accept: the quote is not falsified, only shortened); no duplicate statement
anywhere in either file, no statement duplicating an open question, no sentence shared with the
Wave 3 deliverable; DE/EN paragraph counts match everywhere; no English token in a German field
and no German left in an English one; content_en is faithful clause by clause (the two places it
drifts are findings 5 and 8); the 15–16-token `choice` statements exceed 14 *tokens* only because
the three inline options follow the question — the brief mandates that shape and an option list
is not a sentence, so no defect.

VERDICT: FAIL (1 blocking, 13 minor)

One item blocks: the "im Zentrum" distractor in the exam Teil-1 set is not false, and an MC item
with two true options is a wrong key by the brief's own definition. It is a one-token fix.
Everything else is polish — the German is clean, the level discipline is genuinely airtight (I
tried hard to break it and could not), the numbers survive the rewrite so the checks stay
decidable, and `verify.mjs` is a real gate that caught 18 of my 19 injected defects. Findings 12
and 13 are consequences of the lesson-9 ruling and of the plan's day order, not author defects,
but somebody has to own them before this ships.
