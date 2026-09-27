// TXT-02 — exam texts within the Teil template's length band: ±15 % of the official sample size
// (`textWords`) for `length: full`; `reduced` and `mini` blocks within the template's
// `scaffold.textWords` (BLUEPRINT §9.1).
//
// At stage S the blocks do not exist yet; the LS4 texts are then checked against the unit's single
// `ls4` Prüfungsfokus template when there is exactly one.

import { walkBlocks, walkExamTexts } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'TXT-02';
export const title = 'Exam texts within their Teil template\'s length band';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

const TOLERANCE = 0.15;
const textDe = (t) => [arr(t?.lines).map((l) => l?.de || '').join(' '), t?.text || ''].join(' ');

function band(tpl, length) {
  if (length === 'reduced' || length === 'mini') {
    const s = tpl?.scaffold?.textWords;
    return Array.isArray(s) && s.length === 2 ? { lo: s[0], hi: s[1], label: `scaffold ${s[0]}–${s[1]}` } : null;
  }
  const b = tpl?.textWords;
  if (!Array.isArray(b) || b.length !== 2) return null;
  return { lo: Math.floor(b[0] * (1 - TOLERANCE)), hi: Math.ceil(b[1] * (1 + TOLERANCE)), label: `${b[0]}–${b[1]} (±15 %: ${Math.floor(b[0] * (1 - TOLERANCE))}–${Math.ceil(b[1] * (1 + TOLERANCE))})` };
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  let noTemplate = 0;
  const check = (doc, t, path, tpl, length, ref) => {
    const b = band(tpl, length);
    if (!b) return;
    texts += 1;
    const n = wordCount(textDe(t));
    if (n < b.lo || n > b.hi) findings.push(blocker(doc, path, `${n} words; ${tpl.id} ${length === 'full' || !length ? 'band' : length} ${b.label}`, ref));
  };
  for (const doc of docs) {
    let blocks = 0;
    for (const { block, texts: resolved } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      blocks += 1;
      const tpl = ctx.registries.templates.get(block.template)?.template;
      if (!tpl) { noTemplate += 1; continue; }
      for (const { text, path } of arr(resolved)) check(doc, text, path, { ...tpl, id: block.template }, block.length || 'full', block.id);
    }
    // stage S: texts written before the blocks
    if (!blocks && doc.kind === 'unit') {
      const ls4 = arr(doc.data.spec?.lanes?.pruefungsfokus).filter((p) => p?.slot === 'ls4');
      if (ls4.length !== 1) continue;
      const tpl = ctx.registries.templates.get(ls4[0].template)?.template;
      if (!tpl) continue;
      for (const { text, path, step } of walkExamTexts(doc)) {
        if (step?.kind === 'pruefung') check(doc, text, path, { ...tpl, id: ls4[0].template }, ls4[0].length || 'full', text.id);
      }
    }
  }
  if (noTemplate) notes.push(`${noTemplate} block(s) whose Teil template is not in a loaded lane registry`);
  return texts ? { findings, notes } : { findings, notes, skipped: 'no exam text with a template length band in the target yet' };
}
