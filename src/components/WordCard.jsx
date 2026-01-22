import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, RotateCcw, BookOpen } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';

const WordCard = ({ word, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const theme = getThemeForLevel(level);
  const learned = isItemLearned(level, 'vocabulary', word.id);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleLearned = () => {
    if (learned) {
      unmarkAsLearned(level, 'vocabulary', word.id);
    } else {
      markAsLearned(level, 'vocabulary', word.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative"
    >
      <div
        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-colors ${
          learned ? `border-${theme.primary}` : 'border-slate-100'
        }`}
      >
        {/* Learned badge */}
        {learned && (
          <div
            className={`absolute -top-2 -right-2 w-8 h-8 bg-${theme.primary} rounded-full flex items-center justify-center shadow-lg`}
          >
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Card content */}
        <div className="p-6">
          {/* Category tag */}
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full bg-${theme.primary}/10 text-${theme.primary}`}
            >
              {word.category}
            </span>
          </div>

          {/* Main word */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-display font-semibold text-slate-800">
                {word.word}
              </h3>
              <button
                onClick={() => handleSpeak(word.word)}
                className={`p-2 rounded-full hover:bg-${theme.primary}/10 transition-colors`}
                title={t('levelPage.listenPronunciation')}
              >
                <Volume2 className={`w-5 h-5 text-${theme.primary}`} />
              </button>
            </div>
            <p className="text-slate-600">{word.translation}</p>
          </div>

          {/* Example section */}
          <AnimatePresence>
            {showExample && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-slate-800 font-medium">{word.example}</p>
                  <button
                    onClick={() => handleSpeak(word.example)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0 ml-2"
                  >
                    <Volume2 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <p className="text-slate-500 text-sm">{word.exampleTranslation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExample(!showExample)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:border-${theme.primary} hover:bg-${theme.primary}/5 transition-colors`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{t('levelPage.example')}</span>
            </button>
            <button
              onClick={toggleLearned}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition-colors ${
                learned
                  ? `bg-${theme.primary} text-white`
                  : `border border-slate-200 hover:bg-${theme.primary}/10`
              }`}
            >
              {learned ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">{t('levelPage.learned')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{t('levelPage.markLearned')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WordCard;
