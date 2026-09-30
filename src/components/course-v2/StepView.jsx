import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReadAloudLine from '../lesson/ReadAloudLine.jsx';
import CheckView from './CheckView.jsx';
import ExamBlockView from './ExamBlockView.jsx';
import GameButton, { QuietButton } from './GameButton.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import { RuleCardSteps, RuleTableFill } from './RuleCardView.jsx';
import SpeakingTaskView from './SpeakingTaskView.jsx';
import StepScreen from './StepScreen.jsx';
import StoryInput from './StoryInput.jsx';
import WordCards, { PhraseCards } from './WordCards.jsx';
import WritingTaskView from './WritingTaskView.jsx';
import { SayButton } from './WordList.jsx';
import { laneLabel, lineIndex, materialize, skeletonOf, teilLabel } from './content.js';
import { chapterSections, sectionOf, stepWords } from './kapitel.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';
const SERVED_MAX = 12;
const EXIT_COUNT = 3;
// the „Neue Wörter" box before the input: the unit's words its text uses, when there are enough
const MIN_WORDS = 3;

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
    if (extras.words && extras.words.length >= MIN_WORDS) segs.push({ id: 'words', label: 'stage.words' });
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
 *
 * One thing per screen (owner feedback 2026-09-30: "it looks intimidating and too much … make it
 * in duolingo style and for everything to be step for step"). No stage strip, no numbered Lehrwerk
 * heading: each screen has ONE short instruction as its heading and its one action in the bottom
 * bar (StepScreen / StickyAction — where an item screen has „Prüfen", so the button never jumps).
 * The section stays for screen readers as the step's sr-only h1 („Teil A: Ich bin Priya. Und Sie?").
 *   words       „Neues Wort" — one flashcard per word (WordCards), the unit's words
 *               (`unit.lexicon`) its input uses
 *   input       the Story (StoryInput): text chunk by chunk · the unaided listen · the lines one
 *               at a time, each with its speaker and its voice
 *   form        „Grammatik-Tipp", then „Auf einen Blick" (RuleCardSteps)
 *   redemittel  „Nützliche Sätze" — one phrase per screen (PhraseCards)
 *   aussprache  „Genau hinhören" (the focus), the perception items, „Sprechen Sie nach"
 *   items       ItemRun — every item brings its own instruction; no heading above it
 * The segments and their order are segmentsFor's; a stepped segment feeds the step's progress
 * bar per screen (`setInner`) the way ItemRun does per item. The whole Kapitel stays one tap deep:
 * the Kapitel page and /course/:level/grammatik and /wortschatz.
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
  const [, t] = useV2Strings();
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

  // The words of the „Neue Wörter" cards, fixed when the step opens (a list arriving later must never
  // shift the segments under the learner).
  const [words] = useState(() => (step && (step.kind === 'situation' || step.kind === 'text') ? stepWords(step, unit && unit.lexicon) : []));
  const segments = useMemo(
    () => (step ? segmentsFor(step, { pool, warmupItems, redemittel, words }) : []),
    [step, pool, warmupItems, redemittel, words],
  );
  // this step's section (letter, grammar): the sr-only context line and the grammar's name
  const section = useMemo(() => (step ? sectionOf(chapterSections(unit, course), step.id) : null), [unit, course, step]);
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
  // every segment opens at the top of the page (a long story leaves the page scrolled down)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [segIdx]);

  if (!step) return null;
  const seg = segments[segIdx] || segments[segments.length - 1];

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
    case 'words':
      body = <WordCards key="words" words={words} unitId={unitId} onProgress={setInner} onDone={advance} />;
      break;
    case 'input':
      body = <StoryInput key="input" input={step.input} unitId={unitId} names={names} onProgress={setInner} onDone={advance} />;
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
        <RuleCardSteps
          key="form"
          card={ruleCard}
          modelSentence={step.modelSentence}
          title={(section && section.grammar && section.grammar.short) || null}
          missing={!ruleCard && Boolean(step.ruleCard)}
          unitId={unitId}
          onProgress={setInner}
          onDone={advance}
        />
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
        <AusspracheRun
          key="aussprache"
          focus={step.aussprache.focus}
          perception={perception}
          readAloud={step.aussprache.readAloud}
          runProps={runProps}
          readAloudDone={readAloudDone}
          setReadAloudDone={setReadAloudDone}
          t={t}
          onFinish={(r) => { count(r); advance(); }}
        />
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
      body = <RuleTableFill table={step.ruleTable} stepId={step.id} onAttempt={attempt} onDone={count} onNext={advance} />;
      break;
    case 'cloze':
      body = <ItemRun key="cloze" items={step.cloze} {...runProps} onFinish={(r) => { count(r); advance(); }} />;
      break;
    case 'redemittel':
      body = <PhraseCards key="redemittel" phrases={redemittel} unitId={unitId} onProgress={setInner} onDone={advance} />;
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
        <StepScreen action={<GameButton onClick={() => finishStep()}>{t('step.next')}</GameButton>}>
          <div className={PANEL}>
            <p className="text-[1.375rem] font-extrabold text-game-text">{t('step.done')}</p>
            {tally.current.total > 0 && (
              <p className="mt-2 text-[1rem] font-semibold text-game-text">{t('step.result', { c: tally.current.correct, t: tally.current.total })}</p>
            )}
            {step.endLine && <p className="mt-3 text-[1.0625rem] font-semibold leading-relaxed text-game-text" lang="de">{step.endLine}</p>}
          </div>
        </StepScreen>
      );
      break;
    default:
      body = (
        <StepScreen action={<GameButton onClick={() => finishStep()}>{t('item.next')}</GameButton>}>
          <p className="text-[0.9375rem] text-game-muted">{t('step.unknown')}</p>
        </StepScreen>
      );
  }

  // ── the frame: the section for screen readers, ONE short heading where the screen has none ──
  const letter = (section && section.letter) || null;
  const kindName = { pruefung: t('kap.pruefung'), sprechen: t('kap.sprechen'), schreiben: t('kap.schreiben'), ueberarbeiten: t('kap.ueberarbeiten'), check: t('kap.test') }[step.kind] || null;
  const lane = unit && unit.spec && unit.spec.lanes && unit.spec.lanes.primary ? laneLabel(unit.spec.lanes.primary) : null;
  const context = letter
    ? `${t('kap.part', { l: letter })}${step.title ? `: ${step.title}` : ''}`
    : [unit && unit.nr ? t('player.unit', { n: unit.nr }) : null, kindName, ['pruefung', 'sprechen', 'schreiben'].includes(step.kind) ? lane : null].filter(Boolean).join(' · ');
  // The stepped screens (words, input, form, redemittel, aussprache, table's Prüfen, end) and the
  // item runs carry their own instruction; these segments get theirs from here.
  const SCREEN_TITLE = {
    inputBlock: () => (step.examBlock ? teilLabel(step.examBlock.template) : null),
    micro: () => t('card.yourTurn'),
    table: () => t('rule.fillTable'),
    sprechen: () => t('kap.sprechen'),
    schreiben: () => t('kap.schreiben'),
    ueberarbeiten: () => t('kap.ueberarbeiten'),
    check: () => t('kap.test'),
  };
  const OWN_TITLE = ['warmup', 'words', 'input', 'inputItems', 'form', 'structured', 'practice', 'aussprache', 'redemittel', 'cloze', 'exit', 'end'];
  const screenTitle = seg.block
    ? teilLabel(seg.block.template)
    : SCREEN_TITLE[seg.id] ? SCREEN_TITLE[seg.id]() : OWN_TITLE.includes(seg.id) ? null : step.title || null;

  return (
    <section className="mx-auto w-full max-w-2xl" data-step-id={step.id} data-step-kind={step.kind} data-segment={seg.id}>
      {onBack && (
        <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-extrabold text-game-muted hover:text-course-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('step.back')}
        </button>
      )}
      {context && <h1 className="sr-only" lang={letter ? 'de' : undefined}>{context}</h1>}
      {screenTitle && <h2 className="mb-5 text-[1.5rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[1.625rem]">{screenTitle}</h2>}
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

/**
 * Aussprache, one thing per screen: „Genau hinhören" — the focus on a clean card, its sounds on a
 * speaker key — then the perception items (≥ 4 voices once recorded), then „Sprechen Sie nach", the
 * read-aloud of the model sentence. `onFinish({ correct, total })` with the perception score.
 */
function AusspracheRun({ focus, perception, readAloud, runProps, readAloudDone, setReadAloudDone, t, onFinish }) {
  const [phase, setPhase] = useState('focus');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const report = runProps.onProgress;
  const hasRead = Boolean(readAloud && readAloud.lineDe);
  useEffect(() => {
    if (typeof report !== 'function') return;
    if (phase === 'focus') report(0);
    else if (phase === 'read') report(0.9);
  }, [phase, report]);
  const afterFocus = () => {
    if (perception.length) setPhase('perception');
    else if (hasRead) setPhase('read');
    else onFinish(score);
  };
  if (phase === 'focus') {
    const text = String(focus || '');
    const cut = text.indexOf(':');
    const head = cut > 0 ? text.slice(0, cut).trim() : text;
    const sounds = cut > 0 ? text.slice(cut + 1).trim() : '';
    return (
      <StepScreen title={t('card.pronounce')} action={<GameButton onClick={afterFocus}>{t('item.next')}</GameButton>}>
        <div className="flex flex-col items-center rounded-[1.5rem] border-2 border-b-4 border-game-line bg-white px-5 py-7 text-center">
          <p className={LABEL}>{t('aus.focus')}</p>
          <p className="mt-2 text-[1.25rem] font-extrabold leading-snug text-course-ink" lang="de">{head}</p>
          {sounds && <p className="mt-4 text-[1.75rem] font-extrabold leading-snug text-game-text [hyphens:auto]" lang="de">{sounds}</p>}
          {sounds && (
            <div className="mt-5">
              <SayButton unitId={runProps.unitId} id={`${runProps.stepId}-focus`} text={sounds} label={t('card.hearFocus')} />
            </div>
          )}
        </div>
      </StepScreen>
    );
  }
  if (phase === 'perception') {
    return (
      <ItemRun
        items={perception}
        {...runProps}
        onProgress={(f) => { if (typeof report === 'function') report(0.1 + 0.75 * f); }}
        onFinish={(r) => { setScore(r); if (hasRead) setPhase('read'); else onFinish(r); }}
      />
    );
  }
  if (phase === 'read' && hasRead) {
    return (
      <StepScreen
        title={t('card.sayIt')}
        action={readAloudDone
          ? <GameButton onClick={() => onFinish(score)}>{t('item.next')}</GameButton>
          : <QuietButton onClick={() => onFinish(score)}>{t('mo.skip')}</QuietButton>}
      >
        <p className="text-[1.0625rem] font-semibold leading-snug text-game-muted">{t('aus.readAloud')}</p>
        <div className="mt-4">
          <ReadAloudLine
            lektionId={runProps.unitId}
            lineKey={`${runProps.stepId}-readaloud`}
            text={readAloud.lineDe}
            onResult={() => setReadAloudDone(true)}
          />
        </div>
      </StepScreen>
    );
  }
  return <StepScreen action={<GameButton onClick={() => onFinish(score)}>{t('item.next')}</GameButton>}>{null}</StepScreen>;
}
