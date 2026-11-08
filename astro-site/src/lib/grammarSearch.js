// Literal text search: never a regular expression or injected HTML.
export const searchText = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function matchesGrammarTopic(text, level, query, selectedLevel = '') {
  const terms = searchText(query).split(/\s+/).filter(Boolean);
  return (!selectedLevel || level === selectedLevel) && terms.every((term) => searchText(text).includes(term));
}
