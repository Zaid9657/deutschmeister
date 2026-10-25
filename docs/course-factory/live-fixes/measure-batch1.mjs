// Offline before/after audit. Reads HEAD through git; never checks out or writes source.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { CURRICULA } from '../../../src/data/curricula/index.js';
import * as builder from '../../../src/lib/lesson/buildLesson.js';
import { buildCheckpoint, paperSeed } from '../../../src/lib/checkpoint/buildCheckpoint.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const oldText = (file) => execFileSync('git', ['-C', root, 'show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const oldModule = async (file) => {
  const base = new URL(file, pathToFileURL(`${root}/`));
  const source = oldText(file).replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (_, a, spec, b) => `${a}${new URL(spec, base).href}${b}`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};
const beforeBuilder = await oldModule('src/lib/lesson/buildLesson.js');
const oldA12 = (await oldModule('src/data/curricula/a12.js')).CURRICULUM_A12;
const summary = {};
for (const level of ['a1.1', 'a1.2']) {
  const file = `src/data/lessonPools/${level.replace('.', '')}.json`;
  const beforePool = JSON.parse(oldText(file));
  const afterPool = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  const after = CURRICULA[level];
  const before = level === 'a1.2' ? oldA12 : after;
  const rows = [];
  const practice = [];
  for (let attempt = 1; attempt <= builder.ATTEMPT_CYCLE; attempt += 1) {
    const oldPlan = beforeBuilder.planPractice(before, beforePool, attempt);
    const newPlan = builder.planPractice(after, afterPool, attempt);
    const changes = [...newPlan].flatMap(([lesson, items]) => {
      const beforeIds = oldPlan.get(lesson).map((it) => it.id);
      const afterIds = items.map((it) => it.id);
      return JSON.stringify(beforeIds) === JSON.stringify(afterIds) ? [] : [{ lesson, before: beforeIds, after: afterIds }];
    });
    practice.push({ attempt, unchanged: changes.length === 0, changes });
    for (const lektion of after.lektionen) {
      const prev = beforeBuilder.derivedItems(before.lektionen.find((l) => l.nr === lektion.nr), attempt);
      const next = builder.derivedItems(lektion, attempt);
      const tile = (items) => items.find((it) => it.type === 'word_order');
      const listen = (items) => items.find((it) => it.type === 'listen_select');
      rows.push({ lesson: lektion.nr, attempt, before: tile(prev)?.answer, after: tile(next)?.answer || '(matching)', beforeCount: prev.length, afterCount: next.length, listeningUnchanged: JSON.stringify(listen(prev)) === JSON.stringify(listen(next)) });
    }
  }
  const checkpoints = [];
  for (const checkpoint of after.checkpoints) for (let round = 0; round < 4; round += 1) {
    const build = (curriculum, pool) => buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) });
    const ids = (items) => items.map((it) => [it.id, it.sourceId || null, it.answer]);
    const oldIds = ids(build(before, beforePool));
    const newIds = ids(build(after, afterPool));
    const changes = newIds.flatMap((item, index) => JSON.stringify(item) === JSON.stringify(oldIds[index]) ? [] : [{ before: oldIds[index], after: item }]);
    checkpoints.push({ checkpoint: checkpoint.id, round, unchanged: changes.length === 0, changes });
  }
  const byId = new Map(beforePool.items.map((it) => [it.id, it]));
  const itemChanges = afterPool.items.flatMap((it) => {
    const old = byId.get(it.id);
    return old && old.questionDe !== it.questionDe ? [{ id: it.id, before: old.questionDe, after: it.questionDe }] : [];
  });
  summary[level] = { practice, checkpoints, derived: rows, itemChanges,
    poolCounts: [beforePool.count, afterPool.count],
    stampsChanged: afterPool.items.filter((it) => byId.get(it.id)?.minLektion !== it.minLektion).map((it) => it.id),
    acceptedChanged: afterPool.items.filter((it) => JSON.stringify(byId.get(it.id)?.accepted) !== JSON.stringify(it.accepted)).map((it) => it.id),
    hintsChanged: afterPool.items.filter((it) => byId.get(it.id)?.questionEn !== it.questionEn).length,
  };
}
summary.a11SourceUnchanged = oldText('src/data/curricula/a11.js').replace(/\r\n/g, '\n') === readFileSync(resolve(root, 'src/data/curricula/a11.js'), 'utf8').replace(/\r\n/g, '\n');
console.log(JSON.stringify(summary, null, 2));
