import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, BookMarked, MessageSquare, Headphones, Radio, Sun, TreePine, Waves, Moon, Loader2, Filter, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { enqueueWords } from '../services/srsService';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { fetchWordsForLevel, fetchSentencesForLevel } from '../services/vocabularyService';
import { fetchTopicsForLevel } from '../services/grammarService';
import { getReadingLessonsByLevel } from '../services/readingService';
import WordCard from '../components/WordCard';
import SentenceCard from '../components/SentenceCard';
import GrammarTopicCard from '../components/GrammarTopicCard';
import ReadingLessonCard from '../components/ReadingLessonCard';
import PodcastsTab from '../components/level/PodcastsTab';
import { useLevelExercises } from '../hooks/useListening';
import ExerciseCard from '../components/listening/ExerciseCard';
import SEO from '../components/SEO';
import EmptyState from '../components/EmptyState';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// The level icon is a shape cue only. It carries no colour: a level is not a
// case, and tokens rule 1 reserves colour for grammatical case (design-tokens.js).
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
  const { setCurrentLevel } = useTheme();
  const { getLevelProgress, getGrammarTopicProgress, isItemLearned } = useProgress();
  const { user } = useAuth();

  // "In den Trainer": enqueue the visible words as SRS cards (idempotent).
  const [trainerAddState, setTrainerAddState] = useState('idle');
  const handleAddToTrainer = async () => {
    if (!user || trainerAddState === 'adding') return;
    setTrainerAddState('adding');
    // Only real DB ids — the mapper falls back to `word-${index}` when a row
    // has none, and those can't reference public.words.
    const ids = filteredVocabulary.map((w) => w.id).filter((id) => /^[0-9a-f-]{36}$/.test(String(id)));
    await enqueueWords(user.id, ids);
    setTrainerAddState('added');
  };

  // Deep links carry the tab in the query string — PodcastsPage sends users to
  // ?tab=podcasts, the prerendered "Start Listening" CTA to ?tab=listening, and
  // the level test to ?tab=vocabulary. Without this they all landed on the
  // default tab instead.
  const [searchParams, setSearchParams] = useSearchParams();
  const TAB_IDS = ['vocabulary', 'sentences', 'grammar', 'reading', 'listening', 'podcasts'];
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TAB_IDS.includes(requestedTab) ? requestedTab : 'vocabulary'
  );

  // Keep the URL in sync so the tab survives a refresh or a shared link.
  const selectTab = (tabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    if (tabId === 'vocabulary') next.delete('tab');
    else next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  // Respond to in-app navigation that only changes the query string.
  useEffect(() => {
    if (requestedTab && TAB_IDS.includes(requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTab]);
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
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
      <SEO
        title={seo.title}
        description={seo.desc}
        path={`/level/${level}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Course",
          "name": seo.title,
          "description": seo.desc,
          "provider": { "@type": "Organization", "@id": "https://deutsch-meister.de/#organization", "name": "DeutschMeister", "url": "https://deutsch-meister.de" },
          "educationalLevel": seoEducationalLevel,
          "inLanguage": "de",
          "isAccessibleForFree": true
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — aurora hero. The level is a CHIP, never a colour: colour
            means grammatical case (design-tokens.js rule 1). */}
        <div className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-4 sm:-mx-4 sm:px-4">
          <Aurora />
          <div className="relative">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-graphite hover:text-siegel-deep mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('common.back')}
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <Reveal as="div" className="flex flex-wrap items-center gap-2">
                    <Chip tone="label">{displayLevel}</Chip>
                    {levelInfo.part && <Chip tone="quiet">Part {levelInfo.part} of 2</Chip>}
                  </Reveal>
                  <Reveal
                    as="h1"
                    delay={60}
                    className="mt-3 font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]"
                  >
                    {t(`levels.${level}.name`, { defaultValue: displayLevel })}
                  </Reveal>
                  <Reveal as="p" delay={120} className="mt-2 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                    {t(`levels.${level}.theme`, { defaultValue: levelInfo.name || '' })}
                  </Reveal>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{t('dashboard.progress')}</p>
                  <p className="font-display text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">{progress}%</p>
                </div>
                <div className="w-24 h-24 relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="fill-none stroke-rule"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="fill-none stroke-siegel-lift"
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
          </div>
        </div>

        {/* Tabs — pressable chips; the selected one takes the ink tone
            (siegel stays the one interactive colour, tokens rule 2). */}
        <div className="mb-8">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <Chip
                key={tab.id}
                size="md"
                raised
                tone={activeTab === tab.id ? 'ink' : 'quiet'}
                onClick={() => selectTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className="whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Chip>
            ))}
          </div>
        </div>

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
                    <Loader2 className="w-8 h-8 text-graphite animate-spin" />
                  </div>
                )}
                {!vocabLoading && (
                  <>
                    {/* Into the trainer — the persisted replacement for the old
                        "Mark learned" checkbox, which was never saved for
                        logged-in users. Adds the (filtered) words as SRS cards. */}
                    {user && filteredVocabulary.length > 0 && (
                      <Card raised edge="siegel" tone="wash" className="mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <p className="text-sm text-siegel-deep">
                          Diese Wörter in wachsenden Abständen üben, statt sie nur zu lesen?
                        </p>
                        <Button
                          size="sm"
                          onClick={handleAddToTrainer}
                          disabled={trainerAddState === 'adding'}
                          className="shrink-0"
                        >
                          {trainerAddState === 'added'
                            ? 'Im Trainer ✓'
                            : trainerAddState === 'adding'
                              ? 'Wird hinzugefügt…'
                              : selectedCategory === 'all'
                                ? 'In den Trainer'
                                : `${selectedCategory} in den Trainer`}
                        </Button>
                      </Card>
                    )}

                    {/* Category filter */}
                    {categories.length > 1 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Filter className="w-4 h-4 text-siegel" />
                          <span className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Category</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Chip
                            raised
                            tone={selectedCategory === 'all' ? 'ink' : 'quiet'}
                            onClick={() => setSelectedCategory('all')}
                            aria-pressed={selectedCategory === 'all'}
                          >
                            All ({levelVocabulary.length})
                          </Chip>
                          {categories.map((cat) => (
                            <Chip
                              key={cat}
                              raised
                              tone={selectedCategory === cat ? 'ink' : 'quiet'}
                              onClick={() => setSelectedCategory(cat)}
                              aria-pressed={selectedCategory === cat}
                            >
                              {cat} ({levelVocabulary.filter((w) => w.category === cat).length})
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Word cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVocabulary.map((word, index) => (
                        <Reveal key={word.id} delay={Math.min(index, 8) * 70}>
                          <WordCard word={word} level={level} />
                        </Reveal>
                      ))}
                      {levelVocabulary.length === 0 && (
                        <div className="col-span-full">
                          <EmptyState
                            title="No vocabulary here yet"
                            message="This level's word list isn't available right now. The other tabs still work — try Reading or Listening."
                          />
                        </div>
                      )}
                      {levelVocabulary.length > 0 && filteredVocabulary.length === 0 && (
                        <div className="col-span-full">
                          <EmptyState
                            title="No words in this category"
                            message="Nothing matches the filter you picked. Choose a different category to see more."
                          />
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
                    <Loader2 className="w-8 h-8 text-graphite animate-spin" />
                  </div>
                )}
                {!vocabLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {levelSentences.map((sentence, index) => (
                      <Reveal key={sentence.id} delay={Math.min(index, 8) * 70}>
                        <SentenceCard sentence={sentence} level={level} />
                      </Reveal>
                    ))}
                    {levelSentences.length === 0 && (
                      <div className="col-span-full">
                        <EmptyState
                          title="No sentences here yet"
                          message="This level's sentence set isn't available right now. Try the Grammar or Reading tab in the meantime."
                        />
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
                    <Loader2 className="w-8 h-8 text-graphite animate-spin" />
                  </div>
                )}
                {!grammarLoading && grammarTopics.length > 0 && (
                  <div className="space-y-3">
                    {grammarTopics.map((topic, index) => {
                      const topicProgress = getGrammarTopicProgress(level, topic.id);
                      return (
                        <Reveal key={topic.id} delay={Math.min(index, 8) * 90}>
                          <GrammarTopicCard
                            topic={topic}
                            level={level}
                            isCompleted={topicProgress.completed}
                            progress={topicProgress.progress || 0}
                          />
                        </Reveal>
                      );
                    })}
                  </div>
                )}
                {!grammarLoading && grammarTopics.length === 0 && (
                  <Card className="col-span-full p-6 text-center">
                    <p className="text-graphite">No grammar topics available for this level yet.</p>
                  </Card>
                )}
              </div>
            )}

            {/* Reading Tab */}
            {activeTab === 'reading' && (
              <div>
                {readingLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-graphite animate-spin" />
                  </div>
                )}
                {!readingLoading && readingLessons.length > 0 && (
                  <div className="space-y-3">
                    {readingLessons.map((lesson, index) => (
                      <Reveal key={lesson.id} delay={Math.min(index, 8) * 90}>
                        <ReadingLessonCard
                          lesson={lesson}
                          level={level}
                          index={index}
                          isCompleted={isItemLearned(level, 'readingLessons', lesson.id)}
                        />
                      </Reveal>
                    ))}
                  </div>
                )}
                {!readingLoading && readingLessons.length === 0 && (
                  <Card className="p-6 text-center">
                    <p className="text-graphite">No reading lessons available for this level yet.</p>
                  </Card>
                )}
              </div>
            )}

            {/* Listening Tab */}
            {activeTab === 'listening' && (
              <div>
                {listeningLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-graphite animate-spin" />
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
                  <Card className="p-6 text-center">
                    <Headphones size={48} className="mx-auto mb-4 text-graphite/50" />
                    <p className="text-graphite">{t('levelPage.noListening', 'No listening exercises available for this level yet.')}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Podcasts Tab */}
            {activeTab === 'podcasts' && (
              <PodcastsTab subLevel={level.toUpperCase()} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LevelPage;
