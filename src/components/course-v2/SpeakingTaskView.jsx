import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GameButton, { QuietButton } from './GameButton.jsx';
import { StickyAction } from './GameParts.jsx';
import SpeakingRun from './SpeakingRun.jsx';
import StepScreen from './StepScreen.jsx';
import { Countdown } from './MicroOutputView.jsx';
import { laneLabel, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';
const TAG = 'inline-flex items-center rounded-full bg-course-wash px-2.5 py-0.5 text-[0.8125rem] font-extrabold text-course-ink';
const QUIET_TAG = 'inline-flex items-center rounded-full border-2 border-game-line bg-white px-2.5 py-0.5 text-[0.8125rem] font-bold text-game-muted';

const cardText = (c) => (typeof c === 'string' ? c : (c && c.de) || '');

/** One Teil of a speaking task: the learner's material (never the AI partner's side). */
function PartMaterial({ part, t, lang, chosen, setChosen }) {
  const learnerCards = part.cards?.learner || [];
  const partnerCount = (part.cards?.partner || []).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {part.template && <span className={TAG} lang="de">{teilLabel(part.template)}</span>}
      </div>
      {part.situationDe && (
        <div>
          <p className="text-[0.9375rem] leading-relaxed text-game-text" lang="de">{part.situationDe}</p>
          {/* the optional English twin (SpeakingPart.situationEn; review a1.1-u01 r1 F08), like every other twin in English chrome */}
          {part.situationEn && lang !== 'de' && <p className="mt-1 text-[0.875rem] leading-relaxed text-game-muted" lang="en">{part.situationEn}</p>}
        </div>
      )}
      {!part.situationDe && part.situationEn && lang !== 'de' && <p className="text-[0.875rem] leading-relaxed text-game-muted" lang="en">{part.situationEn}</p>}
      {part.instructionsDe && <p className="text-[0.9375rem] font-bold leading-relaxed text-game-text" lang="de">{part.instructionsDe}</p>}

      {learnerCards.length > 0 && (
        <div>
          <p className={LABEL}>{t('sp.yourCards')}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {learnerCards.map((c, i) => (
              <li key={i} className="flex min-h-[4.5rem] items-center justify-center rounded-2xl border-2 border-game-line bg-white p-3 text-center text-[1rem] font-bold text-game-text" lang="de">
                {cardText(c) || '—'}
              </li>
            ))}
          </ul>
          {partnerCount > 0 && <p className="mt-2 text-[0.8125rem] text-game-muted">{t('sp.partnerCards')}</p>}
        </div>
      )}

      {Array.isArray(part.slides) && part.slides.length > 0 && (
        <div>
          <p className={LABEL}>{t('sp.slides')}</p>
          <ol className="mt-2 space-y-1.5">
            {part.slides.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border-2 border-game-line bg-white px-3 py-2 text-[0.9375rem] text-game-text" lang="de">
                <span className="text-game-muted">{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {part.stimulus && (
        <div className="rounded-2xl border-2 border-game-line bg-course-ground p-4">
          <p className={LABEL}>{t('sp.stimulus')}</p>
          {part.stimulus.de && <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-game-text" lang="de">{part.stimulus.de}</p>}
          {Array.isArray(part.stimulus.items) && part.stimulus.items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {part.stimulus.items.map((s, i) => <li key={i} className="text-[0.9375rem] text-game-text" lang="de">{part.stimulus.kind === 'quotes' ? `„${s}“` : s}</li>)}
            </ul>
          )}
        </div>
      )}

      {part.topicChoice && Array.isArray(part.topicChoice.topics) && (
        <fieldset>
          <legend className={LABEL}>{t('sp.topics', { pick: part.topicChoice.pick, from: part.topicChoice.from })}</legend>
          <div className="mt-2 space-y-1.5">
            {part.topicChoice.topics.map((topic, i) => (
              <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 border-game-line bg-white px-3 text-[0.9375rem] text-game-text">
                <input
                  type={part.topicChoice.pick > 1 ? 'checkbox' : 'radio'}
                  name={`topic-${part.template}`}
                  checked={chosen.includes(i)}
                  onChange={() => setChosen((prev) => (part.topicChoice.pick > 1
                    ? (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].slice(-part.topicChoice.pick))
                    : [i]))}
                  className="h-5 w-5 accent-course"
                />
                <span lang="de">{topic}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {Array.isArray(part.keyPoints) && part.keyPoints.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-course-ground p-4">
          {part.keyPoints.map((k, i) => <li key={i} className="text-[0.9375rem] text-game-text" lang="de">› {k}</li>)}
        </ul>
      )}

      {Array.isArray(part.moves) && part.moves.length > 0 && (
        <p className="text-[0.8125rem] text-game-muted">{t('sp.moves', { list: part.moves.join(' · ') })}</p>
      )}
      {part.planningRound && (
        <p className="text-[0.875rem] text-game-text">
          <strong>{t('sp.planning', { n: part.planningRound.minutes })}</strong>
          {Array.isArray(part.planningRound.moves) && part.planningRound.moves.length ? ` — ${part.planningRound.moves.join(' · ')}` : ''}
        </p>
      )}
    </div>
  );
}

/**
 * SprechenStep (SCHEMA §8 SpeakingTask, BLUEPRINT §3.1 LS5 / §3.2 LS5, S5):
 * the task material (cards, slides, stimulus, topic choice — never the AI partner's
 * hidden side), the preparation timer with private notes (shortened in the .1 Lernmodus
 * and labelled with the exam's own preparation time), then the conversation through the
 * speaking coach with `courseTaskKey = bankKey`, the automated result, and the model
 * conversation only after the attempt. While speaking the notes collapse to ≤ 5 words.
 *
 * One thing per screen (round 3; audit WT-04 — this was a ~2000 px page with its start at
 * y 1700): each Teil's material on its own screen („Weiter"), the preparation offer, the
 * preparation, then the speaking screen with the material folded under „Aufgabe noch einmal
 * ansehen". Every screen's one primary sits in the bottom bar (StepScreen / StickyAction), the
 * skips quiet under it; on the speaking screen SpeakingRun hands its start (or, signed out, the
 * sign-in door) to that bar (renderAction), so exactly one bar is mounted — none while the
 * conversation runs (SpeakingSession owns that screen).
 *
 * Without an account the learner is never stuck: the bar offers the sign-in (and back to this
 * step) and „Ohne Auswertung weiter", which shows the model conversation to read aloud.
 *
 * onDone({ bankKey, submitted, result }) once.
 */
export default function SpeakingTaskView({ task, level, onDone }) {
  const [lang, t] = useV2Strings();
  const { user } = useAuth();
  const parts = Array.isArray(task?.parts) && task.parts.length ? task.parts : task ? [task] : [];
  const examPrep = parts.reduce((s, p) => s + (Number(p.prepMinutes) || 0), 0);
  const dot2 = /\.2$/.test(String(level || ''));
  const learnPrep = dot2 ? examPrep : Math.min(examPrep, 3);
  const afterMaterial = learnPrep > 0 ? 'intro' : 'speak';
  // material (one Teil per screen) | intro | prep | speak | nomic (no microphone) | self (no assessment)
  const [phase, setPhase] = useState(parts.length ? 'material' : afterMaterial);
  const [partIdx, setPartIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null);
  const [attempted, setAttempted] = useState(false);
  // every screen opens at the top of the page
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [phase, partIdx]);
  if (!task) return null;

  const role = task.aiRole || {};
  const roleName = role.support === 'examiner' ? t('sp.examiner') : role.name;
  const keywords = notes.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const showModel = (attempted || phase === 'nomic' || phase === 'self') && Array.isArray(task.modelTurns) && task.modelTurns.length > 0;

  const finish = () => {
    if (typeof onDone === 'function') onDone({ bankKey: task.bankKey, submitted: !!result, result });
  };
  const nextPart = () => {
    if (partIdx + 1 < parts.length) setPartIdx(partIdx + 1);
    else setPhase(afterMaterial);
  };

  const chips = (task.lane || task.originLabelDe) && (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {task.lane && <span className={QUIET_TAG}>{laneLabel(task.lane)}</span>}
      {task.originLabelDe && <span className={QUIET_TAG}>{t('exam.origin', { label: task.originLabelDe })}</span>}
    </div>
  );
  const material = (p, i) => <PartMaterial key={p.template || i} part={p} t={t} lang={lang} chosen={chosen} setChosen={setChosen} />;

  const model = showModel ? (
    <div className={`mt-4 ${PANEL}`}>
      <p className={LABEL}>{t('sp.model')}</p>
      <ul className="mt-3 space-y-2">
        {task.modelTurns.map((m, i) => (
          <li key={i} className={`rounded-2xl border-2 border-game-line p-3 text-[0.9375rem] ${m.speaker === 'learner' ? 'bg-white' : 'bg-course-ground'}`}>
            <span className={LABEL}>{m.speaker === 'learner' ? t('sp.learner') : (roleName || t('sp.partnerLabel'))}</span>
            <p className="mt-1 font-semibold text-game-text" lang="de">{m.de}</p>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  if (phase === 'material') {
    const p = parts[partIdx];
    return (
      <StepScreen action={<GameButton onClick={nextPart}>{t('item.next')}</GameButton>}>
        {partIdx === 0 && chips}
        <div className={PANEL}>{material(p, partIdx)}</div>
      </StepScreen>
    );
  }

  if (phase === 'intro') {
    return (
      <StepScreen
        action={(
          <>
            <GameButton onClick={() => setPhase('prep')}>{t('sp.prepStart')}</GameButton>
            <QuietButton onClick={() => setPhase('speak')}>{t('sp.prepSkip')}</QuietButton>
          </>
        )}
      >
        <div className={PANEL}>
          <p className="text-[1.0625rem] font-extrabold text-game-text">{t('sp.prep')}</p>
          {examPrep > 0 && <p className="mt-1 text-[0.9375rem] font-semibold text-game-muted">{t('sp.prepExam', { n: examPrep })}</p>}
        </div>
      </StepScreen>
    );
  }

  if (phase === 'prep') {
    return (
      <StepScreen action={<GameButton onClick={() => setPhase('speak')}>{t('sp.prepSkip')}</GameButton>}>
        <div className={PANEL}>
          <Countdown seconds={learnPrep * 60} onEnd={() => setPhase('speak')} label={t('sp.prep')} />
          {examPrep !== learnPrep && <p className="mt-1 text-[0.8125rem] font-semibold text-game-muted">{t('sp.prepExam', { n: examPrep })}</p>}
          <label htmlFor={`notes-${task.bankKey}`} className={`mt-4 block ${LABEL}`}>{t('sp.notes')}</label>
          <textarea
            id={`notes-${task.bankKey}`}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full resize-y rounded-2xl border-2 border-game-line bg-white px-4 py-3 text-[1.0625rem] font-semibold leading-relaxed text-game-text outline-none focus:border-course"
            lang="de"
          />
        </div>
        <TaskAgain parts={parts} material={material} t={t} />
      </StepScreen>
    );
  }

  if (phase === 'nomic' || phase === 'self') {
    return (
      <StepScreen action={<GameButton onClick={finish}>{t('item.next')}</GameButton>}>
        <p className={`${PANEL} text-[0.9375rem] font-semibold text-game-text`}>{t(phase === 'self' ? 'sp.selfLead' : 'sp.noMicLead')}</p>
        {model}
        <TaskAgain parts={parts} material={material} t={t} />
      </StepScreen>
    );
  }

  // phase 'speak': the conversation; its actions go to ONE bottom bar (SpeakingRun → renderAction)
  return (
    <div className="pb-32 sm:pb-0">
      {roleName && <p className="mb-3 text-[0.9375rem] font-semibold text-game-muted">{t('sp.aiRole', { name: roleName })}</p>}
      {Array.isArray(task.hintWords) && task.hintWords.length > 0 && (
        <div className="mb-4">
          <p className={LABEL}>{t('sp.hintWords')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.hintWords.map((w) => <span key={w} className={QUIET_TAG} lang="de">{w}</span>)}
          </div>
        </div>
      )}
      {keywords.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" aria-label={t('sp.notes')}>
          {keywords.map((k, i) => <span key={`${k}-${i}`} className={TAG}>{k}</span>)}
        </div>
      )}
      <TaskAgain parts={parts} material={material} t={t} className="mb-4" />
      <SpeakingRun
        bankKey={task.bankKey}
        level={level}
        title={parts[0]?.instructionsDe || ''}
        hintWords={task.hintWords || []}
        onResult={(r) => { setAttempted(true); if (r) setResult(r); }}
        // signed out, the quiet way on is „Ohne Auswertung weiter" → the model conversation to read aloud
        onSkip={() => setPhase(user ? 'nomic' : 'self')}
        skipLabel={user ? null : t('mo.skip')}
        renderAction={({ primary, skip, retry, busy }) => (
          <StickyAction>
            {attempted && !busy ? <GameButton onClick={finish}>{t('item.next')}</GameButton> : primary}
            {attempted && !busy && retry && <QuietButton onClick={retry}>{t('sp.again')}</QuietButton>}
            {!attempted && skip}
            {!attempted && user && <QuietButton onClick={finish}>{t('mo.skip')}</QuietButton>}
          </StickyAction>
        )}
      />
      {model}
      {!showModel && Array.isArray(task.modelTurns) && task.modelTurns.length > 0 && (
        <p className="mt-3 text-[0.8125rem] font-semibold text-game-muted">{t('sp.modelAfter')}</p>
      )}
    </div>
  );
}

/** The task's material, folded: the learner can look again while preparing or speaking. */
function TaskAgain({ parts, material, t, className = '' }) {
  if (!parts.length) return null;
  return (
    <details className={`rounded-[1.25rem] border-2 border-game-line bg-white px-4 py-1 ${className}`}>
      <summary className="flex min-h-11 cursor-pointer items-center text-[0.9375rem] font-extrabold text-course-ink">{t('sp.taskAgain')}</summary>
      <div className="space-y-5 pb-4 pt-2">{parts.map((p, i) => material(p, i))}</div>
    </details>
  );
}
