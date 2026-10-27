// A retry never shows a word the course has not taught yet (2026-10-25 cross-check, LSN-06).
//
// The practice draw serves a pool item only from its `minLektion` on — a HARD filter, never relaxed
// (buildLesson.js pickPracticeItems). The requeue drew its "different variant of the same topic"
// through quality and topic alone, so an L2 miss on „Ich ___ Studentin. (sein)" came back as
// „Ich ___ müde." (stamped L11): measured on the first-attempt plans, 21 of 84 single-miss retries in
// A1.1 and 25 of 84 in A1.2 picked an item beyond the learner's Lektion. The player now hands
// requeueFor the ids its Lektion may not serve (requeue.js unservableIds) beside the ones already
// seen; the miss comes back as itself when its topic has nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickPracticeItems, planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { requeueFor, servableIn, unservableIds } from '../src/lib/lesson/requeue.js';
import { isUsableItem } from '../src/data/lessonPools/quality.js';
import { curriculumFor } from '../src/data/curricula/index.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const LEVELS = [['a1.1', 'a11'], ['a1.2', 'a12']].map(([level, file]) => ({
  level, curriculum: curriculumFor(level), pool: JSON.parse(read(`src/data/lessonPools/${file}.json`)),
}));

/** The retry exactly as the player asks for it on entering the requeue stage. */
const playerRequeue = (misses, pool, seenIds, { level, lektionNr }) =>
  requeueFor(misses, pool, [...seenIds, ...unservableIds(pool, lektionNr)], { level });

test('servableIn gives the practice draw\'s verdict for every pool item in every Lektion', () => {
  for (const { level, curriculum, pool } of LEVELS) {
    let checked = 0;
    for (const item of poolItems(pool)) {
      for (const { nr } of curriculum.lektionen) {
        const drawn = pickPracticeItems([item], { topics: [item.topic], typedMin: 0 }, 1, { level, lektionNr: nr }).length === 1;
        assert.equal(isUsableItem(item, { level }) && servableIn(item, nr), drawn, `${level} ${item.id} in L${nr}`);
        checked += 1;
      }
    }
    assert.ok(checked > 3000, `${level}: the whole pool against every Lektion (${checked})`);
  }
  assert.equal(servableIn({ id: 'x', minLektion: null }, 12), false, 'null is never served');
  assert.equal(servableIn({ id: 'x', minLektion: 5 }, 4), false);
  assert.equal(servableIn({ id: 'x', minLektion: 5 }, 5), true);
  assert.equal(servableIn({ id: 'x' }, 1), true, 'an unstamped (hand-built) item is left alone');
});

test('no retry from any first-attempt plan (A1.1, A1.2) is beyond its Lektion — and every one is still a different item', () => {
  for (const { level, curriculum, pool } of LEVELS) {
    const plan = planPractice(curriculum, pool, 1);
    let before = 0;
    for (const { nr } of curriculum.lektionen) {
      const seven = plan.get(nr);
      const seen = seven.map((it) => it.id);
      for (const missed of seven) {
        const [old] = requeueFor([missed], pool, seen, { level });
        if (!servableIn(old, nr)) before += 1;
        const [pick] = playerRequeue([missed], pool, seen, { level, lektionNr: nr });
        assert.ok(servableIn(pick, nr), `${level} L${nr}: ${missed.id} retried as ${pick.id} (minLektion ${pick.minLektion})`);
        assert.equal(pick.topic, missed.topic, 'same topic');
        assert.notEqual(pick.id, missed.id, `${level} L${nr}: the topic still has a variant this Lektion may show`);
      }
      // A run with several misses keeps the bound too.
      for (const pick of playerRequeue(seven, pool, seen, { level, lektionNr: nr })) {
        assert.ok(servableIn(pick, nr), `${level} L${nr}: ${pick.id} in a multi-miss retry`);
      }
    }
    assert.ok(before > 0, `${level}: without the bound some retries were beyond their Lektion (the finding)`);
  }
});

test('the measured case: an L2 „sein" miss is no longer retried with the L11 item', () => {
  const { curriculum, pool } = LEVELS[0];
  const late = poolItems(pool).find((it) => it.topic === 'verb-sein' && it.minLektion === 11);
  assert.ok(late, 'the pool has a sein item stamped for L11');
  const l2 = planPractice(curriculum, pool, 1).get(2);
  const missed = l2.find((it) => it.questionDe === 'Ich ___ Studentin. (sein)');
  assert.ok(missed, 'L2 drills „Ich ___ Studentin."');
  const seen = l2.map((it) => it.id);
  assert.deepEqual(requeueFor([missed], pool, seen, { level: 'a1.1' }).map((p) => p.id), [late.id], 'the finding, reproduced: the unbounded retry');
  const [pick] = playerRequeue([missed], pool, seen, { level: 'a1.1', lektionNr: 2 });
  assert.notEqual(pick.id, late.id);
  assert.ok(pick.minLektion <= 2, `retried as ${pick.id}, stamped L${pick.minLektion}`);
});

test('when the topic has nothing this Lektion may show, the missed item itself comes back', () => {
  const missed = { id: 'm1', topic: 'demo', questionDe: 'Ich ___ Ana.', answer: 'bin', minLektion: 1 };
  const later = { id: 'm2', topic: 'demo', questionDe: 'Ich ___ müde.', answer: 'bin', minLektion: 11 };
  const never = { id: 'm3', topic: 'demo', questionDe: 'Ich ___ hier.', answer: 'bin', minLektion: null };
  const pool = [missed, later, never];
  assert.deepEqual(unservableIds(pool, 2), ['m2', 'm3']);
  assert.deepEqual(playerRequeue([missed], pool, ['m1'], { level: 'a1.2', lektionNr: 2 }).map((it) => it.id), ['m1']);
  assert.deepEqual(playerRequeue([missed], pool, ['m1'], { level: 'a1.2', lektionNr: 11 }).map((it) => it.id), ['m2'], 'from L11 on, the variant is fair');
  assert.deepEqual(requeueFor([missed], pool, ['m1'], { level: 'a1.2' }).map((it) => it.id), ['m2'], 'requeueFor itself is unchanged for callers that pass no bound');
});

test('the player asks for the retry with its Lektion\'s bound, in the one place it requeues', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(player, /const used = \[\.\.\.attempts\.map\(\(a\) => a\.itemId\), \.\.\.unservableIds\(pool, lektion\.nr\)\];\s*const items = requeueFor\(misses, pool, used, \{ level: curriculum\.level \}\);/);
  assert.match(player, /import \{ prevStageIndex, requeueFor, unservableIds \} from '\.\.\/\.\.\/lib\/lesson\/requeue\.js';/);
});
