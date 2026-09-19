import { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ExplainAnswer from './ExplainAnswer.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../../lib/lesson/check.js';
import { isTypedItem } from '../../lib/lesson/buildLesson.js';

/**
 * Shown when the only thing wrong with an answer is its capitalisation — in
 * the chrome language (Sie register in Deutsch-Modus).
 */
export const caseHint = (lang) => t('practice.caseHint', lang);

/**
 * One controlled-practice item, one screen (standard §3 stage 4).
 *
 * Renders the four pool types: fill_blank typed, fill_blank with option chips,
 * multiple_choice, sentence_building (typed) and error_correction (typed).
 * Checking goes through the shared `checkAnswer` with every option derived from
 * the item by `checkOptionsFor()` — on a conjugation or article topic a
 * one-letter slip IS the grammar, so the typo allowance is off; capitalisation
 * is the answer on the polite `Ihr` items; a dictation folds separators.
 *
 * `onResult(item, { result, correct, errorTag })` fires ONCE per item, on the
 * first submit: that is the response the accuracy figure counts.
 *
 * After a miss, "Erklär mir das" mounts <ExplainAnswer>, which calls
 * netlify/functions/explain-answer. `level` and `lektionId` are optional and only
 * label the attempt row the function writes — pass them from the player when
 * available; the function falls back to the level default.
 *
 * `eyebrowKey` names the stage this item is shown in: 'stage.practice.eyebrow'
 * by default, 'stage.requeue.eyebrow' when the player re-asks the misses after
 * the writing step — the requeue used to reuse "Step 4 · Practice" after
 * "Step 6 · Writing", which read as the lesson going backwards.
 */
export default function PracticeItem({ item, index, total, onResult, onNext, level, lektionId, eyebrowKey = 'stage.practice.eyebrow' }) {
  const [lang] = useLessonLang();
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState(null);
  const [state, setState] = useState(null);
  const [explain, setExplain] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(''); setPicked(null); setState(null); setExplain(false);
    if (inputRef.current) inputRef.current.focus();
  }, [item.id]);

  const chips = useMemo(() => (item.options && item.options.length ? item.options : null), [item]);
  const typed = isTypedItem(item);
  // Every check option comes from the ITEM (checkOptionsFor: strict, caseSensitive,
  // dictation, spelling), never from this call site — that is what keeps the
  // lesson, the checkpoint and the review grading one grader (REVIEW #6 BLOCKER 3).
  const checkOpts = useMemo(() => checkOptionsFor(item), [item]);
  const answer = typed ? value : picked;
  const canSubmit = String(answer || '').trim().length > 0;

  const submit = () => {
    if (!canSubmit || state) return;
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    const { result, expected, reason } = checkAnswer(answer, accepted, checkOpts);
    const correct = result !== RESULT.WRONG;
    setState({
      result,
      expected: expected || item.answer,
      hint: reason === 'case' ? caseHint(lang) : null,
    });
    onResult(item, {
      result,
      correct,
      errorTag: correct ? null : tagError(item, answer, item.answer),
    });
  };

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
        {t(eyebrowKey, lang, { n: index + 1, total })}
      </p>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="font-display text-[1.25rem] font-semibold leading-snug text-ink sm:text-[1.375rem]" lang="de">{item.questionDe}</p>
        {item.questionEn && <p className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{item.questionEn}</p>}

        {chips ? (
          // Full-width, stacked options on mobile (one thumb-width tap target
          // each); min 44px tall either way. Selected state is never colour
          // alone — the check icon carries it too.
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {chips.map((opt) => {
              const on = picked === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!!state}
                  onClick={() => setPicked(opt)}
                  aria-pressed={on}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold transition-all duration-100 ease-snap disabled:opacity-70 motion-reduce:transition-none sm:w-auto ${
                    on ? 'border-siegel bg-siegel text-white shadow-raise-siegel' : 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none'
                  }`}
                >
                  <span>{opt}</span>
                  {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor={`answer-${item.id}`} className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              {t('practice.yourAnswer', lang)}
            </label>
            <input
              id={`answer-${item.id}`}
              ref={inputRef}
              type="text"
              value={value}
              disabled={!!state}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              className="mt-2 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
              placeholder={item.type === 'sentence_building' ? t('practice.wholeSentence', lang) : '…'}
            />
            {item.hint && !state && <p className="mt-2 text-[0.8125rem] text-graphite">{t('practice.tip', lang, { hint: item.hint })}</p>}
          </div>
        )}

        {explain && (
          <ExplainAnswer
            item={item}
            expected={state && state.expected}
            userAnswer={answer}
            level={level}
            lektionId={lektionId}
            lang={lang}
          />
        )}
      </Card>

      {!state && (
        <div className="mt-6 flex justify-end">
          <Button onClick={submit} size="lg" disabled={!canSubmit} className="w-full sm:w-auto">{t('action.check', lang)}</Button>
        </div>
      )}

      <FeedbackSheet
        result={state && state.result}
        expected={state && state.expected}
        hint={state && state.hint}
        explanation={state && state.result !== RESULT.CORRECT ? (lang !== 'de' && item.explanationEn ? item.explanationEn : item.explanationDe) : null}
        otherExplanation={state && state.result !== RESULT.CORRECT ? (lang !== 'de' && item.explanationEn ? item.explanationDe : item.explanationEn) : null}
        onExplain={state && state.result !== RESULT.CORRECT ? () => setExplain(true) : null}
        onContinue={onNext}
      />
    </div>
  );
}
