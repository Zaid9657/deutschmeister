// DTZ Brief an den Vermieter — exam long-tail page (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "dtz brief vermieter", "dtz brief an vermieter heizung",
// "dtz brief schreiben beispiel", "brief an hausverwaltung b1". "dtz brief
// schreiben" measured 140/month on 2026-09-02 (brief-schreiben-b1.js).
//
// FACTS (checked 2026-10-26 on the vendors' own pages):
//   - BAMF: the DTZ has a written and an oral part; the written part takes 100
//     minutes with listening and reading tasks and a short letter; for an
//     overall B1 (or A2) the candidate must reach it in Sprechen and in at
//     least one of "Hören und Lesen" or "Schreiben".
//   - telc DTZ Übungstest: Schreiben = "Halbformelle und formelle Mitteilungen
//     verfassen", 1 Schreibaufgabe, 30 Min.; rated on Aufgabenbewältigung
//     (four Leitpunkte), Kommunikative Gestaltung, Korrektheit, Wortschatz.
//   - telc's DTZ practice test in "Auf jeden Fall" (telc.net): choose task A
//     or task B; do not forget the greeting and the closing.
// The task, model letter and Redemittel are our own material.

export const dtzBriefVermieter = {
  slug: 'dtz-brief-vermieter',
  lang: 'de',
  offer: 'dtz-waitlist',
  title: 'DTZ Brief an den Vermieter: Musterbrief & Redemittel',
  h1: 'DTZ Brief an den Vermieter: Musterbrief, Aufbau und Redemittel',
  description:
    'DTZ Schreiben: ein formeller Brief an Vermieter oder Hausverwaltung — Aufbau mit vier Leitpunkten, kompletter Musterbrief und die passenden Redemittel.',
  keywords:
    'DTZ Brief Vermieter, DTZ Brief schreiben Beispiel, DTZ Brief Hausverwaltung, DTZ Schreiben, Brief an Vermieter B1, Deutsch-Test für Zuwanderer Brief',
  badge: 'Musterbrief · DTZ',
  lead:
    'Die Heizung ist kalt, das Fenster schließt nicht, die Nachbarn sind laut: Briefe an den Vermieter oder die Hausverwaltung gehören zu den typischen Alltagssituationen im <strong>Deutsch-Test für Zuwanderer</strong>. Dieser Leitfaden zeigt Ihnen den Aufbau, einen vollständigen Musterbrief und die Redemittel, mit denen Sie alle vier Leitpunkte sicher bearbeiten.',
  datePublished: '2026-10-26',
  answer:
    'Im DTZ schreiben Sie in 30 Minuten eine halbformelle oder formelle Mitteilung, zum Beispiel einen Brief an den Vermieter. In den Übungstests von telc wählen Sie zwischen zwei Aufgaben und bearbeiten vier Leitpunkte. Ein sicherer Aufbau: „Sehr geehrte …", ein Satz zum Anlass, ein kurzer Absatz pro Leitpunkt, eine klare Bitte, „Mit freundlichen Grüßen" und Ihr Name. Bewertet werden Aufgabenbewältigung, kommunikative Gestaltung, Korrektheit und Wortschatz.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'BAMF — Abschlussprüfung (DTZ)', url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html' },
    { label: 'telc — Übungstest 2 DTZ (PDF)', url: 'https://shop.telc.net/media/catalog/product/file//5/0/5010-b00-030101_barrierefrei_bib.pdf' },
    { label: 'telc — Übungstest DTZ, Auf jeden Fall B1.2 (PDF)', url: 'https://www.telc.net/fileadmin/user_upload/Downloads_Verlag/Auf_jeden_Fall/Uebungstests/Auf_jeden_Fall_B1.2_UEbungstest_DTZ.pdf' },
  ],

  sections: [
    {
      id: 'aufgabe',
      heading: 'Der Schreibteil im DTZ',
      blocks: [
        {
          type: 'p',
          text: 'Der schriftliche Teil des DTZ dauert laut BAMF <strong>100 Minuten</strong>: Hören, Lesen und ein kurzer Brief. Für das Schreiben haben Sie <strong>30 Minuten</strong>. Die Aufgabe heißt bei telc „Halbformelle und formelle Mitteilungen verfassen" — also Briefe oder E-Mails an Vermieter, Ämter, Schulen, Arbeitgeber oder Firmen.',
        },
        {
          type: 'table',
          head: ['Kriterium (laut telc)', 'Was geprüft wird'],
          rows: [
            ['Aufgabenbewältigung', 'Sind alle vier Leitpunkte bearbeitet und passt der Text zur Situation?'],
            ['Kommunikative Gestaltung', 'Anrede, Gruß, Register und ein zusammenhängender Text'],
            ['Korrektheit', 'Grammatik und Rechtschreibung'],
            ['Wortschatz', 'Passende und ausreichend vielfältige Wörter'],
          ],
        },
        {
          type: 'p',
          text: 'In den Übungstests von telc wählen Sie zwischen <strong>Aufgabe A und Aufgabe B</strong>. Nehmen Sie die Aufgabe, zu der Ihnen zu allen vier Leitpunkten sofort etwas einfällt — nicht die, deren Thema Ihnen zuerst sympathischer ist.',
        },
        {
          type: 'callout',
          text: 'Warum der Brief so wichtig ist: Laut BAMF erreichen Sie das Gesamtergebnis B1 nur, wenn Sie B1 im Sprechen und zusätzlich in „Hören und Lesen" oder im „Schreiben" erreichen. Ein guter Brief kann also den Ausschlag geben.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'So ist ein formeller Brief aufgebaut',
      blocks: [
        {
          type: 'steps',
          items: [
            {
              label: 'Anfang',
              title: 'Anrede',
              tasks: [
                '„Sehr geehrte Frau Schulz," / „Sehr geehrter Herr Yilmaz," — wenn Sie den Namen kennen',
                '„Sehr geehrte Damen und Herren," — an eine Hausverwaltung oder Firma',
              ],
              tip: '„Sehr geehrter" bei Männern, „Sehr geehrte" bei Frauen und bei „Damen und Herren". Danach Komma und klein weiter.',
            },
            {
              label: 'Einleitung',
              title: 'Warum Sie schreiben',
              tasks: [
                '„ich wohne in Ihrer Wohnung in der Lindenstraße 12 und schreibe Ihnen, weil …"',
                'Ein Satz genügt.',
              ],
            },
            {
              label: 'Hauptteil',
              title: 'Die vier Leitpunkte',
              tasks: [
                'In der Reihenfolge der Aufgabe, je zwei bis drei Sätze',
                'Mit Konnektoren verbinden: seit, leider, deshalb, außerdem',
              ],
            },
            {
              label: 'Schluss',
              title: 'Bitte, Dank, Gruß',
              tasks: [
                '„Bitte rufen Sie mich unter … an."',
                '„Vielen Dank im Voraus." — „Mit freundlichen Grüßen" — Vor- und Nachname',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'musterbrief',
      heading: 'Musterbrief: die Heizung funktioniert nicht',
      blocks: [
        {
          type: 'p',
          text: 'Übungsaufgabe (eigene Aufgabe im DTZ-Stil): In Ihrer Wohnung funktioniert die Heizung nicht. Schreiben Sie an Ihre Hausverwaltung. Schreiben Sie etwas zu allen vier Punkten:',
        },
        {
          type: 'list',
          items: [
            'Was ist das Problem?',
            'Seit wann gibt es das Problem?',
            'Welche Folgen hat das für Sie?',
            'Wann kann ein Techniker kommen?',
          ],
        },
        {
          type: 'model',
          label: 'Musterbrief (ca. 120 Wörter)',
          lines: [
            'Sehr geehrte Damen und Herren,',
            'ich wohne in der Lindenstraße 12, 2. Stock links, und schreibe Ihnen, weil in meiner Wohnung die Heizung nicht funktioniert.',
            'Seit letztem Montag bleiben alle Heizkörper kalt, obwohl ich sie ganz aufgedreht habe. Auch warmes Wasser gibt es nur noch manchmal.',
            'Für meine Familie ist das ein großes Problem. Nachts sind es in der Wohnung nur noch 15 Grad, und mein kleiner Sohn ist schon erkältet. Deshalb heizen wir im Moment mit einem Elektroofen, aber das ist sehr teuer.',
            'Bitte schicken Sie so schnell wie möglich einen Techniker. Ich bin jeden Tag ab 15 Uhr zu Hause, am Samstag auch vormittags. Sie erreichen mich unter der Telefonnummer 0176 1234567.',
            'Vielen Dank im Voraus.',
            '',
            'Mit freundlichen Grüßen',
            'Olena Petrenko',
          ],
        },
        { type: 'h3', text: 'Was diesen Brief stark macht' },
        {
          type: 'list',
          items: [
            '<strong>Vier Leitpunkte, vier Absätze:</strong> Problem (Heizung, Wasser), seit wann (letzter Montag), Folgen (Kälte, krankes Kind, Kosten), Termin (Zeiten und Telefonnummer).',
            '<strong>Formelles Register:</strong> Sie-Form, „Sehr geehrte Damen und Herren", „Mit freundlichen Grüßen".',
            '<strong>Zusammenhang:</strong> weil, seit, obwohl, deshalb, aber — der Text ist kein Satzstapel.',
            '<strong>Wortschatz:</strong> Heizkörper, aufdrehen, Techniker, erkältet — konkrete Wörter statt immer „es ist kaputt".',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für Briefe an Vermieter und Hausverwaltung',
      blocks: [
        { type: 'h3', text: 'Sich vorstellen und den Anlass nennen' },
        {
          type: 'list',
          items: [
            'Ich wohne seit … in Ihrer Wohnung in der …straße.',
            'Ich schreibe Ihnen, weil …',
            'Ich möchte Ihnen mitteilen, dass …',
          ],
        },
        { type: 'h3', text: 'Ein Problem in der Wohnung beschreiben' },
        {
          type: 'list',
          items: [
            'Seit … funktioniert … nicht mehr.',
            'Das Fenster im Schlafzimmer lässt sich nicht mehr schließen.',
            'In der Küche ist ein Wasserfleck an der Decke.',
          ],
        },
        { type: 'h3', text: 'Folgen schildern' },
        {
          type: 'list',
          items: [
            'Das ist für uns ein großes Problem, weil …',
            'Deshalb können wir … nicht benutzen.',
            'Ich mache mir Sorgen, dass …',
          ],
        },
        { type: 'h3', text: 'Um etwas bitten' },
        {
          type: 'list',
          items: [
            'Könnten Sie bitte einen Handwerker schicken?',
            'Ich bitte Sie, das Problem so schnell wie möglich zu lösen.',
            'Ich bin montags bis freitags ab … Uhr zu Hause.',
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Typische Fehler im DTZ-Brief',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Anrede oder Gruß fehlt',
              body: 'In den telc-Übungstests steht ausdrücklich: Vergessen Sie nicht die Anrede und den Gruß. Das sind die leichtesten Punkte im Schreibteil — lassen Sie sie nicht liegen.',
            },
            {
              title: 'Leitpunkte nur abschreiben',
              body: '„Seit wann gibt es das Problem? Seit Montag." Das wiederholt die Aufgabe, statt sie zu bearbeiten. Schreiben Sie ganze Sätze mit eigenen Worten.',
            },
            {
              title: 'Du statt Sie',
              body: 'Den Vermieter und die Hausverwaltung siezen Sie immer. Ein „du" oder „Hallo" am Anfang passt nicht zur Situation.',
            },
            {
              title: 'Keine konkrete Bitte',
              body: 'Wenn ein Leitpunkt nach einem Termin fragt, nennen Sie Tage und Uhrzeiten. „Bitte kommen Sie bald" ist zu ungenau.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So üben Sie den DTZ-Brief',
      blocks: [
        {
          type: 'p',
          text: 'Üben Sie mit Situationen aus dem Alltag in Deutschland: Heizung, Schimmel, Lärm im Haus, Nebenkostenabrechnung, Schlüssel verloren, Umzug ankündigen. Schreiben Sie pro Woche zwei Briefe in 30 Minuten und kontrollieren Sie danach: Anrede, vier Leitpunkte, Bitte, Gruß.',
        },
        {
          type: 'p',
          text: 'Eigene DTZ-Schreibaufgaben hat das <a href="/schreiben">KI-Schreibtraining</a> noch nicht. Seine Aufgaben im Stil von telc B1 üben aber denselben Aufbau — halbformelle Mitteilung, vier Leitpunkte — und bewerten Ihren Text nach Aufgabenerfüllung, Aufbau, Korrektheit und Wortschatz, mit konkreten Korrekturen an Ihren Sätzen. Einen zweiten Briefanlass zeigt der Leitfaden <a href="/leitfaden/dtz-brief-termin-absagen/">DTZ-Brief: einen Termin absagen</a>; den Ablauf der ganzen Prüfung erklärt der <a href="/leitfaden/dtz/">DTZ-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange habe ich im DTZ für den Brief Zeit?',
      a: 'Laut telc 30 Minuten. Der ganze schriftliche Teil mit Hören, Lesen und Schreiben dauert laut BAMF 100 Minuten.',
    },
    {
      q: 'Wie viele Leitpunkte hat die DTZ-Schreibaufgabe?',
      a: 'In den telc-Übungstests und in den Bewertungskriterien sind es vier Leitpunkte. Jeder Leitpunkt sollte im Brief mit mindestens einem eigenen Satz bearbeitet werden.',
    },
    {
      q: 'Muss ich im DTZ Datum und Adresse schreiben?',
      a: 'Wichtig sind vor allem Anrede, die vier Leitpunkte und der Gruß. Wenn die Aufgabe nichts anderes verlangt, können Sie Datum und Adresse weglassen und die Zeit für den Inhalt nutzen.',
    },
    {
      q: 'Zählt der Brief für das B1-Ergebnis?',
      a: 'Ja. Laut BAMF brauchen Sie für das Gesamtergebnis B1 das Niveau B1 im Sprechen und zusätzlich in „Hören und Lesen" oder im „Schreiben". Welches Ergebnis Sie für Ihren Zweck brauchen, klären Sie am besten mit Ihrer Behörde oder Ihrem Kursträger.',
    },
    {
      q: 'Darf ich im DTZ ein Wörterbuch benutzen?',
      a: 'Fragen Sie dazu Ihr Prüfungszentrum. In Sprachprüfungen sind Hilfsmittel wie Wörterbücher und Handys üblicherweise nicht erlaubt — üben Sie deshalb immer ohne.',
    },
  ],

  cta: {
    heading: 'DTZ-Briefe und Modelltest üben',
    body: 'Mit einem kostenlosen Konto üben Sie Briefe mit Leitpunkten und, solange Pro läuft, den zeitgesteuerten DTZ-Modelltest. Der Einstufungstest zeigt Ihnen vorher, wo Sie stehen.',
  },
};
