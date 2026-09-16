// A1.1 preview → checkout funnel — plan Task 2
// (a11-organic-commercial-launch).
//
// The commercial seam: three complete preview lessons, then a bridge that
// carries the learner (and their attribution) into the €39 checkout, while
// the PUBLIC A1.1 library stays free.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canOpenGuidedCourseItem, A11_PREVIEW_LESSONS } from '../src/lib/guidedCourseAccess.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';
import { LEVEL_COURSES } from '../src/data/pricing.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const preview = (kind, nr) => canOpenGuidedCourseItem({ level: 'a1.1', kind, nr, ownsCourse: false, hasSubscription: false });

test('the preview is exactly lessons 1-3 and lesson 4 is denied by direct URL', () => {
  assert.equal(A11_PREVIEW_LESSONS, 3);
  for (const nr of [1, 2, 3]) assert.equal(preview('lesson', nr), true, `lesson ${nr} must be previewable`);
  assert.equal(preview('lesson', 4), false, 'lesson 4 must be denied');
  assert.equal(preview('checkpoint', 1), false);
});

test('a purchase opens lesson four', () => {
  assert.equal(canOpenGuidedCourseItem({
    level: 'a1.1', kind: 'lesson', nr: 4, ownsCourse: true, hasSubscription: false,
  }), true);
});

test('the public A1.1 library stays free', () => {
  assert.ok(FREE_LEVELS.includes('a1.1'), 'the library paywall must never close');
});

test('the preview-complete bridge says what was learned and what remains', () => {
  const src = read('src/components/course/A11PreviewComplete.jsx');
  assert.match(src, /You completed the free route\./);
  assert.match(src, /introduce yourself, give personal details and order in a café/);
  // The "9" derives (12 − preview lessons) rather than being typed, so the
  // sentence is pinned around the derivation.
  assert.match(src, /remainingLessons = 12 - \(course\.previewLessons \|\| 3\)/);
  assert.match(src, /\{remainingLessons\} more real-life situations, 4 checkpoints and the final assessment/);
  assert.match(src, /Unlock DeutschStart A1\.1/);
  // Lifetime access, included speaking and the refund promise sit under the button.
  assert.match(src, /lifetime|Lifetime/);
  assert.match(src, /30-day/);
  assert.match(src, /Review my free lessons/, 'the secondary link back to the free lessons is missing');
  // Price and speaking figures derive — no retyped literals.
  assert.doesNotMatch(src.replace(/^\s*\/\/.*$/gm, ''), /€\s?39|\b39\s?€/, 'retyped price literal in the bridge');
  assert.match(src, /LEVEL_COURSES|eur\(/);
});

test('the bridge renders after preview lesson three and at the locked lesson', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(player, /A11PreviewComplete/, 'the lesson player must show the bridge after lesson 3');
  assert.match(player, /A11_PREVIEW_LESSONS|previewComplete/);
  const guard = read('src/components/GuidedCourseGuard.jsx');
  assert.match(guard, /A11PreviewComplete|Unlock/, 'the locked-lesson screen must carry the same offer');
});

test('attribution is a closed set and rides the existing buy-intent mechanism', () => {
  const buyIntent = read('src/lib/buyIntent.js');
  assert.match(buyIntent, /normalizeA11Source|A11_SOURCES/, 'buy intent must normalize its source');
  assert.match(buyIntent, /course_a1_1|course_\[a-z0-9\]\+|course_/, 'the A1.1 product key must be a valid intent');
  // Arbitrary metadata may never reach Lemon Squeezy custom data.
  const ls = read('src/config/lemonsqueezy.js');
  const checkout = ls.slice(ls.indexOf('getCheckoutUrl'), ls.indexOf('getCheckoutUrl') + 900);
  const customKeys = [...checkout.matchAll(/checkout\[custom\]\[(\w+)\]/g)].map((m) => m[1]);
  for (const key of customKeys) {
    assert.ok(['user_id', 'coupon', 'source', 'product_key'].includes(key), `unexpected checkout custom key: ${key}`);
  }
});

test('the A1.1 product the funnel checks out is the €39 one-time course', () => {
  assert.equal(LEVEL_COURSES.course_a1_1.price, 39);
  assert.equal(LEVEL_COURSES.course_a1_1.previewLessons, A11_PREVIEW_LESSONS);
});
