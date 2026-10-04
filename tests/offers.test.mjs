// Guard suite for the offer layer (src/data/offers.js + its Astro twin) and the
// v4 homepage that renders it (docs/redesign-2026-10/strategy.md).
//
//   1. Every station says what the commerce layer says: status from pricing.js,
//      price derived, the free stop is A1.1, "Im Bau" levels are never sold.
//   2. The content facts a ticket states are counted, not typed: the guided
//      plans are recounted from the program modules the course player walks.
//   3. The fit chooser and the course pages describe a level in the same words.
//   4. The claims this business does not make never appear on an offer
//      surface: no "most popular", scarcity, countdown, guarantee, learner
//      counts or testimonials.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  STATIONS, TICKET_STATIONS, FIT_CHOICES, FREE_COURSE_HREF, stationFor, ticketLines, planLine, OFFER_FAQ, minutesPerDay,
} from '../src/data/offers.js';
import { COMING_SOON_LEVELS, COURSE_PRO_MONTHS, SUBLEVEL_PRICES_EUR, ALL_LEVELS, eur, productKeyForLevel } from '../src/data/pricing.js';
import { PRO_SPEAKING_SESSIONS_PER_MONTH, PRO_WRITING_EVALUATIONS_PER_MONTH, PRO_DAILY_LIMIT } from '../src/data/marketing.js';
import { GUIDED_PLANS, COURSE_CONTENTS, LEVEL_OUTCOME_EN } from '../src/data/courseContents.js';
import { COURSES as GUIDED_COURSES } from '../src/data/courses/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('stations follow the commerce layer: free A1.1, priced tickets, Im Bau never sold', () => {
  assert.deepEqual(STATIONS.map((s) => s.level), ALL_LEVELS);
  for (const s of STATIONS) {
    if (s.level === 'a1.1') {
      assert.equal(s.status, 'free');
      assert.equal(s.price, null);
    } else if (COMING_SOON_LEVELS.includes(s.level)) {
      assert.equal(s.status, 'building', `${s.code} is coming soon`);
    } else {
      assert.equal(s.status, 'ticket');
      assert.equal(s.price, SUBLEVEL_PRICES_EUR[s.level]);
      assert.equal(s.priceLabel, eur(SUBLEVEL_PRICES_EUR[s.level]));
      assert.equal(s.productKey, productKeyForLevel(s.level));
    }
    assert.match(s.coursePage, /^\/courses\/[ab][12]-[12]\/$/, 'course pages carry the trailing slash');
  }
  assert.ok(TICKET_STATIONS.every((s) => s.status === 'ticket'));
  assert.equal(FREE_COURSE_HREF, '/course/a1.1');
});

test('the guided-plan facts are recounted from the programs the course player walks', () => {
  for (const [level, course] of Object.entries(GUIDED_COURSES)) {
    const days = course.program.weeks.flatMap((w) => w.days);
    const items = days.flatMap((d) => d.items || []);
    const minutes = items.reduce((sum, it) => sum + (it.minutes || 0), 0);
    assert.deepEqual(GUIDED_PLANS[level], { days: days.length, steps: items.length, minutes }, `${level}: refresh GUIDED_PLANS in courseContents.js`);
  }
  for (const s of TICKET_STATIONS) {
    assert.ok(s.plan, `${s.code} has a guided plan`);
    assert.match(planLine(s), new RegExp(`${s.plan.days}-day guided plan: ${s.plan.steps} steps`));
  }
  assert.ok(minutesPerDay(GUIDED_PLANS['a1.2']) % 5 === 0);
});

test('every ticket line states derived figures, never typed ones', () => {
  for (const s of TICKET_STATIONS) {
    const lines = ticketLines(s.level);
    assert.equal(lines.length, 4);
    const text = lines.map((l) => `${l.title} ${l.body}`).join(' ');
    const c = COURSE_CONTENTS[s.level];
    for (const fact of [COURSE_PRO_MONTHS, PRO_SPEAKING_SESSIONS_PER_MONTH, PRO_WRITING_EVALUATIONS_PER_MONTH, PRO_DAILY_LIMIT, c.words, c.missions, c.listeningQuestions]) {
      assert.ok(text.includes(String(fact)), `${s.code}: the ticket states ${fact}`);
    }
    assert.match(text, /No subscription/);
    for (const l of lines) assert.match(l.removes, /^[a-z].*\.$/, 'removes completes "No more …"');
  }
  assert.deepEqual(ticketLines('a1.1'), [], 'the free stop is not a ticket');
  assert.deepEqual(ticketLines('b1.1'), [], 'an Im Bau stop is not a ticket');
});

test('the fit chooser points each answer at the next stop, in the course pages’ words', () => {
  for (const c of FIT_CHOICES) {
    if (!c.level) continue;
    const s = stationFor(c.level);
    assert.ok(s && s.status !== 'building', `${c.id} points at an open stop`);
    if (c.level !== 'a1.1') {
      const previous = ALL_LEVELS[ALL_LEVELS.indexOf(c.level) - 1];
      assert.equal(c.detail, LEVEL_OUTCOME_EN[previous], `${c.id}: quotes the ${previous} outcome`);
    }
  }
  assert.ok(FIT_CHOICES.some((c) => c.level === null), 'there is a route for visitors past A2');
});

const OFFER_SURFACES = [
  'src/data/offers.js',
  'astro-site/src/data/homepage.js',
  'astro-site/src/pages/index.astro',
  ...readdirSync(join(ROOT, 'astro-site/src/components/linie')).map((f) => `astro-site/src/components/linie/${f}`),
];

test('offer surfaces make none of the claims this business does not make', () => {
  const banned = [
    [/most popular|best[- ]?seller|bestseller/i, 'popularity without evidence'],
    [/only \d+ (left|spots|seats)|limited (time|offer|spots)|selling fast|almost gone/i, 'scarcity'],
    [/count ?down|offer ends|ends (today|tonight|in \d)|expires in/i, 'a deadline'],
    [/guarantee|guaranteed|pass rate|you will pass|fluent in \d/i, 'an outcome promise'],
    [/\b\d[\d,.]*\+? (learners|students|users|customers|members)\b/i, 'a usage count'],
    [/testimonial|★|⭐|rated \d/i, 'testimonials or ratings'],
  ];
  for (const file of OFFER_SURFACES) {
    const src = read(file).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
    for (const [re, what] of banned) assert.doesNotMatch(src, re, `${file}: ${what}`);
  }
  // Refunds are an owner decision (strategy.md): no refund promise on a sales surface yet.
  for (const item of OFFER_FAQ) assert.doesNotMatch(`${item.q} ${item.a}`, /refund|money[- ]back/i);
});

test('a Buy button only ever renders behind a checkout id, and never for an Im Bau stop', () => {
  for (const file of ['LineSection.astro', 'FitChooser.astro', 'Ticket.astro']) {
    const src = read(`astro-site/src/components/linie/${file}`);
    for (const m of src.matchAll(/data-course-variant=\{([^}]+)\}/g)) {
      assert.match(m[1], /^variants\[/, `${file}: the variant comes from courseVariants.js`);
    }
    // every rendered variant is guarded by a truthy check of the same lookup
    assert.match(src, /variants\[[^\]]+\] (\?|&&)/, `${file}: Buy renders only when the id is set`);
  }
  const variants = read('astro-site/src/lib/courseVariants.js');
  assert.match(variants, /c\.comingSoon \? ''/, 'a coming-soon course never gets an id');
});
