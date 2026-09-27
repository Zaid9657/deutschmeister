// TXT-04 — every instruction fits ≤ 2 lines at 360 px: ≤ 90 characters (BLUEPRINT §9.1; SCHEMA
// §3.1 scope: item promptDe, block instructionsDe, task instructionsDe / taskDe, micro-output
// promptDe; scene-setting belongs in the separate situationDe fields). Exempt: exam item stems
// (role 'exam'), which follow the level profile's `examStemChars` band — a gap label („Lücke 3")
// of an insert/cloze item is not a stem and is held to the maximum only — and a Teil template's
// `instructionsDe` (≤ 200 characters, the Prüfungsmodus intro screen; checked when the registry is loaded).

import { walkItems, walkBlocks, walkTasks, walkMicroOutputs } from '../lib-validate/walk.mjs';
import { charLength } from '../lib-validate/text.mjs';
import { blocker } from '../lib-validate/helpers.mjs';
import { levelProfile } from '../lib-validate/context.mjs';

export const id = 'TXT-04';
export const title = 'Instructions ≤ 90 characters (two lines at 360 px)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const MAX = 90;
const TEMPLATE_MAX = 200;
const GAP_LABEL = new Set(['insert', 'cloze']);

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let n = 0;
  const stem = (doc, item, path) => {
    const text = item?.promptDe;
    if (typeof text !== 'string') return;
    n += 1;
    const band = levelProfile(ctx, doc.level)?.examStemChars;
    const [lo, hi] = Array.isArray(band) && band.length === 2 ? band : [0, MAX];
    const len = charLength(text);
    if (len > hi) findings.push(blocker(doc, `${path}.promptDe`, `exam stem ${len} characters (level band ${lo}–${hi}): „${text.slice(0, 60)}…"`, item.id));
    else if (len < lo && !GAP_LABEL.has(item.type)) findings.push(blocker(doc, `${path}.promptDe`, `exam stem ${len} characters (level band ${lo}–${hi})`, item.id));
  };
  const usedTemplates = new Set();
  const check = (doc, text, path, ref) => {
    if (typeof text !== 'string') return;
    n += 1;
    const len = charLength(text);
    if (len > MAX) findings.push(blocker(doc, path, `${len} characters (max ${MAX}): „${text.slice(0, 60)}…"`, ref));
  };
  for (const doc of docs) {
    for (const { item, path, where } of walkItems(doc)) {
      if (where === 'exam' || item?.role === 'exam') stem(doc, item, path);
      else check(doc, item?.promptDe, `${path}.promptDe`, item?.id);
    }
    for (const { block, path } of walkBlocks(doc)) {
      check(doc, block?.instructionsDe, `${path}.instructionsDe`, block?.id);
      if (block?.template) usedTemplates.add(block.template);
    }
    for (const { task, kind, path } of walkTasks(doc)) {
      if (kind === 'speaking') check(doc, task.instructionsDe, `${path}.instructionsDe`, task.bankKey);
      else check(doc, task.taskDe, `${path}.taskDe`, task.bankKey);
      if (task?.template) usedTemplates.add(task.template);
      for (const p of Array.isArray(task?.parts) ? task.parts : []) if (p?.template) usedTemplates.add(p.template);
    }
    for (const { mo, path } of walkMicroOutputs(doc)) check(doc, mo.promptDe, `${path}.promptDe`, mo.id);
  }
  // template instructionsDe (≤ 200): the templates this target uses, or every loaded one with --all
  const templates = [...ctx.registries.templates.values()].filter((e) => usedTemplates.has(e.template?.id));
  for (const e of templates) {
    const text = e.template?.instructionsDe;
    if (typeof text !== 'string') continue;
    n += 1;
    const len = charLength(text);
    if (len > TEMPLATE_MAX) {
      const doc = { file: e.file || 'registries/lanes', level: null };
      findings.push(blocker(doc, `teile.${e.teil}.instructionsDe`, `template ${e.template.id} instruction ${len} characters (max ${TEMPLATE_MAX})`, e.template.id));
    }
  }
  if (templates.length) notes.push(`${templates.length} Teil template instruction(s) checked against ${TEMPLATE_MAX}`);
  return n ? { findings, notes } : { findings, skipped: 'no instruction in the target yet' };
}
