import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { RESULT } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * Display-order shuffle for the two columns (Fisher–Yates). This has no
 * grading consequence — `item.pairs` is already drawn deterministically by
 * `derivedItems` (buildLesson.js) — it only decides which row each tile sits
 * in on screen, so plain `Math.random` is fine here.
 */
function shuffledColumn(values) {
  const out = values.map((value, pairIndex) => ({ value, pairIndex }));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One `derived` exercise (buildLesson.js `derivedItems`): match the Lektion's
 * own Wortfeld pairs, German ↔ English. Standard §4 shape (one screen, primary
 * "Check", then FeedbackSheet, then "Continue") is kept even though matching
 * itself gives instant per-tap feedback: a wrong tap never COMMITS a pairing
 * (it just flashes and resets), so "Check" only ever becomes available once
 * every pair is correctly matched — `onResult` still fires exactly once, the
 * way every other item in the lesson does.
 *
 * State is never colour-only: a matched tile carries a check icon, a
 * mismatched tap flashes an X icon on both tiles, not just a colour change.
 */
export default function MatchItem({ item, index, total, onResult, onNext }) {
  const [lang] = useLessonLang();
  const [deCol, setDeCol] = useState(() => shuffledColumn(item.pairs.map((p) => p.de)));
  const [enCol, setEnCol] = useState(() => shuffledColumn(item.pairs.map((p) => p.en)));
  const [selectedDe, setSelectedDe] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [flash, setFlash] = useState(null); // { de, en } pairIndexes of a wrong tap, or null
  const [misses, setMisses] = useState(0);
  const [state, setState] = useState(null);

  useEffect(() => {
    setDeCol(shuffledColumn(item.pairs.map((p) => p.de)));
    setEnCol(shuffledColumn(item.pairs.map((p) => p.en)));
    setSelectedDe(null);
    setMatched(new Set());
    setFlash(null);
    setMisses(0);
    setState(null);
  }, [item.id, item.pairs]);

  const total4 = item.pairs.length;
  const allMatched = matched.size === total4;

  const pickDe = (pairIndex) => {
    if (state || matched.has(pairIndex)) return;
    setFlash(null);
    setSelectedDe(pairIndex);
  };

  const pickEn = (pairIndex) => {
    if (state || matched.has(pairIndex) || selectedDe == null) return;
    if (selectedDe === pairIndex) {
      setMatched((prev) => new Set(prev).add(pairIndex));
      setSelectedDe(null);
    } else {
      const wrongDe = selectedDe;
      setMisses((m) => m + 1);
      setFlash({ de: wrongDe, en: pairIndex });
      setSelectedDe(null);
      window.setTimeout(() => setFlash((f) => (f && f.de === wrongDe && f.en === pairIndex ? null : f)), 500);
    }
  };

  const submit = () => {
    if (!allMatched || state) return;
    const result = misses > 0 ? RESULT.TYPO : RESULT.CORRECT;
    setState({ result });
    onResult(item, { result, correct: true, errorTag: misses > 0 ? 'Wortschatz' : null });
  };

  const tileClass = (on, wrong, done) =>
    `flex min-h-11 w-full items-center justify-between gap-2 rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold transition-all duration-100 ease-snap disabled:opacity-70 motion-reduce:transition-none ${
      done
        ? 'border-siegel bg-siegel-wash text-siegel-deep'
        : wrong
          ? 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink'
          : on
            ? 'border-siegel bg-siegel text-white shadow-raise-siegel'
            : 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none'
    }`;

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
        {t('stage.derived.eyebrow', lang, { n: index + 1, total })}
      </p>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('match.instructions', lang)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {deCol.map(({ value, pairIndex }) => {
              const done = matched.has(pairIndex);
              const on = selectedDe === pairIndex;
              const wrong = flash && flash.de === pairIndex;
              return (
                <button
                  key={pairIndex}
                  type="button"
                  disabled={!!state || done}
                  aria-pressed={on}
                  aria-label={t('match.germanLabel', lang, { n: pairIndex + 1 })}
                  onClick={() => pickDe(pairIndex)}
                  className={tileClass(on, wrong, done)}
                  lang="de"
                >
                  <span>{value}</span>
                  {done && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {wrong && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {enCol.map(({ value, pairIndex }) => {
              const done = matched.has(pairIndex);
              const wrong = flash && flash.en === pairIndex;
              return (
                <button
                  key={pairIndex}
                  type="button"
                  disabled={!!state || done}
                  aria-label={t('match.englishLabel', lang, { n: pairIndex + 1 })}
                  onClick={() => pickEn(pairIndex)}
                  className={tileClass(false, wrong, done)}
                >
                  <span>{value}</span>
                  {done && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {wrong && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {!state && (
        <div className="mt-6 flex justify-end">
          <Button onClick={submit} size="lg" disabled={!allMatched} className="w-full sm:w-auto">{t('action.check', lang)}</Button>
        </div>
      )}

      <FeedbackSheet result={state && state.result} onContinue={onNext} />
    </div>
  );
}
