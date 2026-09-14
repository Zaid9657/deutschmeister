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
    title: 'About Deutschmeister',
    items: [
      {
        q: 'What is Deutschmeister?',
        a: 'Deutschmeister is an online German-learning platform with grammar explanations in English, AI speaking practice, and the Sentence X-Ray tool. It brings the core skills together from A1 to B2.',
      },
      {
        q: 'Who is the platform for?',
        a: 'It is for learners who need to use German in real life—especially migrants, professionals, students, and people preparing for Goethe, telc, TestDaF, or DTZ exams.',
      },
      {
        q: 'Who is behind Deutschmeister?',
        a: 'Deutschmeister was founded by Zaid, a doctor in Germany who experienced the challenge of learning a new language while everyday life continued. A team of doctors in Germany now develops the platform further.',
      },
      {
        q: 'Which levels are covered?',
        a: `A1.1 through B2.2, from complete beginner to upper intermediate. The library includes ${GRAMMAR_TOPIC_COUNT} grammar topics plus listening, reading, and speaking practice across the levels.`,
      },
    ],
  },
  {
    title: 'Learning and content',
    items: [
      {
        q: 'How is Deutschmeister different from Duolingo or Babbel?',
        a: 'Deutschmeister focuses on understanding why German grammar works and then applying it in speaking practice. It is designed as a focused alternative for learners who want detailed English explanations, sentence analysis, and AI-guided conversation.',
      },
      {
        q: 'Do I get speaking practice or only exercises?',
        a: 'You can have level-appropriate conversations with an AI partner and receive feedback on grammar, vocabulary, and pronunciation, rather than only repeating fixed sentences.',
      },
      {
        q: 'How does AI speaking feedback work?',
        a: 'After you speak, the system analyses your response and shows what worked, what could improve, and which phrasing may sound more natural. AI feedback can make mistakes, so treat it as practice support rather than an official assessment.',
      },
      {
        q: 'What is the Sentence X-Ray tool?',
        a: 'Enter a German sentence and the tool breaks it into cases, sentence roles, and parts of speech with colour-coded explanations. It helps you understand, for example, why a sentence uses “dem” instead of “den”.',
      },
      {
        q: 'How much time should I study each day?',
        a: 'A consistent 15–20 minutes can be useful: one grammar lesson, a few exercises, and a short speaking session. A little every day is usually more sustainable than one long weekly session.',
      },
    ],
  },
  {
    title: 'Pricing and subscription',
    items: [
      {
        q: 'How much does Deutschmeister cost?',
        a: `Monthly Pro costs ${deEur(PLANS.monthly.price)} per month. Annual Pro costs ${deEur(PLANS.yearly.price)} per year, equivalent to ${deEur(PLANS.yearly.asMonthly)} per month or less than ${deEur(PLANS.yearly.perDay)} per day.`,
      },
      {
        q: 'Is there a free version?',
        a: `Yes. ${FREE_LEVEL_LABEL} is free without registration. You also get ${TRIAL_SPEAKING_SESSIONS} free AI speaking sessions and ${ANON_DAILY_LIMIT} Sentence X-Ray analysis per day. Creating an account starts a ${TRIAL_DAYS}-day Pro trial.`,
      },
      {
        q: 'Can I cancel at any time?',
        a: 'Yes. You keep access through the end of the paid billing period, and the subscription does not renew after cancellation.',
      },
      {
        q: 'Can I request a refund?',
        a: 'Deutschmeister advertises a 7-day money-back guarantee. Contact support within that period so the request can be reviewed and processed under the applicable purchase terms.',
      },
      {
        q: 'Which payment methods are available?',
        a: 'Available payment methods are shown by Lemon Squeezy at checkout and can vary by country and device.',
      },
    ],
  },
  {
    title: 'Exam preparation',
    items: [
      {
        q: 'Does Deutschmeister prepare me for Goethe, telc, TestDaF, or DTZ?',
        a: 'The grammar, vocabulary, and speaking materials cover skills relevant to these exams, and some exercises simulate oral-exam situations. Use the German-language exam guides to understand a specific format.',
      },
      {
        q: 'Is Deutschmeister enough for a B1 or B2 exam?',
        a: 'Deutschmeister can build grammar, listening, reading, and speaking skills. You should also work through official sample papers from your exam provider, because only those define the current format and scoring.',
      },
      {
        q: 'How many weeks before the exam should I start?',
        a: 'A common planning range is 8–12 weeks of consistent study, but your starting level and target exam matter more than a fixed number. Take the level test and compare your results with the official exam requirements.',
      },
      {
        q: 'Are mock exams available?',
        a: 'Yes. Logged-in Pro or trial learners can access exam-style mock tests and review their results. We still recommend completing the latest official sample papers from the relevant exam provider.',
      },
    ],
  },
  {
    title: 'Technical and privacy',
    items: [
      {
        q: 'Does it work on mobile devices?',
        a: 'Yes. Deutschmeister runs in a modern browser on desktop, tablet, and mobile devices; no separate app is required.',
      },
      {
        q: 'Do I need a microphone for speaking practice?',
        a: 'Yes. A built-in laptop, phone, or tablet microphone is normally sufficient; an external microphone is optional.',
      },
      {
        q: 'How is my data handled?',
        a: 'Account and learning features use service providers including Supabase. AI, analytics, payment, and email providers are described in the Privacy Policy, and optional analytics loads only after consent. The controller and vendor details are still undergoing release review.',
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
