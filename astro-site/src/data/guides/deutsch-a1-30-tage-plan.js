// „Deutsch A1: 30-Tage-Plan" — organic launch week 4
// (docs/marketing/a11-organic-launch-calendar.md). Data module, not a page:
// see the header of ./deutsch-a1-anfaenger-start.js for why.
//
// SEARCH INTENT: „Deutsch A1 in 30 Tagen“, „Deutsch Lernplan“, „Deutsch A1
// Lernplan PDF“. This search attracts promises („A1 in 30 Tagen!“), and the
// honest answer is the article's spine: thirty days is enough for A1.1 — the
// FIRST HALF of A1 — at a realistic daily dose, and not enough for the whole
// A1 level. Saying that plainly is the differentiator, not a weakness.
//
// WHAT THIS ARTICLE MAY NOT DO: promise a level, a certificate or a pass after
// thirty days. The plan below is a schedule of WORK, and every milestone is a
// can-do the reader can check themselves. tests/a11-organic-content.test.mjs
// bans outcome wording across all four articles.
//
// The day table is deliberately derived from the same twelve situations the
// A1.1 course teaches (src/data/curricula/a11.js) — it is typed out here as
// prose because a guide is static German copy, but if the curriculum's
// situations ever change, this table is the place that has to follow.

export const deutschA130TagePlan = {
  slug: 'deutsch-a1-30-tage-plan',
  title: 'Deutsch A1: ein realistischer 30-Tage-Plan',
  h1: 'Deutsch A1 in 30 Tagen: was wirklich geht — und ein Plan, der hält',
  description:
    'Ein ehrlicher 30-Tage-Lernplan für Deutsch A1.1: Tag für Tag, 20 Minuten täglich, mit Wochenzielen zum Selbsttest und was nach den 30 Tagen kommt.',
  keywords:
    'Deutsch A1 30 Tage, Deutsch Lernplan, Deutsch A1 in einem Monat, A1.1 Lernplan, Deutsch lernen Zeitplan',
  badge: 'Leitfaden',
  lead:
    'Suchst du „Deutsch A1 in 30 Tagen“, findest du zwei Sorten Antwort: Werbung, die es verspricht, und Foren, die es für unmöglich erklären. Beides ist ungenau. In 30 Tagen mit etwa 20 Minuten täglich schaffst du <strong>A1.1</strong> — die erste Hälfte von A1 — solide. Für das ganze A1-Niveau brauchst du ungefähr das Doppelte. Dieser Plan zeigt, was in den 30 Tagen drin ist.',
  datePublished: '2026-09-16',
  answer:
    'In 30 Tagen zu je 20 Minuten kommen rund zehn Lernstunden zusammen. Das Goethe-Institut rechnet für das ganze A1-Niveau mit 60 bis 80 Unterrichtseinheiten, also ist ein Monat nicht genug für komplettes A1 — wohl aber für A1.1, die erste Hälfte: sich vorstellen, über Familie und Beruf sprechen, einkaufen, Uhrzeit und Termine, im Café bestellen, am Bahnhof fragen. Der Plan unten teilt diese zwölf Situationen in vier Wochen, jede Woche mit einem Ziel, das du selbst überprüfen kannst, und drei ruhigen Wiederholungstagen.',
  factsCheckedOn: '2026-09-03',
  sources: [
    { label: 'Goethe-Institut — Start Deutsch 1 (Prüfungsformat)', url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd1.html' },
    { label: 'Goethe-Institut — Prüfungsziele/Testbeschreibung A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf' },
    { label: 'Goethe-Institut — Wortliste A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf' },
  ],

  sections: [
    {
      id: 'was-geht',
      heading: 'Was in 30 Tagen realistisch ist',
      blocks: [
        {
          type: 'p',
          text: 'Rechne nach, bevor du planst: 30 Tage × 20 Minuten sind zehn Zeitstunden. Das Goethe-Institut veranschlagt für das gesamte A1-Niveau 60 bis 80 Unterrichtseinheiten. Zehn Stunden sind also kein ganzes A1 — sie sind ein gutes, vollständiges A1.1.',
        },
        {
          type: 'table',
          head: ['Nach 30 Tagen …', 'realistisch?'],
          rows: [
            ['dich vorstellen, buchstabieren, Zahlen nennen', 'ja'],
            ['über Familie, Beruf, Sprachen und Hobbys sprechen', 'ja'],
            ['einkaufen, nach Preisen fragen, im Café bestellen', 'ja'],
            ['Uhrzeit, Termine und einen Tagesablauf beschreiben', 'ja'],
            ['ein Formular ausfüllen und eine kurze Mitteilung schreiben', 'ja'],
            ['das komplette A1-Niveau abschließen', 'nein — dafür fehlt die zweite Hälfte (A1.2)'],
            ['für die A1-Prüfung vorbereitet sein', 'nein — das braucht A1.2 und eine Prüfungsphase'],
          ],
        },
        {
          type: 'callout',
          text: 'Ein Plan, der mehr verspricht, verkauft nicht mehr Sprache, sondern nur mehr Enttäuschung in Woche 3. Genau dort steigen die meisten aus — nicht weil Deutsch zu schwer ist, sondern weil der Plan nie zu ihrem Tag gepasst hat.',
        },
      ],
    },
    {
      id: 'regeln',
      heading: 'Die vier Regeln, die den Plan tragen',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>Täglich schlägt lang.</strong> 20 Minuten an sechs Tagen bringen mehr als zwei Stunden am Sonntag — Sprache hält sich über Abstände, nicht über Sitzungslänge.',
            '<strong>Eine Situation pro Einheit.</strong> Nicht „Adjektivdeklination“, sondern „nach dem Preis fragen“. Die Grammatik kommt in der Situation mit.',
            '<strong>Jeden Tag laut sprechen.</strong> Auch allein, auch nur drei Sätze. Lesen und Tippen trainieren nicht dieselbe Fähigkeit.',
            '<strong>Ein fester Termin.</strong> Immer zur gleichen Zeit, an denselben Ort gekoppelt (nach dem Kaffee, vor der S-Bahn). Der Plan scheitert an der Entscheidung, nicht an der Aufgabe.',
          ],
        },
        {
          type: 'p',
          text: 'Die drei Puffertage in der Tabelle unten sind Teil der Methode, nicht Nachsicht: An ihnen wird nichts Neues gelernt, sondern das der Vorwoche wiederholt. Wer nie wiederholt, lernt dreißig Tage lang und erinnert sich an zehn.',
        },
      ],
    },
    {
      id: 'plan',
      heading: 'Der Plan: vier Wochen, zwölf Situationen',
      blocks: [
        {
          type: 'p',
          text: 'Jede Woche hat drei neue Situationen, zwei Wiederholungs- oder Übungstage und einen freien Tag. Am Ende jeder Woche steht ein Ziel, das du ohne Test überprüfen kannst: Sprich es laut. Geht es ohne Nachdenken, ist die Woche erledigt.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1 · Tag 1–7',
              title: 'Wer du bist',
              tasks: [
                'Tag 1: Begrüßen, sich vorstellen, Alphabet und Buchstabieren',
                'Tag 2: Herkunft, Beruf, Zahlen bis 100 (das Verb sein)',
                'Tag 3: Familie und Sprachen (Personalpronomen)',
                'Tag 4: Wiederholung Tag 1–3, alles laut',
                'Tag 5: Deine sechs Vorstellungssätze aufnehmen und anhören',
                'Tag 6: Hörübung A1.1 — eine Begrüßungsszene',
                'Tag 7: Puffer',
              ],
              tip: 'Wochenziel: Du stellst dich 60 Sekunden lang frei vor und buchstabierst deinen Nachnamen, ohne zu stocken.',
            },
            {
              label: 'Woche 2 · Tag 8–14',
              title: 'Die Dinge um dich herum',
              tasks: [
                'Tag 8: Einkaufen und Preise (Nomen mit Genus)',
                'Tag 9: Gegenstände und Farben (bestimmte Artikel der/die/das)',
                'Tag 10: Büro, Technik, Telefon (unbestimmte Artikel ein/eine/kein)',
                'Tag 11: Wiederholung Tag 8–10',
                'Tag 12: 20 neue Wörter aus deinem eigenen Alltag, jeweils mit Artikel und einem Satz',
                'Tag 13: Lesetext A1.1 — ein kurzer Alltagstext',
                'Tag 14: Puffer',
              ],
              tip: 'Wochenziel: Du benennst zehn Dinge in deinem Zimmer mit dem richtigen Artikel und fragst „Was kostet das?“',
            },
            {
              label: 'Woche 3 · Tag 15–21',
              title: 'Dein Tag',
              tasks: [
                'Tag 15: Freizeit und Hobbys (Präsens, regelmäßige Verben)',
                'Tag 16: Uhrzeit, Wochentage, Termine',
                'Tag 17: Im Café bestellen und bezahlen',
                'Tag 18: Wiederholung Tag 15–17',
                'Tag 19: Deinen Tagesablauf in acht Sätzen aufschreiben und laut sprechen',
                'Tag 20: Hörübung A1.1 — eine Restaurant- oder Cafészene',
                'Tag 21: Puffer',
              ],
              tip: 'Wochenziel: Du verabredest dich („Hast du am Freitag um 15 Uhr Zeit?“) und bestellst etwas, ohne den Satz vorher zu bauen.',
            },
            {
              label: 'Woche 4 · Tag 22–30',
              title: 'Unterwegs und in Form',
              tasks: [
                'Tag 22: Am Bahnhof: Fahrpläne, Ja/Nein-Fragen',
                'Tag 23: Dein Tagesablauf mit trennbaren Verben (aufstehen, einkaufen, anrufen)',
                'Tag 24: Einladen und feiern (Possessivartikel mein/dein)',
                'Tag 25: Wiederholung der ganzen Woche',
                'Tag 26: Ein Anmeldeformular ausfüllen und eine kurze Mitteilung schreiben',
                'Tag 27: Alle zwölf Situationen einmal laut durchgehen, je zwei Sätze',
                'Tag 28: Hörübung und Lesetext ohne Hilfe',
                'Tag 29: Schwächste Situation der vier Wochen gezielt wiederholen',
                'Tag 30: Selbsttest — die sechs Ziele unten',
              ],
              tip: 'Wochenziel: Du kommst durch eine unbekannte Alltagssituation, ohne ins Englische zu wechseln.',
            },
          ],
        },
      ],
    },
    {
      id: 'selbsttest',
      heading: 'Tag 30: der Selbsttest',
      blocks: [
        {
          type: 'p',
          text: 'Kein Punktesystem, keine Note. Sechs Aufgaben, laut und ohne Notizen. Was hakt, ist deine Aufgabe für die erste Woche von A1.2 — nicht ein Grund, den Monat zu wiederholen.',
        },
        {
          type: 'list',
          items: [
            'Stell dich 60 Sekunden lang vor und buchstabiere deinen Nachnamen.',
            'Beschreibe deine Familie in fünf Sätzen.',
            'Frage nach dem Preis von drei Dingen in deinem Zimmer.',
            'Bestelle ein Getränk und etwas zu essen, inklusive Bezahlen.',
            'Sage, was du gestern gemacht hast — mit den Chunks, die du gelernt hast.',
            'Fülle ein Anmeldeformular mit deinen Daten aus und schreibe zwei Sätze dazu.',
          ],
        },
        {
          type: 'callout',
          text: 'Wenn du fünf von sechs Aufgaben schaffst, hast du A1.1 erreicht. Das ist keine Prüfung und kein Zertifikat — es ist die Grundlage, auf der A1.2 aufbaut.',
        },
      ],
    },
    {
      id: 'danach',
      heading: 'Was nach den 30 Tagen kommt',
      blocks: [
        {
          type: 'p',
          text: 'A1.2 ist die zweite Hälfte: Wohnen, Gesundheit, Einkaufen im Detail, die Vergangenheit (Perfekt), der Akkusativ als System statt als feste Wendung. Danach — und erst danach — ist eine A1-Prüfung sinnvoll. Format, Punkte und Anmeldung stehen im Leitfaden zu <a href="/leitfaden/start-deutsch-1/">Start Deutsch 1</a>.',
        },
        {
          type: 'p',
          text: 'Wer direkt weiterplant, rechnet für A1.2 noch einmal mit einem vergleichbaren Zeitraum und für die reine Prüfungsphase mit zusätzlichen Wochen: Modellsätze, Zeitdruck, Generalprobe.',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Kostenlos',
              title: 'Die ganze A1.1-Bibliothek',
              body: 'Grammatik, Wortschatz, Lesetexte und Hörübungen auf A1.1 sind hier ohne Konto zugänglich — der Plan oben lässt sich vollständig damit umsetzen.',
            },
            {
              eyebrow: 'Selbsttest',
              title: 'Einstufungstest',
              body: 'Wenn du nicht sicher bist, ob du wirklich bei null anfängst: ein paar Minuten, danach weißt du, ob Tag 1 oder Tag 15 dein Einstieg ist.',
            },
            {
              eyebrow: 'Geführt',
              title: 'Zwölf Lektionen statt zwölf Entscheidungen',
              body: 'Wenn dich das tägliche Auswählen mehr Energie kostet als das Lernen, ist ein geführter Kurs der bessere Weg: dieselbe Reihenfolge, aber als Weg statt als Liste.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Die zwölf Situationen dieses Plans sind dieselben, die der geführte A1.1-Kurs abbildet — Tag 1 entspricht dort Lektion 1. Ausprobieren kostet nichts: <a href="/course/a1.1/l/1?source=organic-guide-plan">Lektion 1 kostenlos starten</a>, die ersten drei Lektionen sind vollständig frei. Die Grammatik dazu bleibt so oder so offen: <a href="/grammar/a1.1/">A1.1-Grammatik</a>, <a href="/reading/">Lesetexte</a>, <a href="/listening/">Hörübungen</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Kann man Deutsch A1 in 30 Tagen lernen?',
      a: 'Das komplette A1-Niveau nicht — dafür rechnet das Goethe-Institut mit 60 bis 80 Unterrichtseinheiten. A1.1, die erste Hälfte, ist in 30 Tagen mit etwa 20 Minuten täglich realistisch, wenn wirklich täglich gelernt wird.',
    },
    {
      q: 'Wie viele Minuten pro Tag brauche ich?',
      a: '20 Minuten an sechs Tagen pro Woche sind die Grundlage dieses Plans. Mehr schadet nicht, aber Regelmäßigkeit bringt mehr als Länge: Zwei Stunden am Wochenende ersetzen sechs kurze Tage nicht.',
    },
    {
      q: 'Was mache ich, wenn ich zwei Tage verpasse?',
      a: 'Weitermachen, wo der Plan steht, nicht aufholen. Die drei Puffertage sind genau dafür da. Ein nachgeholter Doppeltag bringt weniger als ein normaler Tag und kostet mehr Motivation.',
    },
    {
      q: 'Brauche ich ein Lehrbuch für diesen Plan?',
      a: 'Nicht zwingend. Du brauchst pro Tag eine Situation, ein paar Wörter mit Artikel und die Möglichkeit, laut zu sprechen. Die A1.1-Grammatik, Lesetexte und Hörübungen auf dieser Seite decken den Plan ab.',
    },
    {
      q: 'Kann ich nach 30 Tagen die A1-Prüfung machen?',
      a: 'Sinnvoll ist das nicht: Start Deutsch 1 prüft das ganze A1-Niveau, also auch A1.2. Nach diesem Monat hast du die Hälfte und solltest die zweite Hälfte plus eine Prüfungsphase einplanen.',
    },
    {
      q: 'Was ist der Unterschied zwischen A1.1 und A1?',
      a: 'A1.1 ist die erste Hälfte des A1-Niveaus (vorstellen, Alltag, Einkaufen, Uhrzeit), A1.2 die zweite (Wohnen, Gesundheit, Vergangenheit). Das Zertifikat gibt es nur für das vollständige A1-Niveau.',
    },
  ],

  cta: {
    heading: 'Starte den Plan an Tag 1, nicht am Montag',
    body: 'Der Einstufungstest zeigt dir in wenigen Minuten, ob du bei Tag 1 anfängst oder weiter vorne einsteigen kannst.',
  },
};
