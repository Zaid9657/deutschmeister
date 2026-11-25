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
// 15-minute timer built for one exercise. 2026-11-25: of its 23 questions the
// test asks the eight whose words the twelve Lektionen teach (names of places
// and trains excepted, `questionNumbers`): „Schließfächer", „Endstation", „hin und
// zurück" and „dauert" were never taught. Eight points against eight in Lesen.
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
  title: 'Abschlusstest A1.1 (Kurzversion)',
  intro:
    'Das ist der Abschlusstest Ihres A1.1-Kurses. Hören und Lesen werden automatisch bewertet; ' +
    'Sie bestehen diesen Kurstest ab 60 % in diesen beiden Teilen zusammen und mit mindestens 5 von 8 Punkten im Hören und mindestens 5 von 8 Punkten im Lesen. Eine Formularaufgabe zum Schreiben ' +
    'bearbeiten Sie mit einem Selbstcheck; sie zählt nicht zur Punktzahl. Eine freie Mitteilung und Sprechen sind nicht enthalten. ' +
    'Dieser Test übt einzelne Aufgabenarten von Start Deutsch 1 und bildet nicht die vollständige Prüfung ab. ' +
    'Er ist eigenes Übungsmaterial von DeutschMeister: keine offizielle Prüfung, kein Zertifikat über ein Sprachniveau. ' +
    'Danach können Sie mit A1.2 weiterlernen.',
  passPercent: 60,
  // The result page shares its verdict copy with the exam mocks, which duzen; the course says Sie,
  // and names the two parts the score covers (Codex score review, 2026-10-08).
  verdictCopyDe: {
    solide: {
      title: 'Über der Bestehensgrenze — mit Puffer',
      body: 'In den automatisch ausgewerteten Teilen (Hören und Lesen) liegen Sie deutlich über der 60%-Grenze dieses Tests. Üben Sie weiter Schreiben und Sprechen — die zählen in der echten Prüfung mit.',
    },
    knapp: {
      title: 'Über der Grenze — aber ohne Puffer',
      body: 'In Hören und Lesen liegen Sie über der 60%-Grenze dieses Tests, aber knapp. Ziel für die echte Prüfung: 70–75 %, damit ein schwacher Tag Sie nicht unter die Grenze drückt.',
    },
    'nicht-bereit': {
      title: 'Noch unter der Grenze',
      body: 'In den automatisch ausgewerteten Teilen (Hören und Lesen) liegen Sie unter der 60%-Grenze dieses Tests. Das ist eine Standortbestimmung, kein Urteil — sehen Sie sich unten an, welcher Teil die meisten Punkte gekostet hat.',
    },
  },

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      // Its keys come from the database, so its mark is written here: one answer throughout („b“) takes 4 of the 8
      // (tests/fixtures/a11-final-listening.json), so the section needs 5, like Lesen (Claude score, 2026-11-25).
      passMark: 5,
      instructions: 'Eine Aufnahme mit kurzen Dialogen und Durchsagen am Bahnhof. Sie hören sie zweimal. Die acht Fragen gehören zu den ersten sechs Teilen der Aufnahme.',
      instructionsEn: 'A recording with short conversations and announcements at a station. You hear it twice. The eight questions belong to the first six parts of the recording.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext · Am Bahnhof',
          level: 'A1.1',
          exerciseNumber: 3,
          // The questions in taught words, in the order of the recording (dialogues 1–6); the
          // snapshot they were chosen from is tests/fixtures/a11-final-listening.json.
          questionNumbers: [11, 2, 3, 13, 4, 14, 15, 6],
          questionMax: 15,
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
      instructionsEn:
        'Part 1: read the note and decide: true (richtig) or false (falsch)? Part 2: read the situation and the two ads. ' +
        'Which ad fits? Part 3: read the signs and decide: true or false?',
      parts: [
        {
          key: 'lesen-1',
          type: 'mc-group',
          label: 'Teil 1 · Notiz',
          // No item is answered by finding the same day, number or word (walk and scores of 2026-11-25:
          // seven of eight were): the rival stands in the text, the answer is worked out.
          text:
            'Liebe Sara, am Samstag habe ich Geburtstag, aber am Samstag arbeite ich leider. Wir feiern am Sonntag ' +
            'um 15 Uhr bei mir zu Hause. Meine Mama macht Kuchen, Wein habe ich schon. Bring bitte Musik mit! ' +
            'Bis Sonntag! Deine Mia',
          items: [
            {
              id: 'l1-1',
              prompt: 'Die Party ist am Samstag.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l1-2',
              prompt: 'Mia macht den Kuchen für das Fest.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l1-3',
              prompt: 'Die Gäste kommen zu Mia nach Hause.',
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
            'Ana arbeitet jeden Tag bis 17 Uhr. Sie möchte Deutsch lernen.\n' +
            'Anzeige a) Deutsch lernen — Montag und Mittwoch, 15 bis 17 Uhr, Bremen.\n' +
            'Anzeige b) Deutsch lernen — Dienstag und Donnerstag, 18 bis 20 Uhr, Bremen.',
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
            'Herr Weber möchte einen Tisch und zwei Stühle. Er hat 40 Euro.\n' +
            'Anzeige a) Tisch: 20 Euro. Stuhl: 10 Euro.\n' +
            'Anzeige b) Tisch und zwei Stühle, zusammen 45 Euro.',
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
              prompt: 'Schild im Büro: „Frau Novak hat von 12 bis 13 Uhr Pause.“ — Um halb eins arbeitet Frau Novak.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'l3-2',
              prompt: 'Schild am Bahnhof: „Der Zug nach Köln hat 20 Minuten Verspätung.“ — Der Zug kommt zu spät.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'l3-3',
              prompt: 'Schild im Café: „Frühstück bis 11 Uhr. Suppe und Salat von 12 bis 18 Uhr.“ — Um 14 Uhr haben wir Suppe.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
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
      instructionsEn:
        'Fill in a form: write the five details one under the other in the text field. This task is not marked ' +
        'automatically — use the self-check.',
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
          taskEn:
            'Your friend is called Aylin Demir. Her daughter Elif would like to learn to swim. The family name is Demir, ' +
            'the first name is Elif. The date of birth is 12 May 2016. The address is Rosenweg 9. The phone number is ' +
            '030 4455667. Fill in the form for Elif. Write the five lines one under the other: family name, first name, ' +
            'date of birth, street and house number, phone number.',
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
