import { useState } from 'react';
import CheckedChoice from './CheckedChoice.jsx';
import { matchOutcome } from '../../lib/lesson/check.js';
import { optionOrder } from '../../lib/lesson/optionOrder.js';
import { partEyebrow, t, useLessonLang } from '../../lib/lesson/strings.js';

/** One checked pairing at a time, retaining first-response evidence for the whole match. */
export default function GuidedMatchItem({ item, index, total, part = null, onResult, onNext }) {
  const [lang] = useLessonLang();
  const [pairIndex, setPairIndex] = useState(0);
  const [confused, setConfused] = useState([]);
  const pair = item.pairs[pairIndex];
  const question = {
    id: `${item.id}:${pairIndex}`, type: 'multiple_choice',
    promptDe: `Was bedeutet „${pair.de}“? Wählen Sie die Bedeutung.`,
    promptEn: `What does “${pair.de}” mean? Choose the meaning.`,
    // The English meaning is the task itself, so it stays English in Deutsch-Modus and says so to a screen reader.
    optionsLang: 'en',
    options: optionOrder(item.pairs.map((p) => p.en), `${item.id}:${pairIndex}`), answer: pair.en, accepted: [pair.en],
    explanationDe: `Das Wortpaar ist: ${pair.de} – ${pair.en}.`,
    explanationEn: `The word pair is: ${pair.de} – ${pair.en}.`,
  };
  return <div>
    <h2 className="mb-4 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">{partEyebrow(part, t('stage.derived.eyebrow', lang, { n: index + 1, total }), lang)}</h2>
    <CheckedChoice key={question.id} item={question} lang={lang} hintFirst
      onResult={(_, outcome) => { if (!outcome.correct) setConfused((prev) => [...prev, pair]); }}
      onNext={() => {
        if (pairIndex + 1 < item.pairs.length) setPairIndex(pairIndex + 1);
        else { onResult(item, matchOutcome(confused)); onNext(); }
      }} />
  </div>;
}
