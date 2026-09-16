import { useEffect, useRef, useState } from 'react';
import { Mic, Clock, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';

// Live Conversation setup — plan Task 2 Step 3 (speaking-live-quality).
//
// Three fixed durations, a microphone test, the allowance source and the
// maximum charge BEFORE anything is reserved, and a plain statement that raw
// audio is not stored. Nothing here spends: the reservation happens on start,
// server-side, and the clock only begins once the connection is up.

export const LIVE_DURATIONS = [
  { seconds: 300, label: '5 minutes' },
  { seconds: 600, label: '10 minutes' },
  { seconds: 900, label: '15 minutes' },
];

const fmtMinutes = (seconds) => `${Math.floor(Math.max(0, Number(seconds) || 0) / 60)} min`;

export default function LiveSetup({ balance, scenarios = [], onStart, onBack, starting = false, error = null }) {
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? null);
  const [mic, setMic] = useState('unknown'); // unknown | ok | denied | checking
  const streamRef = useRef(null);

  useEffect(() => () => {
    // Never hold the microphone open past this screen.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const checkMic = async () => {
    setMic('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic('ok');
    } catch {
      setMic('denied');
    }
  };

  const total = balance?.totalSeconds ?? 0;
  const affordable = total >= durationSeconds;
  // Monthly seconds are spent before permanent ones (the ledger's own order),
  // so the source line can say honestly which balance this will draw from.
  const source = (balance?.monthlySeconds ?? 0) >= durationSeconds
    ? 'your monthly allowance'
    : (balance?.monthlySeconds ?? 0) > 0
      ? 'your monthly allowance, then your permanent minutes'
      : 'your permanent minutes';

  return (
    <div className="speaking-city min-h-screen bg-paper px-4 pb-24 pt-20 text-ink">
      <div className="mx-auto max-w-lg">
        <Chip tone="label"><Mic className="h-3 w-3" aria-hidden="true" /> Live conversation</Chip>
        <h1 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight">Talk in real time</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
          A natural back-and-forth: you speak, the coach answers straight away. Pick how long
          you want to talk — you are only charged for the time you actually use.
        </p>

        <fieldset className="mt-6">
          <legend className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Length</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LIVE_DURATIONS.map((d) => {
              const selected = d.seconds === durationSeconds;
              return (
                <button
                  key={d.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(d.seconds)}
                  aria-pressed={selected}
                  className={`rounded-clay border px-3 py-3 text-sm font-bold transition-all duration-100 ease-snap motion-reduce:transition-none ${
                    selected ? 'border-siegel bg-siegel-wash text-siegel-deep ring-2 ring-siegel' : 'border-rule bg-white text-graphite hover:border-siegel'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {scenarios.length > 0 && (
          <fieldset className="mt-5">
            <legend className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Scenario</legend>
            <div className="mt-2 grid gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenarioId(s.id)}
                  aria-pressed={s.id === scenarioId}
                  className={`rounded-clay border px-4 py-3 text-left text-sm transition-all duration-100 ease-snap motion-reduce:transition-none ${
                    s.id === scenarioId ? 'border-siegel bg-siegel-wash text-ink ring-2 ring-siegel' : 'border-rule bg-white text-graphite hover:border-siegel'
                  }`}
                >
                  <span className="font-bold text-ink">{s.title_de || s.title_en}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <Card tone="sunk" className="mt-5 p-4 text-sm text-graphite">
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
            <span>
              At most <strong className="text-ink">{fmtMinutes(durationSeconds)}</strong> will be
              held from {source}; whatever you do not use comes straight back.
              You have {fmtMinutes(total)} left.
            </span>
          </p>
          <p className="mt-3 flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
            <span>Your audio is processed live and not stored. No recording is kept.</span>
          </p>
        </Card>

        <div className="mt-5">
          <Button variant="secondary" size="md" onClick={checkMic} disabled={mic === 'checking'}>
            {mic === 'checking' ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
            Test my microphone
          </Button>
          <p className="mt-2 text-sm" role="status">
            {mic === 'ok' && <span className="font-bold text-siegel-deep">Microphone works.</span>}
            {mic === 'denied' && (
              <span className="text-accent-himbeer-ink">
                No microphone access. Allow it for this site in your browser settings (the padlock
                next to the address), then test again. You can still practise in guided mode.
              </span>
            )}
            {mic === 'unknown' && <span className="text-graphite">Optional, but it saves a surprise once the clock is running.</span>}
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-clay border border-accent-himbeer/30 bg-accent-himbeer-wash p-3.5 text-sm text-accent-himbeer-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!affordable && (
          <Card tone="wash" className="mt-5 p-3.5 text-center text-sm text-siegel-deep">
            Not enough speaking time for {fmtMinutes(durationSeconds)} — choose a shorter session,
            or add minutes with the AI Coach or a top-up.
          </Card>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            shimmer
            disabled={!affordable || starting}
            onClick={() => onStart({ durationSeconds, scenarioId })}
            className="w-full sm:flex-1"
          >
            {starting ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
            Start the conversation
          </Button>
          <Button variant="ghost" size="lg" onClick={onBack} className="w-full sm:w-auto">Back</Button>
        </div>
      </div>
    </div>
  );
}
