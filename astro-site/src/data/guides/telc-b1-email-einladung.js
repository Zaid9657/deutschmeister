// telc B1 informelle E-Mail (Antwort auf eine Einladung) — exam long-tail page
// (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "telc b1 brief an einen freund", "telc b1 e-mail einladung
// absagen", "informelle e-mail b1 beispiel". telc's own Übungstest 1 uses
// exactly this task shape (an informal reply to a friend's e-mail).
//
// FACTS (checked 2026-10-26 on telc's own pages): one writing task, 30 minutes,
// informal or semi-formal e-mail with four Leitpunkte (telc.net, Übungstest 1).
// The task, model e-mail and Redemittel are our own material. Model texts to
// friends use "du" because the task register does; the guidance speaks Sie.

export const telcB1EmailEinladung = {
  slug: 'telc-b1-email-einladung',
  lang: 'de',
  offer: 'telc',
  title: 'telc B1 informelle E-Mail: Einladung beantworten',
  h1: 'telc B1 informelle E-Mail: auf eine Einladung antworten — mit Musterbrief',
  description:
    'Informelle E-Mail in telc Deutsch B1: eine Einladung absagen, Gegenvorschlag machen, alle vier Leitpunkte treffen. Mit Musterbrief und Redemitteln.',
  keywords:
    'telc B1 informelle E-Mail, telc B1 Einladung absagen, telc B1 Brief an Freund, informeller Brief B1 Beispiel, telc B1 Schreiben Beispiel',
  badge: 'Musterbrief · telc B1',
  lead:
    'Nicht jede Schreibaufgabe in telc B1 ist eine Beschwerde. Häufig antworten Sie einer Freundin oder einem Freund — auf eine Einladung, eine Frage oder einen Besuchsplan. Die <strong>informelle E-Mail</strong> wirkt leichter, hat aber eigene Fallen: das Register, die Grußformel und Leitpunkte, die man im lockeren Ton schnell überspringt.',
  datePublished: '2026-10-26',
  answer:
    'Die informelle E-Mail in telc Deutsch B1 ist eine Antwort an eine Person, die Sie duzen — meist auf eine Einladung oder eine Frage. Sie haben 30 Minuten und eine Aufgabe mit vier Leitpunkten. Der sichere Aufbau: „Liebe …" oder „Lieber …", ein Dank für die Nachricht, je ein kurzer Absatz pro Leitpunkt, ein freundlicher Schluss und „Viele Grüße". Bewertet werden Aufgabenbewältigung, kommunikative Gestaltung und formale Richtigkeit; ein durchgehend passendes Du-Register gehört zur kommunikativen Gestaltung.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'telc — Zertifikat Deutsch / telc Deutsch B1', url: 'https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/' },
    { label: 'telc — Übungstest 1 telc Deutsch B1 (PDF)', url: 'https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf' },
  ],

  sections: [
    {
      id: 'aufgabe',
      heading: 'Die informelle E-Mail im telc-B1-Schreibteil',
      blocks: [
        {
          type: 'p',
          text: 'Im Schreibteil von telc Deutsch B1 bearbeiten Sie <strong>eine Aufgabe in 30 Minuten</strong>. Sie bekommen meist eine kurze E-Mail, auf die Sie antworten, und vier Leitpunkte. telc selbst verwendet im offiziellen Übungstest genau diese Form: Eine Freundin schreibt Ihnen, und Sie antworten auf vier Fragen zu ihrem geplanten Besuch.',
        },
        {
          type: 'p',
          text: 'Die Bewertung ist dieselbe wie bei der halbformellen E-Mail: <strong>Aufgabenbewältigung</strong> (alle Leitpunkte), <strong>kommunikative Gestaltung</strong> (Register, Textlogik, Wortschatz) und <strong>formale Richtigkeit</strong>. Der Unterschied liegt im Ton: Hier ist das Du-Register richtig, und „Sehr geehrte …" wäre falsch.',
        },
        {
          type: 'table',
          head: ['Element', 'Informell (Freunde)', 'Halbformell (Firma, Vermieter)'],
          rows: [
            ['Anrede', 'Liebe Lena, / Lieber Jonas, / Hallo Sam,', 'Sehr geehrte Frau …, / Sehr geehrte Damen und Herren,'],
            ['Anredepronomen', 'du, dich, dir, dein', 'Sie, Ihnen, Ihr'],
            ['Einstieg', 'danke für deine Nachricht!', 'vielen Dank für Ihre E-Mail vom …'],
            ['Schluss', 'Ich freue mich auf dich! / Bis bald!', 'Ich freue mich auf Ihre Antwort.'],
            ['Gruß', 'Viele Grüße / Liebe Grüße', 'Mit freundlichen Grüßen'],
          ],
        },
      ],
    },
    {
      id: 'musterbrief',
      heading: 'Musterbrief: eine Einladung absagen',
      blocks: [
        {
          type: 'p',
          text: 'Die Übungsaufgabe (eigene Aufgabe im telc-Stil): Ihr Freund Jonas ist umgezogen und lädt Sie am Samstag zu seiner Einweihungsparty ein. Sie können leider nicht kommen. Antworten Sie Jonas. Schreiben Sie etwas zu allen vier Punkten:',
        },
        {
          type: 'list',
          items: [
            'warum Sie nicht kommen können',
            'was Sie Jonas zur neuen Wohnung schenken möchten',
            'ein Vorschlag für ein anderes Treffen',
            'eine Frage zur neuen Wohnung',
          ],
        },
        {
          type: 'model',
          label: 'Musterbrief (ca. 130 Wörter)',
          lines: [
            'Lieber Jonas,',
            'vielen Dank für deine Einladung! Ich freue mich sehr, dass du endlich eine schöne Wohnung gefunden hast.',
            'Leider kann ich am Samstag nicht zu deiner Party kommen. Meine Schwester heiratet an diesem Wochenende in Hamburg, und ich fahre schon am Freitag dorthin. Das tut mir wirklich leid!',
            'Ich habe aber schon ein Geschenk für dich: eine große Pflanze für dein neues Wohnzimmer. Du hast ja immer gesagt, dass dir in der alten Wohnung etwas Grünes gefehlt hat.',
            'Wie wäre es, wenn ich dich nächste Woche besuche? Am Mittwochabend hätte ich Zeit. Dann bringe ich die Pflanze mit, und wir kochen zusammen.',
            'Erzähl mal: Wie viele Zimmer hat die Wohnung, und hast du jetzt wirklich einen Balkon?',
            'Ich wünsche dir eine tolle Party!',
            '',
            'Viele Grüße',
            'Amira',
          ],
        },
        { type: 'h3', text: 'Was diese E-Mail richtig macht' },
        {
          type: 'list',
          items: [
            '<strong>Leitpunkte:</strong> Grund (Hochzeit der Schwester), Geschenk (Pflanze, mit Begründung), Vorschlag (Mittwochabend), Frage (Zimmer, Balkon) — alle vier stehen klar im Text.',
            '<strong>Register:</strong> du, dich, dir, dein — durchgehend. Anrede und Gruß passen dazu.',
            '<strong>Textlogik:</strong> leider, aber, ja, dann verbinden die Absätze; der Text liest sich wie eine echte Nachricht.',
            '<strong>Strukturen:</strong> Nebensätze mit dass, wenn und weil, ein Konjunktiv („hätte ich Zeit") — B1-typisch und gut kontrollierbar.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für informelle E-Mails',
      blocks: [
        { type: 'h3', text: 'Danken und reagieren' },
        {
          type: 'list',
          items: [
            'Danke für deine nette Einladung! / Schön, von dir zu hören!',
            'Ich habe mich sehr über deine Nachricht gefreut.',
            'Toll, dass du … !',
          ],
        },
        { type: 'h3', text: 'Absagen und begründen' },
        {
          type: 'list',
          items: [
            'Leider kann ich nicht kommen, weil …',
            'Das tut mir wirklich leid, aber …',
            'Ich hätte so gern mitgefeiert, aber an dem Tag …',
          ],
        },
        { type: 'h3', text: 'Vorschlagen' },
        {
          type: 'list',
          items: [
            'Wie wäre es, wenn wir uns … treffen?',
            'Hast du Lust, … ?',
            'Was hältst du davon, wenn …?',
          ],
        },
        { type: 'h3', text: 'Nachfragen und abschließen' },
        {
          type: 'list',
          items: [
            'Erzähl mal: Wie … ? / Ich bin gespannt, wie …',
            'Schreib mir bald, ob dir das passt.',
            'Bis bald! / Ich freue mich auf dich!',
          ],
        },
        {
          type: 'callout',
          text: 'Informell heißt nicht schlampig: Auch in der E-Mail an Freunde zählen ganze Sätze, Konnektoren und eine klare Reihenfolge. Abkürzungen wie „lg" oder Smileys gehören nicht in den Prüfungstext.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Typische Fehler bei der informellen E-Mail',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Zwischen du und Sie wechseln',
              body: 'Der häufigste Registerfehler: „Lieber Jonas" am Anfang, „Ich hoffe, Ihnen gefällt die Wohnung" in der Mitte. Prüfen Sie am Ende jedes Pronomen.',
            },
            {
              title: 'Nur absagen, nichts anbieten',
              body: 'Wenn ein Leitpunkt einen Vorschlag verlangt, reicht „Vielleicht ein anderes Mal" nicht. Nennen Sie einen Tag, eine Uhrzeit oder eine Aktivität.',
            },
            {
              title: 'Die Frage vergessen',
              body: 'Leitpunkte wie „eine Frage zur Wohnung" verlangen einen echten Fragesatz mit Fragezeichen. Eine Aussage über die Wohnung erfüllt den Punkt nicht sicher.',
            },
            {
              title: 'Zu formell schreiben',
              body: '„Mit freundlichen Grüßen" an den besten Freund wirkt in der Prüfung genauso falsch wie „Hallo Leute" an den Kundenservice. Beides passt nicht zur Situation.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'Üben mit Zeitlimit und Feedback',
      blocks: [
        {
          type: 'p',
          text: 'Planen Sie fünf Minuten: Register festlegen, Leitpunkte nummerieren, pro Leitpunkt ein Stichwort. Dann schreiben Sie zwanzig Minuten und nutzen die letzten fünf Minuten für die Kontrolle von Pronomen, Verbposition und Grußformel.',
        },
        {
          type: 'p',
          text: 'Im <a href="/schreiben">KI-Schreibtraining</a> bekommen Sie zu jeder E-Mail eine Bewertung nach Aufgabenerfüllung, Aufbau, Korrektheit und Wortschatz — mit konkreten Korrekturen an Ihren Sätzen. Für die halbformelle Variante lesen Sie den <a href="/leitfaden/telc-b1-brief-beschwerde/">Musterbrief zur Beschwerde</a>; die Grammatik für Nebensätze und Konjunktiv finden Sie in der <a href="/grammar/b1.1/">B1.1-Grammatik</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Schreibe ich in telc B1 immer eine E-Mail an Freunde?',
      a: 'Nein. telc beschreibt die Aufgabe als informelle oder halbformelle E-Mail. Es kann also auch eine Nachricht an eine Firma, eine Kursleitung oder einen Vermieter sein. Üben Sie beide Register.',
    },
    {
      q: 'Wie beginne ich eine informelle E-Mail richtig?',
      a: 'Mit „Liebe" bei Frauen und „Lieber" bei Männern, dem Vornamen und einem Komma. Danach schreiben Sie klein weiter, zum Beispiel: „Lieber Jonas, vielen Dank für deine Einladung!"',
    },
    {
      q: 'Muss ich alle Fragen aus der E-Mail der Freundin beantworten?',
      a: 'Sie müssen die vier Leitpunkte der Aufgabe bearbeiten. Oft entsprechen sie den Fragen in der E-Mail, aber nicht immer. Maßgeblich ist die Liste unter der Aufgabe.',
    },
    {
      q: 'Darf ich eine Einladung in der Prüfung auch annehmen statt absagen?',
      a: 'Das hängt von der Aufgabe ab. Laut telc kann ein Vorschlag angenommen, abgelehnt oder mit einem Gegenvorschlag beantwortet werden, solange die Antwort zur Aufgabenstellung passt. Wenn die Situation sagt, dass Sie nicht kommen können, sagen Sie ab.',
    },
    {
      q: 'Wie lang sollte die E-Mail sein?',
      a: 'Die Zeit beträgt 30 Minuten, und jeder der vier Leitpunkte muss verständlich bearbeitet sein. Der Musterbrief hier hat rund 130 Wörter — das ist in der Zeit gut zu schaffen und lässt Raum für die Kontrolle.',
    },
  ],

  cta: {
    heading: 'telc B1 Schritt für Schritt vorbereiten',
    body: 'Die telc-B1-Komplettvorbereitung ordnet Schreiben, Sprechen, Lesen und Hören in einen festen Tagesplan. Auf der Kursseite sehen Sie den Inhalt und ob der Kurs gerade buchbar ist.',
  },
};
