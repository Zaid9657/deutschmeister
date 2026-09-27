// LEX-03 — items, model texts and expected answers use known lemmas only; ≤ 3 glossed receptive
// extras per text (BLUEPRINT §9.1). „Known" is LEX-01's set: every inflected form of an allocated
// lemma, the closed A1 core, number words and the forms the unit's own grammar licenses (the rule-card
// examples of its spine points: „am dritten Mai", „Könnten Sie …?"); one-letter option keys are not words. Hard once the cumulative lexicon exists up to the unit; before
// that advisory (see LEX-01).
//
// Rail extensions (rule-smith 2026-09-27):
//   - generator sources are production (review a2.1-u04 r2 F09): a lex.articlePlural or lex.glossTyped
//     source lemma is productive (the learner writes its article, plural or the word) — blocker; a
//     dictation.fromInput line that makes the learner spell one of the unit's receptive-only or off-list
//     lemmas is an ADVISORY (the finding was minor, and the SCHEMA §15 worked example dictates „Stau",
//     „Autobahn" and „Buchhaltung", all receptive there);
//   - a compound of two known forms („Radtour", „Möbelstücke") is an advisory — allocate it as
//     `compound:a+b` — never a blocker (reviews b1.2-u04 r1 F01, b2.2-u04 r1 F05; compounds.mjs).

import { walkProduction, walkTexts } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown } from '../lib-validate/lexicon.mjs';
import { arr, finding, blocker, list } from '../lib-validate/helpers.mjs';
import { parseUnitId } from '../lib-validate/ids.mjs';
import { unitDoc, cumulativeLexicon } from '../lib-validate/context.mjs';
import { walkSteps } from '../lib-validate/walk.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';
import { FUNCTION_WORDS } from '../lib-validate/text.mjs';

const content = await import('../../../src/components/course-v2/content.js').catch(() => null);

export const id = 'LEX-03';
export const title = 'Production uses known lemmas only; ≤ 3 glossed extras per text';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

/** Generator sources as production (a2.1-u04 r2 F09). */
function generatorFindings(ctx, doc) {
  const out = [];
  const lex = cumulativeLexicon(ctx, doc.level);
  const byId = new Map(lex.map((e) => [e?.id, e]));
  const promoted = new Set();
  for (const l of ctx.levels.values()) for (const pr of arr(l.lexicon?.promotions)) promoted.add(pr?.lemma);
  // forms of the unit's own receptive-only and off-list lemmas (one-word lemmas; function words are
  // everybody's), for the dictation lines — what the unit teaches only to be recognised is not spelled
  const risky = new Map();
  for (const e of lex) {
    if (!e?.lemma || e.unit !== doc.data?.id) continue;
    if (/\s/.test(String(e.lemma).replace(/^(?:sich|der|die|das)\s+/i, '').trim())) continue;
    const offList = /^off-list/.test(String(e.list_ref || ''));
    const receptiveOnly = e.role === 'receptive' && !promoted.has(e.id);
    if (!offList && !receptiveOnly) continue;
    for (const f of entryForms(e).forms) if (f.length > 2 && !FUNCTION_WORDS.has(f) && !risky.has(f)) risky.set(f, { e, why: offList ? 'off-list' : 'receptive' });
  }
  // a form that is also a form of a lemma the learner may produce („melden": sich melden) is safe
  for (const e of lex) {
    if (!e?.lemma || (e.unit === doc.data?.id && (e.role === 'receptive' || /^off-list/.test(String(e.list_ref || ''))) && !promoted.has(e.id))) continue;
    if (e.unit === doc.data?.id || e.role === 'productive' || promoted.has(e.id)) for (const f of entryForms(e).forms) risky.delete(f);
  }
  const lines = content ? content.lineIndex(doc.data) : new Map();
  for (const { step, path } of walkSteps(doc)) {
    arr(step?.pool?.generators).forEach((g, gi) => {
      if (!g || !Array.isArray(g.source)) return;
      const gp = `${path}.pool.generators[${gi}]`;
      if (g.generator === 'lex.articlePlural' || g.generator === 'lex.glossTyped') {
        g.source.forEach((id, k) => {
          const e = byId.get(id);
          if (e && e.role !== 'productive' && !promoted.has(id)) out.push(blocker(doc, `${gp}.source[${k}]`, `${g.generator} makes the learner write ${e.lemma}${g.generator === 'lex.articlePlural' ? "'s article and plural" : ''}, but ${id} is ${e.role} — use a productive lemma`, id));
        });
      }
      if (g.generator === 'dictation.fromInput') {
        g.source.forEach((ref, k) => {
          const line = lines.get(ref);
          if (!line) return;
          const hits = [...new Set(readTokens(line.de).map((t) => t.lower).filter((w) => risky.has(w)))];
          if (hits.length) out.push(finding('advisory', doc, `${gp}.source[${k}]`, `dictation source ${ref} makes the learner spell ${hits.map((w) => `„${w}" (${risky.get(w).why}: ${risky.get(w).e.id})`).join(', ')} — dictate a line with productive words only`, ref));
        });
      }
    });
  }
  return out;
}

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
    const knownForm = (w) => isKnown(w, known);
    for (const p of walkProduction(doc)) {
      if (p.item?.intentionalError && p.kind !== 'answer') continue;
      n += 1;
      const all = [...new Set(readTokens(p.de).filter((t) => !isKnown(t.lower, known)).map((t) => t.text))];
      const compounds = all.filter((w) => knownCompound(w.toLowerCase(), knownForm));
      const unknown = all.filter((w) => !compounds.includes(w));
      if (compounds.length && state.complete) findings.push(finding('advisory', doc, p.path, `compound(s) of known parts not in the lexicon: ${list(compounds.map((w) => `${w} (${knownCompound(w.toLowerCase(), knownForm).join('+')})`), 6)} — allocate as compound:a+b`, p.item?.id || null));
      if (!unknown.length) continue;
      if (state.complete) findings.push(blocker(doc, p.path, `unknown lemma form(s) in a ${p.kind}: ${list(unknown, 10)}`, p.item?.id || null));
      else {
        pending.surfaces += 1;
        unknown.forEach((u) => pending.forms.add(u));
      }
    }
    if (doc.kind === 'unit') findings.push(...generatorFindings(ctx, doc));
    // before the cumulative lexicon exists the measurement is one advisory per document
    if (pending.surfaces) findings.push(finding('advisory', doc, null, `${pending.surfaces} production surface(s) use forms not in the lexicon so far: ${list([...pending.forms], 25)} — advisory until the cumulative lexicon exists (${state.why})`, doc.data?.id || null));
  }
  return n || findings.length ? { findings } : { findings, skipped: 'no lexicon.json for the target level yet, or no production surface' };
}
