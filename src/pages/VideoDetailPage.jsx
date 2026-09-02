import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';

const STORAGE_BASE = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/';
const LANG_KEY = 'dm_video_lang';

const VideoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || 'en'; }
    catch { return 'en'; }
  });
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideo();
    // fetchVideo is re-created every render and closes over `id`, which IS the
    // dependency; depending on the function would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVideo = async () => {
    const { data, error: fetchError } = await supabase
      .from('video_library')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single();

    if (fetchError || !data) {
      setError(isGerman ? 'Video nicht gefunden.' : 'Video not found.');
    } else {
      setVideo(data);
      // If user preferred Arabic but this video has no Arabic, fall back to English
      if (!data.audio_url_ar && lang === 'ar') {
        setLang('en');
      }
    }
    setLoading(false);
  };

  const hasArabic = video?.audio_url_ar;
  const activeUrl = lang === 'ar' && hasArabic
    ? `${STORAGE_BASE}${video.audio_url_ar}`
    : video?.audio_url ? `${STORAGE_BASE}${video.audio_url}` : null;

  const switchLang = (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    setVideoLoading(true);
    try { localStorage.setItem(LANG_KEY, newLang); } catch {}
  };

  // Swap video source when language changes
  useEffect(() => {
    if (videoRef.current && activeUrl) {
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.src = activeUrl;
      videoRef.current.load();
      if (wasPlaying) videoRef.current.play().catch(() => {});
    }
  }, [activeUrl]);

  const handleCanPlay = () => setVideoLoading(false);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-graphite" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-graphite mb-4">{error}</p>
          <button
            onClick={() => navigate('/video-library')}
            className="font-bold text-siegel transition-colors hover:text-siegel-deep"
          >
            {isGerman ? 'Zurück zur Videothek' : 'Back to Video Library'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-12">
      <SEO
        title={video.title}
        description={video.description || `German learning video: ${video.title}`}
        path={`/video-library/${id}`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/video-library')}
          className="flex items-center gap-2 text-graphite hover:text-siegel-deep transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          {isGerman ? 'Zurück zur Videothek' : 'Back to Video Library'}
        </button>

        {/* Header — the level rides a neutral chip. It used to pick one of four
            per-band palettes, and colour means grammatical case (tokens rule 1). */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Reveal
              as="h1"
              className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[2.125rem]"
            >
              {video.title}
            </Reveal>
            {video.level && (
              <Chip tone="label" className="flex-shrink-0">{video.level}</Chip>
            )}
          </div>
          {video.description && (
            <Reveal as="p" delay={60} className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
              {video.description}
            </Reveal>
          )}
        </div>

        {/* Language Toggle — only if Arabic version exists. Player chrome sits
            on siegel, the one interactive colour (tokens rule 2). */}
        {hasArabic && (
          <div className="flex gap-2 mb-4">
            <Chip
              size="md"
              raised
              tone={lang === 'en' ? 'ink' : 'quiet'}
              onClick={() => switchLang('en')}
              aria-pressed={lang === 'en'}
              className="px-5 py-2.5"
            >
              🇬🇧 English
            </Chip>
            <Chip
              size="md"
              raised
              tone={lang === 'ar' ? 'ink' : 'quiet'}
              onClick={() => switchLang('ar')}
              aria-pressed={lang === 'ar'}
              className="px-5 py-2.5"
            >
              🇸🇦 العربية
            </Chip>
          </div>
        )}

        {/* Video Player */}
        {activeUrl && (
          <div className="relative bg-ink rounded-clay overflow-hidden border border-rule">
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/60 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            )}
            <video
              ref={videoRef}
              controls
              className="w-full aspect-video"
              preload="metadata"
              key={`${id}-${lang}`}
              onCanPlay={handleCanPlay}
              onLoadedData={handleCanPlay}
            >
              <source src={activeUrl} type="video/mp4" />
              {isGerman
                ? 'Dein Browser unterstützt kein Video.'
                : 'Your browser does not support video.'}
            </video>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetailPage;
