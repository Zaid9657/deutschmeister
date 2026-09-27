// GRM-01 — ≤ 2 new spine points + ≤ 1 chunk preview per unit; a receptive first introduction
// counts as new (BLUEPRINT §9.1, §2.5 rule 1). "New" is the union of what the unit declares and
// what the spine introduces at this unit, so a point the spine places here cannot be hidden in
// `review` to stay under the limit.

import { arr, blocker, list } from '../lib-validate/helpers.mjs';

export const id = 'GRM-01';
export const title = '≤ 2 new spine points and ≤ 1 chunk preview per unit';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let units = 0;
  const spine = ctx.registries.spine?.byId || null;
  if (!spine) notes.push('grammar-spine.json missing: counted spec.grammar only');
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data.spec?.grammar) continue;
    units += 1;
    const d = doc.data;
    const g = d.spec.grammar;
    const declaredNew = arr(g.new);
    const declaredChunk = arr(g.chunk);
    const review = arr(g.review);
    const spineNew = [];
    const spineChunk = [];
    for (const [pid, { point }] of spine || []) {
      if (point.intro?.receptive === d.id || point.intro?.productive === d.id) spineNew.push(pid);
      if (point.chunkFrom === d.id) spineChunk.push(pid);
    }
    const allNew = [...new Set([...declaredNew, ...spineNew])];
    const allChunk = [...new Set([...declaredChunk, ...spineChunk])].filter((p) => !allNew.includes(p));
    if (allNew.length > 2) {
      findings.push(blocker(doc, 'spec.grammar.new', `${allNew.length} new spine points in one unit (max 2): ${list(allNew)}${spineNew.some((p) => !declaredNew.includes(p)) ? ' — includes points the spine introduces here' : ''}`, d.id));
    }
    if (allChunk.length > 1) findings.push(blocker(doc, 'spec.grammar.chunk', `${allChunk.length} chunk previews (max 1): ${list(allChunk)}`, d.id));
    const both = declaredNew.filter((p) => review.includes(p) || declaredChunk.includes(p));
    if (both.length) findings.push(blocker(doc, 'spec.grammar', `listed as new and as review/chunk at once: ${list(both)}`, d.id));
  }
  return units ? { findings, notes } : { findings, skipped: 'no unit spec in the target yet' };
}
