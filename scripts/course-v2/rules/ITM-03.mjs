// ITM-03 — R/F and Ja/Nein sets 40–60 % true, no run > 3; a/b/c keys balanced ±1 per block
// (BLUEPRINT §9.1). A "set" is an exam block, or the R/F items of one item list of a step.
//
// Rail extensions (rule-smith 2026-09-27; the player shows non-exam options in their authored order,
// src/components/course-v2/ItemView.jsx, so their positions are what the learner sees):
//   - every item with a 3-element options array counts, cloze and word-bank items included (a tb1.sb1 /
//     tb2.sb1 block keyed 8/0/0 passed because only abc/multiple_choice were counted — reviews b1.1-u04
//     r1 F02 / r2 F01, b2.2-u04 r1 F01);
//   - in an exam block no three a/b/c keys in a row, and when ≥ 3 items offer numbers (times, prices,
//     dates) the key is not always the same extreme (a1.1-u04 r2 F04);
//   - per step, and in the Check, the non-exam 3-option keys are balanced within ±1 across positions and
//     no item list has a run > 3; over the unit no position holds more than half of them (b1.1-u04 r1
//     F02, b2.1-u04 r1 F01, b2.2-u04 r1 F02).

import { walkItems } from '../lib-validate/walk.mjs';
import { norm } from '../lib-validate/text.mjs';
import { keyIndex, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-03';
export const title = 'Key balance: R/F 40–60 % true without runs > 3; a/b/c balanced ±1 per block';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const TRUE = new Set(['richtig', 'ja', 'r', 'true', 'stimmt']);
const TF = new Set(['richtig_falsch', 'ja_nein']);

/** An item offering exactly three options (MC, a/b/c, a cloze or word-bank item with its own options). */
const threeOptions = (i) => Array.isArray(i?.options) && i.options.length === 3 && !TF.has(i.type) && i.type !== 'listen_select';

/** The longest run of equal values. */
function longestRun(list) {
  let best = list.length ? 1 : 0;
  let run = 1;
  for (let i = 1; i < list.length; i += 1) {
    run = list[i] === list[i - 1] && list[i] >= 0 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** The number an option states („8.30 Uhr" → 8.3, „3,50 €" → 3.5, „12. Mai" → 12), or null. */
function numberOf(s) {
  const m = String(s ?? '').match(/\d+(?:[.,:]\d+)?/);
  if (!m || /[a-zäöüß]{4,}/i.test(String(s).replace(/uhr|euro|minuten?|stunden?|tage?n?/gi, ''))) return null;
  return Number(m[0].replace(/[,:]/, '.'));
}

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
      const abc = items.filter(threeOptions);
      if (abc.length >= 3) {
        sets += 1;
        const keys = abc.map(keyIndex);
        const counts = [0, 0, 0];
        for (const k of keys) if (k >= 0) counts[k] += 1;
        const ideal = abc.length / 3;
        if (counts.some((c) => Math.abs(c - ideal) > 1)) {
          findings.push(blocker(doc, path, `a/b/c keys ${counts.join('/')} over ${abc.length} items — balance each letter within ±1 of ${ideal.toFixed(1)}`, key));
        }
        const run = longestRun(keys);
        if (run >= 3) findings.push(blocker(doc, path, `${run} equal a/b/c keys in a row (max 2 in an exam block)`, key));
        const numeric = abc.filter((i) => i.options.every((o) => numberOf(o) !== null));
        if (numeric.length >= 3) {
          const side = numeric.map((i) => {
            const vals = i.options.map(numberOf);
            const kv = numberOf(i.answer);
            return kv === Math.max(...vals) ? 'max' : kv === Math.min(...vals) ? 'min' : 'mid';
          });
          if (side.every((x) => x === side[0]) && side[0] !== 'mid') findings.push(blocker(doc, path, `in all ${numeric.length} number items the key is the ${side[0] === 'max' ? 'highest' : 'lowest'} option — a test-wise learner needs no audio`, key));
        }
      }
    }
    // non-exam 3-option keys: per step / Check balance, runs per item list, the unit's 50 % cap
    const byStep = new Map();
    const unitKeys = [];
    for (const { item, path, block, step, where } of walkItems(doc)) {
      if (!isObj(item) || block || item.role === 'exam' || !threeOptions(item)) continue;
      const k = keyIndex(item);
      if (k < 0) continue;
      const g = step?.id || 'check';
      if (!byStep.has(g)) byStep.set(g, { path: step ? path.replace(/\.(?:pool\.items|inputItems|structuredInput|cloze|reserve|aussprache\.perception)\[\d+\]$/, '') : 'check', lists: new Map(), keys: [] });
      const e = byStep.get(g);
      e.keys.push(k);
      if (!e.lists.has(where)) e.lists.set(where, []);
      e.lists.get(where).push(k);
      unitKeys.push(k);
    }
    for (const [g, { path, lists, keys }] of byStep) {
      if (keys.length < 3) continue;
      sets += 1;
      const counts = [0, 0, 0];
      for (const k of keys) counts[k] += 1;
      const ideal = keys.length / 3;
      if (counts.some((c) => Math.abs(c - ideal) > 1)) findings.push(blocker(doc, path, `non-exam 3-option keys ${counts.join('/')} (a/b/c) over ${keys.length} items in ${g} — balance each position within ±1 of ${ideal.toFixed(1)} (the player does not shuffle options)`, g));
      for (const [where, list] of lists) {
        const run = longestRun(list);
        if (where !== 'pool' && where !== 'reserve' && run > 3) findings.push(blocker(doc, path, `${run} ${where} items in a row keyed at the same position (max 3)`, g));
      }
    }
    if (unitKeys.length >= 6) {
      const counts = [0, 0, 0];
      for (const k of unitKeys) counts[k] += 1;
      const top = Math.max(...counts);
      if (top / unitKeys.length > 0.5) findings.push(blocker(doc, null, `${top} of the unit's ${unitKeys.length} non-exam 3-option keys sit at position ${'abc'[counts.indexOf(top)]} (max 50 %)`, doc.data?.id || null));
    }
  }
  return sets ? { findings } : { findings, skipped: 'no R/F set (≥ 4 items), a/b/c exam block or 3-option step set (≥ 3 items) in the target yet' };
}
