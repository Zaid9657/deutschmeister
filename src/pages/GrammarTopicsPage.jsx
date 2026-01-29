import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, BookMarked, CheckCircle, Sun, TreePine, Waves, Moon, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { fetchTopicsForLevel } from '../services/grammarService';
import GrammarTopicCard from '../components/GrammarTopicCard';

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

const GrammarTopicsPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setCurrentLevel, getThemeForLevel } = useTheme();
  const { isLevelUnlocked, getGrammarTopicProgress, isGrammarTopicUnlocked, getGrammarSectionProgress } = useProgress();

  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const theme = getThemeForLevel(level);
  const unlocked = isLevelUnlocked(level);
  const Icon = iconMap[level] || Sun;
  const levelInfo = contentLevelThemes[level] || {};
  const isGerman = i18n.language === 'de';

  // Calculate section progress
  const sectionProgress = getGrammarSectionProgress ? getGrammarSectionProgress(level) : 0;
  const completedTopics = topics.filter((topic) => {
    const progress = getGrammarTopicProgress ? getGrammarTopicProgress(level, topic.id) : { completed: false };
    return progress.completed;
  }).length;

  useEffect(() => {
    if (!levels.includes(level) || !unlocked) {
      navigate('/grammar');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, unlocked, navigate, setCurrentLevel]);

  // Fetch topics from Supabase (with static fallback)
  useEffect(() => {
    let cancelled = false;
    const loadTopics = async () => {
      setTopicsLoading(true);
      const fetched = await fetchTopicsForLevel(level);
      if (!cancelled) {
        setTopics(fetched);
        setTopicsLoading(false);
      }
    };
    if (levels.includes(level) && unlocked) {
      loadTopics();
    }
    return () => { cancelled = true; };
  }, [level, unlocked]);

  // Format level for display (a1.1 -> A1.1)
  const displayLevel = level.toUpperCase();

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
            onClick={() => navigate('/grammar')}
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
                  <BookMarked className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                    {displayLevel} {isGerman ? 'Grammatik' : 'Grammar'}
                  </h1>
                  <p className="text-slate-600">
                    {levelInfo.name || ''}
                  </p>
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
                  <p className="text-sm text-slate-500">{isGerman ? 'Fortschritt' : 'Progress'}</p>
                  <p className="text-2xl font-bold text-slate-800">{completedTopics}/{topics.length}</p>
                  <p className="text-xs text-slate-400">{isGerman ? 'Themen abgeschlossen' : 'topics completed'}</p>
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
                      className={`fill-none stroke-current`}
                      style={{ color: theme.primary }}
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 175.9' }}
                      animate={{ strokeDasharray: `${(completedTopics / topics.length) * 175.9} 175.9` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">
                      {Math.round((completedTopics / topics.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Topics List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              {isGerman ? 'Grammatik-Themen' : 'Grammar Topics'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{completedTopics} {isGerman ? 'abgeschlossen' : 'completed'}</span>
            </div>
          </div>

          {topicsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}

          {!topicsLoading && topics.map((topic, index) => {
            const topicProgress = getGrammarTopicProgress ? getGrammarTopicProgress(level, topic.id) : { completed: false, progress: 0 };
            const isTopicUnlocked = isGrammarTopicUnlocked ? isGrammarTopicUnlocked(level, index) : index === 0;

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <GrammarTopicCard
                  topic={topic}
                  level={level}
                  isUnlocked={isTopicUnlocked}
                  isCompleted={topicProgress.completed}
                  progress={topicProgress.progress || 0}
                />
              </motion.div>
            );
          })}

          {!topicsLoading && topics.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              {isGerman
                ? 'Keine Grammatik-Themen für dieses Level verfügbar.'
                : 'No grammar topics available for this level yet.'}
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
              ? 'Schließe jedes Thema ab, um das nächste freizuschalten. Jedes Thema hat 5 Lernphasen.'
              : 'Complete each topic to unlock the next one. Each topic has 5 learning stages.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GrammarTopicsPage;
