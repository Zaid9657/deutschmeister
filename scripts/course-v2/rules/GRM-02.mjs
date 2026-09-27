// GRM-02 — every spine point enters at its registry position, receptive before productive; an
// earlier placement carries a written reason (BLUEPRINT §9.1, §2.5 rule 2). Applied to what a
// unit declares (spec.grammar) and to what it uses as a structure: the LS `structure`, the
// micro-output targets (productive), the item topics and the rule cards.

import { walkSteps, walkMicroOutputs, walkItems } from '../lib-validate/walk.mjs';
import { unitPosition } from '../lib-validate/ids.mjs';
import { pointPositions, describePosition } from '../lib-validate/spine.mjs';
import { arr, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'GRM-02';
export const title = 'Spine points enter at their registry position, receptive before productive';
export const type = 'hard';
export const scope = 'unit';

export function run({ ctx, docs }) {
  const spine = ctx.registries.spine?.byId;
  if (!spine) return { findings: [], skipped: 'grammar-spine.json missing' };
  const findings = [];
  let units = 0;
  const pointOf = (pid) => spine.get(pid)?.point || null;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const d = doc.data;
    const pos = unitPosition(d.id);
    if (pos === null) continue;
    units += 1;
    const g = d.spec?.grammar || {};
    const reason = d.spec?.deviation && String(d.spec.deviation.reason || '').trim();
    const flag = (path, msg, ref) => findings.push(reason ? advisory(doc, path, `${msg} (deviation.reason given: "${reason.slice(0, 80)}")`, ref) : blocker(doc, path, msg, ref));
    arr(g.new).forEach((pid, i) => {
      const p = pointOf(pid);
      if (!p) return;
      if (p.intro?.receptive !== d.id && p.intro?.productive !== d.id) {
        flag(`spec.grammar.new[${i}]`, `${pid} is listed as new, but the spine introduces it at ${p.intro?.receptive}${p.intro?.productive && p.intro.productive !== p.intro.receptive ? ` (productive ${p.intro.productive})` : ''}`, pid);
      }
    });
    arr(g.review).forEach((pid, i) => {
      const p = pointOf(pid);
      if (!p) return;
      const pp = pointPositions(p);
      if (pp.rec !== null && pp.rec >= pos) flag(`spec.grammar.review[${i}]`, `${pid} is listed as review, but the spine introduces it at ${describePosition(pp.rec)}`, pid);
    });
    arr(g.chunk).forEach((pid, i) => {
      const p = pointOf(pid);
      if (!p) return;
      const pp = pointPositions(p);
      if (pp.rec !== null && pp.rec <= pos) findings.push(advisory(doc, `spec.grammar.chunk[${i}]`, `${pid} is already introduced at ${describePosition(pp.rec)}; list it as review, not as a chunk preview`, pid));
    });
    // every point the spine places at this unit must be declared as new here
    for (const [pid, { point }] of spine) {
      if ((point.intro?.receptive === d.id || point.intro?.productive === d.id) && d.spec?.grammar && !arr(g.new).includes(pid)) {
        flag('spec.grammar.new', `the spine introduces ${pid} at ${d.id}, but the unit does not list it as new`, pid);
      }
    }
    const licensed = new Set([...arr(g.new), ...arr(g.chunk), ...arr(g.review)]);
    const usedBefore = (pid, path, productive) => {
      const p = pointOf(pid);
      if (!p || licensed.has(pid)) return;
      const pp = pointPositions(p);
      const at = productive ? pp.prod : pp.rec;
      if (at !== null && at > pos) flag(path, `${pid} is used ${productive ? 'productively ' : ''}at ${d.id} but the spine introduces it ${productive ? 'productively ' : ''}at ${describePosition(at)}`, pid);
    };
    for (const { step, path } of walkSteps(doc)) {
      if (step?.structure) {
        if (!licensed.has(step.structure)) flag(`${path}.structure`, `LS structure ${step.structure} is not in spec.grammar (new, chunk or review)`, step.structure);
        usedBefore(step.structure, `${path}.structure`, false);
      }
    }
    for (const { mo, path } of walkMicroOutputs(doc)) {
      arr(mo.targets).forEach((t, i) => {
        usedBefore(t, `${path}.targets[${i}]`, true);
        const p = pointOf(t);
        if (p && licensed.has(t)) {
          const pp = pointPositions(p);
          if (pp.prod !== null && pp.prod > pos) flag(`${path}.targets[${i}]`, `${t} is a productive target at ${d.id}, but the spine makes it productive only at ${describePosition(pp.prod)} (receptive before productive)`, t);
        }
      });
    }
    for (const { item, path } of walkItems(doc)) {
      const t = String(item?.topic || '');
      if (t.startsWith('g.')) usedBefore(t, `${path}.topic`, false);
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit in the target yet' };
}
