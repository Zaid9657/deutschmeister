# 02 — B1 exam specifications: Goethe-Zertifikat B1, telc Deutsch B1, DTZ, ÖSD B1

**Date:** 2026-09-26 · **Wave:** course-v2 W1 research · **Scope:** exact formats, scoring and pass rules at B1, which exam each buyer needs, and a map of which Teil trains which skill and text type. Repo docs were used only as claims to check. They are not conclusions to copy.

## Method

- **Primary documents downloaded and text-extracted** (pypdf): Goethe *Durchführungsbestimmungen B1* and *Prüfungsordnung* (both **Stand 1 Sep 2025**), Goethe/ÖSD *Modellsatz Erwachsene* (2nd ed. 2015) and *Übungssatz Erwachsene* (2016), the Hueber sample of *Zertifikat B1 – Prüfungsziele, Testbeschreibung* (2013), telc *Übungstest 1 Zertifikat Deutsch B1* (revised 2019, 13th printing 2020), the BAMF *DTZ Prüfungsziele/Testbeschreibung* handbook (2009), g.a.s.t. *DTZ Übungssatz 1* (June 2024), and Bundestag Drucksache 21/5716 (4 May 2026). goethe.de PDFs returned 200 via curl, although WebFetch gets a 403 on goethe.de pages.
- **Web pages:** bfu.goethe.de B1 model-set pages (Lesen, Schreiben, Sprechen), telc.net B1 page, gast.de DTZ page, BAMF Abschlussprüfung and Einbürgerung pages, osd.at ZB1 and ZDÖ B1 pages, wien.gv.at, and the Auswärtiges Amt (Bischkek) Ausbildung-visa page. The statute texts (§10 StAG; §§2, 9, 18c AufenthG) came from gesetze-im-internet.de.
- **DataForSEO** `keywords_data/google_ads/search_volume/live`, Germany (2276), German. Run 2026-09-26, 30 keywords.
- **Word counts** of the model-set texts are my own counts from the extracted text. Read them as ±10 %.
- **Not used:** Firecrawl (out of credits), because a paid key is not needed for this topic.

---

## 1. Goethe-Zertifikat B1 (identical to ÖSD Zertifikat B1)

The exam was developed jointly by the Goethe-Institut, ÖSD and the University of Fribourg. Since Feb 2013 it has replaced the Zertifikat Deutsch at Goethe and ÖSD centres ([Hueber sample](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190318681_Muster.pdf)). It has **four modules that can be taken one at a time or together**. The written modules total about 165 min: Lesen 65, Hören about 40, Schreiben 60, with at least 15 min break between modules. Sprechen takes about 15 min for a pair (about 10 min alone) after **15 min of preparation**. Candidates may use their notes ([DFB B1, 2025](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf)).

| Module · Teil | Task (official Prüfungsziel) | Format · items | Time / plays | Model-set text |
|---|---|---|---|---|
| Lesen 1 | Korrespondenz lesen | Richtig/Falsch · 6 | 10 min | personal blog post, ~300 words |
| Lesen 2 | Information und Argumentation verstehen | 3-option MC · 6 (2 press texts × 3) | 20 min | 2 newspaper articles, ~200–300 words each |
| Lesen 3 | Zur Orientierung lesen | matching · 7 situations to 10 ads, one situation has none ("0") | 10 min | classified ads |
| Lesen 4 | Information und Argumentation verstehen | Ja/Nein · 7 ("Ist die Person für ein Verbot?") | 15 min | 7 reader comments, ~50–65 words each |
| Lesen 5 | Schriftliche Anweisung verstehen | 3-option MC · 4 | 10 min | Hausordnung / rules, ~230 words |
| Hören 1 | Ankündigungen, Durchsagen, Anweisungen | 5 short texts × (R/F + MC) · 10 | **played twice** | voicemail, station announcement, weather, radio |
| Hören 2 | Als Zuhörer im Publikum verstehen | MC · 5 | **played once**; 60 s to read the items | guided tour / talk, ~400 words |
| Hören 3 | Gespräche zwischen Muttersprachlern | R/F · 7 | **played once** | informal conversation, ~500 words |
| Hören 4 | Radiosendungen verstehen | matching "Wer sagt was?" (moderator + 2 guests) · 8 | **played twice** | radio discussion, ~850 words |
| Schreiben 1 | Persönliche Mitteilung zur Kontaktpflege | informal e-mail, **~80 words**, 3 Leitpunkte (beschreiben, begründen, Vorschlag) | 20 min | — |
| Schreiben 2 | Persönliche Meinung äußern | forum / guest-book post, **~80 words** | 25 min | prompt is a short opinion post |
| Schreiben 3 | Mitteilung zur Handlungsregulierung | formal e-mail, **~40 words** (apologise, give a reason, ask) | 15 min | — |
| Sprechen 1 | Gemeinsam etwas planen und aushandeln | pair dialogue from 4 Leitpunkte + "…" | ~3 min | — |
| Sprechen 2 | Ein Thema präsentieren | monologue from **5 fixed slides**, one of 2 topics chosen | ~3 min | — |
| Sprechen 3 | Situationsadäquat reagieren | give feedback on the partner's talk and ask one question; answer questions on your own talk | ~2 min | — |

Sources: [Modellsatz](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf), [bfu Lesen](https://bfu.goethe.de/b1_mod/lesen.php), [DFB 2025](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf).

The five slides are fixed: (1) introduce the topic and the structure of the talk, (2) a personal experience, (3) the situation in your home country, (4) pros and cons plus your own opinion, (5) close and thank the audience ([Modellsatz p. 27](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf)).

**Scoring** ([DFB 2025](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf), [bfu Schreiben](https://bfu.goethe.de/b1_mod/schreiben.php), [bfu Sprechen](https://bfu.goethe.de/b1_mod/sprechen.php)):

- **Lesen and Hören:** 30 items, 1 raw point each. Raw points × 3.33 give the module score (30 → 100). **18 correct = 60 = pass.** 17 correct is 57, a fail.
- **Schreiben (100 points):**
  - Aufgabe 1: 40 points (Erfüllung, Kohärenz, Wortschatz, Strukturen at 10 each, on a 10 / 7.5 / 5 / 2.5 / 0 scale).
  - Aufgabe 2: 40 points, same criteria.
  - Aufgabe 3: 20 points (4 / 4 / 6 / 6).
  - Two raters mark independently and the mean counts. A third rating happens if one rater is above 60 and the other below and the mean is under 60.
  - **If Erfüllung = E, the whole task scores 0.** E is given when the text is under 50 % of the required word count or misses the topic ([Modellsatz criteria](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf)).
- **Sprechen (100 points):**
  - Teil 1: 28 (Erfüllung 8, Interaktion 4, Wortschatz 8, Strukturen 8).
  - Teil 2: 40 (12 / 4 / 12 / 12).
  - Teil 3: 16 (Erfüllung only).
  - Aussprache: 16 across all parts.
  - The opening small talk is not scored. The Teil 2 band A requires "Alle 5 Folien in Inhalt und Umfang angemessen behandelt".
- **Pass:** at least 60 points in each module. Grade bands are 90 / 80 / 70 / 60.
- **Resits:** each module can be resat any number of times. A single **Gesamtzeugnis** is issued only when all four modules are passed at one centre on one date. Otherwise the separate module certificates "sind … kombinierbar" ([Prüfungsordnung §14.7, §15](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsordnung.pdf)).
- **Digital:** there is an in-centre laptop version where candidates type on a German keyboard, Lesen and Hören are machine-scored, and Sprechen tasks are still on paper. An online-from-home version is also allowed "unter bestimmten Voraussetzungen" (DFB annex).
- **Guided study time:** "circa 500 Unterrichtseinheiten" (45 min each) in intensive courses ([Hueber sample](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190318681_Muster.pdf)).

## 2. telc Deutsch B1 / Zertifikat Deutsch

The exam is **not modular**. It has a written part of 150 min and an oral pair exam of about 15 min with **20 min preparation**. Candidates may use notes but should not read from them ([telc Übungstest 1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf), [telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/)).

| Subtest · Teil | Format · items | Points (points per item) | Time / plays | Text |
|---|---|---|---|---|
| Leseverstehen 1 (global) | match 5 texts to 10 headlines | 25 (5.0) | 90 min shared by LV and SB | 5 short press items, ~80–150 words |
| Leseverstehen 2 (detail) | MC a/b/c · 5 | 25 (5.0) | ″ | 1 press article, ~400 words |
| Leseverstehen 3 (selective) | 10 situations to 12 ads, "x" if none | 25 (2.5) | ″ | classified ads |
| Sprachbausteine 1 (grammar) | MC a/b/c · 10 gaps in a letter | 15 (1.5) | ″ | personal / semi-formal letter |
| Sprachbausteine 2 (lexis) | 10 gaps, choose from 15 words (a–o) | 15 (1.5) | ″ | letter / notice |
| Hörverstehen 1 (global) | R/F · 5 | 25 (5.0) | **played once** | 5 short opinion statements |
| Hörverstehen 2 (detail) | R/F · 10 | 25 (2.5) | **played twice** | conversation or interview |
| Hörverstehen 3 (selective) | R/F · 5 | 25 (5.0) | **played twice** | announcements, voicemail, weather, Durchsagen |
| Schriftlicher Ausdruck | reply to an e-mail, informal or semi-formal, **4 Leitpunkte**; Betreff, Anrede, Einleitung and Schluss expected | 45 | 30 min | the prompt e-mail |
| Mündlich 1 | Einander kennenlernen | 15 | ~3 min | cue list |
| Mündlich 2 | Über ein Thema sprechen: each partner reports a different opinion from a sheet, then they discuss with own experience | 30 | ~6 min | 2 short quoted opinions |
| Mündlich 3 | Gemeinsam etwas planen: agree what to do and **who does what** | 30 | ~6 min | task sheet with bullet list |

**The official sample gives no word count for the e-mail.**

**Writing criteria:**

- There are three criteria: Aufgabenbewältigung (how many Leitpunkte are handled), Kommunikative Gestaltung and Formale Richtigkeit. Each scores A/B/C/D = 5/3/1/0, and the sum is multiplied by 3 to give 45.
- Rules written into the scale:
  - A Leitpunkt counts even if it is a single short sentence or shares a sentence with another.
  - Kommunikative Gestaltung cannot reach A if the register is wrong or mixed, if the Leitpunkte stand unconnected, or if **"die Sätze überwiegend mit Ich oder Wir beginnen"**.
  - "Thema verfehlt" means D on every criterion. "Situierung verfehlt" means D on criterion I only.
- There are two raters, and **the second rating overrides the first** ([Übungstest pp. 36–38](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf)).

**Oral criteria:** Ausdrucksfähigkeit, Aufgabenbewältigung, Formale Richtigkeit and Aussprache/Intonation, scored separately for each part. Teil 1 uses 4/3/1/0 (Aussprache 3/2/1/0); Teile 2 and 3 use 8/6/2/0 (Aussprache 6/4/2/0). "Nachfragen und gegenseitige Hilfestellungen werden positiv bewertet."

**Pass rule:** **60 % in the written part (135/225) AND 60 % in the oral part (45/75), each on its own.** Within the written part, points offset each other freely: Lesen, Sprachbausteine, Hören and Schreiben have no separate minimums. Grade bands are 270 / 240 / 210 / 180. A failed or missed part can be resat **"innerhalb des Kalenderjahres … oder im darauffolgenden Kalenderjahr"** (2020 edition). A computer-based version exists ([telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/)).

## 3. DTZ — Deutsch-Test für Zuwanderer (A2–B1, scaled)

- **Operator:** g.a.s.t. has run the DTZ since **1 Jan 2023**. "Das Testformat und die Aufgabentypen bleiben unverändert" ([g.a.s.t. Übungssatz 1, June 2024](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf)).
- **Access:** candidates need an Integrationskurs entitlement or earlier attendance of at least one course section (self-paying is allowed). **"Personen außerhalb des Integrationskurssystems können nicht am DTZ teilnehmen."** Sessions run every two weeks ([gast.de](https://www.gast.de/de/forschung-entwicklung/entwicklung/auftraege/deutsch-test-fuer-zuwanderer-dtz)).
- **Timing:** the written part is 100 min with no breaks (Hören about 25, Lesen 45, Schreiben 30). The oral pair exam takes about 16 min, within a 20-min slot that includes examiner deliberation. **There is no preparation time** ([BAMF DTZ handbook](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/Modellsaetze/dtz-handbuch_pdf.pdf?__blob=publicationFile&v=8), g.a.s.t. 2024).

| Teil | Task | Format · items | Text (Übungssatz 2024) |
|---|---|---|---|
| Hören 1 | phone messages, public announcements | MC · 4 | **every Hören text is played once** |
| Hören 2 | short media information | MC · 5 | radio: events, medicine, cinema, weather |
| Hören 3 | everyday conversations | 4 R/F + 4 MC | 4 dialogues, private and work |
| Hören 4 | different opinions on one topic | matching · 3 | listener vox-pops |
| Lesen 1 | catalogues, registers, directories | MC · 5 | web page, store directory, timetables |
| Lesen 2 | information in ads | matching · 5 | ads |
| Lesen 3 | press texts and formal notices | 3 R/F + 3 MC | school letter, ~110 words |
| Lesen 4 | information brochures | R/F · 3 | brochure, ~250 words |
| Lesen 5 | fill single words in a letter | MC · 6 | formal complaint letter: *Sehr geehrte…*, *weil/obwohl/nachdem*, *kein/nicht* |
| Schreiben | semi-formal or formal message; **choose A or B**; 4 Leitpunkte; Anrede and Gruß; "Schreiben Sie möglichst viel" | 1 text | e.g. e-mail to a training centre; letter to the landlord |
| Sprechen 1A / 1B | talk about yourself from cues (Name, Geburtsort, Wohnort, Arbeit …); answer the examiner's follow-ups | ~4 min total | cue sheet |
| Sprechen 2A / 2B | talk about **a photo**, your own experience, **compare with your home country**; follow-ups | ~6 min | a different photo per candidate |
| Sprechen 3 | plan something together | ~6 min | shared sheet with Leitpunkte |

**Scoring** ([g.a.s.t. pp. 47–49](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf)):

- **Hören and Lesen** are scored together out of 45 items: **33–45 = B1**, 20–32 = A2.
- **Schreiben** has four criteria (Inhalt, Kommunikative Gestaltung, Korrektheit, Wortschatz), each on a 5/4/3/2/1/0 scale: **15–20 = B1**, 7–14 = A2.
- **Sprechen:**
  - Task fulfilment counts 50 points: 1A 5, 1B 5, 2A 10, 2B 10, **Teil 3 20**.
  - Language counts 50 points: Aussprache 10, Flüssigkeit 10, Korrektheit 15, Wortschatz 15.
  - **75–100 = B1**, 35–74.5 = A2.
- **Certificate rule:** a B1 certificate requires **Sprechen B1 plus B1 in either Hören/Lesen or Schreiben.** A Sprechen result "unter A2" means no certificate at all.
- **Thresholds are 73–75 %, not 60 %.**

**Outcomes** ([Drucksache 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf), the best result per person):

| Year | Candidates | B1 | A2 | Below A2 |
|---|---|---|---|---|
| 2023 | 294,372 | 55.9 % | 33.0 % | 11.2 % |
| 2024 | 320,343 | 56.3 % | 32.0 % | 11.6 % |
| 2025 | 318,550 | **55.0 %** | 32.2 % | 12.8 % |

This confirms the repo's buyer-research figures. No per-section failure data is published.

## 4. ÖSD at B1 and Austria

- **ÖSD Zertifikat B1 (ZB1)** is the same exam as the Goethe B1 and can be taken at either provider's centres. It has been paper or digital since 1 Jan 2024. A full certificate requires all four modules passed **within one year at the same centre**, which is stricter than Goethe's current rule ([osd.at ZB1](https://osd.at/en/portfolio-item/osd-zertifikat-b1-zb1/)).
- **ÖSD Zertifikat Deutsch Österreich B1 (ZDÖ B1)** is a separate exam for immigrants to Austria. It has two modules, written and oral, and grew out of the old Zertifikat Deutsch ([osd.at ZDÖ](https://osd.at/en/portfolio-item/osd-zertifikat-deutsch-osterreich-b1-zdo-b1/)). A search snippet describes a telc-like structure (Lesen 3 + Sprachbausteine 2 in 90 min, Hören 3 in about 30 min) *(unverified)*.
- **Austrian citizenship at B1:** Vienna lists only the **ÖIF-Integrationsprüfung** certificate, plus ÖSD-Integrationsprüfung certificates from exams taken between 29 May 2018 and 30 May 2021. Goethe, telc and ÖSD certificates are listed only at **B2** ([wien.gv.at](https://www.wien.gv.at/zusammenleben/staatsbuergerschaft-deutschkenntnisse)). The Austrian B1 buyer therefore needs a different exam (ÖIF IP B1, with a values section), which is out of scope here.

## 5. Which exam each buyer needs (Germany unless stated)

| Segment | Legal requirement | Exams that satisfy it | Notes |
|---|---|---|---|
| **Einbürgerung** | "Anforderungen einer Sprachprüfung der Stufe B 1" ([§10 Abs. 4 StAG](https://www.gesetze-im-internet.de/stag/__10.html)); Einbürgerungstest at least 17/33; 5 years of residence ([BAMF](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html)) | DTZ with B1 (the Zertifikat Integrationskurs counts per BAMF), telc B1, Goethe/ÖSD B1 (all four modules, per secondary sources) | The 3-year C1 fast track (§10 Abs. 3) is **repealed, in force 30 Oct 2025** ([asyl.net](https://www.asyl.net/view/aenderungen-des-staatsangehoerigkeitsgesetzes-am-30102025-in-kraft-getreten)); §10 Abs. 3 now reads "(weggefallen)" |
| **Niederlassungserlaubnis** | "ausreichende Kenntnisse der deutschen Sprache" ([§9 Abs. 2 Nr. 7](https://www.gesetze-im-internet.de/aufenthg_2004/__9.html)) = **B1** ([§2 Abs. 11](https://www.gesetze-im-internet.de/aufenthg_2004/__2.html)); also basic knowledge of the legal and social order (Nr. 8) | the same B1 exams; the Zertifikat Integrationskurs covers both ([BAMF](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html)) | Skilled workers: B1 after 3 years ([§18c Abs. 1](https://www.gesetze-im-internet.de/aufenthg_2004/__18c.html)). Blue Card: 27 months with A1, **21 months with B1** (§18c Abs. 2) |
| **Integrationskurs participant** | the course goal is B1 | **DTZ** (the default, and the only exam many of them will take) | Speaking is the gate |
| **Self-learner in Germany outside the course system** | as above | **telc B1 or Goethe B1**. The DTZ is **not accessible** to them. | This is the segment most exposed to the Feb 2026 course-admission stop *(see the repo's buyer memo, not re-verified here)* |
| **Abroad: Ausbildung visa** | B1 for qualified vocational training of 2 years or more; "nicht älter als ein Jahr" ([AA Bischkek](https://bischkek.diplo.de/kg-de/2499836-2499836)) | Goethe, ÖSD, telc (also TestDaF, ECL) | The DTZ cannot be taken abroad (its test centres are Integrationskurs providers) |
| **Work via Berufssprachkurs** | course-specific | DTB B1 (telc) *(snippet only)* | Out of scope for general B1 |
| **Austria (citizenship, Daueraufenthalt)** | B1 via Integrationsvereinbarung Modul 2 | ÖIF Integrationsprüfung B1 | Not ZB1 at B1 (Vienna list) |

**Search demand in Germany** (DataForSEO, monthly average over the last 12 months):

| Exam | Keyword volumes |
|---|---|
| telc | "telc b1 prüfung" **12,100**; "telc b1" 2,900; "telc b1 modelltest" 1,600; "telc deutsch b1" 880; "telc b1 schreiben" 320; "telc b1 sprechen" 170 |
| DTZ | "dtz" 4,400; "dtz prüfung" 2,900; "deutsch test für zuwanderer" 1,900; "dtz modelltest" 720; "dtz b1" 390; "dtz brief schreiben" 140; "dtz sprechen" 110 |
| Goethe | "goethe b1 prüfung" 1,900; "goethe zertifikat b1" 880; "goethe b1" 720; "goethe b1 modelltest" 590; "goethe b1 sprechen" 70; "goethe b1 schreiben" 70 |
| ÖSD | "ösd b1" **90** |
| Exam-neutral | "b1 prüfung" 12,100; "b1 brief schreiben" 1,900 |

Demand inside Germany runs roughly **telc ≫ DTZ > Goethe ≫ ÖSD**. Goethe demand abroad is not measured here.

## 6. What is shared and what is exam-specific

| Task family | Goethe | telc | DTZ |
|---|---|---|---|
| Plan something together | S1 (28 pts) | M3 (30/75) | S3 (20 of 50 task points) |
| E-mail/letter with 3–4 Leitpunkte | Sch1 (informal, 80 w), Sch3 (formal, 40 w) | SA (informal or semi-formal, 4 LP) | Schreiben (formal or semi-formal, 4 LP, A/B choice) |
| Situations ↔ ads | L3 (7:10, one "0") | LV3 (10:12, "x") | L2 (5 items) |
| Short announcements / voicemail | H1 (×2) | HV3 (×2) | H1–H2 (×1) |
| Everyday conversation R/F | H3 (×1) | HV2 (×2) | H3 (×1) |
| Opinions: who says what / stance | L4, H4 | HV1 | H4 |
| Rules / brochure text | L5 | — | L4 |
| Grammar/lexis cloze in a letter | — | SB1 + SB2 (20 items) | L5 (6 items) |
| Introduce yourself | unscored warm-up | M1 (15) | S1A/B |
| Monologue on a topic | S2 presentation, 5 slides | M2 report opinion + discuss | S2 photo + home country |
| Write an opinion text | Sch2 (80 w) | — | — |
| Headline matching | — | LV1 | — |

## 7. Rehearsal map: Teil → skill → text type

| Exam · Teil | Skill and operation | Text type to rehearse |
|---|---|---|
| G-L1 | read for detail, true/false on a narrative | first-person blog or diary post (past tenses, Plusquamperfekt, passive) |
| G-L2 | detail and argument in journalism | regional news feature (science, environment, society) |
| G-L3 / t-LV3 / D-L2 | scan for specific information, discard distractors | classified ads, course and job offers, service ads |
| G-L4 | identify a writer's stance (for or against) | reader comments / forum replies with irony and concession |
| G-L5 / D-L4 | understand instructions and rules | Hausordnung, terms, product or info brochure |
| t-LV1 | gist; choose a headline | short news items |
| t-LV2 | detail in a longer text | magazine report of about 400 words |
| t-SB1 / D-L5 | grammar in context (connectors, articles, prepositions, verb forms) | personal and formal letters |
| t-SB2 | collocations and lexis in context | letter or notice with a word bank |
| G-H1 / t-HV3 / D-H1–2 | selective listening for numbers, times, places, actions | voicemail, station and train announcements, radio tips, weather |
| G-H2 | follow a monologue to an audience | guided tour, information talk |
| G-H3 / t-HV2 / D-H3 | detail in natural dialogue | chat at a bus stop, phone call, workplace talk |
| G-H4 / t-HV1 / D-H4 | attribute opinions to speakers | radio debate, listener vox-pops |
| G-Sch1 / t-SA | informal e-mail: describe, give reasons, suggest | reply to a friend (invitation, visit, news) |
| G-Sch2 | argue an opinion in about 80 words | forum or guest-book post |
| G-Sch3 / D-Schreiben | formal short message: apologise, request, complain, enquire | e-mail to a teacher, landlord, office or course provider |
| G-S1 / t-M3 / D-S3 | negotiate a plan: propose, agree, reject, compromise, assign tasks | party, visit, trip, neighbourhood fest |
| G-S2 | structured 3-min presentation | 5-slide talk on a social topic (with home country, pros and cons) |
| G-S3 | give feedback, ask a question, answer questions | peer Q&A after a presentation |
| t-M1 / D-S1 | talk about yourself, ask and answer | biography, family, work, languages |
| t-M2 | report a read opinion, then discuss | two contrasting quotes |
| D-S2 | describe a photo, relate it to experience, compare countries | everyday photo (school, shopping, work, family) |

---

## Implications for the course blueprint

1. **Build one B1 core and three thin exam tracks, not three courses.** Six task families recur across Goethe, telc and DTZ (§6). B1.1/B1.2 Lektionen should rehearse those six. Exam-only formats become short exam modules:
   - Goethe: presentation, forum post, stance-reading.
   - telc: Sprachbausteine, headline matching, opinion-report discussion.
   - DTZ: photo plus home-country comparison with no preparation.
   ÖSD ZB1 needs no track of its own because it is the Goethe exam.
2. **Make "Gemeinsam etwas planen" the speaking spine of every B1 Lektion.** It is scored in all three exams and is the largest single scored speaking task in telc and DTZ. The AI partner must propose, react, disagree, reach a decision and assign "wer macht was". It should grade those moves, which correspond to Interaktion and Aufgabenbewältigung.
3. **Encode the official hard rules in the writing checker, not only in the LLM prompt.** Examples:
   - Goethe: under 50 % of the required words gives the whole task 0 (fewer than 40 words for Sch1/Sch2, fewer than 20 for Sch3).
   - telc: count the Leitpunkte handled; flag mostly Ich/Wir sentence starts, register mixing, unconnected Leitpunkte, and a missing Betreff, Anrede or Schluss.
   - DTZ: 4 Leitpunkte, Anrede and Gruß, formal register.
   Feedback should use each exam's own criteria and point scale, for example telc 5/3/1/0 × 3.
4. **Mock exams must use each exam's real scoring and never one generic "60 %":**
   - Goethe: the ×3.33 table (18/30 raw to pass).
   - telc: point weights per item (5 / 2.5 / 1.5), one written total of 135/225 and oral 45/75.
   - DTZ: H+L 33/45, Schreiben 15/20, Sprechen 75/100, plus the Sprechen gate and the "one of two" rule.
5. **The listening player needs play counts per exam** (Goethe H1 and H4 twice, H2 and H3 once; telc HV1 once, HV2 and HV3 twice; DTZ all once). It also needs the item-reading windows (Goethe 60 s) and transfer time. Practice mode can allow replays; exam mode must not.
6. **Speaking preparation modes differ by exam:** 15 min with notes (Goethe), 20 min (telc), **none** (DTZ). The DTZ track needs cold-start drills. The Goethe and telc tracks need drills in writing Stichpunkte and speaking without reading them out.
7. **Goethe S2 gets a fixed 5-slide template and a coverage check.** Band A needs all five slides covered. S3 (feedback plus one question) should be practised as a pair with the AI.
8. **Split the levels by task difficulty (proposal):**
   - B1.1: receptive formats, self-introduction, planning, the 40-word formal message and the 4-Leitpunkt e-mail.
   - B1.2: opinion writing (G-Sch2), presentation (G-S2), telc M2 discussion, stance-reading and radio debates (G-L4/H4), and **full timed mocks for all three exams**.
9. **Add a typing-first writing mode.** Goethe and telc both run computer-based exams on German keyboards. Input must handle ä/ö/ü/ß, and the exam-mode editor should have no autocorrect.
10. **Add an exam-picker screen before any purchase copy:**
    - in an Integrationskurs → DTZ;
    - in Germany but outside the course system → telc (strongest demand, one sitting) or Goethe;
    - abroad, for a visa → Goethe/telc/ÖSD (certificate at most 1 year old);
    - Einbürgerung via a modular exam → all four modules;
    - Austria → out of scope (ÖIF).
    Show the source and a "Stand" date. Frame it as information, not legal advice.
11. **Put telc and DTZ first, Goethe second.** German search demand is telc ≫ DTZ > Goethe, and ÖSD is negligible (90/month). The Goethe track also serves ÖSD and buyers abroad.
12. **Authored-material length targets** (model-set counts):
    - Goethe: L1 about 300 words, L2 200–300 per article, L5 about 230, H4 transcript about 850.
    - telc: LV2 about 400 words.
    - DTZ: mostly under 150 words, brochures about 250.
    Texts that are much shorter or longer train the wrong reading pace.
13. **Replace the repo's current B1 mocks.** `src/data/mockExams/goetheB1.js` is an abridged mock (Lesen in 25 min with 2 Teile, no Sprechen). It is not the format described here. Each full mock needs:
    - Goethe: 30 + 30 items, 3 writing tasks, 3 speaking tasks;
    - telc: 60 items, 1 e-mail, 3 oral parts;
    - DTZ: 45 items, writing A/B, 3 oral parts.
14. **Copy rules:**
    - The official DTZ outcome (**55.0 % B1 in 2025**, Drucksache 21/5716) can be cited with its source.
    - Never state or imply a pass rate for our learners.
    - Call AI scores "an automated estimate against the published criteria", never "offizielle Bewertung".

## Open questions

1. Do current (2025/26) telc B1 sets still give one writing task with no word guidance, as the 2019/2020 sample does? Some prep sites mention a choice of tasks or 80–150 words.
2. Is the telc part-resit rule ("same or following calendar year") still current? The source is the 2020 printing.
3. Do Einbürgerungsbehörden in practice accept Goethe module certificates from different dates, which PO §14.7.3 allows to be combined? ÖSD requires one year and one centre.
4. Does the Goethe digital platform show a word counter, and does it disable spellcheck? This decides how the typing mode should behave.
5. In Goethe Sprechen Teil 2, the 4-point criterion is labelled "Interaktion" on bfu.goethe.de but reads "Kohärenz" in the 2015 Modellsatz grading sheet. Which label is current?
6. Is ÖSD ZB1 accepted for Austrian citizenship at B1? The osd.at snippet and the Vienna list disagree.
7. How many ads does DTZ Lesen 2 offer per 5 items in current sets? The 2009 handbook says 5:9; the 2024 set was not counted.

## Unverified

- The ZDÖ B1 internal structure and timings (search snippet only).
- DTB B1 structure and access (search snippet only).
- The ÖIF Integrationsprüfung B1 format (WIFI search snippets).
- That Einbürgerung with Goethe/ÖSD requires all four modules. This is secondary sources only (einbuergerungsservice.de, zertifly.com); the statute says only "Sprachprüfung der Stufe B 1".
- Exam fees: vhs Erlangen Goethe B1 €170/€200 (snippet); the repo's "€259/€289" (Goethe) and "€155–239" (telc); DTZ self-pay €130–185 (snippet).
- The repo claim that "Reddit failures cluster in Hören/Lesen/Sprachbausteine" was not re-checked.
- The model-set word counts are my own extraction counts (±10 %). They are not official specifications.

## Sources

- Goethe: [DFB B1 2025](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf) · [Prüfungsordnung 2025](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsordnung.pdf) · [Modellsatz Erwachsene](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) · [Übungssatz Erwachsene](https://www.goethe.de/pro/relaunch/prf/materialien/B1/B1_Uebungssatz_Erwachsene.pdf) · [bfu Lesen](https://bfu.goethe.de/b1_mod/lesen.php) / [Schreiben](https://bfu.goethe.de/b1_mod/schreiben.php) / [Sprechen](https://bfu.goethe.de/b1_mod/sprechen.php) · [Hueber Prüfungsziele sample](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190318681_Muster.pdf)
- telc: [Übungstest 1 B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) · [telc.net B1](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/)
- DTZ: [BAMF DTZ handbook](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/Modellsaetze/dtz-handbuch_pdf.pdf?__blob=publicationFile&v=8) · [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) · [gast.de DTZ](https://www.gast.de/de/forschung-entwicklung/entwicklung/auftraege/deutsch-test-fuer-zuwanderer-dtz) · [BAMF Abschlussprüfung](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html) · [Drucksache 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf)
- Law and segments: [§10 StAG](https://www.gesetze-im-internet.de/stag/__10.html) · [§2](https://www.gesetze-im-internet.de/aufenthg_2004/__2.html), [§9](https://www.gesetze-im-internet.de/aufenthg_2004/__9.html), [§18c AufenthG](https://www.gesetze-im-internet.de/aufenthg_2004/__18c.html) · [BAMF Einbürgerung](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html) · [asyl.net 30.10.2025](https://www.asyl.net/view/aenderungen-des-staatsangehoerigkeitsgesetzes-am-30102025-in-kraft-getreten) · [AA Bischkek Ausbildung visa](https://bischkek.diplo.de/kg-de/2499836-2499836)
- ÖSD and Austria: [ÖSD ZB1](https://osd.at/en/portfolio-item/osd-zertifikat-b1-zb1/) · [ÖSD ZDÖ B1](https://osd.at/en/portfolio-item/osd-zertifikat-deutsch-osterreich-b1-zdo-b1/) · [wien.gv.at Staatsbürgerschaft](https://www.wien.gv.at/zusammenleben/staatsbuergerschaft-deutschkenntnisse)
- Demand: DataForSEO Google Ads search volume, DE/de, queried 2026-09-26.
