import { FOUNDER_LINE_DE } from '../marketing.js';

// telc Deutsch B1 — migrated 2026-08-22 from the hardcoded page that proved the
// pattern (Lighthouse SEO 100). Copy is unchanged except where it was wrong:
//   - `/grammar/b1.2` had no trailing slash and 301-hopped on every click
//   - absolute https://deutsch-meister.de/... links became relative
//   - "Zuletzt aktualisiert: Mai 2026" and "Stand: Mai 2026" were hardcoded and
//     already stale; both now derive (BUILD_DATE / factsCheckedOn)
//
// The URL /leitfaden/telc-b1/ is unchanged, so nothing that ranks is lost.

export const telcB1 = {
  slug: 'telc-b1',
  offer: 'telc',
  title: 'telc B1 Vorbereitung: Leitfaden 2026 | DeutschMeister',
  h1: 'telc Deutsch B1: Der komplette Leitfaden zur Vorbereitung',
  description:
    'telc Deutsch B1 Vorbereitung: 8-Wochen-Lernplan, Prüfungsaufbau, häufige Fehler und Tipps. Alles, was Sie zum Bestehen brauchen.',
  keywords:
    'telc Deutsch B1 Vorbereitung, telc B1 bestehen, telc B1 Prüfung Ablauf, telc B1 Lernplan, Deutsch B1 Prüfung',
  badge: 'Leitfaden',
  lead:
    'Sie bereiten sich auf die <strong>telc Deutsch B1 Prüfung</strong> vor? Egal ob für den Aufenthaltstitel, die Einbürgerung oder den Beruf — dieser Leitfaden gibt Ihnen alles, was Sie brauchen. Sie erfahren, wie die Prüfung aufgebaut ist, was Sie Woche für Woche lernen sollten, und welche Fehler Sie vermeiden müssen. Keine Theorie, keine Umwege.',
  datePublished: '2026-05-28',
  answer:
    'Die telc Deutsch B1 Prüfung besteht aus einem schriftlichen Teil (maximal 225 Punkte) und einer mündlichen Paarprüfung (maximal 75 Punkte), zusammen 300. Bestanden ist sie mit mindestens 60 % in beiden Teilen getrennt — also 135 der 225 Punkte schriftlich und 45 der 75 mündlich. Zwischen den Teilen wird nicht verrechnet, und wer einen Teil nicht besteht, kann ihn in der Regel allein wiederholen. Die genauen Wiederholungsregeln legt das Prüfungszentrum fest.',
  factsCheckedOn: '2026-08-22',
  sources: [{ label: 'telc gGmbH', url: 'https://www.telc.net/' }],

  sections: [
    {
      id: 'was-ist-telc',
      heading: 'Was ist die telc B1 Prüfung?',
      blocks: [
        {
          type: 'p',
          text: 'telc steht für „The European Language Certificates". Die telc Deutsch B1 Prüfung ist eine der anerkanntesten Sprachprüfungen für Deutsch als Fremdsprache. Sie prüft, ob Sie das Niveau B1 des Gemeinsamen Europäischen Referenzrahmens (GER) erreicht haben.',
        },
        {
          type: 'p',
          text: 'B1 bedeutet: Sie können sich in den meisten Alltagssituationen verständigen. Sie verstehen die Hauptpunkte eines Gesprächs, wenn Standarddeutsch gesprochen wird. Sie können über Erfahrungen berichten, Pläne erklären und kurze Texte zu vertrauten Themen schreiben.',
        },
        {
          type: 'p',
          text: 'telc Deutsch B1 wird in Deutschland von Behörden, Arbeitgebern und Bildungseinrichtungen anerkannt. Für den Aufenthaltstitel und die Einbürgerung ist B1 die Mindestanforderung.',
        },
        { type: 'h3', text: 'telc B1 vs. Goethe B1: Was ist der Unterschied?' },
        {
          type: 'p',
          text: 'Beide Prüfungen testen dasselbe Sprachniveau und werden für Aufenthalt und Einbürgerung anerkannt. Der wichtigste Unterschied liegt im Aufbau: telc hat einen eigenen Prüfungsteil „Sprachbausteine" (Grammatik und Wortschatz im Kontext), während das <a href="/leitfaden/goethe-b1/">Goethe-Zertifikat B1</a> aus vier einzeln ablegbaren Modulen besteht. Wählen Sie die Prüfung, die in Ihrer Stadt leichter verfügbar ist — oder die, deren Format Ihnen mehr liegt.',
        },
        {
          type: 'p',
          text: 'Auch der <a href="/leitfaden/dtz/">DTZ (Deutsch-Test für Zuwanderer)</a> kann B1 nachweisen. Er ist die Abschlussprüfung der Integrationskurse und testet auf A2–B1 gleichzeitig. Wenn Sie gezielt B1 brauchen, ist telc oder Goethe die sicherere Wahl.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'Der Aufbau der telc B1 Prüfung',
      blocks: [
        {
          type: 'p',
          text: 'Die telc Deutsch B1 Prüfung besteht aus zwei Teilen: einer schriftlichen und einer mündlichen Prüfung. Der schriftliche Teil wird an einem Tag absolviert, die mündliche Prüfung kann am selben oder an einem anderen Tag stattfinden.',
        },
        {
          type: 'table',
          head: ['Prüfungsteil', 'Was wird geprüft?', 'Dauer'],
          rows: [
            ['Leseverstehen', 'Texte verstehen: Anzeigen, E-Mails, Zeitungsartikel, Aushänge', 'ca. 90 Min. (mit Sprachbausteinen)'],
            ['Sprachbausteine', 'Grammatik und Wortschatz im Kontext: Lückentext mit Auswahlmöglichkeiten', '(in den 90 Min. enthalten)'],
            ['Hörverstehen', 'Gespräche, Durchsagen, Radiosendungen verstehen', 'ca. 30 Min.'],
            ['Schriftlicher Ausdruck', 'Einen persönlichen oder halbformellen Brief bzw. eine E-Mail schreiben', 'ca. 30 Min.'],
            ['Mündliche Prüfung', 'Gespräch mit Partner: sich vorstellen, über ein Thema sprechen, gemeinsam planen', 'ca. 15–20 Min. (Paarprüfung)'],
          ],
        },
        { type: 'h3', text: 'Der schriftliche Teil im Detail' },
        {
          type: 'p',
          text: '<strong>Leseverstehen:</strong> Sie lesen verschiedene Texte — von kurzen Anzeigen bis hin zu längeren Zeitungsartikeln. Die Aufgaben testen, ob Sie die Hauptaussagen verstehen und Details zuordnen können. Tipp: Lesen Sie zuerst die Aufgaben, dann den Text. So wissen Sie, wonach Sie suchen.',
        },
        {
          type: 'p',
          text: '<strong>Sprachbausteine:</strong> Dieser Teil ist typisch für telc. Sie bekommen einen Lückentext und müssen die richtige Grammatikform oder das richtige Wort aus mehreren Optionen wählen. Hier zeigt sich, ob Sie <a href="/grammar/b1.1/">Grammatik auf B1-Niveau</a> wirklich verstehen — nicht nur auswendig gelernt haben.',
        },
        {
          type: 'p',
          text: '<strong>Hörverstehen:</strong> Sie hören Dialoge und Monologe — Alltagsgespräche, Durchsagen am Bahnhof, kurze Radioberichte. Die Aufgabe: Hauptaussagen erfassen und Detailinformationen zuordnen. Regelmäßiges <a href="/listening/">Hörtraining</a> ist hier der Schlüssel.',
        },
        {
          type: 'p',
          text: '<strong>Schriftlicher Ausdruck:</strong> Sie schreiben einen Brief oder eine E-Mail zu einem vorgegebenen Thema. Typisch: Antwort auf eine Einladung, Beschwerde oder Anfrage. Achten Sie auf die richtige Anrede, eine klare Struktur und einen passenden Schluss.',
        },
        { type: 'h3', text: 'Die mündliche Prüfung' },
        {
          type: 'p',
          text: 'Die mündliche Prüfung findet normalerweise als Paarprüfung statt — Sie sprechen mit einem anderen Kandidaten, zwei Prüfer bewerten Sie.',
        },
        {
          type: 'p',
          text: 'Der Ablauf hat drei Teile: Zuerst stellen Sie sich kurz vor (Kontaktaufnahme). Dann sprechen Sie über ein vorgegebenes Thema — zum Beispiel Reisen, Gesundheit oder Medien. Im dritten Teil planen Sie gemeinsam etwas, etwa ein Fest oder einen Ausflug. Hier geht es nicht um perfekte Grammatik, sondern darum, dass Sie kommunizieren, auf Ihren Partner eingehen und das Gespräch am Laufen halten.',
        },
        {
          type: 'p',
          text: 'Das <a href="/speaking/">KI-Sprechtraining von Deutschmeister</a> simuliert genau solche Gesprächssituationen. Sie üben, frei zu sprechen, und bekommen nach dem Gespräch eine Auswertung zu Grammatik und Ausdruck.',
        },
      ],
    },
    {
      id: 'bestehen',
      heading: 'Wie viele Punkte braucht man zum Bestehen?',
      blocks: [
        {
          type: 'p',
          text: 'Um die telc Deutsch B1 Prüfung zu bestehen, brauchen Sie mindestens <strong>60 % der Punkte</strong> — und zwar in beiden Teilen getrennt. Sie müssen also sowohl den schriftlichen als auch den mündlichen Teil jeweils mit mindestens 60 % bestehen.',
        },
        {
          type: 'p',
          text: 'Die schriftliche Prüfung bringt maximal 225 Punkte, die mündliche maximal 75 Punkte — zusammen 300. Sie brauchen damit 135 Punkte im schriftlichen und 45 Punkte im mündlichen Teil.',
        },
        {
          type: 'p',
          text: 'Wenn Sie einen Teil nicht bestehen, können Sie ihn wiederholen, ohne den anderen noch einmal ablegen zu müssen. Die genauen Wiederholungsregeln legt Ihr Prüfungszentrum fest.',
        },
        {
          type: 'callout',
          text: 'Zielen Sie nicht auf 60 % — zielen Sie auf 70–75 %. Das gibt Ihnen einen Sicherheitspuffer, besonders beim Schreiben und Sprechen, wo die Bewertung stärker vom Eindruck abhängt.',
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ihr 8-Wochen-Lernplan für telc B1',
      blocks: [
        {
          type: 'p',
          text: 'Dieser Plan geht davon aus, dass Sie bereits auf A2-Niveau sind und täglich 30–60 Minuten lernen. Wenn Sie weniger Zeit haben, strecken Sie den Plan. Wenn Sie mehr Zeit haben, machen Sie die Übungen gründlicher — aber überspringen Sie keine Woche.',
        },
        {
          type: 'p',
          text: 'Bevor Sie loslegen: Machen Sie den <a href="/level-test/">kostenlosen Einstufungstest</a>. In wenigen Minuten wissen Sie, wo Sie wirklich stehen — nicht, wo Sie glauben zu stehen.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1–2',
              title: 'Grundlagen auffrischen',
              tasks: [
                'Grammatik A2 wiederholen: Perfekt, Modalverben, Nebensätze mit weil/dass/wenn',
                'Wortschatz Alltag: rund 200 Wörter pro Woche aktiv üben',
                'Täglich eine Hörübung auf A2-Niveau — das Ohr einstellen',
                'Einstufungstest machen und Schwächen identifizieren',
              ],
              tip: 'Nutzen Sie die Grammatik-Lektionen auf Deutschmeister — jedes Thema wird auf Englisch erklärt, damit Sie das WARUM verstehen, nicht nur das WAS.',
            },
            {
              label: 'Woche 3–4',
              title: 'B1-Grammatik aufbauen',
              tasks: [
                'Konjunktiv II (würde + Infinitiv, hätte, wäre)',
                'Relativsätze (der, die, das als Relativpronomen)',
                'Passiv Präsens und Präteritum',
                'Konnektoren: obwohl, trotzdem, deshalb, deswegen',
                'Tägliches Hörtraining auf B1-Niveau',
              ],
              tip: 'Bei den Sprachbausteinen kommt genau diese Grammatik. Das Sentence X-Ray zeigt Ihnen bei jedem Satz, welcher Fall und welche Struktur verwendet wird.',
            },
            {
              label: 'Woche 5–6',
              title: 'Prüfungsformat trainieren',
              tasks: [
                'Leseverstehen: Übungstexte mit Zeitlimit lesen',
                'Sprachbausteine: Lückentext-Übungen mit Grammatikfokus',
                'Schreiben: zwei Briefe pro Woche (Beschwerde, Einladungsantwort, Anfrage)',
                'Hörverstehen: B1-Dialoge, Durchsagen, kurze Berichte',
                'Sprechen: täglich 10 Minuten freies Sprechen üben',
              ],
              tip: 'Starten Sie jetzt mit dem KI-Sprechtraining. Themen: Reisen, Gesundheit, Arbeit, Wohnen — genau die Themen, die in der Prüfung drankommen.',
            },
            {
              label: 'Woche 7',
              title: 'Schwächen gezielt angehen',
              tasks: [
                'Analysieren Sie Ihre bisherigen Fehler: Wo verlieren Sie Punkte?',
                'Grammatik-Lücken schließen: noch einmal die schwierigen Themen',
                'Zeitmanagement: schriftliche Übungen mit Stoppuhr',
                'Mündliche Prüfung simulieren: Vorstellen, Thema, gemeinsame Planung',
              ],
              tip: 'Nutzen Sie das Sentence X-Ray für Sätze, die Sie falsch geschrieben haben. Es zeigt Ihnen, wo der Fehler liegt — Kasus, Wortstellung, Verbform.',
            },
            {
              label: 'Woche 8',
              title: 'Generalprobe',
              tasks: [
                'Komplette schriftliche Prüfung unter Prüfungsbedingungen simulieren',
                'Mündliche Prüfung mit Sprechpartner oder KI üben',
                'Keine neuen Themen — nur wiederholen und festigen',
                'Ausreichend schlafen, kein Last-Minute-Pauken am Prüfungstag',
              ],
              tip: 'Letzte Woche: Qualität vor Quantität. Lieber drei gute Sprechübungen als zehn hastige.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die 5 häufigsten Fehler bei der telc B1 Prüfung',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Sprechen nicht genug geübt',
              body: 'Der größte Fehler. Viele lernen monatelang Grammatik und Vokabeln, sprechen aber kaum. In der mündlichen Prüfung merkt man das sofort: lange Pausen, unsichere Satzstellung, kein natürlicher Gesprächsfluss. Üben Sie jeden Tag mindestens 10 Minuten freies Sprechen — mit einem Partner, im Tandem oder mit dem KI-Sprechtraining.',
            },
            {
              title: 'Zeitmanagement im schriftlichen Teil',
              body: 'Der schriftliche Teil ist lang. Wenn Sie beim Leseverstehen zu viel Zeit verbrauchen, fehlt sie beim Schreiben. Lösung: vorab mit Stoppuhr üben. Lesen Sie zuerst die Aufgaben, dann den Text. Nicht jedes Wort muss verstanden werden — Sie suchen spezifische Informationen.',
            },
            {
              title: 'Beim Schreiben: falsche Textsorte',
              body: 'Sie sollen einen formellen Brief schreiben und schreiben wie eine WhatsApp-Nachricht — oder umgekehrt. Lernen Sie die Unterschiede: „Sehr geehrte Damen und Herren" vs. „Liebe Frau Müller" vs. „Hallo Maria". Anrede, Schlussformel und Ton müssen zum Anlass passen.',
            },
            {
              title: 'Sprachbausteine unterschätzen',
              body: 'Die Sprachbausteine sehen einfach aus — mehrere Optionen, eine ist richtig. Aber hier werden genau die Grammatikfallen getestet, die Lernende am häufigsten machen: Dativ vs. Akkusativ, Adjektivendungen, Präpositionen. Regelmäßiges Training mit dem Sentence X-Ray hilft: Sie lernen, jeden Satz zu analysieren.',
            },
            {
              title: 'Nicht auf den Partner eingehen',
              body: 'In der Paarprüfung werden Sie nicht nur danach bewertet, was Sie sagen — sondern auch, wie Sie auf Ihren Partner reagieren. Hören Sie zu, stellen Sie Rückfragen, greifen Sie die Ideen Ihres Gegenübers auf. Die Prüfer wollen echte Kommunikation sehen, nicht zwei Monologe nebeneinander.',
            },
          ],
        },
      ],
    },
    {
      id: 'deutschmeister',
      heading: 'Wie Deutschmeister Sie auf telc B1 vorbereitet',
      blocks: [
        {
          type: 'p',
          text: `${FOUNDER_LINE_DE} Die folgenden Werkzeuge unterstützen Ihre Vorbereitung:`,
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Mündliche Prüfung',
              title: 'KI-Sprechtraining',
              body: 'Üben Sie Prüfungsthemen (Reisen, Wohnen, Gesundheit) im freien Gespräch. Danach wertet die KI Grammatik, Wortschatz und Ausdruck aus.',
            },
            {
              eyebrow: 'Hörverstehen',
              title: 'Hörübungen A1–B2',
              body: 'Authentische Dialoge und Monologe auf jedem Niveau. Trainieren Sie Ihr Ohr für Alltagssprache, Durchsagen und Berichte.',
            },
            {
              eyebrow: 'Sprachbausteine',
              title: 'Grammatik + Sentence X-Ray',
              body: 'Verstehe Grammatik nicht nur als Regel, sondern im Kontext. Das Sentence X-Ray zerlegt jeden Satz — Fälle, Wortarten, Satzglieder.',
            },
            {
              eyebrow: 'Leseverstehen',
              title: 'Lesetexte A1–B2',
              body: 'Üben Sie mit steigender Textlänge und Komplexität. Von kurzen Anzeigen bis zu längeren Texten — genau wie in der Prüfung.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Dazu kommt ein <a href="/level-test/">kostenloser Einstufungstest</a>, der Ihnen zeigt, wo Sie stehen, sowie <a href="/grammar/b1.2/">Grammatik-Lektionen bis B2</a> mit Erklärungen auf Englisch. Neugierig, wie Deutschmeister im Vergleich zu anderen Plattformen abschneidet? Schauen Sie sich den <a href="/vergleich/">ehrlichen Vergleich</a> an.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie lange sollte ich mich auf telc B1 vorbereiten?',
      a: 'Mindestens 8 Wochen bei täglichem Lernen von 30–60 Minuten. Wenn Sie schon auf A2-Niveau sind und regelmäßig Deutsch sprechen, kann es schneller gehen. Wenn Sie von A1 starten, planen Sie eher 4–6 Monate ein.',
    },
    {
      q: 'Was ist der Unterschied zwischen telc B1 und Goethe B1?',
      a: 'Beide Prüfungen testen dasselbe CEFR-Niveau (B1). Der Aufbau unterscheidet sich: telc hat Sprachbausteine als eigenen Teil, das Goethe-Zertifikat besteht aus vier einzeln ablegbaren Modulen. Beide werden für Aufenthalt und Einbürgerung anerkannt.',
    },
    {
      q: 'Kann man telc B1 ohne Sprachkurs bestehen?',
      a: 'Viele bereiten sich im Selbststudium vor. Entscheidend ist, dass Sie regelmäßig üben und besonders das Sprechen nicht vernachlässigen. KI-Sprechtraining hilft Ihnen, die mündliche Prüfung vorzubereiten, auch ohne Lehrer.',
    },
    {
      q: 'Was passiert, wenn ich einen Teil der Prüfung nicht bestehe?',
      a: 'Bei telc können Sie den schriftlichen und den mündlichen Teil in der Regel getrennt wiederholen — Sie müssen nicht die gesamte Prüfung noch einmal machen. Die genauen Bedingungen legt Ihr Prüfungszentrum fest.',
    },
    {
      q: 'Was kostet die telc B1 Prüfung?',
      a: 'Die Gebühren setzt jedes Prüfungszentrum selbst fest und sie ändern sich regelmäßig. Fragen Sie direkt bei Ihrer Volkshochschule oder einem telc-Prüfungszentrum in Ihrer Nähe nach dem aktuellen Preis.',
    },
    {
      q: 'Brauche ich telc B1 für die Einbürgerung?',
      a: 'Für die Einbürgerung in Deutschland sind Deutschkenntnisse auf B1-Niveau nachzuweisen. Sowohl telc Deutsch B1 als auch das Goethe-Zertifikat B1 und der DTZ kommen dafür in Frage. Welcher Nachweis in Ihrem Fall verlangt wird, sagt Ihnen die zuständige Behörde.',
    },
    {
      q: 'Ist telc B1 schwer?',
      a: 'Mit guter Vorbereitung ist telc B1 machbar. Die größte Hürde für die meisten Kandidaten ist die mündliche Prüfung — weil sie im Alltag zu wenig sprechen üben. Regelmäßiges Sprechtraining ist der Schlüssel.',
    },
    {
      q: 'Wo kann ich telc B1 ablegen?',
      a: 'telc-Prüfungen werden an Prüfungszentren weltweit angeboten. In Deutschland finden Sie sie über die telc-Website oder bei Ihrer lokalen Volkshochschule (VHS).',
    },
  ],

  cta: {
    heading: 'Ihre nächste telc-B1-Übung steht',
    body: 'Sehen Sie sich den Übungsplan mit Briefen, Überarbeitungen und Sprechproben an. Der Kurs ist derzeit nicht buchbar; auf der Kursseite finden Sie auch den kostenlosen Pro-Test.',
  },
};
