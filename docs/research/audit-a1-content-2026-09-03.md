# A1 content audit — deutsch-meister.de (A1.1 + A1.2), 2026-09-03

Sources read: `grammar-content-cache.json` (16 A1 topics, 128 rules, 177 examples, 176 exercises), Supabase tables `reading_lessons`, `listening_*`, `words`, `sentences`, `speaking_missions`, plus `src/data/writingTasks.js`, `src/data/mockExams/`, `src/data/levelTestQuestions.json`. Nothing was modified.

## 1. Grammar (16 topics)

**Volume.** 16 topics x 15–20 min = ~5 hours of instruction. A Goethe A1 course is ~80–100 Unterrichtseinheiten. This is a grammar reference with quizzes, not yet a course.

**Sequencing.** Reasonable spine (gender → articles → pronouns → sein → haben → ein/eine → Präsens → V2 → Nom → Akk → Zahlen → W-Fragen → Negation → Modalverben → Akk-Präpositionen), but three things a beginner needs on day one arrive late or never:
- `alphabet-pronunciation` is A1.1 #5 while speaking mission A1.1 #1 ("spell your name for the receptionist") requires it, and `verb-sein` (#4) already assumes "Ich bin 25 Jahre alt".
- `numbers-counting` is A1.2 #4, *after* the accusative. Age, prices, phone numbers are lesson-one material; the sein lesson uses numbers it has not taught.
- `question-words` is A1.2 #5, but "Wie heißt du? / Woher kommen Sie?" are the example sentences of A1.1 #3.

**Core A1 grammar that is absent from A1 entirely** (all deferred to A2.1 in the cache): possessive articles (mein/dein — used in ~30 A1 example sentences, e.g. "Ich liebe meinen Vater", and in five mission hint lists), separable verbs (the A1.1 reading "Mein Tag" is built on "stehe … auf, räume … auf, rufe … an, schlafe … ein"), stem-changing verbs, Ja/Nein-Fragen with verb-first (tested in verb-sein: "___ du Student?" → Bist, never taught), the imperative (Goethe A1 Sprechen Teil 3 is literally "Bitten formulieren"), Uhrzeit/dates/ordinals, dative after aus/mit/zu ("Ich komme aus Deutschland", "mit der U-Bahn" both appear in A1 texts), and Perfekt of common verbs (Goethe A1 lists it).

**Per-topic findings**

| Topic | Rules OK? | Concrete issue |
|---|---|---|
| nouns-gender | mostly | "der Bmw" (typo for BMW); "Ge- prefix ~90% neuter" is overstated (der Gedanke, die Gefahr, die Geschichte, der Geruch); motorcycle brands / ship names are trivia for lesson 1. Example "Die Möglichkeit ist groß." is not natural German. 7 of 15 exercises are meta ("What is the best way to learn gender?"). |
| definite-articles | yes | Solid. Exercises test the rule. |
| personal-pronouns | yes, one garble | Rule text: "German has no word for it for people. He (er) and she (sie) are used based on the grammatical gender of the noun." — garbled; a learner will read it as "there is no *es*". Exercise "Du sprichst mit deinem Freund" uses a stem-change and a dative possessive before either exists. |
| verb-sein | complete | All six forms + Sie ✓, ihr seid ✓. 8/8 exercises are the same fill-blank drill. |
| alphabet-pronunciation | thin | No actual alphabet (letter names a, be, ce … needed for Buchstabieren), no long/short vowel, no final devoicing (Tag, und), no -ig. **A pronunciation lesson with zero audio** (0/177 A1 grammar examples have `audio_url`). |
| verb-haben | complete | Good; "Hunger/Durst/Recht haben" chunks are exactly right. |
| indefinite-articles | yes | Correctly teaches "Ich bin Student" (no article) and flags "Ich bin ein Student" as WRONG — then `nominative-case` two topics later presents "Er ist ein Lehrer. / Sie ist eine Ärztin." as *correct* and drills "Sie wird ___ Ingenieurin → eine". Natural German is "Sie wird Ingenieurin". The two topics contradict each other. |
| present-tense-regular | incomplete | Only -e/-st/-t/-en/-t/-en. No mention that stem changes exist (sprechen, essen, fahren, lesen, schlafen, nehmen — all nine are in the A1.2 "Common Verbs" word list with examples like "Das Kind schläft"), no -t/-d stems (arbeiten → du arbeite**st**, er arbeite**t**; mission A1.1 #8 hints "ich arbeite" and asks for four conjugated forms), no -s/-ß/-z stems (heißen → du heiß**t**, the most-used verb in the course). A learner who follows the rule produces "du arbeitst", "du heißst". |
| basic-sentence-structure | yes for V2 | Exercise "Gestern ___ wir ins Kino → **gingen**" — Präteritum of gehen in A1.2 lesson 1; the distractor "gehen" is what an A1 learner will pick. Examples use "Gestern war …", "Diesen Film muss ich sehen" (modals come three topics later), rule text cites "Morgen werde ich gehen" (Futur). Ja/Nein-Fragen (verb first) are not covered. |
| nominative-case | yes | 8 of 15 exercises are terminology ("Wie fragt man nach dem Nominativ?", options include "Das Buch des Mannes" — genitive at A1). Contradiction with job-article rule (above). |
| accusative-intro | good | Correct and well-scoped. Best topic. |
| numbers-counting | thin | Description promises "cardinal and ordinal numbers" — there are no ordinals. No 101–1000, no prices ("2,50 € = zwei Euro fünfzig"), no Uhrzeit, no dates. All 8 exercises are "Wie sagt man 45?" multiple choice. |
| question-words | good | Accurate; the "Wie heißt du vs Was ist dein Name" note is well judged. |
| negation | good | nicht/kein rule and position are correct. |
| modal-verbs-intro | over-scoped | Description says "können, müssen, wollen, möchten"; the lesson teaches all six plus mögen/möchten merged in one column. Exercise "Er mußt heute kommen → mußt → muss" mixes an old-spelling error with a conjugation error. Otherwise correct. |
| prepositions-accusative | good | Correct. Examples slip into Präteritum/Perfekt ("Das Auto fuhr gegen einen Baum", "Ich habe es durch das Fenster gesehen"). |

**Exercises.** 176 total (A1.1: 77, A1.2: 99), 8 or 15 per topic; 96 multiple_choice + 80 fill_blank, but **every fill_blank ships 3–4 options**, so all 176 are recognition tasks — zero typed production, zero sentence ordering, zero listening-based items. Roughly 30 are meta/terminology questions in English. No "correct answer" is factually wrong; three are pedagogically wrong for the level (gingen; eine Ingenieurin; spricht man). Translations are correct; several are literal glosses ("In Berlin live I") presented as English.

## 2. Reading (16 texts)

All 16 have 5–6 open comprehension questions with model answers (no auto-checkable format). Word counts — A1.1: 232, 269, 272, 137, 132, 145, 141, 123; A1.2: 275, 284, 289, 284, 157, 158, 162, 165.

Two authoring batches are visible. The short ones (Supermarkt, Wetter, Meine Stadt, Kleidung, Frühstück, E-Mail, Wochenende, Zug, Bäcker; 123–165 words) are well-pitched A1: present tense, short sentences, familiar scenes; "Beim Bäcker" and "Eine E-Mail an eine Freundin" are genuinely good models. The long ones (230–290 words) are A2: A1.1 text #1 "Ich bin Anna" — the first thing a beginner reads — contains "weil ich Spanien liebe", "Nach dem Sport fühle ich mich gut", "Es gibt viel zu sehen und zu tun", "Ich möchte Ärztin werden". "Meine Familie": "älter als ich", "hilft mir bei den Hausaufgaben". "Meine Hobbys" (A1.2 #1): Perfekt twice ("Letzte Woche haben wir Pizza gemacht", "sind wir 50 Kilometer gefahren"). "Einkaufen in Deutschland": "Ich versuche, bewusst einzukaufen", "Nachhaltiges Einkaufen", brand names H&M/Zara. Goethe A1 Lesen texts are 50–100 words.

No factual/language errors found (the Bäcker arithmetic 15,00 − 13,40 = 1,60 is right). Missing exam text types entirely: Anzeigen (Lesen Teil 2), Schilder/Aushänge (Teil 3), short notes/SMS. No text on Arzt, Beruf, Termine.

## 3. Listening (12 exercises)

Each: 10 short dialogues (avg 4–8 lines), **one** question per dialogue (MC with 3 options or Richtig/Falsch), one combined MP3 per exercise (228–410 s) at −20 % (A1.1) / −15 % (A1.2), 2 plays allowed. Per-dialogue `audio_url` is null for all 120 dialogues, so replaying one dialogue depends on the player seeking inside the long file. Themes (Supermarkt, Restaurant, Bahnhof, Arzt, Telefon, Hotel, Kleidung, Weg, Büro, Freizeit, Wohnung, Wetter) map well onto Goethe Hören Teil 1–3; "Am Telefon" even includes an Ansage ("Sie haben die Eins gewählt … Bitte bleiben Sie in der Leitung") and a password with digits. Language is mostly A1; 23 of 760 lines are above it: "Können Sie ihm sagen, dass ich morgen nicht kommen kann?", "Hier hat es die ganze Woche geregnet", "Ich habe ein Zimmer in einer WG gefunden", "Wie wäre es mit Donnerstag?". "Im Büro" (Meetings, IT-Abteilung, Konferenzraum) is an A2 setting. Thin comprehension load: one item per ~6-line dialogue; no number/time dictation.

## 4. Vocabulary (472 words: 225 + 247)

20 categories of ~25. **Covered:** greetings, question words, sein/haben chunks, classroom objects, colours, days, immediate + extended family, numbers 1–100, pronouns, yes/no adverbs, adjectives, body parts, clothes, 25 verbs, food, rooms, months/seasons, time expressions.
**Missing vs. the Goethe A1 Wortliste:** Länder/Sprachen/Nationalitäten (none — yet "sich vorstellen" is exam part 1), Beruf/Arbeit, Geld/Preise/bezahlen, Verkehr/Reisen (Zug, Bahnhof, Fahrkarte, Bus), Orte in der Stadt (Post, Bank, Apotheke), Gesundheit/Arzt (Termin, Schmerzen), Möbel (Bett, Sofa, Schrank), Freizeit/Hobbys, Getränke (no Kaffee, Tee, Wasser, Bier — only Saft, Milch, Getränk), Uhrzeit (only "halb"; no Viertel, Uhr phrases), Formular words (Adresse, Postleitzahl, Geburtsdatum, Unterschrift — needed for Schreiben Teil 1), hundreds/tausend, ordinals.
**Data quality:** 100 % have an example sentence; nouns carry article + plural. But 31 rows store the article inside `german` ("die Frage" + article "die" — risk of "die die Frage" in the UI), plural formatting is inconsistent ("Antworten" vs "die Dienstage"), 12 uncountables carry the literal string **"null"** as plural (Hunger, Durst, Milch, Obst, Reis … will render the word "null"), and "Personal Pronouns" has 7 entries with no Sie. **0 of 472 words and 0 of 240 sentences have audio**, while `VocabularySectionPage.jsx` advertises "audio pronunciation". Some examples exceed the level ("Das Kind schläft schon seit acht", "Ich bin seit zwei Jahren hier").

## 5. Speaking missions (16)

Well designed: each is tied to one grammar topic, has an AI role, opening line, hint words and a checkable pass criterion (e.g. "uses haben correctly at least three times, including one Haben Sie…? question"). Only 2 of 16 are free.
Mapping to Goethe A1 Sprechen: **Teil 1 (sich vorstellen + buchstabieren + Telefonnummer)** — mission A1.1 #1 (spelling) and #6 (Nachbarn: name, origin, job) cover it partially; age, languages, hobbies never asked. **Teil 2 (Informationen erfragen/geben per Kärtchen)** — #3 Supermarkt, A1.2 #4 Bahnhof, #5 Wegbeschreibung come close but never in the W-Frage-to-a-partner format. **Teil 3 (Bitten formulieren mit Bildkarten)** — nothing; the imperative is not taught until A2.1. Sequencing problems: mission #1 needs the alphabet (topic #5); AI opening lines outrun the syllabus ("Waren Sie schon einmal bei uns?" — Präteritum, A1.2 lesson 1; "Haben Sie die Hausordnung schon gelesen?" — Perfekt).

## 6. What is missing for an exam-ready A1 course

- **Writing:** `writingTasks.js` has 4 tasks, all telc_b1/telc_b2. Zero A1 tasks; no Formular ausfüllen (Schreiben Teil 1), no kurze Mitteilung/E-Mail with Leitpunkte (Teil 2). The A1.2 e-mail reading text is the only model.
- **A1 mock exam:** `MOCK_EXAMS` = telc_b1, goethe_b1, dtz, telc_b2. None for A1.
- **Numbers/dates/time drills:** none. Uhrzeit is not taught anywhere; the word list has "halb" and nothing else.
- **Day-by-day plan:** none; the level page is a topic list.
- **Placement check:** the level test exists (80 items, 20 per CEFR level, with listening and speaking parts). It places A1 vs A2, not A1.1 vs A1.2 — acceptable as an entry gate.
- **Final assessment:** none. No end-of-A1.1 or end-of-A1 test, no certificate-style score.
- **Audio:** none on vocabulary, sentences or grammar examples; only the 12 listening files.

## 7. Verdict

| Area | Quality | What it takes to fix | Effort |
|---|---|---|---|
| Grammar: definite/indefinite articles, sein, haben, accusative, negation, W-words, Akk-Präp | good | Minor: remove out-of-level examples, fix "der Bmw", garbled pronoun sentence | 3 h |
| Grammar: nouns-gender, nominative, modals | thin | Cut meta quizzes, resolve the job-article contradiction, trim modals to 4 | 6 h |
| Grammar: present-tense-regular | wrong-by-omission | Add -t/-d and -s/-ß stems, name stem changes, a new "unregelmäßige Verben (sprechen, essen, fahren, lesen, nehmen)" topic | 8 h |
| Grammar: alphabet, numbers | thin | Real alphabet with letter names + audio; ordinals, 100–1000, prices, Uhrzeit, Datum | 12 h |
| Grammar: missing topics (Possessivartikel, trennbare Verben, Ja/Nein-Fragen, Imperativ, aus/mit/zu, Perfekt-Einstieg) | missing | 5–6 new topics at the existing 8–15-exercise depth | 30 h |
| Exercises overall | thin | Add typed production, word-ordering, dictation; ≥25 items/topic | 40 h |
| Reading | mixed | Rewrite the 7 long texts to ≤120 words; add Anzeigen/Schilder/Mitteilungen sets; make questions auto-checkable | 20 h |
| Listening | good | Add 2–3 questions per dialogue, number/time items, per-dialogue audio cuts | 15 h |
| Vocabulary | thin | Add ~250 words in the missing themes; fix "null" plurals, article-in-word rows; record audio (TTS) | 25 h |
| Speaking | good | Add Teil-3 (Bitten) missions and a full Teil-1 self-introduction mission; reorder #1 after alphabet | 6 h |
| Writing tasks | missing | 6 Formular + 6 Mitteilung tasks with rubric in the grader | 12 h |
| A1 mock exam | missing | One Goethe-A1-style Kurzversion (Hören/Lesen/Schreiben/Sprechen) on the existing runner | 20 h |
| Plan + final assessment | missing | 30-day plan, end-of-level test | 10 h |

**Summary.** Sold as "the best A1 course" today, this would not survive contact with a learner preparing for Start Deutsch 1: it is a competent A1 grammar reference (about five hours of it) with good listening dialogues and well-built speaking missions, wrapped around a vocabulary list with no audio and reading texts half of which are A2. The three biggest gaps: (1) the grammar syllabus skips what A1 examinees are actually tested on — possessives, separable and stem-changing verbs, Ja/Nein-Fragen, imperative, Uhrzeit — and its one verb-conjugation lesson would teach a learner to say "du arbeitst"; (2) there is no writing strand and no A1 mock exam at all, so "exam-ready" cannot be claimed; (3) every exercise in the course is multiple choice, including the ones labelled fill-blank, so nothing ever requires the learner to produce German. Roughly 200 hours of content work separates the current state from an honest "complete A1 course"; the listening, speaking and accusative/negation material are the parts worth keeping as they are.
