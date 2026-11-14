import { useState } from 'react';
import StageShell from './StageShell.jsx';
import Button from '../ui/Button.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import { checkAnswer, checkOptionsFor, RESULT } from '../../lib/lesson/check.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** The saved itemIndex identifies each member/check, including turns inside a group. */
export default function TaughtSetStage({ stage, itemIndex, lektionId, results = {}, onSayResult, onItemChange, onResult, onDone, onBack }) {
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
  const member = step.member;
  const ready = member ? heard && said : !!verdict;
  return <StageShell title={stage.set[lang === 'de' ? 'titleDe' : 'titleEn']} onBack={onBack}
    primaryLabel={t('action.next', lang)} primaryDisabled={!ready} onPrimary={next}>
    <p className="mb-4 text-sm text-graphite">{t('set.group', lang, { n: step.group + 1 })}</p>
    {member ? <>
      {step.rule && <p className="mb-4 text-sm text-ink" lang={lang}>{step.rule[lang]}</p>}
      <p className="font-display text-4xl text-siegel" lang="de">{member.written}</p>
      <p className="my-3 text-xl text-ink" lang="de">{member.said}</p>
      {member.noteDe && <p className="mb-3 text-sm text-graphite">{lang === 'de' ? member.noteDe : member.noteEn}</p>}
      <PlayButton lektionId={lektionId} audioKey={`${stage.key}-${itemIndex}`} text={member.said} onPlayed={() => setHeard(true)} onFallback={() => setHeard(true)} />
      {heard && <ReadAloudLine lektionId={lektionId} lineKey={`${stage.key}-${itemIndex}`} text={member.said} onResult={(r) => { setSaid(true); onSayResult?.(itemIndex, r); }} />}
    </> : <>
      <h2 className="mb-3 text-xl font-semibold text-ink" lang="de">{item.promptDe}</h2>
      {lang !== 'de' && <p className="mb-4 text-sm text-graphite" lang="en">{item.promptEn}</p>}
      <PlayButton lektionId={lektionId} audioKey={item.id} text={item.audioText} onPlayed={() => setHeard(true)} onFallback={() => { setHeard(true); setFallback(true); }} />
      {fallback && <p className="mt-3 text-sm text-ink" lang="de">{item.audioText}</p>}
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
