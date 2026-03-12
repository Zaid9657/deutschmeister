import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useTranslation } from 'react-i18next';
import { Play, Headphones, Clock, X, Radio } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {isGerman ? 'Neue Podcasts kommen bald!' : 'New podcasts coming soon!'}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            {isGerman
              ? 'Wir arbeiten an neuen Video-Lektionen für dieses Niveau. Schau bald wieder vorbei!'
              : "We're working on new video lessons for this level. Check back soon!"}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            {isGerman ? 'In Arbeit' : 'In progress'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player Modal */}
      {selectedPodcast && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="text-sm text-gray-500">{selectedPodcast.sub_level}</p>
                <h3 className="text-lg font-bold text-gray-800">
                  {isGerman ? (selectedPodcast.title_de || selectedPodcast.title_en) : selectedPodcast.title_en}
                </h3>
              </div>
              <button
                onClick={closePodcast}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close podcast player"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black">
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
              <div className="p-4 border-t bg-gray-50">
                <p className="text-gray-600">
                  {isGerman ? (selectedPodcast.description_de || selectedPodcast.description_en) : selectedPodcast.description_en}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podcast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {podcasts.map((podcast) => (
          <div
            key={podcast.id}
            onClick={() => selectPodcast(podcast)}
            className="p-4 rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-lg group"
          >
            {/* Thumbnail / Icon */}
            <div className="w-full h-32 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mb-4 relative overflow-hidden">
              <Headphones className="w-12 h-12 text-white/80" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-7 h-7 text-orange-500 ml-1" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-800 mb-1">
              {isGerman ? (podcast.title_de || podcast.title_en) : podcast.title_en}
            </h3>

            {/* Description */}
            {podcast.description_en && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {isGerman ? (podcast.description_de || podcast.description_en) : podcast.description_en}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {podcast.duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatTime(podcast.duration_seconds)}
                </span>
              )}
              {podcast.difficulty && (
                <span className={`px-2 py-0.5 rounded-full capitalize
                  ${podcast.difficulty === 'easy' ? 'bg-green-100 text-green-700' : ''}
                  ${podcast.difficulty === 'normal' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${podcast.difficulty === 'challenging' ? 'bg-red-100 text-red-700' : ''}`}>
                  {podcast.difficulty}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastsTab;
