// A pool item's hint is German, as the pool stores it. English chrome shows its English rendering, so a
// beginner is not given a tip they cannot read (browser walk of 2026-11-25: „DER NAME, NICHT DER LAUT." above
// an English checkpoint task). Language-neutral hints (a number word and its figure, „Lektion 2") pass through.
// tests/course-pages-ui.test.mjs reads every hint of both live pools against this table.
const HINT_EN = {
  'Der Name, nicht der Laut.': 'The name, not the sound.',
  'der, die oder das?': 'der, die or das?',
  'Achten Sie auf die Reihenfolge der Buchstaben.': 'Watch the order of the letters.',
  'Achten Sie auf Doppelbuchstaben.': 'Watch for double letters.',
  'halb + nächste Stunde': 'halb + the next hour',
};

/** The hint in the chrome language; German stays as stored. */
export function hintText(hint, lang) {
  if (!hint || lang === 'de') return hint || null;
  const letters = /^(\d+) Buchstaben\.$/.exec(hint);
  if (letters) return `${letters[1]} letters.`;
  return HINT_EN[hint] || hint;
}
