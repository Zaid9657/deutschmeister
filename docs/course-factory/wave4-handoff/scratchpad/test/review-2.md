# Adversarial delta re-review — Wave 4 PR D2a (Abschlusstest A2.1), round 2

Scope: verify each of round 1's 4 blocking + 9 minor fixes against the actual file, re-solve all 10
Lesen items cold, re-read both Schreiben tasks and the intro, run the harness, and judge whether the
header's runner instruction is precise enough for an integrator. Repo untouched.

```
$ node --check abschlusstestA21.js      → OK
$ node --check validate-a21.test.mjs    → OK
$ node --test validate-a21.test.mjs     → # tests 25 | # pass 25 | # fail 0   (was 19/19)
```

## Round-1 findings — verified one by one against the file, not against notes.md

| R1 # | claim | verdict |
|---|---|---|
| B1 fabricated #6 quote | header now carries `"Wir weisen darauf hin, dass während des Films Handys ausgeschaltet sein müssen."`, verbatim in the dump; the stitched line is gone (asserted by test 21) | **FIXED**. I re-ran my own extractor over the whole header: every German quote resolves verbatim to the dump, the module, or a wave brief. The only unresolved runs are two English identifiers and the three D1 topic names (`Termin beim Amt` ×2, `Nachbarn um Hilfe bitten`) — all three are verbatim in `exam-brief.md` §4, which the harness now checks by reading the brief rather than allow-listing. |
| B2 stale `ein kleines Frühstück` | header inventory now says `ein kleines Abendessen` | **FIXED**, and structurally: the every-quote check makes a stale self-quote fail. |
| B3 Genitiv in the intro | intro rewritten: `von deinem A2.1-Kurs`, `die gleichen Prüfungsteile`, `ab 60 Prozent von den Punkten`; the carve-out is withdrawn in the header | **FIXED as grammar** — my independent scan of every module string finds no Genitiv determiner, no partitive `… der/des`, no `-kurses/-jahres` form. The ban went from 1 regex to 5 with a firing self-test (test 23), which is the right shape. **But the replacement sentence introduced a new false claim — see finding 1 below.** |
| B4 8:38 × 2 plays vs the 15-min timer | `playsAllowed: 1` on the part, `Du hörst sie einmal.` in the instructions, dependency 3 in the header, and test 7 pins the current runner state so it fails the moment `part.playsAllowed` is read | **FIXED as far as this file can.** The proposed runner line is correct and minimal: `MockListeningPart` receives `part` as a prop, and `PLAYS_ALLOWED` is used in exactly two places inside it. I verified both against the live file. Precision caveat in finding 3. |
| m5 duplicate cancellation | `schreiben-2` swapped from Termin beim Amt to a Sportverein enquiry; `Amt` asserted absent; one cancellation left | **PARTLY** — the collision moved rather than cleared, see finding 2. |
| m6 `7 of 10 … price` | now "five … ask for a price … two more for a bare number — seven of ten"; test 22 recounts both from the dump | **FIXED**. I recounted: price items 1/2/3/5/8 = 5; Lichtschutzfaktor + Rosen = 2. Correct. |
| m7 distractor-policy overclaim | header now states the two policies separately (Teil 1 anchored, Teil 3 deliberately unsupported, Goethe A2 Teil-3 norm) and the harness asserts each direction | **FIXED**. |
| m8 apposition | `Grund, Wunsch und Termin.` | **FIXED**, and parallel to `schreiben-2`'s `Kurs, Zeit und Preis.` |
| m9 `Um 12 Uhr` distractor | now `Um 19 Uhr.`; test 25 requires all three options to be times | **FIXED**. 19 appears nowhere in the text; 20 is the real end time. |
| m10 modal + antecedent | `… einen Treffpunkt haben.` (Satzklammer) and a new `Der Treff gehört einem Verein.` before `l1-4` asks about it | **FIXED**, and the new sentence pays for itself: it is a taught A2.1 dative verb (`gehören`). |
| m11 splitter | ordinal+month glued before splitting | **FIXED**. I re-measured with my own ordinal-safe splitter: 0 sentences over 14 words, longest 13. |
| m12 pass-rule wording | `ab 60 Prozent von den Punkten` | **FIXED** (points, not items). Style note in finding 6. |
| m13 `offen`/Wortliste | `geöffnet` in the text and in `l1-1`'s prompt; the Wortliste risk recorded as open | **FIXED / correctly recorded.** goethe.de is blocked for me too; `Verein`, `Teilnehmer`, `Anrede` stay unverified by either of us. |

## New findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | abschlusstestA21.js `intro` | BLOCKING | `Er hat die gleichen Prüfungsteile wie das Goethe-Zertifikat A2.` | Introduced by the B3 rewrite, and **false**: the Goethe-Zertifikat A2 has four Prüfungsteile (Hören, Lesen, Schreiben, Sprechen); this test has three. Within them it carries 1 of 4 Hören-Teile and 2 of 4 Lesen-Teile (its own labels say `Teil 1` and `Teil 3`). The old wording (`den Aufbau der Prüfung …, aber nur die halbe Länge`) was vague; this one is specific and wrong. Mitigating but not curing: `Aber er hat nur die halbe Länge.` and `Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier.` follow two sentences later — the missing part is disclosed, which is why this is a false claim rather than a deceptive one. It is learner-facing honesty-contract copy in a repo whose rule is "derive, never retype, and never claim what you have not checked", so it blocks. | `Er trainiert drei Teile vom Goethe-Zertifikat A2: Hören, Lesen und Schreiben.` (11 words, du-form, Genitiv-free — `Teile vom` does not trip the new ban; I ran it against all five regexes). Keep `Aber er hat nur die halbe Länge.` unchanged. Add a harness assertion that the intro names the three sections it actually has. |
| 2 | abschlusstestA21.js `schreiben-2` | MINOR | `Sie möchten im Sportverein einen Kurs machen. … Welchen Kurs möchten Sie machen? Wann haben Sie Zeit? Fragen Sie nach dem Preis.` | The swap traded one duplicated scenario for another. Live `src/data/writingTasks.js` already ships `mitteilung-info-sprachkurs` (goethe_a1, formell, 25–60 Wörter): *"Du möchtest einen Deutschkurs an der Volkshochschule machen. Schreib eine Nachricht an die Volkshochschule"*, Leitpunkte *"Sag, dass du einen Deutschkurs machen möchtest" / "Frag nach dem Termin (Tag und Uhrzeit)" / "Frag nach dem Preis"*. That is the same task — which course, when, what does it cost — with the institution swapped and du→Sie, and the third Leitpunkt is a near-verbatim paraphrase. The new duplication test compares **verbatim sentences** against writingTasks.js, so a person-form paraphrase is invisible to it; it caught the `schreiben-1` Leitpunkt only because that one matched character for character. (There is also a `formular-sportverein-anmeldung` in the same bank — same institution, different task type; harmless on its own, but it means both halves of this task already exist in the repo.) | Cheapest: change Leitpunkt 3 away from the price, e.g. `Fragen Sie nach dem Ort.` or `Fragen Sie, was Sie mitbringen müssen.` Better: pick a scenario the bank does not hold at all (e.g. an e-mail to the Sprachschule from `lesen-3` asking to move a course day — but check that against `mitteilung-…-verschieben` first). Either way, normalise du/Sie imperatives before comparing, or the check keeps missing this class. |
| 3 | abschlusstestA21.js header, dependency 3 | MINOR | `src/pages/Modelltest/ModelltestRun.jsx has a module constant PLAYS_ALLOWED = 2 used in exactly two places inside MockListeningPart (the canPlay guard and the "Noch" counter label)` | Accurate and sufficient to act on — file, component, constant, the two call sites and the exact line to add are all there, and I confirmed every part of it against the live file. What is missing is the line numbers, and they exist: **ModelltestRun.jsx:36 defines the constant, :82 is `const canPlay = plays < PLAYS_ALLOWED;`, :101 is the `Noch …× abspielbar` label** — verified today. notes.md has them; the header does not, and notes.md is a scratchpad artefact that will not be committed while the header will. The integrator instruction should not be the half that gets thrown away. | Copy the three line numbers (with "verified 2026-09-06", since they will drift) into dependency 3. |
| 4 | abschlusstestA21.js header, timing note | MINOR | `the real Goethe A2 Hören plays its long parts once too, so the honest fix is also the exam-faithful one` | An unsourced claim about a third party's exam, used to justify a product decision. goethe.de is blocked from this sandbox for me as well, so I can neither confirm nor refute it, and it is not among the facts `S/wave4/exam-brief.md` §Facts sends D1 to verify. The repo's rule is that exam facts carry provenance. | Either attribute it to D1's verified fact table once that lands, or mark it explicitly as unverified in-file (`unbestätigt, goethe.de aus dem Sandbox nicht erreichbar`). The timing argument stands on the 8:38-vs-15-min arithmetic alone; it does not need this sentence. |
| 5 | abschlusstestA21.js `schreiben-1.task` | MINOR | `Du kannst nicht zur Party kommen. … Warum hast du keine Zeit?` | The de-duplication of the sibling's `Warum kannst du nicht kommen?` narrowed the meaning: the scenario says the learner cannot come, the Leitpunkt now presupposes *lack of time* as the reason. A learner who wants to write "Ich bin krank" is answering a question the task did not ask. | `Warum kommst du nicht?` (not in the sibling, not in writingTasks.js — I checked) or align the scenario line to `Du hast morgen keine Zeit.` |
| 6 | abschlusstestA21.js `intro` | MINOR | `Wie in der Prüfung bestehst du ab 60 Prozent von den Punkten.` | Genitiv-free and level-legal, but `Prozent von den Punkten` is clumsy German, and the repo already has house phrasing for exactly this: `writingTasks.js`'s pointsNote says *"Insgesamt braucht man 60 von 100 Punkten"*. | `Wie in der Prüfung bestehst du ab 60 von 100 Punkten.` — 11 words, Genitiv-free, and consistent with the live copy. |

## Re-verified from scratch (not taken from the author's report)

- **All 10 Lesen items re-solved cold** against the *edited* texts, answer written before the key:
  `l1` = b c b a c, `l3` = a b c a b — unchanged and each still decidable from one locatable
  sentence, with exactly one defensible answer. The three text edits were checked for collateral
  damage: dropping `Gartenstraße 8` → `Gartenstraße` keeps `l1-4`'s distractor anchored; `für alle`
  (was `für alle Nachbarn`) breaks nothing; `Der Treff gehört einem Verein.` removes the dangling
  referent without creating a second answer to `l1-3` or `l1-4`; `l3-3`'s new `Um 19 Uhr.` is
  unsupported by the text while `Um 20 Uhr.` remains the real end time.
- **Level constraint, re-scanned independently over every module string**: no Genitiv, no Präteritum
  of a full verb, no Futur/Passiv/Konjunktiv II, no reflexive, no Nebensatz, no `als`-Komparativ, no
  English, no sentence over 14 words (longest 13). New strings all correct: `Der Treff gehört einem
  Verein.` (dative verb), `Du hörst sie einmal.`, `Welchen Kurs möchten Sie machen?`, `Fragen Sie
  nach dem Preis.`, `So schreibt man an einen Verein.`
- **Shape/scoring unchanged**: 3 sections, 15+20+20 = 55, 10 objective items, perfect sheet 10/10,
  empty 0, `countScorableItems` agrees, `questionMax: 10`, `level: 'A2.1'`, `exerciseNumber: 4`.
  `playsAllowed` is an extra field nothing in the repo reads today — correctly documented as inert.
- **Text lengths**: Teil 1 = 128 words (band 110–130 — 2 words from the ceiling now, worth knowing
  before anyone adds a sentence), Teil 3 = 119 / 106 without the Von/An/Betreff lines (band 100–120).
- **The harness got better, not just bigger**: the every-quote check reads the briefs instead of
  allow-listing them, the Genitiv test asserts the five regexes fire on round 1's five phrasings and
  stay silent on the six replacements, and test 7 pins the runner's current state so the `playsAllowed`
  dependency cannot be quietly forgotten. Its blind spot is finding 2: verbatim-sentence comparison
  against a task bank written in the du-form.

VERDICT: FAIL (1 blocking, 5 minor)

All four round-1 blocking findings and all nine minors are genuinely fixed — I checked each against
the file rather than the report, and the two structural fixes (every-quote check, five-regex Genitiv
ban with a firing self-test) close the classes, not just the instances. One new blocking defect came
in with the Genitiv rewrite: `die gleichen Prüfungsteile wie das Goethe-Zertifikat A2` is false at
3 parts of 4, in the one paragraph that must never overstate the relationship to the real exam. It is
a one-sentence fix. Finding 2 (the scenario swap landed on a second live duplicate) is the only other
thing I would not merge without a decision. Round 3 should pass.
