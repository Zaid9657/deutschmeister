# 04: Can-do inventory A1–A2, split into A1.1 / A1.2 / A2.1 / A2.2

**Date:** 2026-09-26 · **Scope:** communicative can-dos (Kann-Beschreibungen) for A1 and A2, drawn from the CEFR Companion Volume 2020, the Goethe Prüfungsziele A1/A2, Profile deutsch and the BAMF Rahmencurriculum, and assigned to four half-levels. · **Status:** research memo, input to the course-v2 blueprint. Exam formats are covered in `01-exams-a1-a2.md` and are not repeated here.

## Method

I downloaded every primary document below and converted it to text with `pdfminer`.

- **BAMF Rahmencurriculum (RC).** The RC prints its Lernziele in a four-column table: goal, activity, level, Landeskunde. Plain text extraction separates each goal from its level, so I parsed the PDF by coordinates and paired each level cell with the goal on the same line.
- **Check on the parse.** I checked the parse against the RC's own statistics (Anhang 2). All 12 Handlungsfelder match. The overall result is 437 Lernziele: A1 104 (23.80 %), A2 233 (53.32 %), B1 100 (22.88 %), which reproduces the published percentages exactly.
- **CEFR Companion Volume.** The English original on `rm.coe.int` returns 403, both through curl and through WebFetch. I used the official German edition (Begleitband, Klett/Goethe-Institut 2020, translated by Quetz/Camerer) instead. Its annexes are free downloads. The self-assessment grid in Anhang 2 is printed as rotated text, and I rebuilt its A1/A2 cells line by line.
- **Goethe A2.** The adult Prüfungsziele/Testbeschreibung for A2 exists only as a Hueber book, and I could read only its chapter-1 sample. For the A2 Kannbeschreibungen I used the Goethe **Fit in Deutsch 2** Prüfungsziele (August 2013). The Hueber sample says the Goethe-Zertifikat A2 replaced both Fit in Deutsch 2 and Start Deutsch 2 in 2016 and is "formal und im sprachlichen Schwierigkeitsgrad gleich" for adults and teenagers.
- **Profile deutsch.** It is a book plus CD-ROM with no open online version. I used its A1/A2 qualitative Kannbeschreibungen as reprinted in RC Anhang 1, and the page citations quoted in the ÖIF curriculum.
- **Textbooks.** I read the Hueber tables of contents only to check how publishers split a level.
- **Tools not used.** I did not use Firecrawl or DataForSEO. I made no database reads.

**Source tags used below.** Each tag gives the source, the printed page, and the level that source assigns. For example, `RC 124·A1` means Rahmencurriculum p. 124, level A1 per the RC.

| Tag | Document |
|---|---|
| `RC` | BAMF / Goethe-Institut, *Rahmencurriculum für Integrationskurse DaZ*, 2016 revision. The Handlungsfelder are on pp. 75–157. The cross-cutting areas run A pp. 29–38, B 39–46, C 47–52, D 53–60, E 61–74. |
| `GI-A1` | Goethe-Zertifikat A1: Start Deutsch 1, Prüfungsziele/Testbeschreibung, 4th updated ed. © 2022. Kannbeschreibungen pp. 14–17. |
| `GI-A2F` | Goethe-Zertifikat A2 Fit in Deutsch 2, Prüfungsziele/Testbeschreibung, as of Aug 2013. Kannbeschreibungen pp. 15–17. |
| `GER-R` | GER Begleitband, Anhang 2 *Raster zur Selbstbeurteilung (erweitert durch Online-Interaktion und Mediation)*, pp. 3–7. The ich-Form is the original wording. |
| `GER-M` | GER Begleitband, Anhang 1 *Zentrale Merkmale der GeR-Niveaus*, p. 3 |
| `GER-E` | GER Begleitband, Anhang 8 *Ergänzende Deskriptoren* |
| `GI-HB` | Goethe-Institut, *Anbindung des Sprachunterrichts an den GER: Ein Handbuch*, April 2022 |
| `PD/RC` | Profile deutsch qualitative Kannbeschreibungen, as reprinted in RC Anhang 1, pp. 158–162 |
| `ÖIF` | ÖIF, *Rahmencurriculum für A1-Kurse mit Werte- und Orientierungswissen* |

**Rule for converting to the ich-Form.** The RC and Goethe write in the third person ("Kann sich … vorstellen"). I changed only the person: *sich → mich*, *seine/ihre → meine*, *er/sie → ich*. I also shortened "z. B." example lists. Otherwise the wording is the source's.

## Findings

**F1. No official half-levels exist, and the CEFR gives an anchor only at A2.**
- The Companion Volume adds a Pre-A1 band (Anhang 8 has "vor A1" rows).
- It keeps the plus levels "A2+, B1+, B2+" [GI-HB, section on standardisation]. There is **no A1+**.
- It characterises A2+ as "eine starke Variante der Performanz auf der Ebene von Waystage": more active participation in conversation (begin, keep going and end a conversation; manage routine exchanges; exchange ideas on familiar topics with help) and better sustained monologue (plans and arrangements, habits, past activities, describing and comparing things) [GER-M p. 3].
- A2.1 = A2 and A2.2 = A2+ is therefore a principled split.
- A1.1/A1.2 needs another criterion. This memo uses (a) how much interlocutor support is assumed (F3), and (b) the order of domains, from the private sphere to public transactions (F4).

**F2. The RC is the only level-tagged, situation-organised can-do pool for German, and it prescribes situational progression.**
- It has 12 Handlungsfelder plus five cross-cutting areas: A Migrationssituation, B Gefühle/Haltungen/Meinungen, C Dissens/Konflikte, D Soziale Kontakte, E Eigenes Sprachenlernen.
- Each goal sits at "der niedrigsten Stufe …, auf der sie sinnvoll umgesetzt werden können", which is why "rund 50 % der Lernziele in A2" sit there [RC §6.2, p. 24].
- The RC tags only A1/A2/B1. Ordering *within* a level "sollte nicht vorrangig nach einer morpho-syntaktischen Progression vorgenommen werden, sondern sich an Handlungsketten in den Handlungsfeldern orientieren" [RC §6.3, p. 25].
- Goal counts from my parse (Handlungsfelder 1–12 match Anhang 2; the A–E counts are mine):

| Area | A1 | A2 | B1 | Area | A1 | A2 | B1 |
|---|---|---|---|---|---|---|---|
| A Migrationssituation | 15 | 22 | 20 | 5 Banken/Versicherungen | 10 | 11 | 5 |
| B Gefühle/Meinungen | 4 | 14 | 10 | 6 Kinder (Kita/Schule) | 7 | 30 | 6 |
| C Dissens/Konflikte | 4 | 9 | 3 | 7 Einkaufen | 7 | 11 | 5 |
| D Soziale Kontakte | **27** | 13 | 6 | 8 Gesundheit | 13 | 21 | 8 |
| E Sprachenlernen (strategies) | 31 | 31 | 8 | 9 Mediennutzung | 7 | 10 | 3 |
| 1 Ämter/Behörden | 7 | 11 | 3 | 10 Mobilität | 8 | 21 | 3 |
| 2 Arbeit | 15 | **47** | 29 | 11 Unterricht | **15** | 11 | 1 |
| 3 Arbeitssuche | 4 | 29 | 21 | 12 Wohnen | 11 | 21 | 6 |
| 4 Aus-/Weiterbildung | 0 | 10 | 10 | **Total** | **185** | **322** | 147 |

What the counts show:
- A1 lives in social contact, the classroom, shopping, health, housing, banking and mobility.
- Job search and further education are almost absent at A1. Work, job search and children dominate A2.
- The pool is ample. Even without E, there are 154 communicative A1 goals and 291 at A2.
- The existing memo `docs/research/research-curricula-2026-09-12.md` lists only "12 Handlungsfelder". That misses areas A–E, which hold 81 of the 185 A1 goals, D alone 27.

**F3. A1 goals are A1 only with a cooperative partner.**
- RC Anhang 1 warns that "Kann am Informationsschalter gezielt Auskünfte erfragen" looks impossible at A1.
- It becomes A1 once the Profile deutsch condition is added: "wenn der Partner langsam und klar in Standardsprache spricht, zu langsameren Wiederholungen und Umformulierungen bereit ist und jederzeit beim Formulieren hilft" [PD/RC p. 158].
- Profile deutsch describes A1 output as "kurze, unverbundene und meist vorgefertigte Äußerungen" joined with "und", "oder", "und dann" [PD/RC p. 159].
- At A2 the description becomes: "kann Elemente von gelernten Ausdrücken … neu kombinieren", joined with "und", "aber", "weil", sequenced with "zuerst … zum Schluss", "mit elementaren systematischen Fehlern", "aber in der Regel … klar" [PD/RC p. 161].

**F4. Published splits of A1 put identity first and public transactions second.**
- The ÖIF example cuts A1 into **three modules of 60 UE** [ÖIF pp. 10–12]:
  - A1.1: identity data, spelling, family, greetings, flat, numbers.
  - A1.2: doctor, shopping and food, free time, clock time and appointments, transport, work, directions.
  - A1.3: authorities, clothes, describing people, past events, weather, living together.
- Hueber's *Schritte plus Neu 1* runs Guten Tag · Familie · Einkaufen · Wohnung · Mein Tag · Freizeit · Kinder und Schule. *Schritte plus Neu 3* (A2.1) runs Ankommen · Zu Hause · Essen und Trinken · Arbeitswelt · Sport und Fitness · Schule und Ausbildung · Feste und Geschenke. Each volume has 7 Lektionen.
- The BAMF course is 600 UE of language to B1 in six modules of 100 UE [BAMF overview]. That overview does not say which level each module reaches.

**F5. The sources disagree at the level boundaries.**
- Goethe places "konkrete, voraussagbare Informationen in einfachen Alltagstexten auffinden, z. B. in Anzeigen, Prospekten, Speisekarten … Fahrplänen" at **A1** [GI-A1 p. 16]. The CEFR self-assessment grid places the same can-do at **A2** [GER-R p. 3].
- The RC places restaurant ordering and telephone reservations at A2 [RC 125·A2]. Goethe A1 Sprechen Teil 3 tests requests ("jemanden um etwas bitten") at A1.
- Goethe A1 already expects past time references ("letzten Freitag") [GI-A1 p. 15].
- The blueprint needs a precedence rule (see Implication 3).

**F6. The CV 2020 adds can-dos for online interaction and mediation at A1/A2, already written in ich-Form** [GER-R pp. 5–7]. Online interaction fits an online course naturally. The one pre-A1 descriptor is also an online one: greeting and saying goodbye online [GER-E; also quoted in the Goethe BOTO curriculum].

**F7. Two provenance claims in the existing repo docs are wrong.**
- `research-curricula-2026-09-12.md` cites "BAMF Rahmencurriculum (2022 rev.)". The PDF behind the cited BAMF URL is the **2016 revision** (PDF created December 2016), and I found no later edition.
- The same file cites "Goethe Prüfungsziele SD1 (2016)". The current edition is the **4th, © 2022**.

## Inventory: 14 situations per half-level

Each situation is a candidate Lektion. The arrow notes which exam part it rehearses (see memo 01).

### A1.1: Kontakt und Person (pre-A1 to A1, with maximum support)

1. **Begrüßen und verabschieden**
   - Ich kann jemanden angemessen begrüßen und auf einen Gruß reagieren. `RC 54·A1`
   - Ich kann mich angemessen verabschieden und ein Gespräch einfach und höflich beenden. `RC 55–56·A1`
   - Ich kann online einfache soziale Kontakte herstellen, indem ich einfachste Begrüßungs- und Abschiedsformeln benutze. `GER-E·vor A1`
2. **Mich vorstellen** (→ Goethe A1 Sprechen 1)
   - Ich kann mich mit einfachen Worten vorstellen. `RC 54·A1`
   - Ich kann sagen, welche Sprachen ich spreche. `RC 36·A1`
   - Ich kann sagen, was ich beruflich tue und wo ich wohne. `GI-A1 15`
3. **Andere kennenlernen** (→ Sprechen 2)
   - Ich kann Fragen zur Person stellen – z. B. zum Wohnort, zu Bekannten, zu Dingen, die man besitzt – und auf entsprechende Fragen antworten. `GI-A1 15`
   - Ich kann jemanden vorstellen und höflich reagieren, wenn ich vorgestellt werde. `RC 54·A1`
   - Ich kann jemanden fragen, wie es ihm geht, und auf die Frage nach meinem Befinden reagieren. `RC 56·A1`
4. **Buchstabieren, Zahlen, Kontaktdaten** (→ Sprechen 1)
   - Ich kann buchstabierte Wörter, insbesondere Namen oder Adressen, verstehen. `PD/RC 159·A1`
   - Ich komme mit Zahlen, Mengenangaben, Preisen und Uhrzeiten zurecht. `GI-A1 15`
   - Ich kann eine ganz einfache Mitteilung schreiben und darin Name und Erreichbarkeit per Telefon bzw. E-Mail angeben. `RC 98·A1`
5. **Wie bitte? Verständigung sichern**
   - Ich kann nachfragen, wenn ich etwas nicht verstanden habe, und mit einfachen Worten um Wiederholung bitten. `RC 35·A1`
   - Ich kann Gesprächspartner mit einfachen Worten darum bitten, langsamer zu sprechen. `RC 35·A1`
   - Ich kann sagen, dass ich nicht weiß, wie etwas auf Deutsch heißt, und mir mit Zeigen, Pantomime oder Zeichnen helfen. `RC 34, 68·A1`
6. **Familie und Menschen**
   - Ich kann einfache Wendungen und Sätze gebrauchen, um Leute, die ich kenne, zu beschreiben. `GER-R·A1`
   - Ich kann mit ganz einfachen Mitteln über mich und meine Situation im Herkunftsland sprechen, z. B. über die Familie, den erlernten Beruf. `RC 30·A1`
   - Ich kann einfache Wendungen und Sätze über mich selbst und andere schreiben: wo sie leben und was sie tun. `GI-A1 16`
7. **Formulare** (→ Schreiben 1)
   - Ich kann in Formulare persönliche Daten wie Name, Nationalität, Alter, Geburtsdatum eintragen. `GI-A1 16`, `RC 76·A1`
   - Ich kann mit einfachen Worten auf einfache Fragen nach meinen persönlichen Daten antworten. `RC 77·A1`
8. **Einkaufen: Lebensmittel und Preise** (→ Sprechen 3, Hören 1)
   - Ich kann grundlegende, einfache Informationen zu Produkten erfragen bzw. geben, z. B. Preise, Größen, Regal, Abteilung. `RC 124·A1`
   - Ich kann gut verständlich Zahlenangaben machen, z. B. Preise wiederholen. `RC 124·A1`
   - Ich kann jemanden um etwas bitten und jemandem etwas geben. `GI-A1 15`
   - Ich kann Werbeanzeigen in Prospekten relevante Informationen entnehmen, z. B. Preise. `RC 138·A1`
9. **Essen, Trinken, Vorlieben**
   - Ich kann mit einfachen Worten über Vorlieben und Abneigungen kommunizieren, z. B. über Essen und Getränke. `RC 42·A1`
   - Ich kann jemanden ansprechen und mit einfachen Worten um konkrete, alltägliche Dinge bitten. `RC 55·A1`
   - Ich kann das Wesentliche aus Produktinformationen entnehmen, z. B. das Haltbarkeitsdatum. `RC 124·A1`
10. **Meine Wohnung**
    - Ich kann einfache Wendungen und Sätze gebrauchen, um zu beschreiben, wo ich wohne. `GER-R·A1`
    - Ich kann eine Wohnung und die Einrichtung beschreiben. `ÖIF 5`
    - Ich kann mich bei den anderen Hausbewohnern als neuer Mieter vorstellen. `RC 157·A1`
11. **Uhrzeit und mein Tag**
    - Ich kann Zeitangaben machen mit Wendungen wie „nächste Woche", „letzten Freitag", „im November", „um drei Uhr". `GI-A1 15`
    - Ich kann nach der Uhrzeit fragen und antworten und einen einfachen Tagesablauf beschreiben. `ÖIF 6`
12. **Freizeit und Verabredungen**
    - Ich kann Freunde fragen, ob sie Zeit haben, gemeinsam etwas zu unternehmen. `RC 57·A1`
    - Ich kann sagen, ob ich zu einem Termin Zeit habe oder dass ich keine Zeit habe. `RC 57–58·A1`
    - Ich kann mit einfachen Worten Gefallen und Missfallen ausdrücken, z. B. welche Musik ich gerne höre. `RC 41·A1`
13. **Im Kurs lernen**
    - Ich kann einfache mündliche und schriftliche Arbeitsanweisungen verstehen. `RC 148·A1`
    - Ich kann mit einfachen Worten nachfragen, ob ein Wort oder eine Formulierung richtig ist. `RC 62·A1`
    - Ich kann mir ein persönliches Glossar anlegen und Wörter nach Themen ordnen. `RC 64·A1`
14. **Schilder, Karten, kurze Nachrichten** (→ Lesen 1, 3)
    - Ich kann einzelne vertraute Namen, Wörter und ganz einfache Sätze verstehen, z. B. auf Schildern, Plakaten oder in Katalogen. `GER-R·A1`
    - Ich kann sehr kurze und einfache Mitteilungen (z. B. Postkarten, E-Mails) verstehen. `GI-A1 16`
    - Ich kann kurze, einfache Online-Grüße posten mit Aussagen darüber, was ich getan habe und wie es mir gefallen hat. `GER-R·A1`

### A1.2: Den Alltag organisieren (A1, transactions in public space)

1. **Termine machen**
   - Ich kann in einfacher Form einen Terminvorschlag machen und auf einen Terminvorschlag reagieren. `RC 85·A1`
   - Ich kann einen Termin bei Ärzten ausmachen. `ÖIF 5`
   - Ich kann Anweisungen verstehen, die langsam und deutlich an mich gerichtet werden. `GI-A1 16`
2. **Beim Arzt**
   - Ich kann bei der Anmeldung beim Arzt Auskünfte zur Person geben, z. B. Name, Adresse, Versicherung, Grund des Besuchs. `RC 131·A1`
   - Ich kann mitteilen, wie es mir geht, und – auch mit Gesten – beschreiben, was mir wehtut. `RC 131·A1`
   - Ich kann im Gespräch mit Ärzten Körperteile benennen. `RC 131·A1`
3. **Apotheke und Medikamente**
   - Ich kann die wichtigsten Informationen auf Beipackzetteln verstehen, z. B. Einnahmezeiten und -mengen. `RC 131·A1`
   - Ich kann einfache Anweisungen von Ärzten oder Apothekern zur Medikamenteneinnahme verstehen. `RC 131·A1`
   - Ich kann mit einfachen Worten Empfehlungen und Adressen von Ärzten in der Nähe erfragen. `RC 130·A1`
4. **Krankmelden und entschuldigen** (→ Schreiben 2)
   - Ich kann mich mit einfachen Worten telefonisch und schriftlich krankmelden. `RC 84, 149·A1`
   - Ich kann mich für Zuspätkommen oder früheres Gehen unter Angabe von Gründen entschuldigen. `RC 149·A1`
   - Ich kann in kurzen Mitteilungen Informationen aus dem alltäglichen Leben erfragen oder weitergeben. `GI-A1 16`
5. **Notfall**
   - Ich kann telefonisch einen Notruf tätigen und die wichtigsten Informationen nennen, z. B. Ort, Zahl der Verletzten. `RC 132·A1`
   - Ich kann einfache mündliche Warnungen verstehen und andere zur Vorsicht auffordern. `RC 84·A1`
6. **Nach dem Weg fragen**
   - Ich kann Passanten nach dem Weg fragen und das Wesentliche einer Wegbeschreibung verstehen. `RC 145·A1`
   - Ich kann kurzen, einfachen mündlichen und schriftlichen Wegerklärungen folgen. `GI-A1 15–16`
7. **Bahn, Bus, Fahrkarten** (→ Hören 2)
   - Ich kann Fahrplänen relevante Informationen entnehmen, z. B. Abfahrtszeiten, Orte. `RC 142·A1`
   - Ich kann am Schalter Informationen erfragen und geben, die im Wesentlichen auf Zahlen basieren, z. B. Abfahrtszeiten, Preise. `RC 143·A1`
   - Ich kann das Wesentliche von Anleitungen an Fahrkartenautomaten verstehen, wenn sie illustriert sind. `RC 144·A1`
   - Ich kann Mitreisende fragen, ob ein Platz frei ist, und auf eine solche Frage reagieren. `RC 145·A1`
8. **Kleidung kaufen**
   - Ich kann ein einfaches Verkaufsgespräch führen. `ÖIF 5`
   - Ich kann mit einfachen Worten fragen, ob es bei einer Ware einen Preisnachlass gibt. `RC 124·A1`
   - Ich kann mit sehr einfachen Worten ein Kompliment aussprechen, z. B. dass ein Kleidungsstück jemandem steht. `RC 58·A1`
9. **Online bestellen, Bank, Automaten**
   - Ich kann, auch im Internet, Bestellungen aufgeben und in Bestellformulare Größe, Zahl der Produkte und Lieferadresse eingeben. `RC 125·A1`
   - Ich kann bei Geldautomaten die einfachsten Anweisungen verstehen und die erforderlichen Daten eingeben. `RC 110·A1`
   - Ich kann wichtige Formulare im Zahlungsverkehr ausfüllen, z. B. Überweisungen. `RC 111·A1`
10. **Auf dem Amt**
    - Ich kann am Informationsschalter gezielt Auskünfte erfragen, z. B. den richtigen Ansprechpartner. `RC 77·A1`
    - Ich kann einfache Wegweiser im Eingangsbereich von Behörden verstehen. `RC 77·A1`
    - Ich kann Sachbearbeiter um Hilfe beim Ausfüllen eines Formulars bitten. `RC 77·A1`
    - Ich kann dem Internet Adressen und Öffnungszeiten von Behörden entnehmen. `RC 76·A1`
11. **Arbeit und Beruf**
    - Ich kann mitteilen, was ich besonders gut oder gerne tue, z. B. Elektrogeräte reparieren. `RC 95·A1`
    - Ich kann das Wesentliche ganz einfacher, vertrauter Arbeitsaufträge verstehen und mitteilen, dass ich einen Auftrag verstanden habe. `RC 83·A1`
    - Ich kann Dienstpläne verstehen und einfache Stundenzettel ausfüllen. `RC 88·A1`
    - Ich kann die wichtigsten Informationen von Stellenanzeigen verstehen, z. B. den gesuchten Beruf. `RC 98·A1`
12. **Im Haus, mit den Nachbarn**
    - Ich kann die wichtigsten Informationen der Hausordnung verstehen, z. B. Ruhezeiten, Müllentsorgung. `RC 156·A1`
    - Ich kann Nachbarn mit einfachen Worten um Hilfe bitten, z. B. ein Paket anzunehmen. `RC 157·A1`
    - Ich kann, auch telefonisch, einfache Mitteilungen des Vermieters verstehen, z. B. wann der Heizungsableser kommt. `RC 156·A1`
13. **Feste und Glückwünsche**
    - Ich kann jemandem gratulieren, auch in einer E-Mail oder Postkarte. `RC 59·A1`
    - Ich kann gute Wünsche aussprechen und mich für Glückwünsche bedanken. `RC 59·A1`
    - Ich kann Bekannten das Du anbieten und reagieren, wenn man mir das Du anbietet. `RC 55·A1`
14. **Wochenende, Wetter, Veranstaltungen**
    - Ich kann über Vergangenes (A1-Niveau) und über das Wetter sprechen. `ÖIF 5–6`
    - Ich kann Ankündigungen für Veranstaltungen wesentliche Informationen entnehmen, z. B. Beginn, Ort. `RC 138·A1`
    - Ich kann einfache Menüpunkte im Handy verstehen und einfache Anweisungen im Internet befolgen. `RC 139·A1`

*Reserve A1 goals:* for parents, report a child's illness orally and fill in return slips on school letters (`RC 117·A1`). For work, take part in shift-plan agreements (`RC 85·A1`).

### A2.1: Kontakte pflegen, Dinge erledigen (A2, "Waystage")

1. **Über mich erzählen, Smalltalk** (→ Goethe A2 Sprechen 1)
   - Ich kann einfache Informationen über mich, meine Familie und mein Umfeld austauschen, z. B. in der Mittagspause. `RC 56·A2`
   - Ich kann mit einer Reihe von Sätzen und mit einfachen Mitteln z. B. meine Familie, andere Leute, meine Wohnsituation, meine Ausbildung und meine gegenwärtige oder letzte berufliche Tätigkeit beschreiben. `GER-R·A2`
   - Ich kann ein sehr kurzes Kontaktgespräch führen. `GER-R·A2`
2. **Einladen und reagieren** (→ Schreiben 1)
   - Ich kann Freunde, auch telefonisch, fragen, ob sie zu einer Feier mitkommen, und einen Termin mit ihnen ausmachen. `RC 57·A2`
   - Ich kann mit einer Postkarte, E-Mail oder Kurzmitteilung zu einer Feier einladen. `RC 57·A2`
   - Ich kann auf eine Einladung, auch schriftlich, reagieren und zusagen oder freundlich mit Angabe von Gründen absagen. `RC 57·A2`
3. **Freizeit planen**
   - Ich kann Vorschläge machen, auf Vorschläge reagieren und Verabredungen treffen. `GI-A2F 16`
   - Ich kann mit einfachen Worten erklären, warum ich eine Freizeitaktivität nicht mitmachen möchte. `RC 58·A2`
   - Ich kann erklären, was ich an etwas mag bzw. nicht mag. `GI-A2F 16`
4. **Einkaufen: telefonisch, online, vergleichen**
   - Ich kann, auch telefonisch und online, Informationen zu Produkten erfragen, z. B. Herkunft, vorrätige Modelle, Haltbarkeit. `RC 124·A2`
   - Ich kann einfache Online-Transaktionen erledigen, wie zum Beispiel etwas bestellen. `GER-R·A2`
   - Ich kann auf einfache Weise sagen, wie ich alltägliche Dinge finde, z. B. ein Kleidungsstück. `RC 43·A2`
5. **Im Restaurant**
   - Ich kann in einer Gaststätte Speisen und Getränke bestellen und um Zusatzinformationen bitten, z. B. zu Inhaltsstoffen. `RC 125·A2`
   - Ich kann, auch telefonisch, mit einfachen Mitteln einen Tisch oder ein Hotelzimmer reservieren. `RC 125·A2`
   - Ich kann Servicepersonal bitten, eine Frage zu beantworten, und den Wunsch äußern zu zahlen. `RC 126·A2`
6. **Reisen mit Bahn und Flugzeug** (→ Hören)
   - Ich kann wichtige Informationen in einfachen Lautsprecherdurchsagen verstehen, z. B. Gleisänderungen, Verspätungen. `RC 143·A2`
   - Ich kann eine Reise am Schalter oder telefonisch buchen und die Buchungsbestätigung mit der Buchung vergleichen. `RC 144·A2`
   - Ich kann relevante Abkürzungen und Symbole in Fahrplänen verstehen, z. B. ICE, RE, Sa, So. `RC 142·A2`
7. **Unterwegs in der Stadt**
   - Ich kann Mitreisenden oder Passanten einen Weg beschreiben. `RC 145·A2`
   - Ich kann Informationen zu Örtlichkeiten am Bahnhof oder Flughafen erfragen, z. B. Toiletten, Gepäckaufbewahrung. `RC 143·A2`
   - Ich kann eine kurze schriftliche Wegbeschreibung zu einem Treffpunkt geben. `RC 89·A2`
8. **Eine Wohnung suchen**
   - Ich kann Wohnungsanzeigen die relevanten Informationen entnehmen und die wichtigsten Abkürzungen verstehen. `RC 154·A2`
   - Ich kann, auch telefonisch, einen Besichtigungstermin vereinbaren, absagen und neu vereinbaren. `RC 155·A2`
   - Ich kann bei Besichtigungen den Ausführungen von Vermietern Informationen zu Preisen und Terminen entnehmen. `RC 155·A2`
9. **Gesundheit: beim Arzt erzählen**
   - Ich kann im Gespräch mit Ärzten einfache Informationen zum Gesundheitszustand, zu Vorerkrankungen und Medikation geben. `RC 131·A2`
   - Ich kann Informationen über Behandlungsmöglichkeiten verstehen, z. B. Dauer, Nebenwirkungen, und darauf reagieren. `RC 131·A2`
   - Ich kann einfache Ratschläge zur Gesundheit geben, z. B. zu Hausmitteln, Ernährung. `RC 133·A2`
10. **Radio, Nachrichten, Internet**
    - Ich kann kurzen, deutlich gesprochenen Radiomeldungen relevante Informationen entnehmen, z. B. Verkehrsmeldungen, Wetter. `RC 138·A2`
    - Ich kann kurzen Berichten, die stark auf Namen, Zahlen, Überschriften und Bildern aufbauen, wichtige Informationen entnehmen. `RC 138·A2`
    - Ich kann einfache Warnhinweise und Fehlermeldungen im Internet verstehen. `RC 139·A2`
11. **Gefühle teilen, auch online**
    - Ich kann Freude und Vorfreude ausdrücken, z. B. über ein Geschenk. `RC 40·A2`
    - Ich kann sagen, dass mir etwas leidtut, und Verständnis ausdrücken, z. B. wenn jemand krank ist. `RC 40, 59·A2`
    - Ich kann mich an elementarer sozialer Kommunikation online beteiligen, meine Gefühle ausdrücken und auf Kommentare mit Dank, Entschuldigung oder Antwort auf Fragen reagieren. `GER-R·A2`
12. **Hier und dort: Leben vergleichen**
    - Ich kann das Leben in meinem Herkunftsland in einfacher Form beschreiben und einzelne Aspekte mit der Situation in Deutschland vergleichen. `RC 30·A2`
    - Ich kann auf einfache Art meine Meinung über Aspekte des Lebens in Deutschland mitteilen, z. B. dass Sonntag ein Ruhetag ist. `RC 31·A2`
    - Ich kann darüber sprechen, welche Sprachen ich wie gut spreche und wo ich sie gelernt habe. `RC 36·A2`
13. **Erlebnisse erzählen** (→ Sprechen 2)
    - Ich kann kurz und einfach über ein Ereignis oder eine Tätigkeit berichten. `GI-A2F 16`
    - Ich kann eine elementare, schematische Beschreibung von vergangenen Ereignissen verfassen. `GI-A2F 17`
    - Ich kann eine Abfolge von einfachen Ausdrücken und Sätzen verfassen, die mit „und", „oder" und „weil" verbunden sind. `GER-R·A2`
14. **Nachrichten hinterlassen und verstehen** (→ Hören, Schreiben)
    - Ich kann deutlich gesprochenen Ansagen auf dem Anrufbeantworter die wesentliche Information entnehmen. `GI-A2F 17`
    - Ich kann auf die Mailbox gesprochene Mitteilungen verstehen, z. B. eine Bitte um Rückruf, und entsprechend reagieren. `RC 84·A2`
    - Ich kann einen ganz einfachen persönlichen Brief schreiben, in dem ich mich für etwas bedanke oder entschuldige. `GI-A2F 16`

### A2.2: Gespräche führen, Probleme lösen (A2+, "starke Waystage")

1. **Gespräche in Gang halten**
   - Ich kann im direkten Kontakt mit einfachen Mitteln ein kurzes Gespräch beginnen, in Gang halten und beenden. `PD/RC 161·A2`, `GER-M·A2+`
   - Ich kann in Gesprächen über vertraute Themen dem Wechsel der Themen folgen und nachfragen. `PD/RC 161·A2`
   - Ich kann zu einem Gespräch beitragen, indem ich andere einlade, etwas zu erläutern, und zeige, wenn ich etwas verstanden habe oder zustimme. `GER-R·A2`
2. **Gemeinsam etwas planen** (→ Goethe A2 Sprechen 3)
   - Ich kann an einfachen praktischen Aufgaben mitarbeiten, andere nach ihrer Meinung fragen, Vorschläge unterbreiten und Erwiderungen verstehen. `GER-R·A2`
   - Ich kann erkennen, wenn Sprechende nicht übereinstimmen, und einfache Redewendungen benutzen, um Kompromisse oder Zustimmung zu suchen. `GER-R·A2`
   - Ich kann mit anderen mit einfachen Mitteln die Aufgabenverteilung aushandeln und einen Kompromiss finden. `RC 149·A2`
3. **Pläne, Hoffnungen, Sorgen**
   - Ich kann persönliche Zielvorstellungen benennen, z. B. eine Ausbildung machen. `RC 95·A2`
   - Ich kann mit einfachen Worten meine Hoffnung ausdrücken, z. B. auf eine Arbeitsstelle. `RC 41·A2`
   - Ich kann Sorgen und Ängste auf einfache Art ausdrücken und auf Nachfragen antworten. `RC 41·A2`
4. **Mein Weg: Schule, Ausbildung, Beruf**
   - Ich kann mitteilen, welche Schulen ich wo und wie lange besucht habe und welche Abschlüsse ich habe. `RC 94·A2`
   - Ich kann in einfachen Worten darstellen, welche beruflichen Erfahrungen ich gesammelt habe. `RC 94·A2`
   - Ich kann mithilfe einer Vorlage am PC einen tabellarischen Lebenslauf schreiben. `RC 99·A2`
5. **Bewerben und Vorstellungsgespräch**
   - Ich kann im Vorstellungsgespräch einfach und klar Auskunft geben, dass und warum ich einen bestimmten Job ausüben kann und möchte. `RC 100·A2`
   - Ich kann im Vorstellungsgespräch Informationen zu Arbeitszeiten, Bezahlung und Arbeitsort verstehen und Rückfragen stellen. `RC 100·A2`
   - Ich kann einen einfachen, klaren Aushang schreiben und darin eine Dienstleistung anbieten. `RC 98·A2`
6. **Im Job: Abläufe und Absprachen**
   - Ich kann Kollegen oder Vorgesetzten meine Tätigkeiten und Arbeitsabläufe beschreiben. `RC 82·A2`
   - Ich kann mich mit Kollegen über den Stand der Arbeit austauschen und Absprachen treffen. `RC 85·A2`
   - Ich kann Kollegen, auch elektronisch, eine kurze Notiz mit einer wichtigen Information hinterlassen. `RC 84·A2`
7. **Verträge und Papiere**
   - Ich kann einem Arbeitsvertrag relevante Angaben zu Arbeitszeit und Arbeitsentgelt entnehmen. `RC 87·A2`
   - Ich kann einem Mietvertrag wichtige Informationen entnehmen, z. B. Mietpreis, Nebenkosten, Fristen. `RC 155·A2`
   - Ich kann geläufige Anträge ausfüllen, z. B. einen Urlaubsantrag. `RC 88·A2`
8. **Probleme in der Wohnung**
   - Ich kann dem Vermieter, auch telefonisch, ein konkretes Problem schildern, z. B. einen Wasserschaden. `RC 156·A2`
   - Ich kann Nachbarn eine vorauszusehende Belästigung ankündigen und im Voraus um Verständnis bitten. `RC 157·A2`
   - Ich kann nach dem Umzug in einem einfachen formlosen Schreiben eine neue Adresse mitteilen. `RC 156·A2`
9. **Briefe vom Amt, Fristen** (→ Schreiben 2, halbformell)
   - Ich kann schriftlichen Aufforderungen der Behörden relevante Informationen entnehmen, z. B. Fristen. `RC 76·A2`
   - Ich kann Mitarbeitern meine Wünsche einfach und klar formulieren und nach der Verbindlichkeit von Fristen fragen. `RC 77·A2`
   - Ich kann äußern, dass ich ein Schreiben nicht verstehe, weil ich noch nicht so gut Deutsch spreche. `RC 34·A2`
10. **Bank, Versicherung, Krankenkasse**
    - Ich kann Standardbriefen der Versicherung wesentliche Informationen entnehmen, z. B. eine Beitragserhöhung. `RC 111·A2`
    - Ich kann der Versicherung oder Krankenkasse Änderungen mitteilen, z. B. Adresse, Familienstand. `RC 111, 134·A2`
    - Ich kann, auch telefonisch, Verlustmeldungen machen, z. B. von einer Karte, und um Ersatz bitten. `RC 112·A2`
11. **Reklamieren, sich beschweren, widersprechen**
    - Ich kann mit einfachen Worten angemessen ausdrücken, dass und warum ich mit etwas nicht einverstanden bin. `RC 48·A2`
    - Ich kann bei einer negativen Reaktion auf ein Anliegen mit einfachen Worten nach den Gründen fragen. `RC 49·A2`
    - Ich kann mit sehr einfachen Worten einen Kaufvertrag schriftlich widerrufen oder ein Abonnement kündigen. `RC 125·A2`
12. **Kita und Schule**
    - Ich kann an einem Elternabend die für mich wichtigsten Informationen verstehen. `RC 118·A2`
    - Ich kann einfache Mitteilungen an Lehrkräfte schreiben, z. B. Entschuldigungen. `RC 119·A2`
    - Ich kann mich mit einfachen sprachlichen Mitteln über Mitarbeit und Leistungsstand meines Kindes erkundigen. `RC 119·A2`
13. **Unfall und Notfall**
    - Ich kann bei einem Unfall Hilfe anfordern und einen Unfallhergang grob schildern. `RC 84, 144·A2`
    - Ich kann bei einem Notruf konkrete Anweisungen der Rettungsleitstelle verstehen. `RC 132·A2`
14. **Zusammenhängend erzählen und schreiben**
    - Ich kann in Form verbundener Sätze etwas über alltägliche Aspekte meines Umfelds schreiben, z. B. über Menschen, Orte, einen Job. `GI-HB 34·A2+`
    - Ich kann mit Signalwörtern wie „zuerst", „dann", „später", „zum Schluss" über ein Ereignis in seiner zeitlichen Abfolge berichten. `PD/RC 161·A2`
    - Ich kann Pläne und Vereinbarungen, Gewohnheiten und Alltagsbeschäftigungen beschreiben sowie über vergangene Aktivitäten berichten. `GER-M·A2+`
    - Ich kann mit einfachen Mitteln Gegenstände sowie Dinge, die mir gehören, kurz beschreiben und vergleichen. `GER-M·A2+` (Goethe puts this at A2: `GI-A2F 16`)

## Implications for the course blueprint

1. **The unit is a situation, not a grammar topic.** Each Lektion should be one Handlungssituation with 3–5 can-dos from this inventory, ordered as Handlungsketten, for example Wohnung suchen → besichtigen → Vertrag → Probleme → Umzug. This follows RC §6.3. Grammar is derived per unit, as the RC's §6.4 instructs.
2. **Split rules to enforce in the blueprint:**
   - **A1.1:** personal and social can-dos, performed with maximum partner support and memorised chunks.
   - **A1.2:** A1 transactions in public space (doctor, transport, authorities, bank, work, neighbours).
   - **A2.1:** A2 social functions plus travel and shopping transactions, as GER-M p. 3 describes A2.
   - **A2.2:** A2+ conversation maintenance, connected monologue and writing, plus the RC's A2 goals on work, job search, authorities, contracts and complaints.
3. **Precedence rule for boundary conflicts (F5).** If the target exam at that level tests a can-do, it goes in that level. Goethe A1 requests and simple reading of everyday texts therefore stay in A1. Otherwise the RC's lowest-level assignment decides. Every such override gets a one-line note in the curriculum file.
4. **The AI speaking partner must act as the cooperative interlocutor that A1 descriptors presuppose.** It speaks slowly, repeats, reformulates and offers help (F3). Support then fades by half-level:
   - A1.1: full help, including a word bank.
   - A1.2: repetition on request.
   - A2.1: normal pace with clarification.
   - A2.2: the learner must keep the conversation going (GER-M A2+).
5. **Anchor the AI writing and speaking feedback in the Profile deutsch qualitative bands, not in error counts.** Show the learner which band their text reached.
   - A1 = short, memorised, joined with *und/oder/und dann*.
   - A2 = recombined chunks, *und/aber/weil*, *zuerst … zum Schluss*, systematic errors tolerated if the meaning is clear.
   - A2.2 target = "verbundene Sätze" (GI-HB p. 34).
6. **Build the CV 2020 online and mediation can-dos into tasks.** Examples: post a greeting (A1.1 #14), complete an order form (A1.2 #9), post how you feel and answer comments (A2.1 #11), plan a joint task (A2.2 #2). An in-app AI can play the other side of each of these. Apart from joint planning, which Goethe A2 Sprechen 3 tests, none of them is an exam task type in memo 01, so they add value beyond exam drill.
7. **Put the ich-Form can-dos on screen as Lernziele,** with the source tag in the curriculum data, not on screen. The unit checkpoint should test exactly the can-dos listed for that unit. That makes "can-dos covered vs. listed" an auditable counter.
8. **Choose the persona before choosing units.** Many RC goals assume life in Germany. At A1 that is 43 of 185: Ämter 7, Banken 10, Kinder 7, Arbeitssuche 4 and area A 15. At A2 it is 113 of 322: Ämter 11, Banken 11, Kinder 30, Arbeitssuche 29, Aus-/Weiterbildung 10 and area A 22. A buyer preparing a Goethe exam abroad needs fewer of them.
   - Mark the RC-only situations as swappable: A1.2 #10, and A2.2 #7, #9, #10, #12.
   - Keep a reserve of DaF situations (travel, hotel, holidays) from the Goethe Themen list (Person, Wohnen, Umwelt, Reisen/Verkehr, Essen/Trinken, Einkaufen, Dienstleistungen, Arbeit/Beruf, Ausbildung/Lernen, Freizeit) [GI-A1 p. 75].
9. **14 situations per half-level is inside the target band, and the pool allows 16.** The reserve A1 goals and the unused A2 goals in RC Handlungsfelder 2, 3 and 6 (47, 29 and 30 A2 goals) can fill two more units without inventing can-dos.
10. **Fix the provenance line proposed in the earlier memo.** It should read "Rahmencurriculum (2016 revision)" and "Goethe Prüfungsziele SD1 (4th ed. 2022)", not "2022 rev." and "2016" (F7).

## Open questions

1. **Persona.** Is our buyer a DaZ learner living in Germany (RC-weighted) or a DaF exam candidate abroad (Goethe-weighted)? This decides the swappable units in Implication 8, and it needs an onboarding question or buyer data.
2. **Should A1.1, the free entry, promise only "pre-A1 to A1 with support"?** A1.1 alone does not cover Goethe A1, which spans both halves (memo 01, Implication 10). The copy must not imply exam readiness after A1.1.
3. **Profile deutsch.** Is it worth buying the Klett CD-ROM for its detailed Kannbeschreibungen with examples, its scenarios and its level-tagged Wortschatz, or do the Goethe word lists (≈650 A1, ≈1300 A2) suffice?
4. **Goethe A2 adult Kannbeschreibungen.** The Hueber book may word some can-dos differently for adults than Fit in Deutsch 2 does for school contexts, and I have not read it.
5. **Is there an RC edition after 2016?** Only the BAMF-hosted 2016 PDF was found.

## Unverified

- The A2.1/A2.2 assignment of individual RC goals is my inference from GER-M's A2 vs A2+ characterisation. The RC tags only "A2". **(unverified)**
- Anhang 8 extraction is garbled. From the extraction order I inferred that "online posten, wie er/sie sich fühlt …" is the A2 row and "Online-Konversation … beginnen, aufrechterhalten und abschließen" is the B1 row; a search snippet supports the A2 row. **(unverified)**
- The *Schritte plus Neu 1* level label "A1.1" is unverified; the Hueber shop confirms *Neu 3* = A2.1. The TOC files I fetched for ISBNs 978-3-19-301082-7 and -301084-1 did not show the expected volumes 2 and 4, so I did not use them. **(unverified)**
- "A1 = BAMF modules 1–2" (claimed in `research-curricula-2026-09-12.md`) is not stated in the BAMF overview I read. **(unverified)**
- "A1 needs 80–200 UE per Goethe" (same memo, via a Lingoda blog) is not in the A1 Prüfungsziele. What I could verify is Goethe's "circa 200 bis 350 UE" for A2 in intensive courses (Hueber sample, ch. 1). **(unverified)**
- The Goethe A1 Themen inventory, as extracted, shows no Gesundheit/Körper heading. This could be a layout-extraction loss. **(unverified)**
- The A–E goal counts are from my parse; the RC publishes no statistic for them. The A1 total of 185 includes 31 strategy goals from area E.

## Sources

- [RC] BAMF, Rahmencurriculum für Integrationskurse DaZ (Überarbeitung 2016): https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kurstraeger/KonzepteLeitfaeden/rahmencurriculum-integrationskurs.pdf?__blob=publicationFile
- [GI-A1] Goethe-Zertifikat A1: Start Deutsch 1, Prüfungsziele/Testbeschreibung (4. Aufl. 2022): https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf
- [GI-A2F] Goethe-Zertifikat A2 Fit in Deutsch 2, Prüfungsziele/Testbeschreibung (Aug 2013): https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf
- [GI-A2 sample] Goethe-Zertifikat A2 Prüfungsziele, Hueber sample ch. 1 (ISBN 978-3-19-051868-5): https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783190518685_Muster.pdf
- [WL-A2] Goethe-Zertifikat A2 Wortliste (≈1300 entries): https://www.goethe.de/pro/relaunch/prf/en/Goethe-Zertifikat_A2_Wortliste.pdf
- [GER-M] Begleitband Anhang 1: https://www.klett-sprachen.de/downloads/24544/anhang-1-zentrale-merkmale-der-ger-niveaus/pdf
- [GER-R] Begleitband Anhang 2: https://www.klett-sprachen.de/downloads/24545/anhang-2-raster-zur-selbstbeurteilung/pdf
- [GER-E] Begleitband Anhang 8: https://www.klett-sprachen.de/downloads/24551/Anhang_5F8_3A_5FErg_E4nzende_5FDeskriptoren/pdf
- Begleitband download index: https://www.klett-sprachen.de/ger-begleitband-downloads/c-3339
- [GI-HB] Goethe-Institut, Anbindung des Sprachunterrichts an den GER (April 2022): https://www.goethe.de/resources/files/pdf342/handbuch_anbindung-sprachunterricht-ger.pdf
- Goethe BOTO Rahmencurriculum (quotes the pre-A1 online descriptor): https://www.goethe.de/resources/files/pdf354/goethe-institut_boto-curriculum_final.pdf
- CEFR Companion Volume, English original (403 from this environment): https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4
- [PD] Profile deutsch table of contents: https://external.dandelon.com/download/attachments/dandelon/ids/CH00111115C1172E53325C1257AE1004CDD1D.pdf ; publisher page: https://www.klett-sprachen.de/profile-deutsch/t-1/9783126065184
- [ÖIF] ÖIF Rahmencurriculum A1: https://www.integrationsfonds.at/fileadmin/content/AT/Downloads/Sprache/Foerderaufruf__STARTPAKET_DEUTSCH/7_OEIF_Rahmencurriculum_A1.pdf
- [BAMF overview] Integrationskurs, 6 × 100 UE: https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/grafische-uebersicht-integrationskurs-DINA1.pdf?__blob=publicationFile&v=10
- Schritte plus Neu 1 TOC: https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010810_Inhalt.pdf ; Schritte plus Neu 3 TOC: https://www.hueber.de/shared/elka/Internet_Inhaltsverz/Red1/9783193010834_Inhalt.pdf ; Neu 3 = A2.1: https://shop.hueber.de/de/schritte-plus-neu-3-kb-ab-978-3-19-501083-2.html
