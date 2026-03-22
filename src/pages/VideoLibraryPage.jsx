import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PlayCircle, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';

const STORAGE_BASE = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/';

const VideoLibraryPage = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('video_library')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const levels = ['all', ...new Set(videos.map(v => v.level).filter(Boolean))];
  const filteredVideos = levelFilter === 'all'
    ? videos
    : videos.filter(v => v.level === levelFilter);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <SEO
        title="German Video Library"
        description="Watch free German learning videos with slides and mind maps. Grammar explanations, vocabulary lessons, and more for all CEFR levels."
        path="/video-library"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                {isGerman ? 'Videothek' : 'Video Library'}
              </h1>
              <p className="text-slate-600">
                {isGerman
                  ? 'Lerne Deutsch mit Videos, Folien und Mindmaps'
                  : 'Learn German with videos, slides, and mind maps'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filter */}
        {levels.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-slate-400" />
              <div className="flex flex-wrap gap-2">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setLevelFilter(level)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      levelFilter === level
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {level === 'all' ? (isGerman ? 'Alle' : 'All') : level}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <PlayCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">
              {isGerman ? 'Noch keine Videos verfügbar.' : 'No videos available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={`/video-library/${video.id}`}
                  className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Thumbnail / Preview */}
                  <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    {video.mindmap_url ? (
                      <img
                        src={`${STORAGE_BASE}${video.mindmap_url}`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlayCircle size={48} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <PlayCircle size={28} className="text-rose-500 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {video.title}
                      </h3>
                      {video.level && (
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${getLevelColor(video.level)}`}>
                          {video.level}
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{video.description}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLibraryPage;
