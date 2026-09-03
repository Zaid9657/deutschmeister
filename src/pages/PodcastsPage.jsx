import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Clock, Play, ChevronRight, Radio, Sparkles, Lock } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import SEO from '../components/SEO';
import { seoProps } from '../data/seoRoutes.js';
import DataState from '../components/DataState';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Tilt from '../components/ui/Tilt.jsx';

// Level name only. Each entry used to carry four colour fields (a gradient, a
// text, a background and a border) so every band had its own hue — colour means
// grammatical CASE (design-tokens.js rule 1), never a level. The band is a chip
// on a neutral surface now.
const LEVEL_INFO = {
  'A1.1': { name: 'Complete Beginner' },
  'A1.2': { name: 'Elementary' },
  'A2.1': { name: 'Pre-Intermediate' },
  'A2.2': { name: 'Intermediate Foundations' },
  'B1.1': { name: 'Lower Intermediate' },
  'B1.2': { name: 'Intermediate' },
  'B2.1': { name: 'Upper Intermediate' },
  'B2.2': { name: 'Advanced Foundations' },
};

const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

// Difficulty is a content label, not a case — accent tones only.
const DIFFICULTY_TONE = { easy: 'limette', normal: 'aprikose', challenging: 'himbeer' };

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PodcastsPage = () => {
  const [podcastsByLevel, setPodcastsByLevel] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasLevelAccess } = useSubscription();

  useEffect(() => {
    fetchAllPodcasts();
  }, []);

  const fetchAllPodcasts = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('is_published', true)
      .order('podcast_order');

    // A failed fetch used to fall through silently, so every level rendered
    // "New episodes coming soon!" — indistinguishable from an empty catalogue.
    if (error) {
      console.error('[PodcastsPage] fetch failed:', error.message);
      setLoadError(error);
      setLoading(false);
      return;
    }

    if (data) {
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
    return isLevelFree(level) || (user && hasLevelAccess(level));
  };

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-16">
      <SEO
        {...seoProps('/podcasts')}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "PodcastSeries",
            "name": "DeutschMeister German Learning Podcast",
            "description": "German language learning podcast with 24 episodes covering levels A1 to B2. Each episode features native speaker conversations at a defined CEFR level.",
            "webFeed": "https://deutsch-meister.de/podcasts/",
            "inLanguage": ["de", "en"],
            "numberOfEpisodes": 24,
            "genre": ["Education", "Language Learning"],
            "author": {
              "@type": "Organization",
              "@id": "https://deutsch-meister.de/#organization",
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
              {"@type": "ListItem", "position": 2, "name": "Podcasts", "item": "https://deutsch-meister.de/podcasts/"}
            ]
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-clay text-center mb-12 py-6">
          <Aurora />
          <div className="relative">
            <Reveal as="div">
              <Chip tone="aprikose" size="md">
                <Radio className="w-4 h-4" />
                {totalCount} Episodes Available
              </Chip>
            </Reveal>
            <Reveal
              as="h1"
              delay={60}
              className="mt-4 font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3.5rem]"
            >
              German Podcasts for Learners
            </Reveal>
            <Reveal as="p" delay={120} className="mt-4 mx-auto max-w-2xl text-[1.0625rem] leading-relaxed text-graphite sm:text-[1.1875rem]">
              Native speaker audio • Levels A1 to B2
            </Reveal>
            <Reveal as="p" delay={180} className="mt-2 mx-auto max-w-xl text-[0.9375rem] leading-relaxed text-graphite">
              Listen to authentic German conversations designed for language learners, graded by level so you always understand most of what you hear.
            </Reveal>
          </div>
        </div>

        {/* Podcast Grid by Level */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-pill h-12 w-12 border-b-2 border-siegel"></div>
          </div>
        ) : loadError ? (
          <DataState error={loadError} onRetry={fetchAllPodcasts}>{null}</DataState>
        ) : (
          <div className="space-y-8 mb-16">
            {LEVEL_ORDER.map((level, index) => {
              const podcasts = podcastsByLevel[level] || [];
              const levelInfo = LEVEL_INFO[level];
              const accessible = canAccessLevel(level);
              const isFree = isLevelFree(level);

              return (
                <Reveal key={level} delay={Math.min(index, 8) * 80}>
                  <Card className="overflow-hidden">
                    {/* Level Header */}
                    <div className="bg-paper-sunk border-b border-rule p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-data text-2xl font-bold text-ink">{level}</span>
                            {isFree && (
                              <Chip tone="limette">
                                <Sparkles className="w-3 h-3" />
                                FREE
                              </Chip>
                            )}
                            {!accessible && (
                              <Chip tone="quiet">
                                <Lock className="w-3 h-3" />
                                Pro
                              </Chip>
                            )}
                          </div>
                          <p className="text-sm text-graphite">{levelInfo.name}</p>
                        </div>
                        <div className="font-data text-[0.8125rem] text-graphite">
                          {podcasts.length} episode{podcasts.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Podcast List */}
                    <div className="p-6">
                      {podcasts.length === 0 ? (
                        <p className="text-graphite text-center py-8">
                          New episodes coming soon!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {podcasts.map((podcast, podcastIndex) => {
                            const row = (
                              <Card
                                interactive
                                className="group flex items-start gap-4 p-4 cursor-pointer"
                                onClick={() => navigate(`/level/${level.toLowerCase()}?tab=podcasts`)}
                              >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-16 h-16 rounded-clay bg-siegel flex items-center justify-center relative overflow-hidden" data-atropos-offset="6">
                                  <Headphones className="w-8 h-8 text-white/80" />
                                  <div className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-ink/20">
                                    <div className="w-8 h-8 rounded-pill bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Play className="w-4 h-4 text-siegel ml-0.5" />
                                    </div>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-ink mb-1 transition-colors group-hover:text-siegel-deep">
                                    {podcast.title_en}
                                  </h3>
                                  {podcast.description_en && (
                                    <p className="text-sm text-graphite line-clamp-2 mb-2">
                                      {podcast.description_en}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 font-data text-[0.8125rem] text-graphite">
                                    {podcast.duration_seconds && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(podcast.duration_seconds)}
                                      </span>
                                    )}
                                    {podcast.difficulty && (
                                      <Chip tone={DIFFICULTY_TONE[podcast.difficulty] || 'quiet'}>
                                        {podcast.difficulty}
                                      </Chip>
                                    )}
                                  </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-siegel transition-transform group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
                              </Card>
                            );
                            // Tilt goes on the ONE featured episode — the very
                            // first row of the first level. The playbook keeps
                            // it off ordinary list rows.
                            return index === 0 && podcastIndex === 0 ? (
                              <Tilt key={podcast.id}>{row}</Tilt>
                            ) : (
                              <div key={podcast.id}>{row}</div>
                            );
                          })}
                        </div>
                      )}

                      {/* View All Link */}
                      {podcasts.length > 0 && (
                        <Link
                          to={`/level/${level.toLowerCase()}?tab=podcasts`}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
                        >
                          View all {level} podcasts
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* SEO Content Section — reference prose, so it stays flat (rule 3). */}
        <Reveal delay={120}>
          <Card className="p-8 sm:p-10 mb-12">
            <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem] mb-6">
              Learn German with Podcasts
            </h2>
            <div className="max-w-none">
              <p className="text-[0.9375rem] leading-relaxed text-graphite mb-4 sm:text-base">
                Our German podcasts are designed specifically for language learners. Each episode features native speakers in natural conversations, graded by CEFR level so the vocabulary stays within reach.
              </p>

              <h3 className="font-display text-xl font-semibold text-ink mt-6 mb-3">Why learn with podcasts?</h3>
              <ul className="space-y-2 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-siegel mt-1">•</span>
                  <span>Improve listening comprehension with native speaker audio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-siegel mt-1">•</span>
                  <span>Learn natural speech patterns and pronunciation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-siegel mt-1">•</span>
                  <span>Study anywhere — while commuting, exercising, or relaxing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-siegel mt-1">•</span>
                  <span>Graded by level, so you understand most of what you hear</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-siegel mt-1">•</span>
                  <span>Vocabulary highlights teach you new words in context</span>
                </li>
              </ul>

              <h3 className="font-display text-xl font-semibold text-ink mt-6 mb-3">Podcasts for every level</h3>
              <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
                Whether you're just starting with German (A1) or working toward fluency (B2), we have 24 episodes across all 8 CEFR levels. Each podcast is labeled with its level so you always know it's right for you.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button to="/level/a1.1?tab=podcasts" size="lg" shimmer>
                Start Listening
                <Play className="w-5 h-5" />
              </Button>
              <Button to="/signup" size="lg" variant="secondary">
                Sign Up Free
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default PodcastsPage;
