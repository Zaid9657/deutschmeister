import { useEffect, useMemo, useState } from 'react';
import StageShell from './StageShell.jsx';
import Card from '../ui/Card.jsx';
import { GlossLine } from './DialogStage.jsx';
import CheckedChoice from './CheckedChoice.jsx';
import { readLexicon } from '../../lib/lesson/guidedRead.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

export default function ReadStage({ stage, itemIndex, onItemChange, onResult, onBack, onDone }) {
  const [lang] = useLessonLang();
  const [openGloss, setOpenGloss] = useState(null);
  const lexicon = useMemo(() => readLexicon(stage.glossary), [stage.glossary]);
  useEffect(() => {
    const close = () => setOpenGloss(null);
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', key); };
  }, []);
  return <StageShell eyebrow={t('read.title', lang)} title={lang === 'de' ? stage.titleDe : stage.titleEn}
    lead={lang === 'de' ? stage.instructionDe : stage.instructionEn} onBack={onBack}
    primaryLabel={itemIndex === 0 ? t('action.next', lang) : undefined}
    onPrimary={itemIndex === 0 ? () => onItemChange(1) : undefined}>
    <Card className="mb-6 space-y-3 p-5">
      {stage.text.split('\n').map((line, i) => <GlossLine key={i} line={line} lineIndex={`read-${i}`} lexicon={lexicon} lang={lang} openGloss={openGloss} setOpenGloss={setOpenGloss} />)}
    </Card>
    {itemIndex > 0 && <CheckedChoice key={stage.items[itemIndex - 1].id} item={stage.items[itemIndex - 1]} lang={lang} onResult={onResult}
      onNext={() => itemIndex < stage.items.length ? onItemChange(itemIndex + 1) : onDone()} />}
  </StageShell>;
}
