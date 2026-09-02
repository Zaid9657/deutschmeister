// Goethe-Zertifikat B1 practice exam (Kurzversion).
//
// HONESTY CONTRACT (enforced by tests/exams.test.mjs): original practice
// material in the STYLE of the exam — never official material; every surface
// renders MOCK_DISCLAIMER_DE; "Kurzversion" stays in the title; scores are
// Richtwert only. The 60% line mirrors the publicly documented per-module
// pass mark (see astro-site/src/data/guides/goethe-b1.js, factsCheckedOn
// there): 60 of 100 points per module, no offsetting between modules.
//
// Shape notes vs. the real exam: the Goethe B1 tests Lesen/Hören/Schreiben/
// Sprechen as four separately bookable modules. This Kurzversion covers the
// three that a self-study run can carry (Sprechen lives in the speaking
// trainer), with fewer items per part but the same task styles: situation→ad
// matching (Lesen Teil 3 style), detail questions on a press text (Teil 2
// style), and the informal letter with three Leitpunkte (Schreiben Aufgabe 1
// style).

export const goetheB1Mock = {
  examKey: 'goethe_b1',
  title: 'Goethe B1 Übungstest (Kurzversion)',
  intro:
    'Drei Module wie in der Prüfung: Lesen und Hören werden automatisch ausgewertet, der Schreibteil kommt mit ' +
    'Aufgabe und Selbstcheck. Denk an die Modullogik der echten Prüfung: Jedes Modul zählt für sich — ' +
    'ein starkes Lesen rettet kein schwaches Schreiben.',
  passPercent: 60,

  sections: [
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 25,
      instructions:
        'Teil 1: Welche Anzeige passt zu welcher Situation? Zwei Anzeigen bleiben übrig. Teil 2: Lies den Text und wähl die richtige Antwort.',
      parts: [
        {
          key: 'lesen-1',
          type: 'matching',
          label: 'Teil 1 · Anzeigen zuordnen',
          options: [
            { key: 'a', label: 'Sprachcafé International — jeden Samstag 15–17 Uhr, Deutsch üben bei Kaffee und Kuchen, Eintritt frei, keine Anmeldung nötig.' },
            { key: 'b', label: 'Umzugshelfer gesucht! Am 12. Oktober, 4 Stunden, 15 € pro Stunde. Kräftige Hände willkommen.' },
            { key: 'c', label: 'Kinderturnen für 6- bis 9-Jährige: dienstags 16 Uhr in der Turnhalle Süd. Schnupperstunde kostenlos, danach 12 € im Monat.' },
            { key: 'd', label: 'Fahrrad-Selbsthilfewerkstatt: Werkzeug, Ersatzteile und Hilfe beim Reparieren — donnerstags und samstags, gegen kleine Spende.' },
            { key: 'e', label: 'Klavierunterricht für Erwachsene, alle Niveaus, beim Lehrer zu Hause oder online. Probestunde 20 €.' },
            { key: 'f', label: 'Helle 2-Zimmer-Wohnung mit Südbalkon, 54 m², ab sofort zu vermieten. Besichtigung nach Vereinbarung.' },
            { key: 'g', label: 'Deutsch B1 am Abend: Kurs ab 18:30 Uhr, zweimal pro Woche, Einstieg jederzeit möglich. Jetzt Beratungstermin vereinbaren.' },
          ],
          texts: [
            {
              id: 'g1',
              text: 'Marta möchte am Wochenende ihr Deutsch verbessern und mit anderen Menschen sprechen. Viel Geld ausgeben will sie nicht.',
            },
            {
              id: 'g2',
              text: 'Alis Tochter ist sieben Jahre alt und hat zu wenig Bewegung. Er sucht einen Sportkurs für sie nach der Schule.',
            },
            {
              id: 'g3',
              text: 'Jonas hat ein gebrauchtes Fahrrad gekauft. Die Bremsen funktionieren nicht richtig, aber eine teure Werkstatt kann er sich gerade nicht leisten.',
            },
            {
              id: 'g4',
              text: 'Frau Petrova arbeitet tagsüber im Krankenhaus und sucht einen Deutschkurs, den sie nach der Arbeit besuchen kann.',
            },
            {
              id: 'g5',
              text: 'Familie Demir wohnt zu dritt in einem Zimmer und sucht dringend eine kleine Wohnung — am liebsten mit Balkon.',
            },
          ],
          answers: { g1: 'a', g2: 'c', g3: 'd', g4: 'g', g5: 'f' },
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Detailverstehen',
          text:
            'Die Bibliothek der Dinge\n\nSeit einem Jahr kann man in der Stadtbibliothek nicht nur Bücher ausleihen, sondern auch Dinge: eine Bohrmaschine, ein Zelt, eine Nähmaschine oder ein Waffeleisen. „Viele Geräte braucht man nur zwei- oder dreimal im Jahr. Warum soll sie jeder selbst kaufen?", erklärt Bibliotheksleiterin Carola Menz die Idee. Die Ausleihe ist im normalen Bibliotheksausweis enthalten und kostet nichts extra. Am beliebtesten sind Werkzeuge, direkt danach kommen Küchengeräte. Wer etwas ausleihen möchte, reserviert es am besten vorher auf der Website, denn die beliebten Geräte sind oft wochenlang vergriffen. Kaputte Geräte repariert ein Team von Freiwilligen — nur was gar nicht mehr zu retten ist, wird ersetzt.',
          items: [
            {
              id: 'gb-l2q1',
              prompt: 'Was kostet die Ausleihe der Geräte?',
              options: [
                { key: 'a', label: 'Nichts — sie ist im Bibliotheksausweis enthalten.' },
                { key: 'b', label: 'Eine kleine Gebühr pro Gerät.' },
                { key: 'c', label: 'Einen extra Jahresbeitrag.' },
              ],
              answer: 'a',
            },
            {
              id: 'gb-l2q2',
              prompt: 'Warum soll man Geräte vorher reservieren?',
              options: [
                { key: 'a', label: 'Weil die Bibliothek sonst keine Geräte herausgibt.' },
                { key: 'b', label: 'Weil beliebte Geräte oft lange ausgeliehen sind.' },
                { key: 'c', label: 'Weil die Reservierung Geld spart.' },
              ],
              answer: 'b',
            },
            {
              id: 'gb-l2q3',
              prompt: 'Was passiert mit kaputten Geräten?',
              options: [
                { key: 'a', label: 'Sie werden sofort weggeworfen und neu gekauft.' },
                { key: 'b', label: 'Die Ausleiher müssen sie ersetzen.' },
                { key: 'c', label: 'Freiwillige versuchen zuerst, sie zu reparieren.' },
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
        'Zwei Hörübungen mit Muttersprachler-Dialogen auf B1-Niveau. Du kannst jede Aufnahme wie in der Prüfung nur begrenzt oft abspielen.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext 1',
          level: 'B1.1',
          exerciseNumber: 3,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2',
          level: 'B1.2',
          exerciseNumber: 1,
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schreiben',
      minutes: 20,
      instructions:
        'Schreib eine informelle E-Mail (ca. 80 Wörter) und behandle alle drei Leitpunkte. Dieser Teil wird nicht automatisch bewertet — nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'E-Mail an eine Freundin',
          task:
            'Du bist vor zwei Wochen für einen neuen Job in eine andere Stadt gezogen. Schreib deiner Freundin Lena: ' +
            'Erzähl, wie der Umzug war, beschreib, was dir an der neuen Stadt gefällt oder noch schwerfällt, ' +
            'und lade sie zu einem Besuch ein — mit einem konkreten Terminvorschlag.',
          criteria: [
            'Passende Anrede und Schlussformel (informell)',
            'Alle drei Leitpunkte behandelt',
            'Zusammenhängender Text, keine Stichpunkte',
            'Vergangenheit korrekt (Perfekt für den Umzug)',
            'Ungefähr 80 Wörter',
          ],
        },
      ],
    },
  ],
};
