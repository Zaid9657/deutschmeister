// The FAQ content, shared between the /faq page (src/pages/FAQPage.jsx) and the
// prerender (scripts/prerender-spa-routes.mjs) — 21 answers of real copy that
// used to exist only inside the accordion component, where a crawler saw the
// questions but never the answers (they render on click), even though the
// FAQPage JSON-LD promised all of them.
//
// Same regime as marketing.js / seoRoutes.js: plain ESM, importable by node
// and Vite alike; prices and counts are DERIVED, never retyped. Icons stay in
// the page component — this file is data, and lucide components don't belong
// in a module the prerender imports.

import { PLANS, deEur } from './pricing.js';
import {
  TRIAL_SPEAKING_SESSIONS,
  ANON_DAILY_LIMIT,
  TRIAL_DAYS,
  FREE_LEVEL_LABEL,
  GRAMMAR_TOPIC_COUNT,
} from './marketing.js';

export const FAQ_CATEGORIES = [
  {
    title: 'Über Deutschmeister',
    items: [
      {
        q: 'Was ist Deutschmeister?',
        a: 'Deutschmeister ist eine Online-Plattform, die dir hilft, Deutsch zu lernen — mit Grammatik-Erklärungen auf Englisch, KI-Sprechtraining und dem Sentence X-Ray Tool. Alles an einem Ort, von A1 bis B2.',
      },
      {
        q: 'Für wen ist diese Plattform gedacht?',
        a: 'Für alle, die Deutsch wirklich sprechen wollen. Besonders für Migranten, Fachkräfte und Studierende, die sich auf Goethe, telc, TestDaF oder DTZ vorbereiten. Wenn du unter Zeitdruck lernst und keine Lust auf Spielchen hast — bist du hier richtig.',
      },
      {
        q: 'Wer steht hinter Deutschmeister?',
        a: 'Gegründet von Zaid — Arzt aus Deutschland, der das Problem aus erster Hand kennt: eine neue Sprache lernen, während der Alltag weiterläuft. Heute entwickelt ein Team von Ärzten in Deutschland die Plattform weiter — Leute, die den Weg durch die deutschen Sprachprüfungen selbst gegangen sind.',
      },
      {
        q: 'Welche Niveaus deckt ihr ab?',
        a: `A1.1 bis B2.2 — also vom absoluten Anfänger bis zur gehobenen Mittelstufe. ${GRAMMAR_TOPIC_COUNT} Grammatik-Themen, Hörübungen, Lesetexte und Sprechtraining auf jedem Niveau.`,
      },
    ],
  },
  {
    title: 'Lernen & Inhalte',
    items: [
      {
        q: 'Wie unterscheidet sich Deutschmeister von Duolingo / Babbel?',
        a: 'Duolingo macht Spaß, bringt dir aber nicht bei, einen ganzen Satz zu bilden. Babbel ist solide, aber ohne echtes Sprechtraining. Deutschmeister erklärt dir das WARUM hinter der Grammatik — auf Englisch — und lässt dich dann mit KI sprechen üben. Das ist der Unterschied.',
      },
      {
        q: 'Bekomme ich echtes Sprechtraining oder nur Übungen?',
        a: 'Echtes Sprechtraining. Du sprichst mit einer KI, die auf dein Niveau abgestimmt ist. Du bekommst sofort Feedback zu Grammatik, Wortschatz und Aussprache. Kein Nachsprechen von Sätzen — echte Gespräche.',
      },
      {
        q: 'Wie funktioniert die KI-Auswertung beim Sprechen?',
        a: 'Du sprichst, die KI hört zu und analysiert deinen Satz in Echtzeit. Du siehst sofort: Was war richtig? Was kannst du verbessern? Welche Alternative wäre natürlicher? Wie ein geduldiger Lehrer, der immer Zeit hat.',
      },
      {
        q: 'Was ist das Sentence X-Ray Tool?',
        a: 'Du gibst einen deutschen Satz ein — egal welchen. Das Tool zerlegt ihn: Fälle, Satzglieder, Wortarten. Farbcodiert und erklärt. Du verstehst endlich, warum „dem" und nicht „den" steht. Kein anderes Tool kann das so.',
      },
      {
        q: 'Wie viel Zeit brauche ich pro Tag?',
        a: '15–20 Minuten reichen. Eine Grammatik-Lektion, ein paar Übungen, eine kurze Sprechübung. Jeden Tag ein bisschen ist besser als einmal pro Woche drei Stunden.',
      },
    ],
  },
  {
    title: 'Preise & Abo',
    items: [
      {
        q: 'Was kostet Deutschmeister?',
        a: `Pro Monatlich: ${deEur(PLANS.monthly.price)} pro Monat. Pro Jährlich: ${deEur(PLANS.yearly.price)} pro Jahr (das sind ${deEur(PLANS.yearly.asMonthly)} pro Monat — weniger als ${deEur(PLANS.yearly.perDay)} am Tag). Günstiger als ein Kaffee.`,
      },
      {
        q: 'Gibt es eine kostenlose Version?',
        a: `Ja. ${FREE_LEVEL_LABEL} ist komplett kostenlos — ohne Anmeldung. Dazu bekommst du ${TRIAL_SPEAKING_SESSIONS} kostenlose KI-Sprechübungen und ${ANON_DAILY_LIMIT} Sentence X-Ray Analyse pro Tag. Wenn du ein Konto erstellst, gibt es ${TRIAL_DAYS} Tage kostenlosen Pro-Zugang obendrauf.`,
      },
      {
        q: 'Kann ich jederzeit kündigen?',
        a: 'Ja. Ein Klick, fertig. Keine Fragen, keine versteckten Kosten, keine Kündigungsfrist. Du behältst den Zugang bis zum Ende der bezahlten Periode.',
      },
      {
        q: 'Bekomme ich eine Rückerstattung, wenn ich nicht zufrieden bin?',
        a: '7 Tage Geld-zurück-Garantie. Kein Risiko. Wenn es nichts für dich ist, bekommst du dein Geld zurück.',
      },
      {
        q: 'Welche Zahlungsarten akzeptiert ihr?',
        a: 'Kreditkarte (Visa, Mastercard, AMEX), PayPal und Apple Pay. Alles über LemonSqueezy — sicher und verschlüsselt.',
      },
    ],
  },
  {
    title: 'Prüfungsvorbereitung',
    items: [
      {
        q: 'Bereitet Deutschmeister auf Goethe / telc / TestDaF / DTZ vor?',
        a: 'Ja. Die Grammatik und der Wortschatz decken genau die Themen ab, die in diesen Prüfungen vorkommen. Das Sprechtraining simuliert mündliche Prüfungssituationen. Für den DTZ (Deutsch-Test für Zuwanderer) ist besonders das B1-Material relevant.',
      },
      {
        q: 'Ist das genug für die B1-/B2-Prüfung?',
        a: 'Deutschmeister gibt dir eine solide Grundlage — Grammatik, Hörverständnis, Sprechen. Für die Prüfung selbst empfehlen wir zusätzlich: offizielle Modellsätze vom Goethe-Institut oder telc durcharbeiten. Deutschmeister + Modellsätze = eine starke Kombination.',
      },
      {
        q: 'Wie viele Wochen vor der Prüfung sollte ich anfangen?',
        a: 'Mindestens 8–12 Wochen bei täglichem Lernen. Je früher, desto besser. Grammatik braucht Zeit zum Setzen. Das Sprechtraining hilft dir, sicherer zu werden — aber Sicherheit kommt nicht über Nacht.',
      },
      {
        q: 'Gibt es Probeprüfungen?',
        a: 'Noch nicht — aber das ist geplant. Aktuell kannst du mit den Übungen auf jedem Niveau testen, wo du stehst. Der kostenlose Einstufungstest zeigt dir sofort dein CEFR-Level.',
      },
    ],
  },
  {
    title: 'Technisches',
    items: [
      {
        q: 'Funktioniert das auf dem Handy?',
        a: 'Ja. Deutschmeister läuft im Browser — Desktop, Tablet, Handy. Keine App nötig. Einfach deutsch-meister.de öffnen und loslegen.',
      },
      {
        q: 'Brauche ich ein Mikrofon für das Sprechtraining?',
        a: 'Ja, aber jedes eingebaute Mikrofon reicht. Laptop, Handy, Tablet — alles funktioniert. Externe Mikrofone sind nicht nötig.',
      },
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Server in der EU (Supabase). DSGVO-konform. Deine Daten werden nicht verkauft, nicht weitergegeben, nicht für Werbung genutzt. Punkt.',
      },
    ],
  },
];

/** The FAQPage JSON-LD, built once from the same data both surfaces render. */
export const faqPageJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
});
