import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookMarked, Lock, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import { mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { getTopicsForLevel, getTotalGrammarTopics } from '../data/grammarTopics';

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
  const { isLevelUnlocked, getGrammarSectionProgress, getGrammarTopicProgress } = useProgress();
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

  // Grammar level card component
  const GrammarLevelCard = ({ level }) => {
    const theme = getThemeForLevel(level);
    const unlocked = isLevelUnlocked(level);
    const Icon = iconMap[level] || Sun;
    const levelInfo = contentLevelThemes[level] || {};
    const topics = getTopicsForLevel(level);

    // Calculate progress for this level
    let completedTopics = 0;
    topics.forEach(topic => {
      const progress = getGrammarTopicProgress ? getGrammarTopicProgress(level, topic.id) : { completed: false };
      if (progress.completed) completedTopics++;
    });
    const progressPercent = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

    const handleClick = () => {
      if (unlocked) {
        navigate(`/grammar/${level}`);
      }
    };

    const displayLevel = level.toUpperCase();
    const part = levelInfo.part || (level.endsWith('.1') ? 1 : 2);

    return (
      <motion.div
        whileHover={unlocked ? { scale: 1.02, y: -2 } : {}}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className={`relative bg-white rounded-xl border shadow-sm overflow-hidden ${
          unlocked ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'
        } ${progressPercent === 100 ? 'border-emerald-200' : 'border-slate-200'}`}
      >
        {/* Completed indicator bar */}
        {progressPercent === 100 && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
        )}

        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              unlocked
                ? `bg-gradient-to-br ${theme.gradient}`
                : 'bg-slate-100'
            }`}>
              {unlocked ? (
                <Icon className="w-6 h-6 text-white" />
              ) : (
                <Lock className="w-6 h-6 text-slate-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                  {displayLevel}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  unlocked ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  Part {part}
                </span>
              </div>
              <p className={`text-sm ${unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                {topics.length} {isGerman ? 'Themen' : 'topics'}
              </p>
            </div>

            {/* Progress / Status */}
            <div className="flex-shrink-0 flex items-center gap-3">
              {unlocked && (
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
              )}
              {!unlocked && (
                <Lock className="w-5 h-5 text-slate-300" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          {unlocked && progressPercent > 0 && progressPercent < 100 && (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
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
      </div>
    </div>
  );
};

export default GrammarSectionPage;
