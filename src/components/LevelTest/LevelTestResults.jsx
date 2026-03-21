import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, BookOpen, RefreshCw, Headphones, Mic, PenTool, CheckCircle2, XCircle } from 'lucide-react';

const LevelTestResults = ({
  answers,
  skipped,
  questions,
  listeningScore,
  speakingScore,
  determinedLevel,
  determinedSublevel,
  onRetake
}) => {
  // Calculate written test scores
  const calculateWrittenResults = () => {
    const typeScores = {
      grammar: { correct: 0, total: 0 },
      vocabulary: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 }
    };
    const weakTopics = [];

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      typeScores[answer.type].total++;

      if (answer.isCorrect) {
        typeScores[answer.type].correct++;
      } else {
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

    return { typeScores, weakTopics };
  };

  const { typeScores, weakTopics } = calculateWrittenResults();

  // Get top weak topics for recommendations
  const topWeakTopics = weakTopics
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);

  // Calculate percentages
  const getTypePercentage = (type) => {
    if (typeScores[type].total === 0) return 0;
    return Math.round((typeScores[type].correct / typeScores[type].total) * 100);
  };

  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const totalAnswered = answers.length;
  const writtenPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Speaking scores breakdown
  const speakingPercentage = speakingScore?.score || speakingScore?.total_score || 0;

  // Calculate final adjusted level based on all sections
  const calculateFinalLevel = () => {
    let finalLevel = determinedLevel || 'A1';
    let finalSublevel = determinedSublevel || 'A1.1';

    // Adjust based on listening (if taken)
    if (listeningScore != null) {
      if (listeningScore < 50 && writtenPercentage >= 70) {
        if (finalSublevel.endsWith('.2')) {
          finalSublevel = finalSublevel.replace('.2', '.1');
        }
      }
    }

    // Adjust based on speaking (if taken)
    if (speakingPercentage > 0) {
      if (speakingPercentage < 50 && writtenPercentage >= 70) {
        if (finalSublevel.endsWith('.2')) {
          finalSublevel = finalSublevel.replace('.2', '.1');
        }
      }
    }

    return { level: finalLevel, sublevel: finalSublevel };
  };

  const { level: finalLevel, sublevel: finalSublevel } = calculateFinalLevel();

  // Section completion status
  const sections = [
    {
      name: 'Written',
      icon: PenTool,
      completed: true,
      score: writtenPercentage,
      detail: `${totalCorrect}/${totalAnswered} correct`
    },
    {
      name: 'Listening',
      icon: Headphones,
      completed: listeningScore != null,
      score: listeningScore,
      detail: listeningScore != null ? `${listeningScore}%` : 'Skipped'
    },
    {
      name: 'Speaking',
      icon: Mic,
      completed: speakingScore != null,
      score: speakingPercentage,
      detail: speakingScore ? `${speakingPercentage}/100` : 'Skipped'
    }
  ];

  // Get the scores object from speaking evaluation
  const speakingScoresObj = speakingScore?.scores || null;
  const speakingFeedback = speakingScore?.feedback || null;

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
        </div>

        {/* Section Summary */}
        <div className="results-section">
          <h2>Test Summary</h2>
          <div className="section-summary">
            {sections.map((section, index) => (
              <div key={index} className={`section-item ${section.completed ? 'completed' : 'skipped'}`}>
                <div className="section-icon-wrapper">
                  <section.icon size={20} />
                </div>
                <div className="section-info">
                  <span className="section-name">{section.name}</span>
                  <span className="section-detail">{section.detail}</span>
                </div>
                <div className="section-status">
                  {section.completed ? (
                    <CheckCircle2 size={20} className="status-completed" />
                  ) : (
                    <XCircle size={20} className="status-skipped" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Written Test Breakdown */}
        <div className="results-section">
          <h2>
            <PenTool size={20} />
            Written Test Breakdown
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

        {/* Listening Score (if taken) */}
        {listeningScore != null && (
          <div className="results-section">
            <h2>
              <Headphones size={20} />
              Listening Comprehension
            </h2>
            <div className="single-score-display">
              <div className={`score-circle ${listeningScore >= 70 ? 'good' : listeningScore >= 50 ? 'medium' : 'weak'}`}>
                {listeningScore}%
              </div>
              <p className="score-description">
                {listeningScore >= 70 && 'Strong listening comprehension at this level'}
                {listeningScore >= 50 && listeningScore < 70 && 'Good foundation, some practice recommended'}
                {listeningScore < 50 && 'Focus on listening exercises to improve'}
              </p>
            </div>
          </div>
        )}

        {/* Speaking Score (if taken) */}
        {speakingScore && (
          <div className="results-section">
            <h2>
              <Mic size={20} />
              Speaking Evaluation
            </h2>
            <div className="speaking-scores">
              <div className="speaking-total">
                <div className={`score-circle large ${speakingPercentage >= 70 ? 'good' : speakingPercentage >= 50 ? 'medium' : 'weak'}`}>
                  {speakingPercentage}
                </div>
                <span className="score-label">Overall Score</span>
              </div>

              {speakingScoresObj && (
                <div className="speaking-breakdown">
                  {Object.entries(speakingScoresObj).map(([key, value]) => {
                    const labels = {
                      pronunciation: 'Aussprache',
                      grammar: 'Grammatik',
                      vocabulary: 'Wortschatz',
                      fluency: 'Flüssigkeit',
                      comprehension: 'Verständnis'
                    };
                    return (
                      <div key={key} className="speaking-score-row">
                        <span className="speaking-score-label">{labels[key] || key}</span>
                        <div className="speaking-score-bar">
                          <div
                            className={`speaking-score-fill ${value >= 16 ? 'good' : value >= 12 ? 'medium' : 'weak'}`}
                            style={{ width: `${(value / 20) * 100}%` }}
                          />
                        </div>
                        <span className="speaking-score-value">{value}/20</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {speakingFeedback && (
                <div className="speaking-feedback">
                  <p>{speakingFeedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

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

            {listeningScore != null && listeningScore < 70 && (
              <Link to="/listening" className="recommendation-card">
                <div className="rec-icon">🎧</div>
                <div className="rec-content">
                  <h3>Practice Listening</h3>
                  <p>Improve your comprehension skills</p>
                </div>
              </Link>
            )}

            {speakingScore && speakingPercentage < 70 && (
              <Link to="/speaking" className="recommendation-card">
                <div className="rec-icon">🗣️</div>
                <div className="rec-content">
                  <h3>Practice Speaking</h3>
                  <p>Build confidence with AI conversations</p>
                </div>
              </Link>
            )}

            {topWeakTopics[0] && (
              <Link to={topWeakTopics[0].url} className="recommendation-card">
                <div className="rec-icon">🎯</div>
                <div className="rec-content">
                  <h3>Review {topWeakTopics[0].topic}</h3>
                  <p>Strengthen your weakest area</p>
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
