// ITM-06 — per Lernschritt: a pool of 16 (authored + generated), the mix of §3.4 from the level
// profile, ≥ 70 % recall formats, generated items ≤ the level cap (BLUEPRINT §9.1, §3.3–3.4).

import { walkSteps } from '../lib-validate/walk.mjs';
import { levelNumbers, arr, isObj, blocker, pct } from '../lib-validate/helpers.mjs';
import { levelProfile } from '../lib-validate/context.mjs';

export const id = 'ITM-06';
export const title = 'Pools: 16 items, the level mix, ≥ 70 % recall, generated ≤ cap';
export const type = 'hard';
export const scope = 'unit';

const GENERATOR_CLASS = {
  'dictation.fromInput': 'typed',
  'numbers.dictation': 'typed',
  'lex.glossTyped': 'typed',
  'lex.articlePlural': 'typed',
  'lex.glossMatch': 'choice',
  'perception.pairs': 'choice',
  'perception.intonation': 'choice',
};

function itemClass(type, clozeTyped) {
  if (['fill_blank', 'dictation', 'notes', 'form_fill'].includes(type)) return 'typed';
  if (type === 'cloze') return clozeTyped ? 'typed' : 'choice';
  if (type === 'sentence_building') return 'sb';
  if (type === 'error_correction') return 'ec';
  if (['multiple_choice', 'abc', 'match', 'listen_select', 'richtig_falsch', 'ja_nein', 'zuordnen'].includes(type)) return 'choice';
  return 'other';
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let pools = 0;
  const sources = new Set();
  for (const doc of docs) {
    const L = levelNumbers(ctx, doc.level);
    sources.add(`${doc.level}: ${L.source}`);
    const prof = levelProfile(ctx, doc.level);
    const recallMin = typeof prof?.pool?.mix?.recallMin === 'number' ? prof.pool.mix.recallMin : 0.7;
    const clozeTyped = Boolean(prof?.pool?.mix?.clozeInTypedGap);
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step?.pool)) continue;
      pools += 1;
      const items = arr(step.pool.items).filter(isObj);
      const gens = arr(step.pool.generators).filter(isObj);
      const count = { typed: 0, sb: 0, ec: 0, choice: 0, other: 0 };
      for (const it of items) count[itemClass(it.type, clozeTyped)] += 1;
      let generated = 0;
      for (const g of gens) {
        const n = Number(g.count) || 0;
        generated += n;
        count[GENERATOR_CLASS[g.generator] || 'other'] += n;
      }
      const total = items.length + generated;
      const p = `${path}.pool`;
      if (total !== L.poolSize) findings.push(blocker(doc, p, `pool holds ${items.length} authored + ${generated} generated = ${total} (need ${L.poolSize})`, step.id));
      if (!total) continue;
      const share = (k) => count[k] / total;
      const [tMin, tMax] = L.typed;
      if (share('typed') < tMin - 1e-9 || share('typed') > tMax + 1e-9) findings.push(blocker(doc, p, `typed gap + dictation ${count.typed}/${total} = ${pct(share('typed'))} (need ${pct(tMin)}–${pct(tMax)})`, step.id));
      if (share('sb') < L.sbMin - 1e-9) findings.push(blocker(doc, p, `sentence building ${count.sb}/${total} = ${pct(share('sb'))} (need ≥ ${pct(L.sbMin)})`, step.id));
      if (share('ec') > L.ecMax + 1e-9) findings.push(blocker(doc, p, `error correction ${count.ec}/${total} = ${pct(share('ec'))} (max ${pct(L.ecMax)})`, step.id));
      if (share('choice') > L.choiceMax + 1e-9) findings.push(blocker(doc, p, `MC/match/listen-select ${count.choice}/${total} = ${pct(share('choice'))} (max ${pct(L.choiceMax)})`, step.id));
      if (generated / total > L.generatedMax + 1e-9) findings.push(blocker(doc, p, `generated ${generated}/${total} = ${pct(generated / total)} (max ${pct(L.generatedMax)})`, step.id));
      const recall = (count.typed + count.sb + count.ec) / total;
      if (recall < recallMin - 1e-9) findings.push(blocker(doc, p, `recall formats ${pct(recall)} (need ≥ ${pct(recallMin)})`, step.id));
      if (count.other) notes.push(`${step.id}: ${count.other} pool item(s) of a type outside the §3.4 mix`);
    }
  }
  notes.push(...[...sources].map((s) => `numbers from ${s}`));
  return pools ? { findings, notes } : { findings, skipped: 'no Lernschritt pool in the target yet' };
}
