// Grammar-spine lookups (SCHEMA §4.2): where a point enters, and where a detector's construction
// becomes licensed. The spine is the only place a position is written.

import { unitPosition, describePosition } from './ids.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);

/** { rec, prod, chunk } course positions of a spine point (null where unset or unparsable). */
export function pointPositions(point) {
  const rec = unitPosition(point?.intro?.receptive);
  const prodRaw = unitPosition(point?.intro?.productive);
  return {
    rec,
    prod: prodRaw ?? rec,
    chunk: unitPosition(point?.chunkFrom),
  };
}

/**
 * For every detector: the spine points it detects and the positions from which its construction
 * is licensed. Mapping source per detector: the spine's own `points[].detectors` when the spine
 * names that detector; otherwise the detector's `spec.spinePoints` hint (points that exist).
 * Returns Map(detectorId → { points, rec, prod, chunk, source }) — detectors mapped to nothing
 * are absent.
 */
export function detectorPlacement(ctx) {
  const out = new Map();
  const spine = ctx.registries.spine?.byId;
  const dets = ctx.registries.detectors?.list || [];
  if (!spine) return out;
  const fromSpine = new Map();
  for (const [pid, { point }] of spine) {
    for (const d of arr(point.detectors)) {
      if (!fromSpine.has(d)) fromSpine.set(d, []);
      fromSpine.get(d).push(pid);
    }
  }
  for (const det of dets) {
    let points = fromSpine.get(det.id) || [];
    let source = 'spine';
    if (!points.length) {
      points = arr(det.spec?.spinePoints).filter((p) => spine.has(p));
      source = 'hint';
    }
    if (!points.length) continue;
    let rec = null;
    let prod = null;
    let chunk = null;
    for (const pid of points) {
      const pos = pointPositions(spine.get(pid).point);
      if (pos.rec !== null && (rec === null || pos.rec < rec)) rec = pos.rec;
      if (pos.prod !== null && (prod === null || pos.prod < prod)) prod = pos.prod;
      if (pos.chunk !== null && (chunk === null || pos.chunk < chunk)) chunk = pos.chunk;
    }
    if (rec === null && prod === null) continue;
    out.set(det.id, { points, rec: rec ?? prod, prod: prod ?? rec, chunk, source });
  }
  return out;
}

export { describePosition };

// ── forms a spine point introduces (GRM-04 exemption, orchestrator 2026-09-27) ────────────────
//
// A point can introduce a few FORMS of a construction whose detector belongs to a later point:
// g.praeteritum-kernverben („Präteritum häufiger Verben beim Erzählen: kam, sagte, es gab (…)",
// a2.2-u01) licenses kam/sagte/gab long before g.praeteritum (b1.1-u01) licenses the Präteritum of
// every full verb, and det.praeteritum-vollverb must not block them in between. The forms are the
// label's own list — after its colon, before any bracket — with the person endings of a finite form
// (kam → kamen, kamst; sagte → sagten). Function words (es, ich, der …) never exempt anything: they
// belong to too many constructions. The parenthesised model sentence is NOT a form list.

const FORM_ENDINGS = ['', 'st', 'n', 'en', 't', 'et', 'e'];

/** The forms a point's label lists: „…: kam, sagte, es gab (Als …)" → kam, sagte, gab (+ persons). */
export function introducedForms(point, functionWords = new Set()) {
  const label = String(point?.label || '');
  const colon = label.indexOf(':');
  if (colon < 0) return new Set();
  const list = label.slice(colon + 1).split('(')[0];
  const out = new Set();
  for (const m of list.matchAll(/\p{L}+/gu)) {
    const w = m[0].toLowerCase();
    if (w.length < 2 || functionWords.has(w) || /^\p{Lu}/u.test(m[0])) continue;
    for (const e of FORM_ENDINGS) out.add(`${w}${e}`);
  }
  return out;
}

/**
 * The forms licensed at `pos` by points OTHER than a detector's own: every point whose intro
 * (receptive for inputs and exam texts, productive for production) is at or before `pos`, plus the
 * points the unit declares. Returns a Set of lower-case forms.
 */
export function exemptForms(ctx, pos, surface, declared = new Set(), functionWords = new Set()) {
  const out = new Set();
  const spine = ctx.registries.spine?.byId;
  if (!spine) return out;
  for (const [pid, { point }] of spine) {
    const p = pointPositions(point);
    const at = surface === 'production' ? p.prod : p.rec;
    if (!declared.has(pid) && (at === null || at > pos)) continue;
    for (const f of introducedForms(point, functionWords)) out.add(f);
  }
  return out;
}
