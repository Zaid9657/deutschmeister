import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Headphones, Clock, Play, ChevronRight, Radio, Sparkles, Lock } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import SEO from '../components/SEO';

const LEVEL_INFO = {
  'A1.1': { name: 'Complete Beginner', color: 'from-emerald-400 to-teal-400', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'A1.2': { name: 'Elementary', color: 'from-emerald-500 to-teal-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'A2.1': { name: 'Pre-Intermediate', color: 'from-teal-400 to-cyan-400', textColor: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  'A2.2': { name: 'Intermediate Foundations', color: 'from-teal-500 to-cyan-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  'B1.1': { name: 'Lower Intermediate', color: 'from-blue-400 to-indigo-400', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'B1.2': { name: 'Intermediate', color: 'from-blue-500 to-indigo-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'B2.1': { name: 'Upper Intermediate', color: 'from-indigo-400 to-purple-400', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  'B2.2': { name: 'Advanced Foundations', color: 'from-indigo-500 to-purple-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
};

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PodcastsPage = () => {
  const [podcastsByLevel, setPodcastsByLevel] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();

  useEffect(() => {
    fetchAllPodcasts();
  }, []);

  const fetchAllPodcasts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('is_published', true)
      .order('podcast_order');

    if (!error && data) {
      // Group by level
      const grouped = {};
      LEVEL_ORDER.forEach(level => {
        grouped[level] = data.filter(p => p.sub_level === level);
      });
      setPodcastsByLevel(grouped);
      setTotalCount(data.length);
    }
    setLoading(false);
  };

  const canAccessLevel = (level) => {
    return isLevelFree(level) || (user && hasAccess);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16">
      <SEO
        title="German Podcasts for Beginners | Learn German A1-B2 | DeutschMeister"
        description="Free German podcasts designed for learners. 24 episodes with native speaker audio and transcripts for levels A1 to B2. Improve your German listening skills while commuting or relaxing."
        keywords="German podcast for beginners, learn German podcast, German listening practice, German audio lessons, German podcast with transcript"
        path="/podcasts"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "PodcastSeries",
            "name": "DeutschMeister German Learning Podcast",
            "description": "German language learning podcast with 24 episodes covering levels A1 to B2. Each episode features native speaker conversations with transcripts and vocabulary explanations.",
            "webFeed": "https://deutsch-meister.de/podcasts",
            "inLanguage": ["de", "en"],
            "numberOfEpisodes": 24,
            "genre": ["Education", "Language Learning"],
            "author": {
              "@type": "Organization",
              "name": "DeutschMeister",
              "url": "https://deutsch-meister.de"
            },
            "isAccessibleForFree": true
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What level are the German podcasts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We have 24 podcast episodes covering all levels from A1 (complete beginner) to B2 (upper intermediate). Each episode is labeled with its CEFR level so you can find content that matches your skills."
                }
              },
              {
                "@type": "Question",
                "name": "Are the German podcasts free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, all podcasts are free to listen to. A1.1 content is available without signup, while other levels require a free account."
                }
              },
              {
                "@type": "Question",
                "name": "Do the podcasts have transcripts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, every podcast episode includes a full transcript in German with translations. This helps you follow along and learn new vocabulary in context."
                }
              },
              {
                "@type": "Question",
                "name": "How many podcast episodes are there?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We have 24 episodes total — 3 episodes for each of the 8 CEFR levels (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2). New episodes are added regularly."
                }
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
              {"@type": "ListItem", "position": 2, "name": "Podcasts", "item": "https://deutsch-meister.de/podcasts"}
            ]
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium mb-4">
            <Radio className="w-4 h-4" />
            {totalCount} Episodes Available
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
            German Podcasts for Learners
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-2">
            Native speaker audio with transcripts • Levels A1 to B2
          </p>
          <p className="text-slate-500 max-w-xl mx-auto">
            Listen to authentic German conversations designed for language learners. Each episode comes with full transcripts and vocabulary explanations.
          </p>
        </motion.div>

        {/* Podcast Grid by Level */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-8 mb-16">
            {LEVEL_ORDER.map((level, index) => {
              const podcasts = podcastsByLevel[level] || [];
              const levelInfo = LEVEL_INFO[level];
              const accessible = canAccessLevel(level);
              const isFree = isLevelFree(level);

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Level Header */}
                  <div className={`bg-gradient-to-r ${levelInfo.color} p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-bold text-white">{level}</span>
                          {isFree && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                              <Sparkles className="w-3 h-3" />
                              FREE
                            </span>
                          )}
                          {!accessible && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/20 text-white text-xs font-semibold">
                              <Lock className="w-3 h-3" />
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-white/90 text-sm">{levelInfo.name}</p>
                      </div>
                      <div className="text-white/80 text-sm">
                        {podcasts.length} episode{podcasts.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Podcast List */}
                  <div className="p-6">
                    {podcasts.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">
                        New episodes coming soon!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {podcasts.map((podcast) => (
                          <div
                            key={podcast.id}
                            className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer"
                            onClick={() => navigate(`/level/${level.toLowerCase()}?tab=podcasts`)}
                          >
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center relative overflow-hidden">
                              <Headphones className="w-8 h-8 text-white/80" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 text-orange-500 ml-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">
                                {podcast.title_en}
                              </h3>
                              {podcast.description_en && (
                                <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                                  {podcast.description_en}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                {podcast.duration_seconds && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(podcast.duration_seconds)}
                                  </span>
                                )}
                                {podcast.difficulty && (
                                  <span className={`px-2 py-0.5 rounded-full capitalize font-medium
                                    ${podcast.difficulty === 'easy' ? 'bg-green-100 text-green-700' : ''}
                                    ${podcast.difficulty === 'normal' ? 'bg-yellow-100 text-yellow-700' : ''}
                                    ${podcast.difficulty === 'challenging' ? 'bg-red-100 text-red-700' : ''}`}>
                                    {podcast.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* View All Link */}
                    {podcasts.length > 0 && (
                      <Link
                        to={`/level/${level.toLowerCase()}?tab=podcasts`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        View all {level} podcasts
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* SEO Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 mb-12"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-6">
            Learn German with Podcasts
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed mb-4">
              Our German podcasts are designed specifically for language learners. Each episode features native speakers in natural conversations, with full transcripts and vocabulary explanations to help you follow along.
            </p>

            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Why learn with podcasts?</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Improve listening comprehension with native speaker audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Learn natural speech patterns and pronunciation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Study anywhere — while commuting, exercising, or relaxing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Full transcripts help you catch every word</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Vocabulary highlights teach you new words in context</span>
              </li>
            </ul>

            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Podcasts for every level</h3>
            <p className="text-slate-600 leading-relaxed">
              Whether you're just starting with German (A1) or working toward fluency (B2), we have 24 episodes across all 8 CEFR levels. Each podcast is labeled with its level so you always know it's right for you.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/level/a1.1?tab=podcasts"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
            >
              Start Listening
              <Play className="w-5 h-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Sign Up Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PodcastsPage;
