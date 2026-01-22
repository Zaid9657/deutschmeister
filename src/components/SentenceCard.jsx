import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Volume2, Check, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';

const SentenceCard = ({ sentence, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const [showTranslation, setShowTranslation] = useState(false);

  const theme = getThemeForLevel(level);
  const learned = isItemLearned(level, 'sentences', sentence.id);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence.german);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleLearned = () => {
    if (learned) {
      unmarkAsLearned(level, 'sentences', sentence.id);
    } else {
      markAsLearned(level, 'sentences', sentence.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-colors ${
        learned ? `border-${theme.primary}` : 'border-slate-100'
      }`}
    >
      {/* Learned indicator bar */}
      {learned && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
      )}

      <div className="p-6">
        {/* Topic tag */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full bg-${theme.primary}/10 text-${theme.primary}`}
          >
            {sentence.topic}
          </span>
          {learned && (
            <span className={`flex items-center gap-1 text-xs font-medium text-${theme.primary}`}>
              <Check className="w-4 h-4" />
              {t('levelPage.learned')}
            </span>
          )}
        </div>

        {/* German sentence */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xl font-display text-slate-800 leading-relaxed">
              {sentence.german}
            </p>
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-full hover:bg-${theme.primary}/10 transition-colors flex-shrink-0`}
              title={t('levelPage.listenPronunciation')}
            >
              <Volume2 className={`w-5 h-5 text-${theme.primary}`} />
            </button>
          </div>
        </div>

        {/* Translation toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showTranslation ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide translation
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show translation
              </>
            )}
          </button>
          <motion.div
            initial={false}
            animate={{
              height: showTranslation ? 'auto' : 0,
              opacity: showTranslation ? 1 : 0,
            }}
            className="overflow-hidden"
          >
            <p className="pt-2 text-slate-600">{sentence.english}</p>
          </motion.div>
        </div>

        {/* Action button */}
        <button
          onClick={toggleLearned}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
            learned
              ? `bg-${theme.primary} text-white shadow-lg shadow-${theme.primary}/25`
              : `border-2 border-dashed border-slate-200 hover:border-${theme.primary} hover:bg-${theme.primary}/5 text-slate-600`
          }`}
        >
          {learned ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>{t('levelPage.learned')}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{t('levelPage.markLearned')}</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default SentenceCard;
