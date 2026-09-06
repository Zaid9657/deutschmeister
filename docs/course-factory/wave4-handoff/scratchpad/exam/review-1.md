# Adversarial review — Wave 4 PR D1 (Goethe-Zertifikat A2 exam identity), round 1

Reviewer: Opus. Deliverable: `S/wave4/exam/{goethe-a2.js, examTracks.entry.js, hub-copy.js,
writingTasks.goethe-a2.js, verify.mjs, notes.md}` against `S/wave4/exam-brief.md`,
`S/wave4/level-a2.1.md`, `S/wave4/common-header.md` and the repo (read-only).

## What I actually did (so the "found nothing" suspicion is answerable)

1. Read the level file, the common header, the exam brief, then all six deliverable files in
   full — including every comment block.
2. Read the repo side myself: `astro-site/src/data/guides/index.js` (Guide typedef, fact
   discipline, `guideReadingMinutes`), `guides/start-deutsch-1.js` (the template, incl. its
   URL-verification header), `astro-site/src/data/exams/index.js` (HUB_COPY + `buildPath`),
   `src/data/examTracks.js`, `src/data/writingTasks.js` (+ the `_shared` twin and
   `SchreibenPage.jsx`, which renders `pointsNote`), `src/data/marketing.js`,
   `src/data/content.js`, `tests/guides.test.mjs`, `tests/exams.test.mjs`,
   `scripts/check-duplicates.mjs`, `scripts/check-built-html.mjs`, `netlify.toml`,
   `eslint.config.js`.
3. Ran `node --check` on all five `.js`/`.mjs` files (all OK) and `node verify.mjs`
   (PASS, exit 0 — output pasted below).
4. Did NOT trust `verify.mjs`. Re-implemented the repo's own link/date/length logic
   verbatim in a throwaway script and ran it against the guide (output below) — this is
   what confirms the `/level/a2.1` claim independently of the author's script.
5. Re-verified every exam fact with `WebSearch` against ≥2 independent retrieval channels,
   deliberately including non-goethe.de mirrors. `WebFetch` is indeed blocked for every
   domain (tested `lansad.unistra.fr` → `EGRESS_BLOCKED`), so the author's constraint is
   real and their sourcing method is the only one available here. I re-ran it rather than
   accepting it.
6. Re-solved the writing tasks cold: for each task I wrote the model answer a learner would
   produce, then checked every Leitpunkt against it and against the A2.1 grammar list.

### `node verify.mjs`

```
verify.mjs: PASS
  guide           goethe-a2 — title 36 chars, description 155 chars
  answer          94 words (want 45-120)
  sections        7 (ueberblick, aufbau, punkte, anmeldung, lernplan, fehler, vorbereitung-mit-deutschmeister)
  faq / reading   9 entries, ~14 min
  sources         7
  internal links  5 checked, all trailing-slash cases correct
  hub copy        title 46 chars, description 154 chars
  track           goethe_a2 → /pruefung/goethe-a2/ (hasMock false, hasWriting true)
  writing tasks   4 (2 × Teil 1, 2 × Teil 2), A2.1 constraint clean
```

### My own re-run of the repo's `tests/guides.test.mjs` logic (not the author's)

```
REPO-TEST link failures: [
  '/level/a2.1 matches no known route shape — add it to this test or fix the link'
]
datePublished 2026-09-06 ok(today=2026-09-06)
factsCheckedOn 2026-09-05 ok(today=2026-09-06)
title 36 desc 155 answerWords 94 sections 7 faq 9
```

`node --check`: OK on `examTracks.entry.js`, `goethe-a2.js`, `hub-copy.js`,
`writingTasks.goethe-a2.js`, `verify.mjs`.

## Fact-check results (WebSearch, 2026-09-06, ≥2 channels each)

| Fact as stated | Verdict |
| --- | --- |
| 4 Teile, 25 Punkte je Teil, 100 gesamt, 75 schriftlich / 25 mündlich | **confirmed** (Goethe DFB extraction + `lansad.unistra.fr`, `cen.bialystok.pl`, `assets01.sdd1.ch`, `german-institute.org` mirrors) |
| Bestehen: ≥60/100 **und** ≥45/75 schriftlich **und** ≥15/25 Sprechen, alle Teile abgelegt | **confirmed**, verbatim, from ≥3 independent mirrors |
| Lesen 30 Min., Hören ca. 30 Min., Schreiben 30 Min., schriftlich 90 Min. ohne Pause | **confirmed** |
| Sprechen ca. 15 Min. für 2 TN, 3 Teile, Paarprüfung, keine Vorbereitungszeit, Teil 3 = gemeinsam planen | **confirmed** (bfu practice pages + Goethe institute pages) |
| Lesen 4 Teile / 20 Aufgaben, 5 je Teil, Teile 1–3 Mehrfachauswahl, **Teil 4 Zuordnung** (mit „X"-Option) | **confirmed** — per-Teil breakdown came back explicitly, including 5 items each |
| Hören 4 Teile / 20 Aufgaben, **Teil 2 nur einmal**, Teil 4 Interview | **confirmed** by two channels; also matches the shipped A1 guide's identical Teil-2 rule. The author's doubt #3 can be closed. |
| Schreiben Teil 1 SMS 20–30 Wörter / Teil 2 E-Mail 30–40 Wörter, je 3 Leitpunkte | **confirmed** verbatim ("Schreiben Sie 20–30 Wörter. Schreiben Sie zu allen drei Punkten.") |
| Wortliste ≈ 1.300 lexikalische Einheiten | **confirmed** (Goethe PDF extraction + academia.edu/slideshare mirrors of the Vorwort) |
| Start Deutsch 2 abgelöst | **adequately sourced** (the `gzsd2` URL family + a third-party PDF titled "GOETHE-ZERTIFIKAT A2 START DEUTSCH 2 MODELLSATZ") |
| § 25a / § 25b AufenthG: „hinreichende **mündliche** Deutschkenntnisse im Sinne des Niveaus A2" | **confirmed** for both paragraphs |
| § 20a Chancenkarte: nur „einfache deutsche Sprachkenntnisse"; A2 = Punkte in der Anlage zu § 20b | **confirmed** (A2 = 1 Punkt) — but see MINOR-4 |
| **„ab 16 Jahren"** | **contradicted in substance** — the DFB says 16 is *empfohlen* and that the exams "können unabhängig vom Erreichen eines Mindestalters … abgelegt werden". → BLOCKING-2 |
| **„je 20 gezählte Antworten … 1,25 Punkte je richtige Antwort"** | **wrong** — the source says "das Ergebnis von **20 Messpunkten** … mit 1,25 multipliziert". Schreiben has no 20 answers. → BLOCKING-1 |
| **„Teil 1 und Teil 2 zählen gleich viel"** (pointsNote) | **not sourced** — I could not find it in any channel; the only per-Teil split that surfaced at all (Fit in Deutsch 2) is 1 : 8, i.e. *unequal*. → BLOCKING-5 |

## Findings

| # | file:path | severity | quote | why | fix |
| --- | --- | --- | --- | --- | --- |
| 1 | `goethe-a2.js` § `punkte`, block 1 | **BLOCKING** | „In den drei schriftlichen Teilen werden je 20 gezählte Antworten mit dem Faktor 1,25 auf 25 Prüfungspunkte umgerechnet — eine richtige Antwort ist dort also 1,25 Punkte wert." | The source says **Messpunkte**, not Antworten. Schreiben is criterion-rated (Erfüllung der Aufgabenstellung + kommunikative Gestaltung/formale Richtigkeit); it has no 20 answers and no "richtige Antwort" worth 1,25 Punkte. The guide's own `notes.md` §1 has it right ("20 Messpunkte × 1,25") — the prose mistranslated it. A learner reading this will mis-model the Schreiben score. | „In Lesen und Hören werden je 20 richtige Antworten mit 1,25 multipliziert; im Schreiben wird die Bewertung auf dieselben 20 Messpunkte umgerechnet." |
| 2 | `goethe-a2.js` `answer`, § `ueberblick` p2, FAQ „Ab welchem Alter kann man die Prüfung ablegen?" | **BLOCKING** | „…für Erwachsene **ab 16 Jahren**" / „Die hier beschriebene Erwachsenenfassung ist für Teilnehmende ab 16 Jahren vorgesehen." | The Durchführungsbestimmungen state 16 as a **recommendation** and add that Goethe exams "können unabhängig vom Erreichen eines Mindestalters … abgelegt werden". The FAQ *question* asks about eligibility and the *answer* supplies an age bar — a 15-year-old reader is told, falsely, that they cannot sit it. Worst placement possible: it is also in `answer`, the passage built to be lifted by answer engines. | „Empfohlen ab 16 Jahren; ein Mindestalter gibt es nicht." Reword the FAQ question to „Für welches Alter ist die Prüfung gedacht?" |
| 3 | `goethe-a2.js` § `lernplan`, Woche 1–2, task 1 | **BLOCKING** | „Dativ als drittes Puzzleteil: wem? **gegenüber wen?**" | Ungrammatical under either reading. As a preposition, *gegenüber* governs the **dative** ("gegenüber wem"); as "im Gegensatz zu" it cannot be written this way at all. Wrong German in learner-facing text on a page that sells German instruction. | „Dativ als drittes Puzzleteil: wem? — im Unterschied zu wen?" or simply „wem? statt wen?" |
| 4 | `goethe-a2.js` § `ueberblick`, last p | **BLOCKING** | „Für eine Ausbildung oder ein Studium reicht A2 in aller Regel nicht — dort werden meist **B1 oder B2** verlangt." | Unsourced (the author flags it as "deliberately soft", but it is stated as fact) **and wrong for Studium**: German degree admission normally requires DSH-2 / TestDaF 4 / Goethe C2-family evidence, i.e. **C1**, not B2. Understating a legal/administrative requirement is the dangerous direction — a reader could book the wrong exam. | Split them: Ausbildung „häufig B1/B2, je nach Betrieb und Kammer — frag dort nach"; Studium „in der Regel C1 (DSH/TestDaF)". Or drop the sentence: nothing else in the guide depends on it. |
| 5 | `writingTasks.goethe-a2.js`, all four `pointsNote` | **BLOCKING** | „Teil 1 und Teil 2 zählen gleich viel." | Not supported by any source. I searched the DFB, the Prüferblätter of the Übungssatz and third-party restatements; nothing gives the Teil 1 : Teil 2 split for the **Erwachsene** set, and the only split that surfaced anywhere (Fit in Deutsch 2) is **unequal** (1 vs 8). The author's own doubt #4 says the number could not be found — a fact you could not find must not be asserted, only omitted. This ships into the grader-facing bank and onto the `/schreiben` screen. | Delete the sentence. The remaining three sentences (25/100, 45/75, 15/25) are all verified and are what the brief asked for. |
| 6 | `writingTasks.goethe-a2.js` → `sms-treffen-verschieben`, Leitpunkt 1 | **BLOCKING** | „Sag Jonas: **Der Dienstag passt dir nicht**" | The colon marks direct speech, so the sentence the learner is told to write is addressed **to Jonas** — and in that frame *dir* = Jonas. The modelled sentence therefore says the opposite of the intent ("Tuesday doesn't suit *you*"). An instruction that produces a wrong sentence when followed literally is a wrong key. (The parallel task avoids this: „Sag Danke für die Einladung" has no pronoun trap.) | „Schreib Jonas: Der Dienstag passt mir nicht" — or drop the colon: „Sag Jonas, der Dienstag passt nicht" (still no Nebensatz). |
| 7 | `tests/guides.test.mjs` (integration, confirmed) | **BLOCKING for merge** | `NO_SLASH_ROUTES = ['/faq','/ueber-uns','/signup','/login','/dashboard','/schreiben','/modelltest']` | **CONFIRMED independently.** I re-ran the test's exact matcher against the guide: `/level/a2.1` is the single failure — it is in no `SLASHED_PREFIXES` entry and no `NO_SLASH_ROUTES` entry, so it hits `"matches no known route shape"`. The link itself is *correct* (`netlify.toml` has `from = "/level/*" → /app.html`, status 200, no slash), so the fix is the test, not the guide. | Add `'/level/a2.1'` to `NO_SLASH_ROUTES` (or a `/level/` no-slash prefix list) in the same PR. Everything else in the author's integration checklist also verified: `check-duplicates` pairs, `check-built-html` MANIFEST needs both `leitfaden/goethe-a2/index.html` and `pruefung/goethe-a2/index.html`, `a2.1`/`a2.2` are in `src/data/content.js` `levels`, `goethe_a2` is not yet in either registry. |
| 8 | `goethe-a2.js` `sources[0]` | MINOR | `…/pro/relaunch/prf/**en**/Durchfuehrungsbestimmungen_A2.pdf` | The English-market path on a German-language guide; the `/de/` path is live and surfaced in search (`…/prf/de/Durchfuehrungsbestimmungen_A2.pdf`), as does `…/resources/files/pdf325/durchfuehrungsbestimmungen_a2.pdf`. | Swap to the `/de/` path. |
| 9 | `goethe-a2.js` `sources[4]` | MINOR | `https://www.goethe.de/ins/de/de/prf/prf/gzsd2/wi2.html` | This exact path never appeared in any result. The live variants are `/ins/de/de/**m**/prf/prf/gzsd2/wi2.html` and `/de/spr/kup/prf/prf/gzsd2/wi2.html`. The A1 guide's header records that plausible-looking goethe.de paths 404 — same trap. | Use the `/m/` path, or better `https://www.goethe.de/de/spr/prf/pes/paa2.html` ("Informationen zu den Prüfungsergebnissen – Goethe-Zertifikat A2"), which is the pass-rule page itself and verified live. |
| 10 | `goethe-a2.js` § `ueberblick` p3 | MINOR | „wird das Niveau A2 **an zwei Stellen** ausdrücklich genannt" | Self-contradicted three sentences later, which names a third place (the Punktetabelle der Anlage zu § 20b). An absolute count in a legal sentence is a hostage to fortune. | „an mehreren Stellen" / „unter anderem in § 25a und § 25b". |
| 11 | `goethe-a2.js` § `ueberblick` p3 + FAQ 8 | MINOR | „verlangt § 20a AufenthG nur ‚einfache deutsche Sprachkenntnisse'" | Incomplete: § 20a accepts **einfache Deutschkenntnisse (A1) *oder* Englisch B2**. As written a reader may think German is mandatory for the Chancenkarte. | Add „…oder Englischkenntnisse auf B2". |
| 12 | `goethe-a2.js` § `lernplan` W7–8 tip; § `fehler` item 3 | MINOR | „Ein fehlender Leitpunkt kostet **mehr als drei kleine Fehler**." / „…mehr als mehrere kleine Grammatikfehler zusammen" | A quantified claim about the Bewertung with no Prüferblatt behind it. The direction is right (Erfüllung der Aufgabenstellung is its own criterion); the arithmetic is invented. | Keep the direction, drop the number: „Ein fehlender Leitpunkt trifft ein eigenes Bewertungskriterium — kleine Grammatikfehler tun das nicht." |
| 13 | `goethe-a2.js` § `lernplan` W5–6 tip | MINOR | „Wortschatz aus der offiziellen Liste **deckt die Prüfung ab**." | Overclaims against the Wortliste's own Vorwort, which calls itself an orientation and explicitly „weniger geeignet" for practising vocabulary. | „…orientiert sich an dem, was die Prüfung voraussetzt." |
| 14 | `goethe-a2.js` § `lernplan` p1 | MINOR | „Bei 45 bis 60 Minuten Lernzeit am Tag sind 8 bis 12 Wochen realistisch." | Goethe's own guidance (surfaced in the same DFB extraction) is 200–350 UE à 45 Min. to *reach* A2. The plan works out at roughly 40–85 hours from A1 — plausible for the A1→A2 leg, but the guide never shows the reader the official figure it is implicitly netting against. | Name the 200–350-UE figure once in `lernplan` or the FAQ, so the estimate is anchored rather than asserted. |
| 15 | `goethe-a2.js` § `anmeldung` p1 | MINOR | „in Deutschland sind das häufig **Volkshochschulen**" | Unsourced, and doubtful for *Goethe* exams specifically (VHS are predominantly telc partners; Goethe exams in Germany run at Goethe-Institute and licensed partners). | „…an einem Goethe-Institut oder einem lizenzierten Prüfungszentrum — welche das in deiner Stadt sind, steht auf goethe.de." |
| 16 | `goethe-a2.js` § `aufbau` table + FAQ 5 | MINOR | „im Teil 4 ordnest du zu" (×2); „Beide Teile bestehen aus vier Teilen mit zusammen je 20 Aufgaben." | „im Teil 4" → standard is „in Teil 4". The FAQ sentence uses *Teil* in two different senses inside one clause and reads as a stumble. | „in Teil 4"; „Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben." |
| 17 | `goethe-a2.js` § `lernplan` W7–8, task 3 | MINOR | „Hören Teil 2 gezielt üben — der Teil, **den es nur einmal gibt**" | Says the part *exists* once, not that it is *played* once — the one place in the guide where its own key insight is worded ambiguously. | „…der Teil, der nur einmal läuft". |
| 18 | `goethe-a2.js` § `aufbau`, Sprechen p | MINOR | „dann erzählst du **der Prüferin oder dem Prüfer** etwas aus deinem Alltag" | Sprechen Teil 2 is addressed to the group/partner as much as to the examiner; the sources describe it as „über sich und sein Leben erzählen", not as a report to the examiner. | „…dann erzählst du etwas aus deinem Alltag". |
| 19 | `writingTasks.goethe-a2.js`, Leitpunkte | MINOR | „Sag Danke für die Einladung"; „Nenn deinen Grund" (×2); „Nenn deinen Termin am Montag"; „Frag nach einer Uhrzeit"; „Schreib deinen Namen und dein Niveau" | The reflexive-avoidance is correct and I endorse it, but the results read as instructions to a child rather than as Goethe Leitpunkte, which are noun phrases (Dank für die Einladung / Grund / Terminvorschlag). „deinen Grund" also presupposes a reason the prompt never gave; „nach einer Uhrzeit fragen" is not idiomatic. | Nominalise: „Dank für die Einladung", „Grund", „Vorschlag für einen neuen Termin", „Frag nach der Uhrzeit". Same constraint, native register. |
| 20 | `writingTasks.goethe-a2.js` → `email-termin-beim-amt` | MINOR | `register: 'halbformell'` | A letter to an Amt is *formell* in the house bank (`goethe_a1` uses `'formell'` for both the VHS and the Vermieter letters). The brief mandates halbformell for Teil 2, so this is brief-compliant — but the SPA prints the register to the learner, and the two banks will now disagree about the same situation. | Keep halbformell (the exam's own label) and swap the scenario to a non-Amt one (Kursanmeldung / Rückfrage bei der Sprachschule), or note the divergence for the D2 author. |
| 21 | `hub-copy.js` `description` | MINOR | „— Einstufungstest **gratis**." | All five shipped hub descriptions end „Einstufungstest kostenlos." — this is the one house line that is repeated verbatim across the set. | „…Einstufungstest kostenlos." |
| 22 | `hub-copy.js` `intro` + `focus` | MINOR | „Der schriftliche Teil und das Sprechen zählen getrennt, und wer eine der beiden verfehlt, hat die ganze Prüfung nicht bestanden."; „das Sprechen ist eine Paarprüfung" | The file's own header says HUB_COPY carries positioning only, "no minutes, no points, no pass mark: repeating an exam fact here would create a second place it can go stale". These restate the pass mechanism and the exam format in words rather than figures — the same staleness risk, one loophole down. | Either accept explicitly (and say so in the header comment) or reduce to positioning: „Zwei getrennte Hürden statt einer — hier ist der Weg dorthin." |

## Rulings on the author's open questions

- **notes.md §5 (guide/hub German is NOT under the A2.1 constraint): UPHELD.** The level file
  binds learner-facing course German. `/leitfaden/goethe-a2/` is a public SEO page for an adult
  deciding whether to book an exam, its sibling `start-deutsch-1.js` is full native prose, and a
  guide written under A2.1 production rules would read as damaged German and would not match any
  sibling. The author drew the line in the right place — and correctly kept
  `writingTasks.goethe-a2.js` fully inside it, which is the half that matters.
- **Doubt #1 (`datePublished: '2026-09-06'` in the future): RESOLVED.** Today is 2026-09-06;
  I re-ran the repo's date logic and it passes. No action.
- **Doubt #2 (`/level/a2.1`): CONFIRMED as stated** — see finding 7. The author's diagnosis and
  fix are exactly right; I reproduced the failure from the repo test's own code.
- **Doubt #3 (per-Teil task types, „Teil 2 nur einmal"): CLOSED.** Confirmed from two channels,
  and the shipped A1 guide states the identical rule for Start Deutsch 1. Keep it.
- **Doubt #4 (Schreiben Teil 1 : Teil 2 split): NOT CLOSABLE — see BLOCKING-5.** Omit it.
- **Doubt #5 (`Volkshochschule`, `Niveau` vs. the A2 Wortliste): ACCEPTED.** Both already ship
  in the `goethe_a1` bank; house-safe is the right standard when the list itself is unopenable.
- **Doubt #6/#7 (`hasMock: false`, no "keine Module" claim): both correct.** Not asserting an
  unsourced negative is the right call.

## What I checked and found clean (so the negative space is on the record)

Shape/registry: track literal field-for-field identical to its siblings; `key`/`slug` unique
against the live registry; `sublevels` resolve in `src/data/content.js`; `hasWriting: true` is
backed by the four tasks and `hasMock: false` by the absent `MOCK_EXAMS.goethe_a2` (both pinned
in `tests/exams.test.mjs`); `courseHref: null` is right until D2. Guide: title 36 ≤ 60,
description 155 ∈ [50,160], both unique against all seven shipped guides; `answer` 94 words,
markup-free, and every figure in it recurs in a section (I re-ran that check); 7 sections with
the brief's exact ids; `aufbau` head is exactly `Teil | Dauer | Aufgaben | Punkte` with 4 rows;
9 FAQ ≥ 6; ~14 min ≥ 5; all three product counts interpolated from `../marketing.js`
(`GRAMMAR_TOPIC_COUNT` 72, `LISTENING_EXERCISE_COUNT` 48, `READING_LESSON_COUNT` 70), none typed.
Claims: no fee anywhere (the repo FEE regex is clean), no `du bestehst`, no outcome promise, no
official-material/affiliation claim in either file `tests/exams.test.mjs` scans, no invented
learner/usage statistic, no English inside a German field. Links: all five resolve —
`/level/a2.1` → `netlify.toml` `/level/*` rewrite (no slash, correct), `/grammar/a2.1/` and
`/vergleich/` are real Astro pages (slash, correct), `/level-test/` is prerendered (slash,
correct). Writing tasks: 4 tasks, keys unique globally and against the shipped bank,
2 × `sms-` informell 20/40 and 2 × `email-` halbformell 30/60, three Leitpunkte each, the
exam's own bands stated in the task text, `register` values all in the set the SPA renders.
Level constraint on the tasks: I re-derived it by hand rather than trusting the script — no
reflexive verb, no full-verb Präteritum, no Futur, no Konjunktiv, no Komparativ, no Genitiv,
no relative clause, no `zu`-infinitive, no Nebensatz, no adjective ending after null article;
adjective endings used (`einen neuen Termin`, `einen neuen Tag`) are correct A2.1 topic-9 forms;
dative verb `passen` and dative plural `den Terminen` are correct; every sentence ≤ 14 words.
ESLint is not a risk (`astro-site/**` is ignored; the task block is plain strings).

VERDICT: FAIL (6 blocking + 1 confirmed integration blocker, 15 minor)

The artefact is well-built — shape, registry wiring, link discipline, the level constraint on
the tasks and the fee/outcome bans are all clean, and the integration checklist is accurate
down to the `check-built-html` MANIFEST lines. What fails it is fact discipline in exactly the
places the brief said to be careful: two Goethe facts are restated more strongly than the source
supports (Messpunkte→"Antworten"; a *recommended* age turned into an eligibility bar), one
claim the author knew was unsourced was shipped anyway in four copies ("Teil 1 und Teil 2 zählen
gleich viel"), and one legal/administrative aside about Studium is simply wrong. Plus one
ungrammatical string and one Leitpunkt that models the wrong sentence. All seven are
delete-or-reword fixes touching maybe fifteen lines; none require re-research except finding 4.
