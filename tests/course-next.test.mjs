// Guard suite for the dashboard's "Continue" (src/lib/courseNext.js).
//
// The hero used to resume the grammar library, so a learner who had just paid
// for a level pressed "Keep learning" and landed somewhere other than the
// course they bought. These tests pin which course the hero continues, that
// it reads the progress key the course home writes, that its links are the
// routes the course home links, and that it never points at a lock.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { courseLevelFor, courseNextStep, programKeyForCourse, curriculumNodeHref } from '../src/lib/courseNext.js';
import { COURSES } from '../src/data/courses/index.js';
import { CURRICULA, curriculumPath } from '../src/data/curricula/index.js';
import { flattenCourse } from '../src/lib/courseFlow.js';
import { productKeyForLevel } from '../src/data/pricing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const all = () => true;
const freeOnly = (l) => l === 'a1.1';

test('a bought level wins over the placement and the grammar walk', () => {
  const purchases = [{ product_key: productKeyForLevel('a1.2'), created_at: '2026-10-01T10:00:00Z' }];
  assert.equal(courseLevelFor({ purchases, currentLevel: 'a1', walkLevel: 'a1.1', hasLevelAccess: all }), 'a1.2');
  // The newest purchase is the one being continued.
  const two = [
    { product_key: productKeyForLevel('a1.2'), created_at: '2026-09-01T10:00:00Z' },
    { product_key: productKeyForLevel('a2.1'), created_at: '2026-10-02T10:00:00Z' },
  ];
  assert.equal(courseLevelFor({ purchases: two, walkLevel: 'a1.1', hasLevelAccess: all }), 'a2.1');
});

test('without a purchase: the placed level, then the walk, and never a level the learner may not open', () => {
  assert.equal(courseLevelFor({ currentLevel: 'A2.1', walkLevel: 'a2.1', hasLevelAccess: all }), 'a2.1');
  // 'a1' is the column default, not a placement: the beginner continues the free course.
  assert.equal(courseLevelFor({ currentLevel: 'a1', walkLevel: 'a1.1', hasLevelAccess: freeOnly }), 'a1.1');
  // Placed above the free level without access: no course hero (the grammar fallback decides).
  assert.equal(courseLevelFor({ currentLevel: 'A2.1', walkLevel: 'a2.1', hasLevelAccess: freeOnly }), null);
  // B1/B2 have no course yet.
  assert.equal(courseLevelFor({ currentLevel: 'B1.1', walkLevel: 'b1.1', hasLevelAccess: all }), null);
});

test('progress is read under the key each course home writes', () => {
  const curriculumHome = read('src/pages/CurriculumHomePage.jsx');
  assert.match(curriculumHome, /export const programKeyFor = \(level\) => `\$\{String\(level\)\.toLowerCase\(\)\.replace\('\.', ''\)\}_course`;/);
  for (const level of Object.keys(CURRICULA)) assert.equal(programKeyForCourse(level), `${level.replace('.', '')}_course`);
  for (const [level, course] of Object.entries(COURSES)) {
    if (!CURRICULA[level]) assert.equal(programKeyForCourse(level), course.programKey, `${level} reads the 28-day program's key`);
  }
  assert.equal(programKeyForCourse('b1.1'), null);
});

test('the next step walks the course in order and its links are the course home’s routes', () => {
  // The rebuilt A1.1 curriculum: Lektion 1 first, then the next open node.
  const path = curriculumPath(CURRICULA['a1.1']);
  const first = courseNextStep('a1.1', new Set());
  assert.equal(first.kind, 'step');
  assert.equal(first.href, '/course/a1.1/l/1');
  assert.equal(first.started, false);
  const after = courseNextStep('a1.1', new Set([path[0].id]));
  assert.equal(after.href, curriculumNodeHref('a1.1', path[1]));
  assert.equal(after.started, true);
  assert.equal(after.position, 1);
  const home = read('src/pages/CurriculumHomePage.jsx');
  for (const route of ['`/course/${level}/l/${node.nr}`', '`/course/${level}/checkpoint/${node.nr}`', '`/modelltest/${node.testSlug}`']) {
    assert.ok(home.includes(route), `CurriculumHomePage still links ${route}`);
  }
  // A 28-day program: the first item that is not done (CourseHomePage's currentItem).
  const items = flattenCourse(COURSES['a1.2']);
  const step = courseNextStep('a1.2', new Set([items[0].id, items[1].id]));
  assert.equal(step.href, `/course/a1.2/${encodeURIComponent(items[2].id)}`);
  assert.equal(step.total, items.length);
});

test('a finished course says so and names the next stop', () => {
  const items = flattenCourse(COURSES['a1.2']);
  const done = courseNextStep('a1.2', new Set(items.map((i) => i.id)));
  assert.deepEqual(done, { kind: 'complete', level: 'a1.2', code: 'A1.2', next: 'a2.1', total: items.length });
  assert.equal(courseNextStep('b1.1', new Set()), null);
});

test('the dashboard hero continues the course and keeps grammar as the fallback', () => {
  const dash = read('src/pages/DashboardPage.jsx');
  assert.match(dash, /courseLevelFor\(\{/);
  assert.match(dash, /getProgramProgress\(user\.id, programKeyForCourse\(courseLevel\)\)/);
  assert.match(dash, /courseNextStep\(courseLevel, courseDone\)/);
  assert.match(dash, /`\/grammar\/\$\{cur\.level\}\/\$\{cur\.nextTopic\.slug\}\/`/, 'grammar stays the fallback');
});
