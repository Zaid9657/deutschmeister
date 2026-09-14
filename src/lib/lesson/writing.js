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
import { COUNTRY_STEMS, COUNTRY_NAMES, LANGUAGE_NAMES } from './countries.js';

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
  'am', 'im', 'ans', 'in', 'an', 'um', 'zu', 'ab',
  // Konjunktionen und Partikeln
  'und', 'oder', 'aber', 'denn', 'dass', 'weil', 'wenn', 'auch', 'noch', 'nur', 'schon',
  'nicht', 'sehr', 'dann', 'hier', 'ja', 'nein', 'bitte', 'danke', 'jetzt', 'mal',
  // Satz-, Zeit- und Ortsadverbien — a closed class too (round 19, DaF review #18, MAJOR 1): an
  // adverb is never the content of an answer, and a closed class stays closed. Adjectives that
  // double as adverbs (`früh`, `spät`, `schnell`) are NOT here — they are open-class words and may
  // be an answer.
  'heute', 'morgen', 'gestern', 'übermorgen', 'vorgestern', 'leider', 'bald', 'später', 'gern',
  'gerne', 'vielleicht', 'natürlich', 'deshalb', 'darum', 'also', 'dort', 'da', 'zuerst', 'danach',
  'immer', 'oft', 'manchmal', 'nie', 'wieder', 'erst', 'abends', 'morgens', 'mittags', 'nachts',
  'vormittags', 'nachmittags', 'übrigens', 'sonst', 'endlich', 'gleich',
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
 *     rather than matched as substrings and read in STATEMENTS only — „Was Sie
 *     brauchen“ is answered by „Ich brauche …“ and not by „Brauchen Sie etwas?“
 *     (round 19, `isQuestion`). In an INDIRECT QUESTION („Was Sie kaufen“) only
 *     the lower-case words count: the capitalised nouns are the TOPIC the task
 *     hands the learner, not the answer. An indirect question closed by a MODAL
 *     („Was die Gäste mitbringen sollen“) is an AUFTRAG and is UNDECIDABLE BY
 *     FORM — see the decision under QUESTION_SHAPES below: its row is „prüft die
 *     KI“, like „Warum Sie schreiben“.
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
 * A conjunct can also be DECLARED undecidable although it has words — a `re:
 * null` row in QUESTION_SHAPES does that for „Warum …“ and, since 2026-09-14,
 * for the Auftrag („Was … machen soll“); the row is then the KI's, whatever the
 * text says.
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
 * The closing mark STAYS on the sentence (round 19): a question is a sentence type, and the `?` is
 * how German writes it — `isQuestion` below reads it, the token readers strip it.
 */
const sentences = (text) => String(text || '')
  .split(/(?<=(?<![0-9])[.!?]+)\s+|\n+/)
  .map((s) => s.trim())
  .filter(Boolean);

const stripPunct = (w) => String(w || '').replace(/[.,!?;:()"„“»«]/g, '');

/**
 * A QUESTION IS NOT AN ANSWER (DaF review #18, Minor 18). „Was Sie kaufen“ ← „Kaufst du auch?“ was
 * green because the folded predicate `kauf` decides a shape-less Leitpunkt and a question carries the
 * verb as well as a statement does. A question is a sentence that closes with `?` or opens with a
 * question word; the fold half of `leitpunktSatisfied` reads only the sentences that are not one.
 */
const QUESTION_WORD_RE = /^(?:was|wer|wen|wem|wann|wo|wie|warum|woher|wohin|welche[rnms]?)$/i;
const isQuestion = (sentence) => {
  const s = String(sentence || '').trim();
  if (/\?$/.test(s)) return true;
  const first = stripPunct(words(s)[0] || '');
  return QUESTION_WORD_RE.test(first);
};

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
// `sondern` joined the coordinators in round 23 (DaF review #22, Minor 42): „Ich komme nicht um neun
// sondern um zehn Uhr“ — the learner's spelling, no comma — is two clauses, and the second is the time.
const CLAUSE_SPLIT_RE = /\s*[,;]\s*|\s+(?:und|oder|aber|denn|sondern)\s+/i;
const clauses = (sentence) => String(sentence || '')
  .split(CLAUSE_SPLIT_RE)
  .map((c) => c.trim())
  .filter(Boolean);
/**
 * …OR IN THE APPOSITION BEHIND THE COMMA (DaF review #18, Minor 21): „Ich bin geboren in Marokko,
 * 1998.“ carries the year in the NEXT clause, and that clause is nothing but the date — no verb, no
 * other content word. Learner German, and an examiner reads it as a birth date. A clause that
 * consists of a date value alone (optionally after `am`/`im`) is read together with the clause it
 * follows; „…geboren, ich habe 2 Kinder.“ still has a sentence in its second clause and stays red.
 */
const DATE_ONLY_CLAUSE_RE = new RegExp(`^(?:am|im)?\\s*(?:\\d[\\d.\\s]*|(?:${MONTH})(?:\\s+\\d{2,4})?)\\.?$`, 'i');
const DATE_SHAPE = {
  test: (body) => sentences(body).some((s) => {
    if (DATE_VALUE_RE.test(s)) return true;
    const cs = clauses(s);
    return cs.some((c, i) => BIRTH_WORD_RE.test(c)
      && (DATE_COMPANION_RE.test(c) || (i + 1 < cs.length && DATE_ONLY_CLAUSE_RE.test(cs[i + 1]))));
  }),
};

/** A NUMBER — a room, a head count, an age: digits or a number word. ONE definition, both readers. */
const NUMBER_VALUE_RE = new RegExp(`\\d|\\b${NUMBER_WORD}\\b`, 'i');

/**
 * A COLOUR is one of the basic colour words of the language — a closed class, like the number
 * words above — optionally with `hell`/`dunkel` in front. „Farbe: Wörterbuch“ is no colour.
 */
const COLOUR_RE = /\b(?:hell|dunkel)?(?:rot|blau|grün|gruen|gelb|schwarz|weiß|weiss|grau|braun|orange|rosa|lila|violett|pink|türkis|tuerkis|beige|bunt|golden|silbern)(?:e[rnms]?)?\b/i;

/** An AGE is a number of years, and it is NOT a date — „Ihr Alter“ and „Ihr Geburtsdatum“ differ. */
const AGE_RE = new RegExp(
  `\\b(?:\\d{1,3}|${NUMBER_WORD})\\s*Jahre?\\s*alt\\b|\\b(?:bin|ist|sind|wird)\\s+(?:\\d{1,3}|${NUMBER_WORD})\\b`,
  'i',
);

/** A CLOCK TIME is a time, never the bare word `Uhr` („Die Uhr ist kaputt.“ says no Uhrzeit). */
const CLOCK_RE = new RegExp(
  `\\b(?:\\d{1,2}(?:[.:]\\d{2})?|${NUMBER_WORD})\\s*Uhr\\b|\\b\\d{1,2}:\\d{2}\\b`
  + `|\\bhalb\\s+(?:\\d{1,2}|${NUMBER_WORD})\\b|\\bViertel\\s+(?:nach|vor)\\b`
  // `um` swallows the whole time it opens („um zehn Uhr“, „um halb neun“): the shapes that strip
  // times out of a sentence (`contentBeyondTime`) must not be left holding a bare `Uhr`.
  + `|\\bum\\s+(?:halb\\s+)?(?:\\d{1,2}(?:[.:]\\d{2})?|${NUMBER_WORD})(?:\\s*Uhr)?\\b|\\bum\\s+halb\\b`
  // „Ich komme gegen drei.“ — `gegen` + a number is an approximate clock time, `Uhr` or not
  // (DaF review #22, Minor 41).
  + `|\\bgegen\\s+(?:halb\\s+)?(?:\\d{1,2}(?:[.:]\\d{2})?|${NUMBER_WORD})(?:\\s*Uhr)?\\b`,
  'i',
);
/**
 * A DAY IS A WEEKDAY OR THE ADVERB, READ CASE-BLIND — AND `Morgen` AFTER `Guten` IS A GREETING
 * WHEREVER IT STANDS (DaF review #22, MAJOR 2).
 *
 * Round 22 told the NOUN `Morgen` („Guten Morgen“) from the ADVERB `morgen` by its CAPITAL, and a
 * capital is the one feature an A1 candidate does not have: „Guten **m**orgen Frau Berg, … ich komme
 * später ins Büro“ was green at „Wann Sie kommen“ (the learner's spelling of the course's first
 * Anrede, and the clause split let `morgen` into the Ich-clause), while „Ich komme **M**orgen.“, „Ich
 * bin **N**achmittags im Büro.“ and „Ich komme am **n**achmittag.“ — spelling mistakes an examiner
 * deducts under „Formale Richtigkeit“, with the Inhaltspunkt answered — were red. Four exam texts
 * without a time green, four with a time red. The standard (course-standard §Writing) asks for „a
 * weekday or time of day“, not for one spelled correctly.
 *
 * So the day words are read with `i` in every position, and two things keep „Guten Morgen“ out:
 * the ANREDE IS CUT OFF before any shape reads the body (`openingCut` below — the reviewer's second
 * option in round 21, the one that needs no spelling), and `morgen` directly after `guten` is never
 * a day, wherever it stands („Ich sage Guten Morgen, ich komme später.“). Lookarounds rather than
 * `\b`: JavaScript's `\b` is ASCII and sees no boundary before `übermorgen`.
 */
const WEEKDAY = '(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag)';
const DAY_ADVERB = '(?:heute|morgen|übermorgen|uebermorgen)';
/** The nouns a time of day is built from — after `am`, after `heute`, or fused to a weekday. */
const TIME_OF_DAY_NOUN = '(?:morgen|vormittag|mittag|nachmittag|abend|nacht)';
const DAY_RE = new RegExp(
  `(?<!\\p{L})(?<!guten\\s+)(?:${WEEKDAY}|${DAY_ADVERB}|wochenende)(?!\\p{L})`,
  'iu',
);
/** The DAY read where it stands: sentence by sentence. */
const DAY_SHAPE = { test: (body) => sentences(body).some((s) => DAY_RE.test(s)) };
/**
 * A TIME OF DAY — the answer to „Wann“ that Lektion 8 teaches (`morgens`, `nachmittags`, `abends`,
 * `der Abend`) and that the Wann shape did not know: „Ich bin nachmittags im Büro.“ was red on
 * „Wann Sie im Büro sind“ two Lektionen after the course had taught the word (DaF review #21,
 * MAJOR 2). It is read ONLY by the Wann shape, never by the Tag field: „Tag: abends“ on a form is
 * still no day. Case-blind since round 23 (`Nachmittags`, `am nachmittag` — see DAY_RE); `Morgen`
 * counts here only after `am`, `heute` or `morgen`, so „Guten Morgen“ is still an Anrede.
 */
const TIME_OF_DAY_RE = new RegExp(
  '(?<!\\p{L})(?:morgens|vormittags|mittags|nachmittags|abends|nachts'
  + `|am\\s+${TIME_OF_DAY_NOUN}|in\\s+der\\s+nacht`
  + `|${DAY_ADVERB}\\s+(?:früh|${TIME_OF_DAY_NOUN})`
  + `|${WEEKDAY}\\s*(?:früh|${TIME_OF_DAY_NOUN}))(?!\\p{L})`,
  'iu',
);
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
/** A name as the reader compares it: lower case, letters and hyphens only — `Sierra Leone` → `sierraleone`. */
const countryKey = (raw) => String(raw || '').toLowerCase().replace(/[^a-zäöüß-]/g, '');
const COUNTRY_NAME_SET = new Set(COUNTRY_NAMES.map(countryKey));
const COUNTRY_STEM_SET = new Set(COUNTRY_STEMS);

const sharedPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
};

/**
 * A WHOLE COUNTRY NAME — the question a NAME field asks (ROUND 20, DaF review #19, MAJOR 2).
 *
 * „Ihr Land“ asks „is this word a country?“ after `aus`, where almost anything capitalised is one,
 * and the three-way prefix search below is right there. A name field asks the inverse — „is this
 * word NOT a person's name?“ — and measured with the same search it refused 16 of 38 German names:
 * `franz` → `franzos` (five shared letters), `domin` → `dominikan`, `georg`, `malt`, `schweiz`,
 * `türk`. So the name field gets a test that says yes only to a WHOLE name: a listed name
 * (COUNTRY_NAMES), or a nationality stem followed by one of the endings German builds a country
 * name with — `deutsch` + `land`, `türk` + `ei`, `syr` + `ien`, `pol` + `en`, `afghan` + `istan`,
 * `eritre` + `a`. A bare stem is a NAME here („Israel“, „Jordan“, „Iran“ are given names; „Türk“,
 * „Schweizer“, „Engländer“, „Pole“ are surnames), and a two-letter stem composes only with a long
 * ending (`ir` + `land`, never `ir` + `a` — „Ira“ is a name). The one ending NOT here is `-e`:
 * „Malte“ is a name, and the country it would build (`ukrain` + `e`) is listed instead.
 */
const COUNTRY_NAME_ENDINGS = ['enland', 'istan', 'land', 'stan', 'ien', 'en', 'ei', 'ia', 'a'];
const isWholeCountryName = (raw) => {
  const n = countryKey(raw);
  if (COUNTRY_NAME_SET.has(n)) return true;
  for (const end of COUNTRY_NAME_ENDINGS) {
    if (!n.endsWith(end)) continue;
    const stem = n.slice(0, -end.length);
    if ((stem.length >= 3 || (stem.length >= 2 && end.length >= 3)) && COUNTRY_STEM_SET.has(stem)) return true;
  }
  return false;
};

/**
 * The listed names count at any length (`USA`); the stem search needs FOUR letters. Three letters
 * were enough for a country („Ira“ → `irak`, „Ben“ → `benin`) once the same test began to read
 * name fields (round 19): no country has a three-letter German name, but people do. Since round 20
 * `asName` no longer narrows this search — it asks `isWholeCountryName` instead (see above).
 */
const isCountryName = (raw, { asName = false } = {}) => {
  if (asName) return isWholeCountryName(raw);
  const n = countryKey(raw);
  if (COUNTRY_NAME_SET.has(n) || COUNTRY_STEM_SET.has(n)) return true;
  if (n.length < 4) return false;
  for (const stem of COUNTRY_STEM_SET) {
    if (n.startsWith(stem)) return true;
    if (stem.startsWith(n)) return true;
    if (sharedPrefix(n, stem) >= 5) return true;
  }
  return false;
};

/**
 * A FORM VALUE STANDS BARE — without `aus`, without `sprechen`, without a sentence — and every
 * form that lives on its context in a sentence needs its own exclusion on the field (ROUND 20, DaF
 * review #19, MAJOR 2). `isCountryName` was built for „Ihr Land“ in a Mitteilung, where `aus` stands
 * before the name and „is that a country?“ after `aus` is nearly always yes; on the field the value
 * is naked, and `arab`, `deutsch`, `türk`, `engl` are country stems AND the starts of languages —
 * so „Land: Arabisch“, „Land: Türkisch“, „Land: Marokkanerin“ were 18 of 20 green. In Lektion 1 the
 * learner fills the first Formular of the course with Ana's data („kommt aus Marokko. Sie spricht
 * Arabisch“), and swapping those two fields is the one mistake that form provokes. A language name
 * and a nationality noun are not a country: both are excluded here and in COUNTRY_SHAPE for the
 * Mitteilung („aus Arabisch“). A LISTED name wins over the exclusion („Ukraine“ looks like
 * `ukrain` + `e`, the shape of Pole/Türke).
 */
const isCountryToken = (t, opts) => COUNTRY_NAME_SET.has(countryKey(t))
  || (!isLanguageName(t, opts) && !isNationalityWord(t) && isCountryName(t));

/**
 * „aus Marokko“, „aus der Türkei“, „aus dem Iran“ — the article is part of the country name for
 * exactly the countries a German course's learners come from (die Türkei, der Irak, die Ukraine,
 * die Schweiz), so an optional `der`/`dem`/`den` stands between `aus` and the name. What round 17
 * adds is the only thing that made it a shape rather than a keyword: the name must BE a country.
 */
const AUS_LAND_RE = /\baus\s+(?:de[rmn]\s+)?([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)(?:\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+))?/g;
const COUNTRY_SHAPE = {
  test: (body) => {
    const text = String(body || '');
    AUS_LAND_RE.lastIndex = 0;
    for (let m = AUS_LAND_RE.exec(text); m; m = AUS_LAND_RE.exec(text)) {
      // Two capitalised words after `aus` are tried as ONE name first („aus Sierra Leone“), then the
      // first alone („aus Marokko Ana“ is a country followed by a name).
      if ((m[2] && isCountryName(`${m[1]} ${m[2]}`)) || isCountryToken(m[1])) return true;
    }
    return false;
  },
};
/**
 * The value of a country FIELD or a named field („Mein Land ist die Türkei“): some word of it is a
 * country — and no language name or nationality noun is (see `isCountryToken`). `foldCase` is the
 * Formular's reading (see FIELD_SHAPES): „Land: arabisch“ is the language too.
 */
const countryValueShape = (opts = {}) => ({
  test: (value) => {
    const toks = words(value).map(stripPunct).filter(Boolean);
    return toks.some((t, i) => isCountryToken(t, opts) || (i + 1 < toks.length && isCountryName(`${t} ${toks[i + 1]}`)));
  },
});
const COUNTRY_VALUE_SHAPE = countryValueShape();

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

/**
 * The suffixes a German nationality NOUN is built with, longest first. ROUND 19 (DaF review #18,
 * Minor 17) adds `-sch` (`libysch` = `liby` + `sch` — the `-ysch` of the review, read from the stem
 * the list has) and `-i` (`Israeli`, `Saudi`); the BARE STEM (`Ungar`, `Jemenit`) is the empty
 * suffix and counts only in the predicative position — see `PREDICATIVE_STEM_RE` — because bare
 * stems are also country names („aus dem Iran“ is a country, „Ich bin Iraner“ a nationality).
 */
const NATIONALITY_NOUN_SUFFIXES = ['ierin', 'erin', 'ier', 'isch', 'sch', 'er', 'in', 'e', 'i'];

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
/** „Ich **bin** Ungar.“, „Er **ist** Jemenit.“ — the bare stem as a noun, after a finite `sein`. */
const PREDICATIVE_STEM_RE = /\b(?:bin|bist|ist|sind|seid|war|warst|waren)\s+([A-ZÄÖÜ][a-zäöüß-]+)/g;
const hasPredicativeStem = (text) => {
  PREDICATIVE_STEM_RE.lastIndex = 0;
  for (let m = PREDICATIVE_STEM_RE.exec(text); m; m = PREDICATIVE_STEM_RE.exec(text)) {
    if (COUNTRY_STEM_SET.has(m[1].toLowerCase())) return true;
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
/** …and the languages whose German name does not end in `-isch` (`Dari`, `Urdu`), from the world list. */
const LANGUAGE_NAME_SET = new Set(LANGUAGE_NAMES.map((n) => n.toLowerCase()));
/** `ana` → `Ana`, `arabisch` → `Arabisch`: the Formular's case fold, see FIELD_SHAPES. */
const capitalise = (t) => {
  const s = String(t || '');
  return s ? s[0].toUpperCase() + s.slice(1) : s;
};
/**
 * `foldCase` is set by the Formular branch only (FIELD_SHAPES): on a form field „arabisch“ is the
 * language; in a Mitteilung the sentence separates the language from the adjective by case
 * („Ich bin arabisch.“ is a nationality — round 16), so the Mitteilung keeps its capital.
 */
const isLanguageName = (t, { foldCase = false } = {}) => LANGUAGE_NAME_RE.test(foldCase ? capitalise(t) : t)
  || LANGUAGE_NAME_SET.has(String(t || '').toLowerCase());
/** The value of a language FIELD: „Arabisch, Deutsch“, „Dari“ — some word of it is a language. */
const languageValueShape = (opts = {}) => ({ test: (value) => words(value).map(stripPunct).some((t) => isLanguageName(t, opts)) });
const LANGUAGE_VALUE_SHAPE = languageValueShape();

/**
 * Does `body` name a nationality? Structural, never a name — see the header above.
 * Shape objects in ANSWER_SHAPES only need `.test`, so this is one of them.
 */
const NATIONALITY_SHAPE = {
  test: (body) => sentences(body).some((sentence) => {
    const toks = words(sentence).map(stripPunct).filter(Boolean);
    const usable = LANGUAGE_CONTEXT_RE.test(sentence)
      ? toks.filter((t) => !isLanguageName(t))
      : toks;
    const rest = usable.join(' ');
    if (DEUTSCH_RE.test(rest) || PREDICATIVE_ISCH_RE.test(rest) || hasPredicativeStem(rest)) return true;
    return usable.some(isNationalityWord);
  }),
};

/**
 * A NAME is a capitalised word of at least two letters that is neither a country nor a language —
 * „Familienname: Marokko“ and „Vorname: Arabisch“ fill the field with a value of another field's
 * kind, „Name: 12“ with none. A city („Vorname: Bremen“) is NOT caught: there is no world list of
 * cities and a surname may be one. ONE definition: the named field of the Mitteilung („Mein Name
 * ist Ana Ruiz“) and the name fields of the Formular read it alike.
 */
const nameValueShape = (opts = {}) => ({
  test: (value) => words(value).map(stripPunct).some((raw) => {
    const t = opts.foldCase ? capitalise(raw) : raw;
    return /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+$/.test(t) && t.length >= 2 && !isCountryName(t, { asName: true }) && !isLanguageName(t, opts);
  }),
});
const NAME_VALUE_SHAPE = nameValueShape();

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
const DAY_OR_DATE_SHAPE = anyOf(DAY_SHAPE, DATE_SHAPE);

const ANSWER_SHAPES = [
  // `value` is what the FIELD-NAMING alternative must carry („Der Name ist Ana Ruiz.“) — by default
  // the shape itself, so that naming a field without filling it in with a value of the right kind
  // („Meine Telefonnummer ist neu.“) is not an answer either. See namedFieldShape below. The same
  // `value` is what a FORMULAR FIELD of that name must carry — see `fieldValueShape` (round 19).
  // `form` is the same shape built for the FORMULAR's reading (FIELD_SHAPES hands it the one
  // option that differs there); a row without `form` reads the field exactly as the Mitteilung.
  {
    on: ['nam', 'vornam', 'nachnam', 'familiennam'],
    re: /\b(?:hei(?:ß|ss)\w*|nenn\w*)\b|\bich\s+bin\s+[A-ZÄÖÜ]/,
    value: NAME_VALUE_SHAPE,
    form: nameValueShape,
  },
  { on: ['geburtsdatum', 'geburtstag', 'datum'], re: DATE_SHAPE },
  { on: ['alt', 'alter'], re: AGE_RE, value: NUMBER_VALUE_RE },
  { on: ['land', 'geburtsland', 'herkunft'], re: COUNTRY_SHAPE, value: COUNTRY_VALUE_SHAPE, form: countryValueShape },
  { on: ['staatsangehörigkei', 'staatsangehoerigkei', 'nationalitä', 'nationalitae'], re: NATIONALITY_SHAPE },
  { on: ['familienstand'], re: /\b(?:ledig|verheiratet|geschieden|verwitwet)\b/i },
  { on: ['uhrzei', 'zeit', 'termin'], re: CLOCK_RE, form: () => FORM_CLOCK_SHAPE },
  { on: ['tag', 'wochentag'], re: DAY_OR_DATE_SHAPE },
  { on: ['preis', 'kost', 'geld'], re: PRICE_RE },
  { on: ['zimm', 'person', 'anzahl', 'hausnumm', 'postleitzahl', 'plz'], re: NUMBER_VALUE_RE },
  { on: ['telefonnumm', 'numm', 'handynumm'], re: PHONE_RE },
  { on: ['sprach', 'muttersprach'], re: LANGUAGE_VALUE_SHAPE, form: languageValueShape },
  { on: ['farb'], re: COLOUR_RE },
  { on: ['frag'], re: /\?/ },
];

/**
 * THE CLOCK OF THE FORM. „15.00“ is how a German form writes three o'clock, „9“ on a line named
 * „Kurs von“ is nine, and a Mitteilung never writes either („um 15.00“ does not occur; a bare „9“
 * in a sentence is a room, a count, a house number). So the dotted time without `Uhr` and the bare
 * hour 0–24 are FORM shapes — anchored to the whole value — and CLOCK_RE, which TIME_RE and the
 * „Wann“ shape read out of running text, stays as it is: there `12.10` is a date.
 */
const FORM_CLOCK_SHAPE = anyOf(CLOCK_RE, /^\d{1,2}[.:]\d{2}$/, /^(?:[01]?\d|2[0-4])$/);

/**
 * A FORMULAR FIELD IS A LEITPUNKT WITH A NAME, AND A LEITPUNKT HAS A VALUE SHAPE — EVEN WHEN THE
 * NAME STANDS ON A FORM LINE (DaF review #18, MAJOR 2).
 *
 * The Formular branch of `scoreWriting` used to read `value.trim().length > 0` and nothing else, so
 * „Land: Bremen“, „Sprache: Marokko“, „Telefonnummer: neu“, „Uhrzeit: Montag“ and a single dot were
 * „erledigt“ on all thirty fields of the six Formulare — while the SAME file, on the Mitteilung, had
 * called „Ich komme aus Bremen.“ red since round 17. In *Start Deutsch 1* Teil 1 the point per
 * field is for the RIGHT entry, and the value shapes were already here. This table maps a field
 * name to the shape its value must have, and it is derived from ANSWER_SHAPES — the `value` a named
 * field must carry is the value a form field must carry; one definition per shape, never a copy.
 * The rows below it are the field names a Mitteilung never asks as a Leitpunkt (a street, a city)
 * and therefore have no ANSWER_SHAPES row: a form field, unlike a Leitpunkt, can only ever be
 * answered by a value, so „capitalised word(s)“ is a shape here and would be a keyword filter there.
 *
 * A field is looked up by EVERY word of its name, folded and raw: „Kurs von“ / „Kurs bis“ reach the
 * clock through `von`/`bis`, „Kurs am“ reaches the day through `am` — the words the Leitpunkt reader
 * drops as function words, because on a form line they are the whole question. A field no row
 * knows („Hobby“, „Material“, „Kurs“, „Unterschrift“) has no shape: it is filled or empty, and a
 * filled one is „prüft die KI“ — the third row, exactly as on the Mitteilung.
 */
/**
 * A FORM VALUE STANDS BARE — without `aus`, without `sprechen`, without a sentence — and every form
 * that lives on its context in a sentence needs its own exclusion on the field (ROUND 20, DaF review
 * #19, MAJOR 2). Two decisions are made HERE, once, for every field:
 *
 *  THE CASE. A form value is read CASE-FOLDED: `ana` = `Ana`, `arabisch` = `Arabisch`. The lesson
 *  checker (`check.js`) calls a case-only miss a TYPO and gives a retry; the Formular used to call
 *  „Vorname: ana“ „fehlt noch“ — the same learner, the same spelling, two verdicts, and „fehlt noch“
 *  the falser one, because it claims the field is empty. Whoever writes from the Arabic has no
 *  capitals, and the lower-case name is the most common form entry of the integration course. The
 *  country, day and colour readers were already case-blind; the name and language readers now take
 *  `FORM_CASE` and are too. The MITTEILUNG keeps its capitals: there the sentence separates the
 *  language from the adjective by case (round 16), and nothing here reaches it.
 *
 *  THE CLOCK. „Uhrzeit: 15.00“ and „Kurs von: 9“ are the times of a German form — FORM_CLOCK_SHAPE
 *  above — where the Mitteilung's CLOCK_RE wants `Uhr` or a colon.
 */
const FORM_CASE = Object.freeze({ foldCase: true });
const FIELD_SHAPES = [
  ...ANSWER_SHAPES.map((row) => ({ on: row.on, value: row.form ? row.form(FORM_CASE) : (row.value || row.re) })),
  { on: ['von', 'bis', 'beginn', 'anfang', 'end', 'start'], value: FORM_CLOCK_SHAPE },
  { on: ['am'], value: DAY_OR_DATE_SHAPE },
  { on: ['wohnort', 'ort', 'stadt', 'geburtsort', 'straß', 'strass', 'adress'], value: nameValueShape(FORM_CASE) },
  { on: ['email', 'mail'], value: /\S+@\S+/ },
];
const fieldValueShape = (field) => {
  const keys = words(field).flatMap((w) => [foldWord(w), String(w).toLowerCase()]);
  const row = FIELD_SHAPES.find((r) => keys.some((k) => r.on.includes(k)));
  return row ? row.value : null;
};

/**
 * The shapes a QUESTION WORD in the Leitpunkt asks for, read off the whole
 * conjunct rather than off a content word — „Wann Sie kommen“ is answered by
 * „Ich bin erst um zehn Uhr da.“, which shares no token with it at all, and
 * `wann` is (rightly) a function word for the word half. „Warum“ deliberately
 * has no row: a reason is not a form, and that is what makes „Warum Sie
 * schreiben“ the undecidable Leitpunkt the KI has to grade.
 */
/**
 * THE WANN SHAPE READS A SENTENCE, NOT THE TEXT (DaF review #21, MAJOR 2, „Drittens“). Round 21's
 * row was `CLOCK_RE | DAY_RE` over the whole Mitteilung, so `heute` in „Der Bus kommt heute nicht.“
 * answered „Wann Sie kommen“ for the sentence after it. Three things make a sentence the answer:
 *  • it carries a TIME — a clock, a day, or a time of day (`TIME_OF_DAY_RE`, this shape only);
 *  • it is about the WRITER or the Leitpunkt's own matter: a first-person subject („Ich bin erst um
 *    zehn Uhr da.“ shares no token with „Wann Sie kommen“ and is its answer) or one of the
 *    Leitpunkt's content words folded („Der Zug kommt um zehn Uhr an.“, „Das Büro ist ab neun Uhr
 *    offen.“) — „Der Zug hat heute Verspätung.“ is neither;
 *  • the time stands in a clause that is NOT negated: „Der Bus kommt heute nicht.“ and „Ich komme
 *    heute nicht.“ say when something does not happen. The clause, not the sentence, so that „Ich
 *    kann heute nicht kommen, ich komme morgen.“ is still an answer — the same rule and the same
 *    `clauses` split Minor 12 of round 17 wrote for the birth date („same clause, not same sentence“).
 *
 * ROUND 23 (DaF review #22, Minors 41 and 42) widens two of the three without moving them:
 *  • „about the writer“ knows the whole first person — `mich`, `mir`, `uns`, `mein…`, `unser…`:
 *    „**Mein** Zug ist erst um zehn Uhr in Bremen.“ (L10, no `komm`) and „Sie können **mich** von neun
 *    bis zwölf Uhr anrufen.“ (L6) are the writer's sentences and were red;
 *  • the negation is read against the CLAUSE, and a clause is split at `sondern` too („Ich komme
 *    nicht um neun sondern um zehn Uhr“ — the learner's spelling, no comma). Inside a negated clause
 *    the negation is of what FOLLOWS `nicht`: a time that stands before it and is contrasted by a
 *    `sondern` („um zehn Uhr nicht mit dem Zug, sondern mit dem Bus“) is not what is denied, and
 *    `nicht vor/nach/später als <Zeit>` is a bound, not a denial. „Ich komme heute nicht.“ — the
 *    sentence round 22 pinned — has no `sondern` and stays red.
 */
const NEGATION_RE = /(?<!\p{L})(?:nicht|kein\p{L}*|nie|niemals)(?!\p{L})/u;
const FIRST_PERSON_RE = /(?<!\p{L})(?:ich|wir|mich|mir|uns|mein\p{L}*|unser\p{L}*)(?!\p{L})/iu;
const hasTime = (clause) => CLOCK_RE.test(clause) || DAY_RE.test(clause) || TIME_OF_DAY_RE.test(clause);
/** The clause splitter WITH its separators, so a clause knows whether `sondern` follows it. */
const CLAUSE_PARTS_RE = new RegExp(`(${CLAUSE_SPLIT_RE.source})`, 'i');
const BOUND_AFTER_NEGATION_RE = /^\s+(?:vor|nach|später\s+als|spaeter\s+als|früher\s+als|frueher\s+als)(?!\p{L})/iu;
/** Does the sentence carry, in some clause, a time that is not denied? */
const hasUndeniedTime = (sentence) => {
  const parts = String(sentence || '').split(CLAUSE_PARTS_RE);
  for (let i = 0; i < parts.length; i += 2) {
    const c = parts[i].trim();
    if (!c || !hasTime(c)) continue;
    const neg = c.match(NEGATION_RE);
    if (!neg) return true;
    const after = c.slice(neg.index + neg[0].length);
    if (BOUND_AFTER_NEGATION_RE.test(after)) return true;
    const sep = parts[i + 1] || '';
    const next = parts[i + 2] || '';
    const contrasted = /sondern/i.test(sep) || /^\s*sondern(?!\p{L})/iu.test(next);
    if (contrasted && hasTime(c.slice(0, neg.index))) return true;
  }
  return false;
};
const wannShape = (conjunct) => {
  const own = new Set(leitpunktKeywords(conjunct).flatMap((w) => [foldWord(w), ...splitVerbStem(w)]).filter(Boolean));
  return {
    test: (body) => sentences(body).some((s) => {
      const about = FIRST_PERSON_RE.test(s) || words(s).map(foldWord).some((f) => own.has(f));
      return about && hasUndeniedTime(s);
    }),
  };
};

const QUESTION_SHAPES = [
  // `shape` is built per conjunct (the anchor words differ), where `re` is one regex for all.
  { on: /\bwann\b/i, shape: wannShape },
  // ROUND 16 (DaF review #15, MAJOR 2, „Zweitens“): „Warum“ is UNDECIDABLE, and that is a row of
  // its own rather than a missing row. Without it the word half decided the conjunct, and in an
  // indirect question the only lower-case word of „Warum Sie feiern“ is the TASK's verb — so
  // „Wir feiern.“ (the empty echo) was green and „Ich habe Geburtstag.“ (the reason) was red. In a
  // „Wann …“ the answer has a form; in a „Warum …“ it has none, and a reason is not a form.
  { on: /\bwarum\b/i, re: null },
  // 2026-09-14, OWNER DECISION AFTER FOUR ROUNDS (DaF reviews #17–#20): THE AUFTRAG IS UNDECIDABLE
  // BY FORM. „Was die Kollegin bis dahin machen soll“, „Was die Gäste mitbringen sollen“ — an
  // indirect question closed by a modal asks what someone SHOULD DO, and four repairs in a row
  // (a verb echo, three instruction shapes, a fourth shape with a subject and a complement rule, a
  // vocative cut and a bare imperative) each closed the reviewer's probes and each opened the next
  // set: #17 measured 10 of 12 correct Aufträge red, #18 0 of 10 exam statements green, #19 22 of
  // 48 correct answers red, #20 13 of 51 red and „Die Kollegin fährt mit dem Zug.“ green. The
  // reason is not a missing case but the question itself: „Die Kollegin trinkt Kaffee.“ and „Die
  // Kollegin ruft Herrn Weber an.“ have ONE form, and only their meaning tells a description from
  // an instruction — which is the KI's reading, never the Formcheck's. So the row is „prüft die
  // KI“, exactly like „Warum …“: never green, never red. The rule is the shape of the Leitpunkt
  // (a W-word first, a modal last), not a list of the two Leitpunkte that currently carry it.
  // Minor 34 (DaF review #21): the modal family is `sollen|müssen|können|dürfen|wollen|möchten|
  // mögen`, the W-list includes `ob`, and a closing mark on the Leitpunkt („… sollen?“, „… sollen.“)
  // does not turn the Auftrag back into a form.
  { on: /^(?:was|wer|wen|wem|wann|wo|wie|warum|woher|wohin|welche[rnms]?|ob)\b.*\b(?:soll|sollst|sollen|sollt|muss|musst|müssen|müsst|kann|kannst|können|könnt|darf|darfst|dürfen|dürft|will|willst|wollen|wollt|möchte|möchtest|möchten|möchtet|mag|magst|mögen|mögt)\s*[?.!]?\s*$/i, re: null },
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

/** An indirect question („Was Sie kaufen“) — see the header, step 3. */
const INDIRECT_QUESTION_RE = /^(?:was|wer|wen|wem|wann|wo|wie|warum|woher|wohin|welche[rnms]?)\b/i;

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
  const all = leitpunktKeywords(conjunct);
  // In an indirect question the capitalised nouns are the topic the task hands over, not the
  // answer; only the predicate decides. Elsewhere („Ihre Telefonnummer“) the noun IS the answer.
  const keywords = INDIRECT_QUESTION_RE.test(conjunct)
    ? all.filter((w) => /^[a-zäöüß]/.test(w))
    : all;
  // A question shape with `re: null` declares the conjunct undecidable by FORM — neither its words
  // nor a shape may decide it (see QUESTION_SHAPES), so `folded` and `shapes` are EMPTY and the row
  // becomes „prüft die KI“. `words` is kept: it never scores (`leitpunktSatisfied` reads `folded`),
  // but RULE 21's untaught-head check reads it — „Was die Gäste **mitbringen** sollen“ still asks
  // the course whether it has taught `mitbringen` by Lektion 12.
  if (QUESTION_SHAPES.some((s) => s.re === null && s.on.test(conjunct))) {
    return { text: conjunct, words: keywords, folded: [], shapes: [] };
  }
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
  shapes.push(...QUESTION_SHAPES.filter((s) => (s.re || s.shape) && s.on.test(conjunct)).map((s) => (s.shape ? s.shape(conjunct) : s.re)));
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
  // THE ANREDE IS CUT OFF BEFORE ANY SHAPE READS THE TEXT (DaF review #22, MAJOR 2): „Guten morgen
  // Frau Berg, ich komme später“ carries no time once the greeting is gone, whatever its spelling.
  // A header line before it (a place and date, a Betreff — Minor 40) goes with it: the letter's
  // date is not the party's date.
  const body = openingCut(text).body;
  // The fold half reads STATEMENTS only: a question that carries the Leitpunkt's verb („Kaufst du
  // auch?“ for „Was Sie kaufen“) asks, and answers nothing (DaF review #18, Minor 18).
  const statements = sentences(body).filter((s) => !isQuestion(s)).join(' ');
  const inText = new Set(words(statements).map(foldWord).filter(Boolean));
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

/**
 * ANREDE AND GRUSS ARE A PLACE, NOT A WORD (DaF review #21, MAJOR 1). What *Start Deutsch 1* scores
 * under „Kommunikative Gestaltung“ is the Anrede at the OPENING and the Schlussformel at the CLOSING;
 * round 5's two regexes read a word anywhere in the text, so `liebe` in „Liebe Grüße“ was an Anrede
 * for a text that had none, „Viele Grüße an Tim!“ in the third sentence was the Gruß, and the list
 * was shorter than the course's own Wortfeld — „Bis morgen“ (L1), „Bis später“ and „Mach's gut“
 * (L12) and the „Deine Ana“ of every informal Goethe model letter were all red, 21 of 31 closings.
 *
 * THE ANREDE opens the FIRST sentence: `Hallo|Hi|Hey|Moin|Servus|Grüß dich|Guten Tag/Morgen/Abend|
 * Sehr geehrte(r)|Liebe(r) <Name>`. Case-blind since round 23 (DaF review #22, Minor 39): „liebe
 * lena,“ and „LIEBE LENA,“ are an address written by someone without capitals, and *Start Deutsch 1*
 * takes that off under „Formale Richtigkeit“, not under the Anrede. What still keeps the adverb
 * („ich bin lieber zu Hause“) and „Liebe Grüße“ out is the PLACE (the head of the first sentence)
 * and two named exclusions. A HEADER LINE before the Anrede — a place and date („Bremen, 12.5.2026“),
 * a Betreff, an addressee („An Frau Berg“) — is skipped: it is the letter form some integration
 * courses teach, and the Anrede then opens the second segment (Minor 40). A header is a segment
 * with no Anrede that is a date or at most four words.
 *
 * THE ANREDE IS ALSO CUT OFF THE BODY before any Leitpunkt shape reads it (`openingCut`, MAJOR 2 of
 * review #22): the formula, an optional name after it („Frau Berg“, „liebe Lena“, „Damen und
 * Herren“ — capitalised words or the address words themselves), and the comma, colon, mark or line
 * break that closes it; twice, because „Hallo Lena, guten Morgen, …“ is two. Where no closing mark
 * follows within four words only the formula goes — „Guten Morgen Frau Berg ich komme um zehn Uhr“
 * keeps its clause — and a name that is a first-person clause („Hallo, ich bin Ana Chakiri.“) is
 * never taken for the name.
 *
 * THE GRUSS IS A CLOSING BLOCK, NOT A STRING (DaF review #22, MAJOR 1). Round 22 read „the formula,
 * followed by nothing but a signature“ literally, and 49 of the reviewer's 63 legitimate closings were
 * red — „Tschüss und bis morgen, Ana“ (two formulas of the L1 Wortfeld, joined by `und`), „Bis
 * Samstag um acht Uhr!“ (the closing an invitation calls for), „Bis heute Abend“, „Viele liebe
 * Grüße“, „Gute Nacht“ (L1), the L6 telephone number under the name that the Leitpunkt asks for.
 * The block is read in three layers:
 *
 *  1. THE FORMULAS, chained. One formula may follow another, joined by a comma, an exclamation
 *     mark, a full stop or `und` — „Tschüss, bis Mittwoch!“, „Viele Grüße und bis bald“, „Mach's
 *     gut. Bis bald!“ — and „Danke“ / „Vielen Dank“ may stand in the chain. The family: `bis` + a
 *     TIME (the same atoms the Wann shape reads: a weekday or `heute/morgen`, optionally with a
 *     time of day or `früh`, optionally `um <Uhrzeit>`; a bare clock; `bald|dann|später|nachher|
 *     gleich|dahin|demnächst`; `nächste Woche`, `zum Fest`); `<adjective> Grüße/Gruß` in every
 *     pairing German has (`viele liebe`, `ganz liebe`, `herzlichen Gruß`, `mit besten Grüßen`, `mit
 *     freundlichem Gruß`), with `aus <Ort>` and `von`; the bare `Grüße`/`Gruß` with a name;
 *     `Tschüs(s)`, `Ciao`/`Tschau`, „Auf Wiedersehen“, „Gute Nacht“, „Mach's gut“, „Alles Gute/
 *     Liebe“, „(Einen) Schönen Tag/Abend/Wochenende (noch)“, „Hochachtungsvoll“, `LG|MfG|VG`, and
 *     `Dein(e)|Euer/Eure|Ihr(e) <Name>`. Always at the head of a sentence or a line.
 *  2. THE SIGNATURE — what follows the formula on the closing line(s): at most six tokens, each a
 *     capitalised word, a number („Zimmer 12“, „Kurs A1.1“), `und` between two names, or one of the
 *     address words (`deine`, `Ihre`, „deine Freundin Ana“); punctuation, a parenthesis and an emoji
 *     between them are nothing. Case is not a rule of the signature (Minor 39): where the FORMULA is
 *     written without a capital („viele grüße, ana“) the name may be too — up to three words that are
 *     not function words. That is what keeps „Viele Grüße an Tim! Ana“ (`an`), „Bis Samstag ist Ana
 *     krank.“ (`ist`) and „Bis Samstag Ana Chakiri arbeitet.“ (`arbeitet`, lower case after a
 *     capitalised formula) red — the same ten non-formulas as in round 22, still 0 green.
 *  3. THE APPENDIX — lines after the signature that are NOT part of the closing and do not break it:
 *     a P.S. (and everything after it), a telephone line („Tel. 0176 …“ or the bare number), an
 *     address line, a line of nothing but punctuation or emoji. In L6 the Leitpunkt asks for the
 *     number and the place an adult writes it to a boss is under the name.
 */
const ANREDE_RE = /^[\s"„“»«(]*(?:hallo|hi|hey|moin|servus|grüß\s+dich|gruess\s+dich|guten\s+(?:tag|morgen|abend)|sehr\s+geehrte[rs]?|liebe[rs]?\s+(?!grüße|gruesse|grüsse|ich(?!\p{L})|zu(?!\p{L})|nicht(?!\p{L}))\p{L}+)(?!\p{L})/iu;
/** The lower-case words that may extend an Anrede beyond its formula: „Sehr geehrte Damen **und** Herren“, „Hallo **ihr Lieben**“. */
const ANREDE_WORD_RE = /^(?:und|liebe[rs]?|lieben|alle|zusammen|ihr|frau|herrn?|dr\.?)$/i;
const ANREDE_TOKEN_RE = /^[^\S\n]*([^\s,!:;?]+)/u;
const ANREDE_END_RE = /^[^\S\n]*(?:[,!:;?]+|\.(?=\s|$)|\n|$)/u;
/**
 * How much of `t` the Anrede at its head takes: the formula, an optional comma, up to four name
 * words (capitalised, or one of the address words — never „ich bin …“), and the mark that closes it;
 * where no mark closes it within four words, the formula alone. 0 when no Anrede opens `t`.
 */
const anredeLength = (t) => {
  const m = t.match(ANREDE_RE);
  if (!m) return 0;
  let at = m[0].length;
  const comma = t.slice(at).match(/^[^\S\n]*,/);
  if (comma) at += comma[0].length;
  for (let n = 0; n <= 4; n += 1) {
    const end = t.slice(at).match(ANREDE_END_RE);
    if (end) return at + end[0].length;
    const tok = t.slice(at).match(ANREDE_TOKEN_RE);
    if (!tok || !(/^\p{Lu}/u.test(tok[1]) || ANREDE_WORD_RE.test(tok[1]))) break;
    at += tok[0].length;
  }
  return m[0].length;
};
/**
 * A header segment: no Anrede, no first person, no closing mark (it ended at the line break, not at
 * a full stop — „Ich heiße Ana Chakiri.“ is a sentence of four words, not a header), and a date or
 * at most four words.
 */
const isHeaderSegment = (seg) => !ANREDE_RE.test(seg) && !FIRST_PERSON_RE.test(seg) && !/[.!?…]$/.test(seg)
  && (DATE_VALUE_RE.test(seg) || words(seg).length <= 4);

/**
 * The text split at its opening: `{ anrede, body }` — whether an Anrede opens it (after an optional
 * header line), and the text with the header and the Anrede(s) removed, for the shapes to read.
 */
export const openingCut = (text) => {
  let t = String(text || '').replace(/^\s+/, '');
  const segs = sentences(t);
  if (segs.length > 1 && isHeaderSegment(segs[0])) {
    const at = t.indexOf(segs[0]);
    if (at >= 0) t = t.slice(at + segs[0].length).replace(/^\s+/, '');
  }
  let anrede = false;
  for (let pass = 0; pass < 2; pass += 1) {
    const len = anredeLength(t);
    if (!len) break;
    anrede = true;
    t = t.slice(len).replace(/^[\s,]+/, '');
  }
  return { anrede, body: t };
};

const GRUESSE = '(?:grüße|gruesse|grüsse|grüßen|gruessen|grüssen|gruß|gruss)';
const GRUSS_ADJ = '(?:viele|vielen|liebe|lieben|schöne|schoene|schönen|schoenen|herzliche|herzlichen|beste|besten|freundliche|freundlichen|freundlichem|sonnige)';
const CLOCK_VALUE = `(?:halb\\s+)?(?:\\d{1,2}(?:[.:]\\d{2})?|${NUMBER_WORD})(?:\\s*Uhr)?`;
/** What `bis` may close with — the Wann shape's own atoms, plus the adverbs of leave-taking. */
const BIS_TIME = '(?:bald|dann|später|spaeter|nachher|gleich|dahin|demnächst|demnaechst'
  + '|n[äa]e?chste[ns]?\\s+\\p{L}+|zu[mr]\\s+\\p{L}+'
  + `|(?:${DAY_ADVERB}|${WEEKDAY}|wochenende)(?:\\s*(?:früh|${TIME_OF_DAY_NOUN}))?(?:\\s+um\\s+${CLOCK_VALUE})?`
  + `|(?:um\\s+)?${CLOCK_VALUE})`;
const GRUSS_FORMULA = '(?:tschüs+|tschuess|tschau|ciao|lg|glg|mfg|vg|auf\\s+wiedersehen|hochachtungsvoll'
  + `|(?:mit\\s+)?(?:(?:ganz|viele|vielen|recht)\\s+)?${GRUSS_ADJ}\\s+${GRUESSE}(?:\\s+aus(?:\\s+de[mrn])?\\s+\\p{L}+)?(?:\\s+von)?`
  + `|${GRUESSE}`
  + '|mach[\'’]?s\\s+gut|alles\\s+(?:gute|liebe)|gute\\s+nacht'
  + '|(?:einen\\s+)?schöne[ns]\\s+(?:tag|abend|wochenende|woche|sonntag|urlaub|feier)(?:\\s+noch)?'
  + `|bis\\s+${BIS_TIME}`
  + '|deine?|eure?|ihre?)';
/** One formula, then any number of further formulas (or a thanks) joined by `,` `!` `.` or `und`. */
const GRUSS_CHAIN = `${GRUSS_FORMULA}(?:\\s*(?:[,!.]\\s*|\\s+und\\s+)(?:vielen\\s+dank|danke|${GRUSS_FORMULA}))*`;
/** The chain at the head of a sentence or a line. Case-blind: the formula has no case rule. */
const GRUSS_START_RE = new RegExp(`(?:^|[.!?…]\\s+|\\n\\s*)(?:(?:vielen\\s+)?danke?\\s+und\\s+)?${GRUSS_CHAIN}(?!\\p{L})`, 'giu');
/** The address words of a signature, and the `und` between two names. */
const SIGNATURE_WORD_RE = /^(?:deine?|eure?|euer|ihre?|und)$/i;
/** Is `rest` — what follows the formula — a signature? `lower`: the formula itself was written without a capital. */
const isSignature = (rest, lower) => {
  const toks = String(rest || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}'’.\-\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
  if (toks.length > 6) return false;
  if (lower) return toks.length <= 3 && toks.every((t) => SIGNATURE_WORD_RE.test(stripPunct(t)) || !isFunctionWord(stripPunct(t)));
  return toks.every((t) => SIGNATURE_WORD_RE.test(stripPunct(t)) || /^[\p{Lu}\p{N}]/u.test(t));
};
/** A line that hangs under the signature without being part of the closing. */
const POSTSCRIPT_RE = /^p\.?\s?s\.?\s*[:.]?(?!\p{L})/iu;
const CONTACT_LINE_RE = /^(?:tel|telefon|handy|mobil|nummer|nr)\b/i;
const ADDRESS_LINE_RE = /\b\d{5}\b|straße|strasse|str\.|\bweg\b|\bplatz\b|\ballee\b|\bgasse\b/i;
const isAppendixLine = (line) => POSTSCRIPT_RE.test(line) || CONTACT_LINE_RE.test(line)
  || !/[\p{L}\p{N}]/u.test(line)
  || (PHONE_RE.test(line) && words(line).length <= 5)
  || (ADDRESS_LINE_RE.test(line) && /\d/.test(line) && words(line).length <= 6);
/** The text without its appendix: everything from a P.S. on, and the contact lines under the name. */
const withoutAppendix = (text) => {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const ps = lines.findIndex((l, i) => i > 0 && POSTSCRIPT_RE.test(l));
  if (ps > 0) lines.length = ps;
  while (lines.length > 1 && isAppendixLine(lines[lines.length - 1])) lines.pop();
  return lines.join('\n');
};

/** Is `text` opened by an Anrede — at its first sentence, or at its second after a header line? */
export const anredeAtOpening = (text) => openingCut(text).anrede;

/** Does `text` END in a closing block — formula(s), then a signature, then at most an appendix? */
export const grussAtClosing = (text) => {
  const t = withoutAppendix(text);
  for (const m of t.matchAll(GRUSS_START_RE)) {
    const rest = t.slice(m.index + m[0].length);
    const lower = !/\p{Lu}/u.test(m[0]);
    if (!isSignature(rest, lower)) continue;
    // „Dein“/„Deine“/„Ihre“ is a signature only WITH the name („Deine Ana“); the other formulas stand alone.
    const needsName = /(?:deine?|eure?|euer|ihre?)$/i.test(m[0].trim());
    if (needsName && !/[\p{L}\p{N}]/u.test(rest)) continue;
    return true;
  }
  return false;
};

/**
 * scoreWriting(schreiben, value) → { ok, checks: [{ key, label, ok, ai?, filled? }], count }
 * `value` is a string for a Mitteilung, or a { field: text } map for a Formular.
 *
 * A FORMULAR FIELD IS A LEITPUNKT WITH A NAME, AND A LEITPUNKT HAS A VALUE SHAPE — EVEN WHEN THE
 * NAME STANDS ON A FORM LINE (DaF review #18, MAJOR 2). Each field is scored by the shape of its
 * name (`fieldValueShape`): a country in „Land“, a language in „Sprache“, four digits in
 * „Telefonnummer“, a clock in „Uhrzeit“ / „Kurs von“ / „Kurs bis“, a weekday or date in „Tag“ /
 * „Kurs am“, a number in „Zimmer“ / „Personen“, `ledig|verheiratet|…` in „Familienstand“, a colour in
 * „Farbe“, a capitalised name in the name fields. A field with no shape („Hobby“, „Material“,
 * „Kurs“, „Unterschrift“) is `ai: true` once it is filled — „prüft die KI“, the third row of the
 * Mitteilung. FILLED means a letter or a digit: a dot, a dash or spaces fill nothing, and
 * `filled` is exported on every row so the screen can hold the button until every field has one.
 */
export function scoreWriting(schreiben, value) {
  if (!schreiben) return { ok: false, checks: [], count: 0 };

  if (schreiben.kind === 'formular') {
    const map = value && typeof value === 'object' ? value : {};
    const checks = (schreiben.fields || []).map((field) => {
      const v = String(map[field] || '').trim();
      const filled = /[\p{L}\d]/u.test(v);
      const shape = fieldValueShape(field);
      if (!filled) return { key: field, label: field, ok: false, filled: false };
      if (!shape) return { key: field, label: field, ok: true, ai: true, filled: true };
      return { key: field, label: field, ok: shape.test(v), filled: true };
    });
    return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, count: checks.length };
  }

  const text = String(value || '');
  const count = countWords(text);
  const min = Number(schreiben.minWords) || 0;
  const max = Number(schreiben.maxWords) || Infinity;

  const checks = [
    { key: 'length', label: `${min}–${Number.isFinite(max) ? max : '∞'} Wörter`, ok: count >= min && count <= max },
    // A place, not a word: the Anrede opens the first sentence, the Gruß closes the text (MAJOR 1,
    // DaF review #21 — see ANREDE_RE / GRUSS_FORMULA above).
    { key: 'anrede', label: 'Anrede', ok: anredeAtOpening(text) },
    { key: 'gruss', label: 'Gruß', ok: grussAtClosing(text) },
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
