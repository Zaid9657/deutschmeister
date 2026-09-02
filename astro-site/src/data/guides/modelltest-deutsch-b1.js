// Modelltest Deutsch B1 — keyword-led guide (traffic lever, 2026-09-02).
//
// Why this exists: DataForSEO 2026-09-02 measured the Modelltest cluster at
// ~3,650 searches/month with LOW competition ("telc b1 modelltest" 1,600,
// "telc b2 modelltest" 1,300, "dtz modelltest" 720, "goethe b1 modellsatz"
// 30) — and the honest play is to SEND people to the official free model
// tests and teach what almost everyone gets wrong: sitting and marking them.
// That framing is also the truthful one for our own product: the timed
// DeutschMeister Übungstest is a Kurzversion in the style of the exam, never
// a substitute for the official Modelltest.
//
// FACT DISCIPLINE: pass-mark statements restate facts verified in the
// telc-b1/goethe-b1/dtz guide modules on 2026-08-22 — factsCheckedOn carries
// that date. The official bodies publish their model tests on their own
// sites; we link the bodies, not deep PDF URLs (those move).

export const modelltestDeutschB1 = {
  slug: 'modelltest-deutsch-b1',
  title: 'Modelltest Deutsch B1: telc, Goethe & DTZ richtig üben',
  h1: 'Modelltest Deutsch B1: Wo du ihn findest — und wie du ihn richtig nutzt',
  description:
    'Modelltest für telc B1, Goethe B1 und DTZ: wo es die offiziellen Tests kostenlos gibt, wie du sie unter echten Bedingungen machst und richtig auswertest.',
  keywords:
    'Modelltest Deutsch B1, telc B1 Modelltest, DTZ Modelltest, Goethe B1 Modellsatz, telc B2 Modelltest, B1 Prüfung üben',
  badge: 'Leitfaden',
  lead:
    'Jeder Prüfungsanbieter stellt mindestens einen kompletten Modelltest <strong>kostenlos</strong> zur Verfügung — mit echten Aufgaben, Antwortbögen und Lösungen. Trotzdem gehen die meisten Kandidaten falsch damit um: Sie machen ihn häppchenweise, werten ihn falsch aus oder lassen das Sprechen weg. Dieser Leitfaden zeigt, wo du die offiziellen Tests findest und wie du aus einem Modelltest das Maximum herausholst.',
  datePublished: '2026-09-02',
  answer:
    'Offizielle Modelltests gibt es kostenlos direkt beim jeweiligen Anbieter: telc veröffentlicht Übungstests für telc Deutsch B1 und B2 auf telc.net, das Goethe-Institut stellt Modellsätze für das Goethe-Zertifikat B1 auf goethe.de bereit, und für den DTZ gibt es einen Modelltest über das BAMF. Entscheidend ist die Durchführung: ein kompletter Durchgang in einer Sitzung, mit Stoppuhr und Antwortbogen, danach ehrlich ausgewertet — bei telc zählt die 60-Prozent-Grenze in beiden Teilen getrennt, beim Goethe-Zertifikat pro Modul, der DTZ vergibt Niveaustufen statt einer Bestehensgrenze.',
  factsCheckedOn: '2026-08-22',
  sources: [
    { label: 'telc gGmbH', url: 'https://www.telc.net/' },
    { label: 'Goethe-Institut', url: 'https://www.goethe.de/' },
    { label: 'BAMF (DTZ)', url: 'https://www.bamf.de/' },
  ],

  sections: [
    {
      id: 'wo-finden',
      heading: 'Wo du die offiziellen Modelltests findest',
      blocks: [
        {
          type: 'p',
          text: 'Kauf keine „Original-Prüfungsfragen" von Drittanbietern — die echten Modelltests kommen von den Prüfungsanbietern selbst, und sie kosten nichts:',
        },
        {
          type: 'table',
          head: ['Prüfung', 'Wo es den offiziellen Test gibt', 'Was enthalten ist'],
          rows: [
            ['telc Deutsch B1', 'telc.net — im Bereich der jeweiligen Prüfung als „Übungstest" zum Download', 'Kompletter Testsatz mit Aufgaben, Antwortbogen, Lösungen und Hörtexten'],
            ['telc Deutsch B2', 'telc.net — gleiches Prinzip, eigener Übungstest für B2', 'Kompletter Testsatz inklusive Sprachbausteine'],
            ['Goethe-Zertifikat B1', 'goethe.de — als „Modellsatz" bzw. Übungsmaterialien zur Prüfung', 'Aufgaben für alle vier Module, mit Lösungen und Audios'],
            ['DTZ', 'Über das BAMF bzw. die Prüfungsstelle — als Modelltest zum DTZ', 'Kompletter Durchlauf inklusive Antwortbogen'],
          ],
        },
        {
          type: 'p',
          text: 'Die Links zu den Anbietern stehen unten bei den Quellen dieses Leitfadens. Such auf der Anbieterseite nach „Übungstest" oder „Modellsatz" plus deiner Prüfung — die Anbieter ändern gelegentlich die genauen Seitenpfade, die Materialien selbst bleiben kostenlos verfügbar.',
        },
        {
          type: 'callout',
          text: 'Druck den Test aus, wenn du kannst — inklusive Antwortbogen. Die echte Prüfung ist Papier, und das Übertragen auf den Antwortbogen kostet Zeit, die du einplanen musst.',
        },
      ],
    },
    {
      id: 'durchfuehren',
      heading: 'So führst du den Modelltest richtig durch',
      blocks: [
        {
          type: 'p',
          text: 'Ein Modelltest, den du über drei gemütliche Abende verteilst, sagt etwas über dein Deutsch — aber nichts über deine Prüfung. Der Zeitdruck IST die Prüfung. Deshalb:',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Vorher',
              title: 'Echte Bedingungen herstellen',
              tasks: [
                'Einen Termin blocken: der komplette schriftliche Teil in EINER Sitzung',
                'Handy weg, Wörterbuch weg — in der Prüfung hast du beides nicht',
                'Stoppuhr für jeden Prüfungsteil, Zeiten wie im Test angegeben',
                'Antwortbogen bereitlegen und wirklich benutzen',
              ],
            },
            {
              label: 'Währenddessen',
              title: 'Durchziehen wie am Prüfungstag',
              tasks: [
                'Wenn die Zeit für einen Teil um ist: weiter zum nächsten — auch mit Lücken',
                'Hörtexte nur so oft abspielen, wie es der Test vorsieht',
                'Den Schreibteil handschriftlich — Tempo und Lesbarkeit sind Teil der Übung',
              ],
              tip: 'Nicht rausgehen, nichts nachschlagen, keine Pause außerhalb des Plans. Genau die Momente, in denen du „nur kurz" abweichen willst, sind die, die dich am Prüfungstag treffen.',
            },
            {
              label: 'Danach',
              title: 'Auswerten und Sprechen nachholen',
              tasks: [
                'Objektive Teile mit dem Lösungsschlüssel auswerten (siehe nächster Abschnitt)',
                'Den Schreibteil mit den Kriterien des Anbieters ehrlich selbst einschätzen — oder bewerten lassen',
                'Die mündliche Prüfung mit Partner simulieren oder mit dem <a href="/speaking/">KI-Sprechtraining</a> üben — auslassen gilt nicht',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'auswerten',
      heading: 'Richtig auswerten: jede Prüfung rechnet anders',
      blocks: [
        {
          type: 'p',
          text: 'Der häufigste Auswertungsfehler: alle Punkte zusammenzählen und eine Gesamtprozentzahl bilden. So rechnet keine der drei Prüfungen.',
        },
        {
          type: 'p',
          text: '<strong>telc Deutsch B1:</strong> Schriftlicher Teil (maximal 225 Punkte) und mündlicher Teil (maximal 75 Punkte) werden getrennt bewertet — bestanden ist jeder Teil ab 60 Prozent, und zwischen den Teilen wird nicht verrechnet. Ein starkes Leseverstehen kann also ein schwaches Sprechen nicht retten. Die Details stehen im <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a>.',
        },
        {
          type: 'p',
          text: '<strong>Goethe-Zertifikat B1:</strong> Vier Module (Lesen, Hören, Schreiben, Sprechen), jedes einzeln bewertet und einzeln bestanden ab 60 von 100 Punkten. 95 Punkte im Lesen retten kein Schreiben mit 55 — werte deshalb jedes Modul für sich aus. Mehr dazu im <a href="/leitfaden/goethe-b1/">Goethe-B1-Leitfaden</a>.',
        },
        {
          type: 'p',
          text: '<strong>DTZ:</strong> Der DTZ kennt kein einfaches Bestehen oder Durchfallen — er ist skaliert und weist pro Prüfungsteil aus, ob du A2- oder B1-Niveau erreicht hast. Werte deinen Modelltest deshalb pro Teil aus und frag dich: Reicht das in jedem Teil für B1? Der <a href="/leitfaden/dtz/">DTZ-Leitfaden</a> erklärt die Skalierung.',
        },
        {
          type: 'callout',
          text: 'Notiere nicht nur die Punktzahl, sondern WO die Punkte fehlen: welcher Prüfungsteil, welcher Aufgabentyp. „140 von 225" ist ein Gefühl — „acht Fehler, davon sechs bei den Sprachbausteinen" ist ein Trainingsplan.',
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die 5 häufigsten Modelltest-Fehler',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Den Test in Etappen machen',
              body: 'Drei Abende à 45 Minuten fühlen sich produktiv an — aber sie messen nie die Ermüdung, die nach 90 Minuten Prüfung real ist. Ein Modelltest gehört in eine Sitzung. Wer die nicht durchhält, hat das wichtigste Ergebnis schon gefunden.',
            },
            {
              title: 'Teile zusammenrechnen, die getrennt zählen',
              body: 'Eine Gesamtprozentzahl über alle Teile sieht beruhigend aus und ist trotzdem falsch: telc und Goethe bestehen auf getrennten Grenzen pro Teil bzw. Modul. Wer falsch rechnet, geht überschätzt oder unnötig verängstigt in die Prüfung.',
            },
            {
              title: 'Das Sprechen weglassen',
              body: 'Kein Partner zu Hause, also fällt die mündliche Prüfung beim Üben aus — und genau dort scheitern dann Kandidaten, die alles andere bestanden hätten. Simuliere den mündlichen Teil mit einem Partner oder mit KI-Sprechtraining. Er zählt genauso wie der Rest.',
            },
            {
              title: 'Nur einen einzigen Durchgang machen',
              body: 'Der erste Modelltest zeigt, wo du stehst. Erst der zweite — einige Wochen später, nach gezieltem Training der Schwächen — zeigt, ob dein Lernen wirkt. Plane beide ein, mit Abstand.',
            },
            {
              title: 'Den Modelltest als Lernmethode missverstehen',
              body: 'Zehn Modelltests hintereinander machen niemanden besser — sie messen nur zehnmal dasselbe. Der Test ist das Thermometer, nicht die Medizin. Zwischen den Durchgängen gehört die Zeit dem Training: Grammatik, Hören, Schreiben, Sprechen.',
            },
          ],
        },
      ],
    },
    {
      id: 'zwischen-den-tests',
      heading: 'Zwischen den Modelltests: gezielt trainieren',
      blocks: [
        {
          type: 'p',
          text: 'Nach der Auswertung weißt du, welcher Teil Punkte kostet. Deutschmeister deckt jeden davon ab:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Sprachbausteine & Grammatik',
              title: 'Grammatik-Lektionen + Sentence X-Ray',
              body: 'Jedes Thema mit Erklärung und Übungen — und das <a href="/analyze/">Sentence X-Ray</a> zerlegt jeden Satz in Fälle und Satzglieder, damit du das Warum verstehst.',
            },
            {
              eyebrow: 'Hörverstehen',
              title: 'Hörübungen mit Muttersprachlern',
              body: 'Dialoge nach Niveau gestaffelt, mit begrenzten Abspielversuchen — wie in der Prüfung.',
            },
            {
              eyebrow: 'Schreiben',
              title: 'KI-Schreibtraining',
              body: 'Briefe im Prüfungsstil schreiben und nach Prüfungskriterien bewerten lassen. Der <a href="/leitfaden/brief-schreiben-b1/">Brief-Leitfaden</a> liefert Aufbau und Redemittel dazu.',
            },
            {
              eyebrow: 'Sprechen',
              title: 'KI-Sprechtraining',
              body: 'Prüfungsnahe Gesprächssituationen mit sofortigem Feedback — der Teil, den fast alle zu spät üben.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Zusätzlich gibt es auf Deutschmeister einen zeitgesteuerten Übungstest im Stil von telc B1, Goethe B1, DTZ und telc B2 — eine Kurzversion mit automatischer Auswertung, kein Ersatz für den offiziellen Modelltest, aber ein schneller Zwischencheck mit echtem Zeitdruck. Den Einstieg findest du über die Prüfungsseiten, zum Beispiel <a href="/pruefung/telc-b1/">telc B1</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Sind die offiziellen Modelltests wirklich kostenlos?',
      a: 'Ja. telc, das Goethe-Institut und das BAMF stellen Übungstests bzw. Modellsätze zu ihren Prüfungen kostenlos bereit, inklusive Lösungen und Hörmaterialien. Bezahlen musst du erst für die Prüfung selbst — nicht für das offizielle Übungsmaterial.',
    },
    {
      q: 'Wie viele Modelltests sollte ich machen?',
      a: 'Zwei komplette Durchgänge unter echten Bedingungen reichen den meisten: einer zu Beginn der Vorbereitung als Standortbestimmung, einer wenige Wochen vor der Prüfung als Generalprobe. Dazwischen gehört die Zeit dem gezielten Training der Schwächen, nicht weiteren Tests.',
    },
    {
      q: 'Wann sollte ich den ersten Modelltest machen?',
      a: 'Früh — sobald du ungefähr auf dem Zielniveau lernst. Ein früher Modelltest zeigt dir, welche Teile die meisten Punkte kosten, und macht deine Vorbereitung von Anfang an gezielt statt pauschal.',
    },
    {
      q: 'Wie werte ich den Schreibteil ohne Lehrer aus?',
      a: 'Die Anbieter veröffentlichen ihre Bewertungskriterien mit dem Modelltest. Geh sie ehrlich Punkt für Punkt durch: alle Leitpunkte behandelt, Register passend, Aufbau klar? Alternativ kann das KI-Schreibtraining von Deutschmeister deinen Brief nach diesen Kriterien bewerten und konkrete Korrekturen zeigen.',
    },
    {
      q: 'Ersetzt der DeutschMeister-Übungstest den offiziellen Modelltest?',
      a: 'Nein. Unser Übungstest ist eine Kurzversion im Stil der Prüfung — gut für einen schnellen Check unter Zeitdruck, mit automatischer Auswertung. Für die Generalprobe gehört der offizielle, vollständige Modelltest des Anbieters auf den Tisch.',
    },
    {
      q: 'Zählt das Ergebnis meines Modelltests irgendwo offiziell?',
      a: 'Nein. Ein Modelltest ist reines Übungsmaterial — er sagt dir, wo du stehst, aber er ist kein Zertifikat und kein offizielles Ergebnis. Zählen tut nur die echte Prüfung am Prüfungszentrum.',
    },
  ],

  cta: {
    heading: 'Erst der Standort, dann der Plan',
    body: 'Mach den kostenlosen Einstufungstest, hol dir den offiziellen Modelltest deines Anbieters — und trainiere dazwischen gezielt.',
  },
};
