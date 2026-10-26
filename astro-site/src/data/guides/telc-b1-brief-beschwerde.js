// telc B1 Beschwerde-E-Mail — exam long-tail page (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26, so no fresh volumes): "telc b1 beschwerde brief", "telc b1
// brief beschwerde beispiel", "telc b1 brief schreiben beispiel". The parent
// family "brief schreiben b1" measured 1,900/month and "telc b1 brief
// schreiben" 140/month on 2026-09-02 (brief-schreiben-b1.js).
//
// FACTS (checked 2026-10-26 on telc's own pages): telc.net lists Schreiben as
// one part of 30 minutes; telc's Übungstest 1 (Zertifikat Deutsch / telc
// Deutsch B1) describes it as an informal or semi-formal e-mail with four
// Leitpunkte, rated on Aufgabenbewältigung, Kommunikative Gestaltung and
// Formale Richtigkeit, and states when a Leitpunkt counts as covered. The task,
// the model e-mail and the Redemittel are our own material.

export const telcB1BriefBeschwerde = {
  slug: 'telc-b1-brief-beschwerde',
  lang: 'de',
  offer: 'telc',
  title: 'telc B1 Beschwerde-E-Mail: Musterbrief & Redemittel',
  h1: 'telc B1 Beschwerde schreiben: Musterbrief, Redemittel und Bewertung',
  description:
    'Beschwerde-E-Mail für telc Deutsch B1: Aufbau mit vier Leitpunkten, ein kompletter Musterbrief, Redemittel und was telc bei der Bewertung prüft.',
  keywords:
    'telc B1 Beschwerde, telc B1 Brief Beschwerde Beispiel, telc B1 Brief schreiben Beispiel, Beschwerdebrief B1, halbformelle E-Mail B1',
  badge: 'Musterbrief · telc B1',
  lead:
    'Eine Beschwerde ist der Klassiker unter den <strong>halbformellen E-Mails</strong>: Sie schreiben an eine Firma, die Sie nicht persönlich kennen, schildern ein Problem und verlangen eine Lösung. Dieser Leitfaden zeigt Ihnen den Aufbau, einen kompletten Musterbrief zu einer Aufgabe im telc-Stil und die Redemittel, mit denen Sie jeden der vier Leitpunkte sicher abdecken.',
  datePublished: '2026-10-26',
  answer:
    'In telc Deutsch B1 schreiben Sie in 30 Minuten eine informelle oder halbformelle E-Mail zu einer Aufgabe mit vier Leitpunkten. Für eine Beschwerde heißt das: halbformelle Anrede, ein Satz zum Anlass, zu jedem Leitpunkt mindestens ein klarer Satz, eine konkrete Bitte und eine passende Grußformel. Bewertet werden laut telc die Aufgabenbewältigung, die kommunikative Gestaltung und die formale Richtigkeit. Ein Leitpunkt gilt schon als erfüllt, wenn er verständlich bearbeitet ist — ein fehlender Leitpunkt kostet dagegen Punkte.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'telc — Zertifikat Deutsch / telc Deutsch B1', url: 'https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/' },
    { label: 'telc — Übungstest 1 telc Deutsch B1 (PDF)', url: 'https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf' },
  ],

  sections: [
    {
      id: 'aufgabe',
      heading: 'Was der Schreibteil in telc B1 verlangt',
      blocks: [
        {
          type: 'p',
          text: 'Der Prüfungsteil Schreiben besteht bei telc Deutsch B1 aus <strong>einer Aufgabe</strong>, für die Sie <strong>30 Minuten</strong> Zeit haben. Sie lesen eine kurze Situation und schreiben dazu eine informelle oder halbformelle E-Mail. Die Aufgabe nennt <strong>vier Leitpunkte</strong> — das sind die Inhalte, die in Ihrer E-Mail vorkommen müssen.',
        },
        {
          type: 'table',
          head: ['Kriterium (laut telc)', 'Was geprüft wird', 'Was das für die Beschwerde heißt'],
          rows: [
            ['Aufgabenbewältigung', 'Sind alle vier Leitpunkte inhaltlich passend bearbeitet?', 'Jeder Leitpunkt bekommt mindestens einen eigenen, klaren Satz.'],
            ['Kommunikative Gestaltung', 'Register, Textlogik, Verknüpfung der Sätze, Wortschatz', 'Sie-Form, sachlicher Ton, Konnektoren statt Satzliste.'],
            ['Formale Richtigkeit', 'Grammatik und Rechtschreibung, mit Vorrang der Verständlichkeit', 'Einfache, korrekte Sätze sind besser als lange, unklare.'],
          ],
        },
        {
          type: 'p',
          text: 'Zwei Details aus den telc-Bewertungshinweisen lohnen sich besonders: Ein Leitpunkt gilt auch dann als erfüllt, wenn Sie ihn nur in einem kurzen Satz behandeln. Und Absender, Empfänger, Datum oder Betreffzeile werden bei der E-Mail <strong>nicht</strong> verlangt. Eine Betreffzeile schadet aber nicht und ordnet Ihre Gedanken.',
        },
        {
          type: 'p',
          text: 'Den Gesamtaufbau der Prüfung mit allen Teilen und Punkten erklärt der <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a>.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'Der Aufbau einer Beschwerde-E-Mail',
      blocks: [
        {
          type: 'p',
          text: 'Eine Beschwerde folgt einer festen Logik: Was ist passiert, was ist das Problem, was haben Sie schon versucht, was erwarten Sie jetzt? Genau diese vier Fragen tauchen in Beschwerde-Aufgaben häufig als Leitpunkte auf — mal in anderer Reihenfolge, mal mit anderen Worten.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Teil 1',
              title: 'Anrede und Anlass',
              tasks: [
                '„Sehr geehrte Damen und Herren," — wenn Sie keinen Namen kennen',
                '„Sehr geehrte Frau Becker," — wenn die Aufgabe einen Namen nennt',
                'Ein Satz zum Anlass: „ich schreibe Ihnen, weil …"',
              ],
              tip: 'Nach der Anrede steht ein Komma, und der nächste Satz beginnt klein.',
            },
            {
              label: 'Teil 2',
              title: 'Ein Absatz pro Leitpunkt',
              tasks: [
                'Die Leitpunkte in einer sinnvollen Reihenfolge abarbeiten',
                'Pro Leitpunkt zwei bis drei Sätze',
                'Mit Konnektoren verbinden: leider, außerdem, deshalb, trotzdem',
              ],
              tip: 'Nummerieren Sie die Leitpunkte auf dem Aufgabenblatt und haken Sie jeden ab, sobald er im Text steht.',
            },
            {
              label: 'Teil 3',
              title: 'Forderung mit Frist',
              tasks: [
                'Sagen Sie genau, was Sie wollen: Ersatz, Reparatur oder Geld zurück',
                'Eine realistische Frist macht die Bitte konkret',
              ],
            },
            {
              label: 'Teil 4',
              title: 'Schluss und Gruß',
              tasks: [
                '„Ich freue mich auf Ihre baldige Antwort."',
                '„Mit freundlichen Grüßen" und Ihr Name — ohne Komma nach der Grußformel',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'musterbrief',
      heading: 'Musterbrief: die defekte Kaffeemaschine',
      blocks: [
        {
          type: 'p',
          text: 'Die Übungsaufgabe (eigene Aufgabe im telc-Stil): Sie haben in einem Online-Shop eine Kaffeemaschine gekauft. Nach drei Wochen funktioniert sie nicht mehr. Schreiben Sie an den Kundenservice. Schreiben Sie etwas zu allen vier Punkten:',
        },
        {
          type: 'list',
          items: [
            'was Sie gekauft haben',
            'was das Problem ist',
            'was Sie schon unternommen haben',
            'was Sie jetzt vom Shop erwarten',
          ],
        },
        {
          type: 'model',
          label: 'Musterbrief (ca. 140 Wörter)',
          lines: [
            'Betreff: Defekte Kaffeemaschine – Bestellung Nr. 48213',
            '',
            'Sehr geehrte Damen und Herren,',
            'am 2. März habe ich in Ihrem Online-Shop eine Kaffeemaschine des Modells „Aroma 300" gekauft. Leider bin ich mit dem Gerät sehr unzufrieden.',
            'Schon nach drei Wochen funktioniert die Maschine nicht mehr richtig: Das Wasser wird nicht mehr heiß, und manchmal läuft Kaffee auf den Tisch.',
            'Ich habe die Maschine genau nach der Anleitung gereinigt, aber das Problem ist geblieben. Letzte Woche habe ich außerdem Ihre Hotline angerufen. Dort hat man mir versprochen, dass sich ein Mitarbeiter bei mir meldet. Bis heute habe ich jedoch nichts von Ihnen gehört.',
            'Deshalb bitte ich Sie, mir innerhalb von zwei Wochen eine neue Maschine zu schicken oder mir den Kaufpreis zurückzuerstatten.',
            'Ich freue mich auf Ihre baldige Antwort.',
            '',
            'Mit freundlichen Grüßen',
            'Daniel Kovač',
          ],
        },
        { type: 'h3', text: 'Warum diese E-Mail die Kriterien erfüllt' },
        {
          type: 'list',
          items: [
            '<strong>Alle vier Leitpunkte</strong> stehen in eigenen Sätzen: Kauf (Datum, Modell), Problem (zwei konkrete Mängel), bisherige Schritte (Reinigung, Hotline), Erwartung (Ersatz oder Geld zurück, mit Frist).',
            '<strong>Register:</strong> durchgehend Sie-Form, sachlich, ohne Vorwürfe — ärgerlich, aber höflich.',
            '<strong>Textlogik:</strong> leider, schon, aber, außerdem, jedoch, deshalb verbinden die Sätze. Kaum ein Satz beginnt mit „Ich" — telc nennt Texte, deren Sätze überwiegend mit Ich oder Wir beginnen, ausdrücklich als Schwäche.',
            '<strong>Sprache:</strong> Perfekt für die Vergangenheit, ein Nebensatz mit „dass", ein Infinitiv mit „zu" — B1-Strukturen, ohne Risiko.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für jeden Leitpunkt',
      blocks: [
        {
          type: 'p',
          text: 'Lernen Sie wenige Redemittel, die Sie sicher beherrschen, und üben Sie sie mit wechselnden Inhalten. So passen sie in der Prüfung zu jeder Aufgabe.',
        },
        { type: 'h3', text: 'Anlass und Kauf nennen' },
        {
          type: 'list',
          items: [
            'Ich schreibe Ihnen, weil ich mit … nicht zufrieden bin.',
            'Am … habe ich bei Ihnen … bestellt / gekauft / gebucht.',
            'Ich beziehe mich auf meine Bestellung vom …',
          ],
        },
        { type: 'h3', text: 'Das Problem beschreiben' },
        {
          type: 'list',
          items: [
            'Leider funktioniert … nicht mehr richtig.',
            'Schon nach kurzer Zeit ist … kaputtgegangen.',
            'Außerdem habe ich festgestellt, dass …',
          ],
        },
        { type: 'h3', text: 'Bisherige Schritte schildern' },
        {
          type: 'list',
          items: [
            'Ich habe bereits versucht, … , aber das hat nicht geholfen.',
            'Am … habe ich Ihren Kundenservice angerufen / angeschrieben.',
            'Man hat mir versprochen, dass … Bis heute ist jedoch nichts passiert.',
          ],
        },
        { type: 'h3', text: 'Eine Lösung verlangen' },
        {
          type: 'list',
          items: [
            'Deshalb bitte ich Sie, mir … bis zum … zu schicken.',
            'Ich erwarte, dass Sie mir den Kaufpreis zurückerstatten.',
            'Bitte teilen Sie mir mit, wie Sie das Problem lösen möchten.',
          ],
        },
        {
          type: 'callout',
          text: 'Höflich bleibt höflich, auch wenn Sie verärgert sind: „Ich bin sehr enttäuscht" ist ein gutes B1-Register. Beleidigungen oder Drohungen passen nicht zur halbformellen E-Mail und kosten in der kommunikativen Gestaltung.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Fünf Fehler, die bei Beschwerden Punkte kosten',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Einen Leitpunkt vergessen',
              body: 'Am häufigsten fehlt der Punkt „was Sie schon unternommen haben" — er wirkt nebensächlich, ist aber ein eigener Leitpunkt. Ein kurzer Satz reicht, doch er muss da sein.',
            },
            {
              title: 'Das Register wechseln',
              body: 'Wer mit „Sehr geehrte Damen und Herren" beginnt und später „du" schreibt oder mit „Liebe Grüße" endet, mischt zwei Register. telc vergibt dann in der kommunikativen Gestaltung nicht die volle Punktzahl.',
            },
            {
              title: 'Nur jammern, nichts fordern',
              body: 'Eine Beschwerde ohne konkrete Bitte bleibt unvollständig. Sagen Sie, was Sie wollen und bis wann.',
            },
            {
              title: 'Leitpunkte als Liste abschreiben',
              body: 'Vier unverbundene Sätze, die die Aufgabe wiederholen, lesen sich wie eine Checkliste. Formulieren Sie mit eigenen Worten und verbinden Sie die Sätze.',
            },
            {
              title: 'Einen auswendig gelernten Brief einsetzen',
              body: 'Ein fertiger Musterbrief passt fast nie genau zur Aufgabe. Lernen Sie Bausteine und Redemittel, nicht den ganzen Text — sonst behandeln Sie die falschen Inhalte.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So üben Sie die Beschwerde-E-Mail',
      blocks: [
        {
          type: 'p',
          text: 'Schreiben Sie pro Woche zwei E-Mails mit Zeitlimit: 5 Minuten planen, 20 Minuten schreiben, 5 Minuten kontrollieren. Wechseln Sie die Anlässe — Online-Kauf, Hotelzimmer, Handyvertrag, Sprachkurs —, damit die Redemittel flexibel werden.',
        },
        {
          type: 'p',
          text: 'Feedback macht den Unterschied: Im <a href="/schreiben">KI-Schreibtraining</a> bewerten Sie Ihre E-Mail nach Aufgabenerfüllung, Aufbau, Korrektheit und Wortschatz und sehen konkrete Korrekturen an Ihren eigenen Sätzen. Sätze, die Sie nicht verstehen, zerlegt der <a href="/analyze/">Satz-Röntgen</a> nach Wortstellung und Kasus.',
        },
        {
          type: 'p',
          text: 'Für informelle Aufgaben — etwa die Antwort auf eine Einladung — gibt es einen eigenen <a href="/leitfaden/telc-b1-email-einladung/">Musterbrief für die informelle E-Mail</a>. Den allgemeinen Aufbau für alle B1-Prüfungen erklärt <a href="/leitfaden/brief-schreiben-b1/">Brief schreiben B1</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie viele Wörter braucht die Beschwerde in telc B1?',
      a: 'telc nennt für die E-Mail vier Leitpunkte und 30 Minuten Zeit. Entscheidend ist, dass jeder Leitpunkt verständlich bearbeitet ist. Der Musterbrief auf dieser Seite hat rund 140 Wörter; eine deutlich kürzere E-Mail lässt meist einen Leitpunkt zu knapp.',
    },
    {
      q: 'Muss ich in telc B1 eine Betreffzeile schreiben?',
      a: 'Nein. Laut den telc-Bewertungshinweisen werden Absender, Empfänger, Datum und Betreffzeile bei der E-Mail nicht verlangt. Eine kurze Betreffzeile ist aber erlaubt und kann helfen, den Anlass klar zu machen.',
    },
    {
      q: 'Reicht ein Satz pro Leitpunkt?',
      a: 'Formal ja: telc wertet einen Leitpunkt auch dann als erfüllt, wenn er in einem kurzen Satz behandelt wird. Für eine gute kommunikative Gestaltung sind zwei bis drei verbundene Sätze pro Leitpunkt aber die sicherere Wahl.',
    },
    {
      q: 'Darf ich in der Beschwerde unhöflich werden?',
      a: 'Nein. Die Beschwerde ist eine halbformelle E-Mail. Sie dürfen Ärger und Enttäuschung ausdrücken, aber sachlich und in der Sie-Form. Ein falsches oder schwankendes Register wird in der kommunikativen Gestaltung schlechter bewertet.',
    },
    {
      q: 'Kommt in telc B1 immer eine Beschwerde?',
      a: 'Nein. Die Aufgabe kann eine informelle oder eine halbformelle E-Mail verlangen — zum Beispiel eine Antwort an Freunde, eine Anfrage oder eine Beschwerde. Üben Sie deshalb beide Register.',
    },
  ],

  cta: {
    heading: 'Vorbereitung auf telc B1 mit einem festen Plan',
    body: 'Die telc-B1-Komplettvorbereitung führt Sie Tag für Tag durch Schreiben, Sprechen, Lesen und Hören. Auf der Kursseite sehen Sie, was enthalten ist und ob der Kurs gerade buchbar ist.',
  },
};
