import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, RotateCcw, ChevronDown, BookOpen, Lightbulb } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';

const GrammarCard = ({ grammar, level }) => {
  const { t, i18n } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const theme = getThemeForLevel(level);
  const learned = isItemLearned(level, 'grammar', grammar.id);
  const isGerman = i18n.language === 'de';

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleLearned = () => {
    if (learned) {
      unmarkAsLearned(level, 'grammar', grammar.id);
    } else {
      markAsLearned(level, 'grammar', grammar.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-colors ${
        learned ? `border-${theme.primary}` : 'border-slate-100'
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 cursor-pointer transition-colors ${
          isExpanded ? `bg-gradient-to-r ${theme.gradient} text-white` : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen
                className={`w-5 h-5 ${isExpanded ? 'text-white/80' : `text-${theme.primary}`}`}
              />
              <h3
                className={`text-lg font-display font-semibold ${
                  isExpanded ? 'text-white' : 'text-slate-800'
                }`}
              >
                {isGerman ? grammar.titleDe : grammar.title}
              </h3>
            </div>
            <p
              className={`font-mono text-sm ${
                isExpanded ? 'text-white/90' : 'text-slate-600'
              }`}
            >
              {grammar.rule}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {learned && !isExpanded && (
              <span className={`flex items-center gap-1 text-xs font-medium text-${theme.primary}`}>
                <Check className="w-4 h-4" />
              </span>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className={`p-1 rounded-full ${
                isExpanded ? 'bg-white/20' : 'bg-slate-100'
              }`}
            >
              <ChevronDown
                className={`w-5 h-5 ${isExpanded ? 'text-white' : 'text-slate-500'}`}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 pt-0 border-t border-slate-100">
              {/* Explanation */}
              <div className="mt-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className={`w-4 h-4 text-${theme.primary}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {t('levelPage.explanation')}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {isGerman ? grammar.explanationDe : grammar.explanation}
                </p>
              </div>

              {/* Example */}
              <div className="p-4 bg-slate-50 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">
                    {t('levelPage.example')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(grammar.example);
                    }}
                    className={`p-1 rounded-full hover:bg-${theme.primary}/10 transition-colors`}
                  >
                    <Volume2 className={`w-4 h-4 text-${theme.primary}`} />
                  </button>
                </div>
                <p className="text-slate-800 font-medium mb-1">{grammar.example}</p>
                <p className="text-slate-500 text-sm">{grammar.exampleTranslation}</p>
              </div>

              {/* Action button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLearned();
                }}
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GrammarCard;
