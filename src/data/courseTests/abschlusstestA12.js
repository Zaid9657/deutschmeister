// Abschlusstest A1.2 — the end-of-course test of the A1.2 course.
//
// HONESTY CONTRACT (same as the other mock modules under
// src/data/mockExams/): this is our own course-completion test, written in
// the STYLE of Goethe-Zertifikat A1 / Start Deutsch 1 — never official exam
// material. Whatever surface renders this module must also render
// MOCK_DISCLAIMER_DE (see src/data/examTracks.js) and label every score a
// Richtwert, not an official result. "Kurzversion" stays in the title
// because this is a half-length pass at the SD1 format, not the full
// Start-Deutsch-1-format practice exam the learner meets again once A1.2
// is done.
//
// Shape: identical to src/data/mockExams/goetheA1.js (examKey, title, intro,
// passPercent, sections[{key,title,minutes,instructions,parts[]}] with part
// types listening/mc-group/writing) — see src/services/examScoring.js for
// how the objective sections are scored and tests/exams.test.mjs (~140-285)
// for the shape/content guards every mock, and every course test, must
// satisfy.
//
// Registry note: this module lives OUTSIDE src/data/mockExams/index.js's
// MOCK_EXAMS map, same as abschlusstestA11.js. It is registered in
// src/data/courseTests/index.js's COURSE_TESTS array (key 'a1_2_abschluss',
// slug 'abschlusstest-a1-2', level 'a1.2'), and the exam_attempts CHECK is
// widened by migrations/2026-09-05-a1-2-abschlusstest.sql —
// tests/exams.test.mjs scans every migrations/*abschlusstest*.sql file and
// asserts the newest one's CHECK list carries every COURSE_TESTS key.
//
// Content scope: A1.2 only. May use ALL A1.2 grammar per
// S/wave3/level-a1.2.md, including the four new topics this wave adds
// (imperative, stem-changing verbs, Perfekt with the taught verb list,
// dative prepositions) — nothing here is on that file's banned list.
//
// Hören reuses ONE existing A1.2 listening exercise: #4 Freizeitaktivitäten
// (live id ed793dfa-d834-4207-a940-1fe70968dd61) — NOT #2 Wegbeschreibungen
// (e4a3fa9b-144d-4a9a-af93-a8c3ce101bc5, round-1's pick): #2 is the exact
// exercise src/data/mockExams/goetheA1.js's own hoeren-2 already uses
// ("Nach dem Weg fragen"), and this module's own intro hands the learner
// straight into that mock next, so reusing #2 here would mean the identical
// MP3 and the identical items twice in one sitting-pair, with a third of
// the full mock pre-answered. #5 Wohnung und Haus (3771d89f-0ef2-48c1-80c2-
// d3cf72c7e288) was also weighed and leans on Wechselpräpositionen beyond
// this file's frozen-chunk list — its live transcript (verified 2026-09-05,
// listening_dialogues for 3771d89f-...) has "Das Bett steht an der Wand",
// "Der Schreibtisch steht am Fenster", "Möbel für mein Wohnzimmer". #4 is
// unused by any mock (goetheA1Mock takes A1.2 #2, abschlusstestA11 takes
// A1.1 #3) and its own live transcript (verified against the same table for
// ed793dfa-...) — "Ich spiele Fußball und gehe oft ins Kino", "Ich mache
// Krafttraining und laufe auf dem Laufband", "Zweimal pro Woche"/"dreimal
// pro Woche" — is everyday A1 free-time lexis with a genuine frequency/time
// comprehension load. It does NOT carry this wave's dative-preposition
// topic; this file's own Lesen text supplies that instead (seit/von/
// zu(m)/bei/mit).
//
// Runner fact (measured 2026-09-05, not assumed): useExerciseDetails() in
// src/hooks/useListening.js loads ALL listening_questions rows for the
// exercise_id (ordered by question_number only — no .range()/.limit()).
// Since Wave 2/3 every A1 listening exercise carries 23 questions (10
// original + 13 added, incl. dictation), so a listening part that rendered
// them all would present 23 Hören items against 8 Lesen items. This part
// therefore carries questionMax: 10 — the runner's MockListeningPart passes
// its questions through selectListeningQuestions() (src/data/courseTests/
// listeningQuestions.js), which keeps only question_number <= questionMax,
// ordered, for BOTH rendering and score registration, so the test stays at
// the measured 10-item ratio. tests/exams.test.mjs pins that every listening
// part of every course test carries a numeric questionMax and that the
// runner calls the helper — without both, the field is a silent no-op.
// minutes: 15 for Hören is the measured 2-play/10-item timing
// abschlusstestA11 already established (7.6-13.7 min audio + reading), not
// a projection onto a bigger item count.
//
// Runtime and weighting: 15 (Hören) + 15 (Lesen) + 10 (Schreiben) = 40 min
// total, clearly under the full mock's 60 — the intro's "nur die halbe
// Länge" is true on both time and items (10 Hören + 8 Lesen here vs. 20 + 15
// in goetheA1Mock). Score weighting is 10 Hören : 8 Lesen (56% Hören),
// matching abschlusstestA11's own 10:8 ratio and its header's reasoning
// against overweighting Hören.
//
// Lesen and Schreiben are freshly written for this half-length test: 8
// Lesen items across three parts (Teil 1 E-Mail richtig/falsch x3, Teil 2
// two Anzeigen-Situationen x1 each, Teil 3 Schilder richtig/falsch x3 — 3
// richtig/3 falsch held across the six r/f items) and 1 Schreiben part
// (Teil 2 style: kurze Mitteilung mit drei Leitpunkten, ca. 30 Wörter) — vs.
// the full mock's 15 items / 2 parts. The Teil 2 Anzeigen themes (Fahrrad,
// Job) are new versus abschlusstestA11's (Deutschkurs, Zimmer). The Teil 1
// E-Mail is this wave's step up over A1.1: it carries one on-list Perfekt
// ("angerufen"), a dative-preposition phrase ("seit Montag"; zum/bei/von
// also appear elsewhere in Lesen), and an imperative ("Bitte rufen Sie
// vorher an"), and every key stays decidable from the text alone —
// re-solved cold after every edit in this file (see notes.md).
//
// Grammar actually used in THIS file's test-content strings (Lesen texts/
// items, Hören label, Schreiben task/criteria — NOT the shared intro/
// section-instructions boilerplate, see the last paragraph): modal
// können/sollen/möchte- (already-live A1.2), the separable verb anrufen
// (A1.1), du- and Sie-imperative ("Schreib", "Nenne" — Schreiben task;
// "Bitte rufen Sie ... an", "Bitte Gleis 5 benutzen" — Lesen text/items;
// new topic imperative), the a->ä stem change in "fährt" (l3-1, new topic
// stem-changing verbs), Perfekt with haben + a taught Partizip II
// ("hat ... angerufen", Lesen Teil 1; "hast ... geschrieben" x3,
// Schreiben-Selbstcheck — all on level-a1.2.md's perfekt-intro list), the
// dative prepositions von/mit/bei/zu(m)/seit incl. the zum contraction (new
// topic dative-prepositions-intro), and the already-allowed accusative
// prepositions für/ohne/um. None of the following appear in that
// test-content: Nebensätze (dass/weil/wenn/ob/als/obwohl, or an embedded
// indirect question), Konjunktiv beyond möchte-, Passiv, Genitiv, a
// sich-reflexive verb, an attributive adjective after an article, Perfekt
// of any verb off the taught list, or a sentence over 12 words. This claim,
// like the sibling's, says nothing about the reused Hören audio, which is
// A1.2 course content produced elsewhere and not re-certified here, and —
// mirroring the sibling's own precedent — does not extend to the intro/
// section-instructions copy mirrored from goetheA1.js/abschlusstestA11.js
// below (e.g. the "damit du das Prüfungsformat ... kennenlernst" sentence,
// or "Lies" in the Lesen section's own instructions) — that is
// administrative copy describing the test, not exam content the learner is
// tested on.

export const abschlusstestA12 = {
  examKey: 'a1_2_abschluss',
  courseLevel: 'a1.2',
  formatOf: 'goethe_a1',
  title: 'Abschlusstest A1.2 (Kurzversion im Start-Deutsch-1-Format)',
  intro:
    'Das ist der Abschlusstest deines A1.2-Kurses. Er hat den Aufbau der echten Prüfung Start Deutsch 1, aber nur ' +
    'die halbe Länge, damit du das Prüfungsformat schon früh kennenlernst. Dieser Test ist eigenes Übungsmaterial ' +
    'von DeutschMeister und keine offizielle Prüfung. Wie bei der echten Prüfung bestehst du ab 60 % der ' +
    'bewerteten Aufgaben. Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier. Dein A1.2-Kurs endet ' +
    'hier — als Nächstes wartet die vollständige Übungsprüfung im Start-Deutsch-1-Format.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions: 'Eine Hörübung zum Thema Freizeit. Du darfst die Aufnahme zweimal abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext · Freizeit',
          level: 'A1.2',
          exerciseNumber: 4,
          questionMax: 10,
        },
      ],
    },
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 15,
      instructions:
        'Teil 1: Lies die E-Mail und entscheide: richtig oder falsch? Teil 2: Lies die Situation und die zwei ' +
        'Anzeigen. Welche Anzeige passt? Teil 3: Lies die Schilder und entscheide: richtig oder falsch?',
      parts: [
        {
          key: 'lesen-1',
          type: 'mc-group',
          label: 'Teil 1 · E-Mail',
          text:
            'Sehr geehrter Herr Busch, meine Heizung ist seit Montag kaputt. Es ist sehr kalt. Ich habe schon ' +
            'zweimal angerufen. Können Sie bitte einen Handwerker schicken? Ich bin am Montag und Mittwoch zu ' +
            'Hause. Bitte rufen Sie vorher an. Vielen Dank und freundliche Grüße, Nina Falk',
          items: [
            {
              id: 'l1-1',
              prompt: 'Nina hat schon angerufen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'l1-2',
              prompt: 'Der Handwerker soll am Dienstag kommen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l1-3',
              prompt: 'Herr Busch soll vorher anrufen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
          ],
        },
        {
          key: 'lesen-2a',
          type: 'mc-group',
          label: 'Teil 2 · Situation 1',
          text:
            'Frau Roth sucht ein Fahrrad. Sie bezahlt maximal 100 Euro.\n' +
            'Anzeige a) Fahrrad — gebraucht, 90 €, sofort abholen.\n' +
            'Anzeige b) Fahrrad — neu, 180 €, mit Rechnung.',
          items: [
            {
              id: 'l2a-1',
              prompt: 'Welche Anzeige passt?',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'a',
            },
          ],
        },
        {
          key: 'lesen-2b',
          type: 'mc-group',
          label: 'Teil 2 · Situation 2',
          text:
            'Herr Vogel sucht einen Job für den Abend. Er möchte mindestens 10 € pro Stunde.\n' +
            'Anzeige a) Job im Büro — vormittags, 14 € pro Stunde.\n' +
            'Anzeige b) Job als Kellner — abends, 11 € pro Stunde.',
          items: [
            {
              id: 'l2b-1',
              prompt: 'Welche Anzeige passt?',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'b',
            },
          ],
        },
        {
          key: 'lesen-3',
          type: 'mc-group',
          label: 'Teil 3 · Schilder und Aushänge',
          items: [
            {
              id: 'l3-1',
              prompt: 'Schild: „Gleis 3 gesperrt. Bitte Gleis 5 benutzen.“ — Der Zug fährt nicht von Gleis 3.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'l3-2',
              prompt: 'Schild: „Sprechstunde nur mit Termin.“ — Man kann ohne Termin zum Arzt gehen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l3-3',
              prompt:
                'Schild: „Schwimmbad: täglich 7–22 Uhr geöffnet. Letzter Einlass 21 Uhr.“ — Das Schwimmbad ' +
                'schließt um 21 Uhr.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
          ],
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schreiben',
      minutes: 10,
      instructions:
        'Kurze Mitteilung: Schreib deine Antwort in das Textfeld. Diese Aufgabe wird nicht automatisch bewertet — ' +
        'nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Teil 2 · Mitteilung',
          task:
            'Du kannst morgen nicht zum Termin bei deiner Ärztin kommen. Schreib eine Mitteilung (ca. 30 Wörter) ' +
            'an die Praxis. Nenne diese drei Punkte: Warum kannst du nicht kommen? Wann hast du Zeit? Schreib ' +
            'auch eine Entschuldigung.',
          criteria: [
            'Du hast alle drei Punkte geschrieben: Grund, Termin, Entschuldigung.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du hast kurze Sätze und die Wörter richtig geschrieben.',
          ],
        },
      ],
    },
  ],
};
