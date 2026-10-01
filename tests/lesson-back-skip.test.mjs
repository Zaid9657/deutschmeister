// "Back" in the lesson player must skip what "Next" skips.
//
// advance() in src/pages/lesson/LessonPlayerPage.jsx skips the requeue stage
// (stage 7, "Noch einmal") when nothing was missed. Back used to go to
// stageIndex - 1 unconditionally, so Back from the recap of a run with no
// misses opened a requeue stage with nothing requeued: `items[0]` was
// undefined, the stage body rendered null, and the learner saw a blank screen
// with no button on it. The rule this suite pins is the class, not the one
// screen: Back never lands on a stage advance() would have skipped, for every
// stage of every live A1.1 Lektion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { prevStageIndex } from '../src/lib/lesson/requeue.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { curriculumFor } from '../src/data/curricula/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const curriculum = curriculumFor('a1.1');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const lessons = curriculum.lektionen.map((lektion) => ({
  nr: lektion.nr,
  stages: buildLesson({ curriculum, lektion, pool, dueCards: [], attempt: 1 }).stages,
}));

test('Back from the recap skips an empty requeue stage, for every A1.1 Lektion', () => {
  assert.equal(lessons.length, 12, 'A1.1 has 12 Lektionen');
  for (const { nr, stages } of lessons) {
    const recap = stages.findIndex((s) => s.kind === 'recap');
    const requeue = stages.findIndex((s) => s.kind === 'requeue');
    assert.equal(requeue, recap - 1, `Lektion ${nr}: the requeue stage sits right before the recap`);
    const target = prevStageIndex(stages, recap, 0);
    assert.notEqual(stages[target] && stages[target].kind, 'requeue',
      `Lektion ${nr}: Back from the recap with nothing requeued opened the empty requeue stage (a blank screen)`);
    assert.equal(target, requeue - 1, `Lektion ${nr}: Back from the recap lands on the stage before the requeue`);
  }
});

test('Back from the recap lands on the requeue stage when something was requeued', () => {
  for (const { nr, stages } of lessons) {
    const recap = stages.findIndex((s) => s.kind === 'recap');
    assert.equal(stages[prevStageIndex(stages, recap, 2)].kind, 'requeue', `Lektion ${nr}`);
  }
});

test('with nothing requeued, Back never lands on a requeue stage; elsewhere it is one stage back', () => {
  for (const { nr, stages } of lessons) {
    for (let i = 1; i < stages.length; i += 1) {
      const empty = prevStageIndex(stages, i, 0);
      assert.ok(empty >= 0 && empty < i, `Lektion ${nr}, stage ${i}: Back goes to an earlier stage`);
      assert.notEqual(stages[empty].kind, 'requeue', `Lektion ${nr}, stage ${i}: Back opened an empty requeue stage`);
      assert.equal(prevStageIndex(stages, i, 1), i - 1, `Lektion ${nr}, stage ${i}: with a requeue, Back is one stage back`);
      if (stages[i - 1].kind !== 'requeue') assert.equal(empty, i - 1, `Lektion ${nr}, stage ${i}: only the requeue is skipped`);
    }
  }
});

test('the first stage has no Back, and neither has a stage whose only predecessor is an empty requeue', () => {
  const stages = [{ key: 'requeue', kind: 'requeue' }, { key: 'recap', kind: 'recap' }];
  assert.equal(prevStageIndex(stages, 0, 0), -1);
  assert.equal(prevStageIndex(stages, 1, 0), -1, 'skipping the empty requeue leaves nothing to go back to');
  assert.equal(prevStageIndex(stages, 1, 1), 0);
  assert.equal(prevStageIndex(lessons[0].stages, 0, 0), -1, 'stage 0 of a Lektion has no Back');
  assert.equal(prevStageIndex(null, 3, 0), 2, 'no stage list to inspect: plain one-back');
});

test('the player wires Back through the same skip rule advance() applies on the way in', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.doesNotMatch(src, /goStage\(stageIndex - 1\)/, 'Back must not go to stageIndex - 1 unconditionally');
  assert.match(src, /prevStageIndex\(stages, stageIndex, requeued\.length\)/, 'Back must read prevStageIndex with the requeued count');
  assert.match(src, /if \(!items\.length\) \{ goStage\(target \+ 1\); return; \}/,
    'advance() still skips an empty requeue stage: the rule Back mirrors');
});
