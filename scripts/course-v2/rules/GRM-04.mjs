// GRM-04 — grammar ceiling (BLUEPRINT §9.1, §9.3): production lines, model texts, rule-card
// examples, expected answers and exam texts use no construction introduced after the current
// position; inputs exceed it only via whitelisted chunks or glossed receptive exposure.
//
// The construction detectors are `registries/detectors.json`; WHEN a construction is licensed is
// read from the grammar spine (the detector's spine points, their intro and chunkFrom), never typed
// into a detector. Hard for exact detectors, advisory for heuristic/advisory ones and for hits a
// lexicon-driven detector had to guess from word shape.
//
// Positions: production and expected answers are licensed by the point's PRODUCTIVE intro;
// inputs and exam texts by its RECEPTIVE intro. A point the unit itself declares (spec.grammar
// new/chunk/review) is licensed in that unit — a misplacement is GRM-02's finding, reported once.
// A spine chunkFrom at or before the position turns a finding into an advisory "chunk preview".

import { walkTexts, walkProduction, walkSteps } from '../lib-validate/walk.mjs';
import { positionOf, parseUnitId, LEVELS } from '../lib-validate/ids.mjs';
import { allLexicon } from '../lib-validate/context.mjs';
import { buildLexEnv, detectInText } from '../lib-validate/detectors.mjs';
import { detectorPlacement, describePosition, exemptForms } from '../lib-validate/spine.mjs';
import { tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { arr, finding, list } from '../lib-validate/helpers.mjs';

export const id = 'GRM-04';
export const title = 'Grammar ceiling: no construction before the spine licenses it (detectors)';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'S';

/** Course position of a document (Plateaus after their unit, closing and mocks after U12). */
export function docPosition(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') return positionOf(doc.level, d.nr ?? parseUnitId(d.id)?.nr);
  if (doc.kind === 'lanepack') return positionOf(doc.level, parseUnitId(d.unit)?.nr);
  if (doc.kind === 'plateau') {
    const n = Number(String(d.id || '').match(/-p([1-3])$/)?.[1]);
    return n ? positionOf(doc.level, n * 3) + 0.5 : null;
  }
  if (doc.kind === 'closing' || doc.kind === 'mock') return positionOf(doc.level, 12) + 0.5;
  return null;
}

export function run({ ctx, docs, levels, mode, stageOf = () => 'T' }) {
  if (!ctx.registries.spine) return { findings: [], skipped: 'grammar-spine.json missing' };
  if (!ctx.registries.detectors) return { findings: [], skipped: 'detectors.json missing' };
  const placement = detectorPlacement(ctx);
  if (!placement.size) return { findings: [], skipped: 'no detector is mapped to a spine point yet (points[].detectors / spec.spinePoints)' };
  const detectors = ctx.registries.detectors.list.filter((d) => placement.has(d.id));
  const env = buildLexEnv(allLexicon(ctx));
  const spine = ctx.registries.spine.byId;
  const findings = [];
  const notes = [];
  const bySpine = [...placement.values()].filter((p) => p.source === 'spine').length;
  notes.push(`${placement.size} of ${ctx.registries.detectors.list.length} detectors placed (${bySpine} via the spine, ${placement.size - bySpine} via detector hints)${env.available ? '' : '; no lexicon loaded — lexicon-driven detectors run on word shape (advisory)'}`);

  // forms a licensed spine point introduces are licensed, whatever later detector matches them
  // (g.praeteritum-kernverben: kam, sagte, gab from a2.2-u01 under det.praeteritum-vollverb)
  const exemptCache = new Map();
  const exemptAt = (pos, surface, declared) => {
    const key = `${pos}|${surface === 'production' ? 'p' : 'r'}|${[...declared].sort().join(',')}`;
    if (!exemptCache.has(key)) exemptCache.set(key, exemptForms(ctx, pos, surface, declared, FUNCTION_WORDS));
    return exemptCache.get(key);
  };
  const exempted = (match, exempt) => {
    const content = tokens(match).map((t) => t.lower).filter((w) => !FUNCTION_WORDS.has(w));
    return content.length > 0 && content.every((w) => exempt.has(w));
  };

  const check = (doc, pos, declared, text, path, surface, glosses = []) => {
    if (!text) return;
    const seen = new Set();
    for (const det of detectors) {
      const place = placement.get(det.id);
      const licensedAt = surface === 'production' ? place.prod : place.rec;
      if (licensedAt === null || licensedAt <= pos) continue;
      if (place.points.some((p) => declared.has(p))) continue;
      for (const hit of detectInText(det, text, env)) {
        const key = `${det.id}|${path}`;
        if (seen.has(key)) continue;
        if (exempted(hit.match, exemptAt(pos, surface, declared))) continue;
        seen.add(key);
        // glossed receptive exposure: an input may carry a later construction if its token is glossed
        if (surface !== 'production' && glosses.length) {
          const hitTokens = tokens(hit.match).map((t) => t.lower);
          if (hitTokens.some((t) => glosses.includes(t))) continue;
        }
        const chunk = place.chunk !== null && place.chunk <= pos;
        const exact = hit.precision === 'exact';
        const severity = exact && !chunk ? 'blocker' : 'advisory';
        const why = chunk ? ` — licensed only as a chunk preview (chunkFrom ${describePosition(place.chunk)})` : '';
        const prec = exact ? '' : ` [${hit.precision}${hit.fallback ? ', shape fallback' : ''}]`;
        findings.push(finding(severity, doc, path,
          `${surface === 'production' ? 'produces' : surface === 'exam' ? 'exam text uses' : 'input uses'} „${hit.match}" (${det.construction}) — licensed ${surface === 'production' ? 'productively ' : ''}from ${describePosition(licensedAt)} (${list(place.points, 3)}), here ${describePosition(pos)}${why}${prec}`,
          det.id));
      }
    }
  };

  for (const doc of docs) {
    const pos = docPosition(doc);
    if (pos === null) continue;
    const unit = doc.kind === 'lanepack' ? ctx.levels.get(doc.level)?.units.get(parseUnitId(doc.data.unit)?.nr) : doc;
    const g = unit?.data?.spec?.grammar || {};
    const declared = new Set([...arr(g.new), ...arr(g.chunk), ...arr(g.review)]);
    for (const t of walkTexts(doc)) {
      const surface = t.kind === 'exam' ? 'exam' : 'input';
      // line by line so a finding points at the line
      if (t.lines.length) t.lines.forEach((l, i) => check(doc, pos, declared, String(l?.de || ''), `${t.path}.lines[${i}]`, surface, t.glosses.map((x) => x.toLowerCase())));
      if (t.writtenText) check(doc, pos, declared, t.writtenText, `${t.path}.text`, surface, t.glosses.map((x) => x.toLowerCase()));
      else if (!t.lines.length && t.de) check(doc, pos, declared, t.de, t.path, surface, t.glosses.map((x) => x.toLowerCase()));
    }
    if (stageOf(doc) === 'S') continue; // stage S: texts only; items and expected answers arrive with I (BLUEPRINT §9)
    for (const p of walkProduction(doc)) check(doc, pos, declared, p.de, p.path, 'production');
    if (doc.kind === 'unit') {
      const lines = arr(doc.data.check?.lines);
      lines.forEach((l, i) => check(doc, pos, declared, String(l?.de || ''), `check.lines[${i}]`, 'input'));
    }
  }

  // rule cards (level scope): the model sentence is a production line at the card's first use
  if (mode !== 'file') {
    for (const slot of levels) {
      const cards = arr(slot.ruleCards?.cards);
      if (!cards.length) continue;
      const firstUse = new Map();
      for (const doc of slot.units.values()) {
        for (const { step } of walkSteps(doc)) {
          if (!step?.ruleCard) continue;
          const p = positionOf(slot.level, doc.nr);
          if (!firstUse.has(step.ruleCard) || firstUse.get(step.ruleCard) > p) firstUse.set(step.ruleCard, p);
        }
      }
      cards.forEach((card, i) => {
        const intro = spine.get(card?.spine)?.point?.intro;
        const pos = firstUse.get(card?.id) ?? positionOf(parseUnitId(intro?.productive || intro?.receptive)?.level || slot.level, parseUnitId(intro?.productive || intro?.receptive)?.nr ?? 12);
        if (pos === null || !LEVELS.includes(slot.level)) return;
        const doc = { file: slot.ruleCards.file };
        const declared = new Set([card?.spine].filter(Boolean));
        check(doc, pos, declared, String(card?.modelSentence || ''), `cards[${i}].modelSentence`, 'production');
      });
    }
  }
  return { findings, notes };
}
