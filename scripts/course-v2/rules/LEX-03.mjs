// LEX-03 — items, model texts and expected answers use known lemmas only; ≤ 3 glossed receptive
// extras per text (BLUEPRINT §9.1). „Known" is LEX-01's set: every inflected form of an allocated
// lemma, the closed A1 core, number words and the forms the unit's own grammar licenses (the rule-card
// examples of its spine points: „am dritten Mai", „Könnten Sie …?"); one-letter option keys are not words. Hard once the cumulative lexicon exists up to the unit; before
// that advisory (see LEX-01).
//
// Rail extensions (rule-smith 2026-09-27):
//   - generator sources are production (review a2.1-u04 r2 F09, minor, one round): a lex.articlePlural or
//     lex.glossTyped source lemma is productive or core (the learner writes its article, plural or the
//     word), and a dictation.fromInput line makes the learner spell none of the unit's receptive-only or
//     off-list lemmas. lex.glossTyped is a BLOCKER (a1.1-u04 r4 F02: typing the German word from an English
//     gloss is recall, production by definition — the class came back a second time; the §15 example's
//     glossTyped sources are all productive); lex.articlePlural and the dictation lines stay ADVISORY (the
//     lemma is given or heard, only its inflection or spelling is produced — recognition-spelling, the
//     review's route (a); the SCHEMA §15 worked example dictates „Stau", „Buchhaltung", receptive there);
//   - an authored fill_blank that gives a receptive lemma in brackets and asks for another form of it
//     („Eine Birne? Nein, drei ___, bitte. (die Birne)" → „Birnen", a1.1-u04 r4 F02) is the same act as
//     lex.articlePlural: an ADVISORY naming the item;
//   - a compound of two known forms („Radtour", „Möbelstücke") is an advisory — allocate it as
//     `compound:a+b` — never a blocker (reviews b1.2-u04 r1 F01, b2.2-u04 r1 F05; compounds.mjs).
//
// Third round (the a1.1 unit reviews u01–u06, rule-smith 2026-09-28, RAILS §3.1c):
//   - receptive-typed: an authored typed item (fill_blank, typed cloze, notes, form_fill) whose key holds
//     a form of one of the UNIT's receptive lemmas that the prompt does not show is typed recall of a word
//     taught for recognition (a1.1-u01 r1 F10 / r2 F05 / r3 F05a, u03 r1 F06 / r2 F03 / r3 F03 — six
//     rounds). A RATCHET, not a blocker: the learner is not graded wrong, the item asks for a word the
//     unit only lets them recognise; the fix is the item (cue a productive word) or a promotion;
//   - a typed number-word key when every number lemma the unit allocates is receptive (a1.1-u02 r2 F07 /
//     r3 F06): the same class, the same ratchet;
//   - produced lemmas (a1.1-u06 r1 F12 … u08 r1 F07 / r2 F06 / r3 F07, u09 r3 F06, u10 r1 F14, u12 r2 F04 / r3 F03
//     — the class of eight units): a lemma the unit makes the learner PRODUCE — a model sentence, a Redemittel,
//     the learner's speaking cards and model turns, hintWords, Leitpunkt cues, a checklist line, a model text,
//     a micro-output model — is productive (or promoted, or core) at or before the unit. A receptive lemma, of
//     this unit or an earlier one, or a lemma allocated later, there is a RATCHET. No metalanguage exemption
//     except on the checklist, and a capitalised word inside a sentence is matched against nouns only
//     („Eine Frage" is not „frage");
//   - a bracketed cue names a lemma: its first noun or verb („(der Kellner → die …)", „(aufmachen)") resolves to
//     a lexicon entry, a feminine form to its masculine entry; a cue that matches no lemma, or one allocated
//     later or receptive, is an ADVISORY (a1.1-u07 r2 F05 / r3 F06, u10 r2 F03 / r3 F04);
//   - an authored dictation makes the learner spell no receptive lemma of the cumulative lexicon (advisory,
//     a1.1-u12 r2 F04 / r3 F03);
//   - FALSE POSITIVES closed: a spelled letter chain („B-E-R-I-S-H-A", check.js SPELLED_OUT_RE) is
//     letters, not an unknown lemma (a1.1-u02 r3); the file's `extras` names are known words in
//     production as they are in LEX-01 (a1.1-u02 r1: an sd1.h1 spelling key could not name an extra).

import { walkProduction, walkTexts, walkTasks, walkMicroOutputs, speakingParts } from '../lib-validate/walk.mjs';
import { isMetalanguage } from '../lib-validate/metalanguage.mjs';
import { unitPosition } from '../lib-validate/ids.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown } from '../lib-validate/lexicon.mjs';
import { arr, finding, blocker, list } from '../lib-validate/helpers.mjs';
import { parseUnitId } from '../lib-validate/ids.mjs';
import { unitDoc, cumulativeLexicon, allLexicon } from '../lib-validate/context.mjs';
import { walkSteps, walkItems } from '../lib-validate/walk.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';
import { FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { CORE_LEMMAS, NUMBER_WORDS } from '../lib-validate/core-lexicon.mjs';
import { tokens } from '../lib-validate/text.mjs';

/** A spelled-out letter chain („B-E-R-I-S-H-A", „H A L L O") is letters (check.js SPELLED_OUT_RE). */
export const SPELLED_CHAIN_RE = /^\p{L}(?:-\p{L})+$/u;
/** Typed item types whose key the learner writes from memory (dictation is heard, not recalled). */
const RECALL_TYPES = new Set(['fill_blank', 'cloze', 'notes', 'form_fill']);

const CORE = new Set(CORE_LEMMAS.map((w) => String(w).toLowerCase()));

const content = await import('../../../src/components/course-v2/content.js').catch(() => null);

export const id = 'LEX-03';
export const title = 'Production uses known lemmas only; ≤ 3 glossed extras per text';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

/** Generator sources as production (a2.1-u04 r2 F09). Returns the findings; `out.checked` counts what was read. */
function generatorFindings(ctx, doc) {
  const out = [];
  out.checked = 0;
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
  // receptive-typed (RAILS §3.1c): the unit's own receptive lemmas (not promoted, not core), by form; a form
  // shared with a lemma the learner may produce is safe
  const receptiveForms = new Map();
  for (const e of lex) {
    if (!e?.lemma || e.unit !== doc.data?.id || e.role !== 'receptive' || promoted.has(e.id) || CORE.has(String(e.lemma).toLowerCase())) continue;
    for (const f of entryForms(e).forms) if (f.length > 2 && !FUNCTION_WORDS.has(f) && !NUMBER_WORDS.has(f)) receptiveForms.set(f, e);
  }
  for (const e of lex) {
    if (!e?.lemma || receptiveForms.size === 0) continue;
    if (e.role === 'productive' || promoted.has(e.id)) for (const f of entryForms(e).forms) receptiveForms.delete(f);
  }
  // the unit's number lemmas: a typed number-word key is recall when all of them are receptive
  const numberLemmas = lex.filter((e) => e?.unit === doc.data?.id && NUMBER_WORDS.has(String(e.lemma).toLowerCase()));
  const numbersReceptive = numberLemmas.length > 0 && numberLemmas.every((e) => e.role === 'receptive' && !promoted.has(e.id));
  const recallFlagged = new Set();
  for (const { item, path, where } of walkItems(doc)) {
    if (!item || !RECALL_TYPES.has(item.type) || arr(item.options).length) continue;
    // a comprehension item (input, structured, exam, proof items, or one tied to a line or text) takes its key
    // from what the learner hears or reads: recognition-spelling, like a dictation line — not recall
    if (!['pool', 'reserve', 'check'].includes(where) || item.audioLineRef || item.textRef) continue;
    const shown = new Set(tokens(`${item.promptDe || ''} ${arr(item.tiles).join(' ')}`).map((t) => t.lower));
    const keyWords = [...new Set(tokens(String(item.answer ?? '')).map((t) => t.lower))].filter((w) => !shown.has(w));
    const hits = keyWords.filter((w) => receptiveForms.has(w));
    // a bracketed cue of the same lemma („(die Birne)" → „Birnen") is recognition-spelling, the advisory below —
    // unless the item drills a new spine point of the unit and the cue carries no article (u03 r2 F03)
    const cues = [...String(item.promptDe || '').matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
    const newPoint = arr(doc.data?.spec?.grammar?.new).includes(item.topic);
    const cuedByBracket = hits.length && cues.some((c) => {
      const bare = c.replace(/^(?:der|die|das|sich)\s+/i, '').toLowerCase();
      const e = hits.map((w) => receptiveForms.get(w)).find((x) => String(x.lemma).replace(/^(?:der|die|das|sich)\s+/i, '').toLowerCase() === bare);
      return e && (!newPoint || /^(?:der|die|das)\s/i.test(c));
    });
    if (hits.length && !cuedByBracket) {
      recallFlagged.add(item);
      out.push(finding('ratchet', doc, `${path}.answer`, `typed recall of a receptive word: the key „${item.answer}" makes the learner write ${hits.map((w) => `„${w}" (${receptiveForms.get(w).id}, receptive at ${doc.data?.id})`).join(', ')} — cue a productive word, show the form in the prompt, or promote the lemma`, item.id));
      continue;
    }
    const numbers = keyWords.filter((w) => NUMBER_WORDS.has(w) && w.length > 3);
    if (numbersReceptive && numbers.length) out.push(finding('ratchet', doc, `${path}.answer`, `typed number word(s) ${numbers.map((w) => `„${w}"`).join(', ')}, but every number lemma ${doc.data?.id} allocates is receptive (${numberLemmas.map((e) => e.id).join(', ')}) — make one productive or accept the digits (exact: "number")`, item.id));
  }
  // authored fill_blank items that hand the learner a receptive lemma in brackets and key another form of it
  const byLemma = new Map();
  for (const e of lex) {
    if (!e?.lemma || e.role === 'productive' || promoted.has(e.id) || CORE.has(String(e.lemma).toLowerCase())) continue;
    const bareLemma = String(e.lemma).replace(/^(?:der|die|das|sich)\s+/i, '').toLowerCase();
    if (!byLemma.has(bareLemma)) byLemma.set(bareLemma, e);
  }
  for (const { item, path } of walkItems(doc)) {
    if (!item || item.type !== 'fill_blank' || arr(item.options).length || recallFlagged.has(item)) continue;
    for (const m of String(item.promptDe || '').matchAll(/\(([^)]+)\)/g)) {
      const cue = m[1].replace(/^(?:der|die|das|sich)\s+/i, '').trim().toLowerCase();
      const e = byLemma.get(cue);
      if (!e) continue;
      const key = String(item.answer ?? '').trim().toLowerCase();
      if (!key || key === cue || /\s/.test(key) || !entryForms(e).forms.has(key)) continue;
      out.push(finding('advisory', doc, `${path}.answer`, `the learner writes „${item.answer}" from the bracketed lemma „${m[1]}", but ${e.id} is ${e.role} — cue a productive lemma, or promote it`, item.id));
    }
  }
  const lines = content ? content.lineIndex(doc.data) : new Map();
  for (const { step, path } of walkSteps(doc)) {
    arr(step?.pool?.generators).forEach((g, gi) => {
      if (!g || !Array.isArray(g.source)) return;
      const gp = `${path}.pool.generators[${gi}]`;
      if (g.generator === 'lex.articlePlural' || g.generator === 'lex.glossTyped') {
        out.checked += g.source.length;
        g.source.forEach((id, k) => {
          const e = byId.get(id);
          if (e && e.role !== 'productive' && !promoted.has(id) && !CORE.has(String(e.lemma).toLowerCase())) {
            // typed recall from a gloss is production (r4 F02): a blocker; the article/plural drill an advisory
            const sev = g.generator === 'lex.glossTyped' ? 'blocker' : 'advisory';
            out.push(finding(sev, doc, `${gp}.source[${k}]`, `${g.generator} makes the learner write ${e.lemma}${g.generator === 'lex.articlePlural' ? "'s article and plural" : ' from its English gloss'}, but ${id} is ${e.role} — use a productive lemma${sev === 'blocker' ? ' (or promote it through lexicon.json promotions)' : ''}`, id));
          }
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

/** The production surfaces of a unit: [{ de, path, meta? }]. */
export function productionSurfaces(doc) {
  const out = [];
  const d = doc.data || {};
  for (const { step, path } of walkSteps(doc)) if (step?.modelSentence) out.push({ de: String(step.modelSentence), path: `${path}.modelSentence` });
  arr(d.redemittel).forEach((r, i) => { if (r?.de) out.push({ de: String(r.de), path: `redemittel[${i}].de` }); });
  for (const { task, kind, path } of walkTasks(doc)) {
    if (kind === 'speaking') {
      arr(task.hintWords).forEach((h, i) => out.push({ de: String(h), path: `${path}.hintWords[${i}]` }));
      arr(task.modelTurns).forEach((t, i) => { if (t?.speaker === 'learner' && t.de) out.push({ de: String(t.de), path: `${path}.modelTurns[${i}].de` }); });
      // a card that is a keyword prompt („Wohnort?", the exam's Stichwort) is a stimulus, not a word to produce
      for (const { part, path: pp } of speakingParts(task)) arr(part?.cards?.learner).forEach((c, i) => { const de = String(typeof c === 'string' ? c : c?.de || ''); if (!/\?\s*$/.test(de)) out.push({ de, path: `${path}${pp}.cards.learner[${i}]` }); });
    } else {
      arr(task.leitpunkte).forEach((lp, i) => arr(lp?.cues).forEach((c, k) => out.push({ de: String(c), path: `${path}.leitpunkte[${i}].cues[${k}]` })));
      // the checklist is read while writing: its instruction words („Punkt 2:", „Anrede") are metalanguage
      arr(task.checklist).forEach((c, i) => out.push({ de: String(c), path: `${path}.checklist[${i}]`, meta: true }));
      if (task.modelText) out.push({ de: String(task.modelText), path: `${path}.modelText` });
    }
  }
  for (const { mo, path } of walkMicroOutputs(doc)) if (mo?.modelDe) out.push({ de: String(mo.modelDe), path: `${path}.modelDe` });
  return out;
}

/** Produced lemmas that are not productive at the unit (the ratchet above). */
function producedFindings(ctx, doc) {
  const out = [];
  const d = doc.data || {};
  const here = unitPosition(d.id);
  if (here === null) return out;
  const lex = allLexicon(ctx);
  const promoted = new Set();
  for (const l of ctx.levels.values()) for (const pr of arr(l.lexicon?.promotions)) promoted.add(pr?.lemma);
  const byForm = new Map();
  for (const e of lex) {
    const at = unitPosition(e?.unit);
    if (at === null || !e?.lemma) continue;
    for (const f of entryForms(e).forms) {
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
      if (cands.some((c) => c.at <= here && (c.e.role === 'productive' || promoted.has(c.e.id)))) return;
      const c = cands.sort((a, b) => a.at - b.at)[0];
      bad.push(`„${t.text}" (${c.e.id}: ${c.at > here ? `allocated ${c.e.unit}` : `receptive, ${c.e.unit}`})`);
    });
    if (bad.length) out.push(finding('ratchet', doc, sf.path, `the learner is asked to produce ${[...new Set(bad)].slice(0, 4).join(', ')} — use a productive word, or promote the lemma (lexicon.json promotions)`, null));
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
    // the file's extras are known words in production too, as in LEX-01 (a1.1-u02 r1)
    for (const [slug, x] of Object.entries(doc.data?.extras && typeof doc.data.extras === 'object' ? doc.data.extras : {})) {
      for (const t of readTokens(`${x?.name || ''} ${x?.nameDe || ''} ${slug.replace(/^x\./, '').replace(/-/g, ' ')}`)) known.add(t.lower);
    }
    const pending = { surfaces: 0, forms: new Set() };
    const knownForm = (w) => isKnown(w, known);
    for (const p of walkProduction(doc)) {
      if (p.item?.intentionalError && p.kind !== 'answer') continue;
      n += 1;
      const all = [...new Set(readTokens(p.de).filter((t) => !isKnown(t.lower, known) && !SPELLED_CHAIN_RE.test(t.text)).map((t) => t.text))];
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
    if (doc.kind === 'unit') {
      findings.push(...producedFindings(ctx, doc));
      const gen = generatorFindings(ctx, doc);
      n += gen.checked;
      findings.push(...gen);
    }
    // before the cumulative lexicon exists the measurement is one advisory per document
    if (pending.surfaces) findings.push(finding('advisory', doc, null, `${pending.surfaces} production surface(s) use forms not in the lexicon so far: ${list([...pending.forms], 25)} — advisory until the cumulative lexicon exists (${state.why})`, doc.data?.id || null));
  }
  return n || findings.length ? { findings } : { findings, skipped: 'no lexicon.json for the target level yet, or no production surface' };
}
