// COV-3 — Prüfungsfokus per unit: 2–4 Teile of the primary lane; in a .2 unit ≥ 1 of them at full
// length in Prüfungsmodus by default (BLUEPRINT §2.4).

import { primaryLane } from '../lib-validate/context.mjs';
import { arr, blocker } from '../lib-validate/helpers.mjs';

export const id = 'COV-3';
export const title = 'Prüfungsfokus: 2–4 primary-lane Teile per unit; .2: ≥ 1 full length in Prüfungsmodus';
export const type = 'hard';
export const scope = 'unit';

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
    if (doc.level.endsWith('.2') && !own.some((p) => p.length === 'full' && p.modeDefault === 'pruefung')) {
      findings.push(blocker(doc, 'spec.lanes.pruefungsfokus', 'a .2 unit needs ≥ 1 Prüfungsfokus Teil at full length in Prüfungsmodus by default', doc.data.id));
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit spec in the target yet' };
}
