// The Pronunciation Lab — plan Task 5 (speaking-guided-city-map).
//
// Entered from the MissionTicket when acoustic evidence exists. It drills at
// most the THREE lowest-scoring words FROM PROVIDER EVIDENCE ONLY —
// selectDrills never fabricates a drill from missing acoustic data
// (tests/pronunciation-lab.test.mjs pins it). Per item: listen (reply audio
// when available, otherwise SpeechSynthesis honestly labelled
// „Computerstimme"), record one attempt, see the provider-backed change, one
// retry — then finish with the whole phrase in context, not an isolated
// score chase. Accents vary between regions and speakers; that is normal and
// this screen says so. It makes no claims about mouth positions it cannot
// observe: only measured audio scores are shown.
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, RotateCcw, Volume2, ArrowRight, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { createPcmRecorder, RecorderError } from './pcmRecorder.js';
import { submitGuidedTurn, SpeakingApiError } from './speakingApi.js';

// The selection logic is pure and lives beside this file so node tests can
// import it without JSX; re-exported here for the component API.
import { selectDrills, accuracyForWord } from './pronunciationDrills.js';

export { selectDrills, accuracyForWord };

export default function PronunciationLab({
  pronunciation, phrase, sessionToken, taskStateToken, onTaskState, onUsage, onClose,
}) {
  const drills = selectDrills(pronunciation, phrase);
  // Drill items first, then the whole phrase in context as the finish.
  const steps = [...drills.map((d) => ({ kind: 'word', drill: d })), { kind: 'phrase' }];

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | recording | sending | result
  const [attemptsUsed, setAttemptsUsed] = useState(0); // per step: 1 attempt + 1 retry
  const [result, setResult] = useState(null); // fresh pronunciation for this step
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const recorderRef = useRef(null);
  const stateTokenRef = useRef(taskStateToken);

  useEffect(() => () => {
    try { recorderRef.current?.dispose(); } catch { /* already gone */ }
    try { window.speechSynthesis?.cancel(); } catch { /* not supported */ }
  }, []);

  const step = steps[stepIndex];
  const done = !step;
  const referenceText = step?.kind === 'word' ? step.drill.phrase || step.drill.word : phrase;

  // Listen: honest about the voice — the browser's synthesis is labelled
  // „Computerstimme"; we do not pretend it is a recorded native speaker.
  const listen = () => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(referenceText);
      u.lang = 'de-DE';
      u.rate = 0.85;
      u.onend = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
    } catch { setSpeaking(false); }
  };
  const synthAvailable = typeof window !== 'undefined' && !!window.speechSynthesis;

  const startRecording = async () => {
    setError(null);
    const recorder = createPcmRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start();
      setPhase('recording');
    } catch (err) {
      recorderRef.current = null;
      setError(err instanceof RecorderError && err.code === 'MICROPHONE_DENIED'
        ? 'Microphone access was denied — allow it in your browser settings and try again.'
        : 'Recording could not start.');
    }
  };

  const stopAndSend = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    setPhase('sending');
    try {
      const { base64, seconds } = await recorder.stop();
      onUsage?.(Math.max(1, Math.round(seconds)));
      const { feedback, taskStateToken: nextToken } = await submitGuidedTurn({
        sessionToken,
        audioBase64: base64,
        mimeType: 'audio/wav',
        history: [],
        taskStateToken: stateTokenRef.current,
        referenceText,
      });
      if (nextToken) { stateTokenRef.current = nextToken; onTaskState?.(nextToken); }
      setResult(feedback.pronunciation); // null = honestly unavailable
      setAttemptsUsed((n) => n + 1);
      setPhase('result');
    } catch (err) {
      setError(err instanceof RecorderError && err.code === 'EMPTY_RECORDING'
        ? 'Nothing was recorded — start, speak, then stop.'
        : err instanceof SpeakingApiError
          ? 'The check could not run — the measured score stays honest rather than guessed. Try again.'
          : 'Something went wrong — try again.');
      setPhase('idle');
    }
  };

  const nextStep = () => {
    setStepIndex((i) => i + 1);
    setAttemptsUsed(0);
    setResult(null);
    setError(null);
    setPhase('idle');
  };

  if (drills.length === 0) {
    // No provider evidence, no lab — never a fabricated drill.
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 md:pb-10">
        <h2 className="mt-4 font-display text-2xl font-semibold text-[var(--city-mist)]">Pronunciation Lab</h2>
        <p className="mt-3 text-sm text-[var(--city-mist-dim)]">
          No acoustic evidence is available for this mission, so there is nothing honest to
          drill. Practice a sentence during a mission to get a measured pronunciation check.
        </p>
        <Button variant="secondary" onClick={onClose} className="mt-5">Back to your ticket</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 md:pb-10">
      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-[var(--city-mist)]">Pronunciation Lab</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-clay px-2 py-1.5 text-sm text-[var(--city-mist-dim)] hover:text-[var(--city-mist)]"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Close the lab
        </button>
      </div>

      {done ? (
        <div className="mt-5 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
          <h3 className="text-base font-bold text-[var(--city-mist)]">That&rsquo;s the lab done.</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--city-mist-dim)]">
            Accents vary between regions and speakers — a German accent from Hamburg, Vienna or
            your own country are all real German. The goal is being understood, not sounding
            like a recording.
          </p>
          <Button onClick={onClose} className="mt-4">
            Back to your ticket <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-1 font-data text-[0.75rem] text-[var(--city-mist-faint)]">
            Step {stepIndex + 1} of {steps.length}
          </p>

          <section aria-labelledby="lab-target" className="mt-4 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
            <h3 id="lab-target" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
              {step.kind === 'word' ? 'Focus word' : 'The whole phrase, in context'}
            </h3>
            {step.kind === 'word' ? (
              <>
                <p className="mt-2 text-xl font-bold text-[var(--city-mist)]">{step.drill.word}</p>
                <p className="mt-1 text-sm text-[var(--city-mist-dim)]">
                  Measured at {step.drill.accuracy}/100 in: “{step.drill.phrase}”
                  {step.drill.weakestPhoneme ? ` — the “${step.drill.weakestPhoneme.phoneme}” sound scored lowest.` : ''}
                </p>
                <p className="mt-1 text-sm text-[var(--city-mist-dim)]">Say the whole sentence again, giving this word a little extra care.</p>
              </>
            ) : (
              <p className="mt-2 text-[1.0625rem] font-semibold text-[var(--city-mist)]">“{phrase}”</p>
            )}
            <button
              type="button"
              onClick={listen}
              disabled={!synthAvailable || speaking}
              aria-label={`Listen to “${referenceText}” (Computerstimme)`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-clay border border-[var(--city-hairline-strong)] px-2.5 py-1.5 text-[0.8125rem] font-bold text-[var(--city-mist)] hover:border-[var(--city-line)] disabled:opacity-50"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" /> Listen (Computerstimme)
            </button>
          </section>

          {error && <p role="alert" className="mt-3 rounded-clay border border-[var(--city-hairline-strong)] bg-white/5 p-3 text-sm text-[var(--city-mist)]">{error}</p>}

          {phase === 'result' ? (
            <section aria-labelledby="lab-result" className="mt-3 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4">
              <h3 id="lab-result" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">Measured change</h3>
              {result ? (
                step.kind === 'word' ? (
                  (() => {
                    const now = accuracyForWord(result, step.drill.word);
                    return now == null ? (
                      <p className="mt-2 text-sm text-[var(--city-mist-dim)]">
                        The word wasn&rsquo;t clearly detected this time — that happens. Overall accuracy of the attempt: {result.accuracy}/100.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--city-mist)]">
                        <span className="font-bold">{step.drill.word}</span>: {step.drill.accuracy}/100 before → <span className="font-bold">{now}/100</span> now (measured from your audio).
                      </p>
                    );
                  })()
                ) : (
                  <p className="mt-2 text-sm text-[var(--city-mist)]">
                    Whole phrase — accuracy {result.accuracy}/100, fluency {result.fluency}/100, completeness {result.completeness}/100.
                  </p>
                )
              ) : (
                <p className="mt-2 text-sm text-[var(--city-mist-dim)]">
                  Aussprache-Analyse nicht verfügbar for this attempt — no score is shown rather than a guessed one.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {attemptsUsed < 2 && (
                  <Button variant="secondary" size="sm" onClick={() => { setPhase('idle'); setError(null); }}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> One more try
                  </Button>
                )}
                <Button size="sm" onClick={nextStep}>
                  {stepIndex + 1 < steps.length ? 'Next' : 'Finish'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          ) : (
            <div className="mt-4 text-center">
              {phase === 'sending' ? (
                <div className="flex items-center justify-center gap-2 rounded-clay border border-[var(--city-hairline)] bg-white/5 p-5 text-sm text-[var(--city-mist)]" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Measuring…
                </div>
              ) : phase === 'recording' ? (
                <button
                  type="button"
                  onClick={stopAndSend}
                  aria-label="Stop recording and check"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-clay border-2 border-[var(--city-lime)] bg-[var(--city-lime)] px-6 py-3.5 text-base font-bold text-[var(--city-night)]"
                >
                  <Square className="h-5 w-5" aria-hidden="true" /> Stop &amp; check
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  aria-label="Start recording your attempt"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-clay border-2 border-[var(--city-cobalt)] bg-[var(--city-cobalt)] px-6 py-3.5 text-base font-bold text-white hover:brightness-110"
                >
                  <Mic className="h-5 w-5" aria-hidden="true" /> {attemptsUsed > 0 ? 'Record your retry' : 'Record your attempt'}
                </button>
              )}
              <p className="mt-2 font-data text-[0.75rem] text-[var(--city-mist-faint)]">
                One attempt and one retry per step — this is practice, not a test.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
