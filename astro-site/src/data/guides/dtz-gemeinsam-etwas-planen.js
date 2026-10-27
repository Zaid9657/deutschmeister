// DTZ Sprechen Teil 3 "Gemeinsam etwas planen" — exam long-tail page
// (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "dtz gemeinsam etwas planen", "dtz sprechen teil 3", "dtz
// planen redemittel", "dtz sprechen beispiel".
//
// FACTS (checked 2026-10-26 on the vendors' own pages): BAMF (oral part about
// 15 minutes, with the examiners and another candidate; the B1 overall rule
// needs Sprechen); telc DTZ Übungstest (Sprechen about 16 minutes; Teil 3
// "Gemeinsam etwas planen" on a task sheet with Leitpunkte); telc's "Auf jeden
// Fall" DTZ practice test (a Teil 3 situation — a Volkshochschule course — with
// idea prompts such as which course, when, cost, how to get there, sign-up).
// The scenario, dialogue and Redemittel below are our own material.

export const dtzGemeinsamPlanen = {
  slug: 'dtz-gemeinsam-etwas-planen',
  lang: 'de',
  offer: 'dtz-waitlist',
  title: 'DTZ Gemeinsam etwas planen: Beispiel & Redemittel',
  h1: 'DTZ Sprechen Teil 3: gemeinsam etwas planen — Beispieldialog und Redemittel',
  description:
    'DTZ Sprechen Teil 3: mit der Partnerin oder dem Partner etwas planen, Vorschläge machen und reagieren. Ablauf laut telc, Beispieldialog und Redemittel.',
  keywords:
    'DTZ gemeinsam etwas planen, DTZ Sprechen Teil 3, DTZ planen Redemittel, DTZ Sprechen Beispiel, DTZ mündliche Prüfung Teil 3',
  badge: 'Sprechen · DTZ',
  lead:
    'Am Ende der mündlichen DTZ-Prüfung planen Sie mit Ihrer Partnerin oder Ihrem Partner etwas <strong>gemeinsam</strong> — einen Kursbesuch, ein Fest, eine Hilfe für Nachbarn. Auf dem Aufgabenblatt stehen Leitpunkte als Ideen. Wer Vorschläge macht, auf die andere Person eingeht und am Ende zu einem Plan kommt, löst die Aufgabe. Hier sehen Sie, wie das konkret klingt.',
  datePublished: '2026-10-26',
  answer:
    'Im DTZ Sprechen Teil 3 planen Sie zusammen mit einer anderen Person eine Alltagsaktivität, zum Beispiel einen Kurs an der Volkshochschule oder ein Fest. Das Aufgabenblatt nennt die Situation und Leitpunkte wie Wann?, Wo?, Kosten? oder Wer macht was?. Sie machen Vorschläge, reagieren auf die Ideen der Partnerin oder des Partners und einigen sich auf einen Plan. Die ganze mündliche Prüfung dauert etwa 15 bis 16 Minuten, Teil 3 ist ihr Abschluss.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'BAMF — Abschlussprüfung (DTZ)', url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html' },
    { label: 'telc — Übungstest 2 DTZ (PDF)', url: 'https://shop.telc.net/media/catalog/product/file//5/0/5010-b00-030101_barrierefrei_bib.pdf' },
    { label: 'telc — Übungstest DTZ, Auf jeden Fall B1.2 (PDF)', url: 'https://www.telc.net/fileadmin/user_upload/Downloads_Verlag/Auf_jeden_Fall/Uebungstests/Auf_jeden_Fall_B1.2_UEbungstest_DTZ.pdf' },
  ],

  sections: [
    {
      id: 'ablauf',
      heading: 'So funktioniert Teil 3',
      blocks: [
        {
          type: 'p',
          text: 'Der dritte Teil heißt bei telc <strong>„Gemeinsam etwas planen"</strong>. Sie bekommen ein Aufgabenblatt mit einer Situation und einigen <strong>Leitpunkten</strong>. In telcs eigenem Übungsmaterial möchten zwei Personen zusammen einen Kurs an der Volkshochschule besuchen; die Ideen auf dem Blatt fragen nach dem Kurs, nach Tag und Uhrzeit, nach den Kosten, nach dem Weg dorthin und nach der Anmeldung.',
        },
        {
          type: 'p',
          text: 'Ihre Aufgabe: Planen Sie mit Ihrer Partnerin oder Ihrem Partner, was Sie tun möchten. Das heißt in der Praxis:',
        },
        {
          type: 'list',
          items: [
            'zu den Leitpunkten <strong>eigene Vorschläge</strong> machen,',
            'auf die Vorschläge der anderen Person <strong>reagieren</strong>,',
            'Fragen stellen, wenn etwas unklar ist,',
            'am Ende einen <strong>gemeinsamen Plan</strong> haben — wer macht was, wann.',
          ],
        },
        {
          type: 'callout',
          text: 'Auf dem Aufgabenblatt steht am Ende der Liste oft „…?". Das ist eine Einladung, selbst einen Punkt zu ergänzen. Ein eigener Punkt zeigt, dass Sie mitdenken.',
        },
      ],
    },
    {
      id: 'beispiel',
      heading: 'Beispieldialog: einer Nachbarin beim Umzug helfen',
      blocks: [
        {
          type: 'p',
          text: 'Eigene Übungsaufgabe im DTZ-Stil: Ihre Nachbarin, Frau Kaya, zieht nächsten Monat um. Sie und Ihre Partnerin oder Ihr Partner möchten ihr helfen. Planen Sie, was Sie tun möchten. Ideen: Wann? Wie viele Helfer? Auto oder Transporter? Essen und Getränke? Wer macht was? …?',
        },
        {
          type: 'model',
          label: 'Beispieldialog',
          lines: [
            'A: Frau Kaya zieht ja bald um. Wollen wir ihr zusammen helfen? Wann hätten Sie denn Zeit?',
            'B: Am besten am Samstag, da arbeite ich nicht. Der Umzug ist doch am 15., oder?',
            'A: Ja, genau. Samstag passt mir auch. Wir sollten früh anfangen, vielleicht um 8 Uhr.',
            'B: Einverstanden. Aber wir zwei schaffen das nicht allein. Ich frage meinen Bruder, ob er auch mitkommt.',
            'A: Gute Idee. Ich kann noch Herrn Novak aus dem dritten Stock fragen. Dann sind wir zu viert.',
            'B: Und wie transportieren wir die Möbel? Ein normales Auto ist zu klein.',
            'A: Wir könnten einen Transporter mieten. Ich habe einen Führerschein, ich kann fahren.',
            'B: Prima. Dann kümmere ich mich um das Essen. Ich mache Brötchen, und Getränke kaufe ich auch.',
            'A: Sehr gut. Sollen wir Frau Kaya fragen, ob sie noch Kartons braucht?',
            'B: Ja, das mache ich heute Abend. Also: Samstag um 8 Uhr, vier Helfer, Sie mieten den Transporter, und ich bringe Essen und Getränke mit.',
            'A: Genau so machen wir es.',
          ],
        },
        { type: 'h3', text: 'Was dieser Dialog richtig macht' },
        {
          type: 'list',
          items: [
            'Zu jedem Leitpunkt gibt es einen <strong>Vorschlag</strong>: Tag, Uhrzeit, Helfer, Transport, Essen.',
            'Beide <strong>reagieren</strong> aufeinander: „Einverstanden", „Gute Idee", „Aber wir zwei schaffen das nicht allein".',
            'Es gibt einen <strong>eigenen Punkt</strong> (Kartons) — das „…?" auf dem Blatt ist genutzt.',
            'Die <strong>Zusammenfassung</strong> am Ende macht klar, wer was übernimmt.',
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel für Teil 3',
      blocks: [
        { type: 'h3', text: 'Beginnen und Vorschläge machen' },
        {
          type: 'list',
          items: [
            'Wir sollen zusammen … planen. Was meinen Sie?',
            'Ich schlage vor, dass wir … / Wir könnten …',
            'Wie wäre es mit … ? / Was halten Sie von … ?',
          ],
        },
        { type: 'h3', text: 'Zustimmen oder etwas anderes vorschlagen' },
        {
          type: 'list',
          items: [
            'Einverstanden. / Das ist eine gute Idee.',
            'Das passt mir leider nicht. Geht es auch am … ?',
            'Ich finde … besser, weil …',
          ],
        },
        { type: 'h3', text: 'Nachfragen' },
        {
          type: 'list',
          items: [
            'Wann hätten Sie Zeit? / Wo treffen wir uns?',
            'Wie viel kostet das ungefähr?',
            'Wer kümmert sich um … ?',
          ],
        },
        { type: 'h3', text: 'Aufgaben verteilen und abschließen' },
        {
          type: 'list',
          items: [
            'Ich übernehme … , und Sie … ?',
            'Dann machen wir es so: …',
            'Also, noch einmal zusammen: …',
          ],
        },
        {
          type: 'callout',
          text: 'Für den DTZ reichen einfache, klare Sätze. „Wir könnten …" und „Ich übernehme …" in vielen Varianten tragen Sie durch den ganzen Teil.',
        },
      ],
    },
    {
      id: 'themen',
      heading: 'Typische Planungssituationen zum Üben',
      blocks: [
        {
          type: 'p',
          text: 'Die Situationen im DTZ kommen aus dem Alltag in Deutschland. Üben Sie mit Anlässen wie diesen — jeweils mit vier bis fünf Leitpunkten:',
        },
        {
          type: 'cards',
          items: [
            { eyebrow: 'Weiterbildung', title: 'Einen Kurs besuchen', body: 'Welcher Kurs, wann, wie lange, Kosten, Anmeldung, Weg zur Volkshochschule.' },
            { eyebrow: 'Nachbarschaft', title: 'Ein Hoffest organisieren', body: 'Termin, Ort im Hof, Essen, Musik, Einladung der Nachbarn, Aufräumen.' },
            { eyebrow: 'Kinder', title: 'Einen Kindergeburtstag planen', body: 'Datum, Gäste, Spiele, Kuchen, Geschenk, wer die Kinder abholt.' },
            { eyebrow: 'Arbeit', title: 'Abschied für eine Kollegin', body: 'Wann, wo, Geschenk, Geld sammeln, Karte schreiben, Rede.' },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Fehler, die Sie vermeiden sollten',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Nur Fragen stellen',
              body: '„Wann? Wo? Wie viel?" — wer nur fragt, macht keine Vorschläge. Kombinieren Sie: ein Vorschlag, dann eine Frage an die Partnerin.',
            },
            {
              title: 'Nicht auf die Partnerin eingehen',
              body: 'Wenn Ihre Partnerin etwas vorschlägt, reagieren Sie darauf, bevor Sie zum nächsten Punkt gehen. Sonst wird aus dem Gespräch ein Nebeneinander.',
            },
            {
              title: 'Kein Ergebnis',
              body: 'Am Ende sollte klar sein, was Sie zusammen tun. Ein Satz zur Zusammenfassung reicht und rundet den Teil ab.',
            },
            {
              title: 'Zu leise oder zu schnell aufgeben',
              body: 'Wenn Ihnen ein Wort fehlt, umschreiben Sie es. Wenn Ihre Partnerin nicht weiterweiß, helfen Sie mit einer Frage.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'Teil 3 ohne Partner üben',
      blocks: [
        {
          type: 'p',
          text: 'Schreiben Sie für eine Situation fünf Leitpunkte auf und sprechen Sie beide Rollen laut. Achten Sie darauf, dass jede Rolle mindestens zwei Vorschläge macht und einmal widerspricht.',
        },
        {
          type: 'p',
          text: 'Mit dem <a href="/speaking/">KI-Sprechtraining</a> führen Sie freie Gespräche über Alltagsthemen und bekommen nach dem Gespräch eine Auswertung zu Grammatik, Wortschatz und Ausdruck. Den zweiten Prüfungsteil erklärt der Leitfaden <a href="/leitfaden/dtz-sprechen-bild-beschreiben/">DTZ: Bild beschreiben</a>, den Ablauf der ganzen Prüfung der <a href="/leitfaden/dtz/">DTZ-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Was steht auf dem Aufgabenblatt für Teil 3?',
      a: 'Laut telc ein Aufgabenblatt mit Leitpunkten: eine kurze Situation, eine Aufgabe („Planen Sie, was Sie tun möchten") und einige Ideen als Stichwörter, oft mit „…?" am Ende für eigene Ideen.',
    },
    {
      q: 'Muss ich alle Leitpunkte besprechen?',
      a: 'Die Leitpunkte sind Ideen für Ihr Gespräch. Sprechen Sie über möglichst viele davon, aber lieber gründlich als nur kurz — und kommen Sie zu einem gemeinsamen Plan.',
    },
    {
      q: 'Muss ich mit meiner Partnerin einer Meinung sein?',
      a: 'Sie dürfen unterschiedliche Vorschläge machen und widersprechen. Am Ende sollten Sie sich aber auf einen Plan einigen, denn die Aufgabe ist das gemeinsame Planen.',
    },
    {
      q: 'Wie ist Teil 3 im DTZ im Vergleich zu telc B1?',
      a: 'Sehr ähnlich: Auch in telc Deutsch B1 gibt es den Teil „Gemeinsam etwas planen". Die Situationen im DTZ kommen stärker aus dem Alltag in Deutschland, etwa Volkshochschule, Nachbarschaft oder Kinder.',
    },
    {
      q: 'Was passiert, wenn meine Partnerin sehr schwach ist?',
      a: 'Helfen Sie mit einfachen Fragen und machen Sie Vorschläge, auf die sie mit Ja oder Nein reagieren kann. So bleibt das Gespräch in Gang.',
    },
  ],

  cta: {
    heading: 'Für den DTZ üben — mit Modelltest',
    body: 'Mit einem kostenlosen Konto üben Sie Alltagsgespräche mit dem KI-Gesprächspartner und testen, solange Pro läuft, den zeitgesteuerten DTZ-Modelltest. Der Einstufungstest zeigt Ihnen vorher, wo Sie stehen.',
  },
};
