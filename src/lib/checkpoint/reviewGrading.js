// The Wiederholen (spaced review) screen's typed-card grading helper
// (src/pages/lesson/ReviewPage.jsx). Pulled out of the .jsx file, plain JS, so
// it can be imported by node --test without a JSX transform or the page's
// React/Supabase imports.
//
// Grades IDENTICALLY to the lesson (src/components/lesson/PracticeItem.jsx)
// and the checkpoint (buildCheckpoint.js's isItemCorrect), because all four
// sites now ask the ITEM for their options: `checkAnswer(user, expected,
// checkOptionsFor(item))` (REVIEW #6 BLOCKER 3) — strict, caseSensitive,
// dictation and spelling are item properties, never call-site arguments.
// A review card has no `topic` field of its own — its card_key IS the topic/slug
// (`pattern:possessive-articles`, see src/lib/review/ladder.js's
// patternCardKey), so a pseudo-item built from the card_key plus the card's
// accepted answers is what STRICT_TOPIC is tested against, matching how the
// same grammar pattern is graded everywhere else.
//
// CASE SENSITIVITY IS CARRIED, NOT GUESSED. `isCaseTask(item)` is now the
// item's own `caseSensitive === true` flag and nothing else (check.js: the
// polite-possessive regex that used to infer it was removed, because it hit
// items whose own explanation taught the lowercase answer and missed the
// `Sie`/`Ihnen` items where the capital IS the point). A review card therefore
// has to bring the flag with it: reviewService.buildCardIndex copies it off the
// curriculum entry, ReviewPage passes it here, and only then is the polite `Ihr`
// case-checked in the review the way it is in the lesson and the checkpoint.
//
// TYPO is also handled identically on purpose: there is no per-item retry
// here either (Prüfen locks the answer once submitted, exactly like
// PracticeItem.jsx and the checkpoint — docs/course-standard-2026-09-12.md
// §3's "3 attempts per 8 h" is a whole-test retake, not a per-item one), so a
// TYPO result counts as correct-with-warning rather than being carved out as
// wrong.
import { checkAnswer, RESULT, checkOptionsFor } from '../lesson/check.js';

export function gradeTypedReview(cardKey, accepted, typed, { caseSensitive: flag = false, kind = null } = {}) {
  const pseudoItem = {
    topic: cardKey, answer: accepted?.[0], accepted, caseSensitive: flag === true, kind,
  };
  const { result } = checkAnswer(typed, accepted, checkOptionsFor(pseudoItem));
  return { result, ok: result === RESULT.CORRECT || result === RESULT.TYPO };
}
