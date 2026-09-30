import { useMemo, useState } from 'react';
import { ChevronDown, Mic } from 'lucide-react';
import CastAvatar from './CastAvatar.jsx';
import GameButton from './GameButton.jsx';
import { SpeechBubble, StickyAction } from './GameParts.jsx';
import InputView from './InputView.jsx';
import ItemView from './ItemView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import { StoryScreen } from './UnitIntro.jsx';
import { lineIndex, canPlay } from './content.js';
import { introBubble, narratorOf } from './story.js';
import { useV2Strings } from './strings.js';

/**
 * StartView({ unit, level, onDone }) — the Start slot that opens a unit (SCHEMA §8 Start,
 * BLUEPRINT §3.1 / §3.2, §7.3 S2), soft (owner feedback 2026-09-29: the unit used to open
 * with a speaking test before anything was taught) and — round 3 (owner 2026-09-30: "it looks
 * intimidating and too much … duolingo style … step for step") — ONE thing per screen:
 *
 *   1. the STORY screen (UnitIntro.jsx StoryScreen): the narrator, big, with the story's opening in
 *      one speech bubble (story.js introBubble: „Was bisher geschah" / the first sentence of the beat),
 *      one small line „Kapitel 1 · Hallo, ich bin Priya", ONE „Los geht's" — and, when the unit offers
 *      it, „Ich kann das schon – Test machen" as a quiet text button. No can-dos, no table of contents,
 *      no back matter: the textbook Kapitel page is the opt-in guide (`?view=guide`, the player's);
 *   2. the serial EPISODE (listen first, transcript after; its optional `folge.glosses` are
 *      tappable like an input's), then — one „Weiter" later, on its own screen — its one gist item:
 *      the first, friendly interaction;
 *   3. the Auftakt's spoken micro-output, when the unit has one, as an OPTIONAL folded
 *      „Bonus: Schon mal probieren?" card — never required, never a gate.
 *
 * onDone({ stepId, correct, total, testOut }) once. The test-out runs here — the unit's
 * Lektions-Check items plus its proof items (BLUEPRINT §3.5) — and reports `testOut: { correct,
 * total }`; the player decides with `testOutPassed()` (≥ 80 % credits the practice steps, the two
 * Aufgaben stay open). Without the test-out `testOut` is null.
 * Optional: onAttempt (every answered item), names, and `entry` — where the player opens the Start
 * from its guide: 'folge' (the Einstieg row: straight into the episode) or 'testout' (the guide's
 * test-out); null opens the story screen.
 */
export default function StartView({ unit, level, onDone, onAttempt, names = null, entry = null }) {
  const [, t] = useV2Strings();
  const start = unit?.start || {};
  const lines = useMemo(() => lineIndex(unit), [unit]);
  const [stage, setStage] = useState(() => (entry === 'folge' && start.folge ? 'folge' : 'intro')); // intro | folge | gist | bonus
  const [heard, setHeard] = useState(false);
  const [gist, setGist] = useState(null);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [testing, setTesting] = useState(() => entry === 'testout');
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
    // the story screen: one bubble, one button — the test-out, when offered, a quiet text button
    const testOut = start.testOut?.offered ? () => { if (testItems.length) { setTesting(true); top(); } else finish(null); } : null;
    return (
      <StoryScreen
        id={stepId}
        heading={<>{t('player.unit', { n: unit.nr })}{unit.title?.de ? <> · <span lang="de">{unit.title.de}</span></> : null}</>}
        narrator={narrator}
        bubble={introBubble(unit)}
        primaryLabel={t('flow.go')}
        onPrimary={begin}
        quietLabel={t('flow.testOut')}
        onQuiet={testOut}
      />
    );
  }

  if (stage === 'bonus' && auftakt) {
    return (
      <section className={`mx-auto w-full max-w-2xl ${bonusOpen ? '' : 'pb-32 sm:pb-0'}`} data-step-id={stepId}>
        {/* the narrator again, the story screen's way: bubble above, the face under it */}
        <div className="flex flex-col items-center pt-2 text-center">
          <SpeechBubble tail="down" className="w-full max-w-md">
            <p className="text-[1.3125rem] font-extrabold leading-snug text-game-text">{t('start.bonusBubble')}</p>
          </SpeechBubble>
          <CastAvatar name={narrator} size={112} className="mt-5 shrink-0 motion-safe:animate-pop-in" />
        </div>
        <div className="mt-8 rounded-[1.25rem] border-2 border-dashed border-game-line bg-white">
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

  const eyebrow = <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-course-ink">{t('kap.intro')} · {t('kap.episode', { n: unit.nr })}</p>;

  // the episode's one gist question, on its own screen (ItemView brings its own check bar)
  if (stage === 'gist' && gistItem) {
    return (
      <section className="mx-auto w-full max-w-2xl" data-step-id={stepId}>
        {eyebrow}
        <div className="mt-3">
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
      </section>
    );
  }

  // the episode: listen first, the transcript after — then ONE „Weiter" to its gist question. The bar
  // is always there and the button grey until the episode is heard (StoryInput's „not yet"), so the
  // opener reads like every other listen screen: one instruction, one action (WT-08).
  const folgeLines = (folge && folge.lines) || [];
  const canListen = folgeLines.length > 0 && canPlay(unit.id, folgeLines[0].id);
  const showNext = heard || !canListen;
  const toGist = () => { setStage('gist'); top(); };
  return (
    <section className="mx-auto w-full max-w-2xl pb-32 sm:pb-0" data-step-id={stepId}>
      {eyebrow}
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
      <StickyAction>
        <GameButton disabled={!showNext} onClick={gistItem ? toGist : toBonusOrSteps}>{t('item.next')}</GameButton>
      </StickyAction>
    </section>
  );
}
