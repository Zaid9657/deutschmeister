// COV-5 — productive rotation: every productive Teil (Schreiben, Sprechen) of the primary lane
// recurs at least every 4th unit — in every window of 4 consecutive units it appears once, as a
// Prüfungsfokus Teil or as the unit's Aufgabe (BLUEPRINT §2.4). Blocking with 12 units; advisory
// on a partial level (windows over the units present).

import { walkTasks, speakingParts } from '../lib-validate/walk.mjs';
import { primaryLane } from '../lib-validate/context.mjs';
import { arr, finding } from '../lib-validate/helpers.mjs';

export const id = 'COV-5';
export const title = 'Productive Teile recur at least every 4th unit';
export const type = 'hard';
export const scope = 'level';
export const stage = 'T';

const WINDOW = 4;

export function run({ ctx, levels }) {
  const findings = [];
  let checked = 0;
  for (const slot of levels) {
    const lane = primaryLane(ctx, slot.level);
    const L = ctx.registries.lanes.get(lane)?.data;
    if (!L) continue;
    const productive = Object.entries(L.teile || {})
      .filter(([, t]) => t && (t.module === 'schreiben' || t.module === 'sprechen'))
      .map(([teil, t]) => t.id || `${lane}.${teil}`);
    const units = [...slot.units.values()].sort((a, b) => a.nr - b.nr);
    if (!productive.length || units.length < WINDOW) continue;
    checked += 1;
    const used = new Map(units.map((u) => {
      const s = new Set(arr(u.data.spec?.lanes?.pruefungsfokus).map((p) => p?.template));
      for (const { task, kind } of walkTasks(u)) {
        for (const p of kind === 'speaking' ? speakingParts(task).map((x) => x.part) : [task]) if (p?.template) s.add(p.template);
      }
      return [u.nr, s];
    }));
    const nrs = units.map((u) => u.nr);
    const severity = units.length >= 12 ? 'blocker' : 'advisory';
    for (const T of productive) {
      for (let i = 0; i + WINDOW <= nrs.length; i += 1) {
        const win = nrs.slice(i, i + WINDOW);
        if (win[WINDOW - 1] - win[0] !== WINDOW - 1) continue; // only consecutive units
        if (!win.some((nr) => used.get(nr).has(T))) {
          findings.push(finding(severity, { file: slot.course?.file || `content/course-v2/${slot.level}` }, `units ${win[0]}–${win[WINDOW - 1]}`, `${T} does not appear in units ${win[0]}–${win[WINDOW - 1]} (a productive Teil recurs at least every 4th unit)`, T));
          break;
        }
      }
    }
  }
  return checked ? { findings } : { findings, skipped: 'fewer than 4 units with a registered primary lane in the target level(s)' };
}
