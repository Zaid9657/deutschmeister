import { isItemCorrect } from './buildCheckpoint.js';

// A graded dependency group releases feedback together: even correctness alone
// can reveal a later answer in reading or listening.
export const defersFeedback = (section) => section === 'lesen' || section === 'hoeren';
export function sectionComplete(items, answers, section) {
  const group = items.filter((item) => item.section === section);
  // hasOwnProperty.call, not Object.hasOwn (Safari 14 lacks it; tests/no-object-hasown.test.mjs).
  return group.length > 0 && group.every((item) => Object.prototype.hasOwnProperty.call(answers, item.id));
}

export function checkpointFeedback(item, answer, { graded = false, complete = false } = {}) {
  if (graded && defersFeedback(item.section) && !complete) return { answer };
  return {
    answer,
    correct: isItemCorrect(item, answer),
    key: item.answer,
    explanationDe: item.explanationDe,
    explanationEn: item.explanationEn,
  };
}
