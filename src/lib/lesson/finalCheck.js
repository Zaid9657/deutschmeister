// A Lektion's final check (2026-11-18): one or more turns per can-do, answered aloud or typed.
// A can-do counts as shown only when every one of its turns was shown. Nothing here locks the next
// Lektion — the founder chose a recommendation over a locked path; the check only decides which
// can-dos the end screen ticks.
//
// Turn kinds (2026-11-19, made general for Lektionen 2–12):
//   accepted   fixed answers, graded by the shared checker (check.js).
//   `…`        an accepted answer with a gap is an OWN answer: the learner fills the gap with their
//              own words (a country, a job, an age). The words around the gap are graded by the shared
//              checker; the gap by its kind (`slot`), its first word (`slotIn`, `slotNot`) and what it
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
import { RESULT, checkAnswer, levenshtein, numberWordsToDigits, westernDigits } from './check.js';
import { READALOUD_PASS_PCT } from './readaloud.js';

// German letter names, so a spelled name is never sound-only (speech.js: every sound has text too).
const LETTER = { A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I', J: 'Jot', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er', S: 'Es', T: 'Te', U: 'U', V: 'Vau', W: 'We', X: 'Ix', Y: 'Ypsilon', Z: 'Zett', Ä: 'Ä', Ö: 'Ö', Ü: 'Ü', ß: 'Eszett' };
const lettersOf = (word) => Array.from(word.normalize('NFC')).map((c) => (c === 'ß' ? c : c.toLocaleUpperCase('de')));

/** The gap an own answer leaves for the learner's words. */
export const GAP = '…';
const hasGap = (answer) => String(answer).includes(GAP);

const fold = (s) => String(s || '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g, 'ss');
const wordsOf = (s) => String(s).split(/\s+/).filter(Boolean);
const END = /[.!?]+$/;

// German's closed classes: a gap made only of these names nothing („Ich wohne in und").
const CLOSED = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'mein', 'meine', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre', 'unser', 'unsere',
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
export function courseLexicon(curriculum) {
  const known = new Set();
  // Alongside the words: the cast's names (a name gap takes them), the verbs' present forms (a clause
  // after „und" starts with one) and every noun's article („den Stuhl", „die Lampe").
  known.names = new Set();
  known.verbs = new Set();
  known.genders = new Map();
  known.exact = new Set(); // the taught words as written, capitals included
  for (const l of curriculum?.lektionen || []) {
    // The cast's names are course words too: „Ich bin Ana" names no job.
    for (const line of l.dialog?.lines || []) {
      for (const token of String(line.speaker).split(/\s+/)) { known.add(fold(token)); if (!['herr', 'frau'].includes(fold(token))) known.names.add(fold(token)); }
    }
    for (const w of l.wortfeld || []) {
      for (const text of [w.de, w.word, w.plural]) for (const token of String(text || '').split(/[^\p{L}]+/u)) if (token) { known.add(fold(token)); known.exact.add(token); }
      // A word may be singular and plural at once („der Computer", „die Computer"): every reading counts.
      const gender = (k, g) => known.genders.set(k, [...new Set([...(known.genders.get(k) || []), g])]);
      if (['der', 'die', 'das'].includes(w.article) && w.word && !w.meta) {
        gender(fold(w.word), w.article);
        if (w.plural && !/^[—-]$/.test(w.plural)) gender(fold(w.plural), 'pl');
      }
      const verb = !w.article && /^[a-zäöü]+e?n$/.test(w.word || '') ? w.word.replace(/e?n$/, '') : null;
      if (verb) for (const ending of ['e', 'st', 't', 'en', 'et']) { known.add(fold(verb + ending)); known.verbs.add(fold(verb + ending)); }
    }
    // The checks' own lists of places, jobs and languages are course words too: „Lehrer Bremen" is no job.
    const lists = (x) => [x.slotWords || [], ...(x.extras || []).map((e) => e.slotWords || [])];
    for (const turn of l.guided?.check?.turns || []) {
      for (const t of [turn, ...(turn.variants || [])]) for (const list of lists(t)) for (const w of list) known.add(fold(w));
    }
  }
  return known;
}

/** The choice the learner made in a choice gap („Das ist meine Schwester" → Schwester), or null. */
export function chosenWord(turn, value) {
  if (!turn?.slotIn || typedResult(turn, value) === RESULT.WRONG) return null;
  const words = wordsOf(String(value || '').replace(/[.,!?]/g, ' ')).map(fold);
  return turn.slotIn.find((w) => words.some((x) => x === fold(w) || slip(x, fold(w)))) || null;
}

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
    const turn = check.lexicon ? { ...picked, lexicon: check.lexicon, partner: check.partner } : picked;
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
  const t = numberWordsToDigits(fold(text).replace(/\bein uhr\b/g, '1 uhr').replace(/\bum\b/g, ' '))
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
export function whenOf(text) {
  const words = fold(text).replace(/\b(nach (?:der arbeit|dem kurs|der schule|dem unterricht))\b/g, 'abend')
    .replace(/(?<!\d)[.:]|[.:](?!\d)|[,!?;]/g, ' ').split(/\s+/).filter(Boolean);
  let day = null; let part = null; let typo = false;
  const timeWords = [];
  // „am" takes a day or a part of the day, „um" a clock time (the notice of Lektion 8): „um Montag" and
  // „am zehn Uhr" name no time (first DaF review of Lektion 8, 2026-11-20).
  let prev = '';
  const dayHere = () => prev !== 'um';
  for (const w of words) {
    const base = w.replace(/s$/, '');
    const compound = base.match(/^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)(morgen|vormittag|mittag|nachmittag|abend|nacht)$/);
    if (compound) { if (!dayHere()) return null; [, day, part] = compound; prev = w; continue; }
    if (DAYS.includes(base)) { if (!dayHere()) return null; day = base; prev = w; continue; }
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
    if (WHEN_GLUE.has(w)) { prev = w; continue; }
    if (!timeWords.length && ['am', 'an'].includes(prev)) return null;
    timeWords.push(w);
    prev = w;
  }
  const time = timeWords.length ? clockOf(timeWords.join(' ')) : null;
  if (timeWords.length && time === null) return null;
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
function sameWhen(given, expected, { partial = false } = {}) {
  const e = whenOf(expected);
  if (!given || !e) return false;
  // `partial`: the day or the time alone is enough, but what is named must be the one asked about
  // („Bis Freitag!", never „Ja, am Freitag um elf" for ten; first corpus of Lektion 8, 2026-11-20).
  if (e.day !== null && given.day !== e.day && !(partial && given.day === null && given.time !== null)) return false;
  if (e.time !== null && given.time !== e.time && !(partial && given.time === null)) return false;
  const eh = halfOf24(expected);
  return !(e.time !== null && eh && given.half && given.half !== eh);
}

// Words that may follow the verb of an activity besides nouns („Ich gehe gern ins Kino", „Ich spiele
// am Wochenende zusammen Fußball").
const ACTIVITY_GLUE = new Set(['ins', 'in', 'im', 'am', 'an', 'mit', 'zusammen', 'auch', 'sehr', 'oft', 'immer', 'viel', 'meinem', 'meiner',
  'meinen', 'meine', 'mein', 'der', 'die', 'das', 'den', 'dem', 'einen', 'ein', 'eine', 'zu', 'hause', 'nach', 'jeden', 'jede', 'und', 'oder',
  'gut', 'zum', 'zur', 'vom', 'beim', 'bei', 'meistens', 'manchmal', 'abends', 'morgens', 'nachmittags']);

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
function gapResult(words, { slot = 'words', slotIn, slotNot = [], slotWords = [], lexicon, count, partner, time, when, whenPartial, only, negative }) {
  const raw = words.split(' ').filter(Boolean);
  const parts = raw.map(fold);
  const known = (w) => typeof lexicon?.has === 'function' && lexicon.has(w);
  // A word of the kind: one of the taught words that fit, or the learner's own word the course never
  // teaches. A taught word of the kind with an ending is a form of it, not an own word: „Mein Heft ist
  // rote", „Ich spreche Deutsche", „Ich bin Studenten" (blind corpus, 2026-11-20).
  const formOfTaught = (w) => /(?:e|er|es|en|em)$/.test(w) && slotWords.some((t) => [1, 2].some((n) => fold(t) === w.slice(0, -n)) && fold(t) !== w);
  const fits = (w) => /\p{L}/u.test(w) && !CLOSED.has(w) && (near(w, slotWords) || (!known(w) && !formOfTaught(w)));
  // A name after a choice („meine Mutter Fatima"): capitalised words the course does not teach.
  const name = (list) => list.every((w) => /^\p{Lu}/u.test(w) && !known(fold(w)) && !CLOSED.has(fold(w)));
  if (slotIn) {
    const rest = name(raw.slice(1)) ? null : RESULT.WRONG;
    if (rest) return rest;
    if (slotIn.map(fold).includes(parts[0])) return RESULT.CORRECT;
    return near(parts[0], slotIn) ? RESULT.TYPO : RESULT.WRONG;
  }
  if (slotNot.map(fold).includes(parts[0])) return RESULT.WRONG;
  const digits = numberWordsToDigits(words);
  if (slot === 'number') return /^\d+$/.test(digits.replace(/\s+/g, '')) ? RESULT.CORRECT : RESULT.WRONG;
  // An age with „Jahre alt" is two or more: one is „ein Jahr alt".
  if (slot === 'years') return /^\d+$/.test(digits.replace(/\s+/g, '')) && Number(digits.replace(/\s+/g, '')) >= 2 ? RESULT.CORRECT : RESULT.WRONG;
  if (slot === 'phone') return /^[+\d\s/–-]+$/.test(digits) && (digits.match(/\d/g) || []).length >= 3 ? RESULT.CORRECT : RESULT.WRONG;
  if (slot === 'date') return isDate(words) ? RESULT.CORRECT : RESULT.WRONG;
  // A clock time („Es ist halb neun", „Ich stehe um sechs Uhr auf"); with `time`, that very time. Saying
  // the time takes no „um" (the notice of Lektion 8), so „Es ist um halb neun" is wrong; a frame that
  // needs „um" has it outside the gap.
  if (slot === 'clock') {
    if (/\bum\b/i.test(words)) return RESULT.WRONG;
    const at = clockOf(words);
    if (at === null || (time && at !== clockOf(time))) return RESULT.WRONG;
    // „Zwanzig Uhr dreißig" is evening: wrong for a morning time (first DaF review of Lektion 8).
    if (time && clockHalf(words) && clockHalf(words) !== halfOf24(time)) return RESULT.WRONG;
    return RESULT.CORRECT;
  }
  // When: a day, a part of the day and/or a time („am Montag um zehn", „am Wochenende", „abends"); with
  // `when`, the day and time asked about („Hast du am Freitag um zehn Uhr Zeit?").
  if (slot === 'when') {
    const at = whenOf(words);
    if (!at || (when && !sameWhen(at, when, { partial: whenPartial }))) return RESULT.WRONG;
    return at.typo ? RESULT.TYPO : RESULT.CORRECT;
  }
  // An activity after „Ich": a verb in its ich-form (a taught verb or the learner's own, „wandere"), then
  // nouns and small words, or a second verb after „und": „Ich spiele Fußball gern", „Ich gehe ins Kino
  // gern" (the frame's „gern" moved to the end), „Ich lese und koche gern". „Ich spielen gern" is wrong.
  if (slot === 'activity') {
    const verbs = lexicon?.verbs;
    const ichForm = (w) => { const f = fold(w); return f.length >= 3 && /e$/.test(f) && !CLOSED.has(f) && (verbs?.has?.(f) || !known(f)) && !lexicon?.genders?.get?.(f); };
    if (!raw.length || !ichForm(raw[0])) return RESULT.WRONG;
    let small = false;
    for (let i = 1; i < raw.length; i += 1) {
      const f = fold(raw[i]);
      if (['und', 'oder'].includes(fold(raw[i - 1])) && ichForm(raw[i])) continue;
      if (/^\p{Lu}/u.test(raw[i]) || ACTIVITY_GLUE.has(f)) continue;
      // A noun the course teaches, written small („am wochenende"), is a typo (first corpus of Lektion 7).
      if (lexicon?.genders?.get?.(f)) { small = true; continue; }
      return RESULT.WRONG;
    }
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
    const taughtArticle = (w) => (typeof lexicon?.genders?.get === 'function' ? lexicon.genders.get(w) : undefined);
    if (['die', 'das'].includes(parts[0])) return RESULT.WRONG;
    if (DATIVE.includes(parts[0]) && near(parts[1] || '', slotWords)) {
      const g = taughtArticle(parts[1]) || [];
      if (!g.some((x) => DATIVE_OF[x] === parts[0])) return RESULT.WRONG;
    }
    if (!DATIVE.includes(parts[0]) && near(parts[0] || '', slotWords) && taughtArticle(parts[0])) return RESULT.WRONG;
    const head = parts.slice(DATIVE.includes(parts[0]) ? 1 : 0);
    const end = head.findIndex((w) => w === 'und' || w.endsWith(','));
    const place = (end < 0 ? head : head.slice(0, end + (head[end]?.endsWith(',') ? 1 : 0))).map((w) => w.replace(/,$/, ''));
    return place.length && place.every(fits) ? RESULT.CORRECT : RESULT.WRONG;
  }
  // A job: an optional article („eine Studentin", German though the course teaches it without), then
  // the job, which may be followed by where („Student in Bremen", „Lehrer von Beruf"). „Ich bin ledig"
  // and „Lehrer Bremen" name no job.
  if (slot === 'job') {
    // The article agrees with a job the course teaches: its feminine ends in -in („eine Lehrerin", „ein Lehrer").
    const taught = slotWords.find((w) => fold(w) === parts[1]);
    if (taught && ['ein', 'eine'].includes(parts[0]) && ((parts[0] === 'eine') !== /in$/.test(fold(taught)))) return RESULT.WRONG;
    const head = parts.slice(['ein', 'eine'].includes(parts[0]) ? 1 : 0);
    const end = head.findIndex((w) => ['in', 'im', 'bei', 'beim', 'an', 'am', 'und', 'aus', 'von', 'für', 'mit'].includes(w) || w.endsWith(','));
    const job = (end < 0 ? head : head.slice(0, end + (head[end]?.endsWith(',') ? 1 : 0))).map((w) => w.replace(/,$/, ''));
    // One job: „Ich bin Lehrer Student" names two.
    const listed = job.filter((w) => near(w, slotWords)).length;
    return job.length && job.every(fits) && listed <= 1 && (end < 0 || head.length > end + 1) ? RESULT.CORRECT : RESULT.WRONG;
  }
  // A second clause may follow after „und" when it opens with a verb the course teaches AND is itself
  // a valid answer of the same kind: „Ich spreche Arabisch und lerne Deutsch." — never „… und lerne
  // Studentin" (DaF review, 2026-11-19: no blanket rule; the whole answer must be valid).
  const verbs = lexicon?.verbs;
  const clause = parts.findIndex((w, i) => w === 'und' && i > 0 && typeof verbs?.has === 'function' && verbs.has(parts[i + 1] || ''));
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
      const groups = text.split(/\s*(?:,|\bund\b|\boder\b)\s*/i).map((g) => g.split(' ').map(fold).filter(Boolean)).filter((g) => g.length);
      const ok = groups.every((g) => g.some((w) => !MODIFIERS.has(w)) && g.every((w) => MODIFIERS.has(w) || ofKind(w)));
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
    if (!duForm || v.length < 4 || CLOSED.has(v) || lexicon?.genders?.get?.(v) || fold(raw[1] || '') !== 'du') return RESULT.WRONG;
    const rest = raw.slice(2); // may be empty: „Tanzt du?"
    const ok = rest.every((w) => /^\p{Lu}/u.test(w) || ACTIVITY_GLUE.has(fold(w)) || ['gern', 'gerne', 'auch'].includes(fold(w)));
    return ok ? RESULT.CORRECT : RESULT.WRONG;
  }
  // Hobbies: each a hobby the course teaches („Sport", „Musik", „Kochen") or a noun of the learner's own
  // („Yoga"), with an optional article, or a noun with its verb („Fußball spielen"); „Mein Hobby ist
  // gut" names none.
  if (slot === 'hobby') {
    const groups = own.split(/\s*(?:,|\bund\b|\boder\b)\s*/i).map((g) => g.split(' ').filter(Boolean)).filter((g) => g.length);
    const noun = (w) => near(fold(w), slotWords) || (/^\p{Lu}/u.test(w) && !known(fold(w)) && !CLOSED.has(fold(w)))
      || (/^\p{Lu}/u.test(w) && Boolean(lexicon?.genders?.get?.(fold(w))));
    const hobby = (g) => {
      const ws = g.length > 1 && ['das', 'der', 'die', 'mein', 'meine'].includes(fold(g[0])) ? g.slice(1) : g;
      if (ws.length === 1) return noun(ws[0]);
      return ws.length === 2 && noun(ws[0]) && /^\p{Ll}\p{L}*en$/u.test(ws[1]);
    };
    return groups.length && groups.every(hobby) ? RESULT.CORRECT : RESULT.WRONG;
  }
  // A name („Ich bin Omar", as Lektion 1's own check takes it): words the course does not teach, or the
  // cast's names, after an optional „Frau"/„Herr" („Hier ist Frau Chakiri"). After the first name word a
  // surname may be a word the course teaches only in lower case („Ana Braun", „Frau Braun": the colour braun); the
  // first word may not, so „Gut" or „Danke" alone is no name.
  if (slot === 'name') {
    // The partner's own name is never the learner's: „Guten Tag, Herr Weber." greets, it names nobody.
    if (partner && (fold(words) === fold(partner) || fold(words) === fold(partner.split(/\s+/).at(-1)))) return RESULT.WRONG;
    const names = lexicon?.names;
    const exact = lexicon?.exact;
    const from = ['frau', 'herr'].includes(parts[0]) && parts.length > 1 ? 1 : 0;
    const isName = (written, w, i) => /\p{L}/u.test(w) && !CLOSED.has(w)
      && (!known(w) || names?.has?.(w) || (i > 0 && /^\p{Lu}/u.test(written) && typeof exact?.has === 'function' && !exact.has(written)));
    const rest = raw.slice(from);
    return rest.length && rest.every((r, i) => isName(r, parts[from + i], from + i)) ? RESULT.CORRECT : RESULT.WRONG;
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
      : { der: ['der', 'ein', 'kein', 'mein', 'dein'], die: ['die', 'eine', 'keine', 'meine', 'deine'], das: ['das', 'ein', 'kein', 'mein', 'dein'], pl: ['die', 'keine', 'meine', 'deine'] };
    const ALL = new Set(Object.values(ARTICLE).flat());
    const items = own.split(/\s*(?:,|\bund\b|\boder\b)\s*/i).map((g) => g.split(' ').filter(Boolean)).filter((g) => g.length);
    // A noun the course never teaches is the learner's own when it is written as a noun: „Ich kaufe
    // Bananen", „eine Banane"; „Ich kaufe groß" names no thing (courses session, 2026-11-20). After an
    // article a small first letter is a typo („eine banane").
    let typo = false;
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
      // What the turn is about: never a taught thing of the other kind (`slotNot`: no „Kuchen" for a
      // drink), and with `only`, the thing offered or its measure („Ja, ein Glas, bitte" for water; never
      // „Ja, einen Kaffee, bitte"). First DaF review of Lektion 9, 2026-11-20.
      if (slotNot.some((n) => fold(n) === noun)) return null;
      if (only && !only.some((n) => fold(n) === noun) && MEASURE_GENDER[noun] === undefined) return null;
      // A polite decline names what it does not want („keinen Kuchen", „kein Kuchen"): a „kein-" article.
      if (negative && !/^kein/.test(det || '')) return null;
      if (only && /^kein/.test(det || '')) return null; // „Ich möchte kein Wasser" declines the water
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
        const fit = readings.filter((g) => adjOk(g) && (g === 'pl' ? (!det || counted || ARTICLE.pl.includes(det))
          : (det ? !counted && ARTICLE[g].includes(det) : MASS.has(noun) && !adj)));
        if (!fit.length) return null;
        return fit.every((g) => g === 'pl') ? 'many' : fit.includes('pl') ? 'either' : 'one';
      }
      if (known(noun)) return null; // a taught word that is no noun names no thing
      const genderOk = ['der', 'die', 'das', 'pl'].filter((g) => (g === 'pl' ? (!det || counted || ARTICLE.pl.includes(det)) : det && !counted && ARTICLE[g].includes(det)) && adjOk(g));
      if (!genderOk.length) return null;
      if (!/^\p{Lu}/u.test(nounRaw)) {
        if (!det) return null;
        typo = true;
      }
      return counted ? 'many' : 'either';
    };
    const read = items.map(itemReading);
    if (!items.length || read.some((r) => r === null)) return RESULT.WRONG;
    if (count === 'one' && (items.length > 1 || read[0] === 'many')) return RESULT.WRONG;
    if (count === 'many' && items.length === 1 && read[0] === 'one') return RESULT.WRONG;
    return typo ? RESULT.TYPO : RESULT.CORRECT;
  }
  const content = parts.filter((w) => /\p{L}/u.test(w) && !CLOSED.has(w));
  return content.length ? RESULT.CORRECT : RESULT.WRONG;
}

const RANK = { [RESULT.WRONG]: 0, [RESULT.TYPO]: 1, [RESULT.CORRECT]: 2 };
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
  const gap = gapResult(own.replace(/[.,!?]+$/, ''), turn);
  if (gap === RESULT.WRONG) return RESULT.WRONG;
  return worst(gap, checkAnswer(value, [[head, own, tail].filter(Boolean).join(' ')]).result);
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
    if (turn.slot === 'when') gap = gapResult(strip(`${first} ${second}`.trim()), turn);
    else gap = worst(gapResult(strip(first), turn), second ? gapResult(strip(second), turn) : RESULT.CORRECT);
    if (gap === RESULT.WRONG) continue;
    const model = [head, first, mid, second, tail].filter(Boolean).join(' ');
    return worst(gap, checkAnswer(value, [model]).result);
  }
  return RESULT.WRONG;
}

/** An accepted answer is a string, or `{ frame, slot, … }` when one frame's gap differs from the turn's. */
const frameOf = (a) => (typeof a === 'string' ? a : a.frame);

/** One sentence against the turn's answers: fixed ones through the shared checker, own ones through their frame. */
function sentenceResult(accepted, value, turn) {
  const fixed = accepted.filter((a) => typeof a === 'string' && !hasGap(a));
  return best([
    ...(fixed.length ? [checkAnswer(value, fixed, { spelling: Boolean(turn.spell) }).result] : []),
    ...accepted.filter((a) => hasGap(frameOf(a))).map((a) => frameResult(frameOf(a), value, typeof a === 'string' ? turn : { ...turn, ...a })),
  ]);
}

// A message may open with a greeting and close with a sign-off; neither is graded.
const GREETING = /^(hallo|guten (morgen|tag|abend)|sehr geehrte|liebe|lieber|viele grüße|liebe grüße|tschüss|bis morgen|danke)\b/i;

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
  const sentences = pieces
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
const ADVERBS = new Set(['jetzt', 'hier', 'auch', 'noch', 'schon', 'gern', 'gerne', 'heute', 'zusammen', 'immer', 'dort']);
const SUBJECTS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);

/**
 * The same statement in its basic order, when the learner put something else first or an adverb in
 * the middle (German keeps the verb second): „Ich wohne jetzt in Köln", „Jetzt wohne ich in Köln",
 * „Aus Syrien komme ich", „In Bremen wohne ich" are „Ich wohne in Köln" … with the same words. The
 * frame then grades the words as always, so „Aus Syrien ich komme" stays wrong.
 */
function verbSecond(text) {
  const end = (String(text).trim().match(/[.!?]+$/) || [''])[0];
  const w = wordsOf(String(text).trim().replace(/[.!?]+$/, ''));
  const out = [];
  const lower = (s) => (CLOSED.has(fold(s)) || ADVERBS.has(fold(s)) ? s.toLocaleLowerCase('de') : s);
  const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
  // An adverb after the verb: „Ich wohne jetzt in Köln" → „Ich wohne in Köln".
  if (w.length >= 4 && SUBJECTS.has(fold(w[0])) && ADVERBS.has(fold(w[2]))) out.push([...w.slice(0, 2), ...w.slice(3)].join(' ') + end);
  // An adverb in front: „Jetzt wohne ich in Köln" → „Ich wohne in Köln".
  if (w.length >= 4 && ADVERBS.has(fold(w[0])) && SUBJECTS.has(fold(w[2]))) out.push([cap(w[2]), w[1], ...w.slice(3)].join(' ') + end);
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
    if (SUBJECTS.has(fold(w[k])) && !SUBJECTS.has(fold(w[0])) && !SUBJECTS.has(fold(w[k - 1]))) {
      const front = w.slice(0, k - 1).map((x, i) => (i === 0 ? x.charAt(0).toLocaleLowerCase('de') + x.slice(1) : x));
      if (/^\p{Lu}/u.test(w[0]) && front.length) {
        const first = fold(w[0]);
        // Keep the capital of a noun in front („Fußball spiele ich gern"): only small words lose it.
        if (!CLOSED.has(first) && !ADVERBS.has(first) && !WHEN_GLUE.has(first)) front[0] = w[0];
      }
      out.push([cap(w[k]), w[k - 1], ...w.slice(k + 1), ...front].join(' ') + end);
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
  // Only a „gern" after the verb moves: „Ich gern spiele Fußball" has it before the verb and stays wrong.
  return m && wordsOf(m[1]).length >= 2 ? [`${m[1]} ${m[2]} gern${m[3]}`] : [];
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

// A price is in euros: „18,00 Euro" and „18,- €" are 18; a heard price in euros is no number of cents.
const priceDigits = (s) => numberWordsToDigits(String(s).replace(/f(?:ue|u)nf/gi, 'fünf').replace(/zw(?:oe|o)lf/gi, 'zwölf'))
  .replace(/(\d),(?:00|-)(?!\d)/g, '$1').replace(/\D/g, '');
// A greeting before the answer, also to the person by name („Guten Tag, Herr Weber. Hier ist …",
// „Hallo Herr Weber, hier ist …").
const GREETING_FIRST = /^(?:hallo|guten\s+(?:morgen|tag|abend))(?:[\s,]+(?:herr|frau)\s+\p{L}+)?\s*[!,.]\s*/iu;

/** RESULT.CORRECT, TYPO or WRONG for one typed answer. An own-name turn needs an opening and a name. */
export function typedResult(turn, value) {
  if (turn.ownName) {
    const ok = turn.accepted.some((o) => new RegExp(`^${fold(o)}\\s+\\p{L}`, 'u').test(fold(value)));
    return ok ? RESULT.CORRECT : RESULT.WRONG;
  }
  const text = westernDigits(value);
  if (turn.listen && (turn.when || turn.time)) {
    // A heard day and time („Dienstag, 9.30", „am Dienstag um halb zehn", „Di 9:30") or a heard time.
    const at = whenOf(text);
    if (turn.when) return sameWhen(at, turn.when) ? (at.typo ? RESULT.TYPO : RESULT.CORRECT) : RESULT.WRONG;
    return at && at.time !== null && at.time === clockOf(turn.time) && !(at.half && at.half !== halfOf24(turn.time)) ? RESULT.CORRECT : RESULT.WRONG;
  }
  if (turn.listen) {
    // A heard number is its digits: „Telefonnummer: 0421 3618" wrote down the right number with a label,
    // „18,00 €" the price „18 Euro" (and „funfundvierzig" without its umlaut is 45). A price heard in
    // euros is not written as cents (blind corpus, 2026-11-20).
    if (/\beuro\b/i.test(turn.listen) && /\bcent\b|\bct\b/i.test(text)) return RESULT.WRONG;
    const heard = priceDigits(turn.accepted[0]);
    if (priceDigits(text) && priceDigits(text) === heard) return RESULT.CORRECT;
    return checkAnswer(text, turn.accepted, { dictation: true }).result;
  }
  if (turn.parts) return messageResult(turn, text);
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
  const partner = escaped ? new RegExp(`^${escaped}[,!:]?\\s+`, 'i') : null;
  // The partner's name at the end, with or without a comma („was ist dein hobby lena?").
  const partnerLast = escaped ? new RegExp(`[,\\s]+${escaped}(?=\\s*[?.!]*$)`, 'i') : null;
  for (const t of [...tries]) {
    const s = t.trim();
    for (const named of [s.replace(LEAD, ''), s.replace(TRAIL, ''), s.replace(LEAD, '').replace(TRAIL, ''), partner ? s.replace(partner, '') : s, partnerLast ? s.replace(partnerLast, '') : s]) if (named && named !== s) add(named);
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
    if (rest && rest !== t.trim()) add(rest);
  }
  // A question in statement order („Du tanzt gern?") is the question („Tanzt du gern?").
  for (const t of [...tries]) {
    const q = t.trim().match(/^(du|sie)\s+(\p{L}+)\s+(.*\?)$/iu);
    if (q) add(`${q[2]} ${q[1].toLocaleLowerCase('de')} ${q[3]}`);
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
  for (const t of [...tries]) tries.push(...verbSecond(t));
  for (const t of [...tries]) tries.push(...gernLast(t));
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
  const results = tries.map((t) => sentenceResult(turn.accepted, t, turn));
  for (const t of slipped) results.push(worst(sentenceResult(turn.accepted, t, turn), RESULT.TYPO));
  return oldSpelling ? worst(best(results), RESULT.TYPO) : best(results);
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
  return typeof result.transcript === 'string' && Boolean(result.transcript.trim()) && typedResult(turn, result.transcript) !== RESULT.WRONG;
}

/** What a spoken try is scored against: the answer itself; for an own answer, only its opening. */
export const spokenTarget = (turn) => (turn.ownName ? turn.accepted[0] : frameOf(turn.accepted[0]).split(GAP)[0].trim());

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
