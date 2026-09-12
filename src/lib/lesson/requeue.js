// Stage 7 of the standard: "every miss returns as a DIFFERENT variant, cap 4".
// Same topic, different item — a second look at the same sentence only proves
// the learner can remember a string, so a different item of the same topic is
// what the evidence (and §3) asks for. Only when that topic's slice of the
// pool is exhausted do we fall back to the item itself.
import { poolItems } from './buildLesson.js';

export const REQUEUE_CAP = 4;

/**
 * requeueFor(missedItems, pool, usedIds) → up to 4 items to replay.
 * `usedIds` are the items already seen this lesson (the controlled seven and
 * anything requeued before), so the learner never meets the same id twice.
 */
export function requeueFor(missedItems = [], pool = [], usedIds = []) {
  const items = poolItems(pool);
  const used = new Set(usedIds);
  const out = [];

  for (const missed of missedItems) {
    if (out.length >= REQUEUE_CAP) break;
    if (!missed) continue;
    const alt = items.find(
      (it) => it.topic === missed.topic && it.id !== missed.id && !used.has(it.id),
    );
    const pick = alt || missed;
    if (out.some((o) => o.id === pick.id)) continue;
    used.add(pick.id);
    out.push(pick);
  }

  return out;
}

export default requeueFor;
