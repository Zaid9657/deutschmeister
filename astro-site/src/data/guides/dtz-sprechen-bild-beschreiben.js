// DTZ Sprechen Teil 2: Bild beschreiben und über Erfahrungen sprechen — exam
// long-tail page (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "dtz bildbeschreibung", "dtz sprechen teil 2", "dtz bild
// beschreiben redemittel", "dtz über erfahrungen sprechen".
//
// FACTS (checked 2026-10-26 on the vendors' own pages):
//   - BAMF: the oral part takes about 15 minutes; you introduce yourself and
//     talk about given topics with the examiners and another candidate.
//   - telc DTZ Übungstest: Sprechen about 16 minutes; Teil 1A Über sich
//     sprechen (task sheet with keywords), 1B Auf Nachfragen reagieren, Teil 2A
//     Über Erfahrungen sprechen (task sheet with a picture), 2B Auf Nachfragen
//     reagieren (examiner questions), Teil 3 Gemeinsam etwas planen.
//   - telc's "Auf jeden Fall" DTZ practice test quotes the Teil 2 prompts: what
//     do you see on the photo, what situation does it show, what experience
//     have you had with it — with examiner questions at A2 and B1.
// The picture situation, model answer and Redemittel are our own material.

export const dtzSprechenBild = {
  slug: 'dtz-sprechen-bild-beschreiben',
  lang: 'de',
  offer: 'dtz-waitlist',
  title: 'DTZ Sprechen Teil 2: Bild beschreiben & Redemittel',
  h1: 'DTZ Sprechen Teil 2: ein Bild beschreiben und über Erfahrungen sprechen',
  description:
    'DTZ Sprechen Teil 2: ein Foto beschreiben, die Situation erklären, eigene Erfahrungen erzählen und auf Prüferfragen reagieren. Mit Beispiel und Redemitteln.',
  keywords:
    'DTZ Bildbeschreibung, DTZ Sprechen Teil 2, DTZ Bild beschreiben Redemittel, DTZ über Erfahrungen sprechen, DTZ mündliche Prüfung',
  badge: 'Sprechen · DTZ',
  lead:
    'Im zweiten Teil der mündlichen DTZ-Prüfung bekommen Sie <strong>ein Foto</strong>. Sie beschreiben, was Sie sehen, sagen, welche Situation das Bild zeigt, und erzählen dann von <strong>Ihren eigenen Erfahrungen</strong>. Danach stellen die Prüfenden Fragen. Dieser Leitfaden zeigt, wie Sie Ihre zwei, drei Minuten sinnvoll füllen.',
  datePublished: '2026-10-26',
  answer:
    'Im DTZ Sprechen Teil 2 sprechen Sie anhand eines Fotos über ein Alltagsthema. Laut telc beschreiben Sie zuerst, was auf dem Foto zu sehen ist und welche Situation es zeigt, dann erzählen Sie von Ihren eigenen Erfahrungen damit. Anschließend reagieren Sie auf Fragen der Prüfenden. Ein sicheres Schema: Was sehe ich? Was passiert hier? Was habe ich selbst erlebt? Was ist in meinem Heimatland anders? Die ganze mündliche Prüfung dauert etwa 15 bis 16 Minuten.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'BAMF — Abschlussprüfung (DTZ)', url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html' },
    { label: 'telc — Übungstest 2 DTZ (PDF)', url: 'https://shop.telc.net/media/catalog/product/file//5/0/5010-b00-030101_barrierefrei_bib.pdf' },
    { label: 'telc — Übungstest DTZ, Auf jeden Fall B1.2 (PDF)', url: 'https://www.telc.net/fileadmin/user_upload/Downloads_Verlag/Auf_jeden_Fall/Uebungstests/Auf_jeden_Fall_B1.2_UEbungstest_DTZ.pdf' },
  ],

  sections: [
    {
      id: 'ablauf',
      heading: 'Die mündliche DTZ-Prüfung im Überblick',
      blocks: [
        {
          type: 'p',
          text: 'Die mündliche Prüfung des DTZ dauert laut BAMF rund 15 Minuten, laut telc-Übungstest etwa 16 Minuten. Sie sprechen mit den Prüfenden und einer anderen Person, die die Prüfung ablegt. Die Teile laut telc:',
        },
        {
          type: 'table',
          head: ['Teil', 'Aufgabe', 'Material'],
          rows: [
            ['Teil 1A', 'Über sich sprechen', 'Aufgabenblatt mit Stichworten'],
            ['Teil 1B', 'Auf Nachfragen reagieren', 'Fragen der Prüfenden'],
            ['Teil 2A', 'Über Erfahrungen sprechen', 'Aufgabenblatt mit einem Foto'],
            ['Teil 2B', 'Auf Nachfragen reagieren', 'Fragen der Prüfenden'],
            ['Teil 3', 'Gemeinsam etwas planen', 'Aufgabenblatt mit Leitpunkten'],
          ],
        },
        {
          type: 'p',
          text: 'In Teil 2 bekommen Sie und Ihre Partnerin unterschiedliche Fotos. In telcs Übungsmaterial lautet die Aufgabe sinngemäß: Sie haben in einer Zeitschrift ein Foto gefunden. Berichten Sie kurz, was Sie auf dem Foto sehen und was für eine Situation das Bild zeigt. Danach erzählen Sie, welche Erfahrungen Sie damit haben.',
        },
        {
          type: 'callout',
          text: 'Der DTZ prüft A2 und B1 gleichzeitig. Die Fragen der Prüfenden in Teil 2B gibt es deshalb auf zwei Stufen: einfachere Fragen und offenere Fragen, bei denen Sie begründen und vergleichen sollen. Antworten Sie immer mit mehr als einem Satz.',
        },
      ],
    },
    {
      id: 'schema',
      heading: 'Ein Schema für jedes Foto',
      blocks: [
        {
          type: 'steps',
          items: [
            {
              label: '1',
              title: 'Was sehe ich?',
              tasks: [
                'Personen, Ort, Gegenstände — zwei bis drei Sätze',
                '„Auf dem Foto sehe ich …", „Im Vordergrund …", „Im Hintergrund …"',
              ],
            },
            {
              label: '2',
              title: 'Was passiert hier?',
              tasks: [
                'Die Situation deuten: „Ich glaube, die Frau wartet auf …"',
                'Gefühle vermuten: „Sie sieht müde / fröhlich / gestresst aus."',
              ],
            },
            {
              label: '3',
              title: 'Was habe ich selbst erlebt?',
              tasks: [
                'Ein konkretes Erlebnis im Perfekt: wann, wo, was ist passiert?',
                'Ein Gefühl oder eine Bewertung: „Das war für mich …"',
              ],
              tip: 'Bereiten Sie für die häufigen DTZ-Themen je eine kleine Geschichte vor: Arzt, Wohnung, Arbeit, Kinder und Schule, Einkaufen, Freizeit, Ämter.',
            },
            {
              label: '4',
              title: 'Und in meinem Heimatland?',
              tasks: [
                'Ein Vergleich gibt Ihnen sicheren Stoff: „Bei uns in … ist das anders."',
                'Mit Komparativ: „In Deutschland muss man länger warten als …"',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'beispiel',
      heading: 'Beispiel: „Im Wartezimmer beim Kinderarzt"',
      blocks: [
        {
          type: 'p',
          text: 'Eigenes Übungsfoto im DTZ-Stil: Eine Frau sitzt mit einem kleinen Jungen in einem vollen Wartezimmer. Der Junge hat ein Bilderbuch auf dem Schoß, die Frau schaut auf die Uhr.',
        },
        {
          type: 'model',
          label: 'Beispielantwort (Teil 2A)',
          lines: [
            'Auf dem Foto sehe ich eine Frau und einen kleinen Jungen. Sie sitzen in einem Wartezimmer, wahrscheinlich bei einem Kinderarzt. Im Hintergrund warten noch viele andere Leute.',
            'Der Junge schaut ein Bilderbuch an, aber die Frau sieht gestresst aus. Sie schaut auf die Uhr. Ich glaube, sie wartet schon lange und muss vielleicht bald zur Arbeit.',
            'Diese Situation kenne ich gut. Letzten Winter war meine Tochter oft krank, und wir waren fast jede Woche beim Kinderarzt. Einmal haben wir zwei Stunden gewartet, obwohl wir einen Termin hatten. Das war sehr anstrengend, weil meine Tochter Fieber hatte und nicht ruhig sitzen wollte.',
            'In meinem Heimatland ist das ein bisschen anders. Dort geht man oft ohne Termin in eine Klinik und wartet dann. In Deutschland braucht man meistens einen Termin, aber warten muss man trotzdem.',
          ],
        },
        {
          type: 'model',
          label: 'Mögliche Fragen der Prüfenden (Teil 2B) — mit Antwort',
          lines: [
            'Prüferin: Wie oft gehen Sie mit Ihren Kindern zum Arzt?',
            'Antwort: Zu den Vorsorgeuntersuchungen gehen wir regelmäßig, und wenn ein Kind krank ist, natürlich auch. Im Winter ist das manchmal jeden Monat.',
            'Prüferin: Was kann man tun, damit das Warten nicht so langweilig ist?',
            'Antwort: Ich nehme immer ein Buch oder ein kleines Spiel für meine Tochter mit. Viele Praxen haben auch eine Spielecke. Ich finde, das hilft sehr.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für Teil 2',
      blocks: [
        { type: 'h3', text: 'Das Bild beschreiben' },
        {
          type: 'list',
          items: [
            'Auf dem Foto / Bild sehe ich …',
            'Im Vordergrund / Im Hintergrund / Links / Rechts ist …',
            'Die Personen sind wahrscheinlich in / bei …',
          ],
        },
        { type: 'h3', text: 'Die Situation erklären' },
        {
          type: 'list',
          items: [
            'Ich glaube / vermute, dass …',
            'Es sieht so aus, als ob … (oder einfacher: Vielleicht …)',
            'Die Frau sieht … aus.',
          ],
        },
        { type: 'h3', text: 'Über Erfahrungen sprechen' },
        {
          type: 'list',
          items: [
            'Diese Situation kenne ich gut. / Das habe ich auch schon erlebt.',
            'Letztes Jahr / Vor zwei Monaten habe ich …',
            'Das war für mich schwierig / schön / anstrengend, weil …',
          ],
        },
        { type: 'h3', text: 'Vergleichen und auf Fragen reagieren' },
        {
          type: 'list',
          items: [
            'In meinem Heimatland ist das anders / ähnlich: …',
            'Das ist eine gute Frage. Ich denke, …',
            'Können Sie die Frage bitte wiederholen?',
          ],
        },
        {
          type: 'callout',
          text: 'Wenn Sie ein Wort nicht kennen, umschreiben Sie es: „das Ding, mit dem man …", „ein Raum, in dem man wartet". Weitersprechen ist besser als schweigen.',
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
              title: 'Nur Gegenstände aufzählen',
              body: '„Ein Stuhl, ein Buch, eine Uhr" ist keine Beschreibung. Sagen Sie, wer was tut und was die Situation ist — das ist der Kern der Aufgabe.',
            },
            {
              title: 'Die eigene Erfahrung weglassen',
              body: 'Die Aufgabe heißt „Über Erfahrungen sprechen". Ohne eigenes Erlebnis fehlt der wichtigste Teil. Eine kleine, einfache Geschichte reicht.',
            },
            {
              title: 'Ein-Wort-Antworten auf Nachfragen',
              body: 'Auf „Gehen Sie oft zum Arzt?" antworten Sie nicht nur „Ja". Ergänzen Sie mindestens einen Grund oder ein Beispiel.',
            },
            {
              title: 'Auswendig gelernte Texte',
              body: 'Prüfende merken, wenn ein vorbereiteter Text nicht zum Foto passt. Lernen Sie Redemittel und Geschichten, aber passen Sie sie an das Bild an.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So üben Sie die Bildbeschreibung',
      blocks: [
        {
          type: 'p',
          text: 'Nehmen Sie Fotos aus Zeitungen, Prospekten oder dem Internet zu DTZ-Themen: Wohnung, Arbeit, Einkaufen, Arzt, Schule, Freizeit, Behörden. Sprechen Sie zu jedem Foto zwei Minuten nach dem Schema oben und nehmen Sie sich mit dem Handy auf.',
        },
        {
          type: 'p',
          text: 'Mit dem <a href="/speaking/">KI-Sprechtraining</a> sprechen Sie frei über Alltagsthemen und bekommen nach dem Gespräch eine Auswertung zu Grammatik, Wortschatz und Ausdruck. Für Perfekt und Nebensätze mit weil und obwohl hilft die <a href="/grammar/b1.1/">B1.1-Grammatik</a>.',
        },
        {
          type: 'p',
          text: 'Den dritten Teil der Prüfung erklärt der Leitfaden <a href="/leitfaden/dtz-gemeinsam-etwas-planen/">DTZ: gemeinsam etwas planen</a>; den Ablauf der ganzen Prüfung finden Sie im <a href="/leitfaden/dtz/">DTZ-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange spreche ich in DTZ Teil 2?',
      a: 'Eine feste Zeit pro Teil nennen die telc-Übungstests nicht; die ganze mündliche Prüfung dauert etwa 15 bis 16 Minuten. Planen Sie für Ihre Bildbeschreibung mit Erfahrung etwa eine bis zwei Minuten, danach folgen die Fragen.',
    },
    {
      q: 'Bekommen beide Teilnehmenden dasselbe Foto?',
      a: 'In den telc-Übungstests haben Teilnehmende A und B unterschiedliche Aufgabenblätter mit eigenen Fotos zum Thema. Jede Person spricht über ihr eigenes Bild.',
    },
    {
      q: 'Was mache ich, wenn ich das Foto nicht verstehe?',
      a: 'Beschreiben Sie, was Sie sicher sehen, und sagen Sie dann, was Sie vermuten: „Ich bin nicht sicher, aber vielleicht …". Vermutungen sind ausdrücklich Teil der Aufgabe.',
    },
    {
      q: 'Muss die Erfahrung wahr sein?',
      a: 'Nein. Es geht um Ihre Sprache, nicht um Ihr Privatleben. Wenn Sie keine passende Erfahrung haben, erzählen Sie von Freunden, Familie oder einer erfundenen Situation.',
    },
    {
      q: 'Zählt Sprechen beim DTZ besonders viel?',
      a: 'Ja. Laut BAMF erreichen Sie das Gesamtergebnis B1 oder A2 nur, wenn Sie das jeweilige Niveau im Prüfungsteil Sprechen und zusätzlich in „Hören und Lesen" oder „Schreiben" erreichen. Sprechen ist also immer dabei.',
    },
  ],

  cta: {
    heading: 'Für den DTZ üben — Sprechen, Schreiben, Modelltest',
    body: 'Mit einem kostenlosen Konto sprechen Sie mit dem KI-Gesprächspartner über Alltagsthemen und testen, solange Pro läuft, den zeitgesteuerten DTZ-Modelltest. Der Einstufungstest zeigt Ihnen vorher, wo Sie stehen.',
  },
};
