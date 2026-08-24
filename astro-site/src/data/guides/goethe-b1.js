// Goethe-Zertifikat B1 — written 2026-08-22.
//
// FACT SOURCING. goethe.de is blocked by this environment's egress proxy, so
// the official Durchführungsbestimmungen PDF could not be fetched directly.
// The module structure, per-module durations and the 60-point pass mark below
// come from a web search whose summary cited those official PDFs, corroborated
// across independent exam-centre descriptions. They are the stable, long-
// standing facts of this exam rather than anything volatile.
//
// What is deliberately NOT stated: exam fees (set per centre, change without
// notice), pass rates, and how long a module result stays valid for a
// combination attempt — that last one varies and belongs to the exam centre.
// The page renders `factsCheckedOn` and links goethe.de so a reader can check.

export const goetheB1 = {
  slug: 'goethe-b1',
  title: 'Goethe-Zertifikat B1: Leitfaden 2026 | DeutschMeister',
  h1: 'Goethe-Zertifikat B1: Module, Punkte und Vorbereitung',
  description:
    'Goethe-Zertifikat B1 verstehen: vier Module einzeln ablegbar, 60 Punkte zum Bestehen, 8-Wochen-Lernplan und die häufigsten Fehler.',
  keywords:
    'Goethe Zertifikat B1, Goethe B1 Prüfung, Goethe B1 Module, Goethe B1 bestehen, Goethe B1 Vorbereitung, Deutsch B1 Prüfung',
  badge: 'Leitfaden',
  lead:
    'Das <strong>Goethe-Zertifikat B1</strong> hat eine Eigenschaft, die keine andere große B1-Prüfung so bietet: Du kannst die vier Module einzeln ablegen und einzeln wiederholen. Das ändert die Vorbereitung grundlegend — richtig genutzt, ist es der größte strategische Vorteil dieser Prüfung. Dieser Leitfaden zeigt dir den Aufbau, die Punktegrenzen und einen Lernplan, der die Modulstruktur ausnutzt.',
  datePublished: '2026-08-22',
  answer:
    'Das Goethe-Zertifikat B1 besteht aus vier Modulen: Lesen, Hören, Schreiben und Sprechen. In jedem Modul sind maximal 100 Punkte erreichbar, bestanden ist ein Modul ab 60 Punkten, also 60 %. Die Module lassen sich einzeln ablegen und einzeln wiederholen, und zwischen ihnen wird nicht verrechnet: 95 Punkte im Lesen retten kein Schreiben mit 55 Punkten.',
  factsCheckedOn: '2026-08-22',
  sources: [{ label: 'Goethe-Institut', url: 'https://www.goethe.de/de/spr/prf/gzb1.html' }],

  sections: [
    {
      id: 'ueberblick',
      heading: 'Was ist das Goethe-Zertifikat B1?',
      blocks: [
        {
          type: 'p',
          text: 'Das Goethe-Zertifikat B1 ist die B1-Prüfung des Goethe-Instituts und weist Deutschkenntnisse auf der dritten Stufe des Gemeinsamen Europäischen Referenzrahmens (GER) nach. Es gibt die Prüfung für Erwachsene und für Jugendliche — inhaltlich gleich aufgebaut, aber mit unterschiedlichen Themen.',
        },
        {
          type: 'p',
          text: 'B1 heißt: Du kommst in vertrauten Alltagssituationen zurecht, verstehst die Hauptpunkte, wenn klar und in Standardsprache gesprochen wird, kannst über Erlebnisse berichten und deine Meinung begründen. Für Aufenthaltstitel und Einbürgerung ist B1 die übliche Mindestanforderung.',
        },
        {
          type: 'p',
          text: 'Das Zertifikat ist zeitlich unbegrenzt gültig. Ob eine Behörde oder ein Arbeitgeber einen Nachweis akzeptiert, der älter als ein oder zwei Jahre ist, entscheidet allerdings die jeweilige Stelle — frag dort nach, bevor du dich auf ein altes Zertifikat verlässt.',
        },
      ],
    },
    {
      id: 'module',
      heading: 'Die vier Module — und warum das wichtig ist',
      blocks: [
        {
          type: 'p',
          text: 'Das Goethe-Zertifikat B1 besteht aus vier Modulen: Lesen, Hören, Schreiben und Sprechen. Du kannst sie <strong>alle an einem Termin ablegen oder einzeln</strong>. Jedes Modul wird separat bewertet und separat bescheinigt.',
        },
        {
          type: 'table',
          head: ['Modul', 'Was wird geprüft?', 'Dauer'],
          rows: [
            ['Lesen', 'Anzeigen, E-Mails, Meinungstexte, Anleitungen verstehen', 'ca. 65 Min.'],
            ['Hören', 'Alltagsgespräche, Durchsagen, Radiobeiträge verstehen', 'ca. 40 Min.'],
            ['Schreiben', 'Kurze Mitteilungen und einen längeren Text verfassen', 'ca. 60 Min.'],
            ['Sprechen', 'Paarprüfung: gemeinsam planen und ein Thema präsentieren', 'ca. 15 Min. (plus ca. 15 Min. Vorbereitung)'],
          ],
        },
        {
          type: 'p',
          text: 'Die Modulstruktur ist der eigentliche Unterschied zu <a href="/leitfaden/telc-b1/">telc Deutsch B1</a>, wo schriftlicher und mündlicher Teil als Blöcke geprüft werden und telc zusätzlich „Sprachbausteine" als eigenen Teil hat.',
        },
        {
          type: 'callout',
          text: 'Nutze die Module strategisch: Wenn ein Fertigkeitsbereich klar schwächer ist, leg die drei starken Module zuerst ab und nimm dir für das vierte mehr Zeit. Du wiederholst dann nur dieses eine — nicht die ganze Prüfung.',
        },
      ],
    },
    {
      id: 'punkte',
      heading: 'Wie viele Punkte braucht man zum Bestehen?',
      blocks: [
        {
          type: 'p',
          text: 'In jedem Modul kannst du maximal <strong>100 Punkte</strong> erreichen. Bestanden ist ein Modul ab <strong>60 Punkten</strong>, also 60 %. Diese Grenze gilt für jedes Modul einzeln.',
        },
        {
          type: 'p',
          text: 'Entscheidend und oft missverstanden: <strong>Zwischen den Modulen wird nicht verrechnet.</strong> 95 Punkte im Lesen retten kein Schreiben mit 55 Punkten. Vier Module heißen vier eigenständige Hürden — jede muss für sich genommen genommen werden.',
        },
        {
          type: 'p',
          text: 'Praktisch bedeutet das für die Vorbereitung: Es lohnt sich nicht, dein stärkstes Modul von 85 auf 95 Punkte zu polieren. Diese zehn Punkte helfen dir nirgends. Die gleiche Lernzeit im schwächsten Modul entscheidet dagegen über Bestehen oder Nichtbestehen.',
        },
        {
          type: 'callout',
          text: 'Plane mit 70–75 Punkten pro Modul, nicht mit 60. Am Prüfungstag kostet Nervosität Punkte, und beim Schreiben und Sprechen hängt die Bewertung stärker vom Gesamteindruck ab als beim Ankreuzen.',
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ein 8-Wochen-Lernplan für die Modulstruktur',
      blocks: [
        {
          type: 'p',
          text: 'Dieser Plan setzt solides A2-Niveau und 30–60 Minuten täglich voraus. Er ist bewusst um die Module herum gebaut: erst messen, dann das schwächste Modul bevorzugt behandeln.',
        },
        {
          type: 'p',
          text: 'Starte mit dem <a href="/level-test/">kostenlosen Einstufungstest</a>, damit du deine Ausgangslage kennst statt sie zu schätzen.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1',
              title: 'Messen statt raten',
              tasks: [
                'Einstufungstest machen und das Ergebnis notieren',
                'Von jedem Modul eine Übungsaufgabe unter Zeitdruck bearbeiten',
                'Die vier Ergebnisse vergleichen: Welches Modul ist am schwächsten?',
                'Lernzeit danach aufteilen — das schwächste Modul bekommt den größten Anteil',
              ],
              tip: 'Diese Woche fühlt sich unproduktiv an und ist die wichtigste. Ohne Messung optimierst du acht Wochen lang das, was du ohnehin schon kannst.',
            },
            {
              label: 'Woche 2–3',
              title: 'B1-Grammatik aufbauen',
              tasks: [
                'Konjunktiv II für höfliche Bitten und Hypothesen (würde, hätte, wäre)',
                'Relativsätze — sie heben Schreiben und Sprechen sichtbar über A2',
                'Passiv im Präsens und Präteritum',
                'Konnektoren: obwohl, trotzdem, deshalb, während',
                'Täglich eine Hörübung auf B1-Niveau',
              ],
              tip: 'Die Grammatik-Lektionen erklären auf Englisch, warum eine Struktur so funktioniert. Das Sentence X-Ray zeigt dir an deinen eigenen Sätzen, was passiert.',
            },
            {
              label: 'Woche 4–5',
              title: 'Schreiben und Sprechen — die teuren Module',
              tasks: [
                'Pro Woche zwei vollständige Schreibaufgaben unter Zeitlimit',
                'Textsorten trennen üben: kurze Mitteilung vs. längerer Meinungstext',
                'Täglich 10 Minuten frei sprechen, ohne Skript',
                'Die Präsentationsform üben: Thema vorstellen, Meinung begründen, Beispiel geben',
              ],
              tip: 'Schreiben und Sprechen kosten die meiste Lernzeit und werden am häufigsten aufgeschoben. Wer sie in Woche 7 anfängt, hat sie nicht geübt.',
            },
            {
              label: 'Woche 6',
              title: 'Lesen und Hören unter Zeitdruck',
              tasks: [
                'Leseaufgaben mit Stoppuhr: erst die Fragen, dann den Text',
                'Hörverstehen täglich, auch nebenbei — Durchsagen, Nachrichten, Dialoge',
                'Gezielt üben, Details zuzuordnen statt jedes Wort zu verstehen',
                'Wortschatz aus den Übungstexten aktiv sammeln',
              ],
              tip: 'Beim Hören verlieren die meisten Punkte, weil sie an einem unbekannten Wort hängen bleiben und den nächsten Satz verpassen. Weiterhören ist eine Technik, die man üben kann.',
            },
            {
              label: 'Woche 7',
              title: 'Das schwächste Modul',
              tasks: [
                'Die Messung aus Woche 1 wiederholen — was hat sich bewegt?',
                'Die verbleibende Lernzeit fast vollständig ins schwächste Modul stecken',
                'Eigene Fehler durchgehen statt neue Themen anzufangen',
                'Falls du modular antrittst: Termine für die starken Module fest buchen',
              ],
              tip: 'Nutze das Sentence X-Ray für Sätze, die dir korrigiert wurden. Es zeigt Kasus, Wortstellung und Verbform an deinem eigenen Fehler.',
            },
            {
              label: 'Woche 8',
              title: 'Generalprobe',
              tasks: [
                'Alle vier Module einmal komplett unter Prüfungsbedingungen',
                'Mündliche Prüfung mit Partner oder KI durchspielen',
                'Keine neuen Themen mehr — nur festigen',
                'Am Vortag früh aufhören und schlafen',
              ],
              tip: 'Qualität vor Quantität: drei konzentrierte Sprechübungen bringen mehr als zehn hastige.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die häufigsten Fehler beim Goethe-Zertifikat B1',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Die Modulstruktur nicht nutzen',
              body: 'Alle vier Module an einem Tag abzulegen ist bequem, aber selten optimal. Wenn ein Modul deutlich schwächer ist, verschenkst du den größten Vorteil dieser Prüfung: Du könntest die starken Module früher abhaken und dir für das schwache Wochen mehr Zeit nehmen.',
            },
            {
              title: 'Das starke Modul weiter polieren',
              body: 'Weil es sich gut anfühlt. Da zwischen den Modulen nicht verrechnet wird, sind Punkte oberhalb von 60 in einem Modul für das Bestehen wertlos. Lernzeit gehört dorthin, wo du unter der Grenze liegst.',
            },
            {
              title: 'Sprechen nur im Kopf üben',
              body: 'Sätze still zu formulieren trainiert nicht dasselbe wie Sprechen. In der Paarprüfung fehlen dann Tempo und Reaktion. Zehn Minuten laut sprechen pro Tag verändern das Modul Sprechen mehr als jede zusätzliche Grammatikübung.',
            },
            {
              title: 'Beim Schreiben die Textsorte verfehlen',
              body: 'Das Modul Schreiben verlangt unterschiedliche Textsorten mit unterschiedlichem Ton. Eine formelle Anfrage im Chat-Stil verliert Punkte, auch wenn kein einziger Grammatikfehler darin steht. Anrede, Aufbau und Schluss gehören zur Aufgabe.',
            },
            {
              title: 'In der Paarprüfung den Partner ignorieren',
              body: 'Im gemeinsamen Planungsteil wird bewertet, ob ihr miteinander sprecht. Wer seinen vorbereiteten Text abspult, ohne auf Vorschläge einzugehen, wirkt wie ein Monolog neben einem zweiten Monolog. Rückfragen und Zustimmung sind Teil der Leistung.',
            },
          ],
        },
      ],
    },
    {
      id: 'deutschmeister',
      heading: 'Wie Deutschmeister zur Modulstruktur passt',
      blocks: [
        {
          type: 'p',
          text: 'Weil die Module einzeln bestanden werden müssen, braucht die Vorbereitung eine Diagnose und dann gezieltes Training pro Fertigkeit. Genau so ist Deutschmeister aufgebaut — von einem Team von Ärzten in Deutschland, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Modul Sprechen',
              title: 'KI-Sprechtraining',
              body: 'Freies Gespräch zu Prüfungsthemen, mit sofortigem Feedback zu Grammatik, Wortschatz und Ausdruck. Kein Termin, kein Partner nötig.',
            },
            {
              eyebrow: 'Modul Hören',
              title: 'Hörübungen A1–B2',
              body: 'Dialoge und Monologe von Muttersprachlern, nach Niveau sortiert — für das tägliche Training, das dieses Modul verlangt.',
            },
            {
              eyebrow: 'Modul Lesen',
              title: 'Lesetexte A1–B2',
              body: 'Texte mit steigender Länge und Komplexität, damit Lesen unter Zeitdruck zur Gewohnheit wird statt zur Überraschung.',
            },
            {
              eyebrow: 'Modul Schreiben',
              title: 'Grammatik + Sentence X-Ray',
              body: 'Grammatik auf Englisch erklärt, plus ein Werkzeug, das deine eigenen Sätze in Fälle und Satzglieder zerlegt — dort entstehen die Fehler, die im Schreiben Punkte kosten.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Der <a href="/level-test/">Einstufungstest</a> ist der Startpunkt für Woche 1, die <a href="/grammar/b1.1/">B1-Grammatik</a> deckt die Strukturen ab, die in allen vier Modulen auftauchen. Wie sich das gegen andere Plattformen schlägt, steht im <a href="/vergleich/">Vergleich</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Kann ich die Module des Goethe-Zertifikats B1 einzeln ablegen?',
      a: 'Ja. Lesen, Hören, Schreiben und Sprechen können einzeln oder gemeinsam an einem Termin abgelegt werden, und jedes Modul wird separat bewertet. Bis wann einzeln bestandene Module zu einem Gesamtzertifikat kombiniert werden können, regelt dein Prüfungszentrum — frag dort nach, bevor du die Prüfung aufteilst.',
    },
    {
      q: 'Wie viele Punkte braucht man beim Goethe-Zertifikat B1?',
      a: 'Pro Modul sind maximal 100 Punkte erreichbar, bestanden ist ab 60 Punkten, also 60 %. Diese Grenze gilt für jedes Modul einzeln, und zwischen den Modulen wird nicht verrechnet.',
    },
    {
      q: 'Muss ich bei nicht bestandenem Modul die ganze Prüfung wiederholen?',
      a: 'Nein. Du wiederholst nur das Modul, das du nicht bestanden hast. Das ist der wesentliche Vorteil der Modulstruktur gegenüber Prüfungen, die schriftlich und mündlich als Blöcke bewerten.',
    },
    {
      q: 'Goethe B1 oder telc B1 — was ist besser?',
      a: 'Beide weisen dasselbe GER-Niveau nach und werden für Aufenthalt und Einbürgerung anerkannt. Goethe ist modular, telc prüft in zwei Blöcken und hat zusätzlich Sprachbausteine als eigenen Teil. Wenn ein Fertigkeitsbereich bei dir deutlich schwächer ist, spricht die Modulstruktur für Goethe. Ansonsten entscheidet meist, welche Prüfung in deiner Nähe angeboten wird.',
    },
    {
      q: 'Wie lange dauert die Vorbereitung auf B1?',
      a: 'Von solidem A2 aus rechnen die meisten mit etwa acht Wochen bei täglich 30–60 Minuten. Von A1 aus ist ein halbes Jahr realistischer. Entscheidend ist weniger die Gesamtdauer als die Regelmäßigkeit — und ob das Sprechen von Anfang an dabei ist.',
    },
    {
      q: 'Was kostet das Goethe-Zertifikat B1?',
      a: 'Die Gebühr setzt das jeweilige Prüfungszentrum fest und unterscheidet sich je nach Land und Ort; bei modularer Ablegung wird meist pro Modul abgerechnet. Die aktuellen Preise stehen beim Goethe-Institut oder Prüfungszentrum in deiner Nähe.',
    },
    {
      q: 'Ist das Goethe-Zertifikat B1 unbegrenzt gültig?',
      a: 'Das Zertifikat selbst hat kein Ablaufdatum. Behörden und Arbeitgeber verlangen aber teils einen aktuellen Nachweis — ob ein älteres Zertifikat akzeptiert wird, entscheidet die jeweilige Stelle.',
    },
    {
      q: 'Wie läuft die mündliche Prüfung ab?',
      a: 'Sprechen wird in der Regel als Paarprüfung abgenommen und dauert etwa 15 Minuten, mit rund 15 Minuten Vorbereitungszeit davor. Ihr plant gemeinsam etwas und präsentiert jeweils ein Thema. Bewertet wird auch, wie ihr aufeinander eingeht.',
    },
  ],

  cta: {
    heading: 'Finde heraus, welches Modul dich aufhält',
    body: 'Der Einstufungstest zeigt dir in wenigen Minuten, wo du stehst — danach weißt du, wohin deine Lernzeit gehört.',
  },
};
