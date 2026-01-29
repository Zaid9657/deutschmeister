import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Table2,
  PenTool,
  Trophy,
  Check,
  Lock,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels } from '../data/content';
import { fetchTopicBySlug, fetchTopicContent } from '../services/grammarService';
import StageIntroduction from '../components/grammar/StageIntroduction';
import StageExamples from '../components/grammar/StageExamples';
import StageRuleBreakdown from '../components/grammar/StageRuleBreakdown';
import StageGuidedPractice from '../components/grammar/StageGuidedPractice';
import StageMastery from '../components/grammar/StageMastery';

const stages = [
  { id: 1, name: { en: 'Introduction', de: 'Einführung' }, icon: BookOpen, color: 'blue' },
  { id: 2, name: { en: 'Examples', de: 'Beispiele' }, icon: MessageSquare, color: 'emerald' },
  { id: 3, name: { en: 'Rules', de: 'Regeln' }, icon: Table2, color: 'purple' },
  { id: 4, name: { en: 'Practice', de: 'Übung' }, icon: PenTool, color: 'amber' },
  { id: 5, name: { en: 'Mastery', de: 'Meisterschaft' }, icon: Trophy, color: 'rose' },
];

// TODO: Re-enable stage locking for production
const STAGE_LOCKING_ENABLED = false;

const GrammarLessonPage = () => {
  const { level, topicSlug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getThemeForLevel } = useTheme();
  const {
    isLevelUnlocked,
    getGrammarTopicProgress,
    updateGrammarTopicProgress,
    completeGrammarTopic
  } = useProgress();

  const [currentStage, setCurrentStage] = useState(1);
  const [stageCompleted, setStageCompleted] = useState({});
  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const theme = getThemeForLevel(level);
  const unlocked = isLevelUnlocked(level);
  const isGerman = i18n.language === 'de';

  // Fetch topic and content from Supabase ONLY
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setDataLoading(true);
      setFetchError(null);
      console.log(`[GrammarLessonPage] loading data for level="${level}", slug="${topicSlug}"`);
      try {
        const [fetchedTopic, fetchedContent] = await Promise.all([
          fetchTopicBySlug(level, topicSlug),
          fetchTopicContent(level, topicSlug),
        ]);
        console.log(`[GrammarLessonPage] fetched topic:`, fetchedTopic);
        console.log(`[GrammarLessonPage] fetched content:`, fetchedContent);
        if (!cancelled) {
          setTopic(fetchedTopic);
          setContent(fetchedContent);
          if (!fetchedTopic) {
            setFetchError(`Topic not found in Supabase: level="${level}", slug="${topicSlug}"`);
          } else if (!fetchedContent) {
            setFetchError(`Content tables returned 0 rows for topic UUID. Check RLS policies on grammar_examples, grammar_rules, grammar_exercises.`);
          }
          setDataLoading(false);
        }
      } catch (err) {
        console.error(`[GrammarLessonPage] fetch error:`, err);
        if (!cancelled) {
          setFetchError(err.message || String(err));
          setDataLoading(false);
        }
      }
    };
    if (levels.includes(level) && unlocked) {
      loadData();
    } else {
      console.log(`[GrammarLessonPage] skipping load: level="${level}" valid=${levels.includes(level)}, unlocked=${unlocked}`);
      setDataLoading(false);
    }
    return () => { cancelled = true; };
  }, [level, topicSlug, unlocked]);

  // Load saved progress
  useEffect(() => {
    if (topic) {
      const progress = getGrammarTopicProgress(level, topic.id);
      if (progress.currentStage) {
        setCurrentStage(progress.currentStage);
      }
      const completed = {};
      for (let i = 1; i < progress.currentStage; i++) {
        completed[i] = true;
      }
      setStageCompleted(completed);
    }
  }, [level, topic, getGrammarTopicProgress]);

  if (dataLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 flex items-center justify-center`}>
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!topic || !content) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 pt-12">
          <div className="bg-white rounded-2xl shadow-lg border border-rose-200 p-8">
            <h2 className="text-xl font-bold text-rose-700 mb-4">No content found from Supabase</h2>
            <div className="space-y-2 text-sm font-mono bg-rose-50 rounded-lg p-4 text-rose-800 mb-6">
              <p><strong>Level:</strong> {level}</p>
              <p><strong>Slug:</strong> {topicSlug}</p>
              <p><strong>Topic found:</strong> {topic ? 'YES' : 'NO'}</p>
              <p><strong>Content found:</strong> {content ? 'YES' : 'NO'}</p>
              {fetchError && <p><strong>Error:</strong> {fetchError}</p>}
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Check the browser console for detailed [grammarService] logs. Common causes:
              missing RLS SELECT policy on grammar_examples / grammar_rules / grammar_exercises,
              or topic slug mismatch in grammar_topics table.
            </p>
            <button
              onClick={() => navigate(`/grammar/${level}`)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStageComplete = async () => {
    // Mark current stage as completed
    setStageCompleted(prev => ({ ...prev, [currentStage]: true }));

    // Calculate progress percentage
    const progressPercent = Math.round((currentStage / 5) * 100);

    if (currentStage < 5) {
      // Move to next stage
      const nextStage = currentStage + 1;
      setCurrentStage(nextStage);

      // Save progress
      await updateGrammarTopicProgress(level, topic.id, {
        currentStage: nextStage,
        progress: progressPercent,
        completed: false,
      });
    } else {
      // Topic completed!
      await completeGrammarTopic(level, topic.id, 100);
      // Navigate back to topic list
      navigate(`/grammar/${level}`);
    }
  };

  const handleStageClick = (stageId) => {
    // TODO: Re-enable stage locking for production
    if (!STAGE_LOCKING_ENABLED || stageId <= currentStage || stageCompleted[stageId]) {
      setCurrentStage(stageId);
    }
  };

  const goToPreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const currentStageInfo = stages[currentStage - 1];
  const StageIcon = currentStageInfo.icon;

  // Handle exercise stage completion (stages 4 and 5)
  const handleExerciseComplete = async () => {
    // Mark current stage as completed
    setStageCompleted(prev => ({ ...prev, [currentStage]: true }));

    // Calculate progress percentage
    const progressPercent = Math.round((currentStage / 5) * 100);

    if (currentStage === 4) {
      // Move to stage 5
      setCurrentStage(5);
      await updateGrammarTopicProgress(level, topic.id, {
        currentStage: 5,
        progress: progressPercent,
        completed: false,
      });
    } else if (currentStage === 5) {
      // Topic completed!
      await completeGrammarTopic(level, topic.id, 100);
      navigate(`/grammar/${level}`);
    }
  };

  // Check if stage has content
  const hasStageContent = (stageNum) => {
    return !!content[`stage${stageNum}`];
  };

  // Render stage content based on current stage
  const renderStageContent = () => {
    const stageContent = content[`stage${currentStage}`];

    switch (currentStage) {
      case 1:
        return <StageIntroduction content={stageContent} isGerman={isGerman} theme={theme} />;
      case 2:
        return <StageExamples content={stageContent} isGerman={isGerman} theme={theme} />;
      case 3:
        return <StageRuleBreakdown content={stageContent} isGerman={isGerman} theme={theme} />;
      case 4:
        if (stageContent && stageContent.exercises) {
          return (
            <StageGuidedPractice
              content={stageContent}
              isGerman={isGerman}
              theme={theme}
              onComplete={handleExerciseComplete}
            />
          );
        }
        return (
          <div className="text-center py-12">
            <PenTool className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {isGerman ? 'Geführte Übung' : 'Guided Practice'}
            </h3>
            <p className="text-slate-500">
              {isGerman ? 'Übungen werden bald hinzugefügt!' : 'Exercises coming soon!'}
            </p>
          </div>
        );
      case 5:
        if (stageContent && stageContent.exercises) {
          return (
            <StageMastery
              content={stageContent}
              isGerman={isGerman}
              theme={theme}
              onComplete={handleExerciseComplete}
            />
          );
        }
        return (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {isGerman ? 'Freie Übung' : 'Free Practice'}
            </h3>
            <p className="text-slate-500">
              {isGerman ? 'Meisterschaftsprüfung wird bald hinzugefügt!' : 'Mastery test coming soon!'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Check if we should show the navigation footer (hide for exercise stages with content)
  const showNavigationFooter = () => {
    if (currentStage === 4 || currentStage === 5) {
      const stageContent = content[`stage${currentStage}`];
      return !(stageContent && stageContent.exercises);
    }
    return true;
  };

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
            onClick={() => navigate(`/grammar/${level}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          {/* Topic Title */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-xl">{topic.order}</span>
              </div>
              <div className="flex-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                  {isGerman ? topic.titleDe : topic.titleEn}
                </h1>
                <p className="text-slate-600 text-sm">
                  {level.toUpperCase()} • {topic.estimatedTime} min
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stage Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              {stages.map((stage, index) => {
                const isCompleted = stageCompleted[stage.id];
                const isCurrent = currentStage === stage.id;
                // TODO: Re-enable stage locking for production
                const isLocked = STAGE_LOCKING_ENABLED && stage.id > currentStage && !isCompleted;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="flex items-center">
                    <button
                      onClick={() => handleStageClick(stage.id)}
                      disabled={isLocked}
                      className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${
                        isCurrent
                          ? `bg-${stage.color}-50 border-2 border-${stage.color}-400`
                          : isCompleted
                            ? 'bg-emerald-50 hover:bg-emerald-100'
                            : isLocked
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? `bg-${stage.color}-500 text-white`
                          : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isCompleted && !isCurrent ? (
                          <Check className="w-5 h-5" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs mt-1 font-medium hidden sm:block ${
                        isCurrent ? `text-${stage.color}-600` : isCompleted ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {isGerman ? stage.name.de : stage.name.en}
                      </span>
                    </button>

                    {/* Connector line */}
                    {index < stages.length - 1 && (
                      <div className={`w-4 sm:w-8 h-0.5 mx-1 ${
                        stageCompleted[stage.id] ? 'bg-emerald-400' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Stage Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Stage Header */}
            <div className={`bg-gradient-to-r from-${currentStageInfo.color}-500 to-${currentStageInfo.color}-600 px-6 py-4`}>
              <div className="flex items-center gap-3">
                <StageIcon className="w-6 h-6 text-white" />
                <div>
                  <h2 className="font-semibold text-white">
                    {isGerman ? `Stufe ${currentStage}: ${currentStageInfo.name.de}` : `Stage ${currentStage}: ${currentStageInfo.name.en}`}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStageContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Footer - hidden for exercise stages with content */}
            {showNavigationFooter() && (
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPreviousStage}
                    disabled={currentStage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentStage === 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    {isGerman ? 'Zurück' : 'Previous'}
                  </button>

                  <div className="text-sm text-slate-500">
                    {currentStage} / 5
                  </div>

                  <button
                    onClick={handleStageComplete}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all bg-gradient-to-r ${theme.gradient} text-white hover:shadow-lg`}
                  >
                    {currentStage === 5 ? (
                      <>
                        {isGerman ? 'Abschließen' : 'Complete'}
                        <Trophy className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        {isGerman ? 'Weiter' : 'Continue'}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStage / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full`}
            />
          </div>
          <p className="text-center text-sm text-slate-500 mt-2">
            {isGerman
              ? `${Math.round((currentStage / 5) * 100)}% abgeschlossen`
              : `${Math.round((currentStage / 5) * 100)}% complete`}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GrammarLessonPage;
