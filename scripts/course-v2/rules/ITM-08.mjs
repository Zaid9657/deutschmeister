// ITM-08 — `caseSensitive: true` only where capitalisation IS the task: the polite Sie/Ihnen/Ihr,
// a capitalisation drill (BLUEPRINT §9.1; advisory).

import { walkItems } from '../lib-validate/walk.mjs';
import { arr, isObj, advisory } from '../lib-validate/helpers.mjs';

export const id = 'ITM-08';
export const title = 'caseSensitive only where capitalisation is the task';
export const type = 'advisory';
export const scope = 'unit';
export const stage = 'I';

const POLITE_RE = /\b(?:Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)\b/;
const CAPS_TASK_RE = /groß|klein|Großschreibung|Kleinschreibung|capital/i;

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item) || !item.caseSensitive) continue;
      n += 1;
      const forms = [item.answer, ...arr(item.accepted)].join(' ');
      if (!POLITE_RE.test(forms) && !CAPS_TASK_RE.test(`${item.promptDe} ${item.promptEn || ''} ${item.topic}`)) {
        findings.push(advisory(doc, `${path}.caseSensitive`, 'caseSensitive on an item whose task is not capitalisation (a case-only miss would be WRONG instead of TYPO)', item.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no caseSensitive item in the target' };
}
