// Goethe-Zertifikat A2 (Erwachsene) — written 2026-09-05 for Course Factory Wave 4.
//
// WHY THIS GUIDE EXISTS: A2.1 becomes a standalone paid course in this wave, and
// a course needs an exam identity to point at. `start-deutsch-1.js` is the closest
// template (an A-level Goethe exam) and this module deliberately copies its SHAPE
// — hero → answer → sections → faq → cta — and none of its content.
//
// FACT SOURCING (see exam/notes.md for the full table). goethe.de is blocked by
// this sandbox's egress proxy AND WebFetch is blocked for every domain in this
// environment, so NOT ONE source URL below was opened directly. Every figure was
// established from at least two independent retrieval channels (WebSearch result
// extraction + Firecrawl index + a Perplexity grounding run restricted to
// non-goethe.de domains), and each channel resolved to a distinct document:
//   - the Durchführungsbestimmungen A2 (Goethe PDF, plus third-party mirrors at
//     goethe.al, goethe-kathmandu.edu.np and vhs-saar.de) for the pass rule;
//   - the Modellsatz/Übungssatz Erwachsene (Goethe PDFs, plus Scribd/Studocu
//     copies) for parts, item counts, minutes and the Sprechen pair format;
//   - the A2-Wortliste PDF, whose own Vorwort ("circa 1300 lexikalische
//     Einheiten") was returned verbatim by the Firecrawl index.
// The reviewer should re-verify from an unrestricted network before merge.
//
// ROUND 2 (2026-09-06), after the adversarial review. Corrected here:
//   - the schriftliche Umrechnung is 20 MESSPUNKTE x 1,25, not "20 Antworten".
//     Only Lesen and Hören have 20 countable answers; Schreiben and Sprechen
//     are criterion-rated (Aufgabenerfüllung / kommunikative Gestaltung /
//     sprachliche Korrektheit). The prose said "eine richtige Antwort" for all
//     three, which mis-models the Schreiben score for the reader.
//   - "ab 16 Jahren" was an eligibility bar we invented. The Durchführungs-
//     bestimmungen RECOMMEND 16 and state the exams "können unabhängig vom
//     Erreichen eines Mindestalters ... abgelegt werden". Fixed in `answer`,
//     in ueberblick and in the FAQ (whose question was reworded, because a
//     question about eligibility cannot be answered with a recommendation).
//   - the Studium/Ausbildung aside was unsourced and wrong for Studium
//     (admission is DSH-2 / TestDaF 4xTDN4, i.e. far above B2). Now split and
//     sourced to the HRK.
//   - a Lernplan task asked "wem? gegenueber wen?" — ungrammatical, since
//     that preposition governs the dative. Now "wem? statt wen?".
//   - Teilwiederholung is now stated as the DFB has it: only in Ausnahmefällen
//     and only if the centre's organisational conditions allow.
//   ROUND 3 (2026-09-06) after the second review: sources[0] moved to the
//   /de/ Durchführungsbestimmungen path (the reviewer surfaced it as a live,
//   1 Sep 2025 result — my round-2 non-adoption rested on a failed search, not
//   on the URL's absence); the Teilwiederholung scope is now exact (mündliche
//   ODER gesamte schriftliche Prüfung, never a single Prüfungsteil); and
//   Sprechen has its own criteria sentence, since it has neither Leitpunkte
//   nor a text and its criteria additionally cover Aussprache.
//
//   - plus register/precision fixes: § 20a also accepts English B2; "an zwei
//     Stellen" -> "unter anderem"; no invented Bewertung arithmetic; the
//     Wortliste is an orientation, not full exam coverage; Goethe's own
//     200-350 UE figure now anchors the Lernplan; no Volkshochschule claim.
//
// WHAT IS DELIBERATELY NOT STATED:
//   - exam fees (per-centre, change without notice — banned by CLAUDE.md and by
//     tests/guides.test.mjs);
//   - pass-rate or outcome promises;
//   - repetition/Teilwiederholung rules. Sources CONTRADICTED each other on
//     whether single parts of A2 may be repeated; the guide points at the
//     Prüfungszentrum and the Durchführungsbestimmungen instead of guessing.
//   - visa law beyond what the statute itself says. § 25a and § 25b AufenthG name
//     A2 explicitly and only for *mündliche* Deutschkenntnisse; the Chancenkarte
//     scores A2 in the Anlage zu § 20b, not in § 20a. Everything else (Ausbildung,
//     Einbürgerung, Niederlassungserlaubnis) sits at other levels, so the guide
//     says "frag die Ausländerbehörde" rather than inventing a rule.
//
// LINKS: `/level/a2.1` is the SPA course area (no trailing slash);
// `/grammar/a2.1/` is the Astro grammar library (trailing slash). See notes.md —
// tests/guides.test.mjs does not yet know the `/level/` prefix and must learn it
// in the same PR.

import {
  GRAMMAR_TOPIC_COUNT,
  LISTENING_EXERCISE_COUNT,
  READING_LESSON_COUNT,
} from '../marketing.js';

export const goetheA2 = {
  slug: 'goethe-a2',
  title: 'Goethe-Zertifikat A2: Leitfaden 2026',
  h1: 'Goethe-Zertifikat A2: Ablauf, Punkte und Vorbereitung',
  description:
    'Goethe-Zertifikat A2 verstehen: vier Prüfungsteile mit je 25 Punkten, die doppelte Bestehensgrenze 45/75 und 15/25, Anmeldung und ein 8–12-Wochen-Lernplan.',
  keywords:
    'Goethe-Zertifikat A2, Goethe A2 Prüfung, Goethe A2 Punkte, Goethe A2 bestanden, A2 Prüfung Vorbereitung, Goethe A2 Modellsatz, A2 Schreiben SMS E-Mail',
  badge: 'Leitfaden',
  lead:
    'Das <strong>Goethe-Zertifikat A2</strong> ist die erste Prüfung, bei der zwei Grenzen gleichzeitig gelten: Du brauchst genug Punkte <strong>im schriftlichen Teil</strong> und genug Punkte <strong>im Sprechen</strong>. Eine starke Lesenote rettet eine schwache mündliche Prüfung hier nicht mehr — anders als noch auf A1. Dieser Leitfaden zeigt dir den Aufbau der vier Teile, die genaue Punkterechnung, wie du dich anmeldest und einen realistischen Lernplan für 8 bis 12 Wochen.',
  datePublished: '2026-09-06',
  answer:
    'Das Goethe-Zertifikat A2 ist die A2-Deutschprüfung des Goethe-Instituts für Erwachsene; empfohlen wird sie ab 16 Jahren, ein Mindestalter gibt es nicht. Sie besteht aus vier Teilen: Lesen (30 Minuten), Hören (ca. 30 Minuten), Schreiben (30 Minuten) und Sprechen (ca. 15 Minuten, als Paarprüfung zu zweit). Jeder Teil zählt 25 Punkte, zusammen also 100. Bestanden ist die Prüfung ab 60 Punkten insgesamt — dabei brauchst du mindestens 45 von 75 Punkten in den drei schriftlichen Teilen und mindestens 15 von 25 Punkten im Sprechen. Wer eine dieser beiden Grenzen verfehlt, hat die gesamte Prüfung nicht bestanden, auch bei 60 Punkten in der Summe.',
  factsCheckedOn: '2026-09-05',
  sources: [
    {
      label: 'Goethe-Institut — Durchführungsbestimmungen Goethe-Zertifikat A2 (PDF, deutsch)',
      url: 'https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf',
    },
    {
      label: 'Goethe-Institut — Modellsatz Erwachsene, Goethe-Zertifikat A2 (PDF)',
      url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Modellsatz_Erwachsene.pdf',
    },
    {
      label: 'Goethe-Institut — Übungssatz 01 Erwachsene, Goethe-Zertifikat A2 (PDF)',
      url: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf',
    },
    {
      label: 'Goethe-Institut — Wortliste Goethe-Zertifikat A2 (PDF)',
      url: 'https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A2_Wortliste.pdf',
    },
    {
      label: 'Goethe-Institut — Weitere Informationen zum Goethe-Zertifikat A2',
      url: 'https://www.goethe.de/ins/de/de/prf/prf/gzsd2/wi2.html',
    },
    {
      label: 'Hochschulrektorenkonferenz — Sprachnachweis Deutsch für das Studium (DSH-2 / TestDaF)',
      url: 'https://www.hrk.de/themen/internationales/internationale-studierende-und-forschende/hochschulzugang-fuer-internationale-studierende/sprachnachweis-deutsch/',
    },
    {
      label: '§ 25b AufenthG (A2 als mündliche Voraussetzung), gesetze-im-internet.de',
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__25b.html',
    },
    {
      label: '§ 25a AufenthG (A2 als mündliche Voraussetzung), gesetze-im-internet.de',
      url: 'https://www.gesetze-im-internet.de/aufenthg_2004/__25a.html',
    },
  ],

  sections: [
    {
      id: 'ueberblick',
      heading: 'Was ist das Goethe-Zertifikat A2 — und wer braucht es?',
      blocks: [
        {
          type: 'p',
          text: 'Das <strong>Goethe-Zertifikat A2</strong> ist die A2-Deutschprüfung des Goethe-Instituts und weist die zweite Stufe des Gemeinsamen Europäischen Referenzrahmens (GER) nach: Du verstehst Sätze und häufige Ausdrücke aus dem eigenen Alltag — Arbeit, Wohnung, Einkaufen, Familie, Termine — und kannst dich in einfachen Routinesituationen verständigen.',
        },
        {
          type: 'p',
          text: 'Es gibt zwei Fassungen der Prüfung. Für die hier beschriebene Erwachsenenfassung wird ein Alter <strong>ab 16 Jahren empfohlen</strong> — eine Altersgrenze ist das nicht: Die Prüfungen des Goethe-Instituts können unabhängig vom Erreichen eines Mindestalters abgelegt werden. Für Jugendliche gibt es die inhaltlich passend zugeschnittene Variante <strong>Goethe-Zertifikat A2: Fit in Deutsch</strong>. Format, Punkte und Bestehensregel sind bei beiden gleich aufgebaut, die Themen und Textsorten unterscheiden sich. Die Erwachsenenprüfung hat die ältere Prüfung „Start Deutsch 2“ abgelöst — wenn dir dieser Name in älteren Kursbüchern begegnet, ist dieselbe Stufe gemeint.',
        },
        {
          type: 'p',
          text: 'Wer braucht A2? Im deutschen Aufenthaltsrecht wird das Niveau A2 unter anderem in <strong>§ 25a</strong> und <strong>§ 25b AufenthG</strong> ausdrücklich genannt. Beide verlangen jeweils „hinreichende mündliche Deutschkenntnisse im Sinne des Niveaus A2“ — für gut integrierte Jugendliche und junge Volljährige beziehungsweise für die Aufenthaltserlaubnis bei nachhaltiger Integration. Beachte das Wort <strong>mündlich</strong>: Der Gesetzestext knüpft dort an das Sprechen an, nicht an ein bestimmtes Zertifikat. Für die <strong>Chancenkarte</strong> wiederum verlangt § 20a AufenthG nur „mindestens einfache deutsche Sprachkenntnisse“ <strong>oder</strong> Englischkenntnisse auf Niveau B2; A2 bringt zusätzlich einen Punkt in der Punktetabelle der Anlage zu § 20b.',
        },
        {
          type: 'callout',
          text: 'Ob dein Antrag mit einem A2-Zeugnis vollständig ist, entscheidet immer die zuständige Ausländerbehörde oder Auslandsvertretung — nicht diese Seite und nicht ein Sprachkursanbieter. Frag dort nach, welches Niveau und welche Form des Nachweises in deinem Fall verlangt werden, bevor du einen Prüfungstermin buchst.',
        },
        {
          type: 'p',
          text: 'Daneben legen viele Menschen A2 ohne rechtlichen Anlass ab: als Zwischenziel auf dem Weg zu B1, als Nachweis für Arbeitgeber und Sprachschulen oder einfach, um nach einem Jahr Lernen einen belastbaren Beleg in der Hand zu haben. Für ein <strong>Studium</strong> reicht A2 nicht: Für die Zulassung verlangen deutsche Hochschulen nach der Rahmenordnung der Hochschulrektorenkonferenz einen Nachweis wie DSH-2 oder TestDaF mit 4×TDN 4 — also ein deutlich höheres Niveau. Welches Niveau ein <strong>Ausbildungsbetrieb</strong> erwartet, legt der Betrieb beziehungsweise die zuständige Kammer fest; frag dort nach, statt dich auf eine allgemeine Angabe zu verlassen.',
        },
      ],
    },
    {
      id: 'aufbau',
      heading: 'Der Aufbau: vier Teile, 90 Minuten schriftlich',
      blocks: [
        {
          type: 'p',
          text: 'Die Prüfung besteht aus vier Teilen. Lesen, Hören und Schreiben bilden zusammen die <strong>schriftliche Prüfung</strong> und dauern ohne Pause insgesamt etwa 90 Minuten. Das Sprechen ist die <strong>mündliche Prüfung</strong> und findet in der Regel zu zweit statt.',
        },
        {
          type: 'table',
          head: ['Teil', 'Dauer', 'Aufgaben', 'Punkte'],
          rows: [
            ['Lesen', '30 Min.', '4 Teile, 20 Aufgaben: kurze Mitteilungen und E-Mails, Anzeigen, Zeitungs- und Internettexte. In den Teilen 1–3 kreuzt du an, in Teil 4 ordnest du zu.', '25'],
            ['Hören', 'ca. 30 Min.', '4 Teile, 20 Aufgaben: Ansagen, Gespräche, Nachrichten auf dem Anrufbeantworter, Radiobeiträge und ein Interview.', '25'],
            ['Schreiben', '30 Min.', '2 Teile: eine kurze persönliche Nachricht (SMS) und eine halbformelle E-Mail, jeweils mit 3 Leitpunkten.', '25'],
            ['Sprechen', 'ca. 15 Min. zu zweit', '3 Teile: Fragen zur Person stellen und beantworten, über das eigene Leben erzählen, gemeinsam etwas planen.', '25'],
          ],
        },
        {
          type: 'p',
          text: 'Im Hören gibt es eine Falle, die man vorher kennen sollte: Nicht jeder Text läuft zweimal. In den <strong>Teilen 1, 3 und 4</strong> hörst du zweimal, im <strong>Teil 2 nur einmal</strong>. Genau dort verlieren viele Punkte, weil sie an einem unbekannten Wort hängen bleiben und den Rest der Aufnahme verpassen. Wer weiß, dass dieser Teil nur einmal läuft, liest die Aufgaben vorher und hört gezielt.',
        },
        {
          type: 'p',
          text: 'Das Sprechen ist eine <strong>Paarprüfung</strong> ohne Vorbereitungszeit: Du sprichst mit einer zweiten teilnehmenden Person, nicht nur mit der Prüferin oder dem Prüfer. Zuerst stellt ihr euch gegenseitig Fragen zur Person, dann erzählst du etwas aus deinem Alltag, und zum Schluss plant ihr gemeinsam etwas — zum Beispiel einen Ausflug oder ein Treffen. Der dritte Teil ist der, den man am wenigsten allein üben kann, und deshalb der, den die meisten unterschätzen.',
        },
        {
          type: 'callout',
          text: 'Der kostenlose Modellsatz zeigt dir alle vier Teile im Original-Layout, inklusive Antwortbogen. Ein einziger Durchgang damit erspart dir am Prüfungstag die Frage „Was soll ich hier eigentlich machen?“ — und die kostet mehr Zeit als jede Vokabellücke.',
        },
      ],
    },
    {
      id: 'punkte',
      heading: 'Punkte und Bestehensregel: zwei Grenzen, nicht eine',
      blocks: [
        {
          type: 'p',
          text: 'Jeder der vier Teile zählt maximal <strong>25 Punkte</strong>. Zusammen ergibt das <strong>100 Punkte</strong>: 75 aus der schriftlichen Prüfung (Lesen, Hören, Schreiben) und 25 aus dem Sprechen. Jeder der drei schriftlichen Teile wird auf <strong>20 Messpunkte</strong> bezogen, die mit dem Faktor 1,25 auf 25 Prüfungspunkte umgerechnet werden. In Lesen und Hören sind das 20 richtige Antworten — eine richtige Antwort ist dort also 1,25 Punkte wert. <strong>Schreiben wird dagegen nach Kriterien bewertet</strong>, nicht durch Abzählen richtiger Antworten: Es zählt, ob die Aufgabe erfüllt ist (alle drei Leitpunkte), wie der Text kommunikativ gestaltet ist und wie korrekt er sprachlich ist. Auch das <strong>Sprechen wird nach Kriterien bewertet</strong> — dort zählen unter anderem die Erfüllung der Aufgabe, die Verständigung mit der Partnerin oder dem Partner, der Wortschatz und die Aussprache.',
        },
        {
          type: 'p',
          text: 'Bestanden ist die Prüfung, wenn du insgesamt mindestens <strong>60 von 100 Punkten</strong> erreichst <strong>und</strong> dabei mindestens <strong>45 von 75 Punkten in der schriftlichen Prüfung</strong> sowie mindestens <strong>15 von 25 Punkten in der mündlichen Prüfung</strong>. Außerdem müssen alle Prüfungsteile abgelegt worden sein.',
        },
        {
          type: 'p',
          text: 'Das ist der Punkt, an dem sich A2 von A1 unterscheidet, und er wird oft übersehen: Es gibt <strong>zwei Hürden</strong>. 60 Punkte insgesamt reichen nicht, wenn davon nur 14 aus dem Sprechen kommen — dann gilt die gesamte Prüfung als nicht bestanden. Umgekehrt hilft ein sehr gutes Sprechen nicht, wenn die schriftliche Summe unter 45 liegt.',
        },
        {
          type: 'callout',
          text: 'Rechne rückwärts, nicht vorwärts: 15 von 25 Punkten im Sprechen sind 60 % einer Prüfung, in der du unter Zeitdruck und mit einer fremden Partnerin sprichst. Wer das Sprechen bis zwei Wochen vor dem Termin aufschiebt, plant genau die Hürde ein, die am schwersten kurzfristig zu heben ist.',
        },
        {
          type: 'p',
          text: 'Wie oft und in welcher Form du die Prüfung wiederholen kannst, regeln die Durchführungsbestimmungen. Wiederholen lässt sich dort entweder die <strong>mündliche</strong> oder die <strong>gesamte schriftliche</strong> Prüfung — nie ein einzelner Prüfungsteil, also zum Beispiel nicht Lesen allein. Und auch das nur in Ausnahmefällen und nur, wenn die organisatorischen Bedingungen am Prüfungszentrum es zulassen; verlass dich also nicht darauf. Frag dein Prüfungszentrum, bevor du dich zum zweiten Mal anmeldest.',
        },
      ],
    },
    {
      id: 'anmeldung',
      heading: 'Anmeldung und Übungsmaterial',
      blocks: [
        {
          type: 'p',
          text: 'Die Prüfung legst du an einem Goethe-Institut oder an einem lizenzierten Prüfungszentrum ab. Welche Zentren das in deiner Stadt oder deinem Land sind, steht auf goethe.de; Termine, Anmeldeweg und Fristen stehen auf der Seite des jeweiligen Zentrums. Plane den Vorlauf großzügig: In Städten mit wenigen Zentren sind A2-Termine oft Wochen im Voraus belegt.',
        },
        {
          type: 'p',
          text: 'Zum Üben stellt das Goethe-Institut kostenlos einen <strong>Modellsatz</strong> und einen <strong>Übungssatz</strong> für Erwachsene bereit, jeweils mit Kandidatenblättern, Lösungen und den Hördateien. Beide entsprechen der echten Prüfung in Aufgabentypen, Aufgabenzahl und Zeitvorgaben — das ist der Grund, warum ein Durchgang damit mehr wert ist als drei Kapitel in einem beliebigen Lehrbuch.',
        },
        {
          type: 'p',
          text: 'Ebenfalls kostenlos: die <strong>Wortliste zum Goethe-Zertifikat A2</strong>. Sie umfasst rund <strong>1.300 lexikalische Einheiten</strong> — das ist der Wortschatz, den die Prüfung voraussetzt. Wer diese Liste erst zwei Wochen vor dem Termin entdeckt, hat vorher fast sicher am Bedarf vorbei gelernt. Sie gehört an den Anfang der Vorbereitung, nicht ans Ende.',
        },
        {
          type: 'list',
          items: [
            'Modellsatz und Übungssatz Erwachsene, mit Lösungen und Audios — kostenlos beim Goethe-Institut',
            'Wortliste A2 mit rund 1.300 Einträgen, thematisch und alphabetisch geordnet',
            'Die Durchführungsbestimmungen: dort stehen Punkte, Bestehensgrenzen und die Regeln zum Prüfungsablauf',
            'Die Terminliste deines Prüfungszentrums — der Engpass ist oft der Termin, nicht die Vorbereitung',
          ],
        },
      ],
    },
    {
      id: 'lernplan',
      heading: 'Ein realistischer Lernplan über 8 bis 12 Wochen',
      blocks: [
        {
          type: 'p',
          text: 'Das Goethe-Institut rechnet je nach Vorkenntnissen und Lernbedingungen mit <strong>200 bis 350 Unterrichtseinheiten à 45 Minuten</strong> bis zum Niveau A2 — das ist der Weg von null, nicht der Weg von A1. Dieser Plan setzt ein <strong>abgeschlossenes A1-Niveau</strong> voraus und deckt nur die letzte Etappe ab. Bei 45 bis 60 Minuten Lernzeit am Tag sind dafür 8 bis 12 Wochen realistisch. Wenn du weniger als vier Tage pro Woche lernst, plane eher am oberen Ende — und wenn du bei null anfängst, ist A1 der richtige Startpunkt, nicht dieser Plan.',
        },
        {
          type: 'p',
          text: 'Bevor du loslegst: Mach den <a href="/level-test/">kostenlosen Einstufungstest</a>. Er zeigt dir in etwa 20 Minuten, ob du wirklich auf A1-Niveau stehst oder ob unten noch Lücken sind, die dich später Punkte kosten.',
        },
        {
          type: 'steps',
          items: [
            {
              label: 'Woche 1–2',
              title: 'Die Fälle sortieren: Dativ und Akkusativ',
              tasks: [
                'Dativ als drittes Puzzleteil: wem? statt wen? — mit Artikeln, Possessivartikeln und Pronomen',
                'Die Dativverben lernen, die täglich vorkommen: helfen, gefallen, gehören, schmecken, passen',
                'Wechselpräpositionen: wo? mit Dativ, wohin? mit Akkusativ — an, auf, in, neben, über, unter, vor',
                'Jeden Tag zehn Minuten laut sprechen, nicht nur ankreuzen',
              ],
              tip: 'Dativ und Akkusativ sind auf A2 kein Grammatikthema unter vielen — sie stecken in fast jedem Satz, den du in Schreiben und Sprechen produzierst. Wer sie hier sauber sortiert, spart in Woche 8 die Fehlersuche.',
            },
            {
              label: 'Woche 3–4',
              title: 'Über Vergangenes sprechen',
              tasks: [
                'Perfekt mit haben und sein für die Verben, die im Alltag wirklich vorkommen',
                'Perfekt der trennbaren Verben (eingekauft, angerufen) und der Verben auf -ieren (telefoniert)',
                'Präteritum der Modalverben plus war und hatte: „Ich konnte gestern nicht kommen.“',
                'Eine kurze Wochenrückschau schreiben — fünf Sätze, jeden Tag',
              ],
              tip: 'Im Sprechen Teil 2 erzählst du aus deinem Leben. Ohne sicheres Perfekt bleibt dieser Teil bei Aufzählungen im Präsens stecken, und genau dafür gibt es weniger Punkte.',
            },
            {
              label: 'Woche 5–6',
              title: 'Wortschatz nach der offiziellen Liste',
              tasks: [
                'Die A2-Wortliste thematisch durcharbeiten: Wohnen, Arbeit, Gesundheit, Reisen, Ämter, Freizeit',
                'Adjektivendungen nach der, die, das und nach ein, eine, mein — erst Nominativ und Akkusativ, dann Dativ',
                'Zeitangaben sicher beherrschen: vor, nach, seit, ab, bis, von … bis, zwischen',
                'Täglich eine Hörübung auf A2-Niveau, im normalen Sprechtempo',
              ],
              tip: 'Die Wortliste orientiert sich an dem, was die Prüfung voraussetzt; eine zufällige App-Lektion tut das nicht — bei gleichem Zeitaufwand.',
            },
            {
              label: 'Woche 7–8',
              title: 'Die vier Aufgabentypen einzeln trainieren',
              tasks: [
                'SMS schreiben: 20–30 Wörter, alle drei Leitpunkte, passende Anrede und passender Gruß',
                'Halbformelle E-Mail schreiben: 30–40 Wörter, höflicher Ton, alle drei Leitpunkte',
                'Hören Teil 2 gezielt üben — der Teil, der nur einmal läuft',
                'Lesen Teil 4 üben: zuordnen statt ankreuzen, das ist ein anderer Lesevorgang',
              ],
              tip: 'Über die Punkte im Schreiben entscheidet nicht nur die Grammatik: Ein fehlender Leitpunkt trifft ein eigenes Bewertungskriterium — kleine Grammatikfehler tun das nicht.',
            },
            {
              label: 'Woche 9–10',
              title: 'Erster kompletter Modelltest, dann gezielt schließen',
              tasks: [
                'Einen Modellsatz vollständig unter Zeitbedingungen durcharbeiten',
                'Punkte pro Teil notieren und gegen die zwei Grenzen prüfen: 45/75 schriftlich, 15/25 mündlich',
                'Den schwächsten Teil identifizieren und in den Rest der Vorbereitung priorisieren',
                'Das Sprechen ab jetzt täglich laut üben, nicht nur im Kopf',
              ],
              tip: 'Ein erstes Ergebnis unter 60 Punkten ist an dieser Stelle normal. Der Test ist eine Messung, keine Note — dafür machst du ihn zwei Wochen vorher und nicht am Vorabend.',
            },
            {
              label: 'Woche 11–12',
              title: 'Generalprobe und Prüfungslogistik',
              tasks: [
                'Den Übungssatz als zweiten kompletten Durchgang, wieder mit Uhr',
                'Den dritten Sprechteil mit einer echten Person üben: gemeinsam etwas planen und aushandeln',
                'Keine neuen Themen mehr — nur festigen, was schon sitzt',
                'Anmeldebestätigung, Ausweisdokument und Anfahrt zum Prüfungszentrum klären',
              ],
              tip: 'Den Planungsteil im Sprechen kann man nicht allein simulieren. Ein einziger Übungsdurchgang mit einer zweiten Person verändert dort mehr als zehn stille Wiederholungen.',
            },
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Die häufigsten Fehler auf dem Weg zu A2',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Nur auf die Gesamtpunktzahl schauen',
              body: 'Die 60 von 100 Punkten sind die bekannteste Zahl — und allein sagen sie nichts. Es gibt zwei Mindestgrenzen: 45 von 75 schriftlich und 15 von 25 im Sprechen. Wer nur die Summe im Blick hat, merkt zu spät, dass ein schwaches Sprechen die ganze Prüfung kippt.',
            },
            {
              title: 'Das Sprechen bis zum Schluss aufschieben',
              body: 'Sprechen ist der einzige Teil, der nicht allein und nicht schweigend geübt werden kann, und der einzige mit einer eigenen Hürde. Wer erst in der letzten Woche anfängt, laut zu sprechen, hat für den schwersten Prüfungsteil die kürzeste Vorbereitung eingeplant.',
            },
            {
              title: 'Einen Leitpunkt im Schreiben auslassen',
              body: 'SMS und E-Mail haben je drei Leitpunkte, und alle drei müssen vorkommen. Ein ausgelassener Leitpunkt trifft das Kriterium „Erfüllung der Aufgabenstellung“ direkt — auch dann, wenn der Text sonst gut klingt.',
            },
            {
              title: 'Hören Teil 2 wie die anderen Teile behandeln',
              body: 'Dieser Teil läuft nur einmal. Wer wie in Teil 1 auf den zweiten Durchgang wartet, verliert fünf Aufgaben auf einmal. Die Aufgaben vorher lesen und gezielt auf die gesuchte Information hören ist hier wichtiger als jedes Vokabeltraining.',
            },
            {
              title: 'Mit A1-Mitteln zur A2-Prüfung gehen',
              body: 'A2 verlangt Dativ, Wechselpräpositionen, Perfekt und Objektpronomen als selbstverständliches Werkzeug. Wer diese Strukturen nur wiedererkennt, aber nicht produziert, versteht die Aufgaben — und kommt trotzdem im Schreiben und Sprechen nicht über eine A1-Antwort hinaus.',
            },
            {
              title: 'Ohne den Modellsatz in die Prüfung gehen',
              body: 'Der Modellsatz ist kostenlos und zeigt Aufgabentypen, Aufgabenzahl und Zeitvorgaben der echten Prüfung. Ihn nicht zu benutzen heißt, das Format am Prüfungstag zum ersten Mal zu sehen — und Zeit für Orientierung auszugeben, die im Zeitlimit nicht eingeplant ist.',
            },
          ],
        },
      ],
    },
    {
      id: 'vorbereitung-mit-deutschmeister',
      heading: 'Wie DeutschMeister auf das Goethe-Zertifikat A2 vorbereitet',
      blocks: [
        {
          type: 'p',
          text: 'A2 prüft vier Fertigkeiten mit festen Aufgabentypen und zwei getrennten Hürden. Genau danach ist die Vorbereitung hier aufgebaut — von einem Team, das die deutschen Sprachprüfungen selbst durchlaufen ist:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Grammatik',
              title: `Die A2-Strukturen, Schritt für Schritt`,
              body: `Dativ, Wechselpräpositionen, Perfekt, Objektpronomen, Modalverben in der Vergangenheit und Adjektivendungen — die Strukturen, aus denen A2-Antworten bestehen (${GRAMMAR_TOPIC_COUNT} Themen insgesamt, A1.1–B2.2).`,
            },
            {
              eyebrow: 'Hören',
              title: 'Ohren an das normale Tempo gewöhnen',
              body: `${LISTENING_EXERCISE_COUNT} Hörübungen mit Muttersprachler-Dialogen, nach Niveau gestaffelt — Ansagen, Gespräche und Nachrichten, also die Textsorten, an denen sich Hören Teil 1 bis 4 orientiert.`,
            },
            {
              eyebrow: 'Lesen',
              title: 'Anzeigen, E-Mails und kurze Artikel',
              body: `${READING_LESSON_COUNT} Lesetexte nach Niveau — mit dem Wechsel zwischen Ankreuzen und Zuordnen, den die Prüfung in den Teilen 1 bis 4 verlangt.`,
            },
            {
              eyebrow: 'Schreiben',
              title: 'SMS und E-Mail mit Leitpunkten',
              body: 'Schreib die Aufgabenform der Prüfung — kurze Nachricht und halbformelle E-Mail — und bekomm sofort Rückmeldung zu Leitpunkten, Anrede, Gruß und Verbstellung an deinen eigenen Sätzen.',
            },
            {
              eyebrow: 'Sprechen',
              title: 'Die Hürde, die man nicht anlesen kann',
              body: 'Das KI-Sprechtraining übt Fragen zur Person, Erzählen aus dem Alltag und gemeinsames Planen — täglich, ohne Termin und ohne Partner, mit sofortigem Feedback.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Der geführte Weg dorthin ist der A2.1-Kurs: <a href="/level/a2.1">A2.1 im Kursbereich öffnen</a>. Die Regeln zum Nachschlagen stehen in der <a href="/grammar/a2.1/">A2.1-Grammatikbibliothek</a>, und wie sich das gegen andere Anbieter schlägt, steht im <a href="/vergleich/">Vergleich</a>. Wenn du noch nicht weißt, wo du stehst, beginn mit dem <a href="/level-test/">Einstufungstest</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Wie viele Punkte braucht man beim Goethe-Zertifikat A2?',
      a: 'Insgesamt mindestens 60 von 100 Punkten. Zusätzlich gelten zwei Mindestgrenzen: mindestens 45 von 75 Punkten in der schriftlichen Prüfung (Lesen, Hören, Schreiben) und mindestens 15 von 25 Punkten im Sprechen. Wird eine der beiden Grenzen verfehlt, gilt die gesamte Prüfung als nicht bestanden — auch dann, wenn die Gesamtsumme bei 60 Punkten oder darüber liegt.',
    },
    {
      q: 'Wie lange dauert die Prüfung?',
      a: 'Die schriftliche Prüfung dauert insgesamt etwa 90 Minuten ohne Pause: Lesen 30 Minuten, Hören etwa 30 Minuten, Schreiben 30 Minuten. Das Sprechen dauert etwa 15 Minuten für zwei Teilnehmende und findet an einem eigenen Termin oder direkt im Anschluss statt — das legt das jeweilige Prüfungszentrum fest.',
    },
    {
      q: 'Ist die mündliche Prüfung eine Paarprüfung?',
      a: 'Ja, das Sprechen ist in der Regel eine Paarprüfung mit zwei Teilnehmenden und dauert dafür etwa 15 Minuten. Es gibt keine Vorbereitungszeit. Der Teil besteht aus drei Aufgaben: Fragen zur Person stellen und beantworten, etwas über das eigene Leben erzählen, und mit der Partnerin oder dem Partner gemeinsam etwas planen.',
    },
    {
      q: 'Was muss man beim Goethe-Zertifikat A2 schreiben?',
      a: 'Der Prüfungsteil Schreiben hat zwei Aufgaben und dauert 30 Minuten. In Teil 1 schreibst du eine kurze persönliche Nachricht, etwa eine SMS an eine Freundin oder einen Freund, mit rund 20 bis 30 Wörtern. In Teil 2 folgt eine halbformelle E-Mail mit rund 30 bis 40 Wörtern. Beide Aufgaben geben drei Leitpunkte vor, und alle drei müssen bearbeitet werden.',
    },
    {
      q: 'Wie viele Aufgaben haben Lesen und Hören?',
      a: 'Lesen und Hören haben je vier Teile mit zusammen 20 Aufgaben. Im Lesen kreuzt du in den Teilen 1 bis 3 an und ordnest in Teil 4 zu. Im Hören hörst du die Teile 1, 3 und 4 zweimal, Teil 2 dagegen nur einmal — das ist die Stelle, an der ein unbekanntes Wort am meisten kostet.',
    },
    {
      q: 'Wo finde ich kostenloses Übungsmaterial für A2?',
      a: 'Das Goethe-Institut stellt für Erwachsene einen Modellsatz und einen Übungssatz kostenlos bereit, jeweils mit Kandidatenblättern, Lösungen und Hördateien. Beide entsprechen der Prüfung in Aufgabentypen, Aufgabenzahl und Zeitvorgaben. Dazu kommt die Wortliste zum Goethe-Zertifikat A2 mit rund 1.300 lexikalischen Einheiten — der Wortschatz, den die Prüfung voraussetzt.',
    },
    {
      q: 'Für welches Alter ist die Prüfung gedacht?',
      a: 'Für die Erwachsenenfassung wird ein Alter ab 16 Jahren empfohlen. Ein Mindestalter gibt es aber nicht: Die Prüfungen des Goethe-Instituts können unabhängig vom Erreichen eines Mindestalters abgelegt werden. Wer jünger ist, ist mit dem Goethe-Zertifikat A2: Fit in Deutsch oft besser bedient — dieselben vier Prüfungsteile, aber Themen und Textsorten für Jugendliche. Das Goethe-Zertifikat A2 hat die frühere Prüfung Start Deutsch 2 abgelöst.',
    },
    {
      q: 'Reicht ein A2-Zeugnis für meinen Aufenthaltstitel?',
      a: 'Das hängt vom Aufenthaltstitel ab und entscheidet die zuständige Behörde. Im Aufenthaltsgesetz wird A2 unter anderem in § 25a und § 25b ausdrücklich genannt, dort jeweils als „hinreichende mündliche Deutschkenntnisse im Sinne des Niveaus A2“. Für die Chancenkarte verlangt § 20a nur mindestens einfache Deutschkenntnisse oder Englisch auf B2; A2 bringt einen zusätzlichen Punkt in der Punktetabelle. Kläre deinen Fall vor der Anmeldung mit der Ausländerbehörde oder der Auslandsvertretung.',
    },
    {
      q: 'Wie lange dauert die Vorbereitung von A1 auf A2?',
      a: 'Das Goethe-Institut rechnet mit 200 bis 350 Unterrichtseinheiten à 45 Minuten bis zum Niveau A2 — von null gerechnet. Mit abgeschlossenem A1 und 45 bis 60 Minuten Lernzeit am Tag sind für die letzte Etappe 8 bis 12 Wochen realistisch, davon die letzten zwei bis vier Wochen als reine Prüfungsphase mit Modellsatz und Übungssatz. Wer seltener als viermal pro Woche lernt, sollte eher mit dem oberen Ende planen. Der Einstufungstest zeigt dir vorher, ob A1 wirklich sitzt.',
    },
  ],

  cta: {
    heading: 'Finde heraus, wo du vor dem Goethe-Zertifikat A2 stehst',
    body: 'Der Einstufungstest zeigt dir in etwa 20 Minuten, ob dein A1 trägt und welche A2-Themen noch fehlen — danach weißt du, wie viel der 8 bis 12 Wochen du wirklich brauchst.',
  },
};
