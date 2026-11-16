import { spelledPrompt, spellingApplies, RESULT } from './check.js';
import { normalizeAnswer } from '../../utils/answerMatch.js';

const HINTS = {
  word_order: [
    { de: 'Prüfen Sie die Reihenfolge der Wörter.', en: 'Check the order of the words.' },
    { de: 'Wortfolge mit dem gesprochenen Modell vergleichen.', en: 'Compare the word order with the spoken model.' },
  ],
  dictation: [
    { de: 'Hören Sie noch einmal auf die ganze Zeile.', en: 'Listen to the whole line again.' },
    { de: 'Zeile erneut abspielen; Wortgrenzen und Endungen prüfen.', en: 'Replay the line; check word boundaries and endings.' },
  ],
  listen_select: [
    { de: 'Hören Sie noch einmal und vergleichen Sie die Zeilen.', en: 'Listen again and compare the lines.' },
    { de: 'Audio erneut abspielen; auf unterschiedliche Laute achten.', en: 'Replay the audio and listen for the sounds that differ.' },
  ],
  match: [
    { de: 'Vergleichen Sie die Bedeutungen noch einmal.', en: 'Compare the meanings again.' },
    { de: 'Wortkarten vergleichen: Welche Bedeutung passt zum gehörten Ausdruck?', en: 'Compare the word cards: which meaning fits the expression you heard?' },
  ],
  fill_blank: [
    { de: 'Lesen Sie den Satz vor und nach der Lücke.', en: 'Read the sentence before and after the gap.' },
    { de: 'Lücke im Satz suchen; Wortart und passende Endung prüfen.', en: 'Locate the gap in the sentence; check the word type and its ending.' },
  ],
  spelling: [
    { de: 'Prüfen Sie jeden Buchstaben und seine Reihenfolge.', en: 'Check each letter and its order.' },
    { de: 'Bitte jeden Buchstaben mit dem gehörten Modell vergleichen.', en: 'Compare each letter with the model you heard.' },
  ],
  sentence_building: [
    { de: 'Prüfen Sie die Reihenfolge der Wörter und die Verbform.', en: 'Check the word order and the verb form.' },
    { de: 'Wortfolge prüfen: Subjekt, Verbposition und Endung vergleichen.', en: 'Check subject position, verb position and the ending.' },
  ],
  error_correction: [
    { de: 'Prüfen Sie die Schreibweise und die Satzzeichen.', en: 'Check the spelling and punctuation.' },
    { de: 'Satz mit dem gelernten Muster vergleichen; auf Endungen achten.', en: 'Compare the sentence with the taught pattern; check the endings.' },
  ],
  multiple_choice: [
    { de: 'Vergleichen Sie jede Auswahl mit dem gelernten Modell; achten Sie auf Person, Zahl und Zeit.', en: 'Compare each choice with the taught model; check person, quantity and time.' },
    { de: 'Modell vergleichen; Unterschiede in Person, Zahl und Zeit prüfen.', en: 'Use the taught model to compare differences in person, quantity and time.' },
  ],
  article: [
    { de: 'Wortkarte öffnen: Genus sowie Einzahl und Mehrzahl prüfen.', en: 'Return to the noun card: check its gender and whether it is singular or plural.' },
    { de: 'Nomen auf seiner Wortkarte suchen; Genus vergleichen.', en: 'Find the noun on its word card and compare its gender.' },
  ],
  pronoun: [
    { de: 'Bezug im Satz prüfen: Wer spricht, und über wen wird gesprochen?', en: 'Check the reference: who is speaking, and who is being spoken about?' },
  ],
  verb: [
    { de: 'Subjekt und Verbendung mit dem gelernten Muster vergleichen.', en: 'Compare the subject and verb ending with the taught pattern.' },
  ],
  clock: [
    { de: 'Uhrzeitmodell prüfen: ganze Stunde oder Weg zur nächsten Stunde?', en: 'Check the time model: a full hour, or part of the way to the next hour?' },
  ],
  meaning: [
    { de: 'Wortkarte erneut ansehen; Bedeutung mit den Möglichkeiten vergleichen.', en: 'Return to the word card and compare its meaning with the choices.' },
  ],
};
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
  const kind = spelledPrompt(item) || spellingApplies(acceptedFor(item)) || item.listenSpelling ? 'spelling' : item.type || item.kind;
  const topic = item.topic || '';
  const focus = item.retrieval === 'article' || /articles|nouns-gender/.test(topic) ? 'article'
    : /pronouns/.test(topic) ? 'pronoun'
    : /verb-|present-tense/.test(topic) ? 'verb'
    : /time-and-dates/.test(topic) && /\d{1,2}:\d{2}|Uhr|halb|Viertel/u.test(item.questionDe || '') ? 'clock'
    : item.retrieval === 'meaning' ? 'meaning' : null;
  const source = item.hintSource;
  const scene = source?.kind === 'scene' ? [{
    de: `Hören Sie die Zeilen ${source.from + 1}–${source.to} erneut. Achten Sie darauf, wer spricht und was gefragt oder gesagt wird.`,
    en: `Replay lines ${source.from + 1}–${source.to}. Listen for who is speaking and what is asked or said.`,
  }] : [];
  const candidates = [...scene, ...(kind === 'spelling' ? HINTS.spelling : HINTS[focus] || []), ...(HINTS[kind] || HINTS.multiple_choice)];
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
