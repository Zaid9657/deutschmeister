// The B1.1 ban battery (docs/course-factory/wave7/level-b1.1.md) as regexes over a German string.
// Shared by tests/b1-1-typed-production.test.mjs (every German field of every B1.1 grammar row in
// the cache) and, later, the B1.1 Abschlusstest suite. Derived from tests/helpers/a2Bans.mjs: the A2
// rules for Genitiv, relative clauses, the polite Konjunktiv II set, um/ohne … zu, the B1
// subordinators, bis/seit and irreale Bedingungssätze are DROPPED (B1.1 owns them); Passiv and
// Plusquamperfekt stay (the latter exempting a nachdem/bevor sentence); the B1/B2 border adds
// Konjunktiv I, Konjunktiv II der Vergangenheit, je … desto, Futur II and Partizipialattribute.
// The battery is a floor, not a proof (Wave 6 lesson): Nominalisierung, Passivalternativen and the
// Präteritum ruling (no exercise KEY may be a past-tense form) are reviewer eye-rules.
export const B1_GRAMMAR_BANS = [
  [/\b(wird|werden|wurde|wurden|worden)\b[^.?!]{0,40}\bge\p{Ll}+(t|en)\b(?![^.?!]{0,3}\b(haben|hat|hatte|sein|ist|war)\b)/u, 'Passiv (werden + Partizip II) — B1.2'],
  [/\b(wird|werden|wurde|wurden)\s+(?:ge\p{Ll}+(t|en)|\p{Ll}+iert)\b/u, 'Passiv (werden directly before a Partizip II) — B1.2'],
  [/^(?![^.?!]*\b(nachdem|bevor|sobald)\b)[^.?!]*\b(hatte|hatten|war|waren)\s+[^.?!;]{0,30}\b(?!geht|gehen|gegen|gern|gerne|genau|gesund|gestern|gelb|gerade|geben|genug)ge\p{Ll}{2,}(t|en)\b/mu, 'Plusquamperfekt outside a nachdem-clause'],
  [/\b(er|sie|es|man)\s+(sei|habe|werde|könne|müsse|wolle|solle|dürfe|wisse)\b/, 'Konjunktiv I / indirekte Rede — B2'],
  [/\b(hätte|hätten|hättest|wäre|wären|wärst)\b[^.?!]{0,40}\bge\p{Ll}+(t|en)\b/u, 'Konjunktiv II der Vergangenheit — B2'],
  [/\b(hätte|hätten|wäre|wären)\b[^.?!]{0,40}\b\p{Ll}+en\s+(können|müssen|sollen|wollen|dürfen)\b/u, 'Konjunktiv II der Vergangenheit mit Modalverb — B2'],
  [/\bje\b[^.?!]{0,40}\b(desto|umso)\b/i, 'je … desto / je … umso — B2'],
  [/\b(werde|wirst|wird|werden|werdet)\b[^.?!]{0,40}\bge\p{Ll}+(t|en)\s+(haben|sein)\b/u, 'Futur II — B2'],
  [/\b(der|die|das|den|dem|des|eine?[nmrs]?)\s+(?:von|vom|durch|für|mit)\s+[^.?!]{0,30}\b\p{Ll}+(?:end|iert|ge\p{Ll}+t)e[nmrs]?\s+\p{Lu}/u, 'Partizipialattribut (erweitertes Partizip) — B2'],
  [/\b(allerdings|jedoch|hingegen|folglich|infolgedessen|dennoch|indem|obgleich|obschon|wenngleich|solange)\b/i, 'B2 connector'],
  [/\bohne\s+dass\b/i, 'ohne dass — B2'],
  [/\b(lässt|lasst|lässt)\s+sich\s+\p{Ll}+en\b/u, 'Passivalternative (lässt sich + Infinitiv) — B2'],
  [/\b(ist|sind|war|waren)\s+(?:nicht\s+|leicht\s+|schwer\s+)?zu\s+\p{Ll}+en\b/u, 'Passivalternative (sein + zu + Infinitiv) — B2'],
];

/** Returns [{ban, match}] for every ban that fires on the string. */
export function bannedIn(s) {
  const hits = [];
  for (const [re, label] of B1_GRAMMAR_BANS) {
    const m = String(s).match(re);
    if (m) hits.push({ ban: label, match: m[0] });
  }
  return hits;
}

/** Walk a value and yield every German-bearing string (keys ending in _en are skipped). */
export function* germanStrings(value, path = '') {
  if (typeof value === 'string') { yield { path, s: value }; return; }
  if (Array.isArray(value)) { for (let i = 0; i < value.length; i++) yield* germanStrings(value[i], `${path}[${i}]`); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/_en$/.test(k) || k === 'sentence_en' || k === 'question_en' || k === 'title_en') continue;
      yield* germanStrings(v, path ? `${path}.${k}` : k);
    }
  }
}
