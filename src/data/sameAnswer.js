/**
 * WHOLE ANSWERS THAT ARE THE SAME ANSWER — the one equivalence rule the course's lesson checker
 * (src/lib/lesson/check.js) and the public grammar pages (astro-site/src/components/ExercisePlayer.jsx)
 * both grade by. A learner who writes „Wieso" where the task taught „Warum" has made no mistake
 * (DaF review #10, A1.2 B1): the words ask the same. It is a RULE, never a widened answer key — an
 * accepted form counts as item lexis and would stamp an item unservable — and while it lived in the
 * lesson checker alone, /grammar/a1.2/question-words/ marked „Wieso" wrong on „Frage: ___ bleibst du
 * zu Hause?" where the course took it (round-2 review, 2026-10-25).
 *
 * Canonical here; astro-site/src/data/sameAnswer.js is its byte-identical copy (scripts/shared-files.mjs,
 * written by `node scripts/sync-shared.mjs`, checked by `npm run check:duplicates`). Self-contained on
 * purpose: the copy has no src/utils to import from. A new group is one line here, and both surfaces
 * take it.
 */

/** The groups, folded the way every answer comparison folds (lower case, ä → ae, ß → ss). */
export const SAME_ANSWER = Object.freeze([
  Object.freeze(['warum', 'wieso', 'weshalb', 'weswegen', 'aus welchem grund']),
]);

/** The fold of src/utils/answerMatch.js `normalizeAnswer`: NFC, trimmed, lower case, single spaces, ä → ae, ß → ss. */
const fold = (text) => String(text ?? '')
  .normalize('NFC')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .replace(/ä/g, 'ae')
  .replace(/ö/g, 'oe')
  .replace(/ü/g, 'ue')
  .replace(/ß/g, 'ss');

/** True when `given` answers what `key` answers: both are whole answers of one group. */
export function sameAnswer(key, given) {
  const k = fold(key);
  const g = fold(given);
  return Boolean(k && g) && SAME_ANSWER.some((group) => group.includes(k) && group.includes(g));
}
