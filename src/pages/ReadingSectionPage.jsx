import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Lock, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { getReadingLessonCounts, getReadingLessonsByLevel } from '../services/readingService';

const LESSON_COUNTS = {
  'a1.1': 3, 'a1.2': 4,
  'a2.1': 5, 'a2.2': 6,
  'b1.1': 7, 'b1.2': 8,
  'b2.1': 9, 'b2.2': 10,
};

const TOTAL_LESSONS = 52;

const mainLevelInfo = {
  A1: { name: 'Sunrise Warmth', icon: '🌅', color: 'from-amber-400 to-orange-400' },
  A2: { name: 'Forest Calm', icon: '🌿', color: 'from-emerald-400 to-teal-400' },
  B1: { name: 'Ocean Depth', icon: '🌊', color: 'from-blue-400 to-indigo-400' },
  B2: { name: 'Twilight Elegance', icon: '🌙', color: 'from-purple-400 to-pink-400' },
};

const iconMap = {
  'a1.1': Sun, 'a1.2': Sun,
  'a2.1': TreePine, 'a2.2': TreePine,
  'b1.1': Waves, 'b1.2': Waves,
  'b2.1': Moon, 'b2.2': Moon,
};

const ReadingSectionPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLevelUnlocked, isItemLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const { user } = useAuth();

  const [dbLessonCounts, setDbLessonCounts] = useState({});
  const [levelLessons, setLevelLessons] = useState({});

  const isGerman = i18n.language === 'de';

  // Fetch lesson counts from DB
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const counts = await getReadingLessonCounts();
      if (!cancelled) setDbLessonCounts(counts);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch lessons per level to get IDs for progress checking
  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      const allLevels = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];
      const results = {};
      await Promise.all(
        allLevels.map(async (level) => {
          const lessons = await getReadingLessonsByLevel(level);
          results[level] = lessons;
        })
      );
      if (!cancelled) setLevelLessons(results);
    };
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Calculate completed lessons for a level
  const getCompletedCount = (level) => {
    const lessons = levelLessons[level] || [];
    return lessons.filter((l) => isItemLearned(level, 'readingLessons', l.id)).length;
  };

  // Calculate overall progress
  const overallCompleted = Object.keys(levelLessons).reduce(
    (sum, level) => sum + getCompletedCount(level),
    0
  );
  const overallTotal = Object.values(levelLessons).reduce(
    (sum, lessons) => sum + lessons.length,
    0
  ) || TOTAL_LESSONS;
  const overallProgress = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  // Reading level card
  const ReadingLevelCard = ({ level }) => {
    const theme = getThemeForLevel(level);
    const unlocked = isLevelUnlocked(level);
    const Icon = iconMap[level] || Sun;
    const levelInfo = contentLevelThemes[level] || {};

    const lessonCount = dbLessonCounts[level] || LESSON_COUNTS[level] || 0;
    const completedCount = getCompletedCount(level);
    const progressPercent = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

    const handleClick = () => {
      if (unlocked) {
        navigate(`/reading/${level}`);
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
        } ${progressPercent === 100 && completedCount > 0 ? 'border-emerald-200' : 'border-slate-200'}`}
      >
        {progressPercent === 100 && completedCount > 0 && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
        )}

        <div className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                unlocked ? `bg-gradient-to-br ${theme.gradient}` : 'bg-slate-100'
              }`}
            >
              {unlocked ? (
                <Icon className="w-6 h-6 text-white" />
              ) : (
                <Lock className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                  {displayLevel}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    unlocked ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  Part {part}
                </span>
              </div>
              <p className={`text-sm ${unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                {lessonCount} {isGerman ? 'Lektionen' : 'lessons'}
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3">
              {unlocked && (
                <>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        progressPercent === 100 && completedCount > 0 ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {completedCount}/{lessonCount}
                    </p>
                    <p className="text-xs text-slate-400">{progressPercent}%</p>
                  </div>
                  {progressPercent === 100 && completedCount > 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </>
              )}
              {!unlocked && <Lock className="w-5 h-5 text-slate-300" />}
            </div>
          </div>

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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                {isGerman ? 'Lesen' : 'Reading'}
              </h1>
              <p className="text-slate-600">
                {isGerman
                  ? 'Verbessere dein Leseverständnis Schritt für Schritt'
                  : 'Improve your reading comprehension step by step'}
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
            <p className="text-2xl font-bold text-slate-800">{overallTotal}</p>
            <p className="text-sm text-slate-500">
              {isGerman ? 'Lektionen gesamt' : 'Total Lessons'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">8</p>
            <p className="text-sm text-slate-500">{isGerman ? 'Stufen' : 'Levels'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{overallCompleted}</p>
            <p className="text-sm text-slate-500">
              {isGerman ? 'Abgeschlossen' : 'Completed'}
            </p>
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
              {isGerman ? 'Gesamtfortschritt Lesen' : 'Overall Reading Progress'}
            </h2>
            <span className="text-lg font-bold text-slate-800">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-full"
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
            const groupLessonCount = subLevels.reduce(
              (sum, l) => sum + (dbLessonCounts[l] || LESSON_COUNTS[l] || 0),
              0
            );

            return (
              <motion.div
                key={mainLevel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + groupIndex * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-r ${info.color} flex items-center justify-center`}
                  >
                    <span className="text-xl">{info.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-800">
                      {mainLevel} - {info.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {groupLessonCount} {isGerman ? 'Leselektionen' : 'reading lessons'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subLevels.map((level, index) => (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + groupIndex * 0.1 + index * 0.05 }}
                    >
                      <ReadingLevelCard level={level} />
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
          className="mt-8 p-4 bg-teal-50 rounded-xl border border-teal-100"
        >
          <p className="text-sm text-teal-700 text-center">
            {isGerman
              ? 'Leselektionen werden mit steigendem Niveau länger. Jede enthält Schlüsselvokabular und Verständnisfragen.'
              : 'Reading lessons get progressively longer as levels increase. Each includes key vocabulary and comprehension questions.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingSectionPage;
