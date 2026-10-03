import { useEffect, useState } from 'react';
import { Loader2, PenTool, Timer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GameButton, { QuietButton } from './GameButton.jsx';
import ResultCard from './ResultCard.jsx';
import SpeakingRun from './SpeakingRun.jsx';
import { evaluateWriting } from './ai.js';
import { countWords } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';

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
    <p className="inline-flex items-center gap-2 text-[1rem] font-extrabold tabular-nums text-game-text" role="timer" aria-live="off">
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
      <div className={PANEL}>
        {mo.situationDe && <p className="text-[1rem] font-semibold leading-relaxed text-game-muted" lang="de">{mo.situationDe}</p>}
        <p className="mt-2 text-[1.25rem] font-extrabold leading-snug text-game-text" lang="de">{mo.promptDe}</p>
        {mo.promptEn && lang !== 'de' && <p className="mt-1 text-[0.9375rem] font-semibold text-game-muted">{mo.promptEn}</p>}
        <p className="mt-2 text-[0.8125rem] font-bold text-game-muted">
          {t('mo.register', { r: mo.register === 'du' ? 'du' : 'Sie' })}
          {mo.mode === 'spoken' && Array.isArray(mo.seconds) ? ` · ${mo.seconds[0]}–${mo.seconds[1]} s` : ''}
          {mo.mode === 'written' && band ? ` · ${band[0]}–${band[1]} ${lang === 'de' ? 'Wörter' : 'words'}` : ''}
        </p>
      </div>

      {phase === 'plan' && (
        <div className="mt-4 rounded-[1.25rem] border-2 border-course bg-course-wash p-4">
          <p className="text-[1rem] font-bold text-course-ink">{t('mo.planLead')}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Countdown seconds={mo.planSeconds} onEnd={() => setPhase('answer')} label={t('mo.plan', { s: mo.planSeconds })} />
            <GameButton variant="secondary" size="md" onClick={() => setPhase('answer')}>{t('mo.planSkip')}</GameButton>
          </div>
        </div>
      )}

      {phase === 'answer' && mo.mode === 'spoken' && (
        <div className="mt-4">
          {Array.isArray(mo.seconds) && (
            <p className="mb-3 text-[0.9375rem] font-semibold text-game-muted">{t('mo.speakLead', { min: mo.seconds[0], max: mo.seconds[1] })}</p>
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
            <div className={PANEL}>
              <label htmlFor={`mo-${mo.id}`} className={LABEL}>{attempts === 1 ? t('mo.revise') : t('mo.write')}</label>
              <textarea
                id={`mo-${mo.id}`}
                rows={4}
                value={text}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
                className="mt-2 w-full resize-y rounded-2xl border-2 border-game-line bg-white px-4 py-3 text-[1.0625rem] font-semibold leading-relaxed text-game-text outline-none focus:border-course disabled:bg-course-ground"
                lang="de"
              />
              {band && (
                <p className={`mt-2 text-[0.8125rem] font-bold ${words >= band[0] && words <= band[1] ? 'text-game-right-ink' : 'text-game-muted'}`}>
                  {t('mo.words', { n: words, min: band[0], max: band[1] })}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <GameButton size="md" onClick={submit} disabled={busy || words < minToSend}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenTool className="h-4 w-4" aria-hidden="true" />}
                  {busy ? t('mo.submitting') : (canRevise ? t('w.submitRevision') : t('mo.submit'))}
                </GameButton>
              </div>
              {error && <p className="mt-3 text-[0.9375rem] font-semibold text-game-text" role="status">{t(error)}</p>}
            </div>
          )}
        </div>
      )}

      {/* MicroOutput.modelDe (SCHEMA §8, 2026-09-28): one model answer, only after the learner's own attempt */}
      {mo.modelDe && (results.length > 0 || spokenResult) && (
        <details className="mt-4 rounded-[1.25rem] border-2 border-game-line bg-white p-4">
          <summary className={`min-h-11 cursor-pointer ${LABEL}`}>{t('mo.model')}</summary>
          <p className="mt-2 text-[1rem] font-semibold leading-relaxed text-game-text" lang="de">{mo.modelDe}</p>
        </details>
      )}

      <div className="mt-6 flex flex-col items-stretch gap-2">
        {!(results.length || spokenResult) && (
          <QuietButton onClick={finish}>{t('mo.skip')}</QuietButton>
        )}
        {(results.length > 0 || spokenResult) && (
          <GameButton onClick={finish}>{t('item.next')}</GameButton>
        )}
      </div>
    </div>
  );
}
