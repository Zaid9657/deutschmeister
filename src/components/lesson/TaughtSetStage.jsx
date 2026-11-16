import { useState } from 'react';
import SetBoard from './SetBoard.jsx';
import { spellingMembers } from '../../lib/lesson/taughtSet.js';
import StageShell from './StageShell.jsx';
import Button from '../ui/Button.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import { checkAnswer, checkOptionsFor, RESULT } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** The saved itemIndex identifies each board/check; learner names exist only in memory. */
export default function TaughtSetStage({ stage, itemIndex, lektionId, results = {}, onSayResult, onItemChange, onResult, onDone, onBack, names = {}, onNamesChange }) {
  const [lang] = useLessonLang();
  const [heard, setHeard] = useState(!!results[itemIndex]);
  const [said, setSaid] = useState(!!results[itemIndex]);
  const [fallback, setFallback] = useState(false);
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState(null);
  const step = stage.steps[itemIndex] || stage.steps[0];
  const item = step.item;
  const next = () => itemIndex + 1 < stage.steps.length ? onItemChange(itemIndex + 1) : onDone();
  const check = () => {
    if (!heard || !value.trim() || verdict) return;
    const result = checkAnswer(value, item.accepted, checkOptionsFor(item));
    setVerdict(result);
    onResult(item, { result: result.result, correct: result.result !== RESULT.WRONG, listened: !fallback });
  };
  const own = step.kind === 'own-name';
  const surname = names.surname ?? (names.full || '').trim().split(/\s+/).at(-1) ?? '';
  const members = own ? spellingMembers(surname, stage.set) : step.members;
  const supported = !own || (members.length > 0 && members.every((m) => m.supported));
  const speech = members?.map((m) => m.audio || m.said).join('. ');
  const ready = members ? supported && heard && said : !!verdict;
  const back = itemIndex > 0 ? () => onItemChange(itemIndex - 1) : onBack;
  return <StageShell title={stage.set[lang === 'de' ? 'titleDe' : 'titleEn']} onBack={back}
    primaryLabel={t('action.next', lang)} primaryDisabled={!ready} onPrimary={next}>
    {!own && <p className="mb-4 text-sm text-graphite">{t('set.group', lang, { n: step.group + 1 })}</p>}
    {members ? <>
      {step.rule && <p className="mb-4 text-sm text-ink" lang={lang}>{step.rule[lang]}</p>}
      {own && <>
        <h2 className="font-display text-2xl text-siegel">{t('set.ownName', lang)}</h2>
        <label className="mt-3 block text-sm font-semibold">{t('scene.surname', lang)}
          <input value={surname} maxLength={80} autoComplete="off" onChange={(e) => { onNamesChange?.({ ...names, surname: e.target.value }); setHeard(false); setSaid(false); }} className="mt-2 block min-h-11 w-full rounded-xl border border-rule bg-white p-3" />
        </label>
        {!supported && <p className="mt-3 text-sm text-graphite">{t('set.nameLetters', lang)}</p>}
      </>}
      <SetBoard members={members} lektionId={lektionId} boardKey={`${stage.key}-${itemIndex}`} lang={lang} />
      {supported && <PlayButton lektionId={lektionId} audioKey={`${stage.key}-${itemIndex}`} text={speech} onPlayed={() => setHeard(true)} onFallback={() => setHeard(true)} />}
      {supported && heard && <ReadAloudLine hideModel key={speech} lektionId={lektionId} lineKey={`${stage.key}-${itemIndex}`} text={speech} onResult={(r) => { setSaid(true); if (own) onNamesChange?.({ ...names, surname }); else onSayResult?.(itemIndex, r); }} />}
    </> : <>
      <h2 className="mb-3 text-xl font-semibold text-ink" lang="de">{item.promptDe}</h2>
      {lang !== 'de' && <p className="mb-4 text-sm text-graphite" lang="en">{item.promptEn}</p>}
      <PlayButton lektionId={lektionId} audioKey={item.id} text={item.audioText} onPlayed={() => setHeard(true)} onFallback={() => { setHeard(true); setFallback(true); }} />
      {fallback && <p className="mt-3 text-sm text-ink" lang="de">{item.audioDisplayText || item.audioText}</p>}
      {heard && <>
        <label className="mt-4 block text-sm font-semibold">{t('proof.answer', lang)}
          {item.options ? <select value={value} disabled={!!verdict} onChange={(e) => setValue(e.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-rule bg-white p-3"><option value="" />{item.options.map((o) => <option key={o}>{o}</option>)}</select>
            : <input value={value} disabled={!!verdict} autoComplete="off" onChange={(e) => setValue(e.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-rule bg-white p-3" />}
        </label>
        <p role="status" className="mt-3 text-sm text-ink">{verdict && t(`scene.${verdict.result === RESULT.WRONG ? 'correction' : 'correct'}`, lang, { answer: item.answer })}</p>
        {!verdict && <Button className="mt-4" disabled={!value.trim()} onClick={check}>{t('action.check', lang)}</Button>}
      </>}
    </>}
  </StageShell>;
}
