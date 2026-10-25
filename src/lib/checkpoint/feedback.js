import { isItemCorrect } from './buildCheckpoint.js';

// A graded dependency group releases feedback together. Lesen is one group at
// every level: even correctness alone can reveal a later mirrored answer.
// Hören also waits: printed feedback can give away a later listening target.
export function sectionComplete(items, answers, section) {
  const group = items.filter((item) => item.section === section);
  return group.length > 0 && group.every((item) => Object.hasOwn(answers, item.id));
}

export function sectionFeedbackReady(items, answers, section) {
  return (['lesen', 'hoeren'].includes(section) || items.some((item) => item.section === section && item.groupId))
    && sectionComplete(items, answers, section);
}

export function checkpointFeedback(item, answer, { graded = false, complete = false } = {}) {
  if (graded && (['lesen', 'hoeren'].includes(item.section) || item.groupId) && !complete) return { answer };
  return {
    answer,
    correct: isItemCorrect(item, answer),
    key: item.answer,
    explanationDe: item.explanationDe,
    explanationEn: item.explanationEn,
  };
}
