import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { checkAnswer, tagError, RESULT, checkOptionsFor } from '../../lib/lesson/check.js';
import PlayButton from './PlayButton.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * The listening item of stage 4: a dialogue line is played, the learner types
 * it. Checked NON-strictly and in dictation mode — a dictation tests the ear, so
 * punishing a one-letter slip would tag a hearing success as a grammar failure,
 * and a dash or a digit grouping the learner cannot hear (Lektion 6 dictates a
 * phone number) may not decide the answer either. The German text appears with
 * the feedback, so the line is never audio-only.
 *
 * The clip is the recording when the manifest has it (key `line-<i>`, the same
 * key the dialogue screen uses — a dictation line IS a dialogue line) and
 * browser speech otherwise; the badge says which.
 */
export default function DictationItem({ line, lektionId, index, total, onResult, onNext, eyebrowKey = 'stage.dictation.eyebrow' }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState(null);
  // The learner chose to READ the line (the audio failed, or they asked for the text): the answer
  // is still checked, but it is recorded as read, not heard — never as listening evidence.
  const [readInstead, setReadInstead] = useState(false);
  // Listening evidence is a playback that STARTED (PlayButton's onPlayed), not the absence of a
  // "read" click: an answer typed after the audio failed is not a dictation (Codex review).
  const [heard, setHeard] = useState(false);
  const ref = useRef(null);
  const id = lektionId || line.lektionId || null;
  const key = `line-${line.index}`;
  const [lang] = useLessonLang();

  useEffect(() => {
    setValue(''); setState(null); setReadInstead(false); setHeard(false);
    if (ref.current) ref.current.focus();
  }, [line.index]);

  const itemId = `dictation-${line.index}`;
  // The item, not the call site, decides the check options (REVIEW #6 BLOCKER 3):
  // this one is built here rather than drawn from a pool, so it is built in full
  // and handed to checkOptionsFor, which reads `kind: 'dictation'` off it.
  const item = {
    id: itemId, topic: 'hoeren', kind: 'dictation', stage: 'dictation', type: 'dictation',
    lineIndex: line.index, answer: line.de, accepted: [line.de],
  };

  const submit = () => {
    if (!value.trim() || state) return;
    const { result, expected } = checkAnswer(value, item.accepted, checkOptionsFor(item));
    const correct = result !== RESULT.WRONG;
    setState({ result, expected });
    onResult(item, { result, correct, errorTag: correct ? null : tagError(item, value, line.de), listened: heard && !readInstead });
  };

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
        {t(eyebrowKey, lang, { n: index + 1, total })}
      </h2>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('dictation.lead', lang)}</p>
        <div className="mt-4">
          <PlayButton lektionId={id} audioKey={key} text={line.de} rate={0.85} onFallback={() => setReadInstead(true)} onPlayed={() => setHeard(true)} />
        </div>
        {readInstead && (
          <p className="mt-3 rounded-clay border border-rule bg-paper-sunk p-3 text-[0.9375rem]">
            <strong lang="de">{line.de}</strong>
            <span className="mt-1 block text-[0.8125rem] text-graphite">{t('audio.readInstead', lang)}</span>
          </p>
        )}

        <label htmlFor={itemId} className="mt-5 block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
          {t('dictation.whatDoYouHear', lang)}
        </label>
        <input
          id={itemId}
          ref={ref}
          type="text"
          value={value}
          disabled={!!state}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          className="mt-2 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
        />

      </Card>

      {!state && (
        <div className="mt-6 flex justify-end">
          <Button onClick={submit} size="lg" disabled={!value.trim()} className="w-full sm:w-auto">{t('action.check', lang)}</Button>
        </div>
      )}

      <FeedbackSheet
        result={state && state.result}
        expected={state && state.expected}
        explanation={state ? line.en : null}
        onContinue={onNext}
      />
    </div>
  );
}
