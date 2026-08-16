/**
 * Forgiving answer comparison for typed German exercise answers.
 *
 * Normalizes case, outer/inner whitespace, and treats the ASCII spellings of
 * umlauts/ß as equivalent (ä↔ae, ö↔oe, ü↔ue, ß↔ss) so a learner typing
 * "waere" isn't marked wrong for "wäre". The DB's acceptable_answers column is
 * empty today (0/433 fill-blanks), so this normalization is what stands
 * between correct knowledge and a red X.
 *
 * Mirrored in the static site's exercise island
 * (astro-site/src/components/ExercisePlayer.jsx) — keep in sync.
 */
export function normalizeAnswer(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/** True when the user's typed answer matches any accepted answer. */
export function answerMatches(userInput, accepted) {
  const user = normalizeAnswer(userInput);
  if (!user) return false;
  const list = Array.isArray(accepted) ? accepted : [accepted];
  return list.some((a) => normalizeAnswer(a) === user);
}
