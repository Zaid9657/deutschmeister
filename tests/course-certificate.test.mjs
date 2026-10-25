// Guard suite for the two-ledger split (2026-09-19): a REBUILT level
// (curriculumFor(level) exists — A1.1 today) must read progress under
// programKeyFor(level) and count against curriculumPath(curriculum), never
// the legacy 28-day program.programKey/flattenCourse pair. Source pins only
// (no jsdom/React renderer in this repo's test setup — see
// tests/course-player.test.mjs for the same style).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const PAGES = ['src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx'];

test('both pages import and use curriculumFor/curriculumPath and programKeyFor', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /from '\.\.\/data\/curricula\/index\.js'/, `${f} must import from data/curricula/index.js`);
    assert.match(src, /curriculumFor\(/, `${f} must call curriculumFor`);
    assert.match(src, /curriculumPath\(/, `${f} must call curriculumPath`);
    assert.match(src, /from '\.\.\/services\/lessonService\.js'/, `${f} must import programKeyFor from lessonService.js`);
    assert.match(src, /programKeyFor\(/, `${f} must call programKeyFor`);
  }
});

test('the curriculum branch reads program_progress under programKeyFor(level), never a hard-coded program key', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /const programKey = curriculum \? programKeyFor\(level\) : course(\?\.|\.)programKey;/, `${f} must switch its program_progress key on whether a curriculum exists`);
  }
});

test('the legacy branch (courseFor + flattenCourse + course.programKey) is retained unconditionally', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /courseFor\(level\)/, `${f} must still call courseFor for legacy levels`);
    assert.match(src, /flattenCourse\(/, `${f} must still call flattenCourse for the legacy branch`);
  }
});

test('completion, for a curriculum, requires every node of curriculumPath done (mirrors CurriculumHomePage)', () => {
  const home = read('src/pages/CurriculumHomePage.jsx');
  assert.match(home, /firstOpenIndex === -1/, 'CurriculumHomePage completion is "no open node" — the reference definition');
  for (const f of PAGES) {
    const src = read(f);
    assert.match(
      src,
      /path\.length > 0 && path\.every\(\(n\) => done\.has\(n\.id\)\)/,
      `${f} must define curriculum completion as every path node done, including the leveltest node`,
    );
  }
});

test('the certificate carries the DaF disclaimer text (docs/course-standard-2026-09-12.md §4)', () => {
  const src = read('src/pages/CourseCertificatePage.jsx');
  assert.ok(src.includes('Teilnahmebescheinigung — DeutschMeister'), 'certificate must carry the Teilnahmebescheinigung heading for a rebuilt level');
  assert.ok(src.includes('kein Goethe-/telc-Ergebnis'), 'certificate must state plainly it is not a Goethe/telc result');
});

test('the certificate and complete page counts are derived from curriculum/path data, never typed literals', () => {
  const cert = read('src/pages/CourseCertificatePage.jsx');
  assert.match(cert, /path\.filter\(\(n\) => n\.kind === 'lektion' && done\.has\(n\.id\)\)\.length/, 'Lektionen-done count must be derived from path + done');
  assert.match(cert, /curriculum\.lektionen\.length/, 'Lektionen total must be derived from curriculum.lektionen');
  assert.match(cert, /path\.filter\(\(n\) => n\.kind === 'checkpoint' && done\.has\(n\.id\)\)\.length/, 'checkpoints-done count must be derived from path + done');
  assert.match(cert, /curriculum\.checkpoints\.length/, 'checkpoints total must be derived from curriculum.checkpoints');

  const complete = read('src/pages/CourseCompletePage.jsx');
  assert.match(complete, /curriculum\.lektionen\.reduce\(\(s, l\) => s \+ \(l\.wortfeld\?\.length \|\| 0\), 0\)/, 'words-met must be summed from every Lektion\'s wortfeld length');
});

// What's next, derived (2026-10-25 cross-check, LSN-03). The card told every rebuilt level that the
// next one was "a paused draft" — written while A1.2 was one. A1.2 has been a live course since
// 2026-10-22 (CURRICULA) and A2.1 after it has its 28-day course, so the warmest buyer, a learner who
// has just finished A1.1, was told there was nothing to buy. nextStepFor derives the step from the
// registries; it is pure, so the test runs the page's own function against the real data modules.
async function loadNextStepFor() {
  const src = read('src/pages/CourseCompletePage.jsx');
  const fn = src.match(/export function nextStepFor\([\s\S]*?\n\}\n/);
  assert.ok(fn, 'CourseCompletePage defines nextStepFor');
  const { courseFor } = await import('../src/data/courses/index.js');
  const { curriculumFor } = await import('../src/data/curricula/index.js');
  const { stationFor, ticketLines } = await import('../src/data/offers.js');
  const { productKeyForLevel } = await import('../src/data/pricing.js');
  const { courseHome } = await import('../src/lib/courseFlow.js');
  const context = vm.createContext({ courseFor, curriculumFor, stationFor, ticketLines, productKeyForLevel, courseHome });
  vm.runInContext(fn[0].replace('export function', 'function'), context);
  return { nextStepFor: context.nextStepFor, stationFor, ticketLines, productKeyForLevel };
}

test('after A1.1 the next step is the live A1.2 course: the course itself with access, its ticket without', async () => {
  const { nextStepFor, stationFor, ticketLines, productKeyForLevel } = await loadNextStepFor();
  const owner = (level) => level === 'a1.2';
  const none = () => false;
  assert.deepEqual(JSON.parse(JSON.stringify(nextStepFor('a1.1', owner))), { kind: 'continue', level: 'a1.2', to: '/course/a1.2' });
  const offer = nextStepFor('a1.1', none);
  assert.equal(offer.kind, 'offer', 'never "a paused draft" for a live level');
  assert.equal(offer.level, 'a1.2');
  assert.equal(offer.productKey, productKeyForLevel('a1.2'), 'Buy resumes /subscription?buy=<the pricing.js key>');
  assert.deepEqual(offer.station, stationFor('a1.2'), 'price and status come from offers.js, never retyped');
  assert.deepEqual(offer.ticket, ticketLines('a1.2')[0]);
  assert.equal(offer.coursePage, '/courses/a1-2/');
  // A1.2 finishers: A2.1 has a course, so it is offered too; the legacy ledger reads the same rule.
  assert.equal(nextStepFor('a1.2', none).kind, 'offer');
  assert.equal(nextStepFor('a1.2', none).level, 'a2.1');
  assert.equal(nextStepFor('a2.1', (level) => level === 'a2.2').to, '/course/a2.2');
  // Only a level without any course is the draft.
  assert.deepEqual(JSON.parse(JSON.stringify(nextStepFor('a2.2', none))), { kind: 'draft', level: 'b1.1' });
});

test('the next-step card renders what nextStepFor decided: the course, the offer with a gated Buy, or the draft', () => {
  const src = read('src/pages/CourseCompletePage.jsx');
  assert.match(src, /const step = subLoading \? null : nextStepFor\(level, hasLevelAccess\);/, 'no offer before entitlements load');
  // The draft sentence and the catalogue link are the draft branch, and only that branch.
  const draft = src.slice(src.indexOf("step?.kind === 'draft' ? ("), src.indexOf(') : (', src.indexOf("step?.kind === 'draft' ? (")));
  assert.match(draft, /paused draft/);
  assert.ok(draft.includes('to="/courses/"') && draft.includes('All courses'), 'the draft branch links the catalogue');
  assert.equal((src.match(/is a paused draft, not a guided course yet/g) || []).length, 1, 'the draft sentence is said nowhere else');
  // The offer: a Buy only when the checkout id is set, through the buy-intent path, tracked.
  assert.match(src, /const checkoutReady = step\?\.kind === 'offer' && Boolean\(LEMONSQUEEZY_CONFIG\.levelCourses\[step\.productKey\]\?\.variantId\);/);
  assert.match(src, /<Button to=\{`\/subscription\?buy=\$\{step\.productKey\}`\} onClick=\{buyNext\}/);
  assert.match(src, /track\('checkout_intent', \{ product: step\.productKey, surface: 'course_complete'/);
  assert.match(src, /if \(!user\) setBuyIntent\(step\.productKey\);/, 'a signed-out Buy is resumed after sign-up');
  assert.match(src, /<a href=\{step\.coursePage\}/, 'the course page is an Astro page: a full page load');
  assert.match(src, /<Link to=\{step\.to\}/, 'the next course itself for a learner with access');
});

// No pass promise, no fee, no bare usage-count claim — same family of bans as
// tests/guides.test.mjs and tests/claims.test.mjs.
const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen|guaranteed pass|guarantee[sd]? to pass)\b/i;

test('neither page makes an outcome/pass promise', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.ok(!OUTCOME.test(src), `${f} must not contain an outcome/pass promise`);
  }
});

test('no price literal (Euro sign or bare price number) appears in either page', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.ok(!/€|EUR\s?\d/.test(src), `${f} must not carry a price literal`);
  }
});
