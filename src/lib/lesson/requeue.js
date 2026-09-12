// Stage 7 of the standard: "every miss returns as a DIFFERENT variant, cap 4".
// Same topic, different item — a second look at the same sentence only proves
// the learner can remember a string, so a different item of the same topic is
// what the evidence (and §3) asks for. Only when that topic's slice of the
// pool is exhausted do we fall back to the item itself.
//
// The replacement is drawn under the SAME rules as the controlled seven: an
// item the quality filter rejects (English respelling, English answer, a
// `kein` with no negation cue — src/data/lessonPools/quality.js) must not
// reach a learner through the back door of a retry, and an item another
// Lektion has already used is avoided while an unused one exists.
import { poolItems } from './buildLesson.js';
import { isUsableItem } from '../../data/lessonPools/quality.js';

export const REQUEUE_CAP = 4;

/**
 * requeueFor(missedItems, pool, usedIds, { avoidIds }) → up to 4 items to replay.
 * `usedIds` are the items already seen this lesson (the controlled seven and
 * anything requeued before), so the learner never meets the same id twice.
 * `avoidIds` are items planned for OTHER Lektionen: avoided when the topic has
 * anything else left, used when it does not — a shorter requeue would be worse.
 */
export function requeueFor(missedItems = [], pool = [], usedIds = [], { avoidIds } = {}) {
  const items = poolItems(pool).filter(isUsableItem);
  const used = new Set(usedIds);
  const avoid = avoidIds instanceof Set ? avoidIds : new Set(avoidIds || []);
  const out = [];

  for (const missed of missedItems) {
    if (out.length >= REQUEUE_CAP) break;
    if (!missed) continue;
    const sameTopic = items.filter(
      (it) => it.topic === missed.topic && it.id !== missed.id && !used.has(it.id),
    );
    const alt = sameTopic.find((it) => !avoid.has(it.id)) || sameTopic[0];
    const pick = alt || missed;
    if (out.some((o) => o.id === pick.id)) continue;
    used.add(pick.id);
    out.push(pick);
  }

  return out;
}

export default requeueFor;
