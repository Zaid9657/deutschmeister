// Mission preparation — plan Task 4 (speaking-guided-city-map). Everything a
// learner needs BEFORE the microphone opens: the situation, the observable
// outcome (pass criteria in learner words), useful phrases, where the time
// comes from, and a microphone readiness check that never traps — a denied
// microphone gets an explanation and a recovery hint, and every path back
// stays open.
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, ArrowLeft, Play, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { startSpeakingSession, SpeakingApiError } from './speakingApi.js';

// Pass criteria arrive as machine keys ('ordered_item') or short sentences —
// render them as learner words either way, never raw snake_case.
export function humanizeCriterion(criterion) {
  const text = String(criterion || '').replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const START_ERRORS = {
  AUTH_REQUIRED: 'Your session expired — please log in again.',
  INSUFFICIENT_ALLOWANCE: 'Not enough speaking time left — more minutes come with the AI Coach or a top-up (coming soon).',
  PROVIDER_UNAVAILABLE: 'The speaking coach is briefly unavailable. Nothing was charged — please try again.',
  INVALID_RESPONSE: 'The session could not be started — please try again.',
};

export default function MissionPrep({ station, includedAttempt, onStarted, onBack }) {
  const [micState, setMicState] = useState('idle'); // idle | checking | ready | denied | unsupported
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // The readiness probe: request, then immediately release, the microphone.
  // Purely informational — the mission is still reachable either way.
  const checkMicrophone = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicState('unsupported');
      return;
    }
    setMicState('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      if (mountedRef.current) setMicState('ready');
    } catch {
      if (mountedRef.current) setMicState('denied');
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const data = await startSpeakingSession({ level: 'A1.1', missionId: station.id });
      if (!mountedRef.current) return;
      onStarted({
        sessionToken: data.sessionToken,
        reservedSeconds: data.reservedSeconds || 300,
        opening: { text: data.replyText || '', audioBase64: data.replyAudioBase64 || null },
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const code = err instanceof SpeakingApiError ? err.code : 'INVALID_RESPONSE';
      setError(START_ERRORS[code] || START_ERRORS.INVALID_RESPONSE);
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  const criteria = Array.isArray(station.pass_criteria) ? station.pass_criteria : [];
  const hintWords = Array.isArray(station.hint_words) ? station.hint_words : [];

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 md:pb-10">
      <button
        type="button"
        onClick={onBack}
        className="mt-2 inline-flex items-center gap-1.5 rounded-clay px-2 py-1.5 text-sm text-[var(--city-mist-dim)] hover:text-[var(--city-mist)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the map
      </button>

      <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--city-mist)]">
        Station {station.order}: {station.title_en || station.title_de}
      </h2>

      {/* The situation */}
      <section aria-labelledby="prep-situation" className="mt-5 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
        <h3 id="prep-situation" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Your situation</h3>
        <p className="mt-2 text-[1.0625rem] font-semibold leading-snug text-[var(--city-mist)]">{station.scenario_de}</p>
      </section>

      {/* Expected outcome — the pass criteria in learner words */}
      {criteria.length > 0 && (
        <section aria-labelledby="prep-outcome" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
          <h3 id="prep-outcome" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">You succeed when you…</h3>
          <ul className="mt-2 space-y-1.5">
            {criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--city-mist)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 stroke-[var(--city-lime)]" aria-hidden="true" />
                {humanizeCriterion(c)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Useful phrases */}
      {hintWords.length > 0 && (
        <section aria-labelledby="prep-phrases" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
          <h3 id="prep-phrases" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Useful phrases</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hintWords.map((w, i) => (
              <Chip key={i} tone="label" size="md">{w}</Chip>
            ))}
          </div>
        </section>
      )}

      {/* Where the time comes from */}
      <p className="mt-4 text-sm text-[var(--city-mist-dim)]">
        {includedAttempt
          ? 'Your first attempt at this mission is included in your course — it uses no speaking minutes.'
          : 'This mission uses your speaking minutes — up to 5 minutes, and only the time you actually speak counts.'}
      </p>

      {/* Microphone readiness — informational, never a trap */}
      <section aria-labelledby="prep-mic" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
        <h3 id="prep-mic" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Microphone check</h3>
        {micState === 'ready' ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--city-mist)]">
            <Mic className="h-4 w-4 stroke-[var(--city-lime)]" aria-hidden="true" /> Microphone ready — you can start.
          </p>
        ) : micState === 'denied' ? (
          <div className="mt-2 text-sm text-[var(--city-mist)]">
            <p className="flex items-center gap-2">
              <MicOff className="h-4 w-4 text-[var(--city-line)]" aria-hidden="true" /> Microphone access was denied.
            </p>
            <p className="mt-1.5 text-[var(--city-mist-dim)]">
              The mission needs to hear you. Allow the microphone in your browser&rsquo;s site
              settings (the icon next to the address bar), then check again. You can also go
              back to the map — nothing is lost.
            </p>
            <Button variant="secondary" size="sm" onClick={checkMicrophone} className="mt-3">
              Check again
            </Button>
          </div>
        ) : micState === 'unsupported' ? (
          <p className="mt-2 text-sm text-[var(--city-mist-dim)]">
            This browser cannot record audio. Please open the page in Chrome, Edge or Safari.
          </p>
        ) : (
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={checkMicrophone} disabled={micState === 'checking'}>
              {micState === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
              Check microphone
            </Button>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-3.5 text-center text-sm text-[var(--city-mist)]">
          {error}
        </p>
      )}

      <div className="mt-6">
        <Button size="lg" shimmer onClick={handleStart} disabled={starting} className="w-full">
          {starting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
          Start mission
        </Button>
        <p className="mt-2 text-center font-data text-[0.75rem] text-[var(--city-mist-faint)]">
          The coach never interrupts — speak at your own pace.
        </p>
      </div>
    </div>
  );
}
