import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, FileText, Download, Image, X, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';

const STORAGE_BASE = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/';

const VideoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mindmapOpen, setMindmapOpen] = useState(false);

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
    }
    setLoading(false);
  };

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

  const videoUrl = video.audio_url ? `${STORAGE_BASE}${video.audio_url}` : null;
  const slidesUrl = video.slides_url ? `${STORAGE_BASE}${video.slides_url}` : null;
  const mindmapUrl = video.mindmap_url ? `${STORAGE_BASE}${video.mindmap_url}` : null;

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

        {/* Video Player */}
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
              <video
                controls
                className="w-full aspect-video"
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                {isGerman
                  ? 'Dein Browser unterstützt kein Video.'
                  : 'Your browser does not support video.'}
              </video>
            </div>
          </motion.div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mind Map */}
          {mindmapUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Image size={18} className="text-rose-500" />
                  <h3 className="font-semibold text-slate-800">
                    {isGerman ? 'Mindmap' : 'Mind Map'}
                  </h3>
                </div>
              </div>
              <div
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setMindmapOpen(true)}
              >
                <img
                  src={mindmapUrl}
                  alt={`Mind map for ${video.title}`}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-3 border-t border-slate-100">
                <a
                  href={mindmapUrl}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <Download size={16} />
                  {isGerman ? 'Herunterladen' : 'Download'}
                </a>
              </div>
            </motion.div>
          )}

          {/* Slides */}
          {slidesUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-rose-500" />
                  <h3 className="font-semibold text-slate-800">
                    {isGerman ? 'Folien' : 'Slides'}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <div className="aspect-[4/3] bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center mb-3">
                  <iframe
                    src={`${slidesUrl}#toolbar=0`}
                    className="w-full h-full rounded-lg"
                    title="Slides"
                  />
                </div>
              </div>
              <div className="p-3 border-t border-slate-100 flex gap-2">
                <a
                  href={slidesUrl}
                  download
                  className="flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <Download size={16} />
                  {isGerman ? 'PDF herunterladen' : 'Download PDF'}
                </a>
                <a
                  href={slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors"
                >
                  <FileText size={16} />
                  {isGerman ? 'Öffnen' : 'Open'}
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightbox for Mind Map */}
      <AnimatePresence>
        {mindmapOpen && mindmapUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setMindmapOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMindmapOpen(false)}
                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
              <img
                src={mindmapUrl}
                alt={`Mind map for ${video.title}`}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoDetailPage;
