import { groupWords, lineFor } from './wortfeldPacing.js';
import { meaningChoice, listeningChoice } from './derivedChoices.js';

/** Keep the existing allocation; meta headings are delivered by taught-set, never noun cards. */
export function cardWordSets(lesson) {
  const lines = lesson.dialog.lines.map((l) => l.de);
  const words = lesson.wortfeld.filter((w) => !w.meta);
  return { scene: words.filter((w) => lineFor(w.de || w.word, lines)), read: words.filter((w) => !lineFor(w.de || w.word, lines)) };
}

/** Reuse derived pairing/listening builders; every answer is a member of this small group. */
export function buildWordCardStage(lesson, words, key, attempt = 1) {
  const steps = [];
  for (const [group, members] of groupWords(words, 5).entries()) {
    steps.push({ kind: 'cards', group, words: members });
    const target = members[(attempt - 1) % members.length];
    const id = `cards-${lesson.id}-${key}-${group}`;
    const pairs = members.map((w) => ({ de: w.de, en: w.en }));
    const meaning = meaningChoice(target, pairs, `${id}-meaning`);
    const heard = members[attempt % members.length];
    const listening = listeningChoice({ de: heard.de }, [...members].reverse(), `${id}-listen`);
    const noun = members.find((w) => w.article);
    const items = [
      { ...meaning, cardTarget: target.de, retrieval: 'meaning' },
      { ...listening, cardTarget: heard.de, retrieval: 'listening', audioKey: `${id}-listen` },
      ...(noun ? [{ id: `${id}-article`, type: 'multiple_choice', cardTarget: noun.de, retrieval: 'article',
        promptDe: `Welcher Artikel gehört zu „${noun.word}“? Denken Sie an die Wortkarte.`,
        promptEn: `Which article goes with “${noun.word}”? Think of the word card.`,
        answer: noun.article, accepted: [noun.article], options: ['der', 'die', 'das'],
        explanationDe: `Auf der Wortkarte steht: ${noun.de}.`, explanationEn: `The word card shows: ${noun.de}.`,
      }] : []),
    ];
    for (const item of items) steps.push({ kind: 'check', group, item });
  }
  return { nr: 2, key, kind: 'wortfeld', part: 1, words, steps, lines: lesson.dialog.lines.map((l) => l.de) };
}

// Same assumptions as STEP_SECONDS.word; imported by the estimator to avoid two time models.
export const CARD_SECONDS = { word: [8, 15], check: [20, 40], listeningInput: [3, 6] };
export const CARD_MAX_INPUT_SECONDS = 120;
export function cardStageEstimate(stage) {
  let lo = 0, hi = 0, inputHi = 0, maxInputHi = 0;
  let cards = 0, checks = 0, groups = 0;
  for (const step of stage.steps || []) {
    if (step.kind === 'cards') {
      groups++; cards += step.words.length;
      lo += step.words.length * CARD_SECONDS.word[0];
      hi += step.words.length * CARD_SECONDS.word[1];
      inputHi += step.words.length * CARD_SECONDS.word[1];
    } else if (step.kind === 'check') {
      const audio = step.item.type === 'listen_select';
      const preInput = audio ? CARD_SECONDS.listeningInput[1] : 0;
      maxInputHi = Math.max(maxInputHi, inputHi + preInput + CARD_SECONDS.check[1]);
      lo += CARD_SECONDS.check[0] + (audio ? CARD_SECONDS.listeningInput[0] : 0);
      hi += CARD_SECONDS.check[1] + preInput;
      checks++; inputHi = 0;
    }
  }
  maxInputHi = Math.max(maxInputHi, inputHi);
  return { cards, groups, checks, lo, hi, maxInputHi };
}
