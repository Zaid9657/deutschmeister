import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, MessageSquare, Info, Star, Lightbulb, ArrowRight } from 'lucide-react';

const StageExamples = ({ content, isGerman, theme }) => {
  const [playingIndex, setPlayingIndex] = useState(null);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());

  if (!content) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Inhalt wird geladen...' : 'Loading content...'}
      </div>
    );
  }

  const { title, examples } = content;

  const handleSpeak = (text, index) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.8;

      utterance.onstart = () => setPlayingIndex(index);
      utterance.onend = () => setPlayingIndex(null);
      utterance.onerror = () => setPlayingIndex(null);

      speechSynthesis.speak(utterance);
    }
  };

  const toggleExplanation = (index) => {
    setExpandedExplanations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getDifficultyBadge = (difficulty) => {
    const levels = {
      1: { stars: 1, label: isGerman ? 'Leicht' : 'Easy', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      2: { stars: 2, label: isGerman ? 'Mittel' : 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      3: { stars: 3, label: isGerman ? 'Schwer' : 'Hard', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    };

    const level = levels[difficulty] || levels[1];

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${level.color}`}>
        {[...Array(level.stars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-current" />
        ))}
        <span>{level.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">
          {isGerman ? title.de : title.en}
        </h3>
        <p className="text-slate-600">
          {isGerman
            ? 'Klicke auf das Lautsprechersymbol, um die Aussprache zu hören.'
            : 'Click the speaker icon to hear the pronunciation.'}
        </p>
      </motion.div>

      {/* Examples Grid */}
      <div className="space-y-4">
        {examples.map((example, index) => {
          const isExpanded = expandedExplanations.has(index);
          const hasExplanation = example.explanation && (example.explanation.en || example.explanation.de);
          const hasWordBreakdown = example.wordBreakdown && example.wordBreakdown.length > 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                playingIndex === index ? 'border-emerald-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Audio Button */}
                  <button
                    onClick={() => handleSpeak(example.german, index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      playingIndex === index
                        ? `bg-gradient-to-br ${theme.gradient} text-white shadow-lg scale-105`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Volume2 className={`w-5 h-5 ${playingIndex === index ? 'animate-pulse' : ''}`} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Difficulty Badge */}
                    {example.difficulty && (
                      <div className="mb-2">
                        {getDifficultyBadge(example.difficulty)}
                      </div>
                    )}

                    <p className="text-lg font-semibold text-slate-800 mb-1">
                      {example.german}
                    </p>
                    <p className="text-slate-600 mb-2">
                      {example.translation}
                    </p>

                    {/* Pronunciation & Hint */}
                    <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                      {example.pronunciation && (
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono">
                          /{example.pronunciation}/
                        </span>
                      )}
                      {example.audioHint && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Info className="w-3.5 h-3.5" />
                          {example.audioHint}
                        </span>
                      )}
                    </div>

                    {/* NEW: Explanation (why this example works) */}
                    {hasExplanation && (
                      <button
                        onClick={() => toggleExplanation(index)}
                        className="w-full text-left"
                      >
                        <div className={`mt-3 p-3 rounded-lg border transition-all ${
                          isExpanded
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-blue-800 text-sm">
                                {isGerman ? 'Warum funktioniert das?' : 'Why This Works'}
                              </span>
                            </div>
                            <ArrowRight className={`w-4 h-4 text-blue-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                          {isExpanded && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-blue-900 text-sm leading-relaxed"
                            >
                              {isGerman ? example.explanation.de : example.explanation.en}
                            </motion.p>
                          )}
                        </div>
                      </button>
                    )}

                    {/* NEW: Word Breakdown */}
                    {hasWordBreakdown && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h5 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {isGerman ? 'Wort-für-Wort' : 'Word-by-Word'}
                        </h5>
                        <div className="space-y-1">
                          {example.wordBreakdown.map((word, wIndex) => (
                            <div key={wIndex} className="flex items-start gap-2 text-sm">
                              <span className="font-semibold text-amber-900 min-w-[80px]">
                                {word.german}
                              </span>
                              <span className="text-amber-700">
                                → {word.meaning}
                              </span>
                              {word.grammar_note && (
                                <span className="text-amber-600 italic text-xs">
                                  ({word.grammar_note})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"
      >
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-800 mb-1">
              {isGerman ? 'Übungstipp' : 'Practice Tip'}
            </h4>
            <p className="text-emerald-700 text-sm">
              {isGerman
                ? 'Höre dir jeden Satz an und wiederhole ihn laut. Achte auf die Betonung und die Aussprache.'
                : 'Listen to each sentence and repeat it out loud. Pay attention to the stress and pronunciation.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StageExamples;
