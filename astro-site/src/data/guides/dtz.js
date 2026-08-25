// Deutsch-Test für Zuwanderer (DTZ) — written 2026-08-22.
//
// FACT SOURCING: the durations below (Hören ca. 25, Lesen 45, Schreiben 30, in
// total 100 Minuten schriftlich; mündlich Paarprüfung ca. 16 Minuten) come from
// exam-centre and publisher descriptions of the official format; gast.de and
// bamf.de could not be fetched from this environment.
//
// THE SCALED RESULT IS STATED CAREFULLY ON PURPOSE. The DTZ reports a level per
// skill area rather than a single pass mark, and secondary sources describe the
// combination rule inconsistently. This guide therefore explains the mechanism —
// every part is rated A2 or B1, and the certificate shows those ratings — and
// sends the reader to the Prüfungszentrum or BAMF for the exact rule that
// applies to their case, instead of asserting a threshold that might be wrong.
// A wrong claim here would affect somebody's residence paperwork.

export const dtz = {
  slug: 'dtz',
  title: 'DTZ Prüfung: Ablauf & Vorbereitung | DeutschMeister',
  h1: 'Deutsch-Test für Zuwanderer (DTZ): Ablauf und Vorbereitung',
  description:
    'DTZ verstehen: skalierte Prüfung auf A2 und B1 gleichzeitig, Ablauf der vier Teile, Lernplan und was das Ergebnis für dich bedeutet.',
  keywords:
    'DTZ Prüfung, Deutsch-Test für Zuwanderer, DTZ A2 B1, DTZ Ablauf, DTZ Vorbereitung, Integrationskurs Abschlussprüfung',
  badge: 'Leitfaden',
  lead:
    'Der <strong>Deutsch-Test für Zuwanderer</strong> ist die Abschlussprüfung des Integrationskurses — und funktioniert anders als telc oder Goethe. Er ist <strong>skaliert</strong>: Du bestehst ihn nicht einfach oder fällst durch, sondern bekommst pro Prüfungsteil ein Ergebnis auf A2- oder B1-Niveau. Dieser Leitfaden erklärt, was das praktisch heißt, wie die Prüfung abläuft und wie du dich gezielt vorbereitest.',
  datePublished: '2026-08-22',
  answer:
    'Der Deutsch-Test für Zuwanderer (DTZ) ist skaliert: Er prüft A2 und B1 gleichzeitig und weist für jeden Prüfungsteil einzeln aus, welches Niveau du erreicht hast. Ein Bestehen oder Durchfallen im üblichen Sinn gibt es deshalb nicht. Der schriftliche Teil dauert insgesamt rund 100 Minuten, die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten.',
  factsCheckedOn: '2026-08-22',
  sources: [
    { label: 'BAMF — Integrationskurse', url: 'https://www.bamf.de/' },
    { label: 'g.a.s.t. / telc — DTZ', url: 'https://www.gast.de/' },
  ],

  sections: [
    {
      id: 'was-ist-dtz',
      heading: 'Was ist der DTZ — und für wen?',
      blocks: [
        {
          type: 'p',
          text: 'Der Deutsch-Test für Zuwanderer (DTZ) ist die Sprachprüfung am Ende des Integrationskurses. Er richtet sich an Zugewanderte, die ihre Deutschkenntnisse für Aufenthalt, Einbürgerung oder den Abschluss des Kurses nachweisen müssen.',
        },
        {
          type: 'p',
          text: 'Wer einen Integrationskurs besucht, legt den DTZ üblicherweise am Kursende ab. Die Teilnahme ist auch ohne Kurs möglich, die Anmeldung läuft dann über ein Prüfungszentrum.',
        },
        {
          type: 'p',
          text: 'Inhaltlich ist der DTZ auf den Alltag in Deutschland zugeschnitten: Wohnen, Arbeit, Ämter, Gesundheit, Kinderbetreuung. Die Aufgaben sind bewusst praxisnah — es geht um Situationen, die tatsächlich vorkommen.',
        },
      ],
    },
    {
      id: 'skaliert',
      heading: 'Skaliert statt bestanden: der entscheidende Unterschied',
      blocks: [
        {
          type: 'p',
          text: 'Bei <a href="/leitfaden/telc-b1/">telc B1</a> oder dem <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> gibt es eine Grenze: 60 % erreicht — bestanden. Der DTZ funktioniert anders. Er prüft <strong>A2 und B1 gleichzeitig</strong> und bewertet jeden Bereich auf der Skala. Im Zeugnis steht dann pro Bereich, welches Niveau du erreicht hast.',
        },
        {
          type: 'p',
          text: 'Praktisch heißt das: Du kannst im Hören B1 erreichen und im Schreiben A2. Beides steht im Ergebnis. Es gibt kein „durchgefallen" im üblichen Sinn — es gibt ein Ergebnis, das für manche Zwecke ausreicht und für andere nicht.',
        },
        {
          type: 'p',
          text: 'Welches Gesamtergebnis für deinen Zweck nötig ist — Einbürgerung, Aufenthaltstitel, Kursabschluss — hängt vom Einzelfall ab, und die Regeln dazu ändern sich. <strong>Kläre das vor der Prüfung mit deinem Prüfungszentrum, deinem Kursträger oder der zuständigen Behörde</strong>, nicht danach.',
        },
        {
          type: 'callout',
          text: 'Weil das Ergebnis pro Bereich ausgewiesen wird, lohnt sich die Vorbereitung dort am meisten, wo du knapp unter B1 liegst. Ein Bereich, der sicher auf B1 ist, bringt durch weiteres Üben nichts Zusätzliches.',
        },
      ],
    },
    {
      id: 'ablauf',
      heading: 'Der Ablauf der DTZ Prüfung',
      blocks: [
        {
          type: 'p',
          text: 'Der DTZ besteht aus einem schriftlichen und einem mündlichen Teil. Der schriftliche Teil dauert insgesamt rund 100 Minuten, der mündliche wird als Paarprüfung abgenommen.',
        },
        {
          type: 'table',
          head: ['Prüfungsteil', 'Was wird geprüft?', 'Dauer'],
          rows: [
            ['Hören', 'Ansagen, Telefonate, kurze Gespräche und Durchsagen aus dem Alltag', 'ca. 25 Min.'],
            ['Lesen', 'Anzeigen, Formulare, Briefe von Ämtern, kurze Zeitungstexte', 'ca. 45 Min.'],
            ['Schreiben', 'Einen Alltagsbrief oder eine E-Mail verfassen', 'ca. 30 Min.'],
            ['Sprechen', 'Paarprüfung: sich vorstellen, über Erfahrungen sprechen, gemeinsam planen', 'ca. 16 Min.'],
          ],
        },
        {
          type: 'p',
          text: 'Die Zeiten sind Richtwerte des üblichen Prüfungsformats; die verbindlichen Angaben bekommst du von deinem Prüfungszentrum.',
        },
        { type: 'h3', text: 'Der mündliche Teil im Detail' },
        {
          type: 'p',
          text: 'Die mündliche Prüfung hat drei Abschnitte: Du stellst dich vor und beantwortest Fragen zur Person. Danach sprichst du über ein Thema anhand eines Bildes oder einer Situation. Zum Schluss plant ihr zu zweit etwas gemeinsam — einen Ausflug, ein Fest, einen Termin.',
        },
        {
          type: 'p',
          text: 'Bewertet wird, ob du verständlich kommunizierst und auf deinen Partner eingehst — nicht, ob jeder Satz fehlerfrei ist. Das <a href="/speaking/">KI-Sprechtraining</a> hilft, genau diese Situationen zu üben, wenn im Alltag die Gelegenheit zum Sprechen fehlt.',
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ein 6-Wochen-Lernplan für den DTZ',
      blocks: [
        {
          type: 'p',
          text: 'Dieser Plan richtet sich an Teilnehmende gegen Ende eines Integrationskurses oder mit solidem A2. Er setzt 30–45 Minuten täglich voraus und legt den Schwerpunkt auf Alltagsthemen, weil der DTZ genau die prüft.',
        },
        {
          type: 'p',
          text: 'Vorab: Der <a href="/level-test/">kostenlose Einstufungstest</a> zeigt dir, wo du stehst — hilfreich, weil beim DTZ jeder Bereich einzeln zählt.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1',
              title: 'Standort bestimmen',
              tasks: [
                'Einstufungstest machen und Ergebnis pro Fertigkeit notieren',
                'Je eine Übungsaufgabe zu Hören, Lesen und Schreiben bearbeiten',
                'Ehrlich einschätzen: Welcher Bereich liegt noch klar auf A2?',
                'Lernzeit auf die schwächsten Bereiche verteilen',
              ],
              tip: 'Weil das Zeugnis pro Bereich ausweist, ist diese Aufteilung wichtiger als beim DTZ oft angenommen wird.',
            },
            {
              label: 'Woche 2',
              title: 'Alltagswortschatz aufbauen',
              tasks: [
                'Themenfelder gezielt lernen: Wohnung, Arbeit, Behörde, Arzt, Schule',
                'Formulare und Amtsbriefe lesen üben — die Sprache ist eigen',
                'Wichtige Redemittel für Termine, Beschwerden und Nachfragen',
                'Täglich eine kurze Hörübung',
              ],
              tip: 'Der DTZ prüft Alltagssprache, nicht Literatur. Wortschatz aus dem echten Leben bringt hier mehr als Prüfungsvokabellisten.',
            },
            {
              label: 'Woche 3',
              title: 'Schreiben trainieren',
              tasks: [
                'Zwei Briefe pro Woche: Beschwerde, Terminanfrage, Entschuldigung',
                'Anrede und Schlussformel sicher beherrschen — formell und informell',
                'Auf klare Struktur achten: Anlass, Anliegen, Bitte',
                'Eigene Texte korrigieren lassen oder mit dem Sentence X-Ray prüfen',
              ],
              tip: 'Ein kurzer, klar gegliederter Brief ohne Fehler ist besser bewertet als ein langer mit komplizierten Sätzen.',
            },
            {
              label: 'Woche 4',
              title: 'Hören und Lesen unter Zeit',
              tasks: [
                'Hörübungen mit Durchsagen, Telefonaten, Ansagen',
                'Lesen mit Stoppuhr: erst die Aufgabe, dann den Text',
                'Üben, gezielt Informationen zu finden statt alles zu verstehen',
                'Zahlen, Uhrzeiten und Daten im Hören sicher erfassen',
              ],
              tip: 'Beim Hören kommen Zahlen und Termine besonders oft vor. Sie gezielt zu üben lohnt sich messbar.',
            },
            {
              label: 'Woche 5',
              title: 'Sprechen, jeden Tag',
              tasks: [
                'Sich selbst vorstellen — flüssig, ohne nachzudenken',
                'Über ein Bild oder eine Situation sprechen üben',
                'Gemeinsames Planen üben: Vorschlag machen, zustimmen, ablehnen',
                'Täglich mindestens 10 Minuten laut sprechen',
              ],
              tip: 'Sprechen ist der Bereich, in dem Übung am schnellsten sichtbar wird — und der am häufigsten aufgeschoben wird.',
            },
            {
              label: 'Woche 6',
              title: 'Generalprobe',
              tasks: [
                'Kompletten schriftlichen Teil am Stück üben',
                'Mündliche Prüfung mit Partner oder KI durchspielen',
                'Nur wiederholen, keine neuen Themen',
                'Prüfungstag organisieren: Unterlagen, Anfahrt, Zeitpuffer',
              ],
              tip: 'Am Prüfungstag hilft Routine mehr als letztes Lernen. Wer weiß, wie der Ablauf ist, verliert weniger Konzentration an die Situation.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die häufigsten Fehler beim DTZ',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Denken, es gäbe nur bestanden oder nicht bestanden',
              body: 'Der DTZ ist skaliert. Wer das nicht weiß, bereitet sich vor wie auf eine Pass-or-fail-Prüfung und verteilt die Lernzeit gleichmäßig — statt dort zu investieren, wo das Ergebnis noch zwischen A2 und B1 kippen kann.',
            },
            {
              title: 'Erst nach der Prüfung klären, was verlangt wird',
              body: 'Welches Ergebnis für Einbürgerung, Aufenthalt oder Kursabschluss reicht, hängt vom Einzelfall ab. Diese Frage vor der Anmeldung mit der zuständigen Stelle zu klären, erspart im schlechtesten Fall eine zweite Prüfung.',
            },
            {
              title: 'Amtsdeutsch nicht üben',
              body: 'Der DTZ enthält Briefe von Behörden, Formulare und Anzeigen. Diese Sprache ist eigen und begegnet Lernenden im Kursbuch selten. Wer sie nie gelesen hat, verliert im Lesen Zeit und Punkte.',
            },
            {
              title: 'Sprechen nur im Kurs üben',
              body: 'Die Kursstunden reichen für den mündlichen Teil meist nicht aus, weil die Redezeit pro Person klein ist. Zehn Minuten tägliches freies Sprechen verändern diesen Bereich mehr als zusätzliche Grammatikübungen.',
            },
            {
              title: 'Beim Schreiben zu kompliziert werden',
              body: 'Manche versuchen, mit langen Nebensatzketten Niveau zu zeigen, und produzieren dabei Fehler. Bewertet wird, ob dein Anliegen klar ankommt. Einfache, korrekte Sätze mit passender Anrede schneiden besser ab.',
            },
          ],
        },
      ],
    },
    {
      id: 'deutschmeister',
      heading: 'Wie Deutschmeister beim DTZ hilft',
      blocks: [
        {
          type: 'p',
          text: 'Der DTZ prüft Alltagssprache in vier Bereichen, die einzeln bewertet werden. Genau dafür lässt sich gezielt üben — mit einer Plattform, die von einem Team von Ärzten in Deutschland gebaut wurde, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Sprechen',
              title: 'KI-Sprechtraining',
              body: 'Vorstellen, über eine Situation sprechen, gemeinsam planen — jeden Tag, ohne Termin und ohne Partner, mit sofortigem Feedback.',
            },
            {
              eyebrow: 'Hören',
              title: 'Hörübungen ab A1',
              body: 'Alltagsdialoge und Durchsagen von Muttersprachlern, nach Niveau geordnet — genau die Textsorten, die im DTZ vorkommen.',
            },
            {
              eyebrow: 'Schreiben',
              title: 'Grammatik + Sentence X-Ray',
              body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das deine eigenen Sätze zerlegt und zeigt, wo der Fehler steckt.',
            },
            {
              eyebrow: 'Lesen',
              title: 'Lesetexte ab A1',
              body: 'Kurze Texte mit steigender Länge, damit Lesen unter Zeitdruck vertraut wird.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Für den Sprung auf sicheres B1 lohnt sich zusätzlich die <a href="/grammar/b1.1/">B1-Grammatik</a>. Wenn du nach dem DTZ gezielt ein B1-Zertifikat brauchst, findest du im <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a> den nächsten Schritt.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Was ist der DTZ?',
      a: 'Der Deutsch-Test für Zuwanderer ist die Abschlussprüfung des Integrationskurses. Er prüft die Niveaus A2 und B1 gleichzeitig und weist im Zeugnis pro Bereich aus, welches Niveau erreicht wurde.',
    },
    {
      q: 'Kann man beim DTZ durchfallen?',
      a: 'Der DTZ ist skaliert: Statt bestanden oder nicht bestanden bekommst du ein Ergebnis auf A2- oder B1-Niveau je Bereich. Ob dieses Ergebnis für deinen Zweck ausreicht — Einbürgerung, Aufenthalt, Kursabschluss —, entscheidet die zuständige Stelle. Kläre das vorher.',
    },
    {
      q: 'Wie lange dauert die DTZ Prüfung?',
      a: 'Der schriftliche Teil dauert insgesamt rund 100 Minuten (Hören ca. 25, Lesen ca. 45, Schreiben ca. 30 Minuten). Die mündliche Prüfung wird als Paarprüfung abgenommen und dauert etwa 16 Minuten. Verbindliche Angaben bekommst du von deinem Prüfungszentrum.',
    },
    {
      q: 'Ist der DTZ leichter als telc B1?',
      a: 'Er ist anders. Der DTZ prüft A2 und B1 gleichzeitig, sodass ein Ergebnis unterhalb von B1 nicht automatisch ein Scheitern ist. telc B1 und Goethe B1 prüfen ausschließlich auf B1 mit einer festen Bestehensgrenze. Wenn du gezielt einen B1-Nachweis brauchst, ist eine reine B1-Prüfung der direktere Weg.',
    },
    {
      q: 'Kann ich den DTZ ohne Integrationskurs machen?',
      a: 'Ja, eine Anmeldung ist auch ohne Kursteilnahme über ein Prüfungszentrum möglich. Ob und wie oft eine Wiederholung gefördert wird, hängt von deiner Kursberechtigung ab — das klärt dein Kursträger oder das BAMF.',
    },
    {
      q: 'Wie oft kann man den DTZ wiederholen?',
      a: 'Eine Wiederholung ist möglich; bei geförderten Integrationskursen gelten dafür eigene Regeln, die sich ändern können. Die für dich gültigen Bedingungen nennt dir dein Kursträger oder das BAMF.',
    },
    {
      q: 'Welche Themen kommen im DTZ vor?',
      a: 'Alltag in Deutschland: Wohnen, Arbeit und Bewerbung, Behörden und Formulare, Gesundheit und Arztbesuche, Schule und Kinderbetreuung, Einkaufen und Freizeit.',
    },
    {
      q: 'Was kostet der DTZ?',
      a: 'Für Teilnehmende an geförderten Integrationskursen ist die Prüfung in der Regel Teil des Kurses. Bei separater Anmeldung setzt das Prüfungszentrum die Gebühr fest — frag dort nach dem aktuellen Preis.',
    },
  ],

  cta: {
    heading: 'Finde heraus, wo du stehst',
    body: 'Der Einstufungstest zeigt dir dein Niveau pro Fertigkeit — beim DTZ zählt genau das.',
  },
};
