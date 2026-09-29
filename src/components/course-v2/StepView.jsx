import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReadAloudLine from '../lesson/ReadAloudLine.jsx';
import CheckView from './CheckView.jsx';
import ExamBlockView from './ExamBlockView.jsx';
import GameButton from './GameButton.jsx';
import InputView from './InputView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import RuleCardView, { RuleTableFill } from './RuleCardView.jsx';
import SpeakingTaskView from './SpeakingTaskView.jsx';
import WritingTaskView from './WritingTaskView.jsx';
import { lineIndex, materialize, skeletonOf, stepNr } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';
const SERVED_MAX = 12;
const EXIT_COUNT = 3;

/** Split a practice pool: 12 served (fewer if the pool is short), 3 unseen exit items, the rest spare. */
export function splitPool(all) {
  const list = all || [];
  const exitN = list.length > EXIT_COUNT ? EXIT_COUNT : 0;
  const servedN = Math.min(SERVED_MAX, list.length - exitN);
  return { served: list.slice(0, servedN), exit: list.slice(servedN, servedN + exitN), spare: list.slice(servedN + exitN) };
}

/** Spread generated items through the authored ones so the pool never ends in a block of one frame. */
function interleave(authored, generated) {
  if (!generated.length) return authored;
  const out = [];
  const every = Math.max(2, Math.floor(authored.length / (generated.length + 1)));
  let g = 0;
  authored.forEach((it, i) => {
    out.push(it);
    if ((i + 1) % every === 0 && g < generated.length) out.push(generated[g++]);
  });
  while (g < generated.length) out.push(generated[g++]);
  return out;
}

/** The ordered segments of one step (BLUEPRINT §3.3 for Situation/Text, §3.2 for Sprache). */
function segmentsFor(step, extras) {
  const segs = [];
  const k = step.kind;
  if (k === 'situation' || k === 'text') {
    if (extras.warmupItems && extras.warmupItems.length) segs.push({ id: 'warmup', label: 'seg.warmup' });
    if (step.input) segs.push({ id: 'input', label: 'seg.input' });
    if (step.examBlock) segs.push({ id: 'inputBlock', label: 'seg.exam', counted: true });
    else if (step.inputItems && step.inputItems.length) segs.push({ id: 'inputItems', label: 'seg.inputItems', counted: true });
    if (step.modelSentence || step.ruleCard) segs.push({ id: 'form', label: 'seg.form' });
    if (step.structuredInput && step.structuredInput.length) segs.push({ id: 'structured', label: 'seg.form', counted: true });
    if (extras.pool.served.length) segs.push({ id: 'practice', label: 'seg.practice', counted: true });
    if (step.aussprache) segs.push({ id: 'aussprache', label: 'seg.aussprache', counted: true });
    if (step.microOutput) segs.push({ id: 'micro', label: 'seg.micro' });
    if (extras.pool.exit.length) segs.push({ id: 'exit', label: 'seg.exit', counted: true });
    segs.push({ id: 'end', label: 'seg.exit' });
  } else if (k === 'sprache') {
    if (step.ruleTable) segs.push({ id: 'table', label: 'seg.sprache', counted: true });
    if (step.ruleCard) segs.push({ id: 'form', label: 'seg.form' });
    if (extras.pool.served.length) segs.push({ id: 'practice', label: 'seg.practice', counted: true });
    if (step.cloze && step.cloze.length) segs.push({ id: 'cloze', label: 'seg.cloze', counted: true });
    if (extras.redemittel.length) segs.push({ id: 'redemittel', label: 'seg.redemittel' });
    if (extras.pool.exit.length) segs.push({ id: 'exit', label: 'seg.exit', counted: true });
    segs.push({ id: 'end', label: 'seg.exit' });
  } else if (k === 'pruefung') {
    (step.blocks || []).forEach((b, i) => segs.push({ id: `block-${i}`, label: 'seg.exam', counted: true, block: b }));
    segs.push({ id: 'end', label: 'seg.exam' });
  } else {
    segs.push({ id: k, label: null });
  }
  return segs;
}

/**
 * StepView({ unit, step, level, onAttempt, onDone }) — one Lernschritt of any SCHEMA §8
 * kind: situation, text, sprache, pruefung, sprechen, schreiben, ueberarbeiten, check.
 *
 *   onAttempt({ itemId, stepId, correct, answer, errorTag, typo })   every answered item
 *   onDone({ stepId, correct, total, … })                           once, at the end
 *                                                    (the Check adds `proofs`: { canDoId: proven }
 *                                                     and `proofItems`: { proofItemId: answeredRight })
 *
 * `correct`/`total` count first presentations of the scored items (input items, Form,
 * Üben, Aussprache perception, Abschluss, exam items, check items); the Aufgaben report
 * `{ correct: 0, total: 0, submitted, bankKey }` — completion reads `submitted`, never a
 * score (BLUEPRINT §3.5).
 *
 * Optional, additive props the player core can pass:
 *   ruleCards      the level's compiled rule cards (array or { id: card }) — Form segment,
 *                  stuck-point repair, Rückschau
 *   course         the compiled course manifest (can-do wording, minutes)
 *   generated      { itemId: Item } for generator ids this renderer does not build
 *   warmupItems    the 6 due review items for the Aufwärmen segment
 *   earlierItems   the resolved `check.earlierDraw` items for the Lektions-Check
 *   aufgaben       { sprechen: bool, schreiben: bool } — submitted Aufgaben (check proofs)
 *   microOutputs   { [moId]: bool } — the learner's own micro-outputs sent (check proofs by micro-output)
 *   names          { speakerId: display name } from the cast registry
 *   canDos         { canDoId: wording } overrides
 *   onBack         a „Zurück" link in the header
 */
export default function StepView({
  unit,
  step,
  level,
  onAttempt,
  onDone,
  ruleCards = null,
  course = null,
  generated = null,
  warmupItems = null,
  earlierItems = null,
  aufgaben = null,
  microOutputs = null,
  names = null,
  canDos = null,
  onBack = null,
  onProgress = null,
}) {
  const [lang, t] = useV2Strings();
  const unitId = unit?.id || null;
  const lines = useMemo(() => lineIndex(unit), [unit]);
  const skeleton = skeletonOf(level || unit?.level);
  // The player core hands the level's rule cards on the unit (`unit.ruleCards`, additive);
  // an explicit `ruleCards` prop wins.
  const cards = ruleCards ?? unit?.ruleCards ?? null;
  const cardsById = useMemo(() => {
    const m = new Map();
    const list = Array.isArray(cards) ? cards : Array.isArray(cards?.cards) ? cards.cards : Object.values(cards || {});
    for (const c of list) if (c && c.id) m.set(c.id, c);
    return m;
  }, [cards]);
  const ruleCard = step?.ruleCard ? cardsById.get(step.ruleCard) || null : null;

  const pool = useMemo(() => {
    const gen = materialize(step?.pool?.generators, unit, generated);
    const plan = step?.plan;
    if (plan && Array.isArray(plan.practice)) {
      // The player core's draw (src/lib/course-v2/unitPlan.js) decides what is served:
      // seeded per unit/step/attempt, last attempt's items to the back, exit items held
      // out. Generated items join the practice; spare + reserve feed the requeue.
      const merged = interleave(plan.practice, gen);
      return {
        served: merged.slice(0, SERVED_MAX),
        exit: plan.exit || [],
        spare: [...merged.slice(SERVED_MAX), ...(plan.spare || []), ...(plan.reserve || [])],
      };
    }
    const split = splitPool(interleave(step?.pool?.items || [], gen));
    return { ...split, spare: [...split.spare, ...(step?.reserve || [])] };
  }, [step, unit, generated]);
  const perception = useMemo(() => {
    const p = step?.aussprache?.perception;
    if (!p) return [];
    return Array.isArray(p) ? p : materialize(p, unit, generated);
  }, [step, unit, generated]);
  const redemittel = useMemo(() => {
    if (step?.kind !== 'sprache') return [];
    const want = step.redemittelFor || [];
    const all = unit?.redemittel || [];
    const hit = all.filter((r) => r.forTemplate && want.includes(r.forTemplate));
    return hit.length ? hit : all;
  }, [step, unit]);

  const segments = useMemo(
    () => (step ? segmentsFor(step, { pool, warmupItems, redemittel }) : []),
    [step, pool, warmupItems, redemittel],
  );
  const [segIdx, setSegIdx] = useState(0);
  const segAt = useRef(0);
  segAt.current = segIdx;
  // progress inside the current segment (its ItemRun's position), reset on every segment
  const [inner, setInner] = useState(0);
  const last = Math.max(0, segments.length - 1);
  const fraction = last > 0 ? Math.min(1, (Math.min(segIdx, last) + inner) / last) : inner;
  const progressSink = useRef(onProgress);
  progressSink.current = onProgress;
  useEffect(() => {
    if (typeof progressSink.current === 'function') progressSink.current(fraction);
  }, [fraction]);
  const tally = useRef({ correct: 0, total: 0 });
  const reported = useRef(false);
  // { [microOutputId]: submitted } — reported with the step so a Check proof by micro-output
  // (SCHEMA §8 Check.proofs[].microOutput) can tick when the learner's own output was sent
  const microDone = useRef({});
  const [readAloudDone, setReadAloudDone] = useState(false);

  if (!step) return null;
  const seg = segments[segIdx] || segments[segments.length - 1];
  const nr = stepNr(step.id);

  const attempt = (p) => { if (typeof onAttempt === 'function') onAttempt({ ...p, stepId: step.id }); };
  const count = (r) => {
    if (!r) return;
    tally.current.correct += r.correct || 0;
    tally.current.total += r.total || 0;
  };
  const finishStep = (extra = {}) => {
    if (reported.current) return;
    reported.current = true;
    const micro = Object.keys(microDone.current).length ? { microOutputs: { ...microDone.current } } : {};
    if (typeof onDone === 'function') onDone({ stepId: step.id, correct: tally.current.correct, total: tally.current.total, ...micro, ...extra });
  };
  // The next segment; the closing one ('end') finishes the step straight away — the player's
  // celebration is the „done" screen.
  const advance = () => {
    const to = Math.min(segAt.current + 1, last);
    setInner(0);
    if (to !== segAt.current && segments[to] && segments[to].id === 'end') { finishStep(); return; }
    setSegIdx(to);
  };
  // The player core's attempt of this step (unitPlan: pool steps and the Check): it seeds the
  // option order of non-exam choice items, so a repeat may reorder and a re-render never does.
  const drawAttempt = Number(step.plan && step.plan.attempt) || 1;
  const runProps = { unitId, lines, stepId: step.id, level, names, onProgress: setInner, attempt: drawAttempt, onAttempt: attempt };

  let body = null;
  if (seg.block) {
    const strategy = (step.strategyCards || []).find((c) => c.template === seg.block.template) || null;
    body = (
      <ExamBlockView
        key={seg.id}
        block={seg.block}
        unitId={unitId}
        stepId={step.id}
        level={level}
        texts={step.texts}
        strategy={strategy}
        lines={lines}
        names={names}
        onAttempt={attempt}
        onDone={(r) => { count(r); advance(); }}
      />
    );
  } else switch (seg.id) {
    case 'warmup':
      body = <ItemRun key="warmup" items={warmupItems} {...runProps} onFinish={advance} />;
      break;
    case 'input':
      body = (
        <>
          <InputView input={step.input} unitId={unitId} names={names} />
          <NextBar onNext={advance} label={t('item.next')} />
        </>
      );
      break;
    case 'inputBlock':
      body = (
        <ExamBlockView
          key="inputBlock"
          block={step.examBlock}
          unitId={unitId}
          stepId={step.id}
          level={level}
          texts={step.texts}
          lines={lines}
          names={names}
          onAttempt={attempt}
          onDone={(r) => { count(r); advance(); }}
        />
      );
      break;
    case 'inputItems':
      body = <ItemRun key="inputItems" items={step.inputItems} {...runProps} onFinish={(r) => { count(r); advance(); }} />;
      break;
    case 'form':
      body = (
        <>
          <RuleCardView card={ruleCard} modelSentence={step.modelSentence} />
          {!ruleCard && step.ruleCard && <p className="mt-2 text-[0.875rem] text-game-muted">{t('rule.missing')}</p>}
          <NextBar onNext={advance} label={t('item.next')} />
        </>
      );
      break;
    case 'structured':
      body = <ItemRun key="structured" items={step.structuredInput} {...runProps} onFinish={(r) => { count(r); advance(); }} />;
      break;
    case 'practice':
      body = (
        <ItemRun
          key="practice"
          items={pool.served}
          requeue
          requeuePool={pool.spare}
          ruleCard={ruleCard}
          {...runProps}
          onFinish={(r) => { count(r); advance(); }}
        />
      );
      break;
    case 'aussprache':
      body = (
        <div>
          <div className="rounded-[1.25rem] border-2 border-game-line bg-course-wash p-4">
            <p className={LABEL}>{t('aus.focus')}</p>
            <p className="mt-1 text-[1.125rem] font-extrabold text-course-ink" lang="de">{step.aussprache.focus}</p>
          </div>
          <AusspracheRun
            key="aussprache"
            perception={perception}
            readAloud={step.aussprache.readAloud}
            runProps={runProps}
            readAloudDone={readAloudDone}
            setReadAloudDone={setReadAloudDone}
            t={t}
            onFinish={(r) => { count(r); advance(); }}
          />
        </div>
      );
      break;
    case 'micro':
      body = (
        <MicroOutputView
          key="micro"
          mo={step.microOutput}
          level={level}
          onDone={(r) => { if (step.microOutput?.id) microDone.current[step.microOutput.id] = !!(r && r.submitted); advance(); }}
        />
      );
      break;
    case 'exit':
      body = <ItemRun key="exit" items={pool.exit} {...runProps} onFinish={(r) => { count(r); advance(); }} />;
      break;
    case 'table':
      body = (
        <>
          <RuleTableFill table={step.ruleTable} stepId={step.id} onAttempt={attempt} onDone={count} />
          <NextBar onNext={advance} label={t('item.next')} />
        </>
      );
      break;
    case 'cloze':
      body = <ItemRun key="cloze" items={step.cloze} {...runProps} onFinish={(r) => { count(r); advance(); }} />;
      break;
    case 'redemittel':
      body = (
        <>
          <div className={PANEL}>
            <p className={LABEL}>{t('seg.redemittel')}</p>
            <ul className="mt-3 space-y-2.5">
              {redemittel.map((r) => (
                <li key={r.id} className="border-t-2 border-game-line pt-2.5 first:border-t-0 first:pt-0">
                  <p className="text-[1.0625rem] font-extrabold text-game-text" lang="de">{r.de}</p>
                  <p className="text-[0.875rem] font-semibold text-game-muted">{lang === 'de' ? r.function : r.en}</p>
                </li>
              ))}
            </ul>
          </div>
          <NextBar onNext={advance} label={t('item.next')} />
        </>
      );
      break;
    case 'sprechen':
      body = <SpeakingTaskView task={step.task} level={level} onDone={(r) => finishStep({ correct: 0, total: 0, submitted: !!r?.submitted, bankKey: r?.bankKey || step.task?.bankKey || null })} />;
      break;
    case 'schreiben':
      body = (
        <WritingTaskView
          task={step.task}
          level={level}
          stepId={step.id}
          skeleton={skeleton}
          mode="write"
          onAttempt={attempt}
          onDone={(r) => finishStep({ correct: 0, total: 0, submitted: !!r?.submitted, bankKey: r?.bankKey || step.task?.bankKey || null })}
        />
      );
      break;
    case 'ueberarbeiten': {
      const task = (unit?.steps || []).find((s) => s.kind === 'schreiben' && s.task && s.task.bankKey === step.of)?.task || null;
      body = task ? (
        <WritingTaskView
          task={task}
          level={level}
          stepId={step.id}
          skeleton={skeleton}
          mode="revise"
          onAttempt={attempt}
          onDone={(r) => finishStep({ correct: 0, total: 0, submitted: !!r?.submitted, bankKey: step.of, revision: true })}
        />
      ) : (
        <p className="text-[0.9375rem] text-game-muted">{t('step.unknown')}</p>
      );
      break;
    }
    case 'check':
      body = (
        <CheckView
          unit={unit}
          level={level}
          stepId={step.id}
          endLine={step.endLine}
          earlierItems={earlierItems || planEarlier(step.plan)}
          attempt={drawAttempt}
          aufgaben={aufgaben}
          microOutputs={microOutputs}
          course={course}
          canDos={canDos}
          ruleCards={cards}
          lines={lines}
          names={names}
          onAttempt={attempt}
          onProgress={setInner}
          onDone={(r) => { count(r); finishStep(r && r.proofs ? { proofs: r.proofs, proofItems: r.proofItems || null } : {}); }}
        />
      );
      break;
    case 'end':
      // reached only by a step with nothing before its close (advance() reports the others)
      body = (
        <div className={PANEL}>
          <p className="text-[1.375rem] font-extrabold text-game-text">{t('step.done')}</p>
          {tally.current.total > 0 && (
            <p className="mt-2 text-[1rem] font-semibold text-game-text">{t('step.result', { c: tally.current.correct, t: tally.current.total })}</p>
          )}
          {step.endLine && <p className="mt-3 text-[1.0625rem] font-semibold leading-relaxed text-game-text" lang="de">{step.endLine}</p>}
          <div className="mt-6">
            <GameButton onClick={() => finishStep()}>{t('step.next')}</GameButton>
          </div>
        </div>
      );
      break;
    default:
      body = (
        <>
          <p className="text-[0.9375rem] text-game-muted">{t('step.unknown')}</p>
          <NextBar onNext={() => finishStep()} label={t('item.next')} />
        </>
      );
  }

  const stepTitle = step.title || (step.kind === 'sprechen' ? 'Sprechen' : step.kind === 'schreiben' ? 'Schreiben' : step.kind === 'ueberarbeiten' ? t('step.ueberarbeiten') : step.kind === 'check' ? t('check.title') : step.kind === 'pruefung' ? t('seg.exam') : '');

  return (
    <section className="mx-auto w-full max-w-2xl" data-step-id={step.id} data-step-kind={step.kind}>
      <header className="mb-5">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-extrabold text-game-muted hover:text-course-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('step.back')}
          </button>
        )}
        <p className="flex flex-wrap items-center gap-x-2 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">
          {nr != null && <span>{t('seg.step', { n: nr })}</span>}
          {nr != null && seg.label && <span aria-hidden="true">·</span>}
          {seg.label && <span>{t(seg.label)}</span>}
        </p>
        {stepTitle && (
          <h1 className="mt-1 text-[1.125rem] font-extrabold leading-tight text-game-muted [hyphens:auto] sm:text-[1.25rem]" lang="de">
            {stepTitle}
          </h1>
        )}
      </header>
      <div key={seg.id}>{body}</div>
    </section>
  );
}

/** The Check's earlier-unit items as the player core's plan drew them (plan.items minus the unit's own). */
function planEarlier(plan) {
  if (!plan || !Array.isArray(plan.items)) return [];
  const ids = new Set(plan.earlierIds || []);
  return plan.items.filter((it) => it && ids.has(it.id));
}

function NextBar({ onNext, label }) {
  return (
    <div className="mt-8">
      <GameButton onClick={onNext}>{label}</GameButton>
    </div>
  );
}

/** Aussprache: the perception items (≥ 4 voices once recorded), then the read-aloud of the model sentence. */
function AusspracheRun({ perception, readAloud, runProps, readAloudDone, setReadAloudDone, t, onFinish }) {
  const [phase, setPhase] = useState(perception.length ? 'perception' : 'read');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  if (phase === 'perception') {
    return (
      <div className="mt-4">
        <ItemRun items={perception} {...runProps} onFinish={(r) => { setScore(r); setPhase(readAloud?.lineDe ? 'read' : 'done'); if (!readAloud?.lineDe) onFinish(r); }} />
      </div>
    );
  }
  if (phase === 'read' && readAloud?.lineDe) {
    return (
      <div className="mt-4">
        <p className="mb-3 text-[1.125rem] font-extrabold text-game-text">{t('aus.readAloud')}</p>
        <ReadAloudLine
          lektionId={runProps.unitId}
          lineKey={`${runProps.stepId}-readaloud`}
          text={readAloud.lineDe}
          onResult={() => setReadAloudDone(true)}
        />
        <NextBar onNext={() => onFinish(score)} label={readAloudDone ? t('item.next') : t('mo.skip')} />
      </div>
    );
  }
  return <NextBar onNext={() => onFinish(score)} label={t('item.next')} />;
}
