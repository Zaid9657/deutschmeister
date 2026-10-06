import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { matchOutcome } from '../../lib/lesson/check.js';
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
 * "Check", then FeedbackSheet, then "Continue"). A wrong tap never COMMITS a
 * pairing (it flashes and resets), so "Check" only becomes available once every
 * pair is matched — and `onResult` fires exactly once, the way every other item
 * does.
 *
 * What it records (check.js `matchOutcome`): any wrong pair makes the exercise
 * complete but NOT first-try correct (`corrected`, Wortschatz, with the pairs
 * that were confused) — never "just a typo", which is what it used to say.
 *
 * Accessibility: a tile's name IS its visible word (an earlier "German word 3" /
 * "English translation 3" label hid the vocabulary from screen readers and gave
 * the pairing away, since both columns were numbered by pair). State is said in
 * words, never by colour alone: an sr-only "selected" / "matched with …", a
 * check or X icon, and one polite live region that stays mounted and announces
 * each selection, pair and miss. A matched tile stays focusable
 * (aria-disabled), and focus moves on to the next unmatched German word.
 */
export default function MatchItem({ item, index, total, onResult, onNext, eyebrowKey = 'stage.derived.eyebrow' }) {
  const [lang] = useLessonLang();
  const [deCol, setDeCol] = useState(() => shuffledColumn(item.pairs.map((p) => p.de)));
  const [enCol, setEnCol] = useState(() => shuffledColumn(item.pairs.map((p) => p.en)));
  const [selectedDe, setSelectedDe] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [flash, setFlash] = useState(null); // { de, en } pairIndexes of a wrong tap, or null
  const [confused, setConfused] = useState(() => new Set()); // pairIndexes of German words that met a wrong pair
  const [announce, setAnnounce] = useState('');
  const [state, setState] = useState(null);
  const deRefs = useRef(new Map());

  useEffect(() => {
    setDeCol(shuffledColumn(item.pairs.map((p) => p.de)));
    setEnCol(shuffledColumn(item.pairs.map((p) => p.en)));
    setSelectedDe(null);
    setMatched(new Set());
    setFlash(null);
    setConfused(new Set());
    setAnnounce('');
    setState(null);
  }, [item.id, item.pairs]);

  const pairCount = item.pairs.length;
  const allMatched = matched.size === pairCount;

  const pickDe = (pairIndex) => {
    if (state || matched.has(pairIndex)) return;
    setFlash(null);
    setSelectedDe(pairIndex);
    setAnnounce(t('match.announce.select', lang, { de: item.pairs[pairIndex].de }));
  };

  const pickEn = (pairIndex) => {
    if (state || matched.has(pairIndex) || selectedDe == null) return;
    const de = item.pairs[selectedDe].de;
    if (selectedDe === pairIndex) {
      const next = new Set(matched).add(pairIndex);
      setMatched(next);
      setSelectedDe(null);
      setAnnounce(t('match.announce.pair', lang, { de, en: item.pairs[pairIndex].en }));
      // Keep the keyboard on the task: the next German word still to match.
      const nextDe = deCol.find((d) => !next.has(d.pairIndex));
      if (nextDe) deRefs.current.get(nextDe.pairIndex)?.focus();
    } else {
      const wrongDe = selectedDe;
      setConfused((prev) => new Set(prev).add(wrongDe));
      setFlash({ de: wrongDe, en: pairIndex });
      setSelectedDe(null);
      setAnnounce(t('match.announce.miss', lang, { de, en: item.pairs[pairIndex].en }));
      deRefs.current.get(wrongDe)?.focus();
      window.setTimeout(() => setFlash((f) => (f && f.de === wrongDe && f.en === pairIndex ? null : f)), 500);
    }
  };

  const confusedPairs = [...confused].map((i) => item.pairs[i]);

  const submit = () => {
    if (!allMatched || state) return;
    const outcome = matchOutcome(confusedPairs);
    setState({ result: outcome.result });
    onResult(item, outcome);
  };

  const tileClass = (on, wrong, done) =>
    `flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold [overflow-wrap:anywhere] [touch-action:manipulation] transition-[transform,box-shadow] duration-100 ease-snap motion-reduce:transition-none ${
      done
        ? 'cursor-default border-siegel bg-siegel-wash text-siegel-deep'
        : wrong
          ? 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink'
          : on
            ? 'border-siegel bg-siegel text-white shadow-raise-siegel'
            : 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none'
    }`;

  const reviewHint = state && confusedPairs.length
    ? t('match.reviewPairs', lang, { pairs: confusedPairs.map((p) => `${p.de} = ${p.en}`).join(' · ') })
    : null;

  return (
    <div className={state ? 'pb-36 sm:pb-0' : ''}>
      <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
        {t(eyebrowKey, lang, { n: index + 1, total })}
      </h2>
      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">{t('match.instructions', lang)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div role="group" aria-label={t('match.germanGroup', lang)} className="flex min-w-0 flex-col gap-2">
            {deCol.map(({ value, pairIndex }) => {
              const done = matched.has(pairIndex);
              const on = selectedDe === pairIndex;
              const wrong = flash && flash.de === pairIndex;
              return (
                <button
                  key={pairIndex}
                  ref={(el) => { if (el) deRefs.current.set(pairIndex, el); else deRefs.current.delete(pairIndex); }}
                  type="button"
                  aria-disabled={!!state || done}
                  aria-pressed={on}
                  onClick={() => pickDe(pairIndex)}
                  className={tileClass(on, wrong, done)}
                >
                  <span lang="de">{value}</span>
                  {done && <span className="sr-only">, {t('match.matchedWith', lang, { other: item.pairs[pairIndex].en })}</span>}
                  {done && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {wrong && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div role="group" aria-label={t('match.englishGroup', lang)} className="flex min-w-0 flex-col gap-2">
            {enCol.map(({ value, pairIndex }) => {
              const done = matched.has(pairIndex);
              const wrong = flash && flash.en === pairIndex;
              return (
                <button
                  key={pairIndex}
                  type="button"
                  aria-disabled={!!state || done}
                  onClick={() => pickEn(pairIndex)}
                  className={tileClass(false, wrong, done)}
                >
                  <span lang="en">{value}</span>
                  {done && <span className="sr-only">, {t('match.matchedWith', lang, { other: item.pairs[pairIndex].de })}</span>}
                  {done && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {wrong && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{announce}</p>
      </Card>

      {!state && (
        <div className="mt-6 flex justify-end">
          <Button onClick={submit} size="lg" disabled={!allMatched} className="w-full sm:w-auto">{t('action.check', lang)}</Button>
        </div>
      )}

      <FeedbackSheet result={state && state.result} hint={reviewHint} onContinue={onNext} />
    </div>
  );
}
