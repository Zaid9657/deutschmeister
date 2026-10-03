// The grammar ceiling as a function (GRM-04's question, asked of any text): which detector hits in
// `text` name a construction the spine licenses only after `pos`? Used by LEX-07 for lexicon example
// sentences (review a2.2-u04 r2 F01 / r3 F01: the lx.fluss flashcard taught „entlang" at a2.2-u04,
// seven units before the spine licenses it).

import { allLexicon } from './context.mjs';
import { buildLexEnv, detectInText, withOverlay } from './detectors.mjs';
import { detectorPlacement, exemptForms } from './spine.mjs';
import { tokens, FUNCTION_WORDS } from './text.mjs';

/**
 * A ceiling checker for a context, or null when the spine or the detectors are missing.
 * check(text, pos, surface = 'input'|'production', declared = Set of spine ids) →
 *   [{ detector, construction, match, precision, licensedAt, points }]
 */
export function ceilingChecker(ctx) {
  if (!ctx.registries.spine || !ctx.registries.detectors) return null;
  const placement = detectorPlacement(ctx);
  if (!placement.size) return null;
  const detectors = ctx.registries.detectors.list.filter((d) => placement.has(d.id));
  const env = buildLexEnv(allLexicon(ctx));
  const exemptCache = new Map();
  return (text, pos, surface = 'input', declared = new Set()) => {
    const out = [];
    if (!text || pos === null) return out;
    const key = `${pos}|${surface}|${[...declared].sort().join(',')}`;
    if (!exemptCache.has(key)) exemptCache.set(key, exemptForms(ctx, pos, surface, declared, FUNCTION_WORDS));
    const exempt = exemptCache.get(key);
    for (const det of detectors) {
      const place = placement.get(det.id);
      const licensedAt = surface === 'production' ? place.prod : place.rec;
      if (licensedAt === null || licensedAt <= pos) continue;
      if (place.points.some((p) => declared.has(p))) continue;
      if (place.chunk !== null && place.chunk <= pos) continue; // licensed as a chunk here: no ceiling breach (GRM-04 does not report it either)
      // an article is reported only where the learner chooses it (GRM-04 `reportOn: 'chosen'`, RAILS §3.1c)
      if (withOverlay(det).spec?.reportOn === 'chosen') continue;
      for (const hit of detectInText(det, text, env)) {
        const content = tokens(hit.match).map((t) => t.lower).filter((w) => !FUNCTION_WORDS.has(w));
        if (content.length && content.every((w) => exempt.has(w))) continue;
        out.push({ detector: det.id, construction: det.construction, match: hit.match, precision: hit.precision, licensedAt, points: place.points });
        break;
      }
    }
    return out;
  };
}
