import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, PenTool, Sparkles } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { safeGetJSON, safeSetJSON } from '../../utils/safeStorage.js';
import InlineFeedback from './InlineFeedback.jsx';
import ResultCard from './ResultCard.jsx';
import { evaluateWriting } from './ai.js';
import { countWords, laneLabel, teilLabel } from './content.js';
import { gradeAnswer, RESULT } from './grade.js';
import { useV2Strings } from './strings.js';
import { foldNumberWords } from '../../lib/lesson/check.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/** The draft and results of one Aufgabe, per viewer, on this device (a convenience only). */
const draftKey = (bankKey) => `dm_v2_writing_${bankKey}`;
export const readDraft = (bankKey) => safeGetJSON(draftKey(bankKey), null);
const writeDraft = (bankKey, value) => safeSetJSON(draftKey(bankKey), value);

// „14:30" and „14.30" are one time: a colon between digits folds to the dot (a1.1-u10 r1 F17);
// a number word is its digits („zwei Kinder" = „2 Kinder", level review s1 #4), on both sides
const fold = (s) => foldNumberWords(String(s || '')).toLowerCase().replace(/(\d):(?=\d)/g, '$1.');

/** Is there a surface hint of this Leitpunkt? A FORM check only; the KI decides meaning. */
const cueFound = (lp, text) => {
  const body = fold(text);
  return (lp.cues || []).some((c) => c && body.includes(fold(c)));
};

/** The form_fill variant (sd1.s1, ta2.s1): fields checked deterministically, no AI. */
function FormTask({ task, stepId, onDone, onAttempt }) {
  const [, t] = useV2Strings();
  const fields = task.form?.fields || [];
  const [values, setValues] = useState({});
  const [results, setResults] = useState(null);
  const allFilled = fields.every((f) => String(values[f.id] || '').trim());

  const check = () => {
    const out = {};
    let correct = 0;
    for (const f of fields) {
      // labelDe, the task's situation and the other fields' keys feed the form rule (checkItem: value + the field's frame)
      const otherAnswers = fields.filter((g) => g.id !== f.id).map((g) => g.answer);
      const item = { id: `${task.bankKey}-${f.id}`, type: 'form_fill', topic: 'schreiben', answer: f.answer, accepted: f.accepted?.length ? f.accepted : [f.answer], exact: f.exact, labelDe: f.labelDe, situationDe: task.situationDe, otherAnswers };
      const r = gradeAnswer(item, values[f.id] || '');
      out[f.id] = r;
      if (r.result !== RESULT.WRONG) correct += 1;
      if (typeof onAttempt === 'function') {
        onAttempt({ itemId: item.id, stepId, correct: r.result !== RESULT.WRONG, answer: values[f.id] || '', errorTag: r.result === RESULT.WRONG ? 'spelling-meaning' : null, typo: r.result === RESULT.TYPO });
      }
    }
    setResults(out);
    return correct;
  };

  return (
    <Card className="mt-4 p-5">
      <p className={LABEL}>{t('w.form')}</p>
      <div className="mt-3 space-y-4">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={`${task.bankKey}-${f.id}`} className="text-[0.9375rem] font-bold text-ink" lang="de">{f.labelDe}</label>
            <input
              id={`${task.bankKey}-${f.id}`}
              type="text"
              value={values[f.id] || ''}
              disabled={!!results}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
              className="mt-1.5 w-full rounded-clay border border-rule bg-white px-4 py-2.5 text-[1rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
              lang="de"
            />
            {results && results[f.id] && (
              <InlineFeedback
                result={results[f.id].result}
                expected={results[f.id].expected}
                // why a variant form also counts (SCHEMA §8 form.fields[].acceptedWhy, ITM-10)
                explanation={f.acceptedWhy && f.acceptedWhy[results[f.id].expected] ? { de: f.acceptedWhy[results[f.id].expected] } : null}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        {!results ? (
          <Button onClick={check} disabled={!allFilled}>{t('w.formCheck')}</Button>
        ) : (
          <Button size="lg" onClick={() => onDone({ bankKey: task.bankKey, submitted: true, result: null })} className="w-full sm:w-auto">{t('w.done')}</Button>
        )}
      </div>
    </Card>
  );
}

/**
 * SchreibenStep / UeberarbeitenStep (SCHEMA §8 WritingTask, BLUEPRINT §4.2 and §3.1 LS6,
 * §3.2 LS6–LS7).
 *
 *   plan → draft with the live pre-check (word count against the band, one row per
 *   Leitpunkt — „ein Hinweis ist da" by form, else „prüft die KI" —, the task's own
 *   checklist to tick) → submit → evaluate-writing with the bank key → the result as a
 *   practice value with the fixed label and self-correction places → revision → second
 *   result → the model text (only now, never before the learner revised).
 *
 * A skeleton: the revision follows at once. B skeleton (`mode: 'write'` at B levels): the
 * revision is its own Lernschritt the next learning day (`mode: 'revise'`), which picks the
 * first version up from this device.
 *
 * onDone({ bankKey, submitted, result }) once, when the learner moves on. `submitted` is
 * true after a graded attempt (the server row is the completion evidence, BLUEPRINT §3.5).
 */
export default function WritingTaskView({ task, level: _level, stepId = null, mode = 'write', skeleton = 'A', onDone, onAttempt }) {
  const { user } = useAuth();
  const [lang, t] = useV2Strings();
  const saved = useMemo(() => (task?.bankKey ? readDraft(task.bankKey) : null), [task?.bankKey]);
  const [text, setText] = useState(() => saved?.text || '');
  const [results, setResults] = useState(() => (Array.isArray(saved?.results) ? saved.results : []));
  const [firstText, setFirstText] = useState(() => saved?.firstText || null);
  const [ticks, setTicks] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selfPhase, setSelfPhase] = useState(null); // null | 'revise' | 'done' — the path without an AI result
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!task?.bankKey) return;
    writeDraft(task.bankKey, { text, results, firstText });
  }, [task?.bankKey, text, results, firstText]);

  useEffect(() => {
    if (!busy) return undefined;
    const id = window.setTimeout(() => setSlow(true), 10000);
    return () => { window.clearTimeout(id); setSlow(false); };
  }, [busy]);

  if (!task) return null;
  if (task.form) {
    return (
      <div>
        <TaskHeader task={task} t={t} lang={lang} />
        <FormTask task={task} stepId={stepId} onDone={onDone} onAttempt={onAttempt} />
      </div>
    );
  }

  const band = task.wordBandLearning || task.wordBand || null;
  const words = countWords(text);
  const minSubmit = task.minSubmitWords || (band ? Math.ceil(band[0] * 0.5) : 5);
  const attempts = results.length;
  const revising = (attempts === 1 && (skeleton === 'A' || mode === 'revise')) || selfPhase === 'revise';
  const finished = attempts >= 2 || selfPhase === 'done';
  const laterRevision = skeleton === 'B' && mode === 'write' && attempts >= 1;
  const editable = !busy && !finished && !laterRevision && (attempts === 0 || revising);
  const leitpunkte = task.leitpunkte || [];

  const submit = async () => {
    if (!editable || words < minSubmit) return;
    if (!user) { setError('ai.signIn'); return; }
    setBusy(true);
    setError(null);
    const r = await evaluateWriting({ bankKey: task.bankKey, text });
    setBusy(false);
    if (!r.ok) { setError(r.errorKey); return; }
    if (attempts === 0) setFirstText(text);
    setResults((prev) => [...prev, r.data]);
  };

  const finish = () => {
    if (typeof onDone === 'function') onDone({ bankKey: task.bankKey, submitted: results.length > 0, result: results[results.length - 1] || null });
  };

  // Without an AI result (signed out, no access, allowance used up, offline) the learner
  // can still revise on their own; the model text follows that revision, never the draft.
  const canSelfRevise = attempts === 0 && !!error && !selfPhase && words >= minSubmit;
  const selfChanged = selfPhase === 'revise' && firstText != null && text.trim() !== firstText.trim();

  return (
    <div>
      <TaskHeader task={task} t={t} lang={lang} />

      {mode === 'revise' && (
        <Card tone="sunk" className="mt-4 p-4">
          <p className="text-[0.9375rem] text-ink">{attempts === 0 && !text ? t('w.noDraft') : t('w.reviseLead')}</p>
        </Card>
      )}

      {results.map((r, i) => (
        <div key={i} className="mt-4">
          <ResultCard result={r} leitpunkte={leitpunkte} showCorrections={i > 0} />
        </div>
      ))}

      {revising && !finished && <p className="mt-4 text-[0.9375rem] font-bold text-ink">{t('w.reviseLead')}</p>}
      {laterRevision && !finished && (
        <Card tone="wash" className="mt-4 p-4"><p className="text-[0.9375rem] text-ink">{t('w.reviseLater')}</p></Card>
      )}

      {firstText && attempts >= 1 && (revising || finished) && (
        <details className="mt-4 rounded-clay border border-rule bg-white p-4">
          <summary className="cursor-pointer text-[0.875rem] font-bold text-graphite">{t('w.previous')}</summary>
          <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink" lang="de">{firstText}</p>
        </details>
      )}

      {!laterRevision && !finished && (
        <Card className="mt-4 p-5">
          <label htmlFor={`w-${task.bankKey}`} className={LABEL}>{t('w.yourText')}</label>
          <textarea
            id={`w-${task.bankKey}`}
            rows={8}
            value={text}
            disabled={!editable}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full resize-y rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
            lang="de"
            spellCheck={false}
          />
          <p className={`mt-2 font-data text-[0.75rem] ${band && words >= band[0] && words <= band[1] ? 'text-siegel-deep' : 'text-graphite'}`}>
            {t('w.words', { n: words })}{band ? ` · ${t('w.target', { min: band[0], max: band[1] })}` : ''}
            {words < minSubmit ? ` · ${t('w.minSubmit', { n: minSubmit })}` : ''}
          </p>

          {leitpunkte.length > 0 && (
            <div className="mt-5">
              <p className={LABEL}>{t('w.checklist')}</p>
              <ul className="mt-2 space-y-2">
                {leitpunkte.map((lp) => {
                  const found = cueFound(lp, text);
                  return (
                    <li key={lp.id} className="flex items-start gap-2 text-[0.9375rem]">
                      {found
                        ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-siegel-deep" aria-hidden="true" />
                        : <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden="true" />}
                      <span className="text-ink"><span lang="de">{lp.de}</span> <span className="text-graphite">— {found ? t('w.cueFound') : t('w.cueAi')}</span></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {Array.isArray(task.checklist) && task.checklist.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {task.checklist.map((c, i) => (
                <li key={i}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-ink">
                    <input
                      type="checkbox"
                      checked={!!ticks[i]}
                      onChange={(e) => setTicks((tk) => ({ ...tk, [i]: e.target.checked }))}
                      className="h-5 w-5 accent-siegel"
                    />
                    <span lang="de">{c}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-graphite">{t('w.formcheck')}</p>

          {editable && (
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {canSelfRevise && (
                <button
                  type="button"
                  onClick={() => { setFirstText(text); setSelfPhase('revise'); setError(null); }}
                  className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
                >
                  {t('w.revise')}
                </button>
              )}
              {selfPhase === 'revise' && (
                <Button variant="secondary" onClick={() => setSelfPhase('done')} disabled={!selfChanged}>
                  {t('w.submitRevision')}
                </Button>
              )}
              {selfPhase !== 'revise' && <Button onClick={submit} disabled={busy || words < minSubmit}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenTool className="h-4 w-4" aria-hidden="true" />}
                {busy ? t('mo.submitting') : (revising ? t('w.submitRevision') : t('w.submit'))}
              </Button>}
            </div>
          )}
          {slow && busy && <p className="mt-2 text-right text-[0.875rem] text-graphite">{t('ai.slow')}</p>}
          {error && <p className="mt-3 text-[0.9375rem] text-ink" role="status">{t(error)}</p>}
        </Card>
      )}

      {finished && task.modelText && (
        <Card className="mt-4 p-5">
          <p className={LABEL}>{t('w.model')}</p>
          <p className="mt-2 whitespace-pre-line text-[1rem] leading-relaxed text-ink" lang="de">{task.modelText}</p>
        </Card>
      )}
      {!finished && task.modelText && attempts >= 1 && <p className="mt-3 text-[0.8125rem] text-graphite">{t('w.modelAfter')}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {(finished || laterRevision || (revising && attempts >= 1 && selfPhase !== 'revise')) ? (
          <Button onClick={finish} size="lg" className="w-full sm:w-auto">{t('w.done')}</Button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
          >
            {t('mo.skip')}
          </button>
        )}
      </div>
    </div>
  );
}

function TaskHeader({ task, t, lang }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        {task.template && <Chip tone="label">{teilLabel(task.template)}</Chip>}
        {task.lane && <Chip tone="quiet">{laneLabel(task.lane)}</Chip>}
        {task.originLabelDe && <Chip tone="quiet">{t('exam.origin', { label: task.originLabelDe })}</Chip>}
      </div>
      {task.title && <h2 className="mt-3 font-display text-[1.25rem] font-semibold leading-tight text-ink" lang="de">{task.title}</h2>}
      {task.situationDe && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink" lang="de">{task.situationDe}</p>}
      {task.taskDe && <p className="mt-2 text-[0.9375rem] font-bold leading-relaxed text-ink" lang="de">{task.taskDe}</p>}
      {Array.isArray(task.leitpunkte) && task.leitpunkte.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-clay bg-paper-sunk p-4">
          {task.leitpunkte.map((lp) => (
            <li key={lp.id} className="text-[0.9375rem] text-ink" lang="de">
              <span aria-hidden="true" className="mr-2 text-graphite">›</span>{lp.de}
            </li>
          ))}
        </ul>
      )}
      {task.choose && (
        <p className="mt-2 text-[0.875rem] text-graphite">{lang === 'de' ? `Wählen Sie ${task.choose.pick} von ${task.choose.from}.` : `Choose ${task.choose.pick} of ${task.choose.from}.`}</p>
      )}
    </Card>
  );
}
