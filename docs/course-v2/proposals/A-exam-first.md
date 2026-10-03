# Proposal A — Exam-first: eight half-level courses that rehearse the exam you booked

**Date:** 2026-09-27 · **Status:** blueprint proposal (one of several angles) for the course-v2 program, A1.1–B2.2 ·
**Angle:** *exam-first.* The buyer has an exam date. Every Lektion rehearses real exam Teile in miniature, every
half-level ends in an exam-format assessment (a half-mock after the .1 courses, three full timed mocks in the official
format after the .2 courses), and progress is shown as a **Prüfungsstand per module** on the chosen exam's own scale.

**Inputs read in full:** `DECISIONS.md`; `inputs/db-snapshot-2026-09-27.md`; research memos 01–14 (memo 14, the
Lehrwerk teardown, is a required input per the owner decision of 2026-09-27). Repo files read as infrastructure, not
as templates: `src/data/pricing.js`, `src/data/writingTasks.js`, `src/data/mockExams/*`, `src/services/examScoring.js`,
`src/lib/review/ladder.js`, `src/lib/course/plan.js`, `netlify/functions/evaluate-writing.mjs`. The old A1.1 course and
`docs/course-standard-2026-09-12.md` were **not** used as a template (`DECISIONS.md`, 2026-09-26). The W2 drafts in
`docs/course-v2/curriculum/` were seen but not used.

**How to read this document.**
- A fact carries its source URL inline or a memo reference whose memo carries the primary URL (`[01]` =
  `research/01-exams-a1-a2.md`, etc.). A fact I could only see in a search snippet is marked **(snippet)**; anything
  I could not verify is marked **(unverified)**.
- Minutes, item counts, hours, weights and thresholds that are *my design choices* are marked **(design)**. None of
  them is a measurement. The course may only publish hours that were measured on real learners ([08] Impl. 5).
- German examples are my own wording, written in the official task formats. None is copied from an official
  Modellsatz ([01] Impl. 12).

---

## 0. The proposal on one page

1. **The product is the exam path, cut in halves.** Each half-level is a separate one-time purchase (prices from
   `src/data/pricing.js`: A1.1 free, A1.2 €40, A2.1/A2.2 €50, B1.1/B1.2 €60, B2.1/B2.2 €65). The **.1 course** teaches
   the first half of the level and introduces every Teil of the target exam in miniature. The **.2 course** finishes the
   level, brings every Teil to full length, and ends in **three parallel full mocks per exam lane**, scored by that exam's
   real pass rule ([08] Impl. 3, [09] Impl. 11, [10] Impl. 1).
2. **One skills core, several exam lanes.** The course teaches one situational German core per level. An **exam lane**
   (chosen at onboarding: "Welche Prüfung, und wann?") re-skins every exam-shaped item into the exact format of that
   exam: item count, options, play count, reading time, word band, rubric, points and pass rule. The mechanism is a
   catalogue of **23 task families** crossed with **lane profiles** stored as data (§2.1). Launch lanes:
   Start Deutsch 1 (= Goethe A1 = telc A1), Goethe A2, telc A2, telc B1, DTZ, Goethe/ÖSD B1, telc B2, Goethe B2.
3. **Every Lektion is a week of German around one situation, and it always touches the exam.** 12 Lektionen per
   half-level (the Menschen/Netzwerk/Lingoda grain, [14] §G1), each with 3–5 can-dos, a *Prüfungsfokus* of 2–4 exam
   Teile, four 20-minute Lernschritte that each end in a *Mini-Teil*, one *Aufgabentraining* with a full-format
   Schreiben and Sprechen Teil graded by AI on the lane rubric, and a timed *Teil-Probe* in exam mode (§3).
4. **A Prüfungsstation after every third Lektion** (the Modul-Plus/Plateau cadence, [14] §E6) runs one full-length Teil
   per module, plus a longer read and a scene of the serial story (§4).
5. **Progress = Prüfungsstand per module**, on the exam's own scale with the official pass line drawn as a hairline,
   built only from exam-mode attempts, labelled „Übungswert — keine Prognose" (§4.3). No XP, no pass probability,
   no "bereit".
6. **AI grading is the moat and stays formative.** ≥56 AI-scored productive tasks per half-level (design), against
   ~30 human-marked open tasks per half-level in Goethe's €729 DOI **(snippet, [08] §2.5)**. Deterministic zero-rules
   (word count, Leitpunkte, Anrede/Gruß/Betreff, register) run before the AI; results are never a gate, never on a
   certificate, and always read „Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein
   Prüfungsergebnis. Richtwert." ([13] Impl. 3–4).
7. **The date drives the plan.** A backwards plan places the diagnostic mini-mock in week 1 of each .2 course and the
   three mocks in the last three weeks before the exam date, with no new content in the final week ([09] Impl. 11).
   A *Wiederholungsplan* turns an official failed score into a 4-week plan weighted to the weak parts ([10] Impl. 4).
8. **Lead with the spouse-visa A1 buyer** (English pages for India), then **B1 "zum Bleiben"** (German pages, telc/DTZ
   first by German search demand), then A2, then B2 ([10] §7; [02] §5). Production order follows (§10).

---

## 1. Product and positioning

### 1.1 Who buys, and what forces the purchase

| Segment | Size and trigger (source) | Exam and deadline | Our entry point |
|---|---|---|---|
| **Spouse visa (lead)** | 35,720 Goethe Start Deutsch 1 exams for spouses in 2024, 62 % passed, 89–90 % external candidates; ≈13,400 failed attempts (derived) ([Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf), [10] §2.1) | SD1 (Goethe/telc) or ÖSD A1; BAMF lists SD1, ÖSD „Grundstufe Deutsch 1" and TestDaF, the embassy decides ([BAMF leaflet](https://www.bamf.de/SharedDocs/Anlagen/DE/MigrationAufenthalt/Ehegattennachzug/ehegattennachzug.pdf?__blob=publicationFile&v=9)) | free A1.1 → A1.2 (€40) |
| **Bleiben (B1)** | 332,500 naturalisations in 2025 ([Destatis PD26_186](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html)); 318,550 DTZ candidates in 2025, 55.0 % reached B1 ([Drucksache 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf)) | B1 for §10 StAG and §9 AufenthG ([§10 StAG](https://www.gesetze-im-internet.de/stag/__10.html)); DTZ only inside the Integrationskurs system ([gast.de](https://www.gast.de/de/forschung-entwicklung/entwicklung/auftraege/deutsch-test-fuer-zuwanderer-dtz)) | B1.1 + B1.2 (€120) |
| **Work entry (A2)** | Anerkennungspartnerschaft entry with A2 (snippet, [Make it in Germany](https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/visum-anerkennungspartnerschaft)); A2 for non-qualified Ausbildung ([10] §2.5) | Goethe A2 / telc A2 | A2.1 + A2.2 (€100) |
| **Recognition, study bridge (B2)** | 32,000 nurse recognitions in 2025 ([Destatis PD26_295](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html)); Studienkolleg needs „solide … B2" ([03] §5) | telc B2 / Goethe B2 (DTB B2 later) | B2.1 + B2.2 (€130) |

**Why exam-first fits these buyers.** People search for the exam, not the course: in India "goethe a1 exam" gets
27,100 searches/month against 1,300 for "german a1 course"; in Germany "b1 prüfung" and "telc b1 prüfung" get 12,100
each against 390 for "deutschkurs b1 online" (DataForSEO, `inputs/db-snapshot-2026-09-27.md`, [02] §5). A course that
is organised, sold and measured by exam Teile speaks the buyer's own search language.

### 1.2 What we sell per half-level

| Half-level | Price | Role on the exam path | Closing assessment | Lanes at launch |
|---|---|---|---|---|
| **A1.1** | free | First half of Start Deutsch 1. All 11 SD1 Teile in miniature; Sprechen 1, Schreiben 1, Lesen 3, Hören 1 at full length ([01] Impl. 10) | **SD1-Halbtest** + dated plan to the exam | SD1 |
| **A1.2** | €40 | Completes Start Deutsch 1; covers the full Goethe A1 grammar inventory ([06] Impl. 3) | Diagnose + **3 full SD1 mocks** (65 + 15 min) + Wiederholungsplan | SD1 · ÖSD ZA1 pack in v1.1 |
| **A2.1** | €50 | First half of A2. Goethe A2 S1, Sp1–2 and telc A2 H1 at full length ([01] Impl. 10) | **A2-Halbtest** per lane | Goethe A2 · telc A2 |
| **A2.2** | €50 | Completes A2 (A2+ conversation and connected writing, [04] F1) | Diagnose + **3 full mocks per lane** (Goethe A2 90 + 15 min) | Goethe A2 · telc A2 |
| **B1.1** | €60 | First half of B1. The six task families shared by Goethe, telc and DTZ at reduced length ([02] §6) | **B1-Halbtest** per lane | telc B1 · DTZ · Goethe/ÖSD B1 |
| **B1.2** | €60 | Completes B1; every B1 Teil at full length ([05] Impl. 7) | Diagnose + **3 full mocks per lane** + Wiederholungsplan | telc B1 · DTZ · Goethe/ÖSD B1 |
| **B2.1** | €65 | First half of B2. Both B2 writing genres and three speaking genres at reduced length ([03] Impl. 10) | **B2-Halbtest** per lane | telc B2 · Goethe B2 |
| **B2.2** | €65 | Completes B2; exam-length texts, full timings ([03] Impl. 10) | Diagnose + **3 full mocks per lane** | telc B2 · Goethe B2 · DTB B2 in v1.1 |

**Honesty rule for the .1 courses.** An opening half never implies exam readiness. Its page says, in its first
screen: „A2.1 ist die erste Hälfte des Wegs zur A2-Prüfung. Alle Prüfungsteile lernen Sie hier kennen; die komplette
Prüfung üben Sie in A2.2." ([10] Impl. 1, [03] Impl. 10).

**Access and billing.** One-time price, no auto-renewal, no credits, no expiry; lifetime access defined in the terms
as access for as long as the platform operates ([08] Impl. 9, [13] Impl. 16). The plan survives a moved exam date.

### 1.3 Why this beats the field

The teardown found that **teachers and graders are sold as separate products**: courses teach but never score exam
output; mock apps score but barely teach; humans do both but ration it ([08] §4).

| Alternative (source) | What the buyer gets | What exam-first adds |
|---|---|---|
| **vhs-Lernportal**, free, BAMF-recognised, 12 Lektionen × 15 Lerneinheiten per level, online tutors ([Infoblatt](https://www.vhs-lernportal.de/wws/bin/4007242-4008322-1-infoblatt_a1-b1.pdf)) | Broad Integrationskurs teaching; no exam-criteria scoring, no graded speech ([08] §2.7) | Every Schreiben and Sprechen Teil scored on the booked exam's criteria, instantly; the exam's pass rule on the board |
| **Goethe DOI**, €729 per level, 70–100 h, tutor by e-mail, ZFU-registered ([Kurskalender 2026](https://www.goethe.de/resources/files/pdf354/kurskalender_2026-v3.pdf); [fernstudi.net](https://www.fernstudi.net/weiterbildung/fremdsprachen/deutsch/11835)) | Human feedback on ~30 open tasks per half-level **(snippet)** | ≥56 automated scored productive tasks per half-level (design), for €40–65, plus three full mocks per lane |
| **Goethe DTO**, €149 promo, now with „KI-Sprechtraining" **(snippet, [08] §2.5)** | Self-study plus AI dialogue; whether it rehearses exam Teile is unknown | Speaking rehearsed Teil by Teil with the exam's interaction pattern (cards, planning, presentation, discussion) |
| **AI mock apps** (TestGerman, DeutschExam, Viobean, Papagei, Goethe Trainer, PrepMyFuture), €7–25 or €9.99 lifetime ([08] §2.11) | Mocks and scoring, thin teaching, outcome marketing ("passed with 82 %", "pass probability gauge") | A full course (teach → test → repair) and an honest board that never predicts a pass |
| **Lingoda**, 50 live classes per sub-level, €254–600 per sub-level (derived, [08] §2.4) | Live speaking practice, no exam-format tasks | Exam-format output every Lektion, on your schedule, dated to your exam |
| **Babbel** (~15 lessons at B1), **Busuu**, **Duolingo** ([08] §2.1–2.3) | General courses; no exam Teile; AI conversation moving down-tier | Depth exactly where demand peaks (B1, B2), with the Teile of telc, DTZ and Goethe |

**The positioning line** (after [10] §7): *„Der Kurs, der auf Ihre Prüfung zuläuft — und jede Schreib- und
Sprechaufgabe sofort nach den veröffentlichten Kriterien Ihrer Prüfung auswertet. Automatisch, als Richtwert."* The
English version for India: *"The course that runs to your exam date, and scores every speaking and writing task
against your exam's published criteria, instantly. An automated practice score, never an exam result."* Memo 08's
draft headline "the way your exam does" is not used: until agreement with human raters is measured, no copy may
suggest the AI grades like an examiner ([13] Impl. 10).

### 1.4 The promise and its legal edge

The course is **self-study material plus automated practice software** ([13] Impl. 1). Exam-first raises the
stakes on five edges, so the proposal fixes them in the design, not only in the copy:

| Edge | Rule in this blueprint | Source |
|---|---|---|
| FernUSG „Überwachung des Lernerfolgs" | No human in the paid learning loop; no Fragerecht about content; AI scores formative, private, retryable, never a gate; no score on any document | [13] §1–2, Impl. 2–5; [BGH III ZR 137/25](https://www.bundesgerichtshof.de/SharedDocs/Entscheidungen/DE/Zivilsenate/III_ZS/2025/III_ZR_137-25.pdf?__blob=publicationFile&v=1) Rn. 34 |
| UWG outcome claims | The board shows practice values on the exam scale and states the official rule; it never says „bestanden", „bereit", a probability, or „in X Wochen" | [13] §5, Impl. 9 |
| Exam marks and endorsement | Exam names only in purpose phrases („Vorbereitung auf …", „im Prüfungsformat von …", „kein offizielles Prüfungsmaterial"); no logos; no product title that begins with a mark | [13] Impl. 8; [§23 MarkenG](https://www.gesetze-im-internet.de/markeng/__23.html) |
| AI Act | AI-interaction notice at first contact (Art. 50(1), applies since 2 Aug 2026); AI scores do not steer the path automatically (Annex III 3(b), obligations from 2 Dec 2027) | [13] §4 |
| Certificates | A „Teilnahmebescheinigung" listing completed Lektionen only, with the fixed line „Kein Sprachzertifikat. Kein Ergebnis des Goethe-Instituts, von telc oder ÖSD. Nicht als Sprachnachweis für Visum, Aufenthalt oder Einbürgerung geeignet." | [13] Impl. 7 |

---

## 2. Course architecture

### 2.1 The exam layer: task families × lane profiles

**Task families** are the exam task types that recur across providers. The core course teaches families; a lane
profile renders each family in its exam's exact format. Families are my grouping of the Teil maps in [01] §7, [02] §6–7
and [03] §7 **(design)**.

| Family | What the learner does | Teile it renders (lane · Teil) |
|---|---|---|
| **H-DETAIL** | catch numbers, times, places in short dialogues/messages | SD1 H1, H3 · Goethe A2 H1 · telc A2 H1 (write notes) · Goethe B1 H1 · telc B1 HV3 · DTZ H1–2 · Goethe B2 H1 |
| **H-DURCHSAGE** | follow a public announcement, often played once | SD1 H2 (1×) · Goethe A2 H1 · DTZ H1 (1×) · telc B2 HV3 (1×) |
| **H-GESPRÄCH** | details in a connected conversation, R/F or MC | Goethe A2 H2, H3 (1×) · telc A2 H3 · Goethe B1 H3 (1×) · telc B1 HV2 · DTZ H3 |
| **H-MEINUNG** | attribute opinions to speakers | Goethe B1 H4 · telc B1 HV1 (1×) · DTZ H4 · Goethe B2 H3 (1×) |
| **H-VORTRAG** | follow an interview, tour or lecture | Goethe A2 H4 · Goethe B1 H2 (1×) · Goethe B2 H2, H4 · telc B2 HV1–2 (1×) |
| **L-KURZTEXT** | verify details in notes, e-mails, a blog post | SD1 L1 · telc A2 L2 · Goethe B1 L1 |
| **L-ANZEIGEN** | match needs to ads, with a no-match option | SD1 L2 (a/b) · Goethe A2 L4 (X) · telc A2 L3 · Goethe B1 L3 (0) · telc B1/B2 LV3 (x) · DTZ L2 |
| **L-ORIENTIERUNG** | read signs, directories, timetables | SD1 L3 · Goethe A2 L2 („anderes Stockwerk") · telc A2 L1 · DTZ L1 |
| **L-ARTIKEL** | detail and argument in a press text | Goethe A2 L1, L3 · Goethe B1 L2 · telc B1 LV2 · Goethe B2 L3 · telc B2 LV2 |
| **L-STANDPUNKT** | identify a writer's stance | Goethe B1 L4 · Goethe B2 L1, L4 |
| **L-REGELN** | understand rules and instructions | Goethe B1 L5 · DTZ L4 · Goethe B2 L5 |
| **L-ÜBERSCHRIFT** | match headlines to texts (gist) | telc B1 LV1 · telc B2 LV1 |
| **L-TEXTLÜCKE** | insert sentences into a text (cohesion) | Goethe B2 L2 |
| **SB-LÜCKE** | grammar and lexis gaps in a letter | telc B1 SB1–2 · DTZ L5 · telc B2 SB1–2 |
| **W-FORMULAR** | transfer data into a form | SD1 S1 · telc A2 S1 |
| **W-NACHRICHT** | short message on 3 Leitpunkte (20–40 words) | SD1 S2 · Goethe A2 S1, S2 · telc A2 S2 (3 of 4) · Goethe B1 Sch3 |
| **W-MAIL** | e-mail on 3–4 Leitpunkte (50–150 words) | Goethe B1 Sch1 · telc B1 SA · DTZ Schreiben (A/B) · Goethe B2 S2 · telc B2 SA (A/B, 3 of 4) |
| **W-MEINUNG** | argued opinion / forum post | Goethe B1 Sch2 · Goethe B2 S1 |
| **S-VORSTELLEN** | introduce yourself (+ spell, number) | SD1 Sp1 · telc A2 Sp1 · telc B1 M1 · DTZ S1 |
| **S-FRAGEKARTEN** | ask and answer with word cards | SD1 Sp2 · Goethe A2 Sp1 · telc A2 Sp2 |
| **S-BITTEN** | make requests with picture cards, react | SD1 Sp3 |
| **S-ERZÄHLEN / S-FOTO** | talk about your life, an experience, a photo (+ home country) | Goethe A2 Sp2 · telc B2 M1 · DTZ S2 (photo, no prep) |
| **S-PLANEN** | plan and negotiate together, assign tasks | Goethe A2 Sp3 · telc A2 Sp3 · Goethe B1 Sp1 · telc B1 M3 · DTZ S3 · telc B2 M3 |
| **S-PRÄSENTIEREN** | structured monologue, then questions/feedback | Goethe B1 Sp2 + Sp3 · Goethe B2 Sp1 |
| **S-DISKUTIEREN** | report an opinion or argue pro/contra | telc B1 M2 · Goethe B2 Sp2 · telc B2 M2 |

**Lane profiles** hold the exam facts. Each is a data file with a „Stand" date and its sources, so a format change is
a data edit and a test run, not a content rewrite (§8).

| Lane | Written part (plays) | Oral part | Pass rule the scorer implements | Source |
|---|---|---|---|---|
| **SD1** = Goethe-Zertifikat A1: Start Deutsch 1 = telc Deutsch A1 | 65 min, no break. Hören ~20 min, 6/4/5 items, **H2 1×**; Lesen 25 min, 5/5/5; Schreiben 20 min: form (5) + message ~30 words | 15 min, group of up to 4, no preparation; 3 + 6 + 6 points; questions/requests 2 points, answers/reactions 1 | Goethe: raw × 1.66 → 100; ≥60 overall, no per-part floor; <35 written cannot be rescued. telc: 36/60. Not modular | [DB-A1](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf), [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf), [UT-A1](https://shop.telc.net/media/catalog/product/file/2/0/20210103_5070-b00-010106_web_1.pdf) |
| **ÖSD ZA1** (v1.1) | 55 min. Lesen 16 items, Hören 15 (H1, H3 1×), Schreiben form + reply ≥25 words | ~10 min, individual, **10 min preparation with notes**; 4 of 6 topics, photo, role play | written ≥38/75 with Lesen ≥6/30, Hören ≥6/30, Schreiben ≥4/15; oral ≥12/25; modular | [DB-ZA1](https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf) |
| **Goethe A2** | 90 min, no break. Lesen 30 (4 × 5), Hören ~30 (4 × 5, **H2, H3 1×**), Schreiben 30: SMS 20–30 words + e-mail 30–40 words | 15 min, pair, no preparation | ≥60/100 **and** ≥45/75 written **and** ≥15/25 oral; below 50 % of the words a writing task is graded E = 0 | [DB-A2](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf), [US-A2](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) |
| **telc A2** (= Start Deutsch 2) | Hören ~20 (3 × 5; H1 phone notes, **H2 1×**); Lesen + Schreiben 50: form + ~40-word letter choosing 3 of 4 points; paper only | ~15 min, pair, no preparation; 3 + 6 + 6 | 36/60; not partial; numbers must be exactly right | [UT-A2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) |
| **telc B1** (Zertifikat Deutsch) | 150 min: Lesen + Sprachbausteine 90 (60 items), Hören ~30 (**HV1 1×**), Schreiben 30 (e-mail, 4 Leitpunkte, 45 points); item points 5 / 2.5 / 1.5 | ~15 min, pair, **20 min preparation**; 15 + 30 + 30 | ≥135/225 written **and** ≥45/75 oral; free compensation inside the written part | [telc UT B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) |
| **DTZ** (only for Integrationskurs participants) | 100 min, no break: Hören ~25 (20 items, **all 1×**), Lesen 45 (25 items incl. 6-gap letter), Schreiben 30 (A or B, 4 Leitpunkte) | ~16 min, pair, **no preparation**; photo + home country; planning = 20 of 50 task points | B1: Hören+Lesen ≥33/45, Schreiben ≥15/20, Sprechen ≥75/100; B1 certificate = Sprechen B1 + B1 in one of the other two; Sprechen below A2 = no certificate | [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) |
| **Goethe/ÖSD B1** (modular) | Lesen 65 (30 items), Hören ~40 (30; **H2, H3 1×**), Schreiben 60 (~80 + ~80 + ~40 words; 40 + 40 + 20 points) | ~15 min, pair, **15 min preparation**; 28 + 40 + 16 + Aussprache 16; Teil 2 = 5 fixed slides | each module ≥60/100; Lesen/Hören raw × 3.33 → 18/30 passes; E in Erfüllung zeroes a writing task | [DFB B1](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf), [Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) |
| **telc B2** | 140 min: Lesen + Sprachbausteine 90, Hören ~20 (**all 1×**), Schreiben 30: e-mail ≥150 words, 3 of 4 Leitpunkte (or 2 + own), with Betreff | ~15 min, pair, 20 min preparation; 3 × 25 (Ausdruck 7, Aufgabe 7, Richtigkeit 7, Aussprache 4) | ≥135/225 written **and** ≥45/75 oral | [telc UT B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) |
| **Goethe B2** (modular) | Lesen 65 (9/6/6/6/3), Hören ~40 (10/6/6/8; **H1, H3 1×**), Schreiben 75: forum post ~150 words (60 pts) + message to a superior ~100 words (40 pts) | ~15 min, pair, 15 min preparation; Vortrag ~4 min + questions; pro/contra discussion; Aussprache 16 | each module ≥60/100; E zeroes a writing task | [DFB B2](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf), [Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) |
| **DTB B2** (v1.1) | Lesen, Lesen + Schreiben (reply to a complaint on a team lead's instruction), Hören, Telefonnotiz, Sprachbausteine + intranet forum post | ~16 min, no preparation, includes restating a partner's point | ≥144/240 and 3 of 4 skills ≥60 %, the fourth 40–60 % | [BAMF DTB Übungstest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10) |

**Launch scope and why.**
- **A1:** SD1 serves Goethe and telc with one item bank ([01] key finding). ÖSD ZA1 ships in v1.1 as an *adapter
  pack* (its six own task types plus the 10-minute prep oral), because ÖSD A1 is on the BAMF spouse-visa list but its
  demand is unmeasured.
- **A2:** Goethe A2 and telc A2 both at launch, because their task types do not transfer (phone notes, 3-of-4 letter,
  W-cards; [01] Impl. 1). ÖSD ZA2 deferred.
- **B1:** all three at launch. German demand runs telc ≫ DTZ > Goethe ("telc b1 prüfung" 12,100, "dtz" 4,400, "goethe
  b1 prüfung" 1,900; [02] §5). The DTZ lane is labelled „nur für Teilnehmende am Integrationskurs" and is chosen only
  after an explicit question ([02] §3). ÖSD ZB1 is the Goethe exam and needs no lane ([02] §4).
- **B2:** telc B2 (8,100/month) and Goethe B2 (1,300) at launch; DTB B2 (880 + 590) in v1.1 ([03] §6).

### 2.2 The shape of a half-level

| | .1 course (A1.1, A2.1, B1.1, B2.1) | .2 course (A1.2, A2.2, B1.2, B2.2) |
|---|---|---|
| Week 0 | *Einstiegscheck* (≤10 min, adaptive, partial credit) + *Prüfungsziel* screen | *Diagnose*: a lane mini-mock, one Teil per module at full length (30–45 min) — seeds the board |
| Lektionen | 12, one per week at standard pace | 12, one per week at standard pace |
| Stationen | after L3, L6, L9 | after L3, L6, L9 |
| Close | *Halbtest* after L12 (every Teil of the lane, about half the items, .1 content only), then the plan into the .2 course | *Prüfungswochen*: Modelltest A → repair → Modelltest B → repair → Modelltest C; last 7 days before the exam without new content ([09] Impl. 11) |
| Retake | — | *Wiederholungsplan* (A1.2, B1.2 at launch; A2.2, B2.2 in v1.1) |

**Hours per half-level (design, to be replaced by measured values before publication).**

| | A1.1 | A1.2 | A2.1 | A2.2 | B1.1 | B1.2 | B2.1 | B2.2 |
|---|---|---|---|---|---|---|---|---|
| Lektionen (incl. daily review) | 34 | 35 | 38 | 38 | 41 | 42 | 44 | 45 |
| Stationen | 3 | 3 | 3.5 | 3.5 | 4 | 4 | 4.5 | 4.5 |
| Close (Halbtest, or Diagnose + 3 mocks + repair) | 1.5 | 8 | 2 | 9.5 | 2.5 | 14 | 3 | 15 |
| **Total ≈** | **38 h** | **46 h** | **44 h** | **51 h** | **48 h** | **60 h** | **52 h** | **65 h** |

Benchmarks: Menschen ≈48 UE (≈36 h) per Teilband ([14] §B1); Lingoda 50 class hours per sub-level
([pricing](https://www.lingoda.com/en/pricing/)); BAMF 100 UE ≈ 75 h per half-level (derived, [08] §2.13);
memo 08's design target ≈60 h. The .2 courses carry the mock weeks, so they run longer.

### 2.3 Precedence rules (how a Lektion's content is decided)

1. **The teaching order is situational.** Each Lektion is one *Handlungssituation* ordered as a Handlungskette, as the
   Rahmencurriculum prescribes: „nicht vorrangig nach einer morpho-syntaktischen Progression … sondern … an
   Handlungsketten" (RC §6.3, [04] F2). The exam never *is* the Lektion; it rides on it.
2. **Situations are picked for their exam text types.** Among the situations the Lehrwerke agree on, each Lektion
   uses the one whose natural texts are exam text types: an announcement at the station (H-DURCHSAGE), a flat ad
   (L-ANZEIGEN), a message to the course leader (W-NACHRICHT).
3. **Topic placement follows the Lehrwerk consensus** in [14] §C (Menschen M, Schritte S, Netzwerk neu N, Sicher! Si,
   Aspekte neu As). Where the books split, choose the placement that brings the exam Teil earlier, and log the reason.
4. **Can-do boundary conflicts:** if the target exam tests a can-do at this level, it belongs to this level;
   otherwise the RC's lowest-level assignment decides ([04] Impl. 3).
5. **Grammar follows the per-half-level consensus** of [06] F3; the exam inventory is the floor of each closing half
   (GZ-A1 inventory complete by the end of A1.2; GZ-A2 inventory by the end of A2.2; [06] Impl. 3, F2).
6. **Exam weight shapes practice time, not the topic.** SD1 Sprechen gives 2 points per question or request and 1 per
   answer ([TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) pp. 49–52),
   so every A1 Lektion drills question and request forms. Planning together is 30/75 oral points in telc B1 and 20 of
   the 50 DTZ task points ([02] §2–3), so S-PLANEN is the speaking spine of every B1 Lektion.

### 2.4 The serial cast (one story per CEFR band, each person on an exam path)

Memo 14 steals the serial cast from Schritte and Nicos Weg ([14] §E3). Exam-first gives the story its engine: each main
character is preparing the same exam as the learner, so the story models the plan, the nerves, the mock and the retake.
Scenes are ≤2 min with a task on every scene ([14] §F5).

| Band | Cast (design) | Why this cast |
|---|---|---|
| A1 | **Priya** (Pune → Köln, marrying Jonas, SD1 date in 10 weeks), **Emre** (Izmir, her online course partner, sitting SD1 for the second time), **Frau Lang** (course leader), **Jonas** | Mirrors the lead segment (India, Turkey = largest spouse origins, [10] §2.1); A1.1 plays mostly online and in Pune, A1.2 in Köln |
| A2 | Priya's first job in Köln; **Emre** arrives with an Ausbildung visa; neighbours **Familie Brandt** | Work entry and neighbourhood (RC A2 weight on Arbeit, Kinder, Arbeitssuche, [04] F2) |
| B1 | Leipzig: **Amal** (Einbürgerung, telc B1), **Tomasz** (Integrationskurs, DTZ), **Lina** (in Kraków, Goethe B1 for an Ausbildung visa) | One character per B1 lane, so every lane has its own storyline |
| B2 | A care home and an IT team in Hamburg: **Daniel** (nurse, recognition, telc B2), **Sara** (Studienkolleg, Goethe B2) | B2 work communication with two care Lektionen at general-language level ([10] Impl. 5); never Fachsprache |

### 2.5 A1.1 — „Kontakt und Person" (free; SD1 first half)

Key: **bold** = the Teil runs at full length in this Lektion; otherwise it runs as a Mini-Teil. Leaders = where the
Lehrwerke put the topic ([14] §C: M = Menschen, S = Schritte plus Neu, N = Netzwerk neu).

| Nr | Lektion (working title) | Situation · Handlungsfeld | Leaders | Prüfungsfokus (SD1) | New grammar ([06] F3) |
|---|---|---|---|---|---|
| 1 | Hallo! Ich bin Priya. | greet, introduce yourself, country, languages · D Soziale Kontakte | M1, S1, N1 | **Sprechen 1** (vorstellen); Hören 1 (names, countries) | Präsens Sg., sein, W-Frage, V2, du/Sie |
| 2 | Wie schreibt man das? | spell, numbers, phone number, a form · Ämter | M2, S1-E, N2 | **Schreiben 1** (form); **Sprechen 1** (spell, number); Hören 1 (numbers) | Konjugation Pl., Zahlen bis 100, nicht (Einstieg) |
| 3 | Meine Familie | family, describe people · D | M3, S2, N5 | Sprechen 2 (card „Familie"); Lesen 1 (note) | mein/dein/Ihr, Ja/Nein-Frage, ja/nein/doch, Vokalwechsel |
| 4 | Was kostet das? | buy food, prices · Einkaufen | M4–5, S3, N4 | **Hören 1** (prices); Hören 2 (supermarket announcement, played once); Sprechen 3; Lesen 2 | Artikel, ein/kein, Plural, möchte |
| 5 | Meine Wohnung | describe a flat, read a flat ad · Wohnen | S4 (split: M14, N9 = A1.2) | **Lesen 2** (two ads, a/b); Lesen 1 | er/es/sie für Dinge, Adjektiv prädikativ, nicht vs. kein |
| 6 | Ich brauche einen Laptop | things at work and in class, asking for things · Arbeit | M5–6 | **Sprechen 3** (picture cards); Schreiben 2 (2 Leitpunkte, ~20 words) | Akkusativ (den/einen/keinen) |
| 7 | Mein Tag | clock time, daily routine, opening hours · Unterricht | M8, S5, N5 | **Lesen 3** (signs); Hören 3 (voicemail: day, time) | trennbare Verben, am/um/von … bis, Inversion |
| 8 | Hast du am Samstag Zeit? | arrange to meet, free time · D | M7–8, S6, N6 | Schreiben 2 (3 Leitpunkte, ~25 words); **Sprechen 2** (card „Freizeit"); Hören 3 (voicemail: a date) | können, Satzklammer, Akkusativ (Wdh.) |
| 9 | Im Café | order, likes and dislikes · Einkaufen | M9, N4 | **Sprechen 3** (order, request); Hören 1 | mögen/möchte, Komposita, Vokalwechsel (essen, nehmen) |
| 10 | Mit Bus und Bahn | tickets, platforms, announcements · Mobilität | M10, N3 | **Hören 2** (station announcements, 1×); Lesen 3 (station signs) | trennbare Verben (einsteigen, umsteigen), wohin?, Imperativ Sie (Chunk) |
| 11 | Wie war dein Wochenende? | tell what you did; post an online greeting · D | M11–12, S7 | **Schreiben 2** (~30 words); Lesen 1 (e-mail); Sprechen 2 | Perfekt with haben/sein as 8 chunk verbs; war/hatte as chunks |
| 12 | Deutsch lernen: was ich schon kann | learning in a course, goals; *Fokus Familie*: a Kita form | RC Unterricht (15 A1 goals, [04] F2); split S7 Kinder/M12 Feste | **Sprechen 1** (complete); Schreiben 1 (course registration form); **SD1-Halbtest** | Wiederholung |

**Deviations, logged.** Wohnen sits in A1.1 (Schritte placement), not A1.2 (Menschen, Netzwerk), because SD1 Lesen 2's
flat-ad pairs are low-grammar and early exposure to L2 helps the whole pair. L12 takes the *Unterricht* field instead of
Schritte's *Kinder und Schule* (DaZ) or Menschen's *Feste* (DaF): it is DaF/DaZ-neutral, and the Kita form moves into
an optional *Fokus Familie* card ([14] §E8). The Perfekt enters as chunks at the end of A1.1 (Hueber placement) and
becomes systematic in A1.2 (Klett placement), which covers both families ([06] Impl. 2).

### 2.6 A1.2 — „Den Alltag organisieren" (€40; completes SD1)

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus (SD1) | New grammar |
|---|---|---|---|---|---|
| — | *Diagnose* | SD1 mini-mock, one Teil per module at full length | — | H1, L2, S2, Sp2 | — |
| 1 | Mein Arbeitsalltag | job, working hours, colleagues · Arbeit | S8, N7 | **Lesen 1** (colleague's e-mail); Sprechen 1 (+ Beruf, früher) | war/hatte, müssen/wollen |
| 2 | Wie komme ich zum Rathaus? | ask and give directions · Mobilität | M13, M15, S11 | Hören 1; **Lesen 3** (signposts) | Dativ after mit/zu/bei/aus/von/nach; Wo? + Dativ ([06] Impl. 4) |
| 3 | Einen Termin machen | appointments at the office and the surgery · Ämter, Gesundheit | S9, M16 | **Hören 3** (voicemails: surgery, office); **Schreiben 1** (registration form) | vor/nach/in/ab/bis, Imperativ Sie |
| 4 | Beim Arzt | body, symptoms, pharmacy · Gesundheit | M18, S10, N8 | **Sprechen 3** (Rezept, Termin); Lesen 3 (pharmacy sign) | sollen, sein/ihr, *mir tut … weh* |
| 5 | Ich bin krank – ich sage ab | call in sick, apologise · Arbeit, Unterricht | RC 84, 149 (A1) | **Schreiben 2** (Absage); Hören 3; Sprechen 3 | denn, Perfekt systematisch |
| 6 | Wohnung gesucht | flat ads, neighbours, house rules · Wohnen | M14, N9 | **Lesen 2**; **Lesen 3** (notice); Sprechen 3 | dürfen/müssen, man, Genitiv-s bei Namen |
| 7 | Die Jacke gefällt mir | buy clothes, compare, pay a compliment · Einkaufen | M22, S13, N11 | **Sprechen 2** (card „Kleidung"); **Hören 1** (floor, price) | welch-/dies-, gefallen/passen, gut/besser/am besten |
| 8 | Bahnhof und Flughafen | tickets, platforms, delays · Mobilität | N12, RC 142–145 | **Hören 2** (station, airport); Lesen 2 (websites) | Perfekt mit sein, official time (14:35 Uhr) |
| 9 | Online bestellen, Geld abheben | order form, bank transfer, cash machine · Banken, Einkaufen | RC 110–111, 125 | **Schreiben 1** (order form, IBAN); Lesen 1 | Akkusativpronomen, Imperativ in Anleitungen |
| 10 | Kannst du mir helfen? | household, rules, help from neighbours · Wohnen | M20–21 | **Sprechen 3** (du/ihr requests); Lesen 3 | Imperativ du/ihr, *nicht müssen* ≠ *nicht dürfen*, helfen/danken/gehören |
| 11 | Wetter, Wochenende, Ausflug | weather, events, last weekend · Medien | M23, N12 | Hören 2 (weather, event); **Schreiben 2** (accept an invitation); Lesen 1 | Perfekt untrennbar/-ieren; war/hatte (Wdh.) |
| 12 | Feste und Glückwünsche | dates, invitations, congratulations, offering *du* · D | M24, S14 | **Sprechen 1–3** (group oral, complete); **Schreiben 2** | Ordinalzahlen/Datum, würde/könnte/hätte gern (chunks), Wortbildung -er/-in/-ung |
| — | *Prüfungswochen* | Modelltest A, B, C (65 + 15 min) + repair | — | all 11 Teile | — |

A1.2 closes the Goethe A1 grammar inventory: all six modal verbs, Imperativ du/ihr/Sie, war/hatte, Perfekt of the
listed verbs, danken/gehören/helfen, dies-/welch-, Genitiv-s with names, -er/-ung/-in ([06] F2, pp. 102–106 of
[TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf)). **ÖSD ZA1 pack (v1.1):**
six Teil-Trainer (ads with a distractor, JA/NEIN, sign → picture, note-taking, prep-with-notes oral with photo and role
play) and one ZA1 mock scored per module with its floors ([01] Impl. 1).

### 2.7 A2.1 — „Kontakte pflegen, Dinge erledigen" (€50; A2 first half)

Primary lane Goethe A2; the telc A2 rendering is given in brackets where it differs.

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus | New grammar |
|---|---|---|---|---|---|
| 1 | Neu in Köln | arriving, telling your story · A, D | M1, S3-L1, N1 | **Sprechen 2** (your life; [telc: Sp1 + follow-ups]); Lesen 3 (personal e-mail) | Perfekt review (separable, inseparable, -ieren), weil |
| 2 | Wohin mit dem Sofa? | moving, furnishing, neighbours · Wohnen | M2, S3-L2 | **Hören 2** (days → pictures, 1×); Sprechen 3 (plan the move) | Wechselpräpositionen via stellen/stehen, legen/liegen, hängen ([06] Impl. 5) |
| 3 | Kurs, Schule, Ausbildung | education, learning languages · Aus-/Weiterbildung | N2, S3-L6 | **Sprechen 1** (word cards); Lesen 1 (newspaper text) | Präteritum der Modalverben, dass |
| 4 | Online bestellt – und jetzt? | buying online and by phone · Einkaufen | M4, S3-L3, RC 124 | **Lesen 4** (ads with X; [telc: Lesen 3]); **Schreiben 2** (e-mail 30–40 words) | Adjektivdeklination nach unbestimmtem Artikel, Komparation |
| 5 | Einen Tisch reservieren | restaurant, booking, complaining politely · Einkaufen | M10, RC 125 | Hören 3 (short conversations, 1×); Sprechen 1 | Adjektive nach bestimmtem Artikel, Häufigkeit |
| 6 | Was ist los am Wochenende? | city, culture, programmes · Freizeit | M5–6, N5 | **Lesen 2** (programme, „anderes Stockwerk"; [telc: Lesen 1]); Hören 1 (radio) | über, von … an; Adjektive ohne Artikel |
| 7 | Am Telefon im Job | workplace calls, messages · Arbeit | M9, M11, S3-L4, N6 | **Hören 1** ([telc: **Hören 1** phone notes, exact numbers]); **Schreiben 1** (SMS 20–30 words) | wenn, sollte, reflexive Verben |
| 8 | Fit und gesund | sport, health, advice · Gesundheit | M7–8, S3-L5 | **Hören 4** (radio interview, Ja/Nein); Sprechen 2 | könnte/sollte (Rat), deshalb, Verben mit Präposition (Einstieg) |
| 9 | Immer online? | media, internet, warnings · Medien | N3 (split: M15 = A2.2) | Lesen 1; Schreiben 1 | W-Nebensätze, dass (Wdh.) |
| 10 | Freude, Ärger, Mitgefühl | feelings, reacting online · B Gefühle | N4, RC 40 | Schreiben 1 (congratulate, apologise); Sprechen 1 | sich freuen auf/über, darauf/worauf (Einstieg) |
| 11 | Wir feiern zusammen | a party: date, gifts, who brings what · D | S3-L7 | **Sprechen 3** (find a slot in two calendars; [telc: **Sp3**]); Schreiben 2 ([telc: **S2**, 3 of 4 points, ~40 words]) | Dativ + Akkusativ, Pronomen-Stellung |
| 12 | Reisen mit Bahn und Flugzeug | booking, announcements, delays · Mobilität | RC 143–144 (A2) | Hören 1 (announcements); Lesen 2; **A2-Halbtest** | einer/keiner/welche; Wiederholung |

**telc A2 Spur-Trainer** (lane-only cards, because the family renders differently): Hören 1 phone notes with
exact numbers; Schreiben 1 form from documents; Sprechen 2 six W-card turns including the joker „…?" ([01] §4).

### 2.8 A2.2 — „Gespräche führen, Probleme lösen" (€50; completes A2, A2+)

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus | New grammar |
|---|---|---|---|---|---|
| — | *Diagnose* | lane mini-mock | — | H1, L4, S1, Sp1 | — |
| 1 | Ins Gespräch kommen | start, keep up, end a conversation; learning languages · D, E | M13, N8; GER-M A2+ | **Sprechen 1**; Hören 3 | als (temporal), wäre/hätte (Wünsche) |
| 2 | Wir planen einen Ausflug | plan together, compromise · D | S4-L8, N12 | **Sprechen 3** (AI partner, full); Hören 2 | würde + Infinitiv, trotzdem |
| 3 | Handy, Vertrag, Kündigung | contracts, changing and cancelling · Einkaufen, Banken | M14, S4-L10, RC 125 | **Schreiben 2** (change a contract); Lesen 4 | Passiv Präsens (receptive only, [06] Impl. 7) |
| 4 | Hotel und Reise | book and rebook, problems en route · Mobilität | M16–17, M22, S4-L11/12, N7 | Lesen 2; Hören 1 (traffic); Schreiben 2 | indirekte Fragen mit ob/W-Wort; woher/wo/wohin |
| 5 | Wetter, Klima, Umwelt | weather report, environment at home · Medien | M18 | **Hören 1** (weather, traffic); **Lesen 1** (article ~190 words) | Verben mit Präposition, da(r)-/wo(r)- |
| 6 | Mein Geld | bank, a lost card, saving · Banken | S4-L9, S4-L13, RC 112 | **Sprechen 2** (card on money); Hören 3; Schreiben 2 (report a loss) | Adjektivdeklination complete, lassen |
| 7 | Post vom Amt *(tauschbar)* | letters from authorities, deadlines · Ämter | M21, RC 76–77 | Lesen 3 (letter); Schreiben 2 (semi-formal) | welch-/dies- (Wdh.), lassen (Wdh.) |
| 8 | Mein Weg | school, training, CV, experience · Arbeitssuche | M23, RC 94, 99 | **Lesen 3** (personal e-mail ~260 words); Sprechen 2 | Relativsatz Nominativ/Akkusativ |
| 9 | Das Vorstellungsgespräch | apply, ask about hours and pay · Arbeitssuche | M24, RC 100 | **Lesen 4** (job ads with X); Sprechen 1 | Präteritum (receptive), Relativsatz (Wdh.) |
| 10 | Die Heizung ist kaputt | problems in the flat, landlord, neighbours · Wohnen | RC 156–157 | **Schreiben 2** (to the landlord); **Hören 4** | seit/seitdem, bis |
| 11 | Stationen meines Lebens | connected narrative, comparing · A, D | N10–11, S4-L14 | **Schreiben 1**; Sprechen 2 (zuerst … zum Schluss) | Präteritum (Wdh.), Textkonnektoren |
| 12 | Alle Teile, eine Strategie | exam strategies, time management | — | all Teile; Modelltest A | review by error profile |
| — | *Prüfungswochen* | Modelltest A, B, C per lane (Goethe A2 90 + 15 min) | — | — | — |

A2.2 closes the Goethe A2 inventory: dass/weil/wenn/W-Nebensätze, deshalb, attributive adjective endings,
Komparation, möchte/hätte/könnte, Präteritum of haben/sein/kommen/sagen and the modal verbs ([06] F2, Fit 2
pp. 106–109).

### 2.9 B1.1 — „Im Alltag mitreden" (€60; B1 first half)

From B1 on, the Prüfungsfokus names the **family**; the lane renders it (telc B1 · DTZ · Goethe B1). Survival topics
come back only in their less routine form ([05] Impl. 6).

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus (families → lane Teile) | New grammar |
|---|---|---|---|---|---|
| 1 | Was gibt's Neues? | exchange news, friendship · D | M1, Si1 | **W-MAIL informal** (Goethe Sch1 at ~60 words; telc SA); S-VORSTELLEN (telc M1, DTZ S1) | n-Deklination, Adjektive als Nomen |
| 2 | Wenn die Bahn nicht fährt | delays, diversions, information desks · Mobilität | N1, Si3; ZM B1 | **H-DURCHSAGE / H-DETAIL** (Goethe H1, telc HV3, DTZ H1–2, all in lane play counts); L-ORIENTIERUNG (DTZ L1) | Relativsatz Dativ und mit Präposition |
| 3 | Mein Praktikum | work, telling what happened · Arbeit | M2, N4, Si5 | L-KURZTEXT (Goethe L1 blog); **W-NACHRICHT formal** (Goethe Sch3, ~40 words) | Präteritum als Erzähltempus |
| 4 | Ärger mit der Wohnung | flat search, complaining in writing · Wohnen | M3, Si4, RC 155–156 | **L-ANZEIGEN** (telc LV3, DTZ L2, Goethe L3); W-MAIL formal (DTZ) | Genitiv, wegen |
| 5 | Das Gerät ist kaputt | complaint, customer service · Einkaufen | M4, N2 clip | **SB-LÜCKE** (telc SB1, DTZ L5); W-MAIL semi-formal (telc SA) | obwohl, trotzdem |
| 6 | Alles digital? | technology, media, the future · Medien | M5, N6 | H-MEINUNG (telc HV1, Goethe H4, DTZ H4); S-DISKUTIEREN (short) | Futur I (Vermutung, Versprechen, Plan; [06] Impl. 9) |
| 7 | Wir organisieren ein Fest | invitation, planning together · D | M6, M12, Si2 | **S-PLANEN** at full length in all three lanes (Goethe Sp1, telc M3, DTZ S3) | falls, trotz |
| 8 | Welcher Beruf passt zu mir? | advice, choosing a job or course · Arbeitssuche | M7–8, Si5 | L-ANZEIGEN (jobs, courses); S-FOTO (DTZ S2) | zu + Infinitiv, um … zu, da/während/bevor |
| 9 | Beim Arzt und in der Apotheke | say what is wrong, read a leaflet · Gesundheit | M9, ÖIF B1 | **L-REGELN** (Goethe L5, DTZ L4); S-FOTO with home country (DTZ S2, no prep) | Konjunktiv II: advice, unreal conditions |
| 10 | Glück gehabt! | lucky breaks, feelings · B | M10–11, N3 | W-MEINUNG (Goethe Sch2 at ~60 words); **H-GESPRÄCH** (Goethe H3 1×, telc HV2 2×, DTZ H3 1×) | Plusquamperfekt, nachdem |
| 11 | Schichten tauschen | arrangements with colleagues, rescheduling · Arbeit | RC 84–85, BSK 59.6 | **W-NACHRICHT formal** (Goethe Sch3); S-PLANEN; H-DETAIL (voicemail) | Konnektoren (Wdh.), Nebensatz-Wortstellung |
| 12 | Meine Ziele mit Deutsch | goals, a short presentation · E | ÖIF B1, RC 36 | S-PRÄSENTIEREN (Goethe Sp2, 5 slides, 2 min); **B1-Halbtest** | Wiederholung |

**Deviation, logged.** S-PLANEN appears in every B1 Lektion's Sprechen-Teil rotation (at least as a 3-minute round),
not only in L7. The Lehrwerke treat planning as one Lektion; the exams weight it at 28/100 (Goethe), 30/75 (telc oral)
and 20/50 (DTZ task points), so it is the speaking spine ([02] Impl. 2).

### 2.10 B1.2 — „Selbstständig handeln und Stellung nehmen" (€60; completes B1)

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus | New grammar |
|---|---|---|---|---|---|
| — | *Diagnose* | lane mini-mock | — | one Teil per module | — |
| 1 | Missverständnisse | language, clearing up misunderstandings · B, C | M13 | **L-STANDPUNKT** (Goethe L4); **W-MEINUNG** (Goethe Sch2, ~80 words) | darum/deswegen/nämlich |
| 2 | Weiterbildung | compare courses, present a topic · Aus-/Weiterbildung | M14, Si8 | **S-PRÄSENTIEREN** (Goethe Sp2 + Sp3); **H-VORTRAG** (Goethe H2, 1×, 60 s reading time) | Partizip I/II als Adjektiv |
| 3 | Die Bewerbung | job ad, cover letter, phone enquiry · Arbeitssuche | M15, S6-L8, RC 98–99 | **L-ANZEIGEN** full (telc LV3 10:12, Goethe L3 7:10, DTZ L2); **W-MAIL formal** (DTZ A/B) | zweiteilige Konnektoren |
| 4 | Die erste Woche im Job | interview, experience, a conflict with a colleague · Arbeit | N7, RC 100 | **S-VORSTELLEN** (telc M1; DTZ S1 no prep); **H-GESPRÄCH** | brauchen … zu, Ausdrücke mit es |
| 5 | Werbung, Konsum, Geld | media and buying decisions · Einkaufen, Medien | S6-L9/10, N12, Si7 | **L-ÜBERSCHRIFT** (telc LV1); **L-ARTIKEL** (Goethe L2, telc LV2 ~400 words) | Passiv Präsens (productive), Passiv mit Modalverb |
| 6 | Einspruch! | a wrong bill, an insurance claim · Ämter, Banken | RC 78, 111; ÖIF B1 | **W-MAIL formal** (DTZ, telc SA); L-KURZTEXT (DTZ L3 official letter); **SB-LÜCKE** (DTZ L5) | Passiv Präteritum/Perfekt |
| 7 | Mitreden | society, volunteering, reporting and discussing opinions; relaying (mediation) · A, B | M18, S6-L11/12, N10 | **S-DISKUTIEREN** (telc M2); **H-MEINUNG** (Goethe H4, telc HV1, DTZ H4) | weder … noch, entweder … oder |
| 8 | Regeln und Anleitungen | house rules, instructions, explaining a process · Wohnen | M20; ZM B1+ | **L-REGELN** (Goethe L5, DTZ L4); S-PLANEN | je … desto, indem, sodass |
| 9 | Kultur erleben | guided tours, events, radio tips · Freizeit | M21, N9 | **H-VORTRAG** (Goethe H2); **H-DETAIL** (telc HV3, Goethe H1) | Relativsatz mit wo/was |
| 10 | Geschichten von früher | biography, home, comparing · A | M22, S6-L13, M16–17 | **S-FOTO** (DTZ S2, photo + Heimatland); L-KURZTEXT (Goethe L1) | als ob; Konjunktiv II Vergangenheit (receptive, [06] Impl. 11) |
| 11 | Klima und Zukunft | environment, a radio debate · Medien | M23–24 | **H-MEINUNG** (Goethe H4, ~850-word transcript); **W-MEINUNG** | (an)statt/ohne … zu, damit, innerhalb/außerhalb |
| 12 | Besprechung und Weitergeben | bring in a view, take notes, relay content · Arbeit, mediation | RC 86; SB mediation | **SB-LÜCKE** full (telc SB1 + SB2); **S-PLANEN** full; Modelltest A | Stellung von *nicht*, Modalpartikeln (receptive) |
| — | *Prüfungswochen* | Modelltest A, B, C per lane | — | telc 150 + 15 (+20 prep) · Goethe 4 modules · DTZ 100 + 16 | — |

### 2.11 B2.1 — „Argumentieren und im Detail verstehen" (€65; B2 first half)

Leaders: As = Aspekte neu B2 K1–5 (verified titles), Si = Sicher! aktuell B2 L1–6 (titles **unverified**, [14] §B6).

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus (telc B2 · Goethe B2) | New grammar |
|---|---|---|---|---|---|
| 1 | Heimat ist … | home, migration, identity · A | As1 | **L-STANDPUNKT** (Goethe L1: 9 statements, 4 posts); L-ÜBERSCHRIFT (telc LV1) | Temporalsätze, Mittelfeld |
| 2 | Wie wir miteinander reden | communication, explaining a view · C | As2 | S-DISKUTIEREN (Goethe Sp2 at 3 min); H-MEINUNG (Goethe H3, 1×) | Infinitivsatz vs. dass-Satz |
| 3 | Zu viel Arbeit | work-life balance, a message to a superior · Arbeit | As3, BSK 20.2 | **W-MAIL to a superior** (Goethe S2 at ~70 words); H-DETAIL (Goethe H1, 1×) | Passiv und Passiversatz |
| 4 | Das muss sich ändern | complaint with a claim for concessions · C, Wohnen | As4, ZM B2 | **W-MAIL Beschwerde** (telc SA at ~110 words); SB-LÜCKE (telc SB1) | Relativsatz mit wer; Präpositionen mit Genitiv |
| 5 | Forschung im Alltag | science, articles with a stance · Medien | As5, SB B2 | **L-ARTIKEL** (Goethe L3 ~420 words; telc LV2); H-VORTRAG (Goethe H4) | Nominalstil (Einstieg), Nomen-Verb-Verbindungen |
| 6 | Kaufen, kaufen, kaufen? | consumption, causes, consequences, hypotheses · Einkaufen | PZ-B2 themes; ZM B2 | **W-MEINUNG** (Goethe S1 forum post at ~110 words, 4 Leitpunkte); L-STANDPUNKT (Goethe L4) | Konjunktiv II Vergangenheit (productive) |
| 7 | Qualifiziert bewerben | recognition, application, experience · Arbeitssuche | BSK 5.2, 2.5 | **S-ERZÄHLEN** (telc M1 experience + questions); L-ANZEIGEN (telc LV3) | Zustandspassiv, lassen |
| 8 | Im Team: Pflege und Gesundheit | handover, planning in a care team (general language) · Arbeit | [10] Impl. 5 | **S-PLANEN** (telc M3); H-VORTRAG (Goethe H2 expert interview) | Futur I/II zur Vermutung |
| 9 | Radio, Podcast, Interview | stances in broadcasts · Medien | GER S. 73 (B2) | **H-MEINUNG** (Goethe H3, 1×); H-VORTRAG (telc HV2, 1×) | *es* als Korrelat, Vergleichssätze |
| 10 | Vertrag und Gehalt | contract, payslip, regulations · Arbeit | BSK 38.1, 36.2 | **L-REGELN** (Goethe L5); L-ARTIKEL (telc LV2) | Partizipien als Adjektive (erweitert) |
| 11 | Anders gesagt | paraphrase, monitor your own errors, work together online · E | ZM B2, SB online | S-PRÄSENTIEREN (Goethe Sp1 pattern: alternatives → one in detail → pros/cons + evaluation, 2 min); paraphrase the partner (DTB 1C preview) | Negation, *nicht*-Stellung (Wdh.) |
| 12 | Persönliche Briefe | feelings, why an event mattered · B | GER S. 86 | W-MAIL personal; **B2-Halbtest** | Wiederholung |

### 2.12 B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln" (€65; completes B2)

| Nr | Lektion | Situation · Handlungsfeld | Leaders | Prüfungsfokus | New grammar |
|---|---|---|---|---|---|
| — | *Diagnose* | lane mini-mock | — | one Teil per module | — |
| 1 | Beziehungen | relationships, attitudes · B | Si7, As9 | **L-STANDPUNKT** (Goethe L1); S-ERZÄHLEN (telc M1) | subjektive Modalverben |
| 2 | Ein Vortrag | give a talk, answer questions | ZM B2; GER S. 64 | **S-PRÄSENTIEREN** (Goethe Sp1, 4 min + questions) | Textgliederung, verbindende Konnektoren |
| 3 | Dafür oder dagegen? | pro/contra, building on others, summarising · C | ZM B2+ | **S-DISKUTIEREN** (Goethe Sp2 5 min; telc M2 summary + discussion) | konzessive, konditionale, konsekutive, adversative Konnektoren |
| 4 | Service und Schadensersatz | negotiate, set limits for concessions · Einkaufen | Si10, ZM B2+ | **W-MAIL Beschwerde** (telc SA full, ≥150 words, A/B choice); S-PLANEN (telc M3) | indirekte Rede, Konjunktiv I (Einstieg) |
| 5 | Essen, Gesundheit, Fitness | health debates · Gesundheit | Si8, Si11, As6 | **H-VORTRAG** (Goethe H2 2×); **W-MEINUNG** (Goethe S1 full, ~150 words) | dadurch … dass, indem |
| 6 | An der Uni | study regulations, a lecture · Bildung; bridge to DSH/TestDaF | Si9 | **L-REGELN** (Goethe L5 Studienordnung); **H-VORTRAG** (Goethe H4 lecture, 2×) | Nominalisierung ↔ Verbalisierung |
| 7 | Kultur und Kunst | reviews, cultural reports · Freizeit | As7 | **L-ÜBERSCHRIFT** (telc LV1); **L-TEXTLÜCKE** (Goethe L2) | erweiterte Partizipialattribute |
| 8 | Aus der Geschichte | history, memory, passing on news (mediation) | As8; SB mediation | **H-DURCHSAGE / news** (telc HV1, 1×); relay a report for a colleague | Konjunktiv I (productive), Passiv (Wdh.) |
| 9 | Das Mitarbeitergespräch | goals, giving and taking criticism · Arbeit | BSK 20.4, 52.1, 54.5 | **W-MAIL to a superior** (Goethe S2 full, ~100 words); S-DISKUTIEREN | Nomen und Adjektive mit Präposition |
| 10 | Im Team: Konflikt und Übergabe | care-team conflict, moderating (general language) · Arbeit | [10] Impl. 5; SB mediation | **S-PLANEN** (telc M3 full); **SB-LÜCKE** (telc SB2) | verallgemeinernde Relativsätze (Wdh.), Modalpartikeln |
| 11 | Sprache und Regionen | dialects, TV reports · Medien | Si12, SB B2 | **H-DETAIL** (Goethe H1, 1×); H-VORTRAG (telc HV2, 1×) | Textkohärenz: Verweiswörter |
| 12 | Ein Blick in die Zukunft | the future, technology, suppositions | As10 | all Teile; Modelltest A | Futur II (Wdh.) |
| — | *Prüfungswochen* | Modelltest A, B, C per lane | — | telc 140 + 15 (+20) · Goethe 4 modules | — |

**B2 split, logged.** Aspekte and Sicher! disagree on half of their B2.1/B2.2 placements ([06] F3). This blueprint
follows the exams: B2.1 carries the forms both B2 writing genres need first (Passiversatz, Nominalstil,
Nomen-Verb-Verbindungen); Konjunktiv I goes to B2.2, where both books put it and where the mediation tasks need it.

### 2.13 Grammar allocation approach

- **Source of truth:** the per-half-level consensus tables in [06] F3 (11–15 points per half-level). Each Lektion takes
  1–2 new points *derived from its situation* (the texts need them), never the other way round.
- **Floors from the exams:** the full GZ-A1 inventory by the end of A1.2, the GZ-A2 inventory by the end of A2.2
  ([06] F2). B1 and B2 have no open inventory; the Lehrwerk consensus decides.
- **Ladders that span courses** (from [06] Impl. 8–11): Dativ first through fixed-case prepositions (A1.2), then verbs
  and pronouns; Wechselpräpositionen through verb pairs (A2.1); Relativsatz Nom/Akk (A2.2) → Dat/Präp (B1.1) → wo/was
  (B1.2) → wer/was (B2); Passiv receptive (A2.2) → productive (B1.2) → Passiversatz (B2.1); Konjunktiv II chunks (A1.2)
  → advice (A2.1) → wishes (A2.2) → unreal conditions (B1.1) → past receptive (B1.2) → past productive (B2.1).
- **Presentation:** A levels deductive: a model sentence heads each step (Schritte A–C, [14] §E2), a rule card of
  ≤80 words, then structured input. B levels inductive: the text first, the learner fills the rule table, then the
  Grammatik-Rückschau ([14] §E16).
- **Interleaving:** new forms are practised blocked, then interleaved with their contrast partner from the second
  Lernschritt on (Akkusativ/Dativ, Perfekt haben/sein, wenn/als, weil/denn, deshalb/trotzdem) ([09] §3).
- **Error tags shared with the AI graders:** V2/INV, verb-final, Satzklammer, case in a noun phrase vs in a PP,
  gender/article, adjective ending, Perfekt auxiliary/participle, connector position, n-Deklination ([06] Impl. 15).
  Weight depends on level: inversion errors at B1 are flagged, not scored as a level failure (MERLIN, [06] F4).

### 2.14 Vocabulary allocation approach

- **Targets per half-level** (new learning words entering the SRS; exposure words in texts come on top), from
  [07] Impl. 1: A1.1 330–360, A1.2 300–330 (cumulative ≥95 % of the A1 list), A2.1 and A2.2 330–360 each
  (cumulative ≥95 % of A2), B1.1 and B1.2 520–580 each (cumulative ≥95 % of B1), B2.1 and B2.2 700–850 each
  (cumulative ≈4,000 lemmas). Productive share ≈50 % at A, ≈45 % at B1, 35–40 % at B2.
- **Selection order per Lektion** ([07] Impl. 2), with the exam step made explicit: (1) situation and can-dos;
  (2) list headwords of the matching Goethe Themen field; (3) **exam essentials** — the instruction language of the
  lane's papers (*ankreuzen, zuordnen, Antwortbogen, Leitpunkt, Aufgabe, Beispiel*, which the A1 list itself includes,
  [07] §1) and the Redemittel the Teil needs; (4) fill by frequency with unassigned list words; (5) off-list words only
  when the situation needs them, capped at 15 % (A) / 25 % (B1), tagged extension; (6) at B1.2–B2, frequency bands
  from the Leipzig lists (CC BY, snippet) — never DeReWo, which is non-commercial ([07] §2).
- **Units of teaching:** 3–4 thematic mini-blocks of 6–10 words per Lektion, taught blocked in context and
  interleaved only in review ([09] §3). Feminine forms listed with the masculine.
- **Coverage rules:** every new word ≥2× in the Lektion's own texts and again in ≥2 later Lektionen; every input
  text ≥95 % known tokens (≥98 % for the Lesemagazin); a learner-facing counter („412 von ≈650 A1-Wörtern") shows the
  number, never the Goethe list, which may not be published ([07] Impl. 6–7).

### 2.15 Coverage rules the validator enforces (design)

| Rule | .1 course | .2 course |
|---|---|---|
| Every Teil of every launch lane appears in the Prüfungsfokus of Lektionen or Stationen (shared families render into all lanes; lane-only Teile count through Spur-Trainer cards) | ≥2 | ≥3 |
| Every Teil at full length, exam mode, before the closing assessment (Lektion, Station or Diagnose) | ≥4 named Teile (A1.1: Sp1, S1, L3, H1) | every Teil ≥2× before Modelltest A |
| Prüfungsfokus per Lektion | 2–4 Teile | 2–4 Teile, ≥1 at full length |
| Aufgabentraining per Lektion | one Schreiben-Teil and one Sprechen-Teil: from the Prüfungsfokus, otherwise the next productive Teil in rotation, so every productive Teil recurs about every third week ([09] §8: repetition after one week helps) | same |
| Module balance | each module (Hören, Lesen, Schreiben, Sprechen) holds ≥15 % of the Prüfungsfokus slots | same |

---

## 3. Unit anatomy and lesson anatomy

The unit is **one Lektion = one situation = one week at standard pace** ([09] Impl. 1). The unit's German is taught in
short Lernschritte (the evidence-based 20-minute core lesson of [09] Impl. 2); the exam is rehearsed at three
distances: *Mini-Teil* (3–5 items at the end of each Lernschritt), *Aufgabentraining* (the productive Teile at full
format with AI grading) and *Teil-Probe* (timed, exam mode, feeds the Prüfungsstand).

### 3.1 A-level Lektion (A1.1–A2.2), ≈2.8–3.2 h per week (design)

| Session | Min | What happens | Scored output |
|---|---|---|---|
| **Einstieg** (opens Lernschritt 1) | 2 | *Lernziele* box: 3–5 can-dos in our own ich-Form wording ([05] Impl. 8); *Prüfungsfokus* chips („Hören Teil 3 · Schreiben Teil 2"); a serial-story scene ≤2 min with one task | 1 gist item |
| **Lernschritt 1 · Hören und handeln** | 20 | input = an exam text type (voicemail, announcement, short dialogue) | ≈28 items + Mini-Teil |
| **Lernschritt 2 · Sprache im Fokus** | 20 | grammar point 1, headed by a model sentence | ≈28 items + Mini-Teil |
| **Lernschritt 3 · Lesen und Wortschatz** | 20 | input = an exam text type (note, ad, sign, e-mail); 2 vocabulary mini-blocks | ≈28 items + Mini-Teil |
| **Lernschritt 4 · Sprechen vorbereiten** | 20 | Redemittel box; grammar point 2 or review; phonetics micro-slot (2 min, ≥4 voices, [09] Impl. 4); an info-gap round with the AI as partner B ([14] §E13) | ≈24 items + spoken Mini-Teil |
| **Aufgabentraining** | 30 | one Schreiben-Teil and one Sprechen-Teil in full format (from the Prüfungsfokus, otherwise the next productive Teil in rotation, §2.15): plan → attempt → AI feedback → one revision ([09] Impl. 6) | 2 AI-graded Teile |
| **Teil-Probe** | 12 | exam mode: the Prüfungsfokus Teile as miniatures (receptive items auto-scored) + one spoken round | → Prüfungsstand |
| **Das kann ich** | 3 | self-rating per can-do, each linked to the item that proved it ([14] §E11); Lernwortschatz to the SRS | — |
| **Tägliche Wiederholung** | 5–8 × 6 days | SRS cards + one Teil-Trainer card (§5) | — |

### 3.2 B-level Lektion (B1.1–B2.2), ≈3.4–3.8 h per week (design)

The Lehrwerke change their skeleton at B1+: the opener becomes a prompt, and the unit is organised by text type with
inductive grammar ([14] §D). The exam-first B-Lektion follows that shift.

| Session | Min | What happens | Scored output |
|---|---|---|---|
| **Auftakt** | 5 | an ambiguous photo or a question („Was passiert hier?", Sicher! style); 60 s of free speaking graded for fluency only; Lernziele + Prüfungsfokus | 1 spoken round |
| **Modul A** (usually Hören) | 25–30 | one exam text type (radio debate, tour, interview) at exam length for the half-level; inductive grammar from the text | ≈25 items + Mini-Teil |
| **Modul B** (usually Lesen) | 25–30 | one exam text type (ads, reader comments, article, rules) | ≈25 items + Mini-Teil |
| **Modul C** (Sprache und Schreiben) | 25–30 | the text type of the Schreiben-Teil, analysed; Redemittel; Wortschatz mini-blocks | ≈25 items + Mini-Teil |
| **Aufgabentraining** | 40 | *Diskursaufgabe* (planning, presentation, discussion, photo, mediation) with the lane's preparation time, then the lane's writing task, each plan → attempt → feedback → revision | 2 AI-graded Teile |
| **Teil-Probe** | 20 | exam mode; in B1.2 and B2.2 at least one Teil at full length | → Prüfungsstand |
| **Rückschau** | 5 | the learner completes the rule table (Grammatik-Rückschau); Lernwortschatz split into core and extension ([07] Impl. 10); Das kann ich | — |
| **Tägliche Wiederholung** | 6–10 × 6 days | as A levels | — |

**Lane switching inside a Lektion.** The situation, texts, vocabulary and grammar are the same for every learner. Only
exam-shaped items change: the Mini-Teil, the Aufgabentraining and the Teil-Probe render through the learner's lane
profile. Example, B1.1 Lektion 7 („Wir organisieren ein Fest"): the Goethe lane gets Sprechen Teil 1 with four
Leitpunkte and 15 minutes of preparation; the telc lane gets Mündlich Teil 3 with the „wer macht was?" requirement and
20 minutes; the DTZ lane gets Sprechen Teil 3 with no preparation and a cold start.

### 3.3 The 20-minute Lernschritt (A) / 25-minute Modul (B)

From [09] Impl. 2, with the output segment made exam-shaped:

| # | Segment | Min | Content | Items |
|---|---|---|---|---|
| 1 | Aufwärmen | 3 | 6–8 due items from earlier Lektionen, recall format, contrast pairs mixed in | 8 |
| 2 | Input | 5 (B: 7) | the exam text type at ≈95 % known words; gist question → detail questions → replay with transcript (learning mode) | 3–4 |
| 3 | Fokus | 3 | rule card ≤80 words, model sentence, 3–4 structured-input items where the form carries the meaning | 4 |
| 4 | Üben | 5 (B: 6) | 10–14 recall-first items; immediate feedback, one retry; misses re-queued as a different item | 12 |
| 5 | **Mini-Teil** | 3–4 | 3–5 items in the lane's exact format, **or** one exam-shaped production with plan → attempt → feedback → one revision | 1–5 |
| 6 | Abschluss | 1 | 3 recall items; the next review date is shown | 3 |

About 28–32 scored interactions, ≥70 % in recall formats ([09] Impl. 3), and **≥25 % exam-format item types** across a
Lektion (design; the Teil-Probe is 100 %). New-word load per Lernschritt ≈ target ÷ 48 Lernschritte (≈7 at A1, ≈11 at
B1, ≈16 at B2, half of them productive at most).

### 3.4 Item types

| Item type | Component (existing → generalise, or new) | Used for | Checking |
|---|---|---|---|
| `mc` a/b/c | `ListenSelect`, OptionTile | H- and L-families | key |
| `rf` richtig/falsch, ja/nein | new RF tile | SD1 L1, L3, H2; Goethe A2 H4; Goethe B1 L4 | key |
| `ab` two-ad choice | new | SD1 L2 | key |
| `match` with a no-match option (X / 0 / x) | `Match` | L-ANZEIGEN, H-MEINUNG, L-ÜBERSCHRIFT, L-STANDPUNKT | key per slot, the no-match counted as an answer |
| `gap` typed | Practice | grammar, SB | `check.js`: `accepted`, `caseSensitive`, TYPO for case-only misses |
| `cloze` options | Modelltest `cloze` | SB-LÜCKE | key |
| `note` typed from audio | `Dictation` | telc A2 H1, ÖSD H2 | `exact: 'number' \| 'name'` for numbers and spelled names; tolerant for words (telc accepts „Donerstach", [01] Impl. 8) |
| `form` fields | `WritingStage` (Formular) | W-FORMULAR | normalised exact match per field |
| `order` word order | `WordOrder` | V2, verb-final, Satzklammer | sequence |
| `readaloud` | `readaloud.js` + `score-readaloud` | phonetics, Redemittel | word recognition, labelled *Verständlichkeit* |
| `speak-card` | new in-lesson card round | S-FRAGEKARTEN, S-BITTEN | AI: full / half / 0 by intelligibility |
| `speak-task` | `SpeakingStage`, moved **into** the lesson | all S-families | AI, lane rubric |
| `write-task` | `GradedWriting` | W-NACHRICHT, W-MAIL, W-MEINUNG | deterministic prechecks + AI, lane rubric |
| `insert` sentence insertion | new | L-TEXTLÜCKE (Goethe B2 L2) | key |

### 3.5 Learning mode and exam mode

| | Lernmodus (Lernschritte, Aufgabentraining) | Prüfungsmodus (Teil-Probe, Station, mocks) |
|---|---|---|
| Audio | replay, slower speed (0.85×), transcript after the first unaided listen ([09] §7) | the lane's play count (1× or 2×), natural tempo, the lane's reading time (e.g. 60 s before Goethe B1 Hören 2); transcript only after submission ([01] Impl. 7, [02] Impl. 5) |
| Feedback | after each item, one retry | at the end, per Teil |
| Time | untimed; minutes shown per step ([14] §E20) | lane timer; auto-submit at zero |
| Writing editor | word counter, Leitpunkt checklist, umlaut keys | word counter (Goethe's digital exams offer a word-count function, **(snippet)**, [goethe.de](https://www.goethe.de/de/spr/prf/ddp.html)), no autocorrect or spellcheck, umlaut keys on mobile, checklist hidden |
| Speaking | hints, word bank (A1.1 only), repetition on request | the lane's preparation time and notes (SD1 0, Goethe A2 0, DTZ 0, Goethe B1 15 min, telc B1/B2 20 min, ÖSD ZA1 10 min); notes collapse while speaking |
| Paper lanes (telc) | — | optional 3–5 min answer-sheet transfer step ([01] Impl. 11) |
| Counts toward the Prüfungsstand | no | yes |

### 3.6 How writing is graded

**Pipeline.**

1. **Live prechecks in the editor (deterministic).** Word counter with the lane's band (SD1 ~30; Goethe A2 20–30 and
   30–40; telc A2 ~40; ÖSD ZA1 ≥25; Goethe B1 ~80/~80/~40; Goethe B2 ~150/~100; telc B2 ≥150), Leitpunkt checklist,
   detection of Anrede, Gruß and Betreff, du/Sie consistency, and the share of sentences that start with *Ich/Wir*
   (telc). Below 50 % of the Goethe target the editor warns: „Nach der Bewertungsregel von Goethe bekäme dieser Text
   0 Punkte (unter 50 % der Wortzahl)." ([02] Impl. 3, [03] Impl. 3).
2. **Server-side zero rules before the AI.** The official zero or cap rules are code, not prompt: Goethe E-rule, ÖSD
   length deductions, telc „no A on criterion II without Betreff, Anrede and Schlussformel" (B2), „Thema verfehlt →
   D on all criteria". The AI cannot override them.
3. **AI rubric per lane profile** (table below). The model returns a band per criterion with a one-line reason, the
   Leitpunkte it found (with the sentence that covers each), up to three prioritised fixes tied to the Lektion's
   targets, and error tags (§2.13).
4. **Feedback, in this order:** a self-correction prompt first („Leitpunkt 3 fehlt noch. Wie fragen Sie höflich nach
   einem neuen Termin?"), then after the revision the reformulation and a rule of ≤3 points, then a model text. No model
   text before the learner's own revision ([09] Impl. 14).
5. **Result card:** points per criterion on the exam's scale, the lost points and why, a link to the rule card and a
   repair drill for each fix ([08] Impl. 6), and the fixed label „Automatische KI-Auswertung — keine Korrektur durch
   eine Lehrkraft, kein Prüfungsergebnis. Richtwert."

**Rubric profiles** (the scorer is parametrised per lane; `evaluate-writing` today uses one 4 × 0–5 scheme for every
task, which is not any exam's scale):

| Lane · Teil | Criteria and scale | Deterministic rules | Source |
|---|---|---|---|
| SD1 Schreiben 2 | 3 Leitpunkte × 3 / 1.5 / 0 + Anrede/Gruß 1 / 0.5 / 0 = 10; spelling costs only if it harms understanding | ~30 words (guide only) | [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) p. 38 |
| telc A2 Schreiben 2 | 3 chosen points × 3 / 1.5 / 0 + Textsorte 1 / 0.5 / 0 | exactly 3 of 4 points chosen | [UT-A2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) |
| Goethe A2 Schreiben 1, 2 | Aufgabenerfüllung and Sprache, each 5 / 3.5 / 2 / 0.5 / 0 | below 50 % of the words (10 / 15) → E → 0 | [US-A2](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) p. 37 |
| ÖSD ZA1 Schreiben 2 (v1.1) | length and content deductions + Textsorte, Kohärenz, Lexik, Formale Richtigkeit (tops inferred, **unverified**) | 20–24 words −1; 15–19 −2; <15 → 0 | [AB-ZA1-W](https://www.osd.at/wp-content/uploads/2019/01/za1_auswertungsbogen_schreiben.pdf) |
| Goethe B1 Sch1, Sch2 (40 each), Sch3 (20) | Erfüllung, Kohärenz, Wortschatz, Strukturen at 10 / 7.5 / 5 / 2.5 / 0 (Sch3: 4 / 4 / 6 / 6) | <40 words (Sch1/2) or <20 (Sch3), or topic missed → E → 0 | [Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) |
| telc B1 Schriftlicher Ausdruck (45) | Aufgabenbewältigung, Kommunikative Gestaltung, Formale Richtigkeit at 5 / 3 / 1 / 0, × 3 | no A on criterion II with mixed register, unconnected Leitpunkte or mostly Ich/Wir starts; topic missed → D on all. No official word count (prep sites advise 120–150, **unverified**) | [telc UT B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) pp. 36–38 |
| DTZ Schreiben (20) | Inhalt, Kommunikative Gestaltung, Korrektheit, Wortschatz at 5–0 | 4 Leitpunkte; Anrede and Gruß; formal register | [g.a.s.t.](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) pp. 47–49 |
| Goethe B2 S1 (60), S2 (40) | 4 criteria each (S1 split 14/14/16/16 **unverified**; S2 10 each) | <50 % words or topic missed → E → 0; Einleitung/Schluss (S1); Anrede/Gruß (S2) | [Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) |
| telc B2 Schriftlicher Ausdruck (45) | 3 criteria at 5 / 3 / 1 / 0, × 3 | ≥150 words; a Leitpunkt needs more than one clause; no A on II without Betreff, Anrede, Schlussformel | [telc UT B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) |

**Calibration.** The Goethe B2 Modellsatz prints error-heavy, uncorrected texts as B2 samples ([03] §1). A grader tuned
to surface errors would under-score real learners. Before a lane's rubric ships, it is run on anchor texts at known
bands (official performance samples used only as private evaluation data, never shipped or published; plus our own
annotated texts) and must place them within one band of the anchor on ≥80 % of texts **(design threshold)**. No copy
may mention accuracy until an agreement study with human raters is published ([13] Impl. 10).

**Example result card (A1.2, SD1 Schreiben 2, after the first attempt):**

> **Schreiben Teil 2 · Übungswert 6,5 von 10 (Richtwert)**
> Leitpunkt 1 „sich entschuldigen" — erfüllt (3/3): *„Es tut mir leid, ich kann morgen nicht kommen."*
> Leitpunkt 2 „einen Grund nennen" — erfüllt (3/3): *„Ich bin krank."*
> Leitpunkt 3 „nach einem neuen Termin fragen" — nicht erkennbar (0/3).
> Anrede und Gruß — teilweise (0,5/1): Die Anrede fehlt.
> **Ihr nächster Schritt:** Fragen Sie höflich nach einem neuen Termin. Tipp: *Können Sie …?* → Überarbeiten
> *Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein Prüfungsergebnis. Richtwert.*

### 3.7 How speaking is graded

**Three exam simulations** (all run inside the lesson; today open speaking leaves the lesson for `/speaking`,
[12] §4):

| Mode | Lanes and Teile | Set-up | AI roles |
|---|---|---|---|
| **Gruppe/Paar, ohne Vorbereitung** | SD1 Sp1–3 (group of up to 4), Goethe A2, telc A2, DTZ S1–S3 | card draw; about 20 s to read the cards (Goethe A2, [01] §3) | AI examiner reads the instructions; 1–3 AI candidates take turns asking and answering |
| **Mit Vorbereitung und Notizen** | Goethe B1 (15 min), telc B1 and B2 (20 min), Goethe B2 (15 min), ÖSD ZA1 (10 min) | preparation timer and notes field; notes shrink to 5 keywords while speaking („nicht ablesen") | AI examiner + AI partner candidate |
| **Monolog und Rückfragen** | Goethe B1 Sp2 + Sp3, Goethe B2 Sp1, telc B2 M1 | Goethe B1: 5 fixed slides (topic and structure, own experience, home country, pros/cons + opinion, close) ([02] §1); Goethe B2: alternatives → one in detail → pros/cons + evaluation ([03] §1) | AI audience asks 1–2 questions; then the AI partner presents and the learner gives feedback and asks one question |

**What is scored.** Each Teil on its own exam's criteria: SD1 full / half / 0 per question, answer, request and
reaction, judged on intelligibility, „nicht die Zahl der Fehler" (TB-A1 p. 46); Goethe B1 28 / 40 / 16 + Aussprache 16;
telc B1 per part (4/3/1/0 and 8/6/2/0 scales); DTZ 50 task points + 50 language points; Goethe B2 4 × 8 + 12 and
4 × 10 + 16; telc B2 7 / 7 / 7 / 4 per part (sources: [01]–[03]). For S-PLANEN the evaluator also marks the
*moves*: propose, react, disagree, decide, assign who does what ([02] Impl. 2).

**Spontaneity, not recitation.** telc examiners must interrupt memorised speeches ([03] §2). The AI partner varies its
follow-up questions; when the transcript matches the learner's own notes almost word for word, the result card says
„Hier würde die Prüferin unterbrechen: Sprechen Sie frei." Pronunciation feedback names segments (ü/u, vowel length,
ich-Laut), never a global accent score ([09] Impl. 4).

**The A1 support curve** ([04] Impl. 4): in A1.1 the AI speaks slowly, repeats, reformulates and offers a word bank;
in A1.2 it repeats on request; in A2.1 it speaks at normal pace with clarification; from A2.2 the learner must keep
the conversation going. Exam-mode rounds always use the exam's own behaviour.

### 3.8 Worked example: A1.2 Lektion 5 „Ich bin krank – ich sage ab"

**Can-dos** (our wording; source tags from [04]): Ich kann mich telefonisch und schriftlich krankmelden (RC 84, 149·A1).
Ich kann mich entschuldigen und einen Grund nennen (RC 149·A1). Ich kann einer Nachricht auf dem Anrufbeantworter
Tag, Uhrzeit und Rückrufwunsch entnehmen (GI-A1 15–16). Ich kann in einer kurzen Mitteilung um einen neuen Termin
bitten (GI-A1 16).
**Prüfungsfokus:** SD1 **Schreiben Teil 2** (full), Hören Teil 3 (Mini), Sprechen Teil 3 (Mini).
**Grammar:** *denn* (M23, S14, N12 = A1.2, [06] F3); Perfekt with haben, now systematic. **Vocabulary:** 27 new
lemmas in three blocks — *Körper und Beschwerden* (der Kopf, der Hals, der Bauch, das Fieber, der Husten, wehtun …),
*Termine* (der Termin, absagen, verschieben, zurückrufen, Bescheid sagen …), *Arbeit und Kurs* (die Krankmeldung,
die Kollegin, der Chef, die Hausaufgabe …).

| Session | Minute by minute (design) |
|---|---|
| **LS1 Hören** | 0–3 warm-up: 7 due items (Lektion 3 time phrases, Lektion 4 body words). 3–8 input: three voicemails from Praxis Dr. Albers, the course office and Emre. Gist: „Wer ruft an?" Detail: „Wann soll Priya zurückrufen?" 8–11 Fokus: *bis 12 Uhr, am Donnerstag, nach 14 Uhr* (dates and times are exact-match). 11–16 Üben: 12 items (time dictation, a/b/c). 16–19 **Mini-Teil SD1 Hören 3**: 2 items, played twice, exam voice. 19–20 exit: 3 items |
| **LS2 Sprache** | model sentence: *„Ich kann heute nicht kommen, denn ich bin krank."* Structured input: pick the clause that gives the reason. Contrast with *und/aber* (V2 after all three). Mini-Teil: build three Leitpunkt sentences for a sick note (typed, checked) |
| **LS3 Lesen** | a 75-word note from a colleague („Die Besprechung ist nicht am Montag, sondern am Dienstag um 9 Uhr …"). **Mini-Teil SD1 Lesen 1:** 3 richtig/falsch items. Two vocabulary blocks, each in context |
| **LS4 Sprechen** | Redemittel: *Können Sie mir bitte … geben? — Ja, gern. / Hier bitte.* Phonetik: ich-Laut vs ach-Laut (*ich, möchte, Bauch, Nacht*), 4 voices, read-aloud with segment feedback. Info-gap: the AI is the receptionist and has the free slots. **Mini-Teil SD1 Sprechen 3:** 2 picture cards (Tabletten, Telefon), scored full/half/0 |
| **Aufgabentraining** | **SD1 Schreiben 2, full format:** „Sie haben morgen um 10 Uhr einen Termin in der Praxis Dr. Albers. Sie können nicht kommen. Schreiben Sie an die Praxis: Entschuldigen Sie sich. Nennen Sie einen Grund. Fragen Sie nach einem neuen Termin." Counter band ~30 words; Anrede/Gruß detection; AI rubric 3/1.5/0 × 3 + 1/0.5/0; self-correction prompt; one revision; model text last. **SD1 Sprechen 3, full format:** a group round with two AI candidates, 2 requests + 2 reactions |
| **Teil-Probe (12 min)** | exam mode: Hören 3 (3 items, 2 plays), Lesen 1 (3 items), Sprechen 3 (1 round) → Prüfungsstand |
| **Das kann ich** | 4 can-dos, each linked to its proof item; 27 lemmas, 6 Redemittel sentences and the pattern „denn + V2" enter the SRS |
| **Fokus Alltag (optional)** | *Krankmeldung beim Arbeitgeber:* the „gelber Schein" and the call to the boss, for learners already in Germany ([14] §E8) |

### 3.9 Worked example, compressed: B1.2 Lektion 2 „Weiterbildung"

Auftakt: photo of an evening class, 60 s „Was passiert hier?". **Modul A (Hören):** an information evening at a
Volkshochschule, ~400 words, rendered as Goethe B1 Hören 2 (5 MC items, played once, 60 s reading time). **Modul B
(Lesen):** a course programme rendered per lane (telc LV3: 10 situations to 12 ads with „x"; Goethe L3: 7 to 10 with
„0"; DTZ L2: 5 items). **Modul C:** the five-slide talk structure; *Partizip als Adjektiv* found in the programme
(*die angebotenen Kurse, ein laufender Kurs*) and extracted into the rule table. **Aufgabentraining:** Goethe lane →
Sprechen 2 (3-min presentation on „Weiterbildung am Wochenende", 15 min preparation) + Sprechen 3 (feedback and one
question to the AI partner); telc lane → Mündlich 2 (report a quoted opinion, discuss; 20 min preparation); DTZ lane →
Sprechen 2 (photo of a course room, own experience, comparison with the home country, no preparation). Writing per lane:
Goethe Sch2 forum post (~80 words), telc e-mail to a course provider (4 Leitpunkte), DTZ letter to a course provider
(A or B). **Teil-Probe (20 min):** the lane's Lesen-Teil at full length + one Hören-Teil.

---

## 4. Assessment

### 4.1 The assessment ladder

| Level | What | When | Length (design) | Mode | Feeds |
|---|---|---|---|---|---|
| Item | `check.js` and exact-match checks | every item | — | learning | mastery, SRS |
| **Mini-Teil** | 3–5 items or one production in the lane's format | end of each Lernschritt | 3–4 min | learning (feedback per item) | Lektion mastery |
| **Teil-Probe** (the unit test) | the Lektion's Prüfungsfokus Teile as miniatures, timed | end of each Lektion | 12 min (A) / 20 min (B) | exam | Prüfungsstand (weight 0.5) |
| **Prüfungsstation** (checkpoint) | one full-length Teil per module (4 Teile), rotated so every Teil gets a turn; a review set mapped back to the Lernschritte (≈65 % current block, 35 % earlier, [09] Impl. 10); a *Lesemagazin* long read (≥98 % known words) and a story scene as reward ([14] §E7) | after L3, L6, L9 | 45–75 min | exam for the Teile | Prüfungsstand (weight 1.0) |
| **Einstiegscheck** (level test) | ≤10 min adaptive with partial credit + 1 spoken item + a can-do self-check; recommends .1 or .2, and Lektionen to test out ([11] Impl. 8) | before purchase or at start | ≤10 min | — | course recommendation |
| **Ich kann das schon** | test-out per Lektion: its Teil-Probe + 3 can-do items | any time | 12–20 min | exam | honest credit |
| **Diagnose** | lane mini-mock: one full Teil per module | week 1 of each .2 course | 30–45 min | exam | seeds the Prüfungsstand and the plan |
| **Halbtest** | every Teil of the lane, about half the items, .1 content only | end of each .1 course | A1: ≈40 min; B: ≈90 min | exam | Prüfungsstand; plan into the .2 course |
| **Modelltest A/B/C** | full mock in the official format and timing, parallel forms | last 3 weeks before the exam date | per lane (§2.1) | exam | Prüfungsstand (weight 1.5) |
| **Wiederholungsplan** | the learner enters the official per-part result of a failed attempt → a 4-week plan weighted to the weak parts + 2 mocks | A1.2, B1.2 at launch | — | — | plan |

**The count behind „≥56 scored productive tasks" (design).** Per Lektion: Aufgabentraining 2 (one Schreiben-Teil,
one Sprechen-Teil) + the spoken Mini-Teil in Lernschritt 4 (B: the Auftakt round) + the spoken round in the
Teil-Probe = 4 → 48 per half-level. Stationen add 3 × 2 = 6, the Halbtest or Diagnose adds 2: **56** in every course.
The .2 courses add the productive parts of three mocks per lane (SD1: 3 × 4; Goethe B1: 3 × 6). The benchmark is
Goethe DOI's ~30 human-marked open tasks per half-level **(snippet, [08] §2.5)**; ours are automated and say so.

### 4.2 Mocks: counts and authoring spec

| Course | Lanes | Full mocks at launch | Other exam-format sets |
|---|---|---|---|
| A1.1 | SD1 | — | 1 Halbtest |
| A1.2 | SD1 (+ ÖSD ZA1 v1.1) | 3 SD1 | 1 Diagnose; ZA1 1 mock in v1.1 |
| A2.1 | Goethe A2, telc A2 | — | 2 Halbtests |
| A2.2 | Goethe A2, telc A2 | 3 + 3 | 2 Diagnosen |
| B1.1 | telc B1, DTZ, Goethe B1 | — | 3 Halbtests |
| B1.2 | telc B1, DTZ, Goethe B1 | 3 + 3 + 3 | 3 Diagnosen |
| B2.1 | telc B2, Goethe B2 | — | 2 Halbtests |
| B2.2 | telc B2, Goethe B2 | 3 + 3 | 2 Diagnosen |
| **Total** | | **24 full mocks** | 8 Halbtests, 7 Diagnosen |

**Authoring rules (design).**
- **Parallel forms only.** No text or item is reused across A/B/C; each form matches the others on text lengths
  (official sample sizes ±15 %, [01] Impl. 9, [02] Impl. 12, [03] §1–2), on the share of words from the level list,
  and on item-type counts. Practice-test gains partly come from familiarity with the form (retest effect d = .26,
  [Hausknecht et al. 2007](https://doi.org/10.1037/0021-9010.92.2.373)), so a mock score is never a forecast.
- **Official format, our content.** Item counts, options, the no-match option, play counts, reading times and timing
  are the lane's. All texts and items are ours; each mock links to the free official set ([01] Impl. 12).
- **Productive parts are graded.** Mock writing parts go to `evaluate-writing` with the lane rubric (today they are
  ungraded textareas, [12] §2.6); mock speaking parts run the speaking simulation.
- **Audio.** Natural tempo, several voices per mock, labelled „Computerstimme" until human recordings exist
  ([13] Impl. 11).
- **Replace the Kurzversion mocks** (Goethe B1's abridged module shape and the telc B2 writing task contradict the
  official formats, [02] Impl. 13, [03] Impl. 12). The existing `examKey` values and the runner stay.

### 4.3 The Prüfungsstand (readiness per module)

**What it is.** A board per lane that shows, for each module of the chosen exam, the learner's latest practice value
on that exam's own scale, which Teile have been practised in exam mode, and where the official pass rule sits. It
answers „Wo stehe ich in jedem Prüfungsteil?" and never „Werde ich bestehen?".

**How a Teil value is computed (design).**
1. Only exam-mode attempts count: Teil-Probe (weight 0.5, scaled to the Teil's full item count), Station (1.0),
   Diagnose and Halbtest (1.0), Modelltest (1.5). Learning-mode attempts never count, because they allow replays.
2. Evidence older than 21 days is halved in weight; the value is the weighted mean of the last five attempts.
3. A Teil shows a number only after at least one **full-length** attempt; before that it reads „im Kleinen geübt" or
   „noch nicht geübt".
4. Productive Teile (Schreiben, Sprechen) carry the AI's Richtwert as a **range** (± one band per criterion until
   calibration is measured), so the module shows a range, not a point.

**How a module value is computed.** The Teil values are combined with the lane's official weights, then converted to
the lane's scale: Goethe B1/B2 Lesen and Hören raw × 3.33; telc items at 5 / 2.5 / 1.5 points; SD1 raw × 1.66; DTZ
Hören + Lesen out of 45 (sources in §2.1).

**How the pass rule is shown.** The lane's rule runs on the module values (and on both ends of a range): Goethe A1
≥60/100 with the <35-written rule; Goethe A2 ≥60, ≥45 written, ≥15 oral; telc 36/60 (A1/A2) and 135/225 + 45/75
(B1/B2); ÖSD per module with subtest floors; Goethe B1/B2 60 per module; DTZ 33/45, 15/20, 75/100, the Sprechen gate
and the one-of-two rule. The board states the rule and where the practice value sits relative to it, in the rule's own
words, and nothing else.

**Example (B1.2, telc lane):**

```
telc Deutsch B1 · Ihr Prüfungstermin: 14.11. (noch 48 Tage)
Schriftlicher Teil   Übungswert 146–152 von 225 ─┤ Grenze nach telc: 135
   Leseverstehen 62/75 · Sprachbausteine 18/30 · Hörverstehen 45/75 · Schreiben 21–27/45 (KI-Richtwert)
Mündlicher Teil      Übungswert 38–44 von 75  ─┤ Grenze nach telc: 45
   Teil 1 11/15 · Teil 2 12–15/30 · Teil 3 15–18/30
In voller Länge geübt: 11 von 12 Teilen · Modelltest A: 24.10. (geplant)
Vorschlag: Mündlich Teil 2 (Diskussion) – 3 Trainings à 15 Minuten
Übungswerte aus Ihren Übungsprüfungen bei uns. Keine Prognose Ihres Prüfungsergebnisses.
```

**Words the board may and may not use** ([13] Impl. 9): allowed — „Übungswert", „Grenze nach der Bestehensregel von
telc", „in voller Länge geübt", „Vorschlag". Banned — „bestanden", „bereit", „prüfungsreif", „Bestehenschance", any
percentage presented as a likelihood, „in X Wochen".

**Why a board and not one number.** A single readiness percentage would read as a pass probability, the very claim
[08] flags in competitors („Pass probability gauge") and [13] bans. Showing modules against their own rules is also
more useful: telc B1 needs the written **and** the oral part independently, DTZ needs Sprechen at B1 plus one other,
and Goethe modules can be sat separately.

### 4.4 Gates

- **No gate uses an AI score** ([13] Impl. 4). The next Lektion unlocks when the previous one's Lernschritte are
  *finished* (items answered, not correct); the learner can open any Lektion with „Trotzdem öffnen".
- Mocks and the Diagnose are open from day one; the plan only *suggests* when to take them.
- Test-out gives completion credit on deterministic items only; its AI-graded part is shown, not counted for credit.

---

## 5. Review and retention

**The ladder.** Keep the engine (`src/lib/review/ladder.js`, `reviewService`, `review_cards`), change its numbers.
Today's ladder is 1 → 4 → 7 → 14 → 60 → 180 days. This proposal uses **+1, +3, +7, +14, +30, +60 days, a lapse back
to +1**, and caps every interval at **max(1 day, 15 % of the days left to the exam date)**, following Cepeda's
finding that the best gap shrinks as a share of the retention interval ([09] §2, Impl. 7). After the exam date passes,
the cap lifts. Expanding and uniform schedules do not differ (g = 0.034, [Latimier et al. 2021](https://doi.org/10.1007/s10648-020-09572-8)),
so a fixed ladder is defensible; an A/B test against an adaptive scheduler (HLR/FSRS) comes after launch ([09] Impl. 23).

**Card kinds** (the three existing kinds plus one):

| Kind | Content | Directions |
|---|---|---|
| `word` | Lernwortschatz entry | productive words: both directions + one production item; receptive words: recognition only ([07] Impl. 10) |
| `pattern` | a grammar contrast pair (*Ich fahre mit dem Bus / in die Stadt*) | recall; interleaved with its partner ([09] §3) |
| `sentence` | a Redemittel sentence for a Teil (*Wie wäre es mit …? – Da kann ich leider nicht, weil …*) | cloze → full recall → spoken |
| **`teil`** (new) | a 2–3-minute Teil-Trainer: 2–3 items of one exam Teil in exam mode (e.g. one Durchsage played once, one ad-matching set) | one per day, drawn from the two weakest Teile on the Prüfungsstand |

**Rules.**
- Retrieval targets before the exam date: ≥5 successful spaced retrievals for productive items, ≥3 for receptive ones
  ([09] Impl. 8). The plan warns when the date makes this impossible.
- New grammar gets short lags first (Lernschritte 1–3 days apart), then contrast review at the Station and at about +2
  and +4 weeks ([09] Impl. 9).
- AI error tags create `pattern` cards: three *verb-final* errors in a week add the *weil/dass* pattern card to the
  queue, as a *suggestion* the learner sees and can dismiss (AI output steers nothing automatically, [13] §4).
- **Re-entry** after ≥3 days away starts with a 5-minute review, never the backlog ([09] Impl. 22).
- **The last 7 days** before the exam: no new content; daily review + Teil-Trainer cards + Modelltest C and its repair
  ([09] Impl. 11).

---

## 6. Engagement and the player UX

The player follows memo 11's evidence (one practice item per screen, input screens scroll, one pinned primary action,
360 × 640 floor with reflow at 320 px, ≈0.62 MiB JS budget on a Galaxy A24-class phone, [11] Impl. 1–3). Exam-first
adds six screens and changes what „progress" means.

### 6.1 Screens added or changed for exam-first

| # | Screen | Key states | Notes |
|---|---|---|---|
| E1 | **Prüfungsziel** (onboarding) | exam known / unknown · date set / „noch kein Termin" · purpose · lane picked | Three questions, nothing pre-selected, „Später" is real, CTA „Plan festlegen" ([11] Impl. 9). The exam picker follows [02] Impl. 10: in an Integrationskurs → DTZ; in Germany outside the course system → telc or Goethe; abroad for a visa → Goethe, telc or ÖSD; spouse visa → SD1 or ÖSD A1 (BAMF list). Shown as information with a „Stand" date, not legal advice. Purpose is stored next to `dm_attribution` so `weekly_truth_metrics()` can report by segment ([10] Impl. 2) |
| E2 | **Prüfungsstand** (board) | no attempts · Teile in miniature only · values · range (AI) · after a mock | §4.3. Siegel fills with text labels and a hairline for the pass rule; not the operator-only `viz` palette ([11] §10) |
| E3 | **Prüfungsmodus runner** (Teil-Probe, Station, Modelltest) | reading time · playing (count shown: „Sie hören den Text einmal") · answering · time warning · auto-submit · answer-sheet transfer (telc) · results per Teil | Built on the Modelltest runner; the play count and timer come from the lane profile |
| E4 | **Sprechprüfung** | card draw · preparation (timer + notes) · examiner instructions · own turn · partner turn · grading (staged) · result per criterion | mic pre-prompt before the system prompt; „ohne Mikrofon weiter" path ([11] Impl. 18) |
| E5 | **Wiederholungsplan** | enter official result per part · plan generated · plan running | entry fields follow each lane's certificate (e.g. DTZ: Hören/Lesen, Schreiben, Sprechen levels) |
| E6 | **Prüfungswochen** mode | mock due · repair week · final week (review only) · exam day passed | the course home switches its primary action from „Weiter mit Lektion 7" to „Modelltest B starten" |

### 6.2 Progress, habit and reminders

- **Nested goals:** item → Lernschritt bar → Lektion ring → course map (Lektionen with can-do titles) → Prüfungsstand
  per module ([11] Impl. 5). No XP, points, levels, leagues, hearts, gems or loot ([11] Impl. 20).
- **The course map** shows all 12 Lektionen, the three Stationen and the closing assessment as nodes on one linear
  path; unbought half-levels appear as locked chapters on the same map ([11] Impl. 6). Every Lektion node carries its
  Prüfungsfokus chips, so the learner sees where each Teil is practised.
- **Weekly goal first, streak second.** „3 von 3 Lerntagen" is the headline; the streak counts learning days with one
  Lernschritt or the 5-minute review as the unit, two automatic free *Pausentage* per week, earn-back by one review
  within 48 h, and a quiet „lückenlos" mark; a broken streak is never shown as 0 ([11] Impl. 10–13).
- **The countdown is factual and calm:** „noch 48 Tage bis zum 14.11." — never red, never „nur noch".
- **The plan** is arithmetic and never a gate (`plan.js` principle, `SUSTAINABLE_PER_WEEK = 5`). It computes days
  left, remaining Lektionen and hours, places the Diagnose in week 1 and the three mocks at exam −21, −14 and −7 days,
  and phrases everything forward: „Diese Woche 3 Lernschritte – dann sind Sie im Plan." ([11] Impl. 15). If the date is
  too close for all Lektionen, the plan proposes a *Kompaktweg*: the Lektionen whose Prüfungsfokus covers the weakest
  Teile first, all others still visible and open. Nothing is hidden or locked.
- **Novelty at weeks 4–6** ([09] Impl. 19): the first Prüfungsstation with its story scene falls in week 3–4, the
  first full-length oral simulation in week 5–6.
- **Weekly report** (recorded, with an opt-in share link, [09] Impl. 20): can-dos reached, review accuracy, Teile
  practised in exam mode, practice value per module.
- **Reminders:** at most one a day at the learner's time, e-mail by default through `lifecycle_emails`, weekly after
  7 idle days, stop after 30, ≥6 rotating templates per kind ([11] Impl. 14). Exam-first templates name the next Teil,
  not the streak: „Heute 12 Minuten: Hören Teil 2 – zwei Durchsagen, einmal gehört."

### 6.3 Exam-realism details in the player

- **Keyboard:** Goethe's computer-based exams use a German keyboard ([01] §1, [02] §1). The writing editor offers
  ä/ö/ü/ß keys on mobile; an optional 2-minute *QWERTZ-Training* appears in the first B1 Lektion for desktop learners.
- **Handwriting:** telc is paper-only at A1/A2 ([01] §1, §4). v1.1 may add photo upload with OCR for handwritten mock
  texts (one competitor does this, [08] §2.11); v1 recommends writing the mock text on paper first, then typing it.
- **Offline and low bandwidth:** compressed audio, no autoplay video, AI checks queued offline („Gespeichert – wird
  bewertet, sobald Sie online sind"), staged waiting states within 1 s and a progress indicator past 10 s
  ([11] Impl. 17, [10] Impl. 7).
- **AI notice at first contact** (Art. 50(1) AI Act): „Diese Aufgabe wertet eine KI automatisch aus. Es liest keine
  Lehrkraft mit." ([13] Impl. 10).

---

## 7. Copy and marketing surfaces per level

### 7.1 Per half-level

Search language follows the buyer: English for A1 (India), German for B1/B2 in Germany ([10] Impl. 9). Every page is
exam-worded; the course name stays neutral (no title that begins with an exam mark, [13] Impl. 8).

| Course | Landing page(s) (lang) | Headline (draft) | Proof points (derived, never typed by hand) | Honesty line |
|---|---|---|---|---|
| A1.1 (free) | „Goethe A1 exam preparation – start free" (EN), „Start Deutsch 1 vorbereiten – kostenlos beginnen" (DE) | "Start German for your A1 exam – free. From Lektion 1, every speaking and writing task gets an instant automated score." | 12 Lektionen · all 11 SD1 Teile practised · scored tasks count · Halbtest | "A1.1 is the first half. The full exam format is practised in A1.2." |
| A1.2 (€40) | "Goethe A1 exam preparation course" (EN) | "Your Start Deutsch 1 date is set. Practise every part, then take three full practice exams scored by the published rules." | 3 full mocks · Teile count · price vs exam fee (₹9,400 ≈ €86 in India per [tijusacademy](https://tijusacademy.com/blogs/german/goethe-exam-fees-india-2026-costs-explained/); €155 in Germany per the [Kurskalender 2026](https://www.goethe.de/resources/files/pdf354/kurskalender_2026-v3.pdf)) | "A practice score, never an exam result. Our Teilnahmebescheinigung is not a language certificate." |
| A2.1 (€50) | „Deutsch A2 online: der Weg zur A2-Prüfung" (DE/EN) | „Alle Teile der A2-Prüfung kennenlernen – mit sofortiger Auswertung jeder Schreib- und Sprechaufgabe." | Goethe A2 + telc A2 lanes · 56 scored tasks | „A2.1 ist die erste Hälfte. Die komplette Prüfung üben Sie in A2.2." |
| A2.2 (€50) | „Goethe A2 Vorbereitung online", „telc A2 Vorbereitung" | „Drei komplette Übungsprüfungen im Format Ihrer A2-Prüfung – ausgewertet nach deren Bestehensregel." | 3 mocks per lane · 90 + 15 min format | „Übungswert, keine Prognose." |
| B1.1 (€60) | „B1-Prüfung vorbereiten: telc, DTZ oder Goethe" | „Die sechs Aufgabentypen, die in jeder B1-Prüfung vorkommen – geübt in Ihrem Prüfungsformat." | lanes · S-PLANEN in every Lektion | „B1.1 ist die erste Hälfte des Wegs zur B1-Prüfung." |
| B1.2 (€60) | three pages, one product: „telc B1 Vorbereitung online", „DTZ Vorbereitung online (nur für Teilnehmende am Integrationskurs)", „Goethe B1 Vorbereitung online" | „Jeder Prüfungsteil geübt, jede Schreib- und Sprechaufgabe sofort ausgewertet – nach den veröffentlichten Kriterien Ihrer Prüfung." | 3 mocks per lane · Wiederholungsplan · the official DTZ result for context: 55.0 % B1 in 2025 ([Drucksache 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf); never a rate for our learners) | „Automatische KI-Auswertung. Kein Prüfungsergebnis." |
| B2.1 (€65) | „Deutsch B2 online: Argumentieren, Schreiben, Diskutieren" | „Die beiden Schreibformen und drei Sprechformen der B2-Prüfungen – Schritt für Schritt, mit sofortiger Auswertung." | telc B2 + Goethe B2 lanes | „B2.1 bereitet die Prüfung vor, erreicht sie aber nicht allein." |
| B2.2 (€65) | „telc B2 Vorbereitung online", „Goethe B2 Vorbereitung online" | „Drei komplette Übungsprüfungen je Prüfung, in Originallänge und Originalzeit." | 3 mocks per lane · Studienkolleg note | „Für ein Studium verlangen Hochschulen DSH-2 oder TestDaF TDN 4 in allen Teilen ([RO-DT](https://www.goethe.de/pro/relaunch/prf/rahmenordnung/Rahmenordnung-ueber-Deutsche-Sprachpruefungen-fuer-das-Studium-an-deutschen-Hochschulen.pdf))." |

### 7.2 Surfaces every course carries

- **Inhaltsverzeichnis**, published like a Lehrwerk: Nr · Titel · Handlungsfeld · Kann-Beschreibungen · Grammatik ·
  Textsorte · Prüfungsteil · Minuten ([14] §G7). No app publishes this; teachers judge a course by it.
- **Teil-Matrix:** which Lektion practises which Teil, and at what length.
- **„Wie bewertet die KI?"**: the criteria per lane, the zero rules, the known limits, and the sentence „Die KI
  ersetzt keine Prüferin und keine Lehrkraft." ([13] Impl. 10).
- **Hours as a labelled Richtwert** once measured („ca. 46 Stunden Lernzeit, gemessen an … Lernenden").
- **Purpose phrases only:** „Vorbereitung auf das Goethe-Zertifikat B1", „im Prüfungsformat von telc Deutsch B1",
  „eigenes Übungsmaterial, kein offizielles Prüfungsmaterial", with links to the official Modellsätze ([13] Impl. 8).
- **Teilnahmebescheinigung** explained on the page, with the fixed line from §1.4.
- **Refund:** one voluntary promise with linked terms if the owner adopts it; never the statutory withdrawal right as
  a benefit ([13] Impl. 13).

### 7.3 In-app copy that exam-first needs (examples)

| Surface | Copy (German, Sie) |
|---|---|
| Mock result | „Modelltest B · Schriftlicher Teil: Übungswert 152 von 225. Nach der Bestehensregel von telc liegt dieser Übungswert über der Grenze von 135 Punkten. Übungswert aus unserer Übungsprüfung – keine Prognose Ihres Prüfungsergebnisses." |
| Teil in miniature only | „Hören Teil 4 haben Sie bisher nur im Kleinen geübt. In voller Länge kommt er in Station 2." |
| Plan, date close | „Bis zu Ihrer Prüfung bleiben 19 Tage. Vorschlag: Lektion 9 und 11 zuerst – sie üben Ihre zwei schwächsten Teile. Alle anderen Lektionen bleiben offen." |
| Weekly e-mail subject lines (rotating) | „Diese Woche: Sprechen Teil 3 in 12 Minuten" · „Ihr Übungswert im Lesen: +8 Punkte" · „Noch 21 Tage – Zeit für Modelltest A" |

**Banned everywhere** (lint rule, §9): *bestanden* (about our tests), *garantiert*, *Bestehenschance*, *prüfungsreif*,
*bereit für die Prüfung*, *offiziell / anerkannt / zertifiziert / Partner* (about us), *Prüfer* for the AI,
*persönliches Feedback*, *Tutor*, *Coach*, *Muttersprachler* on TTS audio, *Zertifikat* for our document,
*in X Wochen zu B1* ([13] do/don't table).

---

## 8. Content data model

The engine already consumes items with `accepted`/`caseSensitive`, review-card keys, read-aloud lines, writing-bank
task keys, a speaking `courseTask`, and mock data with `listening`, `mc-group`, `matching`, `cloze` and `writing`
parts ([12] §3, Impl. 8). The v2 data keeps those shapes and adds three things: **lane profiles**, **task families**
and **per-course unit files**.

### 8.1 File layout

```
src/data/course-v2/
  exams/
    families.js              # the 23 task families: id, module, item types, renderer
    lanes/
      sd1.js                 # Start Deutsch 1 = Goethe A1 = telc A1
      goethe-a2.js  telc-a2.js
      telc-b1.js    dtz.js     goethe-b1.js
      telc-b2.js    goethe-b2.js
      osd-za1.js    dtb-b2.js  # v1.1
  levels/
    a1-2/
      course.js              # meta: level, lanes, unit order, stations, closing set, hours (measured later)
      units/u01.js … u12.js  # one Lektion each
      stations/s1.js s2.js s3.js
      exams/diagnose-sd1.js  modelltest-sd1-a.js  -b.js  -c.js
      vocab.json             # lemma entries, schema from [07] Impl. 5
      audio.js               # generated manifest (per-line, per-voice)
src/services/examRules/      # pure pass-rule functions per lane, unit-tested
netlify/functions/_shared/rubrics/   # rubric profiles per lane · Teil (server-side, never client-supplied)
```

The registry pattern (`src/data/curricula/index.js`, LIVE vs DRAFT) is reused: a course is live only after review.

### 8.2 A lane profile (excerpt)

```js
// src/data/course-v2/exams/lanes/sd1.js
export default {
  id: 'sd1',
  name: 'Start Deutsch 1',                      // shown in purpose phrases only
  providers: ['goethe', 'telc'],
  stand: '2025-09-01',
  sources: ['https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf'],
  modules: {
    hoeren:   { minutes: 20, teile: ['H1', 'H2', 'H3'] },
    lesen:    { minutes: 25, teile: ['L1', 'L2', 'L3'] },
    schreiben:{ minutes: 20, teile: ['S1', 'S2'] },
    sprechen: { minutes: 15, format: 'group', maxCandidates: 4, prepMinutes: 0, teile: ['Sp1', 'Sp2', 'Sp3'] },
  },
  writtenBlock: { minutes: 65, breaks: false },
  teile: {
    H1: { family: 'H-DETAIL',    items: 6, item: 'mc', options: 3, plays: 2, points: 1 },
    H2: { family: 'H-DURCHSAGE', items: 4, item: 'rf',             plays: 1, points: 1 },
    L2: { family: 'L-ANZEIGEN',  items: 5, item: 'ab', textWords: [20, 60], points: 1 },  // textWords: design band
    S2: { family: 'W-NACHRICHT', leitpunkte: 3, words: { target: 30 }, rubric: 'sd1-s2', points: 10 },
    Sp3:{ family: 'S-BITTEN',    rounds: 2, scoring: { request: 2, reaction: 1, scale: 'full-half-zero' } },
    // … H3, L1, L3, S1, Sp1, Sp2
  },
  scale: { rawToScore: 1.66, max: 100 },
  passRule: 'goethe-a1',                         // src/services/examRules/goethe-a1.js; telc view: 'telc-36-of-60'
};
```

### 8.3 A Lektion file (excerpt)

```js
// src/data/course-v2/levels/a1-2/units/u05.js
export default {
  id: 'a1.2-u05',
  nr: 5,
  title: 'Ich bin krank – ich sage ab',
  handlungsfeld: ['Arbeit', 'Unterricht'],                 // BAMF field tags ([14] §E9)
  leaders: ['RC 84', 'RC 149'],                             // where the Lehrwerke/curricula place it
  canDos: [
    { id: 'c1', text: 'Ich kann mich telefonisch und schriftlich krankmelden.', source: 'RC 84, 149·A1', band: 'A1' },
    { id: 'c2', text: 'Ich kann einer Nachricht auf dem Anrufbeantworter Tag und Uhrzeit entnehmen.', source: 'GI-A1 15', band: 'A1' },
    // … c3, c4
  ],
  pruefungsfokus: [
    { lane: 'sd1', teil: 'S2', length: 'full' },
    { lane: 'sd1', teil: 'H3', length: 'mini' },
    { lane: 'sd1', teil: 'Sp3', length: 'mini' },
  ],
  grammar: [{ point: 'denn', slug: 'denn', role: 'new' }, { point: 'Perfekt systematisch', role: 'new' }],
  vocab: { blocks: [{ title: 'Körper und Beschwerden', lemmas: ['der Kopf', 'der Hals', 'wehtun' /* … */] } /* … */] },
  steps: [
    {
      id: 'ls1', kind: 'hoeren', minutes: 20,
      input: { family: 'H-DETAIL', audio: ['vm-praxis', 'vm-kurs', 'vm-emre'], transcriptAfterFirstListen: true },
      items: [
        { id: 'ls1-07', type: 'note', prompt: 'Bis wann soll Priya zurückrufen?', answer: '12 Uhr',
          accepted: ['12 Uhr', '12.00 Uhr', 'zwölf Uhr'], exact: 'number', tags: ['zeit'] },
        // …
      ],
      miniTeil: { lane: 'sd1', teil: 'H3', items: 2 },
    },
    // ls2 … ls4
  ],
  aufgabentraining: {
    writing: { examKey: 'sd1', taskKey: 'a12-l05' },       // lives in the writing bank; graded server-side only
    speaking: { courseTask: { lane: 'sd1', teil: 'Sp3', cards: ['tabletten', 'telefon'], aiCandidates: 2 } },
  },
  teilProbe: { minutes: 12, parts: [{ teil: 'H3', items: 3 }, { teil: 'L1', items: 3 }, { teil: 'Sp3', rounds: 1 }] },
  review: { cards: ['pattern:denn-v2', 'sentence:absage-1', 'sentence:absage-2'] },
  fokus: [{ kind: 'Alltag', title: 'Krankmeldung beim Arbeitgeber', optional: true }],
};
```

The **writing bank** keeps its rule: the grader only grades tasks it looks up by `exam_key + task_key`, never a
client prompt (`writingTasks.js` header). Each v2 task adds `lane`, `teil`, `rubric`, `words`, `leitpunkte`,
`register` and, for choice tasks, `choose: { from: 4, pick: 3 }`. Mock files keep the runner's part types and add a
`teil` reference so the lane profile can enforce plays, timing and scoring.

### 8.4 Results that feed the Prüfungsstand

One new table (hand-applied migration, RLS-scoped to the learner; design):

```sql
create table public.exam_practice_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  lane text not null,                 -- 'telc-b1'
  teil text not null,                 -- 'LV3'
  source text not null,               -- 'teil-probe' | 'station' | 'diagnose' | 'halbtest' | 'modelltest'
  form text,                          -- 'A' | 'B' | 'C' for mocks
  full_length boolean not null,
  raw_score numeric not null, raw_max numeric not null,
  ai_range numeric[] ,                -- [low, high] for AI-graded Teile
  created_at timestamptz not null default now()
);
```

The learner's goal (lane, exam date, purpose, days per week) goes into `profiles` or a small `learner_goals` table,
written by the learner, not by the service role. Nothing here is a privileged column.

### 8.5 Events that prove the moat is used

Today the weekly truth shows 0 AI writing and 10 AI speaking uses in 7 days ([12] §2.10). Each course logs
`teil_attempt` (lane, teil, source, mode), `ai_grade_shown`, `revision_submitted`, `modelltest_completed`,
`plan_set` and `retake_plan_created`; `weekly_truth_metrics()` adds AI writing and speaking uses per paying learner
and mocks completed per course ([12] Impl. 13).

---

## 9. Quality gates

### 9.1 Machine-checkable rules (`scripts/validate-course-v2.mjs`, design)

The generic rules of `validate-curriculum.mjs` carry over (known-word lexis, can-do rehearsal, deferred constructions,
„the answer follows from the German prompt"); its A1.1 personas and ratchet numbers do not ([12] Impl. 10). Every
ratchet only goes down and must equal its measurement.

| ID | Rule | Threshold (design) |
|---|---|---|
| Q01 | Structure: 12 Lektionen, 3 Stationen, the closing set; each Lektion has 4 Lernschritte (A) or 3 Module (B), each with a Mini-Teil, an Aufgabentraining with 1 writing + 1 speaking Teil, and a Teil-Probe | hard |
| Q02 | Can-dos: 3–5 per Lektion, each with a source tag and CEFR band, in our own wording; every can-do is linked to ≥1 proof item; „Das kann ich" lists exactly the Lektion's can-dos ([04] Impl. 7) | hard |
| Q03 | Exam coverage matrix of §2.15 | hard |
| Q04 | **Format fidelity:** every exam-mode item set matches its lane profile — item count, option count, no-match option, play count, reading time, timing, text length within ±15 % of the official sample size, writing word band | hard |
| Q05 | Known-word coverage of every input text ≥95 % (Lesemagazin ≥98 %), computed from the course's own lexis table + function words + names ([07] Impl. 4) | hard |
| Q06 | Vocabulary: new entries within the half-level target; cumulative list coverage; off-list share ≤15 % (A) / ≤25 % (B1); every new word ≥2× in its Lektion and in ≥2 later Lektionen | ratchet |
| Q07 | Grammar ceiling: no construction above the level's allowed list outside receptive exposure | ratchet |
| Q08 | Every answer follows from the German prompt; no English-only cue (`quality.js` rules) | hard |
| Q09 | Any answer containing a digit or a spelled name carries `exact` | hard |
| Q10 | Every writing task is in the bank with lane, Teil, rubric id, Leitpunkte (count = lane), word band and register; instructions in Sie | hard |
| Q11 | Every speaking task names its lane mode (group/pair/individual), preparation minutes (= lane), card set and AI roles | hard |
| Q12 | **Parallel mock forms:** no sentence shared across forms (8-gram overlap = 0); item and time totals equal the official format; text length and off-list share within ±10 % across forms | hard |
| Q13 | **Copy lint** on every learner-facing string and page: the banned list of §7.3; the grading label on every grading surface; exam names only inside purpose phrases; „Computerstimme" on TTS | hard |
| Q14 | Audio: every audio id resolves to the manifest or a flagged computer-voice fallback; ≥2 voices per dialogue, ≥4 per perception drill | hard |
| Q15 | Minutes per Lektion within the design band (A 120–140 in-lesson, B 140–170) | warning |
| Q16 | `tests/examRules.test.mjs` pins every lane's pass rule at its boundaries (Goethe B1 17 vs 18 correct; telc 134.5 vs 135; DTZ one-of-two and Sprechen gate; Goethe A1 34 written) | hard |
| Q17 | `tests/rubrics.test.mjs`: deterministic zero rules apply whatever the AI returns (Goethe <50 % words → 0; telc B2 missing Betreff → no A on II) | hard |
| Q18 | Count of AI-scored productive tasks per course ≥56 (§4.1) | hard |

### 9.2 Human-style DaF review rubric

Each block (3 Lektionen + Station) gets **two independent reviewers**. Each scores five criteria from 1 to 5:

| Criterion | 5 means |
|---|---|
| **Prüfungstreue** | Every exam-shaped item is indistinguishable in format and difficulty from the lane's official samples; no official content reused |
| **Sprachrichtigkeit und Natürlichkeit** | Correct, idiomatic German; register consistent (instructions in Sie; *du* only between peers in dialogues); no calques |
| **Niveaugerechtigkeit** | Lexis and grammar inside the half-level; input at ≈95 % known words; tasks ask for what the level can do |
| **Didaktik und Progression** | The Handlungskette is logical; support fades; each item tests what it claims; feedback explains and routes to a repair |
| **Inhalt und Fairness** | DaF/DaZ-neutral core, no stereotypes; factual and Landeskunde claims sourced and dated; legal wording held |

Findings are **BLOCKER** (wrong key, wrong exam format, legal claim, factual error), **MAJOR** (level mismatch,
unnatural model text, rubric misapplied) or **MINOR**. A block passes with 0 BLOCKER, ≤1 MAJOR per Lektion and a mean
≥21/25. A recurring finding class is closed with a rule plus a test, never with a list of ids.

**Three specialist reviews run beside it:** an *exam-fidelity* reviewer per CEFR band (Teil-Proben, Stationen, mocks
against the official specifications), an *AI-calibration* review per rubric (§3.6: anchor texts, ≥80 % within one
band, zero rules 100 %, no systematic under-scoring of error-heavy but communicative texts), and a *copy/legal*
review of every page and e-mail against [13].

---

## 10. Production plan

### 10.1 Waves

| Wave | Content | Why this order | Gate to ship |
|---|---|---|---|
| **1** | Engine prerequisites + **A1.1 + A1.2** (SD1) | Lead segment; A1.1 is free and outside the FernUSG ([13] Impl. 6); A1.2 is already sold | Q01–Q18 green; DaF pass; AI calibration for SD1 S2 and Sp1–3; purchase-aware entitlement live |
| **2** | **B1.1 + B1.2** (telc B1, DTZ, Goethe B1) | Largest German demand and the revenue core ([10] §7); buyable after review (`DECISIONS.md`, 2026-09-26) | as above + counsel's answer on AI grading in paid courses + Impressum and Nutzungsbedingungen ([13] Impl. 16) |
| **3** | **A2.1 + A2.2** (Goethe A2, telc A2) | Bridge that B1 buyers need ([10] §6) | as Wave 1 |
| **4** | **B2.1 + B2.2** (telc B2, Goethe B2) | Largest level-named course query in Germany, but a thinner self-pay segment ([10] §2.3) | as Wave 2 |
| **v1.1** | ÖSD ZA1 pack, DTB B2 lane, Wiederholungsplan for A2.2/B2.2, handwriting OCR | measured demand first | lane choice data from onboarding |

A **decision point after Wave 1**: if the first-session scored speaking task and the AI writing uses stay near
today's baseline (0 writing uses in 7 days, [12] §2.10), the owner revisits the scope of Waves 3–4 before they start.

### 10.2 Agent counts

| Phase | Work | Agents |
|---|---|---|
| **W2 · specs** | 8 curriculum agents (one per course: unit specs, can-dos, Prüfungsfokus, grammar, lemma lists, reuse tags) · 5 lane-profile agents (SD1 + ÖSD ZA1; Goethe A2 + telc A2; telc B1 + DTZ; Goethe B1; telc B2 + Goethe B2) · 2 rubric agents (writing, speaking; anchor sets) · 1 design (E1–E6, board) · 1 copy (pages, in-app strings) · 1 vocabulary schema | **18** |
| **W3 · authoring** | 32 unit authors (one per block of 3 Lektionen + its Station; 4 per course) · 24 mock authors (one per full mock: texts, items, audio scripts, tasks, keys) · 5 authors for the 8 Halbtests + 7 Diagnosen · 8 vocabulary agents (lemma lists, `list_ref`, reuse matching) · 4 audio-script agents (per band: voice table, per-line scripts) | **73** (rolling, ≈25 at a time) |
| **W4 · review, per round** | 16 DaF reviewers (2 per block → 64 block reviews) · 4 exam-fidelity reviewers · 2 AI-calibration reviewers · 1 copy/legal reviewer; fixes by the original authors; 2–3 rounds expected | **23 per round** |
| **W5 · build** | 3 engine generalisation (per-level registries, `buildLesson` v2 stages, station builder) · 2 exam layer (lane loader, exam-mode runner, `examRules` + tests) · 3 AI functions (rubric profiles in `evaluate-writing`; speaking simulation modes and in-lesson speaking; purchase-aware entitlement) · 1 Prüfungsstand + plan + results table · 2 pages and copy (Astro + SPA) · 2 validator and tests (incl. re-pointing the 34 A1.1-pinned test files) | **13** |

### 10.3 Owner actions (cannot be done by agents)

1. One Azure TTS run per course with the secrets (cost is not the constraint: the whole old A1.1 script rendered for
   ≈US$0.08, [12] §4).
2. Lemon Squeezy variants for the B-level products (the real on-switch, `DECISIONS.md`).
3. Counsel: AI rubric grading in a paid course under § 1 FernUSG ([13] Open question 1); the Teilnahmebescheinigung
   wording ([11] Open question 4); the voluntary refund promise and the checkout consent ([13] Impl. 13–14).
4. Approve the launch lanes (§2.1) and the pair offers at checkout (§13).

---

## 11. Reuse and replace

| Asset | Decision | How |
|---|---|---|
| `check.js`, `mastery.js`, `requeue.js` | **reuse** | items keep `accepted`/`caseSensitive`; add `exact` for numbers and names |
| `reviewService`, `review_cards`, `ladder.js` | **reuse**, retune | ladder +1/+3/+7/+14/+30/+60 with the exam-date cap; new `teil` card kind |
| `readaloud.js` + `score-readaloud` | **reuse** | phonetics micro-slots; labelled *Verständlichkeit* |
| Modelltest runner + `examScoring.js` | **reuse, extend** | add lane profiles, play counts, reading times, answer-sheet step, graded writing and speaking parts, per-lane pass rules instead of one `passPercent` |
| `evaluate-writing` + writing bank | **reuse, extend** | rubric profiles per lane · Teil; deterministic zero rules server-side; bank-only grading stays |
| `speaking-session` / `-turn` / `evaluate-speaking` + `courseTask` | **reuse, extend** | examiner + AI-candidate roles, preparation timer, lane criteria; run inside the lesson |
| JSON→SQL pipelines, `generate-example-audio`, `generate-course-audio` | **reuse, generalise** | voice cast table moves into each course's data |
| Curricula registry (LIVE/DRAFT), `quality.js`, generic validator rules | **reuse** | v2 validator (§9.1) |
| `plan.js` principle, course-reminder mailer, `lifecycle_emails` | **reuse** | plan places mocks; reminders name the next Teil |
| `words` rows with audio | **reuse by lemma** | authors write lemmas; the orchestrator matches ids at integration ([12] Impl. 2) |
| A1–A2 reading lessons with checks; A1–A2 listening transcripts; A1.2 SD1 Sprechen missions 9–12; B1.1 grammar bank | **adapt** | re-cut into exam Teile, re-render per line; quality filter on grammar items |
| `speech.js` manifests, pool loaders, `IntroStage`/`WortfeldStage`/`CheckpointPage` metas, `lexis.js`, `buildCheckpoint.js`, `writing.js` | **generalise** | per-level registries; station builder; `writing.js` heuristics become the lane prechecks |
| A2.1–B2.2 speaking missions (grammar drills dressed as situations) | **replace** content, keep machinery | re-authored per can-do and per exam Teil |
| B-level reading essays and 10-dialogue listening bundles; B1.2–B2.2 exercise sets | **replace** | exam text types with auto-checkable items; transcripts kept as raw material |
| 6 Kurzversion mocks, 4 course tests | **replace** | 24 full mocks, 8 Halbtests, 7 Diagnosen; keep `examKey` values; the 14 listening exercises they consume stay untouched until the consumers are re-pointed in the same PR ([12] §2.4) |
| `programs/*` + `courses/index.js` legacy player | **retire** per course as each v2 course ships | the live A1.1 keeps serving until v2 A1.1 passes review (`DECISIONS.md`) |
| `levelTestQuestions.json` (band-only) | **replace** | Einstiegscheck per course |
| `CourseCertificatePage.jsx` | **replace** | Teilnahmebescheinigung with the fixed line ([13] Impl. 7) |
| `explain-answer` (free-form AI explanation on request) | **restrict** | paid courses show pre-generated rule-card explanations; free-form AI explanation only in the free A1.1 until counsel clears the „Fragerecht" risk ([13] §2 risk table) |
| Server entitlement (`getTier()` reads no purchases) | **build first** | a server-side `hasLevelAccess` in the AI functions that reads `purchases` ([12] §4) |

---

## 12. Risks

| # | Risk | Likelihood · impact | Mitigation |
|---|---|---|---|
| R1 | **FernUSG:** AI rubric grading in a paid course may count as „Überwachung des Lernerfolgs"; exam-first shows those scores more prominently. Void contracts, repayment, fines up to €10,000 ([13] §1–2) | medium · high | formative only, private, retryable; no gates on AI; no Fragerecht; no score on any document; counsel before Wave 2 sales; the repeal draft (1 July 2027) is not law yet |
| R2 | **UWG:** the Prüfungsstand is read as a pass prediction | medium · high | module values against the official rule, ranges for AI parts, banned-word lint (Q13), no single percentage |
| R3 | **AI Act Annex III 3(b)** from 2 Dec 2027: AI scores that steer the path | medium · medium | plan and review use AI output only as dismissible suggestions; deterministic items drive the plan; re-review before Dec 2027 |
| R4 | **Grading accuracy** is unmeasured; German morphology is hard for automated feedback (AWE helped grammar least, [09] §5); B2 anchors are error-heavy | high · high | calibration gate per rubric (§3.6); ranges on the board; „Wie bewertet die KI?" page with limits; no accuracy claim until an agreement study |
| R5 | **Teaching to the test:** format drill without language; mock scores inflated by form familiarity (d = .26) | medium · high | situational spine; ≥75 % of items are teaching items; parallel forms only; the board counts full-length exam-mode attempts only |
| R6 | **Authoring volume:** 96 Lektionen, 24 full mocks, 15 other sets, ≈3,730–4,270 new SRS entries (sum of [07] targets), B-level audio | high · medium | families let items be rendered, not re-written, per lane; waves; dedicated mock authors; owner audio runs budgeted per course |
| R7 | **Format drift:** providers change formats (telc B1 word guidance unclear; Goethe B2 „circa" vs „mindestens", [02] Open q. 1, [03] §1) | medium · medium | lane profiles as data with „Stand" and sources; a quarterly check; Q04/Q16 tests |
| R8 | **Thin demand per lane** (telc A2 vs Goethe A2 unknown; DTZ volume falling, [08] §3) | medium · medium | lane choice measured at onboarding; lanes are data packs that can be added or retired |
| R9 | **No demand evidence yet** for AI grading (0 writing uses in 7 days; 2 sales, both €0, [12] §2.10) | high · high | scored speaking in the first session of every course; instrument (§8.5); decision point after Wave 1 |
| R10 | **Entitlement gap:** a buyer has no server-side right to AI grading today ([12] §4) | certain until fixed · high | build first (Wave 1) |
| R11 | **AI cost** per graded task unmeasured | medium · medium | measure in Wave 1; a fair-use cap stated in the terms, never „unbegrenzt" unless funded |
| R12 | **.1 courses sell worse** under strict exam-first honesty | medium · medium | the .1 page shows the pair's full Teil-Matrix; pair offer at checkout (owner) |
| R13 | **DTZ mis-selling** to people outside the Integrationskurs | low · high | explicit question and label; no DTZ-only product |
| R14 | **Copyright:** official Modellsätze used as calibration anchors; Goethe word lists not publishable ([07] Impl. 7) | low · high | private evaluation store only; `list_ref` tags, never list text |
| R15 | **Audio realism:** TTS mocks sound cleaner than real exam audio | medium · medium | several voices per mock, natural rate, ambient layers for announcements; „Computerstimme" label; human recordings later |
| R16 | **Exam anxiety:** listening anxiety correlates strongly with performance ([09] §7) | medium · medium | learning mode is the default; exam mode is chosen per session; calm countdown; short low-stakes Teil-Proben |
| R17 | **§ 327r BGB** for existing A1.2 buyers when v2 replaces the course | certain · low | free upgrade; old content reachable or no impairment; notice on a durable medium ([13] Impl. 15) |
| R18 | **Language of explanations:** Turkey is the largest spouse origin and does not read our English chrome ([10] §4) | medium · medium | explanations stored apart from German content so an L1 layer can be added ([10] Impl. 6) |

---

## 13. Open questions for the owner

1. **Launch lanes.** Confirm Goethe A2 + telc A2 both at launch, and DTZ as a B1 lane.
2. **Pair offers.** Offer A2.1 + A2.2 (and the B pairs) as a pair at checkout? The bundle is parked ([10] §6).
3. **Refund promise.** Adopt „30 Tage Geld zurück, ohne Angabe von Gründen" with linked terms ([13] Impl. 13)?
4. **Previews.** Is Lektion 1 of each paid course playable before purchase (the first-lesson-leak decision)?
5. **Fair use.** Which daily cap on AI evaluations is acceptable once the per-call cost is measured?
6. **Private calibration data.** May official performance samples be kept privately as anchor texts for testing
   the AI rubrics? (copyright; counsel)
7. **Wiederholungsplan** in A2.2 and B2.2 at launch, or v1.1?
8. **L1 layer.** When does a Turkish or Arabic explanation layer start?

---

## Sources

**Exam specifications (primary):**
Goethe A1 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf) ·
[Prüfungsziele SD1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) ·
[Übungssatz 01](https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz01.pdf) ·
Goethe A2 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf) ·
[Übungssatz](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) ·
Goethe B1 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf) ·
[Modellsatz](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) ·
[Prüfungsordnung](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsordnung.pdf) ·
Goethe B2 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf) ·
[Modellsatz](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) ·
telc [Übungstest Start Deutsch 1](https://shop.telc.net/media/catalog/product/file/2/0/20210103_5070-b00-010106_web_1.pdf) ·
[Übungstest Start Deutsch 2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) ·
[Übungstest B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) ·
[Übungstest B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) ·
DTZ [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) ·
[gast.de DTZ](https://www.gast.de/de/forschung-entwicklung/entwicklung/auftraege/deutsch-test-fuer-zuwanderer-dtz) ·
ÖSD [ZA1 Durchführungsbestimmungen](https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf) ·
[ZA1 Auswertungsbogen Schreiben](https://www.osd.at/wp-content/uploads/2019/01/za1_auswertungsbogen_schreiben.pdf) ·
DTB [BAMF B2 Modelltest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10) ·
[RO-DT](https://www.goethe.de/pro/relaunch/prf/rahmenordnung/Rahmenordnung-ueber-Deutsche-Sprachpruefungen-fuer-das-Studium-an-deutschen-Hochschulen.pdf) ·
Goethe digital exams, word-count function (snippet): [goethe.de](https://www.goethe.de/de/spr/prf/ddp.html).

**Buyers, market, law:**
[Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf) · [Drucksache 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf) ·
[Destatis PD26_186](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html) ·
[Destatis PD26_295](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html) ·
[BAMF spouse-visa leaflet](https://www.bamf.de/SharedDocs/Anlagen/DE/MigrationAufenthalt/Ehegattennachzug/ehegattennachzug.pdf?__blob=publicationFile&v=9) ·
[§10 StAG](https://www.gesetze-im-internet.de/stag/__10.html) ·
[Goethe Kurskalender 2026](https://www.goethe.de/resources/files/pdf354/kurskalender_2026-v3.pdf) ·
[vhs-Lernportal Infoblatt](https://www.vhs-lernportal.de/wws/bin/4007242-4008322-1-infoblatt_a1-b1.pdf) ·
[Lingoda pricing](https://www.lingoda.com/en/pricing/) · [tijusacademy (Goethe fees India)](https://tijusacademy.com/blogs/german/goethe-exam-fees-india-2026-costs-explained/) ·
[FernUSG](https://www.gesetze-im-internet.de/fernusg/BJNR025250976.html) ·
[BGH III ZR 137/25](https://www.bundesgerichtshof.de/SharedDocs/Entscheidungen/DE/Zivilsenate/III_ZS/2025/III_ZR_137-25.pdf?__blob=publicationFile&v=1) ·
[UWG](https://www.gesetze-im-internet.de/uwg_2004/BJNR141400004.html) · [§23 MarkenG](https://www.gesetze-im-internet.de/markeng/__23.html) ·
[AI Act Annex III](https://artificialintelligenceact.eu/annex/3/).

**Learning science (as used above):** [Latimier et al. 2021](https://doi.org/10.1007/s10648-020-09572-8) ·
[Hausknecht et al. 2007](https://doi.org/10.1037/0021-9010.92.2.373) · the rest via memo 09.

**Search volumes:** DataForSEO pulls of 2026-09-26/27 as recorded in `inputs/db-snapshot-2026-09-27.md` and memos
02, 03, 08, 10 (no MCP call was made for this proposal).

**Research memos:** `docs/course-v2/research/01`–`14` (each carries its own primary sources).
