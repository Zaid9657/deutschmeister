import { useState } from 'react';
import { Mic, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LEVEL_CONFIGS, getConfigForLevel } from '../constants/speakingPrompts';
import SpeakingPractice from '../components/SpeakingPractice';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

const LEVEL_COLORS = {
  'A1.1': { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', pill: 'bg-emerald-50 text-emerald-600', dots: 1 },
  'A1.2': { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', pill: 'bg-emerald-50 text-emerald-600', dots: 1 },
  'A2.1': { accent: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 ring-teal-200', pill: 'bg-teal-50 text-teal-600', dots: 2 },
  'A2.2': { accent: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 ring-teal-200', pill: 'bg-teal-50 text-teal-600', dots: 2 },
  'B1.1': { accent: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200', pill: 'bg-blue-50 text-blue-600', dots: 3 },
  'B1.2': { accent: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200', pill: 'bg-blue-50 text-blue-600', dots: 3 },
  'B2.1': { accent: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', pill: 'bg-indigo-50 text-indigo-600', dots: 4 },
  'B2.2': { accent: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', pill: 'bg-indigo-50 text-indigo-600', dots: 4 },
};

function getNextLevel(current) {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

function DifficultyDots({ count }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i <= count ? 'bg-slate-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function SoundWaveSVG() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-60" aria-hidden="true">
      <path d="M20 60 Q30 20 40 60 Q50 100 60 60 Q70 20 80 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M60 60 Q70 30 80 60 Q90 90 100 60 Q110 30 120 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-teal-400" />
      <path d="M100 60 Q110 15 120 60 Q130 105 140 60 Q150 15 160 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-300" />
      <path d="M140 60 Q150 35 160 60 Q170 85 180 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-200" />
      <circle cx="30" cy="60" r="3" className="fill-teal-300 opacity-40" />
      <circle cx="90" cy="60" r="4" className="fill-teal-400 opacity-30" />
      <circle cx="150" cy="60" r="3" className="fill-teal-300 opacity-40" />
    </svg>
  );
}

const SpeakingPage = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState('select');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setEvaluation(null);
    setPhase('practice');
  };

  const handleComplete = (eval_) => {
    setEvaluation(eval_);
    setPhase(eval_ ? 'results' : 'select');
  };

  const handleCancel = () => {
    setSelectedLevel(null);
    setPhase('select');
  };

  const handleRetry = () => {
    setEvaluation(null);
    setPhase('practice');
  };

  const handleNextLevel = () => {
    const next = getNextLevel(selectedLevel);
    if (next) {
      setSelectedLevel(next);
      setEvaluation(null);
      setPhase('practice');
    }
  };

  const handleBack = () => {
    setSelectedLevel(null);
    setEvaluation(null);
    setPhase('select');
  };

  // Practice phase — full viewport, no wrapper needed
  if (phase === 'practice' && selectedLevel) {
    return (
      <SpeakingPractice
        level={selectedLevel}
        userId={user?.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Results phase
  if (phase === 'results' && evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12 px-4">
        <SpeakingEvaluationResults
          level={selectedLevel}
          evaluation={evaluation}
          onRetry={handleRetry}
          onNextLevel={getNextLevel(selectedLevel) ? handleNextLevel : undefined}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Select phase
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-teal-500/10 via-teal-500/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center justify-between">
            <div className="flex-1 animate-[fadeInUp_0.5s_ease-out]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-700 text-xs font-semibold mb-4 tracking-wide uppercase">
                <Mic className="w-3.5 h-3.5" />
                KI-Sprachpraxis
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                Sprechen üben
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-md leading-relaxed">
                Wähle dein Level und führe ein 10-minütiges Gespräch mit deinem KI-Sprachpartner.
              </p>
            </div>
            <div className="hidden sm:block w-48 h-28 flex-shrink-0 ml-8 animate-[fadeIn_0.8s_ease-out]">
              <SoundWaveSVG />
            </div>
          </div>
        </div>
      </div>

      {/* Level Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 -mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {LEVEL_ORDER.map((level, index) => {
            const config = getConfigForLevel(level);
            const colors = LEVEL_COLORS[level];
            if (!config) return null;

            return (
              <button
                key={level}
                onClick={() => handleSelectLevel(level)}
                className="group relative text-left rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 hover:border-gray-300/80 active:scale-[0.98]"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent} rounded-l-2xl`} />

                <div className="p-5 pl-6">
                  {/* Top row: badge + difficulty */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ring-1 ${colors.badge}`}>
                        {config.level}
                      </span>
                      <DifficultyDots count={colors.dots} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Title + description */}
                  <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                    {config.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3.5 line-clamp-2">
                    {config.description}
                  </p>

                  {/* Bottom: topic pills + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {config.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium truncate ${colors.pill}`}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px] font-medium">~10 Min</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SpeakingPage;
