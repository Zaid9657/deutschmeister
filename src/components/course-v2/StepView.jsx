import { useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ReadAloudLine from '../lesson/ReadAloudLine.jsx';
import CheckView from './CheckView.jsx';
import ExamBlockView from './ExamBlockView.jsx';
import InputView from './InputView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import RuleCardView, { RuleTableFill } from './RuleCardView.jsx';
import SpeakingTaskView from './SpeakingTaskView.jsx';
import WritingTaskView from './WritingTaskView.jsx';
import { lineIndex, materialize, minutesOf, skeletonOf, stepNr } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';
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
 *                                                    (the Check adds `proofs`: { canDoId: proven })
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
  names = null,
  canDos = null,
  onBack = null,
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
  const tally = useRef({ correct: 0, total: 0 });
  const reported = useRef(false);
  const [readAloudDone, setReadAloudDone] = useState(false);

  if (!step) return null;
  const seg = segments[segIdx] || segments[segments.length - 1];
  const nr = stepNr(step.id);
  const minutes = minutesOf(unit, step.id);

  const attempt = (p) => { if (typeof onAttempt === 'function') onAttempt({ ...p, stepId: step.id }); };
  const count = (r) => {
    if (!r) return;
    tally.current.correct += r.correct || 0;
    tally.current.total += r.total || 0;
  };
  const advance = () => setSegIdx((i) => Math.min(i + 1, segments.length - 1));
  const finishStep = (extra = {}) => {
    if (reported.current) return;
    reported.current = true;
    if (typeof onDone === 'function') onDone({ stepId: step.id, correct: tally.current.correct, total: tally.current.total, ...extra });
  };
  const runProps = { unitId, lines, stepId: step.id, level, names, onAttempt: attempt };

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
          {!ruleCard && step.ruleCard && <p className="mt-2 text-[0.8125rem] text-graphite">{t('rule.missing')}</p>}
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
          <Card tone="sunk" className="p-4">
            <p className={LABEL}>{t('aus.focus')}</p>
            <p className="mt-1 text-[1rem] font-bold text-ink" lang="de">{step.aussprache.focus}</p>
          </Card>
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
      body = <MicroOutputView key="micro" mo={step.microOutput} level={level} onDone={advance} />;
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
          <Card className="p-5">
            <p className={LABEL}>{t('seg.redemittel')}</p>
            <ul className="mt-3 space-y-2">
              {redemittel.map((r) => (
                <li key={r.id} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">
                  <p className="text-[1rem] font-bold text-ink" lang="de">{r.de}</p>
                  <p className="text-[0.8125rem] text-graphite">{lang === 'de' ? r.function : r.en}</p>
                </li>
              ))}
            </ul>
          </Card>
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
        <p className="text-[0.9375rem] text-graphite">{t('step.unknown')}</p>
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
          aufgaben={aufgaben}
          course={course}
          canDos={canDos}
          ruleCards={cards}
          lines={lines}
          names={names}
          onAttempt={attempt}
          onDone={(r) => { count(r); finishStep(r && r.proofs ? { proofs: r.proofs } : {}); }}
        />
      );
      break;
    case 'end':
      body = (
        <Card tone="wash" className="p-5">
          <p className="font-display text-[1.375rem] font-semibold text-ink">{t('step.done')}</p>
          {tally.current.total > 0 && (
            <p className="mt-2 text-[0.9375rem] text-ink">{t('step.result', { c: tally.current.correct, t: tally.current.total })}</p>
          )}
          {step.endLine && <p className="mt-3 text-[1rem] leading-relaxed text-ink" lang="de">{step.endLine}</p>}
          <div className="mt-5 flex justify-end">
            <Button onClick={() => finishStep()} size="lg" className="w-full sm:w-auto">{t('step.next')}</Button>
          </div>
        </Card>
      );
      break;
    default:
      body = (
        <>
          <p className="text-[0.9375rem] text-graphite">{t('step.unknown')}</p>
          <NextBar onNext={() => finishStep()} label={t('item.next')} />
        </>
      );
  }

  const stepTitle = step.title || (step.kind === 'sprechen' ? 'Sprechen' : step.kind === 'schreiben' ? 'Schreiben' : step.kind === 'ueberarbeiten' ? t('step.ueberarbeiten') : step.kind === 'check' ? t('check.title') : step.kind === 'pruefung' ? t('seg.exam') : '');
  const multi = segments.length > 1;
  const progress = multi ? Math.round((segIdx / (segments.length - 1)) * 100) : null;

  return (
    <section className="mx-auto w-full max-w-2xl" data-step-id={step.id} data-step-kind={step.kind}>
      <header className="mb-5">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-graphite hover:text-siegel-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('step.back')}
          </button>
        )}
        <p className="flex flex-wrap items-center gap-x-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {nr != null && <span>{t('seg.step', { n: nr })}</span>}
          {seg.label && <span aria-hidden="true">·</span>}
          {seg.label && <span>{t(seg.label)}</span>}
          {minutes != null && <span className="font-normal normal-case tracking-normal text-graphite">{t('start.minutes', { n: minutes })}</span>}
        </p>
        {stepTitle && (
          <h1 className="mt-2 font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.018em] text-ink [hyphens:auto] sm:text-[1.75rem]" lang="de">
            {stepTitle}
          </h1>
        )}
        {progress != null && (
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-pill bg-paper-sunk"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-pill bg-accent-limette transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
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
    <div className="mt-6 flex justify-end border-t border-rule pt-4">
      <Button onClick={onNext} size="lg" className="w-full sm:w-auto">{label}</Button>
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
        <p className="mb-3 text-[0.9375rem] text-graphite">{t('aus.readAloud')}</p>
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
