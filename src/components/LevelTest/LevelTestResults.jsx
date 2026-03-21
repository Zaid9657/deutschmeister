import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, BookOpen, RefreshCw } from 'lucide-react';

const LevelTestResults = ({ answers, skipped, questions, onRetake }) => {
  // Calculate scores per level and sublevel
  const calculateResults = () => {
    const levelScores = {};
    const sublevelScores = {};
    const typeScores = { grammar: { correct: 0, total: 0 }, vocabulary: { correct: 0, total: 0 }, reading: { correct: 0, total: 0 } };
    const weakTopics = [];

    // Initialize
    ['A1', 'A2', 'B1', 'B2'].forEach(level => {
      levelScores[level] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
    });
    ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'].forEach(sub => {
      sublevelScores[sub] = { correct: 0, total: 0 };
    });

    // Count answered questions
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      levelScores[answer.level].total++;
      levelScores[answer.level].maxPoints += question.points;
      sublevelScores[answer.sublevel].total++;
      typeScores[answer.type].total++;

      if (answer.isCorrect) {
        levelScores[answer.level].correct++;
        levelScores[answer.level].points += question.points;
        sublevelScores[answer.sublevel].correct++;
        typeScores[answer.type].correct++;
      } else {
        // Track weak topics
        const existingTopic = weakTopics.find(t => t.topic === question.topicDisplayName);
        if (existingTopic) {
          existingTopic.wrong++;
        } else {
          weakTopics.push({
            topic: question.topicDisplayName,
            url: question.relatedTopicUrl,
            wrong: 1,
            level: answer.level
          });
        }
      }
    });

    return { levelScores, sublevelScores, typeScores, weakTopics };
  };

  const { levelScores, sublevelScores, typeScores, weakTopics } = calculateResults();

  // Determine overall level
  const determineLevel = () => {
    const levels = ['A1', 'A2', 'B1', 'B2'];
    let determinedLevel = 'A1';
    let determinedSublevel = 'A1.1';

    for (const level of levels) {
      const score = levelScores[level];
      if (score.total === 0) continue;

      const percentage = (score.correct / score.total) * 100;

      if (percentage >= 60) {
        determinedLevel = level;

        // Determine sublevel
        const sub1 = `${level}.1`;
        const sub2 = `${level}.2`;
        const sub1Score = sublevelScores[sub1];
        const sub2Score = sublevelScores[sub2];

        const sub1Pct = sub1Score.total > 0 ? (sub1Score.correct / sub1Score.total) * 100 : 0;
        const sub2Pct = sub2Score.total > 0 ? (sub2Score.correct / sub2Score.total) * 100 : 0;

        if (sub2Pct >= 70) {
          determinedSublevel = sub2;
        } else {
          determinedSublevel = sub1;
        }
      }
    }

    return { level: determinedLevel, sublevel: determinedSublevel };
  };

  const { level: finalLevel, sublevel: finalSublevel } = determineLevel();

  // Get top weak topics for recommendations
  const topWeakTopics = weakTopics
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);

  // Calculate type percentages
  const getTypePercentage = (type) => {
    if (typeScores[type].total === 0) return 0;
    return Math.round((typeScores[type].correct / typeScores[type].total) * 100);
  };

  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const totalAnswered = answers.length;
  const overallPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="level-test-container">
      <div className="results-card">
        {/* Header */}
        <div className="results-header">
          <div className="results-icon">
            <Trophy size={40} />
          </div>
          <h1>Your German Level</h1>
          <div className={`result-level-badge level-${finalLevel.toLowerCase()}`}>
            {finalSublevel}
          </div>
          <p className="results-summary">
            You answered {totalCorrect} of {totalAnswered} questions correctly ({overallPercentage}%)
            {skipped.length > 0 && ` \u2022 ${skipped.length} skipped`}
          </p>
        </div>

        {/* Skill Breakdown */}
        <div className="results-section">
          <h2>
            <Target size={20} />
            Skill Breakdown
          </h2>
          <div className="skill-bars">
            <div className="skill-row">
              <span className="skill-label">Grammar</span>
              <div className="skill-bar-container">
                <div
                  className={`skill-bar-fill ${getTypePercentage('grammar') >= 70 ? 'good' : getTypePercentage('grammar') >= 50 ? 'medium' : 'weak'}`}
                  style={{ width: `${getTypePercentage('grammar')}%` }}
                />
              </div>
              <span className="skill-percentage">{getTypePercentage('grammar')}%</span>
            </div>
            <div className="skill-row">
              <span className="skill-label">Vocabulary</span>
              <div className="skill-bar-container">
                <div
                  className={`skill-bar-fill ${getTypePercentage('vocabulary') >= 70 ? 'good' : getTypePercentage('vocabulary') >= 50 ? 'medium' : 'weak'}`}
                  style={{ width: `${getTypePercentage('vocabulary')}%` }}
                />
              </div>
              <span className="skill-percentage">{getTypePercentage('vocabulary')}%</span>
            </div>
            <div className="skill-row">
              <span className="skill-label">Reading</span>
              <div className="skill-bar-container">
                <div
                  className={`skill-bar-fill ${getTypePercentage('reading') >= 70 ? 'good' : getTypePercentage('reading') >= 50 ? 'medium' : 'weak'}`}
                  style={{ width: `${getTypePercentage('reading')}%` }}
                />
              </div>
              <span className="skill-percentage">{getTypePercentage('reading')}%</span>
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        {topWeakTopics.length > 0 && (
          <div className="results-section">
            <h2>
              <BookOpen size={20} />
              Areas to Focus On
            </h2>
            <div className="weak-topics">
              {topWeakTopics.map((topic, index) => (
                <Link
                  key={index}
                  to={topic.url}
                  className="weak-topic-tag"
                >
                  {topic.topic}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="results-section">
          <h2>Recommended Next Steps</h2>
          <div className="recommendation-cards">
            <Link to={`/grammar/${finalSublevel.toLowerCase().replace('.', '-')}`} className="recommendation-card">
              <div className="rec-icon">📚</div>
              <div className="rec-content">
                <h3>Start {finalSublevel} Grammar</h3>
                <p>Begin with grammar topics at your level</p>
              </div>
            </Link>
            {topWeakTopics[0] && (
              <Link to={topWeakTopics[0].url} className="recommendation-card">
                <div className="rec-icon">🎯</div>
                <div className="rec-content">
                  <h3>Practice {topWeakTopics[0].topic}</h3>
                  <p>Strengthen your weakest area first</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          <button className="retake-btn" onClick={onRetake}>
            <RefreshCw size={18} />
            Retake Test
          </button>
          <Link to="/grammar" className="start-learning-btn">
            Start Learning
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LevelTestResults;
