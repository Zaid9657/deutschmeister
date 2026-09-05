// Goethe-Zertifikat A1: Start Deutsch 1 practice exam (Kurzversion).
//
// HONESTY CONTRACT (enforced by tests/exams.test.mjs, same as the other mock
// modules): original practice material in the STYLE of the exam — never
// official material; every surface that renders this mock must also render
// MOCK_DISCLAIMER_DE; "Kurzversion" stays in the title; scores are Richtwert
// only.
//
// Shape notes vs. the real exam: Start Deutsch 1 has four separately graded
// skills — Hören (3 Teile / 15 Aufgaben, Teil 2 wird nur einmal vorgespielt),
// Lesen (3 Teile), Schreiben (ein Formular + eine kurze Mitteilung, ca. 30
// Wörter) and Sprechen (mündlich, separat geprüft) — and ONE combined pass
// mark: 60 von 100 Punkten insgesamt, ohne Mindestpunktzahl pro Teil (unlike
// the Goethe B1 Kurzversion, which documents a per-module 60/100 line — see
// goetheB1.js). This Kurzversion keeps the three self-study-able skills
// (Sprechen lives in the Speaking-Missions trainer, exactly as goetheB1.js
// hands Sprechen off) with fewer items per part but the same task styles:
// kurze Notiz/E-Mail richtig-falsch (Lesen Teil 1 style), pro Situation zwei
// Anzeigen zur Auswahl (Teil 2 style, SD1-authentic — not the telc/A2-style
// one-of-many matching this module started with), Schild/Aushang mit
// Rückschluss statt Wiederholung (Teil 3 style),
// Formular ausfüllen + kurze Mitteilung mit Leitpunkten (Schreiben style).
//
// Listening exercises reused from the existing A1 listening bank (12 exist:
// A1.1 #1-6 = Supermarkt/Restaurant/Bahnhof/Arzt/Telefon/Hotel, A1.2 #1-6 =
// Kleidung/Weg/Büro/Freizeit/Wohnung/Wetter — order per
// docs/research/audit-a1-content-2026-09-03.md §3). This mock uses A1.1 #1
// (Supermarkt — a Durchsage/Ansage, matching Hören Teil 1's announcement
// style) and A1.2 #2 (Weg — everyday direction-giving, matching Hören Teil
// 3's short informal-exchange style). NOTE: an earlier illustrative pairing
// suggested "A1.1 #5 Telefon + A1.2 #2 Bahnhof" — per the audit's own
// theme-order list, A1.2 #2 is actually Weg, not Bahnhof (Bahnhof is A1.1
// #3), so that pairing was corrected here rather than copied.

export const goetheA1Mock = {
  examKey: 'goethe_a1',
  title: 'Goethe A1 Start Deutsch 1 Übungstest (Kurzversion)',
  intro:
    'Diese Kurzversion nähert sich dem Aufbau der echten Prüfung an, ersetzt sie aber nicht. Start Deutsch 1 hat vier ' +
    'Teile: Hören (3 Teile, 15 Aufgaben, Teil 2 wird nur einmal vorgespielt), Lesen (3 Teile), Schreiben (ein ' +
    'Formular und eine kurze Mitteilung mit ca. 30 Wörtern) und Sprechen (mündlich, separat geprüft). Bestanden ist ' +
    'die Prüfung ab 60 von 100 Punkten insgesamt — anders als beim B1 gibt es keine Mindestpunktzahl pro Teil. ' +
    'Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier. Für die echte Prüfung übe zusätzlich mit ' +
    'einem offiziellen Modellsatz von goethe.de — diese Kurzversion ist eigenes Übungsmaterial im gleichen Stil, ' +
    'mit weniger Aufgaben pro Teil.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions:
        'Zwei Hörübungen mit Alltagsdialogen auf A1-Niveau. Im echten Teil 2 der Prüfung hörst du den Text nur ' +
        'einmal; hier wie im übrigen Hörtraining kannst du die Aufnahme mehrfach abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext 1 · Im Supermarkt',
          level: 'A1.1',
          exerciseNumber: 1,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2 · Nach dem Weg fragen',
          level: 'A1.2',
          exerciseNumber: 2,
        },
      ],
    },
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 25,
      instructions:
        'Teil 1: Lies die zwei kurzen Texte (eine Notiz und eine E-Mail) und entscheide: richtig oder falsch? ' +
        '(5 Punkte) Teil 2: Lies die Situation und die zwei Anzeigen. Welche Anzeige passt? (5 Punkte) ' +
        'Teil 3: Lies die Schilder und Aushänge und entscheide: richtig oder falsch? (5 Punkte)',
      parts: [
        {
          key: 'lesen-1a',
          type: 'mc-group',
          label: 'Teil 1 · Notiz 1',
          text:
            'Hallo Peter, ich arbeite bis 18 Uhr. Kannst du bitte einkaufen gehen? Wir brauchen Milch, ' +
            'Brot und Äpfel. Das Geld liegt auf dem Tisch. Bitte koch heute Abend, ich habe keine Zeit. Danke! ' +
            'Liebe Grüße, Sofia',
          items: [
            {
              id: 'a1-l1a-1',
              prompt: 'Peter soll heute kochen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'a1-l1a-2',
              prompt: 'Sofia ist schon zu Hause.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'a1-l1a-3',
              prompt: 'Peter soll Milch kaufen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
          ],
        },
        {
          key: 'lesen-1b',
          type: 'mc-group',
          label: 'Teil 1 · Notiz 2',
          text:
            'Betreff: Ihr Termin beim Zahnarzt. Guten Tag Frau Keller, Ihr Termin ist am Montag um 9 Uhr. Bitte ' +
            'kommen Sie 10 Minuten früher. Bringen Sie Ihre Versichertenkarte mit. Wenn Sie nicht kommen können, ' +
            'rufen Sie bitte an. Mit freundlichen Grüßen, Praxis Dr. Wolf',
          items: [
            {
              id: 'a1-l1b-1',
              prompt: 'Der Termin ist am Dienstag.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'a1-l1b-2',
              prompt: 'Frau Keller soll ihre Versichertenkarte mitbringen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
          ],
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Welche Anzeige passt?',
          items: [
            {
              id: 'a1-l2-1',
              prompt:
                'Maria möchte Deutsch lernen. Sie hat am Montagabend Zeit. Welche Anzeige passt? ' +
                'a) Deutschkurs A1 — Montag und Mittwoch, 18 Uhr, Sprachschule Berlin. Anmeldung im Büro. ' +
                'b) Deutschkurs A1 — Dienstag und Donnerstag, 19 Uhr, Sprachschule Berlin. Anmeldung im Büro.',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'a',
            },
            {
              id: 'a1-l2-2',
              prompt:
                'Jonas sucht ein kleines Zimmer. Er zieht bald um. Welche Anzeige passt? ' +
                'a) Zimmer frei — WG-Zimmer, 15 m², ab 1. Oktober, 320 € warm, zentral gelegen. ' +
                'b) Wohnung zu vermieten — 3 Zimmer, 70 m², Balkon, 750 € kalt, ab November.',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'a',
            },
            {
              id: 'a1-l2-3',
              prompt:
                'Frau Schmidt braucht am Freitagabend jemanden für ihre Kinder. Welche Anzeige passt? ' +
                'a) Babysitter gesucht — Freitagabend, zwei Kinder, 10 € pro Stunde, Erfahrung nicht nötig. ' +
                'b) Babysitter gesucht — Samstagvormittag, ein Kind, 10 € pro Stunde, Erfahrung nicht nötig.',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'a',
            },
            {
              id: 'a1-l2-4',
              prompt:
                'Tom hat kein Fahrrad mehr und sucht ein günstiges, gebrauchtes. Welche Anzeige passt? ' +
                'a) Fahrrad zu verkaufen — gebraucht, gute Bremsen, 80 €, Abholung in der Stadt. ' +
                'b) Fahrrad zu verkaufen — neu, mit Rechnung, 250 €, Lieferung möglich.',
              options: [
                { key: 'a', label: 'Anzeige a' },
                { key: 'b', label: 'Anzeige b' },
              ],
              answer: 'a',
            },
            {
              id: 'a1-l2-5',
              prompt:
                'Ali sucht einen Nebenjob am Wochenende in einem Restaurant. Welche Anzeige passt? ' +
                'a) Job als Kellner — Restaurant Adler, am Wochenende, 12 € pro Stunde, ab sofort. ' +
                'b) Job als Koch — Restaurant Adler, Montag bis Freitag, Vollzeit, ab sofort.',
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
              id: 'a1-l3-1',
              prompt: 'Schild: „Aufzug außer Betrieb. Bitte Treppe benutzen.“ — Man darf jetzt mit dem Aufzug fahren.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'a1-l3-2',
              prompt: 'Schild: „Geöffnet: Mo–Fr 8–18 Uhr, Sa 9–13 Uhr. Sonntag geschlossen.“ — Am Sonntag ist geöffnet.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'a1-l3-3',
              prompt: 'Schild: „Vorsicht, nasser Boden!“ — Man kann hier ausrutschen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'r',
            },
            {
              id: 'a1-l3-4',
              prompt: 'Schild: „Bitte Schuhe ausziehen.“ — Man soll die Schuhe anlassen.',
              options: [
                { key: 'r', label: 'Richtig' },
                { key: 'f', label: 'Falsch' },
              ],
              answer: 'f',
            },
            {
              id: 'a1-l3-5',
              prompt: 'Schild: „Rauchen verboten — auch auf dem Balkon.“ — Auf dem Balkon darf man rauchen.',
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
      minutes: 20,
      instructions:
        'Teil 1 (Formular): 5 P. — trag deine Angaben in die fünf Felder ein. Teil 2 (Mitteilung): 10 P. — schreib ' +
        'ca. 30 Wörter zu allen drei Leitpunkten. Beide Teile werden nicht automatisch bewertet — nutze den ' +
        'Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Teil 1 · Formular',
          task:
            'Du möchtest dich für einen Deutschkurs an der Volkshochschule anmelden. Füll das Anmeldeformular mit ' +
            'deinen Angaben aus: Name, Straße und Hausnummer, Postleitzahl und Wohnort, Geburtsdatum und ' +
            'Telefonnummer.',
          criteria: [
            'Feld „Name“ ausgefüllt',
            'Feld „Straße und Hausnummer“ ausgefüllt',
            'Feld „Postleitzahl und Wohnort“ ausgefüllt',
            'Feld „Geburtsdatum“ ausgefüllt',
            'Feld „Telefonnummer“ ausgefüllt',
          ],
        },
        {
          key: 'schreiben-2',
          type: 'writing',
          label: 'Teil 2 · Mitteilung',
          task:
            'Du kannst morgen nicht zum Deutschkurs kommen. Schreib eine kurze Mitteilung (ca. 30 Wörter) an deine ' +
            'Lehrerin: Sag, warum du nicht kommen kannst, wann du wiederkommst, und bitte um die Hausaufgabe.',
          criteria: [
            'Passende Anrede und Gruß',
            'Leitpunkt 1: Grund genannt',
            'Leitpunkt 2: Rückkehr genannt',
            'Leitpunkt 3: Bitte um Hausaufgabe',
          ],
        },
      ],
    },
  ],
};
