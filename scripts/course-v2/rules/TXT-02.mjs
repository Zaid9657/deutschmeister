// TXT-02 — exam texts within the Teil template's length band (±15 % of the official sample size;
// the band `textWords` of the template already is that sample size, so ±15 % is applied to it).

import { walkBlocks } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'TXT-02';
export const title = 'Exam texts within their Teil template\'s length band (±15 %)';
export const type = 'hard';
export const scope = 'unit';

const TOLERANCE = 0.15;

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  let noTemplate = 0;
  for (const doc of docs) {
    for (const { block, path } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      const tpl = ctx.registries.templates.get(block.template)?.template;
      if (!tpl) { noTemplate += 1; continue; }
      const band = tpl.textWords;
      if (!Array.isArray(band) || band.length !== 2) continue;
      const lo = Math.floor(band[0] * (1 - TOLERANCE));
      const hi = Math.ceil(band[1] * (1 + TOLERANCE));
      arr(block.texts).forEach((t, i) => {
        if (!isObj(t)) return;
        const de = [arr(t.lines).map((l) => l?.de || '').join(' '), t.text || ''].join(' ');
        const n = wordCount(de);
        texts += 1;
        if (n < lo || n > hi) findings.push(blocker(doc, `${path}.texts[${i}]`, `${n} words; ${block.template} band ${band[0]}–${band[1]} (±15 %: ${lo}–${hi})`, block.id));
      });
    }
  }
  if (noTemplate) notes.push(`${noTemplate} block(s) whose Teil template is not in a loaded lane registry`);
  return texts ? { findings, notes } : { findings, notes, skipped: 'no exam text with a template length band in the target yet' };
}
