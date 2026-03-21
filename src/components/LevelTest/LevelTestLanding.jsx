import React from 'react';
import { ClipboardCheck, Clock, BarChart3, Lightbulb, PenTool, Headphones, Mic, ChevronRight, Award, Target } from 'lucide-react';

const LevelTestLanding = ({ onStart }) => {
  return (
    <div className="level-test-container">
      <div className="level-test-landing enhanced">
        {/* Hero Section */}
        <div className="landing-hero">
          <div className="hero-badge">Free Assessment</div>
          <h1>Discover Your German Level</h1>
          <p className="hero-subtitle">
            Take our comprehensive placement test and get personalized recommendations for your learning journey
          </p>
        </div>

        {/* Stats Row */}
        <div className="landing-stats enhanced">
          <div className="stat-item">
            <div className="stat-icon">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">15-20</span>
              <span className="stat-label">Minutes</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">
              <ClipboardCheck size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">3</span>
              <span className="stat-label">Sections</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">
              <BarChart3 size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">A1-B2</span>
              <span className="stat-label">Levels</span>
            </div>
          </div>
        </div>

        {/* Test Structure */}
        <div className="test-structure">
          <h2>How it works</h2>
          <div className="structure-steps">
            <div className="structure-step">
              <div className="step-number">1</div>
              <div className="step-icon written">
                <PenTool size={24} />
              </div>
              <div className="step-content">
                <h3>Written Test</h3>
                <p>40 multiple choice questions on grammar, vocabulary & reading</p>
              </div>
              <div className="step-time">~12 min</div>
            </div>

            <div className="structure-step">
              <div className="step-number">2</div>
              <div className="step-icon listening">
                <Headphones size={24} />
              </div>
              <div className="step-content">
                <h3>Listening</h3>
                <p>Audio exercises with comprehension questions at your level</p>
              </div>
              <div className="step-time">~5 min</div>
            </div>

            <div className="structure-step">
              <div className="step-number">3</div>
              <div className="step-icon speaking">
                <Mic size={24} />
              </div>
              <div className="step-content">
                <h3>Speaking</h3>
                <p>Short AI conversation to assess your speaking skills</p>
              </div>
              <div className="step-time">~3 min</div>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="what-you-get">
          <h2>What you'll receive</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">
                <Award size={20} />
              </div>
              <div className="benefit-text">
                <strong>Your CEFR Level</strong>
                <span>Precise placement from A1.1 to B2.2</span>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <BarChart3 size={20} />
              </div>
              <div className="benefit-text">
                <strong>Skill Breakdown</strong>
                <span>See strengths & weaknesses</span>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <Target size={20} />
              </div>
              <div className="benefit-text">
                <strong>Personalized Path</strong>
                <span>Topics to focus on first</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="landing-tip enhanced">
          <Lightbulb size={20} />
          <div>
            <strong>Pro tip:</strong> Answer honestly and skip questions you're unsure about. This helps us place you accurately — guessing can lead to content that's too difficult.
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <button className="start-test-btn enhanced" onClick={onStart}>
            Start the Test
            <ChevronRight size={20} />
          </button>
          <p className="cta-note">
            No account required • Results are instant • 100% free
          </p>
        </div>
      </div>
    </div>
  );
};

export default LevelTestLanding;
