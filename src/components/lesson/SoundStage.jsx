import { useState } from 'react';
import StageShell from './StageShell.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import CheckedChoice from './CheckedChoice.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

export default function SoundStage({ stage, itemIndex, lektionId, results, onSayResult, onResult, onNext, onBack }) {
  const [lang] = useLessonLang();
  const [heard, setHeard] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [checked, setChecked] = useState(false);
  const item = stage.items[itemIndex];
  const done = !!results[itemIndex];
  return <StageShell title={t('sound.title', lang)} lead={t('sound.lead', lang)} onBack={onBack}
    primaryLabel={t('action.next', lang)} primaryDisabled={!checked || !done} onPrimary={checked ? onNext : undefined}>
    <PlayButton lektionId={lektionId} audioKey={`sound-${itemIndex}`} text={item.text} onPlayed={() => setHeard(true)} onFallback={() => { setFallback(true); setHeard(true); }} />
    <p className="my-4 text-sm text-graphite">{lang === 'de' ? item.modelDe : item.modelEn}</p>
    {fallback && <p lang="de" className="my-4 font-semibold">{item.text}</p>}
    {heard && !checked && <CheckedChoice item={item} lang={lang} onResult={onResult} onNext={() => setChecked(true)} />}
    {checked && <div className="mt-5">
      <p className="mb-3 text-sm">{t('sound.say', lang)} <strong lang="de">{item.text}</strong></p>
      <ReadAloudLine lektionId={lektionId} lineKey={`sound-${itemIndex}`} text={item.text} onResult={(r) => onSayResult(itemIndex, r)} />
    </div>}
  </StageShell>;
}
