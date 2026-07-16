import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, Volume2, PhoneOff, X, AlertCircle, RotateCcw } from 'lucide-react';
import { getConfigForLevel } from '../../constants/speakingPrompts';
import { getAuthHeaders } from '../../utils/supabase';
import { pickAudioMimeType, blobToBase64, micErrorMessage } from './mediaSupport';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Turn-based tap-to-speak session. Started by the caller (speaking-session
// action 'start'); this component only drives the conversation loop:
//   tap → record → speaking-turn (STT → teacher → TTS) → play + transcript
// then "Beenden & Auswerten" (or the timer) → action 'end' → evaluation.
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
  const assistantLabel = isPlacement ? 'Frau Schmidt' : 'Lehrerin';

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
          message: data.error || 'Etwas ist schiefgelaufen.',
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
      setTurnError({ message: 'Netzwerkfehler — bitte erneut versuchen.', stage: 'network', retryable: true });
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-5" />
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Auswertung läuft…</h3>
        <p className="text-sm text-slate-500">Dein Gespräch wird analysiert</p>
      </div>
    );
  }

  const isLowTime = timeRemaining <= 30;
  const title = isPlacement ? 'Einstufungstest' : (mission ? (mission.title_de || mission.title_en) : config.name);

  let statusText = 'Tippen und sprechen';
  if (recordState === 'recording') statusText = 'Aufnahme… tippen zum Senden';
  else if (recordState === 'processing') statusText = 'Denkt nach…';
  else if (isPlaying) statusText = `${assistantLabel} spricht — tippen zum Antworten`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      {/* Header: title + countdown */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold flex-shrink-0">
              {isPlacement ? 'A1–B2' : config.level}
            </span>
            <span className="text-sm font-medium text-slate-600 truncate">{title}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${isLowTime ? 'text-rose-500' : 'text-slate-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isLowTime ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
            {formatTime(timeRemaining)}
          </div>
        </div>
        {isLowTime && (
          <div className="bg-rose-50 text-rose-600 text-xs text-center py-1 font-medium">
            Weniger als 30 Sekunden — gleich ist die Zeit um.
          </div>
        )}
      </div>

      {/* Hint words (missions) */}
      {mission && hintWords.length > 0 && (
        <div className="flex-shrink-0 bg-white/60 border-b border-slate-100 px-4 py-2">
          <div className="max-w-lg mx-auto flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Hilfswörter</span>
            {hintWords.map((w, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-500 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
              }`}>
                <span className={`block text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${msg.role === 'user' ? 'text-teal-100' : 'text-slate-400'}`}>
                  {msg.role === 'user' ? 'Du' : assistantLabel}
                </span>
                {msg.content}
              </div>
            </div>
          ))}
          {recordState === 'processing' && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 text-slate-400">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Notices */}
      <div className="max-w-lg mx-auto w-full px-4">
        {ttsWarning && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 text-center">
            Sprachausgabe momentan nicht verfügbar — lies die Antwort oben.
          </div>
        )}
        {turnError && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{turnError.message}</p>
                {turnError.retryable && lastRecordingRef.current && (
                  <button onClick={retryTurn} className="mt-2 inline-flex items-center gap-1.5 text-rose-700 font-semibold hover:text-rose-800">
                    <RotateCcw className="w-3.5 h-3.5" /> Erneut senden
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-4 py-5 flex flex-col items-center">
          <button
            onClick={handleTapButton}
            disabled={recordState === 'processing'}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg disabled:cursor-not-allowed ${
              recordState === 'recording'
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : recordState === 'processing'
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/30'
            }`}
          >
            {recordState === 'recording' && (
              <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
            )}
            {recordState === 'processing'
              ? <Loader2 className="w-8 h-8 animate-spin" />
              : recordState === 'recording'
                ? <Square className="w-7 h-7" fill="currentColor" />
                : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-xs text-slate-500 mt-3 font-medium h-4 flex items-center gap-1.5">
            {isPlaying && recordState === 'idle' && <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
            {statusText}
          </p>

          <div className="flex items-center gap-4 mt-4">
            {lastReplyAudioRef.current && recordState === 'idle' && (
              <button
                onClick={() => playAudio(lastReplyAudioRef.current)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 py-2"
              >
                <Volume2 className="w-3.5 h-3.5" /> Erneut anhören
              </button>
            )}
            <button
              onClick={endSession}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              <PhoneOff className="w-4 h-4" /> Beenden & Auswerten
            </button>
          </div>

          <button
            onClick={() => { cleanup(); onCancel?.(); }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-500 py-1"
          >
            <X className="w-3 h-3" /> Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingSession;
