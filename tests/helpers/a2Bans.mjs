// The A2.2 ban battery (docs/course-factory/wave5/level-a2.2.md) as regexes over a German string.
// Shared by tests/a2-2-abschlusstest.test.mjs (authored exam strings) and
// tests/a2-2-legacy-recut.test.mjs (every German field of every A2.2 grammar row in the cache).
// Heuristics, deliberately narrow: war/hatte/modals stay allowed; werden + bare infinitive (Futur I)
// stays allowed; weil/dass/wenn/ob are the allowed subordinators and are absent from the list.
export const A2_GRAMMAR_BANS = [
  [/\b(des|eines)\s+\p{Lu}/u, 'Genitiv (des/eines + noun) — use von + Dativ'],
  [/\b(des|eines|deines|meines|seines|ihres|unseres|eures|dessen|deren)\b/, 'Genitiv determiner — use von + Dativ'],
  [/\b(Prozent|Hälfte|Anfang|Ende|Beginn|Teil|Teile|Rest)\s+(der|des)\b/, 'partitive Genitiv — use von + Dativ'],
  [/\p{Lu}[\p{L}-]*(?:kurs|test|jahr|tag)es\b/u, '-es Genitiv of a masculine/neuter noun'],
  [/\b(ging|kam|sagte|machte|fuhr|sah|fand|nahm|blieb|stand|kaufte|arbeitete|spielte|schlief|lief|saß|dachte|wusste|hörte|las|half|regnete|lag|trank|aß|schrieb|sprach|begann|traf|rief|brachte|wurde)\b/, 'Präteritum of a full verb'],
  [/\b(hatte|hatten|war|waren)\s+[^.?!;]{0,30}\b(?!geht|gehen|gegen|gern|gerne|genau|gesund|gestern|gelb|gerade|geben)ge\p{Ll}{2,}(t|en)\b/u, 'Plusquamperfekt'],
  [/\b(wird|werden|wurde|wurden)\b[^.?!]{0,40}\bge\p{Ll}+(t|en)\b/u, 'Passiv (werden + Partizip II)'],
  [/,\s*(der|die|das|denen|dem|den)\s+(?![^,.?!]*zu\p{Ll}*\b)[^,.?!]{0,40}\b\p{Ll}+(t|en|st|e)[.?!,]/u, 'relative clause'],
  [/\bum\s+[^.?!]{0,60}\szu\s+\p{Ll}+en\b/u, 'um ... zu'],
  [/\bohne\s+[^.?!]{0,60}\szu\s+\p{Ll}+en\b/u, 'ohne ... zu'],
  [/\b(obwohl|damit|bevor|nachdem|während|falls|sodass|seitdem)\b/i, 'B1 subordinating conjunction'],
  [/(?<!\p{L}er|mehr|lieber|weniger)(^|[.!?]\s+|,\s*)als\s+(ich|du|er|sie|es|wir|ihr|man|die|der|das)\b/iu, 'als as a temporal conjunction (after a Komparativ it is allowed)'],
  [/\b(bis|seit)\s+(ich|du|er|sie|es|wir|ihr|man|die|der|das|dem|den|ein|eine|einen|meine?|deine?|seine?|ihre?)\s+\S+(?:\s+\S+)*\s+\p{Ll}+(?:t|en|e|st)\s*[,.;:!?]/iu, 'bis/seit as a conjunction'],
  [/\b(müsste|müssten|sollte|sollten|dürfte|dürften|wüsste|wüssten)\b/, 'Konjunktiv II beyond the allowed chunks'],
  [/\bwenn\b[^.?!]{0,60}\b(wäre|hätte|würde)\b/i, 'irrealer Bedingungssatz (wenn ... wäre/hätte/würde)'],
];

/** Returns [{ban, match}] for every ban that fires on the string. */
export function bannedIn(s) {
  const hits = [];
  for (const [re, label] of A2_GRAMMAR_BANS) {
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
