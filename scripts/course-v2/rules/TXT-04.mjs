// TXT-04 — every instruction fits ≤ 2 lines at 360 px: ≤ 90 characters (BLUEPRINT §9.1; SCHEMA
// §3.1 scope: item promptDe, block instructionsDe, task instructionsDe / taskDe, micro-output
// promptDe; scene-setting belongs in the separate situationDe fields).

import { walkItems, walkBlocks, walkTasks, walkMicroOutputs } from '../lib-validate/walk.mjs';
import { charLength } from '../lib-validate/text.mjs';
import { blocker } from '../lib-validate/helpers.mjs';

export const id = 'TXT-04';
export const title = 'Instructions ≤ 90 characters (two lines at 360 px)';
export const type = 'hard';
export const scope = 'unit';

const MAX = 90;

export function run({ docs }) {
  const findings = [];
  let n = 0;
  const check = (doc, text, path, ref) => {
    if (typeof text !== 'string') return;
    n += 1;
    const len = charLength(text);
    if (len > MAX) findings.push(blocker(doc, path, `${len} characters (max ${MAX}): „${text.slice(0, 60)}…"`, ref));
  };
  for (const doc of docs) {
    for (const { item, path } of walkItems(doc)) check(doc, item?.promptDe, `${path}.promptDe`, item?.id);
    for (const { block, path } of walkBlocks(doc)) check(doc, block?.instructionsDe, `${path}.instructionsDe`, block?.id);
    for (const { task, kind, path } of walkTasks(doc)) {
      if (kind === 'speaking') check(doc, task.instructionsDe, `${path}.instructionsDe`, task.bankKey);
      else check(doc, task.taskDe, `${path}.taskDe`, task.bankKey);
    }
    for (const { mo, path } of walkMicroOutputs(doc)) check(doc, mo.promptDe, `${path}.promptDe`, mo.id);
  }
  return n ? { findings } : { findings, skipped: 'no instruction in the target yet' };
}
