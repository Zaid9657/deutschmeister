// EXM-01 — every exam block matches its Teil template: lane, item count (full length = the
// template's count; reduced/mini fewer), item type, options, the no-match option, and the play
// count its instruction states (BLUEPRINT §9.1). Text bands are TXT-02; word bands EXM-03;
// preparation minutes EXM-04.

import { walkBlocks } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'EXM-01';
export const title = 'Exam blocks match their Teil template (items, type, options, no-match, plays)';
export const type = 'hard';
export const scope = 'unit';

const TYPES_FOR_TASK = {
  abc: ['abc', 'multiple_choice'],
  richtig_falsch: ['richtig_falsch'],
  ja_nein: ['ja_nein'],
  zuordnen: ['zuordnen'],
  cloze: ['cloze'],
  notes: ['notes'],
  form_fill: ['form_fill'],
  insert: ['insert'],
};

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let blocks = 0;
  let unknown = 0;
  for (const doc of docs) {
    for (const { block, path } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      const entry = ctx.registries.templates.get(block.template);
      if (!entry) { unknown += 1; continue; }
      blocks += 1;
      const t = entry.template;
      const id = block.id;
      if (block.lane && block.lane !== entry.lane) findings.push(blocker(doc, `${path}.lane`, `block lane ${block.lane}, template ${block.template} belongs to ${entry.lane}`, id));
      if (['writing', 'speaking'].includes(t.task)) {
        findings.push(blocker(doc, `${path}.template`, `${block.template} is a ${t.task} Teil; it is authored as a task (LS5/LS6), not as an item block`, id));
        continue;
      }
      const items = arr(block.items).filter(isObj);
      if (typeof t.items === 'number') {
        if (block.length === 'full' && items.length !== t.items) findings.push(blocker(doc, `${path}.items`, `${items.length} items; ${block.template} at full length has ${t.items}`, id));
        if (block.length === 'reduced' && (items.length >= t.items || items.length < 1)) findings.push(blocker(doc, `${path}.items`, `reduced block with ${items.length} items (template ${t.items}: reduced means fewer)`, id));
        if (block.length === 'mini' && (items.length > Math.ceil(t.items / 2) || items.length < 1)) findings.push(blocker(doc, `${path}.items`, `mini block with ${items.length} items (≤ ${Math.ceil(t.items / 2)} of ${t.items})`, id));
      }
      const allowed = TYPES_FOR_TASK[t.task];
      items.forEach((it, i) => {
        if (allowed && !allowed.includes(it.type)) findings.push(blocker(doc, `${path}.items[${i}].type`, `${it.type} in a ${t.task} Teil (${block.template})`, it.id));
        if (it.role && it.role !== 'exam') findings.push(blocker(doc, `${path}.items[${i}].role`, `role ${it.role} in an exam block (role exam)`, it.id));
        if (typeof t.options === 'number' && ['abc', 'richtig_falsch', 'ja_nein'].includes(t.task)) {
          const n = arr(it.options).length;
          if (n !== t.options) findings.push(blocker(doc, `${path}.items[${i}].options`, `${n} options; ${block.template} has ${t.options}`, it.id));
        }
        if (t.task === 'zuordnen' && typeof t.options === 'number' && arr(it.options).length) {
          const n = arr(it.options).length;
          if (n !== t.options && n !== t.options + (t.noMatch ? 1 : 0)) findings.push(blocker(doc, `${path}.items[${i}].options`, `${n} options; ${block.template} has ${t.options}${t.noMatch ? ` + the no-match ${t.noMatch}` : ''}`, it.id));
        }
      });
      const noMatchItems = items.filter((it) => it.noMatch || (t.noMatch && String(it.answer).trim() === t.noMatch));
      if (t.noMatch && block.length === 'full' && !noMatchItems.length) findings.push(blocker(doc, `${path}.items`, `${block.template} has a no-match option (${t.noMatch}); no item uses it`, id));
      if (!t.noMatch && noMatchItems.some((it) => it.noMatch)) findings.push(blocker(doc, `${path}.items`, `${block.template} has no no-match option; an item is marked noMatch`, id));
      if (typeof t.plays === 'number') {
        const ins = String(block.instructionsDe || '').toLowerCase();
        const says = /\bzweimal\b|\b2-mal\b|\bzwei mal\b/.test(ins) ? 2 : /\beinmal\b|\bnur einmal\b|\b1-mal\b/.test(ins) ? 1 : null;
        if (says !== null && says !== t.plays) findings.push(blocker(doc, `${path}.instructionsDe`, `the instruction says ${says === 2 ? 'zweimal' : 'einmal'}; ${block.template} plays ${t.plays}×`, id));
        if (says === null) findings.push(advisory(doc, `${path}.instructionsDe`, `the instruction does not say how often the audio plays (${t.plays}×)`, id));
      }
    }
  }
  if (unknown) notes.push(`${unknown} block(s) whose template is not in a loaded lane registry (secondary lanes are deferred)`);
  return blocks ? { findings, notes } : { findings, notes, skipped: 'no exam block with a registered Teil template in the target yet' };
}
