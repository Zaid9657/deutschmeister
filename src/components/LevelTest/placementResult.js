import { LEVEL_ORDER, stepDownSublevel, bandOf } from '../../config/levels.js';

const BANDS = ['A1', 'A2', 'B1', 'B2'];

/**
 * A question's review link. Grammar lessons are Astro pages and end in a slash;
 * the app's own routes (/reading/a1.1, /level/a1.1?tab=vocabulary) do not — a
 * slash appended to those turned the tab into "vocabulary/" (CLAUDE.md, the
 * three trailing-slash cases).
 */
export const topicLink = (url) => (/^\/grammar\//.test(url) && !url.endsWith('/') ? `${url}/` : url);

// Every selected written question counts, including a question skipped as unknown.
// The same result feeds the readout, guest storage and the signed-in profile.
export function calculatePlacement({ answers, questions, listeningScore, speakingScore }) {
  const levelScores = Object.fromEntries(BANDS.map(level => [level, { correct: 0, total: 0 }]));
  const sublevelScores = Object.fromEntries(LEVEL_ORDER.map(level => [level, { correct: 0, total: 0 }]));
  const typeScores = Object.fromEntries(['grammar', 'vocabulary', 'reading'].map(type => [type, { correct: 0, total: 0 }]));
  const byQuestion = new Map(answers.map(answer => [answer.questionId, answer]));
  const weakTopics = [];
  let totalCorrect = 0;

  for (const question of questions) {
    const correct = byQuestion.get(question.id)?.isCorrect === true;
    for (const score of [levelScores[question.level], sublevelScores[question.sublevel], typeScores[question.type]]) {
      score.total++;
      if (correct) score.correct++;
    }
    if (correct) {
      totalCorrect++;
    } else {
      // Grouped by the page a topic links to, not its display name: "Reading
      // Comprehension" names four levels with four pages, and grouping by name
      // linked whichever level was missed first — possibly a paid one.
      const url = topicLink(question.relatedTopicUrl);
      const existing = weakTopics.find(topic => topic.url === url);
      if (existing) {
        existing.wrong++;
        if (BANDS.indexOf(question.level) < BANDS.indexOf(existing.level)) existing.level = question.level;
      } else {
        weakTopics.push({ topic: question.topicDisplayName, url, wrong: 1, level: question.level });
      }
    }
  }

  // A band counts only when every band below it passed too, as in the
  // listening scorer: without the stop, six correct B2 answers after 34 skips
  // placed B2.1, and an always-B clicker reached B2 in two thirds of draws.
  let writtenSublevel = 'A1.1';
  for (const level of BANDS) {
    const score = levelScores[level];
    if (!(score.total > 0 && score.correct / score.total >= 0.6)) break;
    const upper = sublevelScores[`${level}.2`];
    writtenSublevel = upper.total > 0 && upper.correct / upper.total >= 0.7 ? `${level}.2` : `${level}.1`;
  }

  const totalQuestions = questions.length;
  const writtenPercentage = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
  const speakingPercentage = [speakingScore?.score, speakingScore?.total_score]
    .find(value => Number.isFinite(value) && value >= 0 && value <= 100) ?? null;
  const demotions = [];
  if (listeningScore != null && listeningScore < 50 && writtenPercentage >= 70) demotions.push('listening');
  if (speakingPercentage != null && speakingPercentage < 50 && writtenPercentage >= 70) demotions.push('speaking');
  const sublevel = stepDownSublevel(writtenSublevel, demotions.length);

  return { level: bandOf(sublevel), sublevel, writtenSublevel, writtenPercentage, speakingPercentage, demotions, totalCorrect, totalQuestions, typeScores, weakTopics };
}

/**
 * The weak topics the results screen names, at most `limit`: only bands up to
 * one above the placed band — an all-skip A1.1 run was sent to review relative
 * clauses and Konjunktiv I (C-165) — most-missed first, the lower band first on
 * a tie.
 */
export function focusTopics(weakTopics, sublevel, limit = 3) {
  const placed = BANDS.indexOf(bandOf(sublevel));
  const rank = (topic) => BANDS.indexOf(topic.level);
  return weakTopics
    .map((topic, index) => ({ topic, index }))
    .filter(({ topic }) => rank(topic) >= 0 && rank(topic) <= Math.max(placed, 0) + 1)
    .sort((a, b) => b.topic.wrong - a.topic.wrong || rank(a.topic) - rank(b.topic) || a.index - b.index)
    .slice(0, limit)
    .map(({ topic }) => topic);
}
