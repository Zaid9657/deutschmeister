// Drill selection for the Pronunciation Lab — plan Task 5
// (speaking-guided-city-map). Pure and framework-free so
// tests/pronunciation-lab.test.mjs can pin it without React.
//
// The one rule that matters: drills come FROM PROVIDER EVIDENCE ONLY. No
// acoustic evidence → no drills — an invented weakness would be a lie with a
// progress bar. The normalized pronunciation shape is feedbackModel.js's
// (provider-verified word/phoneme scores).

/**
 * selectDrills(pronunciation, phrase) → Drill[]
 *   * at most 3 items, the lowest-scoring words first;
 *   * each drill keeps the original reference phrase it was measured in;
 *   * null/absent/word-less evidence → [] — a drill is never fabricated.
 */
export function selectDrills(pronunciation, phrase = '') {
  if (!pronunciation || typeof pronunciation !== 'object' || Array.isArray(pronunciation)) return [];
  const words = Array.isArray(pronunciation.words) ? pronunciation.words : [];
  return words
    .filter((w) => w && typeof w.word === 'string' && w.word && Number.isFinite(w.accuracy))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((w) => ({
      word: w.word,
      accuracy: w.accuracy,
      weakestPhoneme: (Array.isArray(w.phonemes) ? w.phonemes : [])
        .filter((p) => p && Number.isFinite(p.accuracy))
        .reduce((min, p) => (min == null || p.accuracy < min.accuracy ? p : min), null),
      phrase: String(phrase || ''),
    }));
}

/** Word accuracy for `word` in a fresh provider result, or null (no guess). */
export function accuracyForWord(pronunciation, word) {
  const words = Array.isArray(pronunciation?.words) ? pronunciation.words : [];
  const hit = words.find((w) => w?.word?.toLowerCase() === String(word).toLowerCase());
  return hit && Number.isFinite(hit.accuracy) ? hit.accuracy : null;
}
