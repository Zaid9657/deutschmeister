import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, MessageSquare, BookMarked, Volume2, Mic, Sun, TreePine, Waves, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { vocabulary, sentences, grammar, levels } from '../data/content';
import WordCard from '../components/WordCard';
import SentenceCard from '../components/SentenceCard';
import GrammarCard from '../components/GrammarCard';
import SpeakingPractice from '../components/SpeakingPractice';

const iconMap = {
  a1: Sun,
  a2: TreePine,
  b1: Waves,
  b2: Moon,
};

const LevelPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setCurrentLevel, getThemeForLevel } = useTheme();
  const { getLevelProgress, isLevelUnlocked } = useProgress();

  const [activeTab, setActiveTab] = useState('vocabulary');

  const theme = getThemeForLevel(level);
  const progress = getLevelProgress(level);
  const unlocked = isLevelUnlocked(level);
  const Icon = iconMap[level] || Sun;

  useEffect(() => {
    if (!levels.includes(level) || !unlocked) {
      navigate('/dashboard');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, unlocked, navigate, setCurrentLevel]);

  const tabs = [
    { id: 'vocabulary', label: t('levelPage.vocabulary'), icon: BookOpen },
    { id: 'sentences', label: t('levelPage.sentences'), icon: MessageSquare },
    { id: 'grammar', label: t('levelPage.grammar'), icon: BookMarked },
    { id: 'audio', label: t('levelPage.audio'), icon: Volume2 },
    { id: 'speaking', label: t('levelPage.speaking'), icon: Mic },
  ];

  const levelVocabulary = vocabulary[level] || [];
  const levelSentences = sentences[level] || [];
  const levelGrammar = grammar[level] || [];

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 pb-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                  {t(`levels.${level}.name`)}
                </h1>
                <p className="text-slate-600">{t(`levels.${level}.theme`)}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">{t('dashboard.progress')}</p>
                <p className="text-2xl font-bold text-slate-800">{progress}%</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="fill-none stroke-slate-200"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    className={`fill-none stroke-current text-${theme.primary}`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 251.2' }}
                    animate={{ strokeDasharray: `${(progress / 100) * 251.2} 251.2` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Vocabulary Tab */}
            {activeTab === 'vocabulary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levelVocabulary.map((word) => (
                  <WordCard key={word.id} word={word} level={level} />
                ))}
              </div>
            )}

            {/* Sentences Tab */}
            {activeTab === 'sentences' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {levelSentences.map((sentence) => (
                  <SentenceCard key={sentence.id} sentence={sentence} level={level} />
                ))}
              </div>
            )}

            {/* Grammar Tab */}
            {activeTab === 'grammar' && (
              <div className="space-y-4">
                {levelGrammar.map((item) => (
                  <GrammarCard key={item.id} grammar={item} level={level} />
                ))}
              </div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <h2 className="font-display text-2xl font-bold text-slate-800 mb-6">
                  {t('levelPage.listenPronunciation')}
                </h2>
                <p className="text-slate-600 mb-8">
                  Click on any word or sentence to hear its pronunciation.
                </p>

                {/* Vocabulary Audio List */}
                <div className="mb-8">
                  <h3 className="font-semibold text-slate-700 mb-4">Vocabulary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {levelVocabulary.map((word) => (
                      <button
                        key={word.id}
                        onClick={() => handleSpeak(word.word)}
                        className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-${theme.primary}/10 transition-colors text-left`}
                      >
                        <Volume2 className={`w-5 h-5 text-${theme.primary} flex-shrink-0`} />
                        <div>
                          <p className="font-medium text-slate-800">{word.word}</p>
                          <p className="text-sm text-slate-500">{word.translation}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sentences Audio List */}
                <div>
                  <h3 className="font-semibold text-slate-700 mb-4">Sentences</h3>
                  <div className="space-y-3">
                    {levelSentences.map((sentence) => (
                      <button
                        key={sentence.id}
                        onClick={() => handleSpeak(sentence.german)}
                        className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-${theme.primary}/10 transition-colors text-left w-full`}
                      >
                        <Volume2 className={`w-5 h-5 text-${theme.primary} flex-shrink-0`} />
                        <div>
                          <p className="font-medium text-slate-800">{sentence.german}</p>
                          <p className="text-sm text-slate-500">{sentence.english}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Speaking Tab */}
            {activeTab === 'speaking' && (
              <SpeakingPractice level={level} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LevelPage;
