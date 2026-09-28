// ITM-02 — non-exam MC / a-b-c: 3 options, one key, distractors in the key's form class; R/F,
// Ja/Nein and listen-select: 2 options (BLUEPRINT §9.1, SCHEMA §3.1). Exam items (role 'exam')
// take their option count from the Teil template — that is EXM-01.
//
// A plural antecedent (review a2.1-u04 r2 F02): an item keyed „welche" that also offers a singular
// „eine/eins/einen/einer" has two right answers („Haben wir noch Tassen? – Ja, wir haben eine.")
// unless the frame fixes the plural — a plural copula (sind, waren) or a number ≥ 2 in the prompt.
//
// The no-German baseline solver (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u05 r1 F02
// / r2 F02 / r3 F04, u06 r1 F08 / r3 F02). A learner who reads no German can still pick an option by its
// surface: the one sharing most content words with the stem (quotes included), the only one whose first
// word differs („Ja …" among „Nein …, Nein …"), the only long one with a coordinator, the number closest
// under a number in the stem (a budget), the count of the stem's list entries for „Wie viele X?". When a
// strategy reaches the key, the item may test test-wiseness instead of German. ADVISORY on every 3-option
// choice item (exam abc included) and a RATCHET on a proof item (role 'proof': the can-do's evidence) —
// never a blocker: the learner is not graded wrong, the item may be too easy.

import { walkItems } from '../lib-validate/walk.mjs';
import { norm, tokens } from '../lib-validate/text.mjs';
import { expectedOptions, arr, isObj, blocker, advisory, ratchet } from '../lib-validate/helpers.mjs';
import { FUNCTION_WORDS } from '../lib-validate/text.mjs';

export const id = 'ITM-02';
export const title = 'Choice items: option count, exactly one key, distractors in the key\'s form class';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const isSentence = (s) => /[.!?]["“”»]?\s*$/.test(String(s).trim());
const SINGULAR_INDEF = new Set(['eine', 'eins', 'einen', 'einer', 'eines']);
const { foldNumberWords } = await import('../../../src/lib/lesson/check.js');

const content = (s) => new Set(tokens(s).map((t) => t.lower).filter((w) => w.length >= 3 && !FUNCTION_WORDS.has(w) && !/^\d/.test(w)));
const COORD = /\b(?:und|oder|aber)\b/i;
const POLARITY = new Set(['ja', 'nein', 'doch', 'richtig', 'falsch']);
const numberOf = (s) => {
  const f = foldNumberWords(String(s));
  const m = f.match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
};

/**
 * The strategies of the no-German baseline solver that reach the key of a 3-option choice item:
 * [{ strategy, why }]. Exported for the tests.
 */
export function baselineSolver(item) {
  const opts = arr(item?.options).map(String);
  const key = String(item?.answer ?? '');
  const ki = opts.findIndex((o) => norm(o) === norm(key));
  if (opts.length !== 3 || ki < 0) return [];
  const stem = String(item?.promptDe || '');
  const out = [];
  // (a) the option with the most content words in common with the stem; a tie is broken by the number
  // closest under a number of the stem (a budget, a limit: „700 Euro" → „640 Euro"), never decided alone
  const sw = content(stem);
  const overlap = opts.map((o) => [...content(o)].filter((w) => sw.has(w)).length);
  const max = Math.max(...overlap);
  if (max > 0) {
    let best = overlap.map((x, i) => [x, i]).filter(([x]) => x === max).map(([, i]) => i);
    let tie = '';
    if (best.length > 1) {
      const stemN = (foldNumberWords(stem).match(/\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(',', '.')));
      const under = best.map((i) => [numberOf(opts[i]), i]).filter(([x]) => x !== null && stemN.some((n) => x <= n)).sort((a, b) => b[0] - a[0]);
      if (under.length && (under.length === 1 || under[0][0] !== under[1][0])) {
        best = [under[0][1]];
        tie = ', the tie broken by the number closest under the stem\'s';
      }
    }
    if (best.length === 1 && best[0] === ki) out.push({ strategy: 'overlap', why: `it shares the most content words with the stem (${max})${tie}` });
  }
  // (b) the only option whose first word — a polarity word or a function word („Ja …" among „Nein …, Nein …";
  // „ein" among „einen, einen") — differs; a name or a content word opening the options is no pattern
  const first = opts.map((o) => (tokens(o)[0]?.lower || ''));
  const others = first.filter((_, i) => i !== ki);
  const closed = (w) => POLARITY.has(w) || FUNCTION_WORDS.has(w);
  if (others[0] && others.every((w) => w === others[0]) && first[ki] !== others[0] && closed(others[0]) && closed(first[ki])) out.push({ strategy: 'first-word', why: `it alone does not start with „${others[0]}"` });
  // (c) the only long option with a coordinator
  const len = opts.map((o) => tokens(o).length);
  if (COORD.test(key) && opts.every((o, i) => i === ki || !COORD.test(o)) && opts.every((o, i) => i === ki || len[ki] >= 1.5 * len[i])) out.push({ strategy: 'long-coordinated', why: 'it alone is long and joined with a coordinator' });
  // (e) „Wie viele X?": the count of the stem's list entries that contain X
  const wv = stem.match(/Wie viele (\p{L}+)/u);
  if (wv) {
    const x = wv[1].toLowerCase().replace(/(?:er|e|n|en)$/, '');
    const list = stem.replace(/Wie viele[^?]*\?/u, ' ').split(/[,;]|\bund\b/).map((e) => e.trim()).filter(Boolean);
    const count = list.filter((e) => e.toLowerCase().includes(x)).length;
    const kn = numberOf(key);
    if (count >= 2 && kn === count) out.push({ strategy: 'count-list', why: `the stem lists ${count} entries with „${wv[1]}"` });
  }
  return out;
}

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    for (const { item, path, where, step } of walkItems(doc)) {
      if (!isObj(item)) continue;
      // the baseline solver reads every 3-option choice item, exam items included
      if (arr(item.options).length === 3 && (where === 'exam' || expectedOptions(item.type) === 3)) {
        const hits = baselineSolver(item);
        if (hits.length) {
          const proof = where === 'proof' || item.role === 'proof';
          const msg = `a reader without German reaches the key „${item.answer}": ${hits.map((h) => h.why).join('; ')} — make a distractor share the surface, or the key differ from it`;
          findings.push(proof ? ratchet(doc, `${path}.options`, `proof item: ${msg}`, item.id) : advisory(doc, `${path}.options`, msg, item.id));
        }
      }
      // an input item's distractors come from the text: a distractor noun the input never has is excluded
      // without reading (a1.1-u12 r2 F05) — ADVISORY
      if (where === 'input' && step?.input && arr(item.options).length >= 2) {
        const inputWords = new Set(tokens([arr(step.input.lines).map((l) => l?.de).join(' '), step.input.text?.de || ''].join(' ')).map((t) => t.lower));
        for (const o of arr(item.options)) {
          if (norm(o) === norm(item.answer)) continue;
          const nouns = tokens(o).filter((t, i) => i > 0 && /^\p{Lu}/u.test(t.text) && !FUNCTION_WORDS.has(t.lower));
          const absent = nouns.filter((t) => !inputWords.has(t.lower) && ![...inputWords].some((w) => w.length > 4 && (w.startsWith(t.lower.slice(0, -1)) || t.lower.startsWith(w.slice(0, -1)))));
          if (nouns.length && absent.length === nouns.length) findings.push(advisory(doc, `${path}.options`, `distractor „${o}": ${absent.map((t) => `„${t.text}"`).join(', ')} never occurs in the step's input — a reader rules it out without listening`, item.id));
        }
      }
      if (where === 'exam' || item.role === 'exam') continue;
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
