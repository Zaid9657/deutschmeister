// LEX-04 — off-list share ≤ 15 % (A) / ≤ 25 % (B1) per unit (the level profile's offListMax);
// B2 follows the frequency-band rule; extension words are receptive unless justified.

import { levelNumbers, arr, blocker, advisory, pct, list } from '../lib-validate/helpers.mjs';

export const id = 'LEX-04';
export const title = 'Off-list share per unit within the level limit; extension words receptive';
export const type = 'hard';
export const scope = 'unit';

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const entries = arr(ctx.levels.get(doc.level)?.lexicon?.entries).filter((e) => e?.unit === doc.data.id);
    if (!entries.length) continue;
    const L = levelNumbers(ctx, doc.level);
    if (typeof L.offListMax !== 'number') {
      notes.push(`${doc.level}: no offListMax (B2 frequency-band rule needs the private list table) — skipped`);
      continue;
    }
    units += 1;
    const off = entries.filter((e) => String(e.list_ref || '').startsWith('off-list:'));
    const share = off.length / entries.length;
    if (share > L.offListMax + 1e-9) findings.push(blocker(doc, 'spec.lexiconBlocks', `off-list ${off.length}/${entries.length} = ${pct(share)} (max ${pct(L.offListMax)}): ${list(off.map((e) => e.lemma))}`, doc.data.id));
    const productiveOff = off.filter((e) => e.role === 'productive');
    if (productiveOff.length) findings.push(advisory(doc, 'spec.lexiconBlocks', `productive off-list entries (extension words are receptive unless justified): ${list(productiveOff.map((e) => `${e.lemma} (${e.list_ref})`))}`, doc.data.id));
  }
  return units ? { findings, notes } : { findings, notes, skipped: 'no lexicon entries for the target units yet' };
}
