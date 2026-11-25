import { useEffect, useMemo, useState } from 'react';
import StageShell from './StageShell.jsx';
import Card from '../ui/Card.jsx';
import { GlossLine } from './DialogStage.jsx';
import CheckedChoice from './CheckedChoice.jsx';
import PlayButton from './PlayButton.jsx';
import { readLexicon, seriesText } from '../../lib/lesson/guidedRead.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** A closed series the check asks for later (numbers, months): each member with its word, and the whole list to hear. */
function Series({ series, lektionId, lang }) {
  const note = lang === 'de' ? series.noteDe : series.noteEn;
  return <Card className="mb-6 p-5">
    <h2 className="font-display text-lg font-semibold text-siegel">{lang === 'de' ? series.titleDe : series.titleEn}</h2>
    {note && <p className="mt-1 text-sm text-graphite">{note}</p>}
    <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
      {series.items.map((x) => <li key={x.label} className="flex items-baseline gap-2 text-[0.9375rem]">
        <span className="w-8 shrink-0 text-right font-data text-xs text-graphite">{x.label}</span><span lang="de">{x.de}</span>
      </li>)}
    </ol>
    <div className="mt-3"><PlayButton lektionId={lektionId} audioKey="read-series" text={seriesText(series)} rate={0.85} label={t('action.listen', lang)} /></div>
  </Card>;
}

export default function ReadStage({ stage, lektionId, itemIndex, onItemChange, onResult, onBack, onDone }) {
  const [lang] = useLessonLang();
  const [openGloss, setOpenGloss] = useState(null);
  const lexicon = useMemo(() => readLexicon(stage.glossary), [stage.glossary]);
  useEffect(() => {
    const close = () => setOpenGloss(null);
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', key); };
  }, []);
  return <StageShell eyebrow={t('read.title', lang)} part={stage.part} title={lang === 'de' ? stage.titleDe : stage.titleEn}
    lead={lang === 'de' ? stage.instructionDe : stage.instructionEn} onBack={onBack}
    primaryLabel={itemIndex === 0 ? t('action.next', lang) : undefined}
    onPrimary={itemIndex === 0 ? () => onItemChange(1) : undefined}>
    <Card className="mb-6 space-y-3 p-5">
      {stage.text.split('\n').map((line, i) => <GlossLine key={i} line={line} lineIndex={`read-${i}`} lexicon={lexicon} lang={lang} openGloss={openGloss} setOpenGloss={setOpenGloss} />)}
    </Card>
    {itemIndex === 0 && stage.series && <Series series={stage.series} lektionId={lektionId} lang={lang} />}
    {itemIndex > 0 && <CheckedChoice key={stage.items[itemIndex - 1].id} item={stage.items[itemIndex - 1]} lang={lang} onResult={onResult}
      onNext={() => itemIndex < stage.items.length ? onItemChange(itemIndex + 1) : onDone()} />}
  </StageShell>;
}
