// telc Deutsch B2 — written 2026-08-22. Companion to the B1 guide.
//
// FACT SOURCING: telc.net could not be fetched from this environment. The
// structure below (schriftlich 225 points split 75/30/75/45, mündlich 75, 60 %
// per part) is the long-standing telc format and mirrors the B1 exam's own
// 225/75 split, corroborated across independent exam-centre descriptions.
// Durations are given as "ca." because telc has revised timings between
// versions. Fees are not stated — each centre sets its own.

export const telcB2 = {
  slug: 'telc-b2',
  title: 'telc B2 Vorbereitung: Leitfaden 2026 | DeutschMeister',
  h1: 'telc Deutsch B2: Aufbau, Punkte und Vorbereitung',
  description:
    'telc Deutsch B2: Prüfungsaufbau, Punkteverteilung, 10-Wochen-Lernplan und was den Sprung von B1 auf B2 wirklich ausmacht.',
  keywords:
    'telc B2 Prüfung, telc Deutsch B2, telc B2 Vorbereitung, telc B2 bestehen, telc B2 Sprachbausteine, Deutsch B2 Prüfung',
  badge: 'Leitfaden',
  lead:
    'B2 ist kein größeres B1. Auf B1 zeigst du, dass du dich verständigen kannst; auf B2 sollst du <strong>argumentieren, abwägen und zusammenhängend darstellen</strong> — und das unter deutlich mehr Zeitdruck. Dieser Leitfaden zeigt den Aufbau der telc Deutsch B2 Prüfung, wo die Punkte liegen und wie sich der Sprung von B1 planen lässt.',
  datePublished: '2026-08-22',
  answer:
    'Die telc Deutsch B2 Prüfung besteht aus einem schriftlichen Teil (maximal 225 Punkte) und einer mündlichen Paarprüfung (maximal 75 Punkte). Zum Bestehen brauchst du mindestens 60 % in beiden Teilen getrennt: 135 der 225 Punkte schriftlich und 45 der 75 mündlich. Lesen und Hören bringen zusammen 150 der 225 schriftlichen Punkte, die Sprachbausteine nur 30 — der kleinste Posten der Prüfung.',
  factsCheckedOn: '2026-08-22',
  sources: [{ label: 'telc gGmbH', url: 'https://www.telc.net/' }],

  sections: [
    {
      id: 'was-ist-b2',
      heading: 'Was bedeutet B2 — und was ändert sich gegenüber B1?',
      blocks: [
        {
          type: 'p',
          text: 'B2 ist die vierte Stufe des Gemeinsamen Europäischen Referenzrahmens. Du verstehst die Hauptinhalte komplexer Texte, kannst dich spontan und fließend verständigen und einen Standpunkt zu einer aktuellen Frage erklären — mit Vor- und Nachteilen.',
        },
        {
          type: 'p',
          text: 'Der praktische Unterschied zu <a href="/leitfaden/telc-b1/">B1</a> ist weniger der Wortschatz als die <strong>Textsorte im Kopf</strong>. Auf B1 reicht es, zu berichten: was passiert ist, was du willst. Auf B2 musst du eine Position aufbauen, sie begründen, Gegenargumente einräumen und zu einem Schluss kommen. Genau daran scheitern Kandidaten, deren Grammatik längst gut genug ist.',
        },
        {
          type: 'p',
          text: 'telc Deutsch B2 wird von Arbeitgebern und Hochschulen häufig verlangt. In vielen Berufen — besonders im Gesundheitswesen — ist B2 die Schwelle für die Anerkennung. Welcher Nachweis für deinen Fall gilt, sagt dir die zuständige Stelle.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'Der Aufbau der telc B2 Prüfung',
      blocks: [
        {
          type: 'p',
          text: 'Wie auf B1 besteht die Prüfung aus einem schriftlichen und einem mündlichen Teil. Der schriftliche Teil läuft am Stück und dauert insgesamt rund zweieinhalb Stunden.',
        },
        {
          type: 'table',
          head: ['Prüfungsteil', 'Was wird geprüft?', 'Punkte'],
          rows: [
            ['Leseverstehen', 'Längere Sach- und Meinungstexte, Detail- und Hauptaussagen', 'max. 75'],
            ['Sprachbausteine', 'Grammatik und Wortschatz im Kontext, Lückentext', 'max. 30'],
            ['Hörverstehen', 'Gespräche, Interviews, Berichte — auch mit mehreren Sprechern', 'max. 75'],
            ['Schriftlicher Ausdruck', 'Ein zusammenhängender Text zu einer vorgegebenen Frage', 'max. 45'],
            ['Mündliche Prüfung', 'Paarprüfung: darstellen, diskutieren, gemeinsam planen', 'max. 75'],
          ],
        },
        {
          type: 'p',
          text: 'Die mündliche Prüfung findet meist als Paarprüfung statt und dauert etwa 15 Minuten pro Paar; davor bekommst du eine getrennte Vorbereitungszeit von rund 20 Minuten. Die genauen Zeiten können je nach Prüfungsversion abweichen — dein Prüfungszentrum sagt dir, welche Fassung geprüft wird.',
        },
        { type: 'h3', text: 'Wo die Punkte wirklich liegen' },
        {
          type: 'p',
          text: 'Lesen und Hören bringen zusammen 150 der 225 schriftlichen Punkte — zwei Drittel. Die Sprachbausteine bringen 30. Wer seine Lernzeit überwiegend in Grammatikdrills steckt, optimiert damit den kleinsten Posten der schriftlichen Prüfung.',
        },
        {
          type: 'callout',
          text: 'Das heißt nicht, Grammatik zu vernachlässigen: Sie trägt indirekt Schreiben und Sprechen. Es heißt, dass Lese- und Hörtraining unter Zeitdruck der Hebel mit dem besten Verhältnis von Aufwand zu Punkten ist.',
        },
      ],
    },
    {
      id: 'bestehen',
      heading: 'Wie viele Punkte braucht man zum Bestehen?',
      blocks: [
        {
          type: 'p',
          text: 'Du brauchst mindestens <strong>60 % in beiden Teilen getrennt</strong>: 135 der 225 Punkte im schriftlichen Teil und 45 der 75 Punkte im mündlichen. Ein sehr gutes Ergebnis in einem Teil gleicht ein schwaches im anderen nicht aus.',
        },
        {
          type: 'p',
          text: 'Wie auf B1 lassen sich die beiden Teile in der Regel getrennt wiederholen. Die Bedingungen und Fristen legt dein Prüfungszentrum fest.',
        },
        {
          type: 'callout',
          text: 'Die 45 Punkte im Mündlichen sind die Hürde, die am häufigsten unterschätzt wird — weil sie sich nicht durch Ankreuzen erreichen lässt. Wer erst in der letzten Woche zu sprechen anfängt, merkt zu spät, dass Flüssigkeit Übung braucht, nicht Wissen.',
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ein 10-Wochen-Lernplan von B1 auf B2',
      blocks: [
        {
          type: 'p',
          text: 'Der Sprung von B1 auf B2 dauert erfahrungsgemäß länger als der von A2 auf B1 — der Wortschatz wächst, und die verlangte Textsorte ist neu. Dieser Plan setzt ein bestandenes oder sicheres B1 voraus und rechnet mit 45–60 Minuten täglich.',
        },
        {
          type: 'p',
          text: 'Wenn du nicht sicher bist, ob dein B1 wirklich sitzt: <a href="/level-test/">Einstufungstest</a> zuerst.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1–2',
              title: 'B1 absichern, Lücken schließen',
              tasks: [
                'Konjunktiv II, Passiv und Relativsätze aktiv wiederholen, nicht nur erkennen',
                'Nebensatzstrukturen sicher machen — sie tragen den ganzen B2-Ausdruck',
                'Täglich ein längerer Hörtext, auch wenn nicht alles verstanden wird',
                'Wortschatz nach Themenfeldern statt alphabetisch aufbauen',
              ],
              tip: 'B2-Übungen mit wackeligem B1 zu machen ist der häufigste Zeitverlust. Zwei Wochen Absicherung sparen später vier.',
            },
            {
              label: 'Woche 3–4',
              title: 'Argumentieren lernen',
              tasks: [
                'Pro-und-Contra-Struktur üben: These, Begründung, Gegenargument, Fazit',
                'Redemittel sammeln: einerseits/andererseits, dagegen spricht, letztlich halte ich',
                'Zu einer Frage täglich fünf Minuten frei sprechen — mit Position, nicht nur Beschreibung',
                'Zwei Meinungstexte pro Woche schreiben',
              ],
              tip: 'Das ist der eigentliche B2-Inhalt. Wer nur Vokabeln erweitert, bleibt sprachlich auf B1 und klingt nur belesener.',
            },
            {
              label: 'Woche 5–6',
              title: 'Lesen und Hören unter Zeitdruck',
              tasks: [
                'Leseaufgaben immer mit Stoppuhr — Tempo ist auf B2 Teil der Aufgabe',
                'Hörtexte mit mehreren Sprechern, Interviews, Diskussionen',
                'Üben, an unbekannten Wörtern vorbeizuhören statt hängen zu bleiben',
                'Unbekannte Wörter aus dem Kontext erschließen statt nachzuschlagen',
              ],
              tip: 'Hier liegen zwei Drittel der schriftlichen Punkte. Diese zwei Wochen sind die produktivsten des Plans.',
            },
            {
              label: 'Woche 7–8',
              title: 'Prüfungsformat und Sprachbausteine',
              tasks: [
                'Sprachbausteine gezielt üben: Konnektoren, Präpositionen, feste Wendungen',
                'Vollständige schriftliche Übungssätze in einem Durchgang',
                'Schreiben mit Zeitlimit und fester Struktur',
                'Mündliche Prüfung simulieren: darstellen, diskutieren, planen',
              ],
              tip: 'Das Sentence X-Ray hilft bei den Sprachbausteinen: Es zeigt an deinen eigenen Sätzen, welcher Fall und welche Struktur verlangt ist.',
            },
            {
              label: 'Woche 9',
              title: 'Eigene Fehler abarbeiten',
              tasks: [
                'Alle korrigierten Texte durchgehen und Fehler nach Typ sortieren',
                'Die drei häufigsten Fehlertypen gezielt üben',
                'Sprechen täglich, jetzt mit Fokus auf Flüssigkeit statt Korrektheit',
                'Keine neuen Themen mehr anfangen',
              ],
              tip: 'Fehler nach Typ zu sortieren zeigt fast immer, dass drei Muster den Großteil ausmachen. Die lassen sich in einer Woche angehen.',
            },
            {
              label: 'Woche 10',
              title: 'Generalprobe',
              tasks: [
                'Kompletter schriftlicher Teil unter echten Prüfungsbedingungen',
                'Mündliche Prüfung mit Partner oder KI durchspielen',
                'Nur noch wiederholen und festigen',
                'Am Vortag früh aufhören',
              ],
              tip: 'Am Prüfungstag entscheidet Konzentration mehr als das letzte Grammatikkapitel.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die häufigsten Fehler bei telc B2',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'B2 als „mehr Vokabeln" verstehen',
              body: 'Der Sprung von B1 auf B2 ist ein Sprung in der Textsorte, nicht im Wortschatzumfang. Wer nur Vokabeln nachlädt, aber weiter beschreibt statt zu argumentieren, bleibt in der Bewertung auf B1 — mit anspruchsvolleren Wörtern.',
            },
            {
              title: 'Die Sprachbausteine überbewerten',
              body: 'Sie sind der sichtbarste Grammatikteil und bringen 30 von 225 schriftlichen Punkten. Lesen und Hören bringen zusammen 150. Die Lernzeit sollte diesem Verhältnis ungefähr folgen.',
            },
            {
              title: 'Lesen ohne Zeitlimit üben',
              body: 'Die B2-Texte sind länger und dichter als auf B1. Wer sie in Ruhe liest, versteht sie — und scheitert in der Prüfung an der Uhr. Tempo ist Teil der Aufgabe und muss unter Druck geübt werden.',
            },
            {
              title: 'Im Mündlichen nur den eigenen Beitrag vorbereiten',
              body: 'Im Diskussionsteil wird bewertet, ob du auf Argumente eingehst — zustimmst, einschränkst, widersprichst. Ein auswendig gelernter Vortrag neben einem zweiten Vortrag erfüllt die Aufgabe nicht.',
            },
            {
              title: 'Beim Schreiben keine Struktur setzen',
              body: 'Ein B2-Text braucht einen erkennbaren Aufbau: Einleitung, Argumente mit Beispielen, Gegenposition, Schluss. Ohne Gliederung wirkt auch sprachlich korrekter Text unfertig und verliert Punkte in der Bewertung.',
            },
          ],
        },
      ],
    },
    {
      id: 'deutschmeister',
      heading: 'Wie Deutschmeister auf B2 vorbereitet',
      blocks: [
        {
          type: 'p',
          text: 'B2 verlangt Menge und Regelmäßigkeit — vor allem beim Hören und Sprechen. Dafür ist die Plattform gebaut:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Mündliche Prüfung',
              title: 'KI-Sprechtraining',
              body: 'Übe Position beziehen und begründen im freien Gespräch, mit sofortigem Feedback zu Grammatik und Ausdruck — täglich, ohne Termin.',
            },
            {
              eyebrow: 'Hörverstehen',
              title: 'Hörübungen bis B2',
              body: 'Dialoge und Monologe von Muttersprachlern, nach Niveau sortiert, für das tägliche Training, das dieser Prüfungsteil verlangt.',
            },
            {
              eyebrow: 'Sprachbausteine',
              title: 'Grammatik + Sentence X-Ray',
              body: 'Jeder Satz wird in Fälle, Wortarten und Satzglieder zerlegt — genau die Strukturen, die in den Sprachbausteinen abgefragt werden.',
            },
            {
              eyebrow: 'Leseverstehen',
              title: 'Lesetexte bis B2',
              body: 'Texte mit steigender Länge und Dichte, damit Lesen unter Zeitdruck geübt ist, bevor es zählt.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Die <a href="/grammar/b2.1/">B2-Grammatik</a> deckt die Strukturen ab, die den Unterschied zwischen B1- und B2-Ausdruck ausmachen. Wenn du noch nicht sicher auf B1 bist, fang beim <a href="/leitfaden/telc-b1/">telc-B1-Leitfaden</a> an.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie unterscheidet sich telc B2 von telc B1?',
      a: 'Der Aufbau ist ähnlich — schriftlicher und mündlicher Teil, Sprachbausteine als eigener Bereich — aber die Anforderung ist eine andere. Auf B1 berichtest du, auf B2 argumentierst du: Position beziehen, begründen, Gegenargumente einräumen. Texte und Hörbeiträge sind außerdem länger und dichter.',
    },
    {
      q: 'Wie viele Punkte braucht man für telc B2?',
      a: 'Mindestens 60 % in beiden Teilen getrennt: 135 der 225 Punkte im schriftlichen Teil und 45 der 75 Punkte im mündlichen. Zwischen den Teilen wird nicht verrechnet.',
    },
    {
      q: 'Wie lange dauert der Weg von B1 auf B2?',
      a: 'Von sicherem B1 aus rechnen viele mit etwa zehn Wochen bei täglich 45–60 Minuten. Der Sprung dauert meist länger als der von A2 auf B1, weil neben dem Wortschatz eine neue Art zu formulieren dazukommt.',
    },
    {
      q: 'Was sind Sprachbausteine bei telc B2?',
      a: 'Ein Lückentext, in dem Grammatik und Wortschatz im Kontext geprüft werden — Konnektoren, Präpositionen, feste Wendungen. Sie bringen maximal 30 Punkte von 225 im schriftlichen Teil.',
    },
    {
      q: 'Kann ich einen Teil der telc B2 Prüfung wiederholen?',
      a: 'In der Regel lassen sich schriftlicher und mündlicher Teil getrennt wiederholen, sodass nicht die gesamte Prüfung noch einmal abgelegt werden muss. Die genauen Bedingungen und Fristen legt dein Prüfungszentrum fest.',
    },
    {
      q: 'Brauche ich B2 für die Arbeit in Deutschland?',
      a: 'Das hängt vom Beruf ab. In vielen reglementierten Berufen, besonders im Gesundheitswesen, ist B2 die übliche Schwelle, teils zusätzlich eine Fachsprachprüfung. Welcher Nachweis in deinem Fall verlangt wird, entscheidet die zuständige Anerkennungsstelle.',
    },
    {
      q: 'Was kostet die telc B2 Prüfung?',
      a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Frag bei einer Volkshochschule oder einem telc-Prüfungszentrum in deiner Nähe nach dem aktuellen Preis.',
    },
    {
      q: 'Ist telc B2 oder Goethe B2 leichter?',
      a: 'Beide prüfen dasselbe GER-Niveau. telc hat Sprachbausteine als eigenen Teil und bewertet schriftlich und mündlich als Blöcke; das Goethe-Zertifikat ist modular aufgebaut. Welche Prüfung besser passt, hängt davon ab, ob du gleichmäßig stark bist oder einen Bereich einzeln angehen willst.',
    },
  ],

  cta: {
    heading: 'Bereit für den Sprung auf B2?',
    body: 'Prüf zuerst, ob dein B1 wirklich sitzt — danach weißt du, ob du absichern oder schon argumentieren üben solltest.',
  },
};
