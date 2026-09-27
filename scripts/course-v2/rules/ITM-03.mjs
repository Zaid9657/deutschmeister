// ITM-03 — R/F and Ja/Nein sets 40–60 % true, no run > 3; a/b/c keys balanced ±1 per block
// (BLUEPRINT §9.1). A "set" is an exam block, or the R/F items of one item list of a step.

import { walkItems } from '../lib-validate/walk.mjs';
import { norm } from '../lib-validate/text.mjs';
import { keyIndex, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-03';
export const title = 'Key balance: R/F 40–60 % true without runs > 3; a/b/c balanced ±1 per block';
export const type = 'hard';
export const scope = 'unit';

const TRUE = new Set(['richtig', 'ja', 'r', 'true', 'stimmt']);
const TF = new Set(['richtig_falsch', 'ja_nein']);

export function run({ docs }) {
  const findings = [];
  let sets = 0;
  for (const doc of docs) {
    const groups = new Map(); // key → { path, items }
    for (const { item, path, block, step, where } of walkItems(doc)) {
      if (!isObj(item)) continue;
      const g = block ? `block:${block.id}` : `${step?.id || 'unit'}:${where}`;
      const gp = path.replace(/\.items\[\d+\]$|\[\d+\]$/, '');
      if (!groups.has(g)) groups.set(g, { path: gp, items: [], exam: Boolean(block) });
      groups.get(g).items.push(item);
    }
    for (const [key, { path, items, exam }] of groups) {
      const tf = items.filter((i) => TF.has(i.type));
      if (tf.length >= 4) {
        sets += 1;
        const truth = tf.map((i) => TRUE.has(norm(i.answer)));
        const share = truth.filter(Boolean).length / truth.length;
        if (share < 0.4 || share > 0.6) findings.push(blocker(doc, path, `${Math.round(share * 100)} % of the ${tf.length} R/F · Ja/Nein keys are true (40–60 %)`, key));
        let run = 1;
        for (let i = 1; i < truth.length; i += 1) {
          run = truth[i] === truth[i - 1] ? run + 1 : 1;
          if (run > 3) {
            findings.push(blocker(doc, path, `${run} equal R/F keys in a row (max 3)`, key));
            break;
          }
        }
      }
      if (!exam) continue;
      const abc = items.filter((i) => (i.type === 'abc' || i.type === 'multiple_choice') && Array.isArray(i.options) && i.options.length === 3);
      if (abc.length >= 3) {
        sets += 1;
        const counts = [0, 0, 0];
        for (const i of abc) {
          const k = keyIndex(i);
          if (k >= 0) counts[k] += 1;
        }
        const ideal = abc.length / 3;
        if (counts.some((c) => Math.abs(c - ideal) > 1)) {
          findings.push(blocker(doc, path, `a/b/c keys ${counts.join('/')} over ${abc.length} items — balance each letter within ±1 of ${ideal.toFixed(1)}`, key));
        }
      }
    }
  }
  return sets ? { findings } : { findings, skipped: 'no R/F set (≥ 4 items) or a/b/c exam block (≥ 3 items) in the target yet' };
}
