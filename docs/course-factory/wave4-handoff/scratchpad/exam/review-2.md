# Adversarial re-review — Wave 4 PR D1 (Goethe-Zertifikat A2), round 2 (delta)

Scope: verify each claimed fix against the files themselves, re-run the sweeps and the repo
regexes independently, and hunt for defects the fixes introduced. I did not take `notes.md` §6
at its word for a single item.

## Method

1. Re-read every changed region of `goethe-a2.js`, `hub-copy.js`, `writingTasks.goethe-a2.js`
   and `notes.md` (§6/§7/§8) directly.
2. `node --check` on all five files: **OK**. `node verify.mjs`: **PASS, exit 0, no warnings**
   (output below).
3. **Mutation-tested the author's six new pins myself** rather than trusting the claim that they
   bite: I re-introduced all six round-1 blocking defects into a copy of the tree and re-ran
   `verify.mjs`. Result: **9 failures, exit 1**, each naming the right defect (output below).
   Restored and re-ran clean.
4. Ran my **own** preposition/case sweep (all dative-only prepositions against accusative
   markers and all accusative-only prepositions against dative markers) over every rendered
   German string in guide + tasks + hub copy — written independently of the author's sweep.
5. Ran the repo's own `OUTCOME`, `FEE` and `OFFICIAL` regexes, plus `du bestehst`, over all four
   artefacts myself; re-ran the repo's `tests/guides.test.mjs` link matcher verbatim.
6. Re-verified the two facts that are **new in round 2** — the Teilwiederholung rule and the
   DSH-2 / TestDaF Studium requirement — and re-tested the two disputed source URLs.

```
verify.mjs: PASS
  guide           goethe-a2 — title 36 chars, description 155 chars
  answer          102 words (want 45-120)
  sections        7 (ueberblick, aufbau, punkte, anmeldung, lernplan, fehler, vorbereitung-mit-deutschmeister)
  faq / reading   9 entries, ~15 min
  sources         8
  internal links  5 checked, all trailing-slash cases correct
  hub copy        title 46 chars, description 157 chars
  track           goethe_a2 → /pruefung/goethe-a2/ (hasMock false, hasWriting true)
  round-2 pins    Messpunkte, age-recommendation, preposition case, Studium/DSH, pointsNote, Leitpunkt pronoun — all clean
  writing tasks   4 (2 × Teil 1, 2 × Teil 2), A2.1 constraint clean
```

My mutation test of the six pins (defects re-introduced by me, not by the author):

```
verify.mjs: FAIL — 9 problem(s)
  1. the punkte section must say "20 Messpunkte", not "20 Antworten"
  2. the "20 gezählte Antworten" wording is back
  3. accusative after the dative preposition "gegenüber": "gegenüber wen"
  4. "gegenüber wen" is back in learner-facing text
  5. sms-einladung-absagen: pointsNote asserts an unsourced Teil 1 : Teil 2 split
  6. sms-treffen-verschieben: pointsNote asserts an unsourced Teil 1 : Teil 2 split
  7. sms-treffen-verschieben: Leitpunkt "Sag Jonas: Der Dienstag passt dir nicht" models direct speech containing a 2nd-person pronoun — it addresses the wrong person
  8. email-kursanmeldung: pointsNote asserts an unsourced Teil 1 : Teil 2 split
  9. email-termin-beim-amt: pointsNote asserts an unsourced Teil 1 : Teil 2 split
```
```
verify.mjs: FAIL — 5 problem(s)     (second mutation run: age + Studium)
  1. the answer must present 16 as a recommendation
  2. the answer must say there is no minimum age
  3. the age is stated as an eligibility bar: "Erwachsene ab 16 Jahren."
  4. the Studium sentence must name the actual requirement (DSH-2 / TestDaF), not a guessed level
  5. the old unsourced Ausbildung/Studium sentence is back
```

My own sweeps (independent script):

```
guide OUTCOME false FEE false OFFICIAL false du bestehst false
tasks OUTCOME false FEE false OFFICIAL false du bestehst false
hub   OUTCOME false FEE false OFFICIAL false du bestehst false
track OUTCOME false FEE false OFFICIAL false du bestehst false
preposition/case sweep hits: [ 'DAT-prep+AKK: "nach den" in: Frage nach den Terminen und der Anmeldung' ]
   → false positive of my own matcher: "den Terminen" is dative PLURAL. Correct German. Sweep clean.
Leitpunkt colon + 2nd-person pronoun: (none)
equal-weight claim in rendered tasks: false
sentences > 14 words in task German: (none)
answer figures absent from sections: (none)
REPO link failures: [ '/level/a2.1 matches no known route shape' ]   ← expected; the test edit is the fix
```

## Blocking findings — verified one by one

| # | Claimed fix | Verified in file | Verdict |
| --- | --- | --- | --- |
| 1 Messpunkte | § `punkte` rewritten | „Jeder der drei schriftlichen Teile wird auf **20 Messpunkte** bezogen, die mit dem Faktor 1,25 auf 25 Prüfungspunkte umgerechnet werden. In Lesen und Hören sind das 20 richtige Antworten … **Schreiben und Sprechen werden dagegen nach Kriterien bewertet**, nicht durch Abzählen richtiger Antworten" | **FIXED.** Matches the source wording exactly ("das Ergebnis von 20 Messpunkten … mit 1,25 multipliziert") and the false "1,25 pro richtiger Antwort" no longer reaches Schreiben. See MINOR-4 for a small residue. |
| 2 age | recommendation in `answer` + § `ueberblick` + FAQ, question reworded | `answer`: „…für Erwachsene; **empfohlen** wird sie ab 16 Jahren, **ein Mindestalter gibt es nicht**." · § `ueberblick`: „ein Alter **ab 16 Jahren empfohlen** — eine Altersgrenze ist das nicht: Die Prüfungen … können unabhängig vom Erreichen eines Mindestalters abgelegt werden." · FAQ q: „**Für welches Alter ist die Prüfung gedacht?**" | **FIXED**, in all three places including the answer-engine passage. Re-confirmed the DFB wording from a fresh search. Rewording the question rather than only the answer was the right call. |
| 3 „gegenüber wen" | → „wem? statt wen?" | line 250: „Dativ als drittes Puzzleteil: **wem? statt wen?** — mit Artikeln, Possessivartikeln und Pronomen" | **FIXED.** Grammatical, and it preserves the pedagogical contrast. My independent preposition sweep over the whole guide finds no other case error. |
| 4 Studium | sourced split, new `sources[]` entry | „Für ein **Studium** reicht A2 nicht: Für die Zulassung verlangen deutsche Hochschulen nach der Rahmenordnung der Hochschulrektorenkonferenz einen Nachweis wie **DSH-2 oder TestDaF mit 4×TDN 4** … Welches Niveau ein **Ausbildungsbetrieb** erwartet, legt der Betrieb beziehungsweise die zuständige Kammer fest" | **FIXED and independently verified.** I confirmed DSH-2 and „TestDaF … in allen vier Prüfungsteilen mindestens TDN 4" from the HRK page, `testdaf.de` and the RO-DT. **The cited HRK URL resolves as a titled live result** — unlike the two disputed goethe.de paths, this new source checks out. |
| 5 pointsNote | equal-weight claim deleted ×4 | Only „25 von 100", „60 von 100", „45 von 75", „15 von 25" remain in all four | **FIXED.** Grepped the rendered data, not the file: `equal-weight in rendered tasks: false`. The one surviving occurrence of the phrase is in the file's header comment, documenting the deletion — no scanner reads it. |
| 6 LP1 | → „Schreib Jonas: Dienstag passt nicht" | line 100 | **FIXED.** No 2nd-person pronoun after the colon; the modelled sentence now says what it means, and „Dienstag passt nicht" is idiomatic elliptical SMS German. |
| 7 integration | notes §7 restated as one applicable instruction | — | **UNCHANGED AND STILL REQUIRED** (not fixable in the artefacts). I re-ran the repo matcher: `/level/a2.1` is still the single failure. §7 now gives the integrator the exact array to paste. Correct. |

## Minor findings from round 1 — all 15 checked

10 „unter anderem in § 25a und § 25b" ✔ (guide + FAQ 8) · 11 „mindestens einfache deutsche
Sprachkenntnisse **oder** Englischkenntnisse auf Niveau B2" ✔, and the Chancenkarte point is now
stated precisely as **one** point, which matches the Anlage ✔ · 12 both invented arithmetic
claims replaced by the criterion argument („trifft das Kriterium ‚Erfüllung der Aufgabenstellung'
direkt") ✔ · 13 „orientiert sich an dem, was die Prüfung voraussetzt" ✔ · 14 Goethe's **200–350
UE à 45 Min.** now anchors both the Lernplan intro and the duration FAQ, explicitly framed as
„von null", with the plan scoped to the last leg ✔ (this is the best of the round-2 edits) ·
15 Volkshochschule claim gone → „Welche Zentren das … sind, steht auf goethe.de" ✔ · 16 „in Teil
4" ×2 ✔ and FAQ 5 → „Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben." ✔ ·
17 „der Teil, der nur einmal **läuft**" ✔ · 18 Sprechen Teil 2 no longer addressed to the examiner
✔ · 19 Leitpunkte nominalised ✔ (see MINOR-6) · 20 register divergence documented in the task
header ✔ · 21 „kostenlos" ✔ · 22 hub `intro`/`focus` stripped of points, durations, Paarprüfung
and pass wording ✔.

**8 and 9 were not adopted.** 9 I accept as an open pre-merge item. **8 I re-raise**, below.

## Findings (round 2)

| # | file:path | severity | quote | why | fix |
| --- | --- | --- | --- | --- | --- |
| 1 | `goethe-a2.js` `sources[0]` | MINOR (re-raised) | `…/pro/relaunch/prf/**en**/Durchfuehrungsbestimmungen_A2.pdf` | The non-adoption rests on a failed search, not on the URL's absence. I settled it with a domain-restricted query: `https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf` comes back as the **top titled result** ("GOETHE-ZERTIFIKAT A2 UND GOETHE-ZERTIFIKAT A2 FIT IN DEUTSCH"), with a **last-updated date of 1 September 2025** — i.e. it is live *and* current. A German-language guide citing the English-market copy is a needless mismatch. Reproducible; not a judgement call. | Swap to the `/de/` path and drop the "deutsch/englisch" qualifier. One line. |
| 2 | `goethe-a2.js` `sources[4]` | MINOR (open) | `https://www.goethe.de/ins/de/de/prf/prf/gzsd2/wi2.html` | The evidence cited for keeping it is the titled result "Weitere Informationen Goethe-Zertifikat A2 — Goethe-Institut Deutschland"; in my searches that title resolves to `/ins/de/de/**m**/prf/prf/gzsd2/wi2.html`, not to the cited path. The cited shape is *plausible* (the A1 guide's header records `/ins/de/de/prf/prf/gzsd1.html` returning 200) but remains unverified from here. Not worth blocking on. | Leave it, and `curl -I` it before merge along with the other four goethe.de URLs (already on the author's list). If it 404s, use the `/m/` variant. |
| 3 | `goethe-a2.js` § `punkte`, last p | MINOR (new) | „Eine Wiederholung **einzelner Prüfungsteile** ist dort nur in Ausnahmefällen und nur vorgesehen, wenn die organisatorischen Bedingungen am Prüfungszentrum es zulassen" | The new claim is real and I verified it — but the DFB's scope is narrower than "einzelne Prüfungsteile": the partial retake is **either the oral exam or the *entire* written exam**, never a single sub-test. A reader could infer they may re-sit Lesen alone. Good that the guide stopped ducking this; make it exact. | „…die Wiederholung entweder der mündlichen oder der gesamten schriftlichen Prüfung — und auch das nur in Ausnahmefällen…" |
| 4 | `goethe-a2.js` § `punkte`, p1 | MINOR (new) | „**Schreiben und Sprechen** werden dagegen nach Kriterien bewertet … Es zählt, ob die Aufgabe erfüllt ist (**alle Leitpunkte**), wie **der Text** kommunikativ gestaltet ist und wie korrekt **er** sprachlich ist." | The criterion list is Schreiben-shaped ("Leitpunkte", "der Text") but the sentence subject includes Sprechen, which has no Leitpunkte and no text — and whose own criteria additionally cover Aussprache. Also "dagegen" contrasts against a sentence about the *three written parts*, which Sprechen is not one of. | Either restrict the list to Schreiben, or split: „Schreiben wird nach Kriterien bewertet …; das Sprechen ebenfalls, dort zusätzlich mit Aussprache." |
| 5 | `hub-copy.js` `intro` | MINOR (new) | „Zwei getrennte Hürden statt einer, und die **zweite besteht aus Sprechen**." | Introduced by the round-2 rewrite. `bestehen aus` takes constituent parts — a hurdle does not "consist of speaking". Also a verbless fragment coordinated with `und` to a full clause. The rest of the hub set reads as clean native prose. | „…und die zweite ist das Sprechen." |
| 6 | `writingTasks.goethe-a2.js` → `sms-treffen-verschieben` LP1 | MINOR (new) | „Schreib Jonas: Dienstag passt nicht" among eleven nominal Leitpunkte | The nominalisation fixed minor 19 everywhere else, so this one imperative now reads as an oversight rather than a choice. The author already supplies the drop-in and asks for a ruling: **take it.** The blocking-6 requirement was "no 2nd-person pronoun in modelled direct speech", which the nominal form also satisfies. | `'Absage für den Dienstag'`. Confirm the `verify.mjs` colon-pronoun pin still has something to guard (it does — it scans all four tasks). |
| 7 | `writingTasks.goethe-a2.js` header, l.60 | MINOR (new) | „hence \"Frag nach der Anmeldung\" and \"Schreib deinen Namen\")" | Doc drift: both quoted strings were replaced in round 2 („Frage nach den Terminen und der Anmeldung", „Name und Niveau"). The comment now explains the reflexive-avoidance with examples that are not in the file. | Requote the current strings, or say „…hence the nominal Leitpunkte below". |

## No new defects elsewhere

I re-checked everything the fixes could have broken, not just what they touched: all four repo
regexes clean on all four artefacts; the `answer` grew to 102 words and the hub description to
157 chars — both still inside the pinned bands (120 / 160), with less headroom than before but
no violation; every `answer` figure still recurs in a section; reading time 15 min; section ids,
`aufbau` table head and row count unchanged; the track literal is untouched and still matches its
siblings field-for-field; the five internal links and their slash cases are unchanged; the four
`register` values still come from the set the SPA renders; no task sentence exceeds 14 words; the
new nominal Leitpunkte are all inside A2.1 (`für einen neuen Termin` = Akk after `für` with
topic-9 endings; `nach den Terminen`, `nach einem Kurs`, `nach der Uhrzeit` = correct dative after
`nach`); no reflexive, Präteritum, Futur, Komparativ, Genitiv, Nebensatz or `zu`-infinitive has
crept back in; `sources` went 7 → 8 and the added HRK URL is the only one of the eight I could
positively resolve this round.

VERDICT: PASS (0 blocking, 7 minor) — conditional on the `tests/guides.test.mjs` one-line edit in notes §7 landing in the same PR

All six round-1 blocking defects are genuinely fixed at the source, not papered over, and each is
now held by a regression pin that I proved bites by re-introducing the defect myself. The two
facts that are new this round (Teilwiederholung, DSH-2/TestDaF) I verified independently rather
than accepting; both hold, and the new HRK source resolves. The seven remaining minors are all
one-line edits and none of them touches a number, a claim or a link shape. The one thing that can
still fail CI is not in these files: `/level/a2.1` needs its entry in `NO_SLASH_ROUTES`, and notes
§7 now hands the integrator that line verbatim.
