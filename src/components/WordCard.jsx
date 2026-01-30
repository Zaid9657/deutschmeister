import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, BookOpen } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const twColors = fullConfig.theme.colors;

/** Look up the hex value for a theme color token like 'a1-1-primary' */
function getHex(token) {
  if (!token) return undefined;
  const parts = token.split('-');
  // e.g. 'a1-1-primary' → group='a1-1', shade='primary'
  const shade = parts.pop();
  const group = parts.join('-');
  return twColors?.[group]?.[shade];
}

const WordCard = ({ word, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const [showExample, setShowExample] = useState(false);

  const theme = getThemeForLevel(level);
  const primaryHex = getHex(theme.primary);
  const learned = isItemLearned(level, 'vocabulary', word.id);

  const handleSpeak = (text) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(() => {
        // Fall back to speech synthesis if audio_url fails
        speakWithSynthesis(text);
      });
    } else {
      speakWithSynthesis(text);
    }
  };

  const speakWithSynthesis = (text) => {
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
        className="relative bg-white rounded-2xl shadow-lg border-2 transition-colors"
        style={{ borderColor: learned ? primaryHex : '#f1f5f9' }}
      >
        {/* Learned badge */}
        {learned && (
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: primaryHex }}
          >
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Card content */}
        <div className="p-6">
          {/* Category tag */}
          {word.category && (
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                style={{ backgroundColor: primaryHex + '1A', color: primaryHex }}
              >
                {word.category}
              </span>
            </div>
          )}

          {/* Main word */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-display font-semibold text-slate-800">
                {word.article && !word.word.toLowerCase().startsWith(word.article.toLowerCase()) && (
                  <span className="text-slate-400 mr-1">{word.article}</span>
                )}
                {word.word}
              </h3>
              <button
                onClick={() => handleSpeak(word.word)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                title={t('levelPage.listenPronunciation')}
              >
                <Volume2 className="w-5 h-5" style={{ color: primaryHex }} />
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
                <div className="flex items-start justify-between">
                  <p className="text-slate-800 font-medium">{word.example}</p>
                  <button
                    onClick={() => handleSpeak(word.example)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0 ml-2"
                  >
                    <Volume2 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExample(!showExample)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{t('levelPage.example')}</span>
            </button>
            <button
              onClick={toggleLearned}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition-colors border"
              style={
                learned
                  ? { backgroundColor: primaryHex, color: '#fff', borderColor: primaryHex }
                  : { borderColor: '#e2e8f0', color: '#334155' }
              }
            >
              {learned ? (
                <>
                  <Check className="w-4 h-4" />
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
