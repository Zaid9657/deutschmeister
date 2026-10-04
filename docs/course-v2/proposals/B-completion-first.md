# Proposal B — Completion-first: a course program built to be finished

**Date:** 2026-09-27 · **Program:** course-v2, all eight half-levels A1.1–B2.2 · **Status:** one of several
competing blueprint proposals. It is written from one angle on purpose: **self-paced courses fail mainly through
dropout, so every design choice here is judged first by whether it helps a learner reach the last Lektion and the
exam, and only then by coverage.** It still has to lead to the exam, and §2–§4 show that it does.

**Inputs read in full:** `DECISIONS.md`; `inputs/db-snapshot-2026-09-27.md`; research memos 01–14 in
`docs/course-v2/research/` (memo 14, the Lehrwerk teardown, is a required input and is cited per Lektion in §2).
Repo files read to check what can be reused: `src/lib/review/ladder.js`, `src/lib/course/plan.js`,
`src/lib/course/milestones.js`, `netlify/functions/course-reminder.mjs`, `netlify/functions/evaluate-writing.mjs`,
`src/data/pricing.js`. The old A1.1 course and `docs/course-standard-2026-09-12.md` were not used as a template.

**Citation convention.** `[m09 §2]` = research memo 09, section 2. External facts carry a key such as `[S1]`, which
resolves to a URL in §13 *Sources*. Facts I could not open myself are marked **(snippet)** or **(unverified)**.
Every minute, count and target that is my own design choice is labelled **(design)**. None of them has been measured,
and none may appear in public copy until it has been measured.

---

## 0. The argument in one page

1. **Dropout is the default outcome of self-paced learning, and it happens early.**
   - Across MIT/Harvard edX courses in 2017–18, **3.13 %** of all participants completed, against **46 %** of paying
     "verified" learners [S1].
   - In 221 MOOCs the median completion rate was 12.6 %. "The first and second weeks appear to be critical in
     achieving student engagement". **Longer courses had lower completion rates**, and courses graded only
     automatically had higher ones [S2].
   - Our own funnel shows the same shape before any course exists: 1,656 users, 2 course sales ever (both €0 orders),
     and 10 AI speaking uses and **0** AI writing uses in 7 days (`weekly_metrics` 2026-09-21, via the db-snapshot).
2. **Completion is also the revenue engine.** Every half-level ends where the next one is sold. A learner who stops in
   Lektion 3 of the free A1.1 never meets A1.2 (€40), and the per-learner ladder of €40 → €100 → €120 [m10 §7]
   only exists for people who finish rungs. The spouse-visa candidate, our lead segment, has a dated exam and a
   non-modular retake that costs the full fee again [m01 §1; m10 §2.1].
3. **A course sold on exam readiness must be finishable in the time before the exam.** So the required path of each
   half-level is **sized to be finished** (12 Lektionen, ≈ 28–39 h planned, see §2.1). Depth that would make the
   required path longer is offered as clearly optional extra practice, and the plan recommends it only when the
   learner's exam date leaves room.
4. **The unit of use is a 15–20-minute Lernschritt, not a Lektion.** A day counts as a learning day after one
   Lernschritt or the 5-minute daily review. Nothing in the course is longer than 25 minutes without a save point.
5. **The habit system is forgiving by construction:** a weekly goal chosen by the learner, automatic free pause
   days, earn-back, no reset to zero, one reminder a day at most, a Monday fresh start after a gap. Every piece is
   there because the evidence says it keeps people going [S4][S5][S6][S10][S11].
6. **Scores never block progress.** The legal memo requires this for AI scores [m13 impl. 4]; completion-first
   extends it to every gate. Completing a task means submitting it, never passing it. "Ich kann das schon" lets a
   learner test out of what they know, and that credit is shown honestly as progress.
7. **Measure before scaling.** Etappe 1 of A1.1 (3 Lektionen) ships first to real free users. Minutes per
   Lernschritt, week-1 learning days and item-level abandonment are measured on real Android phones. Only then is
   the anatomy locked and authoring scaled to 96 Lektionen (§10).

---

## 1. Product and positioning

### 1.1 Who

| Priority | Segment | Why | Evidence |
|---|---|---|---|
| **Lead** | Spouse-visa A1 candidates, reached first through India's English-language search | Hardest, dated deadline; 35,720 Goethe spouse SD1 exams in 2024 with 62 % passing, i.e. ≈13,400 failed attempts; ~90 % prepare externally; the free A1.1 sits directly before the paid A1.2 that completes the exam | Drs. 21/175 [S30]; "goethe a1 exam" 27,100/mo in India (db-snapshot) |
| **Revenue core** | B1 "zum Bleiben" (Einbürgerung, Niederlassung) and the ≈143,500 DTZ takers per year who did not reach B1 | Largest German demand ("b1 prüfung" 12,100/mo); 332,500 naturalisations in 2025 | [m02 §5]; [m10 §2.2]; Drs. 21/5716 [S31]; Destatis [S32] |
| Second | A2 → B1 bridge for work entry, English-track students, Chancenkarte | India #1 in students and Chancenkarte; 58 % of English-track students start at A1/A2 | [m10 §2.4–2.5] |
| Channel, not lead | B2 for care and health professions | Legally forced but often subsidised to €0 (Triple Win) | [m10 §2.3] |

Completion-first adds one observation to the segment table: **the lead segment is also the one most likely to drop
out without a structure.** Spouses rated preparing abroad a "starke oder sehr starke Belastung", worst for those with
no course available (BAMF study cited in Drs. 21/175 [S30], via [m10 §4]). A plan with a date on it is the product.

### 1.2 What we sell, per half-level

Every one of the eight courses is the same product shape at a different level (DECISIONS 2026-09-26: one course and
one product per half-level):

| Component | A1.1 (free) | Every paid half-level |
|---|---|---|
| **12 Lektionen** in 4 Etappen of 3, one situation each, with a published Inhaltsverzeichnis | ✓ | ✓ |
| **Lernschritte** of 15–20 min (design): 6 per Lektion at A, 7 at B (4 in the .2 exam Lektionen 10–12) | 72 | 66–84 |
| **KI-ausgewertete Aufgaben** in exam format (speaking and writing), shown as a counter "17 von 44" | 44 | ≥ 44 (§3.4) |
| **Tägliche Wiederholung** (5 min, spaced review) with a word counter against the official list size | ✓ | ✓ |
| **4 Etappen-Checks** (A1.1 and every .1) or **3 Etappen-Checks + 3 Übungsprüfungen** (every .2) | ✓ | ✓ |
| **A plan to the learner's exam date**, reminders at the chosen time, a Monday Wochenbericht | ✓ | ✓ |
| **Teilnahmebescheinigung** on completion, no scores | ✓ | ✓ |
| One-time price, no renewal, no credits, **no expiry** | €0 | €40 / 50 / 50 / 60 / 60 / 65 / 65 (`src/data/pricing.js`) |

The last row is itself a completion feature. Goethe DTO sells 3-month access and Lingoda's credits become
inaccessible after the last payment cycle [m08 §2.4–2.5]. Access that expires turns a busy month into a lost
purchase. Ours never does, so a learner who stops can always come back.

### 1.3 Why it beats the competitors in the memos

The competitor teardown found that **teachers and graders are separate products** [m08 §4]. Completion-first finds
a second split: **the products that are good at keeping people coming back do not lead to an exam, and the products
that lead to an exam are not built to be finished.**

| Competitor | What keeps people going | What it lacks for our buyer | Source |
|---|---|---|---|
| Duolingo | streaks, one lesson a day, 600+ streak experiments | no exam tasks, no writing assessment, Trustpilot 1.6 | [m08 §2.3] |
| Babbel | clear structure at A1 (90+ lessons) | ~15 lessons at B1, no exam scoring, auto-renewal complaints | [m08 §2.1] |
| vhs-Lernportal | free, BAMF-recognised, tutors | 12 × 15 Lerneinheiten per level with >900 exercises, no exam scoring, no speech grading | [m08 §2.7] |
| Goethe DTO / DOI | the brand; DOI has ~30 human-marked tasks per half-level | DTO: 3-month access window; DOI: €729 per level | [m08 §2.5] |
| Lingoda | live classes, 50 per sub-level | credits expire; €254–600 per sub-level (derived) | [m08 §2.4] |
| AI mock apps | exam-exact scoring at €7–25 | barely teach; outcome-drifting marketing | [m08 §2.11] |

Our position: **a course sized to be finished, with a plan to the exam date, and every spoken and written exam task
scored instantly as an automated tool.** No competitor in memo 08 combines a finishable path, a dated plan and
exam-criteria scoring. Gap 7 in memo 08 ("a dated plan to the exam date, with the hours stated") is unowned [m08 §5].

**Positioning lines (drafts; all subject to the copy lint in §9):**

- EN (India, A1): *"Exam preparation for the Goethe-Zertifikat A1: Start Deutsch 1 — 12 lessons in 20-minute steps,
  a study plan to your exam date, and every speaking and writing task scored instantly by AI (automated, not a
  teacher)."*
- DE (B1): *„Vorbereitung auf telc Deutsch B1, DTZ und das Goethe-/ÖSD-Zertifikat B1 — 12 Lektionen in
  20-Minuten-Schritten, ein Plan bis zu Ihrem Prüfungstermin, jede Schreib- und Sprechaufgabe sofort automatisch
  ausgewertet."*

We never write "the course you will finish", "in 12 Wochen zu B1" or any other result claim (§ 5 Abs. 2 Nr. 1 UWG,
[m13 §5]). We describe the design: 12 Lektionen, 20-minute steps, a plan.

---

## 2. Course architecture for all eight half-levels

### 2.1 The same frame everywhere

| Element | Rule | Why |
|---|---|---|
| **12 Lektionen per half-level** | Fixed. The 2 extra situations per level in memos 04/05 become optional *Fokus-Karten* (§2.4). | Menschen has 12 Lektionen per Teilband, Lingoda 12 chapters, Netzwerk 12 Kapitel [m14 §B1, §B3, §B9]. **Challenge to memos 04/05 (14 units):** a fixed, round, visible finish line matters more for completion than two more situations, and longer courses complete less [S2]. |
| **4 Etappen of 3 Lektionen** | Each Etappe ends in an Etappen-Check (a Modul-Plus-style review station, §4.3). | Menschen Modul-Plus every 3, Netzwerk Plateau every 3 [m14 §D; steal #6]. Four nested finish lines inside one course (§6.3). |
| **1 Lektion ≈ 1 week at the standard pace** | Pace presets: *Leicht* 2 Lerntage/week, *Standard* 3, *Intensiv* 5. At Standard a Lektion takes one week, so a course takes 12 weeks plus, in the .2 courses, one buffer week (design). | Memo 09 proposes one unit per week at ~3 h [m09 impl. A1]; a near exam date adds sessions, never longer sessions. |
| **Lernschritt = the unit of use** | 15–20 min (Aufgabe 25), learner-paced, resumable at item level | Segmenting d = 0.32 retention, 0.36 transfer [S12]; Duolingo moved its streak to "one lesson" [S4] |
| **Required core vs optional depth** | The required path is what completion and the Teilnahmebescheinigung count. *Mehr üben* pools, Fokus-Karten, the Lesemagazin and extra mocks are optional and never gate anything. | Sicher!'s Baukasten freedom fails self-paced learners because they cannot judge what to skip [m14 §F3]; so we decide for them, visibly. |

**Planned learner time per half-level (design, to be replaced by measured values):**

| Course | Lernschritte | Core Lektionen | Checks and mocks | Daily review (≈5 min × learning days) | Planned core |
|---|---|---|---|---|---|
| A1.1, A2.1 | 72 | ≈ 23 h | ≈ 1.7 h | ≈ 3 h | **≈ 28 h** |
| A1.2 | 66 + mocks | ≈ 21 h | ≈ 1.3 h + 3 × SD1 mock (80 min) ≈ 5.3 h | ≈ 3.5 h | **≈ 30 h** |
| A2.2 | 66 + mocks | ≈ 21 h | ≈ 1.3 h + 3 × Goethe A2 mock (105 min) ≈ 6.5 h | ≈ 3.5 h | **≈ 31 h** |
| B1.1, B2.1 | 84 | ≈ 27 h | ≈ 2 h | ≈ 3.5 h | **≈ 33 h** |
| B1.2 | 75 + mocks | ≈ 24 h | ≈ 1.3 h + 3 × telc B1 mock (~3 h) ≈ 10.3 h | ≈ 4 h | **≈ 39 h** |
| B2.2 | 75 + mocks | ≈ 24 h | ≈ 1.3 h + 3 × telc B2 mock (~3 h) ≈ 10.3 h | ≈ 4 h | **≈ 39 h** |

**Challenge to memo 08's "~60 h per half-level" [m08 impl. 5].** Completion-first makes the *required* path smaller
than 60 h and puts the rest in optional depth (≈ 10–20 h per level of *Mehr üben*, Fokus-Karten and extra mocks).
The required path is still in the range of the published benchmarks for on-task time:

- Menschen: ≈ 4 UE per Lektion plus Modul-Plus, ≈ 48 UE (≈ 36 h) per Teilband [m14 §B1];
- Goethe DTO: 5–7 h/week for 3 months per level, ≈ 65–90 h per level, i.e. ≈ 33–45 h per half-level (derived from
  [m08 §2.5], snippet);
- BAMF's 100 UE ≈ 75 h per half-level is classroom time, which includes organisation and waiting [m08 §2.13].

This is the proposal's central bet, and it is tested in the pilot (§10.1): if measured minutes per Lernschritt run
long, the Lernschritt is split, never lengthened.

### 2.2 Grammar allocation

- **Spine:** the consensus tables per half-level in memo 06 F3 (11–15 points each), which follow the Lehrwerk
  consensus in memo 14 §C. The grammar is derived from the Lektion's situation, never the other way round
  (RC §6.3 via [m04 F2]).
- **Completion rule: one new main point per Lektion**, taught blocked in Lernschritt 2 and extended in Lernschritt 3,
  plus at most one chunk preview (e.g. *„Ich habe … gemacht"* before the Perfekt is systematic). A Lektion never
  opens two unrelated new structures. Memo 06 gives 11–15 points per half-level; with 12 Lektionen that leaves 0–3
  points to be taught as chunks or in the Etappen-Checks' contrast review.
- **Contrast partners interleave from their second exposure** (Akkusativ/Dativ, Perfekt *haben/sein*, *wenn/als*,
  *weil/denn*): interleaving overall g = 0.42 [m09 §3].
- **Hinge-point decisions** (memo 06 F1): Perfekt as chunks at the end of A1.1, systematic in A1.2; Passiv Präsens
  receptive in A2.2, productive in B1.2; Relativsatz Nom/Akk in A2.2; Futur I in B1.1; two-part connectors in B1.2;
  Konjunktiv I in B2.2 (both Aspekte and Sicher! put it there, [m06 F3]). Where Aspekte and Sicher! disagree at B2,
  the table in §2.3 names the side taken.
- **A1.2 covers the full Goethe A1 inventory** (all six modal verbs, imperative in three forms, war/hatte, Dativ
  verbs, dies-/welch-, Genitiv-s with names, Wortbildung -er/-ung/-in), because the A1 exam comes after A1.2
  [m06 impl. 3].

### 2.3 Vocabulary allocation

- **Targets per half-level** from memo 07: A1.1 330–360; A1.2 300–330; A2.1 and A2.2 330–360; B1.1 and B1.2
  520–580; B2.1 and B2.2 700–850 new Lernwörter. Productive share ≈ 50 % at A, ≈ 45 % at B1, 35–40 % at B2
  [m07 impl. 1].
- **Completion rule: the daily load is capped, not the list.** Per Lektion, words arrive in 3–4 thematic mini-blocks
  of 6–10 in the input Lernschritte [m07 impl. 3]. The SRS introduces at most **12 new cards per learning day**
  (design) and holds the rest back. A review backlog is a known reason people stop using spaced-repetition tools
  (design inference, **unverified**), so §5.3 caps the daily review too.
- **Core vs extension is visible** (Hueber's italic extension vocabulary [m07 §3]): productive words get two-way
  cards and a production item; receptive words get recognition-only cards and never block anything.
- **Selection order** is memo 07's fixed sequence: situation → Goethe Themen field → exam-task language → frequency
  fill → capped off-list words (15 % A, 25 % B1) → at B1.2–B2 the Leipzig CC BY frequency bands, never DeReWo
  [m07 impl. 2].
- **The learner sees a counter, never the list:** „412 von ≈ 650 Wörtern der A1-Liste" [m07 impl. 6–7].

### 2.4 Exam mapping and lanes

| Course | Exam the pair leads to | Default lane | Other lanes | Honest line on the product page |
|---|---|---|---|---|
| A1.1 + **A1.2** | Start Deutsch 1 (Goethe = telc, one format) | SD1 | ÖSD ZA1 adapter pack (optional, after launch) | A1.1: „Die A1-Prüfung braucht A1.1 und A1.2." |
| A2.1 + **A2.2** | Goethe-Zertifikat A2; telc Deutsch A2 is a different format | Goethe A2 | telc A2 (2 mock forms); ÖSD ZA2 later | A2.1: „A2.1 allein bereitet nicht auf die ganze Prüfung vor." |
| B1.1 + **B1.2** | telc B1, DTZ, Goethe/ÖSD B1 | telc B1 in Germany; Goethe/ÖSD abroad | DTZ („nur für Teilnehmende am Integrationskurs") | B1.1: same wording |
| B2.1 + **B2.2** | telc B2, Goethe B2 | telc B2 in Germany; Goethe abroad | DTB B2 later | B2.1: same; plus „Studienkolleg-Niveau, keine Hochschulzulassung (DSH-2/TestDaF TDN 4 nötig)" |

Sources: [m01 §1–6], [m02 §1–6, impl. 1, 11], [m03 §1–6, impl. 1]. Lane choice happens once at onboarding
(„Welche Prüfung? Wann?"), has a default, and can be changed at any time. **Completion-first keeps lanes thin:** a
lane swaps only the exam-specific pieces (the Aufgabe format in Lernschritt 5 where the formats differ, the
Etappen-Check Teile, the mocks, the rubric profile, the play counts). The Lektion sequence and the finish line never
change with the lane, so switching exams never costs progress.

**Fokus-Karten** (Schritte's *Fokus Alltag/Beruf/Familie* [m14 §B2, steal #8]): 0–2 optional 10-minute cards per
Lektion carry the DaZ-only situations (Kita, Bußgeldbescheid, Jobcenter) or the DaF alternative (hotel, travel). The
onboarding purpose question recommends them; they never count toward completion.

### 2.5 Draft topic sequence per half-level

Key for the Lehrwerk column (memo 14 §C): **M** Menschen L#, **S** Schritte plus Neu L#, **N** Netzwerk neu K#,
**As** Aspekte neu B2 K#, **Si** Sicher! L#; RC = BAMF Rahmencurriculum page; ZM/SB/BSK = memo 05 sources.
Exam codes: SD1 Sp/S/L/H = Start Deutsch 1 Teile; GA2 = Goethe A2; tA2 = telc A2; G = Goethe B1/B2; t = telc; D =
DTZ. The Aufgabe column is Lernschritt 5's AI-graded pair (S = Sprechen, W = Schreiben). The Lektion title is the
learner-facing can-do, in Sie-form as the course speaks everywhere. Sequences are drafts for the W2 curriculum
agents, who own the final can-do sets.

#### A1.1 — „Erste Schritte" (free · pre-A1 → A1 with support · lane SD1)

| # | Lektion (can-do title) | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Ankommen** | | | | |
| 1 | *Hallo!* Sie können sich begrüßen und vorstellen. | M1, S1, N1 | W-Frage, sein, ich/du/Sie | SD1 Sp1 | Selbstvorstellung / Steckbrief (5 Felder) |
| 2 | *Buchstaben und Zahlen* Sie können Ihren Namen buchstabieren und Ihre Nummer sagen. | M2, S1-E, N2 | Konjugation Plural, Zahlen bis 100 | SD1 Sp1, S1 | buchstabieren + Telefonnummer / Anmeldeformular |
| 3 | *Meine Familie* Sie können Ihre Familie vorstellen. | M3, S2, N5 | mein/dein/Ihr, Ja/Nein-Frage, ja/nein/doch | SD1 Sp2, L1 | 2 Fragen + 2 Antworten (Karten „Familie") / Nachricht zu einem Foto |
| **E2** | **Einkaufen und Essen** | | | | |
| 4 | *Im Supermarkt* Sie können nach Preisen fragen und etwas kaufen. | S3, M4–5, N4 | Artikel, Plural, kein/nicht | SD1 H1, Sp3 | 2 Bitten „Können Sie mir …?" / Einkaufsnachricht |
| 5 | *Im Café* Sie können bestellen und sagen, was Sie mögen. | M9, N4 | Akkusativ (den/einen/keinen), möchte, Vokalwechsel | SD1 Sp3, L2 | Bestellen mit KI-Partner / Antwort auf Einladung |
| 6 | *Meine Wohnung* Sie können Ihre Wohnung beschreiben. | S4 (**split**: M14/N9 = A1.2) | er/es/sie für Sachen, Adjektiv prädikativ | SD1 L2 | Wohnung beschreiben / Nachricht an neue Nachbarin |
| **E3** | **Mein Alltag** | | | | |
| 7 | *Mein Tag* Sie können die Uhrzeit sagen und Ihren Tag beschreiben. | M8, S5, N5 | trennbare Verben, am/um, Verb auf Position 2 | SD1 H1 | Tagesablauf / Wochenplan-Nachricht |
| 8 | *Hast du Zeit?* Sie können sich verabreden, zusagen und absagen. | M7–8, S6, N6 | können, Satzklammer | SD1 S2, Sp2 | Verabredung / Absage mit Grund (~30 Wörter, 3 Leitpunkte) |
| 9 | *Unterwegs* Sie können nach Bus und Bahn fragen. | M10, N3 | trennbare Verben (Wiederholung) | SD1 H2 (1× gespielt) | Fahrkarte kaufen / „Ich komme später" |
| **E4** | **Erzählen und Feiern** | | | | |
| 10 | *Mein Wochenende* Sie können sagen, was Sie gemacht haben. | M11–12, S7 | Perfekt als Chunks (8–10 Verben) | SD1 H3 | Wochenende erzählen / Online-Gruß posten |
| 11 | *Schilder und Nachrichten* Sie können Schilder und kurze E-Mails verstehen. | RC area E; SD1 L1/L3 [m04 A1.1 #14] | Imperativ (Sie) als Chunk | SD1 L1, L3 | „Wie bitte?"-Strategien / Antwort-E-Mail |
| 12 | *Feste* Sie können zu einem Fest einladen und gratulieren. | M12 (DaF); S7 *Kinder und Schule* as a Fokus-Karte (DaZ) | Datum (Ordinalzahlen als Chunk) | SD1 S2, Sp2 | Einladung annehmen / Einladung schreiben |

**Deviations:** *Wohnen* follows Schritte (A1.1) rather than Menschen/Netzwerk (A1.2), because Sp1 needs the
Wohnort and L2 needs housing ads early. The classroom-strategy can-dos (RC area E, 31 A1 goals [m04 F2]) are folded
into Lektionen 1–3 and 11 instead of a unit of their own. **End of course:** a half-mock in SD1 format on the Teile
A1.1 covers, a *Teil-Karte* (§4.5) and the dated plan into A1.2.

#### A1.2 — „Den Alltag organisieren" (€40 · A1 transactions in public space · lane SD1)

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **In der Stadt** | | | | |
| 1 | *Arbeit* Sie können über Ihre Arbeit sprechen. | S8, N7, M19 | müssen, war/hatte | SD1 Sp1 + **Startwerte** (§4.4) | Arbeitsalltag / Stundenzettel + Nachricht an die Chefin |
| 2 | *Wo ist …?* Sie können nach dem Weg fragen und ihn verstehen. | M13, M15, S11 | Präpositionen + Dativ (mit, zu, bei, aus, von, nach), zum/zur | SD1 H2, L3 | Weg erfragen / Wegbeschreibung |
| 3 | *Bahn und Bus* Sie können Fahrkarten kaufen und Durchsagen verstehen. | RC 142–145 [m04 A1.2 #7], N12 | Dativ nach Präposition (Wiederholung) | SD1 H2 (1×) | am Schalter / SMS „Verspätung" |
| **E2** | **Gesundheit und Termine** | | | | |
| 4 | *Termine* Sie können einen Termin machen, verschieben und absagen. | S9, M16 | vor/nach/in/seit/ab | SD1 S2, H3 | Termin am Telefon / Absage (~30 Wörter) |
| 5 | *Beim Arzt* Sie können sagen, was Ihnen wehtut. | M18, S10, N8 | Imperativ (Sie), sollen | SD1 Sp3 | Anmeldung in der Praxis / Patientenformular |
| 6 | *Am Schalter* Sie können um Hilfe bitten und ein Formular ausfüllen. | S9 *Ämter* (DaZ) / M16 *Hotel* (DaF), chosen by purpose | helfen/danken/gehören, Dativpronomen | SD1 S1, Sp3 | Bitte am Schalter / Anmeldeformular |
| **E3** | **Einkaufen und Wohnen** | | | | |
| 7 | *Kleidung* Sie können Kleidung kaufen und vergleichen. | M22, S13, N11 | welch-/dies-, gefallen/passen, gut – besser – am besten | SD1 Sp2, L2 | Verkaufsgespräch / Online-Bestellung + Rückfrage |
| 8 | *Hausordnung* Sie können Regeln verstehen und Nachbarn um etwas bitten. | M14, M20–21, N9 | dürfen, Imperativ du/ihr, sein/ihr, Genitiv-s (*Ottos Wohnung*) | SD1 L3 | Nachbarin um Hilfe bitten / Zettel im Treppenhaus |
| 9 | *Kundenservice* Sie können höflich bitten und ein Problem melden. | S12 | würde/könnte als Chunks, Akkusativpronomen | SD1 Sp3, H3 | Hotline / kurze Anfrage-E-Mail |
| **E4** | **Zielgerade** (each Lektion is followed by an Übungsprüfung that week) | | | | |
| 10 | *Wetter und Wochenende* Sie können über das Wetter und Vergangenes sprechen. | M23, N12 | denn; Perfekt trennbar/untrennbar/-ieren | SD1 H3 | + **Übungsprüfung 1** |
| 11 | *Glückwünsche* Sie können gratulieren und auf Einladungen antworten. | M24, S14 | Ordinalzahlen/Datum, das Du anbieten | SD1 S2 | + **Übungsprüfung 2** |
| 12 | *Pläne* Sie können sagen, was Sie vorhaben. | M17 | wollen, mit/ohne, Wortbildung -er/-ung/-in | SD1 Sp1–3 | + **Übungsprüfung 3** (one sitting: 65 min + Sprechen) |

**Deviation:** Menschen's *Aussehen und Charakter* (M19) is not a Lektion; war/hatte moves to Lektion 1 (Schritte
teaches the Präteritum of sein/haben with *Beruf und Arbeit*, S8). **Buffer week** before the exam date: review and
repair only (§4.4).

#### A2.1 — „Kontakte pflegen, Dinge erledigen" (€50 · A2 · lane Goethe A2; telc A2 variant)

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Kontakte** | | | | |
| 1 | *Über mich* Sie können von sich und Ihrem Weg erzählen. | M1, S1, N1 | Perfekt (Wiederholung), weil | GA2 Sp1, Sp2 | Karten-Runde / Vorstellung in einer Gruppe |
| 2 | *Einladungen* Sie können einladen, zusagen und absagen. | RC 57, S3 | wenn | GA2 S1 (SMS 20–30) | Feier planen am Telefon / SMS-Absage |
| 3 | *Umzug* Sie können sagen, wo etwas steht und wohin es kommt. | M2, S2 (N10 = A2.2) | Wechselpräpositionen über stellen/stehen, legen/liegen, hängen | GA2 L4 | Möbel stellen (Info-Gap, KI als Partner B) / Nachricht an Umzugshelfer |
| **E2** | **Einkaufen und Reisen** | | | | |
| 4 | *Vergleichen* Sie können Produkte vergleichen und online bestellen. | M4, S3 | Adjektivendungen nach ein/kein, Komparativ | GA2 L2 | Beratung im Laden / kurze Anfrage |
| 5 | *Restaurant* Sie können reservieren, bestellen und nachfragen. | M10, S3 | dass; Adjektivendungen nach der | tA2 H1 | Tisch reservieren / Restaurantbewertung |
| 6 | *Reisen* Sie können Durchsagen verstehen und umbuchen. | M3, M5, N7 | Adjektiv ohne Artikel | GA2 H1 (2×), H3 (1×) | Umbuchen am Schalter / E-Mail ans Hotel (30–40) |
| **E3** | **Arbeit und Gesundheit** | | | | |
| 7 | *Am Telefon* Sie können eine Nachricht aufnehmen und weitergeben. | M9, M11, S4, N6 | reflexive Verben, sollte | tA2 H1 | Anruf für eine Kollegin / Notiz |
| 8 | *Gesundheit* Sie können beim Arzt erzählen und Ratschläge geben. | M7–8, S5 | könnte/sollte (Rat), deshalb | GA2 S2 | Ratschlag-Gespräch / Krankmeldung (30–40) |
| 9 | *Schule und Ausbildung* Sie können über Ihre Schulzeit sprechen. | N2, S6 | Modalverben im Präteritum | GA2 L1 | Sp2 „Ihre Schulzeit" / Erinnerungsbeitrag |
| **E4** | **Medien und Gefühle** | | | | |
| 10 | *Nachrichten* Sie können kurze Radiomeldungen verstehen. | N3 (**split**: M15 = A2.2) | W-Nebensatz, dass/wenn (Wiederholung) | GA2 H1, H4 | Mediennutzung / Online-Kommentar |
| 11 | *Gefühle, auch online* Sie können Freude, Ärger und Mitleid ausdrücken. | N4; CEFR online can-do [m04 A2.1 #11] | Verben mit Präposition (Einstieg: freuen auf/über) | — | Gratulieren und trösten / Post + Antworten auf Kommentare |
| 12 | *Geschenke* Sie können gemeinsam ein Geschenk planen. | S7 | Dativ + Akkusativ, Pronomen | GA2 Sp3 (Einstieg) | Geschenk planen / Dankes-E-Mail |

**End of course:** half-mock (GA2 S1+S2, Sp1–2, L4, H1) plus telc A2 H1 for that lane.

#### A2.2 — „Gespräche führen, Probleme lösen" (€50 · A2+ · lane Goethe A2; telc A2: 2 forms)

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Gespräche** | | | | |
| 1 | *Sprachen lernen* Sie können ein Gespräch beginnen, in Gang halten und beenden. | M13, N8 | als (temporal), seit/bis | GA2 Sp2 + **Startwerte** | Smalltalk halten / Forumsbeitrag „Lerntipps" |
| 2 | *Gemeinsam planen* Sie können einen Termin und einen Plan aushandeln. | GA2 Sp3, S8 | wäre/hätte/würde („Wie wäre es mit …?") | GA2 Sp3 | Kalender-Aufgabe / E-Mail mit Vorschlag |
| 3 | *Hotel und Reisen* Sie können höflich fragen und Reiseprobleme lösen. | M16–17, S11–12, N7 | indirekte Fragen (ob, W-), woher/wo/wohin | GA2 H3, tA2 L1 | an der Rezeption / kurze Hotelbeschwerde |
| **E2** | **Arbeit** | | | | |
| 4 | *Mein Weg* Sie können Ihren Lebenslauf schreiben und erklären. | M23–24, S14 | Relativsatz Nom/Akk; häufige Präteritumformen | GA2 L3 | Werdegang erzählen / tabellarischer Lebenslauf |
| 5 | *Bewerben* Sie können im Vorstellungsgespräch Auskunft geben. | RC 100, M23 | trotzdem; Relativsatz (Wiederholung) | GA2 Sp2 | Vorstellungsgespräch / Aushang |
| 6 | *Im Job* Sie können Abläufe beschreiben und Absprachen treffen. | RC 82/85, M14 | Passiv Präsens (rezeptiv), lassen | tA2 H3 | Abläufe erklären / Notiz an Kollegen |
| **E3** | **Wohnen und Papiere** | | | | |
| 7 | *Verträge* Sie können Verträgen und Briefen das Wichtige entnehmen. | S9, S13, M21 | Verben mit Präposition + worauf/darauf | GA2 L1, L3 | Bankgespräch / Änderung melden (halbformell) |
| 8 | *Probleme in der Wohnung* Sie können dem Vermieter ein Problem schildern. | RC 156 | Konjunktiv II Bitten (Wiederholung) | GA2 S2 | Vermieter anrufen / Mängelmeldung (30–40) |
| 9 | *Fristen* Sie können Behördenbriefe verstehen und nachfragen. | M21, RC 76–77 (DaZ; DaF Fokus: Reiseplanung) | Passiv Präsens (Wiederholung, rezeptiv) | GA2 L2 | Nachfrage am Telefon / Bitte um Fristverlängerung |
| **E4** | **Zielgerade** | | | | |
| 10 | *Reklamieren* Sie können sich beschweren und nach Gründen fragen. | RC 48–49, 125 | Konnektoren-Wiederholung | GA2 S1/S2 | + **Übungsprüfung 1** |
| 11 | *Wetter und Klima* Sie können Radiomeldungen und Interviews verstehen. | M18 | Präpositionaladverbien | GA2 H4 | + **Übungsprüfung 2** |
| 12 | *Lebensstationen* Sie können zusammenhängend von Ihrem Leben erzählen. | N10–11, S14 | zuerst … dann … zum Schluss | GA2 Sp2, S1 | + **Übungsprüfung 3** (90 + 15 min) |

**Deviation:** the DTZ is not an A2.2 lane. It is a scaled A2–B1 exam taken only inside the Integrationskurs
system [m02 §3]; its lane starts in B1.1. Integration-course learners get a Fokus-Karte per Lektion instead.

#### B1.1 — „Im Alltag mitreden" (€60 · A2+ → B1 · lanes telc B1 / DTZ / Goethe-ÖSD B1)

The B skeleton applies from here (§3.2): the Lektion opens with a question or photo, and each Lektion has one text
type.

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Mitreden** | | | | |
| 1 | *Neuigkeiten* Sie können in einer E-Mail von Neuigkeiten berichten. | M1, Si1 | n-Deklination; Adjektivdeklination (Wiederholung) | G Sch1 / t SA | telc M1 Kennenlernen / private E-Mail (~80) |
| 2 | *Erlebnisse* Sie können von früher erzählen. | M2, N4, Si5 | Präteritum zum Erzählen | G L1 (Blog) | Erlebnis erzählen / Blogbeitrag |
| 3 | *Gemeinsam planen* Sie können etwas planen und sich einigen. | spine [m02 impl. 2]; M6, Si2 | falls; Vorschläge mit Konjunktiv II | G S1 / t M3 / D S3 | Planen: wer macht was / Einladung |
| **E2** | **Wohnen und Kaufen** | | | | |
| 4 | *Wohnung und Nachbarn* Sie können Details erfragen und sich beschweren. | M3, Si4 | Relativsatz Dativ / mit Präposition | D Schreiben, t SA | Besichtigung / Beschwerde (4 Leitpunkte) |
| 5 | *Reklamieren* Sie können eine Ware reklamieren und eine Lösung verlangen. | M4, N2 (clip) | obwohl, trotzdem | t LV3, D L2 | Reklamation im Laden / Reklamations-E-Mail |
| 6 | *Wenn etwas schiefgeht* Sie können Probleme unterwegs lösen. | ZM B1, N1 | Genitiv; wegen/trotz/während | G H1, t HV3, D H1 (1×) | Umbuchen / Entschuldigung (~40, G Sch3) |
| **E3** | **Arbeit und Zukunft** | | | | |
| 7 | *Absprachen* Sie können Termine verschieben und Aufgaben absprechen. | RC 85, BSK 59.6 | zu + Infinitiv | G Sch3 | Schichttausch / formelle Nachricht |
| 8 | *Beratung* Sie können sich beraten lassen und Ziele begründen. | M7–8, Si5 | um … zu, damit; da/bevor | t M2 (Einstieg) | Beratungsgespräch / Anfrage an einen Kursanbieter |
| 9 | *Zukunft* Sie können über Pläne und Vermutungen sprechen. | M5, N6 | Futur I | G S2 (Einstieg) | Zukunftspläne / kurzer Forumsbeitrag |
| **E4** | **Rückblick und Medien** | | | | |
| 10 | *Verpasste Chancen* Sie können sagen, was Sie anders gemacht hätten. | M10–11, N3 | Konjunktiv II Vergangenheit, Plusquamperfekt, nachdem | G L1 | Entscheidungen besprechen / persönliche E-Mail |
| 11 | *Nachrichten* Sie können Nachrichten verstehen und Überschriften zuordnen. | SB B1, t LV1 | irreale Bedingungen (Wiederholung) | t LV1, HV1 | über eine Meldung sprechen / Leserkommentar |
| 12 | *Gesundheit* Sie können erklären, was Ihnen fehlt, und kurz präsentieren. | M9, ÖIF-B1 | Komparativ attributiv, Adjektiv als Nomen | G S2 (2-Min.-Version) | Kurzpräsentation / Anfrage an die Krankenkasse |

#### B1.2 — „Selbstständig handeln und Stellung nehmen" (€60 · B1 → B1+ · three lanes)

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Meinung und Präsentation** | | | | |
| 1 | *Meinung im Forum* Sie können Ihre Meinung schriftlich begründen. | M13 | darum/deswegen/nämlich, wegen | G Sch2, G L4 + **Startwerte** | t M2 Meinung berichten / Forumsbeitrag (~80) |
| 2 | *Präsentieren* Sie können ein Thema mit fünf Folien präsentieren. | M9, M19; G S2/S3 | Redemittel Präsentation | G S2 + S3 | 5-Folien-Präsentation + Rückfrage / Stichpunkte |
| 3 | *Weiterbildung* Sie können Informationstexte zusammenfassen. | M14, Si8 | Partizip I/II als Adjektiv | G L2, t LV2 | Zusammenfassen für jemanden (Mediation) / Kursanfrage |
| **E2** | **Arbeit** | | | | |
| 4 | *Bewerbung* Sie können ein Bewerbungsschreiben verfassen. | M15, S8 | nicht nur … sondern auch, sowohl … als auch | t SA, D Schreiben | Telefonat zur Stelle / Bewerbungsschreiben |
| 5 | *Vorstellungsgespräch* Sie können über Erfahrungen sprechen und verhandeln. | RC 100 | brauchen + zu, Ausdrücke mit es | t M1 | Vorstellungsgespräch / Dankes-E-Mail |
| 6 | *Konflikt klären* Sie können Ihren Standpunkt einbringen und einen Kompromiss finden. | N7 (clip), S8 | weder … noch, entweder … oder | G S1, t M3 | Konfliktgespräch / Protokollnotiz |
| **E3** | **Behörden und Regeln** | | | | |
| 7 | *Einspruch* Sie können schriftlich widersprechen und etwas melden. | RC 78, M22 | Passiv Präteritum/Perfekt | D Schreiben, G Sch3 | bei der Polizei / Einspruch |
| 8 | *Schadensfall* Sie können einen Schaden melden. | RC 111, M21 | Passiv mit Modalverben | t SA | Versicherungshotline / Schadensmeldung |
| 9 | *Regeln* Sie können Regeln genau verstehen und Anweisungen geben. | G L5, M20 | Relativsatz mit wo/was; indem/sodass | G L5, D L4 | Anleitung geben / Aushang |
| **E4** | **Zielgerade** | | | | |
| 10 | *Zusammenleben* Sie können über Werte sprechen und zwischen Positionen vermitteln. | M18, S11–12, N10 | je … desto | t M2, G H4 | + **Übungsprüfung 1** |
| 11 | *Werbung und Konsum* Sie können Meinungen in Texten und Radiodebatten zuordnen. | S9–10, Si7 | als ob, (an)statt … zu | G L4/H4, t HV1 | + **Übungsprüfung 2** |
| 12 | *Heimat und Zukunft* Sie können ein Foto beschreiben und mit Ihrem Heimatland vergleichen. | M24, S14 | damit / um … zu (Wiederholung) | D S2, G S2 | + **Übungsprüfung 3** |

#### B2.1 — „Argumentieren und im Detail verstehen" (€65 · B1+ → B2 · lanes telc B2 / Goethe B2)

Genres are built at reduced length here (Forumsbeitrag ~110, Beschwerde ~120 words), and the full length follows
in B2.2 [m03 impl. 10].

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Standpunkte** | | | | |
| 1 | *Heimat* Sie können einen Standpunkt erläutern. | As1 | Temporalsätze; Verben mit Präposition (Wiederholung) | t M1 | Erfahrung erzählen (1,5 Min.) / persönlicher Brief |
| 2 | *Kommunikation* Sie können sich an informellen Diskussionen beteiligen. | As2 | Infinitivsatz vs. dass-Satz | G Sp2 (kurz) | Diskussion / Forumsantwort |
| 3 | *Stellung nehmen* Sie können einen Forumsbeitrag mit Einleitung und Schluss schreiben. | [m05 B2.1 #2] | Mittelfeld, Stellung von nicht | G S1 | Pro/Contra kurz / Forumsbeitrag |
| **E2** | **Arbeit** | | | | |
| 4 | *Arbeitswelt* Sie können über Arbeit und Freizeit argumentieren. | As3 | Nomen-Verb-Verbindungen; Passiv + Ersatzformen (Aspekte side) | t LV2 | Diskussion / Leserbrief |
| 5 | *Bewerben (B2)* Sie können Ihre Qualifikationen begründen. | BSK 5.2, 6.4 | Bedeutungen des Konjunktivs II | — | Vorstellungsgespräch B2 / Anschreiben |
| 6 | *An Vorgesetzte* Sie können um Verständnis bitten und einen Vorschlag machen. | G S2 | Konjunktiv II Vergangenheit (produktiv) | G S2 (~100) | Gespräch mit der Chefin / Nachricht |
| **E3** | **Ansprüche und Zusammenleben** | | | | |
| 7 | *Beschwerde mit Anspruch* Sie können Zugeständnisse einfordern. | ZM B2 | Zustandspassiv, von/durch (Sicher! side) | t SA (Variante B) | Kundenservice / Beschwerde-E-Mail |
| 8 | *Nachbarschaft* Sie können Probleme im Wohnumfeld erörtern. | As4 | Relativsatz mit wer; Präpositionen + Genitiv | t LV3 | Hausversammlung / E-Mail an die Verwaltung |
| 9 | *Übergabe im Team* Sie können Informationen im Pflege- oder Arbeitsteam weitergeben. | memo 10 (care workplace); As6 | Partizip als Adjektiv (Sicher! side) | DTB-style Telefonnotiz | Übergabegespräch / Telefonnotiz |
| **E4** | **Wissen und Medien** | | | | |
| 10 | *Wissenschaft* Sie können über Ursachen, Folgen und Hypothesen sprechen. | As5 | Nominalstil (Einstieg), Konsekutivsätze | G L3 | Hypothesen / Zusammenfassung |
| 11 | *Radio und Podcast* Sie können Interviews einmal hören und Standpunkte erkennen. | GER B2 (S. 73) | Futur II (Vermutung) | G H1/H3, t HV (1×) | Podcast diskutieren / Kommentar |
| 12 | *Eigene Fehler* Sie können Ihre typischen Fehler erkennen und umschreiben. | ZM B2 | Konnektoren und Register (Wiederholung) | t SB | 2-Min.-Vortrag / Überarbeitung eigener Texte |

#### B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln" (€65 · B2 → B2+ · lanes telc B2 / Goethe B2)

| # | Lektion | Leaders | Grammar (new) | Exam Teil | Aufgabe S / W |
|---|---|---|---|---|---|
| **E1** | **Vortragen und diskutieren** | | | | |
| 1 | *Vortrag* Sie können einen Vortrag von vier Minuten halten. | G Sp1 | Nominalisierung | G Sp1 + **Startwerte** | Vortrag + Fragen / Gliederung |
| 2 | *Pro und Contra* Sie können Argumente austauschen und zusammenfassen. | G Sp2, t M2 | konzessiv/konditional/adversativ (obgleich, sofern, wohingegen) | G Sp2 | Diskussion mit Zusammenfassung / Meinungsäußerung (~150) |
| 3 | *Gespräche lenken* Sie können das Wort ergreifen und behalten. | ZM B2 | Modalpartikeln | t M3 | Planung mit Unterbrechungen / Einladung zum Meeting |
| **E2** | **Beruf** | | | | |
| 4 | *Verhandeln* Sie können einen Schaden darlegen und Grenzen setzen. | ZM B2+, Si10 | indirekte Rede (Konjunktiv I) | t SA (Variante B) | Verhandlung / Schadensersatzforderung |
| 5 | *Kritik* Sie können Kritik begründen und darauf reagieren. | BSK 52.1, 54.5 | subjektive Modalverben | DTB 1C (Paraphrase) | Mitarbeitergespräch / Stellungnahme |
| 6 | *Präsentieren im Beruf* Sie können im Team präsentieren (zweite Pflege-/Gesundheits-Lektion). | BSK 43.7; memo 10 | erweiterte Partizipialattribute | G Sp1 | Teampräsentation / Bericht |
| **E3** | **Vermitteln** | | | | |
| 7 | *Zusammenfassen* Sie können Texte für andere zusammenfassen. | SB B2 (Mediation) | Konjunktiv I (Wiederholung), Textkohäsion | G L2 | Mediation / Zusammenfassung per E-Mail |
| 8 | *Moderieren* Sie können eine Gruppe moderieren. | SB B2 (Mediation) | Verweiswörter | t M3 | Moderation / Protokoll |
| 9 | *Widerspruch* Sie können einen Widerspruch begründen. | BSK 39.3; G L5 | Nomen/Adjektive mit Präposition | G L5 | Beratungsgespräch / Widerspruch |
| **E4** | **Zielgerade** | | | | |
| 10 | *Vorlesungen* Sie können einem Vortrag im Studium folgen. | Si9; G H4 | dadurch … dass, indem | G H4 | + **Übungsprüfung 1** |
| 11 | *Kultur und Geschichte* Sie können Reportagen verstehen. | As7–8 | Partizipialattribute (Wiederholung) | G L3, t LV2 | + **Übungsprüfung 2** |
| 12 | *Zukunft* Sie können eine lebhafte Diskussion führen. | As10 | Futur II, Wiederholung | G Sp2, t M2 | + **Übungsprüfung 3** |

**B2 split decision** (memo 06 open question 2): Passiversatz and Nominalstil follow Aspekte (B2.1/B2.2);
Zustandspassiv and Partizip-als-Adjektiv follow Sicher! (B2.1); Konjunktiv I goes to B2.2 because both books put it
there [m06 F3].

---

## 3. Unit anatomy and lesson anatomy

### 3.1 The A-level Lektion (A1.1–A2.2): 6 Lernschritte, ≈ 115 minutes (design)

The skeleton is the union memo 14 recommends [m14 §G4]: Lernziele → serial scene → one structure per step with a
model sentence (Schritte A–C, [m14 §B2]) → Hören/Lesen → AI-graded Sprechen + Schreiben in exam format → phonetics
micro-slot → overview → „Das kann ich" with proof → Lernwortschatz into the SRS. Menschen's 4-page grain (≈ 4 UE)
sets the size [m14 §F9]. What completion-first changes is the **cut**: the Lektion is sliced into self-contained
Lernschritte, each of which ends in a win and names the next one.

| # | Lernschritt | Min | Content | Why it keeps people going |
|---|---|---|---|---|
| 1 | **Einstieg** | **15** (short on purpose) | Lernziele screen (3–5 can-dos, ≤ 20 s) → **scene** from the serial cast (≤ 90 s audio at A1, ≤ 2 min at A2; gist question, then detail, then transcript) → Wortfeld block 1 (6–10 words in context) → **Sofort-Aufgabe**: say the model sentence or one reply line, scored by read-aloud | A scored success in the first 3 minutes; fast-to-slow progress [S3] |
| 2 | **Form 1** | 20 | Warm-up (6–8 due items, 3 min) → input 2 (second half of the scene or a short text) → rule card ≤ 80 words headed by the model sentence (*„Ich möchte einen Kaffee."*) + 3–4 structured-input items → 10–14 recall-first items → **pushed output** (plan 30 s → say or type one reply → AI feedback → one revision) → exit (3 items; "Nächster Termin: in 2 Tagen") | Memo 09's 6-segment core lesson [m09 impl. A2] |
| 3 | **Form 2** | 20 | Same six segments with the second structure or Wortfeld block 2; from here on items interleave with the contrast partner | Contrast interleaving [m09 §3] |
| 4 | **Prüfungsformat** | 20 | One receptive exam Teil in its real format (e.g. SD1 H2: announcements played once) with a one-screen strategy; transcript after the first unaided listen; 3 dictation items; **phonetics micro-slot** (2 min, in 8 of the 12 Lektionen: perception with ≥ 4 voices, then segment-level read-aloud) | Exam formats rehearsed inside the unit [m14 steal #12]; HVPT g = 0.67 [m09 §9] |
| 5 | **Aufgabe** | 25 | Redemittel box → **Sprechen** in exam format with the AI partner (e.g. SD1 Sp3: two picture cards, *„Können Sie mir bitte …?"*) → per-criterion result → one retry; **Schreiben** in exam format (e.g. 30-word message, 3 Leitpunkte) with a live word counter → deterministic pre-check → AI result → revision | Plan → attempt → feedback → redo [m09 §8]; the moat in every Lektion [m08 impl. 1] |
| 6 | **Lektions-Check** | 12–15 | 12–15 deterministic items, ≈ 65 % this Lektion / 35 % earlier; one **proof item per can-do**; self-check „Das kann ich" → ticks confirmed by the items; gold Siegel; **cliffhanger line** from the story and the next Lektion's title and minutes | Harkin: recorded progress d = 0.40 [S7]; Menschen/Netzwerk "Das kann ich" [m14 steal #11] |
| — | **Tägliche Wiederholung** | 5 | any day, any time (§5) | The minimum viable learning day |

**Item mix per core Lernschritt (2 and 3):** ≈ 28 scored items: 8 review, 4 structured input, 12 controlled, 1
output, 3 exit, with ≥ 70 % in recall formats [m09 impl. A3]. Lernschritt 1 holds ≈ 12 items, Lernschritt 4 ≈ 15,
Lernschritt 6 12–15.

**Item types** (all have renderers in `src/components/lesson/*` today [m12 §3]): listen-and-select, true/false,
multiple choice, typed gap (checked by `check.js`, with TYPO retry), word order, match, dictation, read-aloud,
role-play turn, card round (SD1 Sp2/Sp3), info-gap with the AI as partner B (Menschen *Aktionsseiten* [m14 steal
#13]), short writing, exam-format writing.

### 3.2 The B-level Lektion (B1.1–B2.2): 7 Lernschritte, ≈ 135 minutes (design)

Memo 14 is clear that the A skeleton must not be reused past B1.2: the opener becomes a prompt, and each unit is
organised by text type with grammar extracted inductively [m14 §D, §G5]. Aspekte's "one text type per Modul" and
Sicher!'s ambiguous-photo opener are the models [m14 steal #16–18].

| # | Lernschritt | Min | Content |
|---|---|---|---|
| 1 | **Einstieg** | 15 | Lernziele → **photo or question prompt**, 60 s free speaking, scored for fluency and task, not accuracy (*„Was passiert hier? Was würden Sie tun?"*) → serial scene (≤ 2 min) → Wortfeld block 1 |
| 2 | **Text** | 20 | The Lektion's text type at exam length (e.g. Goethe B1 L4 reader comments, ~50–65 words each; telc LV2 ~400 words): gist → detail items in exam format |
| 3 | **Grammatik aus dem Text** | 20 | **Inductive**: the learner fills the rule table from sentences in the text, then the rule card; then controlled practice |
| 4 | **Hören** | 20 | Exam-shaped listening (announcements, interview, 3-voice panel, lecture), **single play by default from B2.1** with replay only in learning mode [m03 impl. 8] |
| 5 | **Wortschatz & Präzision** | 20 | Wortfeld blocks 2–3; one Sprachbausteine-style cloze (connectors, prepositions, collocations) [m03 impl. 9]; Redemittel |
| 6 | **Aufgabe** | 25 | The discourse task: planning (B1 spine [m02 impl. 2]), presentation, discussion or mediation; plus the exam-format writing task |
| 7 | **Lektions-Check** | 15 | As at A, plus a 60-second „Porträt" (a real, sourced person or place) as the reward screen [m14 steal #19] |

Planning time in B Aufgaben matches the lane: Goethe 15 min with notes, telc 20 min, **DTZ none** (cold-start
drills) [m02 impl. 6]. In practice mode the plan phase is shortened to 2–4 min so a Lernschritt still fits in
25 minutes; the full preparation time is used in the Übungsprüfungen.

### 3.3 The .2 exam-integrated Lektionen (10–12)

In A1.2, A2.2, B1.2 and B2.2, Lektionen 10–12 run **4 Lernschritte** (Einstieg, Form/Text, Prüfungsstrategie for
the learner's weakest Teil, Aufgabe) and replace the Lektions-Check with a **full Übungsprüfung** that week. A mock
may be taken in 2–3 sittings in practice (Lesen/Sprachbausteine one day, Hören + Schreiben the next, Sprechen the
third), and the plan schedules at least one in a single sitting, because Goethe A1's 65 minutes, for example, run
without a break [m01 §1].

### 3.4 How speaking and writing are graded

**The count.** Per course: 12 Lernschritt-5 pairs (24) + 12 Lektions-Check proof tasks (12, short) + 4 × 2
Etappen-Check tasks (8) = **44 AI-graded productive tasks**, above memo 08's floor of 40 and Goethe DOI's ~30
human-marked tasks per half-level (snippet) [m08 impl. 1]. The 48 pushed outputs in Lernschritte 2–3 are AI-evaluated
too but are not counted as Aufgaben. The counter is always visible: „Aufgaben: 17 von 44" (DUO's fixed
Einsendeaufgaben count [m14 steal #21]).

**Writing pipeline** (the legal rule is that no gate reads an AI score [m13 impl. 4]):

1. **Deterministic pre-check, instant (< 100 ms):** live word counter with the lane's band (SD1 ~30; Goethe A2
   20–30 / 30–40; telc A2 ~40; ÖSD A1 ≥ 25; Goethe B1 ~80 / ~40; telc B2 ≥ 150; Goethe B2 ~150 / ~100); Anrede,
   Gruß, Betreff present; Du/Sie drift; Leitpunkte touched (keyword heuristics); the official zero rules shown
   *before* submit („Unter 40 Wörtern wird Aufgabe 1 mit 0 Punkten bewertet") [m01 impl. 3–4; m02 impl. 3;
   m03 impl. 3].
2. **AI evaluation** (`evaluate-writing` with a **rubric profile per exam**, not one generic score):

   | Profile | Scale |
   |---|---|
   | SD1 / telc A2 | 3 / 1.5 / 0 per Leitpunkt + 1 / 0.5 / 0 Anrede/Gruß; spelling only if it harms meaning |
   | Goethe A2 | Aufgabenerfüllung and Sprache at 5 / 3.5 / 2 / 0.5 / 0; below 50 % of the words = 0 |
   | ÖSD A1 | length and content deductions (−1 at 20–24 words, −2 at 15–19, 0 under 15) |
   | Goethe B1 | 4 criteria at 10 / 7.5 / 5 / 2.5 / 0 (tasks 1–2), 4 / 4 / 6 / 6 (task 3); Erfüllung E = 0 |
   | telc B1 / B2 | 3 criteria at 5 / 3 / 1 / 0, × 3; B2: a Leitpunkt needs more than one clause; no A on criterion II without Betreff/Anrede/Schluss |
   | DTZ | 4 criteria at 5–0; 15–20 = B1 band |
   | Goethe B2 | 60 / 40 split; E = 0 |

   Sources: [m01 §1–5], [m02 §1–3], [m03 §1–2]. The level's qualitative band is shown beside the points: Profile
   deutsch A1/A2 descriptors [m04 impl. 5] and the DeuFöV qualifier ladder for B1/B2 [m05 §2.3]. Error tags follow
   memo 06 F4 (V2/inversion, verb-final, Satzklammer, case in NP vs PP, gender, adjective ending, Perfekt auxiliary,
   connector position, n-Deklination), weighted by level: an inversion error at B1 is flagged, not scored as a level
   failure [m06 impl. 15].
3. **Feedback order:** per-criterion points on the exam's own scale → **at most 3 self-correction prompts**
   (*„Prüfen Sie die Verbposition im Nebensatz."*) → the learner revises → then reformulation plus a rule of 3 points
   or fewer → the model text only after the learner's own revision [m09 impl. C14; Fan et al. S23].
4. **Calibration:** the AI prompts carry official sample texts as anchors, including Goethe's error-heavy B2 samples,
   so a surface-error grader does not under-score real B2 learners [m03 impl. 5].

**Speaking** (`speaking-session` / `evaluate-speaking` with a course `courseTask`, [m12 §3]):

- **Exam interaction types, not free chat** [m08 impl. 2]: SD1 card rounds; Goethe A2 calendar planning; B1
  planning with *wer macht was*, the 5-slide presentation and follow-up question; B2 Vortrag with an
  Einleitung–Hauptteil–Schluss timer, the pro/contra discussion, planning with a paraphrase-your-partner step
  [m02 impl. 2, 7; m03 impl. 6].
- **The AI partner's support fades by level** [m04 impl. 4]: A1.1 speaks slowly, repeats, offers a word bank; A1.2
  repeats on request; A2.1 normal pace with clarification; A2.2 the learner must keep the talk going; B1 the partner
  disagrees and must be convinced; B2 it interrupts recited speech, as telc examiners must [m03 §2].
- **Scoring by Teil criteria:** SD1 full/half/zero by intelligibility, "nicht die Zahl der Fehler" (2 points per
  question or request, 1 per answer) [m01 §1]; Goethe B1 28/40/16/16; telc 7/7/7/4 per part at B2; DTZ 50 task +
  50 language.
- **Pronunciation** is read-aloud with segment-level feedback (*ü/u*, vowel length, *ich*-Laut), never a global
  accent score [m09 impl. A4]; `score-readaloud` labels it *Verständlichkeit*.

**Completion rules for Aufgaben (the angle's specific contribution):**

- **An Aufgabe is done when it is submitted.** The score never decides completion, and revising is offered with one
  tap („Überarbeiten", the text is pre-filled). The same task type returns one week later in the Lektions-Check or
  Etappen-Check, which is where task repetition with feedback pays off [m09 §8].
- **No dead ends.** Microphone denied → a settings screen plus „ohne Mikrofon weiter", where speaking becomes a
  typed script and read-aloud becomes listen-and-select [m11 impl. 18]. Offline → „Gespeichert – wird ausgewertet,
  sobald Sie online sind", and the learner continues [m11 impl. 17]. AI slower than 10 s → staged progress, and
  after 20 s „Weiter – das Ergebnis erscheint in Ihrer Übersicht" (design).
- **Every result is labelled:** „Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein
  Prüfungsergebnis. Richtwert." [m13 impl. 3], and an AI-interaction notice appears at first contact (AI Act
  Art. 50(1), in force since 2 Aug 2026 [m13 §4]).

---

## 4. Assessment

The completion rule for every assessment: **it informs and routes; it never blocks.** Deterministic checks may
recommend a repeat; the learner can always continue (legal requirement for AI scores [m13 impl. 4], extended here to
all gates).

### 4.1 Items (instant)

`check.js` decides every discrete item: spelling separators fold, a case-only miss is TYPO with one retry except where
capitalisation is the task, numbers and spelled names are exact-match, and words are spelling-tolerant, as telc
accepts „Donerstach" [m01 impl. 8]. A missed item returns later in the same Lernschritt and the next day
(`requeue.js`), and the progress bar never moves backwards: the requeue shows as „+1 Wiederholung" [m11 impl. 4].

### 4.2 Lektions-Check (end of every Lektion)

12–15 deterministic items (65/35 current/earlier), one proof per can-do, plus the self-check. **The same check is the
„Ich kann das schon" test-out**: ≥ 80 % correct credits the Lektion, and its Aufgaben show as „übersprungen –
jederzeit nachholbar". This is honest endowed progress: a loyalty card with 2 of 10 stamps pre-given was completed by
34 % against 19 % for an empty 8-stamp card [S17] (secondary source), and the credit here is real.

### 4.3 Etappen-Check (after Lektionen 3, 6, 9; and 12 in the .1 courses)

20–25 minutes, Modul-Plus-style [m14 steal #6–7]: one exam-format Teil per skill on the Etappe's content, the two
AI-graded Aufgaben (the task types practised three weeks earlier, now repeated), and a **reward block** that is
optional and never graded: a *Lesemagazin* text, a scene from the serial, a *Porträt*. Results are shown per Teil on
the exam's own scale and turn into a repair list: „Hören Teil 2: 2 von 4 — 3 Übungen in Ihrer Wiederholung". The
first Etappen-Check lands in week 3–4 of the course, which is also when the novelty dip starts [S16]; §6.5 uses that.

### 4.4 Übungsprüfungen and the .2 exam phase

- **Startwerte** in Lektion 1 of every .2 course: a 15–20-minute mini-mock with one item set per Teil, placed in
  Lernschritt 4, **after** the Lektion's first win, never before it, and shown as starting values that later growth is measured
  against („Hören: Start 9/15 → jetzt 12/15").
- **Three full Übungsprüfungen** in the primary lane, parallel forms only, after Lektionen 10, 11 and 12, then a
  **buffer week** with review and repair and no new content [m09 impl. B11]. Secondary lanes get 2 forms at launch
  (telc A2; Goethe/ÖSD B1 and DTZ at B1.2; Goethe B2) and a third later.
- **Each exam's real pass rule** in its own scorer [m01 impl. 2; m02 impl. 4]: Goethe A1 60/100 with no per-part
  floor; Goethe A2 ≥ 45 written and ≥ 15 oral; telc 36/60 at A1/A2 and 135/225 + 45/75 at B1/B2; Goethe B1/B2 ×3.33
  per module; DTZ H+L 33/45, Schreiben 15/20, Sprechen 75/100 plus the speaking gate. Mock mode enforces play counts
  and natural tempo; practice mode may slow audio [m01 impl. 7]. One mock per level includes the answer-transfer
  step, because telc is paper-only [m01 impl. 11].
- **Retake path** (A1.2, B1.2): the learner types in the official per-part result and gets a 4-week plan weighted to
  the weak parts [m10 impl. 4].

### 4.5 End of the .1 courses: a half-mock and a Teil-Karte

Memo 10 proposes that the free A1.1 end "in an A1 diagnostic scored on the 60/100 rule" [m10 impl. 3].
**Completion-first challenges the framing, not the idea:** a learner who has done half the A1 content scores well
below 60 on a full A1 scale, and a demoralising number at the finish line is the worst possible moment to show one.
So the end of A1.1 (and A2.1, B1.1, B2.1) is a half-mock on the Teile the course covers, shown as a **Teil-Karte**:
every Teil of the exam with „geübt – Ihr Übungswert 11/15", or „kommt in A1.2, Lektion 2", never a 0 bar. The
60/100 calculation appears only in A1.2's Übungsprüfungen, where the whole exam has been taught.

### 4.6 Vorbereitungsstand (the readiness display)

No single percentage and no probability. Readiness is a **four-line checklist** in the course home:

1. Kurs: 12 von 12 Lektionen
2. Prüfungsteile: jeder Teil mindestens zweimal im Prüfungsformat geübt (11 von 11)
3. Übungsprüfungen: 2 von 3
4. Übungswerte je Teil (median of the last 3 attempts), as bars with a hairline at the lane's pass rule, captioned
   „Übungswert, keine Prognose" [m11 S6]

Mock scores are inflated by familiarity with the form (retest effect d = .26, larger with identical forms, [m09 §1]),
which is why nothing here predicts a result. The wording follows memo 01: „Nach der Bestehensregel von telc wäre
dieses Übungsergebnis ausreichend" — never „bestanden" [m01 impl. 2].

### 4.7 Placement (Einstufung)

A ≤ 10-minute adaptive test with partial credit plus a can-do self-check recommends a course and a starting Lektion;
everything before it is credited as tested-out [m11 impl. 8]. Self-assessment alone correlates only r = .466 with
measured proficiency [m11 §4]. The current 80-item band test cannot route between half-levels [m12 §2.9] and is
replaced.

---

## 5. Review and retention

### 5.1 The ladder

**+1, +3, +7, +14, +30 days, a lapse returns to +1, each interval capped at max(1 day, 15 % of the days left to the
exam)** [m09 impl. B7]. The optimal gap is about 20–40 % of a one-week retention interval and 5–10 % of a one-year
interval [S13]; expanding and uniform schedules do not differ (g = 0.034) [S13]. This replaces the current
`LADDER_DAYS = [1, 4, 7, 14, 60, 180]` in `src/lib/review/ladder.js`, whose 60- and 180-day rungs overshoot any exam
date under a year away; the ladder becomes a per-course config value. Memo 09 suggests an A/B test against an
adaptive scheduler (HLR/FSRS) later [m09 impl. D23].

### 5.2 What is reviewed

- **Words:** productive words two-way, receptive words recognition-only [m07 impl. 10]. Targets before the exam:
  ≥ 5 successful spaced retrievals for productive items, ≥ 3 for receptive [m09 impl. B8].
- **Patterns:** each grammar point gets short lags (1–3 days) first, then contrast review at the Etappen-Check and at
  about +2 and +4 weeks [m09 impl. B9].
- **Sentences:** model sentences and Redemittel (*„Wie wäre es mit …?"*), which are exam-critical at A2/B1.
- **Error-tagged items:** every AI-graded error with a tag (e.g. `verb-final`) seeds a repair card, so "teach → test →
  repair" is included in the price [m08 impl. 6].

### 5.3 The completion-first additions: no review debt

- **Daily cap:** the review session is ≈ 5 minutes by default and never above 7 (≈ 35 items at ~10 s each, design).
- **Priority when over the cap:** lapsed productive items → due items of the current Etappe → exam-critical chunks →
  receptive items. The overflow is re-scheduled by stretching intervals; it never piles up as a visible debt number.
- **The counter only shrinks within a session** [m11 S5]. It never shows „243 fällig".
- **After ≥ 3 days away,** the first screen is „Willkommen zurück – 5 Minuten Wiederholung", then the learner resumes
  where they stopped, never at a backlog [m09 impl. D22; m11 impl. 13].
- **Across courses:** the deck carries over from A1.1 into A1.2 and onward, so retention continues and the next
  course starts with familiar cards.

---

## 6. Engagement and the player UX

### 6.1 The first week is the product

Jordan's analysis of 221 MOOCs found the first two weeks decide engagement [S2]; Duolingo's streak team says days
0–7 decide and retention "flattens" after that [S4]. So week 1 of every course is designed as its own sequence
(design):

| Day | What happens | Minutes |
|---|---|---|
| 0 | A1.1 only: Lektion 1 Lernschritt 1 playable **without an account**, saved on sign-up (delayed sign-up ≈ +20 % DAU at Duolingo [S21], company-reported) | 15 |
| 1 | Lernschritt 1 ends in a scored spoken sentence → goal screen: exam type and date or „noch kein Termin", days per week (2/3/5), reminder time; **nothing pre-selected**, „Später" is real, CTA „Plan festlegen" [m11 impl. 9] | 15 + 1 |
| 2–5 | One Lernschritt per learning day; the first daily review appears on day 2 | 15–20 |
| 6–7 | Lektion 1 complete → gold Siegel, the first *Wochenbericht* preview, the story's first cliffhanger | 15 |

Before day 7 no extra mechanic appears: streak concepts shown before day 7 "pretty universally … lose" [S4]. Each
mechanic gets a one-line German explanation at first contact [m11 impl. 9]: „Pausentage: Zwei Tage pro Woche zählen
automatisch – Ihre Serie bleibt."

### 6.2 The habit loop

| Part | Our version | Evidence |
|---|---|---|
| **Cue** | At most one reminder a day at the learner's chosen time; e-mail by default, Web Push only on Android after a first lesson. Any time of day counts: the reminder is a cue, not a slot | Flexible incentives produced more gym visits, during and after the intervention, than incentives tied to a planned 2-hour window [S10]; iOS Web Push only for Home-Screen apps [m11 §1] |
| **Routine** | One Lernschritt (15–20 min) or the 5-minute review | "Just do one lesson a day" was "a huge driver" [S4] |
| **Reward** | A can-do tick, the Lektion ring, the gold Siegel at Lektion end, the Aufgaben counter, a scored spoken sentence | Badges for mastery only [m09 impl. D17] |
| **Investment** | The dated plan, the words counter („412 von ≈ 650"), the story | Recorded progress d = 0.40 [S7] |

**Headline metric: the weekly goal** („3 von 3 Lerntagen"), shown with the count of learning days, which is the
number the streak shows („Lerntage in Folge: 23"). Memo 11 left daily streak vs weekly goal open [m11 open q. 2];
completion-first picks the weekly goal as the headline because working adults fail daily targets for reasons a course
cannot fix, and missing one day "did not materially affect the habit formation process" [S6].

**Forgiveness, automatic and free** [m11 impl. 11]: two *Pausentage* per week applied automatically; every new streak
starts with them; **earn-back**: one review within 48 hours of a break restores it; a quiet „lückenlos" mark for weeks
without a pause day. **A broken streak is never shown as 0**: the screen shows the week's goal, the longest run and
„Willkommen zurück". Logs showing an intact streak raise later engagement more than a broken one, and repairability
weakens the harm [S5].

**Excluded:** leagues, public leaderboards, hearts/energy, XP, gems, loot, random rewards [m11 §9]. Leaderboards and
badges lowered motivation and exam scores over 16 weeks [S15]; a one-time price gives us nothing to sell through them.

### 6.3 Progress architecture

- **Nested goals** [m11 impl. 5]: item → Lernschritt bar → Lektion ring (6 or 7 segments) → **Etappe (3 rings)** →
  course (12 Lektionen, can-dos, Aufgaben) → the Vorbereitungsstand (§4.6). The Etappe level is completion-first's
  addition: four finish lines inside each course put the next goal at most three weeks away (goal gradient
  [m11 §3]).
- **Bars never move backwards.** Requeued mistakes are shown as „+1 Wiederholung" [m11 impl. 4]. Constant-speed bars
  did not reduce drop-off in 32 experiments, fast-to-slow ones did, and slow-to-fast ones increased it [S3]. So each
  Lektion opens with its shortest Lernschritt, and Etappe 1 is the lightest Etappe (Lektion 1 ≤ 90 min, design).
- **The whole syllabus is always visible** on the course home: a linear default path, every Lektion titled by its
  can-do, unbought half-levels as locked chapters on the same map [m11 impl. 6]. Advance organizers ES ≈ 0.21/0.26
  [S18].
- **Every Lernschritt shows its minutes** („≈ 18 Min.", DUO's per-page minutes [m14 steal #20]), labelled *geplant*
  until measured.

### 6.4 The plan

`plan.js` already gets the principle right: it is arithmetic, never a gate, paced to `SUSTAINABLE_PER_WEEK = 5`
[m11 §7]. Extensions:

- **Input:** exam date (or none), days per week, reminder time, lane. **Output:** Lernschritte per week, weekly minutes,
  and the dates of the Etappen-Checks, Übungsprüfungen and buffer week, auto-placed backwards from the exam.
- **Always phrased forward:** „Diese Woche 4 Lernschritte – dann liegen Sie wieder auf Kurs." Never „2 Lektionen
  hinter dem Plan".
- **When the date is too close,** the plan says so arithmetically and offers options, never a prediction: „Bei
  5 Lerntagen pro Woche schaffen Sie bis zum 14. November etwa 9 von 12 Lektionen. Möglich: Einstufung machen und
  Bekanntes überspringen · Fokus auf die Prüfungsteile · Termin verschieben."
- **Evidence and limits.** Plan-making raised MOOC completion in one study (reported as +29 %, snippet) [S9]; at
  scale, self-regulation interventions raised engagement "in the first few weeks but not final completion rates"
  [S8], and a scheduling nudge had null or weakly negative effects [S19]. So the plan is not the completion strategy;
  it is the frame the reminders, the Wochenbericht and the Etappen hang on. An `.ics` calendar export of the chosen
  days is offered and A/B-tested (design).

### 6.5 Staying in: re-entry and the mid-course dip

| Situation | Response |
|---|---|
| 1–2 days missed | Nothing; pause days apply automatically |
| ≥ 3 days | „Willkommen zurück – 5 Minuten Wiederholung", then resume where they stopped; the plan recomputes silently |
| ≥ 7 days | Reminders switch to weekly, **on Mondays** (fresh-start effect [S11]); the app offers „Neu planen" (new pace or date) |
| ≥ 30 days | Reminders stop after one final „Plan anpassen?" message; on return, a 10-minute re-entry check of the last Etappe recommends where to resume, never a restart |
| Weeks 4–6 (novelty dip) | Something new unlocks: the first Etappen-Check's reward block and, from Etappe 2, a new speaking mode (A: info-gap tasks with the AI; B: the first presentation) | Novelty effects dropped after 4 weeks and recovered in weeks 6–10 [S16] |
| An item-level stuck point | After 2 misses on the same item class in one Lernschritt: a 3-item repair drill with the rule card, then „Weiter – das kommt in Ihre Wiederholung". Never a third failure in a row without help |

### 6.6 The serial story

**One continuing cast across the whole ladder, A1.1 → B2.2** (Schritte's Foto-Hörgeschichte and Nicos Weg's single
protagonist [m14 steal #3, #11]): arriving and settling at A1, a first job at A2, staying and taking part at B1,
career and care work at B2. The cast should mirror our segments without stereotypes; for example, a spouse who
prepares her A1 exam before joining her husband, a colleague who trains as a nurse, a neighbour, a Sachbearbeiterin.
The story bible is a W2 task. **Rules:** every scene ≤ 90 s at A1 and ≤ 2 min above, every scene carries a task
(passive 5-minute stories lose online learners [m14 §F5]), and every Lektion-Check ends on a one-line cliffhanger that
is resolved in the next Lektion's Einstieg. The retention value of a serial is a design inference from the Lehrwerke,
not a measured effect **(unverified)**.

### 6.7 The Wochenbericht

Every Monday, in-app and by e-mail: learning days against the weekly goal, Lernschritte and Lektionen done, can-dos
confirmed, words („412 von ≈ 650"), Aufgaben done and revised, Übungswerte per Teil, and next week's plan in minutes.
An **opt-in share link** (read-only page) lets the learner show it to a partner, friend or teacher, because progress
monitoring works best when recorded and reported to others (d = 0.40 overall, larger when reported) [S7]. The report
is generated automatically, stays private until the learner shares it, and no staff member reads it (see risk R4).

### 6.8 The player

Memo 11's spec outline (S0 Kursplan … S9 Einstellungen) is adopted with these completion-first rules:

- **One practice item per screen; input screens scroll** [m11 impl. 1]. One primary action pinned in the thumb zone,
  full width, ≥ 48 px [m11 impl. 2]; 49 % of people use a phone one-handed [m11 §1].
- **Resume at item level:** closing the app mid-Lernschritt loses nothing; the course home says „Weiter bei Frage 9
  von 26".
- **Low-bandwidth by default** (lead market India, then Pakistan, Egypt, Nigeria [m10 impl. 7]): compressed audio,
  no autoplay video, the **next Lernschritt's text and audio prefetched** on Wi-Fi, a whole Lektion cacheable for
  commuters (design). The player route stays within ≈ 0.62 MiB of JS for a 3 s load on a Galaxy A24-class phone
  [S25]; floor 360 × 640, reflow at 320 px.
- **The end screen of every Lernschritt** names what the learner can now do and the next step with its minutes:
  „Geschafft: Sie können nach dem Preis fragen. Nächster Schritt: *Im Supermarkt – Prüfungsformat* (≈ 18 Min.)".
- **Token work** from memo 11 is adopted as-is (seal-gold for Lektion complete instead of the overloaded `himbeer`,
  a `prompt` type role, ≥ 16 px inputs, `hyphens:auto`, player primitives promoted into `ui/`) [m11 impl. 21].

### 6.9 The completion document

A **Teilnahmebescheinigung**, not a certificate: units completed, no scores, no level claim, and the fixed line „Kein
Sprachzertifikat. Kein Ergebnis des Goethe-Instituts, von telc oder ÖSD. Nicht als Sprachnachweis für Visum,
Aufenthalt oder Einbürgerung geeignet." [m13 impl. 7]. It is unlocked by completion as defined in §8.3, never by a
score. Where memo 11 proposed „Kursbestätigung", memo 13's term wins because the ZFU itself draws the line between a
Teilnahmebescheinigung and a Zeugnis [m13 §6].

---

## 7. Copy and marketing surfaces per level

### 7.1 Surfaces

| Surface | Language | Per level | Notes |
|---|---|---|---|
| Course page `/courses/<level>/` (Astro) | EN + DE | 8 | Published Inhaltsverzeichnis: Nr · Lektion (can-do) · Handlungsfeld · Grammatik · Textsorte · Prüfungsteil · Minuten [m14 steal #7, §G7] |
| Exam-worded landing page for each closing half | EN for A1 (India); DE for B1/B2 | 4 (A1.2, A2.2, B1.2, B2.2) | Course-worded pages alone miss ≈ 95 % of demand [m10 impl. 9] |
| In-app: Lernziele, end screens, plan, Wochenbericht, re-entry | DE instructions (Sie), explanations in plain English ≤ B1, stored apart so an L1 layer can be added | all | [m10 impl. 6; m08 impl. 11] |
| Reminder e-mails | per explanation language | 6+ templates per kind, rotated | reusing one template desensitises users [S20] |
| „Wie bewertet die KI?" page | EN + DE | 1 | criteria per exam, known limits, no accuracy figure until measured [m13 impl. 10] |
| Teilnahmebescheinigung | DE | 8 | §6.9 |

### 7.2 Draft headlines and proof lines (all to pass the lint in §9.1)

| Level | Page headline (draft) | Proof line |
|---|---|---|
| A1.1 | EN *"Start German free — 12 lessons in 20-minute steps, your speaking scored from lesson 1."* / DE *„Deutsch A1.1 kostenlos – 12 Lektionen, jede Sprechaufgabe sofort ausgewertet."* | „Die A1-Prüfung braucht A1.1 und A1.2." |
| A1.2 | EN *"Exam preparation for the Goethe-Zertifikat A1: Start Deutsch 1 and telc Deutsch A1 — a plan to your exam date and 3 full practice exams in the exam format."* | Price anchor: €40 against one exam fee in India (₹9,400 ≈ €86 [m10 §2.1]), derived in `marketing.js` |
| A2.1 | DE *„A2.1: Kontakte pflegen, Dinge erledigen – 12 Lektionen, 44 automatisch ausgewertete Aufgaben."* | „Allein bereitet A2.1 nicht auf die ganze Prüfung vor." |
| A2.2 | DE *„Vorbereitung auf das Goethe-Zertifikat A2 und telc Deutsch A2 – mit 3 Übungsprüfungen im Prüfungsformat."* | Every Teil named; link to the official Übungssätze |
| B1.1 | DE *„B1.1: Im Alltag mitreden – planen, reklamieren, erzählen. Jede Schreib- und Sprechaufgabe sofort ausgewertet."* | honest-line as above |
| B1.2 | DE *„Vorbereitung auf telc Deutsch B1, DTZ und das Goethe-/ÖSD-Zertifikat B1 – Plan bis zum Prüfungstermin, Übungsprüfungen nach der jeweiligen Bestehensregel."* | May cite the official DTZ figure: 55.0 % reached B1 in 2025 [S31]; never a pass rate for our learners [m02 impl. 14] |
| B2.1 | DE *„B2.1: Argumentieren und im Detail verstehen."* | „Studienkolleg-Niveau, keine Hochschulzulassung." |
| B2.2 | DE *„Vorbereitung auf telc Deutsch B2 und das Goethe-Zertifikat B2 – Vortrag, Diskussion, Beschwerde, Forumsbeitrag: jede Aufgabe sofort ausgewertet."* | Care/health Lektionen at general-language level; Fachsprache routed to MedMeister [m10 impl. 5] |

**Time claims.** Until the pilot has measured them, pages state only counts (12 Lektionen, 72 Lernschritte, 44
Aufgaben) and „geplant: ≈ 20 Min. pro Schritt". Afterwards: „Richtwert: ca. 30 Stunden, gemessen an den ersten
Lernenden" — a time budget labelled as a Richtwert is allowed; „in 12 Wochen zu A1" is not [m13 §5, impl. 9].

### 7.3 Reminder copy (examples)

The existing rule in `course-reminder.mjs` stays: never tell someone they have not done a lesson when they have. The
copy names the next step and stops.

- „Ihr nächster Schritt: *Beim Arzt – Termine* (≈ 18 Min.)."
- „3 von 3 Lerntagen sind noch drin: ein Schritt heute, zwei am Wochenende."
- Monday after a gap: „Neue Woche. 5 Minuten Wiederholung, dann weiter mit Lektion 6."
- EN explanation layer: *"Your next step: 'At the doctor – appointments' (about 18 min)."*

---

## 8. Content data model

### 8.1 Where things live

- **Course content is repo data** (JSON modules under `src/data/courses-v2/<level>/`), versioned, reviewed in PRs and
  checked by CI validators, like today's curricula registry with its LIVE/DRAFT split [m12 §3].
- **Shared banks stay where the engine expects them:** writing tasks in the writing bank under `<course>-lNN` keys
  (all 8 prefixes are already mapped in `evaluate-writing.mjs`, `LEVEL_OF_PREFIX`); speaking tasks as `courseTask`
  objects (no new DB rows needed [m12 impl. 5]); words matched to `words.id` by lemma at integration time so recorded
  audio is reused [m12 impl. 2]; mocks as Modelltest runner data sets.
- **Learner state lives in Supabase**, via hand-applied migrations: `lesson_attempts` (exists), `review_cards`
  (exists), `lifecycle_emails` (exists), and new `course_plans` (lane, exam date, days per week, reminder time,
  purpose segment beside `dm_attribution` [m10 impl. 2]) and `weekly_reports` (the Monday snapshot the share link
  reads). Learning days are a view over attempts, never a second truth.

### 8.2 Files per course

```
src/data/courses-v2/a1.2/
  course.json            # meta, lanes, pace presets, Etappen, completion rule, targets, cast
  lektionen/L01.json … L12.json
  etappen/E1.json … E3.json      # Etappen-Checks (.2 courses: 3)
  mocks/sd1-1.json … sd1-3.json  # Modelltest runner format
  audio.manifest.js      # generated by the Azure run; "Computerstimme" fallback per line
  vocab.json             # lemma records (memo 07 schema); ids matched at integration
```

### 8.3 `course.json` (excerpt)

```json
{
  "code": "a1.2",
  "priceKey": "a1.2",
  "lanes": { "default": "sd1", "available": ["sd1"], "later": ["osd-za1"] },
  "pace": { "leicht": 2, "standard": 3, "intensiv": 5 },
  "etappen": [ { "id": "E1", "lektionen": [1, 2, 3], "check": "E1" }, { "id": "E4", "lektionen": [10, 11, 12], "mocks": ["sd1-1", "sd1-2", "sd1-3"] } ],
  "completion": {
    "required": ["all-lektionen-done-or-tested-out", "etappen-checks-submitted", "mock:1-submitted"],
    "neverRequired": ["score", "fokus-karten", "mehr-ueben", "mock:2", "mock:3"]
  },
  "targets": { "newWords": [300, 330], "aufgaben": 44, "plannedMinutes": 1800, "measuredMinutesP50": null },
  "review": { "ladderDays": [1, 3, 7, 14, 30], "examCapShare": 0.15, "dailyNewCap": 12, "dailyReviewMaxMin": 7 },
  "cast": { "priya": { "voice": "de-DE-…", "rate": "-10%" } }
}
```

### 8.4 A Lektion file (excerpt)

```json
{
  "id": "a1.2-l05",
  "nr": 5, "etappe": 2,
  "title": "Beim Arzt",
  "canDoTitle": "Sie können sagen, was Ihnen wehtut.",
  "canDos": [
    { "id": "c1", "text": "Ich kann in der Praxis meinen Namen, meine Versicherung und den Grund nennen.",
      "src": ["RC 131·A1"], "band": "A1", "proof": "check.q07" }
  ],
  "handlungsfeld": "Gesundheit", "lehrwerk": ["M18", "S10", "N8"],
  "grammar": [ { "slug": "imperativ-sie", "role": "new" }, { "slug": "sollen", "role": "new" } ],
  "vocab": [ { "lemma": "der Schmerz", "plural": "die Schmerzen", "listRef": "A1", "role": "productive", "block": 1 } ],
  "exam": { "sd1": ["Sp3"] },
  "story": { "scene": "s05", "cliffhanger": "Die Ärztin schaut auf das Röntgenbild und sagt: „Hm.“" },
  "schritte": [
    { "id": "s1", "kind": "einstieg", "minutesPlanned": 15,
      "screens": [ { "type": "lernziele" }, { "type": "scene", "audio": ["s05-01", "s05-02"] },
                   { "type": "item", "item": { "kind": "readaloud", "target": "Mein Kopf tut weh.", "scored": true } } ],
      "endLine": "Sie können jetzt sagen, wo es wehtut." }
  ],
  "aufgabe": {
    "speaking": { "courseTask": { "teil": "SD1 Sp3", "cards": ["Tabletten", "Termin"], "partner": "a1-repeat-on-request" } },
    "writing": { "bankKey": "a12-l05", "examKey": "goethe_a1", "wordBand": [25, 40], "rubric": "sd1" }
  },
  "check": { "items": ["…"], "cumulativeShare": 0.35, "testOutThreshold": 0.8 },
  "fokus": [ { "id": "f1", "title": "Ein Kind krankmelden", "segment": ["dazu"], "optional": true } ]
}
```

Items use the fields the engine already consumes (`accepted`, `caseSensitive`, review card keys, read-aloud lines,
bank task keys), so `check.js`, mastery, requeue, the review ladder and read-aloud scoring carry over without a
rewrite [m12 impl. 8]. **Completion-specific fields:** `minutesPlanned` (and later `minutesMeasured`), `endLine`,
`story.cliffhanger`, `testOutThreshold`, `optional`, and the course-level `completion` block, which is the single
definition of "done" that the course home, the Teilnahmebescheinigung, the reminders and `weekly_truth_metrics()`
all read (the same one-definition rule CLAUDE.md applies to `lifecycle_customer_state`).

---

## 9. Quality gates

### 9.1 Machine-checkable rules (`scripts/validate-course.mjs`, `scripts/validate-vocabulary.mjs`)

Ratchets only go down and must equal their measurement, as in the existing validator.

| ID | Rule | Source of the threshold |
|---|---|---|
| Q01 | Every Lernschritt `minutesPlanned` ≤ 20 (Aufgabe ≤ 25) by the **time model** (reading speed per level, audio length × 1.5 for replays, ~12 s per closed item, ~30 s per typed item, task timers); the model is recalibrated on pilot data | design; [m09 impl. A2] |
| Q02 | Lernschritt 1 of every Lektion ≤ 15 min and contains a scored item within its first 3 screens | fast-start [S3] |
| Q03 | Every Lernschritt has an `endLine` and a next-step reference; every Lektion-Check has a cliffhanger | design |
| Q04 | Core Lernschritte hold 24–32 scored items, ≥ 70 % recall formats | [m09 impl. A3] |
| Q05 | 3–5 can-dos per Lektion, each with ≥ 1 proof item in the Lektions-Check (coverage 100 %) | [m04 impl. 7] |
| Q06 | Every Lektion has an Aufgabe pair whose bank key / courseTask exists; ≥ 44 Aufgaben per course | [m08 impl. 1] |
| Q07 | Lexis: every item uses only known words (earlier Lektionen + this Wortfeld + function words + names); text coverage ≥ 95 %, extensive reading ≥ 98 % | [m07 impl. 4] |
| Q08 | Vocabulary within memo 07 targets; off-list ≤ 15 % (A) / 25 % (B1); feminine pairs; `listRef` on every lemma; each new word ≥ 2× in its Lektion and in ≥ 2 later Lektionen | [m07 impl. 1–6] |
| Q09 | ≤ 1 new main grammar point per Lektion (+ ≤ 1 chunk preview); placement matches the spine or carries an override note | §2.2; [m06 impl. 1] |
| Q10 | The answer follows from the German prompt (the `quality.js` filter); no English meta-answers | [m12 §2.2] |
| Q11 | Exam fidelity: text lengths per Teil in range, play counts per lane config, word bands per task, item counts per mock match the official format | [m01 §7; m02 impl. 12; m03 §1–2] |
| Q12 | Register: Sie in every instruction, notice and e-mail; du only in peer dialogues | CLAUDE.md course rule |
| Q13 | **Copy lint** on all learner-facing strings and pages: bans „bestanden", „garantiert", „Bestehenschance", „in … Wochen zu", „prüfungssicher", „Zertifikat" (outside the fixed disclaimer), „offiziell", „anerkannt", „Muttersprachler"/"native speaker" on TTS, „persönliches Feedback", „Tutor", „Korrektur deiner Texte", titles starting with an exam mark | [m13 do/don't table] |
| Q14 | Every audio line is in the manifest or flagged „Computerstimme" | [m13 impl. 11] |
| Q15 | Mock parallel forms share no item stem or text | [m09 §1] |
| Q16 | Payload per Lernschritt (JSON + audio) ≤ 1.5 MB compressed (design) | [m10 impl. 7] |
| Q17 | No progression gate reads an AI score (static test over the gate code) | [m13 impl. 4] |
| Q18 | Plan copy tests: never „hinter", always forward; mocks auto-placed; buffer week present in .2 | [m11 impl. 15] |
| Q19 | No Lernschritt contains 3 consecutive production items without a preceding worked example | completion (design) |

### 9.2 The human-style DaF review rubric

Two independent adversarial reviewers per Lektion batch, plus one **timed walkthrough** reviewer. Each dimension is
scored 1–5 with findings classed BLOCKER / MAJOR / MINOR. **Pass:** no BLOCKER, ≤ 2 MAJOR per course, no dimension
below 3, total ≥ 32/40. A finding class is closed with a rule and a test, never with a list of item ids (the lesson
the A1.1 review ladder taught, per CLAUDE.md).

| # | Dimension | 5 looks like | Typical BLOCKER |
|---|---|---|---|
| 1 | Can-do fit and situational authenticity | the situation is one Germans actually meet; the can-dos are performed, not described | a can-do with no proof item |
| 2 | Level fit of input | ≥ 95 % known words, grammar at or below the spine | an untaught structure needed to answer |
| 3 | Explanation accuracy and brevity | rule card ≤ 80 words, correct, one model sentence | a wrong rule |
| 4 | Item quality | one defensible answer that follows from the German prompt; plausible distractors | two correct options |
| 5 | Exam-format fidelity | Teil, length, play count, timing and scoring match the official documents | a mock scored on a generic 60 % |
| 6 | Productive task and rubric fit | the task is the exam's task type; the rubric profile is the lane's | an Aufgabe graded on the wrong exam's scale |
| 7 | **Completion ergonomics** (the walkthrough) | the Lernschritt runs ≤ 20 min on a 360-px Android emulator; instructions ≤ 2 lines; an early success; no frustration spike; the end screen names the win | a Lernschritt that takes > 25 min or ends without a save point |
| 8 | Register, Landeskunde, inclusion, legal copy | Sie throughout, sourced facts with dates, no stereotypes, the lint passes | a pass promise or „Muttersprachler" on TTS |

### 9.3 Post-launch data gates (weekly, from `lesson_attempts`)

- **Abandonment hotspots:** an item or screen where learners quit at ≥ 2× the Lernschritt's median rate goes to review
  within a week.
- **Lernschritt p50 minutes > 25** → split the Lernschritt.
- **AI grading p95 latency > 10 s on Android** → the degraded UX in §3.4 becomes the default.
- **Completion funnel** in `weekly_truth_metrics()` (§10.4).

---

## 10. Production plan

### 10.1 Sequence: measure first, then scale

| Phase | What | Agents (parallel) | Exit criterion |
|---|---|---|---|
| **P0 Engine** (runs alongside W2) | Generalise the A1.1-coupled pieces (§11); build the Lernschritt builder and course home; purchase-aware entitlement in `evaluate-writing` and `speaking-session`; plan persistence, reminders, Wochenbericht, pause days; rubric profiles + deterministic pre-checks; `validate-course` + `validate-vocabulary`; re-point the 34 A1.1-pinned tests | **7** (engine, player UX, entitlement, habit system, grading, validators, tests) | CI green; a fixture Lektion plays end to end on a 360-px emulator |
| **P1 Pilot** | A1.1 **Etappe 1** (Lektionen 1–3 + Etappen-Check), authored, reviewed, audio-rendered, **shipped to free users** (no FernUSG exposure in a free course [m13 §1]) | 3 authors, 3 reviewers (2 DaF + 1 walkthrough), 1 fixer, 1 story-bible agent | 3 weeks of data: measured minutes per Lernschritt (p50/p95), week-1 learning days, share reaching day 7, AI Aufgaben per active learner, abandonment hotspots |
| **P2 Lock** | Recalibrate the time model and the anatomy (split what runs long); freeze templates | 2 | Anatomy v1 frozen with measured numbers |
| **P3 A1** | A1.1 Lektionen 4–12 + A1.2 (lead segment) incl. 3 SD1 mocks | 11 authors (1 per 2 Lektionen), 2 check authors, 3 mock authors, 1 audio-script agent, 1 writing-bank/rubric-anchor agent, 1 copy agent | Gate §9 passed |
| **P4 B1** | B1.1 + B1.2 (revenue core): 3 telc, 2 Goethe/ÖSD, 2 DTZ mocks | 12 authors, 2 check, 7 mock, 1 audio, 1 bank, 1 copy | Gate §9 passed; B1 leaves `COMING_SOON_LEVELS` (DECISIONS 2026-09-26) |
| **P5 A2** | A2.1 + A2.2: 3 Goethe A2 + 2 telc A2 mocks | 12 authors, 2 check, 5 mock, 1 audio, 1 bank, 1 copy | Gate passed |
| **P6 B2** | B2.1 + B2.2: 3 telc B2 + 2 Goethe B2 mocks | 12 authors, 2 check, 5 mock, 1 audio, 1 bank, 1 copy | Gate passed |
| **Review** (each of P3–P6, per course, per round) | 2 adversarial DaF reviewers + 1 timed walkthrough reviewer + 1 exam-fidelity reviewer (for .2 and mocks); 1 fixer | 5 per course per round | ≤ 4 rounds planned; a 5th round triggers a template fix, not more rounds |
| **Integration** (per course) | words matched by lemma, new-word JSON → SQL, writing-bank rows, audio manifest, pages, CTA wiring | 1 per course + 2 shared (pages, e2e) | PR merged per CLAUDE.md steward rules |

**Totals (design):** ≈ 7 engine + ≈ 8 pilot + 2 lock + ≈ 97 authoring (P3–P6) + ≈ 40 review per round
(8 courses × 5) + ≈ 10 integration. P4–P6 authoring can overlap once P3 has passed one review round.

**Owner actions** (cannot be done by agents): one Azure audio run per level with secrets (cost ≈ $0.08 for the whole
A1.1 script [m12 §4], so time is the constraint, not money); Lemon Squeezy variants for B1/B2; counsel on R4 and memo
13's open questions 1–3; the Impressum and Nutzungsbedingungen before B1/B2 go live [m13 impl. 16]; the voluntary
30-day refund in the LS dashboard [m13 impl. 13].

### 10.2 Why the pilot is worth the delay

Every number in §2.1 and §3 is a design inference [m09 "Unverified"], and the one real usage figure we have is 0 AI
writing uses in 7 days [db-snapshot]. Authoring 96 Lektionen on an unmeasured time model risks 96 Lektionen that run
30 % long. Three weeks of pilot data from real Android phones is the cheapest insurance in the plan.

### 10.3 What a Lektion author receives

The Lektion's row from §2.5, its can-do pool (memos 04/05), its grammar and word allocation (W2 output), the lane's
Teil spec (memos 01–03), the story beat, and the JSON template with `minutesPlanned` per Lernschritt pre-filled. The
author writes lemmas, never ids.

### 10.4 What we measure (added to `weekly_truth_metrics()`)

| Event / metric | Initial target (design, recalibrated after the pilot) |
|---|---|
| Starters who finish Lernschritt 1 and its scored sentence | ≥ 70 % |
| Starters who set a plan (with „Später" allowed) | ≥ 50 % |
| ≥ 3 learning days in the first 7 | ≥ 40 % |
| Buyers who finish Etappe 1 within 28 days | ≥ 50 % |
| Buyers who reach Lektion 6 | ≥ 40 % |
| Buyers who complete the course within plan + 4 weeks | ≥ 35 % (reference: 46 % of paying edX learners completed [S1]) |
| AI Aufgaben submitted per active learner per Lektion | ≥ 1.5 |
| .1 completers who buy the .2 within 30 days | tracked, no target yet |
| Reminder opt-out rate, earn-back use, microphone denials, AI p50/p95 latency | tracked [m11 impl. 22] |

These are internal goals for deciding what to fix. None of them is a claim, and none appears in copy.

---

## 11. Reuse and replacement

| Keep as is [m12 §5] | Generalise | Replace |
|---|---|---|
| `check.js`, `mastery.js`, `requeue.js` | `speech.js` manifests, pool loaders, `lexis.js` tables → per-level registries | `buildLesson.js` stage list → the Lernschritt builder (§3) |
| `reviewService` / `reviewGrading`, card keys | `review/ladder.js` → per-course ladder with the exam cap (§5.1) | `buildCheckpoint.js` A1.1 ceilings → Etappen-Check builder |
| `readaloud.js` + `score-readaloud` | `evaluate-writing` → rubric profiles per exam + feedback language per level | `writing.js` A1-only heuristics → deterministic pre-checks per lane |
| lesson persistence (`lesson_attempts`), item renderers | `speaking-session` / `evaluate-speaking` → Teil modes, fading partner support, in-lesson open speaking | `SpeakingStage` leaving the lesson for `/speaking` |
| Modelltest runner + `examScoring.js`, the honesty contract | Modelltest writing parts → wired to `evaluate-writing` | the Kurzversion mocks and the abridged `goetheB1.js`; fix `telcB2.js`'s writing task [m03 impl. 12] |
| JSON → SQL pipelines, `generate-example-audio.mjs` | `generate-course-audio.mjs` → cast table in `course.json` | `levelTestQuestions.json` band test → adaptive half-level placement |
| `course-reminder.mjs` (ledger, one-definition rule, canary, dry run) | extend: learner-chosen time, Monday back-off, template rotation | `milestones.js` (1/7/30) → weekly goal, pause days, earn-back |
| `plan.js` (arithmetic, never a gate) | forward copy, mock auto-placement, persistence in `course_plans` | `programs/*` + `courses/index.js` legacy 28-day player, once each course ships |
| `words` rows with audio; A1–A2 reading/listening with checks; the B1.1 grammar | the `words` schema → memo 07 fields | A2.1–B2.2 speaking missions as content; B-level reading essays and listening bundles (transcripts kept as raw material) |
| `quality.js`; the validator's generic rules | `validate-curriculum.mjs` → `validate-course.mjs` without A1.1 ratchets | `CourseCertificatePage.jsx` → Teilnahmebescheinigung |
| `explain-answer` in the free A1.1 | in paid courses: static, pre-generated explanations only (R5) | — |
| **New:** server-side purchase entitlement (the build prerequisite [m12 §4]), `course_plans`, `weekly_reports`, the Wochenbericht share page | | |

The 14 listening exercises that mocks and course tests load by number stay untouched, or their consumers are
re-pointed in the same PR [m12 impl. 3].

---

## 12. Risks

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| R1 | **The finishable core is too thin for the exam.** A 28–39 h required path may leave learners under-prepared, especially at B2. | Medium / high | The Vorbereitungsstand (§4.6) shows unpractised Teile; the plan recommends optional depth when the date allows; the pilot and the .2 Übungswerte show whether the core is enough; the core can grow by Lernschritte without changing the frame. |
| R2 | **The time model is wrong on real phones** (slow networks, typing on Android). | High / medium | P1 pilot; Q01 recalibration; split rule (never lengthen). |
| R3 | **Habit mechanics feel childish to adults** or drive shallow "streak saving". | Medium / medium | No XP, leagues or currency; the unit of use is a real Lernschritt or real review; numbers, not flames; the weekly goal is the headline. |
| R4 | **FernUSG: reminders, plans and the Wochenbericht could be read as the provider "monitoring learning success".** Memo 13 did not assess them. They measure activity, not understanding, and are automated, but the BGH bar is low and AI is untested [m13 §1–2]. | Low–medium / very high | Wording never says „wir begleiten/prüfen Ihren Lernfortschritt"; reports are automatic and private until the learner shares them; no staff reads them; add this question to counsel's list before B1/B2 launch. The free A1.1 carries no risk. |
| R5 | **Paid courses must not contain an AI that answers questions about the material** [m13 impl. 5]. `explain-answer` is close to that line. | Medium / high | Paid courses show pre-generated, static explanations reviewed with the content; the live function stays in the free A1.1 until counsel clears it. |
| R6 | **Unlimited AI grading costs more than a one-time price covers**; per-call cost is unmeasured [m12 open q. 4]. | Medium / medium | Measure cost in the pilot; a fair-use cap per task per day (e.g. 3 evaluated revisions, design); deterministic pre-checks catch zero-rule failures before any AI call. |
| R7 | **The moat is unproven with our users** (0 AI writing uses in 7 days). | High / high | An AI-scored sentence in Lernschritt 1 of every course; an Aufgabe every Lektion; the per-Lektion AI metric in §10.4; if usage stays low in the pilot, fix the UX before authoring more. |
| R8 | **Review debt after absences** makes returning feel like punishment. | Medium / medium | Daily cap, priority order, shrinking counter, re-entry review (§5.3). |
| R9 | **Content volume and review bottleneck**: 96 Lektionen, ≈ 17,000 scored items (design estimate: 96 × ~180), 20 mocks. The A1.1 ladder needed 23 review rounds. | High / high | The pilot freezes the template first; findings are closed by rules and tests; a 5th round triggers a template fix. |
| R10 | **Low traffic makes A/B tests underpowered** (23 sign-ups in 7 days, db-snapshot). | High / medium | Use pre-registered thresholds and qualitative walkthroughs; A/B-test only high-traffic surfaces (reminders, plan copy). |
| R11 | **Persona split (DaZ in Germany vs DaF abroad)** makes one story or topic alienate half the buyers. | Medium / medium | Fokus-Karten per segment; the swappable Lektionen marked in memo 04 (A1.2 L6 and A2.2 L9 here) chosen by the purpose question. |
| R12 | **Copy drift toward outcome claims** ("finish", "ready", "pass") because the angle is about completion. | Medium / high | Q13 lint runs on every page and e-mail in CI; completion is described as design (12 Lektionen, 20-minute steps), never as a result. |
| R13 | **Audio arrives late** (owner-run Azure per level); TTS must be labelled. | High / low | „Computerstimme" state in the player; browser TTS fallback; one batched run per level. |
| R14 | **Mocks become stale or leak across forms**, inflating Übungswerte. | Medium / medium | Parallel forms only (Q15); the readiness display is a checklist, not a forecast. |

---

## 13. Sources

External sources cited by key. Memo references (`[m01]`–`[m14]`) point to `docs/course-v2/research/`, each of which
carries its own primary URLs.

- **[S1]** Reich & Ruipérez-Valiente 2019, *Science*, doi:10.1126/science.aav7958 — https://doi.org/10.1126/science.aav7958 (3.13 % vs 46 %, via [m09 §12])
- **[S2]** Jordan 2015, "Massive open online course completion rates revisited: Assessment, length and attrition", *IRRODL* 16(3) — https://www.irrodl.org/index.php/irrodl/article/view/2112 ; abstract at https://eric.ed.gov/?id=EJ1067937 (read 2026-09-27: median 12.6 %; first and second weeks critical; longer courses lower completion; auto-graded-only courses higher)
- **[S3]** Villar, Callegaro & Yang 2013 — https://openaccess.city.ac.uk/14427/ (via [m11 §3])
- **[S4]** Duolingo streak PM, Lenny's Podcast transcript — https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md (company-reported)
- **[S5]** Silverman & Barasch 2023, *Journal of Consumer Research* — https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414
- **[S6]** Lally et al. 2010 — https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674
- **[S7]** Harkin et al. 2016, *Psychological Bulletin* — https://doi.org/10.1037/bul0000025
- **[S8]** Kizilcec et al. 2020, *PNAS* — https://doi.org/10.1073/pnas.1921417117
- **[S9]** Yeomans & Reich 2017, LAK '17 — https://dl.acm.org/doi/10.1145/3027385.3027416 (the +29 % figure is from a search snippet, **unverified**)
- **[S10]** Beshears, Lee, Milkman, Mislavsky & Wisdom 2021, *Management Science* 67(7) — https://pubsonline.informs.org/doi/10.1287/mnsc.2020.3706 (search summary read 2026-09-27: routine-window incentives produced fewer gym visits than flexible ones, during and after)
- **[S11]** Dai, Milkman & Riis 2014, fresh-start effect — https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901
- **[S12]** Rey et al. 2019, segmenting — https://doi.org/10.1007/s10648-018-9456-4
- **[S13]** Latimier, Peyre & Ramus 2021 — https://doi.org/10.1007/s10648-020-09572-8 ; Cepeda et al. 2008 — https://eric.ed.gov/?id=ED505660
- **[S15]** Hanus & Fox 2015 — https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000
- **[S16]** Rodrigues et al. 2022 — https://doi.org/10.1186/s41239-021-00314-6
- **[S17]** Nunes & Drèze 2006, figures via Coglode — https://www.coglode.com/nuggets/endowed-progress-effect (secondary)
- **[S18]** Luiten, Ames & Ackerson 1980 — https://journals.sagepub.com/doi/abs/10.3102/00028312017002211
- **[S19]** Baker, Evans & Dee 2016 — https://eric.ed.gov/?id=EJ1194402
- **[S20]** Yancey & Settles 2020, KDD — https://dl.acm.org/doi/10.1145/3394486.3403351
- **[S21]** Gotthilf (Duolingo) on First Round — https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/ (company-reported)
- **[S23]** Fan et al. 2024 — https://arxiv.org/abs/2412.09315
- **[S25]** Russell, performance inequality gap 2026 — https://infrequently.org/2025/11/performance-inequality-gap-2026/
- **[S30]** Bundestag Drs. 21/175 (spouse SD1 figures) — https://dserver.bundestag.de/btd/21/001/2100175.pdf
- **[S31]** Bundestag Drs. 21/5716 (DTZ outcomes) — https://dserver.bundestag.de/btd/21/057/2105716.pdf
- **[S32]** Destatis PD26_186 (naturalisations 2025) — https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html
- **Exam documents** (via memos 01–03): Goethe A1 DB https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf · Goethe A2 DB https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf · Goethe B1 DB https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf · Goethe B2 DB https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf · telc B1 Übungstest https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf · telc B2 Übungstest https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf · g.a.s.t. DTZ Übungssatz https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf
- **Lehrwerke** (via memo 14): Menschen A1 Inhalt https://www.hueber.de/media/36/978-3-19-101901-3_Inhalt.pdf · Schritte plus Neu 1 Inhalt https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010810_Inhalt.pdf · Netzwerk neu A1 clips https://www.klett-sprachen.de/downloads/26407/netzwerk-neu-a1-uebersicht-clips-kapitel-1-12/pdf · Aspekte neu B2 AB-Lösungen https://www.klett-sprachen.de/download/7185/aspekte-neu-b2_ab_loesungen.pdf · Sicher! Konzeption https://hueber.pl/data/products/materials/1563797178_koncepcja.pdf · BAMF Rahmencurriculum https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/KonzepteLeitfaeden/rahmencurriculum-integrationskurs.pdf?__blob=publicationFile
- **Legal** (via memo 13): BGH III ZR 137/25 https://www.bundesgerichtshof.de/SharedDocs/Entscheidungen/DE/Zivilsenate/III_ZS/2025/III_ZR_137-25.pdf?__blob=publicationFile&v=1 · FernUSG https://www.gesetze-im-internet.de/fernusg/BJNR025250976.html · UWG https://www.gesetze-im-internet.de/uwg_2004/BJNR141400004.html · ZFU FAQ https://zfu.de/veranstaltende/faq
- **Local:** `docs/course-v2/inputs/db-snapshot-2026-09-27.md` (row counts, `weekly_metrics` 2026-09-21, search volumes); `src/data/pricing.js`; `src/lib/review/ladder.js`; `src/lib/course/plan.js`; `netlify/functions/course-reminder.mjs`; `netlify/functions/evaluate-writing.mjs`.

**Unverified in this proposal:** the +29 % planning-prompt effect [S9] (snippet); the retention value of a serial
story; that review backlogs drive dropout; Goethe DTO's hours and DOI's task counts (snippets via memo 08); every
minute, count, cap and target labelled *(design)*.
