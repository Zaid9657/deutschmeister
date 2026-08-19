// The placement level the learner is actually given, after the listening and
// speaking sections are allowed to pull a strong written score back down.
//
// This lived inside LevelTestResults, which only *displays* the number, while
// LevelTest.jsx separately wrote the pre-adjustment `determinedSublevel` to
// profiles.current_level. A learner told "B1.2" was therefore stored as "B2.1",
// and every reader of the column — the speaking page, and now the dashboard —
// worked from a level the learner had never been shown. One function, two
// callers, one answer.
import { stepDownSublevel, bandOf } from '../../config/levels';

/** Written score as a whole percentage, 0 when nothing was answered. */
export function writtenPercentageOf(answers) {
  const total = answers?.length || 0;
  if (!total) return 0;
  return Math.round((answers.filter((a) => a.isCorrect).length / total) * 100);
}

/** The speaking evaluator has used both key names; accept either. */
export function speakingPercentageOf(speakingScore) {
  return speakingScore?.score || speakingScore?.total_score || 0;
}

/**
 * @param {object} input
 * @param {string} input.determinedSublevel  result of the written section, e.g. 'B2.1'
 * @param {number} input.writtenPercentage   0..100
 * @param {number|null} input.listeningScore 0..100, or null if not attempted
 * @param {number} input.speakingPercentage  0..100, 0 if not attempted
 * @returns {{level: string, sublevel: string, demotions: string[]}}
 */
export function calculateFinalLevel({
  determinedSublevel,
  writtenPercentage,
  listeningScore,
  speakingPercentage,
}) {
  let sublevel = determinedSublevel || 'A1.1';
  const demotions = [];

  // Only a strong written score gets demoted: a learner who scored low across
  // the board is already placed low, and stepping them down again would strand
  // them below A1.1.
  if (listeningScore != null && listeningScore < 50 && writtenPercentage >= 70) {
    demotions.push('listening');
  }
  if (speakingPercentage > 0 && speakingPercentage < 50 && writtenPercentage >= 70) {
    demotions.push('speaking');
  }

  if (demotions.length) {
    sublevel = stepDownSublevel(sublevel, demotions.length);
  }

  // Report the band of the adjusted sub-level, not the pre-adjustment one.
  return { level: bandOf(sublevel), sublevel, demotions };
}
