// ITM-07 — every answer containing a digit, time, date, price, phone number or spelled name
// carries `exact` (no typo allowance on those tokens; BLUEPRINT §9.1, SCHEMA §3.1). A number the
// prompt or the tiles already give (a sentence to build, a sentence to correct) is not produced by
// the learner and needs no `exact`.

import { walkItems, walkLines } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-07';
export const title = 'Numbers, times, dates, prices and spelled names carry `exact`';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const NUMBER_WORD = '(?:eins|ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)';
const TIME_RE = new RegExp(`\\b(?:halb|viertel\\s+(?:nach|vor))\\s+${NUMBER_WORD}\\b|\\b${NUMBER_WORD}\\s+uhr\\b|\\bnull\\s+(?:drei|eins|zwei)`, 'i');

/** Letters spelled out in a text: „R-O-H-D-E", „R – O – H – D – E". */
function spelledWords(text) {
  const out = new Set();
  for (const m of String(text || '').matchAll(/\b([A-ZÄÖÜ](?:\s*[-–]\s*[A-ZÄÖÜ]){2,})\b/g)) out.add(m[1].replace(/[\s\-–]/g, '').toLowerCase());
  return out;
}

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    const spelled = new Set();
    for (const { line } of walkLines(doc)) for (const w of spelledWords(line?.de)) spelled.add(w);
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const forms = [item.answer, ...arr(item.accepted)].map((x) => String(x ?? ''));
      // a number the prompt or the tiles already give is copied, not produced: exact adds nothing
      const given = `${item.promptDe || ''} ${arr(item.tiles).join(' ')}`.toLowerCase();
      const produced = (f) => {
        const nums = [...f.matchAll(/\d+(?:[.:,]\d+)*/g)].map((m) => m[0]);
        const times = [...f.matchAll(new RegExp(TIME_RE.source, 'gi'))].map((m) => m[0].toLowerCase());
        return [...nums, ...times].some((t) => !given.includes(t.toLowerCase()));
      };
      const numeric = forms.some((f) => (/\d/.test(f) || TIME_RE.test(f)) && produced(f));
      const name = forms.some((f) => spelled.has(f.replace(/[^A-Za-zÄÖÜäöüß]/g, '').toLowerCase()));
      if (numeric && !item.exact) findings.push(blocker(doc, `${path}.exact`, `answer „${item.answer}" contains a number/time and needs exact: "number"`, item.id));
      else if (name && !item.exact) findings.push(blocker(doc, `${path}.exact`, `answer „${item.answer}" is spelled out in the audio and needs exact: "name"`, item.id));
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
