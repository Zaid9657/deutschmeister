import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Volume2, Check, Eye, EyeOff, BookOpen, Star } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const twColors = fullConfig.theme.colors;

function getHex(token) {
  if (!token) return undefined;
  const parts = token.split('-');
  const shade = parts.pop();
  const group = parts.join('-');
  return twColors?.[group]?.[shade];
}

const ParagraphCard = ({ paragraph, level }) => {
  const { t } = useTranslation();
  const { isItemLearned, markAsLearned, unmarkAsLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const [showTranslation, setShowTranslation] = useState(false);

  const theme = getThemeForLevel(level);
  const primaryHex = getHex(theme.primary);
  const secondaryHex = getHex(theme.secondary);
  const read = isItemLearned(level, 'paragraphs', paragraph.id);

  const handleSpeak = (text) => {
    if (paragraph.audioUrl) {
      const audio = new Audio(paragraph.audioUrl);
      audio.play().catch(() => speakWithSynthesis(text));
    } else {
      speakWithSynthesis(text);
    }
  };

  const speakWithSynthesis = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleRead = () => {
    if (read) {
      unmarkAsLearned(level, 'paragraphs', paragraph.id);
    } else {
      markAsLearned(level, 'paragraphs', paragraph.id);
    }
  };

  const renderDifficulty = (difficulty) => {
    const stars = [];
    for (let i = 1; i <= 3; i++) {
      stars.push(
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={{
            color: i <= difficulty ? primaryHex : '#cbd5e1',
            fill: i <= difficulty ? primaryHex : 'none',
          }}
        />
      );
    }
    return stars;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-colors"
      style={{ borderColor: read ? primaryHex : '#f1f5f9' }}
    >
      {/* Read indicator bar */}
      {read && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(to right, ${primaryHex}, ${secondaryHex})` }}
        />
      )}

      <div className="p-6">
        {/* Header: topic, difficulty, word count */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {paragraph.topic && (
            <span
              className="inline-block px-3 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: primaryHex + '1A', color: primaryHex }}
            >
              {paragraph.topic}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            {renderDifficulty(paragraph.difficulty)}
          </div>
          {paragraph.wordCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <BookOpen className="w-3.5 h-3.5" />
              {paragraph.wordCount} {t('levelPage.words')}
            </span>
          )}
          {read && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: primaryHex }}>
              <Check className="w-4 h-4" />
              {t('levelPage.read')}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-display font-semibold text-slate-800 mb-1">
                {paragraph.titleDe}
              </h3>
              <p className="text-sm text-slate-500">{paragraph.titleEn}</p>
            </div>
            <button
              onClick={() => handleSpeak(paragraph.contentDe)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
              title={t('levelPage.listenPronunciation')}
            >
              <Volume2 className="w-5 h-5" style={{ color: primaryHex }} />
            </button>
          </div>
        </div>

        {/* German content */}
        <div className="mb-4 p-4 bg-slate-50 rounded-xl">
          <p className="text-base leading-relaxed text-slate-800 font-body">
            {paragraph.contentDe}
          </p>
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
                {t('levelPage.hideTranslation')}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                {t('levelPage.showTranslation')}
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
            <p className="pt-3 p-4 bg-slate-50 rounded-xl text-slate-600 leading-relaxed">
              {paragraph.contentEn}
            </p>
          </motion.div>
        </div>

        {/* Mark as Read button */}
        <button
          onClick={toggleRead}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all border-2"
          style={
            read
              ? { backgroundColor: primaryHex, color: '#fff', borderColor: primaryHex }
              : { borderColor: '#e2e8f0', borderStyle: 'dashed', color: '#475569' }
          }
        >
          <Check className="w-4 h-4" />
          <span>{read ? t('levelPage.read') : t('levelPage.markRead')}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ParagraphCard;
