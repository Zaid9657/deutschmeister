// Writing task bank — exam-style letter/email prompts, keyed by task_key.
//
// SYNCED COPY: this file exists twice with identical content —
//   src/data/writingTasks.js                     (the SPA renders tasks)
//   netlify/functions/_shared/writingTasks.mjs   (the grader validates keys
//                                                 and derives the rubric)
// scripts/check-duplicates.mjs compares the pair byte-for-byte, like the
// pricing/marketing twins. The function must never grade a client-supplied
// prompt — it looks the task up HERE by validated exam_key + task_key.
//
// Fact discipline: tasks are original material in the STYLE of each exam's
// documented letter formats (halbformell/formell, Leitpunkte) — never claimed
// to be official tasks. maxPoints mirrors nothing official; it is our rubric's
// scale and every result screen labels scores as Richtwert.

export const WRITING_TASKS = [
  {
    examKey: 'telc_b1',
    taskKey: 'beschwerde-lieferung',
    title: 'Beschwerde: Bestellung nicht angekommen',
    register: 'halbformell',
    minWords: 80,
    maxWords: 140,
    task:
      'Du hast in einem Online-Shop einen Rucksack bestellt und schon bezahlt. Nach zwei Wochen ist er immer noch nicht angekommen. ' +
      'Schreib an den Kundenservice.',
    leitpunkte: [
      'Beschreib das Problem (was, wann bestellt)',
      'Sag, was du schon versucht hast',
      'Fordere eine Lösung mit einer Frist',
    ],
  },
  {
    examKey: 'telc_b1',
    taskKey: 'einladung-absage',
    title: 'Einladung absagen und Alternative vorschlagen',
    register: 'informell',
    minWords: 80,
    maxWords: 140,
    task:
      'Eine Freundin hat dich zu ihrer Geburtstagsfeier am Samstag eingeladen, aber du kannst nicht kommen. ' +
      'Schreib ihr eine E-Mail.',
    leitpunkte: [
      'Bedank dich für die Einladung',
      'Erklär, warum du nicht kommen kannst',
      'Schlag ein alternatives Treffen vor',
    ],
  },
  {
    examKey: 'telc_b1',
    taskKey: 'anfrage-sprachkurs',
    title: 'Anfrage an eine Sprachschule',
    register: 'formell',
    minWords: 80,
    maxWords: 140,
    task:
      'Du möchtest einen Deutschkurs besuchen und hast eine Anzeige einer Sprachschule gesehen. ' +
      'Schreib an die Schule und stell Fragen.',
    leitpunkte: [
      'Stell dich kurz vor und nenn dein Niveau',
      'Frag nach Terminen und Preisen',
      'Frag, wie man sich anmelden kann',
    ],
  },
  {
    examKey: 'telc_b2',
    taskKey: 'beschwerde-kurs',
    title: 'Beschwerde über einen gebuchten Kurs',
    register: 'formell',
    minWords: 120,
    maxWords: 200,
    task:
      'Du hast einen teuren Wochenendkurs (Fotografie) gebucht. Der Kurs war schlecht organisiert: der Raum zu klein, ' +
      'die Hälfte der Zeit fiel aus, versprochenes Material fehlte. Schreib an den Veranstalter.',
    leitpunkte: [
      'Beschreib konkret, was nicht in Ordnung war',
      'Erklär, welche Erwartungen die Anzeige geweckt hatte',
      'Fordere eine angemessene Entschädigung und begründe sie',
    ],
  },

  // ---- Goethe-Zertifikat A1 (Start Deutsch 1) ---------------------------
  // ---- Teil 1: Formular (6) ----------------------------------------------
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-hotel-anmeldung',
    title: 'Formular: Anmeldung im Hotel',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Frau Anna Keller kommt im Hotel an. Sie heißt Anna Keller, ist am 3. Mai 1991 geboren, wohnt in der Gartenstraße 5, ' +
      '50667 Köln, und kommt aus Österreich. Sie muss ein Anmeldeformular ausfüllen. Hilf ihr und schreib die Antworten für diese Felder: ' +
      'Name, Vorname, Geburtsdatum, Adresse (Straße, Postleitzahl, Wohnort), Land. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Name: Keller“.',
    leitpunkte: [
      'Name',
      'Vorname',
      'Geburtsdatum',
      'Adresse (Straße, Postleitzahl, Wohnort)',
      'Land',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-sprachschule-anmeldung',
    title: 'Formular: Anmeldung an einer Sprachschule',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Herr Igor Ivanov möchte einen Deutschkurs machen. Er heißt Igor Ivanov, kommt aus Russland, seine Muttersprache ist Russisch, ' +
      'und sein Deutschniveau ist A1. Er füllt das Anmeldeformular der Sprachschule aus. Hilf ihm und schreib die Antworten für diese Felder: ' +
      'Vorname, Familienname, Geburtsland, Muttersprache, Deutschniveau. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Vorname: Igor“.',
    leitpunkte: [
      'Vorname',
      'Familienname',
      'Geburtsland',
      'Muttersprache',
      'Deutschniveau',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-bibliotheksausweis',
    title: 'Formular: Bibliotheksausweis beantragen',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Frau Klara Nowak möchte einen Bibliotheksausweis. Sie heißt Klara Nowak, wohnt in der Lindenallee 8, ihre Telefonnummer ist ' +
      '0176 12345678, und ihre E-Mail-Adresse ist klara.nowak@email.de. Sie füllt das Antragsformular aus. Hilf ihr und schreib die Antworten ' +
      'für diese Felder: Name, Vorname, Straße und Hausnummer, Telefonnummer, E-Mail-Adresse. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Name: Nowak“.',
    leitpunkte: [
      'Name',
      'Vorname',
      'Straße und Hausnummer',
      'Telefonnummer',
      'E-Mail-Adresse',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-sportverein-anmeldung',
    title: 'Formular: Anmeldung im Sportverein',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Herr Emre Demir möchte im Sportverein Fußball spielen. Er heißt Emre Demir, ist am 14. September 1998 geboren, und wohnt in Essen. ' +
      'Er füllt das Anmeldeformular aus. Hilf ihm und schreib die Antworten für diese Felder: Name, Vorname, Geburtsdatum, Wohnort, ' +
      'gewünschte Sportart. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Name: Demir“.',
    leitpunkte: [
      'Name',
      'Vorname',
      'Geburtsdatum',
      'Wohnort',
      'Gewünschte Sportart',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-paket-formular',
    title: 'Formular: Paket bei der Post aufgeben',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Frau Julia Schmidt gibt ein Paket bei der Post auf. Sie heißt Julia Schmidt, wohnt im Rosenweg 3, 10115 Berlin, Deutschland. ' +
      'Sie füllt das Formular für den Absender aus. Hilf ihr und schreib die Antworten für diese Felder: Name, Vorname, Straße und Hausnummer, ' +
      'Postleitzahl und Ort, Land. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Name: Schmidt“.',
    leitpunkte: [
      'Name',
      'Vorname',
      'Straße und Hausnummer',
      'Postleitzahl und Ort',
      'Land',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'formular-arzttermin',
    title: 'Formular: Anmeldung beim Arzt',
    register: 'formular',
    minWords: 5,
    maxWords: 40,
    task:
      'Herr Can Aydin hat einen Termin beim Arzt. Er heißt Can Aydin, ist am 21. November 1985 geboren, wohnt in der Schillerstraße 9, ' +
      '60313 Frankfurt, und ist bei der AOK versichert. Er füllt das Anmeldeformular in der Praxis aus. Hilf ihm und schreib die Antworten ' +
      'für diese Felder: Name, Vorname, Geburtsdatum, Adresse, Krankenkasse. Schreib zu jedem Feld eine Zeile, zum Beispiel: „Name: Aydin“.',
    leitpunkte: [
      'Name',
      'Vorname',
      'Geburtsdatum',
      'Adresse',
      'Krankenkasse',
    ],
    pointsNote:
      'Für Teil 1 gibt es 5 Punkte (1 Punkt pro Feld). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },

  // ---- Teil 2: Mitteilung (6) ---------------------------------------------
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-termin-absagen',
    title: 'Mitteilung: Termin absagen',
    register: 'formell',
    minWords: 25,
    maxWords: 60,
    task:
      'Du hast morgen einen Termin beim Friseur. Du bist aber krank und kannst nicht kommen. Schreib eine Nachricht an den Friseursalon (circa 30 Wörter).',
    leitpunkte: [
      'Sag, dass du den Termin nicht wahrnehmen kannst',
      'Nenn den Grund (du bist krank)',
      'Bitte um einen neuen Termin',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-freund-einladen',
    title: 'Mitteilung: Einen Freund einladen',
    register: 'informell',
    minWords: 25,
    maxWords: 60,
    task:
      'Du machst am Samstag eine kleine Party. Schreib eine Nachricht an deinen Freund / deine Freundin und lad ihn/sie ein (circa 30 Wörter).',
    leitpunkte: [
      'Lad deinen Freund / deine Freundin zur Party ein',
      'Nenn Tag und Uhrzeit',
      'Frag, ob er/sie Zeit hat',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-entschuldigung-verspaetung',
    title: 'Mitteilung: Sich für die Verspätung entschuldigen',
    register: 'informell',
    minWords: 25,
    maxWords: 60,
    task:
      'Du triffst eine Freundin / einen Freund im Café. Du kommst zu spät. Schreib ihr/ihm eine Nachricht (circa 30 Wörter).',
    leitpunkte: [
      'Entschuldige dich für die Verspätung',
      'Sag, wann du kommst',
      'Bitte sie/ihn, kurz zu warten',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-info-sprachkurs',
    title: 'Mitteilung: Informationen zum Sprachkurs erfragen',
    register: 'formell',
    minWords: 25,
    maxWords: 60,
    task:
      'Du möchtest einen Deutschkurs an der Volkshochschule machen. Schreib eine Nachricht an die Volkshochschule (circa 30 Wörter).',
    leitpunkte: [
      'Sag, dass du einen Deutschkurs machen möchtest',
      'Frag nach dem Termin (Tag und Uhrzeit)',
      'Frag nach dem Preis',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-nachbarn-um-hilfe-bitten',
    title: 'Mitteilung: Die Nachbarin um Hilfe bitten',
    register: 'informell',
    minWords: 25,
    maxWords: 60,
    task:
      'Du fährst am Wochenende weg. Schreib deiner Nachbarin Lisa eine Nachricht und bitte sie um Hilfe mit deinen Blumen (circa 30 Wörter).',
    leitpunkte: [
      'Sag, dass du am Wochenende wegfährst',
      'Bitte sie, die Blumen zu gießen',
      'Sag, wo der Schlüssel ist',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
  {
    examKey: 'goethe_a1',
    taskKey: 'mitteilung-vermieter-heizung-kaputt',
    title: 'Mitteilung: Dem Vermieter schreiben (Heizung kaputt)',
    register: 'formell',
    minWords: 25,
    maxWords: 60,
    task:
      'Die Heizung in deiner Wohnung ist kaputt. Schreib deinem Vermieter eine Nachricht (circa 30 Wörter).',
    leitpunkte: [
      'Beschreib das Problem (die Heizung ist kaputt)',
      'Sag, seit wann die Heizung kaputt ist',
      'Bitte um eine schnelle Reparatur',
    ],
    pointsNote:
      'Für Teil 2 gibt es 10 Punkte (3 Punkte für die Leitpunkte + Punkte für Anrede, Gruß und Verständlichkeit). Insgesamt braucht man 60 von 100 Punkten, um die Prüfung zu bestehen.',
  },
];

export const MAX_WRITING_POINTS = 20;

export const writingTasksForExam = (examKey) =>
  WRITING_TASKS.filter((t) => t.examKey === examKey);

export const writingTaskByKey = (examKey, taskKey) =>
  WRITING_TASKS.find((t) => t.examKey === examKey && t.taskKey === taskKey) || null;
