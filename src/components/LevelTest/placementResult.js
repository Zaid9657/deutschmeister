import { LEVEL_ORDER, stepDownSublevel, bandOf } from '../../config/levels.js';

// Every selected written question counts, including a question skipped as unknown.
// The same result feeds the readout, guest storage and the signed-in profile.
export function calculatePlacement({ answers, questions, listeningScore, speakingScore }) {
  const levelScores = Object.fromEntries(['A1', 'A2', 'B1', 'B2'].map(level => [level, { correct: 0, total: 0 }]));
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
      const existing = weakTopics.find(topic => topic.topic === question.topicDisplayName);
      if (existing) {
        existing.wrong++;
      } else {
        weakTopics.push({
          topic: question.topicDisplayName,
          url: question.relatedTopicUrl.endsWith('/') ? question.relatedTopicUrl : `${question.relatedTopicUrl}/`,
          wrong: 1,
          level: question.level,
        });
      }
    }
  }

  let writtenSublevel = 'A1.1';
  for (const level of ['A1', 'A2', 'B1', 'B2']) {
    const score = levelScores[level];
    if (score.total > 0 && score.correct / score.total >= 0.6) {
      const upper = sublevelScores[`${level}.2`];
      writtenSublevel = upper.total > 0 && upper.correct / upper.total >= 0.7 ? `${level}.2` : `${level}.1`;
    }
  }

  const totalQuestions = questions.length;
  const writtenPercentage = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
  const speakingPercentage = speakingScore?.score || speakingScore?.total_score || 0;
  const demotions = [];
  if (listeningScore != null && listeningScore < 50 && writtenPercentage >= 70) demotions.push('listening');
  if (speakingPercentage > 0 && speakingPercentage < 50 && writtenPercentage >= 70) demotions.push('speaking');
  const sublevel = stepDownSublevel(writtenSublevel, demotions.length);

  return { level: bandOf(sublevel), sublevel, writtenSublevel, writtenPercentage, speakingPercentage, demotions, totalCorrect, totalQuestions, typeScores, weakTopics };
}
