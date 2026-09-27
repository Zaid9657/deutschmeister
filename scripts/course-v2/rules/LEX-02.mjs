// LEX-02 — each new lemma occurs ≥ 2× in its unit's inputs and in ≥ 2 later units (the last two
// units of a level may recycle via review). RATCHET: the count is reported and only goes down.
//
// "Inputs" are what the learner reads or hears in the unit file: the Folge, the Lernschritt inputs
// (lines and written text) and the primary LS4 exam texts. Lane-pack texts do not count (a learner
// of the primary lane never sees them).

import { walkTexts, walkItems, walkProduction } from '../lib-validate/walk.mjs';
import { countOccurrences } from '../lib-validate/lexicon.mjs';
import { arr, ratchet } from '../lib-validate/helpers.mjs';

export const id = 'LEX-02';
export const title = 'New lemmas recur: ≥ 2× in the unit\'s inputs and in ≥ 2 later units';
export const type = 'ratchet';
export const scope = 'unit';

function unitText(doc) {
  const parts = [];
  for (const t of walkTexts(doc)) parts.push(t.de);
  return parts.join('\n');
}

function unitAllText(doc) {
  const parts = [unitText(doc)];
  for (const { item } of walkItems(doc)) parts.push(item?.promptDe || '', item?.answer || '');
  for (const p of walkProduction(doc)) parts.push(p.de);
  return parts.join('\n');
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let checked = 0;
  const cache = new Map();
  let laterSkipped = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const slot = ctx.levels.get(doc.level);
    const entries = arr(slot?.lexicon?.entries).filter((e) => e?.unit === doc.data.id);
    if (!entries.length) continue;
    const inputs = unitText(doc);
    if (!inputs.trim()) continue;
    const nr = doc.nr;
    const later = [...(slot?.units.values() || [])].filter((u) => u.nr > nr).sort((a, b) => a.nr - b.nr);
    const laterTexts = later.map((u) => ({ nr: u.nr, text: unitAllText(u) }));
    for (const e of entries) {
      checked += 1;
      const n = countOccurrences(e, inputs, cache);
      if (n < 2) findings.push(ratchet(doc, 'spec.lexiconBlocks', `${e.role || ''} lemma „${e.lemma}" occurs ${n}× in the unit's inputs (need ≥ 2)`.trim(), e.id));
      if (nr <= 10) {
        if (laterTexts.length >= 2) {
          const units = laterTexts.filter((u) => countOccurrences(e, u.text, cache) > 0).length;
          if (units < 2) findings.push(ratchet(doc, 'spec.lexiconBlocks', `„${e.lemma}" recurs in ${units} later unit(s) (need ≥ 2)`, e.id));
        } else laterSkipped += 1;
      }
    }
  }
  if (laterSkipped) notes.push(`${laterSkipped} lemma(s): the later-units half waits for ≥ 2 later units to exist`);
  if (!checked) return { findings, skipped: 'no lexicon entries allocated to a unit with inputs in the target yet' };
  notes.push(`ratchet measurement: ${findings.length} (only goes down)`);
  return { findings, notes };
}
