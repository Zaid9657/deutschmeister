// The A1.2 rebuild on the A1.1 standard (owner: "start now", 2026-10-15). One file for the rules the
// rebuild adds, so each finding class it closes keeps a test that fails on the old code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { exclusionReason, isUsableItem, REASON } from '../src/data/lessonPools/quality.js';
import { pickPracticeItems, planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { requeueFor } from '../src/lib/lesson/requeue.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const POOL_A12 = JSON.parse(read('src/data/lessonPools/a12.json'));

test('a course draws its practice by its OWN level\'s rules, not A1.1\'s', () => {
  // The quality filter's syllabus rules (no accusative, no ordinals, no month names …) are A1.1's and
  // apply when no level is named. The draw named none, so 57 of A1.2's 254 pool items never reached a
  // learner — „Ich sehe ___ Mann." → den, in the very Lektion that teaches the accusative — and L3
  // drew 3 of its 7 items, L10 two (measured 2026-10-15).
  const items = poolItems(POOL_A12);
  const a12Only = items.filter((it) => isUsableItem(it, { level: 'a1.2' }) && !isUsableItem(it));
  assert.ok(a12Only.length >= 50, `the class this guards: ${a12Only.length} A1.2 items fail A1.1's rules`);
  assert.ok(a12Only.some((it) => exclusionReason(it) === REASON.UNTAUGHT_FORM));

  for (const attempt of [1, 2]) {
    const plan = planPractice(CURRICULUM_A12, POOL_A12, attempt);
    for (const l of CURRICULUM_A12.lektionen) {
      assert.equal(plan.get(l.nr).length, 7, `A1.2 L${l.nr}, attempt ${attempt}: a full seven`);
    }
  }

  // The same item, drawn standalone and requeued: kept at A1.2, dropped by the A1.1 default.
  const item = a12Only.find((it) => it.topic === 'accusative-intro') || a12Only[0];
  const rule = { topics: [item.topic], typedMin: 0 };
  const drawn = (level) => pickPracticeItems([item], rule, 1, { level }).map((it) => it.id);
  assert.deepEqual(drawn('a1.2'), [item.id]);
  assert.deepEqual(drawn(undefined), [], 'no level = the strict A1.1 rules, never a loophole');
  const missed = [{ ...item, id: 'missed-1' }];
  assert.deepEqual(requeueFor(missed, [item], [], { level: 'a1.2' }).map((it) => it.id), [item.id], 'a fresh item of the same topic');
  assert.deepEqual(requeueFor(missed, [item], []).map((it) => it.id), ['missed-1'], 'under A1.1 rules the fresh item is filtered out and the missed one comes back');

  // Every caller names the level.
  assert.match(read('src/lib/lesson/buildLesson.js'), /isUsableItem\(it, \{ level: options\.level \}\)/);
  assert.match(read('src/lib/lesson/requeue.js'), /isUsableItem\(it, \{ level \}\)/);
  assert.match(read('src/pages/lesson/LessonPlayerPage.jsx'), /requeueFor\(misses, pool, used, \{ level: curriculum\.level \}\)/);
});
