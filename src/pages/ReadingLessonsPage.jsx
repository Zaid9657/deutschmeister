import { useState, useEffect } from 'react';
import DataState from '../components/DataState';
import EmptyState from '../components/EmptyState';
import { withTimeout } from '../utils/withTimeout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { getReadingLessonsByLevel } from '../services/readingService';
import ReadingLessonCard from '../components/ReadingLessonCard';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

const ReadingLessonsPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const { setCurrentLevel } = useTheme();
  const { isItemLearned } = useProgress();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const levelInfo = contentLevelThemes[level] || {};
  const isGerman = i18n.language === 'de';

  // Redirect if invalid level
  useEffect(() => {
    if (!levels.includes(level)) {
      navigate('/reading');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, navigate, setCurrentLevel]);

  // Fetch lessons from Supabase
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await withTimeout(getReadingLessonsByLevel(level));
        if (!cancelled) setLessons(fetched);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (levels.includes(level)) {
      load();
    }
    return () => { cancelled = true; };
  }, [level, attempt]);

  const completedCount = lessons.filter((l) =>
    isItemLearned(level, 'readingLessons', l.id)
  ).length;

  const progressPercent =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const displayLevel = level.toUpperCase();

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
      <SEO title="German Reading Practice" description="Level-appropriate German reading lessons with comprehension exercises from A1 to B2." path="/reading" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reading')} className="mb-4 -ml-3">
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </Button>

          {/* The aurora bleeds around the card, not under it — an opaque clay
              surface on top of it would simply hide the drift. */}
          <div className="relative overflow-hidden rounded-clay -mx-2 px-2 py-4 sm:-mx-4 sm:px-4">
            <Aurora variant="close" />
            <Card raised edge="siegel" className="relative p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-clay bg-siegel text-white shadow-raise-siegel flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[2.125rem]">
                      {displayLevel} {isGerman ? 'Lesen' : 'Reading'}
                    </h1>
                    <p className="text-graphite">{levelInfo.name || ''}</p>
                    {levelInfo.part && (
                      <Chip tone="quiet" className="mt-1.5">
                        Part {levelInfo.part} of 2
                      </Chip>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="sm:text-right">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
                    {isGerman ? 'Fortschritt' : 'Progress'}
                  </p>
                  <p className="font-display text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink mt-1">
                    {completedCount}/{lessons.length}
                  </p>
                  <p className="font-data text-[0.6875rem] text-graphite mt-1">
                    {isGerman ? 'Lektionen abgeschlossen' : 'lessons completed'}
                  </p>
                  <div className="mt-2 h-1.5 w-full sm:w-40 sm:ml-auto overflow-hidden rounded-pill bg-paper-sunk">
                    <div
                      className="h-full rounded-pill bg-siegel transition-all duration-500 ease-snap"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
              {isGerman ? 'Leselektionen' : 'Reading Lessons'}
            </h2>
            <div className="flex items-center gap-2 font-data text-[0.75rem] text-graphite">
              <CheckCircle className="w-4 h-4 text-accent-limette-ink" />
              <span>
                {completedCount} {isGerman ? 'abgeschlossen' : 'completed'}
              </span>
            </div>
          </div>

          {error && !loading && (
            <DataState loading={false} error={error} onRetry={() => setAttempt((a) => a + 1)} />
          )}
          {loading && (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
              <div className="animate-spin w-8 h-8 border-4 border-rule border-t-siegel rounded-full" aria-hidden="true" />
            </div>
          )}

          {!loading &&
            lessons.map((lesson, index) => {
              const completed = isItemLearned(level, 'readingLessons', lesson.id);

              return (
                <Reveal key={lesson.id} delay={80 * index}>
                  <ReadingLessonCard
                    lesson={lesson}
                    level={level}
                    index={index}
                    isCompleted={completed}
                  />
                </Reveal>
              );
            })}

          {!loading && lessons.length === 0 && (
            <EmptyState
              title={isGerman ? 'Keine Lektionen gefunden' : 'No lessons found'}
              message={isGerman
                ? 'Leselektionen für diese Stufe werden bald hinzugefügt.'
                : 'Reading lessons for this level will be added soon.'}
            />
          )}
        </div>

        {/* Legend */}
        <Reveal delay={120}>
          <Card tone="sunk" className="mt-8 p-4">
            <p className="text-xs text-graphite text-center">
              {isGerman
                ? 'Schließe jede Lektion ab, um die nächste freizuschalten. Jede Lektion enthält Text, Vokabular und Verständnisfragen.'
                : 'Complete each lesson to unlock the next one. Each lesson includes text, vocabulary, and comprehension questions.'}
            </p>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default ReadingLessonsPage;
