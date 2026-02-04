import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { getReadingLessonsByLevel } from '../services/readingService';
import ReadingLessonCard from '../components/ReadingLessonCard';

const ReadingLessonsPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const { setCurrentLevel, getThemeForLevel } = useTheme();
  const { isLevelUnlocked, isItemLearned } = useProgress();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = getThemeForLevel(level);
  const unlocked = isLevelUnlocked(level);
  const levelInfo = contentLevelThemes[level] || {};
  const isGerman = i18n.language === 'de';

  // Redirect if invalid level or locked
  useEffect(() => {
    if (!levels.includes(level) || !unlocked) {
      navigate('/reading');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, unlocked, navigate, setCurrentLevel]);

  // Fetch lessons from Supabase
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const fetched = await getReadingLessonsByLevel(level);
      if (!cancelled) {
        setLessons(fetched);
        setLoading(false);
      }
    };
    if (levels.includes(level) && unlocked) {
      load();
    }
    return () => { cancelled = true; };
  }, [level, unlocked]);

  const completedCount = lessons.filter((l) =>
    isItemLearned(level, 'readingLessons', l.id)
  ).length;

  const progressPercent =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const displayLevel = level.toUpperCase();

  // Check if a lesson is unlocked (sequential: first always unlocked, rest require previous completed)
  const isLessonUnlocked = (index) => {
    if (index === 0) return true;
    const previousLesson = lessons[index - 1];
    return isItemLearned(level, 'readingLessons', previousLesson.id);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 pb-12`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/reading')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                    {displayLevel} {isGerman ? 'Lesen' : 'Reading'}
                  </h1>
                  <p className="text-slate-600">{levelInfo.name || ''}</p>
                  {levelInfo.part && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                      Part {levelInfo.part} of 2
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {isGerman ? 'Fortschritt' : 'Progress'}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {completedCount}/{lessons.length}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isGerman ? 'Lektionen abgeschlossen' : 'lessons completed'}
                  </p>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="fill-none stroke-slate-200"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="fill-none stroke-current"
                      style={{ color: theme.primary }}
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 175.9' }}
                      animate={{
                        strokeDasharray: `${
                          lessons.length > 0
                            ? (completedCount / lessons.length) * 175.9
                            : 0
                        } 175.9`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">{progressPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lessons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              {isGerman ? 'Leselektionen' : 'Reading Lessons'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>
                {completedCount} {isGerman ? 'abgeschlossen' : 'completed'}
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}

          {!loading &&
            lessons.map((lesson, index) => {
              const completed = isItemLearned(level, 'readingLessons', lesson.id);
              const lessonUnlocked = isLessonUnlocked(index);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <ReadingLessonCard
                    lesson={lesson}
                    level={level}
                    index={index}
                    isUnlocked={lessonUnlocked}
                    isCompleted={completed}
                  />
                </motion.div>
              );
            })}

          {!loading && lessons.length === 0 && (
            <div className="bg-white rounded-xl border border-amber-200 p-6">
              <h3 className="text-lg font-bold text-amber-700 mb-2">
                {isGerman ? 'Keine Lektionen gefunden' : 'No lessons found'}
              </h3>
              <p className="text-slate-600 text-sm">
                {isGerman
                  ? 'Leselektionen für diese Stufe werden bald hinzugefügt.'
                  : 'Reading lessons for this level will be added soon.'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-white/50 rounded-xl border border-slate-200"
        >
          <p className="text-xs text-slate-500 text-center">
            {isGerman
              ? 'Schließe jede Lektion ab, um die nächste freizuschalten. Jede Lektion enthält Text, Vokabular und Verständnisfragen.'
              : 'Complete each lesson to unlock the next one. Each lesson includes text, vocabulary, and comprehension questions.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingLessonsPage;
