import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useTranslation } from 'react-i18next';
import { Play, Headphones, Clock, X, Radio, Youtube } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';

const PodcastsTab = ({ subLevel }) => {
  const { i18n } = useTranslation();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const isGerman = i18n.language === 'de';

  useEffect(() => {
    const fetchPodcasts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('sub_level', subLevel)
        .eq('is_published', true)
        .order('podcast_order');
      if (!error) setPodcasts(data || []);
      setLoading(false);
    };
    fetchPodcasts();
  }, [subLevel]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectPodcast = (podcast) => {
    setSelectedPodcast(podcast);
  };

  const closePodcast = () => {
    setSelectedPodcast(null);
  };

  // Difficulty is a content label, not a case — it takes accent tones only.
  const difficultyTone = (difficulty) =>
    difficulty === 'easy' ? 'limette' : difficulty === 'challenging' ? 'himbeer' : 'aprikose';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-pill h-8 w-8 border-b-2 border-siegel"></div>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card raised className="p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-clay bg-siegel flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-display text-xl font-semibold text-ink mb-2">
            {isGerman ? 'Neue Podcasts kommen bald!' : 'New podcasts coming soon!'}
          </h3>
          <p className="text-sm leading-relaxed text-graphite">
            {isGerman
              ? 'Wir arbeiten an neuen Video-Lektionen für dieses Niveau. Schau bald wieder vorbei!'
              : "We're working on new video lessons for this level. Check back soon!"}
          </p>
          <div className="mt-6">
            <Chip tone="aprikose">
              <span className="w-2 h-2 rounded-pill bg-accent-aprikose animate-pulse" />
              {isGerman ? 'In Arbeit' : 'In progress'}
            </Chip>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player Modal — player chrome sits on siegel, the one
          interactive colour (design-tokens.js rule 2). */}
      {selectedPodcast && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-clay border border-rule shadow-overlay overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-rule">
              <div>
                <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{selectedPodcast.sub_level}</p>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {isGerman ? (selectedPodcast.title_de || selectedPodcast.title_en) : selectedPodcast.title_en}
                </h3>
              </div>
              <button
                onClick={closePodcast}
                className="p-2 text-graphite hover:bg-siegel-wash hover:text-siegel-deep rounded-pill transition-colors"
                aria-label="Close podcast player"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-ink">
              <video
                src={selectedPodcast.audio_url}
                controls
                autoPlay
                className="w-full max-h-[60vh]"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Description */}
            {selectedPodcast.description_en && (
              <div className="p-4 border-t border-rule bg-paper-sunk">
                <p className="text-graphite">
                  {isGerman ? (selectedPodcast.description_de || selectedPodcast.description_en) : selectedPodcast.description_en}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YouTube Channel Link */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Youtube className="w-6 h-6 text-graphite flex-shrink-0" />
        <p className="text-sm text-graphite flex-1">
          {isGerman
            ? 'Unsere Videos sind auch auf YouTube verfügbar!'
            : 'Our videos are also available on YouTube!'}
        </p>
        <a
          href="https://www.youtube.com/@deutschmeister_de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep whitespace-nowrap"
        >
          {isGerman ? 'Kanal ansehen →' : 'Visit channel →'}
        </a>
      </Card>

      {/* Podcast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {podcasts.map((podcast, index) => (
          <Reveal key={podcast.id} delay={Math.min(index, 8) * 80}>
            <Card
              interactive
              onClick={() => selectPodcast(podcast)}
              className="h-full p-4 cursor-pointer group"
            >
              {/* Thumbnail / Icon */}
              <div className="w-full h-32 rounded-clay bg-siegel flex items-center justify-center mb-4 relative overflow-hidden">
                <Headphones className="w-12 h-12 text-white/80" />
                <div className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-ink/20">
                  <div className="w-14 h-14 rounded-pill bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-7 h-7 text-siegel ml-1" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-ink mb-1">
                {isGerman ? (podcast.title_de || podcast.title_en) : podcast.title_en}
              </h3>

              {/* Description */}
              {podcast.description_en && (
                <p className="text-sm text-graphite mb-3 line-clamp-2">
                  {isGerman ? (podcast.description_de || podcast.description_en) : podcast.description_en}
                </p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-3 font-data text-[0.8125rem] text-graphite">
                {podcast.duration_seconds && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatTime(podcast.duration_seconds)}
                  </span>
                )}
                {podcast.difficulty && (
                  <Chip tone={difficultyTone(podcast.difficulty)}>
                    {podcast.difficulty}
                  </Chip>
                )}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default PodcastsTab;
