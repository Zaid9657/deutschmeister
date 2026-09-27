// LEX-05 — new entries within ±10 % of the level target; productive share within ±5 points of the
// level profile (BLUEPRINT §9.1, §2.6). The unit's lexiconBlocks equal its lexicon.json allocation
// (SCHEMA §8: "= lexicon.json allocation"), block by block.

import { levelNumbers, arr, blocker, advisory, pct, list } from '../lib-validate/helpers.mjs';

export const id = 'LEX-05';
export const title = 'New-word counts and productive share per unit; lexiconBlocks = lexicon allocation';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  const notes = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const lx = ctx.levels.get(doc.level)?.lexicon;
    if (!lx) continue;
    units += 1;
    const L = levelNumbers(ctx, doc.level);
    const entries = arr(lx.entries).filter((e) => e?.unit === doc.data.id);
    const [lo, hi] = L.newPerUnit;
    const min = Math.floor(lo * 0.9);
    const max = Math.ceil(hi * 1.1);
    if (entries.length < min || entries.length > max) findings.push(blocker(doc, 'spec.lexiconBlocks', `${entries.length} new lexicon entries (level target ${lo}–${hi}, ±10 %: ${min}–${max})`, doc.data.id));
    if (entries.length) {
      const prod = entries.filter((e) => e.role === 'productive').length / entries.length;
      if (Math.abs(prod - L.productiveShare) > 0.05 + 1e-9) findings.push(blocker(doc, 'spec.lexiconBlocks', `productive share ${pct(prod)} (profile ${pct(L.productiveShare)} ± 5 points)`, doc.data.id));
    }
    // allocation: the spec's blocks are the lexicon's entries of this unit, block by block
    const blocks = arr(doc.data.spec?.lexiconBlocks);
    if (!blocks.length) continue;
    const inSpec = new Map();
    blocks.forEach((b, bi) => arr(b?.lemmas).forEach((l) => inSpec.set(l, bi + 1)));
    const byId = new Map(arr(lx.entries).map((e) => [e.id, e]));
    const missing = entries.filter((e) => !inSpec.has(e.id)).map((e) => e.id);
    if (missing.length) findings.push(blocker(doc, 'spec.lexiconBlocks', `lexicon.json allocates to ${doc.data.id} but the spec's blocks omit: ${list(missing)}`, doc.data.id));
    for (const [lemmaId, blockNr] of inSpec) {
      const e = byId.get(lemmaId);
      if (!e) continue; // REF-01
      if (e.unit !== doc.data.id) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is allocated to ${e.unit} in lexicon.json, listed in ${doc.data.id}`, lemmaId));
      else if (typeof e.block === 'number' && e.block !== blockNr) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is block ${e.block} in lexicon.json, block ${blockNr} in the spec`, lemmaId));
    }
  }
  // level total vs course.json targets
  if (mode !== 'file') {
    for (const slot of levels) {
      const t = slot.course?.data?.targets?.newWords;
      const lx = slot.lexicon;
      if (!Array.isArray(t) || !lx) continue;
      const n = lx.entries.length;
      const lo = Math.floor(t[0] * 0.9);
      const hi = Math.ceil(t[1] * 1.1);
      const unitsWithEntries = new Set(lx.entries.map((e) => e?.unit)).size;
      if (n < lo || n > hi) {
        const f = unitsWithEntries >= 12 ? blocker : advisory;
        findings.push(f({ file: lx.file }, 'entries', `${n} entries for ${slot.level} (course target ${t[0]}–${t[1]}, ±10 %: ${lo}–${hi})${unitsWithEntries < 12 ? ` — ${unitsWithEntries}/12 units allocated so far` : ''}`, slot.level));
      }
    }
  }
  notes.push(...[...new Set(docs.map((d) => `${d.level}: ${levelNumbers(ctx, d.level).source}`))]);
  return units ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet' };
}
