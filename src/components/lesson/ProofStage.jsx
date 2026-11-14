import SetReference from './SetReference.jsx';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canDoLines } from '../../lib/course/canDo.js';
import { judgeProof, proofHint, proofItem, proofPassed, proofPosition, proofTaskFor } from '../../lib/lesson/proof.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import LangToggle from './LangToggle.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';

/** Position, retries and evidence belong to the saved run, never to this screen's text input. */
export default function ProofStage({ stage, lesson, state, onAnswer, onHideModel, onDone, onBack, names, onNamesChange }) {
  const [lang] = useLessonLang();
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [listenHeard, setListenHeard] = useState(false);
  // The device could not play German (PlayButton's failure state): the learner may read the stimulus.
  const [readInstead, setReadInstead] = useState(false);
  const [mic, setMic] = useState(false);
  const [missed, setMissed] = useState(null);
  const passed = proofPassed(stage.tasks, state);
  const at = proofPosition(stage.tasks, state);
  const task = stage.tasks[at] ? proofTaskFor(stage.tasks[at], state.goals[at]) : null;
  const item = task ? proofItem(task, names) : null;
  const reteach = state.phase === 'reteach';
  const submit = (response) => {
    setMissed({ at, ...(response.kind === 'typed' ? judgeProof(task, response.value, names) : {}) });
    setValue(''); setMic(false); setListenHeard(false); setReadInstead(false); onAnswer(response);
  };
  const label = reteach ? 'proof.again' : passed ? 'action.next' : 'action.check';
  return <section className="text-nacht-text">
    <div className="mb-3 flex items-center justify-between gap-3"><p className="font-data text-xs text-nacht-muted">{passed ? t('proof.shown', lang) : t('proof.goal', lang, { n: at + 1, total: stage.tasks.length })}</p><LangToggle /></div>
    <h1 className="font-display text-2xl font-semibold text-siegel">{t(reteach ? 'proof.reteach' : 'proof.title', lang)}</h1>
    {task && <>
      <p className="mt-3 text-sm text-graphite">{canDoLines(lesson, lang)[task.canDo]?.replace(/„[^“]*“/g, '…')}</p>
      {/* Quoted solutions in can-do labels are hidden during retrieval. */}
      <Card className="mt-4 p-5">
        <h2 className="font-display text-xl text-ink" lang="de">{task.promptDe}</h2>
        {lang !== 'de' && <p className="mt-2 text-sm text-graphite" lang="en">{task.promptEn}</p>}
      </Card>
      {reteach ? <Card className="mt-4 p-5">
        <SetReference item={task} lektionId={lesson.id} />
        {(task.model.lines || [task.model]).map((line, i) => <div key={i} className="mb-3"><p lang="de" className="text-lg text-ink">{line.de}</p><p lang="en" className="mt-2 text-sm text-graphite">{line.en}</p><div className="mt-3"><PlayButton lektionId={lesson.id} audioKey={line.audioKey} text={line.de} /></div></div>)}
      </Card> : <>
        {task.ownName && (!task.listenSpelling || mic) && (task.ownName !== 'full' || mic) && <label className="mt-4 block text-sm font-semibold">
          {t(task.ownName === 'surname' ? 'scene.surname' : 'scene.name', lang)}
          <input maxLength={80} autoComplete="off" value={names[task.ownName] || ''} onChange={(e) => onNamesChange({ ...names, [task.ownName]: e.target.value })} className="mt-2 block min-h-11 w-full rounded-xl border border-rule bg-white px-3 py-2 text-ink" />
        </label>}
        {(task.listenSpelling || task.type === 'listening') && !mic && <div className="mt-4"><p className="mb-3 text-sm text-ink">{task.listenSpelling ? t('proof.spellingListen', lang) : (lang === 'de' ? 'Hören Sie zu. Ohne deutsche Stimme: Versuchen Sie es erneut oder mit einem anderen Gerät.' : 'Listen first. If no German voice is available, retry or use another device.')}</p><PlayButton lektionId={lesson.id} key={`${at}:${state.goals[at]?.tries || 0}`} audioKey={task.listenSpelling ? task.listening.audioKey : `proof-listening-${at}`} text={task.listenSpelling ? task.listening.text : task.audioText} onPlayed={() => setListenHeard(true)} onFallback={() => setReadInstead(true)} fallbackLabel={t('proof.readInstead', lang)} />
          {readInstead && !listenHeard && <div className="mt-3 rounded-xl border border-rule bg-white p-4"><p className="text-sm text-graphite">{t('proof.readNote', lang)}</p><p lang="de" className="mt-2 text-lg text-ink">{task.listenSpelling ? task.listening.text : task.audioText}</p></div>}
        </div>}
        {!mic && <label className="mt-4 block text-sm font-semibold" htmlFor="proof-answer">{t('proof.answer', lang)}
          {task.options ? <select id="proof-answer" value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-rule bg-white p-3"><option value="" />{task.options.map((option) => <option key={option}>{option}</option>)}</select>
            : <textarea id="proof-answer" lang="de" rows={3} value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 block w-full rounded-xl border border-rule bg-white p-3 text-ink" />}
        </label>}
        {mic && task.listenSpelling && <p className="mt-3 text-sm text-ink">{t('proof.spellingMic', lang)}</p>}
        {mic && task.listenSpelling && !item.spokenAnswer && <p className="mt-3 text-sm text-graphite">{t('proof.spellingName', lang)}</p>}
        {mic && (task.listenSpelling ? item.spokenAnswer : item.answer) && <div className="mt-4"><ReadAloudLine key={`${at}:${state.goals[at]?.tries || 0}:${item.answer}`} proof hideModel guided lektionId={lesson.id} lineKey={`proof-${at}`} text={item.spokenAnswer || item.answer} onResult={(result) => submit({ kind: 'mic', result })} /></div>}
        {state.phase === 'hint' && <p role="status" className="mt-4 font-semibold text-siegel-deep">{proofHint(task, missed?.at === at ? missed.part : null, missed?.at === at && missed.registerMiss)[lang]}</p>}
        {user && task.listenSpelling && !task.options && <button type="button" className="mt-3 min-h-11 text-sm font-bold text-graphite" onClick={() => setMic(!mic)}>{t(mic ? 'proof.type' : 'proof.mic', lang)}</button>}
      </>}
    </>}
    {(!mic || reteach || passed) && <Button className="mt-5 w-full" disabled={!passed && !reteach && (!value.trim() || ((task.listenSpelling || task.type === 'listening') ? !(listenHeard || readInstead) : task.ownName === 'surname' && !names.surname?.trim()))} onClick={passed ? onDone : reteach ? () => { setValue(''); onHideModel(); } : () => submit({ kind: 'typed', value, ...((task.listenSpelling || task.type === 'listening') ? { listened: listenHeard, readInstead: !listenHeard && readInstead } : {}) })}>{t(label, lang)}</Button>}
    {onBack && <button type="button" onClick={onBack} className="mt-4 min-h-11 text-sm font-bold text-graphite">{t('shell.back', lang)}</button>}
  </section>;
}
