# Notes — A2.1 reading rewrites + exam-format lessons (Wave 4, PR C1)

Files in `S/wave4/reading/`: `rewrites-a2.1.json` (8 rows, keyed by live id),
`exam-format-a2.1.json` (2 new rows), `verify.mjs` (the gate), `build.py` (the generator
that emits both JSON files — `word_count` is computed there, never typed), `tmp-out.sql`
(proof that `scripts/reading-from-json.mjs` accepts the pair: exit 0, 8 UPDATEs + 2 INSERTs).
Repo untouched (`git status` clean).

## Word counts and check mixes

| # | lesson | live w | new w | ert | rf pattern (r=richtig) | choice key |
|---|---|---|---|---|---|---|
| 1 | Meine Reise nach Wien | 303 | **133** | 2 | r f f r r (2 falsch) | b |
| 2 | Beim Arzt | 292 | **133** | 2 | f r r r f (2 falsch) | c |
| 3 | Mein Beruf als Softwareentwickler | 305 | **130** | 2 | r r f f r (2 falsch) | a |
| 4 | Unterwegs in der Stadt | 327 | **142** | 3 | f f r r f (3 falsch) | c |
| 5 | Ein Abend im Restaurant | 311 | **132** | 2 | r f r r f (2 falsch) | b |
| 6 | Ein Umzug nach Hamburg | 233 | **144** | 3 | f r f f r (3 falsch) | a |
| 7 | Der Sportverein | 237 | **143** | 3 | r r f r f (2 falsch) | c |
| 8 | Ein Besuch auf dem Wochenmarkt | 226 | **132** | 2 | f f r f r (3 falsch) | b |
| 9 | Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung) | — | **140** | 3 | — (5 × choice) | a, b, c, a, c |
| 10 | Lesen Teil 3: Eine E-Mail (wie in der Prüfung) | — | **131** | 2 | — | b, c, a, b, a |

All eight rf patterns are distinct, none alternates (`rfrfr`/`frfrf` are rejected by
verify.mjs), every text has 2–3 falsch, and the eight rewrite choice keys run b c a c b a c b —
`options[0]` is the key in 2 of 8, not 8 of 8 (the Wave 3 regression). Lesson 10's five keys are
b c a b a. Every falsch item is a **substitution** (day, number, place, means of payment), never
a bare negation of a sentence, and every `explanation_de` quotes the text verbatim —
verify.mjs re-checks that the quote is a literal substring of `content_de`.

Word counts are whitespace-split counts of the whole `content_de`, which for lessons 9/10
includes the instruction line and (9) the headline / (10) the Von/An/Betreff block. Read as the
*text alone* the article in 9 is 120 words and the e-mail body in 10 is 111 — inside the
brief's "~120–140" and "~110–130" either way. That double reading is pinned in verify.mjs's
ranges (9: 120–145, 10: 110–132).

**Ruling applied 2026-09-06 (coordinator, on doubt #1 below): lesson 9 is now 5 × `choice`,
not 5 × rf.** Its instruction line reads "Lies den Text. Wähle die richtige Antwort: a, b oder
c."; the title is unchanged and verbatim. Statements carry the three answers inline in lesson
10's style, keys run **a b c a c**, and every distractor is a plausible item the text itself
mentions but which answers the question wrongly (Samstag/Sonntag are the festival's *other*
days; Rathaus and Zentrum are the *other* places named; achtzehn comes from "18 Uhr"; "Musik
machen"/"Essen kaufen" are what the *adults* do; dreizehn/zwanzig are near-misses on "seit
dreißig Jahren"). Open question 2 was rewritten (it would have repeated check 2 verbatim) and
the text grew by the two extra words of the new instruction line: 137 → 139.

## Goethe-Zertifikat A2 Lesen — what I actually found (goethe.de is egress-blocked)

`bfu.goethe.de`, `goethe.szczecin.pl`, `klett-sprachen.de` and `germanmaltesecircle.org` all
return EGRESS_BLOCKED, so this is from search-result summaries, not from a fetched Modellsatz:

- **Teil 1** — one newspaper text (~200 W), items 1–5, **a/b/c multiple choice**.
  <https://www.goethe.de/de/spr/prf/ueb/pa2.html>, <https://bfu.goethe.de/a2_mod_2MX5/lesen.php>
- **Teil 2** — an information board / programme (the Modellsatz uses airport hall signs),
  items 6–10, a/b/c. <https://deutsch-exam.com/en/blog/goethe-a2-format-method/>
- **Teil 3** — **Korrespondenz (an e-mail), items 11–15, a/b/c** (Mehrfachauswahl, 3-gliedrig).
  <https://www.thelanguageoffice.com/exam-pattern-of-goethe-institut-a2/>
- **Teil 4** — 5 situations matched to Anzeigen. Whole module 30 min, 20 items.
  <https://howtogetfluent.com/goethe-institut-german-a2-exam-explained/>

**Doubt #1 — RESOLVED.** The brief specified lesson 9 as 5 × Richtig/Falsch, but the real
Goethe A2 Teil 1 is **a/b/c** (richtig/falsch at Teil 1 is the A1 / Start-Deutsch-1 shape). The
coordinator ruled on 2026-09-06 in favour of exam fidelity: lesson 9 is now 5 × `choice` with
`options ["a","b","c"]`, the same shape as lesson 10, with the instruction line changed to
"Lies den Text. Wähle die richtige Antwort: a, b oder c." and the title kept verbatim. Both
exam lessons now match the real module: 9 = Teil 1 (Zeitungstext, 5 × a/b/c), 10 = Teil 3
(E-Mail, 5 × a/b/c).

**Doubt #2.** The brief describes Teil 2 as "table/programme + 5 MC"; the current Modellsatz
uses an airport information board. Not built this wave, recorded for whoever writes Teil 2/4.

## Level compliance — how each text rehearses A2.1

Every text is Perfekt-driven (or, for 4 and 8, deliberately present-tense habitual narration,
matching the live source's register). Coverage of the four **new** topics 9–12, used on purpose:

- **adjective-endings-intro** — 10/10 texts carry attributive adjectives, all after a der-/ein-word
  (`einem kleinen Hotel`, `Der große Garten`, `ein kurzes Meeting`, `eine helle Wohnung`,
  `einen guten Tipp`, `das große Stadtfest`, `einen kleinen Test`, `mein altes Fahrrad`,
  `einem besonderen Abendessen`). Null-article strong declension appears **nowhere**;
  verify.mjs enforces it mechanically (adjective list × determiner set).
- **pronouns-accusative-dative** — `hat mir gefallen`, `hat mich untersucht`, `hat uns … gebracht`,
  `hat ihr einen Tipp gegeben`, `für mich`, `Rufen Sie mich an`, plus Dativ-vor-Akkusativ in
  `dem Kellner zehn Euro Trinkgeld gegeben` / `seiner Tochter eine Brezel` /
  `der Familie einen Kuchen geschenkt`.
- **modal-verbs-past** — konnte (1, 2, 7), musste (2, 4), wollte/wollten (5, 6), alongside
  war/hatte. Texts 8, 9 and 10 have none on purpose: 8 is present-tense, 9 is a notice about a
  future weekend, 10 is a course e-mail about October.
- **temporal-prepositions** — `Letzten Monat`, `Nach zwei Tagen`, `Vor einem Jahr`, `seit fünf
  Jahren`, `seit dreißig Jahren`, `Bis Freitag`, `bis zum 30. September`, `von halb eins bis halb
  zwei`, `von 19 bis 21 Uhr`, `Am ersten/zweiten Tag`, `gegen`-free (not needed).
- Also rehearsed: Wechselpräpositionen in both cases (`im Wartezimmer` vs `ins Sprechzimmer`,
  `in der Stadt` vs `in die Stadt`, `Auf den Tischen`, `unter der Erde`), dative prepositions +
  contractions (zum, zur, beim, vom), separable-verb Perfekt (eingepackt, aufgepasst, eingeräumt,
  aufgehängt, ausgefüllt, angekommen, losgefahren), Imperativ (du in `Geh zu einem Sportverein!`,
  Sie in `Bitte bringen Sie …`, `Rufen Sie mich an`).

Banned items: **zero** relative clauses, **zero** Präteritum of a full verb, **zero** Genitiv,
**zero** reflexives, **zero** Futur/Passiv/Konjunktiv II, **zero** Superlative. `weil/dass/wenn`
appears once in the whole deliverable (lesson 1, `weil ich gern Zug fahre`) — reading exposure
only, never in a check statement. `als` is ≤1 per text and is comparative only once
(`höher als im Supermarkt`, lesson 8). Longest sentence anywhere: 14 words.

## Deliberate exclusions and rewrites of the live content

- Every live text ran 226–327 words and was full of relative clauses, `weil/dass`, Komparativ/
  Superlativ (`am schnellsten`, `am besten`, `später als`) and reflexives (`sich anmelden`,
  `ich habe mich ins Bett gelegt`, `wir haben uns unterhalten`). All of that is gone; the topic,
  the protagonist and the story beats are kept, and all eight titles are unchanged.
- Lesson 7: the live text's `Melde dich in einem Sportverein an!` → `Geh zu einem Sportverein!`
  and `ist Mitglied geworden` → `Jetzt ist sie Mitglied` (reflexive; `werden` in any form).
- Lesson 2: `Sprechstundenhilfe` / `Versicherungskarte` / `aufgerufen` → `Anmeldung` /
  `meine Karte` / `konnte ich ins Sprechzimmer gehen` (off the A2 Wortliste).
- Lesson 4: `am häufigsten` → `Meistens`, `am schnellsten` dropped (Superlativ).
- Lesson 1: `mag` avoided — `mögen` is not on the level file's A1 modal list; `gern` + present
  instead.
- Lesson 9: `basteln` → `malen`; lesson 10: `Teilnehmer` → `Personen`, `Sekretariat` →
  `in der Schule` ("when in doubt, choose the more basic word").
- Lesson 5 is 132 w against a 311-w original: the wine/dessert/bill sequence is kept, the
  atmosphere paragraph and the closing recommendation are cut.

## Interpretive calls (carried over from the Wave 3 review, re-applied)

1. `letzte Woche / letzten Monat / letzten Samstag` — fixed A1 time adverbials, not attributive
   adjectives; verify.mjs excludes `letzt-` from the adjective scan.
2. `viele / jeden / alle / beide / andere` + noun — determiners/quantifiers, accepted.
3. `denn` is coordinating (V2), not a Nebensatz — used freely; `weil` is not.
4. Letter formulas keep their endings (`Sehr geehrte Damen und Herren`, `Mit freundlichen
   Grüßen`) as frozen chunks; verify.mjs strips them before the adjective check.
5. `ein Wiener Schnitzel` — `Wiener` is an invariable city adjective, not a declined one.
6. Register split in lessons 9/10 is intentional: the **instruction line** addresses the learner
   with `du` (as the brief dictates), the **text inside** uses `Sie` because a town notice and a
   Kursleiterin address adults formally.

## Remaining doubts for the reviewer

- Doubt #1 (rf vs a/b/c in "Lesen Teil 1") is resolved — see the ruling above. Nothing else in
  the deliverable is blocking-shaped.
- Neither exam lesson now exercises Richtig/Falsch, which is the format the eight course
  rewrites drill (5 rf + 1 choice each). That is correct for the Goethe A2 exam and the split is
  deliberate: rf is the *course* check, a/b/c is the *exam* check.
- Proper nouns / internationalisms kept from the live texts and probably off the A2 Wortliste:
  `Melange`, `Sachertorte`, `Ringstraße`, `Bruschetta`, `Tiramisu`, `Softwareentwickler`,
  `Informatik`, `Code`, `Meeting`, `Volleyballverein`, `Probetraining`, `Eimsbüttel`, `Münster`
  (= the Freiburg cathedral, as in the live text — could be misread as the city).
- `key_vocabulary` plural markers follow the live A2.1 rows' convention (`der Umzug, ¨-e`), not
  the brief's `-¨e` spelling. One convention or the other, but it should match the live data.
- The e-mail in lesson 10 opens `Sehr geehrte Damen und Herren` to a course distribution list;
  a named `Sehr geehrte Frau …` would be more natural but would fix the learner's gender.
- `Die Person hat dreißig Minuten gewartet.` (lesson 2, richtig) is an inference from
  "Nach dreißig Minuten konnte ich ins Sprechzimmer gehen." — decidable, but it is the one item
  in the set that is not a direct lift.

## Round 2 changes (review-1.md: FAIL, 1 blocking + 13 minor — all addressed)

- **F1 (blocking), exam 9 check 2** — distractor `c) im Zentrum` was true in the text's own
  world (the notice bans driving `ins Zentrum` *because* the festival is there, and a Marktplatz
  is in the Zentrum). Now `c) am Bahnhof`, a place the text never names. Key unchanged (b).
- **F2, exam 9** — `Die Konzerte am Abend sind kostenlos.` is literally false for the Saturday
  concert, and distractor `b) nichts` was exactly that un-repaired reading. Now
  `Fast alle Konzerte am Abend sind kostenlos.` (139 → 140 w).
- **F3, lesson 4** — the live text's hedge is restored: `Mein Monatsticket kostet etwa 86 Euro.`
  and the keyed item now asks `Was kostet das Monatsticket ungefähr?`, so an exact fare is
  neither claimed nor keyed on.
- **F4, lesson 3** — `Um achtzehn Uhr` → `Um 18 Uhr` (24-hour times are digits), in the text and
  in the open answer that quotes it.
- **F5, lesson 1** — `durch die Ringstraße gelaufen` → `die Ringstraße entlanggegangen`; the
  English already said "along", i.e. the translation had been silently correcting the German.
- **F6, lesson 6** — the live sentence `Der Umzug hat viel Arbeit gemacht.` is back, so the
  headword `der Umzug` occurs as a free form and not only inside `Umzugstag`.
- **F8, lessons 1–5** — every `answer_en` that said "she"/"her" now says "the person"/"the";
  German keeps `sie` (forced by `die Person`). Lessons 6–8 name their protagonists and keep
  their pronouns. Applied as a transform in `build.py`, not by hand, so it cannot drift.
- **F9, exam 9** — `Für die Kinder ist der Platz vor dem Rathaus da.` →
  `Für die Kinder gibt es einen Platz vor dem Rathaus.`
- **F14, lesson 7** — the one non-liftable open answer: Q is now `Wo hat Lena einen Verein
  gesucht?` → `Sie hat im Internet gesucht.` (was: an object inferred from the next sentence).
- **F10/F11, verify.mjs** — `title_de` drift is now a **failure**, not an info line, and
  `title_en` is compared against the live row too; the `als` scan is case-insensitive (`Als
  Vorspeise` had been invisible to it). Both re-checked by mutation: title_de, title_en and a
  second `Als` each now exit 1.
- **F7** — the three invented specifics are signed off and listed below, not left silent.
- **F12/F13** — coordinator-owned, not author defects: the plan-day ordering is closed by the
  new "Reading exposure ruling" in `level-a2.1.md`, and the `Richtig oder falsch?` card heading
  is fixed by the integrator in `ReadingChecks.jsx`.

### Reading-exposure ruling — verified

`level-a2.1.md` (2026-09-06) allows topics 9–12 receptively on any plan day but forbids a check
or question **whose answer depends on a topic-9–12 form**. I re-solved all 58 checks asking what
carries the key, and **one item failed**: lesson 7 check 1 was `Lena wohnt seit einem Jahr in
Köln.` against a text that says `Vor einem Jahr ist sie nach Köln gezogen.` — decidable only by
converting `vor + Dat` into `seit + Dat`, i.e. a pure topic-12 contrast. Replaced with
`Lena spielt Volleyball.` (richtig, carried by `einen Volleyballverein`). Everything else is
keyed on content words or numbers: nouns (Hotel/Freunde, Fenster/Gang, Apotheke/Supermarkt,
Bahnhof/Münster, Karte/bar), numbers (zehn/fünf Jahre, acht/fünf Entwickler, zwölf/zwanzig Euro,
38,5 Grad, 86 Euro, acht Euro), weekdays and seasons (Freitag/Samstag, Sommer/Winter), and
adjective **stems**, never adjective **endings** (griechisch/italienisch, erster/dritter Stock,
Raum 12/Raum 2). Where a statement does show a topic-9–12 form, it shows the same one the
quoted text shows (`konnte` in lesson 1 check 4, `seit … Jahren` in lesson 4 check 1) — and
**verify.mjs now enforces exactly that**: a temporal preposition governing a time expression, or
a modal Präteritum, may appear in a `statement_de` only if the same form appears in that item's
quoted `explanation_de`. The locative `vor dem Rathaus` is correctly not counted (topic 3).

### Invented specifics (F7 sign-off)

Facts the rewrites state that the live text hedged or lacked, each kept because it is
level-motivated, and each now on the record: lesson 2 `Bis Freitag darf ich nicht arbeiten.`
(live: "Krankschreibung für eine Woche" — chosen for `bis` + weekday, topic 12); lesson 3
`Zweimal pro Woche darf ich von zu Hause arbeiten.` (live: "manchmal von zu Hause" — chosen for
a countable fact an rf item can key on); lesson 6 `Die Kinder wollten zuerst nicht umziehen.`
(not in the live text — chosen for modal Präteritum, and no check keys on it).

## Round 3 changes (review-2.md: PASS with minors — all applied)

- **N1, lesson 7 check 1** — `Lena spielt Volleyball.` was decidable only through a four-sentence
  chain. The live text's link is restored: `Lena hat im Internet gesucht und einen
  Volleyballverein gefunden. Der Verein ist in ihrem Stadtteil.` (140 → 143 w), and the
  explanation now quotes it, plus `Jetzt ist sie Mitglied.` as a second fragment.
- **N2, verify.mjs** — the topic-9–12 gate scanned check statements only. It now runs the same
  comparison over each open question's `question_de + answer_de` against its own `content_de`.
  Re-ran the reviewer's escaped mutation (a `vor` → `seit` conversion inside a question):
  **exit 1**, caught.
- **Also found while wiring N1/N2**, and fixed: the explanation-quotes-the-text gate ran on
  `falsch` and `choice` items only, so a **richtig** item's quote was never verified — exactly the
  class N1 landed in. It now runs on every check, and a multi-fragment quote must be literal in
  **every** fragment, not just one. Mutation-tested: a fabricated richtig quote and a fabricated
  second fragment each exit 1.
- **N3, lesson 2 question 5** — swapped rather than signed off, so the class is now empty:
  `Bis wann darf die Person nicht arbeiten?` → `Was hat die Ärztin der Person gegeben?` /
  `Sie hat ihr ein Rezept gegeben.` No open question in the deliverable carries a topic-12 form.
- **N4, lesson 6** — the editing seam (`zuerst` twice, three sentences apart):
  `Die Kinder wollten zuerst nicht umziehen.` → `Am Anfang wollten die Kinder nicht umziehen.`
  (143 → 144 w).
- **N5, lesson 1** — `entlanggegangen` is **kept** (it is the correct verb for walking a
  boulevard, and the exposure ruling permits it), and named here as what it is: `entlang-` is not
  on the level file's separable-prefix list, so this is one new receptive prefix, in one sentence,
  in one text. Swap to `Am ersten Tag bin ich zur Ringstraße gegangen.` if a reviewer wants the
  prefix list held exactly.
- **N6** — the `Richtig oder falsch?` card heading in `ReadingChecks.jsx` is the integrator's;
  both exam rows are 5 × `choice` and the repo is read-only here.

## verify.mjs

`node verify.mjs` (defaults resolve to the two JSON files and `../source/reading-a2.1.json`).
It checks: field set and no extras; ids present in the live source and unique; titles unchanged;
exam titles **byte-identical** to the two titles the plan author links, and each exam
`content_de` starting with its mandated instruction line; level/topic/difficulty/order_index and
no order_index collision with the live rows 1–8; `word_count` recomputed and compared; word
ranges; `estimated_reading_time ∈ {2,3}`; paragraph count `content_de` = `content_en`; sentence
≤14 words, with a choice statement split at its inline options so the **question** is measured
against the 14-word rule and each **option** against a 6-word cap, and with ordinals and
decimals masked so `6. Oktober` does not split; the banned-grammar battery (comma+d-word
relative-clause heuristic, a 70-lemma Präteritum list, `würde|wird|werden|geworden`, `sich`,
`des|eines`, `am …sten` minus ordinals and `am liebsten`, `obwohl|damit|während|…`, `um … zu`);
`weil/dass/wenn` ≤2 per text and 0 in any check statement; `als` ≤1 per text; attributive
adjectives require a der-/ein-word (frozen formulas stripped first); vocabulary 10–14 / 8–10 with
no duplicates; 5 / 3 questions with all four fields; check counts and types (8 rewrites: 5 rf + 1 choice; both exam
lessons: 5 choice, 0 rf); rf answers in
{richtig,falsch} with 2–3 falsch, non-alternating and a pattern unique across the file; choice
`options === ["a","b","c"]`, answer among them, all three letters present in the statement, keys
not constant; no duplicate `statement_de` anywhere, no statement equal to an open question; and
every falsch/choice explanation quoting `content_de` literally.

Round 3 added two more: the topic-9–12 comparison also covers open questions (against
`content_de`), and the quote gate covers **every** check — richtig included — with all fragments
of a `…`-joined quote required to be literal.

Round 2 added three gates: `title_de`/`title_en` drift against the live row is now a failure;
the `als` scan is case-insensitive; and the reading-exposure rule above is enforced mechanically.
Mutation-tested after the change — a changed `title_de`, a changed `title_en`, a second `als`,
and a re-injected `seit`/`vor` item each exit 1.

**Output: `OK — 8 Rewrites + 2 Prüfungslektionen, 0 Fehler.`**
`scripts/reading-from-json.mjs` re-run after every edit: exit 0, 8 UPDATEs + 2 INSERTs.
