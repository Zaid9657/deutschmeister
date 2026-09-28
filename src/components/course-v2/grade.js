// Course v2 — the renderers' one grading call.
//
// Every v2 answer is decided by the player core's `checkItem` (src/lib/course-v2/checkItem.js,
// the shared contract's checker): the live src/lib/lesson/check.js with the item's own options
// (strict topic, caseSensitive, dictation, spelled-out words) plus SCHEMA §3.1 `exact`
// (numbers and names compared exactly, digit grouping folded). No screen builds check options
// of its own (the rule tests/course-player.test.mjs GRADING_SITES states for the legacy course).
//
// This adapter only adds what a screen needs on top: the retry `reason` — 'case' („achten Sie
// auf Groß- und Kleinschreibung"), 'number-only' / 'word-only' („Schreiben Sie nur die Zahl.")
// — and `notes` graded like a dictation (heard, so an unhearable separator never decides it).

import { checkItem, errorTagFor as libErrorTag, RESULT } from '../../lib/course-v2/checkItem.js';

export { RESULT };

/** The accepted forms of an item (`accepted`, else `answer`). */
export const acceptedOf = (item) => (item?.accepted && item.accepted.length ? item.accepted : [item?.answer]).filter((a) => a != null && a !== '');

const fold = (s) => String(s ?? '').replace(/[.,!?;:„“”"'«»]/g, '').replace(/\s+/g, ' ').trim();

/** Grade one answer → { result, expected, reason? } with result ∈ RESULT. */
export function gradeAnswer(item, answer) {
  const graded = item?.type === 'notes' && !item.exact ? { ...item, kind: 'dictation' } : item;
  const out = checkItem(graded, answer);
  const expected = out.expected || acceptedOf(item)[0] || '';
  // the checker names what a retry should point at ('case', 'number-only', 'word-only')
  if (out.result === RESULT.TYPO && out.reason) return { result: out.result, expected, reason: out.reason };
  if (out.result === RESULT.TYPO && fold(answer).toLowerCase() === fold(expected).toLowerCase()) {
    return { result: out.result, expected, reason: 'case' };
  }
  return { result: out.result, expected };
}

/** The error tag of a miss: the SCHEMA ErrorTag the item names, else check.js's tag. */
export const errorTagFor = (item, answer) => libErrorTag(item, answer, item?.answer) || null;

/** The onResult/onAttempt payload of the shared contract. */
export function attemptPayload({ item, stepId = null, correct, answer, typo = false, revealed = false }) {
  return {
    itemId: item?.id ?? null,
    stepId,
    correct: !!correct,
    answer: String(answer ?? ''),
    errorTag: correct ? null : errorTagFor(item, answer),
    typo: !!typo,
    ...(revealed ? { revealed: true } : {}),
  };
}
