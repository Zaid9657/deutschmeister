import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Headphones, Clock } from 'lucide-react';

const PodcastsTab = ({ subLevel }) => {
  const { i18n } = useTranslation();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [selectedPodcast]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const selectPodcast = (podcast) => {
    if (selectedPodcast?.id === podcast.id) { togglePlay(); return; }
    setSelectedPodcast(podcast);
    setIsPlaying(false);
    setCurrentTime(0);
    setTimeout(() => {
      if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); }
    }, 100);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
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
      <div className="text-center py-12">
        <Headphones className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600">
          {isGerman ? 'Podcasts kommen bald!' : 'Podcasts coming soon!'}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {podcasts.map((podcast) => (
          <div
            key={podcast.id}
            onClick={() => selectPodcast(podcast)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${selectedPodcast?.id === podcast.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mb-3">
              {selectedPodcast?.id === podcast.id && isPlaying
                ? <Pause className="w-6 h-6 text-white" />
                : <Headphones className="w-6 h-6 text-white" />}
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">
              {isGerman ? (podcast.title_de || podcast.title_en) : podcast.title_en}
            </h3>
            {podcast.description_en && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {isGerman ? (podcast.description_de || podcast.description_en) : podcast.description_en}
              </p>
            )}
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

      {selectedPodcast && (
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-6 text-white sticky bottom-4">
          <audio ref={audioRef} src={selectedPodcast.audio_url} preload="metadata" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm">{isGerman ? 'Jetzt läuft' : 'Now Playing'}</p>
              <h3 className="text-xl font-bold">
                {isGerman ? (selectedPodcast.title_de || selectedPodcast.title_en) : selectedPodcast.title_en}
              </h3>
            </div>
            <button onClick={toggleMute} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="h-2 bg-white/20 rounded-full cursor-pointer mb-4" onClick={handleSeek}>
            <div className="h-full bg-white rounded-full" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
          </div>

          <div className="flex justify-between text-sm text-orange-100 mb-4">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => skip(-10)} className="p-3 rounded-full bg-white/10 hover:bg-white/20">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={togglePlay} className="p-4 rounded-full bg-white text-orange-500 hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            <button onClick={() => skip(10)} className="p-3 rounded-full bg-white/10 hover:bg-white/20">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastsTab;
