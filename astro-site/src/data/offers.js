// THE offer layer — what each station of the line sells, in words a buyer can
// check. "Die Linie" (docs/redesign-2026-10/strategy.md): the CEFR ladder is a
// transit line of eight stations; A1.1 is the free first stop, every buyable
// level is a one-time ticket, and the levels still being rebuilt are "Im Bau".
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs). The homepage, /pricing/, /courses/ and the
// app's checkout and success screens all describe the same ticket from here.
//
// RULE: derive, never retype. Every price comes from pricing.js, every limit
// and count from marketing.js, every content figure from courseContents.js.
// tests/offers.test.mjs checks that each line below still says what the data
// says, and bans the claims this business does not make: no "most popular",
// no scarcity, no countdowns, no outcome or pass guarantees, no learner counts.
//
// Whether a ticket can be BOUGHT is not decided here: that is the checkout id
// (courseVariants.js on the static site, lemonsqueezy.js in the app). A ticket
// whose id is unset renders without a Buy button — never a dead checkout.
import {
  ALL_LEVELS, COMING_SOON_LEVELS, COURSE_PRO_MONTHS, LEVEL_COURSES, MONTHLY_PRICE_EUR, PLANS,
  COURSES as EXAM_COURSES, eur, productKeyForLevel,
} from './pricing.js';
import {
  LEVELS, LEVEL_COUNT, PRO_DAILY_LIMIT, PRO_SPEAKING_SESSIONS_PER_MONTH, PRO_WRITING_EVALUATIONS_PER_MONTH,
  ANON_DAILY_LIMIT, FREE_DAILY_LIMIT, READING_LESSON_COUNTS_BY_LEVEL, UNLIMITED_CONTENT_LINE,
} from './marketing.js';
import { COURSE_CONTENTS, GUIDED_PLANS, LEVEL_OUTCOME_EN, levelToSlug } from './courseContents.js';

/** The free first stop. Its course needs no account (src/config/freeTier.js). */
export const FREE_LEVEL = 'a1.1';

/** The door every "start free" link uses (tests/astro-course-front-door.test.mjs). */
export const FREE_COURSE_HREF = '/course/a1.1';

const hours = (minutes) => Math.round(minutes / 60);
/** Planned minutes per plan day, rounded to 5. */
export const minutesPerDay = (plan) => Math.round(plan.minutes / plan.days / 5) * 5;

/**
 * One station per sub-level, ladder order.
 *   status 'free'     — the free first stop
 *   status 'ticket'   — priced and buyable once its checkout id is set
 *   status 'building' — "Im Bau": listed, priced, not sold (COMING_SOON_LEVELS)
 */
export const STATIONS = ALL_LEVELS.map((level, index) => {
  const meta = LEVELS[index];
  const course = LEVEL_COURSES[productKeyForLevel(level)] || null;
  const status = level === FREE_LEVEL ? 'free' : COMING_SOON_LEVELS.includes(level) ? 'building' : 'ticket';
  return {
    level,
    code: meta.code,
    band: meta.band,
    name: meta.subtitle,
    outcome: LEVEL_OUTCOME_EN[level],
    status,
    productKey: course ? course.key : null,
    price: course ? course.price : null,
    priceLabel: course ? eur(course.price) : null,
    plan: GUIDED_PLANS[level] || null,
    contents: COURSE_CONTENTS[level],
    coursePage: `/courses/${levelToSlug(level)}/`,
    index,
  };
});

export const stationFor = (level) => STATIONS.find((s) => s.level === String(level || '').toLowerCase()) || null;

/** Stations a visitor can buy (once their checkout id is set). */
export const TICKET_STATIONS = STATIONS.filter((s) => s.status === 'ticket');

/** Short status line under a station's code — what it costs and how. */
export const stationStatusLine = (station) => {
  if (station.status === 'free') return 'Free · no account';
  if (station.status === 'building') return 'Im Bau · coming soon';
  return `${station.priceLabel} once · yours to keep`;
};

/** What one level's guided plan is, in one honest line. */
export const planLine = (station) => {
  if (!station.plan) return null;
  const c = station.contents;
  const test = c && c.finalTest ? `, ending in a final test in ${c.finalTest.format} format` : '';
  return `A ${station.plan.days}-day guided plan: ${station.plan.steps} steps, about ${hours(station.plan.minutes)} hours of practice${test}.`;
};

/**
 * What one ticket carries. Each line names the obstacle it removes — the
 * reason it belongs in the bundle — so the ticket reads as a plan, not a pile
 * of bonuses. `removes` completes the phrase "No more …". Counts come from the
 * data; nothing here is a valuation.
 */
export const ticketLines = (level) => {
  const s = stationFor(level);
  if (!s || s.status !== 'ticket') return [];
  const c = s.contents;
  return [
    {
      key: 'plan',
      title: `${s.code}, yours to keep`,
      body: `${planLine(s)} Grammar with exercises, ${READING_LESSON_COUNTS_BY_LEVEL[s.level]} reading lessons, ${c.listening.length} listening sets with ${c.listeningQuestions} questions, ${c.words} words for review and ${c.missions} speaking missions.`,
      removes: 'guessing what to study next.',
    },
    {
      key: 'pro',
      title: `${COURSE_PRO_MONTHS} months of Pro on board`,
      body: `Every level opens while it runs, with ${PRO_SPEAKING_SESSIONS_PER_MONTH} AI speaking sessions and ${PRO_WRITING_EVALUATIONS_PER_MONTH} writing corrections a month and ${PRO_DAILY_LIMIT} Sentence X-Ray analyses a day.`,
      removes: 'practising speaking and writing with no one to correct you.',
    },
    {
      key: 'terms',
      title: 'One payment. No subscription.',
      body: `Nothing renews and nothing is charged again. When the ${COURSE_PRO_MONTHS} months end, ${s.code} stays yours and the AI tools return to the free allowance — unless you choose Pro.`,
      removes: 'paying every month for a level you finish once.',
    },
    {
      key: 'progress',
      title: 'Your progress, saved',
      body: 'Every answer is saved to your account, so you continue where you stopped, on any device.',
      removes: 'starting over on a new device.',
    },
  ];
};

/** Pro, framed against the ticket: rent the whole line instead of owning one stop. */
export const PRO_OFFER = {
  monthly: PLANS.monthly,
  yearly: PLANS.yearly,
  lines: [
    `${UNLIMITED_CONTENT_LINE}, while you pay`,
    `${PRO_SPEAKING_SESSIONS_PER_MONTH} AI speaking sessions a month`,
    `${PRO_WRITING_EVALUATIONS_PER_MONTH} writing corrections a month`,
    `${PRO_DAILY_LIMIT} Sentence X-Ray analyses a day`,
    'The timed practice exams',
    'Cancel anytime in the billing portal',
  ],
  monthlyLabel: `${eur(MONTHLY_PRICE_EUR)} a month`,
};

/** A one-line, derived comparison the ticket may carry: Pro alone, per month. */
export const proAloneLine = () => `For comparison: Pro on its own is ${eur(MONTHLY_PRICE_EUR)} a month.`;

/** The separate telc B1 exam course (its own page). */
export const EXAM_COURSE = EXAM_COURSES.telc_b1_komplett;

/**
 * "Where do you get on?" — what you can already do decides the stop. Each
 * answer quotes the PREVIOUS level's outcome line, so the chooser and the
 * course pages describe a level with the same words.
 */
export const FIT_CHOICES = [
  {
    id: 'zero',
    label: 'I’m starting from zero',
    detail: 'Greetings, numbers and the alphabet are still new.',
    level: 'a1.1',
  },
  {
    id: 'a11-done',
    label: 'I can introduce myself',
    detail: LEVEL_OUTCOME_EN['a1.1'],
    level: 'a1.2',
  },
  {
    id: 'a12-done',
    label: 'I can talk about my day',
    detail: LEVEL_OUTCOME_EN['a1.2'],
    level: 'a2.1',
  },
  {
    id: 'a21-done',
    label: 'I handle everyday errands',
    detail: LEVEL_OUTCOME_EN['a2.1'],
    level: 'a2.2',
  },
  {
    id: 'b1-route',
    label: 'I’m heading for B1 or B2 now',
    detail: 'You are past A2, or an exam date is close.',
    level: null,
  },
];

/** The route for visitors already past A2: the B1/B2 stations are Im Bau. */
export const EXAM_ROUTE = {
  title: 'Past A2? Ride B1 material today.',
  body: `The B1 and B2 courses are being rebuilt to the new course standard. Until they open, Pro gives you every level's lessons, AI speaking and writing feedback and the timed practice exams; the telc B1 course is its own ${eur(EXAM_COURSE.price)} programme.`,
  links: [
    { label: 'See Pro', href: '/pricing/#pro' },
    { label: 'Exam routes · DE', href: '/pruefung/', lang: 'de' },
    { label: 'telc B1 course · DE', href: '/telc-b1-komplettvorbereitung/', lang: 'de' },
  ],
};

/** What the free first stop includes (no account). */
export const FREE_STOP_LINES = [
  `The whole ${STATIONS[0].code} course, free and with no account`,
  `Sentence X-Ray: ${ANON_DAILY_LIMIT} free analysis a day`,
  `The grammar explanations of all ${LEVEL_COUNT} levels, to read`,
];

/**
 * The questions that stop a purchase, answered from the data. Refunds are
 * deliberately absent: no refund policy is published as a sales promise until
 * the owner confirms its wording (docs/redesign-2026-10/strategy.md, decisions).
 */
export const OFFER_FAQ = [
  {
    q: 'I don’t know my level. Where should I start?',
    a: 'Use “Where do you get on?” above: pick what you can already do. Or take the free 20-minute level test. You can also start the free A1.1 course and move up when the Lektionen feel easy.',
  },
  {
    q: 'What does buying a level give me, exactly?',
    a: `That level for good, with its guided plan, exercises, reading, listening, vocabulary and final test, plus ${COURSE_PRO_MONTHS} months of Pro. One payment, nothing renews.`,
  },
  {
    q: `What happens when the ${COURSE_PRO_MONTHS} months of Pro end?`,
    a: `The level you bought stays open. The AI tools go back to the free allowance (Sentence X-Ray: ${FREE_DAILY_LIMIT} a day). You are never charged unless you choose Pro yourself.`,
  },
  {
    q: 'Should I buy a level or Pro?',
    a: `Buy a level to own one stop of the line and work through it at your pace. Pro rents the whole line by the month: every level and the full AI allowance while you pay. A level already includes ${COURSE_PRO_MONTHS} months of Pro.`,
  },
  {
    q: 'How much AI practice do I get?',
    a: `The AI tools are metered so they stay fast: on Pro, and during a ticket’s ${COURSE_PRO_MONTHS} months, ${PRO_SPEAKING_SESSIONS_PER_MONTH} speaking sessions and ${PRO_WRITING_EVALUATIONS_PER_MONTH} writing corrections a month and ${PRO_DAILY_LIMIT} Sentence X-Ray analyses a day.`,
  },
  {
    q: 'I’m nervous about speaking.',
    a: 'Practise with the AI partner first: no audience, as many attempts as your allowance allows, and feedback on grammar, vocabulary and clarity after each session. Your microphone is only used when you start a session.',
  },
  {
    q: 'I only have a little time each day.',
    a: `A plan day is about ${minutesPerDay(GUIDED_PLANS['a1.2'])} minutes, split into short steps, and your place is saved after every answer. Fewer minutes a day simply means more days.`,
  },
  {
    q: 'Who do I contact if something goes wrong?',
    a: 'Use Help & feedback, linked in the footer of every page.',
  },
];
