// Start Deutsch 1 / Goethe-Zertifikat A1 — written 2026-09-04.
//
// AUDIENCE: primarily spouse-visa candidates (Ehegattennachzug — Aufenthaltsgesetz
// § 28 for spouses of German citizens, § 30 for spouses of foreign residents)
// preparing outside Germany, plus au-pairs and absolute beginners. This is the
// exam most of them are actually sitting, so the slug and title use the exam's
// own name ("Start Deutsch 1") rather than only "Goethe A1" — telc's Start
// Deutsch 1 and Goethe's are the same jointly developed exam and this guide
// treats them as one, calling out the (rare) formal differences where they
// matter (registration, certificate name).
//
// FACT SOURCING. Format, timings, item counts and the scoring rule come from
// docs/research/research-market-2026-09-03.md §1 and
// docs/research/research-buyer-pedagogy-2026-09-03.md, both of which cite
// Goethe's own Durchführungsbestimmungen and Prüfungsziele/Testbeschreibung
// PDFs for A1 Start Deutsch 1. The Ehegattennachzug A1 requirement and the
// 2023/2024 exam/pass-rate figures come from Bundestag Drucksache 21/175,
// cited in the same research file and now also listed directly in `sources`
// below (previously only in this comment). factsCheckedOn reflects the date
// those documents were read.
//
// URL VERIFICATION (2026-09-05, via unrestricted egress — goethe.de is
// blocked by this sandbox's own proxy): re-checked every goethe.de URL with
// `curl -I`. The original `/de/spr/prf/gzsd1.html` (exam overview) and the
// reviewer-suggested stable `/de/spr/prf/mos.html` (Modellsätze) both 404 —
// neither exists on the live site, so neither is used. The original
// Übungsmaterial link used a Portugal-institute path (`/ins/pt/de/...`),
// flagged for review; replaced with the equivalent Germany-institute path,
// which returns 200: `/ins/de/de/prf/prf/gzsd1.html` (exam page) and
// `/ins/de/de/prf/prf/gzsd1/ueb.html` (Modellsätze/Übungsmaterial). The three
// PDFs under `/pro/relaunch/prf/de/` all verified 200. The Bundestag PDF
// (dserver.bundestag.de) verified 200.
//
// WHAT IS DELIBERATELY NOT STATED: exam fees (set per country/centre and
// change without notice — CLAUDE.md and tests/guides.test.mjs both ban a fee
// figure here), pass-rate promises for an individual reader, and any claim
// that our own certificate is accepted for the visa. Only Goethe/telc/ÖSD
// certificates count for immigration purposes, and the guide says so twice
// (overview + FAQ) rather than leaving it implied.

export const startDeutsch1 = {
  slug: 'start-deutsch-1',
  title: 'Start Deutsch 1 (Goethe-Zertifikat A1): Leitfaden 2026',
  h1: 'Start Deutsch 1 / Goethe-Zertifikat A1: Ablauf, Punkte und Vorbereitung',
  description:
    'Start Deutsch 1 (Goethe-Zertifikat A1) verstehen: Prüfungsformat, 60 von 100 Punkten zum Bestehen, Anmeldung und ein realistischer 8–12-Wochen-Lernplan.',
  keywords:
    'Start Deutsch 1, Goethe Zertifikat A1, Goethe A1 Prüfung, A1 Ehegattennachzug, Start Deutsch 1 Vorbereitung, Goethe A1 Modelltest',
  badge: 'Leitfaden',
  lead:
    'Für die meisten, die diese Seite lesen, ist <strong>Start Deutsch 1</strong> keine akademische Übung, sondern ein Termin mit einem festen Datum davor — meist der <strong>Ehegattennachzug</strong>. Diese Prüfung unterscheidet sich von B1-Prüfungen in einem wichtigen Punkt: Es gibt <strong>keine Module und keine Mindestpunktzahl pro Teil</strong> — wer insgesamt durchfällt, wiederholt alles. Dieser Leitfaden zeigt dir den genauen Ablauf, die Punkteregel, wie du dich anmeldest und einen ehrlichen Lernplan.',
  datePublished: '2026-09-04',
  answer:
    'Start Deutsch 1 ist die A1-Prüfung von Goethe-Institut und telc und besteht aus vier Teilen: Hören (ca. 20 Min.), Lesen (25 Min.), Schreiben (20 Min.) und Sprechen (15 Min., in der Gruppe). Insgesamt sind 100 Punkte erreichbar, bestanden ist die Prüfung ab 60 Punkten. Es gibt keine Mindestpunktzahl pro Teil, aber auch keine Module: Wer insgesamt unter 60 bleibt, muss die komplette Prüfung wiederholen. Für den Ehegattennachzug ist dieses A1-Zeugnis eines Goethe-Instituts, von telc oder ÖSD die anerkannte Nachweisform — nicht ein Kursabschluss oder eine App.',
  factsCheckedOn: '2026-09-03',
  sources: [
    { label: 'Goethe-Institut — Start Deutsch 1', url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd1.html' },
    { label: 'Goethe-Institut — Durchführungsbestimmungen A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf' },
    { label: 'Goethe-Institut — Prüfungsziele/Testbeschreibung A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf' },
    { label: 'Goethe-Institut — Wortliste A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf' },
    { label: 'Goethe-Institut — Modellsätze und Übungsmaterial', url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd1/ueb.html' },
    { label: 'Bundestag — Drucksache 21/175 (Ehegattennachzug, SD1-Zahlen)', url: 'https://dserver.bundestag.de/btd/21/001/2100175.pdf' },
  ],

  sections: [
    {
      id: 'ueberblick',
      heading: 'Was ist Start Deutsch 1 — und wer braucht es?',
      blocks: [
        {
          type: 'p',
          text: 'Start Deutsch 1 ist die gemeinsam entwickelte A1-Prüfung von Goethe-Institut und telc — inhaltlich und im Format identisch, nur der Name auf dem Zertifikat unterscheidet sich. Beim Goethe-Institut heißt sie offiziell <strong>Goethe-Zertifikat A1: Start Deutsch 1</strong>. Sie weist die erste Stufe des Gemeinsamen Europäischen Referenzrahmens (GER) nach: einfache, unmittelbar relevante Alltagssprache.',
        },
        {
          type: 'p',
          text: 'Der mit Abstand häufigste Grund, warum Menschen außerhalb Deutschlands diese Prüfung ablegen, ist der <strong>Ehegattennachzug</strong>: Wer als ausländischer Ehepartner eines deutschen Staatsangehörigen (oder unter bestimmten Bedingungen eines hier lebenden Ausländers) ein Visum zum Familiennachzug beantragt, muss nach dem Aufenthaltsgesetz (§ 28 bzw. § 30 AufenthG) vorher „einfache Deutschkenntnisse“ nachweisen — das entspricht Niveau A1, und die deutsche Auslandsvertretung akzeptiert dafür in der Praxis das Zeugnis von Start Deutsch 1. Nach Angaben der Bundesregierung wurden 2023 rund 41.900 und 2024 rund 35.700 Start-Deutsch-1-Prüfungen im Rahmen des Ehegattennachzugs abgelegt, mit Bestehensquoten um 62–65 %.',
        },
        {
          type: 'p',
          text: 'Neben dem Ehegattennachzug legen die Prüfung ab: Au-pairs (für viele Gastfamilien und Vermittlungen empfohlen oder verlangt), Menschen, die aus null Vorkenntnissen einen ersten offiziellen Nachweis brauchen, und alle, die für die Chancenkarte oder eine erste Bewerbung Deutschkenntnisse auf A1 belegen wollen.',
        },
        {
          type: 'callout',
          text: 'Wichtig für die Visumstelle: Nur ein Zertifikat von Goethe-Institut, telc oder ÖSD zählt als offizieller A1-Nachweis für den Ehegattennachzug. Ein Kursabschluss, eine App-Zertifizierung oder ein Zertifikat von Deutschmeister ersetzt das nicht — wir bereiten dich auf genau diese Prüfung vor, stellen sie aber nicht aus.',
        },
      ],
    },
    {
      id: 'format',
      heading: 'Der Ablauf: vier Teile, keine Module',
      blocks: [
        {
          type: 'p',
          text: 'Start Deutsch 1 hat vier Teile — Hören, Lesen, Schreiben, Sprechen — die an einem Termin nacheinander geprüft werden. Anders als beim Goethe-Zertifikat B1 gibt es <strong>keine Module</strong>: Du kannst die Teile nicht einzeln ablegen oder einzeln wiederholen.',
        },
        {
          type: 'table',
          head: ['Teil', 'Aufbau', 'Dauer'],
          rows: [
            ['Hören', '3 Teile, 15 Aufgaben. Teil 1 und 3 werden zweimal vorgespielt, Teil 2 nur einmal.', 'ca. 20 Min.'],
            ['Lesen', '3 Teile, 15 Aufgaben: kurze Mitteilungen, Anzeigen, Aushänge/Schilder verstehen.', '25 Min.'],
            ['Schreiben', 'Teil 1: ein Formular mit 5 Feldern ausfüllen. Teil 2: eine kurze Mitteilung (Anrede, 3 Leitpunkte, Gruß) schreiben.', '20 Min.'],
            ['Sprechen', 'In der Gruppe (bis zu 4 Personen), ohne Vorbereitungszeit: sich vorstellen (Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby), buchstabieren und Telefonnummer nennen, Informationen mit Wortkarten erfragen, Bitten mit Bildkarten formulieren.', 'ca. 15 Min.'],
          ],
        },
        {
          type: 'p',
          text: 'Beim Hören lohnt sich besonders, Teil 2 vorher zu kennen: Diese Durchsagen laufen nur <strong>einmal</strong>, im normalen Sprechtempo — genau dort berichten viele Kandidat:innen von Punktverlust, weil sie an einem unbekannten Wort hängen bleiben und den Rest der Ansage verpassen.',
        },
        {
          type: 'p',
          text: 'Im Sprechteil laufen die drei Aufgaben in fester Reihenfolge ab: Zuerst stellst du dich vor — Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby — und buchstabierst dabei einen Namen sowie eine Telefonnummer — genau das übst du am besten separat und laut, bis es automatisch sitzt. Danach erfragt und gibt ihr in der Gruppe Informationen anhand von Wortkarten, und zum Schluss formuliert und reagiert ihr auf Bitten anhand von Bildkarten (zum Beispiel: „Kannst du bitte das Fenster schließen?“).',
        },
      ],
    },
    {
      id: 'bewertung',
      heading: 'Wie viele Punkte braucht man zum Bestehen?',
      blocks: [
        {
          type: 'p',
          text: 'Aus den vier Teilen ergeben sich zusammen <strong>100 Punkte</strong>. Bestanden ist die Prüfung ab <strong>60 Punkten</strong>, also 60 %.',
        },
        {
          type: 'p',
          text: 'Zwei Dinge, die häufig verwechselt werden: Es gibt <strong>keine Mindestpunktzahl pro Teil</strong> — eine Schwäche im Sprechen kann durch ein starkes Hören ausgeglichen werden. Aber es gibt auch <strong>keine Module</strong>: Wer insgesamt unter 60 Punkten bleibt, hat die Prüfung nicht bestanden und muss beim nächsten Versuch <strong>alle vier Teile erneut</strong> ablegen, nicht nur den schwächsten.',
        },
        {
          type: 'p',
          text: 'Die Prüfung kann beliebig oft wiederholt werden. Bei einer erneuten Anmeldung nach einem nicht bestandenen Versuch lohnt es sich, gezielt die Teile zu stärken, in denen die letzte Auswertung die wenigsten Punkte zeigte — die Auswertung, die du nach der Prüfung erhältst, zeigt das Ergebnis pro Teil, auch wenn am Ende nur die Gesamtsumme über Bestehen entscheidet.',
        },
        {
          type: 'callout',
          text: 'Plane mit einem Sicherheitsabstand über 60 Punkten statt genau auf der Grenze. Nervosität am Prüfungstag kostet Punkte, besonders im Sprechen und Schreiben, wo mehr vom Gesamteindruck abhängt als beim Ankreuzen.',
        },
      ],
    },
    {
      id: 'anmeldung',
      heading: 'Anmeldung: wo, wie und mit welchem Material üben',
      blocks: [
        {
          type: 'p',
          text: 'Start Deutsch 1 wird über das nächstgelegene Goethe-Institut oder eine lizenzierte telc-Prüfungsstelle abgelegt. In vielen Ländern mit wenigen Prüfungszentren sind Termine Wochen im Voraus ausgebucht — wenn ein Visatermin feststeht, ist die Anmeldung zur Sprachprüfung eine der ersten Aufgaben, nicht eine der letzten.',
        },
        {
          type: 'p',
          text: 'Auf der Website deines zuständigen Goethe-Instituts findest du die genauen Termine, den Anmeldeweg und — kostenlos zum Download — offizielle <strong>Modellsätze</strong> mit Audiodateien und einem Beispielvideo zum Sprechteil. Diese Modellsätze sind das zuverlässigste Übungsmaterial, weil sie exakt Format und Schwierigkeitsgrad der echten Prüfung zeigen.',
        },
        {
          type: 'p',
          text: 'Ebenfalls offiziell verfügbar ist die <strong>A1-Wortliste</strong> mit rund 650 Einträgen — der Wortschatz, aus dem die Prüfung schöpft. Wer diese Liste vor der Vorbereitung nicht kennt, lernt oft am Bedarf vorbei; sie ist der sinnvollste erste Download, noch vor dem ersten Modelltest.',
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ein realistischer 8–12-Wochen-Lernplan',
      blocks: [
        {
          type: 'p',
          text: 'Von null Vorkenntnissen rechnen Sprachschulen und das Goethe-Institut selbst mit insgesamt etwa <strong>60–80 Lernstunden à 60 Minuten</strong> bis A1. Bei täglich 45–60 Minuten Lernzeit sind das realistisch <strong>8 bis 12 Wochen</strong> — davon fließen die letzten <strong>rund 25–30 Stunden</strong> in die reine Prüfungsphase: Modelltests, gezieltes Schließen von Lücken, Generalprobe (Woche 8–12 im Plan unten). Wenn deine Muttersprache nicht das lateinische Alphabet verwendet (zum Beispiel Arabisch, Urdu, Persisch oder Kyrillisch), plane für dieselbe Stundenzahl <strong>etwa die doppelte Zeit</strong> ein — nicht weil Deutsch schwerer wird, sondern weil Lesen und Schreiben selbst noch automatisiert werden müssen.',
        },
        {
          type: 'p',
          text: 'Starte mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit du wirklich bei null beginnst und keine Zeit mit bereits Bekanntem verlierst.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1',
              title: 'Grundlagen, die sofort Prüfungspunkte sind',
              tasks: [
                'Alphabet und Buchstabieren laut üben — das ist wörtlich Sprechen Teil 1',
                'Zahlen, Telefonnummer und Adresse sicher sagen und schreiben können',
                'Die eigene Vorstellung (Name, Land, Wohnort, Sprachen, Beruf) formulieren',
                'Ein Anmeldeformular mit den eigenen Daten ausfüllen',
              ],
              tip: 'Diese vier Punkte sind keine Aufwärmübung, sondern direkte Prüfungsaufgaben in Sprechen Teil 1 und Schreiben Teil 1. Wer sie in Woche 1 sicher beherrscht, hat einen Teil der Prüfung im Grunde schon bestanden.',
            },
            {
              label: 'Woche 2–4',
              title: 'Grundwortschatz und einfache Sätze',
              tasks: [
                'Die offizielle A1-Wortliste thematisch lernen: Familie, Wohnen, Einkaufen, Zeit, Ämter',
                'W-Fragen und einfache Aussagesätze im Präsens sicher bilden',
                'Verneinung, Possessivartikel und die wichtigsten Präpositionen',
                'Täglich eine kurze Hörübung auf A1-Niveau, im normalen Sprechtempo',
              ],
              tip: 'Wortschatz, der aus der offiziellen Liste stammt, deckt die Prüfung ab. Wortschatz aus einer generischen App-Lektion tut das nicht zuverlässig.',
            },
            {
              label: 'Woche 5–7',
              title: 'Die vier Aufgabentypen einzeln trainieren',
              tasks: [
                'Formulare mit unterschiedlichen Feldtypen ausfüllen üben, unter Zeitdruck',
                'Kurze Mitteilungen schreiben: Anrede, alle 3 Leitpunkte, passender Gruß, ca. 30 Wörter',
                'Informationen mit Wortkarten erfragen und geben, laut, mit Partner oder KI',
                'Bitten formulieren und darauf reagieren anhand von Bildkarten',
              ],
              tip: 'Diese vier Aufgabentypen entscheiden über Bestehen — nicht allgemeines „Deutschkönnen“. Wer nur mit einer Lern-App übt, hat oft nie eine echte Mitteilung geschrieben oder eine Bitte mit Bildkarte geübt.',
            },
            {
              label: 'Woche 8',
              title: 'Erster kompletter Modelltest',
              tasks: [
                'Einen offiziellen Modellsatz komplett unter Zeitlimit durcharbeiten',
                'Ergebnis pro Teil notieren und mit der 60-Punkte-Grenze vergleichen',
                'Das schwächste Ergebnis identifizieren und in den Rest der Vorbereitung priorisieren',
              ],
              tip: 'Nach acht Wochen aus dem Nichts ist ein Ergebnis unter 60 normal, kein Grund zur Sorge. Die verbleibende Zeit ist genau dafür da.',
            },
            {
              label: 'Woche 9–11',
              title: 'Gezielt die Lücke schließen',
              tasks: [
                'Wöchentlich einen weiteren Modelltest, im Wechsel mit dem zweiten offiziellen Übungssatz',
                'Sprechen jeden Tag laut üben, nicht nur im Kopf formulieren',
                'Eigene Mitteilungen korrigieren lassen: Anrede, Leitpunkte, Verbstellung',
                'Hörverstehen: gezielt an Teil 2 (nur einmal vorgespielt) arbeiten',
              ],
              tip: 'Sprechen im Kopf trainiert nicht dasselbe wie lautes Sprechen — in der Gruppenprüfung fehlen sonst Tempo und Reaktionsfähigkeit.',
            },
            {
              label: 'Woche 12',
              title: 'Generalprobe und Prüfungslogistik',
              tasks: [
                'Einen letzten Modelltest komplett unter echten Zeitbedingungen',
                'Keine neuen Themen mehr — nur festigen, was schon sitzt',
                'Anmeldebestätigung, Ausweisdokument und Anfahrt zum Prüfungszentrum klären',
                'Am Vortag früh aufhören und schlafen statt bis spät zu pauken',
              ],
              tip: 'Wer den Ablauf am Prüfungstag schon kennt, verliert dort keine Konzentration an die Situation selbst.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die häufigsten Fehler bei Start Deutsch 1',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: '„Deutsch lernen“ statt die Prüfung üben',
              body: 'Wer sich vorbereitet, als müsste er frei Deutsch sprechen können, übersieht, dass Start Deutsch 1 vier feste Aufgabentypen prüft. Wer diese Typen — Formular, Mitteilung, Wortkarten, Bildkarten — nie im Original geübt hat, verliert Punkte durch Überraschung, nicht durch fehlendes Deutsch.',
            },
            {
              title: 'Die offizielle Wortliste nicht kennen',
              body: 'Viele erfahren erst kurz vor dem Termin, dass es eine offizielle A1-Wortliste gibt. Wer stattdessen mit zufälligem Vokabular aus einer App lernt, deckt die Prüfung schlechter ab, obwohl die Lernzeit gleich groß war.',
            },
            {
              title: 'Sprechen ohne Partner nur im Kopf üben',
              body: 'Die Gruppenprüfung verlangt spontane Reaktion auf andere Personen. Wer nie laut mit jemandem gesprochen hat, wirkt in der Prüfung langsamer und unsicherer, als der eigene Wortschatz es eigentlich zulassen würde.',
            },
            {
              title: 'Schreiben als Nebensache behandeln',
              body: 'Die kurze Mitteilung wirkt einfach, verlangt aber alle drei Leitpunkte, eine passende Anrede und einen passenden Gruß. Wer einen Leitpunkt auslässt oder den Ton verfehlt, verliert dort mehr Punkte als durch mehrere kleine Grammatikfehler zusammen.',
            },
            {
              title: 'Zu spät mit der Anmeldung beginnen',
              body: 'Wenn ein Visatermin feststeht, ist die Prüfung der Flaschenhals, nicht das Lernen. Prüfungszentren sind in manchen Ländern über Wochen ausgebucht — die Anmeldung gehört an den Anfang der Vorbereitung, nicht ans Ende.',
            },
          ],
        },
      ],
    },
    {
      id: 'deutschmeister',
      heading: 'Wie Deutschmeister bei Start Deutsch 1 hilft',
      blocks: [
        {
          type: 'p',
          text: 'Start Deutsch 1 prüft vier konkrete Fertigkeiten mit festen Aufgabentypen. Genau dafür lässt sich gezielt üben — mit einer Plattform, die von einem Team von Ärzten in Deutschland gebaut wurde, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Sprechen',
              title: 'KI-Sprechtraining',
              body: 'Vorstellen und buchstabieren, Informationen erfragen, Bitten formulieren — jeden Tag laut üben, ohne Termin und ohne Partner, mit sofortigem Feedback.',
            },
            {
              eyebrow: 'Hören',
              title: 'Hörübungen ab A1',
              body: 'Kurze Dialoge und Durchsagen von Muttersprachlern im normalen Tempo — genau die Textsorten, an denen Start Deutsch 1 Teil 2 sich orientiert.',
            },
            {
              eyebrow: 'Schreiben',
              title: 'KI-Schreibtraining',
              body: 'Formulare und kurze Mitteilungen schreiben und sofort korrigiert bekommen: Leitpunkte, Anrede, Verbstellung — an den eigenen Sätzen erklärt.',
            },
            {
              eyebrow: 'Grammatik',
              title: 'A1-Grammatik auf Englisch erklärt',
              body: 'Die Strukturen, die in allen vier Prüfungsteilen vorkommen, Schritt für Schritt aufgebaut — mit dem Sentence X-Ray, das eigene Sätze in Wortarten und Fälle zerlegt.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Startpunkt ist immer der <a href="/level-test/">Einstufungstest</a>, danach die <a href="/grammar/a1.1/">A1.1-Grammatik</a>. Wie sich das gegen andere A1-Angebote schlägt, steht im <a href="/vergleich/">Vergleich</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Ist Start Deutsch 1 dasselbe wie das Goethe-Zertifikat A1?',
      a: 'Ja. Start Deutsch 1 wurde gemeinsam von Goethe-Institut und telc entwickelt und ist inhaltlich sowie im Format identisch. Beim Goethe-Institut trägt das Zertifikat den Namen „Goethe-Zertifikat A1: Start Deutsch 1“, telc stellt sein eigenes Zertifikat aus. Für den Ehegattennachzug werden beide anerkannt.',
    },
    {
      q: 'Wie viele Punkte braucht man bei Start Deutsch 1?',
      a: 'Insgesamt sind 100 Punkte erreichbar, bestanden ist die Prüfung ab 60 Punkten. Es gibt keine Mindestpunktzahl pro Teil, aber auch keine Module — wer unter 60 Punkten bleibt, muss bei der Wiederholung alle vier Teile erneut ablegen.',
    },
    {
      q: 'Reicht Start Deutsch 1 für den Ehegattennachzug?',
      a: 'Für den Sprachnachweis im Rahmen des Ehegattennachzugs verlangt das Aufenthaltsgesetz (§ 28 bzw. § 30 AufenthG) „einfache Deutschkenntnisse“ auf Niveau A1, und ein Zeugnis von Goethe-Institut, telc oder ÖSD wird dafür anerkannt. Ob im Einzelfall weitere Unterlagen nötig sind und welche Ausnahmen gelten, klärt die zuständige deutsche Auslandsvertretung — sie entscheidet über den konkreten Antrag, nicht diese Seite.',
    },
    {
      q: 'Wie lange dauert die Vorbereitung von null auf A1?',
      a: 'Sprachschulen und das Goethe-Institut rechnen mit insgesamt etwa 60–80 Lernstunden à 60 Minuten bis A1, davon rund 25–30 Stunden reine Prüfungsphase am Ende. Bei täglich 45–60 Minuten Lernzeit sind das realistisch 8 bis 12 Wochen. Wer eine Sprache mit einem anderen Schriftsystem spricht, sollte für dieselbe Stundenzahl etwa die doppelte Zeit einplanen, weil Lesen und Schreiben im lateinischen Alphabet zusätzlich automatisiert werden müssen.',
    },
    {
      q: 'Kann man Start Deutsch 1 beliebig oft wiederholen?',
      a: 'Ja, es gibt keine Begrenzung der Versuche. Da die Prüfung nicht modular ist, wird bei jeder Wiederholung die komplette Prüfung erneut abgelegt, auch wenn beim letzten Mal nur ein Teil schwach war.',
    },
    {
      q: 'Wo finde ich offizielles Übungsmaterial für Start Deutsch 1?',
      a: 'Das Goethe-Institut stellt kostenlose Modellsätze mit Audiodateien, ein Beispielvideo zum Sprechteil sowie die offizielle A1-Wortliste zum Download bereit. Das ist das zuverlässigste Material, weil es exakt Format und Niveau der echten Prüfung zeigt.',
    },
    {
      q: 'Was wird im Sprechteil genau geprüft?',
      a: 'Der Sprechteil läuft in der Gruppe (bis zu 4 Personen) ohne Vorbereitungszeit und dauert etwa 15 Minuten: sich mit Name, Alter, Land, Wohnort, Sprachen, Beruf und Hobby vorstellen sowie einen Namen und eine Telefonnummer nennen/buchstabieren, Informationen mit Wortkarten erfragen und geben, und Bitten anhand von Bildkarten formulieren und darauf reagieren.',
    },
    {
      q: 'Zählt ein Deutschmeister-Zertifikat für die Botschaft?',
      a: 'Nein. Für Visumzwecke zählt ausschließlich ein Zeugnis von Goethe-Institut, telc oder ÖSD. Deutschmeister bereitet gezielt auf genau diese Prüfung vor, ersetzt sie aber nicht — den offiziellen Termin buchst du direkt beim Prüfungszentrum.',
    },
  ],

  cta: {
    heading: 'Finde heraus, wo du vor Start Deutsch 1 stehst',
    body: 'Der Einstufungstest zeigt dir in wenigen Minuten deinen Ausgangspunkt — danach weißt du, wie viel der 8–12 Wochen du wirklich brauchst.',
  },
};
