import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '../../utils/listeningHelpers';
import Card from '../ui/Card.jsx';

// The listening transport. Playful Depth (docs/design/playbook.md): the panel
// itself is flat reference furniture, the two controls on it are raised and
// physically depress, and the equalizer bars run in siegel only while audio is
// actually playing — paused is seven calm, static dots, so motion always means
// "sound is coming out of this".
//
// A play counts only once the audio has actually STARTED: a rejected play()
// (missing file, weak connection, blocked autoplay) spends none of the three
// plays, shows no "playing" state and says so — the Modelltest player's rule
// (ModelltestRun.jsx, Codex rescore 2026-10-15). The element's own pause and
// error events keep the playing state honest when the OS or the network stops
// the sound. `review` is the after-submit player: no cap, nothing counted.
const MAX_PLAYS = 3;
const BARS = [1, 2, 3, 4, 5, 6, 7];

const AudioPlayer = ({ src, onPlayCountChange, disabled = false, review = false }) => {
  const audioRef = useRef(null);
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [hasUnfinishedPlay, setHasUnfinishedPlay] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);

  const canPlay = review || playCount < MAX_PLAYS;

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
    setHasUnfinishedPlay(false);
  }, []);

  const handleStopped = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handleStopped);
    audio.addEventListener('error', handleStopped);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handleStopped);
      audio.removeEventListener('error', handleStopped);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleStopped]);

  // Resolves true once sound has started; a rejection spends nothing.
  const startPlayback = async () => {
    try {
      await audioRef.current.play();
    } catch {
      setIsPlaying(false);
      setPlayFailed(true);
      return false;
    }
    setPlayFailed(false);
    setIsPlaying(true);
    return true;
  };

  const countPlay = () => {
    setHasUnfinishedPlay(true);
    if (review) return;
    const newCount = playCount + 1;
    setPlayCount(newCount);
    onPlayCountChange?.(newCount);
  };

  const togglePlay = async () => {
    if (disabled || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    // Starting a new play-through, or resuming the unfinished one (free).
    const newPlay = !hasUnfinishedPlay || audioRef.current.ended;
    if (newPlay) {
      if (!canPlay) return;
      audioRef.current.currentTime = 0;
    }
    if (!(await startPlayback())) return;
    if (newPlay) countPlay();
  };

  const restart = async () => {
    if (disabled || !canPlay || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    if (!(await startPlayback())) return;
    countPlay();
  };

  const handleSeek = (e) => {
    if (!audioRef.current || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const playDisabled = disabled || (!isPlaying && !hasUnfinishedPlay && !canPlay);
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
            {!review && (
              <span className={!canPlay ? 'font-bold text-accent-himbeer-ink' : ''}>
                {playCount}/{MAX_PLAYS} plays
              </span>
            )}
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

      {playFailed && (
        <p role="alert" className="mt-3 text-[0.8125rem] font-bold text-accent-aprikose-ink">
          {isGerman
            ? 'Die Wiedergabe ist nicht gestartet. Bitte erneut versuchen — dieser Versuch zählt nicht.'
            : 'Playback did not start. Please try again — this try does not count.'}
        </p>
      )}
    </Card>
  );
};

export default AudioPlayer;
