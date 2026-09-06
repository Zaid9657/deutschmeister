# Abschlusstest A2.1 — author notes (Wave 4 PR D2a, rounds 1–4)

## Round 4 changes — review-2.md (FAIL: 1 blocking, 5 minor), all applied

1. **(blocking) The false Prüfungsteile claim is gone.** Round 3's Genitiv fix introduced "Er hat
   die gleichen Prüfungsteile wie das Goethe-Zertifikat A2." — false, since the real exam has four
   Prüfungsteile and this test trains three. Now: **"Er trainiert drei Teile vom Goethe-Zertifikat
   A2: Hören, Lesen und Schreiben."** (11 words, du-form, Genitiv-free — `Teile vom`, not `Teile
   der`; re-run against all five Genitiv regexes). Sprechen stays disclosed two sentences later.
   The harness now asserts the intro names exactly the three sections the module actually ships
   (derived from `sections[].title`, not retyped), that the withdrawn phrase cannot come back, and
   that the Sprechen disclosure is present.
2. **(minor 2) `schreiben-2` swapped again — this time after checking the bank by meaning.** The
   round-3 Sportverein enquiry reproduced live `mitteilung-info-sprachkurs` almost point for point
   (which course / when / what price, institution and person-form changed). It is now a
   **halbformelle E-Mail an die Nachbarin about a Paket**: Wann kommt das Paket? / Wo soll die
   Nachbarin es lassen? / Wann holen Sie das Paket ab? — Sie to a neighbour is the everyday German
   halbformell case, and the third Leitpunkt exercises a separable verb while the second exercises
   an accusative object pronoun. Heizung and Blumen were rejected for the same reason the
   Sportverein was: `mitteilung-vermieter-heizung-kaputt` and
   `mitteilung-nachbarn-um-hilfe-bitten` already hold them.
   **The duplication test no longer compares characters.** Both sides are stemmed to content-word
   sets (stopwords applied *after* stemming, so du/Sie imperative forms collapse together) and
   compared against every live task's Leitpunkte and scenario. Calibration matters and is
   documented in the test: round 3's collision was a *single* shared word (`preis`), so a
   "two shared words" rule would have missed it — while a naive Jaccard rule flags every
   "wann … kommt". The rule is therefore: ≥2 shared keywords, or 1 shared keyword that is
   *distinctive* in the bank (appears in ≤2 live tasks) at Jaccard ≥ 0.5. A companion test replays
   the round-3 Sportverein wording through it and asserts it (a) is verbatim-clean — the old blind
   spot — and (b) trips the new check against `mitteilung-info-sprachkurs` by name.
3. **(minor 3) Line numbers moved into the header**, where the committed artefact is:
   `ModelltestRun.jsx` **:36** defines `PLAYS_ALLOWED = 2`, **:82** is the `canPlay` guard, **:101**
   is the "Noch …× abspielbar" label — all three verified against the live file on 2026-09-06, with
   the note in-file that they will drift and the constant name is the durable anchor.
4. **(minor 4) The unsourced Goethe claim is withdrawn.** The header no longer says the real exam
   plays its long Hören parts once. It now says we play it once to keep the section inside 15
   minutes, that the argument rests on the 8:38-vs-15:00 arithmetic alone, and that the exam fact
   is *not* asserted here because goethe.de is unreachable from this sandbox and the fact is not on
   `exam-brief.md`'s list for D1 either.
5. **(minor 5) `schreiben-1`'s Leitpunkt matches its scenario**: "Warum kommst du nicht?" (round 3's
   "Warum hast du keine Zeit?" presupposed the reason the scenario leaves open). Not present in the
   sibling or the live bank — checked, and now pinned by a test in both directions.
6. **(minor 6) Pass line uses the repo's house phrasing**: "Wie in der Prüfung bestehst du ab 60 von
   100 Punkten." — the wording `writingTasks.js`'s `pointsNote` already ships.
   **One wrinkle I am not hiding:** this module is scored as a percentage (`passPercent: 60`) over
   20 items, not out of 100 points, so the sentence is a statement about the exam's rule, not about
   this test's arithmetic. It matches `exam-brief.md` §Facts (45/75 + 15/25 = 60/100) but D1 is the
   PR that verifies it; if D1's verified figure differs, this sentence changes with it.

Numbers after round 4: Lesen texts 128 / 119 words (bands 110–130, 100–120); keys `bcbac` / `abcab`;
10 objective items; 15 + 20 + 20 = 55 min; longest sentence 13 words; `node --check` clean on both
files; `node --test validate-a21.test.mjs` → **27 pass / 0 fail** (19 → 25 → 27).

---
# Abschlusstest A2.1 — author notes (Wave 4 PR D2a, rounds 1–3 (superseded above))

## Round 3 changes — review-1.md (FAIL: 4 blocking, 9 minor), all applied

Coordinator rulings first:

- **(3) No Genitiv carve-out.** The round-1 header claimed the intro and section instructions were
  administrative copy outside the level constraint. That carve-out is withdrawn and the header now
  says so. The intro was rewritten Genitiv-free: `deines A2.1-Kurses` → "von deinem A2.1-Kurs";
  `den Aufbau der Prüfung Goethe-Zertifikat A2` → "Er hat die gleichen Prüfungsteile wie das
  Goethe-Zertifikat A2. Aber er hat nur die halbe Länge."; `ab 60 Prozent der Aufgaben` → "ab 60
  Prozent von den Punkten" (which also settles minor 12 — the pass rule is a share of points, and
  D1's verified rule stays the single source). The validator's Genitiv ban went from one regex to
  five: `des|eines + capital`, the determiner set (`des|eines|deines|meines|seines|ihres|unseres|
  eures|dessen|deren`), partitive `Prozent/Hälfte/Anfang/Ende/Teil… der|des`, head-noun `Aufbau/
  Ergebnis/Länge/Preis/Name… der|des`, and `-kurses/-testes/-jahres/-tages`. A new test feeds the
  regexes all five round-1 phrasings (they must fire) and the six replacements (they must not), so
  the ban cannot rot into decoration.
- **(4) `playsAllowed: 1`** added to the listening part; exercise #4 and `minutes: 15` unchanged.
  Header dependency 3 spells out the integrator's change to
  `src/pages/Modelltest/ModelltestRun.jsx`: add
  `const playsAllowed = part.playsAllowed ?? PLAYS_ALLOWED;` at the top of `MockListeningPart` and
  point the two existing `PLAYS_ALLOWED` references (the `canPlay` guard, line ~82, and the "Noch
  …× abspielbar" label, line ~101) at it. The Hören instructions now say "Du hörst sie einmal." —
  which is also the exam-faithful reading, since Goethe A2 plays its long Hören parts once. **The
  field is inert until that line lands**, so the validator pins the CURRENT runner state
  (`part.playsAllowed` absent, `PLAYS_ALLOWED = 2` present) and fails the moment it changes, at
  which point the pin inverts and dependency 3 can be struck. A matching pin belongs in
  `tests/exams.test.mjs` beside the `selectListeningQuestions` one, for the same reason.

Blocking 1 and 2, and the nine minors:

1. **Fabricated #6 quote deleted.** The header now carries the real line, "Wir weisen darauf hin,
   dass während des Films Handys ausgeschaltet sein müssen.", plus two more verbatim #6 lines
   (Garderobe/Passiv, schossen/Präteritum). The harness now extracts **every** double-quoted run in
   the header — after stripping `//` and collapsing whitespace, so quotes wrapped across comment
   lines are caught too — and each must resolve verbatim to the listening dump, to this module's own
   strings, or to a wave brief (the briefs are read and matched, not allow-listed). 3 quotes were
   unresolved when the check first ran; all three were real brief quotes and are now verified
   against `exam-brief.md`. A dedicated test also asserts the round-1 stitched line is gone.
2. **`ein kleines Frühstück` → `ein kleines Abendessen`** in the header inventory. Every quoted
   module string in the header is now covered by the check in 1, so a stale self-quote fails.
6. **#5 miscount fixed**: "five of the ten items ask for a price … and two more for a bare number —
   seven of ten". A test recounts both figures from the dump.
7. **Distractor claim scoped**: the header now says Teil 1 uses text-anchored distractors and Teil 3
   deliberately uses unsupported ones (the Goethe A2 Teil-3 norm), matching what the harness asserts
   in each direction.
8. `schreiben-1` criterion → "Grund, Wunsch und Termin." (parallel to the sibling's bare list).
9. `l3-3` option a `Um 12 Uhr.` → `Um 19 Uhr.` — 12 was anchored only to `Raum 12`. A test now
   requires all three options of that item to be times.
10. (a) "Die Nachbarn wollten schon lange einen Treffpunkt haben." — the Präteritum modal now
    carries its Satzklammer; (b) "Der Treff gehört einem Verein." gives `der Verein` an antecedent
    before `l1-4` asks about it, and uses a taught A2.1 dative verb while doing it.
11. **Sentence splitter fixed**: ordinal+month pairs are glued before splitting, so "Seit dem 1.
    September gibt es …" is measured as one sentence. Re-measured: longest real sentence is 13 words
    ("Der Treff ist von Montag bis Freitag von 15 bis 20 Uhr geöffnet."), ceiling 14, still clean.
13. `offen` → `geöffnet` in the text and in `l1-1`'s prompt.
5. **`schreiben-2` scenario swapped** from "Termin beim Amt" (third copy of one cancellation in this
   repo, and D1's own topic per exam-brief §4) to an enquiry: "E-Mail an einen Sportverein" —
   Welchen Kurs / Wann Zeit / Preis. The test now asserts exactly one cancellation in the section,
   that the string `Amt` appears nowhere, and that no task sentence duplicates `writingTasks.js` or
   `abschlusstestA12.js`. That last check caught one more copy the review had not flagged:
   `schreiben-1`'s first Leitpunkt was verbatim the sibling's ("Warum kannst du nicht kommen?") and
   is now "Warum hast du keine Zeit?". The self-check criteria are still deliberately parallel to
   the sibling's rubric — that is shape, not content, and the test excludes them on purpose.
   **Needs a coordinator confirmation, not my assumption**: D1 should take "Termin beim Amt" and
   "Nachbarn um Hilfe bitten"; whether it also wants "Kursanmeldung" is why this file went to a
   Sportverein enquiry rather than a course enrolment.

Numbers after round 3: Lesen texts 128 / 119 words (bands 110–130 and 100–120); keys `bcbac` and
`abcab` unchanged; 10 objective items; 15 + 20 + 20 = 55 min; `node --check` clean on both files;
`node --test validate-a21.test.mjs` → **25 pass / 0 fail** (19 → 25 tests).

Accepted, unresolved risk (review finding 13, and my own round-1 doubt 6): goethe.de is blocked from
this sandbox for the reviewer as well, so `Verein`, `Teilnehmer`, `Anrede`, `Erdgeschoss` and the
transparent compounds `Nachbarschaftstreff` / `Sprachcafé` / `Computerkurs` could not be checked
against the real Goethe A2 Wortliste by either of us. Recorded as an open risk, not a silent one.

---
# Abschlusstest A2.1 — author notes (Wave 4 PR D2a, rounds 1–2 (superseded above))

## Round 2 — coordinator ruling, 2026-09-06 (applied)

> "The real Goethe A2 Lesen Teil 1 is a/b/c, not Richtig/Falsch (rf is the A1 shape)."

`lesen-1` was authored in round 1 as 5 Richtig/Falsch items — the shape abschlusstestA11/A12
use, which is Start Deutsch 1, not Goethe A2. It is now 5 three-option items: same text
(unchanged, still 126 words), same five facts, same five item ids, question + three answers.
Both Lesen parts are a/b/c; there is no Richtig/Falsch item left anywhere in the module and the
validator fails on the option keys `r`/`f` or on the words Richtig/Falsch reappearing.
Every Teil-1 distractor is a detail the text actually names but which does not answer the
question (Mittwoch/Freitag, 15 and 16 Uhr, Abendessen/Computerkurs, Gartenstraße/Erdgeschoss,
Sprachcafé/Abendessen), so elimination needs the text rather than plausibility; the validator
asserts each anchor is present in the text. Keys: `lesen-1` = **b c b a c**, `lesen-3` = a b c a b
— each part uses all three letters, no letter more than twice, no two adjacent items sharing a
letter, the two keys are different strings and no letter is more than 4/10 of the section.
The Lesen section instructions changed with it ("Wähle bei jeder Frage die richtige Antwort:
a, b oder c."). Nothing else moved: 10 objective Lesen items, 55 minutes, 10 Hören : 10 Lesen.
The round-1 "r/f mix" section below is superseded; everything else in it still holds.

Files: `S/wave4/test/abschlusstestA21.js`, `S/wave4/test/validate-a21.test.mjs`, this file.
`node --check` clean on both .js/.mjs modules; `node --test validate-a21.test.mjs` → 19/19 pass (re-run clean after the round-2 conversion).
The repo was read only-read; nothing under /home/user/deutschmeister was touched.

## Coverage

| Section | Minutes | Parts | Scored items |
|---|---|---|---|
| Hören | 15 | 1 listening (A2.1 #4, questionMax 10) | 10 (runtime, from the DB) |
| Lesen | 20 | `lesen-1` mc-group (Teil-1 style), `lesen-3` mc-group (Teil-3 style) | 5 a/b/c + 5 a/b/c = 10 |
| Schreiben | 20 | `schreiben-1` SMS, `schreiben-2` halbformelle E-Mail | 0 (self-check) |

55 min total; weighting 10 Hören : 10 Lesen. Answer keys after the round-2 ruling: `lesen-1`
= `bcbac`, `lesen-3` = `abcab` (superseding round 1's r/f key `rfrfr` = 3 richtig / 2 falsch). Text lengths: Teil 1 = 126 words (brief:
110–130); Teil 3 = 119 words counting the Von/An/Betreff lines, 106 without (brief: 100–120 —
in range on either reading). Every Lesen item was re-solved cold from its own text after each
edit; the validator pins the supporting sentence for each key and the absence of support for
each distractor (`Sonntag`, `zehn Euro`, `teuer|laut`, `18 Euro`, `Adresse` never appear).

## Listening choice

A2.1 #4 "Termine und Verabredungen", live id `fbd6e61e-b9a8-4a6d-bdff-ad3366b95a50`, 10 dialogues,
10 questions, 518 s, plays_allowed 2. Reasoning and verbatim quotes are in the module header; the
validator re-reads `S/wave4/source/listening-a2.1.json` and fails if any quoted transcript line or
item text is not actually in that exercise, if the id and exercise_number disagree, or if the
518 s figure drifts. No mock or course test in the repo uses an A2.1 exercise (checked by grepping
`level: 'A2.1'` across all seven modules — the only A2 part anywhere is dtz.js's A2.2 #1), so
nothing is pre-answered. The four rejections are on checkable defects in the scored items, not
taste: #1 has three Genitiv items, #2 has a Präteritum item ("Der Gast fand die Bedienung
langsam."), #3/#5 are price-catching drills, #6's transcripts are B1+ Passiv/Präteritum/Genitiv.

## Deliberate exclusions / decisions the reviewer should check

1. **`courseLevel`, not `level`, on the module.** The brief lists "level: 'a2.1'"; the shipped
   template (`src/data/courseTests/abschlusstestA12.js`) calls that field `courseLevel` on the
   module and `level` on the COURSE_TESTS registry row. I followed the template rather than adding
   a second level field. Say the word and I will add `level` as well.
2. **`exerciseId` is provenance only.** The brief says "exerciseId = chosen exercise, use its live
   id", but `MockListeningPart` resolves both the audio and the questions by `part.level` +
   `part.exerciseNumber` (`useExerciseDetails(part.level, String(part.exerciseNumber))`,
   `getAudioUrl(...)`), and `tests/exams.test.mjs` *requires* an integer `exerciseNumber` in 1–6.
   An id-only part would render nothing and fail the suite. The part therefore carries level +
   exerciseNumber (functional) **and** exerciseId (documented as provenance, pinned by the
   validator against the source dump).
3. **`questionMax: 10` is a no-op today** — the exercise has exactly 10 questions. It is there
   because the A1 exercises also had 10 until Wave 2/3 expanded them to 23, which is the defect
   the field exists to prevent; the validator proves the cap bites against a synthetic 23-question
   list. `tests/exams.test.mjs` requires the field regardless.
4. **Vocabulary swaps for Wortliste safety**: Sekretariat → Büro, Volkshochschule → Sprachschule,
   Bürgeramt → Amt. Compounds kept because both halves are A1/A2 and the compound is transparent:
   Nachbarschaftstreff, Sprachcafé, Computerkurs, Deutschkurs. `Selbstcheck`,
   `Speaking-Missions-Trainer` and `Richtwert` are administrative copy carried over from the A1.2
   sibling's precedent, not exam content.
5. **`am besten` deliberately avoided** everywhere (Superlativ); "Rufen Sie sie bitte gegen 16 Uhr
   an" replaced an earlier "am besten" phrasing, and 16 Uhr rather than 10 Uhr so the call time
   sits inside the opening hours the same text states.
6. **Internal-consistency fix worth knowing about**: the family meal was moved from Samstag to
   Freitag and from Frühstück to Abendessen. With a Saturday breakfast, item l1-2 ("Der Treff ist
   auch am Sonntag offen." → falsch, from "von Montag bis Freitag") sat next to a text that
   implied Saturday opening. It no longer does.

## Doubts for the reviewer

1. **Timing vs. the two-play promise (the one I would fix next).** The audio is 8 min 38 s and
   `ModelltestRun.jsx`'s timer is a hard cutoff (`remaining === 0` → `nextSection()`), so two full
   plays (17 min 16 s) do not fit `minutes: 15`, which the brief fixes. The runner's own chrome
   still says "Noch 2× abspielbar (wie in der Prüfung begrenzt)". My Hören instructions state the
   audio length and tell the learner to answer while listening; they never promise two complete
   plays. Someone still has to choose: raise the Hören minutes (breaking the 55-minute total the
   brief also fixes), pick a shorter exercise at a real cost in level fit (#6 is 309 s but B1+),
   or make `PLAYS_ALLOWED` part-configurable. Not mine to decide.
2. **Two blemishes in the reused audio's items**, both recognition-only and neither exercised in
   my strings: item 4 "Wo treffen sich die Freunde?" (reciprocal *sich treffen*, banned in
   production at A2.1) and item 10 "Worum geht es beim Elternabend?" (pronominal adverb). Same
   position the A1.2 sibling took: the grammar claim covers authored strings, not reused course
   audio. If the reviewer wants zero reflexives anywhere in a learner's sitting, the exercise has
   to change and the level fit gets worse.
3. **`formatOf: 'goethe_a2'` does not resolve yet.** PR D1 adds the EXAM_TRACKS entry. Registering
   this module in COURSE_TESTS *before* D1 merges breaks `tests/exams.test.mjs` ("formatOf is not a
   real EXAM_TRACKS key"). The validator asserts the current EXAM_TRACKS key set explicitly so the
   dependency shows up as a failure the moment that set changes.
4. **Migration is an integrator task.** `exam_attempts_exam_key_check` must be re-created with the
   FULL key list including `a2_1_abschluss` *and* the new `goethe_a2`, in a new
   `migrations/*abschlusstest*.sql`; the guard suite reads only the newest such file.
5. **The 14-word ceiling was applied to every German string**, including the intro and the section
   instructions, which the A1.2 sibling explicitly exempted as administrative copy. That is
   stricter than the precedent, not looser — flagging it only so a reviewer does not read the
   exemption paragraph in my header as a licence I actually used.
6. **`all-words-index.json` is not a Wortliste.** I ran the content against the union of the
   a1.1/a1.2/a2.1 entries and got 168 "unknown" tokens, almost all function words ("und", "aber",
   "alle"), so the index is a per-level teaching list, not a coverage gate. The vocabulary
   judgements above are mine against the Goethe A2 Wortliste from knowledge, and goethe.de is
   blocked from this sandbox — an independent check of Verein, Treffpunkt, Ausflug, Anrede and
   Erdgeschoss would be worth a reviewer's minute.
