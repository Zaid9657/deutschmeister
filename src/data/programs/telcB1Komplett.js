// The telc B1 Komplettvorbereitung — a 4-week Prüfungsfahrplan over EXISTING
// content. The buyer pays for the sequence and the exam focus, not new lessons
// (docs/revenue-plan-2026-08-31.md, Lane 2), so every item here deep-links into
// a route the app already serves.
//
// Grammar items are DERIVED from src/data/grammarTopics.js rather than retyped,
// so a renamed slug can never strand a course day on a 404 — the same
// derive-never-retype rule the pricing layer follows.
//
// Item `type` values drive the icon/label on the course page:
//   lesson | listening | reading | speaking | xray | exam | review

// The .js extension matters: this module is imported by tests/purchases.test.mjs
// under plain Node ESM resolution, which (unlike Vite) requires it.
import { getTopicsForLevel } from '../grammarTopics.js';

export const PROGRAM_KEY = 'telc_b1_komplett';

const lesson = (level, topic) => ({
  id: `${level}-${topic.slug}`,
  type: 'lesson',
  title: topic.titleEn,
  minutes: topic.estimatedTime || 20,
  href: `/grammar/${level}/${topic.slug}`,
});

const b11 = getTopicsForLevel('b1.1');
const b12 = getTopicsForLevel('b1.2');

// 4 weeks × 5 study days. Weeks 1–2 rebuild the B1.1 base, week 3 covers the
// B1.2 structures telc B1 tests hardest, week 4 is exam week: Modelltest
// orientation, speaking under pressure, and targeted review.
export const PROGRAM = {
  key: PROGRAM_KEY,
  title: 'telc B1 Komplettvorbereitung',
  subtitle: 'Your 4-week exam plan — one focused session a day.',
  weeks: [
    {
      title: 'Week 1 — Rebuild the base',
      intro: 'The B1.1 structures the exam assumes you own. One topic a day, then hear it used.',
      days: [
        { label: 'Day 1', items: [lesson('b1.1', b11[0])] },
        { label: 'Day 2', items: [lesson('b1.1', b11[1])] },
        {
          label: 'Day 3',
          items: [
            lesson('b1.1', b11[2]),
            { id: 'w1-listening', type: 'listening', title: 'Listening: B1.1 dialogues', minutes: 15, href: '/listening/b1.1' },
          ],
        },
        { label: 'Day 4', items: [lesson('b1.1', b11[3])] },
        {
          label: 'Day 5',
          items: [
            { id: 'w1-xray', type: 'xray', title: 'X-Ray five sentences from this week', minutes: 10, href: '/analyze/' },
            { id: 'w1-reading', type: 'reading', title: 'Reading: one B1.1 text', minutes: 15, href: '/reading/b1.1' },
          ],
        },
      ],
    },
    {
      title: 'Week 2 — The hard half of B1.1',
      intro: 'The structures that decide the written exam, plus your first timed speaking.',
      days: [
        { label: 'Day 6', items: [lesson('b1.1', b11[4])] },
        { label: 'Day 7', items: [lesson('b1.1', b11[5])] },
        {
          label: 'Day 8',
          items: [
            lesson('b1.1', b11[6]),
            { id: 'w2-listening', type: 'listening', title: 'Listening: B1.1 dialogues, second set', minutes: 15, href: '/listening/b1.1' },
          ],
        },
        { label: 'Day 9', items: [lesson('b1.1', b11[7])] },
        {
          label: 'Day 10',
          items: [
            { id: 'w2-speaking', type: 'speaking', title: 'Speaking mission at B1.1', minutes: 15, href: '/speaking/' },
            { id: 'w2-reading', type: 'reading', title: 'Reading: one B1.1 text', minutes: 15, href: '/reading/b1.1' },
          ],
        },
      ],
    },
    {
      title: 'Week 3 — B1.2: what telc tests hardest',
      intro: 'The B1.2 structures examiners listen for. Keep the daily X-Ray habit alongside.',
      days: [
        { label: 'Day 11', items: [lesson('b1.2', b12[0])] },
        { label: 'Day 12', items: [lesson('b1.2', b12[1])] },
        {
          label: 'Day 13',
          items: [
            lesson('b1.2', b12[2]),
            { id: 'w3-listening', type: 'listening', title: 'Listening: B1.2 dialogues', minutes: 15, href: '/listening/b1.2' },
          ],
        },
        { label: 'Day 14', items: [lesson('b1.2', b12[3])] },
        {
          label: 'Day 15',
          items: [
            lesson('b1.2', b12[4]),
            { id: 'w3-speaking', type: 'speaking', title: 'Speaking mission at B1.2', minutes: 15, href: '/speaking/' },
          ],
        },
      ],
    },
    {
      title: 'Week 4 — Exam week',
      intro: 'Orient on the real exam, rehearse under pressure, and close your weakest gaps.',
      days: [
        {
          label: 'Day 16',
          items: [
            {
              id: 'w4-modelltest',
              type: 'exam',
              title: 'Exam orientation: format, parts, and pass mark',
              minutes: 30,
              href: '/leitfaden/telc-b1/',
              external: true, // static guide page — full page load, not a SPA route
            },
          ],
        },
        {
          label: 'Day 17',
          items: [
            { id: 'w4-speaking-1', type: 'speaking', title: 'Speaking: full mission, no notes', minutes: 20, href: '/speaking/' },
          ],
        },
        {
          label: 'Day 18',
          items: [
            { id: 'w4-listening', type: 'listening', title: 'Listening: B1.2 dialogues, in one sitting', minutes: 20, href: '/listening/b1.2' },
            { id: 'w4-reading', type: 'reading', title: 'Reading: one long B1.2 text', minutes: 20, href: '/reading/b1.2' },
          ],
        },
        {
          label: 'Day 19',
          items: [
            { id: 'w4-review', type: 'review', title: 'Review your two weakest grammar topics', minutes: 30, href: '/grammar/b1.2/' },
          ],
        },
        {
          label: 'Day 20',
          items: [
            { id: 'w4-leveltest', type: 'exam', title: 'Re-take the level test — measure the four weeks', minutes: 30, href: '/level-test' },
          ],
        },
      ],
    },
  ],
};

/** Flat list of every item id, for progress accounting. */
export const allItemIds = () =>
  PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.id)));
