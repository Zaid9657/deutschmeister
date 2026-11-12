import { useState } from 'react';
import StageShell from './StageShell.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import { sayText } from '../../lib/lesson/scene.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

export default function FluencyStage({ stage, lektionId, itemIndex, names, onNamesChange, results, onSayResult, onNext, onBack }) {
  const [lang] = useLessonLang();
  const [show, setShow] = useState(false);
  const line = stage.lines[itemIndex];
  const text = sayText(line, names[line.ownName]);
  return <StageShell eyebrow={t('fluency.cue', lang, { n: itemIndex + 1, total: stage.lines.length })}
    title={t('fluency.title', lang)} lead={t('fluency.lead', lang)} onBack={onBack}
    primaryLabel={t('action.next', lang)} primaryDisabled={!results[itemIndex]} onPrimary={onNext}>
    <p className="mb-4 text-sm text-graphite">{t('fluency.progress', lang, { n: Object.values(results).filter(Boolean).length, total: stage.lines.length })}</p>
    {line.cue && <p className="mb-4 text-sm text-ink">{lang === 'de' ? line.cue.de : line.cue.en}</p>}
    {line.ownName && <label className="mb-4 block text-sm">{t('fluency.name', lang)}
      <input className="mt-2 min-h-11 w-full rounded-xl border border-rule px-3 text-ink" maxLength={80} value={names[line.ownName] || ''} autoComplete="off"
        onChange={(e) => { onNamesChange({ ...names, [line.ownName]: e.target.value }); onSayResult(itemIndex, null); }} />
    </label>}
    {text && <>
      {!show && <button type="button" className="mb-4 min-h-11 font-bold text-siegel-deep underline" onClick={() => setShow(true)}>{t('fluency.show', lang)}</button>}
      <ReadAloudLine lektionId={lektionId} lineKey={`fluency-${itemIndex}`} text={text} hideModel={!show} onResult={(r) => { onSayResult(itemIndex, r); setShow(true); }} />
    </>}
  </StageShell>;
}
