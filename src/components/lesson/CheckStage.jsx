import { useMemo, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import OtterSays from '../illustrations/OtterSays.jsx';
import StageShell from './StageShell.jsx';
import PlayButton from './PlayButton.jsx';
import ReadAloudLine from './ReadAloudLine.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { checkSpeakingSupport } from '../speaking/mediaSupport.js';
import { RESULT } from '../../lib/lesson/check.js';
import { canDoShown, checkTurns, modelAnswer, spokenShown, spokenTarget, typedResult } from '../../lib/lesson/finalCheck.js';
import { canDoLines } from '../../lib/course/canDo.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

const SPOKEN_TRIES = 2;

/** One turn: Frau Kaya's line, the task, then a spoken or typed answer with one more try. */
function CheckTurn({ turn, n, total, lektion, canSpeak, onBack, onOutcome }) {
  const [lang] = useLessonLang();
  const de = lang === 'de';
  const [mode, setMode] = useState(canSpeak && !turn.spell ? 'speak' : 'type');
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [outcome, setOutcome] = useState(null); // 'shown' | 'missed'
  const [retry, setRetry] = useState(null); // null | 'typo' | 'retry'
  const [showLetters, setShowLetters] = useState(false);

  const submit = () => {
    const result = typedResult(turn, value);
    const ok = result === RESULT.CORRECT || (tries > 0 && result === RESULT.TYPO);
    if (ok) setOutcome('shown');
    else if (tries === 0) setRetry(result === RESULT.TYPO ? 'typo' : 'retry');
    else setOutcome('missed');
    setTries(tries + 1);
  };
  const spoken = (r) => {
    if (r.selfConfirmed) { setMode('type'); return; } // not measured: typing is the proof
    if (spokenShown(r)) setOutcome('shown');
    else if (r.attempts >= SPOKEN_TRIES) setMode('type'); // speech recognition may be the problem, not the learner
  };

  return (
    <StageShell
      eyebrow={t('check.eyebrow', lang, { n, total })}
      title={de ? turn.taskDe : turn.taskEn}
      onBack={onBack}
      primaryLabel={t('action.next', lang)}
      primaryDisabled={!outcome}
      onPrimary={() => onOutcome(outcome)}
    >
      {n === 1 && <OtterSays lektionId={lektion.id} className="mb-5">{t('otter.check.open', lang)}</OtterSays>}
      {turn.cue && (
        <Card tone="wash" className="mb-4 p-5">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Frau Kaya</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink" lang="de">{turn.cue.de}</p>
          <div className="mt-3"><PlayButton lektionId={lektion.id} audioKey={`check-cue-${n}`} text={turn.cue.de} label={t('action.listen', lang)} /></div>
        </Card>
      )}
      {turn.spell && (
        <Card tone="wash" className="mb-4 p-5">
          <PlayButton lektionId={lektion.id} audioKey={`check-spell-${n}`} text={turn.spoken} rate={0.7} label={t('action.listen', lang)} />
          {showLetters
            ? <p className="mt-3 text-[1.0625rem] text-ink" lang="de">{turn.letterNames}</p>
            : <button type="button" className="mt-3 min-h-11 text-sm font-bold text-siegel-deep underline" onClick={() => setShowLetters(true)}>{t('check.letters', lang)}</button>}
        </Card>
      )}

      {!outcome && mode === 'speak' && (
        <>
          <ReadAloudLine lektionId={lektion.id} lineKey={`check-${n}`} text={spokenTarget(turn)} guided hideModel keepVoice onResult={spoken} />
          <button type="button" className="mt-3 min-h-11 text-sm font-bold text-siegel-deep underline" onClick={() => setMode('type')}>{t('check.typeInstead', lang)}</button>
        </>
      )}
      {!outcome && mode === 'type' && (
        <Card className="p-5">
          <label htmlFor={`check-${n}`} className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('practice.yourAnswer', lang)}</label>
          <input
            id={`check-${n}`} lang="de" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={120} value={value}
            onChange={(e) => { setValue(e.target.value); setRetry(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) submit(); }}
            className="mt-2 min-h-11 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel"
          />
          {retry && <p role="status" className="mt-2 text-[0.875rem] text-ink">{t(retry === 'typo' ? 'feedback.typo' : 'otter.retry', lang)}</p>}
          <Button className="mt-3" disabled={!value.trim()} onClick={submit}>{t('action.check', lang)}</Button>
        </Card>
      )}

      {outcome === 'shown' && (
        <p role="status" className="flex items-center gap-2 text-[0.9375rem] font-bold text-siegel-deep">
          <Check className="h-4 w-4" aria-hidden="true" /> {t('feedback.correct', lang)}
        </p>
      )}
      {outcome === 'missed' && (
        <Card tone="wash" className="p-5" role="status">
          <OtterSays lektionId={lektion.id} className="mb-3">{t('otter.check.missed', lang)}</OtterSays>
          <p className="text-sm text-graphite">{t('feedback.correctIs', lang)}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink" lang="de">{modelAnswer(turn)}</p>
          {!turn.ownName && <div className="mt-3"><PlayButton lektionId={lektion.id} audioKey={`check-answer-${n}`} text={modelAnswer(turn)} label={t('action.listen', lang)} /></div>}
        </Card>
      )}
    </StageShell>
  );
}

/** The final check: its turns one by one, then which can-dos were shown, with a retake at once. */
export default function CheckStage({ stage, lektion, onBack, onDone }) {
  const [lang] = useLessonLang();
  const de = lang === 'de';
  const { user } = useAuth();
  // ponytail: a reload restarts the check (six short turns) instead of storing its answers in the run snapshot.
  const [canSpeak] = useState(() => Boolean(user) && checkSpeakingSupport().supported);
  const [retake, setRetake] = useState(0);
  const [outcomes, setOutcomes] = useState([]);
  const turns = useMemo(() => checkTurns(stage.check, retake), [stage.check, retake]);
  const canDo = canDoLines(lektion, lang);
  const shown = canDoShown(turns, outcomes, canDo.length);

  if (outcomes.length < turns.length) {
    const n = outcomes.length + 1;
    return <CheckTurn key={`${retake}-${n}`} turn={turns[n - 1]} n={n} total={turns.length} lektion={lektion} canSpeak={canSpeak}
      onBack={n === 1 ? onBack : () => setOutcomes(outcomes.slice(0, -1))} onOutcome={(o) => setOutcomes([...outcomes, o])} />;
  }

  const all = shown.every(Boolean);
  const parts = [...new Set(shown.flatMap((ok, i) => (ok ? [] : [stage.check.repeat?.[i]?.[de ? 'de' : 'en']])).filter(Boolean))];
  const again = () => { setRetake(retake + 1); setOutcomes([]); };
  return (
    <StageShell
      eyebrow={t('check.eyebrow.done', lang)}
      title={t('check.title', lang)}
      onBack={() => setOutcomes(outcomes.slice(0, -1))}
      primaryLabel={all ? t('action.next', lang) : t('check.again', lang)}
      onPrimary={all ? () => onDone(shown) : again}
      secondary={all ? null : (
        <button type="button" className="min-h-11 text-sm font-bold text-siegel-deep underline" onClick={() => onDone(shown)}>{t('check.goOn', lang)}</button>
      )}
    >
      <Card raised className="p-6">
        <OtterSays lektionId={lektion.id} pose={all ? 'satisfied' : 'thinking'} className="mb-4">
          {all ? t('otter.check.passed', lang) : t('otter.check.notYet', lang, { part: parts.join(t('check.and', lang)), next: lektion.nr + 1 })}
        </OtterSays>
        <ul className="space-y-2">
          {canDo.map((line, i) => (
            <li key={line} className="flex items-start gap-2 text-[0.9375rem] leading-snug text-ink">
              {shown[i]
                ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-siegel-deep" aria-hidden="true" />
                : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden="true" />}
              <span>{line}{!shown[i] && <span className="block text-[0.8125rem] text-graphite">{t('recap.canDo.notYet', lang)}</span>}</span>
            </li>
          ))}
        </ul>
      </Card>
    </StageShell>
  );
}
