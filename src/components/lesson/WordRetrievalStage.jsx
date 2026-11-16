import WortfeldStage from './WortfeldStage.jsx';
import StageShell from './StageShell.jsx';
import CheckedChoice from './CheckedChoice.jsx';
import ListenSelectItem from './ListenSelectItem.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** The player owns the saved cards/check position; paging cannot skip retrieval. */
export default function WordRetrievalStage({ stage, itemIndex, lektionId, onItemChange, onResult, onDone, onBack }) {
  const [lang] = useLessonLang();
  const step = stage.steps[itemIndex] || stage.steps[0];
  const next = () => itemIndex + 1 < stage.steps.length ? onItemChange(itemIndex + 1) : onDone();
  const back = itemIndex > 0 ? () => onItemChange(itemIndex - 1) : onBack;
  if (step.kind === 'cards') return <WortfeldStage key={itemIndex} stage={{ ...stage, words: step.words }} lektionId={lektionId} onBack={back} onDone={next} />;
  return <StageShell title={t('stage.wortfeld.retrieval', lang)} onBack={back}>
    {step.item.type === 'listen_select'
      ? <ListenSelectItem key={step.item.id} item={step.item} lektionId={lektionId} index={step.group} total={stage.steps.filter((s) => s.kind === 'cards').length} onResult={onResult} onNext={next} hintFirst allowTextFallback />
      : <CheckedChoice key={step.item.id} item={step.item} lang={lang} onResult={onResult} onNext={next} hintFirst allowTextFallback />}
  </StageShell>;
}
