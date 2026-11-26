// A Lektion's final check (2026-11-18): one or more turns per can-do, answered aloud or typed.
// A can-do counts as shown only when every one of its turns was shown. Nothing here locks the next
// Lektion — the founder chose a recommendation over a locked path; the check only decides which
// can-dos the end screen ticks.
//
// Turn kinds (2026-11-19, made general for Lektionen 2–12):
//   accepted   fixed answers, graded by the shared checker (check.js).
//   `…`        an accepted answer with a gap is an OWN answer: the learner fills the gap with their
//              own words (a country, a job, an age). The words around the gap are graded by the shared
//              checker; the gap by its kind (`slot`, `thingKind`), its first word (`slotIn`) and what it
//              names (`slotWords`, see gapFits).
//   parts      a short written message: one sentence for each part, in any order, with an optional
//              greeting and sign-off.
//   ownName    Lektion 1's own-name turn: an opening and a name.
//   spell      a name spelled letter by letter, written by the learner.
//   listen     a number the partner says, written by the learner.
//   write      a turn that is written, never spoken.
//   variants   what a retake changes, one entry per sitting, so a retake is not the same paper.
//   example    a complete answer to show after a miss where the answer is the learner's own.
//   nounFor    the family nouns that may stand where a pronoun stands („Meine Mutter" for „Sie").
// Arabic-Indic and Persian digits are digits everywhere in the course (`westernDigits`, check.js).
import { LETTER } from './guidedRead.js';
import { RESULT, checkAnswer, levenshtein, numberWordsToDigits, westernDigits } from './check.js';
import { READALOUD_PASS_PCT } from './readaloud.js';
import { COURSE_WORDS } from '../../data/courseWords.js';
import { OWN_MASS_NOUNS, ALSO_GERMAN, CITIES, COUNTRIES, DRINKS, ENGLISH_NOUNS, ENGLISH_PLACES, ENGLISH_SMALL, FOODS, JOBS, LANGUAGES, NOUN_GENDERS } from './ownWords.js';
import { certainFault, nearestFrame, pronounSwap } from './certainFault.js';
import { nounPhraseFault, phraseFault, subjectNumberFault } from './nounPhrase.js';
import { COUNTRY_STEMS } from './countries.js';
import { reader } from './clause.js';
import { asked, meaning, senseless, valencyFault } from './taskMeaning.js';
import { certainlyNot, inOrder } from './clauseOrder.js';
import { ADVERBS as GERMAN_ADVERBS, adjectiveForm, determinerOf, verbReadings } from './germanForms.js';
import { repairs, smallWordsKnown } from './oneRepair.js';
import { asCostQuestion, asHaveQuestion, asTimeQuestion, withoutAndYou, asWell, nounForPronoun, withoutAttribute, withoutDegree, withoutOccasion, withoutParty } from './answerRewrites.js';
import { addressFault, counterQuestion, registerOf, courtesyOnly, withoutAsking, withoutCourtesy, withoutDemonstrative, withoutSmallWord } from './answerShapes.js';

// German letter names, so a spelled name is never sound-only (speech.js: every sound has text too).
const lettersOf = (word) => Array.from(word.normalize('NFC')).map((c) => (c === 'ß' ? c : c.toLocaleUpperCase('de')));

/** The gap an own answer leaves for the learner's words. */
export const GAP = '…';
// The third outcome (`typedResult`): well-formed-looking German beyond what the check can verify.
export const BEYOND = 'beyond';
/** A verified answer: CORRECT, or TYPO on the try after a typo. BEYOND is not one. */
export const verifiedResult = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
const hasGap = (answer) => String(answer).includes(GAP);

const fold = (s) => String(s || '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g, 'ss');
const wordsOf = (s) => String(s).split(/\s+/).filter(Boolean);

// The own-word lists by gap kind, folded (`ownWords.js`); the shapes of a rare job and a rare language, folded.
const foldedSet = (...lists) => new Set(lists.flat().map((w) => fold(w)));
const OWN_KIND = { place: foldedSet(COUNTRIES, CITIES), job: foldedSet(JOBS), language: foldedSet(LANGUAGES) };
const OWN_ALL = foldedSet(COUNTRIES, CITIES, JOBS, LANGUAGES);
const JOB_SHAPE_FOLDED = /^\p{L}{3,}(?:er|erin|in|ist|istin|ant|antin|ent|entin|eur|eurin|euse|or|orin|mann|frau|kraft|arzt|ärztin|loge|login|ling|helfer|helferin|ker|kerin|eiter|eiterin)$/u;
const LANGUAGE_SHAPE_FOLDED = /^\p{L}{3,}isch$/u;
const ALSO_GERMAN_SET = foldedSet(ALSO_GERMAN);
const ENGLISH_SMALL_SET = foldedSet(ENGLISH_SMALL);
const ENGLISH_NOUN_SET = foldedSet(ENGLISH_NOUNS);
/**
 * English in the answer (the probe of 2026-11-24: „I would like a coffee please.“ was praised as a name, „Ich bin teacher“,
 * „Ich komme aus Syria“ and „Ich möchte Monday“ as right): a small English word anywhere, or — outside a name — a word the
 * course prints as English, or an English place name.
 */
const acceptedWords = new WeakMap();
export function englishIn(turn, value) {
  if (!turn || turn.spell || turn.listen) return false;
  if (!acceptedWords.has(turn)) acceptedWords.set(turn, new Set((turn.accepted || []).flatMap((a) => wordsOf(frameOf(a).replace(/[….,!?;:„“"()]/g, ' '))).map(fold)));
  const said = acceptedWords.get(turn);
  const words = wordsOf(String(value || '').replace(/[’]/g, "'").replace(/[.,!?;:„“"()]/g, ' ')).map(fold).filter((w) => !said.has(w) && !turn.lexicon?.said?.has?.(w));
  if (words.some((w) => ENGLISH_SMALL_SET.has(w)) || (words[0] === 'i' && words.length > 1)) return true;
  if (turn.ownName || turn.parts || turn.slot === 'name') return false;
  return words.some((w) => turn.lexicon?.english?.has?.(w) || (ENGLISH_NOUN_SET.has(w) && !turn.lexicon?.has?.(w) && !COURSE_WORDS.has(w)));
}
// The article of a noun no Lektion teaches: its own entry (`NOUN_GENDERS`), a job's ending, the gender of a compound's
// last part, or an ending that has one article. Null where none of them knows: that noun's article is not checked.
const OWN_NOUNS = new Map();
for (const [g, words] of Object.entries(NOUN_GENDERS)) for (const w of words.split(/\s+/)) OWN_NOUNS.set(fold(w), [...new Set([...(OWN_NOUNS.get(fold(w)) || []), g])]);
// What these nouns name is no first name: „Ich heiße Banane“ (as a surname after a first name it may be one: „Anna Vogel“).
const NO_NAME = new Set(OWN_NOUNS.keys());
const FEMININE_JOB = /(?:in|frau|kraft|hilfe|euse)$/u;
const OWN_MASS = foldedSet(OWN_MASS_NOUNS);
const readingsMemo = new Map();
export function ownReadings(noun) {
  const w = fold(noun);
  if (!readingsMemo.has(w)) {
    const r = readingsOfOwn(w);
    // „der Teller, die Teller“, „das Brötchen, die Brötchen“: the plural may be the same word.
    readingsMemo.set(w, r && !r.includes('pl') && /(?:er|el|en|chen|lein)$/u.test(w) && !r.every((g) => g === 'die') ? [...r, 'pl'] : r);
  }
  return readingsMemo.get(w);
}
/** The genders of a noun in a typed answer: the course's, a country that has an article, or the learner's own noun's. */
export function readingsIn(lexicon, noun) {
  const w = fold(noun);
  if (lexicon?.names?.has?.(w) || CLOSED.has(w) || isNumberWord(w)) return null;
  const taught = lexicon?.genders?.get?.(w);
  if (taught) return taught;
  if (MEASURE_GENDER[w]) return [MEASURE_GENDER[w]];
  if (COUNTRY_ARTICLE[w]) return [COUNTRY_ARTICLE[w]];
  if (COUNTRY_MAY_HAVE[w]) return [COUNTRY_MAY_HAVE[w]];
  if (FRAME_NOUNS.get(w)) return FRAME_NOUNS.get(w);
  // (A noun that looks like a taught verb form: „die Dusche“ beside „ich dusche“.)
  if (OWN_NOUNS.has(w) && /^[A-ZÄÖÜ]/u.test(String(noun)) && verbReadings(w).length) return ownReadings(noun);
  if (OWN_KIND.place.has(w) || OWN_KIND.language.has(w) || lexicon?.has?.(w)) return null;
  return ownReadings(noun);
}
// A bare taught noun after a preposition („zu Kino“, „in Büro“): only a mass noun, a plural, a time or a fixed phrase stands bare.
const BARE_SET = foldedSet(['zu Besuch', 'zu Mittag', 'in Urlaub', 'auf Reise', 'in Arbeit', 'auf Arbeit', 'in Liebe', 'zu Wort', 'in Pflege', 'auf Suche', 'zu Fuß', 'in Not', 'in Form', 'in Gefahr', 'zu Hilfe', 'auf Schicht', 'in Teilen']);
const bareNounFault = (lexicon) => (prep, noun) => {
  const w = fold(noun);
  const r = lexicon?.genders?.get?.(w) || (['in', 'zu', 'auf', 'an'].includes(prep) && !BARE_SET.has(`${prep} ${w}`) && !OWN_MASS.has(w) ? OWN_NOUNS.get(w) : null);
  if (!r || r.includes('pl') || MASS.has(w) || lexicon?.bareAfter?.has?.(`${prep} ${w}`) || lexicon?.names?.has?.(w)) return false;
  if (DAYS.includes(w) || MONTHS.includes(asciiUmlauts(w)) || DAY_PARTS.includes(w) || ['uhr', 'hause', 'beruf', 'deutsch', 'englisch', 'musik', 'sport', 'arbeit', 'freizeit'].includes(w)) return w === 'arbeit' && prep === 'zu';
  if (OWN_KIND.place.has(w) || OWN_KIND.language.has(w) || w.length < 3) return false;
  return true;
};
/** A determiner that does not fit its noun anywhere in a typed answer, an own noun's included. */
export const articleFaultIn = (lexicon, typed) => {
  // („Was für ein Gegenstand ist das?“: „für“ asks for no case here.)
  // („um ein Uhr“ is one o'clock: no article.)
  const text = String(typed).replace(/(?<!\p{L})(was)\s+für\s+(?=ein)/giu, '$1 ').replace(/(?<=(?<!\p{L})(?:um|ist(?:\s+es)?|ab|bis|gegen|vor|nach)\s+)ein(?=\s+Uhr(?!\p{L}))/giu, '1');
  const opts = { readings: (n) => readingsIn(lexicon, n), bareFault: bareNounFault(lexicon) };
  return nounPhraseFault(text, opts) || subjectNumberFault(text, opts)
    || phraseFault(text, { readings: opts.readings, isVerbNoun: (n) => Boolean(lexicon?.verbs?.has?.(fold(n))), isLanguage: (n) => OWN_KIND.language.has(fold(n)),
      isPlace: (n) => { const w = fold(n); return OWN_KIND.place.has(w) && !COUNTRY_ARTICLE[w] && !COUNTRY_MAY_HAVE[w]; },
      countable: (n) => { const w = fold(n); const g = lexicon?.genders?.get?.(w); return Boolean(g) && !g.includes('pl') && !MASS.has(w) && !DONE_BARE.has(w) && !DAYS.includes(w) && !MONTHS.includes(asciiUmlauts(w)) && !DAY_PARTS.includes(w) && !['fussball', 'fußball', 'zeit', 'durst', 'hunger'].includes(w); } });
};
const STEMS = new Set(COUNTRY_STEMS.map((s) => fold(s)));
/** A language or a nationality is no place („Ich komme aus Syrisch.“, „… aus Syrer.“). */
const notPlace = (w) => OWN_KIND.language.has(w) || LANGUAGE_SHAPE_FOLDED.test(w) || (/(?:er|erin|in|e)$/.test(w) && !OWN_KIND.place.has(w) && [2, 4].some((n) => STEMS.has(w.slice(0, -n)) && /(?:er|erin)$/.test(w)));
function readingsOfOwn(w) {
  if (OWN_NOUNS.has(w)) return OWN_NOUNS.get(w);
  // A job: „Ärztin“ (and „Arztin“ from a phone) is feminine; „Arzt“, „Tischler“ masculine. An adjective used as a noun
  // („Angestellte“, „Beamter“) takes either article with its own ending, so it is left out.
  if (OWN_KIND.job.has(w) && !/(?:ellte|ellter|amter|dende|dender)$/u.test(w)) return [FEMININE_JOB.test(w) ? 'die' : 'der'];
  if (/^\p{L}{3,}(?:erin|istin|antin|entin|eurin|orin|login|ärztin|arztin)$/u.test(w)) return ['die'];
  // A compound: the longest last part with a gender („Schreibtisch“, „Käsebrot“), at least four letters after at least three.
  for (let i = 3; i <= w.length - 4; i += 1) if (OWN_NOUNS.has(w.slice(i))) return OWN_NOUNS.get(w.slice(i));
  return /^\p{L}{4,}(?:ung|heit|keit|schaft|tion|tät)$/u.test(w) ? ['die'] : null;
}
// Things that are the learner's own in the scenes, so „mein“ names the same thing as „der“ („mein Zug“, „mein Büro“).
// With their genders, so an untaught one („Ticket“) works too. Never what is for sale („meine Uhr“ at the stall).
const OWN_THINGS = new Map(Object.entries({ zug: 'der', fahrkarte: 'die', ticket: 'das', bus: 'der', abfahrt: 'die', büro: 'das', arbeitsplatz: 'der',
  platz: 'der', tisch: 'der', stift: 'der', heft: 'das', tasche: 'die', buch: 'das', wörterbuch: 'das', handy: 'das', termin: 'der', schlüssel: 'der',
  computer: 'der', rucksack: 'der', nummer: 'die', telefonnummer: 'die', adresse: 'die', geburtstag: 'der', party: 'die', fest: 'das', zimmer: 'das',
  kurs: 'der', pause: 'die', mittagspause: 'die', arbeit: 'die', chef: 'der', chefin: 'die', kollege: 'der', kollegin: 'die' }));
// Rule 5 (the courses session's review of 46c7ca80): the kinds of the taught nouns, from the course's own Wortfelder
// (family: Lektion 3 and 12; furniture: Lektion 4; drinks and food: Lektion 9), folded, with their plurals. A gap takes a
// taught word only of its own kind; a word no course teaches stays the learner's own (the own-word policy).
const TAUGHT_KIND = new Map(Object.entries({
  family: 'familie eltern vater väter mutter mütter bruder brüder schwester schwestern geschwister sohn söhne tochter töchter kind kinder mann männer frau frauen baby babys einzelkind mama papa',
  furniture: 'tisch tische stuhl stühle lampe lampen uhr uhren tasche taschen rucksack rucksäcke regal regale',
  drink: 'kaffee tee wasser mineralwasser orangensaft saft bier wein milch',
  food: 'kuchen suppe suppen salat salate brot brote frühstück',
}).flatMap(([kind, words]) => words.split(' ').map((w) => [fold(w), kind])));
// The kind of a word in the course's own lists: a day, a number, a function word, or a kind of `TAUGHT_KIND`; else null.
function taughtKind(w) {
  const f = fold(w).replace(/[.,!?;:]+$/, '');
  if (DAYS.includes(f.replace(/s$/, ''))) return 'day';
  if (CLOSED.has(f)) return 'function';
  if (isNumberWord(f)) return 'number';
  return TAUGHT_KIND.get(f) || null;
}
// What one does is none of these („Mein Hobby ist Montag“).
const NOT_DONE = ['day', 'number', 'family', 'furniture'];
// A word that ties the noun after it to something else („mit meinem Bruder“, „am Montag“): an article or a preposition.
const ATTACHED = /^(?:der|die|das|den|dem|des|[kmds]?ein(?:e|en|em|er|es)?|ihr(?:e|en|em|er)?|unser(?:e|en|em|er)?|mit|bei|beim|zu|zum|zur|in|im|ins|an|am|um|von|vom|für|ohne|nach|aus|jeden|jede|jedes)$/;
// What one drinks and eats, of the learner's own nouns (`ownWords.js`): another own noun that is listed is neither.
const OWN_DRINKS = foldedSet(DRINKS);
const OWN_FOODS = foldedSet(FOODS);
function ownKind(noun) {
  for (let i = 0; i <= noun.length - 3; i += (i ? 1 : 3)) {
    const part = noun.slice(i);
    if (OWN_DRINKS.has(part)) return 'drink';
    if (OWN_FOODS.has(part)) return 'food';
    if (i === 0 && OWN_NOUNS.has(part)) return 'thing';
  }
  return null;
}
/** A noun of another kind than the turn names (`thingKind`: drinks, food); a measure („eine Tasse“) is none. */
function otherThing(noun, thingKind, lexicon) {
  if (!thingKind || MEASURE_GENDER[noun] !== undefined) return false;
  const kind = taughtKind(noun) || ownKind(noun);
  return (Boolean(kind) || Boolean(lexicon?.genders?.has?.(noun))) && !thingKind.includes(kind);
}
// Countries that are never named without their article (folded): die Türkei, die USA …
// Countries used with or without their article: with one, it is this („aus dem Irak“, never „aus der Irak“).
const COUNTRY_MAY_HAVE = { irak: 'der', iran: 'der', libanon: 'der', sudan: 'der', südsudan: 'der', jemen: 'der', kongo: 'der', tschad: 'der', oman: 'der', senegal: 'der', kosovo: 'der' };
const COUNTRY_ARTICLE = { türkei: 'die', schweiz: 'die', ukraine: 'die', slowakei: 'die', mongolei: 'die', usa: 'pl', niederlande: 'pl', philippinen: 'pl', emirate: 'pl' };
const END = /[.!?]+$/;

// German's closed classes: a gap made only of these names nothing („Ich wohne in und").
const CLOSED = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines', 'nichts', 'nie', 'niemand', 'mein', 'meine', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre', 'unser', 'unsere',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'man', 'mich', 'dich', 'ihn', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihnen',
  'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
  'und', 'oder', 'aber', 'auch', 'nicht', 'noch', 'schon', 'sehr', 'nur', 'dann', 'hier', 'da', 'so', 'gern', 'ja', 'nein',
  'in', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'zu', 'für', 'um', 'im', 'am', 'zum', 'zur', 'vom']);

/** A heard number as the learner writes it: one group of digits per spoken group („null vier zwei eins, sechs drei acht" → „0421 638"). */
export const digitsOf = (said) => String(said).split(/[,–-]/).map((group) => numberWordsToDigits(group).replace(/\D/g, '')).filter(Boolean).join(' ');

/**
 * Every word the level teaches (its Wortfeld, with plurals and the plain present forms of its
 * verbs), folded. A gap word the course teaches must be one of the turn's `slotWords`; a word the
 * course never teaches is the learner's own (Syrien, Krankenpfleger, Kurdisch) and is welcome.
 */
const LEXICONS = new WeakMap();
export function courseLexicon(curriculum) {
  if (curriculum && typeof curriculum === 'object' && LEXICONS.has(curriculum)) return LEXICONS.get(curriculum);
  const known = buildLexicon(curriculum);
  if (curriculum && typeof curriculum === 'object') LEXICONS.set(curriculum, known);
  return known;
}

const sentenceKey = (s) => wordsOf(String(s).replace(/[„“"().,!?;:–]/g, ' ')).map(fold).join(' ');

function buildLexicon(curriculum) {
  const known = new Set();
  // Alongside the words: the cast's names (a name gap takes them), the verbs' present forms (a clause
  // after „und" starts with one) and every noun's article („den Stuhl", „die Lampe").
  known.names = new Set();
  known.verbs = new Set();
  known.genders = new Map();
  // A taught noun's plural („Rucksack“ → „Rucksäcke“): what „zwei Rucksacks“ is checked against.
  known.plurals = new Map();
  known.pluralForms = new Set();
  known.exact = new Set(); // the taught words as written, capitals included
  // What the course gives the learner to hear, read or answer — dialogue, reading, check cues, accepted answers,
  // example sentences — is taught too: BEYOND needs a word outside all of it („Wohin fährt der Zug?“ is taught
  // German, the cue of Lektion 10). A notice or a task is about German („lautet“ stands in a notice only).
  known.said = new Set();
  const texts = [];
  const infinitives = [];
  const said = (s) => { texts.push(String(s || '')); for (const w of String(s || '').match(/\p{L}+/gu) || []) known.said.add(fold(w)); };
  for (const l of curriculum?.lektionen || []) {
    for (const line of l.dialog?.lines || []) said(line.de);
    said(l.guided?.read?.text);
    for (const x of l.guided?.read?.series?.items || []) if (x.de.length > 1) said(x.de); // (a letter of the alphabet is no word)
    for (const w of l.wortfeld || []) said(w.exampleDe);
    for (const turn of l.guided?.check?.turns || []) {
      for (const t of [turn, ...(turn.variants || [])]) {
        said(t.cue?.de);
        for (const a of t.accepted || []) said(typeof a === 'string' ? a : a.frame);
      }
    }
    // The cast's names are course words too: „Ich bin Ana" names no job.
    for (const line of l.dialog?.lines || []) {
      for (const token of String(line.speaker).split(/\s+/)) { known.add(fold(token)); if (!['herr', 'frau'].includes(fold(token))) known.names.add(fold(token)); }
    }
    // Full names the scene says („Ich heiße Ana Chakiri.“, „Frau Chakiri“) are names, not taught words.
    for (const line of l.dialog?.lines || []) {
      for (const m of String(line.de).matchAll(/(?:heiße|Frau|Herr)\s+(\p{Lu}\p{L}+)(?:\s+(\p{Lu}\p{L}+))?/gu)) for (const n of [m[1], m[2]]) if (n && !['Frau', 'Herr'].includes(n)) known.names.add(fold(n));
    }
    for (const w of l.wortfeld || []) {
      for (const text of [w.de, w.word, w.plural]) for (const token of String(text || '').split(/[^\p{L}]+/u)) if (token) { known.add(fold(token)); known.exact.add(token); }
      // A word may be singular and plural at once („der Computer", „die Computer"): every reading counts.
      const gender = (k, g) => known.genders.set(k, [...new Set([...(known.genders.get(k) || []), g])]);
      if (['der', 'die', 'das'].includes(w.article) && w.word && !w.meta) {
        // A die-word whose plural is itself is a plural only („die Eltern", „die Geschwister"): never „meine Eltern kommt".
        const pluralOnly = w.article === 'die' && w.plural === w.word;
        if (!pluralOnly) gender(fold(w.word), w.article);
        if (w.plural && !/^[—-]$/.test(w.plural)) { gender(fold(w.plural), 'pl'); known.plurals.set(fold(w.word), fold(w.plural)); known.pluralForms.add(fold(w.plural)); }
      }
      const verb = !w.article && /^[a-zäöü]+e?n$/.test(w.word || '') ? w.word.replace(/e?n$/, '') : null;
      if (verb) for (const ending of ['e', 'st', 't', 'en', 'et']) { known.add(fold(verb + ending)); known.verbs.add(fold(verb + ending)); }
      if (verb) infinitives.push(fold(verb));
    }
    // The checks' own lists of places, jobs and languages are course words too: „Lehrer Bremen" is no job.
    const lists = (x) => [x.slotWords || [], ...(x.extras || []).map((e) => e.slotWords || [])];
    for (const turn of l.guided?.check?.turns || []) {
      for (const t of [turn, ...(turn.variants || [])]) for (const list of lists(t)) for (const w of list) known.add(fold(w));
    }
  }
  // The verbs the course says with a person („ich komme“, „kommst du“, „du wohnst“), by their stems: what agreement
  // is checked against (`personsOf`). A Wortfeld verb counts when the course says one of its personal forms.
  known.stems = new Set();
  const clauses = texts.flatMap((t) => t.split(/[.!?;:,–]+/));
  const toks = (c) => wordsOf(c.replace(/[„“"()]/g, ' ')).map(fold);
  for (const c of clauses) {
    const raw = wordsOf(c.replace(/[„“"()]/g, ' '));
    const w = toks(c);
    w.forEach((x, i) => {
      // A verb is written small, or stands first („Kommst du …?“); a noun never is one („Hast du Kaffee?“).
      if (CLOSED.has(x) || x.length < 3 || (i > 0 && /^\p{Lu}/u.test(raw[i])) || known.genders.has(x)) return;
      if ((w[i - 1] === 'ich' || w[i + 1] === 'ich') && /e$/.test(x)) known.stems.add(x.slice(0, -1));
      if ((w[i - 1] === 'du' || w[i + 1] === 'du') && /st$/.test(x)) known.stems.add(x.slice(0, -2));
    });
  }
  for (const v of infinitives) if (['e', 'st', 't', 'et', 'est'].some((e) => known.said.has(v + e))) known.stems.add(v);
  // The participles the course says with „haben“ („Ich habe gearbeitet“): never a state after „bin“.
  known.perfect = new Set();
  for (const c of clauses) {
    const w = toks(c);
    if (w.some((x) => AUX_HABEN.has(x))) for (const x of w) if (participleOf(x)) known.perfect.add(x);
  }
  // A noun the course says bare after a preposition („von Beruf“, „in Ordnung“): no missing article.
  known.bareAfter = new Set();
  for (const c of clauses) {
    const raw = wordsOf(c.replace(/[„“"()]/g, ' '));
    raw.forEach((x, i) => { if (i && BARE_PREP.has(fold(raw[i - 1])) && /^\p{Lu}/u.test(x)) known.bareAfter.add(`${fold(raw[i - 1])} ${fold(x)}`); });
  }
  // The English the course prints (glosses, translations) that no German of it uses: in a gap it is English, not the
  // learner's own word („Ich bin teacher“, „Ich möchte Monday“).
  // The words the course writes small inside a sentence: not nouns, or not only („morgen“, „essen“).
  known.small = new Set(texts.flatMap((t) => String(t || '').match(/(?<=\p{L}[ ,;–-]+)\p{Ll}\p{L}*/gu) || []).map(fold));
  known.english = new Set();
  // Every sentence the course says, for an answer of two („Ich stehe um sechs auf. Ich bin müde.“).
  known.sentences = new Set(texts.flatMap((t) => t.split(/(?<=[.!?])\s+|\n+/)).filter((s) => !hasGap(s) && wordsOf(s).length >= 2).map(sentenceKey));
  for (const l of curriculum?.lektionen || []) {
    for (const s of [...(l.wortfeld || []).map((w) => w.en), ...(l.dialog?.lines || []).map((x) => x.en)]) {
      for (const w of String(s || '').match(/[A-Za-z]{3,}/g) || []) {
        const f = fold(w);
        if (!ALSO_GERMAN_SET.has(f) && !known.has(f) && !known.said.has(f) && !COURSE_WORDS.has(asciiUmlauts(f)) && !OWN_ALL.has(f)) known.english.add(f);
      }
    }
  }
  for (const w of ENGLISH_PLACES) if (!OWN_ALL.has(fold(w))) known.english.add(fold(w));
  // Every answer the course's checks accept, with its gap: a clause left over after a verified beginning is verified
  // when one of them verifies it („Ich komme aus Marokko und wohne in Bremen“), Rule 1.
  const seen = new Set();
  known.clauses = [];
  for (const l of curriculum?.lektionen || []) {
    for (const turn of l.guided?.check?.turns || []) {
      for (const t of [turn, ...(turn.variants || [])].map((x) => ({ ...turn, ...x }))) {
        if (t.listen || t.spell || t.parts || t.ownName) continue;
        for (const a of t.accepted || []) {
          const props = typeof a === 'string' ? {} : a;
          const frame = frameOf(a);
          if (!wordsOf(frame.replace(/[….,!?]+/g, ' ')).length) continue;
          const c = { frame, slot: props.slot ?? t.slot, slotWords: props.slotWords ?? t.slotWords ?? [], slotIn: props.slotIn ?? t.slotIn };
          const key = JSON.stringify(c);
          if (!seen.has(key)) { seen.add(key); known.clauses.push(c); }
        }
      }
    }
  }
  // Every word the course writes with ä, ö, ü or ß, by its spelling with ae, oe, ue and ss (`spelledOut`), and
  // every word it writes, so a real „ss“ or „ue“ („Wasser“, „neue“) stays as it is.
  known.umlautOf = new Map();
  known.plainWords = new Set();
  // The grader's own word lists count too („Stück“, „Gläser“).
  const words = JSON.stringify(curriculum || {}, (k, v) => (/^(?:id|slug|wordId|src|alt|links|level|code|testSlug|\w*Slugs?|audio\w*)$/.test(k) ? undefined : v));
  for (const w of [words, ...MASS, ...Object.keys(MEASURE_GENDER)].join(' ').match(/\p{L}+/gu) || []) {
    const lower = w.toLocaleLowerCase('de');
    known.plainWords.add(lower);
    if (/[äöüß]/.test(lower)) known.umlautOf.set(asciiUmlauts(lower), lower);
  }
  return known;
}

const asciiUmlauts = (s) => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/**
 * ONE SPELLING FOLD for the whole final check (courses session, 2026-11-20): a word typed with ae, oe, ue or ss
 * for ä, ö, ü or ß („heisse“, „Gruesse“, „Stueck“, „Tuerkei“) is the course's word, before anything is graded —
 * frames, greetings and sign-offs, gap values and lexicon lookups all see „heiße“, „Grüße“, „Stück“,
 * „Türkei“. It is German spelling, not a slip. A word the course writes with „ss“ or „ue“ stays.
 */
export function spelledOut(text, lexicon) {
  const map = lexicon?.umlautOf;
  if (!map?.size) return String(text);
  return String(text).replace(/\p{L}+/gu, (w) => {
    const lower = w.toLocaleLowerCase('de');
    if (!/ae|oe|ue|ss/.test(lower) || lexicon.plainWords?.has(lower)) return w;
    const u = map.get(lower);
    if (!u) return w;
    return /^\p{Lu}/u.test(w) ? u.charAt(0).toLocaleUpperCase('de') + u.slice(1) : u;
  });
}

/** The choice the learner made in a choice gap („Das ist meine Schwester" → Schwester), or null. */
export function chosenWord(turn, value) {
  if (!turn?.slotIn || !verifiedResult(typedResult(turn, value))) return null;
  const words = wordsOf(String(value || '').replace(/[.,!?]/g, ' ')).map(fold);
  return turn.slotIn.find((w) => words.some((x) => x === fold(w) || slip(x, fold(w)))) || null;
}

/**
 * An honest „none" (one rule for the whole course, 2026-11-20): a turn that asks for a fact of the
 * learner's life a real person may not have — a job, a hobby — takes it as a whole sentence. A turn that
 * asks the learner to do the can-do in the scene (buy, say what the office lacks, order, name a free
 * time, name languages) does not: „Ich kaufe nichts", „Ich brauche keinen Computer", „Nichts, danke",
 * „Ich habe keine Zeit" skip the can-do. Where a fact may be missing for some learners (a phone number,
 * a family), the task says it may be made up instead.
 */
export const HONEST_NONE = {
  job: ['Ich arbeite nicht.', 'Ich habe keine Arbeit.', 'Ich bin arbeitslos.'],
  hobby: ['Ich habe kein Hobby.', 'Ich habe keine Hobbys.'],
};

/**
 * One sitting's turns. A retake takes each turn's next variant and spells the next name on the list.
 * `chosen` is the learner's choice in an earlier choice gap: the turns after it talk about that person,
 * so their `nounFor` keeps only the noun for that person („Meine Mutter", not „Meine Schwester").
 */
export function checkTurns(check, retake = 0, { chosen = null } = {}) {
  return (check?.turns || []).map(({ variants, ...base }) => {
    let picked = variants?.length ? { ...base, ...variants[retake % variants.length] } : base;
    if (chosen && picked.nounFor) {
      const only = Object.fromEntries(Object.entries(picked.nounFor).map(([p, nouns]) => [p, nouns.filter((n) => fold(n).endsWith(` ${fold(chosen)}`))]));
      picked = { ...picked, nounFor: only };
    }
    // In the player the check carries the level's words, and each turn knows who it is said to.
    let turn = check.lexicon ? { ...picked, lexicon: check.lexicon, partner: check.partner } : picked;
    // `none` names the fact a turn asks about when its gap is of another kind („Wann arbeitest du?“: a job).
    const none = HONEST_NONE[turn.none || turn.slot];
    if (none && turn.accepted && !/\?\s*$/.test(frameOf(turn.accepted[0]))) turn = { ...turn, accepted: [...turn.accepted, ...none] };
    // A heard day or time is shown after a miss as its example („Dienstag, 9.30 Uhr"), a heard number as its digits.
    if (turn.listen) return { ...turn, accepted: [turn.when || turn.time ? turn.example : digitsOf(turn.listen)], spoken: turn.listen };
    if (turn.parts) return { ...turn, accepted: [turn.example] };
    if (!turn.spell) return turn;
    const name = turn.spell[retake % turn.spell.length];
    const letters = lettersOf(name);
    return { ...turn, accepted: [name], spoken: `${letters.join('-')}.`, letterNames: letters.map((c) => LETTER[c] || c).join(' – ') };
  });
}

/** True when the turn is answered in writing only: spelling, a heard number, a written message. */
export const writtenOnly = (turn) => Boolean(turn.spell || turn.listen || turn.write || turn.parts);

/** True when the learner answers with their own words (their name, their country …). */
export const ownAnswer = (turn) => Boolean(turn.ownName || turn.parts) || turn.accepted.some((a) => hasGap(typeof a === 'string' ? a : a.frame));

// German month names, folded (umlauts as ae), and their usual short forms by their first letters.
const MONTHS = ['januar', 'februar', 'maerz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
const monthOf = (word) => {
  const w = fold(word).replace(/ä/g, 'ae').replace(/\.$/, '');
  const at = MONTHS.findIndex((m) => m === w || (w.length >= 3 && m.startsWith(w)) || (w === 'mrz' && m === 'maerz'));
  return at < 0 ? 0 : at + 1;
};

/**
 * A real calendar date with its year: in digits with dots, slashes or dashes („12.03.1990", „12/03/1990",
 * „12-3-90" — the slash is how many of our Arabic-speaking learners write one), or a day with a month
 * name („12. März 1990", „1. Januar 1990"). Not „12.03." without a year, not „1990" alone, not „31.4.".
 */
/** „31. November“, „31.11.“: a date without its year, in a leap year. */
function withYear(said) {
  if (/\p{L}/u.test(said)) return /\d{4}$/.test(said) ? said : `${said} 2000`;
  const parts = said.split(/[./-]/).map((x) => x.trim()).filter(Boolean);
  return parts.length === 2 ? `${parts.join('.')}.2000` : parts.join('.');
}
function isDate(words) {
  const w = words.trim();
  let day; let month; let year;
  let m = w.match(/^(\d{1,2})\s?([./-])\s?(\d{1,2})\s?\2\s?(\d{4}|\d{2})$/);
  if (m) [day, month, year] = [Number(m[1]), Number(m[3]), m[4]];
  else if ((m = w.match(/^(\d{1,2})\.?\s+(\p{L}+\.?)\s+(\d{4}|\d{2})$/u))) [day, month, year] = [Number(m[1]), monthOf(m[2]), m[3]];
  else return false;
  const y = year.length === 2 ? (Number(year) > new Date().getFullYear() % 100 ? 1900 : 2000) + Number(year) : Number(year);
  const date = new Date(Date.UTC(y, month - 1, day));
  return month >= 1 && date.getUTCFullYear() === y && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * One slip in a word of five letters or more („Muter"). An ending added or dropped and one vowel for
 * another are forms, not slips: „Schwestern" and „Brüder" are plurals where „ist" needs one person.
 */
function slip(given, target) {
  if (target.length < 5 || levenshtein(given, target) !== 1 || given.startsWith(target) || target.startsWith(given)) return false;
  if (given.length !== target.length) return true;
  const at = [...given].findIndex((c, i) => c !== target[i]);
  return !(/[aeiouäöü]/.test(given[at]) && /[aeiouäöü]/.test(target[at]));
}

// Mass nouns, folded: they name a thing without an article („Das ist Papier", „Ich kaufe Brot").
const MASS = new Set(['papier', 'wasser', 'kaffee', 'tee', 'milch', 'brot', 'geld', 'zucker', 'obst', 'kaese', 'käse', 'fleisch', 'reis', 'saft', 'gemuese', 'gemüse',
  'kuchen', 'suppe', 'salat', 'wein', 'bier', 'orangensaft', 'mineralwasser', 'apfelsaft', 'kakao', 'frühstück']);

// A measure before a food or drink names it too („ein Glas Wasser", „eine Tasse Kaffee", „zwei Stück Kuchen").
const MEASURE_GENDER = { glas: 'das', gläser: 'pl', tasse: 'die', tassen: 'pl', stück: 'das', flasche: 'die', flaschen: 'pl',
  kanne: 'die', kannen: 'pl', teller: 'der', portion: 'die', portionen: 'pl', becher: 'der', kugel: 'die', kugeln: 'pl' };

/**
 * A clock time as Lektion 8 teaches it, or as digits: „halb neun", „Viertel nach acht", „Viertel vor
 * neun", „acht Uhr dreißig", „fünf nach halb neun", „8.30 (Uhr)", „8:30", „um acht". Returns the minutes
 * on a twelve-hour dial (so 20.30 and halb neun are one time), or null when it is no clock time.
 */
export function clockOf(text) {
  // Number words typed without their umlaut („funf", „zwolf", „funfzehn") are numbers too.
  const plain = fold(text).replace(/f(?:ue|u)nf/g, 'fünf').replace(/zw(?:oe|o)lf/g, 'zwölf');
  const t = numberWordsToDigits(plain.replace(/\bein uhr\b/g, '1 uhr').replace(/\bum\b/g, ' '))
    .replace(/[.,!?]+$/, '').replace(/\s+/g, ' ').trim();
  const dial = (h, min) => (Number.isInteger(h) && Number.isInteger(min) && h >= 0 && h <= 24 && min >= 0 && min < 60 ? (h % 12) * 60 + min : null);
  let m;
  if ((m = t.match(/^(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*uhr)?$/))) return dial(+m[1], +m[2]);
  if ((m = t.match(/^(\d{1,2})\s*uhr(?:\s+(\d{1,2}))?$/))) return dial(+m[1], +(m[2] || 0));
  if ((m = t.match(/^halb\s+(\d{1,2})$/))) return dial(+m[1] - 1, 30);
  if ((m = t.match(/^viertel\s+(nach|vor)\s+(\d{1,2})$/))) return m[1] === 'nach' ? dial(+m[2], 15) : dial(+m[2] - 1, 45);
  if ((m = t.match(/^(\d{1,2})\s+(nach|vor)\s+halb\s+(\d{1,2})$/))) return dial(+m[3] - 1, m[2] === 'nach' ? 30 + +m[1] : 30 - +m[1]);
  if ((m = t.match(/^(\d{1,2})\s+(nach|vor)\s+(\d{1,2})$/))) return m[2] === 'nach' ? dial(+m[3], +m[1]) : dial(+m[3] - 1, 60 - +m[1]);
  if ((m = t.match(/^(\d{1,2})$/))) return dial(+m[1], 0);
  return null;
}

const DAYS = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
const DAY_SHORT = { mo: 'montag', di: 'dienstag', mi: 'mittwoch', do: 'donnerstag', fr: 'freitag', sa: 'samstag', sonnabend: 'samstag' };
const DAY_PARTS = ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht', 'früh'];
// Words that only join a day and a time („am Montag um zehn", „jeden Abend", „nach der Arbeit").
const WHEN_GLUE = new Set(['am', 'an', 'um', 'jeden', 'jede', 'jedes', 'ab', 'von', 'bis', 'und', 'auch', 'immer', 'nur', 'oder', 'gegen', 'diese', 'diesen', 'diesem', 'nächsten', 'nächste', 'meistens', 'oft']);

/**
 * When something is: a day („am Montag", „montags", „Di"), the weekend, today, a part of the day
 * („abends", „am Dienstagabend", „nach der Arbeit") and/or a clock time („um halb zehn"). Returns
 * { day, part, time, typo } or null when the words name no time at all („am Tisch").
 */
export function whenOf(text, { inSentence = false } = {}) {
  const words = fold(text).replace(/\b(nach (?:der arbeit|dem kurs|der schule|dem unterricht))\b/g, 'abend')
    .replace(/(?<!\d)[.:]|[.:](?!\d)|[,!?;]/g, ' ').split(/\s+/).filter(Boolean);
  let day = null; let part = null; let typo = false;
  let joined = false; // an „und“, „oder“ or „bis“ since the last day: a second day may follow
  const timeWords = [];
  // „am" takes a day or a part of the day, „um" a clock time (the notice of Lektion 8): „um Montag" and
  // „am zehn Uhr" name no time (first DaF review of Lektion 8, 2026-11-20); „um" and „am" take a word („um und“).
  let prev = '';
  const NEEDS_WORD = ['um', 'am', 'an'];
  // („und“, „oder“ join two times: never first or last, „morgens und“, never inside a clock time, „sechs und Uhr“; „um“
  // takes a clock time, „um morgens“ none; section D.)
  const clockish = (w) => /^\d/.test(w) || isNumberWord(w) || ['halb', 'viertel', 'wie'].includes(w);
  if ([...NEEDS_WORD, 'und', 'oder'].includes(words.at(-1)) || ['und', 'oder'].includes(words[0])
    || words.some((w, i) => NEEDS_WORD.includes(words[i - 1]) && ['und', 'oder', 'um', 'am', 'an', 'ab', 'von', 'bis', 'gegen'].includes(w))
    || words.some((w, i) => words[i - 1] === 'um' && !clockish(w))
    || words.some((w, i) => ['und', 'oder'].includes(words[i - 1]) && ['uhr', 'halb', 'viertel', 'nach', 'vor'].includes(w))
    || words.some((w, i) => ['und', 'oder'].includes(w) && ['halb', 'viertel', 'nach', 'vor', 'bis'].includes(words[i - 1]))
    // („am Freitag und um zehn“ names two times, not one.)
    || words.some((w, i) => w === 'um' && words[i - 1] === 'und' && words.slice(0, i - 1).some((x) => DAYS.includes(x.replace(/s$/, ''))))) return null;
  // In a sentence („am Freitag um zehn“, a gap of „Ich habe … Zeit.“, Rule 5) a clock time takes „um": „am Freitag
  // zehn" and „Ich habe sieben Zeit" name no time (third corpus of Lektion 8). A note („Freitag 10 Uhr") needs none.
  const sentence = inSentence || words.includes('am');
  const dayHere = () => prev !== 'um';
  // A weekday in a sentence never stands right after a clock time without its „am“ („um sechs Montag“; section D);
  // a part of the day may („um zehn Uhr morgens“).
  const afterClock = () => sentence && timeWords.length && timeWords.at(-1) === prev;
  // A span of time („von acht bis vier", „von 8 bis 16 Uhr", Lektion 11) is its start; its end must be a time too.
  const endWords = [];
  let toEnd = false;
  for (const w of words) {
    if (toEnd || (w === 'bis' && timeWords.length)) { if (toEnd) endWords.push(w); toEnd = true; prev = w; continue; }
    const base = w.replace(/s$/, '');
    const compound = base.match(/^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)(morgen|vormittag|mittag|nachmittag|abend|nacht)$/);
    if (compound) { if (!dayHere()) return null; [, day, part] = compound; prev = w; continue; }
    // The same day twice names no time („am Montag und Montag“), nor two days without „und“ („Montag Samstag“; section D).
    if (DAYS.includes(base)) { if (!dayHere() || afterClock() || day === base || (DAYS.includes(day) && !joined)) return null; day = base; joined = false; prev = w; continue; }
    // In a sentence the week, its end and a day take their article („am Wochenende“, „jeden Tag“, „nächste Woche“).
    if (sentence && ['wochenende', 'woche', 'tag'].includes(base) && !['am', 'an', 'jedes', 'jede', 'jeden', 'dieses', 'diese', 'diesen', 'nächstes', 'nächste', 'nächsten', 'übers', 'das', 'die', 'den', 'ganze', 'ganzen'].includes(prev)) return null;
    if (DAY_SHORT[w.replace(/\.$/, '')]) { if (!dayHere()) return null; day = DAY_SHORT[w.replace(/\.$/, '')]; prev = w; continue; }
    if (['wochenende', 'woche', 'tag', 'heute', 'morgen', 'immer'].includes(base) && !(base === 'morgen' && part)) {
      if (!dayHere()) return null;
      if (base === 'morgen' && day) part = 'morgen'; else day = day ?? base;
      prev = w;
      continue;
    }
    if (DAY_PARTS.includes(base)) { if (!dayHere()) return null; part = base; prev = w; continue; }
    const slipped = DAYS.find((d) => slip(base, d));
    if (slipped) { if (!dayHere()) return null; day = slipped; typo = true; prev = w; continue; }
    if (WHEN_GLUE.has(w)) { if (['und', 'oder', 'bis'].includes(w)) joined = true; prev = w; continue; }
    if (!timeWords.length && ['am', 'an'].includes(prev)) return null;
    if (!timeWords.length && sentence && !['um', 'von', 'ab', 'gegen', 'bis'].includes(prev)) return null;
    timeWords.push(w);
    prev = w;
  }
  const time = timeWords.length ? clockOf(timeWords.join(' ')) : null;
  if (timeWords.length && time === null) return null;
  if (toEnd && clockOf(endWords.join(' ')) === null) return null;
  if (day === null && part === null && time === null) return null;
  const partHalf = ['nachmittag', 'abend', 'nacht'].includes(part) ? 'pm' : ['morgen', 'vormittag', 'früh'].includes(part) ? 'am' : null;
  return { day, part, time, typo, half: clockHalf(timeWords.join(' ')) || partHalf };
}

/** Morning or afternoon when a clock time says so (an hour from 13 on, „abends", „morgens"), else null. */
export function clockHalf(text) {
  const t = numberWordsToDigits(fold(text));
  const h = t.match(/(\d{1,2})\s*(?:[:.]\s*\d{2}|uhr)/);
  if (h && Number(h[1]) >= 13) return 'pm';
  if (/\b(nachmittags?|abends?|nachts?)\b/.test(t)) return 'pm';
  if (/\b(morgens|vormittags?|früh)\b/.test(t)) return 'am';
  return null;
}

// An expected time in the data is written on 24 hours („16:15"): its half of the day is known.
const halfOf24 = (s) => { const m = String(s || '').match(/(\d{1,2}):\d{2}/); return m ? (Number(m[1]) >= 12 ? 'pm' : 'am') : null; };

/**
 * True when a learner's `when` names the expected day and time („freitag 10:00", or a day alone). A
 * time may leave out morning or afternoon („halb zehn"), but not say the other one („21.30" for 9.30).
 */
function sameWhen(given, expected, { partial = false, writtenNote = false } = {}) {
  const e = whenOf(expected);
  if (!given || !e) return false;
  // `partial`: the day or the time alone is enough, but what is named must be the one asked about
  // („Bis Freitag!", never „Ja, am Freitag um elf" for ten; first corpus of Lektion 8, 2026-11-20).
  if (e.day !== null && given.day !== e.day && !(partial && given.day === null && given.time !== null)) return false;
  if (e.time !== null && given.time !== e.time && !(partial && given.time === null)) return false;
  const eh = halfOf24(expected);
  // A note of a heard afternoon time keeps the afternoon: „Freitag, 4.15 Uhr" reads as 4.15 in the
  // morning (fourth DaF review of Lektion 8); „16.15" or „nachmittags um Viertel nach vier" keep it.
  if (writtenNote && e.time !== null && eh === 'pm' && given.half !== 'pm') return false;
  return !(e.time !== null && eh && given.half && given.half !== eh);
}

// Words that may follow the verb of an activity besides nouns („Ich gehe gern ins Kino", „Ich spiele
// am Wochenende zusammen Fußball").
const ACTIVITY_GLUE = new Set(['ins', 'in', 'im', 'am', 'an', 'mit', 'zusammen', 'auch', 'sehr', 'oft', 'immer', 'viel', 'meinem', 'meiner',
  'meinen', 'meine', 'mein', 'der', 'die', 'das', 'den', 'dem', 'einen', 'ein', 'eine', 'zu', 'hause', 'nach', 'jeden', 'jede', 'und', 'oder',
  'gut', 'zum', 'zur', 'vom', 'beim', 'bei', 'meistens', 'manchmal', 'abends', 'morgens', 'nachmittags', 'noch', 'lange', 'gern', 'gerne']);

/** The same as a listed word, or that word with one slip. */
const near = (word, list) => list.some((w) => fold(w) === word || slip(word, fold(w)));

// Umlauts as a phone keyboard without them types them: „grün" is „grun" or „gruen".
const bare = (s) => fold(s).replace(/([aou])e/g, '$1').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');

/**
 * Colours are a closed class: the German colour words, also with „hell-"/„dunkel-" („dunkelblau"),
 * never any word the course does not teach („Es ist groß" names no colour; courses session,
 * 2026-11-20). „lila", „rosa", „orange" and „beige" take no ending.
 */
const COLOURS = new Set(['rot', 'blau', 'grun', 'gelb', 'schwarz', 'weiss', 'braun', 'grau', 'orange', 'lila', 'rosa', 'pink', 'violett', 'beige', 'turkis', 'silber', 'silbern', 'gold', 'golden', 'bunt']);
const UNDECLINED = new Set(['lila', 'rosa', 'orange', 'beige', 'pink']);
const colourStem = (w) => {
  const b = bare(w).replace(/^(hell|dunkel)-?(?=\p{L})/u, '');
  return COLOURS.has(b) ? b : null;
};
const isColour = (w, slotWords = []) => Boolean(colourStem(w)) || slotWords.some((t) => slip(fold(w), fold(t)));

// The ending a colour takes before a noun, by the slot's case, the word before it and the noun's
// article („den roten Stuhl", „eine rote Lampe", „ein rotes Heft"; „Das ist ein roter Stift").
const ADJ_ENDING = {
  thing: { der: { den: 'en', einen: 'en', keinen: 'en' }, die: { die: 'e', eine: 'e', keine: 'e' }, das: { das: 'e', ein: 'es', kein: 'es' }, pl: { die: 'en', keine: 'en', '': 'e' } },
  object: {
    der: { der: 'e', ein: 'er', kein: 'er', mein: 'er', dein: 'er' }, die: { die: 'e', eine: 'e', keine: 'e', meine: 'e', deine: 'e' },
    das: { das: 'e', ein: 'es', kein: 'es', mein: 'es', dein: 'es' }, pl: { die: 'en', keine: 'en', meine: 'en', deine: 'en', '': 'e' },
  },
};
/**
 * True when `adj` before a noun has the ending that `det` (or a count, '') and gender `g` ask for: a
 * colour („die rote Lampe"; „lila" takes none) or any adjective written small („die große Lampe",
 * third DaF review 2026-11-20), never a word the course teaches as something else.
 */
function adjectiveFits(adj, slot, det, g, lexicon) {
  const want = ADJ_ENDING[slot]?.[g]?.[det];
  if (want === undefined) return false;
  const w = fold(adj);
  if (UNDECLINED.has(colourStem(w))) return true;
  if (!w.endsWith(want)) return false;
  const stem = w.slice(0, -want.length);
  if (colourStem(stem)) return !UNDECLINED.has(colourStem(stem));
  // A verb form is no adjective („einen nehmen Kaffee“; section D).
  if (personsOf(adj, lexicon)) return false;
  return isAdjectiveShape(adj, lexicon);
}

/** A word that may stand as an adjective before a noun: written small, and not a word the course teaches as another kind. */
function isAdjectiveShape(adj, lexicon) {
  const w = fold(adj);
  if (!/^\p{Ll}[\p{L}]{2,}$/u.test(adj.normalize('NFC')) || CLOSED.has(w)) return false;
  if (typeof lexicon?.verbs?.has === 'function' && lexicon.verbs.has(w)) return false;
  return !(typeof lexicon?.genders?.get === 'function' && lexicon.genders.get(w));
}

/**
 * The learner's own words fit the gap. A choice (`slotIn`: „meine Mutter oder meine Schwester") takes
 * one of its words, then at most a name. The kinds: a number, an age of „Jahre", a phone number, a real
 * date; a place, a job or languages, whose words are each one of the taught words that fit
 * (`slotWords`) or a word the course never teaches (the learner's own: Syrien, Krankenpfleger,
 * Kurdisch) — so „Ich bin müde" is no job and „Sie spricht Brot" no language. Returns CORRECT, TYPO
 * (a slip in a choice) or WRONG.
 */
function gapResult(words, { slot = 'words', slotIn, thingKind, slotWords = [], lexicon, count, partner, time, when, whenPartial, only, negative, day, partOfDay, thingsAfter, people, taught, subject, frameHead, frameTail, inSentence, freeTime }) {
  const raw = words.split(' ').filter(Boolean);
  const parts = raw.map(fold);
  const known = (w) => typeof lexicon?.has === 'function' && lexicon.has(w);
  // A word of the kind: one of the taught words that fit, or the learner's own word the course never
  // teaches. A taught word of the kind with an ending is a form of it, not an own word: „Mein Heft ist
  // rote", „Ich spreche Deutsche", „Ich bin Studenten" (blind corpus, 2026-11-20).
  const formOfTaught = (w) => /(?:e|er|es|en|em)$/.test(w) && slotWords.some((t) => [1, 2].some((n) => fold(t) === w.slice(0, -n)) && fold(t) !== w);
  // THE OWN-WORD POLICY (courses session and the independent score, 2026-11-20): a word of the kind is one the turn
  // lists, one of the kind's German names (`ownWords.js`: languages and countries closed, jobs generous, the big
  // cities), or — only then — the learner's own: a word no course teaches (both courses' words, `COURSE_WORDS`),
  // and for a job or a language one of that shape. „Sie spricht Limonade“, „Ich bin Limonade“ are wrong; a small
  // town is accepted and the learner is told the word itself was not checked (`uncheckedWords`).
  const ownList = OWN_KIND[slot];
  const ownShape = { job: JOB_SHAPE_FOLDED, language: LANGUAGE_SHAPE_FOLDED }[slot];
  const fits = (w) => /\p{L}/u.test(w) && !CLOSED.has(w) && (near(w, slotWords) || Boolean(ownList?.has(w))
    || (!known(w) && !formOfTaught(w) && !(ownList && COURSE_WORDS.has(asciiUmlauts(w))) && (!ownShape || ownShape.test(w))));
  // A name after a choice („meine Mutter Fatima"): capitalised words the course does not teach.
  const name = (list) => list.every((w) => /^\p{Lu}/u.test(w) && !known(fold(w)) && !CLOSED.has(fold(w)));
  if (slotIn) {
    const rest = name(raw.slice(1)) ? null : RESULT.WRONG;
    if (rest) return rest;
    if (slotIn.map(fold).includes(parts[0])) return RESULT.CORRECT;
    return near(parts[0], slotIn) ? RESULT.TYPO : RESULT.WRONG;
  }
  // Rule 5: a gap in a sentence takes a time with what German needs around it („um sieben“); a bare gap (a note) or
  // one that is the subject („… ist gut.“, „Zehn Uhr passt.“) takes it alone.
  const sentence = inSentence ?? !(!String(frameHead || '').trim() && (!String(frameTail || '').replace(/[.!?…\s]/g, '') || /^(?:ist|passt)\b/i.test(String(frameTail).trim())));
  const digits = numberWordsToDigits(words);
  if (slot === 'number') return /^\d+$/.test(digits.replace(/\s+/g, '')) ? RESULT.CORRECT : RESULT.WRONG;
  // An age with „Jahre alt" is two or more: one is „ein Jahr alt".
  if (slot === 'years') return /^\d+$/.test(digits.replace(/\s+/g, '')) && Number(digits.replace(/\s+/g, '')) >= 2 ? RESULT.CORRECT : RESULT.WRONG;
  if (slot === 'phone') return /^[+\d\s/,–-]+$/.test(digits) && (digits.match(/\d/g) || []).length >= 3 ? RESULT.CORRECT : RESULT.WRONG;
  if (slot === 'date') return isDate(words) ? RESULT.CORRECT : RESULT.WRONG;
  // A clock time („Es ist halb neun", „Ich stehe um sechs Uhr auf"); with `time`, that very time. Saying
  // the time takes no „um" (the notice of Lektion 8), so „Es ist um halb neun" is wrong; a frame that
  // needs „um" has it outside the gap.
  if (slot === 'clock') {
    if (/\bum\b/i.test(words)) return RESULT.WRONG;
    // After the frame's „um“ comes the clock time („um morgens sechs Uhr“ is none; section D).
    if (/\bum$/i.test(String(frameHead || '').trim()) && /^(?:morgens|vormittags|nachmittags|abends|früh)\b/i.test(words.trim())) return RESULT.WRONG;
    // A part of the day may stand with the time („Es ist morgens Viertel nach sieben").
    const dayPart = (words.match(/\b(morgens|vormittags|nachmittags|abends|früh)\b/i) || [''])[0];
    const half = dayPart ? (/nachmittags|abends/i.test(dayPart) ? 'pm' : 'am') : clockHalf(words);
    words = words.replace(/\b(morgens|vormittags|nachmittags|abends|früh)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    const at = clockOf(words);
    if (at === null || (time && at !== clockOf(time))) return RESULT.WRONG;
    // „Zwanzig Uhr dreißig" is evening: wrong for a morning time (first DaF review of Lektion 8).
    if (time && half && half !== halfOf24(time)) return RESULT.WRONG;
    return RESULT.CORRECT;
  }
  // What may stand with a verb of the fixed expressions („Ich habe im Büro gearbeitet“, „… viel …“, „… bis
  // acht …“): each part verified (`pastMiddle`). Lektion 11.
  if (slot === 'adjunct') return raw.length ? pastMiddle(raw, lexicon, { objectless: true }) : RESULT.WRONG;
  // A sentence about the past („Was hast du gestern gemacht?“, Lektion 11): „habe“ or „bin“, what was done, and a
  // participle at the end („Ich habe Fußball gespielt“, „Ich bin ins Kino gegangen“, „Ich habe eingekauft“), or
  // „war“ („Ich war zu Hause“). Verbs of moving or changing take „bin“ („gegangen“, „aufgestanden“); a participle
  // in -en is one of the strong verbs', a weak one ends in -t („gearbeiten“ is no participle); „gemacht“ takes a
  // thing, not a verb as a noun („Ich habe Lesen gemacht“). Courses session, 2026-11-20.
  if (slot === 'past') {
    const middleOk = (w) => {
      const f = fold(w);
      return /^\p{Lu}/u.test(w) || ACTIVITY_GLUE.has(f) || WHEN_GLUE.has(f) || PAST_SMALL.has(f) || clockOf(f) !== null || DAYS.includes(f.replace(/s$/, ''));
    };
    // A phrase put in front comes back at the end („Am Sonntag habe ich gekocht“ → „… gekocht am Sonntag“).
    let end = raw.length;
    while (end > 2 && (WHEN_GLUE.has(parts[end - 1]) || DAYS.includes(parts[end - 1].replace(/s$/, '')) || ['wochenende', 'abend', 'morgen', 'nachmittag', 'uhr'].includes(parts[end - 1]) || clockOf(parts[end - 1]) !== null) && !participleOf(parts[end - 1])) end -= 1;
    // `taught`: the participles of the Lektion's fixed expressions („gearbeitet“, „gemacht“). Another well-formed
    // past sentence goes beyond what the check can verify, so it is BEYOND, never correct (the three outcomes,
    // courses session 2026-11-22); a taught thing's article is still checked („ein Kaffee getrunken“ is WRONG).
    const verified = (participle) => !taught || taught.some((p) => fold(p) === participle);
    if (parts[0] === 'war') return raw.length >= 2 && raw.slice(1).every(middleOk) ? (taught ? BEYOND : RESULT.CORRECT) : RESULT.WRONG;
    if (!['habe', 'bin'].includes(parts[0]) || end < 2) return RESULT.WRONG;
    const kind = participleOf(parts[end - 1]);
    if (!kind || (kind === 'sein') !== (parts[0] === 'bin')) return RESULT.WRONG;
    const middle = raw.slice(1, end - 1);
    if (parts[end - 1] === 'gemacht' && middle.some((w) => /^\p{Lu}/u.test(w) && lexicon?.verbs?.has?.(fold(w)))) return RESULT.WRONG;
    // A participle the Lektion teaches: every word between is verified, never correct by default.
    if (taught && verified(parts[end - 1])) return pastMiddle(middle, lexicon, { objectless: objectless(parts[end - 1]) });
    if (!middle.every(middleOk)) return RESULT.WRONG;
    // A thing with an article is checked as the thing gap checks it („einen Kaffee gemacht“, never „ein Kaffee“).
    const det = middle.findIndex((w) => ['ein', 'eine', 'einen', 'den', 'die', 'das', 'kein', 'keine', 'keinen'].includes(fold(w)));
    const thing = det >= 0 ? middle[det + 1] : null;
    if (thing && (verified(parts[end - 1]) || lexicon?.genders?.has?.(fold(thing))) && gapResult(middle.slice(det, det + 2).join(' '), { slot: 'thing', lexicon }) === RESULT.WRONG) return RESULT.WRONG;
    return verified(parts[end - 1]) ? RESULT.CORRECT : BEYOND;
  }
  // A month („im Mai“); with `day`, a day of it as one writes it („am 3. Mai“, „am 3.5.“). Lektion 12.
  if (slot === 'month') {
    // A day as an ordinal word („am dritten Mai“, second corpus of Lektion 12) is a day too.
    const ORDINAL = /^(?:ersten|zweiten|dritten|vierten|fünften|sechsten|siebten|siebenten|achten|neunten|zehnten|elften|zwölften|\p{L}+zehnten|\p{L}*zwanzigsten|\p{L}*dreißigsten)\s+/iu;
    const m = words.trim().replace(ORDINAL, '1. ').match(/^(?:(\d{1,2})\.\s*)?(\p{L}+|\d{1,2}\.?)$/u);
    if (!m || Boolean(day) !== Boolean(m[1])) return RESULT.WRONG;
    // A day is one of its month („31. Februar“ is none): `isDate`, in a leap year so the 29th of February counts.
    const inMonth = (nr) => !m[1] || isDate(`${Number(m[1])}.${nr}.2024`);
    if (/^\d/.test(m[2])) {
      const nr = Number(m[2].replace('.', ''));
      return nr >= 1 && nr <= 12 && inMonth(nr) ? RESULT.CORRECT : RESULT.WRONG;
    }
    const w = fold(m[2]).replace(/ä/g, 'ae');
    const exact = MONTHS.includes(w) || w === 'marz';
    const nr = w === 'marz' ? 3 : MONTHS.findIndex((x) => x === w || slip(w, x)) + 1;
    if (!nr || !inMonth(nr)) return RESULT.WRONG;
    return exact && /^\p{Lu}/u.test(m[2]) ? RESULT.CORRECT : RESULT.TYPO;
  }
  // An invitation's gap: to what („zum Fest“, „zur Party“, „zu meinem Geburtstag“, „zu meiner Party“)
  // and/or when („am Samstag“). The article agrees with the noun: „zum Party“ and „zu meinem Party“ are
  // wrong. Lektion 12.
  if (slot === 'invite') {
    const at = parts.findIndex((w) => ['zum', 'zur', 'zu'].includes(w));
    let rest = parts;
    // A taught noun written small („zum fest“, a speech recogniser's way) is the case slip it is elsewhere.
    let small = false;
    if (at >= 0) {
      const poss = parts[at] === 'zu' ? parts[at + 1] : null;
      if (parts[at] === 'zu' && !/^(?:mein|dein|unser)(?:em|er)$/.test(poss || '')) return RESULT.WRONG;
      const nounAt = at + (poss ? 2 : 1);
      const noun = raw[nounAt];
      small = Boolean(noun) && !/^\p{Lu}/u.test(noun) && Boolean(lexicon?.genders?.get?.(fold(noun)));
      if (!noun || (!/^\p{Lu}/u.test(noun) && !small)) return RESULT.WRONG;
      // One invites to a party, never to a day, a number, a person or a piece of furniture („zum Montag“; section D).
      if (['day', 'number', 'family', 'furniture'].includes(taughtKind(noun))) return RESULT.WRONG;
      const g = lexicon?.genders?.get?.(fold(noun));
      const fem = parts[at] === 'zur' || /er$/.test(poss || '');
      if (g && !g.some((x) => (fem ? x === 'die' : x === 'der' || x === 'das'))) return RESULT.WRONG;
      if (!g && known(fold(noun))) return RESULT.WRONG;
      rest = [...parts.slice(0, at), ...parts.slice(nounAt + 1)];
    }
    const ok = small ? RESULT.TYPO : RESULT.CORRECT;
    if (!rest.length) return at >= 0 ? ok : RESULT.WRONG;
    const named = whenOf(rest.join(' '), { inSentence: true });
    return named && (!when || sameWhen(named, when, { partial: whenPartial })) ? ok : RESULT.WRONG;
  }
  // When: a day, a part of the day and/or a time („am Montag um zehn", „am Wochenende", „abends"); with
  // `when`, the day and time asked about („Hast du am Freitag um zehn Uhr Zeit?").
  if (slot === 'when') {
    // `thingsAfter`: what one buys may follow the time („Kaufst du am Samstag Brot ein?“, third corpus of Lektion 11).
    if (thingsAfter) {
      const w = words.split(/\s+/);
      const timeWord = (x) => DAYS.includes(fold(x).replace(/s$/, '')) || ['wochenende', 'woche', 'tag', 'morgen', 'abend', 'nachmittag', 'vormittag', 'uhr'].includes(fold(x));
      while (w.length > 1 && /^\p{Lu}/u.test(w.at(-1)) && !timeWord(w.at(-1))) {
        // A thing the course counts stands with its article or in the plural („Brot“, „Äpfel“, never „Tisch“; section D).
        const g = lexicon?.genders?.get?.(fold(w.at(-1)));
        if (g && !g.includes('pl') && !MASS.has(fold(w.at(-1)))) return RESULT.WRONG;
        w.pop(); if (fold(w.at(-1)) === 'und') w.pop();
      }
      words = w.join(' ');
    }
    const at = whenOf(words, { inSentence: sentence });
    if (!at || (when && !sameWhen(at, when, { partial: whenPartial }))) return RESULT.WRONG;
    return at.typo ? RESULT.TYPO : RESULT.CORRECT;
  }
  // An activity after „Ich": a verb in its ich-form (a taught verb or the learner's own, „wandere"), then
  // nouns and small words, or a second verb after „und": „Ich spiele Fußball gern", „Ich gehe ins Kino
  // gern" (the frame's „gern" moved to the end), „Ich lese und koche gern". „Ich spielen gern" is wrong.
  if (slot === 'activity') {
    const verbs = lexicon?.verbs;
    // A taught verb form written small is the verb even where a plural looks the same („frühstücke“, „die Frühstücke“).
    const ichForm = (w) => {
      const f = fold(w);
      if (f.length < 3 || !/e$/.test(f) || CLOSED.has(f)) return false;
      if (verbs?.has?.(f) && /^\p{Ll}/u.test(w)) return true;
      return (verbs?.has?.(f) || !known(f)) && !lexicon?.genders?.get?.(f);
    };
    if (!raw.length || !ichForm(raw[0])) return RESULT.WRONG;
    if (unsplit(raw[0])) return RESULT.WRONG; // „Ich aufstehe“, „Ich einkaufe“ (courses session, 2026-11-20)
    // „Ich heiße Tim.“, „Ich wohne in Berlin.“, „Ich brauche …“ say nothing one does in the free time or in the morning.
    if (/^(?:heisse|wohne|brauche|habe|bin|komme|möchte|verstehe|kenne|koste)$/.test(fold(raw[0])) || (freeTime && fold(raw[0]) === 'arbeite')) return RESULT.WRONG;
    // `partOfDay`: „Was machst du morgens?“ is not answered with „Ich dusche abends“ (first corpus of Lektion 11).
    const MORNING = ['morgen', 'vormittag', 'früh'];
    const named = parts.map((w) => w.replace(/s$/, '')).filter((w) => DAY_PARTS.includes(w) || w === 'abend');
    if (partOfDay && named.some((w) => (MORNING.includes(partOfDay) ? !MORNING.includes(w) : w !== partOfDay))) return RESULT.WRONG;
    let small = false;
    // Section D: every word of the activity has its place. „und“ joins a second verb or a second thing; an article or a
    // preposition takes its noun; „gut“ never stands beside „gern“; a time noun takes its preposition („am Wochenende“);
    // a number is a clock time („um sieben“, „sieben Uhr“). „Ich schwimme der.“, „Ich schwimme und gern.“, „Ich schwimme
    // gut gern.“, „Wochenende spiele ich gern Fußball“ and „Ich schwimme sieben.“ name no activity.
    const PREP = new Set(['in', 'ins', 'im', 'am', 'an', 'mit', 'zu', 'zum', 'zur', 'nach', 'bei', 'beim', 'vom', 'von', 'für']);
    const TIME_NOUN_A = new Set(['wochenende', 'abend', 'morgen', 'nachmittag', 'vormittag', 'tag', 'woche', 'nacht', 'mittag']);
    const takesNoun = (j) => j < raw.length && (/^\p{Lu}/u.test(raw[j]) || DETERMINER.test(fold(raw[j])) || Boolean(lexicon?.genders?.get?.(fold(raw[j]))) || ['hause'].includes(fold(raw[j])));
    // The frame's own word after the gap counts too („Ich … gern.“: „Ich schwimme gut gern“).
    const after = fold(wordsOf(String(frameTail || '').replace(/[.,!?;:]/g, ' '))[0] || '');
    for (let i = 1; i < raw.length; i += 1) {
      const f = fold(raw[i]);
      const prev = fold(raw[i - 1]);
      const next = fold(raw[i + 1] || after);
      if (['und', 'oder'].includes(f) && !(i + 1 < raw.length && (ichForm(raw[i + 1]) || takesNoun(i + 1) || PREP.has(next)))) return RESULT.WRONG;
      // Right after the verb „und“ joins a second verb („Ich spiele und singe“), never a thing („Ich spiele und Fußball“).
      if (['und', 'oder'].includes(f) && i === 1 && !ichForm(raw[i + 1] || '')) return RESULT.WRONG;
      // „am“, „im“, „zum“ … have their article in them („am der Fußball“); an article fits its noun („der Wochenende“).
      if (['am', 'im', 'ins', 'zum', 'zur', 'beim', 'vom'].includes(f) && DETERMINER.test(next)) return RESULT.WRONG;
      // What one does takes the accusative („Ich spiele den Fußball“, never „der Fußball“); after a preposition the dative too.
      const AFTER_PREP = { der: ['die'], die: ['die', 'pl'], das: ['das'], den: ['der', 'pl'], dem: ['der', 'das'], ein: ['das'], eine: ['die'], einen: ['der'], einem: ['der', 'das'], einer: ['die'] };
      const OBJECT = { die: ['die', 'pl'], das: ['das'], den: ['der'], ein: ['das'], eine: ['die'], einen: ['der'] };
      const genderOf = /^\p{Lu}/u.test(raw[i + 1] || '') ? lexicon?.genders?.get?.(next) : null;
      const fits = (PREP.has(prev) ? AFTER_PREP : OBJECT)[f];
      if (DETERMINER.test(f) && /^(?:der|die|das|den|dem|ein|eine|einen|einem|einer)$/.test(f) && genderOf && !(fits || []).some((g) => genderOf.includes(g))) return RESULT.WRONG;
      // „am“ with a piece of furniture or a person names no time of an activity („Am Tisch spiele ich Fußball“).
      if (f === 'am' && ['furniture', 'family'].includes(taughtKind(next))) return RESULT.WRONG;
      // „und“ before a thing joins two things („Fußball und Tennis“), never an adverb and a thing („gern und Fußball“).
      if (['und', 'oder'].includes(f) && /^\p{Lu}/u.test(raw[i + 1] || '') && !ichForm(raw[i + 1]) && !/^\p{Lu}/u.test(raw[i - 1])) return RESULT.WRONG;
      // (The last part of a verb of two parts is no article: „Ich kaufe ein“, „Ich stehe um sechs auf“.)
      const prefixLast = SEP_PREFIX.includes(f) && i === raw.length - 1;
      if (!prefixLast && (DETERMINER.test(f) || PREP.has(f)) && !takesNoun(i + 1) && !(PREP.has(f) && (DETERMINER.test(next) || clockOf(next) !== null))) return RESULT.WRONG;
      if (f === 'gut' && (['gern', 'gerne'].includes(prev) || ['gern', 'gerne'].includes(next))) return RESULT.WRONG;
      if (TIME_NOUN_A.has(f) && /^\p{Lu}/u.test(raw[i]) && !(PREP.has(prev) || DETERMINER.test(prev) || ['jeden', 'jede', 'jedes', 'ganzen', 'ganze', 'nächste', 'nächstes', 'nächsten', 'diese', 'dieses', 'diesen'].includes(prev))) return RESULT.WRONG;
      if ((/^\d+$/.test(f) || (isNumberWord(f) && !CLOSED.has(f))) && !['um', 'bis', 'ab', 'gegen', 'halb', 'viertel', 'nach', 'vor'].includes(prev) && next !== 'uhr') return RESULT.WRONG;
      if (['und', 'oder'].includes(fold(raw[i - 1])) && ichForm(raw[i])) { if (unsplit(raw[i])) return RESULT.WRONG; continue; }
      // A second verb of the person needs its „und“ („Ich dusche frühstücke“, „Ich dusche der frühstücke“; section D).
      if (/^\p{Ll}/u.test(raw[i]) && lexicon?.verbs?.has?.(f) && /e$/.test(f) && ichForm(raw[i])) return RESULT.WRONG;
      // „in" before a der- or das-noun needs its article („ins Kino", „im Park"): „in Kino" is wrong
      // (third corpus of Lektion 7). A place without an article („in Bremen") is fine.
      if (fold(raw[i - 1]) === 'in') {
        const g = lexicon?.genders?.get?.(f);
        if (g && g.every((x) => x === 'der' || x === 'das')) return RESULT.WRONG;
      }
      // What one does is no taught person or furniture („Ich spiele gern Tisch“; Rule 5) unless a preposition or an
      // article stands before it („mit meinem Bruder“); a day alone may be a time („Ich spiele Montag“): BEYOND.
      if (/^\p{Lu}/u.test(raw[i]) && ['family', 'furniture'].includes(taughtKind(f)) && !ATTACHED.test(fold(raw[i - 1]))) return RESULT.WRONG;
      if (/^\p{Lu}/u.test(raw[i]) || ACTIVITY_GLUE.has(f)) continue;
      // A clock time and the prefix of a verb of two parts („Ich stehe um sechs auf und dusche“, Lektion 11).
      if (['um', 'uhr', 'halb', 'viertel'].includes(f) || SEP_PREFIX.includes(f) || clockOf(f) !== null) continue;
      // A noun the course teaches, written small („am wochenende"), is a typo (first corpus of Lektion 7).
      if (lexicon?.genders?.get?.(f)) { small = true; continue; }
      return RESULT.WRONG;
    }
    // One time, or two joined by „und“ („Ich spiele Montag am Wochenende Fußball“ names two; section D).
    const times = parts.filter((w) => DAYS.includes(w.replace(/s$/, '')) || TIME_NOUN_A.has(w)).length;
    if (times > 1 && !parts.includes('und') && !parts.includes('oder')) return RESULT.WRONG;
    const things = raw.slice(1).filter((w, i) => /^\p{Lu}/u.test(w) && !ATTACHED.test(fold(raw[i])));
    if (things.length && things.every((w) => taughtKind(w) === 'day')) return BEYOND;
    return small ? RESULT.TYPO : RESULT.CORRECT;
  }
  // A place: an optional article („aus der Türkei"), then the place, which may be followed by „und …"
  // or „, …" („aus Marokko und wohne in Bremen", the scene's own line). „aus in Bremen" names none.
  if (slot === 'place') {
    // After „aus" and „in" a place takes the dative: „aus der Türkei", „aus dem Irak", „aus den USA",
    // „in der Schweiz", never „aus die Deutschland"; a place the course names has no article („in der Bremen").
    // A listed place keeps the article the course teaches it with: none for Bremen or Marokko, „die
    // Schweiz" → „in der Schweiz" (and so „in Schweiz" is wrong).
    const DATIVE = ['der', 'dem', 'den'];
    const DATIVE_OF = { die: 'der', der: 'dem', das: 'dem', pl: 'den' };
    // A country that always has its article keeps it (`COUNTRY_ARTICLE`): „aus der Türkei“, never „aus Türkei“.
    const taughtArticle = (w) => (typeof lexicon?.genders?.get === 'function' ? lexicon.genders.get(w) : undefined) || (COUNTRY_ARTICLE[w] ? [COUNTRY_ARTICLE[w]] : undefined);
    if (!DATIVE.includes(parts[0]) && COUNTRY_ARTICLE[parts[0]]) return RESULT.WRONG;
    if (DATIVE.includes(parts[0]) && COUNTRY_ARTICLE[parts[1]] && DATIVE_OF[COUNTRY_ARTICLE[parts[1]]] !== parts[0]) return RESULT.WRONG;
    if (['die', 'das'].includes(parts[0])) return RESULT.WRONG;
    if (DATIVE.includes(parts[0]) && near(parts[1] || '', slotWords)) {
      const g = taughtArticle(parts[1]) || [];
      if (!g.some((x) => DATIVE_OF[x] === parts[0])) return RESULT.WRONG;
    }
    if (!DATIVE.includes(parts[0]) && near(parts[0] || '', slotWords) && taughtArticle(parts[0])) return RESULT.WRONG;
    const offset = DATIVE.includes(parts[0]) ? 1 : 0;
    const head = parts.slice(offset);
    const end = head.findIndex((w) => w === 'und' || w.endsWith(','));
    const place = (end < 0 ? head : head.slice(0, end + (head[end]?.endsWith(',') ? 1 : 0))).map((w) => w.replace(/,$/, ''));
    // `only`: a place named must be the one of this sitting (Lektion 10's journey; second DaF review).
    if (only && !only.some((o) => fold(o) === place.join(' '))) return RESULT.WRONG;
    if (!place.length || !place.every(fits) || place.some(notPlace)) return RESULT.WRONG;
    if (end < 0) return RESULT.CORRECT;
    // What follows the place is graded on its own (Rule 1): another place („und Deutschland“) or a clause („und wohne
    // in Bremen“, verified; „und ich ist Student“, WRONG).
    const rest = raw.slice(offset + end + (head[end].endsWith(',') ? 1 : 0));
    const more = rest.filter((w) => !['und', 'oder'].includes(fold(w)));
    if (more.length && more.every((w) => fits(fold(w).replace(/[,.]$/, '')) && !personsOf(w, lexicon))) return RESULT.CORRECT;
    return restResult(lexicon, rest.join(' '), subject, frameHead);
  }
  // A job: an optional article („eine Studentin", German though the course teaches it without), then
  // the job, which may be followed by where („Student in Bremen", „Lehrer von Beruf"). „Ich bin ledig"
  // and „Lehrer Bremen" name no job.
  if (slot === 'job') {
    // The article agrees with a job the course teaches: its feminine ends in -in („eine Lehrerin", „ein Lehrer").
    const taught = slotWords.find((w) => fold(w) === parts[1]);
    if (taught && ['ein', 'eine'].includes(parts[0]) && ((parts[0] === 'eine') !== /in$/.test(fold(taught)))) return RESULT.WRONG;
    const ownJob = !taught && ['ein', 'eine'].includes(parts[0]) && parts[1] ? parts[1].replace(/,$/, '') : null;
    const jobReadings = ownJob ? ownReadings(ownJob) || (JOB_SHAPE_FOLDED.test(ownJob) ? [FEMININE_JOB.test(ownJob) ? 'die' : 'der'] : null) : null;
    if (jobReadings && !jobReadings.some((g) => (g === 'die') === (parts[0] === 'eine'))) return RESULT.WRONG;
    const offset = ['ein', 'eine'].includes(parts[0]) ? 1 : 0;
    const head = parts.slice(offset);
    const end = head.findIndex((w) => ['in', 'im', 'bei', 'beim', 'an', 'am', 'und', 'aus', 'von', 'für', 'mit'].includes(w) || w.endsWith(','));
    const job = (end < 0 ? head : head.slice(0, end + (head[end]?.endsWith(',') ? 1 : 0))).map((w) => w.replace(/,$/, ''));
    // One job: „Ich bin Lehrer Student" names two.
    const listed = job.filter((w) => near(w, slotWords)).length;
    if (!(job.length && job.every(fits) && listed <= 1 && (end < 0 || head.length > end + 1))) return RESULT.WRONG;
    if (end < 0) return RESULT.CORRECT;
    // Where („in Bremen“, „bei Siemens“, „von Beruf“) up to „und“, a comma or a verb; what follows is graded on its own (Rule 1).
    let from = offset + end + (head[end] === 'und' ? 0 : 1);
    if (!head[end].endsWith(',') && head[end] !== 'und') {
      while (from < raw.length && !['und', 'oder'].includes(fold(raw[from])) && !(/^\p{Ll}/u.test(raw[from]) && personsOf(raw[from], lexicon))) {
        from += 1;
        if (/,$/.test(raw[from - 1])) break;
      }
      // The where itself (section D): „von“ takes „Beruf“; another preposition an article or none and a name, a place
      // or a noun, never a day, a number or a piece of furniture („Lehrer von Tisch Beruf“, „Lehrer in Montag“).
      const where = raw.slice(offset + end + 1, from).map((w) => w.replace(/[,.]$/, ''));
      const words = DETERMINER.test(fold(where[0] || '')) ? where.slice(1) : where;
      const placeWord = (w) => /^\p{Lu}/u.test(w) && !['day', 'number', 'furniture'].includes(taughtKind(w));
      if (head[end] === 'von' ? where.map(fold).join(' ') !== 'beruf' : where.map(fold).includes('beruf') || !(words.length >= 1 && words.length <= 2 && words.every(placeWord))) return RESULT.WRONG;
    }
    return restResult(lexicon, raw.slice(from).join(' '), subject, frameHead);
  }
  // A second clause may follow after „und" when it opens with a verb the course teaches AND is itself
  // a valid answer of the same kind: „Ich spreche Arabisch und lerne Deutsch." — never „… und lerne
  // Studentin" (DaF review, 2026-11-19: no blanket rule; the whole answer must be valid).
  const verbs = lexicon?.verbs;
  // (A verb written small: „und Kochen“ names a hobby, „und koche“ opens a clause.)
  const clause = parts.findIndex((w, i) => w === 'und' && i > 0 && typeof verbs?.has === 'function' && verbs.has(parts[i + 1] || '') && /^\p{Ll}/u.test(raw[i + 1] || ''));
  const own = clause > 0 ? words.split(' ').filter(Boolean).slice(0, clause).join(' ') : words;
  const second = clause > 0 ? words.split(' ').filter(Boolean).slice(clause + 2).join(' ') : null;
  // Lists of languages or colours: every item listed is of the kind (or a word like „gut", „ein
  // bisschen", „hell"), and at least one is affirmed, not only „kein Deutsch". „Deutsch und Marokko"
  // lists a country; „blau und Tisch" a thing.
  if (slot === 'language' || slot === 'color') {
    const MODIFIERS = new Set(slot === 'language'
      ? ['gut', 'sehr', 'ein', 'bisschen', 'wenig', 'etwas', 'auch', 'nur', 'noch', 'perfekt', 'fliessend', 'kein', 'nicht']
      : ['hell', 'dunkel', 'sehr', 'ganz', 'auch', 'nur', 'nicht']);
    // A language may be the learner's own (Kurdisch); a colour is one of the closed class.
    const ofKind = slot === 'color' ? (w) => isColour(w, slotWords) : fits;
    const listOk = (text) => {
      // A closing „gut“ says how the whole list is spoken („Ich spreche Arabisch und Deutsch gut“, „… nicht gut“).
      const closing = slot === 'language' ? String(text).replace(/\s+(?:(?:sehr|nicht|ganz)\s+)?gut$/i, '') : text;
      const groups = listItems(closing.split(' ').map(fold).join(' '));
      if (!groups) return false;
      // A modifier stands before its word („gut Arabisch“, „ein bisschen Deutsch“), never after it or between two items
      // („Arabisch gut und Deutsch“, „Arabisch nicht und Deutsch“; section D), and a language is denied with „kein“.
      const before = (g) => slot !== 'language' || g.findIndex((w) => !MODIFIERS.has(w)) === g.length - 1;
      const ok = groups.every((g) => g.some((w) => !MODIFIERS.has(w)) && g.every((w) => MODIFIERS.has(w) || ofKind(w)) && before(g) && !(slot === 'language' && g.includes('nicht')));
      return groups.length > 0 && ok && groups.some((g) => !g.some((w) => ['kein', 'nicht'].includes(w)));
    };
    return listOk(own) && (second === null || (second && listOk(second))) ? RESULT.CORRECT : RESULT.WRONG;
  }
  // A du-question about an activity, the whole sentence: a verb in its du-form („Spielst", „Kochst",
  // „Tanzt" after -z), „du", then what the activity names („Spielst du gern Fußball?", „Gehst du gern
  // ins Kino?"). „Spielt du …" and „Spielen du …" are wrong (second DaF review of Lektion 7, 2026-11-20).
  if (slot === 'duQuestion') {
    const v = fold(raw[0] || '');
    const duForm = /st$/.test(v) || /[sßxz]t$/.test(v);
    if (!duForm || v.length < 4 || CLOSED.has(v) || lexicon?.genders?.get?.(v) || fold(raw[1] || '') !== 'du' || unsplit(v)) return RESULT.WRONG;
    const rest = raw.slice(2); // may be empty: „Tanzt du?"
    // „machen“ names what is done („Machst du gern Sport?“): „Machst du gern?“, „… am Wochenende?“ ask nothing (section D).
    const TIMES = ['wochenende', 'abend', 'morgen', 'tag', 'woche', 'nachmittag', 'vormittag'];
    if (/^mach/.test(v) && !rest.some((w, k) => /^\p{Lu}/u.test(w) && !TIMES.includes(fold(w)) && !DAYS.includes(fold(w).replace(/s$/, '')) && !['am', 'um', 'im'].includes(fold(rest[k - 1] || '')))) return RESULT.WRONG;
    const ok = rest.every((w) => /^\p{Lu}/u.test(w) || ACTIVITY_GLUE.has(fold(w)) || SEP_PREFIX.includes(fold(w)) || ['gern', 'gerne', 'auch'].includes(fold(w)));
    return ok ? RESULT.CORRECT : RESULT.WRONG;
  }
  // Hobbies: each a hobby the course teaches („Sport", „Musik", „Kochen") or a noun of the learner's own
  // („Yoga"), with an optional article, or a noun with its verb („Fußball spielen"); „Mein Hobby ist
  // gut" names none.
  if (slot === 'hobby') {
    const groups = listItems(own) || [];
    // A taught noun of another kind is no hobby („Mein Hobby ist Montag“, „… ist Tisch“; Rule 5).
    const noun = (w) => near(fold(w), slotWords) || (/^\p{Lu}/u.test(w) && !known(fold(w)) && !CLOSED.has(fold(w)))
      || (/^\p{Lu}/u.test(w) && Boolean(lexicon?.genders?.get?.(fold(w))) && !NOT_DONE.includes(taughtKind(w)));
    const NOMINATIVE = { der: ['der', 'mein'], die: ['die', 'meine'], das: ['das', 'mein'], pl: ['die', 'meine'] };
    const hobby = (g) => {
      const det = g.length > 1 && ['das', 'der', 'die', 'mein', 'meine'].includes(fold(g[0])) ? fold(g[0]) : null;
      const ws = det ? g.slice(1) : g;
      // A taught noun keeps its own article („Mein Hobby ist die Musik“, never „das Musik“; the third score).
      const readings = det ? lexicon?.genders?.get?.(fold(ws[0])) : null;
      if (readings && !readings.some((x) => NOMINATIVE[x].includes(det))) return false;
      if (ws.length === 1) return noun(ws[0]);
      return ws.length === 2 && noun(ws[0]) && /^\p{Ll}\p{L}*en$/u.test(ws[1]);
    };
    if (!(groups.length && groups.every(hobby))) return RESULT.WRONG;
    return clause > 0 ? worst(RESULT.CORRECT, restResult(lexicon, words.split(' ').filter(Boolean).slice(clause).join(' '), subject, frameHead)) : RESULT.CORRECT;
  }
  // A name („Ich bin Omar", as Lektion 1's own check takes it): words the course does not teach, or the
  // cast's names, after an optional „Frau"/„Herr" („Hier ist Frau Chakiri"). After the first name word a
  // surname may be a word the course teaches only in lower case („Ana Braun", „Frau Braun": the colour braun); the
  // first word may not, so „Gut" or „Danke" alone is no name.
  if (slot === 'name') {
    // The partner's own name is never the learner's: „Guten Tag, Herr Weber." greets, it names nobody.
    const family = partner?.split(/\s+/).at(-1);
    if (partner && [partner, family, `Herr ${family}`, `Frau ${family}`].some((x) => fold(words) === fold(x))) return RESULT.WRONG;
    const names = lexicon?.names;
    const exact = lexicon?.exact;
    const from = ['frau', 'herr'].includes(parts[0]) && parts.length > 1 ? 1 : 0;
    // Section D: a word the course says is no name („heiße Omar“, „hallo, Omar“), and a comma ends no name of its own.
    const bareName = (w) => String(w).replace(/[,.!?;:]+$/, '');
    const isName = (written, w, i) => /\p{L}/u.test(w) && !CLOSED.has(w) && !isNumberWord(w)
      && (names?.has?.(w) || (!known(w) && !(i === from && personsOf(w, lexicon))) || (i > 0 && /^\p{Lu}/u.test(written) && typeof exact?.has === 'function' && !exact.has(written)));
    const rest = raw.slice(from);
    // A thing is no first name („Ich heiße Banane“) and a word said twice is none either („Banane Banane“): a surname may
    // be one („Anna Vogel“). Not certain enough to be called wrong, so `typedResult` makes it BEYOND.
    const folded = rest.map((r) => fold(bareName(r)));
    if ((from === 0 && NO_NAME.has(folded[0])) || new Set(folded).size < folded.length) return RESULT.WRONG;
    return rest.length && rest.every((r, i) => isName(bareName(r), bareName(parts[from + i]), from + i)) ? RESULT.CORRECT : RESULT.WRONG;
  }
  // `thing`: things one buys or needs, each with the article the verb asks for (the Akkusativ the course copies
  // as a chunk): „den Stuhl", „einen Computer", „die Lampe", „ein Telefon", „zwei Stühle". A noun the
  // course teaches must carry its own article („der Stuhl", „ein Computer" are wrong here); a noun it
  // never teaches is the learner's own and takes any article.
  // `object` is the same with the article of the subject („Das ist ein Buch", „Das ist der Stift",
  // „Das ist meine Schere"): „Das ist ein Schere" names the wrong gender. A frame may say how many it
  // names (`count`): „Das ist …" one thing, „Das sind …" more (DaF review, 2026-11-19), so „Das sind
  // ein Stift" is wrong. A mass noun stands without an article („Das ist Papier", „Ich brauche Wasser").
  if (slot === 'thing' || slot === 'object') {
    const genders = lexicon?.genders;
    const ARTICLE = slot === 'thing'
      ? { der: ['den', 'einen', 'keinen'], die: ['die', 'eine', 'keine'], das: ['das', 'ein', 'kein'], pl: ['die', 'keine'] }
      // Every possessive of Lektion 12 („meine Mama“, „mein Bruder und seine Frau“, „unsere Gäste“).
      : { der: ['der', 'ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer'], die: ['die', 'eine', 'keine', 'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure'],
        das: ['das', 'ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer'], pl: ['die', 'keine', 'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure'] };
    const ALL = new Set(Object.values(ARTICLE).flat());
    const items = listItems(own) || [];
    // A noun the course never teaches is the learner's own when it is written as a noun: „Ich kaufe
    // Bananen", „eine Banane"; „Ich kaufe groß" names no thing (courses session, 2026-11-20). After an
    // article a small first letter is a typo („eine banane").
    let typo = false;
    let ambiguous = false;
    // Each item read as one thing or as more; null when it is no thing at all. A colour or another
    // adjective may stand before the noun with the ending the article asks for („die rote Lampe", „die große
    // Lampe", never „die roten Lampe").
    const itemReading = (whole) => {
      // „mit/ohne …" may follow a food or drink („Kaffee mit Milch", „Tee ohne Zucker"): a noun with an
      // optional article.
      const cut = whole.findIndex((w, i) => i > 0 && ['mit', 'ohne'].includes(fold(w)));
      const item = cut > 0 ? whole.slice(0, cut) : whole;
      if (cut > 0) {
        const after = whole.slice(cut + 1);
        const noun = after.at(-1) || '';
        if (!after.length || after.length > 2 || !(/^\p{Lu}/u.test(noun) || genders?.get?.(fold(noun)))) return null;
      }
      const [first, ...more] = item.map(fold);
      const counted = /^\d+$/.test(numberWordsToDigits(first)) && Number(numberWordsToDigits(first)) >= 2;
      const det = ALL.has(first) || counted ? first : null;
      const rest = det ? more : item.map(fold);
      const restRaw = det ? item.slice(1) : item;
      const adj = rest.length === 2 ? rest[0] : null;
      const noun = adj ? rest[1] : rest[0];
      const nounRaw = adj ? restRaw[1] : restRaw[0];
      if (!noun || !/\p{L}/u.test(noun) || CLOSED.has(noun) || rest.length > 2) return null;
      // A day or a number is no thing („Ich kaufe einen Montag“, „einen sieben“; section D).
      if (['day', 'number'].includes(taughtKind(noun))) return null;
      // What the turn is about: never a taught thing of another kind (`thingKind`: no „Kuchen“, „Tisch“ or „Bruder“ for
      // a drink; Rule 5), and with `only`, the thing offered or its measure („Ja, ein Glas, bitte" for water; never
      // „Ja, einen Kaffee, bitte"). First DaF review of Lektion 9, 2026-11-20.
      if (otherThing(noun, thingKind, lexicon)) return null;
      if (only && !only.some((n) => fold(n) === noun) && MEASURE_GENDER[noun] === undefined) return null;
      // A polite decline names what it does not want („keinen Kuchen", „kein Kuchen"): a „kein-" article.
      if (negative && !/^kein/.test(det || '')) return null;
      // Elsewhere a „kein-" names nothing bought, needed, taken or shown: „Ich kaufe keine Uhr", „Ich
      // möchte kein Wasser" for the water offered (the honest-none rule above `checkTurns`).
      if (!negative && /^kein/.test(det || '')) return null;
      // A measure and its content: the article agrees with the measure („ein Glas Wasser", „eine Tasse
      // Tee", „zwei Tassen Kaffee"), and the content is a noun („ein Glas groß" is none).
      const measure = adj ? MEASURE_GENDER[adj] : undefined;
      if (measure) {
        const contentOk = /^\p{Lu}/u.test(nounRaw) || Boolean(genders?.get?.(noun));
        const articleOk = measure === 'pl' ? (counted || (det && ARTICLE.pl.includes(det))) : (det ? !counted && ARTICLE[measure].includes(det) : false);
        if (!contentOk || !articleOk) return null;
        return measure === 'pl' ? 'many' : 'one';
      }
      const adjRaw = adj ? restRaw[0] : null;
      if (adj && !colourStem(adj.replace(/(e|en|er|es)$/, '')) && !colourStem(adj) && !isAdjectiveShape(adjRaw, lexicon)) return null;
      const detKey = counted || !det ? '' : det;
      const adjOk = (g) => !adj || adjectiveFits(adjRaw, slot, detKey, g, lexicon);
      const readings = typeof genders?.get === 'function' ? genders.get(noun) : undefined;
      if (readings) {
        if (people && !PEOPLE.has(noun)) return null;
        const fit = readings.filter((g) => adjOk(g) && (g === 'pl' ? (!det || counted || ARTICLE.pl.includes(det))
          : (det ? !counted && ARTICLE[g].includes(det) : MASS.has(noun) && !adj)));
        if (!fit.length) return null;
        // A bare noun whose plural is the same word („Computer“, „Lehrer“) may be one without its article: BEYOND.
        if (!det && !adj && fit.includes('pl') && readings.some((g) => g !== 'pl') && !MASS.has(noun)) ambiguous = true;
        return fit.every((g) => g === 'pl') ? 'many' : fit.includes('pl') ? 'either' : 'one';
      }
      // A person of the story is someone too („Lena und Tim kommen“; Lektion 12's guests).
      // Only where the turn asks for people (`people`): „Das ist Lena.“ names no thing from the bag (the second score).
      if (people && !det && !adj && lexicon?.names?.has?.(noun) && /^\p{Lu}/u.test(nounRaw)) return 'one';
      if (known(noun)) return null; // a taught word that is no noun names no thing
      const own = /^\p{Lu}/u.test(nounRaw) ? ownReadings(noun) : null;
      const genderOk = (det && !counted && own ? own : ['der', 'die', 'das', 'pl']).filter((g) => (g === 'pl' ? (!det || counted || ARTICLE.pl.includes(det)) : det && !counted && ARTICLE[g].includes(det)) && adjOk(g));
      if (!genderOk.length) return null;
      if (!/^\p{Lu}/u.test(nounRaw)) {
        // A word the course says, written small and no noun of it, is no thing („Ich möchte sieben nehmen“; Rule 5).
        if (!det || lexicon?.said?.has?.(noun)) return null;
        typo = true;
      }
      if (!det && !thingKind && /^\p{Lu}/u.test(nounRaw) && own && !own.includes('pl') && !OWN_MASS.has(noun)) ambiguous = true; // „Ich brauche Tastatur“
      return counted ? 'many' : 'either';
    };
    const read = items.map(itemReading);
    if (!items.length || read.some((r) => r === null)) return RESULT.WRONG;
    if (count === 'one' && (items.length > 1 || read[0] === 'many')) return RESULT.WRONG;
    if (count === 'many' && items.length === 1 && read[0] === 'one') return RESULT.WRONG;
    // A clause after „und“ + a verb is graded on its own, never left out („einen Kaffee und kaufen“; section D).
    const done = ambiguous ? BEYOND : typo ? RESULT.TYPO : RESULT.CORRECT;
    if (clause > 0) return worst(done, restResult(lexicon, words.split(' ').filter(Boolean).slice(clause).join(' '), subject, frameHead));
    return done;
  }
  const content = parts.filter((w) => /\p{L}/u.test(w) && !CLOSED.has(w));
  return content.length ? RESULT.CORRECT : RESULT.WRONG;
}

/**
 * The items of a list („Arabisch und Deutsch“, „den Stuhl, die Uhr“), or null where „und“, „oder“ or a comma joins
 * nothing on one side („und einen Kaffee“, „meine Mama und mein Papa und“; section D).
 */
function listItems(text) {
  const groups = String(text).split(/\s*(?:,|\bund\b|\boder\b)\s*/i).map((g) => g.split(' ').filter(Boolean));
  return groups.length > 1 && groups.some((g) => !g.length) ? null : groups.filter((g) => g.length);
}

const RANK = { [RESULT.WRONG]: 0, [BEYOND]: 0.5, [RESULT.TYPO]: 1, [RESULT.CORRECT]: 2 };
const best = (results) => results.reduce((a, r) => (RANK[r] > RANK[a] ? r : a), RESULT.WRONG);
const worst = (a, b) => (RANK[a] < RANK[b] ? a : b);

/**
 * One own answer against one frame („Ich komme aus …"): the learner's words in the gap are copied
 * into the frame, and the shared checker grades the rest — so a slip in „komme" is the same typo
 * and „Ich kommen aus" the same wrong ending it is everywhere else in the course.
 */
function frameResult(frame, value, turn) {
  if (frame.split(GAP).length === 3) return twoGapResult(frame, value, turn);
  const [head, tail = ''] = frame.split(GAP).map((s) => s.trim());
  const given = wordsOf(String(value || '').normalize('NFC').trim().replace(END, ''));
  // A comma right after the gap („…, guten Tag") is no word of the frame.
  const counted = (s) => wordsOf(s).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const before = counted(head);
  const after = counted(tail.replace(END, ''));
  if (given.length <= before + after) return RESULT.WRONG;
  const own = given.slice(before, given.length - after).join(' ');
  const gap = gapResult(own.replace(/[.,!?]+$/, ''), { ...turn, subject: subjectFor(head, turn.lexicon), frameHead: head, frameTail: tail });
  if (gap === RESULT.WRONG) return RESULT.WRONG;
  return worst(gap, checkLoose(value, [[head, own, tail].filter(Boolean).join(' ')]));
}

// The subject a clause after the gap has when it has none of its own („Sie kommt aus Marokko und …“ → er/sie, one person).
function subjectFor(head, lexicon) {
  const words = wordsOf(String(head || ''));
  for (const w of words) {
    const p = personsOf(w, lexicon);
    if (p) return { '1s': 'ich', '2s': 'du', '3s': 'er', '1p': 'wir', '2p': 'ihr', '3p': 'Sie' }[p.find((x) => x !== 'inf')] || 'ich';
  }
  return PERSON_OF[fold(words[0] || '')] ? fold(words[0]) : 'ich';
}

/**
 * A frame with two gaps around fixed words („… bin ich … frei." for „Am Dienstag bin ich abends frei."):
 * the first gap is everything before the middle words, the second (which may be empty) what follows
 * them up to the end words. A `when` gap reads both as one time („am Dienstag … abends"); any other
 * kind grades each gap that is not empty.
 */
function twoGapResult(frame, value, turn) {
  const [head, mid, tail] = frame.split(GAP).map((s) => s.trim());
  const given = wordsOf(String(value || '').normalize('NFC').trim().replace(END, ''));
  const plainWords = (s) => wordsOf(s.replace(END, '')).filter((w) => /[\p{L}\p{N}]/u.test(w)).map((w) => fold(w).replace(/[.,!?]+$/, ''));
  const [h, m, t] = [plainWords(head), plainWords(mid), plainWords(tail)];
  const g = given.map((w) => fold(w).replace(/[.,!?]+$/, ''));
  if (given.length < h.length + m.length + t.length + 1) return RESULT.WRONG;
  for (let at = h.length + 1; at + m.length + t.length <= given.length; at += 1) {
    if (!m.every((w, i) => g[at + i] === w)) continue;
    const first = given.slice(h.length, at).join(' ');
    const second = given.slice(at + m.length, given.length - t.length).join(' ');
    const strip = (s) => s.replace(/[.,!?]+$/, '');
    let gap;
    // An „um" or „am" of the frame before a gap belongs to the time („… stehe ich um … auf", „Um … stehe ich … auf"):
    // „Um Montag stehe ich auf“ names no time (Rule 5, each gap by its own kind).
    const glue = ['um', 'am'].includes(m.at(-1)) ? `${m.at(-1)} ` : '';
    const lead = ['um', 'am'].includes(h.at(-1)) ? `${h.at(-1)} ` : '';
    // Each gap is a time of its own: none begins or ends with „und“ („am Montag habe ich und Montag Zeit“; section D).
    const joins = (x) => /^(?:und|oder)\b|\b(?:und|oder)$/i.test(strip(x).trim());
    if (turn.slot === 'when' && (joins(first) || (second && joins(second)))) continue;
    if (turn.slot === 'when') gap = gapResult(strip(`${lead}${first} ${second ? glue + second : ''}`.trim()), { ...turn, inSentence: true });
    else gap = worst(gapResult(strip(first), turn), second ? gapResult(strip(second), turn) : RESULT.CORRECT);
    if (gap === RESULT.WRONG) continue;
    const model = [head, first, mid, second, tail].filter(Boolean).join(' ');
    return worst(gap, checkLoose(value, [model]));
  }
  return RESULT.WRONG;
}

/**
 * The shared checker, and then once more for a learner who typed without umlauts or ß („wie spat ist
 * es", „ich moechte"): a phone keyboard without them. A match that way is a typo. Only when the answer
 * has no umlaut at all, so „meine Mütter" for „meine Mutter" stays a different word.
 */
function checkLoose(value, accepted, options) {
  const result = checkAnswer(value, accepted, options).result;
  if (result !== RESULT.WRONG || /[äöüß]/i.test(String(value))) return result;
  const loose = (s) => String(s).normalize('NFC').replace(/ä/g, 'a').replace(/Ä/g, 'A').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ß/g, 'ss');
  const typed = String(value).replace(/([aouAOU])e/g, '$1');
  const again = checkAnswer(typed, accepted.map(loose), options).result;
  return again === RESULT.WRONG ? (checkAnswer(value, accepted.map(loose), options).result === RESULT.WRONG ? RESULT.WRONG : RESULT.TYPO) : RESULT.TYPO;
}

/** An accepted answer is a string, or `{ frame, slot, … }` when one frame's gap differs from the turn's. */
const frameOf = (a) => (typeof a === 'string' ? a : a.frame);

/** One sentence against the turn's answers: fixed ones through the shared checker, own ones through their frame. */
function sentenceResult(accepted, value, turn) {
  const fixed = accepted.filter((a) => typeof a === 'string' && !hasGap(a));
  return best([
    ...(fixed.length ? [turn.spell ? checkAnswer(value, fixed, { spelling: true }).result : checkLoose(value, fixed)] : []),
    ...accepted.filter((a) => hasGap(frameOf(a))).map((a) => frameResult(frameOf(a), value, typeof a === 'string' ? turn : { ...turn, ...a })),
  ]);
}

// A message may open with a greeting and close with a sign-off; neither is graded.
const GREETING = /^(hallo|guten (morgen|tag|abend)|sehr geehrte|liebe|lieber|viele grüße|liebe grüße|(mit )?(freundlichen|besten|schönen) grüßen|beste grüße|freundliche grüße|vielen dank|tschüss|bis morgen|danke)\b/i;

/**
 * A short written message: every part in a sentence of its own, any order; nothing else but a
 * greeting or sign-off. A greeting may open the first sentence („Guten Tag, ich heiße …") and a comma
 * may join two sentences („Ich heiße Ana, ich bin am …").
 */
function messageResult(turn, value) {
  // After a comma „ich" is rightly small, so the clause it opens is graded as a sentence of its own.
  // „Ich heiße Ali und bin am 3.5.1998 geboren" is two clauses: the second has its „ich" back.
  // The full stop of a day („am 12. März", „am 1. 3. 1990") does not end the sentence.
  const pieces = String(value || '').split(/(?<=[.!?])\s+|\n+/).reduce((acc, p) => {
    const last = acc[acc.length - 1];
    if (last && /(^|\s)\d{1,2}\.$/.test(last) && (/^\d/.test(p) || monthOf(p.split(/\s+/)[0]))) acc[acc.length - 1] = `${last} ${p}`;
    else acc.push(p);
    return acc;
  }, []);
  // A letter's greeting and its sign-off with the name are no sentences of the message („Sehr geehrter Herr Weber, …“,
  // „… Mit freundlichen Grüßen, Ana Chakiri“).
  const letter = pieces.map((s) => s.replace(/^(?:sehr\s+geehrte[rs]?|liebe[rs]?|hallo|guten\s+(?:morgen|tag|abend))\s*,?\s*(?:herr|frau)\s+\p{Lu}\p{L}*\s*[,!]\s*/iu, '')
    .replace(/^(?:mit\s+)?(?:viele[n]?|liebe[n]?|beste[n]?|freundliche[n]?|schöne[n]?)\s+grüße[n]?\b.*$/iu, '')).filter((s) => s.trim())
    .map((s, i) => (s === pieces[i] ? s : s.charAt(0).toLocaleUpperCase('de') + s.slice(1)));
  const sentences = letter
    .flatMap((s) => s.split(/,\s+(?=(?:ich|mein|meine|am)\b)/i).map((c, i) => (i ? c.charAt(0).toLocaleUpperCase('de') + c.slice(1) : c)))
    .flatMap((s) => s.split(/\s+und\s+(?=(?:ich|bin|wohne|komme|mein|meine)\b)/i).map((c, i) => (i && /^(bin|wohne|komme)\b/i.test(c) ? `Ich ${c}` : (i ? c.charAt(0).toLocaleUpperCase('de') + c.slice(1) : c))))
    .map((s) => s.trim()).filter(Boolean);
  const free = [...sentences];
  let result = RESULT.CORRECT;
  for (const part of turn.parts) {
    const scored = free.map((s) => sentenceResult(part, s, turn));
    const at = scored.reduce((b, r, i) => (b < 0 || RANK[r] > RANK[scored[b]] ? i : b), -1);
    if (at < 0 || scored[at] === RESULT.WRONG) return RESULT.WRONG;
    result = worst(result, scored[at]);
    free.splice(at, 1);
  }
  // What is left is a greeting, a sign-off, or more about the learner in a form the check knows (`extras`).
  const extra = (s) => GREETING.test(s.replace(/^[„"]/, '')) || (turn.extras && sentenceResult(turn.extras, s, turn) !== RESULT.WRONG);
  return free.every(extra) ? result : RESULT.WRONG;
}

// The taught adverbs that may stand in the middle or in front of a statement without changing it.
const ADVERBS = new Set(['jetzt', 'hier', 'auch', 'noch', 'schon', 'gern', 'gerne', 'heute', 'morgen', 'gestern', 'zusammen', 'immer', 'dort']);
const SUBJECTS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);

/**
 * The same statement in its basic order, when the learner put something else first or an adverb in
 * the middle (German keeps the verb second): „Ich wohne jetzt in Köln", „Jetzt wohne ich in Köln",
 * „Aus Syrien komme ich", „In Bremen wohne ich" are „Ich wohne in Köln" … with the same words. The
 * frame then grades the words as always, so „Aus Syrien ich komme" stays wrong.
 */
function verbSecond(text, { drop = false } = {}) {
  const end = (String(text).trim().match(/[.!?]+$/) || [''])[0];
  const w = wordsOf(String(text).trim().replace(/[.!?]+$/, ''));
  const out = [];
  const lower = (s) => (CLOSED.has(fold(s)) || ADVERBS.has(fold(s)) ? s.toLocaleLowerCase('de') : s);
  const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
  if (drop) {
    // An adverb after the verb or in front, left out (the tolerant grader only): „Ich wohne jetzt in Köln" → „Ich wohne in Köln".
    if (w.length >= 4 && SUBJECTS.has(fold(w[0])) && ADVERBS.has(fold(w[2]))) out.push([...w.slice(0, 2), ...w.slice(3)].join(' ') + end);
    if (w.length >= 4 && ADVERBS.has(fold(w[0])) && SUBJECTS.has(fold(w[2]))) out.push([cap(w[2]), w[1], ...w.slice(3)].join(' ') + end);
  }
  // Anything else in front, subject last: „Aus Syrien komme ich" → „Ich komme aus Syrien"; „Ein Lineal
  // ist das" → „Das ist ein Lineal".
  const last = fold(w.at(-1) || '');
  const subjectLast = SUBJECTS.has(last) || (last === 'das' && ['ist', 'sind'].includes(fold(w.at(-2) || '')));
  if (w.length >= 3 && subjectLast && !SUBJECTS.has(fold(w[0]))) out.push([cap(w.at(-1)), w.at(-2), lower(w[0]), ...w.slice(1, -2)].join(' ') + end);
  // A word in front of „ist", the subject after it: „Rot ist mein Heft" → „Mein Heft ist rot".
  if (w.length === 4 && ['ist', 'sind'].includes(fold(w[1])) && DETERMINERS.has(fold(w[2]))) out.push([cap(w[2]), w[3], w[1], w[0].toLocaleLowerCase('de')].join(' ') + end);
  // A phrase in front, the verb second and the subject right after it: „Am Wochenende spiele ich
  // Fußball" → „Ich spiele Fußball am Wochenende"; „Am Montag bin ich frei" → „Ich bin frei am Montag".
  // The verb must stand right before the subject, so „Am Wochenende ich spiele" stays wrong.
  for (let k = 2; k <= Math.min(4, w.length - 1); k += 1) {
    // A joiner moves with nothing: no phrase that ends in „und“, no „und“ right after the subject (section D).
    const joiner = (x) => ['und', 'oder'].includes(fold(x || ''));
    // („Morgens dusche ich und frühstücke“: after the subject „und“ may join a second verb.)
    if (joiner(w[k - 2]) || (joiner(w[k + 1]) && !/^\p{Ll}\p{L}+e$/u.test(String(w[k + 2] || '')))) continue;
    // One phrase stands in front: „Am Wochenende gut spiele ich …“ has two (section D).
    if (k - 1 > 1 && w.slice(0, k - 1).some((x) => ['gut', 'gern', 'gerne', 'nicht', 'und', 'oder'].includes(fold(x).replace(/[,.]$/, '')))) continue;
    if (SUBJECTS.has(fold(w[k])) && !SUBJECTS.has(fold(w[0])) && !SUBJECTS.has(fold(w[k - 1]))) {
      const front = w.slice(0, k - 1).map((x, i) => (i === 0 ? x.charAt(0).toLocaleLowerCase('de') + x.slice(1) : x));
      if (/^\p{Lu}/u.test(w[0]) && front.length) {
        const first = fold(w[0]);
        // Keep the capital of a noun in front („Fußball spiele ich gern"): only small words lose it.
        if (!CLOSED.has(first) && !ADVERBS.has(first) && !WHEN_GLUE.has(first)) front[0] = w[0];
      }
      out.push([cap(w[k]), w[k - 1], ...w.slice(k + 1), ...front].join(' ') + end);
      // …or right after the verb and its subject: „Gestern habe ich gearbeitet“ → „Ich habe gestern gearbeitet“.
      out.push([cap(w[k]), w[k - 1], ...front, ...w.slice(k + 1)].join(' ') + end);
    }
  }
  return out;
}

/**
 * „gern" may stand before what one likes to do („Ich spiele gern Fußball") or after it; the activity
 * frame „Ich … gern." reads it at the end („Ich spiele Fußball gern"). „gerne" is „gern".
 */
function gernLast(text) {
  const m = String(text).trim().match(/^(.*?)\s+gerne?\s+(.+?)([.!?]*)$/i);
  // Only a „gern" after the verb moves: „Ich gern spiele Fußball" has it before the verb and stays wrong. It moves over
  // what one likes, a noun or an article and its noun, never over „gut“ or „und“ (section D).
  const object = m && (/^\p{Lu}/u.test(m[2]) || /^(?:den|die|das|ein|eine|einen|mein|meine|meinen)\s+\p{Lu}/u.test(m[2]))
    && !/\s(?:gut|und|oder)$/i.test(m[1]);
  const out = m && object && wordsOf(m[1]).length >= 2 ? [`${m[1]} ${m[2]} gern${m[3]}`] : [];
  // After a time it is German too („Was machst du am Wochenende gern?“ is „Was machst du gern am Wochenende?“).
  const t = String(text).trim().match(/^(.*?)\s+((?:am|jeden|jede|jedes)\s+\p{L}+|\p{L}+s)\s+gerne?([.!?]*)$/iu);
  if (t && wordsOf(t[1]).length >= 2 && whenOf(t[2])) out.push(`${t[1]} gern ${t[2]}${t[3]}`);
  return out;
}

const DETERMINERS = new Set(['der', 'die', 'das', 'mein', 'meine', 'dein', 'deine', 'ihr', 'ihre', 'sein', 'seine']);
// A pronoun or demonstrative that picks up a noun, by the article the noun takes.
const PICKS_UP = { der: 'der', er: 'der', die: 'die', sie: 'die', das: 'das', es: 'das' };

/**
 * A noun named first and picked up by a pronoun („Der Stuhl, was kostet der?", „Mein Büro, wo ist
 * das?", „Mein Heft: Wo ist es?") is the question with the noun in its place („Was kostet der
 * Stuhl?"), when the pronoun fits the noun's article; „Der Stuhl, was kostet die?" fits none.
 */
function nounFirst(text, lexicon) {
  // A bare noun named first and picked up as the object („Tee? Haben Sie den?") is the question with
  // the noun in place („Haben Sie Tee?"; second corpus of Lektion 9).
  const bareNoun = String(text).trim().match(/^(\p{Lu}\p{L}*)\s*[,:?]\s*(\p{L}.*?)\s+(den|die|das|ihn)\s*\?$/u);
  if (bareNoun) {
    const readings = typeof lexicon?.genders?.get === 'function' ? lexicon.genders.get(fold(bareNoun[1])) : undefined;
    const PICK = { den: 'der', ihn: 'der', die: 'die', das: 'das' };
    if (!readings || readings.includes(PICK[fold(bareNoun[3])]) || (fold(bareNoun[3]) === 'die' && readings.includes('pl'))) {
      return [`${bareNoun[2].charAt(0).toLocaleUpperCase('de')}${bareNoun[2].slice(1)} ${bareNoun[1]}?`];
    }
    return [];
  }
  const m = String(text).trim().match(/^((?:der|die|das|mein|meine|dein|deine|ihr|ihre)\s+\p{L}+)\s*[,:?]\s*(\p{L}.*?)\s+(der|die|das|er|sie|es)\s*\?$/iu);
  if (!m) return [];
  const [det, noun] = m[1].split(/\s+/);
  const readings = typeof lexicon?.genders?.get === 'function' ? lexicon.genders.get(fold(noun)) : undefined;
  if (readings && !readings.includes(PICKS_UP[fold(m[3])])) return [];
  return [`${m[2].charAt(0).toLocaleUpperCase('de')}${m[2].slice(1)} ${det.toLocaleLowerCase('de')} ${noun}?`];
}

/**
 * A question with its question word last („Der Stuhl kostet wie viel?", „Deine Tasche hat welche
 * Farbe?") is the question in its taught order („Wie viel kostet der Stuhl?"); the words are then
 * graded as always, so „Der Stuhl kosten wie viel?" stays wrong (blind corpora, 2026-11-20).
 */
function questionWordLast(text) {
  const m = String(text).trim().match(/^(\p{L}+(?:\s+\p{L}+)?)\s+(\p{L}+)\s+(wie viel euro|wie viel|wie teuer|welche farbe|wo|wann|was|woher)\s*\?$/iu);
  if (!m) return [];
  const subject = m[1].split(/\s+/);
  const first = DETERMINERS.has(fold(subject[0])) || SUBJECTS.has(fold(subject[0])) ? subject[0].toLocaleLowerCase('de') : subject[0];
  return [`${m[3].charAt(0).toLocaleUpperCase('de')}${m[3].slice(1)} ${m[2]} ${[first, ...subject.slice(1)].join(' ')}?`];
}

// The prefixes of verbs of two parts (Lektion 11: „ein|kaufen“, „auf|stehen“): in a main clause the prefix goes to the
// end, so a finite verb that still carries it („Ich aufstehe“, „Ich einkaufe“, „Einkaufst du …?“) is wrong.
const SEP_PREFIX = ['zurück', 'fern', 'auf', 'aus', 'ein', 'mit', 'weg', 'los', 'vor', 'nach', 'her', 'hin', 'an', 'ab', 'zu'];
// Verbs that only look as if they had one.
const NOT_SEPARABLE = /^(?:antwort|angel|analys|zucker|herrsch|hinter)/;
const unsplit = (w) => { const f = fold(w); return !NOT_SEPARABLE.test(f) && /(?:e|st|t)$/.test(f) && SEP_PREFIX.some((p) => f.startsWith(p) && f.length - p.length >= 4); };

// Participles in -en of the strong verbs a learner may use at A1 (without a separable prefix), and those that take „sein“.
const STRONG_PARTICIPLES = new Set(['gegangen', 'gefahren', 'gekommen', 'geschlafen', 'gegessen', 'getrunken', 'gelesen', 'gesehen', 'geschrieben',
  'gesprochen', 'geschwommen', 'gelaufen', 'geflogen', 'geblieben', 'gewesen', 'gestanden', 'getroffen', 'genommen', 'gefunden', 'gesungen', 'gerufen',
  'gegeben', 'geworden', 'gewaschen', 'geholfen', 'gestorben', 'geboren', 'getragen', 'gehalten', 'gelegen', 'gesessen', 'geschlossen', 'gezogen',
  'bekommen', 'verstanden', 'vergessen', 'begonnen', 'verloren', 'empfohlen', 'gefallen', 'angefangen', 'gewonnen']);
const SEIN_PARTICIPLES = new Set(['gegangen', 'gefahren', 'gekommen', 'geflogen', 'gelaufen', 'geschwommen', 'geblieben', 'gewesen', 'geworden',
  'gestorben', 'gereist', 'gerannt', 'gesprungen', 'aufgestanden', 'eingeschlafen', 'aufgewacht', 'umgezogen']);
// Stems whose participle ends in -en: „geschlaft“, „gegeht“ are no participles.
const STRONG_STEMS = /^ge(?:schlaf|ess|trink|les|seh|geh|fahr|komm|schreib|sprech|schwimm|lauf|flieg|bleib|nehm|find|sing|steh|treff|ruf|geb)t$/;
/** „haben“ or „sein“ for a participle („gespielt“, „eingekauft“, „gegangen“, „telefoniert“), or null when it is none. */
function participleOf(word) {
  const f = fold(word);
  const prefix = SEP_PREFIX.find((p) => f.startsWith(`${p}ge`) && f.length > p.length + 4);
  const core = prefix ? f.slice(prefix.length) : f;
  const sein = SEIN_PARTICIPLES.has(f) || SEIN_PARTICIPLES.has(core) ? 'sein' : 'haben';
  if (/en$/.test(core)) return STRONG_PARTICIPLES.has(core) ? sein : null;
  if (/^ge\p{L}{3,}t$/u.test(core)) return STRONG_STEMS.test(core) ? null : sein;
  if (!prefix && /^(?:be|ver|er|ent|emp|zer)\p{L}{3,}t$/u.test(core)) return sein;
  if (!prefix && /\p{L}{3,}iert$/u.test(core)) return sein;
  return null;
}
// Small words inside a sentence about the past („Ich habe gestern nichts gemacht“, „… zu Hause geblieben“).
const PAST_SMALL = new Set(['gestern', 'heute', 'viel', 'lange', 'nicht', 'nichts', 'etwas', 'allein', 'hause', 'den', 'dem', 'des', 'der', 'die', 'das',
  'einen', 'einem', 'einer', 'ein', 'eine', 'meinen', 'meinem', 'meiner', 'meine', 'mein', 'mit', 'für', 'gut', 'schön', 'spät', 'früh', 'dann', 'noch', 'schon']);

// The small words of `pastMiddle`: a word alone between „habe“ and the participle.
const PAST_BARE = new Set(['gestern', 'heute', 'viel', 'lange', 'nicht', 'nichts', 'etwas', 'allein', 'gut', 'schön', 'spät', 'früh', 'dann',
  'noch', 'schon', 'auch', 'sehr', 'zusammen', 'morgens', 'vormittags', 'nachmittags', 'abends', 'immer', 'oft', 'gern', 'gerne', 'wieder', 'hier', 'dort',
  'es', 'alles']);
// What one does without an article („Sport machen“, „Pause machen“), beside the mass nouns.
const DONE_BARE = new Set(['sport', 'musik', 'pause', 'urlaub', 'yoga', 'feierabend']);
const DETERMINER = /^(?:der|die|das|den|dem|des|(?:[kmds]?ein|ihr|unser|eur)(?:e|en|em|er|es)?)$/;
// The article forms a case takes, by gender: the dative after „mit“, „bei“, „im“ …; the accusative after „für“, „ohne“.
const POSSESSIVE = ['', 'k', 'm', 'd', 's'].map((p) => `${p}ein`).concat(['ihr', 'unser', 'eur']);
const DATIVE_OF = { der: ['dem', ...POSSESSIVE.map((p) => `${p}em`)], das: ['dem', ...POSSESSIVE.map((p) => `${p}em`)], die: ['der', ...POSSESSIVE.map((p) => `${p}er`)], pl: ['den', ...POSSESSIVE.filter((p) => p !== '').map((p) => `${p}en`)] };
const ACCUSATIVE_OF = { der: ['den', ...POSSESSIVE.map((p) => `${p}en`)], das: ['das', ...POSSESSIVE], die: ['die', ...POSSESSIVE.map((p) => `${p}e`)], pl: ['die', ...POSSESSIVE.filter((p) => p !== '').map((p) => `${p}e`)] };
const DATIVE_PREP = new Set(['mit', 'bei', 'von', 'zu', 'aus', 'nach', 'seit', 'in', 'an', 'auf']);
const ACCUSATIVE_PREP = new Set(['für', 'ohne']);
const CONTRACTED = { im: ['der', 'das'], am: ['der', 'das'], beim: ['der', 'das'], vom: ['der', 'das'], zum: ['der', 'das'], zur: ['die'] };

/**
 * The words between „habe“ and a participle the Lektion teaches (`taught`), each part verified — never CORRECT by
 * default (the third score's blocker class, 2026-11-22). A part is a small word or a time („gestern“, „viel“, „am
 * Montag“, „von acht bis vier“, „zu Hause“), a thing with its accusative article („einen Kuchen“) or a mass noun,
 * plural or activity without one („Kaffee“, „Sport“), or a preposition with the right case of a taught noun, a name
 * or a place („im Büro“, „mit meiner Mutter“, „mit Lena“, „in Bremen“). A taught noun in the wrong form is WRONG („ein
 * Kuchen“, „mit meine Mutter“, „in Büro“), and so is a taught word in no such part; a word the course does not
 * teach is BEYOND („die Hausaufgaben“).
 */
// A participle that takes no thing: of a verb with „sein“, or „gearbeitet“, „geschlafen“ (Rule 5).
const objectless = (participle) => participleOf(participle) === 'sein' || ['gearbeitet', 'geschlafen', 'gewohnt'].includes(participle);
// The nouns of time that stand without a preposition („den ganzen Tag gearbeitet“, „eine Stunde“).
const TIME_NOUN = new Set(['tag', 'tage', 'woche', 'wochen', 'monat', 'monate', 'jahr', 'jahre', 'abend', 'morgen', 'nachmittag', 'vormittag', 'wochenende', 'stunde', 'stunden', 'minute', 'minuten']);
function pastMiddle(raw, lexicon, { objectless = false } = {}) {
  const taught = (w) => { const f = fold(w); return Boolean(lexicon?.has?.(f) || lexicon?.said?.has?.(f) || MASS.has(f) || DONE_BARE.has(f)); };
  const gendersOf = (w) => lexicon?.genders?.get?.(fold(w)) || null;
  const named = (w) => /^\p{Lu}/u.test(w) && (lexicon?.names?.has?.(fold(w)) || OWN_KIND.place.has(fold(w)));
  let beyond = false;
  // The noun of a phrase from `i`: an adjective written small may stand before it.
  const nounAt = (i) => (/^\p{Lu}/u.test(raw[i] || '') ? i : /^\p{Ll}/u.test(raw[i] || '') && /^\p{Lu}/u.test(raw[i + 1] || '') ? i + 1 : -1);
  for (let i = 0; i < raw.length;) {
    const f = fold(raw[i]);
    const next = fold(raw[i + 1] || '');
    const time = (w) => clockOf(w) !== null || DAYS.includes(w.replace(/s$/, '')) || DAY_PARTS.includes(w) || w === 'wochenende' || /^\d+$/.test(w);
    // A number alone is no time („Ich habe sieben gearbeitet“); before a noun it counts („acht Stunden“), and what it
    // counts is more than one („sieben Pause“ is none; Rule 5, section D).
    if ((clockOf(f) !== null || /^\d+$/.test(f)) && !DAYS.includes(f.replace(/s$/, '')) && !DAY_PARTS.includes(f) && !/^\p{Lu}/u.test(raw[i + 1] || '') && fold(raw[i + 1] || '') !== 'uhr') return RESULT.WRONG;
    if ((clockOf(f) !== null || /^\d+$/.test(f)) && /^\p{Lu}/u.test(raw[i + 1] || '') && Number(numberWordsToDigits(f)) !== 1) {
      const counted = gendersOf(raw[i + 1]);
      if (counted && !counted.includes('pl')) return RESULT.WRONG;
    }
    // „gut“ says how it was done, right before the participle („Ich habe gut gearbeitet“, „… nicht gut …“), and „nicht“
    // never stands before „ein“ („nicht eine Pause“ is „keine Pause“; section D).
    if (f === 'gut' && i !== raw.length - 1) return RESULT.WRONG;
    if (f === 'nicht' && /^(?:ein|eine|einen|einem|einer)$/.test(fold(raw[i + 1] || ''))) return RESULT.WRONG;
    // A thing with „ein“ is denied with „kein“ („eine Pause nicht gemacht“), and „nicht“ and „gut“ come before „viel“ or
    // after it alone („viel nicht“, „viel gut“ are none; section D).
    if (f === 'nicht' && raw.slice(0, i).some((x) => /^(?:ein|eine|einen)$/.test(fold(x)))) return RESULT.WRONG;
    if (['nicht', 'gut'].includes(f) && fold(raw[i - 1] || '') === 'viel') return RESULT.WRONG;
    if (PAST_BARE.has(f) || time(f) || f === 'uhr') { i += 1; continue; }
    if (['zu', 'nach'].includes(f) && next === 'hause') { i += 2; continue; }
    if (['am', 'um', 'bis', 'von', 'ab', 'gegen'].includes(f) && next && time(next)) { i += 2; continue; }
    if (CONTRACTED[f] || DATIVE_PREP.has(f) || ACCUSATIVE_PREP.has(f)) {
      if (!CONTRACTED[f] && named(raw[i + 1] || '')) { i += 2; continue; }
      const det = CONTRACTED[f] ? null : DETERMINER.test(next) ? next : null;
      const at = nounAt(i + 1 + (det ? 1 : 0));
      if (at < 0) {
        if (raw[i + 1] && !taught(raw[i + 1])) { beyond = true; i += 2; continue; }
        return RESULT.WRONG;
      }
      const readings = gendersOf(raw[at]);
      const forms = ACCUSATIVE_PREP.has(f) ? ACCUSATIVE_OF : DATIVE_OF;
      if (readings) {
        const fits = CONTRACTED[f] ? readings.some((g) => CONTRACTED[f].includes(g))
          : det ? readings.some((g) => forms[g].includes(det))
          : MASS.has(fold(raw[at])) || readings.includes('pl'); // „mit Milch“; never „in Büro“
        if (!fits) return RESULT.WRONG;
      } else if (det && !Object.values(forms).flat().includes(det)) return RESULT.WRONG; // „mit eine …“: no dative at all
      else beyond = true;
      i = at + 1;
      continue;
    }
    if (DETERMINER.test(f) || /^\p{Lu}/u.test(raw[i])) {
      const at = DETERMINER.test(f) ? nounAt(i + 1) : i;
      if (at < 0 && f === 'das') { i += 1; continue; } // „Ich habe das gemacht“
      if (at < 0) return RESULT.WRONG;
      const noun = fold(raw[at]);
      // „gearbeitet“ takes no thing („Ich habe einen Tisch gearbeitet“), only a time („den ganzen Tag“). Rule 5.
      if (objectless && !TIME_NOUN.has(noun)) return RESULT.WRONG;
      if (gendersOf(raw[at])) {
        if (at === i) {
          if (!(MASS.has(noun) || DONE_BARE.has(noun) || gendersOf(raw[at]).includes('pl'))) return RESULT.WRONG; // „Ich habe Stuhl gemacht“
        } else {
          const phrase = raw.slice(i, at + 1).join(' ');
          const got = gapResult(phrase, { slot: 'thing', lexicon, negative: /^kein/.test(f) });
          if (got !== RESULT.CORRECT && got !== RESULT.TYPO) return RESULT.WRONG;
        }
      } else if (DONE_BARE.has(noun) || OWN_KIND.language.has(noun)) {
        // „Sport“, „Deutsch“: done without an article.
      } else if (taught(raw[at])) return RESULT.WRONG;
      else beyond = true;
      i = at + 1;
      continue;
    }
    if (taught(raw[i])) return RESULT.WRONG;
    beyond = true;
    i += 1;
  }
  return beyond ? BEYOND : RESULT.CORRECT;
}

// People, for a turn that asks who comes (`people`): „Ein Stuhl kommt“ names no guest.
const PEOPLE = new Set(['mama', 'papa', 'mutter', 'vater', 'eltern', 'bruder', 'brüder', 'schwester', 'schwestern', 'geschwister', 'familie', 'kollegin',
  'kolleginnen', 'kollege', 'kollegen', 'freund', 'freundin', 'freunde', 'freundinnen', 'gast', 'gäste', 'kind', 'kinder', 'sohn', 'söhne', 'tochter',
  'töchter', 'frau', 'frauen', 'mann', 'männer', 'oma', 'opa', 'großeltern', 'onkel', 'tante', 'nachbar', 'nachbarin', 'nachbarn', 'chef', 'chefin',
  'lehrer', 'lehrerin', 'leute', 'baby', 'partner', 'partnerin', 'cousin', 'cousine', 'herr', 'mitschüler', 'mitschülerin', 'mitschülerinnen']);

// An invitation in two sentences: what is celebrated, then the question or „Ich lade dich ein“ („Ich mache ein Fest.
// Kommst du auch?“, „Am Samstag feiere ich. Kommst du?“; courses session, 2026-11-20).
const PARTY = /^(?:fest|party|feier|geburtstag|geburtstagsparty|geburtstagsfeier|grillfest|grillparty)$/;
function partyNews(sentence, turn) {
  return [sentence, ...verbSecond(sentence)].some((s) => {
    const w = wordsOf(String(s).replace(/[.!]+\s*$/, '')).map((x) => x.replace(/[.,!]+$/, ''));
    const f = w.map(fold);
    let rest = null;
    let named = false;
    if ((f[0] === 'ich' && ['feiere', 'mache', 'habe', 'plane', 'gebe'].includes(f[1])) || (f[0] === 'wir' && ['feiern', 'machen', 'haben'].includes(f[1]))) {
      rest = w.slice(2);
      named = f[1] === 'feiere' || f[1] === 'feiern';
    } else {
      const at = f.indexOf('ist');
      const poss = (x, n) => (/^(?:meine|unsere)$/.test(x) ? ['party', 'feier', 'geburtstagsparty', 'geburtstagsfeier', 'grillparty'].includes(n) : /^(?:mein|unser)$/.test(x) && ['fest', 'geburtstag', 'grillfest'].includes(n));
      if (at > 0 && poss(f[at + 1] || '', f[at + 2] || '') && at + 3 === f.length) { rest = w.slice(0, at); named = true; }
      if (at === 2 && poss(f[0], f[1])) { rest = w.slice(3); named = true; }
    }
    if (!rest) return false;
    const when = [];
    for (let i = 0; i < rest.length; i += 1) {
      const x = fold(rest[i]);
      if (PARTY.test(x) && /^\p{Lu}/u.test(rest[i])) { named = true; continue; }
      // The article agrees with the party noun („ein Fest“, „eine Party“, „meinen Geburtstag“; never „ein Party“).
      const next = fold(rest[i + 1] || '');
      if (PARTY.test(next)) {
        const g = /party|feier$/.test(next) ? 'die' : /geburtstag$/.test(next) ? 'der' : 'das';
        const fits = { der: ['einen', 'meinen', 'unseren'], die: ['eine', 'meine', 'unsere'], das: ['ein', 'mein', 'unser'] }[g];
        if (fits.includes(x)) continue;
        if (['ein', 'eine', 'einen', 'meinen', 'meine', 'mein', 'unsere', 'unser', 'unseren'].includes(x)) return false;
      }
      when.push(rest[i]);
    }
    if (!named) return false;
    if (!when.length) return true;
    const at = whenOf(when.join(' '));
    return Boolean(at) && (!turn.when || sameWhen(at, turn.when, { partial: true }));
  });
}
const INVITE_SECOND = /^(?:und\s+)?(?:kommst\s+du(?:\s+(?:auch|vielleicht|mit))?(?:\s+(?:auch|zu\s+mir|vorbei))?|möchtest\s+du(?:\s+(?:auch|gern|vielleicht))?\s+kommen|willst\s+du(?:\s+auch)?\s+kommen|komm\s+(?:doch\s+)?(?:bitte\s+)?(?:auch|vorbei|mit)?|ich\s+lade\s+dich(?:\s+(?:auch|herzlich|gern))?\s+ein|lade\s+dich(?:\s+(?:auch|herzlich))?\s+ein|ich\s+möchte\s+dich(?:\s+gern)?\s+einladen|du\s+bist(?:\s+(?:herzlich|auch))?\s+eingeladen|kannst\s+du(?:\s+auch)?\s+kommen|hast\s+du(?:\s+(?:zeit|lust))(?:\s+zu\s+kommen)?)\s*[?.!]*$/iu;

// A number in digits before a word, spelled out as the course writes it: „2 Kaffee“ → „zwei Kaffee“, „1 Buch“ → „ein
// Buch“ (and „eine“, „einen“, „einem“: the digit says no gender). Clock times, dates and prices with a point stay.
const NUMBER_UNITS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn',
  'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS_WORDS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
const numberWord = (n) => (n < 20 ? NUMBER_UNITS[n] : `${n % 10 ? `${n % 10 === 1 ? 'ein' : NUMBER_UNITS[n % 10]}und` : ''}${TENS_WORDS[Math.floor(n / 10)]}`);
function digitWords(text) {
  const DIGITS = /(?<![\p{N}.:,/])(\d{1,2})(?![\p{N}.:,/])(?=\s+\p{L})/gu;
  if (!DIGITS.test(String(text))) return [];
  // Each „1“ takes its own article („1 Computer und 1 Telefon“ → „einen Computer und ein Telefon“), two at most.
  const ones = (String(text).match(/(?<![\p{N}.:,/])1(?![\p{N}.:,/])(?=\s+\p{L})/gu) || []).length;
  const ARTICLES = ['ein', 'eine', 'einen', 'einem'];
  const choices = ones > 2 ? [[]] : ARTICLES.flatMap((a) => (ones > 1 ? ARTICLES.map((b) => [a, b]) : [[a]]));
  return [...new Set(choices.map((arts) => { let k = 0; return String(text).replace(DIGITS, (d) => (d === '1' ? arts[k++] || 'ein' : numberWord(Number(d)))); }))];
}
// A number word, also typed without its umlaut („funfzehn", „zwolf").
const isNumberWord = (w) => /^\d+$/.test(numberWordsToDigits(String(w).replace(/f(?:ue|u)nf/g, 'fünf').replace(/zw(?:oe|o)lf/g, 'zwölf')));
// A price is in euros: „18,00 Euro" and „18,- €" are 18; a heard price in euros is no number of cents.
const priceDigits = (s) => numberWordsToDigits(String(s).replace(/f(?:ue|u)nf/gi, 'fünf').replace(/zw(?:oe|o)lf/gi, 'zwölf'))
  .replace(/(\d),(?:00|-)(?!\d)/g, '$1').replace(/\D/g, '');
// A greeting before the answer, also to the person by name („Guten Tag, Herr Weber. Hier ist …",
// „Hallo Herr Weber, hier ist …").
const GREETING_FIRST = /^(?:hallo|guten\s+(?:morgen|tag|abend))(?:[\s,]+(?:herr|frau)\s+\p{L}+)?\s*[!,.]\s*/iu;
// The turn's `answerWords` (words of yes, of goodbye), one or more, each followed by a comma, a stop or a space.
const answerWordsRe = (words) => new RegExp(`^(?:(?:${[...words].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:\\s*[,.!]+\\s*|\\s+und\\s+|\\s+|$))+`, 'iu');

/**
 * THE THIRD OUTCOME (courses session, 2026-11-22). A final check answer is CORRECT when it is verified against what
 * the Lektion teaches, WRONG when it is an attempt at a taught frame with a fault the check can name, and BEYOND
 * when it is well-formed-looking German that goes past what the check can verify. BEYOND is neither praised nor a
 * miss: the learner reads that it goes further than the Lektion, sees the Lektion's way to say it, and answers once
 * more; only a verified answer shows the can-do (CheckStage). Asked only of an answer that would be WRONG:
 *  (a) an untaught word added to a right answer („Ich komme ursprünglich aus Syrien“);
 *  (b) a word no course teaches, written small, in the gap of a taught frame („Ich bin pensioniert“);
 *  (c) another verb or word in place of one of the frame's („Meine Telefonnummer lautet …“);
 *  (d) what the turn asks for, inside a sentence the Lektion does not teach („Sie erreichen mich unter …“, „Ein Buch
 *      wäre schön“).
 * A wrong form of a taught word („Ich kommen aus …“) or a taught frame with a word left out („Ich wohne Syrien“) is
 * no such sentence: it stays WRONG.
 */
/** A word the course does not teach, for one turn — the one thing BEYOND rests on. */
function untaughtTest(turn) {
  const lexicon = turn.lexicon;
  const frames = (turn.accepted || []).map((a) => (typeof a === 'string' ? { frame: a } : a));
  // Faults the check names are no untaught words: a participle in a past gap (its auxiliary: „Ich habe
  // aufgestanden“) and, in an activity gap, a verb with its prefix still on („Ich fernsehe gern“).
  const slotted = (slot) => frames.some((a) => (a.slot ?? turn.slot) === slot);
  const [past, activity] = [slotted('past'), slotted('activity')];
  return (w) => {
    const f = fold(w);
    if (lexicon?.has?.(f) || lexicon?.names?.has?.(f) || lexicon?.said?.has?.(f) || OWN_ALL.has(f) || CLOSED.has(f) || isNumberWord(f) || /\d/.test(f)) return false;
    // The grader's own lists are taught words too („Stück“, „Kaffee“, „gestern“): BEYOND needs a word outside them.
    if (MASS.has(f) || MEASURE_GENDER[f] !== undefined || PAST_BARE.has(f) || ACTIVITY_GLUE.has(f) || WHEN_GLUE.has(f) || DAYS.includes(f) || DAY_PARTS.includes(f) || MONTHS.includes(asciiUmlauts(f))) return false;
    if ((past && (participleOf(f) || /^\p{L}{0,6}ge\p{L}{3,}(?:t|en)$/u.test(f))) || (activity && unsplit(f))) return false;
    // An ending on a taught word („die roten Lampe“) is a form of it, which the check names.
    const stem = f.replace(/(?:e|en|em|er|es|n)$/, '');
    if (stem !== f && stem.length >= 3 && lexicon?.has?.(stem)) return false;
    // Also typed without its umlaut („schoenes“ is „schönes“, one letter off „schönen“): the one spelling fold.
    const a = asciiUmlauts(f);
    if (f.length < 4) return true;
    const list = lexicon ? (lexicon.asciiPairs ||= [...lexicon].filter((x) => x.length >= 4).map((x) => [x, asciiUmlauts(x)])) : [];
    return !list.some(([x, ax]) => (Math.abs(x.length - f.length) <= 1 && levenshtein(x, f) <= 1) || (a !== f && Math.abs(ax.length - a.length) <= 1 && levenshtein(ax, a) <= 1));
  };
}

/**
 * Why an answer is BEYOND (tools and tests): its words the course does not teach, and, where the Lektion teaches
 * only some participles (`taught`), another participle or „war“ — a frame the Lektion does not teach.
 */
export function untaughtIn(turn, value) {
  const test = untaughtTest(turn);
  const words = wordsOf(spelledOut(westernDigits(value), turn.lexicon).replace(/[.,!?;:„“"]+/g, ' '));
  const found = words.filter(test);
  if (turn.taught) found.push(...words.filter((w) => fold(w) === 'war' || (participleOf(w) && !turn.taught.some((p) => fold(p) === fold(w)))));
  return [...new Set(found)];
}

function beyondOf(turn, text) {
  if (turn.ownName || turn.spell || turn.listen || turn.parts) return false;
  const words = wordsOf(String(text).replace(/[.,!?;:„“"]+/g, ' '));
  if (words.length < 2) return false;
  const frames = (turn.accepted || []).map((a) => (typeof a === 'string' ? { frame: a } : a));
  const frameWords = new Set(frames.flatMap((a) => wordsOf(a.frame.replace(/[.,!?;:…]+/g, ' '))).map(fold));
  // A form of a frame's word: the same first four letters, or one letter off in a longer word.
  const isForm = (w) => [...frameWords].some((x) => x !== w && x.length >= 4 && w.length >= 4 && (x.slice(0, 4) === w.slice(0, 4) || (Math.min(x.length, w.length) >= 5 && levenshtein(x, w) <= 1)));
  const unknown = untaughtTest(turn);
  const right = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  const graded = (s) => right(typedCore(turn, s));
  // (a), never a word after an article: that is an adjective whose ending the thing gap checks („einen neue Computer“).
  const article = /^(?:ein|eine|einen|einem|einer|der|die|das|den|dem|mein|meine|meinen|meinem|dein|deine|deinen|kein|keine|keinen)$/;
  const adjective = (i) => i > 0 && /^\p{Ll}/u.test(words[i]) && article.test(fold(words[i - 1]));
  const added = words.filter((w, i) => i > 0 && /^\p{Ll}/u.test(w) && !adjective(i) && unknown(w));
  if (added.length && added.length < words.length - 1 && graded(words.filter((w) => !added.includes(w)).join(' '))) return true;
  // A wrong form of a taught word is a fault the check names.
  if (words.some((w) => !frameWords.has(fold(w)) && isForm(fold(w)))) return false;
  const fresh = words.filter((w) => !frameWords.has(fold(w)) && fold(w).length >= 3 && !CLOSED.has(fold(w)));
  // (b) only after a form of „sein“, where German puts a word written small („Ich bin pensioniert“); a thing gap
  // takes a noun („Ich kaufe neu“ stays WRONG).
  for (const a of frames) {
    if (!hasGap(a.frame)) continue;
    const [head, tail = ''] = a.frame.split(GAP).map((s) => wordsOf(s.replace(/[.,!?;:]+/g, ' ')).map(fold));
    const f = words.map(fold);
    if (!['bin', 'bist', 'ist', 'sind', 'seid'].includes(head[head.length - 1])) continue;
    if (f.length <= head.length + tail.length || head.some((h, i) => f[i] !== h) || tail.some((t, i) => f[f.length - tail.length + i] !== t)) continue;
    const gap = words.slice(head.length, words.length - tail.length);
    if (gap.every((w) => /^\p{Ll}/u.test(w) && unknown(w))) return true;
  }
  if (!fresh.length) return false;
  // (c) only for a fixed word of a frame with a gap, in its own place („lautet“ where „ist“ stands); never the gap.
  for (const a of frames) {
    if (!hasGap(a.frame)) continue;
    const [head, tail = ''] = a.frame.split(GAP).map((s) => wordsOf(s.replace(/[.,!?;:]+/g, ' ')));
    const places = [...head.map((x, i) => [i, x]), ...tail.map((x, i) => [words.length - tail.length + i, x])];
    for (const [i, x] of places) {
      const w = words[i];
      if (!w || frameWords.has(fold(w)) || fold(w) === fold(x) || !unknown(w)) continue;
      if (graded(words.map((y, j) => (j === i ? x : y)).join(' '))) return true;
    }
  }
  // (d) the content the turn asks for — a place, a number, a thing … with at least one word of content, never only
  // small words („ein“), and never the past or adjunct gaps, which check a sentence's form, not its content.
  for (const a of frames) {
    if (!hasGap(a.frame)) continue;
    const props = { ...turn, ...a };
    if (['past', 'adjunct', 'words', undefined].includes(props.slot)) continue;
    for (let from = 0; from < words.length; from += 1) {
      for (let to = from + 1; to <= Math.min(words.length, from + 4); to += 1) {
        const span = words.slice(from, to);
        if (!span.some((w) => { const f = fold(w); return /\d/.test(f) || !(CLOSED.has(f) || ACTIVITY_GLUE.has(f) || WHEN_GLUE.has(f)); })) continue;
        if (span.every((w) => frameWords.has(fold(w)))) continue;
        if (!right(gapResult(span.join(' '), props))) continue;
        if (words.some((w, j) => (j < from || j >= to) && !adjective(j) && !frameWords.has(fold(w)) && unknown(w))) return true;
      }
    }
  }
  return false;
}

// ——— THE WHOLE ANSWER AND THE NAMED FAULT (the third score, 2026-11-22) ———
// Rule 1: CORRECT or TYPO accounts for every word typed. What is left after a verified beginning is graded on its own
//   (`restResult`): verified by an answer the course's checks accept it is CORRECT, with a fault the check can name it is
//   WRONG, anything else is BEYOND.
// Rule 2: nothing is WRONG by default. A WRONG names its fault (`wrongReason`): a wrong form (agreement, article or case,
//   participle, auxiliary, word order, an ending), a word of an answer the turn accepts left out, added or put in
//   another's place, an answer that does not do the task, or text that is not German. On-task German with no fault the
//   check can name that is not verified is BEYOND, with or without a word the course does not teach.
// Rule 3: what a turn accepts in pieces it accepts together (`piecesOf`): „ab“, „mir“, „jetzt“, an opening „Ja,“ …

const BARE_PREP = new Set(['mit', 'bei', 'von', 'zu', 'aus', 'in', 'an', 'auf', 'für', 'ohne', 'nach', 'seit']);
const DATIVE_ONLY = new Set(['mit', 'bei', 'von', 'zu', 'aus', 'seit', 'nach']);
const TWO_WAY = new Set(['in', 'an', 'auf', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen']);
const ACCUSATIVE_ONLY = new Set(['für', 'ohne', 'durch', 'gegen']);
// Finite forms by person (folded: „weiß“ is „weiss“): 1s ich, 2s du, 3s er/sie/es, 1p wir, 2p ihr, 3p sie/Sie.
const SEIN_FORMS = { bin: ['1s'], bist: ['2s'], ist: ['3s'], sind: ['1p', '3p'], seid: ['2p'], war: ['1s', '3s'], warst: ['2s'], waren: ['1p', '3p'], wäre: ['1s', '3s'], wären: ['1p', '3p'] };
// „sein“ itself, read as a verb only right after a pronoun subject („Ja, ich sein frei“); elsewhere it is „his“.
const SEIN_INFINITIVE = ['1p', '3p', 'inf'];
const HABEN_FORMS = { habe: ['1s'], hast: ['2s'], hat: ['3s'], haben: ['1p', '3p'], habt: ['2p'], hatte: ['1s', '3s'], hattest: ['2s'], hatten: ['1p', '3p'], hätte: ['1s', '3s'], hätten: ['1p', '3p'] };
const MODAL_FORMS = {};
for (const [one, two, many, you] of [['kann', 'kannst', 'können', 'könnt'], ['will', 'willst', 'wollen', 'wollt'], ['muss', 'musst', 'müssen', 'müsst'],
  ['darf', 'darfst', 'dürfen', 'dürft'], ['soll', 'sollst', 'sollen', 'sollt'], ['mag', 'magst', 'mögen', 'mögt'], ['möchte', 'möchtest', 'möchten', 'möchtet'],
  ['weiss', 'weisst', 'wissen', 'wisst']]) Object.assign(MODAL_FORMS, { [one]: ['1s', '3s'], [two]: ['2s'], [many]: ['1p', '3p'], [you]: ['2p'] });
const PERSON_OF = { ich: ['1s'], du: ['2s'], er: ['3s'], es: ['3s'], man: ['3s'], wir: ['1p'], ihr: ['2p'], sie: ['3s', '3p'] };
const AUX_HABEN = new Set(['habe', 'hast', 'hat', 'haben', 'habt']);
const AUX_SEIN = new Set(['bin', 'bist', 'ist', 'sind', 'seid']);
const QUESTION_WORDS = new Set(['was', 'wo', 'wann', 'wie', 'woher', 'wohin', 'warum', 'wer', 'wen', 'wem', 'welche', 'welcher', 'welches', 'welchen']);
const PAST_MARK = new Set(['gestern', 'vorgestern']);
const ADVERB_WORDS = new Set(['gern', 'gerne', 'auch', 'heute', 'morgen', 'noch', 'jetzt', 'nicht', 'sehr', 'oft', 'immer', 'hier', 'dort', 'schon', 'dann', 'abends', 'morgens', 'jeden', 'tag']);
// The nouns of the checks' own frames, with their genders, where no Wortfeld teaches them („Mein Name“, „mein Hobby“).
const FRAME_NOUNS = new Map([...OWN_THINGS, ['name', 'der'], ['vorname', 'der'], ['nachname', 'der'], ['hobby', 'das'], ['beruf', 'der'], ['wohnort', 'der'], ['sprache', 'die'], ['land', 'das']].map(([k, g]) => [k, [g]]));
const plainOf = (w) => fold(w).replace(/^[„“"(]+|[.,!?;:„“")]+$/g, '');

/** The persons a finite verb form can have („kommst“ → du; „fährt“ → er), or null for a word that is no verb the course says. */
function personsOf(word, lexicon) {
  const f = plainOf(word);
  const fixed = SEIN_FORMS[f] || HABEN_FORMS[f] || MODAL_FORMS[f];
  if (fixed) return fixed;
  if (CLOSED.has(f) || lexicon?.genders?.has?.(f) || MASS.has(f) || !lexicon?.stems?.size) return null;
  const out = new Set();
  // A verb that changes its vowel for du and er has no regular form for them („sprecht“, „fahrt“ are ihr; Claude score, 2026-11-25).
  const changes = (stem, ending) => [stem.replace('e', 'i'), stem.replace('e', 'ie'), stem.replace('au', 'äu'), stem.replace('a', 'ä'), stem.replace('o', 'ö')]
    .some((x) => x !== stem && (lexicon.has?.(`${x}${ending}`) || COURSE_WORDS.has(asciiUmlauts(`${x}${ending}`))));
  const add = (stem, ending, changed) => {
    if (!lexicon.stems.has(stem)) return;
    if (ending === 'e' && !changed) out.add('1s');
    if ((ending === 'st' || ending === 'est') && (changed || !changes(stem, ending))) out.add('2s');
    if (ending === 't' || ending === 'et') { if (changed || !changes(stem, ending)) out.add('3s'); if (!changed) out.add('2p'); if (/[szx]$/.test(stem) && !changes(stem, 'st')) out.add('2s'); }
    if (ending === 'en' && !changed) ['1p', '3p', 'inf'].forEach((p) => out.add(p));
  };
  for (const ending of ['est', 'et', 'en', 'st', 'e', 't']) {
    if (!f.endsWith(ending) || f.length - ending.length < 2) continue;
    const stem = f.slice(0, -ending.length);
    add(stem, ending, false);
    // A strong verb changes its vowel for du and er („fährt“, „spricht“, „liest“, „isst“).
    for (const [a, b] of [['äu', 'au'], ['ä', 'a'], ['ie', 'e'], ['i', 'e'], ['ö', 'o']]) if (stem.includes(a)) add(stem.replace(a, b), ending, true);
  }
  return out.size ? [...out] : null;
}
// A finite verb where one stands: written small, or first in its clause.
const verbAt = (raw, i, lexicon) => (raw[i] && (i === 0 || /^\p{Ll}/u.test(raw[i])) ? personsOf(raw[i], lexicon) : null);

/** The subject at `i` — a pronoun, a name of the cast, or a determiner with a taught noun („der Zug“, „meine Eltern“) — or null. */
function subjectAt(raw, i, lexicon) {
  const f = plainOf(raw[i] || '');
  // „Ihr Beruf“, „ihr beruf“ from a speech recogniser: before its noun „ihr“ is the possessive, the noun's person.
  const nextGender = lexicon?.genders?.get?.(plainOf(raw[i + 1] || ''));
  if (f === 'ihr' && nextGender) return { persons: [...new Set(nextGender.map((x) => (x === 'pl' ? '3p' : '3s')))], len: 2 };
  if (PERSON_OF[f]) return { persons: PERSON_OF[f], len: 1 };
  if (/^\p{Lu}/u.test(raw[i] || '') && lexicon?.names?.has?.(f)) return { persons: ['3s'], len: 1 };
  const noun = plainOf(raw[i + 1] || '');
  const g = lexicon?.genders?.get?.(noun);
  if (g && DETERMINER.test(f) && !['den', 'dem', 'des'].includes(f) && /^\p{Lu}/u.test(raw[i + 1] || '')) return { persons: [...new Set(g.map((x) => (x === 'pl' ? '3p' : '3s')))], len: 2 };
  return null;
}

/** A determiner fits a gender in some case („ein“ fits der and das; „einen“ only der; „eine“ never das). */
function detFits(det, g) {
  const d = plainOf(det);
  const definite = { der: ['der', 'den', 'dem', 'des'], die: ['die', 'der'], das: ['das', 'dem', 'des'], pl: ['die', 'den', 'der'] };
  if (['der', 'die', 'das', 'den', 'dem', 'des'].includes(d)) return definite[g].includes(d);
  const ends = { der: ['', 'en', 'em', 'es'], die: ['e', 'er'], das: ['', 'em', 'es'], pl: ['e', 'en', 'er'] }[g];
  const m = d.match(/^(kein|mein|dein|sein|ihr|unser|eur|euer|ein)(.*)$/);
  if (m) {
    if (m[1] === 'ein' && g === 'pl') return false;
    if (m[1] === 'euer') return m[2] === '' && ends.includes('');
    if (m[1] === 'eur' && m[2] === '') return false;
    return ends.includes(m[2]);
  }
  const n = d.match(/^(dies|jed|welch)(.+)$/);
  if (n) return { der: ['er', 'en', 'em', 'es'], die: ['e', 'er'], das: ['es', 'em'], pl: ['e', 'en', 'er'] }[g].includes(n[2]);
  return true;
}
const DET_WORD = /^(?:der|die|das|den|dem|des|(?:[kmds]?ein|ihr|unser|eur)(?:e|en|em|er|es)?|euer|(?:dies|jed|welch)(?:e|en|em|er|es))$/;
/** A determiner in the nominative of a gender („der Zug“, „eine Lampe“, „mein Buch“, „meine Eltern“). */
function nominativeFits(det, g) {
  const d = plainOf(det);
  if (['der', 'die', 'das'].includes(d)) return { der: 'der', die: 'die', das: 'das', pl: 'die' }[g] === d;
  const m = d.match(/^(kein|mein|dein|sein|ihr|unser|eur|euer|ein)(.*)$/);
  if (m) return (m[1] === 'ein' && g === 'pl') ? false : ({ der: [''], das: [''], die: ['e'], pl: ['e'] }[g].includes(m[1] === 'euer' ? '' : m[2]) && !(m[1] === 'eur' && m[2] === ''));
  const n = d.match(/^(dies|jed|welch)(.+)$/);
  return n ? { der: 'er', die: 'e', das: 'es', pl: 'e' }[g] === n[2] : true;
}

/** The words of a text as sentences, each a list of its words without punctuation, the written case kept. */
// The stop of a day („am 15. Mai“, „am 3. 5. 1998“) ends no sentence.
const sentencesOf = (text) => String(text).split(/(?<=[.!?])\s+/).reduce((acc, p) => {
  const last = acc[acc.length - 1];
  if (last && /(^|\s)\d{1,2}\.$/.test(last) && (/^\d/.test(p) || monthOf(p.split(/\s+/)[0]))) acc[acc.length - 1] = `${last} ${p}`;
  else acc.push(p);
  return acc;
}, []).map((s) => wordsOf(s.replace(/[„“"()]/g, ' ').replace(/[,;–]|:(?!\d)/g, ' , ')).map((w) => w.replace(/[.!?]+$/, '')).filter(Boolean));
const commaFree = (sentence) => sentence.filter((w) => w !== ',');

const PLURAL_BEFORE = /^(?:viele|mehrere|einige|paar|alle|meine|deine|unsere|keine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)$/;
/**
 * A fault in the form of the words, whatever the turn (Rule 2): a verb that does not agree with its subject, an article
 * no case of the noun takes, a preposition without the article a taught noun needs or with one of the wrong case, an
 * ending on an adjective after „sein“, a participle that is none or has the wrong auxiliary or stands before the end,
 * an infinitive where the participle belongs, „gestern“ with the present, a verb not in second place. Null when none.
 */
export function formFault(text, lexicon) {
  for (const sentence of sentencesOf(text)) {
    const raw = commaFree(sentence);
    const f = raw.map(plainOf);
    if (!raw.length) continue;
    // Agreement: the subject and its verb, either way round; after „und“ a verb without a subject has the one before
    // (an infinitive after a modal verb has none: „Ich möchte essen und trinken“).
    const modal = f.some((w) => MODAL_FORMS[w]);
    let lastSubject = null;
    let waiting = false; // the last subject has no verb yet
    // A name with a comma after it is the person spoken to, no subject („Hallo Lena, schwimmst du …“).
    const beforeComma = new Set();
    for (const w of sentence) { if (w === ',') beforeComma.add(beforeComma.at ?? -1); else beforeComma.at = (beforeComma.at ?? -1) + 1; }
    for (let i = 0; i < raw.length; i += 1) {
      if (beforeComma.has(i) && lexicon?.names?.has?.(f[i])) continue;
      const s = subjectAt(raw, i, lexicon);
      if (!s) {
        if (f[i] === 'und' && !subjectAt(raw, i + 1, lexicon) && !(raw[i + 2] && subjectAt(raw, i + 2, lexicon))) {
          const pv = /^\p{Ll}/u.test(raw[i + 1] || '') ? personsOf(raw[i + 1], lexicon) : null;
          const infinitives = modal && pv?.includes('inf') && personsOf(raw[i - 1] || '', lexicon)?.includes('inf');
          if (pv && !infinitives) {
            if (!lastSubject) return 'missing'; // „Guten Tag und kommen aus Syrien“: whose verb?
            if (!pv.some((p) => lastSubject.includes(p))) return 'agreement';
          }
        }
        continue;
      }
      const prev = f[i - 1] || '';
      if (i > 0 && (BARE_PREP.has(prev) || ACCUSATIVE_ONLY.has(prev) || prev === 'um')) continue; // „mit ihr“, „für dich“
      // „ihr“, „sein“ after a verb is the pronoun, not a possessive („Habt ihr Zeit?“).
      const after = verbAt(raw, i + s.len, lexicon) || (s.len === 1 && plainOf(raw[i + 1] || '') === 'sein' ? SEIN_INFINITIVE : null);
      // Two subjects of one verb („Lena und ich kommen“): only when the one before „und“ has no verb of its own —
      // „Ich komme aus Syrien und ich wohnen …“ and „Hier spricht Omar und ich brauchen …“ open a clause of their own.
      const compound = (prev === 'und' && waiting) || f[i + s.len] === 'und';
      // „Es kommen drei Freunde.“: the subject comes later, „es“ only holds its place.
      if (f[i] === 'es' && after?.includes('3p') && raw.slice(i + 2).some((w, k) => (/^\p{Lu}\p{L}*[enrs]$/u.test(w) && (isNumberWord(f[i + 1 + k]) || PLURAL_BEFORE.test(f[i + 1 + k]))) || lexicon?.genders?.get?.(plainOf(w))?.includes('pl'))) continue;
      // („magst du tanzen“: after a modal the infinitive has no person.)
      if (after && !(modal && after.includes('inf')) && !(compound && after.some((p) => p.endsWith('p'))) && !after.some((p) => s.persons.includes(p))) return 'agreement';
      const before = i > 0 ? verbAt(raw, i - 1, lexicon) : null;
      // After „und“ the verb may have the subject before it: what follows is its object („… und mache ein Fest“).
      const elided = i >= 2 && f[i - 2] === 'und' && lastSubject && before?.some((p) => lastSubject.includes(p));
      const ownSubject = elided || (i >= 2 && subjectAt(raw, i - 2, lexicon));
      if (before && !ownSubject && !compound && !before.some((p) => s.persons.includes(p))) return 'agreement';
      // „sie“ with its own verb is one person or more: „Sie ist jung und kommen …“ is wrong.
      const own = after || before;
      lastSubject = own ? s.persons.filter((p) => own.includes(p)) : s.persons;
      if (!lastSubject.length) lastSubject = s.persons;
      waiting = !own;
    }
    // Determiners and their nouns; prepositions and their cases.
    for (let i = 0; i < raw.length; i += 1) {
      const d = f[i];
      const contracted = CONTRACTED[d];
      if (!DET_WORD.test(d) && !contracted && !BARE_PREP.has(d)) continue;
      if ((d === 'ihr' || d === 'sein') && i > 0 && verbAt(raw, i - 1, lexicon)) continue;
      let j = i + 1;
      if (raw[j] && /^\p{Ll}/u.test(raw[j]) && /(?:e|en|er|es|em)$/.test(f[j]) && !CLOSED.has(f[j]) && raw[j + 1] && /^\p{Lu}/u.test(raw[j + 1])) j += 1;
      const noun = f[j];
      const readings = lexicon?.genders?.get?.(noun) || (MEASURE_GENDER[noun] ? [MEASURE_GENDER[noun]] : null) || (COUNTRY_ARTICLE[noun] ? [COUNTRY_ARTICLE[noun]] : null)
        || (/^\p{Lu}/u.test(raw[j] || '') ? FRAME_NOUNS.get(noun) || (DET_WORD.test(d) && !lexicon?.has?.(noun) ? ownReadings(noun) : null) : null);
      if (!readings || lexicon?.names?.has?.(noun)) continue;
      // The subject is in the nominative: first before its verb („Der Lampe kostet …“), or right after the verb of a
      // question („Was kostet der Lampe?“).
      // Only where the verb is the noun's own (third person) and no pronoun is the subject („Den Kaffee trinke ich“).
      const own = (p) => Boolean(p) && readings.some((g) => p.includes(g === 'pl' ? '3p' : '3s'));
      const subjectPlace = (i === 0 && own(verbAt(raw, j + 1, lexicon)) && !subjectAt(raw, j + 2, lexicon))
        || (i > 0 && i - 1 <= 4 && QUESTION_WORDS.has(f[0]) && own(verbAt(raw, i - 1, lexicon)));
      if (subjectPlace && DET_WORD.test(d) && !readings.some((g) => nominativeFits(d, g))) return 'case';
      if (contracted) { if (!readings.some((g) => contracted.includes(g))) return 'article'; continue; }
      if (BARE_PREP.has(d)) {
        // A preposition and a taught noun with no article: only a mass noun, a plural, a day or a fixed phrase.
        const time = DAYS.includes(noun) || MONTHS.includes(asciiUmlauts(noun)) || DAY_PARTS.includes(noun) || noun === 'uhr';
        if (j === i + 1 && !time && !MASS.has(noun) && !readings.includes('pl') && !lexicon?.bareAfter?.has?.(`${d} ${noun}`) && /^\p{Lu}/u.test(raw[j])) return 'article';
        continue;
      }
      // „um ein Uhr“, „Ist es ein Uhr?“: one o'clock, no article.
      if (d === 'ein' && noun === 'uhr' && j === i + 1 && /^(?:um|ist|es|ab|bis|gegen|vor|nach)$/.test(f[i - 1] || '')) continue;
      if (!readings.some((g) => detFits(d, g))) return 'article';
      const prep = f[i - 1] || '';
      const forms = DATIVE_ONLY.has(prep) ? [DATIVE_OF] : ACCUSATIVE_ONLY.has(prep) ? [ACCUSATIVE_OF] : TWO_WAY.has(prep) ? [DATIVE_OF, ACCUSATIVE_OF] : null;
      const caseForm = (g, table) => table[g].includes(d) || (table === DATIVE_OF ? { der: 'dem', das: 'dem', die: 'der', pl: 'den' } : { der: 'den', das: 'das', die: 'die', pl: 'die' })[g] === d;
      if (forms && !readings.some((g) => forms.some((t) => caseForm(g, t)))) return 'case';
    }
    // „sein“ needs what one is: „… und du bist.“ leaves it out (a question „Und du bist?“ asks it).
    const subjectBeforeLast = (PERSON_OF[f.at(-2)] && raw.length >= 2) || (raw.length >= 3 && subjectAt(raw, raw.length - 3, lexicon)?.len === 2);
    if (subjectBeforeLast && SEIN_FORMS[f.at(-1)] && !/\?$/.test(String(text).trim()) && !f.some((w) => QUESTION_WORDS.has(w))) return 'missing';
    // One finite verb to a clause: „Ich komme aus Marokko bin.“, „Das ist meine Mutter ist.“ A clause ends at „dass“,
    // „weil“, „wenn“, „ob“ or a question word inside, and at a comma, „und“, „aber“ or „oder“ before a subject or a verb
    // („Ja, ich komme“, „… und wohne in Bremen“; never „…, bitte bin“, „Arabisch und Deutsch ist“). An infinitive may
    // follow a modal verb.
    let finite = 0;
    for (let i = 0; i < sentence.length; i += 1) {
      const w = plainOf(sentence[i]);
      const next = plainOf(sentence[i + 1] || '');
      const opens = () => Boolean(subjectAt(sentence, i + 1, lexicon) || verbAt(sentence, i + 1, lexicon) || QUESTION_WORDS.has(next) || DET_WORD.test(next) || ['es', 'man', 'dann', 'da', 'hier', 'heute', 'morgen', 'jetzt'].includes(next));
      if (['dass', 'weil', 'wenn', 'denn', 'ob'].includes(w) || (i > 0 && QUESTION_WORDS.has(w))) { finite = 0; continue; }
      if (!w || ['und', 'aber', 'oder'].includes(w)) { if (opens()) finite = 0; continue; }
      const p = verbAt(sentence, i, lexicon);
      if (!p || (p.includes('inf') && finite)) continue;
      finite += 1;
      if (finite > 1) return 'verb';
    }
    // The object of „ich brauche“, „hast du“ …: a der-noun takes its accusative („Ich brauche ein Computer“, „Hast du
    // ein Bruder?“). Never after „sein“, „heißen“, „werden“, „bleiben“, and only in the same clause (no comma between).
    const COPULA = /^(?:bin|bist|ist|sind|seid|war|warst|waren|wäre|wären|heisse|heisst|heissen|werde|wirst|wird|werden|bleibe|bleibst|bleibt|bleiben)$/;
    const ADVERB = new Set(['gern', 'gerne', 'auch', 'heute', 'morgen', 'noch', 'jetzt', 'nicht', 'sehr', 'oft', 'immer', 'hier', 'dort', 'schon', 'bitte', 'dann', 'mal']);
    const withCommas = sentence.map(plainOf);
    for (let i = 0; i < withCommas.length; i += 1) {
      const readings = lexicon?.genders?.get?.(withCommas[i + 1] || '');
      // A der-noun (also one whose plural looks the same, „Kuchen“): never a die- or das-noun.
      if (!/^(?:der|k?ein|mein|dein|sein|ihr|unser|euer)$/.test(withCommas[i]) || !readings?.includes('der') || readings.some((g) => g === 'die' || g === 'das')) continue;
      let k = i - 1;
      while (k >= 0 && ADVERB.has(withCommas[k])) k -= 1;
      const v = k >= 0 ? withCommas[k] : '';
      const pronoun = (x) => Boolean(PERSON_OF[x]);
      const finite = (x, at) => !COPULA.test(x) && Boolean(personsOf(x, lexicon)) && (at === 0 || /^\p{Ll}/u.test(sentence[at]));
      if ((finite(v, k) && pronoun(withCommas[k - 1] || '')) || (pronoun(v) && finite(withCommas[k - 1] || '', k - 1))) return 'case';
      // („Ich brauche einen Computer und ein Stuhl.“: the second object of the verb, after „und“.)
      if (v === 'und' && k >= 3 && /^(?:den|einen|keinen|meinen|deinen|seinen|ihren|unseren)$/.test(withCommas[k - 2] || '')) {
        const before = withCommas.slice(0, k - 2);
        if (before.some((x, at) => !COPULA.test(x) && Boolean(personsOf(x, lexicon)) && pronoun(before[at - 1] || before[at + 1] || ''))) return 'case';
      }
    }
    // Words that go with the other verb: „Ich bin Durst“ (Hunger, Durst, Zeit go with „haben“), „Mein Heft hat blau“ (a
    // colour with „sein“); „bin“ with another verb („Ich bin wohnen in Bremen“, „Ich bin lesen gern“) or with „gern“ and
    // a thing („Ich bin gern Musik“).
    for (let i = 0; i + 1 < f.length; i += 1) {
      if (SEIN_FORMS[f[i]] && ['hunger', 'durst', 'zeit', 'angst', 'lust', 'fieber'].includes(f[i + 1])) return 'verb';
      // „sein“ and a direction, no verb of moving: „Ich bin nach Österreich.“ (never „Ich bin nach Hause gegangen.“)
      if (['bin', 'bist'].includes(f[i]) && f[i + 1] === 'nach' && !f.some((x) => participleOf(x))) return 'verb';
      if (HABEN_FORMS[f[i]] && i + 2 === f.length && colourStem(f[i + 1]) && /^\p{Ll}/u.test(raw[i + 1])) return 'verb';
      if (['bin', 'bist'].includes(f[i])) {
        let j = i + 1;
        while (j < f.length && (ADVERB_WORDS.has(f[j]) || DAYS.includes(f[j]) || ['am', 'wochenende'].includes(f[j]))) j += 1;
        const next = verbAt(raw, j, lexicon);
        if (j < raw.length && /^\p{Ll}/u.test(raw[j]) && next?.includes('inf')) return 'verb';
        if (f[i + 1] === 'gern' && raw[i + 2] && lexicon?.genders?.has?.(f[i + 2]) && !OWN_KIND.job.has(f[i + 2]) && !JOB_SHAPE_FOLDED.test(f[i + 2])) return 'verb';
      }
    }
    // A verb said twice, once finite and once whole („Ich stehe um 7 Uhr aufstehen“).
    for (let i = 0; i < f.length; i += 1) {
      const p = verbAt(raw, i, lexicon);
      if (!p || p.every((x) => x === 'inf')) continue;
      const stemOfVerb = f[i].replace(/(?:est|st|et|t|e|en)$/, '');
      if (stemOfVerb.length >= 3 && f.some((x, k) => k > i && x !== f[i] && /en$/.test(x) && /^\p{Ll}/u.test(raw[k]) && x.endsWith(`${stemOfVerb}en`) && x.length > stemOfVerb.length + 3)) return 'twice';
    }
    // „nach der Schweiz“: a country with its article goes with „in“; „der Deutsch“: a language takes no article; „am Nacht“.
    for (let i = 0; i + 2 < f.length + 1; i += 1) {
      if (f[i] === 'nach' && DET_WORD.test(f[i + 1] || '') && (COUNTRY_ARTICLE[f[i + 2]] || COUNTRY_MAY_HAVE[f[i + 2]])) return 'word';
      if (/^(?:der|die|das|den|dem)$/.test(f[i]) && OWN_KIND.language.has(f[i + 1] || '') && /^\p{Lu}/u.test(raw[i + 1] || '') && !['auf', 'ins', 'in'].includes(f[i - 1] || '')) return 'article';
      if (f[i] === 'am' && f[i + 1] === 'nacht') return 'article';
    }
    // A verb of two parts in one piece after its subject („Ich aufstehe um sechs“, „Ich einkaufe“).
    for (let i = 0; i + 1 < f.length; i += 1) {
      if (PERSON_OF[f[i]] && unsplit(f[i + 1]) && /^\p{Ll}/u.test(raw[i + 1])) return 'verb';
    }
    // One preposition of place at a time: „Ich komme aus in Bremen“ (a verb's „mit“ may stand before one: „Ich komme mit
    // nach Berlin“).
    const PLACE_PREP = new Set(['aus', 'in', 'nach', 'von', 'im']);
    for (let i = 0; i + 1 < f.length; i += 1) if (PLACE_PREP.has(f[i]) && PLACE_PREP.has(f[i + 1]) && !(f[i] === 'von' && f[i + 1] === 'zu')) return 'extra';
    // A city or a country the course names without an article takes none („nach der Berlin“).
    for (let i = 0; i + 1 < f.length; i += 1) {
      // („Meine Heimat ist der Libanon.“: a country that may have its article, in the case its place asks for.)
      if (COUNTRY_MAY_HAVE[f[i + 1]] && DET_WORD.test(f[i]) && !BARE_PREP.has(f[i - 1] || '')) { if (f[i] === COUNTRY_MAY_HAVE[f[i + 1]]) continue; }
      // („aus dem Irak“, „im Iran“, „in den Libanon“)
      if (COUNTRY_MAY_HAVE[f[i + 1]] && ((f[i] === 'dem' && ['aus', 'von', 'in', 'bei', 'mit', 'zu'].includes(f[i - 1] || '')) || (f[i] === 'den' && ['in', 'für', 'durch'].includes(f[i - 1] || '')))) continue;
      if (DET_WORD.test(f[i]) && OWN_KIND.place.has(f[i + 1]) && !COUNTRY_ARTICLE[f[i + 1]] && /^\p{Lu}/u.test(raw[i + 1]) && !lexicon?.genders?.has?.(f[i + 1])) return 'article';
    }
    // The verb second: never at the end after its subject when something else stands first („Nach Berlin ich fahre“).
    const segments = sentence.join(' ').split(/\s+,\s+/).map((s) => s.split(/\s+/));
    for (const seg of segments) {
      const sf = seg.map(plainOf);
      if (seg.length < 3 || ['dass', 'weil', 'wenn', 'ob', 'denn', 'und', 'oder', 'aber'].includes(sf[0]) || QUESTION_WORDS.has(sf[0]) || PERSON_OF[sf[0]]) continue;
      const k = seg.length - 2;
      if (PERSON_OF[sf[k]] && !['und', 'oder'].includes(sf[k - 1]) && verbAt(seg, k + 1, lexicon) && !verbAt(seg, k - 1, lexicon) && !seg.slice(0, k).some((w, i) => verbAt(seg, i, lexicon))) return 'order';
    }
    // A day and a clock time need „um“ between them („am Freitag zehn“), and a month takes „im“, never „am“ („am Mai“).
    for (let i = 0; i + 1 < f.length; i += 1) {
      if (DAYS.includes(f[i]) && (/^\d{1,2}$/.test(f[i + 1]) || isNumberWord(f[i + 1])) && f[i + 2] !== 'uhr' && !MONTHS.includes(asciiUmlauts(f[i + 2] || ''))) return 'missing';
      if (['am', 'an'].includes(f[i]) && MONTHS.includes(asciiUmlauts(f[i + 1]))) return 'word';
    }
    // An adjective with no article before a taught noun takes the ending the noun asks for („Guten Tag“, „Gute Nacht“,
    // „Schönes Wochenende“, „Schöne Grüße“): „Schöne Tag!“ has none of a der-noun's.
    for (let i = 0; i + 1 < raw.length; i += 1) {
      const m = f[i].match(/^(\p{L}{3,}?)(er|en|em|es|e)$/u);
      const readings = lexicon?.genders?.get?.(f[i + 1]);
      if (!m || !readings || !/^\p{Lu}/u.test(raw[i + 1]) || (i > 0 && (DET_WORD.test(f[i - 1]) || /\d/.test(f[i - 1]) || isNumberWord(f[i - 1]))) || !(lexicon?.has?.(m[1]) || colourStem(m[1])) || lexicon?.genders?.has?.(m[1])) continue;
      const STRONG = { der: ['er', 'en', 'em', 'es'], die: ['e', 'er'], das: ['es', 'em'], pl: ['e', 'en', 'er'] };
      if (!readings.some((g) => STRONG[g].includes(m[2]))) return 'ending';
    }
    // An article needs its noun: „Mein Heft ist eine gelb.“
    if (raw.length >= 2 && /^k?ein(?:e|en|em|er|es)?$/.test(f.at(-2)) && /^\p{Ll}/u.test(raw.at(-1)) && (colourStem(f.at(-1)) || (lexicon?.has?.(f.at(-1)) && !lexicon?.genders?.has?.(f.at(-1)) && !personsOf(f.at(-1), lexicon)))) return 'article';
    // A question word and no verb: „Was dein Hobby?“, „Was Beruf Sie?“
    if (QUESTION_WORDS.has(f[0]) && f.length >= 3 && /\?\s*$/.test(String(text).trim()) && !raw.some((w, i) => verbAt(raw, i, lexicon))) return 'missing';
    // The prepositions of time: „am“ a day, „um“ a clock time („Hast du um Freitag am zehn Uhr Zeit?“).
    for (let i = 0; i + 1 < f.length; i += 1) {
      const next = f[i + 1];
      const date = MONTHS.includes(asciiUmlauts(f[i + 2] || '')) || /^\d/.test(f[i + 2] || '') || /^\d{1,2}\.\d/.test(next);
      const clock = (/^\d{1,2}$/.test(next) || isNumberWord(next) || ['halb', 'viertel'].includes(next)) && !date;
      if (f[i] === 'am' && clock) return 'word';
      if (f[i] === 'um' && (DAYS.includes(next.replace(/s$/, '')) || next === 'wochenende' || MONTHS.includes(asciiUmlauts(next)))) return 'word';
      if (['in', 'im'].includes(f[i]) && DAYS.includes(next)) return 'word'; // „Ich arbeite in Montag“
    }
    // An ending on an adjective after „sein“, at the end: „Ein Buch wäre schöne“, „Das ist gute“.
    const last = f.at(-1);
    let k = raw.length - 2;
    while (k > 0 && ['sehr', 'so', 'ganz', 'nicht', 'auch', 'zu', 'echt', 'wirklich', 'total'].includes(f[k])) k -= 1;
    const stem = last.replace(/(?:en|es|e)$/, ''); // never -er: „ist schöner“ compares
    if (k >= 0 && (SEIN_FORMS[f[k]]) && /^\p{Ll}/u.test(raw.at(-1)) && stem !== last && stem.length >= 3
      && (lexicon?.has?.(stem) || colourStem(stem)) && !lexicon?.genders?.has?.(stem) && !lexicon?.has?.(last) && !CLOSED.has(last)) return 'ending';
    // The perfect: „habe“ or „bin“ with a participle at the end.
    const auxAt = f.findIndex((w) => AUX_HABEN.has(w) || AUX_SEIN.has(w));
    if (auxAt >= 0) {
      const aux = f[auxAt];
      // („Ich bin in Berlin geboren und komme aus …“: „geboren“ says what one is.)
      const at = f.findIndex((w, i) => i > auxAt && w !== 'geboren' && /^\p{Ll}/u.test(raw[i]) && (participleOf(w) || badParticiple(w, lexicon)));
      if (at >= 0) {
        const w = f[at];
        if (badParticiple(w, lexicon)) return 'participle';
        const kind = participleOf(w);
        if (AUX_HABEN.has(aux) && kind === 'sein') return 'auxiliary';
        // „bin“ with a participle of „haben“: a perfect with the wrong auxiliary when something stands between them
        // („Ich bin Kaffee getrunken“) or the course says that participle with „habe“ („Ich bin gearbeitet“); alone it may
        // be a state („Ich bin verheiratet“, „Ich bin pensioniert“).
        const between = f.slice(auxAt + 1, at).filter((x) => !['nicht', 'gestern', 'heute', 'schon', 'noch', 'sehr', 'auch'].includes(x));
        if (['bin', 'bist'].includes(aux) && kind === 'haben' && (between.length || lexicon?.perfect?.has?.(w))) return 'auxiliary';
        const rest = f.slice(at + 1);
        if (rest.length && !rest.every((x) => WHEN_GLUE.has(x) || DAYS.includes(x.replace(/s$/, '')) || PAST_MARK.has(x) || clockOf(x) !== null || ['heute', 'uhr', 'wochenende', 'abend', 'morgen', 'nachmittag'].includes(x))) return 'order';
      } else {
        const lastVerb = /^\p{Ll}/u.test(raw.at(-1)) ? personsOf(raw.at(-1), lexicon) : null;
        const modal = f.some((w) => MODAL_FORMS[w]);
        // „Ich habe Kaffee trinken“; „Ich bin aus Syrien kommen“ (never „Mein Hobby ist Musik hören“).
        if (lastVerb?.includes('inf') && !modal && raw.length - 1 >= auxAt + 1 && auxAt > 0 && f[raw.length - 2] !== 'zu') {
          // („Ich habe arbeiten.“: the infinitive where the participle belongs, never right.)
          if (AUX_HABEN.has(aux)) return 'infinitive';
          if (['bin', 'bist'].includes(aux)) return 'verb';
        }
      }
    }
    // „gestern“ with the present: „Ich arbeite gestern“.
    if (f.some((w) => PAST_MARK.has(w)) && auxAt < 0 && !f.some((w) => /^(?:war|warst|waren|hatte|hattest|hatten)$/.test(w))) {
      if (raw.some((w, i) => verbAt(raw, i, lexicon) && !MODAL_FORMS[f[i]])) return 'tense';
    }
    // The finite verb second: never after a question word and its subject („Was du hast …?“), never after „ich“ and
    // another word („Ich gestern spiele …“, „Ich aus Syrien komme“).
    let q = 0;
    while (q < f.length && (QUESTION_WORDS.has(f[q]) || (q > 0 && ['viel', 'spät', 'uhr', 'lange', 'oft', 'alt'].includes(f[q])) || (q === 0 && f[q] === 'um' && QUESTION_WORDS.has(f[1] || '')))) q += 1;
    if (q > 0 && q < f.length && subjectAt(raw, q, lexicon) && verbAt(raw, q + subjectAt(raw, q, lexicon).len, lexicon)) return 'order';
    // A word the course does not teach in second place may be the learner's own verb („Ich wandere und schwimme gern“).
    const ownVerb = /^\p{Ll}\p{L}*(?:e|st|t|en)$/u.test(raw[1] || '') && !knownWord(raw[1], lexicon);
    if (q === 0 && PERSON_OF[f[0]] && f.length > 2 && f[1] !== 'und' && !ownVerb && !verbAt(raw, 1, lexicon) && raw.slice(2).some((w, i) => verbAt(raw, i + 2, lexicon))) return 'order';
  }
  return null;
}

/** A participle that is none: a weak verb with -en („gearbeiten“), a strong one with -t („gegeht“). */
function badParticiple(w, lexicon) {
  const f = plainOf(w);
  if (participleOf(f) || !/^\p{L}{0,6}ge\p{L}{3,}(?:en|t)$/u.test(f)) return false;
  if (STRONG_STEMS.test(f)) return true;
  const m = f.match(/^(?:\p{L}{0,6}?)ge(\p{L}{3,})en$/u);
  return Boolean(m && lexicon?.stems?.has?.(m[1]) && !STRONG_PARTICIPLES.has(`ge${m[1]}en`));
}

// A word the course knows: taught, said, one of the grader's lists, a number, a name or the learner's own place or job.
const knownWord = (w, lexicon) => {
  const f = plainOf(w);
  return CLOSED.has(f) || isNumberWord(f) || /\d/.test(f) || OWN_ALL.has(f) || lexicon?.has?.(f) || lexicon?.said?.has?.(f) || lexicon?.names?.has?.(f)
    || COURSE_WORDS.has(asciiUmlauts(f)) || MASS.has(f) || MEASURE_GENDER[f] !== undefined || PAST_BARE.has(f) || WHEN_GLUE.has(f) || DAYS.includes(f)
    || Boolean(personsOf(f, lexicon)) || Boolean(participleOf(f));
};

/** Text that is not German: no word of it is one the course knows, or most are not („I worked yesterday“, „asdf“). */
function notGerman(text, lexicon) {
  const words = wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' ')).filter((w) => /\p{L}/u.test(w));
  if (!words.length) return !/\d/.test(text);
  const known = words.filter((w) => knownWord(w, lexicon)).length;
  return known === 0 || known * 2 < words.length;
}

/** The words of an answer for comparing with the turn's answers: folded, without punctuation, greeting and politeness. */
function plainWords(turn, text) {
  let s = String(text).trim().replace(GREETING_FIRST, '');
  if (turn.partner) s = s.replace(new RegExp(`(?:^|[,\\s])${turn.partner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[,!.?\\s]|$)`, 'gi'), ' ');
  // A time or a date keeps its stop or colon („16:15“, „9.30“).
  return wordsOf(s.replace(/(?<!\d)[.:]|[.:](?!\d)|[,!?;„“"()]/g, ' ')).map(fold).filter((w) => !['bitte', 'danke'].includes(w));
}

/** One word that differs and the check can say how („kommen“ for „komme“, „von“ for „aus“, „Wohin“ for „Wann“). */
// Closed kinds of word: one in place of another kind is a fault the check names („blau“ where „hier“ is asked).
const PLACE_WORDS = new Set(['hier', 'da', 'dort', 'links', 'rechts', 'oben', 'unten', 'drinnen', 'draußen', 'draussen']);
const TIME_WORDS = new Set(['gestern', 'heute', 'morgen', 'vorgestern', 'übermorgen', 'jetzt']);
const kindOf = (w) => (PLACE_WORDS.has(w) ? 'place' : colourStem(w) ? 'colour' : DAYS.includes(w) ? 'day' : MONTHS.includes(asciiUmlauts(w)) ? 'month' : TIME_WORDS.has(w) ? 'time' : null);
function namedSwap(u, e) {
  if (!u || !e || u === e) return false;
  if (kindOf(u) && kindOf(e)) return true;
  const forms = (w) => SEIN_FORMS[w] ? 'sein' : HABEN_FORMS[w] ? 'haben' : MODAL_FORMS[w] ? `m:${w.slice(0, 3)}` : null;
  if (forms(u) && forms(u) === forms(e)) return true;
  if (CLOSED.has(u) && CLOSED.has(e)) return true;
  if (QUESTION_WORDS.has(u) && QUESTION_WORDS.has(e)) return true;
  if (DET_WORD.test(u) && DET_WORD.test(e)) return true;
  // Compared as spelt without umlauts too („schoenes“ is a form of „schönen“: the one spelling fold).
  const [a, b] = [asciiUmlauts(u), asciiUmlauts(e)];
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p += 1;
  if (p >= 4 || (p >= 3 && Math.min(a.length, b.length) <= 5)) return true; // one word in another form
  return b.length >= 4 && levenshtein(a, b) <= 2;
}

/** A word the check names when it stands where it does not belong: a small word, a verb, the same word twice. */
const namedExtra = (u, lexicon, given) => CLOSED.has(u) || Boolean(personsOf(u, lexicon)) || given.filter((x) => x === u).length > 1;

/**
 * The fault the check can name against the turn's own answers (Rule 2): the answer is one of them with one word in
 * another form or another's place, one left out, one or two small words or verbs added, or the same words in another
 * order. A frame's gap is filled with the answer's own words, so only the frame's words are compared.
 */
const tokensOf = (s) => wordsOf(String(s).replace(/[.,!?;:„“"()]/g, ' ')).map(fold);
/**
 * The answer's words as the turn's answers are compared with: as typed, with the noun for a pronoun in its pronoun's
 * place („Das Wörterbuch ist blau“ → „es ist blau“), without an opening of the turn („Ja,“) or a closing „gut“.
 */
function givensOf(turn, text) {
  const plain = plainWords(turn, text);
  const givens = [plain];
  for (const [pronoun, nouns] of Object.entries(turn.nounFor || {})) {
    for (const noun of nouns) {
      const n = tokensOf(noun);
      if (n.every((w, i) => plain[i] === w) && plain.length > n.length) givens.push([fold(pronoun), ...plain.slice(n.length)]);
    }
  }
  const openers = [...(turn.answerWords || []), ...(turn.leadWords || [])].map(tokensOf).filter((o) => o.length);
  for (const g of [...givens]) for (const o of openers) if (o.every((w, i) => g[i] === w) && g.length > o.length) givens.push(g.slice(o.length));
  for (const g of [...givens]) if (g.length > 1 && ['gut', 'prima', 'super'].includes(g.at(-1))) givens.push(g.at(-2) === 'sehr' ? g.slice(0, -2) : g.slice(0, -1));
  return givens.filter((g) => g.length);
}
// A frame with at least one fixed word („…?“ alone verifies a question of any shape and is no frame to compare with).
const framesOf = (turn) => (turn.accepted || []).map((a) => [frameOf(a), a]).filter(([f]) => hasGap(f) && f.split(GAP).length === 2 && tokensOf(f.replace(new RegExp(GAP, 'g'), ' ')).length);

function nearFault(turn, text) {
  const givens = givensOf(turn, text);
  if (!givens.length) return null;
  const tokens = tokensOf;
  // The turn's answers as the answer is compared: without the partner's name and the politeness words (`plainWords`).
  // The words a turn takes alone are answers too („Mach's gut“ where „Mach gut!“ leaves out the „s“).
  const fixed = [...(turn.accepted || []).map(frameOf).filter((a) => !hasGap(a)), ...(turn.answerWords || [])].map((a) => plainWords(turn, a.replace(/’/g, "'")));
  const frames = framesOf(turn).map(([a]) => a.split(GAP).map(tokens));
  const starts = (g, h) => h.every((w, i) => g[i] === w);
  const ends = (g, t) => t.every((w, i) => g[g.length - t.length + i] === w);
  // An answer with a frame's words in place: what is wrong is in its gap (`gapFault`), or nothing the check names.
  if (givens.some((g) => frames.some(([h, t]) => g.length > h.length + t.length && starts(g, h) && ends(g, t)))) return null;
  let best = null;
  const offer = (size, named) => { if (named && (!best || size < best.size)) best = { size, named }; };
  // A whole sentence after the answer („Haben Sie Tee? Tee, bitte.“) is no word too many: it is graded as itself.
  const sentences = String(text).trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const ownSentence = (extra) => sentences.length > 1 && sentences.some((s) => { const w = plainWords(turn, s); return w.length && w.length === extra.length && w.every((x) => extra.includes(x)); });
  for (const g of givens) {
    for (const m of fixed) {
      const onlyUser = [...g];
      const onlyExp = [];
      for (const w of m) { const at = onlyUser.indexOf(w); if (at >= 0) onlyUser.splice(at, 1); else onlyExp.push(w); }
      const size = onlyUser.length + onlyExp.length;
      if (!size) { if (m.join(' ') !== g.join(' ')) offer(0, 'order'); continue; }
      // Another question word or phrase, the rest the same („Was Uhr ist es?“ for „Wie viel Uhr ist es?“).
      const QPHRASE = (w) => QUESTION_WORDS.has(w) || ['viel', 'viele', 'spät', 'lange', 'alt'].includes(w);
      if (onlyUser.length && onlyExp.length && [...onlyUser, ...onlyExp].every(QPHRASE) && onlyUser.some((w) => QUESTION_WORDS.has(w))) { offer(size, 'word'); continue; }
      if (onlyExp.length === 1 && !onlyUser.length) offer(size, 'missing');
      else if (!onlyExp.length && onlyUser.length <= 2 && onlyUser.every((u) => namedExtra(u, turn.lexicon, g)) && !ownSentence(onlyUser)) offer(size, 'extra');
      else if (onlyExp.length === 1 && onlyUser.length === 1 && namedSwap(onlyUser[0], onlyExp[0])) offer(size, 'word');
      // Two words in other forms, each one the check names („Wie spät bist du?“ for „Wie spät ist es?“).
      else if (onlyExp.length === 2 && onlyUser.length === 2 && g.length === m.length) {
        const pairs = g.map((w, i) => [w, m[i]]).filter(([u, e]) => u !== e);
        if (pairs.length === 2 && pairs.every(([u, e]) => namedSwap(u, e))) offer(size, 'word');
      }
    }
    for (const [h, t] of frames) {
      if (g.length <= h.length + t.length - 1) continue;
      // One word of the frame in another form or another's place („Ich kommen aus …“, „Ich komme von …“) — never in a
      // frame of one fixed word, which says nothing of the word in its place („Nach …“ makes no „ich“ a wrong „nach“).
      const wrong = [...h.map((w, i) => [g[i], w]), ...t.map((w, i) => [g[g.length - t.length + i], w])].filter(([u, e]) => u !== e);
      if (wrong.length === 1 && h.length + t.length >= 2 && namedSwap(...wrong[0])) offer(1, 'word');
      // One word of the frame left out („Ich wohne Bremen“).
      for (const [part, other, front] of [[h, t, true], [t, h, false]]) {
        part.forEach((_, k) => {
          const less = part.filter((__, j) => j !== k);
          if (!less.length && !other.length) return; // a frame of one word without it is no frame: it matches anything
          if (front ? starts(g, less) && ends(g, other) : starts(g, other) && ends(g, less)) offer(1, 'missing');
        });
      }
      // The frame's words, all there, in other places („Aus Syrien ich komme“).
      const bag = [...g];
      if ([...h, ...t].every((w) => { const at = bag.indexOf(w); if (at < 0) return false; bag.splice(at, 1); return true; }) && h.length + t.length >= 2) offer(2, 'order');
    }
  }
  return best?.named || null;
}

/**
 * A fault the check names in an own answer's gap (Rule 2), when the answer has the frame's words in place: an empty or
 * small-word gap, a taught word of another kind (a language for a place, „müde“ for a job), a determiner of the wrong
 * case for the thing, a verb form for an activity, no time where a time is asked or another time than the one asked.
 * Null when the gap holds German the gap's check does not cover („am 15. Mai“): BEYOND.
 */
function gapFault(turn, text) {
  // Here „bitte“ and „danke“ stay (a frame may have them: „…, bitte.“), and a bare gap („…“) is a frame too.
  const polite = wordsOf(String(text).trim().replace(GREETING_FIRST, '').replace(/(?<!\d)[.:]|[.:](?!\d)|[,!?;„“"()]/g, ' ')).map(fold);
  const frames = (turn.accepted || []).map((a) => [frameOf(a), a]).filter(([f]) => hasGap(f) && f.split(GAP).length === 2);
  for (const given of [polite, ...givensOf(turn, text)]) for (const [frame, a] of frames) {
    const props = typeof a === 'string' ? turn : { ...turn, ...a };
    const [head, tail] = frame.split(GAP).map((s) => wordsOf(s.replace(/[.,!?;:„“"()]/g, ' ')).map(fold));
    if (given.length < head.length + tail.length || head.some((w, i) => given[i] !== w) || tail.some((w, i) => given[given.length - tail.length + i] !== w)) continue;
    const gap = given.slice(head.length, given.length - tail.length);
    if (!gap.length || gap.every((w) => CLOSED.has(w))) return 'missing';
    const slot = props.slot;
    const lexicon = turn.lexicon;
    const taughtOnly = (w) => (lexicon?.has?.(w) || lexicon?.said?.has?.(w)) && !OWN_ALL.has(w);
    if (gap.length === 1 && ['place', 'job', 'language', 'hobby', 'thing', 'object', 'color'].includes(slot) && taughtOnly(gap[0])
      && !(props.slotWords || []).some((x) => fold(x) === gap[0])) return 'kind';
    // A thing of the other kind („Kuchen“ for a drink), another than the one offered, or a „kein“ that refuses where the
    // task accepts (and the reverse).
    if (slot === 'thing' || slot === 'object') {
      if (gap.some((w) => otherThing(w, props.thingKind, lexicon))) return 'kind';
      if (props.only && !gap.some((w) => props.only.some((n) => fold(n) === w) || MEASURE_GENDER[w] !== undefined) && gap.some((w) => lexicon?.genders?.has?.(w))) return 'task';
      if (Boolean(props.negative) !== gap.some((w) => /^kein/.test(w))) return 'task';
    }
    if (slot === 'place' && gap.length === 1 && (OWN_KIND.language.has(gap[0]) || OWN_KIND.job.has(gap[0]))) return 'kind';
    if (slot === 'job' && gap.length === 1 && (OWN_KIND.place.has(gap[0]) || OWN_KIND.language.has(gap[0]))) return 'kind';
    // A word of the kind with an ending is a form of it („Ich spreche Deutsche“, „Ich bin Studenten“).
    const slotted = (props.slotWords || []).map(fold);
    if (['place', 'job', 'language', 'color'].includes(slot) && gap.some((w) => slotted.some((t) => [1, 2].some((n) => w.length - n === t.length && w.startsWith(t)) && !slotted.includes(w)))) return 'word';
    const isJob = (w) => slotted.includes(w) || OWN_KIND.job.has(w) || JOB_SHAPE_FOLDED.test(w);
    if (slot === 'job') {
      // One job, and where after it with a preposition („Lehrer Student“ names two; „Lehrer Bremen“ leaves out „in“).
      if (gap.filter((w) => slotted.includes(w)).length > 1) return 'extra';
      const at = gap.findIndex(isJob);
      if (at >= 0 && gap[at + 1] && OWN_KIND.place.has(gap[at + 1])) return 'missing';
      if (gap.length <= 2 && gap.some((w) => lexicon?.genders?.has?.(w) && !isJob(w))) return 'kind'; // „Ich bin Limonade“
      if (gap.length === 1 && (lexicon?.has?.(gap[0]) || lexicon?.said?.has?.(gap[0])) && !isJob(gap[0]) && !OWN_ALL.has(gap[0]) && /^\p{Ll}/u.test(gap[0])) return 'kind';
    }
    if (slot === 'language') {
      // Each item a language, and at least one spoken („Deutsch und Marokko“, „kein Deutsch“).
      const items = gap.filter((w) => !['und', 'oder', 'gut', 'sehr', 'ein', 'bisschen', 'wenig', 'etwas', 'auch', 'nur', 'noch', 'kein', 'nicht'].includes(w));
      if (items.some((w) => OWN_KIND.place.has(w) || OWN_KIND.job.has(w) || lexicon?.genders?.has?.(w) || (lexicon?.has?.(w) && !OWN_KIND.language.has(w)))) return 'kind';
      if (gap.some((w) => ['kein', 'nicht'].includes(w)) && !gap.some((w, i) => OWN_KIND.language.has(w) && !['kein', 'nicht'].includes(gap[i - 1]))) return 'task';
    }
    // The own-word policy names the kind: a job by list or shape, a language by its closed list or „-isch“ („Ich bin
    // Limonade“, „Sie spricht Brötchen“ name none).
    if (slot === 'job' && gap.length === 1 && !isJob(gap[0]) && !lexicon?.names?.has?.(gap[0])) return 'kind';
    if (slot === 'language' && gap.length === 1 && !OWN_KIND.language.has(gap[0]) && !LANGUAGE_SHAPE_FOLDED.test(gap[0]) && !slotted.includes(gap[0])) return 'kind';
    // A colour where a colour is asked („Ist deine Tasche klein?“), a number where a number is („Meine Telefonnummer ist
    // Bremen“), two years or more with „Jahre“ („1 Jahre alt“).
    if (slot === 'color' && gap.some((w) => !isColour(w, props.slotWords || []) && !['hell', 'dunkel', 'sehr', 'ganz', 'auch', 'nur', 'nicht', 'und', 'oder'].includes(w))) return 'kind';
    if (['phone', 'number', 'years'].includes(slot) && gap.some((w) => /\p{L}/u.test(w) && !isNumberWord(w))) return 'kind';
    if (slot === 'years' && gap.every((w) => /^\d+$/.test(numberWordsToDigits(w))) && Number(numberWordsToDigits(gap.join(' ')).replace(/\D/g, '')) < 2) return 'word';
    // People where the turn asks who comes („Ein Stuhl kommt“).
    if (props.people && gap.some((w) => lexicon?.genders?.has?.(w) && !PEOPLE.has(w))) return 'kind';
    // A place of another sitting („nach Berlin“ where this journey goes to Österreich).
    if (slot === 'place' && props.only && !props.only.some((o) => gap.includes(fold(o)))) return 'task';
    // A day that its month does not have („am 31. Februar“).
    if (slot === 'month' && gap.some((w) => /^\d/.test(w))) return 'date';
    // A thing is a noun, with the ending its article asks for on an adjective („die roten Lampe“, „Ich kaufe groß“).
    if (slot === 'thing' || slot === 'object') {
      const rawGap = wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' ')).slice(-gap.length - tail.length, tail.length ? -tail.length : undefined);
      if (!gap.some((w, i) => /^\p{Lu}/u.test(rawGap[i] || '') || lexicon?.genders?.has?.(w) || MASS.has(w))) return 'kind';
      const d = gap.findIndex((w) => DET_WORD.test(w));
      if (d >= 0 && gap[d + 2] && /^\p{Ll}/u.test(rawGap[d + 1] || '')) {
        const g = lexicon?.genders?.get?.(gap[d + 2]);
        const det = { der: 'der', die: 'die', das: 'das', den: 'den' }[gap[d]] ?? gap[d];
        if (g && !g.some((x) => adjectiveFits(rawGap[d + 1], slot, det, x, lexicon))) return 'ending';
      }
    }
    // (Not where a preposition opens a second noun: „die Fahrkarte für den Bus“.)
    if ((slot === 'thing' || slot === 'object') && DET_WORD.test(gap[0]) && !gap.slice(1).some((w) => NON_PARTICLE_PREP.has(w) || BARE_PREP.has(w))) {
      const readings = lexicon?.genders?.get?.(gap.at(-1)) || ownReadings(gap.at(-1));
      const table = slot === 'thing' ? ACCUSATIVE_OF : { der: ['der', ...POSSESSIVE], das: ['das', ...POSSESSIVE], die: ['die', ...POSSESSIVE.map((p) => `${p}e`)], pl: ['die', ...POSSESSIVE.filter((p) => p !== '').map((p) => `${p}e`)] };
      if (readings && !readings.some((g) => table[g].includes(gap[0]))) return 'case';
    }
    if (slot === 'activity' && personsOf(gap[0], lexicon) && !personsOf(gap[0], lexicon).includes('1s')) return 'agreement';
    // Rule 5: what one does is no person or furniture („Ich spiele gern Tisch“), a name no number („Ich heiße sieben“).
    if (slot === 'activity' && gap.some((w, i) => i > 0 && ['family', 'furniture'].includes(taughtKind(w)) && !ATTACHED.test(gap[i - 1]))) return 'kind';
    if (slot === 'name' && gap.some((w) => !CLOSED.has(w) && isNumberWord(w))) return 'kind';
    if (slot === 'when' || slot === 'clock') {
      const timeish = gap.some((w) => DAYS.includes(w.replace(/s$/, '')) || DAY_PARTS.includes(w.replace(/s$/, '')) || MONTHS.includes(asciiUmlauts(w)) || /\d/.test(w)
        || isNumberWord(w) || clockOf(w) !== null || ['wochenende', 'woche', 'uhr', 'heute', 'morgen', 'abend', 'mittag', 'nacht', 'jahr', 'monat', 'halb', 'viertel'].includes(w));
      if (!timeish) return 'task';
      // Rule 5: a clock gap takes a clock time („Um Montag stehe ich auf“), a time in a sentence its „um“ („Ich habe
      // sieben Zeit“).
      if (slot === 'clock' && clockOf(gap.filter((w) => !/^(?:morgens|vormittags|nachmittags|abends|früh)$/.test(w)).join(' ')) === null) return 'kind';
      if (slot === 'when' && !whenOf(gap.join(' '), { inSentence: true }) && whenOf(`um ${gap.join(' ')}`, { inSentence: true })) return 'missing';
      const at = whenOf(gap.join(' '));
      if (at && ((props.when && !sameWhen(at, props.when, { partial: props.whenPartial })) || (props.time && at.time !== null && at.time !== clockOf(props.time)))) return 'task';
    }
    if (slot === 'invite' && !whenOf(gap.join(' '), { inSentence: true }) && whenOf(`um ${gap.join(' ')}`, { inSentence: true })) return 'missing';
    if (slot === 'past') {
      if (!gap.some((w) => participleOf(w) || badParticiple(w, lexicon)) && gap[0] !== 'war') return 'participle';
      // A participle the Lektion teaches: a taught word between in the wrong form („Ich habe ein Kuchen gemacht“).
      const raw = wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' '));
      const end = raw.length - tail.length;
      if (raw.length === given.length && props.taught?.some((p) => fold(p) === fold(raw[end - 1])) && AUX_HABEN.has(fold(raw[head.length]))
        && pastMiddle(raw.slice(head.length + 1, end - 1), lexicon, { objectless: objectless(fold(raw[end - 1])) }) === RESULT.WRONG) {
        return pastMiddle(raw.slice(head.length + 1, end - 1), lexicon) === RESULT.WRONG ? 'word' : 'kind';
      }
    }
    if (slot === 'adjunct') {
      const raw = wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' '));
      const middle = raw.slice(head.length, raw.length - tail.length);
      if (raw.length === given.length && pastMiddle(middle, lexicon, { objectless: true }) === RESULT.WRONG) return pastMiddle(middle, lexicon) === RESULT.WRONG ? 'word' : 'kind';
    }
  }
  return null;
}

// How the turn speaks to its partner: „du“ or „Sie“, from its own answers.
const ADDRESS_DU = /^(?:du|dich|dir|dein|deine|deinen|deinem|deiner|deines)$/;
function addressOf(text) {
  const raw = wordsOf(String(text).replace(/[.,!?;:„“"()…]/g, ' '));
  const out = new Set();
  raw.forEach((w, i) => {
    const f = fold(w);
    if (ADDRESS_DU.test(f)) out.add('du');
    if (/^(?:Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer)$/.test(w) || (w === 'Sie' && i > 0)) out.add('Sie');
  });
  return out;
}

/**
 * What a task asks that the answer does not do, said the way a teacher says it (Rule 2): the partner addressed the
 * other way („Tanzen Sie gern?“ to Lena), a statement where the task asks a question or the reverse, another person
 * than the turn's answers speak of („Du sprichst Arabisch“ for one's own languages), another verb than the turn's
 * („Ich wohne in Bremen“ for where one comes from), the word the task names swapped for another („Durst“ for
 * „Hunger“).
 */
function taskShapeFault(turn, text) {
  const accepted = (turn.accepted || []).map(frameOf);
  if (!accepted.length) return null;
  // Another day or time than the one the task gives („Ja, am Donnerstag um zehn.“ where Lena is free on Friday at ten).
  if (turn.when || turn.time) {
    const timeWord = (w) => WHEN_GLUE.has(w) || DAYS.includes(w.replace(/s$/, '')) || DAY_PARTS.includes(w.replace(/s$/, '')) || /\d/.test(w) || isNumberWord(w)
      || ['uhr', 'halb', 'viertel', 'nach', 'vor', 'wochenende', 'abends'].includes(w);
    const at = whenOf(wordsOf(String(text).replace(/[,!?;„“"()]/g, ' ').replace(/\.(?=\s|$)/g, ' ')).filter((w) => timeWord(fold(w))).join(' '));
    if (at && turn.when && !sameWhen(at, turn.when, { partial: turn.whenPartial })) return 'task';
    if (at && turn.time && at.time !== null && at.time !== clockOf(turn.time)) return 'task';
  }
  // Yes where every answer of the turn says no, and the reverse („Ein Stück Kuchen, bitte.“ to decline, „Kein Wasser,
  // bitte.“ to accept).
  const NO = /\b(?:nein|kein|keine|keinen|keinem|keiner|nicht|nichts)\b/iu;
  const saysNo = (a) => (typeof a === 'object' && a.negative) || NO.test(frameOf(a));
  if ((turn.accepted || []).every(saysNo) && !NO.test(text)) return 'task';
  if (!(turn.accepted || []).some(saysNo) && !(turn.answerWords || []).some((w) => NO.test(w)) && /\b(?:nein|kein|keine|keinen)\b/iu.test(text) && !/\?\s*$/.test(String(text).trim())) return 'task';
  // An opener alone, or one word off it („Mach gut!“ where „Mach's gut“ may only open the wish): the answer is missing.
  const plainAnswer = plainWords(turn, text);
  for (const lead of turn.leadWords || []) {
    const l = plainWords(turn, lead.replace(/’/g, "'"));
    if (l.length === plainAnswer.length && l.filter((w, i) => w !== plainAnswer[i]).length <= 1 && l.every((w, i) => w === plainAnswer[i] || namedSwap(plainAnswer[i], w))) return 'missing';
  }
  // An invitation asks („Kommst du?“) or invites („Ich lade dich ein“): the news alone invites nobody.
  if (turn.slot === 'invite' && !/\?/.test(text) && !/\blade\b.*\bein\b/iu.test(text)) return 'missing';
  // An honest none of another question („Ich bin arbeitslos“ where the turn asks for a hobby or a time).
  const said = plainWords(turn, text).join(' ');
  if (Object.values(HONEST_NONE).flat().some((l) => tokensOf(l).join(' ') === said) && !accepted.some((a) => tokensOf(a).join(' ') === said)) return 'task';
  // After the photo, the person chosen: „Meine Mutter …“ where the learner chose the sister (`nounFor`).
  const plainAll = plainWords(turn, text);
  const allowed = Object.values(turn.nounFor || {}).flat().map((n) => tokensOf(n).join(' '));
  if (allowed.length && DET_WORD.test(plainAll[0] || '') && PEOPLE.has(plainAll[1] || '') && !allowed.includes(`${plainAll[0]} ${plainAll[1]}`)) return 'person';
  // The partner addressed as the turn's answers address them.
  const theirs = new Set(accepted.flatMap((a) => [...addressOf(a)]));
  const mine = addressOf(text);
  if (theirs.size === 1 && mine.size && ![...mine].some((x) => theirs.has(x))) return 'address';
  // A question where the answers ask one, a statement where they state one.
  const isQuestion = (s) => /\?\s*$/.test(String(s).trim());
  const sentences = String(text).split(/(?<=[.!?])\s+/).filter((s) => /\p{L}/u.test(s));
  if (accepted.every(isQuestion) && sentences.length && !sentences.some(isQuestion)) return 'task';
  if (!accepted.some(isQuestion) && sentences.length && sentences.every(isQuestion)) return 'task';
  // The person the answers speak of: one's own answer is no answer about the partner, and the reverse.
  const lexicon = turn.lexicon;
  const personOf = (s) => {
    const raw = commaFree(sentencesOf(s).flat());
    for (let i = 0; i < raw.length; i += 1) {
      const subject = subjectAt(raw, i, lexicon);
      if (!subject || (i > 0 && (BARE_PREP.has(plainOf(raw[i - 1])) || ACCUSATIVE_ONLY.has(plainOf(raw[i - 1]))))) continue;
      // A person: a pronoun, a name, a person noun („mein Bruder“) — never a thing („Ein Buch wäre schön“).
      if (subject.len === 2 && !PEOPLE.has(plainOf(raw[i + 1]))) continue;
      const verb = verbAt(raw, i + subject.len, lexicon) || (i > 0 ? verbAt(raw, i - 1, lexicon) : null);
      if (verb) return subject.persons.filter((p) => verb.includes(p));
      // A frame whose gap holds the verb („Ich … gern.“): its pronoun is its person.
      if (raw[i + 1] === GAP && PERSON_OF[plainOf(raw[i])] && !['sie'].includes(plainOf(raw[i]))) return subject.persons;
    }
    return null;
  };
  // Compared with the answers of the same kind (statements, questions) that name a person.
  const sameKind = accepted.filter((a) => isQuestion(a) === (sentences.length > 0 && sentences.every(isQuestion)));
  const asked = sameKind.map(personOf).filter((p) => p?.length);
  const given = personOf(text);
  if (given?.length && asked.length && !asked.some((p) => p.some((x) => given.includes(x)))) return 'person';
  // A yes/no question where the answers ask with a question word, and the reverse („Wann fährt der Zug nach Berlin?“
  // where the task asks whether it goes there).
  const opensWith = (s) => { const w = tokensOf(s); return QUESTION_WORDS.has(w[0]) || (w[0] === 'um' && QUESTION_WORDS.has(w[1])) ? 'w' : personsOf(w[0] || '', lexicon) ? 'verb' : null; };
  const questions = accepted.filter(isQuestion).map((a) => opensWith(a.replace(new RegExp(GAP, 'g'), ' ')));
  const mineOpens = sentences.length === 1 && isQuestion(sentences[0]) ? opensWith(plainWords(turn, sentences[0]).join(' ')) : null;
  if (mineOpens && questions.length && questions.every((q) => q && q !== mineOpens)) return 'task';
  // Another verb than the turn's own answers and its cue have („Ich wohne in …“ for „Woher kommen Sie?“, „Was kostet
  // das?“ for „Was ist das?“). Not where the answer has words of its own the course does not teach („Ich mache eine
  // Ausbildung“): its own content may need its own verb.
  // Only a verb of content counts on the answer's side („Ein Buch wäre schön“, „Ich mag Musik“ name no other act), and
  // never where a gap of the turn takes any verb (an activity, a question, the past).
  const lemma = (w) => { const f = plainOf(w); return SEIN_FORMS[f] ? 'sein' : HABEN_FORMS[f] ? 'haben' : MODAL_FORMS[f] ? `m:${f.slice(0, 3)}` : stemOf(w, lexicon); };
  const verbsOf = (s) => { const raw = commaFree(sentencesOf(s).flat()); return raw.map((w, i) => (verbAt(raw, i, lexicon) ? lemma(w) : null)).filter(Boolean); };
  const turnVerbs = new Set([...accepted, String(turn.cue?.de || ''), ...(turn.answerWords || []), ...(turn.leadWords || [])].flatMap(verbsOf));
  const myVerbs = verbsOf(text).filter((v) => v !== 'sein' && v !== 'haben' && !v.startsWith('m:'));
  const ownWords = plainWords(turn, text).some((w) => /\p{L}{2,}/u.test(w) && !knownWord(w, lexicon));
  const openVerb = (turn.accepted || []).some((a) => {
    const slot = typeof a === 'string' ? turn.slot : a.slot ?? turn.slot;
    return hasGap(frameOf(a)) && (['activity', 'duQuestion', 'past', 'adjunct', 'words', undefined].includes(slot) || !tokensOf(frameOf(a).replace(new RegExp(GAP, 'g'), ' ')).length);
  });
  if (turnVerbs.size && myVerbs.length && !ownWords && !openVerb && !myVerbs.some((v) => turnVerbs.has(v))) return 'task';
  // What the task names — a thing, a day, a month, „gestern“ — and the answer names another of the same kind instead
  // („Ich habe Durst“ where the task says „Hunger“, „am Sonntag“ where it says „Samstag“, „morgen“ for „gestern“).
  const task = String(turn.taskDe || '');
  const plain = plainWords(turn, text);
  const taskWords = wordsOf(task.replace(/[.,!?;:„“"()]/g, ' '));
  // A thing or a place the task names and an answer of the turn has („Hunger“, „Berlin“): the answer names another.
  const someAnswer = (w) => accepted.some((a) => tokensOf(a).includes(w));
  const placeLike = (w) => OWN_KIND.place.has(w) || (turn.slotWords || []).some((x) => fold(x) === w);
  const namedNouns = taskWords.filter((w) => /^\p{Lu}/u.test(w) && (lexicon?.genders?.has?.(fold(w)) || placeLike(fold(w))) && someAnswer(fold(w))).map(fold);
  // …only where the named word in its place makes an answer the turn verifies („Ich habe Hunger“ for „Ich habe Durst“).
  const missingNamed = namedNouns.filter((n) => !plain.includes(n));
  if (missingNamed.length) {
    for (const w of wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' '))) {
      for (const n of missingNamed) {
        if (fold(w) === n || !(lexicon?.genders?.has?.(fold(w)) || placeLike(fold(w)))) continue;
        const swapped = String(text).replace(w, n.charAt(0).toLocaleUpperCase('de') + n.slice(1));
        if (verifiedResult(typedCore(turn, swapped))) return 'task';
      }
    }
  }
  const kinds = (ws) => new Map(ws.map((w) => [fold(w), kindOf(fold(w))]).filter(([, k]) => k && k !== 'place' && k !== 'colour'));
  const taskKinds = kinds(taskWords);
  const answerKinds = kinds(plain);
  for (const [w, k] of answerKinds) {
    const asked = [...taskKinds].filter(([, kk]) => kk === k).map(([x]) => x);
    if (asked.length && !asked.includes(w) && !asked.some((x) => answerKinds.has(x))) return 'task';
  }
  return null;
}

/** The stem of a verb form the course says („wohne“ → wohn, „fährt“ → fahr), for comparing verbs. */
function stemOf(word, lexicon) {
  const f = plainOf(word);
  for (const ending of ['est', 'et', 'en', 'st', 'e', 't']) {
    if (!f.endsWith(ending)) continue;
    const stem = f.slice(0, -ending.length);
    if (lexicon?.stems?.has?.(stem)) return stem;
    for (const [a, b] of [['äu', 'au'], ['ä', 'a'], ['ie', 'e'], ['i', 'e'], ['ö', 'o']]) if (stem.includes(a) && lexicon?.stems?.has?.(stem.replace(a, b))) return stem.replace(a, b);
  }
  return f;
}

/** The task asks for a sentence and the answer has no verb in it („Fußball.“, „Gern kochen.“). */
// …and where every answer the turn accepts has a verb, so does the answer („Um sechs Uhr.“ for when one gets up).
function sentenceFault(turn, text) {
  // An -en form with no subject anywhere is an infinitive („Am Wochenende schwimmen.“), not the verb of a sentence.
  const hasVerb = (s) => {
    const raw = commaFree(sentencesOf(s).flat());
    const subject = raw.some((w, i) => subjectAt(raw, i, turn.lexicon));
    return raw.some((w, i) => { const p = verbAt(raw, i, turn.lexicon) || []; return p.some((x) => x !== 'inf') && (subject || !p.includes('inf')); });
  };
  // A frame whose gap holds the verb (an activity, a question, the past) has one.
  const verbGap = (a) => ['activity', 'duQuestion', 'past'].includes(typeof a === 'string' ? turn.slot : a.slot ?? turn.slot) && hasGap(frameOf(a));
  const every = (turn.accepted || []).length && (turn.accepted || []).every((a) => verbGap(a) || hasVerb(frameOf(a).replace(new RegExp(GAP, 'g'), ' ')));
  if (!/\bSatz\b/.test(turn.taskDe || '') && !every) return null;
  return hasVerb(text) ? null : 'sentence';
}

/** The answer shares no word of content with anything the turn accepts or asks: it does not do the task („Hallo!“ for goodbye). */
function taskFault(turn, text) {
  const content = (w) => w.length >= 2 && !CLOSED.has(w) && !/^\d+$/.test(w);
  const own = new Set([...(turn.accepted || []).flatMap((a) => wordsOf(frameOf(a).replace(/[….,!?;:„“"()]/g, ' '))), ...(turn.answerWords || []), ...(turn.leadWords || []),
    ...(turn.slotWords || []), ...(turn.slotIn || []), String(turn.cue?.de || '')].flatMap((s) => wordsOf(String(s).replace(/[….,!?;:„“"()]/g, ' '))).map(fold).filter(content));
  // A question with another question word than every answer the turn accepts („Wo ist der Zug?“ where the task asks when).
  const qWord = (w) => (QUESTION_WORDS.has(w[0]) ? w[0] : w[0] === 'um' && QUESTION_WORDS.has(w[1]) ? w[1] : null);
  const asked = (turn.accepted || []).map(frameOf).filter((a) => /\?\s*$/.test(a)).map((a) => qWord(wordsOf(a.replace(/[….,!?;:„“"()]/g, ' ')).map(fold)));
  const mine = qWord(plainWords(turn, text));
  if (mine && asked.length && asked.every(Boolean) && !asked.includes(mine)) return 'task';
  const given = plainWords(turn, text).filter(content);
  if (!given.length) return 'task';
  // A word the course does not teach may be the learner's own content („Ich mache eine Ausbildung“).
  return given.some((w) => own.has(w) || !knownWord(w, turn.lexicon)) ? null : 'task';
}

/**
 * Why a typed answer is WRONG (Rule 2), or null when it is not: verified, or on-task German the check cannot fault
 * (BEYOND). Every WRONG names one of: spelling, heard, message, name (the closed turns), agreement, article, case,
 * ending, participle, auxiliary, verb, tense, order (a wrong form), missing, extra, word (against the turn's answers),
 * kind, task, sentence, german.
 */
export function wrongReason(turn, value) {
  if (slipFixed(turn, value)) return null;
  const core = typedCore(turn, value);
  if (verifiedResult(core)) return doubted(turn, value, core) ? READ_FAULT[secondReading(turn, value).say] || (notRead(turn, value) && SURE.has(readFault(turn, value)) ? readFault(turn, value) : null) : null;
  const reason = reasonFor(turn, value, core);
  if (reason && !readInFull(turn, value, reason)) return reason;
  return (secondReading(turn, value).say === 'yes' ? null : readFault(turn, value));
}

function reasonOf(turn, value) {
  const sequence = sequenceReason(turn, value);
  if (sequence) return sequence;
  const early = spelledOut(westernDigits(value), turn.lexicon);
  if (!turn.spell && !turn.listen && !turn.parts) {
    const none = noAnswer(turn, early);
    if (none) return none;
    // A fault of form wherever it stands, before a looser reading takes the answer as one it cannot judge (Claude score,
    // 2026-11-25: „Mein Geburtstag ist am Mai.“, „Ich habe arbeiten.“, „Ich habe gegangen.“, „Sie sprecht Arabisch.“ were BEYOND).
    const form = turn.ownName ? null : formFault(early, turn.lexicon);
    if (['word', 'infinitive', 'auxiliary', 'twice', 'case', 'agreement', 'order'].includes(form)) return form;
    const swap = turn.ownName ? null : pronounSwap(turn, early) || swappedPronoun(turn, early);
    if (swap) return swap;
  }
  // Section D: German the turn's answers do not have word for word („Und was machen Sie beruflich?“, „Einen Kaffee,
  // bitte.“, „Gestern habe ich gearbeitet.“) has no fault to name: BEYOND, and its cure is data.
  if (verifiedResult(tolerantCore(turn, value))) return null;
  const text = spelledOut(westernDigits(value), turn.lexicon);
  if (turn.spell) return 'spelling';
  if (turn.listen) return 'heard';
  if (turn.parts) return 'message';
  if (turn.ownName) return nameFault(turn, value, text);
  if (!/[\p{L}\p{N}]/u.test(text)) return 'missing';
  const form = formFault(text, turn.lexicon) || taskShapeFault(turn, text);
  if (form) return form;
  if (beyondOf(turn, text)) return null;
  if (notGerman(text, turn.lexicon)) return 'german';
  return nearFault(turn, text) || gapFault(turn, text) || sentenceFault(turn, text) || taskFault(turn, text) || null;
}

/**
 * The certain faults of an answer with one's own name (both corpora of 2026-11-25: „Mein Vorname ist Salma.“, „Mein Name ist
 * Rossi, Marco Rossi.“ were called wrong): an opening with nothing after it or with a word that is no name („Ich heiße
 * müde“, „Ich bin Student“), and an opening one word away („Ich heißen Omar“, „Ich Omar“). Any other way to say a name is
 * German the check does not know: BEYOND.
 */
/** „Guten Tag, hier ist Herr Weber.“: the partner's name is not the learner's (fresh corpora of round 4). */
const partnerNamed = (turn, value) => { const name = String(turn.partner || '').match(/^(?:Herr|Frau)\s+(\p{L}+)$/u)?.[1]; return Boolean(name) && new RegExp(`(?<!\\p{L})(?:Herr|Frau)\\s+${name}(?!\\p{L})`, 'u').test(String(value)) && !new RegExp(`(?:ich|Sie)\\s+(?:heiße|heißen)|danke|guten tag,? (?:herr|frau) ${name}[,!.]`, 'iu').test(String(value)) && /(?:hier ist|hier spricht|ich bin|mein name ist)\s+(?:Herr|Frau)\s+/iu.test(String(value)); };
function nameFault(turn, value, text) {
  if (!/\p{L}/u.test(text)) return 'missing';
  if (wordsOf(String(value).replace(/[.,!?;:]/g, ' ')).some((w) => NO_NAME.has(fold(w)) && !turn.lexicon?.genders?.has?.(fold(w)))) return null;
  const form = formFault(text, turn.lexicon);
  if (form) return form;
  const openings = turn.accepted.map((o) => wordsOf(fold(o).replace(/[.,!?;:]/g, ' ')));
  for (const s of [value, ...withoutCourtesy(value, turn)]) {
    const raw = wordsOf(String(s)).map((w) => w.replace(/[.,!?;:]+$/, '')).filter(Boolean);
    const said = raw.map(fold);
    for (const o of openings) {
      if (!o.every((w, i) => said[i] === w)) continue;
      const next = raw[o.length];
      if (!next) return 'missing';
      // „Ich bin Frau Haddad.“ names the person; „Ich bin die Salma“ and „Ich bin aus Syrien“ are other sentences.
      if (/^(?:frau|herr)$/i.test(next)) return raw[o.length + 1] ? null : 'missing';
      // („Ich bin die Layla.“ is how many say it.)
      if (/^(?:die|der)$/i.test(next) && raw[o.length + 1] && isName(turn, raw[o.length + 1])) return null;
      if (!isName(turn, next)) return 'name';
      const rest = raw.slice(o.length + 1);
      if (rest.length && openings.some((x) => x.every((w, i) => fold(rest[i] || '') === w))) return 'name';
    }
    // One of the opening's words left out or in another form, the name after it: „Ich Omar“, „Ich heißen Omar“, „Mein Name Omar“.
    if (raw.length <= 5) {
      for (const o of openings) {
        const without = o.map((_, k) => o.filter((__, i) => i !== k));
        if (without.some((x) => x.length && x.every((w, i) => said[i] === w) && raw[x.length] && raw.length <= x.length + 2 && isName(turn, raw[x.length]))) return 'missing';
        if (said.length > o.length && raw.length <= o.length + 2 && isName(turn, raw[o.length]) && o.filter((w, i) => said[i] !== w).length === 1
          && o.some((w, i) => said[i] !== w && w.slice(0, 3) === (said[i] || '').slice(0, 3))) return 'agreement';
      }
    }
  }
  return englishIn(turn, value) ? 'english' : null;
}

// What the course teaches to say of a person (Lektion 2 and 3), as a sentence beside the answer: „Das ist mein Bruder, er heißt Sami.“
// One's own name beside a greeting („Hallo! Ich bin Fatima.“, Lektion 1).
const NAME_CLAUSES = ['Ich heiße …', 'Mein Name ist …', 'Ich bin …'].map((frame) => ({ frame, slot: 'name', slotWords: [] }));
const PERSON_CLAUSES = ['Er', 'Sie'].flatMap((p) => [[`${p} heißt ${GAP}`, 'name'], [`${p} wohnt in ${GAP}`, 'place'], [`${p} lebt in ${GAP}`, 'place'], [`${p} ist ${GAP} Jahre alt.`, 'years'],
  [`${p} ist schon ${GAP}`, 'number'], [`${p} ist erst ${GAP}`, 'number'], [`${p} arbeitet als ${GAP}`, 'job']]).map(([frame, slot]) => ({ frame, slot, slotWords: [] }));
// „Ich lade dir ein.“: with the other object pronoun the answer is verified, so the pronoun is the fault.
const PRONOUN_PAIRS = [['mir', 'mich'], ['dir', 'dich'], ['ihm', 'ihn']];
function swappedPronoun(turn, text) {
  for (const [x, y] of PRONOUN_PAIRS) {
    for (const [from, to] of [[x, y], [y, x]]) {
      const re = new RegExp(`(?<!\\p{L})${from}(?!\\p{L})`, 'iu');
      if (!re.test(text)) continue;
      const other = text.replace(re, (m) => (/^\p{Lu}/u.test(m) ? to.charAt(0).toLocaleUpperCase('de') + to.slice(1) : to));
      if (verifiedResult(typedCore(turn, other))) return 'word';
    }
  }
  return null;
}
// What is no answer at all: keys struck at random, one letter, „Keine Ahnung“.
const NOT_KNOWING = /^(?:keine\s+ahnung|wei(?:ß|ss)\s+(?:ich\s+)?nicht|ich\s+wei(?:ß|ss)\s+(?:es\s+|das\s+)?nicht|ich\s+verstehe\s+(?:das\s+|es\s+)?nicht|kein\s+kommentar|egal|nichts|no\s+idea|idk|k\.?\s?a\.?)$/iu;
function noAnswer(turn, text) {
  const plainText = String(text || '').trim().replace(/[.!?,;:]+/g, ' ').trim();
  if (NOT_KNOWING.test(plainText)) return 'answer';
  if (turn.ownName || turn.slot === 'name') return null;
  const words = wordsOf(plainText).filter((w) => /\p{L}/u.test(w));
  if (!words.length) return /\d/.test(plainText) ? null : 'nonsense';
  // Only small words no list knows, and never a verb the course says: no German the check could fail to judge.
  if (words.length <= 3 && words.every((w) => /^\p{Ll}/u.test(w) && !knownWord(w, turn.lexicon) && !finiteVerbAnywhere(w, turn.lexicon))) return 'nonsense';
  return null;
}
const finiteVerbAnywhere = (w, lexicon) => Boolean(personsOf(w, lexicon));

/** A sentence that an answer frame of the course verifies, with its gap and at least two fixed words. */
function clauseVerified(lexicon, clause) {
  const have = new Set([clause, ...verbSecond(clause)].flatMap((t) => tokensOf(t)));
  return [...(lexicon?.clauses || []), ...PERSON_CLAUSES, ...NAME_CLAUSES].some((c) => {
    // („Nein, danke, ich bin Stadt.“: beside another answer „Ich bin …“ names someone only with a name.)
    if (c.slot === 'name' && /^Ich bin/.test(c.frame)) {
      const named = clause.match(/^Ich\s+bin\s+(\p{Lu}\p{L}+)(?:\s+\p{Lu}\p{L}+)?[.!]?$/u);
      if (!named || OTHER_NOUNS.has(ascii(named[1])) || lexicon?.genders?.has?.(fold(named[1])) || lexicon?.has?.(fold(named[1]))) return false;
    }
    const fixedWords = tokensOf(c.frame.replace(new RegExp(GAP, 'g'), ' '));
    if (!hasGap(c.frame) || fixedWords.length < 2 || !fixedWords.every((w) => have.has(w))) return false;
    const props = { slot: c.slot, slotWords: c.slotWords, slotIn: c.slotIn, lexicon };
    return [clause, ...verbSecond(clause)].some((t) => verifiedResult(sentenceResult([c.frame], t, props)));
  });
}

/** „Wo ist mein Stift? Sie ist rot.“: er, sie or es takes up the one noun of the sentence before, in its gender. */
function pronounFits(parts, lexicon) {
  for (let i = 1; i < parts.length; i += 1) {
    const m = parts[i].match(/^(?:und\s+|aber\s+)?(er|sie|es)\s+(?:ist|kostet|hat|kommt|heißt|wohnt|spricht|arbeitet|war)(?!\p{L})/iu);
    if (!m) continue;
    const nouns = wordsOf(parts[i - 1].replace(/[.,!?;:]/g, ' ')).filter((w, k) => k > 0 && /^\p{Lu}/u.test(w)).map((w) => lexicon?.genders?.get?.(fold(w))).filter(Boolean);
    if (nouns.length !== 1 || nouns[0].includes('pl')) continue;
    const want = { der: 'er', die: 'sie', das: 'es' };
    // („das Kind … sie“, „das Mädchen … sie“: a person may be named by what they are.)
    if (!nouns[0].some((g) => want[g] === fold(m[1])) && !nouns[0].includes('das')) return false;
  }
  return true;
}

/**
 * An answer of two sentences or more (2026-11-25): at least one answers the turn, and every other one is courtesy, a
 * counter-question, a sentence the course says, or one its frames verify. A fault in any of them verifies nothing.
 */
function bySentences(turn, value) {
  const text = String(value || '').trim();
  const bySplit = (re) => text.split(re).map((s) => s.trim()).filter(Boolean);
  // „Ich komme aus Marokko und wohne in Bremen.“: after „und“ the subject may be the one before.
  const both = text.match(/^(Ich\s.+?),?\s+und\s+(\p{Ll}\p{L}+e\s.+)$/u);
  for (const parts of [bySplit(/(?<=[.!?])\s+/u), both ? [`${both[1]}.`, `Ich ${both[2]}`] : [], bySplit(/(?<=[.!?])\s+|,\s+(?=(?:und\s+|aber\s+|dann\s+)?(?:ich|du|er|sie|es|wir|das|mein|meine)\s)/iu)]) {
    if (parts.length < 2 || parts.length > 4) continue;
    let answers = 0;
    let worstOf = RESULT.CORRECT;
    const ok = parts.every((p) => {
      if (counterQuestion(p, turn) || (courtesyOnly(p, turn) && !verifiedResult(sentenceResult(turn.accepted, END.test(p) ? p : `${p.replace(/,$/, '')}.`, turn)))) return true;
      const plainPart = p.replace(/^(?:und|aber|dann)\s+/iu, '').replace(/,$/, '');
      const s = `${plainPart.charAt(0).toLocaleUpperCase('de')}${plainPart.slice(1)}`;
      const r = coreTries(turn, END.test(s) ? s : `${s}.`);
      const result = Array.isArray(r) ? r[0] : r;
      if (verifiedResult(result)) { answers += 1; worstOf = worst(worstOf, result); return true; }
      // The turn's own answer with a filling it does not take is no remark beside one („Ja, ich möchte Tee.“ where water is offered).
      const near = nearestFrame(turn, s);
      if (near && near.cost === 0 && near.fixed >= 2) return false;
      return Boolean(turn.lexicon?.sentences?.has(sentenceKey(p))) || clauseVerified(turn.lexicon, END.test(s) ? s : `${s}.`);
    });
    if (ok && answers && pronounFits(parts, turn.lexicon)) return [worstOf, 'sentences'];
  }
  return null;
}

/**
 * What is left after a verified beginning (Rule 1): nothing, a counter-question („Und Sie?“), or a clause of its own —
 * after „und“ its subject may be the one before („… und komme aus Syrien“). CORRECT when an answer the course's checks
 * accept verifies it, WRONG with a fault the check can name or when it is no clause, BEYOND otherwise.
 */
function restResult(lexicon, rest, subject = 'ich', repeats = '') {
  let s = String(rest || '').trim().replace(/^[,;:–-]+\s*/, '');
  if (!/[\p{L}\p{N}]/u.test(s)) return RESULT.CORRECT;
  s = s.replace(/^[.!?]+\s*/, '');
  // Section D: a counter-question or a clause after the answer is no answer of the turn word for word: BEYOND at best.
  if (/^und\s+(?:ihnen|sie|du|dir|bei\s+(?:ihnen|dir))(?:\s+auch)?\s*[?.!]*$/iu.test(s)) return BEYOND;
  let clause = s.replace(/^(?:und|aber|oder)\s+/i, '');
  const first = wordsOf(clause)[0] || '';
  if (/^\p{Ll}/u.test(first) && personsOf(first, lexicon) && !PERSON_OF[fold(first)]) clause = `${subject} ${clause}`;
  clause = clause.charAt(0).toLocaleUpperCase('de') + clause.slice(1);
  if (!END.test(clause)) clause += '.';
  // The answer's own frame again says nothing more („Ich heiße Omar und ich heiße Omar“): a word repeated, WRONG.
  const again = tokensOf(repeats);
  if (again.length >= 2 && again.every((w, i) => tokensOf(clause)[i] === w)) return RESULT.WRONG;
  // Only a frame with a gap and two fixed words or more verifies a clause: „Ich …“ (an activity) takes nearly anything,
  // and a fixed reply („Ich komme.“, „Ja, gern.“) answers another question, not this one. A frame is tried only when its
  // fixed words are all in the clause, and each clause is graded once per course (`restMemo`).
  const memo = lexicon ? (lexicon.restMemo ||= new Map()) : null;
  if (memo?.has(clause)) return memo.get(clause);
  const done = (r) => { memo?.set(clause, r); return r; };
  if (clauseVerified(lexicon, clause)) return done(BEYOND);
  if (formFault(clause, lexicon) || notGerman(clause, lexicon)) return done(RESULT.WRONG);
  // A clause has a subject and a verb, and „sein“ something after it: „und du bist“ leaves a word out.
  const raw = commaFree(sentencesOf(clause).flat());
  const verbs = raw.map((w, i) => verbAt(raw, i, lexicon));
  if (!verbs.some((v) => v && !v.every((p) => p === 'inf'))) return done(RESULT.WRONG);
  if (raw.length <= 2 && raw.some((w) => SEIN_FORMS[plainOf(w)] || HABEN_FORMS[plainOf(w)])) return done(RESULT.WRONG);
  return done(BEYOND);
}

// ——— Rule 4 (the courses session's review of 2492a424): an answer is a sequence ———
// The words are read in the order they were typed and each once: a word twice in a row and a word where German never
// puts it are faults the check names, whatever a lenient path made of the rest. Reorderings that are German are
// accepted because an accepted answer or a rule of German word order says so („Am Freitag habe ich Zeit“, „Was ist
// das denn?“, „Du tanzt gern?“), never because the order is not looked at.
const NON_PARTICLE_PREP = new Set(['am', 'um', 'im', 'ins', 'zum', 'zur', 'beim', 'vom', 'in', 'bei', 'für', 'ohne', 'gegen', 'bis', 'von', 'seit']);
const SMALL_AFTER_SUBJECT = new Set(['denn', 'vielleicht', 'auch', 'noch', 'doch', 'mal', 'gern', 'gerne', 'bitte', 'hier', 'jetzt', 'heute', 'schon']);
const EMBEDDING = new Set(['dass', 'ob', 'weil', 'wenn']);
export function sequenceFault(turn, value) {
  const lexicon = turn.lexicon;
  const text = spelledOut(westernDigits(value), lexicon);
  // A word twice with nothing between („gut gut“, „Und Und Sie?“) — never an own name („Omar Omar“), never a number.
  // With a comma or a sentence end between them it is German („Ja, ja, gern.“, „Sehr, sehr gut.“, „Und du? Du tanzt
  // gern?“): graded as any other answer (the courses session's review of 46c7ca80).
  const words = wordsOf(String(text).replace(/[„“"()]/g, ' ')).map((w) => ({ raw: w.replace(/[.,!?;:]+$/, ''), f: plainOf(w), stop: /[.,!?;:]$/.test(w) })).filter((x) => x.f);
  const ownNames = turn.ownName || turn.parts || turn.slot === 'name' || (turn.accepted || []).some((a) => typeof a === 'object' && a.slot === 'name');
  const doubledInAnswer = (f) => (turn.accepted || []).some((a) => new RegExp(`(?:^|\\s)${f}[\\s,]+${f}(?:[\\s.,!?]|$)`, 'iu').test(fold(frameOf(a))));
  for (let i = 1; i < words.length; i += 1) {
    const { raw, f } = words[i];
    if (f !== words[i - 1].f || words[i - 1].stop || /\d/.test(f) || isNumberWord(f)) continue;
    if (ownNames && /^\p{Lu}/u.test(raw) && !(lexicon?.has?.(f) || lexicon?.said?.has?.(f) || CLOSED.has(f))) continue;
    if (doubledInAnswer(f)) continue;
    return 'extra';
  }
  for (const sentence of sentencesOf(text)) {
    const f = sentence.map(plainOf);
    // A verb: a form the course says with a person, or a word it says written small with a verb's ending („passt“).
    const ADJ_T = new Set(['gut', 'alt', 'kalt', 'weit', 'laut', 'schlecht', 'nett', 'bunt', 'satt', 'jetzt', 'nicht', 'erst', 'selbst', 'zuerst', 'meist', 'oft', 'vielleicht', 'leicht', 'recht', 'echt']);
    const verb = (i) => verbAt(sentence, i, lexicon) || ((i === 0 || /^\p{Ll}/u.test(sentence[i] || '')) && /\p{L}(?:t|st)$/u.test(sentence[i] || '') && lexicon?.said?.has?.(f[i])
      && !ADJ_T.has(f[i]) && !CLOSED.has(f[i]) && !isNumberWord(f[i]) && !colourStem(f[i]) && !lexicon?.genders?.has?.(f[i]) && !lexicon?.names?.has?.(f[i]) ? ['3s'] : null);
    for (let i = 0; i < f.length; i += 1) {
      const w = f[i];
      const next = i + 1 < f.length ? f[i + 1] : null; // '' is a comma
      // A preposition needs its object: never last, never before a comma, a verb or another preposition („Dienstag Am
      // habe ich …“, „Freitag am um zehn“); „bis um“, „bis zum“ and „Um wie viel Uhr“ are German.
      if (NON_PARTICLE_PREP.has(w) && w !== '' && (next === null || next === '' || (NON_PARTICLE_PREP.has(next) && !(w === 'bis' && ['um', 'zum', 'zur', 'am'].includes(next)))
        || (verb(i + 1) && !QUESTION_WORDS.has(next) && !OWN_ALL.has(next)) || (SEP_PREFIX.includes(next) && i + 2 === f.length))) return 'order'; // …nor before the verb's last part („sechs um auf“); „in essen“ is the city
      // „Uhr“ after its number, never after a preposition or a day („um Uhr“, „Dienstag Uhr“).
      if (w === 'uhr' && i > 0 && (NON_PARTICLE_PREP.has(f[i - 1]) || f[i - 1] === 'ab' || DAYS.includes(f[i - 1]))) return 'order';
      // „am“ before a day or a part of the day as a noun, never before „abends“.
      if (['am', 'an'].includes(w) && next && /s$/.test(next) && DAY_PARTS.includes(next.replace(/s$/, ''))) return 'order';
      // „und“, „oder“ join two of a kind: never last, never between a verb and a noun („Sie spricht und Arabisch“).
      // („…, oder?“ after a comma asks a tag question.)
      if (['und', 'oder'].includes(w) && i > 0 && ((next === null && !(w === 'oder' && f[i - 1] === '')) || (verb(i - 1) && /^\p{Lu}/u.test(sentence[i + 1] || '') && (lexicon?.genders?.has?.(next) || OWN_ALL.has(next))))) return 'order';
      // A small word that follows a pronoun subject does not stand between the verb and that pronoun („Haben auch Sie
      // Tee?“, „Was machst gern du?“, „Was ist hier das?“) nor between the question word and the verb („Was denn ist das?“).
      if (SMALL_AFTER_SUBJECT.has(w) && i > 0) {
        // („Was ist denn das?“: a particle may stand before the pointing „das“; „hier“, „auch“, „gern“ may not.)
        if (verb(i - 1) && next && (PERSON_OF[next] || (next === 'das' && i + 2 >= f.length && ['hier', 'auch', 'gern', 'gerne', 'jetzt'].includes(w)))) return 'order';
        if (i === 1 && QUESTION_WORDS.has(f[0]) && !['gern', 'gerne'].includes(w) && verb(i + 1)) return 'order'; // „Wie gern tanzt du?“ asks
        // …nor between an article or a preposition and its noun („Fährt der auch Zug …?“, „nach hier Berlin“).
        // („Ist das hier Kaffee?“ points with „das“; „bis heute Abend“ is a time.)
        const nextRaw = sentence[i + 1] || '';
        const time = ['heute', 'morgen', 'jetzt'].includes(w) && (DAY_PARTS.includes(next || '') || next === 'abend');
        if (!time && ((DET_WORD.test(f[i - 1]) && f[i - 1] !== 'das') || BARE_PREP.has(f[i - 1]) || NON_PARTICLE_PREP.has(f[i - 1])) && /^\p{Lu}/u.test(nextRaw)) return 'order';
        // „auch“ closes a question only after its pronoun or its verb („Kommst du auch?“, never „Haben Sie Tee auch?“).
        // („Haben Sie den auch?“: after a pronoun it closes; after a noun or „gern“ it does not.)
        if (w === 'auch' && next === null && /\?\s*$/.test(String(text).trim()) && (/^\p{Lu}/u.test(sentence[i - 1] || '') || ['gern', 'gerne'].includes(f[i - 1]))) return 'order';
      }
      // An article and its noun, not cut by „bitte“ („Ich möchte einen bitte, Kaffee.“).
      if (/^(?:k?ein|mein|dein|sein|unser|eur)(?:e|en|em|er|es)?$/.test(w) && ['bitte', 'danke'].includes(next) && /^\p{Lu}/u.test(sentence.slice(i + 2).find((x) => x !== ',') || '')) return 'order';
    }
    // After a phrase in front („Am Wochenende“, „Heute“, „Dann“) the verb comes before its pronoun: „Am Wochenende spiele
    // ich …“, never „Am Wochenende ich spiele …“.
    const FRONT = (x) => NON_PARTICLE_PREP.has(x) || BARE_PREP.has(x) || DAYS.includes(x) || TIME_WORDS.has(x) || ['morgens', 'abends', 'nachmittags', 'vormittags', 'dann', 'hier', 'dort', 'oft', 'immer', 'gestern'].includes(x);
    const firstVerb = f.findIndex((x, i) => i > 0 && verb(i));
    if (firstVerb >= 2 && FRONT(f[0]) && PERSON_OF[f[firstVerb - 1]] && f[firstVerb - 2] !== '' && !f.slice(0, firstVerb - 1).some((x) => PERSON_OF[x] || x === '')) return 'order';
    // After a main clause and a comma, a clause opened by a question word or „dass“, „ob“ … ends with its verb
    // („Kannst du mir sagen, wie spät es ist?“, never „…, wie spät ist es?“).
    const segments = [[]];
    for (const x of sentence) if (x === ',') segments.push([]); else segments.at(-1).push(x);
    for (let k = 1; k < segments.length; k += 1) {
      const seg = segments[k];
      const first = plainOf(seg[0] || '');
      const before = segments.slice(0, k).flat();
      // A main clause before the comma: a verb with its pronoun („Weißt du, …“, „Ich weiß nicht, …“); „Danke, wie geht
      // es Ihnen?“ asks directly.
      const mainClause = before.some((x, j) => verbAt(before, j, lexicon) && (PERSON_OF[plainOf(before[j + 1] || '')] || PERSON_OF[plainOf(before[j - 1] || '')]));
      if (!(QUESTION_WORDS.has(first) || EMBEDDING.has(first)) || !mainClause) continue;
      const at = seg.findIndex((x, j) => j > 0 && (verbAt(seg, j, lexicon) || ['inf']).some((p) => p !== 'inf'));
      if (at > 0 && at < seg.length - 1) return 'order';
    }
  }
  return null;
}
const sequenceReason = sequenceFault;

/**
 * A taught noun with an infinitive's ending is no German word („Mein Hobby ist Fußballen.“, „Musiken“): an answer with
 * one is never praised as the learner's own word. A dative plural („mit Freunden“) has its plural in -e among the taught
 * forms, and any other word German has is known as itself.
 */
function madeUpWord(turn, value) {
  const lexicon = turn?.lexicon;
  if (!lexicon?.genders?.has) return false;
  return wordsOf(String(value || '').replace(/[.,!?;:„“"()]/g, ' ')).some((w) => {
    const f = fold(w);
    return f.length > 6 && f.endsWith('en') && lexicon.genders.has(f.slice(0, -2)) && !lexicon.has(f.slice(0, -1)) && !knownWord(f, lexicon) && !OWN_NOUNS.has(f);
  });
}

/**
 * „einen Computers“, „eine Lampes“, „mein Ladekabeln“: a noun a list knows, with an ending it has not behind a singular article, is a
 * form of that noun and never a word of the learner's own (independent score of c6918f2d, MAJOR). Weak nouns keep their -n
 * („einen Studenten“, „meinen Kollegen“), a dative plural its own („mit meinen Kindern“).
 */
const SINGULAR = /^(?:ein|eine|einen|einem|einer|mein|meinen|meinem|dein|deinen|deinem|kein|keinen|keinem|ihr|sein|unser|das|dem)$/u;
const WEAK_NOUN = /(?:e|ent|ant|ist|at|ot|log|graf|nachbar|herr|mensch|bär|held)$/u;
function malformedNoun(text, lexicon) {
  if (!lexicon?.genders?.has) return false;
  const words = wordsOf(String(text || '').replace(/[.,!?;:„“"()]/g, ' '));
  const noun = (f) => lexicon.genders.has(f) || OWN_NOUNS.has(f) || (f.length >= 8 && Boolean(readingsOfOwn(f)));
  return words.some((w, i) => {
    const f = fold(w);
    // „deines Buch“, „meines Vater“: a genitive masculine or neuter noun has its -s (fresh corpora of round 4).
    if (i > 0 && /^(?:des|eines|meines|deines|seines|ihres|unseres|keines)$/u.test(fold(words[i - 1])) && /^\p{Lu}/u.test(w) && (lexicon.genders.get(f) || []).some((g) => g === 'der' || g === 'das') && !/(?:s|ns|es)$/u.test(f)) return true;
    // „um eins Uhr“: before „Uhr“ it is „ein“.
    if (f === 'uhr' && i > 0 && fold(words[i - 1]) === 'eins') return true;
    // „ein Glas Wassers“
    if (i > 0 && f.length > 5 && f.endsWith('s') && MASS.has(f.slice(0, -1)) && !['des', 'eines', 'meines'].includes(fold(words[i - 1]))) return true;
    if (i === 0 || !/^\p{Lu}/u.test(w) || noun(f) || knownWord(w, lexicon) || lexicon.names?.has?.(f)) return false;
    const k = SINGULAR.test(fold(words[i - 1])) ? i - 1 : i > 1 && SINGULAR.test(fold(words[i - 2])) && adjectiveForm(fold(words[i - 1])).some((x) => x.ending) ? i - 2 : -1;
    if (k < 0) return false;
    if (k > 0 && /en$/u.test(fold(words[k])) && DATIVE.has(fold(words[k - 1]))) return false;
    return ['s', 'es', 'n', 'en'].some((e) => {
      const stem = f.slice(0, -e.length);
      return f.endsWith(e) && stem.length >= 4 && noun(stem) && !(e.endsWith('n') && WEAK_NOUN.test(stem));
    });
  });
}
const DATIVE = new Set(['mit', 'von', 'bei', 'zu', 'aus', 'nach', 'seit', 'in', 'an', 'auf', 'vor', 'neben', 'hinter', 'unter', 'zwischen']);
/**
 * „zwei Rucksacks“, „meine Freunds“, „drei Stifts“, „zwei Computern“, „Zwei Freund kommen“: a taught noun in a plural the course does not
 * teach is no word of the learner's own (Claude score of fd8f8dba, MAJOR). Its plural is the Wortfeld's; a dative plural keeps its -n
 * („mit meinen Kindern“), a genitive its -s („meines Hefts“). Only nouns whose plural the course teaches are checked.
 */
const PLURAL_WORD = /^(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|viele|mehrere|einige)$/u;
const CLOCK_BEFORE = /^(?:um|halb|viertel|nach|vor|bis|ab|gegen|am|seit|von|zwischen|und)$/u;
const COUNTED_BARE = new Set(['euro', 'cent', 'uhr', 'zeit', 'mal', 'kilo', 'gramm', 'liter', 'prozent', 'stück', 'glas', 'tasse', 'flasche', 'kaffee', 'tee', 'bier', 'wasser', 'cola', 'saft', 'wein', 'meter']);
const umlautsOff = (w) => w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
function wrongPlural(text, lexicon) {
  if (!lexicon?.plurals?.size) return false;
  const words = wordsOf(String(text || '').replace(/[.,!?;:„“"()]/g, ' '));
  const dativeBefore = (i) => words.slice(Math.max(0, i - 3), i).some((w) => DATIVE.has(fold(w)) || /^(?:den|meinen|deinen|seinen|ihren|unseren|keinen|zwei|drei|vier)$/u.test(fold(w)) && i > 1 && DATIVE.has(fold(words[i - 2] || '')));
  const genitiveBefore = (i) => /^(?:des|eines|meines|deines|seines|ihres|unseres|keines|dieses|jenes|jedes)$/u.test(fold(words[i - 1] || ''));
  return words.some((w, i) => {
    if (!/^\p{Lu}/u.test(w) || lexicon.names?.has?.(fold(w))) return false;
    const f = fold(w);
    // („Zwei Freund kommen.“: after a number of two or more the plural.)
    if (i > 0 && PLURAL_WORD.test(fold(words[i - 1])) && !CLOCK_BEFORE.test(fold(words[i - 2] || '')) && lexicon.plurals.has(f) && lexicon.plurals.get(f) !== f && !COUNTED_BARE.has(f) && !lexicon.genders.get(f)?.includes('pl')) return true;
    // („Kochen“, „Lesen“: a verb as a noun; „Sonntags“, „Abends“: when.)
    if (verbReadings(f).some((v) => v.mood === 'inf') || GERMAN_ADVERBS.has(f) || /^(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|abend|mittag|nachmittag|vormittag)s$/u.test(f)) return false;
    if (lexicon.genders.has(f) || OWN_NOUNS.has(f) || OWN_ALL.has(f)) {
      // A taught plural with an -n it has only in the dative („zwei Stühlen“, „zwei Computern“).
      const base = f.replace(/n$/u, '');
      return f !== base && lexicon.pluralForms.has(base) && !lexicon.genders.has(f) && !dativeBefore(i);
    }
    for (const [end, add] of [['ies', 'y'], ['es', ''], ['s', ''], ['en', ''], ['n', ''], ['e', ''], ['s', 'e']]) {
      if (!f.endsWith(end) || f.length - end.length < 3) continue;
      const base = f.slice(0, -end.length) + add;
      for (const stem of new Set([base, umlautsOff(base)])) {
        if (lexicon.pluralForms.has(stem) && stem !== f && end !== 'n') return true;
        const plural = lexicon.plurals.get(stem);
        if (!plural || plural === f) continue;
        if ((f === `${plural}n` || f === `${plural}en`) && dativeBefore(i)) return false;
        if ((end === 's' || end === 'es') && add === '' && genitiveBefore(i)) return false;
        return true;
      }
    }
    // „Computern“, „Stühlen“ without a dative before them.
    const base = f.replace(/n$/u, '');
    return f !== base && lexicon.pluralForms.has(base) && !dativeBefore(i);
  });
}
/**
 * „Ich blable gern.“, „Ich hupse gern Fußball.“: a word written small where the verb stands that is no verb the reader knows is not
 * praised as the learner's own word (HANDOVER-loop-3, round 4, item 3): the answer is not checked.
 */
function unknownVerb(turn, value) {
  const lexicon = turn?.lexicon;
  if (!lexicon || turn.ownName || turn.parts) return false;
  const words = wordsOf(spelledOut(westernDigits(String(value || '')), lexicon).replace(/[.,!?;:„“"()]/g, ' '));
  return words.some((w, i) => {
    const f = fold(w);
    if (!/^\p{Ll}/u.test(w) || f.length < 3 || i === 0) return false;
    if (knownWord(w, lexicon) || lexicon.has(f) || verbReadings(f).length || adjectiveForm(f).length || GERMAN_ADVERBS.has(f) || CLOSED.has(f) || determinerOf(f) || isNumberWord(f) || OWN_ALL.has(f) || OWN_NOUNS.has(f) || lexicon.names?.has?.(f)) return false;
    // In the verb's place: behind the subject of the clause, or first in a question.
    return /^(?:ich|du|er|sie|wir|es|ihr)$/u.test(fold(words[i - 1] || '')) || (i === 1 && /^(?:gern|gerne|am|heute|morgens|abends)$/u.test(fold(words[0])));
  });
}
/** „Sie spricht gut Arabische.“: a language keeps its form; „arabische Musik“ is no language. */
const languageForm = (turn, text) => asked(turn)?.kind === 'language' && wordsOf(text).some((w, i, all) => { const stem = fold(w).replace(/[.,!?]+$/u, '').replace(/(?:en|e)$/u, ''); return /^\p{Lu}/u.test(w) && stem !== fold(w).replace(/[.,!?]+$/u, '') && OWN_KIND.language.has(stem) && !/^\p{Lu}/u.test(all[i + 1] || ''); });

/** The first of two sentences holds no fault the check can name („Ich suche mein Stift. Wo ist er?“ does). */
// Only the two shapes a learner uses to name the thing first: „Und die Fahrkarte?“ and a sentence of subject, verb and the thing
// („Ich mag den Tisch.“, „Die Lampe ist toll!“); never a word bag („der Und Stuhl?“, final-check.test Rule 4).
const LEAD_SHAPE = /^(?:(?:Und\s+)?(?:der|die|das|den|ein|eine|einen|mein|meine|meinen)\s+\p{Lu}\p{L}+\?|(?:Ich|Wir)\s+\p{Ll}+\s+(?:den|die|das|einen|eine|ein|meinen|meine|mein)\s+\p{Lu}\p{L}+[.!]|(?:Der|Die|Das|Mein|Meine)\s+\p{Lu}\p{L}+\s+(?:ist|sind)\s+\p{Ll}+[.!])$/u;
// („Ich sucht meinen Stift. Wo ist er?“: the verb of the first sentence agrees with its „ich“ or „wir“; mutation probe of round 4.)
const leadAgrees = (first) => { const m = String(first).match(/^(Ich|Wir)\s+(\p{Ll}+)/u); return !m || verbReadings(fold(m[2])).some((r) => r.mood === 'fin' && r.persons.includes(fold(m[1]))); };
const cleanLead = (text, lexicon) => { const [first, second] = String(text).trim().split(/(?<=[.!?])\s+/); return Boolean(second) && LEAD_SHAPE.test(first) && leadAgrees(first) && !articleFaultIn(lexicon, first) && !formFault(first, lexicon); };
/** „Es kommt meine Freunde.“: after „es“ the verb agrees with the subject that follows. */
function expletiveAgreement(text, lexicon) {
  const m = String(text).trim().match(/^Es\s+(kommt|kommen)\s+(?:\p{Ll}+\s+)?(?:der|die|das|mein|meine|dein|deine|sein|seine|ihr|ihre|unser|unsere|ein|eine|viele|zwei|drei|vier)\s+(\p{Lu}\p{L}+)/u);
  if (!m || /\sund\s/.test(text)) return null;
  const r = readingsIn(lexicon, m[2]);
  if (!r) return null;
  return (m[1] === 'kommt' && r.every((g) => g === 'pl')) || (m[1] === 'kommen' && !r.includes('pl')) ? 'agreement' : null;
}
/** „nach der Schweiz“, „der Deutsch“ for a language, „am Nacht“ (Claude score, 2026-11-25): wrong wherever they stand. */
const GOES_IN = /(?<!\p{L})geh(?:e|st|t|en)\s+(?:ich\s+|wir\s+)?(?:(?:gern|gerne|oft|am\s+\p{L}+|manchmal|immer|auch|jeden\s+\p{L}+|jede\s+\p{L}+)\s+)*(?:im|in\s+dem|in\s+der)\s+(?:Kino|Theater|Museum|Schule|Café|Restaurant|Supermarkt|Schwimmbad|Fitnessstudio|Bett|Stadion|Club|Konzert|Bibliothek|Büro)\s*[.!?]*$/iu;
function placeFault(text) {
  if (GOES_IN.test(text)) return 'word';
  const w = wordsOf(String(text).replace(/[.,!?;:„“"()]/g, ' ')).map(fold);
  return w.some((x, i) => x === 'nach' && /^(?:der|die|den|dem)$/.test(w[i + 1] || '') && (COUNTRY_ARTICLE[w[i + 2]] || COUNTRY_MAY_HAVE[w[i + 2]])) ? 'word'
    : w.some((x, i) => /^(?:der|den|dem)$/.test(x) && OWN_KIND.language.has(w[i + 1] || '') && !['auf', 'in', 'im'].includes(w[i - 1] || '')) ? 'article'
      : w.some((x, i) => x === 'am' && w[i + 1] === 'nacht') ? 'article' : null;
}
// What a turn asks, read off its own answers: which longer ways to say one are the same answer there.
const REWRITES = new WeakMap();
function rewritesFor(turn) {
  if (!REWRITES.has(turn)) {
    const frames = (turn.accepted || []).map(frameOf);
    REWRITES.set(turn, {
      time: Boolean(turn.when || turn.time || turn.partOfDay || turn.day || ['when', 'clock', 'month', 'adjunct', 'past', 'invite'].includes(turn.slot)),
      party: frames.some((f) => /kommen|kommt/.test(f)) && turn.slot === 'object',
      have: frames.some((f) => /^Haben Sie /.test(f)),
      well: frames.some((f) => /^Mir geht es gut/.test(f)),
      day: frames.some((f) => /^Hast du .* Zeit\?$/.test(f)),
      cost: frames.some((f) => /^Was kostet|^Wie viel kostet/.test(f)),
      ticket: frames.some((f) => /Fahrkarte/.test(f)),
    });
  }
  return REWRITES.get(turn);
}

// The last look at a verified answer (both corpora of 2026-11-25): what the gap rules let through as the learner's own word.
/** A word with a letter German does not write („Égypte“, „piñata“) that the course does not know: not German, as far as the check can tell. */
function foreignWord(turn, value) {
  if (!turn || turn.ownName || turn.parts || turn.slot === 'name' || turn.spell || turn.listen) return false;
  return wordsOf(String(value || '').normalize('NFC').replace(/[.,!?;:„“"()]/g, ' ')).some((w) => /[^\p{ASCII}äöüÄÖÜßẞ–’‘]/u.test(w) && /\p{Script=Latin}/u.test(w) && !turn.lexicon?.has?.(fold(w)) && !turn.lexicon?.names?.has?.(fold(w)) && !OWN_ALL.has(fold(w)));
}
/**
 * A slip that is another word: „Haben Sie eine Puppe?“ and „Ich habe Dunst.“ are one letter from the answer and say something
 * else; „einen stylo“ is a noun written small that no list knows.
 */
const ascii = (w) => asciiUmlauts(fold(w));
const OTHER_NOUNS = new Set([...[...OWN_NOUNS.keys()].map(ascii), ...'dunst fleiss see stadt staat hose dose hase nase rose reis kreis preis eis gras tal zahl wahl saal schal gift lohn sohn mond mund hund grund band wand sand land rand bein stein wein schwein bett brett fett haut haus maus laus mauer dauer bauer kissen wissen messer wasser kasse klasse gasse masse tasse rasse laden faden schaden boden hoden ofen hafen wagen magen regen segen'.split(' ')]);
function otherWordTyped(turn, value, result) {
  if (!turn || turn.ownName || turn.parts || turn.spell || turn.listen) return false;
  const text = spelledOut(westernDigits(value), turn.lexicon);
  if (result === RESULT.TYPO) {
    const near = nearestFrame(turn, text);
    if (near?.cost === 1 && near.ops[0].op === 'sub' && OTHER_NOUNS.has(near.ops[0].a)
      && wordsOf(text).some((w) => /^\p{Lu}/u.test(w) && ascii(w.replace(/[.,!?;:]+$/, '')) === near.ops[0].a)) return true;
  }
  const unknown = new Set(uncheckedWords(turn, value));
  // („den Reis mit Fleiß“: a noun German has, and nothing one eats.)
  if (turn.thingKind && [...unknown].some((x) => OTHER_NOUNS.has(ascii(x)))) return true;
  const w = wordsOf(text.replace(/[„“"()]/g, ' '));
  return w.some((x, i) => i > 0 && unknown.has(x.replace(/[.,!?;:]+$/, '')) && /^\p{Ll}/u.test(x) && DET_WORD.test(plainOf(w[i - 1])) && !/[.,!?;:]$/.test(w[i - 1]) && (/[.,!?;:]$/.test(x) || !w[i + 1] || !/^\p{Lu}/u.test(w[i + 1])) && !/(?:e|en|er|es|em)$/.test(plainOf(x)));
}

// ——— The second reader (loop round 3, 2026-11-25): an answer no frame verifies and no rule faults is read as a sentence ———
const WHAT_ONE_NAMES = new Set(['besuchen', 'treffen', 'sehen', 'kennen', 'anrufen', 'lieben', 'fragen', 'einladen', 'kennenlernen', 'nennen', 'abholen', 'vermissen', 'heißen']);
const massWord = (w) => { const x = fold(w); for (let i = 0; i <= x.length - 3; i += (i ? 1 : 3)) if (OWN_MASS.has(x.slice(i)) || MASS.has(x.slice(i))) return true; return false; };
const contexts = new WeakMap();
function readingContext(lexicon) {
  if (!contexts.has(lexicon)) {
    contexts.set(lexicon, {
      readings: (n) => readingsIn(lexicon, n),
      isName: (w) => Boolean(lexicon?.names?.has?.(fold(w))),
      isPlace: (w) => OWN_KIND.place.has(fold(w)) || OWN_KIND.place.has(fold(w).replace(/-/g, ' ')),
      isLanguage: (w) => OWN_KIND.language.has(fold(w)),
      isJob: (w) => OWN_KIND.job.has(fold(w)),
      placeArticle: (w) => (COUNTRY_ARTICLE[fold(w)] ? 'always' : COUNTRY_MAY_HAVE[fold(w)] ? 'may' : null),
      isMass: massWord,
      isFood: (w) => ['food', 'drink'].includes(taughtKind(w) || ownKind(fold(w))),
    });
  }
  return contexts.get(lexicon);
}
/** The answer as read: its sentences, or null where a word or its place cannot be read. */
function readAnswer(turn, text) {
  if (!turn.lexicon) return null;
  // („aus der Stadt Aleppo“ names the place with its kind.)
  return reader(text.replace(/(?<!\p{L})(aus|in)\s+der\s+(?:Stadt|Hauptstadt)\s+(?=\p{Lu})/gu, '$1 '), { ...readingContext(turn.lexicon), partner: turn.partner }).read();
}
// A capital word no list knows is a name or a place where one stands („mein Bruder Andrij“, „nach Nordenham“), never what one buys.
function ownWordFits(sentences, names) {
  return sentences.every((s) => s.clauses.every((c) => {
    if (c.around) return true;
    if (c.frag) return names || c.elems.every((e) => e.kind !== 'own');
    const own = (n) => n && (n.kind === 'own' || (n.items || []).some((x) => x.kind === 'own'));
    if (own(c.acc) && !WHAT_ONE_NAMES.has(c.lemma)) return false;
    if (own(c.dat)) return false;
    if (own(c.pred) && c.subj?.head === 'ich' && c.lemma === 'sein' && !names && !/(?:er|erin|ese|esin)$/u.test(c.pred.head)) return false;
    if (own(c.pred) && !(['heißen'].includes(c.lemma) || ['ich', 'name', 'vorname', 'nachname', 'familienname', 'wohnort', 'ziel', 'heimat', 'hier'].includes(c.subj?.head) || (['er', 'sie', 'ich', 'wir'].includes(c.subj?.head) && /(?:er|erin|ese|esin|in|e)$/u.test(c.pred.head)) || (c.lemma === 'sein' && c.subj?.kind === 'np'))) return false;
    return true;
  }));
}
const reading = { turn: null, value: null, out: null };
/** { say: 'yes' | a fault | null, unknown: [words no list knows] } */
export function secondReading(turn, value) {
  if (reading.turn === turn && reading.value === value) return reading.out;
  // A sentence the reader trips over is one it cannot judge: the screen never breaks on an answer (tests call `readOnce` bare).
  let out;
  try { out = readOnce(turn, value); } catch { out = { say: null, unknown: [] }; }
  Object.assign(reading, { turn, value, out });
  return out;
}
const OWN_NOUN_KINDS = new Set(['thing', 'need', 'buy', 'wish', 'hobby', 'did', 'routine', 'photo', 'guests', 'travel', 'origin', 'live', 'job', 'message', 'name', 'accept', 'decline']);
// „Herr“ without the name, „bisschen“ without „ein“.
const CUT_OFF = [/(?<!\p{L})Herrn?(?!\p{L}|\s+\p{Lu})/u, /(?<!\p{L})(?<!(?:ein|kein|das)\s)bisschen(?!\p{L})|(?<!\p{L})guten\s+(?:herr|frau)/iu];
/** „Weber, was sind Sie …?“: someone one calls „Sie“ keeps the „Herr“. */
const surnameAlone = (turn, text) => {
  const name = String(turn.partner || '').match(/^(?:Herr|Frau)\s+(\p{L}+)$/u)?.[1];
  const said = wordsOf(text.replace(/[.,!?;:]/g, ' '));
  return Boolean(name) && said.some((w, k) => fold(w) === fold(name) && !['herr', 'herrn', 'frau'].includes(fold(said[k - 1] || '')));
};
/** „Bad Homburg“, „Frankfurt (Oder)“, „Neustadt an der Weinstraße“: a town's name of several words is one name. */
export const townNames = (text) => String(text)
  .replace(/(?<!\p{L})(?:Bad|Sankt|St\.)\s+(\p{Lu}\p{L}+)/gu, '$1')
  .replace(/(?<=\p{Lu}\p{L}+)\s*\((?:Oder|Main|Saale|Elbe|Rhein|Westfalen|Holstein|Weinstraße)\)/gu, '')
  .replace(/(?<=\p{Lu}\p{L}+)\s+(?:am|an\s+der)\s+(?:Main|Oder|Rhein|Weinstraße|Saale|Elbe|Ruhr)(?!\p{L})/gu, '');
export const readSentences = (turn, value) => readAnswer(turn, spelledOut(westernDigits(value), turn.lexicon).trim());
/** Is the answer read as German in order, and does the reader know each of its words? */
export function readable(turn, value) {
  const text = spelledOut(westernDigits(value), turn.lexicon).trim();
  // (Without its comma „Ja Ich habe Hunger.“ is the same sentence.)
  const read = (x) => { const sentences = readAnswer(turn, x); return Boolean(sentences) && inOrder(sentences, (h) => ['food', 'drink'].includes(taughtKind(h) || ownKind(h))); };
  return { read: text.length <= 160 && (read(text) || read(text.replace(/^(ja|nein|danke|gut|gern|gerne|hallo)\s+(?=\S)/iu, '$1, ').replace(/(?<=[\s,])Ich(?=\s)/gu, 'ich'))), known: text.length <= 160 && smallWordsKnown(text, (w) => knownWord(w, turn.lexicon)) && !unknownNouns(turn, text) };
}
const unknownNouns = (turn, text) => wordsOf(text.replace(/[.,!?;:„“"()]/g, ' ')).some((w, i) => i > 0 && /^\p{Lu}/u.test(w) && !readingsIn(turn.lexicon, w) && !knownWord(w, turn.lexicon) && !verbReadings(fold(w)).length);
export function readOnce(turn, value) {
  const none = { say: null, unknown: [] };
  if (!turn.lexicon || turn.spell || turn.listen) return none;
  const text = spelledOut(westernDigits(value), turn.lexicon).trim();
  if (text.length > 160 || !/\p{L}/u.test(text) || /(?<!\p{L})(\p{L}{2,})\s+\1(?!\p{L})/iu.test(text) || CUT_OFF.some((re) => re.test(text)) || surnameAlone(turn, text)) return none;
  if (malformedNoun(text, turn.lexicon) || languageForm(turn, text) || wrongPlural(text, turn.lexicon)) return { ...none, say: 'ending' };
  if ((turn.ownName || asked(turn)?.kind === 'name') && partnerNamed(turn, text)) return { ...none, say: 'task' };
  const sentences = readAnswer(turn, text);
  if (!sentences) return none;
  if (!ownWordFits(sentences, Boolean(turn.ownName || turn.parts || turn.slot === 'name'))) return { ...none, sentences };
  if (!inOrder(sentences, (h) => ['food', 'drink'].includes(taughtKind(h) || ownKind(h)))) return { ...none, say: certainlyNot(sentences), sentences };
  const lexicon = turn.lexicon;
  const clauses = sentences.flatMap((x) => x.clauses);
  const nouns = (c) => [c.subj, c.acc, c.pred, c.dat, ...(c.elems || []).flatMap((e) => (e.np ? [e.np] : e.combos ? [e] : []))].filter(Boolean);
  const unknown = [...new Set(clauses.flatMap((c) => nouns(c).flatMap((n) => (n.kind === 'own' || n.named ? [] : n.unknown || []))))];
  const env = {
    register: registerOf(turn),
    gendersOf: (things) => [...new Set(things.flatMap((t) => readingsIn(lexicon, t.charAt(0).toLocaleUpperCase('de') + t.slice(1)) || []))],
    kindOf: (h) => { const k = taughtKind(h) || ownKind(h); return k === 'drink' || k === 'food' ? k : k || (lexicon.genders?.has?.(h) ? 'thing' : null); },
    known: (h) => Boolean(readingsIn(lexicon, h)),
    cast: (h) => Boolean(lexicon.names?.has?.(h)) && !OWN_KIND.place.has(h),
    jobLike: (h) => OWN_KIND.job.has(h) || taughtKind(h) === 'job' || (!taughtKind(h) && JOB_SHAPE_FOLDED.test(h)),
    person: (h, n) => n?.kind === 'name' || n?.kind === 'own' || n?.title || TAUGHT_KIND.get(h) === 'family' || OWN_KIND.job.has(h) || /^(?:freunde?|freundin(?:nen)?|nachbar(?:n|in|innen)?|kolleg(?:e|en|in|innen)|leute|gäste|verwandte|bekannte|oma|opa|onkel|tante|cousins?|cousine|neffe|nichte|partner(?:in)?|chef(?:in)?|lehrer(?:in|innen)?|mitbewohner(?:in)?|mitschüler|klasse|team|alle|viele|niemand|jemand|wir|sie|er|personen|menschen|jungs|mädchen|schwager|schwägerin|enkel|großeltern|grosseltern|kommilitonen|beide|familienmitglieder|deutschkurs|kurs|nachbarsfamilie|freundinnen|mama|papa|baby|hund|band)$/u.test(h),
    partnerNames: wordsOf(String(turn.partner || '')).map(fold).filter((w) => !['frau', 'herr'].includes(w)),
    isLanguage: (h) => OWN_KIND.language.has(h),
    notPlace: (h) => notPlace(h),
    dayExists: (t) => !t.said || isDate(withYear(t.said)),
    isDate: (t) => Boolean(t.year && t.said) && isDate(t.said),
    anyThing: (c) => [...new Set([c.subj, c.acc, c.pred, ...(c.elems || []).map((e) => e.np)].filter(Boolean).flatMap((n) => n.heads || [n.head]))],
    nearMiss: (c) => { const p = fold(wordsOf(text.replace(/[.,!?;:]/g, ' ')).find((w) => participleOf(w)) || ''); return Boolean(p) && Boolean(c.perfect) && !lexicon.said?.has?.(p) && [...(lexicon.perfect || []), 'gespielt', 'gekocht', 'gehört'].some((x) => x !== p && levenshtein(x, p) === 1) && !lexicon.verbs?.has?.(p); },
  };
  // The verb's own preposition, prefix or object is checked wherever the sentence reads (`valencyFault`).
  const valency = valencyFault(turn, sentences, env);
  if (valency) return { say: valency, valency, unknown, sentences, env };
  const m = meaning(turn, sentences, env);
  // A noun no list knows is welcome where the answer names something of the learner's own; elsewhere it is not praised.
  if (m.say === 'yes' && unknown.length && !OWN_NOUN_KINDS.has(asked(turn)?.kind)) return { say: null, unknown, sentences };
  return { say: m.say, unknown, sentences, env, small: clauses.some((c) => nouns(c).some((n) => n.small) || (c.elems || []).some((e) => e.small) || (c.lemma === 'sprechen' && (c.adj || []).some((a) => a.words.some((w) => OWN_KIND.language.has(w))))) };
}
/** CORRECT, TYPO, WRONG or BEYOND (the third outcome) for one typed answer: a WRONG names its fault (`wrongReason`). */
/**
 * A taught word with one letter wrong inside it („Supe“, „Englich“, „Wie get es …“, „Samstg“) is a slip of that word, whatever the rest
 * of the check would call it: an own word, English, a missing word (independent score of c6918f2d, MAJOR). Never the first or the last
 * letter: an ending is a form („Computers“), and another first letter another word. Returns the answer with the word put right, or null.
 */
const slips = { turn: null, value: null, fixed: null };
function slipFixed(turn, value) {
  if (slips.turn === turn && slips.value === value) return slips.fixed;
  Object.assign(slips, { turn, value, fixed: null });
  const lexicon = turn?.lexicon;
  const text = String(value ?? '');
  if (!lexicon?.has || turn.spell || turn.listen || text.length > 160) return null;
  const result = gradeTyped(turn, value);
  const unchecked = result === RESULT.CORRECT ? uncheckedIn(turn, value) : null;
  if (result === RESULT.TYPO || (unchecked && !unchecked.length && !/[a-z]/i.test(text))) return null;
  // All typed small: the nouns and the names of it written large, nothing else changed („das ist mein bruder ali“).
  if (!verifiedResult(result) && text === text.toLocaleLowerCase('de')) {
    const large = text.replace(/\p{L}+/gu, (w, at) => (at === 0 || lexicon.names?.has?.(fold(w)) || lexicon.genders.has(fold(w)) || OWN_NOUNS.has(fold(w)) || OWN_KIND.place.has(fold(w)) || OWN_KIND.language.has(fold(w)) || (!lexicon.has(fold(w)) && !CLOSED.has(fold(w)) && !verbReadings(fold(w)).length && !adjectiveForm(fold(w)).length && !GERMAN_ADVERBS.has(fold(w)) && !determinerOf(fold(w))) ? w.charAt(0).toLocaleUpperCase('de') + w.slice(1) : w));
    if (large !== text && verifiedResult(gradeTyped(turn, large))) { slips.fixed = large; return large; }
  }
  const tokens = [...text.matchAll(/\p{L}+/gu)];
  const unknown = tokens.filter((m) => {
    const w = m[0]; const f = fold(w);
    // („get“ for „geht“ is a slip; a whole English word is English.)
    if (f.length > 3 && (ENGLISH_SMALL_SET.has(f) || ENGLISH_NOUN_SET.has(f) || lexicon.english?.has?.(f))) return false;
    if (f.length < 3 || (lexicon.names?.has?.(f) && /^\p{Lu}/u.test(w))) return false;
    if (unchecked) return unchecked.some((u) => fold(u) === f) || (/^\p{Ll}/u.test(w) && !knownWord(w, lexicon) && !adjectiveForm(f).length && !verbReadings(f).length && !GERMAN_ADVERBS.has(f) && !determinerOf(f));

    return !knownWord(w, lexicon) && !lexicon.genders.has(f) && !OWN_NOUNS.has(f) && !adjectiveForm(f).length && !verbReadings(f).length && !GERMAN_ADVERBS.has(f) && !determinerOf(f) && !readingsOfOwn(f);
  });
  if (!unknown.length || unknown.length > 3) return null;
  for (const m of unknown) for (const word of [...(/^\p{Ll}/u.test(m[0]) && !unchecked ? [m[0].charAt(0).toLocaleUpperCase('de') + m[0].slice(1)] : []), ...near1(asciiUmlauts(fold(m[0])))]) {
    const fixed = `${text.slice(0, m.index)}${/^\p{Lu}/u.test(m[0]) ? word.charAt(0).toLocaleUpperCase('de') + word.slice(1) : word}${text.slice(m.index + m[0].length)}`;
    if (verifiedResult(gradeTyped(turn, fixed)) && !uncheckedIn(turn, fixed).some((u) => fold(u) === fold(word))) { slips.fixed = fixed; return fixed; }
  }
  return null;
}
// The words of the lists too (towns, jobs, things), where they are long enough to be told from another word.
let listed = null;
const LISTED = () => { listed ||= [...OWN_KIND.place, ...OWN_KIND.job, ...OWN_KIND.language, ...OWN_NOUNS.keys()].map(asciiUmlauts).filter((x) => x.length >= 6 && !COURSE_WORDS.has(x)); return listed; };
const nearMemo = new Map();
function near1(w) {
  if (!nearMemo.has(w)) nearMemo.set(w, w.length < 3 ? [] : [...COURSE_WORDS, ...LISTED()].filter((c) => c.length >= 4 && c[0] === w[0] && Math.abs(c.length - w.length) <= 1 && c !== w && insideSlip(w, c)).slice(0, 8));
  return nearMemo.get(w);
}
/** One letter left out, put in, changed, or two changed places, neither the first letter nor the last. */
function insideSlip(a, b) {
  // The last letter doubled or not („Wan“, „Stuhll“), or left off a long word where it is no ending („Bleistif“).
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  if (long === short + short.at(-1) && short.length >= 3) return true;
  if (b === a + b.at(-1) && b.length >= 7 && 'tkpgdfm'.includes(b.at(-1)) && !/(?:st|et|te)$/u.test(b)) return true;
  if (a.startsWith(b) || b.startsWith(a) || a.at(-1) !== b.at(-1)) return false;
  if (levenshtein(a, b) === 1) return true;
  if (a.length !== b.length) return false;
  const d = [...a].map((ch, i) => (ch === b[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]];
}

/**
 * A typo of capitals only („was ist das?“, „sie ist jung“ typed on a phone): the same answer with the first letter of each sentence, the
 * names and the nouns written large is right (Claude score of c6918f2d, MINOR 10). The screen then says what the slip is.
 */
export function capitalsOnly(turn, value) {
  const text = String(value ?? '');
  if (!turn?.lexicon || turn.spell || turn.listen || typedResult(turn, value) !== RESULT.TYPO) return false;
  const lexicon = turn.lexicon;
  const large = text.replace(/\p{L}+/gu, (w, at) => ((at === 0 || /[.!?]\s*$/.test(text.slice(0, at))) || lexicon.names?.has?.(fold(w)) || lexicon.genders.has(fold(w)) || OWN_NOUNS.has(fold(w)) || OWN_KIND.place.has(fold(w)) || OWN_KIND.language.has(fold(w)) ? w.charAt(0).toLocaleUpperCase('de') + w.slice(1) : w));
  return large !== text && fold(large) === fold(text) && gradeTyped(turn, large) === RESULT.CORRECT;
}
export function typedResult(turn, value) {
  const result = gradeTyped(turn, value);
  if (result === RESULT.TYPO) return result;
  return slipFixed(turn, value) ? RESULT.TYPO : result;
}
function gradeTyped(turn, value) {
  if (['live', 'origin', 'travel'].includes(asked(turn)?.kind) && townNames(value) !== String(value)) return gradeTyped(turn, townNames(value));
  // („Ich wohne in Hof.“: a town may be called as a thing is; where one lives it is a town.)
  const town = ['live', 'origin', 'travel'].includes(asked(turn)?.kind) && String(value).match(/(?<!\p{L})(?:in|aus|nach)\s+(\p{Lu}\p{L}{2,})(?=\s*(?:[.,!?]|$|\s+und\s))/u);
  // A noun with a town's ending („Neustadt“, „Ludwigshafen“) is read as the town.
  const townish = (w) => /(?:stadt|dorf|burg|berg|feld|hausen|heim|ingen|hof|bach|furt|brück|hagen|rode|wald|walde|see|münster|kirchen|hafen)$/u.test(w) && w.length > 5;
  if (town && !/(?:straße|strasse|weg|platz|allee|gasse|ring|damm)$/u.test(fold(town[1])) && !turn.lexicon?.genders?.has?.(fold(town[1])) && !OWN_KIND.place.has(fold(town[1])) && !COUNTRY_ARTICLE[fold(town[1])]) {
    if (readingsOfOwn(fold(town[1])) && townish(fold(town[1]))) return gradeTyped(turn, String(value).replace(town[0], town[0].replace(town[1], 'Bremen')));
  }
  const result = typedCore(turn, value);
  if (verifiedResult(result)) return !doubted(turn, value, result) ? result : READ_FAULT[secondReading(turn, value).say] || (notRead(turn, value) && SURE.has(readFault(turn, value))) ? RESULT.WRONG : BEYOND;
  const reason = reasonFor(turn, value, result);
  if (reason && !readInFull(turn, value, reason)) return RESULT.WRONG;
  return readResult(turn, value);
}
// A fault found by lining the answer up with another one gives way where the reader reads every word of it and it answers the
// turn („Ich habe Hunger, ja.“, „Sie kommt aus Damaskus und lebt jetzt in Bonn.“). In 8,900 blind answers no wrong one was read so.
const readInFull = (turn, value, reason) => { if (['english', 'address'].includes(reason)) return false; return secondReading(turn, value).say === 'yes' && !secondReading(turn, value).unknown.length && verifiedResult(readResult(turn, value)); };
// A frame verifies words around a gap, not their order: what it verifies is read as German too where the reader knows every word
// („Am Montag Zeit habe ich.“, „Ich gehe nach Schule.“, „Es ist blaue.“: independent score of c6918f2d).
const READ_TOO = new Set(['routine', 'freeTime', 'workWhen', 'colour', 'askColour', 'hobby', 'did', 'getUp', 'live', 'age', 'buy', 'need', 'hungry', 'language', 'clock']);
const notRead = (turn, value) => READ_TOO.has(asked(turn)?.kind) && (asked(turn).kind !== 'askColour' || /^(?:Ist|Sind)\s/u.test(String(value).trim())) && !/(?<!\p{L})Hobbys?\s+(?:ist|sind)/u.test(String(value)) && (() => { const r = readable(turn, value); return r.known && !r.read; })();
/** „Ich spreche ein Arabisch“, „Ich wohne in Hauptstraße“: a language has no article, a street has one. */
const ARTICLE_AND_NAME = [/(?<!\p{L})(?:ein|eine|einen|das)\s+(\p{Lu}\p{L}+isch|Deutsch)(?!\p{L}|\s+\p{Lu})/u, /(?<!\p{L})in\s+\p{Lu}\p{L}*(?:straße|strasse|weg|allee|gasse|platz)(?!\p{L})/u];
const articleOfName = (turn, value) => (asked(turn)?.kind === 'language' && ARTICLE_AND_NAME[0].test(String(value))) || ARTICLE_AND_NAME[1].test(String(value));
/** Of an answer a frame verifies, only these repairs are sure enough to call it wrong. */
const SURE = new Set(['order', 'ending', 'extra', 'article', 'verb']);
const doubted = (turn, value, result) => (turn.ownName || asked(turn)?.kind === 'name') && partnerNamed(turn, value) ? true : madeUpWord(turn, value) || malformedNoun(value, turn.lexicon) || wrongPlural(value, turn.lexicon) || unknownVerb(turn, value) || Boolean(secondReading(turn, value).valency) || foreignWord(turn, value) || otherWordTyped(turn, value, result) || articleOfName(turn, value) || notRead(turn, value) || (() => { const r = secondReading(turn, value); return Boolean(r.sentences && r.env) && senseless(turn, r.sentences, r.env); })();
// The faults the second reader is sure of: another task, another thing, a pronoun of another gender, the other form of address.
const READ_FAULT = { task: 'task', word: 'word', pronoun: 'word', address: 'address', sentence: 'sentence', missing: 'missing', case: 'case', ending: 'ending', order: 'order', verb: 'verb', article: 'article' };
function readResult(turn, value) {
  const r = secondReading(turn, value);
  if (r.say === 'yes') {
    const text = spelledOut(westernDigits(value), turn.lexicon);
    if (foreignWord(turn, value) || placeFault(text) || (!turn.ownName && articleFaultIn(turn.lexicon, text)) || sequenceFault(turn, value) === 'extra') return BEYOND;
    return r.small || smallNoun(turn, value) || /^\p{Ll}/u.test(String(value).trim()) ? RESULT.TYPO : RESULT.CORRECT;
  }
  return readFault(turn, value) ? RESULT.WRONG : BEYOND;
}
/** The fault the second reader names: its own, or the one change after which it reads the answer (`oneRepair.js`). */
function readFault(turn, value) {
  const r = secondReading(turn, value);
  if (READ_FAULT[r.say]) return READ_FAULT[r.say];
  // (A reading of fragments alone is none: „Mein Heft grün.“, „Geben es hier Suppe?“)
  const fragments = r.sentences && r.sentences.every((x) => x.clauses.every((c) => c.around || c.frag)) && r.sentences.some((x) => x.clauses.some((c) => c.frag));
  if (!turn.lexicon || turn.spell || turn.listen) return null;
  if (repaired.turn === turn && repaired.value === value) return repaired.fault;
  const fault = oneRepair(turn, spelledOut(westernDigits(value), turn.lexicon).trim(), fragments, Boolean(r.sentences) && !fragments);
  Object.assign(repaired, { turn, value, fault });
  return fault;
}
const repaired = { turn: null, value: null, fault: null };
function oneRepair(turn, text, fragments, sureOnly = false) {
  if (text.length > 110 || !smallWordsKnown(text, (w) => knownWord(w, turn.lexicon))) return null;
  for (const { text: t, fault, sure } of repairs(text, { fragments, isPlace: (w) => OWN_KIND.place.has(fold(w)), isThing: (w) => ['furniture', 'food', 'drink'].includes(taughtKind(fold(w))) })) {
    if (sureOnly && !sure) continue;
    const r = readOnce(turn, t);
    if (r.say === 'yes' && !articleFaultIn(turn.lexicon, t) && !placeFault(t)) return fault;
  }
  return null;
}

// A gap's BEYOND („Ich habe … gesprochen“, a participle the Lektion does not teach) still yields to a fault of form the
// check names in the words around it („Ich habe mit meine Mutter gesprochen“).
// A finite verb form the course says. The near comparison folds umlauts („moechte“), so both spellings are asked.
const finiteVerb = (w, lexicon) => [w, w.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü')].some((x) => { const p = personsOf(x, lexicon); return Boolean(p) && !p.every((y) => y === 'inf'); });
// A named fault stands only where the check is sure of it (`certainFault`): elsewhere the answer is BEYOND.
function reasonFor(turn, value, core) {
  if (englishIn(turn, value)) return 'english';
  if ((turn.ownName || asked(turn)?.kind === 'name') && partnerNamed(turn, value)) return 'task';
  if (!turn.listen && !turn.spell && addressFault(String(value), turn)) return 'address';
  if (!turn.listen && !turn.spell && !turn.ownName && articleFaultIn(turn.lexicon, spelledOut(westernDigits(value), turn.lexicon))) return 'article';
  // What the last look of `coreRule` found wrong wherever it stands („Ich gehe gern im Kino.“, „Gern ich komme mit.“).
  const [vetoed, veto] = core === RESULT.WRONG && !turn.spell && !turn.listen ? coreRule(turn, value) : [];
  if (vetoed === RESULT.WRONG && VETOES.has(veto)) return veto;
  const reason = namedFault(turn, value, core);
  // („Ich kaufe nichts, danke.“ is German and honest: it shows nothing, and it is no mistake.)
  const named = reason && (turn.ownName || certainFault(turn, spelledOut(westernDigits(value), turn.lexicon), reason, (w) => knownWord(fold(w), turn.lexicon), (w) => finiteVerb(w, turn.lexicon))) ? reason : null;
  // „nichts“ in the learner's gap names nothing the turn asks for: a fault the check is sure of is told as the task read again
  // (`check.fault.task`), since no word is wrong; an unsure one stays BEYOND („Ja, beides!“, „Ist bei Ihnen alles gut?“).
  if (named && !['english', 'address'].includes(named) && /(?<!\p{L})(?:nichts|alles|beides)(?!\p{L})/iu.test(String(value))) return 'task';
  return named;
}
const VETOES = new Set(['order', 'word', 'agreement', 'tense', 'missing', 'article']);
export function namedFault(turn, value, core) {
  if (core === BEYOND) return turn.spell || turn.listen ? null : formFault(spelledOut(westernDigits(value), turn.lexicon), turn.lexicon) || null;
  return reasonOf(turn, value);
}

/**
 * The word after an own-name opening is a name: not an opening's word again („Mein Name ist ist Omar“), no small
 * word, no taught noun or job („Ich bin Student“, „Ich bin Tischler“), no taught word written small („ich bin
 * müde“). A cast name is a name; any other word is the learner's own name, also written small on a phone.
 */
function isName(turn, raw) {
  const w = fold(String(raw || '').replace(/[.,!?;:]+$/, ''));
  if (!w || turn.accepted.some((o) => wordsOf(fold(o)).includes(w)) || CLOSED.has(w)) return false;
  const lexicon = turn.lexicon;
  if (lexicon?.names?.has?.(w)) return true;
  if (lexicon?.genders?.has?.(w) || OWN_KIND.job.has(w) || OWN_KIND.language.has(w) || NO_NAME.has(w)) return false;
  return !(lexicon?.has?.(w) && /^\p{Ll}/u.test(String(raw)));
}

/**
 * Rule 3 (the third score, 2026-11-22): the optional pieces of a turn, generated from its own answers. A piece is a run
 * of one to three words that one answer (or opening word) has and another, otherwise the same, has not, with the word
 * before and after it: „ab“ after „Zug“ at the end („Wann fährt der Zug?“, „Wann fährt der Zug ab?“), „mir“ after
 * „passt“, „jetzt“ after „es“, „Entschuldigung“ first. An answer may drop it where an answer has it.
 */
const PIECES = new WeakMap();
function piecesOf(turn) {
  const key = turn.lexicon ? turn.accepted : null; // without the course's words no verb is known: no cache
  if (key && PIECES.has(key)) return PIECES.get(key);
  const rawTok = (s) => wordsOf(String(s).replace(/[.,!?;:„“"()]/g, ' '));
  const raws = [...(turn.accepted || []).map(frameOf), ...(turn.answerWords || []), ...(turn.leadWords || [])].map(rawTok).filter((t) => t.length);
  const out = [];
  const seen = new Set();
  for (const ra of raws) {
    const a = ra.map(fold);
    for (const rb of raws) {
      const b = rb.map(fold);
      const n = b.length - a.length;
      if (n < 1 || n > 3) continue;
      for (let i = 0; i <= a.length; i += 1) {
        if (!a.slice(0, i).every((w, j) => b[j] === w) || !a.slice(i).every((w, j) => b[i + n + j] === w)) continue;
        const words = b.slice(i, i + n);
        // A piece with a verb or a subject is no optional piece: without „ich möchte“ the rest has another case
        // („ich möchte kein Kuchen“ is no „kein Kuchen“).
        if (words.includes(GAP) || words.some((w) => personsOf(w, turn.lexicon) || ['ich', 'du', 'er', 'wir', 'ihr'].includes(w))) continue;
        // Nor is a piece beside the gap: it belongs to what the gap says („… Jahre alt“, „…, guten Tag“).
        if ((i && b[i - 1] === GAP) || b[i + n] === GAP) continue;
        // `written`: the piece as the answer writes it, so a small „tag“ for „Tag“ stays the slip it is.
        const piece = { words, written: rb.slice(i, i + n), left: i ? b[i - 1] : '^', right: i + n < b.length ? b[i + n] : '$' };
        const k = JSON.stringify({ ...piece, written: undefined });
        if (!seen.has(k)) { seen.add(k); out.push(piece); }
      }
    }
  }
  if (key) PIECES.set(key, out);
  return out;
}

/** The turn's optional pieces (Rule 3), for tools and tests. */
export const optionalPieces = (turn) => piecesOf(turn);

/** The answer without one optional piece, where it stands between its own two anchors (`piecesOf`), each such place once. */
function withoutPieces(text, pieces) {
  const w = wordsOf(String(text).trim());
  const f = w.map(plainOf);
  const out = [];
  for (const p of pieces) {
    for (let i = 0; i + p.words.length <= f.length; i += 1) {
      if (!p.words.every((x, j) => f[i + j] === x)) continue;
      const end = i + p.words.length;
      if (end === f.length && i === 0) continue;
      // Rule 4: only at the place its own anchors give it — the word before it and the word after it, both.
      const leftOk = p.left === '^' ? i === 0 : f[i - 1] === p.left;
      const rightOk = p.right === '$' ? end === f.length : f[end] === p.right;
      if (!leftOk || !rightOk) continue;
      const kept = [...w.slice(0, i), ...w.slice(end)];
      // The stop of the piece's last word moves to the word before it; a new first word takes the case the first was
      // typed in, so a small first letter stays the slip it is („ja, das passt“).
      const stop = (w[end - 1].match(/[.!?]+$/) || [''])[0];
      if (end === w.length) kept[i - 1] = kept[i - 1].replace(/[,;:]+$/, '') + stop;
      if (i === 0) kept[0] = (/^\p{Lu}/u.test(w[0]) ? kept[0].charAt(0).toLocaleUpperCase('de') : kept[0].charAt(0).toLocaleLowerCase('de')) + kept[0].slice(1);
      // A piece typed with another case inside the sentence („guten tag“) stays: its slip is graded as everywhere.
      const typed = w.slice(i, end).map((x) => x.replace(/^[„“"(]+|[.,!?;:„“")]+$/g, ''));
      if ((p.written || []).some((x, j) => (i > 0 || j > 0) && x !== typed[j])) continue;
      out.push(kept.join(' '));
    }
  }
  return out;
}

// A further word of an own name: a name of the cast or a word written as a name the course does not teach; written
// small only where the first name was („omar haddad“).
function nameGoesOn(turn, word, small) {
  const plain = String(word || '').replace(/[.,!?;:]+$/, '');
  const f = fold(plain);
  if (!/\p{L}/u.test(plain) || CLOSED.has(f) || turn.accepted.some((o) => wordsOf(fold(o)).includes(f))) return false;
  if (/^\p{Lu}/u.test(plain)) return Boolean(turn.lexicon?.names?.has?.(f)) || !(turn.lexicon?.has?.(f) || turn.lexicon?.said?.has?.(f));
  return small && !knownWord(plain, turn.lexicon);
}

// The digits a heard number was written with may carry a label before them („Telefonnummer: 0421 3618“, „Gleis 7“)
// and a unit after them („15 Euro“, „9.30 Uhr“) — nothing else (Rule 1: „0421 3618 bin“ is no answer).
const LABELS = new Set(['telefonnummer', 'nummer', 'telefon', 'tel', 'handy', 'handynummer', 'preis', 'gleis', 'bahnsteig', 'fahrkarte', 'ticket', 'kostet',
  'kosten', 'macht', 'das', 'die', 'der', 'ist', 'es', 'vom', 'von', 'büro', 'amt', 'nr', 'zug', 'abfahrt', 'um', 'am', 'fährt', 'ab']);
const UNITS = new Set(['euro', 'eur', 'uhr']);
function onlyLabels(turn, text) {
  const heardWords = wordsOf(fold(turn.listen || '').replace(/[.,!?;:]/g, ' '));
  const heard = new Set(heardWords);
  const numberish = (w) => /\d/.test(w) || isNumberWord(w) || DAYS.some((d) => d === w || slip(w, d)) || ['halb', 'viertel', 'nach', 'vor'].includes(w) || Boolean(DAY_SHORT[w]);
  // After the number: a unit, a part of the day, „zusammen“, or what the heard sentence says after a number („umsteigen“).
  const firstNumber = heardWords.findIndex(numberish);
  const heardAfter = new Set(firstNumber < 0 ? [] : heardWords.slice(firstNumber));
  const dayPart = (w) => DAY_PARTS.includes(w.replace(/s$/, '')) || w === 'abends';
  const words = wordsOf(fold(text).replace(/[.,!?;:„“"()€]/g, ' ')).filter((w) => /\p{L}/u.test(w));
  const all = wordsOf(fold(text).replace(/[,;:„“"()€]/g, ' ').replace(/\.(?=\s|$)/g, ' '));
  const last = all.map(numberish).lastIndexOf(true);
  if (last < 0) return false;
  // A word inside the number breaks it („0421 ich 3618“, „0421 und 3618“; section D): between two groups of digits only
  // what a number or a time has („9.30 Uhr“, „von 8 bis 16 Uhr“).
  const digitAt = all.map((w) => /\d/.test(w));
  if (all.some((w, i) => /\p{L}/u.test(w) && digitAt.slice(0, i).includes(true) && digitAt.slice(i + 1).includes(true) && !['uhr', 'bis', 'um', 'ab', 'von', 'euro', 'eur'].includes(w))) return false;
  const heardNotFinite = (w) => { const p = personsOf(w, turn.lexicon); return heard.has(w) && !CLOSED.has(w) && (!p || p.includes('inf')); };
  if (!all.slice(last + 1).every((w) => UNITS.has(w) || dayPart(w) || ['zusammen', 'bitte', 'danke'].includes(w) || heardAfter.has(w) || heardNotFinite(w) || !/\p{L}/u.test(w))) return false;
  // („und“ joins nothing in a note of one time: „Dienstag, und 9.30 Uhr“; section D.)
  return words.every((w) => !['und', 'oder'].includes(w) && (numberish(w) || UNITS.has(w) || dayPart(w) || heard.has(w) || LABELS.has(w) || WHEN_GLUE.has(w) || CLOSED.has(w) || w === 'zusammen'));
}

const DAY_WITH_PART = /\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)(?:vormittag|nachmittag|abend|morgen|mittag|nacht)\b/gu;
// Nouns German writes with a capital and no other word of the language looks like: a place, a day, a month, „Uhr“, a taught
// noun the course never writes small.
function smallNoun(turn, value) {
  const lexicon = turn.lexicon;
  // „jeden morgen“, and „Wie geht es ihnen?“ to the partner addressed with Sie.
  if (/(?<!\p{L})(?:jeden|guten|schönen|am)\s+(?:morgen|abend|tag|mittag|nachmittag|vormittag)(?!\p{L})/u.test(value)) return true;
  if (/(?<!\p{L})geht\s+es\s+ihnen(?!\p{L})/u.test(value)) return true;
  return (String(value || '').match(/\p{L}+/gu) || []).some((w) => {
    if (!/^\p{Ll}/u.test(w)) return false;
    const f = fold(w);
    if (lexicon?.names?.has?.(f) && !lexicon?.small?.has?.(f)) return true;
    if (CLOSED.has(f) || ADVERBS.has(f) || lexicon?.small?.has?.(f) || lexicon?.verbs?.has?.(f)) return false;
    if (turn.ownName || turn.parts) return ['name', 'vorname', 'nachname', 'familienname'].includes(f);
    return DAYS.includes(f) || f === 'uhr' || OWN_KIND.place.has(f) || ['name', 'vorname', 'nachname', 'telefonnummer', 'hobby'].includes(f) || (Boolean(lexicon?.genders?.get?.(f)) && !OWN_KIND.language.has(f));
  });
}

/** Two words typed as one („Mirgeht es gut.“, „Waskostet die Uhr?“): the answer with its space is a slip of it. */
function apart(turn, text) {
  const words = String(text).trim().split(/\s+/);
  for (let i = 0; i < words.length; i += 1) {
    const bareWord = words[i].replace(/[.,!?;:]+$/, '');
    if (bareWord.length < 5 || knownWord(fold(bareWord), turn.lexicon)) continue;
    for (let k = 2; k <= bareWord.length - 2; k += 1) {
      const [a, b] = [bareWord.slice(0, k), bareWord.slice(k)];
      if (!(turn.lexicon?.said?.has?.(fold(a)) && turn.lexicon?.said?.has?.(fold(b)))) continue;
      const r = coreTries(turn, [...words.slice(0, i), a, b + words[i].slice(bareWord.length), ...words.slice(i + 1)].join(' '));
      if (verifiedResult(Array.isArray(r) ? r[0] : r)) return [RESULT.TYPO, 'spacing'];
    }
  }
  return null;
}

// „Gern ich komme mit.“, „Natürlich ich habe Zeit.“: after an adverb without a comma the verb comes first.
const ADVERB_SUBJECT = /(?:^|[.!?]\s+)(?:gern|gerne|natürlich|leider|vielleicht|dann|heute|morgen|jetzt|gestern|meistens|normalerweise|manchmal|oft|morgens|abends)\s+(?:ich|du|wir|er)\s+\p{Ll}/iu;
/** The result and the path that verified it (`verifiedRule`); the early kinds (a name, a heard number, a message) by kind. */
function coreRule(turn, value) {
  if (englishIn(turn, value)) return [RESULT.WRONG, 'english'];
  const open = !turn.listen && !turn.spell;
  const text = spelledOut(westernDigits(value), turn.lexicon);
  let r = coreTries(turn, value);
  if (!Array.isArray(r)) r = [r, turn.ownName ? 'own name' : turn.listen ? 'heard' : turn.parts ? 'message' : 'as typed'];
  if (!verifiedResult(r[0]) && open && !turn.parts && !sequenceReason(turn, value)) r = bySentences(turn, text) || apart(turn, text) || r;
  else if (r[0] === RESULT.TYPO && open && !turn.parts) { const whole = bySentences(turn, text); if (whole?.[0] === RESULT.CORRECT) r = whole; }
  if (!open || !verifiedResult(r[0])) return r;
  // A verified answer may still be in the other form of address, or hold a determiner that fits no reading of its noun in
  // an open gap („mit mein Freund“, „den Zeitung“).
  if (addressFault(String(value), turn)) return [RESULT.WRONG, 'address'];
  if (ADVERB_SUBJECT.test(text)) return [RESULT.WRONG, 'order'];
  const placed = placeFault(text) || expletiveAgreement(text, turn.lexicon);
  if (placed) return [RESULT.WRONG, placed];
  // … a slip that is another person of the verb („Fahrt der Zug …?“: „fahrt“ is ihr, „fährt“ er; Claude score, 2026-11-25), …
  if (r[0] === RESULT.TYPO && formFault(text, turn.lexicon) === 'agreement') return [RESULT.WRONG, 'agreement'];
  // … a past with „morgen“ („Ich habe morgen gearbeitet.“), or „bei“ where one goes by something („bei dem Bus fahren“).
  if (/(?<!\p{L})(?:habe|hast|hat|haben|bin|ist|sind)(?!\p{L})/iu.test(text) && wordsOf(text).some((w) => participleOf(w.replace(/[.,!?;:]+$/, '')))
    && /(?<!(?:heute|gestern|am|jeden|diesen|guten)\s)(?<!\p{L})(?:morgen|übermorgen|nächste[nrsm]?)(?!\p{L})/u.test(text) && !/geboren/i.test(text)) return [RESULT.WRONG, 'tense'];
  if (/(?<!\p{L})(?:fahr|fähr|komm|reis)\p{L}*(?!\p{L})/iu.test(text) && /(?<!\p{L})(?:bei\s+(?:dem|der)|beim)\s+(?:Bus|Zug|Bahn|Auto|Taxi|Fahrrad|Straßenbahn|U-Bahn|S-Bahn|Flugzeug|Schiff)(?!\p{L})/iu.test(text)) return [RESULT.WRONG, 'word'];
  // „Ich stehe morgens um sieben Uhr.“ is „aufstehen“ without its „auf“.
  if (/(?<!\p{L})stehe(?!\p{L})/iu.test(text) && /(?<!\p{L})um(?!\p{L})/iu.test(text) && !/(?<!\p{L})auf(?!\p{L})/iu.test(text)) return [RESULT.WRONG, 'missing'];
  if (!turn.ownName && articleFaultIn(turn.lexicon, text)) return [RESULT.WRONG, 'article'];
  // A noun written small is the slip it is everywhere („Ich komme aus syrien.“, „am montag“).
  return r[0] === RESULT.CORRECT && smallNoun(turn, value) ? [RESULT.TYPO, r[1]] : r;
}
function typedCore(turn, value) { return coreRule(turn, value)[0]; }
/** The path by which an answer is verified („as typed“, „partner“, „option“, „verb second“ …), or null. */
export function verifiedRule(turn, value) {
  const [result, rule] = coreRule(turn, value);
  return verifiedResult(result) ? rule : null;
}

function coreTries(turn, value) {
  // Rule 4: a word twice in a row or where German never puts it is no verified answer, whatever follows.
  if (sequenceReason(turn, value)) return RESULT.WRONG;
  if (turn.ownName && !turn.bareName) {
    // „Guten Tag. Ich heiße Ana Chakiri.“, „Ich heiße Mohammed, freut mich!“: the greeting around the name comes off.
    const plainTurn = { ...turn, bareName: true };
    const all = [value, ...withoutCourtesy(value, turn)].map((s) => coreTries(plainTurn, s));
    return all.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), RESULT.WRONG);
  }
  if (turn.ownName) {
    const said = fold(value);
    const opening = turn.accepted.find((o) => new RegExp(`^${fold(o)}\\s+\\p{L}`, 'u').test(said));
    const raw = String(value).trim().split(/\s+/);
    let at = opening ? wordsOf(opening).length : -1;
    // „Ich bin Frau Haddad.“, „Mein Name ist Herr Saleh.“; never the partner's own name.
    if (opening && /^(?:frau|herr)$/iu.test(raw[at] || '') && raw[at + 1] && !fold(turn.partner || '').includes(fold(raw[at + 1]).replace(/[.,!?;:]+$/, ''))) at += 1;
    if (!opening || !isName(turn, raw[at])) return RESULT.WRONG;
    // The whole name („Omar Haddad“, „Omar Al-Haddad“) up to a stop or a word that is no name; then what is left is
    // graded on its own (Rule 1): „Ich heiße Omar und kommen aus Syrien“ is no verified answer.
    const small = /^\p{Ll}/u.test(raw[at]);
    let end = at + 1;
    while (end < raw.length && !/[.,!?;:]$/.test(raw[end - 1]) && nameGoesOn(turn, raw[end], small)) end += 1;
    return restResult(turn.lexicon, raw.slice(end).join(' '), 'ich', opening);
  }
  const text = spelledOut(westernDigits(value), turn.lexicon);
  if (turn.listen && (turn.when || turn.time)) {
    // A heard day and time („Dienstag, 9.30“, „am Dienstag um halb zehn“, „Di 9:30“) or a heard time, also in the
    // heard sentence's own words („Der Zug fährt um neun Uhr dreißig“, second corpus of Lektion 10).
    const heard = new Set(wordsOf(fold(turn.listen)).map((w) => w.replace(/[.,!?:]+$/, '')));
    const keep = (w) => { const f = fold(w).replace(/[.,!?:]+$/, ''); return !heard.has(f) || WHEN_GLUE.has(f) || DAYS.includes(f) || isNumberWord(f) || ['uhr', 'halb', 'viertel', 'nach', 'vor'].includes(f); };
    const at = whenOf(text) || whenOf(wordsOf(text).filter(keep).join(' '));
    // Nothing after the time but its unit (Rule 1: „Dienstag, 9.30 Uhr ist.“ is no answer).
    if (!onlyLabels(turn, text)) return RESULT.WRONG;
    if (turn.when) return sameWhen(at, turn.when, { writtenNote: true }) ? (at.typo ? RESULT.TYPO : RESULT.CORRECT) : RESULT.WRONG;
    return at && at.time !== null && at.time === clockOf(turn.time) && !(at.half && at.half !== halfOf24(turn.time)) ? RESULT.CORRECT : RESULT.WRONG;
  }
  if (turn.listen) {
    // A heard price or platform is no clock time: „fünfzehn Uhr“, „um sieben Uhr“ (first corpus of Lektion 10).
    if (/\b(?:uhr|um)\b/i.test(text) && !/\buhr\b/i.test(turn.listen)) return RESULT.WRONG;
    // A heard price counts euros: „15 Fahrkarten“ counts tickets (second corpus of Lektion 10). „Preis: 18 Euro“
    // and „Das macht 30 Euro“ stay right.
    if (/\beuro\b/i.test(turn.listen)) {
      const w = wordsOf(fold(text)).map((x) => x.replace(/[.,!?:]+$/, ''));
      if (w.some((x, i) => (isNumberWord(x) || /^\d/.test(x)) && /\p{L}/u.test(w[i + 1] || '') && !['euro', 'eur'].includes(w[i + 1]))) return RESULT.WRONG;
    }
    // A heard number is its digits: „Telefonnummer: 0421 3618" wrote down the right number with a label,
    // „18,00 €" the price „18 Euro" (and „funfundvierzig" without its umlaut is 45). A price heard in
    // euros is not written as cents (blind corpus, 2026-11-20).
    if (/\beuro\b/i.test(turn.listen) && /\bcent\b|\bct\b/i.test(text)) return RESULT.WRONG;
    const heard = priceDigits(turn.accepted[0]);
    if (priceDigits(text) && priceDigits(text) === heard) return onlyLabels(turn, text) ? RESULT.CORRECT : RESULT.WRONG;
    return checkAnswer(text, turn.accepted, { dictation: true }).result;
  }
  if (turn.parts) return messageResult(turn, text);
  // SECTION D (the courses session's review of 46c7ca80): CORRECT is a word-for-word match of one accepted answer or
  // frame, in its order. Nothing is dropped, added, moved or exchanged on the way, except
  //   - a spelling or a free variant of the same word („wieviel“, „gerne“, „im“ for „in dem“, digits for numbers);
  //   - what the turn's own data declares: its partner's name in front or at the end, a piece its answers leave out
  //     (Rule 3), its `answerWords`/`leadWords`, the noun for a pronoun (`nounFor`);
  //   - a gap, by its kind (Rule 5);
  //   - a named rule of German word order that only moves words: a question in statement order, the verb second with
  //     the subject last, a time after „Zeit“ or „frei“, „gern“ before or after what one likes.
  // Each try carries the name of the path it came by (`verifiedRule`). Everything else is graded by its fault (WRONG)
  // or is BEYOND: a greeting, a „bitte“, „danke“, „auch“, „denn“, „und du?“ or a degree word counts only where an
  // answer of the turn puts it.
  const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
  // „wieviel" is the old spelling of „wie viel": the same question, with a spelling slip.
  const oldSpelling = /\bwieviel\b/i.test(text);
  const tries = [oldSpelling ? text.replace(/\b(w)ieviel\b/gi, '$1ie viel') : text];
  const via = new Map([[tries[0], oldSpelling ? 'spelling' : 'as typed']]);
  const add = (t, rule) => { const s = cap(String(t).trim()); if (s && !tries.includes(s)) { tries.push(s); via.set(s, rule); } };
  const push = (s, rule) => { if (!tries.includes(s)) { tries.push(s); via.set(s, rule); } };
  // What a speech recogniser writes is the same word (the spoken path, 2026-11-23): a number before a word in digits
  // („2 Kaffee“, „1 Buch“ for „ein Buch“) and „es“ written out after a verb („mach es gut“ for „Mach’s gut“).
  for (const s of digitWords(tries[0])) add(s, 'variant');
  if (/(?<=\p{L})(?:'s|\s+es)\b/u.test(tries[0])) add(tries[0].replace(/(?<=\p{L})(?:'s|\s+es)\b/u, '’s'), 'variant');
  // The partner the turn names (`partner`), called by name in front or at the end („Lena, …“, „…, Lena?“,
  // „frau wolf was ist das“) or after a sentence („Danke, Lena. Und Sie?“).
  const escaped = turn.partner ? turn.partner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
  if (escaped) {
    const s = text.trim();
    for (const named of [s.replace(new RegExp(`^${escaped}[,!:?]?\\s+`, 'i'), ''), s.replace(new RegExp(`[,\\s]+${escaped}(?=\\s*[?.!]*$)`, 'i'), ''),
      s.replace(new RegExp(`,\\s*${escaped}(?=\\s*[.!?]\\s*\\S)`, 'gi'), '')]) if (named && named !== s) add(named, 'partner');
  }
  // An invitation in two sentences („Ich feiere am Samstag eine Party. Möchtest du kommen?“), also joined by a comma or „und“.
  if (turn.slot === 'invite') {
    for (const t of [...tries, ...tries.flatMap((x) => withoutCourtesy(x, turn))]) {
      const said = t.trim().split(/(?<=[.!?])\s+|,\s+(?:und\s+)?|\s+und\s+(?=(?:ich\s+lade|du\s+bist|möchtest\s+du|kommst\s+du)\b)/iu).filter(Boolean);
      const name = turn.partner ? new RegExp(`[,\\s]+${turn.partner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s*[?.!]*$)`, 'i') : /$^/;
      if (said.length === 2 && partyNews(said[0].replace(name, '').replace(/,$/, ''), turn) && INVITE_SECOND.test(said[1].replace(name, ''))) return [/^\p{Ll}/u.test(t.trim()) ? RESULT.TYPO : RESULT.CORRECT, 'invitation in two'];
    }
  }
  // The shapes people give an answer (`answerShapes.js`, 2026-11-25): what stands around it comes off, the answer itself is
  // graded word for word as before.
  const smallStart = new Set();
  const shape = (s, rule, from) => { add(s, rule); if (/^\p{Ll}/u.test(from.trim())) smallStart.add(cap(String(s).trim())); };
  for (const t of [...tries]) for (const s of withoutCourtesy(t, turn)) shape(s, 'courtesy', t);
  for (const t of [...tries]) for (const s of withoutAsking(t, turn)) shape(s, 'indirect question', t);
  for (const t of [...tries]) for (const s of withoutDemonstrative(t)) shape(s, 'demonstrative', t);
  // „am Samstagvormittag“ is on Saturday.
  for (const t of [...tries]) if (DAY_WITH_PART.test(t)) shape(t.replace(DAY_WITH_PART, '$1'), 'day part', t);
  const finite = (w) => { const p = personsOf(String(w).replace(/[.,!?;:]+$/, ''), turn.lexicon); return Boolean(p) && !p.every((x) => x === 'inf'); };
  for (const t of [...tries]) for (const s of withoutSmallWord(t, finite)) shape(s, 'small word', t);
  // The longer ways to say the same (`answerRewrites.js`, 2026-11-25), twice: „Ich habe nach der Arbeit großen Hunger.“
  const readings = (n) => readingsIn(turn.lexicon, n);
  const asks = rewritesFor(turn);
  for (let pass = 0; pass < 2; pass += 1) {
    const before = tries.length;
    for (const t of [...tries]) {
      for (const s of [withoutAttribute(t, readings), withoutDegree(t), asks.time ? null : withoutOccasion(t), asks.party ? withoutParty(t) : null,
        asks.have ? asHaveQuestion(t) : null, cleanLead(t, turn.lexicon) ? nounForPronoun(t, readings) : null, asks.well ? asWell(t) : null, asks.day ? asTimeQuestion(t) : null, asks.cost ? asCostQuestion(t, asks) : null, withoutAndYou(t)]) if (s && s !== t) shape(s, 'said longer', t);
    }
    if (tries.length === before) break;
    for (const t of tries.slice(before)) for (const s of withoutSmallWord(t, finite)) shape(s, 'said longer', t);
  }
  if (turn.slot === 'activity') {
    const clock = /\s+(?:um|gegen|bis|ab)\s+((?:halb\s+|viertel\s+(?:vor|nach)\s+)?(?:\d{1,2}(?:[.:]\d{2})?|\p{L}+))(?:\s+uhr)?(?=[\s.!,]|$)/iu;
    for (const t of [...tries]) {
      const m = t.match(clock);
      if (m && clockOf(m[1]) !== null) shape(t.replace(clock, ''), 'clock time', t);
    }
    for (const t of [...tries]) for (const s of verbSecond(t)) push(s, 'verb second');
    for (const t of [...tries]) {
      const list = t.trim().match(/^Ich\s+(.+?)[.!]*$/u);
      const items = list ? list[1].split(/\s*,\s*(?:und\s+)?|\s+und\s+/iu) : [];
      if (items.length < 2 || items.length > 4 || !items.every((x) => /^\p{Ll}\p{L}*e\b/u.test(x))) continue;
      if (items.every((x) => verifiedResult(sentenceResult(turn.accepted, `Ich ${x}.`, turn)))) return [smallStart.has(t) ? RESULT.TYPO : RESULT.CORRECT, 'verbs in a row'];
    }
  }
  // Rule 3: a piece of the turn's answers comes off where one of them has it („Um wie viel Uhr fährt der Zug ab?“ is
  // „Um wie viel Uhr fährt der Zug?“, „… passt mir.“ is „… passt.“), twice at most.
  const pieces = piecesOf(turn);
  // A sentence begun with a small letter keeps that slip when its first piece comes off („nein, keine suppe“).
  for (let pass = 0; pass < 2 && pieces.length; pass += 1) {
    for (const t of [...tries]) {
      for (const s of withoutPieces(t, pieces)) {
        push(s, 'option');
        if (/^\p{Ll}/u.test(t.trim()) || smallStart.has(t)) smallStart.add(s);
      }
    }
  }
  // `answerWords` are a whole answer alone and may open a longer one: words of yes when agreeing (Lektion 8),
  // of goodbye (Lektion 12). Those in front are the yes („Gern.", „Prima, dann bis Freitag.", „Ja,
  // gut, bis dann!"); what follows is graded as the rest, and after a yes the time alone may stand
  // („Gut, am Freitag."). Courses session, 2026-11-20.
  // A small first letter stays the case slip it is everywhere („ja gern", „ja, bis Freitag").
  const afterYes = [];
  const smallYes = new Set();
  // `leadWords` may open an answer but are none alone („Ja, ich komme mit.“, never „Ja.“ where the
  // task asks for the sentence; „Tschüss, bis bald!“, never „Tschüss!“ where „bis bald“ is the can-do).
  if (turn.answerWords?.length || turn.leadWords?.length) {
    const yes = answerWordsRe([...(turn.answerWords || []), ...(turn.leadWords || [])]);
    const alone = turn.answerWords?.length ? new RegExp(answerWordsRe(turn.answerWords).source.replace(/^\^/, '(?:^|[\\s,.!])'), 'iu') : null;
    for (const t of [...tries]) {
      const s = t.trim();
      const rest = s.replace(yes, '').trim();
      if (rest === s) continue;
      const small = /^\p{Ll}/u.test(s);
      if (!rest) {
        if (alone?.test(s)) return [small ? RESULT.TYPO : RESULT.CORRECT, 'answer words'];
        continue;
      }
      // Only a word that is small inside a sentence gets its capital back („bis", „dann", „am"); a
      // noun keeps what was typed, so „ja, freitag ist gut" keeps its slip.
      const first = fold(rest.split(/\s+/)[0]).replace(/[.,!?]+$/, '');
      // („Tschüss, schönen Tag noch!“: after a comma the small letter is German; only a noun keeps what was typed.)
      const nounFirst = Boolean(turn.lexicon?.genders?.has?.(first)) && !/[,]$/.test(s.slice(0, s.length - rest.length).trim());
      const r = CLOSED.has(first) || ADVERBS.has(first) || WHEN_GLUE.has(first) || ['bis', 'dann'].includes(first) || (!nounFirst && /,\s*$/.test(s.slice(0, s.length - rest.length))) ? cap(rest) : rest;
      push(r, 'answer words');
      if (turn.answerWords?.length && turn.slot) afterYes.push(r);
      if (small) smallYes.add(r);
    }
  }
  // Words of goodbye may also close the answer („Schönen Tag und bis später!“).
  if (turn.leadWords?.length) {
    for (const t of [...tries]) {
      const words = [...turn.leadWords].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const r = t.trim().replace(new RegExp(`(?:\\s*,\\s*|\\s+und\\s+)(?:${words})(?=\\s*[.!]*$)`, 'iu'), '');
      if (r !== t.trim()) add(r.replace(/\s*$/, '!'), 'answer words');
    }
  }
  // A time after „frei" or „Zeit" („Ich bin frei am Samstag", „Ich habe Zeit am Wochenende") is ordinary
  // spoken German: the answer with the time before it (courses session, 2026-11-20).
  for (const t of [...tries]) {
    const m = t.trim().match(/^(.+?)\s+(frei|zeit)\s+(.+?)([.!?]*)$/iu);
    // A whole time moves, never the end of one („… um Viertel nach Zeit vier?“ has „Zeit“ inside the time).
    const opensTime = (s) => { const w = fold(wordsOf(s)[0] || ''); return WHEN_GLUE.has(w) || DAYS.includes(w.replace(/s$/, '')) || DAY_PARTS.includes(w.replace(/s$/, '')) || ['heute', 'morgen', 'abends'].includes(w); };
    const cutTime = (s) => ['um', 'am', 'nach', 'vor', 'halb', 'viertel', 'bis', 'ab', 'von', 'gegen'].includes(fold(wordsOf(s).at(-1) || ''));
    if (m && whenOf(m[3]) && opensTime(m[3]) && !cutTime(m[1])) add(`${m[1]} ${m[3]} ${m[2]}${m[4]}`, 'time after Zeit');
  }
  // A question in statement order („Du tanzt gern?") is the question („Tanzt du gern?").
  for (const t of [...tries]) {
    // Also with a noun as the subject („Der Zug fährt nach Berlin?“, first DaF review of Lektion 10).
    const q = t.trim().match(/^(du|sie|er|es|(?:der|die|das|mein|meine|dein|deine)\s+\p{L}+)\s+(\p{L}+)\s+(.*\?)$/iu);
    if (q && !SUBJECTS.has(fold(q[2]))) {
      const asked = `${q[2]} ${/^(du|sie|er|es)$/i.test(q[1]) ? q[1].toLocaleLowerCase('de') : q[1].charAt(0).toLocaleLowerCase('de') + q[1].slice(1)} ${q[3]}`;
      add(asked, 'statement order');
      // „du Tanzt gern?“: a small first letter or a capital verb stays the slip it is.
      if (/^\p{Ll}/u.test(t.trim()) || /^\p{Lu}/u.test(q[2])) smallStart.add(cap(asked.trim()));
    }
  }
  for (const t of [...tries]) for (const s of questionWordLast(t)) add(s, 'statement order');
  for (const t of [...tries]) if (/\bgerne\b/i.test(t)) add(t.replace(/\b(g)erne\b/gi, '$1ern'), 'variant');
  for (const t of [...tries]) for (const s of verbSecond(t)) push(s, 'verb second');
  for (const t of [...tries]) if (via.get(t) === 'verb second') for (const s of withoutSmallWord(t, finite)) shape(s, 'small word', t);
  for (const t of [...tries]) for (const s of gernLast(t)) push(s, 'gern position');
  // „im" is „in dem": „Ich wohne im Irak" is the place answer „in dem Irak".
  for (const t of [...tries]) if (/\bim\b/i.test(t)) push(t.replace(/\bim\b/gi, 'in dem'), 'variant');
  // The family noun may stand where the pronoun stands (`nounFor`): „Meine Mutter kommt aus …" is
  // „Sie kommt aus …" with its noun, and the verb after it is graded just the same.
  // A noun typed without its umlaut („das worterbuch ist hier", „das woerterbuch") still stands for
  // the pronoun, as a typo.
  const slipped = [];
  for (const t of [...tries]) {
    const said = wordsOf(t.trim());
    for (const [pronoun, nouns] of Object.entries(turn.nounFor || {})) {
      for (const noun of nouns) {
        const n = wordsOf(noun).length;
        const head = said.slice(0, n).join(' ');
        const rest = said.slice(n).join(' ');
        if (said.length <= n) continue;
        if (fold(head) === fold(noun)) push(`${pronoun} ${rest}`, 'noun for pronoun');
        else if (!/[äöü]/.test(fold(head)) && /[äöü]/.test(fold(noun)) && bare(head) === bare(noun)) slipped.push(`${pronoun} ${rest}`);
      }
    }
  }
  const graded = [
    ...tries.map((t) => [smallYes.has(t) || smallStart.has(t) ? worst(sentenceResult(turn.accepted, t, turn), RESULT.TYPO) : sentenceResult(turn.accepted, t, turn), via.get(t)]),
    ...slipped.map((t) => [worst(sentenceResult(turn.accepted, t, turn), RESULT.TYPO), 'noun for pronoun']),
    ...afterYes.map((t) => [smallYes.has(t) ? worst(frameResult('…', t, turn), RESULT.TYPO) : frameResult('…', t, turn), 'answer words']),
  ];
  let top = graded.reduce((a, g) => (RANK[g[0]] > RANK[a[0]] ? g : a), [RESULT.WRONG, null]);
  // The turn's further answers (`a11.answers.js`: answers two teachers approved, and frames), word for word like the first.
  if (!verifiedResult(top[0]) && turn.more?.length) {
    for (const t of tries) {
      const near = nearMore(turn, t);
      if (!near.length) continue;
      const r = sentenceResult(near, t, turn);
      const g = smallYes.has(t) || smallStart.has(t) ? worst(r, RESULT.TYPO) : r;
      if (verifiedResult(r) && RANK[g] > RANK[top[0]]) top = [g, 'further answer'];
    }
  }
  return [oldSpelling ? worst(top[0], RESULT.TYPO) : top[0], top[1]];
}

// Of a turn's further answers, those whose words are all in the answer but one at most (a gap frame: its fixed words): the
// rest cannot match it, and a turn may have sixty.
const moreTokens = new WeakMap();
function nearMore(turn, text) {
  if (!moreTokens.has(turn.more)) moreTokens.set(turn.more, turn.more.map((a) => ({ a, gap: hasGap(frameOf(a)), words: tokensOf(frameOf(a).replace(new RegExp(GAP, 'g'), ' ').replace(/…/g, ' ')) })));
  const have = tokensOf(text);
  const left = (words) => { const pool = [...have]; return words.filter((w) => { const i = pool.indexOf(w); if (i < 0) return true; pool.splice(i, 1); return false; }).length; };
  return moreTokens.get(turn.more).filter((m) => (m.gap || Math.abs(m.words.length - have.length) <= 1) && left(m.words) <= 1).map((m) => m.a);
}

/**
 * The grader before section D, kept whole for one purpose: an answer it verifies is German the turn's answers do not
 * have word for word (a greeting, „Und …“, „…, bitte“, a fronted time), so the check names no fault in it and it is
 * BEYOND, never WRONG and never CORRECT (`reasonOf`). No teacher-right answer of the corpora moves to WRONG.
 */
function tolerantCore(turn, value) {
  // Rule 4: a word twice in a row or where German never puts it is no verified answer, whatever follows.
  if (sequenceReason(turn, value)) return RESULT.WRONG;
  if (turn.ownName) {
    const said = fold(value);
    const opening = turn.accepted.find((o) => new RegExp(`^${fold(o)}\\s+\\p{L}`, 'u').test(said));
    const raw = String(value).trim().split(/\s+/);
    let at = opening ? wordsOf(opening).length : -1;
    // „Ich bin Frau Haddad.“, „Mein Name ist Herr Saleh.“; never the partner's own name.
    if (opening && /^(?:frau|herr)$/iu.test(raw[at] || '') && raw[at + 1] && !fold(turn.partner || '').includes(fold(raw[at + 1]).replace(/[.,!?;:]+$/, ''))) at += 1;
    if (!opening || !isName(turn, raw[at])) return RESULT.WRONG;
    // The whole name („Omar Haddad“, „Omar Al-Haddad“) up to a stop or a word that is no name; then what is left is
    // graded on its own (Rule 1): „Ich heiße Omar und kommen aus Syrien“ is no verified answer.
    const small = /^\p{Ll}/u.test(raw[at]);
    let end = at + 1;
    while (end < raw.length && !/[.,!?;:]$/.test(raw[end - 1]) && nameGoesOn(turn, raw[end], small)) end += 1;
    return restResult(turn.lexicon, raw.slice(end).join(' '), 'ich', opening);
  }
  const text = spelledOut(westernDigits(value), turn.lexicon);
  if (turn.listen && (turn.when || turn.time)) {
    // A heard day and time („Dienstag, 9.30“, „am Dienstag um halb zehn“, „Di 9:30“) or a heard time, also in the
    // heard sentence's own words („Der Zug fährt um neun Uhr dreißig“, second corpus of Lektion 10).
    const heard = new Set(wordsOf(fold(turn.listen)).map((w) => w.replace(/[.,!?:]+$/, '')));
    const keep = (w) => { const f = fold(w).replace(/[.,!?:]+$/, ''); return !heard.has(f) || WHEN_GLUE.has(f) || DAYS.includes(f) || isNumberWord(f) || ['uhr', 'halb', 'viertel', 'nach', 'vor'].includes(f); };
    const at = whenOf(text) || whenOf(wordsOf(text).filter(keep).join(' '));
    // Nothing after the time but its unit (Rule 1: „Dienstag, 9.30 Uhr ist.“ is no answer).
    if (!onlyLabels(turn, text)) return RESULT.WRONG;
    if (turn.when) return sameWhen(at, turn.when, { writtenNote: true }) ? (at.typo ? RESULT.TYPO : RESULT.CORRECT) : RESULT.WRONG;
    return at && at.time !== null && at.time === clockOf(turn.time) && !(at.half && at.half !== halfOf24(turn.time)) ? RESULT.CORRECT : RESULT.WRONG;
  }
  if (turn.listen) {
    // A heard price or platform is no clock time: „fünfzehn Uhr“, „um sieben Uhr“ (first corpus of Lektion 10).
    if (/\b(?:uhr|um)\b/i.test(text) && !/\buhr\b/i.test(turn.listen)) return RESULT.WRONG;
    // A heard price counts euros: „15 Fahrkarten“ counts tickets (second corpus of Lektion 10). „Preis: 18 Euro“
    // and „Das macht 30 Euro“ stay right.
    if (/\beuro\b/i.test(turn.listen)) {
      const w = wordsOf(fold(text)).map((x) => x.replace(/[.,!?:]+$/, ''));
      if (w.some((x, i) => (isNumberWord(x) || /^\d/.test(x)) && /\p{L}/u.test(w[i + 1] || '') && !['euro', 'eur'].includes(w[i + 1]))) return RESULT.WRONG;
    }
    // A heard number is its digits: „Telefonnummer: 0421 3618" wrote down the right number with a label,
    // „18,00 €" the price „18 Euro" (and „funfundvierzig" without its umlaut is 45). A price heard in
    // euros is not written as cents (blind corpus, 2026-11-20).
    if (/\beuro\b/i.test(turn.listen) && /\bcent\b|\bct\b/i.test(text)) return RESULT.WRONG;
    const heard = priceDigits(turn.accepted[0]);
    if (priceDigits(text) && priceDigits(text) === heard) return onlyLabels(turn, text) ? RESULT.CORRECT : RESULT.WRONG;
    return checkAnswer(text, turn.accepted, { dictation: true }).result;
  }
  if (turn.parts) return messageResult(turn, text);
  if (turn.slot === 'invite') {
    const plain = text.trim().replace(GREETING_FIRST, '');
    let said = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
    // Without the full stop between them („am samstag ist mein fest kommst du auch?“) the two sentences are a slip.
    const joined = said.length === 1;
    if (joined) said = plain.split(/[,\s]+(?=(?:und\s+)?(?:kommst|möchtest|kannst|hast)\s+du\b|ich\s+lade\s+dich\b)/iu).filter(Boolean);
    const name = turn.partner ? new RegExp(`[,\\s]+${turn.partner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s*[?.!]*$)`, 'i') : /$^/;
    if (said.length === 2 && partyNews(said[0].replace(name, ''), turn) && (INVITE_SECOND.test(said[1].replace(name, '')) || tolerantCore(turn, said[1]) !== RESULT.WRONG)) {
      return joined || /^\p{Ll}/u.test(plain) ? RESULT.TYPO : RESULT.CORRECT;
    }
  }
  // A reply may open with a greeting („Guten Tag! Was ist das?") or „Und" („Und woher kommen deine
  // Eltern?") and name the person it is said to („Herr Weber, …", „…, Lena?", „frau wolf was ist das");
  // the rest is the answer. „Hier, Lena." is „Hier." — „Hier," is no name.
  const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
  // „wieviel" is the old spelling of „wie viel": the same question, with a spelling slip.
  const oldSpelling = /\bwieviel\b/i.test(text);
  const tries = [oldSpelling ? text.replace(/\b(w)ieviel\b/gi, '$1ie viel') : text];
  const add = (t) => { const s = cap(String(t).trim()); if (s && !tries.includes(s)) tries.push(s); };
  const greeted = text.trim().replace(GREETING_FIRST, '');
  if (greeted !== text.trim()) add(greeted);
  const LEAD = /^(?:(?:Herr|Frau)\s+)?\p{Lu}\p{L}*,\s*/u;
  const TRAIL = /,\s*(?:(?:Herr|Frau)\s+)?\p{Lu}\p{L}*(?=\s*[?.!]*$)/u;
  const escaped = turn.partner ? turn.partner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
  const partner = escaped ? new RegExp(`^${escaped}[,!:?]?\\s+`, 'i') : null;
  // The partner's name at the end, with or without a comma („was ist dein hobby lena?").
  const partnerLast = escaped ? new RegExp(`[,\\s]+${escaped}(?=\\s*[?.!]*$)`, 'i') : null;
  if (escaped) {
    const greetName = text.trim().replace(new RegExp(`^(?:hallo|guten\\s+(?:morgen|tag|abend))[\\s,]+${escaped}[,!.:]?\\s+`, 'i'), '');
    if (greetName !== text.trim()) add(greetName);
    const inside = text.trim().replace(new RegExp(`,\\s*${escaped}(?=\\s*[.!?]\\s*\\S)`, 'gi'), '');
    if (inside !== text.trim()) add(inside);
  }
  for (const t of [...tries]) {
    const s = t.trim();
    // A person is called by a name, never by a day, a number, a thing or a place („Ja, Montag“ is no „Ja“; Rule 5).
    const calls = (re) => { const m = s.match(re); const w = m ? fold(m[0].replace(/[,\s]+$/, '').split(/[,\s]+/).at(-1)) : ''; return !m || !(['day', 'number', 'furniture', 'drink', 'food'].includes(taughtKind(w)) || OWN_KIND.place.has(w)); };
    const lead = calls(LEAD) ? s.replace(LEAD, '') : s;
    const trail = calls(TRAIL) ? s.replace(TRAIL, '') : s;
    for (const named of [lead, trail, calls(TRAIL) ? lead.replace(TRAIL, '') : lead, partner ? s.replace(partner, '') : s, partnerLast ? s.replace(partnerLast, '') : s]) if (named && named !== s) add(named);
  }
  // „bitte" and „danke" are politeness, not a different answer: „bitte" at the start, at the end or
  // after the verb („Wo ist bitte mein Büro?"), „danke" at the end („Ja, ich habe Hunger, danke.").
  for (const t of [...tries]) {
    const plain = t.trim().replace(/^bitte[,\s]+/i, '').replace(/[,\s]+bitte(?=\s*[?.!]*$)/i, '').replace(/,?\s+bitte,?(?=\s)/i, '');
    if (plain && plain !== t.trim()) add(plain);
    const thanked = t.trim().replace(/[,\s]+danke(?:\s+schön)?(?=\s*[?.!]*$)/i, '');
    if (thanked && thanked !== t.trim()) add(thanked);
  }
  for (const t of [...tries]) {
    // „Und du, was machst du gern?" is „Was machst du gern?": the „Und du" hands the question back.
    const rest = t.trim().replace(/^und(?:\s+du)?[\s,?]+/i, '');
    if (rest && rest !== t.trim()) { add(rest); add(rest.replace(LEAD, '')); }
  }
  const partnersThing = (turn.accepted || []).some((a) => /\b(?:dein|deine|deinen|Ihr|Ihre|Ihren)\s+\p{Lu}/u.test(typeof a === 'string' ? a : a.frame));
  // NATURAL ANSWERS (the independent score, 2026-11-20), three classes for every turn of every check:
  // a counter-question after a complete answer („Danke, gut. Und Ihnen?“, „Ich bin Lehrer. Und Sie?“) is the
  // answer; a degree word after a complete answer („Ja, das passt mir gut.“, „Das passt sehr gut.“) is the
  // answer; „mein“ where it names the same thing as „der“ in the scene („Wann fährt mein Zug ab?“) is „der“.
  for (const t of [...tries]) {
    const s = t.trim();
    const answered = s.replace(/[\s,.!?]*\bund\s+(?:ihnen|sie|du|dir|bei\s+(?:ihnen|dir))(?:\s+auch)?\s*\?\s*$/iu, '');
    if (answered !== s && wordsOf(answered).length >= 1 && /\p{L}/u.test(answered)) add(/[.!?]$/.test(answered) ? answered : `${answered}.`);
    const plain = s.replace(/\s+(?:(?:sehr|ganz|wirklich|echt|richtig)\s+)?(?:gut|prima|super)(?=\s*[.!]*$)/iu, '');
    if (plain !== s && wordsOf(plain).length >= 2) add(plain);
    const own = s.replace(/\b(mein|meine|meinen|meinem|meiner)\s+(\p{Lu}\p{L}+)/gu, (all, poss, noun) => {
      // Where the turn asks about the partner's thing („Welche Farbe hat deine Tasche?“), mine is another one.
      if (!OWN_THINGS.has(fold(noun)) || partnersThing) return all;
      const g = [OWN_THINGS.get(fold(noun))];
      const p = fold(poss);
      const art = p === 'meine' ? (g.includes('die') ? 'die' : g.includes('pl') ? 'die' : null)
        : p === 'meinen' ? (g.includes('der') ? 'den' : null) : p === 'meinem' ? (g.some((x) => x === 'der' || x === 'das') ? 'dem' : null)
          : p === 'meiner' ? (g.includes('die') ? 'der' : null) : (g.includes('der') ? 'der' : g.includes('das') ? 'das' : null);
      return art ? `${all.charAt(0) === 'M' ? art.charAt(0).toUpperCase() + art.slice(1) : art} ${noun}` : all;
    });
    if (own !== s) add(own);
  }
  // A tag at the end („Du tanzt gern, oder?") asks the same question.
  for (const t of [...tries]) {
    const tagless = t.trim().replace(/,?\s*(?:oder|ne|nicht wahr)\s*\?\s*$/i, '?');
    if (tagless !== t.trim()) add(tagless);
  }
  // Rule 3: a piece of the turn's answers comes off where one of them has it („Um wie viel Uhr fährt der Zug ab?“ is
  // „Um wie viel Uhr fährt der Zug?“, „… passt mir.“ is „… passt.“), twice at most.
  const pieces = piecesOf(turn);
  // A sentence begun with a small letter keeps that slip when its first piece comes off („nein, keine suppe“).
  const smallStart = new Set();
  for (let pass = 0; pass < 2 && pieces.length; pass += 1) {
    for (const t of [...tries]) {
      for (const s of withoutPieces(t, pieces)) {
        if (!tries.includes(s)) tries.push(s);
        if (/^\p{Ll}/u.test(t.trim()) || smallStart.has(t)) smallStart.add(s);
      }
    }
  }
  // `answerWords` are a whole answer alone and may open a longer one: words of yes when agreeing (Lektion 8),
  // of goodbye (Lektion 12). Those in front are the yes („Gern.", „Prima, dann bis Freitag.", „Ja,
  // gut, bis dann!"); what follows is graded as the rest, and after a yes the time alone may stand
  // („Gut, am Freitag."). Courses session, 2026-11-20.
  // A small first letter stays the case slip it is everywhere („ja gern", „ja, bis Freitag").
  const afterYes = [];
  const smallYes = new Set();
  // `leadWords` may open an answer but are none alone („Ja, ich komme mit.“, never „Ja.“ where the
  // task asks for the sentence; „Tschüss, bis bald!“, never „Tschüss!“ where „bis bald“ is the can-do).
  if (turn.answerWords?.length || turn.leadWords?.length) {
    const yes = answerWordsRe([...(turn.answerWords || []), ...(turn.leadWords || [])]);
    const alone = turn.answerWords?.length ? new RegExp(answerWordsRe(turn.answerWords).source.replace(/^\^/, '(?:^|[\\s,.!])'), 'iu') : null;
    for (const t of [...tries]) {
      const s = t.trim();
      const rest = s.replace(yes, '').trim();
      if (rest === s) continue;
      const small = /^\p{Ll}/u.test(s);
      if (!rest) {
        if (alone?.test(s)) return small ? RESULT.TYPO : RESULT.CORRECT;
        continue;
      }
      // Only a word that is small inside a sentence gets its capital back („bis", „dann", „am"); a
      // noun keeps what was typed, so „ja, freitag ist gut" keeps its slip.
      const first = fold(rest.split(/\s+/)[0]).replace(/[.,!?]+$/, '');
      // („Tschüss, schönen Tag noch!“: after a comma the small letter is German; only a noun keeps what was typed.)
      const nounFirst = Boolean(turn.lexicon?.genders?.has?.(first)) && !/[,]$/.test(s.slice(0, s.length - rest.length).trim());
      const r = CLOSED.has(first) || ADVERBS.has(first) || WHEN_GLUE.has(first) || ['bis', 'dann'].includes(first) || (!nounFirst && /,\s*$/.test(s.slice(0, s.length - rest.length))) ? cap(rest) : rest;
      if (!tries.includes(r)) tries.push(r);
      if (turn.answerWords?.length && turn.slot) afterYes.push(r);
      if (small) smallYes.add(r);
    }
  }
  // Words of goodbye may also close the answer („Schönen Tag und bis später!“).
  if (turn.leadWords?.length) {
    for (const t of [...tries]) {
      const words = [...turn.leadWords].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const r = t.trim().replace(new RegExp(`(?:\\s*,\\s*|\\s+und\\s+)(?:${words})(?=\\s*[.!]*$)`, 'iu'), '');
      if (r !== t.trim()) add(r.replace(/\s*$/, '!'));
    }
  }
  // A time after „frei" or „Zeit" („Ich bin frei am Samstag", „Ich habe Zeit am Wochenende") is ordinary
  // spoken German: the answer with the time before it (courses session, 2026-11-20).
  for (const t of [...tries]) {
    const m = t.trim().match(/^(.+?)\s+(frei|zeit)\s+(.+?)([.!?]*)$/iu);
    // A whole time moves, never the end of one („… um Viertel nach Zeit vier?“ has „Zeit“ inside the time).
    const opensTime = (s) => { const w = fold(wordsOf(s)[0] || ''); return WHEN_GLUE.has(w) || DAYS.includes(w.replace(/s$/, '')) || DAY_PARTS.includes(w.replace(/s$/, '')) || ['heute', 'morgen', 'abends'].includes(w); };
    const cutTime = (s) => ['um', 'am', 'nach', 'vor', 'halb', 'viertel', 'bis', 'ab', 'von', 'gegen'].includes(fold(wordsOf(s).at(-1) || ''));
    if (m && whenOf(m[3]) && opensTime(m[3]) && !cutTime(m[1])) add(`${m[1]} ${m[3]} ${m[2]}${m[4]}`);
  }
  const timeTurn = (turn.accepted || []).some((a) => /\b(?:gestern|heute|morgen)\b/i.test(frameOf(a)));
  // Small words that do not change the answer: „denn", „vielleicht", „heute", „hier", „noch", „im Café"
  // in a question („Haben Sie vielleicht Tee?"); „auch" anywhere („Hunger habe ich auch"); „sehr"
  // before „gern" (second and third corpora of Lektionen 7-9).
  for (const t of [...tries]) {
    const s = t.trim();
    if (/\?\s*$/.test(s)) {
      // „heute“ and „morgen“ change the answer where it names a day („Was hast du morgen gemacht?“, third corpus of Lektion 11).
      const filler = timeTurn ? 'denn|vielleicht|hier|noch' : 'denn|vielleicht|heute|morgen|hier|noch';
      // Never the first word: a filler follows the verb („hier Das, was ist das?“ is no question with „hier“ in it).
      const asked = s.replace(/\s+(?:im|in diesem) Café(?=\s*\?)/i, '').replace(new RegExp(`(?<=\\S\\s+)(?:${filler})\\s+`, 'gi'), '').replace(new RegExp(`\\s+(?:${filler})(?=\\s*\\?)`, 'gi'), '');
      if (asked !== s) add(asked);
    }
    const plainer = s.replace(/\s+auch\b/gi, '').replace(/^auch\s+/i, '').replace(/\bsehr\s+(?=gerne?\b)/gi, '');
    if (plainer !== s) add(plainer);
  }
  // The thing offered, echoed before the answer: „Tee? Ja, gerne." is „Ja, gerne.".
  for (const t of [...tries]) {
    const echo = t.trim().match(/^(\p{Lu}\p{L}*)\s*\?\s+(\S.*)$/u);
    if (echo && (!turn.only || turn.only.some((n) => fold(n) === fold(echo[1])))) add(echo[2]);
  }
  // A question in statement order („Du tanzt gern?") is the question („Tanzt du gern?").
  for (const t of [...tries]) {
    // Also with a noun as the subject („Der Zug fährt nach Berlin?“, first DaF review of Lektion 10).
    const q = t.trim().match(/^(du|sie|er|es|(?:der|die|das|mein|meine|dein|deine)\s+\p{L}+)\s+(\p{L}+)\s+(.*\?)$/iu);
    if (q && !SUBJECTS.has(fold(q[2]))) {
      const asked = `${q[2]} ${/^(du|sie|er|es)$/i.test(q[1]) ? q[1].toLocaleLowerCase('de') : q[1].charAt(0).toLocaleLowerCase('de') + q[1].slice(1)} ${q[3]}`;
      add(asked);
      // „du Tanzt gern?“: a small first letter or a capital verb stays the slip it is.
      if (/^\p{Ll}/u.test(t.trim()) || /^\p{Lu}/u.test(q[2])) smallStart.add(cap(asked.trim()));
    }
  }
  // A time named first and picked up by „da/dann" („Am Freitag um zehn Uhr, hast du da Zeit?") is the
  // question with the time in place („Hast du am Freitag um zehn Uhr Zeit?").
  for (const t of [...tries]) {
    const m = t.trim().match(/^(.+?),\s*(\p{L}+)\s+(du|sie)\s+(?:da\s+|dann\s+)?(.+\?)$/iu);
    if (m && whenOf(m[1])) add(`${m[2]} ${m[3].toLocaleLowerCase('de')} ${m[1].charAt(0).toLocaleLowerCase('de')}${m[1].slice(1)} ${m[4]}`);
  }
  for (const t of [...tries]) for (const s of nounFirst(t, turn.lexicon)) add(s);
  for (const t of [...tries]) for (const s of questionWordLast(t)) add(s);
  for (const t of [...tries]) if (/\bgerne\b/i.test(t)) add(t.replace(/\b(g)erne\b/gi, '$1ern'));
  // The noun asked about, echoed before the answer: „Die Schere? Da." is „Da.".
  for (const t of [...tries]) {
    for (const noun of Object.values(turn.nounFor || {}).flat()) {
      const echo = t.trim().match(new RegExp(`^${noun.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\?\\s*(\\S.*)$`, 'iu'));
      if (echo) add(echo[1]);
    }
  }
  for (const t of [...tries]) tries.push(...verbSecond(t, { drop: true }));
  for (const t of [...tries]) tries.push(...gernLast(t));
  // Where it is for, at the end („Meine Freunde kommen zur Party“, „Ich möchte eine Tasche zum Geburtstag“): the answer without it.
  for (const t of [...tries]) {
    const r = t.replace(/\s+(?:zur Party|zum Fest|zum Geburtstag|zu meiner Party|zu meinem Fest|zu meinem Geburtstag)(?=\s*[.!?]*$)/i, '');
    if (r !== t) tries.push(r);
  }
  // „im" is „in dem": „Ich wohne im Irak" is the place answer „in dem Irak".
  for (const t of [...tries]) if (/\bim\b/i.test(t)) tries.push(t.replace(/\bim\b/gi, 'in dem'));
  // The family noun may stand where the pronoun stands (`nounFor`): „Meine Mutter kommt aus …" is
  // „Sie kommt aus …" with its noun, and the verb after it is graded just the same.
  // A noun typed without its umlaut („das worterbuch ist hier", „das woerterbuch") still stands for
  // the pronoun, as a typo.
  const slipped = [];
  for (const t of [...tries]) {
    const said = wordsOf(t.trim());
    for (const [pronoun, nouns] of Object.entries(turn.nounFor || {})) {
      for (const noun of nouns) {
        const n = wordsOf(noun).length;
        const head = said.slice(0, n).join(' ');
        const rest = said.slice(n).join(' ');
        if (said.length <= n) continue;
        if (fold(head) === fold(noun)) tries.push(`${pronoun} ${rest}`);
        else if (!/[äöü]/.test(fold(head)) && /[äöü]/.test(fold(noun)) && bare(head) === bare(noun)) slipped.push(`${pronoun} ${rest}`);
      }
    }
  }
  const results = tries.map((t) => (smallYes.has(t) || smallStart.has(t) ? worst(sentenceResult(turn.accepted, t, turn), RESULT.TYPO) : sentenceResult(turn.accepted, t, turn)));
  for (const t of slipped) results.push(worst(sentenceResult(turn.accepted, t, turn), RESULT.TYPO));
  for (const t of afterYes) results.push(smallYes.has(t) ? worst(frameResult('…', t, turn), RESULT.TYPO) : frameResult('…', t, turn));
  return oldSpelling ? worst(best(results), RESULT.TYPO) : best(results);
}

// The gap kinds whose word may be the learner's own.
const OWN_WORD_KINDS = new Set(['place', 'job', 'language', 'hobby', 'thing', 'object', 'activity']);
/**
 * The words of a right answer that neither course teaches nor the own-word lists name („Ich wohne in Nordenham“ →
 * „Nordenham“): the sentence was graded, the word itself was not. The check says so (`check.unchecked`), so a
 * „correct“ never claims more than was checked (the own-word policy, 2026-11-20). Names are no such word.
 */
export function uncheckedWords(turn, value) {
  return uncheckedIn(turn, slipFixed(turn, value) ?? value);
}
function uncheckedIn(turn, value) {
  // (An answer the second reader confirms names the nouns no list knows in every turn.)
  const read = turn && !turn.spell && !turn.listen && !verifiedResult(typedCore(turn, value)) ? secondReading(turn, value).unknown : [];
  const kinds = [turn?.slot, ...(turn?.accepted || []).map((a) => (typeof a === 'object' ? a.slot : null))];
  if (!kinds.some((k) => OWN_WORD_KINDS.has(k))) return read;
  const lexicon = turn.lexicon;
  const listed = new Set([...(turn.slotWords || []), ...(turn.slotIn || []), ...String(turn.partner || '').split(/\s+/)].map((w) => fold(w)));
  const words = wordsOf(spelledOut(westernDigits(value), lexicon).replace(/[.,!?;:„“”"()«»]/g, ' '));
  return [...new Set([...read, ...words.filter((w) => {
    const f = fold(w);
    if (!/\p{L}{2,}/u.test(f) || CLOSED.has(f) || isNumberWord(f) || listed.has(f) || OWN_ALL.has(f)) return false;
    return !(lexicon?.has?.(f) || lexicon?.names?.has?.(f) || COURSE_WORDS.has(asciiUmlauts(f)) || (/^\p{Lu}/u.test(w) && OWN_NOUNS.has(f)) || verbReadings(f).length || adjectiveForm(f).length || GERMAN_ADVERBS.has(f));
  })])];
}

/**
 * A spoken try counts when it was measured (never "I said it") and what was recognised is an answer.
 * The transcript is graded like a typed answer, so speech and typing take the same answers and a
 * spoken „Ich bin verheiratet" is no job; a slip of spelling does not exist in speech, so a typo
 * counts; 4 of the 5 words of „Was sind Sie von Beruf?" („Was Sie von Beruf?") is no question.
 * Without a transcript nothing is marked (DaF review, 2026-11-19): the learner records again, and
 * after two tries types instead. Only a call without a turn keeps the plain word measure.
 */
export function spokenShown(result, turn) {
  if (!result || result.selfConfirmed || typeof result.pct !== 'number') return false;
  if (!turn) return result.pct >= READALOUD_PASS_PCT;
  return typeof result.transcript === 'string' && Boolean(result.transcript.trim()) && verifiedResult(typedResult(turn, result.transcript));
}

/** What a spoken try is scored against: the answer itself; for an own answer, only its opening. */
export const spokenTarget = (turn) => (turn.ownName ? turn.accepted[0] : frameOf(turn.accepted[0]).split(GAP)[0].trim());

/**
 * How the Lektion's own answer begins, for an answer the check could not judge (BEYOND): up to its gap, else its first
 * half. The learner finishes it, so what counts as shown is still their own sentence (independent score, 2026-11-25:
 * the whole model stood there to copy).
 */
export function answerStart(turn, said = '') {
  return beyondStart(turn, said).text;
}

/**
 * What a BEYOND shows: the beginning of the Lektion's answer — or, when the learner's answer begins so already (Claude score,
 * 2026-11-25: „Ich habe Deutsch gelernt.“ was told to begin with „Ich habe …“), the frame itself with its gap and `started`,
 * so the screen says the beginning was right. A message shows its frame with the cast's name and date left open.
 */
export function beyondStart(turn, said = '') {
  if (turn.ownName) return { text: `${turn.accepted[0]} …`, started: false };
  if (turn.parts) {
    const names = [...(turn.lexicon?.names || [])].filter((n) => n.length > 2);
    let text = String(turn.example || '');
    for (const n of names) text = text.replace(new RegExp(`(?<!\\p{L})${n}(?!\\p{L})`, 'giu'), '…');
    text = text.replace(/\d{1,2}\.\s?\d{1,2}\.\s?\d{4}/g, '…').replace(/…(?:\s+…)+/g, '…').replace(/…\./g, '…');
    return { text, started: false };
  }
  const frames = (turn.accepted || []).map(frameOf).filter((f) => !/^\s*…/.test(f));
  const first = frames[0] || modelAnswer(turn);
  const gap = first.indexOf('…');
  const w = wordsOf(first.replace(/[.!?]+$/, ''));
  const text = gap > 0 ? `${first.slice(0, gap).trim()} …` : `${w.slice(0, Math.max(1, Math.ceil(w.length / 2))).join(' ')} …`;
  const bareStart = (s) => fold(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const started = Boolean(said) && bareStart(said).startsWith(bareStart(text.replace(/…/g, '')));
  if (!started) return { text, started };
  return { text: gap > 0 ? first : text, started };
}

// What a named fault tells the learner before the second try: a direction, never the answer (the founder's locked
// design: a hint and a second try come before the answer).
const FAULT_HINT = { english: 'german', german: 'german', address: 'address', article: 'article', case: 'article', ending: 'article', agreement: 'verb', auxiliary: 'verb',
  verb: 'verb', participle: 'verb', person: 'verb', tense: 'verb', order: 'order', missing: 'missing', extra: 'extra', word: 'word', kind: 'word', task: 'task', sentence: 'sentence',
  spelling: 'spelling', heard: 'heard', name: 'sentence', nonsense: 'german', answer: 'task', twice: 'verb', infinitive: 'verb' };
/** The string key of the hint for a wrong answer, or null where the check names no fault. */
export function faultHintKey(turn, value) {
  const hint = FAULT_HINT[wrongReason(turn, value)];
  return hint ? `check.fault.${hint}` : null;
}

/** The answer to show after a miss: a complete example where the answer is the learner's own. */
export const modelAnswer = (turn) => turn.example || (turn.ownName ? `${turn.accepted[0]} …` : turn.accepted[0]);

/** Per can-do (by index): true when every turn of it was shown. */
export function canDoShown(turns, outcomes, count) {
  return Array.from({ length: count }, (_, i) => turns.every((turn, j) => turn.canDo !== i || outcomes[j] === 'shown'));
}

/** The parts to repeat for the can-dos not shown, each named once (a can-do may name more than one part). */
export function partsToRepeat(repeat, shown, lang) {
  return [...new Set(shown.flatMap((ok, i) => (ok ? [] : [].concat(repeat?.[i] || []).map((p) => p?.[lang]))).filter(Boolean))];
}

/** What comes after this Lektion on the course path (curriculumPath): a checkpoint, the next Lektion or the final test. */
export function nextAfter(curriculum, lektion) {
  const checkpoint = curriculum?.checkpoints?.find((c) => c.afterLektion === lektion.nr);
  if (checkpoint) return { kind: 'checkpoint', nr: checkpoint.nr };
  if (!curriculum || curriculum.lektionen?.some((l) => l.nr === lektion.nr + 1)) return { kind: 'lektion', nr: lektion.nr + 1 };
  return { kind: 'test' };
}
