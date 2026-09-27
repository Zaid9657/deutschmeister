import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import SpeakingRun from './SpeakingRun.jsx';
import { Countdown } from './MicroOutputView.jsx';
import { laneLabel, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

const cardText = (c) => (typeof c === 'string' ? c : (c && c.de) || '');

/** One Teil of a speaking task: the learner's material (never the AI partner's side). */
function PartMaterial({ part, t, lang, chosen, setChosen }) {
  const learnerCards = part.cards?.learner || [];
  const partnerCount = (part.cards?.partner || []).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {part.template && <Chip tone="label">{teilLabel(part.template)}</Chip>}
      </div>
      {part.situationDe && <p className="text-[0.9375rem] leading-relaxed text-ink" lang="de">{part.situationDe}</p>}
      {part.instructionsDe && <p className="text-[0.9375rem] font-bold leading-relaxed text-ink" lang="de">{part.instructionsDe}</p>}

      {learnerCards.length > 0 && (
        <div>
          <p className={LABEL}>{t('sp.yourCards')}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {learnerCards.map((c, i) => (
              <li key={i} className="flex min-h-[4.5rem] items-center justify-center rounded-clay border border-rule bg-white p-3 text-center text-[1rem] font-bold text-ink" lang="de">
                {cardText(c) || '—'}
              </li>
            ))}
          </ul>
          {partnerCount > 0 && <p className="mt-2 text-[0.8125rem] text-graphite">{t('sp.partnerCards')}</p>}
        </div>
      )}

      {Array.isArray(part.slides) && part.slides.length > 0 && (
        <div>
          <p className={LABEL}>{t('sp.slides')}</p>
          <ol className="mt-2 space-y-1.5">
            {part.slides.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-clay border border-rule bg-white px-3 py-2 text-[0.9375rem] text-ink" lang="de">
                <span className="font-data text-graphite">{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {part.stimulus && (
        <div className="rounded-clay border border-rule bg-paper-sunk p-4">
          <p className={LABEL}>{t('sp.stimulus')}</p>
          {part.stimulus.de && <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink" lang="de">{part.stimulus.de}</p>}
          {Array.isArray(part.stimulus.items) && part.stimulus.items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {part.stimulus.items.map((s, i) => <li key={i} className="text-[0.9375rem] text-ink" lang="de">{part.stimulus.kind === 'quotes' ? `„${s}“` : s}</li>)}
            </ul>
          )}
        </div>
      )}

      {part.topicChoice && Array.isArray(part.topicChoice.topics) && (
        <fieldset>
          <legend className={LABEL}>{t('sp.topics', { pick: part.topicChoice.pick, from: part.topicChoice.from })}</legend>
          <div className="mt-2 space-y-1.5">
            {part.topicChoice.topics.map((topic, i) => (
              <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-clay border border-rule bg-white px-3 text-[0.9375rem] text-ink">
                <input
                  type={part.topicChoice.pick > 1 ? 'checkbox' : 'radio'}
                  name={`topic-${part.template}`}
                  checked={chosen.includes(i)}
                  onChange={() => setChosen((prev) => (part.topicChoice.pick > 1
                    ? (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].slice(-part.topicChoice.pick))
                    : [i]))}
                  className="h-5 w-5 accent-siegel"
                />
                <span lang="de">{topic}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {Array.isArray(part.keyPoints) && part.keyPoints.length > 0 && (
        <ul className="space-y-1 rounded-clay bg-paper-sunk p-4">
          {part.keyPoints.map((k, i) => <li key={i} className="text-[0.9375rem] text-ink" lang="de">› {k}</li>)}
        </ul>
      )}

      {Array.isArray(part.moves) && part.moves.length > 0 && (
        <p className="text-[0.8125rem] text-graphite">{t('sp.moves', { list: part.moves.join(' · ') })}</p>
      )}
      {part.planningRound && (
        <p className="text-[0.875rem] text-ink">
          <strong>{t('sp.planning', { n: part.planningRound.minutes })}</strong>
          {Array.isArray(part.planningRound.moves) && part.planningRound.moves.length ? ` — ${part.planningRound.moves.join(' · ')}` : ''}
        </p>
      )}
      {lang !== 'de' && part.mode && <p className="font-data text-[0.6875rem] text-graphite">{part.mode}</p>}
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
 * onDone({ bankKey, submitted, result }) once.
 */
export default function SpeakingTaskView({ task, level, onDone }) {
  const [lang, t] = useV2Strings();
  const parts = Array.isArray(task?.parts) && task.parts.length ? task.parts : task ? [task] : [];
  const examPrep = parts.reduce((s, p) => s + (Number(p.prepMinutes) || 0), 0);
  const dot2 = /\.2$/.test(String(level || ''));
  const learnPrep = dot2 ? examPrep : Math.min(examPrep, 3);
  const [phase, setPhase] = useState(learnPrep > 0 ? 'intro' : 'speak'); // intro | prep | speak | nomic
  const [notes, setNotes] = useState('');
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null);
  const [attempted, setAttempted] = useState(false);
  if (!task) return null;

  const role = task.aiRole || {};
  const roleName = role.support === 'examiner' ? t('sp.examiner') : role.name;
  const keywords = notes.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const showModel = (attempted || phase === 'nomic') && Array.isArray(task.modelTurns) && task.modelTurns.length > 0;

  const finish = () => {
    if (typeof onDone === 'function') onDone({ bankKey: task.bankKey, submitted: !!result, result });
  };

  return (
    <div>
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {task.lane && <Chip tone="quiet">{laneLabel(task.lane)}</Chip>}
          {task.originLabelDe && <Chip tone="quiet">{t('exam.origin', { label: task.originLabelDe })}</Chip>}
        </div>
        {parts.map((p, i) => (
          <div key={p.template || i} className={i > 0 ? 'mt-6 border-t border-rule pt-5' : ''}>
            <PartMaterial part={p} t={t} lang={lang} chosen={chosen} setChosen={setChosen} />
          </div>
        ))}
        {roleName && <p className="mt-5 text-[0.875rem] text-graphite">{t('sp.aiRole', { name: roleName })}</p>}
        {Array.isArray(task.hintWords) && task.hintWords.length > 0 && (
          <div className="mt-4">
            <p className={LABEL}>{t('sp.hintWords')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.hintWords.map((w) => <Chip key={w} tone="quiet" size="md"><span lang="de">{w}</span></Chip>)}
            </div>
          </div>
        )}
      </Card>

      {phase === 'intro' && (
        <Card tone="wash" className="mt-4 p-4">
          <p className="text-[0.9375rem] font-bold text-ink">{t('sp.prep')}</p>
          {examPrep > 0 && <p className="mt-1 text-[0.875rem] text-graphite">{t('sp.prepExam', { n: examPrep })}</p>}
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => setPhase('prep')}>{t('sp.prepStart')}</Button>
            <Button variant="secondary" onClick={() => setPhase('speak')}>{t('sp.prepSkip')}</Button>
          </div>
        </Card>
      )}

      {phase === 'prep' && (
        <Card tone="wash" className="mt-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Countdown seconds={learnPrep * 60} onEnd={() => setPhase('speak')} label={t('sp.prep')} />
            <Button variant="secondary" onClick={() => setPhase('speak')}>{t('sp.prepSkip')}</Button>
          </div>
          {examPrep !== learnPrep && <p className="mt-1 text-[0.8125rem] text-graphite">{t('sp.prepExam', { n: examPrep })}</p>}
          <label htmlFor={`notes-${task.bankKey}`} className={`mt-4 block ${LABEL}`}>{t('sp.notes')}</label>
          <textarea
            id={`notes-${task.bankKey}`}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full resize-y rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none focus:border-siegel"
            lang="de"
          />
        </Card>
      )}

      {phase === 'speak' && (
        <div className="mt-4">
          {keywords.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2" aria-label={t('sp.notes')}>
              {keywords.map((k, i) => <Chip key={`${k}-${i}`} tone="aprikose">{k}</Chip>)}
            </div>
          )}
          <SpeakingRun
            bankKey={task.bankKey}
            level={level}
            title={parts[0]?.instructionsDe || ''}
            hintWords={task.hintWords || []}
            onResult={(r) => { setAttempted(true); if (r) setResult(r); }}
            onSkip={() => setPhase('nomic')}
          />
        </div>
      )}

      {phase === 'nomic' && (
        <Card tone="sunk" className="mt-4 p-4"><p className="text-[0.9375rem] text-ink">{t('sp.noMicLead')}</p></Card>
      )}

      {showModel ? (
        <Card className="mt-4 p-5">
          <p className={LABEL}>{t('sp.model')}</p>
          <ul className="mt-3 space-y-2">
            {task.modelTurns.map((m, i) => (
              <li key={i} className={`rounded-clay border border-rule p-3 text-[0.9375rem] ${m.speaker === 'learner' ? 'bg-white' : 'bg-paper-sunk'}`}>
                <span className={LABEL}>{m.speaker === 'learner' ? t('sp.learner') : (roleName || t('sp.partnerLabel'))}</span>
                <p className="mt-1 text-ink" lang="de">{m.de}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        Array.isArray(task.modelTurns) && task.modelTurns.length > 0 && <p className="mt-3 text-[0.8125rem] text-graphite">{t('sp.modelAfter')}</p>
      )}

      <div className="mt-6 flex justify-end">
        {(attempted || phase === 'nomic') ? (
          <Button onClick={finish} size="lg" className="w-full sm:w-auto">{t('item.next')}</Button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
          >
            {t('mo.skip')}
          </button>
        )}
      </div>
    </div>
  );
}
