import { useMemo, useState } from 'react';
import { ChevronDown, Mic } from 'lucide-react';
import CastAvatar from './CastAvatar.jsx';
import GameButton from './GameButton.jsx';
import { SpeechBubble, StickyAction } from './GameParts.jsx';
import InputView from './InputView.jsx';
import ItemView from './ItemView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import UnitIntro from './UnitIntro.jsx';
import { canDoTexts, canPlay, laneLabel, lineIndex, teilLabel } from './content.js';
import { cardTitle, cardsByIds, tocRows, unitCardIds, unitWordGroups } from './kapitel.js';
import { introBubble, narratorOf } from './story.js';
import { XP } from '../../lib/course-v2/gamify.js';
import { useV2Strings } from './strings.js';

/**
 * StartView({ unit, level, onDone }) — the Start slot that opens a unit (SCHEMA §8 Start,
 * BLUEPRINT §3.1 / §3.2, §7.3 S2), soft (owner feedback 2026-09-29: the unit used to open
 * with a speaking test before anything was taught):
 *
 *   1. the INTRO (UnitIntro): the narrator's speech bubble („Was bisher geschah" / the story's
 *      opening), „Heute lernen Sie" (3–5 can-dos in our own wording), a meta row, ONE „Los
 *      geht's"; the Prüfungsfokus folded in a small line; „Test machen und überspringen" (the
 *      test-out, when offered) as a quiet text button;
 *   2. the serial EPISODE (listen first, transcript after; its optional `folge.glosses` are
 *      tappable like an input's) with its one gist item — the first, friendly interaction;
 *   3. the Auftakt's spoken micro-output, when the unit has one, as an OPTIONAL folded
 *      „Bonus: Schon mal probieren?" card — never required, never a gate.
 *
 * onDone({ stepId, correct, total, testOut }) once. „Test machen und überspringen" runs the
 * test-out here — the unit's Lektions-Check items plus its proof items (BLUEPRINT §3.5) — and
 * reports `testOut: { correct, total }`; the player decides with `testOutPassed()` (≥ 80 %
 * credits the practice steps, the two Aufgaben stay open). Without the test-out `testOut` is null.
 * Optional: onAttempt (every answered item), course (manifest: can-do wording, minutes),
 * canDos, names.
 *
 * `chapter` (the player's, optional) makes the intro THE KAPITEL PAGE (UnitIntro.jsx) — the unit's
 * front page when it opens fresh AND its resume screen:
 *   finished      [stepId] — the finished steps (the table of contents ticks them)
 *   currentIndex  the step „Weiter" opens (-1 on a fresh unit: „Kapitel starten" opens the Einstieg)
 *   resume        true on the resume screen
 *   proven        { canDoId: bool } — the can-dos proven so far (ticked)
 *   onOpen(i)     open step i (i ≥ steps.length: the summary) — a row of the table of contents
 * The Einstieg row always opens the Folge here, so the resume screen reaches it in one tap.
 */
export default function StartView({ unit, level, onDone, onAttempt, course = null, canDos = null, names = null, chapter = null }) {
  const [, t] = useV2Strings();
  const start = unit?.start || {};
  const lines = useMemo(() => lineIndex(unit), [unit]);
  const goals = useMemo(() => canDoTexts(unit, course, canDos), [unit, course, canDos]);
  const [stage, setStage] = useState('intro'); // intro | folge | bonus
  const [heard, setHeard] = useState(false);
  const [gist, setGist] = useState(null);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const stepId = unit ? `${unit.id}-start` : 'start';

  if (!unit) return null;
  const gistItem = start.folge?.gistItem || null;
  const folge = start.folge || null;
  // the Folge's own tap glosses (SCHEMA §8 Start, optional): a word it uses before its unit glosses it
  const folgeGlosses = Array.isArray(folge?.glosses) ? folge.glosses : [];
  const auftakt = start.auftakt && start.auftakt.microOutput ? start.auftakt : null;
  const narrator = narratorOf(unit, level, names);

  const finish = (testOut) => {
    if (typeof onDone === 'function') {
      onDone({ stepId, correct: gist && gist.correct ? 1 : 0, total: gist ? 1 : 0, testOut: testOut || null });
    }
  };
  const top = () => { if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' }); };
  const toBonusOrSteps = () => {
    if (auftakt) { setStage('bonus'); top(); } else finish(false);
  };
  const begin = () => {
    if (folge) { setStage('folge'); top(); } else toBonusOrSteps();
  };

  const testItems = [...(unit.check?.items || []), ...(unit.check?.proofItems || [])];
  if (testing && testItems.length) {
    return (
      <section className="mx-auto w-full max-w-2xl" data-step-id={`${stepId}-testout`}>
        <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">{t('start.testOut')}</p>
        <p className="mb-5 mt-1 text-[1rem] font-semibold text-game-muted">{t('start.testOutLead')}</p>
        <ItemRun
          key="testout"
          items={testItems}
          unitId={unit.id}
          lines={lines}
          names={names}
          stepId={`${stepId}-testout`}
          level={level}
          onAttempt={onAttempt}
          onFinish={(r) => finish({ correct: r.correct, total: r.total })}
        />
      </section>
    );
  }

  if (stage === 'intro') {
    const steps = Array.isArray(unit.steps) ? unit.steps : [];
    const byStep = unit.minutesPlanned && unit.minutesPlanned.byStep ? Object.values(unit.minutesPlanned.byStep).map(Number).filter(Boolean) : [];
    const perStep = byStep.length ? Math.round(byStep.reduce((a, b) => a + b, 0) / byStep.length) : 0;
    const chips = Array.isArray(start.pruefungsfokusChips) ? start.pruefungsfokusChips.map((tpl) => teilLabel(tpl)) : [];
    const lane = unit.spec?.lanes?.primary ? laneLabel(unit.spec.lanes.primary) : null;
    // the Kapitel page: the table of contents with the learner's state, the back matter
    const finishedIds = new Set((chapter && chapter.finished) || []);
    const resume = Boolean(chapter && chapter.resume);
    const currentIndex = chapter && Number.isInteger(chapter.currentIndex) ? chapter.currentIndex : -1;
    const rows = tocRows({ unit, course, finished: finishedIds, currentIndex });
    const doneCount = rows.filter((r) => r.state === 'done').length;
    const allDone = rows.length > 0 && doneCount === rows.length;
    const next = resume && !allDone ? rows[currentIndex] || rows.find((r) => r.state !== 'done') || null : null;
    const open = (i) => { if (chapter && typeof chapter.onOpen === 'function') chapter.onOpen(i); else finish(null); };
    const nextName = (r) => (r.kind === 'check' ? t('kap.test') : r.kind === 'pruefung' ? t('kap.pruefung') : r.kind === 'sprechen' ? t('kap.sprechen') : r.kind === 'schreiben' ? t('kap.schreiben') : r.title || '');
    const primaryLabel = !resume ? t('kap.start') : next ? (next.letter ? t('kap.continuePart', { l: next.letter }) : t('kap.continueWith', { name: nextName(next) })) : t('kap.toSummary');
    const onPrimary = !resume ? begin : () => open(next ? next.index : steps.length);
    const proven = (chapter && chapter.proven) || {};
    const goalList = Object.entries(goals).map(([id, text]) => ({ text, done: proven[id] === true }));
    const cards = cardsByIds(unitCardIds(unit), unit.ruleCards).map((card) => ({ card, title: cardTitle(unit, course, card.id) }));
    // the unit's own words, which the player puts on the unit (`unit.lexicon`, additive)
    const lexicon = Array.isArray(unit.lexicon) ? unit.lexicon : [];
    const lernschritteOpen = rows.some((r) => r.state !== 'done' && ['situation', 'text', 'sprache', 'pruefung'].includes(r.kind));
    return (
      <section className="mx-auto w-full max-w-2xl" data-step-id={stepId}>
        <UnitIntro
          eyebrow={[String(unit.level || level || '').toUpperCase(), unit.etappe ? t('kap.module', { m: unit.etappe }) : null].filter(Boolean).join(' · ')}
          title={unit.title?.de}
          narrator={narrator}
          bubble={resume ? t('player.welcomeTitle') : introBubble(unit)}
          bubbleNote={resume ? t('kap.progress', { d: doneCount, t: rows.length }) : null}
          goals={goalList}
          stepCount={steps.length}
          perStepMinutes={perStep}
          totalMinutes={Number(unit.minutesPlanned && unit.minutesPlanned.total) || 0}
          xp={steps.length * XP.step + XP.unit}
          examFocus={lane && chips.length ? [lane, ...chips] : chips}
          onStart={onPrimary}
          primaryLabel={primaryLabel}
          onTestOut={start.testOut?.offered && lernschritteOpen ? () => { if (testItems.length) { setTesting(true); top(); } else finish(null); } : null}
          nr={unit.nr}
          level={unit.level || level}
          unitId={unit.id}
          lane={unit.spec?.lanes?.primary || null}
          rows={rows}
          intro={folge ? { nr: unit.nr, title: folge.title || null, state: !resume ? 'current' : 'open' } : null}
          onOpenRow={open}
          onOpenIntro={begin}
          cards={cards}
          wordGroups={unitWordGroups(unit, lexicon)}
          redemittel={Array.isArray(unit.redemittel) ? unit.redemittel : []}
          referenceOpen={allDone}
        />
      </section>
    );
  }

  if (stage === 'bonus' && auftakt) {
    return (
      <section className={`mx-auto w-full max-w-2xl ${bonusOpen ? '' : 'pb-32 sm:pb-0'}`} data-step-id={stepId}>
        <div className="flex items-end gap-3">
          <CastAvatar name={narrator} size={84} className="shrink-0" />
          <SpeechBubble tail="left" className="min-w-0 flex-1">
            <p className="text-[1.125rem] font-bold leading-snug text-game-text">{t('start.bonusBubble')}</p>
          </SpeechBubble>
        </div>
        <div className="mt-6 rounded-[1.25rem] border-2 border-dashed border-game-line bg-white">
          <button
            type="button"
            onClick={() => setBonusOpen((o) => !o)}
            aria-expanded={bonusOpen}
            aria-controls={`${stepId}-bonus`}
            className="flex min-h-14 w-full items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left hover:bg-course-wash"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-game-xp-wash text-game-xp-ink">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.0625rem] font-extrabold text-game-text">{t('start.bonus')}</span>
              <span className="block text-[0.875rem] font-semibold text-game-muted">{t('start.bonusLead')}</span>
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-game-muted transition-transform motion-reduce:transition-none ${bonusOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {bonusOpen && (
            <div id={`${stepId}-bonus`} className="border-t-2 border-dashed border-game-line p-4">
              {auftakt.promptDe && <p className="mb-3 text-[1.125rem] font-extrabold text-game-text" lang="de">{auftakt.promptDe}</p>}
              <MicroOutputView mo={auftakt.microOutput} level={level} onDone={() => finish(false)} />
            </div>
          )}
        </div>
        {!bonusOpen && (
          <StickyAction>
            <GameButton onClick={() => finish(false)}>{t('start.toSteps')}</GameButton>
          </StickyAction>
        )}
      </section>
    );
  }

  // the episode: listen first, the transcript after, then its one gist question
  const folgeLines = (folge && folge.lines) || [];
  const canListen = folgeLines.length > 0 && canPlay(unit.id, folgeLines[0].id);
  const showGist = heard || !canListen;
  return (
    <section className={`mx-auto w-full max-w-2xl ${showGist && !gistItem ? 'pb-32 sm:pb-0' : ''}`} data-step-id={stepId}>
      <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">{t('kap.intro')} · {t('kap.episode', { n: unit.nr })}</p>
      {folge && (
        <div className="mt-1">
          <InputView
            input={{ title: folge.title, lines: folge.lines || [], glosses: folgeGlosses, transcriptAfterUnaidedListen: true }}
            unitId={unit.id}
            names={names}
            onHeard={() => setHeard(true)}
          />
        </div>
      )}
      {gistItem && showGist && (
        <div className="mt-8 border-t-2 border-game-line pt-6">
          <ItemView
            item={gistItem}
            level={level}
            stepId={stepId}
            unitId={unit.id}
            lines={lines}
            names={names}
            onResult={(p) => { setGist(p); if (typeof onAttempt === 'function') onAttempt(p); }}
            onNext={toBonusOrSteps}
          />
        </div>
      )}
      {!gistItem && showGist && (
        <StickyAction>
          <GameButton onClick={toBonusOrSteps}>{t('item.next')}</GameButton>
        </StickyAction>
      )}
    </section>
  );
}
