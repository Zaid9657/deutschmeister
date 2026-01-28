import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, MessageSquare, Info } from 'lucide-react';

const StageExamples = ({ content, isGerman, theme }) => {
  const [playingIndex, setPlayingIndex] = useState(null);

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
      <div className="space-y-3">
        {examples.map((example, index) => (
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
                  <p className="text-lg font-semibold text-slate-800 mb-1">
                    {example.german}
                  </p>
                  <p className="text-slate-600 mb-2">
                    {example.translation}
                  </p>

                  {/* Pronunciation & Hint */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
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
                </div>
              </div>
            </div>
          </motion.div>
        ))}
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
