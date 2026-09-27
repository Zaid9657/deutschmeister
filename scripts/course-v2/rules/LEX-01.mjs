// LEX-01 — known-token coverage ≥ 95 % per input and exam text (≥ 98 % for the extensive strand);
// known = earlier units + this unit's lexicon + function words + cast names + the file's `extras`
// names (one-off speakers, SCHEMA §3.5) + glossed extras
// (BLUEPRINT §9.1, §2.6). Hard once the cumulative lexicon exists up to the unit (every earlier
// level and every earlier unit of this level); before that the measurement is advisory — the SCHEMA
// §15.6 fixture row „LEX-01 … unknown tokens are reported as advisory".

import { walkTexts } from '../lib-validate/walk.mjs';
import { knownForms, lexiconComplete, readTokens } from '../lib-validate/lexicon.mjs';
import { levelNumbers, arr, finding, pct, list } from '../lib-validate/helpers.mjs';
import { parseUnitId } from '../lib-validate/ids.mjs';

export const id = 'LEX-01';
export const title = 'Known-token coverage of inputs and exam texts (≥ 95 %; extensive ≥ 98 %)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

export function coverage(text, known, glosses = []) {
  const toks = readTokens(text);
  const gl = new Set(arr(glosses).map((g) => String(g).toLowerCase()));
  const unknown = [];
  for (const t of toks) if (!known.has(t.lower) && !gl.has(t.lower)) unknown.push(t.text);
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
    for (const [slug, x] of Object.entries(doc.data?.extras && typeof doc.data.extras === 'object' ? doc.data.extras : {})) {
      for (const t of readTokens(`${x?.name || ''} ${x?.nameDe || ''} ${slug.replace(/^x\./, '').replace(/-/g, ' ')}`)) known.add(t.lower);
    }
    const min = levelNumbers(ctx, doc.level).coverageMin;
    for (const t of walkTexts(doc)) {
      if (!t.de.trim()) continue;
      texts += 1;
      const need = t.kind === 'reward' ? 0.98 : min;
      const c = coverage(t.de, known, t.glosses);
      if (c.share + 1e-9 < need) {
        const severity = state.complete ? 'blocker' : 'advisory';
        findings.push(finding(severity, doc, t.path, `known-token coverage ${pct(c.share)} (need ≥ ${pct(need)}); unknown: ${list([...new Set(c.unknown)], 12)}${state.complete ? '' : ` — advisory until the cumulative lexicon exists (${state.why})`}`, t.step?.id || t.block?.id || null));
      }
    }
  }
  return texts ? { findings, notes } : { findings, skipped: 'no lexicon.json for the target level yet, or no input text' };
}
