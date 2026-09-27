// COV-4 — module balance: each module of the primary lane (Hören, Lesen, Schreiben, Sprechen; plus
// Sprachbausteine where the lane has it) holds ≥ 15 % of the course's Prüfungsfokus slots
// (BLUEPRINT §2.4). Blocking once the level holds its 12 unit specs; advisory before.

import { primaryLane } from '../lib-validate/context.mjs';
import { arr, finding, pct } from '../lib-validate/helpers.mjs';

export const id = 'COV-4';
export const title = 'Module balance: each module ≥ 15 % of the Prüfungsfokus slots';
export const type = 'hard';
export const scope = 'level';
export const stage = 'T';

const MIN_SHARE = 0.15;

export function run({ ctx, levels }) {
  const findings = [];
  let checked = 0;
  for (const slot of levels) {
    const lane = primaryLane(ctx, slot.level);
    const L = ctx.registries.lanes.get(lane)?.data;
    if (!L) continue;
    const specs = [...slot.units.values()].filter((u) => u.data.spec?.lanes);
    if (!specs.length) continue;
    checked += 1;
    const counts = Object.fromEntries(Object.keys(L.modules || {}).map((m) => [m, 0]));
    let total = 0;
    for (const u of specs) {
      for (const p of arr(u.data.spec.lanes.pruefungsfokus)) {
        const t = ctx.registries.templates.get(p?.template)?.template;
        if (!t || !String(p.template).startsWith(`${lane}.`)) continue;
        total += 1;
        counts[t.module] = (counts[t.module] || 0) + 1;
      }
    }
    if (!total) continue;
    const severity = specs.length >= 12 ? 'blocker' : 'advisory';
    for (const [m, n] of Object.entries(counts)) {
      if (n / total < MIN_SHARE) findings.push(finding(severity, { file: slot.course?.file || `content/course-v2/${slot.level}` }, `modules.${m}`, `${m}: ${n}/${total} Prüfungsfokus slots = ${pct(n / total)} (need ≥ 15 %)${specs.length < 12 ? ` — ${specs.length}/12 unit specs so far` : ''}`, lane));
    }
  }
  return checked ? { findings } : { findings, skipped: 'no unit spec with Prüfungsfokus for a registered primary lane yet' };
}
