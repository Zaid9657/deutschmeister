import { useEffect } from 'react';
import { Trophy, ArrowRight, RotateCcw, ArrowLeft, Star, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';
import Stat from './ui/Stat.jsx';
import Reveal from './ui/Reveal.jsx';
import confettiBurst from '../lib/confetti.js';

const SCORE_LABELS = {
  // True acoustic pronunciation scoring planned — requires audio analysis pipeline
  intelligibility: 'Intelligibility',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  fluency: 'Fluency',
  comprehension: 'Comprehension',
};

// Semantic tones only (playbook §1): success = limette, attention = aprikose,
// the neutral "keep going" verdict sits on the siegel wash. The words carry the
// verdict; the colour never does it alone.
const RECOMMENDATION_CONFIG = {
  'HÖHER': {
    label: 'Ready for the next level!',
    tone: 'limette',
    Icon: TrendingUp,
  },
  'GLEICH': {
    label: 'Keep practicing at this level',
    tone: 'label',
    Icon: Star,
  },
  'WIEDERHOLEN': {
    label: 'Worth repeating this lesson',
    tone: 'aprikose',
    Icon: AlertTriangle,
  },
};

function getScoreColor(score) {
  if (score >= 16) return 'bg-accent-limette';
  if (score >= 12) return 'bg-siegel';
  if (score >= 8) return 'bg-accent-aprikose';
  return 'bg-accent-himbeer';
}

function getRingColor(total) {
  if (total >= 80) return 'stroke-accent-limette';
  if (total >= 60) return 'stroke-siegel';
  if (total >= 40) return 'stroke-accent-aprikose';
  return 'stroke-accent-himbeer';
}

const SpeakingEvaluationResults = ({ level, evaluation, onRetry, onNextLevel, onBack }) => {
  const recommendation = evaluation?.recommendation;

  // HÖHER is the one earned moment on this screen (playbook §0: pass =
  // celebrate, fail = calm). GLEICH and WIEDERHOLEN get no confetti.
  useEffect(() => {
    if (recommendation === 'HÖHER') confettiBurst();
  }, [recommendation]);

  if (!evaluation) return null;

  const {
    total_score,
    scores = {},
    feedback,
    strengths = [],
    improvements = [],
  } = evaluation;

  const recConfig = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG['GLEICH'];
  const RecIcon = recConfig.Icon;

  const circumference = 2 * Math.PI * 54;
  const progress = (total_score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Chip tone="label">{level}</Chip>
          <span className="text-sm text-graphite">Speaking session complete</span>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              className="stroke-rule"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              className={getRingColor(total_score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Stat value={total_score} size="lg" className="text-center" />
            <span className="font-data text-[0.75rem] text-graphite">/ 100</span>
          </div>
        </div>

        {/* Recommendation Badge */}
        <Chip tone={recConfig.tone} size="md" className="mt-4">
          <RecIcon className="w-4 h-4" />
          {recConfig.label}
        </Chip>
      </div>

      {/* Score Breakdown — each figure counts up in its own raised card */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-siegel" />
          Score breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(SCORE_LABELS).map(([key, label], i) => {
            const score = scores[key] ?? 0;
            return (
              <Reveal key={key} delay={i * 80}>
                <Card raised className="p-4 h-full">
                  <Stat value={score} suffix="/20" size="sm" label={label} />
                  <div className="w-full h-2 mt-3 bg-paper-sunk rounded-pill overflow-hidden">
                    <div
                      className={`h-full rounded-pill ${getScoreColor(score)}`}
                      style={{ width: `${(score / 20) * 100}%`, transition: 'width 0.8s ease-out' }}
                    />
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <Card tone="sunk" className="p-5 mb-4">
          <h3 className="text-sm font-bold text-ink mb-2">Feedback</h3>
          <p className="text-sm text-graphite leading-relaxed">{feedback}</p>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {strengths.length > 0 && (
          <Card className="p-4">
            <h4 className="text-sm font-bold text-accent-limette-ink mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Strengths
            </h4>
            <ul className="flex flex-wrap gap-1.5">
              {strengths.map((s, i) => (
                <li key={i}><Chip tone="limette" size="md" className="text-left">{s}</Chip></li>
              ))}
            </ul>
          </Card>
        )}
        {improvements.length > 0 && (
          <Card className="p-4">
            <h4 className="text-sm font-bold text-accent-aprikose-ink mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              To work on
            </h4>
            <ul className="flex flex-wrap gap-1.5">
              {improvements.map((imp, i) => (
                <li key={i}><Chip tone="aprikose" size="md" className="text-left">{imp}</Chip></li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {recommendation === 'HÖHER' && onNextLevel && (
          <Button size="lg" shimmer className="w-full" onClick={onNextLevel}>
            <ArrowRight className="w-5 h-5" />
            Start the next level
          </Button>
        )}

        <Button
          size="lg"
          variant={recommendation === 'HÖHER' ? 'secondary' : 'primary'}
          shimmer={recommendation !== 'HÖHER'}
          className="w-full"
          onClick={onRetry}
        >
          <RotateCcw className="w-5 h-5" />
          {recommendation === 'WIEDERHOLEN' ? 'Repeat the lesson' : 'Practice again'}
        </Button>

        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to overview
        </Button>
      </div>
    </div>
  );
};

export default SpeakingEvaluationResults;
