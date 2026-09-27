# 06 — Grammar progression A1–B2 by half-level

**Date:** 2026-09-26 · **Program:** course-v2 (from scratch) · **Status:** research memo, input to the blueprint

The old A1.1 course and `docs/course-standard-2026-09-12.md` were not used as a template. `docs/research/research-curricula-2026-09-12.md` §(b) was checked as a source. Its grammar column mostly holds up. One error: it gives *Passiv Präsens* and *Relativsatz* as the A2.2 "ceiling" without saying that Klett, Linie 1 and Profile deutsch all put them later.

## Method

1. **Publisher tables of contents and grammar overviews.** I downloaded these with `curl` and extracted the text with `pypdf`. Codes used below:
   - **MEN**, Menschen (Hueber): [A1](https://www.hueber.de/media/36/978-3-19-101901-3_Inhalt.pdf) (L1–12 = A1.1, L13–24 = A1.2), [A2/1](https://www.hueber.de/media/36/978-3-19-301902-8_Inhalt.pdf), [A2/2](https://www.hueber.de/media/36/9783195019026_Inhalt.pdf), [B1/1](https://www.hueber.de/media/36/978-3-19-301903-5_Inhalt.pdf), [B1/2](https://www.hueber.de/media/36/978-3-19-501903-3_Inhalt.pdf).
   - **SCH**, Schritte international Neu / Schritte plus Neu (Hueber), 7 lessons per volume, volumes 1–6 = A1.1–B1.2: [1](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010827_Inhalt.pdf), [2 (AT)](https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783192010804_Inhalt.pdf), [3](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/978-3-19-301084-1_Inhalt.pdf), [4](https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783196010831_Inhalt.pdf), [5](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010865_Inhalt.pdf), [6](https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/978-3-19-601085-5_Inhalt.pdf). For volumes 3 and 5 I compared the *plus* and *international* editions ([plus 3](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010834_Inhalt.pdf), [plus 5](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010858_Inhalt.pdf)). Their grammar lists are identical, so they are treated as one family here.
   - **NWN**, Netzwerk neu A1/A2 (Klett), 12 chapters per level, K1–6 = the .1 half-level. The chapter-by-chapter grammar comes from the [Bard College Berlin syllabus](https://tools.bard.edu/wwwmedia/files/9729970/3/German%20Studies%20Curriculum%20Niveaustufen%20Uebersicht%20Spring%202021.pdf). I cross-checked it against Klett's clip lists for [A1](https://www.klett-sprachen.de/downloads/26407/netzwerk-neu-a1-uebersicht-clips-kapitel-1-12/pdf) and [B1](https://www.klett-international.com/en/downloads/26409/netzwerk-5fneu-5fb1-5f-2d-5f-dcbersicht-5fclips-5f-2d-5fkapitel-5f1-2d12/pdf).
   - **NW1**, Netzwerk B1, first edition, from the same Bard syllabus.
   - **LIN**, Linie 1 (Klett, Integrationskurs): [Die neue Linie 1 A1.1 worksheets](https://www.klett-international.com/de/downloads/33274/die-5fneue-5flinie-5f1-5fa1-2e1-5f-96-5farbeitsbl-e4tter-5fgrammatik/pdf) (K1–8) and [Linie 1 B1 worksheets](https://www.klett-sprachen.de/downloads/21619/linie-1-b1-grammatik-kopiervorlagen/pdf) (K1–8 = B1.1, K9–16 = B1.2).
   - **MOT**, Motive (Hueber): [grammar overview with lesson references](https://www.hueber.de/media/36/Motive_A1-B1_Grammatik%C3%BCbersicht.pdf). By [series page](https://www.hueber.de/reihe/motive), A1 = L1–8, A2 = L9–18, B1 = L19–30. Motive has no half-level split.
   - **ASP**, Aspekte neu: [B1 plus](https://www.klett-sprachen.de/downloads/292/lehrbuch-inhaltsverzeichnis-aspekte-neu-b1-plus/pdf) (a bridging volume) and [B2](https://www.klett-sprachen.de/downloads/5861/lehrbuch-inhaltsverzeichnis-aspekte-neu-b2/pdf). [Teil 1 = K1–5](https://www.klett-sprachen.de/aspekte-neu-b2-teil-1-hybride-ausgabe-allango/t-1/9783126052689).
   - **SIC**, Sicher! (Hueber): [B1+ grammar](https://www.hueber.de/media/36/Sicher_B1_Grammatikuebersicht.pdf), [B2 contents](https://www.hueber.de/media/36/sih_kb_b2_Inhalt.pdf) and [Sicher! aktuell B2 grammar](https://www.hueber.de/media/36/Sicher_aktuell_B2_Grammatikuebersicht.pdf) (L1–6 = B2.1).
2. **Level inventories.**
   - **PD**, the [Profile deutsch "Grammatik: Übersicht A1–B2"](https://limbagermana.eu5.org/Grammatik_A1_B2.pdf). This is an excerpt. I read its columns in pypdf layout mode, so level assignment comes from column position. The full inventory is a [Klett CD-ROM product](https://www.klett-sprachen.de/profile-deutsch/t-1/9783126065184).
   - **GZ-A1**: [Goethe A1 SD1 Prüfungsziele](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf), pp. 100–106.
   - **GZ-A2**: [Goethe A2 Fit in Deutsch 2](https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf), pp. 106–109. The adult A2 and B1 inventories are paid Hueber books ([A2 sample](https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190518685_Muster.pdf)); I did not read those.
3. **Acquisition research:**
   - Wisniewski 2020 ([abstract](https://benjamins.com/catalog/ijlcr.18008.wis))
   - Smits, Mortelmans & Willems 2020 ([PDF](https://gm.winter-verlag.de/data/article/9583/pdf/132001015.pdf)), which cites Diehl et al. 2000, Wegener 1995 and Baten 2013
   - the German Grammar Profile paper, Löfflad et al. 2025 ([PDF](https://aclanthology.org/2025.konvens-2.17.pdf))
   - [Grießhaber's Profilanalyse stages](https://home.edo.tu-dortmund.de/~hoffmann/ABC/Erwerbsstufen.htm)
   - [the DiGS project](https://www.unige.ch/lettres/alman/recherche/projets-termines/digs)
4. **Our topics.** I ran read-only SQL on `grammar_topics` (project `omqyueddktqeyrrqvnyq`, 2026-09-26) and read `grammar-content-cache.json` (`dumpedAt` 2026-08-24). Both hold the same **84** published topics, not 76: 12 each for A1.1–B1.1 and 8 each for B1.2, B2.1 and B2.2.

**Consensus labels.**
- **strong**: every textbook family that covers the level puts the point in this half-level.
- **majority**: most families do.
- **split**: the placements disagree. The alternatives are named in brackets.

## Findings

### F1 — One spine with five hinge points

For most points the textbook families agree to within one half-level. They disagree at five hinge points, and the F3 tables give the details:

1. **Perfekt:** Hueber puts it at the end of A1.1, Klett in A1.2.
2. **Passiv Präsens:** Hueber puts it in A2.2, the Klett books in B1, PD at B2.
3. **Relativsatz Nom/Akk:** A2.2 in MEN, NWN, MOT and PD; B1.1 in SCH and LIN.
4. **Futur I, Konjunktiv II Vergangenheit, um…zu/damit:** each moves by a half-level within B1 between families.
5. **Zweiteilige Konnektoren:** B1.1 (SCH), B1.2 (MEN, NW1), B2 (ASP, PD).

### F2 — Profile deutsch and the Goethe inventories run later than the textbooks

Profile deutsch describes its grammar as a summary of its word lists. It says explicitly that it is "*nicht … eine Erwerbsgrammatik*", meaning it does not state what learners can produce without errors at a level ([PD](https://limbagermana.eu5.org/Grammatik_A1_B2.pdf), p.1). Löfflad et al. note that its level assignments rest on expert consensus, not on learner data ([GGP](https://aclanthology.org/2025.konvens-2.17.pdf), §2).

Profile deutsch vs the textbooks:
- **PD is later than the textbooks for:**
  - werden-Passiv: B2
  - Konjunktiv II Vergangenheit: B2
  - Konjunktiv I: B2
  - Futur II: B2
  - nicht nur/sowohl/zwar/weder: B2
  - indem, sobald, sofern: B2
  - trotz: B2
  - indirect questions with ob: B1 (the W-word type is split between A2 and B1)
- **PD is earlier than the textbooks for:** damit (A2), Relativsatz Nom/Akk (A2).
- **PD agrees with the textbooks on:**
  - Genitiv: B1
  - Futur I: B1
  - Plusquamperfekt: B1
  - Partizip I: B1
  - Relativsatz Dat/mit Präposition and was/wo: B1

The Goethe A1 inventory expects more than a typical A1.1 unit list covers:
- Perfekt of 15 listed verbs
- Präteritum of haben and sein (1st and 3rd person)
- Konjunktiv II of mögen and werden, as lexical units
- the imperative in the du, ihr and Sie forms
- all six modal verbs
- Nominativ, Akkusativ and Dativ of all nouns in the word list
- Genitiv with proper names
- dies- and welch-
- the dative verbs danken, gehören and helfen
- Wortbildung with -er, -ung, -in, un-, -los and -bar

Source: [GZ-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf), pp. 102–106. The inventory also says Konjunktiv II belongs at A1 only "*als lexikalische Einheiten*" (p. 100).

The Goethe A2 inventory (Fit 2):
- **It includes:**
  - Präteritum of haben, sein, kommen, sagen and the modal verbs
  - Konjunktiv II möchte/hätte/könnte
  - attributive adjective endings
  - Komparation
  - Nebensätze with dass, weil, wenn and a W-word
  - deshalb
- **It does not include:** Passiv, Relativsatz, Futur and zu-Infinitiv.

Source: [GZ-A2](https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf), pp. 106–109.

### F3 — Consensus progression by half-level

Lesson and chapter numbers refer to the sources above. The "classic difficulty" column is teaching consensus; F4 lists which of these difficulties have empirical support.

**A1.1**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | Präsens and personal pronouns; du/Sie | MEN L1–2; SCH1 L1–2; NWN K1; LIN K1–2 | strong | *arbeitest* (e-insertion); du vs Sie |
| 2 | W-Frage, Aussagesatz (V2) | MEN L1; SCH1 L1; NWN K1; LIN K1 | strong | verb not in second position |
| 3 | sein, haben | SCH1 L1–2; NWN K2; LIN K2 | strong | — |
| 4 | Ja/Nein-Frage; ja/nein/doch | MEN L3; SCH1 L3/L6; NWN K2; LIN K2 | strong | *doch* after a negative question |
| 5 | Articles (definite and indefinite), gender, plural; er/es/sie for things | MEN L4–6; SCH1 L3–4; NWN K2–3; LIN K3–4 | strong | gender learned without the article; plural patterns |
| 6 | Negation with nicht and kein | MEN L2, L5; SCH1 L3–4; NWN K3; LIN K3 | strong | nicht vs kein; where nicht goes |
| 7 | Possessivartikel mein/dein/Ihr | MEN L3; SCH1 L2; NWN K5; LIN K3 | strong (sein/ihr/unser: A1.2 in MEN L14 and SCH2 L10) | Ihr vs ihr |
| 8 | Verben mit Vokalwechsel | MEN L3; SCH1 L3/L6; NWN K2; LIN K5 | strong | the vowel change affects only du and er/sie/es |
| 9 | Akkusativ (den/einen/keinen) | MEN L6; SCH1 L6; NWN K4; LIN K4/K6 | strong | only masculine forms change |
| 10 | können, möchte, mögen (+ wollen, müssen); Satzklammer | MEN L7/L9; SCH1 L6–7; NWN K4–5; LIN K4/K7–8 | strong | infinitive left in mid-sentence |
| 11 | Clock time; am/um/von…bis; inversion | MEN L8; SCH1 L5; NWN K5 | strong | *Am Montag ich arbeite* |
| 12 | Trennbare Verben | MEN L10; SCH1 L5; NWN K6; LIN K5 | strong | prefix not moved to the end |
| 13 | Perfekt with haben and sein | MEN L11–12; SCH1 L7 | **split** (NWN K10 = A1.2) | haben vs sein |
| 14 | Imperativ (Sie form) / Präteritum war, hatte | NWN K3/K6; LIN K3 | split (Hueber: A1.2) | — |

**A1.2**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | Dativ through prepositions (mit, zu, bei, aus, von, nach; Wo? + Dativ) | MEN L13; SCH2 L11; NWN K7/K9 | strong | zum/zur; dative after a verb of motion |
| 2 | sein/ihr/unser/euer; Genitiv-s with names | MEN L14; SCH2 L10 | strong | choosing sein vs ihr by the owner |
| 3 | Dative verbs (gefallen, helfen); dative pronouns | MEN L15; SCH2 L13; NWN K11 | strong | mir vs mich |
| 4 | Time prepositions vor/nach/in/seit/ab/bis | MEN L16; SCH2 L8/L12; NWN K12 | strong | *seit* takes Präsens |
| 5 | wollen, sollen, müssen, dürfen | MEN L17/L18/L21; SCH2 L9–10; NWN K8 | strong | *nicht müssen* ≠ *nicht dürfen* |
| 6 | Imperativ du/ihr | MEN L18/L20; SCH2 L9; NWN K8 | strong | *nimm*, *lies* |
| 7 | Präteritum war/hatte; Perfekt of inseparable, separable and -ieren verbs | MEN L19; SCH2 L8; NWN K10–11 | majority | *gebesucht*, *gestudiert* |
| 8 | Accusative pronouns | MEN L20; SCH2 L14 | majority (NWN K6) | — |
| 9 | welch-/dies- | SCH2 L13; NWN K11 | split (MEN L21 = A2.2) | — |
| 10 | Komparation (gut/gern/viel; als/wie) | MEN L22; SCH2 L13 | split (NWN A2 K3; SCH4 L9) | als vs wie |
| 11 | denn | MEN L23; SCH2 L14; NWN K12 | strong | treated like *weil* (verb moved to the end) |
| 12 | würde/könnte as chunks; ordinal numbers; man | MEN L24; SCH2 L9/L12/L14; NWN K6/K12 | majority | — |

**A2.1**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | Review of Perfekt/Präteritum | MEN L1; SCH3 L1; NWN K1 | strong | — |
| 2 | weil | SCH3 L1; MEN L8; NWN K1 | strong | *weil ich habe…* |
| 3 | Wechselpräpositionen; stellen/stehen etc. | MEN L2; SCH3 L2 | majority (NWN K10 = A2.2) | the Wo?/Wohin? rule misapplied |
| 4 | Adjective endings (definite, indefinite, no article) | MEN L4/L5/L9; NWN K5–6 | split (SCH4 L9/L10/L12 = A2.2) | strong vs weak endings |
| 5 | Konjunktiv II könnte/sollte (advice) | MEN L7; SCH3 L4; NWN K5/K8 | strong | — |
| 6 | wenn | MEN L12; SCH3 L4; NWN K4 | strong | wenn/wann/als |
| 7 | dass | MEN L10; SCH3 L6; NWN K3 | strong | verb-final position |
| 8 | Reflexive verbs | MEN L11; SCH3 L5; NWN K4 | strong | mich vs mir |
| 9 | Modal verbs in Präteritum | SCH3 L6; NWN K2 | majority (MEN L20) | *konnte*, not *könnte* |
| 10 | Verbs with prepositions; wo(r)-/da(r)- | SCH3 L5 | split (MEN L18, NWN K11) | fixed preposition and case |
| 11 | Dative + accusative objects: word order | SCH3 L7 | split (MEN L15, NWN K9) | order of pronoun objects |
| 12 | Indefinite pronouns einer/keiner | SCH3 L3 | split (NWN K12) | — |

**A2.2**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | Konjunktiv II wäre/hätte/würde/könnte (wishes) | SCH4 L8; NWN K8/K11 | majority | *würde haben* |
| 2 | trotzdem, deshalb | SCH4 L8/L11; NWN K9 | majority (MEN: deshalb A2.1, trotzdem B1.1) | inversion after the adverb |
| 3 | als (past), bis, seit(dem) | MEN L13/L22; NWN K10 | split (SCH B1.1/B1.2) | als vs wenn |
| 4 | **Passiv Präsens** | MEN L14; SCH4 L10 | **split** (Klett and LIN: B1; PD: B2; not in GZ-A2) | werden vs sein |
| 5 | Indirect questions with ob/W-word | MEN L16; SCH4 L13; NWN K7 | strong (PD: ob at B1) | ob vs wenn |
| 6 | Local prepositions gegenüber, durch, an…vorbei, am/ans | MEN L16–19; SCH4 L11–12; NWN K7 | strong | — |
| 7 | Verbs with prepositions + Präpositionaladverb | MEN L18; NWN K11 | majority | *darauf* for things, *auf ihn* for people |
| 8 | lassen; welch-/dies- | MEN L21; SCH4 L13 | majority (NW1 B1 K1) | — |
| 9 | **Relativsatz Nom/Akk** | MEN L23; NWN K12; MOT L16; PD A2 | **split** (SCH5 L2, LIN B1 K2 = B1.1) | case taken from the relative clause, gender from the noun |
| 10 | Adjective endings (SCH); Was für ein | SCH4 L9–12; NWN K8 | — | — |
| 11 | Regular and irregular Präteritum | MEN L24 | split (B1.1: SCH, LIN, NW1) | — |

**B1.1**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | Präteritum for narration | SCH5 L1; MEN L2; LIN K4; NW1 K3; ASP B1+ K1 | strong | strong-verb forms |
| 2 | als; Plusquamperfekt; nachdem | SCH5 L1; MEN L11 | split (NW1 K7, LIN K12, SCH6 L9) | nachdem + Präsens |
| 3 | Relativsatz: dative, with preposition | MEN L3; SCH5 L2; NW1 K6 | majority (LIN K14) | preposition placed at the end |
| 4 | obwohl / trotzdem | MEN L4; SCH5 L2; LIN K3–4; NW1 K1 | strong | verb-final vs inversion |
| 5 | Futur I | MEN L5; LIN K5; NW1 K6; ASP B1+ K6 | majority (SCH6 L11; MOT L29) | the three uses of *werden* |
| 6 | Infinitiv mit zu | MEN L7; SCH5 L5; NW1 K1 | strong (MOT L17) | *anzurufen*; zu wrongly added after modals |
| 7 | Genitiv + wegen/trotz/während | MEN L12; SCH5 L3–7; LIN K3; NW1 K2 | strong (PD: trotz at B2) | -(e)s endings |
| 8 | Konjunktiv II: unreal conditions | SCH5 L4; NW1 K4 | majority (LIN K9) | — |
| 9 | Konjunktiv II Vergangenheit | SCH5 L7; MEN L10 | split (PD: B2) | hätte vs wäre |
| 10 | um…zu/damit; statt/ohne…zu | SCH5 L6; LIN K6 | split (MEN L23–24) | same-subject rule |
| 11 | falls, da, während, bevor | MEN L6/L8 | split (SCH6, LIN K10–11) | — |
| 12 | Adjectives as nouns; n-Deklination | MEN L1; ASP B1+ K2 | split (SCH6 L8, LIN K14) | *den Kollege* |

**B1.2**

| # | Grammar point | Placement | Consensus | Classic difficulty |
|---|---|---|---|---|
| 1 | darum/deswegen/daher, sodass, indem | MEN L13/L20; SCH6 L12; NW1 K3 | majority (PD: indem at B2) | — |
| 2 | Partizip I/II as adjective | MEN L14; SCH6 L10; NW1 K11–12; NWN K12 | strong | endings on the participle |
| 3 | Two-part connectors | MEN L15/L18/L19; SCH6 L8/L10; NW1 K8; LIN K16 | majority (SCH5 L7; PD: B2) | word order in each part |
| 4 | (nicht/nur) brauchen + zu | MEN L16; LIN K11; NW1 K8 | strong | — |
| 5 | je … desto | MEN L19; SCH6 L8; NW1 K11 | strong | verb-final after *je*, inversion after *desto* |
| 6 | Passiv Präteritum/Perfekt (+ modal verb) | MEN L21–22; SCH6 L13; NW1 K10 | strong | *worden* vs *geworden* |
| 7 | Relativsatz with wo/was | SCH6 L10; NW1 K11; LIN K14 | strong | *das, was* |
| 8 | Plusquamperfekt; während/nachdem/bevor | SCH6 L9; NW1 K7; LIN K11–12 | majority (MEN B1.1) | — |
| 9 | als ob; (an)statt/ohne dass | SCH6 L9/L12; MEN L23–24 | majority | — |
| 10 | innerhalb/außerhalb, entlang, um…herum | MEN L21; NW1 K10; LIN K13 | strong | — |
| 11 | Position of nicht; Ausdrücke mit es; Modalpartikeln | NW1 K9; MEN L17/L19 | split (SIC B1+; ASP B2 K1/K2/K9) | — |

**B2.1** (ASP K1–5, SIC L1–6)

| # | Grammar point | Placement | Consensus |
|---|---|---|---|
| 1 | Word order in the Mittelfeld; negation | ASP K1; SIC L1 | strong |
| 2 | Two-part connectors (review) | ASP K3; SIC L1 | strong |
| 3 | Comparative clauses (als, wie, je…desto); *es*/Verweiswörter | ASP K2; SIC L3 | majority |
| 4 | Infinitive clauses vs dass-Satz; um/ohne/statt zu vs alternatives | ASP K3; SIC L3 | strong |
| 5 | Nomen-Verb-Verbindungen | ASP K4; SIC L5 | strong |
| 6 | Passiv + Passiversatzformen | ASP K5 | split (SIC L10) |
| 7 | Zustandspassiv; von/durch | SIC L2 | split (ASP K6) |
| 8 | Partizip I/II as adjective | SIC L2 | split (ASP K10) |
| 9 | Relativsatz with wer | ASP K4 | split (SIC L7) |
| 10 | lassen; Futur II (supposition); meanings of Konjunktiv II | SIC L5–6 | SIC only |

**B2.2** (ASP K6–10, SIC L7–12)

| # | Grammar point | Placement | Consensus |
|---|---|---|---|
| 1 | Indirekte Rede, Konjunktiv I | ASP K8; SIC L7 | strong (PD B2) |
| 2 | Nouns, verbs and adjectives with prepositions | ASP K8; SIC L6–7 | strong |
| 3 | dadurch…dass / indem (modal clauses) | ASP K7; SIC L11 | strong |
| 4 | Nominalisierung | ASP K9; SIC L5/L8 | strong |
| 5 | Extended participle attribute; participles as nouns | ASP K10; SIC L12 | strong |
| 6 | Concessive, conditional, consecutive and adversative connectors; genitive prepositions | ASP K10; SIC L8–9/L12 | strong |
| 7 | Text cohesion (reference words, connectors) | ASP K7 | split (SIC L3) |
| 8 | Subjective modal verbs (sollen); Modalpartikeln | SIC L8; ASP K9 | single-book |

### F4 — Classic learner difficulties: what the evidence supports

- **Word order develops in stages, and the stages outlast the level.** Grießhaber's profile stages run from separating the verb parts, to inversion, to verb-final Nebensätze ([Profilanalyse](https://home.edo.tu-dortmund.de/~hoffmann/ABC/Erwerbsstufen.htm)). In MERLIN, verb-final clauses emerged in 44% of B1 texts, and most A2 texts had none. Inversion emerged in 61.5% of B1 texts and 37.5% of A2 texts, "*persisting problems with INV accuracy at B1*" ([Wisniewski 2020](https://benjamins.com/catalog/ijlcr.18008.wis)).
- **Case.** Case is "*a real difficulty*" for DaF learners. Learners massively overuse *die* (Baten 2013). In noun phrases the order of acquisition follows Nom > Akk > Dat (Wegener). By contrast, the "*Akkusativ-Dativ-Opposition in der PP mit fester Kasusrektion*" is acquired earlier than in noun phrases (Diehl et al. 2000: 327). The classroom rule "Wo? → Dativ, Wohin? → Akkusativ" itself produces errors (Moonen & Wilmots 1997). All of this is reported in [Smits et al. 2020](https://gm.winter-verlag.de/data/article/9583/pdf/132001015.pdf), pp. 189–193. DiGS found an intermediate phase in which Nom/Akk/Dat forms are mixed unsystematically ([DiGS](https://www.unige.ch/lettres/alman/recherche/projets-termines/digs) and the search summary).
- **Adjective declension** is a "*besonders herausfordernder Lerngegenstand*" because the strong and weak patterns alternate ([Uni Gießen project](https://www.uni-giessen.de/de/fbz/fb05/germanistik/iprof/daf/unterpunkte/up_projekte/ord_dissertationsprojekte/dp_adjektive_als_morphosyntaktische_herausforderung)).
- **No source read (teaching consensus only):**
  - choosing haben vs sein in the Perfekt, and *ge-* on inseparable or -ieren verbs
  - *würde haben*
  - *worden* vs *geworden*
  - n-Deklination endings left off
  - the three connector positions: denn/aber (no change), deshalb/trotzdem (inversion), weil/obwohl (verb-final)

### F5 — Our 84 slugs vs the consensus

| Level | Agrees | Out of place | Missing from the consensus for this half-level |
|---|---|---|---|
| A1.1 | nouns-gender, definite-/indefinite-articles, personal-pronouns, verb-sein, verb-haben, present-tense-regular, separable-verbs-intro, yes-no-questions, time-and-dates | possessive-articles teaches all forms at once (consensus: mein/dein/Ihr only); alphabet-pronunciation is not grammar | Akkusativ, können/möchte, nicht/kein, Vokalwechsel, W-questions (all sit in our A1.2) |
| A1.2 | imperative, perfekt-intro (Klett placement; includes war/hatte), dative-prepositions-intro, prepositions-accusative | **one level late:** basic-sentence-structure, nominative-case, accusative-intro, question-words, negation, stem-changing-verbs, numbers-counting (all A1.1) | dative verbs and pronouns, sein/ihr/unser, sollen/dürfen, welch-/dies-, man, denn, würde/könnte |
| A2.1 | two-way-prepositions, adjective-endings-intro, modal-verbs-past, temporal-prepositions, possessive-pronouns | dative-case and pronouns-accusative-dative are late (A1.2). **Duplicates:** prepositions-dative, separable-verbs, imperative-mood, perfect-tense-haben/-sein | weil, dass, wenn, reflexive verbs (in our A2.2) |
| A2.2 | konjunktiv-ii-polite, verbs-with-prepositions-intro, indirect-questions-intro, comparative/superlative (split) | **late:** simple-past-sein-haben (A1), coordinating-conjunctions (A1–A1.2), subordinating-conjunctions/subordinate-word-order/reflexive-verbs (A2.1). **Early:** future-tense (B1.1), infinitive-with-zu-intro (B1.1) | lassen, als/bis/seit clauses, deshalb/trotzdem, Relativsatz Nom/Akk (majority), receptive Passiv |
| B1.1 | genitive-case, genitive-prepositions, relative-clauses-dat, konjunktiv-ii-ware-hatte, infinitive-with-zu, um-zu-ohne-zu, temporal-clauses, obwohl-damit-sodass | relative-clauses-nom-acc (split); the Gen part of relative-clauses-dat-gen (MOT L30 only). **Duplicates:** konjunktiv-ii-wurde (of A2.2); two-part-connectors (B1.2 majority); adverbial-connectors (deshalb is A2) | Präteritum narrative, Futur I, Konjunktiv II Vergangenheit |
| B1.2 (8) | passive-voice-present/-past, n-declension, verbs-with-prepositions (spiral) | **late:** simple-past-narrative. **Spiral or duplicate:** adjective-declension ×2, indirect-questions | Partizip as adjective, je…desto, brauchen zu, Relativsatz wo/was, als ob, sodass/indem, innerhalb/außerhalb, Passiv + modal verb |
| B2.1 (8) | passive-alternatives, nominalization, participial-adjectives (split) | konjunktiv-i-reported-speech is early (both books: B2.2); extended-attributes is early (SIC L12); causative-constructions (lassen is A2.2); double-infinitive has no B2 book evidence (MOT L26 = B1); konjunktiv-ii-past is late vs Hueber | Mittelfeld, negation, NVV, Zustandspassiv, wer-Relativsatz, Futur II |
| B2.2 (8) | modal-particles, functional-verb-structures, future-perfect | advanced-conjunctions duplicates B1 two-part connectors; subjunctive-fixed-expressions has no book evidence; register-style, complex-sentence-building and review-integration are not grammar points | Konjunktiv I, nouns/adjectives with prepositions, dadurch…dass/indem, subjective modal verbs, generalising relative clauses |

**Count** (my classification from the table above):
- 42 of the 84 slugs match the consensus or one side of a split.
- 11 are duplicates or spiral repeats.
- 6 are not grammar points or have no textbook evidence.
- 25 sit at least one half-level away from the consensus:
  - 20 are too late, including 8 in A1.2 and 5 in A2.2.
  - 5 are too early: possessive-articles, future-tense, infinitive-with-zu-intro, konjunktiv-i-reported-speech and extended-attributes.

## Implications for the course blueprint

1. **Use the F3 tables as the grammar spine, derived from situations.** Each half-level carries 11–15 grammar points, not 8. B1.2, B2.1 and B2.2 each need roughly 4–7 more points than the 8 our DB holds.
2. **A1.1 must include** Akkusativ, können/möchte, nicht/kein, Vokalwechsel, W- and Ja/Nein-questions, and trennbare Verben (every family). The Perfekt enters at the end of A1.1 as 6–10 chunk verbs (*habe gemacht, bin gefahren*). It becomes systematic in A1.2, which covers both the Hueber and the Klett placement.
3. **The end of A1.2 is the Goethe A1 exam, so A1.2 must cover the GZ-A1 inventory in full:**
   - all six modal verbs
   - the imperative in the du, ihr and Sie forms
   - war/hatte
   - Perfekt of the listed verbs
   - dative verbs danken/gehören/helfen
   - dies-/welch-
   - Genitiv-s with names
   - Wortbildung with -er/-ung/-in
4. **Teach the Dativ through fixed-case prepositional phrases first** (A1.2: mit/zu/bei/aus/von/nach, and Wo? + Dativ). Then add dative verbs and pronouns. Research shows PP dative is acquired before dative in noun phrases (Diehl 2000 via Smits 2020). Do not open with "the dative case" as an abstract A2.1 topic, as our current slug does.
5. **Wechselpräpositionen in A2.1 are taught through verb pairs** (stellen/stehen, legen/liegen, hängen) and chunks. The Wo?/Wohin? question is not the only criterion (see F4). The AI grader's feedback for this error must name the verb, not only the question word.
6. **Subordinate clauses with weil/dass/wenn go in A2.1, not A2.2.** All three families agree, and GZ-A2 requires them, alongside W-Nebensätze and deshalb.
7. **Passiv Präsens is receptive in A2.2 and productive in B1.2**, together with Präteritum/Perfekt and modal passives. Hueber has it in A2.2, but GZ-A2 does not require it and Klett, Linie and PD place it later.
8. **Relativsatz:**
   - Nom/Akk in A2.2 (majority, and PD A2)
   - Dativ and with preposition in B1.1
   - wo/was in B1.2
   - wer/was (generalising) in B2.1 or B2.2
9. **Move Futur I from A2.2 to B1.1**, framed as supposition, promise and plan. In A1–A2, future is expressed with Präsens plus a time phrase (MOT L29 note; PD B1).
10. **Präteritum:** war/hatte in A1.2, modal verbs in A2.1, all verbs for narration in B1.1. At the moment ours sits in A2.2 and B1.2, which is late at both points.
11. **The Konjunktiv II ladder:**
    - A1.2: *würde/könnte/hätte gern* as chunks
    - A2.1: könnte/sollte for advice
    - A2.2: wäre/hätte/würde for wishes
    - B1.1: unreal conditions
    - B1.2: past, receptive
    - B2.1: past, productive
    - This bridges Hueber (past at B1.1) and PD (past at B2).
12. **Give every spiral repeat a "Wiederholung" label on the original point instead of creating a new slug.** Merge or retire these pairs:
    - separable-verbs / separable-verbs-intro
    - imperative-mood / imperative
    - prepositions-dative / dative-prepositions-intro
    - indirect-questions / -intro
    - verbs-with-prepositions / -intro
    - infinitive-with-zu / -intro
    - konjunktiv-ii-wurde / konjunktiv-ii-polite
    - advanced-conjunctions / two-part-connectors
13. **Add the missing points:**
    - welch-/dies-, man
    - lassen (A2.2)
    - a standalone Plusquamperfekt
    - adjectives as nouns
    - Partizip as adjective (B1.2)
    - brauchen + zu
    - Relativsatz wo/was
    - *es*
    - position of nicht
    - Mittelfeld
    - Zustandspassiv
    - nouns and adjectives with prepositions
    - subjective modal verbs
    - a Wortbildung strand (-ung/-heit/-keit, un-/-los/-bar), which the Goethe A1 and A2 inventories list explicitly
14. **Drop or reclassify slugs that are not grammar:** alphabet-pronunciation, register-style, complex-sentence-building and review-integration. Drop or re-evidence double-infinitive and subjunctive-fixed-expressions at B2.
15. **The AI graders use the F4 categories as error tags:**
    - V2/INV
    - verb-final
    - Satzklammer
    - case in a noun phrase vs case in a PP
    - gender/article
    - adjective ending
    - Perfekt auxiliary and participle
    - connector position
    - n-Deklination

    Weighting depends on level. An inversion error at B1 is expected (Wisniewski), so it is flagged but not scored as a level failure. A missing verb-final at A2 is feedback, not a penalty.
16. **Copy never claims a one-to-one alignment with Profile deutsch** (see F2). The accurate claim is: aligned with the Goethe A1/A2 inventories and the mainstream Lehrwerk progression.

## Open questions

1. **Hueber or Klett tempo?** Hueber is earlier: Perfekt in A1.1, Passiv in A2.2. Klett and Linie are later. Both SCH and LIN are integration-course books (DTZ). Which exam and learner is primary for each half-level? This depends on memos 01–04.
2. **The B2 split.** Aspekte and Sicher! agree on only about half of their B2.1/B2.2 placements (Passiversatz, Zustandspassiv, Partizip, wer-Relativsatz all swap halves). The blueprint needs a decision on how B2 is split.
3. Can we get the full Profile deutsch database (CD-ROM) and the paid Goethe A2/B1 Prüfungsziele (Hueber) to confirm the B1 inventory?
4. Should A1.1 remain free if it carries the full A1.1 spine? That is roughly 13 points, compared with 12 now.

## Unverified

- The Netzwerk neu A1/A2 and Netzwerk B1 (first edition) chapter grammar comes from a third-party syllabus (Bard College), not from Klett's own contents list. For Netzwerk neu B1 I verified only the clip list (K4, K9, K10, K12).
- The Profile deutsch overview is hosted on a third-party site. Its levels were read from column positions in the PDF text extraction. Not checked against the book.
- The Diehl et al. 2000, Wegener 1995 and Baten 2013 findings come through Smits et al. 2020, not the primary works. DiGS phase details come from a search snippet.
- Motive has no half-level split; half-level statements for MOT are inferred from lesson numbers.
- Sicher! B1+: I parsed grammar for L1–8 only. The total lesson count was not checked.
- The *plus* and *international* editions of Schritte were compared only for volumes 3 and 5.
- Every difficulty listed under "No source read" in F4 is teaching consensus without an empirical source read.
- The brief said "76 slugs". The DB and cache both hold 84.
