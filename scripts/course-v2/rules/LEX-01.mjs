// LEX-01 — known-token coverage ≥ 95 % per input and exam text (≥ 98 % for the extensive strand);
// known = earlier units + this unit's lexicon (every inflected form, lexicon.mjs) + the closed A1 core
// and number words (core-lexicon.mjs) + forms the unit's grammar licenses (its spine points' rule-card
// examples, lexicon.mjs licensedForms) + cast names + the file's `extras` names (one-off speakers,
// SCHEMA §3.5) + glossed extras; a one-letter token is an option key, never a word
// (BLUEPRINT §9.1, §2.6). Hard once the cumulative lexicon exists up to the unit (every earlier
// level and every earlier unit of this level); before that the measurement is advisory — the SCHEMA
// §15.6 fixture row „LEX-01 … unknown tokens are reported as advisory".
//
// Rail extensions (rule-smith 2026-09-27): the unit's story.cliffhanger — the line a learner reads at the
// end of the unit, without an English twin — is measured like an input, as an ADVISORY (review a1.1-u04
// r2 F07, minor; it teases the next unit's words, and the other fix, an `en` twin or glosses, is the
// SCHEMA owner's); a
// compound of two known forms (compounds.mjs: „Radtour", „Möbelstücke") counts as known (reviews
// b1.2-u04 r1 F01, b2.2-u04 r1 F05); its allocation is LEX-03's advisory. The Folge's optional
// `glosses` (SCHEMA §8 Start) gloss the Folge like an input's.
//
// The surface walk (reviews a1.1-u04 r3 F05, r4 F04, r5 F03 — the class in its third round, BLUEPRINT
// §9.4): besides the inputs and exam texts, every German surface the learner must read to answer —
// items' promptDe, options and explanation.de; exam blocks' and speaking parts' instructionsDe; every
// situationDe; writing tasks' taskDe, Leitpunkte and checklist; micro-outputs' promptDe; title.canDo;
// step titles and endLines (lib-validate/metalanguage.mjs walkReadSurfaces). A content word there that is
// not known at the unit's position (allocated to a later unit, or to none) is glossed on that screen
// (the Folge's glosses for title.canDo, the step input's for its title, the block's text glosses for an
// exam block and its items) or is instruction metalanguage (metalanguage.mjs INSTRUCTION_METALANGUAGE).
// An error-correction prompt's quoted sentence is wrong on purpose and is not read. Severity follows
// the coverage rule: a blocker once the cumulative lexicon exists up to the unit, an advisory before —
// so the SCHEMA §15 worked example (a stub cumulative lexicon) reports advisories only and §15.6 holds.

import { walkTexts } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown, entryForms } from '../lib-validate/lexicon.mjs';
import { levelNumbers, arr, finding, pct, list } from '../lib-validate/helpers.mjs';
import { parseUnitId, describePosition, unitPosition } from '../lib-validate/ids.mjs';
import { unitDoc, allLexicon } from '../lib-validate/context.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';
import { walkReadSurfaces, isMetalanguage, taskNames, stripFragments, plantedForm } from '../lib-validate/metalanguage.mjs';

export const id = 'LEX-01';
export const title = 'Known-token coverage of inputs and exam texts (≥ 95 %; extensive ≥ 98 %); read surfaces use known words';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

export function coverage(text, known, glosses = []) {
  const toks = readTokens(text);
  const gl = new Set(arr(glosses).map((g) => String(g).toLowerCase()));
  const unknown = [];
  const knownForm = (w) => isKnown(w, known);
  for (const t of toks) if (!isKnown(t.lower, known) && !gl.has(t.lower) && !knownCompound(t.lower, knownForm)) unknown.push(t.text);
  return { total: toks.length, unknown, share: toks.length ? 1 - unknown.length / toks.length : 1 };
}

/**
 * The words of one read surface that are neither known, glossed on its screen, a compound of known parts
 * nor instruction metalanguage.
 */
export function unknownOnSurface(text, known, glosses = [], planted = null) {
  const gl = new Set(arr(glosses).map((g) => String(g).toLowerCase()));
  const knownForm = (w) => isKnown(w, known);
  const out = [];
  for (const t of readTokens(stripFragments(text))) {
    if (isKnown(t.lower, known) || gl.has(t.lower) || isMetalanguage(t.lower) || knownCompound(t.lower, knownForm)) continue;
    if (planted && planted(t.lower)) continue;
    // a hyphenated word of known parts (Sie-Form, du-Form)
    if (t.lower.includes('-') && t.lower.split('-').every((w) => isKnown(w, known) || isMetalanguage(w) || gl.has(w))) continue;
    if (!out.includes(t.text)) out.push(t.text);
  }
  return out;
}

const allocCache = new WeakMap();
/** lower-case form → { id, unit } of the earliest lexicon entry that has it (for the message). */
function allocationIndex(ctx) {
  if (allocCache.has(ctx)) return allocCache.get(ctx);
  const m = new Map();
  for (const e of allLexicon(ctx)) {
    const p = unitPosition(e?.unit);
    if (p === null) continue;
    for (const f of entryForms(e).forms) {
      const prev = m.get(f);
      if (!prev || unitPosition(prev.unit) > p) m.set(f, { id: e.id, unit: e.unit });
    }
  }
  allocCache.set(ctx, m);
  return m;
}

const SURFACE_LABEL = {
  canDo: 'the can-do title', stepTitle: 'a step title', endLine: 'an endLine', prompt: 'a prompt', option: 'an option',
  explanation: 'an explanation', instructions: 'an instruction', situation: 'a situation', leitpunkt: 'a Leitpunkt', checklist: 'a checklist line',
};

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  const cache = new Map();
  let surfaceHits = 0;
  for (const doc of docs) {
    const nr = doc.kind === 'unit' ? doc.nr : doc.kind === 'lanepack' ? parseUnitId(doc.data.unit)?.nr : 12;
    if (!ctx.levels.get(doc.level)?.lexicon) continue;
    const key = `${doc.level}|${nr}`;
    if (!cache.has(key)) cache.set(key, { known: knownForms(ctx, doc.level, nr), state: lexiconComplete(ctx, doc.level, nr) });
    const { known: base, state } = cache.get(key);
    const known = new Set(base);
    const unitData = doc.kind === 'unit' ? doc.data : doc.kind === 'lanepack' ? unitDoc(ctx, doc.data.unit)?.data : null;
    if (unitData) for (const f of licensedForms(ctx, unitData).forms) known.add(f);
    for (const [slug, x] of Object.entries(doc.data?.extras && typeof doc.data.extras === 'object' ? doc.data.extras : {})) {
      for (const t of readTokens(`${x?.name || ''} ${x?.nameDe || ''} ${slug.replace(/^x\./, '').replace(/-/g, ' ')}`)) known.add(t.lower);
    }
    const min = levelNumbers(ctx, doc.level).coverageMin;
    const surfaces = [...walkTexts(doc)];
    if (doc.kind === 'unit' && doc.data?.story?.cliffhanger) surfaces.push({ kind: 'story', de: String(doc.data.story.cliffhanger), path: 'story.cliffhanger', glosses: [], step: null });
    for (const t of surfaces) {
      if (!t.de.trim()) continue;
      texts += 1;
      const need = t.kind === 'reward' ? 0.98 : min;
      const c = coverage(t.de, known, t.glosses);
      if (c.share + 1e-9 < need) {
        const severity = state.complete && t.kind !== 'story' ? 'blocker' : 'advisory';
        findings.push(finding(severity, doc, t.path, `known-token coverage ${pct(c.share)} (need ≥ ${pct(need)}); unknown: ${list([...new Set(c.unknown)], 12)}${state.complete ? '' : ` — advisory until the cumulative lexicon exists (${state.why})`}`, t.step?.id || t.block?.id || null));
      }
    }
    // the surface walk: prompts, options, explanations, instructions, situations, Leitpunkte, checklist,
    // can-do title, step titles, endLines (r3 F05 / r4 F04 / r5 F03)
    const named = new Set(known);
    for (const n of taskNames(doc)) for (const t of readTokens(n)) named.add(t.lower);
    const alloc = allocationIndex(ctx);
    const here = unitPosition(unitData?.id ?? doc.data?.unit);
    for (const sf of walkReadSurfaces(doc)) {
      if (sf.kind === 'strategyCard' || !sf.de.trim()) continue;
      texts += 1;
      // a distractor option's planted wrong form is no word to learn („Busfahrin", „Hoffman")
      const planted = sf.kind === 'option' && sf.item && String(sf.de).trim() !== String(sf.item.answer ?? '').trim() ? (w) => !alloc.has(w) && plantedForm(w, sf.item) : null;
      const unknown = unknownOnSurface(sf.de, named, sf.glosses, planted);
      if (!unknown.length) continue;
      surfaceHits += 1;
      const where = unknown.map((w) => {
        const a = alloc.get(w.toLowerCase());
        if (!a) return `„${w}" (no lexicon entry)`;
        const at = unitPosition(a.unit);
        return `„${w}" (${a.id}: ${at !== null && here !== null && at > here ? a.unit : `${a.unit}, not licensed here`})`;
      });
      // a surface whose screen shows its English twin (promptEn, explanation.en) is an advisory
      const severity = state.complete && !sf.twin ? 'blocker' : 'advisory';
      const tail = !state.complete ? ` — advisory until the cumulative lexicon exists (${state.why})` : sf.twin ? ' — advisory: the screen shows its English twin' : '';
      findings.push(finding(severity, doc, sf.path, `${SURFACE_LABEL[sf.kind] || sf.kind} uses a word not known at ${describePosition(here)}: ${list(where, 6)} — gloss it on that screen, reword with known words, or allocate it to this unit or earlier${tail}`, sf.id));
    }
  }
  if (surfaceHits) notes.push(`${surfaceHits} read surface(s) with an unknown word (metalanguage allowlist: lib-validate/metalanguage.mjs)`);
  return texts ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet, or no input text' };
}
