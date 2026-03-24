import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';

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

  const getLevelColor = (level) => {
    if (!level) return 'bg-slate-100 text-slate-600';
    const l = level.toUpperCase();
    if (l.startsWith('A1')) return 'bg-emerald-100 text-emerald-700';
    if (l.startsWith('A2')) return 'bg-sky-100 text-sky-700';
    if (l.startsWith('B1')) return 'bg-amber-100 text-amber-700';
    if (l.startsWith('B2')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/video-library')}
            className="text-rose-500 hover:underline"
          >
            {isGerman ? 'Zurück zur Videothek' : 'Back to Video Library'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <SEO
        title={video.title}
        description={video.description || `German learning video: ${video.title}`}
        path={`/video-library/${id}`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/video-library')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          {isGerman ? 'Zurück zur Videothek' : 'Back to Video Library'}
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
              {video.title}
            </h1>
            {video.level && (
              <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${getLevelColor(video.level)}`}>
                {video.level}
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-slate-600 leading-relaxed">{video.description}</p>
          )}
        </motion.div>

        {/* Language Toggle — only if Arabic version exists */}
        {hasArabic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex gap-2 mb-4"
          >
            <button
              onClick={() => switchLang('en')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                lang === 'en'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => switchLang('ar')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                lang === 'ar'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              🇸🇦 العربية
            </button>
          </motion.div>
        )}

        {/* Video Player */}
        {activeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VideoDetailPage;
