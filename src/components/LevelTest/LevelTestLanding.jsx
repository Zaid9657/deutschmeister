import React from 'react';
import { ClipboardCheck, Clock, BarChart3, Lightbulb } from 'lucide-react';

const LevelTestLanding = ({ onStart }) => {
  return (
    <div className="level-test-container">
      <div className="level-test-landing">
        {/* Header */}
        <div className="landing-header">
          <div className="landing-icon">
            <ClipboardCheck size={48} />
          </div>
          <h1>German Level Test</h1>
          <p className="landing-subtitle">
            Discover your CEFR level in 15-20 minutes
          </p>
        </div>

        {/* Stats Row */}
        <div className="landing-stats">
          <div className="stat-item">
            <ClipboardCheck size={20} />
            <span>40 questions</span>
          </div>
          <div className="stat-item">
            <Clock size={20} />
            <span>15-20 min</span>
          </div>
          <div className="stat-item">
            <BarChart3 size={20} />
            <span>A1 – B2</span>
          </div>
        </div>

        {/* What We Test */}
        <div className="landing-section">
          <h2>What we test</h2>
          <ul className="test-areas">
            <li>
              <span className="bullet">✓</span>
              <span><strong>Grammar</strong> — Articles, cases, verb forms, sentence structure</span>
            </li>
            <li>
              <span className="bullet">✓</span>
              <span><strong>Vocabulary</strong> — Everyday words and expressions</span>
            </li>
            <li>
              <span className="bullet">✓</span>
              <span><strong>Reading</strong> — Understanding short texts</span>
            </li>
          </ul>
        </div>

        {/* Tip Box */}
        <div className="landing-tip">
          <Lightbulb size={20} />
          <p>
            <strong>Tip:</strong> Answer honestly and skip questions you don't know.
            This helps us place you accurately.
          </p>
        </div>

        {/* CTA */}
        <button className="start-test-btn" onClick={onStart}>
          Start the test
        </button>

        <p className="landing-note">
          No account required • Results are instant
        </p>
      </div>
    </div>
  );
};

export default LevelTestLanding;
