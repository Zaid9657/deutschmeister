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
import { BEYOND, canDoShown, checkTurns, chosenWord, modelAnswer, ownAnswer, partsToRepeat, spokenShown, spokenTarget, typedResult, uncheckedWords, writtenOnly } from '../../lib/lesson/finalCheck.js';
import { canDoLines } from '../../lib/course/canDo.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

const SPOKEN_TRIES = 2;

/** One turn: the partner's line (the check's `partner`), the task, then a spoken or typed answer with one more try. */
function CheckTurn({ turn, n, total, lektion, partner, opening, canSpeak, onBack, onOutcome }) {
  const [lang] = useLessonLang();
  const de = lang === 'de';
  const [mode, setMode] = useState(canSpeak && !writtenOnly(turn) ? 'speak' : 'type');
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [outcome, setOutcome] = useState(null); // 'shown' | 'missed' | 'unverified'
  const [retry, setRetry] = useState(null); // null | 'typo' | 'retry'
  const [showLetters, setShowLetters] = useState(false);
  // What the learner answered (typed, or the transcript), so a later turn can follow their choice.
  const [answer, setAnswer] = useState('');
  // A right answer with a word neither course teaches: the sentence was checked, the word was not (`uncheckedWords`).
  const [unchecked, setUnchecked] = useState([]);
  // An answer past what the Lektion can check (BEYOND): no try used, the Lektion's way shown, one more answer;
  // a second such answer ends the turn unverified, and its can-do is not shown.
  const [beyond, setBeyond] = useState(false);
  const onBeyond = () => { if (beyond) setOutcome('unverified'); else { setBeyond(true); setRetry(null); } };

  const submit = () => {
    const result = typedResult(turn, value);
    if (result === BEYOND) { onBeyond(); return; }
    const ok = result === RESULT.CORRECT || (tries > 0 && result === RESULT.TYPO);
    if (ok) { setOutcome('shown'); setAnswer(value); setUnchecked(result === RESULT.CORRECT ? uncheckedWords(turn, value) : []); }
    else if (tries === 0) setRetry(result === RESULT.TYPO ? 'typo' : 'retry');
    else setOutcome('missed');
    setTries(tries + 1);
  };
  const spoken = (r) => {
    if (r.selfConfirmed) { setMode('type'); return; } // not measured: typing is the proof
    if (r.transcript && typedResult(turn, r.transcript) === BEYOND) { setMode('type'); onBeyond(); return; }
    if (spokenShown(r, turn)) { setOutcome('shown'); setAnswer(r.transcript || ''); setUnchecked(uncheckedWords(turn, r.transcript || '')); }
    else if (r.attempts >= SPOKEN_TRIES) setMode('type'); // speech recognition may be the problem, not the learner
  };

  return (
    <StageShell
      eyebrow={t('check.eyebrow', lang, { n, total })}
      title={de ? turn.taskDe : turn.taskEn}
      onBack={onBack}
      primaryLabel={t('action.next', lang)}
      primaryDisabled={!outcome}
      onPrimary={() => onOutcome(outcome, answer)}
    >
      {n === 1 && <OtterSays lektionId={lektion.id} className="mb-5">{opening}</OtterSays>}
      {turn.cue && (
        <Card tone="wash" className="mb-4 p-5">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{partner}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink" lang="de">{turn.cue.de}</p>
          <div className="mt-3"><PlayButton lektionId={lektion.id} audioKey={`check-cue-${n}`} text={turn.cue.de} label={t('action.listen', lang)} /></div>
        </Card>
      )}
      {turn.listen && (
        // A heard number: only the sound, never its text, so the learner writes what they understood.
        <Card tone="wash" className="mb-4 p-5">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{partner}</p>
          <div className="mt-3"><PlayButton lektionId={lektion.id} audioKey={`check-listen-${n}`} text={turn.spoken} rate={0.8} label={t('action.listen', lang)} /></div>
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

      {beyond && outcome !== 'shown' && (
        <Card tone="wash" className="mb-4 p-5" role="status">
          <p className="text-[0.9375rem] leading-snug text-ink">{t('check.beyond', lang)}</p>
          <p className="mt-2 font-display text-xl font-semibold text-ink" lang="de">{modelAnswer(turn)}</p>
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
          {turn.parts ? (
            // A short message: room for a greeting and a few sentences; Enter starts a new line here.
            <textarea
              id={`check-${n}`} lang="de" autoComplete="off" autoCapitalize="sentences" spellCheck={false} maxLength={400} rows={4} value={value}
              onChange={(e) => { setValue(e.target.value); setRetry(null); }}
              className="mt-2 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] leading-relaxed text-ink outline-none focus:border-siegel"
            />
          ) : (
            <input
              id={`check-${n}`} lang="de" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={120} value={value}
              onChange={(e) => { setValue(e.target.value); setRetry(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) submit(); }}
              className="mt-2 min-h-11 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel"
            />
          )}
          {retry && <p role="status" className="mt-2 text-[0.875rem] text-ink">{t(retry === 'typo' ? 'feedback.typo' : 'otter.retry', lang)}</p>}
          <Button className="mt-3" disabled={!value.trim()} onClick={submit}>{t('action.check', lang)}</Button>
        </Card>
      )}

      {outcome === 'shown' && (
        <p role="status" className="flex items-center gap-2 text-[0.9375rem] font-bold text-siegel-deep">
          <Check className="h-4 w-4" aria-hidden="true" /> {t('feedback.correct', lang)}
        </p>
      )}
      {outcome === 'shown' && unchecked.length > 0 && (
        <p className="mt-2 text-[0.875rem] text-graphite">{t('check.unchecked', lang, { word: unchecked.join(', ') })}</p>
      )}
      {outcome === 'missed' && (
        <Card tone="wash" className="p-5" role="status">
          <OtterSays lektionId={lektion.id} className="mb-3">{t('otter.check.missed', lang)}</OtterSays>
          <p className="text-sm text-graphite">{t(turn.example ? 'check.example' : 'feedback.correctIs', lang)}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink" lang="de">{modelAnswer(turn)}</p>
          {(turn.example || !ownAnswer(turn)) && !turn.listen && <div className="mt-3"><PlayButton lektionId={lektion.id} audioKey={`check-answer-${n}`} text={modelAnswer(turn)} label={t('action.listen', lang)} /></div>}
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
  const [answers, setAnswers] = useState([]);
  // The person the learner chose in a choice gap („meine Schwester"): the turns after it are about them.
  const chosen = useMemo(() => {
    const plain = checkTurns(stage.check, retake);
    return answers.map((a, j) => chosenWord(plain[j], a)).find(Boolean) || null;
  }, [stage.check, retake, answers]);
  const turns = useMemo(() => checkTurns(stage.check, retake, { chosen }), [stage.check, retake, chosen]);
  const canDo = canDoLines(lektion, lang);
  const shown = canDoShown(turns, outcomes, canDo.length);
  const back = () => { setOutcomes(outcomes.slice(0, -1)); setAnswers(answers.slice(0, -1)); };

  if (outcomes.length < turns.length) {
    const n = outcomes.length + 1;
    return <CheckTurn key={`${retake}-${n}`} turn={turns[n - 1]} n={n} total={turns.length} lektion={lektion} canSpeak={canSpeak}
      partner={stage.check.partner} opening={stage.check.open?.[de ? 'de' : 'en']}
      onBack={n === 1 ? onBack : back} onOutcome={(o, a) => { setOutcomes([...outcomes, o]); setAnswers([...answers, a || '']); }} />;
  }

  const all = shown.every(Boolean);
  const parts = partsToRepeat(stage.check.repeat, shown, de ? 'de' : 'en');
  const again = () => { setRetake(retake + 1); setOutcomes([]); setAnswers([]); };
  // What really comes after this Lektion (buildGuided's `stage.next`): Lektion 3 leads to a checkpoint, Lektion 12 has no Lektion 13.
  const next = stage.next || { kind: 'lektion', nr: lektion.nr + 1 };
  const nextName = t(`check.next.${next.kind}`, lang, { nr: next.nr });
  return (
    <StageShell
      eyebrow={t('check.eyebrow.done', lang)}
      title={t('check.title', lang)}
      onBack={back}
      primaryLabel={all ? t('action.next', lang) : t('check.again', lang)}
      onPrimary={all ? () => onDone(shown) : again}
      secondary={all ? null : (
        <button type="button" className="min-h-11 text-sm font-bold text-siegel-deep underline" onClick={() => onDone(shown)}>{t('check.goOn', lang)}</button>
      )}
    >
      <Card raised className="p-6">
        <OtterSays lektionId={lektion.id} pose={all ? 'satisfied' : 'thinking'} className="mb-4">
          {all ? stage.check.passed?.[de ? 'de' : 'en'] : t('otter.check.notYet', lang, { part: parts.join(t('check.and', lang)), next: nextName })}
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
