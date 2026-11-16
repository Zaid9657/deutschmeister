// Brief schreiben B1 — keyword-led guide (traffic lever, 2026-09-02).
//
// Why this exists: DataForSEO 2026-09-02 measured "brief schreiben b1" at
// 1,900 searches/month (competition LOW) plus a long tail ("b1 brief
// schreiben beispiel" 320, "telc b1 brief schreiben" 140, "dtz brief
// schreiben" 140) — and the site had no page for any of it, while the AI
// writing trainer is precisely the product feature for this searcher.
//
// FACT DISCIPLINE: exam-format statements (which letter type, which part of
// which exam) restate facts already verified in the telc-b1/goethe-b1/dtz
// guide modules on 2026-08-22 — factsCheckedOn carries THAT date, because
// that is when the facts were checked. The letter teaching itself (structure,
// Redemittel, the example letter) is our own original material.

export const briefSchreibenB1 = {
  slug: 'brief-schreiben-b1',
  title: 'Brief schreiben B1: Aufbau, Beispiel & Redemittel',
  h1: 'Brief schreiben auf B1: der Aufbau, der in jeder Prüfung funktioniert',
  description:
    'Brief schreiben für die B1-Prüfung: ein Aufbau für telc, Goethe und DTZ, ein komplettes Beispiel, die wichtigsten Redemittel und die 5 teuersten Fehler.',
  keywords:
    'Brief schreiben B1, B1 Brief schreiben Beispiel, telc B1 Brief schreiben, DTZ Brief schreiben, halbformeller Brief B1, E-Mail B1 Prüfung',
  badge: 'Leitfaden',
  lead:
    'Über den Schreibteil entscheidet nicht die perfekte Grammatik — sondern ob du die <strong>Leitpunkte</strong> triffst und den <strong>richtigen Ton</strong> wählst. Genau das kannst du lernen. Dieser Leitfaden gibt dir einen Aufbau, der in telc B1, Goethe B1 und DTZ gleich gut funktioniert, ein komplettes Beispiel und die Redemittel, die du wirklich brauchst.',
  datePublished: '2026-09-02',
  answer:
    'Ein B1-Prüfungsbrief folgt immer demselben Aufbau: passende Anrede, ein Einleitungssatz zum Anlass, ein Absatz pro Leitpunkt aus der Aufgabe, Schlusssatz und Grußformel. Bewertet wird vor allem, ob alle Leitpunkte behandelt sind und ob Anrede und Ton zur Situation passen — halbformell an den Kundenservice, informell an Freunde. Wer einen Leitpunkt auslässt, verliert mehr Punkte als durch mehrere Grammatikfehler zusammen. Üblich sind je nach Prüfung etwa 80 bis 120 Wörter in rund 30 Minuten.',
  factsCheckedOn: '2026-08-22',
  sources: [
    { label: 'telc gGmbH', url: 'https://www.telc.net/' },
    { label: 'Goethe-Institut', url: 'https://www.goethe.de/' },
    { label: 'BAMF (DTZ)', url: 'https://www.bamf.de/' },
  ],

  sections: [
    {
      id: 'welcher-brief',
      heading: 'Welcher Brief kommt in welcher Prüfung dran?',
      blocks: [
        {
          type: 'p',
          text: 'Alle drei großen B1-Prüfungen testen das Schreiben mit einem Brief oder einer E-Mail zu einer Alltagssituation — mit Leitpunkten, die du abarbeiten musst. Die Unterschiede liegen im Detail:',
        },
        {
          type: 'table',
          head: ['Prüfung', 'Aufgabe', 'Typischer Ton'],
          rows: [
            ['telc Deutsch B1', 'Ein Brief oder eine E-Mail, ca. 30 Minuten — oft Beschwerde, Anfrage oder Antwort auf eine Einladung', 'halbformell oder informell'],
            ['Goethe-Zertifikat B1', 'Modul Schreiben mit mehreren Aufgaben und unterschiedlichen Textsorten — von der Nachricht an Freunde bis zur halbformellen E-Mail', 'wechselt je nach Aufgabe'],
            ['DTZ', 'Ein Alltagsbrief oder eine E-Mail, ca. 30 Minuten — oft an Vermieter, Ämter oder Nachbarn', 'meist halbformell (Sie-Form)'],
          ],
        },
        {
          type: 'p',
          text: 'Die gute Nachricht: Der Aufbau unten funktioniert in allen drei Prüfungen. Was sich ändert, ist nur der Ton — und den bestimmst du über Anrede und Grußformel. Details zu den Prüfungen selbst findest du in den Leitfäden zu <a href="/leitfaden/telc-b1/">telc B1</a>, <a href="/leitfaden/goethe-b1/">Goethe B1</a> und <a href="/leitfaden/dtz/">DTZ</a>.',
        },
        {
          type: 'callout',
          text: 'Lies die Aufgabe zweimal, bevor du schreibst. Die Leitpunkte sind deine Checkliste — jeder einzelne muss im Brief vorkommen, sonst kostet er Punkte, die kein schöner Satz zurückholt.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'Der Aufbau, der immer funktioniert',
      blocks: [
        {
          type: 'p',
          text: 'Ein Prüfungsbrief ist kein Kunstwerk. Er ist ein Formular mit Sätzen. Fünf Bausteine, immer in dieser Reihenfolge:',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Baustein 1',
              title: 'Anrede',
              tasks: [
                'Halbformell: „Sehr geehrte Damen und Herren," oder „Sehr geehrte Frau Müller,"',
                'Informell: „Liebe Anna," / „Lieber Tom,"',
                'Nach der Anrede: Komma, dann klein weiterschreiben',
              ],
              tip: 'Steht in der Aufgabe ein Name, benutze ihn. „Sehr geehrte Damen und Herren" an eine namentlich bekannte Person wirkt unpersönlich — und die Prüfer sehen das.',
            },
            {
              label: 'Baustein 2',
              title: 'Einleitung — ein Satz zum Anlass',
              tasks: [
                'Warum schreibst du? Ein Satz reicht.',
                'Halbformell: „ich schreibe Ihnen, weil …" / „vielen Dank für Ihre E-Mail vom …"',
                'Informell: „danke für deine Einladung!" / „schön, von dir zu hören!"',
              ],
            },
            {
              label: 'Baustein 3',
              title: 'Hauptteil — ein Absatz pro Leitpunkt',
              tasks: [
                'Nimm die Leitpunkte in der Reihenfolge der Aufgabe',
                'Pro Leitpunkt zwei bis drei Sätze — mehr braucht niemand',
                'Verbinde die Absätze mit Konnektoren: weil, deshalb, trotzdem, außerdem',
              ],
              tip: 'Hak nach jedem Absatz die Aufgabenstellung ab. Am Ende müssen alle Leitpunkte einen Haken haben.',
            },
            {
              label: 'Baustein 4',
              title: 'Schlusssatz',
              tasks: [
                'Halbformell: „Ich hoffe auf eine schnelle Antwort." / „Vielen Dank im Voraus."',
                'Informell: „Ich freue mich auf deine Antwort!" / „Bis bald!"',
              ],
            },
            {
              label: 'Baustein 5',
              title: 'Grußformel + Name',
              tasks: [
                'Halbformell: „Mit freundlichen Grüßen" — ohne Komma danach, dann dein Name',
                'Informell: „Viele Grüße" / „Liebe Grüße"',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'beispiel',
      heading: 'Ein komplettes Beispiel: die Beschwerde',
      blocks: [
        {
          type: 'p',
          text: 'Die Aufgabe (typischer Prüfungsstil): Du hast online einen Rucksack bestellt und bezahlt. Nach zwei Wochen ist er nicht angekommen. Schreib an den Kundenservice: Beschreib das Problem, sag, was du schon versucht hast, und fordere eine Lösung.',
        },
        { type: 'h3', text: 'Der Brief (ca. 100 Wörter)' },
        {
          type: 'callout',
          text: 'Sehr geehrte Damen und Herren, ich schreibe Ihnen, weil meine Bestellung vom 3. Mai bis heute nicht angekommen ist. Ich habe einen Rucksack bestellt und sofort bezahlt. Vor einer Woche habe ich Ihre Hotline angerufen, aber niemand konnte mir helfen. Auch auf meine E-Mail habe ich keine Antwort bekommen. Deshalb bitte ich Sie jetzt, mir den Rucksack bis Ende des Monats zu schicken oder mir das Geld zurückzuzahlen. Ich hoffe auf eine schnelle Antwort. Mit freundlichen Grüßen — Anna Beispiel',
        },
        { type: 'h3', text: 'Warum dieser Brief Punkte holt' },
        {
          type: 'list',
          items: [
            'Alle drei Leitpunkte sind da: Problem (nicht angekommen), Versuche (Hotline, E-Mail), Forderung (schicken oder Geld zurück — mit Frist)',
            'Der Ton passt: Sie-Form, sachlich, höflich — eine Beschwerde, kein Wutbrief',
            'Konnektoren verbinden die Sätze: weil, aber, auch, deshalb',
            'Anrede, Schlusssatz und Grußformel sitzen — die einfachsten Punkte der ganzen Prüfung',
          ],
        },
        {
          type: 'p',
          text: 'Merke: Kein Satz in diesem Brief ist kompliziert. B1 verlangt keine Schachtelsätze — es verlangt, dass du die Aufgabe erfüllst, verständlich und im richtigen Ton.',
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel: die Sätze, die du wirklich brauchst',
      blocks: [
        {
          type: 'p',
          text: 'Lern keine fünfzig Redemittel — lern fünfzehn, die du sicher schreiben kannst. Diese Auswahl deckt fast jede Aufgabe ab:',
        },
        { type: 'h3', text: 'Anlass nennen' },
        {
          type: 'list',
          items: [
            'Ich schreibe Ihnen, weil …',
            'Vielen Dank für Ihre E-Mail / Ihren Brief vom …',
            'Ich habe Ihre Anzeige gelesen und interessiere mich für …',
          ],
        },
        { type: 'h3', text: 'Ein Problem beschreiben' },
        {
          type: 'list',
          items: [
            'Leider funktioniert … nicht. / Leider ist … noch nicht angekommen.',
            'Ich habe schon …, aber das hat nicht geholfen.',
            'Das Problem besteht seit …',
          ],
        },
        { type: 'h3', text: 'Bitten und fordern' },
        {
          type: 'list',
          items: [
            'Könnten Sie bitte …? / Ich bitte Sie, … zu …',
            'Ich möchte Sie bitten, mir bis … zu antworten.',
            'Bitte schicken Sie mir … oder zahlen Sie das Geld zurück.',
          ],
        },
        { type: 'h3', text: 'Vorschlagen und absagen (informell)' },
        {
          type: 'list',
          items: [
            'Wie wäre es, wenn wir …? / Hast du Lust, …?',
            'Leider kann ich nicht kommen, weil …',
            'Können wir den Termin auf … verschieben?',
          ],
        },
        {
          type: 'callout',
          text: 'Schreib jedes Redemittel dreimal in einem eigenen Satz, nicht zehnmal als leere Formel. In der Prüfung muss es zu DEINER Aufgabe passen — auswendig gelernte Blöcke, die nicht zur Aufgabe passen, erkennen Prüfer sofort.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die 5 teuersten Fehler im Schreibteil',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Einen Leitpunkt auslassen',
              body: 'Der teuerste Fehler von allen. Die Leitpunkte sind die Aufgabe — ein fehlender Punkt kostet mehr als mehrere Grammatikfehler zusammen. Mach aus der Aufgabenstellung eine Checkliste und hak nach jedem Absatz ab.',
            },
            {
              title: 'Das falsche Register',
              body: 'Eine Beschwerde an den Kundenservice mit „Hallo Leute" — oder eine Nachricht an die beste Freundin mit „Sehr geehrte Damen und Herren". Der Ton ist ein eigenes Bewertungskriterium. Entscheide VOR dem ersten Wort: Sie oder du?',
            },
            {
              title: 'Auswendig gelernte Briefe abschreiben',
              body: 'Es gibt Kandidaten, die einen kompletten Musterbrief auswendig lernen und ihn auf jede Aufgabe pressen. Das Ergebnis: Der Brief behandelt die falschen Leitpunkte. Lern Bausteine und Redemittel — nie ganze Briefe.',
            },
            {
              title: 'Ohne Plan drauflosschreiben',
              body: 'Drei Minuten Planung sparen zehn Minuten Chaos: Register festlegen, Leitpunkte nummerieren, pro Leitpunkt ein Stichwort. Erst dann schreiben. Wer ohne Plan startet, merkt in Minute 25, dass Leitpunkt 3 fehlt — und hat keine Zeit mehr.',
            },
            {
              title: 'Keine Konnektoren',
              body: 'Zehn Hauptsätze hintereinander lesen sich wie eine Einkaufsliste. Schon vier Konnektoren — weil, deshalb, aber, außerdem — machen aus einer Satzsammlung einen Text. Genau das unterscheidet auf B1 den mittleren vom guten Schreibteil.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So übst du das Schreiben — mit Feedback statt ins Leere',
      blocks: [
        {
          type: 'p',
          text: 'Das Problem beim Schreibtraining im Selbststudium: Niemand korrigiert dich. Du schreibst zehn Briefe und machst zehnmal denselben Fehler, ohne es zu merken.',
        },
        {
          type: 'p',
          text: 'Genau dafür gibt es das <a href="/schreiben">KI-Schreibtraining von Deutschmeister</a>: Du bekommst eine Prüfungsaufgabe im Stil deiner Prüfung, schreibst deinen Brief, und die KI bewertet ihn nach den Kriterien, auf die auch Prüfer achten — Aufgabenerfüllung, Aufbau, Korrektheit, Wortschatz — mit konkreten Korrekturen an deinen eigenen Sätzen.',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Schritt 1',
              title: 'Einstufungstest',
              body: 'Finde in wenigen Minuten heraus, wo du wirklich stehst — der <a href="/level-test/">Test ist kostenlos</a>.',
            },
            {
              eyebrow: 'Schritt 2',
              title: 'Zwei Briefe pro Woche',
              body: 'Beschwerde, Einladungsantwort, Anfrage — mit Zeitlimit, wie in der Prüfung. Immer mit Checkliste: alle Leitpunkte drin?',
            },
            {
              eyebrow: 'Schritt 3',
              title: 'Fehler verstehen, nicht sammeln',
              body: 'Sätze, die korrigiert wurden, ins <a href="/analyze/">Sentence X-Ray</a> geben: Es zeigt dir, WARUM der Kasus oder die Wortstellung falsch war.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Ein Übungstest im Stil der Prüfung — inklusive Schreibaufgabe mit Selbstcheck — gehört ebenfalls dazu; wie du damit umgehst, zeigt der <a href="/leitfaden/modelltest-deutsch-b1/">Modelltest-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie viele Wörter muss ein B1-Brief haben?',
      a: 'Je nach Prüfung sind etwa 80 bis 120 Wörter üblich; die genaue Vorgabe steht in deiner Aufgabe. Deutlich zu kurz heißt meist: Leitpunkte fehlen. Deutlich zu lang heißt: mehr Fehlerchancen ohne mehr Punkte. Halte dich an die Vorgabe der Aufgabe.',
    },
    {
      q: 'Was ist ein halbformeller Brief?',
      a: 'Ein Brief in der Sie-Form an Personen oder Stellen, die du nicht privat kennst — Kundenservice, Vermieter, Ämter, Kursleitung. Anrede „Sehr geehrte/r …", sachlicher Ton, Grußformel „Mit freundlichen Grüßen". Er ist die häufigste Textsorte in B1-Prüfungen.',
    },
    {
      q: 'Zählen Grammatikfehler im B1-Brief viel?',
      a: 'Sie zählen, aber weniger, als viele denken. Aufgabenerfüllung (alle Leitpunkte) und passendes Register wiegen schwerer. Ein verständlicher Brief mit ein paar Fehlern schneidet besser ab als ein fehlerfreier Brief, der die Aufgabe verfehlt.',
    },
    {
      q: 'Darf ich im Brief Sätze aus der Aufgabe übernehmen?',
      a: 'Einzelne Wörter ja, ganze Sätze nein. Prüfer erkennen abgeschriebene Aufgabensätze, und sie zählen nicht als eigene Sprachleistung. Formuliere die Leitpunkte mit eigenen Worten — genau das ist die Prüfungsleistung.',
    },
    {
      q: 'Ist der DTZ-Brief anders als der telc-Brief?',
      a: 'Der Aufbau ist derselbe. Der DTZ bleibt thematisch näher am Behörden- und Wohnalltag (Vermieter, Ämter, Nachbarn) und ist fast immer halbformell. Bei telc kommen auch informelle Anlässe wie Einladungen vor. Details zu beiden Prüfungen stehen in den jeweiligen Leitfäden.',
    },
    {
      q: 'Wie übe ich Briefe schreiben ohne Lehrer?',
      a: 'Mit Aufgaben im Prüfungsstil, einem Zeitlimit und Feedback. Das KI-Schreibtraining von Deutschmeister bewertet deine Briefe nach den vier Kriterien, auf die auch Prüfer achten, und korrigiert konkrete Sätze — so siehst du deine Fehlermuster, statt sie zu wiederholen.',
    },
  ],

  cta: {
    heading: 'Schreib deinen ersten Prüfungsbrief — mit Feedback',
    body: 'Aufgabe im Prüfungsstil, Zeitlimit, Bewertung nach Prüfungskriterien. Der Einstufungstest davor ist kostenlos.',
  },
};
