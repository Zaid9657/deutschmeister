// „Auf Deutsch im Café bestellen" — organic launch week 3
// (docs/marketing/a11-organic-launch-calendar.md). Data module, not a page:
// see the header of ./deutsch-a1-anfaenger-start.js for why.
//
// SEARCH INTENT: „im Café bestellen Deutsch“, „Kaffee bestellen auf Deutsch“,
// „ich hätte gern oder ich möchte“. This searcher has a real counter in front
// of them, often in the next 24 hours. So the article is built as a script of
// the actual exchange, in order, with the three politeness levels and the
// paying part that most courses skip — plus the one thing that surprises
// visitors, which is that you usually pay at the table and tip by rounding up.
//
// This is deliberately the least „learning-theory“ of the four articles: no
// method, just the dialogue and the words. Nothing here repeats a paragraph
// from the other three (tests/a11-organic-content.test.mjs enforces it).
//
// FACT DISCIPLINE: the only exam claim is that ordering/asking politely is the
// Sprechen-Teil-3 task type of Start Deutsch 1 — from the Goethe
// Prüfungsziele/Testbeschreibung in `sources`. Café customs (paying at the
// table, rounding up) are described as common practice, not as rules, because
// they vary — and no price of any kind is stated.

export const aufDeutschImCafeBestellen = {
  slug: 'auf-deutsch-im-cafe-bestellen',
  title: 'Im Café auf Deutsch bestellen: der ganze Ablauf',
  h1: 'Auf Deutsch im Café bestellen: Satz für Satz, vom Hinsetzen bis zum Zahlen',
  description:
    'Im Café auf Deutsch bestellen: „Ich hätte gern …“, die höflichen Varianten, die Fragen der Bedienung, das Bezahlen — mit Dialog zum Nachsprechen.',
  keywords:
    'im Café bestellen Deutsch, Kaffee bestellen auf Deutsch, ich hätte gern, Deutsch A1 Restaurant, bezahlen auf Deutsch',
  badge: 'Leitfaden',
  lead:
    'Ein Kaffee zu bestellen ist die erste echte deutsche Unterhaltung, die die meisten Lernenden führen — kurz, vorhersehbar und mit einem Ergebnis, das man trinken kann. Dieser Leitfaden geht den kompletten Besuch durch: hinsetzen, bestellen, nachfragen, bezahlen. Alle Sätze sind A1 und alle kommen im echten Café genau so vor.',
  datePublished: '2026-09-16',
  answer:
    'Der höflichste Standardsatz ist „Ich hätte gern einen Kaffee, bitte.“ Genauso üblich sind „Ich nehme …“ und „Ich möchte …“; die knappe Form „Einen Kaffee, bitte.“ funktioniert ebenfalls. Die Bedienung fragt meist zuerst „Was darf es sein?“ und später „Zusammen oder getrennt?“. In vielen Cafés wird am Tisch bezahlt, nicht an der Kasse — du sagst „Zahlen, bitte“ und rundest den Betrag beim Trinkgeld auf, indem du direkt sagst, wie viel du insgesamt gibst.',
  factsCheckedOn: '2026-09-03',
  sources: [
    { label: 'Goethe-Institut — Prüfungsziele/Testbeschreibung A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf' },
    { label: 'Goethe-Institut — Wortliste A1 (Essen und Trinken)', url: 'https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf' },
  ],

  sections: [
    {
      id: 'ablauf',
      heading: 'Der Ablauf, in der Reihenfolge, in der er passiert',
      blocks: [
        {
          type: 'p',
          text: 'Ein Cafébesuch in Deutschland hat vier Stationen. Wenn du weißt, was an jeder gesagt wird, brauchst du unterwegs kein einziges neues Wort.',
        },
        {
          type: 'table',
          head: ['Station', 'Die Bedienung sagt', 'Du sagst'],
          rows: [
            ['Platz nehmen', 'Ist der Platz frei? (oder nichts)', 'Ist hier noch frei? — Entschuldigung, ist dieser Tisch frei?'],
            ['Bestellen', 'Was darf es sein? / Was möchten Sie?', 'Ich hätte gern einen Kaffee, bitte.'],
            ['Nachfragen', 'Möchten Sie noch etwas? / Sonst noch etwas?', 'Nein danke, das ist alles. / Ja, bitte: ein Glas Wasser.'],
            ['Bezahlen', 'Zusammen oder getrennt?', 'Zahlen, bitte. — Zusammen, bitte.'],
          ],
        },
        {
          type: 'p',
          text: 'Beachte die Höflichkeitsform: Im Café wird gesiezt, in beide Richtungen. „Was darf es sein?“ ist die häufigste Eröffnung und wörtlich schwer zu übersetzen — merk sie dir als Ganzes, nicht Wort für Wort.',
        },
      ],
    },
    {
      id: 'bestellsaetze',
      heading: '„Ich hätte gern“, „ich möchte“, „ich nehme“ — was wann?',
      blocks: [
        {
          type: 'p',
          text: 'Drei Sätze bestellen dasselbe, klingen aber unterschiedlich. Alle drei sind höflich; keiner ist falsch.',
        },
        {
          type: 'list',
          items: [
            '<strong>Ich hätte gern einen Kaffee.</strong> — der höflichste Standard. Funktioniert überall, vom Café bis zur Bäckerei.',
            '<strong>Ich möchte einen Kaffee.</strong> — freundlich und neutral, minimal direkter.',
            '<strong>Ich nehme den Apfelkuchen.</strong> — die typische Wahl, wenn man aus einer Karte auswählt.',
            '<strong>Einen Kaffee, bitte.</strong> — kurz, völlig üblich an der Theke. Das „bitte“ macht es höflich.',
          ],
        },
        {
          type: 'p',
          text: 'Das Wichtige daran ist nicht die Form, sondern der Artikel dahinter: <em>ein<strong>en</strong></em> Kaffee, <em>ein</em> Glas Wasser, <em>ein<strong>e</strong></em> Limonade. Bestellen heißt Akkusativ — und der ist der Punkt, an dem A1.1 endet und A1.2 beginnt. Für den Anfang reicht es, die Getränke als feste Paare zu lernen: „einen Kaffee“, „einen Tee“, „ein Wasser“, „eine Cola“. Die Artikel selbst stehen in <a href="/grammar/a1.1/indefinite-articles/">Unbestimmte Artikel</a>.',
        },
        {
          type: 'callout',
          text: '„Ein Kaffee“ ist an der Theke nicht schlimm — du bekommst deinen Kaffee. Aber die Form mit „-en“ ist der kleine Unterschied zwischen „verstanden werden“ und „richtig klingen“, und sie kostet dich einen einzigen Buchstaben.',
        },
      ],
    },
    {
      id: 'dialog',
      heading: 'Der komplette Dialog',
      blocks: [
        {
          type: 'p',
          text: 'So klingt der ganze Besuch. Lies ihn zweimal laut — einmal die Rolle des Gastes, einmal die der Bedienung, damit du beide Seiten erkennst, wenn es schnell geht.',
        },
        {
          type: 'table',
          head: ['Wer', 'Was gesagt wird'],
          rows: [
            ['Gast', 'Entschuldigung, ist hier noch frei?'],
            ['Bedienung', 'Ja, bitte. — Was darf es sein?'],
            ['Gast', 'Ich hätte gern einen Kaffee, bitte.'],
            ['Bedienung', 'Gern. Mit Milch?'],
            ['Gast', 'Ja, bitte. Und ein Glas Wasser.'],
            ['Bedienung', 'Sonst noch etwas?'],
            ['Gast', 'Nein danke, das ist alles.'],
            ['Bedienung', '(später) Hat es geschmeckt?'],
            ['Gast', 'Sehr gut, danke. Zahlen, bitte.'],
            ['Bedienung', 'Zusammen oder getrennt?'],
            ['Gast', 'Zusammen, bitte.'],
          ],
        },
        {
          type: 'p',
          text: 'Die Frage „Hat es geschmeckt?“ verlangt keine Bewertung — „Sehr gut, danke“ oder einfach „Danke, ja“ reicht vollkommen.',
        },
      ],
    },
    {
      id: 'bezahlen',
      heading: 'Bezahlen: der Teil, den Kurse auslassen',
      blocks: [
        {
          type: 'p',
          text: 'In vielen deutschen Cafés und Restaurants wird <strong>am Tisch</strong> bezahlt, nicht an einer Kasse: Du sagst „Zahlen, bitte“ und wartest, bis jemand mit dem Gerät oder dem Geldbeutel kommt. In Ketten und an Theken läuft es wie überall sonst.',
        },
        {
          type: 'list',
          items: [
            '<strong>Zahlen, bitte.</strong> oder <strong>Ich möchte bitte zahlen.</strong> — beides üblich.',
            '<strong>Zusammen oder getrennt?</strong> — eine Rechnung für alle oder eine pro Person. Getrennt zu zahlen ist normal und keine Unhöflichkeit.',
            '<strong>Kann ich mit Karte zahlen?</strong> — immer noch eine sinnvolle Frage: Nicht jedes kleine Café nimmt Karte, deshalb lohnt sich etwas Bargeld.',
            '<strong>Trinkgeld:</strong> üblich ist Aufrunden. Du nennst beim Bezahlen direkt die Summe, die du insgesamt gibst — den Betrag also, den du inklusive Trinkgeld zahlen möchtest —, statt Geld auf dem Tisch liegen zu lassen.',
          ],
        },
        {
          type: 'p',
          text: 'Für die Zahlen dahinter lohnt sich ein Blick auf <a href="/grammar/a1.1/time-and-dates/">Uhrzeit, Wochentage und Datum</a> — dieselben Zahlwörter tauchen beim Preis, beim Termin und bei der Hausnummer wieder auf.',
        },
      ],
    },
    {
      id: 'uebung',
      heading: 'Übung: die Bestellung ohne Blatt',
      blocks: [
        {
          type: 'p',
          text: 'Diese Übung dauert fünf Minuten und macht aus gelesenen Sätzen sprechbare. Du brauchst nur den Dialog oben und deine Stimme.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Runde 1',
              title: 'Mitlesen, laut',
              tasks: [
                'Lies den ganzen Dialog laut, beide Rollen',
                'Achte auf „Was darf es sein?“ — das ist ein Block, kein Satzbau',
                'Sprich „Ich hätte gern“ dreimal hintereinander, bis es fließt',
              ],
              tip: 'Der Satz „Ich hätte gern …“ trägt dich durch Bäckerei, Kiosk, Apotheke und Amt. Er ist die beste Investition dieser Woche.',
            },
            {
              label: 'Runde 2',
              title: 'Dein eigener Wunsch',
              tasks: [
                'Ersetze den Kaffee durch das, was du wirklich trinkst',
                'Bestelle zusätzlich etwas zu essen: „Und ein Stück Kuchen, bitte.“',
                'Beantworte laut die Rückfrage „Sonst noch etwas?“ — einmal mit Ja, einmal mit Nein',
              ],
              tip: 'Wer nur eine Antwort geübt hat, steht still, sobald die andere kommt. Beide Antworten zu üben kostet zehn Sekunden.',
            },
            {
              label: 'Runde 3',
              title: 'Zahlen ohne Vorwarnung',
              tasks: [
                'Sprich: „Zahlen, bitte.“ — dann: „Zusammen, bitte.“',
                'Frage: „Kann ich mit Karte zahlen?“',
                'Nenne eine beliebige Summe als Gesamtbetrag inklusive Trinkgeld',
              ],
              tip: 'Genau diese drei Sätze fehlen den meisten Lernenden im Moment des Bezahlens — nicht die Bestellung.',
            },
          ],
        },
        {
          type: 'callout',
          text: 'Selbsttest: Kannst du den ganzen Besuch in unter 30 Sekunden durchsprechen, ohne nachzusehen? Dann hältst du ihn auch, wenn hinter dir jemand wartet.',
        },
      ],
    },
    {
      id: 'weiter',
      heading: 'Weiterüben — kostenlos und mit Ton',
      blocks: [
        {
          type: 'p',
          text: 'Bestellen ist eine Hörsituation, bevor es eine Sprechsituation ist: Man muss die Rückfrage verstehen, um antworten zu können.',
        },
        {
          type: 'list',
          items: [
            '<a href="/listening/">Hörübungen</a> ab A1.1 — darunter Szenen im Restaurant und Café, von Muttersprachler:innen gesprochen.',
            '<a href="/reading/">Lesetexte</a> ab A1.1 — kurze Alltagstexte, unter anderem zum Frühstück und zum Einkaufen.',
            '<a href="/grammar/a1.1/indefinite-articles/">Unbestimmte Artikel</a> und <a href="/grammar/a1.1/definite-articles/">Bestimmte Artikel</a> — die Formen hinter „einen Kaffee“ und „der Kuchen“.',
          ],
        },
        {
          type: 'p',
          text: 'Im A1.1-Kurs ist das Café Lektion 9: Dialog, Wortschatz, eine Sprechaufgabe („Bitten Sie im Café um ein Glas Wasser“) und eine kurze Schreibaufgabe. Wenn du sie ausprobieren willst, beginne der Reihe nach — <a href="/course/a1.1/l/1?source=organic-guide-cafe">Lektion 1 kostenlos starten</a>; die ersten drei Lektionen sind vollständig frei.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Sagt man „Ich hätte gern“ oder „Ich möchte“?',
      a: 'Beides ist höflich und üblich. „Ich hätte gern …“ klingt eine Spur zuvorkommender und ist die sicherste Wahl in jeder Situation; „Ich möchte …“ ist neutral. Falsch ist keine der beiden Formen.',
    },
    {
      q: 'Heißt es „einen Kaffee“ oder „ein Kaffee“?',
      a: '„Einen Kaffee“, weil das Bestellte im Akkusativ steht und „Kaffee“ maskulin ist. Bei neutralen Wörtern bleibt es „ein“: ein Glas Wasser, ein Stück Kuchen. Bei femininen Wörtern „eine“: eine Limonade.',
    },
    {
      q: 'Wie frage ich nach der Rechnung?',
      a: '„Zahlen, bitte.“ ist die kürzeste und häufigste Form, „Ich möchte bitte zahlen“ die vollständige. In vielen Cafés wird am Tisch bezahlt, deshalb sagt man es der Bedienung und geht nicht zur Kasse.',
    },
    {
      q: 'Was bedeutet „Zusammen oder getrennt?“',
      a: 'Die Frage, ob eine Rechnung für den ganzen Tisch erstellt werden soll oder eine pro Person. Beides ist völlig normal; „Getrennt, bitte“ gilt nicht als unhöflich.',
    },
    {
      q: 'Wie viel Trinkgeld gibt man in Deutschland?',
      a: 'Üblich ist Aufrunden auf einen glatten Betrag. Gesagt wird es beim Bezahlen, indem man die Gesamtsumme nennt, die man geben möchte — Trinkgeld ist freiwillig und wird nicht automatisch auf die Rechnung gesetzt.',
    },
    {
      q: 'Kommt das Bestellen in der A1-Prüfung vor?',
      a: 'In Start Deutsch 1 gibt es im Sprechteil eine Aufgabe, in der man anhand von Bildkarten eine Bitte formuliert und auf eine Bitte reagiert — „Ein Glas Wasser, bitte“ ist genau diese Textsorte. Ein Café-Dialog als solcher wird nicht abgefragt.',
    },
  ],

  cta: {
    heading: 'Übe die Situation, nicht die Vokabelliste',
    body: 'Der Einstufungstest sagt dir, wo du stehst — danach übst du Café, Bahnhof und Büro als ganze Situationen statt als Wortlisten.',
  },
};
