// Engine language policy only. No curriculum, pool, tasks or production registration.
import { SEPARABLE_PREFIXES } from './constructions.js';

export const PRIMARY_ORDER_A21 = [
  'possessive-pronouns', 'separable-verbs', 'two-way-prepositions', 'adjective-endings-intro',
  'dative-case', 'modal-verbs-past', 'imperative-mood', 'perfect-tense-sein',
  'pronouns-accusative-dative', 'temporal-prepositions', 'prepositions-dative', 'perfect-tense-haben',
];
export const FUNCTION_WORDS_A21_ADDED = [
  'weil', 'dass', 'wenn', 'zwischen', 'über', 'gegenüber',
  'konnte', 'konntest', 'konnten', 'konntet', 'musste', 'musstest', 'mussten', 'musstet',
  'wollte', 'wolltest', 'wollten', 'wolltet', 'durfte', 'durftest', 'durften', 'durftet',
  'mochte', 'mochtest', 'mochten', 'mochtet', 'könnte', 'könntest', 'könnten', 'könntet',
  'sollte', 'solltest', 'sollten', 'solltet',
];
// Lexical exceptions, not exercise exceptions: the productive rules below handle every prefix.
export const IRREGULAR_FORMS_A21_ADDED = {
  sein: ['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'warst', 'waren', 'wart', 'gewesen'],
  haben: ['habe', 'hast', 'hat', 'haben', 'habt', 'hatte', 'hattest', 'hatten', 'hattet', 'gehabt'],
  können: ['kann', 'kannst', 'können', 'könnt', 'konnte', 'konntest', 'konnten', 'konntet', 'könnte', 'könntest', 'könnten', 'könntet'],
  müssen: ['muss', 'musst', 'müssen', 'müsst', 'musste', 'musstest', 'mussten', 'musstet'],
  wollen: ['will', 'willst', 'wollen', 'wollt', 'wollte', 'wolltest', 'wollten', 'wolltet'],
  dürfen: ['darf', 'darfst', 'dürfen', 'dürft', 'durfte', 'durftest', 'durften', 'durftet'],
  mögen: ['mag', 'magst', 'mögen', 'mögt', 'mochte', 'mochtest', 'mochten', 'mochtet'],
  sollen: ['soll', 'sollst', 'sollen', 'sollt', 'sollte', 'solltest', 'sollten', 'solltet'],
  gehen: ['gehe', 'gehst', 'geht', 'gehen', 'geh', 'gegangen'],
  kommen: ['komme', 'kommst', 'kommt', 'kommen', 'komm', 'gekommen'],
  bleiben: ['bleibe', 'bleibst', 'bleibt', 'bleiben', 'bleib', 'geblieben'],
  fallen: ['falle', 'fällst', 'fällt', 'fallen', 'fallt', 'gefallen'],
  stehen: ['stehe', 'stehst', 'steht', 'stehen', 'steh', 'gestanden'],
  treffen: ['treffe', 'triffst', 'trifft', 'treffen', 'trefft', 'triff', 'getroffen'],
  schlafen: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlaf', 'geschlafen'],
  steigen: ['steige', 'steigst', 'steigt', 'steigen', 'steig', 'gestiegen'],
  ziehen: ['ziehe', 'ziehst', 'zieht', 'ziehen', 'zieh', 'gezogen'],
  rufen: ['rufe', 'rufst', 'ruft', 'rufen', 'ruf', 'gerufen'],
  bringen: ['bringe', 'bringst', 'bringt', 'bringen', 'bring', 'gebracht'],
  denken: ['denke', 'denkst', 'denkt', 'denken', 'denk', 'gedacht'],
  wissen: ['weiß', 'weißt', 'wissen', 'wisst', 'gewusst'],
  finden: ['finde', 'findest', 'findet', 'finden', 'find', 'gefunden'],
  geben: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'gib', 'gegeben'],
  lesen: ['lese', 'liest', 'lesen', 'lest', 'lies', 'gelesen'],
  schreiben: ['schreibe', 'schreibst', 'schreibt', 'schreiben', 'schreib', 'geschrieben'],
  sitzen: ['sitze', 'sitzt', 'sitzen', 'sitz', 'gesessen'],
  liegen: ['liege', 'liegst', 'liegt', 'liegen', 'lieg', 'gelegen'],
  hängen: ['hänge', 'hängst', 'hängt', 'hängen', 'häng', 'gehangen', 'gehängt'],
  tun: ['tue', 'tust', 'tut', 'tun', 'tu', 'getan'],
  verstehen: ['verstehe', 'verstehst', 'versteht', 'verstehen', 'versteh', 'verstanden'],
  vergessen: ['vergesse', 'vergisst', 'vergessen', 'vergesst', 'vergiss'],
  bekommen: ['bekomme', 'bekommst', 'bekommt', 'bekommen', 'bekomm'],
  verlieren: ['verliere', 'verlierst', 'verliert', 'verlieren', 'verlier', 'verloren'],
  gefallen: ['gefalle', 'gefällst', 'gefällt', 'gefallen', 'gefallt'],
};

const tokens = (s) => String(s || '').match(/[A-Za-zÄÖÜäöüß]{2,}/g) || [];
const inseparable = /^(?:be|emp|ent|er|ge|miss|ver|zer)/;
const modal = /^(?:können|müssen|wollen|dürfen|mögen|sollen|möchten)$/;

function verbForms(inf, irregulars) {
  const stem = inf.endsWith('en') ? inf.slice(0, -2) : inf.slice(0, -1);
  const forms = new Set([inf, stem]);
  const endings = /[td]$|[^aeiouäöülr][mn]$/.test(stem) ? ['e', 'est', 'et', 'en']
    : /[sßzx]$/.test(stem) ? ['e', 't', 'en'] : ['e', 'st', 't', 'en'];
  for (const ending of endings) forms.add(stem + ending);
  if (inf.endsWith('eln')) forms.add(stem.slice(0, -2) + 'le');
  const exceptions = irregulars[inf];
  if (exceptions) {
    for (const form of exceptions) forms.add(form);
  }
  const prefix = [...SEPARABLE_PREFIXES].sort((a, b) => b.length - a.length).find((p) => inf.startsWith(p) && inf.length - p.length >= 4);
  if (prefix) {
      const base = inf.slice(prefix.length);
      forms.add(prefix);
      for (const form of verbForms(base, irregulars)) {
        forms.add(form);
        if (/^ge[a-zäöüß]+(?:t|en)$/.test(form)) forms.add(prefix + form);
      }
  } else if (!exceptions && !modal.test(inf)) {
      forms.add((inseparable.test(inf) || inf.endsWith('ieren') ? '' : 'ge') + stem + (/[td]$|[^aeiouäöülr][mn]$/.test(stem) ? 'et' : 't'));
  }
  return forms;
}

/** A2 lexical forms. Construction horizons decide WHEN a known form may be produced. */
export function formsOfA21(entry, irregulars) {
  const out = new Set([...tokens(entry.de), ...tokens(entry.word), ...tokens(entry.plural === '—' ? '' : entry.plural)].map((t) => t.toLowerCase()));
  const head = String(entry.word || entry.de || '').trim();
  if (entry.article) {
    for (const noun of tokens(entry.plural === '—' ? '' : entry.plural)) {
      if (/^[A-ZÄÖÜ]/.test(noun) && !/[ns]$/i.test(noun)) out.add(noun.toLowerCase() + 'n');
    }
    return out;
  }
  // The verbal head of a phrase is its final infinitive: „spazieren gehen“.
  const word = head.split(/\s+/).at(-1);
  if (!/^[a-zäöüß]+$/.test(word || '') || /\bsich\b/.test(head)) return out;
  if (/(?:en|ern|eln)$/.test(word) || /^(?:sein|tun)$/.test(word)) {
    for (const form of verbForms(word, irregulars)) out.add(form.toLowerCase());
  } else if (!head.includes(' ')) {
    const stem = word === 'hoch' ? 'hoh' : word === 'nah' ? 'nah'
      : /(?:el|er)$/.test(word) && word.length > 4 ? word.slice(0, -2) + word.slice(-1) : word;
    for (const ending of ['e', 'en', 'er', 'es', 'em']) out.add(stem + ending);
  }
  for (const form of irregulars[head] || []) out.add(form.toLowerCase());
  return out;
}

export const OFF_LIMITS_FORMS_A21 = {
  'possessive-pronouns': /\b(?:unsere?|unseren|unserem|unserer|euer|eure|euren|eurem|eurer)\b|\b[A-ZÄÖÜ][a-zäöüß]+s\s+[A-ZÄÖÜ][a-zäöüß]+/g,
  'separable-verbs': new RegExp(`\\b(?:${SEPARABLE_PREFIXES.join('|')})ge[a-zäöüß]{2,}(?:t|en)\\b`, 'gi'),
  'two-way-prepositions': /\b(?:stell|leg|häng|setz)\w*\b[^.!?]*\b(?:in|an|auf|vor|hinter|neben|über|unter|zwischen)\s+(?:die|das|den|eine|ein|einen)\b/gi,
  'dative-case': /\b(?:schenk|geb|gib|zeig|schick|gratulier)\w*\b[^.!?]*\b(?:dem|der|den|meinem|meiner|deinem|deiner|ihm|ihnen)\b/gi,
  'modal-verbs-past': /\b(?:(?:konn|muss|woll|durf|moch)te(?:st|n|t)?|dass)\b/gi,
  'imperative-mood': /\b(?:sollte|könnte)(?:st|n|t)?\b|\b[A-ZÄÖÜ][a-zäöüß]+\s+(?:doch|mal)\b/g,
  'perfect-tense-sein': /\bweil\b|\b(?:bin|bist|ist|sind|seid)\b[^.!?]*\b(?:[a-zäöüß]*ge(?:fallen|standen|schlafen|stiegen|flogen|laufen|schwommen|sprungen|zogen)|aufgewacht)\b/gi,
  'pronouns-accusative-dative': /\b(?:es|sie|ihn)\s+(?:mir|dir|ihm|ihr|uns|euch|ihnen)\b/gi,
  'temporal-prepositions': /\bin\s+(?:\d+|[a-zäöüß]+)\s+(?:Tagen|Wochen|Monaten|Jahren|Stunden|Minuten)\b|\bfür\s+(?:\d+|[a-zäöüß]+)\s+(?:Tage|Wochen|Monate|Jahre|Stunden|Minuten)\b|\büber\s+das\b|\bab\s+dem\b|\bzwischen\b|\bbis\b(?!\s+(?:bald|morgen|später)\b)/gi,
  'prepositions-dative': /\bgegenüber\b/gi,
  'perfect-tense-haben': /\bwenn\b/gi,
};

// Each family has positive and negative probes in a21-language.test.mjs. Lexical A1 comparisons
// and „Ich würde gern“ remain licensed; productive comparison and the KII paradigm do not.
export const NEVER_FORMS_A21 = [
  /\bsich\b|\b(?:freu|erinner|interessier|entspann|beeil|fühl|ärger|treff|triff|wasch|wäsch|setz|zieh)\w*\s+(?:mich|dich|uns|euch)\b/i,
  /\b(?!(?:lieber|besser|mehr|teurer|größer|billiger)\b)[a-zäöüß]+er\s+als\b|\bam\s+(?!(?:besten|liebsten|meisten)\b)[a-zäöüß]+sten\b/i,
  /\b(?:der|die|das|den|dem|ein\w*|mein\w*)\s+[a-zäöüß]+st(?:e|en|er|es)\s+[A-ZÄÖÜ]/,
  /\b(?:hätte|wäre|würde)(?:st|n|t)?\b/gi,
  /(?:^\s*|[.!?]\s*)(?:weil|dass|wenn)\b/i,
  new RegExp(`\\b(?:weil|dass|wenn)\\b[^,.!?;]*\\b(?:[a-zäöüß]+(?:en|ern|eln)\\s+(?:muss|musst|müssen|kann|kannst|können|will|wollen|soll|sollen|darf|dürfen)|(?:[a-zäöüß]*ge[a-zäöüß]+(?:t|en)|[a-zäöüß]+iert|(?:be|ver|er|ent|emp|zer|miss)[a-zäöüß]+(?:t|en))\\s+(?:hat|hast|haben|habt|bin|bist|ist|sind|seid)|(?:${SEPARABLE_PREFIXES.join('|')}|weh)[a-zäöüß]+(?:t|en|st|e))\\s*(?=[,.!?;]|$)`, 'i'),
  /\bob\b|,\s*(?:wer|was|wo|wann|warum|wie|wohin|woher|welche\w*)\b[^,.!?]*\b[a-zäöüß]+(?:t|en|st|e)\s*(?=[,.!?]|$)/i,
  /\b(?:da|wo)r?(?:auf|an|über|unter|in|mit|von|für|gegen|zu)\b|\b(?:wart\w*\s+auf|denk\w*\s+an|interessier\w*\s+für)\b/i,
  /\bzu\s+[a-zäöüß]+(?:en|ern|eln)\b|\b[a-zäöüß]+zu[a-zäöüß]+(?:en|ern|eln)\b/i,
  /\b(?:werde|wirst|wird|werden|werdet)\b[^.!?]*\b[a-zäöüß]+(?:en|ern|eln)\s*(?=[.!?]|$)/i,
  /\b(?:wird|werden|wurde|wurden)\b[^.!?]*\b(?:[a-zäöüß]*ge[a-zäöüß]+(?:t|en)|[a-zäöüß]+iert|(?:be|ver|er|ent)[a-zäöüß]+t)\b/i,
  /,\s*(?:der|die|das|denen|dem|den)\s+[^,.!?]*\b[a-zäöüß]+(?:t|en|st|e)\s*(?=[,.!?]|$)/,
  /\b(?:des|eines|meines|deines|seines|ihres|unseres|eures|dessen|deren)\b/i,
  /\b(?:ging|kam|sagte|machte|fuhr|sah|fand|nahm|blieb|stand|kaufte|arbeitete|spielte|schlief|lief|saß|dachte|wusste|hörte|las|half|regnete|lag|trank|aß|schrieb|sprach|begann|traf|rief|brachte)(?:st|n|t)?\b/i,
];
