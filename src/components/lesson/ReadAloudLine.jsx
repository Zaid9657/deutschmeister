import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Mic, Play, RotateCcw, Square, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { playLine } from '../../lib/lesson/speech.js';
import { alignTranscript } from '../../lib/lesson/readaloud.js';
import { getAuthHeaders } from '../../utils/supabase';
import {
  blobToBase64,
  checkSpeakingSupport,
  micErrorMessage,
  pickAudioMimeType,
} from '../speaking/mediaSupport.js';

// One read-aloud line, scored (plan P3).
//
// The learner hears the model, records up to eight seconds, and gets the SAME
// sentence back with every word marked heard or not heard. The percentage is
// labelled *Verständlichkeit* — word recognition — and never "Aussprache":
// the speech-to-text engine is evidence that a listener would have understood
// the word, not that the vowel was right, and claiming otherwise would be a
// score we cannot defend.
//
// Everything degrades to the honest self-confirm this screen had before:
// no microphone, signed out, over the daily cap, or a server that is not
// answering — each says WHY in one line and hands back "Ich habe es gesagt".

const MAX_ATTEMPTS = 3;
const MAX_RECORD_MS = 8000;

const FALLBACK_REASONS = {
  no_mic: 'Ihr Browser gibt kein Mikrofon frei — bestätigen Sie die Zeile selbst.',
  signed_out: 'Zum Bewerten müssen Sie angemeldet sein — bestätigen Sie die Zeile so lange selbst.',
  limit: 'Sie haben heute alle bewerteten Aufnahmen genutzt — bestätigen Sie die Zeile selbst.',
  server: 'Die Bewertung antwortet gerade nicht — bestätigen Sie die Zeile selbst.',
};

export default function ReadAloudLine({ lektionId, lineKey, text, speaker, onResult }) {
  const { user } = useAuth();
  const [support] = useState(() => checkSpeakingSupport());
  const [phase, setPhase] = useState('idle'); // idle | recording | scoring | scored
  const [result, setResult] = useState(null); // { words, pct }
  const [attempts, setAttempts] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState(null);
  const [micError, setMicError] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const releaseMic = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (recorderRef.current) {
      try {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;
        if (recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      } catch { /* noop */ }
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => releaseMic, [releaseMic]);

  const micUnavailable = !support.supported;
  const signedOut = !user;
  const reason = fallbackReason || (micUnavailable ? 'no_mic' : signedOut ? 'signed_out' : null);
  const scoringPossible = !reason;

  const score = useCallback(async (audioBase64, mimeType) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/.netlify/functions/score-readaloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ audioBase64, mimeType, expected: text, lektionId, lineKey }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) { setFallbackReason('limit'); setPhase('idle'); return; }
      if (res.status === 401) { setFallbackReason('signed_out'); setPhase('idle'); return; }
      if (!res.ok) { setFallbackReason('server'); setPhase('idle'); return; }

      // The server is the score of record; aligning locally is only the
      // safety net for a response that arrived without the word list.
      const words = Array.isArray(data.words) && data.words.length
        ? data.words
        : alignTranscript(text, data.transcript || '').words;
      const pct = typeof data.pct === 'number' ? data.pct : alignTranscript(text, data.transcript || '').pct;

      const nextAttempts = attempts + 1;
      setResult({ words, pct });
      setAttempts(nextAttempts);
      setPhase('scored');
      onResultRef.current?.({ pct, attempts: nextAttempts, usedMic: true });
    } catch (err) {
      console.error('[ReadAloudLine] scoring failed:', err);
      setFallbackReason('server');
      setPhase('idle');
    }
  }, [attempts, lektionId, lineKey, text]);

  const handleStopped = useCallback(async () => {
    const mimeType = recorderRef.current?.mimeType || pickAudioMimeType() || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    releaseMic();
    if (!blob.size) { setPhase('idle'); return; }
    setPhase('scoring');
    const audioBase64 = await blobToBase64(blob);
    score(audioBase64, mimeType);
  }, [releaseMic, score]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
  }, []);

  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = handleStopped;
      recorder.start();
      setPhase('recording');
      timerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (err) {
      console.error('[ReadAloudLine] mic error:', err);
      setMicError(micErrorMessage(err));
      releaseMic();
      setPhase('idle');
    }
  }, [handleStopped, releaseMic, stopRecording]);

  const selfConfirm = () => {
    setConfirmed(true);
    onResultRef.current?.({ pct: null, attempts, usedMic: false });
  };

  const canRetry = phase === 'scored' && attempts < MAX_ATTEMPTS;
  const pctLabel = result ? Math.round(result.pct * 100) : 0;

  return (
    <Card className="p-4">
      {speaker && (
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{speaker}</p>
      )}

      {/* Before an attempt the plain line; afterwards the same line, word by word. */}
      {result ? (
        <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">
          {result.words.map((w, i) => (
            <span
              key={`${w.word}-${i}`}
              className={`mr-1.5 inline-flex items-baseline gap-1 ${w.hit ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}
            >
              {w.hit
                ? <Check className="h-3.5 w-3.5 self-center" aria-hidden="true" />
                : <X className="h-3.5 w-3.5 self-center" aria-hidden="true" />}
              <span className={w.hit ? '' : 'font-bold underline decoration-dotted'}>{w.word}</span>
              <span className="sr-only">{w.hit ? ' (erkannt)' : ' (nicht erkannt)'}</span>
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">{text}</p>
      )}

      {result && (
        <p className="mt-2 text-sm font-bold text-ink">
          Verständlichkeit: {pctLabel} %
          <span className="ml-2 font-normal text-graphite">
            {result.words.filter((w) => w.hit).length} von {result.words.length} Wörtern erkannt
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => playLine(lektionId, lineKey, text, { rate: 0.85 })}
          className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-ink hover:border-siegel"
        >
          <Play className="h-4 w-4" aria-hidden="true" /> Vorsprechen
        </button>

        {scoringPossible && phase === 'idle' && attempts === 0 && (
          <Button size="sm" onClick={startRecording}>
            <Mic className="h-4 w-4" aria-hidden="true" /> Aufnehmen
          </Button>
        )}
        {scoringPossible && phase === 'recording' && (
          <Button size="sm" variant="celebrate" onClick={stopRecording}>
            <Square className="h-4 w-4" aria-hidden="true" /> Aufnahme stoppen
          </Button>
        )}
        {scoringPossible && phase === 'scoring' && (
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-bold text-graphite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Wird ausgewertet …
          </span>
        )}
        {canRetry && (
          <Button size="sm" variant="secondary" onClick={startRecording}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nochmal ({MAX_ATTEMPTS - attempts} übrig)
          </Button>
        )}

        {(!scoringPossible || (phase === 'scored' && !canRetry)) && !confirmed && (
          <button
            type="button"
            onClick={selfConfirm}
            className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-graphite hover:border-siegel hover:text-siegel-deep"
          >
            <Check className="h-4 w-4" aria-hidden="true" /> Ich habe es gesagt
          </button>
        )}
        {confirmed && (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-siegel px-3 py-1.5 text-[0.8125rem] font-bold text-white">
            <Check className="h-4 w-4" aria-hidden="true" /> Gesagt
          </span>
        )}
      </div>

      {phase === 'recording' && (
        <p className="mt-2 text-xs text-graphite">Sprechen Sie den Satz — die Aufnahme stoppt nach {MAX_RECORD_MS / 1000} Sekunden von selbst.</p>
      )}
      {reason && <p className="mt-2 text-xs text-graphite">{FALLBACK_REASONS[reason]}</p>}
      {micError && <p className="mt-2 text-xs text-accent-himbeer-ink">{micError}</p>}
    </Card>
  );
}
