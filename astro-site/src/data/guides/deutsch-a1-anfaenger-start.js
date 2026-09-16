// „Deutsch lernen als Anfänger: womit anfangen?" — organic launch week 1
// (docs/marketing/a11-organic-launch-calendar.md; plan
// docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md Task 5).
//
// WHY THIS IS A DATA MODULE AND NOT A PAGE. The plan lists four .astro files
// under pages/leitfaden/. CLAUDE.md forbids that shape — „Leitfäden are data,
// not pages" — so the four articles are guide modules rendered by
// pages/leitfaden/[slug].astro, registered in ./index.js and listed in
// scripts/check-built-html.mjs. Nothing in netlify.toml or the sitemap config
// changes, which is the whole point of the registry.
//
// SEARCH INTENT: a complete beginner typing „Deutsch lernen anfangen“ /
// „womit fange ich an Deutsch“. They do not want a syllabus, they want to know
// what the FIRST week looks like and whether they are doing it wrong. The
// article answers that fully and only then mentions that the same first week
// exists as a free guided lesson.
//
// FACT DISCIPLINE. The only exam facts asserted here are the A1 format and the
// Goethe learning-hours Richtwert; both carry sources and factsCheckedOn, and
// both already appear in start-deutsch-1.js — the figures are taken from the
// same documents, not re-derived. No fees, no pass promises, no learner counts.
// Nothing about our own product that is not measured elsewhere in the repo.

export const deutschA1AnfaengerStart = {
  slug: 'deutsch-a1-anfaenger-start',
  title: 'Deutsch lernen als Anfänger: der erste Monat',
  h1: 'Deutsch lernen als absoluter Anfänger: womit du wirklich anfängst',
  description:
    'Wie du als Erwachsener ohne Vorkenntnisse mit Deutsch anfängst: die ersten vier Wochen, was zuerst kommt, was warten kann — und eine Übung für heute.',
  keywords:
    'Deutsch lernen Anfänger, Deutsch A1 anfangen, Deutsch lernen ohne Vorkenntnisse, Deutsch Grundlagen, A1.1 Deutsch',
  badge: 'Leitfaden',
  lead:
    'Die schwierigste Frage beim Deutschlernen kommt vor der ersten Vokabel: <strong>womit anfangen?</strong> Zwischen Grammatik-Apps, YouTube-Kursen und Lehrbüchern verlieren die meisten Erwachsenen ihre ersten zwei Wochen mit der Suche nach dem richtigen Material statt mit Deutsch. Dieser Leitfaden zeigt dir eine Reihenfolge, die funktioniert — und warum sie mit Situationen beginnt, nicht mit Grammatik.',
  datePublished: '2026-09-16',
  answer:
    'Fang mit Situationen an, nicht mit Grammatik. In den ersten vier Wochen brauchst du vier Dinge: die Laute und das Buchstabieren des Alphabets, eine Vorstellung deiner Person in fünf Sätzen, die Zahlen bis 100 und rund 200 Wörter aus deinem eigenen Alltag. Die Grammatik kommt in jeder dieser Situationen mit — sein, die Artikel der/die/das und das Präsens lernst du an Sätzen, die du am selben Tag benutzt. Plane 15 bis 20 Minuten täglich statt zwei Stunden am Wochenende: Deutsch belohnt Wiederholung, nicht Ausdauer.',
  factsCheckedOn: '2026-09-03',
  sources: [
    { label: 'Goethe-Institut — Start Deutsch 1 (Prüfungsformat)', url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd1.html' },
    { label: 'Goethe-Institut — Prüfungsziele/Testbeschreibung A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf' },
    { label: 'Goethe-Institut — Wortliste A1', url: 'https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf' },
  ],

  sections: [
    {
      id: 'reihenfolge',
      heading: 'Die Reihenfolge, die im ersten Monat funktioniert',
      blocks: [
        {
          type: 'p',
          text: 'Wer „Deutsch lernen“ googelt, landet fast immer bei einer Grammatiktabelle. Das ist der Grund, warum so viele Anfänger nach drei Wochen die vier Fälle aufsagen können, aber im Bäckerladen schweigen. Die Reihenfolge unten dreht das um: Du lernst jede Woche eine <strong>Situation</strong>, und die Grammatik ist der Teil, der diese Situation möglich macht.',
        },
        {
          type: 'table',
          head: ['Woche', 'Situation', 'Grammatik, die dazugehört'],
          rows: [
            ['1', 'Begrüßen, sich vorstellen, den Namen buchstabieren', 'Alphabet und Aussprache'],
            ['2', 'Woher du kommst, was du von Beruf bist, Zahlen', 'das Verb sein'],
            ['3', 'Über deine Familie und deine Sprachen sprechen', 'Personalpronomen (ich, du, er, sie …)'],
            ['4', 'Dinge benennen und nach dem Preis fragen', 'Nomen mit Genus, der/die/das'],
          ],
        },
        {
          type: 'p',
          text: 'Jede Zeile ist ein abgeschlossenes Können, kein Kapitel. Nach Woche 1 kannst du dich vorstellen und deinen Namen buchstabieren — das ist zufällig auch die erste Aufgabe im Sprechteil der A1-Prüfung. Nach Woche 4 kannst du fragen, was etwas ist und was es kostet.',
        },
        {
          type: 'callout',
          text: 'Wenn du dich zwischen zwei Materialien nicht entscheiden kannst: Nimm das, mit dem du heute anfangen kannst. Die Entscheidung kostet mehr Lernzeit als der Unterschied zwischen den beiden.',
        },
      ],
    },
    {
      id: 'aussprache',
      heading: 'Warum die Aussprache zuerst kommt',
      blocks: [
        {
          type: 'p',
          text: 'Deutsch wird fast so gesprochen, wie es geschrieben wird — anders als Englisch oder Französisch. Wer die Regeln einmal hört, liest danach jedes neue Wort korrekt vor. Das ist eine Stunde Arbeit mit einem Effekt, der einen ganzen Kurs lang hält.',
        },
        {
          type: 'list',
          items: [
            '<strong>ä, ö, ü</strong> sind keine Dekoration: <em>schon</em> und <em>schön</em> sind zwei verschiedene Wörter.',
            '<strong>ei</strong> klingt wie „ai“ (mein, kein), <strong>ie</strong> wie ein langes „i“ (die, Sie). Diese zwei zu verwechseln ist der häufigste Anfängerfehler beim Vorlesen.',
            '<strong>sch</strong>, <strong>sp-</strong> und <strong>st-</strong> am Wortanfang klingen alle nach „sch“: <em>Sprechen</em>, <em>Stadt</em>.',
            '<strong>v</strong> klingt meist wie „f“ (Vater), <strong>w</strong> wie ein englisches „v“ (Wasser).',
            '<strong>z</strong> ist immer „ts“ (Zahl, zehn) — nie ein englisches „z“.',
          ],
        },
        {
          type: 'p',
          text: 'Buchstabieren gehört direkt dazu. In Deutschland wirst du deinen Namen buchstabieren müssen — beim Arzt, bei der Anmeldung, am Telefon. Die Regeln und Beispiele dazu stehen in der kostenlosen Lektion <a href="/grammar/a1.1/alphabet-pronunciation/">Alphabet und Aussprache</a>.',
        },
      ],
    },
    {
      id: 'uebung',
      heading: 'Übung für heute: deine fünf Sätze',
      blocks: [
        {
          type: 'p',
          text: 'Diese Übung dauert zehn Minuten und ist der Kern von Woche 1. Schreibe fünf Sätze über dich auf — genau diese fünf, in dieser Reihenfolge — und sprich sie danach dreimal laut aus. Sie sind das Gerüst für jedes erste Gespräch auf Deutsch.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Satz 1–2',
              title: 'Name und Herkunft',
              tasks: [
                'Hallo, ich heiße ______ . (Vorname)',
                'Ich komme aus ______ . (Land)',
              ],
              tip: 'Sprich den Namen danach einmal Buchstabe für Buchstabe: „C-H-A-K-I-R-I“. Genau so wirst du in Deutschland gefragt.',
            },
            {
              label: 'Satz 3–4',
              title: 'Wohnort und Beruf',
              tasks: [
                'Ich wohne in ______ . (Stadt)',
                'Ich bin ______ von Beruf. (oder: Ich bin Student / Studentin.)',
              ],
              tip: 'Deutsch verwendet beim Beruf keinen Artikel: „Ich bin Lehrer“, nicht „ein Lehrer“. Das ist einer der wenigen Punkte, an denen Deutsch einfacher ist als Englisch.',
            },
            {
              label: 'Satz 5',
              title: 'Sprachen',
              tasks: [
                'Ich spreche ______ und ein bisschen Deutsch.',
              ],
              tip: '„Ein bisschen“ ist der nützlichste Ausdruck deiner ersten Woche — er lädt dein Gegenüber ein, langsamer zu sprechen.',
            },
          ],
        },
        {
          type: 'callout',
          text: 'Kontrolle: Sprich die fünf Sätze ohne Pause und ohne auf das Blatt zu sehen. Geht das, hast du das Ziel von Woche 1 erreicht — unabhängig davon, wie viele Vokabeln du kennst.',
        },
      ],
    },
    {
      id: 'zeit',
      heading: 'Wie viel Zeit A1 wirklich kostet',
      blocks: [
        {
          type: 'p',
          text: 'Das Goethe-Institut rechnet von null bis A1 mit etwa <strong>60–80 Unterrichtseinheiten</strong>, also rund zwei bis drei Monaten bei täglich 20 bis 30 Minuten. A1 besteht aus zwei Hälften: A1.1 (die ersten Situationen: vorstellen, Familie, einkaufen, Uhrzeit) und A1.2 (die zweite Hälfte bis zur vollständigen A1-Prüfung).',
        },
        {
          type: 'p',
          text: 'Wenn deine Muttersprache nicht das lateinische Alphabet nutzt, plane für dieselbe Stundenzahl ungefähr die doppelte Zeit ein. Das liegt nicht an Deutsch, sondern daran, dass Lesen und Schreiben zusätzlich automatisiert werden müssen.',
        },
        {
          type: 'warnings',
          items: [
            {
              title: 'Zwei Stunden am Sonntag statt 20 Minuten täglich',
              body: 'Vokabeln und Satzmuster halten sich über Wiederholungsabstände, nicht über Sitzungslänge. Fünf kurze Tage schlagen einen langen Tag deutlich — auch wenn die Gesamtzeit gleich ist.',
            },
            {
              title: 'Wochenlang nur Wörter lernen',
              body: 'Eine Vokabelliste ohne Satz ist totes Material. Lerne jedes Wort mit einem Satz, den du selbst sagen würdest, sonst fehlt im Gespräch genau die Verbindung.',
            },
            {
              title: 'Nie laut sprechen',
              body: 'Wer nur liest und tippt, trainiert nicht dieselbe Fähigkeit. Sprich jeden neuen Satz einmal laut aus — allein, im Auto, egal wo.',
            },
            {
              title: 'Mit der Prüfungsvorbereitung beginnen',
              body: 'Modelltests sind sinnvoll, wenn schon etwas da ist, das geprüft werden kann. In Woche 1 zeigen sie nur, dass man noch am Anfang steht.',
            },
          ],
        },
      ],
    },
    {
      id: 'material',
      heading: 'Womit du heute anfangen kannst — kostenlos',
      blocks: [
        {
          type: 'p',
          text: 'Auf dieser Seite ist die ganze A1.1-Bibliothek frei zugänglich: Grammatik, Wortschatz, Lese- und Hörübungen. Für den Start reichen drei Seiten:',
        },
        {
          type: 'list',
          items: [
            '<a href="/grammar/a1.1/alphabet-pronunciation/">Alphabet und Aussprache</a> — die Laute und das Buchstabieren, mit Beispielen zum Anhören.',
            '<a href="/grammar/a1.1/verb-sein/">Das Verb „sein“</a> — ich bin, du bist, er ist. Damit stehen deine fünf Sätze.',
            '<a href="/grammar/a1.1/nouns-gender/">Nomen und Genus</a> — warum jedes Nomen der, die oder das ist und wie man es sich merkt.',
          ],
        },
        {
          type: 'p',
          text: 'Dazu passend: die <a href="/reading/">Lesetexte</a> und <a href="/listening/">Hörübungen</a> ab A1.1, beide ohne Konto. Wenn du lieber geführt lernst statt selbst auszuwählen, sind die fünf Sätze von oben genau der Inhalt der ersten Lektion des A1.1-Kurses — <a href="/course/a1.1/l/1?source=organic-guide-start">Lektion 1 kostenlos starten</a>, mit Dialog, Übung, Sprech- und Schreibaufgabe.',
        },
        {
          type: 'p',
          text: 'Und wenn du schon weißt, dass ein Zertifikat das Ziel ist: Der Leitfaden zu <a href="/leitfaden/start-deutsch-1/">Start Deutsch 1</a> erklärt Format und Punkte der A1-Prüfung, bevor du dich anmeldest.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange dauert es, Deutsch auf A1 zu lernen?',
      a: 'Das Goethe-Institut rechnet von null bis A1 mit etwa 60–80 Unterrichtseinheiten. Bei 20 bis 30 Minuten täglich sind das rund zwei bis drei Monate. A1.1, die erste Hälfte, ist entsprechend in etwa einem Monat machbar, wenn du wirklich täglich übst.',
    },
    {
      q: 'Soll ich zuerst Grammatik oder Vokabeln lernen?',
      a: 'Weder noch getrennt. Lerne beides innerhalb einer Situation: Für „sich vorstellen“ brauchst du das Verb sein, die Länder und die Berufe — zusammen sind sie nach einer Woche benutzbar, einzeln bleiben sie Listen.',
    },
    {
      q: 'Brauche ich einen Lehrer, um mit Deutsch anzufangen?',
      a: 'Für A1.1 nicht zwingend. Was du brauchst, ist eine feste Reihenfolge, tägliche Wiederholung und eine Möglichkeit, laut zu sprechen und korrigiert zu werden. Ein Lehrer ist ein Weg dorthin, ein strukturierter Kurs mit Sprech- und Schreibkorrektur ein anderer.',
    },
    {
      q: 'Wie viele Wörter brauche ich am Anfang?',
      a: 'Die offizielle A1-Wortliste umfasst rund 650 Einträge für das ganze Niveau. Für den ersten Monat reichen etwa 200, wenn es die richtigen sind: Begrüßungen, Zahlen, Familie, Berufe, Gegenstände des Alltags, Zeitangaben.',
    },
    {
      q: 'Ist Deutsch schwer für Anfänger?',
      a: 'Die Aussprache ist regelmäßig und damit leichter als im Englischen; schwierig sind die Artikel der/die/das und die Wortstellung. Beides ist Gewöhnungssache und kein Talent: Wer Nomen von Anfang an mit Artikel lernt, umgeht das größte Problem, bevor es entsteht.',
    },
    {
      q: 'Was kommt nach dem ersten Monat?',
      a: 'Die zweite Hälfte von A1 (A1.2) mit Themen wie Wohnen, Einkaufen, Gesundheit und der Vergangenheit — und, wenn ein Zertifikat gebraucht wird, die Vorbereitung auf Start Deutsch 1.',
    },
  ],

  cta: {
    heading: 'Finde heraus, wo du gerade stehst',
    body: 'Der Einstufungstest dauert ein paar Minuten und sagt dir, ob du wirklich bei A1.1 anfängst oder schon weiter bist.',
  },
};
