# 05 — Can-do inventory B1 and B2, split into B1.1 · B1.2 · B2.1 · B2.2

**Date:** 2026-09-26 · **Wave:** course-v2 W1 research · **Scope:** communicative situations with German Kann-Beschreibungen (ich-Form) for 12–16 units per half-level, each line with its source. Repo docs were treated as claims to check. The live A1.1 course and `course-standard-2026-09-12.md` were not used.

---

## 1. Method

**Primary documents downloaded and text-extracted (pypdf).** Tables were rebuilt from glyph coordinates where the columns had merged.

| Code | Document | Used for |
|---|---|---|
| **SB** | Begleitband zum GER (Klett/Goethe-Institut 2020), Anhang 2 *Raster zur Selbstbeurteilung, erweitert durch Online-Interaktion und Mediation*: [PDF](https://www.klett-sprachen.de/downloads/24545/anhang-2-raster-zur-selbstbeurteilung/pdf) | official German **ich-Form** descriptors for B1 and B2, including online interaction and mediation |
| **ZM** | Begleitband, Anhang 1 *Zentrale Merkmale der GeR-Niveaus*: [PDF](https://www.klett-sprachen.de/downloads/24544/anhang-1-zentrale-merkmale-der-ger-niveaus/pdf) | the official German wording of what separates B1, B1+, B2 and B2+ |
| **E8** | Begleitband, Anhang 8 *Ergänzende Deskriptoren*: [PDF](https://www.klett-sprachen.de/downloads/24551/anhang-8-ergaenzende-deskriptoren/pdf) | calibrated supplementary descriptors (online, mediation) |
| **BB46** | Begleitband p. 46, Klett extract: [PDF](https://www.derdiedaf.com/_files_media/downloads/9783126769990_Begleitband_GER_Auszug_Kompetenzprofile.pdf) (image PDF, read visually) | plus-level and half-level notation |
| **GER S.xx** | GER-2001 German scales as reprinted in the *telc Deutsch B2 Handbuch* (2019): [PDF](https://www.telc.net/fileadmin/user_upload/pdfs/Handbuch_und_Tipps_fuer_Pruefungsvorbereitung/Deutsch_B2_Handbuch.pdf) | German B2 scale wording |
| **RC nn** | BAMF *Rahmencurriculum für Integrationskurse* (revised 2016), page nn: [PDF](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/KonzepteLeitfaeden/rahmencurriculum-integrationskurs.pdf?__blob=publicationFile) | all B1 Lernziele by Handlungsfeld (A1–B1 curriculum) |
| **BSK x.y** | telc/BAMF *Berufsbezogene Deutschsprachförderung – Lernziele A2–C1* (2019), Feinlernziel x.y: [PDF](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/lernzielkatalog-spezial-und-basisberufssprachkurse.pdf?__blob=publicationFile&v=7) | DeuFöV Handlungsfelder, with a B1 and a B2 descriptor for every Feinlernziel |
| **KK-B2** | BAMF *Konzept für einen Basiskurs B2* (März 2021): [PDF](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/kurskonzept-b2.pdf?__blob=publicationFile&v=13) | B2 end goals, 400 UE |
| **ÖIF-B1/B2** | ÖIF *Rahmencurriculum … B1-Niveau* / *B2-Niveau*, Fassung 01.08.2025: [B1](https://www.integrationsfonds.at/fileadmin/user_upload/B1_Rahmencurriculum_OEIF.pdf), [B2](https://www.integrationsfonds.at/fileadmin/user_upload/B2_Rahmencurriculum_OEIF.pdf) | can-dos that the ÖIF says are drawn from *Profile deutsch* |
| **PZ-B2** | Goethe-Zertifikat B2 *Prüfungsziele, Testbeschreibung* (2007, pre-modular format): [PDF](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_B2.pdf) | B2 goals, the 14 themes, hours |
| **GI-B1 / GI-B2 Teil** | current Goethe/ÖSD B1 and modular Goethe B2 Teile, from sibling memos [02](02-exams-b1.md) and [03](03-exams-b2.md), [B1 Modellsatz](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf), [bfu B2](https://bfu.goethe.de/b2_mod/sprechen.php) | exam-task can-dos (our wording) |

**Searches (WebSearch):** Goethe B1/B2 Prüfungsziele; Begleitband German; DeuFöV Lernziele; Rahmencurriculum 2017; ÖIF curricula; Profile deutsch excerpts; the Netzwerk neu and Menschen splits; Goethe course sub-levels.

**What failed:**
- `rm.coe.int` (the English CV 2020) sits behind a Cloudflare challenge (403), so the German Begleitband appendices were used instead.
- goethe.de HTML pages return 403 (PDFs load).
- The full Goethe B1 (Hueber 2013) and modular B2 (Hueber 2018) *Prüfungsziele* books exist only as 3-page and 1-page samples ([B1](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190318681_Muster.pdf), [B2](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190618682_Muster.pdf)).
- *Profile deutsch* is a book plus CD-ROM with no open online version ([Goethe](https://www.goethe.de/de/spr/sbp/prd.html)).
- Firecrawl and DataForSEO were not used.

**Conversion rule:** "Kann …" becomes "Ich kann …", with pronouns adapted. **≈** marks a condensed or task-derived wording, which is ours.

---

## 2. Findings

### 2.1 "B1.1" means two different things. Pick one on purpose.

- **CEFR notation.** The Begleitband distinguishes *Kriterien-Niveaus* „(z. B. A2 bzw. A2.1)" from *Plus-Niveaus* „(z. B. A2+ bzw. A2.2)". The plus level „bildet eine sehr starke Kompetenz auf diesem Niveau ab, das aber noch nicht die Mindestkompetenz auf dem folgenden Kriteriumsniveau erreicht" ([BB46](https://www.derdiedaf.com/_files_media/downloads/9783126769990_Begleitband_GER_Auszug_Kompetenzprofile.pdf)). On this reading, B1.1 is already the B1 criterion level and B1.2 is B1+.
- **Market convention.** Publishers split the road *to* B1 in two: *Netzwerk neu* B1.1 = Kapitel 1–6 and B1.2 = Kapitel 7–12 ([Klett](https://www.klett-sprachen.de/downloads/26854/Netzwerk_5Fneu_5FB1_5F_2D_5FL_F6sungen_5F_2D_5F_DCbungsbuch_5FKapitel_5F7_2D12/pdf)). *Menschen* is BAMF-approved for Integrationskurse „A1.1 bis B1.2" ([search result, Hueber](https://www.hueber.de/reihe/menschen)). The exam comes after the .2 volume.
- A buyer of "B1.2" expects the market meaning. The content ordering can still use the CEFR bands (§2.2).

### 2.2 What actually changes between B1 → B1+ → B2 → B2+ (official German, [ZM](https://www.klett-sprachen.de/downloads/24544/anhang-1-zentrale-merkmale-der-ger-niveaus/pdf))

| Band | Defining features, quoted |
|---|---|
| **B1** | (1) „Interaktion aufrechtzuerhalten", e.g. „in einer Diskussion mit Freunden persönliche Standpunkte und Meinungen äußern und erfragen". (2) „sprachliche Probleme des Alltagslebens flexibel zu bewältigen", e.g. „auch mit weniger routinemäßigen Situationen in öffentlichen Verkehrsmitteln umgehen … sich beschweren". |
| **B1+** | The same features plus the „Umfang der Information", e.g. „eine Nachricht notieren …; beim Arzt Symptome beschreiben … mit begrenzter Genauigkeit; erklären, warum etwas ein Problem ist; … einen Artikel … zusammenfassen, dazu Stellung nehmen; … beschreiben, wie man etwas macht, und genaue Anweisungen geben". |
| **B2 (lower end)** | „erfolgreiches Argumentieren": „Vor- und Nachteile verschiedener Alternativen angeben; die eigene Argumentation logisch aufbauen …; ein Problem erläutern … Zugeständnisse machen müssen; Vermutungen anstellen über Ursachen und Folgen". |
| **B2 (whole level)** | Two new emphases. Discourse: „ein Gespräch beginnen, die Sprecherrolle übernehmen … Versatzstücke … verwenden". Language awareness: „sich seine / ihre Hauptfehler merken und sich beim Sprechen bewusst … kontrollieren". „Insgesamt scheint dies eine neue Schwelle zu sein." |
| **B2+** | Discourse management and cohesion („sich auf Aussagen und Schlussfolgerungen anderer Sprechender beziehen, daran anknüpfen"), and negotiating („einen Schadensersatzfall darlegen … die Grenzen für Zugeständnisse abstecken"). |

### 2.3 The DeuFöV catalogue gives a ready-made B1-vs-B2 quality ladder

The BSK Lernzielkatalog covers 11 Handlungsfelder: 7 job-related (I Arbeitssuche und Bewerbung … VII Wechsel/Beendigung) and 4 cross-cutting (A soziale Kontakte, B Dissens, C Gefühle/Meinungen, D Informationsaustausch). It has 60 Groblernziele ([BSK p. 240–242](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/lernzielkatalog-spezial-und-basisberufssprachkurse.pdf?__blob=publicationFile&v=7)). By my parse there are **339 Feinlernziele**: 327 have a B1 descriptor of their own and 299 a B2 one. The other cells say „wie A2" or „kein Deskriptor".

The two levels are worded with fixed qualifiers:

- **B1:** „mit einiger Sicherheit … in einfachen zusammenhängenden Äußerungen … grundlegende … muss aber möglicherweise um Wiederholung bitten … auch wenn dabei evtl. Formulierungsprobleme vorkommen, ist sie_er meist ohne Schwierigkeiten zu verstehen" (e.g. BSK 1.1, 18.1, 52.1).
- **B2:** „relativ spontan und fließend … dabei Begründungen geben und Zusammenhänge herstellen … der Grad an Formalität ist den Umständen angemessen … es kommen keine Fehler vor, die zu Missverständnissen führen können" (same items).

The DeuFöV target groups differ. A2/B1 learners often have little schooling and „erste Fossilisierungen". B2/C1 learners often have ten or more years of schooling (BSK Präambel p. 5).

### 2.4 In the Integrationskurs curriculum, B1 is work, training and the less routine

The Rahmencurriculum's own statistics give the **B1 share per Handlungsfeld** ([RC Anhang 2, p. 166 ff.](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/KonzepteLeitfaeden/rahmencurriculum-integrationskurs.pdf?__blob=publicationFile)):

| Handlungsfeld | B1 share |
|---|---|
| Aus-/Weiterbildung | 50.0 % |
| Arbeitssuche | 38.9 % |
| Arbeit | 31.9 % |
| Einkaufen | 21.7 % |
| Banken/Versicherungen | 19.2 % |
| Gesundheit | 19.0 % |
| Wohnen | 15.8 % |
| Medien | 15.0 % |
| Ämter | 14.3 % |
| Kinder | 14.0 % |
| Mobilität | 9.4 % |
| Unterricht | 3.7 % |
| **All 12 fields** | **22.9 %** |

My parse found **133 B1 Lernziele** in the whole document. Twenty of them sit in the cross-cutting „Umgang mit der Migrationssituation", which covers intercultural topics, values and participation (RC pp. 29–38).

### 2.5 B2 anchors

- **B2 end goals.** „Artikel und Berichte über Probleme der Gegenwart lesen …, in denen die Schreibenden eine bestimmte Haltung … vertreten". „… Argumente und Gegenargumente für oder gegen einen bestimmten Standpunkt darlegen" ([KK-B2 p. 7](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/kurskonzept-b2.pdf?__blob=publicationFile&v=13)).
- **Goethe B2 aims.**
  - Production: „beschreiben … Meinungen äußern … Stellung nehmen … Beispiele geben … Möglichkeiten ausdrücken … vergleichen".
  - Interaction: „… zustimmen und ablehnen … Vorschläge machen … Ziele/Zwecke verbalisieren".
  - 14 themes: Persönliches, Wohnen/Umwelt, Alltag/Arbeit, Freizeit, Reise, Beziehungen/Kultur, Gesundheit, Bildung, Konsum, Ernährung, Dienstleistungen, Orte, Sprache/Kommunikation, Klima ([PZ-B2 pp. 17–19](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_B2.pdf)).
- **ÖIF-B2.** Puts a stated focus on „Arbeit und Beruf" and adds explicit *Sprachmittlung*: „Informationen aus komplexen Texten … zusammenfassen und weitergeben … Zielgruppe, Medium und kommunikativen Zweck" ([ÖIF-B2 §3.1](https://www.integrationsfonds.at/fileadmin/user_upload/B2_Rahmencurriculum_OEIF.pdf)).

### 2.6 Hours (for scale only)

| Programme | Hours | Source |
|---|---|---|
| Goethe B1 intensive | „circa 500 UE" | [Hueber B1 sample](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190318681_Muster.pdf) |
| Goethe B2 intensive | „600 bis 700 UE" | [PZ-B2 p. 8](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_B2.pdf) |
| DeuFöV B2 basic course | „400 UE" from B1, or 500 with the Brückenelement | [KK-B2](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/kurskonzept-b2.pdf?__blob=publicationFile&v=13) |

The sources measure different things and do not reconcile.

---

## 3. Inventory: 14 situations per half-level

Band targets:

| Half-level | Band target | Focus |
|---|---|---|
| **B1.1** | A2+ → B1 | ZM features 1–2 in private and public life |
| **B1.2** | B1 → B1+ | work and authorities, plus the B1 exam |
| **B2.1** | B1+ → B2 lower end | argumentation and detailed comprehension |
| **B2.2** | B2 → B2+ | discourse, mediation and negotiation, plus the B2 exam |

Each row gives two anchor can-dos. The source pools (RC, BSK, SB) hold 3–5 per unit for W2.

### B1.1 — „Im Alltag mitreden" (A2+ → B1)

| # | Situation | Kann-Beschreibungen [Quelle] |
|---|---|---|
| 1 | Neuigkeiten austauschen | Ich kann in einem Brief oder einer E-Mail Neuigkeiten mitteilen, nach Neuigkeiten fragen und von Ereignissen berichten und danach fragen. [RC 56]<br>≈ Ich kann in einer persönlichen E-Mail (ca. 80 Wörter) etwas beschreiben, einen Grund nennen und einen Vorschlag machen. [GI-B1 Schreiben T1] |
| 2 | Erlebnisse, Träume, Ziele | Ich kann in einfachen zusammenhängenden Sätzen sprechen, um Erfahrungen und Ereignisse oder meine Träume, Hoffnungen und Ziele zu beschreiben. [SB B1]<br>Ich kann eine mir bekannte Familiengeschichte erzählen. [ÖIF-B1 §3.1] |
| 3 | Gemeinsam etwas planen | ≈ Ich kann mit einer Partnerin / einem Partner etwas planen, Vorschläge machen, darauf reagieren und mich einigen. [GI-B1 Sprechen T1]<br>Ich kann in einer Diskussion mit Freunden persönliche Standpunkte und Meinungen äußern und erfragen. [ZM B1] |
| 4 | Film, Buch, Veranstaltung | Ich kann eine Geschichte erzählen oder die Handlung eines Buches oder Films wiedergeben und meine Reaktionen beschreiben. [SB B1]<br>Ich kann nach einem Kinobesuch meine Meinung über den Film äußern. [ÖIF-B1 §3.1] |
| 5 | Medien und Nachrichten | Ich kann vielen Radio- oder Fernsehsendungen über aktuelle Ereignisse … die Hauptinformation entnehmen, wenn relativ langsam und deutlich gesprochen wird. [SB B1]<br>Ich kann mich mit Bekannten oder Freunden über Medienerfahrungen austauschen, z. B. häufig besuchte Internetseiten. [RC 138] |
| 6 | Arzt und Apotheke | Ich kann beim Arzt mit einfachen Worten erklären, was mir fehlt. [ÖIF-B1 §3.1]<br>Ich kann den Beipackzetteln von Medikamenten Informationen über die Einnahmezeiten entnehmen. [ÖIF-B1 §3.1] |
| 7 | Unterwegs, wenn etwas schiefgeht | Ich kann auch mit weniger routinemäßigen Situationen in öffentlichen Verkehrsmitteln umgehen. [ZM B1]<br>≈ Ich kann an Informationsschaltern nach Verbindungen fragen und auf entsprechende Fragen reagieren. [RC 142] |
| 8 | Reklamieren im Geschäft | ≈ Ich kann mich mit einfachen Worten beschweren, z. B. über fehlerhafte Ware, und Umtausch oder Geldrückzahlung verlangen. [RC 125]<br>Ich kann bei Bestellungen die wichtigsten Punkte der Allgemeinen Geschäftsbedingungen verstehen. [RC 125] |
| 9 | Wohnung und Nachbarschaft | Ich kann im Gespräch mit Vermietern Detailinformationen zur angebotenen Wohnung erfragen, z. B. zu Einzugstermin, Größe, Nebenkosten. [RC 155]<br>Ich kann mich mit einfachen Worten schriftlich beim Vermieter oder Hausmeister beschweren, z. B. wegen einer ausstehenden Reparatur der Heizung. [RC 156] |
| 10 | Gefühle zeigen | Ich kann im Trauerfall mein Beileid ausdrücken. [RC 40]<br>Ich kann mit einfachen Worten meine Enttäuschung ausdrücken, z. B. über das Nichtzustandekommen eines Mietvertrags. [RC 40] |
| 11 | Deutsch lernen, Ziele setzen | Ich kann die Ziele beschreiben, die ich mir für einen Sprachkurs gesetzt habe. [ÖIF-B1 §3.1]<br>Ich kann meine Gefühle im Hinblick auf das Lernen der deutschen Sprache äußern, z. B. Unsicherheit, Freude über Erfolg. [RC 36] |
| 12 | Absprachen mit Kollegen | ≈ Ich kann mit Kolleginnen/Kollegen Absprachen treffen, z. B. über Tausch einer Schicht, Urlaubszeiten. [RC 85]<br>Ich kann bei einer Krankmeldung mitteilen, welche Arbeiten ich nicht erledigen kann, und erklären, was zu tun ist. [RC 84] |
| 13 | Termine, Telefon, Mailbox | ≈ Ich kann einen Termin mündlich und in einer kurzen schriftlichen Nachricht mit den üblichen Wendungen verschieben. [BSK 59.6 B1]<br>≈ Ich kann in einer kurzen formellen Nachricht (ca. 40 Wörter) mich entschuldigen, einen Grund nennen und um etwas bitten. [GI-B1 Schreiben T3] |
| 14 | Online Erlebnisse teilen | Ich kann mich über Erfahrungen, Ereignisse, Eindrücke und Gefühle austauschen, sofern ich mich darauf vorbereiten kann. [SB B1, Online-Interaktion]<br>≈ Ich kann eine einfache Online-Konversation über vertraute Themen beginnen, aufrechterhalten und abschließen, obzwar mit einigen Pausen. [E8 B1] |

### B1.2 — „Selbstständig handeln und Stellung nehmen" (B1 → B1+, exam-ready)

| # | Situation | Kann-Beschreibungen [Quelle] |
|---|---|---|
| 1 | Meinung im Forum | ≈ Ich kann in einem Forumsbeitrag (ca. 80 Wörter) meine Meinung zu einem Alltagsthema äußern und begründen. [GI-B1 Schreiben T2]<br>Ich kann kurz meine Meinungen und Pläne erklären und begründen. [SB B1] |
| 2 | Ein Thema präsentieren | ≈ Ich kann ein Thema in ca. 3 Minuten präsentieren: eigene Erfahrung, Situation im Heimatland, Vor- und Nachteile, meine Meinung; danach Rückfragen beantworten. [GI-B1 Sprechen T2/T3]<br>Ich kann unkomplizierte Informationen mithilfe eines grafischen „Organisers" klar darstellen (z. B. eine Folie mit Vorteilen/Nachteilen). [E8 B1] |
| 3 | Artikel zusammenfassen | ≈ Ich kann einen Artikel, ein Interview oder eine Dokumentarsendung zusammenfassen, dazu Stellung nehmen und Informationsfragen dazu beantworten. [ZM B1+]<br>Ich kann die Hauptpunkte schriftlich zusammenfassen, die in direkten Informationstexten über ein Thema von persönlichem oder aktuellem Interesse vorgebracht werden. [E8 B1] |
| 4 | Symptome genau beschreiben | ≈ Ich kann beim Arzt Symptome beschreiben, wenn auch mit begrenzter Genauigkeit. [ZM B1+]<br>Ich kann über das Thema Gesundheit sprechen, dabei auch über Gefühle und Ängste reden. [RC 132] |
| 5 | Probleme erklären, Lösung fordern | Ich kann erklären, warum etwas ein Problem ist. [ZM B1+]<br>≈ Ich kann bei der zuständigen Person reklamieren und sagen, wie das Problem gelöst werden soll. [BSK 28.4/28.5 B1] |
| 6 | Behörde: Einspruch, Anzeige | Ich kann mit einfachen, standardisierten Formulierungen bei ungerechtfertigten Forderungen schriftlich Einspruch erheben, z. B. bei Zahlungsaufforderungen. [RC 78]<br>Ich kann bei der Polizei einen Diebstahl melden. [ÖIF-B1 §3.1] |
| 7 | Versicherung, Schadensfall | Ich kann der Versicherung in einem einfachen Schreiben Schadensfälle mitteilen, z. B. Wasserschaden, Einbruch, Unfall. [RC 111]<br>≈ Ich kann im Gespräch mit Versicherungsmitarbeitern wichtige Informationen verstehen, z. B. Leistungen, Kosten. [RC 112] |
| 8 | Anleitungen und Regeln | Ich kann beschreiben, wie man etwas macht, und genaue Anweisungen geben. [ZM B1+]<br>≈ Ich kann Regeln wie eine Hausordnung im Detail verstehen. [GI-B1 Lesen T5] |
| 9 | Stellensuche, Anschreiben | ≈ Ich kann telefonisch wichtige Informationen zur ausgeschriebenen Stelle erfragen, z. B. Arbeitszeiten, Antrittstermin, Befristung. [RC 98]<br>Ich kann mithilfe einer Vorlage ein einfaches Bewerbungsschreiben verfassen und darin wichtige Auskünfte über mich geben. [RC 99] |
| 10 | Vorstellungsgespräch | Ich kann im Vorstellungsgespräch über grundlegende berufliche Erfahrungen und Qualifikationen berichten und dabei auch auf Rollen und Funktionen eingehen. [RC 100]<br>Ich kann im Vorstellungsgespräch meine Vorstellungen zur Bezahlung äußern, begründen und ggf. einen Kompromiss formulieren. [RC 100] |
| 11 | Besprechung, Notizen | Ich kann bei einer Besprechung angemessen meinen Standpunkt einbringen. [RC 86]<br>Ich kann eine Nachricht notieren, wenn jemand nach Informationen fragt oder ein Problem erläutert. [ZM B1+] |
| 12 | Konflikt klären | ≈ Ich kann nach einem Konflikt, z. B. mit den Nachbarn, unterschiedliche Standpunkte vergleichen und einen Kompromiss vorschlagen. [RC 50]<br>Ich kann um Entschuldigung bitten und erklären, warum ich mich in einer bestimmten Weise verhalten habe. [RC 58] |
| 13 | Zusammenleben, Werte | Ich kann mich über interkulturelle Erfahrungen austauschen und erklären, warum ich bestimmte Verhaltensweisen als fremd empfunden habe. [RC 32]<br>≈ Ich kann über Unterschiede sprechen und meine eigene Position darstellen und begründen, z. B. zur Gleichberechtigung von Frau und Mann. [RC 30] |
| 14 | Zuhören und weitergeben | ≈ Ich kann bei einer Führung die wichtigsten Informationen verstehen und in einer Radiodiskussion erkennen, wer was meint. [GI-B1 Hören T2/T4]<br>Ich kann Informationen aus klaren, gut strukturierten Informationstexten über vertraute Themen … (mündlich) weitergeben. [SB B1, Mediation] |

### B2.1 — „Argumentieren und im Detail verstehen" (B1+ → B2)

| # | Situation | Kann-Beschreibungen [Quelle] |
|---|---|---|
| 1 | Standpunkt erläutern | Ich kann einen Standpunkt zu einer aktuellen Frage erläutern und Vor- und Nachteile verschiedener Möglichkeiten angeben. [SB B2]<br>Ich kann meine Argumentation logisch aufbauen und verbinden. [ZM B2] |
| 2 | Stellungnahme schreiben | ≈ Ich kann einen Forumsbeitrag (ca. 150 Wörter) mit Einleitung und Schluss schreiben, der vier Punkte genau bearbeitet. [GI-B2 Schreiben T1]<br>Ich kann in einem Aufsatz oder Bericht … Argumente und Gegenargumente für oder gegen einen bestimmten Standpunkt darlegen. [SB B2] |
| 3 | Presse mit Haltung | Ich kann Artikel und Berichte über Probleme der Gegenwart lesen und verstehen, in denen die Schreibenden eine bestimmte Haltung … vertreten. [SB B2]<br>≈ Ich kann in Forumsbeiträgen und Leserbriefen erkennen, welche Einstellung die Schreibenden haben. [GI-B2 Lesen T1/T4] |
| 4 | Beschwerde mit Anspruch | ≈ Ich kann ein Problem erläutern, das aufgetreten ist, und klarmachen, dass der Anbieter der Dienstleistung Zugeständnisse machen muss. [ZM B2]<br>≈ Ich kann bei der zuständigen Person reklamieren und dabei Begründungen geben und Zusammenhänge herstellen. [BSK 28.4 B2] |
| 5 | Ursachen, Folgen, Hypothesen | ≈ Ich kann Vermutungen über Ursachen und Folgen anstellen und über hypothetische Situationen sprechen. [ZM B2]<br>≈ Ich kann zu Themen wie Klima oder Konsum Beispiele geben, vergleichen und Möglichkeiten ausdrücken. [PZ-B2 4.2.2, 4.3] |
| 6 | Informell diskutieren | Ich kann mich in vertrauten Situationen aktiv an informellen Diskussionen beteiligen, indem ich Stellung nehme, … verschiedene Vorschläge beurteile, Hypothesen aufstelle oder auf Hypothesen reagiere. [GER S. 81 B2]<br>Ich kann in Diskussionen meine Ansichten durch relevante Erklärungen, Argumente und Kommentare begründen und verteidigen. [GER S. 81 B2] |
| 7 | Radio, Podcast, Interview | Ich kann Aufnahmen in Standardsprache verstehen … und erfasse dabei nicht nur den Informationsgehalt, sondern auch Standpunkte und Einstellungen der Sprechenden. [GER S. 73 B2]<br>≈ Ich kann Alltagsgespräche, die nur einmal zu hören sind, im Wesentlichen verstehen. [GI-B2 Hören T1] |
| 8 | Qualifiziert bewerben | ≈ Ich kann ein klares, gut strukturiertes Bewerbungsschreiben verfassen. [BSK 5.2 B2]<br>≈ Ich kann klar und detailliert über meine beruflichen Erfahrungen und Qualifikationen berichten und dabei Begründungen geben. [BSK 6.4 B2] |
| 9 | Anerkennung, Weiterbildung | ≈ Ich kann komplexere Informationen zur Anerkennung ausländischer Abschlüsse verstehen, Nachfragen stellen und Begründungen erbitten. [BSK 2.5 B2]<br>≈ Ich kann meine Weiterbildungswünsche relativ spontan äußern und begründen. [BSK 41.3 B2] |
| 10 | Nachricht an Vorgesetzte | ≈ Ich kann einer Vorgesetzten / einem Vorgesetzten schreiben (ca. 100 Wörter): um Verständnis bitten, meine Lage beschreiben, einen Vorschlag machen. [GI-B2 Schreiben T2]<br>≈ Ich kann Rückmeldungen zu meiner Arbeit verstehen, auch wenn komplexere Zusammenhänge dargestellt werden, und angemessen reagieren. [BSK 20.2 B2] |
| 11 | Vertrag, Lohnabrechnung | Ich kann einer Lohn-/Gehaltsabrechnung Detailinformationen entnehmen. [BSK 38.1 B1/B2]<br>≈ Ich kann relativ spontan und fließend Nachfragen zu einem Arbeitsvertrag stellen. [BSK 36.2 B2] |
| 12 | Persönliche Briefe | Ich kann in Briefen verschieden starke Gefühle zum Ausdruck bringen und die persönliche Bedeutung von Ereignissen und Erfahrungen hervorheben … [GER S. 86 B2]<br>Ich kann Korrespondenz lesen, die sich auf mein Interessengebiet bezieht, und leicht die wesentliche Aussage erfassen. [GER S. 75 B2] |
| 13 | Eigene Fehler kontrollieren | Ich kann mir meine Hauptfehler merken und mich beim Sprechen bewusst in Bezug auf diese Fehler kontrollieren. [ZM B2]<br>Ich kann etwas paraphrasieren und umschreiben, um Wortschatz- oder Grammatiklücken zu überbrücken. [GER S. 70 B2] |
| 14 | Online zusammenarbeiten | Ich kann mit mehreren Personen interagieren, meine Beiträge mit ihren verbinden sowie mit Missverständnissen und Meinungsverschiedenheiten umgehen, sofern die anderen komplexe Sprache vermeiden … [SB B2, Online-Interaktion]<br>Ich kann die Bedeutung von Tatsachen, Ereignissen und Erfahrungen hervorheben, Ideen rechtfertigen und die Zusammenarbeit unterstützen. [SB B2, Online-Interaktion] |

### B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln" (B2 → B2+, exam-ready)

| # | Situation | Kann-Beschreibungen [Quelle] |
|---|---|---|
| 1 | Vortrag halten | ≈ Ich kann einen Vortrag von ca. 4 Minuten mit Einleitung, Hauptteil und Schluss halten und Fragen dazu beantworten. [GI-B2 Sprechen T1]<br>Ich kann Sachverhalte klar und systematisch beschreiben und darstellen und dabei wichtige Punkte und relevante stützende Details angemessen hervorheben. [GER S. 64 B2] |
| 2 | Pro und Contra | ≈ Ich kann Argumente austauschen, auf Gegenargumente reagieren und am Ende sagen, ob ich dafür oder dagegen bin. [GI-B2 Sprechen T2]<br>Ich kann mich auf Aussagen und Schlussfolgerungen anderer Sprechender beziehen, daran anknüpfen und so zur Entwicklung des Gesprächs beitragen. [ZM B2+] |
| 3 | Gespräche lenken | ≈ Ich kann ein Gespräch beginnen, die Sprecherrolle übernehmen, wenn es angemessen ist, und das Gespräch beenden, wenn ich möchte. [ZM B2]<br>Ich kann Versatzstücke (wie „Das ist eine schwierige Frage") verwenden, um Zeit zum Formulieren zu gewinnen und das Rederecht zu behalten. [ZM B2] |
| 4 | Verhandeln, Schadensersatz | ≈ Ich kann einen Schadensersatzfall darlegen, jemanden überzeugen, eine Wiedergutmachung zu leisten, und dabei klar die Grenzen für Zugeständnisse abstecken. [ZM B2+]<br>≈ Ich kann verhandeln und dabei entscheidende Punkte hervorheben und stützende Einzelheiten anführen. [BSK 57.9 B2] |
| 5 | Kritik üben und annehmen | ≈ Ich kann sagen, was meiner Meinung nach ein Problem ist und anders gemacht werden sollte, und das begründen. [BSK 52.1 B2]<br>≈ Ich kann auf Kritik an meinem Standpunkt reagieren und die Reaktion begründen. [BSK 54.5 B2] |
| 6 | Mitarbeitergespräch | ≈ Ich kann mich zu meinen beruflichen Zielen und Wünschen äußern, z. B. zu Fortbildungen, und Begründungen geben. [BSK 20.4 B2]<br>≈ Ich kann in einem Konfliktgespräch die Positionen erkennen und Verständnis für beide Seiten ausdrücken und begründen. [BSK 54.2 B2] |
| 7 | Beruflich präsentieren | ≈ Ich kann eine längere, gut strukturierte Präsentation halten, auch zu komplexeren Themen. [BSK 43.7 B2]<br>≈ Ich kann in einem Kundengespräch Vor- und Nachteile erläutern und meine Vorgehensweise begründen. [KK-B2, Groblernziel 35] |
| 8 | Vorträge verstehen | Ich kann längere Redebeiträge und Vorträge verstehen und auch komplexer Argumentation folgen, wenn mir das Thema einigermaßen vertraut ist. [SB B2]<br>≈ Ich kann einem kurzen Vortrag gezielt Informationen entnehmen. [GI-B2 Hören T4] |
| 9 | Texte für andere zusammenfassen | Ich kann detaillierte Informationen und Argumente zuverlässig (mündlich) weitergeben, z. B. die wichtigsten Punkte aus komplexen, aber gut strukturierten Texten … [SB B2, Mediation]<br>Ich kann am Ende einer Diskussion die Schlüsselaspekte zusammenfügen. [E8 B2] |
| 10 | Gruppe moderieren | Ich kann zur Beteiligung ermutigen und Fragen stellen, die zu Reaktionen aus der Perspektive anderer Gruppenmitglieder einladen … [SB B2, Mediation]<br>≈ Ich kann eine gemeinsame Gesprächskultur fördern, indem ich Wertschätzung für verschiedene Ideen und Standpunkte ausdrücke und andere bitte, darauf zu reagieren. [SB B2, Mediation von Kommunikation] |
| 11 | Bescheid, Widerspruch, Regeln | ≈ Ich kann einen Widerspruch klar und gut strukturiert formulieren und begründen. [BSK 39.3 B2]<br>≈ Ich kann eine Ordnung (z. B. Studienordnung) abschnittsweise verstehen. [GI-B2 Lesen T5] |
| 12 | Formell schreiben, Register | ≈ Ich kann ein Kündigungsschreiben in klaren, zusammenhängenden Sätzen mit angemessener Formalität verfassen. [BSK 45.1 B2]<br>Ich kann zusammenhängend und klar verständlich schreiben und dabei die üblichen Konventionen der Gestaltung und der Gliederung in Absätze einhalten. [GER S. 118 B2] |
| 13 | Fernsehen, Reportage | Ich kann im Fernsehen die meisten Nachrichtensendungen und aktuellen Reportagen verstehen. [SB B2]<br>Ich kann im Radio die meisten Dokumentarsendungen … verstehen und die Stimmung, den Ton usw. der Sprechenden richtig erfassen. [GER S. 73 B2] |
| 14 | Lebhafte Diskussion | Ich kann mich so spontan und fließend verständigen, dass ein normales Gespräch mit kompetenten Sprechenden ohne Belastung für eine der beiden Seiten möglich ist. [ZM B2]<br>Ich kann bei einer lebhaften Diskussion unter Muttersprachlern mithalten. [GER S. 81 B2, upper row = B2+ *(row split unverified)*] |

### Spiral threads visible across the four tables (each step is a documented band step)

| Thread | B1.1 | B1.2 | B2.1 | B2.2 |
|---|---|---|---|---|
| Beschwerde | sich beschweren (RC 125) | erklären, warum etwas ein Problem ist (ZM B1+) | Zugeständnisse einfordern (ZM B2) | Schadensersatz, Grenzen abstecken (ZM B2+) |
| Meinung | Meinungen äußern/erfragen (ZM B1) | zusammenfassen + Stellung nehmen (ZM B1+) | Argumentation logisch aufbauen (ZM B2) | an andere anknüpfen (ZM B2+) |
| Konsultation | mit einfachen Worten sagen, was fehlt (ÖIF-B1) | Symptome beschreiben (ZM B1+) | Anerkennung/Beratung mit Nachfragen (BSK 2.5 B2) | Mitarbeitergespräch (BSK 20.4 B2) |
| Weitergeben | Online-Austausch (SB B1) | Infotexte weitergeben (SB B1 Mediation) | umschreiben, Fehler kontrollieren (ZM/GER B2) | Argumente zuverlässig weitergeben, moderieren (SB B2 Mediation) |

---

## 4. Implications for the course blueprint

1. **Choose one meaning of the .1/.2 names and say it on the product page.**
   - Recommended: the market meaning, with **B1.2 and B2.2 ending at the exam level**, because that is what buyers of *Netzwerk* and *Menschen* expect.
   - Internally, tag every can-do with its CEFR band (A2+/B1/B1+/B2/B2+) so the ordering follows §2.2.
2. **Allocation rule for the blueprint.**
   - B1.1 = ZM B1 features (1) and (2) in private and public life.
   - B1.2 = the B1+ „Umfang der Information" descriptors, plus work and authorities, plus every Goethe B1 Teil.
   - B2.1 = the B2 lower end (argumentation), detailed comprehension and the first B2 formats.
   - B2.2 = discourse management, mediation, B2+ negotiation, plus every Goethe B2 Teil.
3. **14 units per half-level** (the tables in §3). Each unit gets 1 situation and 2–4 can-dos, and at least one can-do is productive and **AI-graded** (speaking coach or evaluate-writing). Each half-level must contain at least 3 work units (BSK/RC), at least 1 online-interaction can-do and at least 1 mediation can-do (SB/E8).
4. **Build the level-specific AI rubric from the BSK qualifier ladder (§2.3).**
   - B1 pass: „einfache zusammenhängende Äußerungen, grundlegende Informationen, verständlich trotz Formulierungsproblemen".
   - B2 pass: „Begründungen + Zusammenhänge, Formalität angemessen, keine Fehler, die zu Missverständnissen führen".
   - The same task (e.g. a Reklamation) is then graded against a different bar in B1.2 and B2.1.
5. **Run the four spiral threads** (Beschwerde, Meinung, Konsultation, Weitergeben) through all four courses. Each recurrence names its band step. This is also a cross-sell argument: "B2.1 takes your B1.2 complaint to a claim for concessions."
6. **Do not rebuild survival fields at B1.** B1's share is 3.7 % in Unterricht and 9.4 % in Mobilität, against 31.9–50 % in Arbeit, Arbeitssuche and Weiterbildung (§2.4). Einkaufen and Mobilität appear at B1 only as the less routine version (Reklamation, AGB, disruptions).
7. **Exam rehearsal.** Every B1.2 unit rehearses at least one Goethe/ÖSD B1 Teil, and B2.2 covers all B2 Teile. B1.1 and B2.1 introduce formats at low stakes (B1 Schreiben T1/T3; B2 Schreiben T1/T2).
8. **Copyright.** The CoE states that the copyright of its scales „(in all languages)" belongs to the Council of Europe and „publishers should ask permission" ([CoE overview, mirror](https://api.macmillanenglish.com/fileadmin/user_upload/Blog_and_Resources/Blogs_and_articles/CEFR-all-scales-and-all-skills.pdf)). The German texts are © Goethe-Institut/Klett, telc and BAMF.
   - In the product, write **our own can-do copy** and tag it to the source ID. The verbatim lines in this memo are for internal mapping only.
   - Ask permission before shipping the SB grid verbatim.
9. **Legal framing.** Can-dos are learning goals and self-checks („Ich kann …"), never outcome promises. AI grading is labelled as an automated tool (FernUSG/UWG constraint in the task brief).
10. **Level-end self-check.** Use the SB grid structure (Hören/Lesen/Sprechen/Schreiben/Online/Mediation) as the end-of-course checklist, with our own wording, subject to item 8.
11. **Wording.** Follow the Begleitband update: write „kompetente Sprechende" (ZM B2) rather than „Muttersprachler", and use the Sie-register in instructions.
12. **Keep a Beruf track in reserve.** The BSK catalogue (60 Groblernziele, about 300 differentiated B1/B2 descriptors) can feed a later job-German add-on without new research.

## 5. Open questions

1. Owner and legal: will the product page promise the market meaning (exam level after .2) or the CEFR meaning (.1 = criterion, .2 = plus)?
2. Which exam does each .2 target (Goethe/ÖSD, telc, DTZ, DTB B2)? This changes the work weighting and Teil rehearsal (see memos 02 and 03).
3. What share of units should be work-related? And is Austria/Switzerland in scope? (ÖIF-B1 requires Austrian specifics and dialect exposure.)
4. Will the owner seek CoE/Klett permission for verbatim ich-Form checklists, or do we write all copy ourselves?
5. Where does the new A2.2 end (A2 or A2+)? That fixes the true starting band of B1.1.

## 6. Unverified

- The B2+ assignment of „bei einer lebhaften Diskussion … mithalten". The telc handbook prints B2 as one cell, so the row split is from memory of GER 2001, not from the extracted text.
- That the ÖIF §3.1 Handlungsfeld examples are *Profile deutsch* items. Only ÖIF §1.2 says so explicitly. *Profile deutsch* itself was not accessible.
- The full can-do lists in the Goethe B1 (2013) and modular B2 (2018) *Prüfungsziele* books (samples only). The B2 goals cited come from the **2007** pre-modular handbook.
- The English CV 2020 wording (Cloudflare 403). All CV content here is from the official German appendices.
- My parse counts (133 B1 RC goals, 339 BSK Feinlernziele). The RC per-field percentages are the document's own.
- Goethe *Deutsch Online Individual*: "B1.1 and B1.2: 27 sequences with 30 open writing/speaking tasks each; B2.1: 18/21; B2.2: 18/32". This comes from a search snippet of [goethe.de/doi](https://www.goethe.de/de/spr/kur/doln/doi.html), and the page returns 403.
- *Menschen* "A1.1 bis B1.2" BAMF approval (search snippet).
