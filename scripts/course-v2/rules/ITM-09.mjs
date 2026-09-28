// ITM-09 — sentence building: every grammatical order is in `accepted` (quality.js
// missingFrontedOrder on the compiled item), and every accepted order is built from exactly the
// tiles (a form the tiles cannot produce is a key no learner can reach).
//
// Rail extensions (rule-smith 2026-09-27, BLUEPRINT §9.4 — the class came back on six levels):
//   - the tile orders of lib-validate/orders.mjs (Vorfeld: every frontable tile, the subject-first
//     order of an inverted answer; Mittelfeld: object pronoun ↔ adverbial, sentence adverb ↔ full
//     noun-phrase subject) must be accepted, unless promptDe fixes the first tile („Beginnen Sie mit …");
//   - a sentence-building item whose answer is a question says so in promptDe („Bilden Sie die
//     Frage."): tiles show no punctuation, so „Bilden Sie den Satz." admits the statement too
//     (review a1.1-u04 r1 F01, F12).
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c):
//   - a question whose key opens with its finite verb (a Ja/Nein-Frage, V1) names that in promptDe —
//     „Ja/Nein-Frage", „Verb auf Position 1", „Verb vorn" — because check.js folds the „?" and the tiles show
//     no punctuation; „Bilden Sie die Frage." alone lets the learner guess between V1 and a W-order
//     (a1.1-u03 r1 F02). ADVISORY: the learner is not graded wrong, the task is under-specified;
//   - orders.mjs owes a clause-final indefinite or negated object after a time/place adverb („Ich brauche
//     einen Kuli heute.", a1.1-u06 r1 F10) — a blocker through the tile-order check above.

import { walkItems } from '../lib-validate/walk.mjs';
import { tokens } from '../lib-validate/text.mjs';
import { compiledItem, arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { missingOrders, fixesFirstTile } from '../lib-validate/orders.mjs';

const W_WORDS = new Set('wer wen wem wessen was wo wohin woher wann wie warum weshalb wieso welche welcher welches welchen welchem wie viel wie viele'.split(' '));
/** Does promptDe name the verb-first question? („Ja/Nein-Frage", „Verb auf Position 1", „Verb vorn"/„am Anfang") */
export const namesV1 = (promptDe) => /Ja[-/ ]?(?:oder[- ])?Nein[-‑ ]?Frage|Entscheidungsfrage|Position\s*1|Verb\s+(?:vorn|nach vorn|am Anfang|zuerst|auf Platz 1)/iu.test(String(promptDe || ''));

export const id = 'ITM-09';
export const title = 'Sentence building: every order accepted, every accepted order built from the tiles';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

let Q = null;
try {
  Q = await import('../../../src/data/lessonPools/quality.js');
} catch {
  Q = null;
}

const bag = (s) => tokens(s).map((t) => t.lower).sort().join(' ');

export function run({ docs }) {
  const findings = [];
  const notes = [];
  if (!Q?.missingFrontedOrder) notes.push('quality.js missingFrontedOrder not importable; only the tile check ran');
  let n = 0;
  for (const doc of docs) {
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item) || item.type !== 'sentence_building') continue;
      n += 1;
      const tiles = bag(arr(item.tiles).join(' '));
      const forms = [item.answer, ...arr(item.accepted)];
      forms.forEach((f, i) => {
        if (bag(f) !== tiles) findings.push(blocker(doc, i === 0 ? `${path}.answer` : `${path}.accepted[${i - 1}]`, `„${f}" is not built from exactly the tiles [${arr(item.tiles).join(' / ')}]`, item.id));
      });
      if (!arr(item.accepted).includes(item.answer)) findings.push(blocker(doc, `${path}.accepted`, 'the answer itself is missing from accepted', item.id));
      if (/\?\s*$/.test(String(item.answer || '')) && !/frage|fragen/i.test(String(item.promptDe || ''))) {
        findings.push(blocker(doc, `${path}.promptDe`, `the answer „${item.answer}" is a question, but the prompt „${item.promptDe || ''}" does not ask for one (tiles carry no „?"; say „Bilden Sie die Frage.")`, item.id));
      }
      if (/\?\s*$/.test(String(item.answer || '')) && /frage/i.test(String(item.promptDe || ''))) {
        const first = tokens(String(item.answer)).map((t) => t.lower)[0] || '';
        if (first && !W_WORDS.has(first) && !namesV1(item.promptDe)) findings.push(advisory(doc, `${path}.promptDe`, `the key „${item.answer}" is a Ja/Nein-Frage (verb first); say so in promptDe („Bilden Sie eine Ja/Nein-Frage: Verb auf Position 1.") — the tiles carry no „?" and the checker folds it`, item.id));
      }
      const owed = missingOrders(item);
      if (owed.length) {
        findings.push(blocker(doc, `${path}.accepted`, `order(s) the tiles build and German allows, not accepted: ${owed.slice(0, 4).map((o) => `„${o.order}" (${o.why})`).join('; ')}${owed.length > 4 ? ` … (+${owed.length - 4})` : ''} — accept them, or fix the first tile in promptDe („Beginnen Sie mit …")`, item.id));
      }
      if (Q?.missingFrontedOrder && !fixesFirstTile(item)) {
        let missing = null;
        try {
          missing = Q.missingFrontedOrder(compiledItem(item));
        } catch {
          missing = null;
        }
        const list = Array.isArray(missing) ? missing : missing ? [missing] : [];
        if (list.length) findings.push(blocker(doc, `${path}.accepted`, `grammatical order(s) missing from accepted: ${list.map((x) => (typeof x === 'string' ? `„${x}"` : JSON.stringify(x))).join(', ')}`, item.id));
      }
    }
  }
  return n ? { findings, notes } : { findings, skipped: 'no sentence-building item in the target yet' };
}
