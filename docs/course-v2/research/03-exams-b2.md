# 03 — B2 exam specifications: Goethe-Zertifikat B2, telc Deutsch B2, the job-related B2 exams, ÖSD B2, and DSH/TestDaF

**Date:** 2026-09-26 · **Wave:** course-v2 W1 research · **Scope:** the exact format, scoring and pass rules of the B2 exams a B2.1/B2.2 buyer may sit, and which Teil trains which skill and text type. Repo files were used only as claims to check. They are not conclusions to copy.

## Method

- **Primary documents downloaded (curl) and text-extracted (pypdf):**
  - Goethe: *Durchführungsbestimmungen B2* and *Prüfungsordnung* (both **Stand 1 Sep 2025**), *Modellsatz Erwachsene B2* (2nd ed., Aug 2025), bfu.goethe.de model pages.
  - telc: *Übungstest 1 Deutsch B2* (revised 2019, ©2021; it is also the Modelltest), *Deutsch-Test für den Beruf B2* (BAMF/telc 2020), *B2+ Beruf* Übungstests 1–2 (2015), *B2·C1 Beruf* (2020).
  - ÖSD: *ZB2 Durchführungsbestimmungen* (2019), Modellsatz and folder (2024).
  - Other: HRK/KMK *RO-DT* (version Nov 2025), and Klett's *Hinweise zum neuen Goethe-Zertifikat B2* (2019).
- **Rating sheets:** the Goethe sheets are rotated, so I read point values from text coordinates.
- **Web pages:** telc.net, testdaf.de, Studienkolleg München. www.goethe.de HTML pages return 403, but its PDFs return 200 via curl.
- **Demand data:** DataForSEO Google Ads search volume, Germany (2276), German, 2026-09-26, 30 keywords.
- **Counts:** word counts of model texts are my own counts (±10 %).
- **Not used:** Firecrawl (out of credits).

---

## 1. Goethe-Zertifikat B2 (modular)

The exam has four modules, which can be taken singly or together. The written modules run about 180 min with no breaks: Lesen 65, Hören ~40, Schreiben 75. Sprechen takes ~15 min for a pair (~10 alone), after **15 min of preparation** with notes. **No dictionaries** are allowed ([DFB B2 2025](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf), [Modellsatz](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf); per-Teil times from [Klett](https://www.klett-sprachen.de/downloads/22171/Hinweise_5Fzum_5Fneuen_5FGoethe_2DZertifikat_5FB2/pdf)).

| Teil | Prüfungsziel | Format · items | Time | Model-set text |
|---|---|---|---|---|
| Lesen 1 | Einstellungen verstehen | match 9 statements to 4 people | ~18 min | 4 forum posts, ~140 words each |
| Lesen 2 | Informationen verstehen | sentence insertion · 6 gaps, 8 sentences | ~12 | magazine article, ~330 words |
| Lesen 3 | Informationen verstehen | 3-option MC · 6 | ~12 | newspaper article, ~420 words |
| Lesen 4 | Standpunkte verstehen | match 6 headings to 8 opinions (1 example, 1 unused) | ~12 | reader opinions, ~45 words each |
| Lesen 5 | Regeln verstehen | match 3 paragraphs to headings (4 unused) | ~6 | *Studienordnung*, ~250 words |
| Hören 1 | Alltagsgespräche | 5 texts × (R/F + MC) · 10 | ~8 · **once** | ~110 words each |
| Hören 2 | Informationen | MC · 6 | ~10 · **twice** | radio interview with an expert, ~480 words |
| Hören 3 | Aussagen | "Wer sagt das?" (moderator + 2 guests) · 6 | ~7 · **once** | radio discussion, ~580 words |
| Hören 4 | Vorträge | MC · 8 | ~10 · **twice** | short lecture, ~430 words |
| Schreiben 1 | Meinungsäußerung | **Forumsbeitrag, ~150 words**, 4 Leitpunkte, "Einleitung und Schluss" | ~50 min | plastic packaging |
| Schreiben 2 | Persönliche Mitteilung | **message to a superior, ~100 words**, 4 Leitpunkte in an order you choose, "Anrede und Gruß" | ~25 min | intern overloaded, writes to Herrn Ebert |
| Sprechen 1 | Vor Publikum sprechen; Fragen | **Vortrag, ~4 min**, 1 of 2 topics, Einleitung–Hauptteil–Schluss, then partner questions | ~8 min for both | "Finanzierung des Studiums" |
| Sprechen 2 | Pro/kontra erörtern | **Diskussion**: exchange arguments, react, summarise "dafür oder dagegen?" | ~5 min for both | "Sollen Studierende ihre Professoren beurteilen?" |

The three Vortrag Leitpunkte always follow one pattern:
1. describe several alternatives;
2. describe one in detail;
3. give pros and cons and **evaluate them**.

The print Modellsatz asks for "circa" 150/100 words; the digital model says "mindestens" ([bfu](https://bfu.goethe.de/b2_mod_2MX6/schreiben.php)).

**Scoring** (DFB §§4–6; rating sheets in the Modellsatz):

- **Lesen and Hören:** 30 items each; the raw score × 3.33 is rounded, so **18 correct = 60 = pass**.
- **Schreiben (100):**
  - Teil 1 is worth **60** (sheet values 14 / 14 / 16 / 16 for Erfüllung / Kohärenz / Wortschatz / Strukturen).
  - Teil 2 is worth **40** (10 per criterion).
  - Two independent raters; the mean counts. A third rating happens if the two sit either side of 60 and the mean is under 60.
  - **Erfüllung = E zeroes the whole task.** E means under 50 % of the word count, or the topic missed.
- **Sprechen (100):**
  - Teil 1: four criteria at 8 each (Kohärenz includes *Flüssigkeit*), plus **Fragen/Antworten 12**.
  - Teil 2: four criteria at 10 each, including **Interaktion with Du/Sie register**.
  - **Aussprache 16**, rated across both parts. Klett groups this as 44/56.
- **Pass:** at least **60 per module**; no compensation between modules. Modules can be resat without limit.
  - Certificates can be combined.
  - On request, an overall certificate shows the best results within one year ([PO §14.7](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsordnung.pdf)).
- **Delivery:** paper or digital (German keyboard), plus online-from-home "unter bestimmten Voraussetzungen".
- **Calibration material:** the Modellsatz prints two **uncorrected learner texts as B2 samples**. They contain many surface errors ("in der Restaurants", "Mit freundlichen Grüße").

## 2. telc Deutsch B2

The written exam is 140 min: Reading and Sprachbausteine share **90 min**, then Hören ~20 min and Schreiben **30 min**. The oral is a pair exam of ~15 min after **20 min preparation**. Formats are digital, hybrid and paper, and a partial exam is possible ([Übungstest 1](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf), [telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2/)).

| Teil | Format · items | Points | Model-set text |
|---|---|---|---|
| LV 1 Global | match 10 headlines to 5 texts | 25 | 5 reports, ~240 words each |
| LV 2 Detail | MC · 5 | 25 | 2 articles, ~600 words together |
| LV 3 Selektiv | match 10 situations to 12 ads; "x" = none | 25 | ads, ~90 words each |
| SB 1 / SB 2 | MC cloze · 10 / 10 gaps from a 15-word box | 15 + 15 | informal letter / report |
| HV 1 / 2 / 3 | R/F · 5 / 10 / 5, **all played once** | 25 each | news (~420 words) / interview (~840) / 5 announcements |
| Schriftlicher Ausdruck | pick A (*Bitte um Informationen*) or B (*Beschwerde*); **(halb)formelle E-Mail, ≥150 words**; **3 of 4 Leitpunkte, or 2 plus one of your own**; Betreff, Anrede, Schluss | 45 | responds to an ad |
| M1 Über Erfahrungen sprechen | ~1½ min on 1 of 7 topics (**prepared at home**), then partner questions | 25 | book, trip, important person |
| M2 Diskussion | summarise a text read in preparation (≤1 min), then argue | 25 | "Getrennte Schulen für Mädchen und Jungen?" |
| M3 Gemeinsam etwas planen | negotiate a plan | 25 | trip for seniors |

**Scoring:**

- **Writing** has three criteria at 5/3/1/0 each: Aufgabenbewältigung, Kommunikative Gestaltung, Formale Richtigkeit. The sum × 3 gives the score.
  - "Eine angemessene Behandlung eines Leitpunktes … erfordert mehr als nur ein einziges Satzgefüge."
  - No A on criterion II without Betreff, Anrede and Schlussformel.
  - No B if the Leitpunkte are "linear ohne logische Verknüpfung aufgelistet" or the register is wrong.
  - A missed topic gives D on every criterion.
- **Oral:** per part, Ausdrucksfähigkeit 7, Aufgabenbewältigung 7, Formale Richtigkeit 7, Aussprache 4.
  - Examiners **must interrupt memorised speeches**.
  - "Nachfragen und gegenseitige Hilfestellungen werden positiv bewertet."
- **Pass:** **135/225 written and 45/75 oral**, with compensation *within* the written part. A failed part can be retaken in the same or the next calendar year.
- **Weighting:** Lesen and Hören give 150 of the 225 written points; the Sprachbausteine give 30 (10 % of the exam).

## 3. Job-related B2 exams (all telc)

No product called "telc Deutsch B2 Beruf" exists today. Three products compete for that name.

**DTB B2 (Deutsch-Test für den Beruf)** is the final exam of the BAMF Basisberufssprachkurs B2 (§ 45a AufenthG). It is paper only, with no partial exam ([Übungstest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10), [telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/german-for-business/german-for-business-b2/)).

- **Lesen, 45 min:** 4 parts.
- **Lesen + Schreiben, 20 min:** a customer complaint forwarded by the team lead; you **write the reply e-mail** that carries out every instruction.
- **Hören, 20 min:** 4 parts.
- **Hören + Schreiben, 5 min:** a phone message becomes a **Telefonnotiz**.
- **Sprachbausteine + Schreiben, 35 min:** 2 clozes, then an intranet **Forumsbeitrag**, 1 of 2 topics. **No word count is given.**
- **Sprechen, ~16 min, no preparation:**
  - 1A: a 2-min talk on a workplace topic.
  - 1B: examiner questions.
  - 1C: the **partner restates one aspect in their own words** (mediation).
  - 2: small talk with a colleague.
  - 3: solve a workplace problem together.
- **Scoring:** 240 points, 60 per skill. Criteria II–IV in writing are rated across tasks.
- **Pass:** **≥144 total**, and 3 of 4 skills at ≥60 %; the fourth may be 40–60 %.

**telc Deutsch B2+ Beruf:** 100 points ([Übungstest 1](https://goeasyberlin.de/wp-content/uploads/2016/04/telc_Deutsch_Ubungstest_B2_Beruf.pdf), [telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2-business/)).

- Lesen: 20 MC items, 60 min, 20 points.
- Schreiben: a letter or short report of **180–200 words** (20 points) plus an e-mail of **60–80 words** (5 points).
- Hören: 20 points. Sprachbausteine: 10 points.
- Oral: Präsentieren, Diskutieren, Verhandeln, 25 each, divided by 3.
- **Pass:** ≥45/75 written and ≥15/25 oral.

**telc Deutsch B1·B2 Beruf and B2·C1 Beruf** are *scaled*: the certificate level depends on the result. B2·C1 needs **B2 in Sprechen** for any certificate at all. Its writing is three work e-mails/papers in 60 min ([Übungstest](https://ehrstein.de/bilder/telc-Uebungstests/uebungstest_Deutsch_B2_C1_Beruf.pdf?m=1615803303)).

## 4. ÖSD Zertifikat B2 (ZB2)

There are two modules. The written module takes ~210 min: Lesen 90, Hören ~30, Schreiben 90. The oral takes 15 min alone or 20 min in a pair, after 15 min preparation. **Dictionaries are allowed**, and texts come from Austria, Germany and Switzerland ([DFB 2019](https://osd.at/wp-content/uploads/2019/04/zb2-durchfuehrungsbestimmungen.pdf), [Modellsatz s](https://www.osd.at/wp-content/uploads/2020/03/ZB2-Modellsatzs_s.pdf), [Modellsatz m](https://www.osd.at/wp-content/uploads/2020/03/ZB2-Modellsatz_m.pdf), [folder](https://osd.at/wp-content/uploads/2024/02/ZB2_Folder.pdf)).

- **Lesen (20 points; 5 per task):**
  - MC on a ~650-word article.
  - Match 5 texts to 10 headlines.
  - **Reconstruct a text whose right margin is cut off** (20 gaps, ≤3 letters each).
  - A formal-letter cloze (10 gaps).
- **Hören (20 points):**
  - A radio feature, R/F · 10, **played twice**.
  - A conversation where you **fill in a comparison grid**.
- **Schreiben (2 × 15 points):**
  - A **formal Beschwerde-E-Mail, ~120 words**, built from notes.
  - A **Meinungsäußerung, ~120 words**, 1 of 2 prompts, covering your view, reasons, experience and your home country.
- **Sprechen (30 points):**
  - Meet a stranger on a train and **exchange tips**.
  - Choose, **describe and interpret a photo**.
  - **Argue an assigned role's position.**
- **Pass:** ≥42/70 written with **≥10/20 in both Lesen and Hören** (below that, the whole written module fails); ≥18/30 oral.

## 5. Studium: what B2 does and does not open

- The RO-DT (2025) accepts **DSH-2**, **TestDaF with TDN 4 in all four parts**, the Studienkolleg Feststellungsprüfung, or DSD II.
- It exempts Goethe C2, ÖSD C2 and **telc C1 Hochschule**. **No B2 certificate is listed** ([RO-DT §§2, 8](https://www.goethe.de/pro/relaunch/prf/rahmenordnung/Rahmenordnung-ueber-Deutsche-Sprachpruefungen-fuer-das-Studium-an-deutschen-Hochschulen.pdf)).
- Universities may set lower requirements (DSH-1/TDN 3) for particular programmes, with conditions attached (§1(3–5)).
- The digital TestDaF has Lesen (34 items, ~55 min), Hören (30 items, ~40 min), Schreiben (2 tasks, ~60 min) and Sprechen (7 tasks, ~35 min) ([testdaf.de](https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/aufbau-des-digitalen-testdaf/)).
- Studienkolleg München: "Solide Deutschkenntnisse auf dem Niveau B2 sind … unerlässlich" ([page](https://xn--studienkolleg-mnchen-3ec.de/bewerben/bewerbung-an-der-universitaet/sprachliche-und-fachliche-voraussetzungen)).
- **So B2 is a bridge**: the level for Studienkolleg entry and the step toward DSH/TestDaF.
- Doctors need **general B2 plus a C1-oriented Fachsprachprüfung** ([Marburger Bund](https://www.marburger-bund.de/bundesverband/service/auslaendische-aerzte/foreign-physicians/anforderungen-deutschkenntnisse), [Ärzteblatt](https://www.aerzteblatt.de/archiv/161121/Auslaendische-Aerzte-Umgangssprache-reicht-nicht-aus)).

## 6. Demand signal (Germany, monthly searches, DataForSEO)

| Keyword | Vol. | Keyword | Vol. |
|---|---|---|---|
| telc b2 prüfung | **8,100** | deutsch test für den beruf b2 | 880 |
| deutsch b2 kurs | 4,400 | dtb b2 | 590 |
| testdaf | 3,600 | telc b2 mündliche prüfung | 320 |
| telc b2 / b2 prüfung | 2,400 / 2,400 | telc b2 beruf | 320 |
| goethe b2 prüfung | 1,300 | telc b2 schreiben | 260 |
| telc b2 modelltest | 1,300 | b2 forumsbeitrag | 140 |
| dsh prüfung | 1,300 | goethe b2 schreiben | 110 |
| deutschkurs b2 online | 1,000 | ösd b2 | 90 |
| goethe zertifikat b2 | 880 | telc b1 b2 beruf | 50 |

In Germany, telc B2 leads search demand at about 6× Goethe B2; DTB B2 is second. Goethe likely matters more abroad, which this query cannot see.

## 7. Rehearsal map: Teil → skill → text type

| Exam · Teil | Skill + operation | Text type to rehearse |
|---|---|---|
| Goethe L1 · telc LV1 · ÖSD L2 | global reading, attitude/paraphrase matching | forum posts; headlines |
| Goethe L2 | cohesion (reference, connectors) | report with sentence gaps |
| Goethe L3 · telc LV2 · ÖSD L1 | detailed reading, MC | article, 400–650 words |
| Goethe L4 | standpoint detection | short reader opinions |
| Goethe L5 · DTB L | rules and instructions | Studienordnung; work instructions |
| telc LV3 · DTB L1 | selective reading with a "no match" option | ads, notices |
| telc SB · DTB SB · ÖSD L3/L4 | connectors, prepositions, relative forms, collocations | formal letters, reports |
| Goethe H1 · telc HV1/HV3 | short public or everyday audio, **single play** | dialogues, news, announcements |
| Goethe H2 · telc HV2 · ÖSD H1 | detail in an interview (telc once) | radio interview/feature |
| Goethe H3 | who said what, 3 voices | radio panel |
| Goethe H4 | following a lecture's argument | 5–7 min Vortrag |
| ÖSD H2 · DTB H+S | notes and grids while listening | info dialogue; Telefonnotiz |
| Goethe S1 · DTB S · ÖSD S2 | **argued opinion text** | Forumsbeitrag/Meinungsäußerung, 120–150 words |
| Goethe S2 · telc SA · ÖSD S1 · DTB L+S | **(semi-)formal e-mail**: request, complaint, apology plus proposal, reply to a customer | E-Mail with Betreff/Anrede/Gruß, 100–150 words |
| Goethe Sp1 · DTB 1A · B2+ Präsentieren | **structured 2–4 min monologue**, then questions | Kurzvortrag |
| telc M1 · ÖSD Sp2 | narrate an experience / interpret a picture | Erfahrungsbericht; Bildbeschreibung |
| Goethe Sp2 · telc M2 · ÖSD Sp3 | **pro/contra discussion**, react, summarise a stance | Debatte |
| telc M3 · DTB 3 · B2+ Verhandeln | **negotiate a plan or solution** | Planungsgespräch; workplace problem |
| DTB 1C · DTB 2 · ÖSD Sp1 | mediation (paraphrase a partner); small talk, register switching | Paraphrase; Smalltalk |

**The core shared across all exam families:**
- two writing genres: the opinion post and the formal e-mail;
- three speaking genres: the monologue, the discussion and joint planning;
- single-play listening;
- precision with connectors and register.

---

## Implications for the course blueprint

1. **Build one exam-agnostic B2 core with switchable exam lanes** (telc, Goethe, DTB) instead of three courses. telc leads German search demand (§6); Goethe serves buyers abroad; DTB serves Berufssprachkurs graduates. An ÖSD lane is not justified (90 searches/month); a note on dictionaries and Austrian variants is enough.
2. **Two writing genres, each with its own ladder.**
   - (a) The **argued opinion text** of 120–150 words: thesis, reasons with examples, counter-position, conclusion.
   - (b) The **(semi-)formal e-mail** in four functions: request, complaint, apology plus proposal to a superior, and reply to a customer on a manager's instruction.
   - Most B2 units should end in one of these, AI-graded at criterion level.
3. **Put the official zero-rules in the deterministic checker, before the AI sees the text:**
   - a live word counter (Goethe gives E, zero points, below 50 % of the target);
   - Leitpunkt coverage (telc needs more than one clause per point);
   - Betreff, Anrede and Schlussformel present;
   - Du/Sie register drift;
   - topic missed.
4. **Rubric profiles per exam, never a generic "B2 score":**
   - Goethe: 4 criteria, A–E, 60/40.
   - telc: 3 criteria at 5/3/1/0, × 3.
   - DTB: criterion I per task, II–IV across tasks.
   - Show an **unofficial Richtwert** on the chosen exam's scale. Never a predicted pass.
5. **Calibrate the AI grader on official B2 samples.** Goethe labels error-heavy texts as B2. A grader tuned to surface errors will under-score real B2 learners. Use these samples as anchor texts in prompts and in tests.
6. **Three AI-graded speaking drills:**
   - (a) A **4-min Vortrag** with an Einleitung–Hauptteil–Schluss timer, using Goethe's alternatives → detail → pros/cons + evaluation pattern, followed by **Fragen/Antworten** (12 Goethe points).
   - (b) A **pro/contra discussion** against an AI partner that disagrees and asks for a summary. Interaction is 40 Goethe points and a whole telc part.
   - (c) **Joint planning or problem-solving**, plus a DTB-style **paraphrase-your-partner** step.
7. **Reward spontaneity, not recitation.** telc examiners must interrupt memorised speeches. For telc Teil 1's seven known topics, the coach should vary follow-up questions and score rephrasing.
8. **Default to single-play listening from B2.1.** All of telc and Goethe Teile 1 and 3 play once. Allow replays only in learning mode and report the two scores separately. Audio to produce with Azure TTS:
   - news;
   - 5–8 min interviews;
   - 3-voice panels;
   - lectures;
   - announcements;
   - phone messages for note-taking.
9. **Sprachbausteine are a precision strand, not the centre.** They are 10 % of telc and absent from Goethe. One cloze per unit is enough (connectors, prepositions, relative/genitive forms, formal collocations).
10. **Split the half-levels honestly.**
    - **B2.1** builds the genres and strategies at reduced length.
    - **B2.2** adds exam-length texts, full timings (Goethe Lesen 65 min, telc 90) and at least two complete mocks per lane.
    - B2 exams certify the full B2 only. B2.1 copy must not imply exam readiness, and neither half may promise a pass.
11. **Academic mini-strand, framed correctly.** Goethe already includes a Studienordnung, a lecture and a seminar Vortrag. Call B2 "Studienkolleg level / bridge to DSH–TestDaF" and state that universities require DSH-2 or TDN 4 × 4.
12. **Fix the repo's telc mock before reusing it.** `src/data/mockExams/telcB2.js` asks for a "formellen Brief (ca. 150–180 Wörter)" covering "alle vier Leitpunkte". The official task is a choice of 2 prompts, **3 of 4 Leitpunkte (or 2 + your own)**, **≥150 words**, as an **e-mail with Betreff**.

## Open questions

- Should B2 be marketed to Berufssprachkurs learners? The DTB lane (no preparation time, mixed-skill tasks) is extra work.
- Can we produce two exam-length original mocks per lane for B2.2?
- Has telc published a newer B2 Modelltest after 2021? I found no format change, but did not confirm it.
- How should the in-app course certificate be worded so that no one mistakes it for an official one?

## Unverified

- The Goethe Teil 1 criterion split (14/14/16/16) is read from PDF coordinates, and the row alignment is ambiguous. The 60/40 Teil totals are confirmed by Klett.
- The Goethe word targets say "circa" in print and "mindestens" in the digital model. Which binds in the digital exam is unverified.
- ÖSD: the number of plays for Hören Aufgabe 2 is not stated in the model; the DFB is from 2019, and a newer version may exist.
- telc B2+ Beruf: the Schreiben time (60 min) comes from telc.net only; the oral part timings were not readable.
- The TDN-to-CEFR mapping per level exists only as a diagram on testdaf.de.
- "600–800 UE to reach B2" appeared only in a search snippet (goethe.de returns 403), so it is not used above.
- The per-Land doctor requirements were not checked beyond the two sources cited.
