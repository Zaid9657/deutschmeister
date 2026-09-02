import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatDuration } from '../../utils/listeningHelpers';
import Card from '../ui/Card.jsx';

// The listening transport. Playful Depth (docs/design/playbook.md): the panel
// itself is flat reference furniture, the two controls on it are raised and
// physically depress, and the equalizer bars run in siegel only while audio is
// actually playing — paused is seven calm, static dots, so motion always means
// "sound is coming out of this".
const MAX_PLAYS = 3;
const BARS = [1, 2, 3, 4, 5, 6, 7];

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
  const playDisabled = disabled || (!isPlaying && !canPlay);
  const restartDisabled = disabled || !canPlay;

  return (
    <Card className="p-4">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={playDisabled}
          className={`w-14 h-14 rounded-pill flex items-center justify-center flex-shrink-0 select-none transition-all duration-100 ease-snap ${
            playDisabled
              ? 'bg-paper-sunk text-graphite cursor-not-allowed'
              : 'bg-siegel text-white shadow-raise-siegel hover:bg-siegel-lift active:translate-y-1 active:shadow-none'
          }`}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>

        {/* Level meter: animated only while audio is running */}
        {isPlaying ? (
          <div className="equalizer hidden sm:flex h-8 items-end gap-[3px] flex-shrink-0" aria-hidden="true">
            {BARS.map((bar) => <span key={bar} />)}
          </div>
        ) : (
          <div className="hidden sm:flex h-8 items-center gap-[3px] flex-shrink-0" aria-hidden="true">
            {BARS.map((bar) => (
              <span key={bar} className="block h-[5px] w-[5px] rounded-pill bg-rule" />
            ))}
          </div>
        )}

        {/* Progress area */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            className="w-full h-2 bg-paper-sunk rounded-pill cursor-pointer mb-1.5 overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-2 bg-siegel rounded-pill transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Time & play count */}
          <div className="flex justify-between font-data text-[0.6875rem] text-graphite">
            <span>
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
            <span className={!canPlay ? 'font-bold text-accent-himbeer-ink' : ''}>
              {playCount}/{MAX_PLAYS} plays
            </span>
          </div>
        </div>

        {/* Restart button */}
        <button
          type="button"
          onClick={restart}
          disabled={restartDisabled}
          className={`w-10 h-10 rounded-clay border flex items-center justify-center flex-shrink-0 select-none transition-all duration-100 ease-snap ${
            restartDisabled
              ? 'border-rule bg-paper-sunk text-graphite cursor-not-allowed'
              : 'border-rule bg-white text-graphite shadow-raise hover:border-siegel hover:text-siegel-deep active:translate-y-1 active:shadow-none'
          }`}
          title="Restart audio"
          aria-label="Restart audio"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </Card>
  );
};

export default AudioPlayer;
