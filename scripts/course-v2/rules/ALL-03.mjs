// ALL-03 — ≥ 2 Lehrwerk placements per unit or a logged deviation.reason (BLUEPRINT §9.1, §2.2).
// A placement marked „(unverified)" or „(snippet)" was not read at its source and does not count.

import { arr, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ALL-03';
export const title = '≥ 2 Lehrwerk placements per unit, or a deviation.reason';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

export function run({ docs }) {
  const findings = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data.spec) continue;
    units += 1;
    const spec = doc.data.spec;
    const all = arr(spec.lehrwerk).filter((x) => String(x).trim());
    const placements = all.filter((x) => !/\((?:unverified|snippet)\)/i.test(String(x)));
    const reason = spec.deviation && String(spec.deviation.reason || '').trim();
    if (placements.length < 2 && !reason) {
      findings.push(blocker(doc, 'spec.lehrwerk', `${placements.length} verified Lehrwerk placement(s)${all.length > placements.length ? ` (${all.length - placements.length} marked unverified/snippet)` : ''} and no deviation.reason (need ≥ 2 or a reason)`, doc.data.id));
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit spec in the target yet' };
}
