import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, AlertTriangle, Subtitles } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { connectRealtime, RealtimeError } from './realtimeClient.js';
import { fetchRealtimeCredential, finishSpeakingSession, SpeakingApiError } from './speakingApi.js';
import { trackSpeakingConnected, trackSpeakingEnded, trackSpeakingFailed, trackSpeakingFallbackUsed } from '../../lib/funnelTracking.js';

// The live room — plan Task 2 Steps 3+4 (speaking-live-quality).
//
// SETTLEMENT IS THE POINT OF THIS FILE:
//   * before connected — a failure refunds the WHOLE reservation
//     (outcome 'failed'), because the learner never spoke;
//   * after connected — every ending, including a failure, settles the
//     measured elapsed seconds (outcome 'completed'/'cancelled') and the rest
//     flows back;
//   * unload sends a best-effort end beacon, and the reconcile job is the
//     backstop for the case where even that is lost.
// A drop after connection offers the SAME mission as guided practice, so the
// task goal survives the technology failing.
//
// Captions are local to the live session and are never persisted.

const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function LiveConversation({
  sessionToken, missionId, missionTitle, taskPrompt, durationSeconds, onExit, onFallbackToGuided,
}) {
  const [phase, setPhase] = useState('connecting'); // connecting | live | ended | failed
  const [remaining, setRemaining] = useState(durationSeconds);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [captions, setCaptions] = useState([]);
  const [error, setError] = useState(null);

  const connRef = useRef(null);
  const audioRef = useRef(null);
  const startedAtRef = useRef(null);
  const settledRef = useRef(false);
  const streamRef = useRef(null);

  const elapsed = useCallback(
    () => (startedAtRef.current ? Math.min(durationSeconds, Math.round((Date.now() - startedAtRef.current) / 1000)) : 0),
    [durationSeconds],
  );

  /** One settlement per session, whatever path gets here first. */
  const settle = useCallback(async (outcome) => {
    if (settledRef.current) return;
    settledRef.current = true;
    const usedSeconds = outcome === 'failed' ? 0 : elapsed();
    try {
      await finishSpeakingSession({ sessionToken, usedSeconds, outcome });
    } catch { /* reconcile is the backstop */ }
    trackSpeakingEnded({
      mode: 'live',
      durationBucket: `${Math.round(durationSeconds / 60)}m`,
      completion: outcome === 'failed' ? 'abandoned' : 'passed',
    });
  }, [sessionToken, durationSeconds, elapsed]);

  // Connect: credential → WebRTC. A failure BEFORE the connection is up is a
  // full refund; the learner never spoke.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const cred = await fetchRealtimeCredential({ sessionToken, missionId });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        const conn = await connectRealtime({
          clientSecret: cred.clientSecret,
          model: cred.model,
          mediaStream: stream,
          audioElement: audioRef.current,
          onEvent: (event) => {
            if (event.type === 'response.output_audio_transcript.done' && event.transcript) {
              setCaptions((prev) => [...prev.slice(-8), { role: 'coach', text: String(event.transcript) }]);
            }
            if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) {
              setCaptions((prev) => [...prev.slice(-8), { role: 'you', text: String(event.transcript) }]);
            }
          },
          onStateChange: (next) => {
            if (next === 'failed' && !cancelled) {
              // Connected once, then dropped: settle what was spoken and
              // offer the same mission as guided practice.
              setPhase('failed');
              setError('The live connection dropped. Your unused minutes have been returned.');
              settle('cancelled');
            }
          },
        });
        if (cancelled) { conn.close(); return; }
        connRef.current = conn;
        startedAtRef.current = Date.now();
        setPhase('live');
        trackSpeakingConnected({ mode: 'live', durationBucket: `${Math.round(durationSeconds / 60)}m` });
      } catch (err) {
        if (cancelled) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const code = err instanceof RealtimeError || err instanceof SpeakingApiError ? err.code : 'CONNECTION_FAILED';
        const denied = code === 'MICROPHONE_DENIED' || err?.name === 'NotAllowedError';
        setPhase('failed');
        setError(denied
          ? 'No microphone access. Allow it for this site in your browser settings, then try again — nothing was charged.'
          : 'The live connection could not be established. Nothing was charged.');
        trackSpeakingFailed({ mode: 'live', providerStage: 'realtime', errorCode: denied ? 'MICROPHONE_DENIED' : code });
        // Never connected → the whole reservation goes back.
        settle('failed');
      }
    })();
    return () => {
      cancelled = true;
      connRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock runs only while live, and ending it settles the real elapsed time.
  useEffect(() => {
    if (phase !== 'live') return undefined;
    const iv = setInterval(() => {
      setRemaining(Math.max(0, durationSeconds - elapsed()));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, durationSeconds, elapsed]);

  const end = useCallback(async (outcome = 'completed') => {
    connRef.current?.close();
    await settle(outcome);
    setPhase('ended');
  }, [settle]);

  useEffect(() => {
    if (phase === 'live' && remaining === 0) end('completed');
  }, [phase, remaining, end]);

  // A closed tab must not leave a reservation hanging until reconcile.
  useEffect(() => {
    const beacon = () => {
      if (settledRef.current || !startedAtRef.current) return;
      try {
        navigator.sendBeacon?.('/api/speaking/speaking-session', new Blob([JSON.stringify({
          action: 'end', sessionToken, usedSeconds: elapsed(), outcome: 'cancelled', idempotencyKey: `${sessionToken}:end`,
        })], { type: 'application/json' }));
      } catch { /* reconcile is the backstop */ }
    };
    window.addEventListener('pagehide', beacon);
    return () => window.removeEventListener('pagehide', beacon);
  }, [sessionToken, elapsed]);

  return (
    <div className="speaking-city min-h-screen bg-paper px-4 pb-24 pt-20 text-ink">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-3">
          <Chip tone="label">{missionTitle || 'Live conversation'}</Chip>
          <span className="font-data tabular-nums text-sm font-bold text-ink" role="timer" aria-label={`Time remaining ${fmtClock(remaining)}`}>
            {fmtClock(remaining)}
          </span>
        </div>

        {taskPrompt && (
          <Card tone="sunk" className="mt-4 p-4 text-sm leading-relaxed text-ink">{taskPrompt}</Card>
        )}

        {phase === 'connecting' && (
          <Card className="mt-5 p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-siegel motion-reduce:animate-none" aria-hidden="true" />
            <p className="mt-3 text-sm text-graphite" role="status">Connecting… your minutes start only once the coach is on the line.</p>
          </Card>
        )}

        {phase === 'failed' && (
          <Card className="mt-5 p-5">
            <p className="flex items-start gap-2 text-sm text-accent-himbeer-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span role="status">{error}</span>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {onFallbackToGuided && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:flex-1"
                  onClick={() => { trackSpeakingFallbackUsed({ mode: 'live', missionOrder: undefined }); onFallbackToGuided(); }}
                >
                  Continue as guided practice
                </Button>
              )}
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onExit}>Back to the map</Button>
            </div>
          </Card>
        )}

        {phase === 'ended' && (
          <Card className="mt-5 p-5 text-center">
            <p className="font-bold text-ink">Conversation finished.</p>
            <p className="mt-1 text-sm text-graphite">Only the time you spoke was used; the rest is back in your balance.</p>
            <div className="mt-4"><Button variant="primary" size="lg" onClick={onExit} className="w-full">Back to the map</Button></div>
          </Card>
        )}

        {phase === 'live' && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                aria-pressed={muted}
                onClick={() => { const next = !muted; connRef.current?.mute(next); setMuted(next); }}
              >
                {muted ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
                {muted ? 'Unmute my microphone' : 'Mute my microphone'}
              </Button>
              <Button variant="ghost" size="md" aria-pressed={captionsOn} onClick={() => setCaptionsOn((v) => !v)}>
                <Subtitles className="h-4 w-4" aria-hidden="true" />
                {captionsOn ? 'Hide captions' : 'Show captions'}
              </Button>
              <Button variant="secondary" size="md" onClick={() => end('cancelled')}>
                <PhoneOff className="h-4 w-4" aria-hidden="true" /> End conversation
              </Button>
            </div>

            {captionsOn && (
              <Card className="mt-4 max-h-64 overflow-y-auto p-4" aria-live="polite" aria-label="Live captions">
                {captions.length === 0
                  ? <p className="text-sm text-graphite">Captions appear here as you both speak. They are not saved.</p>
                  : captions.map((c, i) => (
                    <p key={i} className="mb-2 text-sm leading-relaxed">
                      <span className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{c.role === 'you' ? 'You' : 'Coach'}</span>
                      <br />
                      <span className="text-ink">{c.text}</span>
                    </p>
                  ))}
              </Card>
            )}
          </>
        )}

        {/* Live coach audio. Captions for it render in the panel above — a
            <track> is impossible for a stream generated turn by turn. */}
        <audio ref={audioRef} autoPlay className="sr-only" />
      </div>
    </div>
  );
}
