import { useState } from 'react';
import Button from '../ui/Button.jsx';
import { checkAnswer, checkOptionsFor, RESULT } from '../../lib/lesson/check.js';
import { guidedFeedback, feedbackReason } from '../../lib/lesson/guidedFeedback.js';
import { t } from '../../lib/lesson/strings.js';

/** Scene, sound and reading share the same choice grader and optional repair turn. */
export default function CheckedChoice({ item, lang, onResult, onNext, hintFirst = false }) {
  const [answer, setAnswer] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [retried, setRetried] = useState(false);
  // In German the options are German (`optionsDe`, the same order); what is graded is always the option's place.
  const shown = lang === 'de' && item.optionsDe?.length === item.options.length ? item.optionsDe : item.options;
  const label = (option) => shown[item.options.indexOf(option)] ?? option;
  const check = () => {
    if (!answer || verdict) return;
    const checked = checkAnswer(answer, item.accepted, checkOptionsFor(item));
    setVerdict(hintFirst ? guidedFeedback(item, checked, retried, lang) : checked);
    if (!retried) onResult(item, { result: checked.result, correct: checked.result !== RESULT.WRONG, errorTag: checked.result === RESULT.WRONG ? 'Wortschatz' : null });
  };
  const retry = () => { setRetried(true); setVerdict(null); setAnswer(null); };
  return (
    <div>
      <h2 id={`${item.id}-prompt`} className="font-display text-2xl font-semibold text-siegel">{lang === 'de' ? item.promptDe : item.promptEn}</h2>
      <fieldset aria-labelledby={`${item.id}-prompt`} className="mt-4 space-y-3" disabled={!!verdict}>
        {item.options.map((option) => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-rule bg-white p-4 text-sm">
            <input type="radio" name={item.id} value={option} checked={answer === option} onChange={() => setAnswer(option)} className="h-4 w-4 accent-coral-accessible" />
            <span lang={shown === item.options ? undefined : 'de'}>{label(option)}</span>
          </label>
        ))}
      </fieldset>
      <p role="status" className="mt-4 font-semibold text-ink">
        {verdict && (verdict.hintOnly ? `${t('otter.retry', lang)} ${verdict.hint}`.trim() : t(`${item.feedbackKey || 'scene'}.${verdict.result === RESULT.WRONG ? 'correction' : 'correct'}`, lang, { answer: label(item.answer) }))}
      </p>
      {verdict && !verdict.hintOnly && <p className="mt-2 text-sm text-graphite">{label(item.answer)} · {feedbackReason(item, lang)}</p>}
      <Button variant="coral" className="mt-5 w-full" disabled={!answer} onClick={verdict?.hintOnly ? retry : verdict ? onNext : check}>{t(verdict?.hintOnly ? 'action.again' : verdict ? 'action.next' : 'action.check', lang)}</Button>
    </div>
  );
}
