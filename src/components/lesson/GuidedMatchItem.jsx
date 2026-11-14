import { meaningChoice } from '../../lib/lesson/derivedChoices.js';
import { useState } from 'react';
import CheckedChoice from './CheckedChoice.jsx';
import { matchOutcome } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** One checked pairing at a time, retaining first-response evidence for the whole match. */
export default function GuidedMatchItem({ item, index, total, onResult, onNext }) {
  const [lang] = useLessonLang();
  const [pairIndex, setPairIndex] = useState(0);
  const [confused, setConfused] = useState([]);
  const pair = item.pairs[pairIndex];
  const question = meaningChoice(pair, item.pairs, `${item.id}:${pairIndex}`);
  return <div>
    <h2 className="mb-4 font-data text-xs text-siegel-deep">{t('stage.derived.eyebrow', lang, { n: index + 1, total })}</h2>
    <CheckedChoice key={question.id} item={question} lang={lang} hintFirst
      onResult={(_, outcome) => { if (!outcome.correct) setConfused((prev) => [...prev, pair]); }}
      onNext={() => {
        if (pairIndex + 1 < item.pairs.length) setPairIndex(pairIndex + 1);
        else { onResult(item, matchOutcome(confused)); onNext(); }
      }} />
  </div>;
}
