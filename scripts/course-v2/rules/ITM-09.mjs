// ITM-09 — sentence building: every grammatical order is in `accepted` (quality.js
// missingFrontedOrder on the compiled item), and every accepted order is built from exactly the
// tiles (a form the tiles cannot produce is a key no learner can reach).

import { walkItems } from '../lib-validate/walk.mjs';
import { tokens } from '../lib-validate/text.mjs';
import { compiledItem, arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-09';
export const title = 'Sentence building: every order accepted, every accepted order built from the tiles';
export const type = 'hard';
export const scope = 'unit';

let Q = null;
try {
  Q = await import('../../../src/data/lessonPools/quality.js');
} catch {
  Q = null;
}

const bag = (s) => tokens(s).map((t) => t.lower).sort().join(' ');

export function run({ docs }) {
  const findings = [];
  const notes = [];
  if (!Q?.missingFrontedOrder) notes.push('quality.js missingFrontedOrder not importable; only the tile check ran');
  let n = 0;
  for (const doc of docs) {
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item) || item.type !== 'sentence_building') continue;
      n += 1;
      const tiles = bag(arr(item.tiles).join(' '));
      const forms = [item.answer, ...arr(item.accepted)];
      forms.forEach((f, i) => {
        if (bag(f) !== tiles) findings.push(blocker(doc, i === 0 ? `${path}.answer` : `${path}.accepted[${i - 1}]`, `„${f}" is not built from exactly the tiles [${arr(item.tiles).join(' / ')}]`, item.id));
      });
      if (!arr(item.accepted).includes(item.answer)) findings.push(blocker(doc, `${path}.accepted`, 'the answer itself is missing from accepted', item.id));
      if (Q?.missingFrontedOrder) {
        let missing = null;
        try {
          missing = Q.missingFrontedOrder(compiledItem(item));
        } catch {
          missing = null;
        }
        const list = Array.isArray(missing) ? missing : missing ? [missing] : [];
        if (list.length) findings.push(blocker(doc, `${path}.accepted`, `grammatical order(s) missing from accepted: ${list.map((x) => (typeof x === 'string' ? `„${x}"` : JSON.stringify(x))).join(', ')}`, item.id));
      }
    }
  }
  return n ? { findings, notes } : { findings, skipped: 'no sentence-building item in the target yet' };
}
