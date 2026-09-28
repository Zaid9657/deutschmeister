// ITM-07 — every answer containing a digit, time, date, price, phone number or spelled name
// carries `exact` (no typo allowance on those tokens; BLUEPRINT §9.1, SCHEMA §3.1). A number the
// prompt or the tiles already give (a sentence to build, a sentence to correct) is not produced by
// the learner and needs no `exact`.
//
// A DICTATION with a digit or a number word needs `exact: "number"` too (reviews a2.2-u04 r2 F07 /
// r3 F04, b1.1-u04 r2 F05): on a dictation checkItem reads it as the whole-sentence mode — the words
// keep the dictation typo rule, the digits must match, „zehn" counts as „10" — never as the
// digits-only reading of a fill-in („10" alone does not transcribe a sentence). Any other `exact`
// on such a dictation is a finding. Generated dictations (dictation.fromInput) carry it from the
// generator (src/components/course-v2/content.js dictationItems).
//
// Identifiers (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u01 r1 F05): a level or room
// code („A1.1", „B1", „Raum B 204") is a NAME, not a number. `exact: 'number'` compares digits only — „204"
// alone and „A 204" pass for „B 204", „B1.1" for „A1.1" — so the learner is graded right while wrong:
// BLOCKER, the key takes exact: "name". A choice item never needs `exact` (checkItem compares its keys
// exactly; the field is ignored there): the rule no longer asks for it, and one it carries is harmless.

import { walkItems, walkLines } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker, CHOICE_TYPES } from '../lib-validate/helpers.mjs';

/** A level or room code: „A1", „B1.2", „B 204", „C12" — letters that a digits-only comparison would drop. */
export const IDENTIFIER_RE = /(?:^|[\s(„"])(?:[ABC][12](?:\.[12])?|[A-ZÄÖÜ]\s?\d{2,4})(?=$|[\s.,!?)“"])/u;

const { hasNumber } = await import('../../../src/lib/lesson/check.js');

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
      if (item.type === 'dictation') {
        if (forms.some((f) => hasNumber(f)) && item.exact !== 'number') {
          findings.push(blocker(doc, `${path}.exact`, `dictation „${item.answer}" contains a number and needs exact: "number" (whole-sentence mode: words keep the typo rule, digits exact, „zehn" = „10")${item.exact ? ` — has exact: "${item.exact}"` : ''}`, item.id));
        }
        continue;
      }
      // a number the prompt or the tiles already give is copied, not produced: exact adds nothing
      const given = `${item.promptDe || ''} ${arr(item.tiles).join(' ')}`.toLowerCase();
      const produced = (f) => {
        const nums = [...f.matchAll(/\d+(?:[.:,]\d+)*/g)].map((m) => m[0]);
        const times = [...f.matchAll(new RegExp(TIME_RE.source, 'gi'))].map((m) => m[0].toLowerCase());
        return [...nums, ...times].some((t) => !given.includes(t.toLowerCase()));
      };
      // a choice item answers with a key, compared exactly: it owes no `exact` (and one it carries is ignored
      // by checkItem, so it is not reported either) (RAILS §3.1c)
      if (CHOICE_TYPES.has(item.type) || (item.type === 'cloze' && arr(item.options).length)) continue;
      // an identifier is a name (u01 r1 F05)
      if (forms.some((f) => IDENTIFIER_RE.test(f))) {
        if (item.exact !== 'name') findings.push(blocker(doc, `${path}.exact`, `answer „${item.answer}" is a level or room code: exact: "name" (every letter and digit counts)${item.exact ? `, not "${item.exact}" — "number" compares the digits alone and grades „${String(item.answer).replace(/\D+/g, '')}" correct` : ''}`, item.id));
        continue;
      }
      const numeric = forms.some((f) => (/\d/.test(f) || TIME_RE.test(f)) && produced(f));
      const name = forms.some((f) => spelled.has(f.replace(/[^A-Za-zÄÖÜäöüß]/g, '').toLowerCase()));
      if (numeric && !item.exact) findings.push(blocker(doc, `${path}.exact`, `answer „${item.answer}" contains a number/time and needs exact: "number"`, item.id));
      else if (name && !item.exact) findings.push(blocker(doc, `${path}.exact`, `answer „${item.answer}" is spelled out in the audio and needs exact: "name"`, item.id));
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
