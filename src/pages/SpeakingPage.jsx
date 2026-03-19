import { useState } from 'react';
import { Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LEVEL_CONFIGS, getConfigForLevel } from '../constants/speakingPrompts';
import SpeakingPractice from '../components/SpeakingPractice';
import SpeakingEvaluationResults from '../components/SpeakingEvaluationResults';

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

function getNextLevel(current) {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
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

  // Practice phase
  if (phase === 'practice' && selectedLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
        <SpeakingPractice
          level={selectedLevel}
          userId={user?.id}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Results phase
  if (phase === 'results' && evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Sprechen üben</h1>
          <p className="text-slate-500">
            Wähle dein Level für eine 10-minütige Übung
          </p>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LEVEL_ORDER.map((level) => {
            const config = getConfigForLevel(level);
            if (!config) return null;

            return (
              <button
                key={level}
                onClick={() => handleSelectLevel(level)}
                className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-md hover:shadow-teal-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
                    {config.level}
                  </span>
                  <Mic className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                </div>

                <h3 className="font-semibold text-slate-800 mb-1">{config.name}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{config.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {config.topics.slice(0, 3).map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpeakingPage;
