import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon, Lock } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { levels as ALL_LEVELS, mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { getReadingLessonCounts, getReadingLessonsByLevel } from '../services/readingService';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import { READING_LESSON_COUNTS_BY_LEVEL } from '../data/marketing';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Stat from '../components/ui/Stat.jsx';

// Measured against reading_lessons (2026-08-24), not interpolated — the old
// 3,4,5,6,7,8,9,10 ramp here matched no measurement. See src/data/marketing.js.
const LESSON_COUNTS = READING_LESSON_COUNTS_BY_LEVEL;

// Fallback only — the real count comes from the DB (see dbLessonCounts).
const TOTAL_LESSONS = 66;

// The per-band identity is a NAME and an icon, never a colour: design-tokens.js
// rule 1 keeps hue for grammatical case, so the retired per-band gradient ramps
// are gone and every band sits on the same neutral surface. (Quoting the old
// classes here would be enough for Tailwind to emit them — the scanner does not
// parse comments — so they are described, not named.)
const mainLevelInfo = {
  A1: { name: 'Sunrise Warmth', icon: '🌅' },
  A2: { name: 'Forest Calm', icon: '🌿' },
  B1: { name: 'Ocean Depth', icon: '🌊' },
  B2: { name: 'Twilight Elegance', icon: '🌙' },
};

const iconMap = {
  'a1.1': Sun, 'a1.2': Sun,
  'a2.1': TreePine, 'a2.2': TreePine,
  'b1.1': Waves, 'b1.2': Waves,
  'b2.1': Moon, 'b2.2': Moon,
};

const ReadingSectionPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isItemLearned } = useProgress();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();

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
    const Icon = iconMap[level] || Sun;
    const levelInfo = contentLevelThemes[level] || {};

    const lessonCount = dbLessonCounts[level] || LESSON_COUNTS[level] || 0;
    const completedCount = getCompletedCount(level);
    const progressPercent = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

    const handleClick = () => {
      navigate(`/reading/${level}`);
    };

    const displayLevel = level.toUpperCase();
    const part = levelInfo.part || (level.endsWith('.1') ? 1 : 2);
    const done = progressPercent === 100 && completedCount > 0;

    return (
      <Card
        interactive
        as="button"
        type="button"
        edge={done ? 'limette' : 'paper'}
        onClick={handleClick}
        className="block w-full h-full p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-clay flex items-center justify-center ${
              done ? 'bg-accent-limette-wash text-accent-limette-ink' : 'bg-siegel-wash text-siegel'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Chip tone="label">{displayLevel}</Chip>
              <Chip tone="quiet">Part {part}</Chip>
              {isLevelFree(level) && <Chip tone="limette">FREE</Chip>}
              {!isLevelFree(level) && !(user && hasAccess) && (
                <Lock className="w-3.5 h-3.5 text-graphite" />
              )}
            </div>
            <p className="text-sm text-graphite">
              {lessonCount} {isGerman ? 'Lektionen' : 'lessons'}
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="text-right">
              <p className={`font-data text-sm font-bold ${done ? 'text-accent-limette-ink' : 'text-ink'}`}>
                {completedCount}/{lessonCount}
              </p>
              <p className="font-data text-[0.6875rem] text-graphite">{progressPercent}%</p>
            </div>
            {done ? (
              <CheckCircle className="w-5 h-5 text-accent-limette-ink" />
            ) : (
              <ChevronRight className="w-5 h-5 text-graphite" />
            )}
          </div>
        </div>

        {progressPercent > 0 && progressPercent < 100 && (
          <div className="mt-3 pt-3 border-t border-rule">
            <div className="h-1.5 overflow-hidden rounded-pill bg-paper-sunk">
              <div
                className="h-full rounded-pill bg-siegel"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <SEO
        {...seoProps('/reading')}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
            {"@type": "ListItem", "position": 2, "name": "Reading", "item": "https://deutsch-meister.de/reading/"}
          ]
        }}
      />
      <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-6 sm:-mx-4 sm:px-4">
          <Aurora />
          <div className="relative flex items-center gap-4">
            <div
              className="hero-line w-14 h-14 rounded-clay bg-siegel text-white shadow-raise-siegel flex items-center justify-center flex-shrink-0"
              style={{ '--d': '60ms' }}
            >
              <BookOpen className="w-7 h-7" />
            </div>
            <SectionHeading
              level={1}
              size="page"
              title={isGerman ? 'Lesen' : 'Reading'}
              lead={isGerman
                ? 'Verbessere dein Leseverständnis Schritt für Schritt'
                : 'Improve your reading comprehension step by step'}
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'total', value: overallTotal, label: isGerman ? 'Lektionen gesamt' : 'Total Lessons' },
            // Never a typed figure: the level count is the content module's own.
            { key: 'levels', value: ALL_LEVELS.length, label: isGerman ? 'Stufen' : 'Levels' },
            { key: 'done', value: overallCompleted, label: isGerman ? 'Abgeschlossen' : 'Completed' },
            { key: 'pct', value: overallProgress, suffix: '%', label: isGerman ? 'Fortschritt' : 'Progress' },
          ].map((tile, i) => (
            <Reveal key={tile.key} delay={80 * i}>
              <Card raised edge={tile.key === 'pct' ? 'limette' : 'paper'} className="p-4">
                <Stat value={tile.value} suffix={tile.suffix || ''} label={tile.label} size="sm" />
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Overall Progress Bar */}
        <Reveal delay={120} className="mb-8">
          <Card raised edge="siegel" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                {isGerman ? 'Gesamtfortschritt Lesen' : 'Overall Reading Progress'}
              </h2>
              <span className="font-data text-base font-bold text-ink">{overallProgress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-pill bg-paper-sunk">
              <div
                className="h-full rounded-pill bg-siegel transition-all duration-500 ease-snap"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </Card>
        </Reveal>

        {/* Level Groups */}
        <div className="space-y-6">
          {mainLevels.map((mainLevel, groupIndex) => {
            const info = mainLevelInfo[mainLevel];
            const subLevels = getSubLevels(mainLevel);
            const groupLessonCount = subLevels.reduce(
              (sum, l) => sum + (dbLessonCounts[l] || LESSON_COUNTS[l] || 0),
              0
            );

            return (
              <Reveal key={mainLevel} delay={90 * groupIndex}>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-clay bg-paper-sunk border border-rule flex items-center justify-center">
                      <span className="text-xl">{info.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {mainLevel} - {info.name}
                      </h3>
                      <p className="font-data text-[0.6875rem] text-graphite">
                        {groupLessonCount} {isGerman ? 'Leselektionen' : 'reading lessons'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subLevels.map((level) => (
                      <ReadingLevelCard key={level} level={level} />
                    ))}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        {/* Info note */}
        <Reveal delay={120}>
          <Card tone="sunk" className="mt-8 p-4">
            <p className="text-sm text-graphite text-center">
              {isGerman
                ? 'Leselektionen werden mit steigendem Niveau länger. Jede enthält Schlüsselvokabular und Verständnisfragen.'
                : 'Reading lessons get progressively longer as levels increase. Each includes key vocabulary and comprehension questions.'}
            </p>
          </Card>
        </Reveal>
      </div>
    </div>
    </>
  );
};

export default ReadingSectionPage;
