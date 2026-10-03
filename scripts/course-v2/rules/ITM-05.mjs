// ITM-05 — MAX_SAME_TASK_SHAPE holds on the POS-masked key (A1.1 review #9): a Lernschritt pool
// must not repeat one task frame so often that a served draw shows „the same exercise again".
//
// The key is `taskShape()` of the live lesson engine (src/lib/lesson/buildLesson.js) on the
// compiled item — the prompt skeleton with every content word masked. Sentence-building items are
// keyed by their POS-masked ANSWER instead: the engine collapses every scrambled tile list to its
// length class, and the v2 mix requires ≥ 10–25 % sentence building per pool (§3.4), so the tile
// list cannot be the key. The live bound (MAX_SAME_TASK_SHAPE per 7 served) is scaled to the
// level's served count: ceil(served / 7) × MAX_SAME_TASK_SHAPE items per key per pool.

import { walkSteps } from '../lib-validate/walk.mjs';
import { tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { compiledItem, levelNumbers, arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-05';
export const title = 'Task shapes: no POS-masked key repeated beyond MAX_SAME_TASK_SHAPE per pool';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

let engine = null;
try {
  engine = await import('../../../src/lib/lesson/buildLesson.js');
} catch {
  engine = null;
}
const MAX_SAME = typeof engine?.MAX_SAME_TASK_SHAPE === 'number' ? engine.MAX_SAME_TASK_SHAPE : 1;

/** POS-masked key: function words kept, content words '·', numbers '#'. */
export function maskedAnswer(answer) {
  return tokens(answer).map((t) => (/^\d/.test(t.text) ? '#' : FUNCTION_WORDS.has(t.lower) ? t.lower : '·')).join(' ');
}

function fallbackShape(item) {
  const skeleton = tokens(item.promptDe).map((t) => (FUNCTION_WORDS.has(t.lower) ? t.lower : '·')).join(' ');
  return `${item.type}:${skeleton.replace(/·( ·)+/g, '·')}:${/_{2,}/.test(item.promptDe) ? '_' : ''}`;
}

export function shapeKey(item) {
  if (item.type === 'sentence_building') return `sentence_building:${maskedAnswer(item.answer)}`;
  if (engine?.taskShape) return engine.taskShape(compiledItem(item));
  return fallbackShape(item);
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  if (!engine?.taskShape) notes.push('buildLesson.js taskShape not importable; a function-word skeleton of the prompt was used');
  let pools = 0;
  for (const doc of docs) {
    const bound = Math.ceil(levelNumbers(ctx, doc.level).served / 7) * MAX_SAME;
    for (const { step, path } of walkSteps(doc)) {
      const items = arr(step?.pool?.items).filter(isObj);
      if (!items.length) continue;
      pools += 1;
      const byShape = new Map();
      for (const it of items) {
        const k = shapeKey(it);
        if (!byShape.has(k)) byShape.set(k, []);
        byShape.get(k).push(it.id);
      }
      for (const [k, ids] of byShape) {
        if (ids.length > bound) findings.push(blocker(doc, `${path}.pool.items`, `${ids.length} items share the task shape „${k}" (max ${bound} per pool): ${ids.join(', ')}`, step.id));
      }
    }
  }
  return pools ? { findings, notes } : { findings, skipped: 'no Lernschritt pool in the target yet' };
}
