import React, { useState } from 'react';

const LevelTestQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  currentLevel,
  onAnswer,
  onSkip
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleNext = () => {
    if (selectedIndex !== null) {
      onAnswer(selectedIndex);
      setSelectedIndex(null);
    }
  };

  const handleSkip = () => {
    onSkip();
    setSelectedIndex(null);
  };

  // Calculate progress percentage
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="level-test-container">
      <div className="question-card">
        {/* Header */}
        <div className="question-header">
          <div className="question-header-left">
            <span className="header-title">Level Test</span>
            <span className={`level-badge level-${currentLevel.toLowerCase()}`}>
              {currentLevel}
            </span>
          </div>
          <span className="question-counter">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Content */}
        <div className="question-content">
          {/* Topic Label */}
          <span className="topic-label">{question.topicDisplayName}</span>

          {/* Reading Passage (if present) */}
          {question.passage && (
            <div className="reading-passage">
              <p>{question.passage}</p>
            </div>
          )}

          {/* Question Text */}
          <h2 className="question-text">{question.question}</h2>

          {/* Options */}
          <div className="options-list">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="question-footer">
          <button className="skip-btn" onClick={handleSkip}>
            Skip
          </button>
          <button
            className="next-btn"
            onClick={handleNext}
            disabled={selectedIndex === null}
          >
            {questionNumber === totalQuestions ? 'Finish' : 'Next question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelTestQuestion;
