// ITM-04 — no R/F statement is a substring of its text or differs from a text sentence by one
// token (A1.1 review #9): such a statement is answered by matching words, not by understanding.
//
// A strategy card must not solve its step (review a2.1-u04 r1): its example may not contain the key
// (or the key option's text) of an item in the same step's exam blocks — „Einen Schrank finden Sie
// bei „Möbel"" beside an item keyed „Möbel".

import { walkItems } from '../lib-validate/walk.mjs';
import { norm, sentences, tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-04';
export const title = 'R/F statements are not copied from their text (substring or one-token edit)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const TF = new Set(['richtig_falsch', 'ja_nein']);

/** Token edit distance ≤ 1 (substitution, insertion or deletion). */
function withinOneToken(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else { i += 1; j += 1; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

const textOf = (t) => [arr(t?.lines).map((l) => l?.de || '').join(' '), t?.text || ''].join(' ');

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    for (const { item, path, block, step, texts: resolved } of walkItems(doc)) {
      if (!isObj(item) || !TF.has(item.type)) continue;
      let text = '';
      if (block) {
        const texts = arr(resolved).map((x) => x.text);
        const t = item.textRef ? texts.find((x) => x?.id === item.textRef) : texts.length === 1 ? texts[0] : null;
        text = t ? textOf(t) : texts.map(textOf).join(' ');
      } else if (step?.input) {
        text = [arr(step.input.lines).map((l) => l?.de || '').join(' '), step.input.text?.de || ''].join(' ');
      }
      if (!text.trim()) continue;
      n += 1;
      const statement = String(item.promptDe || '').replace(/^[^„"“]*[„"“]|[“"”][^“"”]*$/g, '');
      const st = norm(statement);
      if (!st) continue;
      if (norm(text).includes(st)) {
        findings.push(blocker(doc, `${path}.promptDe`, 'the statement stands verbatim in its text', item.id));
        continue;
      }
      const stTok = tokens(st).map((t) => t.lower);
      for (const s of sentences(text)) {
        if (withinOneToken(stTok, tokens(norm(s)).map((t) => t.lower))) {
          findings.push(blocker(doc, `${path}.promptDe`, `the statement differs from the text sentence „${s}" by one token`, item.id));
          break;
        }
      }
    }
  }
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    for (const [si, step] of arr(doc.data.steps).entries()) {
      const cards = arr(step?.strategyCards);
      if (!cards.length) continue;
      const keys = [];
      for (const b of arr(step.blocks)) {
        const choiceText = new Map(arr(b?.choices).map((c) => [String(c?.key), String(c?.de || '')]));
        const items = arr(b?.items);
        // an option every item offers („richtig", „anderes Stockwerk") is the Teil's format, not a key
        const everywhere = (o) => items.length > 1 && items.every((x) => arr(x?.options).map(norm).includes(norm(o)));
        for (const it of items) {
          const k = String(it?.answer ?? '');
          const shown = choiceText.get(k) || (arr(it?.options).includes(it?.answer) && k.length > 1 ? k : '');
          // the key-bearing noun phrase: a shown key with a noun in it
          const fn = !norm(shown).includes(' ') && FUNCTION_WORDS.has(norm(shown));
          if (norm(shown).length >= 4 && /(^|\s)\p{Lu}/u.test(shown) && !fn && !everywhere(shown)) keys.push([norm(shown), it.id]);
        }
      }
      cards.forEach((c, ci) => {
        n += 1;
        const text = norm(c?.de);
        for (const [k, itemId] of keys) {
          if (new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(text)) findings.push(blocker(doc, `steps[${si}].strategyCards[${ci}].de`, `the strategy card's example contains „${k}", the key of ${itemId} in the same step`, itemId));
        }
      });
    }
  }
  return n ? { findings } : { findings, skipped: 'no richtig/falsch or ja/nein items with a text in the target yet' };
}
