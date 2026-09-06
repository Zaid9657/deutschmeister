# Adversarial review — Wave 4 PR D2a (Abschlusstest A2.1), round 1

Reviewer: Opus. Deliverable: `S/wave4/test/{abschlusstestA21.js, validate-a21.test.mjs, notes.md}`.
Binding: `S/wave4/level-a2.1.md`, `S/wave4/test-brief.md`, `S/wave4/common-header.md`.
Repo read-only; nothing under /home/user/deutschmeister was touched.

## What I actually did (so "found nothing" is not an option)

1. Read the level file, the test brief, the common header and the exam brief (D1) first.
2. Read the template `src/data/courseTests/abschlusstestA12.js`, `courseTests/index.js`,
   `mockExams/goetheA1.js`, `services/examScoring.js`, `mockExams/index.js#countScorableItems`,
   `courseTests/listeningQuestions.js`, `pages/Modelltest/ModelltestRun.jsx` (timer, PLAYS_ALLOWED,
   mc-group / listening / writing render paths), `ModelltestOverview.jsx` (where `intro` renders),
   `data/modelltest.js` (gateLevel), `tests/exams.test.mjs` 120–330.
3. Ran the author's harness myself: `node --check` on both modules (clean) and
   `node --test validate-a21.test.mjs` → **19 pass / 0 fail** (pasted below).
4. Re-solved all 10 Lesen items cold — answer written before looking at the key — and checked each
   distractor against its own text. Re-derived the two key strings independently: `bcbac` / `abcab`.
5. Wrote my own scripts (not the author's) to (a) extract **every** double-quoted string from the
   module header and match it against `S/wave4/source/listening-a2.1.json` AND against the module's
   own authored strings; (b) re-count the Lesen texts (126 / 119 / 106 words); (c) re-split every
   German string into sentences with a splitter that does *not* break on ordinals, and count words.
6. Hand-checked every attributive adjective ending, every temporal preposition, every object
   pronoun, and scanned for Genitiv / Präteritum / Nebensatz / Passiv / Komparativ / reflexives.
7. Cross-checked the listening pick against every mock (`grep level: 'A2.1'` across all 7 modules —
   none), and the Schreiben scenarios against `src/data/writingTasks.js` and both sibling tests.

```
$ node --check abschlusstestA21.js      → OK
$ node --check validate-a21.test.mjs    → OK
$ node --test validate-a21.test.mjs
# tests 19 | # pass 19 | # fail 0 | duration_ms 141.28
```

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | abschlusstestA21.js:116-117 (header) | BLOCKING | `"Bitte beachten Sie, dass während des Films Handys ausgeschaltet sein müssen."` | Presented as a verbatim transcript line of listening exercise #6, used to reject that exercise. **That line does not exist in the source.** The real line is `"Wir weisen darauf hin, dass während des Films Handys ausgeschaltet sein müssen."`; the `Bitte beachten Sie, dass` opener is lifted from two *other* #6 sentences (Fotografieren / Innenstadt gesperrt). The validator only checks the four ex-#4 quotes, so it passed. The substance (dass-Satz + Genitiv) survives — the quote does not. | Replace with the real sentence. Then extend the validator's quote check to **every** quoted German string in the header, not just ex #4 (my script does this in ~20 lines and is the only reason this was caught). |
| 2 | abschlusstestA21.js:168 (header) | BLOCKING | `"ein kleines Frühstück"` | Listed in the header's own grammar inventory as an adjective-after-`ein` example from this file. The module says **`ein kleines Abendessen`** — the meal was moved from Frühstück in round 1 (notes.md §Deliberate exclusions 6) and the header quote was not updated. A header claim about the file's own strings that is false is exactly the drift the honesty contract exists to stop. | `Frühstück` → `Abendessen`; add a validator assertion that every header quote of an authored string is present in the module (I ran it: this is the only stale one). |
| 3 | abschlusstestA21.js:208-211 (`intro`) | BLOCKING | `Das ist der Abschlusstest deines A2.1-Kurses.` / `Er hat den Aufbau der Prüfung Goethe-Zertifikat A2` / `ab 60 Prozent der Aufgaben` | Three Genitiv constructions in learner-facing German (`intro` renders as the overview page's `lead`, ModelltestOverview.jsx:66). level-a2.1.md bans Genitiv outright: "any occurrence is a blocking defect". The module's own ban regex is `/\b(des\|eines)\s+\p{Lu}/` — it cannot see `deines …-Kurses`, `der Prüfung` or the partitive `der Aufgaben`, so the harness reports clean. The header's "intro is administrative copy" carve-out is the author's own (inherited from the A1.2 sibling, which has the identical sentence); the binding level file grants no such carve-out. | Either rewrite (`Das ist der Abschlusstest für deinen Kurs A2.1.` / `Der Test hat den gleichen Aufbau wie die Prüfung Goethe-Zertifikat A2.` / `ab 60 Prozent`), **or** the coordinator ratifies an explicit intro/instructions carve-out in level-a2.1.md and the sibling gets the same. Widen the Genitiv regex either way (`\b(des\|eines\|deines\|meines\|ihres\|seines)\b` + `\b\w+(s\|es)\b` before a noun is too noisy — a whitelist of the intro's phrasings is enough). |
| 4 | abschlusstestA21.js:220-233 + ModelltestRun.jsx:36,256 | BLOCKING (integration) | `minutes: 15` + `Die Aufnahme dauert etwa neun Minuten.` vs the runner's `Noch ${PLAYS_ALLOWED - plays}× abspielbar (wie in der Prüfung begrenzt)` | Measured, not assumed: audio = 518 s (8:38); `PLAYS_ALLOWED = 2` is a module constant the part cannot override; `remaining === 0 → nextSection()` is a hard cutoff. Two plays = 17:16 against a 15:00 section. The chrome promises a second play the timer cannot deliver — a learner who takes it loses the section mid-audio. The author documented this honestly (notes.md doubt 1) and correctly says it is not fixable in-file. It still must not merge unresolved. | Ranked: **(a)** make plays part-configurable (`PLAYS_ALLOWED` → `part.playsAllowed ?? 2`, set `playsAllowed: 1` here) — one runner line, keeps 55 min and the only level-fitting exercise, and is exam-honest (Goethe A2 Hören plays parts once); **(b)** Hören 20 / Schreiben 15 (total still 55) — 2×8:38 leaves 2:44 to finish 10 items, tight; **(c)** a different exercise — worst: #1 has 3 Genitiv items, #2 a Präteritum item, #3/#5 are number drills, #6 is B1+. Do **not** leave it at 15 min with the 2× label. |
| 5 | abschlusstestA21.js:423-426 (`schreiben-2`) | MINOR | `Sie haben am Dienstag einen Termin beim Amt. Sie können an diesem Tag nicht kommen.` | Third occurrence of one scenario: live `writingTasks.js` `mitteilung-termin-absagen` (Leitpunkt verbatim `Bitte um einen neuen Termin`), the A1.2 course test's only writing task (Arzttermin absagen, Leitpunkte Grund/Zeit/Entschuldigung), and now this. `schreiben-1` is *also* a cancellation, so the whole Schreiben section is "ich kann nicht kommen". Worse, exam-brief.md §4 assigns 'Termin beim Amt' to **D1's** writingTasks in this same wave — a guaranteed collision. common-header rule 2: copy the shape, not the content. | Swap `schreiben-2` to Kursanmeldung or "Nachbarn um Hilfe bitten" (both already in D1's list — coordinate which PR takes which), and keep only one cancellation in the test. |
| 6 | abschlusstestA21.js:107-110 (header) | MINOR | `7 of 10 items in #5 ask only for a price` | Miscount. Exercise #5 has **5** price items (1, 2, 3, 5, 8); item 6 asks a Lichtschutzfaktor, item 7 a number of roses, item 9 is Richtig/Falsch. "7 of 10 ask only for a number" would be true; "for a price" is not. The two quoted examples are verbatim and the judgement (number-catching drill) holds — the figure does not. | Say "5 of 10 ask for a price, 7 for a bare number". |
| 7 | abschlusstestA21.js:17-22 (header) | MINOR | `Every distractor is a detail the text actually names but which does not answer the question` | True for `lesen-1` (all ten anchors verified: Mittwoch/Freitag, 15/16 Uhr, Abendessen/Computerkurs, Gartenstraße/Erdgeschoss, Sprachcafé/Abendessen). **False if read as covering the module**: `lesen-3`'s `zu teuer`, `zu laut`, `Fünf Euro`, `eine neue Adresse` are deliberately *absent* from the text — the validator itself asserts their absence (lines 484, 488, 491). The sentence sits in a paragraph that talks about both keys, so the scope reads wider than it is. | Scope the sentence to Teil 1 explicitly, and say in one clause why Teil 3 uses unsupported distractors (Goethe A2 Teil-3 norm). |
| 8 | abschlusstestA21.js:412 (`schreiben-1.criteria[0]`) | MINOR | `Du hast alle drei Punkte geschrieben: Grund, Wunsch und ein neuer Termin.` | Apposition to an accusative head (`alle drei Punkte`) given in the nominative, and mixed with two bare nouns. Defensible as a Nennfall after the colon, but `schreiben-2`'s twin criterion is parallel and bare (`Grund, Zeit und Bitte.`), and the A1.2 sibling is too (`Grund, Termin, Entschuldigung.`). | `… : Grund, Wunsch und Termin.` |
| 9 | abschlusstestA21.js:363-369 (`l3-3`) | MINOR | option a `Um 12 Uhr.` | Weakest of the ten distractors: its only anchor in the text is the **room number** `Raum 12`, not a time. A learner scanning for digits meets a category error, not a comprehension choice. (`l3-4`'s `Achtzehn Euro` is fine — `18` is a real time/date in the text.) | Make option a a time, not a room number — `Um 19 Uhr.` works (adjacent to the 18–20 range, unsupported as a start time). |
| 10 | abschlusstestA21.js:252, 259 (`lesen-1.text`) | MINOR | `Die Nachbarn wollten schon lange einen Treffpunkt.` / `Vor einem Jahr konnte der Verein …` | Two small content wrinkles: (a) `wollten` with no infinitive — idiomatic German, but topic 11 teaches the Präteritum modal **in the Satzklammer**, and this is the first `wollten` a learner meets; (b) `der Verein` appears with no antecedent — the text never says a Verein runs the Treff, yet `l1-4` asks about it. The item is still decidable (only one Verein is named, and the question repeats `vor einem Jahr`). | (a) `… wollten schon lange einen Treffpunkt haben.`; (b) name the Verein once earlier, e.g. `Ein Verein aus dem Stadtteil macht den Treff.` |
| 11 | validate-a21.test.mjs:33-38 | MINOR | `.split(/(?<=[.?!])\s+/)` | The sentence splitter breaks after ordinals: `Seit dem 1. September gibt es …` is measured as `Seit dem 1.` + `September gibt es …`. No current string exceeds 14 words under a correct splitter (I re-measured all of them: longest real sentence = 13 words, `Er hat den Aufbau der Prüfung …`), so this is latent, not live — but the ≤14-word guard is weaker than it reads and would miss a 20-word sentence containing a date. | Add a `(?<!\d\.)` guard or split on `[.?!]\s+\p{Lu}` with an ordinal exception, then re-run. |
| 12 | abschlusstestA21.js:210-211 (`intro`) | MINOR | `Wie in der Prüfung bestehst du ab 60 Prozent der Aufgaben.` | States the official exam's pass rule as a proportion of **Aufgaben**; D1 is verifying it as **points** (45/75 written + 15/25 Sprechen per exam-brief §Facts). 60 % is arithmetically right for each block, so this is a wording risk, not a false claim — but it is a claim about a third party's exam made in a file that cites no source for it. | `… bestehst du ab 60 Prozent der Punkte.`, and let D1's verified pass rule be the single source. |
| 13 | abschlusstestA21.js:253, notes.md §Doubts 6 | MINOR | `Der Treff ist … von 15 bis 20 Uhr offen.`; `Verein`, `Teilnehmer`, `Anrede`, `Nachbarschaftstreff` | `geöffnet` is the natural word for opening hours (`offen` reads colloquial in an Aushang). And the Wortliste doubts the author raises are real but unresolvable here — goethe.de is blocked from this sandbox for me too, so I can neither confirm nor refute `Verein` / `Teilnehmer` / `Anrede`. `Nachbarschaftstreff` and `Sprachcafé` are transparent compounds of A1/A2 halves and I would keep them. | Change `offen` → `geöffnet`. Leave the Wortliste question to whoever can open the list; record it as an accepted risk, not a silent one. |

## Checks that came back clean (so the table is not the whole story)

- **Shape parity with the template**: every field `tests/exams.test.mjs` 226–330 reads is present and
  valid — `examKey`, `title` matching `/Kurzversion/`, `passPercent` in 50–100, three sections with
  `key/title/minutes/instructions/parts`, part types `listening|mc-group|writing` only, every
  `answer` among its `options`, unique part keys and item ids, `criteria.length ≥ 3` on both writing
  parts, listening `level` in the DB uppercase form `A2.1`, `exerciseNumber` 4 ∈ 1–6, numeric
  `questionMax`. Perfect sheet = 10/10, empty sheet = 0, `countScorableItems` agrees. `exerciseId` is
  an extra field nothing reads — harmless, and correctly documented as provenance (the runner
  resolves by `level` + `exerciseNumber` via `useExerciseDetails` / `getAudioUrl`).
- **`courseLevel` vs `level` — the author is right, and the brief's field name is the loose one.**
  Nothing in the repo reads either field off the *module*: `grep -rn courseLevel src/ tests/ scripts/
  netlify/` returns only the two sibling definitions. What the resolver, the guard and
  `tests/exams.test.mjs` read is `level` on the **COURSE_TESTS registry row**
  (`resolveModelltest` → `gateLevel: course.level`; `assert.match(ct.level, /^[ab][12]\.[12]$/)`).
  Following the template (`courseLevel` on the module, `level` on the row the header specifies) is
  correct; adding a second `level` field to the module would be inventing shape. No change needed.
- **Gate**: `isLevelFree('a2.1') === false` and `bandCourseForLevel('a2.1').key === 'course_a2'` —
  the header's Pro/trial-or-A2-course claim is what the code computes. Verified by running it.
- **Listening pick**: the id/exercise_number/title/duration/question-count all match the live row in
  the dump; no mock or course test uses any A2.1 exercise (checked all seven modules); the two
  in-audio blemishes the author flags (item 4 reciprocal `sich treffen`, item 10 pronominal adverb)
  are real, recognition-only, and honestly disclosed rather than hidden. Every rejection reason for
  #1/#2/#3/#5 checks out against the dump (three Genitiv items in #1; `fand` in #2 item 10; `Wogegen`
  in #2 item 4) — only the #6 quote (finding 1) and the #5 count (finding 6) are wrong.
- **All 10 Lesen items re-solved cold**: `l1` = b c b a c, `l3` = a b c a b — I derived the same keys
  the file carries, each from one locatable sentence, with exactly one defensible answer per item. No
  item is answerable from world knowledge alone; no item has a second defensible reading (I checked
  `l1-3` for a second free item — the Abendessen costs children €1, the Computerkurs has no price —
  and `l3-5` for a Geld-only reading — both `bis Freitag` requests are in the text).
- **Level constraint in the authored content**: adjective endings all weak/mixed and correct after
  their article (21 triples, hand-checked); no null-article endings outside `Guten Tag` / `Viele
  Grüße`; the four new topics each used on purpose in the Lesen texts (`Der neue/große/alte`,
  `ein kleines`, `mir/Ihnen/sie`, `konnte/mussten/wollten`, `Seit dem/Vor einem Jahr/Ab Oktober/
  von … bis/um/am/gegen/bis Freitag`); no Nebensatz, Präteritum of a full verb, Futur, Passiv,
  relative clause, `zu`-infinitive, reflexive, Komparativ or Superlativ anywhere in the authored
  strings; longest real sentence 13 words. `Am Samstag, dem 18. Oktober,` (dative apposition) and
  `Bitte geben Sie mir das Geld` (Dativ pronoun before Akkusativ noun) are both correct.
- **Writing parts**: 3 Leitpunkte each, word ranges stated in the task and matching the brief
  (20–40 / 30–60), criteria cover Leitpunkte / Anrede+Gruß / Register / word count /
  Verständlichkeit, no outcome promise, no automated-assessment claim, `Der Computer bewertet diese
  Aufgaben nicht.` states the truth. Register mixing in `schreiben-2` (task in Sie, criteria in du)
  is defensible — the task is the role, the criteria are the coach — but worth a coordinator glance.
- **notes.md** is unusually honest: it flags the timing conflict, the audio blemishes, the
  `courseLevel` deviation, the D1 and migration dependencies, and the Wortliste limit. Findings 1, 2,
  6 and 7 are all in material notes.md claims to have validated, which is the gap worth closing:
  the harness validates the *module*, and only four of the header's *quotes*.

VERDICT: FAIL (4 blocking, 9 minor)

Overall: this is a strong, well-reasoned deliverable — the item keys are sound, the level constraint
holds across every authored German string, and the shape would pass the repo suite today. All four
blocking findings are cheap: two are wrong quotes in the header (a fabricated transcript line and a
stale self-quote), one is three Genitiv phrases in the intro the file's own regex cannot see, and one
is the 8:38 × 2 plays vs 15-minute timer conflict, which the author correctly refuses to decide
alone. Fix 1–3 in the file, get a coordinator ruling on 4 (I recommend part-configurable plays), and
round 2 should pass.
