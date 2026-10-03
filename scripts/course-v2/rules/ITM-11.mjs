// ITM-11 — every authored item has a static explanation {de, en}; de ≤ 25 words at A levels
// (BLUEPRINT §9.1, SCHEMA §3.1): nothing in a paid course depends on a runtime explanation call.
// An explanation must not deny a form the ending it has: „es wird – ohne d" (claims.mjs, reviews
// a2.2-u04 r1 F02 / r2 F02 / r3 F03; the same check runs on rule cards in GRM-05).

import { walkItems, walkLines, walkExamTexts } from '../lib-validate/walk.mjs';
import { wordCount, norm } from '../lib-validate/text.mjs';
import { isObj, blocker, advisory, arr } from '../lib-validate/helpers.mjs';
import { endingContradictions } from '../lib-validate/claims.mjs';

export const id = 'ITM-11';
export const title = 'Static explanation {de, en} on every item; de ≤ 25 words at A levels';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const MAX_A = 25;

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    let unitLines = null;
    const aLevel = String(doc.level || '').startsWith('a');
    for (const { item, path, step, texts } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      // „Sophie schreibt: „…“" quotes the step's text (or the item's own stimulus) exactly, „…" marking a cut
      // (a1.1-u11 r2 F07) — ADVISORY
      // the step's input and texts; an item outside a step input (the Folge gist, the check) quotes any line of
      // the unit
      // (a line's `say`, the spoken form of its digits, counts: „sieben Euro vierzig" for „7,40 Euro")
      let own = [...arr(step?.input?.lines).flatMap((l) => [l?.de, l?.say]), step?.input?.text?.de, ...arr(texts).flatMap((t) => [...arr(t.text?.lines).flatMap((l) => [l?.de, l?.say]), t.text?.text])].filter(Boolean);
      if (!own.length) {
        if (!unitLines) unitLines = [...[...walkLines(doc)].flatMap(({ line }) => [line?.de, line?.say]), ...[...walkExamTexts(doc)].flatMap(({ text: t }) => [t?.text, ...arr(t?.lines).map((l) => l?.de)])].filter(Boolean);
        own = unitLines;
      }
      const source = [...own, item.promptDe].filter(Boolean).map(norm).join(' | ');
      if (source) {
        for (const m of String(item.explanation?.de || '').matchAll(/\b(?:sagt|schreibt|fragt|antwortet|ruft)\s*:\s*„([^“]+)“/gu)) {
          // a cut („…") and a sentence boundary both split the quotation: lines are separate strings
          const parts = m[1].split(/…|\.\.\.|(?<=[.?!])\s+/).map(norm).filter((x) => x.length > 2);
          if (parts.length && !parts.every((x) => source.includes(x))) findings.push(advisory(doc, `${path}.explanation.de`, `the explanation quotes „${m[1].slice(0, 60)}" as said or written, but the step's text has no such words — quote it exactly (mark a cut with „…")`, item.id));
        }
      }
      const e = item.explanation;
      if (!isObj(e) || !String(e.de || '').trim() || !String(e.en || '').trim()) {
        findings.push(blocker(doc, `${path}.explanation`, 'missing static explanation {de, en}', item.id));
        continue;
      }
      for (const lang of ['de', 'en']) {
        for (const c of endingContradictions(e[lang])) {
          findings.push(blocker(doc, `${path}.explanation.${lang}`, `„${c.form}" is paired with „${c.claim}", but „${c.form}" ends in -${c.letters}`, item.id));
        }
      }
      const w = wordCount(e.de);
      if (aLevel && w > MAX_A) findings.push(blocker(doc, `${path}.explanation.de`, `${w} words (max ${MAX_A} at A levels)`, item.id));
      if (item.hint !== undefined && item.hint !== null && (!isObj(item.hint) || !String(item.hint.de || '').trim() || !String(item.hint.en || '').trim())) {
        findings.push(blocker(doc, `${path}.hint`, 'a hint must carry {de, en}', item.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
