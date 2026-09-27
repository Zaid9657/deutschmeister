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
