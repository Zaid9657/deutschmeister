// DTZ (Deutsch-Test für Zuwanderer) practice exam (Kurzversion).
//
// HONESTY CONTRACT (enforced by tests/exams.test.mjs): original practice
// material in the STYLE of the exam — never official material; every surface
// renders MOCK_DISCLAIMER_DE; "Kurzversion" stays in the title; scores are
// Richtwert only.
//
// THE SCALED-EXAM CAVEAT, which the intro must always carry: the DTZ has no
// simple pass mark. It tests A2 and B1 at once and the certificate states a
// level PER SECTION (see astro-site/src/data/guides/dtz.js, factsCheckedOn
// there). The 60% line below is therefore only this trainer's Richtwert for
// "on track for the B1 band" — the result screen already labels every score
// Richtwert, and the intro says explicitly that the real exam reports levels,
// not pass/fail.
//
// Shape notes: task styles mirror the DTZ's everyday-Germany register —
// situation→ad matching (Kataloge/Anzeigen), detail questions on an official
// letter (Behördenbrief), and the halbformelle letter with Leitpunkte.

export const dtzMock = {
  examKey: 'dtz',
  title: 'DTZ Übungstest (Kurzversion)',
  intro:
    'Lesen und Hören werden automatisch ausgewertet, der Brief kommt mit Aufgabe und Selbstcheck. ' +
    'Wichtig: Der echte DTZ kennt kein einfaches Bestehen — er weist pro Prüfungsteil aus, ob du A2- oder ' +
    'B1-Niveau erreicht hast. Die Prozentgrenze hier ist nur ein Richtwert dafür, ob du auf B1-Kurs bist.',
  passPercent: 60,

  // The DTZ is scaled — the certificate states A2 or B1 per section, there is
  // no documented pass mark. The generic result copy speaks of the
  // "dokumentierte 60%-Grenze", which would be a false claim here, so this
  // module overrides the verdict wording (rendered by ModelltestResult).
  verdictCopyDe: {
    solide: {
      title: 'Auf B1-Kurs — mit Puffer',
      body:
        'In den automatisch ausgewerteten Teilen liegst du deutlich über dem 60%-Richtwert dieses Trainers für das B1-Band. ' +
        'Der echte DTZ vergibt pro Prüfungsteil ein Niveau (A2 oder B1) statt einer Bestehensgrenze — halte das Niveau und übe weiter Schreiben und Sprechen.',
    },
    knapp: {
      title: 'Auf B1-Kurs — aber ohne Puffer',
      body:
        'Du liegst über dem 60%-Richtwert dieses Trainers für das B1-Band, aber knapp. Der echte DTZ vergibt pro Prüfungsteil ein Niveau (A2 oder B1) — ' +
        'mehr Puffer heißt: eher B1 in jedem Teil, auch an einem schwachen Tag.',
    },
    'nicht-bereit': {
      title: 'Noch unter dem B1-Richtwert',
      body:
        'In den automatisch ausgewerteten Teilen liegst du unter dem 60%-Richtwert dieses Trainers für das B1-Band. Kein Urteil: Der echte DTZ vergibt pro ' +
        'Prüfungsteil ein Niveau (A2 oder B1), und ein Ergebnis unter B1 ist kein Durchfallen — sieh dir unten an, welcher Teil die meisten Punkte gekostet hat.',
    },
  },

  sections: [
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 25,
      instructions:
        'Teil 1: Welche Anzeige passt zu welcher Situation? Zwei Anzeigen bleiben übrig. Teil 2: Lies den Brief und wähl die richtige Antwort.',
      parts: [
        {
          key: 'lesen-1',
          type: 'matching',
          label: 'Teil 1 · Anzeigen zuordnen',
          options: [
            { key: 'a', label: 'Bürgeramt: Termine jetzt bequem online buchen unter www.stadt.example/termine — ohne Wartezeit am Schalter.' },
            { key: 'b', label: 'Deutschkurs mit Kinderbetreuung: vormittags 9–12 Uhr, Betreuung für Kinder ab 1 Jahr im Haus. Jetzt anmelden.' },
            { key: 'c', label: 'Sozialkaufhaus MöbelPlus: gut erhaltene gebrauchte Möbel, Geschirr und Lampen zu kleinen Preisen. Lieferung möglich.' },
            { key: 'd', label: 'Nachhilfe in Mathematik für Klasse 5–10, erfahrene Lehrerin, erste Stunde gratis.' },
            { key: 'e', label: 'Wertstoffhof Nord: Sperrmüll-Annahme jetzt auch samstags 8–14 Uhr. Bitte Ausweis mitbringen.' },
            { key: 'f', label: 'Reinigungskraft gesucht: Montag bis Freitag, 8–11 Uhr, Arztpraxis im Zentrum. Bezahlung nach Tarif.' },
            { key: 'g', label: 'Fahrschule Start: Führerschein Klasse B, Theorieunterricht auch auf Englisch und Arabisch.' },
          ],
          texts: [
            {
              id: 'd1',
              text: 'Herr Yilmaz muss seinen neuen Pass abholen und möchte nicht lange am Schalter warten.',
            },
            {
              id: 'd2',
              text: 'Frau Haddad möchte endlich einen Deutschkurs besuchen, aber ihre Tochter ist erst zwei Jahre alt und sie hat vormittags niemanden für sie.',
            },
            {
              id: 'd3',
              text: 'Familie Osman ist gerade in eine leere Wohnung gezogen und braucht günstig einen Tisch, Stühle und einen Schrank.',
            },
            {
              id: 'd4',
              text: 'Herr Nowak hat seine alte Waschmaschine ersetzt und möchte die alte am Wochenende wegbringen.',
            },
            {
              id: 'd5',
              text: 'Frau Krasniqi sucht eine Arbeit am Vormittag, weil ihre Kinder mittags aus der Schule kommen.',
            },
          ],
          answers: { d1: 'a', d2: 'b', d3: 'c', d4: 'e', d5: 'f' },
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Ein Brief vom Amt',
          text:
            'Stadtwerke Musterstadt\n\nSehr geehrter Herr Rahimi,\n\nam Dienstag, den 14. November, lesen wir zwischen 8 und 16 Uhr die Wasserzähler in Ihrem Haus ab. Bitte sorgen Sie dafür, dass unser Mitarbeiter den Zähler in Ihrer Wohnung erreichen kann. Wenn Sie an diesem Tag nicht zu Hause sind, können Sie den Zählerstand auch selbst ablesen und uns bis zum 21. November über unser Online-Formular mitteilen. Bitte beachten Sie: Wenn wir bis zu diesem Datum keinen Zählerstand haben, müssen wir Ihren Verbrauch schätzen. Das kann zu einer höheren Rechnung führen.\n\nMit freundlichen Grüßen\nIhre Stadtwerke',
          items: [
            {
              id: 'dtz-l2q1',
              prompt: 'Was möchten die Stadtwerke am 14. November machen?',
              options: [
                { key: 'a', label: 'Den Wasserzähler ablesen' },
                { key: 'b', label: 'Den Wasserzähler austauschen' },
                { key: 'c', label: 'Eine Rechnung bringen' },
              ],
              answer: 'a',
            },
            {
              id: 'dtz-l2q2',
              prompt: 'Herr Rahimi ist am 14. November nicht zu Hause. Was kann er tun?',
              options: [
                { key: 'a', label: 'Einen neuen Termin am Schalter vereinbaren' },
                { key: 'b', label: 'Den Zählerstand selbst ablesen und online mitteilen' },
                { key: 'c', label: 'Nichts — der Mitarbeiter kommt automatisch noch einmal' },
              ],
              answer: 'b',
            },
            {
              id: 'dtz-l2q3',
              prompt: 'Was passiert, wenn die Stadtwerke bis zum 21. November keinen Zählerstand haben?',
              options: [
                { key: 'a', label: 'Das Wasser wird abgestellt.' },
                { key: 'b', label: 'Herr Rahimi bekommt eine Mahnung.' },
                { key: 'c', label: 'Der Verbrauch wird geschätzt.' },
              ],
              answer: 'c',
            },
          ],
        },
      ],
    },
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions:
        'Zwei Hörübungen mit Muttersprachler-Dialogen — eine auf A2-, eine auf B1-Niveau, wie die gestufte Prüfung selbst. Du kannst jede Aufnahme nur begrenzt oft abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext 1 (A2-Niveau)',
          level: 'A2.2',
          exerciseNumber: 1,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2 (B1-Niveau)',
          level: 'B1.1',
          exerciseNumber: 4,
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schreiben',
      minutes: 25,
      instructions:
        'Schreib einen halbformellen Brief (ca. 80–100 Wörter) und behandle alle drei Leitpunkte. Dieser Teil wird nicht automatisch bewertet — nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Brief an die Hausverwaltung',
          task:
            'In Ihrer Wohnung funktioniert die Heizung seit einer Woche nicht richtig, und es wird kalt. ' +
            'Schreiben Sie an Ihre Hausverwaltung: Beschreiben Sie das Problem, sagen Sie, seit wann es besteht, ' +
            'und bitten Sie um eine schnelle Reparatur mit einem Terminvorschlag.',
          criteria: [
            'Passende Anrede und Schlussformel (halbformell, Sie-Form)',
            'Alle drei Leitpunkte behandelt',
            'Klare Struktur: Problem → seit wann → Bitte mit Termin',
            'Höfliche Bitte formuliert (könnten Sie, ich bitte Sie …)',
            'Ungefähr 80–100 Wörter',
          ],
        },
      ],
    },
  ],
};
