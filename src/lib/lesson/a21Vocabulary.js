import { groupWords } from './wortfeldPacing.js';

/** A2-only presentation; the caller retains the established A1 path. */
export function a21VocabularyPresentation(words, lang = 'de') {
  const indexed = words.map((w, i) => ({ w, i }));
  const fresh = indexed.filter(({ w }) => !w.review);
  const review = indexed.filter(({ w }) => w.review);
  const newGroups = groupWords(fresh);
  const reviewGroups = groupWords(review);
  const labels = lang === 'en'
    ? { fresh: 'New vocabulary', review: 'Review vocabulary', example: 'Example' }
    : { fresh: 'Neue Wörter', review: 'Wiederholung', example: 'Beispiel' };
  return {
    title: lang === 'en'
      ? `${fresh.length} new words · ${review.length} to review`
      : `${fresh.length} neue Wörter · ${review.length} zur Wiederholung`,
    groups: [...newGroups, ...reviewGroups],
    groupLabels: [...newGroups.map(() => labels.fresh), ...reviewGroups.map(() => labels.review)],
    labels,
  };
}
