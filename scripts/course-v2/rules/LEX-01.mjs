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
// b1.2-u04 r1 F01, b2.2-u04 r1 F05); its allocation is LEX-03's advisory.

import { walkTexts } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens, licensedForms, isKnown } from '../lib-validate/lexicon.mjs';
import { levelNumbers, arr, finding, pct, list } from '../lib-validate/helpers.mjs';
import { parseUnitId } from '../lib-validate/ids.mjs';
import { unitDoc } from '../lib-validate/context.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';

export const id = 'LEX-01';
export const title = 'Known-token coverage of inputs and exam texts (≥ 95 %; extensive ≥ 98 %)';
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

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  const cache = new Map();
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
  }
  return texts ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet, or no input text' };
}
