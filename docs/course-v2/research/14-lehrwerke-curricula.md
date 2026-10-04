# 14 — Lehrwerke & curricula teardown: what the field actually teaches, and what we steal

Research memo for the course-v2 rebuild (A1.1 → B2.2). Checked **2026-09-27**.

**Method.** WebSearch plus direct download of publisher PDFs (tables of contents, answer keys, clip
lists, the BAMF approval list), with the text extracted by `pypdf`. `goethe.de` and most vendor app
pages were not opened (WebFetch gets 403 there); for those I cite search snippets and say so. Every
Lektion title below is taken from a publisher PDF or a snippet I cite. Anything I could not open is
marked **(unverified)** or **(snippet)**. `docs/research/research-curricula-2026-09-12.md` was
re-checked, not copied. **One correction to it:** the file it cites as the "Linie 1 SVP"
(`klett.gr/img/cms/Logo_A1-1_STOFFVERTEILUNG.pdf`) is the Stoffverteilung for **Logo! A1**, a
school textbook, not Linie 1. So its "~7 UE/Kapitel" figure for Linie 1 has no source.

---

## A. Usage ranking, and how it was judged

No publisher releases sales figures, and I found no independent market-share survey. The ranking
below rests on four proxies, listed from strongest to weakest:

1. **BAMF approval as a *kurstragendes* Integrationskurs book.** The Integrationskurs is the
   largest single German-course market (600 UE Sprachkurs per learner). The list dated **1 July 2026**
   has 29 approved course books
   ([BAMF PDF](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Lehrkraefte/liste-zugelassener-lehrwerke.pdf?__blob=publicationFile)).
   Three of them (Begegnungen, Motive and studio [express]) are approved only "nur in Intensivkursen".
2. **Level coverage and how often the series is referenced.** A series that runs from A1 to C1 in
   two companion series (Menschen → Sicher!, Netzwerk neu → Aspekte neu) takes the whole learner
   journey.
3. **Third-party footprint.** Quizlet, Studocu and Wordwall sets, published answer keys, and uploads
   from Goethe-Institut branches (for example, Netzwerk neu answer keys uploaded under "Goethe-Institut
   Max Mueller Bhavan India" on Studocu, [link](https://www.studocu.com/in/document/goethe-institut-max-mueller-bhavan-india/german-language/netzwerk-neu-a1-losungen-ubungsbuch-kapitel-1-bis-12/133285194)).
   This is weak, anecdotal evidence.
4. **Publisher claims** (target group, approved exams).

| Rank | Lehrwerk | Publisher | Levels | Evidence of usage |
|---|---|---|---|---|
| 1 | **Schritte plus Neu** (+ Schritte international Neu, the DaF twin) | Hueber | A1.1–B1.2 (6 vols) | BAMF-approved (both Schritte PLUS and PLUS NEU are listed). The de-facto Integrationskurs and VHS book, built on the 100-UE module ([Hueber](https://www.hueber.de/reihe/schritte-plus-neu), BAMF list) |
| 2 | **Menschen** / Menschen hier → successor **Momente** | Hueber | A1–B1 | BAMF-approved with the "Menschen hier" AB. Momente is approved with the "Ausgabe DTZ" AB (BAMF list). The standard DaF book abroad (unverified as a ranking) |
| 3 | **Netzwerk / Netzwerk neu** | Klett | A1–B1 | Both editions BAMF-approved. Marketed for Start Deutsch, Goethe A2/B1, telc, DTZ, ÖSD ([Klett](https://www.klett-sprachen.de/netzwerk-neu/r-1/605)). Goethe-branch footprint (proxy 3) |
| 4 | **Linie 1 / Die neue Linie 1** | Klett | A1–B1 | Both BAMF-approved. Built for Alltag + Beruf ([Klett](https://www.klett-sprachen.de/die-neue-linie-1/r-1/782)) |
| 5 | **Aspekte neu** | Klett | B1+–C1 | Not an Integrationskurs book (B1+ and up). The dominant Mittelstufe DaF series by proxy 3 ([Klett](https://www.klett-sprachen.de/aspekte-neu/r-1/15)) |
| 6 | **Sicher! / Sicher! aktuell** | Hueber | B1+–C1 | Hueber's Mittelstufe series. "aktuell" was realigned to Goethe B2 (2019), telc B2, telc B1-B2 Beruf and ÖSD (snippet, [Hueber](https://www.hueber.de/sicher/probe/neu?tabid446681=2)) |
| 7 | **Pluspunkt Deutsch** | Cornelsen | A1–B1 | BAMF-approved (3 editions listed) |
| 8 | **studio [21] / studio d / studio [express]** | Cornelsen | A1–B1 (studio d to C1, unverified) | studio [21] is approved with the "Intensivtraining" AB; [express] only in intensive courses |
| 9 | **Das Leben** | Cornelsen | A1–B1 | BAMF-approved. Cornelsen's newest DaF flagship (unverified as a ranking) |
| 10 | **Motive** | Hueber | A1–B1 in 30 Lektionen | BAMF: intensive courses only. Compact course ([Hueber shop](https://shop.hueber.de/de/motive-kb-a1-b1-lekt-1-30-978-3-19-001878-9.html)) |
| 11 | **DaF kompakt neu** | Klett | A1–B1 | Not on the BAMF list. For students and young professionals in intensive courses (snippet, [Klett](https://www.klett-sprachen.de/daf-kompakt-neu-a1-b1/t-1/9783126763103)) |
| 12 | **Begegnungen** | Schubert | A1+–B1+ | BAMF: intensive only |

Other BAMF-approved books I did not tear down: Auf jeden Fall!, Einfach gut! (telc), Aussichten,
Hier!, Berliner Platz NEU (Klett), Ja genau!, Panorama, Treffpunkt, unterwegs (Cornelsen),
Miteinander!, Schritt für Schritt (Hueber), Spektrum Deutsch (Schubert) and inlingua's Deutsch 1+2
(BAMF list).

---

## B. Curriculum-by-curriculum

### B1. Menschen (Hueber, 2012–14) — the "4-page Lektion" model

- **Split:** 24 Lektionen per level in 8 Module of 3. Teilband x.1 = L1–12, x.2 = L13–24, for A1, A2
  and B1.
- **Anatomy (A1–B1 identical):** each Lektion is **4 pages**. p1 is a photo or Hörszene with a
  **Lernziele** box. pp2–3 are a double page with a Bildlexikon header. p4 is Sprech-/Schreibtraining
  plus a Grammatik/Kommunikation summary. After every 3 Lektionen comes a **Modul-Plus** (4 pages):
  **Lesemagazin → Film-Stationen → Projekt Landeskunde → Ausklang** (a song or poem). Page numbers
  confirm this: L1 p.11, L2 p.15, L3 p.19, Modul-Plus pp.23–26
  ([A1 Inhalt](https://www.hueber.de/media/36/978-3-19-101901-3_Inhalt.pdf)). At the back are
  "Aktionsseiten zu Lektion 1–24" (pairwork).
- **Hours:** ≈4 UE per Lektion plus about 3 UE per Modul-Plus/test, so ≈48 UE per Teilband
  (Stoffverteilungsplan, via the 09-12 memo:
  [SVP A1](https://hueber.pl/data/products/materials/MenschenA1_rozklad_materialu.pdf)). Hueber also
  publishes a "reduzierte Anzahl UE" guide for B1
  ([PDF](https://www.hueber.de/media/36/Menschen_Leitfaden_B1_reduzierte_Anzahl_Unterrichtseinheiten.pdf)).
- **Lektionen (all titles verified from the Inhalt PDFs):**

**A1** ([Inhalt](https://www.hueber.de/media/36/978-3-19-101901-3_Inhalt.pdf)):

| L | Thema — Titel | Grammatik |
|---|---|---|
| 1 | Begrüßung, Befinden — *Hallo! Ich bin Nicole …* | Verbkonjugation Sg., W-Fragen |
| 2 | Angaben zur Person, Berufe — *Ich bin Journalistin.* | Konjugation Sg./Pl., nicht, -in |
| 3 | Familie — *Das ist meine Mutter.* | Ja/Nein-Fragen, ja-nein-doch, mein/dein, Vokalwechsel |
| 4 | Einkaufen, Möbel — *Der Tisch ist schön!* | der/das/die, er/es/sie, Zahlen bis 1 Mio. |
| 5 | Gegenstände, Produkte — *Was ist das? – Das ist ein F.* | ein/eine, kein/keine |
| 6 | Büro & Technik — *Ich brauche kein Büro.* | Plural, Akkusativ |
| 7 | Freizeit, Komplimente — *Du kannst wirklich toll …!* | können, Satzklammer |
| 8 | Freizeit, Verabredungen — *Kein Problem. Ich habe Zeit!* | Verbposition, am/um |
| 9 | Essen, Einladung — *Ich möchte was essen, Onkel Harry.* | mögen/möchte, Komposita |
| 10 | Reisen, Verkehrsmittel — *Ich steige jetzt in die U-Bahn ein.* | trennbare Verben |
| 11 | Tagesablauf, Vergangenes — *Was hast du heute gemacht?* | Perfekt haben, von…bis, ab |
| 12 | Feste, Vergangenes — *Was ist denn hier passiert?* | Perfekt sein, im |
| 13 | Wege beschreiben — *Wir suchen das Hotel Maritim.* | lokale Präp. + Dativ |
| 14 | Wohnen — *Wie findest du Ottos Haus?* | sein/ihr, Genitiv bei Eigennamen |
| 15 | In der Stadt — *In Giesing wohnt das Leben!* | Verben mit Dativ, Personalpron. Dativ |
| 16 | Termine (Hotel) — *Wir haben hier ein Problem.* | vor, nach, in, für (temporal) |
| 17 | Pläne und Wünsche — *Wer will Popstar werden?* | mit/ohne, wollen |
| 18 | Gesundheit und Krankheit — *Geben Sie ihm doch diesen Tee!* | Imperativ (Sie), sollen |
| 19 | Aussehen und Charakter — *Der hatte doch keinen Bauch!* | war/hatte, Perfekt untrennbar, un- |
| 20 | Im Haushalt — *Komm sofort runter!* | Imperativ du/ihr, Personalpron. Akk. |
| 21 | Regeln — *Bei Rot musst du stehen, bei Grün darfst du gehen.* | dürfen, müssen |
| 22 | Kleidung — *Am besten sind seine Schuhe!* | Komparation |
| 23 | Wetter — *Ins Wasser gefallen?* | denn, -los |
| 24 | Feste und Feiern — *Ich würde am liebsten jeden Tag feiern.* | Konjunktiv II würde, Ordinalzahlen |

**A2.1** ([Inhalt](https://www.hueber.de/media/36/978-3-19-301902-8_Inhalt.pdf)): 1 Berufe und
Familie *Mein Opa war auch schon Bäcker* (unser/euer, Perfekt/Präteritum review) · 2 Wohnen *Wohin mit
der Kommode?* (Wechselpräpositionen) · 3 Tourismus (Verb+-er/-ung) · 4 Einkaufen *Was darf es sein?*
(Adj. after indef. article) · 5 Stadtbesichtigung (Adj. after def. article) · 6 Kultur (über, von…an)
· 7 Sport und Fitness *Wir könnten montags joggen gehen* (Konjunktiv II könnte/sollte) · 8 Gesundheit
und Krankheit (weil, deshalb) · 9 Arbeitsleben (Adj. with Nullartikel) · 10 Im Restaurant (dass) ·
11 Firmenporträt (reflexive Verben) · 12 Ernährung (wenn).

**A2.2** ([Inhalt](https://www.hueber.de/media/36/9783195019026_Inhalt.pdf)): 13 Sprachen lernen
(als) · 14 Post und Telekommunikation (Passiv Präsens) · 15 Medien (Verben mit Dat.+Akk.) · 16 Im
Hotel *Darf ich fragen, ob …?* (indirekte Fragen) · 17 Reisen und Verkehr (am/ans Meer) · 18 Wetter
und Klima (Verben mit Präp., worauf/darauf) · 19 Kulturelle Veranstaltungen (vom/aus dem) · 20
Bücher und Presse (Präteritum Modalverben) · 21 Staat und Verwaltung (welch-, dies-, lassen) · 22
Mobilität und Verkehr (bis, seit(dem)) · 23 Ausbildung und Beruf (Relativsatz Nom./Akk.) · 24
Arbeiten im Ausland (Präteritum).

**B1.1** ([Inhalt](https://www.hueber.de/media/36/978-3-19-301903-5_Inhalt.pdf)): 1 Freundschaft
(Adj. als Nomen, n-Deklination) · 2 Beruf und Arbeit (Präteritum; writing: Praktikumsbericht) · 3
Wohnen (Relativsätze Dativ/mit Präp.) · 4 Kundenservice *Obwohl ich Ihnen das erklärt habe…*
(obwohl, trotzdem; Reklamation) · 5 Zukunft (Futur I) · 6 Einladungen (falls) · 7 Beratung (zu +
Infinitiv) · 8 Berufsfindung (da, während, bevor) · 9 Gesundheit (Präsentation halten; Komparativ
attributiv) · 10 Verpasste Gelegenheiten *Hätte ich das bloß anders gemacht!* (Konjunktiv II
Vergangenheit) · 11 Glücksmomente (Plusquamperfekt, nachdem) · 12 Feiern im Betrieb (Genitiv, trotz).

**B1.2** ([Inhalt](https://www.hueber.de/media/36/978-3-19-501903-3_Inhalt.pdf)): 13 Sprache
(Missverständnisse; darum/deswegen/nämlich, wegen) · 14 Weiterbildung (Partizip I/II als Adjektiv)
· 15 Bewerbungen (nicht nur…sondern auch, sowohl…als auch) · 16 Jugend und Erinnerungen (brauchen +
zu) · 17 Biografien (Ausdrücke mit es) · 18 Politik und Gesellschaft *Davon halte ich nicht viel*
(weder…noch, entweder…oder) · 19 Tourismus *Je älter ich wurde, desto…* · 20 Regeln · 21 Konzerte
und Veranstaltungen (Passiv mit Modalverben) · 22 Geschichte (Passiv Perfekt/Präteritum) · 23 Umwelt
und Klima (anstatt/ohne … zu/dass) · 24 Zukunftsvisionen (damit, um…zu, als ob). The grammar for L19–21
(je…desto, Modalpartikeln, indem/sodass, innerhalb/außerhalb) is printed in one column block, so
which of the three gets which item is **(unverified)**.

**Praised:** the tight 4-page rhythm, a Lernziele box on every opening page, and the Modul-Plus
reading and film. **Criticised:** thin practice in the Kursbuch, so all practice lives in the AB.
Too little speaking per Lektion (unverified; teacher-forum claims were not opened).

### B2. Schritte plus Neu / Schritte international Neu (Hueber, 2016–18) — the Integrationskurs model

- **Split:** 6 volumes × 7 Lektionen (1 = A1.1, 2 = A1.2, 3 = A2.1, 4 = A2.2, 5 = B1.1, 6 = B1.2),
  numbered L1–7 and L8–14 per level. BAMF-approved for all volumes
  ([Hueber](https://www.hueber.de/reihe/schritte-plus-neu)).
- **Anatomy:** each Lektion is **12 KB pages**. For Bd.1 L1 the pages are KB 10–17 (8 pages), then
  Grammatik/Kommunikation/**Lernziele** on 18–19, then **Zwischendurch mal …** on 20–21
  ([Bd.1 Inhalt](https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010810_Inhalt.pdf)).
  The order is: **Foto-Hörgeschichte (Folge n)** → **A, B, C** (one structure each, each headed by a
  model sentence such as *"Ich heiße Lara Nowak."*) → **D, E** (Alltag skills: Formular,
  Telefongespräch, Wetterbericht) → overview + Lernziele → Zwischendurch mal (Film, Projekt, Lied,
  Spiel). The Arbeitsbuch adds **"Fokus Alltag / Fokus Beruf / Fokus Familie"** pages per Lektion,
  for example *Sich krankmelden*, *Informationen über Kinderbetreuung*, *Ein Bußgeldbescheid*,
  *Aufforderungen von Behörden*. AUDIO- and VIDEO-TRAINING drill the Redemittel.
- **Hours:** 100 UE per volume, about 14 UE per Lektion (BAMF module arithmetic; publisher SVP not
  opened, unverified).
- **Lektionen (verified):**
  - **Bd.1 A1.1:** 1 *Guten Tag. Mein Name ist …* · 2 *Meine Familie* · 3 *Einkaufen* · 4 *Meine
    Wohnung* · 5 *Mein Tag* · 6 *Freizeit* · 7 *Kinder und Schule*. Grammar: W-Frage/Aussage,
    ich/du/Sie, sein → mein/dein/Ihr, er/sie/wir → Nullartikel, ein/kein, Plural, möchte → er/es/sie,
    nicht → trennbare Verben, am/um/von → Akkusativ, ja/nein/doch → können/wollen, **Perfekt haben +
    sein already in L7**.
  - **Bd.2 A1.2** ([Inhalt](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/9783196010817_Inhalt.pdf)):
    8 *Beruf und Arbeit* · 9 *Ämter und Behörden* (*Sie müssen einen Antrag ausfüllen*, Imperativ) ·
    10 *Gesundheit und Krankheit* (sollen, Possessiv) · 11 *In der Stadt unterwegs* (mit + Dativ,
    Weg) · 12 *Kundenservice* (Konjunktiv II würde/könnte) · 13 *Neue Kleider* (welch-, Pron./Verben
    mit Dativ) · 14 *Feste* (Ordinalzahlen/Datum, Akk.-Pronomen, denn).
  - **Bd.3 A2.1** ([Inhalt](https://edit.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/978-3-19-301084-1_Inhalt.pdf)):
    1 *Ankommen* (weil; Perfekt of separable, inseparable and -ieren verbs) · 2 *Zu Hause*
    (Wechselpräpositionen, stellen/stehen) · 3 *Essen und Trinken* (einladen, Häufigkeit) · 4
    *Arbeitswelt* (wenn; sollte; Telefon am Arbeitsplatz) · 5 *Sport und Fitness* (reflexive Verben,
    Verben mit Präp., darauf) · 6 *Ausbildung und Karriere* (Präteritum Modalverben, dass,
    Schulsystem) · 7 *Feste und Geschenke* (Dativ + Akk., Pronomen).
  - **Bd.4 A2.2** ([Inhalt](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/9783196010831_Inhalt.pdf)):
    8 *Am Wochenende* · 9 *Meine Sachen* · 10 *Kommunikation* · 11 *Unterwegs* · 12 *Reisen* · 13
    *Auf der Bank* · 14 *Lebensstationen*. Grammar: Konjunktiv II wäre/hätte, trotzdem, deshalb, the
    full Adjektivdeklination (indefinite, definite, zero article), Komparation, Was für ein,
    woher/wo/wohin, lassen, and review of Perfekt/Präteritum/Konjunktiv II.
  - **Bd.5 B1.1:** Inhalt not retrieved. Titles **(unverified)**.
  - **Bd.6 B1.2** ([Inhalt](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/978-3-19-601085-5_Inhalt.pdf)):
    8 *Unter Kollegen* · 9 *Virtuelle Welt* · 10 *Werbung und Konsum* · 11 *Miteinander* · 12
    *Soziales Engagement* · 13 *Aus Politik und Geschichte* · 14 *Alte und neue Heimat*.

**Praised:** the photo story gives a continuing cast (Lara, Tim), the A–C "one step, one structure"
design, and exam tasks in the AB. **Criticised:** childish for university learners, and the
Integrationskurs topics (Amt, Kinderbetreuung) fit badly with DaF abroad (unverified; general teacher
consensus).

### B3. Netzwerk neu (Klett, 2019–21) — the "Clips + Plateau" model

- **Split:** 12 Kapitel per level (6 + 6 in the split editions), A1–B1. A **Plateau** after every
  3 Kapitel (09-12 memo, [Klett](https://www.klett-sprachen.de/netzwerk-neu/r-1/605)).
- **Anatomy:** the opener is a photo or collage; then skill-based double pages; "Porträt"/Landeskunde;
  and a "Das kann ich" self-check. Each Kapitel carries **one short clip**: a Redemittel-, Grammatik-
  or Phonetik-Clip. A1 examples: K1 *sich begrüßen*, K2 *bestimmter Artikel und Plural*, K9
  *Wechselpräpositionen mit Dativ*, K10 *Perfekt*, K12 *f, v, w*
  ([A1 clips](https://www.klett-sprachen.de/downloads/26407/netzwerk-neu-a1-uebersicht-clips-kapitel-1-12/pdf)).
  B1 examples: K2 *reklamieren/umtauschen*, K7 *Konfliktgespräche führen*, K9 *Stellung von nicht*,
  K10 *Passiv*, K11 *in einer Diskussion vermitteln*, K12 *Partizip als Adjektiv*
  ([B1 clips](https://www.klett-international.com/en/downloads/26409/netzwerk-5fneu-5fb1-5f-2d-5f-dcbersicht-5fclips-5f-2d-5fkapitel-5f1-2d12/pdf)).
  The protagonists have Instagram and Facebook profiles (snippet, Klett product page).
- **Kapitel (verified from the answer keys):**
  - **A1:** 1 *Guten Tag!* · 2 *Freunde, Kollegen und ich* · 3 *In Hamburg* · 4 *Guten Appetit!* ·
    5 *Alltag und Familie* · 6 *Zeit mit Freunden* · 7 *Arbeitsalltag* · 8 *Fit und gesund* · 9
    *Meine Wohnung* · 10 *Studium und Beruf* · 11 *Die Jacke gefällt mir!* · 12 *Ab in den Urlaub!*
    ([K1–6](https://www.thelanguageoffice.com/wp-content/uploads/2022/05/NWneu_A1_UeB_K1-6_loesungen.pdf),
    [K7–12](https://www.thelanguageoffice.com/wp-content/uploads/2022/05/NWneu_A1_KB_K7-12_loesungen.pdf))
  - **A2:** 1 *Und was machst du?* · 2 *Nach der Schulzeit* · 3 *Immer online?* · 4 *Große und
    kleine [Gefühle]* (last word unverified) · 5 *Leben in der Stadt* · 6 *Arbeitswelten* · 7 *Ganz
    schön mobil* · 8 *Gelernt ist gelernt!* · 9 *Sportlich, sportlich* · 10 *Zusammen leben* · 11
    *Wie die Zeit vergeht!* · 12 *Gute Unterhaltung!*
    ([K1–6](https://www.thelanguageoffice.com/wp-content/uploads/2022/08/NWneu_A2_KB_K1-6_loesungen.pdf),
    [K7–12](https://www.thelanguageoffice.com/wp-content/uploads/2022/08/NWneu_A2_KB_K7-12_loesungen.pdf))
  - **B1 (snippet):** 1 *Gute Reise!* · 2 *Das ist ja praktisch!* · 3 *Veränderungen* · 4
    *Arbeitswelt* · 5 *Umweltfreundlich?* · 6 *Blick nach vorn* · 7 *Zwischenmenschliches* · 8
    *Rund um Körper und Geist* · 9 *Kunststücke* · 10 *Miteinander* · 11 *Stadt, Land, Fluss* · 12
    *Geld regiert die Welt?*
- **Hours:** about 10 UE per Kapitel plus 4–5 UE per Plateau, per the Klett A2.1 lesson plan cited
  in the 09-12 memo ([plan](https://www.klett-international.com/en/downloads/31656/netzwerk-neu-a2-1-lesson-plan/pdf)).
  The PDF is image-only, so I could not re-verify it.
- **Praised:** young-adult register, the explicit Redemittel and phonetics clips, exam prep.
  **Criticised:** a steep pace for A1 (unverified).

### B4. Linie 1 / Die neue Linie 1 (Klett) — the Alltag + Beruf model

- **Split:** 16 Kapitel per level (8 + 8), with **Haltestellen** (review stations) every 4 Kapitel.
  The KB and ÜB are integrated; BAMF-approved (09-12 memo; Klett pages
  [Linie 1 A1](https://www.klett-sprachen.de/linie-1-a1/t-1/9783126070553)).
- **Distinctive:** every Kapitel ends with a **Beruf/Alltag page**, "Ich über mich" portfolio
  writing and a DTZ-format training block (unverified from primary PDF). Kapitel titles and UE are
  **(unverified)**: the answer-key PDF I downloaded yielded no clean headings, and the UE source in
  the older memo is Logo!, not Linie 1 (see the header correction).

### B5. Aspekte neu (Klett, 2014–17) — the Mittelstufe model

- **Split:** B1+, B2 and C1 with **10 Kapitel per level**, split 5 + 5
  ([Klett B1+ T1](https://www.klett-sprachen.de/aspekte-neu-b1-plus/t-1/9783126050180)).
- **Anatomy:** an **Auftaktdoppelseite** (a speaking prompt on the topic), then **Module 1–4**,
  each one text type plus one grammar point, then a **Porträt**, **Grammatik-Rückschau** and a
  **Film** page. B2 K1 runs: Auftakt *Heimat* → Neue Heimat → Ein Land, viele Sprachen →
  Missverständliches → Zu Hause in Deutschland → Porträt Fatih Akin → Film (snippet,
  [Klett B2](https://www.klett-sprachen.de/aspekte-neu-b2/t-1/9783126050258)). Klett also publishes
  a Lernfortschrittstest per Kapitel
  ([tests K1–10](https://www.klett-sprachen.de/download/7441/aspekte-neu_b2_test_k1-10_loesungen.pdf)).
- **Kapitel:**
  - **B1+ (snippet):** 1 *Leute heute* · 2 *Wohnwelten* · 3 *Wie geht's denn so?* · 4 *Viel
    Spaß!* · 5 *Alles will gelernt sein* · 6 *Berufsbilder* · 7 *Für immer und ewig* · 8 *Kaufen,
    kaufen, kaufen* · 9 *Endlich Urlaub* · 10 *Natürlich Natur!*
  - **B2 (verified,
    [AB Lösungen](https://www.klett-sprachen.de/download/7185/aspekte-neu-b2_ab_loesungen.pdf)):**
    1 *Heimat ist …* · 2 *Sprich mit mir!* · 3 *Arbeit ist das halbe Leben?* · 4 *Zusammen leben* ·
    5 *Wer Wissen schafft, …* (title truncated in the PDF) · 6 *Fit für …* · 7 *Kulturwelten* · 8
    *Das macht(e) Geschichte* · 9 *Mit viel Gefühl* · 10 *Ein Blick in die Zukunft*
- **Grammar per Kapitel:** not extracted. The B2 standard load (Nominalisierung, Passiv-Ersatz,
  Konnektoren, Partizipialattribute, Konjunktiv I for reported speech) is **(unverified per
  Kapitel)**.

### B6. Sicher! / Sicher! aktuell (Hueber) — the "Baukasten" Mittelstufe model

- **Split:** B1+, B2 and C1 with 12 Lektionen per level (B2.1 = L1–6, B2.2 = L7–12)
  ([shop](https://shop.hueber.de/de/sicher-akt-b2-1-kb-ab-lekt-1-6-978-3-19-641207-9.html)).
- **Anatomy (from the author's Konzeption,
  [PDF](https://hueber.pl/data/products/materials/1563797178_koncepcja.pdf)):** each Lektion is
  10–12 pages built from fixed **Bausteine**: Einstiegsseite (an ambiguous photo as a speaking
  prompt) → Hören → Sprechen → Lesen → Schreiben → Wortschatz → Sehen und Hören → Grammatik
  (inductive, summarised on the last page) → a **Lernwortschatz double page**. The order of the
  Bausteine **varies on purpose**. Each Lektion leans towards one area of **Alltag, Beruf, Studium or
  Ausbildung**. B1+ carries 80–120 UE, i.e. **10–15 UE per Lektion**. It is a Baukasten system:
  teachers may skip pages.
- **Sicher! B1+ Lektionen** (2012 edition,
  [Inhalt](https://www.hueber.de/media/36/sicher-B1-kursbuch-inhalt.pdf), L1–8 extracted): 1 *In
  Kontakt* (Adjektivdeklination) · 2 *Feste* (Modalpartikeln, Verben mit Präp.) · 3 *Unterwegs*
  (werden + Inf., Relativsätze) · 4 *Wohnen* (Nomen-Wortbildung, brauchen … zu) · 5
  *Berufseinstieg* (Konjunktiv II irreal, Finalsatz; Bewerbungsschreiben) · 6 *Musik*
  (Negationswörter, kausal/konzessiv) · 7 *Geld* (Passiv) · 8 *Lebenslang lernen* (Genitiv, Stellung
  von nicht).
- **Sicher! aktuell B2 (snippet):** L7 *Beziehungen*, L8 *Ernährung*, L9 *An der Uni*, L10
  *Service*, L11 *Gesundheit*, L12 *Sprache und Regionen*. The L1–6 titles are **(unverified)**.

### B7. Motive, DaF kompakt neu, studio, Das Leben, Momente, Begegnungen (fast-track and newer)

- **Motive (Hueber):** A1–B1 in **30 Lektionen**, with **3 double pages per Lektion** (a reading,
  a listening and a Landeskunde focus) and a compact grammar/Redemittel overview at the end
  ([Hueber shop](https://shop.hueber.de/de/motive-kb-a1-b1-lekt-1-30-978-3-19-001878-9.html)). The
  split A1 = L1–8, A2 = L9–18, B1 = L19–30 is **(unverified)**.
- **DaF kompakt neu (Klett):** A1–B1 in 29–30 Lektionen of **3 content double pages + 1 overview
  double page** (Wortschatz, Redemittel, Grammatik) (snippet,
  [Klett](https://www.klett-sprachen.de/daf-kompakt-neu-a1-b1/t-1/9783126763103)). Aimed at
  university intensive courses.
- **studio [21] / studio d (Cornelsen):** BAMF-approved with the "Intensivtraining" AB. Unit and
  Station structure **(unverified)**.
- **Das Leben (Cornelsen):** BAMF-approved A1–B1. Structure **(unverified)**.
- **Momente (Hueber):** the successor of Menschen, with 24 Lektionen per level (B1.2 AB covers
  "Lektionen 13–24",
  [Hueber](https://www.hueber.biz/media/36/Momente_B1_2_AB_Loesungen.pdf)). BAMF-approved with the
  DTZ AB.
- **Begegnungen (Schubert):** A1+–B1+, grammar-dense, BAMF intensive-only.

### B8. Frameworks

- **CEFR / GER + Companion Volume (2020):** the six levels, plus the CV's new scales for
  **mediation**, **online interaction** and **plurilingual/pluricultural competence**
  ([CoE CV](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4)).
  Netzwerk neu B1's clip *in einer Diskussion vermitteln* is mediation already in a Lehrwerk.
- **Profile Deutsch:** Kannbeschreibungen, Sprachhandlungen, Notionen, Themen and Textsorten per
  level ([GI](https://www.goethe.de/de/spr/sbp/prd.html), via the 09-12 memo). This is the backbone
  that Goethe Prüfungsziele and the Lehrwerke derive from.
- **BAMF Integrationskurs:** 600 UE Sprachkurs (6 modules × 100 UE; A1 = M1–2, A2 = M3–4,
  B1 = M5–6) + 100 UE Orientierungskurs, ending in the **DTZ** (A2/B1). The **Rahmencurriculum** is
  organised by **12 Handlungsfelder**: Ämter und Behörden, Arbeit, Arbeitssuche,
  Aus-/Weiterbildung, Banken/Versicherungen, Betreuung/Ausbildung der Kinder, Einkaufen, Gesundheit,
  Mediennutzung, Mobilität, Unterricht, Wohnen
  ([PDF](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/KonzepteLeitfaeden/rahmencurriculum-integrationskurs.pdf?__blob=publicationFile)).
  Approval requires books to "eine Ausgestaltung des Unterrichts im Sinne des Konzepts für einen
  bundesweiten Integrationskurs" (BAMF list, p.1). That is why Schritte, Linie 1 and Pluspunkt all
  carry Amt, Arzt and Bank Lektionen.
- **Berufssprachkurse (DeuFöV):** Basismodule towards B1, B2 and C1, plus Spezialmodule. Module
  sizes of 400–500 UE are **(unverified)**, and so is the existence of a separate Rahmencurriculum
  per module. Relevance for us: B2 learners in Germany are often in a B2 Berufssprachkurs, so B2
  content should include workplace scenarios (Besprechung, Beschwerde, Kundenkontakt).
- **Goethe-Institut course levels:** 8 half-levels A1.1–B2.2, then C1/C2. In Germany an
  Intensivkurs = **75 UE of 45 min over 15 days**, and "to reach A1 you normally need two
  Kompaktkurse ≈ 4 weeks" (snippet,
  [GI Intensiv](https://www.goethe.de/ins/de/de/m/kur/ang/dik.html),
  [Kompakt](https://www.goethe.de/ins/de/de/kur/ang/kom.html)). That is about 150 UE per CEFR level
  at A1. Exact UE per half-level at B levels is **(unverified)**.

### B9. Online and free curricula

(Most of the 09-12 memo figures are re-used with their sources; new checks are noted.)

- **DW Nicos Weg:** A1, A2 and B1 follow one protagonist. Counts conflict: DW's own overview says
  **76 Lektionen per level** (09-12 memo,
  [DW](https://learngerman.dw.com/de/nicos-weg/a-61693467)). A third party says "18 lessons, four
  tasks each, final test of 20 questions" (snippet,
  [lingoclub](https://www.lingoclub.com/nicos-weg/)), which probably counts chapters. Each lesson
  follows **can-do header → 2-min video → interactive exercises → Wortschatz → Grammatik →
  Landeskunde**, and each level ends with an Abschlusstest. Weakness: no productive feedback.
- **Goethe Deutsch Online A1:** 18 Kapitel × 2 Sequenzen, published per chapter as Themen,
  Sprachhandlungen, Wortschatz and Grammatik; tutors correct the writing
  ([PDF](https://lernen.goethe.de/deutschonline/A1/PDF/DE/deutschonline_Ihr_Kurs_im_U%CC%88berblick.pdf)).
- **Lingoda:** one half-level = **12 chapters × 4 lessons + orientation + level check = 50
  classes**. Each chapter runs Wortschatz → Kommunikation → Grammatik → "Check" class, and every
  lesson opens with one "I can…" line (09-12 memo).
- **Duolingo:** Sections → Units, labelled by CEFR. Units are ~30 lexemes, lessons 3–5 min.
  Criticised for inferred grammar and almost no free production (09-12 memo).
- **Babbel:** Newcomer/Beginner/Intermediate tracks of 10–15-min lessons with a Review Manager
  (SRS). The volume is uneven, with far fewer B1 lessons (09-12 memo).
- **Busuu:** CEFR chapters and a per-lesson objective, with community-corrected writing and
  speaking and a Checkpoint per chapter (09-12 memo).
- **Deutsch-Uni Online (DUO):** A1 = 14 Kapitel, up to 240 h, 800 self-correcting exercises and
  **26 tutor-marked Einsendeaufgaben**, with a stated Lernziel and minutes on every page (09-12 memo).

---

## C. Consensus topic sequence per half-level

Key: **M** = Menschen L#, **S** = Schritte plus Neu L#, **N** = Netzwerk neu K#, **Si** = Sicher!
B1+ L#, **As** = Aspekte neu (B1+ or B2) K#. "Split" marks disagreement. Grammar is the grammar the
books attach at that point.

### A1.1 (M 1–12, S 1–7, N 1–6)

| # | Situation / Handlungsfeld | Where | Grammar attached |
|---|---|---|---|
| 1 | Begrüßen, sich vorstellen, Herkunft, Sprachen | M1, S1, N1 | W-Fragen, sein, Konjugation Sg. |
| 2 | Angaben zur Person, Beruf, Zahlen, Formular | M2, S1-E, N2 | Pl.-Konjugation, nicht |
| 3 | Familie | M3, S2, N5 | Possessiv mein/dein, ja/nein/doch |
| 4 | Einkaufen: Lebensmittel (S) or Möbel/Preise (M) — **split** | M4–5, S3, N4 | Artikel def/indef, kein, Plural, möchte |
| 5 | Wohnung/Möbel (S4, N9 later; M in A1.2) — **split** | S4, M4/M14, N9 | er/es/sie, Adjektiv prädikativ |
| 6 | Büro, Technik, Telefon | M6 | Akkusativ |
| 7 | Tagesablauf, Uhrzeit, Wochentage | M8, S5, N5 | trennbare Verben, am/um, Verbposition |
| 8 | Freizeit, Hobbys, Verabredung | M7–8, S6, N6 | können, Satzklammer, Akkusativ |
| 9 | Essen & Trinken, Einladung | M9, N4 | mögen/möchte |
| 10 | Verkehrsmittel, unterwegs | M10, N3 (*In Hamburg*: Weg) | trennbare Verben |
| 11 | Vergangenes erzählen (Tag/Wochenende) | M11–12, S7 | **Perfekt haben + sein** — all three books put it at the end of A1.1 |
| 12 | Kinder/Schule (S7) or Feste (M12) — **split by audience** (DaZ vs DaF) | | |

### A1.2 (M 13–24, S 8–14, N 7–12)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Beruf & Arbeitsalltag | S8, N7 | Präteritum war/hatte (M19), Modalverben |
| 2 | Weg beschreiben, in der Stadt | M13, M15, S11 | lokale Präp. + Dativ, mit + Dativ |
| 3 | Wohnen, Wohnungsanzeige | M14, N9 | Possessiv sein/ihr, Wechselpräp. (N9 clip) |
| 4 | Ämter & Behörden, Termine | S9, M16 | müssen, Imperativ, temporale Präp. |
| 5 | Gesundheit, Arzt, Körper | M18, S10, N8 | Imperativ Sie, sollen |
| 6 | Pläne & Wünsche | M17 | wollen, mit/ohne |
| 7 | Kundenservice, höfliche Bitte | S12 | Konjunktiv II würde/könnte |
| 8 | Kleidung, Einkaufen, Vergleichen | M22, S13, N11 | welch-, Dativ-Verben (gefallen, passen), Komparation |
| 9 | Aussehen & Charakter | M19 | war/hatte, Perfekt untrennbar |
| 10 | Haushalt, Regeln | M20–21 | Imperativ du/ihr, dürfen/müssen |
| 11 | Wetter, Reisen/Urlaub | M23, N12 | denn |
| 12 | Feste, Datum, Einladung/Glückwunsch | M24, S14 | Ordinalzahlen, würde, denn |

**Split:** N10 *Studium und Beruf* (a university track) has no Schritte twin.

### A2.1 (M 1–12, S 1–7, N 1–6)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Ankommen, Familie, Biografie, Erlebnisse | M1, S1, N1 | Perfekt review, weil, Genitiv-s |
| 2 | Wohnen, Umzug, Nachbarn, Einrichtung | M2, S2 | **Wechselpräpositionen** (full consensus) |
| 3 | Schule, Ausbildung | N2, S6 (Schritte puts it later) | Präteritum Modalverben |
| 4 | Medien, online | N3 (M15 in A2.2) — **split** | dass, wenn |
| 5 | Einkaufen, Lebensmittel, Restaurant | M4, M10, S3 | Adjektivdeklination starts here (M4) |
| 6 | Tourismus, Stadtbesichtigung, Kultur | M3, M5–6, N5 | Adj. def., temporale Präp. |
| 7 | Arbeitswelt, Telefonat am Arbeitsplatz | M9, M11, S4, N6 | wenn, sollte, reflexive Verben |
| 8 | Sport, Fitness, Gesundheit | M7–8, S5 | Konjunktiv II Ratschlag, weil/deshalb, Verben mit Präp. |
| 9 | Gefühle | N4 | — |
| 10 | Feste & Geschenke | S7 | Dativ + Akkusativ, Pronomen |

### A2.2 (M 13–24, S 8–14, N 7–12)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Sprachen lernen, Lernen | M13, N8 | als (temporal) |
| 2 | Post, Kommunikation, Medien | M14–15, S10 | Passiv Präsens, Dat.+Akk. |
| 3 | Freizeit, Wochenende, Unterhaltung | S8, N12, M19 | Konjunktiv II wäre/hätte |
| 4 | Hotel, Reisen, Verkehr, Mobilität | M16–17, M22, S11–12, N7 | indirekte Fragen ob, Ortsangaben woher/wohin |
| 5 | Wetter & Klima | M18 | Verben mit Präp., Präpositionaladverbien |
| 6 | Sachen, Konsum, Bank/Vertrag | S9, S13 | Adjektivdeklination complete, lassen |
| 7 | Staat & Verwaltung, Dokumente | M21 | welch-, dies-, lassen |
| 8 | Ausbildung & Beruf, im Ausland arbeiten | M23–24 | **Relativsatz** (M23), Präteritum |
| 9 | Sport | N9 | — |
| 10 | Zusammenleben, Lebensstationen | N10–11, S14 | seit/bis, Präteritum review |

### B1.1 (M 1–12, N 1–6, S 1–7 unverified)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Freundschaft, Beziehungen, Kontakt | M1, Si1 | n-Deklination, Adj. als Nomen, Adjektivdekl. review |
| 2 | Reisen, unterwegs | N1, Si3 | Relativsätze, werden + Inf. |
| 3 | Beruf, Praktikum, Arbeitswelt | M2, N4, Si5 | **Präteritum** as the written narrative tense |
| 4 | Wohnen | M3, Si4 | Relativsatz mit Präp., brauchen … zu |
| 5 | Kundenservice, Reklamation | M4, N2 (clip) | **obwohl/trotzdem** |
| 6 | Zukunft, Technik | M5, N6 | Futur I |
| 7 | Einladungen, Feste | M6, M12, Si2 | falls, Genitiv, trotz |
| 8 | Beratung, Berufsfindung, Bewerbung | M7–8, Si5 | zu + Infinitiv, da/während/bevor, Konj. II irreal, Finalsatz |
| 9 | Gesundheit, Präsentation halten | M9 | Komparativ attributiv |
| 10 | Veränderungen, verpasste Chancen, Glück | M10–11, N3 | **Konjunktiv II Vergangenheit, Plusquamperfekt, nachdem** |
| 11 | Umwelt | N5 | Passiv (N10 clip) |

### B1.2 (M 13–24, N 7–12, S 8–14)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Sprache, Missverständnisse | M13 | darum/deswegen/nämlich, wegen |
| 2 | Weiterbildung, lebenslanges Lernen | M14, Si8 | Partizip als Adjektiv (N12 clip too) |
| 3 | Bewerbung, Kollegen, Konflikt | M15, S8, N7 | zweiteilige Konnektoren, Konfliktgespräch |
| 4 | Erinnerungen, Biografien | M16–17 | brauchen + zu, es-Ausdrücke |
| 5 | Medien, virtuelle Welt, Werbung, Konsum, Geld | S9–10, N12, Si7 | Passiv |
| 6 | Politik, Gesellschaft, Engagement, Miteinander | M18, S11–12, N10 | weder…noch, entweder…oder, Diskussion vermitteln (mediation) |
| 7 | Tourismus, Stadt/Land, Regeln | M19–20, N11 | je…desto, indem/sodass |
| 8 | Kultur, Kunst, Konzerte | M21, N9 | Passiv mit Modalverben |
| 9 | Geschichte | M22, S13 | Passiv Präteritum/Perfekt |
| 10 | Umwelt & Klima | M23 | anstatt/ohne … zu |
| 11 | Heimat, Zukunftsvisionen | M24, S14 | damit, um…zu, als ob |

### B2.1 (As B2 K1–5, Si aktuell B2 L1–6 unverified)

Only the Aspekte B2 titles are verified; the Sicher B2.1 titles are **(unverified)**.

| # | Situation | Where | Grammar (typical B2 load, per-Kapitel mapping unverified) |
|---|---|---|---|
| 1 | Heimat, Migration, Identität | As1 (Si B2 L1 reportedly *Heimat*, unverified) | Temporalsätze, Verben mit Präp. |
| 2 | Kommunikation, Gesprächsverhalten | As2 | Konnektoren, Infinitivsätze |
| 3 | Arbeit, Work-Life | As3 | Passiv & Passiversatz, Nominalisierung |
| 4 | Zusammenleben, WG, Nachbarschaft | As4 | Relativsätze advanced, Präpositionen + Genitiv |
| 5 | Wissenschaft, Forschung | As5 | Nominalstil, Partizipialattribut |

### B2.2 (As K6–10, Si aktuell L7–12 snippet)

| # | Situation | Where | Grammar |
|---|---|---|---|
| 1 | Beziehungen, Gefühle | Si7, As9 | Modalverben subjektiv, Konjunktiv II Gegenwart/Vergangenheit |
| 2 | Ernährung, Gesundheit, Fitness | Si8, Si11, As6 | Konzessiv/Konditional |
| 3 | Studium, An der Uni | Si9 | Nominal- ↔ Verbalstil |
| 4 | Service, Kundenkontakt | Si10 | indirekte Rede |
| 5 | Kultur, Kunst | As7 | Partizipialattribute |
| 6 | Geschichte | As8 | Konjunktiv I, Passiv review |
| 7 | Sprache und Regionen, Dialekte | Si12 | — |
| 8 | Zukunft, Technik | As10 | Futur II, Vermutung |

**Where consensus is strong:** greeting → person → family → shopping → time/daily routine → leisure →
food → transport → the past tense (Perfekt at the end of A1.1). Then Weg/Stadt → Wohnen →
Gesundheit/Arzt → Kleidung → Feste in A1.2. Wechselpräpositionen and the Perfekt review open A2.1.
Adjektivdeklination runs through A2. Relativsatz and Passiv Präsens come at the end of A2. Obwohl,
Konjunktiv II Vergangenheit and Plusquamperfekt come in B1.1, and zweiteilige Konnektoren and Passiv
Präteritum in B1.2.

**Where it splits:** (a) the **DaZ vs DaF audience**. Schritte and Linie 1 put Amt, Kinderbetreuung
and Bank early; Menschen and Netzwerk put Büro/Uni and Tourismus there. (b) **Wohnen** falls in
A1.1 (S4) or A1.2 (M14, N9). (c) **Medien**: A2.1 in Netzwerk, A2.2 in Menschen. (d) At B levels
the topics are interchangeable. Only the grammar order and the text types progress.

---

## D. Unit anatomy across the leaders, A1 → B2

| | Menschen A1–B1 | Schritte plus Neu | Netzwerk neu | Aspekte neu B1+–B2 | Sicher! B1+–C1 |
|---|---|---|---|---|---|
| Size | 4 pp ≈ 4 UE | 12 pp ≈ 14 UE | ≈10 UE | ≈12 pp (unverified) | 10–12 pp, 10–15 UE |
| Opener | photo/Hörszene + **Lernziele** | **Foto-Hörgeschichte** (serial) | photo collage | **Auftakt** double page | **Einstiegsseite** (ambiguous photo) |
| Core | double page with Bildlexikon | **A–C: one structure each** → D–E skills | skill double pages | **Module 1–4** (one text type each) | Hören/Sprechen/Lesen/Schreiben/Wortschatz Bausteine in varied order |
| Media | Film-Stationen per Modul | Film per Lektion | **Redemittel/Grammatik/Phonetik clip** + Film | Porträt + Film | Sehen und Hören |
| Close | Grammatik/Kommunikation box | Grammatik + Lernziele + **Selbstevaluation** | "Das kann ich" | Grammatik-Rückschau + test | Grammatik overview + **Lernwortschatz** |
| Review | **Modul-Plus** every 3 | **Zwischendurch mal**; Fokus Alltag/Beruf in AB | **Plateau** every 3 | Lernfortschrittstest per Kapitel | Lektionstest in AB |

**How it changes from A1 to B2:**

1. **The opener stops being a dialogue and becomes a prompt.** At A1 the Einstieg contains the
   target language (Hörszene, Foto-Hörgeschichte). At B1+/B2 it is an open speaking prompt
   (Sicher's ambiguous photo, Aspekte's Auftakt) that activates prior knowledge.
2. **The unit is organised by text type, not by structure.** Schritte A–C gives one structure per
   step. Aspekte gives one text per Modul, with grammar extracted from it (inductively) and
   summarised at the end.
3. **The skills rotate.** Sicher varies the Baustein order on purpose "um Spannung und Abwechslung
   aufrecht zu erhalten" (Konzeption), and each Lektion leans towards Alltag, Beruf, Studium or
   Ausbildung.
4. **Speaking moves from exchanges to discourse.** A1 speaking is sich vorstellen, bitten and
   verabreden. B1 adds a Präsentation halten (M9, M19), Stellung nehmen (M8), diskutieren (M18) and
   Konfliktgespräche (N7). B2 adds Diskussion vermitteln (mediation) and argumentieren.
5. **Writing moves from forms to argument.** The path runs Formular/SMS (A1) → E-Mail/Einladung
   (A2) → Bericht, Reklamation, Bewerbungsschreiben, Kommentar, Blog (B1: M2, M4, M10, M11, M15;
   Si5) → Diskussionsbeitrag and Forumsbeitrag (Si7, Si8) → formelle Beschwerde and Stellungnahme
   (B2).
6. **Vocabulary is made explicit.** Sicher adds a Lernwortschatz double page and Wörterbucharbeit
   (Si1), and B levels add Wortbildung (Nomen-Nachsilben, -los, un-) as its own strand.

---

## E. Steal list (for a self-paced online course with AI-graded speaking and writing)

1. **A Lernziele box on the first screen of every unit** (Menschen p1, Nicos Weg header, Lingoda "I
   can…"). The learner knows what "done" means, and our AI grader can grade against those can-dos.
2. **One structure per Lernschritt, each headed by a model sentence** (Schritte A–C: *"Ich heiße Lara
   Nowak."*). The model sentence is the rule, and it makes a perfect speaking-imitation target.
3. **A serial cast and story across the whole level** (Schritte Foto-Hörgeschichte, Nicos Weg).
   People return to find out what happens next, which is a retention hook that costs nothing to
   reuse.
4. **A short Redemittel, Grammatik or Phonetik clip per unit** (Netzwerk neu). A 60–90 s clip per
   unit fits self-paced study better than any textbook page.
5. **A dedicated phonetics micro-slot per unit** (Netzwerk clips: Umlaute, s/sch, f/v/w, Satzmelodie;
   Sicher's list: e/er, u-ü-i, tz/z, s-ss-ß, ch/sch). This maps directly onto our scored read-aloud.
6. **A review station every 3 units** (Modul-Plus, Plateau, Haltestelle). Our checkpoint cadence
   already matches, so keep it.
7. **Modul-Plus content types in the checkpoint:** a *Lesemagazin* (longer authentic-style
   reading), a *Film*, a *Projekt Landeskunde* (research a real place or person) and an *Ausklang*
   (song or poem). This turns review into reward instead of a second test.
8. **"Fokus Alltag / Fokus Beruf / Fokus Familie" side tracks** (Schritte AB): *sich krankmelden*,
   *Bußgeldbescheid*, *Kinderbetreuung finden*. Offer them as optional task cards per unit so one
   core serves DaZ learners in Germany and DaF learners abroad.
9. **Tag every unit with its BAMF Handlungsfeld.** This is audit-proof coverage for DTZ learners, and
   it makes "which of the 12 fields have we not taught" a query.
10. **A Lernwortschatz list per unit, bounded by the level's word list** (Sicher, Schritte LWS). An
    explicit, finite list feeds our SRS and our running "words vs Goethe Wortliste" counter.
11. **Selbstevaluation "Das kann ich" at unit end, then verified.** Every book asks for a self-rating.
    We can check the claim with one AI-graded task per can-do: self-assessment first, then proof.
12. **Exam task formats rehearsed inside the units, not only at the end** (Schritte AB, Menschen AB,
    labelled by exam Teil). Each unit's writing and speaking task should *be* a Goethe or DTZ task
    type.
13. **An Aktionsseiten-style information-gap speaking task** (Menschen pairwork pages). The AI plays
    partner B, which turns the book's best speaking device into something a solo learner can do.
14. **A Präsentation halten task at B1** (M9, M19; Goethe B1 Sprechen Teil 2). Record, get AI
    feedback on structure (Einleitung → Erfahrung → Vor-/Nachteile → Schluss), then do it again.
15. **Mediation tasks from B1** (Netzwerk *Diskussion vermitteln*; Companion Volume). Examples:
    summarise a German message for a friend, or relay between two positions. The AI grades these
    well, and no app does them.
16. **Inductive grammar at B levels: text first, rule extracted, then an overview page** (Sicher,
    Aspekte). Have the learner fill the rule table from the text before revealing it. It is cheap to
    build and effective.
17. **One text type per module at B levels** (Aspekte Module 1–4). This gives the B-level unit a
    clean skeleton (Kommentar, Forumsbeitrag, formelle E-Mail, Grafikbeschreibung), each matched to
    an exam writing part.
18. **An ambiguous-photo opener at B levels** (Sicher). A free-speaking warm-up of 60 s ("Was
    passiert hier?") that the AI can grade for fluency, not accuracy.
19. **A Porträt of a real German-speaking person or place per unit** (Aspekte Porträt, Menschen
    Projekt Landeskunde). It carries Landeskunde without a separate "culture" course. Cite sources
    so it is factual, not invented.
20. **A per-page Lernziel and minutes** (DUO). Show "≈8 min" on every step, because self-paced
    learners plan in minutes.
21. **Tutor-marked "Einsendeaufgaben" as the level spine** (DUO: 26 per A1; Goethe DO tutor
    e-mails). Replace the tutor with the AI grader, and keep the fixed, visible count ("12 of 26
    written tasks passed").
22. **Per-unit Redemittel boxes as the scaffold for production.** Every Lehrwerk's
    Kommunikation box ("Ich spreche sehr gut / gut / ein bisschen …") becomes the pre-submit
    checklist for AI-graded writing and speaking.

---

## F. Avoid list (what fails in self-paced online form)

1. **Pair and group work as the main speaking vehicle.** Most Lehrwerk speaking is "Fragen Sie Ihre
   Partnerin". Without the AI playing the partner, a solo learner never speaks.
2. **The KB/AB split.** Menschen's Kursbuch presents and the Arbeitsbuch practises, and online the
   AB half gets skipped. Integrate the practice into the step.
3. **Teacher-dependent "Baukasten" freedom** (Sicher lets the teacher skip pages). A self-paced
   learner cannot judge what is skippable, so we need one path and optional extras that are clearly
   marked as such.
4. **Topic-shaped B-level units that repeat A-level topics without new functions.** Wohnen, Feste and
   Gesundheit reappear at A1, A2, B1 and B2 in every series. Online, a repeated topic reads as
   "I did this already" unless the unit is framed by the new *function* (reklamieren, argumentieren,
   vermitteln).
5. **Long Foto-Hörgeschichten without a task.** Passive 5-min stories lose online learners, whereas
   Nicos Weg keeps clips at about 2 min. Every clip needs a task.
6. **Integrationskurs-only content as the core for everyone.** Kinderbetreuung and Bußgeldbescheid
   alienate DaF learners abroad, so put them in Fokus side tracks.
7. **Projects that need a group or the outside world** ("Machen Sie eine Umfrage im Kurs"). Convert
   them into solo research plus an AI-graded report, or drop them.
8. **Tests without diagnosis.** The AB Lektionstest gives a score. Online, a wrong answer has to route
   back to the exact step (our lesson checker already classifies errors).
9. **Too many pages per unit at A1.** A Schritte Lektion is 12 KB pages + AB ≈ 14 UE (≈10 h). That
   is too long for a self-paced "unit". Menschen's 4-page grain (≈3 h) is the right size.
10. **Vocabulary lists without spacing** (printed Lernwortschatz). Useless without SRS, which the
    apps (Babbel, Busuu) do and the books don't.
11. **Hidden syllabi.** Duolingo, Babbel and Busuu don't publish unit lists. Every book does, as an
    Inhaltsverzeichnis, and teachers judge a course by it. Publish ours.
12. **Translation-heavy, production-light drills** (Duolingo). Recognition passes do not become
    speaking.

---

## G. Implications for our blueprint

1. **Keep 12 Lektionen per half-level with a checkpoint every 3.** This is Menschen's grain (12 per
   Teilband, a Modul-Plus every 3), Lingoda's 12 chapters, and Netzwerk's Plateau-every-3 cadence.
   Target ≈3–4 h per Lektion, ≈45–50 h per half-level (Menschen ≈48 UE per Teilband; Goethe ≈75 UE
   per 3-week block).
2. **Sequence A1.1–B1.2 by the consensus tables in §C, not by our own intuition.** Where the books
   split, choose explicitly and record the reason. Proposal: DaF-neutral core topics, with the DaZ
   Handlungsfelder (Amt, Kinderbetreuung, Bank) as Fokus side tasks in the same Lektion.
3. **Lock the grammar milestones to consensus positions:**
   - Perfekt at the end of A1.1.
   - Dativ, Imperativ and Modalverben in A1.2.
   - Wechselpräpositionen at the start of A2.1, and Adjektivdeklination across A2.
   - Relativsatz and Passiv Präsens at the end of A2.2.
   - Obwohl, Konjunktiv II Vergangenheit, Plusquamperfekt and Präteritum as the narrative tense in
     B1.1.
   - Zweiteilige Konnektoren, Passiv Präteritum/Perfekt and Partizip-Adjektiv in B1.2.
   - B2: Nominalstil, Passiversatz, Konjunktiv I and Partizipialattribute.

   Anything moved earlier than the books needs a written justification.
4. **Give A-level Lektionen a fixed skeleton:** Lernziele → serial scene (≤2 min) → 2–3 Lernschritte,
   one structure each with a model sentence → Hören/Lesen → one AI-graded Schreiben + one Sprechen in
   exam format → a phonetics micro-slot → Redemittel/Grammatik overview → "Das kann ich" + proof task
   → Lernwortschatz into SRS. This is the Schritte/Menschen union, and it fits our 9-stage player.
5. **Give B-level Lektionen a different skeleton:** a photo/question opener (free speaking) → 3–4
   modules, **each one text type** with inductive grammar → a Porträt/Landeskunde text → one
   discourse task (Präsentation, Diskussion, Mediation) → a Grammatik-Rückschau. Do not reuse the A
   skeleton at B1.2+.
6. **Build the checkpoint as a Modul-Plus:** Lesemagazin (a long read), a film/scene, a
   Landeskunde mini-project (solo, AI-graded report), a review test mapped back to steps, and one
   full exam-format task.
7. **Publish the Inhaltsverzeichnis per half-level** (Nr · Titel · Handlungsfeld · Kann-Beschreibungen ·
   Grammatik · Textsorte · Prüfungsteil · minutes), the way Hueber and Klett do. It is the trust
   signal teachers and learners look for, and no app offers it.
8. **Tag every Lektion with a BAMF Handlungsfeld, CEFR scale(s) including Companion-Volume
   mediation from B1, the exam Teil rehearsed, and its word-list slice.** A validator can then prove
   coverage.
9. **The writing ladder per half-level:** A1.1 Formular/Steckbrief → A1.2 SMS/Einladung/Absage →
   A2 E-Mail with 3 Leitpunkte → B1.1 Bericht/Reklamation/Bewerbung → B1.2 Forumsbeitrag/Kommentar →
   B2 formelle Beschwerde/Stellungnahme/Grafikbeschreibung. One AI-graded task per Lektion, and a
   visible total like DUO's "26 Einsendeaufgaben".
10. **The speaking ladder:** A1 vorstellen/bitten → A2 gemeinsam planen (Goethe A2 T3) → B1
    Präsentation + gemeinsam planen → B2 Diskussion/Stellung nehmen + vermitteln. Use Menschen's
    Aktionsseiten-style info-gap tasks with the AI as partner B.
11. **One continuing cast per level** (Nicos Weg, Schritte), with clips capped at about 2 min and a
    task on every clip.
12. **A1.1 as rebuilt (12 situational Lektionen) already matches the Menschen/Schritte consensus
    order.** When A1.2 reopens, check its draft against the §C A1.2 table before any content round.
13. **Treat everything marked (unverified) or (snippet) as unconfirmed.** Before a blueprint relies
    on it, open the Inhalt PDF: Schritte 5, Sicher aktuell B2.1, Linie 1, Das Leben, studio [21] and
    the Motive split. The Hueber/Klett PDFs download with a browser User-Agent, while WebFetch gets
    403.
