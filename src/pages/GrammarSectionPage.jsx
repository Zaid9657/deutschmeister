import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon, ChevronDown, Lock, Sparkles } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { getTopicsForLevel, getTotalGrammarTopics } from '../data/grammarTopics';
import SEO from '../components/SEO';

const faqItems = [
  {
    question: 'How many grammar topics does DeutschMeister cover?',
    answer: 'DeutschMeister covers 64 German grammar topics across 8 CEFR levels, from A1.1 (complete beginner) to B2.2 (upper intermediate).',
  },
  {
    question: 'Is DeutschMeister free?',
    answer: 'A1.1 content (grammar, vocabulary, listening) is completely free — no account required. Sign up for a free 7-day trial to unlock all levels from A1.2 to B2.2.',
  },
  {
    question: 'Are the grammar explanations in English or German?',
    answer: "Both! Every topic is explained in English first, with a bilingual toggle to switch to German when you're ready.",
  },
  {
    question: "What's included in each grammar lesson?",
    answer: 'Each lesson includes an introduction, examples with audio, clear grammar rules, and interactive exercises with answer explanations.',
  },
  {
    question: 'What levels does DeutschMeister cover?',
    answer: 'We cover A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, and B2.2 — taking you from beginner to upper intermediate.',
  },
];

const mainLevelInfo = {
  A1: { name: 'Sunrise Warmth', icon: '🌅', color: 'from-amber-400 to-orange-400' },
  A2: { name: 'Forest Calm', icon: '🌿', color: 'from-emerald-400 to-teal-400' },
  B1: { name: 'Ocean Depth', icon: '🌊', color: 'from-blue-400 to-indigo-400' },
  B2: { name: 'Twilight Elegance', icon: '🌙', color: 'from-purple-400 to-pink-400' },
};

const iconMap = {
  'a1.1': Sun,
  'a1.2': Sun,
  'a2.1': TreePine,
  'a2.2': TreePine,
  'b1.1': Waves,
  'b1.2': Waves,
  'b2.1': Moon,
  'b2.2': Moon,
};

const GrammarSectionPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getGrammarSectionProgress, getGrammarTopicProgress } = useProgress();
  const { getThemeForLevel } = useTheme();

  const isGerman = i18n.language === 'de';
  const totalTopics = getTotalGrammarTopics();

  // Calculate overall grammar progress
  const calculateOverallProgress = () => {
    let completedTopics = 0;
    mainLevels.forEach(mainLevel => {
      const subLevels = getSubLevels(mainLevel);
      subLevels.forEach(level => {
        const topics = getTopicsForLevel(level);
        topics.forEach(topic => {
          const progress = getGrammarTopicProgress ? getGrammarTopicProgress(level, topic.id) : { completed: false };
          if (progress.completed) completedTopics++;
        });
      });
    });
    return Math.round((completedTopics / totalTopics) * 100);
  };

  const overallProgress = calculateOverallProgress();

  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const isFreeOrHasAccess = (level) => isLevelFree(level) || (user && hasAccess);

  // Grammar level card component
  const GrammarLevelCard = ({ level }) => {
    const theme = getThemeForLevel(level);
    const Icon = iconMap[level] || Sun;
    const levelInfo = contentLevelThemes[level] || {};
    const topics = getTopicsForLevel(level);
    const free = isLevelFree(level);
    const accessible = isFreeOrHasAccess(level);

    // Calculate progress for this level
    let completedTopics = 0;
    topics.forEach(topic => {
      const progress = getGrammarTopicProgress ? getGrammarTopicProgress(level, topic.id) : { completed: false };
      if (progress.completed) completedTopics++;
    });
    const progressPercent = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

    const handleClick = () => {
      navigate(`/grammar/${level}`);
    };

    const displayLevel = level.toUpperCase();
    const part = levelInfo.part || (level.endsWith('.1') ? 1 : 2);

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className={`relative bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md ${
          progressPercent === 100 ? 'border-emerald-200' : 'border-slate-200'
        }`}
      >
        {/* Completed indicator bar */}
        {progressPercent === 100 && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
        )}

        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-800">
                  {displayLevel}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                  Part {part}
                </span>
                {free && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-semibold">
                    FREE
                  </span>
                )}
                {!accessible && !free && (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <p className="text-sm text-slate-600">
                {topics.length} {isGerman ? 'Themen' : 'topics'}
              </p>
            </div>

            {/* Progress / Status */}
            <div className="flex-shrink-0 flex items-center gap-3">
              {accessible ? (
                <>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {completedTopics}/{topics.length}
                    </p>
                    <p className="text-xs text-slate-400">
                      {progressPercent}%
                    </p>
                  </div>
                  {progressPercent === 100 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </>
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          {accessible && progressPercent > 0 && progressPercent < 100 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full`}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const [openFaq, setOpenFaq] = useState(null);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <SEO
        title="German Grammar Lessons | 64 Free Topics"
        description="Master German grammar with 64 free lessons across 8 CEFR levels (A1–B2). Clear explanations, examples, and interactive exercises for every topic."
        path="/grammar"
        structuredData={faqSchema}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <BookMarked className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                {isGerman ? 'Grammatik' : 'Grammar'}
              </h1>
              <p className="text-slate-600">
                {isGerman
                  ? 'Meistere deutsche Grammatik Schritt für Schritt'
                  : 'Master German grammar step by step'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{totalTopics}</p>
            <p className="text-sm text-slate-500">{isGerman ? 'Themen gesamt' : 'Total Topics'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">8</p>
            <p className="text-sm text-slate-500">{isGerman ? 'Stufen' : 'Levels'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">5</p>
            <p className="text-sm text-slate-500">{isGerman ? 'Phasen pro Thema' : 'Stages per Topic'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-emerald-600">{overallProgress}%</p>
            <p className="text-sm text-slate-500">{isGerman ? 'Fortschritt' : 'Progress'}</p>
          </div>
        </motion.div>

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">
              {isGerman ? 'Gesamtfortschritt Grammatik' : 'Overall Grammar Progress'}
            </h2>
            <span className="text-lg font-bold text-slate-800">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Level Groups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {mainLevels.map((mainLevel, groupIndex) => {
            const info = mainLevelInfo[mainLevel];
            const subLevels = getSubLevels(mainLevel);

            return (
              <motion.div
                key={mainLevel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + groupIndex * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100"
              >
                {/* Main Level Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${info.color} flex items-center justify-center`}>
                    <span className="text-xl">{info.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-800">
                      {mainLevel} - {info.name}
                    </h3>
                    <p className="text-xs text-slate-500">16 {isGerman ? 'Grammatik-Themen' : 'grammar topics'}</p>
                  </div>
                </div>

                {/* Sub-Level Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subLevels.map((level, index) => (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + groupIndex * 0.1 + index * 0.05 }}
                    >
                      <GrammarLevelCard level={level} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100"
        >
          <p className="text-sm text-indigo-700 text-center">
            {isGerman
              ? 'Jedes Grammatik-Thema hat 5 Lernphasen: Einführung, geführte Übung, freie Übung, Quiz und Meisterschaft.'
              : 'Each grammar topic has 5 learning stages: Introduction, Guided Practice, Free Practice, Quiz, and Mastery.'}
          </p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12"
        >
          <h2 className="font-display text-2xl font-bold text-slate-800 mb-6 text-center">
            {isGerman ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-800 pr-4">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GrammarSectionPage;
