// The Wiederholen (spaced review) screen's typed-card grading helper
// (src/pages/lesson/ReviewPage.jsx). Pulled out of the .jsx file, plain JS, so
// it can be imported by node --test without a JSX transform or the page's
// React/Supabase imports.
//
// Grades IDENTICALLY to the lesson (src/components/lesson/PracticeItem.jsx)
// and the checkpoint (buildCheckpoint.js's isItemCorrect): same `strict` rule
// and the same `caseSensitive: isCaseTask(item)` for the polite `Ihr`
// (REVIEW #4 BLOCKER 3). A review card has no `topic` field of its own — its
// card_key IS the topic/slug (`pattern:possessive-articles`, see
// src/lib/review/ladder.js's patternCardKey), so a pseudo-item built from the
// card_key plus the card's accepted answers is what isCaseTask and
// STRICT_TOPIC are tested against, matching how the same grammar pattern is
// graded everywhere else.
//
// TYPO is also handled identically on purpose: there is no per-item retry
// here either (Prüfen locks the answer once submitted, exactly like
// PracticeItem.jsx and the checkpoint — docs/course-standard-2026-09-12.md
// §3's "3 attempts per 8 h" is a whole-test retake, not a per-item one), so a
// TYPO result counts as correct-with-warning rather than being carved out as
// wrong.
import { checkAnswer, RESULT, STRICT_TOPIC, isCaseTask } from '../lesson/check.js';

export function gradeTypedReview(cardKey, accepted, typed) {
  const pseudoItem = { topic: cardKey, answer: accepted?.[0], accepted };
  const strict = STRICT_TOPIC.test(cardKey);
  const caseSensitive = isCaseTask(pseudoItem);
  const { result } = checkAnswer(typed, accepted, { strict, caseSensitive });
  return { result, ok: result === RESULT.CORRECT || result === RESULT.TYPO };
}
