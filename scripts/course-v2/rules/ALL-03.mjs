// ALL-03 — ≥ 2 Lehrwerk placements per unit or a logged deviation.reason (BLUEPRINT §9.1, §2.2).
// A placement marked „(unverified)" or „(snippet)" was not read at its source and does not count.
//
// Deviations are named (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u09 r1 F07, u08 r1
// F11): a Prüfungsfokus template whose Teil the level plan (docs/course-v2/curriculum/<level>.json
// `examTeile`) does not list for the unit is named in spec.deviation.reason — by its Teil („Hören Teil 3") or
// its id („sd1.h3"). ADVISORY: the plan and the unit disagree and nobody said why; nothing is graded. Read for
// the lanes whose plan names Teile as „<exam> <Modul> Teil N" (Goethe A1 = sd1, Goethe A2 = ga2). A grammar
// difference (plan prose against spine ids) is not matched yet (RAILS §3.2).

import { arr, blocker, advisory } from '../lib-validate/helpers.mjs';
import { curriculumEntry } from '../lib-validate/curriculum.mjs';

const PLAN_EXAM = { sd1: 'Goethe A1', ga2: 'Goethe A2' };
const MODULE_DE = { hoeren: 'Hören', lesen: 'Lesen', schreiben: 'Schreiben', sprechen: 'Sprechen' };

/** „sd1.h3" → „Hören Teil 3" (module from the template, Teil from the id's number), or null. */
export function teilName(tplId, template) {
  const nr = String(tplId || '').match(/\.(?:h|l|s|sp|m)(\d+)$/)?.[1];
  const mod = MODULE_DE[template?.module];
  return nr && mod ? `${mod} Teil ${nr}` : null;
}

export const id = 'ALL-03';
export const title = '≥ 2 Lehrwerk placements per unit, or a deviation.reason';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'spec'; // judges spec fields only (SCHEMA §8.1: present from stage spec)

export function run({ ctx, docs }) {
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
    // a Prüfungsfokus Teil the plan does not list is named in deviation.reason
    const plan = ctx ? curriculumEntry(ctx, doc.level, doc.nr) : null;
    if (plan && Array.isArray(plan.examTeile)) {
      const planned = new Set(plan.examTeile.map((t) => String(t).toLowerCase()));
      arr(spec.lanes?.pruefungsfokus).forEach((f, i) => {
        const lane = String(f?.template || '').split('.')[0];
        const exam = PLAN_EXAM[lane];
        const t = ctx.registries.templates?.get(f?.template)?.template;
        const name = teilName(f?.template, t);
        if (!exam || !name || planned.has(`${exam} ${name}`.toLowerCase())) return;
        const said = reason && (reason.includes(name) || reason.includes(f.template));
        if (!said) findings.push(advisory(doc, `spec.lanes.pruefungsfokus[${i}]`, `${f.template} (${exam} ${name}) is not in the plan's examTeile for ${doc.data.id} (${plan.examTeile.join(', ')}) — name the difference in spec.deviation.reason („${name}" or „${f.template}")`, f.template));
      });
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit spec in the target yet' };
}
