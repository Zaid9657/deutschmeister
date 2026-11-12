import { RESULT } from './check.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';

const HINTS = {
  word_order: { de: 'Prüfen Sie die Reihenfolge der Wörter.', en: 'Check the order of the words.' },
  dictation: { de: 'Hören Sie noch einmal auf die ganze Zeile.', en: 'Listen to the whole line again.' },
  listen_select: { de: 'Hören Sie noch einmal und vergleichen Sie die Zeilen.', en: 'Listen again and compare the lines.' },
  match: { de: 'Vergleichen Sie die Bedeutungen noch einmal.', en: 'Compare the meanings again.' },
  fill_blank: { de: 'Lesen Sie den Satz vor und nach der Lücke.', en: 'Read the sentence before and after the gap.' },
  error_correction: { de: 'Prüfen Sie die Schreibweise und die Satzzeichen.', en: 'Check the spelling and punctuation.' },
};
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
  const candidates = [HINTS[item.type || item.kind], ...NEUTRAL].filter(Boolean);
  const hint = candidates.find((h) => !hintContainsAnswer(h.de, item) && !hintContainsAnswer(h.en, item));
  if (!hint) throw new Error('No answer-free bilingual hint for item');
  return hint;
}

export function guidedFeedback(item, checked, retryUsed, lang) {
  const hintOnly = checked.result === RESULT.WRONG && !retryUsed;
  return { ...checked, hintOnly, showAnswer: retryUsed,
    ...(hintOnly ? { hint: hintFor(item)[lang === 'de' ? 'de' : 'en'] } : {}) };
}

export function feedbackReason(item, lang) {
  const reasons = {
    word_order: { de: 'So stehen die Wörter in der ursprünglichen Dialogzeile.', en: 'This is the word order in the original dialogue line.' },
    listen_select: { de: 'Diese Zeile wurde abgespielt.', en: 'This is the line that was played.' },
  };
  return (lang === 'de' ? item.explanationDe : item.explanationEn)
    || reasons[item.type]?.[lang === 'de' ? 'de' : 'en']
    || (lang === 'de' ? 'Die Lösung passt zur Aufgabe und zum geübten Modell.' : 'The answer fits the task and the model you practised.');
}
