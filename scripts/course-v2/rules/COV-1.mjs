// COV-1 — appearance coverage per live lane across a level (BLUEPRINT §2.4): for every Teil T of
// the lane, lane-exact blocks of T + blocks whose template lists T in transfersTo ≥ 2 (.1) / ≥ 3
// (.2), and lane-exact blocks ≥ 1 (.1) / ≥ 2 (.2); a lane-only Teil (no inbound transfer) needs
// ≥ 2 / ≥ 3 lane-exact blocks. Counted over LS4 blocks, Aufgaben, lane packs, Plateau Teile and
// the closing block. Blocking once the level holds its 12 units; a partial level gets the same
// measurement as advisories.

import { walkBlocks, walkTasks } from '../lib-validate/walk.mjs';
import { docsOfLevel, liveLanes } from '../lib-validate/context.mjs';
import { arr, finding } from '../lib-validate/helpers.mjs';

export const id = 'COV-1';
export const title = 'Every Teil of a live lane appears ≥ 2× (.1) / ≥ 3× (.2) across the level';
export const type = 'hard';
export const scope = 'level';
export const stage = 'T';

/** Template ids a level uses, with multiplicity. */
export function templateUses(slot) {
  const uses = [];
  for (const doc of docsOfLevel(slot)) {
    for (const { block } of walkBlocks(doc)) if (block?.template) uses.push(block.template);
    for (const { task } of walkTasks(doc)) if (task?.template) uses.push(task.template);
  }
  return uses;
}

export function run({ ctx, levels }) {
  const findings = [];
  const notes = [];
  let lanesChecked = 0;
  const inbound = new Map(); // template → templates that transfer to it
  for (const [tid, { template }] of ctx.registries.templates) {
    for (const to of arr(template.transfersTo)) {
      if (!inbound.has(to)) inbound.set(to, []);
      inbound.get(to).push(tid);
    }
  }
  for (const slot of levels) {
    const dot2 = slot.level.endsWith('.2');
    const needTotal = dot2 ? 3 : 2;
    const needExact = dot2 ? 2 : 1;
    const complete = slot.units.size >= 12;
    const severity = complete ? 'blocker' : 'advisory';
    const uses = templateUses(slot);
    const doc = { file: slot.course?.file || `content/course-v2/${slot.level}` };
    for (const lane of liveLanes(ctx, slot.level)) {
      const L = ctx.registries.lanes.get(lane)?.data;
      if (!L) {
        notes.push(`${slot.level}: lane ${lane} not in the registry yet — skipped`);
        continue;
      }
      lanesChecked += 1;
      const teile = L.blueprint?.modules ? Object.values(L.blueprint.modules).flat() : Object.keys(L.teile || {});
      for (const teil of teile) {
        const T = `${lane}.${teil}`;
        const exact = uses.filter((u) => u === T).length;
        const from = arr(inbound.get(T));
        const transfer = uses.filter((u) => from.includes(u)).length;
        const laneOnly = from.length === 0;
        const total = exact + transfer;
        if (laneOnly && exact < needTotal) findings.push(finding(severity, doc, `lanes.${lane}.${teil}`, `${T} (lane-only) appears ${exact}× lane-exact (need ≥ ${needTotal})${complete ? '' : ` — level has ${slot.units.size}/12 units`}`, T));
        else if (!laneOnly && (total < needTotal || exact < needExact)) findings.push(finding(severity, doc, `lanes.${lane}.${teil}`, `${T} appears ${exact}× lane-exact + ${transfer}× by transfer (need ≥ ${needTotal} in all, ≥ ${needExact} lane-exact)${complete ? '' : ` — level has ${slot.units.size}/12 units`}`, T));
      }
    }
  }
  return lanesChecked ? { findings, notes } : { findings, notes, skipped: 'no live lane with a registry file for the target level(s)' };
}
