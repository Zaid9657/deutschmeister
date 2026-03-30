import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, CheckCircle, Sun, TreePine, Waves, Moon, Lock } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { mainLevels, getSubLevels, levelThemes as contentLevelThemes } from '../data/content';
import { fetchWordsForLevel } from '../services/vocabularyService';
import SEO from '../components/SEO';

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

const VocabularySectionPage = () => {
  const navigate = useNavigate();
  const { isItemLearned } = useProgress();
  const { getThemeForLevel } = useTheme();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();

  const [wordCounts, setWordCounts] = useState({});
  const [expandedLevel, setExpandedLevel] = useState('A1');

  // Fetch word counts from DB
  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      const counts = {};
      for (const mainLevel of mainLevels) {
        const subLevels = getSubLevels(mainLevel);
        for (const level of subLevels) {
          const words = await fetchWordsForLevel(level);
          if (!cancelled) {
            counts[level] = words.length;
          }
        }
      }
      if (!cancelled) {
        setWordCounts(counts);
      }
    };

    loadCounts();
    return () => { cancelled = true; };
  }, []);

  // Calculate total words
  const totalWords = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);

  // Calculate completed words for a level (from progress tracking)
  const getCompletedCount = (level) => {
    const words = wordCounts[level] || 0;
    // For simplicity, if user has accessed the level's vocabulary, we can track individual word progress
    // For now, we'll return 0 since word-level progress tracking might not be implemented
    return 0;
  };

  // Vocabulary level card
  const VocabularyLevelCard = ({ level }) => {
    const theme = getThemeForLevel(level);
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white rounded-xl border-2 ${
          canAccess ? 'border-slate-200 hover:border-slate-300 cursor-pointer' : 'border-slate-100'
        } overflow-hidden transition-all group`}
        onClick={handleClick}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{level.toUpperCase()}</h3>
                  {isFree && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{levelInfo.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-700">
                  {wordCount > 0 ? `${wordCount} words` : 'Loading...'}
                </div>
              </div>
              {!canAccess ? (
                <Lock className="w-5 h-5 text-slate-400" />
              ) : progressPercent === 100 && completedCount > 0 ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </div>
          </div>

          {/* Progress bar (if started) */}
          {progressPercent > 0 && progressPercent < 100 && (
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

        {/* Lock overlay */}
        {!canAccess && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
            <div className="text-center px-4">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                {user ? 'Subscribe to unlock' : 'Sign in to access'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <SEO
        title="German Vocabulary by Level | A1-B2 Word Lists | DeutschMeister"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                  Vocabulary
                </h1>
                <p className="text-slate-500">
                  {totalWords > 0 ? `${totalWords} words` : 'Loading...'} across 8 levels
                </p>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Build your German vocabulary with curated word lists for each CEFR level.
              Each word includes pronunciation, example sentences, and category tags.
            </p>
          </motion.div>

          {/* Level Groups */}
          <div className="space-y-8">
            {mainLevels.map((mainLevel, mainIndex) => {
              const subLevels = getSubLevels(mainLevel);
              const info = mainLevelInfo[mainLevel];
              const isExpanded = expandedLevel === mainLevel;

              return (
                <motion.div
                  key={mainLevel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mainIndex * 0.1 }}
                >
                  {/* Main Level Header */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : mainLevel)}
                    className="w-full mb-4 group"
                  >
                    <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${info.color} text-white hover:shadow-lg transition-all`}>
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1 text-left">
                        <h2 className="font-display text-xl font-bold">
                          Level {mainLevel}
                        </h2>
                        <p className="text-sm text-white/90">{info.name}</p>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
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
                          <VocabularyLevelCard key={level} level={level} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show first level by default (A1.1) */}
                  {!isExpanded && mainLevel === 'A1' && (
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      {subLevels.map((level) => (
                        <VocabularyLevelCard key={level} level={level} />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-xl"
          >
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Build Your Vocabulary?</h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Start with A1.1 and progress through all levels. Each word list includes pronunciation guides,
              example sentences, and category organization to help you learn effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/level/a1.1?tab=vocabulary')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Start at A1.1
                <ChevronRight className="w-5 h-5" />
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all"
                >
                  Sign Up Free
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default VocabularySectionPage;
