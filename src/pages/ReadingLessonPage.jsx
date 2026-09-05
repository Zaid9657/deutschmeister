import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
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
import ReadingChecks from '../components/ReadingChecks';
import ComprehensionQuestions from '../components/ComprehensionQuestions';
import CompletionMoment from '../components/CompletionMoment';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';

const ReadingLessonPage = () => {
  const { level, lessonId } = useParams();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { setCurrentLevel } = useTheme();
  const { isItemLearned, markAsLearned } = useProgress();
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  // Completing the lesson is the earned moment; RE-OPENING a finished one is
  // not. `isCompleted` comes from persisted progress, so the celebration has
  // to key off this session's click instead (docs/design/playbook.md: pass =
  // celebrate, and only once).
  const [justCompleted, setJustCompleted] = useState(false);

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
    setJustCompleted(true);
    if (user) {
      markLessonComplete(user.id, lesson.id);
    }
  };

  // Finishing every "Richtig oder falsch?" check is itself a completion
  // signal — fire the same flow the "Mark as Complete" button uses, but only
  // once and only if the lesson isn't already marked (do not double-mark).
  const handleChecksComplete = () => {
    if (!isCompleted) handleMarkComplete();
  };

  const handleNavigateLesson = (targetLesson) => {
    if (targetLesson) {
      navigate(`/reading/${level}/${targetLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-paper pt-20 flex items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <div className="animate-spin w-10 h-10 border-4 border-rule border-t-siegel rounded-full" aria-hidden="true" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-paper pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 pt-12">
          <Card className="p-8">
            <h2 className="font-display text-xl font-semibold text-accent-himbeer-ink mb-4">
              {isGerman ? 'Lektion nicht gefunden' : 'Lesson not found'}
            </h2>
            <p className="text-sm text-graphite mb-6">
              {isGerman
                ? 'Diese Lektion konnte nicht in der Datenbank gefunden werden.'
                : 'This lesson could not be found in the database.'}
            </p>
            <Button onClick={() => navigate(`/level/${level}`)}>
              {t('common.back')}
            </Button>
          </Card>
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
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
      <SEO
        title={lesson ? `${lesson.title_en || lesson.title} - German Reading ${level.toUpperCase()}` : `German Reading Practice ${level.toUpperCase()}`}
        description={lesson ? `Read and understand: ${lesson.title_en || lesson.title}. German reading practice for ${level.toUpperCase()} with vocabulary and comprehension questions.` : `German reading exercises for level ${level.toUpperCase()}.`}
        path={`/reading/${level}/${lessonId}`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/level/${level}`)} className="mb-3 -ml-3">
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </Button>

          {/* Lesson Title Card */}
          <Card raised edge={isCompleted ? 'limette' : 'siegel'} className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-clay bg-siegel text-white shadow-raise-siegel flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl sm:text-[1.75rem] font-semibold leading-tight tracking-[-0.018em] text-ink">
                  {isGerman ? lesson.titleDe : lesson.titleEn}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Chip tone="label">{level.toUpperCase()}</Chip>
                  {lesson.topic && <Chip tone="quiet">{lesson.topic}</Chip>}
                  <span className="flex items-center gap-1 font-data text-[0.6875rem] text-graphite">
                    <BookOpen className="w-3.5 h-3.5" />
                    {lesson.wordCount} {isGerman ? 'Wörter' : 'words'}
                  </span>
                  <span className="flex items-center gap-1 font-data text-[0.6875rem] text-graphite">
                    <Clock className="w-3.5 h-3.5" />
                    {lesson.estimatedReadingTime} min
                  </span>
                </div>
              </div>
              {isCompleted && (
                <CheckCircle className="w-6 h-6 text-accent-limette-ink flex-shrink-0" />
              )}
            </div>
          </Card>
        </div>

        {/* Reading Content — reference material, so it stays FLAT: hairlines,
            generous line height, nothing floating (design-tokens.js rule 3). */}
        <Reveal className="mb-6">
          <Card className="overflow-hidden">
            {/* Content Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper-sunk px-6 py-4">
              <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                {isGerman ? 'Lesetext' : 'Reading Text'}
              </h2>
              <Button variant="secondary" size="sm" onClick={() => setShowTranslation(!showTranslation)}>
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
              </Button>
            </div>

            {/* German Text */}
            <div className="p-6">
              <div className="max-w-prose">
                {germanParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-ink leading-[1.8] mb-5 last:mb-0 font-body text-base sm:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* English Translation */}
              {showTranslation && englishParagraphs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-rule animate-pop-in">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel mb-3">
                    {isGerman ? 'Englische Übersetzung' : 'English Translation'}
                  </p>
                  <div className="max-w-prose">
                    {englishParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-graphite leading-[1.8] mb-5 last:mb-0 text-base italic"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Key Vocabulary */}
        <Reveal delay={80} className="mb-6">
          <VocabularyList vocabulary={lesson.keyVocabulary} />
        </Reveal>

        {/* Auto-checkable Richtig/Falsch and exam-style choice items */}
        {lesson.checks?.length > 0 && (
          <Reveal delay={120} className="mb-6">
            <ReadingChecks key={lesson.id} checks={lesson.checks} onAllAnswered={handleChecksComplete} />
          </Reveal>
        )}

        {/* Comprehension Questions */}
        <Reveal delay={160} className="mb-6">
          <ComprehensionQuestions questions={lesson.questions} />
        </Reveal>

        {/* Mark Complete / Navigation */}
        <Reveal delay={240}>
          <Card className="p-6">
            {/* Mark as Complete — the one primary action on this screen */}
            {!isCompleted ? (
              <Button size="lg" shimmer onClick={handleMarkComplete} className="w-full mb-4">
                <CheckCircle className="w-5 h-5" />
                {isGerman ? 'Als abgeschlossen markieren' : 'Mark as Complete'}
              </Button>
            ) : (
              <div className="mb-4">
                <CompletionMoment
                  celebrate={justCompleted}
                  headline={isGerman ? 'Lektion abgeschlossen!' : 'Lesson complete!'}
                  detail={
                    isGerman
                      ? 'Das zählt für deinen Streak und dein Tagesziel.'
                      : 'That counts toward your streak and daily goal.'
                  }
                  nextLabel={
                    nextLesson
                      ? (isGerman ? 'Nächste Lektion' : 'Next lesson')
                      : (isGerman ? 'Alle Lektionen' : 'All lessons')
                  }
                  onNext={() =>
                    nextLesson ? handleNavigateLesson(nextLesson) : navigate(`/reading/${level}`)
                  }
                />
              </div>
            )}

            {/* Previous / Next Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateLesson(previousLesson)}
                disabled={!previousLesson}
              >
                <ChevronLeft className="w-5 h-5" />
                {isGerman ? 'Vorherige' : 'Previous'}
              </Button>

              <span className="font-data text-[0.75rem] text-graphite">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${allLessons.length}` : ''}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateLesson(nextLesson)}
                disabled={!nextLesson}
              >
                {isGerman ? 'Nächste' : 'Next'}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default ReadingLessonPage;
