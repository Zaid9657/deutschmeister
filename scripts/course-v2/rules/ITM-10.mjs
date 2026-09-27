// ITM-10 — accepted forms are accounted for: every acceptedWhy names an accepted form; every form
// confirmed after solver triage (reviewerConfirmed) is accepted AND explained (BLUEPRINT §9.1,
// SCHEMA §3.1). The answer itself is always accepted.

import { walkItems } from '../lib-validate/walk.mjs';
import { norm } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-10';
export const title = 'Accepted forms: answer accepted, acceptedWhy and reviewerConfirmed consistent';
export const type = 'hard';
export const scope = 'unit';

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const accepted = arr(item.accepted);
      const acceptedN = accepted.map(norm);
      if (!accepted.length) findings.push(blocker(doc, `${path}.accepted`, 'accepted[] is empty', item.id));
      else if (!acceptedN.includes(norm(item.answer))) findings.push(blocker(doc, `${path}.accepted`, `the answer „${item.answer}" is not among the accepted forms`, item.id));
      const dups = accepted.filter((a, i) => accepted.indexOf(a) !== i);
      if (dups.length) findings.push(blocker(doc, `${path}.accepted`, `accepted repeats: ${[...new Set(dups)].join(' | ')}`, item.id));
      const why = item.acceptedWhy && typeof item.acceptedWhy === 'object' ? item.acceptedWhy : {};
      for (const form of Object.keys(why)) {
        if (!accepted.includes(form)) findings.push(blocker(doc, `${path}.acceptedWhy`, `acceptedWhy explains „${form}", which is not an accepted form`, item.id));
        if (!String(why[form] || '').trim()) findings.push(blocker(doc, `${path}.acceptedWhy`, `acceptedWhy for „${form}" is empty`, item.id));
      }
      for (const form of arr(item.reviewerConfirmed)) {
        if (!accepted.includes(form)) findings.push(blocker(doc, `${path}.reviewerConfirmed`, `reviewer-confirmed „${form}" is not in accepted`, item.id));
        if (!why[form]) findings.push(blocker(doc, `${path}.acceptedWhy`, `reviewer-confirmed „${form}" carries no acceptedWhy`, item.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
