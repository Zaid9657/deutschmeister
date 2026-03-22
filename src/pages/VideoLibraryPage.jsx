import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PlayCircle, Play, Loader2, Video } from 'lucide-react';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';

const LEVEL_COLORS = {
  A1: { bg: 'bg-emerald-500', text: 'text-white', pill: 'bg-emerald-100 text-emerald-700', pillActive: 'bg-emerald-600 text-white' },
  A2: { bg: 'bg-sky-500', text: 'text-white', pill: 'bg-sky-100 text-sky-700', pillActive: 'bg-sky-600 text-white' },
  B1: { bg: 'bg-amber-500', text: 'text-white', pill: 'bg-amber-100 text-amber-700', pillActive: 'bg-amber-600 text-white' },
  B2: { bg: 'bg-purple-500', text: 'text-white', pill: 'bg-purple-100 text-purple-700', pillActive: 'bg-purple-600 text-white' },
};

const THUMBNAIL_GRADIENTS = [
  'from-rose-400 via-pink-500 to-purple-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-blue-400 via-indigo-500 to-purple-500',
  'from-pink-400 via-rose-500 to-red-500',
  'from-teal-400 via-cyan-500 to-blue-500',
];

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

  // Build level counts
  const levelCounts = {};
  videos.forEach(v => {
    if (v.level) {
      const main = v.level.toUpperCase().substring(0, 2);
      levelCounts[main] = (levelCounts[main] || 0) + 1;
    }
  });
  const filterLevels = ['all', ...Object.keys(LEVEL_COLORS).filter(l => levelCounts[l])];

  const filteredVideos = levelFilter === 'all'
    ? videos
    : videos.filter(v => v.level?.toUpperCase().startsWith(levelFilter));

  const getLevelKey = (level) => {
    if (!level) return null;
    return level.toUpperCase().substring(0, 2);
  };

  const getGradient = (index) => {
    return THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length];
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
        description="Watch free German learning videos with downloadable slides. Grammar explanations, vocabulary lessons, and topic summaries for all CEFR levels."
        path="/video-library"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
                {isGerman ? 'Videothek' : 'Video Library'}
              </h1>
              <p className="text-slate-600">
                {isGerman
                  ? 'Lerne Deutsch mit Videozusammenfassungen und Folien'
                  : 'Learn German with video summaries and slides'}
              </p>
            </div>
          </div>
          <p className="text-slate-500 max-w-2xl leading-relaxed">
            {isGerman
              ? 'Jedes Video fasst ein Grammatik- oder Vokabelthema zusammen. Schau dir das Video an, lade die Folien herunter und lerne in deinem eigenen Tempo.'
              : 'Each video summarizes a grammar or vocabulary topic. Watch the video, download the slides, and learn at your own pace.'}
          </p>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {filterLevels.map(level => {
              const isActive = levelFilter === level;
              const count = level === 'all' ? videos.length : (levelCounts[level] || 0);
              const colors = LEVEL_COLORS[level];

              return (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? level === 'all'
                        ? 'bg-slate-800 text-white shadow-md'
                        : `${colors?.pillActive || 'bg-slate-800 text-white'} shadow-md`
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {level === 'all' ? (isGerman ? 'Alle' : 'All') : level}
                  <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Video size={36} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {isGerman ? 'Keine Videos gefunden' : 'No videos found'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {levelFilter !== 'all'
                ? (isGerman
                  ? `Noch keine Videos für ${levelFilter} verfügbar. Schau dir die anderen Stufen an!`
                  : `No ${levelFilter} videos available yet. Check out other levels!`)
                : (isGerman
                  ? 'Neue Videos werden bald hinzugefügt.'
                  : 'New videos will be added soon.')}
            </p>
            {levelFilter !== 'all' && (
              <button
                onClick={() => setLevelFilter('all')}
                className="mt-4 px-5 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                {isGerman ? 'Alle anzeigen' : 'Show all'}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video, index) => {
              const levelKey = getLevelKey(video.level);
              const levelColors = LEVEL_COLORS[levelKey];

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    to={`/video-library/${video.id}`}
                    className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                  >
                    {/* Thumbnail */}
                    <div className={`relative aspect-video bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}>
                      {/* Play button */}
                      <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center group-hover:bg-white/80 group-hover:scale-110 transition-all duration-300">
                        <Play size={28} className="text-white ml-1" fill="white" />
                      </div>

                      {/* Level badge — top right */}
                      {video.level && levelColors && (
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${levelColors.bg} ${levelColors.text} shadow-sm`}>
                          {video.level}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-rose-600 transition-colors text-[15px] leading-snug">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLibraryPage;
