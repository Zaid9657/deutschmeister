import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, BookMarked, MessageSquare, Headphones, Mic, Radio, Sun, TreePine, Waves, Moon, Loader2, Filter, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { fetchWordsForLevel, fetchSentencesForLevel } from '../services/vocabularyService';
import { fetchTopicsForLevel } from '../services/grammarService';
import { getReadingLessonsByLevel } from '../services/readingService';
import WordCard from '../components/WordCard';
import SentenceCard from '../components/SentenceCard';
import GrammarTopicCard from '../components/GrammarTopicCard';
import ReadingLessonCard from '../components/ReadingLessonCard';
import SpeakingPractice from '../components/SpeakingPractice';
import PodcastsTab from '../components/level/PodcastsTab';
import { useLevelExercises } from '../hooks/useListening';
import ExerciseCard from '../components/listening/ExerciseCard';
import SEO from '../components/SEO';

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

const LevelPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setCurrentLevel, getThemeForLevel } = useTheme();
  const { getLevelProgress, registerLevelItemCounts, getGrammarTopicProgress, isItemLearned } = useProgress();

  const [activeTab, setActiveTab] = useState('vocabulary');
  const [levelVocabulary, setLevelVocabulary] = useState([]);
  const [levelSentences, setLevelSentences] = useState([]);
  const [grammarTopics, setGrammarTopics] = useState([]);
  const [readingLessons, setReadingLessons] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(true);
  const [grammarLoading, setGrammarLoading] = useState(true);
  const [readingLoading, setReadingLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Listening exercises for this level
  const { exercises: listeningExercises, loading: listeningLoading } = useLevelExercises(level.toUpperCase());

  const theme = getThemeForLevel(level);
  const progress = getLevelProgress(level);
  const Icon = iconMap[level] || Sun;
  const levelInfo = contentLevelThemes[level] || {};

  useEffect(() => {
    if (!levels.includes(level)) {
      navigate('/dashboard');
      return;
    }
    setCurrentLevel(level);
    return () => setCurrentLevel(null);
  }, [level, navigate, setCurrentLevel]);

  // Fetch vocabulary and sentences from Supabase
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setVocabLoading(true);
      const [words, sents] = await Promise.all([
        fetchWordsForLevel(level),
        fetchSentencesForLevel(level),
      ]);
      if (!cancelled) {
        setLevelVocabulary(words);
        setLevelSentences(sents);
        registerLevelItemCounts(level, words.length, sents.length);
        setVocabLoading(false);
      }
    };
    if (levels.includes(level)) {
      load();
    }
    return () => { cancelled = true; };
  }, [level]);

  // Fetch grammar topics from Supabase
  useEffect(() => {
    let cancelled = false;
    const loadGrammar = async () => {
      setGrammarLoading(true);
      const topics = await fetchTopicsForLevel(level);
      if (!cancelled) {
        setGrammarTopics(topics);
        setGrammarLoading(false);
      }
    };
    if (levels.includes(level)) {
      loadGrammar();
    }
    return () => { cancelled = true; };
  }, [level]);

  // Fetch reading lessons from Supabase
  useEffect(() => {
    let cancelled = false;
    const loadReading = async () => {
      setReadingLoading(true);
      const lessons = await getReadingLessonsByLevel(level);
      if (!cancelled) {
        setReadingLessons(lessons);
        setReadingLoading(false);
      }
    };
    if (levels.includes(level)) {
      loadReading();
    }
    return () => { cancelled = true; };
  }, [level]);

  const tabs = [
    { id: 'vocabulary', label: t('levelPage.vocabulary'), icon: BookOpen },
    { id: 'sentences', label: t('levelPage.sentences'), icon: MessageSquare },
    { id: 'grammar', label: t('levelPage.grammar'), icon: BookMarked },
    { id: 'reading', label: t('levelPage.reading'), icon: FileText },
    { id: 'listening', label: t('levelPage.listening'), icon: Headphones },
    { id: 'podcasts', label: t('levelPage.podcasts', 'Podcasts'), icon: Radio },
    { id: 'speaking', label: t('levelPage.speaking'), icon: Mic },
  ];

  // Format level for display (a1.1 -> A1.1)
  const displayLevel = level.toUpperCase();

  // SEO metadata per level and tab
  const grammarSeo = {
    'A1.1': { title: 'German Grammar A1.1 - Complete Beginner', desc: 'Start learning German grammar with A1.1 beginner lessons. Master personal pronouns, sein & haben, articles, noun gender, and basic word order.' },
    'A1.2': { title: 'German Grammar A1.2 - Elementary Basics', desc: 'Continue your German journey with A1.2 grammar. Learn regular verb conjugation, accusative case, negation, possessive articles, and separable verbs.' },
    'A2.1': { title: 'German Grammar A2.1 - Elementary Intermediate', desc: 'Advance your German with A2.1 grammar topics. Master dative case, two-way prepositions, reflexive verbs, and comparative adjectives.' },
    'A2.2': { title: 'German Grammar A2.2 - Pre-Intermediate', desc: 'Build fluency with A2.2 German grammar. Learn genitive case, relative clauses, passive voice basics, and subordinate clause word order.' },
    'B1.1': { title: 'German Grammar B1.1 - Intermediate', desc: 'Reach intermediate German with B1.1 grammar. Master Konjunktiv II, extended adjective endings, infinitive clauses, and past perfect tense.' },
    'B1.2': { title: 'German Grammar B1.2 - Upper Intermediate', desc: 'Strengthen your German with B1.2 grammar. Learn indirect speech, passive alternatives, advanced modal verbs, and complex sentence structures.' },
    'B2.1': { title: 'German Grammar B2.1 - Advanced Intermediate', desc: 'Polish your German with B2.1 grammar. Master participle constructions, subjunctive mood, nominal style, and advanced relative clauses.' },
    'B2.2': { title: 'German Grammar B2.2 - Upper Advanced', desc: 'Perfect your German with B2.2 grammar. Learn advanced Konjunktiv I, complex passive forms, academic writing style, and nuanced connectors.' },
  };
  const vocabSeo = {
    title: `German Vocabulary ${displayLevel} - Word Lists & Practice`,
    desc: `Build your German vocabulary for level ${displayLevel}. Curated word lists with audio pronunciation, example sentences, and progress tracking.`,
  };
  const listeningSeo = {
    title: `German Listening Practice ${displayLevel} - Audio Exercises`,
    desc: `Improve your German comprehension with ${displayLevel} listening exercises. Native speaker dialogues with multiple choice questions and instant feedback.`,
  };
  const podcastsSeo = {
    title: `German Learning Videos ${displayLevel} - Podcasts`,
    desc: `Watch German learning videos for level ${displayLevel}. Video lessons covering grammar and vocabulary with native speakers. Free to access.`,
  };

  const tabSeoMap = {
    grammar: grammarSeo[displayLevel] || { title: `German Grammar ${displayLevel}`, desc: `German grammar lessons for level ${displayLevel}.` },
    vocabulary: vocabSeo,
    sentences: { title: `German Sentences ${displayLevel} - Practice Phrases`, desc: `Practice German sentences and phrases for level ${displayLevel}. Learn everyday expressions with translations.` },
    listening: listeningSeo,
    podcasts: podcastsSeo,
    speaking: { title: `German Speaking Practice ${displayLevel}`, desc: `Practice speaking German at ${displayLevel} level with AI-powered conversation prompts and feedback.` },
    reading: { title: `German Reading Practice ${displayLevel}`, desc: `Read German texts at ${displayLevel} level with vocabulary support and comprehension questions.` },
  };
  const seo = tabSeoMap[activeTab] || tabSeoMap.grammar;
  const seoEducationalLevel = displayLevel.startsWith('A1') ? 'Beginner' : displayLevel.startsWith('A2') ? 'Elementary' : displayLevel.startsWith('B1') ? 'Intermediate' : 'Upper Intermediate';

  // Derive unique categories from loaded vocabulary
  const categories = useMemo(() => {
    const cats = [...new Set(levelVocabulary.map((w) => w.category).filter(Boolean))];
    cats.sort();
    return cats;
  }, [levelVocabulary]);

  // Filter vocabulary by selected category
  const filteredVocabulary = useMemo(() => {
    if (selectedCategory === 'all') return levelVocabulary;
    return levelVocabulary.filter((w) => w.category === selectedCategory);
  }, [levelVocabulary, selectedCategory]);

  // Reset filters when level changes
  useEffect(() => {
    setSelectedCategory('all');
  }, [level]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 pb-12`}>
      <SEO
        title={seo.title}
        description={seo.desc}
        path={`/level/${level}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Course",
          "name": seo.title,
          "description": seo.desc,
          "provider": { "@type": "Organization", "name": "DeutschMeister", "url": "https://deutsch-meister.de/" },
          "educationalLevel": seoEducationalLevel,
          "inLanguage": "de",
          "isAccessibleForFree": true
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                  {t(`levels.${level}.name`, { defaultValue: displayLevel })}
                </h1>
                <p className="text-slate-600">
                  {t(`levels.${level}.theme`, { defaultValue: levelInfo.name || '' })}
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
                <p className="text-sm text-slate-500">{t('dashboard.progress')}</p>
                <p className="text-2xl font-bold text-slate-800">{progress}%</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="fill-none stroke-slate-200"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    className={`fill-none stroke-current text-${theme.primary}`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 251.2' }}
                    animate={{ strokeDasharray: `${(progress / 100) * 251.2} 251.2` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Vocabulary Tab */}
            {activeTab === 'vocabulary' && (
              <div>
                {vocabLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!vocabLoading && (
                  <>
                    {/* Category filter */}
                    {categories.length > 1 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Filter className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-600">Category</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedCategory === 'all'
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            All ({levelVocabulary.length})
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                selectedCategory === cat
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {cat} ({levelVocabulary.filter((w) => w.category === cat).length})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Word cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVocabulary.map((word) => (
                        <WordCard key={word.id} word={word} level={level} />
                      ))}
                      {levelVocabulary.length === 0 && (
                        <div className="col-span-full bg-white rounded-xl border border-rose-200 p-6">
                          <h3 className="text-lg font-bold text-rose-700 mb-2">No vocabulary from Supabase</h3>
                          <div className="text-sm font-mono bg-rose-50 rounded-lg p-3 text-rose-800 mb-3">
                            <p><strong>Level queried:</strong> {level.toLowerCase()}</p>
                            <p><strong>Table:</strong> words WHERE level = '{level.toLowerCase()}'</p>
                          </div>
                          <p className="text-slate-600 text-sm">
                            Check browser console for [vocabularyService] logs. Possible causes: missing RLS SELECT policy, no data for this level, or column name mismatch.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sentences Tab */}
            {activeTab === 'sentences' && (
              <div>
                {vocabLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!vocabLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {levelSentences.map((sentence) => (
                      <SentenceCard key={sentence.id} sentence={sentence} level={level} />
                    ))}
                    {levelSentences.length === 0 && (
                      <div className="col-span-full bg-white rounded-xl border border-rose-200 p-6">
                        <h3 className="text-lg font-bold text-rose-700 mb-2">No sentences from Supabase</h3>
                        <div className="text-sm font-mono bg-rose-50 rounded-lg p-3 text-rose-800 mb-3">
                          <p><strong>Level queried:</strong> {level.toLowerCase()}</p>
                          <p><strong>Table:</strong> sentences WHERE level = '{level.toLowerCase()}'</p>
                        </div>
                        <p className="text-slate-600 text-sm">
                          Check browser console for [vocabularyService] logs. Possible causes: missing RLS SELECT policy, no data for this level, or column name mismatch.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Grammar Tab */}
            {activeTab === 'grammar' && (
              <div>
                {grammarLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!grammarLoading && grammarTopics.length > 0 && (
                  <div className="space-y-3">
                    {grammarTopics.map((topic, index) => {
                      const topicProgress = getGrammarTopicProgress(level, topic.id);
                      return (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <GrammarTopicCard
                            topic={topic}
                            level={level}
                            isCompleted={topicProgress.completed}
                            progress={topicProgress.progress || 0}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {!grammarLoading && grammarTopics.length === 0 && (
                  <div className="col-span-full bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <p className="text-slate-500">No grammar topics available for this level yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Reading Tab */}
            {activeTab === 'reading' && (
              <div>
                {readingLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!readingLoading && readingLessons.length > 0 && (
                  <div className="space-y-3">
                    {readingLessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ReadingLessonCard
                          lesson={lesson}
                          level={level}
                          index={index}
                          isCompleted={isItemLearned(level, 'readingLessons', lesson.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
                {!readingLoading && readingLessons.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <p className="text-slate-500">No reading lessons available for this level yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Listening Tab */}
            {activeTab === 'listening' && (
              <div>
                {listeningLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!listeningLoading && listeningExercises.length > 0 && (
                  <div className="space-y-3">
                    {listeningExercises.map((exercise, index) => (
                      <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
                    ))}
                  </div>
                )}
                {!listeningLoading && listeningExercises.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <Headphones size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">{t('levelPage.noListening', 'No listening exercises available for this level yet.')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Podcasts Tab */}
            {activeTab === 'podcasts' && (
              <PodcastsTab subLevel={level.toUpperCase()} />
            )}

            {/* Speaking Tab */}
            {activeTab === 'speaking' && (
              <SpeakingPractice level={level} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LevelPage;
