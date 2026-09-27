import { useEffect, useState } from 'react';
import { Loader2, PenTool, Timer } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { useAuth } from '../../contexts/AuthContext';
import ResultCard from './ResultCard.jsx';
import SpeakingRun from './SpeakingRun.jsx';
import { evaluateWriting } from './ai.js';
import { countWords } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/** A visible countdown; `onEnd` once at 0. The learner can always skip it. */
export function Countdown({ seconds, onEnd, label }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { if (typeof onEnd === 'function') onEnd(); return undefined; }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // onEnd is read once the count reaches zero; re-arming on its identity would restart the clock
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(2, '0');
  const ss = String(Math.max(0, left) % 60).padStart(2, '0');
  return (
    <p className="inline-flex items-center gap-2 font-data text-[0.9375rem] tabular-nums text-ink" role="timer" aria-live="off">
      <Timer className="h-4 w-4" aria-hidden="true" /> {label ? `${label} ` : ''}{mm}:{ss}
    </p>
  );
}

/**
 * The micro-output of a Lernschritt (SCHEMA §8 MicroOutput, BLUEPRINT §3.3 segment 5):
 * plan (planSeconds) → a short spoken or written answer → automated mini-result
 * (`course-micro` / `course-micro-sp`, fixed label) → one revision. Written answers go to
 * evaluate-writing with the micro-output's bank key; spoken ones start a speaking session
 * with it. Never blocking: „Ohne Auswertung weiter" is always there.
 *
 * onDone({ bankKey, submitted, result }) once, when the learner moves on.
 */
export default function MicroOutputView({ mo, level, onDone }) {
  const { user } = useAuth();
  const [lang, t] = useV2Strings();
  const [phase, setPhase] = useState(mo?.planSeconds ? 'plan' : 'answer'); // plan | answer
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]); // up to 2: first attempt + one revision
  const [error, setError] = useState(null);
  const [spokenResult, setSpokenResult] = useState(null);
  if (!mo) return null;

  const words = countWords(text);
  const band = Array.isArray(mo.words) ? mo.words : null;
  const minToSend = band ? Math.max(3, Math.ceil(band[0] * 0.5)) : 3;
  const attempts = results.length;
  const canRevise = attempts === 1;

  const submit = async () => {
    if (busy || words < minToSend) return;
    if (!user) { setError('ai.signIn'); return; }
    setBusy(true);
    setError(null);
    const r = await evaluateWriting({ bankKey: mo.bankKey, text });
    setBusy(false);
    if (!r.ok) { setError(r.errorKey); return; }
    setResults((prev) => [...prev, r.data]);
  };

  const finish = () => {
    if (typeof onDone === 'function') {
      const last = mo.mode === 'spoken' ? spokenResult : results[results.length - 1] || null;
      onDone({ bankKey: mo.bankKey, submitted: !!last, result: last });
    }
  };

  return (
    <div>
      <Card className="p-5">
        {mo.situationDe && <p className="text-[0.9375rem] leading-relaxed text-graphite" lang="de">{mo.situationDe}</p>}
        <p className="mt-2 font-display text-[1.1875rem] font-semibold leading-snug text-ink" lang="de">{mo.promptDe}</p>
        {mo.promptEn && lang !== 'de' && <p className="mt-1 text-[0.875rem] text-graphite">{mo.promptEn}</p>}
        <p className="mt-2 font-data text-[0.75rem] text-graphite">
          {t('mo.register', { r: mo.register === 'du' ? 'du' : 'Sie' })}
          {mo.mode === 'spoken' && Array.isArray(mo.seconds) ? ` · ${mo.seconds[0]}–${mo.seconds[1]} s` : ''}
          {mo.mode === 'written' && band ? ` · ${band[0]}–${band[1]} ${lang === 'de' ? 'Wörter' : 'words'}` : ''}
        </p>
      </Card>

      {phase === 'plan' && (
        <Card tone="wash" className="mt-4 p-4">
          <p className="text-[0.9375rem] text-ink">{t('mo.planLead')}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Countdown seconds={mo.planSeconds} onEnd={() => setPhase('answer')} label={t('mo.plan', { s: mo.planSeconds })} />
            <Button variant="secondary" onClick={() => setPhase('answer')}>{t('mo.planSkip')}</Button>
          </div>
        </Card>
      )}

      {phase === 'answer' && mo.mode === 'spoken' && (
        <div className="mt-4">
          {Array.isArray(mo.seconds) && (
            <p className="mb-3 text-[0.875rem] text-graphite">{t('mo.speakLead', { min: mo.seconds[0], max: mo.seconds[1] })}</p>
          )}
          <SpeakingRun
            bankKey={mo.bankKey}
            level={level}
            title={mo.promptDe}
            startLabel={t('mo.speakStart')}
            onResult={(r) => { if (r) setSpokenResult(r); }}
          />
        </div>
      )}

      {phase === 'answer' && mo.mode !== 'spoken' && (
        <div className="mt-4">
          {results.map((r, i) => <ResultCard key={i} result={r} className="mb-4" showCorrections={i > 0} />)}
          {attempts < 2 && (
            <Card className="p-5">
              <label htmlFor={`mo-${mo.id}`} className={LABEL}>{attempts === 1 ? t('mo.revise') : t('mo.write')}</label>
              <textarea
                id={`mo-${mo.id}`}
                rows={4}
                value={text}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
                className="mt-2 w-full resize-y rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
                lang="de"
              />
              {band && (
                <p className={`mt-2 font-data text-[0.75rem] ${words >= band[0] && words <= band[1] ? 'text-siegel-deep' : 'text-graphite'}`}>
                  {t('mo.words', { n: words, min: band[0], max: band[1] })}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Button onClick={submit} disabled={busy || words < minToSend}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenTool className="h-4 w-4" aria-hidden="true" />}
                  {busy ? t('mo.submitting') : (canRevise ? t('w.submitRevision') : t('mo.submit'))}
                </Button>
              </div>
              {error && <p className="mt-3 text-[0.9375rem] text-ink" role="status">{t(error)}</p>}
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {!(results.length || spokenResult) && (
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
          >
            {t('mo.skip')}
          </button>
        )}
        {(results.length > 0 || spokenResult) && (
          <Button onClick={finish} size="lg" className="w-full sm:w-auto">{t('item.next')}</Button>
        )}
      </div>
    </div>
  );
}
