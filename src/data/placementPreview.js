// A labelled sample from the same bank the placement page draws from.
// This is a demonstration, never a saved or scored placement result.
import bank from './levelTestQuestions.json' with { type: 'json' };
const question = bank.questions.find((entry) => entry.id === 'A1-001');
export const PLACEMENT_PREVIEW = {
  question: question.question,
  options: question.options,
  answer: question.options[question.correctIndex],
  explanation: question.explanation,
};
