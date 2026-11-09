// Competitor comparison content (German). Rendered by the SPA and by the Astro
// /vergleich/ pages — the two copies of this file are byte-identical and CI
// enforces it (scripts/check-duplicates.mjs).
//
// Our own prices and allowances come from ./pricing.js and ./marketing.js.
// Never retype them here.
//
// 2026-08-22: ten claims that Deutschmeister's AI speaking is "unbegrenzt"
// (unlimited) were removed. The server has always capped Pro at 30 sessions a
// month (PRO_MONTHLY_LIMIT, netlify/functions/_shared/speakingUsage.mjs), and
// X-Ray at 50 analyses a day, so "unbegrenzt" beside a price was a false
// statement about our own product on the pages that sell it — irreführende
// Werbung under UWG §5, not a wording preference. The real figure is still the
// stronger claim against scripted-scenario competitors: say the number.
//
// 2026-10-25: our OWN claims corrected to what the product does (UWG §5/§6 on
// pages that name competitors; tests/claims.test.mjs and
// tests/comparison-claims.test.mjs hold each rule):
//   - exam preparation names only the exams with a track in examTracks.js
//     (Goethe, telc, DTZ; A1–B2). TestDaF, DSH, ÖSD and C1/C2 are not offered,
//     the facts the support agent states (_shared/supportAgentLib.mjs);
//   - speaking is free conversation on the learner's level with an evaluation
//     AFTER the conversation — never "Echtzeit", "Live-Feedback" or "korrigiert",
//     and never tuned to an exam;
//   - the allowance is stated with its session length
//     (PRO_INCLUDED_SESSION_MINUTES): only 5-minute sessions are included;
//   - no outcome promise ("bringt dich durch die Prüfung", "denselben
//     Lerneffekt"), and no uniqueness claim for Sentence X-Ray;
//   - unsourced claims about a competitor's quality were removed, not replaced;
//   - every completed course prints a Teilnahmebescheinigung, and the product
//     shows a day streak — the table says so.
//
// THE SYMBOLS are read from the learner's side: ✓ good for the learner, ○
// partly, ✗ missing; a cell without a symbol is a neutral statement. The
// renderer colours by the symbol (vergleich/[slug].astro), so an ad-free cell
// carries ✓, never the ✗ of "keine". A competitor's cell is changed only in its
// symbol, never in its facts.
//
// COMPETITOR figures below are stamped "Stand: Mai 2026" and have NOT been
// re-verified since. The stamp is deliberate — it labels the data as of a date
// rather than implying it is current. Re-check the three competitors' public
// pricing before removing or advancing any stamp.
//
// RE-VERIFICATION ATTEMPTED 2026-08-22 — NOT COMPLETED, STAMPS LEFT ALONE.
// babbel.com, goethe.de and the other vendor domains are blocked by this
// environment's egress proxy, so no figure could be checked at its source.
// Third-party price aggregators (reachable) suggest all three have RISEN since
// May: Babbel around 8,99 €/Monat im Jahresabo (was 6,99) and up to 17,99 € im
// 3-Monats-Abo (was 12,99); Duolingo Super around 7,49 €/Monat im Jahresabo
// (was 6,99); Lingoda group tiers from about 49,99 € für 4 Stunden.
//
// Those numbers are NOT written in below, on purpose. Two reasons: an
// aggregator is not the vendor, and a comparison that overstates a
// competitor's price is exactly the kind of claim §6 UWG makes actionable.
// Note also that the current, lower figures are the CONSERVATIVE direction —
// they make our own price look less favourable, so leaving them costs us
// nothing but accuracy owed to the reader. Re-check from a network that can
// reach the vendors, then update figures and stamps together.
import { PLANS, deEur } from './pricing.js';
import {
  PRO_SPEAKING_SESSIONS_PER_MONTH,
  PRO_INCLUDED_SESSION_MINUTES,
  PRO_DAILY_LIMIT,
  LEVEL_COUNT,
  TRIAL_DAYS,
  PLACEMENT_TEST_MINUTES,
} from './marketing.js';

const PRO_MONTHLY = `${deEur(PLANS.monthly.price)}/Monat`;
// Pro's speaking allowance, always with the length of the sessions it includes.
const PRO_SPEAKING = `${PRO_SPEAKING_SESSIONS_PER_MONTH} KI-Gespräche à ${PRO_INCLUDED_SESSION_MINUTES} Minuten pro Monat`;
// What every conversation ends with — an evaluation after the session, never during it.
const EVALUATION = 'eine Auswertung zu Grammatik, Wortschatz und Verständlichkeit';

/**
 * The date these comparisons were published with their "Stand: Mai 2026"
 * competitor data. The pages use it as the schema dateModified instead of the
 * build date: competitor figures unverified since May must not be stamped as
 * modified on every deploy (guides/index.js makes the same argument for
 * factsCheckedOn). Advance it only together with the stamps, after re-checking
 * the vendors' own pages.
 */
export const COMPARISON_DATA_DATE = '2026-05-28';

const competitorComparisons = {
  babbel: {
    slug: 'babbel',
    name: 'babbel',
    displayName: 'Babbel',
    positioning: 'Strukturiertes Vokabel- und Grammatik-Training auf Abo-Basis.',
    priceRange: '€6,99 – €12,99/Monat (Stand: Mai 2026)',
    heroHeadline: 'Babbel lehrt dich Deutsch. Bei Deutschmeister sprichst du es frei.',
    heroSubheadline: `Beide Plattformen haben gute Grammatik, und beide bieten KI-Gespräche. Bei Deutschmeister sprichst du frei auf jedem Niveau und bekommst nach dem Gespräch ${EVALUATION}.`,
    comparisonTable: [
      { feature: 'KI-Sprechtraining', us: `✓ Mit Pro ${PRO_SPEAKING}, frei auf jedem Niveau — danach ${EVALUATION}`, them: '○ Babbel Speak (seit 2025): KI-Gespräche in vorgegebenen Szenarien, Beta, nur in der App' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: '✓ Jeder deutsche Satz wird zerlegt — Fälle, Satzglieder, Wortarten, farbcodiert', them: '✗ Nicht verfügbar' },
      { feature: 'Prüfungsvorbereitung (Goethe/telc/DTZ)', us: '✓ Inhalte gezielt auf Goethe-, telc- und DTZ-Prüfungen abgestimmt, A1–B2', them: '○ Allgemeine Sprachkurse, nicht prüfungsspezifisch' },
      { feature: 'Grammatik-Erklärungen auf Englisch', us: '✓ Jedes Thema auf Englisch erklärt — ideal für Nicht-Muttersprachler', them: '✓ Erklärungen in 14 Ausgangssprachen verfügbar' },
      { feature: 'Offline-Modus', us: '✗ Browser-basiert, Internet erforderlich', them: '✓ Lektionen offline in der App verfügbar' },
      { feature: 'Einstufungstest', us: `✓ Kostenloser CEFR-Einstufungstest in etwa ${PLACEMENT_TEST_MINUTES} Minuten`, them: '✓ Einstufungstest beim Kursstart' },
      { feature: 'Kostenlose Inhalte', us: `✓ A1.1 komplett kostenlos + ${TRIAL_DAYS} Tage Pro-Testphase`, them: '○ Erste Lektion kostenlos, danach Abo nötig' },
      { feature: 'Preis (monatlich, Stand: Mai 2026)', us: `${PRO_MONTHLY} (Pro)`, them: 'ab 6,99 €/Monat (12-Monats-Abo) – 12,99 €/Monat (3-Monats-Abo)' },
      { feature: 'Wer dahintersteht', us: '✓ Von Ärzten in Deutschland entwickelt — sie kennen den Lernweg aus eigener Erfahrung', them: '✓ Team aus Sprachwissenschaftlern in Berlin' },
      { feature: 'Hörübungen mit Alltagsdialogen', us: '✓ Hörverständnis auf jedem Niveau mit authentischen Dialogen', them: '✓ Dialoge und Hörübungen in jeder Lektion' },
      { feature: 'Werbung in der kostenlosen Version', us: '✓ Keine Werbung — auch nicht in der Gratisversion', them: '✓ Keine Werbung (reines Abo-Modell)' },
    ],
    whyUsBlocks: [
      {
        icon: 'Mic',
        title: 'Frei sprechen, auf jedem Niveau',
        body: `Babbel hat mit Babbel Speak ein KI-Sprechtraining in vorgegebenen Szenarien (Beta, nur App). Bei Deutschmeister führst du mit Pro ${PRO_SPEAKING} frei auf jedem Niveau — und bekommst nach jedem Gespräch ${EVALUATION}. Der Unterschied liegt im freien Gespräch und in der Auswertung, nicht im Ob.`,
      },
      {
        icon: 'ScanSearch',
        title: 'Sentence X-Ray: jeder Satz zerlegt',
        body: 'Gib irgendeinen deutschen Satz ein und sieh sofort: Welcher Fall? Welches Satzglied? Warum „dem" und nicht „den"? Babbel bietet das nicht.',
      },
      {
        icon: 'GraduationCap',
        title: 'Prüfungsfokus, nicht nur Vokabeltraining',
        body: 'Deutschmeister wurde von einem Team von Ärzten in Deutschland gebaut, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind. Die Inhalte sind auf Goethe, telc und DTZ abgestimmt — nicht auf allgemeines Sprachgefühl.',
      },
    ],
    faq: [
      {
        q: 'Soll ich von Babbel zu Deutschmeister wechseln?',
        a: 'Wenn dir freies Sprechtraining und Prüfungsvorbereitung wichtig sind — ja. Babbel ist gut für strukturiertes Vokabellernen. Aber wenn du frei sprechen willst und dich auf eine Prüfung vorbereitest, bietet Deutschmeister mehr.',
      },
      {
        q: 'Kann ich Babbel und Deutschmeister zusammen nutzen?',
        a: 'Ja, das machen einige Lerner. Babbel für Vokabeln und Wiederholung, Deutschmeister für Grammatik-Verständnis, Sprechtraining und Satzanalyse. Die Kombination kann sinnvoll sein.',
      },
      {
        q: 'Ist Deutschmeister günstiger als Babbel?',
        a: `Ja, nach den Babbel-Preisen in diesem Vergleich. Deutschmeister Pro kostet ${PRO_MONTHLY} oder ${deEur(PLANS.yearly.asMonthly)}/Monat im Jahresabo. Und bei Deutschmeister gibt es A1.1 komplett kostenlos.`,
      },
      {
        q: 'Hat Babbel auch KI-Sprechtraining?',
        a: `Ja — Babbel hat seit 2025 „Babbel Speak", ein KI-Sprechtraining in vorgegebenen Szenarien (derzeit Beta, nur in der App). Bei Deutschmeister führst du mit Pro ${PRO_SPEAKING}, frei auf jedem Niveau, und bekommst nach jedem Gespräch ${EVALUATION}.`,
      },
      {
        q: 'Welche Plattform ist besser für Anfänger?',
        a: 'Beide sind für Anfänger geeignet. Babbel hat eine starke App mit Offline-Modus. Deutschmeister erklärt Grammatik auf Englisch und hat einen kostenlosen Einstufungstest, der dein Niveau sofort findet.',
      },
    ],
    ctaHeadline: 'Teste Deutschmeister kostenlos — und entscheide selbst.',
    ctaSubtext: `A1.1 komplett kostenlos. ${TRIAL_DAYS} Tage Pro-Testphase. Kein Risiko.`,
  },

  duolingo: {
    slug: 'duolingo',
    name: 'duolingo',
    displayName: 'Duolingo',
    positioning: 'Gamifiziertes Sprachlern-Spiel mit kostenloser Stufe.',
    priceRange: 'Kostenlos / Super: ab €6,99/Monat im Jahresabo (Stand: Mai 2026)',
    heroHeadline: 'Duolingo macht Spaß. Deutschmeister bereitet gezielt auf Goethe, telc und DTZ vor.',
    heroSubheadline: 'Duolingo motiviert mit Streaks und Punkten. Aber wenn du Deutsch für Prüfungen, Arbeit oder das echte Leben brauchst — reicht das?',
    comparisonTable: [
      { feature: 'KI-Sprechtraining', us: `✓ Mit Pro ${PRO_SPEAKING}, freie Gespräche auf deinem Niveau — danach ${EVALUATION}`, them: '○ Roleplay (seit 2026 kostenlos): GPT-basierte Gespräche in Alltagsszenarien, spielerisch, kein Prüfungsfokus' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: '✓ Jeder Satz zerlegt in Fälle, Satzglieder, Wortarten', them: '✗ Nicht verfügbar' },
      { feature: 'Prüfungsvorbereitung (Goethe/telc/DTZ)', us: '✓ Inhalte auf Goethe-, telc- und DTZ-Prüfungen abgestimmt, A1–B2', them: '✗ Kein Prüfungsfokus — allgemeines Sprachtraining' },
      { feature: 'Kostenlose Version', us: `✓ A1.1 kostenlos, ${TRIAL_DAYS} Tage Pro-Testphase`, them: '✓ Komplett kostenlos nutzbar (mit Werbung und Herzen-System)' },
      { feature: 'Werbung', us: '✓ Keine Werbung — auch nicht in der Gratisversion', them: 'Werbung in der Gratisversion (entfällt mit Super-Abo)' },
      { feature: 'Gamification (Streaks, XP, Liga)', us: '○ Tages-Streak und Meilensteine, aber keine XP, Ligen oder Punkte', them: '✓ Stark gamifiziert: Streaks, XP, Ligen, Achievements' },
      { feature: 'Preis (monatlich, Stand: Mai 2026)', us: `${PRO_MONTHLY} (Pro)`, them: 'Kostenlos / Super: ab 6,99 €/Monat (im Jahresabo)' },
      { feature: 'Offline-Modus', us: '✗ Browser-basiert', them: '✓ Lektionen offline verfügbar (mit Super)' },
      { feature: 'Einstufungstest', us: `✓ CEFR-Einstufungstest, etwa ${PLACEMENT_TEST_MINUTES} Minuten`, them: '✓ Placement Test beim Start' },
    ],
    whyUsBlocks: [
      {
        icon: 'Brain',
        title: 'Tiefe statt Spielereien',
        body: 'Duolingo belohnt dich für richtige Antworten mit Punkten und Streaks. Deutschmeister erklärt dir, WARUM die Antwort richtig ist. Wenn du Deutsch wirklich verstehen willst — nicht nur Übungen abhaken — ist das der entscheidende Unterschied.',
      },
      {
        icon: 'Mic',
        title: 'Frei sprechen, mit Auswertung danach',
        body: `Bei Deutschmeister sprichst du frei auf deinem Niveau, mit Pro ${PRO_SPEAKING}. Nach jedem Gespräch bekommst du ${EVALUATION}: was gut war und was du verbessern kannst. Sprechkompetenz baut man durch Sprechen auf.`,
      },
      {
        icon: 'GraduationCap',
        title: 'Gezielt auf die Prüfung vorbereiten, nicht nur Streak halten',
        body: 'Deutschmeister ist auf Goethe, telc und DTZ abgestimmt. Wenn du eine Prüfung vor dir hast, brauchst du gezielte Vorbereitung — kein Spiel, das dich für 50 XP lobt.',
      },
    ],
    faq: [
      {
        q: 'Reicht Duolingo, um eine Deutschprüfung zu bestehen?',
        a: 'Das kann dir keine App versprechen. Entscheidend ist, dass du das Format deiner Prüfung kennst und übst: mit den offiziellen Modellsätzen des Prüfungsanbieters und, bei Deutschmeister, mit Leitfäden und Übungstests für Goethe, telc und DTZ.',
      },
      {
        q: 'Ist Deutschmeister besser als Duolingo?',
        a: 'Kommt drauf an, was du brauchst. Für tägliche Motivation und Vokabelaufbau ist Duolingo stark. Für freies Sprechen mit Auswertung, Grammatik-Verständnis und Prüfungsvorbereitung ist Deutschmeister gebaut.',
      },
      {
        q: 'Warum ist Deutschmeister nicht kostenlos wie Duolingo?',
        a: 'Duolingo finanziert sich durch Werbung und Premium-Upsells. Deutschmeister hat keine Werbung. Die KI-Funktionen haben feste Nutzungslimits. A1.1 ist kostenlos, danach kosten die Inhalte — dafür bekommst du KI-Sprechtraining, Sentence X-Ray und prüfungsrelevante Tiefe.',
      },
      {
        q: 'Kann ich von Duolingo zu Deutschmeister wechseln?',
        a: `Ja. Mach den kostenlosen Einstufungstest — er zeigt dir in etwa ${PLACEMENT_TEST_MINUTES} Minuten, wo du stehst. Du musst nicht bei Null anfangen.`,
      },
      {
        q: 'Hat Duolingo auch KI-Sprechtraining?',
        a: `Ja — Duolingos „Roleplay" ist seit Anfang 2026 für alle kostenlos und bietet GPT-basierte Gespräche in Alltagsszenarien. Es ist spielerisch angelegt, nicht auf Prüfungen ausgerichtet. Bei Deutschmeister sprichst du frei auf jedem Niveau und bekommst nach jedem Gespräch ${EVALUATION} — mit Pro ${PRO_SPEAKING}.`,
      },
    ],
    ctaHeadline: 'Vom Spielen zum Sprechen — teste Deutschmeister kostenlos.',
    ctaSubtext: `A1.1 kostenlos. ${TRIAL_DAYS} Tage Pro. Kein Streak nötig.`,
  },

  lingoda: {
    slug: 'lingoda',
    name: 'lingoda',
    displayName: 'Lingoda',
    positioning: 'Live-Online-Unterricht mit echten Lehrern in Gruppen.',
    // The Sprint row below is the one Lingoda price basis on these pages.
    priceRange: 'Sprint: €310 / 2 Monate mit 15 Std./Monat (Stand: Mai 2026)',
    heroHeadline: 'Lingoda gibt dir Lehrer. Deutschmeister gibt dir Freiheit.',
    heroSubheadline: 'Live-Unterricht ist wertvoll. Aber was, wenn du um 23 Uhr üben willst — ohne auf einen Termin zu warten?',
    comparisonTable: [
      { feature: 'Verfügbarkeit', us: '✓ 24/7 — lerne wann du willst, keine Terminbuchung nötig', them: '○ Stundenplan nötig, Kurse zu festen Zeiten' },
      { feature: 'KI-Sprechtraining', us: `✓ Sofort verfügbar, mit Pro ${PRO_SPEAKING}, auf deinem Niveau`, them: '✗ Kein KI-Training — nur Live-Unterricht mit Lehrern' },
      { feature: 'Echte Lehrer', us: '✗ KI-basiert, keine menschlichen Lehrer', them: '✓ Zertifizierte Muttersprachler als Lehrer' },
      { feature: 'Sentence X-Ray (Satzanalyse)', us: `✓ Jeder Satz zerlegt und erklärt — mit Pro ${PRO_DAILY_LIMIT} Analysen pro Tag`, them: '✗ Nicht verfügbar' },
      { feature: 'Gruppenunterricht', us: '✗ Einzellernen mit KI', them: '✓ Kleine Gruppen (3–5 Teilnehmer) oder Einzelstunden' },
      { feature: 'Abschlussbescheinigung', us: '✓ Teilnahmebescheinigung nach Kursabschluss (kein Goethe-/telc-Ergebnis)', them: '✓ Lingoda-Zertifikat nach Kursabschluss' },
      { feature: 'Wartezeit bis zur nächsten Übung', us: '✓ Keine — sofort loslegen, auch nachts', them: '○ Nächster freier Slot oft Stunden oder Tage entfernt' },
      { feature: 'Preis pro Monat (Stand: Mai 2026)', us: `${PRO_MONTHLY} (Pro) — alle ${LEVEL_COUNT} Level inklusive`, them: 'Sprint: €310 / 2 Monate (15 Std./Monat), 50% Cashback bei voller Teilnahme' },
      { feature: 'Grammatik-Erklärungen auf Englisch', us: '✓ Ausführlich, jederzeit nachschlagbar', them: '○ Abhängig vom Lehrer und der Unterrichtssprache' },
      { feature: 'Prüfungsvorbereitung', us: '✓ Gezielt auf Goethe/telc/DTZ abgestimmt', them: '○ Allgemeine Sprachkurse, Sprint-Programme' },
      { feature: 'Stornierung / Flexibilität', us: '✓ Jederzeit kündbar, keine Vertragsbindung', them: '○ Sprint: 50% Cashback bei voller Teilnahme (Super Sprint: 100%), sonst keine Erstattung' },
    ],
    whyUsBlocks: [
      {
        icon: 'Clock',
        title: 'Lernen, wann DU willst — nicht wann der Kalender es sagt',
        body: 'Bei Lingoda buchst du Stunden Tage im Voraus. Bei Deutschmeister öffnest du die App und lernst — um 6 Uhr morgens oder um Mitternacht. Kein Stundenplan, keine Wartezeit.',
      },
      {
        icon: 'Mic',
        title: '24/7 Sprechpartner statt Terminstunde',
        body: `Bei Lingoda sprichst du im Live-Unterricht zu festen Zeiten. Deutschmeister gibt dir einen KI-Sprechpartner, der immer da ist — mit Pro ${PRO_SPEAKING}, wann immer du willst. Kein Buchen, kein Warten.`,
      },
      {
        icon: 'Wallet',
        title: `Bruchteil der Kosten, voller Zugang zu allen ${LEVEL_COUNT} Leveln`,
        body: `Deutschmeister Pro kostet ${PRO_MONTHLY} — mit Zugang zu allen ${LEVEL_COUNT} Leveln und ${PRO_SPEAKING}. Den Lingoda-Preis findest du im Vergleich oben.`,
      },
    ],
    faq: [
      {
        q: 'Kann Deutschmeister einen echten Lehrer ersetzen?',
        a: 'Nicht komplett. Echte Lehrer können auf individuelle Fragen eingehen und Fehler im Kontext erklären. Aber für tägliches Üben, Grammatik-Verständnis und Sprechtraining ist Deutschmeister deutlich günstiger und flexibler.',
      },
      {
        q: 'Ist Lingoda besser für Fortgeschrittene?',
        a: 'Lingoda bietet Live-Konversation mit Muttersprachlern — das ist wertvoll ab B1+. Deutschmeister bietet KI-Sprechtraining bis B2.2 und das Sentence X-Ray Tool, das gerade bei komplexen Sätzen hilft.',
      },
      {
        q: 'Kann ich beides kombinieren?',
        a: 'Ja — eine sinnvolle Kombination. Deutschmeister für tägliches Training (Grammatik, Hören, Sprechen mit KI), Lingoda für gelegentliche Live-Stunden mit einem Lehrer. So sparst du Geld und lernst trotzdem intensiv.',
      },
      {
        q: 'Bekomme ich bei Deutschmeister ein Zertifikat?',
        a: 'Ja: nach jedem abgeschlossenen Kurs eine druckbare Teilnahmebescheinigung. Sie ist kein offizielles Prüfungsergebnis — für Behörden zählen nur die Zeugnisse der Prüfungsanbieter.',
      },
      {
        q: 'Warum ist Deutschmeister so viel günstiger als Lingoda?',
        a: 'Lingoda bezahlt echte Lehrer für Live-Unterricht — das ist teuer. Deutschmeister nutzt KI für Sprechtraining und skalierbare Inhalte.',
      },
    ],
    ctaHeadline: 'Flexibel lernen, ohne auf einen Termin zu warten.',
    ctaSubtext: 'Starte jetzt kostenlos — 24/7 verfügbar, kein Kalender nötig.',
  },
};

export default competitorComparisons;
