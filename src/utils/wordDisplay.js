/**
 * Shared guard for the "prepend article to German headword" bug.
 *
 * A handful of `words` rows carried the article baked into `german` itself
 * (e.g. german: "der Tag") on top of the already-correct `article` column
 * ("der") — see migrations/2026-09-05-a1-1-wortliste.sql. WordCard.jsx always
 * skipped re-prepending in that case; SrsTrainer.jsx used to prepend
 * unconditionally, so those rows rendered as "der der Tag" on both faces of
 * the flashcard. Both now share this one check.
 */
export function hasArticlePrefix(article, german) {
  if (!article || !german) return false;
  return german.toLowerCase().startsWith(article.toLowerCase());
}

/**
 * "article german", skipping the article when `german` already carries it
 * (see hasArticlePrefix). For callers that don't need to style the article
 * separately from the headword (e.g. the SRS flashcard front/back).
 */
export function displayGerman(article, german) {
  const word = german || '';
  if (!article || hasArticlePrefix(article, word)) return word;
  return `${article} ${word}`;
}
