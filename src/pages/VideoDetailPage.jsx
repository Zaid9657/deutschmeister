import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, FileText, Download, Image, X, Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
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
  const [slidesFullscreen, setSlidesFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (mindmapOpen || slidesFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mindmapOpen, slidesFullscreen]);

  // Escape key to close lightboxes
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setMindmapOpen(false);
      setSlidesFullscreen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

  const openMindmap = () => {
    setZoom(1);
    setMindmapOpen(true);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const zoomReset = () => setZoom(1);

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

        {/* Mind Map — Full Width */}
        {mindmapUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image size={18} className="text-rose-500" />
                <h3 className="font-semibold text-slate-800">
                  {isGerman ? 'Mindmap' : 'Mind Map'}
                </h3>
              </div>
              <button
                onClick={openMindmap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <Maximize2 size={14} />
                {isGerman ? 'Vergrößern' : 'Fullscreen'}
              </button>
            </div>
            <div
              className="cursor-pointer hover:opacity-95 transition-opacity"
              onClick={openMindmap}
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

        {/* Slides — Full Width, Taller */}
        {slidesUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-rose-500" />
                <h3 className="font-semibold text-slate-800">
                  {isGerman ? 'Folien' : 'Slides'}
                </h3>
              </div>
              <button
                onClick={() => setSlidesFullscreen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <Maximize2 size={14} />
                {isGerman ? 'Vollbild' : 'Fullscreen'}
              </button>
            </div>
            <div className="p-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={`${slidesUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full"
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

      {/* Mind Map Lightbox */}
      <AnimatePresence>
        {mindmapOpen && mindmapUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
            onClick={() => setMindmapOpen(false)}
          >
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white/70 text-sm font-medium">
                {isGerman ? 'Mindmap' : 'Mind Map'} — {video.title}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={zoomOut}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-white/60 text-sm w-14 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={zoomReset}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw size={18} />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={() => setMindmapOpen(false)}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Image container with zoom */}
            <div
              className="flex-1 overflow-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'pinch-zoom' }}
            >
              <motion.img
                src={mindmapUrl}
                alt={`Mind map for ${video.title}`}
                className="max-w-none select-none"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
                draggable={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slides Fullscreen Lightbox */}
      <AnimatePresence>
        {slidesFullscreen && slidesUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/50">
              <span className="text-white/70 text-sm font-medium">
                {isGerman ? 'Folien' : 'Slides'} — {video.title}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={slidesUrl}
                  download
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </a>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={() => setSlidesFullscreen(false)}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Full viewport PDF */}
            <div className="flex-1">
              <iframe
                src={`${slidesUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full"
                title="Slides fullscreen"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoDetailPage;
