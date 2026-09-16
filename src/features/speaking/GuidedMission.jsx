// The guided exchange — plan Task 4 (speaking-guided-city-map).
//
// Rules this screen keeps:
//   * recording happens ONLY between an explicit start and stop (tap to
//     toggle; the space bar is a keyboard alternative; every mic control
//     carries a visible text label) — the coach NEVER interrupts;
//   * the learner hears their own recording locally BEFORE sending it;
//   * every coach reply is captioned — the text is always shown, audio is
//     an addition with a replay button, never the only channel;
//   * the browser holds at most the last six turns (12 messages) and sends
//     them with the next request; nothing else remembers the conversation;
//   * the signed taskStateToken is threaded between turns untouched;
//   * on task.passed the MissionTicket takes over; the session is finished
//     through finishSpeakingSession (completed / cancelled, and 'failed' on
//     provider errors so the reserved seconds refund).
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, Send, RotateCcw, Volume2, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { createPcmRecorder, RecorderError } from './pcmRecorder.js';
import { submitGuidedTurn, finishSpeakingSession, SpeakingApiError } from './speakingApi.js';
import MissionTicket from './MissionTicket.jsx';
import PronunciationLab from './PronunciationLab.jsx';
import { humanizeCriterion } from './MissionPrep.jsx';

// Last six turns — the server truncates to the same bound (plan Task 3).
const MAX_HISTORY_MESSAGES = 12;

const TURN_ERRORS = {
  AUTH_REQUIRED: 'Your session expired — please log in again before sending.',
  INSUFFICIENT_ALLOWANCE: 'Your speaking time ran out during this mission.',
  PROVIDER_UNAVAILABLE: 'The coach could not process this turn. Your recording is kept — try sending it again, or end the mission and your reserved time is refunded.',
  INVALID_RESPONSE: 'The reply could not be read safely — please try again.',
};

export default function GuidedMission({ station, session, returnTo, onFinished }) {
  const { sessionToken, opening } = session;

  const [messages, setMessages] = useState(() =>
    opening?.text ? [{ role: 'assistant', content: opening.text }] : []);
  const [coachText, setCoachText] = useState(opening?.text || '');
  const [taskStateToken, setTaskStateToken] = useState(null);
  const [feedback, setFeedback] = useState(null); // latest normalized turn feedback
  const [acoustics, setAcoustics] = useState(null); // latest { pronunciation, phrase } evidence
  const [passedResult, setPassedResult] = useState(null); // { feedback }
  const [labOpen, setLabOpen] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | recording | review | sending
  const [pending, setPending] = useState(null); // { base64, seconds, url }
  const [practiceReference, setPracticeReference] = useState(null);
  const [error, setError] = useState(null);
  const [usedSeconds, setUsedSeconds] = useState(0);
  const [userTurns, setUserTurns] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const recorderRef = useRef(null);
  const replyAudioRef = useRef(null);
  const lastReplyB64Ref = useRef(opening?.audioBase64 || null);
  const pendingUrlRef = useRef(null);
  const finishedRef = useRef(false);
  const toggleRef = useRef(null);

  const stopReplyAudio = () => {
    try { replyAudioRef.current?.pause(); } catch { /* already stopped */ }
    replyAudioRef.current = null;
  };

  const playReply = (base64) => {
    if (!base64) return;
    stopReplyAudio();
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      replyAudioRef.current = audio;
      audio.play().catch(() => { /* autoplay blocked — the caption is on screen */ });
    } catch { /* playback is optional; the text is always shown */ }
  };

  // The opening line plays once; the caption is already on screen.
  useEffect(() => {
    if (opening?.audioBase64) playReply(opening.audioBase64);
    return () => {
      stopReplyAudio();
      try { recorderRef.current?.dispose(); } catch { /* already gone */ }
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discardPending = () => {
    if (pendingUrlRef.current) { URL.revokeObjectURL(pendingUrlRef.current); pendingUrlRef.current = null; }
    setPending(null);
  };

  const startRecording = async () => {
    setError(null);
    discardPending();
    const recorder = createPcmRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start();
      setPhase('recording');
    } catch (err) {
      recorderRef.current = null;
      setError(err instanceof RecorderError && err.code === 'MICROPHONE_DENIED'
        ? 'Microphone access was denied. Allow it in your browser’s site settings, then try again.'
        : 'Recording could not start in this browser. Please use Chrome, Edge or Safari.');
      setPhase('idle');
    }
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    try {
      const { blob, base64, seconds } = await recorder.stop();
      const url = URL.createObjectURL(blob);
      pendingUrlRef.current = url;
      setPending({ base64, seconds, url });
      setPhase('review');
    } catch (err) {
      setError(err instanceof RecorderError && err.code === 'EMPTY_RECORDING'
        ? 'Nothing was recorded — hold the button and speak, then stop.'
        : err instanceof RecorderError && err.code === 'TOO_LONG'
          ? 'That clip was longer than 30 seconds — one thought at a time works best.'
          : 'The recording failed — please try again.');
      setPhase('idle');
    }
  };

  const toggleRecording = () => {
    if (phase === 'recording') stopRecording();
    else if (phase === 'idle') startRecording();
  };
  toggleRef.current = toggleRecording;

  // Space bar as the keyboard alternative for the mic control. Buttons and
  // form fields keep their native space behaviour untouched.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const t = e.target;
      const tag = t?.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'AUDIO' || t?.isContentEditable) return;
      e.preventDefault();
      toggleRef.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const sendTurn = async () => {
    if (!pending || phase === 'sending') return;
    setPhase('sending');
    setError(null);
    const referenceText = practiceReference || undefined;
    try {
      const { feedback: fb, taskStateToken: nextToken, missionResultToken } = await submitGuidedTurn({
        sessionToken,
        audioBase64: pending.base64,
        mimeType: 'audio/wav',
        history: messages,
        taskStateToken,
        referenceText,
      });
      setUsedSeconds((s) => s + Math.max(1, Math.round(pending.seconds)));
      setUserTurns((n) => n + 1);
      if (nextToken) setTaskStateToken(nextToken);
      setFeedback(fb);
      setCoachText(fb.reply.text);
      lastReplyB64Ref.current = fb.reply.audioBase64 || null;
      if (fb.pronunciation && referenceText) {
        setAcoustics({ pronunciation: fb.pronunciation, phrase: referenceText });
      }
      setMessages((prev) => [
        ...prev,
        ...(fb.transcript ? [{ role: 'user', content: fb.transcript }] : []),
        { role: 'assistant', content: fb.reply.text },
      ].slice(-MAX_HISTORY_MESSAGES));
      playReply(fb.reply.audioBase64);
      setPracticeReference(null);
      discardPending();
      setPhase('idle');
      if (fb.task.passed) {
        setPassedResult({ feedback: fb, missionResultToken });
      }
    } catch (err) {
      const code = err instanceof SpeakingApiError ? err.code : 'INVALID_RESPONSE';
      setError(TURN_ERRORS[code] || TURN_ERRORS.INVALID_RESPONSE);
      // The recording is kept so the learner can retry the send.
      setPhase('review');
    }
  };

  const finish = async (outcome) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    try {
      await finishSpeakingSession({ sessionToken, usedSeconds, outcome, userTurns });
    } catch { /* the reconcile job settles abandoned reservations */ }
    onFinished(outcome);
  };

  // ---- passed: the ticket (and the lab it can open) ----
  if (passedResult && labOpen) {
    return (
      <PronunciationLab
        pronunciation={acoustics?.pronunciation || passedResult.feedback.pronunciation}
        phrase={acoustics?.phrase || passedResult.feedback.transcript || ''}
        sessionToken={sessionToken}
        taskStateToken={taskStateToken}
        onTaskState={setTaskStateToken}
        onUsage={(s) => setUsedSeconds((v) => v + s)}
        onClose={() => setLabOpen(false)}
      />
    );
  }
  if (passedResult) {
    return (
      <MissionTicket
        station={station}
        feedback={passedResult.feedback}
        acoustics={acoustics}
        missionResultToken={passedResult.missionResultToken}
        returnTo={returnTo}
        sessionToken={sessionToken}
        finishing={finishing}
        onOpenLab={() => setLabOpen(true)}
        onTryNext={() => finish('completed')}
      />
    );
  }

  // ---- the exchange ----
  const criteria = Array.isArray(station.pass_criteria) ? station.pass_criteria : [];
  const done = feedback?.task.completedCriteria || [];
  const nextGoal = feedback?.task.nextGoal || null;
  const hintWords = Array.isArray(station.hint_words) ? station.hint_words : [];

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 md:pb-10">
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
          Station {station.order} · {station.title_en || station.title_de}
        </p>
        <button
          type="button"
          onClick={() => finish('cancelled')}
          disabled={finishing}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-clay px-2 py-1.5 text-sm text-[var(--city-mist-dim)] hover:text-[var(--city-mist)]"
        >
          <X className="h-4 w-4" aria-hidden="true" /> End mission
        </button>
      </div>

      {/* The coach — caption ALWAYS shown, audio replayable */}
      <section aria-labelledby="coach-says" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
        <h2 id="coach-says" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Your coach says</h2>
        <p aria-live="polite" className="mt-2 text-[1.0625rem] font-semibold leading-snug text-[var(--city-mist)]">{coachText}</p>
        <button
          type="button"
          onClick={() => playReply(lastReplyB64Ref.current)}
          disabled={!lastReplyB64Ref.current}
          aria-label="Replay the coach's audio"
          className="mt-2 inline-flex items-center gap-1.5 rounded-clay px-2 py-1 text-sm text-[var(--city-line)] hover:text-[var(--city-mist)] disabled:opacity-50"
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" /> Replay audio
        </button>
      </section>

      {/* What I said + a better way to say it */}
      {feedback?.transcript && (
        <section aria-labelledby="you-said" className="mt-3 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
          <h2 id="you-said" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">You said</h2>
          <p className="mt-1.5 text-sm text-[var(--city-mist)]">{feedback.transcript}</p>
          {feedback.language.bestVersion && (
            <div className="mt-2 border-t border-[var(--city-hairline)] pt-2">
              <p className="text-sm text-[var(--city-mist)]">
                <span className="font-bold">A better way: </span>{feedback.language.bestVersion}
              </p>
              {feedback.language.tip && <p className="mt-1 text-[0.8125rem] text-[var(--city-mist-dim)]">{feedback.language.tip}</p>}
              {!practiceReference && (
                <button
                  type="button"
                  onClick={() => setPracticeReference(feedback.language.bestVersion)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-clay border border-[var(--city-hairline-strong)] px-2.5 py-1.5 text-[0.8125rem] font-bold text-[var(--city-mist)] hover:border-[var(--city-line)]"
                >
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" /> Practice this sentence (optional)
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Task progress — text, never colour alone */}
      <section aria-labelledby="task-progress" className="mt-3 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
        <h2 id="task-progress" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
          Task progress{criteria.length > 0 ? ` — ${done.length} of ${criteria.length} done` : ''}
        </h2>
        {nextGoal && <p className="mt-1.5 text-sm text-[var(--city-mist)]">Next: {humanizeCriterion(nextGoal)}</p>}
        {practiceReference && (
          <p className="mt-1.5 rounded-clay border-l-4 border-[var(--city-lime)] pl-2.5 text-sm text-[var(--city-mist)]">
            <span className="font-bold">Practice sentence:</span> say “{practiceReference}” — this turn gets an acoustic pronunciation check.
          </p>
        )}
        {hintWords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hintWords.map((w, i) => <Chip key={i} tone="label" size="md">{w}</Chip>)}
          </div>
        )}
      </section>

      {error && (
        <div role="alert" className="mt-3 rounded-clay border border-[var(--city-hairline-strong)] bg-white/5 p-3.5 text-sm text-[var(--city-mist)]">
          <p>{error}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pending && (
              <Button variant="secondary" size="sm" onClick={sendTurn}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try sending again
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => finish('failed')}>
              End mission — refund my reserved time
            </Button>
          </div>
        </div>
      )}

      {/* Mic controls — visible text labels on every control, space bar works too */}
      <div className="mt-5">
        {phase === 'review' && pending ? (
          <div className="rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
            <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Your recording</h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--city-mist-dim)]">Listen before you send — nothing leaves your browser until you do.</p>
            <audio controls src={pending.url} aria-label="Play back your recording" className="mt-2 w-full" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={sendTurn}>
                <Send className="h-4 w-4" aria-hidden="true" /> Send to the coach
              </Button>
              <Button variant="secondary" onClick={() => { discardPending(); setPhase('idle'); }}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Discard &amp; record again
              </Button>
            </div>
          </div>
        ) : phase === 'sending' ? (
          <div className="flex items-center justify-center gap-2 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-5 text-sm text-[var(--city-mist)]" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> The coach is listening…
          </div>
        ) : (
          <div className="text-center">
            <button
              type="button"
              onClick={toggleRecording}
              aria-label={phase === 'recording' ? 'Stop recording' : 'Start recording'}
              aria-pressed={phase === 'recording'}
              className={[
                'inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-clay border-2 px-6 py-4 text-base font-bold transition-colors',
                phase === 'recording'
                  ? 'border-[var(--city-lime)] bg-[var(--city-lime)] text-[var(--city-night)]'
                  : 'border-[var(--city-cobalt)] bg-[var(--city-cobalt)] text-white hover:brightness-110',
              ].join(' ')}
            >
              {phase === 'recording'
                ? <><Square className="h-5 w-5" aria-hidden="true" /> Stop recording</>
                : <><Mic className="h-5 w-5" aria-hidden="true" /> Start recording</>}
            </button>
            <p className="mt-2 font-data text-[0.75rem] text-[var(--city-mist-faint)]">
              Tap to start and stop, or press the space bar. Take your time — the coach never interrupts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
