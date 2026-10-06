import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FeedbackSheet from './FeedbackSheet.jsx';
import { RESULT } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { levelOfLektion, supportKeys } from '../../lib/lesson/support.js';
import { useSupport } from './SupportText.jsx';
import { inline } from './richText.jsx';

/**
 * Display-order shuffle for the two columns (Fisher–Yates). This has no
 * grading consequence — `item.pairs` is already drawn deterministically by
 * `derivedItems` (buildLesson.js) — it only decides which row each tile sits
 * in on screen, so plain `Math.random` is fine here.
 */
function shuffledColumn(values) {
  const out = values.map((value, pairIndex) => ({ value, pairIndex }));
  // `value` is only the shuffle's payload; what a tile SHOWS is read at render
  // time (German from the pair, the meaning from the support lookup), so a
  // language switch mid-item relabels the tiles without reshuffling them.
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
 *
 * Accessible names are the VISIBLE words. The tiles used to be named "German
 * word 3" / "English translation 3" — a hidden pairing number that told a
 * screen-reader user nothing about the word and, worse, gave the answer away
 * (3 goes with 3). Selection, a match and a miss are announced in a polite
 * live region, in words.
 *
 * The meaning column is in the learner's interface language: English, German
 * (Deutsch-Modus keeps the English glosses — the Wortfeld has no German
 * definitions), or Arabic from the sidecar (src/lib/lesson/support.js). The
 * pairs themselves are drawn so that no two meanings are the same in any
 * language (buildLesson.js + tests/arabic-coverage.test.mjs), so a match is
 * always uniquely gradable.
 */
export default function MatchItem({ item, index, total, lektionId, onResult, onNext }) {
  const [lang] = useLessonLang();
  const support = useSupport(levelOfLektion(lektionId));
  const meaningOf = (pair) => support(pair.wordId ? supportKeys.word(pair.wordId) : null, { en: pair.en });
  const [announce, setAnnounce] = useState('');
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
    setAnnounce('');
  }, [item.id, item.pairs]);

  const total4 = item.pairs.length;
  const allMatched = matched.size === total4;

  const pickDe = (pairIndex) => {
    if (state || matched.has(pairIndex)) return;
    setFlash(null);
    setSelectedDe(pairIndex);
    setAnnounce(t('match.selected', lang, { word: item.pairs[pairIndex].de }));
  };

  const pickEn = (pairIndex) => {
    if (state || matched.has(pairIndex)) return;
    if (selectedDe == null) {
      setAnnounce(t('match.pickGermanFirst', lang));
      return;
    }
    const de = item.pairs[selectedDe].de;
    const meaning = meaningOf(item.pairs[pairIndex]).text;
    if (selectedDe === pairIndex) {
      setMatched((prev) => new Set(prev).add(pairIndex));
      setSelectedDe(null);
      setAnnounce(t('match.matchedAnnounce', lang, { word: de, meaning }));
    } else {
      const wrongDe = selectedDe;
      setMisses((m) => m + 1);
      setFlash({ de: wrongDe, en: pairIndex });
      setSelectedDe(null);
      setAnnounce(t('match.missAnnounce', lang, { word: de, meaning }));
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
    `flex min-h-11 w-full items-center justify-between gap-2 rounded-clay border px-4 py-2.5 text-start text-[0.9375rem] font-bold transition-all duration-100 ease-snap disabled:opacity-70 motion-reduce:transition-none ${
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
                  onClick={() => pickDe(pairIndex)}
                  className={tileClass(on, wrong, done)}
                  lang="de"
                  dir="ltr"
                >
                  <span>{value}</span>
                  {done && <span className="sr-only" lang={lang}>{t('match.matchedState', lang)}</span>}
                  {done && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {wrong && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {enCol.map(({ pairIndex }) => {
              const done = matched.has(pairIndex);
              const wrong = flash && flash.en === pairIndex;
              const meaning = meaningOf(item.pairs[pairIndex]);
              return (
                <button
                  key={pairIndex}
                  type="button"
                  disabled={!!state || done}
                  onClick={() => pickEn(pairIndex)}
                  className={tileClass(false, wrong, done)}
                  lang={meaning.lang}
                  dir={meaning.lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {/* German quoted inside an Arabic meaning («ich bin am … geboren») is isolated like everywhere else. */}
                  <span>{meaning.lang === 'ar' ? inline(meaning.text, { rtl: true }) : meaning.text}</span>
                  {done && <span className="sr-only" lang={lang}>{t('match.matchedState', lang)}</span>}
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

      <p className="sr-only" aria-live="polite" lang={lang}>{announce}</p>
      <FeedbackSheet result={state && state.result} onContinue={onNext} />
    </div>
  );
}
