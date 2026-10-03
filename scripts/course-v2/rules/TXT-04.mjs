// TXT-04 — every instruction fits ≤ 2 lines at 360 px: ≤ 90 characters (BLUEPRINT §9.1; SCHEMA
// §3.1 scope: item promptDe, block instructionsDe, task instructionsDe / taskDe, micro-output
// promptDe; scene-setting belongs in the separate situationDe fields). Exempt: exam item stems
// (role 'exam'), which follow the level profile's `examStemChars` band — a gap label („Lücke 3")
// of an insert/cloze item is not a stem and is held to the maximum only — and a Teil template's
// `instructionsDe` (≤ 200 characters, the Prüfungsmodus intro screen; checked when the registry is loaded).
//
// Register (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u06 r2 F02): a micro-output or a
// speaking task whose register is du and whose promptDe/instructionsDe gives the learner the line to say
// („Sagen Sie: …", „Fragen Sie (Olena): …") quotes a du line, not a Sie form („Haben Sie …?") — ADVISORY.

import { walkItems, walkBlocks, walkTasks, walkMicroOutputs } from '../lib-validate/walk.mjs';
import { charLength } from '../lib-validate/text.mjs';
import { blocker, advisory } from '../lib-validate/helpers.mjs';

/**
 * The line a prompt hands the learner to say: the first sentence after „Sagen Sie (X):" / „Fragen Sie (X):"
 * („Fragen Sie Olena: Haben Sie einen Laptop?"). „Schreiben Sie Olena: Was haben Sie?" asks the learner, not
 * the partner, and is not a line to say.
 */
export function quotedLine(promptDe) {
  const m = String(promptDe || '').match(/(?:^|[.!?]\s*)(?:Sagen|Fragen)\s+Sie(?:\s+[^:.!?]{0,30})?:\s*[„"]?([^.!?“"]+[.!?]?)/u);
  return m ? m[1].trim() : null;
}
/** The Sie form in a line to say: „Haben Sie …?", „Was machen Sie …?", „Ihnen", „Ihr-" (not sentence-initial). */
export const SIE_FORM_RE = /\p{L}+\s+Sie\b[^.!]*\?|(?<=\s)(?:Ihnen|Ihr(?:e|en|em|er)?)\b/u;
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
    for (const { mo, path } of walkMicroOutputs(doc)) {
      check(doc, mo.promptDe, `${path}.promptDe`, mo.id);
      const line = mo.register === 'du' ? quotedLine(mo.promptDe) : null;
      if (line && SIE_FORM_RE.test(line)) findings.push(advisory(doc, `${path}.promptDe`, `register du, but the line the prompt hands the learner is in the Sie form („${line.slice(0, 60)}") — quote the du form`, mo.id));
    }
    for (const { task, kind, path } of walkTasks(doc)) {
      if (kind !== 'speaking' || task.aiRole?.register !== 'du') continue;
      for (const [k, v] of [['instructionsDe', task.instructionsDe], ...(Array.isArray(task.parts) ? task.parts.map((p, i) => [`parts[${i}].instructionsDe`, p?.instructionsDe]) : [])]) {
        const line = quotedLine(v);
        if (line && SIE_FORM_RE.test(line)) findings.push(advisory(doc, `${path}.${k}`, `the partner is addressed with du, but the line the instruction hands the learner is in the Sie form („${line.slice(0, 60)}")`, task.bankKey));
      }
    }
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
