import { useEffect, useRef, useState } from 'react';
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
export default function WordOrderItem({ item, index, total, onResult, onNext, eyebrowKey = 'stage.derived.eyebrow' }) {
  const [lang] = useLessonLang();
  const [bank, setBank] = useState(() => item.tokens.map((tok, i) => ({ tok, key: i })));
  const [built, setBuilt] = useState([]);
  const [state, setState] = useState(null);

  useEffect(() => {
    setBank(item.tokens.map((tok, i) => ({ tok, key: i })));
    setBuilt([]);
    setState(null);
  }, [item.id, item.tokens]);

  // A tapped tile moves to the other list and unmounts, which dropped keyboard focus to <body>
  // after every word. Focus goes to the tile now in the same place of the list it left (or the
  // other list when that one is empty), and the sentence so far is read out.
  const areaRefs = { bank: useRef(null), built: useRef(null) };
  const [refocus, setRefocus] = useState(null); // { area, index } or null
  useEffect(() => {
    if (!refocus) return;
    const pick = (area) => [...(areaRefs[area].current?.querySelectorAll('button') || [])];
    const from = pick(refocus.area);
    const target = from[Math.min(refocus.index, from.length - 1)] || pick(refocus.area === 'bank' ? 'built' : 'bank').pop();
    if (target) target.focus();
    setRefocus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refocus]);

  const moveToBuilt = (entry) => {
    if (state) return;
    const index = bank.findIndex((e) => e.key === entry.key);
    setBank((prev) => prev.filter((e) => e.key !== entry.key));
    setBuilt((prev) => [...prev, entry]);
    setRefocus({ area: 'bank', index });
  };
  const moveToBank = (entry) => {
    if (state) return;
    const index = built.findIndex((e) => e.key === entry.key);
    setBuilt((prev) => prev.filter((e) => e.key !== entry.key));
    setBank((prev) => [...prev, entry]);
    setRefocus({ area: 'built', index });
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
      <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
        {t(eyebrowKey, lang, { n: index + 1, total })}
      </h2>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('wordOrder.instructions', lang)}</p>

        <div>
          <p className="mt-5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
            {t('wordOrder.yourSentence', lang)}
          </p>
          <div ref={areaRefs.built} role="group" aria-label={t('wordOrder.yourSentence', lang)} className="mt-2 flex min-h-[3rem] flex-wrap gap-2 rounded-clay border border-dashed border-rule bg-paper-sunk p-3">
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
          <div ref={areaRefs.bank} role="group" aria-label={t('wordOrder.wordBank', lang)} className="mt-2 flex flex-wrap gap-2">
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
        <p className="sr-only" aria-live="polite">{joined}</p>
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
