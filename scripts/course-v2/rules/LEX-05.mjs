// LEX-05 — new entries within ±10 % of the level target; productive share within ±5 points of the
// level profile (BLUEPRINT §9.1, §2.6). The unit's lexiconBlocks equal its lexicon.json allocation
// (SCHEMA §8: "= lexicon.json allocation"), block by block.
//
// Every message names the file whose owner must act (review a2.2-u04 r3 F01: a shared-file fix kept
// coming back to the unit author for a fourth round). Three files hold the allocation: the level's
// lexicon.json, the curriculum bundle specs.json and the unit's spec; where two agree, the third is
// the one to change, and the message says which. A lemma the spec lists that another LEVEL allocates
// is a finding too (review a2.2-u04 r2 F01): an earlier level's lemma is a review word, not new.

import { levelNumbers, arr, blocker, advisory, pct, list } from '../lib-validate/helpers.mjs';
import { LEVELS } from '../lib-validate/ids.mjs';

export const id = 'LEX-05';
export const title = 'New-word counts and productive share per unit; lexiconBlocks = lexicon allocation';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'spec'; // judges spec fields only (SCHEMA §8.1: present from stage spec)

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
    const lexFile = lx.file;
    const unitFile = doc.file;
    const specsFile = `${doc.level}/specs.json`;
    const bundle = ctx.levels.get(doc.level)?.specs?.get(doc.nr) || null;
    const inBundle = (id) => arr(bundle?.spec?.lexiconBlocks).some((b) => arr(b?.lemmas).includes(id));
    if (entries.length < min || entries.length > max) findings.push(blocker(doc, 'spec.lexiconBlocks', `${entries.length} new lexicon entries (level target ${lo}–${hi}, ±10 %: ${min}–${max}) — owner: the lexicon allocation (${lexFile})`, doc.data.id));
    if (entries.length) {
      const prod = entries.filter((e) => e.role === 'productive').length / entries.length;
      if (Math.abs(prod - L.productiveShare) > 0.05 + 1e-9) findings.push(blocker(doc, 'spec.lexiconBlocks', `productive share ${pct(prod)} (profile ${pct(L.productiveShare)} ± 5 points) — owner: the lexicon roles (${lexFile})`, doc.data.id));
    }
    // allocation: the spec's blocks are the lexicon's entries of this unit, block by block
    const blocks = arr(doc.data.spec?.lexiconBlocks);
    if (!blocks.length) continue;
    const inSpec = new Map();
    blocks.forEach((b, bi) => arr(b?.lemmas).forEach((l) => inSpec.set(l, bi + 1)));
    const byId = new Map(arr(lx.entries).map((e) => [e.id, e]));
    const missing = entries.filter((e) => !inSpec.has(e.id)).map((e) => e.id);
    if (missing.length) {
      const agree = bundle ? missing.filter(inBundle) : [];
      const odd = bundle ? missing.filter((id) => !inBundle(id)) : missing;
      if (agree.length) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lexFile} and ${specsFile} allocate to ${doc.data.id}, the unit spec omits: ${list(agree)} — owner: the unit author adds them to spec.lexiconBlocks (${unitFile}); if the level plan says they are not taught here, the owners of ${lexFile} and ${specsFile} de-allocate them instead (the unit author cannot change those files)`, doc.data.id));
      if (odd.length) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lexFile} allocates to ${doc.data.id}, the unit spec${bundle ? ` and ${specsFile}` : ''} omit${bundle ? '' : 's'}: ${list(odd)} — owner: the lexicon owner moves or removes them in ${lexFile}${bundle ? '' : ` (or the unit author adds them to ${unitFile})`}`, doc.data.id));
    }
    for (const [lemmaId, blockNr] of inSpec) {
      const e = byId.get(lemmaId);
      if (!e) {
        // a promotion to this unit (receptive → productive, SCHEMA §6) is taught here: listed rightly
        if (arr(lx.promotions).some((pr) => pr?.lemma === lemmaId && pr?.unit === doc.data.id)) continue;
        // another level's lemma (REF-01 resolves it, so nothing else would say so)
        const other = LEVELS.filter((l) => l !== doc.level).map((l) => [l, arr(ctx.levels.get(l)?.lexicon?.entries).find((x) => x?.id === lemmaId), ctx.levels.get(l)?.lexicon?.file]).find((x) => x[1]);
        if (other) {
          const earlier = LEVELS.indexOf(other[0]) < LEVELS.indexOf(doc.level);
          findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is allocated at ${other[0]} (${other[1].unit}, ${other[2]}), listed as new in ${doc.data.id} — ${earlier ? `an earlier level's lemma is a review word, not new: owner: the unit author removes it from spec.lexiconBlocks (${unitFile})${inBundle(lemmaId) ? ` and the curriculum owner from ${specsFile}` : ''}` : `owner: the lexicon owners (${other[2]}, ${lexFile}) decide which level teaches it`}`, lemmaId));
        }
        continue; // an id no lexicon holds is REF-01's
      }
      if (e.unit !== doc.data.id) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is allocated to ${e.unit} in ${lexFile}, listed in ${doc.data.id} — owner: ${inBundle(lemmaId) ? `the lexicon owner (${lexFile}: ${specsFile} agrees with the unit)` : `the unit author (${unitFile}) removes it, or the lexicon owner (${lexFile}) moves it here`}`, lemmaId));
      else if (typeof e.block === 'number' && e.block !== blockNr) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is block ${e.block} in ${lexFile}, block ${blockNr} in the spec — owner: the unit author (${unitFile}) or the lexicon owner (${lexFile}), whichever block is wrong`, lemmaId));
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
