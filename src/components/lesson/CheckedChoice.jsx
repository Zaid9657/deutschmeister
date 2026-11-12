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
  const check = () => {
    if (!answer || verdict) return;
    const checked = checkAnswer(answer, item.accepted, checkOptionsFor(item));
    setVerdict(hintFirst ? guidedFeedback(item, checked, retried, lang) : checked);
    if (!retried) onResult(item, { result: checked.result, correct: checked.result !== RESULT.WRONG, errorTag: checked.result === RESULT.WRONG ? 'Wortschatz' : null });
  };
  const retry = () => { setRetried(true); setVerdict(null); setAnswer(null); };
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-siegel">{lang === 'de' ? item.promptDe : item.promptEn}</h2>
      <fieldset className="mt-4 space-y-3" disabled={!!verdict}>
        <legend className="sr-only">{lang === 'de' ? item.promptDe : item.promptEn}</legend>
        {item.options.map((option) => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-rule bg-white p-4 text-sm">
            <input type="radio" name={item.id} value={option} checked={answer === option} onChange={() => setAnswer(option)} className="h-4 w-4 accent-coral-accessible" />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <p role="status" className="mt-4 font-semibold text-ink">
        {verdict && (verdict.hintOnly ? verdict.hint : t(verdict.result === RESULT.WRONG ? 'scene.correction' : 'scene.correct', lang, { answer: item.answer }))}
      </p>
      {verdict && !verdict.hintOnly && <p className="mt-2 text-sm text-graphite">{item.answer} · {feedbackReason(item, lang)}</p>}
      <Button variant="coral" className="mt-5 w-full" disabled={!answer} onClick={verdict?.hintOnly ? retry : verdict ? onNext : check}>{t(verdict?.hintOnly ? 'action.again' : verdict ? 'action.next' : 'action.check', lang)}</Button>
    </div>
  );
}
