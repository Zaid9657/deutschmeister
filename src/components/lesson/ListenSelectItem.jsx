import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../../lib/lesson/check.js';
import PlayButton from './PlayButton.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * One `derived` exercise (buildLesson.js `derivedItems`): play one of the
 * Lektion's own dialogue lines and choose it among 3 lines of the SAME
 * Lektion (2 distractors). Graded as multiple choice, same shape as
 * PracticeItem's chip branch — `checkAnswer` decides, this component never
 * hand-builds the check options (tests/course-player.test.mjs GRADING_SITES).
 * A miss here is always tagged 'Hören' (check.js `tagError`).
 */
export default function ListenSelectItem({ item, lektionId, index, total, onResult, onNext, eyebrowKey = 'stage.derived.eyebrow' }) {
  const [lang] = useLessonLang();
  const [picked, setPicked] = useState(null);
  const [state, setState] = useState(null);
  const key = `line-${item.lineIndex}`;

  useEffect(() => {
    setPicked(null);
    setState(null);
  }, [item.id]);

  const canSubmit = !!picked;

  const submit = () => {
    if (!canSubmit || state) return;
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    const { result, expected } = checkAnswer(picked, accepted, checkOptionsFor(item));
    const correct = result !== RESULT.WRONG;
    setState({ result, expected });
    onResult(item, { result, correct, errorTag: correct ? null : tagError(item, picked, item.answer) });
  };

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
        {t(eyebrowKey, lang, { n: index + 1, total })}
      </h2>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('listenSelect.instructions', lang)}</p>
        {/* No sound, no item: showing the text would hand over the answer, so a learner who cannot
            hear the line skips it — nothing is recorded, it is neither right nor wrong. */}
        <div className="mt-4">
          <PlayButton lektionId={lektionId} audioKey={key} text={item.answer} rate={0.9} label={t('action.listen', lang)} onFallback={onNext} fallbackLabel={t('audio.skipItem', lang)} />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {(item.options || []).map((opt) => {
            const on = picked === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={!!state}
                onClick={() => setPicked(opt)}
                aria-pressed={on}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold transition-all duration-100 ease-snap disabled:opacity-70 motion-reduce:transition-none ${
                  on ? 'border-siegel bg-siegel text-white shadow-raise-siegel' : 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none'
                }`}
                lang="de"
              >
                <span>{opt}</span>
                {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
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
