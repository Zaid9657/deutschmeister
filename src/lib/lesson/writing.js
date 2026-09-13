// Stage 6 scoring — the MECHANICAL half, client-side.
//
// AI grading on the Goethe criteria now runs server-side
// (netlify/functions/evaluate-writing.mjs, rendered by
// src/components/lesson/GradedWriting.jsx). This file is what remains true
// without it and is the honest FALLBACK whenever the grader is unavailable —
// signed out, over the free course allowance, offline: did you fill every
// field, are you inside the word range, did you touch each Leitpunkt, did you
// open and close a Mitteilung. It never claims the text is "correct" — see the
// wording in GradedWriting.jsx — because an unchecked promise of feedback is
// exactly what FernUSG forbids.

// THE ONE IMPORT, and why it is allowed: `countries.js` is a fact about the world (the stems and
// names of countries), not a rule and not a level's Wortfeld. The dependency-freedom this file
// keeps — one function, the screen and RULE 17 grading with the same code, nothing handed in from a
// curriculum — is about RULES and LEXIS; a world list has one source or it drifts, and it drifted
// (DaF review #17, Minor 17: two lists, two sizes, „aus England“ red). `tests/writing-course.test.mjs`
// pins that this stays the only import and that it never reaches into `src/data/`.
import { COUNTRY_STEMS, COUNTRY_NAMES } from './countries.js';

const words = (text) => String(text || '').trim().split(/\s+/).filter(Boolean);

export const countWords = (text) => words(text).length;

/**
 * THE FUNCTION WORDS OF THE LANGUAGE, not a hand-kept list of forty.
 *
 * DaF review #14, MAJOR 1: the old `STOPWORDS` let `bis`, `sie`, `soll` and `lena` through as
 * content words, so „Was die Kollegin **bis** dahin machen soll“ was answered by „**Bis** dann!“.
 * The review's own prescription was to read `FUNCTION_WORDS` out of the A1.1 curriculum — but this
 * file must stay dependency-free (the screen and RULE 17 grade with the SAME code, and a check
 * that imports one level's Wortfeld is wrong for every other level; `tests/writing-course.test.mjs`
 * pins it). So the list below is not a course's vocabulary: it is the CLOSED CLASSES of German —
 * articles, pronouns (personal, possessive, reflexive, demonstrative), prepositions, conjunctions,
 * question words, the finite forms of sein/haben and the modals, and the handful of particles. A
 * closed class is finite and does not grow with the course, which is the same move round 14 made
 * in `frontableOrders` (a form question, not an item list).
 *
 * TASK_VERBS is the second half and it is deliberately separate: `schreiben`, `nennen`, `sagen`
 * are the words of the INSTRUCTION („Schreiben Sie …“), never of the answer. This is RULE 20's
 * licence with the sign reversed — the task's own wording may not be evidence that the task was
 * done. Dropping them is what keeps „Warum Sie schreiben“ the undecidable Leitpunkt it is.
 */
const FUNCTION_WORDS_DE = new Set([
  // Artikel und Determinative
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'alle', 'alles', 'viel', 'viele', 'etwas',
  // Personal-, Possessiv-, Reflexiv- und Demonstrativpronomen
  'ich', 'mir', 'mich', 'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meins',
  'du', 'dir', 'dich', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deins',
  'er', 'ihn', 'ihm', 'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'sie', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres', 'es',
  'wir', 'uns', 'unser', 'unsere', 'unseren', 'unserem', 'unserer',
  'euch', 'euer', 'eure', 'euren', 'eurem', 'eurer', 'man', 'sich',
  'dies', 'diese', 'dieser', 'dieses', 'diesen', 'diesem',
  // Präpositionen
  'aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zum', 'zur', 'bis', 'für', 'gegen', 'ohne',
  'über', 'unter', 'neben', 'zwischen', 'vor', 'hinter', 'ins', 'beim', 'vom', 'auf', 'für',
  // Konjunktionen und Partikeln
  'und', 'oder', 'aber', 'denn', 'dass', 'weil', 'wenn', 'auch', 'noch', 'nur', 'schon',
  'nicht', 'sehr', 'dann', 'hier', 'ja', 'nein', 'bitte', 'danke', 'jetzt', 'mal',
  // Fragewörter
  'wann', 'wie', 'was', 'wer', 'wen', 'wem', 'wo', 'warum', 'woher', 'wohin',
  'welche', 'welcher', 'welches', 'welchen',
  // sein / haben / werden und die Modalverben, finit und infinit
  'bin', 'bist', 'ist', 'sind', 'seid', 'war', 'waren',
  'habe', 'hast', 'hat', 'haben', 'habt', 'wird', 'werden',
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'will', 'willst', 'wollen', 'wollt', 'darf', 'darfst', 'dürfen', 'dürft',
  'soll', 'sollst', 'sollen', 'sollt', 'mag', 'möchte', 'möchten',
]);

/** The verbs of the INSTRUCTION — see the header above. */
const TASK_VERBS = new Set(['schreiben', 'schreib', 'schreibt', 'nennen', 'nenne', 'nennt', 'sagen', 'sage', 'sagt']);

const isFunctionWord = (w) => {
  const t = String(w || '').toLowerCase();
  return FUNCTION_WORDS_DE.has(t) || TASK_VERBS.has(t);
};

/**
 * THE LEITPUNKT FAMILY — why this is not one keyword any more, and since DaF review #14 not one
 * alternative either.
 *
 * DaF review #13, MAJOR 1 measured the old rule (`leitpunktKeyword`: the first
 * content word of the Leitpunkt, searched as a substring) against a correct,
 * 30-word, exam-grade A1 Mitteilung that answers all three Leitpunkte of A1.1
 * Lektion 2 — „Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am
 * 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin
 * ledig. Viele Grüße, Ana Chakiri“ — and got `lp0`, `lp1` and `lp2` RED. The
 * reason is structural, not unlucky: a Leitpunkt is a REQUEST („Ihr Land und
 * Ihre Staatsangehörigkeit“) and the answer is a STATEMENT („Ich komme aus
 * Marokko“); the two almost never share a token. Round 13 answered that by
 * writing the Beispieltext around the keywords („Der Familienstand: Ich bin
 * ledig.“) — a form being read out, not a message being written, and in
 * *Start Deutsch 1* Schreiben Teil 2 that COSTS points under „Kommunikative
 * Gestaltung“.
 *
 * Round 14 fixed that and overshot: „eines von allen genügt“ turned every
 * coordinated Leitpunkt into two alternatives and every shape into a hint, and
 * DaF review #14 measured ELEVEN texts that answer nothing getting a green tick
 * („Wir sind zwei Kollegen.“ satisfied „Ihre Telefonnummer“ because the old
 * `PHONE_RE` saw the numeral `zwei`). THE INVARIANT, and it is the reason this
 * file exists: **the Formcheck may never be green on a text that omits a
 * Leitpunkt.** It is the only feedback a signed-out, offline or over-quota
 * learner gets, and a green list over a half-written Mitteilung is a false
 * statement about his work — in the exam it costs exactly the points the list
 * just promised him.
 *
 * AND THE SECOND HALF OF THE SAME SENTENCE, added in round 17 (DaF review #16, MAJOR 1): **AN
 * ANSWER FORM THAT RECOGNISES THE TOPIC OF THE QUESTION INSTEAD OF ITS VALUE IS NOT AN ANSWER
 * FORM — IT IS A KEYWORD FILTER, AND A KEYWORD FILTER WAS THE MISTAKE OF ROUND 13.** Round 16's
 * shapes accepted the bare word `geboren` as a Geburtsdatum, ANY capitalised word after `aus` as
 * a Land, and `Arabisch` as a Staatsangehörigkeit — so „Ich bin in Bremen geboren.“, „Ich komme
 * aus Bremen.“ and „Ich spreche Arabisch.“ were green on Leitpunkte they do not answer. Every
 * shape below therefore matches a VALUE OF ITS KIND: a date is a day and a month (or a month
 * name), a country is a country NAME, a nationality is never a language name, a phone number is
 * four digits, a clock is a time and not the word `Uhr`, a price is a number with Euro, an age is
 * a number of years. The field-naming alternative (`namedFieldShape`) carries the same
 * requirement: „Meine Telefonnummer ist neu.“ names the field, gives no number, and is no answer.
 *
 * So a Leitpunkt is read in three steps, all derived from the Leitpunkt itself
 * and never from a typed list of texts:
 *
 *  1. IT IS SPLIT INTO CONJUNCTS at „ und “ and at „, “. In *Start Deutsch 1* a
 *     Leitpunkt is one unit: „Ihr Land **und** Ihre Staatsangehörigkeit“ is not
 *     answered by naming the country. EVERY decidable conjunct must have
 *     evidence. „oder“ does NOT split — „ledig **oder** verheiratet“ is one
 *     conjunct with two alternatives, and the Leitpunkt supplies its own
 *     answers there.
 *  2. EACH CONJUNCT DERIVES ITS ANSWER SHAPE, and WHERE A SHAPE EXISTS THE
 *     SHAPE IS REQUIRED — a date for „Geburtsdatum“, a nationality adjective for
 *     „Staatsangehörigkeit“, four digits or four number words for
 *     „Telefonnummer“, a clock time for „Uhrzeit“, a weekday for „Tag“, a price
 *     for „kostet“, a question mark for „Frage“, a time for any „Wann …“
 *     (ANSWER_SHAPES / QUESTION_SHAPES below). Naming the head noun again is not
 *     answering it: „Wir treffen Ana auf dem Flohmarkt.“ does not say WANN.
 *  3. WHERE NO SHAPE EXISTS the conjunct's own content words decide, folded
 *     rather than matched as substrings — „Was Sie brauchen“ is answered by „Ich
 *     brauche …“. In an INDIRECT QUESTION („Was die Gäste mitbringen sollen“)
 *     only the lower-case words count: the capitalised nouns are the TOPIC the
 *     task hands the learner, not the answer, which is why „Ich lade meine Gäste
 *     ein.“ does not satisfy it and „Die Gäste bringen Kuchen mit.“ does.
 *
 * ONE function, no lexicon argument, ON PURPOSE: `GradedWriting.jsx` and RULE 17
 * in `scripts/validate-curriculum.mjs` call this same code, and a check that
 * needed a Wortfeld handed to it could be green on the screen and red in the
 * validator. Everything it needs is in the Leitpunkt. (Whether the course has
 * TAUGHT the words an answer needs is the opposite question and it has its own
 * rule — RULE 21, `writingTasksAreAnswerable`.)
 *
 * A conjunct from which NEITHER a content word NOR a shape can be derived is
 * UNDECIDABLE, not failed: „Warum Sie schreiben“ is every A1.1 Mitteilung's
 * first point and every token of it is a function word or a task verb. Those
 * rows are marked `ai: true` and say „prüft die KI“ — they are never silently
 * dropped (the learner saw three Leitpunkte and a list of two) and never green.
 */

/** The inflection endings a German content word can carry, longest first. */
const ENDINGS = ['est', 'en', 'er', 'es', 'em', 'st', 'et', 'e', 'n', 's', 't'];

/**
 * A word reduced to the form two inflections of it share: `kaufen`/`kaufe`
 * → `kauf`, `heiße`/`heißt` → `heiß`, `Gäste`/`Gast`… no, umlauts are NOT
 * resolved here — this is a suffix fold, and it is applied to BOTH sides, so it
 * can only ever be too strict, never too generous about a stem it cannot see.
 * An ending is only stripped when at least three letters are left, which is what
 * keeps `neun` (→ `neun`) apart from `neue` (→ `neu`).
 */
export function foldWord(word) {
  const w = String(word || '').replace(/[^A-Za-zÄÖÜäöüßẞ]/g, '').toLowerCase();
  for (const end of ENDINGS) {
    if (w.length - end.length >= 3 && w.endsWith(end)) return w.slice(0, -end.length);
  }
  return w;
}

/**
 * ALL content words of a Leitpunkt, in original case — not the first one, and not the nouns of an
 * indirect question (that narrowing lives in `leitpunktEvidence`, which is what scoring reads).
 * Function words are the closed classes of the language, see FUNCTION_WORDS_DE.
 */
export function leitpunktKeywords(leitpunkt) {
  const out = [];
  for (const raw of words(leitpunkt)) {
    const w = raw.replace(/[.,!?;:()"„“]/g, '');
    if (w.length > 2 && !isFunctionWord(w)) out.push(w);
  }
  return out;
}

/**
 * BACK-COMPATIBLE: the single keyword the old rule derived. Kept because it is
 * the honest one-word summary of a Leitpunkt and the tests pin it; scoring no
 * longer uses it.
 */
export function leitpunktKeyword(leitpunkt) {
  return leitpunktKeywords(leitpunkt)[0] || '';
}

/**
 * The separable prefixes — the closed class `src/data/curricula/constructions.js`
 * also keeps. A Leitpunkt names such a verb whole („Was die Gäste **mitbringen**
 * sollen“) and the answer splits it („Bringt ihr Kuchen **mit**?“), so the stem
 * counts as the same word. Only on a lower-case keyword: German nouns are
 * capitalised, and `Vorname` must not be read as `vor` + `Name`.
 */
const SEPARABLE_PREFIXES = ['zurück', 'nach', 'auf', 'aus', 'ein', 'mit', 'vor', 'weg', 'los', 'her', 'hin', 'an', 'ab', 'zu'];
const splitVerbStem = (word) => {
  const w = String(word || '');
  if (!/^[a-zäöüß]/.test(w)) return [];
  for (const p of SEPARABLE_PREFIXES) {
    if (w.toLowerCase().startsWith(p) && w.length - p.length >= 4) return [foldWord(w.slice(p.length))];
  }
  return [];
};

/**
 * A SENTENCE, for the shapes that need one. „geboren“ is a date only NEXT TO a number, and
 * „Arabisch“ is a language only next to „sprechen“ — both are sentence-local facts, so the shapes
 * below read sentences rather than the whole Mitteilung. The split deliberately does NOT break at
 * a full stop that follows a digit: „am 3. Mai“ and „3.5.1998.“ are one date, not three sentences.
 */
const sentences = (text) => String(text || '')
  .split(/(?<![0-9])[.!?]+\s+|\n+/)
  .map((s) => s.trim())
  .filter(Boolean);

const stripPunct = (w) => String(w || '').replace(/[.,!?;:()"„“»«]/g, '');

/** The number words the course writes out, 0–20 plus the round tens — used by the value shapes. */
const NUMBER_WORD = '(?:null|ein[sm]?|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf'
  + '|zwölf|zwoelf|dreizehn|vierzehn|fünfzehn|fuenfzehn|sechzehn|siebzehn|achtzehn|neunzehn'
  + '|zwanzig|dreißig|dreissig|vierzig|fünfzig|fuenfzig|sechzig|siebzig|achtzig|neunzig|hundert)';

const MONTH = 'Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember';

/**
 * A DATE IS A VALUE, NOT THE WORD `geboren` (DaF review #16, MAJOR 1).
 *
 * Round 16 wrote `|\bgeboren\b|\bGeburtstag\b` into `DATE_RE`, and with it „Ich heiße Ana. Ich bin
 * in Bremen geboren.“, „Ich habe Geburtstag.“ and „Meine Mutter ist auch geboren.“ all answered
 * „Ihr Name und Ihr Geburtsdatum“ — three green ticks over a text with no date in it. Worse, it
 * made RULE 21 green on a course that teaches no date form at all: adding the single Wortfeld line
 * `geboren` was enough. A date is now day + month (digits or a month name), or a month name, or a
 * full digit date; the birth words count only WITH a number or a month IN THE SAME SENTENCE.
 */
const DATE_VALUE_RE = new RegExp(
  `\\b\\d{1,2}\\.\\s*(?:\\d{1,2}\\.?|${MONTH})|\\b\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}\\b|\\b(?:${MONTH})\\b`,
  'i',
);
const BIRTH_WORD_RE = /\b(?:geboren|Geburtstag|Geburtsdatum)\b/i;
const DATE_COMPANION_RE = new RegExp(`\\d|\\b(?:${MONTH})\\b`, 'i');
/**
 * A CLAUSE, for „beside“ (DaF review #17, Minor 12). „Ich bin in Bremen geboren **und habe 2
 * Kinder**.“ carries a birth word and a number in one sentence and no birth date at all; round 17
 * read the sentence and called it green. The number has to stand BESIDE the birth word, which in
 * a written sentence means the same clause: no comma, semicolon or coordinating conjunction between
 * them. The split is on the closed class of coordinators, not on any word list.
 */
const clauses = (sentence) => String(sentence || '')
  .split(/\s*[,;]\s*|\s+(?:und|oder|aber|denn)\s+/i)
  .map((c) => c.trim())
  .filter(Boolean);
const DATE_SHAPE = {
  test: (body) => sentences(body).some(
    (s) => DATE_VALUE_RE.test(s)
      || clauses(s).some((c) => BIRTH_WORD_RE.test(c) && DATE_COMPANION_RE.test(c)),
  ),
};

/** An AGE is a number of years, and it is NOT a date — „Ihr Alter“ and „Ihr Geburtsdatum“ differ. */
const AGE_RE = new RegExp(
  `\\b(?:\\d{1,3}|${NUMBER_WORD})\\s*Jahre?\\s*alt\\b|\\b(?:bin|ist|sind|wird)\\s+(?:\\d{1,3}|${NUMBER_WORD})\\b`,
  'i',
);

/** A CLOCK TIME is a time, never the bare word `Uhr` („Die Uhr ist kaputt.“ says no Uhrzeit). */
const CLOCK_RE = new RegExp(
  `\\b(?:\\d{1,2}(?:[.:]\\d{2})?|${NUMBER_WORD})\\s*Uhr\\b|\\b\\d{1,2}:\\d{2}\\b`
  + `|\\bhalb\\s+(?:\\d{1,2}|${NUMBER_WORD})\\b|\\bViertel\\s+(?:nach|vor)\\b`
  + `|\\bum\\s+(?:\\d{1,2}|${NUMBER_WORD}|halb)\\b`,
  'i',
);
const DAY_RE = /\b(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag|heute|morgen|übermorgen|Wochenende)\b/i;
/** A PRICE is a number with Euro — „Das kostet Euro.“ is not a price. */
const PRICE_RE = new RegExp(`\\b(?:\\d+(?:[.,]\\d{1,2})?|${NUMBER_WORD})\\s*(?:Euro|€)|€\\s*\\d`, 'i');

/**
 * A COUNTRY IS A COUNTRY NAME, NOT ANY CAPITALISED WORD AFTER `aus` (DaF review #16, MAJOR 1).
 *
 * Round 16's `COUNTRY_RE` was `…aus\s+(?:de[rmn]\s+)?[A-ZÄÖÜ]…`, so „Ich komme aus Bremen.“
 * answered „Ihr Land“ — a city, a street, a friend's name, anything capitalised. The check the
 * review asked for was already in this file: `COUNTRY_STEMS`, folded against the lower-cased name.
 * Three ways in, all structural: the stem is the start of the name (`türk` → Türkei, `pol` → Polen,
 * `deutsch` → Deutschland), the name is the start of the stem (`Korea` → `korean`, `Vietnam` →
 * `vietnames`), or the two share five letters (`Marokko`/`marokkan`, `Mexiko`/`mexikan`,
 * `Venezuela`/`venezolan`, `England`/`engländ`). Five letters is what keeps `Bremen` (`br` with
 * `brasilian`), `Berlin`, `Bonn`, `Köln` and `Frankfurt` (`fran`, four, with `franzos`) out.
 * COUNTRY_NAMES is the small remainder whose German name shares no stem with its nationality — the
 * same kind of list as COUNTRY_STEMS: it belongs to the world, not to A1.1, and since round 18 both
 * live in `./countries.js`, the ONE source the validator reads too (DaF review #17, Minor 17).
 */
const COUNTRY_NAME_SET = new Set(COUNTRY_NAMES.map((n) => n.toLowerCase()));
const COUNTRY_STEM_SET = new Set(COUNTRY_STEMS);

const sharedPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
};

const isCountryName = (raw) => {
  const n = String(raw || '').toLowerCase().replace(/[^a-zäöüß-]/g, '');
  if (n.length < 3) return false;
  if (COUNTRY_NAME_SET.has(n)) return true;
  for (const stem of COUNTRY_STEM_SET) {
    if (n.startsWith(stem) || stem.startsWith(n)) return true;
    if (sharedPrefix(n, stem) >= 5) return true;
  }
  return false;
};

/**
 * „aus Marokko“, „aus der Türkei“, „aus dem Iran“ — the article is part of the country name for
 * exactly the countries a German course's learners come from (die Türkei, der Irak, die Ukraine,
 * die Schweiz), so an optional `der`/`dem`/`den` stands between `aus` and the name. What round 17
 * adds is the only thing that made it a shape rather than a keyword: the name must BE a country.
 */
const AUS_LAND_RE = /\baus\s+(?:de[rmn]\s+)?([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)/g;
const COUNTRY_SHAPE = {
  test: (body) => {
    const text = String(body || '');
    AUS_LAND_RE.lastIndex = 0;
    for (let m = AUS_LAND_RE.exec(text); m; m = AUS_LAND_RE.exec(text)) {
      if (isCountryName(m[1])) return true;
    }
    return false;
  },
};

/**
 * A NATIONALITY, which „Ihre Staatsangehörigkeit“ asks for and a country name does not supply.
 *
 * ROUND 16 (DaF review #15, MAJOR 2): the old `NATIONALITY_RE` claimed to be a closed class and was
 * a SAMPLE. Measured over 50 common nationality forms it recognised 18 — essentially the forms of
 * the course's own persona — and missed `türkisch`, `polnisch`, `russisch`, `syrisch`, `arabisch`,
 * `spanisch`, `indisch`, `iranisch` (the `{5,}` threshold: `türk` has four letters) and every bare
 * `-in`/`-e`/`-er` noun: `Türkin`, `Türke`, `Polin`, `Pole`, `Russin`, `Syrerin`, `Italienerin`,
 * `Ukrainerin`, `Inderin`, `Griechin`, `Afghanin`, `Rumänin`. The task asks for the learner's OWN
 * data, so that is not an edge: it is every learner who is not Ana, on the one surface she sees
 * when the AI grader is unavailable. **A form that only recognises the answer of the course's own
 * character is not a form, it is a name.**
 *
 * So the class is read structurally, in the two shapes German has, and the review's own
 * prescription is followed on both:
 *
 *  1. THE ADJECTIVE is `<stem>isch` with NO minimum stem length, read in the PREDICATIVE POSITION
 *     — after a finite form of `sein`. That position is what used to be done by the length
 *     threshold (`frisch`, `typisch`): the shape is only ever asked of the Staatsangehörigkeit
 *     conjunct, and „Ich bin türkisch.“ is the sentence that belongs there. A `-isch` word whose
 *     stem is a KNOWN country stem counts anywhere („Nationalität: türkisch“).
 *  2. THE NOUN is a capitalised word whose stem, after one of the nationality suffixes
 *     (`-ier(in)`, `-erin`, `-er`, `-in`, `-e`), is a COUNTRY STEM. That is what keeps the
 *     profession family out without a list of professions: `Studentin` → `student`,
 *     `Lehrerin` → `lehr`, `Verkäuferin` → `verkäuf`, `Kellner` → `kelln` — none of them a country.
 *     „Ich bin Studentin in Bremen.“ must NOT answer „Ihre Staatsangehörigkeit“, and it does not.
 *  3. `deutsch`/`Deutsche(r)` is the irregular one (an adjective used as a noun) and is named.
 *
 * COUNTRY_STEMS is the second typed list this file reads after FUNCTION_WORDS_DE, and it is the same
 * kind of list: it belongs to the WORLD, not to this course — the countries of origin an adult
 * integration course actually has in the room — so it does not grow with the material. The review
 * asked for it in exactly these words („eine Liste, ja, aber eine, die zur Welt gehört und nicht zu
 * diesem Material“). It lives in `./countries.js` (shape documented there) so that this file and
 * `scripts/validate-curriculum.mjs` read the same world.
 */

/** The suffixes a German nationality NOUN is built with, longest first. */
const NATIONALITY_NOUN_SUFFIXES = ['ierin', 'erin', 'ier', 'isch', 'er', 'in', 'e'];

/** A word (any case) whose stem, after one nationality suffix, is a country stem. */
const isNationalityWord = (word) => {
  const w = String(word || '').toLowerCase();
  if (!w) return false;
  for (const suf of NATIONALITY_NOUN_SUFFIXES) {
    if (!w.endsWith(suf) || w.length - suf.length < 2) continue;
    if (COUNTRY_STEM_SET.has(w.slice(0, -suf.length))) return true;
  }
  return false;
};

/**
 * `deutsch`, `deutsche`, `Deutscher`, `Deutschen` — the one nationality German declines as an
 * adjective. The bare CAPITALISED `Deutsch` is the language („Deutsch ist schwer.“) and counts only in
 * the predicative position („Ich bin Deutsch.“ — wrong case, right answer); lower-case `deutsch`
 * („Nationalität: deutsch“) and every declined form („Deutsche“, „Deutscher“) are the nationality.
 */
const DEUTSCH_RE = /\bdeutsche[rnms]?\b|(?<![A-Za-zÄÖÜäöüß])deutsch\b|\b(?:bin|bist|ist|sind|seid|war|warst|waren)\s+Deutsch\b/;
/** The predicative position: „Ich **bin** türkisch.“, „Meine Staatsangehörigkeit **ist** polnisch.“ */
const PREDICATIVE_ISCH_RE = /\b(?:bin|bist|ist|sind|seid|war|warst|waren)\s+[A-Za-zÄÖÜäöüß]{2,}isch(?:e[rnms]?)?\b/i;

/**
 * A LANGUAGE IS NOT A NATIONALITY (DaF review #16, MAJOR 1). „Ich spreche Arabisch.“ and „Meine
 * Sprache ist Arabisch.“ answered „Ihre Staatsangehörigkeit“ in round 16 — and „Ich spreche
 * Arabisch und Deutsch.“ is the sentence EVERY learner of this course writes into her
 * introduction, so it is the rule and not the edge. German spells the two identically; what tells
 * them apart is case and context: the language is the CAPITALISED noun („Arabisch“, „Deutsch“),
 * the nationality adjective is lower case after `sein` („Ich bin arabisch.“), and the noun
 * („Marokkanerin“) is neither. So a capitalised `-isch` word (and capitalised `Deutsch`) is
 * discarded in a sentence that also carries a language marker — `sprechen`, `Sprache`,
 * `Muttersprache`, `lernen`. Everything else in that sentence still counts: „Ich spreche Arabisch
 * und bin Marokkanerin.“ answers the Leitpunkt, and so does a second sentence that names the
 * nationality.
 *
 * ROUND 18 (DaF review #17, MAJOR 1): the marker had `\b` before `sprach`, so `Muttersprache` — a
 * compound, no word boundary inside it — was NOT a marker, and `lernen` was not one at all. Measured:
 * 37 of 162 language sentences green on „Ihre Staatsangehörigkeit“, all in „Meine Muttersprache ist
 * …“ and „Ich lerne …“, and „Ich lerne Deutsch.“ is the second sentence every learner of this course
 * writes. `sprach` is now matched INSIDE a word and `lern\w*` is a marker: what a person speaks,
 * has as a (mother) tongue or learns is a language.
 */
const LANGUAGE_CONTEXT_RE = /\bsprech\w*|sprach\w*|\blern\w*/i;
const LANGUAGE_NAME_RE = /^(?:[A-ZÄÖÜ][a-zäöüß]*isch|Deutsch)$/;

/**
 * Does `body` name a nationality? Structural, never a name — see the header above.
 * Shape objects in ANSWER_SHAPES only need `.test`, so this is one of them.
 */
const NATIONALITY_SHAPE = {
  test: (body) => sentences(body).some((sentence) => {
    const toks = words(sentence).map(stripPunct).filter(Boolean);
    const usable = LANGUAGE_CONTEXT_RE.test(sentence)
      ? toks.filter((t) => !LANGUAGE_NAME_RE.test(t))
      : toks;
    const rest = usable.join(' ');
    if (DEUTSCH_RE.test(rest) || PREDICATIVE_ISCH_RE.test(rest)) return true;
    return usable.some(isNationalityWord);
  }),
};

/**
 * A PHONE NUMBER, and the shape is bound to the question rather than to the text. Round 14's
 * `PHONE_RE` accepted ONE numeral, so „Wir sind zwei Kollegen.“ and „Ich bin um neun Uhr im Büro.“
 * both satisfied „Ihre Telefonnummer“ (DaF review #14, MAJOR 1, probes 3 and 4). A number is four
 * digits or four number words IN SEQUENCE — the shortest number the course itself writes is
 * „null eins sieben sechs“ (A1.1 L2 dialogue).
 */
const PHONE_DIGIT_WORD = '(?:null|eins|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn)';
const PHONE_RE = new RegExp(`(?:\\d[\\s/-]*){4,}|(?:${PHONE_DIGIT_WORD}[\\s/-]+){3,}${PHONE_DIGIT_WORD}`, 'i');

/**
 * The answer shapes, keyed by the FOLDED head word of the Leitpunkt. Each row
 * reads „when the Leitpunkt asks for X, ONLY a text that carries this shape has
 * answered it“ — the obvious realisation, not a synonym list of one course.
 * Where a conjunct derives a shape the shape is REQUIRED (see the header, step 2).
 */
const anyOf = (...shapes) => ({ test: (body) => shapes.some((sh) => sh.test(body)) });

/** A DAY is a weekday or a date. */
const DAY_OR_DATE_SHAPE = anyOf(DAY_RE, DATE_SHAPE);

const ANSWER_SHAPES = [
  // `value` is what the FIELD-NAMING alternative must carry („Der Name ist Ana Ruiz.“) — by default
  // the shape itself, so that naming a field without filling it in with a value of the right kind
  // („Meine Telefonnummer ist neu.“) is not an answer either. See namedFieldShape below.
  {
    on: ['nam', 'vornam', 'nachnam', 'familiennam'],
    re: /\b(?:hei(?:ß|ss)\w*|nenn\w*)\b|\bich\s+bin\s+[A-ZÄÖÜ]/,
    value: /[A-ZÄÖÜ][a-zäöüß]/,
  },
  { on: ['geburtsdatum', 'geburtstag', 'datum'], re: DATE_SHAPE },
  { on: ['alt', 'alter'], re: AGE_RE, value: new RegExp(`\\d|${NUMBER_WORD}`, 'i') },
  { on: ['land', 'geburtsland', 'herkunft'], re: COUNTRY_SHAPE, value: { test: isCountryName } },
  { on: ['staatsangehörigkei', 'staatsangehoerigkei', 'nationalitä', 'nationalitae'], re: NATIONALITY_SHAPE },
  { on: ['familienstand'], re: /\b(?:ledig|verheiratet|geschieden)\b/i },
  { on: ['uhrzei', 'zeit', 'termin'], re: CLOCK_RE },
  { on: ['tag', 'wochentag'], re: DAY_OR_DATE_SHAPE },
  { on: ['preis', 'kost', 'geld'], re: PRICE_RE },
  { on: ['telefonnumm', 'numm', 'handynumm'], re: PHONE_RE },
  { on: ['frag'], re: /\?/ },
];

/**
 * The shapes a QUESTION WORD in the Leitpunkt asks for, read off the whole
 * conjunct rather than off a content word — „Wann Sie kommen“ is answered by
 * „Ich bin erst um zehn Uhr da.“, which shares no token with it at all, and
 * `wann` is (rightly) a function word for the word half. „Warum“ deliberately
 * has no row: a reason is not a form, and that is what makes „Warum Sie
 * schreiben“ the undecidable Leitpunkt the KI has to grade.
 */
const QUESTION_SHAPES = [
  { on: /\bwann\b/i, re: new RegExp(`${CLOCK_RE.source}|${DAY_RE.source}`, 'i') },
  // ROUND 16 (DaF review #15, MAJOR 2, „Zweitens“): „Warum“ is UNDECIDABLE, and that is a row of
  // its own rather than a missing row. Without it the word half decided the conjunct, and in an
  // indirect question the only lower-case word of „Warum Sie feiern“ is the TASK's verb — so
  // „Wir feiern.“ (the empty echo) was green and „Ich habe Geburtstag.“ (the reason) was red. In a
  // „Wann …“ the answer has a form; in a „Warum …“ it has none, and a reason is not a form.
  { on: /\bwarum\b/i, re: null },
];

/**
 * THE FIELD NAMED AND FILLED — „Mein **Name ist** Ana Ruiz.“, „Die **Telefonnummer ist** null eins
 * sieben sechs.“ A learner may answer a Leitpunkt by naming its field and giving it a value, and
 * that is a real answer even where the shape misses it (a Spanish name is not matched by
 * `heiße`). It is NOT the bare noun: the noun must be followed by `ist`/`sind`/`:` AND by at least
 * one word that is not a function word, so „Die Telefonnummer ist hier.“ still fails.
 *
 * THE NAMED FIELD IS AN ANSWER OF THE LEARNER AND NEVER AN ANSWER OF THE COURSE — what a model
 * text demonstrates has to be a Mitteilung. Callers that measure the COURSE (RULE 21 in
 * scripts/validate-curriculum.mjs) pass `{ allowNamedField: false }`; the learner's screen does
 * not. And the sister rule for the class above it: AN ANSWER FORM THAT ONLY RECOGNISES THE ANSWER
 * OF THE COURSE'S OWN CHARACTER IS NOT A FORM, IT IS A NAME (DaF review #15, MAJOR 1 and MAJOR 2).
 */
const namedFieldShape = (word, valueShape) => {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\s*(?:ist|sind|:)\\s+([^.,!?;]+)`, 'gi');
  return {
    test: (body) => {
      const text = String(body || '');
      re.lastIndex = 0;
      for (let m = re.exec(text); m; m = re.exec(text)) {
        const value = m[1];
        const filled = words(value).some((w) => w.length > 1 && !isFunctionWord(stripPunct(w)));
        // ROUND 17 (DaF review #16, MAJOR 1): naming the field is not enough, and neither is any
        // content word after it — the VALUE has to be of the field's kind. „Meine Telefonnummer ist
        // neu.“ and „Mein Geburtsdatum: …“ name the topic and answer nothing.
        if (filled && (!valueShape || valueShape.test(value))) return true;
      }
      return false;
    },
  };
};

/** An indirect question („Was die Gäste mitbringen sollen“) — see the header, step 3. */
const INDIRECT_QUESTION_RE = /^(?:was|wer|wen|wem|wann|wo|wie|warum|woher|wohin|welche[rnms]?)\b/i;

/**
 * AN AUFTRAG IS A SENTENCE TYPE, NOT A VERB ECHO (DaF review #17, MAJOR 1).
 *
 * „Was die Kollegin bis dahin **machen soll**“, „Was die Gäste **mitbringen sollen**“: an indirect
 * question closed by a modal asks the learner to give the addressee an INSTRUCTION. Round 17 decided
 * it by the predicate — the folded `mach`/`mitbring` had to occur in the text — and the reviewer
 * measured the consequence on L10: ten of twelve correct Aufträge red („Bitte rufen Sie Herrn Weber
 * an.“, „Bitte warten Sie im Büro.“) and four echoes without any Auftrag green („Das macht nichts.“,
 * „Wir machen eine Pause.“). `machen` is the emptiest verb in the language; an instruction is not
 * made of it. What every Auftrag shares is not a word but a SENTENCE TYPE, and German marks the three
 * it has on the surface:
 *
 *  1. THE IMPERATIVE / VERB-FIRST SENTENCE — the finite verb stands first and the addressee follows:
 *     „Rufen Sie Herrn Weber an.“, „Bring bitte einen Salat mit.“, „Bringt ihr Kuchen mit?“. Read as:
 *     first token carries a verb ending and is not a function word, second token is an addressee
 *     pronoun (`Sie`, `du`, `ihr`) or `bitte`, and the sentence carries at least one content word
 *     beyond the verb — „Kommst du?“ asks for presence, not for a thing; „Hast du Zeit?“ starts with a
 *     function word and is no instruction.
 *  2. THE `bitte` SENTENCE — „Bitte Kuchen und Musik mitbringen.“, „Kuchen und Salat, bitte!“: the
 *     request particle with at least one content word to request.
 *  3. THE MODAL CHUNK — `soll|sollen|muss|müssen|kann|können|darf|dürfen` (any finite form) plus an
 *     infinitive later in the sentence: „Ihr könnt Getränke mitbringen.“, „Sie sollen im Büro
 *     warten.“ A modal beside `ich`/`wir` is the writer's own plan („Ich muss arbeiten.“), not an
 *     instruction, and is excluded.
 *
 * The Leitpunkt's own verb no longer decides anything: a text that echoes it without instructing
 * (declarative subject-first „Das macht nichts.“, „Ich mache das später.“; the question „Was machen
 * Sie heute?“) is red, and a text that instructs with any verb at all is green. The predicate is
 * kept in `words`/`folded` for the readers that measure the COURSE (RULE 21's untaught-head check),
 * never for scoring — where a shape exists the shape decides (header, step 2).
 */
const AUFTRAG_MODAL_RE = /\b(?:soll|sollst|sollen|sollt|muss|musst|müssen|müsst|kann|kannst|können|könnt|darf|darfst|dürfen|dürft)\b/i;
const ADDRESSEE_RE = /^(?:sie|du|ihr|bitte)$/i;
const VERB_ENDING_RE = /(?:en|st|t|e)$/i;
const INFINITIVE_RE = /^[a-zäöüß]+(?:en|ern|eln)$/;
const isContentWord = (t) => t.length > 1 && !isFunctionWord(t) && !/^\d+$/.test(t);

const isInstructionSentence = (sentence) => {
  const toks = words(sentence).map(stripPunct).filter(Boolean);
  if (toks.length < 2) return false;
  const content = toks.filter(isContentWord);
  const [first, second] = toks;
  // 1. Verb first, addressee second, and something asked for.
  if (VERB_ENDING_RE.test(first) && !isFunctionWord(first) && !INDIRECT_QUESTION_RE.test(first)
    && ADDRESSEE_RE.test(second) && content.some((t) => t !== first)) return true;
  // 2. `bitte` with something to request.
  if (toks.some((t) => /^bitte$/i.test(t)) && content.length) return true;
  // 3. A modal that is not the writer's own, with an infinitive after it.
  for (let i = 0; i < toks.length; i += 1) {
    if (!AUFTRAG_MODAL_RE.test(toks[i])) continue;
    const beside = [toks[i - 1], toks[i + 1]].filter(Boolean).map((t) => t.toLowerCase());
    if (beside.some((t) => t === 'ich' || t === 'wir')) continue;
    if (toks.slice(i + 1).some((t) => INFINITIVE_RE.test(t) && !isFunctionWord(t))) return true;
  }
  return false;
};

const INSTRUCTION_SHAPE = { test: (body) => sentences(body).some(isInstructionSentence) };

/** An indirect question asking WHAT SOMEONE SHOULD DO — the modal is its closing word. */
const isAuftragLeitpunkt = (conjunct) => INDIRECT_QUESTION_RE.test(conjunct) && AUFTRAG_MODAL_RE.test(conjunct);

/**
 * A Leitpunkt split into its CONJUNCTS — „ und “ and „, “, never „oder“. In *Start Deutsch 1* a
 * Leitpunkt is one unit and half an answer is no answer (DaF review #14, MAJOR 1, „Erstens“).
 */
export function leitpunktConjuncts(leitpunkt) {
  return String(leitpunkt || '')
    .split(/\s+und\s+|,\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const conjunctEvidence = (conjunct, { allowNamedField = true } = {}) => {
  // A question shape with `re: null` declares the conjunct undecidable by FORM — neither its words
  // nor a shape may decide it (see QUESTION_SHAPES). The row becomes „prüft die KI“.
  if (QUESTION_SHAPES.some((s) => s.re === null && s.on.test(conjunct))) {
    return { text: conjunct, words: [], folded: [], shapes: [] };
  }
  const all = leitpunktKeywords(conjunct);
  // In an indirect question the capitalised nouns are the topic the task hands over, not the
  // answer; only the predicate decides. Elsewhere („Ihre Telefonnummer“) the noun IS the answer.
  const keywords = INDIRECT_QUESTION_RE.test(conjunct)
    ? all.filter((w) => /^[a-zäöüß]/.test(w))
    : all;
  const folded = keywords.flatMap((w) => [foldWord(w), ...splitVerbStem(w)]).filter(Boolean);
  const shapes = [];
  for (const w of keywords) {
    const f = [foldWord(w), ...splitVerbStem(w)];
    for (const shape of ANSWER_SHAPES) {
      if (!f.some((x) => shape.on.includes(x))) continue;
      shapes.push(shape.re);
      // THE NAMED FIELD IS THE LEARNER'S ANSWER AND NEVER THE COURSE'S. `allowNamedField` is true
      // on the screen — a learner who writes „Die Telefonnummer ist null eins sieben sechs.“ has
      // answered — and false where the COURSE is measured (RULE 21), because a rule that accepts
      // the form line is satisfied by the one sentence type *Start Deutsch 1* takes points off for,
      // and the model text then gets written to the checker (DaF review #15, MAJOR 1).
      if (allowNamedField) shapes.push(namedFieldShape(w, shape.value || shape.re));
    }
  }
  shapes.push(...QUESTION_SHAPES.filter((s) => s.re && s.on.test(conjunct)).map((s) => s.re));
  // An Auftrag is decided by sentence type, never by its verb echoed back (see INSTRUCTION_SHAPE).
  if (isAuftragLeitpunkt(conjunct)) shapes.push(INSTRUCTION_SHAPE);
  return { text: conjunct, words: keywords, folded, shapes };
};

/**
 * The evidence a Leitpunkt accepts: `{ conjuncts, words, shapes }`. A conjunct empty on both
 * counts is undecidable by form; a Leitpunkt all of whose conjuncts are undecidable is the
 * „prüft die KI“ row — see the header. The flat `words`/`folded`/`shapes` are the union over the
 * conjuncts and are kept because callers and tests read them.
 */
export function leitpunktEvidence(leitpunkt, opts = {}) {
  const conjuncts = leitpunktConjuncts(leitpunkt).map((c) => conjunctEvidence(c, opts));
  return {
    conjuncts,
    words: conjuncts.flatMap((c) => c.words),
    folded: conjuncts.flatMap((c) => c.folded),
    shapes: conjuncts.flatMap((c) => c.shapes),
  };
}

/**
 * Did `text` answer `leitpunkt`? `null` when the Leitpunkt is undecidable by
 * form — the caller renders that row as „prüft die KI“, never as green or red.
 * EVERY decidable conjunct must have evidence, and where a conjunct derives a
 * shape the shape is what decides it.
 */
export function leitpunktSatisfied(leitpunkt, text, opts = {}) {
  const { conjuncts } = leitpunktEvidence(leitpunkt, opts);
  const decidable = conjuncts.filter((c) => c.folded.length || c.shapes.length);
  if (!decidable.length) return null;
  const body = String(text || '');
  const inText = new Set(words(body).map(foldWord).filter(Boolean));
  const met = (c) => (c.shapes.length
    ? c.shapes.some((re) => re.test(body))
    : c.folded.some((f) => inText.has(f)));
  return decidable.every(met);
}

/**
 * A filled-in Formular as the one text the grader receives: one "Feld: Wert"
 * line per field, which is exactly the shape the Formular tasks in the bank ask
 * for ("Schreib zu jedem Feld eine Zeile"). Empty fields are kept, so a missing
 * answer is visible to the grader rather than silently dropped.
 */
export function formularText(fields = [], values = {}) {
  return (fields || [])
    .map((field) => `${field}: ${String(values?.[field] ?? '').trim()}`)
    .join('\n');
}

const ANREDE = /\b(hallo|liebe|lieber|guten\s+(tag|morgen|abend)|sehr\s+geehrte)/i;
const GRUSS = /\b(tschüss|tschuess|viele\s+grüße|viele\s+gruesse|liebe\s+grüße|liebe\s+gruesse|bis\s+bald|mit\s+freundlichen\s+grüßen|grüße|gruesse)/i;

/**
 * scoreWriting(schreiben, value) → { ok, checks: [{ key, label, ok }], count }
 * `value` is a string for a Mitteilung, or a { field: text } map for a Formular.
 */
export function scoreWriting(schreiben, value) {
  if (!schreiben) return { ok: false, checks: [], count: 0 };

  if (schreiben.kind === 'formular') {
    const map = value && typeof value === 'object' ? value : {};
    const checks = (schreiben.fields || []).map((field) => ({
      key: field,
      label: field,
      ok: String(map[field] || '').trim().length > 0,
    }));
    return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, count: checks.length };
  }

  const text = String(value || '');
  const count = countWords(text);
  const min = Number(schreiben.minWords) || 0;
  const max = Number(schreiben.maxWords) || Infinity;

  const checks = [
    { key: 'length', label: `${min}–${Number.isFinite(max) ? max : '∞'} Wörter`, ok: count >= min && count <= max },
    { key: 'anrede', label: 'Anrede', ok: ANREDE.test(text) },
    { key: 'gruss', label: 'Gruß', ok: GRUSS.test(text) },
    // A Leitpunkt is satisfied by a FAMILY of forms (see the header), and one from which no form
    // can be derived at all — „Warum Sie schreiben“, every token a function word — is UNDECIDABLE.
    // Round 13 dropped those rows from the list; the task then showed three Leitpunkte and the
    // checklist two, and nobody told the learner why (DaF review #13, MAJOR 1). They are shown,
    // marked `ai`, and left out of `ok`: the KI grades them, this checklist cannot.
    ...(schreiben.leitpunkte || []).map((lp, i) => {
      const hit = leitpunktSatisfied(lp, text);
      return hit === null
        ? { key: `lp${i}`, label: lp, ok: true, ai: true }
        : { key: `lp${i}`, label: lp, ok: hit };
    }),
  ];

  return { ok: checks.every((c) => c.ok), checks, count };
}
