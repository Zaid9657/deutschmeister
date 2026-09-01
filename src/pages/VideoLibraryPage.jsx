import { useState, useEffect, useRef } from 'react';
import DataState from '../components/DataState';
import { withTimeout } from '../utils/withTimeout';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayCircle, Play, Video } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { generateThumbnail, getCachedThumbnail } from '../utils/videoThumbnail';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Tilt from '../components/ui/Tilt.jsx';

const STORAGE_BASE = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/';

// The main bands, in the order the filter pills render them. This used to be a
// colour map (a fill and an active-pill colour per band) and the placeholder
// thumbnails cycled six gradients — a level is not a grammatical case, and
// colour means case (design-tokens.js rule 1). The band is a chip now and the
// placeholder is one neutral siegel plate.
const LEVEL_BANDS = ['A1', 'A2', 'B1', 'B2'];

// Lazy thumbnail component — generates on intersection
const VideoThumbnail = ({ videoId, audioUrl }) => {
  const [thumbnail, setThumbnail] = useState(() => getCachedThumbnail(videoId));
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (thumbnail || !audioUrl || attempted.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !attempted.current) {
          attempted.current = true;
          observer.disconnect();
          setLoading(true);
          const videoUrl = `${STORAGE_BASE}${audioUrl}`;
          generateThumbnail(videoUrl, videoId).then((result) => {
            if (result) setThumbnail(result);
            setLoading(false);
          });
        }
      },
      { rootMargin: '200px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [videoId, audioUrl, thumbnail]);

  return (
    <div ref={ref} className={`relative aspect-video flex items-center justify-center overflow-hidden ${thumbnail ? 'bg-ink' : 'bg-siegel'}`}>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-pill animate-spin" />
        </div>
      ) : null}

      {/* Play button overlay — always visible */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-14 h-14 rounded-pill flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
          thumbnail ? 'bg-ink/40 group-hover:bg-ink/60' : 'bg-white/40 group-hover:bg-white/70'
        }`}>
          <Play size={24} className="text-white ml-0.5" fill="white" />
        </div>
      </div>
    </div>
  );
};

const VideoLibraryPage = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('video_library')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
      );
      if (fetchError) throw fetchError;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const levelCounts = {};
  videos.forEach(v => {
    if (v.level) {
      const main = v.level.toUpperCase().substring(0, 2);
      levelCounts[main] = (levelCounts[main] || 0) + 1;
    }
  });
  const filterLevels = ['all', ...LEVEL_BANDS.filter(l => levelCounts[l])];

  const filteredVideos = levelFilter === 'all'
    ? videos
    : videos.filter(v => v.level?.toUpperCase().startsWith(levelFilter));

  if (loading || error) {
    return (
      <div className="min-h-screen pt-24">
        <DataState loading={loading} error={error} onRetry={fetchVideos} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
      <SEO
        title="German Video Library"
        description="Watch free German learning videos with downloadable slides. Grammar explanations, vocabulary lessons, and topic summaries for all CEFR levels."
        path="/video-library"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-4 sm:-mx-4 sm:px-4">
          <Aurora />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-clay bg-siegel flex items-center justify-center shrink-0">
                <PlayCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <Reveal
                  as="h1"
                  className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]"
                >
                  {isGerman ? 'Videothek' : 'Video Library'}
                </Reveal>
                <Reveal as="p" delay={60} className="mt-2 text-[0.9375rem] text-graphite">
                  {isGerman
                    ? 'Lerne Deutsch mit Videozusammenfassungen und Folien'
                    : 'Learn German with video summaries and slides'}
                </Reveal>
              </div>
            </div>
            <Reveal as="p" delay={120} className="max-w-2xl text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
              {isGerman
                ? 'Jedes Video fasst ein Grammatik- oder Vokabelthema zusammen. Schau dir das Video an, lade die Folien herunter und lerne in deinem eigenen Tempo.'
                : 'Each video summarizes a grammar or vocabulary topic. Watch the video, download the slides, and learn at your own pace.'}
            </Reveal>
          </div>
        </div>

        {/* Filter Pills — pressable chips */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {filterLevels.map(level => {
              const isActive = levelFilter === level;
              const count = level === 'all' ? videos.length : (levelCounts[level] || 0);

              return (
                <Chip
                  key={level}
                  raised
                  tone={isActive ? 'ink' : 'quiet'}
                  onClick={() => setLevelFilter(level)}
                  aria-pressed={isActive}
                >
                  {level === 'all' ? (isGerman ? 'Alle' : 'All') : level}
                  <span className={isActive ? 'opacity-80' : 'opacity-60'}>
                    ({count})
                  </span>
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <Reveal className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-clay bg-paper-sunk flex items-center justify-center">
              <Video size={36} className="text-graphite/60" />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink mb-2">
              {isGerman ? 'Keine Videos gefunden' : 'No videos found'}
            </h3>
            <p className="text-graphite max-w-sm mx-auto">
              {levelFilter !== 'all'
                ? (isGerman
                  ? `Noch keine Videos für ${levelFilter} verfügbar. Schau dir die anderen Stufen an!`
                  : `No ${levelFilter} videos available yet. Check out other levels!`)
                : (isGerman
                  ? 'Neue Videos werden bald hinzugefügt.'
                  : 'New videos will be added soon.')}
            </p>
            {levelFilter !== 'all' && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setLevelFilter('all')}>
                {isGerman ? 'Alle anzeigen' : 'Show all'}
              </Button>
            )}
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video, index) => {
              const card = (
                <Card
                  interactive
                  as={Link}
                  to={`/video-library/${video.id}`}
                  className="group block h-full overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative">
                    <VideoThumbnail
                      videoId={video.id}
                      audioUrl={video.audio_url}
                    />

                    {/* Level badge — top right */}
                    {video.level && (
                      <Chip tone="ink" className="absolute top-3 right-3 z-10">
                        {video.level}
                      </Chip>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-ink line-clamp-2 mb-2 transition-colors group-hover:text-siegel-deep text-[0.9375rem] leading-snug">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-graphite line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>
                </Card>
              );

              return (
                <Reveal key={video.id} delay={Math.min(index, 8) * 80}>
                  {/* Tilt on the featured (first) card only — the playbook
                      keeps it off ordinary grids. */}
                  {index === 0 ? <Tilt className="h-full">{card}</Tilt> : card}
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLibraryPage;
