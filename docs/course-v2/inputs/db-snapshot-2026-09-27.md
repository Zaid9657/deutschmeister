# Database snapshot for course-v2 agents (2026-09-27)

Read-only snapshot of the Supabase project (`omqyueddktqeyrrqvnyq`), taken by the orchestrating session on
2026-09-27 ~02:00 UTC. **Workflow sub-agents must NOT call the Supabase MCP tools** — the calls hang
indefinitely inside sub-agents (measured 2026-09-27: four agents stalled 40–60 min on their first query).
Use this file and the repo's local files instead (`grammar-content-cache.json` holds all 76 grammar topics,
rules, examples and exercises; `src/data/mockExams/*`, `src/data/courseTests/*`, `src/data/writingTasks.js`).
Anything that needs a live id (a `words.id` for audio reuse, a mission id) is matched by the orchestrator at
integration time with one SQL query — authors write lemmas, not ids.

## Row counts per level

| level | words | speaking_missions | listening_exercises | reading_lessons |
|---|---|---|---|---|
| a1.1 | 375 | 12 | 12 (6 recorded, 6 pending) | 12 |
| a1.2 | 413 | 12 | 6 | 10 |
| a2.1 | 423 | 8 | 6 | 10 |
| a2.2 | 373 | 8 | 6 | 10 |
| b1.1 | 262 | 8 | 6 | 8 |
| b1.2 | 261 | 8 | 6 | 8 |
| b2.1 | 244 | 8 | 6 | 8 |
| b2.2 | 246 | 8 | 6 | 10 |

## `words` (columns: id, level, german, english, article, plural, example_sentence, audio_url, category)

| level | rows | with audio | with article | with plural | with example | categories (rows) |
|---|---|---|---|---|---|---|
| a1.1 | 375 | 339 | 161 | 145 | 339 | Countries & Languages 29, Jobs & Work 28, Basic Verbs 25, Greetings 25, Family 25, Basic Questions 25, Classroom Objects 25, Colors 25, Forms & Registration 24, Numbers 1-20 24, Days 23, Yes/No/Maybe 21, Time & Appointments 21, Drinks 11, Personal Pronouns 8, plus 36 rows tagged for the old A1.1 course |
| a1.2 | 413 | 413 | 269 | 230 | 413 | Time Expressions 26, Travel & Transport 26, Home & Rooms 25, Food & Drinks 25, Places in Town 25, Common Verbs 25, Numbers 20-100 25, Basic Adjectives 25, Clothes 25, Family (extended) 25, Body Parts 25, Free Time 24, Months & Seasons 22, Furniture 20, Money & Shopping 20, Health & Doctor 19, Numbers 100-1000 & Ordinals 18, Weather 13 |
| a2.1 | 423 | 423 | 271 | 246 | 423 | Work & Jobs, City & Directions, Furniture, Modal Verbs, Restaurant, Daily Routine, Weather, Transportation, Hobbies, Shopping 23, Media & Communication 22, Celebrations 22, Home & Moving 22, Health & Body 22, Travel & Holidays 22, Offices & Forms 22, Clothing & Appearance 22, Family & Relationships 21 (the unnumbered ones 25) |
| a2.2 | 373 | 373 | 224 | 195 | 373 | Emotions 25, Separable Verbs 25, Sports 25, Nature & Environment 25, Technology 25, Emergencies 24, Travel 24, Health 24, Housing 24, Transport Problems 21, Neighbours 21, Shopping & Payment 21, Learning & Exams 21, Personality 21, Household Chores 21, Kitchen 21, Prepositions 5 |
| b1.1 | 262 | 262 | 166 | 166 | 262 | Media & News 25, Events 25, Communication 25, Banking & Money 25, Reflexive Verbs 25, Education 24, Career & Applications 23, Relationships 23, Abstract Nouns 23, Animals 17, Opinions 16, Prepositions 11 |
| b1.2 | 261 | 261 | 149 | 149 | 261 | Feelings & Psychology 25, Culture 25, Verbs with Prepositions 25, Debates 25, Travel & Tourism 25, Environment & Climate 25, Conjunctions 25, Politics & Society 25, Health & Wellness 25, Technology & Internet 25, Animals 8, Prepositions 3 |
| b2.1 | 244 | 244 | 147 | 147 | 244 | Formal Expressions 25, Business & Economics 25, Arts & Literature 25, Passive Voice Verbs 25, Social Issues 25, Advanced Adjectives 25, Law & Justice 24, Academic & Research 24, Science & Innovation 22, Professional Communication 18, Prepositions 6 |
| b2.2 | 246 | 246 | 117 | 117 | 246 | Global Issues 25, Academic Writing 25, Advanced Connectors 25, Advanced Medicine 25, Psychology 25, Idioms 25, Negotiations 24, Subjunctive 24, Nuanced Synonyms 24, Philosophy & Ethics 24 |

Total 2,597 words, 2,561 with recorded audio. B-levels are thin (≈250 per half-level vs the ≈1,100 B1 / ≈1,600 B2
new words a Wortliste implies) — new courses will need new vocabulary, recorded later by the owner's Azure run.

## `speaking_missions` (all published) — title_de · target structures

- **a1.1** 1 Ankunft im Hostel (Alphabet, Grüße) · 2 Anmeldung im Bürgerbüro (sein, kommen aus, Beruf) · 3 Über Leute sprechen (Pronomen) · 4 Auf dem Flohmarkt (Genus, Was kostet) · 5 Im Klassenzimmer (der/die/das, Farben) · 6 Der erste Tag im Büro (ein/kein, brauchen) · 7 Freizeit und Hobbys (Präsens, gern) · 8 Ein Termin beim Arzt (um/am + Zeit) · 9 Im Café (möchte, haben) · 10 Am Bahnhof (Ja/Nein-Fragen, fahren) · 11 Mein Tag (trennbare Verben) · 12 Abschlussmission: Die Einladung
- **a1.2** 1 Anmeldung beim Hausarzt (Verbzweitstellung) · 2 Meine Familie (Nominativ) · 3 Einkaufen im Supermarkt (Akkusativ) · 4 Zugzeiten am Bahnhof (Zahlen bis 100, Uhrzeit) · 5 Nach dem Weg fragen (W-Fragen) · 6 Eine Einladung absagen (nicht/kein) · 7 Die Hausordnung (können/dürfen/müssen) · 8 Kaffee für das Team (für/ohne/um) · 9 Sprechen Teil 1: Sich komplett vorstellen · 10 Sprechen Teil 2: Wortkarten Essen & Trinken · 11 Sprechen Teil 2: Wortkarten Wohnen & Alltag · 12 Sprechen Teil 3: Bitten formulieren
- **a2.1** 1 Ein Paket verschicken (Dativobjekt) · 2 Der Weg zur Arbeit (Dativpräpositionen) · 3 Der Umzugstag (Wechselpräpositionen) · 4 Im Fundbüro (Possessivpronomen) · 5 Mein Tagesablauf (trennbare Verben) · 6 Mein Wochenende (Perfekt haben) · 7 Zurück von der Reise (Perfekt sein) · 8 Den Weg zur Wohnung erklären (Imperativ)
- **a2.2** 1 Anmeldung an der VHS (Reflexivverben) · 2 Ein Urlaub mit Problemen (war/hatte) · 3 Einen Handytarif wählen (und/aber/denn/sondern) · 4 Sich krankmelden (weil/dass/wenn/ob) · 5 Die Heizung ist kaputt (Nebensatzstellung) · 6 Zwei Wohnungen im Vergleich (Komparativ) · 7 Einen Wochenendtrip planen (Superlativ) · 8 Pläne für nächstes Jahr (Futur I)
- **b1.1** 1 Einen Vertrag kündigen (Genitiv) · 2 Wegen des Streiks zu spät (Genitivpräp.) · 3 Über die Berufserfahrung sprechen (Relativsatz Nom/Akk) · 4 Empfehlungen in deiner Stadt (Relativsatz Dat/Gen) · 5 Verhandlung mit dem Vermieter (würde) · 6 Rat für eine Freundin (wäre/hätte) · 7 Termin bei der Berufsberatung (zu-Infinitiv) · 8 Warum du nach Deutschland gekommen bist (um/ohne/statt … zu)
- **b1.2** 1 Den Ablauf erklären (Passiv Präsens) · 2 Einen Einbruch melden (Passiv Vergangenheit) · 3 Veränderungen im Betrieb (Verben mit Präp.) · 4 Auf dem Wochenmarkt (starke Adjektivendungen) · 5 Eine Reklamation im Geschäft (schwache/gemischte Adj.) · 6 Wie ich nach Deutschland kam (Präteritum) · 7 Anruf bei der Ausländerbehörde (indirekte Fragen) · 8 Das Team vorstellen (n-Deklination)
- **b2.1** 1 Projektnachbesprechung (Konj. II Vergangenheit) · 2 Bericht aus der Sitzung (Konj. I) · 3 Über einen Termin verhandeln (Passiversatz) · 4 Diskussion über steigende Mieten (Partizipien als Adj.) · 5 Eine Auswertung präsentieren (erweiterte Attribute) · 6 Eine Entscheidung verteidigen (Doppelinfinitiv) · 7 Reparaturen im Haus veranlassen (lassen) · 8 Formelle Anfrage bei der Behörde (Nominalisierung)
- **b2.2** 1 Homeoffice oder Präsenz (Konnektoren) · 2 Ein offenes Gespräch unter Freunden (Modalpartikeln) · 3 Geschäftliche Verhandlung (Funktionsverbgefüge) · 4 Zweifel an einem Gerücht (als ob, es sei denn) · 5 Streitgespräch über ein Tempolimit (komplexe Sätze) · 6 Dieselbe Nachricht, zwei Register · 7 Wo wir in zehn Jahren stehen werden (Futur II) · 8 Podiumsdiskussion über Sprache und Integration

## `listening_exercises` (title · type · seconds)

- a1.1: Im Supermarkt 228 · Im Restaurant und Café 327 · Am Bahnhof 278 · Beim Arzt 377 · Am Telefon 410 · Im Hotel 404 · (pending, no audio: Im Bürgerbüro, Familie und Sprachen, Im Deutschkurs, Hobbys am Wochenende, Nachrichten auf der Mailbox, Die Geburtstagsfeier)
- a1.2: Beim Einkaufen 347 · Wegbeschreibungen 356 · Im Büro 395 · Freizeitaktivitäten 388 · Wohnung und Haus 407 · Wetter und Jahreszeiten 354
- a2.1: Beim Arzt (erweitert) 475 · Im Restaurant bestellen 444 · Reisen und Verkehrsmittel 479 · Termine und Verabredungen 518 · Einkaufen im Alltag 540 · Nachrichten und Durchsagen (announcements) 309
- a2.2: Arbeit und Beruf 473 · Gesundheit und Fitness 486 · Kultur und Veranstaltungen 505 · Bank und Finanzen 517 · Behörden und Ämter 543 · Umwelt und Nachhaltigkeit 519
- b1.1: Arbeitswelt und Karriere 644 · Wohnungssuche und Umzug 623 · Gesundheitssystem 651 · Bildung und Weiterbildung 664 · Reiseplanung 660 · Nachrichten und Medien 494
- b1.2: Gesellschaft und Zusammenleben 618 · Technologie im Alltag 610 · Umwelt und Klimaschutz 638 · Beziehungen und Konflikte 622 · Recht und Gesetz 633 · Zukunftspläne und Träume 619
- b2.1: Wissenschaft und Forschung 718 · Wirtschaft und Globalisierung 706 · Medien und Journalismus 727 · Philosophie und Ethik 700 · Geschichte und Politik 702 · Kunst und Literatur 677
- b2.2: Psychologie und menschliches Verhalten 704 · Wissenschaftsphilosophie 677 · Globale Herausforderungen 682 · Sprache und Kommunikation 633 · Arbeitswelt der Zukunft 625 · Identität und Selbstbild 650

## `reading_lessons` (title · word count; all published)

- a1.1: Ich bin Anna 107 · Meine Familie 96 · Mein Tag 110 · Im Supermarkt 105 · Das Wetter heute 106 · Meine Stadt 91 · Farben und Kleidung 107 · Das Frühstück 95 · Anzeigen lesen (Prüfung Teil 2) 219 · Schilder und Aushänge (Teil 3) 90 · Eine E-Mail lesen (Teil 1) 78 · Der erste Tag im Büro 77
- a1.2: Meine Hobbys 103 · Essen und Trinken 108 · Einkaufen in Deutschland 118 · Meine Wohnung 112 · Eine E-Mail an eine Freundin 111 · Am Wochenende 111 · Mit dem Zug durch Deutschland 116 · Beim Bäcker 115 · Zwei kurze E-Mails (Teil 1) 117 · Anzeigen zu Wohnen und Arbeit (Teil 2) 217
- a2.1: Meine Reise nach Wien 133 · Beim Arzt 133 · Mein Beruf als Softwareentwickler 130 · Unterwegs in der Stadt 142 · Ein Abend im Restaurant 132 · Ein Umzug nach Hamburg 144 · Der Sportverein 143 · Wochenmarkt 132 · Lesen Teil 1: Zeitungstext 140 · Lesen Teil 3: E-Mail 131
- a2.2: Ein unvergessliches Erlebnis 127 · Meine Pläne für die Zukunft 131 · Wahre Freundschaft 145 · Wohnungssuche in Deutschland 148 · Medien und Nachrichten 143 · Deutsche Kultur und Traditionen 137 · Feste und Feiertage 142 · Gesund leben 142 · Lesen Teil 2: Informationstafel 105 · Lesen Teil 4: Anzeigen zuordnen 186
- b1.1: Die Kunst der Diskussion 380 · Umwelt und Nachhaltigkeit 402 · Work-Life-Balance 390 · Lebenslanges Lernen 373 · Zusammenleben in einer vielfältigen Gesellschaft 399 · Technologie im Alltag 392 · Deutschland verstehen: Geschichte und Identität 370 · Ehrenamt 356
- b1.2: Reisegeschichten: Südamerika 419 · Gesundheit und Wohlbefinden 408 · Karriere 404 · Geld und Finanzen 374 · Moderne Beziehungen 373 · Deutsche Küche 393 · Sport in Deutschland 391 · Kunst und Kultur 383
- b2.1: Künstliche Intelligenz 444 · Die Energiewende 467 · Zwischen Homeoffice und Büro 450 · Psychologie des Konsums 456 · Auswandern oder bleiben? 469 · Das deutsche Gesundheitssystem 445 · Stadt der Zukunft 434 · Wissenschaft im Alltag 438
- b2.2: Deutsche Literatur 494 · Ethik im 21. Jh. 537 · Globalisierung 516 · Philosophie des Geistes 536 · Geschichte und Erinnerung 504 · Recht und Gerechtigkeit 550 · Soziologie 473 · Kunstgeschichte 497 · Sprache und Denken 491 · Die Zukunft der Menschheit 547

## Business truth (`weekly_metrics`, latest row measured 2026-09-21 06:00 UTC)

Users 1,656 total (1,127 confirmed), 23 sign-ups in 7 days, 181 in 30 days. Course sales: 0 in the last 7 days,
2 all-time, €0 recorded revenue (sales_all 2, revenue_all 0 — the course sales so far were €0 orders).
Subscriptions: 5 paying, MRR €55.15, 1 at risk. AI usage 7 d: X-Ray 1,635, speaking 10, writing 0, exams 0.
Previous row (2026-09-07): 1,589 users, 55 sign-ups/7 d, MRR €45.16, 1 course sale (course_a1, €0).

## Search demand (DataForSEO Google Ads search volume, pulled 2026-09-27 by the orchestrator)

Average monthly searches (last 12 months); the API view returned the first 10 keywords of each batch.

Germany (location 2276, language de): deutschkurs online 2,400 (CPC €4.25, competition high) · online deutschkurs 2,400 ·
deutsch lernen a1 1,600 · deutsch lernen online 1,300 · deutsch lernen b1 1,300 · deutschkurs b2 online 1,000 (Sep peak 2,400) ·
deutschkurs b1 online 390 · deutschkurs a1 online 210 · deutschkurs a2 online 210 · goethe a1 vorbereitung 10.
India (location 2356, language en): german language course 27,100 · goethe a1 exam 27,100 (peak 40,500 in Jul 2026) ·
learn german online 3,600 · german course online 3,600 · goethe b1 exam 1,900 · goethe b2 exam 1,600 · german a1 course 1,300 ·
german b1 course 390 · german a2 course 320 · german b2 course 320.
Read: exam-named queries are large abroad (India: "goethe a1 exam" alone ≈ 27k/month), level-named course queries are
modest in Germany but expensive (CPC €2.65–4.25) — the buyer abroad with an exam date is the volume, B2 is the biggest
level-named course query inside Germany.
