// Guard suite for the guided course player (decision 2026-09-08: a course is a
// separate identity — enrol, lesson 1 → …, final test, completion). Pins the
// pure sequencing (src/lib/courseFlow.js), the registry, and the three-place
// route rule for /course/*.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { flattenCourse, isUnlocked, currentItem, isComplete, percentDone, nextItem, INSTRUCTION } from '../src/lib/courseFlow.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const course = {
  level: 'x1.1', programKey: 'x', program: { weeks: [
    { title: 'W1', intro: '', days: [{ label: 'Tag 1', items: [{ id: 'a', type: 'lesson', title: 'A', minutes: 10, href: '/x' }, { id: 'b', type: 'review', title: 'B', minutes: 5, href: '/y' }] }] },
    { title: 'W2', intro: '', days: [{ label: 'Tag 2', items: [{ id: 'c', type: 'exam', title: 'C', minutes: 30, href: '/z' }] }] },
  ] },
};

test('flattenCourse keeps program order and annotates position, unit and day', () => {
  const items = flattenCourse(course);
  assert.deepEqual(items.map((i) => i.id), ['a', 'b', 'c']);
  assert.deepEqual(items.map((i) => i.position), [0, 1, 2]);
  assert.equal(items[2].weekIndex, 1);
  assert.equal(items[1].dayCount, 2);
});

test('lessons unlock strictly in sequence and the current lesson is the first not done', () => {
  const items = flattenCourse(course);
  const none = new Set();
  assert.equal(isUnlocked(items, 0, none), true, 'lesson 1 is always open');
  assert.equal(isUnlocked(items, 1, none), false);
  assert.equal(currentItem(items, none).id, 'a');
  const one = new Set(['a']);
  assert.equal(isUnlocked(items, 1, one), true);
  assert.equal(isUnlocked(items, 2, one), false, 'skipping is not possible');
  assert.equal(currentItem(items, one).id, 'b');
  assert.equal(nextItem(items, 2), null);
  assert.equal(percentDone(items, one), 33);
  assert.equal(isComplete(items, new Set(['a', 'b', 'c'])), true);
  assert.equal(currentItem(items, new Set(['a', 'b', 'c'])), null);
});

test('every program item type the runner styles has an instruction', () => {
  for (const t of ['lesson', 'listening', 'reading', 'speaking', 'xray', 'exam', 'review']) assert.ok(INSTRUCTION[t], `no instruction for ${t}`);
});

test('the registry covers the four A sub-levels with their final tests, and the routes exist in all three places', async () => {
  const { COURSES, COURSE_LEVELS } = await import('../src/data/courses/index.js');
  assert.deepEqual(COURSE_LEVELS, ['a1.1', 'a1.2', 'a2.1', 'a2.2']);
  const tests = read('src/data/courseTests/index.js');
  for (const c of Object.values(COURSES)) {
    assert.ok(tests.includes(`slug: '${c.testSlug}'`), `${c.level} final test ${c.testSlug} is not a registered course test`);
    assert.ok(flattenCourse(c).length > 20, `${c.level} program is suspiciously short`);
    const ids = flattenCourse(c).map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `${c.level} has duplicate item ids`);
  }
  const app = read('src/App.jsx');
  for (const p of ['/course/:level', '/course/:level/:itemId', '/course/:level/complete', '/course/:level/certificate']) assert.ok(app.includes(`path="${p}"`), `missing route ${p}`);
  assert.ok(app.includes('<CourseReturnBar />'), 'the return bar must be mounted in the shell');
  assert.ok(read('netlify.toml').includes('from = "/course/*"'), '/course/* must be rewritten to /app.html (three-place rule)');
  assert.ok(read('astro-site/src/layouts/Layout.astro').includes("sessionStorage.getItem('dm_course_ctx')"), 'static lessons must render the return bar');
});
