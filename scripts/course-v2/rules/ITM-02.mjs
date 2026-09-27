// ITM-02 — non-exam MC / a-b-c: 3 options, one key, distractors in the key's form class; R/F,
// Ja/Nein and listen-select: 2 options (BLUEPRINT §9.1, SCHEMA §3.1). Exam items (role 'exam')
// take their option count from the Teil template — that is EXM-01.
//
// A plural antecedent (review a2.1-u04 r2 F02): an item keyed „welche" that also offers a singular
// „eine/eins/einen/einer" has two right answers („Haben wir noch Tassen? – Ja, wir haben eine.")
// unless the frame fixes the plural — a plural copula (sind, waren) or a number ≥ 2 in the prompt.

import { walkItems } from '../lib-validate/walk.mjs';
import { norm, tokens } from '../lib-validate/text.mjs';
import { expectedOptions, arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'ITM-02';
export const title = 'Choice items: option count, exactly one key, distractors in the key\'s form class';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const isSentence = (s) => /[.!?]["“”»]?\s*$/.test(String(s).trim());
const SINGULAR_INDEF = new Set(['eine', 'eins', 'einen', 'einer', 'eines']);
const { foldNumberWords } = await import('../../../src/lib/lesson/check.js');

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    for (const { item, path, where } of walkItems(doc)) {
      if (!isObj(item) || where === 'exam' || item.role === 'exam') continue;
      const want = expectedOptions(item.type);
      if (want === null) continue;
      n += 1;
      const id = item.id;
      const opts = arr(item.options);
      if (opts.length !== want) {
        findings.push(blocker(doc, `${path}.options`, `${item.type} needs ${want} options, has ${opts.length}`, id));
        if (!opts.length) continue;
      }
      const normed = opts.map(norm);
      const dup = normed.filter((o, i) => normed.indexOf(o) !== i);
      if (dup.length) findings.push(blocker(doc, `${path}.options`, `options repeat: ${[...new Set(dup)].join(', ')}`, id));
      const keyHits = normed.filter((o) => o === norm(item.answer)).length;
      if (keyHits !== 1) findings.push(blocker(doc, `${path}.answer`, keyHits ? `the key appears ${keyHits}× among the options` : `the key „${item.answer}" is not one of the options`, id));
      // one key: every accepted form is the key (quotes and punctuation aside)
      for (const [i, a] of arr(item.accepted).entries()) {
        if (norm(a) !== norm(item.answer)) findings.push(blocker(doc, `${path}.accepted[${i}]`, `a choice item accepts „${a}" besides its key — two keys`, id));
      }
      if (norm(item.answer) === 'welche' && opts.some((o) => SINGULAR_INDEF.has(norm(o)))) {
        const frame = String(item.promptDe || '');
        const plural = /\b(?:sind|waren)\b/i.test(frame) || (foldNumberWords(frame).match(/\d+/g) || []).some((d) => Number(d) >= 2);
        if (!plural) findings.push(blocker(doc, `${path}.options`, `key „welche" beside a singular ${opts.filter((o) => SINGULAR_INDEF.has(norm(o))).map((o) => `„${o}"`).join('/')}: nothing in the frame fixes the plural, so the singular is right too — add a plural verb or a number, or drop the singular option`, id));
      }
      // form class (advisory): sentence vs phrase, capitalisation, length
      if (want === 3 && opts.length === 3) {
        const key = item.answer;
        for (const o of opts) {
          if (norm(o) === norm(key)) continue;
          const lk = tokens(key).length;
          const lo = tokens(o).length;
          const ratio = Math.max(lk, lo) / Math.max(1, Math.min(lk, lo));
          if (isSentence(o) !== isSentence(key)) findings.push(advisory(doc, `${path}.options`, `distractor „${o}" is ${isSentence(o) ? 'a sentence' : 'a phrase'}, the key is ${isSentence(key) ? 'a sentence' : 'a phrase'}`, id));
          else if (ratio > 3) findings.push(advisory(doc, `${path}.options`, `distractor „${o}" is ${lo} words long, the key ${lk}`, id));
        }
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no choice items in the target yet' };
}
