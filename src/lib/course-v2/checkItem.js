// Course v2 — the answer check for one Item (docs/course-v2/SCHEMA.md §3.1).
//
// A thin wrapper, never a second checker: every typed answer goes through
// checkAnswer/checkOptionsFor/tagError of src/lib/lesson/check.js, exactly as
// the live course grades it (CLAUDE.md: "the lesson checker decides every
// answer in the course"). What this file adds is only what a v2 Item carries
// and check.js does not know yet:
//
//   - `exact: 'number'` (ITM-07: digits, times, dates, prices, phone numbers) —
//     the DIGITS must match exactly; separators between digits are free
//     („0341 90 12 33" = „0341901233", „8.30" = „8:30", „0341/225890" =
//     „(0341) 225890"); a slip in the words around them may still be a TYPO, a
//     wrong digit never is. An accepted form written in words („halb zehn") is
//     matched like a name (below); a number written as a word where digits are
//     accepted („zweihundert" for 200, review b2.2-u04 r1 F16) counts as its
//     digits, and a digit answer to a purely worded key („200" for
//     „zweihundert") counts too.
//   - `exact: 'number'` on a DICTATION (review a2.2-u04 r3 F04) compares the
//     WHOLE sentence: the words keep the dictation typo rule, the digits must
//     match exactly, and a number word counts as its digits („zehn" = „10").
//     The digits-only reading above never applies to a dictation — „10" alone
//     is not a transcription of „Wir sind zehn Minuten von der Brücke.".
//   - on every `exact: 'number'` item a German number word (0–9999, compounds
//     like „dreiundzwanzig", „hundertzwanzig") equals its digit value: the key
//     „9" accepts „neun"; a letter slip in the number word („nuen") is a TYPO
//     like any word, a wrong value („zehn") is WRONG (review a1.1-u04 r3).
//   - on every `exact: 'number'` item a PRICE is its value however it is written (level
//     reviews 2026-09-28): zero cents and the whole-euro dash fold away („890" = „890,00" =
//     „890.00" = „890,-" = „890,–"; the key „320,00" takes „320"), a key with cents keeps
//     them digit-exact („1,99" = „1.99", never „1,90"), and a currency next to the number
//     („€", „EUR", „Euro", before or after) may be added where the key has none („890 €",
//     „890,– €") — except where the prompt prints it next to the gap, which stays the
//     number-only TYPO below. Dictations too („Das kostet 890,00 Euro." for „890 Euro").
//   - `exact: 'name'` (spelled names) — no one-letter tolerance: a letter slip
//     is WRONG; a case-only miss stays the checker's own TYPO rule, and a spelled
//     answer (H-A-L-L-O) folds its separators as check.js already does.
//   - choice items (multiple_choice, richtig_falsch, ja_nein, abc, zuordnen,
//     listen_select, insert, word-bank cloze, match) answer with a key or an
//     option string: an exact key comparison, never a typo.
//
//   - every typed answer is graded with the live per-item options PLUS the opt-in rules of
//     check.js (v2CheckOptions): Duden doublets are one word (gern/gerne, OK/okay), a paradigm
//     twin is a grammar error, never a typo (kommt/kommst, schlaft/schläft, willen/wollen — on
//     g./lx. topics and error corrections), on a caseSensitive item only the polite forms
//     decide by case, and a spacing slip („Wieviel") is a TYPO. The live course never passes them.
//   - `error_correction`: the item's own quoted wrong sentence is WRONG, never a TYPO (ItemView
//     prefills it), and a slip in a token where the key corrects the quote is WRONG too — the
//     correction IS that token (a1.1-u03 r2/r3 F01, u10 r3 F03).
//   - a typed `fill_blank` answered with the word printed right before or after the gap
//     („88 Euro" for „___ Euro", „nach Berlin" for „nach ___") is a TYPO with the reason
//     'number-only' / 'word-only' („Schreiben Sie nur die Zahl."), never WRONG; a clock time
//     keeps its value with a leading zero („09.10" = „9.10") (a1.1-u10 r3 F06, u12 r3 F04).
//   - `form_fill` (sd1.s1, ta2.s1; WritingTaskView passes labelDe and the task's situationDe):
//     an entry is its value plus the field's frame — frame words (Nr., für, Jahre, alt,
//     Personen, Leute, Uhr …), the label's words, the words of the field's accepted forms, the
//     situation sentence that states the same fact, a negated alternative of the label („nicht
//     in Leipzig"), a postcode and city after a street — and never an un-negated alternative
//     („in Leipzig online" stays WRONG), the keys of the form's other fields (`otherAnswers`)
//     and the Anrede before a name. Case is free on a form, and the words of a street key are
//     required („21" alone is no address). (a1.1-u02 r2/r3 F02/F01, u05 r2/r3 F01, u09 r2/r3 F03.)
//     „nur" is a frame word („nur online" = „online"). A letter slip in a word the frame licenses —
//     one edit from a licensed word of ≥ 5 letters, never from the label's other alternative — is
//     the checker's own TYPO class: the entry keeps its retry, it is never WRONG and never CORRECT
//     („Izmir, Turkei" for İzmir is a TYPO, as „Turkei" alone is in the Land field; a1.1-u02 f1).
//     A number written as digits equals its number word in a form entry and its frame
//     („verheiratet, 2 Kinder" = „verheiratet, zwei Kinder"; „24" = „vierundzwanzig"; level
//     review s1 #4): the numbers must be the same, digits exact — „3 Kinder" stays WRONG, never a
//     one-letter slip. Content never pads `accepted` for it; the checker owns the rule.
//
// The error tag of a miss prefers the item's own SCHEMA tag (`errorTags[0]`,
// then `errorTag`), which feeds the repair cards (BLUEPRINT §6.2); only an
// item without one falls back to check.js's descriptive tagError.
import {
  RESULT, checkAnswer, checkOptionsFor, tagError, normalizeSpelling, normalizeDictation, foldNumberWords, isDictationTask,
  cardinalValue, ordinalValue, spellCardinal, stripPunct, levenshtein,
} from '../lesson/check.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';

export { RESULT };

/** Item types whose answer is a key or one of the offered strings. */
export const CHOICE_TYPES = Object.freeze([
  'multiple_choice', 'richtig_falsch', 'ja_nein', 'abc', 'zuordnen', 'listen_select', 'insert', 'match',
]);

const acceptedOf = (item) => {
  const list = Array.isArray(item && item.accepted) && item.accepted.length ? item.accepted : [item && item.answer];
  return list.filter((a) => typeof a === 'string' && a.length > 0);
};

/** Topics on which a paradigm twin is a grammar error: spine points and lexicon words. */
const PARADIGM_TOPIC_RE = /^(g|lx)\./;

/**
 * The checker options of a v2 typed answer: check.js's per-item options (strict topic,
 * caseSensitive, dictation, spelled-out words) plus the opt-in v2 rules (see check.js):
 * doublets always, politeCase always, paradigm on spine/lexicon topics and error corrections
 * (never on a dictation, where the audio decides).
 */
export function v2CheckOptions(item, accepted = acceptedOf(item)) {
  const base = checkOptionsFor({ ...item, accepted });
  return {
    ...base,
    doublets: true,
    politeCase: true,
    spacing: true,
    paradigm: !base.dictation && (PARADIGM_TOPIC_RE.test(String((item && item.topic) || '')) || (item && item.type) === 'error_correction'),
  };
}

/** A cloze answers from options/choices when it has them, else it is typed. */
export function isChoiceItem(item) {
  if (!item) return false;
  if (CHOICE_TYPES.includes(item.type)) return true;
  return item.type === 'cloze' && Array.isArray(item.options) && item.options.length > 0;
}

const squash = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

function checkChoice(item, input) {
  const accepted = acceptedOf(item);
  const user = squash(input);
  if (!user) return { result: RESULT.WRONG, expected: accepted[0] || '' };
  for (const a of accepted) if (squash(a) === user) return { result: RESULT.CORRECT, expected: a };
  for (const a of accepted) if (squash(a).toLowerCase() === user.toLowerCase()) return { result: RESULT.CORRECT, expected: a };
  return { result: RESULT.WRONG, expected: accepted[0] || '' };
}

const digitsOf = (s) => String(s ?? '').replace(/\D+/g, '');
const wordsOf = (s) => squash(String(s ?? '').replace(/[\d]+(?:[\s.,:/-]+\d+)*/g, ' ').replace(/[.,:;!?()[\]/]/g, ' '));
const RANK = { [RESULT.CORRECT]: 2, [RESULT.TYPO]: 1, [RESULT.WRONG]: 0 };
const better = (a, b) => (b && (!a || RANK[b.result] > RANK[a.result]) ? b : a);

/** A run of digits with its separators („8.30", „0341/22 58 90" after the dictation fold). */
const DIGIT_RUN_RE = /\d+(?:[.,:/]\d+)*/g;

/** Every number word read as digits, dashes and digit grouping folded: „zehn Minuten" → „10 Minuten". */
const foldNumbers = (s) => normalizeDictation(foldNumberWords(normalizeDictation(s)));

/**
 * The whole answer against `forms`, digits exact: the digit runs of both sides (number words read
 * as digits) must be the same numbers in the same order, and the answer with every run masked is
 * then graded by the checker (`dictation` adds its folds; one typo-class slip in a word stays a
 * TYPO). There is no words-may-be-left-out shortcut: „10" alone answers neither „halb zehn" nor
 * „Wir sind zehn Minuten von der Brücke.".
 */
function checkWholeNumber(item, input, forms, dictation) {
  let best = { result: RESULT.WRONG, expected: forms[0] || '' };
  if (!squash(input)) return best;
  const runs = (s) => (s.match(DIGIT_RUN_RE) || []).map(digitsOf).join('|');
  const mask = (s) => s.replace(DIGIT_RUN_RE, ' # ');
  const user = foldNumbers(input);
  for (const a of forms) {
    const want = foldNumbers(a);
    if (runs(want) !== runs(user)) continue;
    const out = checkAnswer(mask(user), [mask(want)], { dictation, caseSensitive: item.caseSensitive === true, doublets: true, politeCase: true });
    if (RANK[out.result] > RANK[best.result]) best = { result: out.result, expected: a, ...(out.reason ? { reason: out.reason } : {}) };
    if (best.result === RESULT.CORRECT) break;
  }
  return best;
}

function checkNumber(item, input) {
  const accepted = acceptedOf(item);
  const rawDigits = digitsOf(input);
  let best = null;
  if (!rawDigits) {
    // A time or number written in words („halb zehn") is judged like a name:
    // exactly, with only the checker's case rule as a retry.
    const wordedForms = accepted.filter((a) => !digitsOf(a));
    best = wordedForms.length ? checkName({ ...item, accepted: wordedForms }, input) : null;
    if (best && best.result !== RESULT.WRONG) return best;
  }
  // a worded key with number words („halb zehn", „zweihundert") is also answered in digits
  // („halb 10", „200") — as a whole, never by its digits alone
  const wordedNumbers = accepted.filter((a) => !digitsOf(a) && /\d/.test(foldNumberWords(a)));
  if (wordedNumbers.length) {
    best = better(best, checkWholeNumber(item, input, wordedNumbers, false));
    if (best.result === RESULT.CORRECT) return best;
  }
  // „zweihundert" typed where „200" is accepted: the number word counts as its digits
  const userInput = rawDigits ? input : foldNumberWords(input);
  const userDigits = digitsOf(userInput);
  let typo = null;
  if (userDigits) {
    for (const a of accepted) {
      if (!digitsOf(a) || digitsOf(a) !== userDigits) continue;
      const userWords = wordsOf(userInput);
      const want = wordsOf(a);
      // „0341 90 12 33" for „0341 90 12 33": digits are the task; the words around
      // them may be left out, never wrong.
      if (!userWords || userWords.toLowerCase() === want.toLowerCase()) return { result: RESULT.CORRECT, expected: a };
      const words = checkAnswer(userWords, want, { caseSensitive: item.caseSensitive === true, doublets: true, politeCase: true });
      if (words.result === RESULT.CORRECT) return { result: RESULT.CORRECT, expected: a };
      if (words.result === RESULT.TYPO && !typo) typo = { result: RESULT.TYPO, expected: a };
    }
  }
  return better(best, typo) || { result: RESULT.WRONG, expected: accepted[0] || '' };
}

/**
 * `exact: 'number'` on a dictation: the whole sentence, digits exact (review a2.2-u04 r3 F04) —
 * checkWholeNumber with the dictation folds.
 */
function checkDictationNumber(item, input) {
  return checkWholeNumber(item, input, acceptedOf(item), true);
}

/** One slip: a substitution, an insertion, a deletion or two neighbours swapped (Damerau ≤ 1). */
function oneSlip(a, b) {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff = [...a].map((ch, i) => (ch === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (diff.length === 1) return true;
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
  }
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0; i < l.length; i += 1) if (l.slice(0, i) + l.slice(i + 1) === s) return true;
  return false;
}

/**
 * A letter slip in a number word („nuen" for „neun") is a TYPO like any word; a wrong VALUE stays
 * WRONG (review a1.1-u04 r3, orchestrator 2026-09-27). Every word of the answer that is no number
 * word itself but one slip away from the spelled value of a number the key holds is read as that
 * number; the repaired answer is returned, or null when nothing was repaired. Only spelled values of
 * ≥ 4 letters (neun, null, eins, zwei …): a slip in „elf" cannot be told from another word.
 */
function repairNumberSlips(input, accepted) {
  const targets = new Map(); // normalised spelling → digits
  const add = (value) => {
    const w = spellCardinal(value);
    if (w && w.length >= 4) targets.set(normalizeAnswer(w), String(value));
  };
  for (const a of accepted) {
    for (const run of String(a).match(/\d+/g) || []) add(Number(run));
    for (const m of String(a).matchAll(/\p{L}+/gu)) {
      const v = cardinalValue(m[0]);
      if (v !== null) add(v);
    }
  }
  if (!targets.size) return null;
  let changed = false;
  const out = String(input ?? '').replace(/\p{L}+/gu, (word) => {
    if (cardinalValue(word) !== null || ordinalValue(word) !== null) return word;
    const w = normalizeAnswer(word);
    for (const [spelled, digits] of targets) {
      if (oneSlip(w, spelled)) {
        changed = true;
        return digits;
      }
    }
    return word;
  });
  return changed ? out : null;
}

/** A clock time with a leading zero („09.10", „07:30") written without it; any other digit run is untouched. */
const foldTimeZero = (s) => String(s ?? '').replace(/(^|[^\d.:])0(\d[.:]\d{2})(?![\d])/g, '$1$2');

// ── prices (2026-09-28, the level reviews: „890,00" / „890,-" for the key „890" was WRONG) ──
/** The zero cents or the dash of a whole-euro price: „890,00", „890.00", „890,-", „890,–" → „890". */
const PRICE_TAIL_RE = /(\d)[.,](?:00|-{1,2}|[–—])(?!\d)/g;
/** A currency written next to a number: „890 €", „890€", „890 EUR", „890 Euro", „€ 890". */
const CURRENCY_AFTER_RE = /(\d)\s*(?:€|eur\b|euro\b)/gi;
const CURRENCY_BEFORE_RE = /(?:€|\beur\b|\beuro\b)\s*(\d+(?:[.,]\d+)*)/gi;
const hasCurrency = (s) => new RegExp(CURRENCY_AFTER_RE.source, 'i').test(s) || new RegExp(CURRENCY_BEFORE_RE.source, 'i').test(s);
const foldPriceTail = (s) => String(s ?? '').replace(PRICE_TAIL_RE, '$1');
/** Every currency next to a number as „ Euro" after it („890 €" = „€ 890" = „890 EUR" = „890 Euro"). */
const canonicalCurrency = (s) => String(s ?? '').replace(CURRENCY_BEFORE_RE, '$1 Euro').replace(CURRENCY_AFTER_RE, '$1 Euro');
const stripCurrency = (s) => String(s ?? '').replace(CURRENCY_AFTER_RE, '$1').replace(CURRENCY_BEFORE_RE, '$1').replace(/\s+([.,!?])/g, '$1').trim();

/** Is the currency printed right next to the gap („kosten zusammen ___ Euro")? Then writing it is the number-only TYPO. */
const currencyAtGap = (item) => {
  const nb = item && item.type === 'fill_blank' ? gapNeighbours(item.promptDe) : null;
  const cur = (w) => ['euro', 'eur', '€'].includes(w);
  return Boolean(nb && (cur(nb.before) || cur(nb.after)));
};

/**
 * A price is its value however it is written (the level reviews, 2026-09-28): the zero cents and the
 * whole-euro dash fold away on both sides („890" = „890,00" = „890.00" = „890,-" = „890,–"; the key
 * „320,00" takes „320"), and a currency next to the number is one thing whichever way it is written
 * („€", „EUR", „Euro", before or after) — the answer may add it where the key has none („890 €",
 * „890,– €"), except where the prompt prints it next to the gap: that stays the number-only TYPO of
 * gapFrameRule. A key with cents keeps its cents („1,99" = „1.99", never „1,90"): the digits stay
 * exact, as everywhere on an exact-number item. Only ever an upgrade of the plain reading.
 */
function priceAlternative(item, input, accepted, grade) {
  // a dictation transcribes: its currency may be written as „€" for „Euro", never added or left out
  const stripAllowed = !currencyAtGap(item) && !isDictationTask(item);
  let best = null;
  accepted.forEach((a) => {
    const keyTail = foldPriceTail(a);
    const keyCur = hasCurrency(keyTail);
    const key = keyCur ? canonicalCurrency(keyTail) : keyTail;
    const userTail = foldPriceTail(input);
    const user = keyCur ? canonicalCurrency(userTail) : stripAllowed ? stripCurrency(userTail) : userTail;
    if (key === a && user === input) return;
    const out = grade({ ...item, accepted: [key] }, user);
    if (out.result !== RESULT.WRONG && (!best || RANK[out.result] > RANK[best.result])) best = { ...out, expected: a };
  });
  return best;
}

/** exact: 'number' — digits (dictation: the whole sentence), a price in any of its forms, then the number-word slip rule. */
function checkExactNumber(item, input) {
  const accepted = acceptedOf(item);
  const folded = accepted.map(foldTimeZero);
  // „09.10" is the time „9.10" (a1.1-u10 r1 F05 / r3 F06): both sides lose a clock time's leading zero
  const timed = { ...item, accepted: folded };
  const back = (out) => ({ ...out, expected: accepted[folded.indexOf(out.expected)] ?? out.expected });
  const grade = isDictationTask(item) ? checkDictationNumber : checkNumber;
  const userInput = foldTimeZero(input);
  let out = back(grade(timed, userInput));
  if (out.result === RESULT.CORRECT) return out;
  const priced = priceAlternative(timed, userInput, folded, grade);
  if (priced && RANK[priced.result] > RANK[out.result]) out = back(priced);
  if (out.result !== RESULT.WRONG) return out;
  const repaired = repairNumberSlips(userInput, folded);
  if (!repaired) return out;
  const again = back(grade(timed, repaired));
  return again.result === RESULT.WRONG ? out : { result: RESULT.TYPO, expected: again.expected };
}

/** An answer typed letter by letter („B-E-R-I-S-H-A.", „B, E, R …", „b e r"). */
const SPELLED_INPUT_RE = /^\p{L}(?:[\s,.;\-\u2010-\u2015]+\p{L})+[\s.,!]*$/u;

function checkName(item, input) {
  const accepted = acceptedOf(item);
  const opts = v2CheckOptions(item, accepted);
  const out = checkAnswer(input, accepted, opts);
  if (out.result === RESULT.CORRECT) return out;
  // A name written down letter by letter, as it is spelled on the audio, is the name — whether or
  // not the item lists a spelled form (a1.1-u02 r3 F02, the q01 proof item): every letter counts.
  if (SPELLED_INPUT_RE.test(String(input ?? '').trim())) {
    const letters = normalizeAnswer(normalizeSpelling(input)).replace(/[^\p{L}]/gu, '');
    const hit = accepted.find((a) => normalizeAnswer(a).replace(/[^\p{L}]/gu, '') === letters);
    if (hit) return { result: RESULT.CORRECT, expected: hit };
  }
  // A letter slip is a different name. Only the checker's case rule may still retry.
  if (out.result === RESULT.TYPO && out.reason !== 'case') return { result: RESULT.WRONG, expected: out.expected };
  if (out.result === RESULT.WRONG && opts.spelling) {
    const user = normalizeSpelling(input).toLowerCase();
    const hit = accepted.find((a) => normalizeSpelling(a).toLowerCase() === user);
    if (hit) return { result: RESULT.CORRECT, expected: hit };
  }
  return out;
}

/** The SCHEMA error tag of a miss, else check.js's descriptive tag. */
export function errorTagFor(item, input, expected) {
  if (item && Array.isArray(item.errorTags) && item.errorTags.length) return item.errorTags[0];
  if (item && item.errorTag) return item.errorTag;
  return tagError(item, input, expected);
}

/** A typed answer by the item's `exact` rule (or the checker's own rule). */
function checkTyped(item, input) {
  if (item.exact === 'number') return checkExactNumber(item, input);
  if (item.exact === 'name') return checkName(item, input);
  const accepted = acceptedOf(item);
  return checkAnswer(input, accepted, v2CheckOptions(item, accepted));
}

// ── error_correction ─────────────────────────────────────────────────────────────

const QUOTE_RE = /„([^“”"]+)[“”"]|"([^"]+)"|«([^»]+)»/g;

/**
 * The sentence an error_correction prompt asks to correct (ItemView prefills it): the first
 * quotation after the prompt's last colon outside quotes, else its longest quotation — never a
 * word the prompt only names („Korrigieren Sie die Position von „nicht“: „…““, a1.1-u08 r1 F01).
 */
export function quotedSentence(promptDe) {
  const text = String(promptDe || '');
  const quotes = [...text.matchAll(QUOTE_RE)]
    .map((m) => ({ at: m.index, text: (m[1] || m[2] || m[3]).trim() }))
    .filter((q) => q.text.length >= 2);
  if (!quotes.length) return null;
  const colon = text.replace(QUOTE_RE, (m) => ' '.repeat(m.length)).lastIndexOf(':');
  const after = colon >= 0 ? quotes.find((q) => q.at > colon) : null;
  return (after || quotes.reduce((a, b) => (b.text.length > a.text.length ? b : a))).text;
}

/** An answer as the checker compares it: normalised, punctuation folded, lower-case. */
const prep = (s) => stripPunct(normalizeAnswer(s));

/**
 * An error correction (a1.1-u03 r2/r3 F01, u10 r3 F03): the quoted wrong sentence itself is
 * WRONG — ItemView prefills it, so the unchanged sentence used to pass as a „typo" — and the
 * token(s) in which the key corrects the quote are compared strictly: a slip there is the
 * error the item is about („Ist das meine Mutter?" for „Ist das deine Mutter?").
 */
function errorCorrectionRule(item, input, out) {
  const quote = quotedSentence(item.promptDe);
  if (!quote) return out;
  const q = prep(quote);
  const accepted = acceptedOf(item);
  if (prep(input) === q && !accepted.some((a) => prep(a) === q)) return { result: RESULT.WRONG, expected: accepted[0] || '' };
  if (out.result !== RESULT.TYPO || out.reason === 'case') return out;
  const key = prep(out.expected).split(' ');
  const user = prep(input).split(' ');
  if (key.length !== user.length) return out;
  const quoteWords = q.split(' ');
  const corrected = new Set(key.filter((w) => !quoteWords.includes(w)));
  const slipOnCorrection = key.some((w, i) => w !== user[i] && corrected.has(w));
  return slipOnCorrection ? { result: RESULT.WRONG, expected: out.expected } : out;
}

// ── fill_blank: the word next to the gap ─────────────────────────────────────────

const GAP_RE = /_{2,}/;
/** Symbols a unit word printed next to a gap may be typed as. */
const UNIT_SYMBOLS = Object.freeze({ euro: ['€', 'eur'], prozent: ['%'], grad: ['°'] });

/** The words printed directly before and after the gap of a prompt (normalised), or null. */
function gapNeighbours(promptDe) {
  const text = String(promptDe || '');
  const m = GAP_RE.exec(text);
  if (!m) return null;
  const word = (s) => (s ? prep(s) : '');
  const before = word((text.slice(0, m.index).match(/(\S+)\s*$/) || [])[1]);
  const after = word((text.slice(m.index + m[0].length).match(/^\s*(\S+)/) || [])[1]);
  return { before, after };
}

/**
 * „88 Euro" for „kosten zusammen ___ Euro": the learner wrote the value AND the word printed
 * next to the gap. That is the right value, so a TYPO with a hint (reason 'number-only' /
 * 'word-only'), never WRONG. Only the neighbour words (or their symbols) may be dropped.
 */
function gapFrameRule(item, input, out) {
  if (out.result !== RESULT.WRONG || item.type !== 'fill_blank') return out;
  const nb = gapNeighbours(item.promptDe);
  if (!nb || (!nb.before && !nb.after)) return out;
  const forms = (w) => (w ? [w, ...(UNIT_SYMBOLS[w] || [])] : []);
  let tokens = String(input ?? '').trim().split(/\s+/).filter(Boolean);
  let stripped = false;
  if (tokens.length > 1 && forms(nb.before).includes(prep(tokens[0]))) { tokens = tokens.slice(1); stripped = true; }
  if (tokens.length > 1 && forms(nb.after).includes(prep(tokens[tokens.length - 1]))) { tokens = tokens.slice(0, -1); stripped = true; }
  if (!stripped && tokens.length === 1) {
    // „890€": a unit symbol glued to the value
    const glued = /^(.+?)(€|%|°)$/.exec(tokens[0]);
    if (glued && forms(nb.after).includes(glued[2])) { tokens = [glued[1]]; stripped = true; }
  }
  if (!stripped) return out;
  const again = checkTyped(item, tokens.join(' '));
  if (again.result === RESULT.WRONG) return out;
  return { result: RESULT.TYPO, expected: again.expected, reason: item.exact === 'number' ? 'number-only' : 'word-only' };
}

// ── form_fill (sd1.s1, ta2.s1) ──────────────────────────────────────────────────

/**
 * Frame words of a form entry: never the information itself (a1.1-u05 r2/r3 F01) — numbering and
 * units, prepositions and articles, and the time of day around a time or a day (a1.1-u09 r2/r3 F03:
 * „um 19.30 Uhr abends", „Freitag, am Abend"). A time-of-day word the label offers as an
 * alternative („vormittags oder nachmittags?") is the information there, and never licensed.
 */
const BASIC_FRAME = new Set(['nr', 'fuer', 'nur', 'jahre', 'jahr', 'alt', 'person', 'personen', 'leute', 'uhr', 'um', 'am', 'im', 'in', 'der', 'die', 'das', 'den', 'dem', 'des']);
const FORM_FRAME = new Set([
  ...BASIC_FRAME,
  'morgens', 'vormittags', 'mittags', 'nachmittags', 'abends', 'nachts', 'morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht',
]);
/** The Anrede before a personal name („Frau Olena Kovalenko"). */
const NAME_FRAME = new Set(['frau', 'herr', 'herrn']);
const NEGATION = new Set(['nicht', 'kein', 'keine']);
const STREET_RE = /(strasse|str|weg|platz|gasse|allee|ring|damm|ufer)\b/;

/** A form token as the frame rule compares it: normalised, diacritics of other scripts folded (İzmir = Izmir). */
const formTok = (w) => normalizeAnswer(w).normalize('NFD').replace(/\p{M}+/gu, '').replace(/[.]+$/, '');
/** Split an entry into tokens: spaces and the separators „, / ( ) – ;", a hyphen between letters, a colon before a space. */
const formTokens = (s) => String(s ?? '').split(/[\s,/()[\]–—;!?„“"]+|:(?=\s|$)|(?<=\p{L})-(?=\p{L})/u).filter(Boolean);
const hasLetter = (t) => /\p{L}/u.test(t);

/** The label's alternatives („Kurs: in Leipzig oder online?") as sets of content tokens, or []. */
function labelAlternatives(labelDe) {
  const tail = String(labelDe || '').split(':').pop();
  if (!/\boder\b/i.test(tail)) return [];
  return tail.split(/,|\boder\b/i)
    .map((p) => new Set(formTokens(p).map(formTok).filter((t) => t && !BASIC_FRAME.has(t))))
    .filter((set) => set.size > 0);
}

/** What may stand beside a form value: the field's frame, label, forms and the situation's same-fact sentence. */
function formContext(item) {
  const accepted = acceptedOf(item);
  const contentOf = (s) => formTokens(s).map(formTok).filter((t) => t && hasLetter(t) && !BASIC_FRAME.has(t));
  const keyTokens = new Set(accepted.flatMap(contentOf));
  const alternatives = labelAlternatives(item.labelDe);
  // the key's own alternative is decided by the key itself (`answer`), never by an accepted
  // variant that names the other one negated („online, nicht in Leipzig")
  const answerTokens = new Set(contentOf(item.answer || accepted[0] || ''));
  const own = alternatives.find((set) => [...set].some((t) => answerTokens.has(t))) || null;
  const others = new Set(alternatives.filter((set) => set !== own).flatMap((set) => [...set]));
  const licensed = new Set();
  // a number word licenses its digits too („zwei Kinder" → „2 Kinder", „vierundzwanzig" → „24"):
  // digits equal the number word in a frame, as on every exact-number item (level review s1 #4)
  const add = (t) => {
    if (!t || others.has(t) || !hasLetter(t)) return;
    licensed.add(t);
    const v = cardinalValue(t);
    if (v !== null && !others.has(String(v))) licensed.add(String(v));
  };
  formTokens(item.labelDe).map(formTok).forEach(add);
  // the field's own forms: a digit in one of them licenses its number word („2 Kinder" → „zwei Kinder")
  for (const t of accepted.flatMap((a) => formTokens(a).map(formTok))) {
    add(t);
    if (/^\d+$/.test(t)) add(formTok(spellCardinal(Number(t)) || ''));
  }
  const sentences = String(item.situationDe || '').split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const toks = formTokens(sentence).map(formTok);
    if (toks.some((t) => keyTokens.has(t))) toks.forEach(add);
  }
  // the keys of the form's other fields („am Freitag um 19.30 Uhr" in the day field), digits included —
  // their keys only, never their accepted variants (u02 f5 accepts „online, nicht in Leipzig")
  const otherValues = new Set();
  for (const a of Array.isArray(item.otherAnswers) ? item.otherAnswers : []) {
    for (const t of formTokens(a).map(formTok)) if (t && !others.has(t) && !keyTokens.has(t)) otherValues.add(t);
  }
  if (item.exact === 'name' || /\bname\b/i.test(String(item.labelDe || ''))) NAME_FRAME.forEach(add);
  const street = accepted.some((a) => STREET_RE.test(formTok(a)) && /\d/.test(a));
  const cities = new Set(street ? formTokens(item.situationDe).filter((t) => /^\p{Lu}/u.test(t)).map(formTok).filter((t) => !others.has(t)) : []);
  return { licensed, others, street, cities, otherValues };
}

/**
 * A letter slip in a licensed word: one edit from a licensed word (or another field's key) of ≥ 5
 * letters — the checker's own typo distance (check.js) — and not a slip of the label's other
 * alternative („Leipzg" for the negated-only „Leipzig" stays unlicensed).
 */
function licensedSlip(w, ctx) {
  if (!hasLetter(w) || NEGATION.has(w) || ctx.others.has(w) || /\d/.test(w)) return false;
  const near = (x) => x.length >= 5 && Math.abs(x.length - w.length) <= 1 && levenshtein(w, x) === 1;
  if ([...ctx.others].some(near)) return false;
  return [...ctx.licensed].some(near) || [...ctx.otherValues].some(near);
}

/** Which tokens may stand OUTSIDE the value: frame, licensed words, negated alternatives, a street's postcode and city. */
function licensedMask(tokens, ctx) {
  const t = tokens.map(formTok);
  const mask = t.map((w) => FORM_FRAME.has(w) || ctx.licensed.has(w) || ctx.otherValues.has(w) || (ctx.street && (/^\d{5}$/.test(w) || ctx.cities.has(w))));
  // „nicht in Leipzig": a negation and the other alternative it negates
  t.forEach((w, i) => {
    if (!NEGATION.has(w)) return;
    let j = i + 1;
    let negated = false;
    while (j < t.length && (FORM_FRAME.has(t[j]) || ctx.others.has(t[j]))) {
      if (ctx.others.has(t[j])) { negated = true; mask[j] = true; }
      j += 1;
    }
    mask[i] = negated;
  });
  // an alternative the label offers and the entry does not negate is never licensed
  t.forEach((w, i) => { if (ctx.others.has(w) && !(i > 0 && mask[i] && t.slice(0, i).some((x) => NEGATION.has(x)))) mask[i] = false; });
  return mask;
}

/** Letter words of an entry that are neither frame nor number words („Berliner Straße" of „Berliner Straße 21"). */
const contentWords = (s) => formTokens(foldNumberWords(s)).map(formTok).filter((t) => hasLetter(t) && !FORM_FRAME.has(t) && !/^\d/.test(t));

/** Does a text hold a number, as digits or as a German number word? */
const holdsNumber = (s) => /\d/.test(foldNumberWords(s));

/**
 * One candidate value of a form field: the field's own check, case free, a street key's words required.
 * A number written as digits equals its number word („verheiratet, 2 Kinder" = „verheiratet, zwei
 * Kinder"; level review s1 #4): the entry is then read as checkWholeNumber reads an exact-number key —
 * the same numbers in the same order, digits exact, the words around them graded as usual — so a
 * wrong number never becomes a one-letter slip.
 */
function formBase(item, value) {
  let out = checkTyped(item, value);
  if (out.result === RESULT.WRONG && item.exact !== 'name' && item.exact !== 'number' && (holdsNumber(value) || acceptedOf(item).some(holdsNumber))) {
    const worded = checkWholeNumber(item, value, acceptedOf(item), false);
    if (worded.result !== RESULT.WRONG) out = worded;
  }
  if (out.result === RESULT.TYPO && out.reason === 'case') out = { result: RESULT.CORRECT, expected: out.expected };
  if (out.result !== RESULT.WRONG && item.exact === 'number' && contentWords(out.expected).length && !contentWords(value).length) {
    return { result: RESULT.WRONG, expected: out.expected };
  }
  return out;
}

/** A compound of the key and a licensed word („Onlinekurs") as two tokens. */
function splitCompounds(tokens, item, ctx) {
  const keys = acceptedOf(item).map(formTok).filter((k) => k.length >= 3 && !k.includes(' '));
  return tokens.flatMap((tok) => {
    const w = formTok(tok);
    const part = (x) => ctx.licensed.has(x) || FORM_FRAME.has(x);
    for (const k of keys) {
      if (w !== k && w.startsWith(k) && part(w.slice(k.length))) return [tok.slice(0, k.length), tok.slice(k.length)];
      if (w !== k && w.endsWith(k) && part(w.slice(0, w.length - k.length))) return [tok.slice(0, tok.length - k.length), tok.slice(tok.length - k.length)];
    }
    return [tok];
  });
}

/**
 * form_fill: the whole entry, else the best window of it whose surrounding tokens are all
 * licensed (see formContext / licensedMask); inside the window, frame words may be left out
 * („Berliner Straße Nr. 21"). A result is only ever upgraded by the frame, never downgraded.
 */
function checkFormField(item, input) {
  const direct = formBase(item, input);
  if (direct.result === RESULT.CORRECT) return direct;
  const ctx = formContext(item);
  const tokens = splitCompounds(formTokens(input), item, ctx);
  if (!tokens.length || tokens.length > 16) return direct;
  const mask = licensedMask(tokens, ctx);
  // a letter slip in a licensed word outside the value (a1.1-u02 f1 „Izmir, Turkei"): the window
  // may stand beside it, and the entry is then at best a TYPO — its retry, never WRONG
  const slip = tokens.map((tk, k) => !mask[k] && licensedSlip(formTok(tk), ctx));
  const ok = (k) => mask[k] || slip[k];
  let best = direct;
  for (let i = 0; i < tokens.length; i += 1) {
    if (i > 0 && !ok(i - 1)) break; // every token before the window must be licensed
    for (let j = tokens.length; j > i; j -= 1) {
      if (j < tokens.length && !ok(j)) break; // … and every token after it
      const slipped = slip.some((x, k) => x && (k < i || k >= j));
      const windowTokens = tokens.slice(i, j);
      const variants = [windowTokens, windowTokens.filter((tk) => !FORM_FRAME.has(formTok(tk)))];
      for (const v of variants) {
        if (!v.length || (i === 0 && j === tokens.length && v === windowTokens)) continue;
        let out = formBase(item, v.join(' '));
        if (slipped && out.result === RESULT.CORRECT) out = { result: RESULT.TYPO, expected: out.expected };
        if (RANK[out.result] > RANK[best.result]) best = out;
        if (best.result === RESULT.CORRECT) return best;
      }
    }
  }
  return best;
}

/**
 * checkItem(item, input) → { result, correct, typo, expected, errorTag, reason? }
 * `result` is RESULT.CORRECT | TYPO | WRONG (a TYPO earns one retry, standard §3);
 * `errorTag` is null unless the answer is wrong; `reason` ('case' | 'number-only' |
 * 'word-only') says what a TYPO's retry notice should point at.
 */
export function checkItem(item, input) {
  if (!item) return { result: RESULT.WRONG, correct: false, typo: false, expected: '', errorTag: null };
  let out;
  if (isChoiceItem(item)) out = checkChoice(item, input);
  else if (item.type === 'form_fill') out = checkFormField(item, input);
  else {
    out = checkTyped(item, input);
    if (item.type === 'error_correction') out = errorCorrectionRule(item, input, out);
    out = gapFrameRule(item, input, out);
  }
  const correct = out.result === RESULT.CORRECT;
  const typo = out.result === RESULT.TYPO;
  return {
    result: out.result,
    correct,
    typo,
    expected: out.expected || '',
    errorTag: out.result === RESULT.WRONG ? errorTagFor(item, input, out.expected) : null,
    ...(typo && out.reason ? { reason: out.reason } : {}),
  };
}

/**
 * The onAttempt / onResult payload of the shared contract:
 * { itemId, stepId, correct, answer, errorTag, typo }.
 */
export function attemptPayload(item, stepId, answer, checked = checkItem(item, answer)) {
  return {
    itemId: item && item.id ? String(item.id) : '',
    stepId: stepId || null,
    correct: !!checked.correct,
    answer: String(answer ?? ''),
    errorTag: checked.correct ? null : checked.errorTag || null,
    typo: !!checked.typo,
  };
}

export default checkItem;
