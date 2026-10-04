# 01 — The six A1/A2 exams: exact specifications

**Date:** 2026-09-26 · **Scope:** Goethe-Zertifikat A1: Start Deutsch 1, telc Deutsch A1, ÖSD Zertifikat A1 (ZA1), Goethe-Zertifikat A2, telc Deutsch A2 (Start Deutsch 2), ÖSD Zertifikat A2 (ZA2), adult versions only. · **Status:** research memo, input to the course-v2 blueprint.

## Method

I downloaded the primary documents and converted them to text with `pdfminer`, so every number here was read from the documents themselves. WebFetch returns the `goethe.de/pro/relaunch/...` PDFs even though the goethe.de HTML pages give 403. `osd.at` and `shop.telc.net` were fetched with `curl`.

| Exam | Documents read (edition) |
|---|---|
| Goethe A1 | Durchführungsbestimmungen, **Stand 1 Sept 2025** [DB-A1]; Prüfungsziele/Testbeschreibung, 4th updated ed. © 2022 [TB-A1]; Übungssatz 01, 6th rev. ed. Feb 2024 [US-A1] |
| Goethe A2 | Durchführungsbestimmungen, **Stand 1 Sept 2025** [DB-A2]; Übungssatz 01, Jan 2021 [US-A2]; Modellsatz 2016 [MS-A2]; Wortliste [WL-A2] |
| telc A1 / A2 | Exam web pages [telc-A1], [telc-A2]; Übungstest 1 Start Deutsch 1, 11th ed. 2021 [UT-A1]; Übungstest 1 Start Deutsch 2, 9th ed. 2021 [UT-A2] |
| ÖSD ZA1 / ZA2 | Durchführungsbestimmungen, **Stand Oct 2023** [DB-ZA1], [DB-ZA2]; current Modellsatz ZIPs (uploaded 08/2026) [MS-ZA1], [MS-ZA2]; flyers 06/2025 [F-ZA1], [F-ZA2]; ZA1 Auswertungsbögen Sprechen/Schreiben (Vers. 3.0) [AB-ZA1-S], [AB-ZA1-W]; ZA2/Österreich Modellsatz v2.0 [MS-ZA2Ö] |

WebSearch located the URLs; Firecrawl and DataForSEO were not used. I checked the A1 format claims in `docs/research/research-market-2026-09-03.md` and `research-buyer-pedagogy-2026-09-03.md` against the primary documents, and all of them hold. Text lengths are my word counts of one official sample each: an order of size, not a specification.

## Key finding in one paragraph

**At A1 there are two formats, and at A2 there are three.** Goethe and telc run *one* A1 exam, Start Deutsch 1. The Goethe practice set says it was "gemeinschaftlich vom Goethe-Institut und der telc GmbH entwickelt" [US-A1], and telc says it is "gemeinsam getragen" [UT-A1]. The two even share sample items. At A2 they split. Goethe replaced Start Deutsch 2 "seit 2015" with its own Goethe-Zertifikat A2 [US-A2]. telc still sells **Start Deutsch 2 as telc Deutsch A2**, a different format developed "im Auftrag des Bundesministeriums des Innern" [UT-A2]. ÖSD uses its own task types at both levels and is the only one of the three that is **modular**. The pass rules also differ in ways that change how a course should train, as §6 shows.

---

## 1. Goethe-Zertifikat A1: Start Deutsch 1 = telc Deutsch A1 (shared format)

| Teil | Task type | Items | Input text | Plays | Time |
|---|---|---|---|---|---|
| Hören 1 | 3-option MC with pictures | 6 | short everyday dialogues | 2× | Hören total ca. 20 min |
| Hören 2 | richtig/falsch | 4 | public announcements (airport, station, supermarket) | **1×** | |
| Hören 3 | 3-option MC | 5 | answering-machine messages (private and official) | 2× | |
| Lesen 1 | richtig/falsch | 5 | 2 short notes/e-mails (~70–80 words each) | — | Lesen 25 min |
| Lesen 2 | choose ad/website **a or b** | 5 | 10 small ads or web snippets, paired | — | |
| Lesen 3 | richtig/falsch | 5 | 5 signs/notices | — | |
| Schreiben 1 | fill 5 form fields from a situation text | 5 | form (registration, booking) | — | Schreiben 20 min |
| Schreiben 2 | message on 3 Leitpunkte, ~30 words | 1 | note/e-mail (Entschuldigung, Einladung, Anfrage) | — | |
| Sprechen 1 | self-introduction from keywords, then spell a word and give a number | — | keyword sheet: Name? Alter? Land? Wohnort? Sprachen? Beruf? Hobby? | — | ~80 s per candidate |
| Sprechen 2 | ask and answer on word cards, 2 topics | 2 Q + 2 A each | topic word cards | — | ~60 s per candidate |
| Sprechen 3 | make requests and react on picture cards | 2 + 2 | object pictograms | — | ~60 s per candidate |

Sources: [TB-A1] pp. 27–52, [US-A1], [UT-A1], [DB-A1] §1.4, §3. Speech in Hören is at "natürlichem Sprechtempo", and no dictionaries are allowed [TB-A1]. The written exam lasts **65 min with no breaks**. The oral is a **group of up to 4, with no preparation time**, run by two examiners [DB-A1]. telc's page adds "i.d.R. 4 Teilnehmende", ca. 20 min Hören plus 45 min Lesen+Schreiben, **paper only** [telc-A1].

**Scoring.** Hören 15 and Lesen 15 score 1 point per item. Schreiben 15 = Teil 1 (5 × 1) + Teil 2 (10). Sprechen 15 = Teil 1 (3) + Teil 2 (6) + Teil 3 (6) [DB-A1 §4–5].

- **Schreiben Teil 2:** each Leitpunkt scores 3, 1.5 or 0. "Kommunikative Gestaltung" (Anrede/Gruß) scores 1, 0.5 or 0. Spelling costs points only if it harms understanding [TB-A1 p. 38; UT-A1 p. 34]. Two graders average their scores [DB-A1 §4.3.2].
- **Sprechen:** each task scores full, half or 0 points, and "ausschlaggebend ist also die Verständlichkeit, nicht die Zahl der Fehler" [TB-A1 p. 46].
  - Teil 1: 1 point each for vorstellen, buchstabieren and Nummer.
  - Teil 2: **2 points per question, 1 per answer**.
  - Teil 3: **2 per Bitte, 1 per reaction**. A non-verbal reaction counts [TB-A1 pp. 49–52; UT-A1 M10 sheet].

**Pass rule, Goethe presentation.** Raw part scores are multiplied by 1.66, giving 100 points: 75 written and 25 oral. A candidate passes with **≥ 60 points and all parts taken; there is no per-part minimum**. Below 35 written points the oral cannot rescue the result [DB-A1 §6]. Grades: 90–100 sehr gut, 80–89 gut, 70–79 befriedigend, 60–69 ausreichend. **Not modular: "Die Prüfung kann nur als Ganzes wiederholt werden"** [DB-A1 §7].

**Pass rule, telc presentation.** 60 raw points; **36 = ausreichend**, and 0–35.5 = "teilgenommen" [UT-A1 p. 5]. The exam "kann NICHT als Teilprüfung abgelegt werden" [telc-A1].

**Word list:** ca. 650 entries, of which about half should be active [TB-A1, introduction to the Wortliste]. **Digital delivery:** the Goethe DB annex allows the exam on a centre laptop with a **German keyboard**, plus a remote online variant [DB-A1 Anhang].

**What a candidate must be able to do, and one illustrative task shape per Teil.** The items below are my own, written in the official format.

- **H1:** catch a number, time, price or place in a dialogue. *„Wie viel kostet die Jacke?" a) 19 € b) 90 € c) 99 €*
- **H2:** get the instruction from a one-time announcement. *„Der Zug nach Köln fährt heute von Gleis 5." richtig/falsch*
- **H3:** extract a callback time or place from a voicemail. *„Wann soll Herr Yilmaz zurückrufen?" a) vor 12 Uhr b) nach 14 Uhr c) morgen*
- **L1:** verify details in a note. *Note: „Treffen am Freitag, 8 Uhr, am Eingang" → „Das Treffen ist am Donnerstag." r/f*
- **L2:** pick which of 2 ads matches a need. *„Sie suchen einen Schwimmkurs für Ihr Kind am Samstag." a) www.bad-mitte.de b) www.sportshop.de*
- **L3:** read a sign's rule. *„Apotheke: Mi Nachmittag geschlossen" → „Sie können Mittwoch um 15 Uhr Medikamente kaufen." r/f*
- **S1:** copy facts from a prose situation into 5 form fields (Geburtsort, Kurszeit, Zahlungsart …).
- **S2:** *„Sie sind krank und können morgen nicht zum Kurs kommen. Schreiben Sie Frau Berger: Warum schreiben Sie? Wann kommen Sie wieder? Fragen Sie nach den Hausaufgaben."* The answer needs Anrede and Gruß.
- **Sp1:** introduce yourself in several sentences, spell your surname, say a phone number.
- **Sp2:** topic „Einkaufen", card „Brot" → *„Wo kaufst du Brot?"* → a partner answers.
- **Sp3:** picture card with a pen → *„Kannst du mir bitte einen Kuli geben?"* → *„Ja, hier bitte."* If the candidate asks a question instead of making a request, the moderator asks them to try again [TB-A1 p. 52].

## 2. ÖSD Zertifikat A1 (ZA1)

| Subtest/Aufgabe | Task type | Items | Input | Plays | Points |
|---|---|---|---|---|---|
| Lesen 1 | match 5 situations → 6 ads (one extra) | 5 | small ads | — | 10 |
| Lesen 2 | JA/NEIN, 2 questions per text | 6 | 3 short ads/notices | — | 10 |
| Lesen 3 | match 5 notices → 6 pictures (one extra) | 5 | 5 short signs/notices | — | 10 |
| Hören 1 | match 5 texts → 6 photos | 5 | short dialogues | **1×** | 10 |
| Hören 2 | note-taking: fill 5 lines | 5 | one voice message | 2× | 10 |
| Hören 3 | 5 interviewees, 1 answer each from 4 options | 5 | vox-pop interview | **1×** | 10 |
| Schreiben 1 | form from a situation text, 10 entries → 5 pts | 10 | form | — | 5 |
| Schreiben 2 | reply to an e-mail, answer 3 questions + Gruß, ~30 words | 1 | e-mail | — | 10 |
| Sprechen 1–3 | self-intro choosing **4 of 6 topics**; describe **1 of 3 photos** via 4 questions (Was? Wie viele Personen? Wo? Was machen sie?); **role-play** the photo situation with the examiner | — | topic sheet, photos | — | 25 |

Sources: [MS-ZA1], [DB-ZA1] §1–5, [F-ZA1]. Timings: Lesen 25 min, Hören ca. 10 min, Schreiben 20 min (written ca. 55 min). The oral lasts ca. 10 min, is an **individual** exam, and comes with **10 min preparation and notes allowed** [DB-ZA1 §1.4, §3.2].

**Scoring and pass rules.**

- **Items and scale:** Lesen has 16 items and Hören 15, each converted by table to 30 points. Written total = 75, oral = 25 [DB-ZA1 §4–6].
- **Written module passes** with ≥ 38/75 **and** the subtest floors: **Lesen ≥ 6/30** and **Hören ≥ 6/30**. Below either floor, "gesamtes Modul Schriftliche Prüfung nicht bestanden" [MS-ZA1]. **Schreiben ≥ 4/15** [AB-ZA1-W].
- **Oral module passes** with ≥ 12/25 [DB-ZA1 §6.3].
- **Modular:** each module is taken, certified and repeated independently, "beliebig oft" [DB-ZA1 §1.1, §7]. Digital delivery since 1 Jan 2024 [DB-ZA1 §8].
- **Rubrics** [AB-ZA1-W], [AB-ZA1-S]:
  - Schreiben 2 uses **deductions**:
    - length: ≥ 25 words, no deduction; 24–20 words, −1; 19–15 words, −2; < 15 words, the whole task scores 0;
    - content: large part fulfilled, −1; partly fulfilled, −2; off-topic, 0.
    - It also scores Textsorte 1, Kohärenz 1, Lexik 0–4 and Formale Richtigkeit 0–4. The top values of 4 are inferred from the 10-point total.
  - Sprechen scores task fulfilment per Aufgabe, plus Ausdruck/Wortschatz, Aussprache/Flüssigkeit and Formale Richtigkeit. Some top values are unreadable (see Unverified).
- **Hören 2 is exact-match:** spelled names and the phone number "müssen … komplett richtig sein" to earn 2 points [MS-ZA1].

## 3. Goethe-Zertifikat A2

| Teil | Prüfungsziel / task type | Items | Input (sample size) | Plays |
|---|---|---|---|---|
| Lesen 1 | understand a media text; MC a/b/c | 5 | newspaper article (~190 words) | — |
| Lesen 2 | info boards, programmes; "Wohin gehen Sie?" MC a/b/c (c = "andere …") | 5 | directory/programme (~235 words) | — |
| Lesen 3 | understand correspondence; MC a/b/c | 5 | personal e-mail (~260 words) | — |
| Lesen 4 | match ads → persons; 1 item has no match (X) | 5 | 6 short web ads | — |
| Hören 1 | radio, phone, announcement info; MC | 5 | 5 short texts | 2× |
| Hören 2 | follow a connected conversation; match 5 days to pictures a–i | 5 | one dialogue | **1×** |
| Hören 3 | short conversations; MC with pictures | 5 | 5 dialogues | **1×** |
| Hören 4 | radio interview; **Ja/Nein** | 5 | interview (~225 words) | 2× |
| Schreiben 1 | personal message to keep in touch: **SMS, 20–30 words**, 3 points | — | e.g. "you moved; say where, what you like, invite" | — |
| Schreiben 2 | semi-formal message to arrange something: **e-mail, 30–40 words**, 3 points | — | e.g. "change a hotel booking, ask for a new price" | — |
| Sprechen 1 | exchange personal info: 4 word cards, ask 4 questions, answer 4 | — | cards "Geburtstag? Wohnort? Beruf? Hobby?" | — |
| Sprechen 2 | tell the examiner about your life: card with a question + 4 prompts; examiner asks 1–2 follow-ups | — | *„Was machen Sie mit Ihrem Geld?"* — Kleidung? Sparen? Reisen? | — |
| Sprechen 3 | plan and negotiate together (find a slot in two diaries; or plan a party) | — | two different day calendars | — |

Sources: [US-A2] p. 3 (overview table), pp. 5–27; [MS-A2]; [DB-A2]. The written exam is **90 min without a break**: Lesen 30, Hören ca. 30, Schreiben 30. Order: Lesen → Hören → Schreiben. The oral is **normally in pairs**, 15 min (individual 10 min), **with no preparation**. Timing: Teil 1 ca. 3 min, Teil 2 ca. 3 min per person, Teil 3 ca. 5 min. The examiner gives ~20 s to read the cards [DB-A2 §1.4, §3; US-A2 p. 41].

**Scoring.**

- **Lesen and Hören:** 20 items each, × 1.25 = 25 points each.
- **Schreiben:** 20 Messpunkte, × 1.25 = 25. Per Teil, **Aufgabenerfüllung 5/3.5/2/0.5/0 + Sprache 5/3.5/2/0.5/0** (read from the scoring sheet text).
  - Aufgabenerfüllung covers Sprachfunktionen (all 3 points addressed) and Register.
  - Sprache covers Spektrum and Beherrschung (Kohärenz, Wortschatz, Strukturen).
  - Under **50% of the required length (10 / 15 words) the task is graded E**, and E in Aufgabenerfüllung zeroes the task [US-A2 p. 37].
  - A third grader is used when two graders straddle the 12-point threshold [DB-A2 §4.3].
- **Sprechen:** 25 points. Criteria: Sprachfunktion, Interaktion, Register, Spektrum and Beherrschung, plus a separate **Aussprache** scale (Satzmelodie, Wortakzent, Laute) [US-A2 p. 42]. The per-Teil split is reconstructed in the Unverified section.

**Pass rule:** ≥ 60/100 **and ≥ 45/75 written and ≥ 15/25 oral**, "andernfalls gilt die gesamte Prüfung als nicht bestanden" [DB-A2 §6.3]. **Not modular.** A partial resit (oral only, or the whole written part) is possible only "in Ausnahmefällen": at the same centre, within a year, with no entitlement [DB-A2 §7].

**Word list:** ca. **1,300 lexical units**, which must be known "zumindest rezeptiv" [WL-A2]. Digital and online delivery follow the same annex as A1 [DB-A2].

**Illustrative task shapes** (the Schreiben and Sprechen shapes follow [MS-A2]):

- **L2:** store directory → *„Sie brauchen eine Batterie für Ihre Uhr."* a) EG b) 2. Stock c) anderes Stockwerk.
- **L4:** *„Tom sucht einen gebrauchten Laptop."* → ad d, or X if none fits.
- **H2:** *„Was hat die Frau am Montag gemacht?"* → picture of a museum.
- **H4:** radio interview with a baker → *„Herr Kaya steht jeden Tag um vier Uhr auf."* Ja/Nein.
- **S1:** *SMS: Sie kommen zu spät — entschuldigen, Grund, neuer Ort und Uhrzeit.*
- **S2:** *E-Mail an Ihren Chef: bedanken und zusagen, jemanden mitbringen, nach dem Weg fragen.*
- **Sp1:** card „Wohnort?" → *„Wo wohnen Sie?"*
- **Sp3:** *„Finden Sie einen Termin für den Geschenkkauf."*

## 4. telc Deutsch A2 (Start Deutsch 2)

| Teil | Task type | Items | Input | Plays |
|---|---|---|---|---|
| Hören 1 | **complete phone notes** (short open answers) | 5 | 5 phone messages | 2× |
| Hören 2 | MC a/b/c | 5 | 5 radio items (programme, weather, traffic, contest) | **1×** |
| Hören 3 | match 5 persons → places a–i | 5 | one workplace conversation | 2× |
| Lesen 1 | MC a/b/c ("anderes Stockwerk") | 5 | store directory | — |
| Lesen 2 | richtig/falsch | 5 | one narrative text | — |
| Lesen 3 | match 5 situations → ads a–h; one X | 5 | small ads | — |
| Schreiben 1 | fill 5 missing form items from documents (ID card, bank card, bio) | 5 | online registration form | — |
| Schreiben 2 | letter, **choose 3 of 4 points**, ~40 words, Anrede/Gruß | 1 | invitation reply (e.g. a wedding) | — |
| Sprechen 1 | self-intro (keyword sheet) + examiner follow-up questions | — | Name? Alter? Land? … | — |
| Sprechen 2 | everyday conversation on a topic, W-question cards incl. joker "…?" | 6 contributions | topic "Tagesablauf" | — |
| Sprechen 3 | negotiate a joint appointment from two diaries | — | two Saturday calendars | — |

Sources: [UT-A2] pp. 5–25, 33–35; [telc-A2]. Timing: Hören ca. 20 min; Lesen+Schreiben 50 min; Sprechen ca. 15 min, "usually 2 test takers, no preparation time"; paper only; **"can NOT be taken as a partial examination"** [telc-A2].

**Scoring:** 60 points, 15 per skill. Schreiben 2 uses the same 3/1.5/0 per point + 1/0.5/0 Textsorte scheme as A1. Sprechen: Teil 1 = Vorstellen 1 + Zusatzfragen 2; Teil 2 = 6 contributions × 1; Teil 3 = Aufgabenerfüllung 3 + sprachliche Realisierung 3. **36/60 = ausreichend** [UT-A2 pp. 5, 33–35]. In Hören 1 and Schreiben 1, spelling is tolerated but **numbers must be exactly right** [UT-A2 p. 33].

**Illustrative shapes** (my own items):

- **H1:** note *„Arzttermin verschoben auf: ____"* → the candidate writes „Donnerstag, 9.15 Uhr".
- **H3:** *„Hausmeister → ?"* choosing from a–i, e.g. „im Keller".
- **S2:** *„Ihr Kollege lädt Sie zum Grillfest ein. Wählen Sie drei: Essen mitbringen / Uhrzeit / Weg / Kinder"*
- **Sp2:** card „Wie oft …?" → *„Wie oft kochen Sie am Abend?"*

## 5. ÖSD Zertifikat A2 (ZA2)

| Subtest/Aufgabe | Task type | Items | Input | Plays | Points |
|---|---|---|---|---|---|
| Lesen 1 | match 5 texts → 10 headlines | 5 | 5 short news texts (~240 words total) | — | 15 |
| Lesen 2 | MC A/B/C | 5 | one article (~230 words) | — | 10 |
| Hören 1 | two versions of the same info; tick the 4 true facts (over-ticking is penalised) | 4 | e.g. weekend weather report | **1×** | 10 |
| Hören 2 | note-taking, 5 lines; phone number exact | 5 | voice message | 2× | 10 |
| Hören 3 | 5 interviewees, **several answers per person** | 5 rows | vox-pop | **1×** | 10 |
| Schreiben | reply e-mail, **~50 words**, answer all questions (4 in the sample) + Gruß | 1 | friend's e-mail | — | 15 |
| Sprechen 1 | self-intro choosing **5 of 6 topics** + examiner questions | — | topic sheet | — | 20 |
| Sprechen 2 | plan a joint activity (Wohin? Wann? Wie reisen? Was mitnehmen?) | — | planning sheet | — | |

Sources: [MS-ZA2], [DB-ZA2], [F-ZA2]. Timings: Lesen 30 min, Hören ca. 15 min, Schreiben 30 min (written ca. 75 min). The oral is **pair or individual**, ca. 10 min, **with 10 min preparation and notes allowed**. **Pass rules:** written ≥ 35/70 with **Lesen ≥ 5/25** and **Hören ≥ 6/30**; oral ≥ 10/20; total scale 90 [DB-ZA2 §6; MS-ZA2]. Modular as ZA1 [DB-ZA2 §1, §7].

## 6. Pass rules side by side

| Exam | Scale | Overall | Per-part floor | Modular / resit |
|---|---|---|---|---|
| Goethe A1 | 100 (75 + 25) | 60 | none (< 35 written = cannot pass) | no; whole exam |
| telc A1 | 60 | 36 | none stated in UT-A1 | no partial exam |
| ÖSD ZA1 | 75 + 25 | per module | Lesen ≥ 6/30, Hören ≥ 6/30, Schreiben ≥ 4/15; written ≥ 38/75; oral ≥ 12/25 | yes, 2 modules |
| Goethe A2 | 100 (75 + 25) | 60 | written ≥ 45, oral ≥ 15 | no; exceptional partial resit |
| telc A2 | 60 | 36 | none stated in UT-A2 | no partial exam |
| ÖSD ZA2 | 70 + 20 | per module | Lesen ≥ 5/25, Hören ≥ 6/30; written ≥ 35/70; oral ≥ 10/20 | yes, 2 modules |

## 7. Mapping: every Teil → what a course unit must rehearse

| Exam · Teil | Skill operation | Text type | Unit must rehearse |
|---|---|---|---|
| SD1 H1 | detail, 2× | short dialogue | numbers, prices, times, floors; spoken distractors |
| SD1 H2 | instruction, **1×** | Durchsage | station/airport/shop announcements at full tempo |
| SD1 H3 | detail, 2× | Anrufbeantworter | who, when, callback, place |
| SD1 L1 | detail r/f | Notiz, E-Mail | informal notes with dates and times |
| SD1 L2 | need → offer, a/b | Kleinanzeige, Webseite | scanning two offers against a need |
| SD1 L3 | rule r/f | Schild, Aushang | opening hours, bans, tickets |
| SD1 S1 | data → form | Formular | dates, places, times, payment |
| SD1 S2 | 3 points + Anrede/Gruß, ~30 words | Kurzmitteilung | excuse, invite, enquire; du vs Sie |
| SD1 Sp1 | monologue, spelling, number | Selbstvorstellung | 7 keywords, alphabet, phone number |
| SD1 Sp2 | ask (2) / answer (1) | topic word card | W- and Ja/Nein-questions on A1 topics |
| SD1 Sp3 | request (2) / react (1) | picture card | *Können Sie … bitte …?*, imperative |
| ZA1 L1, L3 | match with a distractor | Anzeigen; Schild → Bild | elimination |
| ZA1 L2 | JA/NEIN detail | Anzeigen | price, validity, contact |
| ZA1 H1, H3 | match or MC, **1×** | dialogues; vox pop | single-play gist |
| ZA1 H2 | notes; exact spelling and numbers | Sprachnachricht | name and number dictation |
| ZA1 S1, S2 | form (10 entries); reply ≥ 25 words | Formular; E-Mail | answer every question; length floor |
| ZA1 Sp1–3 | 4 of 6 topics; photo; role play | Themenblatt; Foto | prep-with-notes; people and places; service talk |
| GZ-A2 L1, L3 | detail in 190–260-word texts | Zeitungstext; E-Mail | paraphrase matching; Perfekt; *weil* |
| GZ-A2 L2 | scan with an "andere" option | Wegweiser, Programm | "not listed" answers |
| GZ-A2 L4 | match ads, 1 no-match | Internetanzeigen | eliminating near-misses |
| GZ-A2 H1, H4 | detail, 2×; Ja/Nein | radio, voicemail; interview | weather, traffic, plans; opinions |
| GZ-A2 H2, H3 | narrative → pictures; MC, **1×** | conversations | time markers; everyday errands |
| GZ-A2 S1 | 3 functions, 20–30 words | SMS (du) | apologise, inform, invite |
| GZ-A2 S2 | 3 functions, 30–40 words | E-Mail (Sie) | request, rebook, ask |
| GZ-A2 Sp1–3 | ask/answer; monologue + follow-ups; negotiate | cards; task card; calendar | *Wie wäre es mit …?* / *Da kann ich nicht, weil …* |
| telc-A2 H1 | write short answers, 2× | Telefonansage | numbers, places, times in writing |
| telc-A2 H2, H3 | MC **1×**; people → places, 2× | Radio; workplace talk | prepositions of place |
| telc-A2 L1–3 | MC; r/f; match with X | Wegweiser; narrative; Anzeigen | as for GZ-A2 L2/L4 |
| telc-A2 S1, S2 | form from documents; 3 of 4 points, ~40 words | Formular; Brief | choosing points; Anrede/Gruß |
| telc-A2 Sp1–3 | intro + follow-ups; 6 Q/A turns; diary | Stichworte; W-cards; Kalender | as for SD1 Sp2 and GZ-A2 Sp3 |
| ZA2 L1, L2 | headline match; long-text MC | Kurzmeldungen; Artikel | gist → headline |
| ZA2 H1–3 | tick facts (over-ticking penalised); notes; multi-select | Info; Nachricht; Umfrage | cautious multi-select |
| ZA2 S | reply ~50 words, answer all questions | E-Mail | covering every question |
| ZA2 Sp1, Sp2 | 5 of 6 topics; plan an outing | Themenblatt; Planungsblatt | prep-with-notes mode |

## Implications for the course blueprint

1. **One A1 exam spine, two A2 spines, and ÖSD as an adapter.** Build A1.1–A1.2 against Start Deutsch 1, which serves Goethe and telc with one item bank, and add an ÖSD ZA1 practice pack covering the six ÖSD-only task types. At A2, pick Goethe A2 as the primary mock. Author telc A2 and ÖSD ZA2 as separate mock sets because the task types do not transfer: phone notes, choose 3 of 4 points, headline matching, a 50-word reply. The repo guide `astro-site/src/data/guides/goethe-a2.js` says Start Deutsch 2 is the "same level" retired name. That is true for Goethe but not for telc, which still sells it.
2. **Put each exam's real pass rule in its own scorer.** Goethe A1 is 60 overall with no floor. Goethe A2 needs ≥ 45 written and ≥ 15 oral. telc needs 36/60. ÖSD scores per module with subtest floors (Lesen/Hören ≥ 6 at A1, Lesen ≥ 5 at A2). The mock-exam result screen must say "nach der Bestehensregel von X wäre dieses Ergebnis …". It must never say "bestanden": our mock is not the exam.
3. **Configure the AI writing grader per exam rubric.** One generic score is not enough.
   - Goethe/telc A1 and telc A2: 3/1.5/0 per Leitpunkt plus 1/0.5/0 Textsorte, with no spelling penalty unless meaning suffers.
   - Goethe A2: A–E bands on Aufgabenerfüllung and Sprache, 5/3.5/2/0.5/0; under 50% of the words the task scores 0.
   - ÖSD A1: a deduction model (−1 at 20–24 words, −2 at 15–19, 0 under 15).
   - Show the lost points per criterion, never a bare percentage.
4. **Use a live word counter with exam-specific bands:** SD1 ~30; Goethe A2 20–30 and 30–40; telc A2 ~40; ÖSD A1 ≥ 25 (no deduction); ÖSD A2 ~50.
5. **Weight speaking practice toward question formation.** In SD1 Sprechen 2 and 3, the question or request earns 2 points and the answer 1. Every A1 unit needs repeated drills in forming W-questions, Ja/Nein-questions and polite requests, graded by the speaking coach on the same full/half/0 scale by intelligibility ("nicht die Zahl der Fehler").
6. **Give the speaking coach two modes.** "No preparation, partner or group" serves Goethe and telc (examiner script, card draw, ~20 s to read cards at A2). "10 min preparation, notes allowed, individual" serves ÖSD, which includes photo description and role play at A1.
7. **Make the listening player enforce play counts and natural tempo.** Single-play parts: SD1 H2, Goethe A2 H2 and H3, telc A2 H2, ÖSD A1 H1 and H3, ÖSD A2 H1 and H3. Practice mode may allow slowing down; mock mode must not.
8. **Use exact-match checkers for numbers and spelled names.** telc: "numbers only if clearly right". ÖSD: phone numbers and spelled names "komplett richtig". Wherever the target is a word rather than a number, spelling stays tolerant, which matches telc's "Donerstach" rule.
9. **Author mock text types to official sizes.** A1 texts are short: notes of 70–80 words, and signs. A2 reading needs longer texts of ~190–260 words (article, programme, e-mail), and listening needs a ~225-word interview. Each half-level should expose the text type before its checkpoint.
10. **Split each exam into half-level milestones.**
    - A1.1 checkpoint: Sp1, S1, L3 and H1, which need low grammar.
    - A1.2: the full SD1 mock, timed at 65 + 15 min.
    - A2.1: GZ-A2 S1 and Sp1–2, plus telc A2 H1.
    - A2.2: full A2 mocks, 90 + 15 min.
11. **Train both typing and handwriting.** Goethe offers laptop delivery with a German keyboard, while telc is paper only. The writing UI needs umlaut input, and one mock per level should include the ~3–5 min answer-transfer step.
12. **Legal and copy.** The official sets are copyrighted ("urheberrechtlich geschützt"), so we write our own items in the official format and link to the free official sets. Marketing copy may say "im Prüfungsformat von …". It must not imply endorsement or promise a pass (see `docs/course-research-2026-09-03.md` §4).

## Open questions

1. Which exam do our buyers actually sit: Goethe, telc or ÖSD, at A1 and at A2? This decides whether telc A2 and ÖSD packs ship at launch or later. Next steps: a DataForSEO volume comparison and an onboarding question.
2. Does telc apply any per-part minimum in its Prüfungsordnung for A1/A2? The Übungstests show only the 36/60 grade table.
3. Are the international ZA2 and the ZA2/Österreich variants task-identical? Only the themes appear to differ.
4. Is the telc "Deutsch-Test A2 Sprechen" (a 2024 speaking-only exam: self-intro with past-tense follow-ups, justify an opinion, picture-based report) required by some visa or residence path that should shape the A2 speaking module?
5. Where are Goethe A1 and A2 remote online exams actually offered? This affects whether the typing-first UI is the default.

## Unverified

- **Goethe A2 Sprechen split**: Teil 1 = 4 (Aufgabenerfüllung 2 + Sprache 2), Teil 2 = 8 (4 + 4), Teil 3 = 8 (4 + 4), Aussprache 5 (5/3.5/2/0.5/0). I reconstructed this from the rotated, reversed text of the "Sprechen – Bewertung" sheet in [US-A2]. The value counts match exactly and sum to 25, but the page was not visually checked. **(unverified)**
- ÖSD ZA1 Sprechen top values: Aufgaben 1–3 = 4 each, Ausdruck/Wortschatz 5, Aussprache 4, Formale Richtigkeit 4. The ÖSD ZA1 Schreiben Lexik and Formale Richtigkeit tops of 4 are also inferred from the totals (25 and 10). **(unverified)**
- ÖSD ZA1/ZA2 item-to-point conversion tables for Lesen and Hören were not readable in the extracted text. **(unverified)**
- ÖSD ZA2 Schreiben and Sprechen rubrics, and any Schreiben floor at ZA2, were not found online. **(unverified)**
- The claim that ÖSD issues a Gesamtzertifikat only when both modules are passed at one sitting comes from a search snippet of osd.at; the page itself returned 404. **(unverified)**
- The telc web pages mention "Sprachbausteine" in the A1/A2 receptive part. No such section exists in either Übungstest, so this looks like template text. **(unverified)**
- Text lengths are word counts of one sample each, not published specifications.

## Sources

- [DB-A1] https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf
- [TB-A1] https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf
- [US-A1] https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz01.pdf
- [DB-A2] https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf
- [US-A2] https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf
- [MS-A2] https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Modellsatz_Erwachsene.pdf
- [WL-A2] https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A2_Wortliste.pdf
- [bfu] https://bfu.goethe.de/a2_mod_2MX5/sprechen.php
- [telc-A1] https://www.telc.net/sprachpruefungen/zertifikatspruefung/deutsch/start-deutsch-1-/-telc-deutsch-a1/
- [UT-A1] https://shop.telc.net/media/catalog/product/file/2/0/20210103_5070-b00-010106_web_1.pdf
- [telc-A2] https://www.telc.net/en/language-examinations/certificate-exams/german/start-german-2-telc-german-a2/
- [UT-A2] https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf
- [telc-A2S] https://shop.telc.net/media/catalog/product/file/2/0/20240208_5005-b00-010101_barrierefrei_web_1.pdf
- [DB-ZA1] https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf
- [DB-ZA2] https://www.osd.at/wp-content/uploads/2023/09/ZA2-Durchfuhrungsbestimmungen_10_2023.pdf
- [MS-ZA1] https://osd.at/wp-content/uploads/2026/08/ZA1_Modellsatz.zip
- [MS-ZA2] https://osd.at/wp-content/uploads/2026/08/ZA2_Modellsatz.zip
- [MS-ZA2Ö] https://www.osd.at/wp-content/uploads/2018/10/za2-oe_modellsatz_modul2_schriftlich.pdf
- [F-ZA1] https://osd.at/wp-content/uploads/2026/09/Folder_ZA1_06-2025.pdf
- [F-ZA2] https://osd.at/wp-content/uploads/2026/09/Folder_ZA2_06-2025.pdf
- [AB-ZA1-S] https://www.osd.at/wp-content/uploads/2019/01/za1_auswertungsbogen_sprechen.pdf
- [AB-ZA1-W] https://www.osd.at/wp-content/uploads/2019/01/za1_auswertungsbogen_schreiben.pdf
- ÖSD downloads index: https://osd.at/downloads/
