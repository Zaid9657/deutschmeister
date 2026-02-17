import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { levels } from '../data/content';
import {
  getReadingLessonById,
  getReadingLessonsByLevel,
  markLessonComplete,
} from '../services/readingService';
import VocabularyList from '../components/VocabularyList';
import ComprehensionQuestions from '../components/ComprehensionQuestions';

const ReadingLessonPage = () => {
  const { level, lessonId } = useParams();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { getThemeForLevel, setCurrentLevel } = useTheme();
  const { isItemLearned, markAsLearned } = useProgress();
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);

  const theme = getThemeForLevel(level);
  const isGerman = i18n.language === 'de';
  const isCompleted = lesson ? isItemLearned(level, 'readingLessons', lesson.id) : false;

  // Redirect if invalid
  useEffect(() => {
    if (!levels.includes(level)) {
      navigate('/dashboard');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, navigate, setCurrentLevel]);

  // Fetch lesson data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [fetchedLesson, fetchedAll] = await Promise.all([
        getReadingLessonById(lessonId),
        getReadingLessonsByLevel(level),
      ]);
      if (!cancelled) {
        setLesson(fetchedLesson);
        setAllLessons(fetchedAll);
        setLoading(false);
      }
    };
    if (levels.includes(level)) {
      load();
    }
    return () => { cancelled = true; };
  }, [level, lessonId]);

  // Find current lesson index and neighbors
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleMarkComplete = async () => {
    if (!lesson) return;
    await markAsLearned(level, 'readingLessons', lesson.id);
    if (user) {
      markLessonComplete(user.id, lesson.id);
    }
  };

  const handleNavigateLesson = (targetLesson) => {
    if (targetLesson) {
      navigate(`/reading/${level}/${targetLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 flex items-center justify-center`}
      >
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 pt-12">
          <div className="bg-white rounded-2xl shadow-lg border border-rose-200 p-8">
            <h2 className="text-xl font-bold text-rose-700 mb-4">
              {isGerman ? 'Lektion nicht gefunden' : 'Lesson not found'}
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              {isGerman
                ? 'Diese Lektion konnte nicht in der Datenbank gefunden werden.'
                : 'This lesson could not be found in the database.'}
            </p>
            <button
              onClick={() => navigate(`/level/${level}`)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Split content into paragraphs for display
  const germanParagraphs = lesson.contentDe
    ? lesson.contentDe.split('\n').filter((p) => p.trim())
    : [];
  const englishParagraphs = lesson.contentEn
    ? lesson.contentEn.split('\n').filter((p) => p.trim())
    : [];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 pb-12`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(`/level/${level}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          {/* Lesson Title Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}
              >
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                  {isGerman ? lesson.titleDe : lesson.titleEn}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-slate-600">
                    {level.toUpperCase()}
                  </span>
                  {lesson.topic && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                      {lesson.topic}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{lesson.wordCount} {isGerman ? 'Wörter' : 'words'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.estimatedReadingTime} min</span>
                  </div>
                </div>
              </div>
              {isCompleted && (
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Reading Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Content Header */}
            <div className={`bg-gradient-to-r ${theme.gradient} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  {isGerman ? 'Lesetext' : 'Reading Text'}
                </h2>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition-colors"
                >
                  {showTranslation ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      {isGerman ? 'Übersetzung verbergen' : 'Hide translation'}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      {isGerman ? 'Übersetzung zeigen' : 'Show translation'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* German Text */}
            <div className="p-6">
              <div className="prose prose-slate max-w-none">
                {germanParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-slate-800 leading-relaxed mb-4 last:mb-0 font-body text-base sm:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* English Translation */}
              {showTranslation && englishParagraphs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-slate-200"
                >
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {isGerman ? 'Englische Übersetzung' : 'English Translation'}
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    {englishParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-slate-600 leading-relaxed mb-4 last:mb-0 text-base italic"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Key Vocabulary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <VocabularyList vocabulary={lesson.keyVocabulary} theme={theme} />
        </motion.div>

        {/* Comprehension Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ComprehensionQuestions questions={lesson.questions} theme={theme} />
        </motion.div>

        {/* Mark Complete / Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            {/* Mark as Complete */}
            {!isCompleted ? (
              <button
                onClick={handleMarkComplete}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${theme.gradient} hover:shadow-lg transition-all mb-4`}
              >
                <CheckCircle className="w-5 h-5" />
                {isGerman ? 'Als abgeschlossen markieren' : 'Mark as Complete'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-700">
                  {isGerman ? 'Lektion abgeschlossen' : 'Lesson Completed'}
                </span>
              </div>
            )}

            {/* Previous / Next Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleNavigateLesson(previousLesson)}
                disabled={!previousLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  previousLesson
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                {isGerman ? 'Vorherige' : 'Previous'}
              </button>

              <span className="text-sm text-slate-500">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${allLessons.length}` : ''}
              </span>

              <button
                onClick={() => handleNavigateLesson(nextLesson)}
                disabled={!nextLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  nextLesson
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                {isGerman ? 'Nächste' : 'Next'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingLessonPage;
