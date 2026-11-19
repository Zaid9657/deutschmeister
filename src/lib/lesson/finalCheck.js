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
import { RESULT, checkAnswer, levenshtein, numberWordsToDigits } from './check.js';
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

/**
 * Arabic-Indic and Persian digits are digits: an Arabic phone keyboard writes „٠٤٢١" for 0421, and the
 * blind corpus of 2026-11-19 had a teacher mark it right where the check marked it wrong.
 */
export const westernDigits = (s) => String(s ?? '').replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf)));

/** A heard number as the learner writes it: one group of digits per spoken group („null vier zwei eins, sechs drei acht" → „0421 638"). */
export const digitsOf = (said) => String(said).split(/[,–-]/).map((group) => numberWordsToDigits(group).replace(/\D/g, '')).filter(Boolean).join(' ');

/**
 * Every word the level teaches (its Wortfeld, with plurals and the plain present forms of its
 * verbs), folded. A gap word the course teaches must be one of the turn's `slotWords`; a word the
 * course never teaches is the learner's own (Syrien, Krankenpfleger, Kurdisch) and is welcome.
 */
export function courseLexicon(curriculum) {
  const known = new Set();
  for (const l of curriculum?.lektionen || []) {
    // The cast's names are course words too: „Ich bin Ana" names no job.
    for (const line of l.dialog?.lines || []) for (const token of String(line.speaker).split(/\s+/)) known.add(fold(token));
    for (const w of l.wortfeld || []) {
      for (const text of [w.de, w.word, w.plural]) for (const token of String(text || '').split(/[^\p{L}]+/u)) if (token) known.add(fold(token));
      const verb = !w.article && /^[a-zäöü]+e?n$/.test(w.word || '') ? w.word.replace(/e?n$/, '') : null;
      if (verb) for (const ending of ['e', 'st', 't', 'en', 'et']) known.add(fold(verb + ending));
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
    const turn = check.lexicon && (picked.slotWords || picked.parts || picked.slotIn) ? { ...picked, lexicon: check.lexicon } : picked;
    if (turn.listen) return { ...turn, accepted: [digitsOf(turn.listen)], spoken: turn.listen };
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

/** A real calendar date in digits („3.5.1998", „12. 8. 1990"), or a day with a month name („3. Mai 1998"). */
function isDate(words) {
  const m = words.match(/^(\d{1,2})\.\s?(?:(\d{1,2})\.|(\p{L}+))\s?(\d{4}|\d{2})?$/u);
  if (!m) return false;
  return Number(m[1]) >= 1 && Number(m[1]) <= 31 && (m[3] ? true : Number(m[2]) >= 1 && Number(m[2]) <= 12);
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

/** The same as a listed word, or that word with one slip. */
const near = (word, list) => list.some((w) => fold(w) === word || slip(word, fold(w)));

/**
 * The learner's own words fit the gap. A choice (`slotIn`: „meine Mutter oder meine Schwester") takes
 * one of its words, then at most a name. The kinds: a number, an age of „Jahre", a phone number, a real
 * date; a place, a job or languages, whose words are each one of the taught words that fit
 * (`slotWords`) or a word the course never teaches (the learner's own: Syrien, Krankenpfleger,
 * Kurdisch) — so „Ich bin müde" is no job and „Sie spricht Brot" no language. Returns CORRECT, TYPO
 * (a slip in a choice) or WRONG.
 */
function gapResult(words, { slot = 'words', slotIn, slotNot = [], slotWords = [], lexicon }) {
  const raw = words.split(' ').filter(Boolean);
  const parts = raw.map(fold);
  const known = (w) => typeof lexicon?.has === 'function' && lexicon.has(w);
  // A word of the kind: one of the taught words that fit, or the learner's own word the course never teaches.
  const fits = (w) => /\p{L}/u.test(w) && !CLOSED.has(w) && (near(w, slotWords) || !known(w));
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
  // A place: an optional article („aus der Türkei"), then the place, which may be followed by „und …"
  // or „, …" („aus Marokko und wohne in Bremen", the scene's own line). „aus in Bremen" names none.
  if (slot === 'place') {
    // After „aus" and „in" a place takes the dative: „aus der Türkei", „aus dem Irak", never „aus die
    // Deutschland"; and a place the course names has no article at all („in der Bremen").
    if (['die', 'das', 'den'].includes(parts[0])) return RESULT.WRONG;
    if (['der', 'dem'].includes(parts[0]) && near(parts[1] || '', slotWords)) return RESULT.WRONG;
    const head = parts.slice(['der', 'dem'].includes(parts[0]) ? 1 : 0);
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
  // Languages: every one listed is a language (or a word like „gut", „ein bisschen"), and at least one
  // is spoken, not only „kein Deutsch". „Deutsch und Marokko" lists a country.
  if (slot === 'language') {
    const groups = words.split(/\s*(?:,|\bund\b|\boder\b)\s*/i).map((g) => g.split(' ').map(fold).filter(Boolean)).filter((g) => g.length);
    const MODIFIERS = new Set(['gut', 'sehr', 'ein', 'bisschen', 'wenig', 'etwas', 'auch', 'nur', 'noch', 'perfekt', 'fliessend', 'kein', 'nicht']);
    const ok = groups.every((g) => g.some((w) => !MODIFIERS.has(w)) && g.every((w) => MODIFIERS.has(w) || fits(w)));
    const spoken = groups.some((g) => !g.some((w) => ['kein', 'nicht'].includes(w)));
    return groups.length && ok && spoken ? RESULT.CORRECT : RESULT.WRONG;
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
  const [head, tail = ''] = frame.split(GAP).map((s) => s.trim());
  const given = wordsOf(String(value || '').normalize('NFC').trim().replace(END, ''));
  const before = wordsOf(head).length;
  const after = wordsOf(tail.replace(END, '')).length;
  if (given.length <= before + after) return RESULT.WRONG;
  const own = given.slice(before, given.length - after).join(' ');
  const gap = gapResult(own.replace(/[.,!?]+$/, ''), turn);
  if (gap === RESULT.WRONG) return RESULT.WRONG;
  return worst(gap, checkAnswer(value, [[head, own, tail].filter(Boolean).join(' ')]).result);
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
  const sentences = String(value || '').split(/(?<=[.!?])\s+|\n+/)
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

/** RESULT.CORRECT, TYPO or WRONG for one typed answer. An own-name turn needs an opening and a name. */
export function typedResult(turn, value) {
  if (turn.ownName) {
    const ok = turn.accepted.some((o) => new RegExp(`^${fold(o)}\\s+\\p{L}`, 'u').test(fold(value)));
    return ok ? RESULT.CORRECT : RESULT.WRONG;
  }
  const text = westernDigits(value);
  if (turn.listen) {
    // A heard number is its digits: „Telefonnummer: 0421 3618" wrote down the right number with a label.
    const digits = (s) => numberWordsToDigits(s).replace(/\D/g, '');
    if (digits(text) && digits(text) === digits(turn.accepted[0])) return RESULT.CORRECT;
    return checkAnswer(text, turn.accepted, { dictation: true }).result;
  }
  if (turn.parts) return messageResult(turn, text);
  // A reply may open with „Und" („Und woher kommen deine Eltern?") and name the person it is said to
  // („Herr Weber, …", „…, Lena?"); the rest is the answer.
  const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
  const tries = [text];
  const named = text.trim().replace(/^(?:(?:Herr|Frau)\s+)?\p{Lu}\p{L}*,\s*/u, '').replace(/,\s*(?:(?:Herr|Frau)\s+)?\p{Lu}\p{L}*(?=\s*[?.!]*$)/u, '');
  if (named && named !== text.trim()) tries.push(cap(named));
  for (const t of [...tries]) {
    const rest = t.trim().replace(/^und[\s,]+/i, '');
    if (rest && rest !== t.trim()) tries.push(cap(rest));
  }
  // The family noun may stand where the pronoun stands (`nounFor`): „Meine Mutter kommt aus …" is
  // „Sie kommt aus …" with its noun, and the verb after it is graded just the same.
  for (const t of [...tries]) {
    for (const [pronoun, nouns] of Object.entries(turn.nounFor || {})) {
      for (const noun of nouns) if (fold(t).startsWith(`${fold(noun)} `)) tries.push(pronoun + t.trim().slice(noun.length));
    }
  }
  return best(tries.map((t) => sentenceResult(turn.accepted, t, turn)));
}

/**
 * A spoken try counts when it was measured (never "I said it") and what was recognised is an answer.
 * The transcript is graded like a typed answer, so speech and typing take the same answers and a
 * spoken „Ich bin verheiratet" is no job; a slip of spelling does not exist in speech, so a typo
 * counts. Only without a transcript does the plain measure decide (80 % of the words of the first
 * answer recognised); an own answer then counts when its opening was recognised and something
 * followed it (by the plain measure „Ich heiße Zaid" is 2 of 3 words of „Ich heiße").
 */
export function spokenShown(result, turn) {
  if (!result || result.selfConfirmed || typeof result.pct !== 'number') return false;
  // With a transcript, only the transcript decides: 4 of the 5 words of „Was sind Sie von Beruf?"
  // („Was Sie von Beruf?") is no question (DaF review, 2026-11-19).
  if (turn && typeof result.transcript === 'string' && result.transcript.trim()) return typedResult(turn, result.transcript) !== RESULT.WRONG;
  if (turn && ownAnswer(turn)) {
    if (!Array.isArray(result.words) || !result.words.length) return false;
    const hits = result.words.filter((w) => w.hit).length;
    return hits / result.words.length >= READALOUD_PASS_PCT && result.extra >= 1;
  }
  return result.pct >= READALOUD_PASS_PCT;
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
