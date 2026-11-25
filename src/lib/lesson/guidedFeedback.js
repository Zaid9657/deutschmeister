import { spelledPrompt, spellingApplies, RESULT } from './check.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';

const HINTS = {
  word_order: { de: 'Prüfen Sie die Reihenfolge der Wörter.', en: 'Check the order of the words.' },
  dictation: { de: 'Hören Sie noch einmal auf die ganze Zeile.', en: 'Listen to the whole line again.' },
  listen_select: { de: 'Hören Sie noch einmal und vergleichen Sie die Zeilen.', en: 'Listen again and compare the lines.' },
  match: { de: 'Vergleichen Sie die Bedeutungen noch einmal.', en: 'Compare the meanings again.' },
  spelling: { de: 'Prüfen Sie jeden Buchstaben und seine Reihenfolge.', en: 'Check each letter and its order.' },
  sentence_building: { de: 'Prüfen Sie die Reihenfolge der Wörter und die Verbform.', en: 'Check the word order and the verb form.' },
  // A correction names its repair („Korrigieren Sie das Verb:“); the hint points back to it and never
  // to another one (2026-11-19 browser play: the verb task was told to check spelling and punctuation).
  error_correction: { de: 'Lesen Sie noch einmal, was Sie korrigieren sollen.', en: 'Read again what the task asks you to correct.' },
};
// A gap hint names only what really stands there (browser walk 2026-11-25: „vor und nach der Lücke" where
// nothing stood before it). Two wordings without a common word: a hint may not hold the answer („der",
// „Sie"), and one of the two never does.
const GAP_HINTS = {
  both: [
    { de: 'Lesen Sie den Satz vor und nach der Lücke.', en: 'Read the sentence before and after the gap.' },
    { de: 'Was passt zum Text auf beiden Seiten?', en: 'What fits the text on both sides?' },
  ],
  before: [
    { de: 'Lesen Sie den Satz vor der Lücke.', en: 'Read the sentence before the gap.' },
    { de: 'Was passt ans Satzende?', en: 'What fits at the end of the sentence?' },
  ],
  after: [
    { de: 'Lesen Sie den Satz nach der Lücke.', en: 'Read the sentence after the gap.' },
    { de: 'Was passt als Satzanfang?', en: 'What fits as the beginning of the sentence?' },
  ],
  none: [
    { de: 'Lesen Sie die Aufgabe noch einmal.', en: 'Read the task again.' },
    { de: 'Was verlangt diese Übung genau?', en: 'What exactly does this exercise ask for?' },
  ],
};
/** Which side of the gap has text; the instruction („Ergänzen Sie das Verb:“) and the bracketed cue do not count. */
export function gapSide(item) {
  const text = String(item.questionDe || '').replace(/\([^)]*\)/g, ' ').replace(/^\p{Lu}\p{L}*n Sie\b[^:]*:/u, ' ');
  const [before, ...rest] = text.split(/_{2,}/);
  if (!rest.length) return 'none';
  const has = (s) => /[\p{L}\p{N}]/u.test(s);
  if (has(before)) return has(rest.join(' ')) ? 'both' : 'before';
  return has(rest.join(' ')) ? 'after' : 'none';
}
const NEUTRAL = [
  { de: 'Noch einmal.', en: 'Once more.' },
  { de: 'Versuchen Sie es erneut.', en: 'Try again.' },
  { de: 'Prüfen Sie Ihre Auswahl.', en: 'Reconsider your choice.' },
  { de: 'Überlegen Sie noch einmal.', en: 'Take another look.' },
];
const acceptedFor = (item) => item.type === 'match'
  ? item.pairs.flatMap((p) => [p.de, p.en]) : item.accepted?.length ? item.accepted : [item.answer];

/** Phrase boundaries avoid treating the letter A as an answer inside “again”. */
export function hintContainsAnswer(hint, item) {
  const fold = (s) => normalizeAnswer(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const text = ` ${fold(hint)} `;
  return acceptedFor(item).filter(Boolean).some((a) => text.includes(` ${fold(a)} `));
}

/** Never copy an unreviewed pool hint/rule card: those often contain the solution. */
export function hintFor(item) {
  const kind = spelledPrompt(item) || spellingApplies(acceptedFor(item)) ? 'spelling' : item.type || item.kind;
  const candidates = [...(kind === 'fill_blank' ? GAP_HINTS[gapSide(item)] : [HINTS[kind]]), ...NEUTRAL].filter(Boolean);
  const hint = candidates.find((h) => !hintContainsAnswer(h.de, item) && !hintContainsAnswer(h.en, item));
  if (!hint) throw new Error('No answer-free bilingual hint for item');
  return hint;
}

// The bank's tips are German. An English screen shows them in English, never a German sentence.
const TIPS_EN = [
  [/^(\d+) Buchstaben\.$/, '$1 letters.'],
  [/^der, die oder das\?$/, 'der, die or das?'],
  [/^Der Name, nicht der Laut\.$/, 'The name of the letter, not its sound.'],
  [/^Achten Sie auf die Reihenfolge der Buchstaben\.$/, 'Watch the order of the letters.'],
  [/^Achten Sie auf Doppelbuchstaben\.$/, 'Watch for double letters.'],
  [/^(\p{L}+ = \d+)$/u, '$1'],
  [/^(\p{L}+) \+ nächste Stunde$/u, '$1 + the next hour'],
];

/** A bank tip in the learner's language; null when there is none (or none in English). */
export function tipFor(hint, lang) {
  if (!hint || lang === 'de') return hint || null;
  const found = TIPS_EN.find(([pattern]) => pattern.test(hint));
  return found ? hint.replace(found[0], found[1]) : null;
}

export function guidedFeedback(item, checked, retryUsed, lang) {
  const hintOnly = checked.result === RESULT.WRONG && !retryUsed;
  // A filler hint ("Once more.") adds nothing beside the otter's "You have one more try".
  const hint = hintOnly ? hintFor(item) : null;
  return { ...checked, hintOnly, showAnswer: retryUsed,
    ...(hintOnly ? { hint: NEUTRAL.includes(hint) ? '' : hint[lang === 'de' ? 'de' : 'en'] } : {}) };
}

/**
 * The reason under a checked answer. `matched` is the accepted form the answer met (checkAnswer's
 * `expected`): tiles accept every licensed order, and the reason for another order than the
 * dialogue line's must not claim it IS the dialogue line's (2026-11-19 browser play: „Frei bin ich.“
 * was told „So stehen die Wörter in der ursprünglichen Dialogzeile.“).
 */
export function feedbackReason(item, lang, matched = null) {
  const fold = (s) => normalizeAnswer(String(s ?? '')).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (item.type === 'word_order' && matched && item.answer && fold(matched) !== fold(item.answer)) {
    return lang === 'de'
      ? `Auch diese Wortfolge ist richtig: „${matched}“ In der Dialogzeile steht: „${item.answer}“`
      : `This word order is correct too: “${matched}” The dialogue line says: “${item.answer}”`;
  }
  const reasons = {
    word_order: { de: 'So stehen die Wörter in der ursprünglichen Dialogzeile.', en: 'This is the word order in the original dialogue line.' },
    listen_select: { de: 'Diese Zeile wurde abgespielt.', en: 'This is the line that was played.' },
  };
  return (lang === 'de' ? item.explanationDe : item.explanationEn)
    || reasons[item.type]?.[lang === 'de' ? 'de' : 'en']
    || (lang === 'de' ? 'Die Lösung passt zur Aufgabe und zum geübten Modell.' : 'The answer fits the task and the model you practised.');
}
