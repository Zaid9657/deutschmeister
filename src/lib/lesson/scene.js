/** Adapt only the learner's role; names stay in component memory, never analytics/snapshots. */
export function sayText(say, ownName) {
  const name = String(ownName || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!say.ownName) return say.de;
  if (!name) return null;
  if (say.ownName === 'full') return say.de.replace(/(Ich heiße ).*?(?=[.!?]|$)/u, (_, lead) => `${lead}${name}`);
  return `${Array.from(name.toLocaleUpperCase('de')).filter((c) => /\p{L}/u.test(c)).join('-')}.`;
}
