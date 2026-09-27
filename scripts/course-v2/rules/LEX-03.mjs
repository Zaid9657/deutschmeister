// LEX-03 — items, model texts and expected answers use known lemmas only; ≤ 3 glossed receptive
// extras per text (BLUEPRINT §9.1). „Known" is LEX-01's set: every inflected form of an allocated
// lemma, the closed A1 core, number words and the forms the unit's own grammar licenses (the rule-card
// examples of its spine points: „am dritten Mai", „Könnten Sie …?"); one-letter option keys are not words. Hard once the cumulative lexicon exists up to the unit; before
// that advisory (see LEX-01).

import { walkProduction, walkTexts } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown } from '../lib-validate/lexicon.mjs';
import { arr, finding, blocker, list } from '../lib-validate/helpers.mjs';
import { parseUnitId } from '../lib-validate/ids.mjs';
import { unitDoc } from '../lib-validate/context.mjs';

export const id = 'LEX-03';
export const title = 'Production uses known lemmas only; ≤ 3 glossed extras per text';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

export function run({ ctx, docs }) {
  const findings = [];
  let n = 0;
  const cache = new Map();
  for (const doc of docs) {
    // ≤ 3 glosses per text needs no lexicon
    for (const t of walkTexts(doc)) {
      const src = t.kind === 'exam' ? t.block?.texts?.find((x) => x?.id === t.textId)?.glosses : t.step?.input?.glosses;
      if (arr(src).length > 3) findings.push(blocker(doc, `${t.path}.glosses`, `${arr(src).length} glossed extras (max 3 per text)`, t.step?.id || t.block?.id || null));
    }
    const nr = doc.kind === 'unit' ? doc.nr : doc.kind === 'lanepack' ? parseUnitId(doc.data.unit)?.nr : 12;
    if (!ctx.levels.get(doc.level)?.lexicon) continue;
    const key = `${doc.level}|${nr}`;
    if (!cache.has(key)) cache.set(key, { known: knownForms(ctx, doc.level, nr), state: lexiconComplete(ctx, doc.level, nr) });
    const { known: base, state } = cache.get(key);
    const known = new Set(base);
    const unitData = doc.kind === 'unit' ? doc.data : doc.kind === 'lanepack' ? unitDoc(ctx, doc.data.unit)?.data : null;
    if (unitData) for (const f of licensedForms(ctx, unitData).forms) known.add(f);
    const pending = { surfaces: 0, forms: new Set() };
    for (const p of walkProduction(doc)) {
      if (p.item?.intentionalError && p.kind !== 'answer') continue;
      n += 1;
      const unknown = [...new Set(readTokens(p.de).filter((t) => !isKnown(t.lower, known)).map((t) => t.text))];
      if (!unknown.length) continue;
      if (state.complete) findings.push(blocker(doc, p.path, `unknown lemma form(s) in a ${p.kind}: ${list(unknown, 10)}`, p.item?.id || null));
      else {
        pending.surfaces += 1;
        unknown.forEach((u) => pending.forms.add(u));
      }
    }
    // before the cumulative lexicon exists the measurement is one advisory per document
    if (pending.surfaces) findings.push(finding('advisory', doc, null, `${pending.surfaces} production surface(s) use forms not in the lexicon so far: ${list([...pending.forms], 25)} — advisory until the cumulative lexicon exists (${state.why})`, doc.data?.id || null));
  }
  return n || findings.length ? { findings } : { findings, skipped: 'no lexicon.json for the target level yet, or no production surface' };
}
