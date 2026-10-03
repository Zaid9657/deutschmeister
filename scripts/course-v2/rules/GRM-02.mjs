// GRM-02 — every spine point enters at its registry position, receptive before productive; an
// earlier placement carries a written reason (BLUEPRINT §9.1, §2.5 rule 2). Applied to what a
// unit declares (spec.grammar) and to what it uses as a structure: the LS `structure`, the
// micro-output targets (productive), the item topics and the rule cards.
//
// A chunk preview stays a chunk (review a1.2-u04 r1 F06): a point listed only under grammar.chunk may
// be met as the listed phrases, but it is never a Lernschritt's `structure` and never the point of its
// rule card — teaching it as structure is introducing it, which is the spine's call.
//
// Recycled (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u08 r1 F08): a point a unit
// introduces productively (spec.grammar.new, the spine's intro.productive is this unit) is listed under
// spec.grammar.review in ≥ 1 later unit of the band (a1.1 + a1.2 for A1, …), read from the unit files and the
// level spec bundles. ADVISORY, and silent while the band has no later unit spec to look in (a1.1-u12's points
// wait for the A1.2 specs; g.nicht-position-gern, intro a1.1-u08, was the fixture).

import { walkSteps, walkMicroOutputs, walkItems } from '../lib-validate/walk.mjs';
import { unitPosition, bandOfLevel, LEVELS } from '../lib-validate/ids.mjs';
import { pointPositions, describePosition } from '../lib-validate/spine.mjs';
import { arr, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'GRM-02';
export const title = 'Spine points enter at their registry position, receptive before productive';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

/** The later unit specs of `level`'s band after unit `pos`: [{ id, grammar }] from unit files and spec bundles. */
export function laterBandSpecs(ctx, level, pos) {
  const band = bandOfLevel(level);
  const seen = new Map();
  for (const l of LEVELS) {
    if (bandOfLevel(l) !== band) continue;
    const slot = ctx.levels.get(l);
    if (!slot) continue;
    for (const [nr, entry] of slot.specs || []) if (entry?.spec) seen.set(`${l}-${nr}`, { id: entry.id || `${l}-u${String(nr).padStart(2, '0')}`, grammar: entry.spec.grammar || {} });
    for (const [nr, doc] of slot.units || []) if (doc?.data?.spec) seen.set(`${l}-${nr}`, { id: doc.data.id, grammar: doc.data.spec.grammar || {} });
  }
  return [...seen.values()].filter((x) => { const p = unitPosition(x.id); return p !== null && p > pos; });
}

export function run({ ctx, docs }) {
  const spine = ctx.registries.spine?.byId;
  if (!spine) return { findings: [], skipped: 'grammar-spine.json missing' };
  const findings = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const pos = unitPosition(doc.data?.id);
    if (pos === null) continue;
    const later = laterBandSpecs(ctx, doc.level, pos);
    if (!later.length) continue;
    arr(doc.data.spec?.grammar?.new).forEach((pid, i) => {
      const p = spine.get(pid)?.point;
      if (!p || unitPosition(p.intro?.productive) !== pos) return;
      if (!later.some((x) => arr(x.grammar.review).includes(pid))) findings.push(advisory(doc, `spec.grammar.new[${i}]`, `${pid} is introduced productively here, but no later unit of the band (${later.length} spec(s) read, to ${later[later.length - 1].id}) lists it under spec.grammar.review — plan its recycling`, pid));
    });
  }
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
    const chunkOnly = new Set(arr(g.chunk).filter((p) => !arr(g.new).includes(p) && !arr(g.review).includes(p)));
    const cards = new Map();
    for (const slot of ctx.levels.values()) for (const c of arr(slot.ruleCards?.cards)) if (c?.id) cards.set(c.id, c);
    for (const { step, path } of walkSteps(doc)) {
      if (step?.structure && chunkOnly.has(step.structure)) flag(`${path}.structure`, `${step.structure} is only a chunk preview here; a chunk is never a Lernschritt's structure`, step.structure);
      const cardSpine = step?.ruleCard ? cards.get(step.ruleCard)?.spine : null;
      if (cardSpine && chunkOnly.has(cardSpine)) flag(`${path}.ruleCard`, `rule card ${step.ruleCard} teaches ${cardSpine}, a chunk preview here; a chunk gets no rule card before its point enters`, cardSpine);
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
