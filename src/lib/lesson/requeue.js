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
//
// That rule is for POOL items. The exercises built from the Lektion itself
// (match, word order, listen & select — buildLesson.js derivedItems — and the
// dictation) come back as the SAME kind of exercise, because the pool has no
// variant of them: a vocabulary mismatch used to be "requeued" as a grammar
// item of the Lektion's primary topic, and a missed dictation as a practice
// card with no question on it. A writing task is never requeued — its feedback
// is the retry.
//
// And it is drawn under the practice draw's LEKTION BOUND (2026-10-25): an item
// a Lektion may not serve (`servableIn`) never reaches the learner through a
// retry either. The retry only filtered on quality and topic, so an L2 miss on
// „Ich ___ Studentin. (sein)" came back as „Ich ___ müde." — an item stamped for
// L11 — introducing a word the course had not taught exactly when the learner
// needed support (21 of 84 single-miss retries in A1.1, 25 of 84 in A1.2). The
// player passes the ids of those items with the ones already seen
// (`unservableIds`), so the miss comes back as itself when its topic has
// nothing else this Lektion may show.
import { poolItems } from './buildLesson.js';
import { isUsableItem } from '../../data/lessonPools/quality.js';

export const REQUEUE_CAP = 4;

/**
 * May Lektion `lektionNr` serve this pool item? The practice draw's rule
 * (buildLesson.js pickPracticeItems): `minLektion`, stamped by
 * scripts/build-lesson-pool.mjs, is the first Lektion that has taught every
 * word of the item — a stamped item is served at or after its stamp,
 * `minLektion: null` never, an unstamped item (a hand-built test pool) always.
 * tests/requeue-lektion.test.mjs holds both predicates to the same verdicts.
 */
export const servableIn = (item, lektionNr) =>
  !Object.prototype.hasOwnProperty.call(item, 'minLektion')
  || (Number.isInteger(item.minLektion) && (!Number.isInteger(lektionNr) || item.minLektion <= lektionNr));

/** The ids of the pool items Lektion `lektionNr` may not serve: a retry there skips them like seen ones. */
export const unservableIds = (pool, lektionNr) =>
  poolItems(pool).filter((it) => !servableIn(it, lektionNr)).map((it) => it.id);

const REPLAYED_TYPES = new Set(['match', 'word_order', 'listen_select', 'dictation']);
const MIN_RETRY_PAIRS = 3;

/**
 * The retry of an exercise the pool has no variant of: the same exercise under
 * a retry id. A match comes back as the pairs the learner confused, topped up
 * with other pairs of the same set so a choice is still a choice.
 */
function replayOf(missed) {
  const id = `${missed.id}~retry`;
  if (missed.type !== 'match') return { ...missed, id };
  const confused = (missed.confused || []).map((p) => p.de);
  const pairs = [
    ...missed.pairs.filter((p) => confused.includes(p.de)),
    ...missed.pairs.filter((p) => !confused.includes(p.de)),
  ].slice(0, Math.max(MIN_RETRY_PAIRS, confused.length));
  return { ...missed, id, pairs };
}

const isWriting = (it) => it.stage === 'writing' || String(it.id).startsWith('schreiben-');

/**
 * requeueFor(missedItems, pool, usedIds, { avoidIds, level }) → up to 4 items to replay.
 * `usedIds` are the ids the retry must not serve: the items already seen this
 * lesson (the controlled seven and anything requeued before), so the learner
 * never meets the same id twice, and — from the player — the items this Lektion
 * may not serve at all (`unservableIds`). Either way the missed item itself
 * comes back when its topic has nothing else left.
 * `avoidIds` are items planned for OTHER Lektionen: avoided when the topic has
 * anything else left, used when it does not — a shorter requeue would be worse.
 */
export function requeueFor(missedItems = [], pool = [], usedIds = [], { avoidIds, level } = {}) {
  // At the course's own level, like the practice draw (`pickPracticeItems`): without it every level
  // was filtered by A1.1's syllabus rules.
  const items = poolItems(pool).filter((it) => isUsableItem(it, { level }));
  const used = new Set(usedIds);
  const avoid = avoidIds instanceof Set ? avoidIds : new Set(avoidIds || []);
  const out = [];

  for (const missed of missedItems) {
    if (out.length >= REQUEUE_CAP) break;
    if (!missed || isWriting(missed)) continue;
    if (REPLAYED_TYPES.has(missed.type)) {
      const replay = replayOf(missed);
      if (!out.some((o) => o.id === replay.id)) out.push(replay);
      continue;
    }
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
