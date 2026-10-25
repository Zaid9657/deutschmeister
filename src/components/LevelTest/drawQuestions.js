// The placement test's draws (src/pages/LevelTest.jsx): which written questions
// a run asks and in which option order, how a run in progress is kept and
// rebuilt, and which listening questions the listening step can present. Pure —
// the bank, the rows and the random source come in — so
// tests/placement-draw.test.mjs and tests/placement-listening.test.mjs replay
// them under plain Node with the real bank.
import { selectListeningQuestions } from '../../data/courseTests/listeningQuestions.js';

/** The written part asks ten questions from each band, in ladder order (40 in all). */
export const PLACEMENT_BANDS = ['A1', 'A2', 'B1', 'B2'];
export const QUESTIONS_PER_BAND = 10;

/** Fisher–Yates over a copy; `random` returns [0, 1) like Math.random. */
export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const isOrderOf = (order, length) =>
  Array.isArray(order) && order.length === length
  && [...order].sort((a, b) => a - b).every((value, i) => value === i);

/**
 * One question with its options in `order` (indexes into the stored options)
 * and the key remapped to that order. Scoring reads the remapped key.
 *
 * WHY (C-163, measured with this bank 2026-10-25): the stored keys sat at
 * A/B/C/D 20/39/18/3 and the options rendered in stored order, so a tester who
 * always clicked B scored 6/10 on B2 — the pass mark — in 67% of draws. The bank
 * is balanced now (tests/placement-bank-rules.test.mjs) and every run still
 * shuffles, so what a learner sees never depends on where an author typed the key.
 */
export function withOptionOrder(question, order) {
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correctIndex: order.indexOf(question.correctIndex),
    optionOrder: order,
  };
}

/** A fresh run: ten random questions per band, each with its own option order. */
export function drawQuestions(bank, { random = Math.random } = {}) {
  return PLACEMENT_BANDS.flatMap((band) =>
    shuffle(bank.filter((q) => q.level === band), random)
      .slice(0, QUESTIONS_PER_BAND)
      .map((q) => withOptionOrder(q, shuffle(q.options.map((_, i) => i), random))));
}

/** The answer LevelTest keeps for one question — the record calculatePlacement reads. */
export function answerFor(question, selectedIndex) {
  const isCorrect = selectedIndex === question.correctIndex;
  return {
    questionId: question.id,
    level: question.level,
    sublevel: question.sublevel,
    type: question.type,
    selectedIndex,
    isCorrect,
    points: isCorrect ? question.points : 0,
  };
}

// ── The run in progress (C-085/X-086) ──────────────────────────────────────
// The test is 15–20 minutes and lived only in React state: a back-swipe or an
// iOS tab reload on question 30 started it over. LevelTest writes this snapshot
// to sessionStorage (this tab only, through safeStorage) on every step and offers
// "Continue your test" on the landing page while it can be rebuilt exactly.

export const PLACEMENT_PROGRESS_KEY = 'dm_level_test_run';
export const PLACEMENT_PROGRESS_VERSION = 1;
/** Steps a run resumes in. Listening and speaking start again at their intro screens. */
export const RESUMABLE_STEPS = ['testing', 'listening', 'speaking'];

export function placementSnapshot({ questions, answers, currentQuestionIndex, testState, listeningScore }) {
  return {
    v: PLACEMENT_PROGRESS_VERSION,
    questionIds: questions.map((q) => q.id),
    optionOrders: questions.map((q) => q.optionOrder),
    answers: answers.map(({ questionId, selectedIndex }) => ({ questionId, selectedIndex })),
    currentQuestionIndex,
    testState,
    listeningScore: listeningScore ?? null,
  };
}

/**
 * A stored snapshot → the run to resume, or null when it cannot be rebuilt
 * exactly: another version, a step that does not resume, an id the bank no
 * longer has, a broken option order, an answer to a question the run did not
 * ask. Answers are re-scored against the rebuilt keys, never trusted as stored.
 */
export function restorePlacement(bank, snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || snapshot.v !== PLACEMENT_PROGRESS_VERSION) return null;
  const { questionIds, optionOrders, answers, currentQuestionIndex, testState, listeningScore } = snapshot;
  if (!RESUMABLE_STEPS.includes(testState)) return null;
  if (!Array.isArray(questionIds) || !Array.isArray(optionOrders) || !Array.isArray(answers)) return null;
  if (questionIds.length === 0 || questionIds.length !== optionOrders.length || new Set(questionIds).size !== questionIds.length) return null;

  const byId = new Map(bank.map((q) => [q.id, q]));
  const questions = [];
  for (let i = 0; i < questionIds.length; i++) {
    const stored = byId.get(questionIds[i]);
    if (!stored || !isOrderOf(optionOrders[i], stored.options.length)) return null;
    questions.push(withOptionOrder(stored, optionOrders[i]));
  }
  if (!Number.isInteger(currentQuestionIndex) || currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return null;

  const asked = new Map(questions.map((q) => [q.id, q]));
  const restored = [];
  for (const answer of answers) {
    const question = asked.get(answer?.questionId);
    if (!question || !Number.isInteger(answer.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex >= question.options.length) return null;
    restored.push(answerFor(question, answer.selectedIndex));
  }
  const score = Number.isFinite(listeningScore) && listeningScore >= 0 && listeningScore <= 100 ? listeningScore : null;
  return { questions, answers: restored, currentQuestionIndex, testState, listeningScore: score };
}

// ── The listening step (C-073/C-086/X-070) ─────────────────────────────────
// Since Course Factory Wave 2 every A1.1 and A2.1 exercise has 23 questions,
// three of them dictation rows with options NULL. The placement card renders
// only options and waits for an answer to every question, so a dictation row
// kept "Next Exercise" disabled for good and every tester had to skip listening.

/** Each exercise's first ten questions — the cap every mock uses (selectListeningQuestions). */
export const PLACEMENT_LISTENING_MAX = 10;

/** A question the placement card can present and score: one with options to pick. */
export const isChoiceQuestion = (q) =>
  q?.question_type !== 'dictation' && Array.isArray(q?.options) && q.options.length > 0;

/** The listening_questions rows of one exercise that the placement test presents — and scores. */
export const placementListeningQuestions = (rows) =>
  selectListeningQuestions(rows, { questionMax: PLACEMENT_LISTENING_MAX }).filter(isChoiceQuestion);
