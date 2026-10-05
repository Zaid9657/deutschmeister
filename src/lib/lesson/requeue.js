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
 * requeueFor(missedItems, pool, usedIds, { avoidIds, maxLektion }) → up to 4 items to replay.
 * `usedIds` are the items already seen this lesson (the controlled seven and
 * anything requeued before), so the learner never meets the same id twice.
 * `avoidIds` are items planned for OTHER Lektionen: avoided when the topic has
 * anything else left, used when it does not — a shorter requeue would be worse.
 *
 * `maxLektion` (the Lektion being played) keeps the replacement inside what has
 * been taught: an item stamped `minLektion` 5 uses words Lektion 5 introduces,
 * and the controlled seven never draw it before then (RULE 11b) — but the
 * requeue used to, by the back door, for 38 of the 94 same-topic items Lektionen
 * 1–3 could reach. When nothing taught is left in the topic the missed item
 * itself comes back, exactly as when the topic is exhausted.
 */
export function requeueFor(missedItems = [], pool = [], usedIds = [], { avoidIds, maxLektion = null } = {}) {
  const taught = (it) => !Number.isFinite(maxLektion) || !Number.isFinite(Number(it.minLektion)) || Number(it.minLektion) <= maxLektion;
  const items = poolItems(pool).filter(isUsableItem).filter(taught);
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

/**
 * prevStageIndex(stages, index, requeuedCount) → the stage "Back" opens from
 * stage `index`, or -1 when there is none (no Back button).
 *
 * The player's advance() skips the requeue stage when nothing was missed, so
 * Back skips it too. Plain `index - 1` from the recap opened a requeue stage
 * with nothing requeued: no item to show, a blank screen with no button.
 */
export function prevStageIndex(stages, index, requeuedCount = 0) {
  const list = Array.isArray(stages) ? stages : [];
  let target = (Number.isInteger(index) ? index : 0) - 1;
  const at = list[target];
  if (at && at.kind === 'requeue' && !(requeuedCount > 0)) target -= 1;
  return target >= 0 ? target : -1;
}

export default requeueFor;
