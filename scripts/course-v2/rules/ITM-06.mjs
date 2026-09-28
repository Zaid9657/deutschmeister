// ITM-06 — per Lernschritt: a pool of 16 (authored + generated), the mix of §3.4 from the level
// profile, ≥ 70 % recall formats, generated items ≤ the level cap (BLUEPRINT §9.1, §3.3–3.4);
// a reserve of 4–6 (level profile `pool.reserve`) of which no item repeats a pool item's
// POS-masked key (the ITM-05 shape key; SCHEMA §15.6).
//
// Double plurals (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u05 r1 F12, lx.balkon):
// a noun with two or more standard plurals (DOUBLE_PLURALS, Duden) whose plural the learner types — a
// lex.articlePlural source, or an authored typed item keyed with one plural — must accept every one of them:
// the entry's `pluralVariants` (SCHEMA §6, 2026-09-28) for the generator, the item's accepted list for an
// authored item. „Balkons" graded wrong is a learner graded wrong: BLOCKER.

import { walkSteps } from '../lib-validate/walk.mjs';
import { levelNumbers, arr, isObj, blocker, revisionFinding, pct } from '../lib-validate/helpers.mjs';
import { levelProfile } from '../lib-validate/context.mjs';
import { shapeKey } from './ITM-05.mjs';
import { cumulativeLexicon } from '../lib-validate/context.mjs';
import { walkItems } from '../lib-validate/walk.mjs';
import { norm } from '../lib-validate/text.mjs';

/**
 * Nouns with more than one standard plural (Duden), lower-case singular → every plural. Homographs whose
 * plurals belong to different meanings or genders (Bank: Banken/Bänke, Mutter, Schild) are not listed: the
 * lexicon's gloss decides those. Exported for the tests.
 */
export const DOUBLE_PLURALS = Object.freeze({
  balkon: ['Balkone', 'Balkons'], pizza: ['Pizzen', 'Pizzas'], komma: ['Kommas', 'Kommata'], kaktus: ['Kakteen', 'Kaktusse'],
  konto: ['Konten', 'Kontos', 'Konti'], visum: ['Visa', 'Visen'], atlas: ['Atlasse', 'Atlanten'], globus: ['Globen', 'Globusse'],
  risiko: ['Risiken', 'Risikos'], thema: ['Themen', 'Themata'], onkel: ['Onkel', 'Onkels'], tunnel: ['Tunnel', 'Tunnels'],
  taxi: ['Taxis', 'Taxen'], ski: ['Skier', 'Ski'], test: ['Tests', 'Teste'], espresso: ['Espressos', 'Espressi'],
  cappuccino: ['Cappuccinos', 'Cappuccini'], tempo: ['Tempos', 'Tempi'], lexikon: ['Lexika', 'Lexiken'], kumpel: ['Kumpel', 'Kumpels'],
  schal: ['Schals', 'Schale'], saldo: ['Salden', 'Saldos', 'Saldi'], pizzeria: ['Pizzerias', 'Pizzerien'],
});

/** The plurals of an entry the learner may type: its plural and pluralVariants, lower case. */
const pluralsOf = (e) => new Set([e?.plural, ...arr(e?.pluralVariants)].filter((x) => typeof x === 'string').map((x) => x.replace(/^die\s+/i, '').toLowerCase()));

/** Double-plural findings of one unit doc. */
function doublePluralFindings(ctx, doc) {
  const out = [];
  const lex = cumulativeLexicon(ctx, doc.level);
  const byId = new Map(lex.map((e) => [e?.id, e]));
  const standard = (e) => {
    const sg = String(e?.lemma || '').replace(/^(?:der|die|das)\s+/i, '').toLowerCase();
    const want = DOUBLE_PLURALS[sg];
    return want && want.length > 1 ? want : null;
  };
  for (const { step, path } of walkSteps(doc)) {
    arr(step?.pool?.generators).forEach((g, gi) => {
      if (g?.generator !== 'lex.articlePlural') return;
      arr(g.source).forEach((idRef, k) => {
        const e = byId.get(idRef);
        const want = standard(e);
        if (!want) return;
        const have = pluralsOf(e);
        const missing = want.filter((w) => !have.has(w.toLowerCase()));
        if (missing.length) out.push(blocker(doc, `${path}.pool.generators[${gi}].source[${k}]`, `lex.articlePlural drills ${e.lemma}, whose standard plurals are ${want.join(' / ')}; ${e.id} lists ${[...have].join(', ') || 'none'} — add ${missing.join(', ')} to its pluralVariants (lexicon.json) or drill another noun; the learner who types „${missing[0]}" is graded wrong`, e.id));
      });
    });
  }
  // an authored typed item keyed with one plural of a double-plural noun
  const byPlural = new Map();
  for (const e of lex) {
    const want = standard(e);
    if (want) for (const w of want) byPlural.set(w.toLowerCase(), { e, want });
  }
  for (const { item, path } of walkItems(doc)) {
    if (!isObj(item) || !['fill_blank', 'cloze', 'notes'].includes(item.type) || arr(item.options).length) continue;
    const keyWords = String(item.answer || '').split(/\s+/).map((w) => w.replace(/[.,!?;:„“"]/g, '').toLowerCase());
    for (const w of keyWords) {
      const hit = byPlural.get(w);
      if (!hit) continue;
      const accepted = new Set([item.answer, ...arr(item.accepted)].map((a) => norm(a)));
      const missing = hit.want.filter((p) => !accepted.has(norm(String(item.answer).replace(new RegExp(`(^|\\s)${w}(?=$|[\\s.,!?])`, 'i'), `$1${p}`))));
      if (missing.length) out.push(blocker(doc, `${path}.accepted`, `the key „${item.answer}" uses the plural „${w}" of ${hit.e.lemma}, which also has ${missing.join(', ')} — accept it (acceptedWhy)`, item.id));
    }
  }
  return out;
}

export const id = 'ITM-06';
export const title = 'Pools: 16 items, the level mix, ≥ 70 % recall, generated ≤ cap';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

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
    if (doc.kind === 'unit') findings.push(...doublePluralFindings(ctx, doc));
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
      // reserve
      const [rMin, rMax] = Array.isArray(prof?.pool?.reserve) && prof.pool.reserve.length === 2 ? prof.pool.reserve : [4, 6];
      const reserve = arr(step.reserve).filter(isObj);
      if (reserve.length < rMin || reserve.length > rMax) findings.push(revisionFinding(doc, `${path}.reserve`, `reserve holds ${reserve.length} items (need ${rMin}–${rMax})`, step.id));
      const poolKeys = new Map();
      for (const it of items) {
        const k = shapeKey(it);
        if (k) poolKeys.set(k, it.id);
      }
      reserve.forEach((it, i) => {
        const k = shapeKey(it);
        if (k && poolKeys.has(k)) findings.push(blocker(doc, `${path}.reserve[${i}]`, `reserve item repeats the POS-masked key of pool item ${poolKeys.get(k)} („${k}")`, it.id));
      });
    }
  }
  notes.push(...[...sources].map((s) => `numbers from ${s}`));
  return pools ? { findings, notes } : { findings, skipped: 'no Lernschritt pool in the target yet' };
}
