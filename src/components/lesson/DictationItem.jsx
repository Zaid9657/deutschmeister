import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { ItemFeedback } from './PracticeItem.jsx';
import { checkAnswer, tagError, RESULT } from '../../lib/lesson/check.js';
import { audioFor, playLine, speechAvailable } from '../../lib/lesson/speech.js';
import { AudioSourceBadge } from './DialogStage.jsx';

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
export default function DictationItem({ line, lektionId, index, total, onResult, onNext }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState(null);
  const ref = useRef(null);
  const id = lektionId || line.lektionId || null;
  const key = `line-${line.index}`;
  const recorded = !!audioFor(id, key);

  useEffect(() => {
    setValue(''); setState(null);
    if (ref.current) ref.current.focus();
  }, [line.index]);

  const itemId = `dictation-${line.index}`;

  const submit = () => {
    if (!value.trim() || state) return;
    const { result, expected } = checkAnswer(value, [line.de], { strict: false, dictation: true });
    const correct = result !== RESULT.WRONG;
    setState({ result, expected });
    onResult(
      { id: itemId, topic: 'hoeren', kind: 'dictation', stage: 'dictation', type: 'dictation' },
      { result, correct, errorTag: correct ? null : tagError({ kind: 'dictation' }, value, line.de) },
    );
  };

  return (
    <div>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
        Schritt 4 · Hören {index + 1}/{total}
      </p>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">Hör die Zeile und schreib sie auf.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => playLine(id, key, line.de, { rate: 0.85 })}
            disabled={!recorded && !speechAvailable()}
            className="inline-flex items-center gap-2 rounded-clay border border-rule bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            <Play className="h-4 w-4" aria-hidden="true" /> Abspielen
          </button>
          <AudioSourceBadge recorded={recorded} />
        </div>
        {!recorded && !speechAvailable() && (
          <p className="mt-2 text-[0.8125rem] text-graphite">
            Dein Browser kann nicht vorlesen — hier ist die Zeile zum Abschreiben: <strong>{line.de}</strong>
          </p>
        )}

        <label htmlFor={itemId} className="mt-5 block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
          Was hörst du?
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
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="mt-2 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
        />

        <ItemFeedback result={state && state.result} expected={state && state.expected} explanation={state ? line.en : null} />
      </Card>

      <div className="mt-6 flex justify-end">
        {state ? (
          <Button onClick={onNext} size="lg" className="w-full sm:w-auto">Weiter</Button>
        ) : (
          <Button onClick={submit} size="lg" disabled={!value.trim()} className="w-full sm:w-auto">Prüfen</Button>
        )}
      </div>
    </div>
  );
}
