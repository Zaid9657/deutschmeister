// EXM-11 — each Prüfungsfokus entry maps to exactly one slot, and that slot holds its block or task
// (BLUEPRINT §9.1 COV-3; SCHEMA §4 `pruefungsfokus[].slot`): `ls4` → a block of the PruefungStep with
// the entry's template; `sprechen` / `schreiben` → the LS5 / LS6 task (or one of its parts) with that
// template; `input` → the named step's `examBlock` with that template. Length and modeDefault of the
// block agree with the entry; ≤ 2 blocks in LS4; no LS4 block or input examBlock without an entry.

import { walkSteps, speakingParts } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker, revisionFinding } from '../lib-validate/helpers.mjs';

export const id = 'EXM-11';
export const title = 'Each Prüfungsfokus entry has one slot, and that slot holds its block or task';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const SLOTS = new Set(['ls4', 'sprechen', 'schreiben', 'input']);

export function run({ docs }) {
  const findings = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !isObj(doc.data.spec) || !Array.isArray(doc.data.steps)) continue;
    const entries = arr(doc.data.spec?.lanes?.pruefungsfokus);
    if (!entries.length) continue;
    units += 1;
    const uid = doc.data.id;
    const steps = [...walkSteps(doc)];
    const byKind = (k) => steps.filter((s) => s.step?.kind === k);
    const ls4 = byKind('pruefung');
    const ls4Blocks = ls4.flatMap(({ step, path }) => arr(step.blocks).map((b, i) => ({ block: b, path: `${path}.blocks[${i}]` })));
    const inputBlocks = steps.filter(({ step }) => isObj(step?.examBlock)).map(({ step, path }) => ({ block: step.examBlock, step, path: `${path}.examBlock` }));
    const taskTemplates = (k) => byKind(k).flatMap(({ step }) => (isObj(step.task) ? speakingParts(step.task).map((x) => x.part?.template) : []));
    const claimed = new Set();
    entries.forEach((e, i) => {
      const p = `spec.lanes.pruefungsfokus[${i}]`;
      if (!isObj(e)) return;
      if (!SLOTS.has(e.slot)) {
        findings.push(revisionFinding(doc, `${p}.slot`, `entry ${e.template} has no slot (exactly one of ls4, sprechen, schreiben, input)`, uid));
        if (e.slot === undefined) {
          const b = ls4Blocks.find((x) => x.block?.template === e.template);
          if (b) claimed.add(b.block);
        }
        return;
      }
      if (e.slot === 'input' && !e.step) findings.push(blocker(doc, `${p}.step`, `entry ${e.template} in slot input names no step`, uid));
      if (e.slot !== 'input' && e.step) findings.push(blocker(doc, `${p}.step`, `entry ${e.template} in slot ${e.slot} names a step (only slot input does)`, uid));
      let hit = null;
      if (e.slot === 'ls4') hit = ls4Blocks.find((b) => b.block?.template === e.template && !claimed.has(b.block));
      else if (e.slot === 'input') hit = inputBlocks.find((b) => b.block?.template === e.template && (!e.step || b.step?.id === e.step));
      else if (taskTemplates(e.slot).includes(e.template)) hit = { task: true };
      if (!hit) {
        findings.push(blocker(doc, p, `slot ${e.slot}${e.step ? ` (${e.step})` : ''} holds no ${e.slot === 'sprechen' || e.slot === 'schreiben' ? 'task' : 'block'} with template ${e.template}`, uid));
        return;
      }
      if (hit.block) {
        claimed.add(hit.block);
        if (e.length && hit.block.length !== e.length) findings.push(blocker(doc, `${hit.path}.length`, `block length ${hit.block.length}; its Prüfungsfokus entry says ${e.length}`, hit.block.id));
        if (e.modeDefault && hit.block.modeDefault !== e.modeDefault) findings.push(blocker(doc, `${hit.path}.modeDefault`, `block modeDefault ${hit.block.modeDefault}; its Prüfungsfokus entry says ${e.modeDefault}`, hit.block.id));
      }
    });
    const receptive = entries.filter((e) => e?.slot === 'ls4').length;
    if (receptive > 2) findings.push(blocker(doc, 'spec.lanes.pruefungsfokus', `${receptive} entries in slot ls4 (≤ 2; a third receptive Teil goes to input)`, uid));
    for (const b of [...ls4Blocks, ...inputBlocks]) {
      if (isObj(b.block) && !claimed.has(b.block)) findings.push(blocker(doc, b.path, `block ${b.block.id} (${b.block.template}) has no Prüfungsfokus entry`, b.block.id));
    }
  }
  return units ? { findings } : { findings, skipped: 'no unit with a Prüfungsfokus and steps in the target yet' };
}
