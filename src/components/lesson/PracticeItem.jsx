import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, AlertTriangle, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { checkAnswer, tagError, RESULT, STRICT_TOPIC } from '../../lib/lesson/check.js';
import { isTypedItem } from '../../lib/lesson/buildLesson.js';

/**
 * Correctness is TEXT + ICON + COLOUR, never colour alone (standard §4).
 * Exported because the dictation item shows the same three states.
 */
export function ItemFeedback({ result, expected, explanation, onExplain }) {
  if (!result) return null;
  const map = {
    [RESULT.CORRECT]: { Icon: Check, label: 'Richtig', tone: 'border-siegel bg-siegel-wash text-siegel-deep' },
    [RESULT.TYPO]: { Icon: AlertTriangle, label: 'Fast — nur ein Tippfehler', tone: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink' },
    [RESULT.WRONG]: { Icon: X, label: 'Noch nicht', tone: 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink' },
  };
  const { Icon, label, tone } = map[result] || map[RESULT.WRONG];
  return (
    <div className={`mt-4 rounded-clay border p-4 ${tone}`} role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-bold">
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {label}
      </p>
      {result !== RESULT.CORRECT && expected && (
        <p className="mt-2 text-[0.9375rem]">
          Richtig ist: <strong className="font-bold">{expected}</strong>
        </p>
      )}
      {explanation && <p className="mt-2 text-[0.875rem] leading-relaxed opacity-90">{explanation}</p>}
      {onExplain && (
        <button
          type="button"
          onClick={onExplain}
          className="mt-3 inline-flex items-center gap-1.5 rounded-pill border border-current bg-white/60 px-3 py-1.5 text-[0.8125rem] font-bold"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Erklär mir das
        </button>
      )}
    </div>
  );
}

/**
 * One controlled-practice item, one screen (standard §3 stage 4).
 *
 * Renders the four pool types: fill_blank typed, fill_blank with option chips,
 * multiple_choice, sentence_building (typed) and error_correction (typed).
 * Checking goes through the shared `checkAnswer` with `strict` decided by the
 * item's topic — on a conjugation or article topic a one-letter slip IS the
 * grammar, so the typo allowance is off.
 *
 * `onResult(item, { result, correct, errorTag })` fires ONCE per item, on the
 * first submit: that is the response the accuracy figure counts.
 */
export default function PracticeItem({ item, index, total, onResult, onNext }) {
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
  const strict = STRICT_TOPIC.test(item.topic || '');
  const answer = typed ? value : picked;
  const canSubmit = String(answer || '').trim().length > 0;

  const submit = () => {
    if (!canSubmit || state) return;
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    const { result, expected } = checkAnswer(answer, accepted, { strict });
    const correct = result !== RESULT.WRONG;
    setState({ result, expected: expected || item.answer });
    onResult(item, {
      result,
      correct,
      errorTag: correct ? null : tagError(item, answer, item.answer),
    });
  };

  return (
    <div>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
        Schritt 4 · Üben {index + 1}/{total}
      </p>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="font-display text-[1.25rem] font-semibold leading-snug text-ink sm:text-[1.375rem]">{item.questionDe}</p>
        {item.questionEn && <p className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{item.questionEn}</p>}

        {chips ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((opt) => {
              const on = picked === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!!state}
                  onClick={() => setPicked(opt)}
                  aria-pressed={on}
                  className={`rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold transition-all duration-100 ease-snap disabled:opacity-70 motion-reduce:transition-none ${
                    on ? 'border-siegel bg-siegel text-white shadow-raise-siegel' : 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor={`answer-${item.id}`} className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              Deine Antwort
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
              placeholder={item.type === 'sentence_building' ? 'Ganzer Satz' : '…'}
            />
            {item.hint && !state && <p className="mt-2 text-[0.8125rem] text-graphite">Tipp: {item.hint}</p>}
          </div>
        )}

        <ItemFeedback
          result={state && state.result}
          expected={state && state.expected}
          explanation={state && state.result !== RESULT.CORRECT ? item.explanationDe : null}
          onExplain={state && state.result !== RESULT.CORRECT ? () => setExplain(true) : null}
        />
        {explain && (
          <p className="mt-3 rounded-clay bg-paper-sunk p-3 text-[0.875rem] leading-relaxed text-graphite">
            Die ausführliche KI-Erklärung kommt in einer der nächsten Versionen. Bis dahin: die Regel steht
            auf der Grammatikkarte dieser Lektion.
          </p>
        )}
      </Card>

      <div className="mt-6 flex justify-end">
        {state ? (
          <Button onClick={onNext} size="lg" className="w-full sm:w-auto">Weiter</Button>
        ) : (
          <Button onClick={submit} size="lg" disabled={!canSubmit} className="w-full sm:w-auto">Prüfen</Button>
        )}
      </div>
    </div>
  );
}
