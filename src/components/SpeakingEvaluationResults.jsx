import { Trophy, ArrowRight, RotateCcw, ArrowLeft, Star, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

const SCORE_LABELS = {
  pronunciation: 'Aussprache',
  grammar: 'Grammatik',
  vocabulary: 'Wortschatz',
  fluency: 'Flüssigkeit',
  comprehension: 'Verständnis',
};

const RECOMMENDATION_CONFIG = {
  'HÖHER': {
    label: 'Bereit für das nächste Niveau!',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    Icon: TrendingUp,
  },
  'GLEICH': {
    label: 'Weiter üben auf diesem Niveau',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    Icon: Star,
  },
  'WIEDERHOLEN': {
    label: 'Lektion wiederholen empfohlen',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    Icon: AlertTriangle,
  },
};

function getScoreColor(score) {
  if (score >= 16) return 'bg-green-500';
  if (score >= 12) return 'bg-teal-500';
  if (score >= 8) return 'bg-amber-500';
  return 'bg-red-500';
}

function getTotalColor(total) {
  if (total >= 80) return 'text-green-600';
  if (total >= 60) return 'text-teal-600';
  if (total >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getRingColor(total) {
  if (total >= 80) return 'stroke-green-500';
  if (total >= 60) return 'stroke-teal-500';
  if (total >= 40) return 'stroke-amber-500';
  return 'stroke-red-500';
}

const SpeakingEvaluationResults = ({ level, evaluation, onRetry, onNextLevel, onBack }) => {
  if (!evaluation) return null;

  const {
    total_score,
    scores = {},
    recommendation,
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
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
            {level}
          </span>
          <span className="text-sm text-slate-500">Sprechübung abgeschlossen</span>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#e2e8f0"
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
            <span className={`text-3xl font-bold ${getTotalColor(total_score)}`}>
              {total_score}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Recommendation Badge */}
        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${recConfig.bg} ${recConfig.text} ${recConfig.border} text-sm font-medium`}>
          <RecIcon className="w-4 h-4" />
          {recConfig.label}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-teal-500" />
          Bewertung im Detail
        </h3>
        <div className="space-y-3">
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const score = scores[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-700">{score}/20</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(score)}`}
                    style={{ width: `${(score / 20) * 100}%`, transition: 'width 0.8s ease-out' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Feedback</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {strengths.length > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Stärken
            </h4>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">{s}</li>
              ))}
            </ul>
          </div>
        )}
        {improvements.length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Verbesserungen
            </h4>
            <ul className="space-y-1">
              {improvements.map((imp, i) => (
                <li key={i} className="text-sm text-amber-700">{imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {recommendation === 'HÖHER' && onNextLevel && (
          <button
            onClick={onNextLevel}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-200"
          >
            <ArrowRight className="w-5 h-5" />
            Nächstes Niveau starten
          </button>
        )}

        <button
          onClick={onRetry}
          className={`flex items-center justify-center gap-2 w-full py-3.5 font-semibold rounded-xl transition-colors ${
            recommendation === 'HÖHER'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-200'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
          {recommendation === 'WIEDERHOLEN' ? 'Lektion wiederholen' : 'Nochmal üben'}
        </button>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </button>
      </div>
    </div>
  );
};

export default SpeakingEvaluationResults;
