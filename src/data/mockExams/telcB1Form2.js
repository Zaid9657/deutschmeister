// telc B1 practice exam, FORM 2 (Kurzversion) — the unseen retest of the telc
// B1 route (src/data/programs/telcB1Komplett.js, day 20; backlog f1).
//
// Why a second form: the route measures on day 1 and again on day 20. Replaying
// the day-1 items measures memory of those items, not progress. Form 2 has NEW
// items in the SAME shape, so the before/after compare stays comparable:
//   - same sections, same keys, same minutes, same order;
//   - same part types and item counts per section (Lesen 5 matching + 3 MC with
//     7 headings / 3 options; Sprachbausteine 10 gaps × 3 options; Hören two
//     B1.1 exercises capped at 10 questions; Schreiben as an unscored self-check);
//   - no item text, no item id and no listening exercise shared with form 1
//     (pinned by tests/telc-pilot.test.mjs).
//
// HONESTY CONTRACT — the same as telcB1.js: ORIGINAL practice material in the
// style of the exam, never official material; the UI renders MOCK_DISCLAIMER_DE
// wherever it appears; "Kurzversion" in the title; scores are a Richtwert only.
//
// A form is chosen per attempt and stored in exam_attempts.answers under
// FORM_KEY (src/data/mockExams/forms.js) — no schema change, the gate stays the
// exam slug's own.
//
// The .js extension matters: imported by tests under plain Node ESM.

export const telcB1Form2Mock = {
  examKey: 'telc_b1',
  form: 2,
  title: 'telc B1 Übungstest 2 (Kurzversion)',
  intro:
    'Der zweite Übungstest mit neuen Aufgaben im selben Format: Lesen, Sprachbausteine und Hören werden automatisch ausgewertet. ' +
    'Der Schreibteil kommt mit Aufgabe und Selbstcheck — bewerten Sie ihn ehrlich selbst oder nutzen Sie das Schreibtraining.',
  passPercent: 60,

  sections: [
    {
      key: 'lesen',
      title: 'Leseverstehen',
      minutes: 25,
      instructions:
        'Teil 1: Welche Überschrift passt zu welchem Text? Zwei Überschriften bleiben übrig. Teil 2: Lesen Sie die Texte und wählen Sie die richtige Antwort.',
      parts: [
        {
          key: 'f2-lesen-1',
          type: 'matching',
          label: 'Teil 1 · Überschriften zuordnen',
          options: [
            { key: 'a', label: 'Hallenbad bleibt wegen Sanierung geschlossen' },
            { key: 'b', label: 'Mehr Busse am Abend und am Wochenende' },
            { key: 'c', label: 'Nachbarschaftsgarten sucht Mitgärtner' },
            { key: 'd', label: 'Kostenlose Beratung bei Schulden' },
            { key: 'e', label: 'Wochenmarkt zieht auf den Bahnhofsplatz' },
            { key: 'f', label: 'Neue Regeln für E-Scooter in der Innenstadt' },
            { key: 'g', label: 'Computerkurse für Seniorinnen und Senioren' },
          ],
          texts: [
            {
              id: 'f2l1',
              text: 'Ab dem 1. März findet der Wochenmarkt nicht mehr vor dem Rathaus statt. Weil der Platz dort neu gepflastert wird, bauen die Händlerinnen und Händler ihre Stände dienstags und freitags vor dem Hauptbahnhof auf.',
            },
            {
              id: 'f2l2',
              text: 'Die städtischen Verkehrsbetriebe erweitern ihren Fahrplan: Die Linien 4 und 7 fahren künftig bis Mitternacht alle 20 Minuten. Auch am Sonntagmorgen gibt es zusätzliche Fahrten, damit Beschäftigte im Krankenhaus pünktlich zum Schichtbeginn kommen.',
            },
            {
              id: 'f2l3',
              text: 'Wer seine Rechnungen nicht mehr bezahlen kann, sollte nicht zu lange warten. Die Verbraucherzentrale bietet jeden Donnerstag eine offene Sprechstunde an, in der Fachleute mit den Ratsuchenden einen Plan machen. Eine Anmeldung ist nicht nötig, das Gespräch kostet nichts.',
            },
            {
              id: 'f2l4',
              text: 'Auf einer früheren Brachfläche hinter der Grundschule wachsen seit dem letzten Sommer Tomaten, Kräuter und Blumen. Die Initiative „Grünes Viertel“ freut sich über weitere Nachbarinnen und Nachbarn, die einmal pro Woche beim Gießen und Ernten helfen.',
            },
            {
              id: 'f2l5',
              text: 'Online-Banking, Videoanrufe mit den Enkeln, Termine beim Bürgeramt buchen: In kleinen Gruppen lernen Menschen ab 65 an der Volkshochschule Schritt für Schritt, wie sie Tablet und Laptop im Alltag nutzen. Die Kurse beginnen im April.',
            },
          ],
          answers: { f2l1: 'e', f2l2: 'b', f2l3: 'd', f2l4: 'c', f2l5: 'g' },
        },
        {
          key: 'f2-lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Detailverstehen',
          text:
            'Liebe Mieterinnen und Mieter,\n\nin der Woche vom 10. bis 14. März werden in unserem Haus die alten Wasserleitungen erneuert. Von Montag bis Mittwoch gibt es deshalb jeweils zwischen 8 und 14 Uhr kein warmes Wasser. Am Donnerstag müssen die Handwerker in jede Wohnung, um die Wasserzähler im Bad auszutauschen. Wenn Sie an diesem Tag nicht zu Hause sein können, geben Sie Ihren Schlüssel bitte bis Mittwochabend beim Hausmeister, Herrn Yilmaz, ab. Und noch eine Bitte: Stellen Sie Ihre Fahrräder bis zum 7. März aus dem Keller in den Hof, damit die Arbeiter Platz haben.\n\nVielen Dank für Ihr Verständnis\nIhre Hausverwaltung Berger',
          items: [
            {
              id: 'f2l2q1',
              prompt: 'Was passiert am Donnerstag?',
              options: [
                { key: 'a', label: 'Es gibt den ganzen Tag kein Wasser.' },
                { key: 'b', label: 'In allen Wohnungen werden die Wasserzähler ausgetauscht.' },
                { key: 'c', label: 'Der Hausmeister sammelt die Schlüssel ein.' },
              ],
              answer: 'b',
            },
            {
              id: 'f2l2q2',
              prompt: 'Wer am Donnerstag nicht zu Hause ist, …',
              options: [
                { key: 'a', label: 'gibt vorher seinen Schlüssel beim Hausmeister ab.' },
                { key: 'b', label: 'ruft die Hausverwaltung an.' },
                { key: 'c', label: 'bekommt einen neuen Termin.' },
              ],
              answer: 'a',
            },
            {
              id: 'f2l2q3',
              prompt: 'Bis wann sollen die Fahrräder aus dem Keller?',
              options: [
                { key: 'a', label: 'Bis zum 7. März' },
                { key: 'b', label: 'Bis zum 10. März' },
                { key: 'c', label: 'Bis Mittwochabend' },
              ],
              answer: 'a',
            },
          ],
        },
      ],
    },
    {
      key: 'sprachbausteine',
      title: 'Sprachbausteine',
      minutes: 15,
      instructions:
        'Lesen Sie den Brief und wählen Sie für jede Lücke die richtige Möglichkeit — genau das telc-Format: Grammatik und Wortschatz im Kontext.',
      parts: [
        {
          key: 'f2-sb-1',
          type: 'cloze',
          label: 'Grammatik und Wortschatz im Kontext',
          textBefore: 'Sehr geehrte Frau Hoffmann,',
          gapsText: [
            { text: 'ich schreibe Ihnen, ' },
            { gap: 'f2g1' },
            { text: ' ich zum 31. Mai aus meiner Wohnung ausziehen möchte. Ich habe eine neue Stelle in Hamburg gefunden und ziehe deshalb ' },
            { gap: 'f2g2' },
            { text: ' Norden. Meine schriftliche Kündigung schicke ich Ihnen zusätzlich ' },
            { gap: 'f2g3' },
            { text: ' Post.\n\nIch würde mich freuen, ' },
            { gap: 'f2g4' },
            { text: ' wir einen Termin für die Wohnungsübergabe vereinbaren könnten. Am besten passt es mir ' },
            { gap: 'f2g5' },
            { text: ' Ende Mai. Die Küche, ' },
            { gap: 'f2g6' },
            { text: ' ich vor drei Jahren selbst eingebaut habe, würde ich gern in der Wohnung lassen. Vielleicht interessiert sich ja ' },
            { gap: 'f2g7' },
            { text: ' neuer Mieter dafür.\n\nKönnten Sie mir außerdem sagen, bis ' },
            { gap: 'f2g8' },
            { text: ' ich die Kaution zurückbekomme? Meine neue Adresse teile ich Ihnen ' },
            { gap: 'f2g9' },
            { text: ' bald wie möglich mit.\n\n' },
            { gap: 'f2g10' },
            { text: ' freundlichen Grüßen\nAndrzej Nowak' },
          ],
          gaps: [
            { id: 'f2g1', options: [{ key: 'a', label: 'weil' }, { key: 'b', label: 'denn' }, { key: 'c', label: 'obwohl' }], answer: 'a' },
            { id: 'f2g2', options: [{ key: 'a', label: 'nach dem' }, { key: 'b', label: 'in den' }, { key: 'c', label: 'zum' }], answer: 'b' },
            { id: 'f2g3', options: [{ key: 'a', label: 'mit' }, { key: 'b', label: 'durch' }, { key: 'c', label: 'per' }], answer: 'c' },
            { id: 'f2g4', options: [{ key: 'a', label: 'wenn' }, { key: 'b', label: 'ob' }, { key: 'c', label: 'als' }], answer: 'a' },
            { id: 'f2g5', options: [{ key: 'a', label: 'um' }, { key: 'b', label: 'gegen' }, { key: 'c', label: 'seit' }], answer: 'b' },
            { id: 'f2g6', options: [{ key: 'a', label: 'der' }, { key: 'b', label: 'den' }, { key: 'c', label: 'die' }], answer: 'c' },
            { id: 'f2g7', options: [{ key: 'a', label: 'Ihr' }, { key: 'b', label: 'Ihren' }, { key: 'c', label: 'Ihre' }], answer: 'a' },
            { id: 'f2g8', options: [{ key: 'a', label: 'wie' }, { key: 'b', label: 'ob' }, { key: 'c', label: 'wann' }], answer: 'c' },
            { id: 'f2g9', options: [{ key: 'a', label: 'so' }, { key: 'b', label: 'als' }, { key: 'c', label: 'wie' }], answer: 'a' },
            { id: 'f2g10', options: [{ key: 'a', label: 'Bei' }, { key: 'b', label: 'Mit' }, { key: 'c', label: 'In' }], answer: 'b' },
          ],
        },
      ],
    },
    {
      key: 'hoeren',
      title: 'Hörverstehen',
      minutes: 15,
      instructions:
        'Zwei Hörübungen mit Muttersprachler-Dialogen auf B1-Niveau. Sie können jede Aufnahme wie in der Prüfung nur begrenzt oft abspielen.',
      parts: [
        {
          // B1.1 exercises 5 and 6 (Reiseplanung; Nachrichten und Medien): the
          // same level and 10-question shape as form 1's exercises 1 and 2, and
          // used by no other mock (form 1 uses 1 + 2, Goethe B1 uses 3).
          key: 'f2-hoeren-1',
          type: 'listening',
          label: 'Hörtext 1',
          level: 'B1.1',
          exerciseNumber: 5,
          questionMax: 10,
        },
        {
          key: 'f2-hoeren-2',
          type: 'listening',
          label: 'Hörtext 2',
          level: 'B1.1',
          exerciseNumber: 6,
          questionMax: 10,
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schriftlicher Ausdruck',
      minutes: 30,
      instructions:
        'Schreiben Sie eine halbformelle E-Mail (ca. 80–120 Wörter). Dieser Teil wird nicht automatisch bewertet — nutzen Sie den Selbstcheck.',
      parts: [
        {
          key: 'f2-schreiben-1',
          type: 'writing',
          label: 'E-Mail schreiben',
          task:
            'Sie sind seit einem Jahr Mitglied in einem Fitnessstudio. Im nächsten Monat ziehen Sie in eine andere Stadt. ' +
            'Schreiben Sie an das Studio: Erklären Sie, warum Sie kündigen möchten, fragen Sie, ob Sie früher aus dem Vertrag können, ' +
            'und bitten Sie um eine schriftliche Bestätigung.',
          criteria: [
            'Passende Anrede und Schlussformel (halbformell)',
            'Alle drei Leitpunkte behandelt',
            'Klare Struktur: Grund → Frage → Bitte',
            'Konnektoren verwendet (weil, deshalb, trotzdem …)',
            'Ungefähr 80–120 Wörter',
          ],
        },
      ],
    },
  ],
};
