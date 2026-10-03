// COV-3 — Prüfungsfokus per unit: 2–4 Teile of the primary lane; in a .2 unit ≥ 1 of them at full
// length in Prüfungsmodus by default (BLUEPRINT §2.4).
//
// One plan, one truth (review a2.1-u04 r3 F10): the unit's spec.lanes equals its entry in the
// curriculum bundle <level>/specs.json while that bundle exists; a difference names the field and both
// files, and says that the unit file is the authored one (RAILS §8: the bundle is split into units), so
// the curriculum owner updates specs.json unless the unit is wrong.

import { primaryLane } from '../lib-validate/context.mjs';
import { arr, blocker } from '../lib-validate/helpers.mjs';

const same = (a, b) => JSON.stringify(sortDeep(a)) === JSON.stringify(sortDeep(b));
function sortDeep(x) {
  if (Array.isArray(x)) return x.map(sortDeep);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortDeep(x[k])]));
  return x;
}

export const id = 'COV-3';
export const title = 'Prüfungsfokus: 2–4 primary-lane Teile per unit; .2: ≥ 1 full length in Prüfungsmodus';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'spec'; // judges spec fields only (SCHEMA §8.1: present from stage spec)

export function run({ ctx, docs }) {
  const findings = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data.spec?.lanes) continue;
    units += 1;
    const lanes = doc.data.spec.lanes;
    const primary = lanes.primary || primaryLane(ctx, doc.level);
    if (primaryLane(ctx, doc.level) && lanes.primary && lanes.primary !== primaryLane(ctx, doc.level)) {
      findings.push(blocker(doc, 'spec.lanes.primary', `primary lane ${lanes.primary}; ${doc.level} runs ${primaryLane(ctx, doc.level)}`, doc.data.id));
    }
    const pf = arr(lanes.pruefungsfokus);
    const own = pf.filter((p) => String(p?.template || '').startsWith(`${primary}.`));
    if (own.length < 2 || own.length > 4) findings.push(blocker(doc, 'spec.lanes.pruefungsfokus', `${own.length} Prüfungsfokus Teile of ${primary} (need 2–4)`, doc.data.id));
    const foreign = pf.filter((p) => !String(p?.template || '').startsWith(`${primary}.`));
    if (foreign.length) findings.push(blocker(doc, 'spec.lanes.pruefungsfokus', `Prüfungsfokus lists other lanes' Teile (${foreign.map((p) => p.template).join(', ')}); they belong in spur`, doc.data.id));
    const bundle = ctx.levels.get(doc.level)?.specs?.get(doc.nr);
    if (bundle?.spec?.lanes && !same(bundle.spec.lanes, lanes)) {
      const diff = Object.keys({ ...bundle.spec.lanes, ...lanes }).filter((k) => !same(bundle.spec.lanes[k], lanes[k]));
      const fokus = arr(bundle.spec.lanes.pruefungsfokus).map((p, i) => (same(p, arr(lanes.pruefungsfokus)[i]) ? null : `pruefungsfokus[${i}]`)).filter(Boolean);
      findings.push(blocker(doc, 'spec.lanes', `spec.lanes differs from ${doc.level}/specs.json (${[...diff.filter((k) => k !== 'pruefungsfokus'), ...fokus].join(', ')}) — the unit file is authored: the curriculum owner updates specs.json, unless the unit is wrong`, doc.data.id));
    }
    if (doc.level.endsWith('.2') && !own.some((p) => p.length === 'full' && p.modeDefault === 'pruefung')) {
      findings.push(blocker(doc, 'spec.lanes.pruefungsfokus', 'a .2 unit needs ≥ 1 Prüfungsfokus Teil at full length in Prüfungsmodus by default', doc.data.id));
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit spec in the target yet' };
}
