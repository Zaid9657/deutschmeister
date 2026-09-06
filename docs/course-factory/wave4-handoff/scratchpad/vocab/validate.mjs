// Wave 4 PR B — A2.1 Wortliste validator.
// Mirrors S/wave3/vocab/validate.mjs (shape + duplicate + sentence checks) and adds the
// A2.1 banned-grammar list from S/wave4/level-a2.1.md.
//
//   node validate.mjs        (exit 1 on any ERROR)
import fs from 'fs';

const here = (p) => new URL(p, import.meta.url);
const additions = JSON.parse(fs.readFileSync(here('./words-a2.1-additions.json')));
const fixes = JSON.parse(fs.readFileSync(here('./words-a2.1-fixes.json')));
const live = JSON.parse(fs.readFileSync(here('../source/words-a2.1.json')));
const index = JSON.parse(fs.readFileSync(here('../source/all-words-index.json')));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const stripArticle = (s) => (s || '').replace(/^(der|die|das)\s+/i, '');
const words = (s) => s.trim().split(/\s+/);

// ---------------------------------------------------------------- level constraint
// Everything below is BANNED at A2.1 (level-a2.1.md) in learner-facing German.
const BANNED = [
  [/\b(weil|dass|wenn|ob|obwohl|damit|nachdem|bevor|während|sobald)\b/i,
    'Nebensatz conjunction (A2.2 or later)'],
  [/\b(des|eines|meines|deines|seines|ihres|unseres|dessen|deren)\b/i, 'Genitiv'],
  // a Genitiv attribute needs a head noun in front of it — bare "der Bus" is a nominative
  [/[A-ZÄÖÜ][a-zäöüß]+\s+(?:des|der)\s+[A-ZÄÖÜ][a-zäöüß]+(?:s|es)\b/, 'Genitiv'],
  [/\bum\s+.*\bzu\s+[a-zäöüß]+en\b/i, 'um … zu infinitive clause'],
  [/\bzu\s+[a-zäöüß]+en\b/i, 'infinitive clause with zu'],
  [/\b(werde|wirst|wird|werden|werdet)\b\s+.*\b[a-zäöüß]+en\b/i, 'Futur I / werden + Infinitiv'],
  [/\b(werde|wirst|wird|werden|werdet)\b/i, 'werden (Futur or full verb) — not A2.1'],
  [/[a-zäöüß]+er\s+als\b/i, 'Komparativ with als'],
  [/\bam\s+[a-zäöüß]+sten\b/, 'Superlativ'],
  [/\b(liebste|liebstes|liebsten|beste|bestes|besten|größte|größten|kleinste|kleinsten|meisten)\b/i,
    'Superlativ'],
  [/\bwürde|würdest|würden|würdet|hätte|hättest|hätten|wäre|wären|könnte|könnten|müsste|dürfte\b/i,
    'Konjunktiv II (only the möchte / könnten Sie / würden Sie chunks are allowed)'],
  // Präteritum of full verbs (war/hatte and the six modals are allowed).
  [/\b(ging|gingen|kam|kamen|gab|gaben|sah|sahen|las|lasen|nahm|nahmen|stand|standen|fand|fanden|blieb|blieben|hieß|half|sprach|trank|aß|schrieb|lief|liefen|fuhr|fuhren|flog|saß|saßen|wusste|dachte|brachte|sagte|machte|kaufte|spielte|arbeitete|wohnte|lernte|fragte|wartete|dauerte|kostete|zeigte|hörte|holte|legte|stellte|setzte|öffnete|gehörte|gefiel|schmeckte)\b/i,
    'Präteritum of a full verb (B1)'],
];
// Reflexive pronoun used as a reflexive (banned in production; "Ich freue mich!" is the one chunk).
// "sich" is always the reflexive marker; mich/dich/uns/euch only count as reflexive next to one
// of the verbs whose reflexive use is the A2.2 topic (they are plain accusative objects otherwise).
const REFL_STEMS = /\b(zieh|anzieh|ausruh|ruh|beeil|kämm|rasier|schmink|wasch|bewerb|freu(?=e\b|st\b|t\b|en\b)|entspann|setz|fühl|erhol|interessier|unterhalt|verabred|verspät|ärger|umzieh)/i;
const REFLEXIVE = (s) => /\bsich\b/i.test(s) || (/\b(mich|dich|uns|euch)\b/i.test(s) && REFL_STEMS.test(s));

// Strong / null-article adjective endings (topic 9 covers der- and ein-words only).
// "viele/zwei/drei… + adj + Noun" and bare "adj + Noun" in an aus/mit/für phrase.
// A determiner (article, possessive, dieser/jeder, quantifier) in that slot is NOT an adjective —
// those are the declensions topic 9 does teach, so they must not be flagged.
const DET = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|kein\w*|mein\w*|dein\w*|sein\w*|ihr\w*|unser\w*|euer|eure\w*|dies\w*|jed\w*|welch\w*|viel\w*|wenig\w*|einig\w*|all\w*|beid\w*|manch\w*|solch\w*|im|am|zum|zur|vom|beim|ins|ans|aufs|fürs|übers|unters|durchs|ums)$/i;
const NULL_ART_ADJ = [
  /\b(viele|wenige|einige|mehrere|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|hundert)\s+([a-zäöüß]+(?:e|en|er|es))\s+[A-ZÄÖÜ]/,
  /\b(?:aus|mit|bei|von|nach|seit|zu)\s+([a-zäöüß]+(?:em|er))\s+[A-ZÄÖÜ]/,
  /\b(?:ist|sind|war|waren)\s+([a-zäöüß]+(?:er|es|e))\s+[A-ZÄÖÜ][a-zäöüß]+\b/,
];
const FROZEN = /guten (Appetit|Morgen|Tag|Abend)|schönes Wochenende|liebe Grüße|viele Grüße|herzlichen Glückwunsch|gute Besserung/i;

// Precise sweep for the same class: a KNOWN adjective, inflected, in front of a capitalised noun
// with no determiner in front of it ("trage ich sportliche Schuhe" -> strong declension, banned).
const ADJ_STEMS = ['gut', 'neu', 'alt', 'klein', 'groß', 'schön', 'jung', 'lang', 'kurz', 'schnell',
  'langsam', 'billig', 'teuer', 'teur', 'warm', 'kalt', 'kühl', 'heiß', 'stark', 'schwach', 'hell',
  'dunkel', 'dunkl', 'sauber', 'schmutzig', 'leer', 'voll', 'ruhig', 'laut', 'nett', 'freundlich',
  'wichtig', 'richtig', 'falsch', 'einfach', 'schwer', 'leicht', 'bunt', 'weiß', 'schwarz', 'rot',
  'blau', 'grün', 'gelb', 'braun', 'grau', 'aktiv', 'modern', 'modisch', 'sportlich', 'elegant',
  'hübsch', 'bequem', 'gemütlich', 'lustig', 'fröhlich', 'herzlich', 'vegetarisch', 'digital',
  'international', 'erholsam', 'gültig', 'nötig', 'persönlich', 'verschieden', 'toll', 'dicht',
  'weich', 'hart', 'frei', 'fertig', 'krank', 'gesund', 'ungesund', 'müde', 'eng', 'weit', 'breit',
  'tief', 'hoch', 'hoh', 'niedrig', 'blond', 'schlank', 'verletzt', 'schwanger', 'geschieden'];
const ADJ_BEFORE_NOUN = new RegExp(
  `(^|[\\s,])([a-zäöüß]*(?:${ADJ_STEMS.join('|')})(?:e|er|es|en|em))\\s+[A-ZÄÖÜ][a-zäöüß]+`, '');
const PREP = /^(auf|an|in|aus|mit|bei|von|nach|seit|zu|über|unter|vor|hinter|neben|zwischen|für|ohne|gegen|um|durch|bis|ab|am|im|zum|zur|vom|beim|ins|ans|gegenüber|entlang)$/i;
function genitivAttribute(sentence) {
  const re = /([A-ZÄÖÜ][a-zäöüß]+)\s+(?:der|des)\s+([A-ZÄÖÜ][a-zäöüß]+)/g;
  for (const m of sentence.matchAll(re)) {
    if (!PREP.test(m[1])) return `${m[1]} der/des ${m[2]}`;
  }
  return null;
}

function strongAdjective(sentence) {
  const all = new RegExp(ADJ_BEFORE_NOUN.source, 'g');
  for (const m of sentence.matchAll(all)) {
    const before = sentence.slice(0, m.index + m[1].length).trim().split(/\s+/).pop() || '';
    if (!DET.test(before)) return m[2];
  }
  return null;
}

// level-a2.1.md allows these verbatim: the two fixed Superlativ adverbs and the two polite
// Konjunktiv II chunks. They are blanked before the BANNED sweep so the rules below stay strict.
const ALLOWED_CHUNKS = /\bam (liebsten|meisten)\b|\b(könnten|würden) Sie\b|\bmöchte\w*\b/gi;

function checkGerman(label, sentence, opts = {}) {
  if (!sentence || !sentence.trim()) { err(`${label}: empty German string`); return; }
  const n = words(sentence).length;
  if (n > 12) err(`${label}: example_sentence has ${n} words (max 12): "${sentence}"`);
  if (/[şıçğăâîȘİ]/.test(sentence)) err(`${label}: non-German-keyboard character: "${sentence}"`);
  if (/\b(the|and|is|you|my|with)\b/.test(sentence)) err(`${label}: English inside German: "${sentence}"`);
  const scrubbed = sentence.replace(ALLOWED_CHUNKS, '~');
  for (const [re, why] of BANNED) {
    if (re.test(scrubbed)) err(`${label}: BANNED at A2.1 (${why}): "${sentence}"`);
  }
  // Wortliste exception (level-a2.1.md, ruling 2026-09-06): a reflexive verb may stand as a
  // RECEPTIVE headword with an example sentence showing the chunk — but nowhere else.
  if (REFLEXIVE(sentence) && !opts.reflexiveHeadword) {
    warn(`${label}: possible reflexive verb in production: "${sentence}"`);
  }
  if (!FROZEN.test(sentence)) {
    for (const re of NULL_ART_ADJ) {
      const m = sentence.match(re);
      if (m && !DET.test(m[1])) warn(`${label}: possible null-article adjective ending ("${m[1]}"): "${sentence}"`);
    }
    const strong = strongAdjective(sentence);
    if (strong) err(`${label}: BANNED at A2.1 (strong/null-article adjective ending "${strong}"): "${sentence}"`);
  }
  const gen = genitivAttribute(sentence);
  if (gen) err(`${label}: BANNED at A2.1 (Genitiv attribute "${gen}"): "${sentence}"`);
  if (!/[.?!]$/.test(sentence.trim())) err(`${label}: sentence has no final punctuation: "${sentence}"`);
}

const SEP_PREFIX = /^(ab|an|auf|aus|ein|mit|nach|vor|zu|zurück|weg|los|her|hin|um|über|unter|fest|frei|statt)/;
const fold = (s) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
const PARTICLE = /^(sich|nicht|ins|zu|zum|zur|ein)$/i;
function containsHeadword(headword, sentence) {
  // multiword headwords ("sich anziehen", "ins Bett gehen", "können (Erlaubnis)"): any content
  // word counts; separable verbs are checked as prefix + stem as well.
  const parts = stripArticle(headword).replace(/\(.*?\)/g, '').trim().split(/\s+/)
    .filter((w) => w && !PARTICLE.test(w));
  const low = fold(sentence);
  const candidates = [];
  for (const p of parts.length ? parts : [stripArticle(headword)]) {
    candidates.push(p);
    const m = p.match(SEP_PREFIX);
    if (m && p.length > m[0].length + 3) candidates.push(p.slice(m[0].length), m[0]);
  }
  return candidates.some((c) => {
    const stem = c.length > 4 ? c.slice(0, Math.ceil(c.length * 0.6)) : c;
    return low.includes(fold(stem));
  });
}

// ---------------------------------------------------------------- ADDITIONS
const REQUIRED = ['german', 'english', 'article', 'plural', 'category', 'example_sentence', 'level'];
const NEW_CATEGORIES = new Set(['Health & Body', 'Home & Moving', 'Offices & Forms',
  'Travel & Holidays', 'Clothing & Appearance', 'Family & Relationships',
  'Media & Communication', 'Celebrations & Invitations']);
const liveCategories = new Set(live.map((r) => r.category));

// every headword at every level, article stripped
const indexBare = new Set();
for (const lvl of Object.keys(index)) {
  for (const w of index[lvl]) indexBare.add(stripArticle(w).toLowerCase());
}

const seenGerman = new Set();
const perCategory = {};
let nouns = 0, verbs = 0, other = 0;

for (const a of additions) {
  const label = `addition "${a.german}"`;
  for (const k of REQUIRED) if (!(k in a)) err(`${label}: missing key ${k}`);
  if (a.level !== 'a2.1') err(`${label}: level is "${a.level}", expected a2.1`);
  if (!NEW_CATEGORIES.has(a.category)) err(`${label}: category "${a.category}" is not one of the 8 new ones`);
  if (liveCategories.has(a.category)) err(`${label}: category "${a.category}" already exists live at a2.1`);
  perCategory[a.category] = (perCategory[a.category] || 0) + 1;

  if (seenGerman.has(a.german.toLowerCase())) err(`${label}: duplicate headword inside additions`);
  seenGerman.add(a.german.toLowerCase());
  if (indexBare.has(a.german.toLowerCase())) err(`${label}: headword already exists at some level in all-words-index.json`);

  if (/^(der|die|das)\s/i.test(a.german)) err(`${label}: german carries the article`);
  if (a.plural === 'null') err(`${label}: plural is the literal string "null"`);
  if (a.plural && /^(der|die|das)\s/i.test(a.plural)) err(`${label}: plural carries the article`);
  if (a.article && !['der', 'die', 'das'].includes(a.article)) err(`${label}: bad article "${a.article}"`);
  if (a.article && !/^[A-ZÄÖÜ]/.test(a.german)) err(`${label}: has an article but is not capitalised`);
  if (!a.article && /^[A-ZÄÖÜ]/.test(a.german)
      && !/\(Pl\.\)|\(usually without article\)/.test(a.english)) {
    err(`${label}: capitalised noun without an article and not marked "(Pl.)" / "(usually without article)"`);
  }
  if (a.article && a.plural === null && !/\b(Pl\.|uncountable)\b/.test(a.english)) {
    // singularia tantum are legitimate; just make them visible to the reviewer
    warn(`${label}: noun stored with plural null (singulare tantum?)`);
  }
  if (!a.english || !a.english.trim()) err(`${label}: empty english`);
  if (/[äöüß]/.test(a.english.replace(/\(.*?\)/g, ''))) warn(`${label}: german text in the english gloss`);

  checkGerman(label, a.example_sentence);
  if (!containsHeadword(a.german, a.example_sentence)) {
    err(`${label}: example_sentence does not contain the headword: "${a.example_sentence}"`);
  }

  if (a.article || /\(Pl\.\)|\(usually without article\)/.test(a.english)) nouns++;
  else if (/^to /.test(a.english)) verbs++;
  else other++;
}

// ---------------------------------------------------------------- FIXES
const byId = new Map(live.map((r) => [r.id, r]));
const seenIdField = new Set();
const FIELDS = new Set(['german', 'english', 'article', 'plural', 'category', 'example_sentence']);

for (const f of fixes) {
  const label = `fix ${f.id}/${f.field}`;
  const row = byId.get(f.id);
  if (!row) { err(`${label}: id not present in the live A2.1 source`); continue; }
  if (!FIELDS.has(f.field)) err(`${label}: unknown field`);
  if (f.field === 'category') err(`${label}: the brief forbids re-categorising rows`);
  const key = `${f.id}|${f.field}`;
  if (seenIdField.has(key)) err(`${label}: duplicate (id, field)`);
  seenIdField.add(key);
  if (row[f.field] !== f.old) {
    err(`${label}: old is not byte-exact — old=${JSON.stringify(f.old)} live=${JSON.stringify(row[f.field])}`);
  }
  if (f.old === f.new) err(`${label}: new equals old (no-op fix)`);
  if (!f.reason || f.reason.length < 20) err(`${label}: reason missing or too short`);

  if (f.field === 'german') {
    if (/^(der|die|das)\s/i.test(f.new)) err(`${label}: new german still carries the article`);
    if (stripArticle(f.old) !== f.new) err(`${label}: new german is not the bare form of old`);
  }
  if (f.field === 'plural' && f.new !== null) {
    if (/^(der|die|das)\s/i.test(f.new)) err(`${label}: new plural carries the article`);
    if (f.new === 'null') err(`${label}: new plural is the literal string "null"`);
  }
  if (f.field === 'example_sentence') {
    checkGerman(label, f.new);
    if (!containsHeadword(row.german, f.new)) {
      err(`${label}: new example_sentence does not contain the headword "${row.german}"`);
    }
  }
  if (f.field === 'english' && /^the\s/i.test(f.new)) err(`${label}: new english still starts with "the"`);
}

// ---------------------------------------------------------------- post-fix uniqueness
// public.words is UNIQUE (german, level, category): applying the fixes must not collide,
// and no addition may collide with a post-fix live row.
const patched = live.map((r) => ({ ...r }));
const pById = new Map(patched.map((r) => [r.id, r]));
for (const f of fixes) if (pById.has(f.id)) pById.get(f.id)[f.field] = f.new;
// BLOCKING-2 (round-1 review): the brief says "audit all 248 rows", so the validator has to
// gate all 248 POST-FIX sentences — not only the 175 additions and the rewritten ones. This is
// what surfaced das Picknick ("Bei gutem Wetter …") and "Könnte ich bitte die Rechnung haben?".
let reflexiveRows = 0;
for (const r of patched) {
  const label = `live row "${r.german}" (${r.category})`;
  const reflexiveHeadword = /(^|\s)sich(\s|$)/i.test(r.german);
  if (reflexiveHeadword) reflexiveRows++;
  checkGerman(label, r.example_sentence, { reflexiveHeadword });
  // a warning, not an error: these rows are pre-existing and the stem test cannot see a vowel
  // change (dürfen → darf, messen → misst). Every hit is listed so the reviewer can eyeball it.
  if (!containsHeadword(r.german, r.example_sentence)) {
    warn(`${label}: example_sentence may not contain the headword: "${r.example_sentence}"`);
  }
}
console.log(`gated ${patched.length} post-fix live rows + ${additions.length} additions ` +
  `(${reflexiveRows} reflexive headwords kept under the level file's Wortliste exception)`);

const keys = new Set();
for (const r of patched) {
  const k = `${r.german}|${r.category}`;
  if (keys.has(k)) err(`post-fix UNIQUE(german, level, category) collision: ${k}`);
  keys.add(k);
}
for (const a of additions) {
  const k = `${a.german}|${a.category}`;
  if (keys.has(k)) err(`addition collides with a post-fix live row: ${k}`);
  keys.add(k);
}


// ---------------------------------------------------------------- self-test
// Round-2 review proved a green run is not proof the gate works: 24 adverbs in DET silently
// inverted strongAdjective() and 8 known-banned strings walked through. These probes make the
// gate test itself — every BAD string must produce at least one error, every GOOD string none.
const BAD_PROBES = [
  ['strong adj after the adverb gerne', 'Ich trage gerne sportliche Schuhe.'],
  ['strong adj after the adverb immer', 'Er trägt immer elegante Schuhe.'],
  ['strong adj after the adverb gestern', 'Ich habe gestern gutes Brot gekauft.'],
  ['strong adj after the adverb sehr', 'Das ist sehr schöne Kleidung.'],
  ['strong adj after nicht', 'Das sind nicht neue Schuhe.'],
  ['Genitiv der + Frau (no -s)', 'Das Auto der Frau ist neu.'],
  ['Genitiv am Ende der Woche', 'Das Gehalt kommt am Ende der Woche.'],
  ['Komparativ with umlaut', 'Mein Bruder ist größer als ich.'],
  ['Genitiv des + -s', 'Die Ankunft des Zuges ist um acht Uhr.'],
  ['dass-Nebensatz', 'Ich hoffe, dass wir heute das Spiel gewinnen.'],
  ['Futur I', 'Es wird morgen den ganzen Tag regnen.'],
  ['strong dative adj', 'Bei gutem Wetter machen wir ein Picknick.'],
  ['um … zu', 'Nimm die Unterführung, um die Straße zu überqueren.'],
  ['Präteritum of a full verb', 'Bei dem Gewitter gab es viele Blitze.'],
  ['Superlativ', 'Mein liebstes Hobby ist das Lesen.'],
  ['Konjunktiv II outside the chunk list', 'Könnte ich bitte die Rechnung haben?'],
  ['reflexive without a reflexive headword', 'Ich ziehe mich nach dem Frühstück an.'],
  ['sentence over 12 words', 'Der Mann geht heute mit seiner Frau und den Kindern in die neue Stadt.'],
];
const GOOD_PROBES = [
  ['weak ending after the contraction am', 'Das Rathaus liegt direkt am großen Marktplatz.', {}],
  ['weak ending after the contraction zur', 'Die Fähre bringt uns zur kleinen Insel.', {}],
  ['ein-word declension', 'Heute Abend kommt ein starkes Gewitter zu uns.', {}],
  ['definite plural -en', 'In den kleinen Gassen gibt es viele Geschäfte.', {}],
  ['allowed polite chunk', 'Könnten Sie mir bitte die Speisekarte bringen?', {}],
  ['allowed fixed adverb am liebsten', 'Welche Marke kaufst du am liebsten?', {}],
  ['möchte', 'Ich möchte einen Kaffee bestellen.', {}],
  ['Präteritum of a modal (topic 11)', 'Er konnte gestern nicht kommen.', {}],
  ['dative der after a sentence-initial preposition', 'Auf der Torte stehen dreißig Kerzen.', {}],
  ['dative der mid-sentence', 'Wir warten an der Haltestelle auf den Bus.', {}],
  ['reflexive WITH a reflexive headword (Wortliste exception)',
   'Sie kämmt sich jeden Morgen vor dem Spiegel.', { reflexiveHeadword: true }],
];
let selfFailures = 0;
// A bad probe has to be CAUGHT — as an error, or (for the reflexive rule, which is warn-level by
// design because of the Wortliste exception) as a warning. A legal probe must raise no error.
function probe(sentence, opts) {
  const before = errors.length;
  const beforeWarn = warnings.length;
  checkGerman('probe', sentence, opts || {});
  const found = { errs: errors.length - before, warns: warnings.length - beforeWarn };
  errors.length = before;
  warnings.length = beforeWarn;
  return found;
}
for (const [why, sentence] of BAD_PROBES) {
  const r = probe(sentence, {});
  if (r.errs + r.warns === 0) {
    selfFailures++;
    console.log(`SELF-TEST FAIL: known-bad string passed the gate [${why}]: "${sentence}"`);
  }
}
for (const [why, sentence, opts] of GOOD_PROBES) {
  if (probe(sentence, opts).errs > 0) {
    selfFailures++;
    console.log(`SELF-TEST FAIL: legal string rejected [${why}]: "${sentence}"`);
  }
}
console.log(`self-test: ${BAD_PROBES.length} banned + ${GOOD_PROBES.length} legal probes, ` +
  `${selfFailures} failure(s)`);

// minor #8: pin the warning count so a NEW headword-presence warning has to be looked at
const EXPECTED_WARNINGS = 22;

// ---------------------------------------------------------------- report
console.log(`additions: ${additions.length}  (nouns ${nouns}, verbs ${verbs}, adj/adv/chunks ${other})`);
for (const c of Object.keys(perCategory).sort()) console.log(`  ${c}: ${perCategory[c]}`);
if (additions.length < 160 || additions.length > 180) err(`additions out of the 160–180 target: ${additions.length}`);
for (const [c, n] of Object.entries(perCategory)) {
  if (n < 20 || n > 22) err(`category ${c} has ${n} rows (target 20–22)`);
}
const byField = fixes.reduce((m, f) => ((m[f.field] = (m[f.field] || 0) + 1), m), {});
console.log(`fixes: ${fixes.length}  ${JSON.stringify(byField)}`);

console.log(`\n=== ERRORS: ${errors.length} ===`);
errors.forEach((e) => console.log('ERROR:', e));
console.log(`=== WARNINGS: ${warnings.length} ===`);
warnings.forEach((w) => console.log('WARN:', w));
if (warnings.length !== EXPECTED_WARNINGS) {
  console.log(`NOTE: warning count is ${warnings.length}, expected ${EXPECTED_WARNINGS} ` +
    `(12 singularia tantum + 9 vowel-change headword notices + 1 adverb false positive). Re-read the new one.`);
}
if (errors.length || selfFailures) process.exit(1);
