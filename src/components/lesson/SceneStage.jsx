import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import SituationScene from '../illustrations/SituationScene.jsx';
import { GlossLine } from './DialogStage.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import LangToggle from './LangToggle.jsx';
import { buildLexicon, parseLektionId } from '../../lib/lesson/gloss.js';
import CheckedChoice from './CheckedChoice.jsx';
import { SCENE_PHASES } from '../../lib/lesson/buildGuided.js';
import { sayText } from '../../lib/lesson/scene.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** A checked response between every 2–3 lines. Position is owned/saved by the player. */
export default function SceneStage({ stage, lektionId, itemIndex, onItemChange, results, onSayResult, onResult, onBack, onDone, names = {}, onNamesChange }) {
  const [lang] = useLessonLang();
  const [openGloss, setOpenGloss] = useState(null);
  const index = Math.min(Math.floor(itemIndex / SCENE_PHASES.length), stage.chunks.length - 1);
  const phase = SCENE_PHASES[itemIndex % SCENE_PHASES.length];
  const chunk = stage.chunks[index];
  const parsed = useMemo(() => parseLektionId(lektionId), [lektionId]);
  const lexicon = useMemo(() => parsed ? buildLexicon(parsed.level, parsed.nr) : [], [parsed]);
  const ownName = names[chunk.say.ownName] || '';
  const spoken = sayText(chunk.say, ownName);
  const done = !!results[index];
  const next = () => itemIndex + 1 < stage.chunks.length * SCENE_PHASES.length ? onItemChange(itemIndex + 1) : onDone();
  const back = itemIndex > 0 ? () => onItemChange(itemIndex - 1) : onBack;
  // The preceding original dialogue line is the cue, including across a chunk boundary.
  const cue = chunk.cue;
  const shown = phase === 'hear' ? chunk.lines : phase === 'say' && cue ? [cue] : [];

  useEffect(() => {
    if (!openGloss) return undefined;
    const close = () => setOpenGloss(null);
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', key); };
  }, [openGloss]);

  return (
    <section className="text-nacht-text">
      <SituationScene lektionId={lektionId} className="w-full rounded-3xl border border-rule object-cover" />
      <div className="my-3 flex items-center justify-between gap-3"><p className="font-data text-xs text-nacht-muted">{t('scene.chunk', lang, { n: index + 1, total: stage.chunks.length })}</p><LangToggle /></div>
      {phase === 'hear' && <h1 className="mb-3 font-display text-2xl font-semibold text-siegel">{t('scene.hear', lang)}</h1>}
      {shown.length > 0 && <ol className="space-y-3">
        {shown.map((line) => <li key={line.index}>
          <Card className="rounded-3xl border border-nacht-rule p-4">
            <p className="font-data text-xs text-nacht-muted">{line.speaker}</p>
            <GlossLine line={line.de} lineIndex={line.index} lexicon={lexicon} lang={lang} openGloss={openGloss} setOpenGloss={setOpenGloss} />
            {lang !== 'de' && <p className="mt-1 mb-3 text-sm text-graphite" lang="en">{line.en}</p>}
            <PlayButton lektionId={lektionId} audioKey={`line-${line.index}`} text={line.de} />
          </Card>
        </li>)}
      </ol>}
      {phase === 'meaning' && <CheckedChoice hintFirst key={chunk.meaning.id} item={chunk.meaning} lang={lang} onResult={onResult} onNext={next} />}
      {phase === 'say' && <div className="mt-5">
        <h1 className="mb-4 font-display text-3xl font-semibold text-siegel">{t('scene.say', lang)}</h1>
        {chunk.say.ownName && <label className="mb-4 block text-sm font-semibold text-nacht-text">
          {t(chunk.say.ownName === 'surname' ? 'scene.surname' : 'scene.name', lang)}
          <input value={ownName} maxLength={80} autoComplete="off" onChange={(e) => { onNamesChange?.({ ...names, [chunk.say.ownName]: e.target.value }); onSayResult(index, null); }} className="mt-2 block min-h-11 w-full rounded-xl border border-rule bg-white px-3 py-2 text-ink" />
        </label>}
        {spoken ? <ReadAloudLine key={`${index}:${spoken}`} guided lektionId={lektionId} lineKey={`scene-${index + 1}-say`} text={spoken} onResult={(r) => onSayResult(index, r)} /> : <Card className="p-5"><p>{t('scene.enterName', lang)}</p></Card>}
        {done && <p className="mt-3 text-sm font-bold" role="status">{results[index].usedMic && typeof results[index].pct === 'number' ? t('speaking.intelligibility', lang, { pct: Math.round(results[index].pct * 100) }) : t('speaking.said', lang)}</p>}
        <Button variant="coral" className="mt-5 w-full" disabled={!done} onClick={next}>{t('action.next', lang)}</Button>
      </div>}
      {phase === 'hear' && <Button variant="coral" className="mt-5 w-full" onClick={next}>{t('scene.meaning', lang)}</Button>}
      {back && <button type="button" className="mt-4 min-h-11 text-sm font-bold text-graphite" onClick={back}>{t('shell.back', lang)}</button>}
    </section>
  );
}
