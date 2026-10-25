// The level-test results screen (src/components/LevelTest/LevelTestResults.jsx).
//
//   1. "Areas to Focus On" and the "Review …" card name topics up to one band
//      above the result (C-165). Ranked by wrong count alone, an all-skip A1.1
//      run was sent to Relative Clauses and Konjunktiv I; grouped by display
//      name, "Reading Comprehension" linked whichever of four levels was missed
//      first, possibly a paid one.
//   2. The primary "Start your first lesson" lands in the course for the placed
//      level (C-168): Lektion 1 of the free course for an A1.1 result — the most
//      common one — instead of a grammar page.
//   3. A result at a ticket station (A1.2–A2.2) leads with that level's course
//      and one line to its ticket page; B1/B2 get the Pro route (C-096/C-109/
//      C-170). Every figure comes from offers.js / pricing.js. Owner review:
//      money and brand message (Team v5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { calculatePlacement, focusTopics, topicLink } from '../src/components/LevelTest/placementResult.js';
import { drawQuestions } from '../src/components/LevelTest/drawQuestions.js';
import { FIRST_LESSON_HREF, placedCourseHref } from '../src/lib/firstRun.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';
import { stationFor, stationStatusLine, EXAM_ROUTE } from '../src/data/offers.js';
import { LEVEL_COURSES, productKeyForLevel, eur } from '../src/data/pricing.js';
import { PLACEMENT_REF } from '../src/lib/placement.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const RESULTS = 'src/components/LevelTest/LevelTestResults.jsx';
const BANK = JSON.parse(read('src/data/levelTestQuestions.json')).questions;

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 1. focus topics ─────────────────────────────────────────────────────────

test('an all-skip A1.1 run never shows a B1/B2 chip or Review card', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const questions = drawQuestions(BANK, { random: seeded(seed) });
    const placement = calculatePlacement({ answers: [], questions });
    assert.equal(placement.sublevel, 'A1.1');
    const shown = focusTopics(placement.weakTopics, placement.sublevel);
    assert.ok(shown.length > 0 && shown.length <= 3);
    for (const topic of shown) assert.ok(['A1', 'A2'].includes(topic.level), `seed ${seed}: ${topic.topic} (${topic.level})`);
  }
});

test('focus topics: up to one band above the result, most-missed first, the lower band on a tie', () => {
  const weak = [
    { topic: 'Konjunktiv I', url: '/grammar/b2.1/k/', wrong: 4, level: 'B2' },
    { topic: 'Relative Clauses', url: '/grammar/b1.1/r/', wrong: 3, level: 'B1' },
    { topic: 'Dative', url: '/grammar/a2.1/d/', wrong: 2, level: 'A2' },
    { topic: 'sein', url: '/grammar/a1.1/s/', wrong: 2, level: 'A1' },
    { topic: 'Articles', url: '/grammar/a1.1/a/', wrong: 1, level: 'A1' },
  ];
  assert.deepEqual(focusTopics(weak, 'A1.1').map((t) => t.topic), ['sein', 'Dative', 'Articles']);
  assert.deepEqual(focusTopics(weak, 'A2.2').map((t) => t.topic), ['Relative Clauses', 'sein', 'Dative']);
  assert.deepEqual(focusTopics(weak, 'B1.1').map((t) => t.topic), ['Konjunktiv I', 'Relative Clauses', 'sein']);
  assert.deepEqual(focusTopics([], 'B2.2'), []);
});

test('weak topics are grouped by the page they link, and each link follows its trailing-slash case', () => {
  const reading = BANK.filter((q) => q.type === 'reading');
  const placement = calculatePlacement({ answers: [], questions: reading });
  assert.equal(placement.weakTopics.length, 4, 'one entry per reading level, not one "Reading Comprehension" for four');
  assert.deepEqual(placement.weakTopics.map((t) => t.url), ['/reading/a1.1', '/reading/a2.1', '/reading/b1.1', '/reading/b2.1']);
  for (const q of BANK) {
    const url = topicLink(q.relatedTopicUrl);
    if (url.startsWith('/grammar/')) assert.match(url, /\/$/, `${q.id}: Astro pages end in a slash`);
    else assert.doesNotMatch(url, /\/$|\/(\?|$)|=[^&]*\/$/, `${q.id}: app routes carry no slash (${url})`);
  }
  assert.equal(topicLink('/level/a1.1?tab=vocabulary'), '/level/a1.1?tab=vocabulary', 'the tab survives');
});

test('the screen ranks with focusTopics for both the chips and the Review card', () => {
  const src = read(RESULTS);
  assert.match(src, /const topWeakTopics = focusTopics\(weakTopics, finalSublevel\);/);
  assert.match(src, /\{topWeakTopics\.map\(\(topic, index\) => \(/);
  assert.match(src, /\{topWeakTopics\[0\] && \(/);
  assert.doesNotMatch(src, /\[\.\.\.weakTopics\]\.sort/);
});

// ── 2 & 3. where the result leads, evaluated from the screen's own code ─────

/** The screen's destination block, run with the real modules for one result. */
function destinations(finalSublevel) {
  const src = read(RESULTS);
  const block = src.slice(src.indexOf('  const placedCourse = placedCourseHref(finalSublevel);'), src.indexOf('  // The placement hook into the free A1.1 course'));
  assert.ok(block.includes('stationFor(finalSublevel)'), 'the destination block moved');
  return new Function('finalSublevel', 'placedCourseHref', 'getTopicsForLevel', 'stationFor', 'stationStatusLine', 'EXAM_ROUTE', 'PLACEMENT_REF',
    `${block}\nreturn { placedCourse, firstLesson, station, placedTicket, proHref };`)(
    finalSublevel, placedCourseHref, getTopicsForLevel, stationFor, stationStatusLine, EXAM_ROUTE, PLACEMENT_REF);
}

test('an A1.1 result starts Lektion 1 of the free course (a router link), with no offer', () => {
  const d = destinations('A1.1');
  assert.deepEqual(d.firstLesson, { to: FIRST_LESSON_HREF });
  assert.equal(FIRST_LESSON_HREF, '/course/a1.1/l/1');
  assert.equal(d.placedTicket, null);
  assert.equal(d.proHref, null);
  assert.match(read(RESULTS), /<Button variant="celebrate" size="lg" \{\.\.\.firstLesson\} className="flex-1">/);
});

test('A1.2 and A2.1 results lead with their own course and their ticket, priced from pricing.js', () => {
  for (const [level, start] of [['A1.2', '/course/a1.2/l/1'], ['A2.1', '/course/a2.1'], ['A2.2', '/course/a2.2']]) {
    const d = destinations(level);
    const lower = level.toLowerCase();
    assert.deepEqual(d.firstLesson, { to: start }, `${level}: the course, not a grammar slug`);
    assert.equal(d.placedTicket.to, start);
    const course = LEVEL_COURSES[productKeyForLevel(lower)];
    assert.ok(d.placedTicket.ticketLine.includes(eur(course.price)), `${level}: the price is pricing.js's`);
    assert.equal(d.placedTicket.ticketLine, `Your stop: ${level} · ${stationStatusLine(stationFor(lower))}`);
    const u = new URL(d.placedTicket.ticketHref, 'https://deutsch-meister.de');
    assert.equal(u.pathname, stationFor(lower).coursePage, 'the Astro ticket page (trailing slash)');
    assert.match(u.pathname, /\/$/);
    assert.equal(u.searchParams.get('ref'), PLACEMENT_REF);
    assert.equal(u.searchParams.get('utm_medium'), 'onsite');
    assert.equal(u.searchParams.get('utm_content'), lower);
    assert.equal(d.proHref, null);
  }
});

test('a B1/B2 result keeps its grammar start and gets the Pro route offers.js names', () => {
  for (const level of ['B1.1', 'B2.2']) {
    const d = destinations(level);
    const lower = level.toLowerCase();
    assert.equal(d.placedTicket, null, 'no course to sell yet (Im Bau)');
    assert.deepEqual(d.firstLesson, { href: `/grammar/${lower}/${getTopicsForLevel(lower)[0].slug}/` });
    const u = new URL(d.proHref, 'https://deutsch-meister.de');
    assert.equal(`${u.pathname}${u.hash}`, EXAM_ROUTE.links.find((l) => l.href.startsWith('/pricing/')).href);
    assert.equal(u.searchParams.get('ref'), PLACEMENT_REF);
    assert.equal(u.searchParams.get('utm_content'), lower);
  }
});

test('the offer card is built from offers.js and the A1.1 card stays for every result', () => {
  const src = read(RESULTS);
  assert.match(src, /import \{ stationFor, stationStatusLine, EXAM_ROUTE \} from '\.\.\/\.\.\/data\/offers\.js';/);
  assert.doesNotMatch(src, /€\s?\d|\d\s?€|EUR\b/, 'no price typed by hand');
  assert.match(src, /\{placedTicket && \(/);
  assert.match(src, /<Link to=\{placedTicket\.to\}/, 'the course is an SPA route');
  assert.match(src, /<a href=\{placedTicket\.ticketHref\}/, 'the ticket page is an Astro page: a full load that keeps the tag');
  assert.match(src, /<Card interactive as=\{Link\} to=\{courseHref\}/, 'the free A1.1 card is still offered');
});
