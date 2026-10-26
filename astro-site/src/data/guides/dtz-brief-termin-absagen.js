// DTZ Brief: einen Termin absagen — exam long-tail page (backlog d2, 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "dtz brief termin absagen", "dtz brief entschuldigung schule",
// "brief termin verschieben b1", "dtz brief beispiele".
//
// FACTS (checked 2026-10-26 on the vendors' own pages): same as
// dtz-brief-vermieter.js — BAMF (100 written minutes incl. a short letter; the
// B1 overall rule), telc DTZ Übungstest (semi-formal and formal messages, one
// writing task, 30 minutes, four Leitpunkte, four rating criteria), telc's
// "Auf jeden Fall" DTZ practice test (choose task A or B; greeting and closing).
// Task, model letter and Redemittel are our own material.

export const dtzBriefTerminAbsagen = {
  slug: 'dtz-brief-termin-absagen',
  lang: 'de',
  offer: 'dtz-waitlist',
  title: 'DTZ Brief: Termin absagen & verschieben (Muster)',
  h1: 'DTZ Brief: einen Termin absagen und einen neuen vorschlagen — mit Musterbrief',
  description:
    'Einen Termin im DTZ-Brief höflich absagen: Entschuldigung, Grund, neuer Vorschlag. Musterbrief an die Schule, Aufbau mit vier Leitpunkten und Redemittel.',
  keywords:
    'DTZ Brief Termin absagen, DTZ Brief Entschuldigung, Termin verschieben Brief B1, DTZ Brief Schule, DTZ Brief schreiben Beispiel',
  badge: 'Musterbrief · DTZ',
  lead:
    'Ein Termin beim Amt, ein Elternabend, ein Gespräch mit der Kursleiterin — und Sie können nicht kommen. Solche Absagen sind ein typischer Anlass im Schreibteil des <strong>Deutsch-Tests für Zuwanderer</strong>. Hier lernen Sie, wie Sie höflich absagen, einen Grund nennen und einen neuen Termin vorschlagen, ohne einen Leitpunkt zu vergessen.',
  datePublished: '2026-10-26',
  answer:
    'Eine Terminabsage im DTZ ist eine halbformelle oder formelle Mitteilung, für die Sie 30 Minuten haben. Sie bearbeiten vier Leitpunkte, meistens: sich entschuldigen, den Grund nennen, einen neuen Termin vorschlagen und eine Frage oder Bitte. Der sichere Aufbau: „Sehr geehrte Frau …", ein Satz zum Anlass, ein Absatz pro Leitpunkt, „Mit freundlichen Grüßen". Bewertet werden laut telc Aufgabenbewältigung, kommunikative Gestaltung, Korrektheit und Wortschatz.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'BAMF — Abschlussprüfung (DTZ)', url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html' },
    { label: 'telc — Übungstest 2 DTZ (PDF)', url: 'https://shop.telc.net/media/catalog/product/file//5/0/5010-b00-030101_barrierefrei_bib.pdf' },
    { label: 'telc — Übungstest DTZ, Auf jeden Fall B1.2 (PDF)', url: 'https://www.telc.net/fileadmin/user_upload/Downloads_Verlag/Auf_jeden_Fall/Uebungstests/Auf_jeden_Fall_B1.2_UEbungstest_DTZ.pdf' },
  ],

  sections: [
    {
      id: 'aufgabe',
      heading: 'Die Absage als DTZ-Schreibaufgabe',
      blocks: [
        {
          type: 'p',
          text: 'Im DTZ haben Sie für das Schreiben <strong>30 Minuten</strong>. telc beschreibt die Aufgabe als „Halbformelle und formelle Mitteilungen verfassen". Eine Absage passt genau dazu: Sie schreiben an eine Person oder Stelle, die Sie siezen — Schule, Kita, Arztpraxis, Jobcenter, Kursleitung oder Arbeitgeber.',
        },
        {
          type: 'p',
          text: 'Die Aufgabe nennt vier Leitpunkte. Bei Absagen wiederholen sich die Inhalte oft: <strong>Entschuldigung, Grund, neuer Termin, Frage oder Bitte</strong>. Wenn Sie diese vier Bausteine sicher formulieren können, sind Sie für viele Aufgaben vorbereitet.',
        },
        {
          type: 'table',
          head: ['Leitpunkt', 'Was Sie schreiben', 'Beispielsatz'],
          rows: [
            ['Entschuldigung', 'Höflich sagen, dass Sie nicht kommen', 'Leider kann ich am Donnerstag nicht zum Elternabend kommen.'],
            ['Grund', 'Kurz und konkret erklären', 'An diesem Abend muss ich bis 21 Uhr arbeiten.'],
            ['Neuer Termin', 'Einen oder zwei Vorschläge machen', 'Wäre ein Gespräch am Montag nach 16 Uhr möglich?'],
            ['Frage oder Bitte', 'Etwas klären, was Ihnen wichtig ist', 'Könnten Sie mir die Informationen vom Abend schicken?'],
          ],
        },
      ],
    },
    {
      id: 'musterbrief',
      heading: 'Musterbrief: Absage für den Elternabend',
      blocks: [
        {
          type: 'p',
          text: 'Übungsaufgabe (eigene Aufgabe im DTZ-Stil): Die Klassenlehrerin Ihrer Tochter, Frau Schneider, lädt zum Elternabend ein. Sie können nicht kommen. Schreiben Sie an Frau Schneider. Schreiben Sie etwas zu allen vier Punkten:',
        },
        {
          type: 'list',
          items: [
            'Entschuldigung',
            'Grund',
            'Bitte um ein persönliches Gespräch',
            'wann Sie Zeit haben',
          ],
        },
        {
          type: 'model',
          label: 'Musterbrief (ca. 110 Wörter)',
          lines: [
            'Sehr geehrte Frau Schneider,',
            'vielen Dank für die Einladung zum Elternabend am Donnerstag. Leider kann ich an diesem Abend nicht kommen. Das tut mir sehr leid.',
            'Ich arbeite in einem Supermarkt, und in dieser Woche habe ich Spätschicht bis 21 Uhr. Ich habe schon mit meinem Chef gesprochen, aber ich kann die Schicht leider nicht tauschen.',
            'Mir ist es sehr wichtig zu wissen, wie es meiner Tochter Mira in der Schule geht. Deshalb möchte ich Sie um ein persönliches Gespräch bitten.',
            'Ich habe am Montag und am Mittwoch ab 14 Uhr Zeit. Sie können mich auch gern unter 0151 9876543 anrufen.',
            'Vielen Dank für Ihr Verständnis.',
            '',
            'Mit freundlichen Grüßen',
            'Ahmad Rahimi',
          ],
        },
        { type: 'h3', text: 'Warum dieser Brief funktioniert' },
        {
          type: 'list',
          items: [
            '<strong>Entschuldigung</strong> im ersten Absatz, freundlich und direkt.',
            '<strong>Grund</strong> mit Detail (Spätschicht, Schicht nicht tauschbar) — glaubwürdig und konkret.',
            '<strong>Bitte</strong> klar formuliert: „Deshalb möchte ich Sie um ein persönliches Gespräch bitten."',
            '<strong>Zeiten</strong> mit Tagen und Uhrzeit, dazu eine Telefonnummer. Die Lehrerin kann sofort antworten.',
          ],
        },
      ],
    },
    {
      id: 'varianten',
      heading: 'Dieselbe Struktur, andere Anlässe',
      blocks: [
        {
          type: 'p',
          text: 'Der Aufbau bleibt gleich, nur die Wörter ändern sich. Drei Varianten, die Sie mit demselben Gerüst schreiben können:',
        },
        {
          type: 'cards',
          items: [
            {
              eyebrow: 'Arztpraxis',
              title: 'Termin verschieben',
              body: 'Leider kann ich meinen Termin am Dienstag um 9 Uhr nicht wahrnehmen, weil mein Sohn krank ist. Hätten Sie am Freitag einen freien Termin?',
            },
            {
              eyebrow: 'Deutschkurs',
              title: 'Fehlen entschuldigen',
              body: 'Ich kann morgen nicht zum Kurs kommen, weil ich einen Termin bei der Ausländerbehörde habe. Könnten Sie mir bitte die Hausaufgaben schicken?',
            },
            {
              eyebrow: 'Amt',
              title: 'Neuen Termin erbitten',
              body: 'Den Termin am 14. Mai muss ich leider absagen, da ich an diesem Tag ein Vorstellungsgespräch habe. Ich bitte Sie um einen neuen Termin in der folgenden Woche.',
            },
            {
              eyebrow: 'Arbeitgeber',
              title: 'Kurzfristig absagen',
              body: 'Leider kann ich morgen nicht zur Arbeit kommen, da meine Tochter Fieber hat. Ich bringe Ihnen die Bescheinigung vom Arzt so schnell wie möglich.',
            },
          ],
        },
      ],
    },
    {
      id: 'redemittel',
      heading: 'Redemittel zum Absagen und Verschieben',
      blocks: [
        { type: 'h3', text: 'Sich entschuldigen' },
        {
          type: 'list',
          items: [
            'Leider kann ich am … nicht kommen.',
            'Es tut mir sehr leid, aber ich muss den Termin am … absagen.',
            'Bitte entschuldigen Sie, dass ich so kurzfristig absage.',
          ],
        },
        { type: 'h3', text: 'Einen Grund nennen' },
        {
          type: 'list',
          items: [
            'Der Grund ist, dass …',
            'An diesem Tag muss ich … , deshalb …',
            'Mein Kind ist krank, und ich kann es nicht allein lassen.',
          ],
        },
        { type: 'h3', text: 'Einen neuen Termin vorschlagen' },
        {
          type: 'list',
          items: [
            'Wäre auch ein Termin am … möglich?',
            'Ich hätte am … ab … Uhr Zeit.',
            'Könnten wir den Termin auf … verschieben?',
          ],
        },
        { type: 'h3', text: 'Bitten und abschließen' },
        {
          type: 'list',
          items: [
            'Könnten Sie mir bitte … schicken?',
            'Bitte geben Sie mir kurz Bescheid, ob das möglich ist.',
            'Vielen Dank für Ihr Verständnis.',
          ],
        },
      ],
    },
    {
      id: 'fehler',
      heading: 'Was bei Absagen oft schiefgeht',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Kein Grund oder ein zu vager Grund',
              body: '„Ich habe keine Zeit" ist schwach. Nennen Sie einen konkreten Grund: Arbeit, Krankheit, ein anderer Termin. Das ist meist auch ein eigener Leitpunkt.',
            },
            {
              title: 'Der neue Termin fehlt',
              body: 'Wer nur absagt, beendet den Kontakt. Wenn die Aufgabe einen Vorschlag verlangt, nennen Sie Tag und Uhrzeit.',
            },
            {
              title: 'Gruß oder Anrede vergessen',
              body: 'telc erinnert in den Übungstests ausdrücklich an Anrede und Gruß. Beides kostet Sie zehn Sekunden — und fehlt trotzdem oft.',
            },
            {
              title: 'Zu viel erzählen',
              body: 'Eine lange Geschichte über den Grund kostet Zeit, die dann bei den anderen Leitpunkten fehlt. Zwei Sätze pro Leitpunkt reichen.',
            },
          ],
        },
      ],
    },
    {
      id: 'ueben',
      heading: 'So üben Sie Absagen für den DTZ',
      blocks: [
        {
          type: 'p',
          text: 'Nehmen Sie jede Woche zwei Anlässe aus Ihrem Alltag — Kita, Arzt, Jobcenter, Kurs — und schreiben Sie eine Absage in 30 Minuten. Prüfen Sie danach mit der Tabelle oben: Sind alle vier Leitpunkte da?',
        },
        {
          type: 'p',
          text: 'Das <a href="/schreiben">KI-Schreibtraining</a> hat noch keine eigenen DTZ-Aufgaben, aber seine telc-B1-Aufgaben üben dieselbe halbformelle Mitteilung mit Leitpunkten und bewerten sie nach Aufgabenerfüllung, Aufbau, Korrektheit und Wortschatz. Einen weiteren Musterbrief finden Sie im Leitfaden <a href="/leitfaden/dtz-brief-vermieter/">DTZ-Brief an den Vermieter</a>, den Ablauf der Prüfung im <a href="/leitfaden/dtz/">DTZ-Leitfaden</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'Ist eine Absage im DTZ formell oder informell?',
      a: 'Laut telc schreiben Sie im DTZ halbformelle oder formelle Mitteilungen. Eine Absage an Schule, Arzt, Amt oder Kursleitung schreiben Sie deshalb in der Sie-Form mit „Sehr geehrte …" und „Mit freundlichen Grüßen".',
    },
    {
      q: 'Wie lang muss mein Brief sein?',
      a: 'Sie haben 30 Minuten und vier Leitpunkte. Der Musterbrief hier hat rund 110 Wörter. Wichtiger als die Länge ist, dass jeder Leitpunkt mit eigenen Sätzen bearbeitet ist.',
    },
    {
      q: 'Was ist der Unterschied zwischen „absagen" und „verschieben"?',
      a: 'Absagen heißt: Der Termin findet für Sie nicht statt. Verschieben heißt: Sie möchten einen anderen Zeitpunkt. In vielen Aufgaben machen Sie beides — Sie sagen ab und schlagen einen neuen Termin vor.',
    },
    {
      q: 'Darf ich im Brief einen erfundenen Grund nennen?',
      a: 'Ja. In der Prüfung zählt, dass der Grund zur Aufgabe passt und verständlich ist. Ob er in Ihrem echten Leben stimmt, spielt keine Rolle.',
    },
    {
      q: 'Kann ich im DTZ zwischen zwei Schreibaufgaben wählen?',
      a: 'In den Übungstests von telc wählen Sie zwischen Aufgabe A und Aufgabe B. Die verbindlichen Angaben für Ihren Termin bekommen Sie beim Prüfungszentrum.',
    },
  ],

  cta: {
    heading: 'DTZ-Briefe und Modelltest üben',
    body: 'Mit einem kostenlosen Konto üben Sie Briefe mit Leitpunkten und, solange Pro läuft, den zeitgesteuerten DTZ-Modelltest. Der Einstufungstest zeigt Ihnen vorher, wo Sie stehen.',
  },
};
