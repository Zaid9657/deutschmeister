// telc B1 practice exam (Kurzversion) — renovation Phase 5a.
//
// HONESTY CONTRACT (enforced by tests/exams.test.mjs):
//   - This is ORIGINAL practice material in the style of the exam — never
//     official material, and the UI must render MOCK_DISCLAIMER_DE wherever
//     it appears.
//   - It is deliberately labeled "Kurzversion": fewer items than the real
//     exam, same section shapes and timing pressure per item. No surface may
//     call it a full Modelltest.
//   - Scores are "Richtwert" only. The pass threshold shown (60%) mirrors the
//     publicly documented telc rule (see astro-site/src/data/guides/telc-b1.js,
//     factsCheckedOn there) but the result screen must say it is not an
//     official evaluation.
//
// Item shapes:
//   matching: { texts: [{id, text}], options: [{key, label}], answers: {textId: key} }
//   mc:       { prompt, text?, options: [{key, label}], answer: key }
//   cloze:    one letter, gaps [{id, options: [{key, label}], answer}]
//   listening: refs to existing listening_exercises rows (level +
//              exercise_number); questions load at runtime via useListening.
//   writing:  task description + criteria checklist (NOT auto-scored).
//
// Timing: minutes per section, persisted as exam_attempts.section_deadline.

export const telcB1Mock = {
  examKey: 'telc_b1',
  title: 'telc B1 Übungstest (Kurzversion)',
  intro:
    'Drei Teile unter Zeitdruck: Lesen, Sprachbausteine und Hören werden automatisch ausgewertet. ' +
    'Der Schreibteil kommt mit Aufgabe und Selbstcheck — bewerte ihn ehrlich selbst oder nutze das Schreibtraining.',
  passPercent: 60,

  sections: [
    {
      key: 'lesen',
      title: 'Leseverstehen',
      minutes: 25,
      instructions:
        'Teil 1: Welche Überschrift passt zu welchem Text? Zwei Überschriften bleiben übrig. Teil 2: Lies die Texte und wähl die richtige Antwort.',
      parts: [
        {
          key: 'lesen-1',
          type: 'matching',
          label: 'Teil 1 · Überschriften zuordnen',
          options: [
            { key: 'a', label: 'Weniger Autos in der Innenstadt geplant' },
            { key: 'b', label: 'Neue Öffnungszeiten in der Stadtbibliothek' },
            { key: 'c', label: 'Sportverein sucht ehrenamtliche Trainer' },
            { key: 'd', label: 'Gesünder essen im Büro — so klappt es' },
            { key: 'e', label: 'Mietpreise steigen weiter' },
            { key: 'f', label: 'Reparieren statt wegwerfen: neues Café öffnet' },
            { key: 'g', label: 'Warnung vor falschen Handwerkern' },
          ],
          texts: [
            {
              id: 'l1',
              text: 'Ab Oktober können Leserinnen und Leser auch am Sonntag von 10 bis 16 Uhr Bücher ausleihen. Die Stadt reagiert damit auf eine Umfrage, in der sich viele Berufstätige längere Wochenendzeiten gewünscht hatten.',
            },
            {
              id: 'l2',
              text: 'Im Stadtteil Neuhausen hat am Samstag ein besonderes Café eröffnet: Wer einen kaputten Toaster, ein Fahrrad oder eine Lampe mitbringt, bekommt bei Kaffee und Kuchen Hilfe von Ehrenamtlichen, die gemeinsam mit den Gästen reparieren.',
            },
            {
              id: 'l3',
              text: 'Die Polizei meldet mehrere Fälle, in denen Männer an der Haustür günstige Dacharbeiten anboten. Nach einer Anzahlung verschwanden sie. Die Beamten raten, niemals bar im Voraus zu bezahlen und sich immer einen Ausweis zeigen zu lassen.',
            },
            {
              id: 'l4',
              text: 'Der Gemeinderat hat gestern beschlossen, die Parkplätze am Marktplatz bis 2028 schrittweise abzubauen. Dafür sollen breitere Radwege und mehr Sitzbänke entstehen. Händler kritisieren den Beschluss, Umweltverbände begrüßen ihn.',
            },
            {
              id: 'l5',
              text: 'Wer den ganzen Tag am Schreibtisch sitzt, greift in der Pause oft zu Schokolade oder Fast Food. Ernährungsberaterin Petra Silny empfiehlt, Obst und Nüsse sichtbar auf den Tisch zu stellen — was man sieht, isst man auch.',
            },
          ],
          answers: { l1: 'b', l2: 'f', l3: 'g', l4: 'a', l5: 'd' },
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Detailverstehen',
          text:
            'Liebe Kolleginnen und Kollegen,\n\nwie ihr wisst, ziehen wir Ende November in das neue Bürogebäude in der Lindenstraße um. Bitte packt eure persönlichen Sachen bis Freitag, den 22. November, in die Kartons, die ab Montag in der Teeküche bereitstehen. Die Computer werden von der IT-Abteilung abgebaut — bitte lasst die Kabel stecken! Wer am Umzugswochenende helfen möchte, trägt sich bitte bis zum 15. November in die Liste im Intranet ein. Als Dankeschön gibt es für alle Helferinnen und Helfer einen zusätzlichen freien Tag.\n\nViele Grüße\nMartina Krebs, Verwaltung',
          items: [
            {
              id: 'l2q1',
              prompt: 'Was sollen die Mitarbeiter selbst machen?',
              options: [
                { key: 'a', label: 'Die Computer abbauen und einpacken' },
                { key: 'b', label: 'Ihre persönlichen Sachen einpacken' },
                { key: 'c', label: 'Kartons in der Teeküche bereitstellen' },
              ],
              answer: 'b',
            },
            {
              id: 'l2q2',
              prompt: 'Wer beim Umzug hilft, …',
              options: [
                { key: 'a', label: 'bekommt einen freien Tag.' },
                { key: 'b', label: 'muss sich bei Frau Krebs melden.' },
                { key: 'c', label: 'arbeitet dafür am Wochenende in der IT-Abteilung.' },
              ],
              answer: 'a',
            },
            {
              id: 'l2q3',
              prompt: 'Bis wann kann man sich in die Helferliste eintragen?',
              options: [
                { key: 'a', label: 'Bis zum 15. November' },
                { key: 'b', label: 'Bis zum 22. November' },
                { key: 'c', label: 'Bis Ende November' },
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
        'Lies den Brief und wähl für jede Lücke die richtige Möglichkeit — genau das telc-Format: Grammatik und Wortschatz im Kontext.',
      parts: [
        {
          key: 'sb-1',
          type: 'cloze',
          label: 'Grammatik und Wortschatz im Kontext',
          textBefore: 'Liebe Sandra,',
          gapsText: [
            { text: 'vielen Dank für deine Einladung! Ich freue mich sehr ' },
            { gap: 'g1' },
            { text: ' deine neue Wohnung. Leider kann ich erst am Samstagabend kommen, ' },
            { gap: 'g2' },
            { text: ' ich bis 17 Uhr arbeiten muss. Ich hoffe, das ist kein Problem.\n\nSoll ich etwas ' },
            { gap: 'g3' },
            { text: ' Essen mitbringen? Du weißt ja, dass ich gern koche. Mein Auto ist gerade in der Werkstatt, deshalb komme ich ' },
            { gap: 'g4' },
            { text: ' dem Zug. Kannst du mich vielleicht ' },
            { gap: 'g5' },
            { text: ' Bahnhof abholen? Wenn nicht, nehme ich einfach den Bus, ' },
            { gap: 'g6' },
            { text: ' direkt vor deinem Haus hält.\n\nIch bin gespannt, ' },
            { gap: 'g7' },
            { text: ' deine Nachbarn so sind. Hoffentlich sind sie netter als ' },
            { gap: 'g8' },
            { text: ' alten! Bis Samstag — ich freue mich ' },
            { gap: 'g9' },
            { text: ' dich.\n\n' },
            { gap: 'g10' },
            { text: ' Grüße\nJulia' },
          ],
          gaps: [
            { id: 'g1', options: [{ key: 'a', label: 'auf' }, { key: 'b', label: 'über' }, { key: 'c', label: 'für' }], answer: 'a' },
            { id: 'g2', options: [{ key: 'a', label: 'denn' }, { key: 'b', label: 'weil' }, { key: 'c', label: 'deshalb' }], answer: 'b' },
            { id: 'g3', options: [{ key: 'a', label: 'zum' }, { key: 'b', label: 'zur' }, { key: 'c', label: 'nach' }], answer: 'a' },
            { id: 'g4', options: [{ key: 'a', label: 'bei' }, { key: 'b', label: 'mit' }, { key: 'c', label: 'von' }], answer: 'b' },
            { id: 'g5', options: [{ key: 'a', label: 'vom' }, { key: 'b', label: 'am' }, { key: 'c', label: 'im' }], answer: 'a' },
            { id: 'g6', options: [{ key: 'a', label: 'die' }, { key: 'b', label: 'der' }, { key: 'c', label: 'den' }], answer: 'b' },
            { id: 'g7', options: [{ key: 'a', label: 'ob' }, { key: 'b', label: 'wie' }, { key: 'c', label: 'dass' }], answer: 'b' },
            { id: 'g8', options: [{ key: 'a', label: 'den' }, { key: 'b', label: 'die' }, { key: 'c', label: 'dem' }], answer: 'b' },
            { id: 'g9', options: [{ key: 'a', label: 'über' }, { key: 'b', label: 'auf' }, { key: 'c', label: 'an' }], answer: 'b' },
            { id: 'g10', options: [{ key: 'a', label: 'Herzlichen' }, { key: 'b', label: 'Herzliche' }, { key: 'c', label: 'Herzliches' }], answer: 'b' },
          ],
        },
      ],
    },
    {
      key: 'hoeren',
      title: 'Hörverstehen',
      minutes: 15,
      instructions:
        'Zwei Hörübungen mit Muttersprachler-Dialogen auf B1-Niveau. Du kannst jede Aufnahme wie in der Prüfung nur begrenzt oft abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext 1',
          // Existing listening_exercises rows carry audio + questions;
          // the runner loads them at runtime (level is the DB uppercase form).
          level: 'B1.1',
          exerciseNumber: 1,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2',
          level: 'B1.1',
          exerciseNumber: 2,
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schriftlicher Ausdruck',
      minutes: 30,
      instructions:
        'Schreib eine halbformelle E-Mail (ca. 80–120 Wörter). Dieser Teil wird nicht automatisch bewertet — nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'E-Mail schreiben',
          task:
            'Du hast in einem Online-Shop einen Rucksack bestellt. Nach zwei Wochen ist er immer noch nicht angekommen, ' +
            'obwohl du schon bezahlt hast. Schreib an den Kundenservice: Beschreib das Problem, sag, was du schon versucht hast, ' +
            'und fordere eine Lösung mit einer Frist.',
          criteria: [
            'Passende Anrede und Schlussformel (halbformell)',
            'Alle drei Leitpunkte behandelt',
            'Klare Struktur: Problem → bisherige Schritte → Forderung',
            'Konnektoren verwendet (weil, deshalb, trotzdem …)',
            'Ungefähr 80–120 Wörter',
          ],
        },
      ],
    },
  ],
};
