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
 */
export default function StartView({ unit, level, onDone, onAttempt, course = null, canDos = null, names = null }) {
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
    return (
      <section className="mx-auto w-full max-w-2xl" data-step-id={stepId}>
        <UnitIntro
          eyebrow={`${String(unit.level || level || '').toUpperCase()} · ${t('player.unit', { n: unit.nr })}`}
          title={unit.title?.de}
          narrator={narrator}
          bubble={introBubble(unit)}
          goals={Object.values(goals)}
          stepCount={steps.length}
          perStepMinutes={perStep}
          xp={steps.length * XP.step + XP.unit}
          examFocus={lane && chips.length ? [lane, ...chips] : chips}
          onStart={begin}
          onTestOut={start.testOut?.offered ? () => { if (testItems.length) { setTesting(true); top(); } else finish(null); } : null}
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
      <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">{t('start.episode')}</p>
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
