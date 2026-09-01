import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon, Lock } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { countWordsForLevel } from '../services/vocabularyService';
import SrsTrainer from '../components/vocab/SrsTrainer';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Stat from '../components/ui/Stat.jsx';

// Name + glyph only. This map used to carry a `color` gradient per band — a
// level is not a grammatical case, and colour means case (design-tokens.js
// rule 1), so the bands are neutral now and the band is named by a chip
// instead. (Class names are not quoted here on purpose: Tailwind's scanner
// does not parse comments, so a quoted legacy class would still be emitted.)
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

// Defined at module scope on purpose. It used to be declared inside the page
// component, which makes a NEW component type on every render — React then
// unmounts and remounts all eight cards, discarding their DOM and animations.
function VocabularyLevelCard({
  level, iconMap, contentLevelThemes, wordCounts, countsLoaded,
  getCompletedCount, isLevelFree, user, hasAccess, navigate,
}) {
  const Icon = iconMap[level] || Sun;
  const levelInfo = contentLevelThemes[level] || {};

  const wordCount = wordCounts[level] || 0;
  const completedCount = getCompletedCount(level);
  const progressPercent = wordCount > 0 ? Math.round((completedCount / wordCount) * 100) : 0;

  const isFree = isLevelFree(level);
  const canAccess = isFree || (user && hasAccess);

  const handleClick = () => {
    if (canAccess) {
      navigate(`/level/${level}?tab=vocabulary`);
    } else {
      navigate('/subscription');
    }
  };

  return (
    <Card
      interactive={canAccess}
      onClick={handleClick}
      className={`relative overflow-hidden group ${canAccess ? 'cursor-pointer' : ''}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Chip tone="label">{level.toUpperCase()}</Chip>
                {isFree && <Chip tone="limette">Free</Chip>}
              </div>
              <p className="mt-1 text-[0.8125rem] text-graphite truncate">{levelInfo.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {wordCount > 0 ? (
              <Stat value={wordCount} label="words" size="sm" className="text-right" />
            ) : (
              <span className="font-data text-[0.8125rem] text-graphite">
                {countsLoaded ? 'No words yet' : 'Loading…'}
              </span>
            )}
            {!canAccess ? (
              <Lock className="w-5 h-5 text-graphite" />
            ) : progressPercent === 100 && completedCount > 0 ? (
              <CheckCircle className="w-5 h-5 text-accent-limette" />
            ) : (
              <ChevronRight className="w-5 h-5 text-siegel transition-transform group-hover:translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Progress bar (if started) */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div className="mt-3 pt-3 border-t border-rule">
            <div className="h-1.5 bg-paper-sunk rounded-pill overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-siegel rounded-pill"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lock overlay */}
      {!canAccess && (
        <div className="absolute inset-0 bg-paper/80 backdrop-blur-[2px] flex items-center justify-center">
          <div className="text-center px-4">
            <Lock className="w-8 h-8 text-graphite mx-auto mb-2" />
            <p className="text-[0.8125rem] font-bold text-ink">
              {user ? 'Subscribe to unlock' : 'Sign in to access'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

const VocabularySectionPage = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();

  const [wordCounts, setWordCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState('A1');

  // Fetch word counts from DB
  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      // All levels at once, and only the counts — this used to run eight
      // sequential queries that each downloaded every word row just to read
      // `.length`, so the page showed 0s until the last one resolved.
      const levels = mainLevels.flatMap((mainLevel) => getSubLevels(mainLevel));
      const results = await Promise.all(
        levels.map((level) => countWordsForLevel(level).then((n) => [level, n]))
      );
      if (!cancelled) {
        setWordCounts(Object.fromEntries(results));
        setCountsLoaded(true);
      }
    };

    loadCounts();
    return () => { cancelled = true; };
  }, []);

  // Calculate total words
  const totalWords = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);

  // Calculate completed words for a level (from progress tracking)
  // Learned word ids live in progress[level].vocabulary. This returned a hard 0,
  // so every progress bar on the page sat at 0% no matter how much was learned.
  const getCompletedCount = (level) => progress?.[level]?.vocabulary?.length ?? 0;


  return (
    <>
      <SEO
        title="German Vocabulary by Level | A1-B2 Word Lists"
        description="Build your German vocabulary with organized word lists for levels A1 to B2. Learn essential words with audio pronunciation and example sentences."
        keywords="German vocabulary, German word lists, learn German words, German vocabulary by level, CEFR vocabulary, German nouns, German verbs"
        path="/vocabulary"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
            {"@type": "ListItem", "position": 2, "name": "Vocabulary", "item": "https://deutsch-meister.de/vocabulary"}
          ]
        }}
      />
      <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-4 sm:-mx-4 sm:px-4">
            <Aurora />
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <Reveal
                    as="h1"
                    className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]"
                  >
                    Vocabulary
                  </Reveal>
                  <Reveal as="p" delay={60} className="mt-1 font-data text-[0.8125rem] text-graphite">
                    {totalWords > 0 ? `${totalWords} words` : 'Loading...'} across 8 levels
                  </Reveal>
                </div>
              </div>
              <Reveal as="p" delay={120} className="max-w-2xl text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                Build your German vocabulary with curated word lists for each CEFR level.
                Each word includes pronunciation, example sentences, and category tags.
              </Reveal>
            </div>
          </div>

          {/* The trainer — the persisted practice mode over the user's own deck */}
          {user && (
            <div className="mb-8">
              <SrsTrainer />
            </div>
          )}

          {/* Level Groups */}
          <div className="space-y-8">
            {mainLevels.map((mainLevel, mainIndex) => {
              const subLevels = getSubLevels(mainLevel);
              const info = mainLevelInfo[mainLevel];
              const isExpanded = expandedLevel === mainLevel;

              return (
                <Reveal key={mainLevel} delay={mainIndex * 90}>
                  {/* Main Level Header */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : mainLevel)}
                    aria-expanded={isExpanded}
                    className="w-full mb-4 group text-left"
                  >
                    <Card
                      raised
                      edge="siegel"
                      className="flex items-center gap-3 p-4 transition-all duration-150 ease-snap group-hover:-translate-y-0.5 group-active:translate-y-1 group-active:shadow-none"
                    >
                      <span className="text-2xl" aria-hidden="true">{info.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <Chip tone="label">{mainLevel}</Chip>
                        </div>
                        <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">
                          Level {mainLevel}
                        </h2>
                        <p className="text-sm text-graphite">{info.name}</p>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-siegel transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </Card>
                  </button>

                  {/* Sub-levels */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid gap-4 sm:grid-cols-2 mb-4"
                      >
                        {subLevels.map((level) => (
                          <VocabularyLevelCard
                            key={level}
                            level={level}
                            iconMap={iconMap}
                            contentLevelThemes={contentLevelThemes}
                            wordCounts={wordCounts}
                            countsLoaded={countsLoaded}
                            getCompletedCount={getCompletedCount}
                            isLevelFree={isLevelFree}
                            user={user}
                            hasAccess={hasAccess}
                            navigate={navigate}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show first level by default (A1.1) */}
                  {!isExpanded && mainLevel === 'A1' && (
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      {subLevels.map((level) => (
                        <VocabularyLevelCard
                            key={level}
                            level={level}
                            iconMap={iconMap}
                            contentLevelThemes={contentLevelThemes}
                            wordCounts={wordCounts}
                            countsLoaded={countsLoaded}
                            getCompletedCount={getCompletedCount}
                            isLevelFree={isLevelFree}
                            user={user}
                            hasAccess={hasAccess}
                            navigate={navigate}
                          />
                      ))}
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>

          {/* CTA */}
          <Reveal delay={120} className="mt-12">
            <Card raised edge="siegel" className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem] mb-3">
                Ready to Build Your Vocabulary?
              </h2>
              <p className="mb-6 max-w-xl mx-auto text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                Start with A1.1 and progress through all levels. Each word list includes pronunciation guides,
                example sentences, and category organization to help you learn effectively.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" shimmer onClick={() => navigate('/level/a1.1?tab=vocabulary')}>
                  Start at A1.1
                  <ChevronRight className="w-5 h-5" />
                </Button>
                {!user && (
                  <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
                    Sign Up Free
                  </Button>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </>
  );
};

export default VocabularySectionPage;
