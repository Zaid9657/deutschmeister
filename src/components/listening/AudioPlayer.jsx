import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatDuration } from '../../utils/listeningHelpers';

const MAX_PLAYS = 3;

const AudioPlayer = ({ src, onPlayCountChange, disabled = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const canPlay = playCount < MAX_PLAYS;

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(Math.floor(audioRef.current.duration));
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  const togglePlay = () => {
    if (disabled || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!canPlay) return;
      if (!hasStarted || audioRef.current.ended) {
        // Starting a new play-through
        audioRef.current.currentTime = 0;
        const newCount = playCount + 1;
        setPlayCount(newCount);
        onPlayCountChange?.(newCount);
        setHasStarted(true);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const restart = () => {
    if (disabled || !canPlay || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    const newCount = playCount + 1;
    setPlayCount(newCount);
    onPlayCountChange?.(newCount);
    audioRef.current.play();
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          disabled={disabled || (!isPlaying && !canPlay)}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            disabled || (!isPlaying && !canPlay)
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </motion.button>

        {/* Progress area */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            className="w-full h-2 bg-slate-200 rounded-full cursor-pointer mb-1.5"
            onClick={handleSeek}
          >
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Time & play count */}
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
            <span className={!canPlay ? 'text-rose-400 font-medium' : ''}>
              {playCount}/{MAX_PLAYS} plays
            </span>
          </div>
        </div>

        {/* Restart button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={restart}
          disabled={disabled || !canPlay}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            disabled || !canPlay
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Restart audio"
        >
          <RotateCcw size={16} />
        </motion.button>
      </div>
    </div>
  );
};

export default AudioPlayer;
