// Abschlusstest A1.1 — the end-of-course test of the A1.1 course.
//
// HONESTY CONTRACT (same as the other mock modules under
// src/data/mockExams/): this is our own course-completion test, written in
// the STYLE of Goethe-Zertifikat A1 / Start Deutsch 1 — never official exam
// material. Whatever surface renders this module must also render
// MOCK_DISCLAIMER_DE (see src/data/examTracks.js) and label every score a
// Richtwert, not an official result. "Kurzversion" stays in the title
// because this is a half-length pass at the SD1 format, not the full
// Start-Deutsch-1-format practice exam the learner meets again at the end
// of A1.2.
//
// Shape: identical to src/data/mockExams/goetheA1.js (examKey, title, intro,
// passPercent, sections[{key,title,minutes,instructions,parts[]}] with part
// types listening/mc-group/writing) — see src/services/examScoring.js for
// how the objective sections are scored and tests/exams.test.mjs (~140-195)
// for the shape/content guards every mock must satisfy.
//
// Registry note: this module lives OUTSIDE src/data/mockExams/index.js's
// MOCK_EXAMS map. It is a course-completion test, not a per-exam-track mock,
// and the integrator wires examKey 'a1_1_abschluss' into a separate
// course-test registry.
//
// Content scope: A1.1 only. Hören reuses one existing A1.1 listening
// exercise: #3 Bahnhof (Ansage, Zeiten, Gleise, Preise — Hören Teil 1/2
// style; theme order per docs/research/audit-a1-content-2026-09-03.md §3).
// Only one Hören part, deliberately: each A1.1 listening exercise is one
// combined ~4-minute MP3 of 10 short dialogues (10 scorable items), so a
// second exercise would roughly double the section's audio time against a
// 15-minute timer built for one exercise, and 10 Hören points against this
// test's 8 Lesen items is already the section weighting the full mock's
// two-exercise Hören section holds relative to its 15 Lesen items — adding
// a second exercise here would overweight Hören well past that ratio.
// Lesen and Schreiben are freshly written for this half-length test at 8
// Lesen items / 1 Schreiben part (vs. the full mock's 15 items / 2 parts).
//
// Grammar ceiling for the strings authored in THIS file: present tense,
// sein/haben, possessives, separable verbs, ja/nein-Fragen, Uhrzeiten,
// Wochentage, Daten, Zahlen. The one modal form is „möchte" (taught) in the
// two Teil-2 situations. No Perfekt/Präteritum, no Nebensätze, no
// Konjunktiv, no Passiv, no sentence over 9 words in any Hören/Lesen text.
// This is a claim about the strings below only — it says nothing about the
// reused A1.1 listening-exercise audio itself.
//
// 2026-10-07 (Codex all-aspects review): every text the learner must
// UNDERSTAND to answer — the note, the situations and Anzeigen, the Schilder
// and their statements, the form data — uses only words the twelve Lektionen
// teach (checked with `untaughtTokens` from scripts/validate-curriculum.mjs;
// names excepted). The exam's own task words (Anzeige, Schild, richtig/falsch,
// Formular, Textfeld) stay: they are the format, as in the real test. Every
// instruction speaks Sie, like the rest of the course.

export const abschlusstestA11 = {
  examKey: 'a1_1_abschluss',
  courseLevel: 'a1.1',
  formatOf: 'goethe_a1',
  title: 'Abschlusstest A1.1 (Kurzversion im Start-Deutsch-1-Format)',
  intro:
    'Das ist der Abschlusstest Ihres A1.1-Kurses. Er hat den Aufbau der Prüfung Start Deutsch 1, aber nur ' +
    'die halbe Länge, damit Sie das Prüfungsformat schon früh kennenlernen. Dieser Test ist eigenes Übungsmaterial ' +
    'von DeutschMeister: keine offizielle Prüfung, kein Zertifikat über ein Sprachniveau. Wie bei der echten Prüfung ' +
    'bestehen Sie ab 60 % der bewerteten Aufgaben. Sprechen üben Sie im Speaking-Missions-Trainer, nicht hier. Wenn Sie bestehen, geht ' +
    'es weiter mit A1.2 und später mit der vollständigen Übungsprüfung im Start-Deutsch-1-Format.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions: 'Eine Hörübung mit 10 kurzen Dialogen und Durchsagen; Sie dürfen die Aufnahme zweimal abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext · Am Bahnhof',
          level: 'A1.1',
          exerciseNumber: 3,
          // Written when the exercise had 10 questions; since Wave 2 PR C it
          // carries 23 (+13 incl. dictation). The runner keeps only
          // question_number <= questionMax (src/data/courseTests/
          // listeningQuestions.js), so the 10 : 8 Hören/Lesen weighting the
          // header argues for stays true.
          questionMax: 10,
        },
      ],
    },
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 15,
      instructions:
        'Teil 1: Lesen Sie die Notiz und entscheiden Sie: richtig oder falsch? Teil 2: Lesen Sie die Situation und ' +
        'die zwei Anzeigen. Welche Anzeige passt? Teil 3: Lesen Sie die Schilder und entscheiden Sie: richtig oder falsch?',
      parts: [
        {
          key: 'lesen-1',
          type: 'mc-group',
          label: 'Teil 1 · Notiz',
          text:
            'Liebe Lena, am Samstag ist meine Party. Sie ist um 15 Uhr bei mir zu Hause. Bring bitte ' +
            'deine Schwester mit. Wir haben Kuchen und Tee. Ruf mich bitte an. Bis Samstag! Deine Freundin Mia',
          items: [
            {
              id: 'l1-1',
              prompt: 'Die Party ist am Samstag.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'l1-2',
              prompt: 'Die Party ist um 16 Uhr.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l1-3',
              prompt: 'Mia lädt auch die Schwester von Lena ein.',
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
            'Frau Kaya hat nur am Dienstag und Donnerstag Zeit. Sie möchte Deutsch lernen.\n' +
            'Anzeige a) Deutsch lernen — Montag und Mittwoch, 18 Uhr, Berlin.\n' +
            'Anzeige b) Deutsch lernen — Dienstag und Donnerstag, 18 Uhr, Berlin.',
          items: [
            {
              id: 'l2a-1',
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
          key: 'lesen-2b',
          type: 'mc-group',
          label: 'Teil 2 · Situation 2',
          text:
            'Herr Weber möchte einen Tisch. Er hat nur 30 Euro.\n' +
            'Anzeige a) Tisch, 25 Euro.\n' +
            'Anzeige b) Tisch, 35 Euro.',
          items: [
            {
              id: 'l2b-1',
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
          key: 'lesen-3',
          type: 'mc-group',
          label: 'Teil 3 · Schilder und Aushänge',
          items: [
            {
              id: 'l3-1',
              prompt: 'Schild im Büro: „Pause: 12 bis 13 Uhr.“ — Die Pause ist um 14 Uhr.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l3-2',
              prompt: 'Schild am Bahnhof: „Bitte an Gleis fünf umsteigen!“ — Man steigt an Gleis fünf um.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'l3-3',
              prompt: 'Schild am Bahnhof: „Der Zug nach Berlin kommt um 10:20 Uhr.“ — Der Zug kommt um 10 Uhr.',
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
        'Formular ausfüllen: Schreiben Sie die fünf Angaben untereinander in das Textfeld. Diese Aufgabe wird nicht ' +
        'automatisch bewertet — nutzen Sie den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Teil 1 · Formular',
          task:
            'Ihre Freundin heißt Aylin Demir. Ihre Tochter Elif möchte schwimmen lernen. Der Familienname ist ' +
            'Demir, der Vorname ist Elif. Das Geburtsdatum ist der 12. Mai 2016. Die Adresse ist Rosenweg 9. ' +
            'Die Telefonnummer ist 030 4455667. Füllen Sie das Formular für Elif aus. Schreiben Sie die fünf Zeilen ' +
            'untereinander in das Textfeld: Familienname, Vorname, Geburtsdatum, Straße und Hausnummer, ' +
            'Telefonnummer. Zum Beispiel: „Familienname: Demir“.',
          criteria: [
            'Alle 5 Felder sind ausgefüllt.',
            'Jede Antwort steht beim richtigen Feld.',
            'Namen, Datum und Nummer sind richtig geschrieben.',
          ],
        },
      ],
    },
  ],
};
