import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, MessageSquare, Volume2, Mic, Sun, TreePine, Waves, Moon, Loader2, Filter, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { levels, levelThemes as contentLevelThemes } from '../data/content';
import { fetchWordsForLevel, fetchSentencesForLevel } from '../services/vocabularyService';
import { fetchParagraphsForLevel } from '../services/paragraphService';
import WordCard from '../components/WordCard';
import SentenceCard from '../components/SentenceCard';
import ParagraphCard from '../components/ParagraphCard';
import SpeakingPractice from '../components/SpeakingPractice';

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
  const { getLevelProgress, registerLevelItemCounts } = useProgress();

  const [activeTab, setActiveTab] = useState('vocabulary');
  const [levelVocabulary, setLevelVocabulary] = useState([]);
  const [levelSentences, setLevelSentences] = useState([]);
  const [levelParagraphs, setLevelParagraphs] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

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
      const [words, sents, paras] = await Promise.all([
        fetchWordsForLevel(level),
        fetchSentencesForLevel(level),
        fetchParagraphsForLevel(level),
      ]);
      if (!cancelled) {
        setLevelVocabulary(words);
        setLevelSentences(sents);
        setLevelParagraphs(paras);
        registerLevelItemCounts(level, words.length, sents.length, paras.length);
        setVocabLoading(false);
      }
    };
    if (levels.includes(level)) {
      load();
    }
    return () => { cancelled = true; };
  }, [level]);

  const tabs = [
    { id: 'vocabulary', label: t('levelPage.vocabulary'), icon: BookOpen },
    { id: 'sentences', label: t('levelPage.sentences'), icon: MessageSquare },
    { id: 'paragraphs', label: t('levelPage.reading'), icon: FileText },
    { id: 'audio', label: t('levelPage.audio'), icon: Volume2 },
    { id: 'speaking', label: t('levelPage.speaking'), icon: Mic },
  ];

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  // Format level for display (a1.1 -> A1.1)
  const displayLevel = level.toUpperCase();

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

  // Derive unique topics from loaded paragraphs
  const paragraphTopics = useMemo(() => {
    const topics = [...new Set(levelParagraphs.map((p) => p.topic).filter(Boolean))];
    topics.sort();
    return topics;
  }, [levelParagraphs]);

  // Filter paragraphs by selected topic
  const filteredParagraphs = useMemo(() => {
    if (selectedTopic === 'all') return levelParagraphs;
    return levelParagraphs.filter((p) => p.topic === selectedTopic);
  }, [levelParagraphs, selectedTopic]);

  // Reset filters when level changes
  useEffect(() => {
    setSelectedCategory('all');
    setSelectedTopic('all');
  }, [level]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} pt-20 pb-12`}>
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

            {/* Paragraphs / Reading Tab */}
            {activeTab === 'paragraphs' && (
              <div>
                {vocabLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                {!vocabLoading && (
                  <>
                    {/* Topic filter */}
                    {paragraphTopics.length > 1 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Filter className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-600">Topic</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedTopic('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedTopic === 'all'
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            All ({levelParagraphs.length})
                          </button>
                          {paragraphTopics.map((topic) => (
                            <button
                              key={topic}
                              onClick={() => setSelectedTopic(topic)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                selectedTopic === topic
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {topic} ({levelParagraphs.filter((p) => p.topic === topic).length})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Paragraph cards — single column for readability */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredParagraphs.map((paragraph) => (
                        <ParagraphCard key={paragraph.id} paragraph={paragraph} level={level} />
                      ))}
                      {levelParagraphs.length === 0 && (
                        <div className="col-span-full bg-white rounded-xl border border-slate-200 p-6 text-center">
                          <p className="text-slate-500">No reading paragraphs available for this level yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <h2 className="font-display text-2xl font-bold text-slate-800 mb-6">
                  {t('levelPage.listenPronunciation')}
                </h2>
                <p className="text-slate-600 mb-8">
                  Click on any word or sentence to hear its pronunciation.
                </p>

                {vocabLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}

                {/* Vocabulary Audio List */}
                {!vocabLoading && levelVocabulary.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-slate-700 mb-4">Vocabulary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {levelVocabulary.map((word) => (
                        <button
                          key={word.id}
                          onClick={() => handleSpeak(word.word)}
                          className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-${theme.primary}/10 transition-colors text-left`}
                        >
                          <Volume2 className={`w-5 h-5 text-${theme.primary} flex-shrink-0`} />
                          <div>
                            <p className="font-medium text-slate-800">{word.word}</p>
                            <p className="text-sm text-slate-500">{word.translation}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentences Audio List */}
                {!vocabLoading && levelSentences.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-4">Sentences</h3>
                    <div className="space-y-3">
                      {levelSentences.map((sentence) => (
                        <button
                          key={sentence.id}
                          onClick={() => handleSpeak(sentence.german)}
                          className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-${theme.primary}/10 transition-colors text-left w-full`}
                        >
                          <Volume2 className={`w-5 h-5 text-${theme.primary} flex-shrink-0`} />
                          <div>
                            <p className="font-medium text-slate-800">{sentence.german}</p>
                            <p className="text-sm text-slate-500">{sentence.english}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!vocabLoading && levelVocabulary.length === 0 && levelSentences.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No audio content available for this level yet.
                  </div>
                )}
              </div>
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
