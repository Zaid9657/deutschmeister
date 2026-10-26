// telc B1 Sprechen Teil 3 "Gemeinsam etwas planen" — exam long-tail page
// (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "telc b1 gemeinsam etwas planen", "telc b1 sprechen teil 3",
// "gemeinsam etwas planen redemittel", "telc b1 planen beispiel".
//
// FACTS (checked 2026-10-26 on telc's own pages): Sprechen has three parts,
// about 15 minutes, 20 minutes of preparation (telc.net). telc's Übungstest 1:
// Teil 3 lasts about 6 minutes; the candidates organise a given project
// (event, party, concert, exhibition, sports event), bring in their own ideas
// and suggestions, react to the partner's, and settle what has to be done and
// who does which task; notes are made on stamped sheets in the preparation room
// and should not be read out. The scenario, dialogue and Redemittel are ours.

export const telcB1GemeinsamPlanen = {
  slug: 'telc-b1-gemeinsam-etwas-planen',
  lang: 'de',
  offer: 'telc',
  title: 'telc B1 Gemeinsam etwas planen: Beispiel & Redemittel',
  h1: 'telc B1 Sprechen Teil 3: gemeinsam etwas planen — Beispieldialog und Redemittel',
  description:
    'telc B1 Sprechen Teil 3: Vorschläge machen, reagieren, Aufgaben verteilen. Ablauf laut telc, ein kompletter Beispieldialog und die wichtigsten Redemittel.',
  keywords:
    'telc B1 gemeinsam etwas planen, telc B1 Sprechen Teil 3, gemeinsam etwas planen Redemittel, telc B1 planen Beispiel, telc B1 mündliche Prüfung',
  badge: 'Sprechen · telc B1',
  lead:
    'Im letzten Teil der mündlichen Prüfung organisieren Sie mit Ihrer Partnerin oder Ihrem Partner ein <strong>gemeinsames Vorhaben</strong> — eine Feier, einen Ausflug, eine Veranstaltung. Wer hier Vorschläge macht, auf Ideen reagiert und am Ende klärt, wer was übernimmt, erfüllt die Aufgabe. Dieser Leitfaden zeigt den Ablauf, einen kompletten Beispieldialog und die Redemittel dafür.',
  datePublished: '2026-10-26',
  answer:
    'In telc Deutsch B1 Sprechen Teil 3 planen Sie etwa sechs Minuten lang mit einer anderen Person ein vorgegebenes Vorhaben, zum Beispiel eine Feier, ein Konzert oder einen Ausflug. Sie bringen eigene Ideen und Vorschläge ein, reagieren auf die Vorschläge der Partnerin oder des Partners und klären, was zu tun ist und wer welche Aufgabe übernimmt. Die Aufgabe kennen Sie schon aus der 20-minütigen Vorbereitungszeit. Wichtig ist ein echtes Hin und Her, kein vorbereiteter Monolog.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'telc — Zertifikat Deutsch / telc Deutsch B1', url: 'https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/' },
    { label: 'telc — Übungstest 1 telc Deutsch B1 (PDF)', url: 'https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf' },
  ],

  sections: [
    {
      id: 'ablauf',
      heading: 'Was in Teil 3 verlangt wird',
      blocks: [
        {
          type: 'p',
          text: 'Teil 3 ist der Abschluss der mündlichen Prüfung von telc Deutsch B1 und dauert <strong>etwa sechs Minuten</strong>. Sie und Ihre Partnerin bekommen eine Situation und eine Stichwortliste — zum Beispiel „Wann? Wo? Essen? Getränke? Wer bezahlt?". Ihre Aufgabe nach den telc-Prüfungshinweisen:',
        },
        {
          type: 'list',
          items: [
            'eigene <strong>Ideen und Vorschläge</strong> einbringen,',
            'auf die <strong>Vorschläge der Partnerin</strong> reagieren — zustimmen, ablehnen, etwas anderes vorschlagen,',
            'klären, <strong>was zu tun ist</strong> und <strong>wer welche Aufgabe</strong> übernimmt.',
          ],
        },
        {
          type: 'p',
          text: 'Die Aufgabenblätter bekommen Sie schon in der <strong>20-minütigen Vorbereitungszeit</strong>. Notizen machen Sie auf gestempelten Blättern des Prüfungszentrums und dürfen sie mitnehmen — ablesen sollten Sie aber nicht.',
        },
        {
          type: 'callout',
          text: 'Die Stichwortliste ist eine Hilfe, keine Pflichtliste. Sie müssen nicht jeden Punkt abarbeiten, aber Sie sollten zu einem gemeinsamen Ergebnis kommen: Was machen wir, und wer kümmert sich um was?',
        },
      ],
    },
    {
      id: 'strategie',
      heading: 'Eine Strategie in vier Schritten',
      blocks: [
        {
          type: 'steps',
          items: [
            {
              label: 'Schritt 1',
              title: 'Das Ziel nennen',
              tasks: [
                'Ein Satz zum Einstieg: „Wir sollen zusammen … planen."',
                'Mit einer Frage öffnen: „Haben Sie schon eine Idee?"',
              ],
            },
            {
              label: 'Schritt 2',
              title: 'Punkt für Punkt vorschlagen',
              tasks: [
                'Zu jedem Stichwort ein Vorschlag mit Grund',
                'Abwechseln: einmal schlagen Sie vor, einmal Ihre Partnerin',
              ],
              tip: 'Bereiten Sie zu jedem Stichwort genau einen Vorschlag vor. Mehr brauchen Sie nicht — der Rest entsteht im Gespräch.',
            },
            {
              label: 'Schritt 3',
              title: 'Reagieren, auch mal widersprechen',
              tasks: [
                'Zustimmen mit Begründung, oder höflich einen Gegenvorschlag machen',
                'Ein kleiner Widerspruch macht das Gespräch lebendig',
              ],
            },
            {
              label: 'Schritt 4',
              title: 'Aufgaben verteilen und zusammenfassen',
              tasks: [
                '„Ich kümmere mich um …, und Sie übernehmen …"',
                'Zum Schluss das Ergebnis in zwei Sätzen wiederholen',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'beispiel',
      heading: 'Beispieldialog: ein Fest zum Kursende',
      blocks: [
        {
          type: 'p',
          text: 'Eigene Übungsaufgabe im telc-Stil: Ihr Deutschkurs endet in zwei Wochen. Sie möchten zusammen mit Ihrer Partnerin ein kleines Abschlussfest für die Gruppe organisieren. Stichwörter: Wann? Wo? Essen und Getränke? Programm? Wer macht was?',
        },
        {
          type: 'model',
          label: 'Beispieldialog',
          lines: [
            'A: Wir sollen zusammen ein Fest zum Kursende planen. Haben Sie schon eine Idee, wann wir feiern könnten?',
            'B: Ich würde den letzten Kurstag vorschlagen, also Freitag in zwei Wochen. Dann sind noch alle da.',
            'A: Gute Idee, aber am Vormittag haben wir ja Unterricht. Wie wäre es mit Freitagabend, so um 18 Uhr?',
            'B: Einverstanden. Und wo? Vielleicht in einem Restaurant?',
            'A: Das finde ich ein bisschen teuer für alle. Ich schlage vor, dass wir im Kursraum feiern. Ich frage die Kursleiterin, ob das möglich ist.',
            'B: Gut, dann sparen wir Geld. Beim Essen könnte jeder etwas mitbringen, am besten ein Gericht aus seinem Heimatland.',
            'A: Das gefällt mir! Um die Getränke kümmere ich mich. Könnten Sie eine Liste machen, wer welches Essen mitbringt?',
            'B: Ja, das mache ich. Und zum Programm: Wir könnten Musik aus verschiedenen Ländern spielen.',
            'A: Prima. Dann fasse ich zusammen: Wir feiern am Freitag um 18 Uhr im Kursraum. Ich frage die Kursleiterin und besorge die Getränke, Sie machen die Essensliste und kümmern sich um die Musik.',
            'B: Genau. Das wird bestimmt ein schöner Abend!',
          ],
        },
        { type: 'h3', text: 'Was dieser Dialog zeigt' },
        {
          type: 'list',
          items: [
            'Beide machen <strong>eigene Vorschläge</strong> und begründen sie („Dann sind noch alle da", „dann sparen wir Geld").',
            'Es gibt einen <strong>Gegenvorschlag</strong> (Restaurant → Kursraum), höflich formuliert.',
            'Am Ende ist klar, <strong>wer welche Aufgabe übernimmt</strong> — genau das verlangt die telc-Aufgabe.',
            'Die <strong>Zusammenfassung</strong> beendet den Teil sauber und zeigt, dass Sie zugehört haben.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel zum gemeinsamen Planen',
      blocks: [
        { type: 'h3', text: 'Vorschläge machen' },
        {
          type: 'list',
          items: [
            'Ich schlage vor, dass wir …',
            'Wie wäre es mit … ? / Wie wäre es, wenn wir … ?',
            'Wir könnten doch … / Was halten Sie davon, wenn …?',
          ],
        },
        { type: 'h3', text: 'Zustimmen' },
        {
          type: 'list',
          items: [
            'Gute Idee! / Das finde ich gut, weil …',
            'Einverstanden. / Das machen wir so.',
          ],
        },
        { type: 'h3', text: 'Ablehnen und Gegenvorschlag' },
        {
          type: 'list',
          items: [
            'Das finde ich nicht so gut, weil … Vielleicht könnten wir …',
            'Ich bin nicht sicher, ob das klappt. Was meinen Sie zu …?',
          ],
        },
        { type: 'h3', text: 'Aufgaben verteilen und zusammenfassen' },
        {
          type: 'list',
          items: [
            'Ich kümmere mich um … / Ich übernehme …',
            'Könnten Sie … ? / Wer macht …?',
            'Also, dann fasse ich zusammen: …',
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Fehler, die Teil 3 schwach machen',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Alles allein planen',
              body: 'Wer alle Punkte selbst entscheidet und die Partnerin nur nicken lässt, zeigt kein gemeinsames Planen. Fragen Sie nach jedem Vorschlag nach ihrer Meinung.',
            },
            {
              title: 'Immer nur „Ja, gut"',
              body: 'Reine Zustimmung ist bequem, aber dünn. Ein begründeter Gegenvorschlag zeigt mehr Sprache und macht das Gespräch echt.',
            },
            {
              title: 'Die Aufgabenverteilung vergessen',
              body: 'Die Aufgabe verlangt ausdrücklich, wer welche Aufgabe übernimmt. Ohne diesen Schritt bleibt der Plan unvollständig.',
            },
            {
              title: 'Ablesen',
              body: 'Notizen sind erlaubt, Ablesen nicht gewünscht. Stichwörter helfen beim Erinnern — die Sätze bilden Sie im Gespräch.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So üben Sie das Planen',
      blocks: [
        {
          type: 'p',
          text: 'Üben Sie mit Alltagsanlässen: Geburtstagsfeier für eine Kollegin, Ausflug am Wochenende, Flohmarkt im Haus, Besuch eines Konzerts, Grillfest im Park. Pro Anlass: fünf Stichwörter aufschreiben, zu jedem einen Vorschlag, dann sechs Minuten laut planen.',
        },
        {
          type: 'p',
          text: 'Ohne Partnerin hilft das <a href="/speaking/">KI-Sprechtraining</a>: Sie sprechen frei mit einem KI-Gesprächspartner und bekommen nach dem Gespräch eine Auswertung zu Grammatik, Wortschatz und Ausdruck. Für die Konjunktiv-Formen (könnten, würde, wäre) lohnt sich die <a href="/grammar/b1.1/">B1.1-Grammatik</a>.',
        },
        {
          type: 'p',
          text: 'Den mittleren Teil der Prüfung erklärt <a href="/leitfaden/telc-b1-sprechen-ueber-ein-thema/">telc B1 Sprechen Teil 2: über ein Thema sprechen</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange dauert „Gemeinsam etwas planen" in telc B1?',
      a: 'Laut telc etwa sechs Minuten für beide Teilnehmenden zusammen. Die ganze mündliche Prüfung dauert etwa 15 Minuten.',
    },
    {
      q: 'Müssen wir uns am Ende einig sein?',
      a: 'Die telc-Aufgabe verlangt, dass Sie gemeinsam klären, was zu tun ist und wer welche Aufgabe übernimmt. Ein gemeinsames Ergebnis ist deshalb das Ziel. Unterschiedliche Vorschläge auf dem Weg dorthin sind ausdrücklich erwünscht.',
    },
    {
      q: 'Muss ich alle Stichwörter auf dem Blatt besprechen?',
      a: 'Die Stichwörter sind eine Orientierung. Besprechen Sie die wichtigsten Punkte gründlich, statt alle nur kurz zu nennen — und verteilen Sie am Ende die Aufgaben.',
    },
    {
      q: 'Was ist der Unterschied zum DTZ?',
      a: 'Im Deutsch-Test für Zuwanderer gibt es ebenfalls einen Teil „Gemeinsam etwas planen" mit Leitpunkten. Die Aufgabe ist ähnlich, die Situationen kommen stärker aus dem Alltag in Deutschland, zum Beispiel ein Kurs an der Volkshochschule.',
    },
    {
      q: 'Welche Grammatik brauche ich für Teil 3?',
      a: 'Vor allem höfliche Vorschläge im Konjunktiv II (könnten, würde, wäre), Nebensätze mit dass und weil und Verben mit Präposition wie „sich kümmern um".',
    },
  ],

  cta: {
    heading: 'telc B1: Sprechen, Schreiben, Lesen und Hören im Plan',
    body: 'Die telc-B1-Komplettvorbereitung gibt Ihnen jeden Tag eine feste Aufgabe bis zur Prüfung. Auf der Kursseite sehen Sie den Inhalt und ob der Kurs gerade buchbar ist.',
  },
};
