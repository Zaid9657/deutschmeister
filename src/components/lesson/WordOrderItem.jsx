import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * One `derived` exercise (buildLesson.js `derivedItems`): rebuild one of the
 * Lektion's own dialogue lines (≤8 tokens) from shuffled word tiles. Grading
 * goes through the SAME `checkAnswer` every other typed item uses — the
 * built sentence is joined with spaces and checked against `item.accepted`
 * with `checkOptionsFor(item)`, so punctuation/case forgiveness stays the
 * grader's decision, never this component's (tests/course-player.test.mjs
 * GRADING_SITES).
 */
export default function WordOrderItem({ item, index, total, onResult, onNext }) {
  const [lang] = useLessonLang();
  const [bank, setBank] = useState(() => item.tokens.map((tok, i) => ({ tok, key: i })));
  const [built, setBuilt] = useState([]);
  const [state, setState] = useState(null);

  useEffect(() => {
    setBank(item.tokens.map((tok, i) => ({ tok, key: i })));
    setBuilt([]);
    setState(null);
  }, [item.id, item.tokens]);

  const moveToBuilt = (entry) => {
    if (state) return;
    setBank((prev) => prev.filter((e) => e.key !== entry.key));
    setBuilt((prev) => [...prev, entry]);
  };
  const moveToBank = (entry) => {
    if (state) return;
    setBuilt((prev) => prev.filter((e) => e.key !== entry.key));
    setBank((prev) => [...prev, entry]);
  };

  const joined = built.map((e) => e.tok).join(' ');
  const canSubmit = bank.length === 0 && built.length > 0;

  const submit = () => {
    if (!canSubmit || state) return;
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    const { result, expected } = checkAnswer(joined, accepted, checkOptionsFor(item));
    const correct = result !== RESULT.WRONG;
    setState({ result, expected });
    onResult(item, { result, correct, errorTag: correct ? null : tagError(item, joined, item.answer) });
  };

  const tileBase =
    'inline-flex min-h-11 items-center gap-1.5 rounded-clay border px-3.5 py-2 text-[0.9375rem] font-bold transition-all duration-100 ease-snap ' +
    'motion-reduce:transition-none disabled:opacity-70';

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
        {t('stage.derived.eyebrow', lang, { n: index + 1, total })}
      </p>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('wordOrder.instructions', lang)}</p>

        <div>
          <p className="mt-5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
            {t('wordOrder.yourSentence', lang)}
          </p>
          <div className="mt-2 flex min-h-[3rem] flex-wrap gap-2 rounded-clay border border-dashed border-rule bg-paper-sunk p-3">
            {built.map((entry) => (
              <button
                key={entry.key}
                type="button"
                disabled={!!state}
                onClick={() => moveToBank(entry)}
                aria-label={t('wordOrder.removeWord', lang, { word: entry.tok })}
                className={`${tileBase} border-siegel bg-siegel text-white shadow-raise-siegel active:translate-y-1 active:shadow-none`}
                lang="de"
              >
                <span>{entry.tok}</span>
                {!state && <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mt-5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
            {t('wordOrder.wordBank', lang)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {bank.map((entry) => (
              <button
                key={entry.key}
                type="button"
                disabled={!!state}
                onClick={() => moveToBuilt(entry)}
                className={`${tileBase} border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none`}
                lang="de"
              >
                {entry.tok}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {!state && (
        <div className="mt-6 flex justify-end">
          <Button onClick={submit} size="lg" disabled={!canSubmit} className="w-full sm:w-auto">{t('action.check', lang)}</Button>
        </div>
      )}

      <FeedbackSheet
        result={state && state.result}
        expected={state && state.expected}
        onContinue={onNext}
      />
    </div>
  );
}
