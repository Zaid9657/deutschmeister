// telc B1 Sprechen Teil 2 "Über ein Thema sprechen" — exam long-tail page
// (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "telc b1 sprechen teil 2", "telc b1 über ein thema sprechen",
// "telc b1 sprechen themen", "telc b1 sprechen redemittel".
//
// FACTS (checked 2026-10-26 on telc's own pages): Sprechen has three parts,
// about 15 minutes, usually two candidates, 20 minutes of preparation
// (telc.net). telc's Übungstest 1 describes Teil 2 (about 6 minutes): the two
// candidates hold different task sheets with opposing opinions on one topic,
// first tell each other about them, then exchange views and experiences; it
// also says follow-up questions and helping each other count positively.
// The topic, the opinions, the model dialogue and the Redemittel are ours.
// NOT the newer telc Deutsch A2·B1 format, whose speaking parts differ.

export const telcB1SprechenThema = {
  slug: 'telc-b1-sprechen-ueber-ein-thema',
  lang: 'de',
  offer: 'telc',
  title: 'telc B1 Sprechen Teil 2: Über ein Thema sprechen',
  h1: 'telc B1 Sprechen Teil 2: über ein Thema sprechen — Ablauf, Beispiel und Redemittel',
  description:
    'telc B1 Sprechen Teil 2 erklärt: zwei Meinungen wiedergeben, eigene Erfahrung einbringen, auf die Partnerin eingehen. Mit Beispieldialog und Redemitteln.',
  keywords:
    'telc B1 Sprechen Teil 2, telc B1 über ein Thema sprechen, telc B1 Sprechen Themen, telc B1 Sprechen Redemittel, telc B1 mündliche Prüfung',
  badge: 'Sprechen · telc B1',
  lead:
    'Teil 2 der mündlichen telc-B1-Prüfung ist der Teil, in dem Sie am längsten am Stück sprechen. Sie bekommen <strong>eine Meinung zu einem Alltagsthema</strong>, Ihre Partnerin oder Ihr Partner eine andere. Daraus sollen Sie ein echtes Gespräch machen: Meinungen wiedergeben, eigene Erfahrungen erzählen, nachfragen. Hier sehen Sie, wie das abläuft und welche Sätze Sie dafür brauchen.',
  datePublished: '2026-10-26',
  answer:
    'In telc Deutsch B1 Sprechen Teil 2 sprechen Sie etwa sechs Minuten mit einer anderen Person über ein Thema. Jede Person hat ein eigenes Aufgabenblatt mit einer anderen, oft gegensätzlichen Meinung. Zuerst informieren Sie sich gegenseitig über diese Meinungen, dann tauschen Sie sich aus und berichten von eigenen Erfahrungen und Ansichten. Vorher haben Sie 20 Minuten Vorbereitungszeit für Notizen. Nachfragen und gegenseitige Hilfe werden laut telc positiv bewertet.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'telc — Zertifikat Deutsch / telc Deutsch B1', url: 'https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/' },
    { label: 'telc — Übungstest 1 telc Deutsch B1 (PDF)', url: 'https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf' },
  ],

  sections: [
    {
      id: 'ablauf',
      heading: 'So läuft Teil 2 ab',
      blocks: [
        {
          type: 'p',
          text: 'Die mündliche Prüfung von telc Deutsch B1 dauert etwa <strong>15 Minuten</strong> und findet in der Regel mit zwei Teilnehmenden statt. Vorher haben Sie <strong>20 Minuten Vorbereitungszeit</strong>, in denen Sie alle Aufgabenblätter bekommen und sich Notizen machen dürfen. Die drei Teile:',
        },
        {
          type: 'table',
          head: ['Teil', 'Aufgabe', 'Dauer (ca.)'],
          rows: [
            ['Teil 1', 'Einander kennenlernen: über sich erzählen, Fragen stellen', '3 Minuten'],
            ['Teil 2', 'Über ein Thema sprechen: Meinungen wiedergeben und diskutieren', '6 Minuten'],
            ['Teil 3', 'Gemeinsam etwas planen: ein Vorhaben organisieren', '6 Minuten'],
          ],
        },
        {
          type: 'p',
          text: 'In Teil 2 haben Sie und Ihre Partnerin <strong>unterschiedliche Aufgabenblätter</strong> mit kontroversen Meinungen zum selben Thema. Der Ablauf hat zwei Schritte: Zuerst erzählen Sie einander, was auf Ihrem Blatt steht. Danach tauschen Sie sich aus — mit eigenen Erfahrungen und Ihrer eigenen Meinung.',
        },
        {
          type: 'callout',
          text: 'Teil 2 ist kein Vortrag. Sie sprechen nicht zwei Monologe hintereinander, sondern reagieren aufeinander. telc nennt Nachfragen und gegenseitige Hilfestellungen ausdrücklich als positiv.',
        },
      ],
    },
    {
      id: 'vorbereitung',
      heading: 'Die 20 Minuten Vorbereitung richtig nutzen',
      blocks: [
        {
          type: 'p',
          text: 'In der Vorbereitungszeit bereiten Sie alle drei Teile vor. Für Teil 2 reichen etwa sechs bis sieben Minuten, wenn Sie nach einem festen Schema arbeiten:',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Schritt 1',
              title: 'Die Meinung auf Ihrem Blatt in eigenen Worten notieren',
              tasks: [
                'Wer sagt was? Alter, Beruf, Hauptargument',
                'Ein Satz, den Sie frei wiedergeben können — nicht vorlesen',
              ],
            },
            {
              label: 'Schritt 2',
              title: 'Eine eigene Erfahrung sammeln',
              tasks: [
                'Ein konkretes Erlebnis zum Thema, mit Ort und Zeit',
                'Stichwörter im Perfekt vorbereiten: „Letztes Jahr habe ich …"',
              ],
            },
            {
              label: 'Schritt 3',
              title: 'Ihre Meinung mit Grund formulieren',
              tasks: [
                'Eine klare Position: dafür, dagegen oder „es kommt darauf an"',
                'Ein Grund und ein Beispiel',
              ],
            },
            {
              label: 'Schritt 4',
              title: 'Zwei Fragen an die Partnerin vorbereiten',
              tasks: [
                '„Wie ist das bei Ihnen?" / „Was meinen Sie dazu?"',
                'Fragen halten das Gespräch am Laufen, wenn es stockt',
              ],
              tip: 'Schreiben Sie nur Stichwörter, keine ganzen Sätze. Wer in der Prüfung abliest, spricht nicht frei — und verliert den Kontakt zur Partnerin.',
            },
          ],
        },
      ],
    },
    {
      id: 'beispiel',
      heading: 'Beispieldialog: „Smartphones in der Grundschule?"',
      blocks: [
        {
          type: 'p',
          text: 'Eigenes Übungsthema im telc-Stil. Auf Blatt A sagt Frau Weber (38, Mutter): „Kinder brauchen ein Handy, damit sie ihre Eltern jederzeit erreichen können." Auf Blatt B sagt Herr Brandt (52, Lehrer): „Handys lenken ab — in der Grundschule haben sie nichts zu suchen."',
        },
        {
          type: 'model',
          label: 'Beispieldialog (gekürzt)',
          lines: [
            'A: Auf meinem Blatt geht es um Kinder und Smartphones. Eine Mutter, Frau Weber, meint, dass Kinder ein Handy brauchen. Ihr ist wichtig, dass ihr Kind sie immer anrufen kann. Was steht auf Ihrem Blatt?',
            'B: Bei mir ist es fast das Gegenteil. Ein Lehrer, Herr Brandt, sagt, dass Handys die Kinder im Unterricht ablenken. Er findet, dass sie in der Grundschule nichts zu suchen haben.',
            'A: Ich verstehe beide Seiten. Meine Tochter ist neun, und seit diesem Jahr hat sie ein einfaches Handy. Sie fährt allein mit dem Bus zur Schule, deshalb fühle ich mich damit sicherer.',
            'B: Das kann ich gut verstehen. Aber braucht sie wirklich ein Smartphone mit Internet?',
            'A: Nein, das stimmt. Ein Smartphone würde ich ihr noch nicht geben. Und wie ist das bei Ihnen?',
            'B: Ich habe keine Kinder, aber mein Neffe hat schon mit acht ein Smartphone bekommen. Er hat jeden Tag stundenlang gespielt. Deshalb bin ich eher der Meinung von Herrn Brandt: In der Schule sollten Handys ausgeschaltet bleiben.',
            'A: Da haben Sie recht. Vielleicht ist das ein guter Kompromiss: ein Handy für den Schulweg, aber nicht im Klassenzimmer.',
            'B: Ja, damit bin ich einverstanden.',
          ],
        },
        { type: 'h3', text: 'Warum dieser Dialog funktioniert' },
        {
          type: 'list',
          items: [
            'Beide geben die Meinung auf ihrem Blatt <strong>mit eigenen Worten</strong> wieder, mit „dass"-Sätzen statt Zitat.',
            'Jede Person bringt eine <strong>eigene Erfahrung</strong> ein (Tochter, Neffe) — genau das verlangt die Aufgabe.',
            'Es gibt <strong>Fragen und Reaktionen</strong>: „Was steht auf Ihrem Blatt?", „Das kann ich gut verstehen", „Da haben Sie recht".',
            'Am Ende steht ein <strong>Kompromiss</strong>. Er ist nicht vorgeschrieben, zeigt aber, dass Sie wirklich aufeinander eingehen.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für Teil 2',
      blocks: [
        { type: 'h3', text: 'Die Meinung vom Blatt wiedergeben' },
        {
          type: 'list',
          items: [
            'Auf meinem Blatt geht es um … / Mein Text handelt von …',
            'Eine Frau / Ein Mann meint, dass …',
            'Er / Sie ist der Meinung, dass … , weil …',
          ],
        },
        { type: 'h3', text: 'Eigene Erfahrung erzählen' },
        {
          type: 'list',
          items: [
            'Ich habe damit folgende Erfahrung gemacht: …',
            'Als ich … war, habe ich …',
            'In meinem Heimatland ist das anders: Dort …',
          ],
        },
        { type: 'h3', text: 'Die eigene Meinung sagen' },
        {
          type: 'list',
          items: [
            'Ich finde / glaube / denke, dass …',
            'Meiner Meinung nach …',
            'Das kommt darauf an, ob …',
          ],
        },
        { type: 'h3', text: 'Reagieren, zustimmen, widersprechen' },
        {
          type: 'list',
          items: [
            'Da haben Sie recht. / Das sehe ich genauso.',
            'Das stimmt, aber … / Da bin ich anderer Meinung.',
            'Wie meinen Sie das genau? / Und wie ist das bei Ihnen?',
          ],
        },
        {
          type: 'callout',
          text: 'Drei Redemittel pro Gruppe reichen. Üben Sie sie, bis sie automatisch kommen — in der Prüfung brauchen Sie Ihre Konzentration für den Inhalt, nicht für die Formulierung.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Häufige Fehler in Teil 2',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Das Blatt vorlesen',
              body: 'Wer die Meinung vom Blatt wörtlich vorliest, zeigt keine eigene Sprache. Fassen Sie zusammen: wer, was, warum — in ein bis zwei eigenen Sätzen.',
            },
            {
              title: 'Monolog statt Gespräch',
              body: 'Drei Minuten ohne Pause sprechen und dann die Partnerin drei Minuten sprechen lassen: Das ist kein Austausch. Stellen Sie nach spätestens drei, vier Sätzen eine Frage.',
            },
            {
              title: 'Keine eigene Erfahrung',
              body: 'Die Aufgabe verlangt ausdrücklich eigene Erfahrungen und Ansichten. „Ich weiß nicht" ist keine Antwort — erzählen Sie etwas aus Ihrem Alltag, Ihrem Heimatland oder von Menschen, die Sie kennen.',
            },
            {
              title: 'Die Partnerin ignorieren',
              body: 'Wenn Ihre Partnerin stockt, helfen Sie mit einer Frage. Gegenseitige Hilfe wird positiv bewertet und schadet Ihnen nicht.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'Teil 2 allein üben',
      blocks: [
        {
          type: 'p',
          text: 'Wählen Sie Alltagsthemen mit zwei Seiten: Homeoffice, Fernsehen für Kinder, Online-Einkauf, Leben auf dem Land oder in der Stadt, Haustiere in der Wohnung. Schreiben Sie für jedes Thema zwei gegensätzliche Meinungen auf und sprechen Sie beide Rollen laut — mit Stoppuhr, sechs Minuten.',
        },
        {
          type: 'p',
          text: 'Mit dem <a href="/speaking/">KI-Sprechtraining</a> sprechen Sie frei zu einem Thema mit einem KI-Gesprächspartner und erhalten nach dem Gespräch eine Auswertung zu Grammatik, Wortschatz und Ausdruck. Die Strukturen dafür — dass-Sätze, weil, Perfekt — finden Sie in der <a href="/grammar/b1.1/">B1.1-Grammatik</a>.',
        },
        {
          type: 'p',
          text: 'Weiter mit Teil 3: <a href="/leitfaden/telc-b1-gemeinsam-etwas-planen/">Gemeinsam etwas planen in telc B1</a>. Den Überblick über die ganze Prüfung gibt der <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange dauert Teil 2 der mündlichen telc-B1-Prüfung?',
      a: 'telc gibt für Teil 2 etwa sechs Minuten an, für beide Teilnehmenden zusammen. Die ganze mündliche Prüfung dauert etwa 15 Minuten, dazu kommen 20 Minuten Vorbereitung.',
    },
    {
      q: 'Muss ich in Teil 2 eine Präsentation halten?',
      a: 'Nein, nicht in telc Deutsch B1. Sie geben kurz die Meinung von Ihrem Aufgabenblatt wieder und diskutieren dann mit Ihrer Partnerin. Eine Präsentation gibt es zum Beispiel im Goethe-Zertifikat B1.',
    },
    {
      q: 'Darf ich in der Prüfung meine Notizen benutzen?',
      a: 'Laut telc dürfen Sie sich in der Vorbereitungszeit Notizen machen und diese im Prüfungsgespräch verwenden. Sie sollten aber frei sprechen und nicht ablesen.',
    },
    {
      q: 'Was passiert, wenn meine Partnerin kaum spricht?',
      a: 'Stellen Sie Fragen und helfen Sie ihr ins Gespräch. Das wird positiv bewertet. Wenn das Gespräch stockt, geben auch die Prüfenden Impulse.',
    },
    {
      q: 'Muss ich am Ende von Teil 2 einer Meinung sein?',
      a: 'Nein. Es geht um den Austausch von Meinungen und Erfahrungen. Sie dürfen unterschiedlicher Meinung bleiben, solange Sie aufeinander eingehen.',
    },
  ],

  cta: {
    heading: 'Die ganze telc-B1-Prüfung im Plan üben',
    body: 'Die telc-B1-Komplettvorbereitung verbindet Sprechtraining, Schreiben, Lesen und Hören zu einem festen Tagesplan. Auf der Kursseite sehen Sie den Inhalt und ob der Kurs gerade buchbar ist.',
  },
};
