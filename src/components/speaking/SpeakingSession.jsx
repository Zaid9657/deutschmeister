import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, Volume2, PhoneOff, X, AlertCircle, RotateCcw } from 'lucide-react';
import { getConfigForLevel } from '../../constants/speakingPrompts';
import { getAuthHeaders } from '../../utils/supabase';
import { pickAudioMimeType, blobToBase64, micErrorMessage } from './mediaSupport';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EYEBROW = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em]';
const STATUS_CHIP = 'inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1 font-data text-[0.75rem] text-graphite';
const EQ_BARS = [0, 1, 2, 3, 4, 5, 6];

// Turn-based tap-to-speak session. Started by the caller (speaking-session
// action 'start'); this component only drives the conversation loop:
//   tap → record → speaking-turn (STT → teacher → TTS) → play + transcript
// then "Finish & get feedback" (or the timer) → action 'end' → evaluation.
//
// Shared by the /speaking flow and the placement test (evalMode='placement').
const SpeakingSession = ({
  level,
  mission = null,
  evalMode,              // 'placement' | undefined
  sessionToken,
  plannedMinutes = 5,
  opening,               // { text, audioBase64 }
  onComplete,
  onCancel,
}) => {
  const isPlacement = evalMode === 'placement';
  const config = getConfigForLevel(level);
  const hintWords = Array.isArray(mission?.hint_words) ? mission.hint_words : [];
  const assistantLabel = isPlacement ? 'Frau Schmidt' : 'Teacher';

  const [messages, setMessages] = useState(
    opening?.text ? [{ role: 'assistant', content: opening.text }] : [],
  );
  const [recordState, setRecordState] = useState('idle'); // idle | recording | processing
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(plannedMinutes * 60);
  const [turnError, setTurnError] = useState(null); // { message, stage, retryable }
  const [ttsWarning, setTtsWarning] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef(messages);
  const endingRef = useRef(false);
  const startTimeRef = useRef(0);
  const lastRecordingRef = useRef(null); // { audioBase64, mimeType } for retry
  const lastReplyAudioRef = useRef(opening?.audioBase64 || null);
  const transcriptEndRef = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, recordState]);

  // ---- audio playback ----
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* noop */ }
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback((base64) => {
    if (!base64) return;
    stopAudio();
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      setIsPlaying(true);
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => setIsPlaying(false)); // autoplay blocked — replay button covers it
      }
    } catch {
      setIsPlaying(false);
    }
  }, [stopAudio]);

  // ---- teardown ----
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopAudio();
    if (recorderRef.current) {
      try { recorderRef.current.ondataavailable = null; recorderRef.current.onstop = null; recorderRef.current.stop(); } catch { /* noop */ }
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [stopAudio]);

  // ---- evaluation / end ----
  const endSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopAudio();
    // stop any in-flight recording without sending it
    if (recorderRef.current) {
      try { recorderRef.current.ondataavailable = null; recorderRef.current.onstop = null; recorderRef.current.stop(); } catch { /* noop */ }
      recorderRef.current = null;
    }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }

    const currentMessages = messagesRef.current;
    const userTurns = currentMessages.filter((m) => m.role === 'user').length;
    const duration = startTimeRef.current ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)) : 0;

    // Log the end (best-effort — must not block evaluation).
    try {
      await fetch('/api/speaking/speaking-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ action: 'end', session_token: sessionToken, duration_seconds: duration, user_turns: userTurns, status: 'completed' }),
      });
    } catch (err) { console.warn('[speaking] end log failed:', err?.message); }

    // Nothing said → no evaluation.
    if (userTurns === 0) { onComplete?.(null); return; }

    setEvaluating(true);
    try {
      const res = await fetch('/api/speaking/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          session_token: sessionToken,
          level,
          messages: currentMessages,
          ...(isPlacement ? { mode: 'placement' } : {}),
        }),
      });
      if (res.ok) onComplete?.(await res.json());
      else { console.error('Evaluation failed:', await res.text()); onComplete?.(null); }
    } catch (err) { console.error('Evaluation error:', err); onComplete?.(null); }
    finally { setEvaluating(false); }
  }, [sessionToken, level, isPlacement, onComplete, stopAudio]);

  // ---- timer: countdown from planned_minutes, auto-end at 0 ----
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { endSession(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the opening line once on mount.
  useEffect(() => {
    if (opening?.audioBase64) playAudio(opening.audioBase64);
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- turn: send the recorded audio to speaking-turn ----
  const sendTurn = useCallback(async (audioBase64, mimeType) => {
    setRecordState('processing');
    setTurnError(null);
    setTtsWarning(false);
    try {
      const res = await fetch('/api/speaking/speaking-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ sessionToken, audioBase64, mimeType, history: messagesRef.current }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Session-level problems end the session gracefully.
        if (data.code === 'session_expired' || data.code === 'session_closed') {
          setRecordState('idle');
          endSession();
          return;
        }
        setTurnError({
          message: data.error || 'Something went wrong.',
          stage: data.stage || 'unknown',
          retryable: true,
        });
        setRecordState('idle');
        return;
      }

      const { userTranscript, replyText, replyAudioBase64, warning } = data;
      const next = [...messagesRef.current];
      if (userTranscript) next.push({ role: 'user', content: userTranscript });
      if (replyText) next.push({ role: 'assistant', content: replyText });
      setMessages(next);

      if (warning === 'tts_unavailable' || !replyAudioBase64) {
        setTtsWarning(true);
        lastReplyAudioRef.current = null;
      } else {
        lastReplyAudioRef.current = replyAudioBase64;
        playAudio(replyAudioBase64);
      }
      setRecordState('idle');
    } catch (err) {
      console.error('speaking-turn error:', err);
      setTurnError({ message: 'Network error — please try again.', stage: 'network', retryable: true });
      setRecordState('idle');
    }
  }, [sessionToken, endSession, playAudio]);

  const handleRecordingStopped = useCallback(async () => {
    const mimeType = recorderRef.current?.mimeType || pickAudioMimeType() || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (!blob.size) { setRecordState('idle'); return; }
    const audioBase64 = await blobToBase64(blob);
    lastRecordingRef.current = { audioBase64, mimeType };
    sendTurn(audioBase64, mimeType);
  }, [sendTurn]);

  const startRecording = useCallback(async () => {
    setTurnError(null);
    stopAudio();
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = handleRecordingStopped;
      recorder.start();
      setRecordState('recording');
    } catch (err) {
      console.error('Mic error:', err);
      setTurnError({ message: micErrorMessage(err), stage: 'mic', retryable: false });
      setRecordState('idle');
    }
  }, [handleRecordingStopped, stopAudio]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
  }, []);

  const handleTapButton = () => {
    if (recordState === 'processing' || evaluating) return;
    if (recordState === 'recording') stopRecording();
    else startRecording();
  };

  const retryTurn = () => {
    if (lastRecordingRef.current) {
      sendTurn(lastRecordingRef.current.audioBase64, lastRecordingRef.current.mimeType);
    }
  };

  // ---- evaluating screen ----
  if (evaluating) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-6">
        <Loader2 className="w-10 h-10 text-siegel animate-spin mb-5" />
        <h3 className="font-display text-lg font-semibold text-ink mb-1">Scoring your session…</h3>
        <p className="text-sm text-graphite">We're going through your conversation</p>
      </div>
    );
  }

  const isLowTime = timeRemaining <= 30;
  const isRecording = recordState === 'recording';
  const isProcessing = recordState === 'processing';
  const title = isPlacement ? 'Placement test' : (mission ? (mission.title_de || mission.title_en) : config.name);

  let statusText = 'Tap and speak';
  if (recordState === 'recording') statusText = 'Recording… tap to send';
  else if (recordState === 'processing') statusText = 'Thinking…';
  else if (isPlaying) statusText = `${assistantLabel} is speaking — tap to reply`;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pt-16">
      {/* Header: title + countdown */}
      <div className="flex-shrink-0 border-b border-rule bg-white">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <Chip tone="label" className="flex-shrink-0">
              {isPlacement ? 'A1–B2' : config.level}
            </Chip>
            <span className="text-sm font-medium text-graphite truncate">{title}</span>
          </div>
          <Chip tone={isLowTime ? 'himbeer' : 'quiet'} className="tabular-nums flex-shrink-0">
            <span className={`w-2 h-2 rounded-pill ${isLowTime ? 'bg-accent-himbeer animate-pulse' : 'bg-edge'}`} />
            {formatTime(timeRemaining)}
          </Chip>
        </div>
        {isLowTime && (
          <div className="bg-accent-himbeer-wash text-accent-himbeer-ink text-xs text-center py-1 font-medium">
            Less than 30 seconds left — time is nearly up.
          </div>
        )}
      </div>

      {/* Hint words (missions) */}
      {mission && hintWords.length > 0 && (
        <div className="flex-shrink-0 bg-paper-sunk border-b border-rule px-4 py-2">
          <div className="max-w-lg mx-auto flex items-center gap-2 flex-wrap justify-center">
            <span className={`${EYEBROW} text-graphite`}>Helper words</span>
            {hintWords.map((w, i) => (
              <Chip key={i} tone="label" size="md">{w}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Transcript — flat cards: you on the siegel wash, the coach on white */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card
                tone={msg.role === 'user' ? 'wash' : 'paper'}
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed text-ink ${
                  msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
              >
                <span className={`block ${EYEBROW} mb-0.5 ${msg.role === 'user' ? 'text-siegel-deep' : 'text-graphite'}`}>
                  {msg.role === 'user' ? 'You' : assistantLabel}
                </span>
                {msg.content}
              </Card>
            </div>
          ))}
          {recordState === 'processing' && (
            <div className="flex justify-start">
              <Card className="rounded-bl-md px-4 py-3 text-graphite">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-pill bg-edge animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-pill bg-edge animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-pill bg-edge animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </Card>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Notices */}
      <div className="max-w-lg mx-auto w-full px-4">
        {ttsWarning && (
          <div className="mb-3 p-2.5 rounded-clay border border-accent-aprikose/30 bg-accent-aprikose-wash text-xs text-accent-aprikose-ink text-center">
            Audio isn't available right now — read the reply above.
          </div>
        )}
        {turnError && (
          <div className="mb-3 p-3 rounded-clay border border-accent-himbeer/30 bg-accent-himbeer-wash text-sm text-accent-himbeer-ink">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{turnError.message}</p>
                {turnError.retryable && lastRecordingRef.current && (
                  <button type="button" onClick={retryTurn} className="mt-2 inline-flex items-center gap-1.5 font-bold text-accent-himbeer-ink hover:underline underline-offset-2">
                    <RotateCcw className="w-3.5 h-3.5" /> Send again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0 bg-white border-t border-rule pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-4 py-5 flex flex-col items-center">
          {/* Level meter: live bars while recording, a calm resting row otherwise */}
          <div className="h-8 mb-4 flex items-end justify-center gap-1" aria-hidden="true">
            {isRecording ? (
              <div className="equalizer flex h-full items-end gap-1">
                {EQ_BARS.map((n) => <span key={n} className="block" />)}
              </div>
            ) : (
              EQ_BARS.map((n) => (
                <span key={n} className={`block w-[5px] h-1.5 rounded-pill ${isPlaying ? 'bg-siegel/40' : 'bg-edge'}`} />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleTapButton}
            disabled={recordState === 'processing'}
            className={`relative w-20 h-20 rounded-pill flex items-center justify-center select-none transition-all duration-100 ease-snap disabled:cursor-not-allowed ${
              isProcessing
                ? 'bg-paper-sunk text-graphite border border-rule'
                : `text-white shadow-raise-siegel active:translate-y-1 active:shadow-none ${isRecording ? 'bg-siegel-deep' : 'bg-siegel hover:bg-siegel-lift'}`
            }`}
          >
            {isRecording && (
              <span className="absolute inset-0 rounded-pill bg-siegel/30 animate-ping" />
            )}
            {isProcessing
              ? <Loader2 className="w-8 h-8 animate-spin" />
              : isRecording
                ? <Square className="w-7 h-7" fill="currentColor" />
                : <Mic className="w-8 h-8" />}
          </button>
          <p className="mt-3 h-7 flex items-center">
            <span className={STATUS_CHIP}>
              {isPlaying && recordState === 'idle' && <Volume2 className="w-3.5 h-3.5 text-siegel" />}
              {statusText}
            </span>
          </p>

          <div className="flex items-center gap-3 mt-4">
            {lastReplyAudioRef.current && recordState === 'idle' && (
              <Button variant="ghost" size="sm" onClick={() => playAudio(lastReplyAudioRef.current)}>
                <Volume2 className="w-3.5 h-3.5" /> Play again
              </Button>
            )}
            <Button variant="secondary" onClick={endSession}>
              <PhoneOff className="w-4 h-4" /> Finish &amp; get feedback
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="mt-3" onClick={() => { cleanup(); onCancel?.(); }}>
            <X className="w-3 h-3" /> Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingSession;
