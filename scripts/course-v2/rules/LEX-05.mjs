// LEX-05 — new entries within ±10 % of the level target; productive share within ±5 points of the
// level profile (BLUEPRINT §9.1, §2.6). The unit's lexiconBlocks equal its lexicon.json allocation
// (SCHEMA §8: "= lexicon.json allocation"), block by block.
//
// Every message names the file whose owner must act (review a2.2-u04 r3 F01: a shared-file fix kept
// coming back to the unit author for a fourth round). Three files hold the allocation: the level's
// lexicon.json, the curriculum bundle specs.json and the unit's spec; where two agree, the third is
// the one to change, and the message says which. A lemma the spec lists that another LEVEL allocates
// is a finding too (review a2.2-u04 r2 F01): an earlier level's lemma is a review word, not new.
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c), read from a unit's content (S and
// later), all ADVISORY (a teaching gap, nobody graded wrong):
//   - a productive lemma of the unit that its inputs show fewer than twice and no production task (speaking,
//     writing, micro-output) uses — taught to be produced, never produced (a1.1-u05 r2 F10 / r3 F08:
//     lx.ziehen);
//   - a receptive lemma of the unit, or a lemma allocated to a later unit, on a PRODUCTION surface — model
//     sentence, Redemittel, the learner's speaking cards, hintWords, Leitpunkt cues, checklist, model text
//     (a1.1-u06 r1 F12 / r2 F07 / r3 F08: „Seite", „Frage", „Liebe Grüße"). No metalanguage exemption here,
//     and a capitalised word inside a sentence is matched against nouns only („Eine Frage" is not „frage");
//   - a lex.glossTyped / lex.articlePlural source lemma the step's input (or an earlier step's) never shows
//     (a1.1-u06 r1 F12: lx.praktikum).

import { levelNumbers, arr, blocker, advisory, pct, list } from '../lib-validate/helpers.mjs';
import { LEVELS, unitPosition } from '../lib-validate/ids.mjs';
import { walkTexts, walkTasks, walkMicroOutputs, walkSteps, speakingParts } from '../lib-validate/walk.mjs';
import { countOccurrences, entryForms } from '../lib-validate/lexicon.mjs';
import { allLexicon } from '../lib-validate/context.mjs';
import { tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { CORE_LEMMAS, NUMBER_WORDS } from '../lib-validate/core-lexicon.mjs';
import { isMetalanguage } from '../lib-validate/metalanguage.mjs';

const CORE = new Set(CORE_LEMMAS.map((w) => String(w).toLowerCase()));

/** The production surfaces of a unit: [{ de, path }]. */
function productionSurfaces(doc) {
  const out = [];
  const d = doc.data || {};
  for (const { step, path } of walkSteps(doc)) if (step?.modelSentence) out.push({ de: String(step.modelSentence), path: `${path}.modelSentence` });
  arr(d.redemittel).forEach((r, i) => { if (r?.de) out.push({ de: String(r.de), path: `redemittel[${i}].de` }); });
  for (const { task, kind, path } of walkTasks(doc)) {
    if (kind === 'speaking') {
      arr(task.hintWords).forEach((h, i) => out.push({ de: String(h), path: `${path}.hintWords[${i}]` }));
      for (const { part, path: pp } of speakingParts(task)) arr(part?.cards?.learner).forEach((c, i) => out.push({ de: String(typeof c === 'string' ? c : c?.de || ''), path: `${path}${pp}.cards.learner[${i}]` }));
    } else {
      arr(task.leitpunkte).forEach((lp, i) => arr(lp?.cues).forEach((c, k) => out.push({ de: String(c), path: `${path}.leitpunkte[${i}].cues[${k}]` })));
      // the checklist is read while writing: its instruction words („Punkt 2:", „Anrede") are metalanguage
      arr(task.checklist).forEach((c, i) => out.push({ de: String(c), path: `${path}.checklist[${i}]`, meta: true }));
      if (task.modelText) out.push({ de: String(task.modelText), path: `${path}.modelText` });
    }
  }
  return out;
}

/** The third-round content findings of one unit (see the header). */
function contentFindings(ctx, doc) {
  const out = [];
  const d = doc.data;
  if (!arr(d.steps).length) return out;
  const here = unitPosition(d.id);
  const lex = allLexicon(ctx);
  const promoted = new Set();
  for (const l of ctx.levels.values()) for (const pr of arr(l.lexicon?.promotions)) promoted.add(pr?.lemma);
  const cache = new Map();
  const inputs = [...walkTexts(doc)].filter((t) => t.kind === 'input' || t.kind === 'folge');
  const inputText = inputs.map((t) => t.de).join('\n');
  // what the production tasks say (speaking, writing, micro-outputs)
  const taskText = [
    ...[...walkTasks(doc)].map(({ task }) => JSON.stringify([task.situationDe, task.taskDe, task.instructionsDe, task.leitpunkte, task.checklist, task.modelText, task.hintWords, task.modelTurns, arr(task.parts).map((p) => [p?.instructionsDe, p?.situationDe, p?.cards])])),
    ...[...walkMicroOutputs(doc)].map(({ mo }) => `${mo.situationDe || ''} ${mo.promptDe || ''} ${mo.modelDe || ''}`),
  ].join('\n');
  // 1. a productive lemma never produced
  for (const e of lex) {
    if (e?.unit !== d.id || e.role !== 'productive' || FUNCTION_WORDS.has(String(e.lemma).toLowerCase())) continue;
    const inIn = countOccurrences(e, inputText, cache);
    const inTask = countOccurrences(e, taskText, cache);
    if (inIn < 2 && inTask === 0) out.push(advisory(doc, 'spec.lexiconBlocks', `${e.id} is productive here, but the inputs show it ${inIn}× and no speaking, writing or micro-output task uses it — show it twice and let the learner produce it, or make it receptive (owner: lexicon.json)`, e.id));
  }
  // 2. a receptive or later lemma on a production surface
  const byForm = new Map();
  for (const e of lex) {
    const at = unitPosition(e?.unit);
    if (at === null || !e?.lemma) continue;
    for (const f of (cache.get(e.id) || entryForms(e)).forms) {
      if (!byForm.has(f)) byForm.set(f, []);
      byForm.get(f).push({ e, at });
    }
  }
  for (const sf of productionSurfaces(doc)) {
    const toks = tokens(sf.de);
    const bad = [];
    toks.forEach((t, i) => {
      const w = t.lower;
      if (w.length < 3 || FUNCTION_WORDS.has(w) || NUMBER_WORDS.has(w) || CORE.has(w) || /^\d/.test(w) || (sf.meta && isMetalanguage(w))) return;
      let cands = byForm.get(w) || [];
      const initial = i === 0 || /[.!?:„"]\s*$/.test(sf.de.slice(0, t.index));
      if (/^\p{Lu}/u.test(t.text) && !initial) cands = cands.filter((c) => c.e.pos === 'NOUN');
      else if (/^\p{Ll}/u.test(t.text)) cands = cands.filter((c) => c.e.pos !== 'NOUN');
      if (!cands.length) return;
      const ok = cands.some((c) => c.at <= here && (c.e.role === 'productive' || promoted.has(c.e.id) || c.e.unit !== d.id));
      if (ok) return;
      const c = cands.sort((a, b) => a.at - b.at)[0];
      bad.push(`„${t.text}" (${c.e.id}: ${c.at > here ? `allocated ${c.e.unit}` : 'receptive here'})`);
    });
    if (bad.length) out.push(advisory(doc, sf.path, `a production surface asks the learner to use ${[...new Set(bad)].slice(0, 4).join(', ')} — use a productive word, or promote the lemma`, null));
  }
  // 3. a typed-recall generator source the learner has not met in the step's input or before
  const seen = [];
  for (const { step, path } of walkSteps(doc)) {
    if (step?.input) seen.push([arr(step.input.lines).map((l) => l?.de).join('\n'), step.input.text?.de || ''].join('\n'));
    const visible = [...inputs.filter((t) => t.kind === 'folge').map((t) => t.de), ...seen].join('\n');
    arr(step?.pool?.generators).forEach((g, gi) => {
      if (g?.generator !== 'lex.glossTyped' && g?.generator !== 'lex.articlePlural') return;
      arr(g.source).forEach((idRef, k) => {
        const e = lex.find((x) => x?.id === idRef);
        if (e && countOccurrences(e, visible, cache) === 0) out.push(advisory(doc, `${path}.pool.generators[${gi}].source[${k}]`, `${g.generator} drills ${e.lemma}, which the step's input (and every input before it) never shows — drill a word the learner has met`, idRef));
      });
    });
  }
  return out;
}

export const id = 'LEX-05';
export const title = 'New-word counts and productive share per unit; lexiconBlocks = lexicon allocation';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'spec'; // judges spec fields only (SCHEMA §8.1: present from stage spec)

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  const notes = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const lx = ctx.levels.get(doc.level)?.lexicon;
    if (!lx) continue;
    units += 1;
    const L = levelNumbers(ctx, doc.level);
    const entries = arr(lx.entries).filter((e) => e?.unit === doc.data.id);
    const [lo, hi] = L.newPerUnit;
    const min = Math.floor(lo * 0.9);
    const max = Math.ceil(hi * 1.1);
    const lexFile = lx.file;
    const unitFile = doc.file;
    const specsFile = `${doc.level}/specs.json`;
    const bundle = ctx.levels.get(doc.level)?.specs?.get(doc.nr) || null;
    const inBundle = (id) => arr(bundle?.spec?.lexiconBlocks).some((b) => arr(b?.lemmas).includes(id));
    if (entries.length < min || entries.length > max) findings.push(blocker(doc, 'spec.lexiconBlocks', `${entries.length} new lexicon entries (level target ${lo}–${hi}, ±10 %: ${min}–${max}) — owner: the lexicon allocation (${lexFile})`, doc.data.id));
    if (entries.length) {
      const prod = entries.filter((e) => e.role === 'productive').length / entries.length;
      if (Math.abs(prod - L.productiveShare) > 0.05 + 1e-9) findings.push(blocker(doc, 'spec.lexiconBlocks', `productive share ${pct(prod)} (profile ${pct(L.productiveShare)} ± 5 points) — owner: the lexicon roles (${lexFile})`, doc.data.id));
    }
    // allocation: the spec's blocks are the lexicon's entries of this unit, block by block
    const blocks = arr(doc.data.spec?.lexiconBlocks);
    if (!blocks.length) continue;
    const inSpec = new Map();
    blocks.forEach((b, bi) => arr(b?.lemmas).forEach((l) => inSpec.set(l, bi + 1)));
    const byId = new Map(arr(lx.entries).map((e) => [e.id, e]));
    const missing = entries.filter((e) => !inSpec.has(e.id)).map((e) => e.id);
    if (missing.length) {
      const agree = bundle ? missing.filter(inBundle) : [];
      const odd = bundle ? missing.filter((id) => !inBundle(id)) : missing;
      if (agree.length) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lexFile} and ${specsFile} allocate to ${doc.data.id}, the unit spec omits: ${list(agree)} — owner: the unit author adds them to spec.lexiconBlocks (${unitFile}); if the level plan says they are not taught here, the owners of ${lexFile} and ${specsFile} de-allocate them instead (the unit author cannot change those files)`, doc.data.id));
      if (odd.length) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lexFile} allocates to ${doc.data.id}, the unit spec${bundle ? ` and ${specsFile}` : ''} omit${bundle ? '' : 's'}: ${list(odd)} — owner: the lexicon owner moves or removes them in ${lexFile}${bundle ? '' : ` (or the unit author adds them to ${unitFile})`}`, doc.data.id));
    }
    for (const [lemmaId, blockNr] of inSpec) {
      const e = byId.get(lemmaId);
      if (!e) {
        // a promotion to this unit (receptive → productive, SCHEMA §6) is taught here: listed rightly
        if (arr(lx.promotions).some((pr) => pr?.lemma === lemmaId && pr?.unit === doc.data.id)) continue;
        // another level's lemma (REF-01 resolves it, so nothing else would say so)
        const other = LEVELS.filter((l) => l !== doc.level).map((l) => [l, arr(ctx.levels.get(l)?.lexicon?.entries).find((x) => x?.id === lemmaId), ctx.levels.get(l)?.lexicon?.file]).find((x) => x[1]);
        if (other) {
          const earlier = LEVELS.indexOf(other[0]) < LEVELS.indexOf(doc.level);
          findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is allocated at ${other[0]} (${other[1].unit}, ${other[2]}), listed as new in ${doc.data.id} — ${earlier ? `an earlier level's lemma is a review word, not new: owner: the unit author removes it from spec.lexiconBlocks (${unitFile})${inBundle(lemmaId) ? ` and the curriculum owner from ${specsFile}` : ''}` : `owner: the lexicon owners (${other[2]}, ${lexFile}) decide which level teaches it`}`, lemmaId));
        }
        continue; // an id no lexicon holds is REF-01's
      }
      if (e.unit !== doc.data.id) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is allocated to ${e.unit} in ${lexFile}, listed in ${doc.data.id} — owner: ${inBundle(lemmaId) ? `the lexicon owner (${lexFile}: ${specsFile} agrees with the unit)` : `the unit author (${unitFile}) removes it, or the lexicon owner (${lexFile}) moves it here`}`, lemmaId));
      else if (typeof e.block === 'number' && e.block !== blockNr) findings.push(blocker(doc, 'spec.lexiconBlocks', `${lemmaId} is block ${e.block} in ${lexFile}, block ${blockNr} in the spec — owner: the unit author (${unitFile}) or the lexicon owner (${lexFile}), whichever block is wrong`, lemmaId));
    }
  }
  // level total vs course.json targets
  if (mode !== 'file') {
    for (const slot of levels) {
      const t = slot.course?.data?.targets?.newWords;
      const lx = slot.lexicon;
      if (!Array.isArray(t) || !lx) continue;
      const n = lx.entries.length;
      const lo = Math.floor(t[0] * 0.9);
      const hi = Math.ceil(t[1] * 1.1);
      const unitsWithEntries = new Set(lx.entries.map((e) => e?.unit)).size;
      if (n < lo || n > hi) {
        const f = unitsWithEntries >= 12 ? blocker : advisory;
        findings.push(f({ file: lx.file }, 'entries', `${n} entries for ${slot.level} (course target ${t[0]}–${t[1]}, ±10 %: ${lo}–${hi})${unitsWithEntries < 12 ? ` — ${unitsWithEntries}/12 units allocated so far` : ''}`, slot.level));
      }
    }
  }
  for (const doc of docs) if (doc.kind === 'unit' && ctx.levels.get(doc.level)?.lexicon) findings.push(...contentFindings(ctx, doc));
  notes.push(...[...new Set(docs.map((d) => `${d.level}: ${levelNumbers(ctx, d.level).source}`))]);
  return units ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet' };
}
