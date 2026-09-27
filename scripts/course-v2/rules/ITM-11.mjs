// ITM-11 — every authored item has a static explanation {de, en}; de ≤ 25 words at A levels
// (BLUEPRINT §9.1, SCHEMA §3.1): nothing in a paid course depends on a runtime explanation call.

import { walkItems } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-11';
export const title = 'Static explanation {de, en} on every item; de ≤ 25 words at A levels';
export const type = 'hard';
export const scope = 'unit';

const MAX_A = 25;

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    const aLevel = String(doc.level || '').startsWith('a');
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const e = item.explanation;
      if (!isObj(e) || !String(e.de || '').trim() || !String(e.en || '').trim()) {
        findings.push(blocker(doc, `${path}.explanation`, 'missing static explanation {de, en}', item.id));
        continue;
      }
      const w = wordCount(e.de);
      if (aLevel && w > MAX_A) findings.push(blocker(doc, `${path}.explanation.de`, `${w} words (max ${MAX_A} at A levels)`, item.id));
      if (item.hint !== undefined && item.hint !== null && (!isObj(item.hint) || !String(item.hint.de || '').trim() || !String(item.hint.en || '').trim())) {
        findings.push(blocker(doc, `${path}.hint`, 'a hint must carry {de, en}', item.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
